# Roadmap

What is planned beyond the current release. For what ships today, see [`README.md`](README.md).

Nothing here is a schedule or a promise. **The index below is the intended order of outstanding work**; the tables under it group every item by area, carry the detail and the status, and include what is already done and what was withdrawn. Each index entry links to the section its row lives in. Where a feature already has a declared config key with nothing behind it yet, the description says **seam declared**.

**Status:** `Open` · `In progress` · `Done` · `Withdrawn`

## Index

| Priority | Feature |
|---|---|
| 1 | [Security reviewer](#quality-and-testing) |
| 2 | [Performance reviewer](#quality-and-testing) |
| 3 | [Committer as a script](#flow-and-orchestration) |
| 4 | [Script-driven planning pilot](#flow-and-orchestration) |
| 5 | [DevScene studio](#scene-products) |
| 6 | [Task researcher](#flow-and-orchestration) |
| 7 | [Contract-first task plans](#flow-and-orchestration) |
| 8 | [Narrower plan and branch reviewers](#quality-and-testing) |
| 9 | [Parallel plan reviews](#flow-and-orchestration) |
| 10 | [Parallel dispatch in waves](#flow-and-orchestration) |
| 11 | [Multi-plan programs](#flow-and-orchestration) |
| 12 | [Ultra-fast mode](#flow-and-orchestration) |
| 13 | [Review severity markers](#quality-and-testing) |
| 14 | [Script-driven autonomous flow](#flow-and-orchestration) |
| 15 | [Test-driven development](#quality-and-testing) |
| 16 | [Outbound HTTP listener](#security-and-containment) |
| 17 | [RagScene](#scene-products) |
| 18 | [GraphScene](#scene-products) |
| 19 | [Docs-catalog retrieval](#engines-environments-and-integrations) — kept opt-in by maintainer decision after a withdrawn verdict; improving it and measuring where it pays is open |
| 20 | [Citation groundedness gate](#quality-and-testing) |
| 21 | [Structured agent outputs](#quality-and-testing) |
| 22 | [Golden-task eval suite](#quality-and-testing) |
| 23 | [Trace export](#planning-artifacts-and-reporting) |
| 24 | [Engine / provider abstraction](#engines-environments-and-integrations) |
| 25 | [Model-change drift gate](#quality-and-testing) |
| 26 | [Budget governor](#engines-environments-and-integrations) |
| 27 | [Other issue trackers](#engines-environments-and-integrations) |
| 28 | [First published eval result](#evidence-and-adoption) |
| 29 | [Outcome-graded eval case](#evidence-and-adoption) |
| 30 | [Measuring the lessons ledger](#evidence-and-adoption) |
| 31 | [MCP servers](#engines-environments-and-integrations) |
| 32 | [Cross-repo tasks](#flow-and-orchestration) |
| 33 | [Watcher settings surface](#flow-and-orchestration) |
| 34 | [`branch-summary.md`](#planning-artifacts-and-reporting) |
| 35 | [Task breakdown and estimates file](#planning-artifacts-and-reporting) |
| 36 | [User flow diagram](#planning-artifacts-and-reporting) |
| 37 | [Business (data) flow diagram](#planning-artifacts-and-reporting) |
| 38 | [Integration tests](#quality-and-testing) |
| 39 | [Regression tests](#quality-and-testing) |
| 40 | [Fix-plan structure review](#quality-and-testing) |
| 41 | [Deploy to a test environment](#engines-environments-and-integrations) |
| 42 | [Cloud QA](#engines-environments-and-integrations) |
| 43 | [Mobile QA drivers](#engines-environments-and-integrations) |
| 44 | [Design-source ingestion](#engines-environments-and-integrations) |
| 45 | [Second end-to-end capture](#evidence-and-adoption) |
| 46 | [Interactive session vs harness run](#evidence-and-adoption) |
| 47 | [`init` warns when there is no remote](#evidence-and-adoption) |
| 48 | [OS-level sandbox in the autonomous profile](#security-and-containment) |
| 49 | [`doctor` sandbox checks](#security-and-containment) |
| 50 | [Threat model](#documentation) |
| 51 | [Suggested protected branches at `init`](#security-and-containment) |
| 52 | [Guided default-branch change](#evidence-and-adoption) |
| 53 | [Release tags in the protected set](#security-and-containment) |
| 54 | [Notifications settings command](#flow-and-orchestration) |

## Flow and orchestration

| Feature | What it is | Status |
|---|---|---|
| Ultra-fast mode | A reduced flow — plan, plan review, implementation, branch review, review fixes — with an optional duration flag. When a duration is given, the orchestrator splits it across phases (e.g. 40% planning, 20% implementation, 40% branch review and fixes) and gives each agent a time window to return in. | Open |
| Parallel dispatch in waves | Planning and implementation agents with no dependency on each other run in parallel batches instead of one at a time. On the implementation side it is what **Contract-first task plans** make possible: each wave dispatches one implementer per layer — baseline models, then abstract contracts, then implementations and wiring. On the planning side it starts with **Parallel plan reviews**. | Open |
| Task researcher | A pre-planning agent with four responsibilities: (a) web research where the task needs it — it is granted `WebSearch` and `WebFetch`, and whether and how it stays sandboxed is still to be decided; (b) a feasibility check, asking clarifying questions at minute one; (c) a research report file for the run, which also gives the plan writer short leads; (d) rough estimates for the full requirements, flagging any task above 300 story points to be split into several branches of at most 300 each. The split itself is **Multi-plan programs**. | Open |
| Contract-first task plans | Refactor the task-plan writer to fewer responsibilities: it writes the skeleton and the contracts between tasks — the required output and behaviour of each sub-task — rather than every implementation detail. Today the plan is so detailed that implementers mostly transcribe it, which leaves them no room to improvise and binds them to the plan when it is wrong. Where the work allows it (source code more than corpus or documentation work, and never as an absolute rule), a story is ordered in three stages, each dispatchable in parallel per layer: (a) the baseline — data models, domain entities, mappers; (b) abstract contracts — data-module functions returning the data models, domain functions or use cases calling them, the presentation layer's hooks or components — as signatures, nullable stubs or "not implemented" bodies; (c) the implementations of those contracts and the tasks that link them together. Starts with research into the writer's full current responsibilities. | Open |
| Parallel plan reviews | The task-plan and user-review fix-plan reviewers run in parallel, each writing its own findings file; then either the plan writer reads every file, or a merging agent (possibly a new one) folds them into one. It builds on **Converging plan reviews**: that item's round decision point becomes the join, and its sequence of gates becomes the fan-out. | Open |
| Committer as a script | A script that commits and pushes, replacing the `committer` agent. | Open |
| Script-driven planning pilot | A script walks the planning graph and runs each node as its own headless session, taking planning out of the orchestrator session; an opt-in measured pilot that ends with a cost comparison deciding whether the unit loop follows ([#159](https://github.com/firu-daniel/devscene/issues/159)). | Open |
| Script-driven autonomous flow | The whole autonomous flow on the script-driven graph, removing the orchestrator session. Follows the planning pilot if its cost comparison favours it. | Open |
| Multi-plan programs | A task too big for one plan becomes an ordered chain of plans — one branch each, at most 300 story points, split from the **Task researcher**'s estimates — each picked up from the inbox when the previous one finishes. **The mechanism is a per-run base branch**, which also covers the standalone case of a run starting from a branch other than `defaultBranch` — a hotfix from `prod`, a fix on `release/x.y`: the config lists the allowed bases, the drop or `/devscene:branch-prompt` picks one, and the run records it; the run copy, the branch-review diff and the branch refresh all use that recorded base. Today every run is cut from `defaultBranch`, so the only way is to change the key for one run and change it back. **Lead, to be researched:** when the researcher splits a task, the program cuts its own base branch from `defaultBranch`; each plan's branch is cut from that base, refreshes from it before it lands (an earlier plan may have landed meanwhile), and lands back into it; the base reaches `defaultBranch` through the usual human-merged pull request. The research must first settle whether that is safe under the protected-branch set and the sandbox: who merges into the base, given that a run never merges today; and how a branch cut from a base other runs wrote passes the protected-surface check that the run copy now makes against `defaultBranch`. | Open |
| Cross-repo tasks | One task split into per-repository plans with an explicit contract between them. | Open |
| Watcher settings surface | A supported way to change the watcher's tunables instead of hand-editing a file. | Open |
| Notifications settings command | A `notifications` command that manages the machine-local `push.env` and nothing else: `set-url` writes the endpoint, `show` names the file in effect and which keys are set without printing a value, and `test` sends one push. Today only `init --notifications` writes the file, and `init` skips a file that already exists, so a `push.env` that is there with both keys empty can be filled only by hand or by `init --force`, which regenerates every other file too. `doctor`'s warning about an empty file then names this command. | Open |

## Planning artifacts and reporting

| Feature | What it is | Status |
|---|---|---|
| Trace export | Per-run logs converted to OpenTelemetry GenAI spans or Langfuse traces. One possible shape is **TraceScene** (or TeleScene; the name is not settled): a standalone repository that does the export, which the harness uses instead of exporting itself. Whether that is feasible, and whether a separate product helps more than an export inside the harness, is to be researched first. | Open |
| Cost per feature | Token and cost accounting per run: every headless session's cost, tokens and cache use, rolled up per run in `<state_dir>/run_analytics/<branch>/run-analytics.md` ([`docs/watcher.md`](docs/watcher.md) §2, *Run analytics*). | Done |
| Latency tracking | Wall time recorded alongside the cost figures — per session, per request, per tool call and per sub-agent, and per Run gates round down to each test file — so a slow phase is visible without reading the run logs ([`docs/watcher.md`](docs/watcher.md) §2, *Run analytics*). | Done |
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
| Converging plan reviews | Every plan reviewer runs every round against the same version of the task plan, and one decision point closes the round. From the third round on, the reviewers run in converging mode: they check that the previous round's Must Fix items were addressed, and note anything else as non-gating incidental findings that the end-of-branch reviewers follow up. The autonomous fork commits each round. The same holds for the user-review fix plan, whose routing stays prose ([`docs/converging-plan-reviews.md`](docs/converging-plan-reviews.md)). | Done |
| Narrower plan and branch reviewers | Refactor the task-plan reviewer to fewer responsibilities — the plan's structure, and whether it covers and offers a solution for every requirement of the task prompt — and spread the rest across the other reviewers. Starts with research into its full current responsibilities; whether the same applies to the end-of-branch `branch-reviewer` is part of that research. | Open |
| Review severity markers | Revisit what really is a Must Fix — possibly a review should carry Must Fix items only. | Open |
| Security reviewer | A security reviewer agent at the end-of-branch review and in the user-review fix-plan phase, and in the plan phase where security issues can be detected from a plan at all. Its scope draws on Claude Code's existing security review command. | Open |
| Performance reviewer | A performance reviewer agent at the same three points: the end-of-branch review, the user-review fix-plan phase, and the plan phase where performance issues can be detected from a plan at all. | Open |
| Test-driven development | The pipeline writes the tests before the implementation they cover. | Open |

## Engines, environments and integrations

| Feature | What it is | Status |
|---|---|---|
| Docs-catalog retrieval | Agentic retrieval over the "second brain" — the docs catalog and the conventions documents — exposed as a read-only MCP search tool for the plan writer and the reviewers. The Markdown documents stay the source of truth; the index is a derived, uncommitted cache refreshed incrementally from content hashes, so a merged branch needs no retrieval edit. An ingestion pipeline chunks each document at its headings; hybrid lexical (BM25) and vector (pgvector) indexes in an embedded Postgres (PGlite), built on local embeddings, are fused and reranked, results cite `path#heading`, and a query with no confident match abstains rather than returning noise. A measured relevance eval (recall@k, MRR, plus per-arm cost and latency, runnable as a regression check) decides it against the navigation agents use today rather than assuming retrieval wins — and has measured it once: on a real 1,960-chunk catalog, agent navigation outscored retrieval and the verdict is **withdrawn**; the maintainer did not execute the withdrawal and keeps retrieval opt-in ([`docs/retrieval-eval-results.md`](docs/retrieval-eval-results.md) → *The decision, applied to the real catalog*). Retrieved text is navigation, never evidence: the code still wins. What holds this row `Open` is the work that decision leaves open: improving the stack as built — a code-aware reranker, a different embedder, BM25 weighting, sections longer than the models' window — and measuring the situations where retrieval is expected to pay and no run has covered, a catalog far larger than one grep can cover and one whose vocabulary does not match the queries. Item 18 of [`docs/development.md`](docs/development.md) → *6. The roadmap this tree defers to*, a numbering separate from this file's priorities, records that the withdrawal was not executed. | Open |
| Second-runtime reference port | **Withdrawn** by maintainer decision on 2026-09-24: the planning loop is already an orchestrator-walked graph whose committed progress ledgers are its durable state, and a port would add code-enforced routing no run has needed while moving the planning phase onto per-token API billing ([`docs/second-runtime-port-decision.md`](docs/second-runtime-port-decision.md)). | Withdrawn |
| Engine / provider abstraction | The engine seam built and proven against at least one open-source runtime, with runtime and model as separate settings. | Open |
| Budget governor | Token and cost caps for API-billed accounts. Today the usage gate only pauses on plan windows, so an API-billed account has no cap. | Open |
| Cloud / CI execution | **The execution half has shipped:** with `execution.target` set to `github-actions` (opt-in; `local` stays the default), the local watcher dispatches each run to a GitHub Actions job on a hosted or self-hosted runner, and a run longer than one job runs as a chain of bounded jobs that each resume from the committed ledger. The docs-retrieval cache under `${XDG_CACHE_HOME:-$HOME/.cache}/devscene/retrieval/` is restored per job, keyed on the CLI version, and seeded by a warm job on the default branch, since a cache saved on one feature branch is not readable from another ([`docs/remote-execution.md`](docs/remote-execution.md)). **The issue trigger has shipped:** labelling an issue starts a task run with nothing local taking part, gated on `forge` `github` ([`docs/github-issue-trigger.md`](docs/github-issue-trigger.md)). **Run control has shipped:** comment commands, review rounds, lifecycle comments, state labels and draft-pull-request output, gated on `forge` `github` ([`docs/github-run-control.md`](docs/github-run-control.md)). A remote run ends at a pushed branch and, with `forge` `github`, a draft pull request; merging stays the operator's. Trackers other than GitHub Issues are their own row, **Other issue trackers**. | Done |
| Other issue trackers | Starting and steering runs from trackers other than GitHub Issues. Jira reaches `start` one way, through the documented and untested `repository_dispatch` route ([`docs/github-issue-trigger.md`](docs/github-issue-trigger.md) → `## 6. Other trackers`); GitLab needs a relay, and none ships; no tracker gets the run's state back or steers the run. | Open |
| MCP servers | A QA server (reserve test users, seed fixtures) and a ledger server (lessons, observations, statistics). | Open |
| Deploy to a test environment | Deploy the branch through a user-provided script, or a light CI/CD step that respects protected branches and the never-merge rule. | Open |
| Cloud QA | QA runs against a preview-deployment URL with a headless browser inside the job, credentials come from CI secrets, and test-user parking uses a real lock. | Open |
| Mobile QA drivers | Maestro and mobile-MCP variants of the QA tester. Seam declared (`qa.driver`). | Open |
| Design-source ingestion | Plans cite design tokens and frames, a reviewer checks token-level conformance, and QA gains a visual reference. Seam declared (`design.source`). | Open |
| `llms.txt` | An LLM-readable summary of the project at the repository root. | Done |
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
| Adoption beside existing tooling (0.6.6) | New adoptions write their scripts to `devscene-scripts/`, with `init --scripts-dir <dir>` to choose another; existing adoptions never move. The workflow templates pin every action to a commit SHA and grant least-privilege permissions per job. Shipped files pass `typos`. The `zizmor` findings that stand are listed with their reasons in [`docs/remote-execution.md`](docs/remote-execution.md) §11. | Done |

## Security and containment

| Feature | What it is | Status |
|---|---|---|
| OS-level sandbox in the autonomous profile | Shipped: `init` writes Claude Code's native sandbox (Seatbelt on macOS, bubblewrap on Linux/WSL2) into `settings.autonomous.json`, strict, with `sandbox.failIfUnavailable: true` so an unattended run refuses to start instead of silently running unsandboxed, a network domain allowlist that is empty by default, and four excluded scripts. Every Bash command and every process it starts runs inside it; the file tools, hooks and MCP servers run outside it ([`docs/sandbox-record.md`](docs/sandbox-record.md)). Left: roadmap item 21's measurement half — no WSL2 row, MC1 not run, the interactive-test phase unmeasured ([`docs/development.md`](docs/development.md) §6, `docs/sandbox-record.md` §7). | In progress |
| `doctor` sandbox checks | Shipped: `doctor`'s `sandbox-prerequisites` check (bubblewrap and socat on Linux and WSL2, and the Ubuntu 24.04 AppArmor profile), the watcher's refusal to launch a run on a host that cannot start the sandbox, the remote job's step that installs the prerequisites before its preflight (IS1–IS4 **pass** on a GitHub-hosted runner, `docs/sandbox-record.md` §4 `runner-install`), and the domain allowlist that `sandbox.allowedDomains` carries. Left: the tools known to break under the sandbox (docker, watchman; TLS in `gh`/`terraform` under Seatbelt), which roadmap item 21's measurement settles ([`docs/development.md`](docs/development.md) §6). | In progress |
| `doctor` flags unverified branch protection | Shipped: `doctor`'s `branch-protection` check, under `--check-github` with `forge` `github`, warns for every protected branch whose ruleset or branch protection does not block direct pushes, force pushes and deletion, and warns *not checked* otherwise. Setting it up stays the user's job ([`docs/cli.md`](docs/cli.md)). | Done |
| Suggested protected branches at `init` | `init` protects only the detected `defaultBranch`. When `origin` carries well-known environment branches (`main`, `uat`, `staging`, `pre-prod`, `prod`, `release/*`), propose adding them to `protectedBranches` instead of leaving them unguarded until someone edits the list. | Open |
| Outbound HTTP listener | A listener on outbound HTTP calls that prevents unwanted web access, without itself becoming an entry point for an attacker. The sandbox's domain allowlist and the run analytics' `## Network refusals` report already refuse and record; this is the prevention layer beside them. | Open |
| Release tags in the protected set | The pre-push backstop and the `PreToolUse` guard judge branch targets only, so a tag push passes both. Unattended runs are still covered — `git tag` and `git push` are on the autonomous profile's ask list, which an unattended run's default `dontAsk` mode refuses — but a supervised session has only its prompt. An optional protected tag pattern (e.g. `v*`) that both check. | Open |
| Nightly supply-chain audit | A scheduled workflow, never a merge gate, audits the workspace's full npm tree, the Python service's `uv.lock`, the workflows `init` renders for an adopter and this repository's own workflows with online `zizmor`, and the pinned model revisions. It fails on findings; model drift is reported as a notice. Both retrieval paths now load a pinned revision of each model. What runs where, and how its ignore sets are kept: [`docs/development.md`](docs/development.md) §8. | Done |

## Scene products

Parts of the harness extracted as products of their own.

| Feature | What it is | Status |
|---|---|---|
| RagScene | The docs retrieval extracted from the harness as its own product ([`docs/rag-extraction-research/`](docs/rag-extraction-research/README.md)). | Open |
| GraphScene | The flow-graph navigation extracted from the harness ([`docs/flow-graph-walker.md`](docs/flow-graph-walker.md)). | Open |
| DevScene studio | DevScene studio. | Open |

## Documentation

| Feature | What it is | Status |
|---|---|---|
| README summary and checklist | Open with three plain lines — what it is, what you get — and a five-step checklist: install, `init`, `/devscene:analyze` (in Claude Code, not the terminal), `doctor`, start the daemon. Caveats move below it. | Done |
| Compact the README | Cut the README to what a new reader needs: short sentences, one idea per paragraph, and the long measured caveats moved into the docs they belong to, linked rather than inlined. | Done |
| Threat model | Name what the guards protect against (agent mistakes, protected branches — via the deny floor, `git push` on ask, per-agent tool allowlists and the `PreToolUse` guards) and what they don't: allowed commands such as tests, builds and the dev server run agent-written code, which in an unattended run runs inside the sandbox, while the file tools, hooks, MCP servers, the four excluded scripts and the bootstrap's configured install and build commands run outside it ([`docs/sandbox-record.md`](docs/sandbox-record.md) §1, §2). Point to the sandbox or a container for what it does not cover. | Open |

---

Use cases and feedback are welcome as issues.
