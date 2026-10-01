### 2. Four docstring lines exceed the 100-column limit (E501)

**Sites:** all four are under `docs-retrieval-service/`, and each was grep-verified in the current tree:

- `src/harness_docs_retrieval/chunk.py` (`_make_chunk`), at "`makeChunk`: `anchor` is `None` for the preamble alone, so an empty slug still keys `path#`." Near line 97.
- `tests/ts_bridge.py`, module docstring, at "`cli/dist`, never against a copy of it, and a missing build or a bridge failure fails the test rather". Line 4.
- `tests/test_stubs.py`, module docstring, at "The rule this file exists to enforce: the stubs are a test seam and must agree with the TypeScript". Line 1.
- `tests/test_chunk_parity.py`, module docstring, at "has one source, the eval's `corpora.mjs`, read through the bridge, and the Python side is handed that". Line 7.

**Failing test:** none — 13a Python lint (`bash scripts/python-service.sh lint`; this finding covers the `ruff check` half)

**Failure, from the log** (the log cuts off the start of `ruff check`'s output, so this one E501 is the only error shown in full):

```
E501 Line too long (101 > 100)
 --> tests/ts_bridge.py:4:101
  |
3 | The rule this module exists to enforce: a parity case compares against the compiled TypeScript under
4 | `cli/dist`, never against a copy of it, and a missing build or a bridge failure fails the test rather
  |                                                                                                     ^
5 | than skipping it, because a skipped parity case reads as a passing one.
  |

Found 4 errors.
```

**Diagnosis (new in this round's log; not a regression):** `docs-retrieval-service/pyproject.toml` sets `line-length = 100` and selects `E`. `ruff format` does not rewrap docstrings, so these lines survive formatting. A search of `src/` and `tests/` for lines of 101 or more characters finds exactly the four lines above, which matches `Found 4 errors.` None of the four files changed in the round-1 fix commit. Round 1's log simply did not show `ruff check`'s output, and the round-1 Finding 2 notes had already listed these four lines as over 100 columns. Rewrapping only the prose fixes all four, and the behaviour stays the same.

**Fix:** rewrap each paragraph by moving the overflowing word or words to the start of the next line. Every resulting line is at most 100 columns. Keep the wording as it is.

1. `src/harness_docs_retrieval/chunk.py`, `_make_chunk`. Replace the one-line docstring

   ```python
       """`makeChunk`: `anchor` is `None` for the preamble alone, so an empty slug still keys `path#`."""
   ```

   with

   ```python
       """`makeChunk`: `anchor` is `None` for the preamble alone, so an empty slug still keys
       `path#`.
       """
   ```

2. `tests/ts_bridge.py`, lines 4–5. Move `rather` down a line:

   ```
   `cli/dist`, never against a copy of it, and a missing build or a bridge failure fails the test
   rather than skipping it, because a skipped parity case reads as a passing one.
   ```

3. `tests/test_stubs.py`, lines 1–2. Move `TypeScript` down a line:

   ```
   """The rule this file exists to enforce: the stubs are a test seam and must agree with the
   TypeScript stubs exactly, or the end-to-end comparison measures the stubs instead of the backends.
   ```

4. `tests/test_chunk_parity.py`, lines 7–9. Move `that` down a line, which pushes `read` down from line 8:

   ```
   has one source, the eval's `corpora.mjs`, read through the bridge, and the Python side is handed
   that same config. `self-docs` is this checkout's live `docs/` and conventions documents; both sides
   read the same bytes in the same run, so a moving corpus moves both sides together.
   ```

- [ ] Apply the four rewraps and check that no line in the four files is longer than 100 characters.
- [ ] Change prose line breaks only. Do not change code, the docstring wording or other lines.

**Deviations from plan:** The finding names no test file (`none — 13a Python lint`), so no single-file run was possible and the gate script was not run: the "no line over 100 characters" check rests on `grep -rnE '^.{101,}$' --include='*.py'` over `docs-retrieval-service/src` and `docs-retrieval-service/tests`, which returned no match after the rewraps. The `ruff check` run is deferred to the Run gates phase.
