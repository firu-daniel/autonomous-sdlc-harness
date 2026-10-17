# Orchestrator cost measurement

**Who reads this:** the maintainer deciding whether the autonomous flows keep an in-session orchestrator or move to a script-driven graph whose nodes are separate sessions, and the planner of any branch that changes the committer, the dispatch-additions record, or how a node's agent is launched. It owns three measurements taken on 2026-10-16 and the conclusions drawn from them. It owns no design choice. The script-driven planning pilot is a separate task, and its result belongs to that branch.

It builds on [`copilot-foundry-research.md`](copilot-foundry-research.md) → `### 5.4 What a harness run costs at API rates`, which establishes what `total_cost_usd` is and that cache reads are the largest part of a run's cost. It revisits one premise of [`second-runtime-port-decision.md`](second-runtime-port-decision.md) → `## 4. Cost`.

---

## The data

- **This repository:** the 11 autonomous runs whose stream logs are in `harness-runs/autonomous_logs/*.stream.jsonl`, all on Opus 5.5. A twelfth log, `chore_sbx_flow_probe`, dispatched nothing and is left out.
- **A private adopter's repository:** the 29 most recent stream logs that end in a `result` event. A thirtieth, a session the watcher killed, has none and is left out.

**Attributing a model call to an agent.** Every `assistant` event carries `message.usage`. The same message is repeated once per content block, so each message is counted once, by `message.id`. An event with no `parent_tool_use_id` is the orchestrator's. An event with one belongs to the agent dispatched by the `Agent` tool call of that id, named by its `input.subagent_type`. Context size per call is `cache_read_input_tokens + cache_creation_input_tokens + input_tokens`.

---

## 1. Which agents read the cached context

Share of all cache-read and cache-write tokens, by agent. These are the main rows; the remainder is spread across agents under 1% each.

**This repository, 11 runs, 1.31 B cache-read tokens:**

| Agent | Dispatches | Calls | Cache reads | Cache writes | Mean context | Max context |
|---|---|---|---|---|---|---|
| Orchestrator | — | 2,265 | **39.5%** | 8.9% | 231k | 408k |
| task-plan-writer | 41 | 1,257 | 15.6% | 13.5% | 168k | 457k |
| task-plan-reviewer | 33 | 1,383 | 15.3% | 14.6% | 150k | 280k |
| layer-implementer | 211 | 2,956 | 12.4% | 24.9% | 59k | 184k |
| branch-reviewer | 14 | 472 | 5.1% | 5.5% | 146k | 288k |
| architecture-reviewer | 54 | 711 | 4.4% | 15.2% | 91k | 174k |
| skeptic-reviewer | 11 | 434 | 3.9% | 4.4% | 121k | 256k |
| committer | 221 | 1,185 | 2.5% | 7.9% | 31k | 47k |
| review-plan-reviewer | 21 | 273 | 1.1% | 4.0% | 60k | 118k |

**The adopter's repository, 29 runs, 5.32 B cache-read tokens:** the orchestrator 28.7% of reads (mean context 212k, max 456k); the implementer 25.8%; the plan reviewer 14.7% and the plan writer 13.3%; the branch and skeptic reviewers 8.8%; the committer 2.1% of reads but 9.7% of writes, across 595 dispatches.

**What it shows.**

- **The orchestrator is the largest single reader in both sets.** It passes only paths, but every agent's return, every walker printout and every ledger read stays in its context, and each later turn re-reads all of it.
- **The plan writer and reviewer together read about as much again** — 30.9% here, 28.0% at the adopter — over roughly four rounds per run.
- **The committer is cheap per call but not per dispatch.** It is dispatched about 20 times per run, and each dispatch pays a fresh cache write and a round trip through the orchestrator.

**What this changes in the record.** [`second-runtime-port-decision.md`](second-runtime-port-decision.md) → `## 4. Cost` held that a port "would remove only the orchestrator's share, which is small because the orchestrator passes paths and never reads a plan or a review". That was measured on planning-only sessions, and §2 below shows why: planning is where the orchestrator is still small. Over a whole run, its share is the largest of any participant. The decision's other ground, the orchestrator's judgement (its `## 5`), is not affected by this measurement. §3 bears on it.

---

## 2. Where the orchestrator's reads accrue, by phase

Each orchestrator call is attributed to the phase of the role it last dispatched:

- planning — the plan and UI-test-plan writers and reviewers;
- unit loop — implementers, layer reviewers and the committer;
- branch reviews — the branch, skeptic and review-plan reviewers;
- QA, Run gates, docs, statistics and close — by their agents.

The architecture and business-parity reviewers inherit the current phase, because they run in more than one. Calls before the first dispatch are setup.

| Phase | Calls (here) | Share of orchestrator reads (here) | Mean context (here) | Share (adopter) | Mean context (adopter) |
|---|---|---|---|---|---|
| Setup | 164 | 2.8% | 87k | 2.7% | 81k |
| Planning | 544 | 14.7% | 140k | 13.1% | 130k |
| **Unit loop** | 1,270 | **65.4%** | 267k | **64.4%** | 239k |
| Branch reviews and fixes | 140 | 7.6% | 282k | 7.9% | 242k |
| QA | — | — | — | 1.1% | 343k |
| Run gates | 8 | 0.5% | 345k | — | — |
| Docs | — | — | — | 3.0% | 382k |
| Statistics and close | 139 | 9.0% | 334k | 7.8% | 286k |

**What it shows.**

- **About two thirds of the orchestrator's reads accrue in the unit loop.** By then its context has grown past 200k, and the loop dispatches the most often: an implementer, a reviewer where per-unit review is on, and a committer per unit.
- **The closing phases are small in calls but expensive per call,** because they run on the largest context of the run.
- **Planning is the smallest real phase.** A change confined to planning removes at most ~15% of the orchestrator's reads; the unit loop is where an orchestrator-free driver would pay.
- The attribution is a heuristic. A call that composes the next phase's first dispatch is counted to the previous phase. The proportions are robust to that; the boundaries are not exact.

---

## 3. How often the orchestrator adds knowledge to a dispatch

[`plugin/instructions/dispatch_discipline_instructions.md`](../plugin/instructions/dispatch_discipline_instructions.md) permits one addition to a dispatch prompt, a trailing `context_notes:` line, and records every addition under `<state_dir>/dispatch_additions/<branch>.md`.

**Method.** Every `Agent` tool call in the orchestrator's own events was counted once by its tool-use id, and each whose `input.prompt` contains `context_notes:` was counted as carrying an addition.

| Set | Dispatches | Carrying `context_notes:` |
|---|---|---|
| This repository, 11 runs | 619 | **1 (0.2%)** |
| The adopter's repository, 29 runs | 1,665 | 85 (5.1%): 58 implementer, 23 committer, 4 planning and review |

**The one addition in this repository** is `harness-runs/dispatch_additions/fix_forge_run_control_gate12_findings.md` → `## [A · Task 12 · cli · iter 0]`. Task 11's implementer changed a behaviour that an existing test in Task 12's scope asserted. The orchestrator told Task 12's implementer, citing **Task 11's per-task file's `**Deviations from plan:**` note** as the source. That fact was on disk in a file the receiving agent could have been told to read.

**The ledger agrees.** Across the history of `harness-runs/dispatch_additions/`, 31 blocks were written over 11 branches. Most came before the discipline settled, 12 of them on one branch on 2026-09-22. Every branch since 2026-10-01 has at most two.

**Inference:** in this repository, additions are now rare enough that dropping the mechanism costs little. The case it covered — one unit's deviation affecting a later unit — is better served by the later unit reading the earlier units' recorded deviations than by an orchestrator remembering them. That holds for any later unit, not only the next one. The adopter's higher rate comes from older, project-local agent definitions and is not this harness's current behaviour.

---

## 4. Does a session's main agent keep its `tools:` allowlist?

A script that runs each graph node as its own `claude -p` session, naming the agent with `--agent`, relies on that session enforcing the agent's `tools:` allowlist exactly as a subagent dispatch does. That property is what `.claude/CLAUDE.md` → *Agent authoring rules* rests on.

**Documented.** https://code.claude.com/docs/en/sub-agents, retrieved 2026-10-16:
- "Pass `--agent <name>` to start a session where the main thread itself takes on that subagent's tool restrictions and model."
- A plugin agent may be named by its scoped name, `claude --agent my-plugin:security-reviewer`.
- The agent's `mcpServers` and `hooks` frontmatter apply in this mode too. `CLAUDE.md` still loads.

The CLI reference (https://code.claude.com/docs/en/cli-reference) says `--tools` "doesn't affect MCP tools; to deny those too, use `--disallowedTools "mcp__*"`."

**Measured.** Claude Code 2.1.301, in a throwaway git repository outside this checkout. Every run used `--model haiku --output-format stream-json --verbose --permission-mode bypassPermissions` and a two-to-four-turn cap. Each prompt asked the agent to create a file with `Write` and to run or list something with a tool its allowlist lacks.

| Run | Agent and extra flags | `system`/`init` tools | Outcome |
|---|---|---|---|
| Project agent | `--agent limited` (`tools: Read`) | `['Read']` | No tool call; no file. The model: "The **Write** tool and the **Bash** tool are both missing from my available tools." |
| Plugin agent | `--plugin-dir <this repo>/plugin --agent autonomous-sdlc-harness:committer` | `['Bash', 'Read', 'Edit']` — the committer's allowlist | No tool call; no file. The model: "I can't complete either step because the Write and Glob tools are not available to me." |
| Control | no `--agent` | the full default set | `Write` and `Bash` both ran; the file exists |
| Widening attempt | `--agent limited --tools "Read,Write"` | `['Read']` | not widened |
| Widening attempt | `--agent limited --allowedTools "Write"` | `['Read']` | not widened |
| Unknown agent | `--agent nosuchagent` | — | stderr "`--agent 'nosuchagent' not found. Available agents: …`", **exit 0**, empty stdout, no model call |

**Verdict:** enforced, for project and plugin agents alike. `--tools`, `--allowedTools` and `bypassPermissions` do not reopen a withheld tool.

**Three things a launcher must handle:**
- **MCP tools are not shown to be excluded.** No `mcp__*` tool appeared in any run, the control included, so whether `tools:` strips an MCP server's tools from the main thread is untested. Until a run with a real `--mcp-config` server shows the committer without the browser tools and the qa-tester with them, a non-QA node can pass `--disallowedTools "mcp__*"` or `--strict-mcp-config`.
- **An unknown agent name fails silently,** with exit 0. The launcher must confirm the agent resolved: check stderr, or check that the `init` event's tools match the agent file.
- **The agent set comes from the environment.** The `init` event listed user-level agents and an installed copy of the plugin beside the one passed with `--plugin-dir`. A launcher pins the plugin source, and uses the scoped name, so each node resolves the definition intended.

---

## 5. What the measurements support

- **Committer as a script.** It removes ~8–10% of cache writes and about 20 orchestrator round trips per run, and its job is deterministic.
- **A leaner plan loop.** The writer and reviewer read ~30% of all cached context over about four rounds per run. Fewer rounds is the largest lever outside the orchestrator.
- **Drop dispatch additions.** At 1 in 619 dispatches, the mechanism and its record cost more than they return here. Replace it with an instruction that an implementer reads the earlier units' `**Deviations from plan:**` notes in its story before it starts.
- **An orchestrator-free driver, piloted on planning, judged on the unit loop.** Planning is the only flow with a declared graph, so it is the cheap place to prove the mechanism. But it holds ~15% of the orchestrator's reads; the unit loop holds ~65%. The pilot's own cost comparison will show a small saving, and that is expected, not a verdict on the approach.

**To repeat these measurements**, attribute each run's model calls as `## The data` describes, over the same logs or newer ones. A run measured after any of these changes is comparable to the figures here only if its model and effort match.
