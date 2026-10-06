### Task 5 — `docs/github-run-control.md`: the deleted branch's pull request, the stopped progress comment, the folded pause

**Goal:** The design of record for run control says what Tasks 2 to 4 made true. A deletion's stop reports on the run's unfinished pull requests as well as on its issue. A stop rewrites the progress comment's `in progress` line to `stopped`. A park that overtakes a requested pause says the pause is folded into it.

**Depends on:** Task 4, the last `cli` task. The facts this task documents, each with the exact text or rule it quotes:
- **Task 2:** every `stopped` report rewrites the progress comment of each pull request it labels, every `- <label>: in progress` line becoming `- <label>: stopped` (`forge_progress_stopped`). A resumed job's first progress pass renders the comment from the ledger again. Nothing happens when `execution.progressComments` is `false`.
- **Task 3:** `stop --branch-gone` (the deletion's stop) reports on the issue as before. It also reports on each pull request whose head is the branch, that comes from this repository, is not merged, and still carries `sdlc-harness: running`, `sdlc-harness: parked` or `sdlc-harness: paused`. Each gets the same `stopped` comment, the `sdlc-harness: stopped` label and its progress comment rewritten. These are found with `gh pr list --head <branch> --state all`. The `pull_request` close job of a pull request whose branch is gone stays quiet, and its line says the deletion's job reports on it.
- **Task 4:** `parked` and `park_loop` comments carry, when the job dropped a requested pause that the run never honoured, the line: *"A pause was requested on this run before it parked, so it is folded into this park: the run waits for the answer and continues once it is answered, and no separate `paused` comment follows."* The `control` reply to `pause` is unchanged.

**Where this task stops.** Only `docs/github-run-control.md`. `push-branch.sh`'s new skip (Task 1) is `docs/remote-execution.md`'s and **Task 6's**. The Gate 12 procedure is **Task 7's**. Leave round 7's and round 8's `### Verified in Gate 12 round …` tables as they are.

### Targets

- `docs/github-run-control.md`:
  - `## 1.`: the paragraph directly after the `pause` reply block;
  - `## 5.`: the table rows `progress`, `parked`, `park_loop`, `stopped` and `stopped (closed or deleted)`;
  - `## 5.`: the paragraphs *Every comment names its next action…* (its last sentence), **Closed or deleted.** and **The progress comment.**;
  - `## 8.`: one new table row, and the existing row *The job's token may edit its own issue comment (`PATCH issues/comments/<id>`)*.

**Work:**

- [ ] **`## 1.`, under the `pause` reply block.** Add one or two sentences: the reply's promise holds when the run yields to the pause. If the run parks first, there is no `paused` comment, and its park comment carries the folded-pause line instead. Quote the line whole, and cite `development.md` → Gate 12 → Round 9, finding 2.
- [ ] **`## 5.` table.**
  - `progress`: "each done, in progress or not started" becomes "each done, in progress or not started, or `stopped` once the run is stopped".
  - `parked` and `park_loop`: add to *What it says*: "and, when a pause requested on the run was overtaken by the park, a line saying the pause is folded into it".
  - Plain `stopped`: add that the progress comment's `in progress` line reads `stopped`.
  - `stopped (closed or deleted)`: *Where it is posted* becomes, for a deleted branch: the issue, read from the task prompt at the newest run's commit, and also every unmerged pull request of the branch, from this repository, still labelled `running`, `parked` or `paused`. Such a pull request was closed by GitHub with the deletion. *The label it sets* applies to each of them, and *What it says* adds that each one's progress comment reads `stopped`.
- [ ] **`## 5.` paragraphs.**
  - *Every comment names its next action…*: its last sentence becomes: a lifecycle comment posted before the branch was deleted is not changed afterwards, and the only comment a stop edits is the progress comment, whose `in progress` line it rewrites to `stopped`.
  - **Closed or deleted.**: "that close is one line in its job's log, and the deletion's job does the stop" becomes "that close is one line in its job's log, and the deletion's job does the stop and reports it on that pull request: the `stopped` comment, the label and the progress comment". Cite Round 9, finding 3.
  - **The progress comment.**: add one sentence on the `stopped` rewrite and the re-render after a resume.
- [ ] **`## 8.` table.** Add a row, using the table's own four columns:
  - **Behaviour:** `gh pr list --head <branch> --state all` lists a pull request whose head branch was deleted, with its labels.
  - **What rests on it:** the deletion's report on the run's pull request (§5, *Closed or deleted*).
  - **Source:** GitHub's documented behaviour, not retrieved here, because unattended runs have no web access; Gate 12 observation (xiv) leg (h) records it.
  - **If it is wrong:** the pull request keeps its label and gets no comment, as before this change, and the issue is still reported.

  In the existing row *The job's token may edit its own issue comment (`PATCH issues/comments/<id>`)*, change two cells and keep the rest of the row as it is:
  - **What rests on it:** after "The progress comment, edited in place rather than posted anew", add "and, after a stop, its `in progress` line rewritten to `stopped` (§5, *The progress comment*)". Then add one sentence: a local `remote-run.sh stop` makes that edit with the operator's own token, on the bot's comment, and that is not verified either.
  - **If it is wrong:** after "each refused edit is one warning line", add "and a stopped run's comment keeps its `in progress` line".

**Verification:**

- Every quoted line matches the code byte for byte: grep `cli/templates/scripts/remote-run.sh` for `PAUSE_FOLDED_NOTE=` and compare the value with the quoted line.
- The `## 5.` table still has six columns in every row: no row gains or loses a `|`. The `## 8.` table keeps four columns in every row, the edited `PATCH` row included.
- `git diff docs/github-run-control.md` touches only the sections listed under Targets.
- Grep the document for `none is open` and `not changed afterwards`. Each remaining hit agrees with the rewrite rule above.
