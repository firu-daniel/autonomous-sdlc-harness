# Story: Teach the library and the excluded wrappers to recognise, trust, sync with, create and remove a per-run clone

## Context

Today every autonomous run executes in a linked worktree that shares the main checkout's `.git`. Two sandbox problems come from that layout. Sandboxed git cannot write the worktree's record, `<main>/.git/worktrees/<name>/` (`docs/sandbox-verification.md` rows G1, G2, failure F1), so a run's ordinary git depends on excluded wrappers writing outside its own copy. And the sandbox can write `<main>/.git/objects`, where git does not re-hash a loose object it already has (`docs/cli.md` §6, residual 6), so a run can substitute an object that the main checkout and every later run then trust. A `git clone --shared` of the main checkout removes both, provided objects reach the main checkout only through a fetch, which hashes what it receives as it indexes it.

**This branch lays the ground and switches nothing.** It teaches `cli/templates/scripts/lib/harness-run-lib.sh` and the three excluded wrappers (`commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`) to **recognise, trust, sync with, create and remove** such a clone, and proves each of those paths on a throwaway fixture. **Every real run still gets a linked worktree when it merges.** `create-worktree.sh`, the watcher's launch and `remote-run.sh` are not touched, so nothing outside the tests creates a clone, and no flow, profile entry beyond the registry's, or plugin reader changes behaviour. The plugin layer is not touched at all. The main-checkout anchor (`HARNESS_MAIN_REPO`, the plugin's `<MAIN_REPO>` readers), the layout switch and cleanup from the registry are later branches; no document this branch writes schedules them (`harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer"*).

**Every dependency on the shared `.git` gains a clone arm beside its worktree arm, and the worktree arm stays byte-for-byte.** That is the branch's governing constraint. Each arm is selected by the shape of the copy, never by a flag a caller passes, and every existing suite that exercises the worktree and main-checkout arms keeps passing **unedited**: `wrapper-target-check`, `commit-on-branch-target-check`, `commit-on-branch-plumbing`, `push-branch-*`, `refresh-branch-worktree-config`, `cleanup-worktree-record`, `create-worktree`, `outer-loop-scripts` and the `watcher-*` payload suites. Where a refusal sentence an existing test matches must stay matchable, the clone arm appends a clause rather than rewording it.

**The model every unsandboxed operation on a clone follows** (task prompt goal 3):

- **sync in** — the main checkout fetches the clone's `refs/heads/<branch>` and moves its own `refs/heads/<branch>` to it, fast-forward only, as a compare-and-swap;
- **operate** — the existing operation runs in the main checkout, under the main checkout's configuration, unchanged, borrowing only the clone's index and working tree exactly as it borrows a worktree record's today (`GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<clone>/.git/index`, `GIT_WORK_TREE=<clone>`);
- **sync out** — after a ref moves in the main checkout, the clone's own ref is set to match.

For a worktree or the main checkout, sync-in and sync-out are no-ops. Objects therefore enter the main checkout only through that fetch, or through `hash-object -w` of working-tree content, which hashes what it stores. They never enter it by being read out of the clone's object store.

**The cross-task interfaces, stated once here and restated in full by each producer and consumer file.** All live in `cli/templates/scripts/lib/harness-run-lib.sh`. Every `_var` function sets globals and is called directly, never inside `$(…)`.

| Interface | Producer | Consumers |
|---|---|---|
| `hr_registry_peek <file> <branch> <key>` — print a record's value; never creates, never locks | Task 1 | Tasks 1, 3 |
| `hr_clone_config_spec <main> <top>` / `hr_clone_config_check_var <main> <top>` — the clone `.git/config` allow-list: **one contract between the check and the creating code** | Task 1 | Tasks 3, 4, 11 |
| `hr_wrapper_target_check_var`'s clone arm, plus the new globals `HR_TARGET_KIND` (`main` / `worktree` / `clone`) and `HR_TARGET_BRANCH` (clone arm only) | Task 1 | Tasks 4, 7, 9, 11 |
| `hr_wrapper_branch_var`'s clone arm (takes `HR_TARGET_BRANCH`; never re-reads `HEAD`) and `hr_copy_kind <main> <gitdir>` | Task 1 | Tasks 2, 7, 9 |
| `hr_copy_sync_in_var <main> <gitdir> <branch>` / `hr_copy_sync_out_var <main> <gitdir> <ref> [<expected_old>]` | Task 2 | Tasks 5, 7, 9 |
| `hr_commit_paths_var`'s clone sync-out and the new global `HR_COMMIT_SYNC_FAILED`; `HR_RUN_COPY_KIND` | Task 7 | Tasks 8, 9, 10 |
| `hr_clone_create_var <main> <branch> <start>` / `hr_clone_remove_var <main> <dir>` / `hr_registry_drop <file> <branch>` | Task 3 | Tasks 4–6, 8, 10, 11 |

A clone is recorded in the run registry, `<main>/<stateDir>/autonomous_logs/registry.json`, under its branch with two keys written in one `hr_registry_set` call: `worktree` (the canonical clone path) and `copy_kind` (`clone`). Because the trust check now reads that file, Task 12 write-protects it on both sides by its exact path. No sandboxed process writes it today: its only writers are `autonomous-watcher.sh` and `remote-run.sh`, both unsandboxed, and the profile's one write grant is the main checkout's state directory, whose registry file the new `denyWrite` entry closes.

**One boundary is stated rather than closed here.** Inside a clone, `hr_main_repo` and `hr_wrapper_main_of` answer the clone itself, because its `.git` is a real directory holding no `commondir`. No caller this branch reaches passes a clone where it means the main checkout: the wrappers place the main checkout from their own location, and the profile excludes only the main checkout's copies. A clone's own copy of a wrapper runs sandboxed, exactly as a worktree's copy does. The anchor itself is the next branch's.

**The work is seventeen single-layer tasks in bottom-up ship order: `cli` first, `general` last.**

- **Tasks 1–3 (`cli`)** add the library's clone primitives: the trust check and its config contract, the sync pair, then creation and removal.
- **Tasks 4–6 (`cli`)** are their three suites.
- **Tasks 7–8 (`cli`)** give the watcher family's git its clone arm, including the artifact commit's sync-out that the commit wrapper shares, then prove it.
- **Tasks 9–10 (`cli`)** give the three excluded wrappers their clone arm, then prove it.
- **Task 11 (`cli`)** gives `setup-worktree.sh --target` its clone arm, with its suite.
- **Tasks 12–13 (`cli`)** write-protect the registry and restate the profile template's one sentence about the wrappers' targets.
- **Tasks 14–17 (`general`)** write the measurement rows and the owed rows into `docs/sandbox-verification.md`, describe both arms in `docs/cli.md` and `docs/watcher.md`, and re-render the worked example's profile.

`phases.parity` is `false`, so nothing here is held to a reference implementation. Every suite this branch adds builds its fixture under the system temp directory, places each clone at `hr_worktree_dir <main> <branch>` inside that temp tree, and is torn down in process; **no test is ever aimed at this repository's own main checkout or registry** (`.claude/context/conventions.md` → `## The testing bar`). Scripts stay bash 3.2 compatible, and every git flag the new code relies on is checked against the wrappers' 2.23 floor and `refresh-branch.sh`'s 2.38 floor. No task widens `allowWrite`, uses `git clone --local` hardlinks, or makes a wall-clock figure its acceptance evidence (`harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session"*). "Disk and time comparable to a worktree" is proved structurally instead: a created clone's object directory holds no object of its own.

**Top risks:**

- **The clone arm widens what unsandboxed code will run git in.** A clone's `.git/config`, `objects/info/alternates` and any file planted beside them sit inside the run's own copy, and the measurement Task 14 records shows the runtime leaves `objects/info/`, `info/` and new top-level `.git` files sandbox-writable. Task 1's trust check is the single gate, and Task 4 proves every refusal: a registry with no record, a path off the derived one, a planted `commondir`, `config.worktree` or `objects/info/http-alternates`, a foreign or symlinked `alternates`, every off-list config key. Each refusal names the key, never its value. A scratch repository is still refused with the sentence C1 and `wrapper-target-check` already match.
- **Object substitution through the clone's own store.** Objects reach the main checkout only by Task 2's fetch, which `index-pack` hashes. Every later git call reads objects from `<main>/.git/objects` alone: `GIT_DIR=<main>/.git` for the operate step, and `GIT_OBJECT_DIRECTORY=<main>/.git/objects` for sync-out. Task 5 plants a mismatched loose object in a clone and proves the sync-in refuses with the main checkout's refs unchanged.
- **A worktree-arm regression in code every real run uses.** Tasks 7 and 9 change the watcher family's shared functions and the wrappers. Their verification is that every existing suite listed above passes with its file unedited (`git diff --stat` over `cli/test/` names only this branch's new suites and the two Task 12 edits). Every clone-arm branch sits behind a shape test that a worktree and the main checkout never satisfy.

**Manual setup required:**

1. **Bring this checkout's unattended profile up to Task 12's protected set** (depends on Task 12). Either regenerate it with the forced self-adopt `init` that `docs/sandbox-verification.md` → `## 0. Method` describes, restoring the hand-kept files it rewrites, or add by hand the `denyWrite` entry and the `Edit` / `Write` deny rules `doctor`'s `profile-write-protection` names for `<main>/harness-runs/autonomous_logs/registry.json`. Confirm `profile-write-protection` passes with and without `--remote-job`. The root `scripts/` copies stay as they are: this branch changes no behaviour a real run reaches.
2. **Take the owed registry rows RG1 and RG2** (depends on step 1 and Task 14). Use §0's launch line, one exact call per probe, with the controls named in each row and `claude --version` recorded in the Observed cell. A run cannot take them, because it cannot launch a sandboxed session under the profile it measures.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational only: they are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_clone_per_run/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Add the clone trust check to the run library: the `.git/config` allow-list contract, a non-creating registry read, and the clone arm of `hr_wrapper_target_check_var` and `hr_wrapper_branch_var` _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Add the sync pair `hr_copy_sync_in_var` / `hr_copy_sync_out_var`: objects reach the main checkout only by a pinned fetch _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Add `hr_clone_create_var`, `hr_clone_remove_var` and `hr_registry_drop`: a `--shared` clone recorded before any check reads it, a guarded removal, and a full rollback _(layer: cli)_ _(points: 20)_
4. [x] **Task 4** — Add `cli/test/clone-trust-check.test.mjs`: every acceptance condition and every refusal of the clone arm _(layer: cli)_ _(points: 20)_
5. [x] **Task 5** — Add `cli/test/clone-sync.test.mjs`: the sync model, the substituted-object refusal, and the fetch's measured pins _(layer: cli)_ _(points: 15)_
6. [x] **Task 6** — Add `cli/test/clone-create-remove.test.mjs`: creation's invariants, the second-copy refusal, rollback, and the removal guard _(layer: cli)_ _(points: 15)_
7. [x] **Task 7** — Give the watcher family's git its clone arm: the copy check syncs in, the commit and the fast-forward sync out _(layer: cli)_ _(points: 20)_
8. [x] **Task 8** — Add `cli/test/run-copy-clone-arm.test.mjs`: the copy check, the artifact commit, the fast-forward, the reset and the surface check on a clone _(layer: cli)_ _(points: 15)_
9. [x] **Task 9** — Give `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` their clone arm through sync-in, operate, sync-out _(layer: cli)_ _(points: 20)_
10. [x] **Task 10** — Add `cli/test/wrapper-clone-arm.test.mjs`: the three wrappers against a clone, with exit contracts and stdout lines unchanged _(layer: cli)_ _(points: 20)_
11. [x] **Task 11** — Give `setup-worktree.sh --target` its clone arm, and add `cli/test/setup-worktree-clone-target.test.mjs` _(layer: cli)_ _(points: 15)_
12. [x] **Task 12** — Write-protect the run registry by exact path on both sides, keep it out of the job surfaces, and prove `doctor` grades the entry _(layer: cli)_ _(points: 15)_
13. [ ] **Task 13** — Restate the profile template's sentence about which targets the excluded wrappers accept _(layer: cli)_ _(points: 5)_
14. [ ] **Task 14** — Record the 2026-10-19 clone measurement as rows CL1–CL5, and add the owed registry rows RG1 and RG2, in `docs/sandbox-verification.md` _(layer: general)_ _(points: 15)_
15. [ ] **Task 15** — Describe the wrappers' clone arm, the registry protection and the object-store residual in `docs/cli.md` §6 _(layer: general)_ _(points: 15)_
16. [ ] **Task 16** — Describe the watcher family's git on both arms in `docs/watcher.md` §2 _(layer: general)_ _(points: 10)_
17. [ ] **Task 17** — Re-render the worked example's profile for the registry entry and the restated target sentence _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt (goal 9): *"`docs/watcher.md` §2: the family's git on both arms. `docs/cli.md`'s description of the wrappers' target check. The owed rows above in `docs/sandbox-verification.md`. The clone arm is described as present and tested, and created by nothing yet."* — together with goal 1's *"Write it into `docs/sandbox-verification.md` as rows"* and goal 8's *"add an owed `docs/sandbox-verification.md` row"*.

The register covers the plan's **corpus** targets only. The shell templates under `cli/templates/scripts/`, `cli/src/**/*.ts` and `cli/test/*.test.mjs` are code and code comments, so their per-task files own them.

**Derivation entry A — corpus files that describe the wrappers' target check (command).** Re-run verbatim from the checkout root:

`grep -rliE --include='*.md' --include='*.json' --include='*.txt' 'worktree (it|the main repository|that main repository) lists|neither the main checkout|target check|hr_wrapper_target_check_var' plugin docs README.md ARCHITECTURE.md ROADMAP.md llms.txt CONTRIBUTING.md cli/README.md cli/scripts cli/templates/README.md cli/templates/claude cli/templates/scripts/README.md cli/templates/state-dir examples/notes-app/.claude examples/notes-app/README.md`

**Derivation entry B — corpus files that name the run registry, a clone or write protection (command).** Re-run verbatim from the checkout root:

`grep -rliE --include='*.md' --include='*.json' --include='*.txt' 'registry\.json|run registry|git clone|per-run clone|write-protect' plugin docs README.md ARCHITECTURE.md ROADMAP.md llms.txt CONTRIBUTING.md cli/README.md cli/scripts cli/templates/README.md cli/templates/claude cli/templates/scripts/README.md cli/templates/state-dir examples/notes-app/.claude examples/notes-app/README.md`

**Derivation entry C — corpus files that name the watcher family's git functions (command).** Re-run verbatim from the checkout root:

`grep -rliE --include='*.md' --include='*.json' --include='*.txt' 'hr_run_copy_git|hr_run_copy_check_var|hr_run_main_set_var|hr_run_fast_forward_var|hr_run_reset_var|hr_run_surface_check_var|setup-worktree\.sh --target' plugin docs README.md ARCHITECTURE.md ROADMAP.md llms.txt CONTRIBUTING.md cli/README.md cli/scripts cli/templates/README.md cli/templates/claude cli/templates/scripts/README.md cli/templates/state-dir examples/notes-app/.claude examples/notes-app/README.md`

**Derivation entry D — documents stating figures about the worked example's rendered profile (command).** Task 17 changes that file's line and occurrence counts. Re-run verbatim from the checkout root:

`grep -rln -E '[0-9]+ .?/workspace' examples/notes-app/README.md docs README.md`

**Derivation entry E — rows of the standing sandbox matrix (procedure).**

- **First step, runnable:** `grep -n -E '^\| [A-Z]+[0-9]+[a-z]? \|.*(clone|registry|scratch repository|neither the main checkout)' docs/sandbox-verification.md`.
- **Artifact:** `docs/sandbox-verification.md`, the standing record of measured sandbox rows.
- **Traversal:** every table row in file order: §1 D, §2 G, §3 P/R/H/C/K/L and CW, §4 N/S/W/WR/Q, §5 F/T.
- **Decision rule:** a row is reached when its own line names a clone, the registry, a scratch repository, or the target check's "neither the main checkout" refusal. This is exactly the first step's match set.

**Closure invariant:** every site any of the five derivation entries reaches appears as a row below. The rows entry E reaches are identified by their row id.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/cli.md` → §6 the paragraph **The excluded rule's `:*` accepts any argument, so all three wrappers check their target before any git call**, **Everything that runs outside the sandbox is write-protected on both sides**, residual 1's item 3 (*"The copy check reads the worktree record once"*) and item 6 (the shared object store) | — | A, B | `change` | Task 15 |
| 2 | `docs/cli.md` → §7's `profile-write-protection` row and bullet, and **`--remote-job`** | — | B | `no-change` | they grade "every path that runs outside the sandbox" against `protectedPaths` generically. The registry entry is graded without a word changing |
| 3 | `docs/cli.md` → residual 5's `save finds neither autonomous_logs/registry.json …` sub-bullet | — | B | `no-change` | about the remote bundle's save, which this branch does not touch |
| 4 | `docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins`: the table and **The pins.** paragraph | — | A, C | `change` | Task 16 |
| 5 | `docs/watcher.md` → §1 step 7 and §7 **Not the run registry.** | — | B | `no-change` | they name the registry as the run-state record. Its shape and its writers are unchanged, and the new `copy_kind` key is written only by clone creation, which nothing calls yet |
| 6 | `docs/sandbox-verification.md` → **Who reads this:**, §2 (new subsection and rows CL1–CL5 beside G4–G7), §4 (new rows RG1 and RG2) | — | B | `change` | Task 14 |
| 7 | `docs/sandbox-verification.md` row G6 | — | B, E | `no-change` | a measured-cell row, still owed as written: it asks about a `--no-hardlinks` clone and a relocated record. Task 14's CL prose cites it rather than editing it |
| 8 | `docs/sandbox-verification.md` row C1 | — | E | `no-change` | dated measurement. A scratch repository is still refused, and Task 1 keeps the quoted refusal sentence as its prefix |
| 9 | `docs/sandbox-verification.md` row CW3 | — | E | `no-change` | owed row, whose Expected cell (refused, naming the target as neither the main checkout nor a worktree it lists) Task 1 keeps true |
| 10 | `docs/sandbox-verification.md` row CW6 | — | E | `no-change` | matched only because it builds a scratch repository's `.git` for `GIT_DIR`. No target check is involved |
| 11 | `docs/sandbox-verification.md` row N1 | — | E | `no-change` | matched on the npm *registry* host. Unrelated |
| 12 | `docs/sandbox-verification.md` rows D1, D2 and D3 | — | B | `no-change` | dated `doctor` measurements on the 2026-10-14 profile. Manual setup step 1 confirms `profile-write-protection` on the new set |
| 13 | `cli/templates/claude/settings.autonomous.json` → `_README` line `THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`, its last sentence *"…all three wrappers refuse any target but the main checkout or a worktree it lists."* | template | A | `change` | Task 13 |
| 14 | `examples/notes-app/.claude/settings.autonomous.json` → the same `_README` sentence; the `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT` line; `sandbox.filesystem.denyWrite`; the `Edit`/`Write` deny rules | notes-app render | A, B | `change` | Task 17, mirroring Tasks 12 and 13 |
| 15 | `examples/notes-app/README.md` → the paragraph stating the profile's `/workspace`-rooted occurrence and line counts | — | D | `change` | Task 17: the figures only, recounted after the re-render |
| 16 | `cli/templates/state-dir/autonomous_logs/README.md` → the paragraphs naming `registry.json` and its readers | — | B | `no-change` | the readers it lists still read it as before. The wrappers read it only for a target whose `.git` is a directory, and nothing creates a clone yet. Its "state, not a log" warning already covers hand-editing |
| 17 | `cli/templates/state-dir/README-root.md` → the machine-local list naming the run registry | — | B | `no-change` | the registry is still machine-local and gitignored |
| 18 | `plugin/commands/branch-status.md`, `branch-pause.md`, `branch-resume.md`, `branch-answer.md`, `branch-prompt.md`, `branch-user-review.md` → each registry read | — | B | `no-change` | plugin readers of `status` and `worktree`, both unchanged. The task prompt keeps every plugin reader out of this branch |
| 19 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the control-plane row naming the run registry | — | B | `no-change` | names the registry's role, which is unchanged |
| 20 | `plugin/agents/task-plan-reviewer.md` → the "target check in `### Architecture`" sentence | — | A | `no-change` | a planning-review term unrelated to the wrappers |
| 21 | `docs/outer-loop-verification.md` → the stale-count paragraph naming `commit-on-branch.sh` and `setup-worktree.sh` | — | A | `no-change` | its own text says any later touch to a template re-stales the count and to re-run its recipe rather than edit the number. Its §1 rows drive the main-checkout and worktree arms, which stay byte-for-byte |
| 22 | `README.md` → the flow diagram's `registry.json` edge and the teammate-clone step **F** | — | B | `no-change` | the registry's role, and a human's `git clone` of the repository. Both are unrelated to a run's copy |
| 23 | `ARCHITECTURE.md` → the run-registry references in the engine inventory (exit classification, liveness) | — | B | `no-change` | about classifying a run's exit and identifying a live run. Neither changes |
| 24 | `docs/retrieval.md` → the `git clone --branch …` install line | — | B | `no-change` | an adopter's install of a released tree. Unrelated |
