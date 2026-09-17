### Task 10 — Mark the three roadmap rows `Done` and renumber the `ROADMAP.md` index

**Goal:** Record in `ROADMAP.md` that this branch delivered *README summary and checklist*, *Compact the README* and *`llms.txt`*. Mark each of their three area-table rows `Done`, remove the three entries from `## Index`, and renumber the remaining entries consecutively from 1, keeping their current order.

**Depends on:** Tasks 5, 6, 8 and 9. The roadmap marks work `Done` only once the README opening, the compaction, `llms.txt` and its check have all landed. Each is complete by the time this task runs.

**Where this task stops.** `ROADMAP.md` only. The roadmap's priority numbers are a different vocabulary from `docs/development.md` → `## 6. The roadmap this tree defers to`'s item numbers, and this task touches neither that legend nor any `item <N>` citation. Nothing else in the tree cites a `ROADMAP.md` index number. Scope-register derivation entry 3 reaches only the README's link to the file, and that link is unaffected. Row descriptions, section headings and the index's `(#section)` anchors stay as they are.

### Targets

- `ROADMAP.md` — `## Index`, and the rows in `## Documentation` and `## Engines, environments and integrations`.

**Work:**

- [ ] `## Documentation`: change the `Status` cell of the **README summary and checklist** row and the **Compact the README** row from `Open` to `Done`.
- [ ] `## Engines, environments and integrations`: change the `Status` cell of the **`llms.txt`** row from `Open` to `Done`.
- [ ] `## Index`: delete the three rows whose feature links read *README summary and checklist*, *Compact the README* and *`llms.txt`*. Renumber the `Priority` column of the remaining rows `1, 2, 3, …` in their existing top-to-bottom order, with no gaps and no reordering, and leave each row's feature link text and anchor unchanged.

**Verification:**

- `git diff dev -- ROADMAP.md` shows only three `Open` → `Done` status cells, three deleted index rows and the renumbered `Priority` cells. No feature text, description or anchor changes.
- The index's `Priority` column reads as consecutive integers starting at 1: read the column top to bottom, and every value is one more than the value above it.
- The index's feature order equals `dev`'s order with the three entries removed. Compare `grep -n "^| [0-9]" ROADMAP.md` against the same grep on `git show dev:ROADMAP.md`, ignoring the number column.
- `git grep -n -i -F -e "ROADMAP.md" -- . ":!harness-runs" ":!ROADMAP.md"` still reaches only sites that cite the file, not an index number.
