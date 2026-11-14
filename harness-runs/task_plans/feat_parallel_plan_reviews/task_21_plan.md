### Task 21 — Bring this checkout's self-adopted walker, graph and analytics copies level with the templates

**Goal:** This repository has adopted its own harness (`.claude/context/conventions.md` → `## Documents of record`), so `scripts/` holds `init`'s output for this checkout. Make the copies of every outer-loop template this branch changed byte-identical to their templates, so this checkout's own next planning run walks the format-3 graph with the walker that reads it and records overlapping sub-agents correctly.

**Depends on:** Task 1 (`cli/templates/scripts/lib/flow-walker-gates.sh`), Task 2 (`cli/templates/scripts/flows/task_plan_writing.graph.json`), Task 3 (`cli/templates/scripts/flow-walker.sh`) and Task 9 (`cli/templates/scripts/lib/run-analytics.jq`, `cli/templates/scripts/lib/run-analytics-report.jq`). Each template is final when this task runs; this task edits nothing in them.

**Where this task stops.** Only copies whose template changed on this branch. Nothing is rendered: these outer-loop files are copied verbatim, never templated (`docs/cli.md` → *"Two families land in `scriptsDir`"*). No `harness-runs/` README changes, because no state-dir template changed.

### Targets

- `scripts/flow-walker.sh`, `scripts/lib/flow-walker-gates.sh`, `scripts/flows/task_plan_writing.graph.json`, `scripts/lib/run-analytics.jq`, `scripts/lib/run-analytics-report.jq`

**Work:**

- [ ] Copy each of the five `cli/templates/scripts/…` files over its `scripts/…` counterpart, keeping each copy's existing mode — `git ls-files -s` on the five shows the same mode before and after (`scripts/flow-walker.sh` is `100755`).

**Verification:**

- `cmp cli/templates/scripts/flow-walker.sh scripts/flow-walker.sh`, and the same `cmp` for each of the other four pairs, prints nothing.
- `git status --porcelain -- scripts` lists exactly the five targets: no other self-adopted script was touched.
