### 4. The watcher's REPRO table lost a column of alignment on the `a resume` row

**File:** `cli/templates/scripts/autonomous-watcher.sh` (the header's REPRO table) — "#   a resume     from a `parked` record"

When the new `no sandbox` REPRO entry was inserted, the next row was rewritten from `#   a resume      from` (six spaces) to `#   a resume     from` (five spaces). The other rows ("#   a guard       with", "#   no sandbox    `a drop`") start their description in one column. This row now starts one column to the left of them, and of its own continuation lines.

**Fix:** restore the sixth space, so that the line reads exactly:

```
#   a resume      from a `parked` record whose run wrote question_1.md,
```

This is a comment-only edit to a template. It runs no test.
