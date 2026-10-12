### Task 6 — Thin `task-plan-reviewer.md` structure checks, pointing the register shape at the writer's `**Scope closure:**` bullet

**Goal:** Shorten the reviewer's structural checks — story-index structure, per-task-file structure, sub-step checkboxes and index↔file correspondence — to direct checks stated once, and replace the reviewer's restatement of the `## Scope register` shape with a read of the writer's `**Scope closure:**` bullet, so the pair states that shape once. Every check keeps its trigger and its severity.

**Depends on:** Task 5, which thinned the lines above `## What to check`; and Task 2, which kept `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md` → `## Process` → the `**Scope closure:**` bullet as the full statement of when a register is owed and what it carries — its trigger and durable-corpus definition, its place in the index, items (a)–(d) with both derivation forms and the table header, the site and standing-artifact-row rules, and the all-source / mixed-plan rule. This task points at that bullet; it does not restate it.

**Source:** `docs/work-report-research/task-plan-reviewer.md` → `## Prose classification` (rows Story-index structure through Index↔file correspondence) and `## Thinning plan`, as input only; the standard is `.claude/context/plugin.md` → `## Writing agent prose`.

**Where this task stops.** It edits only the lines from the `## What to check` heading up to, not including, the `### Architecture (Must Fix)` heading. Every `###` heading in this range keeps its exact text (the reviewer cites `### Architecture`, `### Granularity & tags` and `### Per-task-file structure` by name). Task 7 owns the rest of `## What to check`.

### Targets

- `plugin/agents/task-plan-reviewer.md` → `## What to check` → `### Story-index structure (against `sample_story_plan.md` — Must Fix when missing)`, `### Per-task-file structure (against `sample_story/task_<N>_plan.md` — Must Fix when missing)`, the **Sub-step checkboxes** paragraph, `### Index↔file correspondence (Must Fix)` and the line *"The checks below apply **per per-task file** unless noted …"*.

**Frozen in this range — keep byte-for-byte** (each also appears in an agent outside this family):
- *"- `## Phase 2 Readiness — Ordered Fix List` section **placed immediately after Context**."* — the bullet's opening.
- The whole bullet line beginning *"- **A recorded rejection is an addressed finding only once you have tested it.**"*.
- The whole bullet line beginning *"- A count mismatch in either direction — a readiness entry with no file, or a file with no readiness entry —"*.

**Wire text to keep byte-for-byte:** `# Story:`, `## Context`, `Top risks:`, `Manual setup required:`, `### Sources of truth`, `### Targets`, `## Phase 2 Readiness — Ordered Fix List`, the entry shape `` `N. [ ] **Task K** — <short title> _(layer: <one of <layer_names>>)_ _(points: <N>)_` ``, `## Tasks`, `## Scope register`, `## Rejected findings`, `rebutted round <j> — call stands`, `### Task N — <title>`, `**Depends on:**`, `**Source:**`, `**Work:**`, `**Verification:**`, `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md`, `**Scope closure:**`.

**Work:**

- [ ] **Story-index structure, apart from the register.** Keep each check and its severity: `# Story:` at top; `## Context` prose only, `Top risks:` and `Manual setup required:` expected — a missing `Top risks:` is a Should Fix, index-level `### Sources of truth` / `### Targets` present is a Must Fix (absent is not a finding); the readiness heading byte-exact, immediately after Context and holding `[ ]` entries, else Must Fix; every entry in the entry shape (its tag values checked in `### Architecture` and `### Granularity & tags`); an entry title or a `## Scope register` `change` row that schedules an edit to a `layers[].conventions` document is the same Must Fix as the target check in `### Architecture`, a conventions-document site taking `no-change` always; a `## Tasks` heading or any task body is a Must Fix. Tighten wording only.
- [ ] **The `## Scope register` bullet.** Replace its restatement of the register's definition and shape (the durable-corpus definition, the placement, items (a)–(d), the site definition) with: when the plan owes a register, read `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md` → `## Process` → the `**Scope closure:**` bullet — the shape you grade against. Keep, as the reviewer's own grading rules: read the obligation off the plan's `### Targets` lists rather than judging it (all-source owes none, a mixed plan owes a register over its corpus targets only); exactly two Must Fix triggers — absent when owed, or a position that breaks the order (`## Phase 2 Readiness` not right after `## Context`, or `## Rejected findings` not last); a `Site` cell citing a line coordinate instead of a path plus symbol or quoted anchor is a Should Fix; and the section's presence is never a format break — at most a Nice to Have on a plan that owes none.
- [ ] **Per-task-file structure and sub-step checkboxes.** Keep: the `### Task N — <title>` heading with the "Task N" prefix, no checkbox, and filename, heading and readiness entry agreeing; self-containment with every required field (Goal, `**Work:**`, `**Verification:**`, `### Targets` — a file-touching task with none is a Must Fix — and `**Source:**` when single-source) and the optional ones with their conditions (`**Depends on:**`; `### Sources of truth` only when parity is on, and a parity task citing no source is a Must Fix); cross-task interfaces restated on both sides, with a consumer relying on the producer's body or two files claiming one file being a Must Fix. Cut the per-unit-review-folder rationale. Sub-steps: keep "`- [ ]` bullets inside per-task files are informational and never a finding; only the readiness list's `[ ]` markers drive iteration and commits", in fewer words.
- [ ] **Index↔file correspondence.** Keep the strict 1:1 rule both ways, the frozen count-mismatch line, "name the offending entry or file", and the line stating that the checks below apply per per-task file unless noted. Tighten wording only.

**Verification:**

- `wc -w plugin/agents/task-plan-reviewer.md` prints less than it did before this task's edit.
- `git diff -- plugin/agents/task-plan-reviewer.md` (this task's uncommitted edit) shows no change outside this range, no changed `###` heading, and no removed frozen line.
- Each frozen string and wire string above is found by `grep -c -F -e '<string>' plugin/agents/task-plan-reviewer.md` (a non-zero count).
- Open the writer's `**Scope closure:**` bullet and confirm every register property the old reviewer text stated (`git show 4cbe7f72:plugin/agents/task-plan-reviewer.md`, the `## Scope register` bullet) is stated there or kept here as a grading rule — none is lost.
