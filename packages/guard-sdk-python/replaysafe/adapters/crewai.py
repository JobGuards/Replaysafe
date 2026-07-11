from typing import Callable, Any
from replaysafe import ReplayGuard


def replay_safe_tool(
    guard: ReplayGuard,
    type_str: str,
    target: str,
    provider: str = "crewai",
    scope: str = "PROJECT",
):
    """
    Decorator to wrap any CrewAI tool function with Replaysafe execution protection.
    """

    def decorator(func: Callable[..., Any]):
        def wrapper(*args, **kwargs):
            inputs = {"args": args, "kwargs": kwargs}
            return guard.effect(
                type_str=type_str,
                target=target,
                execute_fn=lambda: func(*args, **kwargs),
                input_data=inputs,
                provider=provider,
                receipt_fn=lambda result: {
                    "status": "success",
                    "result": str(result),
                },
                scope=scope,
            )

        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper

    return decorator
