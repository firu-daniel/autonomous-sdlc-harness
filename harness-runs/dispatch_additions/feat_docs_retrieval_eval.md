# Dispatch additions — feat_docs_retrieval_eval

## [A · Task 5 recovery · cli · iter 0] → layer-implementer  (#1)
- **added:** `outside the sanctioned form`
- **verbatim:** The whole of the user's park-3 answer (`harness-runs/clarifications/feat_docs_retrieval_eval/answer_3.md`) quoted into the prompt as the unit's spec — Option C's four numbered steps, the *"The commit body is not a viable inter-task hand-off channel for implementer-produced evidence"* rule, the `**Deviations from plan:**` standing rule, and the `## On re-entering a closed unit` paragraph — followed by a five-step restatement of the work, the instruction that `cli/src/retrieval/search.ts` must end byte-identical to `51ba982`, and a closing `git diff --stat` verification instruction. This unit has **no** governing instruction block: it is a recovery dispatch the user's answer authorised outside the unit loop's readiness walk ("this is the orchestrator improvising flow structure, and it is authorised here for this one case"), so every line of the prompt is an addition by construction.
- **why the agent could not derive it:** The authorisation exists only in `answer_3.md`, which is machine-local and gitignored (the clarification channel's files never reach a commit), and the unit corresponds to no readiness entry and no detail file the implementer could be pointed at.

## [A · Task 14 · general · iter 0] → layer-implementer  (#2)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The arm-E recall@5 before/after pair and its shared corpus snapshot stamp are in the `**Deviations from plan:**` block of harness-runs/task_plans/feat_docs_retrieval_eval/task_5_plan.md, committed as 25891ee — not in Task 5's commit body, which is empty; read them there and derive nothing a second time.` / `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.`
- **why the agent could not derive it:** `task_14_plan.md` line 9 names Task 5's commit body as the sole source and that body is empty, so the file the implementer reads points at nothing; the relocation was authorised in `answer_3.md`, which is gitignored.

## [A · Task 6 · general · iter 0] → layer-implementer  (#4)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure or a result is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.`
- **why the agent could not derive it:** as above — the rule is in `answer_3.md`, which no commit carries.

## [A · Task 7 · general · iter 0] → layer-implementer  (#6)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure or a result is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.`
- **why the agent could not derive it:** as above.

## [A · Task 8 · general · iter 0] → layer-implementer  (#8)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure or a result is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.`
- **why the agent could not derive it:** as above.

## [A · Task 9 · general · iter 0] → layer-implementer  (#10)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure or a result is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.` / `context_notes: Task 8's cold-build measurement trips the standing 60-second rule (refresh extrapolates to 93.8 s at ~1,500 chunks, crossover 960 chunks), and its recorded decision is that the cold build moves into `scripts/setup-worktree.sh`; the figures are in the `**Deviations from plan:**` block of harness-runs/task_plans/feat_docs_retrieval_eval/task_8_plan.md, committed as 2966520.` / `context_notes: The `self-docs` corpus now stamps at 13 files / 177 chunks in this worktree, per Task 7's and Task 8's own passes; the generated region currently carries 13 files / 173 chunks from Task 4's pre-move run.`
- **why the agent could not derive it:** the first as above; the second and third name sibling units' measured outputs, which `task_9_plan.md` does not carry and which the implementer would otherwise have re-derived (the plan forbids re-running an arm).

## [A · Task 10 · general · iter 0] → layer-implementer  (#12)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure or a result is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.` / `context_notes: Task 9 shipped `evals/docs-retrieval/floor.json` with a `see` field reading `docs/retrieval-eval.md → ## The regression floor`, and `docs/development.md` §5 gate 11 carries the same pointer; both are unresolved until this task creates that section. Task 9's handover block in harness-runs/task_plans/feat_docs_retrieval_eval/task_9_plan.md, committed as ae105a6, states the margin, its reason and the re-record rule that section owes.`
- **why the agent could not derive it:** the first as above; the second names which sibling unit owns the two dangling pointers this task's document has to resolve, a fact `task_10_plan.md` does not state.

## [A · Task 11 · general · iter 0] → layer-implementer  (#14)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure or a result is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.` / `context_notes: Task 10 landed `docs/retrieval-eval.md` with `## Running arm A by hand` as a deliberate one-paragraph placeholder for this task, committed as ebe333a. Task 6's implementer reported that `run-arm-a.sh`'s agent-CLI flag spellings have never been exercised and that the script landed at mode 644 because `chmod` was refused in this worktree; its `**Deviations from plan:**` block in harness-runs/task_plans/feat_docs_retrieval_eval/task_6_plan.md, committed as c3a8d58, records both.`
- **why the agent could not derive it:** the first as above; the second names the placeholder this task replaces and two properties of the script the procedure documents (unexercised flags, mode 644) that are recorded in a sibling unit's detail file rather than in `task_11_plan.md`.

## [A · Task 12 · general · iter 0] → layer-implementer  (#16)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure or a result is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.` / `context_notes: Task 8's cold-build pass trips the standing 60-second rule — refresh extrapolates to 93.8 s at ~1,500 chunks, total 94.8 s, crossover 960 chunks — and its recorded decision is that the cold build moves into `scripts/setup-worktree.sh`; the per-run figures are in the `**Deviations from plan:**` block of harness-runs/task_plans/feat_docs_retrieval_eval/task_8_plan.md, committed as 2966520.`
- **why the agent could not derive it:** the first as above; the second supplies the measured premise this task's `setup-worktree.sh` paragraph is rewritten against, produced by a sibling unit and not restated in `task_12_plan.md`.

## [A · Task 13 · general · iter 0] → layer-implementer  (#18)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The standing rule for the rest of this branch, from the user's park-3 answer: wherever a plan file says a figure or a result is carried "in the commit body", read it as naming the producing task's `**Deviations from plan:**` block instead — an implementer cannot write a commit body, so that channel does not exist.`
- **why the agent could not derive it:** as above.
