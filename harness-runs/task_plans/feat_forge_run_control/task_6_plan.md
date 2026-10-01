### Task 6 — Add `remote-run.sh deliver`: the draft pull request and the `completed` report

**Goal:** A run that reaches "branch ready for review" on GitHub gets a draft pull request from its branch to the default branch, linked to the issue that started it when there is one: the body names the issue, so the issue's timeline shows the pull request (goal 1, acceptance 1). Then the run's `completed` lifecycle comment names that pull request, and the issue and the pull request both carry `sdlc-harness: done`. The flow never opens it and never merges: `deliver` is a step of `harness-run.yml` that runs after the job's own `push-branch.sh`, and `push-branch.sh` still opens no pull request.

**Depends on:** Task 3's functions in `remote-run.sh`:

- `forge_on`;
- `forge_repo_var` (`FORGE_REPO`, `FORGE_SERVER`);
- `forge_fetch_branch <branch>`;
- `forge_issue_var <branch>`, which sets `FORGE_ISSUE` from the task prompt's provenance line;
- `forge_pr_var <branch>`, which sets `FORGE_PR` to the open same-repository pull request, or empty;
- `forge_recognised <branch>`;
- `forge_comment <number> <event> <branch> <body_file>`;
- `forge_set_state <number> done`.

It also reads Task 1's `COMMAND_HANDLE`, and the existing `hr_remote_status_get <status_json> <key>` and `hr_default_branch "$root"`.

**Where this task stops.** The workflow step that runs `deliver`, with its `pull-requests: write` permission and its `HARNESS_PR_TOKEN` environment line, is Task 14's. Until then nothing calls this verb. `doctor`'s check of the pull-request setting is Task 18's. A **locally** executed run never gets a pull request (the story index's decision): nothing on the local path calls `deliver`.

### Targets

- `cli/templates/scripts/remote-run.sh` — the `deliver` verb, a `gh_call_token` helper, the header paragraph, the usage line and the REPRO.
- `cli/test/remote-deliver.test.mjs` (new) — the verb's contract.

**Work:**

- [ ] **The verb `deliver <branch> <bundle_dir> [--repo <root>]`.**
  - It is job-side for root resolution, as `report` is, and gates itself with `forge_on` (one line, exit 0 when off).
  - It reads `<bundle_dir>/status.json`'s `status` through `hr_remote_status_get`. Anything but `completed`, or no `status.json`, is one line and exit 0.
  - It exits 0 on every path but a usage error, because a finished run must never be failed by its report. State that exit map in the header paragraph, together with what it writes (one pull request at most, one comment, the labels) and that it never pushes.
- [ ] **Find or open the pull request.**
  - `forge_fetch_branch`, then `forge_pr_var`. An open same-repository pull request for the branch — opened by a person, or by an earlier round — is reused, and no second one is opened.
  - Otherwise create one with `gh pr create --repo "$FORGE_REPO" --base <hr_default_branch> --head <branch> --draft --title <title> --body-file <file>` and read its number from the `/pull/<n>` URL `gh` prints.
  - The title is the task prompt's first line when it starts with `# ` (the trigger writes `# <issue title>`), stripped of the `# ` and cut to 256 characters, else `<branch>`.
  - The body is written to a temporary file:
    - a first line, `This pull request carries the harness run on \`<branch>\`, ready for your review. The harness never merges it.`;
    - `Started from #<FORGE_ISSUE>.` when an issue is known — a plain mention, never a closing keyword, because the flow does not own the issue's lifecycle (the story index's decision);
    - two lines naming what a reviewer can do here: a review that requests changes starts a user-review round, and `@sdlc-harness pause`, `resume`, `stop` and `answer <n>` act on a round in flight (from `COMMAND_HANDLE`);
    - the `forge_marker pull-request <branch>` line.
- [ ] **The token, the setting and the one retry.**
  - Add `gh_call_token <token> <args…>`, which runs `GH_TOKEN="<token>" "$GH" <args…>` as a prefix assignment on the external command, never on a function. It fills `GH_OUT` and `GH_ERR` as `gh_call` does.
  - `deliver` creates the pull request with `HARNESS_PR_TOKEN` when that variable is non-empty, and with plain `gh_call` otherwise. Everything else it does uses `gh_call`, the job's own token, so every comment stays `github-actions[bot]`'s.
  - **The decided cost of that token choice (option (b) of review 1, recorded here so no later task re-decides it).** A pull request opened with `HARNESS_PR_TOKEN` is authored by that token's owner, and GitHub does not let a pull request's author approve or request changes on their own pull request (GitHub's documented rule, not retrieved in `docs/github-integration-research.md` and not re-verifiable unattended; C1 measured only a pull request opened by `app/github-actions`). So when `HARNESS_GIT_TOKEN` is a person's own token, that person cannot start a round with *Request changes* on the delivered pull request. The choice stands because it is what lets the adopter's CI run without an approval click (S3). The way on, stated wherever the token is recommended: use a token of a machine account rather than a person's, or have another write-access reviewer request changes, or start the round locally with `/autonomous-sdlc-harness:branch-user-review`. Without `HARNESS_GIT_TOKEN` the pull request is `github-actions[bot]`'s and every person can request changes on it, at the cost of CI's approval click. State this cost in one sentence of the `deliver` header paragraph; the code itself does not change for it.
  - A create that fails with `GitHub Actions is not permitted to create or approve pull requests` (research C3, the measured message) is not retried. The `completed` comment then names the setting — Settings → Actions → General → Workflow permissions → *Allow GitHub Actions to create and approve pull requests* — and the alternative of setting `HARNESS_GIT_TOKEN`.
  - Any other failure is retried **once** without `--draft`, since drafts depend on the account's plan (C3, not measured). A second failure leaves the comment naming `gh`'s error and how to open the pull request by hand from the branch.
- [ ] **The `completed` report.**
  - The comment goes to `FORGE_ISSUE` when known, naming the pull request's URL, else to the pull request itself. When the pull request existed before this run, it goes to the pull request and says the round finished.
  - It names the next GitHub action: review the pull request, and request changes to start another round.
  - With `hr_phase_enabled "$root" qa` true, it adds that the interactive-test phase was skipped on GitHub Actions and still owes a local `/autonomous-sdlc-harness:branch-qa-test <branch>` before merging. That is a local-only step (`docs/remote-execution.md` → `### The interactive-test phase`).
  - Then `forge_set_state done` on the issue and on the pull request.
- [ ] **`cli/test/remote-deliver.test.mjs`** opens with its rule: *a completed run on GitHub ends with exactly one open pull request from its branch, naming its issue as a plain mention, and one `completed` comment naming that pull request; any other bundle status posts nothing.*
  - **Fixture:** Task 3's — `feat_x` on origin with its provenance line for issue 7 and its ledger — plus a bundle directory whose `status.json` (schema `1`) the test writes.
  - **The `gh` stub** answers `pr list` from `STUB_PRS` and `pr create` with `https://github.com/octo/fixture/pull/12`, and logs `GH_TOKEN` per call.
  - **Cases:**
    - completed and no pull request → one `pr create … --draft --base main --head feat_x`, whose body holds `Started from #7.` and no `Closes`; one comment on 7 naming `/pull/12`; `sdlc-harness: done` on 7 and 12;
    - `HARNESS_PR_TOKEN=tok` → the create logs `GH_TOKEN=tok`, and the comment does not;
    - an existing pull request 9 → no create, and the comment and labels on 9;
    - `status` `parked`, or no `status.json` → no `gh` call at all;
    - the C3 message → no retry, and a comment naming the setting;
    - another failure → one retry without `--draft`;
    - forge off → no `gh` call;
    - with `phases.qa` true → the comment names `branch-qa-test`.

**Verification:**

- `npm test -- test/remote-deliver.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "pr create" -- cli/templates/scripts` has every code hit inside `remote-run.sh`'s `deliver`, and none in `push-branch.sh`: the flow's own push still opens no pull request.
- `git grep -n -i "closes #\|fixes #\|resolves #" -- cli/templates/scripts/remote-run.sh` finds nothing: the issue is a plain mention.

**Deviations from plan:**

- `bash -n cli/templates/scripts/remote-run.sh` was refused by the permission layer and not run. The syntax claim rests instead on `npm test -- test/remote-deliver.test.mjs` executing the edited script end to end (10 of 10 pass), which a parse error would fail.
- The `gh` runner is factored into `gh_run`, which both `gh_call` and the new `gh_call_token` call, rather than duplicating `gh_call`'s body; `gh_call`'s behaviour is unchanged. The full suite is deferred to the Run gates phase.
- A failed `pr list` lookup opens no pull request (a duplicate cannot be ruled out); the comment names the failed lookup and the compare URL. The plan did not state this arm.
- The script header describes the create without the literal `pr create`, so the plan's `git grep -n "pr create"` check returns only `deliver_create`'s two lines.
