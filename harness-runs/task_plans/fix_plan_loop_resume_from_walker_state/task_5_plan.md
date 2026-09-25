### Task 5 — Autonomous planning fork: the ledger wins over a saved walk, (b) needs `P1` `[x]`, (d) reviews a draft, and §1.7 step 4 names the saved walk as the planning position

**Goal:** Rewrite the autonomous fork's re-entry decision in `plugin/instructions/task_plan_writing_instructions_autonomous.md`, and write the canonical-doc sentence it cites, in the same commit:

- a saved walk is continued first, unless the flow-progress ledger contradicts it;
- case (b) skips the task-plan loop only when `P1` is `[x]`, and the UI-test-plan loop only when `P2` is `[x]` or `[-]`;
- a new case (d) sends a draft whose ledger entry is `[ ]` back through review, never rewriting or skipping it;
- a `ledger:` line printed again re-applies its flip harmlessly, through wrapper exit 3;
- `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.7` step 4 names the planning walker's saved walk as the within-phase position of `P1`/`P2`, which have no detail index.

**Why both files are one task.** The fork's rewritten **Resume-from-ledger (planning).** paragraph cites canonical-doc §1.7 step 4, and the new step 4 text cites the fork's `## Override 2 — resumability`. Today step 4 says the opposite (the phase's **detail index** drives within-phase resume). Whichever half landed first in a separate commit would leave the other citing a rule the cited document contradicts, so both halves land in this one commit (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`).

**Depends on:** Task 4. Its core states the mechanics this fork's value selects between, and this task cites them by heading rather than restating them:

- `## The walker — routing is its, judgement is yours` → **Continuing a saved walk.** issues `current` and reads its output:
  - "`action: dispatch` — a dispatch was pending when the last session ended": continue by dispatching the printed action, `skip:` and `ledger:` lines included;
  - "`binding: <ask>` — a writer's `## Questions` parked the walk": continue with `answered`, only when the answers reach the session;
  - "any other `binding:` — the walk finished": not continued;
  - "exit 1 — no walk of this flow is saved for this branch": fall back.

  It also treats a walk whose pending action's artifact is absent as unusable, and it lets the fork add further conditions, stating that the fork's durable record wins over the saved walk.
- `## Setup (once per session)` step 5's outcomes are **proceed fresh**, **extend**, **review**, **continue** and **skip**. Step 7 maps them: **continue** issues no `start`; "**review** gives the first gate of the loop whose draft no reviewer has passed", which is `business_parity_review` for the task-plan draft and `ui_review` for the UI-test-plan draft when the task-plan loop is skipped; **skip** gives `ui_writer`, or `convergence`.

**Where this file stops.** The walker mechanics, the artifact-existence check and the step 7 mapping are the core's (Task 4). This fork restates none of them (`## What this file does NOT redefine`). This task owns only the ledger-dependent decision, which a mode-free core cannot state because it names `P1`–`P3`. The `## Override 2 — resumability` heading and its `(a)` label are resolved **by name** from outside this file (`plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors` class (i); `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.7` step 5 cites `Override 2(a)`), so the heading text and the meaning of case (a) stay byte-stable. Case (c) is unchanged. `autonomous_pause_and_ledger.md` is shared by every autonomous flow: this task edits **only** its §1.7 step 4, and only for the planning entries. Step 5's `Override 2(a)` citation, §1.6 and §2.0–§2.5 (the pause protocol, out of scope per the task prompt's `## Out of scope`) are not touched. The semi-autonomous binding row and `plugin/docs/AUTONOMOUS_FLOW.md` are **Task 6**'s.

**Phrases this task must write verbatim, each on one line.** `cli/test/flow-walker-resume.test.mjs` (Task 2) cites them as quoted substrings:

- in `## Override 2 — resumability`: "Skip the task-plan write loop only when `P1` is `[x]`"
- in `## Override 2 — resumability`: "send the draft back through review — never rewrite it, never skip it"
- in `## Override 5 — pause/resume + flow-progress ledger (planning half)`: "A `ledger:` line the walker prints again is re-applied"

**Phrases this task must keep verbatim, each on one line.** The existing suite `cli/test/flow-walker-ui-and-reentry.test.mjs` quotes them from **Resume-from-ledger (planning).**, and Task 3 leaves those comments untouched because this task keeps the text they quote:

- case `(7) re-entry past a converged task-plan loop dispatches the UI-test writer first`, in its comment: "on re-entry, if `P1` is `[x]` skip the task-plan loop"
- case `(8) re-entry with planning resolved prints the hand-off immediately`, in its comment: "if all three `## Planning` entries are **resolved** … fall straight through to implementation (`<terminal_handoff>`)". The source text is "if all three `## Planning` entries are **resolved — `[x]` or `[-]`** — planning is done — fall straight through to implementation (`<terminal_handoff>`)", and the suite's `…` elides the middle. Keep that whole clause byte-identical, so both ends of the quotation still resolve.

Both phrases stay true under the rewritten rules: `P1` `[x]` still skips the task-plan loop, and all three entries resolved still falls through to `--entry convergence`.

### Targets

- `plugin/instructions/task_plan_writing_instructions_autonomous.md` — the opening paragraph (*"whose three cases stay stated"*), the `<existing_artifact_decision>` row of `## Mode contract — bindings`, `## Override 2 — resumability`, `## Override 5 — pause/resume + flow-progress ledger (planning half)`.
- `plugin/instructions/autonomous_pause_and_ledger.md` — `### 1.7 Resume-from-ledger (every fork, on every (re-)entry)`, step 4 only.

**Work:**

- [ ] **`## Override 2 — resumability`, the lead paragraph, plus the file's opening paragraph and the binding row.**
  - Lead paragraph: change *"it decides purely from the presence of clarification answers and the state of the story index"* to name the four inputs: the saved walk, the flow-progress ledger's `## Planning` entries, pending clarification answers, and which drafts exist on disk.
  - Lead paragraph: change the mapping sentence to: **(a)** is **extend**, **(b)** is **skip**, or **review** for the UI-test-plan draft; **(c)** is **proceed fresh**; **(d)** is **review**; and the saved walk below is **continue**. Add *"Take the first that applies: the saved walk, then (a), (b), (d), (c)."*
  - Opening paragraph: change *"whose three cases stay stated in **`## Override 2 — resumability`**"* to *"whose cases stay stated in …"*. The by-name resolution sentence after it is unchanged.
  - `<existing_artifact_decision>` row: restate the value as a usable saved walk continued ahead of four non-interactive cases — (a) pending top-level answered pairs resume the writer, with every such question file and its answer appended; (b) `P1` `[x]` skips the task-plan loop; (c) no story index runs fresh; (d) an unreviewed draft is reviewed. Change *"It never asks: it decides purely from the presence of clarification answers and the state of the story index."* to name the same four inputs as the lead paragraph.
- [ ] **`## Override 2 — resumability`, a new **Saved walk first.** paragraph, placed before case (a).**
  - Apply the core's `## The walker` → **Continuing a saved walk.** A walk it would continue is **continue**, unless this fork's ledger contradicts it. The ledger is the only durable record, and it wins. The walk is **not** used when:
    - `P1` is `[x]` and the pending `node:` is in the task-plan loop: `plan_writer`, `business_parity_review`, `architecture_review` or `plan_review`;
    - `P2` is `[x]` or `[-]` and the pending `node:` is `ui_writer` or `ui_review`;
    - `P1` is `[ ]` and the pending `node:` is `ui_writer` or `ui_review`, **unless** the printed action carries `ledger: P1`. That line means the last session ended between the walker's print and the flip. Re-apply it as Override 5 states, then continue.
  - A walk that is not used falls through to (a)–(d) exactly as if none were saved. It is never deleted or edited, because it is the walker's (`## What you must NOT do` in the core).
  - A walk parked at `<ask>` is continued only with case (a)'s answered pairs. They are consumed exactly as (a) states, with every pair appended to the dispatch the walker prints after `answered`, **whether or not a story index exists**, since a writer may park before writing one.
- [ ] **Cases (b) and (d).**
  - Rewrite **(b)** to begin "**(b) `P1` is `[x]` and no clarification is pending.**" and to state "Skip the task-plan write loop only when `P1` is `[x]`: a story index that exists and looks complete is never enough, because a first draft already carries a complete readiness list."
  - The UI-test-plan loop inside (b) follows the same rule: skip it only when `P2` is `[x]` or `[-]`, which gives **skip** → `convergence`. When `P2` is `[ ]` and the UI-test index exists, the outcome is **review**, sending the UI draft through review. When `P2` is `[ ]` and no UI-test index exists, the outcome is **skip** → `ui_writer`.
  - Replace *"(or, if that is also complete or not enabled, fall through to implementation per `<terminal_handoff>`)"*, which let an unreviewed UI-test plan count as complete, with those three explicit branches.
  - Add **(d)**: "**(d) `P1` is `[ ]`, the story index exists, no clarification is pending, and no saved walk is used.**" Its action: "send the draft back through review — never rewrite it, never skip it". The outcome is **review** of the task-plan draft.
  - State the cost once: re-running every gate costs at most one extra round, which matches the loop's existing rule that every gate runs again.
- [ ] **`## Override 5`, and the §1.7 step 4 sentence it cites.**
  - Under **Flip the `## Planning` entries**, add a sentence starting "A `ledger:` line the walker prints again is re-applied". It states that `current` re-prints every line of a pending action, `ledger:` included. A session that ended between the walker's print and the flip therefore re-applies the flip on resume. Re-flipping an already-`[x]` entry stages no diff, the wrapper returns exit 3, nothing is committed, and the push that follows is a no-op. Cite canonical-doc §1.6 → **Idempotency** for this rather than restating it.
  - Rewrite **Resume-from-ledger (planning).**:
    - Replace only the lead-in *"Override 2's resumability is unchanged and composes:"* with one saying Override 2 now reads the `## Planning` entries directly, rather than merely composing with them. The clause chain that follows it — from "on re-entry, if `P1` is `[x]` skip the task-plan loop" through "fall straight through to implementation (`<terminal_handoff>`)." — stays byte-identical (see **Phrases this task must keep verbatim** above). Replace the sentence calling the entries *"the durable, **computed** form of Override 2(b)'s … heuristic"* with one saying (b) no longer infers convergence from a readiness list.
    - Within `P1` or `P2`, the saved walk is the position the resume continues from, as canonical-doc §1.7 step 4 states.
    - Add, after the kept clause chain: with `P1`/`P2` resolved and `P3` `[ ]`, the result is also `--entry convergence`. A finished `<terminal_handoff>` walk is never acted on again. Overrides 3 and 4 run again idempotently, through exit 3, and `P3` is flipped.
    - Keep the `[-]`-is-resolved sentences verbatim.
  - Under **Honoring a PAUSE during planning**, change *"re-entry uses resume-from-ledger + Override 2"* to say that re-entry uses resume-from-ledger plus Override 2, whose saved walk continues at the dispatch the pause interrupted.
  - **§1.7 step 4** of `plugin/instructions/autonomous_pause_and_ledger.md`. After *"Within the resume-point phase, the phase's **detail index** drives within-phase resume, … (find the first `[ ]` item)."*, add these points:
    - The planning entries `P1` and `P2` have no detail index.
    - Their within-phase position is the planning walker's saved walk, as `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` applies it.
    - That walk is machine-local and never a second record. Where it and this ledger disagree, this ledger wins.
    - A planning loop whose entry is `[ ]`, with its draft on disk and no usable walk, is reviewed again rather than skipped.

    Leave step 5's `Override 2(a)` citation and every other step byte-identical.

**Verification:**

- The three phrases above are each on one line, checked by their backtick-free tails, one `grep -F` each against `plugin/instructions/task_plan_writing_instructions_autonomous.md`:
  - `grep -F -- 'Skip the task-plan write loop only when'`
  - `grep -F -- 'send the draft back through review — never rewrite it, never skip it'`
  - `grep -F -- 'line the walker prints again is re-applied'`

  Each prints a hit.
- The two kept phrases are intact, checked by their backtick-free tails, one `grep -F` each against the same file:
  - `grep -F -- 'skip the task-plan loop; if'`
  - `grep -F -- 'entries are **resolved'`
  - `grep -F -- 'fall straight through to implementation ('`

  Each prints a hit on the **Resume-from-ledger (planning).** line.
- Every quotation the existing suite takes from this fork still resolves. Run `grep -nE 'Override (2|5)' cli/test/flow-walker-ui-and-reentry.test.mjs`, and for each hit read the quoted substring in that comment (and its continuation line) and confirm it is found, under the section the comment names, in the rewritten `plugin/instructions/task_plan_writing_instructions_autonomous.md`. An `…` in a quotation means both ends must be found, in order, within one sentence. Every hit must resolve; the comments Task 3 rewrote cite `start` behaviour and are held to the same test.
- `grep -n 'complete Phase 2 Readiness list' plugin/instructions/task_plan_writing_instructions_autonomous.md` prints nothing: (b) no longer keys on the readiness list.
- The by-name anchors are intact. `grep -n '^## Override 2 — resumability$' plugin/instructions/task_plan_writing_instructions_autonomous.md` prints one line, and case (a)'s text is unchanged, so `git diff` shows no line inside case (a) altered.
- Re-derive the `Override 2` citers with `git grep -in "override 2" -- plugin docs`, then read each hit. Each must still resolve to a heading or a case label this file carries, and none may state the old (b) rule. The citers are `plugin/instructions/mode_contract.md`, `plugin/instructions/autonomous_pause_and_ledger.md` (§1.7 step 5), `plugin/instructions/plan_orchestration_instructions_autonomous.md`, `plugin/commands/branch-start-plan-autonomous.md`, and the fix-plan flow's own files, which are out of scope and listed in the story index's `## Scope register` as `no-change`.
- `grep -n 'saved walk' plugin/instructions/autonomous_pause_and_ledger.md` prints only lines inside `### 1.7`. `git diff plugin/instructions/autonomous_pause_and_ledger.md` touches no line under a `## 2.` / `### 2.` heading and no line of §1.6, and leaves step 5's `Override 2(a)` line unchanged.
- The citation pair resolves in this commit: read the fork's **Resume-from-ledger (planning).** paragraph against §1.7 step 4 and confirm they agree — the saved walk is the within-phase position of `P1`/`P2`, and the ledger wins — and that step 4's `## Override 2 — resumability` pointer lands on the heading this task keeps.
- Walk the chain from this file plus the core, with no other file:
  - A pause while `task-plan-reviewer` is in flight, with `P1` `[ ]`, gives a saved walk that is used, and `task-plan-reviewer` is re-dispatched.
  - The same pause with the state file lost, and the story index on disk, gives case (d), **review**, then `start --entry business_parity_review`.
  - `P1` `[x]` with a saved walk pending at `plan_review` means the walk is not used, and case (b) applies.
  - `P1` `[x]`, `P2` `[ ]` with the UI-test index on disk and no usable walk gives **review**, then `start --entry ui_review`.
