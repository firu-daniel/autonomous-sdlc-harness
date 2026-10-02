### Task 17 — `github-run-control.md` §2, §4, §5, §6 and §8: stopped wording, the pull request's link, closes and deletions, and the new §8 rows

**Goal:** Make the rest of `docs/github-run-control.md` state item 5's close-and-delete stop, item 11's `stopped` wording and item 8's decision on the issue's link. Give every new behaviour that rests on an unverified GitHub fact its §8 row.

**Depends on:** Task 16, the previous editor of this file (§1 and §3). This task also documents:
- Tasks 9 to 13. A close of the run's issue, or of a pull request from its branch (closed or merged), or the deletion of its branch, by an actor who passes the §6 check (for a deletion, only a bot is checked) stops an unfinished run through `remote-run.sh stop`. It posts *"Stopped because @<login> closed issue #<n>."* (or *"closed pull request"*, *"merged pull request"*, *"deleted the branch"*), sets `sdlc-harness: stopped`, and keeps the runs and artifacts. Every other case is a log line. A deleted branch's marker is dispatched from the default branch, and its issue is read from the newest run's `headSha` through the contents API. The poller and `continue` skip a branch absent on `origin`. `harness-control.yml` listens to `issues: [closed]`, `pull_request: [closed]` and `delete`;
- Task 7: replies name a stopped run `stopped`, derived from the run list;
- Task 15: roadmap item 19, the operator-decided design changes (items 4, 13 and 6), among them the draft pull request opened when the run starts. Row 19 does **not** carry the Development-panel link, which this task records as a proposal.

**Where this task stops.** Sections 2, 4, 5, 6 and 8 of this one file. `docs/remote-execution.md` is **Task 18**'s, and the Gate 12 legs are **Task 19**'s.

### Targets

- `docs/github-run-control.md` → `## 2. A review that requests changes starts a round` (*A run in flight*), `## 4. The draft pull request` (*The plain mention*), `## 5. Lifecycle comments and state labels`, `## 6. Who can act, and pull requests from forks`, `## 8. What is not verified here` and its *Verified in Gate 12 round 6* table.

**Work:**

- [ ] §2 *A run in flight*: a stopped run is named `stopped` in the reply, with `@sdlc-harness resume` as its way on, wherever the paragraph lists the states.
- [ ] §4 *The plain mention*:
  - with the job's token, GitHub puts no cross-reference on the issue: no `cross-referenced` event appeared in Gate 12 round 6, 45 minutes after the pull request opened;
  - the issue's link to the pull request is the `completed` comment's URL;
  - whether a pull request opened with `HARNESS_GIT_TOKEN` links the issue is unmeasured (a §8 row);
  - linking through the issue's Development panel is a **proposal to the maintainer**, not owed work: once the pull request opens with the run (roadmap item 19), the branch could be created already linked to the issue. No roadmap item carries it, and the paragraph must not say any will (`harness-runs/lessons.md` → `## Evidence and measurement`).

  Then replace *"the flow does not own the issue's lifecycle"* with what it now does. Closing the issue stops the run (§5), and merging the pull request still never closes the issue.
- [ ] §5:
  - add a table row, `stopped (closed or deleted)`: *the item acted on — the closed pull request, else the target — and the issue's label* / *the run was stopped because @<login> closed or merged it, or deleted its branch; runs and artifacts are kept* / *`@sdlc-harness resume` while the branch exists; none once it is deleted* / `sdlc-harness: stopped`;
  - add a paragraph stating the actor rule (a close by anyone failing §6 is ignored, and the item stays closed), that a completed or failed run is left alone, that reopening resumes nothing, and that the poller and the automatic resume never re-dispatch a deleted branch;
  - note that a `failed` or `stopped` comment's way on assumes the branch exists.
- [ ] §6: one paragraph, **Closing and deleting.**
  - a close is authorised as a command is;
  - triage can close issues and pull requests, but cannot stop a run that way;
  - a deletion needs write access, so only a bot is checked;
  - the job replies to none of them;
  - a fork's closed pull request is skipped by the shipped `if:` and runs the fork's copy, as a review does (C2).
- [ ] §8: add rows (*Behaviour / What rests on it / Source / If it is wrong*), each sourced as *"GitHub's documented behaviour, not retrieved in `github-integration-research.md`"*:
  - a `delete` event's workflow runs from the default branch;
  - a `pull_request` `closed` job runs the merge-commit copy of the workflow;
  - triage may close issues and pull requests;
  - the contents API serves a file at a commit no branch points at any more (issue lookup after deletion);
  - a workflow can be dispatched from the default branch while its `branch` input names a deleted branch;
  - a pull request opened with `HARNESS_GIT_TOKEN` puts a cross-reference on the issue its body mentions.

  Add to *Verified in Gate 12 round 6* the measured row: *a pull request opened, and a comment posted, with the job's token put no `cross-referenced` event on the issue they mention* (issue #8, pull request #9, 45 minutes).

**Verification:**

- Every behaviour the §5 paragraph states maps to a case in Task 12's `cli/test/remote-control-close.test.mjs` or Task 10's `remote-run.test.mjs` cases. Read them side by side.
- `grep -n "does not own the issue" docs/github-run-control.md` finds no sentence still claiming a close changes nothing.
- `grep -n "Development panel" docs/github-run-control.md` finds only the §4 proposal sentence, and none of its hits says the link belongs to, or is owed by, a roadmap item.
- Each new §8 row has all four cells filled, and none cites a source this repository did not retrieve as if it had.
