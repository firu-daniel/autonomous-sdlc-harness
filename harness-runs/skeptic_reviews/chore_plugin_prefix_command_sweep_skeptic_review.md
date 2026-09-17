# Skeptic Review: chore_plugin_prefix_command_sweep

## Context

**Branch:** `chore_plugin_prefix_command_sweep`
**Date:** 2026-09-17
**Reviewed:** the whole branch diff against `dev`, 74 files. 30 run-artifact files excluded from the reviewed diff.

This review was de-duplicated against two committed reviews. The first is `harness-runs/code_reviews/chore_plugin_prefix_command_sweep_code_review.md`, with its Findings 1–5. The second is `harness-runs/architecture_branch_reviews/chore_plugin_prefix_command_sweep_arch_review.md`, with its Finding 1. `phases.parity` is `false`, so no parity review exists and check 2's parity leg was not run. The one lesson in `harness-runs/lessons.md` is already covered by code-review Finding 5.

**What was verified first-hand:**

- **Wiring.** `scripts/check-command-spelling.sh` is run by `scripts/run-gates.sh` as gate `6d`. Run on its own, it exits 0 with no output. Both new exports in `cli/src/core/pluginIdentity.ts` have callers in `commands/`, `detect/`, `doctor/`, `generators/` and `machine/`. The `pluginName` render value reaches `cli/templates/claude/CLAUDE.md`, and a new `init.test.mjs` case pins that.
- **Qualified names.** Every `autonomous-sdlc-harness:<name>` in the tree names a file that exists under `plugin/commands/`.
- **Pure respelling.** In `plugin/`, `docs/analyze.md`, `docs/config.md`, `docs/watcher.md`, `ROADMAP.md` and `schemas/`, a word-level diff shows only the inserted prefix.
- **No code depends on the old spelling.** No hook, script, permission entry or `harness-analyze.md` placeholder matcher parses a command name, so the respelling breaks no parser.
- **No escapes past the gate.** No bare `/harness-*` spelling is left that gate 6d's pattern could miss. No prefix under the former `harness` slug remains.
- **Claims checked against their sources.** The claims about the removed "Interactive only" caveat and the watcher `bare` route were checked against the measurement records in `cli/src/commands/init.ts` and the watcher comment. Both runs cited as having launched with the bare strings have flow-progress ledgers under `harness-runs/flow_progress/`.

**Headline:** one net-new finding. A citation in the closed §6 debt paragraph names a symbol that the architecture-review fix moved out of the file it cites. Nothing else survived the adversarial checks.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Repoint §6's headless-leg citation from `ANALYZE_COMMAND` to `ANALYZE_INVOCATION` in `cli/src/commands/init.ts` _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `docs/development.md` §6 points to the headless-leg record as sitting "on `ANALYZE_COMMAND` in `cli/src/commands/init.ts`", but that paragraph is on `ANALYZE_INVOCATION`
→ [finding_1.md](chore_plugin_prefix_command_sweep_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
