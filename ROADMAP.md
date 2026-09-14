# Roadmap

What is planned beyond the current release. For what ships today, see [`README.md`](README.md).

Nothing here is a schedule or a promise. Items are grouped by area, not ordered by date. Where a feature already has a declared config key with nothing behind it yet, the description says **seam declared**.

**Status:** `Open` · `In progress` · `Done`

## Flow and orchestration

| Feature | What it is | Status |
|---|---|---|
| Ultra-fast mode | A reduced flow — plan, plan review, implementation, branch review, review fixes — with an optional duration flag. When a duration is given, the orchestrator splits it across phases (e.g. 40% planning, 20% implementation, 40% branch review and fixes) and gives each agent a time window to return in. | Open |
| Parallel dispatch in waves | Planning and implementation agents with no dependency on each other run in parallel batches instead of one at a time. | Open |
| Task researcher | A pre-planning agent: checks feasibility, asks clarifying questions at minute one, and flags tasks too big for one plan. | Open |
| Multi-plan programs | A task too big for one plan becomes an ordered chain of plans, each picked up from the inbox when the previous one finishes. | Open |
| Cross-repo tasks | One task split into per-repository plans with an explicit contract between them. | Open |
| Watcher settings surface | A supported way to change the watcher's tunables instead of hand-editing a file. | Open |

## Planning artifacts and reporting

| Feature | What it is | Status |
|---|---|---|
| `branch-summary.md` | At the end of the flow, write the Done summary the supervised flow already gives — including token consumption and the API-equivalent price. | Open |
| Task breakdown and estimates file | The story plan exported as a task list with per-task and total estimates, in the shape project managers track. | Open |
| User flow diagram | A writer agent draws, and a reviewer agent checks, the user flow the branch implements. | Open |
| Business (data) flow diagram | A diagram of how data moves through the change. | Open |
| Trace export | Per-run logs converted to OpenTelemetry GenAI spans or Langfuse traces. | Open |

## Quality and testing

| Feature | What it is | Status |
|---|---|---|
| Integration tests | The pipeline writes integration tests for the change — and widget/component tests where the stack has them. | Open |
| Regression tests | The pipeline writes regression tests for the behaviour a branch fixes or changes. | Open |
| Golden-task eval suite | A frozen set of task prompts with rubrics, re-run whenever the harness's own instructions change, graded per task class. `evals/` holds one provisional case. | Open |
| Fix-plan structure review | A structural reviewer for the user-review fix-plan flow, matching the one the task plan already has. | Open |
| Performance and security review | Review coverage for performance and security findings; shape not decided. | Open |
| Line-number citations never block | Review findings anchor on symbols; a stale line number in a citation is no longer a blocking finding. | In progress |

## Engines, environments and integrations

| Feature | What it is | Status |
|---|---|---|
| Engine seam design | Where a second agent runtime or model plugs in, written up in [`ARCHITECTURE.md`](ARCHITECTURE.md). | Done |
| Engine / provider abstraction | The engine seam built and proven against at least one open-source runtime, with runtime and model as separate settings. | Open |
| Deploy to a test environment | Deploy the branch through a user-provided script, or a light CI/CD step that respects protected branches and the never-merge rule. | Open |
| Cloud / CI execution | Runs as a chain of bounded CI jobs that resume from the ledger, with draft-PR output. Seam declared (`forge`). | Open |
| Mobile QA drivers | Maestro and mobile-MCP variants of the QA tester. Seam declared (`qa.driver`). | Open |
| Design-source config key | The `design.source` key (`figma` \| `penpot` \| `none`) declared in the config schema. | Done |
| Design-source ingestion | Plans cite design tokens and frames, a reviewer checks token-level conformance, and QA gains a visual reference. Seam declared (`design.source`). | Open |
| MCP servers | A QA server (reserve test users, seed fixtures) and a ledger server (lessons, observations, statistics). | Open |
| `llms.txt` | An LLM-readable summary of the project at the repository root. | Open |

## Evidence and adoption

| Feature | What it is | Status |
|---|---|---|
| First published eval result | Run the `plan-shape` case in both setups — with the plugin and without — and publish the result, even if rough. The case is provisional and has never been run. | Open |
| Outcome-graded eval case | At least one eval case on a non-toy task, graded on outcome (tests passing, review findings, post-review statistics) rather than only on whether the plan shape appears. | Open |
| Second end-to-end capture | A captured run on a realistic repository, with a remote and more phases enabled. The shipped capture is one run on the example app with parity and docs off; every push failed (no remote) and plan meta-review took three rounds. | Open |
| Interactive session vs harness run | One plain interactive session against one harness run, on a simple feature and on a complex one, compared on token cost, session duration and branch quality. Quality is measured by running the harness's branch review over both branches, so the interactive session's gaps — and the harness's own weak spots — show up the same way. Numbers stated in the README. | Open |
| `init` warns when there is no remote | Without a remote, an in-place run reports done with every commit left local. `doctor` fails on it and the Done summary flags it; `init` should warn at setup too. | Open |

## Security and containment

| Feature | What it is | Status |
|---|---|---|
| OS-level sandbox in the autonomous profile | `init` adds Claude Code's native sandbox (Seatbelt on macOS, bubblewrap on Linux/WSL2) to `settings.autonomous.json`, so the guard also holds for what allowed commands execute, with a network domain allowlist. Sets `sandbox.failIfUnavailable: true` so an unattended run refuses to start instead of silently running unsandboxed. | Open |
| `doctor` sandbox checks | Check sandbox prerequisites (bubblewrap and socat on Linux) and document the domain allowlist that package registries and the QA dev server need, plus tools known to break under it (docker, watchman; TLS in `gh`/`terraform` under Seatbelt). | Open |
| `doctor` flags unverified branch protection | Warn that forge-side branch protection has not been verified. Setting it up stays the user's job; its absence should be visible. | Open |

## Documentation

| Feature | What it is | Status |
|---|---|---|
| README summary and checklist | Open with three plain lines — what it is, what you get — and a five-step checklist: install, `init`, `/harness-analyze` (in Claude Code, not the terminal), `doctor`, start the daemon. Caveats move below it. | Open |
| Compact the README | Cut the README to what a new reader needs: short sentences, one idea per paragraph, and the long measured caveats moved into the docs they belong to, linked rather than inlined. | Open |
| Threat model | Name what the guards protect against (agent mistakes, protected branches — via the deny floor, `git push` on ask, per-agent tool allowlists and the `PreToolUse` guards) and what they don't: allowed commands such as tests, builds and the dev server run agent-written code with the user's full rights. Point to the sandbox or a container, and note the sandbox covers shell commands, not MCP servers or hooks. | Open |

---

Use cases and feedback are welcome as issues.
