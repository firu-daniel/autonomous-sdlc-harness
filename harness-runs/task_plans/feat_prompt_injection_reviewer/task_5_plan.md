### Task 5 — Count `P0` / `R0` in `hr_ledger_phases` when the ledger carries them

**Goal:** Teach the ledger's one shell reader the two new entries, so a GitHub run's progress comment and the watcher's finished/unfinished answer treat an unscreened ledger as planning still pending. A ledger written before this branch keeps its meaning.

**The contract this task mirrors.** Task 11 adds it to `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3 Templates`:
- the task-engine template's `## Planning` gains `- [ ] P0. Untrusted input screened (prompt-injection-reviewer SAFE)` above `P1`;
- the user-review template's `## Fix planning` gains `- [ ] R0. Untrusted input screened (prompt-injection-reviewer SAFE)` above `R1`;
- each may carry indented `  - screened: …` record lines, which are not entries.

Neither entry is ever `[-]`.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — `hr_ledger_phases`, its comment, and the header's mirror paragraph for the ledger templates.
- `cli/test/ledger-phases.test.mjs`

**Work:**

- [ ] **`hr_ledger_phases`.**
  - **The new sets.** Phase 1 becomes `P0 P1 P2 P3` for `task` and `R0 R1 R2` for `user_review`.
  - **The optional ids.** `P0` and `R0` are tested only when the file carries an entry line for them, `- [ ] P0.`, `- [x] P0.` or `- [-] P0.` (likewise `R0`).
    - An absent line is a ledger from before the entry existed, and leaves phase 1 to the other ids.
    - A present `[ ]` keeps phase 1 `pending`.
    - Every other id keeps the existing rule: absent is not settled.
  - **Form.** Record which ids appear while reading, in the loop already there, in bash 3.2 (no associative arrays).
  - **Comments.** Update the function comment to state the optional rule and why. `hr_run_ledger_state` needs no change, because it reads `hr_ledger_phases`.
- [ ] **Header.** In the paragraph that already says `hr_ledger_phases` codes the templates' entry ids, name `P0` / `R0` and their present-only rule.
- [ ] **`ledger-phases.test.mjs`.**
  - Add `P0` to `TASK_IDS` and `R0` to `REVIEW_IDS` where those arrays build all-settled ledgers.
  - Add cases:
    - a task ledger with every id `[x]` but `P0 [ ]` reads phase 1 `pending`;
    - the same ledger with the `P0` line removed reads `done done done done`;
    - a `P0` entry followed by two `  - screened:` record lines parses as one entry;
    - the same three for `R0` on a user-review ledger.
  - Extend the header's red-once list with the mutation that drops the present-only test.

**Verification:**

- `npm test --workspace cli -- test/ledger-phases.test.mjs` passes. This task edits that file.
- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0.
- `git diff -U0 cli/templates/scripts/lib/harness-run-lib.sh` touches only `hr_ledger_phases`, its comment and the header's ledger-mirror paragraph.

**Deviations from plan:**
- Adding `P0` / `R0` to `TASK_IDS` / `REVIEW_IDS` writes an open `[ ]` line for them into every ledger built from those arrays, so the two existing cases that settle phase 1 by hand (`settles a phase on [x] and [-] alike`, `reads the user-review engine and its round`) now also mark `P0: 'x'` / `R0: 'x'`; their expected output is unchanged.
- The red-once mutation was run through `bash scripts/scratch-run.sh harness-runs/scratch/task5_mutation.mjs` against a scratch copy of the library (the guard `case "$seen" in *" $optional "*) …` replaced by an unconditional `p1="$optional $p1"`): unmutated, both line-removed ledgers read `done done done done`; mutated, `task - pending done done done` and `user_review 2 pending done done done`.
- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` was refused as a bare command; the shell-parse evidence rests on `bash scripts/typecheck.sh`, whose `check-shell-parse` step reported `123 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`.
