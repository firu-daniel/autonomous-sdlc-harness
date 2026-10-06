### Task 17 — `docs/remote-execution.md`: the `open` step, the draft state and the progress comment

**Goal:** State the new behaviour in the remote-run lifecycle document wherever it currently says the pull request opens at completion, and add what an adopter must know about the new step: it arrives through `init --upgrade-workflows`, it carries `HARNESS_GIT_TOKEN`, and a run now keeps a progress comment on its pull request.

**Depends on:** Tasks 4, 5, 6, 7, 9 and 10. Restated:

- `harness-run.yml`'s step **`Open the draft pull request`** runs `remote-run.sh open <branch>` before `Run the harness`, only on a job whose `chain` input is `0`, meaning a job a person's action started. It is `continue-on-error`, carries `HARNESS_GIT_TOKEN` as `HARNESS_PR_TOKEN`, reuses an open pull request, and otherwise opens a draft. One ready retry follows any failure but the Actions setting's refusal. On success it names the pull request on the source issue (`event=opened`). On failure it posts nothing.
- **`deliver`**, after the push, marks the draft ready, posts `completed` on the pull request and on the issue, and opens a pull request only when none is open at completion, as a fallback.
- **A user-review round's** start turns the pull request back to draft. A `failed` or `stopped` run leaves its draft open and says so.
- **The progress comment.** The job's watcher reads the ledger in its own checkout on each pass and runs `remote-run.sh report progress` when the four-phase reading changes and once at the job's end. It is one comment per run or round, on the pull request, edited in place, and off when `execution.progressComments` is `false`. A budget continuation posts nothing unless a phase moved.

**Where this task stops.** `docs/remote-execution.md` only. The design of record is `docs/github-run-control.md` (Tasks 15 and 16), and this document cites it rather than restating it (*"It cites rather than restates"*, its own opening).

### Targets

- `docs/remote-execution.md` — `## 1. The lifecycle of a remote run` step `8. **Done.**`; `### Notifications` (the paragraph beginning *"With `forge` set to `github`, each lifecycle event"*); `## 5. The seam, and what stays open` → *The draft pull request is the job's, not the flow's.*; `## 7. Turning it on` step `5a.`; `### Every secret and variable` → the `HARNESS_GIT_TOKEN` row; `### Upgrading` → the bullet *"It does not re-render `harness-trigger.yml` or `harness-control.yml`."*

**Work:**

- [ ] Step `8. **Done.**` and `## 5.`'s *The draft pull request is the job's, not the flow's.*: the draft pull request opens at the run's start, through the run workflow's `open` step, and `deliver` marks it ready and posts `completed` on it and on the source issue. *Without `forge` `github` none is opened, and the flow itself opens none either way* stays. Cite [`github-run-control.md`](github-run-control.md) → `## 4. The draft pull request`.
- [ ] `### Notifications`: add that, with `forge` set to `github`, the job also keeps one progress comment on the run's pull request, ticking over at the four main phases and edited in place, and that `execution.progressComments: false` turns it off ([`config.md`](config.md) → `## 5.`). Keep the sentence that a `budget` continuation sends neither notification nor lifecycle comment. Add that the progress comment shows a phase, never the continuation, citing `## 5. Lifecycle comments and state labels`.
- [ ] Step `5a.`: *so a completed run can open its draft pull request with the job's own token* becomes *so the run can open its draft pull request, when it starts, with the job's own token*. The rest of the step stays as it is, including that there is no command for this step.
- [ ] The `HARNESS_GIT_TOKEN` row: *its `deliver` step (`remote-run.sh deliver`), which opens the draft pull request with it* becomes *its `Open the draft pull request` step (`remote-run.sh open`), which opens the draft pull request with it when the run starts, and its `deliver` step, which does so only when none is open at completion*. Add to the *Set it also so* clause that CI then runs on the draft from the run's first push.
- [ ] `### Upgrading`: add a bullet, or one sentence in the existing *"A repository that re-renders the two pinned workflows without `--force`"* text, saying that `init --upgrade-workflows` adds the `Open the draft pull request` step. Until the outer-loop scripts are re-rendered too, that step's verb is missing and the `continue-on-error` step does nothing, so the pull request opens at completion as before. Show the command an adopter runs in its own fenced block, one command per line (lessons ledger, *Adopter-facing documentation*):

  ```
  npx autonomous-sdlc-harness@<version> init --upgrade-workflows
  ```

**Verification:**

- Grep `docs/remote-execution.md` for `opens a draft pull request from the branch, naming` (the old step-8 wording), `so a completed run can open` and `which opens the draft pull request with it |` and find none.
- Grep it for `progressComments` and find the `### Notifications` sentence linking `config.md`.
- Every `npx …` command added or touched sits alone on its line inside a fenced block. Check with `git diff HEAD -- docs/remote-execution.md` before committing.
