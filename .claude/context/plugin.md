# `plugin` layer conventions

> **Read this when:** you are changing anything under `plugin/` — an agent definition, a `branch-*` or `/harness-analyze` slash command, an instruction core or fork, a guard hook or its shared library, a QA helper script, a sample fixture, or a flow document. **Skip when:** your change is confined to `cli/` or to the repository root. Either way read `.claude/context/conventions.md` first: this document assumes it and never repeats it.

**Purpose.** What `plugin/` is, where a new asset goes, the sections and wires every asset carries, and how a change here is verified. Every rule that also binds `cli/` is owned by `.claude/context/conventions.md`; this document states only this layer's own consequences of those, plus the rules that hold nowhere else.

## What this layer is

`plugin/` is the Claude Code plugin: prose contracts and `bash` guards, and **no executable product code**. `.claude/context/conventions.md` → `## The stack, in the words the rules below use` owns the stack statement, and `## The layers` owns the boundary that neither shipped half may reach into the other at run time. Two consequences bind every file here:

- **An asset is read by an agent at run time, so its text is its behaviour.** A heading, a field name, a placeholder spelling and a quoted literal are interface, not presentation. `.claude/context/conventions.md` → `## The layers` → `### The order files are created, so a half-built feature is still coherent` owns the rename rule that follows from it.
- **No adopter's value is ever a literal here.** A branch name, a directory name, a command name, a locator convention or a commit subject belongs to the adopting repository's configuration or to its own conventions documents; this tree writes the placeholder and resolves it at run time. `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` owns the rule. This is why `plugin/agents/ui-tests-plan-reviewer.md` grades a UI-test plan against *"the surface layer's test-attribute locator convention"* rather than naming one: the locator convention, the localization accessor, the theming accessors and the storage-key constants are the adopting project's to state, and an asset that named one would be wrong in every repository but the one it was copied from.

## Where a new asset goes

| The new thing is… | It goes in |
|---|---|
| a role the flow dispatches as a sub-agent | `plugin/agents/<name>.md` |
| a slash command a user or the watcher invokes | `plugin/commands/<slash-command-name>.md` |
| flow prose an agent or command loads | `plugin/instructions/` |
| a `PreToolUse` decision about a Bash command | `plugin/hooks/`, registered in `plugin/hooks/hooks.json` |
| code two or more guards need | `plugin/hooks/lib/harness-config-lib.sh` |
| a shell helper an instruction or agent body invokes by path | `plugin/scripts/`, and declared in `plugin/scripts/README.md` |
| a worked artifact shape an asset dereferences instead of restating | `plugin/samples/` |
| a statement of the plugin's own loop | `plugin/docs/` |

**A shell wrapper an adopting repository runs is not a plugin asset.** The commit, push, worktree, watcher and notifier wrappers ship from `cli/templates/scripts/` and are named by their `<scripts_dir>/` destination; only a script resolved from the plugin root belongs in `plugin/scripts/` (`plugin/scripts/README.md` → *"Note the split deliberately"*).

## Naming

- **An agent definition's `name:` field is its file basename** (`plugin/agents/committer.md` → `name: committer`) — a frontmatter-to-filename tie that holds nowhere else in the tree. The file-name patterns themselves, for an agent definition and for a command carrying its slash-command name, are owned by `.claude/CLAUDE.md` → `## File naming conventions`.
- An instruction family spells its mode-free core `<family>_instructions_core.md` and each fork `<family>_instructions_<mode>.md` beside it (`plugin/instructions/task_plan_writing_instructions_core.md`, `…_semi_autonomous.md`, `…_autonomous.md`). A file with no mode fork and no family drops the `_instructions` infix (`plugin/instructions/unit_loop_core.md`, `plugin/instructions/mode_contract.md`).
- A supervised item-loop flow carries the family name with **no** suffix and is not a core: `plugin/instructions/plan_orchestration_instructions.md` and `plugin/instructions/user_review_fixes_instructions.md` are a different loop, and `plugin/instructions/mode_contract.md` → `## Which files use this` says so. Do not bind either as if it were one.
- **A sample fixture's per-item files sit in a sibling directory carrying that fixture's stem** (`plugin/samples/sample_story_plan.md` with `plugin/samples/sample_story/task_1_plan.md`). The stem's own pattern is owned by `.claude/CLAUDE.md` → `## File naming conventions`.

## Frontmatter

- **An agent definition carries exactly `name`, `description`, `tools` and `model`, and no other key.** `.claude/context/conventions.md` → `## Plugin asset authoring` owns the `tools:` allowlist requirement and `model: inherit`; the closed key set is this layer's addition, and `plugin/agents/README.txt` states why a `README.md` may not sit beside them.
- **The allowlist is the agent's stated output surface, not a convenience set.** An agent that returns its findings to the caller and writes no file carries no `Write` and no `Edit`, and says so in its own body — *"that omission is deliberate: it makes the read-only guarantee tool-level rather than a prose request"* (`plugin/agents/conventions-reviewer.md`). Widening an allowlist past what the `## Output contract` produces is a finding.
- **`description:` states what the agent does, whether it is read-only, who dispatches it, and any phase gate it runs under** (`plugin/agents/docs-reviewer.md`, `plugin/agents/business-parity-reviewer.md`). It is the text a dispatcher selects on, so it is written for selection rather than for summary.
- **A command carries `description:`, and `argument-hint:` exactly when it takes an argument** (`plugin/commands/branch-answer.md`); it declares no `tools:` and no `model:`.
- **A flow document under `plugin/docs/` carries no frontmatter either.** `.claude/context/conventions.md` → `## The stack, in the words the rules below use` owns the instruction-file half of this; the flow documents extend it. Both are loaded by an asset that already carries its own fence, and adding one here makes the file something component discovery parses.

## The sections an asset carries

- **Every agent, command and instruction file an asset loads carries a `## Resolved values` table**, declaring each configuration- or runtime-derived token once, ahead of the body that uses it as an ordinary placeholder. A directory README is not one of those files (`plugin/instructions/README.md`), because it declares no tokens and nothing loads it at run time. Ordinary path placeholders are deliberately left out of the table and resolved by the body's own text at their point of use.
- **A dispatchable agent carries `## Invocation contract` and `## Output contract`.** A declared-but-unimplemented variant carries neither, because it consumes no argument and produces no artifact — it gates and returns its blocker (`plugin/agents/qa-tester-mobile-maestro.md`, `plugin/agents/qa-tester-mobile-mcp.md`).
- **An agent a dispatch-discipline-bound caller sends out *to grade* carries `## Unsolicited dispatch guidance`.** The roster is fixed in one place and is not re-derived per agent: `plugin/instructions/dispatch_discipline_instructions.md` → `## The receiving side — the roster that carries the backstop`, which also states the two exclusions and their reasons. An agent that produces work rather than grading it carries no such section.
- **`## Read first` is where an agent names the input it must load before acting, and states that an unreadable one is reported rather than worked around** (`plugin/agents/layer-implementer.md` → `## Read first`). `.claude/context/conventions.md` → `## Plugin asset authoring` owns the report-don't-substitute rule itself.

## The placeholder vocabulary

- **A placeholder is `<snake_case>` in angle brackets, and its spelling is its identity** — `<state_dir>`, `<repo_root>`, `<layer_path_map>`, `<default_branch>`. There is no second name for a token and no mapping layer: the token in the body is the token in the table.
- **`## Resolved values` is a three-column table — `| Token | Class | How to resolve it |`** — and `Class` is drawn from `config value`, `derived at runtime`, `conventions document` and `generated at init` (`plugin/agents/docs-writer.md`; `plugin/agents/committer.md`, whose `<commit_conventions>` row is the `generated at init` case). A token that resolves from somewhere else needs a class stated, not a blank cell.
- **Two `<…>` vocabularies exist and conflating them is silent.** A **mode-contract binding** resolves from the citing flow's fork and an unbound one halts the flow; every other `<…>` name is a **path placeholder** and resolves from the flow's own entry core `## Setup`, however many core→core citations deep the text sits. `plugin/instructions/mode_contract.md` → `### Bindings vs. path placeholders` owns both, and a shared file reached by two cores records per section or per row whose `## Setup` owns its paths (`plugin/instructions/unit_loop_core.md` → `### Placeholder resolution`).
- **A run-artifact path shape is a wire, not a convenience.** `question_<n>.md` / `answer_<n>.md` and their index pairing are keyed on by the outer-loop watcher, and `<state_dir>/dispatch_additions/<branch>.md` is one file per branch by design; each is owned by the file that states it (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`; `plugin/instructions/dispatch_discipline_instructions.md` → `## The record — where an addition is written`). Changing a shape is a change to every reader of it, inside this tree and outside it.

## Wires: dispatch in, return out

- **Dispatch argument names and return field names are byte-stable.** A renamed or reordered field breaks the caller's parse silently, and the assets that own a wire say so in their own words — *"Field names byte-stable"* (`plugin/agents/conventions-writer.md` → `## Output contract`). Decorating, translating or reordering one is the same edit as deleting it.
- **A missing dispatch value is a stop, never a guess.** Read the values out of the prose however they are worded; when a required one is absent, return a blocker naming it and stop — never widen a scope and never substitute another input (`plugin/agents/layer-implementer.md`, `plugin/agents/conventions-writer.md`).
- **A return is a fenced block of `key: value` lines, and the discriminator is the literal rather than the prose.** A grading agent returns `verdict: PASS` or `verdict: FAIL`; a blocked one returns a single-line `error:` or `blocker:` in the form its own contract fixes, and a marker inside that line — `prohibited` in `plugin/agents/layer-implementer.md` — is a wire the caller discriminates on, not a description (`plugin/agents/layer-reviewer.md`, `plugin/agents/committer.md` → `## Output contract`).
- **Narration surfaces are prescribed, and an asset adds none of its own.** The pre-dispatch heartbeat line of a core's `## Safety contract — applies before EVERY Agent dispatch`, the Done-summary disclosure line (`plugin/instructions/dispatch_discipline_instructions.md` → `## The disclosure line`), and a guard's single JSON object are the channels; `.claude/context/conventions.md` → `## Output, logging and errors` owns the guard's output contract.
- **The committed artifact is the source of truth across a session boundary; the transcript is not.** Anything an orchestrator adds to a dispatch prompt is written to a durable record before the phase ends and before any phase-completion marker, because a write that lands after one is skipped by a resume and lost with it (`plugin/instructions/dispatch_discipline_instructions.md` → `## Write point — once per phase, never per dispatch`).
- **An orchestrator's addition to a dispatch prompt is knowledge or it is barred.** Facts the receiving agent cannot derive travel on a trailing `context_notes:` line; attention-steering, verdict or severity calibration, scope narrowing and output calibration are conclusions and are refused (`plugin/instructions/dispatch_discipline_instructions.md` → `## Knowledge, not conclusions — the boundary`, and the section that file itself cites as the backtick-clean short form `## The sanctioned form`).

## Cores, forks and the single-owner rule

`.claude/context/conventions.md` → `## Shared code, and where it lives` owns the core/fork split. This layer's mechanism is `plugin/instructions/mode_contract.md`, and its five numbered rules bind every instruction file:

1. **No defaults** — a core supplies no binding value, a fork binds every binding its core declares, and an unbound binding halts the flow.
2. **Read-order independence** — a fork carries its binding values inline, never by pointer and never in a third file; neither file is complete alone.
3. **Additions stay in the fork** — mint a binding only where the core cannot state the behaviour mode-free, or where the value is a mode-specific literal.
4. **Cores are literal-free** — no reader-naming escalation phrase, no slash-command name, no absolute machine path, no step any mode deletes.
5. **A core may cite another core by reference and may never copy it** — a copy creates a second owner of the contract.

**A fork→fork citation is admissible only under a class `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors` already names; anything else is a Must Fix.** That enumeration is closed and the list of non-fork citers is not, so re-derive the citing set by grep before renaming, relocating or dissolving an anchor.

**A policy file is activated by pointer and never restated.** `plugin/instructions/dispatch_discipline_instructions.md` → `## Activation` fixes which documents may point at it, and a citer that paraphrases it becomes a second owner. The same rule governs every shared module here.

## Registries — a name routed to an implementation

Each of these is a single list with no second list beside it, and a new member is added to the list rather than announced somewhere else:

- `plugin/hooks/hooks.json` — every guard, under the `{"hooks": { … }}` wrapper (`.claude/context/conventions.md` → `## Registries and dispatch tables` owns the wrapper fact).
- `plugin/instructions/mode_contract.md` → `## Which files use this` — the files that declare bindings against the vocabulary; and `### Sanctioned cross-fork anchors` — the preserved fork→fork citations.
- `plugin/instructions/dispatch_discipline_instructions.md` → `## Activation` — the documents that may activate that policy; `## The receiving side — the roster that carries the backstop` — the agents that carry the receiving-side rule.
- `plugin/scripts/README.md` — the helper scripts an asset may invoke by path, which the generated permission profile's interactive-test fragment sends an adopter to rather than repeating.
- `plugin/hooks/README.md` → `## The deny list` — the basenames the script-allowlist guard withholds a permit from.

## Citation

- **An intra-plugin reference is `${CLAUDE_PLUGIN_ROOT}/<dir>/<file>`**, owned by `.claude/context/conventions.md` → `## Plugin asset authoring`. Three consequences are this layer's:
  - **The token's dead spot in a script body is what a by-hand reproduction runs into.** `.claude/context/conventions.md` → `## Plugin asset authoring` owns the dereference exception, the `${BASH_SOURCE[0]}` resolution that follows from it, and the text-citation form. This layer's addition is the cost: `plugin/hooks/README.md` → `## Reproducing a decision by hand` asks a reader to run a guard directly, which is the invocation a dereferencing body would break. The text form is what a helper's header comment carries, naming the instruction file that invokes it (`plugin/scripts/find-free-port.sh` → the `# Used by` lines).
  - **A citation names the file *and* the heading it is taking content from** — `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The unit loop`. A cited heading is therefore a wire: carry its text across byte-identical when the section moves, because a rename strands every citer while a relocation only repoints them.
  - **Anything outside the plugin is cited by its repo-relative path plus, where one exists, a symbol anchor** — never as a `${CLAUDE_PLUGIN_ROOT}` path, because an installed plugin's runtime root contains only `plugin/` (`plugin/docs/README.md`; `plugin/commands/harness-analyze.md` → the `cli/src/doctor/checks.ts` (`LAYER_PROFILE_CHECK`) citation).
- **A README in this tree cites repo-relative**, because the commands it hands a reader are run from the checkout root (`plugin/hooks/README.md` → `## Reproducing a decision by hand`; `plugin/agents/README.txt` → `Sample fixture pointers — never rewrite one to make it resolve`).
- **A symbol anchor, a heading or a short quoted substring — never an exact line number, in any shape.** A renamed symbol fails loudly; a shifted line fails silently, and a line coordinate written into a durable artifact is a review finding on its own (`plugin/agents/docs-reviewer.md`; `plugin/agents/layer-reviewer.md`; `plugin/agents/conventions-writer.md` → `## House rules`).

## Guards, the shared library and the helper scripts

`.claude/context/conventions.md` → `## Shell assets` and `## Output, logging and errors` own the shebang, the `set -u` / never `set -e` rule, the sourced-library rule and the at-most-one-JSON-object output contract. This layer adds:

- **Every shell file here opens with a `# <basename> — <what it is and what it decides>` header comment and carries a `REPRO` block** that reproduces each of its outcomes by hand (`plugin/hooks/git-commit-branch-guard.sh`, `plugin/scripts/find-free-port.sh`). The header is where a per-case refusal, an accepted cost and the defect a shape already fixed are recorded; the directory README carries only the contract they share.
- **Silence is a decision, and it is written down before it is relied on.** A guard's behaviour with no configuration, with an unresolvable one and with an unparseable payload belongs in `plugin/hooks/README.md` → `## Fail closed — and what that means for an allow-only guard`; jurisdiction is settled in `## Jurisdiction: no config, no opinion`, and the repository a guard judges is resolved from the command it was handed under `## Which repository a guard judges` — never from a hardcoded path and never from an assumed session root.
- **A guard never re-derives a shared answer.** `.claude/context/conventions.md` → `### Where a new responsibility goes` owns `plugin/hooks/lib/harness-config-lib.sh`'s monopoly and names the answers it covers. Two more answers belong to that same library and are this layer's addition to the monopoly rather than a second statement of it: the compound splitter every guard shares (`hc_split_command`) and the `hc_piece_is_never_safe` refusal every allow-only guard calls before any other test (`plugin/hooks/README.md` → `## The shared library`). No two guards may apply a different definition of the workspace, and a guard that needs a second copy of one needs the library to grow instead.
- **A change to any guard or to the library re-measures itself in `docs/guard-verification.md`**, which is where the per-Bash-call cost and the cross-guard matrices live — a single reproduced decision cannot show either (`plugin/hooks/README.md`, closing paragraph).
- **A helper script under `plugin/scripts/` states its exit-code contract where callers branch on it**, and is declared in that directory's README, which is the list the generated permission profile points an adopter at (`plugin/scripts/README.md`, the `reserve-qa-user.sh` and `release-qa-user.sh` entries).

## Sample fixtures

- **The fixtures describe one coherent worked branch, and that is a constraint rather than a presentation choice**: they cite each other by task number, finding number and quoted title, and the statistics report's arithmetic is derived from the story index and the user review. A fixture edited in isolation breaks the set, so a change to a task title, a finding number or a `_(points: …)_` tag is checked against every file that names it (`plugin/samples/README.md`).
- **A pointer is the contract in both directions.** A reference that does not resolve means the fixture is missing and must not be rewritten, softened or deleted to make the mismatch go away; regenerate the demand and diff it against what ships, both ways (`plugin/agents/README.txt` → `Sample fixture pointers — never rewrite one to make it resolve`).

## What accompanies a new unit of each kind

`.claude/context/conventions.md` → `## What accompanies a new unit of each kind` owns the rows for an agent definition and a guard hook. This layer's remaining kinds:

| New unit | What must land with it |
|---|---|
| A slash command | Its `description:`, an `argument-hint:` where it takes an argument, a `## Resolved values` table, a `## Steps` section, and the instruction file it loads. |
| An instruction core | Its `## Resolved values` table, the binding set it declares against `plugin/instructions/mode_contract.md`, and freedom from every literal class rule (4) names. |
| A mode fork | Its core named explicitly, a binding value inline for every binding that core declares, and its own statement of what it does **not** redefine (`## What this fork does NOT redefine` in `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md`; `## What this file does NOT redefine` in `plugin/instructions/task_plan_writing_instructions_autonomous.md`). |
| A shared instruction module | Its own activation or citation rule fixing who may point at it, and the roster of those documents inside the module itself. |
| A helper script under `plugin/scripts/` | Its header, its `REPRO` block, its exit-code contract, and its entry in `plugin/scripts/README.md`. |
| A sample fixture | Its place in the one worked branch, and at least one asset that dereferences it as `${CLAUDE_PLUGIN_ROOT}/samples/<file>`. |
| A `qa.driver` value | Its own agent file with valid frontmatter and its own allowlist, the driver gate in `plugin/agents/qa-tester.md` that returns a blocker naming the configured driver, and the configuration key that selects it. |
| A document under `plugin/docs/` | Its own `**Who reads this:**` statement and what it owns, plus what it cites rather than restates (`plugin/docs/AUTONOMOUS_FLOW.md`, `plugin/docs/README.md`). |

## Verifying a change in this layer

- **The manifest gate is `claude plugin validate --strict plugin`, with the marketplace manifest beside it** (`docs/development.md` → `## 5. Verifying a change`, the **Gate 1 — manifests.** paragraph). `.claude/context/conventions.md` → `## Plugin asset authoring` owns the unknown-field rule that gate enforces, and `## The testing bar` owns the full bar a change must clear.
- **A change to a wire is verified by the grep that re-derives its readers**, not by reading the file you changed (`.claude/context/conventions.md` → `## The layers` → `### The order files are created, so a half-built feature is still coherent` owns the rule and the sweep it prescribes). The corpus ships its own sweeps for the recurring cases — the sample-pointer pair in `plugin/agents/README.txt`, the anchor sweeps in `plugin/instructions/mode_contract.md`, and the `AUTONOMOUS_FLOW` citer sweep in `plugin/docs/README.md`.
- **A shell change is verified by running the file's own `REPRO` block against a throwaway `git init` fixture carrying a `harness.config.json` and two branches**, never against a real checkout (`plugin/hooks/README.md` → `## Reproducing a decision by hand`).
- **A mocking idiom an asset prescribes is aimed at the application under test, never at this tree**: `mcp__playwright__browser_route`, and only where the UI-test detail file calls for it and the run grants the tool (`plugin/agents/ui-tests-plan-writer.md`, which owns the capability tagging; `plugin/agents/qa-tester.md`, which owns the call). Nothing under `plugin/` is itself stubbed or faked by an asset here.

## The commit-message policy

Owned entirely by `.claude/context/conventions.md` → `## Commit-message policy`, including the fixed-form subjects the flow emits. This layer's consequence: a fixed subject is quoted byte-for-byte by the commit point that owns it, so re-casing, truncating or re-wording one here breaks that commit point (`plugin/agents/committer.md`).

## A worked example

The token-declaration form every asset in this tree uses, quoted from `plugin/instructions/mode_contract.md` → `## Resolved values`:

```markdown
| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
```

Three of this document's rules are visible in that one row: the token is `<snake_case>` and is spelled the same everywhere the body uses it; the `Class` cell names where the value comes from rather than leaving it to the reader; and the cell states the adopter's **key** (`stateDir`) instead of this repository's **value** (`harness-runs`), so the file is correct in every adopting repository.

## Not determined

- Whether a change under `plugin/` is ever required to land with an automated assertion is not stated: `docs/development.md` → `## 5. Verifying a change` gates this tree with the manifest validation alone, and every other check the assets here declare is a grep sweep or a hand-run `REPRO` block. What would settle it: a line in that same section stating whether a plugin-asset change owes a `cli/test/` assertion, or stating that the manifest gate plus the declared sweeps are the whole bar.
- Application-UI conventions — the localization accessor, the theming and sizing accessors, the test-attribute locator convention and the shared helper that applies it, the navigation module and its route and screen registries, and the storage-key constants — have no owner in this layer, and the tree states that as a rule rather than leaving it open: no adopter's value may appear as a literal here (`plugin/hooks/README.md` → *"No branch name is baked into any of these files"*), and the asset that grades a UI-test plan reads *"the surface layer's test-attribute locator convention"* from the adopting project instead of naming one (`plugin/agents/ui-tests-plan-reviewer.md`). What would settle them for an adopting project is that project's own conventions documents, not this one; `.claude/context/conventions.md` → `## Not determined` records why this repository answers none of them either.
- **Which sections a definition owes is fixed nowhere in this tree**, and two questions rest on that one gap: whether the recurring `## Resolved values`, `## Invocation contract`, `## Output contract` and `## Read first` set is a stated requirement or an observed shape, and whether a declared-but-unimplemented variant's omission of the contract pair is the rule for that class (`plugin/agents/qa-tester-mobile-maestro.md` and `plugin/agents/qa-tester-mobile-mcp.md` carry `## What this variant would drive` instead, and `plugin/agents/README.txt` describes what each file holds without saying whether the omission is the rule). Only `## Unsolicited dispatch guidance` has a stated roster, in `plugin/instructions/dispatch_discipline_instructions.md`. What would settle both: one line in `plugin/agents/README.txt` — which already owns the directory-wide allowlist and pointer rules — stating which sections a definition owes, which are optional, and which set a stub owes.

_Written by `/harness-analyze` in `existing` mode, from `plugin/.claude-plugin/plugin.json`, `plugin/README.md`, the frontmatter of every file in `plugin/agents/` and `plugin/commands/` and the bodies of `committer.md`, `conventions-reviewer.md`, `conventions-writer.md`, `docs-reviewer.md`, `docs-writer.md`, `layer-implementer.md`, `layer-reviewer.md`, `qa-tester.md`, `qa-tester-mobile-maestro.md`, `qa-tester-mobile-mcp.md`, `ui-tests-plan-writer.md`, `ui-tests-plan-reviewer.md` and `harness-analyze.md`, `plugin/agents/README.txt`, `plugin/commands/README.txt`, `plugin/instructions/README.md` with `mode_contract.md`, `dispatch_discipline_instructions.md` and `unit_loop_core.md`, `plugin/hooks/README.md`, `plugin/hooks/hooks.json`, the shebangs, `set`-option lines and headers of every file under `plugin/hooks/` and `plugin/scripts/`, `plugin/scripts/README.md`, `plugin/samples/README.md` and the sample-pointer sweep, `plugin/docs/README.md` and `plugin/docs/AUTONOMOUS_FLOW.md`, `harness.config.json`, `docs/development.md` → `## 5. Verifying a change`, and `.claude/context/conventions.md` as the vocabulary anchor; corrected on the corpus pass against `.claude/context/conventions.md` and `.claude/CLAUDE.md`, which own four rules this document had restated._
