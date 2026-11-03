# Architecture review — fix_linux_detached_gate_run

## Context

Branch `fix_linux_detached_gate_run`, reviewed 2026-11-03 against diff base `dev`. This run copy has no local `dev` branch, so it resolved to `origin/dev`. The review covers 49 changed files across the `cli`, `plugin` and `general` layers. They add the gate launcher `launch-sandboxed-gates.sh` as a new outer-loop template with its `OUTER_LOOP_SCRIPTS` row, give `run-test-suite.sh` a `--no-detach` form, factor `hr_placeholder_sweep_paths_var` out of the run library, add the `<gate_launcher>` mode-contract binding to the two Phase G cores and their four forks, add the sandbox probe's `gate-sandbox` leg, and change the docs and the notes-app re-render. 31 run-artifact files excluded from the reviewed diff.

Headline: the layering holds. The launcher is a template under `cli/templates/scripts/` and is declared once in `OUTER_LOOP_SCRIPTS`. The plugin cores name only the binding, never the script or `<MAIN_REPO>`, and every fork over a Phase G core binds it inline. Neither shipped half reaches into the other. One Must Fix remains: the launcher re-derives the Run gates lane layout, the label pattern, the staleness bound and the heartbeat-age reader as retyped "mirrors" of `run-test-suite.sh`, and the probe adds a third copy of the bound. Both scripts already source the run library, and that library is the declared owner of the state-dir paths the scripts "would otherwise each re-derive".

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Move the Run gates lane layout, label pattern, staleness bound and heartbeat age into the run library _(layer: cli, general)_
2. [x] **Finding 2** — Share the one-JSON-object profile predicate instead of re-typing it in the launcher _(layer: cli, general)_

## Must Fix

### 1. Move the Run gates lane layout, label pattern, staleness bound and heartbeat age into the run library
→ [finding_1.md](fix_linux_detached_gate_run_arch_review/finding_1.md)

## Should Fix

### 2. Share the one-JSON-object profile predicate instead of re-typing it in the launcher
→ [finding_2.md](fix_linux_detached_gate_run_arch_review/finding_2.md)
