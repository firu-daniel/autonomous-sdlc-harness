### Task 6 — Add CS8 (b) as a probe-graded half through the watcher's own `run_profile_check`, and grade CS8 (a)'s unreached call as not run

**Goal:** Turn CS8 (b), the watcher refusing an invalid profile, from a hand row into a probe-graded half of the `invalid-profile` leg in `scripts/lib/sandbox-probe/legs-settings.sh`.

- **(b):** call the watcher's own pre-launch check, `run_profile_check`, on a scratch copy of the per-run profile whose `sandbox.failIfUnavailable` is the string `"true"`. Grade `pass` when it refuses and `fail` when it accepts. No run is launched, and the live watcher is untouched.
- **(a):** stop printing `pass` ("recorded") when the call on `<bad>` was refused at the permission layer or never issued.

**Depends on:** Task 1, whose `invalid-profile` description states both halves.

**What the watcher calls, and why the probe may call it.** Before a launch, `spawn_engine` (`scripts/autonomous-watcher.sh`) calls `run_profile_render`, then `run_profile_check <settings file> <copy>`. The probe already sources the watcher read-only and calls this same check: `session.sh` → `sp__render` runs `bash -c '. "$1" status >/dev/null 2>&1; … run_profile_check "$RUN_PROFILE_FILE" "$3" …'`.

- `status` mode prints the registry and tunables. It launches, pauses and removes nothing.
- The check compares `sandbox.failIfUnavailable` to `RUN_PROFILE_SANDBOX_STRICT`'s boolean `true` with jq's JSON equality. So the plan expects a refusal carrying *"does not carry sandbox.enabled true, sandbox.failIfUnavailable true"*, and no watcher finding.
- If the rerun shows an acceptance, `fail` is the finding. It goes to a follow-up task prompt, and this branch never changes the watcher.

**The contract this task produces, which Task 11 tests.**

- **`sp__cs8a_grade <stream> <exact command> <marker written: 1|0>`** → `SP__CS8A_V` and `SP__CS8A_E`:
  - **Marker written `1`:** `pass`, `on <bad> the marker was written: the invalid setting was silently ignored and the call ran unsandboxed` (today's text).
  - **Call not in the stream, or no `tool_result`:** `not run`, `on <bad> the call was not issued: $SP_EVIDENCE`.
  - **Permission layer:** `not run`, `on <bad> the call was refused at the permission layer, so it never reached the sandbox: $SP_EVIDENCE`.
  - **Any other layer:** `pass`, `on <bad> the marker was refused at the $SP_LAYER layer: $SP_EVIDENCE` (today's text).
  - It reads only its arguments and the stream.
- **`sp__cs8b_check <watcher script> <profile> <copy>`** runs in a child `bash -c` that sources `<watcher script> status`, with that sourcing's stdout and stderr discarded, exactly as `sp__render` does. It then calls `run_profile_check <profile> <copy>` and prints `$RUN_PROFILE_REFUSAL` when that returns non-zero. The caller gets:
  - `SP__CS8B_RC`: the child's status (`0` accepted, `1` refused, anything else could not be checked);
  - `SP__CS8B_REFUSAL`: the first line it printed.
  
  It prints nothing itself, and sets no global but these two.
- **`sp__cs8b_grade <rc> <refusal> <control rc> <control refusal>`** → `SP_VERDICT` and `SP_EVIDENCE`. It reads only its arguments, and its arms are taken in this order:
  - **Control rc not `0`:** `not run`, `control did not succeed: run_profile_check refused the unmodified per-run profile: <control refusal>`.
  - **rc `0`:** `fail`, `the watcher's run_profile_check accepted <bad>, whose sandbox.failIfUnavailable is the string "true", so a run launched on it would start unsandboxed (§5 F7)`.
  - **rc `1`, with the refusal carrying `does not carry sandbox.enabled true, sandbox.failIfUnavailable true`:** `pass`, `refused before launch: <refusal>`.
  - **rc `1`, any other refusal:** `not run`, `refused, but not by the sandbox clause: <refusal>`.
  - **Any other rc:** `not run`, `run_profile_check could not be run (exit <rc>): <refusal>`.

### Targets

- `scripts/lib/sandbox-probe/legs-settings.sh`

**Work:**

- [ ] Add `sp__cs8a_grade`. In `sp_leg_invalid_profile`, replace the block that builds `ev` from the `<bad>` session (`if [ -e "$marker" ] … else sp_judge_call … fi`) with a call to it. Keep `launch_err` (the agent CLI's exit and stderr first line) appended to the not-issued evidence. When the `<bad>` session wrote no stream at all, (a) is `not run` with today's `session on $bad did not launch; …` text.
- [ ] Add `sp__cs8b_check` and `sp__cs8b_grade`. In `sp_leg_invalid_profile`, after (a) is graded:
  - **The control:** `sp__cs8b_check "$SP_SCRIPTS/autonomous-watcher.sh" "$SP_RUN_PROFILE" "$SP_CLONE"`.
  - **The measured call:** `sp__cs8b_check "$SP_SCRIPTS/autonomous-watcher.sh" "$bad" "$SP_CLONE"`, on the same `$bad` that `sp_scratch_profile sbx_cs8 '.sandbox.failIfUnavailable = "true"'` already writes under `SP_TMP`.
  - **The grade:** `sp__cs8b_grade` over the two results.
  - (b) is graded even when (a)'s control failed or the `<bad>` profile could not be derived. In the latter case (b) is `not run`, `could not derive the invalid profile …`.
- [ ] Replace the leg's single `sp_result_line invalid-profile CS8 …` exits with one final line:
  - **The verdict:** `fail` when (b) is `fail`; otherwise `not run` when (a) or (b) is `not run`; otherwise `pass`.
  - **The evidence:** `(a) recorded: <(a) evidence>; <control evidence>; (b) <(b) evidence>`, with `(a) not run: …` in place of `(a) recorded: …` when (a) is `not run`.
  - **The departure:** today's (`--settings $bad (failIfUnavailable the string "true"); <sp_departures>`).
  - The early `not run` exits before any session (marker exists, path not literal, helper not written) still print one line. They carry `(b)`'s result when it was taken, and `(b) not taken` otherwise.
- [ ] Remove the `note="CS8 (b), the watcher's launch refusal, stays a hand/record row"` text and every use of it. Rewrite the header paragraph *"CS8 (b), the watcher's launch refusal, needs the base profile edited and a watcher tick; it stays a hand row, and CS8's line says so."* to state the probe form, the read-only `status` sourcing and the three function signatures.

**Verification:**

- `grep -n 'hand/record row\|stays a hand row' scripts/lib/sandbox-probe/legs-settings.sh` returns nothing.
- `grep -n 'autonomous-watcher.sh' scripts/lib/sandbox-probe/legs-settings.sh` shows it reached only through `sp__cs8b_check`, sourced with the `status` argument.
- The leg writes nothing outside `SP_TMP`. The only new file is the scratch profile `sp_scratch_profile` already creates, and teardown removes it with `SP_TMP`.
- By hand, from a temp directory: in a `bash -c` that sources `core.sh`, `judge.sh`, `controls.sh` and this file:
  - `sp__cs8b_grade 1 '<x> does not carry sandbox.enabled true, sandbox.failIfUnavailable true and sandbox.allowUnsandboxedCommands false, and names no sandbox opt-out' 0 ''` prints `pass`;
  - `sp__cs8b_grade 0 '' 0 ''` prints `fail`.
  
  (Task 11 turns these into test cases and drives `sp__cs8b_check` against a stub watcher.)
- The type check (`bash scripts/typecheck.sh`) parses the file.
