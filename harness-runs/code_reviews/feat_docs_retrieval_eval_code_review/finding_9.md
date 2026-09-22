### 9. `docs/retrieval.md` → `## What it costs` still describes the index without the size this branch measured

**Site.** `docs/retrieval.md` → `## What it costs`, the third bullet: *"An index that is a second representation of the docs, which is why it is never committed and always rebuildable."*

**The problem.** That list is where the document puts what an adopter pays, and it quantifies the other two entries — *"About 300 MB of runtime per machine"*, a PGlite version pinned exactly. The index bullet is the one that had no number, and this branch measured it: 43.2 MB apparent / 44.4 MB allocated across 985 files for 177 chunks, extrapolating to roughly 366–377 MB at a mature catalog's ~1,500 chunks, plus a 12.2 s cold build (`docs/retrieval-eval-results.md` → `## Cold build and index size`).

The reader this costs: an adopter deciding whether to turn `docs.retrieval` on reads this three-bullet list as the price. It currently reads as about 300 MB once per machine, and the true answer is about 300 MB once per machine **plus a few hundred megabytes per checkout** at catalog scale — the index is per-checkout and every worktree has its own. That is a different decision, and the figure to make it with is now in the tree.

**The fix.** Extend the bullet with a citation rather than a second copy of the numbers, in the form the document already uses for figures it does not own:

> - An index that is a second representation of the docs, per checkout — 43.2 MB for this repository's own 177 chunks, extrapolating to a few hundred megabytes at a mature catalog's size, with a 12.2 s cold build (`retrieval-eval-results.md` → `## Cold build and index size`). It is never committed and always rebuildable, which is why deleting it loses nothing.
