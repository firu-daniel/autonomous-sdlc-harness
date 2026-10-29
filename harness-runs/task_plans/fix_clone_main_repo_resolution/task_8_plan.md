### Task 8 — Add the extensible corpus check that every `<MAIN_REPO>` site carries the one clause

**Goal:** Make a later edit to any one copy of the `<MAIN_REPO>` resolution clause fail a test rather than a session. The suite checks four things across the plugin corpus and the one developer document that quotes the clause:

- the new clause is carried exactly where it should be;
- the old clause is carried nowhere;
- the module's citer roster matches the set of files carrying the clause;
- the clause's pointer resolves.

The suite is built as a **table of cases**, so that `fix_docs_flow_main_repo_binding` (#149) can add its own corpus cases as rows instead of writing a second suite.

**Depends on:**

- **Task 2**, which creates `plugin/instructions/main_repo_resolution.md`. It has exactly one `## The fallback` heading and a `## Who may cite this` section listing 21 plugin files as `${CLAUDE_PLUGIN_ROOT}/<dir>/<file>` entries, plus three repo-relative entries outside the plugin: `cli/src/doctor/checks.ts`, `docs/watcher.md` and `docs/cli.md`.
- **Task 4**, which puts this exact **new clause**:

  ```
  the path a bare `printenv HARNESS_MAIN_REPO` prints, else the path `${CLAUDE_PLUGIN_ROOT}/instructions/main_repo_resolution.md` → `## The fallback` resolves, and a stop with its sentence when it resolves none
  ```

  into these 21 plugin files, once each, except twice in `plugin/commands/branch-start-user-review-fix-autonomous.md`:

  - `agents/committer.md`, `agents/qa-tester.md`;
  - `commands/branch-answer.md`, `branch-pause.md`, `branch-prompt.md`, `branch-resume.md`, `branch-start-docs-autonomous.md`, `branch-start-plan-autonomous.md`, `branch-start-user-review-fix-autonomous.md`, `branch-status.md`, `branch-user-review.md`;
  - `docs/AUTONOMOUS_FLOW.md`;
  - `instructions/autonomous_pause_and_ledger.md`, `clarification_digest_instructions.md`, `dispatch_discipline_instructions.md`, `docs_orchestration_instructions_autonomous.md`, `improvement_observations_instructions.md`, `plan_orchestration_instructions_autonomous.md`, `task_plan_writing_instructions_autonomous.md`, `user_review_fix_plan_writing_instructions_autonomous.md`, `user_review_fixes_instructions_autonomous.md`.

  It also removes every occurrence of the **old clause**: ``the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain` ``.

**Where this task stops.**

- **`docs/watcher.md`** gains the new clause in **Task 9**, which lands after this task. This suite does not read `docs/watcher.md`. Task 9's own verification greps it, and #149 may add that file as a row of the case table.
- **The tree-guard registration** is **Task 11**'s. This test reads the whole `plugin/` tree as text, so `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 8 requires a `treeGuards` entry for it. Task 11 adds `{ "test": "test/main-repo-resolution-corpus.test.mjs", "covers": "plugin/**/*.md" }` to `harness.config.json`.

### Targets

- `cli/test/main-repo-resolution-corpus.test.mjs` (new).

**Work:**

- [ ] **Header.**
  - **The rule:** the `<MAIN_REPO>` resolution clause is wire text carried byte-identical at every plugin site that resolves `<MAIN_REPO>`, and its single home's roster names exactly those sites.
  - **The registering task:** Task 11 of `fix_clone_main_repo_resolution` registers this file in `treeGuards`.
  - **How a later suite adds a case:** a row in `CASES`, with no new runner code.
- [ ] **`CASES` — one exported array at the top of the file.** Each row is `{ id, root, glob, needle, expected, forbidden }`:
  - `root`: a repo-relative directory under `WORKSPACE_ROOT`, read recursively with `node:fs`. Never shell out to `git grep`.
  - `glob`: a file-name suffix filter, `.md` here.
  - `needle`: the exact string.
  - `expected`: a map from repo-relative path to occurrence count.
  - `forbidden`: strings that must occur in no file under `root`.

  **First row**, `main-repo-resolution-clause`:
  - `root: 'plugin'`;
  - `needle`: the new clause above, as a JS string with the `${CLAUDE_PLUGIN_ROOT}` written literally (escape the `$`, or use a plain quoted string);
  - `expected`: the 21 files with their counts;
  - `forbidden`: the old clause.

  The runner asserts, per row:
  - the set of files containing `needle` under `root` equals `expected`'s keys, with the counts equal (`assert.deepEqual` on a sorted object);
  - no file contains a `forbidden` string, with a failure that lists the file.
- [ ] **The module's two checks — a second `test(...)` reading the one fixed file `plugin/instructions/main_repo_resolution.md`.**
  - `## The fallback` occurs exactly once as a line.
  - Only the `${CLAUDE_PLUGIN_ROOT}/…` entries listed under `## Who may cite this`, mapped to `plugin/…`, are compared, and they must be exactly the first row's `expected` keys. A plugin site added without a roster entry fails here, and so does a plugin roster entry with no site.
  - The roster's repo-relative entries (`cli/src/doctor/checks.ts`, `docs/watcher.md`, `docs/cli.md`) lie outside the first row's `root` (`plugin`), so this check does not compare them. Extract the plugin entries by matching the `${CLAUDE_PLUGIN_ROOT}/` prefix, so the repo-relative lines neither match nor fail the check. State this in a comment beside the check.
- [ ] **Two mutations, each recorded in the header.** Each `test(...)` gets its own mutation, because reverting a site changes neither the roster nor the static `expected` map, so it cannot turn the roster check red. Both mutations are made in the working tree only, run one at a time, and restored before committing.
  - **First row.** Revert one site, for example `plugin/commands/branch-status.md`, to the old clause. Run the file once and see the first row fail: the file drops out of the `needle` set and trips `forbidden`. The roster check stays green under this mutation; record that too. Restore the site.
  - **Roster check.** Delete one `${CLAUDE_PLUGIN_ROOT}/…` entry, for example `${CLAUDE_PLUGIN_ROOT}/commands/branch-status.md`, from `## Who may cite this` in `plugin/instructions/main_repo_resolution.md`. Run the file once and see the roster check fail. Restore the module.
  - Record each red run separately in the header: the mutation, the date and the failing assertion.

**Verification:**

- `npm test --workspace cli -- test/main-repo-resolution-corpus.test.mjs` passes.
- Read the suite and confirm two things. The first row's `expected` keys are exactly the file list under **Depends on:** above, with `branch-start-user-review-fix-autonomous.md` at `2` and every other file at `1`. The runner asserts no total of its own.
- The header names Task 11 as the registering task and records both red runs, one per mutation.
- `git status --short -- plugin` is empty before the commit: both mutated files are restored.
