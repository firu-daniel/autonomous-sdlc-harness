# Code Review: fix_task_offer_check_script

## Context

**Branch:** `fix_task_offer_check_script`
**Date:** 2026-10-30
**Reviewed:** the whole branch diff against `origin/dev`. This checkout has no local `dev` branch, so `defaultBranch` was resolved through its remote-tracking ref. The diff has 20 files:
- **`cli` layer:** the new `cli/templates/scripts/task-offer-check.sh` and its `OUTER_LOOP_SCRIPTS` row; the `taskOfferCheckInvocation` / `taskOfferCheckRule` producer pair in `cli/src/generators/outerLoopScripts.ts`; the `{{taskOfferCheckCommand}}` fence item in `cli/templates/claude/CLAUDE.md`; the `permissions.allow` merge and `allowRuleState` in `cli/src/generators/projectSettings.ts`; the two new `task-offer-rules` arms in `cli/src/doctor/checks.ts`; and five suites under `cli/test/`.
- **`plugin` layer:** the guard's comment and `plugin/hooks/README.md`.
- **`general` layer:** `docs/cli.md`, `docs/watcher.md`, `docs/guard-verification.md`, `examples/notes-app/README.md` and the self-adopted `scripts/task-offer-check.sh`.

20 run-artifact files excluded from the reviewed diff.

**What was checked.**
- **The script.** It was read against the library functions it reuses: `hr_repo_root`, `hr_main_repo`, `hr_copy_sync_main_of` and `hr_clone_target_check_var`. It was also compared with the #214 one-liner it replaces, arm by arm. Both answer the same way in every listed layout. The library sets no shell state when it loads and needs no `jq`, so a main checkout or a linked worktree still needs none. The only divergence is the stricter clone refusal the user accepted (Q2 (a)).
- **The fence, the allow rule and `doctor`.** All three read the one producer. The allow rule merges as a leaf, missing keys only. `doctor` asks `allowRuleState` instead of keeping a second copy of the grading; that was architecture-review Finding 1, now fixed.
- **Tests.** Every accompanying test the conventions documents require is present:
  - the verbatim-copy and mode case in `cli/test/outer-loop-scripts.test.mjs`;
  - the `OUTER_LOOP_SCRIPT_FILES` entry in `cli/test/init.test.mjs`;
  - the merge, warning and idempotence cases in `cli/test/task-offer-allow-rule.test.mjs`;
  - the five `doctor` cases;
  - the fence suite, run across every layout under bash and zsh, with and without `HARNESS_MAIN_REPO`, plus the template-shape case.

  No new test reads a tree, so none owes a `treeGuards` entry. This review ran no suite; whether the tests pass is for the Run gates phase to establish.
- **Exports and docs.** Every new export has a caller outside its defining file. The guard change is to comments only, and it is re-measured in `docs/guard-verification.md`. Parity is off (`phases.parity` is `false`).
- **Pass 0.** Half (a), the grep sweep, did not run: its regex table is still the unfilled stub, and that is a configuration gap. Half (b), the caller check, ran. One finding is left, below.

**Not a finding, but not done yet.** The maintainer pastes listed under the story index's **Manual setup required** have not been applied. The root `.claude/CLAUDE.md` and `.claude/settings.json` still carry the one-liner and no rule. `examples/notes-app/.claude/` is in the same state. `examples/notes-app/.claude/settings.autonomous.json` measures 163 occurrences on 124 lines, while the branch's `examples/notes-app/README.md` already records 166 on 126. That README stays inaccurate until the Task 9 paste lands, and the tool layer refuses an agent's write there, so no fix item can close it. The story index orders it before merge.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Replace the `#219` deferral in the shipped `task-offer-check.sh` header with an adopter-resolvable citation _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The shipped `task-offer-check.sh` header names this project's issue `#219`, which no adopter can resolve
→ [finding_1.md](fix_task_offer_check_script_code_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None: `phases.parity` is `false`, so there is no reference implementation to diverge from.
