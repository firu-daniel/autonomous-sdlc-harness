# Skeptic Review: fix_sandbox_excluded_commands_form

## Context

**Branch:** `fix_sandbox_excluded_commands_form`
**Date:** 2026-10-18
**Reviewed:** the whole branch diff against `dev`, adversarially. That covers:
- the new `sandboxExcludedCommand` producer and the `staleExcludedCommands` list (`cli/src/generators/profileEntries.ts`, `cli/src/generators/sandboxProfile.ts`);
- `PROFILE_SANDBOX_CHECK`'s stale-form grading (`cli/src/doctor/checks.ts`);
- the template `_README` line and the two wrapper headers;
- `docs/cli.md`, `ARCHITECTURE.md` and `docs/sandbox-verification.md`;
- the re-rendered `examples/notes-app` profile;
- the two edited suites.

12 run-artifact files were excluded from the reviewed diff. De-duplicated against `harness-runs/code_reviews/fix_sandbox_excluded_commands_form_code_review.md` and its three findings. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

**Headline.**
- **Wiring (check 1):** `applySandbox` writes `expectedSandbox().excludedCommands`, and `PROFILE_SANDBOX_CHECK` grades it from that same producer. The remote workflow runs `init` and `doctor --remote-job` at one pinned version. No other code parses an excluded entry: `writeProtection.ts` derives its paths from `runsUnsandboxed`, not from the entries.
- **Citations (check 3):** every P1a/P2 citation says what the new text claims.
- **The one net-new finding:** switching to a form that actually matches turns two "stays sandboxed" claims from vacuously true into security-bearing. These are the assignment-prefix premise behind keeping `GIT_SSH_COMMAND`, and the compound-call sentence. Neither has ever been measured against a matching entry, and the owed-re-run list a maintainer clears omits both.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Name the unmeasured assignment-prefix and compound boundaries in `docs/sandbox-verification.md`'s owed-re-run note _(layer: general)_

---

## Must Fix

### 1. The live excluded entry makes two unmeasured "stays sandboxed" claims load-bearing, and the owed re-run list omits both
→ [finding_1.md](fix_sandbox_excluded_commands_form_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Intentional divergences to confirm

_None. `phases.parity` is `false`, and the branch marks no divergence intentional._
