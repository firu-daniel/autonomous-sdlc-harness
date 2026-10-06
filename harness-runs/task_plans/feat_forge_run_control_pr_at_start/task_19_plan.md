### Task 19 — `docs/development.md`: Gate 12 (xiv) checks each transition, and roadmap item 19 ships

**Goal:** Make the hand-run Gate 12 observation (xiv) observe what this branch ships, and record roadmap item 19 as shipped. The legs gain `isDraft` at each transition, the issue's link to the pull request before completion, the resolved threads after a round, and the progress comment. They also stop expecting park questions and lifecycle comments on the issue, since the pull request now exists from the run's start.

**Depends on:** Tasks 15 and 16, the design of record these legs observe. The behaviour, restated:

- **The start.** When the run's first job starts, `harness-run.yml`'s `Open the draft pull request` step opens a **draft** pull request (`isDraft` `true`, body ending `Started from #<issue>.` before the commands, label `sdlc-harness: running`). It posts on the issue a comment naming `#<pr>` and its URL (hidden marker `event=opened`). From then on every lifecycle comment, park questions included, goes to the pull request. Commands typed on the issue still act on the run, and their replies are posted where they were typed.
- **The progress comment.** One comment per run or round on the pull request (marker `event=progress`, plus `round=<n>` for a round), edited in place, listing *Planning / Implementation / Branch review / Done* (a round: *Fix plan / Fix implementation / Branch review / Done*), each `done`, `in progress` or `not started`.
- **Completion.** `completed` is posted on the pull request and on the issue (the issue's names `#<pr>` and its URL). The pull request is marked ready (`isDraft` `false`), and both items carry `sdlc-harness: done`.
- **A round.** Its started-round comment turns the pull request back to draft (`isDraft` `true`). Its `completed` marks it ready again. Each collected inline comment whose finding was implemented gets a reply ``Addressed in `<sha>`.`` and its thread is resolved. One filed as invalid or out of scope gets the reason and stays unresolved. No review is dismissed.
- **New §8 rows (Task 16)** that these legs settle: the job's token marks a pull request ready and converts it to draft; it replies to a review comment; `resolveReviewThread` accepts it; a review comment's GraphQL `databaseId` equals the REST `id`; and it edits its own issue comment.

**Where this task stops.** `docs/development.md` only: observation (xiv)'s introduction, legs (a)–(e), (g), (h) and *What it settles*, plus `## 6.`'s row 19 and the paragraph below the table that lists shipped items. The dated round records (*Round 6* … *Round 8*) are records and are not edited. This task runs no gate: (xiv) is run by hand, outside any harness session.

### Targets

- `docs/development.md` — `## 5. Verifying a change` → observation **(xiv) Run control from GitHub with the machine off.** (its introduction, legs (a)–(e), (g), (h), *What it settles*); `## 6. The roadmap this tree defers to` → row 19 and the paragraph beginning *"**Items 3, 4, 13 and 14 have shipped**"*.

**Work:**

- [ ] (xiv)'s introduction: replace *"`<number>` is the issue's number until leg (d) names the pull request's"*. The pull request exists from leg (a) on, so name the two numbers apart (`<issue>`, `<pr>`) in every leg that reads both, and add the pull-request comment read command beside the issue's, each in its own fenced block:

  ```
  gh pr view <pr> --repo <owner>/<scratch-repo> --comments
  ```

- [ ] Leg (a): passes when the issue carries the trigger's comment naming `<slug>` and, **once the run's job starts and before the run completes**, the `opened` comment naming `#<pr>` and its URL. The pull request read with `gh pr view <pr> --repo <owner>/<scratch-repo> --json isDraft,body,labels` (fenced) shows `isDraft` `true`, the body's `Started from #<issue>.`, and `sdlc-harness: running`. The pull request carries one progress comment whose *Planning* line moves to `done`. Once the run parks, the **pull request** carries one comment per open question (unchanged content checks) and both items carry `sdlc-harness: parked`. Legs (b) and (c): the commands stay on the issue, replies are posted where typed, the `resumed`/`paused` comments land on the pull request, and `isDraft` stays `true` through the pause.
- [ ] Leg (d): passes when `isDraft` is **`false`** after completion, `completed` is on the pull request **and** on the issue (the issue's naming the pull request's URL), the progress comment reads `done` on all four lines, and both items carry `sdlc-harness: done`. Keep the existing `HARNESS_GIT_TOKEN` timeline record. Leg (e): after the review requesting changes, the started-round comment is on the pull request and `isDraft` is **`true`**. Have one of the two inline comments ask for something the fix plan will file as out of scope. Once the round completes, `isDraft` is `false`, and the threads read with the fenced command below show the implemented comment's thread `isResolved: true` with a reply ``Addressed in `<sha>`.`` naming a commit on `<slug>`, the other thread unresolved with a reply giving the reason, and the review still `CHANGES_REQUESTED`. A round progress comment exists with its four lines.

  ```
  gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){reviewThreads(first:20){nodes{isResolved comments(first:10){nodes{databaseId body}}}}}}}' -f o=<owner> -f r=<scratch-repo> -F n=<pr>
  ```

- [ ] Legs (g) and (h): the `stopped` comment on the pull request says its draft stays open. Leg (h)'s closed-pull-request path is unchanged. Record `isDraft` before the close (`true`). *What it settles*: add the new §8 rows above, with leg (d) settling the ready flip and leg (e) settling the draft conversion, the reply, `resolveReviewThread`, the `databaseId` match and, through the progress comment's edit, the comment `PATCH`.
- [ ] `## 6.` row 19: prefix **Shipped.** and rewrite the row in the past tense of what it delivered: the `open` step at the run's start with the issue's `opened` link, draft state following the run, `completed` on both items, the target rule generalised, recognition by task prompt or ledger, one progress comment per run or round behind `execution.progressComments`, and round threads replied to and resolved. Name the two proposals' outcomes, the Development panel **dropped** and the threaded answer **not taken**, in one sentence each, pointing at `docs/github-run-control.md` → §4 and §3. Add 19 to the list of shipped items in the paragraph below the table.

**Verification:**

- Grep `docs/development.md` for `is the issue's number until leg (d)` and find nothing. Grep it for `isDraft` inside (xiv) and find it in legs (a), (c) or (d), (e) and (h).
- Every command added to (xiv) sits alone in its own fenced block, one command per line (lessons ledger, *Adopter-facing documentation*). Check with `git diff HEAD -- docs/development.md` before committing.
- Row 19 opens with `**Shipped.**`, and the round records *Round 6*, *Round 7* and *Round 8* show no hunk in that diff.

**Deviations from plan:**

- Leg (f)'s commands also had `<number>` / `<issue number>` renamed to `<issue>` / `<pr>`: the introduction's `<number>` definition was removed, so leaving them would have cited an undefined placeholder. Its pass conditions are unchanged.
- Leg (e)'s post-round read (threads, `isDraft` `false`, the round progress comment) is placed at leg (f)'s step that waits for (e)'s round to complete, because (f) acts while that round is still running.
- `gh pr list --head <slug>` moved from leg (d) to leg (a), where the pull request now first exists.
