# Converging plan reviews — decisions of record and the measurement owed

**Who reads this:** a maintainer deciding whether converging plan reviews did what they were built for — fewer `FAIL` rounds, fewer cap hits, fewer planning tokens, no real plan defect let through unrecorded — or changing either plan-writing loop's review rounds.

**What it owns.** The decisions of record for the branch that made every plan reviewer run every round, switched reviewers to `converging` mode from the third round and committed each round in the autonomous fork, each with its reason and its cost; the baseline that branch was measured against; and the method and commands for the comparison a later run owes. It does not restate a contract the plugin owns: the round file, the Must Fix entry, converging mode, incidental findings, precedence and the writer's revision are `plugin/instructions/plan_review_rounds.md`'s, and the walker's routing decisions are `docs/flow-graph-walker.md`'s. No result is recorded here: none can exist on the branch that wrote this document.

---

## 1. The decisions

### Revision notes live in one writer-owned folder, numbered by the round they feed

**Decision.** The writer's revision note for a round goes under `<state_dir>/plan_revisions/<branch>/`: `task_plan_revision_<n>.md` for the task plan, `fix_plan_<N>_revision_<k>.md` for the fix plan of user-review round `<N>`. Both loops write into the same folder, and each file carries the number of the round it feeds — the round whose reviewers read it. The note's shape is `plugin/instructions/plan_review_rounds.md` → `## The writer's revision`.

**Reason.** A converging reviewer reads its own previous round file and the note for the round under review (`plugin/instructions/plan_review_rounds.md` → `## Converging mode`). Numbering the note by the round it feeds makes that lookup the reviewer's own dispatch index, with no arithmetic to get wrong. One folder for both loops keeps the run-artifact tree to one new directory, and the loop prefix in the file name keeps the two series apart inside it.

**Cost.** A new run-artifact directory, with its generator row (`cli/src/generators/stateDir.ts`) and its contract README (`harness-runs/plan_revisions/README.md`), and one more path in every per-round and planning-pause commit path set (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 6 — commit each plan-review round`).

### The fix-plan loop's gate folders are per user-review round

**Decision.** The two fix-plan gates write under `<state_dir>/business_parity_user_review_reviews/<branch>/user_review_<N>/` and `<state_dir>/architecture_user_review_reviews/<branch>/user_review_<N>/`, `<N>` being `1` for the unsuffixed user review.

**Reason.** A round file is named by its round index, and the fix-plan loop's round index starts again at 0 with each user-review round (`plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` step 5). In a flat per-branch folder, user-review round 2's `review_0.md` would overwrite round 1's.

**Cost.** One more directory level, which every reader of those two folders has to name; the end-of-branch reviewers read them recursively for incidental findings (`plugin/agents/branch-reviewer.md`, `plugin/agents/skeptic-reviewer.md`).

### Incompatible findings resolve by a fixed precedence

**Decision.** When two findings of one round cannot both hold, the writer resolves them by precedence — task plan: business parity, then architecture, then plan structure; fix plan: business parity, then architecture — and records the losing one under `## Rejected findings`. This is the one named exception to *"`call stands` is unavailable for a Must Fix"* (`plugin/instructions/plan_review_rounds.md` → `## A rejection recorded under precedence`).

**Reason.** Every reviewer now runs every round against the same version of the plan, so two incompatible Must Fix items can arrive in one round. Without an order the writer has no legal move — it may not reject a Must Fix — and the loop can only run to its cap. A fixed order makes the outcome predictable, and the recorded rejection keeps the losing finding visible to the reviewer that raised it.

**Cost.** A correct lower-precedence finding can lose. The guard is the losing reviewer's check in its next round: it tests only whether the two findings are genuinely incompatible and whether the winner still stands, and re-raises once when either fails.

### A resumed fix-plan session restarts the round at its first gate

**Decision.** The autonomous fix-plan fork never takes a next-due-gate resume: a resumed round restarts at the business-parity gate, and each gate replaces its own `review_<k>.md` for that round (`plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`).

**Reason.** Telling a complete round from an interrupted one needs the round files' verdict lines, and the fix-plan loop's orchestrator reads no findings file's contents (`plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Context discipline`). The task-plan loop can resume at the next due gate because the walker, not the orchestrator, reads that evidence; the fix-plan loop has no walker (`## 2. Known tech debt`).

**Cost.** One parity review at most: the restart repeats the parity gate when the interruption fell after it.

### The round counter is kept apart from the round files' numbering

**Decision.** In both loops the counter that drives the cap and the review mode is a different number from the one that names the round files. The task-plan walker carries its counter only in a continued saved walk, and every `start` begins it at 0, while the round number continues from the round files on disk (`cli/templates/scripts/flow-walker.sh` → the header's `STATE` paragraph). The fix-plan loop's counter is `fix_round − cap_base`, and a resumed fix-plan session sets `cap_base` to the round it resumes at (`plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow`, **The round counters.**; `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`).

**Reason.** An answered cap park, an **extend** and a fresh write each get a full five-round budget and two `full` rounds, while the round files never overwrite an earlier round's.

**Cost.** A loop paused and resumed without a saved walk can run more than five rounds in total before a cap.

### The walker's decisions

The task-plan loop's routing decisions are recorded where the walker's other decisions are, and are not restated here:

- every gate every round, closed by the `plan_round` round node, and the `formatVersion` 2 bump — `docs/flow-graph-walker.md` → `### Item 7 — every gate every round, closed by a round node`;
- the repeated `arg.findings_file:` key, `arg.iteration` as the round number and `arg.review_mode` — `docs/flow-graph-walker.md` → `### Item 2 — each node's dispatch block stays in the core`;
- what `start` reads, the next-due-gate resume and convergence read from `P1` alone — `docs/flow-graph-walker.md` → `### Item 3a — walker state is machine-local, and a re-entry continues it`;
- the cap counting rounds, and `rounds:` counting `verdict: FAIL` files — `docs/flow-graph-walker.md` → `### The iteration cap — the graph owns it, the core keeps two descriptions held by a check`.

Committing unconverged plans every round, and what the remote bundle then carries, is `docs/remote-execution.md` → **Planning drafts cross the job boundary in the bundle.**

---

## 2. Known tech debt

The user-review fix-plan loop's routing is prose, restated by hand in `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow`. Moving it onto a walker graph is a separate task, tracked on its own, and is the precondition for giving that loop the walker's next-due-gate resume. No row in `ROADMAP.md` or `docs/development.md` → `## 6. The roadmap this tree defers to` carries that task yet.

---

## 3. The baseline

Quoted from this branch's task prompt (`harness-runs/task_prompts/feat_converging_plan_reviews_task_prompt.md` → `## Why`) as measured on 2026-11-13 from this repository's run artifacts; this document did not re-measure it.

| FAIL rounds per branch | `task_plan_reviews/` | `architecture_reviews/` |
|---|---|---|
| 1 | 20 | 27 |
| 2 | 40 | 21 |
| 3 | 17 | 7 |
| 4 | 12 | 4 |
| 5–6 | 5 | 6 |

**Its method.** Before this branch a reviewer wrote `review_<n>.md` only on `FAIL`, so the files in a branch's folder counted its `FAIL` rounds. The index carried on across re-entries of the loop, so a few counts include a re-entry. That method does not survive this branch: a `PASS` now writes a file too, so a file count overstates `FAIL` rounds; `## 4` restates it.

**The earlier token figure it relates to.** `docs/orchestrator-cost-measurement.md` → `## 5. What the measurements support` → *"A leaner plan loop"*: the plan writer and reviewer read about 30% of all cached context over about four rounds per run, which is the lever fewer rounds pulls.

---

## 4. The comparison owed, and how to take it

**The comparison is owed by a later run**, over branches planned after this lands; this branch cannot take it. Every command below is read-only, runs from the checkout root, and states the property its output must have rather than a count to expect. `harness-runs/` is this repository's `stateDir`; `<branch>` is the branch being counted.

**No opt-in seam is needed.** Every run already writes what these read — the round files' `verdict:` lines, the `## Incidental findings (not gating)` sections, the clarification records and the stream logs — so the data exists without a new switch (`harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam that will measure it"*).

### FAIL rounds per branch

Count the files carrying `verdict: FAIL`, not the files. One file per gate per round, so each listed file is one distinct round index of that gate:

```
grep -l '^verdict: FAIL' harness-runs/task_plan_reviews/<branch>/review_*.md
grep -l '^verdict: FAIL' harness-runs/architecture_reviews/<branch>/review_*.md
```

Property: every listed path is a round that gate failed, and no round index appears twice in one folder's list. A folder written before this branch landed has no `verdict:` lines and lists nothing, so it belongs to the baseline's method, not this one. Tabulate per folder in the baseline's buckets.

### Cap hits

```
grep -rnE 'revision cap|review rounds on the fix plan did not converge' harness-runs/clarification_digests/ harness-runs/clarifications/
```

Property: each plan-loop or fix-plan-loop cap park appears on at least one listed line, and the lines are free text a writer composed. Count each `## question_` heading or `question_<n>.md` once, and drop a line that names the cap only as an option in an answer. A UI-test-plan cap, which reads *"UI-test-plan-review iterations did not converge"*, is not matched and is not this metric. Only the two autonomous flows write the committed digest (`plugin/instructions/clarification_digest_instructions.md`), and `harness-runs/clarifications/` is machine-local and goes with the run copy, so a cap escalation answered live in a supervised or semi-autonomous session is not counted here.

### Planning-phase tokens

Attribute each model call to its agent exactly as `docs/orchestrator-cost-measurement.md` → `## The data` → **Attributing a model call to an agent.** does, over the raw stream log the run daemon keeps in the main checkout (`harness-runs/autonomous_logs/README.md`):

```
jq -sc '(map(select(.type == "assistant") | .message.content[]? | select(.type == "tool_use" and .name == "Agent") | {(.id): .input.subagent_type}) | add // {}) as $agent | map(select(.type == "assistant" and .message.usage != null)) | unique_by(.message.id) | map(. + {who: (if .parent_tool_use_id then ($agent[.parent_tool_use_id] // "unattributed") else "orchestrator" end)}) | group_by(.who) | map({agent: .[0].who, calls: length, cache_read: (map(.message.usage.cache_read_input_tokens // 0) | add), cache_write: (map(.message.usage.cache_creation_input_tokens // 0) | add)}) | .[]' harness-runs/autonomous_logs/<branch>.stream.jsonl
```

Property: one line per agent, each message counted once by `message.id`; an `unattributed` line means a dispatch the log does not name and is reported, never folded into an agent. The planning phase is the plan and UI-test-plan writers and reviewers, with the orchestrator's share attributed by phase as that document's `## 2. Where the orchestrator's reads accrue, by phase` does.

### Plan-level defects the end-of-branch reviewers found

List the end-of-branch findings and the planning rounds' incidental entries:

```
ls harness-runs/code_reviews/<branch>_code_review/ harness-runs/skeptic_reviews/<branch>_skeptic_review/
grep -rn -A 40 '^## Incidental findings (not gating)' harness-runs/task_plan_reviews/<branch>/ harness-runs/architecture_reviews/<branch>/ harness-runs/business_parity_reviews/<branch>/ harness-runs/architecture_user_review_reviews/<branch>/ harness-runs/business_parity_user_review_reviews/<branch>/
```

Property: the first lists one `finding_<N>.md` per finding, round-suffixed folders (`_2`, `_3`, …) included; the second lists every incidental entry, and a folder that does not exist yields nothing. Read each finding and record whether it traces to a defect in the plan rather than in the implementation of a sound plan; for each that does, record whether a converging round had listed it as incidental. **This last line tests the main risk** — a plan passing with a real defect because converging rounds look only at changed text.
