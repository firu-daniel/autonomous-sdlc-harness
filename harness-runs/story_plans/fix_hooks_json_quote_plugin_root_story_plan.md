# Story: Quote `${CLAUDE_PLUGIN_ROOT}` in the guard hook commands

## Context

Gate `1a plugin manifest` (`claude plugin validate --strict plugin`, `scripts/run-gates.sh`) fails on every run. The installed Claude Code warns once for each of the six `PreToolUse` commands in `plugin/hooks/hooks.json`, each written `bash ${CLAUDE_PLUGIN_ROOT}/hooks/<guard>.sh`, that the placeholder is used without quotes, and `--strict` turns each warning into an error. The warning also names a real defect: under a plugin path containing a space, bash splits the command, the guard script is never found, and the hook errors out instead of judging the tool call. This branch fixes the six command strings and records the decision where this repository keeps its measured manifest facts.

**The chosen form is the double-quoted placeholder, with the whole script path inside the quotes.** Each command becomes the JSON string `"bash \"${CLAUDE_PLUGIN_ROOT}/hooks/<guard>.sh\""`: shell form stays, only quoting is added. The reasons, which Task 2 records in `docs/development.md` §3 as the decision of record together with the measurements, and which Task 1's `plugin/hooks/README.md` bullet states only in short, pointing at §3: the hook is still `bash <script>` run by a shell, so the payload still reaches the script on stdin and its exit status and single JSON object still reach the runtime exactly as before; the form is correct whether the runtime substitutes the token into the string or the shell expands it; and it keeps the manifest to the `matcher` / `type` / `command` field set `plugin/hooks/README.md` → `## Registration, and why it lives here rather than in generated settings` allows. Task 2 still establishes, from the installed CLI and its documentation, what exec form would change (stdin, the exit and output contract, the Claude Code versions that accept it) and records what it found in `docs/development.md` §3, the only home of a measured fact or decision of record (`.claude/context/conventions.md` → `### Where a new responsibility goes`). The task prompt says to quote the placeholder where that cannot be settled.

**What reads these command strings as data.** It was checked before planning, and the only reader is the validator. No suite under `cli/test/`, no template under `cli/templates/`, no `cli/src` module and no conventions document quotes a `bash ${CLAUDE_PLUGIN_ROOT}/hooks/…` string. `git grep` finds that string in `plugin/hooks/hooks.json` alone. Two prose copies do describe the token inside a hook's `command` string, and each gains the quoting rule: `plugin/hooks/README.md` → `## Registration, and why it lives here rather than in generated settings` (Task 1) and `docs/development.md` → `## 3. Manifest facts a contributor must not rediscover` (Task 2). The README says it records its facts "alongside the rest of the packaging contract in `docs/development.md` §3", so the two are one fact in two copies and have to agree. The `## Scope register` below lists every site and its disposition.

**Gate `1b marketplace manifest` does not grade this file's command strings.** The `fix_gate_6a_worktree_git_file` run printed `run-gates: 1 failed, 15 passed` against the unquoted file, and `1a` was the only failure (`harness-runs/improvement_observations/fix_gate_6a_worktree_git_file.md`). Task 2 re-confirms that `1b` still passes after the change and records which of the two commands reads `hooks.json`.

**How an agent reaches `claude` here.** The permission profile grants no bare `claude …` command. The route is a probe file under `harness-runs/scratch/` in one of `scripts/scratch-run.sh`'s interpreter extensions (`.mjs` is the natural one; that wrapper refuses `.sh` by design), run as `bash scripts/scratch-run.sh harness-runs/scratch/<probe>.mjs`. The probe calls `claude`, `git` and `bash` through `child_process.execFileSync` with fixed argument vectors, and removes its temp copies in-process (`fs.rmSync`), never by shelling out to `rm -rf`. `harness-runs/scratch/` is gitignored, so no probe gets committed. The validator's own gate also runs unattended through `bash scripts/run-gates.sh`.

Out of scope, per the task prompt: the guard scripts' own logic, and every gate other than `1a`. (`1b` is only re-confirmed.)

**Top risks:** (1) An escaping mistake could leave `hooks.json` invalid JSON, or leave a form the validator still warns about. Task 1 guards this by parsing the file with `jq` and by running the validator through a scratch probe, where a zero exit is not enough: the output must contain no warning. (2) A guard could stop firing after the change, and that would pass unnoticed because a hook that errors looks like silence. Task 1 guards this with a shell-level reproduction from a path containing a space. Task 2 guards it with the in-session check the prompt's acceptance item 3 asks for, and must attribute the refusal to the spaced copy: the plugin is also enabled at user level on this machine, so an unisolated session would show the installed copy firing. Per `harness-runs/lessons.md` → `## Evidence and measurement`, the shell-level emulation is not the evidence the recorded fact rests on. (3) Recording the spaced-path measurement with a real machine path would fail the self-containment gate `6a`. Task 2 writes every such path as a placeholder and re-runs `bash scripts/run-gates.sh`.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom, and the committing role flips each one to `[x]` as that task's commit lands. That role is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_hooks_json_quote_plugin_root/task_<K>_plan.md`. Entries run bottom-up in the configured layer order, with the catch-all layer (`general`, path `.`) last.

1. [x] **Task 1** — Quote the plugin-root path in all six `hooks.json` guard commands and record the chosen form in the hooks README _(layer: plugin)_ _(points: 10)_
2. [ ] **Task 2** — Record the quoting requirement as a measured manifest fact in `docs/development.md` and run the acceptance checks _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Any file that quotes these command strings is changed to match."* The prompt's companion line under `## Establish, do not assume`, which fixes where to look: *"Check tests under `cli/test/`, templates under `cli/templates/`, the docs and the conventions documents."*

**Derivation entry 1: the command strings themselves (command).** Re-run verbatim from the checkout root:

```
git grep -nF 'CLAUDE_PLUGIN_ROOT}/hooks' -- . ':!harness-runs'
```

**Derivation entry 2: prose describing the token inside a hook's `command` string (command).** Re-run verbatim from the checkout root:

```
git grep -nE 'hook(.s)? .?command.? string|command. string .itself|without quotes|exec form' -- . ':!harness-runs'
```

**Derivation entry 3: prose describing the manifest gate that grades the file (command).** Re-run verbatim from the checkout root:

```
git grep -nF 'claude plugin validate' -- . ':!harness-runs'
```

**Derivation entry 4: rows of the standing lessons ledger (procedure).** **Artifact:** `harness-runs/lessons.md`. **Traversal:** its `## ` topic headings in file order, then each one-line `- **…**` rule under each heading. **Decision rule:** a rule is reached when it names `hooks.json`, a hook `command` string, `${CLAUDE_PLUGIN_ROOT}` quoting or gate `1a`. Walked at planning time, it reached no rule. `harness-runs/` is excluded from entries 1–3 because everything else under it records past runs (`.claude/context/conventions.md` → `## Documents of record`: *"A rule read off `harness-runs/` describes a run, not this project"*), and a run record that quotes the old unquoted string is history, not a live copy of it.

**Closure invariant:** every site any derivation entry above reaches appears as a row below. The edits this branch makes add new hits for entry 2 (`without quotes`, `exec form`) only inside sites already listed as `change`, so re-running the entries after the branch lands must reach nothing outside these rows.

| # | Site (path + symbol or quoted anchor, or standing-artifact row id) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/hooks/hooks.json` → the six `hooks.PreToolUse[0].hooks[].command` strings (`"bash ${CLAUDE_PLUGIN_ROOT}/hooks/<guard>.sh"`) | — | entry 1, and entry 3's subject | `change` | Task 1 |
| 2 | `plugin/hooks/README.md` → `## Registration, and why it lives here rather than in generated settings` → the bullet opening "`${CLAUDE_PLUGIN_ROOT}` expands inside a hook's `command` string declared here" | README copy of the manifest facts | entry 2 | `change` | Task 1 |
| 3 | `plugin/hooks/README.md` → the paragraph opening "Keep the JSON strictly valid" | — | entry 3 | `change` | Task 1 (it gains the quoting rule for any future guard entry) |
| 4 | `docs/development.md` → `## 3. Manifest facts a contributor must not rediscover` → the bullet opening "**Plugin hooks append to an adopter's own hooks; they do not override them.**" | `docs/development.md` copy of the manifest facts | entry 2 | `change` | Task 2 |
| 5 | `docs/development.md` → `## 5. Verifying a change` → the **Gate 1 — manifests.** paragraph (both `claude plugin validate --strict` lines and "Both must report `Validation passed` with zero warnings") | — | entry 3 | `change` | Task 2 (it gains which of the two commands grades `hooks.json`) |
| 6 | `docs/development.md` → `## 2. The one authoring rule that follows` → "`${CLAUDE_PLUGIN_ROOT}` interpolates inside **agent definition bodies** as well, and inside a hook's `command` string" | — | entry 2 | `no-change` | still true: the token still interpolates in the command string, and quoting changes nothing about where it resolves |
| 7 | `plugin/hooks/README.md` → "**Never `${CLAUDE_PLUGIN_ROOT}` inside a script body.**" | — | entry 2 | `no-change` | about script bodies, not the manifest's command strings. Unaffected |
| 8 | `plugin/hooks/lib/harness-config-lib.sh` → header comment "hook's `command` string and into agent bodies" | — | entry 2 | `no-change` | describes where the token is substituted. Quoting does not change that |
| 9 | `plugin/scripts/reserve-qa-user.sh` → header comment "plugin-root token, which the runtime substitutes into hook command strings" | — | entry 2 | `no-change` | same statement as row 8, still true |
| 10 | `plugin/scripts/release-qa-user.sh` → header comment "plugin-root token, which the runtime substitutes into hook command strings" | — | entry 2 | `no-change` | same statement as row 8, still true |
| 11 | `cli/templates/scripts/lib/harness-run-lib.sh` → header comment "token the runtime substitutes into hook `command` strings and agent bodies" | template | entry 2 | `no-change` | describes substitution, not the command form. No adopter receives a hook command string |
| 12 | `scripts/lib/harness-run-lib.sh` → header comment "token the runtime substitutes into hook `command` strings and agent bodies" | adopted copy of row 11 | entry 2 | `no-change` | same as row 11. It is also `init`'s output here, so it moves only with its template |
| 13 | `ARCHITECTURE.md` → the **Asset reference resolution** row ("records the substitution for **agent definition bodies** and hook `command` strings") | — | entry 2 | `no-change` | still true after the change |
| 14 | `ARCHITECTURE.md` → the **The tool-guard envelope** row ("a `command` string (itself token-resolved)") | — | entry 2 | `no-change` | still true. It describes the envelope, not the string's quoting |
| 15 | `ARCHITECTURE.md` → the **Packaging and distribution** row ("`claude plugin validate --strict` is the only thing that reads them **as a format**") | — | entry 3 | `no-change` | still true. The validator remains the only reader of these strings as data |
| 16 | `plugin/docs/AUTONOMOUS_FLOW.md` → the "Tool-guard hooks" row citing `${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json` | — | entry 1 | `no-change` | a file citation, not a command string |
| 17 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the **5. The sandbox** row citing `${CLAUDE_PLUGIN_ROOT}/hooks/` | — | entry 1 | `no-change` | a directory citation, not a command string |
| 18 | `plugin/agents/README.txt` → "fails `claude plugin validate --strict` with" | — | entry 3 | `no-change` | about `README.md` discovery in `agents/`, unrelated to hooks |
| 19 | `plugin/commands/README.txt` → "fails `claude plugin validate --strict` with" | — | entry 3 | `no-change` | about `README.md` discovery in `commands/`, unrelated to hooks |
| 20 | `scripts/run-gates.sh` → `gate "1a plugin manifest"` and `gate "1b marketplace manifest"` | — | entry 3 | `no-change` | the gate is correct. The file it grades is what was wrong, and the prompt puts every gate out of scope |
| 21 | `.claude/context/conventions.md` → `## Plugin asset authoring` → the first bullet ("it interpolates in agent bodies and in a hook's `command` string alike") | — | entry 2 | `no-change` | a conventions document is never a task target. Its statement also stays true after this branch, so there is nothing to raise in `## Corpus staleness` |
| 22 | `.claude/context/plugin.md` → `## Verifying a change in this layer` → "The manifest gate is `claude plugin validate --strict plugin`" | — | entry 3 | `no-change` | a conventions document is never a task target. Its statement stays true, so there is nothing to raise |
