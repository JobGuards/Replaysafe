import pytest
import time
from unittest.mock import Mock, patch
import requests

from replaysafe import ReplayGuard, EffectTimeoutError, EffectConflictError
from replaysafe.hash import serialize_object, hash_object, build_input_hash, make_fingerprint


def test_serialization_parity():
    # Parity check: Node object-hash serializes dict keys sorted without extra colons
    val = {"b": 2, "a": 1}
    serialized = serialize_object(val)
    # Form: object:2:string:1:anumber:1string:1:bnumber:2
    assert serialized == "object:2:string:1:anumber:1string:1:bnumber:2"

    h = hash_object(val)
    assert h == "94758161f2fb1044300408e4fa9ed2e73e8da215"


def test_clean_input_ignoring_keys():
    inputs = {
        "amount": 5000,
        "timestamp": 1234567,
        "traceId": "t-1",
        "customNonce": "nonce-val",
    }
    cleaned_default = build_input_hash(inputs, ignore_keys=["customNonce"])
    # Should strip timestamp, traceId, and customNonce
    # Only "amount": 5000 is left
    expected_hash = hash_object({"amount": 5000})
    assert cleaned_default == expected_hash


@patch("requests.request")
def test_session_lifecycle(mock_request):
    # Mock responses for start() and complete()
    mock_start_res = Mock()
    mock_start_res.status_code = 200
    mock_start_res.json.return_value = {
        "executionId": "exec-123",
        "token": "exec-123.sig",
        "workflowId": "wf-1",
        "agentId": "agent-1",
    }

    mock_complete_res = Mock()
    mock_complete_res.status_code = 200
    mock_complete_res.json.return_value = {"ok": True}

    mock_request.side_effect = [mock_start_res, mock_complete_res]

    guard = ReplayGuard({"monitorId": "mon-1", "apiKey": "key-1"})
    ctx = guard.start(external_id="job-1", workflow_id="wf-1", agent_id="agent-1")

    assert ctx["executionId"] == "exec-123"
    assert guard.context == ctx

    guard.complete("SUCCESS")
    assert guard.context is None


@patch("requests.request")
def test_effect_conflict_handling(mock_request):
    # Mock conflict response
    mock_start_res = Mock()
    mock_start_res.status_code = 200
    mock_start_res.json.return_value = {
        "executionId": "exec-123",
        "token": "exec-123.sig",
    }

    mock_conflict_res = Mock()
    mock_conflict_res.status_code = 409
    mock_conflict_res.json.return_value = {
        "error": "Concurrent execution detected",
        "conflictingExecutionId": "exec-456",
    }

    mock_request.side_effect = [mock_start_res, mock_conflict_res]

    guard = ReplayGuard({"monitorId": "mon-1", "apiKey": "key-1"})
    guard.start()

    with pytest.raises(EffectConflictError) as exc_info:
        guard.effect("T1", "target-1", lambda: "run")

    assert exc_info.value.conflicting_execution_id == "exec-456"


@patch("requests.request")
def test_effect_timeout_handling(mock_request):
    mock_start_res = Mock()
    mock_start_res.status_code = 200
    mock_start_res.json.return_value = {
        "executionId": "exec-123",
        "token": "exec-123.sig",
    }

    mock_begin_res = Mock()
    mock_begin_res.status_code = 200
    mock_begin_res.json.return_value = {"action": "EXECUTE"}

    mock_unknown_res = Mock()
    mock_unknown_res.status_code = 200

    mock_request.side_effect = [mock_start_res, mock_begin_res, mock_unknown_res]

    guard = ReplayGuard({"monitorId": "mon-1", "apiKey": "key-1"})
    guard.start()

    def slow_fn():
        time.sleep(0.5)
        return "done"

    with pytest.raises(EffectTimeoutError):
        # 100ms timeout
        guard.effect("T1", "target-1", slow_fn, timeout_ms=100)
