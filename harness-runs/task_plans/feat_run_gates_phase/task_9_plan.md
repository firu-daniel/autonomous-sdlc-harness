### Task 9 — Write `## Phase G — Run gates` into `plan_orchestration_instructions_core.md`

**Goal:** Write the phase body. `<test_cmd>` runs once through the wrapper, the orchestrator reads only the verdict line, a `fail` opens a fix loop shaped like the user-review one, and the loop is capped at five gate runs, ending in `<escalate>`. The core becomes A → A1.5 → A2 → B → C → C2 → E → G → D. The user-review fix flow cites this phase by reference (Task 13), so everything here is written mode-free and family-neutral, the way `## Phase E` is.

**Depends on:** Tasks 1, 3, 5, 7 and 8. Their contracts, restated so this task's implementer need not open those files:

- **Task 1 — the wrapper.**
  - Invocation: `bash <scripts_dir>/run-test-suite.sh <label>`.
  - Output: stdout is exactly `pass` (exit 0) or `fail <repo-relative log path>` (exit 1). A refusal is exit 2 with nothing on stdout.
  - Log: `<state_dir>/test_run_logs/<branch>/<label>.log`, one per label and never overwritten across labels. Beside it the wrapper leaves `<label>.verdict`, holding the same line it prints, and `<label>.running` while the command is in flight.
  - Wait form: `bash <scripts_dir>/run-test-suite.sh --wait <label>` never runs the command. It prints the verdict file's line (`pass` or `fail <log>`, exit 0 / 1) as soon as one exists; with a live run and no verdict it returns after at most one bounded wait slice with exactly `pending` (exit 3); with no run in flight it refuses (exit 2, nothing on stdout).
- **Task 3 — the directories:** `test_fix_plans`, `test_fix_plan_reviews`, `test_fix_point_reviews` and `test_run_logs`.
- **Task 5.**
  - `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`.
  - Substitution row `G.4`: readiness `<test_fix_plan_path>`, detail `<test_fix_findings_dir>finding_<K>.md`, per-item folder `<test_fix_findings_root>item_<N>/`, committer `review_item`, heartbeat label `Item <N>`. Its placeholders resolve from **this** file's `## Setup`, which this task adds.
- **Task 7 — the writer.**
  - Initial prompt: `Write the test fix plan. Branch: <branch>. Test log: <log_path>. Earlier logs: <paths or none>. Output: <test_fix_plan_path>.`
  - Revision prompt: `Revise the test fix plan at <test_fix_plan_path> per architecture findings: <findings_file>.`
  - Return: `fix_plan_file:`, `fix_plan_dir:`, `fixable:` and `not_fixable:`, with an optional `## Questions` above them.
- **Task 8 — the reviewer.** `architecture-reviewer` in plan-review mode, with keys `story_path`, `task_files_dir`, `prompt_path`, `findings_folder` and `iteration`. It returns `verdict: PASS`, or `verdict: FAIL` plus `findings_file:` and `must_fix_count:`.

### Targets

- `plugin/instructions/plan_orchestration_instructions_core.md`.

**Work:**

- [ ] **Header tables and Setup.**
  - `## Resolved values`: the `<test_cmd>` row now says that only `## Phase G`'s wrapper consumes it.
  - `## Mode contract`: add Phase G to the `Used at` cells of `<escalate>`, `<per_unit_review>` (via row `G.4`) and `<committer_push>` (the G.3 commit and row `G.4`).
  - `## Setup` step 2: add the rows `<gate_key>` = `task`, `<test_fix_plan_path>`, `<test_fix_findings_dir>`, `<test_fix_review_folder>` and `<test_fix_findings_root>`, with the exact values in the story index `## Context`'s wire table. `<gate_round>` is bound in G.0.
  - Step 3: drop *"`<test_cmd>` (with the path to test appended) and"* so it names only `<typecheck_cmd>` among the commands an implementer's unit runs.
  - Step 5's `MAX_TOTAL_DISPATCHES` sentence: add Phase G's writer, reviewer and fix-loop dispatches to the list it says the headroom absorbs.
- [ ] **`## Phase G — Run gates`**, inserted between `## Phase E — QA testing` and `## Phase D — Done`.
  - **Preamble.** It is the only place `<test_cmd>` runs. The orchestrator never learns what the gates are and never reads their output, only the wrapper's verdict line. It carries the same two-vocabulary note `## Phase E` carries, because another family's core runs it by reference.
  - **`### G.0 Resolve the round`.** `<gate_round>` = 1 + the number of this `<gate_key>`'s test fix plan indices whose readiness list has no `[ ]` entry.
    - A highest-numbered index that still has a `[ ]` entry and is tracked (`git ls-files`) is a committed plan in flight: resume at G.4 on it.
    - An untracked one is a draft that never converged: run G.1 for that round, and G.2 rewrites it.
  - **`### G.1 Run the gates`.**
    - First apply the safety contract's STOP check, and the PAUSE check where the fork adds one, but increment no counter: this is a Bash command, not a dispatch.
    - Print `[G · gates · round <gate_round>] → run-test-suite.sh`, run `bash <scripts_dir>/run-test-suite.sh <gate_key>_round_<gate_round>` as one plain command, and print `[G · gates · round <gate_round>] <the wrapper's line>`.
    - **If the tool layer moves the run to the background** — the expected case wherever the suite outlasts the Bash tool's foreground window, which in this repository it always does — collect the verdict with the wrapper's wait form, and with nothing else:
      - Issue `bash <scripts_dir>/run-test-suite.sh --wait <gate_key>_round_<gate_round>` as a fresh plain foreground command. On `pending`, apply the STOP check (and the fork's PAUSE check) again, still incrementing no counter, and re-issue the same call. Repeat until it prints `pass` or `fail <log>`; that line is the verdict. If the backgrounded run's own completion arrives first, its line is the same verdict.
      - The call count is not capped: each call is bounded by the wrapper's wait slice, `pending` means only "call again", and the suite may take any length of time, so nothing here depends on a wall-clock constant being large enough. The STOP check on every re-issue is how a human ends a hung suite.
      - **Forbidden here, by name:** a `Monitor`, a `sleep` of any length in the orchestrator's own command, and ending the turn with the run in flight. State why in the text, citing `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` → §2.5: a headless `claude -p` session is torn down when its turn ends, a pending monitor dies with it, and the `rc=0` exit with no `PAUSE_ACK` is classified `completed` — the run would stop at Phase G behind a success notification. Repeated foreground `--wait` calls keep the turn open, so the session, and the backgrounded wrapper it launched, stay alive until the verdict is read.
      - `--wait` refusing (`no run in flight`) is the missing-verdict-line case below.
    - `pass` → leave the phase.
    - `fail <log>` at `<gate_round>` ≥ `MAX_GATE_ROUNDS` → `<escalate>`, naming every round's log path and the latest test fix plan index.
    - `fail <log>` otherwise → G.2.
    - No verdict line → `<escalate>` with the wrapper's stderr line.
  - **The test-run rule gets no subsection here.** The preamble points at `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` and restates none of it.
- [ ] **`### G.2 Write and review the test fix plan`, `### G.3 Commit the test fix plan`.**
  - **G.2.** Dispatch `test-fix-plan-writer`, under the safety contract, with the heartbeat `[G · test-fix-plan · iter <i>] → test-fix-plan-writer`. Its prompt carries the log and the earlier rounds' logs that exist: the same path with `round_<j>` for each j < `<gate_round>`.
    - `## Questions` → `<escalate>` with the questions verbatim.
    - `fixable: 0` → G.3, then `<escalate>`, naming the index's `## Not fixable on this branch`.
    - Otherwise run the architecture gate: `architecture-reviewer` with Task 8's block, heartbeat `[G · test-fix-plan · arch · iter <i>] → architecture-reviewer`, `iteration` starting at 0. A FAIL re-dispatches the writer with the revision prompt and re-runs the gate. `iteration >= 5` → `<escalate>`, naming the findings path and the index's `## Rejected findings`.
    - The reviewer creates its folder itself; do not `mkdir -p` it.
  - **G.3.** Dispatch `committer` with `plan_path: <test_fix_plan_path>`, `mode: review_plan_file`, `commit_prefix: chore`, `meta_findings_folder: <test_fix_review_folder>` (only when that folder exists and is non-empty, under B.3's existence guard) and `<committer_push>`. The fixed subject `chore: add code review for <branch>` is reused as-is, as in E.2.
- [ ] **`### G.4 Fix loop` and `### G.5 Re-run, and the round cap`.**
  - **G.4.** Run the unit loop of `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The unit loop`, substitution row `G.4`, until the index's readiness list is all `[x]`.
  - **G.5.** `MAX_GATE_ROUNDS = 5`. Increment `<gate_round>` and return to G.1. The cap counts gate runs, the same five-iteration bound the plan-writing and end-of-branch review loops carry. After an answered park, G.0's derivation yields a round ≥ 5, so the resumed phase runs the gates exactly once more, and a further `fail` escalates again without another fix loop. State that property explicitly.
  - The phase's `## Phase boundaries` dispatch-additions write happens at its end, before any fork's completion marker.
- [ ] **Transitions, stop conditions, Done.**
  - Every sentence that sends the flow from Phase E to Done now sends it to **Phase G**: E's skip paths, the E.1 all-`[x]` short-circuit, E.2's round PASS and E's header sentence. Find them with `grep -n "Done" plugin/instructions/plan_orchestration_instructions_core.md` inside `## Phase E`.
  - `## Phase D`'s *"run after Phase E (QA)"* becomes *after Phase G (Run gates)*.
  - The opening paragraph's phase narrative names the Run gates phase.
  - `## Stop conditions`: add the round cap, the writer's `## Questions`, `fixable: 0`, the G.2 gate cap and the wrapper's missing verdict line, each `<escalate>`.
  - `### D.2 Done summary`: add a bullet, **Run gates (Phase G): passed on round N, with X test fixes landed across the rounds**, obeying the section's reachability rule, which on a resumed session states what is unreachable. Keep *"do not run a final test command unless asked"* — it now reads as the Run gates phase's exclusivity.

**Verification:**

- `grep -n "^## Phase [A-Z]" plugin/instructions/plan_orchestration_instructions_core.md` lists `## Phase G — Run gates` after `## Phase E` and before `## Phase D`. That is the run order `layer-implementer` and `review-plan-reviewer` derive from this command.
- `grep -n "test_cmd" plugin/instructions/plan_orchestration_instructions_core.md` hits only the `## Resolved values` row and `## Phase G`.
- `grep -n "\-\-wait\|Monitor\|§2.5" plugin/instructions/plan_orchestration_instructions_core.md` shows the wait form, the named prohibitions and the §2.5 citation inside `### G.1 Run the gates`.
- Walk Phase G once as the orchestrator for each outcome — all green on round 1; a round-1 run moved to the background, answered `pending` twice by `--wait` and then `pass`; a `fail` on round 1 then `pass` on round 2; a `fail` on every round; `fixable: 0`; a resume with a tracked `[ ]` index. At each step, name the one next action the text prescribes. Record in the detail file any step where the text leaves a choice.
- Every heading this task cites resolves: `## The test-run rule` and the `G.4` row in `unit_loop_core.md`, and `### G.2 Write and review the test fix plan` as Task 8's reviewer text names it.
