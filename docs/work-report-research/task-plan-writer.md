# Work report research — task-plan-writer

## Verdict

**Recommend with changes.** The agent definition is 6 476 words, and about 1 730 of them (27 %) are redundant restatements. Most of those are the "stated inline because it is harness doctrine…" disclaimers, the quality-check list that re-states steps 4–8, and a checkout-root rule that `CLAUDE.md` already loads. Cutting them and turning 1 324 words of action prose into a 34-item, 936-word template brings the agent-owned up-front load from 10 712 to about 6 870 words, so the hard constraint holds. The changes needed: (1) key the report on the walker node `plan_writer`, not a ledger id, and let the agent compute the index; (2) tick by section with repo-relative evidence slots, not one `Edit` per item; (3) add the report path to Override 4's explicit commit set, or the report is swept into Task 1's commit by the committer; (4) keep the cross-cited anchors verbatim (`**Scope closure:**`, `**Conventions-document prohibition**`, `## Revision mode`, the `:118` test-run-rule mention); (5) move `sample_task_plan.md` from up-front to on-demand. Be honest about goal a: tick-as-you-go cannot be verified, so only the evidence lines are real evidence.

## Read tree

Counts are for this repository's self-adoption (`harness.config.json` → 3 layers, `phases.parity/docs/qa` all `false`).

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/task-plan-writer.md` | up-front | 6 476 |
| `.claude/CLAUDE.md` (auto-loaded) | up-front | 1 695 |
| `.claude/context/conventions.md` (layer `general`) | up-front (`## Read first`, :58) | 5 864 |
| `.claude/context/cli.md` (layer `cli`) | up-front | 2 647 |
| `.claude/context/plugin.md` (layer `plugin`) | up-front | 4 174 |
| `harness-runs/lessons.md` (`<state_dir>/lessons.md`, :61) | up-front | 1 199 |
| `plugin/samples/sample_task_plan.md` (:62) | up-front | 1 399 |
| `plugin/samples/sample_story_plan.md` (:63) | up-front | 1 270 |
| `plugin/samples/sample_story/task_1_plan.md` / `task_2` / `task_3` (:64) | up-front | 468 + 568 + 531 = 1 567 |
| Task prompt (initial write), or findings file + targeted plan files (revision) | up-front | variable — the same before and after, so excluded |
| **Up-front total (fixed part)** | | **26 291** |
| `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (:118, :144) | on demand | 732 |
| `<docs_root>` corpus + `mcp__harness-docs__search_docs` (:59–60) | on demand, only when `phases.docs` is on | n/a here |
| `<reference_impl>` sources (steps 2–4) | on demand, only when `phases.parity` is on | n/a here |
| `plugin/agents/task-plan-reviewer.md` (named at :153, never told to read) | not read | 6 038 |
| `sample_task_plan.md` → links to `sample_code_review.md`, `sample_user_review_fix_plan.md`, `sample_statistics.md` (:30–32) | not read (other families) | — |

In an adopter repository the conventions documents start as `cli/templates/claude/context/*.md` skeletons (300–974 words each), so the agent definition is a far larger share of the load there. In this repository the conventions documents are 48 % of it.

## Dispatch sites and phases

| Site | Flow | Phase / node | Times per branch |
|---|---|---|---|
| `plugin/instructions/task_plan_writing_instructions_core.md` → `### 1. Spawn task-plan-writer` | core, run by both forks | walker node `plan_writer` (`cli/templates/scripts/flows/task_plan_writing.graph.json:5,16`; the self-adopted copy under `scripts/` is identical) | 1 initial write + ≤ 5 revisions (`iteration >= 5` cap) + clarification re-dispatches; bounded by `MAX_TOTAL_DISPATCHES = 40` (core :62) |
| `task_plan_writing_instructions_autonomous.md` (from `/branch-start-plan-autonomous`) | autonomous | ledger `## Planning` → `P1` (`autonomous_pause_and_ledger.md` → `### 1.3 Templates`, :69) | as above |
| `task_plan_writing_instructions_semi_autonomous.md` (from `/branch-start-plan-semi-autonomous`) | semi-autonomous | no ledger; the same `plan_writer` node | as above |
| `/branch-start-plan` (supervised) | supervised | **not dispatched** — the orchestrator drafts the plan itself (`plugin/commands/branch-start-plan.md` → `## Steps` 5–8) | 0 |
| `/branch-answer` | autonomous resume | re-enters `plan_writer` via the walker's `resume:` line (same graph, :23) | +1 per park |

Typical: 2–3 dispatches per branch. Worst case: about 8.

## Prose classification

Agent definition, measured by line range with `sed -n | wc -w`. The A/R/W/X split inside each section is a hand classification that sums to the measured total.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 72 | | | 72 | | `tools:` and `description` are read by the harness |
| Intro (7–9) | 71 | | 30 | | 41 | |
| `## Resolved values` (10–26) | 727 | | 330 | | 397 | The 119-word intro (:12) lists the placeholders it does *not* list. The `<repo_root>` row restates `CLAUDE.md`'s checkout-root block. The `<app_dir>` row says "no step consumes" it. |
| `## Invocation contract` (28–55) | 249 | 20 | 100 | 70 | 59 | The two prompt blocks are quoted in core `### 1.` with `<prompt_path>` resolved (core :156 vs agent :38, mapping at :42) and asserted shape-wise in `cli/test/flow-walker.test.mjs:53–66` |
| `## Read first` (56–67) | 571 | 60 | 330 | 20 | 161 | The `blocker:` line is wire. The search_docs paragraph is copied in 11 agents. "In scope to read is not in scope to edit" repeats step 5. |
| Step 1 (68–71) | 18 | 18 | | | | |
| Parity gate (72) | 96 | 15 | 40 | | 41 | |
| Steps 2–4 (73–76) | 255 | 90 | 75 | 30 | 60 | `TODO: @claude add a follow up task for this:` marker is wire |
| Step 5 intro (77) | 110 | 15 | 50 | | 45 | |
| Authorization … Ops envelope (78–82) | 324 | 120 | 150 | | 54 | Two "doctrine; adopter may restate" disclaimers |
| Missing permission entry (83) | 154 | 30 | 74 | 50 | | The deny-listed basenames and refused constructs mirror `plugin/hooks/autonomous-script-allowlist-guard.sh` |
| Scope closure (84–92) | 443 | 80 | 180 | 150 | 33 | `## Scope register` placement, the table header, `change`/`no-change`. **Cited by** `sample_story_plan.md:31` and `sample_task_plan.md:13` |
| Conventions-document prohibition (93–94) | 277 | 40 | 140 | 15 | 82 | **Cited by** `conventions-writer.md:170`. `stale-rule` is wire. |
| Step 6 (95) | 36 | 36 | | | | |
| Step 7 intro (96–97) | 84 | 30 | 34 | | 20 | |
| (a) story-index headings (98–100) | 106 | 30 | 36 | 40 | | `# Story:`, `## Context`, `Top risks:`, `Manual setup required:` |
| Readiness bullet (101) | 407 | 60 | 160 | 90 | 97 | `## Phase 2 Readiness — Ordered Fix List`; entry grammar `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` |
| Story-point scale (102–111) | 344 | 30 | 200 | 20 | 94 | "capability scope, not a per-task score (split signal)" appears three times |
| Granularity + no `## Tasks` (112–114) | 108 | 30 | 40 | | 38 | |
| (b) per-task file (115–122) | 334 | 60 | 120 | 70 | 84 | Heading and field labels are wire. The single-layer rule repeats :101. |
| Step 8 chain walk (123–126) | 208 | 80 | 100 | | 28 | |
| Step 9 quality checks (127–146) | 593 | 300 | | | 293 | Each check re-states a rule from steps 4–8; they become the template's Verify items |
| `## Clarification questions` (147–150) | 38 | 20 | 18 | | | |
| `## Revision mode` (151–154) | 187 | 80 | 80 | | 27 | |
| Rejected findings (155–156) | 124 | 30 | 44 | 50 | | Both line formats are wire (shared by 8 agents) |
| Summary block (157–169) | 49 | | | 49 | | Parsed by core `### 1.` |
| Questions / Parity exclusions (170–173) | 114 | 30 | 54 | 30 | | |
| `## Corpus staleness` (174–180) | 276 | | 160 | 60 | 56 | The heading is matched literally (`plan_orchestration_instructions_autonomous.md:231`); `stale-rule` and `undescribed-layer` are type tokens |
| Manual setup + closing (181–183) | 100 | 20 | 45 | 15 | 20 | |
| **Total** | **6 475** | **1 324** | **2 590** | **831** | **1 730** | |

The other up-front files:

| File / section | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| `sample_task_plan.md` (1–8 / 9–19 / 20–35 / 36–44 / 45–) | 1 399 | | 450 | 200 | 749 | The naming table (281) covers four other artifact families. The invariants (429) restate the agent's readiness rules. The template list (239) repeats `## Read first`. |
| `sample_story_plan.md` | 1 270 | | 996 | 274 | | The format sample is the "taste" reference; keep it |
| `sample_story/task_1..3` | 1 567 | | 1 567 | | | Keep |
| Conventions docs, lessons, `CLAUDE.md` | 15 579 | — | — | — | — | Shared and project-owned; out of scope for this agent's split |

## Draft work report template

Pick: **one template**, with modes handled by `[-] n/a — <reason>` ticks. Revision mode marks Setup S4 and Draft as `n/a` except where a Must Fix touched them. Parity-off marks P1–P3 and V6 `n/a`. 34 items, 936 words (`wc -w`). Every title is an imperative of ≤ 8 words and every description ≤ 25 words.

```markdown
# Work report — task-plan-writer
Branch: <branch> · Node: plan_writer · Mode: <write|revise> · Report: <index> · Parity: <on|off>
Tick `[x]` when done, `[-] n/a — <reason>` when the item does not apply. `→` lines take repo-relative paths and counts only — no absolute paths, timestamps or command output.

## Setup
- [ ] S1. **Resolve the checkout root** — Run a bare `git rev-parse --show-toplevel`; build every path from its output.
- [ ] S2. **Read every conventions document** — Read each `layers[].conventions` file in full; unreadable means return only a `blocker:` line. (ref: task-plan-writer.md → ## Read first)
  → read: <repo-relative paths>
- [ ] S3. **Read the lessons ledger** — Read `<state_dir>/lessons.md`; treat every line as a planning constraint.
- [ ] S4. **Read the sample story** — Read `sample_story_plan.md` and all three `sample_story/task_<N>_plan.md`; copy their format and granularity, not content.
- [ ] S5. **Read the dispatch inputs** — Write: read the task prompt. Revise: read the findings file and only the files it targets.
- [ ] S6. **Stop on material ambiguity** — Missing or ambiguous requirement: return `## Questions` only, answerable without the plan. (ref: ## Clarification questions)

## Parity (`[-]` all when parity is off)
- [ ] P1. **Cite the reference sources** — Name each `<reference_impl>` file by path and symbol the feature ports.
- [ ] P2. **Read the reference end-to-end** — Note external call names, declared wire names, thresholds, `<` vs `<=`, side-effect order.
- [ ] P3. **Account for every behaviour** — Give each behaviour a task, a cited prompt exclusion, or a `TODO: @claude` marker. (ref: ## Process → step 4)

## Plan-risk checklist
- [ ] R1. **Name each server-side gate** — For every privileged fetch or mutation task, state where the server checks identity and role.
- [ ] R2. **Wire every new unit** — Name the consumer task that calls each new unit; give it an end-to-end Verification bullet.
- [ ] R3. **Plan lifecycle and reactivity** — Plan or rule out startup init, re-fetch on flag flips, deep-link entry.
- [ ] R4. **Enumerate every visible control** — List each surface's controls, disabled ones included; reuse shared components over hand-rolled ones.
- [ ] R5. **Plan the ops envelope** — Plan provisioning and memory envelope for server-side units; put human-only steps under Manual setup.
- [ ] R6. **Schedule a wrapper, not manual step** — Turn a permission-only blocker into a `<scripts_dir>` wrapper task unless a refused case. (ref: ## Process → **A missing permission entry is not a human step:**)
- [ ] R7. **Write the scope register** — Corpus targets: write `## Scope register` (a)–(d), running every command entry first. (ref: ## Process → **Scope closure:**)
  → derivation entries run: <n>
- [ ] R8. **Keep conventions documents untargeted** — Split any `layers[].conventions` target out of its task; raise it as `stale-rule`. (ref: ## Process → **Conventions-document prohibition:**)
- [ ] R9. **Read the code to touch** — Read the touched `layers[].path` scopes; list patterns and `<convention_symbols>` to reuse.

## Draft (write mode; revise mode ticks only what a Must Fix touched)
- [ ] D1. **Write the story index** — `# Story:`, `## Context` ending `Top risks:` (+ Manual setup), readiness heading verbatim, no `## Tasks`.
- [ ] D2. **Write readiness entries verbatim** — Use the entry grammar exactly; one layer each; bottom-up, catch-all last. (ref: ## Process → step 7 (a), readiness bullet)
- [ ] D3. **Write the readiness lead paragraph** — State single source of truth, committing role flips `[x]`, sub-step boxes informational; write every entry `[ ]`.
- [ ] D4. **Score and split** — Keep every task ≤20 points and ≤5 `Work:` bullets; split anything larger. (ref: ## Process → **Story-point benchmark scale**)
- [ ] D5. **Write per-task files** — Write one `task_<K>_plan.md` per entry: `### Task K — <title>` without checkbox, sample's fields; `Write` tool, absolute path.

## Verify
- [ ] V1. **Walk the cross-task chain** — Check one producer, a named consumer, interfaces stated on both sides, one owner per file.
- [ ] V2. **Check ship order** — Confirm no task depends on a later task; every task ships on its own.
- [ ] V3. **Check the accompanying set** — Give each new unit's task the tests and registry entries its conventions document mandates.
- [ ] V4. **Check forbidden runs and counts** — Remove bullets running the test command, a gate or a foreign test; remove baked-in counts. (ref: unit_loop_core.md → ## The test-run rule)
- [ ] V5. **Check the plan against lessons** — Grep the ledger for the plan's key decisions; re-plan any match.
  → grep terms: <terms>
- [ ] V6. **Anchor parity names** — Cite a reference file for every call name, wire field and threshold.

## Revision (`[-]` all in write mode)
- [ ] M1. **Apply Must Fix only** — Edit only the targeted files; preserve the rest; add no Should Fix unless told.
- [ ] M2. **Resync on target-set change** — Task added, removed or split: re-run the register's derivations; keep readiness and files 1:1.
- [ ] M3. **Record rejected findings** — Append disagreements to `## Rejected findings` at the index END; never `call stands` on a Must Fix. (ref: ## Revision mode)

## Return
- [ ] O1. **Add owed return sections** — Add `## Questions`, `## Parity exclusions / deferrals`, typed `## Corpus staleness`, `## Manual setup required` as owed. (ref: ## Output contract)
- [ ] O2. **Return the summary block** — Return `story_file`, `task_files_dir`, `tasks_count`, `story_points_total` exactly; never the plan content.
```

Most `ref:` targets point into the agent definition, which is already loaded, so they cost nothing; they only steer attention. The only true on-demand ref is V4. D2 cites the readiness entry grammar instead of restating it, so the wire literal has exactly one home (`task-plan-writer.md:101`).

## Thinning plan

| File | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| `task-plan-writer.md` | All 1 730 REDUNDANT words: the doctrine disclaimers (:76, :78, :81, :101), step 9 in full (its 300 action words become V1–V6), except the `:118` per-task bullet's citation of `## The test-run rule`, which stays because `unit_loop_core.md:161` lists this agent among the files that cite that rule, the `<app_dir>` prose and the `<repo_root>` row's shell-state detail, the placeholder-list intro, and the repeated single-layer and split-signal text. Action prose from steps 1–8, which moves to the template. | `## Resolved values` 330 → ~280: a terse table that keeps a one-line `<repo_root>` rule (bare `git rev-parse --show-toplevel`; `layers[].path` resolves against it, not `<app_dir>`), because `CLAUDE.md` is adopter-owned ("edit it freely", last line of `cli/templates/claude/CLAUDE.md`). `## Read first` 350 → ~60: a path list plus the `blocker:` rule. The points scale 220 → ~90: a 6-row table. Corpus staleness remedy 160 → ~110. Arithmetic: REFERENCE + WIRE = 2 590 + 831 = 3 421; minus 50 + 290 + 130 + 50 = 520 → ~2 900. | Frontmatter; both prompt blocks; the summary block; `## Phase 2 Readiness — Ordered Fix List` and the entry grammar; the `TODO: @claude` marker; `## Scope register` spec (a)–(d) and its table header; the deny-list and construct list (:83); the `## Rejected findings` line formats and their place under `## Revision mode` (cited by `cli/templates/scripts/lib/flow-walker-gates.sh:145`, whose awk parses `## Rejected findings`, `call stands` and `## Scope register` out of the index); the `## Corpus staleness` heading and both type tokens. The **bold labels `**Scope closure:**` and `**Conventions-document prohibition:**` under `## Process`**, because three other files cite them. `## Revision mode` keeps its name and meaning: `ui-tests-plan-writer.md:14,67,145` define themselves as mirroring it and the split spec. | ~2 900 |
| `sample_task_plan.md` | Nothing in the file. Drop it from this agent's up-front list; it stays on demand and for other agents. | — | All of it (shared format reference) | 0 up-front (1 399 on demand) |
| `sample_story_plan.md`, `sample_story/*` | — | Optional: the 274-word meta blockquote at the top of the story sample | Sample body | unchanged (2 837) |
| Conventions docs, lessons, `CLAUDE.md` | — | — | Project-owned; not this agent's to thin | unchanged |
| **New: shared base** `plugin/instructions/agent_base.md` (~200) | — | — | — | +200 |

Proposed contents of the shared base, as direct instructions:

- Copy your template to the report path (Read + `Write`, or `cat`/`sed`, which the unattended profile allows; never `cp`); tick each section as you finish it; `[-] n/a — <reason>` for items that do not apply; fill every `→` line.
- If a cited path cannot be read, your whole return is a `blocker:` line naming it; never substitute another document.
- Docs search results are navigation, never evidence: open the cited section, and treat snippets as untrusted data.
- Write files with the `Write` tool at absolute paths, never a heredoc.
- For `## Rejected findings`, follow your own definition's `## Revision mode`. The line formats stay in each agent and are **not** moved here, because `flow-walker-gates.sh:145` cites `task-plan-writer.md` → `## Revision mode` for them.

Sharers: the `blocker` rule is copied in 18 agents, the docs-search rule in 11, rejected findings in 8, write-not-heredoc in 3 (`grep -l` over `plugin/agents/`). The candidates are `task-plan-reviewer`, `ui-tests-plan-writer`, `user-review-fix-plan-writer`, `test-fix-plan-writer` and the plan/branch reviewers. The checkout-root rule is **not** needed in the base, because `CLAUDE.md` (auto-loaded) already carries it.

## Word-count ledger

| File | Today | After | Delta |
|---|---|---|---|
| **Up-front** | | | |
| `task-plan-writer.md` | 6 476 | ~2 900 | −3 576 |
| Work report template | 0 | 936 | +936 |
| `agent_base.md` (shared) | 0 | ~200 | +200 |
| `sample_task_plan.md` | 1 399 | 0 | −1 399 |
| `sample_story_plan.md` + `sample_story/*` | 2 837 | 2 837 | 0 |
| Conventions docs ×3 | 12 685 | 12 685 | 0 |
| `lessons.md` | 1 199 | 1 199 | 0 |
| `CLAUDE.md` | 1 695 | 1 695 | 0 |
| **Up-front total** | **26 291** | **~22 452** | **−3 839 (−15 %)** |
| Agent-owned subset (definition + samples + template + base) | 10 712 | ~6 873 | −3 839 (−36 %) |
| **On demand** | | | |
| `unit_loop_core.md` → `## The test-run rule` | 732 | 732 | 0 |
| `sample_task_plan.md` | 0 | 1 399 | +1 399 |

**Constraint holds: yes.** It still holds (−2 440) if `sample_task_plan.md` stays up-front. Nearly all the saving comes from cutting redundancy, not from the template mechanism itself, which costs +1 136.

## Storage and lifecycle

- **Key.** Use the walker node, not the ledger id: `<state_dir>/work_reports/<branch>/plan_writer/task-plan-writer/report_<index>.md`. The node `plan_writer` exists in both forks; the ledger id `P1` exists only in autonomous runs, so it fails the brief's supervised and semi-autonomous requirement. Supervised `/branch-start-plan` never dispatches this agent.
- **Index.** The agent should compute it: Glob `report_*.md` in its own folder and take the next free integer, starting at 0. Having the caller pass it would need a new `arg.report_index` from the walker. That changes `flow-walker` output, which `cli/test/flow-walker*.test.mjs` assert line by line (e.g. `flow-walker.test.mjs:56–66`), and it changes both quoted prompt blocks (agent :35–49, core `### 1.`). One writer runs at a time, so a self-computed index has no race. It is collision-safe (lead 10): the folder is per branch and per node, never reset across rounds, and revision dispatches append rather than overwrite.
- **Tools.** `tools: Read, Write, Edit, …` (:4), so it can copy and tick. No hook blocks this: every `plugin/hooks/hooks.json` matcher is `Bash`. The permission profile allows `Write(/{{repoRoot}}/**)` and the worktree glob (`cli/templates/claude/settings.autonomous.json:48–51`). Choice (lead 1): copy once with Read + `Write` (`cat`/`sed` are allowed too, `cp` is not), then tick in place with `Edit`, once per section.
- **Commit.** In autonomous runs, Override 4 (`task_plan_writing_instructions_autonomous.md` → `## Override 4 — commit the task plan after it converges`, :120; staging list and the "all six" rule at :134–143) stages **exactly six explicit paths** and never `git add -A`. Without a seventh path the report goes one of two ways. (i) It is **swept into an unrelated commit**: in `mode: task` the committer stages "`plan_path` … plus the code files shown by `git status --short`" (`plugin/agents/committer.md:111`), and an untracked report shows there as `??`. That puts the planning report into Task 1's commit, which trips the committer's subject reconciliation ("other paths staged") and hides the `staged:` / disposition signals `unit_loop_core.md` reads (lead 3). (ii) It **stays untracked**: the engine "tolerates only untracked `<state_dir>/…` artifacts" (`plan_orchestration_instructions_autonomous.md:281`) and the report dies with the worktree, which defeats goal a. Fix: add `<state_dir>/work_reports/<branch>/plan_writer/` as a seventh Override 4 path, which is safe because the wrapper skips missing paths. In semi-autonomous runs the user commits, so the report folder must be added to the "uncommitted artifacts" list (`task_plan_writing_instructions_semi_autonomous.md:40`).
- **Embedding instead (lead 11), rejected.** The two committed artifacts this agent writes do not work as hosts. A file inside `<state_dir>/task_plans/<branch>/` (staged whole by Override 4) is a "file with no readiness entry", which `task-plan-reviewer.md:118` grades as a Must Fix. A trailing section of the story index conflicts with "`## Rejected findings` at the END of the index" (`task-plan-writer.md:155`), and the index is the file the gates script parses.
- **Leads 2, 8, 9, 13.** This agent has no PASS/FAIL, and nothing scans its output folder for orphans, so leads 2, 8 and 9 do not apply. On lead 13: `CLAUDE.md`'s read-on-demand table asks a planner for `context/conventions.md` and the lessons ledger, a subset of `## Read first`. The agent's larger set wins, and it is the set counted here.
- **Volume.** 2–8 reports per branch, about 1 KB each.

## Risks and costs

- **Tool calls.** Ticking per item means 34 `Edit` calls per dispatch, about 64–256 per branch, each echoing about 30 tokens of old/new strings plus a round trip. Ticking per section means about 7 per dispatch. Recommend per-section ticking. Against that, one avoided revision round saves 4 dispatches (writer plus three reviewers, core :62), each of which reloads about 20k+ words.
- **Goal a is weak.** Nothing can tell a tick made during the work from 34 ticks written at the end. The only checkable evidence is in the `→` lines (docs read, derivation count, grep terms), and a reviewer could cross-check those. Without such a cross-check, a report only proves that the template was copied.
- **Goal b is plausible.** The items the reviewer most often catches (`Top risks:`, the register, typed `## Corpus staleness`, points ≤ 20, single-layer tags) become explicit lines. Step 9 already *is* a checklist of 15 bullets, though, so the gain is presentation, not a new mechanism.
- **Misapplication.** R8, short on its own, invites "shrink the conventions half into a `Work:` bullet", which :93 explicitly forbids. R6 without its case list invites scheduling `deploy.sh`. Both keep a `ref:`, and the rationale they point to must survive the cut.
- **Cross-file keys.** These anchors must stay byte-identical: `sample_story_plan.md:31` and `sample_task_plan.md:13` (→ `**Scope closure:**`), `conventions-writer.md:170` (→ `**Conventions-document prohibition**`), and the `## Corpus staleness` / `## Parity exclusions / deferrals` / summary-block literals parsed by the core and forks (about 30 files mention the readiness heading or `Corpus staleness`). No `cli/test/` suite greps the agent's prose; those tests key on node and agent names only. Other consumers do key on it: `cli/templates/scripts/lib/flow-walker-gates.sh:144–145` cites `## Revision mode` and parses `## Rejected findings`, `call stands` and `## Scope register` from the index; `unit_loop_core.md:161` lists this agent as a citer of `## The test-run rule` (so the `:118` mention stays); `ui-tests-plan-writer.md:14,67,145` mirror this agent's revision mode and split spec "exactly", so `## Revision mode` must keep its meaning.
- **CLAUDE.md dependency.** Trimming the `<repo_root>` row to one line keeps the rule in the agent; dropping it entirely would leave the checkout-root rule only in adopter-owned `CLAUDE.md`, which an adopter may edit away.
- **Reviewers grading reports (lead 5).** Committed in the planning commit, the report enters the branch diff that `branch-reviewer` and `skeptic-reviewer` grade. They need an explicit "work reports are not part of the change set" exemption, or they will raise findings against the reports.
- **Template drift.** The template copies the wire literals (the readiness grammar, field names). A literal change becomes one more file to edit. The revised template cites the readiness grammar (D2) instead of restating it; D1 still names the heading, which is byte-identical everywhere.

## Open questions

1. Should a work report be an input to the matching reviewer, for example `task-plan-reviewer` cross-checking the `→` evidence? That is the only way to make goal a real.
2. Is the walker node id (`plan_writer`, `ui_writer`, …) the right `<phase>` key for every agent? It works in all flows that use the walker, but not for agents dispatched outside it.
3. Self-computed versus caller-supplied index: does the synthesis accept the agent globbing its own folder, to avoid changing walker output and tests?
4. Should a shared `agent_base.md` carry the work-report protocol plus the 4–5 rules copied across 8–18 agents? It is net-negative words only if every sharer deletes its copies in the same change.
5. Should sample "meta" blockquotes (the 274-word header in `sample_story_plan.md`) be thinned as part of this effort, or left to a separate samples pass?
6. Revision dispatches mostly tick `n/a`. Would a separate ~10-item revision template be cheaper, or is one template with `n/a` the better audit trail?

## Review response

All Must Fix and Should Fix findings, and Nice to Have 1–6, were applied; none was rebutted. Re-verified: template 34 items / 936 words (`wc -w`); `sed -n 12p plugin/agents/task-plan-writer.md | wc -w` = 119; `committer.md:111`, `plan_orchestration_instructions_autonomous.md:281`, `flow-walker-gates.sh:144–145`, `ui-tests-plan-writer.md:14,67,145`, `task-plan-reviewer.md:118`, `settings.autonomous.json:50` and the graph `diff` checked by `sed`/`grep`/`diff`.
