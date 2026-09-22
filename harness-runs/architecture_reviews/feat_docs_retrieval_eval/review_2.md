# Architecture review — iteration 2

Reviewed: `harness-runs/story_plans/feat_docs_retrieval_eval_story_plan.md` `## Context` plus all fourteen
`task_<N>_plan.md` files, against `.claude/context/conventions.md`, `.claude/context/cli.md`,
`.claude/context/plugin.md` and `harness-runs/lessons.md`.

**Iteration 1's four Must Fixes are resolved.** Finding 1 (the copied `layers[]` list) is settled in
`task_3_plan.md`'s `self-docs` bullet — the list is read out of the `harness.config.json` at `--repo` and
only `docs: { root }` is overridden, with a by-name refusal instead of a fallback list — and the story
index, `task_4_plan.md`'s provenance bullet, `task_10_plan.md`'s opening bullet and `task_13_plan.md`'s
README bullet all describe that design now. Finding 2 (the second arm list) is settled by `arms.mjs`'s
single declared `ARMS` table built off `SEARCH_MODES`, with `args.mjs`, `check-floor.mjs`, `floor.json`,
`results.mjs` and `metrics.mjs` all repointed at it and the `=== 'E'` branch gone from `metrics.mjs`.
Finding 3 (the retyped environment-variable names) is settled through `RETRIEVAL_STUB_ENV` and
`RETRIEVAL_LOG_ENV` in Tasks 3, 4 and 7, checks and printed messages alike, with greps to prove it.
Finding 4 (the floor policy in three places) is settled by making `docs/retrieval-eval.md`'s
regression-floor section the single record, with `floor.json`'s `see` field and §5's gate 11 paragraph
reduced to pointers. Should Fix 7 (stray tool-call markup) is also gone.

The story index carries no `## Rejected findings` section, so nothing was closed by rebuttal.

Layer placement remains sound: every `evals/`, `docs/`, `scripts/` and root-prose target is `general` and
tagged `general`; `cli/test/docs-retrieval-store.test.mjs` (Task 1) and `cli/src/retrieval/search.ts`
(Task 5) are `cli` and tagged `cli`; no task spans two layers and no task touches `plugin/`.

Two findings below. Both are the same shape as finding 1 and finding 4 of the last round — a single source
gaining a second copy, and a responsibility gaining a second owner — at two sites the previous rounds did
not reach.

## Must Fix

1. **The query-log fixture composes the `layers[]` list by hand, which is the copy finding 1 removed from
   `corpora.mjs`** — offending file: `task_7_plan.md` (the first Work bullet). Rule source:
   `cli/src/retrieval/corpus.ts`'s module header, binding through `.claude/context/cli.md` →
   `## Naming and file layout` (*"Every file under `cli/src/` opens with a module header stating what it
   owns… here it is also how a reviewer finds the rule a change may be breaking"*), plus
   `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`
   (*"Nothing caches it and nothing mirrors it"*) and `## Registries and dispatch tables`
   (*"`harness.config.json` → `layers` routes a changed path to the layer that owns it"*, a single source).

   Task 7's fixture bullet builds the throwaway repository from *"a copy of this repository's `docs/*.md`
   and of the three conventions documents `layers[]` names, and a `harness.config.json` carrying … `layers[]`
   entries pointing at the copied conventions paths — the same corpus `corpusConfig`'s `self-docs`
   composes."* The *"three"* is this repository's current layer count frozen into a committed general-layer
   `.mjs` module that no compiler checks, and the `layers[]` entries the fixture's configuration carries are
   composed in `query-log-pass.mjs` rather than derived. Add a fourth layer to `harness.config.json` and the
   `self-docs` corpus grows while the query-log pass's fixture silently does not — so the pass stops
   measuring the corpus it says it measures, with no gate failing.

   This is not the `fixture-catalog` case the last round explicitly allowed. `fixture-catalog`'s config has
   **no** `layers` entries and mirrors nothing; this fixture exists precisely to mirror `self-docs`, which
   is what makes its hand-composed list a copy. The module already imports `corpusConfig` (its Depends-on
   paragraph says so), so the resolved config is in hand.

   **Fix:** in `task_7_plan.md`'s first Work bullet, require the fixture to be built **from the resolved
   `self-docs` config** — call `corpusConfig({ repoRoot, corpus: 'self-docs' })`, copy exactly the files
   that config's `docs.root` and `layers[].conventions` name, and write the fixture's `harness.config.json`
   `layers[]` by mapping those same entries onto their copied paths. Say in the bullet that no layer count
   and no conventions path is typed into this module, and that `phases.docs: true` plus
   `docs: { root, retrieval: true }` are the only values the fixture adds — they are what `docs serve`'s
   `retrievalApplies` gate needs and are the fixture's own, not a mirror of anything. Drop the words *"the
   three conventions documents"* from the bullet. Add a verification line beside the existing
   `git grep … AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_` one: the fixture's file count equals the corpus file
   count `corpusConfig` resolves, so the two cannot drift.

2. **Arm A's results row has two owners: `results.mjs` generates it and Task 11's procedure hand-edits it,
   inside the region `results.mjs` declares its own** — offending files: `task_11_plan.md` (the last Work
   bullet) and `task_3_plan.md` / `task_10_plan.md`, which carry a `--transcript <path>` flag no task gives
   a consumer. Rule source: `.claude/context/conventions.md` → `### Where a new responsibility goes` —
   *"A responsibility that already has a home does not get a second one"* and its *"Before adding a copy of
   anything, grep for it"* paragraph — with `### The order files are created, so a half-built feature is
   still coherent` (contract before consumer).

   `task_4_plan.md` makes `results.mjs` the single writer of everything between
   `<!-- eval:generated:start -->` and `<!-- eval:generated:end -->`: it generates the per-corpus table by
   walking `arms.mjs`'s table, writes arm A's row with every metric cell `—` and its cost cell reading
   `awaiting hand run`, and the file carries *"a one-line warning that the marked region is generated and
   hand edits inside it are lost."* `task_11_plan.md`'s last Work bullet then tells the operator to *"fill
   arm A's row in `docs/retrieval-eval-results.md`'s table — replacing the `—` cells and the `awaiting hand
   run` cost cell"*. That row is inside the generated region, so the procedure documents an edit the next
   `--out` run destroys, and Task 4's own verification (*"hand-edit a word below the end marker, re-run, and
   confirm the edit survives"*) is scoped below the marker precisely because an edit above it does not.

   The seam for doing this properly is already in the plan and is currently orphaned: `task_3_plan.md`'s
   `args.mjs` bullet declares `--transcript <path>`, `task_10_plan.md` documents it in the argument surface,
   and `task_6_plan.md`'s `score-transcript.mjs` produces arm A records in exactly the record shape
   `scoreArm` consumes — but no task says which module reads `--transcript` or what happens to the records
   it scores. One flag with no consumer and one row with two writers are the same gap seen from both ends.

   **Fix:** give the arm A row one owner, the renderer. In `task_4_plan.md`, add to the `run.mjs` bullet
   that when `--transcript <path>` is given, `runEval` loads it through `scoreTranscript` (Task 6's export)
   and passes the resulting arm A record set into the same scoring and rendering path as every other arm, so
   `results.mjs` renders arm A's row from data in the one walk it already does; with no `--transcript`, the
   row renders `—` and `awaiting hand run` as it does today. State in `task_6_plan.md`'s
   `score-transcript.mjs` bullet that its output is the runner's input rather than a stand-alone report, and
   name `run.mjs` as the consumer, so the contract-before-consumer order is visible (Task 6 ships after
   Task 4, so the flag is declared before its reader lands — say that, as Task 9 and Task 10 already say it
   for the floor pointer). In `task_11_plan.md`'s last Work bullet, replace the hand edit with the
   re-run: score each repetition, then re-run the eval with `--out docs/retrieval-eval-results.md
   --transcript <path>` through the route the document names, and state that the row is regenerated and never
   hand-edited because the marked region has one writer. Leave the **spread** in
   `## Arm A — awaiting a hand run`, below the end marker, which is hand-written territory and is where the
   heading rename belongs. Repoint `task_10_plan.md`'s argument-surface bullet so `--transcript` is
   documented with its purpose rather than as a bare flag.

## Should Fix

Non-blocking.

3. **A third `${HARNESS_AGENT_CLI:-claude}` read site, outside the inventory that claims to hold them all.**
   Raised at iteration 0 and again at iteration 1, addressed in neither and carrying no recorded rebuttal —
   re-raised unchanged. `task_6_plan.md`'s `run-arm-a.sh` bullet cites `ARCHITECTURE.md` correctly, but that
   document's §4 states the variable is *"read in two shipped scripts"* and names both, and §5 derives its
   inventory with a grep scoped to `cli/templates/scripts/ cli/src/`. A read site under `evals/` is outside
   that grep, so a re-derivation will not see it and the row's "two" goes stale silently. Either add a line
   to Task 6 (or Task 13) recording the third site where §5's inventory is, or require `run-arm-a.sh`'s own
   header to state that it is a hand-run reader outside the shipped set that inventory counts.

4. **"No agent can invoke this file, by construction" overstates the guard.** Raised at iterations 0 and 1,
   unaddressed and unrebutted; the sentence still stands verbatim in `task_6_plan.md`'s **Why nothing here
   runs** paragraph, and `task_13_plan.md`'s README bullet now repeats the claim (*"which sits outside the
   configured scripts directory precisely so that no agent can invoke it"*), so the overstatement has gained
   a second home. The script-allowlist guard is **allow-only**: it emits `allow` or nothing, and withholding
   a permit defers to the adopter's permission profile rather than refusing
   (`.claude/context/conventions.md` → `## Output, logging and errors`: *"Failing closed means emitting
   nothing, which defers to the adopter's permission profile and costs a prompt rather than a false
   permit"*). Task 6's own text elsewhere concedes the `scratch-run.sh` route is *"technically open"*.
   Reword both sites to what the guard actually buys — no agent obtains an automatic permit for it — so a
   later reader does not treat the fence as absolute and drop the prose prohibition doing the real work.
   `evals/plan-shape/scaffold.sh` already sits outside `scriptsDir` on the same terms, so the shape is
   precedented and only the claim about it is too strong.

## Nice to Have

5. **The module-header requirement is still stated for four of thirteen new `evals/` modules.**
   `task_3_plan.md`'s last Work bullet requires a header on `corpora.mjs`, `queries.mjs`, `index-build.mjs`
   and `args.mjs`. Tasks 4, 6, 7, 8 and 9 add `arms.mjs`, `metrics.mjs`, `results.mjs`, `run.mjs`,
   `score-transcript.mjs`, `query-log-pass.mjs`, `cold-build.mjs` and `check-floor.mjs` with no such
   requirement. No conventions document binds a general-layer module to a header — the row in
   `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` is scoped to `cli/src/`
   — so this is consistency rather than a rule. `task_13_plan.md`'s `evals/docs-retrieval/README.md` bullet
   now carries the module map and the two single sources, which is one reasonable place to settle it; the
   other is a line in Task 3's header bullet extending the requirement to every module the branch adds.
   Findings 1 and 2 above both leave a rule that wants recording in a header (`arms.mjs`'s table, and
   `run.mjs`'s ownership of the arm A row), which is a second reason to settle it.
