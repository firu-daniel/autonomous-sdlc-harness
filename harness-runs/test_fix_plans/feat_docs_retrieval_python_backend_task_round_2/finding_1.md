### 1. `heading_slug` generator expression is not in `ruff format` form

**File:** `docs-retrieval-service/src/harness_docs_retrieval/chunk.py` (`heading_slug`), at `base = "".join(`. Near line 57; the line number is a hint only.

**Failing test:** none — 13a Python lint (`bash scripts/python-service.sh lint` runs `ruff check` and then `ruff format --check`; this finding covers the `ruff format --check` half)

**Failure, from the log:**

```
unformatted: File would be reformatted
  --> src/harness_docs_retrieval/chunk.py:58:11
   |
57 |     base = "".join(
   -         ch
   -         for ch in text.lower()
   -         if ch in " _-" or unicodedata.category(ch)[0] in ("L", "N")
58 +         ch for ch in text.lower() if ch in " _-" or unicodedata.category(ch)[0] in ("L", "N")
59 |     ).replace(" ", "-")
   |

1 file would be reformatted, 38 files already formatted
```

**Diagnosis (persisting):** this failure persists from round 1. The round-1 log said "6 files would be reformatted" but showed the diff for only one file. The round-1 fix joined five constructs and could not find the sixth. This is the sixth. The generator expression is the only argument to `"".join(` and has no magic trailing comma. Joined onto one line it is 94 columns, which fits the `line-length = 100` set in `docs-retrieval-service/pyproject.toml` → `[tool.ruff]`, so `ruff format` joins it. The round-1 probe missed it because the joined form does not fit on the `base = "".join(` line itself. The formatter keeps the parentheses and joins only the body. This is a formatting change only, and the behaviour stays the same.

**Fix:** in `heading_slug`, replace the three body lines

```python
    base = "".join(
        ch
        for ch in text.lower()
        if ch in " _-" or unicodedata.category(ch)[0] in ("L", "N")
    ).replace(" ", "-")
```

with

```python
    base = "".join(
        ch for ch in text.lower() if ch in " _-" or unicodedata.category(ch)[0] in ("L", "N")
    ).replace(" ", "-")
```

The joined line is indented by 8 spaces, and the opening `base = "".join(` and closing `).replace(" ", "-")` lines stay unchanged.

- [ ] Join the generator expression as shown, leaving no trailing comma.
- **Deviations from plan:** The finding names no test file (`none — 13a Python lint`), so the row-G.4 check took the fix-site fallback: the fix site still carried the three-line form, and the fix was applied as specified. The `ruff format --check` gate was not run (a unit never runs a gate script; deferred to the Run gates phase). The claim that the joined form is what `ruff format` produces rests on comparing the edited site with the diff in the finding's log, not on running the formatter.
