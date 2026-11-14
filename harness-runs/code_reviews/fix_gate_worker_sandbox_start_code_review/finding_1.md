### 1. The run form's header cites BG2 for the new launch shape's survival, which no reading has measured

**File:** `cli/templates/scripts/run-test-suite.sh` (header, `THE WAIT FORM, AND WHY IT EXISTS.` paragraph) — "limit applies to it (`docs/sandbox-verification.md` → row BG2: Claude Code"; its byte-identical copy `scripts/run-test-suite.sh` (same paragraph); and `docs/sandbox-verification.md` → **The Run gates worker start.** table (after row `WS5`).

The header now says the worker is started as "a subshell that ignores HUP and `exec`s it". It goes on to say "A gate run is therefore not a tool task, and no tool-level time limit applies to it", and gives as evidence `docs/sandbox-verification.md` → row BG2 (Claude Code 2.1.309). BG2 measured a different launch: `nohup … </dev/null >/dev/null 2>&1 &` plus `disown`. It found that this process outlived the Bash call that started it and also outlived the session's exit. This branch's own F17 shows that this shape no longer starts on 2.1.325. No reading has yet shown that the new `( trap '' HUP; exec bash … ) &` shape outlives either the call or the session:

- WS2 shows only that the trap arm *starts* and writes its marker.
- In WS4, the worker ran inside the probe's single foreground call. The run form, its `--wait` and the worker's whole `true` gate all finished before `scripts/gate-worker-start-probe.sh` returned, so the worker never had to outlive the call.

The paragraph `HOW THE RUN FORM WAS STARTED DOES NOT MATTER.` ("Whatever becomes of the call that issued the run form, the gates run in the worker") rests on the same unmeasured premise.

A maintainer reading the header would conclude that the shipped shape has been measured to survive past its call, and that conclusion is wrong today. The real-shape reading is this branch's own Run gates phase, which issues the fixed run form from the run copy's session. The story index names that phase as the end-to-end check, but nothing in the record says the reading is still owed.

**Fix:**

1. In `cli/templates/scripts/run-test-suite.sh`, replace the sentence
   ```
   # `pending`. A gate run is therefore not a tool task, and no tool-level time
   # limit applies to it (`docs/sandbox-verification.md` → row BG2: Claude Code
   # 2.1.309, macOS, headless, sandboxed). Every round is collected by
   ```
   with
   ```
   # `pending`. A gate run is therefore not a tool task, and no tool-level time
   # limit applies to it (`docs/sandbox-verification.md` → row BG2: Claude Code
   # 2.1.309, macOS, headless, sandboxed, measured on the former `nohup … &`
   # shape; the `trap '' HUP` shape's survival past its call and its session is
   # owed, row WS6). Every round is collected by
   ```
   Then copy the template over `scripts/run-test-suite.sh` so the two files stay byte-identical, and check this with `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh`.

2. In `docs/sandbox-verification.md`, add this row directly after the `| WS5 |` row of the **The Run gates worker start.** table:
   ```
   | WS6 | macOS, sandboxed, BG2's question for the fixed launch shape: the worker started by `( trap '' HUP; export RUN_TEST_SUITE_WORKER="$label"; exec bash … ) </dev/null >/dev/null 2>>"$start_file" &` plus `disown`, its gates outlasting the Bash call that issued the run form and the session's own exit | the worker runs both gates to a verdict after that call, and after the session, have ended | Not taken. WS4's worker finished inside the probe's one foreground call, so it never had to outlive that call. The first real-shape reading is `fix_gate_worker_sandbox_start`'s own Run gates phase, which issues the fixed run form from its run copy's session. | **owed** |
   ```

3. In the same document's `| F17 |` row, change the Check-rows cell from `WS1–WS5` to `WS1–WS6`.

This fix edits no test file, so it runs no test.
