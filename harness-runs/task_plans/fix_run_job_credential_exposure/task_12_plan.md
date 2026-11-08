### Task 12 — Bring `github-run-control.md`, `cli.md` and `github-issue-trigger.md` in line with the new token flow

**Goal:** Three adopter-facing documents still say that `HARNESS_GIT_TOKEN` pushes the run's commits, so the adopter's CI runs from the first push, and that a workflow-capable token lets a job push a `.github/workflows/*` edit. One also describes `push-branch.sh`'s checks without the new credential scan. Correct each site to the design `docs/remote-execution.md` now records, citing it rather than restating it (goal 6).

**Depends on:**

- **Task 11.** `docs/remote-execution.md` → `## 11. Security` (or `## 9.`) holds the decision:
  - `HARNESS_GIT_TOKEN` is referenced only by the agent-free `open` job (opens the draft pull request) and `deliver` job (flips it ready, so CI gets `opened` and `ready_for_review`);
  - the `run` job pushes with `github.token` from a stored entry, and those pushes start no workflow;
  - a `.github/workflows/*` edit cannot be pushed from a job;
  - its `### Upgrading` bullet names the CI `ready_for_review` change.
  - the re-toggle and the gap it leaves on a plan without drafts, and the workflow-file refusal at a job's first push, both in its decision block.
- **Task 3.** `push-branch.sh` scans the commits to send after its remote checks and before the push. Then, only in a GitHub job (the job push-credential marker set), it refuses commits that change a file under `.github/workflows/`. Either refusal is a `refusing to push: …` line plus a record, and the wrapper exits 0.
- **Task 5.** `deliver` flips with `HARNESS_GIT_TOKEN` when set. With the secret set and the pull request already ready, it converts it back to a draft with the job's token first, then flips it ready. A refused conversion is one warning line, and the pull request stays ready.

### Targets

- `docs/github-run-control.md` — setup list items 9 and 11, `## 4. The draft pull request` → **What opening at the start changes.**, **Its draft state follows the run.** and **The token.** with its bullets, and the two `## 8.` rows on `gh pr ready` and its undo form (*"The job's token may mark a pull request ready for review and convert it back to draft"*, *"A draft cannot be re-converted on a plan without drafts"*).
- `docs/cli.md` — the pull-request-setting paragraph before `gh secret set HARNESS_GIT_TOKEN`, and §6 → **The excluded rule's `:*` accepts any argument, so all four excluded scripts check their target first…**.
- `docs/github-issue-trigger.md` — **A task that edits `.github/workflows/*` cannot push that edit with the job's own token.**

**Work:**

- [ ] **`docs/github-run-control.md`.**
  - Setup item 9 drops *"if tasks will edit `.github/workflows/*`"* as a reason. That is no longer possible from a job: cite `docs/remote-execution.md`. It keeps the token's opening role and adds the ready flip. Item 11 stays, worded for the `open` job.
  - In `## 4.`, **What opening at the start changes.** loses *"the repository's CI runs on the draft from the run's first push onwards"*. CI runs on the `opened` event and on the `ready_for_review` flip, and needs `ready_for_review` among its `pull_request` types; cite the upgrade bullet.
  - **Its draft state follows the run.** Its sentence *"a pull request that is not a draft at completion is left as it is, the `completed` comment saying so"* is now true only without `HARNESS_GIT_TOKEN` or when the conversion is refused. With the secret set, `deliver` turns a ready pull request back to a draft and marks it ready again, so the adopter's CI gets `ready_for_review` on each run's final tip. A person who marks it ready mid-run is still left alone until the next transition. Cite `docs/remote-execution.md` for why, and keep *"A refused flip either way is one warning line"* and *"The harness never merges it."*
  - **The two `## 8.` rows on `gh pr ready`.** Add `deliver`'s re-toggle to each row's *what depends on it* cell: the first row for the conversion back to a draft made at delivery; the second for the gap, where on a plan without drafts the re-toggle's conversion is refused, so no `ready_for_review` fires and the adopter's CI does not run on that tip. Leave each row's evidence and *if it is wrong* cells as they are, and add no measurement claim (roadmap item 35 owes it, Task 10).
  - **The token.** and its bullets say the `open` and `deliver` jobs use it, never the job that runs the agent, and keep the existing author-cannot-request-changes cost and the job-token alternative as they are.
  - Leave the setup-notes author bullet, **The issue names the pull request when it opens.**, and the `## 8.` rows on the author and the cross-reference unchanged (scope register row 16).
- [ ] **`docs/cli.md`.**
  - The pull-request-setting paragraph's *"which opens the pull request so the repository's CI runs on it"* becomes the opening plus the ready flip, citing `docs/remote-execution.md` for when CI runs. Keep the `gh secret set HARNESS_GIT_TOKEN` block as its own fenced block.
  - §6's **The excluded rule's `:*` accepts any argument…** paragraph: add that `push-branch.sh`, after its remote checks and before the push, also refuses commits carrying a credential, and, in a GitHub job only, commits that change a file under `.github/workflows/`, and that a refusal is a `refusing to push:` line plus a record the watcher acts on. Cite the script's two header paragraphs by name for what is checked. Keep the paragraph's existing order statements byte-identical where they stay true.
- [ ] **`docs/github-issue-trigger.md`.** The bullet's *"Such a task needs a workflow-capable `HARNESS_GIT_TOKEN`"* becomes: such a task cannot push from a job at all, since the job pushes only with `github.token`, and runs locally. A run started from an issue whose task edits one is marked `failed` at its first push, with a `Push refused` annotation on the job naming the reason, rather than going on with every later push failing. Check what the `failed` lifecycle comment carries before saying it names the reason. Cite `docs/remote-execution.md` for the reason, and keep the S1 citation and the quoted refusal message as they are.

**Verification:**

- `grep -n 'first push onwards\|workflow-capable' docs/github-run-control.md docs/cli.md docs/github-issue-trigger.md` finds no sentence that still states the old design.
- Every changed sentence that states the design cites `docs/remote-execution.md` rather than restating the mechanism (`harness-runs/lessons.md` → *Agent prose*: state a behaviour once, cite it everywhere else).
- Each command an adopter runs stays in its own fenced block, one per line.
- `docs/github-run-control.md`'s **Its draft state follows the run.** no longer says, unqualified, that a pull request not a draft at completion is left as it is. `git diff` of that file's `## 8.` table touches only the two `gh pr ready` rows.
