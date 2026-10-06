# Task plan review — iteration 0

## Must Fix

1. **`task_3_plan.md` — the widened recognition flips existing test cases, one of them in a suite outside the task's Targets**
   In every suite Task 3 touches, the fixture helper's `ledger: false` option still writes the branch's task prompt:
   - `cli/test/remote-control.test.mjs` → `pushBranch` always writes `${STATE_DIR}/task_prompts/${branch}_task_prompt.md` and adds only the ledger under `if (ledger)`.
   - `cli/test/remote-control-review.test.mjs` → `pushBranch` does the same.
   - `cli/test/remote-report.test.mjs` → `pushBranch(branch, { issueUrl, ledger, label })` does the same.

   Once `forge_recognised` accepts a task prompt **or** a ledger, a `ledger: false` branch is a recognised harness branch. Three existing cases rest on the opposite premise, and each will now fail:
   - `cli/test/remote-control-review.test.mjs` → `test('a head without the ledger is refused as not a harness branch', …)`. That file is **not** in Task 3's `### Targets`, so the implementer has no licence to edit it, and Phase G fails.
   - `cli/test/remote-control.test.mjs` → `test('a pull request whose head has no ledger and only a completed run is not a harness branch', …)`. It is not an assertion that quotes the old text, so the Work bullet's "update any existing assertion that quoted the old refusal or line" does not reach it. Its premise is now false: the command is accepted.
   - `cli/test/remote-report.test.mjs` → `test('a pull request whose head lacks the ledger is not a target: the issue alone is', …)`. This contradicts the new case Task 3 itself adds ("origin's `feat_x` carries its task prompt and **no** ledger … posts on `#12`").

   Task 3 also adds cases where the branch "carries neither file". No helper can push such a branch today, and the plan does not say to extend the helpers.

   **Fix:** In `task_3_plan.md`:
   - (a) Add `cli/test/remote-control-review.test.mjs` to `### Targets`, and add a `**Verification:**` bullet that runs it (`npm test --workspace cli -- test/remote-control-review.test.mjs`), since the task now edits it.
   - (b) In the Tests Work bullet, add a `prompt: false` (or equivalent) option to the `pushBranch` helper of each of the three suites, so a branch can carry neither file.
   - (c) Name the three cases above. Rewrite each one to push a branch carrying **neither** file, which keeps the "not a harness branch / not a target" behaviour under test. Then keep a separate case for the task-prompt-only branch, which is now recognised.
   - (d) Before editing, grep `cli/test` for `ledger: false` and record that the remaining hits do not depend on non-recognition. The `remote-collect.test.mjs` hits answer `pr list` with `[]`, so they do not.

## Should Fix

1. **`task_7_plan.md` — the round comment says "draft again" even when the undo is refused.** The sentence *This pull request is a draft again until the round completes.* is written before `pr ready --undo` runs. On a plan without drafts (the one-retry fallback), the undo is refused on every round, so the comment is false every time. The task prompt asks to skip the flip on such a plan. Post the comment after the call and append the sentence only on success. Or skip the undo, and leave the sentence out, when the pull request was opened non-draft (for example, read the `opened` comment's or the body's state).
2. **`task_6_plan.md` — `FORGE_PR_DRAFT` empty or `null` is left undefined.** The flip branches on `true` and `false` only. A pull-request listing without `isDraft` (every existing stub's `STUB_PRS`, or jq printing `null` when the field is absent) falls through both arms, so `ready` is never set and the `completed` text is unspecified. State the third outcome: treat it as not-draft and say so, or attempt the flip. Make `task_3_plan.md` say what `FORGE_PR_DRAFT` holds when the element carries no `isDraft`.
3. **`task_9_plan.md` / `task_4_plan.md` / `task_8_plan.md` — the marker line's owner comment goes stale.** `cli/src/remote/githubActions.ts` → the `COMMENT_MARKER` doc comment states the whole marker line as `<!-- sdlc-harness event=<event> branch=<branch>[ question=<n>][ engine=<engine>] -->`. Task 9 adds a `round=<n>` field, and Tasks 4, 8 and 9 add the events `opened`, `thread` and `progress`. That module's header declares `remote-run.sh` its shell mirror. Add a Target and Work bullet, in Task 9 (a `cli` task), that updates the doc comment. In the same spirit, `cli/src/config/model.ts` → `forgeTriggerApplies`'s doc comment lists `remote-run.sh`'s `trigger`, `control`, `report`, `deliver` and `collect` as the shell consumers. `open` joins them, and Task 1 already edits that file.
4. **`task_19_plan.md` — leg (a) asks for *Planning* `done` before the run parks.** Leg (a)'s run parks in the task-plan writer, inside `P1`, so its progress comment reads *Planning: in progress* at that point. *Planning: done* can only appear after leg (b)'s answer. Have leg (a) check *Planning: in progress*, and move the *done* check to leg (b) or (c).
5. **`task_15_plan.md` — the §5 table has no row for the thread reply.** The task prompt's item 13 says to update §2/§5. Task 8 posts a marked comment (`event=thread`) that §5's table, the inventory of every marked comment, does not list. Add a `thread` row (the pull request's review thread; reply forms; no label; no draft change), or say in §5 why it is §2's alone.
6. **`task_8_plan.md` — the paginated GraphQL query omits `pageInfo`.** `gh api graphql --paginate` needs the query to select `pageInfo { hasNextPage endCursor }` on the paginated connection. Without it, only the first 100 threads are read. State it in the listing bullet.
7. **Story index — external ticket.** The task prompt's generalised target rule has *"the source item (the issue, or a link back to an external ticket) gets `launched` and `completed`"*. The index's decision (Task 15's §5 rule) says a `repository_dispatch` source "gets nothing". Record this as a stated decision in `## Context`'s mechanism decisions, with its reason, so it does not appear only in a Task 15 Work bullet.

## Nice to Have

1. `task_5_plan.md`: the existing `deliver` step keeps the name `Open the pull request and report`, and the header paragraph `WHY THE REPORT STEP MAY FAIL` quotes it. Next to a new `Open the draft pull request` step, that name now misleads. A rename would also touch `cli/test/workflow-templates.test.mjs` → `at('Open the pull request and report')`, which is within this task's targets.
