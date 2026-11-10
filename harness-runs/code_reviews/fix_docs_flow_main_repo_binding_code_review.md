# Code Review: fix_docs_flow_main_repo_binding

## Context

**Branch:** `fix_docs_flow_main_repo_binding`
**Date:** 2026-11-10
**Reviewed:** the whole diff against `origin/dev`. `defaultBranch` is `dev`, which exists in this run copy only as the remote-tracking ref. The diff covers 12 files, +152 / −32:
- **Tasks 1–5 (plugin):** `<MAIN_REPO>` `## Resolved values` rows in both engine commands, the docs fork, both orchestration forks and the user-review-fix-plan fork; the literal-spelling sentence on the prompt-injection screen's row; the push prose in `committer.md`, `docs_phase_instructions.md`, both planning forks, the orchestration fork and `AUTONOMOUS_FLOW.md`.
- **Task 6 (cli):** the extended `cli/test/main-repo-resolution-corpus.test.mjs`.
- **The earlier round's Finding 1 fix:** the `<repo_root>` row in `branch-start-docs-autonomous.md`.

11 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- **The rows are byte-identical.** All 14 copies of the `<MAIN_REPO>` row in `plugin/` match `committer.md`'s line. Each clause that moved into a row left its step pointing at the row. The resolution clause's wording and its home in `main_repo_resolution.md` are unchanged.
- **The forbidden spellings are gone.** `plugin/` and `cli/templates/` contain no bare `<scripts_dir>/push-branch.sh`, no `$REPO_ROOT` push argument, no "watcher-supplied" and no pipeline resolution.
- **Every new anchor resolves.** The committer's "step 6", `AUTONOMOUS_FLOW.md`'s `## The wiring table` → "Git wrappers — the outer-loop scripts an agent may invoke" row, and the docs fork's `## Commit mechanics (single source of truth)` all exist.
- **The test needs no new registration.** The extended suite is already registered in `harness.config.json` → `treeGuards`, covering `plugin/**/*.md`. Run against the existing build with `node --test`, it passed 6 of 6.
- **Parity:** `phases.parity` is `false`, so no parity cross-check runs.

What remains are two Should Fix findings: a guard that is narrower than its own header, and one docs-phase sentence that now says "exactly" where it means "in the same shape".

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Say the docs phase's commit and push take the docs-catalog fences' command shape, with this phase's own paths and subject _(layer: plugin)_
2. [ ] **Finding 1** — Widen the bare-push forbidden pattern to every non-`<MAIN_REPO>/` prefix and make the suite header state exactly what it polices _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The bare-push guard passes a run-copy-prefixed push spelling, but the suite header says it forbids any spelling other than the main checkout's copy
→ [finding_1.md](fix_docs_flow_main_repo_binding_code_review/finding_1.md)

### 2. The docs phase says its commit and push are "spelled exactly as" the docs-catalog fences, but those fences carry a different subject and a checklist path the docs phase does not stage
→ [finding_2.md](fix_docs_flow_main_repo_binding_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences.
