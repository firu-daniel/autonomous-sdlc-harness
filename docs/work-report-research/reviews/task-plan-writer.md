# Review — task-plan-writer
verdict: FAIL

Checks run: `wc -w` on all 11 read-tree files and the template (all match exactly; the up-front total of 26 291, the after-total of 21 846, the agent-owned 10 712 → 6 267 and the −3 046 fallback all add up). I re-measured all 29 agent-definition section ranges with `sed -n | wc -w`, and every row's A/R/W/X split sums to its total (column totals 1 324 / 2 590 / 831 / 1 730 = 6 475). I spot-checked 22 citations, listed under Nice to Have. The template has 32 items and 830 words; every title is ≤ 8 words and every description ≤ 25. Length is about 2 850 words with the template section excluded. All fixed headings are present.

## Must Fix

1. **The commit-lifecycle claim is unsupported: "the report would never be committed and dies with the worktree".**
   - Evidence, sweep-in: in `mode: task`, the committer's explicit stage set is "`plan_path` … plus the code files shown by `git status --short`" (`plugin/agents/committer.md:111`). An untracked `harness-runs/work_reports/<branch>/plan_writer/…` shows there as `??`, so Phase A's first `task` commit can sweep the planning report into Task 1's commit.
   - Evidence, tolerated: the engine also "tolerates only untracked `<state_dir>/…` artifacts" (`plugin/instructions/plan_orchestration_instructions_autonomous.md:281`). Both outcomes are possible.
   - Consequence the report misses: batch-1 lead 3. A report swept into a `task` commit trips the committer's subject reconciliation ("other paths staged") and hides the `staged:` and disposition signals that `unit_loop_core.md` reads.
   - Change: rewrite the Storage → **Commit** bullet to say that without the seventh Override 4 path, the report is either swept into an unrelated `task` commit (cite `committer.md:111`) or left untracked. Name the reconciliation side effect. The fix (a seventh explicit path) is unchanged.

## Should Fix

1. **The "~2 400" after-estimate for the agent definition is neither drafted nor derivable from the report's own table.**
   - Evidence: REFERENCE + WIRE = 2 590 + 831 = 3 421. The listed shortenings save about 550: `## Resolved values` 330 → 250, `## Read first` 350 → 60, points scale 220 → 90, corpus-staleness remedy about −50. That leaves about 2 870, about 20 % above 2 400.
   - The constraint still holds: the up-front total would be about 22 320, against 26 291.
   - Change: show the subtraction per section, or give ~2 870 and update the ledger rows (after ≈ 22 316, delta ≈ −3 975; agent-owned ≈ 6 737).
2. **The template drops mandatory steps of the definition.** Add D/V items for:
   - (a) The readiness lead paragraph: single source of truth, only the committing role flips `[x]`, sub-step `[ ]` are informational, and every entry is written at `[ ]` (`plugin/agents/task-plan-writer.md:101`).
   - (b) "Every task ships independently (no implicit dependency on a later task)" (`:131`). V1 does not cover a dependency on a *later* task.
   - (c) `### Task N — <title>` carries no checkbox, and the `Task N` prefix is used (`:117`, `:119`).
   - (d) `## Rejected findings` goes at the END of the index (`:155`). M3 omits the placement, and `## Scope register` placement depends on it (`:84`).
3. **D2 paraphrases a wire literal.**
   - D2 writes `N. [ ] **Task K** — <title> _(layer: x)_ _(points: n)_`; the source is `… — <short title> _(layer: <one of <layer_names>>)_ _(points: <N>)_` (`:101`).
   - The report itself flags this drift risk (Risks → Template drift) but ships it anyway.
   - Change: D2 should say "entry grammar verbatim (ref: task-plan-writer.md → readiness bullet)", as D1 already does for the heading.
4. **Missed consumers of the text being moved.** "No test greps the agent's prose; the tests key on node and agent names only" is true for `cli/test/`, but not for scripts and sibling files. Add these to Risks → Cross-file keys:
   - `cli/templates/scripts/lib/flow-walker-gates.sh:144-145` cites `task-plan-writer.md` → `## Revision mode` for `call stands`, and its awk parses `## Rejected findings`, `call stands` and `## Scope register` out of the plan index.
   - `plugin/instructions/unit_loop_core.md:161` lists `task-plan-writer.md` under "Who may cite this" for `## The test-run rule`. Removing step 9 (`:144`) and moving the `:118` mention into the template orphans that entry unless `:118` stays.
   - `plugin/agents/ui-tests-plan-writer.md:14,67,145` define themselves as mirroring "the `task-plan-writer`'s revision mode" and its split spec "exactly". Thinning `## Revision mode` changes their meaning.
   - The shared-base bullet "`## Rejected findings` line format" contradicts the Thinning table's "keep verbatim" for the same text. State which wins. If the format moves to `agent_base.md`, `flow-walker-gates.sh:144` has to be re-pointed.
5. **Evidence lines can leak absolute paths** (cross-cutting lead 12). S1 tells the agent to build absolute paths from `git rev-parse --show-toplevel`, and S2's `→ read: <paths>` then records them, so a committed report would carry home-directory paths.
   - Change: make every `→` slot repo-relative and allow no timestamps.
6. **Cutting the `<repo_root>` row makes a correctness rule depend on an adopter-owned file.** The checkout-root rule survives only in `CLAUDE.md`, which the template marks "yours from there on: edit it freely" (`cli/templates/claude/CLAUDE.md`, last line; the same text sits in `.claude/CLAUDE.md`). An adopter who trims it silently loses the rule. Agent `:19` is also the only place that states that `layers[].path` resolves against `<repo_root>`, not `<app_dir>`.
   - Change: keep a one-line `<repo_root>` rule (about 30 words), or record this dependency as a risk.
7. **Many titles and descriptions are not imperative.**
   - Noun-phrase titles: R1–R5 ("Authorization gate", "Wiring", "Lifecycle and reactivity", "UI structure", "Ops envelope"), R7, R8, V2, V5.
   - Declarative descriptions: R1, R2, V1, V2, V5 (e.g. R1 "Every privileged fetch or mutation task names…").
   - Change: rephrase them as commands, e.g. R1 "**Name each server-side gate** — For every privileged fetch or mutation task, state where the server checks role."

## Nice to Have

1. Storage → Tools quotes `Write(//{{repoRoot}}/**)`, but the source is `Write(/{{repoRoot}}/**)` (`cli/templates/claude/settings.autonomous.json:50`).
2. The Prose classification says the prompt blocks are "byte-quoted in core `### 1.`". They are not: the agent shows the resolved `Task prompt: <state_dir>/task_prompts/<branch>_task_prompt.md` (`:38`), while the core has `Task prompt: <prompt_path>` (`task_plan_writing_instructions_core.md:156`). The agent's `:42` explains the mapping. Say "quoted, with `<prompt_path>` resolved".
3. The graph citation uses the self-adopted copy `scripts/flows/task_plan_writing.graph.json:5,16,23`. Cite the shipped source `cli/templates/scripts/flows/task_plan_writing.graph.json` instead (it is identical, per `diff`).
4. The Override 4 citation `:134–150` should give the heading at `:120`, with the staging list and the "all six" rule at `:134–143`.
5. Lead 5 (reviewers reviewing reports) is not discussed. If the report is committed in the planning commit, it appears in the branch diff that `branch-reviewer` and `skeptic-reviewer` grade. Add one line.
6. "123-word intro" should be 119 (`sed -n 12p plugin/agents/task-plan-writer.md | wc -w`). This is under 5 %.

Citations verified correct:
- `task-plan-writer.md:58, 61–64, 66, 76, 78, 81, 83, 93, 101, 118, 144, 153`
- `task_plan_writing_instructions_core.md:62` and `### 1.` (`:149`)
- `autonomous_pause_and_ledger.md:69` (`P1`) and `## 3` (clean-of-*tracked*-changes)
- `task_plan_writing_instructions_semi_autonomous.md:40`
- `plan_orchestration_instructions_autonomous.md:231`
- `conventions-writer.md:170` (`**Conventions-document prohibition**`)
- `sample_story_plan.md:31` and `sample_task_plan.md:13` (`**Scope closure:**`)
- `cli/test/flow-walker.test.mjs:53–66`
- `plugin/commands/branch-start-plan.md` steps 5–8 (no dispatch)
- `plugin/hooks/hooks.json`: the only matcher is `Bash`
- Sharer counts: 18 agents (blocker rule), 11 (docs-search rule), 8 (`Rejected findings`), 3 (heredoc)
- The 274-word sample meta blockquote (`sample_story_plan.md:1–8`)

## Bug claims

The report names no pre-existing bug. Its one dead-text observation, that `<app_dir>` is bound but never consumed, is **CONFIRMED**. The agent itself says so: "Bound for completeness — no step in this file consumes `<app_dir>`" (`plugin/agents/task-plan-writer.md:19`). That is redundancy, not a defect.
