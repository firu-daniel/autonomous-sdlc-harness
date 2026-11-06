# Story: Say what `watcher.log` carries when the per-run profile renders and passes its check

## Context

`docs/watcher.md` → `### The per-run profile` says what `watcher.log` carries when the per-run profile cannot be rendered or fails its launch check (`not launching '<branch>': <reason>`), and nothing about the passing case. A reader looking for a "profile rendered" line finds none, because there is none. This branch adds **one sentence**, as its own paragraph, directly after the paragraph that opens *"Claude Code silently ignores a `--settings` file…"* and ends on the per-run profile's base-validity residual, and before the `**On a bubblewrap host (Linux, WSL2),**` paragraph. Nothing else in the document changes. The work is one `general`-layer task: `docs/` belongs to the catch-all layer (`.claude/context/conventions.md` → `## The layers`).

**What the code says. Task 1 writes from this, not from the task prompt's wording.** The prompt asks for each of its three claims to be checked against `autonomous-watcher.sh` before it is written. The source of truth is `cli/templates/scripts/autonomous-watcher.sh`. `scripts/autonomous-watcher.sh` is `init`'s copy in this checkout. It differs from the template only in park-loop and resume-prompt hunks, and none of them touches `launch_run`, `spawn_refuse`, `spawn_engine`'s render/check/record block, `run_profile_render` or `run_profile_check`. The check found two places where the prompt's literal wording is not true, and the sentence must be written to the code:

1. **A render and a check that pass log nothing of their own.** True as stated. `run_profile_render` and `run_profile_check` only set `RUN_PROFILE_REFUSAL` and return. Neither calls `log`. The one line on failure is `spawn_refuse`'s `log "not launching '$1': $2"`, which `spawn_engine` calls.
2. **The launch line comes before the render, not after it.** `launch_run` logs `launching headless run for '$branch' (engine=…) in … (log: …)` and **then** calls `spawn_engine`, which renders, checks and records. So a render or check refusal puts its `not launching '<branch>': <reason>` line **after** the launch line. The record that both passed is therefore the launch line with **no `not launching '<branch>'` line after it**, not "before it" as the prompt words it. `docs/development.md` (FR1) and `docs/sandbox-verification.md` (FR1 row) already read the job-mode case the same way: *"with no `not launching` line after it"*. The `launching headless run` line is also logged on a fresh local launch only. Every other `spawn_engine` caller logs its own line before a spawn that renders, checks and records the same way:
   - a park-resume logs `resuming parked run '<branch>' …`;
   - a pause-resume logs `resuming paused run '<branch>' …`;
   - the stall-watchdog relaunch logs `stall-watchdog: '<branch>' -> reset to the last commit and resume (restart #<n>)`, in local and job mode alike;
   - job mode's automatic resume logs `job: auto-resume <n>/<max> of '<branch>' after <why>, …`;
   - job mode's own dispatch logs `job: launching run for '<branch>' …`, `job: resuming parked run '<branch>' …` or `job: resuming paused run '<branch>' …`.

   The prompt requires the sentence to stay true for job mode. So the sentence names the fresh local launch's line and covers every other path with one generic clause: a resume, a stall-watchdog restart or a job logs its own line in its place. It never gives a partial list of exact lines. Task 1's `Verification:` lists every `spawn_engine` call site and checks the sentence against each one.
3. **`run_profile` names the rendered file outside job mode only.** `spawn_engine` writes `registry_set "$branch" run_profile "$settings_file"` only when `JOB_MODE` is not `1`, and only after `run_profile_check` passed. A failed write is itself a `not launching` refusal. In job mode nothing is rendered: the base profile is checked and passed unchanged, and no `run_profile` field is written.

On a **bubblewrap host** the clone's trust check (`hr_run_copy_check_var`) runs before the render, and its refusal also goes through `spawn_refuse` (`not launching '<branch>': the run copy failed its trust check before launch: <reason>`). The placeholder-sweep and manifest lines that can appear between the launch line and the session are not render or check lines. Both facts keep claims 1 and 2 true on that path without any extra clause.

**Top risks:** the likeliest failure is writing the prompt's claims as worded: *"no `not launching` line before it"*, and an unqualified `run_profile` claim. Either would put a false statement into a document of record. Task 1 guards both by stating the code facts in its `Work:` bullets and making its `Verification:` re-read each one against `spawn_engine` and `launch_run`. The second risk is the edit spreading: rewording the neighbouring paragraph, or also editing `docs/cli.md` §6's matching paragraph. The prompt confines the change to one sentence in `docs/watcher.md`, and Task 1's verification checks that the diff only adds lines.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. Only the committing role flips a marker to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets in a per-task file, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_sbx_flow_probe/task_<K>_plan.md`.

1. [ ] **Task 1** — Add the one sentence on what `watcher.log` carries when the per-run profile renders and passes its check _(layer: general)_ _(points: 5)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Add one sentence right after the paragraph that ends with the per-run profile's base-validity residual (the one starting "Claude Code silently ignores a `--settings` file…")."* and *"The one sentence is in place, and nothing else in the document changes."*

**Derivation entry — corpus files (command).** Re-run verbatim from the checkout root (read-only):

```
git grep -nE "not launching '<branch>'|launching headless run|launching run for '<branch>'" -- '*.md' ':!harness-runs/**'
```

It reaches every prose site outside the run-artifact tree that states what the watcher logs when a spawn passes or is refused.

**Derivation entry — standing-artifact rows (command).** Re-run verbatim: `git ls-files -- ':(glob)harness-runs/*'`. It lists the standing artifacts at the top of the state directory. None of them is a check-id matrix that covers `docs/watcher.md`, so this class contributes no row. A future output that lists such a matrix owes a procedure entry here.

**Closure invariant:** every site each derivation entry reaches appears as a row below. No site appears that no entry reaches.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/watcher.md` → `### The per-run profile`, the paragraph opening "Claude Code silently ignores a `--settings` file…" | — | command entry, `not launching '<branch>'` | `change` | Task 1. The new sentence goes in as its own paragraph directly after this one. This paragraph's own text is unchanged. |
| 2 | `docs/watcher.md` → `### The per-run profile`, the `**On a bubblewrap host (Linux, WSL2),**` paragraph ("…else `watcher.log` carries `not launching '<branch>': the run copy failed its trust check before launch: <reason>`") | — | command entry, `not launching '<branch>'` | `no-change` | The prompt allows one added sentence and no other change. The new sentence stays true on this path without editing it, because this refusal also comes after the launch line. |
| 3 | `docs/cli.md` §6, the per-run profile paragraph ("A refused check, or a copy that cannot be rendered, starts nothing: `watcher.log` carries `not launching '<branch>': <reason>`") | — | command entry, `not launching '<branch>'` | `no-change` | The prompt confines the change to `docs/watcher.md`, and this paragraph names `watcher.md` → `### The per-run profile` as its long form. |
| 4 | `docs/development.md` → FR1 ("the `Run the harness` step log's `job: launching run for '<branch>'` line, with no `not launching` line after it") | — | command entry, `launching run for '<branch>'` | `no-change` | Already states the job-mode form correctly ("after it"). Outside the prompt's one-document scope. |
| 5 | `docs/sandbox-verification.md` → the FR1 row of its results table ("`job: launching run for '<branch>'` line, with no `not launching` line after it") | — | command entry, `launching run for '<branch>'` | `no-change` | A measurement record of round 15. Editing it would falsify the record. Already consistent with the code. |
