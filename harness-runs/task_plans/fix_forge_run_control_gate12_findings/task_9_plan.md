### Task 9 — Teach `stop` a reason, an explicit pull request and a deleted branch

**Goal:** Give `remote-run.sh stop` what item 5's close-and-delete stop needs, without changing what a bare `stop` does:
- a reason sentence for its `stopped` comment;
- an explicit pull request, which a closed pull request is, and which the open-PR lookup cannot find;
- a mode for a branch that no longer exists on GitHub.

**The interface this task defines** (Task 11 calls it exactly so):

```
remote-run.sh stop <branch> [--actor <login>] [--note <text>] [--pr <n>] [--branch-gone] [--repo <root>]
```

- `--note <text>` — the `stopped` report's note, in place of `Stopped by @<actor>.` / the local-stop sentence. It is widened from a `report`-only option to `report` and `stop`.
- `--pr <n>` — a positive pull-request number, widened from `collect`-only to `collect` and `stop`. The `stopped` comment and label go to that pull request whatever its state, and the issue still gets the label.
- `--branch-gone` — `stop`-only, and it takes no value:
  - **(1)** the stop marker is dispatched with `--ref` set to GitHub's own default branch (`gh repo view --json defaultBranchRef`, as `verb_warm` reads it) and `-f branch=<branch>`, because the branch's own ref is gone. `remote_branch_stopped` still finds it by its `harness stop <branch>` title, and Task 6 exempts `stop` from the ref check for this reason;
  - **(2)** the cancel step is unchanged, since `run list --branch` still lists a deleted branch's runs;
  - **(3)** the issue is read from the task prompt at the newest `harness run <branch>` run's `headSha`, through `gh api repos/{owner}/{repo}/contents/<state_dir>/task_prompts/<branch>_task_prompt.md?ref=<sha>`, because `refs/remotes/origin/<branch>` no longer exists. A failed read means no issue, and one line;
  - **(4)** the report's `stopped` text says the branch was deleted, so the run cannot be resumed, and that its workflow runs and artifacts are kept. It never says to comment `resume`.

**Depends on:** Task 8, the previous editor of `cli/templates/scripts/remote-run.sh`.

**Where this task stops.** `stop` and `forge_report`'s `stopped` text only:
- deciding *when* to stop on a close or a deletion is **Task 11**'s;
- skipping an absent branch in `poll` and `continue` is **Task 10**'s;
- the workflow's events are **Task 13**'s.

### Targets

- `cli/templates/scripts/remote-run.sh` — the argument parser (`--note`, `--pr`, a new `--branch-gone`), `usage`, `verb_stop`, `forge_report` (the `stopped` arm and its target choice under an explicit pull request), a helper reading the issue from a commit, and the header (the verb table and the `` `stop` DOES FOUR THINGS `` paragraph).
- `cli/test/remote-run.test.mjs` — new `stop` cases (this task edits it first; **Task 10** after).

**Work:**

- [ ] Parser and `usage`: widen `--note` and `--pr` as above, and add `--branch-gone`. Reject `--branch-gone` and `--pr` on any other verb with the existing `usage "<flag> is a … option"` form.
- [ ] `verb_stop`:
  - under `--branch-gone`, dispatch the marker on GitHub's default branch;
  - pass `--note` (or the existing default note) and the pull-request / branch-gone choices into `forge_report stopped`;
  - leave the local-registry write exactly as it is.
- [ ] `forge_report`, for `stopped` only:
  - under an explicit `--pr`, the target is that pull request and `FORGE_PR` is set to it, so both labels are written;
  - under `--branch-gone`, skip `forge_fetch_branch`, take `FORGE_ISSUE` from a new `forge_issue_at_commit_var <branch> <sha>`, which runs the contents read and parses the same provenance line `forge_issue_var` does (share the line parser rather than copy it), and use the deleted-branch `stopped` text.

  Every other event is unchanged.
- [ ] Header: add the three options to the verb table's `stop` line. Extend the `` `stop` DOES FOUR THINGS `` paragraph with the marker's ref under `--branch-gone`, the explicit pull request and the note. Note that the issue lookup at a commit rests on GitHub serving a commit no branch points at (Task 17 adds the §8 row).
- [ ] `cli/test/remote-run.test.mjs`:
  - `stop <b> --note "Stopped because @x closed issue #7."` posts that note;
  - `stop <b> --pr 9` with `pr list` answering `[]` posts on #9 and labels #9 `sdlc-harness: stopped`;
  - `stop <b> --branch-gone` records `workflow run harness-run.yml --ref <default> -f action=stop -f branch=<b>`, reads `contents/…?ref=<sha>`, and comments on the issue it names with the deleted-branch text, while the fixture's `origin` carries no `<b>` at all;
  - `--branch-gone` on `pause` is a usage error.

**Verification:**

- `npm test -- test/remote-run.test.mjs` from `cli/` passes, the existing `stop` cases unchanged.
- A bare `stop <b> --actor <login>` records the same `gh` calls, in the same order, as before this task. The existing case asserting that sequence still passes untouched.
- `grep -n "Started from" cli/templates/scripts/remote-run.sh` shows one provenance-line parser, shared by `forge_issue_var` and the commit variant.

**Deviations from plan:**
- The newest `harness run <branch>` run's `headSha` comes from `verb_stop`'s own run listing, whose `--json` fields gain `headSha,createdAt` under `--branch-gone` only, so a bare `stop` records the same calls; no second listing is made.
- `forge_report` takes the explicit pull request and the deleted-branch choice as positional arguments 4–6 (`<pr>`, `gone`, `<sha>`), read on `stopped` only; under `--branch-gone` without `--pr` no open-PR lookup is made, since GitHub closes a pull request whose head is deleted.
- GitHub's default-branch read is extracted from `verb_warm` into `github_default_branch_var`, shared by `warm` and `stop --branch-gone`.
- The contents read sends `Accept: application/vnd.github.raw`, so the prompt arrives as text rather than base64.
- The header's unverified-fact pointer cites `docs/github-run-control.md` -> `## 8. What is not verified here`, the §8 Task 17 edits.
