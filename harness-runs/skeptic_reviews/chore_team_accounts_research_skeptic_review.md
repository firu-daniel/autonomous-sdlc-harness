# Skeptic Review: chore_team_accounts_research

## Context

**Branch:** `chore_team_accounts_research`
**Date:** 2026-10-02
**Reviewed:** the whole branch diff against `dev`, adversarially. It touches five files, all in the catch-all `general` layer: the new `docs/team-accounts-research.md`, and the one-line links to it in `README.md`, `llms.txt`, `docs/remote-execution.md` and `docs/github-run-control.md`. 12 run-artifact files excluded from the reviewed diff. The findings were de-duplicated against `harness-runs/code_reviews/chore_team_accounts_research_code_review.md` and its two findings. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch. The adversarial pass treated every repository fact §5 states as a claim, and checked each one against the tree. That covers `harness-run.yml`'s credential steps, permissions block, job limits, input contract and `DECLARED MIRRORS`; the "reads no repository secret" headers of `harness-trigger.yml` and `harness-control.yml`; `harness-resume.yml`'s dispatch token; `remote-run.sh`'s header and its three `authorise_actor` callers; `doctor`'s secret-name check; the constants in `cli/src/remote/githubActions.ts`; and every cited sibling-document heading. All of them hold. **Headline:** one net-new Must Fix. §5 omits a route into the run job that the repository documents itself: the **Run workflow** form, `gh workflow run`, and a re-run, none of which passes `authorise_actor`. Because of that gap, Option C's change list ("`harness-run.yml`'s run job: no change") describes an allow-list that any writer could get around.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — State the direct-dispatch and re-run routes in §5, and add Option C's run-job gate _(layer: general)_

---

## Must Fix

### 1. §5 leaves out the documented direct dispatch of `harness-run.yml`, so Option C's allow-list would leave every writer able to start a run on the maintainer's credential
→ [finding_1.md](chore_team_accounts_research_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference behaviour to diverge from. No divergence on this branch was marked intentional, so this section is empty.
