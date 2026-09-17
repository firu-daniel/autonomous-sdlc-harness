# Cross-layer conventions

> **Read this when:** you are implementing, reviewing or planning **any** change — these are the rules that hold in every layer, and they are also the `general` layer's own rules. **Skip when:** never; `.claude/context/cli.md` and `.claude/context/plugin.md` both assume this one has been read.

**Purpose.** The rules a change must satisfy whichever layer it lands in, and the vocabulary the harness uses to talk about this project.

## The stack, in the words the rules below use

- **`cli/` is TypeScript** targeting ES2022 under `module`/`moduleResolution: NodeNext`, compiled by `tsc` to `cli/dist/`, run on Node `>=20.11.0`. `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` and `noUnusedParameters` are all on, so an unused binding and an unchecked index access are build failures rather than review findings. (`cli/tsconfig.json`, `cli/package.json`)
- **The published package declares no required runtime dependency.** `cli/package.json` carries `devDependencies` and no `dependencies` key, and every static `import` in `cli/src` resolves to a `node:` builtin or to a relative sibling. Adding a required runtime dependency is a decision raised as a `stale-rule` entry for a supervised `/harness-analyze` re-run or a hand edit, never a change an implementing run makes: a hand-rolled flag parser and a hand-written configuration check exist because of it (`cli/src/cli.ts` → `GLOBAL_OPTIONS`; `cli/src/config/check.ts` → *"This is not a schema validator, and it must never grow into one"*).
- **One carve-out: docs retrieval.** The libraries docs-catalog retrieval needs — the embedded Postgres with its vector extension, the local embedding runtime and the MCP server SDK — are declared as **optional** peer dependencies (`peerDependenciesMeta`), never under `dependencies`. Only a dynamic `import()` on the retrieval path loads them, so a verb that does not retrieve loads nothing new; they are installed only for an adopter who turns retrieval on; and a missing one fails with an error that names it and says how to install it. The carve-out covers retrieval and nothing else: any other package still goes through the rule above.
- **`plugin/` is prose and shell**: Markdown **agent and command** contracts carry YAML frontmatter and are the only assets that may — an **instruction** document opens on its own H1 with no frontmatter fence, and adding one to an instruction file is a defect (`plugin/instructions/unit_loop_core.md` → the opening `# The unit loop` heading; `plugin/instructions/mode_contract.md` → the opening `# Mode contract` heading) — plus `bash` guard hooks. The `bash` floor is **3.2**, so macOS's `/bin/bash` qualifies, and the only external binaries a guard may need are `git` and `jq` 1.5 or newer (`plugin/hooks/README.md` → `## Prerequisites`).
- **`schemas/` is JSON Schema**, validated by `ajv` from the workspace root (`package.json` → `validate:config`).

## The layers

| Layer | Path | Owns | Its rules |
|---|---|---|---|
| `cli` | `cli` | The npm package `autonomous-sdlc-harness` — the outer loop (`init`, `doctor`, `config`, `daemon`), and `cli/templates/`, the files `init` writes into an adopting repository | `.claude/context/cli.md` |
| `plugin` | `plugin` | The Claude Code plugin — agent definitions, `branch-*` and `harness-*` commands, instruction cores and forks, `PreToolUse` guard hooks, samples, flow documents | `.claude/context/plugin.md` |
| `general` | `.` | Everything else at the root: `schemas/`, `docs/`, `examples/`, `evals/`, the root prose documents and the workspace manifest | this document |

- **`general` is the catch-all and must stay one.** `layers` is required to contain an entry whose `path` is `.`; a configuration without one is rejected, which `schemas/negative/layers-no-catch-all.json` exists to prove. A change whose files sit under `cli/` or `plugin/` belongs to that layer and never to `general`.
- **Neither shipped half may reach into the other at run time.** `cli/src` names `plugin/` files only inside doc comments and in `doctor`'s own report text, and `plugin/` names `cli/src` files only in prose citations; no module imports across the boundary and no shell asset sources one. Making either one execute the other is a new coupling raised as a `stale-rule` entry for a supervised `/harness-analyze` re-run or a hand edit, never a change an implementing run makes. (`cli/src/doctor/checks.ts`, `plugin/hooks/README.md`)
- **The two halves are coupled by contract, not by import**, in one direction: `cli/` writes what an adopting repository gets, `plugin/` reads what is there. So a change to the shape of `harness.config.json`, `stateDir` or `scriptsDir` starts in `cli/` and `schemas/`; the plugin contracts that consume it are downstream of it, and a plugin contract reading a shape the schema does not carry is a defect.

### Where a new responsibility goes

Settle which audience it serves before choosing a file.

| The new thing is… | It goes in |
|---|---|
| behaviour of this CLI itself | a module under `cli/src/<area>/` |
| a file a future adopter receives | `cli/templates/`, mirroring the path it lands on in the adopting repository |
| a shape `harness.config.json` may take | `schemas/harness.config.schema.json` first, then its readers |
| a contract an agent or a flow reads | `plugin/agents/`, `plugin/commands/` or `plugin/instructions/` |
| a measured fact or a decision of record | `docs/`, and nowhere else |

**A responsibility that already has a home does not get a second one.** Each of these is a stated monopoly, and the code must keep it true:

- `cli/src/cli.ts` is the only place a thrown value becomes an exit code, and nothing in the package calls `process.exit()` (`cli/src/core/errors.ts` → the module header's rule 1).
- `cli/src/core/git.ts` is the only module that invokes `git` for repository state or for a path, with one bounded exception that its own header names — `cli/src/generators/githooks.ts`, which reads and writes the `core.hooksPath` **setting**. A third `git` invocation anywhere in the package belongs in `core/git.ts`.
- `cli/src/core/writer.ts` is the only module that writes into an adopting repository, and every mutating filesystem call in it is inside its single commit boundary. A generator enqueues a `WriteRequest` and picks a policy from that module's table; it never calls `fs` itself and never invents a policy.
- `cli/src/machine/registry.ts` is the only module that resolves, reads or writes the machine-local registry of initialized repositories — its path, its JSON shape and its staleness grading (`cli/src/machine/registry.ts` → the module header's rule).
- `plugin/hooks/lib/harness-config-lib.sh` is the only place **any** shell asset in `plugin/` resolves the repository it is judging, loads that repository's `harness.config.json`, answers whether a branch is protected, or builds its safe-prefix set (`hc_safe_prefixes`). Its reach is wider than the guards — `plugin/scripts/reserve-qa-user.sh` and `plugin/scripts/release-qa-user.sh` source it too, and neither is a guard — so a new non-guard script needing any of those answers sources this library rather than re-deriving them (`plugin/hooks/lib/harness-config-lib.sh` → the header's *“the one place every guard hook and the two QA-user helpers”* and its `WHO SOURCES THIS, AND HOW` paragraph).

**Before adding a copy of anything, grep for it.** `cli/src/core/repoPaths.ts` exists because several modules had each carried a private copy of one normalisation, the copies had drifted, and two divergent bodies had been given the same name — so a caller moved between those two files silently changed behaviour, with no compile error and no test. Its header is the worked cost of getting this wrong.

### The order files are created, so a half-built feature is still coherent

Contract before consumer, always. The shapes this tree has:

1. **A configuration key** — `schemas/harness.config.schema.json`, then `cli/src/config/model.ts`, then `cli/src/config/check.ts`, then `docs/config.md` §5. **These four are one contract in four places**, and both source modules say so in their own headers: a key in the model that is not in the schema is a key no configuration may legally carry, and a key in the schema that is not in the check is reported as unknown — a false error.
2. **A CLI subcommand** — the module under `cli/src/commands/` exporting its own `Subcommand`, then its row in `SUBCOMMANDS` (`cli/src/commands/registry.ts`). That table is the single source for usage text, per-command `--help` and dispatch, so nothing else has to change and nothing else may be edited to make the command appear.
3. **A plugin contract** — the asset itself with valid frontmatter, then the instruction or command that dispatches it, then every file that cites it. A contract that nothing dispatches and a dispatch of a contract that does not exist are both defects; `plugin/agents/README.txt` gives the regeneration commands for the sample-pointer case under `Sample fixture pointers`.

**The plugin corpus quotes its own literal wire strings across files, so a rename is an edit to every quoting file.** Before changing a field name, a dispatch key or a quoted literal in `plugin/`, `grep -rn` the exact string across `plugin/` and take the whole result set with you. A literal only one side knows about is a silent contract break (`plugin/agents/committer.md` → the **Fixed-form subjects** bullet).

## Configuration is the source of truth, and it is read at run time

**`harness.config.json`, at the adopting repository's root, is the source of truth for everything that varies between adopters** — the layers, the verification commands, the branch policy, the artifact and script directories, the phase toggles. Nothing caches it and nothing mirrors it: each consumer re-reads the file on each run, from the root it resolved for itself.

- **No configured value is ever frozen into a generated file.** An outer-loop script is copied byte for byte rather than rendered precisely because it reads the configuration at run time; a guard whose protected-branch set was baked in at generation time enforces the wrong set the moment that list changes, and does it silently (`docs/cli.md` → *"Two families land in `scriptsDir`"*).
- **No branch name, no directory name and no command name from any one adopter appears as a literal in `plugin/`.** The corpus writes `<state_dir>`, `<scripts_dir>`, `<default_branch>` and their siblings; a guard reads the real values through the shared library (`plugin/hooks/README.md` → *"No branch name is baked into any of these files"*).
- **Every path in `harness.config.json` is repo-relative**, and the root it resolves against comes from a **bare** `git rev-parse --show-toplevel` — never a hardcoded absolute path, never a substitution nested inside another command, never a value stashed across tool calls. A bare invocation is what an unattended run's permission profile can allow-list; the same probe wrapped in a compound statement is a different string and stalls (`docs/config.md` → `## 1. The three resolution classes`; `cli/src/core/git.ts` → the header's invariant 2).
- **Which normalisation a repo-relative path takes is part of the contract, and the two are deliberately spelled differently**: `normalizeRepoDir` leaves a `..` where it found it and is the default; `normalizeRepoPathStrict` resolves it and is for a caller that keys on the result (`cli/src/core/repoPaths.ts`).

**Serialized names and in-language names are the same identifiers.** Every key of `harness.config.json` is `lowerCamelCase`, and the property of the interface that reads it carries that key verbatim — `projectName`, `defaultBranch`, `protectedBranches`, `stateDir`, `appDir`, `scriptsDir`, `githooksDir`, `agentModel`, `pushEnvPath`, and `name` / `path` / `conventions` inside a `layers` entry. There is no mapping layer and none may be introduced: the schema's `properties` and `cli/src/config/model.ts`'s interfaces are read against each other key for key.

**The shared constants have owners, and a value is imported from its owner rather than retyped**: `CONFIG_FILENAME` and `CONFIG_VERSION` in `cli/src/config/model.ts`; `EXIT` in `cli/src/core/errors.ts`; the action markers, labels and order in `cli/src/core/report.ts`; the safe-prefix set in `plugin/hooks/lib/harness-config-lib.sh`; the deny-by-basename set in `plugin/hooks/autonomous-script-allowlist-guard.sh`. Where a total mapping over a union is involved, type it as a total record so adding a member is a compile error until every table is extended (`cli/src/core/report.ts` → `Reporter.counts`).

- **A persisted key has the same rule, and the machine-registry keys are owned by `cli/src/machine/registry.ts`** — `REGISTRY_FILENAME`, `REGISTRY_SCHEMA` and `REGISTRY_FILE_MODE`. That module's header declares the single mirror outside the package, `MACHINE_REGISTRY_FILENAME` in `cli/templates/scripts/autonomous-watcher.sh`, which is a template an adopter receives rather than an import site; a mirror the header does not declare is a defect, and a new persisted artifact joins the module that owns it rather than being named at its use site.
- **An environment-variable name is a constant with an owner too**: `CLAUDE_HOME_VARIABLE` (`cli/src/machine/paths.ts`) and `SELF_ADOPT_ENV` (`cli/src/commands/init.ts`), each read through its constant and never retyped as a literal — including in the message that names it to a reader.

## Shared code, and where it lives

- The CLI's shared modules are `cli/src/core/` — errors, output, the write engine, git, JSON, path resolution, path normalisation, templating, prompting. A value or behaviour two `cli/src` areas need lives there, never duplicated into both.
- The shared shell library is `plugin/hooks/lib/harness-config-lib.sh` — the guards' and the QA-user helpers' alike — sourced by a path computed from `${BASH_SOURCE[0]}` and never by the plugin-root token, which the runtime does not export into a script's environment.
- The flows' shared prose is `plugin/instructions/*_core.md`: a mode-free core carries the flow, and a **thin fork** overrides only what the mode changes. A rule is stated once and a mode difference is visible as a fork, never as a second copy that drifts (`plugin/instructions/README.md`).

## Registries and dispatch tables

There is no navigation surface in this project; its analogue is the set of tables that route a name to an implementation, and each is a single source with no second list beside it.

- `cli/src/commands/registry.ts` → `SUBCOMMANDS` routes a CLI verb to its module and renders usage from the same array.
- `cli/src/cli.ts` → `GLOBAL_OPTIONS` is the single source for both the argv parser and the `Options:` block.
- `plugin/hooks/hooks.json` registers every guard, and the event names go one level down inside a `{"hooks": { … }}` wrapper (`docs/development.md` → `## 3. Manifest facts a contributor must not rediscover`).
- `harness.config.json` → `layers` routes a changed path to the layer that owns it and to that layer's rules document.
- `cli/src/detect/signals.ts` is an ordered first-match-wins table, so a row added to it can shadow a later row or be shadowed by an earlier one.

## Output, logging and errors

**The CLI has one output surface: `Reporter` (`cli/src/core/report.ts`).** Every command writes through it and calls `console` never. Exactly two files outside the commands may name `console`, and nothing else in the package may: the entry point `cli/src/cli.ts`, which prints `--version`, the usage block, the unknown-command refusal and the final error line directly, because those are argv-level answers that precede or follow any reporter; and `cli/src/core/report.ts` itself, whose constructor installs `console.log` / `console.error` as the reporter's own default sinks, which is why injecting a sink is what redirects output rather than stubbing `console` (`cli/src/core/report.ts` → the `Reporter` constructor's `options.out ?? …` / `options.err ?? …`). Three properties depend on the rule: `--quiet` behaves the same everywhere, the write engine's action log and the human-readable log are one log, and the output is **plain ASCII — no colour escapes, no emoji** — so a test can diff it verbatim.

- `info` / `step` / `ok` / action lines / `summary()` are narration on stdout, suppressed by `--quiet`. `warn` and `fail` go to stderr and always print. `result()` is the one line a caller came for and prints on stdout whatever the flags are.
- Injecting a sink (`ReporterOptions.out` / `err`) is how a test captures output. Do not stub `console`.

**Errors carry their own exit code and are never turned into one locally.** Throw `HarnessError` for anything the CLI anticipated — a refusal, a failed check, bad usage — which exits `EXIT.FAILURE`. Use `internal(message)` for a fault in this CLI or in the assets it ships, which exits `EXIT.INTERNAL` and appends the standard trailing sentence; do not hand-build `new HarnessError(…, EXIT.INTERNAL)`, and do not pass a message that already carries its own version of that sentence. Let every unanticipated throw propagate: `cli.ts` reports it as `(unexpected)`, and that code is the signal that the fault is a CLI bug rather than a misconfigured repository. **Every non-zero exit carries a message naming its cause** — a bare non-zero exit is indistinguishable from a crash to the run daemon. (`cli/src/core/errors.ts`)

**A guard hook's output contract is narrower still.** It takes its payload on stdin and prints **at most one JSON object**; it emits `allow` or nothing. Failing closed means emitting nothing, which defers to the adopter's permission profile and costs a prompt rather than a false permit. Exactly one guard in the plugin may answer `deny`, `plugin/hooks/autonomous-protected-branch-guard.sh`, and it refuses only what it can prove. (`plugin/hooks/README.md`)

## Shell assets

- **`#!/usr/bin/env bash`** on every shell file in this tree, and `*.sh` plus `githooks/*` are checked out with LF on every platform — a CR at the end of a shebang is read as part of the interpreter's name and fails with a message that never mentions a line ending (`.gitattributes`).
- **A guard hook uses `set -u` and never `set -e`**, plus `set -f` where it handles an unquoted target: a guard that aborts mid-decision emits nothing useful, and failing open into the permission system is the designed outcome (`plugin/hooks/README.md` → `## Prerequisites`).
- **A sourced library sets no shell options at all** — `plugin/hooks/lib/harness-config-lib.sh` and `cli/templates/scripts/lib/harness-run-lib.sh` both leave the sourcing script's shell exactly as they found it.
- **Never shell out to a recursive removal.** A user-level `permissions.deny` on `rm -rf` is realistic, deny is evaluated before any allow and cannot be overridden, so a teardown implemented as a shelled-out `rm -rf` is silently blocked with no useful error. Use an in-process removal (`cli/src/cli.ts` header; `cli/src/core/writer.ts`, whose single removal is called without `recursive`).
- **Never `git add -A` or `git add .`.** Staging is always an explicit repo-relative path set, passed to the commit wrapper, which stages exactly those paths (`plugin/agents/committer.md`).
- **A command an unattended run issues must be spellable as a literal.** A `$(…)`, a backtick, a pipe, a `<`, a `>` that is not a descriptor duplication or `/dev/null`, or a braced expansion other than a bare `${IDENT}` anywhere in the command string — a commit subject included — withdraws the script-allowlist guard's permit, and an unanswerable prompt in an unattended run is a stall (`plugin/hooks/autonomous-script-allowlist-guard.sh`).

## Plugin asset authoring

- **Every reference from one plugin asset to another is written `${CLAUDE_PLUGIN_ROOT}/<path>` — except a path a shell body *dereferences*.** Never a relative path, never a path assembled from a version, never a path into a sibling plugin: it is the only form correct under both a git-sourced install and a directory-sourced one, and it interpolates in agent bodies and in a hook's `command` string alike (`docs/development.md` → `## 2. The one authoring rule that follows`). The exception is the token's one dead spot — the runtime substitutes it into a hook's `command` string and does not export it into the resulting `bash` process, so a script that dereferenced it would break the moment anyone ran it by hand. A shell asset therefore resolves a sibling from `${BASH_SOURCE[0]}`, which is the form `## Shared code, and where it lives` above already requires of the sourced library, and it binds every guard and helper script here. Citing the token as **text** — in a header comment naming the asset that invokes this one — is the mandated citation form and is unaffected (`plugin/hooks/README.md` → `## The shared library`; `plugin/scripts/find-free-port.sh` → the `# Used by` line).
- **Every agent definition declares a `tools:` allowlist, and `model: inherit`.** An agent added with no `tools:` field inherits the full default tool set and silently re-opens browser access; a review rejects it. The allowlist is the whole mechanism — a `permissions.deny` backstop on the browser namespaces is forbidden, because a global deny is evaluated before any allow and would revoke the interactive-test agent's own grant (`plugin/agents/README.txt`).
- **`plugin/agents/` and `plugin/commands/` carry `README.txt`, not `README.md`.** Component discovery loads every `.md` file in those two directories as a component, so a `README.md` there fails `--strict` with `frontmatter: No frontmatter block found`. Every other directory that carries a README carries an ordinary `README.md` (`docs/development.md` → `## 3. Manifest facts a contributor must not rediscover`).
- **Add only manifest fields the validator recognizes.** `--strict` promotes an unknown field from a warning to an error, and the marketplace entry deliberately carries no `version` because `plugin/.claude-plugin/plugin.json` is the sole version of record (`docs/development.md` → `## 3. Manifest facts a contributor must not rediscover`).
- **An agent that cannot read a cited contract, sample or instruction file reports it** through its own `error:` / blocker return, naming the path and the refusal, and produces no artifact. A substitution is a finding, not a fallback (`plugin/agents/README.txt`).

## Documents of record

- **A measured fact states what was measured, the command and the exact message**, so a later version that behaves differently is detectable rather than merely surprising (`docs/development.md`, opening).
- **A deferral cites a numbered roadmap item, and the number owes a row.** The legend is `docs/development.md` → `## 6. The roadmap this tree defers to`; a deferral whose numbered roadmap item has no row there is a defect.
- **`examples/notes-app/` is two things with different obligations.** Its run artifacts under `sdlc-harness/` and the prose of its `.claude/` documents are a **frozen capture** of what the harness produced on a stated date — editing them falsifies the record rather than fixing it, and no criterion introduced after that date grades them. Its own source and toolchain are **live** and are maintained. Nothing there is a rule for this repository (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*).
- **This repository has adopted its own harness**, so `harness.config.json`, `.claude/`, `harness-runs/`, `scripts/` and `githooks/` at this root are `init`'s output in this checkout. A rule read off `harness-runs/` describes a run, not this project.

## The testing bar

**The runner is Node's built-in `node --test`**, over `cli/test/*.test.mjs`, with `node:assert/strict`. `cli/package.json`'s `pretest` compiles first, so **every test runs against the compiled CLI at `cli/dist/cli.js`** and always grades the source in the tree.

- **There is no mocking framework, and adding one is a decision raised as a `stale-rule` entry for a supervised `/harness-analyze` re-run or a hand edit, never a change an implementing run makes.** The substitutes in use are: a throwaway fixture repository built by the test under `os.tmpdir()` and torn down in process (`cli/test/helpers/fixture.mjs`); a subprocess run of the built CLI whose stdin is a pipe, which exercises the side of every prompt that *cannot* be asked; and constructor-injected sinks where a unit needs its output captured (`ReporterOptions`). **No fixture is ever created inside this checkout, and no test is ever aimed at this repository.**
- **A test file opens with the rule it exists to enforce**, stated in its header before any case — and where a documented behaviour is deliberately not covered, that header says which behaviour and why (`cli/test/daemon.test.mjs`, `cli/test/init.test.mjs`).
- **Assert against the contract stated literally, not against what generated the output.** The one deliberate inversion is the byte-for-byte comparison in `cli/test/outer-loop-scripts.test.mjs`, where *"copied verbatim, with no substitution"* is itself the contract; its header argues the exception.
- **Where behaviour cannot be reached from a behavioural test, guard the source instead** (`cli/test/prompt.test.mjs` reads `cli/src/core/prompt.ts` and asserts on its text). That is a last resort with its reason written down, not a first move.
- **The verification commands are the ones `harness.config.json` names**: `commands.typecheck` and `commands.test`, both of which must exit zero. Run a gate **without a pipe** — piping into a pager returns the pager's status, and a failing gate then reads as a passing one.
- **The full bar is `docs/development.md` → `## 5. Verifying a change`**, whose gates are the definition of done for a change in this tree: plugin and marketplace manifests under `--strict`, the CLI build and its invocations, the schema and its negative fixtures, `init` against a throwaway fixture, `doctor`'s exit contract, the self-containment sweep, the adoption shapes no fixture reaches, the analyze command in a session, and the example project. Read that section rather than this paragraph before claiming a change is verified; the automatable gates run unattended through `scripts/run-gates.sh`, which `commands.test` points at, and the rest are hand-run.
- **The self-containment gate binds every commit:** nothing in this tree may name a location on the machine that wrote it, and no generator template may have been committed into the adopter's own dot-namespace.

## What accompanies a new unit of each kind

| New unit | What must land with it |
|---|---|
| A module under `cli/src/` | A header comment stating what the module owns and, where it exists to hold a rule, that rule in the words *"The rule this module exists to enforce"*. Every file under `cli/src/` opens with one. |
| A CLI subcommand | Its `Subcommand` row in `SUBCOMMANDS`, a `summary`, and a case in the suite that runs it against a throwaway fixture. |
| A configuration key | The schema property, the model field with the schema's description condensed to one line, the check-module entry, the `docs/config.md` §5 row, and either a consumer or a written statement of which work delivers one. |
| A generated or copied artifact | Its row in `cli/src/core/writer.ts`'s re-run-contract table with its write policy, and an idempotence assertion — a second `init` must change nothing the first one wrote. |
| A negative schema fixture | Its file under `schemas/negative/` **and** its chained `ajv test … --invalid` assertion in `package.json` → `validate:config:negative`; a fixture no assertion wires in is never run. |
| A detection preset or signal row | A repository fixture shaped like that stack, added through `stackCase` in `cli/test/stack-presets.test.mjs` — a row can shadow or be shadowed silently, and a per-stack fixture is the only thing that catches it. |
| An agent definition | Frontmatter with `name`, `description`, `tools` and `model: inherit`; the instruction or command that dispatches it; and `${CLAUDE_PLUGIN_ROOT}`-rooted citations that resolve. |
| A guard hook | Its `hooks.json` registration, its own self-verifying top-level string filter, its row in `plugin/hooks/README.md`'s outcome table, and a reproduce-by-hand invocation that works. |
| An outer-loop script | Its row in the shipped table with `agentInvocable` set deliberately, the permission-profile entries that flag implies, and a deny-list entry where it must not be agent-runnable — `agentInvocable: false` alone withholds nothing. |
| A persisted machine-state key | Its constant in the module that owns that artifact, and — where a shipped template must know the same literal — that mirror declared in the owning module's header. |
| A prose document under `docs/` | Its own statement of who reads it and what it owns. |

## Commit-message policy

**Prefix vocabulary.** One token, `chore`, and it is reserved for the fixed-form subjects the flow emits for its own run artifacts. No other prefix token is in use in this repository.

**Per commit class, which prefix a commit of that class takes:**

| Commit class | Prefix |
|---|---|
| **Adding new work** — a story task's commit | **`none`** — no prefix and no `: ` separator; the subject is the description alone. |
| **Fixing existing work** — the class the review-fix loops commit in | **`none`**, on the same terms. |
| A run artifact the flow emits on its own behalf | The fixed form below, each of which carries `chore:`. |

**Capitalisation.** The first word after the prefix is **capitalized**. Where the prefix is `none`, the rule applies to the description's first word instead.

**Subject-length cap: 72 characters.** No source in this tree states a cap; this document sets it, and every subject in the repository's history clears it.

**Attribution trailers are forbidden.** No trailer naming an agent, a model or a session — no `Co-Authored-By:`, no `Claude-Session:`. This repository keeps a single commit identity, its history carries no such trailer, and the autonomous flows say so at every commit point they own (`plugin/instructions/task_plan_writing_instructions_autonomous.md`, `plugin/instructions/user_review_fixes_instructions_autonomous.md`: *"no `Co-Authored-By:` / trailer"*), enforced by the commit wrapper, which builds the message from the positional arguments after `--` only.

**Fixed-form subjects — exempt from the capitalisation rule and from the length cap, and passed byte-for-byte by the commit point that owns each.** Re-casing or truncating one breaks that commit point.

- `chore: Add branch statistics for <branch>`
- `chore: Add flow-progress ledger for <branch>`
- `chore: Add task plan for <branch>`
- `chore: Add UI-test plan for <branch>`
- `chore: Add user-review fix plan for <branch>`
- `chore: add code review for <branch>`
- `chore: add docs checklist for <branch>`
- `chore: add task prompt for <branch>`
- `chore: Flow progress <entry-id> for <branch>`
- `chore: Log dispatch additions for <branch>`
- `chore: Log improvement observations for <branch>`
- `chore: Mark UI test K passing for <branch>` — spelled with `N` in `plugin/instructions/plan_orchestration_instructions_core.md` and with `K` in `plugin/agents/committer.md`; both stand for the test number, substituted verbatim
- `chore: Record clarification digest for <branch>`
- `chore: Update branch statistics for <branch>`

**Provenance of that list, and the subjects it omits.** It is derived by the probe `docs`/`feat`/`fix`/`refactor`/`chore`/`test` over `${CLAUDE_PLUGIN_ROOT}` and `scripts`, not copied from anywhere, and is re-derived rather than carried over on any later pass. The probe reaches **branch-scoped** subjects only — it requires a `<branch>` / `$branch` / `${branch}` / `<entry-id>` / `K passing` token — so a fixed subject carrying none of them falls outside it, and widening the probe is part of the cost of adding one. Every subject the probe reaches and this list omits falls in one of two classes. **Forbidden:** `chore: add qa review for <branch>`, in `plugin/instructions/plan_orchestration_instructions_core.md`, whose own sentence tells the flow **not** to emit it (*"do **not** ask the committer to emit"*). **Worked examples, not commit points:** `chore: Add branch statistics for ${branch}`, quoted in a comment in `plugin/hooks/autonomous-script-allowlist-guard.sh`, and `chore: Flow progress A1.5f for <branch>`, the `e.g.` in `plugin/instructions/autonomous_pause_and_ledger.md` that substitutes a real `<entry-id>`; each subject they illustrate is on the list on its own emitting home's account.

**Changing any fixed subject is a multi-file edit.** `review_plan_file` and `ui_test_pass` are the committer's own modes and the dispatching flow files quote both; the flow's other commit points own theirs the same way.

## Reference implementation

**This project has a single implementation and is kept in parity with nothing.** `phases.parity` is `false` in `harness.config.json`, so no parity review runs and no finding may cite a reference source. `ARCHITECTURE.md` → `## 7. The seam: what an adapter would have to carry` describes a *hypothetical* second engine with its evidence attached; it is not a reference implementation to match, and nothing in this tree may be held to it.

## Not determined

- Application-UI conventions — the localization accessor, the theming and sizing accessors, the test-attribute convention an interactive test locates elements by and the shared helper that applies it — are not stated: nothing in this repository presents a user-facing surface for a rule to govern, and `phases.qa` is `false`, so no interactive-test phase runs here. What would settle all four: a change that adds such a surface, whose implementer raises the accessor, the helper and the attribute convention as a `stale-rule` entry for a supervised `/harness-analyze` re-run or a hand edit. The conventions documents under `examples/notes-app/.claude/context/` carry that project's own answers; they are a frozen capture of an adopted repository and are not rules for this one.
- The subject-length cap above is this document's number rather than one read off a source: no file in the tree states a cap, and the history was the only evidence available. What would settle it: a maintainer recording the intended cap here or in `docs/development.md`.
- Whether a **standalone** shell script — one that is neither a guard hook nor a sourced library — is required to use `set -euo pipefail` is not stated anywhere. The guard rule is settled and written down; the standalone rule is inferred from practice only. What would settle it: a line in `plugin/hooks/README.md` or `docs/development.md` stating the requirement for the standalone class.
- What an implementer should do with the configuration keys `forge` and `design.source` is not settled: both are declared in the schema and documented with no consumer and no reporter, and `docs/development.md` → `## 6` records that as a standing debt rather than an oversight. What would settle it: the forge coupling and the design-source coupling landing with their readers, at which point this document states which values mean what.
- The field names and value units of an evaluation case are not a rule yet: `evals/README.md` states that the `case.yaml` envelope is known from `--help` output alone and is provisional until measured against the real runner. What would settle it: one run against the runner, after which the envelope is recorded in that README.
- Whether the `set -f` that accompanies `set -u` in most guards is required of **every** guard, or only of those that handle an unquoted target, is not stated as a rule — each guard that sets it argues its own case in its own header. What would settle it: a line in `plugin/hooks/README.md` making it a directory-wide requirement or explicitly leaving it per-guard.

_Written by `/harness-analyze` in `existing` mode, from `harness.config.json`, `package.json`, `cli/package.json`, `cli/tsconfig.json`, `.gitattributes`, `cli/src/` (`cli.ts`, `core/errors.ts`, `core/report.ts`, `core/writer.ts`, `core/paths.ts`, `core/repoPaths.ts`, `core/git.ts`, `commands/registry.ts`, `commands/init.ts`, `config/model.ts`, `config/check.ts`, `machine/registry.ts`, `machine/paths.ts`), `cli/templates/scripts/autonomous-watcher.sh`, `cli/test/` (`helpers/fixture.mjs`, `init.test.mjs`, `doctor.test.mjs`, `daemon.test.mjs`, `outer-loop-scripts.test.mjs`, `profile.test.mjs`, `prompt.test.mjs`, `stack-presets.test.mjs`, `config-command.test.mjs`), `plugin/agents/` (`README.txt`, `committer.md`, `task-plan-writer.md`, the frontmatter of every definition), `plugin/commands/README.txt`, `plugin/instructions/` (`README.md` and the autonomous commit points), `plugin/hooks/` (`README.md`, `lib/harness-config-lib.sh`, the guards' headers), `plugin/scripts/` (`reserve-qa-user.sh`, `release-qa-user.sh`), `schemas/harness.config.schema.json`, `schemas/negative/`, `docs/development.md`, `docs/config.md`, `docs/cli.md`, `evals/README.md`, `examples/notes-app/README.md`, this repository's commit history, and the fixed-form-subject probe over `${CLAUDE_PLUGIN_ROOT}` and `scripts`._
