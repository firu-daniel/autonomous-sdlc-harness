# general review — 2. The per-run profile the launcher reads is chosen by `XDG_STATE_HOME` / `HOME` — iteration 1

Scope checked: `docs/cli.md`, `docs/watcher.md`, the root copies `scripts/launch-sandboxed-gates.sh` and `scripts/autonomous-watcher.sh`, and the task file. `cmp` against `cli/templates/scripts/launch-sandboxed-gates.sh` and `cli/templates/scripts/autonomous-watcher.sh` was run and printed nothing for either pair. A grep over `docs/` for `hr_run_profile_file`, `<unplaceable>` and the deleted header residual found no stale description of the launcher's profile choice. The remaining `hr_run_profile_file` citations (`docs/cli.md`, the paragraph opening "It lives at"; `docs/watcher.md` §5's lane note) describe where the watcher renders the copy, which is still true.

## Nice to Have
1. **Residual 13's bullet now chains three comma clauses, so the job-mode arm reads as part of the "never" clause** — `docs/cli.md` (§6, residual 13, *What that sandbox holds*) — "never one an environment variable places, the base for the main checkout in job mode;"
   The text follows the plan's wording. But with "never one an environment variable places" inserted before the comma, "the base for the main checkout in job mode" can be read as a second thing the profile is *never*. Before the edit the two arms were parallel ("the per-run copy for a run copy, the base for …").
   **Fix:** Separate the arms with a semicolon, or restate the second one: "… (`run_profile`), never one an environment variable places; for the main checkout in job mode, the base;".
