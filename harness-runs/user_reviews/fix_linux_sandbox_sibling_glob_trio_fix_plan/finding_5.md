### 5. The absent-path check cannot take what the owed re-take needs: it truncates its `git status` readings, reads none of Claude Code's built-in paths, has no `dd` row and no control mode

**File:** `scripts/sandbox-absent-path-check.sh` (`write_inspector`) — "cut -c1-240"; (`report`) — "t.replace(\"\\n\", \" / \")[:600]"; (`sweep`) — "git -C \"$C\" status --short --branch >/dev/null 2>&1"; (`write_entries`) — "set -- \"$@\" \"$C/.git/commondir\" \"$C/.git/config.worktree\""; and the header's usage block, "bash scripts/sandbox-absent-path-check.sh run              phases before, A, B, C and D"

**What is wrong.** This was checked against the current tree. The script is hand-written for this repository and is not a `cli/templates/` file.
- The inspector cuts every `git status` reading to 240 characters.
- `report` cuts every session result to 600 characters.
- `sweep` discards `git status`'s output and keeps only its exit code.

Session 2 lost the rest of the post-kill untracked list this way: "The check script truncates that reading, so the rest of the list and the files' types and modes are unmeasured."

The script reads the clone's trio and each `--add-dir` root's `.mcp.json`. It does not read Claude Code's built-in protected paths. It has no row for Finding 1's `dd` proof, and the control was run with a hand-built `jq` line.

**Fix.** Edit only `scripts/sandbox-absent-path-check.sh`, keeping Bash 3.2, `set -u` with no `-e`, and Linux-only refusal. Update its header in the same edit: what it reads, the usage lines, what each subcommand writes, and the exit codes.

1. **Built-in paths.** Add to `write_entries` (and thus to every inspector reading: before, A and B sandboxed and excluded, after-A … after-teardown) each of these paths at the clone's root, `$C/<p>`, unless already listed: `.bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json .claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json .claude/skills .claude/workflows .gitconfig .gitmodules .idea .mcp.json .profile .ripgreprc .vscode .zprofile .zshrc`.
   - Hold them in one variable, with a header comment saying the list is what sandboxed `git status` showed in one 2026-10-30 session (Claude Code 2.1.314). It is **not** Claude Code's definition, which this script cannot read. The user's review rules the session reading out as a source of the definition, so the comment must not call it one.
   - The inspector's existing `stat -c '%F, %s B, %A, %U, mtime %y'` line then records each path's type and mode in every phase.
   - Do **not** add these paths to `write_manifest`. The manifest stays the watcher's (Finding 4: accepted, not swept).
2. **No truncation.**
   - In the inspector, drop `| cut -c1-240` and keep the full `git status --short --branch` output on the one TSV line. Replace newlines with spaces, as now, and keep tabs out of it, e.g. `tr '\n\t' '  '`.
   - In `report`, drop the `[:600]` cut on session lines. Write a `git status` line in full.
   - In `sweep`, record the full `git status --short --branch` output for the clone and the sibling beside its exit code. Keep the exit-code lines in the shape `git status (clone)\texit <rc>` that the AP rows quote, and add the output after a further tab.
3. **The `dd` row (Finding 1's proof).** Add a subcommand, e.g. `write-probe`, run after `run` and before `sweep`, or a phase inside `run` after D. Pick one and document it in the header. It does the following:
   - Records whether `$C/.git/commondir` exists from a plain shell, using the inspector's `stat` form.
   - Starts one session through `session` with one extra `--allowedTools "Bash(dd:*)"`, prompting exactly one call: `dd if=/dev/null of=$C/.git/commondir conv=notrunc`, then one `bash $O/tick.sh W 1 20` call so the session is still alive.
   - While that session lives, polls from the plain shell for up to the tick's length for `$C/.git/commondir`. Records its `stat` reading, or `absent`, to `$O/write-probe.txt`, then removes it with a non-recursive `rm -f` **before the session ends**, and records that removal. It waits for the session afterwards.
   - The verdict line is `written` when the plain shell saw the file, and `refused` otherwise. `report` adds a `## Write probe` section quoting the file and the session's `dd` result in full.

   The profile it runs on is `P`, the rendered per-run profile, which after Finding 1 carries no trio `Edit` rule for the clone. Add only the `--allowedTools` departure. Write nothing else.
4. **The control as a documented option.** Add a subcommand, e.g. `control-profile`. It resolves `P` as `run` does and writes `$O/control-profile.json`, a copy of `P` with every `.permissions.deny` string matching `\.git/(commondir|config\.worktree|objects/info/http-alternates)` removed. It prints that path and the number of entries removed. The header documents the control run as
   `SBX_ABSENT_OUT=<dir> P=<that copy> bash scripts/sandbox-absent-path-check.sh run`, then `report`, with no `sweep`. That replaces the hand-built `jq` line. The stamp already records `profile:`. Keep the `jq` filter in the script so the control is reproducible from the tree.

The AP rows' **expectations**, which change with the route, live in `docs/sandbox-verification.md` and are Finding 6's, along with `docs/development.md` → *The absent-path check, by hand*. This finding changes the script only.

- **Deviations from plan:**
  - Fix 3 took the `write-probe` subcommand route (after `run`, before `sweep`). Its session runs on `P` itself through a new `SETTINGS` variable that `session` reads. `run`'s sessions keep `$O/profile.json`. `session` now forwards extra claude arguments, so `--allowedTools "Bash(dd:*)"` is the only departure.
  - Fix 3, added beyond the plan. `write-probe` refuses with exit 2 when `$C/.git/commondir` is already present before the session. Otherwise its `rm -f` could delete a file the probe did not see created. The refusal still records the `before` reading in `write-probe.txt`.
  - Fix 3, polling. The plain-shell poll (up to 20 s, once a second) starts only after the `dd` tool_use appears in `session-W.jsonl`, waiting up to 120 s for it as phase D does, because model start-up alone can take longer than the tick. A `dd call` line records whether the call reached the stream. The verdict stays `written` or `refused`, as specified. A session that never issued `dd` therefore reads `refused`, and the `dd call` line is what tells the two apart.
  - Evidence downgrade. The script is Linux-only and refuses this macOS host, so no subcommand was run end to end. The evidence comes from a scratch probe (`bash scripts/scratch-run.sh harness-runs/scratch/absent_check_probe.py`). It ran `bash -n` on the script (exit 0). It compiled the `report` heredoc's Python and ran it on a synthetic `<out>`, which confirmed the `## Write probe` section, untruncated session results past 600 characters, and the sweep's `git status` output column. It ran the `control-profile` `jq` filter and count on sample profiles: three trio deny strings were removed and a non-string entry was kept, and a profile with no `permissions` passed through unchanged. Running `run`, `write-probe` and `sweep` against a held probe clone needs Gate 15's Linux container.
