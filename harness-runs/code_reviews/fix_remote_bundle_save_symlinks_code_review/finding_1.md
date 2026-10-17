### 1. The library header's write-exception list leaves out `hr_remote_copy_tree`, a new writer

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (the header's `THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES`, entry 3) — "`hr_remote_move_aside`, and nothing there but a writer's own failed temp"; and the header paragraph that opens "# A caller that calls no `hr_lane_*`"

The branch adds `hr_remote_copy_tree <src> <dst>`. It writes: `mkdir -p "$target"` and `cp "$entry" "$target"` for every directory and regular file under `<src>`, into whatever `<dst>` its caller names. The library header tells readers that its own write list is complete. Its preamble says *"Nothing outside this list writes at all; a section that adds a writer adds its entry here."* Entry 3 still ends *"Written only by `hr_remote_status_write`, `hr_remote_bundle_write`, `hr_remote_bundle_restore` and `hr_remote_move_aside`"*. Its fence names only `hr_remote_bundle_write`'s caller-named `<out_dir>`. The later paragraph promises that *"A caller that calls no `hr_lane_*`, … function still gets a library that only reads"*, but its list does not include `hr_remote_copy_tree`. A caller that relies on that promise and calls `hr_remote_copy_tree` directly would write files it was told it could not write.

The branch did update the header for the other new writer, `hr_remote_state_dir_var`, with its `mktemp -d` sentence and its entry in the caller list. It also mentions `hr_remote_copy_tree`'s stderr lines under `FILE DISCIPLINE`. Only its writes are missing. `.claude/context/cli.md` → `## What "done" means here` says: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit."*

**Fix:** edit the header in two places. Do not change any code.

1. In entry 3, replace
   ```
   #      outside it, only the caller-named `<out_dir>` (its `planning/` included)
   #      of `hr_remote_bundle_write` and the caller-named `<out_json>`
   #      of `hr_remote_status_write`.
   ```
   with
   ```
   #      outside it, only the caller-named `<out_dir>` (its `planning/` included)
   #      of `hr_remote_bundle_write`, the caller-named `<dst>` of
   #      `hr_remote_copy_tree` (which `hr_remote_bundle_write` names under
   #      `<out_dir>`) and the caller-named `<out_json>`
   #      of `hr_remote_status_write`.
   ```
   and replace
   ```
   #      `hr_remote_move_aside` alone. Written only by `hr_remote_status_write`,
   #      `hr_remote_bundle_write`, `hr_remote_bundle_restore` and
   #      `hr_remote_move_aside`, and nothing there but a writer's own failed temp
   ```
   with
   ```
   #      `hr_remote_move_aside` alone. Written only by `hr_remote_status_write`,
   #      `hr_remote_bundle_write`, `hr_remote_copy_tree`, `hr_remote_bundle_restore`
   #      and `hr_remote_move_aside`, and nothing there but a writer's own failed temp
   ```
2. In the paragraph that opens `# A caller that calls no`, change
   ```
   # `hr_remote_bundle_write`, `hr_remote_bundle_restore`, `hr_remote_move_aside`,
   # `hr_remote_state_dir_var`, `hr_place_artifact`,
   ```
   to
   ```
   # `hr_remote_bundle_write`, `hr_remote_copy_tree`, `hr_remote_bundle_restore`,
   # `hr_remote_move_aside`, `hr_remote_state_dir_var`, `hr_place_artifact`,
   ```

This is a comment-only edit, so it needs no test run.
