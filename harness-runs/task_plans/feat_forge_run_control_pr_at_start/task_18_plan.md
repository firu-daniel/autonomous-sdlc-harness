### Task 18 — `docs/cli.md`, `docs/watcher.md`, `README.md` and `ARCHITECTURE.md`: a run's pull request opens at start

**Goal:** Correct the four remaining corpus sites that say a *completed* run opens its draft pull request, or that `deliver` is what opens it. Each now states that the run's draft pull request opens when the run starts and is marked ready when it completes. `docs/cli.md` also quotes the reworded `doctor` messages.

**Depends on:** Task 11, which rewords the CLI's own messages. `doctor`'s `remote-github` pull-request-setting lines now read *a run may not be able to open its draft pull request when it starts*, *a run opens its draft pull request with `HARNESS_GIT_TOKEN`*, and *a run cannot open its draft pull request with the job's token*. The `forge` check's summary reads *and a run opens a draft pull request when it starts, marked ready for review when it completes*. `init`'s step opens *A run opens its draft pull request when it starts, with the job's token only once …*. Also Task 4: the job-side verb `open`, run by `harness-run.yml` before the harness step, opens the pull request, and `deliver` marks it ready and posts `completed`.

**Where this task stops.** The four files below, at the anchors named. Every other site the story index's scope register lists is either another task's or recorded `no-change` there with its reason. `docs/github-run-control.md`, `docs/remote-execution.md`, `docs/config.md` and `docs/development.md` belong to Tasks 15–17, 14 and 19.

### Targets

- `docs/cli.md` — the `remote-github` paragraph *"The second is the pull-request setting: a completed run opens its draft pull request with the job's token only once …"*; the `remote-execution`/`remote-github` bullet's *"because a completed run then cannot open its draft p[ull request]"*; and the `forge`-check bullet's *"and a completed run opens a draft pull request"*.
- `docs/watcher.md` — the `remote-run.sh` row's run-job verb list (*"and `deliver`, which opens the draft pull request and posts the `completed` comment"*).
- `README.md` — the scope-and-limits bullet *"**GitHub-coupled on request, and merging is always yours.**"* (*"and a completed run opens a draft pull request"*).
- `ARCHITECTURE.md` — `## 8.`'s forge bullet (*"and a completed run gets a draft pull request"*, and the verb list *"`remote-run.sh`'s `trigger`, `control`, `report` and `deliver`"*), and the `forge` paragraph's *"and open a completed run's draft pull request"*.

**Work:**

- [ ] `docs/cli.md`: rewrite the three sentences to match Task 11's messages word for word where they quote them, keeping each paragraph's remedy and its link to `github-run-control.md` → `## 4. The draft pull request`. Keep each fenced command exactly as it is.
- [ ] `docs/watcher.md`: in the run-job list, add `open`, which opens the run's draft pull request when the job starts, and rewrite `deliver`'s clause to *which marks it ready and posts the `completed` comment on it and on the source issue*. Mention `report`'s `progress` event in its existing clause (*"which posts a lifecycle comment and moves the run's state label"*), as *and keeps the run's progress comment*.
- [ ] `README.md`: *a completed run opens a draft pull request* becomes *the run's draft pull request opens when it starts and is marked ready when it completes*. The opening line (*"comments and reviews steer it to a draft pull request"*) and the `docs/github-run-control.md` link line stay. The scope register records them `no-change`.
- [ ] `ARCHITECTURE.md`: in the forge bullet, add `open` to the verb list, *`trigger`, `control`, `report`, `open` and `deliver`*, and replace *a completed run gets a draft pull request* with *a run gets a draft pull request when it starts, marked ready when it completes*. In the `forge` paragraph, *and open a completed run's draft pull request* becomes *and open the run's draft pull request at its start and mark it ready at its completion*. Leave every `[shipped]` / `[designed]` tag as it is.

**Verification:**

- Run `git grep -n -i -e 'completed run opens' -e 'completed run gets' -e 'completed run cannot' -e 'completed run then cannot' -e 'completed run may not' -e 'a completed run.s draft pull request' -- docs/cli.md docs/watcher.md README.md ARCHITECTURE.md` and find no hit.
- Grep `docs/cli.md` for each Task 11 message fragment quoted above and find it verbatim.
- Every fenced command block in the four files is unchanged, as `git diff HEAD -- docs/cli.md docs/watcher.md README.md ARCHITECTURE.md` shows before committing: no hunk touches a fenced line.

**Deviations from plan:**

- `docs/cli.md` `remote-github` bullet: also added the third Task 11 case, setting off with the secret listing unreadable, which **warns** *a run may not be able to open its draft pull request when it starts* (`cli/src/doctor/checks.ts` → the `secretNames === undefined` branch). The plan quotes that fragment for verification but named no site for it.
- `ARCHITECTURE.md` `forge` paragraph: added `open` to its verb list (*`control`, `report`, `open` and `deliver`*) as well, because that sentence now credits these verbs with opening the pull request at the start, and `open` is the verb that does it.
