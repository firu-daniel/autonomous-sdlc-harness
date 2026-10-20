### 3. `docs/retrieval-eval.md` points at a results-file heading with no file name, so a search of the file it sits in finds nothing

**File:** `docs/retrieval-eval.md` (`### The BM25 index-state probe`, the refresh-level launcher paragraph) — "The refresh-level launcher re-takes `### The candidate end-state rule, at refresh level`"

`### The candidate end-state rule, at refresh level` is a heading in `docs/retrieval-eval-results.md` and appears nowhere in `docs/retrieval-eval.md`. The same subsection also cites bare headings that *are* in `docs/retrieval-eval.md` (`### The Python backend`, a few lines below). So a reader who searches the file they are reading for the cited heading finds nothing. The subsection's first line does name the results file, which is why this is graded Should Fix: the target exists, but the pointer does not say where.

**Fix:** in that sentence, replace

```
The refresh-level launcher re-takes `### The candidate end-state rule, at refresh level`: it drives each
```

with

```
The refresh-level launcher re-takes `docs/retrieval-eval-results.md` → `### The candidate end-state rule, at refresh level`: it drives each
```

Re-wrap the paragraph to the file's line width if needed. Change no other word.

This fix edits no test file and runs no test.
