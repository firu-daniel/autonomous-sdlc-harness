# dispatch_additions/

One `<state_dir>/dispatch_additions/<branch>.md` per branch, holding what the orchestrating agent added to a sub-agent's dispatch prompt beyond the block that agent's governing instruction defines. One file per **branch**, not per run or per phase: every phase in which an addition was made appends its blocks to the same file, and a resumed session skips any block whose `## <dispatch key>` heading is already there rather than rewriting or renumbering one.

Each block is written by the run's own orchestrator — the only participant that composes those prompts, and the added text otherwise exists nowhere but the session transcript — once per phase in which at least one addition was made, before the flow leaves that phase. **No agent reads it back**, the one exception being the session checking its own file so it does not re-append a block it already wrote. Its reader is a human auditing a finding, a verdict or a round count after the fact: whether the agent that produced it was told anything beyond its instruction, and if so what. That question cannot be answered from the review artifacts alone, which is the whole reason this directory exists.

The file is committed by the run itself, on the run's own branch, as one commit per phase that wrote to it. The step is best-effort and never a gate: a phase with no additions writes nothing — no empty block and no empty commit — and a write, commit or push that fails is logged while the run finishes unchanged. So an **absent** file, or a run whose hand-off says none were recorded, means nothing was added, not that the step failed.

The mistake worth naming is reading the per-branch split as an accident and consolidating it into one shared target. Every parallel run appending to one file is among the most reliable merge-conflict generators there is, and a record every run had to touch would re-serialise exactly the parallel runs this tree exists to allow. Nothing collates these files; each is read on its own, against the branch it belongs to.

One block, illustrative rather than real, in the shape every entry takes — as the file for the branch `feat/saved_filters_panel` would carry it. The format is fixed by `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## The entry format`, which also settles what may be added at all; the `verbatim:` line is quoted, never paraphrased, because the wording is what decides which side of that boundary an addition fell on:

```markdown
## [C2 · item 4 · review · iter 1] → skeptic-reviewer  (#37)
- **added:** `context_notes:`
- **verbatim:** "the type-check gate ran at sha 4f1c9ab over the whole diff and reported no error"
- **why the agent could not derive it:** the gate's output is not committed anywhere in its read set
- **reported back by the agent:** (none)
```
