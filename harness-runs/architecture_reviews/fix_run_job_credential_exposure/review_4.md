# Architecture review — iteration 4

The round-3 Must Fix is resolved:
- `task_2_plan.md` makes `lib/harness-run-lib.sh` the marker's single owner. It adds `HR_PUSH_CREDENTIAL_KEY`, `HR_PUSH_CREDENTIAL_JOB_TOKEN` and the read-only `hr_push_credential_is_job_token`, and names them in the contract table, the opening summary and **NAMING.** It also carries a Verification grep showing the literals only at the two constant assignments.
- `task_3_plan.md` reads the mode only through the predicate.
- `task_5_plan.md` writes and unsets the marker only through the constants.
- Both test files set the marker through the sourced constants.

Both round-2 Should Fixes that round 3 re-raised are applied:
- Task 1's doc comment names no test.
- Task 4's `SESSION_ENV_BASE` comment points at `CLAUDE_HOME_VARIABLE`.

No plan file asks for a test run that `## The test-run rule` forbids. Each `**Verification:**` bullet names only the task's own new or edited test files, a grep, or `commands.typecheck`. Task 10 explicitly leaves Gate 14d to the closing gate round.

One new defect remains. It is the same class as round 3's: Task 3 adds a code literal whose owner already exists.

## Must Fix

1. **`push-branch.sh`'s workflow-file check retypes `cli/src/remote/githubActions.ts` → `WORKFLOWS_DIR` as an undeclared shell literal.** This is in `task_3_plan.md`:
   - **The match** says the check matches *"a path beginning `.github/workflows/`, at the repository root only"*.
   - The refusal sentence and the header paragraph **IN A JOB, A WORKFLOW-FILE CHANGE IS REFUSED AT THE FIRST PUSH.** spell it too.

   Neither `task_3_plan.md` nor any other task declares this as a mirror. `task_4_plan.md` → the githubActions.ts doc-comment edit adds no `WORKFLOWS_DIR` entry either.

   Rules broken:
   - `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: *"The shared constants have owners, and a value is imported from its owner rather than retyped"*.
   - `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*, *"Before adding a copy of anything, grep for it"*.
   - `.claude/context/cli.md` → `## What "done" means here`: a reviewer holds a change to its module's header. Here that is the owner's header, whose **Shell and YAML mirrors that must agree byte for byte.** paragraph says each shell mirror *"declares the mirror in its own header, and a rename here is an edit to each of them"*.

   `cli/src/remote/githubActions.ts` declares `export const WORKFLOWS_DIR = '.github/workflows'` as the owner of that path. Today no shell template spells it. Task 3 would add the first shell code copy, and that copy is a trust-relevant matcher: it decides whether a job push is refused.

   The outer-loop family already has a home for mirrors of `githubActions.ts` names. `lib/harness-run-lib.sh` → **MIRRORS OF `cli/src/remote/githubActions.ts`** holds `HR_REMOTE_WORKFLOW_RUN_FILE` and `HR_REMOTE_STATE_ARTIFACT`, and `push-branch.sh` already sources it.

   **Fix:**
   - **`task_2_plan.md`:**
     - Add a module-level constant `HR_REMOTE_WORKFLOWS_DIR='.github/workflows'`, assigned at source time.
     - Add it to the contract table, to the **NAMING.** paragraph *(assigned at source time)*, and as a third line in the **MIRRORS OF `cli/src/remote/githubActions.ts`** list: `HR_REMOTE_WORKFLOWS_DIR mirrors WORKFLOWS_DIR`, in that list's column form, beside the `GIT_TOKEN_SECRET` line this task already adds.
     - Add a Verification bullet: `git grep -n '\.github/workflows' -- cli/templates/scripts` finds a code line only at that assignment.
   - **`task_3_plan.md`:**
     - The workflow-file check matches paths beginning `"$HR_REMOTE_WORKFLOWS_DIR/"` at the root. The script never spells `.github/workflows` on a code line. The refusal line and the header prose may keep the literal, because a message is not a code copy.
     - The header paragraph names the library constant as the path's source.
     - Add `.github/workflows` to the existing `grep -n` Verification bullet: no code line in `push-branch.sh` spells it.
   - **`task_4_plan.md`:** this task already edits the owner's doc comment. Its library-entry edit (*"which mirrors {@link WORKFLOW_RUN_FILE} and {@link STATE_ARTIFACT_NAME}"*, extended with `{@link GIT_TOKEN_SECRET}`) also gains `{@link WORKFLOWS_DIR}`. Add it to that task's Verification bullet on `githubActions.ts`.

## Should Fix

- **`task_4_plan.md` → `SESSION_ENV_BASE` and the strip set's "minus" both spell `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN` in watcher code.** `cli/src/remote/githubActions.ts` declares the same identifiers as `API_KEY_SECRET` and `OAUTH_TOKEN_SECRET`. The plan declares mirrors for `PUSH_URL_SECRET` and `GIT_TOKEN_SECRET` only, and rewrites the owner's doc comment to say the watcher mirrors *"those two names only"*.
  - `remote-run.sh` already exports both names in code without declaring them (the mention reader), so the tree treats them as the agent CLI's own variables rather than harness-owned names. That is why this is not raised as a Must Fix.
  - Still, either declare the two in `SESSION_ENV_BASE`'s comment as mirrors of `API_KEY_SECRET` / `OAUTH_TOKEN_SECRET`, the way the plan points `CLAUDE_CONFIG_DIR` at `CLAUDE_HOME_VARIABLE`, or state in that comment why they are the agent CLI's names and not mirrors. Then the rewritten doc-comment sentence stays accurate.

## Nice to Have

- None.
