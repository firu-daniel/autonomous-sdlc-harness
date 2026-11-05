# Task plan review — iteration 2

The findings from `review_0.md` and `review_1.md` are resolved in the files. That covers the three earlier Should Fix items (Task 3's early path, Task 4's `gradeSandboxPrerequisites`, Task 9), the `collect` job, the `docs/watcher.md` step-3 sentences and both Nice to Have items. I re-ran both derivation entries of the Scope register: every file entry 1 reaches, and every row id entry 2 reaches, appears as a row. The finding below is new. It comes from the `unshare` arm that the plan added in response to review_1's Nice to Have 1.

## Must Fix

1. **Task 3's stub world has no `unshare` on `PATH`, so every Linux case that reaches the verification takes the new `unshare not on PATH` arm** — `task_3_plan.md`, `**Work:**` → *"`workflow-sandbox-install.test.mjs`: the stub world"*.
   The plan's step now has this arm: *"**When `unshare` is not on `PATH`** (and `bwrap` is), the failure arm runs with the stderr `unshare not on PATH`, naming it, without running `bwrap`"*.
   - **The world has no `unshare`.** In `cli/test/workflow-sandbox-install.test.mjs` → `world()`, the step runs with `PATH` set to the world's `bin` directory alone (`runStep` → `{ PATH: w.bin }`). That directory holds:
     - symlinks to the real `bash`, `cat`, `grep` and `tee`;
     - the `uname`, `id` and `sudo` stubs;
     - the installer recorders;
     - the `present` stubs.

     The plan adds `mkdir`, `ln`, an `apparmor_parser` recorder and a recording `bwrap` stub. It never adds `unshare`, so `command -v unshare` fails in every world.
   - **Cases that expect exit 0.** (d), (e), both sub-cases of (f), (g) and (i)'s companion all reach the verification on `Linux` with `bwrap` present. Each would exit 1 with `unshare not on PATH`, not 0.
   - **Cases that read `bwrap.calls`.** (f) and (g) assert that the first line of `bwrap.calls` equals `NESTED_USERNS_PROBE.slice(1).join(' ')`. The `unshare` arm never runs `bwrap`, so the file is empty.
   - **Case (h).** It expects the `uid_map` stderr and the `bwrap//&unpriv_bwrap (enforce)` reading. It would get `unshare not on PATH` instead.

   Followed as written, the task cannot meet its own `**Verification:**` bullet (*"`npm test --workspace cli -- test/workflow-sandbox-install.test.mjs` passes"*). This is the same class of defect as `review_0.md` Must Fix 2. Separately, no case exercises the new `unshare`-absent arm.
   **Fix:** In `task_3_plan.md`, in the stub-world bullet:
   - Have `world()` write a helper stub whose file name is read from the owner, never retyped as `unshare`. Use `NESTED_USERNS_HELPER`, added to this file's imports and to the `**Depends on:**` list, or `NESTED_USERNS_PROBE` at the position after `--`.
   - Put that stub in every Linux world by default. The `bwrap` stub decides pass or fail, so the helper stub only has to resolve.
   - Give `world()` an option that leaves the helper stub out.
   - Add one case: `bwrap` present, the helper absent, `uname` answering `Linux`. Assert a non-zero exit, one `::error::` line naming `unshare not on PATH`, and an absent or empty `bwrap.calls`.
   - List that case in the task's `**Verification:**` bullet beside (g)–(l).

## Should Fix

1. **The step's `command -v unshare` gate mirrors `NESTED_USERNS_HELPER`, but neither DECLARED MIRRORS list names it** — `task_3_plan.md`, `**Work:**` → *"**DECLARED MIRRORS:**"*; `task_2_plan.md`, `**Work:**` → *"Update the **DECLARED MIRRORS** list"* (the step-mirror bullet).
   The step tests `unshare` on `PATH` before it runs `bwrap`. That is the same gate `hr_sandbox_prereq_probe_var` mirrors. Task 2 already declares that gate as a mirror of `NESTED_USERNS_HELPER` for the shell probe.
   For the step, both mirror entries list only `BWRAP_USERNS_RESTRICT_PROFILE_PATH`, `APPARMOR_DISABLE_DIR`, `bwrapUsernsRestrictRemedy()`, `APPARMOR_LOAD_COMMAND` and `NESTED_USERNS_PROBE`. `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` says *"a mirror the header does not declare is a defect"*.
   **Fix:** Add `NESTED_USERNS_HELPER` to:
   - Task 3's `harness-run.yml` DECLARED MIRRORS entry;
   - Task 2's step-mirror bullet;
   - Task 3's `**Depends on:**` export list.

   Then have the new case from Must Fix 1 hold the step's gate to the imported name.
