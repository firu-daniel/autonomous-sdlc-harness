### 3. The Python cost bullet in `docs/retrieval.md` names only the refresh-that-wrote trigger for the `REINDEX`

**File:** `docs/retrieval.md` (`## What it costs` → the **Python backend** list) — "The same `REINDEX INDEX` of the BM25 index after every refresh that wrote anything"

The bullet Task 7 added gives the rebuild's trigger as *"after every refresh that wrote anything"*. That is half of the rule. `refresh_index` also rebuilds on an unchanged refresh whenever `index_state` is not `rebuilt`. That covers every database an earlier version of the service left, so the first refresh after an upgrade takes the rebuild's lock even when the corpus has not changed. The README paragraph the bullet cites (`docs-retrieval-service/README.md` → **The end state, and the lock it takes.**) states both triggers. The bullet itself does not, and its first clause stands alone.

**Fix:** in that bullet, replace

```
after every refresh that wrote anything, run against
```

with

```
after every refresh that wrote anything, and after any refresh whose `index_state` is not `rebuilt` (the first refresh of a database an earlier version left included), run against
```

Change nothing else in the bullet. This is a prose-only edit, so no test file is touched and no test is run.
