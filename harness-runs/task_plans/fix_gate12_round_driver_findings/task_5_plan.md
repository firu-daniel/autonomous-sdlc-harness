### Task 5 — Align FR3 and FR6 in `docs/development.md` and `docs/sandbox-verification.md` §10, and re-derive the FR3 `--list` row

**Goal:** Make the two documents of record say what the driver now grades. FR6's `placed` clause is graded only where the parked job's bundle holds a planning file, and is otherwise printed as context. FR3 fails on a wrapper's refusal line, because `Push the branch` concludes `success` on one. The restated `--list` table carries FR3's new note, re-derived from `--list`.

**Depends on:** Task 2. That task leaves the driver with the following behaviour, which this task restates.

- **FR3.** It fails a job whose `Run the harness` step log carries a `commit-on-branch.sh` refusal line, or whose `Push the branch` step log carries a `push-branch.sh` refusal line. A refusal line is either `<script>: refusing to …: <reason>` or `<script>: <reason> — refusing to …`. `push-branch.sh` exits 0 on every refusal, so the step concludes `success`.
- **FR6.** It is graded on the save line, the no-`skipped` rule and the restore line. With a `placed <n> planning file(s)` line present, that clause is graded as before. With none, the driver reads the parked job's `harness-state` artifact at `planning/`:
  - no planning file there passes, with the context clause `placed: none to place, the park preceded any plan file`;
  - one or more fails;
  - an expired artifact is `expired`.
- **The FR3 `--list` note** is now exactly `commits and pushes through the wrappers, graded on the job: line of the Run the harness step log and on a wrapper's refusing line, since push-branch.sh exits 0 on a refusal and Run the harness concludes success even on a failed run`. No other row's note changed.

This task changes prose only. It runs nothing against GitHub and records no result: every **Observed** and **Verdict** cell stays *not yet measured*.

### Targets

- `docs/development.md`:
  - **The rows the driver takes, and how.**, the FR3 table row;
  - **The owed checks.**, the `sandbox1c2` §1, step 6, row FR6 bullet;
  - observation (xvi), the `**FR3**` and `**FR6**` bullets.
- `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round`, table rows FR3 and FR6.

**Work:**

- [ ] `docs/development.md`, the restated table: run `bash scripts/gate12-sandbox-round.sh --list` from this repository's root, and copy FR3's fifth field into the FR3 row's **Note** cell verbatim. Change no other row. Re-derive by comparing every row's Row, Round step and Note against that output, and fix nothing else unless it differs (goal 3).
- [ ] `docs/development.md`, the FR6 owed-check bullet and the (xvi) `**FR6**` bullet.
  - **Expected.** Keep the save half as it is. The next job logs `restored the bundle of run <id>`, and `placed <n> planning file(s)` **where the parked job's bundle holds a planning file**. When it holds none, as on a park raised before any plan file exists (this observation's own planning park), the restore prints no `placed` line, and the driver prints `placed: none to place, the park preceded any plan file` as context, not as a graded clause.
  - **Read from** (the (xvi) bullet only) adds the parked job's `harness-state` artifact, at `planning/`, read only when the restore logged no `placed` line.
  - **Source** (the (xvi) bullet only) adds that `verb_restore` prints the `placed` line only when it placed or kept a file.
- [ ] `docs/development.md`, the (xvi) `**FR3**` bullet. Keep the Expected sentence. Add that a wrapper's refusal line is a refused write, and name both spellings: a `push-branch.sh: refusing to push: …` / `… — refusing to push` line in `Push the branch`, and a `commit-on-branch.sh: refusing to commit: …` / `… — refusing to commit` line in `Run the harness`. Add that `push-branch.sh` exits 0 on every refusal (`cli/templates/scripts/push-branch.sh` → **EVERY FAILURE PATH IS NON-FATAL (exit 0)**), so the step's `success` conclusion is not evidence that it pushed. The Read from already names both step logs and is unchanged.
- [ ] `docs/sandbox-verification.md` §10, rows FR3 and FR6. Carry the same two changes into the **Expected** and **Read from** cells, worded as the (xvi) bullets now are, so the two documents state one grading. Leave **Observed** and **Verdict** at *not yet measured*. Add no `|` inside a cell.

**Verification:**

- Run these from the checkout root: `git grep -n -F 'planning file(s)' -- docs/development.md docs/sandbox-verification.md`, `git grep -n -E '\| FR3 \||\*\*FR3\*\*|row FR3' -- docs/development.md docs/sandbox-verification.md` and `git grep -n -E '\| FR6 \||\*\*FR6\*\*|row FR6' -- docs/development.md docs/sandbox-verification.md`. These are the story index's scope-register derivation entries A–C.
  - Every hit inside the Targets above now carries the new text.
  - Every other hit is a dated round record, or another observation's pass condition, and is unchanged.
  - Every hunk of `git diff -U0 -- docs/development.md docs/sandbox-verification.md` falls within the Targets above.
- `bash scripts/gate12-sandbox-round.sh --list`'s FR3 fifth field and the FR3 row's Note cell are the same string. Every other row's Note cell is unchanged in the diff.
- Every row of the restated table still has exactly four cells, and the FR3 Note cell carries no `|`.
- No new line in either document carries a line number, an absolute machine path or a measured result.
