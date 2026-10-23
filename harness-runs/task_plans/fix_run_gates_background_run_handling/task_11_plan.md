### Task 11 — Record the probe results and the run's evidence in `docs/sandbox-verification.md` as rows BG1–BG10

**Goal:** Put the measurements this branch's design and corrected passages rest on into the document of record, each with the Claude Code version it was taken on: probes A, A2, B1, C1–C3, E and F on 2.1.309, and the run `feat_unattended_sandbox_preflight` on 2.1.308. Record `STALL_BUSY_CPU_PCT`'s effect as not measured, the Linux sandbox as not taken, and the shipped run form's sandboxed end-to-end check as owed. The corrected passages cite these rows by id.

**Depends on:** Tasks 1, 4, 6 and 7.
- Task 1's run form detaches the gate run (`nohup … </dev/null >/dev/null 2>&1 &` plus `disown`, probe A2's shape) and prints `pending`.
- Task 4's G.1 cites BG1, BG2, BG5 and BG6.
- Task 6's §2.5 cites BG1 and BG5–BG9.
- Task 7's fork clauses point at §2.5.

The ids and the content of each row are fixed by the story index's `## Context` table, **The rows the corrected passages cite**. Create exactly those ids, BG1–BG10, with that content, so every citation resolves. This task edits no file outside `docs/sandbox-verification.md`.

**Where the figures come from.** The raw probe results (`<home>/Work/harness-sandbox-tests/sbx2-results-20261023-083639/`) and the run's `stream.jsonl` / `watcher.log` are outside what a sandboxed run may read. Record each figure and message exactly as the task prompt `harness-runs/task_prompts/fix_run_gates_background_run_handling_task_prompt.md` states it, attributed the way row WF1 already is: *"Taken 2026-10-23 by the maintainer (from the task prompt)"*. Infer nothing, round nothing and add no figure. The maintainer took these probes by hand, from outside the sessions under test (`harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session"*). This task measures nothing itself.

### Targets

- `docs/sandbox-verification.md`: the `**Who reads this:**` paragraph, the headline, `## 5. Failures and their follow-ups` (a new F6 row, rows WF2 and WF4, a new BG block), and `## 6. The unresolved points, settled or not`.

**Work:**

- [ ] **The opening.** In `**Who reads this:**`, after *"or `run-test-suite.sh`'s liveness check (the Run gates wait form and its one-run-per-label guard)"*, add the run form's detaching and the flow's account of a headless turn's end. In **The headline, before the rows.**, add a fifth bullet:
  - a gate run that outlasts the Bash tool's background time limit is stopped, so G.1's "moved to the background" case never collected the suite (§5 F6, BG3, BG7);
  - `fix_run_gates_background_run_handling` makes the run form detach the run itself (BG2);
  - BG10, the sandboxed re-run, is owed.

  Change *"Four defects"* to *"Five defects"*.
- [ ] **§5's failures table: row F6.**
  - **Failure:** a gate run the Bash tool moved to the background is stopped at the tool's background time limit, so a suite longer than that never yields a verdict (BG3, BG7).
  - **Rows:** BG1–BG10.
  - **Follow-up:** `fix_run_gates_background_run_handling`. The run form detaches the gate run with `nohup … </dev/null >/dev/null 2>&1 &` plus `disown` and prints `pending`, and every round is collected through `--wait`. G.1 and §2.5 now carry the measured teardown cases. No sandbox profile entry was added. Owed: BG10. BG9 not taken.
- [ ] **The BG block.** Add it after the existing **The Run gates wait form.** block, under the bold title **The Run gates run form, the background limit and a headless turn's end.** Open with a **Stamp.** line: 2026-10-23 · Claude Code 2.1.309 · macOS, headless, sandboxed, on the watcher's launch line under this checkout's live profile, watched from outside the sandbox · the run on 2026-10-22 · Claude Code 2.1.308 · BG10 not taken · BG9 not taken. Use the `| # | Check | Expected | Observed | Verdict |` columns. One row per id, as the story index's table fixes, quoting the task prompt's exact messages:
  - BG3's move message: *"If it is still running after 10m in the background, it will be stopped and you will be notified."*, and its notification: `status: "stopped"`, *"stopped after reaching its background time limit"*;
  - BG4's *"If it already had the longest `timeout` allowed, do not restart it"*, with the maximum recorded **not measured**;
  - BG5's `E-woken` and second `result` event;
  - BG7's round 1 (`timeout` 600000, moved at 10 minutes, stopped at 20), its round 4, and its watchdog lines at 1203 s and 1212 s (`kill and resume at 2700s`), which did not kill;
  - BG8: **not measured**. Add the code-reading note, labelled as code reading and not as measurement: the watchdog's CPU sum covers the session's enumerable descendants, which a detached run is not among (`cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs`, `collect_descendants`). The seam is the watcher's environment tunables;
  - BG9: **not taken**, not inferred from macOS;
  - BG10: **not run — owed**, with its Expected column as the index's table states it.
- [ ] **WF2 and WF4.** Both are owed rows written for the shape before this branch. Restate WF2's start-up as the shipped run form issued as one plain foreground call, with no Bash-tool background option, then repeated `--wait`. Keep its held-past-`STALE_SECONDS` condition and its Expected column. Mark WF4, *"the start-up shape `sandbox2c` may adopt"*, as **superseded by BG10**: the run form now detaches itself, so the self-detached shape is the shipped one. Keep WF4's text as the record of what was planned. Leave WF1, WF3 and WF5 unchanged, and add one sentence under the block saying F5's rows and F6's share the heartbeat.
- [ ] **§6.** Add three bullets:
  - **`STALL_BUSY_CPU_PCT` on a session waiting behind a detached run: not measured** (BG8), with what would settle it: a watcher run with lowered `STALL_WARN_SECS` / `STALL_KILL_SECS` over a session that ends its turn with a gate run in flight;
  - **a gate that never exits:** `--wait` prints `pending` for as long as its heartbeat is fresh, and nothing bounds a live run, by design. A STOP file ends the wait, not the run;
  - **the probe re-run:** the probes were taken on 2.1.309. Whether the installed version had changed when this branch landed was not checked by the implementing run. If it has, the probes are re-run and both versions' results recorded side by side.

  Extend the existing Linux bullet to name BG9.

**Verification:**

- `grep -oE '^\| BG[0-9]+ ' docs/sandbox-verification.md` lists BG1 through BG10, each once.
- Every `BG<n>` id the plugin cites — `grep -rhoE 'BG[0-9]+' plugin` — is one of the rows above.
- Every BG row's Observed cell names `2.1.309` or `2.1.308`, or is `not measured`, `not taken` or `not run — owed`.
- `grep -n 'Five defects' docs/sandbox-verification.md` hits the headline, and `grep -n '| F6 |' docs/sandbox-verification.md` hits once.
- Every figure in the new rows appears in the task prompt (`harness-runs/task_prompts/fix_run_gates_background_run_handling_task_prompt.md`). Read each new row against the task prompt's evidence table once.

**Deviations from plan:**
- Added one sentence after the BG table, carrying no figure, that points to Task 1's and Task 2's **Deviations from plan:** notes. Those notes record a worker heartbeat that stopped refreshing while the worker and its gate were still alive, once with no signal sent. The sentence names BG10's hold past `STALE_SECONDS` as the row that would show this on a real run. The orchestrator's context notes flagged those notes. No BG row carries their figures, because every figure in a BG row has to come from the task prompt.
- The §5 Stamp line also names BG8 as **not measured**, and the WF stamp now reads `WF2 and WF3 not taken · WF4 superseded by BG10`, so it stays consistent with WF4's new Observed cell.
- BG10's Check leaves out `STALE_SECONDS`'s value (30 s), because the task prompt does not state it. WF2's row still states it.
- BG7's attribution reads *"Recorded by the maintainer (from the task prompt)"* and gives no date. The task prompt dates the run (2026-10-22) but not the day its logs were read.
- No verification step was downgraded. All five **Verification:** checks were run as greps or as a read in this session: the BG ids each appear once, `BG1`–`BG10`; the plugin cites BG1, BG2 and BG5–BG9, and every one resolves; `Five defects` matches line 7; `| F6 |` matches once; every figure in a BG row was read against the task prompt's evidence table. `commands.typecheck` (`bash scripts/typecheck.sh`) was run and printed `PASS: typecheck`.
