# Code Review: fix_profile_inert_permission_rules

## Context

**Branch:** `fix_profile_inert_permission_rules`
**Date:** 2026-10-21
**Reviewed:** the whole branch diff against `dev`, resolved as `origin/dev` because this checkout has no local `dev` branch. That is 23 files across all three layers:
- **`cli`:** `writeProtection.ts` → `fileToolDenyRules`, now `Edit`-only; `permissionProfile.ts`, now two forms in the base, with the third token family removed; `profileEntries.ts`'s new mirror declaration; `doctor/checks.ts` → `profile-write-protection`, now `Edit`-only; the two profile templates; the watcher's `run_profile_wrapper_prefixes`, `run_profile_entries`, `run_profile_render`, `run_profile_check` and `spawn_engine`; `cli/scripts/README.md`; five suites under `cli/test/`.
- **`plugin`:** `autonomous-script-allowlist-guard.sh`, narrowed to the judged checkout's own scripts directory, with its README row and `## The deny list`; `autonomous_pause_and_ledger.md`.
- **`general`:** `docs/cli.md`, `docs/watcher.md`, `docs/development.md`, `docs/guard-verification.md` (N120–N123), `docs/sandbox-verification.md` (F4, W6–W8), and the `examples/notes-app/` profile and README.

18 run-artifact files excluded from the reviewed diff.

**Headline:** the branch does what the task prompt asks.
- No generated rule is a `Write(…)` path rule, and no wrapper rule is a glob.
- The per-run twins are built from one prefix helper used by both render and check. They are held by a launch test that twins every main-checkout wrapper row a real `init` wrote.
- `run_profile_check` accepts only exact twins, and the `Bash(*)` tamper case is still refused.
- `doctor` neither requires nor reports a `Write` rule.
- The guard and the profile now say the same thing.
- The scope-register derivations A and B, re-run, reach only register rows.
- Every accompanying test the conventions documents require is present: the guard's decision rows, the mirror declarations and their pinning cases, and the fixture re-render with its re-counted substitution figures, which were spot-checked as 163 / 124 / 132 / 36.
- This review runs no suite, so whether those tests pass is for the Run gates phase to establish.
- `phases.parity` is `false`, so no parity cross-check applies.
- Pass 0's grep half has an empty sweep list, a configuration gap. The new-exported-symbol caller check found no new export: `FORBIDDEN_IN_ENTRY` already existed. The one new shell function, `run_profile_wrapper_prefixes`, has two callers.

Three findings remain. The highest-impact one is that the owed W7 measurement cannot detect a broken twin.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else are informational and never the iteration source.

1. [x] **Finding 2** — Name all four appendable arrays in `run_profile_check`'s `delta` refusal and pin it with a case _(layer: cli)_
2. [x] **Finding 3** — Restate the "three forms" script and generator comments as two base forms plus the per-run copy's exact path _(layer: cli, general)_
3. [ ] **Finding 1** — Give W7 a call the guard does not grant, so it measures the run-copy twin _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The owed W7 row cannot tell a working run-copy twin from a broken one, because the guard already grants every call it lists
→ [finding_1.md](fix_profile_inert_permission_rules_code_review/finding_1.md)

### 2. `run_profile_check`'s `delta` refusal still says only `denyWrite` and `deny` may be appended to
→ [finding_2.md](fix_profile_inert_permission_rules_code_review/finding_2.md)

---

## Nice to Have

### 3. Six script and generator comments still say the generated profile emits three forms, the third a sibling worktree's
→ [finding_3.md](fix_profile_inert_permission_rules_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section carries no parity divergence.
