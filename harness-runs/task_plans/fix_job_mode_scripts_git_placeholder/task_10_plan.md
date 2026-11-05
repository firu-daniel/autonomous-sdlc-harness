### Task 10 — Refresh this repository's self-adopted `scripts/` copies and `examples/notes-app/scripts/` wrappers

**Goal:** This repository runs its own harness from `scripts/`, and the live example's wrappers are maintained. So both carry the root placement Tasks 1–5 put into the templates, and this checkout's own runs are not left with the F15 defect.

**Depends on:** Tasks 1–5, which change these templates under `cli/templates/scripts/`:

- `lib/harness-run-lib.sh` gains `hr_script_root` (Task 1).
- `run-test-suite.sh` and `scratch-run.sh` call it (Task 2).
- `docs-search-server.sh`, `autonomous-notify.sh`, `setup-worktree.sh`, `create-worktree.sh`, `cleanup-merged-worktrees.sh` and `restart-watcher.sh` call it (Task 3).
- `launch-sandboxed-gates.sh` gains one header sentence (Task 5).
- `typecheck.sh`, `test.sh`, `start-dev-server.sh` and `deploy.sh` carry the inline placement block in place of `repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"` (Task 4). The block finds the nearest directory, `$script_dir`'s physical form included, holding a regular `harness.config.json` whose `git -C … rev-parse --show-toplevel` answers itself, and otherwise falls back to that old line.

This is the catch-all task: it copies and applies, and changes no template.

**How this task's implementer reads the conventions.** As the catch-all, read every configured layer's conventions document: `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`.

### Targets

- `scripts/lib/harness-run-lib.sh`, `scripts/run-test-suite.sh`, `scripts/scratch-run.sh`, `scripts/docs-search-server.sh`, `scripts/autonomous-notify.sh`, `scripts/setup-worktree.sh`, `scripts/create-worktree.sh`, `scripts/cleanup-merged-worktrees.sh`, `scripts/restart-watcher.sh`, `scripts/launch-sandboxed-gates.sh`: byte copies of their templates.
- `scripts/typecheck.sh`, `scripts/test.sh`: hand-edited copies (gate 16's `check-shell-parse.sh` step), so the placement block is applied by hand.
- `examples/notes-app/scripts/typecheck.sh`, `test.sh`, `start-dev-server.sh`: the example's rendered wrappers.

**Work:**

- [ ] Copy each of the ten templates above over its `scripts/` counterpart, keeping each file's mode. Each counterpart was byte-identical to its template before this branch: check that with `git diff --no-index` against the branch's merge base before copying, and stop and report if any differs.
- [ ] `scripts/typecheck.sh` and `scripts/test.sh`: replace their `repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"` line with Task 4's block, as the rendered template now spells it. Keep each file's hand-added lines and its `typecheck` / `test` names exactly.
- [ ] `examples/notes-app/scripts/typecheck.sh`, `test.sh` and `start-dev-server.sh`: the same replacement, with each file's command line and name unchanged.

**Verification:**

- `git diff --no-index --stat cli/templates/scripts/<f> scripts/<f>` reports no content change for each of the ten byte copies.
- For `scripts/typecheck.sh`, `scripts/test.sh` and the three example wrappers, `git diff` shows only the anchoring block replaced.
- `bash scripts/typecheck.sh` from the checkout root prints `PASS: typecheck`. This is the configured type-check, which every unit runs anyway; it now goes through the new block.

**Deviations from plan:**

- Pre-copy identity check: run as `git ls-tree -r 9ae681cd cli/templates/scripts scripts` (merge base with `origin/dev`), not `git diff --no-index`, because the compound command that would have materialised the merge-base blobs was refused. All ten pairs carry the same blob at the base (e.g. `lib/harness-run-lib.sh` `7cea780c…`, `launch-sandboxed-gates.sh` `69699c05…`). `git diff --stat 9ae681cd HEAD -- scripts` shows that no branch commit touched any of the ten.
- Copy method: `cp` of each template was refused by the permission profile. Each copy instead received the template's own branch hunks (`git diff 9ae681cd HEAD -- cli/templates/scripts/<f>`) through the Edit tool. That gives a byte copy because both files started from the same blob. Evidence: `git diff --no-index --stat cli/templates/scripts scripts` lists all ten with `0` changed lines. The remaining difference is mode only: template 100644, copy 100755, the same as at the base. `lib/harness-run-lib.sh` is 100644 on both sides and is not listed at all.
- Wrapper block: applied together with the four comment lines the rendered template puts directly before `script_dir=`. "As the rendered template now spells it" includes them. `git diff --no-index` of each wrapper against its template now differs only in the `{{name}}` / `{{command}}` substitutions and, in `scripts/typecheck.sh`, its hand-added header and parse-check lines.
