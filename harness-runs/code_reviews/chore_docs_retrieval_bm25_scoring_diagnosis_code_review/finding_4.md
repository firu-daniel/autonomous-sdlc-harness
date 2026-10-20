### 4. The document of record names a plan unit, "Task 2", that its reader has no key for

**File:** `docs/retrieval-eval-results.md` (`### What still differs after REINDEX` → **Conclusions, one per lead.**, the first bullet) — "It matches Task 2's `t3` rows"

"Task 2" is this branch's plan vocabulary. The document's stated reader, the maintainer deciding the fix branch's route, has no key that maps it to anything in the document. The parenthesis right after it already cites the subsection that holds those rows (`### The score each index state ranks by`), so the plan name adds nothing.

**Fix:** replace

```
It matches Task 2's `t3` rows for `fixture-catalog`
```

with

```
It matches the `t3` rows for `fixture-catalog`
```

Keep the parenthesised subsection citation that follows. Change nothing else.

This fix edits no test file and runs no test.
