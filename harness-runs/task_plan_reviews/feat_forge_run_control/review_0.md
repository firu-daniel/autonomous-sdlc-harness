# Task plan review — iteration 0

## Must Fix

1. **Scope register: derivation entry A misses sites that state the forge coupling's status** — Index structure, `feat_forge_run_control_story_plan.md` → `## Scope register`.
   I re-ran entries A–D word for word and walked E and F step by step. Every site A–D reach is already a row. One site is in scope and no entry reaches it: `ARCHITECTURE.md` → `## 8.`, the `design.source` paragraph that opens "**This declaration has the shape the rule above refuses**". It contains the sentence *"For `forge` that outcome has since been paid for the key's trigger part — its issue trigger is a reader and `doctor`'s `forge` check its reporter"*. Once this branch lands the whole coupling, saying that only the trigger part is paid becomes stale. It is the same class of claim the scope predicate covers ("`forge`'s row states that the whole coupling is delivered").
   - Entry E does not reach it: Task 22 targets only `## 8.`'s `forge` paragraph ("`forge` — the same pattern, declared missing one part and since completed").
   - Entry A does not reach it: none of its alternatives match "trigger part".
   A widened entry A reaches four sites that have no row:
   - `ARCHITECTURE.md` → `## 8.`, the paragraph opening "**Applied to the engine seam, that rule decides this release.**" ("the outcome `forge` had until its issue trigger landed"). Still true, so `no-change`.
   - `ARCHITECTURE.md` → `## 8.`, the `design.source` paragraph opening "**`design.source` — the same outcome, declared with the rule already written.**" ("as it was with `forge` until its issue trigger landed"). Still true, so `no-change`.
   - `ARCHITECTURE.md` → `## 8.`, the paragraph opening "**This declaration has the shape the rule above refuses**", the sentence "paid for the key's trigger part". This is `change`.
   - `docs/development.md` → `## 6.`, the paragraph opening "**A second key is now in the state `forge` was in before its trigger landed**". Still true, so `no-change`.
   **Fix:** In the story index, replace entry A with this wider command (verified to reach the four sites above as well as every existing row):
   ```
   git grep -n -i -E 'park-and-ask over|comment-based (park|clarification)|comment park-and-ask|draft.pull.request|feat_forge_run_control|forge coupling|still to come|trigger part|its (issue )?trigger landed' -- '*.md' 'schemas/*.json' ':!harness-runs' ':!examples' ':!docs/github-integration-research.md'
   ```
   Add the four rows. Give the "trigger part" sentence a `change` disposition owned by Task 22, and add it to `task_22_plan.md`'s `### Targets` and `**Work:**`: restate that the outcome has been paid for the whole coupling. Give the other three `no-change` with the reason "a dated statement, still true".

2. **The issue-side branch lookup can be steered to the wrong branch, and is not checked the way the pull-request side is** — `task_10_plan.md`.
   On an issue, `**Work:**` → *The branch* says the lookup keeps comments by `github-actions[bot]`, "captures `branch=` from a started marker built from `COMMENT_MARKER`", and "the last capture is the branch". Nothing ties the capture to the trigger's own comment. Two kinds of comment break it:
   - Any workflow in the adopter's repository that posts with `GITHUB_TOKEN` posts as `github-actions[bot]`.
   - The harness itself posts untrusted text verbatim as `github-actions[bot]`. Task 4 posts whole question files, and its own test case posts a question body carrying `@sdlc-harness stop` as-is. HTML comments do not show in rendered issue text, so a labeller never sees a hidden `<!-- sdlc-harness event=started branch=… -->` line in the issue body that the planner may then quote.

   Because the last capture wins, any such later comment redirects an authorised maintainer's `pause`, `stop`, `resume`, `clear` or `answer` to another branch. The pull-request path refuses a protected head and an unrecognised head (`hr_branch_is_protected`, `forge_recognised`). The issue path applies neither check. This is the story index's first `Top risks:` entry: acting for someone it should not.
   **Fix:** In `task_10_plan.md`, make three changes:
   - Accept a started marker only when it is the body's last non-empty line, matches exactly the line `forge_marker started <branch>` produces, and sits in a comment whose body also opens with the trigger's fixed start sentence ("Started a harness run on the branch").
   - Apply the same `hr_branch_is_protected` and `forge_fetch_branch` + `forge_recognised` refusals to the branch resolved from the issue as to a pull request's head.
   - Add test cases for a marker embedded mid-body in a later `github-actions[bot]` comment (ignored, earlier genuine start used) and for a resolved branch without the ledger (refused with a reply).

3. **The new second use of `HARNESS_GIT_TOKEN` never tells the adopter what access the token needs** — `task_28_plan.md` and `task_24_plan.md`.
   From this branch on, `HARNESS_GIT_TOKEN` also opens the draft pull request (Tasks 6 and 14: `HARNESS_PR_TOKEN: ${{ secrets.HARNESS_GIT_TOKEN }}`). Today's docs state its purpose as pushes and workflow edits (`docs/remote-execution.md` → `### Every secret and variable`, the `HARNESS_GIT_TOKEN` row). A token made for that purpose need not carry pull-request write access. `docs/github-integration-research.md` → S2 → **Consequence** spells it out: "`HARNESS_GIT_TOKEN`, if it is to open PRs …, is a fine-grained PAT with Contents, Pull requests and (for workflow files) Workflows write, or a classic PAT with `repo` and `workflow`."

   No task says this. Task 28 changes the row's *Read by* and *Required* cells. Task 24 → `## 4.` and Task 25's setup step 9 say the token opens the pull request. None names the access it needs. Task 6 then retries a failed create once with the **same** token, without `--draft`. An adopter who set the secret only for workflow edits, as the docs describe today, therefore gets no pull request at all. That is acceptance 1 failing in a setup the docs describe.
   **Fix:** In `task_28_plan.md` → the `HARNESS_GIT_TOKEN` row bullet, and in `task_24_plan.md` → `## 4. The draft pull request`, state the access the token needs to open the pull request:
   - a fine-grained token: *Pull requests* write, beside *Contents* write and, for workflow files, *Workflows* write;
   - a classic token: `repo` plus `workflow`.
   Cite S2. Also state what a token without that access produces: the `completed` comment naming `gh`'s error.

## Should Fix

- `task_6_plan.md`: when the create with `HARNESS_PR_TOKEN` fails with anything but the C3 message, retrying without `--draft` uses the same token. The task should state whether a permission refusal is then retried once with the job's token, or why it is not. Either way, record the bounded-retry count.
- `task_20_plan.md`: the plugin body is told to cite the round's producer as `cli/templates/scripts/remote-run.sh` → `control`. At run time the agent works in an adopter's repository, where that path does not exist. Other plugin assets name it `<scripts_dir>/remote-run.sh` (`plugin/commands/branch-pause.md`, `plugin/commands/branch-answer.md`). Either use that form, adding a `<scripts_dir>` row to the agent's `## Resolved values`, or state why the harness-repository path is the right citation here.
- `task_29_plan.md`: `docs/cli.md`'s doctor table row `` | `forge` | the configured forge, and what starts a run from it | `` no longer describes a check that also grades the control workflow and the delivered coupling (Task 17). Name it in `### Targets`, or record it as a `no-change` row with a reason in the index's `## Scope register`.
- `task_7_plan.md`: every job-mode `notify` now appends `report`'s one line to the run's central log, even with `forge` unset. Say whether any other job-mode suite (`watcher-park-loop`, `watcher-usage-resume`, `watcher-park-resume`) asserts that log's content. That keeps the closing `commands.test` run from finding a break this task's own suite cannot see.
- `task_28_plan.md`: the new optional step is added "after step 5" of `## 7. Turning it on`, which renumbers steps 6 and 7. Say whether it becomes a new step 6 (with the later steps renumbered) or a part of step 5. A grep found no current citer of those step numbers, so this is only a matter of wording.

## Nice to Have

- Index `## Scope register`: `README.md` and `llms.txt` are a mirrored pair (Task 30: "`llms.txt`, which mirrors the README's opening"), yet rows 47 and 49 both carry `Copy` `—`. Naming the copy would make the pairing explicit.
