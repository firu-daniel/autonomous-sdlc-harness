### Task 1 — Write the decision record `docs/second-runtime-port-decision.md`

**Goal:** Turn the task prompt's research, sections 1–5 of `## What the research found (2026-09-24)`, into a document of record under `docs/`. The reasoning behind withdrawing **Second-runtime reference port** then survives outside the prompt, with every figure's source named and every external claim dated.

**Where this task stops.** This task creates the record and nothing else. It does not edit `ROADMAP.md`, which is **Task 2**'s. Task 2 links to this file as `docs/second-runtime-port-decision.md` and applies the legend decision this record states. It does not edit `ARCHITECTURE.md`, which is **Task 3**'s, or `README.md` and `llms.txt`, which are **Task 4**'s. Those three tasks link to this exact path, so the filename is the interface and must not change. They link to the file, not to a heading inside it, so the headings are this task's to choose.

**The task prompt is the content source.** Open `harness-runs/task_prompts/chore_withdraw_second_runtime_port_task_prompt.md`. Find each anchor below by its heading or quoted text, never by line number. Tables marked *as given* are copied cell for cell.

### Targets

- `docs/second-runtime-port-decision.md` (new): the decision record. The file-name row *Developer document* in `.claude/CLAUDE.md` → `## File naming conventions` gives the `docs/<kebab-case>.md` pattern, and `docs/typecheck-key-decision.md` sets the `-decision` precedent.

**Work:**

- [ ] **Opening and the decision.**
  - An H1 (for example `# Second-runtime reference port — withdrawn`), then a `**Who reads this:**` statement saying who reads the record and what it owns. `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` requires this of a prose document under `docs/`.
  - The decision: withdrawn on 2026-09-24 by maintainer decision. The harness's existing mechanism beats the port, and that mechanism is an orchestrator-walked graph: flow steps as nodes, verdicts as edges, and the committed progress ledgers as durable state.
  - A short **what this does not withdraw** paragraph. The engine seam stays a design (link [`ARCHITECTURE.md`](../ARCHITECTURE.md) → `## 7. The seam: what an adapter would have to carry`). The **Engine / provider abstraction** roadmap row stays open and unchanged, and it never depended on the withdrawn row. Nothing changes in the planning loop, the orchestration instructions or the dispatch discipline.
  - Do **not** mention the separately tracked idea of replacing the orchestration prose with a declarative flow graph (`harness-runs/lessons.md` → *"never write the change into other documents as pending work"*).
- [ ] **Section: the planning loop is already a graph** (prompt §1).
  - Copy the two-column table *as given*.
  - Cite its sources as links: [`plugin/instructions/task_plan_writing_instructions_core.md`](../plugin/instructions/task_plan_writing_instructions_core.md) → `## Loop`, and, for the park-and-resume row, `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`.
  - Keep the prompt's conclusion: LangGraph could express all of it and nothing is missing, but it adds nothing the harness needs, and what it would add is routing enforced by code rather than by an agent following prose.
- [ ] **Section: LangChain and LangGraph are one stack** (§2), then **Section: a checkpointer would be a second source of truth** (§3).
  - §2 keeps the `create_agent` sentence and the seven-framework list *as given*, one line each, ending with *"None fit better than LangGraph did."*
  - Say that these are reads of published documentation and comparisons, retrieved 2026-09-24 and listed in the sources section below, not audits of any framework's source.
  - §3 names the durable files the harness already resumes from: the flow-progress ledger under the run-artifact tree (`stateDir`, which is `harness-runs/` here, so `harness-runs/flow_progress/`), the story index's readiness entries, the review indexes, the docs checklist and the statistics. It keeps the prompt's point that a checkpointer would cover the planning phase only, and that the one step it saves is lost by the current flow too.
- [ ] **Section: cost** (§4).
  - Copy the four-run table *as given*: run names, figures, and the header *Planning-only sessions (API-equivalent, USD)*.
  - State the source of every figure in prose:
    - the `total_cost_usd` field of each session's `result` envelope, which is Claude Code's API-equivalent price and not an amount billed;
    - the file glob `harness-runs/autonomous_logs/*.stream.jsonl`;
    - the selection: sessions that dispatched only planning agents (the writer and the reviewers, no `layer-implementer`);
    - the read date, 2026-09-24.
  - Put the read command in a fenced block, one command on its own line (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*):

    ```
    jq -c 'select(.type=="result") | .total_cost_usd' harness-runs/autonomous_logs/<run>.stream.jsonl
    ```

    The plan writer ran this command and it reproduced `41.66` for `chore_plugin_prefix_command_sweep` and `28.65` for `feat_arm_a_real_catalog_measurement` (rounded to cents). Do not re-run it: the logs are not in this worktree.
  - State plainly that the logs are git-ignored (`.gitignore` → `harness-runs/autonomous_logs/*`) and exist only on the machine that ran the sessions. State also that `scripts/publish-main.sh` removes `harness-runs/` from the published `main`, so the figures are recorded as read and cannot be re-checked from a clone. Cite every `harness-runs/` path in this file as a code span, never as a link.
  - Derive the **$30–80 per planning phase** range from the table: a phase is the sum of one run's planning-only sessions, which gives 28.65, 41.66, 49.03 (28.18 + 20.85) and 78.59 (3.91 + 38.91 + 35.77). State that sum in the text.
  - Keep the rest of the prompt's reasoning: most of the cost is cached context being re-read; a port removes only the orchestrator's small share; everything else moves from the subscription onto API billing. List the two new costs, hand-configured prompt caching and billed development runs.
- [ ] **Section: what a graph runtime cannot do** (§5), then **How the roadmap records it**, then **Sources**.
  - §5 keeps both maintainer arguments. Word the first as the maintainer's observation (*has not observed*), never as a count or a measurement.
  - The second cites [`plugin/instructions/dispatch_discipline_instructions.md`](../plugin/instructions/dispatch_discipline_instructions.md) → `## Knowledge, not conclusions — the boundary` and `## The sanctioned form`, using that file's own short form for the `context_notes:` heading. It also names the record `harness-runs/dispatch_additions/` and carries the example exactly as the prompt gives it: `harness-runs/dispatch_additions/feat_docs_retrieval_eval.md` → `## [A · Task 14 · general · iter 0]`, the empty Task 5 commit body, and the `context_notes:` line that pointed to Task 5's `**Deviations from plan:**` block. Close with the prompt's static-graph and LLM-supervisor sentences.
  - **How the roadmap records it:** `ROADMAP.md`'s status legend gains `Withdrawn`, and the row's status becomes `Withdrawn`. Give the reason. The index lists only outstanding work, and until now the only rows missing from it were `Done` ones. A row missing from the index while its status says `Open` would contradict itself, and `Done` would be false. The index entry is removed and the priorities below it are renumbered. Write the citation sentence to match what the story index's `## Scope register` established (entries B and F, rows 23–50): *"No citation elsewhere in the tree resolves against a `ROADMAP.md` priority number, so the renumbering breaks none. The tree's roadmap-item numbers are listed in [`docs/development.md`](development.md) → `## 6. The roadmap this tree defers to`, a separate numbering."* Do not claim that every cited number resolves against that legend: `evals/README.md` → *"roadmap item 8"* resolves against neither numbering (register row 24), and this record neither repeats nor repairs that citation.
  - **Sources (retrieved 2026-09-24):** the six URLs from the prompt's `## Sources (retrieved 2026-09-24)`, each with the one-line label the prompt gives it.

**Verification:**

- The acceptance criterion 2 checklist, read against the written file. It must contain the graph-mapping table, the framework comparison, the checkpointer reasoning, the cost table with its field, glob, selection, read date and command, both maintainer arguments, and the `dispatch_additions` example.
- `grep -n "harness-runs/" docs/second-runtime-port-decision.md`: every hit is inside a code span, and none is inside a `](` link target. A link there would not resolve on the published `main`.
- `grep -n -E "/Users/|/home/|/private/" docs/second-runtime-port-decision.md` prints nothing: no machine path, so gate 6a gains no hit.
- `grep -n -i -E "flow graph|declarative" docs/second-runtime-port-decision.md` shows no sentence that proposes or schedules replacing the orchestration prose.
- Every relative link in the file (`../ARCHITECTURE.md`, `../plugin/instructions/…`, `development.md`) resolves from `docs/`: `ls` each target from the checkout root.
- `bash scripts/run-gates.sh`, run without a pipe. Each `FAIL` line must be a gate whose printed output names no file this task created. Gate 6a is red by design in a self-adopted checkout, and gate 1 is `BLOCKED` when `claude` is not on `PATH`.
