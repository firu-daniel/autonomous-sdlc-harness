# Skeptic Review: fix_sandbox_probe_linux_recipe_gaps

## Context

**Branch:** `fix_sandbox_probe_linux_recipe_gaps`
**Date:** 2026-11-02

**What was reviewed.** The whole branch diff against `dev`. This run copy has no local `dev`, so the diff was taken against `origin/dev`. It covers four files:

- the new fixture `cli/test/fixtures/sandbox-probe/linux-busy-inter-device.jsonl` and its case in `cli/test/sandbox-probe-judge.test.mjs`
- Gate 15's container recipe in `docs/development.md`
- the PD20–PD23 rows in `docs/sandbox-verification.md` §5

10 run-artifact files excluded from the reviewed diff.

**De-duplicated against** `harness-runs/code_reviews/fix_sandbox_probe_linux_recipe_gaps_code_review.md` and its one finding, which has been applied. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

**What was verified, first-hand:**

- The judge test file passes, 53 of 53, including the inter-device case and its no-platform twin.
- `SP__LINUX_SANDBOX_STRINGS` holds the three shapes.
- PD23's RG2 (Linux), RG3 (Linux) and AP5 citations resolve.
- The `PIPESTATUS`, `useradd -s /bin/bash`, dry-run push and placeholder lines do what the recipe claims.

**Headline.** One net-new Must Fix. The evidence copy-out names a single evidence directory. Each `refusal` subcommand run reaches `sp_teardown` → `sp__td_keep_evidence`, which makes its own `sandbox-probe-evidence.<suffix>` directory. So the refusal sessions' kept evidence is still deleted by `--rm`, even though PD22 is now recorded as fixed. The code review's verified-OK claim, that the single `<suffix>` is the only evidence directory a container run produces, is wrong. That is why this finding is net-new.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Copy every evidence directory the run leaves, not only the `run` one _(layer: general)_

---

## Must Fix

### 1. The evidence copy-out names one evidence directory, but each `refusal` run makes its own, so the refusal sessions' kept evidence is still lost with `--rm`
→ [finding_1.md](fix_sandbox_probe_linux_recipe_gaps_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Intentional divergences / call-outs

None. `phases.parity` is `false`, and the branch declares no divergence.
