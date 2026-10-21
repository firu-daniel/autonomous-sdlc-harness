# Story: Remove the permission rules Claude Code ignores from the unattended profile

## Context

`chore_sandbox_manual_verification` found two kinds of generated permission rule that Claude Code 2.1.299 accepts and never consults (`docs/sandbox-verification.md` → F4, rows D1 and W5). **`Write(path)` rules**, allow and deny: the permissions page says file permissions are checked against `Edit(path)` and `Read(path)` rules only, and `Edit` rules cover every file-editing tool, `Write` included. The write protection held only because every protected path also has an `Edit` deny. **`Bash(bash <work_root>/<project_name>-*/scripts/<x>.sh:*)` allow rules**: a `*` mixed with the trailing `:*` is matched as a literal prefix, so no wrapper is ever allowed under a run copy's absolute path. The space-star spelling is not a fix. Its first `*` crosses `/`, and with two wildcards it stops matching a wrapper called with no arguments. So a glob spelling of any form is ruled out.

This branch does three things:

- **Generate `Edit` file-tool rules only.** `writeProtection.ts` → `fileToolDenyRules`, the template's `permissions.allow`, and the watcher's per-run map are the three places that emit `Write` rules, and they change together because `watcher-run-profile.test.mjs` pins the watcher's map to `fileToolDenyRules`. `doctor`'s `profile-write-protection` then requires an `Edit` deny only. **A profile that still carries `Write` rules is not a failure**: `doctor` neither requires nor reports them.
- **Replace the glob wrapper rules with an exact path.** The base profile drops its third, sibling-glob form for every wrapper and every agent-invocable outer-loop script. That leaves two forms in the base: the repo-relative invocation and the main-checkout absolute path. The watcher's per-run copy already names the run copy by its exact path. It now also appends, for every base `permissions.allow` and `permissions.ask` entry that starts `Bash(bash <MAIN_REPO>/<scripts_dir>/`, the same entry re-rooted at `Bash(bash <copy>/<scripts_dir>/`, to the same list. Because `ask` twins are added too, the deploy wrapper stays asked about in its run-copy spelling. `run_profile_check` accepts exactly those appends and refuses any other. The script-allowlist guard has to say the same thing as the profile, so it stops vouching for **other** sibling run copies' wrappers. It vouches only for the scripts directory of the checkout it judges, which in a run is the run's own copy. `.claude/context/conventions.md` → `## Shell assets` already describes the guard that way: *"one under the session's own scripts directory"*.
- **Record the post-merge `--debug` re-run as owed rows** in `docs/sandbox-verification.md`. A run cannot launch the sandboxed sessions that measure it. The rows say what the re-run must show: the protected paths still refuse writes, a run copy's wrapper called by its absolute path is allowed, and the `--debug` log carries no `is not matched by file permission checks` or `mixes * with the trailing :* prefix syntax` warning for any generated rule.

The work is cut into single-layer tasks in the configured layer order: `cli` (Tasks 1–4), then `plugin` (Tasks 5–6), then the catch-all `general` (Tasks 7–10). Each file has exactly one owning task. **The pinned mirrors span tasks, so some suites go red between commits.** After Task 1, `cli/test/doctor-profile-sandbox.test.mjs` is red until Task 2 lands, and `cli/test/profile.test.mjs`'s write-protection cases are red until Task 3 lands. Every task verifies only the test files it edits (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`). After Task 3 the whole suite is expected green, and `commands.test` is the closing check. One project rule cannot be met under one-layer-per-task: `docs/guard-verification.md` → `### What a later change owes this section` asks that a guard's decision rows land *in the same commit* as the guard. The guard is plugin-layer (Task 5) and the record is general-layer (Task 8), so the rows land in Task 8's commit on the same branch and merge together with the guard.

**Top risks:** The first risk is a per-run wrapper twin built from a prefix that does not byte-match the base's main-checkout entries. That re-roots nothing and fails silently, as the glob did. Task 1 derives both prefixes from one helper, and its tests assert a twin for every main-checkout wrapper rule a real `init` wrote. The second risk is `run_profile_check` widening into accepting arbitrary `allow` appends, which would let a tampered per-run copy grant anything. Task 1 accepts only exact twins of base entries and keeps the existing `Bash(*)` tamper case refused. The third risk is that dropping the `Write` allow pair leaves file *creation* ungranted. The permissions page says `Edit` rules cover `Write`, and Task 3's tests assert the `Edit` allow pair for the checkout and the sibling glob. But that claim is only confirmed in a real session by the owed W6 row (Task 9), which is why the `--debug` re-run is a required post-merge step and not an optional one.

**Manual setup required:**

- After merge, a person runs the `--debug` re-run of `docs/sandbox-verification.md`'s write-protection rows on a regenerated profile and fills the owed rows W6–W8 that Task 9 adds. The run itself cannot launch those sessions.
- After merge, a person re-takes `docs/guard-verification.md`'s §1.2 latency figure for `autonomous-script-allowlist-guard.sh`, by hand and outside any headless session, because Task 5 moves guard code. Task 8 records the decision rows but no wall-clock figure (lessons ledger, *Evidence and measurement*).
- After merge, a person re-renders this checkout's self-adopted `scripts/autonomous-watcher.sh` from `cli/templates/scripts/autonomous-watcher.sh`, as `98bac0ff` and `4692f32e` did for earlier template changes, and runs `npx autonomous-sdlc-harness init --force` here to regenerate the machine-local `.claude/settings.autonomous.json`. Until then this checkout's own runs use the old profile and watcher.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational progress markers for the implementer. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_profile_inert_permission_rules/task_<K>_plan.md`. The entries are in ship order: bottom-up in the configured layer order, with the catch-all layer last.

1. [x] **Task 1** — Per-run profile: `Edit`-only file-tool deny map, and the run copy's exact wrapper twins _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — `doctor` requires an `Edit` deny rule only and never grades a `Write` rule _(layer: cli)_ _(points: 10)_
3. [x] **Task 3** — Base profile: drop the `Write` allow pair and the sibling-glob wrapper rows _(layer: cli)_ _(points: 20)_
4. [ ] **Task 4** — Restate the wrapper forms in `cli/scripts/README.md` and the QA profile fragment _(layer: cli)_ _(points: 5)_
5. [ ] **Task 5** — Script-allowlist guard vouches only for its own checkout's scripts directory _(layer: plugin)_ _(points: 15)_
6. [ ] **Task 6** — The pause step names the `Edit` rule that grants its file writes _(layer: plugin)_ _(points: 5)_
7. [ ] **Task 7** — Restate the profile's file-tool rules and wrapper forms in `docs/cli.md`, `docs/watcher.md` and `docs/development.md` _(layer: general)_ _(points: 15)_
8. [ ] **Task 8** — Record the guard narrowing's decision rows in `docs/guard-verification.md` _(layer: general)_ _(points: 10)_
9. [ ] **Task 9** — Record F4's fix and the owed `--debug` re-run rows in `docs/sandbox-verification.md` _(layer: general)_ _(points: 10)_
10. [ ] **Task 10** — Bring the example project's profile in line with the generator _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Generate `Edit` rules only, and have `doctor` stop requiring a `Write` rule."* and *"Replace the glob wrapper rules with an exact-path form, or drop them and document the spellings that do match."* The predicate's durable-corpus sites are text that states which file-tool rules the profile generates, or which forms a wrapper is allow-listed in. Application source and its comments (`*.ts`, `*.mjs`, `*.sh`) are planned as code inside the tasks and are excluded from the derivations by pathspec.

**Derivation entry A — `Write` rules and the `Edit`/`Write` pair (command).** Re-run verbatim from the checkout root:

```
git grep -lE 'Write\(|`Write` (rule|deny|allow|pair)|Edit` and (a )?`Write|Edit and a Write|Edit ?/ ?`?Write|Edit`/`Write|`Read`, `Edit` and `Write|`Edit` / `Write`|sibling worktree glob' -- . ':!harness-runs' ':!*.sh' ':!*.ts' ':!*.mjs'
```

**Derivation entry B — the wrapper's form count and the sibling-glob wrapper spelling (command).** Re-run verbatim from the checkout root:

```
git grep -lE 'three forms|THREE FORMS|THREE WAYS|three literal forms|three allow forms|\*\*all three\*\* forms|worktree twin|run-copy twin|sibling-worktree glob|-\*/scripts/|worktree_glob>/<scripts|sibling-worktree pattern beside' -- . ':!harness-runs' ':!*.sh' ':!*.ts' ':!*.mjs'
```

**Derivation entry C — the guard's sibling-run-copy statement (command).** Re-run verbatim from the checkout root:

```
git grep -lE 'sibling (worktree|run cop|working[- ]cop)' -- plugin/hooks/README.md docs/guard-verification.md docs/outer-loop-verification.md
```

**Derivation entry D — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md harness-runs/improvement_suggestions.md`. **Artifact:** those two standing ledgers. **Traversal:** each file's topic headings in file order, then the one-line entries under each. **Decision rule:** an entry is reached when it names a permission-rule form, meaning a `Write(` or `Edit(` path rule, a `Bash(bash …)` wrapper rule, or the `<worktree_glob>` spelling of one, or names the script-allowlist guard's sibling-run-copy arm. Walked on 2026-10-21, it reached no entry, so it contributes no row below. A re-walk that reaches one owes it a row.

**Closure invariant:** every site any entry above reaches appears as a row below. Every derivation command's output is a subset of the `Site` column's paths, and no hit falls outside the register.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/claude/settings.autonomous.json` → `permissions.allow` / `ask` rows and the `_README` lines *"CREATING A FILE AND CHANGING ONE ARE TWO DIFFERENT GRANTS"*, *"EVERY WRAPPER … ALL THREE FORMS"* and their neighbours | — | A, B | `change` | Task 3 |
| 2 | `cli/templates/claude/settings.autonomous.qa.json` → `_README` *"listed there in all three forms a caller may use"* | — | B | `change` | Task 4 |
| 3 | `cli/scripts/README.md` → *"Coverage is a row, not a mechanism."* | — | B | `change` | Task 4 |
| 4 | `plugin/instructions/autonomous_pause_and_ledger.md` → `## Resolved values` `<worktree_glob>` row and §2.2 step (a) | — | A | `change` | Task 6 |
| 5 | `plugin/hooks/README.md` → the `autonomous-script-allowlist-guard.sh` outcome row and `## The deny list` | — | C | `change` | Task 5 |
| 6 | `docs/cli.md` → *"Every wrapper is allow-listed in three forms"*, *"Everything that runs outside the sandbox is write-protected on both sides"*, *"Each run adds its own copy's paths by exact path"*, residual 2, the `profile-write-protection` bullet | — | A, B | `change` | Task 7 |
| 7 | `docs/watcher.md` → *"Why only the `yes` rows carry a profile entry"*, **What it adds.**, **The launch check.** | — | A, B | `change` | Task 7 |
| 8 | `docs/development.md` → *"The `$HOME` half is a different matter"* (*"plus the sibling-worktree pattern beside each"*) | — | B | `change` | Task 7 |
| 9 | `docs/development.md` → *"Item 6 owed two things its row did not name"* (*"emits the three literal forms"*) | — | B | `no-change` | a roadmap item's shipped narrative, recording what that change did when it landed. Rewriting it falsifies the record |
| 10 | `docs/guard-verification.md` → `### 3.1 Narrowed — allow → SILENT` (and the dated N53, N86, N118 and keeper-control rows that say *sibling worktree*) | — | C | `change` | Task 8 adds new rows. The dated rows stay as the record of their date |
| 11 | `docs/sandbox-verification.md` → `## 1.` D1 note, `**Write protection: Edit and Write**`, `## 5.` F4 | — | A, B | `change` | Task 9 |
| 12 | `examples/notes-app/.claude/settings.autonomous.json` | — | A, B | `change` | Task 10. It is a live, rendered fixture file (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*) |
| 13 | `docs/typecheck-key-decision.md` → **The permission entries.** (*"contributes **three** allow entries"*) | — | B | `no-change` | a decision record of what was true when the decision was taken |
| 14 | `docs/github-integration-research.md` → the 2.1.285 `.claude/` write-wall measurement (`Write(.claude/**)`) | — | A | `no-change` | a dated measurement record. The rule it quotes is the scratch profile that was measured |
| 15 | `plugin/instructions/task_plan_writing_instructions_core.md` → **The three forms.** | — | B | `no-change` | the flow walker's three invocation forms, unrelated to permission rules |
| 16 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → *"the walker's three forms"* | — | B | `no-change` | the same walker forms, unrelated to permission rules |
| 17 | `docs/work-report-research/branch-reviewer.md` | — | A | `no-change` | dated research report quoting the template as it stood. Editing it falsifies the record |
| 18 | `docs/work-report-research/docs-writer.md` | — | A | `no-change` | as row 17 |
| 19 | `docs/work-report-research/review-plan-reviewer.md` | — | A | `no-change` | as row 17 |
| 20 | `docs/work-report-research/skeptic-reviewer.md` | — | A | `no-change` | as row 17 |
| 21 | `docs/work-report-research/task-plan-writer.md` | — | A | `no-change` | as row 17 |
| 22 | `docs/work-report-research/ui-tests-plan-writer.md` | — | A | `no-change` | as row 17 |
| 23 | `docs/work-report-research/user-review-fix-plan-writer.md` | — | A | `no-change` | as row 17 |
| 24 | `docs/work-report-research/reviews/committer.md` | — | A | `no-change` | as row 17 |
| 25 | `docs/work-report-research/reviews/docs-reviewer.md` | — | A | `no-change` | as row 17 |
| 26 | `docs/work-report-research/reviews/docs-writer.md` | — | A | `no-change` | as row 17 |
| 27 | `docs/work-report-research/reviews/layer-implementer.md` | — | A | `no-change` | as row 17 |
| 28 | `docs/work-report-research/reviews/review-plan-reviewer.md` | — | A | `no-change` | as row 17 |
| 29 | `docs/work-report-research/reviews/statistics-plan-writer.md` | — | A | `no-change` | as row 17 |
| 30 | `docs/work-report-research/reviews/task-plan-writer.md` | — | A | `no-change` | as row 17 |
| 31 | `docs/work-report-research/reviews/ui-tests-plan-reviewer.md` | — | A | `no-change` | as row 17 |
| 32 | `docs/work-report-research/reviews/user-review-fix-plan-writer.md` | — | A | `no-change` | as row 17 |
| 33 | `docs/outer-loop-verification.md` → `### 1.8` **Reachability, driven on the `init` fixture.** (*"returns the three allow forms (repo-relative, repo-root-absolute, sibling-worktree glob)"*); `## 3.` **Which outer-loop scripts carry a generated permission entry, and which an agent can actually run.** (*"returns the three allow forms per script"*); the `## 3.` matrix row *"the same three spellings on an **allowed** basename"* (`allow` ×3, one spelling a sibling-working-copy path); and the `## 4.` residual *"`refresh-branch.sh` ships allow-listed and unrouted"* (*"the profile emits its three allow forms"*) | — | B, C | `no-change` | a dated measurement record, as rows 13 and 14 are: each cited row is stamped *Driven 2026-08-31* / *Driven 2026-09-03*, and the file's own rule (`## 0. Method and fixtures`: *"replacing a row means re-running the recipe rather than editing the cell"*) forbids editing a cell to match a later profile or guard. Tasks 3 and 5 change what a re-drive of these rows would return, so the next re-drive of §1.8 and §3 re-stamps them. No task in this branch re-drives them |
| 34 | `examples/notes-app/README.md` → **The one edit the kept artifacts carry, and where it landed.** (*"The file now carries 212 `/workspace`-rooted occurrences"*, and *"every `Read` / `Edit` / `Write` file rule, every wrapper `Bash` entry"*) | — | A | `change` | Task 10. Not a frozen-capture file (`.claude/context/conventions.md` → `## Documents of record`); it records the live fixture's substitution figures and is kept current whenever the fixture is re-rendered, as `7a760676` (#122) did |
