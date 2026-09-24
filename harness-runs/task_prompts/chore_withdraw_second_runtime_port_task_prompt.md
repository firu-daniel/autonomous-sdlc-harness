`chore_withdraw_second_runtime_port` withdraws the roadmap item **Second-runtime reference port** (`ROADMAP.md`,
index priority 8). The item was researched, its cost was estimated from this repository's own run logs, and the
conclusion is that the harness's existing mechanism beats it. The mechanism is an orchestrator-walked graph: flow
steps as nodes, verdicts as edges, and the committed progress ledgers as durable state. This branch records that
decision and the evidence behind it, and brings every document that mentions the item into line.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

---

## The item being withdrawn

`ROADMAP.md` → `## Engines, environments and integrations` → the row **Second-runtime reference port**: *"One flow
stage — the plan-writer and plan-reviewer approval loop — reimplemented on an open-source agent runtime (LangGraph
is the suggested candidate) as a standalone service, to prove the engine seam against a runtime that is not Claude
Code before the abstraction above settles on a shape."*

## What the research found (2026-09-24)

### 1. The planning loop is already a graph

`plugin/instructions/task_plan_writing_instructions_core.md` → `## Loop` is a state machine with typed edges, and
every feature of it maps onto a LangGraph primitive:

| The harness's planning loop | LangGraph equivalent |
|---|---|
| `task-plan-writer` → business-parity gate → architecture gate → `task-plan-reviewer` → UI-test-plan loop → convergence | nodes joined by edges |
| Any gate's `verdict: FAIL` sends the plan back to the writer, and every gate runs again, because a revision made for a later gate can break an earlier one | conditional edge from each gate back to the writer node |
| One `iteration` counter shared across all gates (writer revisions, not per-gate rounds), capped at 5 | a field in the graph state, checked on the FAIL edge |
| A run-mode skip is *passed by exclusion*: the gate falls through exactly as a PASS does and is disclosed at convergence | conditional edge that routes around the node, set from the run mode at the start |
| `phases.parity: false` means the gate is *skipped*: no pass is recorded and none is reported | the node is left out when the graph is built |
| The cap fires, or the writer returns `## Questions` → `<escalate>` / `<ask>` → a live question, or a park with `question_<n>.md` that the watcher resumes once answered | `interrupt()`, then resume with `Command(resume=…)` |
| Park and resume rebuilt from the story index, the clarification answers and the flow-progress ledger (the autonomous fork's `## Override 2 — resumability`) | a checkpointer keyed by `thread_id` |

LangGraph could express all of it and nothing is missing. It also adds nothing the harness needs. What it would add
is routing enforced by code rather than by an agent following prose.

### 2. LangChain and LangGraph are one stack now, not alternatives

Since 1.0, LangChain's `create_agent` is the agent loop plus middleware, built on LangGraph. A port would have used
LangGraph for the loop and `create_agent` inside each node. Other frameworks considered, each in one line:

- **Claude Agent SDK:** the Claude Code engine itself, so it cannot prove a seam against a runtime that is not Claude Code.
- **Pydantic AI:** strongest for typed outputs, weaker at orchestration.
- **OpenAI Agents SDK:** built around handoffs between agents.
- **CrewAI:** role-based orchestration.
- **Google ADK and Microsoft Agent Framework:** tied to their vendors.
- **Mastra:** a TypeScript option.

None fit better than LangGraph did.

### 3. A checkpointer would have been a second source of truth

The harness already rebuilds progress in every phase from committed files: the flow-progress ledger under
`harness-runs/flow_progress/`, the story index's readiness entries, the review indexes, the docs checklist and the
statistics. A LangGraph checkpointer would have covered the planning phase only, in parallel with the ledger that
covers everything else. The only thing it saves is redoing the step between a writer dispatch and a reviewer dispatch
after a crash, and the current flow loses that step too.

### 4. Cost: the port moves billing onto the API and saves nothing

A LangGraph node calls the model API directly, so every run is billed per token. Today the same work runs inside a
Claude Code session and is covered by the plan. The `result` envelopes' `total_cost_usd` (Claude Code's
API-equivalent price) for the sessions in `harness-runs/autonomous_logs/*.stream.jsonl` that dispatched only planning
agents (writer and reviewers, no `layer-implementer`) were:

| Run | Planning-only sessions (API-equivalent, USD) |
|---|---|
| `feat_docs_retrieval_eval` | 28.18, 20.85 |
| `feat_arm_a_real_catalog_measurement` | 28.65 |
| `chore_plugin_prefix_command_sweep` | 41.66 |
| `feat_docs_catalog_retrieval` | 3.91, 38.91, 35.77 |

One planning phase on Opus comes to roughly **$30–80**, depending on revision rounds and parks. Most of that is
cached context being re-read, not output. A port would remove only the orchestrator's share, which is small because
the orchestrator passes paths and never reads a plan or a review. Everything else is the same writer and reviewer
work moved from the subscription onto API billing. It also adds costs that don't exist today:

- prompt caching has to be configured by hand, and a mistake multiplies the cost;
- the build-and-iterate runs during development are billed too.

### 5. What a graph runtime cannot do that the orchestrator does

- **The orchestrator has not missed a step.** The maintainer has not observed an orchestrator skip or misroute a
  flow step in any run. The routing weakness a graph runtime would fix has not shown up in practice.
- **The orchestrator's judgment has helped where a static graph has none.** Under the dispatch discipline
  (`plugin/instructions/dispatch_discipline_instructions.md` → `## Knowledge, not conclusions — the boundary` and
  the heading *The sanctioned form — the `context_notes:` line*), the orchestrator watches what each step's agent returns. When an agent drifts, or
  reports something about its work that affects the next agent, it passes that on as permitted *knowledge*. Every
  such addition is recorded under `harness-runs/dispatch_additions/`.
  - Example, `harness-runs/dispatch_additions/feat_docs_retrieval_eval.md` → `## [A · Task 14 · general · iter 0]`:
    `task_14_plan.md` named Task 5's commit body as the source of a figure, but that body was empty. The
    orchestrator's `context_notes:` line pointed the implementer at Task 5's `**Deviations from plan:**` block
    instead.
  - A static graph passes state between nodes but has nothing that notices this. Adding an LLM supervisor node to
    notice it would bring the orchestrator back, on API billing.

## What to deliver

1. **Withdraw the row.** In `ROADMAP.md`, mark **Second-runtime reference port** as withdrawn, the same way
   `Docs-catalog retrieval`'s withdrawn verdict is worded. The index is *"the intended order of outstanding work"*,
   so remove the item from `## Index` and renumber the priorities below it. The status legend (`Open` ·
   `In progress` · `Done`) has no withdrawn value: add one, or keep the row's status as prose in its description.
   Record which you chose and why. The row's text becomes a one-sentence summary of the decision plus a link to
   the decision record (2).
2. **Write the decision record.** Sections 1–5 above become a durable document, so the reasoning survives outside
   this prompt. The file naming table in `.claude/CLAUDE.md` puts a developer document at `docs/<kebab-case>.md`.
   Use the tables as given, keep the run names and the date the costs were read, and name the source of every
   figure. The sources below are the external evidence, cited with their retrieval date.
3. **Bring every mention into line.** Re-derive the set with
   `grep -rn -i "second-runtime\|reference port\|langgraph\|langchain" --exclude-dir=node_modules --exclude-dir=harness-runs --exclude-dir=.git .`.
   On 2026-09-24 it returned only the two `ROADMAP.md` lines, the index entry and the row.

## Establish, do not assume

- **Whether anything cites a roadmap priority by number**, which renumbering the index would break.
  `docs/development.md` → `## 6. The roadmap this tree defers to` uses its own numbering, separate from `ROADMAP.md`'s.
  Confirm that nothing else does.
- **Whether `ARCHITECTURE.md` needs a sentence.** Its §7 closes with *"The first real adapter is what would tell the
  two apart"*, and §9 → `### Why no candidate is named here` explains why no runtime is named. Neither mentions the
  withdrawn item. Decide whether the decision record changes what either states, and edit only if it does. The engine
  seam stays a design; this branch does not withdraw it.
- **Whether `README.md` → the *Claude-bound today* caveat still reads true.** It should, unchanged.

## Out of scope

- **Engine / provider abstraction** (the next row) stays open and its text unchanged. Its row does not depend on
  the withdrawn one.
- Any change to the planning loop, the orchestration instructions or the dispatch discipline.
- Adding a new roadmap item for replacing the orchestration prose with a declarative flow graph. That idea is
  tracked separately.

## Acceptance

1. `ROADMAP.md` no longer lists the item in `## Index`. Its row says it is withdrawn and links the decision record,
   and the priorities are renumbered without gaps.
2. The decision record exists under `docs/` and carries the graph mapping, the framework comparison, the
   checkpointer reasoning, the cost table with its sources, and both maintainer arguments with the
   `dispatch_additions` example.
3. The re-derived grep in item 3 shows no mention left that still describes the item as planned.
4. `bash scripts/run-gates.sh` prints no new failure.

## Sources (retrieved 2026-09-24)

- LangChain docs, short-term memory and checkpointers: https://docs.langchain.com/oss/python/langchain/short-term-memory
- `create_agent` as a LangGraph node: https://github.com/langchain-ai/langgraph/issues/6599
- `create_agent` with `PostgresSaver`: https://github.com/langchain-ai/langchain/issues/33962
- Framework comparisons: https://www.morphllm.com/ai-agent-framework,
  https://www.developersdigest.tech/blog/claude-agent-sdk-vs-langgraph,
  https://dev.to/gabrielanhaia/picking-an-agent-framework-in-2026-an-honest-verdict-on-six-of-them-1a6h
