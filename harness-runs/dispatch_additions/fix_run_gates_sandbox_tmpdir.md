# Dispatch additions — fix_run_gates_sandbox_tmpdir

## [C · Item 1 · cli · iter 0] → layer-implementer  (#13)
- **added:** `context_notes:`
- **verbatim:** `context_notes: This unit's readiness entry is tagged `_(layer: cli, general)_`; the `general` layer is dispatched right after this one within the same unit to edit scripts/remote-run.sh, and the unit's single commit lands only after both layers finish (harness-runs/code_reviews/fix_run_gates_sandbox_tmpdir_code_review.md, readiness entry 1).`
- **why the agent could not derive it:** the implementer reads the finding file (`harness-runs/code_reviews/fix_run_gates_sandbox_tmpdir_code_review/finding_4.md`), not the readiness entry's layer tag or the unit loop's per-unit commit order; its first dispatch (#12) returned a blocker because it could not see that the `general` half would follow in the same unit.

## [C · Item 1 · general · iter 0] → layer-implementer  (#14)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The `cli` layer of this same unit already applied the reflow to cli/templates/scripts/remote-run.sh in the working tree, uncommitted (its implementer return, this session); the unit's tag is `_(layer: cli, general)_` (harness-runs/code_reviews/fix_run_gates_sandbox_tmpdir_code_review.md, readiness entry 1).`
- **why the agent could not derive it:** the uncommitted state of the sibling layer's edit exists only in the working tree and in the previous implementer's return, which this agent never sees.
