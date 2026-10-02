# Code Review: chore_team_accounts_research

## Context

**Branch:** `chore_team_accounts_research`
**Date:** 2026-10-02
**Reviewed:** the whole branch diff against `dev`. That is five files, all in the catch-all `general` layer: the new research document `docs/team-accounts-research.md` (Tasks 1–4), and the one-line links to it in `README.md` and `llms.txt` plus one sentence each in `docs/remote-execution.md` and `docs/github-run-control.md` (Task 5). 8 run-artifact files excluded from the reviewed diff.

The branch changes no code, workflow, template or configuration, so it owes no test, and the Pass 0 sweep and the exported-symbol caller check found nothing to verify. `phases.parity` is `false`, so no parity cross-check ran. Every in-document anchor in the summary tables and every cross-document anchor (`team-accounts-research.md#5-options-for-the-harness`) resolves. The new `llms.txt` entry has the `blob/main` form `scripts/check-llms-txt.sh` requires. The document's own statement of who reads it is present. All its citations into the sibling documents resolve: the section headings of `github-run-control.md`, `remote-execution.md` and `github-issue-trigger.md`, the entry IDs of `github-integration-research.md`, and the quoted rule text. Most of the repository facts §5 rests on match the tree: the two credential steps of `harness-run.yml`, its permissions block and job limits, the secret-name constants in `cli/src/remote/githubActions.ts`, `remote-run.sh`'s header and `authorise_actor`, and `doctor`'s secret-name check. One exception is where `authorise_actor` is called from, and how a repository variable reaches it. That gap makes §5's Option C change list wrong (Finding 1). The Pass 2 reconciliation carried over one per-unit Should Fix that is still in the document (Finding 2).

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Make P5's "Not documented" stop listing six pages as checked for a point the evidence names no page for _(layer: general)_
2. [ ] **Finding 1** — Correct §5's account of where `authorise_actor` runs, and Option C's change list that follows from it _(layer: general)_

---

## Must Fix

### 1. §5 says Option C's allow-list needs no workflow change, but each job that calls `authorise_actor` passes repository variables in through its own `env:`
→ [finding_1.md](chore_team_accounts_research_code_review/finding_1.md)

---

## Should Fix

### 2. P5's "Not documented" lists pages as checked that the evidence does not name for that point
→ [finding_2.md](chore_team_accounts_research_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section is empty.
