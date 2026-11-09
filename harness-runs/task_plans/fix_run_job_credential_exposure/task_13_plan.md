### Task 13 — Reword the `HARNESS_GIT_TOKEN` setup step `init` prints for the new CI trigger

**Goal:** The GitHub setup steps `init` prints tell every adopter, in step 3, to set `HARNESS_GIT_TOKEN` *"so the job's pushes trigger your own CI, which pushes made with the job's built-in token never do"*. After Task 6 that is false, and it is the very reason goal 3 replaces. Reword that step so it states what the token does now and what the adopter's CI must list (goal 3, *CI on the final tip*). This task ships seventh, after Task 6, and is the last `cli` task.

**Depends on:**

- **Task 6** (`harness-run.yml`): `HARNESS_GIT_TOKEN` is never referenced in the `run` job; only `github.token` pushes there. The token is read only by the agent-free `open` job, which opens the draft pull request (`remote-run.sh open`), and the agent-free `deliver` job (`remote-run.sh deliver`).
- **Task 5** (`remote-run.sh`): `deliver` makes the draft→ready flip with `HARNESS_PR_TOKEN` (`HARNESS_GIT_TOKEN` in the job) when it is set, so the adopter's CI gets a `pull_request` `ready_for_review` event on the final tip, beside the `opened` event the `open` job's create gives. When the secret is set and the pull request is already ready, `deliver` converts it back to a draft first, so the event fires on every run. Pushes made with `github.token` start no workflow.

**Where this task stops.** It changes the printed step only. The documentation mirrors are not this task's: `docs/remote-execution.md`'s step **5a.** and `HARNESS_GIT_TOKEN` secret row are **Task 11's**, and `docs/cli.md`'s pull-request-setting paragraph is **Task 12's**. The trigger-only step later in the same function (*"switch it on, or set ${GIT_TOKEN_SECRET}, which opens the pull request so the repository's CI runs on it without an approval click"*) stays true and is left as it is, so `cli/test/trigger-workflow-init.test.mjs`'s `'HARNESS_GIT_TOKEN, which opens the pull request'` assertion is untouched. Write no branch-task or roadmap reference into the source.

### Targets

- `cli/src/commands/init.ts` — `reportGithubSteps`, the `ctx.report.info` line starting `` `3. Optionally set ${PUSH_URL_SECRET} to receive push notifications from the job, and ${GIT_TOKEN_SECRET} ``.
- `cli/test/init.test.mjs` — the subtest `'turned on, init writes both files from their templates and reports the GitHub-side steps'`, the init suite's case that already grades the first-setup GitHub output.

**Work:**

- [ ] **Reword step 3** in `reportGithubSteps`. Keep `${PUSH_URL_SECRET}`'s clause as it is. Name the token through `${GIT_TOKEN_SECRET}`, the constant the line already uses — never the literal. The sentence states, in this order:
  - that `${GIT_TOKEN_SECRET}` — a personal or App token — opens a run's draft pull request and marks it ready for review at the end of every run, so your own CI runs on the pull request's `opened` and `ready_for_review` events (Task 5's `deliver` turns a pull request that is already ready back to a draft first, so the event fires each time; the printed step need not say how);
  - that pushes made by the job never trigger CI, whatever token is set;
  - that your CI workflow must list `ready_for_review` among its `pull_request` types to run on a run's final commit.

  It still ends with `:` before the commands. Keep `command(\`gh secret set ${PUSH_URL_SECRET}\`)` and `command(\`gh secret set ${GIT_TOKEN_SECRET}\`)` as two separate `command(...)` lines, unchanged. Remove the clause *"so the job's pushes trigger your own CI, which pushes made with the job's built-in token never do"* entirely.
- [ ] **The init suite case.** In the subtest named above, after the existing `names` loop, add:
  - `stdout.includes('ready_for_review')` and `stdout.includes('gh secret set HARNESS_GIT_TOKEN')`, each with a message carrying `stdout`, in the suite's existing `assert.ok(…, \`… :\n${stdout}\`)` shape;
  - `!stdout.includes("so the job's pushes trigger your own CI")`, with a message naming the stale sentence.

**Verification:**

- `cli/test/init.test.mjs`, the one test file this task edits, passes.
- `commands.typecheck` passes over the whole tree.
- `grep -rn "trigger your own CI" cli/src` finds nothing.
- `grep -n 'GIT_TOKEN_SECRET' cli/src/commands/init.ts` shows the reworded step-3 line still naming the constant, and the `gh secret set ${GIT_TOKEN_SECRET}` `command(...)` line still on its own.
