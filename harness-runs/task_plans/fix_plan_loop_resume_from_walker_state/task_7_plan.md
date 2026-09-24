### Task 7 — Record the reversed decision in `docs/flow-graph-walker.md` → `### Item 3a`

**Goal:** Rewrite the pilot's decision of record in `docs/flow-graph-walker.md` → `### Item 3a`: re-entry used to reset the walker state, and a planning (re-)entry now continues a saved walk. Record the new re-entry rule, why the counter now survives a pause, what still resets it (`start`), which record wins when the two disagree, and the decisions this branch established rather than assumed.

**Depends on:** Tasks 1–6, which built what this task records.

- **Task 1:** the graph's `entries` are `["plan_writer", "business_parity_review", "ui_writer", "ui_review", "convergence"]`. The walker's header states that only `start` resets the counter, and that what `current` prints shows the saved `awaiting` value.
- **Task 2:** `cli/test/flow-walker-resume.test.mjs` pins the continuation sequences.
- **Task 4:** the core gains `## The walker — routing is its, judgement is yours` → **Continuing a saved walk.** and the step 5 outcomes **review** and **continue**.
- **Task 5:** the autonomous fork's `## Override 2 — resumability` takes a saved walk first, unless the ledger contradicts it. Its (b) needs `P1` `[x]`, and its (d) reviews a draft. `autonomous_pause_and_ledger.md` → `### 1.7` step 4 names the saved walk as the planning entries' within-phase position.
- **Task 6:** the semi-autonomous fork never selects **continue** or **review**.

This task cites each of these by file and heading and restates none.

**Where this task stops.** A document under `docs/` owns decisions of record and measured facts (`.claude/context/conventions.md` → `### Where a new responsibility goes`). It states no rule an agent follows. §1's size table is a measurement pinned to the pilot's commits, and it stays as written: this branch's growth of the core is not re-measured here. §4 is a proposal to the maintainer and is not edited (`harness-runs/lessons.md`: *"A decision rule's outcome is a proposal to the maintainer, not a settled future"*).

### Targets

- `docs/flow-graph-walker.md` — `### Item 3a`, and one bullet added to `## 3. Three findings established rather than assumed`.

**Work:**

- [ ] **Heading.** Retitle it `### Item 3a — walker state is machine-local, and a re-entry continues it`. Keep the `### Item 3a —` prefix, because the task prompt and `harness-runs/task_prompts/feat_orchestrator_flow_graph_planning_pilot_task_prompt.md` refer to the item by that number. `git grep -n "Item 3a"` shows no other citer of the heading's text.
- [ ] **Decision and Reason.** Rewrite **Decision.**:
  - The state still lives at `<state_dir>/.flow_walker_state` and is machine-local. Keep the `cli/src/generators/repoRoot.ts` / `.gitignore` sentence.
  - A planning (re-)entry now issues `current` first and continues a pending walk, citing the core's **Continuing a saved walk.**.
  - Only `start` overwrites the state and resets every counter, citing `flow-walker.sh` → `STATE`. That covers **proceed fresh**, **extend**, **review** and **skip**.

  Rewrite **Reason.** to state these points:
  - The pilot's reset reproduced the pre-walker loop, which held the counter only in context. Keep the `git show 1fd5ce9:…` citation as the evidence of what that loop did.
  - With the step on disk, discarding it let the autonomous fork's former case (b) skip a draft no reviewer had passed, quoting that case's old text *"Story index exists with a complete Phase 2 Readiness list"*. It also let `start` rewrite a finished UI-test plan with the `initial` prompt.
  - So the counter now survives a pause, and the loop cap counts every revision of one walk, across the sessions it took.
- [ ] **Which record wins, and who checks.** Add a paragraph opening **Which record wins.** It states:
  - The flow-progress ledger stays the only durable record, and it wins in both directions. A walk still in the task-plan loop is not used when `P1` is `[x]`. A walk past that loop is not used when `P1` is `[ ]`, unless its printed action carries `ledger: P1`, which is re-applied idempotently through wrapper exit 3. Cite the autonomous fork's `## Override 2 — resumability` and `## Override 5`.
  - A saved walk is checked by the fork, never by the walker, because the walker reads no plan artifact and nothing from the ledger but its run-mode block. The walk is unusable when its pending action's artifact is absent, which is the case of a draft deleted by hand.
  - A finished walk, `<escalate>` or `<terminal_handoff>`, is never acted on again. With `P3` `[ ]` the ledger's own fallback reaches `--entry convergence`.
  - A saved walk from another flow or branch is refused by `current` with exit 1.
- [ ] **Evidence and Cost.** Rewrite **Evidence.** to cite `cli/test/flow-walker-resume.test.mjs` for continuation, by its case titles, and `cli/test/flow-walker-ui-and-reentry.test.mjs` → case `(6) re-entry mid-loop restarts the counter and continues the findings folder` for what `start` still resets. That title is unchanged on this branch and is cited byte-identical; the existing **Evidence.** already quotes it, so keep that quotation as it stands. Rewrite **Cost.** to state these points:
  - A `P2` flip lost between the walker's print and the fork's flip of a finished walk is re-earned with one UI-review round rather than trusted from the saved walk.
  - The semi-autonomous fork does not continue saved walks, because it keeps no ledger to check them against. Cite `task_plan_writing_instructions_semi_autonomous.md` → its `<existing_artifact_decision>` row.
  - The step 7 mapping from **extend** to `ui_writer`, added for skeptic Finding 2, stays as the fallback, for a park at a loop's cap and for a lost state file.
- [ ] **§3 finding.** Add one bullet to `## 3. Three findings established rather than assumed`, and change the heading's count only if the heading must stay true. `Three` becomes `Four`. Grep for citers of the old heading first with `git grep -n "Three findings established"`, and repoint any hit. The bullet is **The graph format and `scripts/check-flow-graph.sh` needed no change for the two new entries.** It states these points:
  - `business_parity_review` and `ui_review` are nodes `start` already reaches, so `reachable-from-start` and `reaches-terminal` hold, and no check reads `entries`.
  - An entry that is not a node makes the walker fault at `start`, with exit 2 routed to `<escalate>`.
  - `formatVersion` stays `1`, because the set of keys did not change. Only the schema's `entries` description was restated, since a continued walk resumes without naming an entry.

**Verification:**

- `git grep -n "re-entry resets it" -- docs` prints nothing, and `git grep -n "Item 3a" -- docs plugin cli` prints only this document's heading.
- The finding count was checked before it changed: `git grep -n "Three findings established" -- ':!harness-runs'` prints nothing after the edit, or every hit it printed before has been repointed in this task.
- Every file and heading the rewritten item cites resolves in the tree as Tasks 1–6 left it. Open each one: `flow-walker.sh` → `STATE`, the core's **Continuing a saved walk.**, the autonomous fork's `## Override 2 — resumability` and `## Override 5 — pause/resume + flow-progress ledger (planning half)`, the semi-autonomous row, and both test suites' case titles.
- `git grep -n "re-entry mid-loop restarts the counter" -- cli/test docs` prints both the case `(6)` test line and this document's **Evidence.** line.
- The document still opens with its **Who reads this:** statement and its **What it owns.** paragraph, unchanged (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, the `docs/` row).
- `bash scripts/check-llms-txt.sh` exits as it did before this branch.

**Deviations from plan:**

- The §3 bullet says the schema's `entries` description *"is restated"*, but at this commit `schemas/flow-graph.schema.json` → `properties.entries.description` is unchanged; Task 8 makes that edit. The sentence is true once Task 8 lands, and was checked against `task_8_plan.md`, not against the tree.
- The **Cost.** bullet's "skeptic Finding 2" is anchored to `harness-runs/skeptic_reviews/feat_orchestrator_flow_graph_planning_pilot_skeptic_review/finding_2.md`, so the citation resolves.
- `bash scripts/test.sh` exits 1 on two gates this task does not touch: `1a plugin manifest` (the validator's unquoted `${CLAUDE_PLUGIN_ROOT}` warning on `plugin/hooks/hooks.json`) and `6a no machine paths` (the worktree's `.git` pointer file). The `llms.txt` line for this document still describes it truly: *"the decisions, the core's measured size, and what a second flow would need"*.
