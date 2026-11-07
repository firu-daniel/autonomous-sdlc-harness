# Skeptic Review: chore_sandbox_honesty_paragraphs

## Context

**Branch:** `chore_sandbox_honesty_paragraphs`
**Date:** 2026-11-07
**Reviewed:** the whole branch diff against `dev`, taken as `origin/dev` because this run copy has no local `dev` ref. That covers the `cli` templates, the generator string and the new `cli/test/profile.test.mjs` case, the `plugin` prose (`plugin/hooks/README.md`, `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`), the self-adopted copies, and the `general` documents (`docs/cli.md`, `docs/watcher.md`, `docs/remote-execution.md`, `docs/outer-loop-verification.md`, `docs/development.md`, `docs/sandbox-record.md`, `README.md`, `ROADMAP.md`, `llms.txt`). 21 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** the committed code review `harness-runs/code_reviews/chore_sandbox_honesty_paragraphs_code_review.md` and its three findings (whiteboard hooks/MCP overclaim, the `_README` HP1 line, the whiteboard's "every command"), all three already applied on the branch. Also the architecture review `harness-runs/architecture_reviews/chore_sandbox_honesty_paragraphs/review_0.md` (the `plugin/` file name in a `cli/src` string, already applied), and `harness-runs/lessons.md`. No parity review exists, because `phases.parity` is `false`.

**What was checked first-hand:**
- Each status the branch writes against its evidence row in `docs/sandbox-verification.md` and `docs/sandbox-record.md`: SR1, SR2, HP1, N1, N2, CS2, CL4, CS6, RG1–RG3, AP9, FR1, FR2, FR5, JS1, JS3, JS3N and JS4.
- `cmp` of the three self-adopted copies against their templates: identical.
- The scope register's entry E re-run: every remaining hit is a register row.
- A grep for any quoter of the replaced `_README` lines and the replaced lead.
- The new test's helpers: `profileFor`, `seededConfig` and `SCRIPTS_DIR` exist in the file.

**Headline:** no behaviour changed, and no claim is stronger than the record on a point a reader acts on. Two smaller net-new defects remain. A lead the branch left in place still says *"not yet run"*, and the paragraph under it now records the results. And one citation credits a measured leg with a claim the same branch elsewhere calls derived.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Stop `plugin/hooks/README.md` crediting the `scratch` leg with the network-allowlist claim _(layer: plugin)_
2. [ ] **Finding 1** — Correct the `docs/remote-execution.md` lead that still calls the real-job check "not yet run" _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `docs/remote-execution.md`'s lead still says the real-job check is "not yet run", while the paragraph under it now records FR5, JS1 and JS4 passing
→ [finding_1.md](chore_sandbox_honesty_paragraphs_skeptic_review/finding_1.md)

### 2. `plugin/hooks/README.md` cites the `scratch` leg for "held to its write roots and network allowlist", but that leg measured the write roots only
→ [finding_2.md](chore_sandbox_honesty_paragraphs_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so no reference-implementation divergence is graded.

- **Verified-OK: the scope register's no-change rows 75–77.** `docs/sandbox-record.md` residuals 9, 12 and 13 still carry *"until AP9 is taken"*, *"CS6, owed"* and *"(RG1–RG3 owed)"*. Each is followed by its own *Since then* sentence, which is that document's stated convention (`## 6. The residuals`, opening paragraph), so these are not missed sites.
- **Verified-OK: the `_README` probe line under `sandbox.optOut`.** The probe line says the file runs inside the sandbox even in an opted-out profile. The appended `THE SANDBOX IS OFF BY THIS REPOSITORY'S OWN CHOICE` line overrides it, as it already overrode the pre-existing `THE SANDBOX IS STRICT` line. So this adds no new contradiction.
