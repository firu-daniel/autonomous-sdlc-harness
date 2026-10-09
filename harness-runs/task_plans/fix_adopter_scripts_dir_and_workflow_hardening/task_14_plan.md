### Task 14 — Add gate 14d (`zizmor` over the rendered workflows) and gate 6f (`typos` over the shipped trees)

**Goal:** Two hand-written gate legs, run unattended by `scripts/run-gates.sh`, prove the two audits the story index decided and keep them proved.
- **14d** renders the workflows through `init` and runs `zizmor 1.30.1 --offline --no-config` over them. It fails on any finding outside the residual set.
- **6f** runs `typos 1.51.1` with its default configuration over `cli/templates`, `plugin`, `schemas` and `cli/src`. It fails on any hit outside the deliberate set.

Each is **SKIPPED** — never passed — where its tool cannot be resolved, on the existing 14c precedent. This applies the lesson that the branch which makes a decision also ships the gate step producing the real-shape figure (`harness-runs/lessons.md` → `## Evidence and measurement`).

**Depends on:** Tasks 7–13, which leave exactly these residuals and deliberate words. Each gate's allow-list encodes them, keyed on **file and identity**, never on a line number.
- **14d's residual set**, keyed on the rendered file, the `zizmor` audit id, and the job the finding sits in, read from `zizmor --format=json`:

  | File | Audit | Job |
  |---|---|---|
  | `harness-run.yml` | `artipacked` | `run` |
  | `harness-run.yml` | `artipacked` | `collect` |
  | `harness-run.yml` | `adhoc-packages` | `run` |
  | `harness-resume.yml` | `artipacked` | `poll` |
  | `harness-trigger.yml` | `artipacked` | `trigger` |
  | `harness-control.yml` | `artipacked` | `control` |
  | `harness-control.yml` | `adhoc-packages` | `control` |

- **6f's deliberate set**, keyed on the file path and the flagged word:
  - `UNPARSEABLE_CONTROL_RELEASES`, `UNPARSEABLE_CONTROL_IF_LINE` and `unparseableControlRoute`, wherever `cli/src/generators/githubWorkflows.ts`, `cli/src/commands/init.ts` and `cli/src/doctor/checks.ts` declare, import or `{@link}` them — the flagged words being `UNPARSEABLE` and `unparseable`;
  - `ines` in `plugin/agents/docs-reviewer.md`;
  - `Ein` in `plugin/instructions/mode_contract.md`;
  - `fo` in `plugin/hooks/lib/harness-config-lib.sh`.

**Where this task stops.** It adds the legs, but the legs themselves run in the Run gates phase. Under the test-run rule this task never runs a gate script, so its own verification is static plus a scratch probe of the tools. The prose in `docs/development.md` is Task 17's.

### Targets

- `scripts/check-rendered-workflows.mjs` — the new `--zizmor` mode.
- `scripts/check-typos.sh` (new) — the 6f leg. It is hand-written like `scripts/check-llms-txt.sh`, and not an `init` output.
- `scripts/run-gates.sh` — wires 14d and 6f.

**Work:**

- [ ] **`check-rendered-workflows.mjs`: add a `--zizmor` mode** beside `--actionlint`, reusing `withRendered`.
  - **Resolving the tool.** Use `zizmor` from `PATH`. Failing that, use `uvx zizmor@1.30.1` when `uvx` is on `PATH`. When neither resolves, or `uvx` cannot provide that version, print why and exit `4`, as `--actionlint` does.
  - **The run.** Run `zizmor --offline --no-config --format=json <render>/.github`, and turn every finding outside the residual set above into a `finding()`. A residual entry that no longer fires is a finding too, so the allow-list cannot go stale.
  - **The header.** Extend the usage and exit-contract block with the mode and the pinned version.
- [ ] **`scripts/check-typos.sh` (new).**
  - **The script's shape.** `#!/usr/bin/env bash`, `set -uo pipefail`, anchored to the repository root from `${BASH_SOURCE[0]}` (as `run-gates.sh` is). Its header states the rule, the deliberate set above with one reason per entry, the usage and the exit contract: `0` clean, `1` findings (each on stderr as `check-typos: <path> — <word>`), `2` bad usage, `4` the tool not available.
  - **Resolving the tool.** Use `typos` from `PATH`. Failing that, use `uvx --from typos@1.51.1 typos`. Otherwise exit `4`.
  - **The run.** Run `--format brief cli/templates plugin schemas cli/src` with the default configuration (no `--config`, no `_typos.toml`), and fail on every hit whose `(path, word)` pair is not in the deliberate set.
- [ ] **`run-gates.sh`: wire both legs**, on the 14c block's pattern: run, read the status, and treat `4` as SKIPPED with a reason that is counted among neither passes nor failures and is listed in the hand-run summary and the closing `hand_run` line.
  - **6f** goes after `6e`, as "6f shipped files pass typos".
  - **14d** goes after 14c, as "14d zizmor over the rendered workflows".
  - **The header.** Update its gate count and conditional list.
- [ ] **Keep both legs offline and outside the checkout.** `--zizmor` renders into the OS temp directory exactly as the other modes do, and passes `--offline`. `check-typos.sh` writes nothing. Neither leg names a machine path (gate 6a), and the online `--gh-token` audit stays the hand-run step in the story index's `Manual setup required:`.

**Verification:**

- **Syntax.** A probe under `harness-runs/scratch/`, run through `bash scripts/scratch-run.sh <probe>`, runs `node --check scripts/check-rendered-workflows.mjs`, `bash -n scripts/check-typos.sh` and `bash -n scripts/run-gates.sh`, each exiting `0`.
- **The tools and the allow-lists.** The same probe — not the gate scripts — runs `uvx zizmor@1.30.1 --offline --no-config --format=json` over a copy of the four edited templates. It runs `uvx --from typos@1.51.1 typos --format brief cli/templates plugin schemas cli/src`. It reports the residual and deliberate pairs it found. Each list must equal the matching allow-list above.
- **Read the wiring.** `run-gates.sh` treats exit `4` from each new leg as SKIPPED, not a pass and not a failure. The SKIPPED reason reaches both the gates-it-cannot-run block and the `hand_run` line.
- **The live run.** Both legs run for real in the Run gates phase.
