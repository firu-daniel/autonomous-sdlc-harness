### Task 31 — Close the forge debt in `ROADMAP.md` and `docs/development.md`, and add Gate 12 observation (xiv)

**Goal:** The two records of what is still owed say the forge coupling is delivered for GitHub:

- `ROADMAP.md`'s *Cloud / CI execution* row stops listing pull requests, comments and draft pull-request output as open;
- `docs/development.md` → `## 6.`'s forge paragraph records its remaining debt as paid.

Gate 12, the hand-run gate against a real repository, gains observation (xiv), the procedure that records run control on GitHub itself. Every automated case drives a `gh` stub, so acceptances 1–6 are observed only there. The gate's existing label commands change to `sdlc-harness`.

**Depends on:** every earlier task's behaviour, restated where (xiv) observes it:

- **The trigger.** Labelling an issue `sdlc-harness` starts a run and sets `sdlc-harness: running` on the issue.
- **A park.** It posts each question as a comment. `@sdlc-harness answer <n>` answers it, with a reply naming the actor, then a `resumed` comment.
- **Pause and resume.** `@sdlc-harness pause` and `resume` work with replies, and the job posts `paused`, with the label moving to `sdlc-harness: paused`.
- **Completion.** A completed run opens a draft pull request whose body reads `Started from #<n>`, shown in the issue's timeline. A `completed` comment names it, and both items carry `sdlc-harness: done`.
- **A review requesting changes**, with inline comments, places `chore: add user review for <branch>` with the comments' files, lines, commits and hunks, and dispatches a round. A review left as *Approve* or *Comment* yields a skipped control job.
- **Refusals.** A comment whose first word is not the handle yields a skipped job or no action. A review submitted while a round runs gets a refusal reply.
- **Stop.** `@sdlc-harness stop` leaves a `stopped` comment naming the actor and `sdlc-harness: stopped`.
- **Not verified.** `docs/github-run-control.md` → `## 8. What is not verified here` lists the rows (xiv) settles.

**Where this task stops.** It writes the procedure. Running it is the **Manual setup required** step in the story index, after release. It records no result, and it records no measured figure from inside a session (the lessons ledger's wall-clock rule). The round records of rounds 1–5 are dated history and stay unchanged, including round 5's mention of the label `harness`.

### Targets

- `ROADMAP.md` — the *Cloud / CI execution* row.
- `docs/development.md`:
  - `## 6.`, the paragraph opening *"The second was **the reader for the `forge` configuration key**"*;
  - Gate 12's introduction, observation (xiii)'s fenced label commands, a new observation (xiv), the *"What still owes a first recording"* sentence, and **Teardown.**

**Work:**

- [ ] **`ROADMAP.md`**: in the *Cloud / CI execution* row, after the issue trigger's sentence, add *"**Run control has shipped:** comment commands, review rounds, lifecycle comments, state labels and draft-pull-request output, gated on `forge` `github` ([`docs/github-run-control.md`](docs/github-run-control.md))."* **Still open** keeps only trackers beyond the documented `repository_dispatch` route. Replace *"A remote run still ends at a pushed branch"* with: a remote run ends at a pushed branch and, with `forge` `github`, a draft pull request; merging stays the operator's. The status cell is the row's own to judge. Leave it `Open` while *Still open* is non-empty.
- [ ] **`docs/development.md` → `## 6.`**: the sentence *"The debt that remains is the coupling's other two parts, draft-pull-request output and comment-based park-and-ask: they carry no reader because nothing implements them, and `config.md`'s row names them."* becomes a statement that they have landed with their readers:
  - `remote-run.sh`'s `deliver`, `report` and `control`, and the `harness-control.yml` workflow `init` writes;
  - under the same reporter, `doctor` → `forge`, which grades the control workflow;
  - so the debt is paid, and `config.md`'s row says the coupling is delivered.
- [ ] **Gate 12's existing text**:
  - the introduction's *"Thirteen observations"* becomes fourteen;
  - in observation (xiii), the fenced `gh label create harness` and `… --add-label harness` become `sdlc-harness`;
  - **Teardown.** deletes the label `sdlc-harness` and the six `sdlc-harness: <state>` labels, each command in its own fenced block or named as the one `gh label delete <name>` form, and closes the round's pull request with `gh pr close <number> --delete-branch` before the branches are deleted;
  - *"What still owes a first recording"* adds (xiv).
- [ ] **Observation (xiv), *Run control from GitHub with the machine off***, after (xiii), in its style, with every command in its own fenced block.
  - **Setup.** `forge` `github` and `execution.target` `github-actions` at `<version>`. `init` writes the four workflows; commit, `gh auth refresh -s workflow` and `git push --no-verify` to the default branch; `gh label create sdlc-harness`. Switch on *Allow GitHub Actions to create and approve pull requests* by hand in Settings and record the `gh api repos/<owner>/<scratch-repo>/actions/permissions/workflow` answer before and after. Then `doctor --check-github`, which passes the setup when `remote-github` names both forge workflows and no setting warning. Then stop the local watcher and switch the machine off.
  - **Legs, from another device:**
    - **(a)** label an issue whose task forces a clarification;
    - **(b)** answer the posted question with `@sdlc-harness answer 1`;
    - **(c)** `@sdlc-harness pause`, then `@sdlc-harness resume`;
    - **(d)** let it complete, and read the pull request with `gh pr view <number> --json isDraft,body,headRefName` and the issue's timeline;
    - **(e)** submit a review requesting changes with two inline comments, and read the round file on the branch. Record which token opened the pull request the review is on — its author from `gh pr view <number> --json author` (`app/github-actions` for the job's token, else the owner of `HARNESS_GIT_TOKEN`) — and that the reviewing account is not that author. When `HARNESS_GIT_TOKEN` was set with the reviewing account's own token, record the refusal GitHub gives that account instead, which settles the author-cannot-request-changes row of `## 8.`;
    - **(f)** the refusals: `@sdlc-harness approve` gets the verb list; `pause` without the handle starts no control job; an *Approve* review is a skipped job; a second review while (e)'s round runs gets the in-flight reply; `@SDLC-HARNESS pause` settles the prefilter's case-insensitivity row;
    - **(g)** `@sdlc-harness stop`.
  - **Pass conditions** per leg are the behaviours under **Depends on**. Record each reply's first line exactly and the labels each item carries after each leg (`gh issue view <n> --json labels`). Leg (f)'s non-write account is recorded as not runnable on a personal repository, as round 5's leg (b) was.
  - **What it settles**: name the rows of `docs/github-run-control.md` → `## 8.` that (xiv) settles, by their behaviour text.

**Verification:**

- `git grep -n "Still open" -- ROADMAP.md` shows the *Cloud / CI execution* row's open list naming neither pull requests nor comments.
- `git grep -n -E "label (create|delete) harness|add-label harness" -- docs/development.md` finds nothing outside the round records, which use no fenced command.
- `git grep -n -E "^\*\*\(xiv\)" -- docs/development.md` finds the new observation, and the introduction's count matches the number of observations listed.
- Every command (xiv) asks a person to run sits in its own fenced block.
