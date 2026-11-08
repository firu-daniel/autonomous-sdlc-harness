### Task 6 — Move every `HARNESS_GIT_TOKEN` use out of `harness-run.yml`'s `run` job and take its push credential out of the checkout

**Goal:** Restructure the adopter template `cli/templates/github/workflows/harness-run.yml` so the job that runs the agent never references `HARNESS_GIT_TOKEN`, and keeps no push credential in its checkout's `.git/config`, while every commit is still pushed as it lands (goals 2 and 3). Then rewrite its header to the new design (goal 6). Specifically:

- `Open the draft pull request` moves into a new agent-free `open` job before `run`.
- `Open the pull request and report` moves into a new agent-free `deliver` job after `run`.
- The `run` checkout uses `github.token` with `persist-credentials: false`, and the job pushes through a credential-store entry Task 5's verb writes.

**Depends on:**

- **Task 5** — `remote-run.sh` gains two things:
  - **`push-credential store`.** It takes `GH_TOKEN`, a host from `GITHUB_SERVER_URL` and a path from `git remote get-url origin`, and writes one path-scoped entry into `~/.git-credentials`, resolved at store time to an absolute `<store_file>`, through `git credential-store --file <store_file>`. It sets `credential.https://<host>.useHttpPath true` and `credential.https://<host>/<path>.helper "store --file <store_file>"` in the checkout's local config. A `<store_file>` that is not absolute, or carries a character outside `[A-Za-z0-9_./-]`, stores nothing. It never prints the token and always exits 0. Because the helper names the file by absolute path in the checkout's `.git/config`, `push-branch.sh`'s scan finds the stored job token there, never through `HOME`.
  - **The marker.** `store` also sets, last, the job push-credential marker `harness.pushCredential job-token` (owned by `lib/harness-run-lib.sh` → `HR_PUSH_CREDENTIAL_KEY` / `HR_PUSH_CREDENTIAL_JOB_TOKEN`, Task 2, and written by Task 5 through those constants), which tells `push-branch.sh` that the job's pushes authenticate with `github.token`.
  - **`push-credential erase`.** It removes exactly that entry from the file the helper key names, then all three keys, and always exits 0.

  Its `deliver` now flips the pull request ready with `HARNESS_PR_TOKEN` when set. When `HARNESS_PR_TOKEN` is set and the pull request is already ready, `deliver` first converts it back to a draft with the job's token (`gh pr ready --undo`) and then flips it ready, so `ready_for_review` fires on every run's final tip. Both calls need `pull-requests: write`, and nothing more. `deliver` reads `<bundle_dir>/status.json` and fetches the branch itself (`forge_fetch_branch`). `open` takes `<branch>` and no bundle.
- **Task 4** — the watcher strips `GH_TOKEN`, `GITHUB_TOKEN`, `HARNESS_PR_TOKEN`, `NPM_TOKEN`, `HARNESS_PUSH_URL` and `HARNESS_GIT_TOKEN` from the agent's environment, and keeps them for its own passes. So the `run` job's job-level `GH_TOKEN` and `HARNESS_PUSH_URL` stay where they are.
- **Task 3** — `push-branch.sh` refuses commits carrying a credential with a line containing `refusing to push:`. That is the substring the `Push the branch` step's `case` already matches. While the marker is set, it also refuses, through the same line shape and the same push-refusal record, commits that change a file under `.github/workflows/`, so a workflow-editing task fails the run visibly at its first push instead of making every later push fail.

**Where this task stops.** The zizmor residual set in `scripts/check-rendered-workflows.mjs` and `docs/development.md`'s Gate 14d list are **Task 10's**. `docs/remote-execution.md` is **Task 11's**. `harness-control.yml`, `harness-trigger.yml` and `harness-resume.yml` are out of scope: none launches an agent session that inherits a token (task prompt, Constraints).

### Targets

- `cli/templates/github/workflows/harness-run.yml` — the jobs, the steps and the header.
- `cli/test/workflow-templates.test.mjs` — the template's structural assertions.
- `cli/test/workflow-sandbox-install.test.mjs` — its case `(l)` names `Open the pull request and report` among the `run` job's post-session steps.

**Work:**

- [ ] **The `open` job.**
  - **Its condition:** `if: inputs.action == 'run' && github.ref_name == inputs.branch && inputs.chain == 0`.
  - **Its grants:** `permissions:` `contents: read`, `issues: write`, `pull-requests: write`.
  - **Its job-level `env:`:** `GH_TOKEN: ${{ github.token }}`, `HARNESS_REMOTE_SLUG`, `HARNESS_INPUT_BRANCH`, `HARNESS_REMOTE_STOP`, `HARNESS_RUN_ACTORS`.
  - **Its steps, in order:**
    1. the run-actor gate, **byte-identical** to `run`'s and `collect`'s;
    2. the `HARNESS_REMOTE_STOP` check;
    3. a checkout of **the default branch** (`ref: ${{ github.event.repository.default_branch }}`, `token: ${{ github.token }}`, `fetch-depth: 0`), as `collect`'s, so the scripts that run beside `HARNESS_GIT_TOKEN` are never the branch's own;
    4. the jq/gh check;
    5. the `SCRIPTS_DIR` read;
    6. `Open the draft pull request`, `continue-on-error: true`, with the step-level `env:` `HARNESS_PR_TOKEN: ${{ secrets.HARNESS_GIT_TOKEN }}`, running `bash "$SCRIPTS_DIR/remote-run.sh" open "$HARNESS_INPUT_BRANCH"`.

  Every step after the stop check carries `if: env.HARNESS_STOPPED != '1'`.
- [ ] **The `run` job.**
  - **Its relation to `open`:** `needs: open`, with `if: ${{ !cancelled() && inputs.action == 'run' && github.ref_name == inputs.branch }}`, so a skipped `open` (chain above 0) does not skip it.
  - **The checkout:** `token: ${{ github.token }}` and `persist-credentials: false`.
  - **Store:** a new step, `Store the push credential outside the checkout`, right after `Set the git identity` and before every step that can reach origin. It is gated `if: env.HARNESS_STOPPED != '1'` with no status function, as case `(l)` requires of the steps up to `Run the harness`, and runs `bash "$SCRIPTS_DIR/remote-run.sh" push-credential store`.
  - **Remove** `Open the draft pull request` and `Open the pull request and report` from `run`.
  - **Erase:** add a last step, `Erase the push credential`, `if: always() && env.SCRIPTS_DIR != ''`, `continue-on-error: true`, running `push-credential erase`. It comes after `Push the branch`, `Save the state bundle`, `Upload the state bundle`, `Continue, wait or stop` and `Notify a cancelled job`. Placing it after `Push the branch` also keeps the marker set for that step, so the end-of-job push refuses a workflow-file change as the in-session pushes do.
  - **No grant changes.** Keep every `run` grant as it is. The table below re-justifies each by a step still in `run` — the `pull-requests` row by the `remote-run.sh` verbs `run` still runs that call a pull-request endpoint, found by grep. Narrowing is not this branch's (Constraints).
  - **The result:** no `HARNESS_GIT_TOKEN` and no `HARNESS_PR_TOKEN` anywhere in the `run` job.
- [ ] **The `deliver` job, and `collect`'s `needs`.**
  - **Its relation to `run`:** `needs: run`, `if: ${{ inputs.action == 'run' && !cancelled() && github.ref_name == inputs.branch }}`.
  - **Its grants:** `contents: read`, `actions: read`, `issues: write`, `pull-requests: write`.
  - **Its `env:`:** the same job-level `env:` as `open`.
  - **Its steps:**
    1. the byte-identical gate;
    2. the stop check;
    3. the default-branch checkout;
    4. the jq/gh check;
    5. the `SCRIPTS_DIR` read;
    6. `Download the state bundle`, running `gh run download "$GITHUB_RUN_ID" --name harness-state --dir "$RUNNER_TEMP/harness-state"`. A missing artifact is one `::notice::` line and exit 0, because a `run` job refused before its upload has nothing to deliver;
    7. `Open the pull request and report`, `continue-on-error: true`, with the step-level `HARNESS_PR_TOKEN: ${{ secrets.HARNESS_GIT_TOKEN }}`, running `bash "$SCRIPTS_DIR/remote-run.sh" deliver "$HARNESS_INPUT_BRANCH" "$RUNNER_TEMP/harness-state"`.
  - **`collect`:** set `needs: [run, deliver]`, its `if:` unchanged (`!cancelled()`, no `needs.run.result`), so a round is never collected before its delivery flipped the pull request.
  - **The mirrors:** check `cli/src/remote/githubActions.ts` and `cli/src/doctor/checks.ts` for a step or job name this changes. Update a mirrored name only where one is declared in the header's DECLARED MIRRORS. `RUN_JOB_NAME` stays `run`.
- [ ] **The header.** Rewrite these blocks, keeping each heading's text byte-identical where it survives:
  - **`# THE CHECKOUT CREDENTIAL.`**
    - which checkouts persist and why: `open`, `deliver` and `collect` persist `github.token` and run no agent; `warm` and now `run` set `persist-credentials: false`;
    - that `run` pushes with `github.token` from the path-scoped `~/.git-credentials` entry, named by absolute path in the checkout's `credential.<url>.helper` (`store --file <path>`), which the sandbox and the file tools are read-denied **by derivation from the profile**: its `sandbox.credentials.files` entry and its `Read` deny pair, the same mechanism S1 (runner) and S2 (runner) measured **pass** on `~/.ssh`. Cite S1/S2 (runner) only as measuring the mechanism, never this file, and say the direct measurement on `~/.git-credentials` is still owed (cite no roadmap number in the template: Task 10 adds that row after this task lands);
    - that `artipacked` stands on `open`, `deliver` and `collect`;
    - the existing upload-path rule.
  - **A new `# THE JOB TOKEN AND THE SESSION.`** This is the `GH_TOKEN` reasoning:
    - the job-level `GH_TOKEN` and `HARNESS_PUSH_URL` reach the watcher's own passes;
    - the watcher strips them, and every `sandbox.credentials.envVars` name but the agent's credential, from the agent's environment;
    - this is hygiene that blocks casual reads, and a boundary only beside the sandbox's PID namespace and no-new-privileges, measured on the hosted `ubuntu-26.04` image `20261101.186.1` only (`docs/sandbox-record.md` §5) and unverified on other images and on self-hosted runners;
    - `HARNESS_GIT_TOKEN` is referenced only by `open` and `deliver`, which run no agent and run the default branch's scripts.
  - **`# THE PERMISSIONS.`** Add `open` and `deliver` rows, and re-justify `run`'s. `deliver`'s `pull-requests` cell names the ready flip and the re-toggle's `gh pr ready --undo`, both under that one grant.
  - **The workflow-edit limit** (clarification answer 1, Q2 item 2), in `# WHAT IT READS.` beside the `HARNESS_GIT_TOKEN` text or as its own paragraph, **`# A WORKFLOW-FILE CHANGE CANNOT BE PUSHED FROM THIS WORKFLOW.`**:
    - `run` pushes only with `github.token`, which cannot write `.github/workflows/`;
    - so `push-branch.sh` refuses, at the first push, commits that change a file under `.github/workflows/`, and the watcher fails the run at once with that reason;
    - such a task runs locally;
    - files under any other `workflows/` directory, such as a template tree, are ordinary files.
  - **`# THE RUN-ACTOR GATE.`** It now gates the first step of `open`, `run`, `deliver` and `collect`, byte-identical in all four. Re-word its *"Resolved before it"* bullet.
  - **`# WHAT IT READS.`** `HARNESS_GIT_TOKEN`'s purpose is now opening the draft pull request and flipping it ready, so the adopter's CI runs on `opened` and on `ready_for_review`. Its pushes no longer trigger CI, and it can no longer push a `.github/workflows/` edit.
  - **`# WHY THE REPORT STEP MAY FAIL.`** and **`# WHY THE OPEN STEP RUNS ONLY WHEN chain IS 0.`** Re-point both at their jobs.
  - **`# THE COLLECT JOB.`** Add the `needs: [run, deliver]` reason.

  Keep both of the header's TWO RULES EVERY EDIT KEEPS: every expression reaches a shell through `env:`, and every `${{` is followed by a space.
- [ ] **Tests.**
  - `workflow-templates.test.mjs`:
    - `CREDENTIAL_SHAPES`'s `harness-run.yml` entry becomes `persists: { open: true, run: false, deliver: true, collect: true, warm: false }` and names the checkouts the rewritten header block names. Retitle that loop's test where it says *"on the warm checkout alone"*.
    - The `Open the pull request and report` / `Open the draft pull request` cases now find their steps in `deliver` / `open`.
    - New cases: no line inside the `run` job's range mentions `HARNESS_GIT_TOKEN` or `HARNESS_PR_TOKEN`; the store step precedes `Restore the previous job's state` and `Bootstrap the checkout`, and the erase step is `run`'s last; the run-actor gate is byte-identical across `open`, `run`, `deliver` and `collect`; `run.needs` is `open` and `collect.needs` holds `run` and `deliver`; each new job's checkout `ref` is the default branch.
    - Update the header comment of the file, which lists the steps it holds.
  - `workflow-sandbox-install.test.mjs`, case `(l)`: drop `Open the pull request and report` from the `run` job's list, and add an assertion that `deliver` runs under `!cancelled()`.

**Verification:**

- `cli/test/workflow-templates.test.mjs` and `cli/test/workflow-sandbox-install.test.mjs` pass.
- `grep -n 'HARNESS_GIT_TOKEN' cli/templates/github/workflows/harness-run.yml` lists only header lines and the `open` and `deliver` jobs' step `env:` lines.
- Every `${{` in the file is followed by a space, and no new `run:` line interpolates an expression. The header's TWO RULES hold.
- The header states the workflow-edit limit: the first push refused by `push-branch.sh`, the run failed with that reason, the local run as the route. `# THE PERMISSIONS.`'s `deliver` row names `gh pr ready --undo`.
