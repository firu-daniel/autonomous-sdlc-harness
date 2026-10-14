### Task 1 — Rewrite the gate, meta-review, test-fix-review, UI-test-plan and QA-review state-dir READMEs for next-free keying and the blocked-test outcome

**Goal:** Make the README contracts `init` writes for seven run-artifact directories describe the behaviour this branch gives them. Four of the folders hold findings that are never overwritten, because a new findings file always takes the next free `review_<n>.md` index. The test-fix-review folder gets a one-clause alignment to the same rule. The UI-test plan's QA.0 augment is committed by its own commit point and is not re-reviewed. The QA-review folder stops describing `blocked` as an outcome recorded in a per-test file.

**Where this layer stops.** This task edits **only** adopter-facing README text under `cli/templates/state-dir/`. The flow text that produces the behaviour is the `plugin` layer's: Task 3 (the user-review gates), Task 5 (B.2 / C2.2 / G.2), Task 11 (the qa-tester's blocked return), Tasks 12–13 (the callers that parse it), Task 15 (the no-review decision) and Task 16 (the QA.0 commit point). Describe the contract below exactly as stated. Do not cite a plugin step number that this task cannot see. Cite headings, as each README already does.

**The contract these READMEs describe (stated here so this task needs no other file):**

- **Next-free keying.** Before each reviewer dispatch, the caller lists the findings folder and passes, as the reviewer's `iteration:` argument, one past the highest `review_<n>.md` already there, or `0` when the folder is absent or holds none. The loop's own counter now only caps the loop (`>= 5` escalates) and labels the heartbeat; it never names a file. The consequences:
  - a re-entered gate, a later fix-plan round and a second code-review or skeptic round all **add** files beside the earlier ones;
  - nothing is written over;
  - each folder is a branch-wide series that continues across rounds.
- **The user-review gate folders** (`architecture_user_review_reviews/`, `business_parity_user_review_reviews/`) stay flat per `<branch>`. The gates are `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` steps 7 and 8. The autonomous fork commits each round's new files at convergence, and the supervised flow names them for the human's commit.
- **The meta-review folders** (`review_plan_reviews/`, `skeptic_review_plan_reviews/`) stay keyed by `<branch>`. A second review round continues their series instead of restarting at `0`. B.3 / C2.3 still commit the folder alongside the index it graded. The loops are `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### B.2 Meta-review the review plan` and `### C2.2 Meta-review the skeptic review`.
- **The test-fix-review folder** (`test_fix_plan_reviews/<branch>_<gate_key>_round_<gate_round>/`) takes the next free index too. A G.2 re-run on a draft round that never converged therefore adds files instead of rewriting `review_0.md`.
- **The UI-test plan.** A user-review round's QA.0 augment is **not** re-graded by the UI-test plan reviewer; the QA.0 step states why. In the autonomous user-review flow it is committed by that fork's own QA.0 commit point, under the same fixed subject the planning flow uses, `chore: Add UI-test plan for <branch>`.
- **A blocked QA test.** A test the environment prevents driving (no credentials for an auth-gated surface, an account another session holds, a backend failure that cannot be induced without request mocking) makes the tester return a single blocked line and **write no file**: no per-dispatch index, no finding. The test stays unchecked, the QA round continues, and the test is re-tried on the next re-test round, if any. A blocked test is recorded in exactly two places: the `## Context` pass/fail/blocked roll-up of the merged round index, which exists **only on a round with at least one failing test**, and the run's Done summary (a hand-started session reports it to the user instead). A round whose tests all passed or were blocked is a passing round and writes no index. Blocked is still its own outcome — never a failure, never a pass.

### Targets

- `cli/templates/state-dir/architecture_user_review_reviews/README.md`
- `cli/templates/state-dir/business_parity_user_review_reviews/README.md`
- `cli/templates/state-dir/review_plan_reviews/README.md`
- `cli/templates/state-dir/skeptic_review_plan_reviews/README.md`
- `cli/templates/state-dir/test_fix_plan_reviews/README.md`
- `cli/templates/state-dir/ui_test_plans/README.md`
- `cli/templates/state-dir/qa_reviews/README.md`

**Work:**

- [ ] `architecture_user_review_reviews/README.md` and `business_parity_user_review_reviews/README.md`: make three changes.
  - Replace the "**plain counter, not a free-index resolution**" sentence and its overwrite consequence with the next-free rule above.
  - Rewrite the "numbered set is only the **latest** pass … copy a round aside first" text in the architecture file, and the whole "first PASS … lands **on top of `review_0.md`**" mistake-worth-naming paragraph in the parity file, so that the set is the gate's full history across re-entries and rounds.
  - Give the parity file a new mistake worth naming that stays true. For example: reading a later file's absence of a finding as proof the earlier one was wrong, when the writer may simply have fixed it.
- [ ] `review_plan_reviews/README.md` and `skeptic_review_plan_reviews/README.md`: replace the "plain counter … **overwrites** the first round's `review_0.md`" text and the "a later round rewrites it from `0`" clause with the branch-wide next-free series. Keep the "file appears only for a failed meta-review" fact. Keep the fact that a clean first pass on a branch's **first** round creates no directory.
- [ ] `test_fix_plan_reviews/README.md`: change "`<i>` starts at `review_0.md` and increments once per failed review" to the next-free rule. Keep "a later number is added beside the earlier files, never written over them", which this branch makes true on a re-entered round.
- [ ] `ui_test_plans/README.md`: two edits.
  - In the paragraph that says "the UI-test plan reviewer grades it before it is run", add that a fix round's augment is not re-graded, pointing at `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_core.md` → `### QA.0 Resolve the round suffix, then augment the UI-test plan` for why.
  - In "The whole directory is committed with the branch …", add that in the autonomous user-review flow the augment is committed at QA.0 by its own commit point.
- [ ] `qa_reviews/README.md`: three edits, per **A blocked QA test** above.
  - First paragraph: "recording each test as **passed, failed or blocked**" becomes a statement that the index records the round's failing tests' findings, with a pass/fail/blocked roll-up in its `## Context`.
  - Third paragraph: keep "An index appears only on a round with something to report", and say that a round whose tests all passed or were blocked is such a clean round.
  - Mistake-worth-naming paragraph: keep "collapsing **blocked** into failed" and its three examples, but replace "is recorded `blocked`" with where a blocked test is now recorded — no per-test file, the merged index's Context roll-up on a failing round, and the Done summary — and keep both consequences (a failure chases a defect that is not there; a pass hides a test that never ran).

**Verification:**

- `git grep -n -E -e 'plain counter' -e 'overwrit' -e 'on top of' -e 'starts at .?0. again' -- cli/templates/state-dir/architecture_user_review_reviews cli/templates/state-dir/business_parity_user_review_reviews cli/templates/state-dir/review_plan_reviews cli/templates/state-dir/skeptic_review_plan_reviews` returns no line that says these folders overwrite or restart.
- `git grep -n -E -e 'recorded .?blocked' -e 'failed or .?blocked' -- cli/templates/state-dir/qa_reviews/README.md` returns nothing, and the README states that a blocked test writes no file and that a pass-plus-blocked round writes no index.
- Each edited README still opens with its `# <dir>/` heading and still names its writer, its reader and its mistake worth naming. It introduces no `{{…}}` token (`init` checks rendered output for one), and cites plugin files only in the `${CLAUDE_PLUGIN_ROOT}/…` → heading form the file already uses.
- No README names a line number, a branch name or this repository's `harness-runs` value. They keep writing `<state_dir>` and `<branch>`.
