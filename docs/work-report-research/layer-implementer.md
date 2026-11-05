# Work report research — layer-implementer

## Verdict

**Recommend with changes.** The agent definition is 6 287 words. About 2 300 of them apply only on rare branches: the catch-all layer, row `G.4`, and the two disposition classes. Moving those branches to on-demand files cuts this agent's own up-front load, including a 456-word template, from 6 287 to an estimated 2 756 words. The hard constraint holds with a margin of about 3 500 words. Most of that saving is relocation, not the checklist: the checklist itself replaces about 1 400 words of action prose with 456 words of items.

Three changes to the proposal are needed:
- **Storage.** Do not use a per-run `work_reports/<branch>/<phase>/<agent>/report_<index>.md` file. It breaks the committer's subject reconciliation for dispositioned units, and it needs a phase key that the implementer cannot see and that the fixed dispatch prompt cannot carry. Instead, write the report as a **`## Work report` section of the unit's own detail file**. Keep only the latest section per layer, and write it only after the inputs are confirmed readable.
- **Ticking.** Tick at four checkpoints, not on every item.
- **Other edits.** Three staging sentences and three readers of the detail file need small edits; see `## Storage and lifecycle`.

## Read tree

Paths are relative to the checkout root (from `git rev-parse --show-toplevel`). The counts are `wc -w`.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/layer-implementer.md` (system prompt) | up-front | 6 287 |
| `.claude/CLAUDE.md` (auto-loaded; adopter template `cli/templates/claude/CLAUDE.md` = 1 320) | up-front | 1 695 |
| Dispatched `layers[].conventions`: this repo's `.claude/context/plugin.md` 4 174 / `cli.md` 2 647; template `cli/templates/claude/context/layer.md` 441 | up-front (one) | 2 647–4 174 |
| `.claude/context/conventions.md`. `.claude/CLAUDE.md:40` routes "**Any implementation**" here, for every layer (lead 13); adopter template 974 | up-front | 5 864 |
| Catch-all dispatch only: **every** `layers[].conventions` (`layer-implementer.md:84`) | up-front on `path "."` | 12 685 (this repo) |
| `harness.config.json` (the layer set, `layer-implementer.md:84`; the `commands.*` / `phases.*` reads in `## Resolved values`) | up-front | 154 |
| `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1–6 (lines 140–153). "Apply" on every dispatch (`layer-implementer.md:152`) | up-front | 644 |
| Unit detail file; fix iteration: findings file; row `A`: story index `## Context` | up-front, variable | n/a (point-in-time) |
| `unit_loop_core.md` → `## Substitution table` (row-`G.4` match `:154`, gate-class phase derivation `:172`) | on demand | 4 333 |
| `plan_orchestration_instructions_core.md`, via `grep -n '^## Phase'` only (`:172`) | on demand (grep) | — |
| Typecheck wrapper `scripts/typecheck.sh` (`:152`) | on demand | 450 |
| `.claude/settings*.json` (standing-prohibition check (c), `:170`) | on demand | 20 |
| `plugin/agents/docs-writer.md` (cited only to fence out the docs corpus, `:70`) | on demand (never needed) | 3 483 |
| `harness-runs/lessons.md` | **not read**: `.claude/CLAUDE.md` scopes it to branch-level planning and review | 1 199 |

**Which read list wins.** The larger set wins. `CLAUDE.md` is auto-loaded and its routing row is unconditional, so `conventions.md` is read alongside the dispatched document even though the agent's `## Read first` names only the dispatched one.

**Up-front totals.**

| Dispatch shape | Sum | Total |
|---|---|---|
| `plugin` layer of this repo | 6 287 + 1 695 + 4 174 + 5 864 + 154 + 644 | **18 818** |
| Catch-all (`general`) | 6 287 + 1 695 + 12 685 + 154 + 644 | **21 465** |
| Fresh adopter (`layer.md` + `conventions.md` template) | 6 287 + 1 320 + 441 + 974 + 154 + 644 | **9 820** |

## Dispatch sites and phases

| Site | Rows / phases | Flow |
|---|---|---|
| `unit_loop_core.md` → `## The unit loop` step 3 (`:71`) | `A`, `A1.5.3`, `A2.3`, `C`, `C2.4`, `E.3` and `G.4` (family 1); `UR-A`, plus `E.3` / `G.4` reached via family 3 (`user_review_fixes_instructions_core.md`) | semi-autonomous + autonomous |
| `plan_orchestration_instructions.md` → steps 1–2 (`:28–44`) | one item per session; no rows, no ledger, no `layer-reviewer` | supervised (also reached from `code_review_fixes_instructions.md`, `user_review_fixes_instructions.md` and `task_plan_implementation_instructions.md`) |
| `commands/branch-implement-plan-semi-autonomous.md:24`, `branch-implement-user-review-semi-autonomous.md:23` | Phase A / fix Phase A | semi-autonomous entry |
| `docs_orchestration_instructions_autonomous.md:131` | explicitly **not** dispatched | docs flow |

There is one dispatch per layer, per unit, per review iteration (`unit_loop_core.md:71–79`).
- **Measured run.** The main checkout's `harness-runs/autonomous_logs/fix_run_gates_typecheck.log` has **18** implementer dispatches: 12 in `A`, 5 in `C` (`Item 1` ran twice, in layers `cli` and `general`) and 1 in `C2`. All were `iter 0`.
- **Fix iterations.** When `<per_unit_review>` is on, each fix iteration adds one more dispatch, up to 5 per layer (`unit_loop_core.md:108`).

## Prose classification

The section totals are measured with `sed -n 'a,bp' | wc -w`. The per-class split is my allocation of each measured total.

| Section (`layer-implementer.md` lines) | Total | ACTION | REF | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter 1–6 | 64 | — | — | 64 | — | `name`, `tools` |
| Intro 8 | 38 | — | 38 | — | — | |
| `## Resolved values` 10–28 | 852 | 120 | 400 | 120 | 212 | The typecheck row's refused-call fallback is cited by `unit_loop_core.md:152`. The `<app_root>` row is bound with no consumer (`:21`) |
| `## Invocation contract` 31–46 | 233 | 50 | 60 | 123 | — | Prompt forms are wire (`unit_loop_core.md:72–73`) |
| `## Scope` 48–57 | 221 | 120 | 61 | — | 40 | |
| Durable-citation rule 58 | 123 | 40 | 33 | — | 50 | |
| `## Minimal prose` 60–72 | 500 | 80 | 250 | — | 170 | |
| `## Read first` 74–78 | 152 | 70 | 30 | — | 52 | |
| Catch-all intro 80–84 | 162 | 60 | 60 | — | 42 | `layer-reviewer.md:115` keeps its own copy |
| Surfaces 86–92 | 150 | — | 150 | — | — | |
| Keep files focused 94–101 | 174 | 60 | 80 | — | 34 | |
| Artifact intro 103–107 | 52 | — | 30 | — | 22 | |
| Name the consumer 109–115 | 209 | 90 | 119 | — | — | |
| Never publish a statistic 117–124 | 192 | 60 | 132 | — | — | |
| Match a sibling's schema 126–130 | 105 | 25 | 30 | — | 50 | Sections 80–130 measure 1 044 as one range (the per-row sum is 1 053, which includes blank-line separators) |
| `## Working modes` + supervised 132–138 | 65 | — | 65 | — | — | Heading cited by `plugin/samples/sample_story_plan.md:21` |
| Semi/autonomous self-research 140–144 | 107 | 70 | 37 | — | — | |
| Plan-deviation 146–150 | 84 | 30 | — | 34 | 20 | `**Deviations from plan:**` is quoted by `committer.md`, `layer-reviewer.md`, `review-plan-reviewer.md` and `unit_loop_core.md` |
| What you run 152 | 115 | 50 | 65 | — | — | |
| Row-`G.4` check 154–162 | 257 | 150 | 70 | 37 | — | `**Failing test:**`, `none — ` |
| Already-passing record 164 | 64 | 20 | — | 44 | — | `## Already passing` is quoted by `unit_loop_core.md:134` |
| Probe route 166 | 213 | 70 | 90 | 30 | 23 | Points at `**Standing-prohibition disposition.**` "below" |
| Evidence downgrade 168 | 160 | 60 | 70 | 30 | — | **Bold lead cited verbatim** by `unit_loop_core.md:148` |
| Standing prohibition 170 | 219 | 50 | 169 | — | — | |
| Unsatisfiable gate 172 | 460 | 60 | 330 | 30 | 40 | `**Unactioned under a gate:**` |
| Disposition record 174 | 220 | 40 | 100 | 80 | — | `## Disposition` (a)–(d) is quoted by six files |
| What this route does not change 176 | 45 | — | 45 | — | — | |
| Readiness-index licence 178 | 236 | 40 | 80 | 16 | 100 | Restated in `sample_story_plan.md:21` |
| Findings win 180 | 59 | 30 | 29 | — | — | |
| `## Output contract` 182–195 | 380 | — | 80 | 300 | — | Item 3 is an adopter-replaced placeholder |
| Blocker forms 197–201 | 209 | — | 59 | 150 | — | `blocker: prohibited — …; disposition appended to `, `already passing — `, `; record appended to ` |
| Wire rationale 203 | 166 | — | 66 | 60 | 40 | |
| **Total** | **6 286** | **1 445** | **2 828** | **1 118** | **895** | |
| `unit_loop_core.md` test-run rule 140–153 | 644 | ~250 | ~300 | — | ~94 | **Roster-locked**: "a citer points and never restates" (`:174`) |

`CLAUDE.md` and the conventions documents are adopter-owned and are REFERENCE for this agent, so they are not thinned here. One point for the synthesis: `.claude/CLAUDE.md` → `## Where a change request runs` (about 480 words) is paid for by every dispatched agent, and its clause 2 makes it inert for them.

## Draft work report template

**One template with conditional items.** An item that does not apply is ticked `[-]` with a reason. The template measures 456 words with `wc -w`.

```markdown
## Work report — layer-implementer · <layer> · <first | fix: <findings_file basename>>
<!-- Record, not spec: readers of this detail file skip it. Write after L2 passes, replacing this layer's earlier section; tick after L4, L7, L11, L15. `[-] <reason>` = not applicable. -->
- [ ] L1. **Confirm the three dispatch values** — Layer name, path scope and conventions file present; any absent → return `blocker: ` naming it, write nothing.
- [ ] L2. **Read conventions and the unit** — Read the dispatched conventions document and the detail file in full; unreadable input → blocker naming the path, write nothing.
- [ ] L3. **Catch-all: load every layer's rules** — Path `"."` only: read every `layers[].conventions` and the catch-all authoring rules. (ref: instructions/catch_all_authoring.md)
- [ ] L4. **Read the latest findings file** — Fix iteration only: findings beat the plan; a conflict with conventions or reference source is surfaced, never guessed.
- [ ] L5. **Run the row-G.4 named-test check** — Row G.4 only, before any edit; named test passes → `## Already passing` record, then return. (ref: instructions/layer_implementer_closures.md → ## Row G.4)
- [ ] L6. **Find templates and mandated symbols** — Glob your path for sibling schema and the conventions' mandated symbols; reuse before inventing; parity on → open every cited reference file.
- [ ] L7. **Implement inside the path scope** — Touch nothing outside the dispatched path; out-of-scope need or missing lower-layer symbol → blocker.
- [ ] L8. **Keep durable text minimal** — No line coordinates in durable files; every line names a reader it saves.
- [ ] L9. **Probe only under scratch** — Probes and mutations run via `scratch-run.sh` under `<state_dir>/scratch/`; revert every mutation before L10.
- [ ] L10. **Run the whole-tree type check** — `<typecheck_cmd>` as written, foreground; paste its verdict line, paths repo-relative, no home dir or timestamp. (ref: instructions/unit_loop_core.md → ## The test-run rule)
- [ ] L11. **Run only this unit's test files** — Each test file this unit wrote or edited, through `<test_file_cmd>`; list each result or skip reason, same path rule.
- [ ] L12. **Record deviations and downgrades** — Plan corrections, unexecuted `**Verification:**` bullets and evidence downgrades go under `**Deviations from plan:**` in the detail file.
- [ ] L13. **Record a gated or refused unit** — Part gated → `**Unactioned under a gate:**`; whole unit refused or gated → `## Disposition`. (ref: instructions/layer_implementer_closures.md → ## Disposition)
- [ ] L14. **Leave readiness markers alone** — No marker or line change in a `## Phase 2 Readiness — Ordered Fix List` unless the task assigns that file.
- [ ] L15. **Return the output contract** — Items 1–7, or exactly one blocker form from `## Output contract`, verbatim.
```

| Mode | Handling |
|---|---|
| L1 / L2 blocker | **No report is written.** The section is first written at the L4 checkpoint, so the blockers at `layer-implementer.md:41` and `:78` ("change no file") still leave the detail file untouched, and a tracked file is never left dirty on an escalation (`autonomous_pause_and_ledger.md` → `### 2.2`). |
| First iteration | L4 `[-]` |
| Fix iteration | The header names the findings file, and the section **replaces** this layer's earlier one. At most one section per layer in the file. |
| Non-catch-all | L3 `[-]` |
| Not row `G.4` | L5 `[-]`. Detection is a path test: the detail file is under `<state_dir>/test_fix_plans/` (`plan_orchestration_instructions_core.md:86`). |
| `G.4` already passing | L6–L13 `[-] closed at L5` |
| Disposition | L7 records "no code file", and L13 is the record |

**Tools (lead 1).** The template is embedded in the agent definition, which avoids a Read of a separate template and avoids `cp`. The report is written with the `Edit` tool, at checkpoints. In-place ticking would also work with `sed -i`, which is allowlisted, but `Edit` is in this agent's tools and is the simpler route.

## Thinning plan

All "after" figures are **estimates**. Only the template was drafted and counted; neither new file is drafted.

| File / section | Remove | Shorten | Keep verbatim | Today → est. after |
|---|---|---|---|---|
| Frontmatter, intro | — | — | all | 102 → 102 |
| `## Resolved values` | Preamble's placeholder taxonomy; `<app_dir>` / `<app_root>` rows | Each row to its source | Token names; typecheck row's run-as-is, refused-call fallback and `<none>` clauses (`unit_loop_core.md:152`) | 852 → ~470 |
| `## Invocation contract` | — | Stop condition → L1 | Values table, both prompt forms | 233 → ~200 |
| `## Scope` + durable-citation rule | Rationale sentences | Actions → L6/L7 | Durable vs point-in-time line rule | 344 → ~140 |
| `## Minimal prose` | Restatement footer; docs-writer fence (drops a 3 483-word citation) | To the delete-the-line test + code-comment rule | Heading | 500 → ~150 |
| `## Read first` | Rationale | → L2 | "Unreadable is a blocker" | 152 → ~40 |
| Catch-all + `## Writing an artifact` (80–130) | **Relocate** to new `plugin/instructions/catch_all_authoring.md` (~850) | — | Heading stub + pointer | 1 044 → ~30 |
| `## Working modes` (132–150, 180) | — | Self-research → L6; findings-win → L4 | Heading (`sample_story_plan.md:21`); `**Deviations from plan:**` + example | 315 → ~170 |
| What you run, probe route | Repeated test-run-rule clauses | To pointer + scratch-run invocation | Scratch-run invocation and extension list. **Retarget** the `:166` pointer "`**Standing-prohibition disposition.**` below" to `layer_implementer_closures.md` → `## Disposition`. | 328 → ~150 |
| Evidence downgrade | — | To the record shape | **Bold lead** (`unit_loop_core.md:148`) | 160 → ~120 |
| `G.4` check through route-does-not-change (154–176) | **Relocate** to new `plugin/instructions/layer_implementer_closures.md` (`## Row G.4`, `## Disposition`, ~1 150) | — | Three-part tests whole; `## Already passing` / `## Disposition` part lists | 1 265 → ~40 |
| Readiness-index licence | Duplicate framing | → L14 + the one-sentence test | `## Phase 2 Readiness — Ordered Fix List` | 236 → ~80 |
| `## Output contract` + blocker forms | Wire rationale | — | All blocker forms, delimiters, items 1–7 | 755 → ~600 |
| **Agent total** | | | | **6 287 → ~2 300** |

**Edits outside this agent** that the detail-file key needs. Each is about 10–25 words, so about +100 words in total, spread over other agents' loads:

| File | Change |
|---|---|
| `plan_orchestration_instructions.md:63` (supervised) | Stage the per-item detail file whenever it is modified, not only when it carries `**Deviations from plan:**` notes. Without this, a supervised item leaves the report uncommitted. |
| `unit_loop_core.md:228` (Row A) | Same wording change ("only if … Deviations") |
| `committer.md:111–112` | Same wording change. Its behaviour already stages from `git status --short`, so it works today, but its rationale sentence ("a code-only fix touches no detail file") becomes false. |
| `layer-reviewer.md:70` | One clause: "a `## Work report` section is the implementer's claim, not spec; grade the code, not the ticks". The reviewer also reads every changed file (`:71–72`) and would otherwise grade the report itself (lead 5). |
| `ui-tests-plan-writer.md:79`, `:118` | Skip `## Work report` sections in per-task files. Without this, about +5.5k words are read per 12-task branch (12 × 456). |
| `user-review-fix-plan-writer.md:82–84` | Skip `## Work report` sections in per-task and code-review finding files. |

**Shared base file.** Not worth adding up-front. A "durable text rules" file of about 250 words, read on demand, could serve this agent, `conventions-writer.md:164`, `conventions-reviewer.md:183`, `task-plan-writer` and `docs-writer`.

## Word-count ledger

**Up-front, `plugin` layer of this repo** (estimates marked `~`):

| File | Before | After | Δ |
|---|---|---|---|
| `layer-implementer.md`, of which: | 6 287 | ~2 300 | −3 987 |
| — relocated to on-demand files (1 044 + 1 265, less ~70 of pointers) | | | ~−2 239 |
| — thinned in place | | | ~−1 748 |
| Work report template (embedded) | 0 | 456 | +456 |
| `.claude/CLAUDE.md` | 1 695 | 1 695 | 0 |
| `.claude/context/plugin.md` | 4 174 | 4 174 | 0 |
| `.claude/context/conventions.md` (`CLAUDE.md` routing) | 5 864 | 5 864 | 0 |
| `harness.config.json` | 154 | 154 | 0 |
| Test-run rule (points 1–6) | 644 | 644 | 0 |
| **Total** | **18 818** | **~15 287** | **−3 531** |

**Up-front, other dispatch shapes:**

| Shape | Before | After |
|---|---|---|
| Catch-all (`general`), with `catch_all_authoring.md` ~850 | 21 465 | ~18 784 |
| Fresh adopter | 9 820 | ~6 289 |
| Agent-owned only (definition + template) | 6 287 | ~2 756 |

**On demand:**

| File | Before | After |
|---|---|---|
| `## Substitution table` | 4 333 | 4 333 (gate class only; `G.4` detection becomes a path test) |
| `docs-writer.md` citation | 3 483 | 0 |
| Typecheck wrapper, settings | 470 | 470 |
| `layer_implementer_closures.md` (new) | — | ~1 150 |
| `catch_all_authoring.md` (new; up-front on catch-all) | — | ~850 |

**Constraint holds: yes**, in every dispatch shape. It still holds if the estimates are off by 50 %, because the margin is about 3 500 words. It holds because the conditional branches move out: if the template were added with no moves, the total would rise by 456. Edits to other agents add about +100 words to their own loads.

## Storage and lifecycle

| Question | Finding |
|---|---|
| Dispatch volume | Per layer, per unit, per review iteration. The measured run had 18 per branch, and two layers of one unit can share a phase (`C · Item 1 · cli` / `general`). |
| Proposed `<phase>` key | **Not available to the agent.** The prompt is fixed: "nothing else may be appended" except one `context_notes:` line (`unit_loop_core.md:75`). Row ids do not map 1:1 onto ledger ids (`A1.5.3`↔`A1.5f`, `E.3`↔`E`/`R4`, `UR-A`↔`R3`), and `E.3` / `G.4` occur in both engines. The supervised flow has neither rows nor a ledger. |
| `report_<index>` (lead 10) | Next-free numbering erases unit, layer and iteration. The implementer is never given `iteration`; only the reviewer is (`unit_loop_core.md:97`). The detail-file key has **no index**, so it cannot collide: one section per layer, replaced on each fix iteration. |
| Separate file vs commit (lead 3) | The committer stages untracked files from `git status --short` (`committer.md:111`). Its subject test, "any path other than `plan_path` and the unit's own detail file?" (`committer.md:83`), then always answers yes. Dispositioned and already-passing units lose the `record disposition of …` subject and the `staged: index-only` line that `unit_loop_core.md:80` reads. |
| **Recommended key (lead 11)** | Write the report as `## Work report — …` in the **unit's detail file**. The agent is already licensed to write there (deviation notes, `## Disposition`, sub-step `- [ ]` bullets, `layer-implementer.md:178`). Unit loop step 1 ignores `[ ]` outside the readiness section (`unit_loop_core.md:69`). The file exists in supervised flows too. Phase, unit and layer are implicit in its path and header. The improvement-observations "index-only commit" class already admits the detail file (`improvement_observations_instructions.md:65`), so a no-code unit keeps its class. **The edits it needs are listed in `## Thinning plan`.** |
| Readers of the detail file | Affected, and given a skip or claim clause: `layer-reviewer` (`:70–72`), `layer-implementer` itself (`:144`, on the next layer and on each fix iteration; bounded by keeping one section per layer), `ui-tests-plan-writer` (`:79`, `:118`) and `user-review-fix-plan-writer` (`:82–84`). Unaffected: `statistics-plan-writer` (reads no detail file, `:33`), `branch-reviewer` (excludes `<state_dir>/*<branch>*`, `:83`) and `review-plan-reviewer` (its orphan check is file-level and no new file is added, `:108`; lead 9). |
| PASS / no-commit paths (leads 2, 8) | Not applicable: this agent has no PASS verdict, and every non-blocker dispatch is followed by the unit's commit. Escalating blockers write no report (template mode table). |
| Tools, hooks | `Edit` is in the agent's tools. All `hooks.json` matchers are `Bash`. `Write`/`Edit` are allowed under the repo root (`settings.autonomous.json`); `cp` is not, and it is not used. |
| Evidence leakage (lead 12) | Detail files under `harness-runs/task_plans/…` are tracked (`git check-ignore` exit 1). Gate 6a greps the tree for `$HOME` (`scripts/run-gates.sh:141`). L10 and L11 therefore require repo-relative paths with no home dir or timestamp, the same rule as `test-fix-plan-writer.md:77`. |

## Risks and costs

- **Tool calls.** Ticking every item costs about 15 Edits × 18 dispatches, roughly **270 extra calls per branch**. Four checkpoint Edits make roughly **72**.
- **Spec pollution.** The section sits inside the reviewer's and the writers' ground-truth file. If the skip and claim clauses are not landed, self-attested `[x]` lines are read as spec.
- **Leakage.** A pasted verdict line can carry an absolute path, and gate 6a fails a tracked file containing `$HOME`. The path clause in L10 and L11 is the mitigation, and it relies on the agent following it.
- **Goal a: evidence of work.** Tick timing is invisible in the committed file. It is verifiable only from `*.stream.jsonl` transcripts, which only autonomous runs keep. The real evidence is the pasted lines in L10 and L11, which overlap output-contract item 5.
- **Goal b: missed rules.**
  - Conditional items put this agent's rare branches on the path: `G.4`, disposition, readiness markers and foreground runs.
  - The three-part admissibility tests stay whole in the reference file. Split into items they would invite misapplication: a wrongly closed unit "closes a finding nobody fixed" (`unit_loop_core.md:77`).
  - The roster lock means L10 and L11 can only point at the test-run rule, not restate it (`unit_loop_core.md:174`).
- **Cross-file literals that must not move:**
  - The bold lead `**An evidence downgrade is recorded, in every mode.**` (`unit_loop_core.md:148`)
  - `## Resolved values` and `## Working modes`
  - `**Deviations from plan:**`, `## Disposition` and `## Already passing`
  - All three blocker forms

  No test under `cli/test/`, script or hook keys on the moved prose.

## Open questions

1. Should `layer-reviewer` and `committer` record into the same detail file, so that one file holds the unit's whole record?
2. Should output-contract items 1, 5 and 6 shrink to "see work report in `<detail_file>`"? The loop parses only blocker lines (`unit_loop_core.md:77`), but the supervised orchestrator reads the prose.
3. Should `catch_all_authoring.md` also replace `layer-reviewer`'s own `## Catch-all layer additions` (`layer-reviewer.md:115`)?
4. Should `CLAUDE.md`'s `## Where a change request runs` (about 480 words, inert for every dispatched agent) move to an on-demand file?
5. `Bash(git mv:*)` is in the autonomous `ask` list (`cli/templates/claude/settings.autonomous.json:80`), yet output-contract item 2 asks for `git mv` confirmations. This pre-existing conflict was kept out of the checklist; should it be resolved?

## Review response

Every Must Fix, every Should Fix and all five Nice to Have items are applied; nothing is rebutted.

| Finding | Change made |
|---|---|
| Must Fix 1 | The "no change needed" claim is replaced by the edit list in `## Thinning plan`. |
| Must Fix 2 | The report is first written at the L4 checkpoint, so L1 and L2 blockers write nothing. |
| Should Fix 1–6 | Reader table and the "record, not spec" header line; the leakage clause in L10/L11; the `conventions.md` and config rows added to the read tree; estimates labelled, with relocation split from thinning; latest-section-per-layer made part of the recommendation; the `:166` pointer added to the thinning plan. |
| Nice to Have | Lines 140–153 = 644 words; 1 044 words; L8's `ref:` dropped; `git mv` moved to Open question 5; report trimmed. |
