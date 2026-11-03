# Architecture review — iteration 2

Iteration 1's Must Fix 1 is resolved. `task_1_plan.md` now targets the `sandboxExcludedCommand` doc comment in `cli/src/generators/profileEntries.ts`, as a comment-only edit that declares the watcher as its one shell mirror. Its Verification bullet and the story index's register row 99 match. Iteration 1's Should Fix 1 is also resolved: `task_3_plan.md` targets both cores' `<repo_root>` `Used at` cells, and register rows 103–104 carry them.

Layer placement, dependency direction and the test-run rule hold across all 14 tasks:
- Tasks 1, 2 and 9–11 stay under `cli/`, and Task 3 under `plugin/`.
- Tasks 4–8 and 12–14 stay under the catch-all (`scripts/`, `docs/`, `examples/`).
- No shell asset or module crosses the `cli`/`plugin` boundary.
- No Verification bullet runs `bash scripts/test.sh`, a gate script, a tree guard, or a test file its task does not edit.

## Must Fix
1. **Task 6 adds a second scratch-profile writer beside the probe's existing one.** Offending file: `task_6_plan.md` (`**Work:**` → *"(b)'s scratch profile, written by a new `sp__bg9_excluded_profile <profile> <entry> <out>` … It is written with `jq`, as `scripts/sandbox-absent-path-check.sh` writes its own copy, to `$SP_TMP/detached-excluded.settings.json`"*). Rules broken: `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"A responsibility that already has a home does not get a second one"*) and the paragraph after its list (*"Before adding a copy of anything, grep for it."*).
   The probe already has one owner for "write a copy of the per-run profile with a `jq` filter applied, under `SP_TMP`": `scripts/lib/sandbox-probe/session.sh` → `sp_scratch_profile <name> <jq filter> [<base, default SP_RUN_PROFILE>]`. It is listed in that file's header and is how four legs already derive their scratch profiles: `legs-refusal.sh` (`sbx_rf3`), `legs-settings.sh` (`sbx_cs8`), `legs-network.sh` (`sbx_net`) and `legs-loopback.sh` (`sbx_lb_ip`, which appends to a list exactly as (b) needs). It writes `SP_TMP/<name>.json`, removes the partial file and refuses when `jq` fails, and prints the path. Task 6 instead adds a separate `jq` writer that copies the shape of a standalone script outside the probe library. That gives the probe two producers of one artifact kind, which can drift (in partial-file cleanup, refusal wording or output location), and the plan never says why the existing helper cannot serve. The task-plan review raised this at iteration 0 (Should Fix 1). It is neither resolved in `task_6_plan.md` nor recorded under a `## Rejected findings` section in the index.
   **Fix:** In `task_6_plan.md`, rewrite the `(b)'s scratch profile` bullet so that `sp__bg9_excluded_profile <profile> <entry> <out>` is a thin wrapper over `sp_scratch_profile`. Pass a name such as `detached-excluded` and the filter `.sandbox.excludedCommands += [<entry>]`, built so that `<entry>` reaches `jq` as a JSON string. Keep `<profile>` as the base argument. Its output is then `$SP_TMP/detached-excluded.json`, so update the bullet's path and the teardown tracking to match. Keep Task 10's contract unchanged: one appended entry, status 1 when `jq` fails. If the helper genuinely cannot serve, say why in that bullet and cite `sp_scratch_profile`, or record the finding under `## Rejected findings` in the story index with that reason.

## Should Fix
_None._

## Nice to Have
_None._
