### Task 12 — Move the three autonomous fix and orchestration forks' kill-switch checks to the anchor, with "run copy" wording

**Goal:** Make the global kill-switch sections of the three heaviest autonomous forks resolve `<MAIN_REPO>` from the launcher's anchor first. These are the task fork's `## Global kill switch`, the user-review fix fork's equivalent, and the fix-plan fork's `## Safety scaffolding` step 1 **STOP checks.** Today, inside a clone, each resolves the main checkout as the clone itself and so cannot see `AUTONOMOUS_STOP`. Move every run's-own-copy sentence in the three forks to **run copy**, keeping the sentences the two task-shaped forks share identical to each other.

**Depends on:**

- **Task 1**, which allow-lists `Bash(printenv HARNESS_MAIN_REPO)`.
- **Task 3**, which exports the variable to the engine session these forks run in.

**The canonical clause, byte for byte as Tasks 9, 10 and 11 carry it:**

```
the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`
```

None of these three files declares `<MAIN_REPO>` in `## Resolved values`, so none carries the row.

**The wording rule.** Prose that means the run's own copy says **run copy**. These fixed replacements are shared with other files, so apply each exactly:

| Phrase today | Becomes |
|---|---|
| `the run's own worktree` | `the run copy` |
| `current worktree` | `current run copy` |
| `this worktree's own` | `this run copy's own` — including inside the quotation *"this worktree's own source"*, which each fork's `<reference_impl>` row quotes from its own `## Override A`, so the quote and its source move together |
| `From a worktree, the script-allowlist guard` | `From a run copy, the script-allowlist guard` |
| `naming the same worktree root` / `names the same worktree root` | `… the same run-copy root` |
| `worktree branch` | `run branch` |
| `per-worktree` | `per-run-copy` |

Keep:

- the heading `## Override A — worktree-relative reads` and the adjective **worktree-relative** everywhere;
- git's "main worktree";
- every name — `<worktree_glob>`, `create-worktree.sh`, `setup-worktree.sh`;
- every quoted command;
- *"Each worktree is a full checkout of the branch"*, which becomes *"Each run copy is a full checkout of the branch"*, because it describes the run copy, not git.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md`
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`

**Work:**

- [ ] **The three kill-switch resolutions.**
  - Task fork → `## Global kill switch` → **Path:**: *"`<MAIN_REPO>` is the main worktree's root; resolve it from the first `worktree ` line of a bare `git worktree list --porcelain`, and spell it …"* becomes *"`<MAIN_REPO>` is "* followed by the canonical clause, then *"; spell it as a literal absolute path in every command that names it — never through a substitution or a variable — since `$REPO_ROOT` inside a run points at the run copy, not the main repo."*
  - User-review fix fork: the same rewrite of its **Path:** bullet, with its own closing parenthesis kept.
  - Fix-plan fork → `## Safety scaffolding` step 1: *"(resolve `<MAIN_REPO>` as the main worktree's root — the first `worktree ` line of a bare `git worktree list --porcelain` — and spell it …"* becomes *"(resolve `<MAIN_REPO>` as "* followed by the canonical clause and *" — and spell it …"*, the Override 3 push clause kept.
  - Every *"halt and report it; do NOT delete either file"* stays byte for byte.
- [ ] **`plan_orchestration_instructions_autonomous.md`'s prose.** Apply the table and the rule:
  - the `<worktree_glob>` row's *"the sibling-worktree pattern this fork's per-branch worktrees match"*, which becomes *"the sibling pattern this fork's run copies match"*;
  - the `<repo_root>` binding's *"The **current worktree** root"*;
  - Override A's bullets;
  - the statistics paragraphs (*"purely per-worktree"*, *"inside its own worktree"*, *"local to the worktree"*);
  - the push paragraphs;
  - the clean-tree note *"The worktree's working tree is clean"*, which becomes *"The run copy's working tree is clean"*.
- [ ] **`user_review_fixes_instructions_autonomous.md`'s prose.** The same treatment, sentence for sentence where the two forks share a sentence, so a shared sentence still reads identically in both after the edit. That covers the opening paragraph's *"already per-worktree"*, the `<repo_root>` binding (*"This fork runs inside a per-branch worktree"* becomes *"inside a run copy"*), Override A, the STOP paragraphs, the statistics and push paragraphs, and *"dangles in the worktree"*.
- [ ] **`user_review_fix_plan_writing_instructions_autonomous.md`'s prose.** Apply the rule to *"(the worktree, or the main repo in the manual entry point)"*, *"per-worktree-correct"*, *"the watcher copied into the worktree before launch"*, *"From a worktree"*, *"pushes the worktree branch"*, *"the worktree's own copy of `<reference_impl>`"* and *"a reused worktree still carries the prior run's"*.
- [ ] **Close.** `grep -n 'worktree list' plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`: every hit carries `printenv HARNESS_MAIN_REPO`.

**Verification:**

- The grep in the last Work bullet satisfies its invariant.
- `grep -rn "this worktree's own" plugin` prints nothing, and `grep -c "this run copy's own source" plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md` finds the quotation and its source in each fork — the same number of hits in both files.
- `grep -n -i 'worktree' <each of the three files>`: every remaining hit is the Override A heading or *"worktree-relative"*, git's "main worktree", a name, a quoted command, or the clause. Record any judgement call in the deviation notes.
- `grep -rn '^## \|^### ' <each file>` before and after the edit give identical output: no heading moved.

**Deviations from plan:**

- Both task-shaped forks' Override A parity bullet read *"must read **this worktree's own** copy of `<reference_impl>`"*; the fixed replacement would give *"this run copy's own copy"*, so the trailing "copy of" was dropped: *"must read **this run copy's own** `<reference_impl>`"*, identical in both forks. The fix-plan fork's *"the worktree's own copy of `<reference_impl>`"* likewise became *"the run copy's own `<reference_impl>`"*.
- Phrases the plan did not list, judged as meaning the run's own copy and moved to run copy: task fork `<next_step_note>` *"lands it at the branch worktree's `<state_dir>/user_reviews/`"* → *"lands it at the `<state_dir>/user_reviews/` of the branch's run copy"*; *"in the same worktree"*, *"shared across worktrees"*, *"(the worktree's link …)"*, *"in **different** worktrees"*, *"from every worktree"* → run copy / run copies; user-review fix fork *"permission-gated in worktree headless runs"* → *"permission-gated in headless runs in a run copy"*; *"This fork runs inside a per-branch worktree matching"* (task fork) → *"inside a run copy matching"*, matching the user-review fix fork's *"inside a run copy"*.
- `worktree branch` → `run branch` applied mechanically, so the task fork's *"the run's **own non-protected** worktree branch"* and the user-review fix fork's *"the run's own non-protected worktree branch"* now read *"… run branch"*, the same wording `docs_orchestration_instructions_autonomous.md` already carries.
- After the edit no git "main worktree" phrase remains in the three files: each one stood in a kill-switch resolution the canonical clause replaced. Every remaining `worktree` hit (`grep -n -i worktree` over the three files) is the Override A heading, *worktree-relative*, the `<worktree_glob>` name, or the canonical clause.
- Verification as run: `grep -n 'worktree list' …three files… | grep -vc 'printenv HARNESS_MAIN_REPO'` → `0`; `grep -rn "this worktree's own" plugin` → no output; `grep -c "this run copy's own source"` → `2` in each task-shaped fork; heading lists before/after diffed equal for all three files; `bash scripts/typecheck.sh` → `PASS: typecheck`.
