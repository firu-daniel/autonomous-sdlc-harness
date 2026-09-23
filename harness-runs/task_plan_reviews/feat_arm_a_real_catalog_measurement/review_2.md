# Task plan review — iteration 2

The iteration 1 Must Fix is resolved. The story index `## Context` → **The threshold move and the floor re-record — settled as Route 1** records the route. `task_22_plan.md` adds the prediction bullet and the conditional verification, and `task_23_plan.md` carries the one-commit-behind disclosure.

I re-ran derivation entries A–G verbatim and walked entry H (`grep -nE '^## |^- \*\*' harness-runs/lessons.md`). Every site they reach is a register row, so the closure invariant holds. Index↔file correspondence is 1:1 (25 entries, 25 files). Every task has one layer, at most 20 points and at most 5 `**Work:**` bullets. Every `**Depends on:**` link points at an earlier task.

## Must Fix

1. **`bash scripts/test.sh` cannot exit 0 in this checkout, yet three tasks require it. Task 22's Route 1 branch would therefore always end in a `blocker:`** — `task_1_plan.md`, `task_6_plan.md`, `task_22_plan.md`.
   - **Why test.sh fails.** `scripts/test.sh` runs `bash scripts/run-gates.sh "$@"` and exits with its status. Gate `6a no machine paths` (`grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git`) is red in this checkout today. I ran the same grep with the literal home path and it prints hits in:
     - `.git`, the worktree's gitdir **file**, which `--exclude-dir=.git` does not exclude;
     - `harness-runs/task_prompts/chore_gate_10_real_catalog_measurement_task_prompt.md`;
     - four `harness-runs/improvement_observations/*.md` files;
     - one `harness-runs/architecture_reviews/…` file.
   - **The project and the plan already know this.** `docs/development.md` §5 → **"The `$HOME` half is a different matter, and self-adoption breaches it."** records `FAIL 6a` as a known, open conflict. This plan's own `task_2_plan.md` says *"`6a` is already red in this checkout by design"*.
   - **Where the plan requires exit 0 anyway:**
     - `task_1_plan.md` → `**Verification:**` says *"`bash scripts/typecheck.sh` and `bash scripts/test.sh` both exit 0"*.
     - `task_6_plan.md` → `**Verification:**` says *"`bash scripts/test.sh` exits 0"*.
     - `task_22_plan.md` → `**Verification:**`, in the no-shortfall branch, says *"exits 0"*.
   - **Route 1 cannot pass either.** In the shortfall branch, Task 22 requires that *"the closing summary names `11 docs-retrieval relevance floor` and no other gate"*, and that *"Any other failing gate … is a real failure — return a `blocker:`"*. `6a` will always also be in that summary. So the Route 1 path that iteration 1 settled parks the run every time, and the no-shortfall path fails its own verification.
   - **Fix:** In all three files, replace "exits 0" with the tree's standing reading: *"prints no failure that was not already failing before this task"*. That is the wording Tasks 2, 4, 23 and 25 already use, and what acceptance 13 asks for. Name `6a` as the known pre-existing failure, citing `docs/development.md` §5. In `task_22_plan.md`'s Route 1 branch, change *"names … and no other gate"* to *"names `11 docs-retrieval relevance floor` and no gate that was not already failing before this task"*. Keep the requirement that the gate 11 line matches the prediction exactly.

2. **Task 16's `--help` probe is a `.sh` file run through `scripts/scratch-run.sh`, and that wrapper refuses `.sh` by name** — `task_16_plan.md`, `**Work:**` bullet 2 (a).
   - **The plan's wording.** It says *"a script `harness-runs/scratch/agent-cli-help.sh` that runs the agent CLI … with `--help` and nothing else, via `bash scripts/scratch-run.sh`"*.
   - **What the wrapper actually accepts.** `scripts/scratch-run.sh` → `SCRATCH_INTERPRETERS='py:python3 js:node mjs:node cjs:node rb:ruby dart:dart php:php'`. The comment above it reads: *"THE ONE EXTENSION THIS TABLE OMITS ON PURPOSE IS `.sh` … A shell probe is refused by name here"*. So step (a) fails with `has no interpreter for extension 'sh'`.
   - **Why that blocks the park.** The task prompt requires the flag spellings to be verified before the park (*"Before parking, the run itself verifies the agent CLI's print-mode flag spellings against its own `--help`"*). As written, the implementer either cannot do it or has to improvise a route the plan does not name.
   - **The same gap in Task 9.** `task_9_plan.md` → `**Verification:**` runs *"`bash scripts/scratch-run.sh` on a scratch driver script"* and gives no extension. The stand-in that `HARNESS_AGENT_CLI` points at is executed by `run-arm-a.sh` itself, so it may be a shell script. The driver may not.
   - **Fix:**
     - In `task_16_plan.md`, make the probe `harness-runs/scratch/agent-cli-help.mjs`. It should call `execFileSync(process.env.HARNESS_AGENT_CLI ?? 'claude', ['--help'])` with that fixed argument vector and print the output. This is the same pattern bullet (e) already uses for `git`.
     - In `task_9_plan.md`, say the driver is a `.mjs` (or another extension from the table) that spawns `bash evals/docs-retrieval/arm-a/run-arm-a.sh …` with `HARNESS_AGENT_CLI` set in the child's environment.

## Should Fix

1. **Carried from iterations 0 and 1, and still neither addressed nor recorded under a `## Rejected findings` section — `task_10_plan.md`, `### The tool set, and the network`.**
   - That subsection is still not among Task 10's targets.
   - After Task 9 adds `--strict-mcp-config`, it will still say the withheld web tools are *"the whole of it on the tool side"*.
   - It will still ask the operator to *"confirm no web tool call appears in the run's output"* by eye, although `toolCalls` now records that.
   - Add it to Task 10's targets, or record the rejection with a reason.

2. **Carried — Acceptance 14 has no carrier.**
   - The story index's `Manual setup required:` list says the closing *branch ready for review* summary must end with the row 9 reminder.
   - No task produces that summary. `plugin/instructions/plan_orchestration_instructions_core.md` → `### D.2 Done summary` reads neither the story index's `Manual setup required:` list nor the prompt's acceptance list.
   - Say so in the story index, and name the route that actually reaches the Done summary, or record the gap as an improvement observation. Do not imply the requirement is covered.

3. **Carried — register row 11.**
   - `evals/docs-retrieval/results.mjs` → `provenanceSection` hardcodes *"The pre-calibration per-query distributions the value was chosen from are quoted in `## Threshold calibration` below, taken at the earlier snapshot that section records…"*.
   - Task 23 replaces that censored table with observed distributions. Every block regenerated afterwards, and the `gate10-catalog` block Task 18 writes, will cite a table that no longer exists.
   - Give the row an owning `general` task that edits the sentence before the blocks are regenerated, or record why `no-change` stands.

4. **Carried — `task_21_plan.md`.**
   - Its second `**Work:**` bullet may *"fix such a label's `ref` alone"* in `evals/docs-retrieval/queries/self-docs.jsonl`, and `### Targets` does not list that file.
   - List it as a conditional target, or make a refusing label a stop to report.

## Nice to Have

1. **`task_18_plan.md` `**Verification:**`** says *"every changed line lies between `<!-- eval:corpus:gate10-catalog:start -->` and its end marker"*. `rewriteGeneratedRegion` appends a new block after a blank-line separator, so a line outside the new markers can change. Suggested wording: "inside the generated region, and outside the two existing blocks".
2. **`task_17_plan.md` `**Verification:**`** says redacted records are *"identical to those scored from the unredacted scratch copy"*. A redacted ref changes `hits[].ref`, so assert on rank, recall@5 and MRR instead.
3. **`task_3_plan.md` `**Verification:**`** requires Task 3's commit to come before *"any `bestRerankScore` in `docs/retrieval-eval-results.md`"*, but Task 3's own method subsection writes that identifier. Narrow it to "any recorded `bestRerankScore` figure".
