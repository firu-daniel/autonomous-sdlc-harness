### Task 16 — Restate the autonomous fix-plan fork's convergence, resume, PAUSE and overload rules for the set

**Goal:** Give the autonomous fix-plan fork the same pause and resume changes the task-plan fork gets: the PAUSE check once before the gates' set and honoured at the join, a partial set under overload, a resume that restarts the round with both gates together, and convergence wording that orders no gate.

**Depends on:** Task 15, whose core dispatches steps 7 and 8 — the **due gates** — together in one message once step 6 has cleared, records each return in any order, holds a gate's `error:` / `blocker:` as a **held binding** until the **join** (the round close at the end of step 8), and there `<escalate>`s it once or closes the round.

**Where this task stops.** The canonical pause mechanics are `plugin/instructions/autonomous_pause_and_ledger.md`'s (**Task 17**). The `R1` condition this task writes is quoted byte-for-byte by that module's `### 1.5`, so the two must carry the same literal: `when **both gates PASS** (business-parity step 7 and architecture step 8, one round)`. Overrides 3, 5 and 6's commands and path sets are unchanged.

### Targets

- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → ``### `<terminal_handoff>` — no approval gate``, `## Override 2 — resumability` (d), `## Override 3` **Trigger / ordering.**, `## Override 4` (the `R1` bullet), `## Safety scaffolding (delta — the core states none)`.

**Work:**

- [ ] ``### `<terminal_handoff>` ``: *"When **both** gates PASS (business-parity, step 7, then architecture, step 8)"* becomes *"When **both** gates PASS (business-parity, step 7, and architecture, step 8, one round)"*. `## Override 4`'s `R1` bullet: *"`R1` — when **both gates PASS** (business-parity step 7, then architecture step 8)"* becomes *"`R1` — when **both gates PASS** (business-parity step 7 and architecture step 8, one round)"* — the exact literal **Task 17** quotes. `## Override 3` **Trigger / ordering.**: *"step 7 (business-parity) then step 8 (architecture) of the core"* becomes steps 7 and 8 of the core, at the join.
- [ ] `## Override 2` (d): *"The resumed round always restarts at its first gate, and each gate replaces its own `review_<k>.md` for that round"* becomes: the resumed round always restarts with its whole set — both due gates dispatched together — and each gate replaces its own `review_<k>.md`; *"This fork never takes the next-due-gate path"* becomes never dispatches only the missing gate, for the reason already stated; *"the restart costs one parity review at most"* becomes one gate's review at most, and no wall time beyond the round's slowest gate.
- [ ] `## Safety scaffolding`: *"Before **every** agent dispatch (writer or either gate reviewer)"* gains — for the gates' set, steps 1, the counter increment and the heartbeat run once per gate before the set goes out, and step 2's PAUSE check runs once, before the first; a halt at either gate sends neither. Step 2 (PAUSE): a PAUSE placed while the set is out is honoured at the join, after both returns are recorded and Override 6 committed the round, `<k>` the set's `fix_round`. Step 3 (overload): when one gate's dispatch dies and the other returns, the returned verdict is recorded and its round file stands, only the dead gate is re-dispatched, and a self-pause's partial commit takes the returned gate's file. The `MAX_TOTAL_DISPATCHES = 24` sizing sentence stays as written: three dispatches per round still hold.

**Verification:**

- `grep -n "then architecture\|restarts at its first gate\|next-due-gate\|(business-parity) then" plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` finds nothing.
- `grep -nF 'when **both gates PASS** (business-parity step 7 and architecture step 8, one round)' plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` finds the `R1` bullet.
- No `##` heading changed (`git diff` shows none): `## Override 2 — resumability` and the clarification anchors are cited from outside this file.
