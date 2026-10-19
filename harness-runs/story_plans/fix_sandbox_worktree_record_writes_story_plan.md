# Story: Route a run's commits through an excluded main-checkout wrapper, so sandboxed runs can commit again

## Context

Under the profile `feat_unattended_bash_sandbox` shipped, no sandboxed git call in a linked worktree can write that worktree's record, `<main>/.git/worktrees/<name>/`. `git add`, `commit`, `fetch`, `stash` and `switch` all fail with `Operation not permitted` on `index.lock`, `FETCH_HEAD`, `index` or `HEAD.lock` (`docs/sandbox-verification.md` rows G1 and G2, failure F1). `commit-on-branch.sh` runs sandboxed, so every unattended run parks at its first commit, the flow-progress ledger (row G3). Five profile and launch-line changes were measured and none opened the record (G2). `git branch <x>` succeeds from the same session, so `<main>/.git/refs` is writable. A `git add` with its cwd in the main checkout succeeds. Only a record outside the session's cwd is closed.

**The decision this plan is built on: take goal 3, the excluded-wrapper route, now.** Goals 1, 2 and 4 are measurements. Each one needs a headless `claude -p` session launched with the profile under test, and nothing a run can do provides that. A run is either sandboxed itself, and macOS's sandbox cannot be nested, or it runs under a different profile from the one being measured. So this branch does three things:

- it ships the route that works whatever the runtime does with the record: goal 3, which is the task prompt's own fallback;
- it records goal 1's candidate measurements as owed rows, each with an exact procedure;
- it lists every measurement as a manual step below.

The evidence on file supports the route. On Claude Code 2.1.299, macOS, headless, no profile change opened the record (G2). Two things could still reverse it, and Manual setup step 2 settles both:

- **The installed version has changed.** This machine now runs 2.1.303, so G1 has to be taken again on the version that is installed.
- **One reading of the shipped binary is a lead, not evidence.** 2.1.303's bundled sandbox code appears to grant write on a worktree's git common dir and to deny, per record, only `config.worktree`, its lock and `commondir`. If that is right, the record may already be writable on 2.1.303.

Whether a measured opening should replace this route is a decision for the maintainer after that step. No document on this branch writes it as pending work (`harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer"*).

**What the route is.** The main checkout's own `commit-on-branch.sh` joins `push-branch.sh` and `refresh-branch.sh` as a `sandbox.excludedCommands` entry: `bash <main>/<scriptsDir>/commit-on-branch.sh:*`, the bare form P1a and P2 measured to match. An excluded command runs with full access, so the wrapper takes on everything its two siblings carry before any git call:

- the inherited `GIT_*` environment is dropped (`hr_git_env_drop`);
- the main checkout is placed from the script's own location (`hr_wrapper_main_of`);
- the target must be the main checkout or a worktree it lists (`hr_wrapper_target_check_var`);
- the record's `config.worktree` must hold nothing but the `core.hooksPath` `setup-worktree.sh` writes (`hr_worktree_config_check_var`);
- `core.hooksPath` is pinned to the main repository's hooks directory (`hr_pinned_hooks_path`);
- the branch is read once from the main checkout (`hr_wrapper_branch_var`);
- the protected set is read from the main checkout's `harness.config.json`, never the target's.

After those checks, git never re-reads the target's records. **The commit has one owner, and the wrapper does not get a second copy of it.** The watcher's `hr_commit_placed` already builds its commit by plumbing. Task 1 factors that core out into one library function, `hr_commit_paths_var` in `cli/templates/scripts/lib/harness-run-lib.sh`. `hr_commit_placed` calls it with unchanged behaviour, and the wrapper calls it after its own checks (`.claude/context/conventions.md` → `### Where a new responsibility goes`). The function works as follows:

- each path is hashed with `--no-filters` into a private temporary index seeded from the branch tip, so no filter driver runs;
- the tree is written, and `commit-tree` builds the commit on the tip;
- `update-ref` moves `refs/heads/<branch>`, guarded by its old value;
- the working copy's own index (the record's `index`) is updated for those paths.

Every call in it runs with `core.hooksPath=/dev/null`. The wrapper refuses a path whose attributes select a filter driver, so such a path is never committed raw without anyone noticing. **No commit hook runs.** A hook runs project content, and running it with full access is exactly the escape the profile exists to prevent. The wrapper's exit contract (0 committed, 1 error, 2 protected branch, 3 nothing to commit) and its stdout line `commit-on-branch.sh: committed <short_sha> on <branch>` stay byte-identical, because every commit point parses them.

**The spelling every caller uses has to change too.** Today every commit point calls the worktree's copy repo-relative, `bash <scripts_dir>/commit-on-branch.sh`. That copy sits in a sandbox-writable tree, so it can never be excluded, and it keeps failing on the record. Every commit point in the plugin therefore moves to the spelling the push already uses: `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> <path>... -- "<subject>"`, issued as the call's only command. `<MAIN_REPO>`, `<repo_root>` and `<branch>` are each spelled as the literal text they resolve to, and **no `$` appears anywhere in the command**. From a worktree, the script-allowlist guard does not vouch for the main checkout's copy, so the profile's literal form-(ii) `allow` entry is the call's only grant, and a command carrying a shell expansion does not match it (`plugin/instructions/autonomous_pause_and_ledger.md` §1.6, which states this for the push). That rules out today's `--repo "$REPO_ROOT"` and `${branch}` in a subject alike. A compound stays sandboxed, as it does for the push.

**The other index writers the flows call** are two, and Task 7 removes both:

- the bare `git add -- <state_dir>/improvement_observations/<branch>.md` re-stage that `plugin/instructions/improvement_observations_instructions.md` prescribes after a wrapper exit 1. It is replaced by a second call to the wrapper with the same path. The wrapper syncs the working copy's index for its paths on exit 3 as well as on exit 0, so that call re-stages the reverted file and returns 3;
- the `git mv` that `plugin/agents/layer-implementer.md` → `## Output contract` item 2 expects for every renamed file, and that `plugin/agents/layer-reviewer.md` → step 2 reads off `git status --short`. It writes the record's `index`, so it fails sandboxed in a linked worktree exactly as `git add` does (G1, F1). The implementer instead writes the new path with the file tools and removes the old one with a plain `rm`. The committer passes a deleted path's parent directory, which the wrapper's STAGING POLICY already prescribes, so the commit carries both halves.

No flow calls `git fetch`, `git stash`, `git switch` or `git checkout`. The latter two are on the profile's `ask` list in any case, and `refresh-branch.sh` already runs as the main checkout's copy.

**Write protection needs no new path.** The main checkout's `commit-on-branch.sh` is already in `protectedPaths`, as a script the watcher or a person runs. The `runsUnsandboxed` flag moves it into the unsandboxed-wrapper group with that group's reason, and its `lib/` is protected already. Every protected path stays protected, and `allowWrite` is not widened at all.

**The work is cut into eleven single-layer tasks, in bottom-up ship order.**

- **Task 1 (`cli`)** factors `hr_commit_placed`'s plumbing core into one library function and rebuilds the wrapper template on it.
- **Tasks 2 and 3 (`cli`)** are its two test suites: the trust checks, then the commit mechanics.
- **Task 4 (`cli`)** sets the flag and adjusts `doctor` and the profile tests.
- **Task 5 (`cli`)** restates the adopter-facing template prose.
- **Tasks 6–8 (`plugin`)** move every commit point to the new spelling and drop the "hook failure" wording the wrapper no longer earns. Task 6 owns the canonical statements the others cite. Task 7 also replaces the bare `git add` re-stage and the `git mv` rename.
- **Tasks 9–11 (`general`)** carry the change into `docs/cli.md`, `docs/watcher.md`, the two verification records and the live worked example.

`phases.parity` is `false`, so nothing here is held to a reference implementation.

**What this branch does not touch.**

- The self-adopted copies under this checkout's root `scripts/`, and the gitignored, machine-local `.claude/settings.autonomous.json`. Both are `init`'s output here (`.claude/context/conventions.md` → `## Documents of record`), and refreshing them is Manual setup step 1.
- The guard hooks under `plugin/hooks/`. No guard decision changes: the main checkout's copy is granted by the profile, not by the guard.
- The measured cells of `docs/sandbox-verification.md` and `docs/outer-loop-verification.md`. They are dated records. Task 10 adds rows and notes, and the measurements themselves are manual.

**Top risks:**

- **The excluded wrapper is a new path to full access.** Anything it lets git run executes unsandboxed: a hook, an `fsmonitor`, a filter driver, a configuration read from the record. Task 1 runs no hook during the commit, hashes with `--no-filters` and refuses a filtered path, pins the hooks directory, and runs every call against `<main>/.git` while borrowing only the record's `index`. It shares the commit core with `hr_commit_placed`, so a second, drifting copy is never written, and `hr_commit_placed`'s existing suites stay green unedited. Tasks 2 and 3 prove each refusal and the no-hook property on a fixture, including records rewritten between the checks and the commit.
- **A commit point left on the old spelling, or carrying a `$`, is refused or fails at its first commit.** Tasks 6–8 each close with the same grep: every `commit-on-branch.sh` invocation in `plugin/` is the `<MAIN_REPO>` spelling with `--repo <repo_root>`, and no `"$REPO_ROOT"` or `${branch}` survives in one.
- **The route rests on a measurement taken on an older Claude Code, and the full flow stays unproven until a human runs it.** Manual setup steps 2–4 take it. Even then, the full flow will stop at Run gates on macOS until `fix_run_gates_sandbox_tmpdir` (F2) lands.

**Manual setup required:**

1. **Bring this checkout's own unattended files up to the merged branch** (depends on Tasks 1, 4 and 5). Regenerate the profile, so `sandbox.excludedCommands` carries `bash <main>/scripts/commit-on-branch.sh:*` beside the two existing entries. Use the forced self-adopt `init` that `docs/sandbox-verification.md` → `## 0. Method` describes, restoring the hand-kept files it rewrites, or add the entry by hand as the string `doctor`'s `profile-sandbox` names. Then put the merged `cli/templates/scripts/commit-on-branch.sh` at `<main>/scripts/commit-on-branch.sh` **together with** the merged `cli/templates/scripts/lib/` at `<main>/scripts/lib/`. The wrapper alone is not enough: the root `scripts/lib/harness-run-lib.sh` lags the template and does not define `hr_git_env_drop` (`grep -n hr_git_env_drop scripts/*.sh scripts/lib/*.sh` prints nothing). The script runs `set -uo pipefail` without `-e`, so a lone copy would carry on past `command not found` with the inherited `GIT_*` environment, outside the sandbox. The root `push-branch.sh` and `refresh-branch.sh` source that same library, so re-render them in the same step; whether to re-render the rest of the directory too is the maintainer's call, since the root `scripts/` is deliberately held back until `chore_self_adopt_regeneration_friction`. Confirm that `doctor`'s `profile-sandbox` and `profile-write-protection` pass, with and without `--remote-job`.
2. **Take goal 1's measurements on the installed Claude Code** (no task dependency). Run rows G4–G7, which Task 10 adds to `docs/sandbox-verification.md` §2 with exact procedures. Use §0's launch line, one exact call per probe, with positive controls in the same session. Record each Observed and Verdict cell with `claude --version`.
3. **Re-run the record-protection and ordinary-git rows on the regenerated profile** (depends on step 1 and Task 10). These are G1, WR1–WR7 and the new commit-wrapper rows CW1–CW6. Under the wrapper route, G1's raw `git add` is still expected to fail sandboxed. CW1 is the row that must pass.
4. **Re-run the full-flow row, goal 4** (depends on steps 1 and 3). Drop one small throwaway task into the inbox and run it under the regenerated profile and `dontAsk` as G3 did. Read its stream for refusals through to branch-ready-for-review. Unless `fix_run_gates_sandbox_tmpdir` has landed, the Run gates phase is expected to fail as F2 records. Note how far the flow got, and every `permission_denials` entry for a call the flow needs.
5. **Re-drive `docs/outer-loop-verification.md` §1.1 by hand against the new wrapper** (depends on Task 1). Use the main checkout as the target, then a linked worktree, then restamp per that document's own recipe. Tasks 2 and 3 assert the same rows automatically.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** In every flow that dispatches the `committer` agent, that agent is the committing role. In the supervised flow, which dispatches none, the orchestrator itself is. No implementer changes a marker here, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_sandbox_worktree_record_writes/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [ ] **Task 1** — Rebuild `commit-on-branch.sh` as an excluded main-checkout wrapper: the target and per-working-copy checks, then a plumbing commit through the core it now shares with `hr_commit_placed` _(layer: cli)_ _(points: 20)_
2. [ ] **Task 2** — Add `cli/test/commit-on-branch-target-check.test.mjs`: the commit wrapper's refusals, hooks pin and protected set _(layer: cli)_ _(points: 15)_
3. [ ] **Task 3** — Add `cli/test/commit-on-branch-plumbing.test.mjs`: the commit wrapper's exit contract, index sync, no commit hook, and records rewritten after its checks _(layer: cli)_ _(points: 15)_
4. [ ] **Task 4** — Mark `commit-on-branch.sh` `runsUnsandboxed`, and adjust `doctor`'s missing-entry message, the write-protection header and the profile tests _(layer: cli)_ _(points: 15)_
5. [ ] **Task 5** — Restate the excluded set in the profile template's `_README`, and correct the two code comments that describe the old wrapper _(layer: cli)_ _(points: 10)_
6. [ ] **Task 6** — Move the canonical commit mechanics to the main checkout's literal spelling: `autonomous_pause_and_ledger.md` §1.6, the docs engine's single source, dispatch discipline and `AUTONOMOUS_FLOW.md` _(layer: plugin)_ _(points: 15)_
7. [ ] **Task 7** — Move the committer and the two artifact commit points to the new spelling, and replace the bare `git add` re-stage and the `git mv` rename _(layer: plugin)_ _(points: 20)_
8. [ ] **Task 8** — Move the four autonomous forks' commit points, the fix-plan core's wrapper statement and the user-review-fix command to the new spelling _(layer: plugin)_ _(points: 15)_
9. [ ] **Task 9** — Update `docs/cli.md` §6 and §7 and `docs/watcher.md` for three excluded wrappers and the plumbing commit _(layer: general)_ _(points: 15)_
10. [ ] **Task 10** — Add goal 1's owed measurement rows and the commit-wrapper rows to `docs/sandbox-verification.md`, and the owed note to `docs/outer-loop-verification.md` _(layer: general)_ _(points: 15)_
11. [ ] **Task 11** — Re-render the worked example's profile for the third excluded wrapper _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"route the run's git writes through the excluded main-checkout wrapper family, as push and refresh already are. That means `commit-on-branch.sh`, and anything else the flows call that writes the index or `HEAD`. Give each one the same target and per-working-copy configuration checks the excluded wrappers carry. Write-protect it on both sides."* Together with goal 1: *"Record each measurement in `docs/sandbox-verification.md`."*

The register covers the plan's **corpus** targets only. These are owned by their per-task files instead, because they are code and code comments:

- the source and test targets: `cli/src/**/*.ts` and `cli/test/*.test.mjs`;
- the shell templates under `cli/templates/scripts/`;
- the guard hooks under `plugin/hooks/`.

**Derivation entry A — corpus files that name or describe the commit wrapper (command).** It matches the file name and the prose "commit wrapper" / "commit-wrapper", so a site that restates the spelling without naming the file is reached too. Re-run verbatim from the checkout root:

`grep -rliE --include='*.md' --include='*.json' --include='*.txt' 'commit-on-branch|commit[ -]wrapper' plugin docs README.md ARCHITECTURE.md ROADMAP.md llms.txt CONTRIBUTING.md cli/README.md cli/scripts cli/templates/README.md cli/templates/claude cli/templates/scripts/README.md examples/notes-app/.claude examples/notes-app/README.md`

**Derivation entry B — corpus files that describe the excluded set or the worktree record (command).** Re-run verbatim from the checkout root:

`grep -rliE --include='*.md' --include='*.json' --include='*.txt' 'excludedCommands|excluded wrapper|two wrappers run outside|commands run outside the sandbox|worktrees/<name>|worktree.?s record' plugin docs README.md ARCHITECTURE.md ROADMAP.md llms.txt CONTRIBUTING.md cli/README.md cli/scripts cli/templates/README.md cli/templates/claude cli/templates/scripts/README.md examples/notes-app/.claude examples/notes-app/README.md`

**Derivation entry C — rows of the standing sandbox matrix (procedure).**

- **First step, runnable:** `grep -n -E '^(\| [A-Z][A-Z]*[0-9]|- ).*(excludedCommands|excluded|worktrees/|record|commit-on-branch)' docs/sandbox-verification.md`.
- **Artifact:** `docs/sandbox-verification.md`, the standing record of measured sandbox rows.
- **Traversal:** the headline bullets, then §0's bullets, then every table row in file order (§1 D, §2 G, §3 P/R/H/C/K/L, §4 N/S/W/WR/Q, §5 F/T), then the §6 bullets.
- **Decision rule:** a bullet or row is reached when its own line names `excludedCommands`, the word `excluded`, a path under `worktrees/`, the word `record`, or `commit-on-branch`. This is exactly the first step's match set.

**Derivation entry D — sections of the outer-loop verification record (procedure).**

- **First step, runnable:** `grep -n -E '^#{2,3} .*commit-on-branch' docs/outer-loop-verification.md`.
- **Artifact:** `docs/outer-loop-verification.md`.
- **Traversal:** each `##`/`###` section in file order.
- **Decision rule:** a section is reached when its heading names `commit-on-branch`. A reached section is one site, and its rows are listed in the site cell.

**Derivation entry E — documents that state figures about the worked example's rendered profile (command).** Task 11 changes that file's line and occurrence counts. Re-run verbatim from the checkout root:

`grep -rln -E '[0-9]+ .?/workspace' examples/notes-app/README.md docs README.md`

**Derivation entry F — flow-corpus files that prescribe, expect or grant `git mv` (command).** Re-run verbatim from the checkout root:

`grep -rl --include='*.md' --include='*.json' --include='*.txt' -e 'git mv' plugin/agents plugin/commands plugin/instructions plugin/docs plugin/samples cli/templates/claude examples/notes-app/.claude`

**Closure invariant:** every site any of the six derivation entries reaches appears as a row below. The rows reached by entries C and D are identified by their row id or section heading.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `README.md` → the flow diagram's edge `"commit-on-branch.sh + push-branch.sh after every unit"` | — | A | `no-change` | still true: every unit commits through that wrapper and pushes |
| 2 | `docs/development.md` → `## 5` corpus-content criteria paragraph, and the item-6 history paragraph ("the outer-loop trio") | — | A | `no-change` | a criteria example and a dated history of item 6; neither describes how the wrapper runs |
| 3 | `docs/guard-verification.md` → the keeper-control paragraphs and rows W19 and W23 | — | A | `no-change` | dated measurements of the guard's decisions on the repo-relative spelling. The guard is unchanged, and those spellings still exist |
| 4 | `docs/outer-loop-verification.md` → the stale-count paragraph ("The other two — `commit-on-branch.sh`, `setup-worktree.sh` — have comment-only diffs since the stamp"), plus the other places that name the wrapper: §1.3's "whole scripts directory copied outside a repository" row, §1.6's `jq`-floor row (`commit-on-branch.sh` → exit 1, `HEAD` unchanged), and the §4 permission rows | — | A | `change` | Task 10 changes the stale-count paragraph. The other rows are left as they are: Task 1 keeps both their outcomes (exit 1, nothing written), and the §4 rows are a dated guard measurement |
| 5 | `docs/retrieval-eval-results.md` → the eval case whose `ref` is `docs/outer-loop-verification.md#11-commit-on-branchsh--refuses-loudly` | — | A | `no-change` | an evaluation record. Task 10 keeps the §1.1 heading byte-identical, so the anchor still resolves |
| 6 | `docs/sandbox-verification.md` → **Who reads this:**, §2's text around the table, the new rows G4–G7 and CW1–CW6, the owed-re-run notes | — | A, B | `change` | Task 10 |
| 7 | `docs/watcher.md` → the outer-loop table row `commit-on-branch.sh`, and the trust-class rows "the artifact commit, formerly through `commit-on-branch.sh`" and "`commit-on-branch.sh`, as the watcher called it" | — | A | `change` | Task 9 |
| 8 | `docs/work-report-research/committer.md` | — | A | `no-change` | dated research report of the committer's word budget |
| 9 | `docs/work-report-research/docs-reviewer.md` | — | A | `no-change` | dated research report |
| 10 | `docs/work-report-research/docs-writer.md` | — | A | `no-change` | dated research report |
| 11 | `docs/work-report-research/statistics-plan-writer.md` | — | A | `no-change` | dated research report |
| 12 | `examples/notes-app/.claude/context/conventions.md` → the fixed-subject provenance line | notes-app capture | A | `no-change` | frozen capture (`.claude/context/conventions.md` → `## Documents of record`) |
| 13 | `examples/notes-app/.claude/settings.autonomous.json` → `_README` lines, `sandbox.excludedCommands`, `sandbox.filesystem.denyWrite`, the `Edit`/`Write` deny rules; and the `"Bash(git mv:*)"` allow entry | notes-app render | A, B, F | `change` | Task 11, mirroring Tasks 4 and 5. The `git mv` allow entry is left as the template renders it (row 28) |
| 14 | `plugin/agents/committer.md` → `<scripts_dir>` row, the opening paragraph's "you do NOT skip hooks: a failing hook is fixed or surfaced", step 3's stage-path set (a deleted path), step 4 and its "never skip hooks", the exit map's "hook failure", step 6 and the `ui_test_pass` step f | — | A | `change` | Task 7 |
| 15 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → step 3's sentence "name `commit-on-branch.sh` repo-relative, while the push names the main checkout's copy" | — | A | `change` | Task 8 |
| 16 | `plugin/docs/AUTONOMOUS_FLOW.md` → the "Git wrappers" row | — | A | `change` | Task 6 |
| 17 | `plugin/instructions/autonomous_pause_and_ledger.md` → `<scripts_dir>` row and §1.6 | — | A | `change` | Task 6 |
| 18 | `plugin/instructions/clarification_digest_instructions.md` → `<scripts_dir>` row and `## Commit mechanics` | — | A | `change` | Task 7 |
| 19 | `plugin/instructions/dispatch_discipline_instructions.md` → `<scripts_dir>` row and `## Commit mechanics` | — | A | `change` | Task 6 |
| 20 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` | — | A | `change` | Task 6 |
| 21 | `plugin/instructions/docs_phase_instructions.md` → the "Commit + push" bullet and the paragraph citing the docs engine's single source | — | A | `no-change` | names the wrapper by basename and cites the single source, which Task 6 changes. It quotes no spelling |
| 22 | `plugin/instructions/improvement_observations_instructions.md` → `<scripts_dir>` row, `## Commit mechanics` including the **Wrapper exit status** paragraph's bare `git add` and its "exit 1 (non-git dir / detached HEAD / hook failure …)", and `## Push`'s **No exit-code gate** note's "(exit 1, hook failure)" | — | A, B | `change` | Task 7. Entry B's hit, the `.git/worktrees/<name>` pointer example in its redaction rule, is about path redaction and is unaffected |
| 23 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **Exact staging + commit** and its block, the ledger and docs-commit bullets, overrides 9 and 10, Override D's **Wrapper exit status (surface the error).** "exit 1 (… hook failure …)", and Override E's **No exit-code gate** note's "(exit 1, hook failure)" | — | A | `change` | Task 8 |
| 24 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → the `<app_dir>` row of `## Resolved values` ("the commit wrapper's `<scripts_dir>` path below is repo-relative and runs from `$REPO_ROOT`"), both **Commit mechanism** paragraphs and blocks, the ledger creation and flip paragraphs, and the "If a hook fails, surface the error …" sentence in Override 3 and in Override 4 | — | A | `change` | Task 8 |
| 25 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `<app_root>` row, **Commit mechanism**, both blocks, the R-ledger paragraphs, Override 3's "If a hook fails, surface the error …" and Override 5's "A hook failure is surfaced exactly as Override 3 surfaces one." | — | A | `change` | Task 8 |
| 26 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → **Exact staging + commit**, both blocks, the flip and docs-commit bullets, Override D's **Wrapper exit status (surface the error).** "exit 1 (… hook failure …)", and Override E's "(exit 1, hook failure)" | — | A | `change` | Task 8 |
| 27 | `ARCHITECTURE.md` → the permission-model row ("`sandbox.excludedCommands` takes a bare command pattern") | — | B | `no-change` | states the entry's form, not which wrappers it names, and the form is unchanged |
| 28 | `cli/templates/claude/settings.autonomous.json` → `_README` lines "THE NETWORK ALLOWLIST IS EMPTY…", "TWO COMMANDS RUN OUTSIDE THE SANDBOX…", "CREDENTIALS ARE DENIED ON BOTH SIDES…"; and the `"Bash(git mv:*)"` allow entry | template | B, F | `change` | Task 5, for the `_README` lines. The `git mv` allow entry is not changed: an `allow` entry grants nothing the sandbox refuses, and a supervised session or an adopter's own work may still run `git mv` from the main checkout, where the record is writable |
| 29 | `docs/cli.md` → §6 **Two wrappers run outside the sandbox**, the target-check paragraph, the write-protection paragraph, residuals 5–7; §7 `profile-sandbox` bullet | — | B | `change` | Task 9 |
| 30 | `plugin/agents/layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.**, and `## Output contract` item 2 ("For each renamed file: `git mv <old> <new>` confirmation") | — | B, F | `change` | Task 7, for item 2: a rename is done with the file tools and a plain `rm`, never `git mv`. The sandbox-refusal paragraph is unchanged: it names `excludedCommands` as something never to route a command through or ask for, which is still the rule |
| 31 | `docs/sandbox-verification.md` headline bullet "No sandboxed git call in a linked worktree can write that worktree's record" | — | C | `change` | Task 10: points at this branch's route and the owed rows |
| 32 | `docs/sandbox-verification.md` headline bullet "The two `excludedCommands` entries match nothing" | — | C | `no-change` | about `fix_sandbox_excluded_commands_form`'s rows. Unaffected |
| 33 | `docs/sandbox-verification.md` §0 bullet "`excludedCommands` names the 2 wrapper rules;" | — | C | `no-change` | dated record of the 2026-10-14 regeneration |
| 34 | `docs/sandbox-verification.md` row D1 | — | C | `no-change` | measured cell |
| 35 | `docs/sandbox-verification.md` row G1 | — | C | `no-change` | measured cell. Task 10's §2 note marks it owed; Manual setup step 3 re-runs it |
| 36 | `docs/sandbox-verification.md` row G2 | — | C | `no-change` | measured cell. Task 10 adds G4–G7 beside it rather than editing it |
| 37 | `docs/sandbox-verification.md` row G3 | — | C | `no-change` | measured cell. Manual setup step 4 re-runs it |
| 38 | `docs/sandbox-verification.md` row P1a | — | C | `no-change` | the measurement the commit wrapper's excluded spelling rests on. Cited, not changed |
| 39 | `docs/sandbox-verification.md` row P2 | — | C | `no-change` | scratch-profile evidence for the bare form |
| 40 | `docs/sandbox-verification.md` row R0 | — | C | `no-change` | measured cell, owed by `fix_sandbox_excluded_commands_form`'s note |
| 41 | `docs/sandbox-verification.md` row R3 | — | C | `no-change` | measured cell (the record's `index` `shasum` is evidence, not a claim this branch moves) |
| 42 | `docs/sandbox-verification.md` row R4 | — | C | `no-change` | the repo-relative `refresh-branch.sh --local` stays sandboxed and no flow calls it. Still accurate |
| 43 | `docs/sandbox-verification.md` row C2 | — | C | `no-change` | measured for the push wrapper. Task 10 adds CW rows for the commit wrapper's own refusal |
| 44 | `docs/sandbox-verification.md` row K1 | — | C | `no-change` | a sandboxed `git config` write. No wrapper involved |
| 45 | `docs/sandbox-verification.md` row W0 | — | C | `no-change` | write-probe controls |
| 46 | `docs/sandbox-verification.md` rows WR1, WR2, WR3 (one row each in the matrix) | — | C | `no-change` | measured cells. The protected set is unchanged. Manual setup step 3 re-runs them |
| 47 | `docs/sandbox-verification.md` row Q1 | — | C | `no-change` | `.claude/**` write under `dontAsk`, unrelated |
| 48 | `docs/sandbox-verification.md` row F1 | — | C | `change` | Task 10: the follow-up cell names this branch's route and the owed rows |
| 49 | `docs/sandbox-verification.md` row F3 | — | C | `no-change` | about the entry spelling, which is unchanged |
| 50 | `docs/sandbox-verification.md` §6 bullet **The `name` entry on `<main>/.git/worktrees/*`** | — | C | `no-change` | still true: sandboxed git still cannot write the record, so what the entry adds is still unmeasured |
| 51 | `docs/sandbox-verification.md` §6 bullet **Headless parity:** | — | C | `no-change` | records what the documents expected at measurement time |
| 52 | `docs/sandbox-verification.md` §6 bullet **How the Linux sandbox treats a `denyWrite` entry containing `*`:** | — | C | `no-change` | still not run |
| 53 | `docs/outer-loop-verification.md` → `### 1.1 \`commit-on-branch.sh\` — refuses **loudly**`, all eleven table rows (ordinary branch; the same command again; HEAD on `trunk`; HEAD on `release/1.0`; HEAD on `trunk` with `protectedBranches: []`; HEAD on `main`; detached HEAD; not a repository; truncated `harness.config.json`; pre-1.5 `jq`; existing plus missing path) | — | D | `change` | Task 10: an owed-re-run note under the heading, which stays byte-identical. The cells are not edited, and Manual setup step 5 re-drives them |
| 54 | `examples/notes-app/README.md` → the paragraph *"The file now carries 220 `/workspace`-rooted occurrences across 179 lines …"* | — | E | `change` | Task 11: the figures only, recounted after the re-render |
| 55 | `cli/scripts/README.md` → the **The corpus resolves unchanged.** bullet, and the opening paragraph's "two of them as `bash <scripts_dir>/<name>.sh` invocations" | — | A | `no-change` | a dated design record of the `scriptsDir` port. Its claim is about **where** the scripts live, the adopter's `scriptsDir` rather than the installed package, and this branch does not move them: `<MAIN_REPO>/<scripts_dir>/commit-on-branch.sh` is still that location, now named in the main checkout. The opening paragraph describes the corpus as it stood at the port. Its reproduce grep still finds every site |
| 56 | `plugin/agents/layer-reviewer.md` → `## Process` step 2's "(staged entries, `git mv` renames, `??` untracked)" | — | F | `change` | Task 7: a rename now shows as a deletion beside an untracked path |
| 57 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → the `<app_root>` row of `## Resolved values`, and the paragraph **`<app_root>` is declared here, not consumed here.** (both: "a commit-wrapper call a fork adds names its script path repo-relative and runs from `<repo_root>`") | — | A | `change` | Task 8: both restated as the main checkout's copy with `--repo <repo_root>`, as the push does, in prose that keeps the core literal-free (`plugin/instructions/mode_contract.md` → `## (4) Cores are literal-free`) |
| 58 | `docs/flow-graph-walker.md` → **Which record wins.** ("that flip is re-applied, idempotently through the commit wrapper's exit 3") | — | A | `no-change` | still true: Task 1 keeps the exit contract byte-identical, so a re-applied ledger flip still returns exit 3. It states no spelling |
