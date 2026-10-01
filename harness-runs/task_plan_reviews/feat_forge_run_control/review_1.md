# Task plan review — iteration 1

Iteration 0's three Must Fix findings are resolved. Derivation entry A has been widened, and rows 3a, 3b, 3c and 6a are added. `task_10_plan.md` checks for a genuine start and runs the shared `control_check_branch`. `task_24_plan.md` and `task_28_plan.md` state the access `HARNESS_GIT_TOKEN` needs. The architecture review's Must Fix on `task_20_plan.md` is resolved too, through the `<scripts_dir>` row.

I re-ran entries A–D exactly as written. Every site they reach is already a row. Re-walking entries E and F found no site missing from the register. Index structure, the 1:1 mapping between index and files, layer tags, points, Work-bullet counts (at most 5 each) and bottom-up ordering all hold.

## Must Fix

1. **A `stop` typed on an issue gets no reply on that issue when the run has a pull request** — `task_10_plan.md`.
   `**Work:**` → *`pause` and `stop`* says: "On 0 nothing more is posted, because the stop's own comment names the actor." That comment comes from Task 8's `forge_report stopped`, and it posts to Task 3's target: *"A comment goes to the open pull request when `forge_recognised` holds for its head, else to `FORGE_ISSUE`"*. Task 10's issue path resolves the branch from the issue's newest genuine start. Once that branch has an open, recognised pull request, the `stopped` comment goes to the pull request. This happens after the first round completes, or when a person opened the pull request. The issue thread where the maintainer typed `@sdlc-harness stop` then gets no reply at all. Goal 4 says: *"Every accepted command gets a reply comment, naming the actor, the command and what was done"*. Every other verb replies through `control_reply` on the item the event came from (`CONTROL_NUMBER`). `stop` is the only exception, and the plan gives a reason for it that does not hold in this case.
   **Fix:** In `task_10_plan.md` → the `stop` bullet, on exit 0, post a `control_reply 0` on `CONTROL_NUMBER` (for example `Stop requested by @<login>; the run on \`<branch>\` is stopped.`) whenever `CONTROL_NUMBER` is not the item `forge_report` posted to. The simplest form is to reply always. Add a case to `remote-control.test.mjs`: `stop` commented on an issue whose branch has an open recognised pull request 12 gives a reply on the issue naming `@alice`, and the `stopped` comment on 12.

2. **When `HARNESS_GIT_TOKEN` opens the pull request, its owner cannot request changes on it, so the plan's recommended setup blocks the review route for a solo maintainer** — `task_6_plan.md`, with `task_24_plan.md`, `task_25_plan.md` and `task_16_plan.md`.
   Task 6 opens the draft pull request with `HARNESS_PR_TOKEN` (= `secrets.HARNESS_GIT_TOKEN`, Task 14) whenever it is set. That token is usually the maintainer's own personal access token, so the pull request's author is the maintainer. GitHub does not let a pull request's author approve or request changes on their own pull request: the REST call is refused with *"Can not request changes on your own pull request"*, and the UI greys the option out. This is documented GitHub behaviour. It is not recorded in `docs/github-integration-research.md`, and an unattended run cannot re-verify it. C1's measurement does not cover this case: there the pull request was *"opened by `app/github-actions`"*.
   The setup Tasks 16, 24, 25 (setup step 9) and 28 recommend therefore leaves the token's owner unable to start a round from GitHub. That is acceptance 2's primary route, and goal 9's *"start a user-review round with a review that requests changes"* for the maintainer who did the setup. No task states this consequence. Task 25's `## 8. What is not verified here` does not list it, and Gate 12 observation (xiv) (Task 31) does not observe it.
   **Fix:** Decide it in `task_6_plan.md`, choosing one of two options:
   - (a) Open the pull request with the job's token whenever the setting allows it, and use `HARNESS_PR_TOKEN` only after the C3 refusal. State that CI then needs the approval click (S3).
   - (b) Keep the current choice, and state the cost: a pull request opened with a person's token cannot be reviewed with *Request changes* by that person, so a solo maintainer either uses a token of a machine account or starts the round locally with `/autonomous-sdlc-harness:branch-user-review`.

   Whichever is chosen, carry it into:
   - `task_24_plan.md` → `## 4.`'s token bullet;
   - `task_25_plan.md` → setup step 9, the caveats list, and a `## 8.` row (behaviour, what rests on it, source "GitHub's documented rule, not retrieved here", if wrong);
   - `task_16_plan.md` → the report step that recommends `HARNESS_GIT_TOKEN`;
   - `task_31_plan.md` → leg (e) of (xiv), which must record which token opened the pull request it reviews.

## Should Fix

- `task_3_plan.md` → *The comment text*: acceptance 5 requires that *"each one names the next GitHub-side action"*. The `resumed` bullet ("says it resumed") names none. Task 9's `round` sentence also names none ("a `completed` comment follows …"). Give both an action, for example `@sdlc-harness pause` or `stop`, and have the test assert it.
- `docs/cli.md`'s doctor table row `` | `forge` | the configured forge, and what starts a run from it | `` no longer describes a check that also grades the control workflow and the delivered coupling (Task 17). This is carried over from iteration 0, and is neither applied nor recorded under `## Rejected findings`. Either add it to `task_29_plan.md`'s `### Targets` or give it a `no-change` row with a reason.
- `task_22_plan.md` (layer `general`) still says to *"check that `cli/src/config/model.ts`'s `HarnessConfig.forge` doc does not contradict it, and leave it unchanged if it does not"*. That is a conditional edit under `cli/` from a `general` task (`.claude/context/conventions.md` → `## The layers`). The current doc does not contradict the planned description, so say outright that this task does not edit `model.ts` (carried over from the architecture review).
- `task_6_plan.md`: a create that fails with `HARNESS_PR_TOKEN` for a reason other than the C3 message is retried without `--draft` using the **same** token. A permission refusal will fail the same way again. State whether that case retries with the job's token instead (carried over from iteration 0).
- `task_7_plan.md`: say whether any other job-mode suite (`watcher-park-loop`, `watcher-usage-resume`, `watcher-park-resume`) asserts on the central log's content. From now on, each job-mode `notify` appends `report`'s line to that log (carried over).

## Nice to Have

- Index `## Scope register`: `README.md` and `llms.txt` are a mirrored pair (Task 30), yet rows 47 and 49 carry `Copy` `—`.
