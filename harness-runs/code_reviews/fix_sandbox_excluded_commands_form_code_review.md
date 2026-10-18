# Code Review: fix_sandbox_excluded_commands_form

## Context

**Branch:** `fix_sandbox_excluded_commands_form`
**Date:** 2026-10-18
**Reviewed:** the whole branch diff against `dev`. That covers the new `sandboxExcludedCommand` producer and the `staleExcludedCommands` list in `cli/src/generators/profileEntries.ts` and `cli/src/generators/sandboxProfile.ts` (Task 1), and `doctor`'s `profile-sandbox` stale-form grading in `cli/src/doctor/checks.ts` (Task 2). It also covers the profile template's `_README` line and the `push-branch.sh` / `refresh-branch.sh` header comments (Task 3), `docs/cli.md`, `ARCHITECTURE.md` and `docs/sandbox-verification.md` (Task 4), and the re-rendered `examples/notes-app/.claude/settings.autonomous.json` (Task 5), with the two edited suites `cli/test/profile.test.mjs` and `cli/test/doctor-profile-sandbox.test.mjs`. 7 run-artifact files were excluded from the reviewed diff.

**Headline.** The generator now writes `bash <main>/<scriptsDir>/<wrapper>.sh:*`, and `doctor` grades the same string, because both read one `expectedSandbox`. An old `Bash(…)` entry is reported as stale, as a `warn` by default and a `fail` under `--remote-job`. Each changed behaviour comes with a test case, and both edited suites pass when run on their own (`doctor-profile-sandbox`: 15/15; `profile`: 43/43). Every `docs/sandbox-verification.md` row cited as evidence (P1a, P2) says what the new text claims. The scope register's `change` rows are all carried out, and a sweep for the old spelling outside `harness-runs/` finds only dated records and the stale-form wording itself. `phases.parity` is `false`, so no parity review ran. Pass 2 found no per-unit review folder at the supplied root, so it had nothing to reconcile. Three findings remain, none Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Drop the pending-work parenthetical from `push-branch.sh`'s `GIT_SSH_COMMAND` header paragraph _(layer: cli)_
2. [ ] **Finding 1** — Correct `bashScriptRule`'s doc-comment rationale for building on `sandboxExcludedCommand` _(layer: cli)_
3. [ ] **Finding 3** — Call the excluded entries "entries", not "rules", in `profile-sandbox`'s pass line and doc comment _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 2. `push-branch.sh`'s header ships a pending-work note to every adopter
→ [finding_2.md](fix_sandbox_excluded_commands_form_code_review/finding_2.md)

---

## Nice to Have

### 1. `bashScriptRule`'s doc comment gives the wrong reason for building it from `sandboxExcludedCommand`
→ [finding_1.md](fix_sandbox_excluded_commands_form_code_review/finding_1.md)

### 3. `profile-sandbox` still calls the excluded entries "wrapper rules"
→ [finding_3.md](fix_sandbox_excluded_commands_form_code_review/finding_3.md)

---

## Intentional divergences to confirm

_None — `phases.parity` is `false`._
