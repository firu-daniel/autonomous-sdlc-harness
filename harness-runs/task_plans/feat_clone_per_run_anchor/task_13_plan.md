### Task 13 — Say "run copy" in the remaining cores, the QA and mode-contract files and the two flow documents, and give `AUTONOMOUS_FLOW.md` the row

**Goal:** Finish the plugin corpus's move to **run copy** in the files no earlier plugin task owns. These are the two flow documents under `plugin/docs/`, the orchestration core, the interactive-test instructions and the mode contract. `plugin/docs/AUTONOMOUS_FLOW.md` is the last of the eight files that declare `<MAIN_REPO>` in `## Resolved values`, so it gets the canonical row. After this task the corpus-wide closure holds.

**Depends on:**

- **Task 1**, which allow-lists `Bash(printenv HARNESS_MAIN_REPO)`.
- **Task 3**, which exports the variable to every session the watcher launches.
- **Tasks 8–12**, which own every other plugin file that resolves `<MAIN_REPO>`. This task runs the corpus-wide closure grep over their work too, and reports rather than fixes a hit in a file it does not own.

**The canonical row, byte for byte as Tasks 8, 9 and 11 carry it:**

```
| `<MAIN_REPO>` | derived at runtime | The main checkout — the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`. Spell it as a literal absolute path in the command, never through a substitution or a variable. |
```

**The wording rule.** Prose that means the run's own copy says **run copy**: *"a run's own working copy"*, *"the run's own working copy"*, *"its own working copy"*, *"the same working copy"* a resumed run returns to, *"a clean working copy of the run's own branch"*, *"parallel working copies"*, *"the run's own per-branch worktree"*, *"worktree headless runs"*, and *"the sibling-worktree pattern"* in a `<worktree_glob>` description. Keep:

- every name — the token `<worktree_glob>`, `create-worktree.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh`, `restart-watcher.sh`, `worktree add -b`;
- every heading. `plugin/docs/README.md` warns that the `branch-*` commands quote `AUTONOMOUS_FLOW.md`'s section names, so a renamed heading breaks a shipped command;
- the table row label *"Working-copy lifecycle"* in `## The wiring table`, which names the class of scripts that manage copies of any kind;
- "working copy" where it means any checkout;
- every quoted command.

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md` — the `<MAIN_REPO>` row, and the run's-own-working-copy prose.
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` — its working-copy prose. Its `<MAIN_REPO>` mentions name the kill-switch path and a token list, and resolve nothing.
- `plugin/instructions/plan_orchestration_instructions_core.md` — the `<worktree_glob>` row's description, and the dev-server **Do NOT** paragraph's *"worktree headless runs"* / *"the worktree path"*.
- `plugin/instructions/qa_test_instructions.md` — the same two places.
- `plugin/instructions/mode_contract.md` — the `<repo_root>` binding row's *"the run's own per-branch worktree"* and *"the run's own worktree"*.

**Not targets, deliberately** (story index scope register rows 43 and 46–50): the semi-autonomous forks' and the supervised fix-plan fork's *"a worktree run resolves the same way to that worktree's own"*, which is a person's linked worktree; `user_review_fixes_instructions_core.md`'s and `plan_orchestration_instructions_core.md`'s `create-worktree.sh` / `worktree add -b` paragraph; and `unit_loop_core.md`'s mode-free *"the working copy's index"*.

**Work:**

- [ ] **`AUTONOMOUS_FLOW.md`'s row.** Replace the `<MAIN_REPO>` row with the canonical row. Move its trailing sentence *"This document uses it for the global kill switch in `## Safety / reversibility` and for the git wrappers' spelling in `## The wiring table`."* to its own line directly below the `## Resolved values` table, unchanged.
- [ ] **`AUTONOMOUS_FLOW.md`'s prose.** Apply the rule throughout:
  - *"in the run's own working copy"*, which recurs across the closing-phase artifacts;
  - *"in its own working copy"*, *"the same working copy"*, *"go with the working copy"*;
  - **A run's isolation is its own working copy.**, which becomes **A run's isolation is its own run copy.** It is a bold lead-in, not a heading;
  - the **Containment.** paragraph's *"in its **own working copy**"*;
  - *"inside one working copy"*;
  - *"parallel working copies"*, *"working copies on one filesystem"*.

  `## The wiring table`'s *"Working-copy lifecycle"* label and *"refreshes the branch of a working copy that already exists"* (any checkout) stay.
- [ ] **`AUTONOMOUS_FLOW_WHITEBOARD.md`.** Apply the rule: *"gets its own working copy"*, *"executing in a sibling working copy"*, *"a clean working copy of the run's own branch"*, *"Two runs sharing a git working copy"*, *"per-working-copy"*, *"in one working copy"*, *"an isolated working copy"*, *"the same working copy"*, *"parallel working copies"*. *"the **working copy** as the substrate underneath"* and *"It handles files, working copies, processes and a registry"* describe the layer's substrate in general and keep their words. The file stays a narrative that owns no contract.
- [ ] **The core, the QA instructions and the mode contract.**
  - `plan_orchestration_instructions_core.md` and `qa_test_instructions.md`: *"the sibling-worktree pattern"* becomes *"the sibling run-copy pattern"*, *"worktree headless runs"* becomes *"run-copy headless runs"*, and *"does not match the worktree path"* becomes *"does not match the run copy's path"*.
  - `mode_contract.md`: *"the run's own per-branch worktree"* becomes *"the run copy"*, and *"the run's own worktree"* becomes *"the run copy"*. `## Which files use this` and `### Sanctioned cross-fork anchors` stay byte for byte.
- [ ] **The corpus-wide closure.** Run `grep -rn 'worktree list' plugin`. Every line printed carries `printenv HARNESS_MAIN_REPO`, or is one of the two stated exceptions: `plugin/commands/branch-prompt.md`'s step 4 check (b), and `plugin/instructions/improvement_observations_instructions.md`'s machine-path enumeration. Then run `grep -rlF '| `<MAIN_REPO>` |' plugin`, and compare each listed file's row with the canonical row byte for byte. A deviation in a file another task owns is reported in the deviation notes, naming the file and the owning task, not edited here.

**Verification:**

- The two greps in the last Work bullet satisfy their invariants, and the deviation notes record their output.
- `grep -rn 'watcher-supplied' plugin` prints nothing.
- `grep -n -i "worktree\|working cop" plugin/docs/AUTONOMOUS_FLOW.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md plugin/instructions/plan_orchestration_instructions_core.md plugin/instructions/qa_test_instructions.md plugin/instructions/mode_contract.md`: every remaining hit is a name, the row, a kept label, "working copy" meaning any checkout, or a quoted command. Record any judgement call in the deviation notes.
- `grep -n '^#' plugin/docs/AUTONOMOUS_FLOW.md` gives identical output before and after the edit.
