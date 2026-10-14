### Task 4 — Commit the lessons ledger in both user-review fix-plan forks

**Goal:** Fix defect 5. `user-review-fix-plan-writer` appends net-new lessons to `<state_dir>/lessons.md` in initial-write mode (`plugin/agents/user-review-fix-plan-writer.md` → step 6), and no instruction commits that file. It is then swept into the first Phase A `review_item` commit, which corrupts that unit's subject reconciliation and its `staged: index-only` signal. A gate-cap or `<ask>` park after the write leaves it modified at session end, and the fused autonomous command's launch check halts on a modified tracked file. After this task:

- **Autonomous fork:** a new **explicit commit point** commits the ledger right after every initial-write return.
- **Supervised fork:** the ledger is an **explicit path in the human's fix-plan commit**, named in step 9's uncommitted-artifact list.

**Depends on:** Task 3, which edits the `## Override 3` "Neither gate folder…" paragraph of `user_review_fix_plan_writing_instructions_autonomous.md`. This task adds a section to that file and edits nothing Task 3 changed.

### Targets

- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` (new section, plus the opening paragraph's list of what stays an override)
- `plugin/instructions/user_review_fix_plan_writing_instructions.md` (step 9)
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` (one appended entry in `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`; Tasks 14, 16 and 17 edit other parts of this file and depend on this task)

**The commit point's exact form**, in the house style of `## Override 3` in the same file (the wrapper, no committer, no `if`, an unconditional push):

```zsh
bash <scripts_dir>/commit-on-branch.sh --repo "$REPO_ROOT" \
  "<state_dir>/lessons.md" \
  -- "chore: Record lessons for ${branch}"
bash <scripts_dir>/push-branch.sh "$REPO_ROOT"
```

The subject carries no `<`, no `$(` and no braced form other than the bare `${branch}`, so the script-allowlist guard's permit holds. Exit 3 (nothing to commit) is the normal outcome when the writer appended nothing. The prose spelling of the fixed subject is `chore: Record lessons for <branch>`.

**Work:**

- [ ] Add a new section, `## Override 5 — commit the lessons ledger after the writer's initial write`, after `## Override 4` and before `## Ask-vs-assume policy`. It states:
  - **Autonomous fork only.**
  - **Trigger:** immediately after **every** initial-write return of `user-review-fix-plan-writer`. That is the core's step 5, and step 6's redispatch with answers appended, which is the same mode. It runs **before** step 6 routes any `## Questions` through `<ask>` and before either gate, so a later park or a gate-cap `<escalate>` leaves no modified tracked file. Revision-mode returns never trigger it, because the writer appends lessons in initial-write mode only.
  - The command block above, and exit 3 as the normal no-append outcome.
  - That `## Override 3`'s staging list deliberately does **not** repeat the ledger: this point is its one owner.
  - The **Shared rationale** back-reference line every override in this file carries.
- [ ] Opening paragraph of the same file, the sentence listing "What stays an override is what this mode purely **adds**": add "the lessons-ledger commit (5)".
- [ ] `user_review_fix_plan_writing_instructions.md` → `### <terminal_handoff>` step 9: extend the "Name any **plan-gate findings folder that exists** … as **uncommitted artifacts to include when they commit the fix plan**" sentence to `<state_dir>/lessons.md`, named only when `git status --short <state_dir>/lessons.md` reports it modified. Say why: the writer appended this round's lessons, and an uncommitted ledger is swept into the first fix commit.
- [ ] `plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`: append entry **13**, "User-review-fix-plan fork commits the lessons ledger after the writer's initial write". Point it at `Override 5` in `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md` and state its trigger and its exit-3 no-op. Append rather than insert, because the list is cited by entry number (entry 12 by `user_review_fixes_instructions_autonomous.md`). Adjust the list's lead sentence about ordering so it still describes the list. The fork→fork citation is class (ii) of `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors`, the same class entries 6–8 and 12 use.

**Verification:**

- `git grep -n 'Record lessons for' -- plugin cli/templates` shows exactly the Override 5 command and its prose spelling, and no other subject. This is a new fixed-form subject; the planner raised the conventions-document list of fixed subjects in its `## Corpus staleness` return, and no task edits that document.
- Walk the autonomous fork on paper:
  - writer appends a lesson, then returns `## Questions`: Override 5 commits the ledger, then `<ask>` parks. The tree carries no modified tracked file, so the fused command's tracked-file precondition passes on resume.
  - writer appends nothing: exit 3, no commit, the push is a no-op.
- `git grep -n 'lessons' -- plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions.md` shows one commit owner (Override 5) and one human-commit mention (step 9).
- The new entry 13 does not renumber entries 1–12: `git grep -n 'entry 1[0-9]' -- plugin` still resolves every citation to the same entry.
