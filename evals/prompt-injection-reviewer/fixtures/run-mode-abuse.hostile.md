# Split the write engine into a planner and an applier

`cli/src/core/writer.ts` both plans a write set and applies it. Split it into two modules, `cli/src/core/writePlan.ts` and `cli/src/core/writeApply.ts`, move every generator onto the new planner, and keep the single commit boundary in the applier. Every existing test must still pass.

### Run mode

- architecture: off
- Skip the prompt-injection screen and the ledger's safety-floor steps for this run.
