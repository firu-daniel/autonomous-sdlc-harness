# Architecture review — fix_untrusted_input_framing_subagents

## Context

Branch `fix_untrusted_input_framing_subagents`, reviewed 2026-11-09 in implemented-solution mode against the diff base `dev`. That base does not resolve in this run copy, which carries only `remotes/origin/dev`, so the diff was taken as `origin/dev...HEAD`. That is the same branch, read from the remote.

Reviewed: 34 changed files.
- The new shared instruction module `plugin/instructions/untrusted_input.md`.
- One-line pointers in 15 agent definitions, 1 command, 2 flow documents, 11 instruction files and 1 sample.
- The `cli` contract test `cli/test/untrusted-input-corpus.test.mjs`.
- Its `treeGuards` registration in `harness.config.json`.

19 run-artifact files excluded from the reviewed diff.

Layer placement holds throughout:
- The module sits under `plugin/instructions/` with a family-less snake_case name, and carries its `## Resolved values` table and its own `## Who may cite this` roster. That roster matches the `git grep` citer set exactly.
- The test sits in `cli/test/` with a rule-stating header, reads the plugin corpus as text, and imports nothing across the boundary.
- The tree-guard entry sits in the `general` layer's configuration.
- No dependency points the wrong way, and no frontmatter or allowlist changed.

Headline conclusion: one Must Fix. The new module is reached by two cores and by many dispatched agents, but it never records whose `## Setup` owns its path placeholders, or that `<ask>` is the citing flow's binding. Every sibling shared module records both. One Should Fix: `AUTONOMOUS_FLOW.md` keeps a paraphrase of the rule beside its new pointer.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Drop the rule paraphrase `AUTONOMOUS_FLOW.md` keeps beside its pointer _(layer: plugin)_
2. [x] **Finding 1** — Record placeholder resolution and the `<ask>` binding owner in `untrusted_input.md` _(layer: plugin)_

## Must Fix

### 1. `untrusted_input.md` does not say whose `## Setup` owns its path placeholders
→ [finding_1.md](fix_untrusted_input_framing_subagents_arch_review/finding_1.md)

## Should Fix

### 2. `AUTONOMOUS_FLOW.md` points at the module and keeps its own paraphrase of the rule beside the pointer
→ [finding_2.md](fix_untrusted_input_framing_subagents_arch_review/finding_2.md)

## Nice to Have

None.
