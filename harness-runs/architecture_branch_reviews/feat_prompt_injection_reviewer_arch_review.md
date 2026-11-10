# Architecture review — feat_prompt_injection_reviewer (iteration 0)

## Context

Branch `feat_prompt_injection_reviewer`, reviewed 2026-11-10 against `dev` (merge-base `a05560de` via `origin/dev`; this checkout has no local `dev` ref). Reviewed: the 63 changed files outside the run-artifact tree. That covers the `cli` segment (the `prompt-injection-screen.sh` template and its `OUTER_LOOP_SCRIPTS` row, the `hr_ledger_phases` change, the profile template's `_README`, the five new suites and the edited ones), the `plugin` segment (the `prompt-injection-reviewer` agent, the `prompt_injection_screen.md` instruction, the three autonomous engine commands, the ledger, run-mode, untrusted-input, digest and planning-fork edits, and the flow documents), and the `general` segment (self-adopted copies, `evals/prompt-injection-reviewer/`, `README.md`, `docs/cli.md`, `docs/watcher.md`). 32 run-artifact files excluded from the reviewed diff.

Headline: the layering holds. Each new file sits in the layer its kind belongs to. The script ships from `cli/templates/scripts/`, and its row drives the permission profile and write protection. It sources the shared run library (`hr_state_dir`) and does not re-derive anything. The agent and the screen step are plugin contracts. The two halves are coupled by contract only, and in the stated direction. The self-adopted copies are byte-identical to their templates. No new test reads a tree, so no tree-guard registration is owed. Three Must Fix items remain, all in the plugin's single-owner citation discipline. The new shared module's `## Who may cite this` roster is missing two documents that point at it. One engine command restates rules the module owns.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Add `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` to the screen step's citation roster _(layer: plugin)_
2. [ ] **Finding 2** — Add `docs/watcher.md` to the screen step's citation roster _(layer: plugin)_
3. [ ] **Finding 3** — Reduce the docs engine command's restatement of the screen step to a pointer _(layer: plugin)_
4. [ ] **Finding 4** — Drop the restated placement rationale from the user-review engine command _(layer: plugin)_
5. [ ] **Finding 5** — Declare, in the screen script's header, the plugin readers of the park file's wire strings _(layer: cli)_

## Must Fix

### 1. Citation roster of `prompt_injection_screen.md` omits `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`
→ [finding_1.md](feat_prompt_injection_reviewer_arch_review/finding_1.md)

### 2. Citation roster of `prompt_injection_screen.md` omits `docs/watcher.md`
→ [finding_2.md](feat_prompt_injection_reviewer_arch_review/finding_2.md)

### 3. `branch-start-docs-autonomous.md` restates rules the screen step owns
→ [finding_3.md](feat_prompt_injection_reviewer_arch_review/finding_3.md)

## Should Fix

### 4. `branch-start-user-review-fix-autonomous.md` restates the screen's placement rationale
→ [finding_4.md](feat_prompt_injection_reviewer_arch_review/finding_4.md)

### 5. `prompt-injection-screen.sh` header does not declare the plugin readers of its park wire strings
→ [finding_5.md](feat_prompt_injection_reviewer_arch_review/finding_5.md)
