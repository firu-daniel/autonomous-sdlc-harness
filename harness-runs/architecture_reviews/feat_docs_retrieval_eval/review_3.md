# Architecture review — iteration 3

Reviewed: `harness-runs/story_plans/feat_docs_retrieval_eval_story_plan.md` `## Context` plus all fourteen
`task_<N>_plan.md` files, against `.claude/context/conventions.md`, `.claude/context/cli.md`,
`.claude/context/plugin.md` and `harness-runs/lessons.md`.

**Iteration 2's two Must Fixes are resolved.** Finding 1 (the hand-composed `layers[]` list in the
query-log fixture) is settled in `task_7_plan.md`'s first Work bullet — the fixture is built from
`corpusConfig({ repoRoot, corpus: 'self-docs' })`, the fixture's `layers[]` is mapped from those resolved
entries, the words *"the three conventions documents"* are gone, and the file-count equality assertion is
in the verification list. Finding 2 (two owners of arm A's results row) is settled: `task_4_plan.md`'s
`run.mjs` bullet makes it the one reader of `--transcript` and the one writer of that row,
`task_6_plan.md`'s `score-transcript.mjs` bullet names `run.mjs` as its consumer and states the
contract-before-consumer order, `task_11_plan.md`'s last Work bullet replaces the hand edit with the
re-run and states the row is never hand-edited, and `task_10_plan.md` documents `--transcript` by purpose.

The story index carries no `## Rejected findings` section, so nothing was closed by rebuttal, and Should
Fix 3, Should Fix 4 and Nice to Have 5 from the last round are unaddressed and unrebutted — re-raised
below at their original severity.

Layer placement itself remains sound. Every `evals/`, `docs/`, `scripts/`, `llms.txt` and root-prose
target is `general` and tagged `general`; `cli/test/docs-retrieval-store.test.mjs` (Task 1) and
`cli/src/retrieval/search.ts` (Task 5) are `cli` and tagged `cli`; no task spans two layers and no task
touches `plugin/`. I checked Task 9's justification for editing `scripts/run-gates.sh` in place — that
file is genuinely absent from `cli/templates/scripts/`, so it is hand-written and outside the set
`init --force` regenerates, and the edit is correctly a `general`-layer one rather than a
`cli/templates/` one.

Two findings below. Both are the single-source shape the last three rounds have been finding, at two
sites no round has reached: a shipped contract gaining a second prose home, and two task files naming
different owners for the same measured fact.

## Must Fix

1. **The query-set format has two shipped prose homes: `evals/docs-retrieval/queries/README.md` and
   `docs/retrieval-eval.md`** — offending files: `task_2_plan.md` (last Work bullet) and
   `task_10_plan.md` (third Work bullet). Rule source: `.claude/context/conventions.md` →
   `### Where a new responsibility goes` — *"A responsibility that already has a home does not get a
   second one"*, with its *"Before adding a copy of anything, grep for it"* paragraph and the worked cost
   in `cli/src/core/repoPaths.ts`'s header.

   `task_2_plan.md`'s last Work bullet commits `evals/docs-retrieval/queries/README.md` carrying *"the
   field list above, the grade scale, what an empty `labels` array means, and that the whole set must stay
   parseable as one JSON object per line."* `task_10_plan.md`'s third Work bullet commits, in
   `docs/retrieval-eval.md`, *"the record shape (`id`, `query`, `labels[]` of `{ ref, grade }`), that
   `ref` is `path#anchor` exactly as a search hit cites it, the `1`–`3` grade scale and what each grade
   means, that an **empty `labels` array is a negative query** and what it is for."* Three of the four
   items are the same statement in two committed files: the field list, the grade scale and the
   negative-query rule. Change the grade scale — add a grade, or move what `2` means — and one file says
   one thing and the other says another, with `queries.mjs`'s runtime refusal agreeing with whichever was
   remembered. Task 2's own bullet shows the boundary was thought about (*"Point at `docs/retrieval-eval.md`
   for what the metrics do with it"*), but it draws the line at metric semantics and leaves the format
   itself duplicated on both sides of it.

   Restating the shape inside the **plan** files is not the finding — `task_2_plan.md` and
   `task_3_plan.md` are required to be self-contained. The finding is the two committed prose artifacts.

   **Fix:** give the format one home and make the other a pointer. In `task_10_plan.md`'s third Work
   bullet, keep `docs/retrieval-eval.md` as that home — it already owns what `grade` and a negative query
   *mean to the metrics*, and splitting the field list from its interpretation is what created the copy.
   In `task_2_plan.md`'s last Work bullet, reduce `evals/docs-retrieval/queries/README.md` to the
   directory contract alone: what the directory holds, the `<corpus-id>.jsonl` file-naming rule, that the
   machine enforcement is Task 3's `queries.mjs`, and a pointer to `docs/retrieval-eval.md`'s format
   section — no field list, no grade scale, no restatement of the empty-`labels` rule. Say in that bullet
   that the pointer is unresolved from Task 2 until Task 10 lands, the same deliberate hand-off Task 9 and
   Task 10 already use for the floor pointer, and hand the exact heading over in Task 2's commit body.
   Add to `task_10_plan.md`'s verification that `evals/docs-retrieval/queries/README.md` states none of
   the format and cites this section by heading — the same read-back Task 10 already does for `floor.json`
   and §5.

2. **`task_12_plan.md` and `task_14_plan.md` name different owners for the calibrated threshold's
   figures, and `task_12_plan.md` names a third** — offending files: `task_12_plan.md` (second and third
   Work bullets) and `task_14_plan.md` (last Work bullet). Rule source: `.claude/context/conventions.md` →
   `### Where a new responsibility goes` — the table row *"a measured fact or a decision of record |
   `docs/`, **and nowhere else**"* and *"A responsibility that already has a home does not get a second
   one"*.

   `task_14_plan.md`'s last Work bullet makes `docs/retrieval-eval-results.md` → `## Threshold
   calibration` the one record and requires it to say so: *"this section is **the** record of the
   calibration and … the constant's doc comment, `docs/retrieval.md` and `docs/cli.md` §11 cite it rather
   than restating its figures."* `task_12_plan.md`'s second Work bullet then has `docs/retrieval.md`
   restate them: *"**Replace** the abstain-threshold entry with a condensation of the calibrated record:
   the value, the corpora and the distribution it sits between."* The distribution is a figure, and the
   corpora-and-distribution pair is precisely what Task 14's section exists to hold. `task_12_plan.md`'s
   third Work bullet then names a third owner outright — *"§11 is a surface reference and the number's
   home is `retrieval.md` and the constant"* — which contradicts Task 14's sentence in the same breath as
   it correctly keeps §11 clean.

   Three documents therefore ship with three different answers to *where does this number live*, and
   Task 12 ships after Task 14, so the later file is the one that will be written against the wrong
   premise. This is the same defect the Task 5 / Task 14 split was created to prevent, reappearing one
   document downstream: `task_5_plan.md` already says the constant's doc comment *"is not the record and
   is not a second copy of it"* and carries only the value, the stub bound and the pointer.

   **Fix:** settle it on `task_14_plan.md`'s answer, which is the one the conventions rule gives. In
   `task_12_plan.md`'s second Work bullet, replace *"the value, the corpora and the distribution it sits
   between"* with the value and a pointer alone: the `## Still open` entry states that the threshold is
   calibrated, names the value (which is the constant's, not a derived figure), names
   `cli/src/retrieval/search.ts` as where it lives and `docs/retrieval-eval-results.md` →
   `## Threshold calibration` as the record of how it was chosen and on what, and states what remains
   open — the real-catalog confirmation. No corpus name, no chunk count, no distribution figure in
   `docs/retrieval.md`. In `task_12_plan.md`'s third Work bullet, strike the clause *"the number's home is
   `retrieval.md` and the constant"* and replace it with the record's actual home, so §11's correct
   no-number-restated instruction rests on the right premise. Add to `task_12_plan.md`'s verification the
   read-back Task 14 implies: no distribution figure, corpus chunk count, host, date or model id appears
   in `docs/retrieval.md` or `docs/cli.md`, and both cite `## Threshold calibration` by heading.

## Should Fix

Non-blocking.

3. **A third `${HARNESS_AGENT_CLI:-claude}` read site, outside the inventory that claims to hold them
   all.** Raised at iterations 0, 1 and 2, addressed in none and carrying no recorded rebuttal —
   re-raised, and narrowed by what I verified this round. `task_6_plan.md`'s `run-arm-a.sh` bullet cites
   `ARCHITECTURE.md` correctly, and that document's §4 says the variable is *"read in two shipped
   scripts"* while §5 derives its inventory with a grep scoped to `cli/templates/scripts/ cli/src/`.
   `evals/` is outside both the package's `files` set and that grep, so §4's *"two shipped scripts"* stays
   literally true and the exposure is only that a re-derivation will not see the new site. Either add a
   line to Task 6 or Task 13 recording the third site where §5's inventory is, or require
   `run-arm-a.sh`'s own header to state that it is a hand-run reader outside the shipped set that
   inventory counts.

4. **"No agent can invoke this file, by construction" still overstates the guard.** Raised at iterations
   0, 1 and 2, unaddressed and unrebutted; the sentence stands verbatim in `task_6_plan.md`'s **Why
   nothing here runs** paragraph, and `task_13_plan.md`'s README bullet repeats the claim (*"which sits
   outside the configured scripts directory precisely so that no agent can invoke it"*). The
   script-allowlist guard is **allow-only**: it emits `allow` or nothing, and withholding a permit defers
   to the adopter's permission profile rather than refusing (`.claude/context/conventions.md` →
   `## Output, logging and errors`: *"Failing closed means emitting nothing, which defers to the adopter's
   permission profile and costs a prompt rather than a false permit"*). Task 6's own text elsewhere
   concedes the `scratch-run.sh` route is *"technically open"*. Reword both sites to what the guard
   actually buys — no agent obtains an automatic permit for it — so a later reader does not treat the
   fence as absolute and drop the prose prohibition doing the real work.

5. **The execution-route argument rests on a file absent from the worktree the work runs in.** New, and
   outside my lens, so it is noted rather than blocked. Tasks 3, 4, 6, 7, 8 and 9 all justify their
   execution route by citing `.claude/settings.autonomous.json` — *"matches no entry … and stalls"*,
   *"a `deny` floor entry"*, *"per that profile's own `_README`"*, *"add no entry"*. That file is listed
   in `.gitignore` (line 75), is untracked, and exists only at the main checkout's root; it is not present
   in this worktree. The citations are real — the artifact exists as this adoption's generated profile —
   but an implementer working in this worktree cannot open the file any of those six tasks reasons from,
   and the *"add no entry"* instructions have no local file to not-add-an-entry to. One sentence in the
   story index's `## Context` saying where that profile actually lives and that it is generated and
   untracked would close it for all six.

## Nice to Have

6. **The module-header requirement is still stated for four of thirteen new `evals/` modules.**
   `task_3_plan.md`'s last Work bullet requires a header on `corpora.mjs`, `queries.mjs`, `index-build.mjs`
   and `args.mjs`. Tasks 4, 6, 7, 8 and 9 add `arms.mjs`, `metrics.mjs`, `results.mjs`, `run.mjs`,
   `score-transcript.mjs`, `query-log-pass.mjs`, `cold-build.mjs` and `check-floor.mjs` with no such
   requirement — though `task_4_plan.md` and `task_6_plan.md` now both require a specific header
   *sentence* (`run.mjs`'s one-writer rule, `score-transcript.mjs`'s consumer statement) without requiring
   the header itself, which is the gap showing through. No conventions document binds a general-layer
   module to a header — the row in `.claude/context/conventions.md` → `## What accompanies a new unit of
   each kind` is scoped to `cli/src/` — so this is consistency rather than a rule. One line in Task 3's
   header bullet extending the requirement to every module the branch adds would settle it.
