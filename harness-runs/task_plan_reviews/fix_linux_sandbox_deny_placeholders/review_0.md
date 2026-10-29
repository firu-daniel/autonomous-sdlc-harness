# Task plan review — iteration 0

## Must Fix

1. **Task 3 leaves one watcher pass script without the seam override** — `task_3_plan.md` (and the `Top risks:` paragraph of `fix_linux_sandbox_deny_placeholders_story_plan.md`)
   The index's `Top risks:` says Task 3 "defaults that seam to 'not a placeholder host' in every existing suite, so Linux CI keeps today's results." Task 3's targets do not cover every suite that does this. `cli/test/watcher-keep-awake.test.mjs` → `session(probe)` builds its own pass script, `'. "$1" status >/dev/null'`, then `hr_sandbox_prereq_probe_var() {…DEFAULT_SANDBOX_PROBE…}` and `hr_keep_awake_probe_var() {…}`, then `tick`. It does not go through the helper's `tick`, which is the same shape as the two suites Task 3 does target. Once Task 4 lands, that suite on a Linux CI host would take every bubblewrap arm of `spawn_engine`: the sweep, the clone launch check, the manifest write and the per-pass cap. Task 3's third Work bullet already expects such a file and says to report it "as a file this task did not edit, not edited here". That knowingly leaves the gap the plan's own risk statement says is closed.
   **Fix:** In `task_3_plan.md`, add `cli/test/watcher-keep-awake.test.mjs` → `session` to `### Targets`. In the second Work bullet, install the third override from `DEFAULT_PLACEHOLDER_HOST_PROBE` beside the two existing ones. Add `npm test --workspace cli -- test/watcher-keep-awake.test.mjs` to `**Verification:**`. Extend the `git grep -n 'DEFAULT_PLACEHOLDER_HOST_PROBE'` expectation to name this suite. Then rewrite the grep bullet so a pass script it finds is edited, not just reported. Alternatively, narrow the `Top risks:` claim to the suites actually covered and say why the others are host-independent.

2. **A false grep result is planned into a document of record** — `task_8_plan.md` (and the `## Context` paragraph "Why `config.worktree` differs from the others." in `fix_linux_sandbox_deny_placeholders_story_plan.md`)
   Both say that `git grep -n 'config --worktree\|worktreeConfig' -- cli/templates scripts` "finds only `REPRO` comments", and conclude "so the harness does not create it". Run verbatim, that command also matches executable lines in `cli/templates/scripts/setup-worktree.sh` → `hooks_config_write` (and its copy under `scripts/`):
   - `git -C "$main_repo" … config extensions.worktreeConfig true`
   - `git -C "$top" config extensions.worktreeConfig true`
   - `git -C "$top" config --worktree core.hooksPath "$hooks_dir"`

   The same function also writes `git -C / config --file "$target_gitdir/config.worktree" …` for a `--target` worktree, which this grep does not match. For a `--target` clone it writes `$target_gitdir/config` instead. Task 8 would record the incorrect grep claim in `docs/sandbox-verification.md`, against `.claude/context/conventions.md` → `## Documents of record` ("A measured fact states what was measured, the command and the exact message"). The task prompt's *Constraints* also say "No measured result is invented".
   **Fix:** In `task_8_plan.md`, replace the grep sentence with what the code actually shows. `setup-worktree.sh` → `hooks_config_write` writes `config.worktree` only for a worktree (the plain and the `--target` worktree branches). For a clone it writes the clone's `.git/config`. So no harness code path writes a clone's `.git/config.worktree`. Cite that function rather than a grep. Or cite a grep that is narrowed to a clone and whose stated result is true when re-run. Make the same correction in the index's `## Context` paragraph.

## Should Fix

1. **The sweep's live-run gate does not cover a person's own sandboxed session in the main checkout** — `task_4_plan.md`
   The sweep runs when `running_count` is `0`. That counts only the watcher's own runs. A maintainer's interactive sandboxed Claude Code session in `<main>` on Linux mounts placeholders at the same main-checkout paths the manifest lists, such as Claude Code's own `<main>/.mcp.json`. A sweep at that moment can unlink one mid-call: #94008's cross-process race, against a process the gate does not see. State this as a residual in `task_9_plan.md`'s new **Linux placeholders** residual (derived, not measured), or narrow the sweep so it leaves main-checkout paths alone while such a session may be live.

2. **Task 6's `sweep` subcommand writes outside its output directory** — `task_6_plan.md`
   The script inherits `measure.sh`'s statement that nothing writes into the clone or the main checkout. But its `sweep` phase removes files in both, and `hr_run_copy_check_var` on a clone with a branch syncs that branch into the main checkout (`hr_copy_sync_in_var`). Have the header and usage block say what `sweep` changes.
