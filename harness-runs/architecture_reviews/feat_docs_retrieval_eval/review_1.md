# Architecture review — iteration 1

Reviewed: `harness-runs/story_plans/feat_docs_retrieval_eval_story_plan.md` `## Context` plus all fourteen
`task_<N>_plan.md` files, against `.claude/context/conventions.md`, `.claude/context/cli.md`,
`.claude/context/plugin.md` and `harness-runs/lessons.md`.

**Iteration 0's two Must Fixes are resolved.** Finding 1 (the measured record in `cli/src/`) is settled by
the Task 5 / Task 14 split — Task 5 is now `cli`-only with a doc comment carrying value, stub bound and a
pointer, and `task_14_plan.md` owns `docs/retrieval-eval-results.md` → `## Threshold calibration` as the
single record. Finding 2 (the case-discovery glob) is settled by the rename to
`evals/docs-retrieval/arm-a/agent-task.md`, recorded in Task 6, Task 11 and Task 13, with a
`git ls-files 'evals/**/prompt.md'` verification. The story index carries no `## Rejected findings`
section, so nothing was closed by rebuttal.

Layer placement itself remains sound: every `evals/`, `docs/`, `scripts/` and root-prose target belongs to
`general` and is tagged `general`; Task 1's `cli/test/docs-retrieval-store.test.mjs` and Task 5's
`cli/src/retrieval/search.ts` belong to `cli` and are tagged `cli`; no task touches `plugin/`; and Task 9's
claim that `scripts/run-gates.sh` is hand-written and outside the `init --force` set is confirmed — that
file's own header says so and `cli/templates/scripts/` carries no `run-gates.sh`. Task 1's stdout print
does not breach the `Reporter` monopoly: that rule's enumeration is of `cli/src` files, and
`cli/test/outer-loop-scripts.test.mjs` already names `console`.

The findings below are all of one kind, and it is the kind the runner-owned-config design makes easy to
miss: the runner imports the compiled retrieval modules, which is correct, but then **retypes four things
those modules already export as single sources** instead of importing them.

## Must Fix

1. **`corpora.mjs` copies the `layers[]` conventions list, which the module it imports forbids by name** —
   offending file: `task_3_plan.md` (the first Work bullet), with the same design stated in the story index
   (`harness-runs/story_plans/feat_docs_retrieval_eval_story_plan.md` → `## Context`, *"Where the work lands,
   and why"*). Rule source: `cli/src/retrieval/corpus.ts`'s module header, which
   `.claude/context/cli.md` → `## Naming and file layout` makes binding (*"Every file under `cli/src/` opens
   with a module header stating what it owns… here it is also how a reviewer finds the rule a change may be
   breaking"*), reinforced by `.claude/context/conventions.md` → `## Configuration is the source of truth,
   and it is read at run time` (*"Nothing caches it and nothing mirrors it: each consumer re-reads the file
   on each run"*) and `## Registries and dispatch tables` (*"`harness.config.json` → `layers` routes a
   changed path to the layer that owns it and to that layer's rules document"*, a single source).

   Task 3's first Work bullet has `corpusConfig` compose, for the built-in id `self-docs`, *"`docs.root`
   `docs` with the three `layers[]` conventions documents this repository's `harness.config.json` names."*
   That is a hand-maintained copy of this repository's `layers[]` list, frozen into a committed
   general-layer `.mjs` module that no compiler checks (`cli/tsconfig.json` includes `src/**/*.ts` only, and
   `evals/` is outside even that). Add a fourth layer to `harness.config.json` and the `self-docs` corpus
   silently stops covering it, with no gate failing — including gate 11, whose corpus is `fixture-catalog`.

   The module the runner drives states the prohibition in its own first sentence:

   > **The rule this module exists to enforce: the corpus is exactly every Markdown file under `docs.root`
   > plus every conventions document `layers[]` names — nothing else, and no copy of that list elsewhere.**
   > The gate (`retrievalApplies` in `cli/src/config/model.ts`) is its callers' to check, not this module's.

   The plan cites the **second** sentence as its licence, and that citation is real and does hold — it
   licenses the runner to bypass the `phases.docs` / `docs.retrieval` gate. It does not license the first
   sentence's prohibition, which is what composing the `layers[]` list by hand breaks. The two are
   separable: `retrievalApplies` reads `phases.docs` and `docs.retrieval` and nothing else, so the runner
   can read the real `harness.config.json` for `layers[]` and still own `docs` and `phases` outright.

   **Fix:** in `task_3_plan.md`'s first Work bullet, change the `self-docs` built-in so it **reads
   `layers[]` (and `stateDir`) out of the `harness.config.json` at the resolved `--repo` root** and
   overrides only `docs: { root }` — spelling out that the override is the whole of what the runner owns and
   that the layer list is never retyped. Keep `fixture-catalog` as it is: its config is a fixture with **no**
   `layers` entries and mirrors nothing. Keep the ad-hoc `--docs-root` / `--conventions` corpus as it is: an
   arbitrary checkout's conventions paths are an operator's argument, not a copy. Amend the same bullet's
   header requirement (the last Work bullet) so `corpora.mjs`'s header states both halves — that the runner
   owns the gate because `corpus.ts` says the gate is its caller's, **and** that it does not own `layers[]`
   because that same header forbids a copy of it. Update the story index's *"composing `docs.root` and the
   `layers[]` list itself"* clause in `## Context` to match, and Task 10's *"the runner **owns its own
   `HarnessConfig`**"* bullet so the operator document does not describe the superseded design.

2. **The arm set is a second list beside `SEARCH_MODES`, which already exists and is exported** — offending
   files: `task_3_plan.md` (the `args.mjs` Work bullet, `--arms <letters>` default `BCDE`), `task_4_plan.md`
   (the `arms.mjs` Work bullet and the five-arms paragraph) and `task_9_plan.md` (the `check-floor.mjs` Work
   bullet, `--arms BCDE`, and `floor.json`'s per-arm keys). Rule source:
   `.claude/context/conventions.md` → `## Registries and dispatch tables` (*"its analogue is the set of
   tables that route a name to an implementation, and each is a single source with no second list beside
   it"*) and `### Where a new responsibility goes` → *"A responsibility that already has a home does not get
   a second one"* with its *"Before adding a copy of anything, grep for it"* paragraph.

   `cli/src/retrieval/search.ts` already declares the set and its order:

   ```
   export type SearchMode = 'lexical' | 'vector' | 'fused' | 'fused-rerank';
   /** Every {@link SearchMode}, in the order a refusal lists them. */
   export const SEARCH_MODES: readonly SearchMode[] = ['lexical', 'vector', 'fused', 'fused-rerank'];
   ```

   Task 4 knows this — *"B–E are the four `SearchMode` values of `cli/dist/retrieval/search.js`"* — but no
   task derives anything from `SEARCH_MODES`, which the runner can import from the very module it already
   imports `searchDocs` from. Instead the set is retyped as the letters `BCDE` in `args.mjs`'s default, again
   in `check-floor.mjs`'s invocation, again as `floor.json`'s arm keys, with the letter→mode mapping living
   unnamed inside `arms.mjs` and the letters spelled once more in `results.mjs`'s table and in
   `metrics.mjs`'s *"arm E only"* branch. A fifth `SearchMode` is then a silent partial edit. The
   asymmetry is visible inside Task 3 itself, which mandates exactly this discipline one bullet earlier for
   the corpus ids: *"Export the built-in ids as one array so every message that lists them reads it."*

   **Fix:** add a bullet to `task_4_plan.md`'s `arms.mjs` Work item making that module the **single declared
   arm table** — one exported ordered array of `{ letter, mode }` built by pairing the letters onto
   `SEARCH_MODES` imported from `cli/dist/retrieval/search.js`, so a mode added there is a visible failure
   here rather than a missing row, plus the arm A entry which has no mode. Then repoint the copies at it: in
   `task_3_plan.md`'s `args.mjs` bullet, `--arms`'s default and its legal-letter refusal read that table
   rather than the literal `BCDE`; in `task_9_plan.md`, `check-floor.mjs`'s arm list and `floor.json`'s arm
   keys are validated against it, with an arm in `floor.json` that the table does not carry refused by name;
   in `task_4_plan.md`, `results.mjs`'s `Arm`/`Mode` columns and `metrics.mjs`'s abstention branch read the
   table rather than restating the letters. Add the table's line to `task_13_plan.md`'s module map.

3. **The two retrieval environment-variable names are retyped as literals, and both have owner constants** —
   offending files: `task_3_plan.md` (the `index-build.mjs` Work bullet and the third verification bullet),
   `task_4_plan.md` (the provenance Work bullet and the second verification bullet), `task_7_plan.md` (the
   logged-leg and unset-leg Work bullets and the fill bullet) and `task_8_plan.md` / `task_9_plan.md` where
   each names the stub variable in prose. Rule source: `.claude/context/conventions.md` →
   `## Configuration is the source of truth, and it is read at run time`, the bullet *"**An
   environment-variable name is a constant with an owner too**… each read through its constant and never
   retyped as a literal — **including in the message that names it to a reader**."*

   Both owners exist, are exported, and sit in modules these tasks already import:

   - `RETRIEVAL_STUB_ENV = 'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB'` (`cli/src/retrieval/models.ts`) — the
     same module Task 3 already imports `resolveModels`, `modelFilesPresent` and `retrievalModelCacheDir`
     from.
   - `RETRIEVAL_LOG_ENV = 'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG'` (`cli/src/retrieval/queryLog.ts`) — the
     same module Task 7 is already told to read the `QueryLogRecord` key list off, *"rather than from this
     file"*, which is this rule applied to the adjacent constant.

   This is not cosmetic here: Task 3's refusal message and Task 4's provenance block both **print the
   variable's name to a reader**, which the rule calls out explicitly, and the runner is the first consumer
   of these variables outside the package that owns them — so a rename becomes a silently wrong refusal
   message rather than a compile error.

   **Fix:** in `task_3_plan.md`'s `index-build.mjs` bullet, require the stub check and its refusal message to
   read the name through `RETRIEVAL_STUB_ENV` imported from `cli/dist/retrieval/models.js`, and say that the
   literal is never retyped — in the check or in the message. Apply the same to `task_4_plan.md`'s provenance
   bullet (*"that `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` was unset"* is a printed name) and to
   `task_7_plan.md`'s two leg bullets and its fill bullet, using `RETRIEVAL_LOG_ENV` from
   `cli/dist/retrieval/queryLog.js` for the log variable. Where a task plan names either variable in prose
   for a human reader (`task_8_plan.md`, `task_9_plan.md`, `task_10_plan.md`'s preconditions bullet), that is
   prose and stays; the rule binds the code and the messages it emits.

4. **The floor's margin and the re-record rule are written into three files with no stated owner** —
   offending files: `task_9_plan.md` (the `floor.json` Work bullet, the `docs/development.md` §5 Work bullet
   and the fourth Work bullet) and `task_10_plan.md` (the regression-floor bullet). Rule source:
   `.claude/context/conventions.md` → `### Where a new responsibility goes` — *"a measured fact or a decision
   of record | `docs/`, **and nowhere else**"* and *"A responsibility that already has a home does not get a
   second one."*

   Task 9's fourth Work bullet states the re-record rule *"in the §5 gate 11 paragraph and in `floor.json`'s
   comment field"*; its third Work bullet has §5's gate 11 paragraph also state *"what re-recording a floor
   requires"* and *"why only that corpus"*; and Task 10's bullet writes *"that a floor is re-recorded in the
   same commit as the change that legitimately moved it"* and *"that gate 11 enforces it on
   `fixture-catalog` only and why"* into `docs/retrieval-eval.md`. That is one decision of record in three
   places, and the first Work bullet adds a fourth statement — the margin and *"its reason"* — inside
   `floor.json`, a machine artifact outside `docs/`, explicitly *"rather than only in prose"*, which makes
   the duplication deliberate rather than incidental. No task says which of the three is the record, so the
   next person to move a floor has three to keep in step.

   This is the same split the plan already gets right one entry earlier, and the fix is to apply that
   pattern: Task 5 / Task 14 put the **value and a pointer** beside the code and the **record** in `docs/`.

   **Fix:** pick `docs/retrieval-eval.md`'s regression-floor section as the single record — Task 10 already
   owns it and it is the operator-facing home. In `task_9_plan.md`: shrink the `floor.json` bullet to the
   values, the `recordedAt` date and a **pointer** to that section, dropping *"and its reason … rather than
   only in prose"*; shrink the §5 gate 11 bullet to what the gate runs, what a failure means and a pointer,
   dropping the restatements of the margin rule and of *"why only that corpus"*; and delete the fourth Work
   bullet, folding its content into Task 10. In `task_10_plan.md`'s regression-floor bullet, add that this
   section is **the** record of the floor policy — the margin and its reason, why the corpus is
   `fixture-catalog` only, and the same-commit re-record rule — and that `floor.json` and
   `docs/development.md` §5 cite it. Widen that task's *"No number appears in this file that is not also in
   `docs/retrieval-eval-results.md`"* verification to admit the margin, which is a decision this section now
   owns and no other file records.

## Should Fix

Non-blocking. Both were raised at iteration 0, neither was addressed, and neither carries a recorded
rebuttal — re-raised unchanged rather than dropped.

5. **A third `${HARNESS_AGENT_CLI:-claude}` read site, outside the inventory that claims to hold them all.**
   `task_6_plan.md`'s `run-arm-a.sh` bullet cites `ARCHITECTURE.md` correctly — the indirection is real and
   is recorded there as the one place the engine binary is chosen — but §4 states the variable is *"read in
   two shipped scripts"* and names both, and §5 derives its inventory with a grep scoped to
   `cli/templates/scripts/ cli/src/`. A read site under `evals/` is outside that grep, so a re-derivation
   will not see it and the row's "two" goes stale silently. No task on the branch updates `ARCHITECTURE.md`,
   and Task 12's verification pins `ROADMAP.md` unchanged without saying anything about this. Either add a
   line to Task 6 (or Task 13) recording the third site where §5's inventory is, or state in
   `run-arm-a.sh`'s own header that it is a hand-run reader outside the shipped set the inventory counts.

6. **"No agent can invoke this file, by construction" overstates the guard.** `task_6_plan.md`'s **Why
   nothing here runs** paragraph leans on the script-allowlist guard as a self-enforcing structural fence.
   The guard is real and does require every `.sh` token to resolve under `scriptsDir` — but it is
   **allow-only**: it emits `allow` or nothing, and withholding a permit defers to the adopter's permission
   profile rather than refusing (`.claude/context/conventions.md` → `## Output, logging and errors`:
   *"Failing closed means emitting nothing, which defers to the adopter's permission profile and costs a
   prompt rather than a false permit"*). Task 6's own text elsewhere concedes the `scratch-run.sh` route is
   *"technically open"*. Reword the claim to what the guard actually buys — no agent obtains an automatic
   permit for it — so a later reader does not treat the fence as absolute and drop the prose prohibition
   that is doing the real work. Note also that `evals/plan-shape/scaffold.sh` already sits outside
   `scriptsDir` on the same terms, so the shape is precedented and only the claim about it is too strong.

7. **Stray tool-call markup at the end of the plan files.** Outside my lens and not an architecture finding,
   but it is visible corruption in the artifacts under review: the story index ends with literal
   `</content>` and `</invoke>` lines, and `task_1` through `task_13` each end with a literal `</content>`
   line (`task_14_plan.md` does not). Strip them.

## Nice to Have

8. **The module-header requirement is stated for four of thirteen new `evals/` modules.**
   `task_3_plan.md`'s last Work bullet requires a header on `corpora.mjs`, `queries.mjs`, `index-build.mjs`
   and `args.mjs`, *"in the shape `cli/src` modules use"*. Tasks 4, 6, 7, 8 and 9 add `arms.mjs`,
   `metrics.mjs`, `results.mjs`, `run.mjs`, `score-transcript.mjs`, `query-log-pass.mjs`, `cold-build.mjs`
   and `check-floor.mjs` with no such requirement. No conventions document binds a general-layer module to a
   header — the row in `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` is
   scoped to `cli/src/` — so this is consistency rather than a rule. Settle it one way in Task 13's
   `evals/docs-retrieval/README.md` bullet, which already owns the module map. Findings 1 and 2 both add a
   rule that wants recording in a header, which is a second reason to settle it.
