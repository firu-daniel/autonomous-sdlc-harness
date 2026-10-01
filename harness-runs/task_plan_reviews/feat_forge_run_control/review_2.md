# Task plan review — iteration 2

Both of iteration 1's Must Fix findings are resolved in the files that finding listed. `task_10_plan.md`'s `stop` arm now always replies on `CONTROL_NUMBER`, and a test case covers it. `task_6_plan.md` records option (b) and its cost, and `task_16_plan.md`, `task_24_plan.md`, `task_25_plan.md` and `task_31_plan.md` (leg (e)) carry that cost.

These checks all hold:
- index structure;
- the 1:1 match between readiness entries and files;
- single-layer tags, with the order `cli` → `plugin` → `general`;
- points, all 20 or fewer;
- `**Work:**` bullets, at most 5 per file;
- `**Depends on:**` direction;
- the test-run rule.

I re-ran derivation entries A–D word for word, and every site they reach is a row. Re-walking entry E found no missing site. Re-walking entry F found one, reported in finding 2.

## Must Fix

1. **The token's decided cost is missing from two places that recommend `HARNESS_GIT_TOKEN`** — `task_28_plan.md` and `task_29_plan.md`.
   `task_6_plan.md` records the decision and says how far it reaches: the cost of opening the pull request with a person's token, which that person then cannot review with *Request changes*, is to be *"stated wherever the token is recommended"*. Two tasks still recommend the token without that cost:
   - `task_28_plan.md` → the `### Every secret and variable` bullet. It gives the `HARNESS_GIT_TOKEN` row's *Required* cell the new reason *"set it so your CI runs on the draft pull request without an approval click"* and the access the token needs. It says nothing about the token's owner losing the review route. Its `**Depends on:**` → *The run workflow's tokens* bullet does not restate the cost either. `docs/remote-execution.md` → `### Every secret and variable` is where an adopter goes to set the secret. A solo maintainer who follows that row loses acceptance 2's primary route and is not told why there.
   - `task_29_plan.md` → `docs/cli.md` → `## 2.` restates `init`'s closing report as *"the pull-request setting step"*, and its **Depends on** reads *"the setting, or `HARNESS_GIT_TOKEN`"*. Task 16's report step includes the machine-account advice, so the documentation of that report would omit part of what the report prints.

   Each implementer reads only their own file, so neither will find Task 6's rule.
   **Fix:**
   - In `task_28_plan.md`, restate the cost under **Depends on** → *The run workflow's tokens*. In the `HARNESS_GIT_TOKEN` row bullet, add one clause to the *Required* cell: the pull request's author is then the token's owner, who cannot request changes on it, so use a token of a machine account, or start rounds locally with `/autonomous-sdlc-harness:branch-user-review`. Link [`github-run-control.md`](github-run-control.md) → `## 4.`.
   - In `task_29_plan.md`, have the `## 2.` bullet's pull-request step name the same advice beside `HARNESS_GIT_TOKEN`, as Task 16's report prints it, and add it to the **Depends on** restatement.

2. **Scope register: derivation entry F misses a ledger rule this plan cites** — Index structure, `feat_forge_run_control_story_plan.md` → `## Scope register`.
   I re-walked entry F. The artifact is `harness-runs/lessons.md`. The traversal is its headings, then the rules under each. The decision rule enumerates these surfaces:
   - an adopter-facing command or name;
   - an unattended retry;
   - expiring state;
   - a branch-scoped command;
   - an action on remote state;
   - a temporary working copy.

   That rule reaches the seven rules in rows 51–57. It does not reach *Evidence and measurement* → *"A wall-clock figure in a document of record is never one a run measured inside its own session …"*. Yet `task_31_plan.md` → **Where this task stops** honours that rule by name: *"it records no measured figure from inside a session (the lessons ledger's wall-clock rule)"*. Its target, Gate 12 in `docs/development.md`, is a measuring procedure in a document of record. The site is in scope and has no row, so entry F is under-inclusive.
   Sites the corrected entry newly reaches:
   - `harness-runs/lessons.md` → *Evidence and measurement*, "A wall-clock figure in a document of record is never one a run measured inside its own session". Disposition `no-change`: a constraint Task 31 honours.
   - `harness-runs/lessons.md` → *Evidence and measurement*, "A figure measured under a test stub or a fixture-sized corpus never justifies a design decision". Every automated case in this plan drives a `gh` stub, and Task 31 ships the real-shape gate step, observation (xiv). Disposition `no-change`: a constraint Tasks 25 (`## 8.`) and 31 honour.
   **Fix:** In the story index, widen entry F's decision rule. Add two surfaces to the enumeration: *"a measured figure, or a procedure that measures one, in a document of record"*, and *"any rule a per-task file cites as a constraint"*. Re-walk the ledger with the wider rule, and add the two rows above (`Copy` `—`, `Evidence` F).

## Should Fix

These are carried over from iteration 1. None of them is applied, and none is recorded under `## Rejected findings`.
- `task_3_plan.md` → *The comment text*: the `resumed` comment ("says it resumed") names no next GitHub action. Acceptance 5 requires *"each one names the next GitHub-side action"*. Task 9's `round` sentence names none either. Give both an action, for example `@sdlc-harness pause` or `stop`, and have the tests assert it.
- `docs/cli.md` → `## 7.` doctor table row `` | `forge` | the configured forge, and what starts a run from it | `` no longer describes a check that also grades the control workflow and the delivered coupling (Task 17). Add it to `task_29_plan.md`'s `### Targets`, or give it a `no-change` register row with a reason.
- `task_22_plan.md` (layer `general`) still says to *"check that `cli/src/config/model.ts`'s `HarnessConfig.forge` doc does not contradict it, and leave it unchanged if it does not"*. That is a conditional edit under `cli/` from a `general` task. Say outright that this task does not edit `model.ts`.
- `task_6_plan.md`: a create that fails with `HARNESS_PR_TOKEN` for a reason other than the C3 message is retried without `--draft` using the same token. A permission refusal, such as a token without *Pull requests* write (Task 28), fails the same way again. State whether that case retries with the job's token, or why it does not.
- `task_7_plan.md`: say whether any other job-mode suite (`watcher-park-loop`, `watcher-usage-resume`, `watcher-park-resume`) asserts the central log's content. From now on, each job-mode `notify` appends `report`'s line to that log.

## Nice to Have

- `task_13_plan.md` → *The branch checks* restates the protected-head and ledger checks rather than calling Task 10's `control_check_branch <branch>`, which exists so *"the two cannot drift"*. Name it under **Depends on** and call it.
- Index `## Scope register`: `README.md` and `llms.txt` are a mirrored pair (Task 30), yet rows 47 and 49 both carry `Copy` `—`.
