### Task 20 — Mirror the new templates into this repository's self-adopted `scripts/`, `harness-runs/` and `.gitignore`

**Goal:** This repository has adopted its own harness, so its `scripts/`, `harness-runs/` and `.gitignore` are `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`). Bring that output in step with the templates this branch changed, byte for byte, so this repository's own runs have the wrapper, the directories and the ignore rule the new phase needs.

**Depends on:** Tasks 1, 3 and 4. The templates to mirror, all repo-relative:
- **Task 1:** `cli/templates/scripts/run-test-suite.sh` (mode `0o755`).
- **Task 3:**
  - the four READMEs `cli/templates/state-dir/test_run_logs/README.md`, `…/test_fix_plans/README.md`, `…/test_fix_plan_reviews/README.md` and `…/test_fix_point_reviews/README.md`;
  - `cli/templates/state-dir/README-root.md`, whose copy here is `harness-runs/README.md`;
  - the managed-block lines the generator renders for `stateDir` = `harness-runs`: a comment, then `harness-runs/test_run_logs/*` and `!harness-runs/test_run_logs/README.md`.
- **Task 4:** `cli/templates/state-dir/scratch/README.md`, whose copy here is `harness-runs/scratch/README.md`, and `cli/templates/scripts/scratch-run.sh`.

### Targets

- `scripts/run-test-suite.sh` (new).
- `scripts/scratch-run.sh`.
- `harness-runs/test_run_logs/README.md`, `harness-runs/test_fix_plans/README.md`, `harness-runs/test_fix_plan_reviews/README.md`, `harness-runs/test_fix_point_reviews/README.md` (all new).
- `harness-runs/README.md`, `harness-runs/scratch/README.md`.
- `.gitignore` → the `autonomous-sdlc-harness` managed block.

**Work:**

- [ ] `scripts/run-test-suite.sh`: copy the template byte for byte and set mode `0o755`.
- [ ] `scripts/scratch-run.sh`: replace it with the template's bytes. Only the header comment differs.
- [ ] The four new `harness-runs/<dir>/README.md` files: copy them byte for byte from their templates.
- [ ] `harness-runs/README.md` and `harness-runs/scratch/README.md`: replace each with its template's bytes.
- [ ] `.gitignore`: insert the template's `test_run_logs` comment and its two rules, rendered for `harness-runs`, immediately after the `harness-runs/scratch/*` / `!harness-runs/scratch/README.md` pair inside the managed block. Touch no line outside that insertion, including the hand-added `.claude/settings.autonomous.json` rule.

**Verification:**

- `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh` and `cmp cli/templates/scripts/scratch-run.sh scripts/scratch-run.sh` both exit 0. So do the six `cmp` pairs for the READMEs: the four new directories, `cli/templates/state-dir/README-root.md` against `harness-runs/README.md`, and `cli/templates/state-dir/scratch/README.md` against `harness-runs/scratch/README.md`.
- `git check-ignore -v harness-runs/test_run_logs/feat_x/task_round_1.log` names the new rule, and `git check-ignore harness-runs/test_run_logs/README.md` exits non-zero, so the README stays committable.
- `diff -rq cli/templates/scripts scripts` reports no newly differing file beyond the pre-existing `test.sh` / `typecheck.sh` rendering differences and the files that exist on one side only.

**Deviations from plan:** `scripts/run-test-suite.sh` was copied byte for byte (`cmp` exits 0) but its mode is still `0644`: `chmod 755 scripts/run-test-suite.sh` was refused as needing approval, and the file was not routed through any other command to get the mode. The committing role sets the executable bit when staging (`git update-index --chmod=+x scripts/run-test-suite.sh`, or a `chmod` an operator approves); `commands.*` strings call it through `bash`, so the mode does not change how it runs.
