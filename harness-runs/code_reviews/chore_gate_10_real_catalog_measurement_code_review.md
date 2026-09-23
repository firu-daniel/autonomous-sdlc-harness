# Code review — `chore_gate_10_real_catalog_measurement`

## Context

Branch `chore_gate_10_real_catalog_measurement`, reviewed 2026-09-22 against `dev` (the `defaultBranch` in
`harness.config.json`). The reviewed diff is **four prose documents under `docs/`** — `docs/retrieval-eval-results.md`,
`docs/retrieval.md`, `docs/development.md` and `docs/retrieval-eval.md` — 300 insertions and 71 deletions across them.
**13 run-artifact files excluded from the reviewed diff.** All four targets land in the `general` catch-all layer, as the
story index predicted; no file under `cli/` or `plugin/` changed.

`phases.parity` is `false`, so no parity leg ran and no finding below cites a reference implementation; `phases.docs` is
`false`, so the docs corpus and `search_docs` were not consulted. The branch consumes an operator-supplied figures block
rather than taking measurements, so the review graded the **write-up** against that block and against the four documents'
internal consistency, not the measurements themselves.

**The branch's four hard prohibitions all hold, verified independently rather than taken on trust.**
`scripts/setup-worktree.sh` and `cli/templates/scripts/setup-worktree.sh` are byte-identical to branch point (acceptance 9);
no `plugin/agents/` allowlist changed (acceptance 9); the `<!-- eval:generated:start -->` / `<!-- eval:generated:end -->`
region of `docs/retrieval-eval-results.md` is byte-identical to branch point, confirmed by a byte comparison of the two
revisions' extracted regions (acceptance 10); and no machine-local path entered any changed file — a
`grep -rnE '/(Users|home)/[a-z]'` over all four returns only the pre-existing, deliberate example in `docs/development.md`
§6's own sweep instructions.

**The scope register's derivation commands were re-run as an independent sweep.** Entry A returns only
`docs/retrieval-eval-results.md` and `evals/docs-retrieval/cold-build.mjs` (register row 10, `no-change`, and its header
sentence is still true after the run). Entry B returns only the two deliberately historical *"the rule used to say"*
statements plus the six API-overload retry rows (register rows 12–17, unrelated to any cold build). Entry C returns four
sites outside the changed set, all of them register rows 9, 11, 25 and 28, each still true. Entry D confirms the mirrored
pair unchanged. So acceptances 4, 5 and 9 hold and **no missed site was found** — the story index named that as its top
risk and the sweep does not corroborate it.

**Pointer resolution passes.** Every anchor the new prose introduces was opened: `plugin/agents/README.txt` →
`The docs-retrieval grant — one roster, one wire` exists, holds the ten-agent roster and carries the re-derivation
command, and the roster is correct against `grep -rln --include='*.md' "mcp__harness-docs__search_docs" plugin/agents`
— `task-plan-writer` is on it and `docs-writer` / `docs-reviewer` are not, which is exactly the claim
`docs/retrieval.md` rests its cost correction on (acceptance 7). The new `### The 177-chunk build …` and
`### The real-catalog build — 1,960 chunks, 2026-09-22` headings resolve from every site that cites them.
`bash scripts/check-llms-txt.sh` and `bash scripts/check-command-spelling.sh` both pass.

**Three findings, one of them a Must Fix**, and all three sit inside the two documents that carry the arithmetic. The Must
Fix is a route mislabel in the file of record's own cross-check table that makes the section contradict its own prose; the
Should Fix is a sentence in the same file that grounds the cancellation decision on cost where the two documents that own
that decision ground it on coverage. Neither is a missed site or a machine path — the risks the plan was written around
did not materialise.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Label the CLI route's per-chunk figure as total wall time, not refresh _(layer: general)_
2. [x] **Finding 2** — Stop grounding the cancellation on cost in the file of record _(layer: general)_
3. [x] **Finding 3** — Write gate 10's leg (iii) refusal example with `@<version>` _(layer: general)_

## Must Fix

### 1. Label the CLI route's per-chunk figure as total wall time, not refresh

→ [finding_1.md](chore_gate_10_real_catalog_measurement_code_review/finding_1.md)

## Should Fix

### 2. Stop grounding the cancellation on cost in the file of record

→ [finding_2.md](chore_gate_10_real_catalog_measurement_code_review/finding_2.md)

## Nice to Have

### 3. Write gate 10's leg (iii) refusal example with `@<version>`

→ [finding_3.md](chore_gate_10_real_catalog_measurement_code_review/finding_3.md)

## Intentional divergences to confirm

`phases.parity` is `false` in `harness.config.json` and `.claude/context/conventions.md` →
`## Reference implementation` states that this project is kept in parity with nothing, so no reference implementation was
consulted and this section is empty by construction.
