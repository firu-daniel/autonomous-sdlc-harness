### 4. `doctor --check-github` says `HARNESS_GIT_TOKEN` is not set when it could not read the secret list

**Severity:** Should Fix

**Site:** `cli/src/doctor/checks.ts` → `REMOTE_GITHUB_CHECK`, the new pull-request-setting block, the two arms `} else if (!allowed && secretNames?.has(GIT_TOKEN_SECRET) === true) {` and `} else if (!allowed) {`. The second arm's warning contains `is off and ${GIT_TOKEN_SECRET} is not a repository secret`.

**Problem.** `secretNames` is `undefined` whenever the earlier `gh secret list` read did not answer, or answered in a shape the check cannot parse. That case already gets its own *cannot tell which repository secrets are set* warning. When the pull-request setting is also off, `secretNames?.has(...) === true` is false, so control falls through to the last arm. That arm tells the adopter that `HARNESS_GIT_TOKEN` **is not a repository secret**, which the check never established.

This breaks the check's own rule, stated in its doc comment: *"cannot tell* is not *missing*"*. The grade is a `warn` either way, and no run is stopped. The adopter is still told something false and is sent to set a secret that may already exist.

**Fix.**
- [ ] Split the off-setting case three ways, keeping the existing two messages for the known cases. The second arm keeps its existing optional-chained condition: the first arm's test is a conjunction, so its else-branch does not narrow `secretNames`, and a bare `secretNames.has(...)` would fail `strict` type-checking.
  ```ts
  } else if (!allowed && secretNames === undefined) {
    warnings.push(`${PR_CREATE_SETTING} is off, and whether ${GIT_TOKEN_SECRET} is set could not be read, so a completed run may not be able to open its draft pull request: turn the setting on under ${PR_CREATE_SETTING_PATH}, or confirm ${GIT_TOKEN_SECRET} is a repository secret`);
  } else if (!allowed && secretNames?.has(GIT_TOKEN_SECRET) === true) {
    notes.push(`${PR_CREATE_SETTING} is off, so a completed run opens its draft pull request with ${GIT_TOKEN_SECRET}`);
  } else if (!allowed) {
    // existing warning, unchanged
  }
  ```
- [ ] Add one line to the check's doc comment, under the `warn` bullet: the pull-request setting off while the secret list was unreadable is a *cannot tell* warning, not a missing-secret one.
- [ ] In `cli/test/doctor.test.mjs`, add a case beside the one asserting `Allow GitHub Actions to create and approve pull requests is off and HARNESS_GIT_TOKEN is not a repository secret`. Its `gh` stub fails `secret list` and answers the `actions/permissions/workflow` read with `{"can_approve_pull_request_reviews": false}`. Assert that the `remote-github` line contains `whether HARNESS_GIT_TOKEN is set could not be read` and does not contain `HARNESS_GIT_TOKEN is not a repository secret`. Run that one file from `cli/` with `npm test -- test/doctor.test.mjs`.
