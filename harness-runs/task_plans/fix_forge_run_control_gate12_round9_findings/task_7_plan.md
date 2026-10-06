### Task 7 — `docs/development.md` Gate 12 procedure: legs (f) and (h) pass conditions, and the poller schedule check

**Goal:** The next Gate 12 round checks what round 9 found. The procedure gains:
- in leg (h), "the branch stays deleted", and the pull request GitHub closed reading `stopped` (findings 1 and 3);
- in leg (f), the folded-pause line when a park overtakes the pause (finding 2);
- in (xiv)'s setup, the poller-schedule check that finding 4 asks for.

**Depends on:** Task 6, the task before this one. The behaviours the pass conditions check:
- **Task 1:** the cancelled job's `Push the branch` step logs `push-branch.sh: origin no longer has <slug>, which this checkout tracks; not pushing it back …`, and origin keeps no `refs/heads/<slug>`.
- **Task 3:** the deletion's stop posts the `stopped` comment (`its branch was deleted, so the run cannot be resumed`) and sets `sdlc-harness: stopped` on the issue and on each unmerged same-repository pull request of the branch still labelled `running`, `parked` or `paused`.
- **Task 2:** each such pull request's progress comment reads `stopped` where it read `in progress`.
- **Task 4:** a park that overtakes a requested pause carries *"A pause was requested on this run before it parked, so it is folded into this park: the run waits for the answer and continues once it is answered, and no separate `paused` comment follows."*
- **Task 5:** `docs/github-run-control.md` → `## 8.` gained the row *`gh pr list --head <branch> --state all` lists a pull request whose head branch was deleted, with its labels*, which leg (h) settles.

**Where this task stops.** The procedure only: (xiv)'s setup, leg (f)'s pause step and leg (h)'s deletion step with its **What it settles**. The round 9 record is **Task 8's**, and it goes above **Setup.**, so the two tasks touch different lines. Leave every round's dated record as it is.

### Targets

- `docs/development.md` → `## 5. Verifying a change` → Gate 12:
  - (xiv)'s setup, after the paragraph beginning "Passes when `harness-run`, `harness-resume`, `harness-trigger` and `harness-control` are each listed by that name";
  - leg (f), the pass condition after the `@SDLC-HARNESS pause` command;
  - leg (h), the pass condition after the `gh api -X DELETE …/git/refs/heads/<slug>` command, and the **What it settles** paragraph.

**Work:**

- [ ] **(xiv)'s setup, the poller.** After the workflow-list pass condition, add the check from finding 4's *To check next round*:
  - read `harness-resume.yml`'s record and state;
  - enable it when it reads `disabled_manually`;
  - after the adoption push, watch for its first `schedule` run within about an hour;
  - if none comes, record the record's id and state, then make a trivial edit of the file, push it, and record whether ticks start.

  Give each command its own fenced block, one command per line:

  ```
  gh workflow view harness-resume.yml --repo <owner>/<scratch-repo>
  ```

  ```
  gh workflow enable harness-resume.yml --repo <owner>/<scratch-repo>
  ```

  ```
  gh run list --repo <owner>/<scratch-repo> --workflow harness-resume.yml --event schedule
  ```

  Say that this records `docs/remote-execution.md` → `## 6.`'s row on a reused `schedule` record, and that a missing tick is an observation, not a failed setup.
- [ ] **Leg (f).** After "Passes when a `harness-control.yml` run for it gets past its `if:` and a reply follows, accepted or refused by the run's state.", add: when the pause is accepted and the run parks before it yields, the park's comment carries the folded-pause line, quoted whole, and no `paused` comment follows. When it yields first, a `paused` comment follows. Record which happened.
- [ ] **Leg (h), the deletion.** Extend the pass condition: the run's pull request, the draft the resume opened, which GitHub closes with the deletion, also carries a `stopped` comment and `sdlc-harness: stopped`, and its progress comment reads `stopped` where it read `in progress`. The branch also stays deleted: once the cancelled `harness run <slug>` run has finished, origin has no `<slug>`, and its `Push the branch` step logs the `no longer has <slug>` line. Add the reads, each in its own fenced block:

  ```
  gh api repos/<owner>/<scratch-repo>/branches/<slug>
  ```

  ```
  gh pr view <pr> --repo <owner>/<scratch-repo> --json state,labels
  ```

  ```
  gh run view <run id> --repo <owner>/<scratch-repo> --log
  ```

  The first answers `HTTP 404` (`Branch not found`). The legs run from another device with the machine off, so the check goes through the API rather than a local clone. Record the step's line and the pull request's labels.
- [ ] **Leg (h), What it settles.** Add: leg (h)'s deletion also settles `docs/github-run-control.md` → `## 8.`'s row *`gh pr list --head <branch> --state all` lists a pull request whose head branch was deleted, with its labels*.

**Verification:**

- Every command added sits alone in a fenced block, one command per line, as the ledger's adopter-facing rule requires: grep the diff for an added inline backticked `gh ` or `git ` command outside a fence and find none.
- The quoted folded-pause line equals `PAUSE_FOLDED_NOTE`'s value in `cli/templates/scripts/remote-run.sh`, byte for byte.
- `git diff docs/development.md` changes nothing above the line `**Setup.**`.
