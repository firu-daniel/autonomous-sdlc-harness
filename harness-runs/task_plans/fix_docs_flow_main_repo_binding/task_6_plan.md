### Task 6 — Extend the `<MAIN_REPO>` corpus suite with the row, the push spelling and the forbidden resolutions, each run red once

**Goal:** Extend `cli/test/main-repo-resolution-corpus.test.mjs`, #183's suite, so that it fails when an autonomous plugin file does any of the following:
- names the agent's push as a bare `<scripts_dir>/push-branch.sh`, or with a `$` argument;
- binds `<MAIN_REPO>` without the byte-identical `## Resolved values` row and its literal-spelling sentence;
- reintroduces "watcher-supplied", or a pipeline resolution of `<MAIN_REPO>`.

Each new case is run red once against a named working-tree mutation, and that run is recorded in the suite's header.

**Depends on:** Tasks 1–5, which together produce the end state this suite asserts:
- **The row.** The fourteen files listed below carry the `<MAIN_REPO>` row byte-identically: `plugin/agents/committer.md`'s existing line, which is the resolution clause followed by `. Spell it as a literal absolute path in the command, never through a substitution or a variable.`. Tasks 1–4 add it to six files. Eight already carry it.
- **The sentence alone.** `plugin/instructions/prompt_injection_screen.md` carries the sentence in its row but not the resolution clause (Task 5).
- **No bare push.** No plugin `.md` file names `<scripts_dir>/push-branch.sh` unless `<MAIN_REPO>/` precedes it (Tasks 1, 3, 4, 5). The phrase "It uses the `$REPO_ROOT` the calling command" appears nowhere (Task 4).
- **Unchanged counts.** Every file's resolution-clause count is unchanged, so the existing `main-repo-resolution-clause` row and the roster check stay green as they are.

This task edits no plugin file. A red here after Tasks 1–5 means a plugin task missed a site. Report it as a blocker naming the file; never weaken a case to pass.

**Registration.** This file is already a `treeGuards` entry in `harness.config.json` (`test/main-repo-resolution-corpus.test.mjs`, covering `plugin/**/*.md`), so no registering task is owed.

### Targets

- `cli/test/main-repo-resolution-corpus.test.mjs`. This task's own test file, and the only file it changes.

**Work:**

- [ ] **Constants and two new `CASES` rows.** Build both needles from the existing `NEW_CLAUSE` constant, never from a retyped clause.
  - **`LITERAL_SPELLING`** is the exact sentence `Spell it as a literal absolute path in the command, never through a substitution or a variable.`
  - **`MAIN_REPO_ROW`** is `` '| `<MAIN_REPO>` | derived at runtime | The main checkout — ' + NEW_CLAUSE + '. ' + LITERAL_SPELLING + ' |' ``.
  - **Row `main-repo-resolved-values-row`** (root `plugin`, glob `.md`, needle `MAIN_REPO_ROW`) expects `1` in each of these fourteen files: `plugin/agents/committer.md`, `plugin/commands/branch-start-docs-autonomous.md`, `plugin/commands/branch-start-plan-autonomous.md`, `plugin/commands/branch-start-user-review-fix-autonomous.md`, `plugin/docs/AUTONOMOUS_FLOW.md`, `plugin/instructions/autonomous_pause_and_ledger.md`, `plugin/instructions/clarification_digest_instructions.md`, `plugin/instructions/dispatch_discipline_instructions.md`, `plugin/instructions/docs_orchestration_instructions_autonomous.md`, `plugin/instructions/improvement_observations_instructions.md`, `plugin/instructions/plan_orchestration_instructions_autonomous.md`, `plugin/instructions/task_plan_writing_instructions_autonomous.md`, `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`, `plugin/instructions/user_review_fixes_instructions_autonomous.md`.
  - **Row `main-repo-literal-spelling`** (needle `LITERAL_SPELLING`) expects the same fourteen plus `plugin/instructions/prompt_injection_screen.md`.
- [ ] **The forbidden set, on `main-repo-resolved-values-row`.** Its `forbidden` list carries:
  - `/(^|[^/])<scripts_dir>\/push-branch\.sh/m`, the bare spelling;
  - `/push-branch\.sh\s+"?\$/`, a `$` argument after the wrapper;
  - the literal string ``'It uses the `$REPO_ROOT` the calling command'``, the prose form Task 4 removed;
  - `'watcher-supplied'`;
  - `` /git worktree list --porcelain`?\s*\|/ ``, a pipeline resolution. The optional backtick before `\s*` lets it match a pipe written right after a closing code span.

  Change the runner's forbidden check to accept a string (as today, by `includes`) or a `RegExp` (by `test`, with no `g` flag). Add one line to the header saying `forbidden` entries may be either. Keep the one-`deepEqual` shape, so that a failure reports both halves.
- [ ] **The binder-classification test.** Add a module-level `EXEMPT` record mapping a file to the reason it carries the resolution clause without the row:
  - `plugin/agents/qa-tester.md`: it resolves a Read-tool path and spells no command with `<MAIN_REPO>`.
  - `plugin/commands/branch-answer.md`, `branch-pause.md`, `branch-prompt.md`, `branch-resume.md`, `branch-status.md`, `branch-user-review.md`: user-invoked in a supervised session, where an unmatched command prompts rather than being refused, and none issues a push.

  Add a `test(...)` asserting two things. First, the sorted keys of the `main-repo-resolution-clause` row's `expected` equal the sorted union of `main-repo-resolved-values-row`'s `expected` keys and `EXEMPT`'s keys. Second, `EXEMPT` and that row share no key. Read both maps from `CASES`, never from a second copy.
- [ ] **Header.** Extend the rule paragraph so it states the three new obligations:
  - every autonomous binder carries the byte-identical row;
  - every exempt one is listed with its reason;
  - no plugin file names the push other than as the main checkout's copy, or resolves `<MAIN_REPO>` through "watcher-supplied" or a pipeline.

  Keep the two existing `RED ONCE` records.
- [ ] **Red once, recorded.** For each case below, make the named mutation in the working tree only, run this file and confirm the stated failure, then restore the mutated file byte for byte. Append one `RED ONCE (<case>) — <date>, <mutation>, then restored: <what failed>` record per case to the header, in the existing records' form.
  1. Delete `LITERAL_SPELLING` from `plugin/commands/branch-start-docs-autonomous.md`'s row. The row case fails, the file missing from its needle.
  2. Restore "via `<scripts_dir>/push-branch.sh`" in that file's `## Hard boundary`. A forbidden hit.
  3. Put `"$REPO_ROOT"` as the argument of one push fence in `plugin/instructions/plan_orchestration_instructions_autonomous.md`. A forbidden hit.
  4. Restore "It uses the `$REPO_ROOT` the calling command" in `plugin/instructions/task_plan_writing_instructions_autonomous.md`. A forbidden hit.
  5. Insert "watcher-supplied" into any plugin `.md`. A forbidden hit.
  6. Insert a `git worktree list --porcelain | head -1` resolution into any plugin `.md`. A forbidden hit.
  7. Delete the sentence from `plugin/instructions/prompt_injection_screen.md`'s row. The sentence case fails.
  8. Remove `plugin/agents/qa-tester.md` from `EXEMPT`, in this file. The classification test fails.

**Verification:**

- `npm test --workspace cli -- test/main-repo-resolution-corpus.test.mjs`, run from the repository root as one plain foreground command, passes. Read the `# fail` / `ℹ fail` count and the exit status, not the summary line.
- Each of the eight mutations above was seen red once and is recorded in the header with its date.
- After the mutations are restored, `git diff --name-only` lists only `cli/test/main-repo-resolution-corpus.test.mjs`, and `git status --short` shows no other modified file.
- The existing `main-repo-resolution-clause` row's `expected` map and the roster test are unchanged in the diff.
