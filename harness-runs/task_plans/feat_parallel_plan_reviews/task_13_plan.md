### Task 13 — Restate the autonomous task-plan fork's resume, PAUSE, overload and `P1` rules for the set

**Goal:** Give the autonomous task-plan fork the orchestrator-side rules of a parallel round that only an autonomous run has: the PAUSE check once before a set and honoured at the join, an overload that kills part of a set, the `P1` flip read off the round's result, and a resume that dispatches only what the round still lacks.

**Depends on:** Task 12, whose core sends a printed set — several dispatch blocks — in one message after running the safety contract's steps 1–3 once per block, records each return with `next --node <node>`, treats `action: wait` as "the set is still out", re-dispatches after a lost dispatch only what `current` re-prints (the set's gates with no recorded outcome), and enters review at `plan_round`. Task 3, whose `start --entry plan_round` dispatches only the gates without a round file when the round's evidence is consistent (every present file one verdict line, no plan file newer than the round's earliest file) and the whole set otherwise.

**Where this task stops.** The canonical pause mechanics are `plugin/instructions/autonomous_pause_and_ledger.md`'s (**Task 17**), cited and never restated. `## Override 6 — commit each plan-review round` is unchanged: its trigger is the walker's `round:` line, which a join prints once.

### Targets

- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`, `## Override 5 — pause/resume + flow-progress ledger (planning half)`, `## What this file does NOT redefine`.

**Work:**

- [ ] `## Override 2` → **Saved walk first.**: the first bullet's task-plan-loop node list gains `plan_round` (a pending set prints its gates' blocks, and a held binding or a cap names a gate or `plan_round`). Case (d): restate *"resumes at the round's next due reviewer when its round files are complete and consistent, at the round's first reviewer otherwise — best effort, at the cost of that round's earlier reviews"* as: dispatches only the round's gates without a round file when its evidence is consistent, and the round's whole set otherwise — best effort, at the cost of one round's reviews.
- [ ] `## Override 5` → the `P1` bullet: restate *"when the core's `## Loop` converges (`task-plan-reviewer` returns `verdict: PASS` at its step 5, i.e. the architecture gate — and … — also passed on the final revision)"* as: when the walker prints `ledger: P1`, at the join of a round in which no gate recorded `FAIL` — every gate that ran, a gate passed by exclusion or skipped counting as passed.
- [ ] `## Override 5` → **Honoring a PAUSE during planning.**: for a set, the PAUSE check runs **once**, after the first block's STOP check and before any block's counter increment; a PAUSE placed while a set is out waits for every dispatch of the set to return — the session's turn already does — and is honoured at the join: every return is recorded, the walker printed the round's result, Override 6 committed the round, and the next dispatch's check pauses, its partial commit exiting 3. `<n>` for a set is its shared `arg.iteration:`. On re-entry the saved walk continues at what the join printed: the writer's revision after a `FAIL` round, `ui_writer` after a `PASS` round.
- [ ] `## Override 5` → **Self-pause on API overload during planning.**: when some dispatches of a set die and others return, record every return that came back, then re-dispatch only the dead gates — `current` prints exactly those — as one set; the three-strike count is of consecutive failures of a re-dispatch; the self-pause's partial commit (Override 6's path set, `chore: Plan round <n> partial for <branch>`) takes the returned gates' round files, which stand, and the resumed session's `current` dispatches only the gates still pending. `## What this file does NOT redefine` → the `## Loop` bullet: *"(`task-plan-writer`, the business-parity gate, the architecture gate, `task-plan-reviewer`, the verdict parse)"* becomes the writer, the round's three gates dispatched as one set, and the verdict parse.

**Verification:**

- `grep -n "next due reviewer\|first reviewer\|returns \`verdict: PASS\` at its step 5" plugin/instructions/task_plan_writing_instructions_autonomous.md` finds nothing.
- `grep -n "plan_round" plugin/instructions/task_plan_writing_instructions_autonomous.md` shows the **Saved walk first.** node list.
- The anchors cited from outside this file — `## Clarification channel — file format (canonical, single source of truth)`, `## Override 2 — resumability` and `## Ask-vs-assume policy` — are byte-identical (`git diff` shows no heading line), as the file's own **Anchors resolved from outside this file.** paragraph requires.
