### Task 21 — Correct the unlisted-call statements in the review-fix and docs forks and the three autonomous commands

**Goal:** Under the `dontAsk` mode the generated profile now ships, a call that hits an `ask` rule or matches nothing is **refused at once**. The review-fix forks, the docs fork and the three `branch-start-*-autonomous` commands still say such a call *"stalls"* or that its `ask` *"an unattended run cannot answer"*. Rewrite each consequence clause minimally. The rule and every code block stay as they are. These are scope register rows 107, 119–121 and 157.

**Depends on:**

- Task 15 — the default mode and the story's canonical restatement. State the default only, and do not add the `acceptEdits` override clause.
- Task 8 — it edits `user_review_fix_plan_writing_instructions_autonomous.md`, `user_review_fixes_instructions_autonomous.md` and `docs_orchestration_instructions_autonomous.md` first (push lines, `<MAIN_REPO>`).
- Task 10 — it edits `branch-start-user-review-fix-autonomous.md` first (the wrapper sentence).

This task edits none of the lines Tasks 8 and 10 wrote.

**Where this task stops.** The plan and task-plan cores and forks are **Task 20's**. The three commands' `## Hard boundary` push-mechanism sentences stay (register rows 4–6). Only their `ask`-outcome clause changes.

### Targets

- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` — 81, 112.
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` — 38, 96, 116, 142.
- `plugin/instructions/docs_orchestration_instructions_autonomous.md` — 92, 100, 109, 123.
- `plugin/commands/branch-start-docs-autonomous.md` — 59, and the `## Resolved values` `<protected_branches>` row.
- `plugin/commands/branch-start-plan-autonomous.md` — 69, and the `## Resolved values` `<protected_branches>` row.
- `plugin/commands/branch-start-user-review-fix-autonomous.md` — 73, and the `## Resolved values` `<protected_branches>` row.

  The `<protected_branches>` row's clause is *"the generated permission profile's `Bash(git push:*)` **`ask`** entry — evaluated before any `allow`, and unanswerable in an unattended run — is the best-effort layer"* (row 157).

**Work:**

- [ ] `user_review_fix_plan_writing_instructions_autonomous.md`: 81, the branch-guard sentence *"is what stalls a headless run on the `Bash(git commit:*)` branch-guard"*; 112 *"the run **stalls on a permission prompt it cannot answer headlessly**"*.
- [ ] `user_review_fixes_instructions_autonomous.md`:
  - 38 *"invocation stalls or trips the protected-branch commit guard headless"*;
  - 96 *"which an unattended run cannot answer"* (the `Bash(git push:*)` `ask`);
  - 116, the branch-guard sentence;
  - 142 *"**stalls on a permission prompt it cannot answer headlessly**"*.
- [ ] `docs_orchestration_instructions_autonomous.md`:
  - 92 *"so a bare `rm` stalls rather than being refused"*;
  - 100 *"stalls headless on the branch guard"* and *"silently falls through to `ask` and STALLS a headless run"*;
  - 109 *"**stalls on a permission prompt it cannot answer headlessly**"*;
  - 123 *"which an unattended run cannot answer"*.
- [ ] The three commands, the sentence *"the generated permission profile's `Bash(git push:*)` **`ask`** entry, which is evaluated before any `allow` and which an unattended run cannot answer"* → *"… and which an unattended run's permission mode refuses"*. Use the same words in all three, and in the two instruction files' 96 and 123, so the five statements of one fact stay alike.

  Wherever *"the commit silently does not land"* follows, keep *does not land*. Replace *silently* with a clause saying the refusal is the only sign.

  In each command's `## Resolved values` `<protected_branches>` row, *"evaluated before any `allow`, and unanswerable in an unattended run"* → *"evaluated before any `allow`, and refused in an unattended run"*. Use the same words in all three rows and in the two flow documents Task 22 edits (`plugin/docs/AUTONOMOUS_FLOW.md` **2. The best-effort convenience layer.** and `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` **Capability is withheld by basename, not by hope.**), which carry the same clause. The rest of each row stays byte-identical.

**Verification:**

- Re-run derivation entry G's two commands with `-n` in place of `-l` and the six targets as the pathspec. Expect no remaining hit that meets entry G's `change` criteria.
- The five `Bash(git push:*)` sentences are identical after the edit. Check with:

  ```
  git grep -n -F "which an unattended run's permission mode refuses" -- plugin
  ```

  Its set of files must equal the five files named in that bullet: the three commands, `user_review_fixes_instructions_autonomous.md` and `docs_orchestration_instructions_autonomous.md`.
- The five *"evaluated before any `allow`, and refused in an unattended run"* clauses are identical. Check with:

  ```
  git grep -n -F 'evaluated before any `allow`, and refused in an unattended run' -- plugin
  ```

  Its set of files must include the three commands; the two flow documents join it once Task 22 lands. `git grep -n -F 'and unanswerable in an unattended run' -- plugin/commands` prints nothing.
- Code blocks and the commands' frontmatter are unchanged: `git diff` shows prose lines only.
