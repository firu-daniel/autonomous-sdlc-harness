### 2. Four autonomous forks still declare `<repo_root>` as "written `$REPO_ROOT` in the invocations below"

**Files:**
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Resolved values`, the `<repo_root>` row — "written `$REPO_ROOT` in the invocations below"
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Resolved values`, the `<repo_root>` row — the same substring
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Resolved values`, the `<repo_root>` row — the same substring
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` → the `<repo_root>` row of its binding table — "and written `$REPO_ROOT` in the invocations below"

This branch moved every commit invocation in these four forks to the literal spelling `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> …`. Each fork now says, beside its commit block, that `<repo_root>` is spelled as the text it resolves to and is never `"$REPO_ROOT"`. The declaration rows that open these four files still tell the agent the opposite: the token is "written `$REPO_ROOT` in the invocations below". In `task_plan_writing_instructions_autonomous.md`, no invocation below uses `$REPO_ROOT` at all, so that row is now simply false.

An agent that takes its spelling from the declaration table writes `--repo $REPO_ROOT`. The profile's literal `allow` entry does not match a command carrying a shell expansion, so the commit is refused at once in an unattended run (`plugin/instructions/autonomous_pause_and_ledger.md` §1.6). This branch updated the same row in `plugin/instructions/docs_orchestration_instructions_autonomous.md` (*"It is written `$REPO_ROOT` in the dispatch paths below; the wrapper invocations in `## Commit mechanics (single source of truth)` spell it literally."*) and left these four files out.

**Fix:** make the four rows say what the bodies now do, following the docs-engine row this branch already corrected.

- `task_plan_writing_instructions_autonomous.md`: no other `$REPO_ROOT` use remains in the file, so replace "written `$REPO_ROOT` in the invocations below" with "spelled as the literal path it resolves to in the wrapper invocations below".
- `user_review_fixes_instructions_autonomous.md` and `user_review_fix_plan_writing_instructions_autonomous.md`: replace "written `$REPO_ROOT` in the invocations below" with "written `$REPO_ROOT` in the paths below; the commit and push wrapper invocations spell it as the literal path it resolves to".
- `plan_orchestration_instructions_autonomous.md`: replace "and written `$REPO_ROOT` in the invocations below" with "and written `$REPO_ROOT` in the paths below; the commit and push wrapper invocations spell it as the literal path it resolves to".

Change nothing else in the rows. These are prose edits to instruction files and run no test.
