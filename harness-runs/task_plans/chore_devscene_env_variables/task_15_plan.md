### Task 15 — Rename the anchor read, the remote-stop variable and the QA prefix in the plugin's prose

**Goal:** Every plugin reader resolves `<MAIN_REPO>` as *"the path a bare `printenv DEVSCENE_MAIN_REPO` prints, else …"*. `branch-resume` names the repository variable `DEVSCENE_REMOTE_STOP`. The orchestration core names the credential keys `DEVSCENE_QA_*`.

**Depends on:** Task 1, which made the corpus guard read the clause through `MAIN_REPO_ANCHOR_READ`. Task 2, which set that constant's source to `DEVSCENE_MAIN_REPO`, so `MAIN_REPO_ANCHOR_READ` is `printenv DEVSCENE_MAIN_REPO` and the generated profile allows `Bash(printenv DEVSCENE_MAIN_REPO)`. Task 3, whose watcher exports the variable. Task 14, whose shell library reads it. This change selects the tree guard `test/main-repo-resolution-corpus.test.mjs`, which now expects exactly this spelling in the same files, with the same per-file counts.

**The clause is a wire.** It is copied byte for byte into every citer (`.claude/context/plugin.md` → *Never paraphrase a wire literal*). Replace only the token `HARNESS_MAIN_REPO`, and change no other byte of any `<MAIN_REPO>` row or step.

### Targets

- `plugin/agents/committer.md`, `plugin/agents/qa-tester.md`
- `plugin/commands/branch-answer.md`, `branch-pause.md`, `branch-prompt.md`, `branch-resume.md`, `branch-start-docs-autonomous.md`, `branch-start-plan-autonomous.md`, `branch-start-user-review-fix-autonomous.md`, `branch-status.md`, `branch-user-review.md` (all under `plugin/commands/`)
- `plugin/docs/AUTONOMOUS_FLOW.md`
- `plugin/instructions/autonomous_pause_and_ledger.md`, `clarification_digest_instructions.md`, `dispatch_discipline_instructions.md`, `docs_orchestration_instructions_autonomous.md`, `improvement_observations_instructions.md`, `plan_orchestration_instructions_autonomous.md`, `task_plan_writing_instructions_autonomous.md`, `user_review_fix_plan_writing_instructions_autonomous.md`, `user_review_fixes_instructions_autonomous.md` (all under `plugin/instructions/`)
- `plugin/instructions/main_repo_resolution.md`, `plugin/instructions/plan_orchestration_instructions_core.md`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] The two agents, the nine commands and `AUTONOMOUS_FLOW.md`: `HARNESS_MAIN_REPO` becomes `DEVSCENE_MAIN_REPO`. `branch-start-user-review-fix-autonomous.md` carries it twice.
- [ ] `branch-resume.md`'s second hit: the repository variable `HARNESS_REMOTE_STOP` becomes `DEVSCENE_REMOTE_STOP`, matching `REMOTE_STOP_VARIABLE` (Task 2).
- [ ] The nine instruction files that carry the `<MAIN_REPO>` resolved-values row: `HARNESS_MAIN_REPO` becomes `DEVSCENE_MAIN_REPO`.
- [ ] `main_repo_resolution.md`: its three hits, the two `printenv` reads in the opening paragraph and *Known cost*'s *"sets `HARNESS_MAIN_REPO` instead"*. `plan_orchestration_instructions_core.md`: `HARNESS_QA_*` becomes `DEVSCENE_QA_*`, matching Task 14's parse.

**Verification:**

- `git grep -nE 'HARNESS_' -- plugin` prints nothing. Task 14 cleared the shell files, and the plugin carries no kept or excluded name.
- `git grep -c 'printenv DEVSCENE_MAIN_REPO' -- plugin` lists the same files, with the same per-file counts, as `git grep -c 'printenv HARNESS_MAIN_REPO' -- plugin` listed at the commit before this one (`git grep -c 'printenv HARNESS_MAIN_REPO' HEAD -- plugin`).
