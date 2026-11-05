# Review — qa-tester-mobile-mcp
verdict: FAIL

Checked: every `wc -w` figure matches exactly (agent def 1 337; `.claude/CLAUDE.md` 1 695; template 1 320; `harness.config.json` 154; `qa-tester.md` 7 201; maestro stub 1 183; section counts 81/42/74/82/120/56/131/176/259/109/207; `:10–14` = 276). The classification table's rows and columns sum correctly (85 + 541 + 103 + 608 = 1 337). Ledger arithmetic holds (3 186 − 966 = 2 220). The draft the report mentions exists in the session scratchpad (`thin.md`), and `wc -w` gives 371. Citations checked and correct: `ui-tests-plan-writer.md:84`, `ui-tests-plan-reviewer.md:64`, `task_plan_writing_instructions_core.md:259`, `branch-qa-test.md:9`, `README.txt:18-30`, `model.ts:459-467` (the grep key is at `:463`), `harnessConfig.ts:623`, `check.ts:670`, `schema.json:248`, `qa-tester.md:12/14/204`, `plan_orchestration_instructions_core.md:107/135/449`, `init.test.mjs:2137-2143` and `config-command.test.mjs:255`. No-dispatch claim confirmed: no file in `plugin/instructions` or `plugin/commands` dispatches the stub by name. `plugin/docs/AUTONOMOUS_FLOW.md:45` only lists it in a file map. Literal spread confirmed: `no test was executed` appears only in the two stubs; the grep phrase `declared but not implemented in this release` survives in the draft (`thin.md:8` and the error literal), and nothing in `cli/test` reads the stub's prose or its description.

## Must Fix

1. **Wrong fact about the second-order readers.** The report says the plan writer and reviewer "have to infer [no capability set] from 1 337 words of prose" (report:20), and on that basis proposes adding a "Capability set: none declared" line (report:88) and asks Open Q2.
   - Evidence: both readers already state the fact in their own definitions. `plugin/agents/ui-tests-plan-writer.md:105` reads "The two mobile variants are declared but not implemented in this release and state no capability set … its only admissible value is the not-applicable marker". `plugin/agents/ui-tests-plan-reviewer.md:143` says the same.
   - Change: correct report:20. Say the added line is redundant with the readers' own rule, or keep it only as a cross-check. Restate Open Q2: under a mobile driver, the readers could skip the stub read entirely, because their own text already fixes the marker. That saves the whole 1 337 (or 371) words per dispatch, not just 966. It needs an edit to the readers' `## Read first` driver→file map. They also have a `blocker:`-on-unreadable rule (`ui-tests-plan-writer.md:87`), which has to be kept consistent with that change.

## Should Fix

1. **The draft contradicts the report's own "keep" claim.** report:86 says to keep the wrong-driver diagnostic. Today `:12` routes to two variants: `web-playwright` → `qa-tester.md (implemented)` and `mobile-maestro` → `qa-tester-mobile-maestro.md (declared, not implemented)`. The draft row (`thin.md:13`) names only `web-playwright` → `qa-tester.md`, so the maestro routing is lost. Change: restore both targets in the draft row, or state that the report drops the maestro routing on purpose.
2. **The draft mints new error literals.** `thin.md:12-13` fixes `error: phases.qa is not enabled; …` and `error: qa.driver is <qa_driver>; this file is the mobile-mcp variant`. Today only a reason is specified (`:10`, `:12`). Callers parse only the `error:` prefix (`qa-tester.md:73`), so nothing breaks. Change: say these are illustrative, not new wire literals, or phrase them as "reason:" text the way `qa-tester.md:204` does with "e.g.".
3. **Percentage inconsistent with the report's own table.** report:5 says "about 72 % … is maintainer reference". The table gives REFERENCE 541 (40 %), REDUNDANT 608 (45 %), and the two together 86 %. Change: replace 72 % with a figure the table supports.
4. **The draft is not in the report.** The 371-word estimate is grounded only by a scratch file the reader cannot see. Change: inline the draft in a fenced block (about 370 words), or at least its structure. The Thinning plan bullets do not show the description rewrite or the new table literals.
5. **The description is classed as wire but rewritten anyway.** report:37 classes the frontmatter description as WIRE, yet the draft rewrites it (`thin.md:3`). A grep finds no other file quoting it, so a rewrite is safe. Change: reclassify the description as REFERENCE (shown to the dispatcher, but not parsed or quoted), or justify the rewrite explicitly.

## Nice to Have

1. The maestro-diff claim (report:79) leaves out `:50`. The "Never open a browser" bullet differs between the stubs (`diff` shows `50c42`). It also leaves out `:12`, whose routing targets differ in substance, although the two lines match once the driver names are normalized.
2. Batch leads 5, 11, 12 and 13 are not addressed explicitly. All four are trivially n/a here: there is no report artifact, and the CLAUDE.md read list does not apply to a stub that stops before working. One line would close them.
3. `plugin/docs/AUTONOMOUS_FLOW.md:45` ("Interactive-test agents, one per configured driver") reads like one dispatch per driver. It is worth noting, since the report's zero-dispatch finding contradicts that framing.

## Bug claims

- The report makes no explicit pre-existing-bug claim. Its implicit claim, that the stub gives its readers no capability-set fact (report:20), is **REFUTED**: `ui-tests-plan-writer.md:105` and `ui-tests-plan-reviewer.md:143` carry the rule themselves.
- Open Q4 (the stub's driver gate `:12` as dead text): **CONFIRMED as unreachable from any flow**. Dispatch always goes to `qa-tester` (`branch-qa-test.md:9`, `README.txt:18-19`), and `qa-tester.md:14` stops as the terminal outcome. The gate is still reachable by a hand dispatch, as the report notes.
