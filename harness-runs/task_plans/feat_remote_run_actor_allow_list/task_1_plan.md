### Task 1 — Declare `HARNESS_RUN_ACTORS` and the list's semantics once in `cli/src/remote/githubActions.ts`

**Goal:** Give the allow-list one TypeScript owner: the variable's name, the `*` entry, and three pure functions. Together they state who an unset, `*` or listed value admits. `doctor` (Tasks 6–8) imports them rather than re-deriving the rule.

**Where this task stops.** This task declares names and pure functions, and it edits no shell script, no workflow, no check and no report. The shell copies of the same rule are other tasks' work:
- **Task 2** writes the shell copy in `remote-run.sh`.
- **Task 4** writes the shell copy in `harness-run.yml`'s gate step.
- **Task 4** and **Task 5** write the workflow mirrors of the name.
- **Tasks 6–8** call the functions from `doctor`.

Do not add mirror assertions about those files to the tests here. They would fail until those tasks land, and every task must ship on its own.

### Targets

- `cli/src/remote/githubActions.ts`: two constants, one interface, one union type, three functions, and a module-header sentence.
- `cli/test/remote-names.test.mjs`: literal-value assertions and the case table for the three functions.

**The list's grammar** (story index `## Context`, restated here so this file stands alone):
- **Parsing.** The value is split on `,`. Each entry is trimmed of surrounding whitespace, and empty entries are dropped.
- **Matching.** A login matches an entry case-insensitively.
- **`*`.** An entry `*` anywhere in the list admits every collaborator with write access.
- **No entries.** A value with no entries counts as unset: `undefined`, `''`, only whitespace or only commas. An unset value admits the repository owner alone when the owner's `type` is exactly `User`. Otherwise it admits nobody: the owner is an `Organization`, of an unknown type, or `undefined`.

**Work:**

- [ ] `githubActions.ts`: beside `TRIGGER_ALLOWED_BOTS_VARIABLE`, export:
  ```ts
  /** Repository variable: comma-separated GitHub logins allowed to start, command, answer and review a run; `*` admits every writer; unset admits the owner of a user-owned repository alone, and nobody in an organisation-owned one. */
  export const RUN_ACTORS_VARIABLE = 'HARNESS_RUN_ACTORS';
  /** The {@link RUN_ACTORS_VARIABLE} entry that admits every collaborator with write access. */
  export const RUN_ACTORS_EVERY_WRITER = '*';
  /** The repository's owner as GitHub reports it; `type` is `User` or `Organization`. */
  export interface RepositoryOwner {
    readonly login: string;
    readonly type: string;
  }
  /** Who {@link RUN_ACTORS_VARIABLE} admits, once read against the owner. */
  export type RunActors =
    | { readonly kind: 'every-writer' }
    | { readonly kind: 'listed'; readonly logins: readonly string[] }
    | { readonly kind: 'owner'; readonly login: string }
    | { readonly kind: 'nobody'; readonly owner: RepositoryOwner | undefined };
  ```
- [ ] `githubActions.ts`: export three pure functions, with doc comments that restate the grammar above:
  ```ts
  export function effectiveRunActors(value: string | undefined, owner: RepositoryOwner | undefined): RunActors;
  export function runActorAdmitted(actors: RunActors, login: string): boolean;
  export function carriesRunActors(workflowText: string): boolean;
  ```
  - **`effectiveRunActors`.**
    - Any entry equal to `*` gives `every-writer`.
    - Otherwise, a non-empty entry list gives `listed`, with the logins trimmed as written, in order, and nothing lowercased.
    - Otherwise, an `owner` whose `type === 'User'` and whose `login` is non-empty gives `owner`.
    - Otherwise the result is `nobody`, carrying the owner it was given.
  - **`runActorAdmitted`** compares case-insensitively. It is `false` for an empty `login` and for `nobody`, and `true` for any non-empty login under `every-writer`.
  - **`carriesRunActors`** is `true` when the text contains `vars.HARNESS_RUN_ACTORS`, built from `RUN_ACTORS_VARIABLE` and never retyped. Task 8 uses it to tell a workflow copy written before this release.
- [ ] `githubActions.ts` module header: add one sentence saying this module owns the allow-list's semantics as well as its name. Say that `remote-run.sh` and `harness-run.yml`'s gate step each restate the rule in shell. Those two files are already in the header's mirror list; add no new file to it.
- [ ] `remote-names.test.mjs`:
  - Assert `RUN_ACTORS_VARIABLE === 'HARNESS_RUN_ACTORS'` and `RUN_ACTORS_EVERY_WRITER === '*'`, in the issue-trigger names case or a sibling case.
  - Add one `test` that drives a case table through `effectiveRunActors` and `runActorAdmitted`. It must include at least:
    - `' Alice , bob,,'` admits `alice` and `BOB`, and refuses `carol`;
    - `'alice, * '` admits `carol`;
    - `undefined` with `{login: 'Owner', type: 'User'}` admits `owner` and refuses `bob`;
    - `''` with `{login: 'acme', type: 'Organization'}` admits nobody;
    - `' , '` with `undefined` admits nobody;
    - an empty login is refused under every kind.
  - Add `carriesRunActors` cases for a text with `${{ vars.HARNESS_RUN_ACTORS }}` and one without.
  - Import from `../dist/remote/githubActions.js`, as the file already does.

**Verification:**

- `bash scripts/typecheck.sh` exits 0. `noUnusedLocals` is satisfied, because the exports are consumed by the test and later by Tasks 6–8.
- Run the edited `cli/test/remote-names.test.mjs` from `cli/` (`npm test -- test/remote-names.test.mjs`), under the conditions in `unit_loop_core.md` → `## The test-run rule` (3). The new literal and case-table tests pass.
- Grep `cli/src` for the literal `'HARNESS_RUN_ACTORS'`. It appears once, in `githubActions.ts`.
