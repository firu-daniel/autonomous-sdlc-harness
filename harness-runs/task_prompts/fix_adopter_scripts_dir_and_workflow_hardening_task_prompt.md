`fix_adopter_scripts_dir_and_workflow_hardening` makes the harness safe to adopt into a repository that already
has its own `scripts/` directory and its own CI gates. It changes three things. New adoptions write their scripts
to `harness-scripts/` instead of `scripts/`. The four GitHub workflow templates are hardened so a strict workflow
auditor (`zizmor`) passes them. The spellings a strict spell checker (`typos`) flags in shipped files are fixed.
The branch ends with release **0.6.6**, which the first real adopter, `firu-daniel/scenewise`, will install.

> ⚠️ **Find every anchor in this prompt by its quoted text, symbol or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** It was gathered on 2026-10-09 against CLI 0.6.5 and
> the `dev` tip `cb7645b`. The planner and the reviewers must re-verify each lead against the live source and agree
> on the design themselves.

---

## Why

Trialling the harness on scenewise, a Python repository, in a throwaway clone (`init` 0.6.5 + `doctor`, all PASS)
surfaced two adoption blockers that every repository with existing tooling will hit:

1. **The scripts directory collides.** `init` writes 18 outer-loop scripts plus `test.sh` / `typecheck.sh` into
   `scripts/`, the directory most repositories already use for their own tooling. scenewise's `scripts/` holds
   product gate scripts its CI runs. A repository that uses the dev → `publish` → main model (this repository's
   own `scripts/publish-main.sh`, which removes `scripts` wholesale) cannot strip the harness from main without
   also deleting its own scripts. scenewise worked around it by seeding `harness.config.json` with
   `"scriptsDir": "harness-scripts"` before running `init`, because `init` has no flag for it.
2. **The workflow templates fail a standard workflow audit.** Running scenewise's CI gate
   `zizmor 1.30.1 --offline --no-config` over the four templates in `cli/templates/github/workflows/` (and this
   repository's own `.github/workflows/publish-main.yml`) gives 64 findings: 17 high, 7 medium and 2 low, plus 38
   suppressed. An adopter whose CI audits `.github/` goes red as soon as the workflows land. Most of these are real
   hardening gaps in workflows that hold the Claude credential and write tokens, not noise.

## The goal

1. **New adoptions default to `harness-scripts/`.** A fresh `init` with no `harness.config.json` writes
   `"scriptsDir": "harness-scripts"` and puts every wrapper and outer-loop script there.
2. **No existing adopter moves.** A repository adopted before this release keeps running from wherever its
   scripts already are, with no action needed.
3. **`init --scripts-dir <dir>`** sets the value on a generated config, like `--state-dir`, so seeding the config
   by hand is no longer needed. A run that reads an existing config drops the flag and warns, exactly as for the
   other config-writing flags (`docs/cli.md` §2, the `--default-branch` row's "dropped flag" rule).
4. **The workflow templates pass `zizmor --offline` with no config and no inline suppression**, or every remaining
   finding is justified in the template header and listed in the plan, with a reason it cannot be fixed.
5. **The shipped files pass `typos`** with its default configuration, or each remaining hit is a deliberate word,
   recorded in the plan.
6. **Release 0.6.6**, tagged `autonomous-sdlc-harness--v0.6.6` through `scripts/release.sh` (run by the
   operator, not by the run).

## Leads (re-verify every one)

### The scripts directory: where the default lives, and the compatibility trap

- `init` **writes the key explicitly** into every config it generates. A fresh 0.6.5 `init` produced
  `"scriptsDir": "scripts"`. So an `init`-generated config carries its own value, and changing the default does not
  move it.
- **The trap is a config that omits the key** (hand-written, or trimmed). Today the absent key means `scripts`
  everywhere it is read:
  - the schema: `schemas/harness.config.schema.json` → `properties.scriptsDir.default` is `"scripts"`;
  - the CLI: `cli/src/config/model.ts` → `DEFAULTS.scriptsDir: 'scripts'`;
  - the workflow templates: `jq -r '.scriptsDir // "scripts"' harness.config.json` in `harness-run.yml` (twice),
    `harness-resume.yml`, `harness-trigger.yml` and `harness-control.yml`;
  - and whatever the shell libraries and plugin guards fall back to. Search `cli/templates/scripts/lib/`,
    `plugin/hooks/lib/harness-config-lib.sh` and the guards for their own default. The guards matter most: the
    script-allowlist guard decides what an unattended run may execute.
- If the **absent-key** meaning changes to `harness-scripts`, a repository whose config omits the key would
  silently look for its scripts in a directory that does not exist. The likely failure is a stalled unattended
  run, not an error. **Decide explicitly and record it in the plan.** One candidate: change only what `init`
  *writes* for a new config, keep the absent-key fallback at `scripts` everywhere, and have `doctor` warn when the
  key is absent ("set it explicitly"). The schema `default` then needs a wording decision, because it would no
  longer match what `init` writes. Another candidate: change the fallback everywhere and treat the absent-key case
  as a migration. That means `config version` rules (`docs/config.md` §5, the `version` row) and a `doctor` check.
  Pick one, and say why.
- `cli/src/machine/plugins.ts` → `SCRIPTS_DIRNAME = 'scripts'`, `cli/src/core/paths.ts` (`join(PACKAGE_ROOT,
  'scripts')`) and `TEMPLATE_DIR = 'scripts'` in `cli/src/generators/scripts.ts` / `outerLoopScripts.ts` look like
  **package-internal** paths (the npm package's and the plugin's own layout), not the adopter's directory. Confirm
  each before touching it, and leave the internal ones alone.
- About 95 files mention `scriptsDir`, and about 49 plugin files use `<scripts_dir>`. The plugin side resolves the
  token from config, so it should need no change. Verify that no instruction, agent or doc **hardcodes**
  `scripts/` as the adopter's location where it means `<scripts_dir>`. `docs/remote-execution.md` § 7 step 7
  ("With the default `scriptsDir` of `scripts`") is one known doc instance. Prose that says "default `scripts`"
  must change with the default.
- The generated permission profile allow-lists wrapper paths in three forms (`.claude/settings.autonomous.json`
  `_README`). Confirm the generator takes the configured value, and that the `doctor` checks `command-wrappers`
  and `command-permissions` pass under `harness-scripts`. The scenewise trial says they do.
- **This repository's own adoption keeps `scripts/`.** Its `harness.config.json` sets `"scriptsDir": "scripts"`
  explicitly, and `publish-main.sh`, `release.sh`, `tag-release.sh` and `run-gates.sh` live there. Do not migrate
  it. The `examples/notes-app` fixture and `examples/harness.config.json`: decide whether each shows the new default.
- Tests: generator, config and `doctor` tests that assert `scripts/...` paths for a fresh `init` will need
  updating. Add one for the absent-key case and one for `--scripts-dir`.

### The workflow audit (`zizmor 1.30.1 --offline --no-config`)

Reproduce first. Copy `cli/templates/github/workflows/*.yml` into a scratch `.github/workflows/`, then run
`uvx zizmor@1.30.1 --offline --no-config <dir>/.github`. Then render real files through `init` with
`execution.target: github-actions` and `forge: github` and audit those, because the rendered files are what
adopters commit.

| Finding | Count | Where | Lead |
|---|---|---|---|
| `unpinned-uses` (high) | 13 | every `uses:` in the four templates (`actions/checkout@v5`, `actions/setup-node@v5`, `actions/cache@v5`, `actions/cache/restore@v5`, `actions/upload-artifact@v6`) | Pin each to a full commit SHA with a `# vX.Y.Z` comment. This repository's own `publish-main.yml` and `release-npm.yml` already do, with the rationale in their comments ("a tag is mutable, and this job holds a token…"). Each template header has an `# ACTION PINS.` block naming the majors; update it to name the pinned versions and say how to bump them. `init --upgrade-workflows` is the route that delivers new pins to adopters. |
| `excessive-permissions` (high) | 4 | `harness-run.yml`'s **workflow-level** `permissions:` (`contents`, `actions`, `issues`, `pull-requests`: `write`) | The block applies to every job in the file, including jobs that need nothing (`wrong-ref` only refuses a dispatch). Move to `permissions: {}` at the top and grant per job, the least each job needs. Check the other three templates for the same shape. Verify each job's real needs: push (contents), dispatch/continue (actions), lifecycle comments and labels (issues, pull-requests). |
| `artipacked` (medium) | 7 | every `actions/checkout` in the four templates, plus `publish-main.yml` | `checkout` persists the token into `.git/config`, and an artifact upload that includes the checkout would leak it. Jobs that push need the credential. Set `persist-credentials: false` on every checkout whose job does not push. Where a job must push, confirm the `harness-state` upload (and any other `upload-artifact`) can never include `.git/`, and say so in a comment. If zizmor still flags it, state in the plan why the finding stands. |
| `adhoc-packages` (help) | 2 | `npm install -g @anthropic-ai/claude-code` ("Install the claude CLI when absent") | Pin the CLI version, or record why the latest is wanted. |

Then run zizmor **online** (`--gh-token`, as scenewise's nightly does) once, for `impostor-commit`,
`ref-confusion` and `known-vulnerable-actions` on the new pins.

**Constraint:** fix the templates. Do not add zizmor ignore comments or a `zizmor.yml`, because adopters run it with
`--no-config`. And do not loosen behaviour: every job must still do what `docs/remote-execution.md`,
`docs/github-run-control.md` and `docs/github-issue-trigger.md` say it does. The Gate 12 observations in
`docs/development.md` are the regression bar. A hand-run of at least one remote task run against
`firu-daniel/harness-gate12` on the hardened workflows is expected before release, recorded the way earlier Gate 12
rounds are.

### Spelling (`typos 1.51.1`, default config)

`typos --format brief cli/templates plugin` reports, among others:
- `unparseable` → `unparsable`: `autonomous-watcher.sh`, `remote-run.sh`, `lib/harness-run-lib.sh`,
  `cleanup-merged-worktrees.sh`, `harness-control.yml`, `git-commit-branch-guard.sh`,
  `autonomous-protected-branch-guard.sh`;
- `thr` (`autonomous-watcher.sh`), `fo` (`plugin/hooks/lib/harness-config-lib.sh`), `ines`
  (`plugin/agents/docs-reviewer.md`), `Ein` (`plugin/instructions/mode_contract.md`): check each, since some may
  be inside identifiers or quoted output;
- `mis`: many plugin agents and instructions, and the inbox README template. Probably hyphenated `mis-graded` /
  `mis-cited` and similar. Rewrite as one word (`misgraded`, `miscited`) where that reads naturally.

Run it over everything that ships (`cli/templates`, `plugin`, `schemas`, `cli/src`). Fix genuine misspellings. Do
not change an identifier, a quoted error string a test or a script matches on, or a word in a recorded
measurement. Grep for every exact string before changing it.

## Out of scope

- Any change to this repository's own branch model, rulesets or adoption.
- Changing what `publish-main.sh` removes. It stays hand-written and repository-specific.
- scenewise's own setup (its wrappers, bootstrap, rulesets). That resumes in the scenewise session after 0.6.6.

## Done when

- A fresh `init` (no config) writes `"scriptsDir": "harness-scripts"`, `init --scripts-dir <dir>` works, and
  `doctor` passes in both cases. An existing config with `"scriptsDir": "scripts"` is untouched by `init`,
  `init --force` and `doctor`. The absent-key case behaves as the plan decided and is tested.
- The rendered workflows pass `zizmor --offline --no-config` (and the online audits), or each remaining finding is
  justified in the plan and in the template header.
- `typos` passes over the shipped files, or each remaining hit is recorded as deliberate.
- `npm test`, `bash scripts/test.sh` and the repository's own gates are green. The docs that state the default
  (`docs/config.md`, `docs/cli.md`, `docs/remote-execution.md`, `README.md`, `llms.txt`) match the new behaviour.
- `ROADMAP.md`/`CHANGELOG` notes (wherever this repository records releases) name the change, and the version is
  bumped to 0.6.6 for release.
