# Code Review: chore_thin_prose_family_unit_loop

## Context

**Branch:** `chore_thin_prose_family_unit_loop`
**Date:** 2026-10-12
**Reviewed:** the whole branch diff against `dev`. That is three plugin agent definitions thinned in place by Tasks 1–12: `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` and `plugin/agents/committer.md` (206 insertions, 259 deletions). 18 run-artifact files excluded from the reviewed diff.

The diff changes prose only. It adds no test file, and none of the touched layers' conventions documents requires a test for an agent-definition edit. Whether the branch passes its gates is for the Run gates phase to establish (`cli/test`, `scripts/run-gates.sh`, the manifest under `--strict`). `phases.parity` is `false`, so no parity cross-check ran and the call-out section is empty.

The checks that did run all passed:
- **Wire literals.** Every wire literal the story index's `Top risks:` names is still byte-identical: the three blocker forms, `prohibited`, `already passing`, `record disposition of `, `staged: index-only — `, the fixed subjects, the `### Standard procedure (`task` / `review_plan_file` / `review_item`)` heading, the `steps 1–6` range spelling, `noop: UI test K already marked`, and the three named `error:` returns.
- **Committer refusal paths.** Every refusal path is still stated (clean-tree guard, already-`[x]`, `noop:`, argument guard).
- **Citations.** Every `${CLAUDE_PLUGIN_ROOT}` path and cited heading resolves. The `committer` caller-table pointer names columns and phase steps that exist (`committer mode`, `committer extra args`; A1.5.2, A2.2, B.3, C2.3, E.1, E.2, G.3).
- **Sample pointers.** The sample-pointer demand from `plugin/agents/README.txt` is unchanged.
- **Word counts.** They match the story index's `After` column (4665 / 2971 / 3569).

**Pass 0.** The sweep list has no regex rows filled in, so half (a) was disabled. Half (b) found no new exported symbol, because the diff is prose only.

**Cross-family copies.** A ten-word-window comparison against every other agent definition found two shared copies the branch forked. The story's own D3 split rule misses both, because each sits inside a longer sentence: Findings 4 and 5.

The one Must Fix predates the branch, but it sits in a line this branch rewrote.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 6** — Make `committer`'s template-capitalisation sentence cover all three Subject reconciliation templates _(layer: plugin)_
2. [x] **Finding 3** — Reword `layer-reviewer`'s intro so `Write` is not barred from the findings and probe files _(layer: plugin)_
3. [x] **Finding 2** — Name the wrapper in `layer-implementer`'s refused-call fallback _(layer: plugin)_
4. [x] **Finding 1** — Point `layer-reviewer`'s catch-all skip at `## Unsolicited dispatch guidance`, not past it _(layer: plugin)_
5. [ ] **Finding 4** — Restore the shared path-placeholder clause in both family `## Resolved values` preambles _(layer: plugin)_
6. [ ] **Finding 5** — Restore the shared site-anchor definition in `layer-reviewer`'s `### 3. At least one Must Fix` _(layer: plugin)_
7. [ ] **Finding 7** — Re-point `.claude/context/conventions.md`'s citation of the committer's **Fixed-form subjects** bullet _(layer: general)_

---

## Must Fix

### 1. `layer-reviewer`'s catch-all skip jumps over `## Unsolicited dispatch guidance` on every non-catch-all dispatch
→ [finding_1.md](chore_thin_prose_family_unit_loop_code_review/finding_1.md)

---

## Should Fix

### 2. `layer-implementer`'s refused-call fallback runs `bash <scripts_dir>/<name>.sh` with nothing left to say which wrapper `<name>` is
→ [finding_2.md](chore_thin_prose_family_unit_loop_code_review/finding_2.md)

### 3. `layer-reviewer`'s intro says `Write` is "no licence to change the tree" while its contract requires a findings-file `Write`
→ [finding_3.md](chore_thin_prose_family_unit_loop_code_review/finding_3.md)

### 4. The path-placeholder sentence that 22 agents carry verbatim was forked in `layer-implementer` and `layer-reviewer`
→ [finding_4.md](chore_thin_prose_family_unit_loop_code_review/finding_4.md)

### 5. `layer-reviewer` rewrote the site-anchor definition that six other agents carry verbatim
→ [finding_5.md](chore_thin_prose_family_unit_loop_code_review/finding_5.md)

### 6. `committer`'s "Both templates are free-form" now sits after three templates
→ [finding_6.md](chore_thin_prose_family_unit_loop_code_review/finding_6.md)

### 7. `.claude/context/conventions.md` cites the committer's **Fixed-form subjects** bullet for a rule that bullet no longer states
→ [finding_7.md](chore_thin_prose_family_unit_loop_code_review/finding_7.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section is empty.
