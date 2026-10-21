# Code Review: fix_run_copy_commit_identity

## Context

**Branch:** `fix_run_copy_commit_identity`
**Date:** 2026-10-21
**Reviewed:** the whole branch diff against the default branch `dev`. This run copy holds no local `dev`, so the diff base is `origin/dev`. The diff covers:
- Task 1 (`cli`): `cli/templates/scripts/lib/harness-run-lib.sh`, where `hr_clone_identity_keys` is new, `hr_clone_config_spec` now lists `user.name` / `user.email` at the main checkout's exact values, `hr_clone_create_var` writes them, and the headers record the identity and signing decisions. Its test is `cli/test/clone-trust-check.test.mjs`, with new cases (q)–(u) and extended cases (k), (l) and (p).
- Task 2 (`general`): the decision text in `docs/cli.md` §6 and the measurement block plus rows CS10 / CS11 in `docs/sandbox-verification.md`.

5 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**
- **The identity mirror is correct.** The identity keys are optional: the required-key loop is untouched, and case (s) covers a clone made before this change. A wrong value is refused (case (l)), and so is a key the main checkout does not set (cases (r) and (t)). Both arms of the identity are proven by a commit written with the clone as git's repository under a separate global identity (case (q)). That matches how this repository's own run commits reach the clone's configuration: the run copy's own `commit-on-branch.sh` treats the clone as its main checkout.
- **Goal 3 holds.** No reader of the key list exists outside the library, and the per-run profile protects `<clone>/.git/config` as a whole file.
- **Tests:** the accompanying test file is present and covers the task prompt's two required arms. This review ran no suite; that is the Run gates phase's job.
- **Parity:** `phases.parity` is `false`, so there is no parity cross-check.
- **Pass 0:** the grep-sweep list in this agent's definition is an unfilled stub, so half (a) ran no regex. That is a configuration gap, not a clean result. Half (b) found one new function, `hr_clone_identity_keys`. It is a library-internal helper, and its two callers are `hr_clone_config_spec` and `hr_clone_create_var`, so it is wired.
- **Pass 2:** the per-unit findings root holds no review files, so Pass 2 had nothing to reconcile.

**The main defect** is in the recorded signing rationale. It states that the main-checkout wrappers' `commit-tree` already signs, and it does not. Finding 1 covers the branch's own new sentences. Finding 2 covers the older statements the scope register kept on the same premise.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. A `[ ]` marker anywhere else, such as a sub-step bullet inside a per-finding file, is informational only. It is never the iteration source, and the committer does not touch it.

Each entry resolves to `harness-runs/code_reviews/fix_run_copy_commit_identity_code_review/finding_<K>.md` through its `**Finding K**` reference.

1. [x] **Finding 3** — Extend case (u) to plant each signing key at the main checkout's own value in the clone and assert the refusal _(layer: cli)_
2. [ ] **Finding 1** — Correct the branch's signing rationale: `commit-tree` never reads `commit.gpgSign`, so no wrapper commit is signed _(layer: cli, general)_
3. [ ] **Finding 2** — Correct residual 7 and the `commit-on-branch.sh` / `refresh-branch.sh` headers, which still claim the wrappers' commits carry the main checkout's signing _(layer: cli, general)_

---

## Must Fix

### 1. The signing decision rests on a false fact: `commit-tree` never reads `commit.gpgSign`, so the main-checkout wrappers' commits are not signed
→ [finding_1.md](fix_run_copy_commit_identity_code_review/finding_1.md)

---

## Should Fix

### 2. Residual 7 and both wrapper headers still say `commit-tree` commits carry the main checkout's signing, which the branch kept on a false premise
→ [finding_2.md](fix_run_copy_commit_identity_code_review/finding_2.md)

---

## Nice to Have

### 3. Case (u) never plants a signing key at the main checkout's own value, so "refused even at the main checkout's value" is shown only indirectly
→ [finding_3.md](fix_run_copy_commit_identity_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

This section is empty: `phases.parity` is `false`, so there is no reference implementation to diverge from.
