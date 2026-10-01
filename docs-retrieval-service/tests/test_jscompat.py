"""The rule this file exists to enforce: a JavaScript string or number operation the TypeScript
backend performs is reproduced exactly by `jscompat`, or a byte difference appears that has
nothing to do with retrieval.

Every expected literal is what Node v20.19.5 printed for the same JS expression, written beside
each case as `# JS: <expression>`, so a reviewer can re-derive it by running that expression.
"""

import json

import pytest

from harness_docs_retrieval.jscompat import (
    JS_WHITESPACE,
    js_object_keys,
    js_to_fixed,
    js_trim,
    js_trim_end,
    js_whitespace_runs,
    json_stringify,
    json_stringify_str,
    utf16_len,
    utf16_slice,
    utf16_sort_key,
)


def test_whitespace_set_is_exactly_what_js_regex_s_matches() -> None:
    # JS: every code unit c in 0..0xFFFF with /\s/.test(String.fromCharCode(c)); trim() agrees.
    expected = [
        0x9, 0xA, 0xB, 0xC, 0xD, 0x20, 0xA0, 0x1680,
        *range(0x2000, 0x200B),
        0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF,
    ]  # fmt: skip
    assert sorted(ord(c) for c in JS_WHITESPACE) == expected


@pytest.mark.parametrize(
    ("x", "digits", "expected"),
    [
        (0.0625, 3, "0.063"),  # JS: (0.0625).toFixed(3)
        (0.1875, 3, "0.188"),  # JS: (0.1875).toFixed(3)
        (1 / 3, 3, "0.333"),  # JS: (1 / 3).toFixed(3)
        (-0.0, 3, "0.000"),  # JS: (-0.0).toFixed(3)
        (-0.0625, 3, "-0.063"),  # JS: (-0.0625).toFixed(3)
        (-0.0001, 3, "-0.000"),  # JS: (-0.0001).toFixed(3)
        (1.005, 2, "1.00"),  # JS: (1.005).toFixed(2)
        (2.5, 0, "3"),  # JS: (2.5).toFixed(0)
        (-2.5, 0, "-3"),  # JS: (-2.5).toFixed(0)
        (123.456, 0, "123"),  # JS: (123.456).toFixed(0)
        (1e21, 2, "1e+21"),  # JS: (1e21).toFixed(2)
        (float("nan"), 2, "NaN"),  # JS: (NaN).toFixed(2)
        (float("inf"), 2, "Infinity"),  # JS: (Infinity).toFixed(2)
        (float("-inf"), 2, "-Infinity"),  # JS: (-Infinity).toFixed(2)
    ],
)
def test_to_fixed_rounds_the_exact_binary_value_half_up(
    x: float, digits: int, expected: str
) -> None:
    assert js_to_fixed(x, digits) == expected


def test_to_fixed_refuses_digits_js_refuses() -> None:
    # JS: (1).toFixed(101) throws RangeError.
    with pytest.raises(ValueError):
        js_to_fixed(1.0, 101)


def test_trim_uses_the_js_whitespace_set() -> None:
    assert js_trim("﻿ a  ") == "a"  # JS: '﻿ a  '.trim()
    assert js_trim("\x1ca") == "\x1ca"  # JS: '\x1ca'.trim()
    assert js_trim("\x85a") == "\x85a"  # JS: '\x85a'.trim()
    assert js_trim_end(" a 　") == " a"  # JS: ' a 　'.trimEnd()


def test_whitespace_runs_collapse_only_js_whitespace() -> None:
    # JS: 'a\x1c\x85  b'.replace(/\s+/g, '_')
    assert js_whitespace_runs("a\x1c\x85  b", "_") == "a\x1c\x85_b"


def test_whitespace_runs_refuses_a_js_substitution_pattern() -> None:
    with pytest.raises(ValueError):
        js_whitespace_runs("a b", "$&")


def test_length_and_slice_count_utf16_code_units() -> None:
    assert utf16_len("😀") == 2  # JS: '😀'.length
    # JS: 'a😀b'.slice(0, 2) is 'a' followed by the lone high surrogate \ud83d.
    assert utf16_slice("a😀b", 0, 2) == "a\ud83d"
    # JS: 'a😀b'.slice(2, 4) is the lone low surrogate \ude00 followed by 'b'.
    assert utf16_slice("a😀b", 2, 4) == "\ude00b"
    assert utf16_slice("a😀b", 0, 3) == "a😀"  # JS: 'a😀b'.slice(0, 3)
    assert utf16_slice("abc", -2) == "bc"  # JS: 'abc'.slice(-2)
    assert utf16_slice("abc", 2, 1) == ""  # JS: 'abc'.slice(2, 1)


def test_sort_key_is_js_code_unit_order() -> None:
    # JS: ['￿', '😀'].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)) puts '😀' first.
    assert sorted(["￿", "😀"], key=utf16_sort_key) == ["😀", "￿"]


def test_json_stringify_of_a_string() -> None:
    assert json_stringify_str('a"\n') == '"a\\"\\n"'  # JS: JSON.stringify('a"\n')
    # JS: JSON.stringify('\x00\x1f\b\t\f\r\\é/ ')
    controls = "\x00\x1f\b\t\f\r\\é/ "
    assert json_stringify_str(controls) == '"\\u0000\\u001f\\b\\t\\f\\r\\\\é/ "'
    assert json_stringify_str("\ud800x") == '"\\ud800x"'  # JS: JSON.stringify('\ud800x')
    assert json_stringify_str("😀") == '"😀"'  # JS: JSON.stringify('😀')


def test_json_stringify_of_a_value() -> None:
    # JS: JSON.stringify({ text: 'ab\ud83d...', n: 1.0, f: 0.5, z: -0, big: 1e21, small: 1e-7,
    #   nan: NaN, inf: -Infinity, t: true, u: null, list: [1, 'é', '😀', false], 2: 'x' })
    value = {
        "text": "ab\ud83d...",
        "n": 1.0,
        "f": 0.5,
        "z": -0.0,
        "big": 1e21,
        "small": 1e-7,
        "nan": float("nan"),
        "inf": float("-inf"),
        "t": True,
        "u": None,
        "list": [1, "é", "😀", False],
        "2": "x",
    }
    expected = (
        '{"2":"x","text":"ab\\ud83d...","n":1,"f":0.5,"z":0,"big":1e+21,"small":1e-7,'
        '"nan":null,"inf":null,"t":true,"u":null,"list":[1,"é","😀",false]}'
    )
    assert json_stringify(value) == expected


def test_json_stringify_of_a_lone_surrogate_is_valid_utf8_json() -> None:
    value = {"content": [{"type": "text", "text": "a" * 239 + "\ud83d..."}], "isError": False}
    encoded = json_stringify(value)
    encoded.encode("utf-8")
    assert json.loads(encoded) == value


@pytest.mark.parametrize("value", [{1: "x"}, {"a": object()}, b"bytes"])
def test_json_stringify_refuses_what_is_not_a_json_value(value: object) -> None:
    with pytest.raises(TypeError):
        json_stringify(value)


def test_object_keys_put_array_indices_first() -> None:
    # JS: Object.keys({ b: 1, 1: 1, a: 1, 0: 1 })
    assert js_object_keys(["b", "1", "a", "0"]) == ["0", "1", "b", "a"]
    # JS: Object.keys({ x: 1, '01': 1, '4294967294': 1, '4294967295': 1, '-1': 1, 2: 1 })
    assert js_object_keys(["x", "01", "4294967294", "4294967295", "-1", "2"]) == [
        "2",
        "4294967294",
        "x",
        "01",
        "4294967295",
        "-1",
    ]
