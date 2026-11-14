### Task 8 — Add the `plan_revisions` run-artifact directory and restate the five plan-gate folder READMEs

**Goal:** Give the plan writers' revision notes a home every adopter's `init` writes, with its own contract README, and make the five plan-gate findings folders' READMEs state what is now true: one file per round per gate, `PASS` included, numbered by the round — and, for the two user-review gates, one subfolder per user-review round.

**Where this task stops.** The writer that fills `plan_revisions/` is defined by **Tasks 13 and 14**, the reviewers that fill the gate folders by **Tasks 15–17**, through the shared contract of **Task 10**; this task only writes what `init` ships about them. This checkout's own copies under `harness-runs/` are **Task 27**'s.

### Targets

- `cli/src/generators/stateDir.ts` — `STATE_DIR_ENTRIES`.
- `cli/templates/state-dir/plan_revisions/README.md` (new).
- `cli/templates/state-dir/task_plan_reviews/README.md`, `cli/templates/state-dir/architecture_reviews/README.md`, `cli/templates/state-dir/business_parity_reviews/README.md`.
- `cli/templates/state-dir/architecture_user_review_reviews/README.md`, `cli/templates/state-dir/business_parity_user_review_reviews/README.md`.
- `cli/test/init.test.mjs` — `ALWAYS_ON_DIRS`.

**Work:**

- [ ] `STATE_DIR_ENTRIES`: add `Object.freeze({ dir: 'plan_revisions' })` in the always-written group, after `architecture_user_review_reviews` — always on, because both plan loops write notes whatever the phase toggles. No new write policy: it takes the table row every other always-on directory takes, so `cli/src/core/writer.ts`'s re-run contract is unchanged.
- [ ] `plan_revisions/README.md` (new), in the shape the sibling READMEs use: one `<branch>/task_plan_revision_<n>.md` per task-plan revision and one `<branch>/fix_plan_<N>_revision_<k>.md` per fix-plan revision of user-review round `<N>`, numbered by the review round the revision **feeds**, so a converging reviewer of round `<n>` reads the note at its own index; written by the plan writer as its last write of a revision, read by the next round's reviewers, never by the orchestrator; committed with the branch (in an unattended run, at each round's end). The mistake worth naming: treating a note as the record of which findings a reviewer raised — the findings files are that record; the note records what the writer changed and why.
- [ ] The three task-plan gate READMEs: one `<branch>/review_<n>.md` per **round**, `<n>` the round number shared by every gate's folder (no longer this folder's next free index); written on `PASS` as well as on `FAIL`, carrying exactly one `verdict:` line, so a file is no longer a failed round and a round count is a count of `verdict: FAIL` lines; a file is replaced only by its own reviewer re-running an interrupted round. Restate `task_plan_reviews/README.md`'s *"only when it has findings to write: a verdict of PASS touches no disk"* and *"Files appear one per failed gate"*, and keep its closing mistake (a second pass that starts at zero) — now prevented because the walker's `start` continues the round numbering from the round files on disk, even though the loop counter starts at 0 on every `start`.
- [ ] The two user-review gate READMEs: `<branch>/user_review_<N>/review_<k>.md`, `<N>` the user-review round (`1` for the unsuffixed review), `<k>` the fix-plan round shared by both gates' folders; a `PASS` writes a file too; restate the reader sentence (*"re-dispatched in revision mode with the path to the newest fi…"*) as the writer receiving every file of the round.
- [ ] `init.test.mjs`: add `'plan_revisions'` to `ALWAYS_ON_DIRS`, so the existing case asserting each always-on directory and its README — and the suite's second-`init`-changes-nothing assertion over the same tree — cover it.

**Verification:**

- `npm test --workspace cli -- test/init.test.mjs` passes — this task's own edited test file.
- `grep -n "only when it has findings\|touches no disk\|one per failed gate\|next free" cli/templates/state-dir/task_plan_reviews/README.md cli/templates/state-dir/architecture_reviews/README.md cli/templates/state-dir/business_parity_reviews/README.md cli/templates/state-dir/architecture_user_review_reviews/README.md cli/templates/state-dir/business_parity_user_review_reviews/README.md` finds nothing.
