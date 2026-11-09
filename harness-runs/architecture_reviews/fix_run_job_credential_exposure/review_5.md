# Architecture review — iteration 5

The round-4 Must Fix is resolved:
- `task_2_plan.md` adds `HR_REMOTE_WORKFLOWS_DIR='.github/workflows'`, assigned at source time.
  - It appears in the contract table, in the **NAMING.** paragraph, and as an `HR_REMOTE_WORKFLOWS_DIR mirrors WORKFLOWS_DIR` line in the **MIRRORS OF `cli/src/remote/githubActions.ts`** list.
  - A Verification grep shows the assignment as the only code spelling of the path under `cli/templates/scripts`. Checked on the base: no shell template spells it on a code line today.
- `task_3_plan.md` matches against `"$HR_REMOTE_WORKFLOWS_DIR"/*`. It builds the refusal line from the constant and names the constant as the path's source in its header paragraph. Its `grep -n` Verification bullet now includes `\.github/workflows`.
- `task_4_plan.md` extends the owner's doc-comment library entry with `{@link WORKFLOWS_DIR}`, and checks it in its Verification bullet.

Every layer placement still holds:
- Tasks 1–6 and 13 are under `cli/`.
- Task 7 is under `plugin/` and cites outside-plugin documents by repo-relative path.
- Tasks 8–12 are at the catch-all root.

The model → schema order departure for `sandbox.passEnv` is declared in the index and in Tasks 1 and 9. No two tasks edit the same file.

No plan file asks for a test run that `## The test-run rule` forbids. Each `**Verification:**` bullet names one of these:
- the task's own new or edited test files;
- a grep;
- `commands.typecheck`.

No plan names a tree guard. Task 10 leaves Gate 14d to the closing gate round.

There are no new Must Fix defects. One Should Fix from round 4 was neither applied nor recorded.

## Must Fix

None.

## Should Fix

- **Round 4's Should Fix on `ANTHROPIC_API_KEY` / `CLAUDE_CODE_OAUTH_TOKEN` was neither applied nor recorded under `## Rejected findings`.**
  - **What the plan says.** `task_4_plan.md` still spells both names in watcher code in two places: `SESSION_ENV_BASE`, and the strip set's "minus" (**The two sets, defined here.**; **Where the sets are read** step 1).
  - **What the owner declares.** `cli/src/remote/githubActions.ts` declares the same identifiers as `API_KEY_SECRET` and `OAUTH_TOKEN_SECRET`. Its module header says it owns *"the repository secret and variable names"*.
  - **Why the doc comment would be wrong.** `task_4_plan.md`'s doc-comment rewrite still says to *"Add the watcher to the paragraph's list of mirrors for those two names only"*, meaning `PUSH_URL_SECRET` and `GIT_TOKEN_SECRET`. That rewritten sentence would be inaccurate for a watcher that spells two more of the owner's secret names in code.
  - **Rules.**
    - `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: *"An environment-variable name is a constant with an owner too … never retyped as a literal"*.
    - `.claude/context/cli.md` → `## What "done" means here`: a reviewer holds a change to its module's header.
    - `harness-runs/lessons.md` → *Unattended control loops*: *"a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."*
  - **Why it stays a Should Fix.** `cli/templates/scripts/remote-run.sh` already exports both names in code without declaring a mirror (the mention reader). So the tree treats them as the agent CLI's own variables.
  - **Fix.** Do one of these:
    - **In `task_4_plan.md`:** have `SESSION_ENV_BASE`'s comment either declare the two names as mirrors of `API_KEY_SECRET` / `OAUTH_TOKEN_SECRET`, or state that they are the agent CLI's own variables and not harness-owned mirrors. If they are declared as mirrors, also widen the owner doc-comment sentence's *"for those two names only"* to cover them.
    - **In the story index:** add a `## Rejected findings` section recording this item with its reason.

## Nice to Have

- None.
