### Task 4 — Point all 22 `<MAIN_REPO>` resolution clauses at the module, in one pass

**Goal:** Replace the old fallback wording with one new clause at every occurrence the task prompt inventories: 22 occurrences in 21 plugin files. Every resolution site then defers its fallback to `plugin/instructions/main_repo_resolution.md` → `## The fallback`, and a `git grep` for the new clause reaches exactly the plugin files the old one did. The clause is plugin wire text, so every occurrence changes in this one task's single commit.

**Depends on:** Task 2, which creates `plugin/instructions/main_repo_resolution.md` with the heading `## The fallback` and a `## Who may cite this` roster. That roster names the 21 files below as `${CLAUDE_PLUGIN_ROOT}/<dir>/<file>` entries, plus three repo-relative citers outside the plugin (`cli/src/doctor/checks.ts`, `docs/watcher.md`, `docs/cli.md`) that this task does not touch. This task cites that path and heading byte-for-byte, and never edits the roster.

**Where this task stops.**

- **`docs/watcher.md`** also carries the old clause, but it is not a plugin file. **Task 9** quotes the new clause there.
- **The corpus check** that freezes the clause is **Task 8**'s.
- **Out of scope:** the literal-spelling sentence and the push-wrapper wording belong to the follow-up branch `fix_docs_flow_main_repo_binding`. Change the resolution clause and nothing else at each site.

### Targets

- `plugin/agents/committer.md`, `plugin/agents/qa-tester.md`
- `plugin/commands/branch-answer.md`, `branch-pause.md`, `branch-prompt.md`, `branch-resume.md`, `branch-start-docs-autonomous.md`, `branch-start-plan-autonomous.md`, `branch-start-user-review-fix-autonomous.md` (two occurrences: the `<MAIN_REPO>` row and the kill-switch step), `branch-status.md`, `branch-user-review.md`
- `plugin/docs/AUTONOMOUS_FLOW.md`
- `plugin/instructions/autonomous_pause_and_ledger.md`, `clarification_digest_instructions.md`, `dispatch_discipline_instructions.md`, `docs_orchestration_instructions_autonomous.md`, `improvement_observations_instructions.md`, `plan_orchestration_instructions_autonomous.md`, `task_plan_writing_instructions_autonomous.md`, `user_review_fix_plan_writing_instructions_autonomous.md`, `user_review_fixes_instructions_autonomous.md`

**Work:**

- [ ] **The one replacement.** In every target, replace this exact substring, the **old clause**:

  ```
  the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`
  ```

  with this exact substring, the **new clause**:

  ```
  the path a bare `printenv HARNESS_MAIN_REPO` prints, else the path `${CLAUDE_PLUGIN_ROOT}/instructions/main_repo_resolution.md` → `## The fallback` resolves, and a stop with its sentence when it resolves none
  ```

  Byte-for-byte, the arrow included (U+2192). Change no character before or after it at any site: the `## Resolved values` row's trailing *"Spell it as a literal absolute path…"*, the kill-switch sentences, and the `qa-tester.md` **Mocking requests** bullet all keep their surrounding text.
- [ ] **Read each sentence once after the swap**, and confirm it still parses with the new clause in place, in each shape: the `## Resolved values` rows, the numbered `Resolve <MAIN_REPO> as …;` steps, the kill-switch parentheticals, the `is …;` sentences of the two **Path:** bullets, and the `(resolve <MAIN_REPO> as … — and spell it …)` parenthetical. Do not reword a sentence to make it read better; if one does not parse, report it as a blocker naming the site.
- [ ] **No word-count hold on the two agents.** `committer.md` and `qa-tester.md` each grow by the clause swap alone (the new clause is longer than the old one), and that growth is allowed: `.claude/context/plugin.md` → `## Writing agent prose` → *"An agent's growth is paid for by behaviour"* forbids growth only for a change that adds no behaviour, and this clause adds two — the clone-arm fallback the module resolves and the stop when it resolves none. Make no compensating cut in either agent; the one replacement is the only edit in each file.

**Verification:**

- `git grep -l -F 'the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`' -- plugin` finds nothing. The needle is the **full old clause**, not the phrase `` first `worktree ` line ``: the module Task 2 creates names today's F2 answer in those words on purpose, and this grep must not reach it.
- `git grep -c -F '${CLAUDE_PLUGIN_ROOT}/instructions/main_repo_resolution.md` → `## The fallback` resolves, and a stop with its sentence when it resolves none' -- plugin` lists exactly the 21 targets above. `branch-start-user-review-fix-autonomous.md` shows `2` and every other file `1`.
- That file list equals the `${CLAUDE_PLUGIN_ROOT}/…` entries of the `## Who may cite this` roster in `plugin/instructions/main_repo_resolution.md`, each mapped to `plugin/…`, read side by side. This is the same comparison Task 8 → **The module's two checks** makes. The roster's three repo-relative entries (`cli/src/doctor/checks.ts`, `docs/watcher.md`, `docs/cli.md`) are not part of this comparison. Their presence is not a mismatch, and this task never removes them.
- `git diff --stat -- plugin` lists exactly the 21 targets, and `git diff -- plugin` changes one substring per occurrence, `committer.md` and `qa-tester.md` included. Read it to confirm.
