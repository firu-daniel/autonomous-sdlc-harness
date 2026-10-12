### 2. Four corpus sites put the commit and the excluded push in one fenced block, so a single-call run pushes sandboxed

**Files:**
- `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`: the fence holding "bash <scripts_dir>/commit-on-branch.sh --repo \"$REPO_ROOT\"" and "bash <MAIN_REPO>/<scripts_dir>/push-branch.sh \"$REPO_ROOT\""
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 3 — commit the UI-test plan after it converges`: the fence ending "-- \"chore: Add UI-test plan for ${branch}\"" followed by the push line
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 4 — commit the task plan after it converges`: the fence ending "-- \"chore: Add task plan for ${branch}\"" followed by the push line
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3 — commit the fix plan + source review after the gates converge`: the fence ending "-- \"chore: Add user-review fix plan for ${branch}\"" followed by the push line

**The problem.** The profile runs exactly one spelling of the push outside the sandbox: `sandbox.excludedCommands` → `Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)`. An excluded rule applies only when **every** command in the Bash call matches it. The branch's own `docs/cli.md` says so: "so does a call that compounds the excluded spelling with anything else: every command in a call must match". The profile's `_README` says the same: "as does a call that compounds the excluded spelling with anything else".

Each of the four sites above shows the commit wrapper and the push in **one** fenced block. `task_plan_writing_instructions_autonomous.md`'s Override 3 goes further and says so as an instruction: "the push is part of the same block as the commit". An orchestrator that issues the fence as one Bash call sends a call holding two commands. The commit does not match the excluded rule, so the whole call, push included, runs sandboxed. On macOS an SSH push fails inside the sandbox, and `push-branch.sh` still exits 0, so nothing records the miss. The story index lists exactly this as a top risk ("A missed agent-issued push spelling fails silently"). Before this branch the same single call pushed correctly, because nothing was sandboxed. The other five push sites — `dispatch_discipline_instructions.md`, `clarification_digest_instructions.md`, `improvement_observations_instructions.md`, `plan_orchestration_instructions_autonomous.md` → `### Override E` and `user_review_fixes_instructions_autonomous.md` → `### Override E` — already give the push a fence of its own.

**Fix.** At each of the four sites, split the fence in two and say why. The reader is the orchestrating agent that would otherwise issue the block as one call.

- [ ] Delete the line `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"` from the commit fence. Directly after the commit fence's closing line, add its own fence:

  ````markdown
  Then issue the push as its **own** Bash call, never in the same call as the commit:

  ```zsh
  bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"
  ```

  The profile runs this spelling outside the sandbox only when it is the call's only command; issued in one call with the commit, it runs sandboxed, where an SSH push can fail on macOS while the wrapper still exits 0.
  ````

- [ ] In `task_plan_writing_instructions_autonomous.md` → `## Override 3`, replace "Mirroring Override 4's structure, the push is part of the same block as the commit so nothing is pushed on the `no_ui` path:" with "Mirroring Override 4's structure, the commit and the push both sit in this override, so nothing is pushed on the `no_ui` path:". In its **Push after the commit.** paragraph, replace "runs in the same block as the commit" with "runs right after the commit, in the same override". The guarantee that nothing is pushed on the `no_ui` path rests on the override's placement, not on one fence.
- [ ] In `docs_orchestration_instructions_autonomous.md`, keep the sentence starting "The push names `<MAIN_REPO>`'s copy of the wrapper" and put the split before it. `plugin/instructions/docs_phase_instructions.md` already cites this section for "then `push-branch.sh` as a separate, **ungated** statement", so nothing there changes.
- **Deviations from plan:** Two edits beyond the three listed bullets, both to keep "block" from still reading as one fence. In `task_plan_writing_instructions_autonomous.md` → `## Override 3`, the sentence "The whole block — commit **and** push — sits inside Override 3, … co-located in one block that runs only when a plan was written." was removed: it said "one block", and the replacement sentence the fix prescribes ("the commit and the push both sit in this override, so nothing is pushed on the `no_ui` path") now carries the same guarantee. In `user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3`, the ⚠️ note's heading "anywhere in this block" became "in either block", because the note covers the push gate, which now sits in its own fence. Verification: `bash scripts/typecheck.sh` printed `PASS: typecheck`. `grep -rn` over `plugin cli docs schemas .claude` for the removed phrases ("same block as the commit", "anywhere in this block", "co-located in one block", "The whole block — commit") returned nothing, so no other file quotes them.
