# Story: Fix what Gate 12 round 4 found around the pinned plugin install and `init --upgrade-workflows`

## Context

Gate 12 round 4 (`docs/development.md` → `## 5.` → Gate 12 → **Round 4**) showed the pinned plugin install working. It also found five defects around it, which this branch fixes, and one local observation, which it answers. The branch is cut into six single-layer tasks: four in `cli`, then two in `general`, the catch-all, which documents what the `cli` tasks built. No `plugin/` asset names the upgrade route, a `.bak` or the install step, so no task touches that layer.

**The in-flight sentence has one producer.** The upgrade's printed report and `doctor`'s version warning both carry one sentence: an upgrade reaches only runs dropped after it is pushed, a run in flight finishes on the version it started with, and `docs/remote-execution.md` → `### Upgrading` gives the deliberate route. Task 1 declares that sentence once, as the exported constant `IN_FLIGHT_RUNS_NOTE` in `cli/src/generators/githubWorkflows.ts`, beside `upgradeWorkflowsCommand`. Both `init` and `doctor` already import from that module. Task 3 prints the constant, and Task 5 writes the section it points at. The sentence cites the section the way the workflow template's refusal already does: `docs/remote-execution.md, section 7, Upgrading`.

**The double full stop is fixed at doctor's join, not in `core/defaultBranchPush.ts`.** `defaultBranchPushReason` is a complete sentence, and it ends in `.` by contract ("as one sentence"). Four call sites use it. Only `REMOTE_EXECUTION_CHECK`'s version warning appends `. To stay on` after it, and that appended period is the join Task 1 fixes. The shared reason keeps its period.

**Which `.bak` files the managed `.gitignore` block ignores, as decided here.** The task prompt asked for the upgrade's two workflow `.bak` files to be ignored, and for the other `.bak` files `init --force` writes to be checked for the same exposure. They have it: every one is untracked and not ignored, so `git add -A` stages it. `cli/src/generators/repoRoot.ts` → choice 4 records why the block ignores none of them today. They are the adopter's previous copies from a deliberate regeneration, their value is that they stay visible, and the block is append-only, so a too-wide rule can never be withdrawn. This plan keeps that argument and draws the line where it stops holding.

- **Ignored:** `.github/workflows/harness-run.yml.bak` and `.github/workflows/harness-resume.yml.bak`. The upgrade is the routine route on every release, and its report already names each `.bak` in a printed `git diff --no-index` command, so visibility in `git status` buys nothing.
- **Ignored:** `.claude/settings.autonomous.json.bak`. It carries this machine's absolute paths, which is the reason its original is ignored.
- **Not ignored, still visible under choice 4:** every other `--force` `.bak`, such as `.claude/CLAUDE.md.bak`, the conventions documents' and the scripts'.

The rules are exact paths, not the candidate glob `.github/workflows/*.yml.bak`. The block covers only files a harness command creates, and a glob would claim the adopter's own workflow backups. A path with a separator in the middle is already relative to the `.gitignore` it sits in, so no leading slash is needed, the same as the existing `.claude/settings.autonomous.json` rule. Task 2 writes this decision into choice 4 itself.

**The upgrade prints its own route, not the first-setup block.** Today `init` prints `reportWorkflowUpgrade` and then also `reportGithubSteps`, the five first-setup steps, because a replaced workflow counts as "fresh". Task 3 prints one block when the upgrade replaced the run workflow:

- the diff commands;
- `git status --short`;
- a `git add` naming every workflow the run created or replaced, and every in-repository shared file the run merged into (`.gitignore` above all);
- `git commit -m "Upgrade the harness workflows to <version>"`, the message `docs/remote-execution.md` → `### Upgrading` already uses;
- `gh auth refresh -s workflow`;
- `git push --no-verify origin <defaultBranch>`;
- the in-flight sentence.

The `.gitignore` entry matters. Task 2's new lines change `.gitignore` on the first upgrade after this release. Left uncommitted, the job's own `init` makes the same change, and its `Generate the job's permission profile` step fails on a changed tracked file (`cli/templates/github/workflows/harness-run.yml`, the `git status --porcelain --untracked-files=no` test).

**The detached-HEAD advice.** `git clone --quiet` silences progress output. The detached-HEAD advice that follows a checkout of a tag is gated on the `advice.detachedHead` configuration, not on the verbosity flag. Task 4 turns that key off for the one clone, and its new test case confirms the cause against the unfixed line before the fix lands.

**Out of scope, by the task prompt.** Workflows rendered before the pinned install (0.4.2 and earlier) are not a concern. That includes finding 2 of the round's own list: `doctor`'s `nothing is broken` stays as it is. Re-running Gate 12 is also out of scope.

**Finding 6: the local marketplace reconcile error, answered here with no task.** This session could run `jq` but not `claude`, so the evidence below comes from the runtime's own records and from this dispatch, not from a `claude` command.

- *The failed reconcile left the user-scope entry as it was.* `<claude home>/plugins/known_marketplaces.json` still gives `autonomous-sdlc-harness` a `"source": "directory"` pointing at the main checkout. Its `installLocation` is that checkout and its `lastUpdated` is `2026-09-25T05:20:45.331Z`, which is before this session. The reconcile did not replace the directory entry with the committed `.claude/settings.json`'s `github` source. Reconcile does run on this machine: a second read of the same file during planning showed `claude-plugins-official`'s `lastUpdated` moved to `2026-09-30T06:16:47.847Z`, while this marketplace's entry was byte-identical.
- *The failure does not change which copy a session reads.* This planning agent's own body was dispatched with every `${CLAUDE_PLUGIN_ROOT}` citation already resolved to `<main checkout>/plugin/…`, the live source tree of the directory-sourced marketplace. The runtime substituted that root, not a github clone and not the cache. This matches `docs/development.md` → `## 1.`, which says the token resolves to the live source tree under a directory source.
- *The cache install root is stale, but that is § 1's documented behaviour.* `<claude home>/plugins/installed_plugins.json` records a project-scope install for this worktree: `installedAt 2026-09-30T06:07:42.267Z`, `version 0.3.0`, `gitCommitSha 908d822` (`chore: bump version to 0.3.0`). Meanwhile `plugin/.claude-plugin/plugin.json` in the source tree says `0.4.2`. § 1 already says the snapshot refreshes only on `uninstall` + `install`, and that `marketplace update` on a directory source changes nothing. On this evidence the staleness cannot be attributed to the reconcile error.
- *Unmeasured: whether `claude plugin update` behaves differently because of the error.* Measuring it means running `claude plugin update` or `uninstall` / `install` in this repository. § 1 records that `uninstall` rewrites the committed `examples/notes-app/.claude/settings.json`, so an unattended run does not do it. What would settle it: run `claude plugin update autonomous-sdlc-harness@autonomous-sdlc-harness` by hand in this repository, then read that record's `version` and `gitCommitSha` again.
- *Conclusion:* no effect on what a session loads was found, so `docs/development.md` → `## 1.` owes no new instruction. The error is noise on this machine's pairing of a user-scope directory source with a project-scope github declaration, and `init` keeps writing what it writes for adopters.

**Top risks:**

1. The upgrade tells the adopter to commit only the workflows, while Task 2's new ignore lines have changed `.gitignore`, and the next job then fails its setup step on a changed tracked file. Task 3's `git add` names `.gitignore` whenever the run merged into it, and its test proves this on a fixture whose block lacks the new lines. Every other durable route that told the adopter to commit "the two workflows" now defers to that printed `git add` instead of listing paths: `doctor`'s version warning (Task 1, with a `doctor.test.mjs` assertion), the `Install the pinned plugin` step's `upgrade_route` refusal (Task 4, asserted in `workflow-plugin-pin.test.mjs` cases (b) and (c)), and Gate 12 observation (xii) in `docs/development.md` (Task 6), which the next Gate 12 round follows from a repository whose block lacks the new lines.
2. The ignore rule claims more than the harness wrote. Task 2 spells exact paths from the owning constants, and its test proves an adopter's own `.github/workflows/ci.yml.bak` stays visible.
3. The documented route to move a run in flight is followed while that run's job is still pushing to the branch, or without knowing the plugin version changes under the run. Task 5 limits the route to a run that is not executing, gives the reason from the job's own push step, and states the version switch as a warning. The same route fails the run's next job if it carries only the two workflows onto the branch: the branch was cut before the upgrade, so its `.gitignore` lacks Task 2's lines, and the job's own `init` then merges them in and its setup step refuses the changed tracked file. Task 5's checkout names `.gitignore` and the rest of the upgrade commit's path set, and says why.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, or the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here and never edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, only track progress. They never drive iteration, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_upgrade_route_gate12_findings/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [ ] **Task 1** — Declare the in-flight sentence once, carry it in `doctor`'s version warning, and fix that warning's double full stop at its join _(layer: cli)_ _(points: 12)_
2. [ ] **Task 2** — Ignore the two workflow `.bak` files and the permission profile's `.bak` in the managed `.gitignore` block _(layer: cli)_ _(points: 10)_
3. [ ] **Task 3** — Print upgrade-specific next steps from `init --upgrade-workflows` instead of the first-setup block _(layer: cli)_ _(points: 15)_
4. [ ] **Task 4** — Silence git's detached-HEAD advice in the `Install the pinned plugin` tag clone _(layer: cli)_ _(points: 8)_
5. [ ] **Task 5** — Document in `### Upgrading` what an upgrade does to a run in flight, and the route to move one on purpose _(layer: general)_ _(points: 10)_
6. [ ] **Task 6** — Bring `docs/cli.md`, the Gate 12 round 4 record and Gate 12 observation (xii) in line with the fixes _(layer: general)_ _(points: 12)_

## Scope register

Tasks 2, 4, 5 and 6 edit durable corpus text: two adopter-facing templates and three developer documents. So the plan owes this register over those targets. The `cli/src` and `cli/test` targets are application source and are not registered.

**Scope predicate**, quoted verbatim from the task prompt's `## Acceptance criteria`: *"`### Upgrading`, the upgrade's printed report and `doctor`'s version warning all state that a run in flight keeps its version, and the section gives the route to move one on purpose."* · *"The upgrade's `.bak` files are ignored by the managed `.gitignore` block."* · *"The upgrade's printed next steps are upgrade-specific, with an upgrade commit message."* · *"A job log's install step carries no detached-HEAD advice."*

**Derivation entry A — corpus prose and templates naming the upgrade route, its `.bak` files, the version warning or the install step (command).** Re-run verbatim from the checkout root: `git grep -n -E 'upgrade-workflows|yml\.bak|\.bak. files|nothing is broken|Install the pinned plugin|never makes it|carried to a follow-up fix|says when you have not moved|Add any other tracked file' -- docs README.md cli/README.md cli/templates`

**Derivation entry B — the managed ignore block's template (command).** `git grep -n -F '.bak' -- cli/templates/repo`

**Derivation entry C — the re-run contract table's `.gitignore` rows (command).** `git grep -n -F '| `.gitignore' -- docs/cli.md`

**Closure invariant:** every site any of the three entries reaches appears as a row below. A hit a re-run finds that no row carries is a gap in this register.

| # | Site (path + quoted anchor) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/github/workflows/harness-resume.yml` header ("`init --upgrade-workflows` re-renders it together with the run workflow") | — | A, `upgrade-workflows` | `no-change` | describes the re-render, which this branch does not change |
| 2 | `cli/templates/github/workflows/harness-run.yml` header ("`init --upgrade-workflows` re-renders it at that CLI's version, after a `.bak`") | — | A, `upgrade-workflows` | `no-change` | describes the re-render, which this branch does not change |
| 3 | `cli/templates/github/workflows/harness-run.yml` `# DECLARED MIRRORS` row ("cli/src/generators/githubWorkflows.ts   --upgrade-workflows") | — | A, `upgrade-workflows` | `no-change` | mirrors `UPGRADE_WORKFLOWS_FLAG`, which is unchanged; `IN_FLIGHT_RUNS_NOTE` is never spelled in the workflow, so it adds no mirror |
| 4 | `cli/templates/github/workflows/harness-run.yml` step `- name: Install the pinned plugin`, its `git clone --quiet --depth 1 --branch "$tag"` line | — | A, `Install the pinned plugin` | `change` | Task 4 |
| 5 | `cli/templates/github/workflows/harness-run.yml` `upgrade_route=` literal ("to run another version, re-render this repository's workflows") | — | A, `upgrade-workflows` | `change` | Task 4 — its "then commit both" commit clause becomes "then commit the paths its printed 'git add' names", because Task 2's lines make the two-workflow set incomplete on the first upgrade past this release; the rest of the one-sentence literal is unchanged |
| 6 | `docs/cli.md` `## 2.` flag table, the `--upgrade-workflows` row ("Re-render the two remote-execution workflows at this CLI's version") | — | A, `upgrade-workflows` | `change` | Task 6 |
| 7 | `docs/cli.md` re-run table row `` `.github/workflows/harness-run.yml` (written only when `execution.target` is `github-actions`) `` | — | A, `upgrade-workflows` | `no-change` | its upgrade-path sentence stays true; the `.bak` ignore is recorded in the `.gitignore` rows (row 30) |
| 8 | `docs/cli.md` re-run table row `` `.github/workflows/harness-resume.yml` (written only when …) `` | — | A, `upgrade-workflows` | `no-change` | as row 7 |
| 9 | `docs/cli.md` doctor bullet ("`remote-execution` and `remote-github` both pass where `execution.target` is `local` or absent") | — | A, `upgrade-workflows` | `change` | Task 6 |
| 10 | `docs/cli.md` ("The push carries `--no-verify` because the `pre-push` hook `init` installed refuses a push to the default branch; this push is the adopter's to make on purpose, and the harness never makes it.") | — | A, `never makes it` | `no-change` | the profile-untrack route's prose, not the version warning; its punctuation is already single |
| 11 | `docs/development.md` **Round 4** opening paragraph ("Round 4 — 2026-09-30, the pinned plugin install before its release") | — | A, `upgrade-workflows` | `no-change` | a dated record of the round; editing it would falsify it |
| 12 | `docs/development.md` **Round 4** → "**Leg A, the previous release's workflow.**" | — | A, `Install the pinned plugin` | `no-change` | dated record |
| 13 | `docs/development.md` **Round 4** → "**Leg B, the upgrade.**" | — | A, `upgrade-workflows` | `no-change` | dated record |
| 14 | `docs/development.md` **Round 4** findings list, item 2 ("`doctor`'s version warning says `nothing is broken`") | — | A, `nothing is broken` | `no-change` | dated record of what the round found; its disposition is stated at row 17 |
| 15 | `docs/development.md` **Round 4** findings list, item 3 ("The same warning carries `never makes it.. To stay on`") | — | A, `never makes it` | `no-change` | dated record |
| 16 | `docs/development.md` **Round 4** findings list, item 4 ("The `.bak` files `init --upgrade-workflows` writes are untracked but not ignored.") | — | A, `upgrade-workflows` | `no-change` | dated record |
| 17 | `docs/development.md` ("All six are carried to a follow-up fix.") | — | A, `carried to a follow-up fix` | `change` | Task 6 — finding 2 is deliberately not carried, so the sentence is no longer true |
| 18 | `docs/development.md` observation **(xii)** ("A job rendered for the previous version, and the upgrade."), including the paragraph after its command block ("Commit the two workflows and push them with `--no-verify`, as *Setup* does") | — | A, `Install the pinned plugin` | `change` | Task 6 — only the commit sentence changes, to the paths the upgrade's printed `git add` names; the next round starts from a repository whose block lacks Task 2's lines, so committing only the two workflows would fail (xii)'s own pass criterion. The pass criteria and the rest of (xii) are unchanged |
| 19 | `docs/development.md` observation **(xii)** command block ("npx --yes autonomous-sdlc-harness@<version> init --upgrade-workflows") | — | A, `upgrade-workflows` | `no-change` | the command is unchanged |
| 20 | `docs/development.md` `## 7. Releasing` ("**The tag comes before the npm publication:**") | — | A, `Install the pinned plugin` | `no-change` | release ordering is unaffected |
| 21 | `docs/remote-execution.md` "**Plugin install, and its pin.**" | — | A, `Install the pinned plugin` | `no-change` | the clone, tag and refusals it describes are unchanged; silencing an advice line changes no behaviour it states |
| 22 | `docs/remote-execution.md` ("Round 4 of Gate 12 in [`development.md`]") | — | A, `upgrade-workflows` | `no-change` | dated record |
| 23 | `docs/remote-execution.md` ("It lands on the default branch because every run's branch is cut from `origin/<default branch>`") | — | A, `upgrade-workflows` | `no-change` | the profile-untrack route; its pointer to *Upgrading* stays true |
| 24 | `docs/remote-execution.md` `### Upgrading` → **The commands** block ("npx autonomous-sdlc-harness@<version> init --upgrade-workflows") | — | A, `upgrade-workflows` | `change` | Task 5 — the section gains the in-flight paragraph and the route |
| 25 | `docs/remote-execution.md` `### Upgrading` ("Add any other tracked file `init` changed, because the job's own `init` refuses a changed tracked file.") | — | A, `Add any other tracked file` | `change` | Task 5 |
| 26 | `docs/remote-execution.md` `### Upgrading` example ("git diff --no-index .github/workflows/harness-run.yml.bak .github/workflows/harness-run.yml") | — | A, `yml\.bak` | `no-change` | the report still prints that command |
| 27 | `docs/remote-execution.md` `### Upgrading` ("Carry over what you need by hand, and do not commit the `.bak` files.") | — | A, `\.bak. files` | `change` | Task 5 |
| 28 | `docs/remote-execution.md` `### Upgrading` ("**`doctor` says when you have not moved.**") | — | A, `says when you have not moved` | `change` | Task 5 |
| 29 | `docs/remote-execution.md` `### Upgrading` ("**When a job cannot install its version**, the `Install the pinned plugin` step refuses") | — | A, `Install the pinned plugin` | `no-change` | the refusals are unchanged |
| 30 | `docs/cli.md` `## 3.` re-run table, the `.gitignore` row ("Every repository already has one.") and the `.gitignore`'s `<stateDir>/docs_index/` line row ("The per-checkout search index is a derived cache") | — | C | `change` | Task 6 — a sibling row for the three new `.bak` lines goes beside them |
| 31 | `cli/templates/repo/gitignore` config-backup group ("# The backup `config set` copies the configuration to before every write, and the one .bak an") | — | B | `change` | Task 2 — the new `.bak` group is added beside it. The existing comment stays true: the upgrade's and `--force`'s copies are asked for, so the config's is still "the one .bak an adopter gets without asking for it" |
