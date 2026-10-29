# Story: Resolve the main checkout from a clone when `HARNESS_MAIN_REPO` is unset

## Context

Run copies are clones now (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_clone_create_var`, a `git clone --shared`). Every place the plugin resolves `<MAIN_REPO>` reads `printenv HARNESS_MAIN_REPO` first. When that prints nothing, it falls back to the first `worktree ` line of `git worktree list --porcelain`, which inside a clone names the clone itself. The watcher sets the variable for every session it launches, so unattended runs are fine. An operator who opens a session in a finished run's copy has no variable, though, and every operator command then reads or writes the copy's own state directory. This branch keeps `printenv HARNESS_MAIN_REPO` first and unchanged, and replaces the fallback with one rule that is right in all three layouts: the main checkout, a linked worktree, and a clone. The same rule lands in four places: the plugin prose, the hook library's `hc_main_root`, the change-request fence, and the task offer's answer 4.

**The rule.** Every task below implements or describes this rule, and each per-task file restates the part it needs. The fallback runs only when `printenv HARNESS_MAIN_REPO` prints nothing.

- **F1.** Take `<copy>` from a bare `git rev-parse --show-toplevel`. If there is none, stop.
- **F2.** If `<copy>/.git/objects/info/alternates` does not exist, this is not a clone. `<MAIN_REPO>` is today's answer, the first `worktree ` line of a bare `git worktree list --porcelain`: the checkout itself in a main checkout or an ordinary repository, and its main checkout in a linked worktree. In the shell library, today's `--git-common-dir` answer is kept here, and it gives the same result.
- **F3.** The alternates file must hold exactly one line: an absolute path ending in `/.git/objects`. `<candidate>` is that path with `/.git/objects` removed.
- **F4.** `<candidate>` is not `<copy>`, and `<candidate>/.git` is a directory with no `commondir`.
- **F5.** `<branch>` is the branch `<copy>` has checked out. A detached HEAD stops.
- **F6.** `<candidate>`'s run registry records the clone. The registry is `<candidate>/<stateDir>/autonomous_logs/registry.json`, with `stateDir` read from `<candidate>/harness.config.json` (default `sdlc-harness`). Its `.runs[<branch>]` must have `copy_kind` `clone` and `worktree` equal to `<copy>`.
- **F7.** `<copy>` equals `<parent of candidate>/<projectName>-<branch with every / turned into ->`, with `projectName` read from `<candidate>/harness.config.json` (default: `<candidate>`'s basename). This is `hr_worktree_dir`'s derivation.
- **F8.** If every check holds, `<MAIN_REPO>` is `<candidate>`. If any check fails, the reader stops with one sentence starting `cannot resolve the main checkout — `, which names what it could not establish. It never falls back to `<copy>`.

**How the rule maps onto the outer loop's clone check** (`hr_clone_target_check_var`, which this branch does not edit):

- **Repeated:**
  - F6 is its condition 1.
  - F7 is its condition 2.
  - F3 is its condition 4.
  - F4 is the main-checkout test goal 1 asks for, plus goal 2's rule that the reader never uses the copy itself.
- **Dropped:**
  - Condition 3 (no `commondir`, `config.worktree` or `http-alternates`; real `objects` directories) and condition 5 (the clone configuration allow-list). Both protect the git calls an unsandboxed wrapper makes *inside* the clone. This reader makes no such call: the prose runs only `git rev-parse` there, and the shell clone arm runs no git at all.
  - In the prose only, the canonical-path comparison. No literal, allow-listable command canonicalises a path, so a spelling mismatch makes the reader stop rather than give a wrong answer.

**Platform posture.** On macOS, `docs/sandbox-verification.md` row CL5 shows the sandbox refuses to open `objects/info/alternates`. On Linux that row is `blocked: F9`, so it is unmeasured. The rule therefore never trusts the alternates file alone. F6 needs a registry at the candidate that records this copy at this path, and the main checkout's registry is write-protected. F7 puts the candidate at the work root, so neither the copy nor a directory planted inside it can pass. Task 10 records the residual for Linux.

**One home for the prose clause.** The rule's prose lives once, in a new shared module, `plugin/instructions/main_repo_resolution.md` → `## The fallback` (Task 2). All 22 occurrences in the 21 plugin sites (`branch-start-user-review-fix-autonomous.md` carries two) replace the old fallback words with a pointer to that heading, through one byte-identical clause (Task 4). The clause keeps `printenv HARNESS_MAIN_REPO` inline, so an unattended run, which always has the variable, never reads the module. `dispatch_discipline_instructions.md` was not chosen as the home: its `## Activation` section closes the set of documents that may point at it, and commands and agents pointing there would break that rule. Every command a reader runs is bare and already allow-listed: `git rev-parse`, `git worktree list`, and the `Read` tool over `Read(/<repo root>/**)` and the sibling glob. So the unattended profile needs no new permission.

**Where the shell and the fence differ from the prose.**

- **`hc_main_root`** (Task 3) applies F1–F8 with canonical comparisons. It reads the branch from the clone's `HEAD` file, as condition 1 does, and runs no git in the clone. It gains `hc_main_root_var`, so the QA helpers can print the refusal sentence.
- **The change-request fence** (Task 1) applies F1–F8 as one shell command. It does not read the variable: fence clause 1 has already excluded every launcher-started session, and those are the only sessions that carry it. The command prints the main checkout and exits 0 only when it found one and found no marker there. Every other outcome means silence. Answer 4 writes the marker under the path that command printed.

**Known cost.** A main checkout that itself borrows objects through `alternates` (made with `--shared` or `--reference`) takes the clone arm and stops. Goal 2 asks for that outcome when an alternates file names something unexpected. Such a repository sets `HARNESS_MAIN_REPO`.

**A test the branch changes on purpose.** `cli/test/qa-user-locks.test.mjs` case (f) asserts that a reserve in an unregistered clone with no anchor falls back to the clone's own lock set. That is the defect goals 2 and 4 remove: *"It never proceeds against the copy's own state directory"*. The constraint *"Every existing test stays green unchanged"* sits under *"Today's answer is unchanged in the main checkout and in a linked worktree"*, and case (f) covers neither layout. Task 6 rewrites (f) to the new outcome and adds the registered-clone case beside it. Every other existing test stays unchanged.

**Ship order.** The plugin tasks come before the `cli` tests that grade them (Tasks 6–8): no task depends on a later task, and that outranks the configured `cli`, `plugin`, `general` order. Task 1 needs nothing from the plugin, so it leads. The catch-all tasks come last. Task 4 is one task because the clause is plugin wire text, and the task prompt requires that *"A literal changed in one file is changed in every file that quotes it, in the same commit"*. Work owed to `fix_docs_flow_main_repo_binding` (#149) is out of scope: the literal-spelling sentence and the bare-push wording. Task 8 builds the corpus check as a case table that #149 extends.

**Top risks:**

- **The 22 clause occurrences drift apart, or one is missed.** Task 4 changes all of them in one commit. Task 8's corpus check makes any later drift fail a test rather than a session, and also checks the module's citer roster against the sites.
- **The fence one-liner behaves differently from `hc_main_root`, or differently in zsh than in bash.** Task 7 runs the template's own command in every layout under both shells and compares the result with the answers Task 6 proves for `hc_main_root`.
- **The prose rule is never exercised in a real interactive session.** Tasks 6 and 7 test the shell halves. The prose half is recorded as rows AN5 and AN6, *not yet measured* (Task 10), and the hand run is listed below.

**Manual setup required:**

- **Re-render this repository's root `.claude/CLAUDE.md` fence section and `.claude/harness-task-offer.md` from the templates Task 1 changes.** The tool layer refuses an agent's write under the root `.claude/`. Use the route `docs/development.md` documents: build, then run `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze --dry-run --non-interactive`, then the same command without `--dry-run`. Keep the re-rendered `.claude/harness-task-offer.md`. Restore `.claude/CLAUDE.md` and the other files on that section's restore list, then copy only the re-rendered `## Where a change request runs` section into the restored `.claude/CLAUDE.md`. Remove the `.bak` files. Do this on the branch before merge. No task depends on it, but the scope register lists both files as owed. The user accepted this deferral when the run parked (`harness-runs/clarifications/fix_clone_main_repo_resolution/answer_1.md`, Q2 (a)) and will do the re-render before merge.
- **Take rows AN5 and AN6 of `docs/sandbox-verification.md` by hand, after Tasks 2 and 4 land.** Use an interactive Claude Code session opened in a registered run clone, then in an unregistered clone, both with `HARNESS_MAIN_REPO` unset, and record what each observed. Task 10 writes the rows as *not yet measured*, with the exact procedure.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` when that task's commit lands. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational progress markers only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_clone_main_repo_resolution/task_<K>_plan.md`.

1. [x] **Task 1** — Resolve the main checkout from a clone in the change-request fence and in the task offer's answer 4 _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Add `plugin/instructions/main_repo_resolution.md`, the single home of the `<MAIN_REPO>` fallback _(layer: plugin)_ _(points: 15)_
3. [x] **Task 3** — Give `hc_main_root` the clone arm and a refusal sentence, and print it from the QA-lock helpers _(layer: plugin)_ _(points: 20)_
4. [x] **Task 4** — Point all 22 `<MAIN_REPO>` resolution clauses at the module, in one pass _(layer: plugin)_ _(points: 15)_
5. [x] **Task 5** — Say what the fallback now does in the `profile-main-anchor` check and the profile's `_README` line _(layer: cli)_ _(points: 10)_
6. [x] **Task 6** — Prove `hc_main_root` in every run-copy layout, with and without the anchor, and move QA-lock case (f) to fail closed _(layer: cli)_ _(points: 20)_
7. [x] **Task 7** — Run the template fence's own command in every layout, under bash and zsh _(layer: cli)_ _(points: 15)_
8. [x] **Task 8** — Add the extensible corpus check that every `<MAIN_REPO>` site carries the one clause _(layer: cli)_ _(points: 15)_
9. [x] **Task 9** — State the new fallback in `docs/watcher.md` and `docs/cli.md` _(layer: general)_ _(points: 10)_
10. [ ] **Task 10** — Record the library change in `docs/guard-verification.md` and add the owed rows AN5–AN6 to `docs/sandbox-verification.md` _(layer: general)_ _(points: 10)_
11. [ ] **Task 11** — Register the corpus check as a tree guard in `harness.config.json` _(layer: general)_ _(points: 5)_
12. [ ] **Task 12** — Re-render the worked example's fence, task offer and profile `_README` line _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt:

- Goal 3: *"Change every site from goal 1's inventory in one pass, so that `git grep` for the new wording reaches exactly the sites the old wording did."*
- Goal 6: *"Update every other place that says so (`git grep -n "copy itself in a clone"`)."*
- Goal 5: *"Re-render this repository's `.claude/` copies and `examples/notes-app/.claude/` from the templates"*

**Derivation entry D1 — the resolution clause (command).** Re-run verbatim from the repository root:
``git grep -l -F 'first `worktree ` line' -- plugin docs cli/src cli/templates examples``

**Derivation entry D2 — the fence and the offer, with their rendered copies (command).**
``git grep -l -F 'git worktree list' -- cli/templates/claude .claude examples/notes-app/.claude``

**Derivation entry D3 — the other statements of the fallback (command).**
``git grep -n -E 'copy itself in a clone|git worktree list.? entry|git-common-dir' -- plugin docs cli/src examples/notes-app/.claude``

**Derivation entry D4 — the documents of record about `hc_main_root` (command).**
``git grep -n -F 'hc_main_root' -- docs plugin/hooks/README.md plugin/scripts/README.md``

**Derivation entry D5 — standing ledger rows (procedure).** **Artifact:** `harness-runs/lessons.md` and `harness-runs/improvement_suggestions.md`. **Traversal:** each file's headings in file order, then each one-line entry under them. **Decision rule:** an entry is reached when it names `<MAIN_REPO>`, the main checkout's resolution, `git worktree list` or `alternates`. Walked when this plan was written, it reached no entry, so it contributes no row.

**Closure invariant:** every site each derivation entry reaches appears as a row below. The register is derived from the tree as it stood before this branch; D1's phrase is a derivation needle, not the retired text. What this branch retires is the **full old clause**, ``the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain` ``: once Tasks 4 and 9 land, no file under `plugin/` and not `docs/watcher.md` carries it, checked by ``git grep -l -F 'the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`' -- docs plugin`` printing nothing. The phrase `` first `worktree ` line `` alone may remain in `plugin/instructions/main_repo_resolution.md` (Task 2, which names today's F2 answer) and in Task 9's added sentence; a post-branch re-run of D1 reaching those two files is expected and is not a missed site.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/committer.md` → `## Resolved values`, `<MAIN_REPO>` row | — | D1 | `change` | Task 4 |
| 2 | `plugin/agents/qa-tester.md` → **Mocking requests when a test needs it:** | — | D1 | `change` | Task 4 |
| 3 | `plugin/commands/branch-answer.md` → step 1 | — | D1 | `change` | Task 4 |
| 4 | `plugin/commands/branch-pause.md` → step 1 | — | D1 | `change` | Task 4 |
| 5 | `plugin/commands/branch-prompt.md` → step 1 | — | D1 | `change` | Task 4 |
| 6 | `plugin/commands/branch-resume.md` → step 1 | — | D1 | `change` | Task 4 |
| 7 | `plugin/commands/branch-start-docs-autonomous.md` → **Global kill switch — check at session start.** | — | D1 | `change` | Task 4 |
| 8 | `plugin/commands/branch-start-plan-autonomous.md` → **Global kill switch — check at session start.** | — | D1 | `change` | Task 4 |
| 9 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → `<MAIN_REPO>` row and **Global kill switch** (two occurrences) | — | D1 | `change` | Task 4 |
| 10 | `plugin/commands/branch-status.md` → step 1 | — | D1 | `change` | Task 4 |
| 11 | `plugin/commands/branch-user-review.md` → step 1 | — | D1 | `change` | Task 4 |
| 12 | `plugin/docs/AUTONOMOUS_FLOW.md` → `<MAIN_REPO>` row | — | D1 | `change` | Task 4 |
| 13 | `plugin/instructions/autonomous_pause_and_ledger.md` → `<MAIN_REPO>` row | — | D1 | `change` | Task 4 |
| 14 | `plugin/instructions/clarification_digest_instructions.md` → `<MAIN_REPO>` row | — | D1 | `change` | Task 4 |
| 15 | `plugin/instructions/dispatch_discipline_instructions.md` → `<MAIN_REPO>` row | — | D1 | `change` | Task 4 |
| 16 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → **Paths (Override-A equivalent).** | — | D1 | `change` | Task 4 |
| 17 | `plugin/instructions/improvement_observations_instructions.md` → `<MAIN_REPO>` row | — | D1 | `change` | Task 4 |
| 18 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Override B — global kill switch`, **Path:** | — | D1 | `change` | Task 4 |
| 19 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `<MAIN_REPO>` row | — | D1 | `change` | Task 4 |
| 20 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → **STOP checks.** | — | D1 | `change` | Task 4 |
| 21 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → **Path:** | — | D1 | `change` | Task 4 |
| 22 | `docs/watcher.md` → `### The main-checkout anchor`, **Read.** | — | D1, D4 | `change` | Task 9 |
| 23 | `cli/templates/claude/CLAUDE.md` → `## Where a change request runs`, item 4 | template | D2 | `change` | Task 1 |
| 24 | `cli/templates/claude/harness-task-offer.md` → *"at the main worktree's root"* and `## Answer 4 — write the marker, then do the work` | template | D2 | `change` | Task 1 |
| 25 | `.claude/CLAUDE.md` → `## Where a change request runs`, item 4 | this repository's render | D2 | `no-change` | Re-rendered by the maintainer through the forced self-adopt route under `## Manual setup required`. The tool layer refuses an agent's write under the root `.claude/`. |
| 26 | `.claude/harness-task-offer.md` → *"at the main worktree's root"* and answer 4 | this repository's render | D2 | `no-change` | Same as row 25 |
| 27 | `examples/notes-app/.claude/CLAUDE.md` → `## Where a change request runs`, item 4 | worked example's render | D2 | `change` | Task 12 |
| 28 | `examples/notes-app/.claude/harness-task-offer.md` → *"at the main worktree's root"* and answer 4 | worked example's render | D2 | `change` | Task 12 |
| 29 | `examples/notes-app/.claude/settings.autonomous.json` → `_README`, `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE` | worked example's render | D2, D3 | `change` | Task 12 |
| 30 | `cli/src/doctor/checks.ts` → `PROFILE_MAIN_ANCHOR_CHECK` doc comment | — | D3 | `change` | Task 5 |
| 31 | `cli/src/doctor/checks.ts` → `PROFILE_MAIN_ANCHOR_CHECK` `warn(…)` message | — | D3 | `change` | Task 5 |
| 32 | `cli/src/generators/permissionProfile.ts` → the `appendReadme` line `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE` | template source | D3 | `change` | Task 5 |
| 33 | `docs/cli.md` → the bullet **The main-checkout anchor's read is one exact rule.** | — | D3 | `change` | Task 9 |
| 34 | `docs/cli.md` → the bullet **`profile-main-anchor` is a warning, and never a failure.** | — | D3 | `change` | Task 9 |
| 35 | `plugin/hooks/lib/harness-config-lib.sh` → `hc_main_root` header and body | — | D3 | `change` | Task 3 |
| 36 | `plugin/scripts/reserve-qa-user.sh` → header **WHY THE LOCKS LIVE IN THE MAIN CHECKOUT'S STATE DIRECTORY.** | — | D3 | `change` | Task 3 |
| 37 | `plugin/scripts/release-qa-user.sh` → header **THE LOCK SET IS THE ONE `reserve-qa-user.sh` DOCUMENTS** | — | D3 | `change` | Task 3 |
| 38 | `docs/guard-verification.md` → the dated entry **2026-10-20: `hc_main_root` changed, and no guard calls it.** | — | D4 | `no-change` | A dated record of the 2026-10-20 change. Task 10 appends a new dated entry beside it rather than editing it. |
| 39 | `docs/sandbox-verification.md` → `### The main-checkout anchor (2026-10-20)` lead paragraph | — | D4 | `no-change` | A dated record of what that run measured. Task 10 adds rows AN5–AN6 and a dated note to the section without editing the existing paragraph or rows AN1–AN4. |
