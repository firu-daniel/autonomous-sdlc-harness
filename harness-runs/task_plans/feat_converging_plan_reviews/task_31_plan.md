### Task 31 — Mark `Converging plan reviews` done in `ROADMAP.md` and make it the base of `Parallel plan reviews`

**Goal:** Close the roadmap item this branch ships, describe what it actually shipped, record that `Parallel plan reviews` now builds on it, and keep the index at the top of the file an order of **outstanding** work.

**Depends on:** Task 30 (`docs/converging-plan-reviews.md`, the decision record the restated row may point at), and every earlier task for the facts the row states: every reviewer in every round (Tasks 2–3, 11–12), converging mode from round 3 (Tasks 10, 15–17), per-round commits in the autonomous fork (Tasks 19–20).

**Where this task stops.** No other row changes status. The numbered legend in `docs/development.md` → `## 6. The roadmap this tree defers to` is a different numbering, of delivered items, and is not touched.

### Targets

- `ROADMAP.md`

**Work:**

- [ ] The `Converging plan reviews` row: status `Done`; description restated to what shipped — every plan reviewer runs every round with one decision point closing it, reviewers run in converging mode from the third round and note anything else as non-gating incidental findings the end-of-branch reviewers follow up, and the autonomous fork commits each round; the same for the user-review fix plan, whose routing stays prose.
- [ ] The `Parallel plan reviews` row: stays `Open`; its description gains that it builds on **Converging plan reviews**, whose round decision point becomes the join and whose sequence of gates becomes the fan-out.
- [ ] The `## Index`: it lists outstanding work only (no `Done` row appears in it today — check each `Done` row's name against it), so remove `Converging plan reviews` from it and renumber the remaining priorities consecutively from 1, keeping their order and links.

**Verification:**

- `grep -n "Converging plan reviews" ROADMAP.md` finds the row with `| Done |` and no index line.
- The index's priority column runs 1, 2, 3 … with no gap or repeat, and `grep -n "Parallel plan reviews" ROADMAP.md` shows its row naming `Converging plan reviews`.
