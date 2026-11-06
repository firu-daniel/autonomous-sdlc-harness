# Code Review: fix_clone_arm_config_refusal_message

## Context

**Branch:** `fix_clone_arm_config_refusal_message`
**Date:** 2026-11-06
**Reviewed:** the whole branch diff against `dev` (taken as `origin/dev`, merge base `ffdb2e7b`, because this run copy has no local `dev` ref). That covers 8 files, +372/−48:
- Task 1: `hr_clone_target_check_var` in `cli/templates/scripts/lib/harness-run-lib.sh` now tells a failed `hr_state_path` apart from a missing registry record. The function's header condition 1 is amended in place, and `cli/test/clone-trust-check.test.mjs` case (e2) covers it.
- Task 2: `hr_config_load "$main_top"` is hoisted ahead of `hr_wrapper_target_check_var` in `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`, with the new suite `cli/test/wrapper-clone-config-refusal.test.mjs`.
- Task 3: `docs/outer-loop-verification.md` §1.1 and the target-check paragraph of `docs/cli.md` are updated.

9 run-artifact files were excluded from the reviewed diff.

**Headline conclusions:**
- **Trust is not widened.** The hoisted read touches only `<main_top>/harness.config.json`. `<main_top>` comes from `hr_wrapper_main_of` on the script's own location, and the read makes no git call. Every arm the hoist reorders still refuses, with the same exit code as before: commit 1, push 0, refresh 1.
- **The new clone-arm sentence fires only when the configuration cannot be resolved.** `hr_state_path` fails only when `hr_config_load` fails, because `hr_config_dir` always falls back to its `sdlc-harness` default. So the new sentence fires exactly on an unresolvable configuration, and the "records no clone" sentence is kept for a readable registry with no record and for a `HEAD` that names no branch.
- **The cache claims hold.** `hr_worktree_config_check_var` reads the worktree's `githooksDir` inside a `$(…)` subshell, so it never resets the warmed per-process cache. The comments saying the pin and the protected-branch decision reuse the cache are therefore true on the worktree arm too.
- **The docs paragraph is accurate.** The `docs/cli.md` clause for callers that do not load the configuration first (`launch-sandboxed-gates.sh`, `setup-worktree.sh --target`) was checked against those scripts and is accurate. `cleanup-merged-worktrees.sh` loads it first.
- **Tests:** every new case asserts the refs on disk (both sides of the clone, and origin's refs for the push) as well as the message. Each test file opens with the rule it enforces. No mocking is used and every fixture lives under `os.tmpdir()`.
- **No tree-reading test was added.** The new suite copies three fixed templates and `lib/`, so it owes no `treeGuards` entry.
- **Not run here:** this review ran no suite. Whether the suites pass is for the Run gates phase to establish.
- **Pass 0 sweep:** half (a)'s regex list is still an unfilled stub, which is a configuration gap. Half (b) found no new exported symbol or shell function in the diff.
- **Parity:** `phases.parity` is `false`, so no parity review applies.

One finding remains: a stale count in the document-of-record drift note.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Restate the drift note's unit-measurement cell list in `docs/outer-loop-verification.md` as five cells, adding §1.1's two clone cells and their non-`init` fixture _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The drift note's list of cells resting on a unit measurement still says "Three cells" and omits §1.1's two new clone cells
→ [finding_1.md](fix_clone_arm_config_refusal_message_code_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. This section is empty.
