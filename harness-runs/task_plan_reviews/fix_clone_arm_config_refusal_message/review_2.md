# Task plan review — iteration 2

Both findings from `review_1.md` are resolved. The Must Fix is fixed in `task_2_plan.md`: the three forms are now laid out as two causes, and (ii) is driven through cases (c) and (d). The Should Fix is fixed in `task_3_plan.md`, which now has the clone-arm clause and adds the new suite to the list.

I re-ran the scope register's command entry verbatim. Every hit is already a row: rows 1, 2, 3, 4, 11 and 13–25. I also re-walked the matrix-rows procedure through the §1.1 lead, the §1.1 rows and paragraphs, and the §1.2 and §1.8 rows. Every site it reaches is a row as well: rows 2–10, 12 and 26. No missing site.

## Must Fix
1. **Task 3 would write into `docs/cli.md` that `cleanup-merged-worktrees.sh` does not load the configuration first. It does.** This is in `task_3_plan.md`, in the second sub-bullet of the `docs/cli.md` bullet under `**Work:**`. The same claim also appears in `task_1_plan.md`, in the paragraph "Where this layer's work stops".
   Task 3 tells the implementer to add a clause "for the callers that do not load the configuration first — `launch-sandboxed-gates.sh`, `setup-worktree.sh` and `cleanup-merged-worktrees.sh`". It says that for these callers, when `<main>/harness.config.json` cannot be resolved, the clone arm refuses with the new clause. That is not true of `cleanup-merged-worktrees.sh`:
   - It loads the main checkout's configuration near its top. The comment there reads "Warm the library's per-process cache once, unsubstituted, and make the fail-closed decision here", followed by `hr_config_load "$main_repo" || cfg_status=$?`.
   - On failure it refuses with its own line, `cleanup-merged-worktrees.sh: cannot resolve '$main_repo/harness.config.json' — refusing to delete anything`, at exit 0.
   - It reaches `hr_wrapper_target_check_var "$main_top" "$dir"` (inside `own_worktree_check`) only after that. `main_repo` and `main_top` are checked to be the same checkout just before, at "cannot place this script in a main checkout".

   So an unresolvable configuration never reaches the clone arm from this script. The sentence would put a false statement of behaviour into a document of record (`.claude/context/conventions.md` → `## Documents of record`).

   I checked the other two named callers against the source, and both are correctly placed. `launch-sandboxed-gates.sh` calls `hr_wrapper_target_check_var "$main" "$target" || refuse "$HR_TARGET_REFUSAL"` before its `hr_scripts_dir` / `hr_state_dir` reads. `setup-worktree.sh` in `--target` mode calls the target check before `hr_config_load "$cfg_root"`.

   **Fix:**
   - In `task_3_plan.md`, remove `cleanup-merged-worktrees.sh` from that clause's list of callers. If the clause keeps naming callers, it names `launch-sandboxed-gates.sh` and `setup-worktree.sh` (`--target`) only.
   - In `task_1_plan.md` → "Where this layer's work stops", correct the sentence that lists `cleanup-merged-worktrees.sh` among the callers that print Task 1's new sentence. It already resolves the configuration before its target check, and it prints its own `cannot resolve … — refusing to delete anything` line.

## Nice to Have
1. **Library-internal callers of the target check are not named.** `task_1_plan.md` → "Where this layer's work stops" lists the scripts that reach the clone arm. `hr_wrapper_target_check_var` is also called inside the library itself, from `hr_run_copy_check_var` and from a second call site further down `cli/templates/scripts/lib/harness-run-lib.sh`. Return status stays `1`, so nothing breaks. Naming these callers, or saying the list covers scripts only, would make the reach of the new sentence fully stated.
