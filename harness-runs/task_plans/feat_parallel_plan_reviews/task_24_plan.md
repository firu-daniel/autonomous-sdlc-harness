### Task 24 — Record headless-concurrency probe BG11, owed, in `docs/sandbox-verification.md`

**Goal:** Ship the seam that settles the task prompt's *"Verify headless concurrency in a `claude -p` orchestrator session"*: a by-hand probe, written down exactly enough to be taken and graded, beside the other headless-session rows it extends — and marked owed, because a run cannot take it inside its own session (`harness-runs/lessons.md` → `## Evidence and measurement`, the in-session wall-clock rule).

**Depends on:** Task 12, whose task-plan core states the dispatch form the probe tests: every dispatch of a set in **one message**, as foreground `Agent` calls, never `run_in_background`, each return recorded before the next action.

**Where this task stops.** The row records the probe and leaves its Observed and Verdict cells owed; taking it is the maintainer's, by hand (the story index's `Manual setup required:`). No script ships: the probe is one session and a stream read by hand, like BG1–BG6's.

### Targets

- `docs/sandbox-verification.md` → `## 5. Failures and their follow-ups`, the table under **The Run gates run form, the background limit and a headless turn's end.** (a new row BG11 after BG10), and that block's stamp line.

**Work:**

- [ ] Add row `BG11`: **Check** — a headless `claude -p --output-format stream-json --verbose` session, launched by hand outside any other session on the watcher's launch line, whose prompt asks it to dispatch two sub-agents **in one message** as foreground `Agent` calls, each running one Bash `sleep 60` and returning, then to print one line; a second session asks the same with `run_in_background: true` on both. **Expected** — in the first, both `Agent` `tool_use` blocks sit in one assistant event, both `tool_result`s arrive about 60 s after it rather than 60 s apart, and the final line's event follows both; in the second, whether the turn ends or stalls before the results arrive (BG5's account). **Observed** — `owed: not taken`. **Verdict** — `owed`. Name the stream fields the grader reads (the two `tool_use` ids, each closing `tool_result`'s event timestamp, the final assistant event's timestamp).
- [ ] Add to the block's stamp line that BG11 is owed and to be taken by the maintainer by hand, and add one sentence after the table: until BG11 is taken, `plugin/instructions/task_plan_writing_instructions_core.md` → `## Safety contract — applies before EVERY Agent dispatch` states the one-message foreground form on the ground that it is correct whether or not the calls overlap; BG11 settles only whether a round's wall time drops.

**Verification:**

- `grep -n "^| BG11 |" docs/sandbox-verification.md` matches once, after the `BG10` row; its Observed cell reads `owed: not taken`.
- The row names no machine path: `grep -n "BG11" docs/sandbox-verification.md` lines carry no `/Users/` or `/home/` (gate 6a's rule, `.claude/context/conventions.md` → `## The testing bar`).
