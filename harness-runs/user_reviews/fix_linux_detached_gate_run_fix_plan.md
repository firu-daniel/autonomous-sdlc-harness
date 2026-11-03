# User-Review Fix Plan: fix_linux_detached_gate_run

## Context

**Branch:** `fix_linux_detached_gate_run`
**Source user review:** `harness-runs/user_reviews/fix_linux_detached_gate_run_review.md`
**Summary:** The user flagged 4 observations about the gate launcher `launch-sandboxed-gates.sh`. Two are trust gaps: the launcher accepts the main checkout as its target in local mode, and it picks the per-run profile from `XDG_STATE_HOME` / `HOME`. One is a stale conventions rule. The last is two plan-review Should Fix items that were never applied. All 4 were verified in the current tree and are valid. Observation 4 holds two items, so it becomes two findings, which gives 5 findings in all.

**How observation 4 was resolved.** The user's "plan review after Task 1" maps to the structural plan review of the redrafted plan. That plan-review loop ran just before Task 1 was implemented. Its two Should Fix items appear in `harness-runs/task_plan_reviews/fix_linux_detached_gate_run/review_1.md` (`## Should Fix` 1 and 2). `review_2.md` raised both again as *"Not addressed from round 1"*. The story index has no `## Rejected findings` section, so neither item was ever recorded as rejected. No other plan review of this branch carries an unapplied Should Fix pair:

- `architecture_reviews/.../review_0.md`'s and `review_1.md`'s Should Fix items belong to the plan before the ruling, and `review_2.md` records them as resolved.
- `review_2.md`, `review_3.md` and `review_4.md` carry none.

Both items still hold in the tree, so they are Findings 4 and 5.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only, and the committer never touches them.

Each entry resolves to `harness-runs/user_reviews/fix_linux_detached_gate_run_fix_plan/finding_<K>.md` through its `**Finding K**` reference. The list runs from the lowest blast radius to the widest. Finding 4 edits the launcher header list that Finding 2 trims, so it comes after Finding 2. Finding 1 adds a library function, a launcher check and fixtures, so it comes last.

1. [x] **Finding 3** — `.claude/context/conventions.md` → `## Shell assets`: name `launch-sandboxed-gates.sh` as the fourth main-checkout wrapper whose call carries no `$`. _(layer: general)_
2. [x] **Finding 5** — Drop *"on every host"* from the semi-autonomous `<gate_launcher>` `none` reason in both forks, and limit it to what `init` writes for that flow. _(layer: plugin, general)_
3. [ ] **Finding 2** — The watcher records the per-run profile's absolute path in the run's registry record, and the launcher reads it from there. No environment variable chooses the profile. _(layer: cli, general)_
4. [ ] **Finding 4** — State the launcher's remaining environment reads (`PATH`, `HOME`) together with the measured ground that keeps an assignment prefix from setting them. _(layer: cli, general)_
5. [ ] **Finding 1** — Accept the main checkout as the launcher's target only in job mode, decided from the main checkout's run registry. Add fixtures for the local-mode refusal and the job-mode acceptance, and update residual 13. _(layer: cli, general)_

---

## Must Fix

### 1. The gate launcher accepts the main checkout as its target in local mode
→ [finding_1.md](fix_linux_detached_gate_run_fix_plan/finding_1.md)

### 2. The per-run profile the launcher reads is chosen by `XDG_STATE_HOME` / `HOME`
→ [finding_2.md](fix_linux_detached_gate_run_fix_plan/finding_2.md)

---

## Should Fix

### 3. `## Shell assets` names three main-checkout wrappers; there are four
→ [finding_3.md](fix_linux_detached_gate_run_fix_plan/finding_3.md)

### 4. Plan-review Should Fix 1, never applied: the launcher's environment reads are stated without the measured ground that makes them safe
→ [finding_4.md](fix_linux_detached_gate_run_fix_plan/finding_4.md)

### 5. Plan-review Should Fix 2, never applied: the semi-autonomous `<gate_launcher>` reason claims *"on every host"*
→ [finding_5.md](fix_linux_detached_gate_run_fix_plan/finding_5.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

_None._ Every observation was verified against the current working tree and is valid.

---

## Source observations

This is a verbatim copy of `harness-runs/user_reviews/fix_linux_detached_gate_run_review.md`. **This section stays in the index.**

1. **The gate launcher accepts the main checkout as its target in local mode.** Must fix. A session in a run copy can aim `launch-sandboxed-gates.sh` at the main checkout. The launcher treats that as job mode and gives the worker a writable main checkout. Use a source the session cannot write to decide job mode: the main checkout's run registry. Accept the main checkout as the target only when no live record names a run copy other than the main checkout. In local mode the calling session's own record names its run copy, so the call is refused. Verify what job mode writes to the registry first. If the registry can't tell the two apart, have the watcher's job mode write a job-mode marker the session cannot write, and read that instead. Add fixtures for local-mode refusal and job-mode acceptance, and update residual 13.

2. **The per-run profile path still comes from `XDG_STATE_HOME` / `HOME`.** Must fix. If they are changed, the launcher can read a crafted profile and lose the read-only protection inside the run copy. When the watcher renders the per-run profile, it records the profile's absolute path in the run's registry record. The launcher reads the path from there, and keeps its regular, non-link and single-JSON-object checks. No environment variable decides which profile is read. Name the watcher change in the plan. Add fixtures for a redirected `XDG_STATE_HOME` / `HOME` with no effect, and for a missing or unreadable record field, which is a refusal. Drop the residual line in the launcher's header that this closes. The registry is gitignored and already stores absolute paths (`worktree`, `log_path`), so the new field is the same kind of value. But no fixture, test or document may hold a real home-directory path: build every path under a `mktemp -d` directory, so `scripts/run-gates.sh` gate 6a stays clean.

3. **`.claude/context/conventions.md` → `## Shell assets` lists three main-checkout wrappers.** Should fix. There are four now: add the launcher with the same two grounds.

4. **Two Should Fix items from the plan review after Task 1 were never applied** (the writer held them for a go-ahead that was never relayed). Should fix. Apply both, or record each under `## Rejected findings` with its reason.
