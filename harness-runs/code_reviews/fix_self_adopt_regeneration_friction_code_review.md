# Code Review: fix_self_adopt_regeneration_friction

## Context

**Branch:** `fix_self_adopt_regeneration_friction`
**Date:** 2026-10-22
**Reviewed:** the whole branch diff against the default branch `dev`, as `origin/dev...HEAD`, because this run copy has no local `dev` ref. That is 16 files, +871/−76:
- the opt-in carry-forward arm in `cli/src/generators/scripts.ts` (`resolveBody` precedence 1a, `readWrapperBody`, `WrittenWrapper.carried`);
- the identical-bytes README keep in `cli/src/generators/stateDir.ts` (`readmeRequest`, `holdsExactly`), with the `cli/src/core/writer.ts` header updated to match;
- the `init` wiring in `cli/src/commands/init.ts` (`selfAdoptionOf`, `carryOnDiskCommandLines: selfAdopt && ctx.flags.force`, the carried `commands` row, `hiddenBackupsNote`);
- the multi-word `HARNESS_CLI` parse in `cli/templates/scripts/restart-watcher.sh`, re-copied byte-identical into `scripts/`;
- the appended `.bak` exception lines in `cli/templates/repo/gitignore`, with the root `.gitignore` managed block aligned to the template;
- five new suites under `cli/test/`;
- `docs/cli.md`, `docs/development.md` and `docs/outer-loop-verification.md`.

13 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- Every task in the story index's readiness list landed, and each `cli` change landed with a suite that drives it against a throwaway fixture. The carry-forward has its perturbation pair: a harness-shaped fixture and an ordinary fixture, both under `HARNESS_SELF_ADOPT=1 --force`, with opposite outcomes. It also has an unforced arm and a dry-run arm. The README keep has its edited/unedited pair, and the restart-watcher parse has its one-word, multi-word, unresolvable and blank cases.
- I ran `tsc --noEmit` over `cli/` and it exits 0. This review ran no test suite; whether the suites pass is the Run gates phase's to establish.
- The recursion assertion still runs on a carried body (`wrapper-carry-forward.test.mjs` case (e)).
- `SELF_ADOPT_ENV` stays the single owner of the variable name.
- The hidden-`.bak` note takes its directory set from `generators/repoRoot.ts` → `contentsIgnoredDirectories`, so there is no second copy of the set.
- I re-ran both of the story index's scope-register derivation greps. Every hit maps to a register row, and every `change` row has landed.
- `phases.parity` is `false`, so no parity review ran and the call-out section is empty.

**Pass 0.**
- Half (a), the grep sweep, ran no regexes. This agent's sweep list is still the unfilled stub, which is a configuration gap to close. I ran an ad-hoc sweep of the added lines instead, for `console`, `process.exit`, mutating `fs` calls in `cli/src`, shell strings and `.sh` literals. It found no breach: the only mutating `fs` calls are in tests, against temp fixtures.
- Half (b), the caller check, found one new exported symbol, `readWrapperBody`. It has a call site outside its defining file (`cli/src/commands/init.ts` → `keptWrapperBody`).

**Pass 2.** `per_task_findings_root` (`harness-runs/task_plan_point_reviews/fix_self_adopt_regeneration_friction_task_plan/`) does not exist, so Pass 2 was a no-op.

What is left is three Should Fix findings, all about text: one recipe line, one stale test header and one stale count in a doc comment. One further item turns on a decision rather than a fix, so it went to the caller as a question rather than into this index.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Replace "Both classes" with "Every one of them" in `WriteRequest.forceOverride`'s doc comment _(layer: cli)_
2. [x] **Finding 2** — Correct `wrapper-carry-forward.test.mjs`'s header to name `self-adopt-force.test.mjs` as the end-to-end case _(layer: cli)_
3. [x] **Finding 1** — Add `--non-interactive` to the recipe's real-run line so it is the run the dry run previewed _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The recipe previews a `--non-interactive` run, then runs one without that flag
→ [finding_1.md](fix_self_adopt_regeneration_friction_code_review/finding_1.md)

### 2. `wrapper-carry-forward.test.mjs`'s header says the option has no caller, but `init` sets it now
→ [finding_2.md](fix_self_adopt_regeneration_friction_code_review/finding_2.md)

### 3. `WriteRequest.forceOverride`'s doc still says "Both classes" after a third per-request user was added
→ [finding_3.md](fix_self_adopt_regeneration_friction_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section is empty.
