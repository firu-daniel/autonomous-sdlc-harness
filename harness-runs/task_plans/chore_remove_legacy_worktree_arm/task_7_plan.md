### Task 7 — Drop the legacy-worktree-run clause from the three autonomous commit instructions

**Goal:** the three instruction documents that explain why an unattended run commits through the main checkout's wrapper stop citing a legacy worktree run, which no longer exists: an unattended run's copy is always a clone.

**Depends on:** Task 2, after which the watcher runs no session in a linked worktree. This task restates that consequence in the flow prose.

**Where this task stops.** One clause in each of the three files below. The semi-autonomous `<repo_root>` rows that mention *"a worktree run"* (`plan_orchestration_instructions_semi_autonomous.md`, `user_review_fix_plan_writing_instructions.md`, `user_review_fixes_instructions_semi_autonomous.md`) describe a supervised session in a linked worktree a person made by hand, which stays supported, and are **not** edited (story `## Scope register` rows 27–29).

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md` — the paragraph naming `<MAIN_REPO>`'s copy (*"the run copy's own scripts stay sandboxed, where a commit cannot move the main checkout's branch, whose whole `.git` the profile write-denies, and, in a legacy worktree run, cannot write the worktree's record."*).
- `plugin/instructions/docs_orchestration_instructions_autonomous.md` — the paragraph opening *"Spell both calls literally"* (same clause, followed by *"and an SSH push can fail while the wrapper still exits 0"*).
- `plugin/instructions/improvement_observations_instructions.md` — the **Commit through the wrapper, never a raw `git commit`, in a headless run** bullet (same clause).

**Work:**

- [ ] In each of the three files, remove the clause `, and, in a legacy worktree run, cannot write the worktree's record` so the sentence reads that a sandboxed commit cannot move the main checkout's branch, whose whole `.git` the profile write-denies. In `docs_orchestration_instructions_autonomous.md` keep the following *"and an SSH push can fail while the wrapper still exits 0"* grammatical. The three copies carry one wording before the edit; keep them carrying one wording after it (`.claude/context/plugin.md` → `## Writing agent prose`, *"Each rule is stated once"*). Re-wrap only the lines the edit touches in `autonomous_pause_and_ledger.md`.

**Verification:**

- `git grep -n 'legacy worktree run' -- plugin/` prints nothing.
- `git diff --stat -- plugin/` lists exactly the three target files, each with a one- or two-line change.
- `grep -rn "the profile write-denies" plugin/instructions/autonomous_pause_and_ledger.md plugin/instructions/docs_orchestration_instructions_autonomous.md plugin/instructions/improvement_observations_instructions.md` shows the same remaining wording in each.
