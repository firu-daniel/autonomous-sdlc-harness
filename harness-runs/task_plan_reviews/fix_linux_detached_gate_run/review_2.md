# Task plan review — iteration 2

All four Must Fix findings from round 1 are resolved. Row 35 is now `change`, owned by Task 16. E2 is widened, and rows 75–81 are added. GS2's outside paths are now right for each layout (Tasks 9, 10, 13 and 15). The GS worker script now stores every reading in full. I re-ran E1–E8 verbatim. Every site they reach appears as a row.

## Must Fix

1. **The register misses Phase G's no-verdict-line sites, which Task 5's new launcher branch makes incomplete** — Index structure (`fix_linux_detached_gate_run_story_plan.md`, `## Scope register`), with `task_5_plan.md`

   The register's own candidate classes include *"states the Run gates route"*. E3 reaches that class only through text that names `run-test-suite.sh`, `excludedCommands` or `runsUnsandboxed`. So it misses the sites that state the route's failure branch in other words. Two of them become wrong once Task 5 lands:
   - `plugin/instructions/plan_orchestration_instructions_core.md` → G.1's **Branch on the verdict line:** list, the bullet *"**No verdict line** — the wrapper, or its wait form, printed nothing on stdout → `<escalate>`, … quoting the wrapper's one stderr line."* Task 5's new G.1 step 2 sends a launcher stderr refusal to *"the no-verdict-line case below"*. This bullet names only the wrapper and its wait form as the triggers.
   - The same file → `## Stop conditions`, *"**The Run gates wrapper prints no verdict line** (G.1, the run form or its wait form) — `<escalate>`, quoting its stderr line."* This is the core's list of escalation points. After Task 5, a third trigger exists, the launcher's refusal, and this entry does not name it.

   Task 5's own `**Verification:**` (*"G.1 step 3 and every other step of Phase G are byte-identical to `HEAD`"*) rules out editing the first site. Neither site is a row.

   This is disposition (ii). The wider command below newly reaches these sites. None of them is a register row, and no entry E1–E8 reaches any of them:
   - `plugin/instructions/plan_orchestration_instructions_core.md:3`: the opening paragraph, *"… and the Run gates wrapper in Phase G."*
   - `plugin/instructions/plan_orchestration_instructions_core.md:586`: G.1's **No verdict line** bullet.
   - `plugin/instructions/plan_orchestration_instructions_core.md:731`: the `## Stop conditions` entry above.
   - `plugin/instructions/user_review_fixes_instructions_core.md:3`: the opening paragraph, *"… and the Run gates wrapper in Phase G."*
   - `plugin/instructions/autonomous_pause_and_ledger.md:87` and `:108`: the `G.` / `RG.` ledger lines, *"the Run gates wrapper printed pass"*.
   - `plugin/instructions/plan_orchestration_instructions_autonomous.md:189`: *"`G` — flip once Phase G's wrapper prints `pass`"*.
   - `plugin/instructions/user_review_fixes_instructions_autonomous.md:160`: *"`RG` — once the cited Phase G's wrapper prints `pass`"*.

   The `pass` sites probably take `no-change`, because a verdict is still printed by the wrapper's `--wait`. Each still needs its row and its reason.

   **Fix:** In the story index's `## Scope register`, replace E3 with this strictly wider, read-only command. It was executed for this review:
   `git grep -n -i -e 'run-test-suite\.sh' -e 'excludedCommands' -e 'runsUnsandboxed' -e 'Run gates wrapper' -e 'no verdict line' -e 'its wait form' -e 'the run form' -- plugin docs README.md ARCHITECTURE.md cli/README.md cli/templates/scripts/README.md cli/templates/claude cli/src ':!docs/sandbox-verification.md' ':!docs/work-report-research'`

   Add one row per site above, each with its disposition. Give the two no-verdict-line sites `change`, owned by Task 5. In `task_5_plan.md`:
   - add both sites to `### Targets`;
   - add a `**Work:**` clause, folded into the existing G.1 step 2 bullet so the task stays at 5 bullets or fewer. The **No verdict line** bullet names the launcher's stderr refusal beside the wrapper and its wait form, and quotes the launcher's one stderr line. The `## Stop conditions` entry names the launcher beside *"the run form or its wait form"*;
   - narrow the `**Verification:**` bullet *"G.1 step 3 and every other step of Phase G are byte-identical to `HEAD`"* so it excludes those two sites.

   Re-run every derivation entry afterwards and confirm the closure invariant.

## Should Fix

1. **Not addressed from round 1: "It reads no environment variable for a trust decision" overstates what the launcher does** — `fix_linux_detached_gate_run_story_plan.md` (`## Context`, the paragraph after the launcher's checks) and `task_2_plan.md` (the header sentence after check 12)
   The text is unchanged, and `## Rejected findings` has no entry for it. The launcher reads several environment variables that widen the worker's sandbox if they are set:
   - `XDG_STATE_HOME` / `HOME`, through `hr_run_profile_file` → `hr_lane_dir`. These choose which per-run profile supplies the protected paths;
   - `HOME`, for the `~/` credential masks;
   - `PATH`, to resolve `bwrap` and `setsid`.

   What keeps an assignment prefix from setting them is measured, not structural. An assignment-prefixed call does not match the `excludedCommands` entry, so it stays sandboxed (`docs/sandbox-verification.md` P1b, macOS). **Fix:** Name those reads and that measured ground, with its platform. Note that Linux's matching is owed to Gate 15. Or record a rejection in `## Rejected findings`, with a reason.

2. **Not addressed from round 1: the semi-autonomous `<gate_launcher>` reason claims more than is known** — `task_6_plan.md` (**The two semi-autonomous rows**)
   The row still says the run form's detached worker *"outlives its call on every host"*. That holds only for a session that has no sandbox. A user whose own settings turn the sandbox on under Linux meets F10 in a semi-autonomous flow too. **Fix:** Limit the reason to what `init` writes for that flow, which is no sandbox block, and drop *"on every host"*. Or record a rejection with a reason.

## Nice to Have

1. `task_4_plan.md`, case (g): the `bwrap` stub *"execs the words after `--`, unsandboxed"*. It does not apply `--unsetenv`, and nothing in the fixture sets `RUN_TEST_SUITE_WORKER`. So *"The stub's recorded run shows `RUN_TEST_SUITE_WORKER` as unset"* holds whatever the launcher does. The element-by-element argv assertion is what actually pins the `--unsetenv` words. Either have the case export the variable before it calls the launcher and have the stub apply `--unsetenv`, or drop the clause.
2. `task_13_plan.md`: adding `gate-sandbox` to `JOB_LEGS` makes twelve job legs. The subtest title *"one line per job leg, exactly the eleven, in leg-table order"* in `cli/test/sandbox-probe-git-and-legs.test.mjs` then reads wrong. *"Extend no other assertion"* still allows correcting that title.
3. The catch-all `general` Tasks 7–11 still come before the `cli` Tasks 12–14. The index argues this from dependency order, and every `**Depends on:**` points to an earlier task. As in round 1, it is not raised as a finding.
