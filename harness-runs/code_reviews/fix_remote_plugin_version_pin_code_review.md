# Code Review: fix_remote_plugin_version_pin

## Context

**Branch:** `fix_remote_plugin_version_pin`
**Date:** 2026-09-29
**Reviewed:** the whole branch diff against `dev`, in two passes (Pass 1, then Pass 2).

- **`cli`:** the workflow pin reader and the `--upgrade-workflows` mode of `generators/githubWorkflows.ts` (Task 1), `init --upgrade-workflows` and its report (Task 2), `doctor`'s version warning (Task 3), and the tag-clone install in `harness-run.yml` (Task 4). Also the `core/yamlScalar.ts` owner and the declared mirror that the architecture-review fixes added.
- **`general`:** `scripts/tag-release.sh` (Task 5), `scripts/probe-plugin-cli.sh` (Task 6), and the documentation in `docs/remote-execution.md`, `docs/cli.md` and `docs/development.md` (Tasks 7–9).

18 run-artifact files excluded from the reviewed diff.

**Headline.** Every task's accompanying tests are present: `cli/test/workflow-plugin-pin.test.mjs` drives the real install step against a two-version bare repository, `cli/test/init.test.mjs` covers the upgrade (`.bak`, carried cron, idempotence, no-flag, remote-off, `--dry-run`), and `cli/test/doctor.test.mjs` covers the warn/pass/no-pin cases and the route clearing the warning. Whether they pass is the Run gates phase's to establish. The Pass 0 caller check found every new export wired. The write-engine, `Reporter`, owned-constant and one-producer rules hold. The citations checked in `docs/development.md` → `## 7. Releasing` resolve: `729af00`, `cli/README.md` → **No lockfile of its own.**, and `scripts/publish-main.sh` → `MERGE IT WITH "REBASE AND MERGE"`. So does `tag-release.sh`'s target rule, checked against `origin/main`'s real first-parent history. `phases.parity` is `false`, so no parity cross-check ran. Two Should Fix findings remain: an install-time exposure to the same-name marketplace, and a pin reader that misreads a trailing YAML comment. One Nice to Have is a layout fix. Pass 2 found no per-unit review folder under the supplied root, so there was nothing to reconcile.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Re-wrap the run-on line in the `REMOTE_EXECUTION_CHECK` doc comment _(layer: cli)_
2. [x] **Finding 2** — Strip a trailing YAML comment when reading the `HARNESS_CLI_VERSION` pin _(layer: cli)_
3. [ ] **Finding 1** — Run `claude plugin install` from `$RUNNER_TEMP`, outside the checkout, like the marketplace add _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `claude plugin install` runs inside the checkout, where a project-scope marketplace of the same name can win over the pinned clone
→ [finding_1.md](fix_remote_plugin_version_pin_code_review/finding_1.md)

### 2. `renderedCliVersions` reads a trailing YAML comment on the pin line as part of the version
→ [finding_2.md](fix_remote_plugin_version_pin_code_review/finding_2.md)

---

## Nice to Have

### 3. The `REMOTE_EXECUTION_CHECK` doc comment has one run-on line far past the file's wrap width
→ [finding_3.md](fix_remote_plugin_version_pin_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is empty.
