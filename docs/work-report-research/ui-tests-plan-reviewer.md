# Work report research — ui-tests-plan-reviewer

## Verdict

**Recommend with changes.** The agent's `## Process` and `## What to check` are already a checklist, so a ~20-item report fits well. The agent definition can drop from 4 530 to about 3 110 words (per-section estimate in `## Thinning plan`). The bigger saving is not the report: the agent reads two whole sibling agent files up front (writer 5 671 + qa-tester 7 201 words) to use about 1 970 words of them. Narrowing those two reads to named sections takes the up-front load for the reference adopter (`examples/notes-app`) from 22 532 to about 10 860 words, report included. Without that narrowing, the report alone saves about 770 words (−3.4 %), so the constraint holds, with a thin margin.

Required changes:
1. Write the report with **one `Write` at the end**. This is a choice, not forced: `sed -i` ticking is allow-listed (`cli/templates/claude/settings.autonomous.json:39`). One `Write` means fewer calls, one atomic file, and a reviewer that never edits a file in place, in keeping with the agent's `Edit`-free allowlist (`plugin/agents/ui-tests-plan-reviewer.md:14`).
2. Store it **inside `findings_folder`** as `work_report_<k>.md`. The autonomous Override 4 already commits that folder (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 4`, staging list).
3. Never use a `review_` prefix for the report. The walker counts rounds by that prefix (`scripts/lib/flow-walker-gates.sh` → `fw_round_count`).
4. Pick `k` as the next free `work_report_*.md` index, not `iteration`.
5. Amend the "PASS writes no file" / "findings only" contract in the seven places listed under `## Storage and lifecycle` → **PASS contract**.
6. Keep the no-plan guard writing nothing (template item `G0`).
7. Keep evidence repo-relative, and never paste `findings_file` (lead 12).

## Read tree

This repository has `phases.qa: false` (`harness.config.json`), so the agent never runs here. All counts below are for the bundled adopter `examples/notes-app` (`phases.qa: true`, `qa.driver: web-playwright`, surface layer `presentation`). Every count is from `wc -w`.

| File | Up-front / on demand | Words |
|---|---|---|
| `plugin/agents/ui-tests-plan-reviewer.md` | up-front (definition) | 4 530 |
| `examples/notes-app/.claude/CLAUDE.md` | up-front (auto-loaded) | 1 676 |
| `plugin/agents/ui-tests-plan-writer.md` | up-front, whole file (`:63`, "the contract you validate against") | 5 671 |
| `plugin/agents/qa-tester.md` | up-front, whole file (`:64`, web-playwright) | 7 201 |
| ↳ alt: `qa-tester-mobile-maestro.md` / `qa-tester-mobile-mcp.md` | up-front under a mobile driver | 1 183 / 1 337 |
| `examples/notes-app/.claude/context/presentation.md` | up-front (`:65`, surface layer's conventions) | 3 012 |
| `<state_dir>/lessons.md` (notes-app; same as `cli/templates/state-dir/lessons.md`) | up-front (`:69`) | 442 |
| **Up-front total (web-playwright)** | | **22 532** |
| `examples/notes-app/.claude/context/conventions.md` | **conflict (lead 13):** `examples/notes-app/.claude/CLAUDE.md:32` tells every agent doing "Any implementation, review or planning" to read it; the definition does not list it, and `presentation.md:24` points to it only for the attribute names. Counted as on-demand in the main column, with a larger-set row in the ledger | 5 125 |
| Surface layer source (`src/presentation`) | on demand, grep only (`:66`, `:132`) | variable |
| `<docs_root>` / `mcp__harness-docs__search_docs` | on demand, only when `phases.docs` is on (`:67–68`); off in notes-app | 0 |
| Inputs: task prompt, story index `## Context`, every `task_<N>_plan.md`, UI-test index, every `ui_test_<N>.md` | per dispatch, inputs rather than conventions | variable |

What the agent actually uses from the two sibling files (counts include each heading line):
- From the writer: `## Split output spec` (`:145–166`, 701), `### Capability guidance` (`:103–115`, 413) and `## Quality checks before saving` (`:167–176`, 270), 1 384 words in all.
- From `qa-tester.md`: the frontmatter (`:1–6`, 132), whose `tools:` line is the capability set, and `## Which MCP to use` (`:99–111`, 454), 586 words in all.

## Dispatch sites and phases

| Site | Flow | Ledger id | Count per branch |
|---|---|---|---|
| `plugin/instructions/task_plan_writing_instructions_core.md` → `## UI-test-plan write loop` → `### 2. Spawn ui-tests-plan-reviewer` | semi-autonomous (`plugin/commands/branch-start-plan-semi-autonomous.md:27`) and autonomous | `P2` (`autonomous_pause_and_ledger.md:70`) | 1–5 (`onCap` in `scripts/flows/task_plan_writing.graph.json`, `ui_review` node) |
| Walker node `ui_review` (`scripts/flows/task_plan_writing.graph.json:161–186`; cap `"iteration": { "cap": 5 }` at `:8`) | same | `P2` | same |

**Not dispatched by:**
- supervised `branch-start-plan.md:46`, which dispatches the writer only;
- `qa_test_instructions.md:38–55`, writer only;
- user-review `QA.0` (`user_review_fixes_instructions_core.md:155`), writer augment only.

Because of this, augmented plans are never re-reviewed. That is outside this study, but worth noting. The heartbeat `[ui-test-write · iter <i>] → ui-tests-plan-reviewer` is asserted by `cli/test/flow-walker-ui-and-reentry.test.mjs:42` and `flow-walker-resume.test.mjs:44`. No test reads the agent's prose.

## Prose classification

Section totals are measured with `sed -n 'a,bp' | wc -w`. The split inside each section is estimated from line-level counts (for example `:18` = 98, `:68` = 132, `:101` = 164, `:143` = 137).

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 82 | 0 | 0 | 82 | 0 | `tools:` / `description` |
| Role (8) | 39 | 0 | 30 | 0 | 9 | |
| Phase-off (10) | 105 | 15 | 0 | 0 | 90 | Restates the no-plan guard `:75` |
| Analog of task-plan-reviewer (12) | 37 | 0 | 0 | 0 | 37 | Rationale |
| Read-only / no `Edit` (14) | 43 | 5 | 10 | 0 | 28 | Maintainer rationale |
| `## Resolved values` (16–29) | 532 | 30 | 220 | 0 | 282 | `:18` preamble (98) lists what is *not* listed. `<repo_root>` `:28` (77) restates the CLAUDE.md checkout-root block. Docs rows `:26–27` (94) are inert unless `phases.docs` is on |
| `## Invocation contract` (32–55) | 333 | 50 | 60 | 200 | 23 | Key block `:36–42` and key table are WIRE. The exact-verdict rule `:54` is WIRE. `:52` quotes the caller's no-mkdir text from core `:269` |
| `## Read first` (56–72) | 634 | 220 | 230 | 69 | 115 | Each bullet is one read action. Driver→file map `:64` stays. Docs-tool paragraph `:68` (132) is conditional, so it moves to REFERENCE. `blocker:` rule `:71` is WIRE |
| `## Process` (73–82) | 309 | 190 | 40 | 30 | 49 | Moves wholly into items. `:75` restates `:10`, and `:80` restates `### Asserted…` |
| Rubric (83–92) | 216 | 30 | 126 | 0 | 60 | Keep the rubric because it is the grading standard. The tail of `:91` about the adopter's restatement is cut |
| `### Index structure` (93–102) | 422 | 90 | 130 | 180 | 22 | Byte-identical `## Phase 2 Readiness — Ordered Fix List`, the entry form, the `_(layer: …)_` tag and `rebutted round <j> — call stands` are WIRE, shared with the writer and other reviewers |
| `### Per-test-file structure` (103–111) | 182 | 40 | 50 | 80 | 12 | Field literals `**Goal:**` … `**On failure → fix target:**` are WIRE |
| `### Index↔per-test correspondence` (112–122) | 129 | 70 | 20 | 30 | 9 | |
| `### Test-attribute convention parity` (123–127) | 107 | 60 | 40 | 0 | 7 | |
| `### Asserted attribute values…` (128–139) | 385 | 120 | 170 | 0 | 95 | Rationale `:130` (76) and "what this is not" `:138` (58) can be shortened |
| `### Capability/MCP correctness` (140–146) | 307 | 80 | 117 | 110 | 0 | `n/a (<qa_driver> variant declares no capability set)` and the `chrome-devtools (performance / Core Web Vitals)` / `Playwright` tags are WIRE (writer `:105,:162,:171`; core `:259`) |
| `### Backend-name parity` (147–150) | 104 | 30 | 20 | 0 | 54 | The "replace with your project's" adopter scaffolding is cut |
| `### Depends on` (151–154) | 25 | 20 | 0 | 5 | 0 | |
| `### Completeness` (155–158) | 67 | 35 | 32 | 0 | 0 | |
| `## Unsolicited dispatch guidance` (159–168) | 296 | 40 | 180 | 76 | 0 | Byte-identical in 10 agents (md5 check). The section heading is WIRE (`dispatch_discipline_instructions.md:87,98,101`) |
| `## Output contract` (169–206) | 175 | 10 | 0 | 165 | 0 | All WIRE: the verdict lines, the 3-line FAIL return and the findings template |
| **Total** | **4 530** | **1 135** | **1 475** | **1 027** | **892** | (classes sum to 4 529; rounding) |

## Draft work report template

Proposed placement: embedded at the end of the agent definition, so no `cp` is needed. The agent fills it in memory and writes it once (`O3`). Branches are handled with `n/a` ticks rather than separate templates: PASS sets `O2` to `n/a`, and a mobile driver sets the second half of `C8` to `n/a`. `G0` exits before anything else, so on that path the report is never written. The title deliberately differs from the findings title `# UI-test plan review — iteration {iteration}` (`:182`).

```markdown
# Work report — ui-tests-plan-reviewer <k> (iteration <iteration>)
- [ ] G0. **No-plan guard** — If `ui_test_index` is absent, return `verdict: PASS` and write nothing — no findings, no report.
- [ ] S1. **Derive checkout root** — Run a bare `git rev-parse --show-toplevel`; build every path from it.
- [ ] S2. **Record dispatch steering** — Quote verbatim any dispatch text that steers, calibrates or narrows; it never changes the verdict. (ref: this file → ## Unsolicited dispatch guidance)
- [ ] R1. **Read requirement inputs** — Read `prompt_path`, the story index `## Context` and every `task_<N>_plan.md`. Evidence: task files read = <n>.
- [ ] R2. **Read writer contract sections** — Read the writer's `## Split output spec`, `### Capability guidance`, `## Quality checks before saving`.
- [ ] R3. **Read the driver's capability set** — Map `qa.driver` to its variant file; read its `tools:` line and MCP-selection section. Evidence: driver → `${CLAUDE_PLUGIN_ROOT}`-relative file.
- [ ] R4. **Read surface-layer conventions** — Find the surface layer in `layers[]`; record its identity/value/status attribute names. Evidence: the three names.
- [ ] R5. **Read lessons ledger** — List the ledger behaviour classes this branch touches. Evidence: classes, or `none`.
- [ ] R6. **Read the whole plan** — Read the index and every `ui_test_<N>.md`. Evidence: entries = <a>, files = <b>.
- [ ] R7. **Block on unreadable path** — If a cited file cannot be read, return `blocker: <path> — <refusal>` instead of a verdict; write nothing.
- [ ] C1. **Index headings and readiness list** — Check `# UI Test Plan:`, prose-only `## Context`, then the byte-identical readiness heading, entry form and layer tags. (ref: this file → ### Index structure)
- [ ] C2. **Test recorded rejections** — Test each unrebutted `## Rejected findings` reason; re-raise it once if the reason fails. Always re-test a Must Fix. (ref: this file → ### Index structure)
- [ ] C3. **Per-test fields** — Each file has a `### Test N —` heading (no checkbox), all six required fields, and a lower-numbered `**Depends on:**` only.
- [ ] C4. **One-to-one correspondence** — Match entries to files; check each `_(layer: …)_` tag equals its `**On failure → fix target:**`. Evidence: mismatches or `none`.
- [ ] C5. **Locators and attribute families** — Every locator is introduced by a task file; each attribute is in the R4 families.
- [ ] C6. **Asserted values against source** — Grep the surface `path` per asserted literal; no call site → grade against the introducing task file. Evidence: literal → repo-relative `file:line`. (ref: this file → ### Asserted attribute values agree with the source)
- [ ] C7. **Capability annotations** — Each test's capability is in the R3 set, or is the exact `n/a (…)` marker under a mobile driver. (ref: this file → ### Capability/MCP correctness)
- [ ] C8. **Unrunnable tests** — Flag tests that need a real backend failure; web-playwright: chrome-devtools only for LCP/CLS/INP/trace.
- [ ] C9. **Backend names** — Each network assertion cites a name already in the story or task files.
- [ ] C10. **Completeness** — Every UI-observable behaviour, and every R5 class, has a test or a stated reason.
- [ ] O1. **Grade by consequence** — Grade per the rubric; checklist Must Fix triggers stay Must Fix. (ref: this file → ## What to check)
- [ ] O2. **Write findings on FAIL** — Run `mkdir -p <findings_folder>`, then write `review_<iteration>.md` in the fixed format. Name the file to change. `n/a` on PASS.
- [ ] O3. **Write this report** — Write it once to `<findings_folder>/work_report_<k>.md` (`k` = next free), with the verdict pasted below; every evidence path repo-relative.
- [ ] O4. **Return exact verdict** — Return `verdict: PASS`, or the 3-line FAIL block, with the steering section above it only if S2 found any.
Verdict returned: <PASS | FAIL>, must_fix_count: <N> (never `findings_file`)
```

Measured as drafted: 649 words (`wc -w` on the block, without placeholders expanded). Every item description is 25 words or fewer (checked per item).

## Thinning plan

| File | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| `ui-tests-plan-reviewer.md` | `:10` (except one line), `:12`, most of `:14`, `:18`, `:28`, `## Process` (now items), Read-first bullets (now R1–R6), the backend-name scaffolding `:149` | Docs rows and `:68` reduced to one conditional bullet (~60). `:130` / `:138` reduced to ~45. Rubric tail `:91`. `:52` reduced to one line | Frontmatter, key block and table, `:54` verdict rule, `:71` blocker rule, every check group (the grading standard, lead 7) minus its REDUNDANT words, `:101` rejection protocol, `## Unsolicited dispatch guidance` (shared; see below), `## Output contract` plus a ~30-word report amendment | **~3 110** (per section below) |
| Read instruction for `ui-tests-plan-writer.md` (`:63`) | Whole-file read | Becomes a section-scoped read (R2) | — (the file itself is unchanged here) | **1 384** effective |
| Read instruction for `qa-tester.md` (`:64`) | Whole-file read | Frontmatter plus `## Which MCP to use` (R3) | — | **586** effective (132 + 454) |
| `presentation.md` (adopter) | — | — | adopter-owned | 3 012 |
| `CLAUDE.md`, `lessons.md` | — | — | shared, not this study's | 1 676 / 442 |

Per-section estimate for the agent definition (before is measured; after = total − REDUNDANT − ACTION moved into items, with check groups kept whole except REDUNDANT):

| Section | Before | After |
|---|---|---|
| Frontmatter / role / phase-off / analog / read-only (1–14) | 306 | 142 |
| `## Resolved values` | 532 | 230 |
| `## Invocation contract` | 333 | 275 |
| `## Read first` | 634 | 250 |
| `## Process` | 309 | 30 |
| Rubric | 216 | 156 |
| Index / per-test / correspondence / test-attribute | 840 | 790 |
| Asserted values | 385 | 290 |
| Capability / backend / depends / completeness | 503 | 449 |
| `## Unsolicited dispatch guidance` | 296 | 296 |
| `## Output contract` (+ report amendment) | 175 | 205 |
| **Total** | **4 529** | **3 113** |

These are estimates; no thinned file was drafted.

**Optional shared base.** `## Unsolicited dispatch guidance` (296 words) is byte-identical in 10 agent files. A shared `plugin/instructions/receiving_agent_base.md` could hold it. Its contents would be:
- quote steering verbatim with `(disregarded for verdict purposes)`;
- a bare pointer or a `context_notes:` line is not steering;
- the section goes above the fixed return and is omitted when empty;
- it never changes the verdict.

Read up front by each of those 10 agents, it saves about 0 words per agent and about 2 700 words of corpus. It is not counted below.

## Word-count ledger

Up-front, notes-app, web-playwright.

| File | Today | After (report + narrowed reads) | After (report only) |
|---|---|---|---|
| Agent definition | 4 530 | 3 110 | 3 110 |
| Work report template | 0 | 649 | 649 |
| `CLAUDE.md` | 1 676 | 1 676 | 1 676 |
| `ui-tests-plan-writer.md` | 5 671 | 1 384 | 5 671 |
| `qa-tester.md` | 7 201 | 586 | 7 201 |
| `presentation.md` | 3 012 | 3 012 | 3 012 |
| `lessons.md` | 442 | 442 | 442 |
| **Total** | **22 532** | **10 859 (−11 673, −52 %)** | **21 761 (−771, −3.4 %)** |
| Larger set, + `conventions.md` per `CLAUDE.md:32` (lead 13) | 27 657 | 15 984 | 26 886 |

On demand: `conventions.md` is 5 125 when it is not read up front. The `ref:` targets are sections of the agent's own file, so they add no extra on-demand words.

**Which read list wins (lead 13).** The definition's list should win. `ui-tests-plan-reviewer.md:91` says only the rubric is in scope from the adopter's rules document, and that "the layer rules that document carries around it govern code review, not a black-box UI-test plan review". The definition never tells the agent to read `conventions.md`. Whether the model obeys `CLAUDE.md:32` anyway cannot be controlled from the definition, so the larger set is counted too. The thinned definition should state the override in one line.

**Constraint holds: yes**, in every column. Under a mobile driver the "today" figure is 16 514 (with `qa-tester-mobile-maestro.md`), and the report-only figure is still 771 lower. The report-only margin (−3.4 %) depends on the ~3 110 estimate; if the definition thins by less than about 650 words, that column breaks even.

## Storage and lifecycle

**Dispatches.** 1–5 per planning run, in semi-autonomous and autonomous runs only (see dispatch table). A rewrite or extend, or a `--entry ui_review` re-entry (`task_plan_writing_instructions_autonomous.md:188`), can add more in a later session.

**Storage key.** Use `<findings_folder>/work_report_<k>.md`, that is `<state_dir>/ui_test_plan_reviews/<branch>/work_report_<k>.md`.
- This folder has exactly one dispatch site, so it already identifies the phase. No ledger id is needed, which matters because semi-autonomous runs have no ledger.
- The brief's `<phase>/<agent>` path would duplicate what the folder already says.

**Index.**
- The caller's `iteration` is the next free `review_<n>.md` (`fw_next_review_index`, core `:147`).
- A PASS writes no `review_n`, so a later re-entry is dispatched with the same `n` and would overwrite a PASS report named by `iteration`. That is not collision-safe.
- So the agent computes `k = 1 + max(work_report_*.md)` itself with `ls` (it has Bash), and records `iteration` inside the report.
- The name must not start with `review_`. Otherwise `fw_round_count` (`flow-walker-gates.sh:80–93`) counts it as a round and brings the cap forward.

**Commit.**
- **Autonomous:** the report is committed with no change. Override 4 passes `<state_dir>/ui_test_plan_reviews/${branch}/` unconditionally (`task_plan_writing_instructions_autonomous.md:126,143,154`). Until then it sits untracked, which the planning PAUSE rule tolerates (`:190`). This also answers lead 8: on PASS the commit point is Override 4. It also answers lead 11: the report sits inside a folder that a commit already stages whole, rather than as a section of the findings file. The findings file exists only on FAIL, and the writer applies its Must Fix items, so a section there would be read by the writer.
- **Remote runs:** the remote planning bundle carries the folder whole across a pause (`cli/templates/scripts/lib/harness-run-lib.sh:2154`), so the placement also survives remote resumes.
- **Semi-autonomous:** hand-off step 3 tells the user to commit the folder (`task_plan_writing_instructions_semi_autonomous.md:40`). That step reads an absent folder as "every plan reviewer passed first time". With a report on every dispatch the folder always exists, so that inference and its wording must change.
- No committer dispatch and no reconciliation are involved, so lead 3 does not apply.

**Tools.**
- `Write` is in the agent's allowlist and the `Edit` tool is not (`:4`, `:14`). In-place ticking is still possible through `sed -i` (`Bash(sed:*)`, `cli/templates/claude/settings.autonomous.json:39`; `Write`/`Edit` under the repo at `:48–51`). So the `:14` guarantee covers only the `Edit` tool, not the disk.
- **Chosen:** one `Write` at the end. **Rejected:** `sed -i` per item. One write means 1 call instead of ~24, one atomic file, and a reviewer that never edits a file in place.
- `mkdir -p` is allow-listed (`settings.autonomous.json:45`). `cp` is not, and the embedded template avoids it.
- No hook in `plugin/hooks/` guards `Write` to `<state_dir>`.

**PASS contract.** "Write no file on PASS" or "findings file only" is stated in nine places:

| # | Place | Action |
|---|---|---|
| 1 | agent `:10` (phase-off lands on the guard) | keep |
| 2 | agent `:75` (no-plan guard) | keep (`G0`) |
| 3 | agent `:14` ("The only file you write is your own findings file") | amend |
| 4 | agent `:52` ("The PASS branch … must not touch disk") | amend |
| 5 | agent `:177` ("Do not save a file when PASS") | amend |
| 6 | core `task_plan_writing_instructions_core.md:269` ("only when it has findings to write") | amend |
| 7 | autonomous `:141` (staging list "findings, when any") | amend |
| 8 | autonomous `:143` ("a reviewer that returned PASS created no folder … simply skipped") | amend |
| 9 | semi-autonomous `:40` (absent folder = "passed first time") | amend |

That is two kept and seven amended.

**Reviewers reviewing reports.** Lead 5 does not apply. The branch-level diff excludes `<state_dir>/*<branch>*` (`branch-reviewer.md:83`), and the path contains the branch name. Lead 9 (orphan check) does not apply either: `review-plan-reviewer` never reads this folder.

## Risks and costs

- **Tick-as-you-go cannot be verified.** With the chosen single end-`Write`, nothing ticks during the run. Even `sed -i` ticking would leave no verifiable timestamps. Goal (a) rests only on the evidence fields (R1, R3, R4, R5, R6, C4, C6, verdict). C6's `literal → file:line` is the strongest; everything else is self-attestation.
- **Evidence leaks (lead 12).** The FAIL return carries an absolute `findings_file` (`:200`, built from `<repo_root>`, `:28`). Grep output and `${CLAUDE_PLUGIN_ROOT}` also resolve to absolute and home paths. The template therefore pastes only the verdict and `must_fix_count`, and requires repo-relative or `${CLAUDE_PLUGIN_ROOT}`-relative paths. There are no timestamps, so a re-run that writes identical content re-commits as a no-op.
- **Read-list conflict (lead 13).** `CLAUDE.md:32` can add 5 125 words. See the ledger.
- **Cost.** One extra `Write` and one `ls` per dispatch, at most 5–6 per branch. That is negligible next to the reads it replaces.
- **Ref-starvation (lead 7).** C1, C6 and C7 point to their own check groups, which are the grading standard. They stay in the same file that is already loaded, so nothing goes unread. The risk is the agent grading from the 25-word item instead of the group. Keep every `ref:` on the item itself, and keep the Must Fix triggers and literals in the groups.
- **Narrowed sibling reads.** If the writer research renames `## Split output spec` / `### Capability guidance`, R2 silently stops pointing at anything. R7's blocker rule must cover a missing *section* as well as a missing file. The writer's rejected-findings contract (`ui-tests-plan-writer.md:69`) lies outside the narrowed sections. The reviewer's `:101` already states the reviewer side, so that is acceptable.
- **Wire literals are spread across files.** `n/a (<qa_driver> variant declares no capability set)` appears in reviewer `:64,:143`, writer `:105,:162,:171` and core `:259`. The readiness heading and `call stands` are shared with every plan reviewer and writer. Items must quote them byte-exact or point to them, never paraphrase them.
- **Walker coupling.** The `review_` prefix rule above is easy to miss and is a silent cap regression if broken.
- **Tests.** No test in `cli/test/` keys on the prose being moved. Only the heartbeat string and the `ui_test_plan_reviews` folder name are asserted.

## Open questions

1. Should section-scoped reads of sibling agent files (R2/R3) become a cross-agent rule? Here they are worth about 15× the report saving, and other reviewers that read writer contracts probably have the same pattern.
2. Should the shared base file hold the 10-way duplicated `## Unsolicited dispatch guidance` section?
3. Is the "next free `work_report_*`" index computed by the agent acceptable everywhere, or should the walker emit a `report_index` alongside `iteration`?
4. Should the semi-autonomous hand-off stop using the existence of a findings folder as a "passed first time" signal (affects every plan reviewer)?
5. Should the augment paths (QA.0, `branch-qa-test` refresh) that bypass this reviewer get a review dispatch? That is outside this study, but the report would make the gap visible.

## Review response

All Must Fix and Should Fix findings from `docs/work-report-research/reviews/ui-tests-plan-reviewer.md` were applied, and Nice to Have 1–3 as well. Nothing is rebutted.

Changed figures, re-measured with `wc -w`:
- qa-tester narrowed read: 132 + 454 = 586.
- writer sections, including headings: 701 + 413 + 270 = 1 384.
- template: 649.
- agent after: ~3 110, per-section table.
- classification totals: REFERENCE 1 475, REDUNDANT 892.

Changed citations: autonomous `:188` / `:190` / `:141` / `:143`, graph `:161–186` and `:8`, core `:259`.
