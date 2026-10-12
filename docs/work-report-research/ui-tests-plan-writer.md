# Work report research — ui-tests-plan-writer

## Verdict

**Recommend with changes.** The definition is 5 671 words, and about 1 809 of them (32 %) are redundant. The rules `ui-tests-plan-reviewer` grades against have to stay in that definition, so it thins only to about 2 980 words. The up-front load of a QA-enabled dispatch falls from 23 127 to 14 619 words, so the hard constraint holds.

Three points about where that saving comes from:

- **About 79 % of the saving (−6 719 words) is not the work-report mechanism.** It comes from reading only the 482-word capability set of `qa-tester.md` instead of the whole 7 201-word file.
- **The mechanism itself costs +902 words** (template 652 + shared base 250).
- **The mechanism alone would break the constraint** (23 127 → 24 029). It holds only together with the thinning.

The changes required:

1. Keep every rule the reviewer grades in the definition, as REFERENCE, with template items `ref:`-ing it.
2. Return the report inline, with no file, on the three no-write paths: `no_ui`, a zero-change augment, and `blocker:`. Put it in a fenced block under one `## Work report` heading.
3. Key the report by prompt verb, with the agent segment before the mode segment.
4. Add the report path to Override 3's staging list.
5. Tick per section, with repo-relative evidence lines.

## Read tree

**Measuring basis.** In this repository `phases.qa` is `false`, and the walker never dispatches `ui_writer` (`cli/test/flow-walker-ui-and-reentry.test.mjs:166–176`). The only dispatch this agent can get here is the caller-bug path at `plugin/agents/ui-tests-plan-writer.md:12`. The realistic basis is therefore `examples/notes-app/`: `phases.qa: true`, `qa.driver: web-playwright`, with `presentation` as the surface layer.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/ui-tests-plan-writer.md` | up-front | 5 671 |
| `.claude/CLAUDE.md` (auto-loaded; notes-app) | up-front | 1 676 (this repo: 1 695) |
| `examples/notes-app/.claude/context/conventions.md`, required by `CLAUDE.md:32` for "any implementation, review or planning" (lead 13) | up-front: `CLAUDE.md` wins over the definition's narrower list | 5 125 |
| Surface layer conventions `presentation.md` (definition `## Read first`, :80) | up-front | 3 012 |
| `qa-tester.md`, read whole as the driver's variant (:84) | up-front | 7 201 |
| `<state_dir>/lessons.md` (:85) | up-front | 442 (this repo: 1 199) |
| Task prompt, story `## Context`, per-task files, fix plan or findings | up-front | variable; the same before and after, so excluded |
| **Up-front total, notes-app** (without `conventions.md`: 18 002) | | **23 127** |
| **Up-front total, this repo** (caller-bug path; the gate at :12 reads nothing) | | **7 366** |
| `qa-tester-mobile-maestro.md` / `qa-tester-mobile-mcp.md`, **instead of** `qa-tester.md` under a mobile driver | up-front | 1 183 / 1 337 |
| `.claude/qa_test_scenarios.md` (:137–139, :181) | on demand (when accounts are involved) | 1 231 |
| Surface source greps (:81, :123); `<docs_root>` and `search_docs` (:82–83, `phases.docs` only) | on demand | variable / n/a |
| `task-plan-writer.md` (named as "same shape", :14, :203) | not read | 6 476 |

## Dispatch sites and phases

| Site | Flow | Prompt (mode) | Node / ledger | Times per branch |
|---|---|---|---|---|
| `task_plan_writing_instructions_core.md` → `### 1. Spawn ui-tests-plan-writer` (:230–254) | semi-autonomous and autonomous planning | `Write…`, then `Revise…` | walker node `ui_writer` (`task_plan_writing.graph.json:130`); `P2` (autonomous only) | 1 + up to 5 revisions (graph :8 `cap: 5`), plus one per answered question |
| `qa_test_instructions.md` → `### 1.` step 3 (:38–55), from `/branch-qa-test` | supervised | `Write…`; `Augment…` only on the user's request | none | 0–1 |
| `user_review_fixes_instructions_core.md` → `### QA.0` step 2 (:155–163) | semi-autonomous and autonomous user-review | `Augment…`, sent in every case | no node; `R4` (autonomous only) | 1 per round |
| `/branch-start-plan` step 9 (`plugin/commands/branch-start-plan.md:46`) | supervised | optional | none | 0–1 |

**Prompt drift.** The augment prompt differs at all three quoting sites:

- the definition at :51 carries `Index:` and `Per-test files:`;
- `qa_test_instructions.md:50–54` carries neither;
- core :158 uses `<fix_plan_path>`, `<fix_finding_dir>`, `<ui_test_index>` and `<ui_test_files_dir>`.

Only the leading verb is stable, so that verb is what the mode key uses.

## Prose classification

These are agent-definition sections, measured with `sed -n 'a,bp' | wc -w`. The A/R/W/X split is a hand classification that sums to each row's total. Where an ACTION row states a rule the reviewer grades (marked **G**), the action moves to the template and **one REFERENCE statement of the rule stays** in the definition (Must Fix 1 of the review).

| Lines: section | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| 1–6 frontmatter | 100 | | | 100 | | |
| 7–14 intro, phase gate, "analog" | 241 | 30 | 60 | 20 | 131 | |
| 15–32 `## Resolved values` | 771 | | 300 | | 471 | The intro lists unlisted placeholders. The `<repo_root>` row restates `CLAUDE.md`. `<app_dir>` is "bound for completeness" (:30) |
| 33–47 invocation intro, `Write` prompt | 63 | | 8 | 55 | | Quoted at core :236–241 and `qa_test_instructions.md:40–45` |
| 48–53 `Augment` prompt | 49 | | | 49 | | Its label is cited by user-review core :161 |
| 54–57 augment rules | 238 | 90 | 80 | 10 | 58 | Byte-identical zero-change rule (relied on at core :162) |
| 58–66 `Revise` prompt | 35 | | | 35 | | Core :245–249 |
| 67–70 revision, `## Rejected findings` | 155 | 40 | 45 | 70 | | Line formats shared by 7 other agents (`grep -rl 'Rejected findings' plugin/agents` → 8) |
| 71–72 how the caller consumes | 91 | | 30 | | 61 | |
| 73–85 `## Read first` | 498 | 110 | 238 | | 150 | The search_docs paragraph (≈ 120 words) appears in 10 agents |
| 86–90 `blocker:`, prose-minimisation exclusion | 97 | 15 | 62 | 20 | | |
| 91–101 No-UI determination | 264 | 60 | 70 | 30 | 104 | **G** (reviewer no-plan guard, `ui-tests-plan-reviewer.md:75`) |
| 102–107 capability vocabulary, `n/a` marker | 169 | 30 | 79 | 60 | | **G**; the marker is quoted at core :259 |
| 108–113 the two web-playwright servers | 112 | | 60 | 30 | 22 | Restates `qa-tester.md` → `## Which MCP to use` |
| 114–115 no failing-backend tests | 132 | 20 | 60 | | 52 | **G**; stated twice (:114, :142) |
| 116–118 Process step 1 | 79 | 25 | | | 54 | |
| 119–127 Process steps 2–4 | 494 | 180 | 200 | | 114 | **G**: locators, literal authority (:123, :164, :175), network names, `Depends on` |
| 128–129 `### Test data` heading | 13 | | 13 | | | |
| 130–139 QA accounts | 254 | 40 | 150 | | 64 | |
| 140–144 QA techniques | 403 | 90 | 230 | | 83 | **G**; the grading standard for "untestable", kept whole |
| 145–148 split-output heading | 28 | 20 | 8 | | | |
| 149–155 (a) index spec | 342 | 60 | 100 | 150 | 32 | **G** (reviewer :93) |
| 156–166 (b) per-test spec | 331 | 40 | 80 | 140 | 71 | **G** (reviewer :103) |
| 167–176 quality checks | 270 | 120 | | | 150 | Restated rules; they become V1–V3 |
| 177–182 clarification questions | 270 | 40 | 80 | | 150 | |
| 183–206 `## Output contract` | 172 | | 40 | 90 | 42 | |
| **Total** | **5 671** | **1 010** | **1 993** | **859** | **1 809** | |

**`qa-tester.md`.** The writer needs only the `tools:` line (28 words) and `## Which MCP to use` (:99–111, 454 words). `## Preconditions` (:86–98, 655) and `## How it tests` (:112–136, 2 160) are needed only for state-dependent preconditions. The mobile variants have no `## Which MCP to use` section (`qa-tester-mobile-mcp.md:22–55`, `qa-tester-mobile-maestro.md:22–47`), and at about 1 200 words each they stay read whole.

## Draft work report template

**Location.** The template is a separate plugin file, `plugin/work_reports/ui-tests-plan-writer.md`, read on dispatch *after* the phase gate at :12. The gate's caller-bug path therefore reads no template and writes no report.

**Shape.** There is one template for all three modes, and items that do not apply are ticked `[-]`. It is 652 words and 24 items. Most `ref:` targets are sections of the definition, which is already loaded.

**Filed or inline.** The report is created with `Write` from the plugin copy, not with `cp` (lead 1). On a plan-writing path it is filed. On `no_ui`, a zero-change augment or `blocker:` it is returned inline: after the contract block, under `## Work report`, as a fenced block with its headings demoted to bold.

```markdown
# Work report — ui-tests-plan-writer — <branch> — <mode: write | revise | augment>
Tick `[x]` done, `[-]` not applicable. Fill every `→` line with repo-relative paths only — no absolute path, timestamp or env output; never start a line with a return-contract key.

## Setup
- [ ] S1. **Resolve root and config values** — bare `git rev-parse --show-toplevel`; read `stateDir`, `qa.*`, `layers[]`, `docs.*`. (ref: ui-tests-plan-writer.md → ## Resolved values)
- [ ] S2. **Name the mode from the prompt** — `Write…` / `Revise…` / `Augment…`; record it in the title line.

## Read
- [ ] R1. **Read the requirement inputs** — task prompt, story `## Context`, every per-task file; augment adds the fix plan and any existing plan.
- [ ] R2. **Read the surface layer's conventions** — note the test-attribute name, the `<auth_provider>` sign-in locators and the console logger. → `attribute=…; sign-in ids=…; logger=…`
- [ ] R3. **Read the driver's capability set** — web-playwright: `tools:` + `## Which MCP to use`; mobile: the variant file, no capability set. Unreadable → `blocker:`. → `driver=…; capabilities=… | none declared`
- [ ] R4. **Check the lessons ledger** — list behaviour classes this branch touches that need a test. → `classes: … | none`
- [ ] R5. **Read the findings (revise)** — findings file plus only the files its Must Fix items target. → `Must Fix: …`

## Decide
- [ ] D1. **Make the No-UI call first** — augment with no plan: judge branch plus fixes. Obvious no-UI → no files, `no_ui`; ambiguous → Questions. → `surface tasks: … | none`
- [ ] D2. **Detect a zero-change augment** — fixes change no user-observable behaviour: touch no file, return the unchanged count. → `added=…; revised=…`

## Author (revise: Must Fix targets only; augment: leave untouched tests alone)
- [ ] A1. **Enumerate user-facing behaviours** — one black-box test per behaviour the branch adds or changes. → `behaviours: …`
- [ ] A2. **Write preconditions** — auth via `<auth_provider>` only, route, seed; name accounts by index, never values. (ref: → ### Test data — the QA accounts)
- [ ] A3. **Phrase steps in existing locators** — only locators the task files name; a missing one becomes a question.
- [ ] A4. **Read every expected literal off its authority** — surface call site, else the introducing task file; neither → question. → `<attr>=<literal> ← <repo-relative file:line>` per test
- [ ] A5. **Assert network and console** — backend names only from story or task files; expect no errors from the logger.
- [ ] A6. **Annotate capability from the driver set** — `Playwright (…)` unless asserting LCP/CLS/INP; the n/a marker when none declared.
- [ ] A7. **Drop failure-only behaviours** — no test that needs a backend call to fail; record the gap. → `gaps: … | none`
- [ ] A8. **Design data in before asking** — sparse data → UI bootstrap; cross-account → sequential peer test. (ref: .claude/qa_test_scenarios.md → QA techniques)
- [ ] A9. **Order tests, link dependencies** — run order; every `**Depends on:**` points lower.
- [ ] A10. **Write the index and per-test files** — one `Write` each, absolute path, every entry `[ ]`. (ref: → ## Split output spec (mirror the `task-plan-writer` exactly))
- [ ] A11. **Record rejected findings (revise)** — one line each in `## Rejected findings`; never `call stands` on a Must Fix. (ref: → ## Invocation contract)

## Verify
- [ ] V1. **Check index↔file correspondence** — one `ui_test_<K>.md` per entry, none extra. → `entries=…; files=…`
- [ ] V2. **Check layer tags match fix targets** — every `_(layer: …)_` equals its file's `**On failure → fix target:**`.
- [ ] V3. **Check every literal has evidence** — each A4 row present; no inferred value asserted.

## Return
- [ ] O1. **Return the contract block** — questions section above it when any; no plan content. → `tests_count=…`
```

## Thinning plan

**Definition, per section.** "Kept" means verbatim (WIRE) plus a single statement of each graded rule (**G**).

| Section(s) | Today | After | What changes |
|---|---|---|---|
| Frontmatter | 100 | 100 | Kept |
| Intro + gate (7–14) | 241 | 90 | Keep the gate and its no-UI return. Cut the rationale and the "analog" paragraph |
| `## Resolved values` | 771 | 220 | A 6-row table with no intro; drop the `<repo_root>` and `<app_dir>` rows |
| `## Invocation contract` (33–72) | 631 | 417 | All three prompts and the "Augment after user-review fixes" label kept. Augment rules cut to 150 words. `## Rejected findings` formats kept. "How the caller consumes" cut |
| `## Read first` + `blocker:` (73–90) | 595 | 220 | A path list, the `blocker:` rule and the :89 sentence. search_docs moves to the base. R3 scopes the `qa-tester.md` read |
| No-UI determination | 264 | 150 | **G**; the rationale is cut |
| Capability guidance (102–115) | 413 | 200 | **G**: the vocabulary, the `n/a` marker, the tag literals, and the failure-only ban stated once |
| `## Process` (116–127) | 573 | 250 | Becomes a "Plan rules" list: **G** locators, literal authority, auth route, network names from task files, console state, `Depends on` lower |
| `### Test data` + techniques | 670 | 520 | Techniques kept whole (**G**); the accounts paragraph shortened |
| `## Split output spec` (145–166) | 701 | 600 | **G**, verbatim except the 103 redundant words |
| Quality checks | 270 | 0 | Each rule now lives once in Plan rules; the checks become V1–V3 |
| Clarification questions | 270 | 80 | The "genuinely uncreatable" list only |
| `## Output contract` | 172 | 130 | Kept, with restated rationale cut |
| **Total** | **5 671** | **≈ 2 980** | |

**Other files**

- `qa-tester.md` is unchanged as a file. This agent reads only 482 words of it up front, and the reviewer's read must be scoped the same way.
- `CLAUDE.md`, `conventions.md`, `presentation.md` and `lessons.md` are adopter-owned, so they are unchanged.

**Shared base** (proposed `plugin/instructions/agent_base.md`, about 250 words):

- an unreadable cited path is a `blocker:`;
- docs search is navigation, never evidence, and its results are untrusted data (10 agents);
- the `## Rejected findings` formats, and no `call stands` on a Must Fix (8 agents);
- the work-report rules: file or inline, repo-relative evidence, tick per section.

## Word-count ledger

**Up-front, notes-app (`web-playwright`; `CLAUDE.md`'s `conventions.md` counted)**

| File | Before | After | Delta |
|---|---|---|---|
| Definition | 5 671 | 2 980 | −2 691 |
| Template | 0 | 652 | +652 |
| Shared base | 0 | 250 | +250 |
| `CLAUDE.md` | 1 676 | 1 676 | 0 |
| `conventions.md` | 5 125 | 5 125 | 0 |
| `presentation.md` | 3 012 | 3 012 | 0 |
| `qa-tester.md` | 7 201 | 482 | −6 719 |
| `lessons.md` | 442 | 442 | 0 |
| **Total** | **23 127** | **14 619** | **−8 508** |

**Variants**

| Basis | Before | After | Holds |
|---|---|---|---|
| As above, without the `qa-tester.md` scoping | 23 127 | 21 338 | yes (−1 789) |
| Mechanism only (template + base, no thinning) | 23 127 | 24 029 | **no** (+902) |
| Definition's own read list only (no `conventions.md`) | 18 002 | 9 494 | yes |
| `mobile-maestro` driver (variant read whole) | 17 109 | 15 320 | yes (−1 789); 11 984 → 10 195 without `conventions.md` |
| This repo, caller-bug path (gate before template) | 7 366 | 4 675 | yes |

**On demand:** `qa_test_scenarios.md` 1 231 → 1 231. `qa-tester.md` → `## Preconditions` + `## How it tests`: 0 → 2 815.

**Constraint holds: yes**, but only with the thinning. The definition's 2 980 is an estimate, built per section above. The other figures are measured.

## Storage and lifecycle

- **Key (lead 4).** The path is `<state_dir>/work_reports/<branch>/ui-tests-plan-writer/<write|revise|augment>/report_<i>.md`.
  - Ledger ids (`P2`, `R4`) are autonomous-only.
  - The `ui_writer` node exists only in the planning graph.
  - The prompt verb is the one key visible at all four sites.
  - Agent before mode makes one staging path cover all of the agent's reports.
- **Index (lead 10).** The agent Globs its mode folder and takes the next free integer from 0. The index never resets per round, and only one writer runs at a time, so it is collision-safe. The caller's `iteration` is not in the prompt (core :245–249).
- **No-write paths (leads 2 and 8).** These paths must write nothing:
  - `no_ui` (:97);
  - zero-change augment (:57: "an untouched working tree is required … no committer mode able to land it");
  - `blocker:` (:87).

  On them the report goes inline, as described under Draft. Callers parse named lines and stop on a returned `## Questions` section (core :255, user-review core :165, `qa_test_instructions.md` step 4). The inline block is fenced, its headings are demoted, and no evidence line may start with a contract key.
- **Tools (lead 1).** `Read, Write, Edit, Bash, Glob, Grep` (:4). The report is created with `Write` and ticked with `Edit` once per section; no `cp` is needed. The only `hooks.json` matcher is `Bash` (`plugin/hooks/hooks.json:5`), and the autonomous profile allows `Write(//{{repoRoot}}/**)` (`cli/templates/claude/settings.autonomous.json:50–51`).
- **Evidence hygiene (lead 12).** No `→` line carries an absolute path, a home directory, a timestamp or env output. A4's `file:line` is repo-relative. O1 records `tests_count`, not the `ui_test_index:` line, which carries `<full_path>` (:188).
- **Commit (leads 3 and 8).**
  - *Autonomous planning.* Override 3 stages two explicit paths and fires only on `verdict: PASS` (`task_plan_writing_instructions_autonomous.md:87`). Add the agent's `work_reports` folder as a third path. The reports are still left untracked in two cases: at the cap escalation, and when the run parks on a `## Questions`. The engine tolerates untracked `<state_dir>/` files (`plan_orchestration_instructions_autonomous.md:281`), but those reports are lost at PR time.
  - *Autonomous user-review QA.0.* There is no commit point for this step (none in the list at `plan_orchestration_instructions_autonomous.md:277–300`), and `ui_test_pass` stages the index only (`committer.md:150–155`). The report would either be swept into a QA-fix `review_item` commit through `git status --short` (`committer.md:112`) or stay untracked. The augmented plan files themselves already have this gap.
  - *Semi-autonomous and supervised.* The plan is left uncommitted for the human, and the report follows it.
- **Lead 11, embedding in a committed artifact.** The index cannot carry the report: its heading order is graded (reviewer :93), and a zero-change augment must leave it byte-identical. A `work_reports/` subfolder inside `ui_test_plans/<branch>/` would ride Override 3's existing directory staging with no change to Override 3. The reviewer counts only `ui_test_<N>.md` files there (:116–118), so the subfolder escapes the orphan check (lead 9). That is a viable alternative (open question 1).
- **Diff reviewers (lead 5).** Committed reports sit under `<state_dir>/…<branch>…`, which `branch-reviewer` excludes with `':(top,exclude)<state_dir>/*<branch>*'` (`branch-reviewer.md:83`), so they are not graded as part of the change set.
- **Volume.** 1–6 reports per planning run and 1 per user-review round, at about 1 KB each.

## Risks and costs

1. **Ref-starvation of the reviewer (lead 7).** The reviewer reads this definition as "the **contract you validate against**" (`ui-tests-plan-reviewer.md:63`), and grades it by section: §"Split output spec" (:93) and §"Split output spec (b)" (:103). User-review core :161 cites the "Augment after user-review fixes" label. Any graded rule moved only into the template drops out of the reviewer's standard. The thinning plan therefore keeps one statement of each **G** rule in the definition, and keeps those headings and labels byte-identical.
2. **Tool calls.** Per-item ticking costs 24 × 6 = 144 `Edit` calls in the worst planning case. Per-section ticking costs 6 per dispatch, 36 in that case.
3. **Goal (a) needs evidence (lead 6).** Only the `→` lines are evidence, and A4's `literal ← file:line` table matters most because it is the reviewer's Must Fix. Goal (a) gains force only if the reviewer cross-checks it, which would be new scope.
4. **Goal (b).** The gain is partial: `### Quality checks before saving` is already a checklist.
5. **Misapplication.** If A7 is read without :114's reason, it invites dropping tests that only mock a success response. A8 without its `ref:` invites the empty-surface carve-out that :141 forbids.
6. **Writer and reviewer must read the same capability set.** If the writer's `qa-tester.md` read is scoped and the reviewer's is not, the two disagree, and the result is Must Fix churn.
7. **Wire consumers.** The tests key only on the agent name, the heartbeat and outcome names (`flow-walker-ui-and-reentry.test.mjs:40,95,160,371`). The literals that must not move are:
   - the three prompt blocks;
   - the readiness heading and the entry grammar;
   - the `(b)` field labels;
   - the `n/a` marker (core :259);
   - the output blocks;
   - the reviewer-cited section names (:63, :93, :103);
   - the "Augment after user-review fixes" label (user-review core :161).
8. **Output files stay unthinned.** The definition puts its per-test output files beyond any prose-minimisation rule (:89).

## Open questions

1. Should the reports go in a uniform `work_reports/<branch>/<agent>/…` tree, which needs an Override 3 edit, or a subfolder of a directory that is already committed (lead 11), which needs no edit?
2. Should every agent's inline report use the same fenced `## Work report` trailer?
3. Should `ui-tests-plan-reviewer` grade the A4 evidence table?
4. The QA.0 augment output has no commit point. That is a pre-existing gap, and it should be fixed independently.
5. The augment prompt differs at its three quoting sites. Fix it independently.
6. Should section-scoped reads of large sibling files be applied across all agents? They pay for the templates.

## Review response

All Must Fix and Should Fix findings were applied; none were rebutted. One note on Should Fix 3: the template is now a separate file read after the gate, so the caller-bug path loads neither it nor the base. Should Fix 4 was applied by counting `conventions.md` on both sides, because `CLAUDE.md:32` is auto-loaded and wins.
