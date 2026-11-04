### 1. Round step 7 never tells the operator to answer SB2's parked job, so SB2's next-job clause can never be graded in a round taken as written

**Site:** `docs/development.md` → **Gate 12** → **The sandbox series round (#170 step 4) — not yet run.** → step 7, the sentence *"Once every planted job has ended, grade them, every row or the rows named:"* (line 1230 at review time, a navigation hint only).

**Problem.** Row SB2 of `docs/sandbox-verification.md` → `## 10.` expects *"… the step ends `success`, and the next job restores the rest"*, read from *"… and the next job's `Restore the previous job's state` step log"*. The driver is built to take that clause, but only if a person answers the planted job's question, and the gate text never says so.

- **The plant makes the job park on purpose.** `scripts/lib/gate12-sandbox-round/plants.sh` → `g12_plant_sb2` writes the task prompt *"… N is not decided: ask how many before writing it."* under the comment *"The limit left unset is what makes the first job park, so its bundle is saved."*
- **The grader reads the job after the park.** `scripts/lib/gate12-sandbox-round/grade-state.sh` → `g12_sb2_restore_clause` looks for *"the first `harness run <branch>` run created after the planted one"* and checks its `Restore the previous job's state` log for `restored the bundle of run <SB2 run id>`.
- **Only an answer creates that job.** A parked job ends with `job: parked stop` (`cli/templates/scripts/autonomous-watcher.sh` → `run_job`, `echo "job: $final $decision"` with `final=parked`, `decision=stop`). It does not chain a continuation. The next `harness run <branch>` run is the `--resume answer` dispatch that `/autonomous-sdlc-harness:branch-answer`'s GitHub route sends.
- **The gate text omits that step.** Step 7 goes from `plant` straight to *"Once every planted job has ended, grade them"*. Step 10 then deletes the SB2 branch through `teardown`. Nothing in steps 7–10 says to answer SB2's park. A search of `docs/development.md` for SB2 together with "answer", "park" or "next job" finds only the restated row text under **The owed checks.**

**Runtime symptom.** An operator who follows the round as written runs `plant` and then `grade`. SB2 always prints `not run`, with evidence `next job not run: no later harness run <branch> run`, and `teardown` at step 10 then removes the branch. The row's "the next job restores the rest" clause is never measured, and nothing in the gate shows it could have been. Taking it afterwards means planting SB2 again.

**Proof.**
- `plants.sh`, `g12_plant_sb2`: `# The limit left unset is what makes the first job park, so its bundle is saved.`
- `grade-state.sh`, `g12_sb2_restore_clause`: `# The next job is the first \`harness run <branch>\` run created after the planted one.`, and `g12_arm_set "not run" "no later harness run $G12_SB2_BRANCH run"`.
- `docs/development.md` step 7, the text this branch added between `plant`'s command block and the `grade` command block: `- SB2 \`clarifications\`: a token file at the root, and a link to it at \`<stateDir>/clarifications/<branch>/gate12-link.md\`, the second link the row names.` and then `Once every planted job has ended, grade them, every row or the rows named:`. Neither says anything about answering.

**Fix.** In `docs/development.md`, step 7, insert this paragraph immediately before the sentence *"Once every planted job has ended, grade them, every row or the rows named:"*, at the same three-space list indentation:

```
   SB2's planted job parks on its task prompt's question, as the plant intends. Answer it through `/autonomous-sdlc-harness:branch-answer`'s GitHub route, as step 6 answers the full run's park; any answer will do. The answered job is the next job SB2's row reads: `grade` takes its `Restore the previous job's state` step log, and prints SB2's next-job clause `not run` until that job has ended. Answer it before step 8, which waits until no other run is in flight, and before step 10's `teardown` deletes the branch.
```

Change no other text. No `cli/test/` change is owed: `cli/test/gate12-sandbox-round-docs.test.mjs` asserts the restated row table, not this paragraph.
