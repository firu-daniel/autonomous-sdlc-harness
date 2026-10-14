### Task 6 — Resolve the docs catalog review index to the next free slot

**Goal:** Fix defect 4. The docs-catalog engine starts every slug's review at `i=0` unconditionally, in two places:

- `## Per-entry loop (walk `[ ]` entries top-to-bottom)` step 2: "(start `i=0`)";
- `## Final entry — INDEX`: "`review_<i>.md` (start `i=0`)".

A catalog run over a slug that already holds reviews (the `existing:` refresh case) overwrites committed `review_<n>.md` files, and the always-present `index` slug collides on every run after the first. After this task, both sites resolve `<i>` to the next free index in the slug directory, which is the rule `plugin/instructions/docs_phase_instructions.md` already states. The justification there ("legitimately starts at `i=0` … because it is the *first* pass over a slug") is removed.

### Targets

- `plugin/instructions/docs_orchestration_instructions_autonomous.md`
- `plugin/instructions/docs_phase_instructions.md`

**The wire.** `docs-reviewer` takes `findings_path` and `iteration` from the caller and writes to exactly `findings_path` (`plugin/agents/docs-reviewer.md` → `## Invocation contract`). Its contract does not change. Only the caller's `<i>` changes: list `<state_dir>/docs_catalog/reviews/<slug>/`, take one past the highest `review_<n>.md`, or `0` when the directory is absent or empty. Pass `findings_path = <state_dir>/docs_catalog/reviews/<slug>/review_<i>.md` and `iteration=<i>`. The fix loop's `i+1` counts up from that resolved start. The cap of 3 counts **fix attempts**, not the index value.

**Work:**

- [ ] `docs_orchestration_instructions_autonomous.md` → `## Per-entry loop (walk `[ ]` entries top-to-bottom)` step 2: replace "(start `i=0`)" with the next-free resolution. In step 3, say "re-review at the next index (`i+1`, still next-free)" and that the cap of three counts attempts.
- [ ] Same file → `## Final entry — INDEX`: replace "`review_<i>.md` (start `i=0`)" with the same resolution against `<state_dir>/docs_catalog/reviews/index/`.
- [ ] `docs_phase_instructions.md` → `## Loop` step 2 → the **Resolve `<i>` to the next free index** bullet: delete the sentence beginning "The catalog loop legitimately starts at `i=0`" through "because it is the *first* pass over a slug". Restate the reason as one rule: both engines resolve next-free, because a slug may already hold reviews from the catalog, from a refresh or from an earlier branch. Keep the rest of the bullet, including the `ls` instruction, the worked `i=2` example and the one-line opening note.

**Verification:**

- `git grep -n -E -e 'start .?i=0' -e 'legitimately starts' -- plugin` returns nothing.
- `git grep -n 'docs_orchestration_instructions_autonomous.md' -- plugin/instructions/docs_phase_instructions.md`: every remaining pointer into the catalog engine still names a heading that exists, byte-identical, in that file.
- On paper, a refresh of slug `x` holding `review_0.md`, `review_1.md` reviews at `review_2.md`. An INDEX entry on the second catalog run reviews at one past the first run's highest index.
