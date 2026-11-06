# Task plan review — iteration 0

## Must Fix

1. **The `(m)` drivers are `.sh` files, and `scratch-run.sh` refuses every `.sh` file** — `task_4_plan.md`
   `### Targets` names `harness-runs/scratch/sgt_mrows.sh` and `harness-runs/scratch/sgt_forks.sh`. `**Verification:**` runs them with `bash scripts/scratch-run.sh harness-runs/scratch/sgt_mrows.sh` / `… sgt_forks.sh`. `scripts/scratch-run.sh` has no `.sh` row in its interpreter table. `SCRATCH_INTERPRETERS='py:python3 js:node mjs:node cjs:node rb:ruby dart:dart php:php'`, and the comment above it reads *"THE ONE EXTENSION THIS TABLE OMITS ON PURPOSE IS `.sh`"*. Its REPRO block says *"shell probe  mv probe.py probe.sh; same call -> exit 66"*. `plugin/agents/layer-implementer.md` → **The probe route, in every mode.** also says *"(`.py`, `.js`, `.mjs`, `.cjs`, `.rb`, `.dart`, `.php`; never `.sh`)"*. As planned, neither driver can run, so the verification can never pass, and Task 7, which re-runs these drivers, inherits the failure.
   **Fix:** Make both drivers files that `scratch-run.sh` will run, for example `harness-runs/scratch/sgt_mrows.mjs` and `harness-runs/scratch/sgt_forks.mjs`. Each one spawns `/bin/bash <tree>/plugin/hooks/<guard>.sh` with a fixed argument vector and the payload on stdin. Use the new names in `### Targets`, the Work bullets and `**Verification:**`, and keep the output paths and TSV formats as they are, since Task 7 depends on them.

2. **The pieces re-drive driver is a `.sh` file that `scratch-run.sh` refuses** — `task_5_plan.md`
   `### Targets` names `harness-runs/scratch/sgt_redrive_pieces.sh`, and `**Verification:**` runs `bash scripts/scratch-run.sh harness-runs/scratch/sgt_redrive_pieces.sh`. It exits 66 for the reason given in finding 1.
   **Fix:** Rename the driver to an extension the interpreter table carries, for example `sgt_redrive_pieces.mjs`, which spawns `/bin/bash` for each guard. Update `### Targets` and `**Verification:**` to match, and keep `sgt_redrive_pieces.tsv` and its columns as they are.

3. **The config re-drive driver is a `.sh` file that `scratch-run.sh` refuses** — `task_6_plan.md`
   `### Targets` names `harness-runs/scratch/sgt_redrive_config.sh`, and `**Verification:**` runs `bash scripts/scratch-run.sh harness-runs/scratch/sgt_redrive_config.sh`. It exits 66 for the reason given in finding 1.
   **Fix:** Rename the driver to an extension the interpreter table carries, for example `sgt_redrive_config.mjs`. Update `### Targets` and `**Verification:**` to match, and keep `sgt_redrive_config.tsv` and its columns as they are.

4. **Task 7's first Work bullet re-runs four `.sh` drivers through `scratch-run.sh`, and every call is refused** — `task_7_plan.md`
   The bullet **Re-take the evidence, then write from it.** runs `bash scripts/scratch-run.sh harness-runs/scratch/sgt_mrows.sh`, `… sgt_forks.sh`, `… sgt_redrive_pieces.sh` and `… sgt_redrive_config.sh`, and `**Depends on:**` repeats the same `.sh` paths. Each call exits 66, so the task's own rule, *"If a driver or its output is missing, return a blocker"*, parks the record task every time.
   **Fix:** Re-state the four driver paths with the extensions findings 1–3 settle on, in both `**Depends on:**` and the Work bullet's four commands.

5. **Scope register: derivation entry A misses a site that Task 7 rewrites** — `fix_sibling_glob_traversal_story_plan.md`
   Entry A's re-run prints 23 lines, and every one is a register row. But it does not reach `docs/guard-verification.md` → §2.4 inventory row `a`, *"An in-workspace path that is a **symlink out** is accepted by the two rewrite helpers"*. That row describes which arms accept the symlink. `task_7_plan.md` → **§2.4 (a), corrected for a run copy.** rewrites it ("Rewrite the inventory row `a`'s shape … *and* by the sibling `cd` arm"), so the branch changes a corpus site that no derivation entry reaches and no row records. A strictly wider entry A reaches it and one more site:
   - `docs/guard-verification.md` → §2.4 inventory row `a`, *"is accepted by the two rewrite helpers"*. Disposition `change`, Task 7.
   - `docs/guard-verification.md` → §2.5 attribution row *"the same de-quote **moved** out of `hc_git_piece_parts` and into `hc_repo_dir_from_command`, so the anchor is de-quoted and the two rewrite helpers are not"*. Disposition `no-change`, because it is a dated attribution of the de-quote and not an arm description.
   **Fix:** Replace derivation entry A with this strictly wider command. It adds the alternatives `two rewrite helpers` and `exact or space-suffixed`, which reaches both sites above and every site the current entry reaches:
   ```sh
   git grep -n -o -E '.{0,100}(path-anchored|hc_path_anchored_patterns|cd <work_root>/<project_name>-|`cd` arm|cd <link>|sibling-worktree arm|two rewrite helpers|exact or space-suffixed).{0,100}' -- 'docs/**/*.md' 'plugin/**/*.md' '*.md' ':!harness-runs/**' 'harness-runs/lessons.md' 'harness-runs/improvement_suggestions.md'
   ```
   Add the two sites above as register rows. Add inventory row `a` to the rows `task_7_plan.md` → `**Verification:**` lists as Task 7's own (7, 8, 9, 14, 15).

## Should Fix

1. **`task_2_plan.md` suggests a `.sh` scratch probe.** Its first `**Verification:**` bullet says a probe *"may live under `harness-runs/scratch/` and run through `bash scripts/scratch-run.sh harness-runs/scratch/<file>.sh`"*. That call exits 66. Name `<file>.mjs` or `<file>.py` instead.

2. **Two of entry A's pathspecs never match anything** (`fix_sibling_glob_traversal_story_plan.md`). `'harness-runs/lessons.md'` and `'harness-runs/improvement_suggestions.md'` are both excluded by `':!harness-runs/**'`, because git drops a path that any negative pathspec matches. Entry B's procedure is what actually covers those two files. Either remove the two pathspecs, or add a note saying entry B covers them, so a reader does not take entry A as covering them.

3. **Task 1 ships a failing test, and the plan does not reconcile that with the unit loop** (`task_1_plan.md`). The task's deliverable is a committed test file that fails on its hole cases until Task 2 lands. When per-unit review is on, a reviewer that sees a red own test may FAIL the unit, and an implementer may report it as a blocker. State in the file, in a sentence the reviewer will read, that the red run is the recorded deliverable and that Task 2's acceptance is the suite going green. Alternatively, have Task 2 run the suite as its own edited test (it would then edit the `RED ONCE` header's status line), so the red-to-green transition is recorded inside the unit loop and is not deferred to Run gates.

4. **Task 7 edits text that the register does not list** (`fix_sibling_glob_traversal_story_plan.md`). Task 7 also edits the §2.4 **Outcome** paragraph (*"nine open, three closed"*) and the paragraph listing the rows added later (*"Row `h` was added with the bare-`&` separator …"*). These are bookkeeping sentences rather than arm descriptions, so they may fall outside the predicate. Add them as rows anyway, so the register shows every corpus line the branch changes.

## Nice to Have

1. Tasks 4, 5 and 6 commit nothing except their readiness flip, because every target sits under the gitignored `harness-runs/scratch/`. Consider one sentence in each file saying that this is expected and that the committer's flip-only commit is the task's record.
