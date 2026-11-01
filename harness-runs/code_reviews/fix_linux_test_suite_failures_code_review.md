# Code Review: fix_linux_test_suite_failures

## Context

**Branch:** `fix_linux_test_suite_failures`
**Date:** 2026-11-01
**Reviewed:** the whole branch diff against `dev` (taken as `origin/dev`; this run copy has no local `dev` branch): the fixture helper's new single-string bound and identity-refusing per-user git configuration (`cli/test/helpers/fixture.mjs`, `cli/test/helpers/isolated-gitconfig`, `cli/test/fixture-isolation.test.mjs`, the `init.test.mjs` comment), the two group-1 tests moved to file-borne values (`remote-control-mention.test.mjs`, `watcher-stall-reset-payloads.test.mjs`), the sweep's `run_bounded` grouping decision moved from `/dev/tty` to `[ -t 1 ]` with its pseudo-terminal case (`cli/templates/scripts/cleanup-merged-worktrees.sh`, `outer-loop-scripts.test.mjs`), the byte-identical root copy `scripts/cleanup-merged-worktrees.sh` (confirmed with `cmp`), and the two documents of record (`docs/cli.md` §10, `docs/development.md` → *The suite on Linux, by hand.*). 10 run-artifact files excluded from the reviewed diff.

The three verdicts hold against the code. Group 1: `remote-run.sh` → `control_mention_context_extra` writes the diff with the builtin `printf '%s\n' "$GH_OUT"`, and `GH_OUT` is never exported, so no shipped spawn carries the diff. Group 2: the origin now carries its own identity and `user.useConfigOnly` refuses a guessed one on every host. Group 3: the watcher reads the sweep through `"$CLEANUP_SCRIPT" 2>&1 | while …`, so its stdout is a pipe and it now always takes the grouped kill, and no other shipped script keeps the `/dev/tty` probe. Every edited test file carries its rule and its verdict in its own comments. No new tree-reading test was added, so no `treeGuards` entry is owed, and the one new export (`MAX_ARG_STRING_BYTES`) has a caller outside its file. This review runs no suite. Group 3's post-fix terminal run is the user's pre-merge container run, as answer 2 agreed. `phases.parity` is `false`, so nothing was cross-checked against a reference. The per-unit findings root holds no review folders, so Pass 2 had nothing to reconcile. Four findings remain, none of them Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Unset the host's identity variables in the origin-identity probe of `fixture-isolation.test.mjs` _(layer: cli)_
2. [x] **Finding 2** — Name the two system-scope redirects in `docs/cli.md` §10 instead of the now-wrong ordinals _(layer: general)_
3. [x] **Finding 3** — Drop the clause in `docs/development.md` that repeats the quoted 53.0 s message _(layer: general)_
4. [ ] **Finding 4** — Name util-linux's refusal beside BSD's in the group-3 skip sentence of `docs/development.md` _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The origin-identity probe fails on a host that exports `GIT_AUTHOR_*` / `GIT_COMMITTER_*`
→ [finding_1.md](fix_linux_test_suite_failures_code_review/finding_1.md)

### 2. `docs/cli.md` §10's "The third redirect is not redundant with the second" now names the wrong redirects
→ [finding_2.md](fix_linux_test_suite_failures_code_review/finding_2.md)

### 3. The group-3 record in `docs/development.md` repeats the quoted 53.0 s message in a trailing clause
→ [finding_3.md](fix_linux_test_suite_failures_code_review/finding_3.md)

---

## Nice to Have

### 4. The group-3 skip sentence in `docs/development.md` names only BSD `script`'s refusals
→ [finding_4.md](fix_linux_test_suite_failures_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None. `phases.parity` is `false`, so there is no reference implementation to diverge from.
