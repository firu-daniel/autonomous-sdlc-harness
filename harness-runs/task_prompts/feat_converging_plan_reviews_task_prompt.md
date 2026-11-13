`feat_converging_plan_reviews` changes how the plan-writing loops review a plan. Every reviewer runs in every round. From the third round on, reviewers check what changed instead of reviewing the whole plan again. The autonomous fork commits the plan at the end of each round. The goal is fewer review rounds, fewer cap hits and fewer tokens in the planning phase, without letting a real plan defect through unrecorded.

> ⚠️ **Find every anchor in this prompt by its quoted text or symbol name, never by line number.** Verify every claim marked *verify* before planning on it.

---

## Why

Measured on 2026-11-13 from this repository's run artifacts. A findings file `review_<n>.md` is written only on a FAIL, so the files per branch count FAIL rounds. The index carries on across re-entries of the loop, so a few counts include a re-entry.

| FAIL rounds per branch | `task_plan_reviews/` | `architecture_reviews/` |
|---|---|---|
| 1 | 20 | 27 |
| 2 | 40 | 21 |
| 3 | 17 | 7 |
| 4 | 12 | 4 |
| 5–6 | 5 | 6 |

Reading the Must Fix items round by round on a branch that reached round 4 (`feat_docs_catalog_retrieval`) shows that **late rounds raise new findings, not leftovers from earlier ones.** Some are defects the reviewer missed under a full-plan review. Others are defects the previous revision introduced: round 4's finding there reads "Task 24 … forbids fixing it", text the revision itself wrote. That gives three causes, and this branch addresses each:

- **Serial gates hide findings.** In `cli/templates/scripts/flows/task_plan_writing.graph.json`, a FAIL at `business_parity_review` or `architecture_review` goes straight back to `plan_writer`. The reviewers after it do not run that round, so their findings arrive one round later each.
- **Full re-reviews spread attention thin.** Every round, every reviewer re-reads the whole plan, including reviewers that already passed. What it misses early surfaces late.
- **Revisions break neighbouring text.** Nothing checks a revision against the areas it touched beyond the finding it answered.

A plan that passes with a real defect is the risk. The end-of-branch reviewers (`branch-reviewer`, and `skeptic-reviewer` above all) are the backstop. Part 3 hands them what the converging rounds noticed but did not gate on.

## What changes

### 1. Every reviewer runs in every round

- **Graph.** A reviewer's `FAIL` no longer routes to `plan_writer`. It routes to the next reviewer, exactly as `PASS` does, and the reviewer's findings file is recorded for the round. After the last reviewer (`plan_review`), one decision point closes the round. If any reviewer failed, it routes to `plan_writer` with the `revision` prompt and increments `iteration` **once per round**. If none failed, it routes to `ui_writer`. The `onCap` escalation moves to that decision point, and its `summary` names every gate that was open when the cap fired, not just one. *Verify* whether this needs a new node kind or can be expressed in the existing graph format. If it needs a new one, `formatVersion`, `schemas/` and `scripts/check-flow-graph.sh` (including `fail-cycle-capped` and `cap-matches-core`) change with it, and the walker's resume cases in `cli/test/flow-walker-resume.test.mjs` are re-pinned. Skips (`passedByExclusion`, `skipped`) are unchanged.
- **Every reviewer writes a file for every round, PASS included, named by round.** Today a reviewer writes `review_<n>.md` only when it has Must Fix items, and `arg.iteration` is the next free index in its own folder (`task_plan_writing_instructions_core.md` → "never the loop counter"). Both change. A PASS writes a file holding the header and the verdict (and, in converging mode, any `## Incidental findings (not gating)`). The file index is the round number, the same across all reviewers' folders, so "the previous round's findings files" is one lookup. Change every sentence that ties writing a file to having Must Fix items, in all three reviewers' plan-review modes and in the two loop cores ("creates … itself only when it has findings to write"). *Verify* the readers of these folders that assume a file means FAIL: `docs/flow-graph-walker.md` case `(6)`'s "because `review_0.md` is on disk", the cap's `roundCounts`, and the `## Why` counting method above, which this branch's measurement must restate as counting `FAIL` verdicts.
- **This is the base for parallel reviews.** Later, the sequence becomes a fan-out and the decision point becomes a join. Keep the decision point independent of reviewer order so that step changes only the edges.
- **Writer revision prompt.** `Revise the task plan per findings at <findings_file>.` becomes a list of every findings file of the round. The walker's `arg.findings_file` becomes a list (or a sibling argument; the planner's choice, stated with its reason). The reviewer-side sentences that quote the old prompt (`plugin/agents/task-plan-reviewer.md` → "Your return is parsed, not read.", and the same in the parity and architecture reviewers) change with it.
- **`MAX_TOTAL_DISPATCHES`.** It was already sized at four dispatches per revision. *Verify* that the sizing sentence in `task_plan_writing_instructions_core.md` still holds, and restate it.

### 2. The writer works by target file

In `plugin/agents/task-plan-writer.md`, the revision mode:

- **Groups the round's Must Fix items by target file**, across all findings files, and reads every finding on a file against that file's unchanged text before making its first edit to it. Every finding in a round was raised against the same version of the plan. Applying one reviewer's fix and then reading another reviewer's finding against the edited text is the failure this rule prevents.
- **Resolves incompatible findings by precedence:** business parity, then architecture, then plan structure. The losing finding goes into the story index's `## Rejected findings` with the reason. It is never dropped silently. *Verify* this does not conflict with the existing rule that `call stands` is unavailable to the writer for a finding the reviewer grades Must Fix. Where it does, the precedence rule names the exception.
- **Writes a revision note per round:** one line per finding with the reviewer and finding number, the files it changed for it, and its disposition: `resolved`, `resolved by <reviewer> <n>`, or `rejected` (with a pointer to `## Rejected findings`). The note also names any file it changed that no finding asked it to change. The planner picks the path under `<state_dir>`, stated with its reason. This note is the record of what changed in modes that have no per-round commit (Part 4).

Every reviewer's Must Fix format (task-plan, architecture, business-parity, in plan-review mode) gains two fields: a short **quote of the text the finding was raised against**, and the defect stated as **the property that must hold**, not as a text replacement. Then the writer can test the finding against the current shape of the file even after another fix rewrote the passage. The existing rule that every Must Fix names its target file stays.

### 3. Converging mode from round 3

- **The walker passes a mode.** Each reviewer dispatch gets `arg.review_mode: full | converging`. Rounds 1 and 2 are `full`; from round 3 on, every reviewer is `converging`. With Part 1 in place, every reviewer sees every round, so the loop counter is each reviewer's own count. The threshold lives in the graph, not in reviewer prose.
- **A converging reviewer reads, in this order:**
  - its own previous findings file and the writer's revision note;
  - in the autonomous fork, the diff of the plan since the previous round's commit (Part 4);
  - the current plan, at the files its own findings, the revision note and the diff point to;
  - **another reviewer's findings file only for a finding whose change lands in its own review area**, to learn why that change was made. It does not read the other reviewers' files in full.

  This is a deliberate compromise. A reviewer needs to know why a change in its area was made, but every reviewer reading every other reviewer's findings in full would fill its context with concerns that are not its own. The revision note is the index that keeps the reads selective, which is why it names, for each finding, the files changed.
- **It checks, and only this:**
  - its own previous Must Fix items are resolved in the current plan;
  - every change the writer made (from the findings, the revision note and, where present, the diff) is sound within its own review area, including text that references or is referenced by the changed text;
  - the `## Rejected findings` entries, under the existing recorded-rejection rule.

  It does not re-review the rest of the plan.
- **Rules that assume a full sweep get a converging variant.** The task-plan reviewer's Scope-register derivation rule (dispositions (i)–(iii), "**never none** when a missing site is verified") applies in converging mode only to sites the changed text reaches. *Verify* every other "every round" or whole-plan rule in the three reviewers and state its converging variant.
- **Incidental findings.** Anything a converging reviewer notices outside that scope goes under a heading spelled exactly `## Incidental findings (not gating)`. The converging brief states both rules: these never count toward the verdict, and the reviewer does not go looking for them. A round whose only findings are incidental is a `PASS`. The verdict line contract (`verdict: PASS` / `verdict: FAIL`) is unchanged.
- **The end-of-branch reviewers read them.** `branch-reviewer` and `skeptic-reviewer` are given the planning rounds' incidental-findings sections as input and treat each entry as a lead to verify against the diff, never as a finding in itself.

### 4. Per-round commits, autonomous fork only

At the end of every round of the task-plan loop, the autonomous fork commits the story index, the per-task files, the round's findings files and the revision note through the main checkout's `commit-on-branch.sh`, with explicit paths only, as `task_plan_writing_instructions_autonomous.md` → `## Override 3` does for the UI-test plan. The push rules of that override apply. The converging reviewers diff against the previous round's commit. The supervised and semi-autonomous flows commit nothing during planning, as today. In those modes the converging reviewers work from the findings files and the revision note.

**Convergence is the ledger's, never the commit's.** From this branch on, an unconverged plan is in branch history by design. `P1` in the flow-progress ledger is the only signal that the task-plan loop converged. *Verify* every reader that infers convergence or resumability from committed plan files: Override 2's resume cases, the walker's unusable-walk check, and `cli/test/flow-walker-resume.test.mjs` case `(7) with no saved walk, a draft on disk is reviewed, never skipped or rewritten`, which now also covers a committed draft. Make each read `P1`.

**A pause during planning commits and pushes the round so far.** Today a planning pause leaves the drafts untracked, which the pause tolerates (`task_plan_writing_instructions_autonomous.md` → "Honoring a PAUSE during planning"). Once plan files are tracked, the writer's edits leave the tree with uncommitted tracked changes until the round's commit. `autonomous_pause_and_ledger.md` → `### 2.2` does not honour a pause on such a tree; it waits for the next commit, which here can be three reviewer dispatches away. So the planning pause gains one step. When every uncommitted tracked change is a planning artifact (the story index, the per-task files, this round's findings files, the revision note), it commits them through `commit-on-branch.sh` with explicit paths, pushes, and then honours the pause as §2.2 states. The commit message names the round and that it is partial. The resume continues the saved walk at the interrupted dispatch, as today. A tracked change outside those paths is still the §2.2 dirty-tracked case, unchanged.

**Resuming mid-round is best effort: the next due reviewer when the evidence allows, the first reviewer otherwise.** This applies to every resume of the planning loop: after a pause, a park, a self-pause on overload, and a re-entry with or without a saved walk.
- **The evidence:** a usable saved walk (`.flow_walker_state`), which already continues at the interrupted dispatch, and, without one, the round files on disk. The current round is the highest round number with files. The next due reviewer is the first gate, in gate order, with no file for that round. The verdicts so far are read from the files.
- **When the evidence is complete and consistent, dispatch the next due reviewer.** That means each earlier gate of the round has exactly one file carrying a verdict line, and the plan files are not newer than the round's earliest review file by commit order.
- **Otherwise, start the round again from the first reviewer.** Every reviewer of the restarted round **replaces** its own file for that round, if one exists. Its brief says the file is from an interrupted round and that it reviews again in the round's mode. The previous version stays in history through the pause commit.
- **The round counter is never derived from round files.** It carries over only when a saved walk is continued, as the walker already does: `flow-walker-resume.test.mjs` cases `(1)` and `(5)`. That covers a pause, a self-pause, an overload, a stall restart and a writer's question park. Every `start` begins at 0, as `flow-walker-ui-and-reentry.test.mjs` case `(6)` pins today; keep that case unchanged. A finished walk (a cap park, a convergence) is never continued, so answering a cap park starts a fresh cap budget. Round file numbering carries on across the branch's history, separate from the counter. Converging mode keys on the current walk's counter.

Never build a mechanism that guarantees the next-due-reviewer path. When the session cannot tell, the first-reviewer restart is the answer, and it costs one round's earlier review dispatches.

**The remote decision record is reversed.** `docs/remote-execution.md` → "Planning drafts cross the job boundary in the bundle" rejected committing drafts before a job yields because it "would put unconverged plans into branch history" and "split the meaning of 'converged and committed'". This branch accepts the first on purpose and removes the second through the rule above. Rewrite that paragraph as the new decision with its reason. The bundle keeps carrying planning drafts for what is still untracked (the UI-test-plan loop, which gets no per-round commits). Its restore already never writes over a committed file. *Verify* that this still holds once the task-plan files are committed, and state what the bundle then carries.

### 5. The user-review fix-plan loop

`plugin/instructions/user_review_fix_plan_writing_instructions_core.md` runs two gates (business parity, then architecture) with separate counters (`parity_iteration`, `arch_iteration`) and routing written in prose, with no graph. Apply Parts 1–3 to it **in its prose**: both gates every round, one counter replacing the two, the writer's work by target file and its revision note, and converging mode from round 3, with the mode stated in each gate's dispatch block. Apply Part 4, including the planning-pause commit, in its autonomous fork.

**Moving this loop onto a walker graph is out of scope.** It is a separate, larger task tracked on its own. Until then, this loop's routing is prose and is restated here by hand. Record that as known tech debt in the convergence summary, not as a finding.

## Tests

- **Walker / graph:** a round in which a middle gate fails still dispatches every later reviewer; the counter increments once per round; the cap escalation names every open gate; `arg.review_mode` is `full` for rounds 1–2 and `converging` from round 3; continuing a saved walk mid-round re-dispatches the reviewer in flight and keeps the round's recorded findings.
- **`check-flow-graph.sh`:** its existing cases still pass, plus a negative fixture for a round with no decision point, if the format changes.
- **Autonomous per-round commit:** stages exactly the named paths and nothing else.
- **Planning pause:**
  - A `PAUSE` placed after the writer returns and before the first reviewer commits and pushes the revision, then pauses at once, not after the round's reviewers.
  - A `PAUSE` placed between two reviewers commits the findings written so far.
  - A tracked change outside the planning paths still defers the pause as §2.2 states.
  - Resuming continues at the interrupted dispatch with the round's findings intact.
- **Mid-round resume:**
  - With the saved walk deleted, after the plan and the first reviewer's round file are committed, re-entry dispatches the second reviewer, and the counter starts at 0, because no saved walk carries it.
  - With the evidence inconsistent (a missing verdict line, or plan files newer than the round's first review), re-entry restarts at the first reviewer, which replaces its own round file.
- **PASS files:** a passing reviewer writes its round file, and a round of three PASS files reaches `ui_writer`.
- **Convergence from the ledger:** a committed but unconverged plan with `P1` `[ ]` is reviewed on re-entry, never treated as converged.

## Docs

`docs/flow-graph-walker.md` (the new routing and argument), `docs/remote-execution.md` (the reversed decision record), `autonomous_pause_and_ledger.md` (the planning-pause commit), the reviewer and writer agent files, and `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` wherever it describes the plan loop's routing. *Verify* every other place that states "a FAIL re-dispatches the writer" or "the five-revision cap", and correct it in the same branch.

**Roadmap.** In `ROADMAP.md`, set the `Converging plan reviews` row's status to `Done`, and restate its description to match what this branch shipped: every reviewer in every round, converging mode from round 3, and per-round commits in the autonomous fork. Leave `Parallel plan reviews` open. This branch is its base, not the feature itself, so add that dependency to that row's description. Check the numbered index at the top of the file for anything that must change with a row's status.

## Measurement — the branch's closing deliverable

Re-run the counts in `## Why` over the runs after this lands, and compare against that baseline:
- FAIL rounds per branch;
- cap hits;
- planning-phase tokens from the stream logs, with each call attributed to its agent as in #159;
- the number of `branch-reviewer` / `skeptic-reviewer` findings that trace to a plan-level defect, and how many of those a converging round had listed as incidental.

The last line tests the main risk: plans passing with real issues.

