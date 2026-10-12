# Work report research — task-plan-reviewer

## Verdict

**Recommend with changes.** The agent definition is already a checklist in disguise: `## What to check` (`plugin/agents/task-plan-reviewer.md:78–171`) is 3 562 of its 6 038 words, so a 25-item checklist maps onto it cleanly. Moving the conditional blocks (parity, Scope-register derivation, rejected findings) behind `ref:` pointers takes the up-front load from 25 853 to about 21 940 words in this repository.

Five changes are needed:

1. **Embed the checklist in the agent definition and fill it in once, before returning.** Do not copy a template file (`cp` is not allow-listed) and do not tick in place. `sed -i` would work unattended, but it is an end-run around the deliberate omission of `Edit` (`:10`). This is a design choice, not a constraint the tools impose.
2. **Store the report inside the findings folder the flow already commits.** On FAIL, it is a trailing `## Work report` section of `review_<iteration>.md`. On PASS, it is `pass_report_<k>.md` in the same folder. This avoids a new storage tree, a new dispatch key and any walker or test change.
3. **Narrow the "PASS must not touch disk" lines** (`:50`, `:192`) to "no findings file on PASS".
4. **Write the filed report as IDs, titles and evidence only.** The writer treats the findings file as authoritative (`task-plan-writer.md:153`), so imperative descriptions must not land in it.
5. **Evidence lines carry repo-relative paths only.**

Goal (a) is weak here: tick timing cannot be verified and nobody reads the report during the run. The evidence tails are the value.

## Read tree

Measured with `wc -w`. The conventions docs are this repository's (`harness.config.json` → `layers`: cli, plugin, general). An adopter's are typically about 440–970 words each (`cli/templates/claude/context/layer.md` 441, `conventions.md` 974).

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/task-plan-reviewer.md` | up-front (the definition) | 6 038 |
| `.claude/CLAUDE.md` (auto-loaded) | up-front | 1 695 |
| `.claude/context/conventions.md` | up-front (`## Read first`, :56, "Read **all**") | 5 864 |
| `.claude/context/cli.md` | up-front | 2 647 |
| `.claude/context/plugin.md` | up-front | 4 174 |
| `plugin/samples/sample_task_plan.md` | up-front (:57) | 1 399 |
| `plugin/samples/sample_story_plan.md` | up-front (:58) | 1 270 |
| `plugin/samples/sample_story/task_1_plan.md` | up-front (:59, "read all three") | 468 |
| `plugin/samples/sample_story/task_2_plan.md` | up-front | 568 |
| `plugin/samples/sample_story/task_3_plan.md` | up-front | 531 |
| `<state_dir>/lessons.md` (`harness-runs/lessons.md`) | up-front (:60) | 1 199 |
| **Up-front total** | | **25 853** |
| `plugin/agents/task-plan-writer.md` | on demand (cited :8, :128) | 6 476 |
| `plugin/instructions/unit_loop_core.md` → `## The test-run rule` | on demand (:160) | 743 (file 9 143) |
| `mcp__harness-docs__search_docs` results | on demand, only when `phases.docs` ∧ `docs.retrieval` (:61) | variable |
| The plan under review, plus cited target ranges | per-dispatch input, not convention | variable |

**Lead 13 (read-list conflicts).** `.claude/CLAUDE.md` → `## Context files` points planning and review work at `conventions.md`, the layer files and the lessons ledger. The definition already reads all of these (:56, :60), so the larger set is the definition's and there is no conflict. CLAUDE.md names the ledger as `<root>/harness-runs/lessons.md` and the definition as `<state_dir>/lessons.md`. They are the same file here (`stateDir: harness-runs`).

## Dispatch sites and phases

| Site | Phase / flow | Count |
|---|---|---|
| `plugin/instructions/task_plan_writing_instructions_core.md` → `## Loop` → `### 4. Spawn task-plan-reviewer` (:208–218) | Planning loop. Shared only by the **semi-autonomous** fork (`task_plan_writing_instructions_semi_autonomous.md:53`) and the **autonomous** fork (`task_plan_writing_instructions_autonomous.md:230`). Supervised `/branch-start-plan` drafts inline and dispatches no reviewer (`plugin/commands/branch-start-plan-semi-autonomous.md:21`). | 1 per revision, at most 5 per loop (`iteration >= 5` cap; `MAX_TOTAL_DISPATCHES` sizing at :62) |
| Walker node | `cli/templates/scripts/flows/task_plan_writing.graph.json:102–106` (`plan_review`, `findingsFolder: {state_dir}/task_plan_reviews/{branch}/`). `flow-walker.sh:382–385` emits `arg.iteration` = `fw_next_review_index` of that folder. | n/a |
| Ledger | `autonomous_pause_and_ledger.md:69`, `P1. Task plan converged (… task-plan-reviewer all PASS)` | `P1` only |
| Re-entry (`review` decision, core `## Setup` steps 5 and 7) | sends an existing draft back through the gates | +1 to 5 per re-entry |
| `run_mode_instructions.md:84` | can be passed-by-exclusion | 0 |

The agent never runs in the implementation, code-review or user-review phases. A typical branch sees 1–3 dispatches.

## Prose classification

Section totals are measured with `sed -n 'a,bp' | wc -w`. The per-class split within each section is my estimate from line-level counts.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 70 | 0 | 0 | 70 | 0 | `name`, `tools` and `description` are read by Claude Code. |
| Intro (7–11) | 87 | 15 | 30 | 0 | 42 | The rationale for omitting `Edit` (:10) is for maintainers. |
| `## Resolved values` (12–28) | 684 | 20 | 300 | 0 | 364 | Preamble :14 (111). `<repo_root>`/`<app_dir>` row :23 (140); `<app_dir>` is "Bound for completeness — no step … consumes". The docs and parity tokens :21, :22, :24 (148) move to the parity ref. Config reading is implied here (:14–24); no step states it. |
| `## Invocation contract` (29–53) | 323 | 50 | 100 | 150 | 23 | The key block :34–40 and the verdict exactness at :52 are WIRE. |
| `## Read first` (54–66) | 520 | 90 | 260 | 20 | 150 | The docs-tool paragraph :61 (130) moves to the parity/docs ref. The guard carve-out :63 stays. `blocker:` at :65 is WIRE. |
| `## Process` (67–77) | 289 | 180 | 90 | 0 | 19 | Becomes items R4, R5 and P1. The parity gate note and steps 3–4 (:72, :74–75; 179 words) move to the parity ref. |
| Story-index structure (80–100) | 1 044 | 120 | 640 | 120 | 164 | The heading literal (:86) and the entry shape (:87) are WIRE. The Scope register (:90–99, 532) and rejected findings (:100, 164) move to refs. |
| Per-task-file structure (101–110) | 356 | 60 | 226 | 40 | 30 | `### Task N —` is WIRE (:106). |
| Index↔file correspondence (111–120) | 106 | 50 | 30 | 0 | 26 | Item T1 covers it. |
| Architecture (121–129) | 555 | 80 | 300 | 30 | 145 | The "harness doctrine … stated here in full rather than cited" boilerplate repeats at :124, :134, :147 and :155 (about 35 words each). `stale-rule`, `undescribed-layer` and `## Corpus staleness` (:128) are WIRE. |
| Granularity & tags (130–136) | 195 | 40 | 90 | 15 | 50 | |
| Parity (137–149) | 491 | 60 | 380 | 15 | 36 | Inert when `phases.parity` is false, which is the case here. Moves wholly to the parity ref. |
| Completeness (150–171) | 811 | 140 | 560 | 15 | 96 | The derivation test :161–170 (373) moves to the Scope-register ref. |
| `## Unsolicited dispatch guidance` (172–181) | 296 | 30 | 230 | 36 | 0 | Screening runs on every dispatch, so the body stays inline, shortened. |
| `## Output contract` (182–219) | 207 | 20 | 20 | 167 | 0 | All WIRE; stays verbatim. |
| **Total** | **6 034** | **955** | **3 256** | **678** | **1 145** | |

**WIRE literals that stay verbatim in the definition:** `verdict: PASS`, `verdict: FAIL`, `findings_file:`, `must_fix_count:`, `blocker:`, `# Task plan review — iteration {iteration}`, `## Phase 2 Readiness — Ordered Fix List`, the readiness-entry shape (:87), `### Task N — <title>`, `## Unsolicited dispatch guidance`, `(disregarded for verdict purposes)`, `## Corpus staleness`, `stale-rule` and `undescribed-layer`.

**WIRE literals that stay verbatim in the new refs:**
- `rebutted round <j> — call stands`, which `fw_index_evidence` also parses (`cli/templates/scripts/lib/flow-walker-gates.sh:47–51`).
- The Scope-register table header.
- `// TODO: @claude add a follow up task for this:`.

## Draft work report template

The checklist is **embedded in the agent definition**, replacing `## Process`, and is filled in **once, immediately before returning**. Single-form template with `n/a` ticks; no separate PASS/FAIL templates.

```markdown
## Work report checklist
Fill in once before returning (in the findings file on FAIL, in `pass_report_<k>.md` on PASS) as `- [x] <ID>. **<title>** → <evidence>`; titles only, no descriptions. Gate off or not owed: `n/a — <reason>`. Evidence uses repo-relative paths, never absolute paths, timestamps or env output.

- [ ] R1. **Resolve root and config** — Run bare `git rev-parse --show-toplevel`; bind `## Resolved values` from `harness.config.json`. Evidence: "resolved", not the path.
- [ ] R2. **Read every conventions document** — Read each distinct `layers[].conventions` file in full; treat it as authoritative over memory.
- [ ] R3. **Read samples and lessons** — Read `sample_story_plan.md`, the three `sample_story/task_<N>_plan.md`, and `<state_dir>/lessons.md`.
- [ ] R4. **Read prompt, index, every task file** — Read `prompt_path`, the story index, every `task_<N>_plan.md`; open plan targets at cited ranges only.
- [ ] R5. **Block on an unreadable cited path** — If a cited file cannot be read, return `blocker:` naming it; write nothing.
- [ ] R6. **Screen the dispatch prompt** — Quote text beyond the five keys and `context_notes:` that steers, calibrates or narrows. (ref: this file → ## Unsolicited dispatch guidance)
- [ ] S1. **Index headings and order** — `# Story:`, prose `## Context` with `Top risks:`, readiness right after Context; no `## Tasks`, no index-level `### Targets`.
- [ ] S2. **Readiness entries match the literal** — Every entry matches the readiness-entry shape exactly, one layer, points ≤20. (ref: this file → ### Story-index structure)
- [ ] S3. **Scope register owed and placed** — Any durable-corpus target in a `### Targets` list requires the register, in order, rows anchored. (ref: plugin/instructions/scope_register_review.md)
- [ ] S4. **Re-run every derivation entry** — Execute commands verbatim, re-walk procedures, apply dispositions (i)–(iii). (ref: plugin/instructions/scope_register_review.md → ## Derivation test)
- [ ] S5. **Test each recorded rejection** — For each unrebutted `## Rejected findings` entry, test its reason; re-raise once where it fails. (ref: plugin/instructions/rejected_findings_rule.md)
- [ ] T1. **Index and files one-to-one** — Every entry has `task_<K>_plan.md`, every file one entry, and `### Task N` numbers agree.
- [ ] T2. **Each task file self-contained** — Goal, `**Work:**`, `**Verification:**`, `### Targets`, `**Source:**` when single-source; interfaces restated on both sides.
- [ ] T3. **Single layer, bottom-up order** — One configured layer per task, configured order, catch-all last, no forward `**Depends on:**`.
- [ ] T4. **Within granularity budget** — At most 20 points and at most 5 `**Work:**` bullets per task.
- [ ] T5. **Accompanying set per unit** — Every conventions-required companion is listed; raise one finding per missing item.
- [ ] T6. **No conventions breach or target** — No rule breach. No conventions doc in `### Targets`, entry titles or `change` register rows. `## Corpus staleness` typed `stale-rule`/`undescribed-layer`.
- [ ] T7. **No forbidden test run** — No bullet runs the test command, a gate script, or an untouched test file. (ref: plugin/instructions/unit_loop_core.md → ## The test-run rule)
- [ ] C1. **Map every prompt requirement** — Map each task-prompt requirement to a task file; list any unmapped.
- [ ] C2. **Consumers, gates, state, provisioning, lifecycle** — Check unconsumed units, client-only privileged gates, the shared-state source/mirror path, unlisted provisioning and missing lifecycle behaviours.
- [ ] C3. **No repeated lesson** — Compare the plan with each `lessons.md` entry; quote any it repeats.
- [ ] C4. **Should Fix band** — Missing `Top risks:`, a line-coordinate register `Site`, a baked-in derivation count: Should Fix, never Must Fix.
- [ ] P1. **Verify parity citations** — Parity on only: open each cited reference source in full; verify names, wire fields, thresholds, ordering, omissions. (ref: plugin/instructions/plan_parity_review.md)
- [ ] O1. **Write the findings or the pass report** — FAIL: `review_<iteration>.md` with each Must Fix naming its file. PASS: `pass_report_<k>.md` only.
- [ ] O2. **Return the exact verdict** — `verdict: PASS` alone, or the three-line FAIL block, with any guidance section above it. (ref: this file → ## Output contract)
```

25 items. This block measures 660 words (`wc -w`), and it sits in the definition, counted once. The **filed** form (ID, title, tick, evidence) is about 25 × 12 ≈ 300 words. It lands in the findings file the writer reads only on FAIL.

## Thinning plan

| File | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| `plugin/agents/task-plan-reviewer.md` (6 038) | See the arithmetic below | Unsolicited-guidance body 296 → about 180 (stays inline: R6 is unconditional). `<repo_root>` row → one line (about 30 words) keeping the worktree-not-main-checkout clause. | Frontmatter; key block; verdict exactness; guard carve-out :63; `blocker:` rule; `## Output contract`; every WIRE literal | **≈2 860** + checklist 660 |
| `.claude/context/*.md`, `.claude/CLAUDE.md` | nothing; adopter-owned | — | all | 14 380 |
| `plugin/samples/sample_task_plan.md` (1 399) | move to **on demand**: its split explanation and naming table are what S1, S2, T1 and T2 check | — | file unchanged | 0 up-front |
| Other 4 samples (2 837), `lessons.md` (1 199) | — | — | up-front ("quality bar", :59) | 4 036 |
| **New** `plugin/instructions/scope_register_review.md` (on demand) | — | — | :90–99 + :161–170 | ≈905 |
| **New** `plugin/instructions/plan_parity_review.md` (on demand) | — | — | parity group 491 + :72/:74–75 179 + docs tool :61 130 + tokens 148 | ≈948 |
| **New shared** `plugin/instructions/rejected_findings_rule.md` (on demand) | — | — | :100; the same rule is quoted by the 8 files that grep `rebutted round` | ≈164 |

**Agent-definition arithmetic** (measured line counts; the last line is an estimate):

| Step | Words |
|---|---|
| Today | 6 038 |
| Moved to refs: 532 + 373 + 164 + 491 + 179 + 130 + 148 | −2 017 |
| Redundant cut: Process remainder 110, `<repo_root>` row 140 → 30 (−110), preamble :14 111, `Edit` rationale 42, doctrine boilerplate 4 × 35 = 140, caller quote :50 about 30 | −543 |
| Unsolicited-guidance shortening | −116 |
| ACTION phrasing in the remaining checks now carried by items (about 775 ACTION words left after Process) | ≈ −500 |
| **After, before adding the checklist** | **≈2 862** |

The constraint margin below (−3 915) survives even a +1 500 error in this estimate.

The shared receiving-side file proposed earlier is **withdrawn**. Screening is unconditional (see the R6 response), and `dispatch_discipline_instructions.md:72` keeps the rule body in the definitions.

## Word-count ledger

| Up-front | Before | After | Delta |
|---|---|---|---|
| `task-plan-reviewer.md` (checklist embedded) | 6 038 | ≈3 522 (2 862 + 660) | −2 516 |
| `.claude/CLAUDE.md` | 1 695 | 1 695 | 0 |
| 3 conventions docs | 12 685 | 12 685 | 0 |
| `sample_task_plan.md` | 1 399 | 0 | −1 399 |
| Other 4 samples | 2 837 | 2 837 | 0 |
| `lessons.md` | 1 199 | 1 199 | 0 |
| **Up-front total** | **25 853** | **≈21 938** | **≈−3 915 (−15 %)** |

| On demand | Before | After |
|---|---|---|
| `task-plan-writer.md` | 6 476 | 6 476 |
| `unit_loop_core.md` test-run rule | 743 | 743 |
| `sample_task_plan.md` | — | 1 399 |
| `scope_register_review.md` | — | ≈905 |
| `plan_parity_review.md` | — | ≈948 |
| `rejected_findings_rule.md` | — | ≈164 |

**Constraint holds: yes.**
- With `sample_task_plan.md` kept up-front, the total is ≈23 337, still under 25 853.
- In this repository's worst case, plans almost always have durable-corpus targets (`plugin/*.md`), so `scope_register_review.md` and `rejected_findings_rule.md` are effectively read on every dispatch. That gives ≈23 007, still about 2 850 under today.
- On an adopter with parity on, the parity ref is effectively up-front too, and the total is still under today.

## Storage and lifecycle

| Question | Answer for this agent |
|---|---|
| Path (revised) | **FAIL:** a trailing `## Work report` section of `<state_dir>/task_plan_reviews/<branch>/review_<iteration>.md`. **PASS:** `<state_dir>/task_plan_reviews/<branch>/pass_report_<k>.md`. The `<state_dir>/work_reports/…` tree is not used. The key is the caller's existing `findings_folder` (lead 4), with no ledger id, so it works in the semi-autonomous and autonomous flows, which are the only two that dispatch this agent. |
| Index (lead 10) | On FAIL, the index is `iteration`, which is collision-safe: `fw_next_review_index` never back-fills (`flow-walker-gates.sh:34, 57–76`). On PASS, `iteration` is **not** safe: PASS writes no `review_<n>.md` (:192), so a `review` re-entry would get the same index again. The agent therefore picks `k` itself: the next free `pass_report_*.md` found with `Glob`. The name avoids the `review_` prefix, so neither `fw_next_review_index` (matches `review_*.md`, :63) nor `fw_round_count` (counts `review_*`, :80–87) shifts. No dispatch key, walker, graph or test change is needed. |
| Original `report_path` design (MF1) | The withdrawn sixth key would have touched `flow-walker.sh:382–385`, the `plan_review` graph node (`task_plan_writing.graph.json:102–106`), the `arg.*` assertions in `cli/test/flow-walker.test.mjs:98–106`, `flow-walker-ui-and-reentry.test.mjs:81–83` and `flow-walker-resume.test.mjs:91–93`, "with five keys" (`task-plan-reviewer.md:32`), and the core dispatch block (`task_plan_writing_instructions_core.md:212–218`). Without all of those, the extra key arrives as unsolicited text. This cost is the reason it was dropped. |
| Tools (lead 1) | `Read, Glob, Grep, Bash, Write, mcp__harness-docs__search_docs`; no `Edit` (:4). `sed -i` and `mkdir -p` are allow-listed for unattended runs (`cli/templates/claude/settings.autonomous.json:39, :45`; `plugin/hooks/lib/harness-config-lib.sh:62`), so in-place ticking would run. **The choice is a single write at the end**: the findings file is already one end `Write`, and in-place `sed` edits would defeat the tool-level read-only guarantee (:10). `cp` is not allow-listed, so the checklist lives in the definition, not in a template file. |
| PASS must not touch disk (lead 2) | `:50` and `:192` must be narrowed to "no findings file on PASS". The PASS path now creates the findings folder, so core :210 ("only when it has findings to write") and `task_plan_writing_instructions_semi_autonomous.md:40` ("where none exists (every plan reviewer passed first time), say nothing") must change wording too. |
| Commit, autonomous | The convergence commit already stages `task_plan_reviews/<branch>/` whole (`task_plan_writing_instructions_autonomous.md:140, :151`), so the "Pass all six" literal does **not** change. Untracked `<state_dir>` files are tolerated at checkpoints (`plan_orchestration_instructions_autonomous.md:281`). Remote runs bundle the same folder (`cli/templates/scripts/lib/harness-run-lib.sh:2151`), where a separate `work_reports/` tree would be lost. |
| Commit, semi-autonomous (lead 8) | No flow step commits anything; the fork only tells the user to include the plan-review folders (`…_semi_autonomous.md:40`). The report has the same fate as the findings: committed if the user follows that note. Acceptable, given the line's wording fix above. |
| Hooks | `plugin/hooks/hooks.json` registers only `Bash` matchers, so `Write` is unguarded. |
| Gitignore | The managed block ignores only run-control files: `RUN_CONTROL_ARTIFACTS` (`cli/src/generators/repoRoot.ts:231–240`), rendered here as `.gitignore:35–47`. The folder is trackable. |
| Orphan check (lead 9) | n/a. `review-plan-reviewer`'s orphan rule (`review-plan-reviewer.md:108`) applies to `finding_<N>.md` in code-review folders, not to `task_plan_reviews/`. |
| Diff reviewers (lead 5) | `branch-reviewer` excludes `':(top,exclude)<state_dir>/*<branch>*'` from its diff (`branch-reviewer.md:83`), so committed reports are not graded as change-set content. |
| Leaks (lead 12) | R1's natural evidence, the absolute `git rev-parse` output (a home directory), would be committed. The checklist header and R1 therefore require "resolved" and repo-relative paths only, with no timestamps, so no-op re-commits stay no-ops. |

## Risks and costs

- **The writer reads the embedded section (lead 11).** `task-plan-writer.md:153` treats the findings file as authoritative, and :52 says to apply only Must Fix items. A trailing section of imperative descriptions could be misread as instructions. Mitigation: the filed form carries IDs, titles and evidence only, under `## Work report`, after `## Nice to Have`. Cost to the writer: about 300 words per revision.
- **Goal (a) is unverifiable for timing.** A single end write is self-attested. The orchestrator must not read review artifacts (`task_plan_writing_instructions_core.md:313`). Only the evidence tails can be audited, after the fact.
- **Ref-starvation is the biggest risk.** This agent's "reference" prose is its grading standard. Refs sit only on conditional items: S3–S5 (register and rejections) and P1 (parity). Unconditional rules, including the receiving-side screen, stay inline. In this repository, though, S3 and S4 fire on nearly every plan, so the Scope-register ref is effectively mandatory reading, and an agent that skips it grades the register from guesswork.
- **Opposite cardinalities.** "One finding per missing item" (T5) and "one Must Fix listing every site" (S4 (i)/(ii)) are easy to swap once detached from their rationale. Keep both stated in the item or its ref, never only implied.
- **Cutting `<repo_root>` leans on adopter-editable text.** `.claude/CLAUDE.md` is "yours from there on: edit it freely" (`cli/templates/claude/CLAUDE.md` footer), so the definition keeps a one-line rule, including the worktree-not-main-checkout clause (:23).
- **Cost.** No extra tool calls on FAIL; one `Glob` and one `Write` on PASS. About 300 output words per dispatch. Per-item re-`Write` (about 25 × 660 words) was rejected.
- **The return contract is unchanged.** "Keep the return message to those 3 lines" (:219). The report path is not returned.
- **Tests and scripts.** With the revised design, no script or test changes. `cli/test/flow-walker*.test.mjs` key on the agent name, `arg.iteration` and the heartbeat only, and neither `review_*` counter sees `pass_report_*`. The prose edits listed under PASS above are cross-file wording changes, per CLAUDE.md's rule that a quoted literal is "an edit to every file that quotes it".

## Open questions

1. Is "FAIL → section of the findings file; PASS → `pass_report_<k>.md` in the same folder" the cross-agent pattern for reviewers whose PASS writes nothing (`architecture-reviewer`, `business-parity-reviewer`, `ui-tests-plan-reviewer`)?
2. Is goal (a) formally downgraded to "evidence of reads and commands", given that a single end write is the chosen tick mode?
3. Does `scope_register_review.md` have one owner shared with `task-plan-writer.md` (the writer side of the same register), or are there two files?
4. Should `sample_task_plan.md` leave the up-front set for the writer too? It duplicates the reviewer's own structural checks.
5. Who reads the reports? Without a consumer, goal (a) delivers storage, not assurance.

## Review response

All Must Fix and Should Fix findings were applied; none were rebutted.

- **MF1:** applied. The cost of the original design is named in Storage → "Original `report_path` design", and the revised storage avoids it.
- **MF2:** applied. The `sed` allow-list claim is corrected.
- **MF3:** applied. Supervised is removed from the dispatch table.
- **SF1:** the count is now 25 items, after C4 was added.
- **SF2:** the arithmetic is shown.
- **SF3:** applied via S1, T6, C2, C4 and R4.
- **SF4:** S2 now points to the literal.
- **SF5:** the checklist header says "fill in once before returning".
- **SF6:** the body is kept inline and the shared file withdrawn.
- **SF7:** leads 8, 11 and 12 have rows.
- **SF8:** a one-line `<repo_root>` rule is kept.
- **NtH 1 and 2:** applied.
- **Own correction:** `## What to check` is 3 562 words (`sed -n '78,171p' | wc -w`), not 3 200.
