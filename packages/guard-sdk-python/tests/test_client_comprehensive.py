import pytest
import time
from unittest.mock import Mock, patch, MagicMock
import requests

from replaysafe import ReplayGuard, EffectTimeoutError, EffectConflictError
from replaysafe.errors import EffectTimeoutError, EffectConflictError


class TestReplayGuardInit:
    def test_default_config(self):
        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        assert guard.config["monitorId"] == "m1"
        assert guard.config["apiKey"] == "k1"
        assert guard.config["baseUrl"] == "http://localhost:4040"
        assert guard.config["failPolicy"] == "OPEN"
        assert guard.config["debug"] is False
        assert guard.context is None
        assert guard.local_cache == {}

    def test_custom_config(self):
        guard = ReplayGuard({
            "monitorId": "m1",
            "apiKey": "k1",
            "baseUrl": "https://custom.api.com",
            "failPolicy": "CLOSED",
            "debug": True,
        })
        assert guard.config["baseUrl"] == "https://custom.api.com"
        assert guard.config["failPolicy"] == "CLOSED"
        assert guard.config["debug"] is True

    def test_network_config_defaults(self):
        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        net = guard.config["network"]
        assert net["timeoutMs"] == 3000
        assert net["maxRetries"] == 3
        assert net["baseDelayMs"] == 200

    def test_env_base_url(self):
        with patch.dict("os.environ", {"REPLAYSAFE_API_URL": "http://env.api:9090"}):
            guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
            assert guard.config["baseUrl"] == "http://env.api:9090"


class TestStartSession:
    @patch("requests.request")
    def test_start_success(self, mock_request):
        mock_res = Mock()
        mock_res.status_code = 200
        mock_res.json.return_value = {
            "executionId": "exec-1",
            "token": "token-1",
            "workflowId": "wf-1",
        }
        mock_request.return_value = mock_res

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        ctx = guard.start(external_id="job-1", workflow_id="wf-1")

        assert ctx["executionId"] == "exec-1"
        assert guard.context == ctx
        mock_request.assert_called_once()

    @patch("requests.request")
    def test_start_failure_fail_open(self, mock_request):
        mock_res = Mock()
        mock_res.status_code = 500
        mock_res.text = "Server error"
        mock_request.return_value = mock_res

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1", "failPolicy": "OPEN"})
        ctx = guard.start()
        assert ctx is None
        assert guard.context is None

    @patch("requests.request")
    def test_start_failure_fail_closed(self, mock_request):
        mock_res = Mock()
        mock_res.status_code = 500
        mock_res.text = "Server error"
        mock_request.return_value = mock_res

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1", "failPolicy": "CLOSED"})
        with pytest.raises(Exception, match="Session init failed"):
            guard.start()

    @patch("requests.request")
    def test_start_network_error_fail_open(self, mock_request):
        mock_request.side_effect = requests.ConnectionError("Connection refused")

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1", "failPolicy": "OPEN"})
        ctx = guard.start()
        assert ctx is None

    @patch("requests.request")
    def test_start_network_error_fail_closed(self, mock_request):
        mock_request.side_effect = requests.ConnectionError("Connection refused")

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1", "failPolicy": "CLOSED"})
        with pytest.raises(requests.ConnectionError):
            guard.start()


class TestComplete:
    @patch("requests.request")
    def test_complete_success(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_complete = Mock()
        mock_complete.status_code = 200
        mock_complete.json.return_value = {"ok": True}

        mock_request.side_effect = [mock_start, mock_complete]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()
        result = guard.complete("SUCCESS")

        assert result == {"ok": True}
        assert guard.context is None

    def test_complete_no_context(self):
        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        result = guard.complete("SUCCESS")
        assert result is None

    @patch("requests.request")
    def test_complete_with_rollback(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_complete = Mock()
        mock_complete.status_code = 200
        mock_complete.json.return_value = {"ok": True}

        mock_request.side_effect = [mock_start, mock_complete]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()
        guard.complete("FAILED", should_rollback=True)

        # Verify shouldRollback was sent
        call_args = mock_request.call_args_list[1]
        assert call_args[1]["json"]["shouldRollback"] is True


class TestEffect:
    @patch("requests.request")
    def test_effect_without_session_runs_directly(self, mock_request):
        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        result = guard.effect("TYPE", "target", lambda: "direct_result")
        assert result == "direct_result"

    @patch("requests.request")
    def test_effect_local_cache_hit(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}
        mock_request.return_value = mock_start

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()

        # Seed local cache
        from replaysafe.hash import build_input_hash, make_fingerprint
        fp = make_fingerprint("TYPE", "target", build_input_hash(None))
        guard.local_cache[fp] = "cached_result"

        result = guard.effect("TYPE", "target", lambda: "new_result")
        assert result == "cached_result"

    @patch("requests.request")
    def test_effect_skip_from_server(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "SKIP", "cachedResult": "server_cached"}

        mock_request.side_effect = [mock_start, mock_begin]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()
        result = guard.effect("TYPE", "target", lambda: "new_result")
        assert result == "server_cached"

    @patch("requests.request")
    def test_effect_execute_and_commit(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "EXECUTE"}

        mock_commit = Mock()
        mock_commit.status_code = 200

        mock_request.side_effect = [mock_start, mock_begin, mock_commit]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()
        result = guard.effect("TYPE", "target", lambda: "executed")
        assert result == "executed"

    @patch("requests.request")
    def test_effect_with_receipt_fn(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "EXECUTE"}

        mock_commit = Mock()
        mock_commit.status_code = 200

        mock_request.side_effect = [mock_start, mock_begin, mock_commit]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()

        def receipt_fn(result):
            return {"receipt": result}

        result = guard.effect(
            "TYPE", "target", lambda: "data", receipt_fn=receipt_fn
        )
        assert result == "data"
        # Verify commit was called with receipt
        commit_call = mock_request.call_args_list[2]
        assert commit_call[1]["json"]["receipt"] == {"receipt": "data"}

    @patch("requests.request")
    def test_effect_conflict_raises(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 409
        mock_begin.json.return_value = {"conflictingExecutionId": "exec-2"}

        mock_request.side_effect = [mock_start, mock_begin]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()

        with pytest.raises(EffectConflictError) as exc_info:
            guard.effect("TYPE", "target", lambda: "data")
        assert exc_info.value.conflicting_execution_id == "exec-2"

    @patch("requests.request")
    def test_effect_begin_failure_fail_open(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 500
        mock_begin.text = "Server error"

        mock_request.side_effect = [mock_start, mock_begin]

        guard = ReplayGuard({
            "monitorId": "m1",
            "apiKey": "k1",
            "failPolicy": "OPEN",
        })
        guard.start()
        result = guard.effect("TYPE", "target", lambda: "fallback")
        assert result == "fallback"

    @patch("requests.request")
    def test_effect_begin_failure_fail_closed(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 500
        mock_begin.text = "Server error"

        mock_request.side_effect = [mock_start, mock_begin]

        guard = ReplayGuard({
            "monitorId": "m1",
            "apiKey": "k1",
            "failPolicy": "CLOSED",
        })
        guard.start()
        with pytest.raises(Exception, match="effect/begin failed"):
            guard.effect("TYPE", "target", lambda: "data")

    @patch("requests.request")
    def test_effect_execution_error_marks_unknown(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "EXECUTE"}

        mock_unknown = Mock()
        mock_unknown.status_code = 200

        mock_request.side_effect = [mock_start, mock_begin, mock_unknown]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()

        with pytest.raises(ValueError, match="ops"):
            guard.effect("TYPE", "target", lambda: (_ for _ in ()).throw(ValueError("ops")))

        # Verify unknown was called
        assert len(mock_request.call_args_list) == 3

    @patch("requests.request")
    def test_effect_execution_error_mark_failed(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "EXECUTE"}

        mock_failed = Mock()
        mock_failed.status_code = 200

        mock_request.side_effect = [mock_start, mock_begin, mock_failed]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()

        with pytest.raises(ValueError):
            guard.effect(
                "TYPE", "target",
                lambda: (_ for _ in ()).throw(ValueError("fail")),
                mark_failed_as_unknown=False,
            )

        # Verify failed endpoint was called (not unknown)
        failed_call = mock_request.call_args_list[2]
        assert "/effect/failed" in failed_call[1].get("url", "") or "/effect/failed" in str(failed_call)


class TestWrap:
    @patch("requests.request")
    def test_wrap_delegates_to_effect(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "EXECUTE"}

        mock_commit = Mock()
        mock_commit.status_code = 200

        mock_request.side_effect = [mock_start, mock_begin, mock_commit]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()
        result = guard.wrap("TYPE", "target", {"data": 1}, lambda: "wrapped")
        assert result == "wrapped"


class TestSnapshot:
    @patch("requests.request")
    def test_snapshot_sends_request(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_snapshot = Mock()
        mock_snapshot.status_code = 200

        mock_request.side_effect = [mock_start, mock_snapshot]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()
        guard.snapshot("state-key", {"key": "value"})

        assert len(mock_request.call_args_list) == 2
        call_args = mock_request.call_args_list[1]
        assert "/api/guards/verify" in call_args[1].get("url", "") or "/api/guards/verify" in str(call_args)

    def test_snapshot_no_context(self):
        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        # Should not raise
        guard.snapshot("key", {"state": 1})


class TestResume:
    @patch("requests.request")
    def test_resume_success(self, mock_request):
        mock_res = Mock()
        mock_res.status_code = 200
        mock_res.json.return_value = {"continuationPlan": {"remaining": []}}
        mock_request.return_value = mock_res

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        result = guard.resume("wf-1")
        assert result == {"continuationPlan": {"remaining": []}}

    @patch("requests.request")
    def test_resume_failure(self, mock_request):
        mock_res = Mock()
        mock_res.status_code = 500
        mock_res.text = "Not found"
        mock_request.return_value = mock_res

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        with pytest.raises(Exception, match="Resume failed"):
            guard.resume("wf-1")


class TestFetchWithRetry:
    @patch("requests.request")
    def test_success_on_first_attempt(self, mock_request):
        mock_res = Mock()
        mock_res.status_code = 200
        mock_request.return_value = mock_res

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        res = guard._fetch_with_retry("GET", "http://test.com/api", {})
        assert res.status_code == 200
        assert mock_request.call_count == 1

    @patch("time.sleep")
    @patch("requests.request")
    def test_retries_on_network_error(self, mock_request, mock_sleep):
        mock_res_ok = Mock()
        mock_res_ok.status_code = 200

        mock_request.side_effect = [
            requests.ConnectionError("refused"),
            requests.ConnectionError("refused"),
            mock_res_ok,
        ]

        guard = ReplayGuard({
            "monitorId": "m1",
            "apiKey": "k1",
            "network": {"maxRetries": 3, "baseDelayMs": 100, "timeoutMs": 3000},
        })
        res = guard._fetch_with_retry("GET", "http://test.com/api", {})
        assert res.status_code == 200
        assert mock_request.call_count == 3

    @patch("time.sleep")
    @patch("requests.request")
    def test_returns_response_without_retrying_on_http_error(self, mock_request, mock_sleep):
        mock_res = Mock()
        mock_res.status_code = 500
        mock_request.return_value = mock_res

        guard = ReplayGuard({
            "monitorId": "m1",
            "apiKey": "k1",
            "network": {"maxRetries": 2, "baseDelayMs": 100, "timeoutMs": 3000},
        })
        # _fetch_with_retry returns the response immediately, even for HTTP errors
        # Retries only happen on network-level exceptions (ConnectionError, Timeout)
        res = guard._fetch_with_retry("GET", "http://test.com/api", {})
        assert res.status_code == 500
        assert mock_request.call_count == 1  # No retries for HTTP 500

    @patch("time.sleep")
    @patch("requests.request")
    def test_raises_on_network_error_after_retries(self, mock_request, mock_sleep):
        mock_request.side_effect = requests.ConnectionError("refused")

        guard = ReplayGuard({
            "monitorId": "m1",
            "apiKey": "k1",
            "network": {"maxRetries": 1, "baseDelayMs": 100, "timeoutMs": 3000},
        })
        with pytest.raises(requests.ConnectionError):
            guard._fetch_with_retry("GET", "http://test.com/api", {})
        assert mock_request.call_count == 2  # 1 initial + 1 retry


class TestTimeout:
    @patch("requests.request")
    def test_timeout_raises_effect_timeout_error(self, mock_request):
        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "EXECUTE"}

        mock_unknown = Mock()
        mock_unknown.status_code = 200

        mock_request.side_effect = [mock_start, mock_begin, mock_unknown]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()

        def slow():
            time.sleep(1)
            return "done"

        with pytest.raises(EffectTimeoutError) as exc_info:
            guard.effect("TYPE", "target", slow, timeout_ms=50)
        assert exc_info.value.fingerprint is not None


class TestAdapters:
    @patch("requests.request")
    def test_crewai_adapter(self, mock_request):
        from replaysafe.adapters.crewai import replay_safe_tool

        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "EXECUTE"}

        mock_commit = Mock()
        mock_commit.status_code = 200

        mock_request.side_effect = [mock_start, mock_begin, mock_commit]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()

        @replay_safe_tool(guard, type_str="DB_UPDATE", target="users")
        def update_user(user_id):
            return f"updated {user_id}"

        result = update_user("u-123")
        assert result == "updated u-123"
        assert update_user.__name__ == "update_user"

    @patch("requests.request")
    def test_langchain_adapter(self, mock_request):
        from replaysafe.adapters.langchain import replay_safe_langchain_tool

        mock_start = Mock()
        mock_start.status_code = 200
        mock_start.json.return_value = {"executionId": "exec-1", "token": "t"}

        mock_begin = Mock()
        mock_begin.status_code = 200
        mock_begin.json.return_value = {"action": "EXECUTE"}

        mock_commit = Mock()
        mock_commit.status_code = 200

        mock_request.side_effect = [mock_start, mock_begin, mock_commit]

        guard = ReplayGuard({"monitorId": "m1", "apiKey": "k1"})
        guard.start()

        @replay_safe_langchain_tool(guard, type_str="SEND_EMAIL", target="welcome")
        def send_email(to):
            return f"sent to {to}"

        result = send_email("test@example.com")
        assert result == "sent to test@example.com"
        assert send_email.__name__ == "send_email"


class TestExports:
    def test_main_exports(self):
        from replaysafe import ReplayGuard, EffectTimeoutError, EffectConflictError
        assert ReplayGuard is not None
        assert EffectTimeoutError is not None
        assert EffectConflictError is not None

    def test_adapter_exports(self):
        from replaysafe.adapters import replay_safe_tool, replay_safe_langchain_tool
        assert replay_safe_tool is not None
        assert replay_safe_langchain_tool is not None

    def test_error_classes(self):
        err = EffectTimeoutError("msg", "fp123")
        assert str(err) == "msg"
        assert err.fingerprint == "fp123"

        err2 = EffectConflictError("exec-456")
        assert "exec-456" in str(err2)
        assert err2.conflicting_execution_id == "exec-456"
