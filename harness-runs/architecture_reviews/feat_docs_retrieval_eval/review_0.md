# Architecture review — iteration 0

Reviewed: `harness-runs/story_plans/feat_docs_retrieval_eval_story_plan.md` `## Context` plus all thirteen
`task_<N>_plan.md` files, against `.claude/context/conventions.md`, `.claude/context/cli.md`,
`.claude/context/plugin.md` and `harness-runs/lessons.md`.

Layer placement is otherwise sound: every `evals/`, `docs/`, `scripts/` and root-prose target belongs to
`general` and is tagged `general`; `cli/test/docs-retrieval-store.test.mjs` (Task 1) and
`cli/src/retrieval/search.ts` (Task 5) belong to `cli` and are tagged `cli`; no task touches `plugin/`, and
nothing imports across the `cli`↔`plugin` boundary the conventions document forbids. The runner-owned-config
design is licensed by a real citation — `cli/src/retrieval/corpus.ts`'s header carries *"The gate
(`retrievalApplies` in `cli/src/config/model.ts`) is its callers' to check, not this module's"* verbatim —
and Task 9's claim that `scripts/run-gates.sh` is hand-written and outside the `init --force` set is
confirmed by that file's own header and by `scripts/publish-main.sh`.

## Must Fix

1. **The threshold's measured record is placed in `cli/src/`, not in `docs/`** — offending files:
   `task_5_plan.md` (third Work bullet and the **Where this task stops** paragraph) and `task_12_plan.md`
   (the **Depends on** paragraph and the fourth Work bullet). Rule source:
   `.claude/context/conventions.md` → `### Where a new responsibility goes`, the table row
   *"a measured fact or a decision of record | `docs/`, **and nowhere else**"*.

   Task 5 requires `ABSTAIN_SCORE_THRESHOLD`'s doc comment to carry the value, the date, the host, both
   corpora by name and by chunk count, both model ids, the highest negative and lowest positive best-scores
   and the positives the choice costs — a measured fact in full — and its **Where this task stops** paragraph
   makes that placement deliberate: *"That makes the doc comment the primary statement rather than a summary
   of one, so write it to be quoted."* Task 12 then confirms the inversion: *"that doc comment is the record
   this task cites and condenses, not a second derivation of the value."* Meanwhile Task 12's fourth Work
   bullet fills `docs/retrieval-eval-results.md` → `## Threshold calibration` with the *same* set of facts.
   The result is two owners of one measured fact, with the primary one sited in application source that the
   conventions document sends to `docs/` and nowhere else. This is not the existing precedent in that file:
   `search.ts`'s current comment carries one stub figure and a forward pointer, not a calibration record.

   **Fix:** make `docs/retrieval-eval-results.md` → `## Threshold calibration` the single record. Move the
   evidence bullet out of `task_12_plan.md` and into `task_5_plan.md` — that section already exists, empty,
   from Task 4, and Task 5 is the task that derives the value, so it is the one that can state it — and widen
   Task 5's **Where this task stops** paragraph and its `git diff --stat` verification line to permit that one
   `docs/` file alongside `cli/src/retrieval/search.ts`. Shrink the doc-comment bullet to what belongs with
   the code: the calibrated value, the stub-fixture bound that keeps `cli/test/docs-retrieval.test.mjs`'s
   abstention cases passing (a property of the code), and a pointer to that `## Threshold calibration`
   section. Delete *"the primary statement rather than a summary of one, so write it to be quoted"*. In
   `task_12_plan.md`, drop the fourth Work bullet and repoint its **Depends on** paragraph and its second
   Work bullet at `docs/retrieval-eval-results.md` → `## Threshold calibration` instead of at the doc comment.

2. **`evals/docs-retrieval/arm-a/prompt.md` lands on the eval runner's case-discovery pattern** — offending
   file: `task_6_plan.md` (the first **Targets** entry and its first Work bullet), with consequences in
   `task_11_plan.md` (**Depends on**) and `task_13_plan.md` (the module map bullet). Rule source:
   `.claude/context/conventions.md` → `## Not determined`, the evaluation-case entry, which names
   `evals/README.md` as the owner of what an eval case is (*"`evals/README.md` states that the `case.yaml`
   envelope is known from `--help` output alone and is provisional until measured against the real runner"*);
   that document states cases *"are discovered at `evals/**/case.yaml` or `evals/**/prompt.md` alongside
   `graders/*.md`"*.

   A `prompt.md` anywhere under `evals/` is, by that stated pattern, a case for the native eval runner. Arm
   A's prompt is not one — it is agent-task text for a hand-run measurement that, as Task 13 itself puts it,
   *"answers to no runner."* So the branch places a file inside another tenant's discovery surface, and
   nothing on the branch resolves it: Task 13's **The boundary this task must not cross** explicitly forbids
   changing the `plan-shape/` paragraphs, which is where the discovery pattern is stated, so the widened
   opening it does write leaves the collision unrecorded.

   **Fix:** rename the file out of the discovery glob in `task_6_plan.md` — `evals/docs-retrieval/arm-a/agent-task.md`
   is one spelling that carries the same meaning — and update the three places that name it: Task 6's
   **Targets** list and its first Work bullet (including *"Leave a single `{{query}}` token"*), Task 6's third
   verification bullet, Task 11's **Depends on** paragraph, and Task 13's `evals/docs-retrieval/README.md`
   module map. Add one line to Task 6's Work saying why the file is not named `prompt.md`, so the constraint
   is recorded where the next person to rename it will read it. (The alternative — leaving the name and
   widening Task 13's `evals/README.md` bullet to state the exclusion — creates a second statement of the
   discovery pattern and is the more expensive route; prefer the rename.)

## Should Fix

Non-blocking.

3. **A third `${HARNESS_AGENT_CLI:-claude}` read site, outside the inventory that claims to hold them all.**
   `task_6_plan.md`'s `run-arm-a.sh` bullet cites `ARCHITECTURE.md` correctly — the indirection is real and
   is recorded there as *"the one place the engine binary is chosen"* — but that document's §4 row states the
   variable is *"read in two shipped scripts"* and names both, and §5 derives its inventory with a grep
   scoped to `cli/templates/scripts/ cli/src/`. A read site under `evals/` is outside that grep, so it will
   not appear on a re-derivation and the row's "two" goes stale silently. No task on the branch updates
   `ARCHITECTURE.md`, and Task 12's verification pins `ROADMAP.md` unchanged without saying anything about
   this. Either add a line to Task 6 (or Task 13) recording the third site where §5's inventory is, or state
   in `run-arm-a.sh`'s own header that it is a hand-run reader outside the shipped set the inventory counts.

4. **"No agent can invoke this file, by construction" overstates the guard.** `task_6_plan.md`'s **Why
   nothing here runs** paragraph leans on `plugin/hooks/autonomous-script-allowlist-guard.sh` as a
   self-enforcing structural fence. The guard is real and does require every `.sh` token to resolve under
   `scriptsDir` — but it is **allow-only**: it emits `allow` or nothing, and withholding a permit defers to
   the adopter's permission profile rather than refusing
   (`.claude/context/conventions.md` → `## Output, logging and errors`: *"Failing closed means emitting
   nothing, which defers to the adopter's permission profile and costs a prompt rather than a false permit"*).
   Task 6's own text elsewhere concedes the `scratch-run.sh` route is *"technically open"*. Reword the claim
   to what the guard actually buys — no agent obtains an automatic permit for it — so a later reader does not
   treat the fence as absolute and drop the prose prohibition that is doing the real work.

## Nice to Have

5. **The module-header requirement is stated for four of twelve new `evals/` modules.** `task_3_plan.md`'s
   last Work bullet requires a header on `corpora.mjs`, `queries.mjs`, `index-build.mjs` and `args.mjs`, *"in
   the shape `cli/src` modules use"*. Tasks 4, 6, 7, 8 and 9 add `arms.mjs`, `metrics.mjs`, `results.mjs`,
   `run.mjs`, `score-transcript.mjs`, `query-log-pass.mjs`, `cold-build.mjs` and `check-floor.mjs` with no
   such requirement. No conventions document binds a general-layer module to a header — the row in
   `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` is scoped to
   `cli/src/` — so this is consistency rather than a rule. Settle it one way in Task 13's
   `evals/docs-retrieval/README.md` bullet, which already owns the module map.
