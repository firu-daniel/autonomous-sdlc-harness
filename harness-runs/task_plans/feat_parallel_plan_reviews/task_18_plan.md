### Task 18 — Redraw the plan loop's gates as a fan-out in `AUTONOMOUS_FLOW.md` and its whiteboard

**Goal:** Make the two plugin flow documents describe the plan loop as it now runs: the writer drafts, the round's gates review that draft together, and one join decides — no gate ahead of another.

**Depends on:** Task 12, whose task-plan core sends a round's three gates as one set and closes the round at the join; Task 15, whose fix-plan core does the same for its two gates; Task 17, whose pause module checks a PAUSE once before a set and honours one placed during it at the join.

**Where this task stops.** Prose only, citing the cores rather than restating their rules. No heading changes: `plugin/docs/README.md` holds the citer sweep for `AUTONOMOUS_FLOW.md`'s headings.

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md` → `## The inner loop of a task-prompt run` (`**1. Planning.**`), the second entry point's fix-plan paragraph, and the run's side of a pause (the paragraph opening *"The run's side of a pause"*).
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → `**Planning.**` (the sentence, the diagram and the paragraph after it).

**Work:**

- [ ] `AUTONOMOUS_FLOW.md` → `**1. Planning.**`: *"Three **plan gates** run in sequence on each draft before any code exists — a business-parity gate (gated on `phases.parity`), then an architecture gate, then the plan review itself — and every gate runs in every **round**, whatever an earlier gate in it returned."* becomes: three plan gates — a business-parity gate (gated on `phases.parity`), an architecture gate and the plan review itself — review each draft together in every round, before any code exists, none reading another's findings of that round, so a round takes as long as its slowest gate; the following *"One decision point closes the round"* sentence names it the join. The fix-plan paragraph's *"both running in every round"* gains *"together"*. The pause paragraph gains one sentence: a plan round's gates go out together, so a pause requested during them is taken once they have all returned.
- [ ] `AUTONOMOUS_FLOW_WHITEBOARD.md` → `**Planning.**`: *"One writer/reviewer loop with two plan gates nested ahead of the structural one"* becomes one writer/reviewer loop whose three plan gates review each draft together; redraw the diagram as a fan-out from `task-plan-writer` to the three gates and a join into the round decision, keeping its `FAIL in any gate: revise once, re-run every gate` return arrow and its fenced block; replace *"The order is cheapest-to-fix-if-wrong first: …"* through *"… grades the plan's structure."* with one sentence: the three gates are independent lenses on the same draft, so they run at once and the writer revises against all of their findings together. The rest of that paragraph — the split output and the per-round commit — stays.

**Verification:**

- `grep -n "in sequence on each draft\|then an architecture gate\|nested ahead\|cheapest-to-fix-if-wrong" plugin/docs/AUTONOMOUS_FLOW.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` finds nothing.
- `git diff plugin/docs/AUTONOMOUS_FLOW.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` shows no heading line changed.
