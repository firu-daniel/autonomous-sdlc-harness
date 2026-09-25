# Architecture review — feat_remote_execution_github_actions

## Context

Branch `feat_remote_execution_github_actions`, reviewed 2026-09-26 against `dev` (`git diff dev...HEAD`). 43 run-artifact files excluded from the reviewed diff. The review covered 61 changed files in five segments: the `cli/src` TypeScript (the `execution.target` model, check and schema contract, the new `cli/src/remote/githubActions.ts` area, `core/git.ts` → `pathAtRef`, the `githubWorkflows` generator, `init`, `doctor` and its two new checks, the permission-profile plugin-root builder); the `cli/templates` shell and YAML (`remote-run.sh`, the watcher's `job` and remote-dispatch passes, `harness-run-lib.sh`, `restart-watcher.sh`, the two workflow templates); the `cli/test` suites; the `plugin/` commands, guard, hooks README and pause protocol; and the `general` documents and schema fixture. The story plan was read for intent only.

Headline: the layering holds. The configuration key lands in all four places, schema first (schema, `config/model.ts`, `config/check.ts`, `docs/config.md` §5). The negative fixture is wired into `validate:config:negative`. Every `git` probe stays in `core/git.ts`, and `gh` has one owner, run with a fixed argument vector. The generator enqueues through the write plan with its re-run table rows and an idempotence test. The new template home `github/` is registered, the outer-loop row and the guard's deny entry land together, the shell library sets no options, and no plugin asset reaches into `cli/src`. Two Must Fix findings. First, the workflow template spells the machine cache path of the docs-retrieval runtime, which is owned by `retrieval/runtime.ts` and `machine/paths.ts`, and neither module's header declares that mirror, although the retrieval header itself calls an undeclared mirror a defect. Second, the new generator reaches into the `retrieval/` area for this package's manifest reader. Now that a second area needs that reader, it belongs in `core/`. Two Should Fix findings: module headers that this branch left inaccurate.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Declare the workflow template's mirror of the retrieval cache path in its owning headers _(layer: cli)_
2. [ ] **Finding 3** — Correct `remote/githubActions.ts`'s mirror list, which names the watcher _(layer: cli)_
3. [ ] **Finding 4** — Update the `agentInvocable` doc comment now that the guard carries `remote-run.sh` _(layer: cli)_
4. [ ] **Finding 2** — Move this package's manifest reader out of `retrieval/` into `core/` _(layer: cli)_

## Must Fix

### 1. Declare the workflow template's mirror of the retrieval cache path in its owning headers
→ [finding_1.md](feat_remote_execution_github_actions_arch_review/finding_1.md)

### 2. Move this package's manifest reader out of `retrieval/` into `core/`
→ [finding_2.md](feat_remote_execution_github_actions_arch_review/finding_2.md)

## Should Fix

### 3. Correct `remote/githubActions.ts`'s mirror list, which names the watcher
→ [finding_3.md](feat_remote_execution_github_actions_arch_review/finding_3.md)

### 4. Update the `agentInvocable` doc comment now that the guard carries `remote-run.sh`
→ [finding_4.md](feat_remote_execution_github_actions_arch_review/finding_4.md)

## Nice to Have

None.
