import hashlib

DEFAULT_IGNORE_KEYS = {
    "timestamp",
    "createdAt",
    "updatedAt",
    "requestId",
    "traceId",
    "nonce",
    "idempotencyKey",
    "x-request-id",
}


def serialize_object(val) -> str:
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "bool:true" if val else "bool:false"
    if isinstance(val, (int, float)):
        if isinstance(val, float) and val.is_integer():
            val = int(val)
        return f"number:{val}"
    if isinstance(val, str):
        return f"string:{len(val)}:{val}"
    if isinstance(val, (list, tuple, set)):
        items_str = "".join(serialize_object(item) for item in val)
        return f"array:{len(val)}:{items_str}"
    if isinstance(val, dict):
        sorted_keys = sorted(val.keys())
        kv_str = "".join(
            f"{serialize_object(k)}{serialize_object(val[k])}"
            for k in sorted_keys
        )
        return f"object:{len(val)}:{kv_str}"

    s = str(val)
    return f"string:{len(s)}:{s}"


def hash_object(val) -> str:
    serialized = serialize_object(val)
    return hashlib.sha1(serialized.encode("utf-8")).hexdigest()


def clean_input(obj, ignore_keys=None):
    if ignore_keys is None:
        ignore_keys = DEFAULT_IGNORE_KEYS
    else:
        ignore_keys = set(ignore_keys)

    if isinstance(obj, dict):
        return {
            k: clean_input(v, ignore_keys)
            for k, v in obj.items()
            if k not in ignore_keys
        }
    elif isinstance(obj, (list, tuple, set)):
        return [clean_input(x, ignore_keys) for x in obj]
    return obj


def build_input_hash(inputs, disable_default_ignore_keys=False, ignore_keys=None) -> str:
    if not isinstance(inputs, dict):
        return hash_object(inputs)

    if disable_default_ignore_keys:
        ignore_set = set(ignore_keys or [])
    else:
        ignore_set = DEFAULT_IGNORE_KEYS.union(set(ignore_keys or []))

    cleaned = clean_input(inputs, ignore_set)
    return hash_object(cleaned)


def make_fingerprint(type_str: str, target: str, input_hash: str) -> str:
    # Match TS SDK fingerprinting: hash({ type, target, inputHash })
    combined = {"type": type_str, "target": target, "inputHash": input_hash}
    return hash_object(combined)
