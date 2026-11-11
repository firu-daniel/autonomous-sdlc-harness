# Code Review: chore_rename_to_devscene

## Context

**Branch:** `chore_rename_to_devscene`
**Date:** 2026-11-11
**Reviewed:** the whole branch diff against the default branch, `defaultBranch` `dev`. This run copy has no local `dev` ref, so the base was `origin/dev`. The diff covers 42 commits and 256 files. It renames the product to DevScene in the cli producers (`cli/src`, the templates, the daemon unit templates and the package manifest), the cli suites, the plugin manifest and its agents, commands and instructions, the marketplace and workspace manifests, the release tooling, the probe and gate scripts, the self-adopted mirrors, the root documents, `llms.txt` with its gate, `schemas/`, `evals/`, the Python service, `docs/` and the worked example. 39 run-artifact files excluded from the reviewed diff. Pass 2 found no per-unit review folder under `harness-runs/task_plan_point_reviews/chore_rename_to_devscene_task_plan/`, so there was nothing to reconcile.

**What checks out.**
- **Pure rename.** A word-level diff of every non-run-artifact file finds only these changes beyond swapping the name: the measured-record disclosure sentences and parentheses the story index requires, the rewrite of the example's `lessons.md` passage, and the "An …" → "DevScene is an …" retitles.
- **Mirror pairs.** Every pair the story index lists as a risk holds:
  - `MACHINE_DIR_NAME` / `hr_*_dir`
  - `KEEP_AWAKE_WHO` / `HR_KEEP_AWAKE_WHO`
  - `RUNTIME_CLI_RELATIVE` / `docs-search-server.sh`'s entry path
  - the `.gitignore` block header / `publish-main.sh`'s strip pattern
  - the release-tag shape in `tag-release.sh`, `release-npm.yml` and the two workflow templates
  - `devscene-placeholders` in the shell library and its suites
- **Self-adopted copies.** `git diff --no-index --stat cli/templates/scripts scripts` reports `0` for every byte-copied script.
- **Manifests.** The lockfile entry `node_modules/devscene` sits in sorted position. `plugin.json` gains `displayName`, and the marketplace `plugins[].name` matches the plugin `name`.
- **Out-of-scope names.** None was touched: `sdlc-harness`, `harness-*.yml`, `HARNESS_*`, `harness.config.json`, `harness-analyze` and `harness-docs` all survive.
- **Example capture.** The README's new two-pair description of the `lessons.md` template-vs-capture diff matches `git diff --no-index` exactly.

**Done-when search.** The search still lists these hits:
- the maintainer-owned `.claude/` files that Task 28's paste record and the story index's `## Corpus staleness` hand edits cover;
- the recorded-release fixture `cli/test/fixtures/harness-control-0.6.1.yml`;
- the frozen capture;
- the one historical-name line in the example README;
- `examples/notes-app/.mcp.json`, which is Finding 1.

**Tests.** This review runs no suite. The branch adds no test file and no tree-reading test, so no `treeGuards` registration is owed. Whether the edited suites pass is for the Run gates phase to establish. `phases.parity` is `false`, so no parity cross-check applies.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committer flips each one to `[x]` as that fix's commit lands. Each entry resolves to `harness-runs/code_reviews/chore_rename_to_devscene_code_review/finding_<K>.md` through its `**Finding K**` reference.

1. [ ] **Finding 2** — Change "an devscene" to "a devscene" in the line-1 headers of `harness-control.yml` and `harness-trigger.yml` _(layer: cli)_
2. [ ] **Finding 1** — Replace the two old-name occurrences in `examples/notes-app/.mcp.json`'s `_comment` with `devscene` _(layer: general)_

---

## Must Fix

### 1. `examples/notes-app/.mcp.json` still names the CLI `autonomous-sdlc-harness`, so the done-when search lists a hit none of its three allowances admits
→ [finding_1.md](chore_rename_to_devscene_code_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

### 2. Two workflow-template headers now read "an devscene"
→ [finding_2.md](chore_rename_to_devscene_code_review/finding_2.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section is empty.
