### Task 7 — `doctor --check-github` warns when a subscription token is set and writers exist beyond the list

**Goal:** When `CLAUDE_CODE_OAUTH_TOKEN` is set and the repository has collaborators with write access whom the allow-list does not admit, `remote-github` warns. It names those collaborators and states the residual risk. Any writer can still read the secret by dispatching an edited workflow from a branch (G7). The list stops spending through the harness; it does not stop that.

**Depends on:** Task 6, which computes in `REMOTE_GITHUB_CHECK.run`:
- `const runActors: RunActors = effectiveRunActors(value, owner)`;
- `secretNames`, the secret-name set it already read.

It also depends on **Task 1**'s `runActorAdmitted(actors: RunActors, login: string): boolean`, which compares case-insensitively. This task reads `runActors` and calls `runActorAdmitted`, and never re-derives either.

**Where this task stops.** This task edits `REMOTE_GITHUB_CHECK` only. The old-copy warnings are **Task 8**'s, and `docs/cli.md` is **Task 12**'s. No `gh` call writes anything, and no secret value is read.

### Targets

- `cli/src/doctor/checks.ts`: `REMOTE_GITHUB_CHECK`'s `run`, its doc comment, and one local parser.
- `cli/test/doctor.test.mjs`: `GH_CALLS`, `answerGh`'s healthy set, the `failing` table's *calls made* column, and new cases.

**Work:**

- [ ] **The parser.** Beside Task 6's `repositoryOwnerOf`, add `writersOf(stdout: string): { readonly logins: readonly string[]; readonly count: number } | undefined`. It reads a `gh api repos/{owner}/{repo}/collaborators?per_page=100` answer: an array of objects carrying `login` and `permissions.push`. It returns:
  - every login whose `permissions.push === true` (write, maintain and admin all carry `push`);
  - the array's length, as `count`;
  - `undefined` for any other shape.
- [ ] **The read.** Make it after Task 6's owner read, and only when all three hold:
  - `secretNames?.has(OAUTH_TOKEN_SECRET) === true`;
  - `runActors.kind` is `listed` or `owner`;
  - `variableValues` was read.

  Ask `ask(['api', 'repos/{owner}/{repo}/collaborators?per_page=100'])`. Grade it:
  - `undefined` is `fail(noSpawn)`;
  - `unknown` is a *cannot tell* warning;
  - `refused` is a **note** that the writers were not checked, because listing collaborators needs push access, on the retention read's best-effort terms;
  - an unread shape is a *cannot tell* warning.
- [ ] **The warning.**
  - Take `extra = logins.filter((l) => !runActorAdmitted(runActors, l))`.
  - When `extra` is non-empty, **warn**: *"`CLAUDE_CODE_OAUTH_TOKEN` is set and <nameList(extra)> can write to the repository without being on `HARNESS_RUN_ACTORS`: the list stops them spending the subscription through the harness, but any writer can still read the secret by running an edited workflow from a branch; on a private repository a push ruleset on the workflow paths and the scripts they run closes that, and on a public one only withholding write access does (docs/remote-execution.md, section 9)"*.
  - When `extra` is empty and `count === 100`, **warn** that the first page held no writer beyond the list but more collaborators may exist, so it cannot tell.

  Extend the doc comment with the read, its gate, the warning and the note.
- [ ] **`doctor.test.mjs`.**
  - Append `collaborators: ['api', 'repos/{owner}/{repo}/collaborators?per_page=100']` to `GH_CALLS` after Task 6's `owner`. Its healthy answer is `[{"login":"fixture-owner","permissions":{"admin":true,"maintain":true,"push":true,"triage":true,"pull":true}}]`, so the healthy run passes and the exact-invocation assertion still holds.
  - Update the *calls made* column (the fifth) of the `failing` table inside `test('the remote-github check asks GitHub only under --check-github and grades each answer', …)`, which Task 6 left at `8` for two rows:
    - `['GitHub does not know harness-run.yml', …]` goes `8` → `9`. It does not return early, its secrets are the healthy set and so carry `CLAUDE_CODE_OAUTH_TOKEN`, and the owner read answers `User`, so the list is owner-only and the collaborators read runs.
    - `['neither credential secret is set', …]` stays `8`. Its secrets carry no `CLAUDE_CODE_OAUTH_TOKEN`, so it makes no collaborators read.
  - Add cases:
    - (a) a second writer `Bob` → a warn naming `Bob` and the edited-workflow risk;
    - (b) `Bob` with `"push": false` → no warning;
    - (c) `HARNESS_RUN_ACTORS` `"bob, fixture-owner"` with that writer `Bob` → no warning, which shows case-insensitive matching;
    - (d) the read refused with `HTTP 403` → a note, not a warning;
    - (e) secrets with `ANTHROPIC_API_KEY` only → no collaborators call;
    - (f) `HARNESS_RUN_ACTORS` `*` → no collaborators call; Task 6's warning covers it.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- Run the edited `cli/test/doctor.test.mjs` from `cli/` with `npm test -- test/doctor.test.mjs`, under the conditions in `unit_loop_core.md` → `## The test-run rule` (3). Cases (a)–(f) pass. The exact-invocation case passes with the appended `collaborators` entry, the `failing` table passes with its one edited *calls made* value (`9` for `GitHub does not know harness-run.yml`; `neither credential secret is set` stays `8`), and every other existing `remote-github` case, Task 6's included, passes unedited.
- In the stub's invocation log of case (e), no `collaborators` call appears.
