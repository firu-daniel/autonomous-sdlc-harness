# Task plan review — round 1

verdict: PASS
review_mode: full

## Should Fix
1. **`task_2_plan.md` and `task_6_plan.md` — nothing measures whether a worker started the new way survives past the call that started it, yet the plan keeps BG2 as the citation for that.** The probe's `detach` arms and its `run-form` leg (the fixture's run form, then `--wait`) all run inside one probe invocation, so they show the `trap '' HUP` worker starting and finishing **within one Bash call**. Phase G depends on more than that. The run form is one call, every `--wait` is a later call, and the header's `THE WAIT FORM` paragraph says "no tool-level time limit applies to it (`docs/sandbox-verification.md` → row BG2 …)". BG2 measured survival past the call and past the session ("It outlived that call and the session's own exit") for the `nohup … &` spelling only. Task 2 rewrites only "the parenthesis naming `nohup`" in that paragraph, so the BG2 citation stays attached to a launch shape BG2 never measured. Task 6's BG2 append also covers start-up only ("the `trap '' HUP` spelling does", i.e. it starts). Do one of the following:
   - (a) Add a reading that spans two calls. For example, Task 2's verification issues the fixed run form against a throwaway lane in one call and `--wait` in a later call. Task 6 then records that reading in WS4 or a WS row of its own.
   - (b) Have Task 2's header and Task 6's F17/BG2 text say plainly that cross-call survival of the new spelling is not measured by the probe, and that this branch's own Phase G round is its first real-shape evidence.

   (`.claude/context/conventions.md` → `## Documents of record`: "A measured fact states what was measured.")

## Nice to Have
1. **`task_4_plan.md` — say how the live run's environment is built.** The live run sets `HOME`, `TMPDIR` and `PATH` for the probe. `cli/test/main-anchor-isolation.test.mjs`, a tree guard over `cli/test/**/*.mjs`, rejects any `process.env` spread in the suite's sources that does not blank the main-repo anchor. If the plan said to spawn through `runBash` from `cli/test/helpers/fixture.mjs`, or to blank the anchor in any spread, the implementer would not first find this out from a failing guard run.
