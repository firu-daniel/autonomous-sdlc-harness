### Task 3 — Move `<MAIN_REPO>` into a row in both orchestration forks and spell the post-commit push literally

**Goal:** Make the two implementation forks, `plugin/instructions/plan_orchestration_instructions_autonomous.md` and `plugin/instructions/user_review_fixes_instructions_autonomous.md`, declare `<MAIN_REPO>` in a `## Resolved values` row, in the same words as every other row. Today each binds it "where it is written", in its `## Override B` **Path:** bullet, with a reworded variant of the literal-spelling rule. Also make the task fork's clean-tree prose name the agent's push only as the main checkout's copy.

**Where this task stops.** It changes no word of the resolution clause. The clause moves from each fork's **Path:** bullet into the new row, and its count in each file stays what it was. It does not touch the push fences under `### Override E` or the other commit points, which are already literal. Nor does it touch the "Flip the … entries" and "**Commits** land per doc" lines, which already name `<MAIN_REPO>/<scripts_dir>/…`.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md`
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`

**Work:**

- [ ] **The row, in both files.** Insert the `<MAIN_REPO>` row into `## Resolved values`, immediately after the `<repo_root>` row. Copy it **byte for byte** from `plugin/agents/committer.md` → `## Resolved values` (the line beginning ``| `<MAIN_REPO>` | derived at runtime |``).
- [ ] **The lead paragraph, in both files.** The closing parenthetical lists `<MAIN_REPO>` among the names that are "none of the three: each is bound where it is written — `<MAIN_REPO>` in `## Override B …` below". Remove `<MAIN_REPO>` and that trailing clause, and keep the rest of the list. The table now declares it, and the paragraph already says the table's tokens "resolve from the runtime or from the adopting repository's `harness.config.json`".
- [ ] **The `<gate_launcher>` binding, in both files.** Its last sentence reads "`<MAIN_REPO>` resolves as the **Path:** bullet of `## Override B — global kill switch` below states." Replace it with "`<MAIN_REPO>` resolves per its `## Resolved values` row above."
- [ ] **`## Override B` **Path:** bullet, in both files.** Replace the inline resolution and its variant spelling rule ("`<MAIN_REPO>` is the path a bare … ; spell it as a literal absolute path in every command that names it — never through a substitution or a variable …") with a pointer: `<MAIN_REPO>` resolves per its `## Resolved values` row, and is never `$REPO_ROOT`, which inside a run points at the run copy, not the main repo. Keep the rest of the bullet.
- [ ] **`plan_orchestration_instructions_autonomous.md`, the clean-tree prose.**
  - In entry 15, "followed by its own `push-branch.sh`" becomes "followed by its own push through the main checkout's `push-branch.sh`".
  - In **Post-commit push.**, "the direct-`git` points push via `<scripts_dir>/push-branch.sh`" becomes "the direct-`git` points push via `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal".
  - In the same paragraph, "Each of those is a plain, single-statement `push-branch.sh` call issued immediately after the commit it follows" no longer names the wrapper bare: it says each is that call, plain and single-statement, issued immediately after the commit it follows.

**Verification:**

- Before editing, run `git grep -c -F "printenv HARNESS_MAIN_REPO" -- plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md`. Run it again after editing. Each count must be unchanged.
- `git grep -h -F '| `<MAIN_REPO>` |' -- plugin/agents/committer.md plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md` must print identical lines, one per file.
- `git grep -n -F "bound where it is written" -- plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md` must print no line that still names `<MAIN_REPO>`.
- `git grep -n -F "Path:** bullet" -- plugin` must print no hits: no citer still resolves `<MAIN_REPO>` through Override B.
- `git grep -nE "(^|[^/])<scripts_dir>/push-branch\.sh" -- plugin/instructions/plan_orchestration_instructions_autonomous.md` must print no hits.
- `git diff --name-only` lists only this task's two targets.
