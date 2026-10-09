# Story: Adopt beside existing tooling: `harness-scripts/`, workflows that pass `zizmor`, shipped files that pass `typos`

## Context

This branch makes the harness safe to adopt into a repository that already has its own `scripts/` directory and its own CI gates, and readies release **0.6.6**. It changes three things:

- **New adoptions write their scripts to `harness-scripts/`** instead of `scripts/`. `init` gains `--scripts-dir <dir>`.
- **The four GitHub workflow templates are hardened** against `zizmor 1.30.1 --offline --no-config`.
- **The spellings `typos 1.51.1` flags in shipped files are fixed**, or recorded as deliberate.

The work is cut into eighteen single-layer tasks: twelve in `cli`, one in `plugin`, then five in `general`. The catch-all ships last because it gates and documents what the other two layers built.

**The scripts-directory decision (the prompt's "decide explicitly").** Candidate 1 is chosen: only what `init` *writes* changes.
- **What a generated config carries.** `init` writes `"scriptsDir": "harness-scripts"` into every configuration it generates. The value is a new constant, `INIT_SCRIPTS_DIR`, in `cli/src/config/model.ts`, and `--scripts-dir <dir>` overrides it (Task 1).
- **What an absent key means stays `scripts`, everywhere it is read.** That covers `DEFAULTS.scriptsDir`, the schema's `default`, `hr_scripts_dir` in `cli/templates/scripts/lib/harness-run-lib.sh`, the script-allowlist guard's `hc_config_dir … scriptsDir scripts` call, and the five `jq -r '.scriptsDir // "scripts"'` reads in the workflow templates. None of these changes.
- **Why not candidate 2.** Changing the fallback would make a configuration that omits the key look for its scripts in a directory that does not exist. The likeliest result is an unattended run that stalls on the script-allowlist guard and reports nothing, and `config version` would have to carry a migration for it.
- **The absent key is now reported.** `doctor`'s `config` check, `init`'s kept-config path and `config` all report it as a warning, "set it explicitly", through one producer, `cli/src/config/check.ts` (Task 2).
- **The schema keeps `"default": "scripts"`.** Its `description` says that `scripts` is what an absent key means, and that `init` writes `harness-scripts` into a configuration it generates (Task 15).

**Three consequences of that decision, each owned by a task:**
- **A rebuild keeps the directory.** Without `--scripts-dir`, `init --reset-config` re-reads `scriptsDir` from the file it rebuilds, and an absent key there reads as `scripts`. So the start-over path cannot silently strand every script already on disk (Task 1). This mirrors how `appDir` is re-read on a rebuild (`cli/src/commands/init.ts` → `resolveDetectionAppDir`).
- **A run that reads an existing config drops `--scripts-dir` and warns.** The `INIT_OPTIONS` row carries `configValue: 'scriptsDir'`, so `discardedConfigFlagsWarning` covers it with no new code path. That is the `docs/cli.md` §2 `--default-branch` row's "dropped flag" rule.
- **Package-internal `scripts` paths are not the adopter's directory and do not change.** Those are `cli/src/machine/plugins.ts` → `SCRIPTS_DIRNAME` (the plugin install root's helper directory), `cli/src/core/paths.ts` → `packageScriptsDir` (the npm package's daemon unit templates), and `TEMPLATE_DIR = 'scripts'` in `cli/src/generators/scripts.ts` and `cli/src/generators/outerLoopScripts.ts` (the template tree). Each was confirmed against its own doc comment.

**What stays where it is.**
- **This repository keeps `scripts/`.** Its `harness.config.json` sets `"scriptsDir": "scripts"` explicitly, and its `scripts/` copies of the outer-loop templates are its own adoption, which the prompt puts out of scope. They are not refreshed here.
- **`examples/harness.config.json` keeps `packages/storefront/scripts`.** It illustrates a nested application's explicit value, not a default.
- **`examples/notes-app/harness.config.json` keeps `"scriptsDir": "scripts"`.** It is a frozen capture of an adoption, and it is exactly the "existing adopter does not move" case. Its live `scripts/` is what the README's quick start runs.

**The test-suite ripple.** About thirty suites under `cli/test/` run `init` against a configless fixture and then address the written scripts as `scripts/…`. All of them move to the new directory through one shared value, `INIT_SCRIPTS_DIR`, which `cli/test/helpers/fixture.mjs` re-exports from the compiled `cli/dist/config/model.js` (Task 2). There is no second spelling. The suites are split by family across Tasks 3–6. Each of those tasks names the rule that decides whether a suite moves.

**The workflow audit, reproduced on 2026-10-09.** `uvx zizmor@1.30.1 --offline --no-config --format=plain .github` over a copy of the four templates gave `59 findings (34 suppressed, 6 unsafe fixes): 0 informational, 2 low, 6 medium, 17 high`, exit `14`. The non-suppressed findings were:

| Finding | Count | Where |
|---|---|---|
| `unpinned-uses` | 13 | |
| `excessive-permissions` | 4 | All four are `harness-run.yml`'s workflow-level block. |
| `artipacked` | 6 | One per `actions/checkout`. The prompt's seventh is `.github/workflows/publish-main.yml`. |
| `adhoc-packages` | 2 | The two `npm install -g @anthropic-ai/claude-code` lines. |

The decisions:
- **`unpinned-uses` — fixed.** Every `uses:` pins a full commit SHA in the same major it uses today, so the `node24` rationale in each `# ACTION PINS.` block still holds. The SHAs were resolved on 2026-10-09 with `git ls-remote --tags https://github.com/actions/<name>`. All are lightweight tags, so each SHA is the commit:

  | Action | Version | SHA |
  |---|---|---|
  | `actions/checkout` | v5.1.0 | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` |
  | `actions/setup-node` | v5.0.0 | `a0853c24544627f65ddf259abe73b1d18a591444` |
  | `actions/cache` and `actions/cache/restore` | v5.1.0 | `caa296126883cff596d87d8935842f9db880ef25` |
  | `actions/upload-artifact` | v6.0.0 | `b7c566a772e6b6bfb58ed0dc250532a479d7789f` |

  The version goes in a `# <action> vX.Y.Z` comment on the line **above** each `uses:`, never after it. Each file's header rule — "a value carrying ` #` is never a plain scalar" — is enforced by `cli/test/workflow-templates.test.mjs`, and a trailing comment would break it.
- **`excessive-permissions` — fixed.** All four templates move to `permissions: {}` at workflow level, with grants per job. In `harness-run.yml` each job gets the least its own steps need; `wrong-ref` gets `{}`. In each single-job file the job takes the set the file grants today, unchanged.
- **`artipacked` — fixed where the job needs no credential.** That is `harness-run.yml`'s `warm`, which sets `persist-credentials: false`.
  - **It stands where the job pushes through the checkout's credential.** Those are `harness-run.yml`'s `run` and `collect`, `harness-trigger.yml` (`remote-run.sh trigger` → `start` → `push-branch.sh`) and `harness-control.yml` (`review` → `push-branch.sh`). The push needs the credential, and the only artifact upload among them is `harness-state` from `${{ runner.temp }}/harness-state`, outside the workspace, so it cannot carry `.git/`.
  - **It stands on `harness-resume.yml`'s `poll`, which pushes nothing but authenticates through the checkout.** `remote-run.sh` → `verb_poll` → `poll_pass` → `poll_branch` → `remote_branch_exists` runs `git ls-remote --exit-code --heads origin …` inside the checkout. A private repository refuses that without the persisted credential, and `poll_branch` would then never take the arm that skips a deleted run branch and drops its poll state — a loosening the prompt forbids. Its `harness-poll-state` upload is `<stateDir>/autonomous_logs/poll_state/current`, which does not contain `.git/` (Task 8).
  - **The reason is stated in each header.**
  - **`publish-main.yml` is not changed.** It is this repository's own workflow and is not shipped. Its job pushes `publish` through its checkout credential and uploads no artifact, so its finding stands on the same reason.
- **`adhoc-packages` — stands, and the latest CLI is kept on purpose.** Pinning the version does not clear the finding: a pinned `npm install -g …@2.1.284` was still flagged in a probe on 2026-10-09.
  - **The latest is wanted** because `harness-control.yml` carries no pin and is never re-rendered by `init --upgrade-workflows` (`cli/src/generators/githubWorkflows.ts` → choice 5). A version frozen into it would stay frozen for every adopter.
  - **Declined: the shapes the audit does not flag.** `npx --yes …@<version>` and `curl … | bash` both pass, but each is the same install with less integrity checking, chosen only to silence the audit.
- **The expected residual set is therefore `artipacked` ×5 and `adhoc-packages` ×2.** Each is justified in its template's header, and `docs/remote-execution.md` §11 lists them (Task 16). No zizmor ignore comment and no `zizmor.yml` is added anywhere.

**The spelling audit, reproduced on 2026-10-09.** `uvx --from typos@1.51.1 typos --format brief cli/templates plugin schemas cli/src` gave 69 hits, exit `2`. Fixed and deliberate words are decided per hit in Tasks 9 and 11–13.
- **Kept as deliberate**, because each is an identifier something else matches on, a regular expression, or command-line flags:
  - `UNPARSEABLE_CONTROL_RELEASES`, which `cli/test/trigger-workflow-init.test.mjs` imports and `scripts/check-rendered-workflows.mjs` cites;
  - `UNPARSEABLE_CONTROL_IF_LINE`;
  - `unparseableControlRoute`, which `doctor/checks.ts` and `commands/init.ts` import;
  - `ines`, inside the regular expression `[Ll]ines?` in `plugin/agents/docs-reviewer.md`;
  - `Ein`, the `git grep -Ein` flags in `plugin/instructions/mode_contract.md`;
  - `fo`, the `--fo` option-prefix example in `plugin/hooks/lib/harness-config-lib.sh`.
- **Renamed, against a literal reading of the prompt's rule.** Two names are renamed because each is a binding local to a single expression or block, with no reader outside it:
  - `unexcepted`, a block-scoped `const` in `cli/src/doctor/checks.ts` (Task 12);
  - `$thr`, a binding local to one `jq` program in `cli/templates/scripts/autonomous-watcher.sh` (Task 11).

  The prompt says "do not change an identifier". This plan reads that rule as protecting names something else matches on. A grep in each task's Verification proves that no other reader exists. Leaving either name as it is would keep every adopter's `typos` gate red on `harness-scripts/autonomous-watcher.sh`.

**The version and the release.** The version is not bumped on this branch. `scripts/release.sh` step 1 is the bump: a pull request onto `dev` that changes `cli/package.json`, `package.json`, `package-lock.json` and `plugin/.claude-plugin/plugin.json`, as every bump since 0.4.2 has (`docs/development.md` → `## 7. Releasing`). A bump here would make that step skip and break the one-pull-request-per-bump record. The operator runs the release, and the run does not.

**The regression bar.** Every job must still do what `docs/remote-execution.md`, `docs/github-run-control.md` and `docs/github-issue-trigger.md` say it does. The Gate 12 observations in `docs/development.md` → `## 5. Verifying a change` remain the bar. Two new gates prove the audits:
- **14d** runs `zizmor` over the rendered workflows and fails on any finding outside the residual set above.
- **6f** runs `typos` over the shipped trees and fails on any hit outside the deliberate set above.

Both are SKIPPED where neither the tool nor `uvx` resolves, as 14c is (Task 14).

**Top risks:**
- **A silent move of an existing adopter's scripts** — an absent key reinterpreted, or a rebuild that writes a fresh `harness-scripts`. Task 1 is the only task that decides the precedence. Tasks 2 and 3 assert on the bytes on disk that a `scripts` adopter is untouched by `init`, `init --force`, `init --reset-config` and `doctor`.
- **The ~30-suite ripple.** A suite missed by Tasks 3–6 fails only at Run gates, so each of those tasks applies one stated rule to every suite in its family and names the suites it left unchanged.
- **A per-job grant narrower than a job's real need.** That fails only on GitHub. Task 7 derives every grant from the `remote-run.sh` verb path the job runs and cites it in the header. Task 10 pins the grants in the suite, and the Gate 12 hand-run below is the live check.

**Manual setup required:**
- **The online `zizmor` audit**, once, before release. It reaches GitHub for `impostor-commit`, `ref-confusion` and `known-vulnerable-actions` on the new pins, so it needs a GitHub token. It depends on Tasks 7–9. Run it over the rendered workflows (Task 14's render) with:

  ```
  uvx zizmor@1.30.1 --no-config --gh-token <token> <rendered>/.github
  ```

- **A Gate 12 hand-run** of at least one remote task run against `firu-daniel/harness-gate12` on the hardened workflows, recorded in `docs/development.md` → `**Gate 12 — …**` the way earlier rounds are. It depends on Tasks 7–10.
- **The release.** The operator runs it at a terminal, after the two steps above (`docs/development.md` → `## 7. Releasing`):

  ```
  bash scripts/release.sh 0.6.6 --dry-run
  bash scripts/release.sh 0.6.6
  ```

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.**
- The orchestrator walks the `[ ]` entries below from top to bottom.
- **Only the committing role flips a marker** to `[x]`. That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating.
- `[ ]` markers anywhere else, such as the sub-step bullets inside per-task files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_adopter_scripts_dir_and_workflow_hardening/task_<K>_plan.md`. They are ordered bottom-up in the configured layer order — `cli`, `plugin`, then `general`, the catch-all — and in ship sequence within each layer.

1. [x] **Task 1** — Write `harness-scripts` into a generated config, add `init --scripts-dir`, and keep the directory on a rebuild _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Warn when `scriptsDir` is absent, share `INIT_SCRIPTS_DIR` with the suites, and prove both directories end to end in `scripts-dir.test.mjs` _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Cover the new `init` behaviour in `init.test.mjs` and move its fresh-init paths to `INIT_SCRIPTS_DIR` _(layer: cli)_ _(points: 20)_
4. [x] **Task 4** — Move the `doctor`, `config`, profile, daemon and stack-preset suites to the fresh-init scripts directory _(layer: cli)_ _(points: 20)_
5. [x] **Task 5** — Move the watcher and walker helpers, and the outer-loop suites built on them, to the fresh-init scripts directory _(layer: cli)_ _(points: 20)_
6. [x] **Task 6** — Move the `remote-run.sh`, `push-branch.sh` and workflow-render suites to the fresh-init scripts directory _(layer: cli)_ _(points: 15)_
7. [x] **Task 7** — Harden `harness-run.yml`: SHA pins, per-job permissions, unpersisted credentials where no push, justified residuals _(layer: cli)_ _(points: 20)_
8. [x] **Task 8** — Harden `harness-resume.yml` and `harness-trigger.yml` the same way _(layer: cli)_ _(points: 15)_
9. [x] **Task 9** — Harden `harness-control.yml` the same way, and fix its spelling _(layer: cli)_ _(points: 15)_
10. [x] **Task 10** — Pin the hardened workflow shapes in `workflow-templates.test.mjs` _(layer: cli)_ _(points: 15)_
11. [x] **Task 11** — Fix the `typos` hits in the outer-loop script templates and the inbox README template _(layer: cli)_ _(points: 10)_
12. [x] **Task 12** — Fix the `typos` hits in `cli/src` prose and messages, keeping every matched identifier _(layer: cli)_ _(points: 10)_
13. [x] **Task 13** — Fix the `typos` hits in the plugin corpus and restate the `<scripts_dir>` default rows _(layer: plugin)_ _(points: 15)_
14. [x] **Task 14** — Add gate 14d (`zizmor` over the rendered workflows) and gate 6f (`typos` over the shipped trees) _(layer: general)_ _(points: 20)_
15. [x] **Task 15** — State the new default in the schema description, `docs/config.md` and `docs/cli.md` _(layer: general)_ _(points: 15)_
16. [x] **Task 16** — Update `docs/remote-execution.md` and `docs/retrieval.md` for `harness-scripts` and the hardened workflows _(layer: general)_ _(points: 15)_
17. [x] **Task 17** — Document gates 6f and 14d and record the audit figures in `docs/development.md`, and record the hook comment edits in `docs/guard-verification.md` _(layer: general)_ _(points: 12)_
18. [x] **Task 18** — Name the change in `README.md`, `llms.txt` and `ROADMAP.md` _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicates**, quoted verbatim from the task prompt:
- *"Verify that no instruction, agent or doc **hardcodes** `scripts/` as the adopter's location where it means `<scripts_dir>`."*
- *"Prose that says "default `scripts`" must change with the default."*
- *"Run it over everything that ships (`cli/templates`, `plugin`, `schemas`, `cli/src`). Fix genuine misspellings."*
- *"The docs that state the default (`docs/config.md`, `docs/cli.md`, `docs/remote-execution.md`, `README.md`, `llms.txt`) match the new behaviour."*

**How the register is bounded.** The register covers the plan's **durable-corpus** targets only: Markdown, JSON Schema and adopter-facing templates under `cli/templates/`, YAML and shell included. Two sets of edits are application source and their comments, owned outside it: `cli/src/**`, which is Task 12, and `plugin/hooks/**`, whose three comment edits sit in Task 13. The record those hook edits owe in `docs/guard-verification.md` is corpus, and is row 53, reached by D5.

**Derivation entry D1 — prose stating the default (command).** Re-run verbatim from the repository root:

```
git grep -nE 'Default `?scripts/?`|default `?scriptsDir`? of `?scripts|With the default `scriptsDir`|\| `scriptsDir` \| string \| `scripts` \||"default": "scripts"' -- plugin docs README.md llms.txt cli/README.md cli/templates schemas
```

**Derivation entry D2 — a hardcoded `scripts/` path in adopter-facing corpus (command).** Re-run verbatim from the repository root:

```
git grep -nE '(^|[^_a-zA-Z/}>.$-])scripts/[a-z]' -- plugin/agents plugin/commands plugin/instructions plugin/docs plugin/samples plugin/README.md cli/templates/claude cli/templates/state-dir cli/templates/README.md cli/README.md README.md llms.txt docs/config.md docs/cli.md docs/remote-execution.md docs/github-run-control.md docs/github-issue-trigger.md docs/watcher.md docs/retrieval.md
```

**Derivation entry D3 — `typos` hits in corpus files (procedure).**
- **First step, runnable:** `uvx --from typos@1.51.1 typos --format brief cli/templates plugin schemas cli/src`.
- **Artifact:** that output, one `path:line:col: error: \`word\` should be …` line per hit.
- **Traversal:** the lines in output order.
- **Per-candidate decision rule:**
  - A hit whose path is Markdown, a JSON schema, or any file under `cli/templates/` is a row.
  - A hit under `cli/src/` or `plugin/hooks/` is application source and is not a row.
  - For every template-file row, its byte-for-byte counterpart under this repository's own `scripts/`, where one exists, is a row of its own, with `Copy` set to `scripts/ (self-adoption)`.

**Derivation entry D4 — documents the task prompt names (procedure).**
- **Artifact:** the task prompt's `## Done when` section.
- **Traversal:** its fourth bullet's parenthesised list, in order: `docs/config.md`, `docs/cli.md`, `docs/remote-execution.md`, `README.md`, `llms.txt`.
- **Per-candidate decision rule:** each named document is a candidate. It is a row where it states, or in its quick start should state, where a fresh `init` writes its scripts. A document D1 or D2 already reached adds no second row.

**Derivation entry D5 — surfaces this branch changes, traced to the section that documents each (procedure).**
- **Artifact:** the readiness list above.
- **Traversal:** Tasks 1, 2, 7–10, 13 and 14, in order.
- **Per-candidate decision rule:** for each user-visible surface the task changes — an `init` flag, a refusal, a `doctor` warning, a workflow header block, the upgrade route for workflows, the security section, a gate, a guard under `plugin/hooks/` (whose change is recorded in `docs/guard-verification.md` whatever its kind) — the one section that documents that surface today is a row. A surface with no such section names the section that gains it.

**Closure invariant:** every site any of D1–D5 reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/config.md` → `## 5. Key reference`, the `scriptsDir` row | — | D1 | `change` | Task 15 |
| 2 | `docs/remote-execution.md` → `### Working a run from GitHub alone`, "To stop a run, with the default `scriptsDir` of `scripts`" | — | D1 | `change` | Task 16 |
| 3 | `docs/remote-execution.md` → `## 7. Turning it on`, step 7, "With the default `scriptsDir` of `scripts`" | — | D1 | `change` | Task 16 |
| 4 | `plugin/agents/layer-reviewer.md` → `## Resolved values`, the `<scripts_dir>` row ("Default `scripts/`") | — | D1 | `change` | Task 13 |
| 5 | `plugin/agents/task-plan-writer.md` → `## Resolved values`, the `<scripts_dir>` row ("Default `scripts/`") | — | D1 | `change` | Task 13 |
| 6 | `schemas/harness.config.schema.json` → `properties.scriptsDir` | — | D1, `"default": "scripts"` | `change` | Task 15 — `description` only; the `default` stays `scripts`, the absent-key meaning (Context) |
| 7 | `docs/cli.md` → `## 5. The wrapper-script contract`, "the plugin's own `scripts/poll-dev-server.sh`" | — | D2 | `no-change` | The plugin's own helper directory, not the adopter's |
| 8 | `docs/cli.md` → `## 7. \`doctor\``, the `daemon-path` bullet's example `npm (commands.test → scripts/test.sh)` | — | D2 | `change` | Task 15 — an illustration of a freshly wired repository, which now reads `harness-scripts/test.sh` |
| 9 | `docs/remote-execution.md` → the fenced `bash scripts/remote-run.sh stop <branch>` | — | D2 | `change` | Task 16, with row 2 |
| 10 | `docs/remote-execution.md` → `## 6. What is not verified here`, the table row citing `bash scripts/probe-plugin-cli.sh` | — | D2 | `no-change` | This repository's own script, cited as a measurement |
| 11 | `docs/remote-execution.md` → `### The plugin-install probe`, "On 2026-09-29, `bash scripts/probe-plugin-cli.sh`" | — | D2 | `no-change` | A recorded measurement in this repository |
| 12 | `docs/remote-execution.md` → "Later tags are made by `scripts/tag-release.sh`" | — | D2 | `no-change` | This repository's own release script |
| 13 | `docs/remote-execution.md` → the fenced `bash scripts/remote-run.sh warm` | — | D2 | `change` | Task 16, with row 3 |
| 14 | `docs/retrieval.md` → the `.mcp.json` example, `"args": ["scripts/docs-search-server.sh"]` | — | D2 | `change` | Task 16 — `init` writes `harness-scripts/docs-search-server.sh` for a fresh config |
| 15 | `docs/retrieval.md` → "**Two environment faults the run hit**", `scripts/docs-search-server.sh` | — | D2 | `no-change` | A recorded measurement (Gate 10) in this repository |
| 16 | `docs/retrieval.md` → `## Still open`, "would find no `scripts/docs-search-server.sh`" | — | D2 | `no-change` | It describes Gate 10's session in this repository, whose `scriptsDir` is `scripts` |
| 17 | `cli/templates/state-dir/autonomous_inbox/README.md` → "is not mis-routed" | — | D3, `mis` | `change` | Task 11 |
| 18 | `plugin/agents/docs-reviewer.md` → the line-number regex `[Ll]ines?` | — | D3, `ines` | `no-change` | Deliberate: a regular expression, not a word |
| 19 | `plugin/agents/docs-reviewer.md` → "mis-marked reachability" | — | D3, `mis` | `change` | Task 13 |
| 20 | `plugin/agents/review-plan-reviewer.md` → "a mis-titled section" | — | D3, `mis` | `change` | Task 13 |
| 21 | `plugin/agents/skeptic-reviewer.md` → frontmatter `description:`, "mis-graded" | — | D3, `mis` | `change` | Task 13 |
| 22 | `plugin/agents/skeptic-reviewer.md` → the two-leg-test bullet, "mis-graded as an intentional refinement" | — | D3, `mis` | `change` | Task 13 |
| 23 | `plugin/agents/task-plan-reviewer.md` → "a mis-titled section" | — | D3, `mis` | `change` | Task 13 |
| 24 | `plugin/agents/ui-tests-plan-reviewer.md` → "a mis-titled section" | — | D3, `mis` | `change` | Task 13 |
| 25 | `plugin/instructions/autonomous_pause_and_ledger.md` → "mis-seeded entry is a seeding fix" | — | D3, `mis` | `change` | Task 13 |
| 26 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → "mis-resolves the relative path" | — | D3, `mis` | `change` | Task 13 |
| 27 | `plugin/instructions/mode_contract.md` → `git grep -Ein "overrides? [34dei]"` | — | D3, `Ein` | `no-change` | Deliberate: the `-E -i -n` flags |
| 28 | `plugin/instructions/plan_orchestration_instructions_core.md` → "mis-graded \"intentional divergence\" calls" | — | D3, `mis` | `change` | Task 13, the same edit as row 21's wording |
| 29 | `cli/templates/github/workflows/harness-control.yml` → `# THREE RULES EVERY EDIT KEEPS.`, "leaves the file unparseable" | — | D3, `unparseable` | `change` | Task 9 |
| 30 | `cli/templates/scripts/autonomous-watcher.sh` → three "unparseable" comments, "cannot mis-route", and the `jq` binding `$thr` (two hits) | `cli/templates/scripts` | D3 | `change` | Task 11 |
| 31 | `scripts/autonomous-watcher.sh` → the same comments | `scripts/ (self-adoption)` | D3 counterpart | `no-change` | This repository's own adoption, out of scope ("Any change to this repository's own … adoption"); a maintainer's `init --force` refreshes it |
| 32 | `cli/templates/scripts/cleanup-merged-worktrees.sh` → "unparseable or out-of-range string" | `cli/templates/scripts` | D3 | `change` | Task 11 |
| 33 | `scripts/cleanup-merged-worktrees.sh` → the same comment | `scripts/ (self-adoption)` | D3 counterpart | `no-change` | As row 31 |
| 34 | `cli/templates/scripts/lib/harness-run-lib.sh` → "unparseable `usage-state.json`", "cannot be mis-routed" | `cli/templates/scripts` | D3 | `change` | Task 11 |
| 35 | `scripts/lib/harness-run-lib.sh` → the same comments | `scripts/ (self-adoption)` | D3 counterpart | `no-change` | As row 31 |
| 36 | `cli/templates/scripts/remote-run.sh` → "An unparseable createdAt" | `cli/templates/scripts` | D3 | `change` | Task 11; it has no counterpart under `scripts/` |
| 37 | `README.md` → `### Adopting it in your own repository`, step **B** | — | D4 | `change` | Task 18 — says where a fresh `init` writes its scripts and how `--scripts-dir` picks another |
| 38 | `llms.txt` → the quick start, step 2 "Wire your repository" | — | D4 | `change` | Task 18 |
| 39 | `docs/cli.md` → `## 2. \`init\``, the flag table (`--state-dir` row's neighbour) | — | D5, Task 1 | `change` | Task 15 — gains the `--scripts-dir <dir>` row |
| 40 | `docs/cli.md` → `## 2. \`init\``, the refusals list ("`--state-dir` names, or reaches through, a dot-directory") | — | D5, Task 1 | `change` | Task 15 — gains the `--scripts-dir` refusal |
| 41 | `docs/cli.md` → `## 2. \`init\``, the `--reset-config` paragraph ("It is re-derived rather than restored") | — | D5, Task 1 | `change` | Task 15 — `scriptsDir` is re-read like `appDir` |
| 42 | `docs/cli.md` → `## 7. \`doctor\``, the `config` check's bullet | — | D5, Task 2 | `change` | Task 15 — the absent-key warning |
| 43 | `cli/templates/github/workflows/harness-run.yml` → `# ACTION PINS.`, `# THE PERMISSIONS.` | — | D5, Task 7 | `change` | Task 7 |
| 44 | `cli/templates/github/workflows/harness-resume.yml` → `# ACTION PINS.`, `# THE PERMISSIONS.`, the new `# THE CHECKOUT CREDENTIAL.` | — | D5, Task 8 | `change` | Task 8 |
| 45 | `cli/templates/github/workflows/harness-trigger.yml` → `# ACTION PINS.`, `# THE CHECKOUT.` | — | D5, Task 8 | `change` | Task 8 |
| 46 | `cli/templates/github/workflows/harness-control.yml` → `# ACTION PINS.` | — | D5, Task 9 | `change` | Task 9 |
| 47 | `docs/remote-execution.md` → `### Upgrading` | — | D5, Tasks 7–9 | `change` | Task 16 — which workflows `--upgrade-workflows` delivers new pins to, and that the trigger and control workflows take them only through `init --force` |
| 48 | `docs/remote-execution.md` → `## 11. Security` | — | D5, Tasks 7–9 | `change` | Task 16 — per-job permissions, SHA pins, and the residual findings with their reasons |
| 49 | `docs/development.md` → `## 5. Verifying a change`, `**Gate 14 — the rendered workflows parse.**` | — | D5, Task 14 | `change` | Task 17 — leg 14d |
| 50 | `docs/development.md` → `## 5. Verifying a change`, the gate-6 legs (beside `6c` – `6e`) | — | D5, Task 14 | `change` | Task 17 — leg 6f |
| 51 | `ROADMAP.md` → `## Evidence and adoption` table | — | D5, the release | `change` | Task 18 — a `Done` row naming the change, since this repository keeps no CHANGELOG |
| 52 | `.github/workflows/publish-main.yml` → its `actions/checkout` step | — | the prompt's `artipacked` row | `no-change` | This repository's own, unshipped workflow, which pushes `publish` through the checkout credential and uploads no artifact (Context) |
| 53 | `docs/guard-verification.md` → `### 3.8 Recorded as changing no decision`, the table | — | D5, Task 13 | `change` | Task 17 — one row recording the three guards' comment-only edits, licensed by `git diff -U0 -- plugin/hooks` showing only `#` lines |
