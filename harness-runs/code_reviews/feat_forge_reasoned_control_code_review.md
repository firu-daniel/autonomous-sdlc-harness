# Code Review: feat_forge_reasoned_control

## Context

**Branch:** `feat_forge_reasoned_control`
**Date:** 2026-10-07
**Reviewed:** the whole branch diff against `dev`: 25 files, +2014 / −111. 23 run-artifact files excluded from the reviewed diff. The review covers:
- the mention path in `cli/templates/scripts/remote-run.sh`: intake, `control_mention`, the context directory, the session, extraction, validation and the answers routed through the existing verb arms;
- the comment-only credential, the agent CLI and the pinned-plugin steps in `cli/templates/github/workflows/harness-control.yml`;
- the new names in `cli/src/remote/githubActions.ts`, and the `forge` check and closing report in `cli/src/doctor/checks.ts` and `cli/src/commands/init.ts`;
- the new plugin command `plugin/commands/harness-read-mention.md` and its instruction file `plugin/instructions/mention_reading.md`;
- the documents of record: `docs/github-run-control.md` §1, §3, §6 and §8, `docs/development.md` Gate 12 (xiv) leg (j), `docs/remote-execution.md`, `ARCHITECTURE.md`, `README.md`, `llms.txt`, and the plugin READMEs and whiteboard.

**Tests.** Every new behaviour ships with a case: `cli/test/remote-control-mention.test.mjs`, plus additions to `remote-names`, `doctor`, `workflow-templates`, `remote-control` and `trigger-workflow-init`. This review ran no suite; whether they pass is for the gates to establish.

**Earlier findings.** The three architecture-review findings, recorded on this branch at `cb32a81`, `7609180` and `6dcd934`, are fixed in the tree: the `agentModel` model, the plugin-side citations and the `ARCHITECTURE.md` launch row.

**Parity.** `phases.parity` is `false`, so nothing was cross-checked against a reference implementation.

**Sweep.** The Pass 0 sweep found no line coordinates, no `console` / `process.exit` and no absolute machine path among the added lines. Every new export in `cli/src/remote/githubActions.ts` has a reader in `cli/src` or in the mirror test `cli/test/remote-names.test.mjs`, except the type `MentionAction`, which follows the existing `CommandVerb` / `RunState` precedent.

**Plugin layer.** The two new `plugin` units and the four edited `plugin` files were checked against `.claude/context/plugin.md`, and all of them pass. No finding is filed.
- **Slash-command accompanying set** (`## What accompanies a new unit of each kind`). `plugin/commands/harness-read-mention.md` carries `description:`, a `## Resolved values` table (three columns, `Class` = `derived at runtime`), a `## Steps` section, and the instruction file it loads, `${CLAUDE_PLUGIN_ROOT}/instructions/mention_reading.md`. It has no `argument-hint:`, which is correct: its `## Context` states *"No argument"*.
- **Frontmatter** (`## Frontmatter`). The command declares no `tools:` and no `model:`. Its `## Context` says why: the read-only toolset is set by the invoker's `--tools` under `--restricted`. `mention_reading.md` has no frontmatter fence (`.claude/context/conventions.md` → `## The stack, in the words the rules below use`). It also has its own `## Resolved values` table. The file has no mode fork and no family, so dropping the `_instructions` infix is consistent with `## Naming`.
- **Return wire** (`## Wires: dispatch in, return out`). `mention_reading.md` → `## Output contract` returns one JSON object rather than a fenced `key: value` block. It keeps the two rules that make a wire safe. First, its field names are stated as byte-stable. Second, the discriminator is the literal `action` value and never prose. The departure is acceptable, for two reasons. The rule targets a return that a dispatching flow parses, but this reader is a script that consumes the session's structured output under `--json-schema`. And the multi-line Markdown in `answer` and `text` cannot travel byte for byte on a single `key: value` line. The file names both counterparts, `remote-run.sh` (`control_mention`) and `githubActions.ts` → `MENTION_ACTIONS`, and both resolve.
- **Citation** (`## Citation`). Intra-plugin references use `${CLAUDE_PLUGIN_ROOT}/…` with a heading or a quoted substring, and every quoted substring resolves: *"A substitution is a finding, not a fallback"* in `plugin/agents/README.txt`, and *"Field names byte-stable"* in `plugin/agents/conventions-writer.md`. References outside the plugin are repo-relative with a symbol or heading anchor: `docs/github-run-control.md` → `## 1. Commands in a comment`, `cli/src/remote/githubActions.ts` → `COMMAND_HANDLE` / `MENTION_ACTIONS`, and `cli/templates/scripts/remote-run.sh` (`control_mention`). Neither file has a line coordinate. The edited READMEs cite repo-relative.
- **README and count updates** (story-plan register rows 54, 60, 62–65, 67–69). All are present in the diff and true against the tree:
  - `plugin/instructions/README.md`: the `harness-*` loader sentence, and *"twenty-four of the twenty-eight"*.
  - `plugin/commands/README.txt`: *"chiefly"* the `branch-*` entry points, plus the `harness-read-mention` sentence.
  - `plugin/README.md`: the opening enumeration, and *"the first command there that is not a `branch-*` entry point"* followed by the second.
  - `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`: rows 2 and 3, and the counts paragraph.

  A re-derivation with `ls` gives the counts those files state: 21 `.md` files in `plugin/commands/`, of which 19 are `branch-*`; 29 in `plugin/instructions/`, which is 28 plus the README; and 22 in `plugin/agents/`.

**Headline.** The closed decision set, its script-side validation and the routing of every state change through an existing arm are sound. What is left concerns the boundary behind them:
- the `--restricted` confinement that the read-only closure depends on is never observed by any gate (Finding 1);
- what a confinement failure would expose is understated, and the job's token is outside the credential check (Finding 2);
- one log line carries unvalidated agent output (Finding 3);
- one mirror is declared on one side only (Finding 4).

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. Only the committing role flips a marker to `[x]` as that fix's commit lands: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. A `[ ]` marker anywhere else, such as a sub-step bullet inside a per-finding file, is informational only and is never the iteration source.

Each entry resolves to `harness-runs/code_reviews/feat_forge_reasoned_control_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading number is the fix order; `K` is the finding's stable identity.

1. [x] **Finding 4** — Declare `harness-control.yml`'s reads of the `HARNESS_CLI_VERSION:` line and the release-tag shape in `harness-run.yml`'s `DECLARED MIRRORS` _(layer: cli)_
2. [x] **Finding 3** — Strip line breaks from the agent's `action` and `verb` before the decision log line prints them _(layer: cli)_
3. [ ] **Finding 1** — Add a Gate 12 (xiv) leg (j) step that observes the `--restricted` confinement, and point the `## 8` row at it _(layer: general)_
4. [ ] **Finding 2** — Add the job's token to the credential-value check, and state in `## 6` and `## 8` that the check catches verbatim copies only _(layer: cli, general)_

---

## Must Fix

### 1. No Gate 12 step observes the `--restricted` confinement that the mention session's read-only boundary depends on
→ [finding_1.md](feat_forge_reasoned_control_code_review/finding_1.md)

### 2. The credential-value check ignores the job's own token, and `## 8` overstates what the check contains
→ [finding_2.md](feat_forge_reasoned_control_code_review/finding_2.md)

---

## Should Fix

### 3. The decision log line prints the agent's raw `action` and `verb` before validation, so a newline in either can inject a workflow command
→ [finding_3.md](feat_forge_reasoned_control_code_review/finding_3.md)

### 4. `harness-run.yml`'s `DECLARED MIRRORS` does not declare the two things `harness-control.yml` now reads from it
→ [finding_4.md](feat_forge_reasoned_control_code_review/finding_4.md)

---

## Nice to Have

None.

---

## Intentional divergences to confirm

None. `phases.parity` is `false`, so there is no reference implementation to diverge from.
