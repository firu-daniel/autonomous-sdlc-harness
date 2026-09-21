# Architecture review — iteration 4

Reviewed: `harness-runs/story_plans/feat_docs_retrieval_eval_story_plan.md` `## Context`, its
`## Phase 2 Readiness — Ordered Fix List` and its `## Rejected findings`, plus all fourteen
`task_<N>_plan.md` files, against `.claude/context/conventions.md`, `.claude/context/cli.md`,
`.claude/context/plugin.md`, `.claude/CLAUDE.md` and `harness-runs/lessons.md`.

**Iteration 3's two Must Fixes are resolved.**

- Finding 1 (two prose homes for the query-set format) is settled in both directions.
  `task_2_plan.md`'s last Work bullet now reduces `evals/docs-retrieval/queries/README.md` to the
  directory contract alone and says so explicitly — *"The record format has one home and it is not this
  README"*, with no field list, no grade scale and no restatement of the empty-`labels` rule, plus the
  unresolved-for-one-commit pointer and the heading hand-off in the commit body. `task_10_plan.md`'s
  third Work bullet takes the format as **the** one home, keeps the field list and its interpretation
  together, and its verification reads the queries README back and closes a mismatch by renaming its own
  heading rather than editing Task 2's file.
- Finding 2 (three answers to where the calibrated threshold's figures live) is settled on Task 14's
  answer. `task_12_plan.md`'s `## Still open` bullet now carries the value and a pointer alone, with
  *"No corpus name, no chunk count, no score-distribution figure, no host, date or model id goes into
  `docs/retrieval.md`"*; the §11 bullet's premise is corrected to name
  `docs/retrieval-eval-results.md` → `## Threshold calibration` as the record's home; its `Depends on`
  paragraph states the same; and the read-back verification I asked for is present.

**The recorded rejections hold.** The story index's new `## Rejected findings` section records Should
Fix 3, Should Fix 4, Should Fix 5 and Nice to Have 6 as not applied because the revision round was
scoped to Must Fix items. I tested each reason against the artifacts: all four are non-blocking by their
own grading, all four are recorded with the observation accepted rather than denied, and each names the
orchestrator as the party to schedule it. They are closed and are not re-raised here.

**Layer placement remains sound.** Every `evals/`, `docs/`, `scripts/`, `llms.txt` and root-prose target
is `general` and tagged `general`; `cli/test/docs-retrieval-store.test.mjs` (Task 1) and
`cli/src/retrieval/search.ts` (Task 5) are `cli` and tagged `cli`; no task spans two layers and no task
touches `plugin/`. I re-confirmed Task 9's `scripts/run-gates.sh` edit: that file exists under
`scripts/` and has no counterpart in `cli/templates/scripts/`, so it is hand-written, outside the set
`init --force` regenerates, and a `general`-layer target rather than a `cli/templates/` one. Task 3's
`--repo` default via a bare `git rev-parse --show-toplevel` is the form `.claude/CLAUDE.md`'s
checkout-root rule requires, and `cli/src/core/git.ts`'s monopoly is stated package-scoped
(*"anywhere in the package"*), so an `evals/` module resolving its own root is outside it.

One finding below. It is the same single-home shape the last four rounds have been converging on, at the
one remaining site no round has reached — and the two files involved are already adjacent in ship order,
so the fix is a pointer rather than a restructure.

## Must Fix

1. **The execution-route rule gets a second committed prose home in
   `evals/docs-retrieval/README.md`** — offending file: `task_13_plan.md` (second Work bullet). Rule
   source: `.claude/context/conventions.md` → `### Where a new responsibility goes` — *"A responsibility
   that already has a home does not get a second one"*, with its *"Before adding a copy of anything, grep
   for it"* paragraph and the worked cost in `cli/src/core/repoPaths.ts`'s header.

   `task_10_plan.md`'s second Work bullet gives `docs/retrieval-eval.md` — the operator-facing document,
   whose own opening bullet declares that it *"owns the procedure, the metric definitions and the
   decision rule"* — the statement of how the eval is executed, listing among what that section covers
   *"the two permitted execution routes and why a bare interpreter invocation stalls an unattended run"*.
   `task_13_plan.md`'s second Work bullet then requires `evals/docs-retrieval/README.md` to carry *"the
   two permitted execution routes and why a bare interpreter invocation stalls an unattended run"* — the
   same clause, word for word, in a second committed file.

   That rule is not a static fact about this directory: it is a consequence of what the permission
   profile grants, and the story index's own `## Context` already treats it as load-bearing and
   changeable (*"no entry is added to that profile on this branch"*). Add a third route later, or change
   which wrapper is allow-listed, and one file says one thing and the other says another, with nothing
   failing. This is the same defect the round-3 finding removed from `evals/docs-retrieval/queries/README.md`,
   reappearing one directory README over: Task 13's bullet shows the boundary was thought about — it
   already says *"Do not restate the metric definitions or the decision rule — they have a home and this
   README points at it"*, and *"Do not restate the discovery pattern itself; `evals/README.md` owns it"* —
   but it draws the line short of the execution routes and restates them.

   The ordering makes this free: `docs/retrieval-eval.md` is Task 10, readiness entry 11, and Task 13 is
   entry 14, so unlike the Task 2 → Task 10 hand-off the pointer resolves the moment it is written.

   **Fix:** in `task_13_plan.md`'s second Work bullet, strike the clause *"the two permitted execution
   routes and why a bare interpreter invocation stalls an unattended run"* and replace it with a pointer:
   the README names the section of `docs/retrieval-eval.md` that states how the eval is run and states
   none of it itself — no route named, no reason given — cited by heading, the way that same bullet
   already points at `docs/retrieval-eval-results.md` for the numbers and at `docs/retrieval-eval.md` for
   the procedure. Take the heading from `docs/retrieval-eval.md` as Task 10 committed it, which is
   readable by then rather than handed over in a commit body. Add to `task_13_plan.md`'s verification the
   read-back its siblings already carry: `evals/docs-retrieval/README.md` names no execution route and no
   wrapper script of its own except `arm-a/run-arm-a.sh`, which it names as the one thing never run from
   there, and its citation of `docs/retrieval-eval.md` resolves to a heading that exists.

## Should Fix

None new. Iteration 3's Should Fix 3, Should Fix 4 and Should Fix 5 are recorded in the story index's
`## Rejected findings` with reasons that hold; they are the orchestrator's to schedule and are not
re-raised.

## Nice to Have

None new. Iteration 3's Nice to Have 6 is recorded as rejected with a reason that holds — no conventions
document binds a `general`-layer module to a header — and is not re-raised.
