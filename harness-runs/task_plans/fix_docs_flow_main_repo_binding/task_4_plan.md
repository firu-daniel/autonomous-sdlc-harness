### Task 4 — Fix the planning forks' "Push after the commit" prose and bind `<MAIN_REPO>` in the fix-plan fork's table

**Goal:** Make the two planning forks' "**Push after the commit.**" paragraphs refer to the push as the literal fence above them spells it: `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`. They must not use a bare `<scripts_dir>/push-branch.sh` or a `$REPO_ROOT` argument. Also move the fix-plan fork's `<MAIN_REPO>` binding out of `## Safety scaffolding` into a `## Resolved values` row.

**Where this task stops.** It changes no word of the resolution clause. In `user_review_fix_plan_writing_instructions_autonomous.md` the clause moves from `## Safety scaffolding` step 1 into the new row, and its count stays what it was. `task_plan_writing_instructions_autonomous.md` already carries the row, so its binding is left alone. The push fences under Override 3, Override 4 and Override 5, the ⚠️ notes ("`push-branch.sh` is non-fatal" names a wrapper property) and the "Flip the … entries" lines are already correct and stay unchanged.

### Targets

- `plugin/instructions/task_plan_writing_instructions_autonomous.md`
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`

**Work:**

- [ ] **Both "**Push after the commit.**" paragraphs in `task_plan_writing_instructions_autonomous.md` (Override 3 and Override 4).** Change "The `<scripts_dir>/push-branch.sh` call above" to "The `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` call above". Then replace "It uses the `$REPO_ROOT` the calling command (`/autonomous-sdlc-harness:branch-start-plan-autonomous`) derived at session start." with a sentence saying its `<repo_root>` is the root that calling command derived at session start, spelled as the literal path it resolves to. Leave the rest of each paragraph as it is.
- [ ] **The "**Push after the commit.**" paragraph in `user_review_fix_plan_writing_instructions_autonomous.md` (Override 3).** Make the same two changes. Its calling command is `/autonomous-sdlc-harness:branch-start-user-review-fix-autonomous`, and it keeps its "(see the `<repo_root>` binding above)" pointer.
- [ ] **`user_review_fix_plan_writing_instructions_autonomous.md`, the row.** Insert the `<MAIN_REPO>` row into `## Resolved values`, immediately after the `<repo_root>` row. Copy it **byte for byte** from `plugin/agents/committer.md` → `## Resolved values` (the line beginning ``| `<MAIN_REPO>` | derived at runtime |``).
- [ ] **`user_review_fix_plan_writing_instructions_autonomous.md`, the lead paragraph and `## Safety scaffolding` step 1.**
  - In the `## Resolved values` lead paragraph, remove `<MAIN_REPO>` from the "none of the three" list, and remove its "`<MAIN_REPO>` in `## Safety scaffolding` below" location clause. Keep `<round_suffix>` and its location.
  - In `## Safety scaffolding` step 1, **STOP checks.**, replace the parenthetical that resolves `<MAIN_REPO>` inline, and its variant spelling rule, with "(`<MAIN_REPO>` resolves per its `## Resolved values` row)". Keep the rest of the step.

**Verification:**

- Before editing, run `git grep -c -F "printenv HARNESS_MAIN_REPO" -- plugin/instructions/task_plan_writing_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`. Run it again after editing. Each count must be unchanged.
- `git grep -h -F '| `<MAIN_REPO>` |' -- plugin/agents/committer.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` must print two identical lines.
- `git grep -nE "(^|[^/])<scripts_dir>/push-branch\.sh" -- plugin/instructions/task_plan_writing_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` must print no hits.
- `git grep -n -F 'It uses the `$REPO_ROOT`' -- plugin/instructions/task_plan_writing_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` must print no hits.
- `git diff --name-only` lists only this task's two targets.
