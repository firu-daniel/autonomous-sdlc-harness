"""JavaScript string and number semantics, reproduced for the port of `cli/src/retrieval/`.

The rule this module exists to enforce: a JavaScript string or number operation the TypeScript
backend performs is reproduced here exactly, or a byte difference appears that has nothing to do
with retrieval. Every other module imports these helpers and never re-derives a rule.

A Python `str` here may hold a lone surrogate code point, standing for the lone UTF-16 code unit JS
would hold; every UTF-16 round trip goes through `surrogatepass` so it survives.
"""

import decimal
import math
import re
from collections.abc import Sequence

# ECMAScript WhiteSpace plus LineTerminator: what `\s` and `trim()` match. Python's `\s` adds
# U+001C-U+001F and U+0085 and lacks U+FEFF, so it is never used for a JS rule.
JS_WHITESPACE = (
    "\t\n\v\f\r \u00a0\u1680"
    "\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a"
    "\u2028\u2029\u202f\u205f\u3000\ufeff"
)

_JS_WHITESPACE_RUN = re.compile("[" + re.escape(JS_WHITESPACE) + "]+")

_ARRAY_INDEX = re.compile(r"0|[1-9][0-9]*")
_MAX_ARRAY_INDEX = 2**32 - 2


def js_whitespace_runs(s: str, repl: str) -> str:
    """`s.replace(/\\s+/g, repl)`.

    A `$` in `repl` is a substitution pattern in JS and is refused rather than taken literally.
    """
    if "$" in repl:
        raise ValueError("js_whitespace_runs: a '$' replacement pattern is not reproduced")
    return _JS_WHITESPACE_RUN.sub(lambda _match: repl, s)


def js_trim(s: str) -> str:
    """`s.trim()`."""
    return s.strip(JS_WHITESPACE)


def js_trim_end(s: str) -> str:
    """`s.trimEnd()`."""
    return s.rstrip(JS_WHITESPACE)


def _utf16_units(s: str) -> bytes:
    return s.encode("utf-16-be", "surrogatepass")


def _from_utf16_units(units: bytes) -> str:
    return units.decode("utf-16-be", "surrogatepass")


def utf16_len(s: str) -> int:
    """`s.length`: UTF-16 code units, not code points."""
    return len(_utf16_units(s)) // 2


def _relative_index(index: int, length: int) -> int:
    if index < 0:
        return max(length + index, 0)
    return min(index, length)


def utf16_slice(s: str, start: int, end: int | None = None) -> str:
    """`s.slice(start, end)` in UTF-16 code units; a cut inside a pair leaves the lone surrogate."""
    units = _utf16_units(s)
    length = len(units) // 2
    begin = _relative_index(start, length)
    finish = length if end is None else _relative_index(end, length)
    if begin >= finish:
        return ""
    return _from_utf16_units(units[begin * 2 : finish * 2])


def utf16_sort_key(s: str) -> bytes:
    """A key under which Python's ordering is JS's `<` on strings: UTF-16 code-unit order."""
    return _utf16_units(s)


def _js_number_to_string(x: float) -> str:
    # Number::toString for a finite, non-zero x: shortest round-trip digits, which repr gives.
    sign = "-" if x < 0 else ""
    digits_text, _, exponent_text = repr(abs(x)).partition("e")
    exponent = int(exponent_text) if exponent_text else 0
    integer_part, _, fraction_part = digits_text.partition(".")
    digits = (integer_part + fraction_part).lstrip("0")
    point = len(integer_part) + exponent - (len(integer_part + fraction_part) - len(digits))
    digits = digits.rstrip("0")
    k, n = len(digits), point
    if k <= n <= 21:
        body = digits + "0" * (n - k)
    elif 0 < n <= 21:
        body = digits[:n] + "." + digits[n:]
    elif -6 < n <= 0:
        body = "0." + "0" * (-n) + digits
    else:
        mantissa = digits if k == 1 else digits[0] + "." + digits[1:]
        e = n - 1
        body = f"{mantissa}e{'+' if e >= 0 else '-'}{abs(e)}"
    return sign + body


def js_to_fixed(x: float, digits: int) -> str:
    """`x.toFixed(digits)`: the exact binary value rounded half away from zero.

    `-0.0` renders unsigned, a negative value that rounds to zero keeps its sign, and a magnitude of
    at least 1e21 (Infinity included) renders as `String(x)`, as the spec states.
    """
    if not 0 <= digits <= 100:
        raise ValueError(f"js_to_fixed: digits {digits} is outside 0..100")
    if math.isnan(x):
        return "NaN"
    sign = "-" if x < 0 else ""
    # abs() also clears the sign of -0.0, which Decimal would otherwise print.
    x = abs(x)
    if math.isinf(x):
        return sign + "Infinity"
    if x >= 1e21:
        return sign + _js_number_to_string(x)
    # Below 1e21 with up to 100 fraction digits needs at most 122 significant digits.
    context = decimal.Context(prec=200, rounding=decimal.ROUND_HALF_UP)
    quantum = decimal.Decimal(1).scaleb(-digits)
    rounded = decimal.Decimal(x).quantize(quantum, context=context)
    return sign + f"{rounded:f}"


_JSON_SHORT_ESCAPES = {
    0x22: '\\"',
    0x5C: "\\\\",
    0x08: "\\b",
    0x0C: "\\f",
    0x0A: "\\n",
    0x0D: "\\r",
    0x09: "\\t",
}


def json_stringify_str(s: str) -> str:
    """`JSON.stringify(s)` of a string: non-ASCII raw, a lone surrogate as lowercase `\\uXXXX`."""
    units = _utf16_units(s)
    codes = [int.from_bytes(units[i : i + 2], "big") for i in range(0, len(units), 2)]
    out: list[str] = ['"']
    i = 0
    while i < len(codes):
        code = codes[i]
        if 0xD800 <= code <= 0xDBFF and i + 1 < len(codes) and 0xDC00 <= codes[i + 1] <= 0xDFFF:
            out.append(_from_utf16_units(units[i * 2 : i * 2 + 4]))
            i += 2
            continue
        if code in _JSON_SHORT_ESCAPES:
            out.append(_JSON_SHORT_ESCAPES[code])
        elif code < 0x20 or 0xD800 <= code <= 0xDFFF:
            out.append(f"\\u{code:04x}")
        else:
            out.append(chr(code))
        i += 1
    out.append('"')
    return "".join(out)


def json_stringify(value: object) -> str:
    """`JSON.stringify(value)` of a JSON-compatible value: `None`, `bool`, `int`, `float`, `str`,
    a `list` or `tuple`, or a `dict` with `str` keys.

    A number is the JS number it converts to, a non-finite one is `null`, and keys follow
    `Object.keys` order. The result encodes to UTF-8 even when a string holds a lone surrogate.
    """
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int | float):
        number = float(value)
        if not math.isfinite(number):
            return "null"
        return "0" if number == 0 else _js_number_to_string(number)
    if isinstance(value, str):
        return json_stringify_str(value)
    if isinstance(value, list | tuple):
        return "[" + ",".join(json_stringify(item) for item in value) + "]"
    if isinstance(value, dict):
        if not all(isinstance(key, str) for key in value):
            raise TypeError("json_stringify: a dict key is not a str")
        members = (
            f"{json_stringify_str(key)}:{json_stringify(value[key])}"
            for key in js_object_keys(list(value))
        )
        return "{" + ",".join(members) + "}"
    raise TypeError(f"json_stringify: {type(value).__name__} is not a JSON value")


def _is_array_index(key: str) -> bool:
    return _ARRAY_INDEX.fullmatch(key) is not None and int(key) <= _MAX_ARRAY_INDEX


def js_object_keys(keys: Sequence[str]) -> list[str]:
    """`Object.keys` order of an object whose keys were added in `keys` order.

    Array-index keys come first in ascending numeric order, then the rest in first-insertion order.
    """
    unique = list(dict.fromkeys(keys))
    indices = sorted((key for key in unique if _is_array_index(key)), key=int)
    return indices + [key for key in unique if not _is_array_index(key)]
