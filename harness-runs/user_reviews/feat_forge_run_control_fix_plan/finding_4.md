### 4. The design of record still says a review in flight is refused and must be resubmitted, and the push-race question is undecided

**File:** `docs/github-run-control.md` (`## 2. A review that requests changes starts a round`, the **A run in flight.** paragraph) — "Nothing is queued. Submit the review again once the run finishes."

Also touched by this finding:

- `docs/github-run-control.md`:
  - the opening **Who reads this** paragraph, which names `control`, `report` and `deliver`;
  - §2's **What the round carries.**, "Other people's comments are not collected.", **How it is sent.** and **Comments left while a round runs are not lost.**;
  - §5's table, the `stopped` and "a started round" rows;
  - §6's **What a commenter vouches for.** ("and nobody else's");
  - §8's row "A newer pending run in `harness-run.yml`'s `concurrency` group cancels an older pending one".
- `docs/development.md`, Gate 12 (xiv) leg (f): "Passes when the reply names the run's state and says to submit again once it finishes", and its **What it settles.** paragraph.

**Problem.** Findings 1–3 change the behaviour this document is the design of record for. Left as it is, it tells a team to resubmit, says other reviewers' comments are not collected, and gives the refusal rationale the user has overturned. The user also asked the fix plan to settle an open question: should pushes from the control job and the run fetch, rebase and retry when a push loses a race?

**Decision on the open question: no fetch, rebase or retry.**

After Findings 1–3, the branch has one writer at a time:

- The run's `run` job holds `harness-run-<branch>`.
- A round is placed only by a review job or the `collect` job. Both hold `harness-review-<branch>`, and both place a round only when the settledness test says no `run` job is running or queued.
- `review` waits until its own dispatch is listed before it releases the group.

So a lost push means something outside that invariant pushed: a person's own push, or a local `/autonomous-sdlc-harness:branch-user-review` racing a GitHub round. Retrying would hide that, and would break things:

- **For the run's job**, an automatic rebase replays the run's commits on top of someone else's. The pushed history then differs from the tree its gates and reviews ran against, and an unattended job has no one to resolve a conflict.
- **For a round placement**, a retry would re-number and re-collect a round another writer has just placed. That is the double round the serialization exists to prevent.

So a lost push stays a loud failure. `review` exits 4 and nothing is dispatched. The reviews stay on the pull request, and because collection is cumulative, the next collection takes them. Nothing is lost.

**Fix — `docs/github-run-control.md`.**

1. **Opening paragraph.** Name `collect` beside `control`, `report` and `deliver`, and the `collect` job beside `harness-control.yml`'s header as code of record.
2. **§2 *What the round carries.*** Rewrite it as Finding 2's rule:
   - every review requesting changes and every inline comment, from every authorised reviewer, made since the previous round and not recorded by any earlier round;
   - the layout: `## Review by @<login>` sections, `## Inline comments` with the added `By @<login>: <url>` line, and the closing marker;
   - the overlap and id check, and the legacy boundary.

   Delete "Other people's comments are not collected. Only the reviewer who submitted the review has vouched for them." State instead that each item is collected only when its own author passes the §6 check, so each author vouches for their own text. Keep **Why each comment carries its commit and hunk.**, which still holds, and add the author line.
3. **§2 *A run in flight.*** Replace the paragraph:
   - A review arriving while the branch's newest run is queued, running, parked, held in a park loop, paused or stopped is **accepted**. The reply says it was collected and what the run is waiting for.
   - When that run ends `completed` or `failed`, the `collect` job of `harness-run.yml` starts the next round from every review collected meanwhile, with nobody resubmitting.
   - A review already taken into a round is answered with that round's number.
   - The local `/autonomous-sdlc-harness:branch-user-review` still refuses while a run is in flight, because its text exists only on the user's machine.

   Rewrite **Comments left while a round runs are not lost.** to match.
4. **§2, a new paragraph *One writer at a time*.**
   - the two concurrency groups, and why a replaced pending review job loses nothing;
   - two reviews submitted together become one round;
   - the push decision above, with its reasons;
   - "a check at the end of the run, not `concurrency: queue: max`".
5. **§2 *How it is sent.*** Add that the `collect` job sends a round the same way, through `remote-run.sh review`.
6. **§5 table.**
   - In the `stopped` row, replace "a review that requests changes is accepted only once a run of the branch has completed or failed" with "a review that requests changes is collected, and its round starts once the resumed run finishes".
   - In the "a started round" row, say it is posted for a round started by a review or by the end of a run, naming every reviewer it took.
7. **§6 *What a commenter vouches for.*** "A review round carries each authorised reviewer's review and inline comments, each vouched for by its own author, and nothing from anyone the §6 check refuses."
8. **§8.**
   - Rewrite the concurrency row's *What rests on it* column: it now rests only on refusing `answer`, `resume` and `clear` while a job is in flight. Reviews are no longer refused; a replaced pending review job is harmless because collection is cumulative.
   - Add four rows, each with *Source* "not retrieved here" and its *If it is wrong* consequence:
     - *A concurrency group spans workflows in one repository* (the `collect` job and the review jobs share `harness-review-<branch>`). If wrong: a review job and `collect` can place rounds at the same moment, and the loser fails its push loudly; nothing is lost.
     - *An artifact uploaded by a job is listable before its workflow run completes* (the settledness test reads the bundle while `collect` is pending). If wrong: the branch reads in flight until the run completes, and the review is answered "collected" and taken by that run's `collect`.
     - *The jobs API names a job with no `name:` key by its key, `run`*. If wrong: no run ever reads settled before it completes, and reviews are collected rather than placed until then.
     - *`concurrency: queue: max`, reported as added on 2026-05-07*. Not verified (no retrieval of GitHub's documentation in this branch). Nothing in this design rests on it.

**Fix — `docs/development.md`, Gate 12 (xiv).**

- In leg (f), replace the pass criterion after the second `gh pr review … --request-changes` with: "Passes when the reply says the review was collected, with no `submit again`, and no second `chore: add user review for <slug>` commit appears while (e)'s round runs; then, once that round completes, the `harness-run.yml` run's `collect` job places `<slug>_review_2.md` carrying that review's body under `## Review by @<login>`, a `harness run <slug>` run follows, and the pull request carries the started-round comment naming the reviewer."
- Add one step: from a second account with write access, submit a review requesting changes at the same moment as the first account's. It passes when one round file carries both `## Review by` sections and only one round commit appears. Record it as not run where only one account with write access exists.
- In **What it settles.**, add the three new §8 rows to the list of rows these legs settle.

**Note for the implementer.** This finding contains no lessons-ledger or rule-document edits. The decision on the open question is recorded only in §2 of `docs/github-run-control.md`.
