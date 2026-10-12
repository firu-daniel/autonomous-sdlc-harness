# Review — task-plan-reviewer
verdict: FAIL

Counts checked: every Read-tree figure and every section total in the prose-classification table re-run with `wc -w` / `sed -n 'a,bp' | wc -w`; all match exactly (e.g. agent 6 038, conventions.md 5 864, plugin.md 4 174, lessons 1 199, sections 80–100 = 1 044, 90–99 = 532, 161–170 = 373). Up-front total 25 853, after 21 545, delta 4 308 (−17 %) are arithmetically correct. Template = 629 words, confirmed.

## Must Fix

1. **The proposed `report_path` sixth key misses a script and test wire contract.** The report says "The caller should compute `report_path` … and pass it as a sixth key" and "No test, hook or script greps the agent's prose". For this node the "caller" that computes the index is the flow walker script, not the orchestrator: `cli/templates/scripts/flow-walker.sh:382–385` emits `arg.iteration:` from the node's `findingsFolder` (graph `task_plan_writing.graph.json:102–106`), and `cli/test/flow-walker.test.mjs:98–106` asserts the exact `arg.*` array for `plan_review`. A new key also changes the agent's "with five keys" (`task-plan-reviewer.md:32`) and the core dispatch block (`task_plan_writing_instructions_core.md:212–218`). Without those changes the key is unsolicited dispatch text under the agent's own `## Unsolicited dispatch guidance`. **Change:** in Storage → Index and in Risks → "Tests and scripts", name `flow-walker.sh`, the graph node, the three `flow-walker*.test.mjs` suites, `:32` and core `:212–218` as files the proposal edits.
2. **"`sed -i` via Bash (not allow-listed for unattended runs)" is wrong.** `cli/templates/claude/settings.autonomous.json:39` allow-lists `Bash(sed:*)`, and `plugin/hooks/lib/*.sh` (hc_safe_prefixes header, "`sed` / `find` admit `-i`") says leading-word matching carries `-i` along. Tick-as-you-go through `sed -i` would therefore run unattended. **Change:** drop the allow-list claim. Keep the real objection, that it defeats the tool-level read-only guarantee (`task-plan-reviewer.md:10`), and state that the single end `Write` is a choice, not something the tools force. The Risks bullet "forced by the missing `Edit`" needs the same correction.
3. **No "supervised-dispatch" fork exists.** The Dispatch table says the core loop is "shared by the supervised-dispatch, semi-autonomous … and autonomous … forks". Only `task_plan_writing_instructions_semi_autonomous.md` and `_autonomous.md` fork the core (`ls plugin/instructions | grep task_plan`). Supervised `/branch-start-plan` drafts the plan inline and dispatches no reviewer (`plugin/commands/branch-start-plan-semi-autonomous.md:21`; `grep task-plan-reviewer plugin/commands` hits only the semi command). **Change:** fix the table, and change the Storage → Path line "works in supervised and semi-autonomous flows too" to "semi-autonomous and autonomous only".

## Should Fix

1. **The template has 24 items, not 23** (R1–R6, S1–S5, T1–T7, C1–C3, P1, O1–O2). Correct the count.
2. **The "≈2 500 after" estimate for the agent definition is not derived.** No draft was written and no subtraction is shown. It is reachable from the class table: about 3 256 REFERENCE minus about 1 810 moved (532+373+164+380+230+130), plus 678 WIRE and a stub, gives about 2 200–2 400. Show that arithmetic. The constraint margin (−4 308) survives even a +1 000 error, so say that as well.
3. **Mandatory checks are missing from the template.** Compared with the definition:
   - `## Corpus staleness` entry-type check, `stale-rule` / `undescribed-layer` (`:128`)
   - a conventions-document change scheduled through an entry title or a Scope-register `change` row (`:88`). T6 covers `### Targets` only.
   - the index must not carry `### Sources of truth` / `### Targets` (`:85`)
   - the shared-state source-of-truth/mirror check (`:154`)
   - plan targets opened at cited ranges only (`:70`)
   - the Should Fix band rules: missing `Top risks:` (`:85`), a line-coordinate `Site` (`:98`), a baked-in count (`:170`)
   
   Add the missing items, or fold them into S1/T6/C2 descriptions.
4. **S2 paraphrases a wire literal.** It reshapes the readiness-entry literal (`<title>` for `<short title>`, `<one name>` for `<one of <layer_names>>`; `:87`). Quote the literal exactly or point to it (`ref: agent → ### Story-index structure`).
5. **The template contradicts the storage recommendation.** The template header says "Tick each item when done", but Storage recommends a single end `Write`. Say which one applies.
6. **R6 conflicts with the report's own mitigation.** The receiving-side rule is unconditional (every dispatch screens), yet the report moves its body behind a `ref:`. Its own "biggest risk" mitigation says "refs only on conditional items". It also runs against `dispatch_discipline_instructions.md:72` ("The rule body lives in those definitions"). Either keep the body inline or explain why this exception is safe.
7. **Brief leads added after batch 1 are not evaluated:**
   - Lead 11: put a `## Work report` section into `review_<n>.md` on FAIL. The folder is already staged by the convergence commit (`task_plan_writing_instructions_autonomous.md:140`). Assess the consumer risk: the writer reads that file through `Revise the task plan per findings at <findings_file>.` (`task-plan-reviewer.md:52`).
   - Lead 8: in semi-autonomous runs no flow step commits anything. The fork only tells the user to include the folders (`task_plan_writing_instructions_semi_autonomous.md:40`).
   - Lead 12: R1's evidence would be the absolute `git rev-parse --show-toplevel` output, which leaks into a committed report.
   
   Add one row each to Storage/Risks.
8. **Cutting the `<repo_root>` row leans on an adopter-editable file.** The report's justification is that "CLAUDE.md owns it", but `.claude/CLAUDE.md` is adopter-owned ("yours from there on: edit it freely", `cli/templates/claude/CLAUDE.md` footer), and the agent row also carries the worktree-vs-main nuance (`:23`). Name this as a risk, or keep a one-line version.

## Nice to Have

1. The `.gitignore:35–47` citation is this repository's own ignore block. Cite the adopter template that `init` writes as well.
2. R1 "read `harness.config.json` layers, stateDir, phases" is implied by `## Resolved values` (`:14–24`) rather than stated as a step. Mark it as such.

## Bug claims

- **Index reuse on re-entry (`iteration` collides): CONFIRMED.** `iteration` is "the next free `review_<n>.md` index in that block's own `findings_folder`" (`task_plan_writing_instructions_core.md:147`; `flow-walker.sh:43–44, 382–385`). PASS writes no file (`task-plan-reviewer.md:192`), so a PASS leaves its index free for the next dispatch.
- **PASS must not touch disk conflicts with a report on every dispatch: CONFIRMED.** `task-plan-reviewer.md:50` and `:192`.
- **The shared receiving-side file conflicts with dispatch discipline: CONFIRMED.** `dispatch_discipline_instructions.md:72` reads "The rule body lives in those definitions and not here".
- **The convergence commit literal "Pass all six" must change: CONFIRMED.** `task_plan_writing_instructions_autonomous.md:134–154` (the six paths, and the wrapper call).
- **`sed -i` is not allow-listed: REFUTED.** See Must Fix 2.
- **The orchestrator must not read review artifacts: CONFIRMED.** `task_plan_writing_instructions_core.md:313`.
