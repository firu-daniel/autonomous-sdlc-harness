### Task 1 — Add the one sentence on what `watcher.log` carries when the per-run profile renders and passes its check

**Goal:** Add one sentence to `docs/watcher.md` → `### The per-run profile` saying what `watcher.log` carries when the per-run profile renders and passes its launch check. Every claim in it must be true to `cli/templates/scripts/autonomous-watcher.sh` on the local, job-mode and bubblewrap paths. Nothing else in the document changes.

**Scope.** This is a catch-all (`general`) task. Its one target is under `docs/`, so read `.claude/context/conventions.md`, which holds the `general` layer's rules and the documents-of-record rules. Change no source file. The task prompt confines the change to `docs/watcher.md`, so do not edit `docs/cli.md` §6's matching paragraph, `docs/development.md` FR1 or `docs/sandbox-verification.md`'s FR1 row. The story index's `## Scope register` records each of those as `no-change`, with its reason.

### Targets

- `docs/watcher.md`: one new paragraph of exactly one sentence. It goes directly after the paragraph that opens *"Claude Code silently ignores a `--settings` file that fails its validation under `-p`…"* and ends *"…is the per-run profile's base-validity residual in `docs/cli.md` §6 → *"Residuals, stated rather than hidden"*."*, and directly before the paragraph that opens `**On a bubblewrap host (Linux, WSL2),**`.

**Work:**

- [ ] **Check the three facts in the code before writing.** Use `cli/templates/scripts/autonomous-watcher.sh`, which is the template; `scripts/autonomous-watcher.sh` is this checkout's `init` copy and is identical in these functions. Each fact is stated here as found during planning:
  - (a) `run_profile_render` and `run_profile_check` contain no `log` call. A pass prints nothing. A failure only sets `RUN_PROFILE_REFUSAL`, and `spawn_engine` passes that to `spawn_refuse`, which logs `not launching '<branch>': <reason>`.
  - (b) `launch_run` logs `launching headless run for '<branch>' (engine=…) in … (log: …)` **before** it calls `spawn_engine`. So a render or check refusal, or a bubblewrap clone's `hr_run_copy_check_var` refusal, which also runs inside `spawn_engine` before the render, logs its `not launching '<branch>'` line **after** the launch line. `launching headless run` is logged only by `launch_run`, the fresh local launch. Every other `spawn_engine` caller logs its own line before its spawn instead, and that spawn renders, checks and records the profile the same way:
    - `resuming parked run '<branch>' (answers … found) in …`: the park-resume, `begin_park_resume`'s caller;
    - `resuming paused run '<branch>' (RESUME trigger found) in …`: the pause-resume;
    - `stall-watchdog: '<branch>' -> reset to the last commit and resume (restart #<n>)`: the stall-watchdog relaunch (`spawn_engine "$b" "$worktree" "$log_path" "" 1`). It runs in job mode too. A `stall-watchdog: reset failed for '<branch>' … — resuming anyway` line can come between it and the spawn;
    - `job: auto-resume <n>/<max> of '<branch>' after <why>, in <s>s`: the job-mode automatic resume (`spawn_engine "$branch" "$worktree" "$log_path" "" 1`). A `job: the hosted time budget's PAUSE was pending … — re-dropped it` line can come between it and the spawn;
    - in job mode's own dispatch: `job: launching run for '<branch>' (engine=…) in … (log: …)` on a fresh launch, `job: resuming parked run '<branch>' (answers …) in …`, or `job: resuming paused run '<branch>' in …`.

    None of the lines that can come in between is a render or check line, or a `not launching` line, so they do not affect the sentence.
  - (c) `spawn_engine` writes `run_profile` (`registry_set "$branch" run_profile "$settings_file"`) only outside job mode, and only after `run_profile_check` passed. A failed write is itself a `not launching` refusal. Job mode renders no copy and writes no `run_profile`.
- [ ] **Write the sentence to the code, not to the prompt's wording.** The prompt says *"with no `not launching '<branch>'` line before it"*, but the order in the code is the reverse: write **after it**. Scope the `run_profile` claim to outside job mode. Name `launching headless run for '<branch>'` as the fresh local launch's line. Cover **every other** spawn path from (b) with one generic clause, such as "or the line a resume, a stall-watchdog restart or a job logs in its place". Do not give a partial list of exact lines: a sentence that names some of them reads as complete and becomes false on the paths it leaves out. One sentence that meets this, offered as a starting point and not as required wording:

  > A render and a check that pass log nothing of their own: the record that both passed is the line logged before the spawn — `launching headless run for '<branch>'` on a fresh local launch, or the line a resume, a stall-watchdog restart or a job logs in its place — with no `not launching '<branch>'` line after it, because that line is logged before `spawn_engine` renders and checks, and outside job mode the run-registry record's `run_profile` field names the rendered file, which job mode neither renders nor records.

  Keep it one sentence. Cite symbols the way the surrounding paragraphs do, with backticked function names and no line numbers. Do not reword the paragraph before it or the one after it.

**Verification:**

- Re-read `launch_run` and confirm the `launching headless run` `log` call comes before its `spawn_engine` call. Re-read `spawn_engine`'s non-job arm and confirm `run_profile_render`, `run_profile_check` and the `run_profile` `registry_set` run in that order, each failure going through `spawn_refuse`. Confirm the job-mode arm calls neither `run_profile_render` nor the `run_profile` `registry_set`. The new sentence contradicts none of these.
- List every `spawn_engine` call site in the template with the read-only `git grep -n 'spawn_engine "' -- cli/templates/scripts/autonomous-watcher.sh`. The pattern matches the call lines, not the comments that mention `spawn_engine`. For each hit, read back to the `log` line its caller writes before the spawn. Confirm the new sentence covers that line, either by name (`launching headless run for '<branch>'`) or through its generic clause (a resume, a stall-watchdog restart, a job). Also confirm that nothing between that line and the spawn is a `not launching` line. Invariant: every hit's preceding line is one the sentence covers. A hit whose line the sentence does not cover means the sentence must change before it is written.
- Reading the bodies of `run_profile_render` and `run_profile_check` in `cli/templates/scripts/autonomous-watcher.sh` finds no `log` call in either. This is what makes "log nothing of their own" true.
- `git diff docs/watcher.md` adds lines and removes none. The added lines are the new sentence and the blank line that separates it as a paragraph. They sit between the "Claude Code silently ignores…" paragraph and the `**On a bubblewrap host (Linux, WSL2),**` paragraph.
- `git diff --name-only HEAD` lists `docs/watcher.md` and no other file this task wrote.
