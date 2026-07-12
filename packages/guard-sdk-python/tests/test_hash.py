import pytest
from replaysafe.hash import (
    serialize_object,
    hash_object,
    build_input_hash,
    make_fingerprint,
    clean_input,
    DEFAULT_IGNORE_KEYS,
)


class TestSerializeObject:
    def test_none(self):
        assert serialize_object(None) == "null"

    def test_bool_true(self):
        assert serialize_object(True) == "bool:true"

    def test_bool_false(self):
        assert serialize_object(False) == "bool:false"

    def test_int(self):
        assert serialize_object(42) == "number:42"

    def test_float(self):
        assert serialize_object(3.14) == "number:3.14"

    def test_float_integer(self):
        assert serialize_object(5.0) == "number:5"

    def test_string(self):
        assert serialize_object("hello") == "string:5:hello"

    def test_empty_string(self):
        assert serialize_object("") == "string:0:"

    def test_list(self):
        result = serialize_object([1, 2, 3])
        assert result.startswith("array:3:")
        assert "number:1" in result
        assert "number:2" in result
        assert "number:3" in result

    def test_tuple(self):
        result = serialize_object((1, 2))
        assert result.startswith("array:2:")

    def test_set(self):
        result = serialize_object({1, 2})
        assert result.startswith("array:2:")

    def test_empty_list(self):
        assert serialize_object([]) == "array:0:"

    def test_dict(self):
        result = serialize_object({"a": 1})
        assert result.startswith("object:1:")
        assert "string:1:a" in result
        assert "number:1" in result

    def test_dict_sorted_keys(self):
        result = serialize_object({"b": 2, "a": 1})
        assert result.startswith("object:2:")
        # Keys should be sorted: a before b
        pos_a = result.index("string:1:a")
        pos_b = result.index("string:1:b")
        assert pos_a < pos_b

    def test_empty_dict(self):
        assert serialize_object({}) == "object:0:"

    def test_nested_structure(self):
        val = {"name": "test", "items": [1, 2]}
        result = serialize_object(val)
        assert result.startswith("object:2:")
        assert "string:4:name" in result
        assert "string:4:test" in result
        assert "array:2:" in result

    def test_unknown_type_falls_back_to_str(self):
        class Custom:
            def __str__(self):
                return "custom_val"

        result = serialize_object(Custom())
        assert result == "string:10:custom_val"


class TestHashObject:
    def test_deterministic(self):
        val = {"a": 1, "b": 2}
        h1 = hash_object(val)
        h2 = hash_object(val)
        assert h1 == h2

    def test_different_values_different_hash(self):
        h1 = hash_object({"a": 1})
        h2 = hash_object({"a": 2})
        assert h1 != h2

    def test_different_keys_different_hash(self):
        h1 = hash_object({"a": 1})
        h2 = hash_object({"b": 1})
        assert h1 != h2

    def test_key_order_irrelevant(self):
        h1 = hash_object({"a": 1, "b": 2})
        h2 = hash_object({"b": 2, "a": 1})
        assert h1 == h2

    def test_hash_is_sha1(self):
        h = hash_object("test")
        assert len(h) == 40
        assert all(c in "0123456789abcdef" for c in h)


class TestBuildInputHash:
    def test_non_dict_input(self):
        h = build_input_hash(42)
        assert h == hash_object(42)

    def test_none_input(self):
        h = build_input_hash(None)
        assert h == hash_object(None)

    def test_list_input(self):
        h = build_input_hash([1, 2, 3])
        assert h == hash_object([1, 2, 3])

    def test_strips_default_ignore_keys(self):
        inputs = {"amount": 5000, "timestamp": 123, "traceId": "t-1"}
        h = build_input_hash(inputs)
        expected = hash_object({"amount": 5000})
        assert h == expected

    def test_custom_ignore_keys(self):
        inputs = {"amount": 5000, "customField": "val"}
        h = build_input_hash(inputs, ignore_keys=["customField"])
        expected = hash_object({"amount": 5000})
        assert h == expected

    def test_disable_default_ignore_keys(self):
        inputs = {"amount": 5000, "timestamp": 123}
        h = build_input_hash(inputs, disable_default_ignore_keys=True)
        expected = hash_object({"amount": 5000, "timestamp": 123})
        assert h == expected

    def test_disable_default_with_custom_keys(self):
        inputs = {"amount": 5000, "timestamp": 123, "nonce": "n1"}
        h = build_input_hash(
            inputs,
            disable_default_ignore_keys=True,
            ignore_keys=["nonce"],
        )
        expected = hash_object({"amount": 5000, "timestamp": 123})
        assert h == expected

    def test_empty_dict(self):
        h = build_input_hash({})
        expected = hash_object({})
        assert h == expected

    def test_all_keys_stripped(self):
        inputs = {"timestamp": 1, "traceId": "t"}
        h = build_input_hash(inputs)
        expected = hash_object({})
        assert h == expected


class TestMakeFingerprint:
    def test_deterministic(self):
        fp1 = make_fingerprint("STRIPE_CHARGE", "order-1", "hash123")
        fp2 = make_fingerprint("STRIPE_CHARGE", "order-1", "hash123")
        assert fp1 == fp2

    def test_different_type_different_fp(self):
        fp1 = make_fingerprint("TYPE_A", "target", "hash")
        fp2 = make_fingerprint("TYPE_B", "target", "hash")
        assert fp1 != fp2

    def test_different_target_different_fp(self):
        fp1 = make_fingerprint("TYPE", "target-a", "hash")
        fp2 = make_fingerprint("TYPE", "target-b", "hash")
        assert fp1 != fp2

    def test_different_hash_different_fp(self):
        fp1 = make_fingerprint("TYPE", "target", "hash-a")
        fp2 = make_fingerprint("TYPE", "target", "hash-b")
        assert fp1 != fp2

    def test_format(self):
        fp = make_fingerprint("TYPE", "target", "abc")
        assert len(fp) == 40
        assert all(c in "0123456789abcdef" for c in fp)


class TestCleanInput:
    def test_strips_default_keys(self):
        obj = {"a": 1, "timestamp": 100, "b": 2}
        cleaned = clean_input(obj)
        assert cleaned == {"a": 1, "b": 2}

    def test_custom_ignore_keys(self):
        obj = {"a": 1, "custom": "x"}
        cleaned = clean_input(obj, {"custom"})
        assert cleaned == {"a": 1}

    def test_nested_dicts(self):
        obj = {"outer": {"inner": 1, "timestamp": 100}}
        cleaned = clean_input(obj)
        assert cleaned == {"outer": {"inner": 1}}

    def test_list_of_dicts(self):
        obj = [{"a": 1, "timestamp": 100}, {"b": 2}]
        cleaned = clean_input(obj)
        assert cleaned == [{"a": 1}, {"b": 2}]

    def test_non_dict_passthrough(self):
        assert clean_input(42) == 42
        assert clean_input("hello") == "hello"
        assert clean_input(None) is None
