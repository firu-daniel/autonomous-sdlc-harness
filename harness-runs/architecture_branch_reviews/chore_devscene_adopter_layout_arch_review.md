# Architecture review: chore_devscene_adopter_layout

## Context

**Branch:** `chore_devscene_adopter_layout`. **Date:** 2026-11-12. **Mode:** implemented solution (iteration 0).

**Diff base.** The given base `dev` has no local branch in this checkout, so the diff was taken against its remote-tracking ref `origin/dev` (`git diff origin/dev...HEAD`). 46 run-artifact files excluded from the reviewed diff.

**What was reviewed.** 462 files, grouped by segment and reviewed hunk by hunk:
- `cli/src` (30 files)
- `cli/templates` and `cli/scripts`
- `cli/test` (121 files)
- `plugin/` (agents, commands, instructions, hooks, scripts, samples, docs)
- `schemas/` and its negative fixtures
- `scripts/` (this repository's own probe, Gate 12 and gate scripts)
- `docs/`, `evals/`, `docs-retrieval-service/`
- `examples/`, including the frozen capture moved byte-identical from `examples/notes-app/sdlc-harness/` to `examples/notes-app/devscene/`
- the root `.gitignore` and `githooks/pre-push`

The rules applied are `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` and `harness-runs/lessons.md`.

**Headline conclusion: no architecture violation.** The branch is a rename/respelling. It keeps every layer boundary and monopoly the conventions documents state:
- **Configuration contract.** It landed schema-first in its four places: `schemas/devscene.config.schema.json`, then `cli/src/config/model.ts`, then `cli/src/config/check.ts`, then `docs/config.md` §5. `DEFAULTS.scriptsDir` and `stateDir` equal the schema `default`s (`devscene-scripts`, `devscene/`).
- **Shared constants.** `CONFIG_FILENAME`, `TASK_OFFER_PATH`, `MENTION_COMMAND_NAME`, `POLL_STATE_ARTIFACT_NAME` and the stub markers are each changed once, at their owner. There is no new second source. `INIT_SCRIPTS_DIR` is now bound to `DEFAULTS.scriptsDir` and is not retyped.
- **Plugin shell assets.** They still resolve configuration only through `plugin/hooks/lib/harness-config-lib.sh`. The `scriptsDir` fallback moved in step across that library, the script-allowlist guard, `cli/templates/scripts/lib/harness-run-lib.sh` and the four workflow templates.
- **Cross-half references.** `cli/src` names the renamed plugin command file only in a doc comment, so no runtime import crosses between the two halves.
- **Template placement.** The renamed template `cli/templates/claude/devscene-task-offer.md` mirrors its adopter-side path. The renamed command `plugin/commands/analyze.md` carries its slash-command name verbatim.
- **Test fixtures.** The test changes stage the Gate 12 and sandbox-probe drivers under `os.tmpdir()`, beside the template run library, never inside this checkout.

**Deferred, not graded here.** The three `.claude/context/*.md` conventions documents still cite the pre-rename paths, for example `schemas/harness.config.schema.json` and `/harness-analyze`. The story plan defers them to a maintainer hand edit as `stale-rule` corpus staleness, and they are outside this diff.

**One finding.** It is a Should Fix outside the architecture lens: the generated placeholder prefix lost its space, and the tests were respelled to pin that output.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Restore the space in the generated `harness_fail "devscene: ` placeholder prefix _(layer: cli)_

## Must Fix

_None._

## Should Fix

### 1. Restore the space in the generated `harness_fail "devscene: ` placeholder prefix
→ [finding_1.md](chore_devscene_adopter_layout_arch_review/finding_1.md)

## Nice to Have

_None._
