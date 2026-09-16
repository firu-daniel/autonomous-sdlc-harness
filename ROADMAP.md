# Roadmap

What is planned beyond the current release. For what ships today, see [`README.md`](README.md).

Nothing here is a schedule or a promise. **The index below is the intended order of outstanding work**; the tables under it group every item by area, carry the detail and the status, and include what is already done. Each index entry links to the section its row lives in. Where a feature already has a declared config key with nothing behind it yet, the description says **seam declared**.

**Status:** `Open` · `In progress` · `Done`

## Index

| Priority | Feature |
|---|---|
| 1 | [README summary and checklist](#documentation) |
| 2 | [Compact the README](#documentation) |
| 3 | [Docs-catalog retrieval](#engines-environments-and-integrations) |
| 4 | [Citation groundedness gate](#quality-and-testing) |
| 5 | [Structured agent outputs](#quality-and-testing) |
| 6 | [Golden-task eval suite](#quality-and-testing) |
| 7 | [Trace export](#planning-artifacts-and-reporting) |
| 8 | [Cost per feature](#planning-artifacts-and-reporting) |
| 9 | [Latency tracking](#planning-artifacts-and-reporting) |
| 10 | [Second-runtime reference port](#engines-environments-and-integrations) |
| 11 | [Engine / provider abstraction](#engines-environments-and-integrations) |
| 12 | [Model-change drift gate](#quality-and-testing) |
| 13 | [Budget governor](#engines-environments-and-integrations) |
| 14 | [Cloud / CI execution](#engines-environments-and-integrations) |
| 15 | [First published eval result](#evidence-and-adoption) |
| 16 | [Outcome-graded eval case](#evidence-and-adoption) |
| 17 | [Measuring the lessons ledger](#evidence-and-adoption) |
| 18 | [MCP servers](#engines-environments-and-integrations) |
| 19 | [Ultra-fast mode](#flow-and-orchestration) |
| 20 | [Parallel dispatch in waves](#flow-and-orchestration) |
| 21 | [Task researcher](#flow-and-orchestration) |
| 22 | [Multi-plan programs](#flow-and-orchestration) |
| 23 | [Cross-repo tasks](#flow-and-orchestration) |
| 24 | [Watcher settings surface](#flow-and-orchestration) |
| 25 | [`branch-summary.md`](#planning-artifacts-and-reporting) |
| 26 | [Task breakdown and estimates file](#planning-artifacts-and-reporting) |
| 27 | [User flow diagram](#planning-artifacts-and-reporting) |
| 28 | [Business (data) flow diagram](#planning-artifacts-and-reporting) |
| 29 | [Integration tests](#quality-and-testing) |
| 30 | [Regression tests](#quality-and-testing) |
| 31 | [Fix-plan structure review](#quality-and-testing) |
| 32 | [Performance and security review](#quality-and-testing) |
| 33 | [Deploy to a test environment](#engines-environments-and-integrations) |
| 34 | [Cloud QA](#engines-environments-and-integrations) |
| 35 | [Mobile QA drivers](#engines-environments-and-integrations) |
| 36 | [Design-source ingestion](#engines-environments-and-integrations) |
| 37 | [`llms.txt`](#engines-environments-and-integrations) |
| 38 | [Second end-to-end capture](#evidence-and-adoption) |
| 39 | [Interactive session vs harness run](#evidence-and-adoption) |
| 40 | [`init` warns when there is no remote](#evidence-and-adoption) |
| 41 | [OS-level sandbox in the autonomous profile](#security-and-containment) |
| 42 | [`doctor` sandbox checks](#security-and-containment) |
| 43 | [`doctor` flags unverified branch protection](#security-and-containment) |
| 44 | [Threat model](#documentation) |
| 45 | [Per-run base branch](#flow-and-orchestration) |
| 46 | [Suggested protected branches at `init`](#security-and-containment) |
| 47 | [Guided default-branch change](#evidence-and-adoption) |
| 48 | [Release tags in the protected set](#security-and-containment) |
| 49 | [Notifications settings command](#flow-and-orchestration) |

## Flow and orchestration

| Feature | What it is | Status |
|---|---|---|
| Ultra-fast mode | A reduced flow — plan, plan review, implementation, branch review, review fixes — with an optional duration flag. When a duration is given, the orchestrator splits it across phases (e.g. 40% planning, 20% implementation, 40% branch review and fixes) and gives each agent a time window to return in. | Open |
| Parallel dispatch in waves | Planning and implementation agents with no dependency on each other run in parallel batches instead of one at a time. | Open |
| Task researcher | A pre-planning agent: checks feasibility, asks clarifying questions at minute one, and flags tasks too big for one plan. | Open |
| Multi-plan programs | A task too big for one plan becomes an ordered chain of plans, each picked up from the inbox when the previous one finishes. | Open |
| Cross-repo tasks | One task split into per-repository plans with an explicit contract between them. | Open |
| Watcher settings surface | A supported way to change the watcher's tunables instead of hand-editing a file. | Open |
| Notifications settings command | A `notifications` command that manages the machine-local `push.env` and nothing else: `set-url` writes the endpoint, `show` names the file in effect and which keys are set without printing a value, and `test` sends one push. Today only `init --notifications` writes the file, and `init` skips a file that already exists, so a `push.env` that is there with both keys empty can be filled only by hand or by `init --force`, which regenerates every other file too. `doctor`'s warning about an empty file then names this command. | Open |
| Per-run base branch | A run can start from a branch other than `defaultBranch` — a hotfix from `prod`, a fix on `release/x.y`. The config lists the allowed bases, the drop or `/branch-prompt` picks one, and the run records it; the worktree, the branch-review diff and the branch refresh all use that recorded base. Today every run is cut from `defaultBranch`, so the only way is to change the key for one run and change it back. | Open |

## Planning artifacts and reporting

| Feature | What it is | Status |
|---|---|---|
| Trace export | Per-run logs converted to OpenTelemetry GenAI spans or Langfuse traces. | Open |
| Cost per feature | Token and cost accounting per run in branch statistics: "feature X cost $Y for Z story points." | Open |
| Latency tracking | Per-phase and per-agent wall-clock recorded in branch statistics alongside the cost figures, so a slow phase is visible without reading the run logs. | Open |
| `branch-summary.md` | At the end of the flow, write the Done summary the supervised flow already gives — including token consumption and the API-equivalent price. | Open |
| Task breakdown and estimates file | The story plan exported as a task list with per-task and total estimates, in the shape project managers track. | Open |
| User flow diagram | A writer agent draws, and a reviewer agent checks, the user flow the branch implements. | Open |
| Business (data) flow diagram | A diagram of how data moves through the change. | Open |

## Quality and testing

| Feature | What it is | Status |
|---|---|---|
| Line-number citations never block | Review findings anchor on symbols; a stale line number in a citation is no longer a blocking finding. | Done |
| Citation groundedness gate | Every citation in a plan, a review finding or a justification is checked against the file and symbol it names, so a fabricated or miscited reference fails the gate instead of reaching a reviewer. | Open |
| Structured agent outputs | Every agent's return validated against a declared schema at the seam — reviewer verdicts, writer file paths and counts, the statistics block, the committer's sha and subject. The contracts already exist in prose and callers parse those lines word for word, so renaming one breaks a caller silently today. | Open |
| Golden-task eval suite | A frozen set of task prompts with rubrics, re-run whenever the harness's own instructions change, graded per task class. `evals/` holds one provisional case. | Open |
| Model-change drift gate | Pin the model a flow runs on, and re-run the golden-task suite when that pin changes, so a model upgrade or deprecation surfaces as a measured diff rather than as drift discovered mid-branch. | Open |
| Integration tests | The pipeline writes integration tests for the change — and widget/component tests where the stack has them. | Open |
| Regression tests | The pipeline writes regression tests for the behaviour a branch fixes or changes. | Open |
| Fix-plan structure review | A structural reviewer for the user-review fix-plan flow, matching the one the task plan already has. | Open |
| Performance and security review | Review coverage for performance and security findings; shape not decided. | Open |

## Engines, environments and integrations

| Feature | What it is | Status |
|---|---|---|
| Docs-catalog retrieval | Search over the docs catalog and the conventions documents, exposed as an MCP tool: an ingestion pipeline, hybrid lexical and embedding indexes with reranking, and a measured relevance eval (recall@k, MRR, plus per-arm cost and latency) that decides it against the index-first navigation used today rather than assuming retrieval wins. | Open |
| Second-runtime reference port | One flow stage — the plan-writer and plan-reviewer approval loop — reimplemented on an open-source agent runtime (LangGraph is the suggested candidate) as a standalone service, to prove the engine seam against a runtime that is not Claude Code before the abstraction above settles on a shape. | Open |
| Engine / provider abstraction | The engine seam built and proven against at least one open-source runtime, with runtime and model as separate settings. | Open |
| Budget governor | Token and cost caps for API-billed accounts. Today the usage gate only pauses on plan windows, so an API-billed account has no cap. | Open |
| Cloud / CI execution | Runs as a chain of bounded CI jobs that resume from the ledger, with draft-PR output. Seam declared (`forge`). | Open |
| MCP servers | A QA server (reserve test users, seed fixtures) and a ledger server (lessons, observations, statistics). | Open |
| Deploy to a test environment | Deploy the branch through a user-provided script, or a light CI/CD step that respects protected branches and the never-merge rule. | Open |
| Cloud QA | QA runs against a preview-deployment URL with a headless browser inside the job, credentials come from CI secrets, and test-user parking uses a real lock. | Open |
| Mobile QA drivers | Maestro and mobile-MCP variants of the QA tester. Seam declared (`qa.driver`). | Open |
| Design-source ingestion | Plans cite design tokens and frames, a reviewer checks token-level conformance, and QA gains a visual reference. Seam declared (`design.source`). | Open |
| `llms.txt` | An LLM-readable summary of the project at the repository root. | Open |
| Engine seam design | Where a second agent runtime or model plugs in, written up in [`ARCHITECTURE.md`](ARCHITECTURE.md). | Done |
| Design-source config key | The `design.source` key (`figma` \| `penpot` \| `none`) declared in the config schema. | Done |

## Evidence and adoption

| Feature | What it is | Status |
|---|---|---|
| First published eval result | Run the `plan-shape` case in both setups — with the plugin and without — and publish the result, even if rough. The case is provisional and has never been run. | Open |
| Outcome-graded eval case | At least one eval case on a non-toy task, graded on outcome (tests passing, review findings, post-review statistics) rather than only on whether the plan shape appears. | Open |
| Measuring the lessons ledger | Whether a lesson actually reduces recurrence: tag review findings against the ledger entry that should have prevented them and report the rate before and after it landed, so feedback converted into agent rules is measured rather than assumed. | Open |
| Second end-to-end capture | A captured run on a realistic repository, with a remote and more phases enabled. The shipped capture is one run on the example app with parity and docs off; every push failed (no remote) and plan meta-review took three rounds. | Open |
| Interactive session vs harness run | One plain interactive session against one harness run, on a simple feature and on a complex one, compared on token cost, session duration and branch quality. Quality is measured by running the harness's branch review over both branches, so the interactive session's gaps — and the harness's own weak spots — show up the same way. Numbers stated in the README. | Open |
| `init` warns when there is no remote | Without a remote, an in-place run reports done with every commit left local. `doctor` fails on it and the Done summary flags it; `init` should warn at setup too. | Open |
| Guided default-branch change | One command that moves the integration line: sets `defaultBranch` and `protectedBranches` together, re-renders `githooks/pre-push`, checks that `origin/<branch>` exists, and refuses while runs are active, since work cut from the old base would be reviewed and refreshed against the new one. Today these are separate steps; `doctor` catches the stale hook and the missing remote branch, but not the runs in flight. | Open |

## Security and containment

| Feature | What it is | Status |
|---|---|---|
| OS-level sandbox in the autonomous profile | `init` adds Claude Code's native sandbox (Seatbelt on macOS, bubblewrap on Linux/WSL2) to `settings.autonomous.json`, so the guard also holds for what allowed commands execute, with a network domain allowlist. Sets `sandbox.failIfUnavailable: true` so an unattended run refuses to start instead of silently running unsandboxed. | Open |
| `doctor` sandbox checks | Check sandbox prerequisites (bubblewrap and socat on Linux) and document the domain allowlist that package registries and the QA dev server need, plus tools known to break under it (docker, watchman; TLS in `gh`/`terraform` under Seatbelt). | Open |
| `doctor` flags unverified branch protection | Warn that forge-side branch protection has not been verified. Setting it up stays the user's job; its absence should be visible. | Open |
| Suggested protected branches at `init` | `init` protects only the detected `defaultBranch`. When `origin` carries well-known environment branches (`main`, `uat`, `staging`, `pre-prod`, `prod`, `release/*`), propose adding them to `protectedBranches` instead of leaving them unguarded until someone edits the list. | Open |
| Release tags in the protected set | The pre-push backstop and the `PreToolUse` guard judge branch targets only, so a tag push passes both. Unattended runs are still covered — `git tag` and `git push` are on the autonomous profile's ask list, which no one answers there — but a supervised session has only its prompt. An optional protected tag pattern (e.g. `v*`) that both check. | Open |

## Documentation

| Feature | What it is | Status |
|---|---|---|
| README summary and checklist | Open with three plain lines — what it is, what you get — and a five-step checklist: install, `init`, `/harness-analyze` (in Claude Code, not the terminal), `doctor`, start the daemon. Caveats move below it. | Open |
| Compact the README | Cut the README to what a new reader needs: short sentences, one idea per paragraph, and the long measured caveats moved into the docs they belong to, linked rather than inlined. | Open |
| Threat model | Name what the guards protect against (agent mistakes, protected branches — via the deny floor, `git push` on ask, per-agent tool allowlists and the `PreToolUse` guards) and what they don't: allowed commands such as tests, builds and the dev server run agent-written code with the user's full rights. Point to the sandbox or a container, and note the sandbox covers shell commands, not MCP servers or hooks. | Open |

---

Use cases and feedback are welcome as issues.
