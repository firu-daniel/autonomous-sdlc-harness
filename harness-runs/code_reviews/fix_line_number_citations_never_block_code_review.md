# Code review — `fix_line_number_citations_never_block`

**Context.** Branch `fix_line_number_citations_never_block`, reviewed 2026-09-16 against `dev` (`defaultBranch`), two-pass mode. What was reviewed: the ten units of the story plan, which close the `ROADMAP.md` → `## Quality and testing` row *"Line-number citations never block"*. The diff is 26 branch files of prose: one adopter template under `cli/templates/` (Task 1), 13 agent definitions, 4 instruction files and 8 sample fixtures under `plugin/` (Tasks 2–9), and `ROADMAP.md` (Task 10). 15 run-artifact files excluded from the reviewed diff. The local `dev` ref is behind `origin/dev`, so `git diff dev...HEAD` also lists `CONTRIBUTING.md` (commit `43552bf`). That file comes from `origin/dev`, is not this branch's work, and was not reviewed. Diffing against `origin/dev` leaves exactly the 26 branch files.

Headline conclusions. The branch meets what the prompt asked for. The acceptance grep (`<file>:<line>`, `file:line`, `#L<line>` over `plugin`) now hits only the user's own input format: `user-review-fix-plan-writer.md` → step 2's **File and line** bullet, and `sample_user_review.md`'s header. Every carrier of the three shared clauses matches byte for byte, checked with a fixed-string grep. The site-anchor clause appears in 7 agent definitions, the rewritten Should Fix / Nice to Have pair in `branch-reviewer`, `skeptic-reviewer` and `layer-reviewer`, and the `**Guard carve-out.**` in those three plus `review-plan-reviewer` and `task-plan-reviewer`. The dead-pointer examples still grade Must Fix under the new wording. No `file-and-line reference` quoter is left in `plugin/`, `docs/`, the root prose documents, `cli/templates/` or `cli/test/`. Tests: every changed file is prose, and no test pins the one changed template (`grep` over `cli/test` and `cli/src` for its sentence finds nothing). This review ran no gate. `claude plugin validate --strict` was refused by the permission layer here, as it was in Task 10, which records `scripts/run-gates.sh` gate 1a passing in its place. Parity: `phases.parity` is `false`, so no parity review ran. Pass 0: the sweep list has no regexes filled in, and the diff adds no exported symbol, so the caller check has nothing to check. Pass 2: the per-unit findings root holds no review files, so reconciliation was a no-op. The findings below are four Should Fix wording and precision defects. None of them blocks.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Close the unclosed aside in the parity-review README's citation sentence _(layer: cli)_
2. [ ] **Finding 4** — Replace the orphaned "reference-implementation line(s)" referent in the supervised orchestration instructions _(layer: plugin)_
3. [ ] **Finding 2** — Give the code-review sample's secondary `SearchPanel` citation the quoted substring its own precision clause requires _(layer: plugin)_
4. [ ] **Finding 1** — Stop `task-plan-reviewer`'s carve-out from reading as a resolution rule over paths a task is about to create _(layer: plugin)_

## Must Fix

None.

## Should Fix

### 1. `task-plan-reviewer`'s carve-out reads as a resolution rule over paths a task is about to create
→ [finding_1.md](fix_line_number_citations_never_block_code_review/finding_1.md)

### 2. The code-review sample's secondary `SearchPanel` citation breaks the precision clause the fixture exists to demonstrate
→ [finding_2.md](fix_line_number_citations_never_block_code_review/finding_2.md)

### 3. The parity-review README's citation sentence opens an aside it never closes
→ [finding_3.md](fix_line_number_citations_never_block_code_review/finding_3.md)

### 4. "The reference-implementation line(s)" is left pointing at a phrase the same edit renamed
→ [finding_4.md](fix_line_number_citations_never_block_code_review/finding_4.md)

## Nice to Have

None.

## Intentional divergences from the reference implementation

None — `phases.parity` is `false` in `harness.config.json`.
