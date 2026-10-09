# Code Review: fix_adopter_scripts_dir_and_workflow_hardening

## Context

**Branch:** `fix_adopter_scripts_dir_and_workflow_hardening`
**Date:** 2026-10-09
**Reviewed:** the whole branch diff against `dev` (merge base `cb7645b`), 86 files. That covers:
- the `harness-scripts` default for a generated config, `init --scripts-dir`, and the `scriptsDir` re-read on `--reset-config` (`cli/src/commands/init.ts`, `cli/src/generators/harnessConfig.ts`, `cli/src/config/model.ts`);
- the absent-key warning (`cli/src/config/check.ts`);
- the four hardened workflow templates;
- the `typos` spelling fixes across `cli/src`, `cli/templates` and `plugin`;
- the new gates 6f (`scripts/check-typos.sh`) and 14d (`scripts/check-rendered-workflows.mjs --zizmor`), wired into `scripts/run-gates.sh`;
- the test-suite move to `INIT_SCRIPTS_DIR` and the new `cli/test/scripts-dir.test.mjs`;
- the docs, README, `llms.txt` and ROADMAP changes.

24 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- **The absent-key decision is implemented consistently.** `DEFAULTS.scriptsDir`, the schema `default`, the workflow `// "scripts"` fallbacks and the guards all still mean `scripts`, and only what `init` writes changed.
- **The action pins are correct.** The four pinned SHAs were re-resolved with `git ls-remote --tags` against `actions/checkout`, `actions/setup-node`, `actions/cache` and `actions/upload-artifact`, and each matches its commented release.
- **Both new gates pass on this tree.** `node scripts/check-rendered-workflows.mjs --zizmor` and `bash scripts/check-typos.sh` both exited 0 here: zizmor's unsuppressed findings are exactly the residual set, and `typos` reports only the deliberate set.
- **Tests:** every new `init` behaviour has a test against the compiled CLI except the rebuild of an unusable `scriptsDir`, which is Finding 1. This review ran no suite. Whether the suites pass is the Run gates phase's to establish.
- **Parity:** `phases.parity` is `false`, so no parity review applies.

One finding remains.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.**
- The orchestrator walks the `[ ]` entries below from top to bottom.
- The committing role flips each one to `[x]` as that fix's commit lands.
- `[ ]` markers anywhere else, such as sub-step bullets inside a per-finding file, are informational and are never the iteration source.

1. [x] **Finding 1** — Screen the `scriptsDir` that `init --reset-config` re-reads; write `harness-scripts` with a warning when it is unusable _(layer: cli, general)_

---

## Must Fix

### 1. `init --reset-config` re-reads an unusable `scriptsDir` unscreened: an empty or non-string value aborts as a CLI fault, and an absolute or `..` value is written back
→ [finding_1.md](fix_adopter_scripts_dir_and_workflow_hardening_code_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

Nothing here: `phases.parity` is `false`, so there is no reference implementation to diverge from.
