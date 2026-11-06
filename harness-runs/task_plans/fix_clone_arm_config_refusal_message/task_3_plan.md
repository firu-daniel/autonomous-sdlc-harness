### Task 3 — Bring `docs/outer-loop-verification.md` §1.1 and `docs/cli.md`'s target-check paragraph in line with the new order and message

**Goal:** The two documents that state how the commit wrapper refuses a clone, and in what order the wrappers check things, describe what the shipped scripts now do. They must still keep the 2026-11-06 round's reading as a dated record, never rewrite it as a re-drive.

**Depends on:** Tasks 1 and 2.
- **Task 1** made `hr_clone_target_check_var` refuse a failed `hr_state_path` with `… and the run registry that would record a clone of <main> cannot be located, because '<main>/harness.config.json' cannot be resolved`. It kept `… and the run registry records no clone of <main> at that path` for a readable configuration with no record, and for a clone `HEAD` that names no branch.
- **Task 2** moved `hr_config_load "$main_top"` ahead of `hr_wrapper_target_check_var` in `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`. In the two unresolvable cases, all three targets now print each wrapper's own `cannot resolve '<main>/harness.config.json'` line: `— refusing to commit` with its causes line at exit 1, `— refusing to push` at exit 0, and `— refusing to merge` with its causes line at exit 1. Task 2 created `cli/test/wrapper-clone-config-refusal.test.mjs`, which asserts this on a clone together with the unchanged refs.

This task describes that work and changes no script and no test. This is the catch-all task. It reads all three conventions documents and applies `.claude/context/conventions.md` → `## Documents of record`: a measured fact states what was measured, the command and the exact message.

### Targets

- `docs/outer-loop-verification.md`, §1.1 only.
- `docs/cli.md`, the paragraph opening "The excluded rule's `:*` accepts any argument, so all four excluded scripts check their target first".

**Work:**

- [ ] §1.1 lead paragraph. Replace "the clone arm's trust check (`hr_clone_target_check_var`) runs before every branch and configuration decision" with the current order: the main checkout's configuration is resolved first, then the trust check runs before every branch decision. Add one dated sentence saying that `fix_clone_arm_config_refusal_message` moved the configuration read after the 2026-11-06 round, and that the two clone cells below therefore rest on a unit measurement rather than on that round.
- [ ] §1.1 rows "the main checkout's `harness.config.json` truncated to invalid JSON" and "a pre-1.5 `jq` first on `PATH`", clone cells only. Each becomes: **1**, the `cannot resolve '<main>/harness.config.json' — refusing to commit` line, ref unchanged.
  - Each is marked as **a unit measurement, not a §0 row**, citing `cli/test/wrapper-clone-config-refusal.test.mjs` case (a). This matches §1.2's deleted-on-origin row.
  - Each keeps the round's own reading as history: the 2026-11-06 round read the third row's registry line there, before the configuration read moved ahead of the trust check.
  - Leave the main-checkout, worktree and perturbation cells unchanged. Also leave three clone cells unchanged:
    - "HEAD on `trunk` (the `defaultBranch`)" and "detached HEAD": both are still the registry line, with a readable configuration and a branch that has no record, or no branch at all.
    - "HEAD on `trunk`, `protectedBranches: []`" ("not reachable: the third row's refusal comes first"): the protected-set decision that reads `protectedBranches` still runs after the trust check, so the clone still meets the third row's registry refusal first.
- [ ] §1.1 paragraph "**Not driven by this round.**". Add `cli/test/wrapper-clone-config-refusal.test.mjs` to the suites named as asserting the rows automatically.
- [ ] §1.1 closing paragraph ("The two unresolvable rows are the load-bearing ones …"). Replace "On a clone they close one step earlier, with a message that names the registry rather than the configuration. The outcome is the same, but the message is less useful for diagnosis." with the current statement: on a clone they now close at the same step with the same line. The registry line remains only for a clone the readable registry does not record.
- [ ] `docs/cli.md`, the target-check paragraph. After "all four excluded scripts check their target first …", add one sentence. The three git wrappers resolve the main checkout's `harness.config.json` just before that check, which reads nothing of the target and runs no git. So a configuration they cannot read is refused as such on every target, a clone included, rather than as a clone the registry does not record (`cli/templates/scripts/commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`). Leave the clone-arm sentence "a repository a sandboxed command built is refused with the worktree arm's sentence plus the clause `and the run registry records no clone of <main> at that path`" unchanged, because it is still true.
  - In the same paragraph's clone-arm half, directly after that sentence, add one clause for the callers that do not load the configuration first — `launch-sandboxed-gates.sh` and `setup-worktree.sh` (`--target`) only: when `<main>/harness.config.json` cannot be resolved, the clone arm refuses with its own clause, `and the run registry that would record a clone of <main> cannot be located, because '<main>/harness.config.json' cannot be resolved`, not the "records no clone" clause (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_clone_target_check_var`; Task 1). Do not name `cleanup-merged-worktrees.sh` here: it runs `hr_config_load "$main_repo"` before its target check and refuses with its own `cannot resolve … — refusing to delete anything` line, so an unresolvable configuration never reaches the clone arm from it.
  - In that paragraph's closing list ("The clone arm is exercised by `cli/test/clone-*.test.mjs`, `cli/test/wrapper-clone-arm.test.mjs`, …"), add `cli/test/wrapper-clone-config-refusal.test.mjs`.

**Verification:**

- The scope register's command entry, `git grep -nE "registry records no clone|hr_clone_target_check_var|hr_wrapper_target_check_var|check their target first|cannot resolve '" -- docs plugin README.md ARCHITECTURE.md cli/README.md cli/templates/README.md cli/templates/scripts/README.md`, re-run from the checkout root, must satisfy one invariant: every hit is a site that the story index's `## Scope register` already lists as a row. No new site may appear outside the register.
- Every cited test file and case letter exists: `cli/test/wrapper-clone-config-refusal.test.mjs` case (a).
- No §1.2, §1.3 or §1.8 cell changed. Their configuration rows record outcomes that Task 2 kept.
- Every edited cell names a command, a file or a line, never a fixture path or a location on this machine. This is the self-containment gate.
