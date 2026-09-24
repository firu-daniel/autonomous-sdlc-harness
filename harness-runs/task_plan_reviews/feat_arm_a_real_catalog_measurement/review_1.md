# Task plan review — iteration 1

Both Must Fix findings from iteration 0 are resolved:
- Scope-register rows 51–57 now cover every site that derivation entry F reaches, and the watcher pair has one row per copy.
- `task_22_plan.md` / `task_23_plan.md` now target `docs/retrieval.md` → **(iv) Search.** (row 50).

I re-ran derivation entries A–G verbatim and walked entry H. Every site they reach is a row, so the closure invariant holds.

## Must Fix

1. **The threshold move and the floor re-record land in two different commits. That breaks the tree's same-commit re-record rule, and Task 22's own verification cannot pass in a case the plan expects** — `task_22_plan.md` and `task_23_plan.md`; the story index `## Context` also needs a note.
   - **Task 22 moves the constant and requires a green gate run.** Task 22 (`cli`) moves `ABSTAIN_SCORE_THRESHOLD` in `cli/src/retrieval/search.ts`. Its `**Verification:**` requires *"`bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0"*.
   - **`test.sh` runs gate 11.** `scripts/test.sh` runs `bash scripts/run-gates.sh "$@"`, and `run-gates.sh` runs gate 11, the `fixture-catalog` relevance floor in `evals/docs-retrieval/floor.json`. The arm E floors are `recallAt5` 0.61 and `mrr` 0.5.
   - **A small move can trip that floor.** One `fixture-catalog` positive is worth about 0.11 of recall@5. That is more than the floor's 0.05 margin. So a raised value that abstains on even one more fixture positive turns gate 11 red.
   - **The plan expects this case.** Task 23's last `**Work:**` bullet re-runs the tests after the move and re-records the arm E floors *"**in this same commit**"*. But that is Task 23's commit (`general`), which comes after Task 22's commit.
   - **The project rule forbids the split.** `docs/retrieval-eval.md` → `## The regression floor` → **The same-commit re-record rule** says: *"A change that legitimately moves a floor re-records it in the same commit as the change that moved it … A floor lowered in a commit of its own, or lowered to make a red gate green, is the failure this gate exists to catch."*
   - **The result.** In exactly the case the prompt's item 5 foresees (*"`floor.json` is regenerated only if the move changes a floored figure"*), one of two things happens:
     - Task 22's verification fails and the loop escalates; or
     - the implementer commits a red gate, and the floor is then lowered in a separate later commit. That is the pattern the rule names as a failure.

   The single-layer rule means one commit cannot hold both `search.ts` and `floor.json`. So the plan has to settle this in writing. It must not leave the conflict for an implementer to find.

   **Fix:** Do both of the following.
   - **(a) In `task_22_plan.md`, check the floor before editing the constant.** Add a step that runs first. It computes the arm E recall@5 and MRR that `fixture-catalog` would have at the new value. Use the regenerated `fixture-catalog` block's per-query `bestRerankScore`, `abstained` and `rank`. `bestRerankScore` does not depend on the threshold, so no re-run is needed. Compare the result with `floor.json`'s arm E floors.
   - **(b) Plan the case where a floored figure moves.** Pick one of the two routes below, write it into Task 22's `**Verification:**` in place of the unconditional "exit 0", and record it in the story index `## Context`:
     - **Route 1:** name the exact expected gate 11 `FAIL` line as the only permitted failure. State that Task 23 is the immediately following commit that re-records the floor. Disclose in `### What the move cost` (Task 23) that the re-record is one commit behind the move because a cross-layer change cannot be one commit. That disclosure is a finding about the re-record rule, not a quiet workaround.
     - **Route 2:** have Task 22 return a `blocker:` naming the conflict, so the operator decides.

## Should Fix

1. **Acceptance 14 has no carrier.**
   - The story index's `Manual setup required:` list says *"the closing branch ready for review summary must end with this reminder"* (task prompt `## Acceptance` 14, checklist row 9).
   - No per-task file delivers it.
   - The flow that writes that summary, `plugin/instructions/plan_orchestration_instructions_core.md` → `### D.2 Done summary`, has a fixed bullet list. It reads neither the story index's `Manual setup required:` list nor the task prompt's acceptance list.
   - As written, the reminder depends on the orchestrator happening to add it.
   - Fix: say in the story index that no task can produce this line, and name a route that actually reaches the Done summary. If no such route exists, record that as an improvement observation instead of claiming the requirement is met.

2. **Carried from iteration 0, and neither addressed nor recorded under `## Rejected findings` — register row 11, the generated provenance sentence.**
   - `evals/docs-retrieval/results.mjs` → `provenanceSection` hardcodes *"The pre-calibration per-query distributions the value was chosen from are quoted in `## Threshold calibration` below, taken at the earlier snapshot…"*.
   - Task 23 replaces `### The pre-calibration distributions, quoted` with the observed distributions.
   - After that, all three regenerated blocks carry a sentence citing a table that no longer exists.
   - Row 11's reason (*"regenerated by Tasks 18, 21 and 23 through the one writer"*) does not fix this, because regenerating re-emits the same hardcoded text.
   - Fix: give row 11 an owning task that edits the sentence in `results.mjs` (the `general` layer) before the blocks are regenerated. Otherwise, keep a heading of that name in Task 23's rewrite.

3. **Carried from iteration 0 — `task_10_plan.md`, `### The tool set, and the network`.**
   - That subsection is still not among Task 10's targets.
   - After Task 9 adds `--strict-mcp-config` and `toolCalls`, it still says the withheld web tools are *"the whole of it on the tool side"*.
   - It also still has the operator confirm by eye that no web tool call appears, although `toolCalls` now records that.

4. **Carried from iteration 0 — `task_21_plan.md`.**
   - The second `**Work:**` bullet may edit `evals/docs-retrieval/queries/self-docs.jsonl` (*"fix such a label's `ref` alone"*).
   - `### Targets` does not list that file.
   - Either list it as a conditional target, or make a refusing label a stop to report.

## Nice to Have

1. `task_18_plan.md` `**Verification:**` still says *"every changed line lies between `<!-- eval:corpus:gate10-catalog:start -->` and its end marker"*. `rewriteGeneratedRegion` appends a new block after `region.trimEnd()` plus a blank-line separator, so a separator line outside the new markers can change. Suggested wording: "inside the generated region, and outside the two existing blocks".
2. `task_17_plan.md` `**Verification:**` says the redacted transcripts' arm A records are *"identical to those scored from the unredacted scratch copy"*. A redacted ref changes the record's `hits[].ref`. Only the scores (rank, recall, MRR) stay the same, so assert on those.
3. `task_3_plan.md` `**Verification:**` requires Task 3's commit to come before *"any `bestRerankScore` in `docs/retrieval-eval-results.md`"*. But Task 3's own method subsection writes that identifier into the file. Narrow it to "any recorded `bestRerankScore` figure".
