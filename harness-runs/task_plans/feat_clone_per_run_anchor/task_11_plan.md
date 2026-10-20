### Task 11 — Move the three `branch-start-*-autonomous` commands and the docs fork's kill-switch checks to the anchor

**Goal:** Make the session-start global kill-switch check `<MAIN_REPO>/<state_dir>/AUTONOMOUS_STOP` in each unattended entry command, and in the docs fork's own check, resolve the main checkout from the launcher's anchor first. Today, inside a clone, that check would look in the clone's own state directory and miss the switch. `branch-start-user-review-fix-autonomous.md`, which declares `<MAIN_REPO>` in `## Resolved values`, takes the canonical row. Move these four files' run's-own-copy prose to **run copy** in the same pass.

**Depends on:**

- **Task 1**, which allow-lists `Bash(printenv HARNESS_MAIN_REPO)`.
- **Task 3**, which exports the variable inside the watcher's engine subshell, the process these four documents run in.

**The canonical row, byte for byte as Tasks 8, 9 and 13 carry it:**

```
| `<MAIN_REPO>` | derived at runtime | The main checkout — the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`. Spell it as a literal absolute path in the command, never through a substitution or a variable. |
```

**The canonical clause, byte for byte as Tasks 9, 10 and 12 carry it:**

```
the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`
```

**The wording rule.** Prose that means the run's own copy says **run copy**. These are the fixed replacements several files share:

| Phrase today | Becomes |
|---|---|
| `the run's **own worktree**` | `the **run copy**` |
| `the run's own worktree` | `the run copy` |
| `current worktree` | `current run copy` |
| `From a worktree, the script-allowlist guard` | `From a run copy, the script-allowlist guard` |
| `worktree branch` | `run branch` |

Keep:

- the adjective **worktree-relative**, the name of `## Override A — worktree-relative reads`;
- git's "main worktree";
- *"cannot write a linked worktree's record"*, which is git's own behaviour;
- every heading, every quoted command and every frontmatter key but `description:`.

### Targets

- `plugin/commands/branch-start-docs-autonomous.md`
- `plugin/commands/branch-start-plan-autonomous.md`
- `plugin/commands/branch-start-user-review-fix-autonomous.md`
- `plugin/instructions/docs_orchestration_instructions_autonomous.md`

**Work:**

- [ ] **The three entry commands' step 2 Global kill switch.** In each, the parenthetical that resolves `<MAIN_REPO>` (*"the first entry of `git worktree list` (`git worktree list --porcelain | head -1 | sed 's/^worktree //'`), or the watcher-supplied env"* and its twins) becomes *"`<MAIN_REPO>` is "* followed by the canonical clause. The rest of each step — *"halt immediately and report it. Do NOT delete it"* — stays byte for byte, and *"the per-run `<state_dir>/STOP` inside this worktree"* becomes *"inside this run copy"*.
- [ ] **`branch-start-user-review-fix-autonomous.md`'s row.** Replace the `<MAIN_REPO>` row with the canonical row. Its trailing sentence *"Step 2's global kill switch and the fix-plan fork's push (step 1) both name it."* moves out of the row: drop it, because both steps name `<MAIN_REPO>` themselves.
- [ ] **The three commands' prose.** Apply the wording rule and the shared phrases: *"inside the per-branch worktree it created"*, *"inside the branch's worktree"*, *"(the worktree, or the main repo in the manual entry point)"*, *"per-worktree"* / *"inside its own worktree"*, *"does not create worktrees"*, *"Worktree creation"* / *"Worktree handling"* meaning the run copy's lifecycle, *"its own **non-protected** worktree/feature branch"* (becomes *"run/feature branch"*), and *"`$REPO_ROOT` inside a run points at the run's own worktree"*. Keep *"simplest in the **main** worktree"* and every *"worktree-relative"*.
- [ ] **`docs_orchestration_instructions_autonomous.md`.** In step 1 **Paths (Override-A equivalent).**, *"`<MAIN_REPO>` (for the global kill switch and the commit and push wrappers) is the first entry of `git worktree list`"* becomes *"… is "* followed by the canonical clause. Then apply the shared phrases to the `<repo_root>` row, *"(this worktree, not the main repo)"*, *"worktree agents otherwise write to the main repo"*, the commit paragraph's *"the worktree's own copy stays sandboxed"* and *"From a worktree"* sentence, and *"the run's own non-protected worktree branch"*.
- [ ] **Close.** `grep -n 'worktree list\|watcher-supplied' plugin/commands/branch-start-docs-autonomous.md plugin/commands/branch-start-plan-autonomous.md plugin/commands/branch-start-user-review-fix-autonomous.md plugin/instructions/docs_orchestration_instructions_autonomous.md`: every hit carries `printenv HARNESS_MAIN_REPO`, and no hit says *"watcher-supplied"*.

**Verification:**

- The grep in the last Work bullet satisfies its invariant.
- `grep -c -F '| `<MAIN_REPO>` | derived at runtime | The main checkout — the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`. Spell it as a literal absolute path in the command, never through a substitution or a variable. |' plugin/commands/branch-start-user-review-fix-autonomous.md` finds the row exactly once.
- `grep -n -i 'worktree' <each of the four files>`: every remaining hit is *"worktree-relative"*, git's "main worktree", a linked worktree's record, a name, or the clause. Record any judgement call in the deviation notes.
- `git diff plugin/commands` changes no frontmatter key but `description:`.

**Deviations from plan:**

- Judgement calls under the wording rule: *"sibling-worktree path broadening"* (`branch-start-plan-autonomous.md` (a) entry point) became *"sibling run-copy path broadening"*; *"Worktree creation"* / *"Worktree handling"* / *"Worktree setup"* became *"Run-copy creation"* / *"Run-copy handling"* / *"Run-copy setup"*; *"does not create worktrees"* became *"does not create run copies"*; *"**per-worktree**"* became *"**per-run-copy**"*; *"the worktree's own copy stays sandboxed"* became *"the run copy's own scripts stay sandboxed"*, matching Task 8's wording in `autonomous_pause_and_ledger.md`; *"worktree agents otherwise write to the main repo"* became *"agents in a run copy otherwise write to the main repo"*, matching Task 8's `improvement_observations_instructions.md` shared-state line.
- In `branch-start-user-review-fix-autonomous.md` step 2, the parenthetical *"`<MAIN_REPO>` resolves as its `## Resolved values` row states"* was replaced by *"`<MAIN_REPO>` is "* plus the canonical clause, as the first Work bullet asks for all three entry commands.
- `branch-start-docs-autonomous.md` step 2 has no per-run `STOP` clause, so only its `<MAIN_REPO>` parenthetical changed; it now reads *"(the global switch in the **main** repo — `<MAIN_REPO>` is "* plus the canonical clause.
- Verification: the close grep, the row count (1) and the residual-`worktree` grep were run as written; every remaining hit is *"worktree-relative"*, git's "main worktree", *"a linked worktree's record"*, or the canonical row/clause. `git diff plugin/commands` changes no frontmatter key. `bash scripts/typecheck.sh` printed `PASS: typecheck`.
