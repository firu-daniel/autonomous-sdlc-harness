### 4. The two JS-whitespace rules are spelled with invisible literal characters instead of `\u` escapes

**Files:**
- `docs-retrieval-service/src/harness_docs_retrieval/jscompat.py` (`JS_WHITESPACE`) - `JS_WHITESPACE = (`
- `docs-retrieval-service/src/harness_docs_retrieval/chunk.py` (`_ATX_HEADING`) - `_ATX_HEADING = re.compile(`

`JS_WHITESPACE` holds U+00A0, U+1680, U+2000 to U+200A, U+2028, U+2029, U+202F, U+205F, U+3000 and U+FEFF as raw UTF-8 characters in the source. `_ATX_HEADING`'s excluded class is written as `[^\n\r` followed by raw U+2028 and raw U+2029 and then `]`. A reader cannot see those characters in a diff, a terminal or most editors: the constant renders as a run of spaces, and the class looks like `[^\n\r]` followed by nothing or by two blanks. An editor or formatter that normalises whitespace, or a copy-paste through a tool that strips U+FEFF, can drop one silently. That would change chunk keys and snippets with no visible diff. These are the two constants the byte-parity guarantee rests on, so they should be spelled so a review can read them.

**Fix:** spell each non-ASCII character as an escape sequence. The values stay the same and nothing else changes. Every snippet below is pure ASCII: each `\uXXXX` is six literal ASCII characters (backslash, `u`, four hex digits) that you type exactly as shown.

- [ ] In `jscompat.py`, replace the whole `JS_WHITESPACE = ( ... )` assignment (the three string lines under the comment that begins `# ECMAScript WhiteSpace plus LineTerminator`) with:

  ```python
  JS_WHITESPACE = (
      "\t\n\v\f\r \u00a0\u1680"
      "\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a"
      "\u2028\u2029\u202f\u205f\u3000\ufeff"
  )
  ```

  These are ordinary (non-raw) string literals, so Python decodes each `\uXXXX` to its code point. The result is the same 25 characters in the same order as the current literal: tab, LF, VT, FF, CR, space, U+00A0, U+1680, U+2000 to U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF. Note the single ASCII space between `\r` and `\u00a0` on the first line; it is the U+0020 entry and must stay.
- [ ] In `chunk.py`, replace the `_ATX_HEADING` assignment with:

  ```python
  _ATX_HEADING = re.compile(r"(#{1,6})[ \t]+([^\n\r\u2028\u2029]*?)(?:[ \t]+#+)?[ \t]*\Z")
  ```

  Keep the `r"..."` prefix. Inside a raw `str` pattern the string holds the literal text `\u2028` and `\u2029`, and Python's `re` module itself reads `\uXXXX` in a `str` pattern as that code point. So the class excludes LF, CR, U+2028 and U+2029, exactly what it excludes now.
- [ ] Confirm both edited lines are now pure ASCII: `grep -nP '[^\x00-\x7F]' docs-retrieval-service/src/harness_docs_retrieval/jscompat.py docs-retrieval-service/src/harness_docs_retrieval/chunk.py` must print no line from the `JS_WHITESPACE` assignment or the `_ATX_HEADING` assignment.
- [ ] Leave the test files' literal characters as they are. This finding covers the two `src` constants only.
