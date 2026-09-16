# Skeptic review — `fix_line_number_citations_never_block`

**Context.** Branch `fix_line_number_citations_never_block`, reviewed 2026-09-16 against `dev` (`defaultBranch`), including the four code-review fixes. I reviewed the whole-branch prose diff adversarially: the parity-review README template under `cli/templates/`, 13 agent definitions, 4 instruction files, 8 sample fixtures under `plugin/`, and `ROADMAP.md`. `CONTRIBUTING.md` also appears in the diff because the local `dev` ref is behind `origin/dev`. It is not this branch's work. 20 run-artifact files excluded from the reviewed diff. I de-duplicated against the committed code review (`harness-runs/code_reviews/fix_line_number_citations_never_block_code_review.md` and its four findings). No parity review exists because `phases.parity` is `false`, and no architecture review exists for this branch. `harness-runs/lessons.md` holds only the template's worked example.

What I checked:
- The story plan's cited clauses exist verbatim: `layer-reviewer.md` *"A routing-table row dispatches an agent whose file does not exist on disk"*, `review-plan-reviewer.md` *"A pointer with no matching file is a Must Fix"*, and `docs-reviewer.md`'s value-vs-coordinate test under check 2.
- A wider coordinate grep than the scope register's D1 (`line(s)`, `line N`, `.ts:N`, `at line`, `prompt line`, `navigation hint`) over `plugin`, `cli/src`, `cli/templates` and `docs` found no remaining contract that requires a coordinate or grades on one. The only hits left are the user-input format, hint-only wording, and bans.
- No script, hook, test or the committer parses the old `[<file>:<line>](<file>#L<line>)` shape.

Headline: one net-new Should Fix. The code review's Finding 1 fixed the carve-out's "unresolvable path is bound" reading in `task-plan-reviewer.md` only. `review-plan-reviewer.md` carries the same sentence and grades findings whose anchors can name a file the fix will create.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Exempt to-be-created paths from `review-plan-reviewer`'s carve-out _(layer: plugin)_

## Must Fix

None.

## Should Fix

### 1. `review-plan-reviewer`'s carve-out binds a finding's site anchor to a file the fix is about to create
→ [finding_1.md](fix_line_number_citations_never_block_skeptic_review/finding_1.md)

## Nice to Have

None.

## Intentional divergences (call-outs, not fixes)

None — `phases.parity` is `false` in `harness.config.json`, and the branch marks no divergence as intentional.
