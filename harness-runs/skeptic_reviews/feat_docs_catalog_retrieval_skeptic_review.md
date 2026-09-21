# Skeptic review: feat_docs_catalog_retrieval

## Context

**Branch:** `feat_docs_catalog_retrieval`
**Date:** 2026-09-17
**Reviewed:** the whole-branch diff against `dev` — 72 files, +4030/-122, adversarially, in five segments: the new `cli/src/retrieval/` area and the `docs` verb; the adopter surface (`init`'s flag, prompt and setup step, the `.mcp.json` and permission-profile retrieval halves, the launcher template, the three `doctor` checks); the ten plugin agent grants and the guard's left-allowed comment; the schema and its negative fixture; and the documents of record. 53 run-artifact files excluded from the reviewed diff.

**De-duplicated against** the already-committed `harness-runs/code_reviews/feat_docs_catalog_retrieval_code_review.md` (8 findings, all applied) and `harness-runs/architecture_branch_reviews/feat_docs_catalog_retrieval_arch_review.md` (3 findings, all applied). `phases.parity` is `false` in `harness.config.json`, so no parity review ran, **check 2's parity leg is inert** and there is no reference implementation to grade as a claim; check 2's runtime-address leg and checks 1 and 3–5 ran in full.

**Headline: one net-new Should Fix, no Must Fix.** The branch stands up to the adversarial pass. What it survived, first-hand rather than on the earlier reviewers' word:

- **Check 1 (is it wired and reached?).** Every new surface has a caller, traced across all three `layers[].path` scopes (`cli`, `plugin`, `.`). `setUpRetrieval` is called from `commands/init.ts` after `plan.apply`; `retrievalApplies` gates five consumers and every one imports it rather than re-spelling it; `serveDocs` is reached from `docs serve`, which is what `cli/templates/scripts/docs-search-server.sh` `exec`s, which is what `.mcp.json`'s `harness-docs` entry runs, which is what the profile fragment's `enabledMcpjsonServers` starts, whose one `allow` entry is `SEARCH_TOOL_PERMISSION` — the same string the ten agent allowlists carry and the same string `retrieval/server.ts` registers the tool under. The `--cwd` the launcher passes **after** the sub-verb was checked against `cli.ts` → `parseArgv`, which consumes global options wherever they appear, so it is stripped before `parseFlags('serve', args, [])` — a `serve` that rejected it would have been a server that never starts. No dead path found.
- **Check 2, runtime-address leg.** The composed address was concatenated by hand and read: `hr_cache_dir` (`${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness`, one trailing slash stripped, empty-string case caught by `[ -n ]` rather than `:-`) + `retrieval/runtime/node_modules/autonomous-sdlc-harness/dist/cli.js` resolves byte-identically to `retrievalRuntimeDir()` joined with `RUNTIME_CLI_RELATIVE`, which is the same file `retrievalRuntimeState()` test (1) and `doctor`'s `retrieval-dependencies` grade. The three consumers cannot disagree about which file the server starts from.
- **Check 3 (citations are guilty until confirmed).** Every cited authority in the new code was opened. `docs/retrieval.md` → `## Measured, and how` item (b) and `## Still open` exist and say what `store.ts`'s `DocStore.lexicalSearch` comment claims. `.claude/context/conventions.md` → `## The stack, in the words the rules below use` carries the docs-retrieval carve-out `runtime.ts` cites, and `### Where a new responsibility goes`, `## Configuration is the source of truth…`, `## The testing bar` and `## Output, logging and errors` all exist. `core/report.ts`'s `docs serve` clause and `core/writer.ts`'s per-checkout-index clause are both present and were added in the same edits that introduced the exceptions they license. `machine/paths.ts` choice 2 exists and now names `hr_cache_dir`. A repo-wide grep for `prompt point`, `TODO: @claude`, `do-not-port` and `deliberate refinement` over `cli/src`, `plugin`, `docs`, `schemas` and `scripts` returns no citation in this branch's code — there is no fabricated authorization to disprove.
- **Check 4 (re-grade every "intentional divergence").** The two `stale-rule` exceptions the architecture review accepted — the write-engine monopoly for `<stateDir>/docs_index/`, and the single-output-surface rule for `docs serve` — were re-tested. Leg 1: neither cites a behaviour as "wholly a bug"; each is a rule the task prompt's own mandatory deliverables (a per-checkout gitignored index; a stdio MCP server) cannot be met under, and each is declared at the entry point (the owning module's header) rather than buried. Leg 2: no sibling precedent sets a different convention — `machine/registry.ts` is the established precedent for machine state outside the engine, and `writer.ts`'s header now names the retrieval writes beside it. Both legs pass; they are call-outs, not findings. The third divergence, from the task prompt itself, is in the call-out section below.
- **Check 5 (runtime behaviour).** `searchDocs`'s two paths preserve rank order (`getChunks` re-orders its rows back into the id order it was given); the server's call queue is serialised so two refreshes cannot embed the same chunk twice; the abstention is reachable on both its arms; `openRetrieval` runs the config gate and the model-file gate before anything loads, under the stub too; `--dry-run` and `--in-memory` both open a `dataDir: undefined` store, so neither writes. No privileged read or write is introduced, so the client-only-gate check does not apply.

**The one finding** is the converse of check 1 rather than an instance of it: a value computed on every refresh whose only sink is unreachable to the consumer that acts on it. It is graded Should Fix, not Must Fix, because the agents' own contract routes them to the correct fallback.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Surface the corpus-coverage warnings in the `search_docs` result and in `doctor`'s `retrieval-index` pass message _(layer: cli)_

---

## Must Fix

None.

---

## Should Fix

### 1. The corpus-coverage warnings never reach the two consumers that act on the search, so a half-indexed corpus is indistinguishable from an exhaustive one
→ [finding_1.md](feat_docs_catalog_retrieval_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

**`init` registers the MCP server, where the task prompt says the plugin does — accepted, surfaced for confirmation.** The task prompt's §4 reads *"The plugin declares the server, so adopters get it when the plugin is installed and retrieval is on."* The branch does not do that: `cli/src/generators/repoRoot.ts` → `retrievalWiring` merges the `harness-docs` entry into the adopter's own `.mcp.json` when `retrievalApplies` holds, and `plugin/` carries only contract text and allowlist grants. The decision is recorded in `harness-runs/story_plans/feat_docs_catalog_retrieval_story_plan.md` (*"**`init` registers the server**, not the plugin … the way it already writes the Playwright servers"*) — a real citation that says what is claimed, so check 3 passes. Check 4's two legs pass too: the prompt sentence is not a behaviour being dropped (the adopter still gets the server), and `cli/templates/repo/mcp.json` with `settings.autonomous.qa.json` is an established in-project precedent for exactly this shape, so the code matches a precedent rather than neither. **What it costs, for the user to confirm:** an adopter who installs the plugin and sets `docs.retrieval` by hand gets nothing until they re-run `init` — and, because the permission profile is `create-if-absent`, `init --force` — which is a sharper edge than "installed with the plugin". Both generated templates already carry that instruction in their own `_comment` / `_README` text, and `docs/retrieval.md` → `## How it fits together` states it, so the branch documents the cost it takes on.

**Two `stale-rule` exceptions carried over from the architecture review.** The `<stateDir>/docs_index/` write outside `core/writer.ts`, and `docs serve`'s stdout outside `Reporter`. Both were re-tested against check 4's two legs above and both pass; the story index already routes them to a supervised `/harness-analyze` amendment. Listed here so the pass is on the record, not re-filed as findings.
