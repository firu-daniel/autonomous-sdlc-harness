### Task 9 — `init` states what an unset `HARNESS_RUN_ACTORS` means, at first setup and on an upgrade

**Goal:** `init` writes no repository variable: its remote setup prints `gh` commands for the adopter to run, which the task prompt's item 7 asked this task to check. So `init` states what an unset list means at the two points an adopter acts:
- the first-setup block, where they set the credential;
- the `--upgrade-workflows` block, where an existing adopter's run job starts enforcing the list.

**Depends on:** Task 1. `cli/src/remote/githubActions.ts` exports `RUN_ACTORS_VARIABLE = 'HARNESS_RUN_ACTORS'` and `RUN_ACTORS_EVERY_WRITER = '*'`, which this task imports rather than spells.

**Where this task stops.**
- This task edits the report text only. No write plan changes, and nothing calls `gh`.
- `doctor`'s findings are Tasks 6–8's, and the docs are Tasks 10–13's.
- Do not renumber the first-setup steps: the list joins step 2, the credential step, because the list says who may spend that credential.

### Targets

- `cli/src/commands/init.ts`: `reportGithubSteps` (step 2 and the trigger-gated label step's who-may-start sentence) and `reportWorkflowUpgrade`.
- `cli/test/trigger-workflow-init.test.mjs`: assertions in the first-setup report case and in the `--upgrade-workflows` case.

**Work:**

- [ ] **`reportGithubSteps`, step 2.** It is printed whatever `trigger` is, because the run job's gate applies without the forge coupling. After its two `gh secret set` commands, add an info line and a command line, through the function's own `command()`:

  > `   Then name who may start, steer, answer and review a run, and so spend that credential: the repository variable ${RUN_ACTORS_VARIABLE}, a comma-separated list of GitHub logins. Unset, it admits the repository owner alone in a user-owned repository, and nobody in an organisation-owned one; ${RUN_ACTORS_EVERY_WRITER} admits every collaborator with write access, for a repository whose credential is a Claude API organisation's key. init sets no repository variable:`

  then the command `gh variable set ${RUN_ACTORS_VARIABLE} --body <login,...>`.

  In the same function, reword the trigger-gated label step's sentence *"Only a person with write or admin access, or a listed bot, starts one."* After Tasks 2 and 5 it is false: a writer `HARNESS_RUN_ACTORS` does not admit is refused, and in an organisation-owned repository with the list unset every person is. The new sentence says a person needs write or admin access **and** admission by `${RUN_ACTORS_VARIABLE}`, pointing back at step 2's line, e.g. *"Only a listed bot, or a person with write or admin access whom ${RUN_ACTORS_VARIABLE} admits (step 2), starts one."* Spell the variable's name through the constant, never as a literal.
- [ ] **`reportWorkflowUpgrade`.** Before its final `IN_FLIGHT_RUNS_NOTE` line, and only when `upgrade.replaced`, add one info paragraph: the re-rendered `harness-run.yml` refuses to launch for a person `${RUN_ACTORS_VARIABLE}` does not admit, and an unset list admits the repository owner alone, or nobody in an organisation-owned repository. Set it before the next run, with the same `gh variable set` command on its own line. Then add a second sentence: `harness-trigger.yml`, `harness-control.yml` and the scripts carry the list into the trigger and the comment commands only once `init --force` has replaced them.
- [ ] **`trigger-workflow-init.test.mjs`.**
  - In the first-setup report case that asserts `HARNESS_TRIGGER_ALLOWED_BOTS`, assert that stdout carries `HARNESS_RUN_ACTORS`, `gh variable set HARNESS_RUN_ACTORS --body <login,...>` on a line of its own, and the phrase `the repository owner alone`. In the same case, assert that stdout no longer carries the old sentence `Only a person with write or admin access, or a listed bot, starts one.`
  - Add the same assertion to the first test's fixture that turns remote execution on **without** `forge`, so the step is shown to print without the trigger.
  - In the case `--upgrade-workflows with an older pin`, assert that the upgrade block carries `HARNESS_RUN_ACTORS` and `init --force`.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- Run the edited `cli/test/trigger-workflow-init.test.mjs` from `cli/` with `npm test -- test/trigger-workflow-init.test.mjs`, under the conditions in `unit_loop_core.md` → `## The test-run rule` (3). The new assertions pass, including the first-setup case's assertion that the old label-step sentence is gone, and the existing step-number and `git add` assertions still pass.
- Grep `init.ts` for the literal `'HARNESS_RUN_ACTORS'`. There is none: it comes from the constant.
- The printed command stands alone on its line, as the lessons ledger's adopter-facing documentation rule requires of every command an adopter runs.
