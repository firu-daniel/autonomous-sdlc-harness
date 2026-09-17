---
description: Run the current branch's task plan end-to-end — implement, branch reviews, QA — then stop and hand the branch to the user for their hands-on review.
---

# Scope: Implement the current branch's task plan end-to-end (semi-autonomous variant)

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<N>`, which this file's own text resolves): one is derived at runtime and three resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The app root is `<repo_root>/<app_dir>`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<parity_vocabulary>` | config value | `parity.referenceName` — the name of the reference implementation this project is kept in parity with. Read **only** when `phases.parity` is `true`. |

---

## Context

This is the **semi-autonomous** variant of `/autonomous-sdlc-harness:branch-implement-plan`. Unlike the supervised flow (which implements one plan task per session and pauses for user review), this variant runs the entire flow without supervision:

- **Phase A:** Implement every task in the plan. For each task, dispatch the `layer-implementer` agent once per layer the task touches, bottom-up by layer, passing that layer as its dispatch argument (which layer that is comes from the routing table in `unit_loop_core.md`, not restated here); after each implementer, dispatch `layer-reviewer` for that same layer; loop up to 5 times until the reviewer returns `PASS`; then dispatch the `committer` agent to commit. One commit per task.
- **Phase A1.5:** Once every task is committed, dispatch the `business-parity-reviewer` agent for a `<parity_vocabulary>` business-logic parity review of the implemented branch; if it finds deviations, loop the fixes through the normal implementer/reviewer/committer agents (reusing Phase C's per-item loop against a `<state_dir>/business_parity_branch_reviews/` index) until it passes; then proceed to the architecture review (Phase A2). **Skip this phase unless `phases.parity` is `true` in `harness.config.json`.**
- **Phase A2:** After the parity review passes — or straight away when that phase is skipped — dispatch the `architecture-reviewer` agent for an architecture review of the implemented branch; if it finds violations, loop the fixes through the normal implementer/reviewer/committer agents (reusing Phase C's per-item loop against a `<state_dir>/architecture_branch_reviews/` index) until it passes; then proceed to Phase B.
- **Phase B:** Once every task is committed, dispatch the `branch-reviewer` agent for an end-of-branch review; dispatch `review-plan-reviewer` to meta-review the review file; loop up to 5 times until `PASS`; commit the review file.
- **Phase C:** Implement every item in the review file using the same per-item loop as Phase A.
- **Phase C2:** After the review-plan fixes land, dispatch the `skeptic-reviewer` agent for an adversarial review of the implemented branch — the last automated review before QA; meta-review its index with `review-plan-reviewer`, commit it, and loop any net-new findings through the same per-item loop until it passes; then proceed to Phase E.
- **Phase E:** QA. Start the dev server in the background — the command configured at `commands.devServer`, with the assigned port — dispatch the `qa-tester` agent against the UI-test plan (`<state_dir>/ui_test_plans/<branch>_ui_test_plan.md`); if QA finds defects, loop the fixes through the normal implementer/reviewer/committer agents (reusing Phase C's loop against a `<state_dir>/qa_reviews/` index) and re-test until QA passes (capped). The orchestrator owns the dev-server lifecycle and tears it down at the end. Skipped if no UI-test plan exists for the branch. **Skip this phase unless `phases.qa` is `true` in `harness.config.json`.**
- **Phase D:** Notify the user and stop. They do the final hands-on review and open the PR.

You are the **orchestrator** for this entire session. You do not edit code, you do not commit, and you do not review specialist output beyond reading the 1-3 line contract each agent returns. The whole flow is built on context discipline — never read findings files, never re-verify implementer output, never bundle commits.

## Steps

1. **Working directory.** This command operates on the checkout this session runs in: commands run from `<repo_root>`, and the app itself lives at `<repo_root>/<app_dir>`. Do not change cwd. Git commands work from any cwd inside the checkout. To run a project command — type-check, tests, the dev server — invoke its wrapper through the configured `commands.*` string in `harness.config.json` **exactly as written**; never rebuild that string from its parts and never write an absolute path in its place; if a configured string is **refused**, the key holds a raw command line rather than the wrapper invocation, so run `bash <scripts_dir>/<name>.sh`, whose body is the line `init` inlined into it and not necessarily the configured string, and report which string you ran.

2. **Determine branch** with `git branch --show-current`.

3. **Confirm prerequisites:**
   - Story index exists at `<state_dir>/story_plans/<branch>_story_plan.md` (the thin index: `## Context` + `## Phase 2 Readiness — Ordered Fix List`; per-task detail lives in `<state_dir>/task_plans/<branch>/task_<N>_plan.md`). If missing, stop and tell the user to run `/autonomous-sdlc-harness:branch-start-plan-semi-autonomous` first.
   - Task prompt exists at `<state_dir>/task_prompts/<branch>_task_prompt.md`. Having confirmed it exists, run `grep -nE '^#+ *Run mode' <state_dir>/task_prompts/<branch>_task_prompt.md`. **No hit → this run has no run mode**: carry `none` into the loop below, emit `📌 Run mode: none` at the disclosure site, and do not open `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md`. **A hit →** read `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` and follow it; it owns everything else, and none of it is restated here. This entry point runs the **implementation half alone**, so nothing upstream of it has established the run mode in this session — which is why the check belongs here as much as at a planning command's confirm-and-establish step.
   - Working tree is clean (`git status --short` empty). If dirty, stop and tell the user — uncommitted changes would get caught in the first task's commit.

4. **Read `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_semi_autonomous.md`** and follow it. That file is this flow's **fork**: it carries the mode-specific binding values and runs the shared core by reference. **The canonical loop for every phase — `A → A1.5 → A2 → B → C → C2 → E → D` — is `plan_orchestration_instructions_core.md`**, whose implement → [review] → commit unit loop is in turn canonical in `unit_loop_core.md`. Enter through the fork; do not duplicate or reinterpret any of the three here.
