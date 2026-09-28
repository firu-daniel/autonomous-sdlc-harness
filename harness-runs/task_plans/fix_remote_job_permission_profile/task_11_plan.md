### Task 11 — Make `init`'s remote-execution note and `doctor`'s `remote-execution` remedy print the setup push that works

**Goal:** Make the two places the **code** prints the workflows' setup push print one that the `pre-push` hook `init` installs does not refuse, preceded by the `workflow` token-scope step, so `init`'s closing note, `doctor`'s remedy and the documents Tasks 8 and 10 correct all give the same commands (task prompt → `## What is wrong`, findings 6 and 7; acceptance criterion four, *"`init`'s notes … agree with what the code does about … the default-branch push and the `workflow` scope"*).

**Ship order.** Added in plan revision, so its number is out of sequence: it ships **eighth**, after Task 7 and before Tasks 8, 9 and 10 (story index → `## Phase 2 Readiness — Ordered Fix List`). Tasks 8 and 10 `**Depends on:**` it.

**Depends on:** Task 4, which created `cli/src/core/defaultBranchPush.ts` — the one owner of the default-branch setup push in `cli/src` — exporting:

```ts
export function defaultBranchPushCommand(branch: string): string
// returns `git push --no-verify origin ${branch}` — no backticks, no trailing punctuation
export function defaultBranchPushReason(branch: string): string
// returns one sentence: `--no-verify` skips the `pre-push` hook `init` installed, which refuses a push to `${branch}`; this push is yours to make on purpose, and the harness never makes it.
```

`checks.ts` → `profileUntrackRemedy` (Tasks 4 and 5) already consumes both. This task adds the `workflow`-scope pair to that module and switches both of its printers onto it; it does not change the two existing exports. Also Task 3 and Task 5, for the shared files only: Task 3 is the last task before this one to edit `cli/test/init.test.mjs` and Task 5 the last to edit `cli/src/doctor/checks.ts` and `cli/test/doctor.test.mjs`; nothing in this task uses what either built.

**Why the push is refused today.** `cli/templates/githooks/pre-push` refuses any push whose target is in its `case` set (*"pre-push: refusing to push to protected branch '$target' - land the change through a pull request"*), and `defaultBranch` is always in that set. `init` wires the hook through `core.hooksPath`, so `git push origin <defaultBranch>` — which both `init.ts` → `reportGithubSteps` and `checks.ts` → `REMOTE_EXECUTION_CHECK` print today — is refused by the repository `init` itself just wired. The setup push is the one push to the default branch the adopter makes on purpose and the harness never makes, so `--no-verify` for that one push is the route. And pushing a `.github/workflows/*.yml` file over HTTPS with a `gh` token is refused unless the token carries the `workflow` scope (Gate 12 round 1), which `gh auth refresh -s workflow` adds.

**The printed commands — the contract Tasks 8 and 10 restate byte-for-byte.** `init`'s step 1 prints, each on its own line and in this order:

```
git add <each workflow path this run wrote, space-separated>
git commit -m "Add the harness workflows"
gh auth refresh -s workflow
git push --no-verify origin <defaultBranch>
```

with, in the step's lead sentence, the reason for each of the last two in one sentence apiece: *the `workflow` scope is what a `gh` token needs to push a `.github/workflows` file over HTTPS*, and *`--no-verify` skips the `pre-push` hook `init` installed, which refuses a push to `<defaultBranch>`; this push is yours to make on purpose, and the harness never makes it*. `REMOTE_EXECUTION_CHECK`'s remedy names the same two commands in the same order — `gh auth refresh -s workflow`, then `git push --no-verify origin <branch>` — with the same two reasons.

**Where the four values come from — neither printer spells them.** `cli/src/core/defaultBranchPush.ts` owns them (`.claude/context/conventions.md` → `## Shared code, and where it lives`: *"A value or behaviour two `cli/src` areas need lives there, never duplicated into both"*). This task adds to it:

```ts
export const WORKFLOW_SCOPE_COMMAND = 'gh auth refresh -s workflow';
export const WORKFLOW_SCOPE_REASON: string; // one sentence: the `workflow` scope is what a `gh` token needs to push a `.github/workflows` file over HTTPS.
```

and extends its module header's owned-values list and its *"The rule this module exists to enforce"* sentence to cover the scope step. `reportGithubSteps` and `REMOTE_EXECUTION_CHECK` then import `WORKFLOW_SCOPE_COMMAND`, `WORKFLOW_SCOPE_REASON`, `defaultBranchPushCommand(branch)` and `defaultBranchPushReason(branch)` and print what they return; the `git add` and `git commit` lines stay `init`'s own, since only `init` prints them.

**Where this task stops.** It adds the `workflow`-scope pair to `cli/src/core/defaultBranchPush.ts` and extends that module's header, leaving Task 4's two exports unchanged; it edits `reportGithubSteps` and its doc comment in `init.ts`, and only the `origin/<branch> does not carry …` warning and the doc comment above `REMOTE_EXECUTION_CHECK` in `checks.ts`. It does **not** touch `base-freshness`'s `git push origin ${branch}` remedy (a push of the adopter's own commits, outside this prompt's findings), the hook, the workflows, or any document — `docs/remote-execution.md` is **Task 8's**, `docs/development.md` and `README.md` **Task 10's**. `docs/cli.md`'s `remote-execution` bullet names no push command and needs no change.

### Targets

- `cli/src/core/defaultBranchPush.ts` → `WORKFLOW_SCOPE_COMMAND`, `WORKFLOW_SCOPE_REASON` (new exports) and the module header. **Shared file:** Task 4 created it.
- `cli/src/commands/init.ts` → `reportGithubSteps` and its doc comment.
- `cli/src/doctor/checks.ts` → `REMOTE_EXECUTION_CHECK`'s `origin/${branch} does not carry` warning and the doc comment above the check. **Shared file:** Tasks 12, 2, 4 and 5 edited it before.
- `cli/test/init.test.mjs` — the `turned on, init writes both files from their templates and reports the GitHub-side steps` case. **Shared file** with Tasks 1, 2 and 3.
- `cli/test/doctor.test.mjs` — the `on, with harness-run.yml not on origin/<defaultBranch>, warns to commit and push it` case. **Shared file** with Tasks 12, 2, 4 and 5.

**Work:**

- [ ] `cli/src/core/defaultBranchPush.ts`: add `WORKFLOW_SCOPE_COMMAND` and `WORKFLOW_SCOPE_REASON` per the contract above, and extend the module header.
- [ ] `init.ts` → `reportGithubSteps`: import the four values from `../core/defaultBranchPush.js` and print the four commands above in that order through the existing `command(...)` helper — `command(WORKFLOW_SCOPE_COMMAND)` between the commit and the push, and the push as `command(defaultBranchPushCommand(defaultBranch))` — and extend step 1's lead sentence with `WORKFLOW_SCOPE_REASON` and `defaultBranchPushReason(defaultBranch)`. Update the function's doc comment (*"The push comes first because …"*) to say why the push skips the hook and why the scope step precedes it, naming the core module as the owner of both.
- [ ] `checks.ts` → `REMOTE_EXECUTION_CHECK`: change the remedy of the `origin/${branch} does not carry ${WORKFLOW_RUN_PATH}` warning from *"commit it and push it with \`git push origin ${branch}\`"* to one built from `WORKFLOW_SCOPE_COMMAND` and then `defaultBranchPushCommand(branch)`, followed by `WORKFLOW_SCOPE_REASON` and `defaultBranchPushReason(branch)` — imported from `../core/defaultBranchPush.js` beside the imports `profileUntrackRemedy` already uses, never retyped. In the doc comment above the check, where it lists that warning, add one sentence on why the remedy skips the hook.
- [ ] `cli/test/init.test.mjs` → the case above: add `'gh auth refresh -s workflow'` and `` `git push --no-verify origin ${<the fixture's default branch>}` `` to the names the closing report must carry, and assert the report carries no `git push origin ` line (the refused form). Keep the comment pointing at `docs/remote-execution.md` → `## 7. Turning it on` step 3, now saying it pins all four commands that step prints.
- [ ] `cli/test/doctor.test.mjs` → the case above: additionally assert the `remote-execution` warn line includes `git push --no-verify origin` and `gh auth refresh -s workflow`.

**Verification:**

- The edited cases in `cli/test/init.test.mjs` and `cli/test/doctor.test.mjs` pass.
- `commands.typecheck` passes.
- `grep -n "git push origin" cli/src/commands/init.ts` returns nothing, and `grep -n "git push origin" cli/src/doctor/checks.ts` returns only `base-freshness` and `remote`-check lines, none inside `REMOTE_EXECUTION_CHECK`.
- `grep -rn "no-verify origin" cli/src` finds the spelling only in `cli/src/core/defaultBranchPush.ts`, and `grep -rn "auth refresh -s workflow" cli/src` likewise finds it only there — no hit in `cli/src/commands/init.ts` or `cli/src/doctor/checks.ts`.
- The four commands `init` prints are byte-identical to the four fenced commands Task 8 writes into `docs/remote-execution.md` → `## 7.` step 3, with `<default branch>` in the document standing for the branch name `init` substitutes.
