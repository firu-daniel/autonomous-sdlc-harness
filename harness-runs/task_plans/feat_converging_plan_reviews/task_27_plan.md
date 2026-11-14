### Task 27 — Bring this checkout's self-adopted scripts and run-artifact READMEs level with the templates

**Goal:** This repository has adopted its own harness (`.claude/context/conventions.md` → `## Documents of record`), so `scripts/` and `harness-runs/` hold `init`'s output for this checkout. Make the copies of every template this branch changed byte-identical to their templates, and add the new `plan_revisions/README.md`, so this checkout's own next planning run walks the format-2 graph with the walker that reads it.

**Depends on:** Task 1 (`cli/templates/scripts/lib/flow-walker-gates.sh`), Task 2 (`cli/templates/scripts/flows/task_plan_writing.graph.json`), Task 3 (`cli/templates/scripts/flow-walker.sh`), Task 7 (`cli/templates/scripts/lib/harness-run-lib.sh`, `cli/templates/scripts/remote-run.sh`) and Task 8 (`cli/templates/state-dir/plan_revisions/README.md`, `…/task_plan_reviews/README.md`, `…/architecture_reviews/README.md`, `…/architecture_user_review_reviews/README.md`). Each template is final when this task runs; this task copies and edits nothing in them.

**Where this task stops.** Only copies whose template changed on this branch, and only those this checkout already carries, plus the one new directory README: `harness-runs/` has no `business_parity_reviews/` or `business_parity_user_review_reviews/` README today (`git ls-files harness-runs/business_parity_reviews/README.md` prints nothing, `phases.parity` being `false` here), so none is added. Nothing is rendered: these outer-loop files are copied verbatim, never templated (`docs/cli.md` → *"Two families land in `scriptsDir`"*).

### Targets

- `scripts/flow-walker.sh`, `scripts/lib/flow-walker-gates.sh`, `scripts/flows/task_plan_writing.graph.json`, `scripts/lib/harness-run-lib.sh`, `scripts/remote-run.sh`
- `harness-runs/task_plan_reviews/README.md`, `harness-runs/architecture_reviews/README.md`, `harness-runs/architecture_user_review_reviews/README.md`
- `harness-runs/plan_revisions/README.md` (new)

**Work:**

- [ ] Copy each of the five `cli/templates/scripts/…` files over its `scripts/…` counterpart, preserving the executable bit `scripts/flow-walker.sh` and `scripts/remote-run.sh` carry — the template `cli/templates/scripts/remote-run.sh` is not executable, so a copy that takes the template's mode drops it (`git ls-files -s scripts/flow-walker.sh scripts/remote-run.sh` shows mode `100755` before and after).
- [ ] Copy the three changed state-dir READMEs over their `harness-runs/…` counterparts, and create `harness-runs/plan_revisions/README.md` as a copy of `cli/templates/state-dir/plan_revisions/README.md`.

**Verification:**

- `cmp cli/templates/scripts/flow-walker.sh scripts/flow-walker.sh`, and the same `cmp` for each of the other eight template / copy pairs above, prints nothing.
- `git status --porcelain -- scripts` lists only the five script targets: no other self-adopted script was touched.
