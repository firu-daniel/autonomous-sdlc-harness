# Code Review: fix_gate12_round_driver_findings

## Context

**Branch:** `fix_gate12_round_driver_findings`
**Date:** 2026-11-05
**Reviewed:** the whole branch diff, judged against each layer's conventions document. Configuration names `dev` as the default branch, but this run copy has no local `dev`, so the diff base was `origin/dev`. The diff covers:

- the preflight's acceptance of an SSH host alias resolved through `ssh -G` (`scripts/lib/gate12-sandbox-round/preflight.sh`, Task 1);
- FR3's wrapper-refusal arm and FR6's artifact-gated `placed` clause (`scripts/lib/gate12-sandbox-round/grade-full-run.sh`), plus the rewritten FR3 `--list` note (`core.sh`), Task 2;
- the two suites' new cases, including round 13's replay (`cli/test/gate12-sandbox-round-cli.test.mjs`, `cli/test/gate12-sandbox-round-full-run.test.mjs`), Tasks 3 and 4;
- the FR3 and FR6 text in `docs/development.md` and `docs/sandbox-verification.md` §10, Task 5.

8 run-artifact files were excluded from the reviewed diff.

**Headline conclusions.**

- **Preflight.** The bare-host-token screen runs before `ssh` is called. Only a resolved `hostname` of `github.com` is accepted, and the `<owner>/<name>` comparison with `--repo` still runs after it. The tests pin all three refusals and the acceptance.
- **FR6.** Restore counts in-set regular files (`hr_remote_bundle_restore`), and save writes only in-set paths. So the driver's count of regular files under the bundle's `planning/` agrees with the condition under which `verb_restore` prints its `placed` line. An expired artifact grades `expired`, as the ledger requires.
- **FR3 docs.** The restated `--list` row in `docs/development.md` matches `core.sh`'s new FR3 note byte for byte.
- **Tests.** Every case the task plans named is present. Whether they pass is for the Run gates phase to establish; this review ran no suite.
- **Parity.** Not reviewed: `phases.parity` is `false`.
- **Pass 0.** The grep half was a no-op, because the sweep table carries no regexes for this stack (a configuration gap). The caller check found no new exported symbol: every new helper is file-local to a test, and the driver gained no function.
- **Pass 2.** No-op. The supplied `per_task_findings_root` does not exist in this checkout, so there were no per-unit findings to reconcile.

One finding remains. It is Nice to Have.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Pin commit-on-branch.sh's em-dash refusal spelling with an FR3 case _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

_None._

---

## Nice to Have

### 1. No case pins commit-on-branch.sh's em-dash refusal spelling in FR3
→ [finding_1.md](fix_gate12_round_driver_findings_code_review/finding_1.md)

---

## Intentional divergences to confirm

_None. `phases.parity` is `false`._
