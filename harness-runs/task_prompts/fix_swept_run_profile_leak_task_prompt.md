`fix_swept_run_profile_leak` makes the sweep that removes a merged run's copy remove that run's per-run profile with it. Today the profile stays on disk for good.

## What happens today

- **The watcher writes one profile per run.** Outside job mode, at every spawn (a fresh launch, a park-resume or a pause-resume), the watcher renders a per-run copy of the base profile and passes it as the one `--settings`. The path is `${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness/run-profiles/<repo slug>/<sanitized branch>.json`. `lib/harness-run-lib.sh` → `hr_run_profile_file <repo slug> <branch>` owns that path, and `autonomous-watcher.sh` → `run_profile_render` writes it (`docs/watcher.md` → `### The per-run profile`).
- **Nothing ever deletes it.** After a merge, `cleanup-merged-worktrees.sh` removes the run's clone through `hr_clone_remove_var` and deletes the merged branch, and that is all. No other part of the watcher, the CLI or `docs/` deletes a per-run profile either.
- **It was observed, not just read off the code.** `docs/sandbox-verification.md` → `## 7. Observed on the watcher's own runs`, row OR9, and the §6 bullet **A swept run leaves its per-run profile behind.** On 2026-10-24, three swept runs' profiles were still under `run-profiles/users-daniel-work-autonomous-sdlc-harness/` (`feat_unattended_sandbox_preflight`, `fix_run_gates_background_run_handling` and `fix_run_gates_answered_park_resume`), each about 40 KB.
- **It is a slow leak, not a hole.** The directory is outside every root a session can write. A reused branch name gets its profile re-rendered at launch, so a stale file is never passed to a session. What it does cost: every finished run leaves a file holding that run's full profile, with its absolute paths, and `run-profiles/` grows without bound on every adopting machine.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

## The goal

1. **The sweep removes the profile with the copy.** When `cleanup-merged-worktrees.sh` removes a run's copy, it then deletes that run's per-run profile. That applies to both arms, a clone and a legacy worktree. Two things must hold:
   - **It finds the file by the same path the watcher wrote it to.** Use `hr_run_profile_file` with the slug the watcher uses outside job mode: `hr_repo_slug "$MAIN_REPO"`, which `autonomous-watcher.sh` assigns to `HARNESS_REPO_SLUG`. Never use a glob or a hand-built path. A slug or branch that `hr_run_profile_file` refuses means nothing is deleted, and the sweep says so in one line.
   - **It never deletes a profile a live run still needs.** Do not delete when the copy was not removed (a refused `hr_clone_remove_var`, or a skipped record), or when the registry still holds a live record for that branch (running, parked or paused). State in the script's header which states are live, and take them from what the watcher itself treats as in flight, not from a new list.
2. **`--dry-run` reports the deletion it would make, and deletes nothing.**
3. **Leftovers from before this fix.** Profiles already left by swept runs are not migrated automatically. Settle in the plan which of two routes to take, and state the reason:
   - the sweep also removes a profile whose branch has no registry record and no copy on disk;
   - or the docs give the one manual command that clears them.
4. **Docs.** `docs/watcher.md` → `### The per-run profile` and `cleanup-merged-worktrees.sh`'s header say when the file is removed. `docs/sandbox-verification.md` §6's bullet gets this branch as its follow-up. Leave OR9's verdict cell as it was observed; a re-observation goes in a new dated note after the §7 table, once a real sweep has run.
5. **Tests.** Extend `cli/test/cleanup-run-copies.test.mjs`, the registry-driven sweep's suite, with the cases below. Its fixtures do not set `XDG_STATE_HOME` today, so give each case a temp directory for it; no test may touch the real machine state directory.
   - a merged clone run's profile is removed together with the clone;
   - a legacy worktree run's profile is removed the same way;
   - `--dry-run` reports the deletion and leaves the file in place;
   - a refused clone removal leaves the profile in place;
   - a branch with a live record keeps its profile;
   - another repository's profile under a different slug is untouched.

## Constraints

- **Change only the sweep's cleanup.** Leave the per-run profile's path, its content, the watcher's render and its launch check (`run_profile_check`) as they are. The profile stays outside every sandbox-writable root.
- **Job mode renders no per-run profile, so it is out of scope.** The same goes for `remote-run.sh start` and `review`, which cut and remove their own clones.
- **Mirror the template and its copy.** The sweep is copied into this repository's own `scripts/` from `cli/templates/scripts/`. Keep the two byte-identical, as the existing mirror tests require.
- `scripts/run-gates.sh` passes.

