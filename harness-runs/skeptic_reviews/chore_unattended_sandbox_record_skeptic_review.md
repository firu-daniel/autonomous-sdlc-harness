# Skeptic review: chore_unattended_sandbox_record

## Context

**Branch:** `chore_unattended_sandbox_record`
**Date:** 2026-11-07

**What was reviewed.** The whole-branch diff against `origin/dev`. This checkout has no local `dev` ref, and `origin/dev` is the configured `defaultBranch`'s remote-tracking ref. The diff covers 16 files, with 376 insertions and 157 deletions. 14 run-artifact files excluded from the reviewed diff.

**De-duplicated against** `harness-runs/code_reviews/chore_unattended_sandbox_record_code_review.md`, which files no finding, and `harness-runs/lessons.md`. No parity review exists, because `phases.parity` is `false`. No end-of-branch architecture review exists for this branch: the only architecture reviews are the plan-level ones under `harness-runs/architecture_reviews/chore_unattended_sandbox_record/`.

**What was checked first-hand:**
- **The record's verdicts.** Its verdicts were re-read against `docs/sandbox-verification.md`'s rows. That covers §1 and §2's rows, the N5 table, and the §4 Linux, macOS and runner cells, including TD4, which takes its date and version from the third Linux run's "printed the verdict its row already records" sentence. It also covers PN1–PN3 and NN1–NN2 against §9 *Taken*. None is stronger than its row.
- **The excluded-scripts claims.** The four `runsUnsandboxed` rows were checked in `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS`, and the exclusion was confirmed to be unconditional in `expectedSandbox`. The §2 seven-step order matches `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` call by call.
- **The residuals the record adds.** Residual 14's account of `run_profile_check` matches its header. Every heading named in a wrapper header, and every `cli.md` bold anchor the record cites, resolves.
- **Roadmap rows.** Rows 22–34 exist.

**Headline.** The record is sound. The two net-new findings are both citations that the scope register's derivation entries could not reach, because they carry no residual number. One is a procedure cell in the evidence record that quotes `docs/cli.md` §6 for text that now exists only in `docs/sandbox-record.md`. The other is two template comments, one of which §7's own recorded search finds and §7 then leaves unnamed.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Repoint row CL5 (Linux)'s procedure-cell citation from `docs/cli.md` §6 to `docs/sandbox-record.md` residual 1, item 3 _(layer: general)_
2. [ ] **Finding 2** — Repoint the `effective_max_parallel_runs` and `push-branch.sh` watcher-family comments to `docs/sandbox-record.md` residuals 12 and 1 _(layer: cli)_

---

## Must Fix

### 1. `docs/sandbox-verification.md` row CL5 (Linux) still attributes a quote to `docs/cli.md` §6 that only `docs/sandbox-record.md` now carries
→ [finding_1.md](chore_unattended_sandbox_record_skeptic_review/finding_1.md)

---

## Should Fix

### 2. Two shipped-template comments still cite `docs/cli.md` §6 for residual content that moved, and one of them is a hit from §7's own recorded search that the record leaves out
→ [finding_2.md](chore_unattended_sandbox_record_skeptic_review/finding_2.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

- **Verified-OK: the guard's `deny` reason and `G12_FR4_DEPARTURE`.** Both changed literals were grepped across `cli/test`, `plugin` and `scripts`. Neither is asserted anywhere. Their only other copies are the observed cells of AP9 and FR4 in `docs/sandbox-verification.md`, which are deliberately left byte-identical.
- **Verified-OK: the record's own stale "owed" phrases.** Residual 12's **Job mode** opening says CS6 is owed, and residual 13's sandbox bullet says RG1–RG3 are owed. Each is followed in the same residual by a *Since then* sentence giving the measured verdict, as the record's §6 opening says it will be.
