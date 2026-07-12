import time
import random
import requests
import os
import threading
from typing import Callable, Any, Dict, Optional, List
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

from replaysafe.errors import EffectTimeoutError, EffectConflictError
from replaysafe.hash import build_input_hash, make_fingerprint


class ReplayGuard:
    def __init__(self, config: Dict[str, Any]):
        self.config = {
            "baseUrl": os.environ.get("REPLAYSAFE_API_URL", "http://localhost:4040"),
            "failPolicy": "OPEN",
            "debug": False,
            "network": {
                "timeoutMs": 3000,
                "maxRetries": 3,
                "baseDelayMs": 200,
            },
            **config
        }
        self.context = None
        self.local_cache = {}
        self._cache_lock = threading.Lock()
        self.executor = ThreadPoolExecutor(max_workers=10)

    def start(
        self,
        external_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        try:
            res = self._fetch_with_retry(
                "POST",
                f"{self.config['baseUrl']}/api/guards/session",
                {
                    "monitorId": self.config["monitorId"],
                    "externalId": external_id,
                    "workflowId": workflow_id,
                    "agentId": agent_id,
                },
            )
            if res.status_code != 200:
                raise Exception(f"Session init failed: {res.text}")

            self.context = res.json()
            return self.context
        except Exception as e:
            if self.config.get("debug"):
                print(f"[ReplayGuard] Session initialization failed: {e}")

            if self.config.get("failPolicy") == "CLOSED":
                raise e

            if self.config.get("debug"):
                print("[ReplayGuard] Proceeding without session (Fail Open)")
            return None

    def complete(self, status: str, should_rollback: bool = False) -> Optional[Any]:
        if not self.context:
            return None

        try:
            res = self._fetch_with_retry(
                "PATCH",
                f"{self.config['baseUrl']}/api/guards/execution/{self.context['executionId']}",
                {
                    "status": status,
                    "token": self.context.get("token"),
                    "shouldRollback": should_rollback,
                },
            )
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            if self.config.get("debug"):
                print(f"[ReplayGuard] Failed to complete session: {e}")
        finally:
            self.context = None

    def resume(self, workflow_id: str) -> Dict[str, Any]:
        try:
            res = self._fetch_with_retry(
                "POST",
                f"{self.config['baseUrl']}/api/guards/resume/{workflow_id}",
                {},
            )
            if res.status_code != 200:
                raise Exception(f"Resume failed: {res.text}")
            return res.json()
        except Exception as e:
            if self.config.get("debug"):
                print(f"[ReplayGuard] Resume failed: {e}")
            raise e

    def effect(
        self,
        type_str: str,
        target: str,
        execute_fn: Callable[[], Any],
        input_data: Optional[Any] = None,
        provider: Optional[str] = None,
        receipt_fn: Optional[Callable[[Any], Dict[str, Any]]] = None,
        timeout_ms: int = 30000,
        scope: str = "MONITOR",
        mark_failed_as_unknown: bool = True,
    ) -> Any:
        input_hash = build_input_hash(
            input_data,
            disable_default_ignore_keys=self.config.get("disableDefaultIgnoreKeys", False),
            ignore_keys=self.config.get("ignoreKeys"),
        )
        fp = make_fingerprint(type_str, target, input_hash)

        if not self.context:
            if self.config.get("debug"):
                print("[ReplayGuard] No session. Running effect without safety layer.")
            return execute_fn()

        with self._cache_lock:
            if fp in self.local_cache:
                if self.config.get("debug"):
                    print(f"[ReplayGuard] Local cache hit (effect): {type_str}:{target}")
                return self.local_cache[fp]

        # 2. Begin phase
        try:
            begin_res = self._call_begin(fp, type_str, target, input_data, provider, scope)
        except Exception as e:
            if self.config.get("debug"):
                print(f"[ReplayGuard] effect.begin failed: {e}")
            if self.config.get("failPolicy") == "CLOSED":
                raise e
            return execute_fn()

        if begin_res.get("action") == "SKIP":
            if self.config.get("debug"):
                print(f"[ReplayGuard] SKIP (effect): {type_str}:{target}")
            with self._cache_lock:
                self.local_cache[fp] = begin_res.get("cachedResult")
            return begin_res.get("cachedResult")

        if begin_res.get("action") == "CONFLICT":
            if self.config.get("debug"):
                print(f"[ReplayGuard] CONFLICT (effect): {type_str}:{target}")
            raise EffectConflictError(begin_res.get("conflictingExecutionId", "unknown"))

        # 3. Execute with timeout
        result = None
        try:
            if timeout_ms > 0:
                result = self._with_timeout(execute_fn, timeout_ms, fp, type_str, target)
            else:
                result = execute_fn()
        except Exception as err:
            if not isinstance(err, EffectTimeoutError):
                if mark_failed_as_unknown:
                    self._call_mark_unknown(fp, f"Operation failed: {err}")
                else:
                    self._call_mark_failed(fp, str(err))
            raise err

        # 4. Commit
        receipt_data = receipt_fn(result) if receipt_fn else None
        try:
            self._call_commit(fp, result, receipt_data)
        except Exception as e:
            if self.config.get("debug"):
                print(f"[ReplayGuard] effect.commit failed: {e}")

        with self._cache_lock:
            self.local_cache[fp] = result
        return result

    def wrap(
        self,
        type_str: str,
        target: str,
        inputs: Any,
        operation: Callable[[], Any],
        scope: str = "MONITOR",
    ) -> Any:
        return self.effect(
            type_str=type_str,
            target=target,
            execute_fn=operation,
            input_data=inputs,
            timeout_ms=0,
            scope=scope,
            mark_failed_as_unknown=False,
        )

    def snapshot(self, key: str, state: Any) -> None:
        if not self.context:
            return

        input_hash = build_input_hash(state)
        fp = make_fingerprint("STATE_SNAPSHOT", key, input_hash)

        try:
            self._fetch_with_retry(
                "POST",
                f"{self.config['baseUrl']}/api/guards/verify",
                {
                    "executionId": self.context["executionId"],
                    "token": self.context.get("token"),
                    "fingerprint": fp,
                    "type": "STATE_SNAPSHOT",
                    "target": key,
                    "inputHash": input_hash,
                    "metadata": state,
                },
            )
        except Exception as e:
            if self.config.get("debug"):
                print(f"[ReplayGuard] Failed to record snapshot: {e}")

    def _call_begin(
        self,
        fp: str,
        type_str: str,
        target: str,
        input_data: Any,
        provider: Optional[str] = None,
        scope: str = "MONITOR",
    ) -> Dict[str, Any]:
        res = self._fetch_with_retry(
            "POST",
            f"{self.config['baseUrl']}/api/guards/effect/begin",
            {
                "executionId": self.context["executionId"],
                "token": self.context.get("token"),
                "fingerprint": fp,
                "type": type_str,
                "target": target,
                "inputHash": build_input_hash(input_data),
                "provider": provider,
                "workflowId": self.context.get("workflowId"),
                "agentId": self.context.get("agentId"),
                "scope": scope,
            },
        )
        if res.status_code != 200:
            if res.status_code == 409:
                return {
                    "action": "CONFLICT",
                    "conflictingExecutionId": res.json().get("conflictingExecutionId"),
                }
            raise Exception(f"effect/begin failed: {res.text}")
        return res.json()

    def _call_commit(self, fp: str, result: Any, receipt: Optional[Dict[str, Any]]) -> None:
        self._fetch_with_retry(
            "POST",
            f"{self.config['baseUrl']}/api/guards/effect/commit",
            {
                "executionId": self.context["executionId"],
                "token": self.context.get("token"),
                "fingerprint": fp,
                "result": result,
                "receipt": receipt,
            },
        )

    def _call_mark_unknown(self, fp: str, reason: str) -> None:
        try:
            self._fetch_with_retry(
                "POST",
                f"{self.config['baseUrl']}/api/guards/effect/unknown",
                {
                    "executionId": self.context["executionId"],
                    "token": self.context.get("token"),
                    "fingerprint": fp,
                    "reason": reason,
                },
            )
        except Exception as e:
            if self.config.get("debug"):
                print(f"[ReplayGuard] effect/unknown failed: {e}")

    def _call_mark_failed(self, fp: str, error: str) -> None:
        try:
            self._fetch_with_retry(
                "POST",
                f"{self.config['baseUrl']}/api/guards/effect/failed",
                {
                    "executionId": self.context["executionId"],
                    "token": self.context.get("token"),
                    "fingerprint": fp,
                    "error": error,
                },
            )
        except Exception as e:
            if self.config.get("debug"):
                print(f"[ReplayGuard] effect/failed failed: {e}")

    def _with_timeout(
        self,
        execute_fn: Callable[[], Any],
        timeout_ms: int,
        fp: str,
        type_str: str,
        target: str,
    ) -> Any:
        future = self.executor.submit(execute_fn)
        try:
            return future.result(timeout=timeout_ms / 1000.0)
        except FutureTimeoutError:
            reason = f"Operation timed out after {timeout_ms}ms"
            self._call_mark_unknown(fp, reason)
            raise EffectTimeoutError(
                f"[ReplayGuard] {type_str}:{target} timed out after {timeout_ms}ms",
                fp,
            )

    def _fetch_with_retry(self, method: str, url: str, json_data: dict) -> requests.Response:
        network_config = self.config.get("network", {})
        max_retries = network_config.get("maxRetries", 3)
        base_delay = network_config.get("baseDelayMs", 200) / 1000.0
        timeout = network_config.get("timeoutMs", 3000) / 1000.0

        last_err = None
        for attempt in range(max_retries + 1):
            try:
                res = requests.request(
                    method,
                    url,
                    headers={
                        "x-api-key": self.config["apiKey"],
                        "Content-Type": "application/json",
                    },
                    json=json_data,
                    timeout=timeout,
                )
                return res
            except requests.RequestException as e:
                last_err = e
                if attempt < max_retries:
                    cap = base_delay * (2**attempt)
                    jitter = random.random() * min(cap, 1.6)
                    if self.config.get("debug"):
                        print(
                            f"[ReplayGuard] SDK retry {attempt + 1}/{max_retries} in {jitter:.3f}s — {e}"
                        )
                    time.sleep(jitter)
        raise last_err
