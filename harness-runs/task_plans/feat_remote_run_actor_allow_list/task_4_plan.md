### Task 4 — Gate `harness-run.yml`'s `run` and `collect` jobs on `github.triggering_actor`

**Goal:** A person who is not on the allow-list cannot make the `run` job spend anything, whether they use the **Run workflow** form, `gh workflow run` or a re-run. The `run` job refuses before any credential secret is read and before Claude starts. The `collect` job refuses the same way, so a re-run of `collect` alone starts no round. Every dispatch the harness makes itself still passes: the trigger, the comment commands, `collect`'s next round, a `remote-run.sh continue` chain and the `harness-resume.yml` poller.

**Depends on:** Task 1. `cli/src/remote/githubActions.ts` exports `RUN_ACTORS_VARIABLE = 'HARNESS_RUN_ACTORS'`, which the test imports instead of retyping. This task also passes the variable into the `collect` job for `remote-run.sh collect`, whose list check is **Task 2**'s `authorise_actor` status 5.

**Where this task stops.** This task edits only `harness-run.yml` and its test. `harness-trigger.yml` and `harness-control.yml` are **Task 5**'s. Any doctor check that reads this file is Task 8's, and the docs are Tasks 11 and 13. `harness-resume.yml` is not changed: its poller dispatches as `github-actions[bot]` and passes the gate.

### Targets

- `cli/templates/github/workflows/harness-run.yml`: two job-level `env:` lines, two gate steps, and three header edits.
- `cli/test/workflow-templates.test.mjs`: new cases and the header's contract paragraph.

**The gate's rule.** It is the list's grammar from the story index `## Context`, plus the bot exemption:
- `github-actions[bot]`, exactly, passes.
- Otherwise `HARNESS_RUN_ACTORS` is split on `,`, each entry trimmed, empty entries dropped.
- An entry `*` passes everyone.
- A non-empty list passes a `triggering_actor` equal to an entry, compared case-insensitively.
- An unset list passes the actor only when `IN_OWNER_TYPE` is `User` and the actor equals `IN_OWNER`, case-insensitively.
- Anything else refuses, an empty actor included.

**Work:**

- [ ] **The variable, at job level.** In both the `run` and the `collect` jobs, add `HARNESS_RUN_ACTORS: ${{ vars.HARNESS_RUN_ACTORS }}` to the job-level `env:`. In `collect`, put it directly under the existing `HARNESS_TRIGGER_ALLOWED_BOTS` line. Both jobs therefore hand the gate step the same environment name, and `collect` hands it to `remote-run.sh collect` as well.
- [ ] **The gate steps.** Add one step as the **first** step of `run`, before `Compute the time budget`, named `Refuse an actor not on HARNESS_RUN_ACTORS`. Add a second as the first step of `collect`, named `Refuse an actor not on HARNESS_RUN_ACTORS before collecting`.
  - **Environment.** Both steps carry the same step `env:`, and nothing reaches the shell any other way:
    ```yaml
    IN_TRIGGERING_ACTOR: ${{ github.triggering_actor }}
    IN_OWNER: ${{ github.repository_owner }}
    IN_OWNER_TYPE: ${{ github.event.repository.owner.type }}
    ```
  - **Body.** Both `run: |` bodies are **byte-identical**, and implement the gate's rule above with `tr` for lowercasing.
  - **On a pass**, the step prints one line naming the actor and why it passed.
  - **On a refusal**, it prints one `::error::` line naming:
    - the actor;
    - that this is a dispatch or re-run by someone the list does not admit;
    - that nothing was launched and no credential was read;
    - which case applied: not listed, not the owner of a user-owned repository, or an unset list in a repository with no single owner;
    - the way on: add the login to the comma-separated repository variable `HARNESS_RUN_ACTORS`, or set it to `*` for every writer (docs/remote-execution.md, section 9).

    It then exits 1. Every later step of `run` is already skipped by that failure: `SCRIPTS_DIR` is never set, so the `always()` and `!cancelled()` steps guarded by `env.SCRIPTS_DIR != ''` skip too.
- [ ] **The header.**
  - **A new paragraph, `THE RUN-ACTOR GATE.`**, after `THE REF CHECK.` It states:
    - **Why a step and not a job.** **Re-run failed jobs** and **Re-run job** do not re-run an upstream job that succeeded, so a gate job would never see the re-runner's `triggering_actor` (`docs/team-accounts-research.md`, G2).
    - **Why `github-actions[bot]` passes.** Every harness dispatch is made with `GITHUB_TOKEN` and names it. That was measured 2026-10-05 for the trigger, the comment commands and `collect`. The continuation and the poller are inferred, and Gate 12 observation (xv) confirms them.
    - **What it does not close.** A writer who edits this file on a branch can remove the gate or dispatch as the bot. That writer can already read the secret (G7).
    - **What is resolved before the gate.** The job-level `HARNESS_PUSH_URL` secret is resolved at job start, before the gate. The credential secrets and `HARNESS_GIT_TOKEN` are read only by steps after it.
  - **`WHAT IT READS.` → `Variables`.** Add `HARNESS_RUN_ACTORS`.
  - **`DECLARED MIRRORS`.** Add `HARNESS_RUN_ACTORS` to the `cli/src/remote/githubActions.ts` entry. Add `HARNESS_TRIGGER_ALLOWED_BOTS` beside it: the `collect` job already passes it with no mirror entry, and the task prompt notes the gap.
- [ ] **`workflow-templates.test.mjs`.** Add these cases:
  - **Position and identity.** Each of `run` and `collect` has the gate as its first `- name:` step. The two `run:` bodies are identical, read with the file's own `blockUnder` / `runBodies` helpers. No step of `run` that references `secrets.` comes before the gate.
  - **Environment.** Both jobs' `env:` carries `` `${RUN_ACTORS_VARIABLE}: \${{ vars.${RUN_ACTORS_VARIABLE} }}` ``. Each gate step's `env:` is exactly the three `IN_*` lines above.
  - **The body run under bash.** Run the body under `bash -e -o pipefail -c`, as the existing control-step case does, against a table that exits 0 for:
    - actor `github-actions[bot]` with an empty list and `Organization`;
    - `Alice` with `' alice , bob,'`;
    - `carol` with `'alice, *'`;
    - `OWNER` with an empty list and owner `owner` of type `User`.

    and non-zero, with an `::error::` line naming `HARNESS_RUN_ACTORS`, for:
    - `carol` with `'alice,bob'`;
    - `carol` with an empty list and owner `owner`, `User`;
    - `carol` with an empty list and `Organization`;
    - `owner` with an empty list and an empty owner type;
    - an empty actor with `'alice'`.
  - **The contract paragraph.** Extend the file's header with the gate. The existing cases must still hold: *"the collect job … reads no secret and runs `remote-run.sh collect` alone"*, no expression inside a `run:` block, and spaced expressions.

**Verification:**

- Run the edited `cli/test/workflow-templates.test.mjs` from `cli/` with `npm test -- test/workflow-templates.test.mjs`, under the conditions in `unit_loop_core.md` → `## The test-run rule` (3). The new cases and every existing case pass.
- Read the rendered order of the `run` job's steps. The gate comes before `Check out the run's branch`, which reads `HARNESS_GIT_TOKEN`, before `Check the credentials`, and before `Run the harness`.
- Grep the file for `{{` followed by a letter: `{{cliVersion}}` is still the only template token, so the CLI's renderer sees nothing new.
- **The end-to-end exercise**, a refused re-run and a passing continuation on GitHub, is Task 13's Gate 12 observation (xv). It is not run here.
