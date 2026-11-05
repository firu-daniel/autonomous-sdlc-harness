### 1. SB2 now grades `pass` while its `clarifications` arm's next-job clause is `not run`

**File:** `scripts/lib/gate12-sandbox-round/grade-state.sh` (`g12_grade_sb2`) — "A next job that never ran is reported `not run` and leaves the planted arm's verdict standing."

**Tests:** `cli/test/gate12-sandbox-round-grade.test.mjs` — the cases "SB2 at its expected shape is pass on both arms, then one source line naming hr_remote_status_write, and SB4 is pass" and "a plain grade over every row at its expected shape exits 0, FR1-FR7 printed not run".

**Problem.** `g12_grade_sb2` keeps the special case it had before this branch. When `g12_sb2_restore_clause` returns `not run` (no later `harness run <branch>` run, the next job not completed, or its `Restore the previous job's state` step not run), the clause is never passed to `g12_fold_add`. The `not run` is only appended to the evidence text through `restore`. Before this branch that did no harm, because SB2's result was forced to `not run` whatever the fold said: its other arms were hand steps. This branch removed that forcing (`g12_result_line SB2 "$G12_FOLD_RESULT" "$evidence"`), so SB2 now prints `row="SB2" result="pass"` when both arms pass and the next job has not run.

That breaks three things:
- `docs/sandbox-verification.md` → `## 10.` → **Reading a result.**, *"A step that did not run makes its row `not run`, never a pass."*
- SB2's own **Expected** cell, which still requires *"the `clarifications` arm's next job restores the rest"*.
- The suite's header rule, *"a step that did not run is `not run`, never a pass"*.

The passing row also writes no evidence record, so the operator sees a bare `pass`. The test that should catch this asserts the defect instead. "SB2 at its expected shape …" stages no next job, because the stub's default `run list` answers `[]`, and it asserts `pass` and that no `SB2.log` evidence file exists. The plain-grade case asserts `SB2: 'pass'`.

**Fix.**

1. In `g12_grade_sb2`, fold the next-job clause like every other clause. Fold it *after* the `pause-note` arm, so that a `pause-note` `not run` or `expired` still decides the row's evidence. Replace the body from `g12_fold_reset 2` through the `g12_fold_add pause-note` line with:

   ```bash
     g12_fold_reset 2
     if [ -z "$G12_SB2_ID" ]; then
       g12_arm_set "$G12_SB2_NOTDONE_RESULT" "$G12_SB2_NOTDONE_WHY"
       g12_fold_add clarifications
     else
       g12_sb2_save_clause "$G12_SB2_ID" "/clarifications/$G12_SB2_BRANCH/gate12-link.md" clarifications
       g12_fold_add "clarifications $G12_STEP_SAVE"
       g12_sb2_bundle
       g12_fold_add "clarifications artifact"
     fi
     g12_sb2pn_arm
     g12_fold_add pause-note
     if [ -n "$G12_SB2_ID" ]; then
       g12_sb2_restore_clause
       g12_fold_add "clarifications next job"
     fi
   ```

   Then delete the `restore=""` local and the line `[ -z "$restore" ] || evidence="$evidence; $restore"`.
2. In the same file's header, change the `SB2` entry to: *"two arms folded, clarifications (its save, its artifact and its next job) and pause-note; `pass` only when every clause passes, so a next job that has not run makes SB2 `not run`; then one `source` line for the remote_status.json variant."*
3. In `cli/test/gate12-sandbox-round-grade.test.mjs`:
   - Rename "SB2 at its expected shape is pass on both arms, …" to "SB2 at its expected shape with no next job is not run, both arms passed in its record, then one source line naming hr_remote_status_write, and SB4 is pass".
   - In that case, assert `sb2.result === 'not run'` and `sb2.evidence.includes('clarifications next job: ')`.
   - Replace `assert.equal(existsSync(evidencePath(fixture, 'SB2')), false)` with a read of that file, asserting it includes `` `[clarifications ${STEP.save}] pass: ` `` and `` `[pause-note] pass: ` ``. Keep the two `skipped … as a symbolic link` assertions against that record rather than against `sb2.evidence`, because a non-passing row's evidence names only the deciding clause.
   - Keep the `source`-line and SB4 assertions as they are.
   - In "a plain grade over every row at its expected shape exits 0 …", change the expected `SB2: 'pass'` to `SB2: 'not run'`.
   - In the file header, replace *"which the grader leaves `not run` beside the planted arm"* with *"which makes SB2 `not run`"*.

   The `pause-note` cases ("… is not run, the whole save log kept", "… its artifact expired is expired", the token `fail` case) and the `clarifications` `fail` case keep their expectations under this ordering, because the `pause-note` clause folds before the next-job clause.

This fix edits one test file, so that file is the only test the fix runs: `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs`, from the repository root, as one plain foreground command. The full gates run later.

- **Deviations from plan:** The `cli` dispatch applied Fix step 3 only (the test file); steps 1–2 edit `scripts/lib/gate12-sandbox-round/grade-state.sh`, outside `cli/`, and belong to this finding's `general` layer. Run after the `cli` half alone, `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs` gave `# tests 32`, `# pass 30`, `# fail 2`. The two failures are the renamed SB2 expected-shape case and the plain-grade case: each still gets `SB2` `pass` from the unchanged grader, whose evidence ends `clarifications next job not run: no later harness run … run`. Rerun the file once the `general` half lands.
- **Deviations from plan:** The `general` dispatch applied Fix steps 1–2 to `scripts/lib/gate12-sandbox-round/grade-state.sh` as written, adding one comment above the moved next-job fold naming why it follows `pause-note`. Rerun after both halves, `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs` gave `# tests 32`, `# pass 32`, `# fail 0`; `bash scripts/typecheck.sh` printed `PASS: typecheck`.
