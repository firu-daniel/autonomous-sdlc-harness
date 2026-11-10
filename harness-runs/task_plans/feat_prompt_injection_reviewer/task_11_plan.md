### Task 11 — Add `P0` / `R0` to the ledger contract, and the screen to the run-mode safety floor

**Goal:** Make the screen a tickable ledger step on the safety floor (goal 3). This covers:
- `P0.` at the top of the task engine's `## Planning` and `R0.` at the top of the user-review engine's `## Fix planning`;
- their SHA-256 record;
- who writes them and when;
- that no run mode can skip them and that neither ever takes `[-]`;
- the screen's re-screened-edit commit, listed among the clean-tree commit points it joins.

**Depends on:** Task 10, `plugin/instructions/prompt_injection_screen.md`. Its step 5 hands the ledger's owning fork every `SAFE` `(path, sha)` pair and points at this file's `### 1.4 Creation` for how they are recorded. Its step 4 commits a re-screened edit — a screened file the screen just passed that `git status --short` shows as a modified tracked file — by exact path, with subject `chore: Commit re-screened input edit for <branch>`, followed by `push-branch.sh`, and halts on a refusal or failure; it points at the clean-tree commit-point list this task extends. Its roster already lists this file, `run_mode_instructions.md` and `plan_orchestration_instructions_autonomous.md` as citers.

**Depends on:** Task 5, whose `hr_ledger_phases` already counts `P0` / `R0` only when the line is present. This file's mirror note names that rule.

**Where this task stops.** The flip-point bullets in the two ledger forks are Tasks 12 and 13's. This file states the shape, the creation and re-seed rule and who flips, and the forks apply them.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md` — `### 1.3 Templates`, `### 1.4 Creation`, `### 1.5 Who flips`.
- `plugin/instructions/run_mode_instructions.md` — `## The safety floor — what a run mode may never skip`.
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` — `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`: the list's lead-in sentence, a new entry 15 and the **Post-commit push** paragraph.

**Work:**

- [x] **§1.3 templates.**
  - In the task-engine template, add `- [ ] P0. Untrusted input screened (prompt-injection-reviewer SAFE)` as the first line under `## Planning`.
  - In the user-review template, add `- [ ] R0. Untrusted input screened (prompt-injection-reviewer SAFE)` as the first line under `## Fix planning`.
  - Directly after the templates, add a paragraph on the record:
    - one indented line per screened file, `  - screened: <repo-relative path> sha256=<64 lowercase hex>`, under its entry;
    - these lines are not entries, carry no checkbox, and are invisible to §1.7's first-`[ ]` scan;
    - `prompt-injection-screen.sh plan` reads them back by that exact form, so the form is a wire.
  - Extend the **"A shell reader keys on these templates too"** paragraph: `hr_ledger_phases` counts `P0` / `R0` only where the ledger carries the line, so a ledger created before them keeps its meaning.
  - **The `[-]` list.** In the paragraph that begins "`[-]` is admissible on **exactly** the entries …", add `P0` and `R0` to the entries that name a step inside the safety floor. Neither switch reaches them, and they are never `[-]`.
- [x] **§1.4 creation.**
  - **Task engine.** The screen (`${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md`) precedes the creation write. So the planner fork's creation write lays `P0` down `[x]` with one record line per `SAFE` pair the screen handed it. That is still one write and one commit.
  - **User-review engine.** The create and re-seed writes lay `R0` down `[x]` with this session's pairs **plus every `screened:` line of the ledger being replaced**, carried forward whether it sat under `P0` or an earlier `R0`. A round therefore never re-screens a file an earlier run passed.
  - **A later launch** whose screen passed files not yet recorded appends their lines under the entry as a flip. On a ledger with no `P0` / `R0` line — one created before this entry existed — that flip first inserts the entry `[x]` as the first line of its section.
  - **A launch whose screen parks** writes nothing to the ledger.
- [x] **§1.5 who flips.**
  - The planner fork writes `P0`, and the fix-plan fork writes `R0`.
  - The commit subject is the existing fixed form `chore: Flow progress <entry-id> for <branch>`.
  - `P0` / `R0` never go back to `[ ]`. A later file that parks stops the run at the screen, which gates every launch, and the marker is not what gates it.
- [x] **`run_mode_instructions.md` and the clean-tree commit points.**
  - In `run_mode_instructions.md`, add one bullet to `## The safety floor — what a run mode may never skip`: the prompt-injection screen and its ledger entries `P0` / `R0` (`${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md`). Change no other wording.
  - In `plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`, append entry **15**, after entry 14 and before the **"Editing any one of these in isolation"** sentence: **"The prompt-injection screen commits a re-screened input edit (all three autonomous engines)"** — `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## The steps` step 4. In two or three sentences, pointing and not restating:
    - it fires at launch, before anything else commits, only when a screened file the screen just passed is a modified tracked file — the person's edit made through the park's edit-and-resume route — so the engine goes on from a clean tree;
    - it stages only those exact paths through the main checkout's `commit-on-branch.sh`, followed by its own `push-branch.sh`; an untracked file is never staged;
    - unlike entries 1, 5, 8 and 10 it **is** a gate: a refusal or failure halts the engine rather than leave a modified tracked file.
  - Extend the list's lead-in sentence that explains the order ("entries 13 and 14 are appended last …") with one clause naming entry 15 as appended last too, although it fires first, at launch. Renumber nothing: entries are cited by number.
  - Extend the **Post-commit push** paragraph's enumeration of direct-`git` push points with the screen's own push, in one clause.

**Verification:**

- `grep -nE '^- \[ \] (P0|R0)\. Untrusted input screened \(prompt-injection-reviewer SAFE\)$' plugin/instructions/autonomous_pause_and_ledger.md` prints two lines, each the first entry of its section.
- Every `- [ ] <ID>.` row between `**Task engine**` and `**User-review engine**` still matches `^- \[ \] [A-Za-z0-9.]+\.[[:space:]]`. That is the form `scripts/check-flow-graph.sh` → `ledger-id-known` reads ids by, read here rather than run.
- `grep -c 'prompt_injection_screen.md' plugin/instructions/run_mode_instructions.md` prints `1`.
- No `phases.*` or run-mode id maps to `P0` / `R0` anywhere in §1.3's switch-to-entry list.
- `grep -n '^15\. ' plugin/instructions/plan_orchestration_instructions_autonomous.md` prints the new entry, and that line cites `prompt_injection_screen.md`; entries 1–14 are unchanged (`git diff` shows no removed line among them).
