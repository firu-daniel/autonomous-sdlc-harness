### Task 16 — Add the autonomous QA.0 augment commit point

**Goal:** Fix defect 7. In the autonomous user-review flow, QA.0 dispatches `ui-tests-plan-writer`, which adds or revises `ui_test_<K>.md` files and the UI-test index. No commit point covers them:

- `committer` `mode: ui_test_pass` stages only the index;
- the commit-point list in `plugin/instructions/plan_orchestration_instructions_autonomous.md` has no QA.0 entry.

New per-test files are therefore committed only if a later QA-fix `review_item` commit happens to sweep them in, which also corrupts that unit's subject reconciliation. If every test passes, they stay untracked at "branch ready for review", against the clean-tree invariant (`plugin/instructions/autonomous_pause_and_ledger.md` → `## 3`). After this task, an **explicit commit point** in the autonomous fork commits the augment as soon as QA.0 returns.

**Depends on:** Task 15, which fixes the augment prompt and the writer's return this commit point reads. Also Task 14, which edits the `R4` bullet of `user_review_fixes_instructions_autonomous.md` and the `E` bullet of `plan_orchestration_instructions_autonomous.md`; this task adds a new section and a new list entry and edits neither bullet. Task 4 appended entry 13 to the same list.

**The writer's return this point reads** (`plugin/agents/ui-tests-plan-writer.md` → `## Output contract`, unchanged): `ui_test_index: <path>` / `ui_test_files_dir: <path>` / `tests_count: <N>` on a normal write, or `no_ui: true` / `tests_count: 0`, or a `## Questions` section. A zero-test augment leaves every file byte-identical.

**The commit point's exact form**, in the house style of this fork's `Override D` and of the fix-plan fork's `Override 3` (the wrapper, an unconditional push, no `if`, no existence guard):

```zsh
bash <scripts_dir>/commit-on-branch.sh --repo "$REPO_ROOT" \
  "<the writer's ui_test_index, repo-relative>" \
  "<the writer's ui_test_files_dir, repo-relative>" \
  -- "chore: Add UI-test plan for ${branch}"
bash <scripts_dir>/push-branch.sh "$REPO_ROOT"
```

- It reuses the existing fixed subject `chore: Add UI-test plan for <branch>`, the one the planning flow's UI-test commit uses (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 3`), so no new fixed-form subject is introduced.
- Write the two paths out repo-relative, with no `<…>` left in the issued command, because a `<` withdraws the script-allowlist guard's permit.
- Exit 3 (nothing to commit) is the normal outcome of a zero-test augment.

### Targets

- `plugin/instructions/user_review_fixes_instructions_autonomous.md` (a new section)
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` (one appended entry in `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`)

**Work:**

- [ ] Add `## Override L — commit the QA.0 UI-test plan augment (autonomous fork only)` to `user_review_fixes_instructions_autonomous.md`, after `## Override K` and before `## What this file does NOT redefine`. It states:
  - **Trigger:** right after `### QA.0` step 2's writer returns a normal write (`ui_test_index:` present). It does not fire on `no_ui: true` (nothing was written) or on a `## Questions` return (the `<ask>` park comes first, and the resumed QA.0 fires it). It fires before E.0 starts the dev server, so the per-test mark-pass commits and any E.3 `review_item` commit see a clean tree with the augment tracked.
  - The command block, and the exit-3 note.
  - Why no committer mode fits: `ui_test_pass` stages only the index and flips a checkbox, and `review_plan_file` is locked to a different subject.
  - The **Shared rationale** back-reference line the fork's other overrides carry.
- [ ] Same file → `## What this file does NOT redefine`, the bullet listing Phases A, QA, G and D as run by reference: add "except `Override L`'s commit after QA.0", as that list already carves out `Override K`.
- [ ] `plan_orchestration_instructions_autonomous.md` → the commit-points list: append entry **14**, "User-review-fix fork commits the QA.0 UI-test plan augment", after Task 4's entry 13, without renumbering. Point it at `Override L` and state the trigger and the exit-3 no-op. The fork→fork citation is class (ii) of `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors`. Extend the `**Post-commit push.**` paragraph's list of direct-`git` pushes to include this point's push.

**Verification:**

- `git grep -n 'Override L' -- plugin` shows the section and its list entry. `git grep -n 'Add UI-test plan for' -- plugin` shows only the planning fork's existing use and this new one, with the same spelling.
- Walk an autonomous user-review round on paper, three ways:
  - QA.0 adds `ui_test_5.md` and revises `ui_test_2.md`: Override L commits the index and folder, E.1 runs, test 5 passes, and the `ui_test_pass` commit finds a tree in which only the index flip changed;
  - zero-test augment: exit 3, no commit;
  - `no_ui: true`: Override L does not fire.
- `git grep -n -E 'semi.autonomous' -- plugin/instructions/user_review_fixes_instructions_autonomous.md`: nothing here claims the semi-autonomous fork is covered. That gap is stated as out of scope in the story Context.
