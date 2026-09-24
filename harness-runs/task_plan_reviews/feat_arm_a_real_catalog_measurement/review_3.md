# Task plan review — iteration 3

This is the resume revision after park 2. `task_15_plan.md` → `### Operator answer` quotes `answer_2.md` word for word. I checked it against the tree:

- All fourteen ids it names exist in `evals/docs-retrieval/queries/gate10-catalog.jsonl`.
- Every heading the new refs point at exists in the catalog: `features/inbox.md` → `### Data` / `### Presentation`; `features/saved-content.md` → `### Domain`; `features/community-live-streaming.md` → `### Cloud Functions`; `guide/api-plugin.md` → `` ### `configureServer` `` / `` ### `handleHotUpdate` ``; `product/product-decision-rate-card.md` → `### 3.4 Accompanying mechanics (relabeled honestly)`; `features/wallet-coins.md` → `## Business behaviour`.
- The count cross-check is right. The file holds 71 records, 29 negatives, 19 `near` and 10 `far`. After the corrections that becomes 69 records, 44 positives and 25 negatives (15 `near`, 10 `far`), which still meets the prompt's minimums.
- No code under `evals/`, `cli/src` or `scripts/` keys on the `q-g10-neg-` prefix, so the converted records can keep their ids.
- The two scratch scripts it names (`task12_preflight.mjs`, `task14_counts.mjs`) exist.

Index↔file correspondence is 1:1 (25 entries, 25 files). Every task has one layer, at most 20 points and at most 5 `**Work:**` bullets. Every `**Depends on:**` link points at an earlier task. Iteration 2's two Must Fix findings are resolved in `task_1_plan.md`, `task_6_plan.md`, `task_9_plan.md`, `task_16_plan.md` and `task_22_plan.md`.

I re-ran derivation entries A–G verbatim and walked entry H. The ledger has not changed since planning.

## Must Fix

1. **Scope register closure: entries B and C now reach five sites that are not rows.** Offending file: the story index (`feat_arm_a_real_catalog_measurement_story_plan.md`), `## Scope register`.
   Tasks 1, 2, 6, 9 and 11 have since created these files. Re-running the register's own commands now returns them, and none of them appears as a row:
   - `cli/test/docs-retrieval-rerank-score.test.mjs`: reached by B. It imports `ABSTAIN_SCORE_THRESHOLD` and builds its below- and above-threshold scores from the constant. Created by Task 1.
   - `evals/docs-retrieval/calibrate.mjs`: reached by B. Its header cites `## Threshold calibration` and states the method for `ABSTAIN_SCORE_THRESHOLD`. Created by Task 6.
   - `evals/docs-retrieval/arm-a/agent-task-search.md`: reached by C (it names `run-arm-a.sh` and `agent-task.md`). Created by Task 9.
   - `evals/docs-retrieval/arm-a/spread.mjs`: reached by C (it imports `score-transcript.mjs`). Created by Task 11.
   - `scripts/check-eval-artifacts.sh`: reached by C (its header names `run-arm-a.sh`). Created by Task 2.

   The closure invariant says *"every site each derivation entry above reaches appears as a row below"*. Task 25's last `**Work:**` bullet re-derives the register and would only report these sites, not register them. Two of them matter to the tasks still open. The test file is in scope for Task 22's threshold move. `calibrate.mjs` is the method that Tasks 22 and 23 run.

   **Fix:** In the story index's `## Scope register` table, add one row per site above, with `Copy` `—` and the entry that reaches it as `Evidence`. Give each a disposition and an owning task or reason. Suggested:
   - The test file is `no-change`: it derives its scores from the constant, so it holds at any value Task 22 sets. That is the reading `task_22_plan.md` → `**Verification:**` already relies on.
   - `calibrate.mjs`, `agent-task-search.md`, `spread.mjs` and `check-eval-artifacts.sh` are `no-change`: each was created by its task (name it), and no remaining task edits it.

   Optionally, add `B` to row 29's `Evidence`, because the README's `calibrate.mjs` row now matches entry B too.

## Should Fix

1. **`task_15_plan.md` → `### Targets` understates what the task now edits.** It still describes the `docs/retrieval-eval-results.md` target as *"its closing line replaced by the approval record"*. The approval-path `**Work:**` bullet now also rewrites the `**The counts**` table rows, the `**`1 / positives`**` line and the quoted `loaded … queries` line. Widen the target line to name those. The story index's ownership paragraph (*"Task 15 appends the operator's approval to it"*) should say the same.
2. **Carried: `task_10_plan.md`, `### The tool set, and the network`.** This was not addressed, and there is no `## Rejected findings` entry recording it as rejected. Task 10 is committed, so this now belongs to a later task's targets or to a recorded rejection.
3. **Carried: Acceptance 14 has no carrier.** The story index's `Manual setup required:` list still implies the closing summary will carry the row 9 reminder. Nothing routes that list into `### D.2 Done summary`.
4. **Carried: register row 11.** The provenance sentence hardcoded in `results.mjs` → `provenanceSection` cites a pre-calibration table that Task 23 replaces.
5. **Carried: `task_21_plan.md`.** It may edit `evals/docs-retrieval/queries/self-docs.jsonl`, but that file is not in its `### Targets`.

## Nice to Have

1. `task_18_plan.md` `**Verification:**`: say "inside the generated region, outside the two existing blocks" rather than "between the new block's markers". The writer appends a blank-line separator outside the new markers.
2. `task_17_plan.md` `**Verification:**`: compare rank, recall@5 and MRR rather than whole records, because a redacted ref changes `hits[].ref`.
