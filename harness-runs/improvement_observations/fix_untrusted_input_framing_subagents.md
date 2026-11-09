## The plan unit needed 5 plan-review rounds across two gates before it converged
- **category:** optimization
- **evidence:** round artifacts listed per root: `harness-runs/architecture_reviews/fix_untrusted_input_framing_subagents/` holds `review_0.md`, `review_1.md`, `review_2.md` (3 rounds); `harness-runs/task_plan_reviews/fix_untrusted_input_framing_subagents/` holds `review_0.md`, `review_1.md` (2 rounds); `harness-runs/business_parity_reviews/fix_untrusted_input_framing_subagents/` does not exist (`phases.parity` is `false`). Total 5 rounds for the plan unit. The pre-park session hit the planning walker's 5-revision cap (`reason: cap`, open gate `plan_review`); this resumed session ran one more revision, and both gates passed with no file written. The net-new vs re-raised split is not measurable: the findings in these files carry no headings below the severity sections, so a headings-only read cannot match findings across rounds.
- **cost this run:** one clarification park and one resume before implementation could start.

## Reviewers were handed a `diff_base` whose local ref does not exist in the run copy
- **category:** agent-contract
- **evidence:** the Phase A2 `architecture-reviewer` and the Phase B `branch-reviewer` dispatch blocks carry `diff_base: dev` / the default branch by name; the `branch-reviewer` return said "The default branch `dev` doesn't exist in this run copy, so I diffed against `origin/dev...HEAD`", and the `skeptic-reviewer` return said "`dev` does not exist in this run copy, so the diff base was `origin/dev`".
- **cost this run:** none observed — both reviewers fell back on their own; the fallback is each reviewer's improvisation rather than the dispatch's contract.
- **hypothesis:** the run copy is cut from `origin/dev` and never gets a local `dev` ref, so every branch-level reviewer dispatched with a bare branch name meets the same gap.

## Three implementer dispatches piped a test run's output, against the conventions' single-file test rule
- **category:** agent-contract
- **evidence:** self-reported in `layer-implementer` returns this session: Phase A Task 8 ("One of my runs of the new test piped its output through `tail`"), Phase C Item 2 / code-review Finding 6 and Phase C Item 4 / code-review Finding 1 (each "I piped that run's output through `grep` … which the conventions forbid"). The rule is `.claude/context/conventions.md` → the single-file test command bullet ("Never prefix it with a `cd`, pipe or redirect its output").
- **cost this run:** none — each implementer reported the counts and exit status from the run; one reran unpiped.

## One implementer reported no tree guard selected for a change its configured globs cover
- **category:** silent-failure
- **evidence:** the Phase A Task 4 `layer-implementer` return said "this task wrote none. No tree guard was selected." Its changed paths, per commit 2883c4ba, are five files under `plugin/agents/`, which match the `covers` globs `plugin/**/*.md` and `**/*.md` of two `treeGuards` entries in `harness.config.json`. Every other Phase A plugin-layer implementer this session ran those two guards.
- **cost this run:** Task 4's change went to commit without its tree guards run; the Phase G round-1 gate run later passed on the whole tree.
