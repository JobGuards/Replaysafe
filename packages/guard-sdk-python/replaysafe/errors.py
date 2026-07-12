class EffectTimeoutError(Exception):
    """
    Thrown when a side effect execution exceeds its configured timeout.
    The effect has been logged as UNKNOWN in the ledger.
    """
    def __init__(self, message: str, fingerprint: str):
        super().__init__(message)
        self.fingerprint = fingerprint


class EffectConflictError(Exception):
    """
    Thrown when a concurrent execution is already running the same side effect (CONFLICT).
    """
    def __init__(self, conflicting_execution_id: str):
        super().__init__(f"Concurrent execution detected: {conflicting_execution_id}")
        self.conflicting_execution_id = conflicting_execution_id
