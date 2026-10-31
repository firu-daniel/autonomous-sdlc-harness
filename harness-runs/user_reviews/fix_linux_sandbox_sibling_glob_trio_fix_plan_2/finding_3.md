### 3. The absent-path check script: `report` tracebacks with no run, the control copy lands in the wrong folder, `write-probe` calls a successful `dd` "refused", and the guard has no row

**File:** `scripts/sandbox-absent-path-check.sh` (`report`) — "python3 - \"$O\" <<'EOF'" and "open(f\"{O}/stamp.txt\").read()"; (`after_teardown`) — "C=/nonexistent"; (`resolve`) — "P=$(ls \"$lane\"/run-profiles/*/*.json 2>/dev/null | head -1)"; (`control_profile`) — "\"$P\" >\"$O/control-profile.json\""; (`write_probe`) — "printf 'verdict\\trefused\\n'"; the header — "Verdict `written` when the plain shell saw the file," and "SBX_ABSENT_OUT=<dir> P=<that copy> bash scripts/sandbox-absent-path-check.sh run"; `docs/development.md` → **The absent-path check, by hand.** — "SBX_ABSENT_OUT=<control out> P=<the path control-profile printed> bash scripts/sandbox-absent-path-check.sh run"

**What is wrong.** Checked against the current tree. The script is hand-written for this repository and is not a `cli/templates/` file.

- **`report` with no run.** `report` runs `python3` straight away. With no `$O/stamp.txt` it fails on `open(f"{O}/stamp.txt")`, which is the `FileNotFoundError` traceback session 2's first attempt hit.

  Of the other verbs that read `$O`:
  - `write-probe` and `sweep` already refuse with one line ("no run under $O" / "no manifest under $O").
  - `after-teardown` does not. It runs `bash "$O/inspect.sh"` with output redirected into `$O`. With no run, that writes an error line into a `.tsv`, or fails on a missing directory, and still exits 0 and prints "recorded".
- **`control-profile` and `SBX_ABSENT_OUT`.** The code already writes `$O/control-profile.json`, and `$O` follows `SBX_ABSENT_OUT` (line 94). The defect is the documented procedure. It runs `control-profile` **without** `SBX_ABSENT_OUT`, so the copy lands in the default folder, which is session 1's (`profile: /tmp/sbx-absent-path/control-profile.json`). The user then has to hand-copy the printed path into `P=` for the control's `run`.
- **`write-probe`'s verdict.** It writes `verdict refused` whenever the plain shell did not see the file. AP8's `dd` exited 0 (`0+0 records out`) and the file simply never reached the disk, so "refused" misnames it. The verdict also ignores the call's own exit status and stderr. Today those appear only in the report's `session W dd result` line, and nothing classifies them.
- **No row for Finding 1's guard.** Nothing measures that a session's `Write` to `<clone>/.git/commondir` is refused by the hook.

**Fix.** Edit `scripts/sandbox-absent-path-check.sh` and `docs/development.md` → **The absent-path check, by hand.** only. Keep bash 3.2, `set -u` with no `-e`, and the Linux-only refusal. Update the script header in the same edit: subcommands, usage lines, what each writes, and the exit codes.

1. **One-line refusals on a missing run.**
   - At the top of `report()`, before `python3`, check for `$O/stamp.txt`. If it is not a file, print `sandbox-absent-path-check: no run under $O; run '$SELF run' first` (with `SBX_ABSENT_OUT=<dir>` when that is how `$O` was chosen) to stderr and exit 2.
   - Give `after_teardown()` the same check on `$O/inspect.sh` and `$O/entries.txt`.
   - Add both to the header's exit-2 list.
   - Leave `write-probe` and `sweep` as they are: they already refuse.
2. **The control copy goes where the control runs, and `run` finds it.**
   - **`control-profile`.** Resolve `P` from the run lane only, never from `$O/control-profile.json`, so it always copies the real per-run profile. Refuse with exit 1 and one line when `SBX_ABSENT_OUT` is unset, saying the control needs its own output folder. Refuse with exit 2 when `$O/stamp.txt` already exists, saying the folder already holds a run. This way the copy can never land in session 1's folder.
   - **`run`.** When `P` is unset on entry and `$O/control-profile.json` is a file, set `P` to it before `resolve`. Print `sandbox-absent-path-check: control run on $O/control-profile.json`. The stamp's existing `profile:` line records it.
   - **`write-probe` and `sweep`.** Never pick the control copy up.
   - **The header's control-run block** becomes:
     ```
     SBX_ABSENT_OUT=<dir> bash scripts/sandbox-absent-path-check.sh control-profile
     SBX_ABSENT_OUT=<dir> bash scripts/sandbox-absent-path-check.sh run
     SBX_ABSENT_OUT=<dir> bash scripts/sandbox-absent-path-check.sh report
     ```
   - **`docs/development.md` → *The control, AP7*.** Replace its three-line block with the same three lines using `<control out>`, and drop the `<the path control-profile printed>` placeholder. In the sentence after the block, say that `control-profile` writes the copy into `<control out>` and `run` takes it from there.
3. **`write-probe` names what it measured.** Capture the `dd` tool call's own outcome from `$O/session-W.jsonl`: the `tool_result` whose `tool_use_id` is the `dd` call's, its `is_error` flag and its full text. Use `python3` or `jq`; `jq` is the script's existing dependency. Append these lines to `write-probe.txt`:
   - `call result \t error|ok \t <full text, newlines as " / ">`, or `call result \t none in the stream`;
   - `verdict \t <outcome>`, where the outcome is graded on the disk first:
     - `written` when the plain shell saw the file;
     - otherwise `not on disk, the call reported success` when the call's result is not an error;
     - `refused` when it is an error (the call errored);
     - `no verdict: no dd call in the stream` when the call never appeared.
   - The call's exit status: the `dd` result text carries no exit code on success. Record `is_error` and, where the result text carries `Exit code <n>`, that number as `exit <n>`.

   Update the header's `write-probe` paragraph to list the four outcomes and to say AP8 is graded on the disk outcome. `report`'s `## Write probe` section already copies `write-probe.txt` line by line, so it needs no change beyond item 1.
4. **The guard's row, AP9: a new `hook-probe` subcommand.** Run it after `write-probe` and before `sweep`.
   - **Start state.** Refuse with exit 2 on no run (the `write-probe` test). Also refuse with exit 2 if `<clone>/.git/commondir` is already present, recording the `before` reading as `write-probe` does.
   - **The session.** Start one session H through `session` with `SETTINGS=$P` (the per-run profile itself) and extra arguments `--plugin-dir "$M/plugin" --include-hook-events`, so the guard under test is this checkout's (`docs/development.md` around line 114 is the precedent for `--plugin-dir` with `--include-hook-events`). Add no `--allowedTools`: the profile's `Edit(//<main>-*/**)` allow already grants `Write` there. The prompt is exactly one call:

     `Call 1. Write, with file_path set to exactly: <clone>/.git/commondir and content set to exactly: gitdir-probe`

     followed by the tick call `bash $O/tick.sh H 1 20`. `prompt_calls` says "Bash", so give this prompt its own short builder.
   - **The poll.** Poll from the plain shell as `write-probe` does, after the `Write` `tool_use` appears in `session-H.jsonl`. If the file appears, record its `stat`, remove it with `rm -f` while the session lives, and record the removal.
   - **What to record, in `$O/hook-probe.txt`.** The `before` line, the `Write call` line, the tool result's `is_error` and full text, any `hook` event lines naming `git-trust-file-guard`, the plain-shell line, `session exit`, and then the verdict:
     - `refused by the hook` when the result is an error whose text carries `git-trust-file-guard:` and the plain shell saw nothing;
     - `written` when the plain shell saw the file;
     - `refused, not by the hook` for any other error;
     - `no verdict: no Write call in the stream` when the call never appeared.
   - **The report.** `report` gains a `## Hook probe` section mirroring `## Write probe`.
   - **`docs/development.md`.** In the by-hand procedure, add `bash scripts/sandbox-absent-path-check.sh hook-probe` between `write-probe` and `sweep` in the first block. Add a sentence that it is AP9, and that it fills AP1–AP9 (the lead paragraph's "AP1–AP8" becomes "AP1–AP9").
   - **If `claude --help` in the container shows no `--plugin-dir`**, which the implementer cannot check on this macOS host, the by-hand procedure must say to take AP9 by hand instead: one interactive `Write` to `<clone>/.git/commondir` in a session on `P`, then `stat` from a plain shell. Write that fallback into the procedure as the alternative.

**Evidence.** The script refuses this macOS host, so no subcommand runs end to end here.
- Run `bash -n scripts/sandbox-absent-path-check.sh`.
- Feed a synthetic `<out>` to the report's Python heredoc and to the new `jq` or Python result extraction, from a scratch probe under `harness-runs/scratch/` through `bash scripts/scratch-run.sh`, as round 1's Finding 5 did.
- Record the downgrade: the live run needs Gate 15's container.
