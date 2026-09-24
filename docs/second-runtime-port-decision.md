# Second-runtime reference port — withdrawn

**Who reads this:** whoever proposes porting a flow stage onto another agent runtime, or reopens the withdrawn `ROADMAP.md` row **Second-runtime reference port**. This record owns the decision to withdraw that row and the evidence behind it. It changes no behaviour.

**The decision.** The row was withdrawn on 2026-09-24 by maintainer decision. It proposed reimplementing one flow stage, the plan-writer and plan-reviewer approval loop, on an open-source agent runtime (LangGraph was the suggested one) as a standalone service. The harness's existing mechanism beats that port. The mechanism is an orchestrator-walked graph: flow steps are the nodes, verdicts are the edges, and the committed progress ledgers are the durable state.

**What this does not withdraw.** The engine seam stays a design ([`ARCHITECTURE.md`](../ARCHITECTURE.md) → `## 7. The seam: what an adapter would have to carry`). The **Engine / provider abstraction** roadmap row stays open and unchanged, and it never depended on the withdrawn row. Nothing changes in the planning loop, the orchestration instructions or the dispatch discipline.

---

## 1. The planning loop is already a graph

[`plugin/instructions/task_plan_writing_instructions_core.md`](../plugin/instructions/task_plan_writing_instructions_core.md) → `## Loop` is a state machine with typed edges, and every feature of it maps onto a LangGraph primitive. The park-and-resume row is sourced from `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`, which resumes from the story index and the clarification answers, and `## Override 5 — pause/resume + flow-progress ledger (planning half)`, which resumes from the flow-progress ledger.

| The harness's planning loop | LangGraph equivalent |
|---|---|
| `task-plan-writer` → business-parity gate → architecture gate → `task-plan-reviewer` → UI-test-plan loop → convergence | nodes joined by edges |
| Any gate's `verdict: FAIL` sends the plan back to the writer, and every gate runs again, because a revision made for a later gate can break an earlier one | conditional edge from each gate back to the writer node |
| One `iteration` counter shared across all gates (writer revisions, not per-gate rounds), capped at 5 | a field in the graph state, checked on the FAIL edge |
| A run-mode skip is *passed by exclusion*: the gate falls through exactly as a PASS does and is disclosed at convergence | conditional edge that routes around the node, set from the run mode at the start |
| `phases.parity: false` means the gate is *skipped*: no pass is recorded and none is reported | the node is left out when the graph is built |
| The cap fires, or the writer returns `## Questions` → `<escalate>` / `<ask>` → a live question, or a park with `question_<n>.md` that the watcher resumes once answered | `interrupt()`, then resume with `Command(resume=…)` |
| Park and resume rebuilt from the story index, the clarification answers and the flow-progress ledger (the autonomous fork's `## Override 2 — resumability`) | a checkpointer keyed by `thread_id` |

LangGraph could express all of it, and nothing is missing. It also adds nothing the harness needs. What it would add is routing enforced by code rather than by an agent following prose.

## 2. LangChain and LangGraph are one stack, not alternatives

Since 1.0, LangChain's `create_agent` is the agent loop plus middleware, built on LangGraph. A port would have used LangGraph for the loop and `create_agent` inside each node. Other frameworks considered, each in one line:

- **Claude Agent SDK:** the Claude Code engine itself, so it cannot prove a seam against a runtime that is not Claude Code.
- **Pydantic AI:** strongest for typed outputs, weaker at orchestration.
- **OpenAI Agents SDK:** built around handoffs between agents.
- **CrewAI:** role-based orchestration.
- **Google ADK and Microsoft Agent Framework:** tied to their vendors.
- **Mastra:** a TypeScript option.

None fit better than LangGraph did.

These are reads of published documentation and third-party comparisons, retrieved 2026-09-24 and listed under `## Sources` below. They are not audits of any framework's source.

## 3. A checkpointer would be a second source of truth

The harness already rebuilds progress in every phase from committed files: the flow-progress ledger under the run-artifact tree (`stateDir`, which is `harness-runs/` in this repository, so `harness-runs/flow_progress/`), the story index's readiness entries, the review indexes, the docs checklist and the statistics. A LangGraph checkpointer would cover the planning phase only, in parallel with the ledger that covers everything else. The one thing it saves is redoing the step between a writer dispatch and a reviewer dispatch after a crash, and the current flow loses that step too.

## 4. Cost: the port moves billing onto the API and saves nothing

A LangGraph node calls the model API directly, so every run is billed per token. Today the same work runs inside a Claude Code session and is covered by the subscription.

| Run | Planning-only sessions (API-equivalent, USD) |
|---|---|
| `feat_docs_retrieval_eval` | 28.18, 20.85 |
| `feat_arm_a_real_catalog_measurement` | 28.65 |
| `chore_plugin_prefix_command_sweep` | 41.66 |
| `feat_docs_catalog_retrieval` | 3.91, 38.91, 35.77 |

**Where every figure comes from.** Each figure is the `total_cost_usd` field of one session's `result` envelope. That field is Claude Code's API-equivalent price, not an amount billed. The sessions are those in `harness-runs/autonomous_logs/*.stream.jsonl` that dispatched only planning agents: the writer and the reviewers, and no `layer-implementer`. Each run's log holds one `result` envelope per session. The figures were read on 2026-09-24, one run log at a time. The command keeps a session only when it dispatched at least one agent and every agent it dispatched was a planning writer or reviewer. It then prints that session's `total_cost_usd`:

```
jq -s -c 'group_by(.session_id) | map({cost: ([.[] | select(.type=="result") | .total_cost_usd] | first), agents: ([.[] | select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .input.subagent_type? // empty] | unique)}) | map(select(.cost != null and .agents != [] and all(.agents[]; test("(task-plan|ui-tests-plan)-(writer|reviewer)$|(architecture|business-parity)-reviewer$")))) | map(.cost)' harness-runs/autonomous_logs/<run>.stream.jsonl
```

**The figures cannot be re-checked from a clone.** The logs are git-ignored (`.gitignore` → `harness-runs/autonomous_logs/*`) and exist only on the machine that ran the sessions, and `scripts/publish-main.sh` removes `harness-runs/` from the published `main`. The figures are recorded here as read.

**One planning phase on Opus comes to roughly $30–80.** A phase is the sum of one run's planning-only sessions: 28.65, 41.66, 49.03 (28.18 + 20.85) and 78.59 (3.91 + 38.91 + 35.77). The spread follows the revision rounds and parks. Most of that cost is cached context being re-read, not output. A port would remove only the orchestrator's share, which is small because the orchestrator passes paths and never reads a plan or a review. Everything else is the same writer and reviewer work, moved from the subscription onto API billing. The port also adds two costs that do not exist today:

- prompt caching has to be configured by hand, and a mistake multiplies the cost;
- the build-and-iterate runs during development are billed too.

## 5. What a graph runtime cannot do that the orchestrator does

- **The orchestrator has not missed a step.** The maintainer has not observed an orchestrator skip or misroute a flow step in any run. The routing weakness a graph runtime would fix has not shown up in practice.
- **The orchestrator's judgment has helped where a static graph has none.** Under the dispatch discipline ([`plugin/instructions/dispatch_discipline_instructions.md`](../plugin/instructions/dispatch_discipline_instructions.md) → `## Knowledge, not conclusions — the boundary` and `## The sanctioned form`), the orchestrator watches what each step's agent returns. When an agent drifts, or reports something about its work that affects the next agent, the orchestrator passes that on as permitted *knowledge*. Every such addition is recorded under `harness-runs/dispatch_additions/`. That directory is in this repository's run-artifact tree, which `scripts/publish-main.sh` removes from the published `main`, so the record and the example below are not in the published tree.
  - Example, `harness-runs/dispatch_additions/feat_docs_retrieval_eval.md` → `## [A · Task 14 · general · iter 0]`: `task_14_plan.md` named Task 5's commit body as the source of a figure, but that body was empty. The orchestrator's `context_notes:` line pointed the implementer at Task 5's `**Deviations from plan:**` block instead.
  - A static graph passes state between nodes but has nothing that notices this. Adding an LLM supervisor node to notice it would bring the orchestrator back, on API billing.

## 6. How the roadmap records it

`ROADMAP.md`'s status legend gains `Withdrawn`, and the row's status becomes `Withdrawn`. The index lists only outstanding work, and until now the only rows missing from it were `Done` ones. A row missing from the index while its status says `Open` would contradict itself, and `Done` would be false. The index entry is removed and the priorities below it are renumbered.

No citation elsewhere in the tree resolves against a `ROADMAP.md` priority number, so the renumbering breaks none. The tree's roadmap-item numbers are listed in [`docs/development.md`](development.md) → `## 6. The roadmap this tree defers to`, a separate numbering.

## Sources (retrieved 2026-09-24)

- LangChain docs, short-term memory and checkpointers: https://docs.langchain.com/oss/python/langchain/short-term-memory
- `create_agent` as a LangGraph node: https://github.com/langchain-ai/langgraph/issues/6599
- `create_agent` with `PostgresSaver`: https://github.com/langchain-ai/langchain/issues/33962
- Framework comparison: https://www.morphllm.com/ai-agent-framework
- Framework comparison: https://www.developersdigest.tech/blog/claude-agent-sdk-vs-langgraph
- Framework comparison: https://dev.to/gabrielanhaia/picking-an-agent-framework-in-2026-an-honest-verdict-on-six-of-them-1a6h
