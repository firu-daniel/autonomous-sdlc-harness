### 2. Round 1's claim that "the sandboxed shell could already write" the run copy's trio is disproved by AP8: correct it everywhere it stands, and document the new guard

**File:** `cli/src/generators/writeProtection.ts` (`COPY_GIT_PATHS` row type, the `bubblewrapDenyWrite` doc comment) — "Nothing is lost: the sandboxed shell could already write the path there"; `cli/templates/scripts/autonomous-watcher.sh` and its self-adopted copy `scripts/autonomous-watcher.sh` (the `THE PER-RUN PROFILE.` header block above `RUN_PROFILE_COPY_GIT_PATHS`) — "Nothing is lost: the sandboxed shell could"; `docs/cli.md` §6 residual 12 → "**What a run cannot rely on:**" — "the sandbox or the file tools refusing a write to the three run-copy trust files: neither does on a bubblewrap host"; `docs/sandbox-verification.md` §5 F9's follow-up cell — "**The trio's `Edit` rules** (this branch's user-review round, from AP7)"; `ARCHITECTURE.md` — "`hooks.PreToolUse[]` with `matcher: \"Bash\"`"; `docs/guard-verification.md` — "All six guards register on `PreToolUse` under the `Bash` matcher", `### 2.3 Fail-closed matrix, with positive controls` and `### What a later change owes this section`

**What is wrong.** Checked against the current tree.

Round 1 justified dropping the run copy's own trio `Edit` rules on a bubblewrap host with the claim that the sandboxed shell could already write those paths. The claim stands in three places:
- `writeProtection.ts`, around line 132;
- both copies of the watcher header, around line 2312;
- `docs/cli.md` residual 12, which says neither the sandbox nor the file tools refuse a write there, and that "until then sandboxed git in that copy follows a planted `commondir`".

AP8 (2026-10-31, Claude Code 2.1.316, bubblewrap 0.8.0) measured otherwise. A sandboxed `dd if=/dev/null of=<clone>/.git/commondir conv=notrunc` reported success (`0+0 records in / 0+0 records out`, session exit 0), yet a plain shell found the path `absent through 21 s of polling`. The shell did not land the file. What does stand is the file tools' route, which Finding 1's guard closes.

Two documents still describe the guard set as Bash-only:
- `ARCHITECTURE.md`'s tool-guard envelope row names only `matcher: "Bash"`.
- `docs/guard-verification.md` opens with "All six guards register on `PreToolUse` under the `Bash` matcher".

The user constraint applies: *nothing explains AP8's mechanism*. Where the write went is unmeasured.

**Fix.** This is prose and comments only. Change no code path, no `_README` string and no test expectation. A `_README` change would need the notes-app rendering re-rendered by hand.

1. **`writeProtection.ts`, the `bubblewrapDenyWrite` doc comment.** Replace "Nothing is lost: the sandboxed shell could already write the path there, and the trust …" with these points, in this order:
   - A sandboxed shell did **not** land such a file on disk: AP8, 2026-10-31, Claude Code 2.1.316, bubblewrap 0.8.0, where `dd` reported success and the plain shell found the path absent. The mechanism is unmeasured.
   - The file tools, which the base's sibling-glob `Edit` allow reaches, are refused by the plugin's `plugin/hooks/git-trust-file-guard.sh` instead of by an `Edit` rule. An `Edit` rule would mount the placeholder.
   - A planted file is still refused by the trust check and the launch check, both failing closed.

   Keep the comment's existing cites. Doc comments only, so the compiled output's behaviour is unchanged.
2. **The watcher header, in both `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh`.** Make the same replacement in the `THE PER-RUN PROFILE.` block. Keep the two files byte-identical (`diff -q` shows them identical today).
3. **`docs/cli.md` §6 residual 12, "**What a run cannot rely on:**", first bullet.** Restate it as two facts plus a derivation:
   - **The sandbox.** On a bubblewrap host no `denyWrite` entry names the run copy's trio, yet a sandboxed `dd` did not land `commondir` on disk (measured: AP8, 2026-10-31, Claude Code 2.1.316). Whether every sandboxed write route is closed is not measured. The one route tried left nothing on disk, and its mechanism is unknown.
   - **The file tools.** No `Edit` rule names the trio there. `plugin/hooks/git-trust-file-guard.sh` refuses `Edit`, `Write` and `NotebookEdit` on it on every platform (derived from the code until Finding 4's owed AP9 row is taken).
   - **A planted file.** It is still refused at launch and by the wrappers.

   Replace "until then sandboxed git in that copy follows a planted `commondir`, inside the sandbox only" with what still holds: that is true only of a `commondir` planted by a route neither the sandbox nor the guard closes, and none is known. Mark this *derived*.

   In the residual's lead paragraph, add **2026-10-31, Claude Code 2.1.316** to the list of measured sessions.
4. **`docs/sandbox-verification.md` §5 F9's follow-up cell, after "**The trio's `Edit` rules** (this branch's user-review round, from AP7) …".** Add a sentence: **The file tools' guard** (the round after, from AP8). AP8 measured that a sandboxed `dd` did not land the run copy's `commondir` on disk (2026-10-31), so the shell was never the route round 1 assumed. The plugin's `git-trust-file-guard.sh` refuses `Edit`, `Write` and `NotebookEdit` on the trio and on paths under it, on every platform, with no sandbox mount. The `Edit` rules stay as round 1 left them. Owed: the guard's row, AP9, and AP1–AP6 on the head this round produces.
5. **`ARCHITECTURE.md`, the tool-guard envelope row.** Name both matchers: `matcher: "Bash"` for the six command guards, and `matcher: "Edit|Write|NotebookEdit"` for the file-tool guard, whose payload carries `tool_input.file_path` / `tool_input.notebook_path` rather than `tool_input.command`. In the `[shipped]` paragraph below it, add one clause: the file-tool guard is the one guard outside the jurisdiction rule.
6. **`docs/guard-verification.md`.**
   - In the opening paragraph, say that six guards run on every Bash call and the seventh runs on every file-tool call. The §1.2 composite is still the Bash-call figure.
   - Under `### What a later change owes this section` (line 1346), or as a new `### 2.6 The file-tool trio guard` matrix, record its decision matrix in the file's row style. Use the rows Finding 1's suite and REPRO block drive (`deny` / SILENT per payload), labelled as reproduced decisions.
   - In `### 2.3 Fail-closed matrix, with positive controls`, add `git-trust-file-guard.sh`'s fail-closed cells — payload will not parse → `deny`, `jq` absent → `deny`, configuration column not applicable (it reads none) — labelled as reproduced decisions from Finding 1's suite and REPRO block, not as measured with fault injection. Finding 1 step 3 narrows `plugin/hooks/README.md`'s "is measured … in `docs/guard-verification.md` §2.3" claim to match.
   - Its per-call latency is **owed**, taken by hand outside any session. Do not record a wall-clock figure measured inside this run.
