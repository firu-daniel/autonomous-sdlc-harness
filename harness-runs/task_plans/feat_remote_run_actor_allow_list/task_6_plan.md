### Task 6 — `doctor --check-github` names the effective list and warns on `*` with a subscription token

**Goal:** Under `--check-github`, the `remote-github` check names who may start, steer, answer and review a run.
- It **warns** when the list admits nobody: an unset list in an organisation-owned repository.
- It **warns** when the list is `*` while `CLAUDE_CODE_OAUTH_TOKEN` is set. A subscription token must not serve every writer.

**Depends on:** Task 1. `cli/src/remote/githubActions.ts` exports:
```ts
export const RUN_ACTORS_VARIABLE = 'HARNESS_RUN_ACTORS';
export const RUN_ACTORS_EVERY_WRITER = '*';
export interface RepositoryOwner { readonly login: string; readonly type: string }
export type RunActors =
  | { readonly kind: 'every-writer' }
  | { readonly kind: 'listed'; readonly logins: readonly string[] }
  | { readonly kind: 'owner'; readonly login: string }
  | { readonly kind: 'nobody'; readonly owner: RepositoryOwner | undefined };
export function effectiveRunActors(value: string | undefined, owner: RepositoryOwner | undefined): RunActors;
```
This task calls `effectiveRunActors` and never re-derives the rule.

**Where this task stops.**
- **Task 7** adds the collaborators read and the *"writers beyond the list"* warning to the same check. It consumes the `RunActors` value this task computes, so compute it once, in a `const` it can read.
- **Task 8** adds the old-copy warnings to `remote-execution` and `forge`.
- **Task 12** documents all three.
- Secrets are still read by name only.
- The variable's **value** is read, as `doctor` already reads `HARNESS_RUNNER`'s and `HARNESS_TRIGGER_LABEL`'s. The task prompt says *"names only"*, and the story index records why the repository wins.

### Targets

- `cli/src/doctor/checks.ts`: `REMOTE_GITHUB_CHECK`'s `run` and its doc comment, plus one local parser.
- `cli/test/doctor.test.mjs`: `GH_CALLS`, `answerGh`'s healthy set, the `failing` table's *calls made* column, and new cases in the `remote-github` suite.

**Work:**

- [ ] **The owner read.**
  - Add a parser beside `prApprovalSettingOf`: `repositoryOwnerOf(stdout: string): RepositoryOwner | undefined`. It reads `.owner.login` and `.owner.type` of a `gh api repos/{owner}/{repo}` answer, and returns `undefined` for any other shape.
  - In `REMOTE_GITHUB_CHECK.run`, after the retention read and before the `forgeTriggerApplies` block, and only when `variableValues` was read:
    - take the list from `variableValues.get(RUN_ACTORS_VARIABLE)`;
    - when `effectiveRunActors(value, undefined)` is not `every-writer` or `listed` (the list is unset), ask `ask(['api', 'repos/{owner}/{repo}'])`.
  - Grade that read the way the retention read is graded:
    - an `undefined` answer is `fail(noSpawn)`;
    - `unknown` is a `cannotTell(…, 'who owns the repository, so who may act on a run')` warning;
    - `refused` is the same warning;
    - an unread shape is a *cannot tell* warning.
  - Then compute `const runActors = effectiveRunActors(value, owner)`, with `owner` `undefined` when the read failed.
- [ ] **The report.**
  - **`every-writer`** is a note: *"`HARNESS_RUN_ACTORS` is `*`, so every collaborator with write access may start, steer, answer and review a run"*.
  - **`listed`** is a note naming the logins with `nameList`.
  - **`owner`** is a note: *"`HARNESS_RUN_ACTORS` is unset, so only the repository owner, <login>, may …"*.
  - **`nobody`, owner read** is a **warning**: *"`HARNESS_RUN_ACTORS` is unset and <login> is an <type>, not a user, so no person may start, steer, answer or review a run: set it with `gh variable set HARNESS_RUN_ACTORS --body <login,login>`, or `--body '*'` for every writer"*.
  - **`nobody`, owner not read** adds no second warning: the *cannot tell* warning above already stands.
  - When the variables listing was unread, extend the existing *"cannot tell the HARNESS_RUNNER and HARNESS_REMOTE_STOP variables"* text to name `HARNESS_RUN_ACTORS` too, and compute nothing.
- [ ] **The subscription warning.** When `secretNames` was read, `secretNames.has(OAUTH_TOKEN_SECRET)`, and `runActors.kind === 'every-writer'`, add a **warning**: *"`HARNESS_RUN_ACTORS` is `*` while `CLAUDE_CODE_OAUTH_TOKEN` is set, so every writer's runs spend one person's subscription, which its terms do not let them share: name the people in `HARNESS_RUN_ACTORS`, or use a Claude API organisation's key in `ANTHROPIC_API_KEY` (docs/remote-execution.md, section 9)"*. It fires whether or not `ANTHROPIC_API_KEY` is also set: the task prompt names the token alone, and the token stays readable by every writer (G7).

  Extend the check's doc comment with the read, the three notes, the two warnings, and the *cannot tell* rule for the owner read.
- [ ] **`doctor.test.mjs`.**
  - Append `owner: ['api', 'repos/{owner}/{repo}']` to `GH_CALLS`, in the position the check asks it: after `retention`. Its healthy answer in `answerGh` is `{"owner":{"login":"fixture-owner","type":"User"}}`. The existing exact-invocation assertion (`Object.values(GH_CALLS)`) then still describes the healthy run, whose variables are `[]`.
  - Update the *calls made* column (the fifth) of the `failing` table inside `test('the remote-github check asks GitHub only under --check-github and grades each answer', …)` for every row that now reaches the owner read. Two rows do, each `7` → `8`:
    - `['GitHub does not know harness-run.yml', …, 7]` → `8`;
    - `['neither credential secret is set', …, 7]` → `8`.

    Why: neither case returns early. `REMOTE_GITHUB_CHECK.run` pushes to `failures` and carries on, `answerGh` answers `variables` with `[]`, and the owner read runs whenever the variables listing was read and the list is unset. The `gh does not spawn` (`0`) and `gh auth status exits non-zero` (`1`) rows stop before the variables listing and stay as they are.
  - Add cases:
    - (a) healthy: a pass whose line names `fixture-owner` as the only actor;
    - (b) owner type `Organization`: a warn naming `HARNESS_RUN_ACTORS` and the `gh variable set` command;
    - (c) owner read refused (status 1, stderr `HTTP 404`): a *cannot tell* warning;
    - (d) variables `[{"name":"HARNESS_RUN_ACTORS","value":"*"}]` with the healthy secrets, which carry the token: a warn naming the subscription, and the owner call **not** made;
    - (e) the same with secrets `ANTHROPIC_API_KEY` only: no subscription warning;
    - (f) `"alice, bob"`: a note naming both, and no owner call.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- Run the edited `cli/test/doctor.test.mjs` from `cli/` with `npm test -- test/doctor.test.mjs`, under the conditions in `unit_loop_core.md` → `## The test-run rule` (3). Cases (a)–(f) pass. The exact-invocation case passes with the appended `owner` entry, the `failing` table passes with its two edited *calls made* values (`8` for `GitHub does not know harness-run.yml` and for `neither credential secret is set`), and every other existing `remote-github` case passes unedited.
- Grep `checks.ts` for `'HARNESS_RUN_ACTORS'` and `'*'` used as the list's value. There is none: both come from Task 1's constants.

**Deviations from plan:**
- `runActors` is a `let` declared before the `variableValues !== undefined` block (`RunActors | undefined`), not a `const`: it is assigned inside that block, and Task 7 needs it after it. It is still computed once, by `effectiveRunActors`.
- The owner endpoint is a local `REPOSITORY_ENDPOINT` constant beside `PR_SETTING_ENDPOINT`, on `ARTIFACT_RETENTION_ENDPOINT`'s terms, rather than an inline literal.
- In the report sentences `HARNESS_RUN_ACTORS`, `CLAUDE_CODE_OAUTH_TOKEN` and `ANTHROPIC_API_KEY` are rendered bare, as every sibling sentence in the check renders a secret or variable name; `*` and the `gh variable set` command keep their backticks. The `listed` note reads `HARNESS_RUN_ACTORS admits <nameList>, so only that login / those logins may start, steer, answer and review a run`.
