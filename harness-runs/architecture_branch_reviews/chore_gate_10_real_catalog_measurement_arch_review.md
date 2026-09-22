# Architecture review — `chore_gate_10_real_catalog_measurement`

## Context

Branch `chore_gate_10_real_catalog_measurement`, reviewed 2026-09-22 against `dev...HEAD`. The reviewed diff is four prose documents under `docs/` — `docs/development.md`, `docs/retrieval-eval-results.md`, `docs/retrieval-eval.md`, `docs/retrieval.md` — 300 insertions and 71 deletions, no source module, no template, no schema, no shell asset, no plugin contract. 10 run-artifact files excluded from the reviewed diff.

Layer placement is correct throughout: every target is a prose document under `docs/`, which `harness.config.json` → `layers[]` routes to the `general` catch-all at path `.`, and `.claude/context/conventions.md` → `### Where a new responsibility goes` puts *"a measured fact or a decision of record"* in `docs/` and nowhere else. The branch's four hard prohibitions hold on the diff: `scripts/setup-worktree.sh` and `cli/templates/scripts/setup-worktree.sh` are both absent from it, the `<!-- eval:generated:start -->` / `<!-- eval:generated:end -->` region of `docs/retrieval-eval-results.md` is untouched, no `plugin/agents/` allowlist changes, and no `/Users/…` or `/home/…` path enters any changed file. Roadmap item 17 keeps its row in `docs/development.md` → `## 6`, so the deferral-cites-a-numbered-row rule (`.claude/context/conventions.md` → `## Documents of record`) still resolves for its one remaining citer.

The one architecture conclusion: a **`plugin`-layer registry has acquired a second owner in the `general` layer.** `docs/retrieval.md` now enumerates by hand the ten agent definitions that carry the `mcp__harness-docs__search_docs` grant — a roster `plugin/agents/README.txt` already declares as *"one roster, one wire"*, with its own re-derivation command and its own stated list of the files a rename must edit, which does not include `docs/retrieval.md`.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — `docs/retrieval.md` restates the `search_docs` grant roster that `plugin/agents/README.txt` owns _(layer: general)_
2. [ ] **Finding 2** — `docs/development.md`'s gate 10 run stamp carries leg (i)'s measured figure, whose home is `docs/retrieval.md` item (d) _(layer: general)_

## Must Fix

### 1. `docs/retrieval.md` restates the `search_docs` grant roster that `plugin/agents/README.txt` owns

→ [finding_1.md](chore_gate_10_real_catalog_measurement_arch_review/finding_1.md)

## Should Fix

### 2. `docs/development.md`'s gate 10 run stamp carries leg (i)'s measured figure, whose home is `docs/retrieval.md` item (d)

→ [finding_2.md](chore_gate_10_real_catalog_measurement_arch_review/finding_2.md)

## Nice to Have

None.
