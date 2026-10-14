# Test Fix Plan: fix_watcher_worktree_git_calls — task round 1

## Context

**Branch:** `fix_watcher_worktree_git_calls`
**Test log:** `harness-runs/test_run_logs/fix_watcher_worktree_git_calls/task_round_1.log`
**Summary:** The typecheck gate passed. The test gate failed for two reasons. First, gate 4 (`npm test`) has 3 failing tests in `cli/test/watcher-remote-dispatch.test.mjs`, all caused by the new plumbing fast-forward refusing a working copy that is ahead of `origin/<branch>`. Second, gate 6d flagged a bare command spelling in a new test file's header.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and only the committing role flips an entry to `[x]`. A `[ ]` marker anywhere else, such as a sub-step bullet inside a per-finding file, is informational only. Each entry resolves to a self-contained `finding_<K>.md` through its `**Finding K**` reference. The entries are sorted lowest blast-radius first. Finding 2 is the likely root cause of Finding 3, so it comes before it.

1. [x] **Finding 1** — Qualify the bare `/branch-user-review` spelling in the header of `cli/test/remote-review-payloads.test.mjs`. _(layer: cli)_
2. [x] **Finding 2** — `hr_run_fast_forward_var` refuses a copy already ahead of `origin/<branch>`, so an identical re-drop after a refused push never pushes. _(layer: cli)_
3. [ ] **Finding 3** — A refused re-push of a re-dropped review is failed by the fast-forward instead of by `push-branch.sh`. _(layer: cli)_

---

## Must Fix

### 1. Bare `/branch-user-review` spelling in `remote-review-payloads.test.mjs`
→ [finding_1.md](fix_watcher_worktree_git_calls_task_round_1/finding_1.md)

### 2. Plumbing fast-forward refuses a copy that is ahead of origin (identical re-drop test)
→ [finding_2.md](fix_watcher_worktree_git_calls_task_round_1/finding_2.md)

### 3. Plumbing fast-forward refuses a copy that is ahead of origin (refused re-push subtest)
→ [finding_3.md](fix_watcher_worktree_git_calls_task_round_1/finding_3.md)

---

## Not fixable on this branch

- **Gate 13a, 13b, 13c — Python docs-retrieval service (reported BLOCKED, not counted as failed).**
  > `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/2555894940; run bash scripts/python-service.sh sync`

  The cause is on the host, not in the tree: `uv`, or the synced Python environment, is not provisioned on this machine. The operator's remedy is `bash scripts/python-service.sh sync`. `run-gates` itself counts these as BLOCKED, not failed (`run-gates: 2 failed, 23 passed`).

---

## Source failures

All failures are classed *new this round*, because no earlier-round log exists.

**Gate `typecheck` (commands.typecheck):** exited 0, no failures.

**Gate `test` (commands.test):**

- Gate 4 `npm test` (exit 1). Its 3 failing tests:
  - `not ok 865 - an identical re-drop after a refused push skips the commit, lands the push and dispatches once` → Finding 2 (new this round)
  - `not ok 2 - a review whose push is refused, then re-dropped identically, never dispatches` (subtest of 866) → Finding 3 (new this round)
  - `not ok 866 - a remote review drop fast-forwards, commits, pushes and dispatches; a refused re-push blocks` (parent of the failing subtest) → Finding 3 (new this round)
- Gate 6d `plugin command spellings carry the prefix` (exit 1): `check-command-spelling: cli/test/remote-review-payloads.test.mjs:2 — bare command spelling` → Finding 1 (new this round)
- Gates 13a, 13b, 13c (BLOCKED, environment not provisioned) → `## Not fixable on this branch` (new this round)
