# Architecture review — fix_remote_plugin_version_pin

## Context

Branch `fix_remote_plugin_version_pin`, reviewed 2026-09-29 against `dev` (implemented-solution mode, iteration 0). Reviewed: the `cli` layer (`cli/src/commands/init.ts`, `cli/src/core/writer.ts`, `cli/src/doctor/checks.ts`, `cli/src/generators/githubWorkflows.ts`, `cli/src/remote/githubActions.ts`, the two workflow templates, three test suites) and the `general` layer (`docs/cli.md`, `docs/development.md`, `docs/remote-execution.md`, `scripts/tag-release.sh`, `scripts/probe-plugin-cli.sh`). 14 run-artifact files excluded from the reviewed diff. Headline: the layering holds. Nothing crosses the `cli`/`plugin` boundary. The generator reads the tree and only enqueues. It replaces through a per-request `forceOverride` rather than a new `WritePolicy`, and the re-run table in `core/writer.ts` is amended to match. `init` only calls predicates and reports. `doctor` grades with a `warn` and repairs nothing. The pin name and its reader are owned by `remote/githubActions.ts`, and the new behaviour comes with fixture tests. The one Must Fix: a YAML-scalar unquote routine has been copied into two `cli/src` areas. There are also two non-blocking string-ownership points.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Move the duplicated YAML-scalar unquote into one `cli/src/core/` owner _(layer: cli)_
2. [ ] **Finding 2** — Give the `npx autonomous-sdlc-harness@<version>` prefix one producer in doctor's version warning _(layer: cli)_
3. [ ] **Finding 3** — Declare the template mirror of the upgrade route in `githubWorkflows.ts`'s header _(layer: cli)_

## Must Fix

### 1. Move the duplicated YAML-scalar unquote into one `cli/src/core/` owner
→ [finding_1.md](fix_remote_plugin_version_pin_arch_review/finding_1.md)

## Should Fix

### 2. Give the `npx autonomous-sdlc-harness@<version>` prefix one producer in doctor's version warning
→ [finding_2.md](fix_remote_plugin_version_pin_arch_review/finding_2.md)

### 3. Declare the template mirror of the upgrade route in `githubWorkflows.ts`'s header
→ [finding_3.md](fix_remote_plugin_version_pin_arch_review/finding_3.md)
