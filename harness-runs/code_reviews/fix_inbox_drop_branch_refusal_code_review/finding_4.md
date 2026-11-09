### 4. The watcher header's `routing` test-plan entry for `README.md` lost one column of alignment

**File:** `cli/templates/scripts/autonomous-watcher.sh` — the header's hand-test block, `routing` entry — "README.md           -> left in place, never archived"

In the `routing` entry every filename's `->` sits in one column (`notes.md             ->`, `trunk_task_prompt.md ->`, `feat_x_docs.md       ->`). The edit that inserted the `trunk_task_prompt.md` lines also rewrote the `README.md` line with one space fewer (11 spaces after `README.md` instead of the 12 it had on the default branch), so its `->` is now one column left of every other entry's.

**Fix:** restore the original spacing — 12 spaces between `README.md` and `->`:

```
#                 README.md            -> left in place, never archived
```

Comment-only; no test run is owed.
