### 4. The prefilter paragraph names branch deletions as the one event that starts a job for any branch, but every same-repository pull-request close does too

**File:** `cli/templates/github/workflows/harness-control.yml` (header, `# THE PREFILTER.` paragraph) — "No label or name marks a run branch at deletion, so every branch deletion in the repository starts a job"

**The problem.** The job's `if:` admits `(github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository)`. That admits the close or merge of **every** pull request from a branch in this repository, harness-run or not: a Dependabot update, a hand-made feature branch. Each such close bills a runner start, and `control` then ends it with one line. The paragraph spells out that cost for deletions only. An adopter estimating what the new triggers cost reads that pull-request closes are filtered when they are not.

**Fix.**

- [ ] Replace that sentence with: `No label or name marks a run branch at deletion, and none reliably marks a run's pull request before its first lifecycle event, so every branch deletion and every closed same-repository pull request in the repository starts a job, which \`control\` ends in one line when the branch had no run.`
