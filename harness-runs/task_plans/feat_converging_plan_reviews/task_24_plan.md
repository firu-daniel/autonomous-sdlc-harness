### Task 24 — Restate the plan loop's routing in `AUTONOMOUS_FLOW.md` and its whiteboard

**Goal:** Correct the two plugin flow documents wherever they say a `FAIL` sends the plan straight back to the writer, that the plan is committed only at convergence, or that each fix-plan gate is capped on its own.

**Depends on:** Task 11 (every plan gate runs every round; one decision node closes the round; one round counter capped at five; converging mode from round 3). Task 12 (the fix-plan loop's same shape, its one counter and five-round cap). Task 19 and Task 20 (per-round commits and the planning-pause commit in the autonomous forks only).

**Where this task stops.** These documents describe and cite; they restate no contract. `AUTONOMOUS_FLOW.md`'s wiring table rows naming the cores stay as they are.

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md`
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`

**Work:**

- [ ] `AUTONOMOUS_FLOW.md` → **1. Planning.**: replace *"that loop's single revision counter is capped at five across all three: every FAIL, from whichever gate, sends the plan back to the writer and re-runs every gate"* with every gate running every round, one decision point closing the round and returning to the writer once with every findings file of the round, the counter moving once per round and capped at five rounds, reviewers checking only the changes from the third round on with anything else noted as non-gating incidental findings the end-of-branch reviewers follow up; and *"At convergence the plan is **committed**"* with: an unattended run commits the plan at the end of every round, convergence being the ledger's `P1` alone.
- [ ] Same file → the fix-cycle paragraph's *"drives it through the same two plan gates the task flow's plan passes, each capped at five iterations"* becomes both gates every round, one five-round cap.
- [ ] `AUTONOMOUS_FLOW_WHITEBOARD.md` → **Planning.**: redraw the diagram so both `FAIL` and `PASS` move forward through the gates to a round decision, with `FAIL in any gate: revise once, re-run every gate` on the loop-back arrow; keep the paragraph under it, which argues the gate order. The *"a convergence cap per writer/reviewer loop (five iterations, …)"* answer names five **rounds**.

**Verification:**

- `grep -n "every FAIL, from whichever gate\|each capped at five iterations\|FAIL: revise, then re-run every gate" plugin/docs/AUTONOMOUS_FLOW.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` finds nothing.
- Neither file gains frontmatter (`head -1` of each still prints its H1).

**Deviations from plan:** The Work bullet for `AUTONOMOUS_FLOW_WHITEBOARD.md` says to keep the paragraph under the diagram, but that paragraph's last sentence, *"At convergence the plan is **committed**"*, is one of the claims the Goal says to correct. Its gate-order argument is unchanged; only that sentence now says an unattended run commits the plan at the end of every round and reads convergence from `P1` alone.
