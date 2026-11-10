### Task 1 — Give the plan and docs engine commands a `<MAIN_REPO>` row and the literal push spelling

**Goal:** Make `plugin/commands/branch-start-docs-autonomous.md` and `plugin/commands/branch-start-plan-autonomous.md` declare `<MAIN_REPO>` the way `plugin/commands/branch-start-user-review-fix-autonomous.md` already does. That means a `## Resolved values` row carrying the resolution clause and the literal-spelling sentence, and a step 2 that points at that row. Each command's hard boundary then names the agent's push as `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal.

**Model to copy.** `plugin/commands/branch-start-user-review-fix-autonomous.md` is the finished shape. See its `## Resolved values` lead paragraph ("they resolve from the adopting repository's `harness.config.json`, except `<MAIN_REPO>`, which is derived at runtime"), its `<scripts_dir>` row ("`push-branch.sh`, in step 1 and the hard boundary, under `<MAIN_REPO>`"), its `<MAIN_REPO>` row, and its `## Hard boundary` second paragraph ("via `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal"). Do not edit that file.

**Where this task stops.** It changes no word of the resolution clause. The clause moves from step 2 into the new row, and its count in each file stays what it was. The engine forks these commands dispatch are Tasks 2–4's. The guard that holds this shape in place is Task 6's.

### Targets

- `plugin/commands/branch-start-docs-autonomous.md`
- `plugin/commands/branch-start-plan-autonomous.md`

**Work:**

- [ ] **The row, in both files.** Insert the `<MAIN_REPO>` row into `## Resolved values`, immediately after the `<scripts_dir>` row, as the model places it. Copy the line **byte for byte** from `plugin/agents/committer.md` → `## Resolved values` (the line beginning ``| `<MAIN_REPO>` | derived at runtime |``). Never retype it.
- [ ] **The lead paragraph, in both files.** Drop `<MAIN_REPO>` and its "— `<MAIN_REPO>` in step 2" clause from the "not ordinary **path placeholders**" list. Then extend "they resolve from the adopting repository's `harness.config.json`" with ", except `<MAIN_REPO>`, which is derived at runtime", as the model words it. In `branch-start-docs-autonomous.md`, the closing sentence calls `$REPO_ROOT` "The one anchor this command derives at runtime". Reword it so it no longer claims to be the only runtime value, and say that a command spells it as `<repo_root>`, the literal path it resolves to: the hard boundary below now names `<repo_root>`, and this file binds no other token by that name. `branch-start-plan-autonomous.md` already names `<repo_root>` as a binding step 1 supplies, so it needs no such addition.
- [ ] **Step 2, in both files.** Replace the inline resolution in **Global kill switch — check at session start.** with a pointer: `<MAIN_REPO>` resolves per its `## Resolved values` row. In the docs file that is the parenthetical after "the global switch in the **main** repo —". In the plan file it is the closing parenthetical sentence. Keep every other word of the step.
- [ ] **The `<scripts_dir>` row, in both files.** Change "`push-branch.sh`, in the hard boundary" to "`push-branch.sh`, in the hard boundary, under `<MAIN_REPO>`", matching the model row's qualifier.
- [ ] **`## Hard boundary`, second paragraph, in both files.** Replace "(via `<scripts_dir>/push-branch.sh`)" with "(via `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal)". Leave "`push-branch.sh` self-refuses" (docs) and "enforced by `push-branch.sh`" (plan) as they are: they name a property of the wrapper, not how the agent spells the call.

**Verification:**

- Before editing, run `git grep -c -F "printenv HARNESS_MAIN_REPO" -- plugin/commands/branch-start-docs-autonomous.md plugin/commands/branch-start-plan-autonomous.md` and note its output. Run it again after editing. Each file's count must equal its pre-edit count.
- `git grep -h -F '| `<MAIN_REPO>` |' -- plugin/agents/committer.md plugin/commands/branch-start-docs-autonomous.md plugin/commands/branch-start-plan-autonomous.md` must print identical lines, one per file.
- `git grep -nE "(^|[^/])<scripts_dir>/push-branch\.sh" -- plugin/commands/branch-start-docs-autonomous.md plugin/commands/branch-start-plan-autonomous.md` must print no hits.
- `git grep -n -F "<MAIN_REPO>" -- plugin/commands/branch-start-docs-autonomous.md plugin/commands/branch-start-plan-autonomous.md` must print no line that resolves `<MAIN_REPO>` outside the `## Resolved values` row: step 2 only points at the row.
- `git diff --name-only` lists only this task's two targets.
