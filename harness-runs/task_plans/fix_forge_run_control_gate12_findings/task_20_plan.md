### Task 20 — Give the bundle library one move-aside function, so the watcher's pause-note move uses the same body

**Goal:** Prepare item 12's fix where it belongs. The free-name search into `autonomous_logs/remote_superseded/` and the single `mv` currently live inline in `hr_remote_bundle_restore`. This task extracts them into one library function that `hr_remote_bundle_restore` calls, and that **Task 5** then calls from the watcher's `run_job` for `PAUSE_PROGRESS.md`. The algorithm keeps one body and the move-aside directory keeps one writer list. Task 20 ships fifth, after Task 4 and before Task 5. Its number is out of sequence only because it was split out of Task 5 during plan review, and the other task numbers were kept stable.

**Why here and not in the watcher.** `cli/templates/scripts/lib/harness-run-lib.sh`'s header → `THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES`, entry 3 (THE REMOTE STATE BUNDLE), names `autonomous_logs/remote_superseded/` inside its fence. It says the directory is *"Written only by `hr_remote_status_write`, `hr_remote_bundle_write` and `hr_remote_bundle_restore`"*, and that *"Nothing outside this list writes at all; a section that adds a writer adds its entry here."* `.claude/context/conventions.md` → `### Where a new responsibility goes` says a responsibility that already has a home does not get a second one. A second copy of the free-name search in `autonomous-watcher.sh` could drift, and a later move could then land on a directory an earlier move already used.

**Where this task stops.** It adds the function, moves `hr_remote_bundle_restore` onto it, amends the library header, and adds one library case. It does **not** touch `autonomous-watcher.sh`. Calling the function from `run_job`, deciding when the pause note is stale and changing the launch prompt are all **Task 5**'s. The docs are **Task 18**'s.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — a new `hr_remote_move_aside` in the THE REMOTE STATE BUNDLE section, `hr_remote_bundle_restore`'s clarification-directory move, the header's entry 3 and the header's list of writing functions (*"A caller that calls no `hr_lane_*`, … function still gets a library that only reads"*).
- `cli/test/outer-loop-scripts.test.mjs` — one new case beside *"the remote state bundle carries a run through a job restore and a mirror restore, and places no run log"*.

**The interface this task produces (Task 5 restates it):**

```
# hr_remote_move_aside <root> <rel_path>
```

- Resolves `<state_dir>` through `hr_state_dir <root>`. It moves `<root>/<state_dir>/<rel_path>` (a file or a directory) with one `mv` to `<root>/<state_dir>/autonomous_logs/remote_superseded/<epoch>/<rel_path>`. When `<epoch>/<rel_path>` is already taken, it uses the first `<epoch>-<n>` (`n` = 1, 2, …) where it is not, exactly as `hr_remote_bundle_restore` searches today. It creates the parent directories with `mkdir -p` and never removes anything.
- On success, `HR_REMOTE_ASIDE` holds the absolute destination path, so a caller can log it. It is reset to the empty string at entry.
- Exit codes: `0` moved; `1` a missing argument, a `<rel_path>` that is absolute or has a `..` segment, or a failed `mkdir` / `mv`; `2` `<root>`'s configuration is unresolvable (touches nothing); `3` nothing exists at the source path (touches nothing).
- It calls `hr_remote_names_var` itself, so it needs no setup from the caller beyond sourcing the library.

**Work:**

- [ ] Add `hr_remote_move_aside` with the contract above. Put its comment block directly above it, in the style of `hr_remote_bundle_restore`'s, and carry over the free-name search sentence from the paragraph *"THE CLARIFICATION DIRECTORY IS REPLACED WHOLESALE, AND NOTHING IS DELETED"*.
- [ ] Replace the inline `epoch` / `aside` / `n` loop and the `mv` in `hr_remote_bundle_restore` with `hr_remote_move_aside "$root" "$HR_REMOTE_CLARIFY_DIR/$branch"`, mapping a `1` or `2` from it to `return 1`. A `3` is unreachable there because the call stays behind the existing `[ -e "$target" ]`. Drop the locals that are no longer used. Rewrite that paragraph so it says the move is `hr_remote_move_aside`'s, and keep its *"nothing is deleted"* promise.
- [ ] Amend the header in the same edit. Entry 3's *"Written only by"* list gains `hr_remote_move_aside`. Its fence sentence says that the move-aside directory receives the clarification directory **and `PAUSE_PROGRESS.md`**, and that both are moved by `hr_remote_move_aside` alone. Add `hr_remote_move_aside` to the header's list of writing functions as well.
- [ ] `cli/test/outer-loop-scripts.test.mjs`: one case that uses `libCall` on an `init`ed fixture. Plant `PAUSE_PROGRESS.md` and call `hr_remote_move_aside "$@"` with `[dir, 'PAUSE_PROGRESS.md']` twice, planting the file again in between. Assert that both copies sit under `REMOTE.superseded` in two **different** directories (the `<epoch>-<n>` search), that the top-level file is gone after each call, and that a third call with nothing planted exits `3`.

**Verification:**

- `cli/test/outer-loop-scripts.test.mjs`, the one test file this task edits, passes through the single-file test command. Its existing restore cases are the regression for the extraction, the mirror restore's *"the stale answer was not moved aside under remote_superseded/"* in particular. No other suite is run here. Phase G covers the rest.
- `grep -n 'HR_REMOTE_SUPERSEDED_DIR' cli/templates/scripts/lib/harness-run-lib.sh` shows that the variable's assignment in `hr_remote_names_var` and its use inside `hr_remote_move_aside` are the only places it is used. `hr_remote_bundle_restore` builds no aside path of its own.
- Re-read the header's entry 3 and its list of writing functions against the code. Every function that writes under `remote_superseded/` is named there, and nothing else writes there.
- `cli/templates/scripts/autonomous-watcher.sh` is byte-identical to before (`git diff --stat` names only the two targets).
