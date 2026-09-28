## [C · Item 1 · general · iter 0] → layer-implementer  (#1)
- **added:** `context_notes:`
- **verbatim:** `context_notes: the operator already ran `chmod 755 scripts/run-test-suite.sh` in this worktree and left it uncommitted; `git diff --summary` shows `mode change 100644 => 100755 scripts/run-test-suite.sh` (source: harness-runs/clarifications/feat_run_gates_phase/answer_2.md, answering question_2.md park on this finding)`
- **why the agent could not derive it:** the operator's answer lives only in the machine-local clarification file `harness-runs/clarifications/feat_run_gates_phase/answer_2.md`, outside the implementer's read set; the working tree shows the mode change but not who made it or that it was the sanctioned route

## [C · Item 3 · general · iter 0] → layer-implementer  (#6)
- **added:** `context_notes:`
- **verbatim:** `context_notes: this unit's `cli` layer already ran in this unit and edited cli/templates/state-dir/test_fix_point_reviews/README.md (uncommitted in the working tree; source: `git status --short`)`
- **why the agent could not derive it:** that an uncommitted change belongs to an earlier layer of the same unit, rather than to some other source, is not recorded in any file the implementer reads

## [C · Item 6 · plugin · iter 0] → layer-implementer  (#13)
- **added:** `context_notes:`
- **verbatim:** `context_notes: this unit's `cli` layer already ran in this unit and edited cli/templates/scripts/run-test-suite.sh and cli/test/run-test-suite.test.mjs (uncommitted in the working tree; source: `git status --short`)`
- **why the agent could not derive it:** that an uncommitted change belongs to an earlier layer of the same unit, rather than to some other source, is not recorded in any file the implementer reads

## [C · Item 6 · general · iter 0] → layer-implementer  (#14)
- **added:** `context_notes:`
- **verbatim:** `context_notes: this unit's `cli` and `plugin` layers already ran in this unit; cli edited cli/templates/scripts/run-test-suite.sh and cli/test/run-test-suite.test.mjs, plugin edited four files under plugin/instructions/ and appended a Deviations note to the finding file (all uncommitted in the working tree; source: `git status --short`)`
- **why the agent could not derive it:** that an uncommitted change belongs to an earlier layer of the same unit, rather than to some other source, is not recorded in any file the implementer reads
