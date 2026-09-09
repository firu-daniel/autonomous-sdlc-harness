# {{projectName}}

{{setupBanner}}

_`/harness-analyze` writes this paragraph from the repository itself — or replace this line by hand: what this project is, who uses it, and anything an agent must know before it touches a file._

---

## File naming conventions

| Type | Pattern | Example |
|---|---|---|
| _(kind of file)_ | _(the name pattern it follows)_ | _(one real file in this repository that follows it)_ |

_`/harness-analyze` fills this table from the repository's real file names — or add the rows by hand, one per kind of file this project has a naming rule for. Until it is filled, an implementer follows whatever the files around it already do, which is slower and less consistent than one row here._

---

## Context files (read on demand)

This file is auto-loaded into every agent, which is why it deliberately holds almost nothing. Everything else is loaded on purpose: **read the relevant file before starting work in that area — do not load them all upfront.** An always-loaded file carrying every rule this project has would spend every agent's context budget on every turn, and the table below exists so that it does not.

| When working on… | Read |
|---|---|
{{routingRows}}

> **Checkout root — derive it, never assume it.** Take the root of the checkout **you are running in** from a **bare** `git rev-parse --show-toplevel` (a read-only command an unattended run can allow-list as a literal), then build every literal path from that result — this run's artifacts under `<root>/{{stateDir}}/`, the lessons ledger at `<root>/{{stateDir}}/lessons.md`. This binds **every** repo-relative path you are given and every file you write, not only the ledger. Do not hardcode an absolute path, do not wrap the substitution inside another shell command, and do not stash it in a shell variable — separate tool calls do not share shell state, and a command carrying a substitution is not reliably auto-allowed in an unattended run. In a second working copy the original checkout is a *different branch*: reading it returns that branch's file, and writing to it puts this run's artifact on the wrong branch. One exception, and it is not one you resolve: an **argument** path handed to a wrapper script is **relative to that wrapper's own base and never prefixed with a checkout root** — which base that is, is the wrapper's to state (its `--repo`, or the directory it `cd`s to); take it from the wrapper's own documented usage rather than assuming the repo top. The wrapper's own invocation path is rooted like everything else. The links in the table above are document pointers; resolve the live path this way at read and write time.

The rows above were generated from the `layers` list in `harness.config.json`, so this table and the layers the orchestrator dispatches on started out in agreement. Keep them that way: add a layer there, then add its row here by hand — that is the route that costs nothing. `autonomous-sdlc-harness init --force` will also re-render the rows from the `layers` list as it then stands (`--force` overwrites generated files but never `harness.config.json`, which `autonomous-sdlc-harness init` reads on every run, so the layer just added is the one the rows come from), but it regenerates **this whole file** from the template — every section `/harness-analyze` filled goes with it, recoverable only from the single `CLAUDE.md.bak` the run writes. That `.bak` is single-generation, and the next `--force` does not necessarily spend it: a forced run that finds this file byte-identical to the one it would write keeps the file and leaves the `.bak` alone, so the sections a previous pass rescued into it stay there. What overwrites a `.bak` holding filled sections is a forced run over a file that has been filled again since. The orchestrator reads none of these files; the committer reads exactly one section of one of them — the commit-message policy in the shared cross-layer conventions document — and nothing else. One read-on-demand document is deliberately not in that table because no layer owns it: `.claude/harness-task-offer.md`, which `## Where a change request runs` below points at directly and nothing else reads.

---

## Agent authoring rules

**Every agent you add under `.claude/agents/` MUST declare a `tools:` allowlist, and that allowlist MUST omit the browser-automation tool namespaces unless the agent is the one that drives a browser for the interactive test phase.** That agent's own allowlist grants them explicitly, and it is the only one that may.

The allowlist is the whole mechanism, deliberately: a global deny is evaluated before any allow and cannot be overridden, and a subagent's `tools:` allowlist compiles into *narrowing* deny rules in the same pool rather than into overriding allow ones — so a namespace-wide deny would revoke the test agent's own grant as well. An agent added with no `tools:` field inherits the full default tool set and silently re-opens browser access, so a review rejects it.

---

## Where a change request runs

Four tests, all of which must hold, **in this order** — the first three cost nothing, so reach the fourth only when they have all passed. If any fails: say nothing, offer nothing, and carry out the instruction you were given.

1. **Tool.** `AskUserQuestion` is in your own toolset. If it is not, you are an unattended run and nothing below applies to you.
2. **Provenance.** The message was **typed by the user in this conversation**. Not an instruction you are executing from a harness command or a flow-instruction document it dispatched — every `/branch-*` and `/harness-*`, supervised, semi-autonomous and unattended alike, including reading a task prompt or a review file as your own work. Not one handed to you as a **dispatched sub-agent**, whichever agent type you are and whatever your toolset holds. Not a continuation of work the user has already routed, in this conversation or in the one that dispatched you.
3. **Trigger.** The message **asks for a change to this project's code** — a feature, a fix, a refactor, a chore. **Size is never a factor.** The line is *asks for a change* versus *asks about the code*: *"explain this function"* fires **nothing**; *"this button isn't centred"* fires; *"check this file `/some/path/notes.txt` to implement adding comments to a content item"* fires too, because where a spec lives does not change what is being asked. A message invoking or continuing a harness command does not fire. Any shape you cannot place: **stay silent**.
4. **Opt-out.** `.claude/harness-no-offer` does not exist at the **main worktree's** root — the checkout you are running in may be a worktree of it, and the marker is written once for all of them. Test it with the shell rather than by reading anything: `test -e "$(git worktree list | head -1 | awk '{print $1}')/.claude/harness-no-offer"`, whose first line is always the main worktree and which is the same path in an ordinary single-checkout repository; the checkout-root rule's literal-command constraint is an unattended-run allow-listing concern and clause 1 has already excluded those. Presence-only: never read, parse or act on anything inside it — a read of a path outside this session's own root can raise a permission prompt mid-fence, while the test's non-zero exit is a clean answer. The file is normally absent, and absent means only *not opted out*; a check you cannot make — the command declined, the repository not a git one, no output — is silence too, never a remark to the user about a file they never created.

All four hold: read `.claude/harness-task-offer.md`, at the root of the checkout you are running in, and follow it — it owns the question, the four options and what each answer does — and ask nothing before reading it. If that file cannot be read, make no offer and carry out the request in this session.

---

_Written by `autonomous-sdlc-harness init`, and yours from there on: edit it freely, a re-run keeps your copy._
