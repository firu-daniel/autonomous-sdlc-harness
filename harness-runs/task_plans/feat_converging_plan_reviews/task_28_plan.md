### Task 28 — Restate `docs/flow-graph-walker.md` for round routing, the new arguments and the round number on `start`

**Goal:** Keep the walker's decision record true: record the new routing and why it needed a new node kind and format 2, the walker arguments that changed and why the findings list is a repeated key, the round number kept apart from the loop counter on `start`, and the readers that used to assume a findings file means `FAIL`.

**Depends on:** Task 3 (round routing; `arg.iteration` = the round number on round gates and on every `plan_writer` dispatch; `arg.review_mode`, keyed on the loop counter; one `arg.findings_file:` line per file of the closed round; `round: <n> <verdict>`; the cap payload with `{open_gates}` and `FAIL`-file round counts; every `start` setting the counter to 0 and the round number, and the mid-round position, from `fw_round_evidence`). Task 5 and Task 6, whose case names the restated **Evidence.** paragraph quotes — Task 6 keeps case `(6) re-entry mid-loop restarts the counter and continues the findings folder` under that name and adds case `(13)`. Task 25 and Task 26 (format 2, the `round` kind, the `gate-in-round` check). Task 11 (the core's restated sizing sentence and its unchanged cap phrases).

**Where this task stops.** This document records decisions and measurements; it does not restate the walker's usage (its header), the format (the schema) or the checks (`THE CONTRACT`), as its own *"What it owns"* paragraph says. The broader decisions of this branch — the revision-note path, the fix-plan folders, precedence, the measurement — are **Task 30**'s `docs/converging-plan-reviews.md`, which links here for the walker's part; this document names none of them and links to no file this branch has not yet created.

### Targets

- `docs/flow-graph-walker.md`

**Work:**

- [ ] New `### Item 7 — every gate every round, closed by a round node` under `## 2. The decisions`: **Decision** (gates route `PASS` and `FAIL` forward; `plan_round`, kind `round`, closes the round; `formatVersion` 2); **Reason** (the format had no node that routes without an agent outcome and no state that remembers verdicts within a round; reading `gates` rather than naming them in code keeps a later fan-out an edge change); **Cost** (a format bump: every fixture moved, the walker reads 2 only, and an adopter's walker and graph are replaced together by re-running `init`, as `### Item 6` already records).
- [ ] `### Item 2 — each node's dispatch block stays in the core`: the walker now supplies `arg.iteration`, `arg.review_mode` and a repeated `arg.findings_file`; record the choice of a **repeated key** over a list value or a sibling argument and its reason (the key stays byte-stable for every reader, a path may contain any separator, and a one-file revision prints exactly what it printed before).
- [ ] `### Item 3a`'s **Evidence.**: keep the sentence quoting case `(6) re-entry mid-loop restarts the counter and continues the findings folder` — what `start` still resets is the counter, as before — and restate its *"the architecture gate's `arg.iteration` is 1, because `review_0.md` is on disk"* so the reason is the round numbering continuing from the round files, no longer a per-folder next free index. Add the rule `start` now follows (the counter is carried only by a continued saved walk, so an answered cap park starts a fresh five-round budget, pinned by case `(13)`; the next due reviewer only on complete, consistent evidence; the first reviewer otherwise; never convergence from files), and the renamed and new resume cases' names. Its **Which record wins.** paragraph gains that a committed plan is no evidence of convergence: `P1` is.
- [ ] `### The iteration cap`: the cap counts rounds; the core's sizing sentence now reads *exactly* four dispatches per round, with the three checked phrases unchanged; and the cap's `rounds:` lines count `verdict: FAIL` files because a `PASS` now writes one. `## 3`'s fourth finding (*"The graph format and `scripts/check-flow-graph.sh` needed no change …"*) stays as the pilot's finding and gains one sentence pointing at Item 7 for this branch's change.

**Verification:**

- `grep -n "is on disk" docs/flow-graph-walker.md` finds no sentence giving a per-folder next free index as the reason for `arg.iteration`.
- Every case name the document quotes exists verbatim in the suite it names: for each quoted `(n) …` name, `grep -F` of it in `cli/test/flow-walker-resume.test.mjs` or `cli/test/flow-walker-ui-and-reentry.test.mjs` finds one line.
