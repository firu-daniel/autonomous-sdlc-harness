### Task 4 — Rewrite `### G.1 Run the gates` for the detached run form and add the uncollected-gate-run clause to the plan core's Done summary

**Goal:** Make G.1 describe what the wrapper now does, and nothing it no longer relies on. The run form is one plain foreground call that returns `pending`, then `--wait` re-issues until a verdict. A gate run in flight is never stopped or re-launched. The rule against ending the turn carries its three measured reasons, and no wall-clock figure appears. Also add the Done-summary clause that reports gate runs this session saw stopped, re-launched or lost.

**Depends on:** Task 1. Its run form starts both gates as a process detached from the calling shell and prints `pending` (exit 3) once `.running` holds that process's PID. When a run of the same label is already in flight, the run form starts nothing and answers as `--wait` would, with `pending` or that run's verdict. `--wait <label>` prints `pending` (exit 3) while the run is live, `pass` / `fail <log>` once it has finished, and refuses with nothing on stdout when no run is in flight. This task restates that contract and edits no script.

**Citations this task writes and does not verify.** Rows BG1, BG2, BG5 and BG6 of `docs/sandbox-verification.md` are created by Task 11, with the contents the story index's `## Context` table fixes. Cite them by those ids and do not open the document. The §2.5 paragraph opening *"A backoff is not a resumption mechanism, and neither is a `Monitor`."* keeps that opening sentence (Task 6), so cite it as today.

### Targets

- `plugin/instructions/plan_orchestration_instructions_core.md`: `### G.1 Run the gates`, and `### D.2 Done summary`'s *"Run gates (Phase G): passed on round N"* bullet.

**Work:**

- [ ] **G.1's numbered steps.**
  - Step 2: run `bash <scripts_dir>/run-test-suite.sh <gate_key>_round_<gate_round>` as one plain foreground command, with no background option and no `timeout` argument, the label resolved before the command is issued. State what it does: the wrapper starts both gates as a process detached from this session and returns at once with `pending`. Where a run of this label is already in flight because an earlier session issued it, and this session re-entered the phase after a pause or a stall-watchdog restart, it starts nothing and answers `pending` or that run's verdict. State also that **this session issues the run form once per label**: every later look at that label within the session is a `--wait`. That keeps G.1 in step with the Done-summary clause's **re-launched** event (*"this session issuing the run form for a label it had already issued it for"*), which then counts only a departure from G.1, never its normal re-entry path.
  - Collect: while the line is `pending`, apply the STOP check and the fork's PAUSE check, incrementing no counter, and issue `bash <scripts_dir>/run-test-suite.sh --wait <gate_key>_round_<gate_round>` as a fresh plain foreground command. Repeat until it prints `pass` or `fail <log>`.
  - Then print the verdict line as step 3 does today.
  - Remove the paragraph *"If the tool layer moves the run to the background, or the run form itself prints `pending` — the first the expected case wherever the suite outlasts the Bash tool's foreground window …"* and the sentence *"If the backgrounded run's own completion arrives first, its line is the same verdict."*
- [ ] **The bullets under the collection loop.**
  - Keep the uncapped-`--wait` bullet: each call is bounded by the wrapper's wait slice, `pending` means only "call again", nothing depends on a wall-clock constant, and the STOP check ends the wait and not the suite.
  - Add a bullet in these terms: **a gate run in flight is never stopped or re-launched, whatever this session believes about a time limit.** No `kill`, no second run form for a label whose `--wait` says `pending`, no relaunch with a background option or a `timeout`. The run is not a tool task, so no tool-level limit applies to it (`docs/sandbox-verification.md` → BG2; Claude Code 2.1.309, macOS).
  - Name **no** duration, no background-limit figure and no `timeout` value anywhere in G.1.
- [ ] **The forbidden-actions bullet.** Keep its opening byte-identical: **`Forbidden here, by name: a `Monitor`, a `sleep` of any length in your own command, and ending the turn with the run in flight.`** `plugin/instructions/unit_loop_core.md` point 6 cites *"G.1 forbids both by name"*. Replace its reasoning with three reasons:
  - (a) a silent session gives the watcher's stall watchdog no output, and a silence longer than `STALL_KILL_SECS` is exposed to a kill-and-resume (`<scripts_dir>/autonomous-watcher.sh` → `check_stalled_runs`), named by tunable and without its value;
  - (b) the STOP and PAUSE checks run on each `--wait` re-issue and nowhere else in this wait;
  - (c) the detached run is not a tool task, so nothing wakes the session when it finishes. With nothing pending, the turn's end is the process's end: `rc=0` with no `PAUSE_ACK`, classified `completed` behind a success notification (`docs/sandbox-verification.md` → BG1; the §2.5 paragraph cited today).

  Add one sentence: a pending background task or `Monitor` wakes the session when it ends (BG5, BG6, Claude Code 2.1.309, macOS). That is observed behaviour of one CLI version, not a mechanism this phase uses. Drop *"A headless `claude -p` session is torn down when its turn ends, a pending monitor dies with it"* and *"Repeated foreground `--wait` calls keep the turn open, so the session, and the backgrounded wrapper it launched, stay alive"*. Keep the `--wait`-refusal bullet and the verdict branching unchanged.
- [ ] **D.2's Run gates bullet.** Its last sentence ends *"… never a remembered number"* with **no closing period** (line 683 today). Append `. ` — a period and one space — and then the Done-summary clause quoted in the story index's `## Context` → **The Done-summary clause**, byte-for-byte, so the two sentences do not run together. The clause begins *"Then report the gate runs this session saw go uncollected"* and ends with its own period, so the bullet now ends *"… never `none` for them."*. Keep the whole bullet on its one line. Task 8 appends the identical clause to the user-review fix core, so copy it exactly and change no word.

**Verification:**

- `grep -nE 'moves the run to the background|torn down when its turn ends|monitor dies with it|foreground window|backgrounded run' plugin/instructions/plan_orchestration_instructions_core.md` prints nothing. The pattern names only the G.1 claims this task removes. The dev-server `torn down` sentences elsewhere in the file (the run-mode-skip bullet before E.0, and *"Confirm the dev server started in Phase E has been torn down."*) are out of scope and stay unchanged.
- Inside `### G.1 Run the gates`, no number followed by `s`, `m`, `min`, `minute`, `second` or `ms` appears, and no `timeout` value: read the section through once for it.
- `grep -c 'Forbidden here, by name: a \`Monitor\`, a \`sleep\` of any length in your own command' plugin/instructions/plan_orchestration_instructions_core.md` prints `1`.
- `grep -n 'gate runs not collected' plugin/instructions/plan_orchestration_instructions_core.md` hits only inside `### D.2 Done summary`.
- `grep -c 'never a remembered number\. Then report the gate runs this session saw go uncollected' plugin/instructions/plan_orchestration_instructions_core.md` prints `1`: the separator is in place.
- G.1 nowhere says this session re-issues the run form for a label it already issued: read step 2 through once for it.
- Every `BG<n>` this file now cites is one of BG1, BG2, BG5, BG6: the ids `grep -oE 'BG[0-9]+' plugin/instructions/plan_orchestration_instructions_core.md` prints ⊆ that set.
- The file still opens on its own H1 with no frontmatter fence, and every `${CLAUDE_PLUGIN_ROOT}/…` citation in the edited sections resolves to an existing file under `plugin/`.
