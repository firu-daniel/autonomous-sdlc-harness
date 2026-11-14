### Task 23 — Restate the fix-plan resume decision and the walker pointers in `docs/converging-plan-reviews.md`

**Goal:** Keep the converging-reviews decision record true now that a round's gates go out together: its fix-plan resume decision restarts the whole round with both gates at once rather than "at its first gate", and its pointers into the walker's decisions name the fan-out record.

**Depends on:** Task 16, whose fix-plan fork's `## Override 2 — resumability` (d) restarts a resumed round with its whole set — both due gates dispatched together — each gate replacing its `review_<k>.md`, at the cost of one gate's review at most and no wall time beyond the round's slowest gate. Task 22, whose `docs/flow-graph-walker.md` carries `### Item 8 — a round's gates fan out, and the round node joins`.

**Where this task stops.** The record's other decisions, its baseline and its measurement method are unchanged.

### Targets

- `docs/converging-plan-reviews.md` → `### A resumed fix-plan session restarts the round at its first gate`, `### The walker's decisions`, `## 2. Known tech debt`.

**Work:**

- [ ] Retitle `### A resumed fix-plan session restarts the round at its first gate` to `### A resumed fix-plan session restarts the whole round` (`git grep -n "restarts the round at its first gate"` finds no other citer of the heading), and restate its **Decision** (*"a resumed round restarts at the business-parity gate"* → restarts with both due gates dispatched together) and **Cost** (*"One parity review at most: the restart repeats the parity gate when the interruption fell after it"* → one gate's review at most, and no wall time beyond the round's slowest gate). Its **Reason**'s *"The task-plan loop can resume at the next due gate"* becomes can dispatch only the gates without a round file.
- [ ] `### The walker's decisions`: add a bullet — the round's fan-out and join, outcome recording by gate, the concurrency guarantee and the `formatVersion` 3 bump — `docs/flow-graph-walker.md` → `### Item 8 — a round's gates fan out, and the round node joins`; restate *"the next-due-gate resume"* in the `### Item 3a` bullet as the resume that dispatches only the gates without a round file. `## 2. Known tech debt`: *"the walker's next-due-gate resume"* becomes the same.

**Verification:**

- `grep -n "first gate\|next-due\|next due" docs/converging-plan-reviews.md` finds nothing.
- `grep -n "Item 8" docs/converging-plan-reviews.md` shows the new bullet.
