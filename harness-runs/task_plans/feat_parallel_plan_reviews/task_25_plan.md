### Task 25 — Mark `Parallel plan reviews` done in `ROADMAP.md` and restate `Parallel dispatch in waves`

**Goal:** Record the roadmap item as shipped in the words it now means — the gates fan out, the round node joins, and the plan writer reads every findings file — and keep the index and the neighbouring row true.

**Depends on:** Task 3 (the walker's fan-out and join), Task 12 and Task 15 (both loops' cores dispatching a round's gates together), all of which this row describes as shipped.

**Where this task stops.** `ROADMAP.md` only; `docs/development.md` → `## 6. The roadmap this tree defers to` numbers its own items and names neither row (`git grep -n "Parallel plan reviews" -- docs` prints nothing).

### Targets

- `ROADMAP.md` → the `## Index` table, and the `## Flow and orchestration` rows `Parallel plan reviews` and `Parallel dispatch in waves`.

**Work:**

- [ ] `Parallel plan reviews`: set the status to `Done` and restate the description as shipped — in the task-plan loop and the user-review fix-plan loop a round's gates fan out together and the round node joins them; the plan writer reads every findings file of the round; it builds on **Converging plan reviews**. Drop *"or a merging agent (possibly a new one) folds them into one"*.
- [ ] `Parallel dispatch in waves`: *"On the planning side it starts with **Parallel plan reviews**."* becomes: on the planning side, **Parallel plan reviews** already runs a round's plan gates as one wave. `## Index`: remove the `Parallel plan reviews` row and renumber the entries after it down by one, as the merge that marked **Converging plan reviews** done did (`git show 4c8791e7 -- ROADMAP.md`), leaving every other entry's link and order unchanged.

**Verification:**

- `grep -n "Parallel plan reviews" ROADMAP.md` shows the flow row ending `| Done |` and the `Parallel dispatch in waves` row, and no index row.
- `grep -n "merging agent" ROADMAP.md` finds nothing.
- The index's priority column runs without a gap from 1 through its last contiguous entry (`sed -n '/^## Index/,/^## /p' ROADMAP.md`).
