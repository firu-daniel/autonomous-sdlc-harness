#!/usr/bin/env bash
# harness-run-lib.sh — the one place every generated outer-loop script resolves
# the repository it is operating on, reads that repository's
# `harness.config.json` at run time, answers "is this branch protected?",
# routes an inbox filename to its engine and branch (`hr_inbox_route_var`),
# derives a branch name from a title (`hr_derive_branch`), judges whether a
# path lies strictly inside the state directory's scratch directory
# (`hr_scratch_path_var`), answers whether the progress comment is on
# (`hr_progress_comments`) and which main phases a flow-progress ledger records
# as through (`hr_ledger_phases`), answers whether the sandbox opt-out is taken
# (`hr_sandbox_opted_out`) and whether this host has a definite missing sandbox
# prerequisite (`hr_sandbox_prereq_probe_var`, judged by
# `hr_sandbox_prereq_judge_var`, which classifies through `hr_host_kind_var`),
# answers whether a launch holds the host awake (`hr_keep_awake`,
# `hr_keep_awake_probe_var`, `hr_keep_awake_mode_var`), whether it is on mains
# power (`hr_on_mains_power`) and starts that hold (`hr_keep_awake_hold_var`),
# places a dropped
# artifact in a working copy and commits and pushes it, and derives the
# anchors (main checkout, work root, worktree directory, repo slug,
# state-dir paths) the scripts would otherwise each re-derive slightly
# differently. It also implements the run registry's reads and writes for the
# scripts that share that registry, and states the remote state bundle's format
# with the one writer and restorer every remote-execution consumer shares, and
# the GitHub route a job-side notification names beside its local command.
#
# WHO SOURCES THIS, AND HOW. Every script in the configured `scriptsDir` that
# needs this library sources it by a path computed from `${BASH_SOURCE[0]}` —
# the sourcing script's own location — i.e.
#
#     . "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
#
# and never by a hardcoded path, an assumed session root, or the plugin-root
# token the runtime substitutes into hook `command` strings and agent bodies:
# that token is not exported into a script's environment, so a script body that
# reaches for it gets an empty string under `set -u` or an unset variable
# without it. (It is deliberately not spelled out anywhere in this file; its
# literal presence here is exactly the defect this paragraph prevents.) The
# project-command wrappers and `autonomous-format-stream.sh` need nothing from
# this library and do not source it.
#
# ONE SCRIPT MUST NOT USE THAT SPELLING, AND THE REASON GENERALISES.
# `autonomous-watcher.sh` sources this file BEFORE it settles `PATH`, because its
# bootstrap calls `hr_path_with_fallbacks` below; `dirname` is not a builtin, so
# on a service-manager unit that renders no `PATH` key the fork may not resolve
# and the start fails at the one step that cannot afford a lookup. It resolves
# its own directory from `${BASH_SOURCE[0]}` with a `case` strip plus the `cd`
# and `pwd` builtins instead. ANY script that sources this library ahead of its
# own `PATH` settle owes the same builtin-only form; every other script settles
# `PATH` first (or is never started by a service manager) and keeps the `dirname`
# idiom above.
#
# IT IS DELIBERATELY NOT THE PLUGIN'S LIBRARY. The guard hooks have their own
# copy of this shape. The plugin and this package install to unrelated roots, so
# neither can source the other's, and a script that tried would work on the
# machine that wrote it and nowhere else. The two files are kept in step by
# their shared contract — the three-state answer, the protected set and the
# floors below — not by sharing code.
#
# JURISDICTION. Configuration is read at `<repo_root>/harness.config.json` and
# nowhere else, where `<repo_root>` is resolved from a bare
# `git rev-parse --show-toplevel` at the directory the caller names — or, in the
# git-free section, at the checkout `hr_checkout_top_nogit` finds. Which root
# that is, is the caller's choice: the wrappers whose main-checkout copies the
# permission profile runs unsandboxed, `push-branch.sh`, `refresh-branch.sh`
# and `commit-on-branch.sh`, pass the MAIN checkout
# (`hr_wrapper_main_of` their own location) for every configured value they
# decide by — `defaultBranch`, `protectedBranches`, and the `githooksDir`
# `hr_pinned_hooks_path` pins — never the worktree they act in, whose
# `harness.config.json` the sandbox can rewrite. One worktree read remains and
# is inert: `hr_worktree_config_check_var` compares a worktree's
# `config.worktree` `core.hooksPath` against `<worktree>/<githooksDir>` read
# from that worktree's own copy. A rewritten copy can only make the check
# accept a different `core.hooksPath` there, and no git call the wrappers make
# honours that key — each pins its own (`-c core.hooksPath`, and
# `GIT_CONFIG_COUNT` for the library's) — while every other key in that file is
# refused whatever the copy says, and the check's own git call is
# `git -C / config --file`, which loads no repository's configuration. Past
# their checks the wrappers keep git off the target's records too: every
# call that needs no working tree runs in the main checkout (`-C <main>`), and
# the refresh's working-tree calls take `GIT_DIR`, `GIT_COMMON_DIR` and
# `GIT_WORK_TREE` (the commit's: `GIT_DIR=<main>/.git`, the record's index as
# `GIT_INDEX_FILE`, and `GIT_WORK_TREE`) from the values
# `hr_wrapper_target_check_var` checked, so git
# never re-reads the worktree's `.git` pointer and takes its configuration from
# the main repository; the branch is read once (`hr_wrapper_branch_var`), and a
# remote is used only when the main `.git/config` names its URL
# (`hr_remote_url_configured`). The watcher family's callers —
# `autonomous-watcher.sh`, `create-worktree.sh --existing`, `remote-run.sh`,
# `cleanup-merged-worktrees.sh` and `setup-worktree.sh --target` — also pass the
# main checkout for every configured value and keep git off the target's
# records. `setup-worktree.sh --target <dir>` places its own checkout with
# `hr_wrapper_main_of`, checks `<dir>` with `hr_wrapper_target_check_var`, and
# reads every configured value (`appDir`, `qa.credentialsPath`, `githooksDir`,
# `commands.*`) from the main checkout. They skip
# `hr_worktree_config_check_var` because no runner lets git read the record's
# `config.worktree`; the section THE WATCHER FAMILY'S GIT IN A RUN'S COPY holds
# the detail. The target check's clone arm reads the main checkout's
# registry and configuration, plus the clone's `HEAD`,
# `objects/info/alternates`, `.git/config` and the absence of the three
# planted files, once each. Nothing
# here reads an environment variable in place of a configured value, and nothing
# here writes inside a repository except through the named write exceptions
# below.
#
# THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES. Each entry names
# the section that writes, the functions that write, and where. Nothing outside
# this list writes at all; a section that adds a writer adds its entry here.
#
#   1. The machine-level usage lane (the section at the bottom of this file)
#      publishes a state record and takes an advisory lock. Fence: both live
#      under `hr_lane_dir` — a machine-local path outside every repository —
#      and are written only by the `hr_lane_*` functions.
#   2. THE RUN REGISTRY writes the registry file its caller names. Fence: that
#      file is `<root>/<state_dir>/autonomous_logs/registry.json`, resolved
#      through `hr_state_path`, plus the lock directory `<file>.lock` (and its
#      `.stale.*` move-aside and `.break` mutex while a stale one is broken)
#      and the temp files
#      `.registry.*` in the registry's own directory. Written only by
#      `hr_registry_init`, `hr_registry_set`, `hr_registry_drop`,
#      `hr_registry_restore`, `hr_remote_record_init` (through
#      `hr_registry_set`) and the `hr_registry_lock` / `hr_registry_unlock`
#      pair `hr_registry_set`, `hr_registry_drop` and `hr_registry_restore`
#      call.
#   3. THE REMOTE STATE BUNDLE writes the files its format lists. Fence: inside
#      `<root>/<state_dir>/` (resolved through `hr_remote_state_dir_var`), only
#      `autonomous_logs/remote_status.json`, `clarifications/<branch>/`,
#      `PAUSE_PROGRESS.md`, `.flow_walker_state`, the move-aside directory
#      `autonomous_logs/remote_superseded/` and, only where nothing exists yet,
#      files under the eight planning paths `hr_remote_planning_paths` assigns;
#      outside it, only the caller-named `<out_dir>` (its `planning/` included)
#      of `hr_remote_bundle_write`, the caller-named `<dst>` of
#      `hr_remote_copy_tree` (which `hr_remote_bundle_write` names under
#      `<out_dir>`) and the caller-named `<out_json>`
#      of `hr_remote_status_write`. The move-aside directory receives the
#      clarification directory and `PAUSE_PROGRESS.md`, both moved there by
#      `hr_remote_move_aside` alone. Written only by `hr_remote_status_write`,
#      `hr_remote_bundle_write`, `hr_remote_copy_tree`, `hr_remote_bundle_restore`
#      and `hr_remote_move_aside`, and nothing there but a writer's own failed temp
#      file is ever removed. Also `hr_remote_state_dir_var`'s private
#      `mktemp -d` directory and the one `harness.config.json` it holds, removed
#      (`rm -f`, then `rmdir`) before it returns.
#   4. THE ARTIFACT PLACEMENT writes one artifact into a working copy and
#      commits it, and the commit it shares with `commit-on-branch.sh` commits
#      the paths that wrapper names. Fence: the caller-named `<worktree>/<rel>`
#      and its parent directories; the objects `hash-object -w` and
#      `commit-tree` write to the main repository; a `mktemp -d` temporary
#      index, removed on every exit path; `refs/heads/<branch>`, moved only by
#      a compare-and-swap `update-ref`; the copy's index entries for the
#      committed paths; whatever the caller-named push
#      wrapper does; and `hr_push_landed`'s fetch, which force-writes
#      `refs/remotes/origin/<branch>` in the MAIN checkout, made only after a
#      failed landing, to name the commit the remote moved to.
#      Written only by `hr_place_artifact`, `hr_commit_placed`,
#      `hr_commit_paths_var`, `hr_run_blob_var` (objects only) and
#      `hr_push_landed`. On a clone, `hr_commit_paths_var` moves the clone's
#      `refs/heads/<branch>` first and the main checkout's second through
#      `hr_copy_ref_swap_var` (exception 6). A path's parent swapped for a symbolic link between
#      `hr_run_blob_var`'s walk and its hash is the same race
#      `hr_commit_placed` already carried.
#   5. THE WATCHER FAMILY'S GIT IN A RUN'S COPY moves a copy's branch and tree.
#      Fence: `refs/heads/<branch>`, moved on a worktree or the main checkout
#      only by a compare-and-swap `update-ref` against the tip
#      `hr_run_copy_check_var` read; on a clone the copy check itself first
#      moves that ref, by `hr_copy_sync_in_var`'s compare-and-swap against the
#      main checkout's previous value (writing objects there too), and every
#      later move in this section is a compare-and-swap against the tip the
#      copy check read after that sync-in; plus the copy's index
#      (`<record>/index`, `<clone>/.git/index`) and working tree; a `mktemp`
#      temporary index, removed on every exit path;
#      `hr_run_trusted_base_var`'s fetch, which writes objects and `FETCH_HEAD`
#      in the main repository and moves no ref; and, on a clone, the clone's
#      `refs/heads/<branch>` through `hr_copy_ref_swap_var` (clone first,
#      rollback on a failed main swap). Written only by
#      `hr_run_fast_forward_var`, `hr_run_reset_var`,
#      `hr_run_trusted_base_var` (`hr_run_surface_check_var` through it),
#      `hr_run_worktree_diff_var` (the temporary index) and
#      `hr_run_copy_check_var`, which on a clone only, through
#      `hr_copy_sync_in_var`, writes objects into the main repository and
#      moves the main checkout's `refs/heads/<branch>` by compare-and-swap,
#      may also heal the clone's `refs/heads/<branch>` by compare-and-swap,
#      with its index and working tree, and on `main` and `worktree` writes nothing.
#      `hr_run_main_git`, `hr_run_copy_git` and `hr_copy_git_at` are
#      general-purpose runners that
#      write only what their caller's arguments ask, so a caller that drives a
#      writing git command through them owns that write.
#   6. THE CLONE ARM'S SYNC moves objects and one ref between a clone and the
#      main repository, and CREATING AND REMOVING A RUN'S CLONE makes and
#      deletes a clone. Fence: sync-in writes objects, `FETCH_HEAD` and
#      `refs/heads/<branch>` in the main repository, the ref only by a
#      compare-and-swap `update-ref`, and moves the clone's
#      `refs/heads/<branch>` when it heals a strictly-behind clone, only by a
#      compare-and-swap from the tip `ls-remote` read to the main checkout's
#      tip, together with the clone's index and working tree
#      (`hr_copy_git_at`'s two-tree `read-tree -m -u`); sync-out writes the one named ref in a clone's own `.git`; the
#      swap writes a compare-and-swap `update-ref` of the clone's
#      `refs/heads/<branch>` first, then of the main checkout's, and on a
#      failed main swap a compare-and-swap rollback of the clone's ref from
#      <new> to <old> (its verify-only form writes the clone's ref onto
#      itself). Creation writes the derived path
#      `hr_worktree_dir <main> <branch>` and everything under it;
#      `refs/heads/<branch>` in <main> only when it cut that ref, created
#      against an empty old value and deleted on rollback only by a
#      compare-and-swap from the commit it cut; and the registry, through
#      `hr_registry_set`, `hr_registry_drop` and `hr_registry_restore` alone.
#      Removal deletes only the
#      derived path of a clone the registry records. Written only by
#      `hr_copy_sync_in_var`, `hr_copy_sync_out_var`, `hr_copy_ref_swap_var`,
#      `hr_clone_create_var` and `hr_clone_remove_var`.
#
# MIRRORS OF `cli/src/remote/githubActions.ts`, which owns these names; a
# rename there is an edit here, byte for byte:
#   HR_REMOTE_WORKFLOW_RUN_FILE mirrors  WORKFLOW_RUN_FILE
#   HR_REMOTE_STATE_ARTIFACT    mirrors  STATE_ARTIFACT_NAME
#
# MIRROR OF `plugin/instructions/autonomous_pause_and_ledger.md` →
# `### 1.3 Templates`, which owns the flow-progress ledger's two header forms
# and its entry ids; `hr_ledger_phases` codes both, so renaming an id or a
# header form there is an edit here.
#
# MIRROR OF `cli/src/generators/writeProtection.ts` → `copySurfacePaths`, which
# owns a working copy's protected set; `hr_run_protected_rel_paths` is its shell
# mirror, so a change to that set's order or spelling there is an edit here.
#
# MIRROR OF `cli/src/doctor/sandboxPrerequisites.ts` → `sandboxHostKind`,
# `SANDBOX_HOST_BINARIES`, the missing-piece order, `SANDBOX_INSTALLERS` and
# `WSL1_AGENT_MESSAGE`; `hr_host_kind_var` codes the first, and
# `hr_sandbox_prereq_judge_var` the rest, the last two into
# `HR_SANDBOX_REFUSAL`. AppArmor is not mirrored: no shell decision reads
# it.
#
# MIRROR OF `cli/src/doctor/checks.ts` → `probeSandboxHost`;
# `hr_sandbox_prereq_probe_var` mirrors its platform, kernel-release and `PATH`
# reads (`uname -s`, `uname -r`, `command -v`). A change to the probe is an edit
# here.
#
# MIRROR OF `cli/src/config/model.ts` → `sandboxOptedOut`;
# `hr_sandbox_opted_out` and the `sandbox.optedOut` flag `hr_config_load`
# computes. A change to either owner is an edit here.
#
# All three are held equal to their owners by
# `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`.
#
# A caller that calls no `hr_lane_*`, `hr_registry_init`, `hr_registry_set`,
# `hr_remote_record_init`, `hr_registry_lock`, `hr_registry_unlock`, `hr_remote_status_write`,
# `hr_remote_bundle_write`, `hr_remote_copy_tree`, `hr_remote_bundle_restore`,
# `hr_remote_move_aside`, `hr_remote_state_dir_var`, `hr_place_artifact`,
# `hr_commit_placed`, `hr_commit_paths_var`, `hr_run_blob_var`, `hr_push_landed`,
# `hr_run_fast_forward_var`, `hr_run_reset_var`, `hr_run_copy_check_var` (on a
# clone only),
# `hr_run_trusted_base_var`, `hr_run_surface_check_var` (through it), `hr_run_main_git`,
# `hr_run_copy_git`, `hr_copy_git_at`, `hr_copy_sync_in_var`, `hr_copy_sync_out_var`,
# `hr_copy_ref_swap_var`, `hr_registry_drop`, `hr_registry_restore`, `hr_clone_create_var` or
# `hr_clone_remove_var` function
# still gets a library that only reads. The
# lane's ceilings are the only environment values here that carry policy, because
# the lane is machine-scoped and has no configuration key to carry them; each is
# named where it is used. `XDG_STATE_HOME`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`,
# `HOME` and `PWD` are also read, as location anchors only, and `PATH` is read by
# `hr_path_with_fallbacks` alone — as that function's input, which it prints back
# transformed and never assigns — beside the `command -v` of
# `hr_sandbox_prereq_probe_var`, `hr_keep_awake_probe_var` and
# `hr_keep_awake_hold_var`, which resolves against it and never assigns it.
# `GITHUB_ACTIONS` is read by `hr_keep_awake_mode_var` alone, to take no hold on
# a runner, and `HR_POWER_SUPPLY_DIR` by `hr_on_mains_power` alone, as a test
# seam no shipped script sets. `GITHUB_RUN_ID`, `GITHUB_SERVER_URL`,
# `GITHUB_REPOSITORY` and `HARNESS_INPUT_CHAIN` are read by
# `hr_remote_status_write` alone, as provenance values copied into
# `status.json` — never a configured value and never policy.
# `HARNESS_GITHUB_DEFAULT_COMMIT` is read by `hr_remote_state_dir_var` alone, to
# choose WHICH `harness.config.json` is read — the one at that commit — never
# as a value in place of one.
#
# CONFIGURATION IS READ AT RUN TIME, NOT FROZEN AT GENERATION TIME. That is the
# whole reason the shipped scripts carry no `{{token}}`: a guard whose protected
# set was substituted into a file when `init` ran enforces the wrong set the
# moment `protectedBranches` changes, and the failure is silent.
#
# THE THREE-STATE ANSWER — the reason this library exists.
# `hr_branch_is_protected` returns:
#
#     0  protected      — the branch matched a pattern in the resolved set
#     1  not protected  — the set was resolved and the branch is not in it
#     2  unresolvable   — the configuration could not be resolved at all
#                         (no `harness.config.json`, an unreadable one, absent
#                         or pre-1.5 `jq`, invalid JSON, more than one JSON
#                         document, or the required `defaultBranch` missing)
#
# A CONSUMER THAT TREATS 2 AS 1 TAKES A MUTATING ACTION ON A CONFIGURATION IT
# COULD NOT READ. Every caller therefore has a closed outcome for 2 and states
# it in its own header: the commit wrapper refuses loudly (non-zero), the push
# wrapper refuses visibly but non-fatally (exit 0 with a message, because its
# never-abort-the-caller contract is load-bearing), the watcher logs and defers.
#
# THE SAME THREE STATES REACH EVERY TYPED READER: `hr_state_dir`,
# `hr_command`, `hr_project_name` and the rest print their value and return 0,
# return 1 when the key is simply not set (and has no schema default to apply),
# and return 2 when the configuration could not be read. A caller must be able
# to tell "the key is empty" from "the file could not be read", because the
# first is an ordinary project and the second is a repository this script has no
# business acting in. `hr_phase_enabled` answers through the same three
# statuses and prints nothing: 0 is `true`, 1 is `false` or unset, and 2 also
# covers an unknown phase name or a non-boolean value. A reader that wants the
# finer distinction between "no `harness.config.json` at all" and "one that would not parse" calls
# `hr_config_load` directly, which returns 1 for the first and 2 for the second.
#
# THE PROTECTED SET. It is *(`protectedBranches` if present, else that key's
# schema default)* ∪ *{`defaultBranch`}*, matched as `case` globs so one
# `release/*` entry covers its namespace. `defaultBranch` is a required key, so
# its absence is an unresolvable configuration rather than a defaultable one; a
# `protectedBranches` present but EMPTY is a configured set, so it yields
# `{defaultBranch}` and not the schema default. There is no built-in matcher: a
# repository whose default branch is `trunk` and whose list is
# `["trunk","release/*"]` has every other name as an ordinary branch, and this
# library says so.
#
# THE ONE BRANCH NAME IN THIS FILE IS `protectedBranches`'s SCHEMA DEFAULT, and
# it is not the hardcoding the rule above is about. It is spelled exactly once,
# in `hr_protected_default_var`, mirroring `schemas/harness.config.schema.json`
# and the same default the CLI applies when it generates the committed pre-push
# hook — so for one configuration the hook and this library RESOLVE the same
# set. They can still ENFORCE different sets, because they differ in when they
# resolve it: this library re-reads `harness.config.json` on every call, while
# the hook is written create-if-absent and carries the set substituted into its
# `case` label when `init` wrote it. An edit to `protectedBranches` therefore
# binds a wrapper at once and binds the hook only after `init --force`, or
# after deleting the hook and re-running `init`. A third run re-renders the
# hook as a CONSEQUENCE rather than as a way to change the set: `init
# --reset-config` rebuilds `harness.config.json` itself, and re-renders the
# hook from the rebuilt file when the `case` label the hook carried no longer
# matches the set that file resolves — after a `.bak`, and never when the label
# cannot be read. It is not a route to reach for deliberately: the rebuild
# takes the whole config from detection and the flags, so every value that was
# set by hand in the file it replaces goes with it. Which resolution is
# authoritative follows the caller: a push is judged by the `case` label in the
# hook file, because git runs that file, and a wrapper is judged by what this
# library returns. The default is only ever UNIONED with the configured set,
# never a replacement for it, so it can widen the refusal and can never narrow
# one. The defect it must never become is a `case` list of remembered names
# that replaces what the adopter configured: that leaves a repository whose
# integration branch is named anything else with no protection at all, which is
# a wrapper committing or pushing where it should have refused. `init` writes
# `protectedBranches` on every adoption, so this default is reached only by a
# configuration somebody hand-edited the key out of.
#
# FILE DISCIPLINE. Sourced, never executed (mode 0644; the shebang above is a
# dialect marker for editors and linters). No `set -e` and no `set -u` — a
# sourced library must not change its caller's shell — but every parameter
# expansion here is defaulted, so it is safe to source into a caller that sets
# both. No top-level side effects, no exiting, no writes outside the fences of
# the write exceptions named above, and no diagnostics on stdout OR stderr:
# every reader is silent on failure and signals through its return status,
# because callers capture stdout. The one pass-through is the registry's
# writers, `hr_registry_init`, `hr_registry_set`, `hr_registry_drop` and
# `hr_registry_restore`, which leave the shell's, `mktemp`'s and `jq`'s own
# stderr on a failed write to the caller, as the watcher's bodies they replaced
# did — that stream is the watcher's log — and add one line of their own,
# naming the lock, when `hr_registry_set`, `hr_registry_drop` or
# `hr_registry_restore` cannot take the registry lock.
# `hr_clone_create_var` silences all four. The artifact placement's three
# writers likewise leave `mkdir`'s, `cp`'s, git's and the push wrapper's own
# output on their stdout and stderr for the caller to redirect into its log,
# and `hr_commit_placed` adds its own refusal lines on stderr.
# `hr_remote_bundle_write` (through `hr_remote_bundle_source_ok`) and `hr_remote_copy_tree` print one
# `remote state bundle: skipped …` line on stderr per source or entry they
# skip, because a skipped source still yields a written bundle and the job's
# log is the only place the skip can be seen. `hr_run_fast_forward_var` and
# `hr_run_reset_var` leave the stderr of their writing git calls (`read-tree`,
# `update-ref`) to the caller too, and so does `hr_commit_paths_var`.
# That silence is why the lane reports a lock it BROKE through a
# variable instead of a log line — the caller owns the log.
#
# NAMING. Every function is prefixed `hr_`; every variable this file touches
# outside a `local` is prefixed `HR_`. The `HR_`-prefixed ones exist to return a
# value WITHOUT a command substitution — a `$(…)` forks a subshell, and the
# watcher calls these on every tick: `HR_CFG_PID`, `HR_CFG_ROOT`,
# `HR_CFG_STATE`, `HR_CFG_FILE`, `HR_CFG_SCALARS`, `HR_CFG_LISTS`,
# `HR_CFG_VALUE`, `HR_CFG_COMMAND_KEYS`, `HR_PROTECTED_DEFAULT`,
# `HR_INBOX_KIND`, `HR_INBOX_BRANCH`, `HR_WT_CONFIG_REFUSAL`,
# `HR_TARGET_REFUSAL`, `HR_PINNED_HOOKS_PATH`, `HR_PINNED_HOOKS_REFUSAL`,
# the branch derivation's `HR_BRANCH_SLUG_MAX`, `HR_BRANCH_SUFFIX_MAX`,
# `HR_TAKEN_REMOTE`, `HR_TAKEN_ARTIFACTS` and `HR_TAKEN_WHY`, and the lane's
# `HR_LANE_RANK`, `HR_LANE_STATE`, `HR_LANE_RESUME_AT`, `HR_LANE_OBSERVED_AT`,
# `HR_LANE_OBSERVED_REPO`, `HR_LANE_OWNER_SLUG`, `HR_LANE_OWNER_PID`,
# `HR_LANE_OWNER_AT` and `HR_LANE_BROKEN_OWNER`, and the remote state bundle's
# names, which `hr_remote_names_var` assigns, with `HR_REMOTE_PLANNING_PATHS`
# (`hr_remote_planning_paths`) and `HR_REMOTE_PLANNING_PLACED` /
# `HR_REMOTE_PLANNING_KEPT` (`hr_remote_bundle_restore`), `HR_REMOTE_ASIDE`
# (`hr_remote_move_aside`), `HR_REMOTE_STATE_DIR`, `HR_REMOTE_STATE_FROM`
# and `HR_REMOTE_STATE_CHECKOUT`
# (`hr_remote_state_dir_var`) and `HR_REMOTE_LINKED`
# (`hr_remote_link_free_var`), and the watcher family's `HR_RUN_MAIN`,
# `HR_RUN_REFUSAL`, `HR_RUN_TRUSTED_BASE`, `HR_RUN_COPY_TOP`,
# `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH`, `HR_RUN_COPY_TIP`,
# `HR_RUN_SURFACE_REFUSAL`, `HR_RUN_WT_DIFF`, `HR_RUN_FF_REFUSAL`,
# `HR_RUN_RESET_REFUSAL`, `HR_RUN_BLOB` and `HR_RUN_BLOB_MODE`, and the shared
# commit's `HR_COMMIT_REFUSAL`, `HR_COMMIT_NEW` and `HR_COMMIT_SYNC_FAILED`,
# the target check's clone arm's `HR_TARGET_KIND`, `HR_TARGET_BRANCH`,
# `HR_CLONE_CONFIG_REFUSAL` and `HR_CLONE_RULE`, the watcher family's
# `HR_RUN_COPY_KIND`, and the clone arm's sync's `HR_SYNC_TIP` and
# `HR_SYNC_REFUSAL`, and the clone creation's `HR_CLONE_DIR` and
# `HR_CLONE_REFUSAL`, and the host classifier's `HR_HOST_KIND`, and the
# keep-awake section's `HR_KEEP_AWAKE_WHO` and `HR_KEEP_AWAKE_WHAT` (assigned
# at source time), `HR_KEEP_AWAKE_HOST`, `HR_KEEP_AWAKE_TOOL`,
# `HR_KEEP_AWAKE_MODE`, `HR_KEEP_AWAKE_REASON`, `HR_KEEP_AWAKE_QUIET`,
# `HR_KEEP_AWAKE_STATE`, `HR_KEEP_AWAKE_PID` and `HR_KEEP_AWAKE_DETAIL`.
# Every one of them is assigned
# before it is read by the function that owns it, so an inherited value from a
# parent process is overwritten rather than believed — except
# `HR_RUN_TRUSTED_BASE`, which `hr_run_trusted_base_var` reuses when set and
# `hr_run_main_set_var` clears, so a caller sets its main checkout first.
#
# BASH 3.2 IS THE FLOOR. macOS ships `/bin/bash` 3.2, so nothing here uses an
# associative array, `${var^^}` / `${var,,}`, `mapfile` or `local -n`. The cache
# below is a string-record store for exactly that reason, and each
# case-folding step forks `tr` rather than reaching for a 4.x expansion.
#
# JQ 1.5 IS THE FLOOR, AND AN OLDER `jq` IS UNRESOLVABLE, NOT ABSENT.
# `hr_config_load`'s program uses five constructs that are all jq 1.5 additions:
# `input` / `inputs` (the multi-document refusal), `@tsv` (the record format),
# `try … catch`, `error("…")` and the `def s($k; $v)` value-parameter form. On an
# older `jq` the program is a COMPILE error, so the load fails and every reader
# returns 2 — the closed path — while `command -v jq` still succeeds and says
# nothing. That is why `doctor` checks the version rather than the binary. If
# you add a construct here, check it against 1.5 or raise this floor in both
# places.
#
# THE CACHE IS PER PROCESS, SO A LONG-LIVED CALLER MUST RESET IT PER TICK.
# `hr_config_load` runs ONE `jq` and holds the result in shell variables, so a
# script that reads a dozen keys forks `jq` once instead of a dozen times. The
# entry is keyed by root and stamped with `$$`, never by the file's contents:
# a caller that outlives an edit to `harness.config.json` — the watcher, which
# runs for days — is answered from the document it replaced until it calls
# `hr_config_reset`. THE WATCHER CALLS IT ONCE AT THE TOP OF EVERY TICK; a
# one-shot wrapper never needs to. A `$(…)` runs in a SUBSHELL, which inherits
# the cache but cannot write one back, so a caller that reads only through
# command substitutions loads the document once per read: call
# `hr_config_load "$root" || :` once, unsubstituted, to warm it. Forgetting that
# line is slower and still correct.
#
# REPRO — reproduce any answer by hand, against a throwaway fixture:
#
#   . <repo>/<scripts_dir>/lib/harness-run-lib.sh
#   root=$(git -C <dir> rev-parse --show-toplevel)
#
#   adopted + valid   hr_protected_patterns "$root"
#                     hr_branch_is_protected "$root" "$(hr_current_branch "$root")"; echo $?
#                     -> the resolved set, then 0 or 1
#                     hr_state_dir "$root"; hr_command "$root" test
#   phase toggles     each against its own fresh fixture, so the cache is cold:
#                     {"defaultBranch":"main","phases":{"qa":true}}
#                     hr_phase_enabled "$root" qa; echo $?  -> 0, prints nothing
#                     {"defaultBranch":"main"}
#                     hr_phase_enabled "$root" qa; echo $?  -> 1
#                     {"defaultBranch":"main","phases":{"qa":"yes"}}
#                     hr_phase_enabled "$root" qa; echo $?  -> 2
#   adopted + broken  printf 'x' > "$root/harness.config.json"
#                     hr_branch_is_protected "$root" <branch>; echo $?  -> 2
#                     hr_state_dir "$root"; echo $?                     -> 2, prints nothing
#   not adopted       mv "$root/harness.config.json" "$root/../saved.json"
#                     hr_config_file "$root"; echo $?                   -> 1, prints nothing
#                     hr_config_load "$root"; echo $?                   -> 1
#   not a repository  hr_repo_root /tmp; echo $?                        -> 1, prints nothing
#   anchors           hr_main_repo "$root"; hr_work_root "$root"
#                     hr_worktree_dir "$root" feat/x; hr_repo_slug "$root"
#                     hr_state_path "$root" autonomous_logs/registry.json
#   machine dirs      ( XDG_CACHE_HOME= hr_cache_dir )     -> $HOME/.cache/autonomous-sdlc-harness
#                     ( XDG_CACHE_HOME=/x/ hr_cache_dir )  -> /x/autonomous-sdlc-harness
#   the PATH policy   run each in a SUBSHELL, so your own PATH is untouched:
#                     ( PATH="$HOME/.rbenv/shims:/usr/bin:/bin"
#                       hr_path_with_fallbacks )
#                     -> the shims entry STILL FIRST and `/usr/bin:/bin` still
#                        after it, then the five absent fallbacks appended in
#                        list order:
#                        /opt/homebrew/bin:/usr/local/bin:/usr/sbin:/sbin:$HOME/.local/bin
#                     ( PATH=/usr/bin:/bin:/usr/sbin:/sbin
#                       hr_path_with_fallbacks )
#                     -> that value, then the three absent ones —
#                        /opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin —
#                        which is how `jq`, a Homebrew toolchain and an agent CLI
#                        under `~/.local/bin` stay resolvable from a bare
#                        service-manager PATH, none of them being in `/usr/bin`.
#                        A Homebrew copy of a name `/usr/bin` DOES hold (`ruby`,
#                        `python3`, `curl`, `git`) is reached but no longer
#                        preferred, which is the price of never demoting the
#                        caller's order.
#   the lane          point it somewhere disposable first, so a live daemon's
#                     lane is not what you experiment on:
#                     export XDG_STATE_HOME=$(mktemp -d)
#                     hr_lane_dir; hr_lane_read            -> the dir, `unknown 0`
#                     hr_lane_publish repo-a feat/x warning $(( $(date +%s) + 600 ))
#                     hr_lane_read                         -> `warning <epoch>`
#                     hr_lane_publish repo-b feat/y allowed 0; hr_lane_read
#                     -> STILL `warning <epoch>`: worst-wins, and the stored
#                        record is not spent yet
#                     hr_lane_acquire repo-a; echo $?      -> 0
#                     hr_lane_owner                        -> `repo-a <pid> <epoch>`
#                     hr_lane_acquire repo-b; echo $?      -> 1 (a LIVE foreign owner)
#                     hr_lane_release repo-b; echo $?      -> 1 (never ours to release)
#                     hr_lane_release repo-a; hr_lane_owner; echo $?   -> 1, free
#   a stale lane      hr_lane_acquire repo-a
#                     printf 'repo-a 999999 1\n' > \
#                       "$(hr_lane_dir)/run-lane.lock/owner"
#                     hr_lane_acquire repo-b; echo $?      -> 0, and
#                     echo "$HR_LANE_BROKEN_OWNER"         -> names repo-a 999999

# ---------------------------------------------------------------------------
# The PATH policy — the one function here that runs BEFORE anything else works.
# ---------------------------------------------------------------------------

# Print — never export, never assign — a `PATH` that keeps everything the caller
# inherited and adds the usual locations it is missing. Takes no arguments,
# reads `PATH` and `HOME` from the environment, always returns 0.
#
# IT APPENDS; IT NEVER PROMOTES AND NEVER DEMOTES. Each fallback directory is
# added to a SUFFIX only when it is absent from the inherited `PATH`, and the
# suffix goes AFTER the inherited value. A directory already there keeps its
# inherited position and is never re-added, and the relative order of everything
# the caller inherited is unchanged — whatever the caller put first stays first.
# Prepending, even prepending only what is absent, inserts a directory ahead of a
# version-manager shims directory the caller deliberately put first, and the tool
# that then resolves is the system one.
#
# IT NAMES NO TOOLCHAIN. The list is locations, not languages: which toolchain a
# repository needs is its own configuration's business.
#
# BUILTIN-ONLY, AND THAT IS THE CONTRACT, NOT AN OPTIMIZATION. The caller runs
# this to MAKE `PATH` usable, so every step is a `case`, a parameter expansion or
# `printf` — an external command here would be the failure this function exists
# to prevent.
#
# NO EMPTY ENTRY SURVIVES. An empty `PATH` element means the current directory,
# and callers of this are daemons, so a leading, trailing or doubled colon in the
# inherited value is dropped (order and duplicates otherwise untouched). With an
# unset or empty `PATH` the result is the fallback list alone; with an unset or
# empty `HOME` the `$HOME/.local/bin` entry is skipped rather than rendered as a
# bare `/.local/bin`.
hr_path_with_fallbacks() {
  local inherited="${PATH-}" home="${HOME-}" kept="" suffix="" rest entry dir
  rest="$inherited"
  while [ -n "$rest" ]; do
    entry=${rest%%:*}
    if [ "$entry" = "$rest" ]; then rest=""; else rest=${rest#*:}; fi
    [ -n "$entry" ] || continue
    if [ -n "$kept" ]; then kept="$kept:$entry"; else kept="$entry"; fi
  done

  # Unquoted on purpose: these six are fixed literals with no space among them.
  # `$HOME/.local/bin` is NOT in this list — a home directory can contain a
  # space, and the entry is conditional — so it is handled after the loop, which
  # is also where the policy's order puts it.
  for dir in /opt/homebrew/bin /usr/local/bin /usr/bin /bin /usr/sbin /sbin; do
    case ":$kept:" in *":$dir:"*) continue ;; esac
    case ":$suffix:" in *":$dir:"*) continue ;; esac
    if [ -n "$suffix" ]; then suffix="$suffix:$dir"; else suffix="$dir"; fi
  done

  if [ -n "$home" ]; then
    dir="${home%/}/.local/bin"
    case ":$kept:" in
      *":$dir:"*) ;;
      *)
        if [ -n "$suffix" ]; then suffix="$suffix:$dir"; else suffix="$dir"; fi
        ;;
    esac
  fi

  if [ -n "$kept" ] && [ -n "$suffix" ]; then
    printf '%s\n' "$kept:$suffix"
  elif [ -n "$kept" ]; then
    printf '%s\n' "$kept"
  else
    printf '%s\n' "$suffix"
  fi
  return 0
}

# ---------------------------------------------------------------------------
# Resolution — the repository, its main checkout, and the directory holding
# both. Anchors are DERIVED, never remembered: the script this library is
# sourced into may be running in the main checkout or in any sibling worktree,
# and a fixed `dirname $0` walk only works for one repository layout.
# ---------------------------------------------------------------------------

# 0 when `jq` is on PATH. Its VERSION is not tested here — see the jq floor in
# the header: a pre-1.5 `jq` fails the load instead, which is the closed path.
hr_have_jq() {
  command -v jq >/dev/null 2>&1
}

# Print the work-tree root of the repository containing <dir> (default `$PWD`);
# return 1, printing nothing, when <dir> is not inside a repository or `git` is
# not on PATH.
#
# The probe is issued BARE — the literal `rev-parse --show-toplevel`, with
# nothing added — because an unattended run's permission profile allow-lists it
# in that exact spelling, and a flag appended to it is a different string,
# which an unattended run refuses.
hr_repo_root() {
  local dir="${1-}" top
  [ -n "$dir" ] || dir="${PWD-}"
  [ -n "$dir" ] || dir="."
  top=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || return 1
  [ -n "$top" ] || return 1
  printf '%s\n' "$top"
}

# Print the MAIN checkout of the repository containing <dir> (default `$PWD`) —
# the first entry of `git worktree list --porcelain`, which git documents as the
# main working tree. Return 1, printing nothing, when the probe does not answer.
#
# WHY THE MAIN CHECKOUT IS A SEPARATE ANCHOR: the inbox, the logs, the registry
# and the kill switch live in ONE place so every run is tailable and stoppable
# from it, while a run itself executes in a sibling worktree. A script that used
# its own checkout for both would write a second, invisible inbox per worktree.
#
# Inside a clone it answers the clone itself. It never reads HARNESS_MAIN_REPO,
# because its callers run unsandboxed and place the main checkout from their own
# location.
hr_main_repo() {
  local dir="${1-}" out line
  [ -n "$dir" ] || dir="${PWD-}"
  [ -n "$dir" ] || dir="."
  out=$(git -C "$dir" worktree list --porcelain 2>/dev/null) || return 1
  [ -n "$out" ] || return 1
  while IFS= read -r line; do
    case "$line" in
      "worktree "*)
        line=${line#worktree }
        [ -n "$line" ] || return 1
        printf '%s\n' "$line"
        return 0
        ;;
    esac
  done <<EOF
$out
EOF
  return 1
}

# Print the directory above <repo_root> — where sibling worktrees live. Matches
# the CLI's `workRoot()` (the repository root's parent) byte for byte, because
# the generated permission profile is materialized from that one.
hr_work_root() {
  local root="${1-}" parent
  [ -n "$root" ] || return 1
  while [ "$root" != "/" ] && [ "${root%/}" != "$root" ]; do root=${root%/}; done
  parent=${root%/*}
  [ -n "$parent" ] || parent="/"
  printf '%s\n' "$parent"
}

# Print the repository directory's own name — the value `projectName` defaults
# to, and the CLI's `defaultProjectName()`.
hr_default_project_name() {
  local root="${1-}"
  [ -n "$root" ] || return 1
  while [ "$root" != "/" ] && [ "${root%/}" != "$root" ]; do root=${root%/}; done
  root=${root##*/}
  [ -n "$root" ] || return 1
  printf '%s\n' "$root"
}

# ---------------------------------------------------------------------------
# The inherited git environment.
# ---------------------------------------------------------------------------

# Unset every `GIT_*` name that would point git at another repository, index,
# object store, configuration or program, and every set `GIT_TRACE*`, which
# would have git write a trace to a file the caller's environment names.
# `GIT_SSH_COMMAND` is kept. This is the one statement of the list
# `push-branch.sh` and `refresh-branch.sh` used to carry inline; a caller calls
# it before its first git call. Returns 0.
hr_git_env_drop() {
  local hr_trace_var
  unset GIT_DIR GIT_COMMON_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY \
    GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_NAMESPACE GIT_CEILING_DIRECTORIES \
    GIT_TEMPLATE_DIR GIT_CONFIG_PARAMETERS GIT_CONFIG_COUNT GIT_CONFIG_GLOBAL \
    GIT_CONFIG_SYSTEM GIT_EXEC_PATH
  for hr_trace_var in ${!GIT_TRACE*}; do unset "$hr_trace_var"; done
  return 0
}

# ---------------------------------------------------------------------------
# Git-free resolution and the per-working-copy configuration. A wrapper the
# permission profile runs OUTSIDE the sandbox calls these before its first git
# call: any git call loads the target's configuration, including
# `.git/worktrees/<name>/config.worktree`, which a sandboxed command can write.
# So nothing in this section runs git except `git -C / config --file <f>`,
# which reads that one file and loads no repository's configuration.
#
# Only `hr_gitdir_nogit` and `hr_common_dir_nogit` parse a `.git` pointer file
# or a `commondir` file; everything else that needs a gitdir or a common dir
# calls them.
# ---------------------------------------------------------------------------

# Print the canonical form of the absolute path <p>: the physical path of its
# longest existing ancestor (`cd -P`), with the rest appended after `.`, `..`
# and empty segments are removed lexically. Return 1 for a relative <p>.
hr_canonical_path_nogit() {
  local p="${1-}" out="" rest seg head tail=""
  case "$p" in /*) ;; *) return 1 ;; esac
  if [ -d "$p" ]; then
    ( CDPATH= cd -P -- "$p" 2>/dev/null && pwd -P ) || return 1
    return 0
  fi
  rest=${p#/}
  while [ -n "$rest" ]; do
    seg=${rest%%/*}
    if [ "$seg" = "$rest" ]; then rest=""; else rest=${rest#*/}; fi
    case "$seg" in
      '' | .) ;;
      ..) out=${out%/*} ;;
      *) out="$out/$seg" ;;
    esac
  done
  [ -n "$out" ] || out=/
  head=$out
  while [ ! -d "$head" ]; do
    tail="/${head##*/}$tail"
    head=${head%/*}
    [ -n "$head" ] || head=/
  done
  head=$( CDPATH= cd -P -- "$head" 2>/dev/null && pwd -P ) || return 1
  [ "$head" != / ] || head=""
  out="$head$tail"
  [ -n "$out" ] || out=/
  printf '%s\n' "$out"
}

# Print the nearest ancestor of <dir>, <dir> included, that holds a `.git`
# entry (directory or pointer file); return 1, printing nothing, when none
# does. <dir> is made physical first, so the answer matches what
# `git rev-parse --show-toplevel` prints for the same checkout — the base
# `setup-worktree.sh` builds the `core.hooksPath` value on.
hr_checkout_top_nogit() {
  local dir="${1-}" d
  [ -n "$dir" ] || return 1
  d=$( CDPATH= cd -P -- "$dir" 2>/dev/null && pwd -P ) || return 1
  while :; do
    if [ -e "$d/.git" ] || [ -L "$d/.git" ]; then
      printf '%s\n' "$d"
      return 0
    fi
    [ "$d" != / ] || return 1
    d=${d%/*}
    [ -n "$d" ] || d=/
  done
}

# Print the main checkout holding <dir>, found past placeholder leftovers:
# `hr_checkout_top_nogit <dir>`, then, while that checkout's `.git` is a
# leftover (`hr_placeholder_leftover_var`) and it is not `/`,
# `hr_checkout_top_nogit` of its parent. 0 only when the final `.git` is a real
# directory, not a symbolic link; otherwise 1, printing nothing. Runs no git
# and removes nothing.
#
# It exists because a leftover `<main>/<scriptsDir>/.git` hides the main
# checkout from `hr_main_repo` and `hr_checkout_top_nogit` alike, so the
# watcher's start-up sweep could not otherwise find the manifests that list it.
# It carries no leftover test of its own.
hr_main_checkout_past_leftovers_nogit() {
  local top parent
  top=$(hr_checkout_top_nogit "${1-}") || return 1
  while [ "$top" != / ] && hr_placeholder_leftover_var "$top/.git"; do
    parent=${top%/*}
    [ -n "$parent" ] || parent=/
    top=$(hr_checkout_top_nogit "$parent") || return 1
  done
  [ -d "$top/.git" ] && [ ! -L "$top/.git" ] || return 1
  printf '%s\n' "$top"
}

# Print the canonical gitdir of the checkout at <top>: `<top>/.git` when that is
# a directory; when it is a file whose first line is `gitdir: <p>`, `<p>`
# (resolved against <top> when relative). Return 1 otherwise.
hr_gitdir_nogit() {
  local top="${1-}" line="" p
  [ -n "$top" ] || return 1
  if [ -d "$top/.git" ]; then
    p="$top/.git"
  elif [ -f "$top/.git" ]; then
    IFS= read -r line 2>/dev/null <"$top/.git" || [ -n "$line" ] || return 1
    line=${line%$'\r'}
    case "$line" in
      'gitdir: '?*) p=${line#gitdir: } ;;
      *) return 1 ;;
    esac
    case "$p" in /*) ;; *) p="$top/$p" ;; esac
  else
    return 1
  fi
  ( CDPATH= cd -P -- "$p" 2>/dev/null && pwd -P ) || return 1
}

# Print the canonical git common dir of the checkout at <top>: the content of
# `<gitdir>/commondir` resolved against the gitdir when that file exists, else
# the gitdir itself. Return 1 when `hr_gitdir_nogit` fails, or when the result's
# basename is not `.git` — the main checkout is that directory's parent, and a
# common dir with any other name (a bare or a submodule repository) has none.
hr_common_dir_nogit() {
  local top="${1-}" gd line="" c out
  gd=$(hr_gitdir_nogit "$top") || return 1
  if [ -f "$gd/commondir" ]; then
    IFS= read -r line 2>/dev/null <"$gd/commondir" || [ -n "$line" ] || return 1
    line=${line%$'\r'}
    [ -n "$line" ] || return 1
    case "$line" in /*) c=$line ;; *) c="$gd/$line" ;; esac
    out=$( CDPATH= cd -P -- "$c" 2>/dev/null && pwd -P ) || return 1
  else
    out=$gd
  fi
  case "$out" in */.git) ;; *) return 1 ;; esac
  printf '%s\n' "$out"
}

# Print the canonical main checkout of the checkout holding <dir>: the parent of
# `hr_common_dir_nogit "$(hr_checkout_top_nogit <dir>)"`. Return 1, printing
# nothing, when either call fails. The git-free twin of `hr_main_repo`, which
# runs `git worktree list` and so would load the configuration of a checkout a
# wrapper has not yet decided to trust.
hr_main_checkout_of() {
  local top common main
  top=$(hr_checkout_top_nogit "${1-}") || return 1
  common=$(hr_common_dir_nogit "$top") || return 1
  main=${common%/.git}
  [ -n "$main" ] || main=/
  ( CDPATH= cd -P -- "$main" 2>/dev/null && pwd -P ) || return 1
}

# Print the canonical main checkout of the wrapper whose own directory is
# <script_dir>, for `push-branch.sh`, `refresh-branch.sh`, `commit-on-branch.sh`
# and the watcher family's callers the header's JURISDICTION lists, and no
# others. Return 1,
# printing nothing, when it cannot be placed. The checkout `hr_checkout_top_nogit`
# finds from <script_dir> is taken as it stands when its `.git` is a real
# directory — not a symbolic link — holding no `commondir`; one whose `.git` is
# a regular pointer file is a linked worktree, and its main checkout is
# `hr_main_checkout_of`'s answer; anything else, including a `.git` directory
# holding a `commondir`, is refused.
#
# Why not `hr_main_checkout_of` throughout: it follows `<top>/.git/commondir`,
# and a sandboxed command can create that file — a linked worktree may write
# the main repository's `.git` except `hooks/` and `config`. Followed, it would
# name a directory of the sandbox's choosing as the main checkout, and with it
# the configuration, the target check's anchor and the hooks pin, for a script
# running unsandboxed. git honours that file too, so the permission profile
# write-protects it as well; this refusal is what holds where the profile is
# not loaded. A real main checkout's `.git` holds no `commondir`.
#
# The pointer-file arm can be redirected, and that is harmless: the profile
# runs only the MAIN checkout's copies unsandboxed, so a script whose own
# checkout is a linked worktree is a worktree's copy, which runs sandboxed and
# sits in a tree the sandbox can rewrite anyway. A `.git` planted between the
# main checkout and <script_dir> — which would make that directory the nearest
# checkout — is refused by the profile, which write-protects `<p>/.git` at
# every level `<p>` of `scriptsDir` (`cli/src/generators/writeProtection.ts`).
hr_wrapper_main_of() {
  local top
  top=$(hr_checkout_top_nogit "${1-}") || return 1
  [ ! -L "$top/.git" ] || return 1
  if [ -d "$top/.git" ]; then
    if [ -e "$top/.git/commondir" ] || [ -L "$top/.git/commondir" ]; then
      return 1
    fi
    printf '%s\n' "$top"
    return 0
  fi
  [ -f "$top/.git" ] || return 1
  hr_main_checkout_of "$top"
}

# Judge whether <target_top> is a checkout an unsandboxed wrapper, or one of the
# watcher family's callers the header's JURISDICTION lists, may run git in,
# for the main checkout <main_top> the wrapper's own location gives
# (`hr_wrapper_main_of`), and set `HR_TARGET_GITDIR` to its canonical gitdir —
# `<main_top>/.git` for the main checkout, `<p>` below for a worktree — so the
# wrapper can hand git the record it checked instead of letting git find one
# again. Return 0
# when, compared canonically, <target_top> is <main_top>, or when it is a
# worktree that main repository lists: `<target_top>/.git` is a regular file;
# its gitdir `<p>` (`hr_gitdir_nogit`) sits directly in `<main_top>/.git/worktrees`;
# `<p>/commondir` exists and the common dir (`hr_common_dir_nogit`) is
# `<main_top>/.git` — without that file the common dir is `<p>` itself, whose
# basename is not `.git`, so `hr_common_dir_nogit` already fails; and `<p>/gitdir`, resolved against `<p>`, is
# `<target_top>/.git`. Return 1 otherwise, with `HR_TARGET_REFUSAL` set to one
# sentence naming the failed condition, never a file's contents. Prints nothing;
# call it directly, never inside `$(…)`.
#
# The target is untrusted because the permission profile's excluded rule for
# each wrapper ends in `:*`, which takes any argument: a sandboxed command could
# build a repository whose own configuration runs a program, and hand it over.
# The git records read are the target's `.git` pointer, `<p>/commondir` and
# `<p>/gitdir` — the back-pointer by which git itself lists a worktree, read
# here and nowhere else in this library.
#
# A worktree registered by a sandboxed command still passes: a linked worktree
# may write the main repository's `.git` except `hooks/` and `config`, so it can
# create a `<main>/.git/worktrees/<name>` of its own. Such a worktree's
# configuration is the main `.git/config`, which the sandbox cannot write, plus
# its `config.worktree`, which `hr_worktree_config_check_var` holds to one key,
# and its hooks are pinned (`hr_pinned_hooks_path`).
#
# Every record judged here is read once. A sandboxed process still running when
# the wrapper starts could rewrite one between this check and a git call, so
# the wrappers do not let git re-read them: `push-branch.sh` runs every git call
# in the main checkout, and `refresh-branch.sh` passes `HR_TARGET_GITDIR` as
# `GIT_DIR` with `GIT_COMMON_DIR` and `GIT_WORK_TREE`, so the `.git` pointer is
# never read again and the configuration and hooks come from the main
# repository. `commit-on-branch.sh` borrows only `<HR_TARGET_GITDIR>/index`,
# under `GIT_DIR=<main>/.git`, so git reads nothing else of the record. Two
# re-reads remain in the refresh's working-tree calls: git's
# ref store still follows the record's `commondir` (refs only — no
# configuration, hooks or objects), and git still reads the record's
# `config.worktree`. The permission profile write-protects both files, each
# record's `gitdir`, each worktree's `.git` pointer and the record directories
# themselves (`cli/src/generators/writeProtection.ts`); how the Linux sandbox
# treats those globbed entries is unverified.
#
# It also sets `HR_TARGET_KIND` — `main`, `worktree` or `clone` — and, on the
# clone arm only, `HR_TARGET_BRANCH`. The clone arm is taken only when
# `<target_top>/.git` is a real directory, not a symbolic link; it is
# `hr_clone_target_check_var`, whose header lists its conditions.
hr_wrapper_target_check_var() {
  local main="${1-}" target="${2-}" p common line="" back back_c want
  HR_TARGET_REFUSAL=""
  HR_TARGET_GITDIR=""
  HR_TARGET_KIND=""
  HR_TARGET_BRANCH=""
  if ! main=$( CDPATH= cd -P -- "$main" 2>/dev/null && pwd -P ); then
    HR_TARGET_REFUSAL="the main checkout '${1-}' is not a directory"
    return 1
  fi
  if ! target=$( CDPATH= cd -P -- "$target" 2>/dev/null && pwd -P ); then
    HR_TARGET_REFUSAL="the target '${2-}' is not a directory"
    return 1
  fi
  if [ "$target" = "$main" ]; then
    HR_TARGET_GITDIR="$main/.git"
    HR_TARGET_KIND=main
    return 0
  fi
  local refused="'$target' is neither the main checkout $main nor a worktree it lists"
  if [ -d "$target/.git" ] && [ ! -L "$target/.git" ]; then
    hr_clone_target_check_var "$main" "$target" "$refused"
    return
  fi
  if [ ! -f "$target/.git" ] || [ -L "$target/.git" ]; then
    HR_TARGET_REFUSAL="$refused: its .git is not a regular pointer file"
    return 1
  fi
  if ! p=$(hr_gitdir_nogit "$target") || [ "${p%/*}" != "$main/.git/worktrees" ]; then
    HR_TARGET_REFUSAL="$refused: its .git does not point into $main/.git/worktrees"
    return 1
  fi
  if ! common=$(hr_common_dir_nogit "$target") || [ "$common" != "$main/.git" ]; then
    HR_TARGET_REFUSAL="$refused: its worktree record's commondir does not resolve to $main/.git"
    return 1
  fi
  if [ -f "$p/gitdir" ]; then
    IFS= read -r line 2>/dev/null <"$p/gitdir" || [ -n "$line" ] || line=""
    line=${line%$'\r'}
  fi
  back=""
  if [ -n "$line" ]; then
    case "$line" in /*) back=$line ;; *) back="$p/$line" ;; esac
  fi
  back_c=""
  [ -z "$back" ] || back_c=$(hr_canonical_path_nogit "$back") || back_c=""
  want=$(hr_canonical_path_nogit "$target/.git") || want=""
  if [ -z "$back_c" ] || [ -z "$want" ] || [ "$back_c" != "$want" ]; then
    HR_TARGET_REFUSAL="$refused: its worktree record's gitdir does not point back at $target/.git"
    return 1
  fi
  HR_TARGET_GITDIR=$p
  HR_TARGET_KIND=worktree
  return 0
}

# The clone arm of `hr_wrapper_target_check_var`, for a canonical <main> and a
# canonical <target> whose `.git` is a real directory; <refused> is that
# function's refusal prefix. Return 0 with `HR_TARGET_GITDIR` (`<target>/.git`),
# `HR_TARGET_KIND` (`clone`) and `HR_TARGET_BRANCH` set when, in order:
#   1. `<target>/.git/HEAD` is one line `ref: refs/heads/<branch>`, and the
#      registry at `hr_state_path <main> autonomous_logs/registry.json` gives
#      `copy_kind` `clone` for <branch> and a `worktree` that is <target>;
#   2. <target> is `hr_worktree_dir <main> <branch>`;
#   3. `.git/commondir`, `.git/config.worktree` and
#      `.git/objects/info/http-alternates` are absent, symbolic links included,
#      and `.git/objects` and `.git/objects/info` are real directories;
#   4. `.git/objects/info/alternates` is a regular file holding one line,
#      `<main>/.git/objects`;
#   5. `hr_clone_config_check_var <main> <target>` passes.
# Each comparison is canonical. Return 1 otherwise, with `HR_TARGET_REFUSAL`
# one sentence naming the condition and the key or file, never a file's
# contents. Every record is read once — the registry's two keys in one `jq`
# call, under `hr_registry_peek`'s guards — and the registry is never created.
#
# Condition 3 is load-bearing: the runtime leaves a clone's `objects/info/`,
# `info/` and new top-level `.git` files sandbox-writable
# (`docs/sandbox-verification.md`, row CL5), so a sandboxed command could plant
# a `commondir` that redirects git's ref store, a `config.worktree` git layers
# over `.git/config`, or an `http-alternates` that borrows objects from a host.
hr_clone_target_check_var() {
  local main="${1-}" target="${2-}" refused="${3-}" gd hf head_line="" extra=""
  local branch="" registry kind wt wt_c want name alt alt_line="" alt_c main_obj
  local line="" tab=$'\t'
  gd="$target/.git"
  hf="$gd/HEAD"
  if [ -f "$hf" ] && [ ! -L "$hf" ] && [ -r "$hf" ]; then
    { IFS= read -r head_line || :; IFS= read -r extra || :; } <"$hf" 2>/dev/null
  fi
  if [ -z "$extra" ]; then
    case "$head_line" in
      'ref: refs/heads/'?*) branch=${head_line#ref: refs/heads/} ;;
    esac
  fi
  kind=""
  wt_c=""
  if [ -n "$branch" ] && registry=$(hr_state_path "$main" autonomous_logs/registry.json) \
    && [ -f "$registry" ] && [ -r "$registry" ] \
    && line=$(jq -r --arg b "$branch" '
      .runs[$b] | if type == "object"
        then [(.copy_kind // "" | tostring), (.worktree // "" | tostring)] | @tsv
        else error("absent") end
    ' "$registry" 2>/dev/null); then
    hr_tsv_unescape_var "${line%%"$tab"*}"
    kind=$HR_CFG_VALUE
    hr_tsv_unescape_var "${line#*"$tab"}"
    wt=$HR_CFG_VALUE
    if [ -n "$wt" ]; then
      wt_c=$(hr_canonical_path_nogit "$wt") || wt_c=""
    fi
  fi
  if [ "$kind" != clone ] || [ "$wt_c" != "$target" ]; then
    HR_TARGET_REFUSAL="$refused: its .git is not a regular pointer file, and the run registry records no clone of $main at that path"
    return 1
  fi

  want=$(hr_worktree_dir "$main" "$branch") && want=$(hr_canonical_path_nogit "$want") || want=""
  if [ -z "$want" ] || [ "$want" != "$target" ]; then
    HR_TARGET_REFUSAL="'$target' is a clone the run registry records, but not at the path hr_worktree_dir derives from $main for the branch its HEAD names"
    return 1
  fi

  for name in commondir config.worktree objects/info/http-alternates; do
    if [ -e "$gd/$name" ] || [ -L "$gd/$name" ]; then
      HR_TARGET_REFUSAL="'$target' is a clone, but $gd/$name exists, and a clone the harness made has none"
      return 1
    fi
  done
  for name in objects objects/info; do
    if [ ! -d "$gd/$name" ] || [ -L "$gd/$name" ]; then
      HR_TARGET_REFUSAL="'$target' is a clone, but $gd/$name is not a real directory"
      return 1
    fi
  done

  alt="$gd/objects/info/alternates"
  alt_c=""
  if [ -f "$alt" ] && [ ! -L "$alt" ] && [ -r "$alt" ]; then
    extra=""
    { IFS= read -r alt_line || :; IFS= read -r extra || :; } <"$alt" 2>/dev/null
    if [ -n "$alt_line" ] && [ -z "$extra" ]; then
      case "$alt_line" in /*) ;; *) alt_line="$gd/objects/$alt_line" ;; esac
      alt_c=$(hr_canonical_path_nogit "$alt_line") || alt_c=""
    fi
  fi
  main_obj=$(hr_canonical_path_nogit "$main/.git/objects") || main_obj=""
  if [ -z "$alt_c" ] || [ -z "$main_obj" ] || [ "$alt_c" != "$main_obj" ]; then
    HR_TARGET_REFUSAL="'$target' is a clone, but $alt is not a regular file holding one line naming $main/.git/objects"
    return 1
  fi

  if ! hr_clone_config_check_var "$main" "$target"; then
    HR_TARGET_REFUSAL=$HR_CLONE_CONFIG_REFUSAL
    return 1
  fi
  HR_TARGET_GITDIR=$gd
  HR_TARGET_KIND=clone
  HR_TARGET_BRANCH=$branch
  return 0
}

# Set `HR_WRAPPER_BRANCH` to the branch the checkout whose canonical gitdir is
# <gitdir> has out, asked of the main checkout <main> alone, for the
# unsandboxed wrappers after `hr_wrapper_target_check_var` set <gitdir>.
# Return 1, the variable empty, on a detached or unreadable HEAD and on a name
# that is not a valid branch name. Prints nothing; call it directly, never
# inside `$(…)`.
#
# The main checkout's own HEAD is `HEAD` there; a worktree's is
# `worktrees/<name>/HEAD`, which git resolves from the main repository without
# reading that worktree's `.git` pointer, its record's `commondir` or its
# `config.worktree`. The wrapper reads the branch once and names it as
# `refs/heads/<branch>` in every later call, so a HEAD rewritten afterwards
# changes nothing it does. A name starting with `-` is returned, not refused:
# each wrapper refuses it under its own exit contract.
#
# A clone's branch is `HR_TARGET_BRANCH`, taken when `HR_TARGET_KIND` is
# `clone` and <gitdir> is `HR_TARGET_GITDIR`: the target check already read
# the clone's `HEAD`, and reading it again would break the read-once rule.
hr_wrapper_branch_var() {
  local main="${1-}" gitdir="${2-}" head ref
  HR_WRAPPER_BRANCH=""
  [ -n "$main" ] && [ -n "$gitdir" ] || return 1
  if [ "${HR_TARGET_KIND-}" = clone ] && [ "$gitdir" = "${HR_TARGET_GITDIR-}" ]; then
    [ -n "${HR_TARGET_BRANCH-}" ] || return 1
    ref="refs/heads/$HR_TARGET_BRANCH"
  else
    if [ "$gitdir" = "$main/.git" ]; then
      head=HEAD
    else
      case "$gitdir" in
        "$main/.git/worktrees/"?*) head="worktrees/${gitdir##*/}/HEAD" ;;
        *) return 1 ;;
      esac
    fi
    ref=$(git -C "$main" symbolic-ref -q "$head" 2>/dev/null) || return 1
  fi
  case "$ref" in
    refs/heads/?*) ;;
    *) return 1 ;;
  esac
  case "$ref" in
    refs/heads/-*) ;;
    *) git -C "$main" check-ref-format "$ref" >/dev/null 2>&1 || return 1 ;;
  esac
  HR_WRAPPER_BRANCH=${ref#refs/heads/}
  return 0
}

# Print which run copy the gitdir <gitdir> of the main checkout <main> is:
# `main` for `<main>/.git`, `worktree` for a path directly under
# `<main>/.git/worktrees/`, `clone` otherwise. Purely lexical: call it only on
# a gitdir `hr_wrapper_target_check_var` has already accepted.
hr_copy_kind() {
  local main="${1-}" gitdir="${2-}" rest
  [ -n "$main" ] && [ -n "$gitdir" ] || return 1
  if [ "$gitdir" = "$main/.git" ]; then
    printf 'main\n'
    return 0
  fi
  case "$gitdir" in
    "$main/.git/worktrees/"?*)
      rest=${gitdir#"$main/.git/worktrees/"}
      case "$rest" in
        */*) ;;
        *) printf 'worktree\n'; return 0 ;;
      esac
      ;;
  esac
  printf 'clone\n'
}

# Return 0 when the main checkout <main>'s own `.git/config` names a URL for
# the remote <remote>; return 1 otherwise. Read with `git -C / config --file`,
# which loads no repository's configuration.
#
# git reads a remote whose configuration names no URL from the legacy
# `<main>/.git/remotes/<remote>` or `<main>/.git/branches/<remote>` instead, and
# a sandboxed command can write both directories. A push or fetch to a path
# named there would run that repository's hooks — its `pre-receive`, say — with
# the unsandboxed wrapper's reach. Requiring the URL in the write-protected
# `.git/config` means git never consults those files. The permission profile
# write-protects them too.
hr_remote_url_configured() {
  local main="${1-}" remote="${2-}" url
  [ -n "$main" ] && [ -n "$remote" ] || return 1
  url=$(git -C / config --file "$main/.git/config" --get "remote.$remote.url" 2>/dev/null) || return 1
  [ -n "$url" ]
}

# Print the per-working-copy configuration file of the checkout at <top>:
# `<gitdir>/config.worktree` (`<top>/.git/config.worktree` for the main
# checkout). Return 1 when `hr_gitdir_nogit` fails. Whether the file exists is
# the caller's question.
hr_worktree_config_file() {
  local gd
  gd=$(hr_gitdir_nogit "${1-}") || return 1
  printf '%s\n' "$gd/config.worktree"
}

# Print the `core.hooksPath` value `setup-worktree.sh` writes into the checkout
# at <top>: `<top>/<githooksDir>`. The writer and `hr_worktree_config_check_var`
# both take it from here, so they cannot drift. Return 1 when `githooksDir`
# cannot be read from `<top>/harness.config.json`.
hr_worktree_hooks_path() {
  local top="${1-}" rel
  [ -n "$top" ] || return 1
  rel=$(hr_githooks_dir "$top") || return 1
  printf '%s\n' "$top/$rel"
}

# Judge the per-working-copy configuration of the checkout at <top>. Return 0
# when `hr_worktree_config_file` names no file, an empty one, or one holding
# exactly one entry, `core.hooksPath`, equal to `hr_worktree_hooks_path <top>`;
# return 1 otherwise — including a file git cannot parse — with
# `HR_WT_CONFIG_REFUSAL` set to one sentence naming each offending key, never a
# value. Prints nothing. Call it directly, never inside `$(…)`.
#
# The file is read with `git -C / config --file <f> --null --list`, one call; a
# trailing `hr-status=<n>` record carries git's exit status out of the process
# substitution, and no git key can begin with it (a section name holds no `=`).
# Key names are compared case-insensitively, as git compares section and
# variable names.
hr_worktree_config_check_var() {
  local top="${1-}" f entry name lname value has_value status="" nl
  local hooks_count=0 hooks_value="" hooks_has_value=0 offending="" parts="" expected
  HR_WT_CONFIG_REFUSAL=""
  nl='
'
  if ! f=$(hr_worktree_config_file "$top"); then
    HR_WT_CONFIG_REFUSAL="cannot locate the git directory of '$top', so its per-working-copy configuration cannot be checked"
    return 1
  fi
  [ -e "$f" ] || [ -L "$f" ] || return 0
  if [ ! -f "$f" ] || [ ! -r "$f" ]; then
    HR_WT_CONFIG_REFUSAL="$f is not a readable file, so this working copy's configuration is not trusted"
    return 1
  fi
  [ -s "$f" ] || return 0

  while IFS= read -r -d '' entry; do
    case "$entry" in
      hr-status=*)
        status=${entry#hr-status=}
        continue
        ;;
      *"$nl"*)
        name=${entry%%"$nl"*}
        value=${entry#*"$nl"}
        has_value=1
        ;;
      *)
        name=$entry
        value=""
        has_value=0
        ;;
    esac
    lname=$(printf '%s' "$name" | LC_ALL=C tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz')
    if [ "$lname" = core.hookspath ]; then
      hooks_count=$((hooks_count + 1))
      hooks_value=$value
      hooks_has_value=$has_value
    else
      case ", $offending, " in
        *", $name, "*) ;;
        *) offending="${offending:+$offending, }$name" ;;
      esac
    fi
  done < <(git -C / config --file "$f" --null --list 2>/dev/null; printf 'hr-status=%s\0' "$?")

  if [ "$status" != 0 ]; then
    HR_WT_CONFIG_REFUSAL="git cannot parse $f, so this working copy's configuration is not trusted"
    return 1
  fi
  [ -z "$offending" ] || parts="$f sets $offending, and only core.hooksPath may be set there"
  if [ "$hooks_count" -gt 1 ]; then
    parts="${parts:+$parts; }$f sets core.hooksPath more than once"
  elif [ "$hooks_count" -eq 1 ]; then
    expected=$(hr_worktree_hooks_path "$top") || expected=""
    if [ -z "$expected" ]; then
      parts="${parts:+$parts; }cannot resolve githooksDir from '$top/harness.config.json' to check the core.hooksPath in $f"
    elif [ "$hooks_has_value" -ne 1 ] || [ "$hooks_value" != "$expected" ]; then
      parts="${parts:+$parts; }$f sets core.hooksPath to something other than $expected, the value setup-worktree.sh writes"
    fi
  fi
  [ -n "$parts" ] || return 0
  HR_WT_CONFIG_REFUSAL="$parts; remove the file, then re-run setup-worktree.sh in that working copy"
  return 1
}

# THE CLONE CONFIGURATION ALLOW-LIST — one contract. `hr_clone_create_var`
# writes a clone's `.git/config` from exactly this set, and
# `setup-worktree.sh --target` adds only `core.hooksPath`; the check below
# holds a clone to it. Required keys: `core.repositoryformatversion`,
# `core.bare`, `remote.origin.fetch`, and `remote.origin.url` and
# `extensions.objectformat` whenever the spec lists them. Optional
# exact-value keys: the identity keys `hr_clone_identity_keys` prints
# (`user.name`, `user.email`), each whenever the spec lists it.
#
# WHY THE IDENTITY IS SAFE TO CARRY. Git writes `user.name` and `user.email`
# into a commit and never executes them. The spec lists each only at the exact
# value the main checkout's `.git/config` holds, so a session still cannot set
# its own author identity; and a session cannot write the clone's `.git/config`
# at all (`docs/sandbox-verification.md`, row CL5), so this check stays defence
# in depth. What the copy does not cover: the main checkout's file is read with
# `--file`, so an identity it sets only through `include` / `includeIf` is not
# seen, and the clone falls back to the global identity, as before the copy
# existed. The accepted cost: a main checkout whose `user.name` or `user.email`
# changes, or is unset, while a clone is live makes that clone's copy wrong, and
# the clone is refused until it is recreated.
#
# WHY NO SIGNING KEY. `user.signingkey`, `commit.gpgsign`, `gpg.format`,
# `gpg.program`, `gpg.<format>.program` and `gpg.ssh.defaultKeyCommand` are
# deliberately not listed. No harness commit is signed today, on either side:
# every one is written by `commit-tree` (`hr_commit_paths_var`,
# `refresh-branch.sh`), which never reads `commit.gpgsign` and is passed no
# `-S`. So the main-checkout wrappers' `git -C <main> commit-tree` writes
# unsigned commits under the main checkout's identity, and carrying the
# signing keys into a clone would sign nothing. Signing a run's commits needs
# an explicit `-S`. Whether a commit written with the clone as git's
# repository can be signed at all is unmeasured: that needs a program that
# reaches the signing key or agent socket from there. A signature that cannot
# be made fails the commit. If signing is ever carried, the program keys
# travel only as the main checkout's exact values, as a deliberate trust
# decision naming the main checkout's `.git/config` as the trusted source,
# never as a widened rule.
#
# `hr_clone_config_spec <main> <top>` prints one line per allowed key,
# `<lowercase key><TAB><rule>`, `<rule>` being `=<exact value>` or `bool`
# (`true` or `false`). `remote.origin.url` is listed, with the value the main
# checkout's `.git/config` names, only when it names one; so is each identity
# key, with the main checkout's value, only when its `.git/config` names a
# non-empty one; `extensions.objectformat` is listed, with the main checkout's
# value and `core.repositoryformatversion` `=1`, only when the main checkout's
# `.git/config` names one, and the version is `=0` otherwise; `core.hooksPath` is
# `<top>/<githooksDir>`, with `githooksDir` read from the MAIN checkout. Return
# 1, printing nothing, when `githooksDir` cannot be read or a value holds a
# newline the line format cannot carry.
hr_clone_config_spec() {
  local main="${1-}" top="${2-}" rel url fmt nl key value ids="" idv="" tab=$'\t'
  nl='
'
  [ -n "$main" ] && [ -n "$top" ] || return 1
  rel=$(hr_githooks_dir "$main") || return 1
  url=$(git -C / config --file "$main/.git/config" --get remote.origin.url 2>/dev/null) || url=""
  fmt=$(git -C / config --file "$main/.git/config" --get extensions.objectformat 2>/dev/null) || fmt=""
  for key in $(hr_clone_identity_keys); do
    value=$(git -C / config --file "$main/.git/config" --get "$key" 2>/dev/null) || continue
    [ -n "$value" ] || continue
    idv="$idv$value"
    ids="$ids$key$tab=$value$nl"
  done
  case "$top/$rel$url$fmt$idv" in *"$nl"*) return 1 ;; esac
  if [ -n "$fmt" ]; then
    printf 'core.repositoryformatversion\t=1\nextensions.objectformat\t=%s\n' "$fmt"
  else
    printf 'core.repositoryformatversion\t=0\n'
  fi
  printf '%s\t%s\n' \
    core.bare =false \
    core.logallrefupdates =true \
    core.filemode bool \
    core.ignorecase bool \
    core.precomposeunicode bool \
    core.symlinks bool \
    remote.origin.fetch '=+refs/heads/*:refs/remotes/origin/*' \
    core.hookspath "=$top/$rel"
  [ -z "$url" ] || printf 'remote.origin.url\t=%s\n' "$url"
  printf '%s' "$ids"
}

# Print the identity keys a clone mirrors from the main checkout, one per line:
# the one list `hr_clone_config_spec` and `hr_clone_create_var` both read.
hr_clone_identity_keys() {
  printf '%s\n' user.name user.email
}

# Set `HR_CLONE_RULE` to the rule <spec> (`hr_clone_config_spec`'s output)
# gives <key>; return 1, the variable empty, when <spec> lists no <key>.
hr_clone_spec_rule_var() {
  local spec="${1-}" key="${2-}" rest line nl tab=$'\t'
  nl='
'
  HR_CLONE_RULE=""
  rest="$spec$nl"
  while [ -n "$rest" ]; do
    line=${rest%%"$nl"*}
    rest=${rest#*"$nl"}
    if [ "${line%%"$tab"*}" = "$key" ]; then
      HR_CLONE_RULE=${line#*"$tab"}
      return 0
    fi
  done
  return 1
}

# `hr_clone_config_check_var <main> <top>` judges `<top>/.git/config` against
# `hr_clone_config_spec <main> <top>`. Return 0 only when every key is in the
# spec, appears once and passes its rule, and every required key is present;
# return 1 otherwise — including a file that is absent, not a regular file, a
# symbolic link, or one git cannot parse — with `HR_CLONE_CONFIG_REFUSAL` set to
# one sentence naming each offending, duplicated or missing key, never a value.
# Prints nothing. Call it directly, never inside `$(…)`. The identity keys are
# never required, so a clone made before they were mirrored still passes; one
# the clone sets where the spec lists none is refused as off the list.
#
# Read as `hr_worktree_config_check_var` reads its file: one
# `git -C / config --file <f> --null --list` call, a trailing `hr-status=<n>`
# record carrying git's exit status. Section and variable names are compared
# case-insensitively and a subsection name exactly, as git compares them, so
# `remote.ORIGIN.url` is not `remote.origin.url`.
hr_clone_config_check_var() {
  local main="${1-}" top="${2-}" f spec entry name lname key value has_value status="" nl
  local seen="" offending="" duplicated="" wrong="" missing="" parts="" req mid
  HR_CLONE_CONFIG_REFUSAL=""
  nl='
'
  f="$top/.git/config"
  if [ -L "$f" ] || [ ! -f "$f" ] || [ ! -r "$f" ]; then
    HR_CLONE_CONFIG_REFUSAL="$f is absent, not a readable regular file, or a symbolic link, so this clone's configuration is not trusted"
    return 1
  fi
  if ! spec=$(hr_clone_config_spec "$main" "$top"); then
    HR_CLONE_CONFIG_REFUSAL="cannot build the clone configuration allow-list from the main checkout $main, so $f is not trusted"
    return 1
  fi

  while IFS= read -r -d '' entry; do
    case "$entry" in
      hr-status=*)
        status=${entry#hr-status=}
        continue
        ;;
      *"$nl"*)
        name=${entry%%"$nl"*}
        value=${entry#*"$nl"}
        has_value=1
        ;;
      *)
        name=$entry
        value=""
        has_value=0
        ;;
    esac
    lname=$(printf '%s' "$name" | LC_ALL=C tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz')
    case "$name" in
      *.*.*)
        mid=${name#*.}
        mid=${mid%.*}
        key="${lname%%.*}.$mid.${lname##*.}"
        ;;
      *) key=$lname ;;
    esac
    case "$seen" in
      *"$nl$key$nl"*)
        case ", $duplicated, " in
          *", $name, "*) ;;
          *) duplicated="${duplicated:+$duplicated, }$name" ;;
        esac
        continue
        ;;
    esac
    seen="${seen:-$nl}$key$nl"
    if ! hr_clone_spec_rule_var "$spec" "$key"; then
      offending="${offending:+$offending, }$name"
      continue
    fi
    case "$HR_CLONE_RULE" in
      bool)
        case "$has_value:$value" in
          1:true | 1:false) ;;
          *) wrong="${wrong:+$wrong, }$name" ;;
        esac
        ;;
      =*)
        if [ "$has_value" -ne 1 ] || [ "$value" != "${HR_CLONE_RULE#=}" ]; then
          wrong="${wrong:+$wrong, }$name"
        fi
        ;;
    esac
  done < <(git -C / config --file "$f" --null --list 2>/dev/null; printf 'hr-status=%s\0' "$?")

  if [ "$status" != 0 ]; then
    HR_CLONE_CONFIG_REFUSAL="git cannot parse $f, so this clone's configuration is not trusted"
    return 1
  fi
  for req in core.repositoryformatversion extensions.objectformat core.bare remote.origin.fetch remote.origin.url; do
    if [ "$req" = remote.origin.url ] || [ "$req" = extensions.objectformat ]; then
      hr_clone_spec_rule_var "$spec" "$req" || continue
    fi
    case "$seen" in
      *"$nl$req$nl"*) ;;
      *) missing="${missing:+$missing, }$req" ;;
    esac
  done
  [ -z "$offending" ] || parts="$f sets $offending, which the clone allow-list does not hold"
  [ -z "$duplicated" ] || parts="${parts:+$parts; }$f sets $duplicated more than once"
  [ -z "$wrong" ] || parts="${parts:+$parts; }$f sets $wrong to a value the clone allow-list does not allow"
  [ -z "$missing" ] || parts="${parts:+$parts; }$f lacks $missing, which the clone allow-list requires"
  [ -n "$parts" ] || return 0
  HR_CLONE_CONFIG_REFUSAL="$parts, so this clone's configuration is not trusted"
  return 1
}

# Set `HR_PINNED_HOOKS_PATH` to the absolute hooks directory a wrapper pins
# `core.hooksPath` to for the checkout at <top>, and `HR_PINNED_HOOKS_REFUSAL`
# to '' or one refusal sentence. Prints nothing; call it directly, never inside
# `$(…)`, so both variables survive. Return 1 on any failure and on a directory
# outside the two below.
#
# The value is the MAIN repository's configured one — `core.hooksPath` from
# `<common>/config` (absolute as is, relative joined to `<main>`, unset giving
# `<common>/hooks`), with `<common>` from `hr_common_dir_nogit` and `<main>` its
# parent — never the worktree's, which the sandbox can write. It is accepted
# only when, compared canonically, it equals `<main>/<githooksDir>` (read from
# the MAIN checkout's `harness.config.json`) or `<common>/hooks`: the two
# directories the permission profile write-protects. A foreign hooks directory,
# such as one `init` left in place, is refused. The wrappers pass their own
# main checkout (`hr_wrapper_main_of`) as <top>, whatever their target, so the
# answer never rests on a worktree record's `commondir`, which the sandbox can
# rewrite after the target check has read it.
hr_pinned_hooks_path() {
  local top="${1-}" common main value status resolved rel allowed_cfg allowed_git
  HR_PINNED_HOOKS_PATH=""
  HR_PINNED_HOOKS_REFUSAL=""
  if ! common=$(hr_common_dir_nogit "$top"); then
    HR_PINNED_HOOKS_REFUSAL="cannot locate the main repository's .git directory from '$top', so the hooks directory to pin cannot be judged"
    return 1
  fi
  main=${common%/.git}
  [ -n "$main" ] || main=/

  value=$(git -C / config --file "$common/config" --path --get core.hooksPath 2>/dev/null)
  status=$?
  case "$status" in
    0) case "$value" in /*) resolved=$value ;; *) resolved="$main/$value" ;; esac ;;
    1) resolved="$common/hooks" ;;
    *)
      HR_PINNED_HOOKS_REFUSAL="git cannot read core.hooksPath from $common/config, so the hooks directory to pin cannot be judged"
      return 1
      ;;
  esac

  if ! rel=$(hr_githooks_dir "$main"); then
    HR_PINNED_HOOKS_REFUSAL="cannot resolve githooksDir from '$main/harness.config.json', so the hooks directory to pin cannot be judged"
    return 1
  fi
  if ! resolved=$(hr_canonical_path_nogit "$resolved"); then
    HR_PINNED_HOOKS_REFUSAL="cannot resolve the hooks directory core.hooksPath names in $common/config"
    return 1
  fi
  allowed_cfg=$(hr_canonical_path_nogit "$main/$rel") || allowed_cfg="$main/$rel"
  allowed_git=$(hr_canonical_path_nogit "$common/hooks") || allowed_git="$common/hooks"
  if [ "$resolved" = "$allowed_cfg" ] || [ "$resolved" = "$allowed_git" ]; then
    HR_PINNED_HOOKS_PATH=$resolved
    return 0
  fi
  HR_PINNED_HOOKS_REFUSAL="core.hooksPath in $common/config resolves to $resolved, which is neither $allowed_cfg (githooksDir) nor $allowed_git, the two hooks directories the permission profile write-protects; point core.hooksPath at githooksDir, or set githooksDir to that directory and re-run init so the profile protects it"
  return 1
}

# ---------------------------------------------------------------------------
# Configuration — one `jq` per process (see the cache note in the header), read
# at the resolved repository root and nowhere else.
# ---------------------------------------------------------------------------

# Set `HR_CFG_FILE` to the configuration path and return 0 when the repository
# has adopted the harness; return 1 (clearing it) when it has not. The variable
# form exists so the readers can run the jurisdiction test without a `$(…)`.
hr_config_file_var() {
  local root="${1-}" f
  HR_CFG_FILE=""
  [ -n "$root" ] || return 1
  f="${root%/}/harness.config.json"
  [ -f "$f" ] && [ -r "$f" ] || return 1
  HR_CFG_FILE="$f"
  return 0
}

# Print the configuration path when the repository has adopted the harness;
# return 1 (printing nothing) when it has not. This is the jurisdiction test —
# "no such file" and "a file this account may not read" are one answer here,
# and `hr_config_load` is what separates them.
hr_config_file() {
  hr_config_file_var "${1-}" || return 1
  printf '%s\n' "$HR_CFG_FILE"
}

# Drop the cache. A one-shot wrapper never needs this; the watcher calls it at
# the top of every tick, so an edit to `harness.config.json` is picked up
# without restarting the daemon.
hr_config_reset() {
  HR_CFG_PID=""
  HR_CFG_ROOT=""
  HR_CFG_STATE=""
  HR_CFG_FILE=""
  HR_CFG_SCALARS=""
  HR_CFG_LISTS=""
  HR_CFG_VALUE=""
}

# Reverse `@tsv`'s escaping into `HR_CFG_VALUE`. Left-to-right, one backslash at
# a time, so `\\t` decodes to a literal backslash followed by `t` rather than to
# a tab. Returns immediately on the overwhelmingly common backslash-free value.
hr_tsv_unescape_var() {
  local s="${1-}" out="" head c
  HR_CFG_VALUE="$s"
  case "$s" in *\\*) ;; *) return 0 ;; esac
  while :; do
    head=${s%%\\*}
    if [ "$head" = "$s" ]; then
      out="$out$s"
      break
    fi
    out="$out$head"
    s=${s#"$head"\\}
    c=${s%"${s#?}"}
    case "$c" in
      t) out="$out"$'\t' ;;
      n) out="$out
" ;;
      r) out="$out"$'\r' ;;
      \\) out="$out\\" ;;
      '') out="$out\\"; break ;;
      *) out="$out\\$c" ;;
    esac
    s=${s#?}
  done
  HR_CFG_VALUE="$out"
  return 0
}

# Load (or reuse) the parsed configuration for <root>.
#
#   0  loaded        — the document is present, parses as an object, and
#                      carries the required `defaultBranch`
#   1  not adopted   — there is no `harness.config.json` at <root>
#   2  unresolvable  — it is there and could not be turned into an answer:
#                      unreadable, absent or pre-1.5 `jq`, invalid JSON, more
#                      than one JSON document, not an object, or no
#                      `defaultBranch`
#
# THE 1/2 SPLIT IS THE POINT. "Not adopted" is a repository this script was
# never meant to run in; "unresolvable" is the repository it WAS meant to run in
# with a configuration it cannot read. Both are closed for a mutating caller,
# and they need different messages.
#
# A MEMO THIS PROCESS DID NOT WRITE IS IGNORED. `HR_CFG_*` are ordinary shell
# variables and a child inherits its parent's exported ones, so an inherited
# `HR_CFG_SCALARS` would otherwise be read as this repository's configuration
# and the file on disk never opened — an environment that dictates
# `defaultBranch` and `protectedBranches` would turn a refusal into a permit.
# The memo is stamped with `$$` and reused only when the stamp is this shell's
# own. `$$` is unchanged inside `$(…)` and `( )`, so the inherit-into-a-subshell
# property the warm-up rests on is untouched.
hr_config_load() {
  local root="${1-}" f out line tag rest nl tab
  [ -n "$root" ] || return 2

  if [ "${HR_CFG_PID-}" = "$$" ] && [ "${HR_CFG_ROOT-}" = "$root" ] && [ -n "${HR_CFG_STATE-}" ]; then
    case "${HR_CFG_STATE-}" in
      ok) return 0 ;;
      absent) return 1 ;;
      *) return 2 ;;
    esac
  fi

  hr_config_reset
  HR_CFG_PID=$$
  HR_CFG_ROOT="$root"

  f="${root%/}/harness.config.json"
  if [ ! -e "$f" ]; then
    HR_CFG_STATE="absent"
    return 1
  fi
  HR_CFG_STATE="bad"
  hr_config_file_var "$root" || return 2
  hr_have_jq || return 2

  # ONE `jq`, emitting `<tag>\t<key>\t<value>` per line through `@tsv`, which
  # escapes the only four characters that could break the format (tab, newline,
  # carriage return, backslash) and nothing else. `-n` plus `input` reads the
  # FIRST document and counting what is left is what refuses a `jq` stream,
  # which is not a valid `.json` file and which the schema cannot describe: a
  # per-key read would have applied its filter to every document and silently
  # unioned them. A key whose PARENT has the wrong type (`"commands": "x"`)
  # yields `null` for that key alone via `try … catch`, so one key fails rather
  # than the document. `null`, the string `"null"` and `""` are not emitted at
  # all, so a reader reports them as "not set".
  #
  # `protectedBranches.present` records that the key was there AS AN ARRAY,
  # which is what lets an explicitly EMPTY list read as a configured set rather
  # than as an absent one.
  #
  # A `phases.*`, `docs.retrieval`, `execution.progressComments` or
  # `execution.keepAwake` value that is not a boolean is emitted as `invalid`, so
  # the string `"true"` — which `tostring` would otherwise make indistinguishable
  # from `true` — reaches `hr_phase_enabled`, `hr_docs_retrieval_applies`,
  # `hr_progress_comments` or `hr_keep_awake` as a value it refuses (2).
  #
  # `sandbox.optedOut` is a computed flag rather than the raw `reason`, because
  # `s()` drops `"null"` and `""` and the string `"null"` is a taken opt-out. Its
  # character class is JavaScript `trim`'s whitespace set: removing every such
  # character leaves something exactly when `trim()` does.
  out=$(jq -n -r '
    def s($k; $v):
      if $v == null then empty
      else ($v | tostring) as $t
        | if $t == "" or $t == "null" then empty else ["S", $k, $t] | @tsv end
      end;
    def l($k; $v):
      if ($v | type) == "array"
      then $v[] | ["L", $k, (if . == null then "null" else tostring end)] | @tsv
      else empty
      end;
    input as $doc
    | (reduce inputs as $extra (0; . + 1)) as $rest
    | if $rest > 0 then error("more than one JSON document") else $doc end
    | if type != "object" then error("not an object") else . end
    | s("projectName";           try .projectName          catch null),
      s("defaultBranch";         try .defaultBranch        catch null),
      s("stateDir";              try .stateDir             catch null),
      s("appDir";                try .appDir               catch null),
      s("scriptsDir";            try .scriptsDir           catch null),
      s("githooksDir";           try .githooksDir          catch null),
      s("agentModel";            try .agentModel           catch null),
      s("agentEffort";           try .agentEffort          catch null),
      s("pushEnvPath";           try .pushEnvPath          catch null),
      s("qa.credentialsPath";    try .qa.credentialsPath   catch null),
      s("commands.typecheck";    try .commands.typecheck   catch null),
      s("commands.test";         try .commands.test        catch null),
      s("commands.build";        try .commands.build       catch null),
      s("commands.devServer";    try .commands.devServer   catch null),
      s("commands.depInstall";   try .commands.depInstall  catch null),
      s("phases.parity";         try (.phases.parity | if type == "boolean" or . == null then . else "invalid" end) catch null),
      s("phases.qa";             try (.phases.qa     | if type == "boolean" or . == null then . else "invalid" end) catch null),
      s("phases.docs";           try (.phases.docs   | if type == "boolean" or . == null then . else "invalid" end) catch null),
      s("execution.target";      try .execution.target     catch null),
      s("execution.progressComments";
        try (.execution.progressComments | if type == "boolean" or . == null then . else "invalid" end) catch null),
      s("execution.keepAwake";
        try (.execution.keepAwake | if type == "boolean" or . == null then . else "invalid" end) catch null),
      s("docs.retrievalBackend"; try .docs.retrievalBackend catch null),
      s("docs.retrieval";        try (.docs.retrieval | if type == "boolean" or . == null then . else "invalid" end) catch null),
      s("forge";                 try .forge                catch null),
      s("sandbox.optedOut";
        try (.sandbox.optOut.reason
             | if type == "string" and (gsub("[\t\n\u000b\f\r    -     　﻿]"; "") != "")
               then "true" else null end) catch null),
      s("protectedBranches.present";
        try (if (.protectedBranches | type) == "array" then "1" else null end) catch null),
      l("protectedBranches";     try .protectedBranches    catch null)
  ' "$HR_CFG_FILE" 2>/dev/null) || return 2

  nl="
"
  tab=$'\t'
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    tag=${line%%"$tab"*}
    rest=${line#*"$tab"}
    case "$tag" in
      S) HR_CFG_SCALARS="$HR_CFG_SCALARS$nl$rest" ;;
      L) HR_CFG_LISTS="$HR_CFG_LISTS$nl$rest" ;;
    esac
  done <<EOF
$out
EOF
  HR_CFG_SCALARS="$HR_CFG_SCALARS$nl"
  HR_CFG_LISTS="$HR_CFG_LISTS$nl"

  # `defaultBranch` is required by the schema, so its absence is an
  # unresolvable configuration rather than a defaultable one — and defaulting it
  # here would put a remembered branch name into the protected set.
  hr_cfg_scalar_var "defaultBranch" || return 2
  [ -n "$HR_CFG_VALUE" ] || return 2

  HR_CFG_STATE="ok"
  return 0
}

# Set `HR_CFG_VALUE` to one cached scalar; return 1 when the key was not emitted
# (absent, `null`, `"null"` or empty). Lookup is a parameter expansion on
# `\n<key>\t`, which cannot false-match inside a value because a value carries
# no raw newline.
hr_cfg_scalar_var() {
  local key="${1-}" rest nl tab
  HR_CFG_VALUE=""
  [ -n "$key" ] || return 1
  nl="
"
  tab=$'\t'
  rest=${HR_CFG_SCALARS-}
  case "$rest" in
    *"$nl$key$tab"*) ;;
    *) return 1 ;;
  esac
  rest=${rest#*"$nl$key$tab"}
  rest=${rest%%"$nl"*}
  hr_tsv_unescape_var "$rest"
  [ -n "$HR_CFG_VALUE" ] || return 1
  return 0
}

# Set `HR_CFG_VALUE` to the cached list elements, newline-joined in document
# order; return 1 when the key emitted no element at all.
hr_cfg_list_var() {
  local key="${1-}" rest item out="" first=1 nl tab
  HR_CFG_VALUE=""
  [ -n "$key" ] || return 1
  nl="
"
  tab=$'\t'
  rest=${HR_CFG_LISTS-}
  while :; do
    case "$rest" in
      *"$nl$key$tab"*) ;;
      *) break ;;
    esac
    rest=${rest#*"$nl$key$tab"}
    item=${rest%%"$nl"*}
    hr_tsv_unescape_var "$item"
    if [ "$first" -eq 1 ]; then
      out="$HR_CFG_VALUE"
      first=0
    else
      out="$out
$HR_CFG_VALUE"
    fi
  done
  [ "$first" -eq 0 ] || return 1
  HR_CFG_VALUE="$out"
  return 0
}

# The shared body of every scalar reader: print the configured value, else the
# supplied schema default, else return 1. Returns 2 — printing nothing — when
# the configuration could not be read, whether because there is none or because
# the one there does not parse.
hr_config_scalar() {
  local root="${1-}" key="${2-}" default="${3-}"
  [ -n "$key" ] || return 1
  hr_config_load "$root" || return 2
  if hr_cfg_scalar_var "$key"; then
    printf '%s\n' "$HR_CFG_VALUE"
    return 0
  fi
  [ -n "$default" ] || return 1
  printf '%s\n' "$default"
  return 0
}

# The same for a repo-relative directory key, with trailing slashes stripped so
# a caller can join with `/`. The value stays repo-relative: joining it to the
# repository root is the caller's step (`hr_state_path` is the one exception,
# and it says so).
hr_config_dir() {
  local root="${1-}" key="${2-}" default="${3-}" value status
  value=$(hr_config_scalar "$root" "$key" "$default")
  status=$?
  [ "$status" -eq 0 ] || return "$status"
  while [ -n "$value" ] && [ "${value%/}" != "$value" ]; do value=${value%/}; done
  [ -n "$value" ] || value="$default"
  [ -n "$value" ] || return 1
  printf '%s\n' "$value"
}

# ---------------------------------------------------------------------------
# Typed readers. Each takes <repo_root> first, prints its value on stdout, and
# applies that key's schema default and nothing else. 0 = a value; 1 = the key
# is not set and has no default; 2 = the configuration is unresolvable.
#
# There is deliberately NO reader for `clientEnvPrefix`: it is review vocabulary
# (the prefix a build tool requires before exposing a variable to a client
# bundle), no shipped script consumes it, and a reader nothing calls is dead
# surface. The worktree bootstrap's machine-local env symlink derives from
# `appDir` and a file-existence test instead.
# ---------------------------------------------------------------------------

# `stateDir` — every run artifact's repo-relative home. Schema default
# `sdlc-harness/`, normalized here to carry no trailing slash.
hr_state_dir() {
  hr_config_dir "${1-}" stateDir "sdlc-harness"
}

# `scriptsDir` — where the generated wrappers, and this library, are written.
hr_scripts_dir() {
  hr_config_dir "${1-}" scriptsDir "scripts"
}

# `appDir` — the repo-relative directory the application lives in. It anchors
# where the application is; it is not a working directory.
hr_app_dir() {
  hr_config_dir "${1-}" appDir "."
}

# `githooksDir` — the committed git hooks the worktree bootstrap points
# `core.hooksPath` at.
hr_githooks_dir() {
  hr_config_dir "${1-}" githooksDir "githooks"
}

# `projectName` — the stem of worktree directory names and of generated service
# labels. Falls back to the repository directory's own name, which is what the
# CLI seeds when the key is unset.
hr_project_name() {
  local root="${1-}" value status
  value=$(hr_config_scalar "$root" projectName "")
  status=$?
  [ "$status" -ne 2 ] || return 2
  if [ "$status" -eq 0 ] && [ -n "$value" ]; then
    printf '%s\n' "$value"
    return 0
  fi
  hr_default_project_name "$root"
}

# `defaultBranch` — required, so this returns 2 rather than a remembered name
# when it is missing (`hr_config_load` has already refused such a document).
hr_default_branch() {
  hr_config_scalar "${1-}" defaultBranch ""
}

# `agentModel` — what the outer loop passes to a headless run.
hr_agent_model() {
  hr_config_scalar "${1-}" agentModel "opus"
}

# `agentEffort` — the reasoning-effort level the outer loop pins a headless run
# to. No schema default, so 1 means the adopter pinned none and the runtime
# applies its own per-model default; that is an ordinary project, not an error.
hr_agent_effort() {
  hr_config_scalar "${1-}" agentEffort ""
}

# `pushEnvPath` — repo-relative path to the gitignored push-notification
# settings. No schema default: 1 means the adopter configured none, which is an
# ordinary project and not an error.
hr_push_env_path() {
  hr_config_scalar "${1-}" pushEnvPath ""
}

# `qa.credentialsPath` — repo-relative path to the gitignored test-account
# credentials. No schema default, same as above.
hr_qa_creds_path() {
  hr_config_scalar "${1-}" "qa.credentialsPath" ""
}

# The `commands.*` key set, in one place so a key added to the schema reaches
# every caller. Set as a variable rather than printed: callers test membership.
hr_command_keys_var() {
  HR_CFG_COMMAND_KEYS='typecheck test build devServer depInstall'
}

# `commands.<key>` — the configured shell command for one verification or
# lifecycle step. 1 when that key is unset (a project with no build step is
# ordinary, and the caller prints one line and skips it) or when <key> is not
# one of the five; 2 when the configuration is unresolvable.
hr_command() {
  local root="${1-}" key="${2-}" known=1 candidate
  [ -n "$key" ] || return 1
  hr_command_keys_var
  for candidate in $HR_CFG_COMMAND_KEYS; do
    # An `if` rather than a bare `[ … ] && …`: a trailing AND-list that fails is
    # not in a `set -e`-exempt position, and a caller that sets `-e` would exit
    # on the ordinary non-matching key.
    if [ "$candidate" = "$key" ]; then known=0; fi
  done
  [ "$known" -eq 0 ] || return 1
  hr_config_scalar "$root" "commands.$key" ""
}

# `phases.<phase>` — whether one optional phase runs. THE ONE TYPED READER THAT
# PRINTS NOTHING: the answer is the status. 0 = `true`; 1 = `false` or unset (an
# unset flag is false, as the flow-progress ledger's `phases:` line records it);
# 2 = the configuration is unresolvable, <phase> is not `parity` / `qa` /
# `docs`, or the stored value is not a boolean — a value the schema forbids,
# which this refuses rather than guesses about.
hr_phase_enabled() {
  local root="${1-}" phase="${2-}"
  case "$phase" in
    parity|qa|docs) ;;
    *) return 2 ;;
  esac
  hr_config_load "$root" || return 2
  hr_cfg_scalar_var "phases.$phase" || return 1
  case "$HR_CFG_VALUE" in
    true) return 0 ;;
    false) return 1 ;;
  esac
  return 2
}

# `execution.target` — where an unattended run executes: `local` or
# `github-actions`. THE ONE READER OF THE KEY IN THIS FAMILY; a script that
# needs it calls this. Schema default `local`, so an absent key prints `local`
# and 1 is never returned. 2 — printing nothing — when the configuration is
# unresolvable or the stored value is outside the schema's enum, which this
# refuses rather than guesses about, as `hr_phase_enabled` does.
hr_execution_target() {
  local root="${1-}"
  hr_config_load "$root" || return 2
  if ! hr_cfg_scalar_var "execution.target"; then
    printf 'local\n'
    return 0
  fi
  case "$HR_CFG_VALUE" in
    local|github-actions)
      printf '%s\n' "$HR_CFG_VALUE"
      return 0
      ;;
  esac
  return 2
}

# `forge` — which code-hosting platform the flow integrates with: `github`,
# `gitlab` or `none`. THE ONE READER OF THE KEY IN THIS FAMILY, and the shell
# mirror of `cli/src/config/model.ts` → `FORGE_KINDS`: change the enum there and
# here together. 1 — printing nothing — when the key is absent: "not yet
# decided", which is not `none`, and the schema withholds a default on purpose.
# 2 — printing nothing — when the configuration is unresolvable or the value is
# outside the enum, a refusal rather than a guess.
hr_forge() {
  local root="${1-}"
  hr_config_load "$root" || return 2
  hr_cfg_scalar_var "forge" || return 1
  case "$HR_CFG_VALUE" in
    github|gitlab|none)
      printf '%s\n' "$HR_CFG_VALUE"
      return 0
      ;;
  esac
  return 2
}

# `execution.progressComments` — whether a remote run keeps its progress
# comment on the pull request. THE ONE READER OF THE KEY IN THIS FAMILY; a
# script that needs it calls this. PRINTS NOTHING: the answer is the status, as
# `hr_phase_enabled`'s is, except that an absent key is the schema default
# `true`. 0 = `true` or absent; 1 = `false`; 2 = the configuration is
# unresolvable or the value is not a boolean — refused rather than guessed about.
hr_progress_comments() {
  local root="${1-}"
  hr_config_load "$root" || return 2
  hr_cfg_scalar_var "execution.progressComments" || return 0
  case "$HR_CFG_VALUE" in
    true) return 0 ;;
    false) return 1 ;;
  esac
  return 2
}

# `execution.keepAwake` — whether a run the local watcher launches holds this
# host awake for its engine's life. THE ONE READER OF THE KEY IN THIS FAMILY,
# and the shell mirror of `cli/src/config/model.ts` → `keepAwakeEnabled`.
# PRINTS NOTHING: 0 = `true` or absent (the schema default); 1 = `false`; 2 =
# the configuration is unresolvable or the value is not a boolean. The watcher
# passes the MAIN checkout, never a run copy, whose `harness.config.json` the
# sandbox can rewrite.
hr_keep_awake() {
  local root="${1-}"
  hr_config_load "$root" || return 2
  hr_cfg_scalar_var "execution.keepAwake" || return 0
  case "$HR_CFG_VALUE" in
    true) return 0 ;;
    false) return 1 ;;
  esac
  return 2
}

# ---------------------------------------------------------------------------
# The sandbox: the opt-out, and whether this host has a definite missing piece.
# Mirrors of `sandboxOptedOut`, `sandboxPrerequisites.ts` and `probeSandboxHost`;
# see the header. Every function here only reads.
# ---------------------------------------------------------------------------

# `sandbox.optOut` — 0 when the opt-out is taken (a `reason` that is a string
# and not blank); 1 otherwise. The caller passes the MAIN checkout, never a run
# copy, whose `harness.config.json` the sandbox can rewrite. Every non-0 answer,
# including every `hr_config_load` failure — an absent, unparsable or
# multi-document file, or a missing `defaultBranch` — means NOT opted out, so a
# refusal that rests on it stands.
hr_sandbox_opted_out() {
  local root="${1-}"
  hr_config_load "$root" || return 1
  hr_cfg_scalar_var "sandbox.optedOut" || return 1
  [ "$HR_CFG_VALUE" = "true" ] || return 1
  return 0
}

# Classify a host from <uname_s> <uname_r> into `HR_HOST_KIND`: `macos`,
# `linux`, `wsl2`, `wsl1` or `unsupported`. Always 0. The shell mirror of
# `cli/src/doctor/sandboxPrerequisites.ts` → `sandboxHostKind`, and the one WSL
# detection in this file: the sandbox judge and the keep-awake probe both call it.
hr_host_kind_var() {
  local uname_s="${1-}" uname_r="${2-}"
  HR_HOST_KIND=""
  case "$uname_s" in
    Darwin) HR_HOST_KIND="macos" ;;
    Linux)
      case "$uname_r" in
        *[Mm][Ii][Cc][Rr][Oo][Ss][Oo][Ff][Tt]*)
          case "$uname_r" in
            *[Mm][Ii][Cc][Rr][Oo][Ss][Oo][Ff][Tt]-[Ss][Tt][Aa][Nn][Dd][Aa][Rr][Dd]*|*[Ww][Ss][Ll]2*)
              HR_HOST_KIND="wsl2" ;;
            *) HR_HOST_KIND="wsl1" ;;
          esac
          ;;
        *) HR_HOST_KIND="linux" ;;
      esac
      ;;
    *) HR_HOST_KIND="unsupported" ;;
  esac
  return 0
}

# Judge a host's facts: <uname_s> <uname_r> <bwrap> <socat>, each binary `1`
# when it resolves and `0` when it does not. Pure and bash-3.2-safe. Sets
# `HR_SANDBOX_HOST` (`macos`, `linux`, `wsl2`, `wsl1`, `unsupported`),
# `HR_SANDBOX_MISSING` (space-separated ids in the owner's order: `bwrap`,
# `socat`, `wsl1`, `unsupported-platform`) and `HR_SANDBOX_REFUSAL` (one line
# naming each missing piece and its fix, never the opt-out). 0 when nothing is
# missing; 1 otherwise.
hr_sandbox_prereq_judge_var() {
  local uname_s="${1-}" uname_r="${2-}" have_bwrap="${3-0}" have_socat="${4-0}" packages="" named=""
  HR_SANDBOX_HOST=""
  HR_SANDBOX_MISSING=""
  HR_SANDBOX_REFUSAL=""
  hr_host_kind_var "$uname_s" "$uname_r"
  HR_SANDBOX_HOST="$HR_HOST_KIND"
  case "$HR_SANDBOX_HOST" in
    unsupported)
      HR_SANDBOX_MISSING="unsupported-platform"
      HR_SANDBOX_REFUSAL='The sandbox does not run on platform `'"$uname_s"'`; it runs on macOS, Linux and WSL2.'
      return 1
      ;;
    wsl1)
      HR_SANDBOX_MISSING="wsl1"
      HR_SANDBOX_REFUSAL='This is a WSL1 host (kernel release `'"$uname_r"'`), where the agent CLI refuses with "Sandboxing requires WSL2"; run the harness under WSL2.'
      return 1
      ;;
    macos) return 0 ;;
  esac
  if [ "$have_bwrap" != "1" ]; then
    HR_SANDBOX_MISSING="bwrap"
    packages="bubblewrap"
    named='`bwrap` (package `bubblewrap`)'
  fi
  if [ "$have_socat" != "1" ]; then
    HR_SANDBOX_MISSING="${HR_SANDBOX_MISSING:+$HR_SANDBOX_MISSING }socat"
    packages="${packages:+$packages }socat"
    named="${named:+$named and }"'`socat` (package `socat`)'
  fi
  [ -n "$HR_SANDBOX_MISSING" ] || return 0
  HR_SANDBOX_REFUSAL='The sandbox needs '"$named"' on PATH; install with `sudo apt-get install '"$packages"'` (Ubuntu/Debian) or `sudo dnf install '"$packages"'` (Fedora).'
  return 1
}

# Probe this host for the judge: `uname -s`, `uname -r`, and `command -v bwrap`
# / `command -v socat` against the caller's `PATH`; returns the judge's status.
# A `uname` that fails is no definite answer: the three variables are cleared and
# this returns 0, leaving the run to the agent CLI's `failIfUnavailable`.
hr_sandbox_prereq_probe_var() {
  local uname_s uname_r have_bwrap=0 have_socat=0
  HR_SANDBOX_HOST=""
  HR_SANDBOX_MISSING=""
  HR_SANDBOX_REFUSAL=""
  uname_s=$(uname -s 2>/dev/null) || return 0
  [ -n "$uname_s" ] || return 0
  uname_r=$(uname -r 2>/dev/null) || return 0
  if command -v bwrap >/dev/null 2>&1; then have_bwrap=1; fi
  if command -v socat >/dev/null 2>&1; then have_socat=1; fi
  hr_sandbox_prereq_judge_var "$uname_s" "$uname_r" "$have_bwrap" "$have_socat"
}

# ---------------------------------------------------------------------------
# KEEP AWAKE — which sleep hold a launch takes, whether this host is on mains
# power, and the holder itself. Every function here sets variables or answers
# through its status and logs nothing; the caller owns every line logged and
# every registry field.
#
# THE HOLD WAITS ON ONE PID AND ENDS WITH IT, so it can never outlive the run:
# `caffeinate -w <pid>` exits when that pid does, and the logind holder's
# command is a loop that exits when `kill -0 <pid>` first fails, releasing the
# lock with it.
#
# EVERY HOLDER'S STDIO IS DETACHED (`</dev/null >/dev/null 2>&1`), so a holder
# can never keep the launch pipe open after the engine has exited.
#
# `-s` IS AC-ONLY, by `man caffeinate`, so the macOS hold takes no power probe:
# on battery its system-sleep assertion lapses by itself.
#
# BOTH LOGIND LOCK KINDS ARE NEEDED. `sleep` alone does not stop a lid close
# where `LidSwitchIgnoreInhibited=yes` (`man logind.conf`), which makes a closed
# lid ignore a plain `sleep` lock; `handle-lid-switch` is the lock that covers
# it. `hr_on_mains_power` gates the Linux hold so a laptop on battery still
# sleeps on a closed lid.
#
# THE WAITER IS A POSIX LOOP, NOT GNU `tail --pid`, because the same code runs
# under macOS's BSD userland in tests.
#
# A REFUSED LOCK IS NEVER RETRIED HERE. A probe that exits non-zero — logind not
# answering inside `timeout 10`, or polkit refusing the lock — is `refused`, and
# whether to try again is the caller's.
#
# `HR_KEEP_AWAKE_WHO` and `HR_KEEP_AWAKE_WHAT` mirror `KEEP_AWAKE_WHO` and
# `KEEP_AWAKE_WHAT` in `cli/src/doctor/keepAwake.ts`; a change to either is an
# edit there.
# ---------------------------------------------------------------------------

HR_KEEP_AWAKE_WHO='autonomous-sdlc-harness'
HR_KEEP_AWAKE_WHAT='sleep:handle-lid-switch'

# Probe this host for the keep-awake decision. Sets `HR_KEEP_AWAKE_HOST` (an
# `HR_HOST_KIND` value; `unsupported` when `uname -s` or `uname -r` fails) and
# `HR_KEEP_AWAKE_TOOL`: `caffeinate` on `macos` when it resolves on `PATH`,
# `systemd-inhibit` on `linux` when it resolves, empty otherwise. `wsl2` gets no
# tool on purpose: nothing inside WSL can hold Windows awake. Always 0. THE SEAM
# TESTS OVERRIDE, as they override `hr_sandbox_prereq_probe_var`.
hr_keep_awake_probe_var() {
  local uname_s uname_r
  HR_KEEP_AWAKE_HOST="unsupported"
  HR_KEEP_AWAKE_TOOL=""
  uname_s=$(uname -s 2>/dev/null) || return 0
  uname_r=$(uname -r 2>/dev/null) || return 0
  hr_host_kind_var "$uname_s" "$uname_r"
  HR_KEEP_AWAKE_HOST="$HR_HOST_KIND"
  case "$HR_KEEP_AWAKE_HOST" in
    macos)
      if command -v caffeinate >/dev/null 2>&1; then HR_KEEP_AWAKE_TOOL="caffeinate"; fi
      ;;
    linux)
      if command -v systemd-inhibit >/dev/null 2>&1; then HR_KEEP_AWAKE_TOOL="systemd-inhibit"; fi
      ;;
  esac
  return 0
}

# Answer whether this host's sandbox is bubblewrap: `HR_PLACEHOLDER_HOST` is `1`
# on `linux` and `wsl2`, `0` otherwise, including when `uname -s` or `uname -r`
# fails. Bubblewrap enforces a `denyWrite` entry for an absent path by planting a
# placeholder there, which a killed session can leave on disk; Seatbelt plants
# nothing (`docs/sandbox-verification.md` → §5 F9). Always 0. THE SEAM TESTS
# OVERRIDE, as they override `hr_keep_awake_probe_var`.
hr_placeholder_host_probe_var() {
  local uname_s uname_r
  HR_PLACEHOLDER_HOST=0
  uname_s=$(uname -s 2>/dev/null) || return 0
  uname_r=$(uname -r 2>/dev/null) || return 0
  hr_host_kind_var "$uname_s" "$uname_r"
  case "$HR_HOST_KIND" in
    linux | wsl2) HR_PLACEHOLDER_HOST=1 ;;
  esac
  return 0
}

# Decide which hold a launch takes: <repo_root> (the MAIN checkout) and
# <job_mode> (`1` inside a GitHub Actions job). Sets `HR_KEEP_AWAKE_MODE`
# (`caffeinate`, `logind` or `off`), `HR_KEEP_AWAKE_REASON` (empty when
# holding) and `HR_KEEP_AWAKE_QUIET` (`1` when an `off` needs no per-launch
# line, else empty). First match wins; the reason strings are matched byte for
# byte by the watcher's tests. Always 0.
hr_keep_awake_mode_var() {
  local root="${1-}" job_mode="${2-}" rc=0
  HR_KEEP_AWAKE_MODE="off"
  HR_KEEP_AWAKE_REASON=""
  HR_KEEP_AWAKE_QUIET=""
  if [ "$job_mode" = "1" ]; then
    HR_KEEP_AWAKE_QUIET="1"
    HR_KEEP_AWAKE_REASON='job mode — a GitHub Actions runner does not sleep'
    return 0
  fi
  if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
    HR_KEEP_AWAKE_QUIET="1"
    HR_KEEP_AWAKE_REASON='GITHUB_ACTIONS is true — a GitHub Actions runner does not sleep'
    return 0
  fi
  if ! hr_config_load "$root"; then
    HR_KEEP_AWAKE_REASON='harness.config.json could not be read'
    return 0
  fi
  hr_keep_awake "$root" || rc=$?
  case "$rc" in
    1)
      HR_KEEP_AWAKE_QUIET="1"
      HR_KEEP_AWAKE_REASON='execution.keepAwake is false'
      return 0
      ;;
    2)
      HR_KEEP_AWAKE_REASON='execution.keepAwake is not a boolean'
      return 0
      ;;
  esac
  hr_keep_awake_probe_var
  case "${HR_KEEP_AWAKE_HOST-}" in
    macos)
      if [ "${HR_KEEP_AWAKE_TOOL-}" = "caffeinate" ]; then
        HR_KEEP_AWAKE_MODE="caffeinate"
      else
        HR_KEEP_AWAKE_REASON='caffeinate does not resolve on PATH'
      fi
      ;;
    linux)
      if [ "${HR_KEEP_AWAKE_TOOL-}" = "systemd-inhibit" ]; then
        HR_KEEP_AWAKE_MODE="logind"
      else
        HR_KEEP_AWAKE_REASON='systemd-inhibit does not resolve on PATH'
      fi
      ;;
    wsl2)
      HR_KEEP_AWAKE_REASON="WSL2 — nothing inside WSL can keep Windows awake; set the Windows power plan's lid action to Do nothing on AC (#160 feat_wsl2_support)"
      ;;
    *)
      HR_KEEP_AWAKE_QUIET="1"
      HR_KEEP_AWAKE_REASON='no sleep hold on this platform'
      ;;
  esac
  return 0
}

# 0 when this host is on mains power, 1 on battery. Walks the entries of
# `${HR_POWER_SUPPLY_DIR:-/sys/class/power_supply}/*/` and reads no other file.
# `HR_POWER_SUPPLY_DIR` is a test seam; nothing in a shipped script sets it. An
# entry is COUNTED only when its `type` reads, trimmed, `Mains`, `USB` or
# `USB_*` (older kernels report USB chargers that way); its `scope` is absent or
# not `Device`; and its `online` file is readable. An entry with no `type` file
# is skipped, and so is every `scope` = `Device` supply — a wireless mouse's
# `hidpp_battery_*` reports `online` = `1` while connected and must never read
# as mains on a laptop on battery. Any counted entry whose trimmed `online` is
# `1` → 0; counted entries with none at `1` → 1; no counted entry → 0, because a
# desktop or server with no mains-class entry is on AC. A literal unmatched glob
# is skipped, never read.
hr_on_mains_power() {
  local dir="${HR_POWER_SUPPLY_DIR:-/sys/class/power_supply}" entry kind scope online counted=0
  for entry in "$dir"/*/; do
    [ -d "$entry" ] || continue
    [ -f "${entry}type" ] || continue
    kind=""
    IFS=$' \t\n' read -r kind 2>/dev/null <"${entry}type" || :
    case "$kind" in
      Mains|USB|USB_*) ;;
      *) continue ;;
    esac
    if [ -f "${entry}scope" ]; then
      scope=""
      IFS=$' \t\n' read -r scope 2>/dev/null <"${entry}scope" || :
      [ "$scope" != "Device" ] || continue
    fi
    [ -r "${entry}online" ] || continue
    counted=1
    online=""
    IFS=$' \t\n' read -r online 2>/dev/null <"${entry}online" || :
    [ "$online" != "1" ] || return 0
  done
  [ "$counted" = "1" ] && return 1
  return 0
}

# Start the hold for one pid: <mode> (`caffeinate` or `logind`, from
# `hr_keep_awake_mode_var`), <pid> (the engine's) and <branch> (named in the
# logind lock's `--why`). Sets `HR_KEEP_AWAKE_STATE` (`held`, `battery`,
# `refused` or `failed`), `HR_KEEP_AWAKE_PID` (the holder's pid when `held`,
# else empty) and `HR_KEEP_AWAKE_DETAIL` (one line when not `held`). 0 only when
# `held`. The rules it relies on are the KEEP AWAKE block above.
hr_keep_awake_hold_var() {
  local mode="${1-}" pid="${2-}" branch="${3-}" rc=0
  HR_KEEP_AWAKE_STATE=""
  HR_KEEP_AWAKE_PID=""
  HR_KEEP_AWAKE_DETAIL=""
  case "$mode" in
    caffeinate|logind) ;;
    *)
      HR_KEEP_AWAKE_STATE="failed"
      HR_KEEP_AWAKE_DETAIL="no hold for mode '$mode'"
      return 1
      ;;
  esac
  case "$pid" in
    ''|*[!0-9]*)
      HR_KEEP_AWAKE_STATE="failed"
      HR_KEEP_AWAKE_DETAIL="no engine pid"
      return 1
      ;;
  esac
  if [ "$mode" = "caffeinate" ]; then
    caffeinate -s -i -w "$pid" </dev/null >/dev/null 2>&1 &
    HR_KEEP_AWAKE_PID=$!
    HR_KEEP_AWAKE_STATE="held"
    return 0
  fi
  if ! hr_on_mains_power; then
    HR_KEEP_AWAKE_STATE="battery"
    HR_KEEP_AWAKE_DETAIL="on battery power"
    return 1
  fi
  if command -v timeout >/dev/null 2>&1; then
    timeout 10 systemd-inhibit --what="$HR_KEEP_AWAKE_WHAT" --mode=block --who="$HR_KEEP_AWAKE_WHO" --why="run $branch" true </dev/null >/dev/null 2>&1 || rc=$?
  else
    systemd-inhibit --what="$HR_KEEP_AWAKE_WHAT" --mode=block --who="$HR_KEEP_AWAKE_WHO" --why="run $branch" true </dev/null >/dev/null 2>&1 || rc=$?
  fi
  if [ "$rc" != "0" ]; then
    HR_KEEP_AWAKE_STATE="refused"
    HR_KEEP_AWAKE_DETAIL="systemd-inhibit exited $rc — logind did not answer, or polkit refused the lock"
    return 1
  fi
  systemd-inhibit --what="$HR_KEEP_AWAKE_WHAT" --mode=block --who="$HR_KEEP_AWAKE_WHO" --why="run $branch" \
    sh -c 'while kill -0 "$1" 2>/dev/null; do sleep 1; done' keep-awake-wait "$pid" </dev/null >/dev/null 2>&1 &
  HR_KEEP_AWAKE_PID=$!
  HR_KEEP_AWAKE_STATE="held"
  return 0
}

# ---------------------------------------------------------------------------
# The flow-progress ledger — which of a run's four main phases it records as
# through. A mirror of the plugin's ledger templates; see the header.
# ---------------------------------------------------------------------------

# 0 when every id after <settled> appears in <settled>, a space-delimited list
# with a leading and trailing space; 1 otherwise.
hr_ledger_all_settled() {
  local settled="${1-}" id
  shift
  for id in "$@"; do
    case "$settled" in
      *" $id "*) ;;
      *) return 1 ;;
    esac
  done
  return 0
}

# Print `<engine> <round> <phase1> <phase2> <phase3> <phase4>` for the ledger at
# <ledger_file> and return 0 — `<engine>` is `task` or `user_review`, `<round>`
# the header's round or `-` for the task engine, each phase `done` or `pending`.
# Return 1, printing nothing, when the file is missing or unreadable or its first
# line is not a task-engine or user-review-engine header: any other ledger has
# no phases to report.
#
# A phase is `done` when every id of its set is `[x]` or `[-]` (skipped before
# the run began). An id absent from the file is NOT settled, so a malformed
# ledger reads as `pending`, never as `done`. Phase 3 groups every end-of-branch
# review with its fixes, QA and the run gates.
hr_ledger_phases() {
  local file="${1-}" line first=1 engine="" round="-" settled=" " rest id
  local p1 p2 p3 p4 s1 s2 s3 s4
  [ -n "$file" ] && [ -f "$file" ] && [ -r "$file" ] || return 1
  while IFS= read -r line || [ -n "$line" ]; do
    if [ "$first" -eq 1 ]; then
      first=0
      case "$line" in
        *"(engine: task)"*)
          engine="task"
          ;;
        *"(engine: user_review, round "*")"*)
          engine="user_review"
          round=${line#*"(engine: user_review, round "}
          round=${round%%")"*}
          case "$round" in
            ''|*[!0-9]*) return 1 ;;
          esac
          ;;
        *) return 1 ;;
      esac
      continue
    fi
    case "$line" in
      "- [x] "*|"- [-] "*) ;;
      *) continue ;;
    esac
    rest=${line#"- ["?"] "}
    id=${rest%% *}
    id=${id%.}
    if [ -n "$id" ]; then settled="$settled$id "; fi
  done < "$file"
  [ -n "$engine" ] || return 1

  if [ "$engine" = "task" ]; then
    p1="P1 P2 P3"
    p2="A"
    p3="A1.5g A1.5f A2g A2f Bg Bm C C2g C2m C2f E G"
    p4="D"
  else
    p1="R1 R2"
    p2="R3"
    p3="R4 RG"
    p4="R5"
  fi
  # Unquoted on purpose: each set is a fixed list of space-free ids.
  if hr_ledger_all_settled "$settled" $p1; then s1="done"; else s1="pending"; fi
  if hr_ledger_all_settled "$settled" $p2; then s2="done"; else s2="pending"; fi
  if hr_ledger_all_settled "$settled" $p3; then s3="done"; else s3="pending"; fi
  if hr_ledger_all_settled "$settled" $p4; then s4="done"; else s4="pending"; fi
  printf '%s %s %s %s %s %s\n' "$engine" "$round" "$s1" "$s2" "$s3" "$s4"
  return 0
}

# Whether the docs phase's retrieval step runs: `phases.docs` and
# `docs.retrieval` both `true`. The shell mirror of `cli/src/config/model.ts` →
# `retrievalApplies`: change the predicate there and here together. PRINTS
# NOTHING: the answer is the status, as `hr_phase_enabled`'s is. 0 = both
# `true`; 1 = either `false` or unset; 2 = the configuration is unresolvable or
# either value is not a boolean — refused rather than guessed about.
hr_docs_retrieval_applies() {
  local root="${1-}" status
  hr_phase_enabled "$root" docs
  status=$?
  [ "$status" -eq 0 ] || return "$status"
  hr_cfg_scalar_var "docs.retrieval" || return 1
  case "$HR_CFG_VALUE" in
    true) return 0 ;;
    false) return 1 ;;
  esac
  return 2
}

# `docs.retrievalBackend` — which runtime the docs-retrieval index uses:
# `typescript` or `python`. THE ONE READER OF THE KEY IN THIS FAMILY, and the
# shell mirror of `cli/src/config/model.ts` → `RETRIEVAL_BACKENDS` /
# `DEFAULT_RETRIEVAL_BACKEND`: change the enum there and here together. Schema
# default `typescript`, so an absent key prints `typescript` and 1 is never
# returned; a `docs` parent of the wrong type (`"docs": "x"`) reads as absent
# too, because `hr_config_load`'s `try … catch` nulls that key alone — refusing
# that shape is the schema's job. 2 — printing nothing — when the configuration
# is unresolvable or the value is outside the enum, a refusal rather than a
# guess. It does NOT consult `phases.docs` / `docs.retrieval`: the key is read
# only inside the gate, so a caller asks `hr_docs_retrieval_applies` first and
# calls this only on its status 0.
hr_docs_retrieval_backend() {
  local root="${1-}"
  hr_config_load "$root" || return 2
  if ! hr_cfg_scalar_var "docs.retrievalBackend"; then
    printf 'typescript\n'
    return 0
  fi
  case "$HR_CFG_VALUE" in
    typescript|python)
      printf '%s\n' "$HR_CFG_VALUE"
      return 0
      ;;
  esac
  return 2
}

# ---------------------------------------------------------------------------
# Inbox routing — the one owner of the drop filename patterns.
# ---------------------------------------------------------------------------

# Route one inbox filename: set `HR_INBOX_KIND` (`task` | `user_review` |
# `docs`) and `HR_INBOX_BRANCH`, and return 0; on no match return 1 with both
# empty. Takes a basename, not a path.
#
# The task-prompt pattern is tested FIRST (the more specific suffix), but the
# anchored SUFFIX regexes are mutually exclusive by construction: a filename
# cannot end in more than one of `_task_prompt.md` / `_review[_<n>].md` /
# `_docs.md`, so a branch whose own name contains `review` or `task_prompt`
# cannot be misrouted — `foo_review_task_prompt.md` is the task engine on branch
# `foo_review`, and `foo_task_prompt_review.md` is the review engine on branch
# `foo_task_prompt`. POSIX leftmost-longest matching of the greedy `(.+)` derives
# the right branch from a round-suffixed name: `foo_review_2.md` -> branch `foo`
# (the `_2` is consumed by the optional `(_[0-9]+)?`), while
# `foo_review_2_review.md` -> branch `foo_review_2`. THE WATCHER DERIVES ONLY THE
# BRANCH, never the round: the engine resolves the latest round itself, inside
# the working copy, which is why nothing here has to remember one.
hr_inbox_route_var() {
  local fname="${1-}" branch
  HR_INBOX_KIND=""
  HR_INBOX_BRANCH=""
  [ -n "$fname" ] || return 1
  branch="$(printf '%s' "$fname" | sed -nE 's/^(.+)_task_prompt\.md$/\1/p')"
  if [ -n "$branch" ]; then
    HR_INBOX_KIND="task"
  else
    branch="$(printf '%s' "$fname" | sed -nE 's/^(.+)_review(_[0-9]+)?\.md$/\1/p')"
    if [ -n "$branch" ]; then
      HR_INBOX_KIND="user_review"
    else
      branch="$(printf '%s' "$fname" | sed -nE 's/^(.+)_docs\.md$/\1/p')"
      [ -n "$branch" ] || return 1
      HR_INBOX_KIND="docs"
    fi
  fi
  HR_INBOX_BRANCH="$branch"
  return 0
}

# ---------------------------------------------------------------------------
# The protected-branch trichotomy.
# ---------------------------------------------------------------------------

# The schema default for `protectedBranches`. THE ONLY BRANCH NAME IN THIS FILE
# — see "THE ONE BRANCH NAME IN THIS FILE" in the header for why this one
# occurrence is a mirrored schema default rather than a remembered matcher: it
# is unioned with the configured set and can only ever widen a refusal.
hr_protected_default_var() {
  HR_PROTECTED_DEFAULT='main'
}

# Print the resolved protected set, one glob pattern per line, de-duplicated:
# the configured list when the key is present, else that key's schema default,
# always unioned with `defaultBranch`. Return 2 (printing nothing) when the
# configuration cannot be resolved.
hr_protected_patterns() {
  local root="${1-}" default_branch list pattern seen=""
  hr_config_load "$root" || return 2
  hr_cfg_scalar_var "defaultBranch" || return 2
  default_branch="$HR_CFG_VALUE"

  if hr_cfg_scalar_var "protectedBranches.present"; then
    # Present, so the configured set wins even when it is EMPTY: an adopter who
    # emptied the list configured "only the default branch", and re-adding the
    # schema default there would protect a name they removed.
    hr_cfg_list_var "protectedBranches" || HR_CFG_VALUE=""
    list="$HR_CFG_VALUE"
  else
    hr_protected_default_var
    list="$HR_PROTECTED_DEFAULT"
  fi

  while IFS= read -r pattern; do
    [ -n "$pattern" ] || continue
    case "$seen" in
      *"|$pattern|"*) continue ;;
    esac
    seen="$seen|$pattern|"
    printf '%s\n' "$pattern"
  done <<EOF
$list
$default_branch
EOF
  return 0
}

# Print the checked-out branch; print nothing on a detached HEAD or when the
# path is not a repository. Always returns 0 — emptiness is the signal, and what
# a detached HEAD *means* is the caller's decision.
hr_current_branch() {
  local root="${1-}" branch
  [ -n "$root" ] || return 0
  branch=$(git -C "$root" symbolic-ref --short HEAD 2>/dev/null) || branch=""
  if [ -n "$branch" ]; then printf '%s\n' "$branch"; fi
  return 0
}

# 0 = protected, 1 = not protected, 2 = unresolvable. Patterns are matched as
# `case` globs, so one `release/*` entry covers its namespace.
#
# An EMPTY branch — a detached HEAD, or a repository that could not be read —
# returns 2 rather than 1: there is nothing to judge, and 1 would read as a
# permit.
hr_branch_is_protected() {
  local root="${1-}" branch="${2-}" patterns pattern
  patterns=$(hr_protected_patterns "$root") || return 2
  [ -n "$branch" ] || return 2

  while IFS= read -r pattern; do
    [ -n "$pattern" ] || continue
    case "$branch" in
      $pattern) return 0 ;;
    esac
  done <<EOF
$patterns
EOF
  return 1
}

# ---------------------------------------------------------------------------
# Anchors, the slug and the machine-local directory.
# ---------------------------------------------------------------------------

# `/` → `-`, which is all a worktree directory name needs: it is the source
# derivation, and widening it would move existing checkouts.
hr_sanitize_branch() {
  local branch="${1-}"
  [ -n "$branch" ] || return 1
  printf '%s\n' "${branch//\//-}"
}

# `<work_root>/<projectName>-<sanitized branch>` — byte-identical to what the
# CLI's `worktreeGlob()` materializes into the generated permission profile, so
# a worktree this creates is one that profile matches. Derive it here; never
# re-build the string in a caller.
hr_worktree_dir() {
  local root="${1-}" branch="${2-}" work name safe
  work=$(hr_work_root "$root") || return 1
  name=$(hr_project_name "$root") || return 2
  safe=$(hr_sanitize_branch "$branch") || return 1
  printf '%s/%s-%s\n' "${work%/}" "$name" "$safe"
}

# The MACHINE-UNIQUE identifier for this repository: the daemon label, the
# systemd unit name, the machine-level usage lane and every notification title
# key on it.
#
# It is the MAIN checkout's absolute path, lowercased, with every character
# outside `[a-z0-9]` replaced by `-`, runs collapsed, leading and trailing `-`
# stripped, and the result truncated to 64 characters KEEPING THE TAIL — the
# tail is the distinguishing part, since two checkouts on one machine usually
# share a long prefix. Deriving it from the MAIN checkout is what makes every
# worktree of one repository answer the same slug.
#
# DETERMINISTIC AND HASH-FREE ON PURPOSE: the CLI implements the same function
# in TypeScript — `repoSlug()` in `cli/src/daemon/units.ts`, exercised against
# this one by the agreement test in `cli/test/daemon.test.mjs` — and that test
# only stays honest while both are one readable line-for-line transformation. If
# you change a step here, change it there in the same commit. Truncation is
# LAST, so a truncated slug may begin with `-`; that is the published order and
# both halves keep it. Both halves are also ASCII-only: `é` is a `-`, never a
# letter (see the `LC_ALL=C` below and the CLI's ASCII-only case fold).
#
# When the main-checkout probe does not answer, the given root is used instead:
# a slug is an identifier, not a permission, so a derivable answer beats a
# refusal. The consequence is worth knowing — a worktree whose `git worktree
# list` fails answers a different slug than its own main checkout would.
hr_repo_slug() {
  # `[!a-z0-9]` below is a COLLATION range, so this line is load-bearing: under a
  # UTF-8 collation locale `a-z` also matches `é`, and the slug would keep it —
  # disagreeing with the CLI's `repoSlug()` (which is ASCII-only) and putting a
  # character outside `[a-z0-9-]` into a daemon label and a lane key. `local`
  # restores the caller's locale on return, and bash applies an LC_* assignment
  # immediately whether or not it is exported.
  local LC_ALL=C
  local root="${1-}" main_repo lower slug
  [ -n "$root" ] || return 1
  main_repo=$(hr_main_repo "$root") || main_repo="$root"
  [ -n "$main_repo" ] || return 1

  # bash 3.2 has no case-folding expansion, so this forks once. `LC_ALL=C` keeps
  # the fold ASCII-only and byte-safe; any character it leaves alone is outside
  # `[a-z0-9]` and becomes a `-` on the next line anyway.
  lower=$(printf '%s' "$main_repo" | LC_ALL=C tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz')
  slug=${lower//[!a-z0-9]/-}
  while :; do
    case "$slug" in
      *--*) slug=${slug//--/-} ;;
      *) break ;;
    esac
  done
  slug=${slug#-}
  slug=${slug%-}
  [ -n "$slug" ] || return 1
  if [ "${#slug}" -gt 64 ]; then
    slug=${slug: -64}
  fi
  printf '%s\n' "$slug"
}

# `<repo_root>/<state_dir>/<relative>` — the one place a run-artifact path is
# built, with `stateDir` normalized. With no <relative>, the state directory
# itself. Returns 2 when the configuration is unresolvable, because a script
# that guessed here would watch, log to, or stop the wrong directory silently.
hr_state_path() {
  local root="${1-}" relative="${2-}" state status
  [ -n "$root" ] || return 1
  state=$(hr_state_dir "$root")
  status=$?
  [ "$status" -eq 0 ] || return "$status"
  root=${root%/}
  while [ -n "$relative" ] && [ "${relative#/}" != "$relative" ]; do relative=${relative#/}; done
  if [ -n "$relative" ]; then
    printf '%s/%s/%s\n' "$root" "$state" "$relative"
  else
    printf '%s/%s\n' "$root" "$state"
  fi
}

# Judge whether <path> resolves STRICTLY INSIDE `<root>/<state_dir>/scratch/`.
# Usage: hr_scratch_path_var <root> <path> [<base>]
#
# Two callers, differing only in what they do with an accepted path:
# `scratch-run.sh` executes a file there and `remote-run.sh discard` removes a
# directory there. So this reports a keyword in `HR_SCRATCH_WHY` and leaves every
# message and exit code to its caller.
#
# The rule, stated once:
#   - `..` is refused ANYWHERE in the argument, not only as a whole segment —
#     strictly stronger, and free, because nothing in that directory depends on
#     a file's name. Then any character outside `A-Za-z0-9._/-` is refused. Both
#     tests run on <path> as the caller received it, before anything resolves.
#   - A relative <path> resolves against <base> when given, else <root>; an
#     absolute one is taken as given.
#   - Both sides of the comparison are resolved PHYSICALLY (`cd … && pwd -P`), so
#     a symlinked directory planted inside the scratch tree cannot widen the
#     fence. The target's parent must be the scratch directory or beneath it, and
#     a basename of `.` (the scratch directory itself) is refused.
#   - A target that is itself a symlink is refused rather than followed: its
#     destination is outside this judgement. The target need not exist.
#
# Clears the other four, then sets: `HR_SCRATCH_SUBDIR` (`scratch`, mirroring the `scratch` row
# of `STATE_DIR_ENTRIES` in `cli/src/generators/stateDir.ts`), `HR_SCRATCH_DIR`
# (physical), `HR_SCRATCH_PARENT` (physical), `HR_SCRATCH_TARGET`
# (`<parent>/<basename>`, the path a caller acts on) and `HR_SCRATCH_WHY`.
# Status / `HR_SCRATCH_WHY`:
#   0  accepted (WHY empty)
#   1  refused — `dotdot`, `charset`, `outside`, `itself`, `symlink`
#   2  the target's parent does not resolve — `no-parent`
#   3  the scratch directory cannot be located — `no-config`, `no-scratch`
#   4  <root> or <path> is empty — `usage`
hr_scratch_path_var() {
  local root="${1-}" path="${2-}" base="${3-}" scratch candidate name
  HR_SCRATCH_DIR=""
  HR_SCRATCH_PARENT=""
  HR_SCRATCH_TARGET=""
  HR_SCRATCH_WHY=""
  HR_SCRATCH_SUBDIR='scratch'
  if [ -z "$root" ] || [ -z "$path" ]; then
    HR_SCRATCH_WHY="usage"
    return 4
  fi
  case "$path" in
    *..*) HR_SCRATCH_WHY="dotdot"; return 1 ;;
  esac
  case "$path" in
    *[!A-Za-z0-9._/-]*) HR_SCRATCH_WHY="charset"; return 1 ;;
  esac
  scratch=$(hr_state_path "$root" "$HR_SCRATCH_SUBDIR")
  if [ "$?" -ne 0 ] || [ -z "$scratch" ]; then
    HR_SCRATCH_WHY="no-config"
    return 3
  fi
  HR_SCRATCH_DIR=$(cd "$scratch" 2>/dev/null && pwd -P)
  if [ -z "$HR_SCRATCH_DIR" ]; then
    HR_SCRATCH_WHY="no-scratch"
    return 3
  fi
  [ -n "$base" ] || base="$root"
  case "$path" in
    /*) candidate="$path" ;;
    *) candidate="${base%/}/$path" ;;
  esac
  HR_SCRATCH_PARENT=$(cd "$(dirname "$candidate")" 2>/dev/null && pwd -P)
  if [ -z "$HR_SCRATCH_PARENT" ]; then
    HR_SCRATCH_WHY="no-parent"
    return 2
  fi
  case "$HR_SCRATCH_PARENT" in
    "$HR_SCRATCH_DIR" | "$HR_SCRATCH_DIR"/*) ;;
    *) HR_SCRATCH_WHY="outside"; return 1 ;;
  esac
  name=$(basename "$candidate")
  if [ "$name" = "." ]; then
    HR_SCRATCH_WHY="itself"
    return 1
  fi
  HR_SCRATCH_TARGET="$HR_SCRATCH_PARENT/$name"
  if [ -L "$HR_SCRATCH_TARGET" ]; then
    HR_SCRATCH_WHY="symlink"
    return 1
  fi
  return 0
}

# The machine-local settings directory — one place an operator keeps values that
# vary per machine rather than per repository, which is why it is not a config
# key and not a repository file. Return 1 when there is no home to anchor it to.
hr_machine_config_dir() {
  local base="${XDG_CONFIG_HOME-}"
  [ -n "$base" ] || base="${HOME-}/.config"
  case "$base" in
    /.config) return 1 ;;
  esac
  [ -n "$base" ] || return 1
  printf '%s/autonomous-sdlc-harness\n' "${base%/}"
}

# The machine-local cache directory, holding the shared docs-retrieval runtime.
# Mirrors `machineCacheDir()` in `cli/src/machine/paths.ts`: the variable when
# set and non-empty, else `$HOME/.cache`, one trailing slash stripped. Return 1
# when there is no home to anchor it to.
hr_cache_dir() {
  local base="${XDG_CACHE_HOME-}"
  [ -n "$base" ] || base="${HOME-}/.cache"
  case "$base" in
    /.cache) return 1 ;;
  esac
  [ -n "$base" ] || return 1
  printf '%s/autonomous-sdlc-harness\n' "${base%/}"
}

# The push-notification credential files, in RESOLUTION ORDER, one per line and
# whether or not each exists — the caller sources the first that does:
#
#   1. the machine-local file, so credentials for a machine are kept once rather
#      than per repository;
#   2. the repository's configured `pushEnvPath`, when there is one.
#
# UNLIKE THE TYPED READERS THIS DEGRADES INSTEAD OF REFUSING: it returns 0 and
# prints just the machine-local candidate when the configuration cannot be read.
# Delivering a notification is not a mutating action, and a run that has just
# refused something unresolvable is exactly the run whose operator most needs to
# hear about it.
hr_push_env_files() {
  local root="${1-}" dir path
  if dir=$(hr_machine_config_dir); then
    printf '%s/push.env\n' "$dir"
  fi
  path=$(hr_push_env_path "$root") || return 0
  [ -n "$path" ] || return 0
  case "$path" in
    /*) printf '%s\n' "$path" ;;
    *) printf '%s/%s\n' "${root%/}" "$path" ;;
  esac
  return 0
}

# ---------------------------------------------------------------------------
# THE RUN REGISTRY.
#
# THE CONTRACT IS NOT THIS SECTION'S. The registry's JSON shape
# (`{"runs": {"<branch>": {…}}}`), its field set and its status vocabulary are
# stated in `autonomous-watcher.sh`'s header and registry comment block; this
# section only reads and writes that shape, for every script that shares the
# file, so no second copy of a writer exists.
#
# Each function takes the registry file as its first argument — the caller
# resolves it as `hr_state_path <root> autonomous_logs/registry.json` — and is
# write exception 2 in the header. Every value is written as a JSON string;
# every write stamps `branch` and `updated_at` on the record. No shell option is
# assumed: the caller may set `-e`, `-u` or neither.
#
# EVERY WRITE IS A LOCKED READ-MODIFY-WRITE. Every script sharing the file
# writes it, and so does the watcher's own `( … ) &` engine subshell, so two
# unserialized writers each read the same record and the second `mv` silently
# drops the first one's key. The lock is a `mkdir` of `<file>.lock` holding an
# `owner` file with a per-call token — the `mktemp` name of that call's temp
# file, because `$$` inside a subshell is the parent's pid and bash 3.2 has no
# per-subshell pid variable — and only a call whose token is still in `owner`
# releases it.
#
# STALENESS IS THE LOCK DIRECTORY'S AGE, NEVER A PID. The stall watchdog kills
# the engine subshell mid-write, so a dead holder is expected, and a pid says
# nothing about a lock the killed subshell took under its parent's `$$`. A write
# is one `jq` over a file of a few records, well under a second, so a lock 10 s
# old is a crashed holder; a waiter polls every 0.05 s for up to 12 s — past the
# stale age, so a waiter that arrives just after a crash breaks the lock rather
# than giving up. Both are constants here, not environment values: the header
# allows policy-carrying environment values for the lane only.
#
# BREAKERS ARE SERIALIZED, AND NONE RENAMES A LIVE LOCK. A waiter that judges
# the lock stale takes a second `mkdir` mutex, `<file>.lock.break`, judges the
# lock's age again under it, and only then renames the lock aside and empties
# it, as `hr_lane_acquire` does. A lock re-taken since the first judgement is
# fresh, so the second leaves it alone. Between the second judgement and the
# rename, nothing but a breaker or the lock's own holder frees the path:
# breakers are serialized, and the holder of a lock that old is dead by the
# stale rule. The watchdog can kill a breaker inside the mutex, so a mutex 10 s
# old is removed by the next waiter. That removal is the one window left open.
# Two waiters that judge one abandoned mutex old together can both remove it,
# and the second can remove the fresh mutex the first has just taken. Two
# breakers then judge the lock at once, so reaching it takes a breaker killed
# inside the mutex, a stale lock and three concurrent writers.
#
# A write that cannot take the lock prints one stderr line naming it, writes
# nothing and returns 1.
#
# ONE CALL, SEVERAL KEYS. `hr_registry_set <file> <branch> <key> <value> [<key>
# <value> …]` writes every pair in one `jq` pass under one lock and one `mv`.
# A caller writing two keys that a concurrent reader must never see apart — a
# status and the reason for it — MUST pass them in one call.
#
# READERS TAKE NO LOCK. The temp file sits beside the registry, so the `mv` is a
# same-filesystem rename and `hr_registry_get`, `hr_registry_branches` and any
# other `jq` over the file see the old record or the new one, never a partial
# one. `hr_registry_init` creates the file by `ln`-ing a complete temp file to
# the registry name, which fails when the name exists, so a reader's create
# never truncates a registry a writer has just created.
# ---------------------------------------------------------------------------

# The directory holding <file> — where its temp files go, so every `mv` over it
# is a same-filesystem rename.
hr_registry_dir() {
  local file="${1-}" dir
  case "$file" in
    */*)
      dir="${file%/*}"
      [ -n "$dir" ] || dir=/
      ;;
    *) dir=. ;;
  esac
  printf '%s\n' "$dir"
}

# Create an empty registry at <file> when none exists. Atomic: the name is
# either absent or a complete `{"runs":{}}` — never truncated, never partial.
hr_registry_init() {
  local file="${1-}" dir tmp
  [ -n "$file" ] || return 1
  [ -f "$file" ] && return 0
  dir=$(hr_registry_dir "$file")
  tmp=$(mktemp "$dir/.registry.XXXXXX") || return 1
  if printf '{"runs":{}}\n' >"$tmp"; then
    ln "$tmp" "$file" 2>/dev/null || :
  fi
  rm -f "$tmp"
  [ -f "$file" ]
}

# hr_registry_lock <file> <token> — take `<file>.lock` for <token>, breaking a
# stale one (see the section comment). 0 when held; 1, with one stderr line,
# when the wait ceiling passed.
hr_registry_lock() {
  local lock="${1-}.lock" token="${2-}" polls=0 start="" now m stale bm
  # 12 — the wait ceiling and 10 — the stale age, both in seconds. The wait is
  # judged by the clock, because each poll's forks cost more than its sleep;
  # 240 polls is the ceiling only when `date` gives no epoch.
  while :; do
    if mkdir "$lock" 2>/dev/null; then
      if printf '%s\n' "$token" >"$lock/owner" 2>/dev/null; then
        return 0
      fi
      rm -f "$lock/owner" 2>/dev/null || :
      rmdir "$lock" 2>/dev/null || :
      break
    fi
    m=$(hr_lane_mtime "$lock")
    now=$(date +%s 2>/dev/null) || now=0
    case "$now" in '' | *[!0-9]*) now=0 ;; esac
    [ -n "$start" ] || start="$now"
    if [ "$now" -gt 0 ]; then
      [ $((now - start)) -lt 12 ] || break
    else
      [ "$polls" -lt 240 ] || break
    fi
    if [ "$m" -gt 0 ] && [ "$now" -gt 0 ] && [ $((now - m)) -ge 10 ]; then
      if mkdir "$lock.break" 2>/dev/null; then
        # One breaker at a time: judge the age again under the mutex, so a
        # lock re-taken since the judgement above is fresh and left alone.
        m=$(hr_lane_mtime "$lock")
        now=$(date +%s 2>/dev/null) || now=0
        case "$now" in '' | *[!0-9]*) now=0 ;; esac
        if [ "$m" -gt 0 ] && [ "$now" -gt 0 ] && [ $((now - m)) -ge 10 ]; then
          stale="$lock.stale.${token##*.}"
          if mv "$lock" "$stale" 2>/dev/null; then
            rm -f "$stale/owner" 2>/dev/null || :
            rmdir "$stale" 2>/dev/null || :
          fi
        fi
        rmdir "$lock.break" 2>/dev/null || :
        polls=$((polls + 1))
        continue
      fi
      # Another breaker holds the mutex. One the watchdog killed inside it
      # left it behind: a mutex 10 s old is removed here.
      bm=$(hr_lane_mtime "$lock.break")
      if [ "$bm" -gt 0 ] && [ $((now - bm)) -ge 10 ]; then
        rmdir "$lock.break" 2>/dev/null || :
      fi
    fi
    sleep 0.05
    polls=$((polls + 1))
  done
  printf 'hr_registry_set: could not take the registry lock %s\n' "$lock" >&2
  return 1
}

# hr_registry_unlock <file> <token> — release `<file>.lock` only while its
# `owner` still holds <token>; a lock broken and re-taken is someone else's.
hr_registry_unlock() {
  local lock="${1-}.lock" token="${2-}" owner=""
  [ -r "$lock/owner" ] && { IFS= read -r owner <"$lock/owner" || :; } 2>/dev/null
  [ -n "$token" ] && [ "$owner" = "$token" ] || return 0
  rm -f "$lock/owner" 2>/dev/null || :
  rmdir "$lock" 2>/dev/null || :
}

# hr_registry_set <file> <branch> <key> <value> [<key> <value> …]
# 1, writing nothing, on no key/value pair or an odd count of them. Each pair
# reaches `jq` as `--arg kN` / `--arg vN` — jq 1.5 has no `$ARGS` — and only
# those generated names enter the program text, never a value.
hr_registry_set() {
  local file="${1-}" branch="${2-}" dir tmp fields="" i=0 status=0
  local -a args
  [ -n "$file" ] && [ "$#" -ge 4 ] && [ $(($# % 2)) -eq 0 ] || return 1
  shift 2
  args=(--arg b "$branch" --arg now "$(date '+%Y-%m-%dT%H:%M:%S')")
  while [ "$#" -gt 0 ]; do
    args+=(--arg "k$i" "$1" --arg "v$i" "$2")
    fields="$fields(\$k$i): \$v$i, "
    i=$((i + 1))
    shift 2
  done
  dir=$(hr_registry_dir "$file")
  tmp=$(mktemp "$dir/.registry.XXXXXX") || return 1
  if ! hr_registry_lock "$file" "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  hr_registry_init "$file" || :
  if jq "${args[@]}" "
    .runs[\$b] = ((.runs[\$b] // {}) + {$fields\"branch\": \$b, \"updated_at\": \$now})
  " "$file" >"$tmp"; then
    mv "$tmp" "$file" || status=1
  else
    status=1
  fi
  [ "$status" -eq 0 ] || rm -f "$tmp"
  hr_registry_unlock "$file" "$tmp"
  return "$status"
}

# hr_registry_drop <file> <branch> — delete `.runs[<branch>]` under
# `hr_registry_set`'s lock, temp file and `mv`. Its callers:
# `hr_clone_create_var`'s rollback, `create-worktree.sh`'s failure rollback
# and `remote-run.sh`'s `start_remove_copy`. 0 dropped, or no file to drop from (none is created); 1,
# writing nothing, when the lock cannot be taken or the write fails.
hr_registry_drop() {
  local file="${1-}" branch="${2-}" dir tmp status=0 written=0
  [ -n "$file" ] || return 1
  dir=$(hr_registry_dir "$file")
  tmp=$(mktemp "$dir/.registry.XXXXXX") || return 1
  if ! hr_registry_lock "$file" "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  if [ -f "$file" ]; then
    if jq --arg b "$branch" 'del(.runs[$b])' "$file" >"$tmp"; then
      mv "$tmp" "$file" && written=1 || status=1
    else
      status=1
    fi
  fi
  [ "$written" -eq 1 ] || rm -f "$tmp"
  hr_registry_unlock "$file" "$tmp"
  return "$status"
}

# hr_registry_restore <file> <branch> <json> — set `.runs[<branch>]` back to
# <json>, the compact record a caller read from the same file, under
# `hr_registry_set`'s lock, temp file and `mv`. Its callers:
# `hr_clone_create_var`'s rollback and `create-worktree.sh`'s failure
# rollback, each putting a previous record back. 0 restored; 1, writing nothing, when <file> is absent,
# <json> is not an object, the lock cannot be taken or the write fails.
hr_registry_restore() {
  local file="${1-}" branch="${2-}" rec="${3-}" dir tmp status=0 written=0
  [ -n "$file" ] && [ -f "$file" ] && [ -n "$rec" ] || return 1
  dir=$(hr_registry_dir "$file")
  tmp=$(mktemp "$dir/.registry.XXXXXX") || return 1
  if ! hr_registry_lock "$file" "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  if jq --arg b "$branch" --arg r "$rec" \
    '($r | fromjson) as $p | if ($p | type) == "object" then .runs[$b] = $p else error("not a record") end' \
    "$file" >"$tmp"; then
    mv "$tmp" "$file" && written=1 || status=1
  else
    status=1
  fi
  [ "$written" -eq 1 ] || rm -f "$tmp"
  hr_registry_unlock "$file" "$tmp"
  return "$status"
}

# hr_registry_get <file> <branch> <key>   -> the value, or nothing
hr_registry_get() {
  local file="${1-}"
  hr_registry_init "$file" || :
  jq -r --arg b "${2-}" --arg k "${3-}" '.runs[$b][$k] // empty' "$file" 2>/dev/null
}

# Every branch in the registry at <file>, one per line. Prints nothing when the
# file cannot be read as a registry, which leaves each caller iterating over an
# empty set.
hr_registry_branches() {
  local file="${1-}"
  hr_registry_init "$file" || :
  jq -r '.runs | keys[]' "$file" 2>/dev/null
}

# hr_registry_live_count <file> [exclude_branch] — print how many runs of the
# registry at <file>, <exclude_branch> left out, hold a slot: a record whose
# `execution` is not `github-actions`, whose `status` is `running`, and whose
# `pid` is non-empty and answers `kill -0`. Prints the integer only; returns 0.
# THE ONE HOME of the live-run rule: the watcher's `running_count` and its
# start-up sweep's gate both call it.
#
# `running` is the only status that holds a slot. The status filter is what
# keeps a finished record's pid, once the OS reuses it, from holding one — a
# terminal write drops the pid, but a session that exits before
# `spawn_engine`'s parent writes `pid "$!"` leaves its own dead subshell's pid
# on a terminal record. The filter cannot count out a run being launched: every
# launch and resume path writes `status running` before `spawn_engine` writes
# the pid, and the watcher runs each spawn to completion before its next
# capacity read. A remote run holds no local slot: its job gates itself.
hr_registry_live_count() {
  local file="${1-}" exclude="${2-}" n=0 b pid
  while IFS= read -r b; do
    [ -n "$b" ] || continue
    [ -z "$exclude" ] || [ "$b" != "$exclude" ] || continue
    [ "$(hr_registry_get "$file" "$b" execution)" != "github-actions" ] || continue
    [ "$(hr_registry_get "$file" "$b" status)" = "running" ] || continue
    pid="$(hr_registry_get "$file" "$b" pid)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      n=$((n + 1))
    fi
  done <<EOF
$(hr_registry_branches "$file")
EOF
  printf '%s\n' "$n"
  return 0
}

# hr_registry_peek <file> <branch> <key> — print `.runs[<branch>][<key>]`
# (nothing for an absent or null key) and return 0; return 1, printing nothing,
# when <file> is not a readable regular file or `jq` fails or finds no
# `.runs[<branch>]`. The read a check makes: unlike `hr_registry_get` and
# `hr_registry_branches` it never calls `hr_registry_init`, takes no lock and
# creates neither the file nor its directory.
hr_registry_peek() {
  local file="${1-}" out
  [ -n "$file" ] && [ -f "$file" ] && [ -r "$file" ] || return 1
  out=$(jq -r --arg b "${2-}" --arg k "${3-}" '
    .runs[$b] | if type == "object" then (if .[$k] == null then empty else .[$k] end) else error("absent") end
  ' "$file" 2>/dev/null) || return 1
  [ -z "$out" ] || printf '%s\n' "$out"
}

# hr_remote_record_init <file> <branch> <worktree> <log_path> <engine>
# The fields a remote run's record starts with — the one list, written by the
# watcher's `launch_remote_run` — in one write, so no reader sees half of them. `status` is left to the caller, which writes it only
# once its run exists. 1 when the write failed.
hr_remote_record_init() {
  local file="${1-}" branch="${2-}"
  hr_registry_set "$file" "$branch" \
    worktree "${3-}" log_path "${4-}" engine "${5-}" \
    execution github-actions \
    started_at "$(date '+%Y-%m-%dT%H:%M:%S')" \
    pid "" remote_dispatched_at "" \
    stall_restarts 0 stall_warned "" stall_killing "" \
    paused_by "" usage_resume_at "" \
    resume_kind "" park_loop_cycles 0
}

# ---------------------------------------------------------------------------
# DERIVING A BRANCH NAME FROM A TITLE.
#
# THE RULE. A title becomes a branch name by a fixed fold, with no model and no
# confirmation step: lowercase A–Z, turn every run of characters outside
# `[a-z0-9]` into one `_`, trim `_` from both ends, cut to `HR_BRANCH_SLUG_MAX`
# and trim a trailing `_` the cut exposed. An empty result takes the caller's
# <fallback> (`issue_<number>` for an issue, `task_<run id>` for a dispatch). A
# taken name takes the lowest free `<name>_<n>`, `_2` through
# `HR_BRANCH_SUFFIX_MAX`; the first branch carries no suffix (`Version bump` →
# `version_bump`), and `_2` reads as "the second".
#
# - The fold is ASCII-only under `LC_ALL=C`, so `é` is a separator, never a
#   letter — `hr_repo_slug`'s precedent. A locale-dependent fold would derive
#   different names on different runners; a lowercase ASCII name passes every
#   `git check-ref-format` rule and cannot collide by case on macOS or Windows.
# - The cap is 60, cut before the suffix. The name becomes a working-copy
#   directory component (`<projectName>-<branch>`) and prefixes artifact names
#   (`<branch>_task_prompt.md`); 60 keeps each far under a 255-byte file-name
#   limit and readable in the Actions run list. GitHub documents no ref limit.
#
# THIS SECTION ONLY READS. It fetches nothing and creates no branch or file; a
# caller that wants `origin` fresh fetches first. Given a <gh_cli>, it also asks
# GitHub one read per candidate — the run workflow's runs under that name — and
# still writes nothing. A registry is read only when it already exists, because
# `hr_registry_get` creates an absent one.
# ---------------------------------------------------------------------------

# The two limits the rule above names.
hr_branch_limits_var() {
  HR_BRANCH_SLUG_MAX=60
  HR_BRANCH_SUFFIX_MAX=99
}

# hr_branch_slug <text> — print the slug and return 0; print nothing and return
# 1 when the fold leaves nothing (`🚀🚀`).
hr_branch_slug() {
  # `[!a-z0-9]` is a collation range: under a UTF-8 locale it would keep `é`.
  local LC_ALL=C
  local text="${1-}" slug
  hr_branch_limits_var
  slug=$(printf '%s' "$text" | LC_ALL=C tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz')
  slug=${slug//[!a-z0-9]/_}
  while :; do
    case "$slug" in
      *__*) slug=${slug//__/_} ;;
      *) break ;;
    esac
  done
  slug=${slug#_}
  slug=${slug%_}
  if [ "${#slug}" -gt "$HR_BRANCH_SLUG_MAX" ]; then
    slug=${slug:0:$HR_BRANCH_SLUG_MAX}
    slug=${slug%_}
  fi
  [ -n "$slug" ] || return 1
  printf '%s\n' "$slug"
}

# Read, once, the two listings every `taken` judgement compares against:
# `HR_TAKEN_REMOTE` — each branch on `origin`, lowercased — and
# `HR_TAKEN_ARTIFACTS` — the basename of every file and directory under
# `<state_dir>` on `origin/<defaultBranch>`; one per line in both. 0 when both
# were read; 2, with `HR_TAKEN_WHY` naming which, when either could not be.
hr_branch_taken_lists_var() {
  local LC_ALL=C
  local root="${1-}" heads state default tree line tab
  tab=$(printf '\t')
  HR_TAKEN_REMOTE=""
  HR_TAKEN_ARTIFACTS=""
  HR_TAKEN_WHY=""
  if ! heads=$(git -C "$root" ls-remote --heads origin 2>/dev/null); then
    HR_TAKEN_WHY="the branches on origin could not be listed"
    return 2
  fi
  while IFS= read -r line; do
    line=${line#*"$tab"refs/heads/}
    [ -n "$line" ] || continue
    HR_TAKEN_REMOTE="$HR_TAKEN_REMOTE$line
"
  done <<EOF
$heads
EOF
  HR_TAKEN_REMOTE=$(printf '%s' "$HR_TAKEN_REMOTE" | LC_ALL=C tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz')

  if ! state=$(hr_state_dir "$root") || ! default=$(hr_default_branch "$root"); then
    HR_TAKEN_WHY="the configuration could not be read"
    return 2
  fi
  if ! git -C "$root" rev-parse --verify --quiet "refs/remotes/origin/$default^{commit}" >/dev/null 2>&1; then
    HR_TAKEN_WHY="origin/$default is not present"
    return 2
  fi
  if ! tree=$(git -C "$root" ls-tree -r -t --name-only "refs/remotes/origin/$default" -- "$state/" 2>/dev/null); then
    HR_TAKEN_WHY="the tree of origin/$default could not be read"
    return 2
  fi
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    HR_TAKEN_ARTIFACTS="$HR_TAKEN_ARTIFACTS${line##*/}
"
  done <<EOF
$tree
EOF
  return 0
}

# hr_branch_run_history <root> <gh_cli> <name> — 0 when the run workflow
# (`HR_REMOTE_WORKFLOW_RUN_FILE`) lists a run under <name>, 1 when it lists
# none, 2 when <gh_cli> cannot run, exits non-zero, or answers anything but a
# JSON array. Sets no `HR_` variable: the names are assigned inside the
# subshell that `cd`s to <root>.
#
# GitHub keeps a deleted branch's runs listed under its name, and a later run
# of that name inherits them: Gate 12 round 5 found run `36569531374` of the
# deleted `feat_invoices` (`docs/development.md` → Gate 12 → Round 5, finding
# 1). One bounded read per candidate, not one listing of every branch, because
# a bounded all-branch listing could miss an old name. Bash 3.2 and jq 1.5.
hr_branch_run_history() {
  local root="${1-}" gh_cli="${2-}" name="${3-}" answer verdict
  [ -n "$root" ] && [ -n "$gh_cli" ] && [ -n "$name" ] || return 2
  answer=$(cd "$root" 2>/dev/null && hr_remote_names_var &&
    "$gh_cli" run list --workflow "$HR_REMOTE_WORKFLOW_RUN_FILE" --branch "$name" --limit 1 --json databaseId 2>/dev/null) || return 2
  verdict=$(printf '%s' "$answer" | jq -r 'if type == "array" then (if length > 0 then "history" else "none" end) else "other" end' 2>/dev/null) || return 2
  case "$verdict" in
    history) return 0 ;;
    none) return 1 ;;
  esac
  return 2
}

# Judge <name> against the listings `hr_branch_taken_lists_var` last read, then,
# given a <gh_cli>, against the run workflow's history — last, so the free local
# checks answer first. The answers and `HR_TAKEN_WHY` are
# `hr_branch_name_taken`'s.
hr_branch_taken_judge() {
  local LC_ALL=C
  local root="${1-}" name="${2-}" registry="${3-}" gh_cli="${4-}" lower status nl
  nl='
'
  HR_TAKEN_WHY=""
  status=0
  hr_branch_is_protected "$root" "$name" || status=$?
  case "$status" in
    0) HR_TAKEN_WHY="a protected branch"; return 0 ;;
    2) HR_TAKEN_WHY="the protected branches could not be resolved"; return 2 ;;
  esac
  lower=$(printf '%s' "$name" | LC_ALL=C tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz')
  case "$nl$HR_TAKEN_REMOTE$nl" in
    *"$nl$lower$nl"*) HR_TAKEN_WHY="a branch on origin"; return 0 ;;
  esac
  if git -C "$root" show-ref --verify --quiet "refs/heads/$name" 2>/dev/null; then
    HR_TAKEN_WHY="a local branch"
    return 0
  fi
  case "$nl$HR_TAKEN_ARTIFACTS" in
    *"$nl$name$nl"* | *"$nl${name}_task_prompt.md$nl"* | *"$nl${name}_story_plan.md$nl"* | *"$nl${name}_docs.md$nl"*)
      HR_TAKEN_WHY="a run's artifacts on the default branch"
      return 0
      ;;
  esac
  if [ -n "$registry" ] && [ -f "$registry" ] && [ -n "$(hr_registry_get "$registry" "$name" branch)" ]; then
    HR_TAKEN_WHY="a run registry record"
    return 0
  fi
  if [ -n "$gh_cli" ]; then
    status=0
    hr_branch_run_history "$root" "$gh_cli" "$name" || status=$?
    case "$status" in
      0) HR_TAKEN_WHY="a run of the run workflow listed under that name"; return 0 ;;
      1) ;;
      *) HR_TAKEN_WHY="the run history of $name could not be listed"; return 2 ;;
    esac
  fi
  return 1
}

# hr_branch_name_taken <root> <name> [<registry>] [<gh_cli>] — 0 taken, 1 free,
# 2 cannot tell. Sets `HR_TAKEN_WHY` to a short phrase naming the collision or
# the failure. A caller with no registry passes `""` before <gh_cli>. Taken: a
# protected name; a branch on `origin`, compared case-insensitively; a local
# branch; under `<state_dir>` on `origin/<defaultBranch>`, a directory named
# <name> or a file `<name>_task_prompt.md`, `<name>_story_plan.md` or
# `<name>_docs.md` — which a merged and deleted branch still leaves; a record in
# an existing <registry>; given a <gh_cli>, any run of the run workflow listed
# under <name> (`hr_branch_run_history`), whose listing failing is a 2.
hr_branch_name_taken() {
  local root="${1-}" name="${2-}" registry="${3-}" gh_cli="${4-}"
  HR_TAKEN_WHY=""
  if [ -z "$root" ] || [ -z "$name" ]; then
    HR_TAKEN_WHY="no branch name to judge"
    return 2
  fi
  hr_config_load "$root" || :
  hr_branch_taken_lists_var "$root" || return 2
  hr_branch_taken_judge "$root" "$name" "$registry" "$gh_cli"
}

# hr_derive_branch <root> <text> <fallback> [<registry>] [<gh_cli>] — print the
# derived name and return 0; return 2, printing nothing, when a `taken`
# judgement could not tell or no base routes back to itself; return 3, printing
# nothing, when every suffix through `HR_BRANCH_SUFFIX_MAX` is taken. Never a
# guessed name. <gh_cli> reaches every judgement as `hr_branch_name_taken`'s.
#
# THE BASE MUST ROUTE BACK TO ITSELF: `hr_inbox_route_var` on each drop filename
# a run of that name produces has to give the base as its branch, so no derived
# name makes the inbox patterns ambiguous. A base that does not is replaced by
# <fallback> once.
hr_derive_branch() {
  local root="${1-}" text="${2-}" fallback="${3-}" registry="${4-}" gh_cli="${5-}"
  local base="" candidate suffix routes n status
  hr_branch_limits_var
  candidate=$(hr_branch_slug "$text") || candidate="$fallback"
  for candidate in "$candidate" "$fallback"; do
    [ -n "$candidate" ] || continue
    routes=0
    for suffix in _task_prompt.md _review.md _review_2.md _docs.md; do
      if ! hr_inbox_route_var "$candidate$suffix" || [ "$HR_INBOX_BRANCH" != "$candidate" ]; then
        routes=1
        break
      fi
    done
    if [ "$routes" -eq 0 ]; then
      base="$candidate"
      break
    fi
  done
  [ -n "$base" ] || return 2

  hr_config_load "$root" || :
  hr_branch_taken_lists_var "$root" || return 2
  candidate="$base"
  n=1
  while :; do
    status=0
    hr_branch_taken_judge "$root" "$candidate" "$registry" "$gh_cli" || status=$?
    case "$status" in
      1) printf '%s\n' "$candidate"; return 0 ;;
      2) return 2 ;;
    esac
    n=$((n + 1))
    [ "$n" -le "$HR_BRANCH_SUFFIX_MAX" ] || return 3
    candidate="${base}_$n"
  done
}

# ---------------------------------------------------------------------------
# THE WATCHER FAMILY'S GIT IN A RUN'S COPY.
#
# The watcher family runs git outside the sandbox in a working copy a run has
# written — a worktree, the main checkout or a clone — so every call made here
# holds four rules on every arm:
#   - No hook runs: `core.hooksPath=/dev/null` holds none.
#   - The copy's record is read once, by the checks, and never again. For a
#     worktree only `<record>/index` is borrowed, so git never reads the copy's
#     `.git` pointer, the record's `commondir`, its `HEAD` or its
#     `config.worktree`. For a clone the checks read the registry, `HEAD`,
#     `alternates` and `.git/config` once; the copy check's sync-in then runs
#     `git-upload-pack` in the clone, which reads the clone's `.git/config`,
#     refs and objects (through `alternates`) again under the measured fetch
#     pins (`docs/cli.md` §6), and after that only `<clone>/.git/index` is
#     borrowed: every runner reads objects and refs from the main checkout
#     alone, never through the clone's own store.
#   - Every call names `refs/heads/<branch>`, never `HEAD`: under
#     `GIT_DIR=<main>/.git`, `HEAD` is the main checkout's.
#   - Git reads history as stored: `GIT_NO_REPLACE_OBJECTS=1` and
#     `GIT_GRAFT_FILE=/dev/null`. A sandboxed session can write
#     `refs/replace/` and `info/grafts` in the common directory, and either
#     one makes the merge base read as a commit carrying the run's own tree,
#     so every surface diff comes out empty while `read-tree` still writes
#     the tip's real tree. Each call also sets
#     `-c advice.graftFileDeprecated=false`, because a set graft file makes
#     git print its deprecation hint on stderr; an older git ignores the key.
# On a clone, the main checkout's `refs/heads/<branch>` is synced in by the
# copy check (`hr_copy_sync_in_var`), and every ref this section moves goes
# through `hr_copy_ref_swap_var`, the clone's ref first. `hr_run_surface_check_var` and
# `hr_run_worktree_diff_var` need no arm of their own: they read refs and
# objects from the main checkout and the copy's working tree through a fresh
# index, which holds for a clone as for a worktree.
# `hr_worktree_config_check_var` is skipped here because no runner below lets
# git read the record's `config.worktree`; `push-branch.sh` and
# `refresh-branch.sh` keep it under their own headers. Write exception 5 in the
# header is this section's.
#
# Every function suffixed `_var` sets globals and must be called directly, never
# inside `$(…)`. `hr_run_main_set_var` or `hr_run_copy_check_var` comes first.
# ---------------------------------------------------------------------------

# hr_run_main_set_var <main> — set `HR_RUN_MAIN` to <main> canonical, and clear
# `HR_RUN_TRUSTED_BASE` and the `HR_RUN_COPY_*` values, so nothing established
# for another checkout or an earlier operation is reused. 0 only when
# `<main>/.git` is a real directory, not a symbolic link, holding no
# `commondir` (`hr_wrapper_main_of`'s directory arm); 1 otherwise, with
# `HR_RUN_REFUSAL` set to one sentence.
hr_run_main_set_var() {
  local main="${1-}" c
  HR_RUN_MAIN=""
  HR_RUN_TRUSTED_BASE=""
  HR_RUN_REFUSAL=""
  HR_RUN_COPY_TOP=""
  HR_RUN_COPY_GITDIR=""
  HR_RUN_COPY_BRANCH=""
  HR_RUN_COPY_TIP=""
  HR_RUN_COPY_KIND=""
  if [ -z "$main" ] || ! c=$( CDPATH= cd -P -- "$main" 2>/dev/null && pwd -P ); then
    HR_RUN_REFUSAL="the main checkout '$main' is not a directory"
    return 1
  fi
  if [ -L "$c/.git" ] || [ ! -d "$c/.git" ]; then
    HR_RUN_REFUSAL="'$c' is not a main checkout: its .git is not a real directory"
    return 1
  fi
  if [ -e "$c/.git/commondir" ] || [ -L "$c/.git/commondir" ]; then
    HR_RUN_REFUSAL="'$c' is not a main checkout: its .git directory holds a commondir"
    return 1
  fi
  HR_RUN_MAIN=$c
  return 0
}

# hr_run_copy_check_var <main> <copy> — judge <copy> against <main> and set
# `HR_RUN_MAIN`, `HR_RUN_COPY_TOP` (canonical), `HR_RUN_COPY_GITDIR`
# (`HR_TARGET_GITDIR`), `HR_RUN_COPY_KIND` (`HR_TARGET_KIND`),
# `HR_RUN_COPY_BRANCH` (empty on a detached, unreadable or invalid HEAD, or a
# name starting with `-`) and `HR_RUN_COPY_TIP`: the copy's HEAD commit read
# from the main repository, empty when unborn. On a clone with a branch it
# first syncs that branch in (`hr_copy_sync_in_var`), so the tip is the main
# checkout's `refs/heads/<branch>` after the sync. 0 trusted; 1 untrusted or
# the sync-in refused, with `HR_RUN_REFUSAL` set.
hr_run_copy_check_var() {
  local main="${1-}" copy="${2-}" top head
  hr_run_main_set_var "$main" || return 1
  if [ -z "$copy" ] || ! top=$(hr_checkout_top_nogit "$copy"); then
    HR_RUN_REFUSAL="'$copy' is not inside a git checkout"
    return 1
  fi
  if ! hr_wrapper_target_check_var "$HR_RUN_MAIN" "$top"; then
    HR_RUN_REFUSAL=$HR_TARGET_REFUSAL
    return 1
  fi
  HR_RUN_COPY_TOP=$top
  HR_RUN_COPY_GITDIR=$HR_TARGET_GITDIR
  HR_RUN_COPY_KIND=$HR_TARGET_KIND
  if hr_wrapper_branch_var "$HR_RUN_MAIN" "$HR_RUN_COPY_GITDIR"; then
    case "$HR_WRAPPER_BRANCH" in
      -*) ;;
      *) HR_RUN_COPY_BRANCH=$HR_WRAPPER_BRANCH ;;
    esac
  fi
  if [ "$HR_RUN_COPY_KIND" = clone ]; then
    [ -n "$HR_RUN_COPY_BRANCH" ] || return 0
    if ! hr_copy_sync_in_var "$HR_RUN_MAIN" "$HR_RUN_COPY_GITDIR" "$HR_RUN_COPY_BRANCH"; then
      HR_RUN_REFUSAL=$HR_SYNC_REFUSAL
      return 1
    fi
    HR_RUN_COPY_TIP=$(hr_run_main_git rev-parse --verify --quiet "refs/heads/$HR_RUN_COPY_BRANCH^{commit}" 2>/dev/null) || HR_RUN_COPY_TIP=""
    return 0
  fi
  if [ "$HR_RUN_COPY_GITDIR" = "$HR_RUN_MAIN/.git" ]; then
    head=HEAD
  else
    head="worktrees/${HR_RUN_COPY_GITDIR##*/}/HEAD"
  fi
  HR_RUN_COPY_TIP=$(hr_run_main_git rev-parse --verify --quiet "$head^{commit}" 2>/dev/null) || HR_RUN_COPY_TIP=""
  return 0
}

# The two pinned runners. Each writes only what its caller's arguments ask, and
# returns 1 without running git when the globals it needs are not set.
# `hr_run_main_git` is `hr_copy_sync_main_git` on `HR_RUN_MAIN`, whose header
# states the main-side pins.
hr_run_main_git() {
  [ -n "${HR_RUN_MAIN-}" ] || return 1
  hr_copy_sync_main_git "$HR_RUN_MAIN" "$@"
}

hr_run_copy_git() {
  [ -n "${HR_RUN_MAIN-}" ] && [ -n "${HR_RUN_COPY_GITDIR-}" ] && [ -n "${HR_RUN_COPY_TOP-}" ] || return 1
  hr_copy_git_at "$HR_RUN_MAIN" "$HR_RUN_COPY_GITDIR" "$HR_RUN_COPY_TOP" "$@"
}

# hr_copy_git_at <canonical-main> <copy-gitdir> <copy-top> <git-args>... — the
# one body of the copy-side pins: objects and refs from `<main>/.git`, the
# index borrowed from `<copy-gitdir>/index`, the working tree <copy-top>, and
# the main-side pins `hr_copy_sync_main_git` states. `hr_run_copy_git` calls it
# on the `HR_RUN_*` globals; `hr_clone_create_var` calls it directly because
# those globals are not set while a clone is being created. Reads no global.
hr_copy_git_at() {
  local main="${1-}" gd="${2-}" top="${3-}"
  [ -n "$main" ] && [ -n "$gd" ] && [ -n "$top" ] || return 1
  shift 3
  GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null \
  GIT_DIR="$main/.git" GIT_INDEX_FILE="$gd/index" GIT_WORK_TREE="$top" \
    git -C "$top" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false -c advice.graftFileDeprecated=false "$@"
}

# 0 when the copy's working tree matches its index and its index matches
# `HR_RUN_COPY_TIP`; 1 otherwise, including an empty tip.
hr_run_copy_clean() {
  [ -n "${HR_RUN_COPY_TIP-}" ] || return 1
  hr_run_copy_git diff --quiet --no-ext-diff --ignore-submodules >/dev/null 2>&1 || return 1
  hr_run_copy_git diff-index --cached --quiet --ignore-submodules "$HR_RUN_COPY_TIP" -- >/dev/null 2>&1 || return 1
  return 0
}

# hr_run_protected_rel_paths <main> — print the worktree-relative protected set,
# one path per line, from `<main>/harness.config.json` alone. The mirror of
# `copySurfacePaths` the header's MIRROR block names: same order, same spelling.
# 1, printing nothing, when the configuration cannot be read.
hr_run_protected_rel_paths() {
  local main="${1-}" hooks scripts="" status
  [ -n "$main" ] || return 1
  hr_config_load "$main" || return 1
  hooks=$(hr_githooks_dir "$main") || return 1
  hr_docs_retrieval_applies "$main"
  status=$?
  case "$status" in
    0) scripts=$(hr_scripts_dir "$main") || return 1 ;;
    1) ;;
    *) return 1 ;;
  esac
  printf '%s\n' "$hooks" .mcp.json .claude/settings.json .claude/settings.local.json
  [ -z "$scripts" ] || printf '%s\n' "$scripts/docs-search-server.sh" "$scripts/lib"
  return 0
}

# Set `HR_RUN_TRUSTED_BASE` to the default branch's commit as origin reports it
# now, from `HR_RUN_MAIN`. 0 at once, with no network call, when it is already
# set; 1 with `HR_RUN_REFUSAL` naming the failed step otherwise, with no
# fallback to a local ref.
#
# The base is origin's answer and never a ref: a sandboxed session can write
# the common directory's `refs/`, `packed-refs` and `FETCH_HEAD`, so a run that
# points `refs/remotes/origin/<defaultBranch>` at its own tip makes
# `merge-base(tip, base)` the tip and every diff against it empty.
# `ls-remote`'s answer is held in a shell variable no session can reach, and
# `cat-file -e` proves the fetch brought that object. `--refmap=` with no
# destination keeps the fetch from moving `refs/remotes/origin/<defaultBranch>`.
# A run that cannot reach origin is refused: an unattended run needs the network
# for its model API in any case.
hr_run_trusted_base_var() {
  local base out line oid found="" count=0 tab=$'\t' why="cannot establish the default branch's commit from origin"
  [ -z "${HR_RUN_TRUSTED_BASE-}" ] || return 0
  HR_RUN_REFUSAL=""
  if [ -z "${HR_RUN_MAIN-}" ]; then
    HR_RUN_REFUSAL="$why: no main checkout is set"
    return 1
  fi
  base=$(hr_default_branch "$HR_RUN_MAIN") || base=""
  case "$base" in
    '' | -*)
      HR_RUN_REFUSAL="$why: no usable defaultBranch in '$HR_RUN_MAIN/harness.config.json'"
      return 1
      ;;
  esac
  if ! hr_remote_url_configured "$HR_RUN_MAIN" origin; then
    HR_RUN_REFUSAL="$why: $HR_RUN_MAIN/.git/config names no URL for remote 'origin'"
    return 1
  fi
  if ! out=$(hr_run_main_git ls-remote --exit-code origin "refs/heads/$base" 2>/dev/null); then
    HR_RUN_REFUSAL="$why: 'git ls-remote origin refs/heads/$base' failed or found no such branch"
    return 1
  fi
  while IFS= read -r line; do
    [ "${line#*"$tab"}" = "refs/heads/$base" ] || continue
    count=$((count + 1))
    found=${line%%"$tab"*}
  done <<EOF
$out
EOF
  oid=$found
  case "$oid" in
    '' | *[!0-9a-f]*) count=0 ;;
  esac
  if [ "$count" -ne 1 ] || { [ "${#oid}" -ne 40 ] && [ "${#oid}" -ne 64 ]; }; then
    HR_RUN_REFUSAL="$why: origin's answer for refs/heads/$base is not one object id"
    return 1
  fi
  if ! hr_run_main_git fetch --quiet --no-recurse-submodules --refmap= origin "refs/heads/$base" >/dev/null 2>&1; then
    HR_RUN_REFUSAL="$why: 'git fetch origin refs/heads/$base' failed"
    return 1
  fi
  if ! hr_run_main_git cat-file -e "$oid^{commit}" 2>/dev/null; then
    HR_RUN_REFUSAL="$why: the fetch did not bring commit $oid"
    return 1
  fi
  HR_RUN_TRUSTED_BASE=$oid
  return 0
}

# hr_run_worktree_diff_var <tip> <path>... — set `HR_RUN_WT_DIFF` to the paths
# under <path>... where the copy's working tree differs from <tip>, plus every
# file there <tip> does not hold, ignored ones included. Judged through a fresh
# temporary index read from <tip>, never the record's `index`: a sandboxed
# session can write that index's skip-worktree / assume-unchanged bits and stat
# data, which make git skip a file. 0 compared (`HR_RUN_WT_DIFF` may be empty);
# 1 the temporary index or a git call failed.
hr_run_worktree_diff_var() {
  local tip="${1-}" tmpdir out untracked status
  HR_RUN_WT_DIFF=""
  shift
  [ -n "$tip" ] && [ "$#" -gt 0 ] && [ -n "${HR_RUN_MAIN-}" ] && [ -n "${HR_RUN_COPY_TOP-}" ] || return 1
  tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/hr-surface-index.XXXXXX") || return 1
  if ! GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$tmpdir/index" GIT_WORK_TREE="$HR_RUN_COPY_TOP" \
    git -C "$HR_RUN_COPY_TOP" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false -c advice.graftFileDeprecated=false \
    read-tree "$tip" >/dev/null 2>&1; then
    rm -rf "$tmpdir"
    return 1
  fi
  out=$(GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$tmpdir/index" GIT_WORK_TREE="$HR_RUN_COPY_TOP" \
    git -C "$HR_RUN_COPY_TOP" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false -c advice.graftFileDeprecated=false \
    diff --name-only --exit-code --no-renames --no-ext-diff --no-textconv --ignore-submodules -- "$@" 2>/dev/null)
  status=$?
  if [ "$status" -gt 1 ] || ! untracked=$(GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$tmpdir/index" GIT_WORK_TREE="$HR_RUN_COPY_TOP" \
    git -C "$HR_RUN_COPY_TOP" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false -c advice.graftFileDeprecated=false \
    ls-files --others -- "$@" 2>/dev/null); then
    rm -rf "$tmpdir"
    return 1
  fi
  rm -rf "$tmpdir"
  HR_RUN_WT_DIFF="$out${out:+${untracked:+
}}$untracked"
  return 0
}

# hr_run_surface_check_var <tip> <mode> — 0 when the protected set
# (`hr_run_protected_rel_paths`) is unchanged from the merge base of <tip> and
# `HR_RUN_TRUSTED_BASE`; 1 otherwise, with `HR_RUN_SURFACE_REFUSAL` naming each
# differing path and the base, never a file's contents. No trusted base or no
# merge base is a refusal, never a fallback. <mode>:
#   tree   the commit <tip> against the base;
#   copy   `tree`, plus the copy's working tree on the set against <tip>
#          through a fresh index, untracked and ignored files included;
#   reset  the same as `copy`: a reset cannot be relied on to overwrite a
#          file the record's index marks skip-worktree.
hr_run_surface_check_var() {
  local tip="${1-}" mode="${2-}" set base out status p names=""
  local -a paths
  paths=()
  HR_RUN_SURFACE_REFUSAL=""
  case "$mode" in
    tree | copy | reset) ;;
    *)
      HR_RUN_SURFACE_REFUSAL="unknown surface check mode '$mode'"
      return 1
      ;;
  esac
  if [ -z "$tip" ]; then
    HR_RUN_SURFACE_REFUSAL="no commit to check the protected surface of"
    return 1
  fi
  if [ "$mode" != tree ] && [ -z "${HR_RUN_COPY_TOP-}" ]; then
    HR_RUN_SURFACE_REFUSAL="no checked working copy to check the protected surface in"
    return 1
  fi
  if ! hr_run_trusted_base_var; then
    HR_RUN_SURFACE_REFUSAL=$HR_RUN_REFUSAL
    return 1
  fi
  base=$(hr_run_main_git merge-base "$tip" "$HR_RUN_TRUSTED_BASE" 2>/dev/null) || base=""
  if [ -z "$base" ]; then
    HR_RUN_SURFACE_REFUSAL="'$tip' has no merge base with origin's default-branch commit $HR_RUN_TRUSTED_BASE"
    return 1
  fi
  if ! set=$(hr_run_protected_rel_paths "$HR_RUN_MAIN"); then
    HR_RUN_SURFACE_REFUSAL="cannot read the protected set from '$HR_RUN_MAIN/harness.config.json'"
    return 1
  fi
  while IFS= read -r p; do
    [ -z "$p" ] || paths[${#paths[@]}]=$p
  done <<EOF
$set
EOF
  if [ "${#paths[@]}" -eq 0 ]; then
    HR_RUN_SURFACE_REFUSAL="the protected set read from '$HR_RUN_MAIN/harness.config.json' is empty"
    return 1
  fi

  out=$(hr_run_main_git diff --name-only --exit-code --no-renames --no-ext-diff --no-textconv "$base" "$tip" -- "${paths[@]}" 2>/dev/null)
  status=$?
  case "$status" in
    0) ;;
    1) names=$out ;;
    *)
      HR_RUN_SURFACE_REFUSAL="cannot compare '$tip' with the merge base $base"
      return 1
      ;;
  esac
  if [ "$mode" != tree ]; then
    if ! hr_run_worktree_diff_var "$tip" "${paths[@]}"; then
      HR_RUN_SURFACE_REFUSAL="cannot compare '$HR_RUN_COPY_TOP' with '$tip' on the protected set"
      return 1
    fi
    [ -z "$HR_RUN_WT_DIFF" ] || names="${names:+$names
}$HR_RUN_WT_DIFF"
  fi
  [ -n "$names" ] || return 0
  HR_RUN_SURFACE_REFUSAL="the protected surface differs from the merge base $base with origin's default branch: $(printf '%s\n' "$names" | LC_ALL=C sort -u | tr '\n' ' ')"
  HR_RUN_SURFACE_REFUSAL=${HR_RUN_SURFACE_REFUSAL% }
  return 1
}

# hr_run_fast_forward_var <ref> — move `refs/heads/$HR_RUN_COPY_BRANCH` and the
# copy's index and tree from `HR_RUN_COPY_TIP` to <ref>'s commit, by
# `refresh-branch.sh`'s sequence with no merge commit: the dry-run `read-tree`,
# the compare-and-swap `hr_copy_ref_swap_var` (on a clone, the clone's ref
# first), the real `read-tree`, and a put-back through the same helper with
# <new> and <old> exchanged.
#   0  moved, or already at or ahead of <ref> with nothing written (`merge
#      --ff-only`'s "already up to date"); `HR_RUN_COPY_TIP` is the branch's
#      commit;
#   1  refused or failed with nothing changed, `HR_RUN_FF_REFUSAL` set;
#   5  the branch moved, the tree refused and the put-back of either side
#      failed (`refresh-branch.sh`'s exit 5), or, on a clone, the clone's
#      `refs/heads/<branch>` moved, the main checkout's could not follow and
#      the rollback failed; `HR_RUN_FF_REFUSAL` set.
hr_run_fast_forward_var() {
  local ref="${1-}" tip="${HR_RUN_COPY_TIP-}" branch="${HR_RUN_COPY_BRANCH-}" new swap
  HR_RUN_FF_REFUSAL=""
  if [ -z "$branch" ] || [ -z "$tip" ]; then
    HR_RUN_FF_REFUSAL="the working copy has no branch or no commit to fast-forward"
    return 1
  fi
  case "$ref" in
    '' | -*)
      HR_RUN_FF_REFUSAL="'$ref' is not a revision to fast-forward to"
      return 1
      ;;
  esac
  new=$(hr_run_main_git rev-parse --verify --quiet "$ref^{commit}" 2>/dev/null) || new=""
  if [ -z "$new" ]; then
    HR_RUN_FF_REFUSAL="'$ref' does not resolve to a commit in '$HR_RUN_MAIN'"
    return 1
  fi
  [ "$new" != "$tip" ] || return 0
  ! hr_run_main_git merge-base --is-ancestor "$new" "$tip" 2>/dev/null || return 0
  if ! hr_run_main_git merge-base --is-ancestor "$tip" "$new" 2>/dev/null; then
    HR_RUN_FF_REFUSAL="'$branch' is not an ancestor of '$ref', so it cannot be fast-forwarded"
    return 1
  fi
  if ! hr_run_copy_clean; then
    HR_RUN_FF_REFUSAL="uncommitted tracked changes in '$HR_RUN_COPY_TOP'"
    return 1
  fi
  if ! hr_run_surface_check_var "$new" tree; then
    HR_RUN_FF_REFUSAL=$HR_RUN_SURFACE_REFUSAL
    return 1
  fi
  if ! hr_run_copy_git read-tree -n --no-recurse-submodules -m -u "$tip" "$new"; then
    HR_RUN_FF_REFUSAL="'$HR_RUN_COPY_TOP' cannot be updated to '$ref' (an untracked or changed file is in the way)"
    return 1
  fi
  swap=0
  hr_copy_ref_swap_var "$HR_RUN_MAIN" "$HR_RUN_COPY_GITDIR" "refs/heads/$branch" "$new" "$tip" "fast-forward to $ref" || swap=$?
  case "$swap" in
    0) ;;
    5)
      HR_RUN_FF_REFUSAL="'$branch' could not be fast-forwarded to '$ref': $HR_SYNC_REFUSAL"
      return 5
      ;;
    *)
      HR_RUN_FF_REFUSAL="'$branch' moved, or its ref could not be locked: $HR_SYNC_REFUSAL"
      return 1
      ;;
  esac
  if hr_run_copy_git read-tree --no-recurse-submodules -m -u "$tip" "$new"; then
    HR_RUN_COPY_TIP=$new
    return 0
  fi
  if hr_copy_ref_swap_var "$HR_RUN_MAIN" "$HR_RUN_COPY_GITDIR" "refs/heads/$branch" "$tip" "$new" "undo fast-forward to $ref"; then
    HR_RUN_FF_REFUSAL="'$HR_RUN_COPY_TOP' could not be updated to '$ref'; '$branch' was put back"
    return 1
  fi
  HR_RUN_FF_REFUSAL="'$HR_RUN_COPY_TOP' could not be updated to '$ref', and putting '$branch' back failed too: $HR_SYNC_REFUSAL"
  return 5
}

# hr_run_reset_var — the watchdog's reset of the copy to `HR_RUN_COPY_TIP`. It
# moves no ref, so no ref hook runs, no `ORIG_HEAD` is written and a clone needs
# no sync-out: the copy check's sync-in already made `HR_RUN_COPY_TIP` the
# clone's tip.
#   0  reset;
#   1  refused with nothing written, `HR_RUN_RESET_REFUSAL` set from the
#      `reset` surface check, which also compares the copy's working tree on
#      the protected set with the tip, an unreachable origin included;
#   3  `read-tree` failed after the check passed.
hr_run_reset_var() {
  HR_RUN_RESET_REFUSAL=""
  if [ -z "${HR_RUN_COPY_TIP-}" ]; then
    HR_RUN_RESET_REFUSAL="the working copy has no commit to reset to"
    return 1
  fi
  if ! hr_run_surface_check_var "$HR_RUN_COPY_TIP" reset; then
    HR_RUN_RESET_REFUSAL=$HR_RUN_SURFACE_REFUSAL
    return 1
  fi
  hr_run_copy_git read-tree --reset -u --no-recurse-submodules "$HR_RUN_COPY_TIP" || return 3
  return 0
}

# hr_run_blob_var <rel> <file_mode> — the library's one hashing site: set
# `HR_RUN_BLOB_MODE` and `HR_RUN_BLOB` for `$HR_RUN_COPY_TOP/<rel>`. <rel> is
# taken as written, so it must already be normalised: an empty or absolute
# <rel>, an empty, `.` or `..` segment, a symbolic link in any parent segment
# and a parent that is not a directory are refused (1). A symbolic-link leaf is
# allowed. <file_mode> is `100644`, or `auto` (`100755` for an executable
# file, `100644` otherwise).
#   absent leaf     mode `0`, `HR_RUN_BLOB` empty: a removal;
#   symbolic link   `120000`, its link text hashed;
#   regular file    <file_mode>, its content hashed;
#   anything else   (a directory, a submodule, a special file) 1.
# Both hashes are `hash-object -w --no-filters` (`hr_commit_paths_var` states
# why). A parent swapped for a symbolic link between this walk and the hash is
# the same race `hr_commit_placed` already carried.
hr_run_blob_var() {
  local rel="${1-}" file_mode="${2-}" top="${HR_RUN_COPY_TOP-}" rest seg cur leaf link
  HR_RUN_BLOB=""
  HR_RUN_BLOB_MODE=""
  [ -n "$top" ] && [ -n "$rel" ] || return 1
  case "$file_mode" in 100644 | auto) ;; *) return 1 ;; esac
  case "/$rel/" in
    //* | */./* | */../* | *//*) return 1 ;;
  esac
  cur=$top
  rest=$rel
  while :; do
    seg=${rest%%/*}
    [ "$seg" != "$rest" ] || break
    rest=${rest#*/}
    cur="$cur/$seg"
    [ ! -L "$cur" ] || return 1
    if [ ! -e "$cur" ]; then
      HR_RUN_BLOB_MODE=0
      return 0
    fi
    [ -d "$cur" ] || return 1
  done
  leaf="$cur/$rest"
  if [ -L "$leaf" ]; then
    link=$(readlink -- "$leaf" && printf x) || return 1
    link=${link%?}
    link=${link%$'\n'}
    HR_RUN_BLOB=$(printf '%s' "$link" | hr_run_main_git hash-object -w --no-filters --stdin) || HR_RUN_BLOB=""
    [ -n "$HR_RUN_BLOB" ] || return 1
    HR_RUN_BLOB_MODE=120000
    return 0
  fi
  if [ ! -e "$leaf" ]; then
    HR_RUN_BLOB_MODE=0
    return 0
  fi
  [ -f "$leaf" ] || return 1
  HR_RUN_BLOB=$(hr_run_main_git hash-object -w --no-filters -- "$leaf") || HR_RUN_BLOB=""
  [ -n "$HR_RUN_BLOB" ] || return 1
  if [ "$file_mode" = auto ] && [ -x "$leaf" ]; then
    HR_RUN_BLOB_MODE=100755
  else
    HR_RUN_BLOB_MODE=100644
  fi
  return 0
}

# hr_commit_paths_var <main> <top> <gitdir> <branch> <tip> <file_mode> <sync>
#   <reflog_subject> <rel>... -- <message>... — the library's one commit: the
# working copy at <top> (record <gitdir>) on `refs/heads/<branch>` at <tip>,
# plus exactly <rel>..., by plumbing in <main>. It reads no record: the
# caller's own checks supplied every value, and the runner globals are set
# from them (`hr_run_main_set_var <main>`, then the `HR_RUN_COPY_*` four), so
# every call is `hr_run_main_git` / `hr_run_copy_git`. Each <rel> becomes one
# `hr_run_blob_var` record (<file_mode> passed through); the records are
# applied to a `mktemp -d` index seeded from <tip>, `write-tree` builds the
# tree, `commit-tree <tree> -p <tip>` the commit with one `-m` per <message>,
# and `hr_copy_ref_swap_var` moves the branch as a compare-and-swap from <tip>
# (on a clone, the clone's ref first, the main checkout's with
# `-m <reflog_subject>` second). After a moved ref, `HR_RUN_COPY_TIP` and
# `HR_COMMIT_NEW` are the new commit and the same records are applied to the
# copy's own index.
#   0  committed;
#   3  the tree equals <tip>'s, nothing committed;
#   4  the swap was lost or could not be locked, or the main swap failed and
#      the clone was rolled back: only objects were written;
#   1  anything else, `HR_COMMIT_REFUSAL` set to one sentence naming a path,
#      never a file's contents — including the copy's index failing to take the
#      records after a moved ref, when `HR_COMMIT_NEW` is still set, and, on a
#      clone, the commit standing on the clone's `refs/heads/<branch>` while
#      the main checkout's could not follow and the rollback failed (the swap's
#      `5`; the next sync-in fast-forwards it), when `HR_COMMIT_NEW` is set and
#      `HR_COMMIT_SYNC_FAILED` is 1 (empty on every other path).
# <sync> `committed` syncs the copy's index on 0 only; `always` also on 3 and 4.
# The temporary directory is removed on every return path. git's own stderr is
# left to the caller.
#
# THE FILTER POLICY, stated once for every commit this library writes: every
# blob is hashed with `--no-filters` (`hr_run_blob_var`), so no filter driver a
# run-written `.gitattributes` selects ever runs. The cost: content is stored
# exactly as the working tree holds it, so neither an eol conversion nor a
# clean filter is applied.
hr_commit_paths_var() {
  local main="${1-}" top="${2-}" gitdir="${3-}" branch="${4-}" tip="${5-}"
  local file_mode="${6-}" sync="${7-}" reflog="${8-}"
  local tmpdir records tip_c tip_tree null tree commit rel saw_sep=0 n swap
  local -a rels msg_args
  rels=()
  msg_args=()
  HR_COMMIT_REFUSAL=""
  HR_COMMIT_NEW=""
  HR_COMMIT_SYNC_FAILED=""
  if [ "$#" -lt 8 ]; then
    HR_COMMIT_REFUSAL="hr_commit_paths_var needs <main> <top> <gitdir> <branch> <tip> <file_mode> <sync> <reflog_subject>"
    return 1
  fi
  shift 8
  while [ "$#" -gt 0 ]; do
    if [ "$1" = -- ]; then
      saw_sep=1
      shift
      break
    fi
    rels[${#rels[@]}]=$1
    shift
  done
  while [ "$#" -gt 0 ]; do
    msg_args[${#msg_args[@]}]=-m
    msg_args[${#msg_args[@]}]=$1
    shift
  done
  if [ "$saw_sep" -ne 1 ] || [ "${#msg_args[@]}" -eq 0 ]; then
    HR_COMMIT_REFUSAL="no commit message was given after '--'"
    return 1
  fi
  case "$file_mode" in 100644 | auto) ;; *)
    HR_COMMIT_REFUSAL="unknown file mode '$file_mode'"
    return 1
    ;;
  esac
  case "$sync" in committed | always) ;; *)
    HR_COMMIT_REFUSAL="unknown index sync '$sync'"
    return 1
    ;;
  esac
  case "$branch" in '' | -*)
    HR_COMMIT_REFUSAL="'$branch' is not a branch to commit on"
    return 1
    ;;
  esac
  if [ -z "$top" ] || [ -z "$gitdir" ] || [ -z "$tip" ] || [ -z "$reflog" ]; then
    HR_COMMIT_REFUSAL="the working copy, its record, the tip and the reflog subject are all required"
    return 1
  fi
  if ! hr_run_main_set_var "$main"; then
    HR_COMMIT_REFUSAL=$HR_RUN_REFUSAL
    return 1
  fi
  HR_RUN_COPY_TOP=$top
  HR_RUN_COPY_GITDIR=$gitdir
  HR_RUN_COPY_BRANCH=$branch
  HR_RUN_COPY_TIP=$tip
  tip_c=$(hr_run_main_git rev-parse --verify --quiet "$tip^{commit}" 2>/dev/null) || tip_c=""
  tip_tree=$(hr_run_main_git rev-parse --verify --quiet "$tip^{tree}" 2>/dev/null) || tip_tree=""
  if [ -z "$tip_c" ] || [ -z "$tip_tree" ]; then
    HR_COMMIT_REFUSAL="'$tip' is not a commit in '$HR_RUN_MAIN'"
    return 1
  fi
  null=${tip_c//?/0}

  if ! tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/hr-commit-index.XXXXXX"); then
    HR_COMMIT_REFUSAL="cannot create a temporary index directory"
    return 1
  fi
  records="$tmpdir/records"
  if ! : >"$records"; then
    rm -rf "$tmpdir"
    HR_COMMIT_REFUSAL="cannot write the index records in '$tmpdir'"
    return 1
  fi
  n=0
  while [ "$n" -lt "${#rels[@]}" ]; do
    rel=${rels[$n]}
    n=$((n + 1))
    if ! hr_run_blob_var "$rel" "$file_mode"; then
      rm -rf "$tmpdir"
      HR_COMMIT_REFUSAL="'$rel' is not a regular file or a symbolic link reached without a symbolic link in '$top'"
      return 1
    fi
    if [ "$HR_RUN_BLOB_MODE" = 0 ]; then
      printf '0 %s\t%s\0' "$null" "$rel" >>"$records" || {
        rm -rf "$tmpdir"
        HR_COMMIT_REFUSAL="cannot write the index records in '$tmpdir'"
        return 1
      }
    else
      printf '%s %s\t%s\0' "$HR_RUN_BLOB_MODE" "$HR_RUN_BLOB" "$rel" >>"$records" || {
        rm -rf "$tmpdir"
        HR_COMMIT_REFUSAL="cannot write the index records in '$tmpdir'"
        return 1
      }
    fi
  done

  tree=""
  if GIT_INDEX_FILE="$tmpdir/index" hr_run_main_git read-tree "$tip_c" &&
    GIT_INDEX_FILE="$tmpdir/index" hr_run_main_git update-index -z --index-info <"$records"; then
    tree=$(GIT_INDEX_FILE="$tmpdir/index" hr_run_main_git write-tree) || tree=""
  fi
  if [ -z "$tree" ]; then
    rm -rf "$tmpdir"
    HR_COMMIT_REFUSAL="git could not build the tree for '$branch' in '$HR_RUN_MAIN'"
    return 1
  fi

  if [ "$tree" = "$tip_tree" ]; then
    if [ "$sync" = always ] && ! hr_run_copy_git update-index -z --index-info <"$records"; then
      rm -rf "$tmpdir"
      HR_COMMIT_REFUSAL="the index of '$top' could not take the given paths"
      return 1
    fi
    rm -rf "$tmpdir"
    return 3
  fi

  commit=$(hr_run_main_git commit-tree "$tree" -p "$tip_c" "${msg_args[@]}") || commit=""
  if [ -z "$commit" ]; then
    rm -rf "$tmpdir"
    HR_COMMIT_REFUSAL="git could not write the commit for '$branch' in '$HR_RUN_MAIN' (an unset user.name or user.email is the usual cause)"
    return 1
  fi
  swap=0
  hr_copy_ref_swap_var "$HR_RUN_MAIN" "$gitdir" "refs/heads/$branch" "$commit" "$tip_c" "$reflog" || swap=$?
  case "$swap" in
    0 | 5) ;;
    4)
      if [ "$sync" = always ] && ! hr_run_copy_git update-index -z --index-info <"$records"; then
        rm -rf "$tmpdir"
        HR_COMMIT_REFUSAL="'$branch' moved or could not be locked, and the index of '$top' could not take the given paths"
        return 1
      fi
      rm -rf "$tmpdir"
      return 4
      ;;
    *)
      rm -rf "$tmpdir"
      HR_COMMIT_REFUSAL="'$branch' could not be moved: $HR_SYNC_REFUSAL"
      return 1
      ;;
  esac
  HR_RUN_COPY_TIP=$commit
  HR_COMMIT_NEW=$commit
  if [ "$swap" -eq 5 ]; then
    HR_COMMIT_SYNC_FAILED=1
    HR_COMMIT_REFUSAL="the main checkout's refs/heads/$branch in '$HR_RUN_MAIN' could not follow the clone's to $commit ($HR_SYNC_REFUSAL); the next sync-in fast-forwards it"
    hr_run_copy_git update-index -z --index-info <"$records" ||
      HR_COMMIT_REFUSAL="$HR_COMMIT_REFUSAL, and the index of '$top' could not take the committed paths"
    rm -rf "$tmpdir"
    return 1
  fi
  if ! hr_run_copy_git update-index -z --index-info <"$records"; then
    rm -rf "$tmpdir"
    HR_COMMIT_REFUSAL="'$branch' moved to $commit, but the index of '$top' could not take the committed paths"
    return 1
  fi
  rm -rf "$tmpdir"
  return 0
}

# ---------------------------------------------------------------------------
# THE CLONE ARM'S SYNC.
#
# A clone's objects reach the main repository only by a fetch, which hashes
# every object it receives; a clone's ref is set only from a value read in the
# main repository. The order on a clone: sync in; operate; move the clone's
# ref first by compare-and-swap against the tip sync-in read, then the main
# checkout's; roll the clone back on a failed main swap
# (`hr_copy_ref_swap_var`). A commit landing in the clone after sync-in so
# loses the clone's swap with nothing moved on either side. Sync-in brings a
# clone's `refs/heads/<branch>` into the main checkout, and heals a clone
# strictly behind it. Two paths still move the main checkout first and sync
# out after (`hr_copy_sync_out_var`): `push-branch.sh`'s `origin/<branch>`
# mirror and `refresh-branch.sh`'s fetched-base mirror, both remote-tracking
# refs no run commits to. All four are no-ops for the main checkout and a
# worktree (`hr_copy_kind`), except the swap, which there moves the main
# checkout's ref alone. Every caller runs `hr_wrapper_target_check_var` first,
# so the clone's configuration has passed the allow-list; no function here
# checks it again.
#
# THE GLOBALS CONTRACT. No function here reads or writes `HR_RUN_MAIN`,
# `HR_RUN_TRUSTED_BASE`, `HR_RUN_REFUSAL` or any `HR_RUN_COPY_*` global, calls
# `hr_run_main_set_var` or `hr_run_main_git`, or changes any `HR_TARGET_*`,
# `HR_WRAPPER_*` or `HR_COMMIT_*` global. Each takes its main checkout from its
# own <main> argument, canonicalized on the clone arm by the predicate
# `hr_run_main_set_var` applies, and drives the main side through
# `hr_copy_sync_main_git`, the one body of the main-side pins, which
# `hr_run_main_git` wraps. They set only
# `HR_SYNC_TIP` (sync-in) and `HR_SYNC_REFUSAL`, both cleared at entry.
#
# THE PINS. Main side: `hr_copy_sync_main_git`'s, stated in its header. The fetch and
# the `ls-remote` that reads the clone's tip add `--upload-pack` running the
# clone side's `git-upload-pack` under `-c core.hooksPath=/dev/null -c
# core.fsmonitor=false`; the fetch adds `--no-tags --no-recurse-submodules`
# and `--refmap=` with no destination, so it moves no ref. The clone's tip is
# held in a shell variable and `cat-file -e` proves the fetch brought it, so
# nothing the sandbox can write, `FETCH_HEAD` included, is read back. Which of
# the clone's own configuration keys a local-transport fetch honours, and
# whether a hook, filter or fsmonitor in the clone runs during it, is measured
# in `docs/cli.md` §6, the measured fetch pins (added by this branch);
# `cli/test/clone-sync.test.mjs` re-checks it. Every `update-ref` of a clone's
# ref (sync-out, the swap, the heal) runs
# with `GIT_DIR` and `GIT_COMMON_DIR` both the clone's gitdir, so a
# `commondir` planted after the check cannot redirect the write, and
# `GIT_OBJECT_DIRECTORY` the main repository's store, so the object-existence
# test reads that store: it runs through `hr_clone_git`, whose header states
# the clone-side pins. Nothing here needs more than git 2.23; no `fetch
# --no-write-fetch-head`. Write exception 6 in the header is this section's.
#
# Every `_var` function here sets globals and must be called directly, never
# inside `$(…)`.
# ---------------------------------------------------------------------------

# Print <main> canonical when `cd -P` succeeds and `<main>/.git` is a real
# directory, not a symbolic link, holding no `commondir` — the predicate
# `hr_run_main_set_var` applies; print nothing and return 1 otherwise.
hr_copy_sync_main_of() {
  local main="${1-}" c
  [ -n "$main" ] || return 1
  c=$( CDPATH= cd -P -- "$main" 2>/dev/null && pwd -P ) || return 1
  if [ -L "$c/.git" ] || [ ! -d "$c/.git" ] || [ -e "$c/.git/commondir" ] || [ -L "$c/.git/commondir" ]; then
    return 1
  fi
  printf '%s\n' "$c"
}

# hr_copy_sync_main_git <canonical-main> <git-args>... — the one body of the
# main-side pins, on the main checkout named by the argument; `hr_run_main_git`
# is its `HR_RUN_MAIN` wrapper. The pins: `GIT_NO_REPLACE_OBJECTS=1`,
# `GIT_GRAFT_FILE=/dev/null`, `-c core.hooksPath=/dev/null -c
# core.fsmonitor=false -c submodule.recurse=false -c
# advice.graftFileDeprecated=false`. Reads no `HR_RUN_*` global.
hr_copy_sync_main_git() {
  local main="${1-}"
  [ -n "$main" ] || return 1
  shift
  GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null \
    git -C "$main" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false -c advice.graftFileDeprecated=false "$@"
}

# hr_copy_sync_in_var <main> <gitdir> <branch> — on a clone, bring the clone's
# `refs/heads/<branch>` into <main> and set `HR_SYNC_TIP` to <main>'s
# `refs/heads/<branch>` commit afterwards. <main>'s ref moves only forward, by
# a compare-and-swap `update-ref`; equal is a no-op. A clone strictly behind
# <main> (a ref move that stopped after the clone's half was rolled back, or
# one made by hand) is healed: the clone's index and working tree are moved to
# <main>'s tip by a two-tree `read-tree -m -u` (dry run first, refused with
# nothing moved when a changed or untracked file is in the way) and its ref by
# a compare-and-swap through `hr_clone_git` from the tip `ls-remote` read, put
# back if the real `read-tree` refuses, and the sync is then a no-op. Refused: an empty or `-`-led branch, a branch
# <main> or any of its worktrees has checked out (the guard git's
# one-branch-one-checkout rule gives a worktree), a branch <main> lacks, a
# heal whose compare-and-swap fails, and a diverged clone. 0 synced, healed or
# a no-op (main or worktree, `HR_SYNC_TIP` empty); 1 with `HR_SYNC_REFUSAL`
# set to one sentence naming the branch and the failed step.
hr_copy_sync_in_var() {
  local main="${1-}" gitdir="${2-}" branch="${3-}" kind cmain clone ref
  local up out line oid="" count=0 cur main_old status tab=$'\t'
  HR_SYNC_TIP=""
  HR_SYNC_REFUSAL=""
  kind=$(hr_copy_kind "$main" "$gitdir") || kind=""
  [ "$kind" = clone ] || return 0
  if ! cmain=$(hr_copy_sync_main_of "$main"); then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in: '$main' is not a main checkout"
    return 1
  fi
  # <main> given non-canonical can make `hr_copy_kind` call the main checkout
  # or a worktree a clone; re-judged against the canonical path.
  kind=$(hr_copy_kind "$cmain" "$gitdir") || kind=""
  [ "$kind" = clone ] || return 0
  clone=${gitdir%/.git}
  ref="refs/heads/$branch"
  case "$branch" in
    '' | -*)
      HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the branch name is empty or starts with '-'"
      return 1
      ;;
  esac
  if [ "$clone" = "$gitdir" ] || ! hr_copy_sync_main_git "$cmain" check-ref-format "$ref" >/dev/null 2>&1; then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$gitdir': not a valid branch name of a clone's .git"
    return 1
  fi
  cur=$(hr_copy_sync_main_git "$cmain" symbolic-ref -q HEAD 2>/dev/null) || cur=""
  if [ "$cur" = "$ref" ]; then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the main checkout '$cmain' has it checked out"
    return 1
  fi
  if ! out=$(hr_copy_sync_main_git "$cmain" worktree list --porcelain 2>/dev/null); then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': 'git worktree list' failed in '$cmain'"
    return 1
  fi
  while IFS= read -r line; do
    if [ "$line" = "branch $ref" ]; then
      HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': a checkout of '$cmain' has it checked out"
      return 1
    fi
  done <<EOF
$out
EOF
  if ! main_old=$(hr_copy_sync_main_git "$cmain" rev-parse --verify --quiet "$ref^{commit}" 2>/dev/null) || [ -z "$main_old" ]; then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the main checkout '$cmain' has no $ref"
    return 1
  fi
  up="git -c core.hooksPath=/dev/null -c core.fsmonitor=false upload-pack"
  if ! out=$(hr_copy_sync_main_git "$cmain" ls-remote --upload-pack="$up" "$clone" "$ref" 2>/dev/null); then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': reading the clone's $ref failed"
    return 1
  fi
  while IFS= read -r line; do
    [ "${line#*"$tab"}" = "$ref" ] || continue
    count=$((count + 1))
    oid=${line%%"$tab"*}
  done <<EOF
$out
EOF
  case "$oid" in
    '' | *[!0-9a-f]*) count=0 ;;
  esac
  if [ "$count" -ne 1 ] || { [ "${#oid}" -ne 40 ] && [ "${#oid}" -ne 64 ]; }; then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the clone's $ref is not one object id"
    return 1
  fi
  if ! hr_copy_sync_main_git "$cmain" fetch --quiet --no-tags --no-recurse-submodules --refmap= --upload-pack="$up" "$clone" "$ref" >/dev/null 2>&1; then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the fetch of $ref failed"
    return 1
  fi
  if ! hr_copy_sync_main_git "$cmain" cat-file -e "$oid^{commit}" 2>/dev/null; then
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the fetch did not bring commit $oid"
    return 1
  fi
  if [ "$oid" != "$main_old" ]; then
    hr_copy_sync_main_git "$cmain" merge-base --is-ancestor "$main_old" "$oid" 2>/dev/null
    status=$?
    case "$status" in
      0)
        if ! hr_copy_sync_main_git "$cmain" update-ref "$ref" "$oid" "$main_old" >/dev/null 2>&1; then
          HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': moving the main checkout's $ref from ${main_old:0:12} to ${oid:0:12} failed"
          return 1
        fi
        ;;
      1)
        hr_copy_sync_main_git "$cmain" merge-base --is-ancestor "$oid" "$main_old" 2>/dev/null
        status=$?
        case "$status" in
          0)
            if ! hr_copy_git_at "$cmain" "$gitdir" "$clone" read-tree -n --no-recurse-submodules -m -u "$oid" "$main_old" >/dev/null 2>&1; then
              HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the clone is behind the main checkout (${oid:0:12} to ${main_old:0:12}) and its working tree cannot take the main checkout's tip (a changed or untracked file is in the way)"
              return 1
            fi
            if ! hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$main_old" "$oid" >/dev/null 2>&1; then
              HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': healing the clone's $ref, which is behind the main checkout, from ${oid:0:12} to ${main_old:0:12} failed"
              return 1
            fi
            if ! hr_copy_git_at "$cmain" "$gitdir" "$clone" read-tree --no-recurse-submodules -m -u "$oid" "$main_old" >/dev/null 2>&1; then
              if hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$oid" "$main_old" >/dev/null 2>&1; then
                HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': its working tree refused the main checkout's tip ${main_old:0:12}; the clone's $ref was put back to ${oid:0:12}"
              else
                HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': its working tree refused the main checkout's tip ${main_old:0:12}, and putting the clone's $ref back to ${oid:0:12} failed too — inspect the clone by hand"
              fi
              return 1
            fi
            ;;
          1)
            HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the clone (${oid:0:12}) and the main checkout (${main_old:0:12}) have diverged"
            return 1
            ;;
          *)
            HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': comparing ${oid:0:12} with ${main_old:0:12} failed"
            return 1
            ;;
        esac
        ;;
      *)
        HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': comparing ${main_old:0:12} with ${oid:0:12} failed"
        return 1
        ;;
    esac
  fi
  if ! HR_SYNC_TIP=$(hr_copy_sync_main_git "$cmain" rev-parse --verify --quiet "$ref^{commit}" 2>/dev/null) || [ -z "$HR_SYNC_TIP" ]; then
    HR_SYNC_TIP=""
    HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': reading the main checkout's $ref afterwards failed"
    return 1
  fi
  return 0
}

# hr_copy_sync_out_var <main> <gitdir> <ref> [<expected_old>] — on a clone, set
# the clone's <ref> (`refs/heads/<name>` or `refs/remotes/origin/<name>`) to
# the commit <ref> names in <main>, as a compare-and-swap against
# <expected_old> when one is given (empty: the ref must not exist). 0 set or a
# no-op (main or worktree); 1 with `HR_SYNC_REFUSAL` set to one sentence.
hr_copy_sync_out_var() {
  local main="${1-}" gitdir="${2-}" ref="${3-}" kind cmain oid
  local -a old
  old=()
  HR_SYNC_REFUSAL=""
  kind=$(hr_copy_kind "$main" "$gitdir") || kind=""
  [ "$kind" = clone ] || return 0
  if ! cmain=$(hr_copy_sync_main_of "$main"); then
    HR_SYNC_REFUSAL="cannot sync '$ref' out: '$main' is not a main checkout"
    return 1
  fi
  kind=$(hr_copy_kind "$cmain" "$gitdir") || kind=""
  [ "$kind" = clone ] || return 0
  case "$ref" in
    refs/heads/?* | refs/remotes/origin/?*) ;;
    *)
      HR_SYNC_REFUSAL="cannot sync '$ref' out to '$gitdir': only refs/heads/<name> and refs/remotes/origin/<name> are synced"
      return 1
      ;;
  esac
  if [ "${gitdir%/.git}" = "$gitdir" ] || ! hr_copy_sync_main_git "$cmain" check-ref-format "$ref" >/dev/null 2>&1; then
    HR_SYNC_REFUSAL="cannot sync '$ref' out to '$gitdir': not a valid ref name of a clone's .git"
    return 1
  fi
  if [ "$#" -ge 4 ]; then
    case "${4-}" in
      *[!0-9a-f]*)
        HR_SYNC_REFUSAL="cannot sync '$ref' out to '$gitdir': the expected old value '${4-}' is not an object id"
        return 1
        ;;
    esac
    old=("${4-}")
  fi
  if ! oid=$(hr_copy_sync_main_git "$cmain" rev-parse --verify --quiet "$ref^{commit}" 2>/dev/null) || [ -z "$oid" ]; then
    HR_SYNC_REFUSAL="cannot sync '$ref' out to '$gitdir': it names no commit in the main checkout '$cmain'"
    return 1
  fi
  if ! hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$oid" ${old[@]+"${old[@]}"} >/dev/null 2>&1; then
    HR_SYNC_REFUSAL="cannot sync '$ref' out to '$gitdir': update-ref to ${oid:0:12} failed"
    return 1
  fi
  return 0
}

# hr_copy_ref_swap_var <main> <gitdir> <ref> <new> <old> <reflog> — move the
# branch <ref> (`refs/heads/<name>`) from the commit <old> to the commit <new>,
# both full object ids. On a clone (judged as `hr_copy_sync_out_var` judges
# it): a compare-and-swap of the clone's <ref> through `hr_clone_git`, then of
# <main>'s through `hr_copy_sync_main_git … update-ref -m <reflog>`, and, when
# the main swap fails, a compare-and-swap rollback of the clone's <ref> from
# <new> to <old>. On the main checkout or a worktree: the main swap alone.
# <new> equal to <old> is the verify-only form: on a clone, a locked
# compare-and-swap of the clone's <ref> onto itself and nothing else, proving
# it still holds the tip sync-in read.
#   0  both moved (verified);
#   4  nothing moved: the clone's <ref> moved since sync-in, or the main swap
#      failed and the clone was rolled back;
#   5  the clone's <ref> is at <new>, <main>'s is not, and the rollback failed;
#   1  refused arguments, nothing moved.
# `HR_SYNC_REFUSAL` is one sentence naming both tips on every non-zero exit.
hr_copy_ref_swap_var() {
  local main="${1-}" gitdir="${2-}" ref="${3-}" new="${4-}" old="${5-}" reflog="${6-}" kind cmain id
  local -a msg
  msg=()
  HR_SYNC_REFUSAL=""
  for id in "$new" "$old"; do
    case "$id" in
      '' | *[!0-9a-f]*)
        HR_SYNC_REFUSAL="cannot move '$ref' from '$old' to '$new': both must be object ids"
        return 1
        ;;
    esac
  done
  case "$ref" in
    refs/heads/?*) ;;
    *)
      HR_SYNC_REFUSAL="cannot move '$ref' from ${old:0:12} to ${new:0:12}: only refs/heads/<name> is moved"
      return 1
      ;;
  esac
  if ! cmain=$(hr_copy_sync_main_of "$main"); then
    HR_SYNC_REFUSAL="cannot move '$ref' from ${old:0:12} to ${new:0:12}: '$main' is not a main checkout"
    return 1
  fi
  if ! hr_copy_sync_main_git "$cmain" check-ref-format "$ref" >/dev/null 2>&1; then
    HR_SYNC_REFUSAL="cannot move '$ref' from ${old:0:12} to ${new:0:12}: not a valid ref name"
    return 1
  fi
  [ -z "$reflog" ] || msg=(-m "$reflog")
  kind=$(hr_copy_kind "$main" "$gitdir") || kind=""
  [ "$kind" != clone ] || kind=$(hr_copy_kind "$cmain" "$gitdir") || kind=""
  if [ "$kind" != clone ]; then
    if ! hr_copy_sync_main_git "$cmain" update-ref ${msg[@]+"${msg[@]}"} "$ref" "$new" "$old" >/dev/null 2>&1; then
      HR_SYNC_REFUSAL="the main checkout's $ref is no longer ${old:0:12} or could not be locked, so it was not moved to ${new:0:12}"
      return 4
    fi
    return 0
  fi
  if [ "${gitdir%/.git}" = "$gitdir" ]; then
    HR_SYNC_REFUSAL="cannot move '$ref' from ${old:0:12} to ${new:0:12} in '$gitdir': not a clone's .git"
    return 1
  fi
  if ! hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$new" "$old" >/dev/null 2>&1; then
    HR_SYNC_REFUSAL="the clone's $ref in '$gitdir' is no longer ${old:0:12} (it moved since sync-in) or could not be locked, so nothing was moved to ${new:0:12}"
    return 4
  fi
  [ "$new" != "$old" ] || return 0
  if hr_copy_sync_main_git "$cmain" update-ref ${msg[@]+"${msg[@]}"} "$ref" "$new" "$old" >/dev/null 2>&1; then
    return 0
  fi
  if hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$old" "$new" >/dev/null 2>&1; then
    HR_SYNC_REFUSAL="the main checkout's $ref is no longer ${old:0:12} or could not be locked, so the clone's was rolled back from ${new:0:12} and nothing moved"
    return 4
  fi
  HR_SYNC_REFUSAL="the clone's $ref in '$gitdir' moved to ${new:0:12}, but the main checkout's could not follow from ${old:0:12} and rolling the clone back failed"
  return 5
}

# ---------------------------------------------------------------------------
# CREATING AND REMOVING A RUN'S CLONE.
#
# `hr_clone_create_var` makes the clone `hr_clone_target_check_var` accepts and
# runs that check last, as the judge of its own result; `hr_clone_remove_var`
# deletes one; `hr_run_copy_live_var` answers the one-live-copy rule creation
# applies. Their callers: `create-worktree.sh`, `remote-run.sh` and
# `cleanup-merged-worktrees.sh`. Creation runs git in the main checkout
# through `hr_run_main_git`, in the clone it has just made only through
# `hr_clone_git`, and populates the clone's working tree through
# `hr_copy_git_at`. Removal runs no git and no check that reads the clone's
# records, so a registered clone whose configuration was tampered with can
# still be removed. Write exception 6 in the header is this section's. Flags
# and constructs hold to git 2.23 and bash 3.2.
#
# Every `_var` function here sets globals and must be called directly, never
# inside `$(…)`.
# ---------------------------------------------------------------------------

# hr_clone_git <canonical-main> <clone-gitdir> <git-args>... — the one body of
# the clone-side pins, used by sync-in's heal, sync-out, the swap and creation: `GIT_DIR` and
# `GIT_COMMON_DIR` both the clone's gitdir, so a planted `commondir` is not
# followed, the main repository's object store as `GIT_OBJECT_DIRECTORY`,
# `GIT_NO_REPLACE_OBJECTS=1`, `GIT_GRAFT_FILE=/dev/null`, and `-c
# core.hooksPath=/dev/null -c core.fsmonitor=false -c
# advice.graftFileDeprecated=false`.
hr_clone_git() {
  local main="${1-}" gd="${2-}"
  [ -n "$main" ] && [ -n "$gd" ] || return 1
  shift 2
  GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null GIT_DIR="$gd" GIT_COMMON_DIR="$gd" GIT_OBJECT_DIRECTORY="$main/.git/objects" \
    git -C "$gd" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c advice.graftFileDeprecated=false "$@"
}

# hr_run_copy_live_var <main> <branch> — the one-live-copy rule: is there a
# live run copy of <branch>? A live copy is any of, tested in this order:
# `hr_worktree_dir <main> <branch>` existing in any form (as given or
# canonical); the registry's `worktree` for <branch> naming a path that
# exists, read with `hr_registry_peek`, which never creates the file; and
# <main> or a worktree of it having <branch> checked out, from `git worktree
# list --porcelain`. Writes nothing and reads no `HR_RUN_*` global.
#   0  a live copy exists: `HR_LIVE_COPY` its path, `HR_LIVE_COPY_WHY` one
#      clause naming it;
#   1  none does, both empty;
#   2  it cannot tell (<main> not a main checkout, a path that cannot be
#      derived or resolved, `git worktree list` failing): `HR_LIVE_COPY_WHY`
#      names what failed.
hr_run_copy_live_var() {
  local branch="${2-}" main ref derived dir registry p wt cur out line at=""
  HR_LIVE_COPY=""
  HR_LIVE_COPY_WHY=""
  if ! main=$(hr_copy_sync_main_of "${1-}"); then
    HR_LIVE_COPY_WHY="'${1-}' is not a main checkout"
    return 2
  fi
  ref="refs/heads/$branch"
  if [ -z "$branch" ] || ! derived=$(hr_worktree_dir "$main" "$branch") || ! dir=$(hr_canonical_path_nogit "$derived"); then
    HR_LIVE_COPY_WHY="its run copy's path cannot be derived from $main"
    return 2
  fi
  for p in "$derived" "$dir"; do
    if [ -e "$p" ] || [ -L "$p" ]; then
      HR_LIVE_COPY=$p
      HR_LIVE_COPY_WHY="$p already exists"
      return 0
    fi
  done
  if ! registry=$(hr_state_path "$main" autonomous_logs/registry.json); then
    HR_LIVE_COPY_WHY="the run registry's path cannot be resolved from '$main/harness.config.json'"
    return 2
  fi
  wt=$(hr_registry_peek "$registry" "$branch" worktree) || wt=""
  if [ -n "$wt" ] && { [ -e "$wt" ] || [ -L "$wt" ]; }; then
    HR_LIVE_COPY=$wt
    HR_LIVE_COPY_WHY="the run registry records a run copy of it at $wt, which exists"
    return 0
  fi
  cur=$(hr_copy_sync_main_git "$main" symbolic-ref -q HEAD 2>/dev/null) || cur=""
  if [ "$cur" = "$ref" ]; then
    HR_LIVE_COPY=$main
    HR_LIVE_COPY_WHY="the main checkout $main has it checked out"
    return 0
  fi
  if ! out=$(hr_copy_sync_main_git "$main" worktree list --porcelain 2>/dev/null); then
    HR_LIVE_COPY_WHY="'git worktree list' failed in $main"
    return 2
  fi
  while IFS= read -r line; do
    case "$line" in
      'worktree '*) at=${line#worktree } ;;
    esac
    if [ "$line" = "branch $ref" ]; then
      HR_LIVE_COPY=$at
      HR_LIVE_COPY_WHY="a checkout of $main has it checked out"
      return 0
    fi
  done <<EOF
$out
EOF
  return 1
}

# hr_clone_create_var <main> <branch> <start> — create the run clone of
# <branch> at `hr_worktree_dir <main> <branch>` and set `HR_CLONE_DIR` to its
# canonical path. <main> must pass `hr_run_main_set_var`, which this resets.
#
# Refused with nothing written: a <branch> that is empty, starts with `-`,
# fails `check-ref-format` or is protected (or unresolvable) by <main>'s
# configuration; a registry directory that does not exist, which this never
# creates: its creators are the watcher (`autonomous-watcher.sh`'s `mkdir -p`
# of its logs directory) and `create-worktree.sh` when a trigger job's fresh
# checkout has none; and a second live run copy of <branch>, or one that
# cannot be ruled out (`hr_run_copy_live_var`).
#
# Then, in order: record `worktree` and `copy_kind` `clone` in one
# `hr_registry_set`, before any check can read the clone; cut
# `refs/heads/<branch>` at <start> when <main> lacks it, else take its tip and
# require `hr_run_surface_check_var <tip> tree`, as `create-worktree.sh
# --existing` does; `git clone --shared` into a directory this call `mkdir`s,
# never `--local`, whose hardlinked objects would be the main checkout's own
# inodes; rewrite `.git/config` to the allow-list's required keys plus the
# platform booleans <main>'s `.git/config` sets to `true` or `false`, plus the
# main checkout's identity keys it sets (`hr_clone_identity_keys`); leave
# `refs/heads/` holding only <branch> at the tip, `refs/remotes/origin/`
# holding only <main>'s `origin/<defaultBranch>`, its `origin/HEAD` symref and
# `origin/<branch>`, each where <main> has it, and `HEAD` on <branch>; write
# `objects/info/alternates`; populate through `read-tree` under
# `GIT_DIR=<main>/.git`; and pass `hr_wrapper_target_check_var`.
#
# WHY ONLY THOSE REMOTE REFS. The clone borrows <main>'s objects through
# `alternates`, so every ref the clone holds must name a commit <main> keeps
# reachable, or <main>'s `gc` may prune it from under the clone. Those are the
# refs <main> keeps alive for the run's life; a mirror of every
# `refs/remotes/origin/*` would name commits a `fetch --prune` in <main> can
# drop. Dissociating instead (`--dissociate`, or `repack -a` and dropping
# `alternates`) would copy the whole history into every clone.
#
# Any failure after the record undoes what this call created and nothing else:
# the directory, the ref (a compare-and-swap from the commit it cut), and the
# record (`hr_registry_drop` when there was none, else the whole previous record
# through `hr_registry_restore`). 0 created; 1 with
# `HR_CLONE_REFUSAL` naming the refused condition or the failed step, and
# anything the rollback could not undo.
hr_clone_create_var() {
  local branch="${2-}" start="${3-}" why main ref registry regdir derived dir gd
  local out line existed=0 prev_json="" made=0 cut=0 start_oid="" tip="" default want
  local failed="" detail="" undo="" spec key value alt oid rest name sym keep input="" syms="" nl
  nl='
'
  HR_CLONE_DIR=""
  HR_CLONE_REFUSAL=""
  why="cannot create a clone for branch '$branch'"
  if ! hr_run_main_set_var "${1-}"; then
    HR_CLONE_REFUSAL="$why: $HR_RUN_REFUSAL"
    return 1
  fi
  main=$HR_RUN_MAIN
  ref="refs/heads/$branch"
  case "$branch" in
    '' | -*)
      HR_CLONE_REFUSAL="$why: the branch name is empty or starts with '-'"
      return 1
      ;;
  esac
  if ! hr_run_main_git check-ref-format "$ref" >/dev/null 2>&1; then
    HR_CLONE_REFUSAL="$why: $ref is not a valid ref name"
    return 1
  fi
  hr_branch_is_protected "$main" "$branch"
  case "$?" in
    1) ;;
    0)
      HR_CLONE_REFUSAL="$why: '$main/harness.config.json' protects it"
      return 1
      ;;
    *)
      HR_CLONE_REFUSAL="$why: the protected set in '$main/harness.config.json' cannot be resolved"
      return 1
      ;;
  esac
  if ! registry=$(hr_state_path "$main" autonomous_logs/registry.json); then
    HR_CLONE_REFUSAL="$why: the run registry's path cannot be resolved from '$main/harness.config.json'"
    return 1
  fi
  regdir=$(hr_registry_dir "$registry")
  if [ ! -d "$regdir" ]; then
    HR_CLONE_REFUSAL="$why: the run registry's directory $regdir does not exist"
    return 1
  fi
  if ! derived=$(hr_worktree_dir "$main" "$branch") || ! dir=$(hr_canonical_path_nogit "$derived"); then
    HR_CLONE_REFUSAL="$why: its run copy's path cannot be derived from $main"
    return 1
  fi
  if hr_run_copy_live_var "$main" "$branch" || [ "$?" -ne 1 ]; then
    HR_CLONE_REFUSAL="$why: $HR_LIVE_COPY_WHY"
    return 1
  fi

  if hr_registry_peek "$registry" "$branch" branch >/dev/null; then
    existed=1
    if ! prev_json=$(jq -c --arg b "$branch" '.runs[$b]' "$registry" 2>/dev/null) || [ -z "$prev_json" ]; then
      HR_CLONE_REFUSAL="$why: reading its existing record in $registry failed"
      return 1
    fi
  fi
  if ! hr_registry_set "$registry" "$branch" worktree "$dir" copy_kind clone 2>/dev/null; then
    HR_CLONE_REFUSAL="$why: recording it in $registry failed"
    return 1
  fi

  gd="$dir/.git"
  while :; do
    if hr_run_main_git show-ref --verify --quiet "$ref" 2>/dev/null; then
      tip=$(hr_run_main_git rev-parse --verify --quiet "$ref^{commit}" 2>/dev/null) || tip=""
      if [ -z "$tip" ]; then
        failed="reading $ref in $main"
        break
      fi
      if ! hr_run_surface_check_var "$tip" tree; then
        failed="the protected-surface check of $tip"
        detail=$HR_RUN_SURFACE_REFUSAL
        break
      fi
    else
      case "$start" in
        '' | -*)
          failed="taking the start point, which is empty or starts with '-',"
          break
          ;;
      esac
      start_oid=$(hr_run_main_git rev-parse --verify --quiet "$start^{commit}" 2>/dev/null) || start_oid=""
      if [ -z "$start_oid" ]; then
        failed="resolving the start point '$start' to a commit in $main"
        break
      fi
      if ! hr_run_main_git update-ref "$ref" "$start_oid" "" >/dev/null 2>&1; then
        failed="cutting $ref at $start_oid"
        break
      fi
      cut=1
      tip=$start_oid
    fi

    if ! mkdir "$dir" 2>/dev/null; then
      failed="creating $dir"
      break
    fi
    made=1
    if ! hr_run_main_git clone --shared --no-checkout --template= --no-tags "$main" "$dir" >/dev/null 2>&1; then
      failed="git clone --shared into $dir"
      break
    fi

    if ! spec=$(hr_clone_config_spec "$main" "$dir"); then
      failed="building the clone configuration allow-list from $main"
      break
    fi
    if [ -L "$gd/config" ] || ! : >"$gd/config" 2>/dev/null; then
      failed="emptying $gd/config"
      break
    fi
    for key in core.repositoryformatversion extensions.objectformat core.bare remote.origin.fetch remote.origin.url \
      core.filemode core.ignorecase core.precomposeunicode core.symlinks $(hr_clone_identity_keys); do
      hr_clone_spec_rule_var "$spec" "$key" || continue
      case "$HR_CLONE_RULE" in
        =*) value=${HR_CLONE_RULE#=} ;;
        bool)
          value=$(git -C / config --file "$main/.git/config" --get "$key" 2>/dev/null) || continue
          case "$value" in true | false) ;; *) continue ;; esac
          ;;
        *) continue ;;
      esac
      if ! git -C / config --file "$gd/config" "$key" "$value" >/dev/null 2>&1; then
        failed="writing $key into $gd/config"
        break 2
      fi
    done

    if ! default=$(hr_default_branch "$main") || [ -z "$default" ]; then
      failed="reading defaultBranch from $main/harness.config.json"
      break
    fi
    want="${nl}refs/remotes/origin/HEAD${nl}refs/remotes/origin/$default${nl}refs/remotes/origin/$branch$nl"
    if ! out=$(hr_run_main_git for-each-ref --format='%(objectname) %(refname) %(symref)' \
      refs/remotes/origin/HEAD "refs/remotes/origin/$default" "refs/remotes/origin/$branch" 2>/dev/null); then
      failed="listing $main's refs/remotes/origin/"
      break
    fi
    keep="$nl$ref$nl"
    input="update $ref $tip$nl"
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      oid=${line%% *}
      rest=${line#* }
      name=${rest%% *}
      sym=${rest#"$name"}
      sym=${sym# }
      case "$want" in
        *"$nl$name$nl"*) ;;
        *) continue ;;
      esac
      keep="$keep$name$nl"
      if [ -n "$sym" ]; then
        syms="$syms$name $sym$nl"
      else
        input="${input}update $name $oid$nl"
      fi
    done <<EOF
$out
EOF
    if ! out=$(hr_clone_git "$main" "$gd" for-each-ref --format='%(refname)' 2>/dev/null); then
      failed="listing the refs of $dir"
      break
    fi
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      case "$keep" in
        *"$nl$line$nl"*) ;;
        *) input="${input}delete $line$nl" ;;
      esac
    done <<EOF
$out
EOF
    if ! printf '%s' "$input" | hr_clone_git "$main" "$gd" update-ref --no-deref --stdin >/dev/null 2>&1; then
      failed="setting the refs of $dir"
      break
    fi
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      if ! hr_clone_git "$main" "$gd" symbolic-ref "${line%% *}" "${line#* }" >/dev/null 2>&1; then
        failed="setting ${line%% *} in $dir"
        break 2
      fi
    done <<EOF
$syms
EOF
    if ! hr_clone_git "$main" "$gd" symbolic-ref HEAD "$ref" >/dev/null 2>&1; then
      failed="pointing $dir's HEAD at $ref"
      break
    fi

    alt="$gd/objects/info/alternates"
    if ! value=$(hr_canonical_path_nogit "$main/.git/objects") || [ -L "$alt" ] \
      || ! printf '%s\n' "$value" >"$alt" 2>/dev/null; then
      failed="writing $alt"
      break
    fi

    if ! hr_copy_git_at "$main" "$gd" "$dir" read-tree --reset -u --no-recurse-submodules "$tip" >/dev/null 2>&1; then
      failed="populating $dir from $tip"
      break
    fi

    if ! hr_wrapper_target_check_var "$main" "$dir"; then
      failed="the trust check of the finished clone"
      detail=$HR_TARGET_REFUSAL
      break
    fi
    HR_CLONE_DIR=$dir
    return 0
  done

  if [ "$made" -eq 1 ]; then
    rm -rf -- "$dir" 2>/dev/null || :
    if [ -e "$dir" ] || [ -L "$dir" ]; then undo="$dir"; fi
  fi
  if [ "$cut" -eq 1 ] && ! hr_run_main_git update-ref -d "$ref" "$start_oid" >/dev/null 2>&1; then
    undo="${undo:+$undo, }$ref in $main"
  fi
  if [ "$existed" -eq 1 ]; then
    hr_registry_restore "$registry" "$branch" "$prev_json" 2>/dev/null \
      || undo="${undo:+$undo, }the registry record of '$branch'"
  else
    hr_registry_drop "$registry" "$branch" 2>/dev/null || undo="${undo:+$undo, }the registry record of '$branch'"
  fi
  HR_CLONE_REFUSAL="$why: $failed failed${detail:+ ($detail)}"
  if [ -n "$undo" ]; then
    HR_CLONE_REFUSAL="$HR_CLONE_REFUSAL, and the rollback could not undo: $undo"
  else
    HR_CLONE_REFUSAL="$HR_CLONE_REFUSAL, and everything this call created was rolled back"
  fi
  return 1
}

# hr_clone_remove_var <main> <dir> — delete the run clone at <dir> with
# `rm -rf`. Refused, removing nothing, when <main> fails `hr_run_main_set_var`'s
# predicate (`hr_copy_sync_main_of`); <dir> or `<dir>/.git` is a symbolic link
# or `<dir>/.git` is not a directory; <dir> is <main>; not exactly one registry
# record has `copy_kind` `clone` and a `worktree` canonically <dir> — found by
# `jq` over the file without creating it, never by the clone's `HEAD`; or <dir>
# is not `hr_worktree_dir <main> <that record's branch>`. The registry record
# and the branch are left as they are. 0 removed; 1 with `HR_CLONE_REFUSAL`
# set.
hr_clone_remove_var() {
  local dir="${2-}" why main cdir registry out line b w wc branch="" count=0 want tab=$'\t'
  HR_CLONE_REFUSAL=""
  while :; do
    case "$dir" in
      ?*/) dir=${dir%/} ;;
      *) break ;;
    esac
  done
  why="cannot remove the clone '$dir'"
  if ! main=$(hr_copy_sync_main_of "${1-}"); then
    HR_CLONE_REFUSAL="$why: '${1-}' is not a main checkout"
    return 1
  fi
  if [ -z "$dir" ] || [ -L "$dir" ] || [ -L "$dir/.git" ] || [ ! -d "$dir/.git" ]; then
    HR_CLONE_REFUSAL="$why: it or its .git is a symbolic link, or its .git is not a directory"
    return 1
  fi
  if ! cdir=$( CDPATH= cd -P -- "$dir" 2>/dev/null && pwd -P ) || [ "$cdir" = "$main" ]; then
    HR_CLONE_REFUSAL="$why: it is not a directory, or it is the main checkout $main"
    return 1
  fi
  if ! registry=$(hr_state_path "$main" autonomous_logs/registry.json) \
    || [ ! -f "$registry" ] || [ ! -r "$registry" ] \
    || ! out=$(jq -r '.runs | to_entries[]
      | select((.value | type) == "object" and .value.copy_kind == "clone" and (.value.worktree | type) == "string")
      | [.key, .value.worktree] | @tsv' "$registry" 2>/dev/null); then
    HR_CLONE_REFUSAL="$why: the run registry of $main cannot be read"
    return 1
  fi
  while IFS= read -r line; do
    case "$line" in *"$tab"*) ;; *) continue ;; esac
    hr_tsv_unescape_var "${line#*"$tab"}"
    w=$HR_CFG_VALUE
    wc=$(hr_canonical_path_nogit "$w") || continue
    [ "$wc" = "$cdir" ] || continue
    hr_tsv_unescape_var "${line%%"$tab"*}"
    b=$HR_CFG_VALUE
    count=$((count + 1))
    branch=$b
  done <<EOF
$out
EOF
  if [ "$count" -ne 1 ]; then
    HR_CLONE_REFUSAL="$why: $count run registry records name a clone at $cdir, not exactly one"
    return 1
  fi
  if ! want=$(hr_worktree_dir "$main" "$branch") || ! want=$(hr_canonical_path_nogit "$want") || [ "$want" != "$cdir" ]; then
    HR_CLONE_REFUSAL="$why: it is not the path hr_worktree_dir derives from $main for the branch '$branch' its record names"
    return 1
  fi
  rm -rf -- "$cdir" 2>/dev/null || :
  if [ -e "$cdir" ] || [ -L "$cdir" ]; then
    HR_CLONE_REFUSAL="$why: rm -rf left $cdir behind"
    return 1
  fi
  return 0
}

# ---------------------------------------------------------------------------
# THE ARTIFACT PLACEMENT.
#
# THE CONTRACT. The one placement the watcher's inbox pass and a job starting a
# run both perform: copy a dropped artifact into a working copy, skip an
# identical re-drop, commit exactly that path by plumbing in the main
# repository, push through the caller-named push wrapper, and read "landed" as
# `refs/remotes/origin/<branch>` equal to `refs/heads/<branch>` in the main
# checkout. Every step reports by exit status; what a failure means — log and
# launch anyway, or block the dispatch — is the caller's decision. The push
# wrapper's path is an argument because this library resolves no sibling
# script. Write exception 4 in the header is this section's.
# ---------------------------------------------------------------------------

# hr_task_prompt_rel <state_rel> <branch> — print the task prompt's
# repo-relative path, with <state_rel>'s trailing `/` dropped.
hr_task_prompt_rel() {
  local state_rel="${1-}" branch="${2-}"
  printf '%s/task_prompts/%s_task_prompt.md\n' "${state_rel%/}" "$branch"
}

# hr_task_prompt_subject <branch> — print the task prompt's commit subject. The
# one producer of it; `.claude/context/conventions.md` → `## Commit-message
# policy` lists it byte for byte.
hr_task_prompt_subject() {
  printf 'chore: add task prompt for %s\n' "${1-}"
}

# hr_user_review_subject <branch> — print a user review round's commit subject.
# The one producer of it, for the watcher's remote inbox pass and
# `remote-run.sh review`.
hr_user_review_subject() {
  printf 'chore: add user review for %s\n' "${1-}"
}

# hr_run_path_safe <top> <rel> — 0 when no existing component of <top>/<rel>
# strictly below <top> is a symbolic link and the leaf is absent or a regular
# file; 1 otherwise, and for an absolute <rel> or a `..` segment. Git-free.
hr_run_path_safe() {
  local top="${1-}" rel="${2-}" rest seg cur
  [ -n "$top" ] && [ -n "$rel" ] || return 1
  case "$rel" in /*) return 1 ;; esac
  cur=$top
  rest=$rel
  while [ -n "$rest" ]; do
    seg=${rest%%/*}
    if [ "$seg" = "$rest" ]; then rest=""; else rest=${rest#*/}; fi
    case "$seg" in
      '' | .) continue ;;
      ..) return 1 ;;
    esac
    cur="$cur/$seg"
    [ ! -L "$cur" ] || return 1
    [ -e "$cur" ] || return 0
    if [ -n "$rest" ]; then
      [ -d "$cur" ] || return 1
    fi
  done
  [ "$cur" != "$top" ] || return 1
  [ -f "$cur" ]
}

# hr_place_artifact <worktree> <src_file> <rel> — copy <src_file> to
# <worktree>/<rel>, creating its parent. 0, or 1 on a failure — copying nothing
# when `hr_run_path_safe` refuses, before the `mkdir -p` or after it.
hr_place_artifact() {
  local worktree="${1-}" src="${2-}" rel="${3-}" dest
  [ -n "$worktree" ] && [ -n "$src" ] && [ -n "$rel" ] || return 1
  hr_run_path_safe "$worktree" "$rel" || return 1
  dest="$worktree/$rel"
  mkdir -p "${dest%/*}" || return 1
  hr_run_path_safe "$worktree" "$rel" || return 1
  cp "$src" "$dest" || return 1
  return 0
}

# hr_commit_placed <main> <worktree> <rel> <subject> — commit <worktree>/<rel>,
# and nothing else the run staged, on the copy's branch through
# `hr_commit_paths_var` (mode `100644`, index synced only after a moved ref),
# so the copy reads clean afterwards. No hook runs.
#   0  committed; `committed <short sha> on <branch>` on stdout;
#   3  the placed blob equals `<tip>:<rel>` (an identical re-drop), nothing
#      committed;
#   2  the branch is protected by <main>'s configuration;
#   1  anything else: an untrusted copy, a detached HEAD, an unsafe path, an
#      unresolvable configuration or a git failure.
hr_commit_placed() {
  local main="${1-}" worktree="${2-}" rel="${3-}" subject="${4-}"
  local wt branch tip top blob old short status patterns pattern protected_set=""
  [ -n "$main" ] && [ -n "$worktree" ] && [ -n "$rel" ] && [ -n "$subject" ] || return 1
  if ! hr_run_copy_check_var "$main" "$worktree"; then
    echo "hr_commit_placed: refusing to commit: $HR_RUN_REFUSAL" >&2
    return 1
  fi
  top=$HR_RUN_COPY_TOP
  wt=$( CDPATH= cd -P -- "$worktree" 2>/dev/null && pwd -P ) || wt=""
  if [ "$wt" != "$top" ]; then
    echo "hr_commit_placed: '$worktree' is not the top of its checkout '$top' — refusing to commit" >&2
    return 1
  fi
  branch=$HR_RUN_COPY_BRANCH
  tip=$HR_RUN_COPY_TIP
  if [ -z "$branch" ]; then
    echo "hr_commit_placed: detached HEAD — refusing to commit" >&2
    return 1
  fi
  if [ -z "$tip" ]; then
    echo "hr_commit_placed: '$branch' has no commit yet — refusing to commit" >&2
    return 1
  fi
  hr_branch_is_protected "$HR_RUN_MAIN" "$branch"
  status=$?
  case "$status" in
    0)
      patterns=$(hr_protected_patterns "$HR_RUN_MAIN") || patterns=""
      while IFS= read -r pattern; do
        [ -n "$pattern" ] || continue
        protected_set="${protected_set:+$protected_set }$pattern"
      done <<EOF
$patterns
EOF
      echo "hr_commit_placed: branch '$branch' is protected — refusing to commit" >&2
      echo "  protected set (from harness.config.json): $protected_set" >&2
      return 2
      ;;
    2)
      echo "hr_commit_placed: cannot resolve '$HR_RUN_MAIN/harness.config.json' — refusing to commit" >&2
      echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
      return 1
      ;;
  esac
  if ! hr_run_path_safe "$top" "$rel" || [ ! -f "$top/$rel" ]; then
    echo "hr_commit_placed: '$rel' is not a regular file reached without a symbolic link in '$top' — refusing to commit" >&2
    return 1
  fi
  hr_run_blob_var "$rel" 100644 || return 1
  [ "$HR_RUN_BLOB_MODE" = 100644 ] && [ -n "$HR_RUN_BLOB" ] || return 1
  blob=$HR_RUN_BLOB
  old=$(hr_run_main_git rev-parse --verify --quiet "$tip:$rel" 2>/dev/null) || old=""
  [ "$blob" != "$old" ] || return 3

  status=0
  hr_commit_paths_var "$HR_RUN_MAIN" "$top" "$HR_RUN_COPY_GITDIR" "$branch" "$tip" 100644 committed \
    "hr_commit_placed: $subject" "$rel" -- "$subject" || status=$?
  case "$status" in
    0) ;;
    3) return 3 ;;
    *) return 1 ;;
  esac
  short=$(hr_run_main_git rev-parse --short "$HR_COMMIT_NEW") || short=$HR_COMMIT_NEW
  printf 'committed %s on %s\n' "$short" "$branch"
  return 0
}

# hr_push_landed <push_wrapper> <worktree> <branch> — run <push_wrapper>, then
# answer from refs in the main checkout alone (`hr_wrapper_main_of` the
# wrapper's own directory), because `push-branch.sh` exits 0 on every path:
#   0  landed: `refs/heads/<branch>` and `refs/remotes/origin/<branch>` resolve
#      and are equal, before or after that fetch;
#   2  the remote moved: after the failed landing, a fetch of
#      `refs/remotes/origin/<branch>` succeeds and it names a commit that is not
#      an ancestor of `refs/heads/<branch>`. `HR_PUSH_REMOTE_TIP` is set to its
#      short id;
#   1  anything else — the main checkout cannot be placed, the push was
#      refused, origin names no URL in the main `.git/config`, the fetch
#      failed, or a ref did not resolve.
# It never retries and never rebases; the retry is `push-branch.sh`'s.
hr_push_landed() {
  local wrapper="${1-}" worktree="${2-}" branch="${3-}" main head upstream
  HR_PUSH_REMOTE_TIP=""
  [ -n "$wrapper" ] && [ -n "$worktree" ] && [ -n "$branch" ] || return 1
  main=$(hr_wrapper_main_of "$(dirname "$wrapper")") || return 1
  "$wrapper" "$worktree"
  head=$(git -C "$main" -c core.hooksPath=/dev/null -c submodule.recurse=false \
    rev-parse --verify --quiet "refs/heads/$branch^{commit}") || return 1
  [ -n "$head" ] || return 1
  upstream=$(git -C "$main" -c core.hooksPath=/dev/null -c submodule.recurse=false \
    rev-parse --verify --quiet "refs/remotes/origin/$branch^{commit}") \
    && [ "$head" = "$upstream" ] && return 0
  hr_remote_url_configured "$main" origin || return 1
  git -C "$main" -c core.hooksPath=/dev/null -c submodule.recurse=false \
    fetch --quiet --no-recurse-submodules origin "+refs/heads/$branch:refs/remotes/origin/$branch" || return 1
  upstream=$(git -C "$main" -c core.hooksPath=/dev/null -c submodule.recurse=false \
    rev-parse --verify --quiet "refs/remotes/origin/$branch^{commit}") || return 1
  [ "$head" != "$upstream" ] || return 0
  git -C "$main" -c core.hooksPath=/dev/null -c submodule.recurse=false \
    merge-base --is-ancestor "$upstream" "$head" && return 1
  HR_PUSH_REMOTE_TIP=$(git -C "$main" -c core.hooksPath=/dev/null -c submodule.recurse=false \
    rev-parse --short "$upstream") || return 1
  return 2
}

# ---------------------------------------------------------------------------
# THE REMOTE STATE BUNDLE.
#
# THE FORMAT OF RECORD. What a remote job carries across a job boundary and
# reports back, uploaded as the Actions artifact `HR_REMOTE_STATE_ARTIFACT`
# names. Every name below is a variable `hr_remote_names_var` assigns, and it
# also assigns `HR_REMOTE_WORKFLOW_RUN_FILE`, the run workflow's file name, for
# the GitHub-route producers `hr_github_answer_route` and
# `hr_github_resume_route` and for the run-history probe `hr_branch_run_history`.
# Those two are mirrors of the header's table; no function spells either one,
# or any other name here.
#
#   <bundle>/status.json                 the job's record, fixed schema below
#   <bundle>/clarifications/<branch>/    the whole branch directory, answered/ included
#   <bundle>/PAUSE_PROGRESS.md           when present
#   <bundle>/flow_walker_state           <state_dir>/.flow_walker_state, WITHOUT its dot
#   <bundle>/run.log                     <state_dir>/autonomous_logs/<branch>.log; never restored
#   <bundle>/planning/<path>             each of these under <state_dir>, when present:
#                                          story_plans/<branch>_story_plan.md
#                                          task_plans/<branch>
#                                          ui_test_plans/<branch>_ui_test_plan.md
#                                          ui_test_plans/<branch>
#                                          task_plan_reviews/<branch>
#                                          business_parity_reviews/<branch>
#                                          architecture_reviews/<branch>
#                                          ui_test_plan_reviews/<branch>
#
# The walker state loses its dot because `actions/upload-artifact` skips hidden
# files by default. THE BUNDLE ITSELF IS NEVER COMMITTED. Every file outside
# `planning/` is gitignored machine-local state, and the remote-status and
# move-aside paths sit under `autonomous_logs/`, whose ignore rule already
# covers them. The files under `planning/` are untracked drafts that the flow
# commits itself at its P1/P3 convergence; the bundle only carries them.
#
# THE PLANNING PATHS ARE A MIRROR of the contracts that write and stage them:
# `plugin/instructions/task_plan_writing_instructions_autonomous.md` →
# `## Override 3` and `## Override 4` staging lists, and
# `<scripts_dir>/flows/task_plan_writing.graph.json` → each node's `findingsFolder`. A path
# added there is an edit to `hr_remote_planning_paths`. Only planning is
# carried because the walker's one graph is `task_plan_writing.graph.json`;
# implementation-phase per-unit review folders never span a pause, which waits
# for a clean tracked tree. `HR_REMOTE_STATE_SCHEMA` stays `'1'`: `planning/`
# is additive, an older reader ignores it, and a newer reader of an older
# bundle finds none.
#
# WHO READS EACH FILE. `status.json`: `remote-run.sh sync` / `status` (into the
# local registry), `continue` / `poll` (the decision, `chain`, the reset time)
# and the next job's seed. The clarification directory and `PAUSE_PROGRESS.md`:
# the next job, and the user's local mirror. The walker state: the next job
# only. `planning/`: the next job only, never a mirror — an untracked draft left
# in the mirror would make its later fast-forward to `origin/<branch>` refuse,
# because the draft's own convergence commit adds the same path. `run.log`: the
# user only — `sync` copies it to the main checkout's logs directory itself,
# and no restore places it.
#
# `status.json` — schema `HR_REMOTE_STATE_SCHEMA`; every value a JSON string:
#   schema                  a reader that does not recognise it treats the bundle as absent
#   branch, engine          the run's branch; `task` | `user_review` | `docs`
#   status                  `running` | `parked` | `park_loop` | `paused` | `completed` | `failed`
#   pause_reason            `usage` | `budget` | `user` | `overload` | empty. The registry's
#                           registry-only `killed` and `expired` are never written
#                           here: `sync` derives each from a run and its artifact
#                           list, not from a bundle
#   usage_resume_at         the epoch second a usage pause may resume at, or empty
#   park_loop_cycles, resume_max_question_index, auto_resumes, stall_restarts
#                           the counters that must survive a job boundary
#   chain                   the writing job's OWN input `HARNESS_INPUT_CHAIN`, never
#                           a value carried from an earlier bundle
#   control_polled_at       the lower bound of the next control poll, or empty
#   decision                `continue` | `wait-poller` | `stop`
#   detail                  one human-readable line
#   run_id, run_url, written_at
#                           `GITHUB_RUN_ID`, the run's URL, the epoch second written
# ---------------------------------------------------------------------------

hr_remote_names_var() {
  HR_REMOTE_STATE_SCHEMA='1'
  HR_REMOTE_STATUS_FILE='status.json'
  HR_REMOTE_CLARIFY_DIR='clarifications'
  HR_REMOTE_PAUSE_FILE='PAUSE_PROGRESS.md'
  HR_REMOTE_WALKER_FILE='flow_walker_state'
  HR_REMOTE_WALKER_SOURCE=".$HR_REMOTE_WALKER_FILE"
  HR_REMOTE_LOG_FILE='run.log'
  HR_REMOTE_LOGS_DIR='autonomous_logs'
  HR_REMOTE_STATUS_SOURCE="$HR_REMOTE_LOGS_DIR/remote_status.json"
  HR_REMOTE_SUPERSEDED_DIR="$HR_REMOTE_LOGS_DIR/remote_superseded"
  HR_REMOTE_PLANNING_DIR='planning'
  HR_REMOTE_WORKFLOW_RUN_FILE='harness-run.yml'
  HR_REMOTE_STATE_ARTIFACT='harness-state'
}

# hr_github_answer_route <branch> <engine> [park_loop_clear]
# hr_github_resume_route <branch> <engine>
#
# Print the GitHub route for a remote-only reader of a job-side notification,
# one clause with no trailing period, for the caller to join after its local
# command. The route names the engine because `harness-run.yml`'s `engine`
# input defaults to `task`: an empty <engine> prints where to read the run's
# own instead. It names the branch twice, as the form's *Use workflow from*
# ref and as the `branch` input: a run dispatched from the default branch is
# listed under that branch, where every `gh run list --branch <branch>`
# lookup (`sync`, `status`, `restore`) misses it. A non-empty third argument to the answer route adds the
# park-loop clear. The section cited is `## 1. The lifecycle of a remote run`;
# renumbering or retitling it is an edit here.
hr_github_answer_route() {
  local branch="${1-}" engine="${2-}" clear='' eng
  hr_remote_names_var
  if [ -n "$engine" ]; then
    eng="engine \`$engine\`"
  else
    eng="engine the run's own (the \`engine\` field of \`$HR_REMOTE_STATUS_FILE\` in its \`$HR_REMOTE_STATE_ARTIFACT\` artifact)"
  fi
  [ -n "${3-}" ] && clear=', park_loop_clear true'
  printf 'or from GitHub: take the question from the run'"'"'s `%s` artifact, then Run workflow on %s from the branch `%s` (Use workflow from), with action run, branch `%s`, %s, resume answer%s and answers `{"<n>": "<your answer>"}` (docs/remote-execution.md, section 1)' \
    "$HR_REMOTE_STATE_ARTIFACT" "$HR_REMOTE_WORKFLOW_RUN_FILE" "$branch" "$branch" "$eng" "$clear"
}

hr_github_resume_route() {
  local branch="${1-}" engine="${2-}" eng
  hr_remote_names_var
  if [ -n "$engine" ]; then
    eng="engine \`$engine\`"
  else
    eng="engine the run's own (the \`engine\` field of \`$HR_REMOTE_STATUS_FILE\` in its \`$HR_REMOTE_STATE_ARTIFACT\` artifact)"
  fi
  printf 'or from GitHub: Run workflow on %s from the branch `%s` (Use workflow from), with action run, branch `%s`, %s and resume pause (docs/remote-execution.md, section 1)' \
    "$HR_REMOTE_WORKFLOW_RUN_FILE" "$branch" "$branch" "$eng"
}

# hr_remote_planning_paths <branch>
#
# Assigns `HR_REMOTE_PLANNING_PATHS`: the eight planning paths of the format
# above, relative to <state_dir>, newline-separated, no trailing slash. 1 with
# an empty value for an empty <branch>.
hr_remote_planning_paths() {
  local branch="${1-}"
  HR_REMOTE_PLANNING_PATHS=''
  [ -n "$branch" ] || return 1
  HR_REMOTE_PLANNING_PATHS="story_plans/${branch}_story_plan.md
task_plans/$branch
ui_test_plans/${branch}_ui_test_plan.md
ui_test_plans/$branch
task_plan_reviews/$branch
business_parity_reviews/$branch
architecture_reviews/$branch
ui_test_plan_reviews/$branch"
  return 0
}

# hr_remote_status_write <registry_file> <branch> <out_json> <decision> <detail>
#
# Reads <branch>'s record through `hr_registry_get` and replaces <out_json> by
# rename, so a concurrent reader sees the old file or the new one, never half.
# Prints nothing. 1 — writing nothing — when an argument is missing, <decision>
# is outside its vocabulary, the record has no in-vocabulary `status`, or the
# write fails. A `pause_reason` outside the bundle's vocabulary is written empty.
hr_remote_status_write() {
  local registry="${1-}" branch="${2-}" out="${3-}" decision="${4-}" detail="${5-}"
  local status engine reason chain run_id run_url tmp
  [ -n "$registry" ] && [ -n "$branch" ] && [ -n "$out" ] || return 1
  case "$decision" in
    continue|wait-poller|stop) ;;
    *) return 1 ;;
  esac
  hr_remote_names_var
  status=$(hr_registry_get "$registry" "$branch" status)
  case "$status" in
    running|parked|park_loop|paused|completed|failed) ;;
    *) return 1 ;;
  esac
  engine=$(hr_registry_get "$registry" "$branch" engine)
  reason=$(hr_registry_get "$registry" "$branch" pause_reason)
  case "$reason" in
    usage|budget|user|overload) ;;
    *) reason="" ;;
  esac
  chain="${HARNESS_INPUT_CHAIN-}"
  case "$chain" in
    ''|*[!0-9]*) chain="" ;;
  esac
  run_id="${GITHUB_RUN_ID-}"
  run_url=""
  if [ -n "$run_id" ] && [ -n "${GITHUB_SERVER_URL-}" ] && [ -n "${GITHUB_REPOSITORY-}" ]; then
    run_url="${GITHUB_SERVER_URL%/}/${GITHUB_REPOSITORY}/actions/runs/${run_id}"
  fi
  detail=${detail//$'\r'/ }
  detail=${detail//$'\n'/ }
  # The temp file sits beside <out_json> so the `mv` is a same-filesystem rename.
  tmp=$(mktemp "${out}.tmp.XXXXXX" 2>/dev/null) || return 1
  if jq -n \
    --arg schema "$HR_REMOTE_STATE_SCHEMA" \
    --arg branch "$branch" \
    --arg engine "$engine" \
    --arg status "$status" \
    --arg pause_reason "$reason" \
    --arg usage_resume_at "$(hr_registry_get "$registry" "$branch" usage_resume_at)" \
    --arg park_loop_cycles "$(hr_registry_get "$registry" "$branch" park_loop_cycles)" \
    --arg resume_max_question_index "$(hr_registry_get "$registry" "$branch" resume_max_question_index)" \
    --arg auto_resumes "$(hr_registry_get "$registry" "$branch" auto_resumes)" \
    --arg stall_restarts "$(hr_registry_get "$registry" "$branch" stall_restarts)" \
    --arg chain "$chain" \
    --arg control_polled_at "$(hr_registry_get "$registry" "$branch" control_polled_at)" \
    --arg decision "$decision" \
    --arg detail "$detail" \
    --arg run_id "$run_id" \
    --arg run_url "$run_url" \
    --arg written_at "$(date +%s)" \
    '{schema: $schema, branch: $branch, engine: $engine, status: $status,
      pause_reason: $pause_reason, usage_resume_at: $usage_resume_at,
      park_loop_cycles: $park_loop_cycles,
      resume_max_question_index: $resume_max_question_index,
      auto_resumes: $auto_resumes, stall_restarts: $stall_restarts,
      chain: $chain, control_polled_at: $control_polled_at,
      decision: $decision, detail: $detail,
      run_id: $run_id, run_url: $run_url, written_at: $written_at}' \
    >"$tmp" 2>/dev/null && mv "$tmp" "$out" 2>/dev/null; then
    return 0
  fi
  rm -f "$tmp"
  return 1
}

# hr_remote_status_get <status_json> <key>   -> the value
#
# 0 with the value printed; 1 when <key> is absent; 2 when the file is
# unreadable, is not JSON, or its `schema` is not `HR_REMOTE_STATE_SCHEMA` —
# the bundle is then treated as absent, whatever <key> holds.
hr_remote_status_get() {
  local file="${1-}" key="${2-}" out
  [ -n "$file" ] && [ -r "$file" ] || return 2
  hr_remote_names_var
  # One `jq`, one marker character: `S` a schema it does not recognise, `A` an
  # absent key, `V` a value — an exit status cannot carry three outcomes.
  out=$(jq -r --arg k "$key" --arg s "$HR_REMOTE_STATE_SCHEMA" '
    if type != "object" or .schema != $s then "S"
    elif (.[$k] | type) == "string" then "V" + .[$k]
    else "A" end' "$file" 2>/dev/null) || return 2
  case "$out" in
    V*) printf '%s\n' "${out#V}" ;;
    A) return 1 ;;
    *) return 2 ;;
  esac
}

# hr_remote_state_dir_var <root>
#
# Resolves the state directory `hr_remote_bundle_write`, `hr_remote_bundle_restore`
# and `hr_remote_move_aside` use under <root>. Call it directly, never inside
# `$(…)`. Assigns, all empty at entry:
#   HR_REMOTE_STATE_DIR       the repo-relative state directory, normalised as
#                             `hr_state_dir` prints it
#   HR_REMOTE_STATE_FROM      `trusted` or `checkout`
#   HR_REMOTE_STATE_CHECKOUT  the checkout's own `hr_state_dir "$root"` value
#                             (empty when unreadable); equal to
#                             HR_REMOTE_STATE_DIR in `checkout` mode
# 0 resolved; 1 a missing argument; 2 unresolvable.
#
# IN A JOB (`HARNESS_GITHUB_DEFAULT_COMMIT` non-empty) THE SOURCE IS TRUSTED:
# `harness.config.json` at that commit, which the workflow records before any
# session, because the checkout's own copy is the session's to rewrite. The
# value must be a full 40- or 64-character lower-case object id. The blob is
# read through `hr_run_main_git` (no hook, no replace refs, no grafts) into a
# private `mktemp -d` directory and resolved there by `hr_state_dir`, so there
# is no second configuration parser; the file is removed and the directory
# `rmdir`ed. A bad id, or a commit, blob or configuration that cannot be read,
# is 2 with no fallback to the checkout. The read still goes through the
# object store the session shares; every permission profile, a job's included,
# write-denies the checkout's whole `.git`, so a session cannot plant a loose
# object there.
#
# OUTSIDE A JOB (the variable empty or unset: a local `sync` into a mirror, or
# the watcher locally) THE SOURCE IS THE CHECKOUT: there is no recorded commit,
# and the checkout is the user's own mirror or main checkout.
#
# `hr_run_main_set_var` runs in a subshell, so every `HR_RUN_*` global — which
# the watcher's job mode holds when it calls `hr_remote_move_aside` — is left
# exactly as found, set or unset. The checkout's configuration is read last, so
# the per-process cache ends keyed on <root>, never on the removed directory.
hr_remote_state_dir_var() {
  local root="${1-}" commit="${HARNESS_GITHUB_DEFAULT_COMMIT-}" tmp value rc=0
  HR_REMOTE_STATE_DIR=''
  HR_REMOTE_STATE_FROM=''
  HR_REMOTE_STATE_CHECKOUT=''
  [ -n "$root" ] || return 1
  if [ -n "$commit" ]; then
    case "$commit" in
      *[!0-9a-f]*) rc=2 ;;
    esac
    [ "${#commit}" -eq 40 ] || [ "${#commit}" -eq 64 ] || rc=2
    tmp=''
    if [ "$rc" -eq 0 ]; then
      tmp=$(mktemp -d "${TMPDIR:-/tmp}/hr-remote-state.XXXXXX" 2>/dev/null) || { tmp=''; rc=2; }
    fi
    if [ "$rc" -eq 0 ]; then
      if ( hr_run_main_set_var "$root" \
        && hr_run_main_git cat-file blob "$commit:harness.config.json" >"$tmp/harness.config.json" ) 2>/dev/null \
        && value=$(hr_state_dir "$tmp"); then
        HR_REMOTE_STATE_DIR=$value
        HR_REMOTE_STATE_FROM='trusted'
      else
        rc=2
      fi
    fi
    if [ -n "$tmp" ]; then
      rm -f "$tmp/harness.config.json"
      rmdir "$tmp" 2>/dev/null
    fi
    hr_config_load "$root" >/dev/null 2>&1 || :
    if [ "$rc" -eq 0 ]; then
      HR_REMOTE_STATE_CHECKOUT=$(hr_state_dir "$root") || HR_REMOTE_STATE_CHECKOUT=''
    fi
    return "$rc"
  fi
  hr_config_load "$root" >/dev/null 2>&1 || :
  value=$(hr_state_dir "$root") || return 2
  HR_REMOTE_STATE_DIR=$value
  HR_REMOTE_STATE_FROM='checkout'
  HR_REMOTE_STATE_CHECKOUT=$value
  return 0
}

# hr_remote_link_free_var <root> <rel>
#
# 0 when no component of `<root>/<rel>` below <root> is a symbolic link, each
# prefix from <rel>'s first segment down to the leaf tested with `[ -L ]`; a
# component that does not exist is not a link. 1 otherwise, with
# `HR_REMOTE_LINKED` (empty at entry) the absolute path of the first linked
# component; also 1, with it empty, on a missing argument. Builtins only.
hr_remote_link_free_var() {
  local root="${1-}" rest="${2-}" path seg
  HR_REMOTE_LINKED=''
  [ -n "$root" ] && [ -n "$rest" ] || return 1
  path=${root%/}
  while [ -n "$rest" ]; do
    seg=${rest%%/*}
    if [ "$seg" = "$rest" ]; then
      rest=''
    else
      rest=${rest#*/}
    fi
    [ -n "$seg" ] || continue
    path="$path/$seg"
    if [ -L "$path" ]; then
      HR_REMOTE_LINKED=$path
      return 1
    fi
  done
  return 0
}

# hr_remote_copy_tree <src> <dst>
#
# Recreates the directory <src> at <dst>: every directory, empty ones included,
# and every regular file, dot-files included, each with a plain `cp`. A
# symbolic link at any depth is neither copied nor followed, and gets one
# stderr line, `remote state bundle: skipped <path>: <path> is a symbolic link`;
# any other non-regular entry gets the same form ending `is not a regular
# file`. `find` runs with no `-L` / `-H`, so on BSD and GNU alike the walk
# never descends through a link. 0 copied; 1 a missing argument, a <src> that is
# not a directory or is a link, or a failed `mkdir` / `cp`.
hr_remote_copy_tree() {
  local src="${1-}" dst="${2-}" entry target
  [ -n "$src" ] && [ -n "$dst" ] || return 1
  src=${src%/}
  dst=${dst%/}
  [ -d "$src" ] && [ ! -L "$src" ] || return 1
  # Process substitution, not a pipe: `return 1` must reach the caller.
  while IFS= read -r -d '' entry; do
    target="$dst${entry#"$src"}"
    if [ -L "$entry" ]; then
      printf 'remote state bundle: skipped %s: %s is a symbolic link\n' "$entry" "$entry" >&2
    elif [ -d "$entry" ]; then
      mkdir -p "$target" 2>/dev/null || return 1
    elif [ -f "$entry" ]; then
      cp "$entry" "$target" 2>/dev/null || return 1
    else
      printf 'remote state bundle: skipped %s: %s is not a regular file\n' "$entry" "$entry" >&2
    fi
  done < <(find "$src" -print0 2>/dev/null)
  return 0
}

# hr_remote_bundle_write <root> <branch> <registry_file> <out_dir>
#
# Assembles the format above in <out_dir>, which must be absent or empty, from
# the state directory `hr_remote_state_dir_var` resolves for <root>.
# `status.json` is the job's own `autonomous_logs/remote_status.json` when
# present; otherwise it is written from <branch>'s registry record with decision
# `stop`, because a job that never wrote its status never decided to continue.
# Each planning path present is copied under `planning/`, whether or not the
# branch tracks it: the restore never overwrites, so a tracked copy is inert.
# 0 written; 1 a missing argument, a non-empty <out_dir> or a failed copy; 2
# <root>'s configuration, or the trusted one, unresolvable.
#
# A LINKED SOURCE IS SKIPPED, AND THE REST IS STILL WRITTEN. Before a source is
# tested or copied, `hr_remote_link_free_var` checks every component of
# `<state_dir>/<source>`; on a link the source is skipped with one stderr line,
# `remote state bundle: skipped <path>: <linked> is a symbolic link`, both
# absolute. A linked `remote_status.json` falls through to the registry-derived
# `status.json`, as an absent one does. Directory sources go through
# `hr_remote_copy_tree`, so no link inside one is copied or followed either:
# the bundle holds no link at all.
#
# WHY NOT `cp -R`, MEASURED 2026-10-17. Command, in a fresh `mktemp -d`:
#   mkdir -p src/sub; echo secret > sentinel; echo hi > src/a
#   ln -s "$PWD/sentinel" src/sub/link; ln -s "$PWD/src" argl
#   cp -R src out1; ls -l out1/sub/link | cut -c1
#   cp -R argl out2; ls -ld out2 | cut -c1
#   - macOS 15.7.4, `/bin/cp`: `inside: l`, `arg: l` — both copied AS links.
#   - GNU coreutils 9.7 (`cp (GNU coreutils) 9.7`, the local
#     `python:3.12-slim` image under `docker run --network none`): `inside: l`,
#     `arg: l` — the same.
# Neither follows, but both put a link into the bundle, and whether
# `actions/upload-artifact` then follows it is not measured: it cannot be run
# locally. The copy here writes no link, so that answer no longer decides what
# is published.
hr_remote_bundle_write() {
  local root="${1-}" branch="${2-}" registry="${3-}" out="${4-}" state base rel dst rc=0
  [ -n "$root" ] && [ -n "$branch" ] && [ -n "$registry" ] && [ -n "$out" ] || return 1
  hr_remote_state_dir_var "$root" || rc=$?
  case "$rc" in
    0) ;;
    2) return 2 ;;
    *) return 1 ;;
  esac
  state=$HR_REMOTE_STATE_DIR
  hr_remote_names_var
  base="${root%/}/$state"
  out=${out%/}
  if [ -e "$out" ]; then
    [ -d "$out" ] || return 1
    [ -z "$(ls -A "$out" 2>/dev/null)" ] || return 1
  fi
  mkdir -p "$out" 2>/dev/null || return 1

  if hr_remote_bundle_source_ok "$root" "$state/$HR_REMOTE_STATUS_SOURCE" \
    && [ -f "$base/$HR_REMOTE_STATUS_SOURCE" ]; then
    cp "$base/$HR_REMOTE_STATUS_SOURCE" "$out/$HR_REMOTE_STATUS_FILE" 2>/dev/null || return 1
  else
    hr_remote_status_write "$registry" "$branch" "$out/$HR_REMOTE_STATUS_FILE" stop \
      "the job wrote no status; derived from the registry record when the bundle was saved" || return 1
  fi
  if hr_remote_bundle_source_ok "$root" "$state/$HR_REMOTE_CLARIFY_DIR/$branch" \
    && [ -d "$base/$HR_REMOTE_CLARIFY_DIR/$branch" ]; then
    dst="$out/$HR_REMOTE_CLARIFY_DIR/$branch"
    mkdir -p "${dst%/*}" 2>/dev/null || return 1
    hr_remote_copy_tree "$base/$HR_REMOTE_CLARIFY_DIR/$branch" "$dst" || return 1
  fi
  if hr_remote_bundle_source_ok "$root" "$state/$HR_REMOTE_PAUSE_FILE" \
    && [ -f "$base/$HR_REMOTE_PAUSE_FILE" ]; then
    cp "$base/$HR_REMOTE_PAUSE_FILE" "$out/$HR_REMOTE_PAUSE_FILE" 2>/dev/null || return 1
  fi
  if hr_remote_bundle_source_ok "$root" "$state/$HR_REMOTE_WALKER_SOURCE" \
    && [ -f "$base/$HR_REMOTE_WALKER_SOURCE" ]; then
    cp "$base/$HR_REMOTE_WALKER_SOURCE" "$out/$HR_REMOTE_WALKER_FILE" 2>/dev/null || return 1
  fi
  if hr_remote_bundle_source_ok "$root" "$state/$HR_REMOTE_LOGS_DIR/$branch.log" \
    && [ -f "$base/$HR_REMOTE_LOGS_DIR/$branch.log" ]; then
    cp "$base/$HR_REMOTE_LOGS_DIR/$branch.log" "$out/$HR_REMOTE_LOG_FILE" 2>/dev/null || return 1
  fi
  hr_remote_planning_paths "$branch" || return 1
  while IFS= read -r rel; do
    hr_remote_bundle_source_ok "$root" "$state/$rel" || continue
    dst="$out/$HR_REMOTE_PLANNING_DIR/$rel"
    if [ -f "$base/$rel" ]; then
      mkdir -p "${dst%/*}" 2>/dev/null || return 1
      cp "$base/$rel" "$dst" 2>/dev/null || return 1
    elif [ -d "$base/$rel" ]; then
      mkdir -p "${dst%/*}" 2>/dev/null || return 1
      hr_remote_copy_tree "$base/$rel" "$dst" || return 1
    fi
  done <<EOF
$HR_REMOTE_PLANNING_PATHS
EOF
  return 0
}

# hr_remote_bundle_source_ok <root> <rel> — `hr_remote_bundle_write`'s per-source
# gate: 0 when `hr_remote_link_free_var` passes; 1 after printing the skip line.
hr_remote_bundle_source_ok() {
  hr_remote_link_free_var "${1-}" "${2-}" && return 0
  [ -n "$HR_REMOTE_LINKED" ] || return 1
  printf 'remote state bundle: skipped %s: %s is a symbolic link\n' "${1%/}/${2-}" "$HR_REMOTE_LINKED" >&2
  return 1
}

# hr_remote_move_aside <root> <rel_path>
#
# Moves `<root>/<state_dir>/<rel_path>`, a file or a directory, with one `mv`
# into `autonomous_logs/remote_superseded/<epoch>/<rel_path>` (`<epoch>-<n>`,
# the first `n` = 1, 2, … where that path is free, when an earlier move took
# that second), creating the parents and removing nothing. On success
# `HR_REMOTE_ASIDE` holds the absolute destination; it is empty at entry.
#
# 0 moved; 1 a missing argument, a <rel_path> that is absolute or has a `..`
# segment, or a failed `mkdir` / `mv`; 2 — touching nothing — <root>'s
# configuration is unresolvable; 3 — touching nothing — no source exists.
hr_remote_move_aside() {
  local root="${1-}" rel="${2-}" state base epoch aside n
  HR_REMOTE_ASIDE=''
  [ -n "$root" ] && [ -n "$rel" ] || return 1
  case "$rel" in
    /*) return 1 ;;
  esac
  case "/$rel/" in
    */../*) return 1 ;;
  esac
  hr_remote_state_dir_var "$root" || return 2
  state=$HR_REMOTE_STATE_DIR
  hr_remote_names_var
  base="${root%/}/$state"
  [ -e "$base/$rel" ] || [ -L "$base/$rel" ] || return 3
  epoch=$(date +%s)
  aside="$base/$HR_REMOTE_SUPERSEDED_DIR/$epoch"
  n=0
  while [ -e "$aside/$rel" ] || [ -L "$aside/$rel" ]; do
    n=$((n + 1))
    aside="$base/$HR_REMOTE_SUPERSEDED_DIR/$epoch-$n"
  done
  aside="$aside/$rel"
  mkdir -p "${aside%/*}" 2>/dev/null || return 1
  mv "$base/$rel" "$aside" 2>/dev/null || return 1
  HR_REMOTE_ASIDE=$aside
  return 0
}

# hr_remote_bundle_restore <bundle_dir> <root> <branch> <mode>
#
# <mode> `job` places the clarification directory, `PAUSE_PROGRESS.md`, the
# walker state (back under its dotted name), the planning drafts and
# `status.json` (as `autonomous_logs/remote_status.json`); `mirror` places the
# first two only. The run log is placed by neither.
#
# A PLANNING DRAFT NEVER OVERWRITES. A regular file under `planning/` whose
# path lies in `HR_REMOTE_PLANNING_PATHS` and has no `..` segment is placed only
# where nothing exists, counted in `HR_REMOTE_PLANNING_PLACED`; one whose target
# exists is left byte-identical — the checkout's copy is the branch's committed
# record — and counted in `HR_REMOTE_PLANNING_KEPT`. A symlink, a non-regular
# entry or a path outside the set counts in neither. Both are `0` at entry and
# stay `0` in `mirror` mode.
#
# THE CLARIFICATION DIRECTORY IS REPLACED WHOLESALE, AND NOTHING IS DELETED. An
# existing target is moved aside by `hr_remote_move_aside` before the bundle's
# copy goes in, so a stale local pair cannot survive and no recursive removal is
# ever shelled out. A bundle carrying no clarification directory leaves the
# target alone: in a mirror it may hold an answer not yet relayed.
#
# 0 restored; 1 a missing argument, an unknown <mode>, a failed move aside or a
# failed copy; 2 — touching nothing — when the bundle is unrecognised (no
# readable `status.json`, a schema other than `HR_REMOTE_STATE_SCHEMA`, or a
# `branch` other than <branch>) or <root>'s configuration is unresolvable.
hr_remote_bundle_restore() {
  local bundle="${1-}" root="${2-}" branch="${3-}" mode="${4-}"
  local state base named target tmp pdir file rel p inset
  HR_REMOTE_PLANNING_PLACED=0
  HR_REMOTE_PLANNING_KEPT=0
  [ -n "$bundle" ] && [ -n "$root" ] && [ -n "$branch" ] || return 1
  case "$mode" in
    job|mirror) ;;
    *) return 1 ;;
  esac
  hr_remote_names_var
  bundle=${bundle%/}
  named=$(hr_remote_status_get "$bundle/$HR_REMOTE_STATUS_FILE" branch) || return 2
  [ "$named" = "$branch" ] || return 2
  hr_remote_state_dir_var "$root" || return 2
  state=$HR_REMOTE_STATE_DIR
  base="${root%/}/$state"

  if [ -d "$bundle/$HR_REMOTE_CLARIFY_DIR/$branch" ]; then
    target="$base/$HR_REMOTE_CLARIFY_DIR/$branch"
    if [ -e "$target" ]; then
      hr_remote_move_aside "$root" "$HR_REMOTE_CLARIFY_DIR/$branch" || return 1
    fi
    mkdir -p "${target%/*}" 2>/dev/null || return 1
    cp -R "$bundle/$HR_REMOTE_CLARIFY_DIR/$branch" "$target" 2>/dev/null || return 1
  fi
  if [ -f "$bundle/$HR_REMOTE_PAUSE_FILE" ]; then
    mkdir -p "$base" 2>/dev/null || return 1
    cp "$bundle/$HR_REMOTE_PAUSE_FILE" "$base/$HR_REMOTE_PAUSE_FILE" 2>/dev/null || return 1
  fi
  [ "$mode" = job ] || return 0

  if [ -f "$bundle/$HR_REMOTE_WALKER_FILE" ]; then
    mkdir -p "$base" 2>/dev/null || return 1
    cp "$bundle/$HR_REMOTE_WALKER_FILE" "$base/$HR_REMOTE_WALKER_SOURCE" 2>/dev/null || return 1
  fi
  pdir="$bundle/$HR_REMOTE_PLANNING_DIR"
  if [ -d "$pdir" ] && [ ! -L "$pdir" ]; then
    hr_remote_planning_paths "$branch" || return 1
    # Process substitution, not a pipe: the loop must run in this shell so the
    # counters and `return 1` reach the caller.
    while IFS= read -r file; do
      # Re-tested per line: a name holding a newline arrives split and fails here.
      [ -f "$file" ] && [ ! -L "$file" ] || continue
      rel=${file#"$pdir"/}
      case "/$rel/" in
        */../*) continue ;;
      esac
      inset=0
      while IFS= read -r p; do
        case "$rel" in
          "$p"|"$p"/*) inset=1; break ;;
        esac
      done <<EOF
$HR_REMOTE_PLANNING_PATHS
EOF
      [ "$inset" = 1 ] || continue
      if [ -e "$base/$rel" ] || [ -L "$base/$rel" ]; then
        HR_REMOTE_PLANNING_KEPT=$((HR_REMOTE_PLANNING_KEPT + 1))
        continue
      fi
      target="$base/$rel"
      mkdir -p "${target%/*}" 2>/dev/null || return 1
      cp "$file" "$target" 2>/dev/null || return 1
      HR_REMOTE_PLANNING_PLACED=$((HR_REMOTE_PLANNING_PLACED + 1))
    done < <(find "$pdir" -type f 2>/dev/null)
  fi
  mkdir -p "$base/$HR_REMOTE_LOGS_DIR" 2>/dev/null || return 1
  tmp=$(mktemp "$base/$HR_REMOTE_STATUS_SOURCE.tmp.XXXXXX" 2>/dev/null) || return 1
  if cp "$bundle/$HR_REMOTE_STATUS_FILE" "$tmp" 2>/dev/null \
    && mv "$tmp" "$base/$HR_REMOTE_STATUS_SOURCE" 2>/dev/null; then
    return 0
  fi
  rm -f "$tmp"
  return 1
}

# ---------------------------------------------------------------------------
# THE MACHINE-LEVEL USAGE LANE.
#
# WHAT IT EXISTS TO STOP. The rate-limit window these runs consume belongs to the
# ACCOUNT, while every pause and resume decision is made from per-repository
# files. Two daemons on one machine therefore each compute a resume time as if
# they were the sole consumer: repository A pauses, repository B keeps spending
# the shared window, A's resume time arrives already stale, A wakes, re-hits its
# own gate and re-pauses. The published record carries the one fact a repository
# cannot see for itself: what the rest of the machine has already observed of the
# shared window. The advisory lock is the separate, opt-in half — it serializes
# which repository on this machine starts.
#
# TWO HALVES, AND NEITHER LIMIT IS DERIVABLE FROM THE OTHER. The record
# COORDINATES and is on by default (`USAGE_LANE_STATE_ENABLED`, `1`); by itself
# it defers nobody. The lock SERIALIZES which repository starts, and is opt-in
# and off by default (`USAGE_LANE_LOCK_ENABLED`, `0`). The per-repository cap
# bounds HOW MANY runs one repository has in flight: a repository holding the
# lock still obeys its own cap, and one that cannot take it starts nothing
# however much of its own capacity is free. Both knobs belong to the WATCHER —
# this library reads neither, and reads no environment variable in place of a
# configured value.
#
# FOUR ARTIFACTS, ALL UNDER `hr_lane_dir` (created 0700, outside every
# repository):
#
#   usage-state.json  the worst assessment any watcher has published:
#                     {"schema":1,"state":"allowed|warning|overage|rejected|unknown",
#                      "resume_at":<epoch>,"observed_at":<epoch>,
#                      "observed_by":{"repo":"<slug>","branch":"<branch>"}}
#                     Written atomically — a temp file in the same directory plus
#                     a rename — so a reader sees the old record or the new one
#                     and never a half-written line.
#   run-lane.lock     a DIRECTORY holding one `owner` file whose single line is
#                     `<slug> <pid> <acquired_at>`.
#   run-profiles/<slug>/<branch>.json
#                     the per-run settings copy the watcher writes at every
#                     launch, re-rendered at every spawn, and removed by
#                     `cleanup-merged-worktrees.sh` with its run's copy. This
#                     library only names it (`hr_run_profile_file`); it writes
#                     none.
#   run-profiles/<slug>/<branch>.absent
#                     the absent-path manifest beside it: one protected path per
#                     line that did not exist before the session, so the sweep
#                     may remove a placeholder left there. Named by
#                     `hr_run_profile_absent_file`, listed by
#                     `hr_run_profile_absent_files`, written by
#                     `hr_placeholder_manifest_write`, read by
#                     `hr_placeholder_sweep_var`, and removed with the profile.
#
# THE LOCK IS A DIRECTORY BECAUSE `mkdir` IS THE ATOMIC PRIMITIVE AVAILABLE HERE.
# `flock(1)` is a util-linux program and is absent on macOS; the shell's own
# `set -o noclobber` redirection is defeated by an inherited `-C`. `mkdir` fails
# when the name exists, on both supported platforms and on bash 3.2, which is the
# whole test-and-set this needs.
#
# MERGED WORST-WINS, AND "WORSE" IS (STATE, THEN RESUME TIME). A publisher
# replaces the stored record when its own state ranks higher, when the state
# ranks the SAME and its resume time is later (the same state binding for longer
# is the worse fact for every consumer), or when the stored record is SPENT — its
# `resume_at` has passed, or it reported no resume time at all and has aged past
# `HR_LANE_STATE_MAX_AGE_SECS`. Without that last clause a record that named no
# reset would pin the file for the life of the machine.
#
# FAIL OPEN ON THE STATE, CLOSED ON THE LANE. An absent, unreadable or
# unparsable `usage-state.json` reads as `unknown 0`, which defers nobody:
# pausing on an unreadable file would put a machine-level fault in charge of run
# state, and each repository's own gate is what pauses its runs. A lock directory
# that cannot be read or created is NOT assumed free: `hr_lane_acquire` returns
# non-zero, and the caller defers exactly as it defers for its own cap. The
# closed half is reached only when the caller has enabled the lock.
#
# THE STALE-BREAKER, AND WHY IT REPORTS THROUGH A VARIABLE. A lock is broken and
# re-taken when its owning pid no longer exists AND its record has aged past
# `HR_LANE_LOCK_STALE_SECS`, or — whatever that pid says — when the record has
# aged past `HR_LANE_LOCK_MAX_AGE_SECS`. NEITHER SIGNAL IS SUFFICIENT ON ITS
# OWN. A dead pid does not mean an idle machine: a one-shot pass takes the lane,
# starts a run that outlives it and exits, so its pid is gone within the second
# while its run is still going — breaking on that alone would put two
# repositories on the machine every time. A live pid does not mean a live
# holder either, since a pid is recycled. Breaking renames the directory aside
# before removing it, so a competing breaker that has already re-created the
# lock cannot have its fresh `owner` deleted by this one — and, for the same
# reason, a lock too young to be stale is held even when its `owner` file has
# not been written yet. The previous owner is reported in
# `HR_LANE_BROKEN_OWNER` for the caller to log, because this file prints nothing.
#
# THE THREE CEILINGS ARE THE ONLY ENVIRONMENT VALUES THAT CARRY POLICY HERE. The
# file's other environment reads are location anchors, not policy:
# `XDG_STATE_HOME` and `HOME` in `hr_lane_dir`, `XDG_CONFIG_HOME` and `HOME` in
# `hr_machine_config_dir`, `XDG_CACHE_HOME` and `HOME` in `hr_cache_dir`, `PWD` in `hr_repo_root` and `hr_main_repo`. The
# ceilings are machine-scoped policy with no configuration key:
#
#   HR_LANE_STATE_MAX_AGE_SECS   21600  when a PUBLISHED RECORD THAT NAMED NO
#                                       reset time stops holding the merge — one
#                                       5-hour window plus slack. Applied only to
#                                       such a record, so a legitimately long
#                                       weekly window is never aged out from
#                                       under its own `resume_at`.
#   HR_LANE_LOCK_STALE_SECS        900  how long a lock whose owner pid is GONE
#                                       is still honored — long enough to cover a
#                                       holder that runs as a series of one-shot
#                                       passes rather than as a daemon, short
#                                       enough that a crashed holder frees the
#                                       machine in minutes.
#   HR_LANE_LOCK_MAX_AGE_SECS    86400  when a lock is broken regardless of its
#                                       pid — far longer than any single run,
#                                       since a holder releases the lane as soon
#                                       as it has nothing live.
# ---------------------------------------------------------------------------

# The machine-local lane directory — one per machine, deliberately not per
# repository and deliberately not a configuration key: the thing it coordinates
# is an account budget that no single repository owns. Return 1 when there is no
# home to anchor it to. The location stays redirectable through
# `XDG_STATE_HOME`.
hr_lane_dir() {
  local base="${XDG_STATE_HOME-}"
  [ -n "$base" ] || base="${HOME-}/.local/state"
  case "$base" in
    /.local/state) return 1 ;;
  esac
  [ -n "$base" ] || return 1
  printf '%s/autonomous-sdlc-harness\n' "${base%/}"
}

# The three artifact paths, so no caller re-joins any of the strings.
hr_lane_state_file() {
  local dir
  dir=$(hr_lane_dir) || return 1
  printf '%s/usage-state.json\n' "$dir"
}

hr_lane_lock_dir() {
  local dir
  dir=$(hr_lane_dir) || return 1
  printf '%s/run-lane.lock\n' "$dir"
}

# hr_run_profile_file <repo slug> <branch> — print
# `<hr_lane_dir>/run-profiles/<slug>/<hr_sanitize_branch branch>.json`; return
# 1, printing nothing, when `hr_lane_dir` cannot anchor or an argument is
# empty. Creates nothing. Its callers: `autonomous-watcher.sh`'s
# `run_profile_render`, which writes the file and makes its directory,
# `cleanup-merged-worktrees.sh`'s `profile_remove`, which deletes it after the
# run's copy is removed, and `hr_run_profile_absent_file` below.
hr_run_profile_file() {
  local slug="${1-}" dir safe
  [ -n "$slug" ] || return 1
  safe=$(hr_sanitize_branch "${2-}") || return 1
  dir=$(hr_lane_dir) || return 1
  printf '%s/run-profiles/%s/%s.json\n' "$dir" "$slug" "$safe"
}

# hr_run_profile_absent_file <repo slug> <branch> — print `hr_run_profile_file`'s
# path with `.json` replaced by `.absent`; return 1, printing nothing, whenever
# `hr_run_profile_file` refuses. Creates nothing.
hr_run_profile_absent_file() {
  local file
  file=$(hr_run_profile_file "${1-}" "${2-}") || return 1
  printf '%s.absent\n' "${file%.json}"
}

# hr_run_profile_absent_files <repo slug> — print every existing manifest
# `hr_run_profile_absent_file` names for <slug>, one per line: a regular file,
# never a symbolic link. 0, printing nothing for an absent directory; 1,
# printing nothing, whenever `hr_run_profile_absent_file` refuses. Creates
# nothing. The directory and the suffix are that function's answer for the
# branch `*`, split at its last `/`, so neither is spelled here. Its callers:
# `autonomous-watcher.sh`'s `placeholder_manifests_var`, for
# `placeholder_start_recover` and `placeholder_sweep_pass`.
hr_run_profile_absent_files() {
  local pattern dir leaf m
  pattern=$(hr_run_profile_absent_file "${1-}" '*') || return 1
  dir="${pattern%/*}"
  leaf="${pattern##*/}"
  [ -d "$dir" ] || return 0
  # `$leaf` is unquoted so it globs; it holds no whitespace.
  for m in "$dir"/$leaf; do
    [ -f "$m" ] && [ ! -L "$m" ] || continue
    printf '%s\n' "$m"
  done
  return 0
}

# hr_placeholder_manifest_write <manifest> <path>... — write <manifest> with one
# line per <path> that neither exists nor is a symbolic link now; a path
# carrying a newline is skipped. Written through a mode-600 temp file in the
# manifest's directory (created 0700) plus `mv -f`, so a reader sees the old
# manifest or the new one. 1 on any failed step, leaving an earlier manifest
# untouched; 0 otherwise.
hr_placeholder_manifest_write() {
  local manifest="${1-}" dir tmp p nl='
'
  [ -n "$manifest" ] || return 1
  shift
  case "$manifest" in
    */*) dir="${manifest%/*}" ;;
    *) dir="." ;;
  esac
  [ -n "$dir" ] || dir="/"
  (umask 077 && mkdir -p "$dir") 2>/dev/null || return 1
  chmod 700 "$dir" 2>/dev/null || return 1
  tmp=$(mktemp "$dir/.absent.XXXXXX" 2>/dev/null) || return 1
  if ! chmod 600 "$tmp" 2>/dev/null; then
    rm -f -- "$tmp"
    return 1
  fi
  if ! (
    for p in "$@"; do
      case "$p" in *"$nl"*) continue ;; esac
      if [ ! -e "$p" ] && [ ! -L "$p" ]; then printf '%s\n' "$p" || exit 1; fi
    done
  ) >"$tmp" 2>/dev/null; then
    rm -f -- "$tmp"
    return 1
  fi
  if ! mv -f "$tmp" "$manifest" 2>/dev/null; then
    rm -f -- "$tmp"
    return 1
  fi
  return 0
}

# ---------------------------------------------------------------------------
# PLACEHOLDER LEFTOVERS — on a bubblewrap host, a session killed mid-call can
# leave each absent `denyWrite` path it mounted as a read-only empty file on
# disk (`docs/sandbox-verification.md` → §5 F9). The sweep removes such a file,
# from outside the sandbox, only at a path a manifest recorded as absent before
# the session, and only when `hr_placeholder_leftover_var` says it is one.
#
# A SESSION-PLANTED FILE WITH CONTENT IS NEVER REMOVED, so the clone check
# still refuses it. Neither function sets a shell option or logs; the caller
# owns every line.
# ---------------------------------------------------------------------------

# hr_placeholder_leftover_var <path> — THE ONE HOME of the "is this a
# placeholder leftover" test. 0 when <path> is a regular file and not a
# symbolic link, 0 bytes, carries no write bit for user, group or other, and is
# owned by the effective user; `HR_PLACEHOLDER_REASON` is then empty. Otherwise 1,
# with `HR_PLACEHOLDER_REASON` the first failed test's reason: `not a regular
# file`, `has content`, `writable` or `not owned by this user`. Removes nothing.
# The write bits are read with `find -perm`, which BSD and GNU both take, because
# `stat`'s format flags differ between them; a `find` that fails reads as
# `writable`. Its callers: `hr_placeholder_sweep_var` below, and the no-git
# main-checkout walk.
hr_placeholder_leftover_var() {
  local path="${1-}" probe writable
  HR_PLACEHOLDER_REASON=""
  if [ -z "$path" ] || [ ! -f "$path" ] || [ -L "$path" ]; then
    HR_PLACEHOLDER_REASON="not a regular file"
    return 1
  fi
  if [ -s "$path" ]; then
    HR_PLACEHOLDER_REASON="has content"
    return 1
  fi
  probe="$path"
  case "$probe" in -*) probe="./$probe" ;; esac
  if ! writable=$(find "$probe" -prune \( -perm -u+w -o -perm -g+w -o -perm -o+w \) -print </dev/null 2>/dev/null) ||
    [ -n "$writable" ]; then
    HR_PLACEHOLDER_REASON="writable"
    return 1
  fi
  if [ ! -O "$path" ]; then
    HR_PLACEHOLDER_REASON="not owned by this user"
    return 1
  fi
  return 0
}

# hr_placeholder_sweep_var <manifest>... — for each line of each readable
# manifest naming a path that exists (`-e` or `-L`), remove it with a
# non-recursive `rm -f` only when `hr_placeholder_leftover_var` answers 0. Sets
# `HR_PLACEHOLDER_REMOVED` (the removed paths) and `HR_PLACEHOLDER_KEPT`
# (`<path>: <reason>` for each listed path that exists and was not removed), one
# per line; an absent path is in neither. Never touches a path no manifest
# lists. 0, or 1 when no manifest argument was readable.
hr_placeholder_sweep_var() {
  local m p readable=0 nl='
'
  HR_PLACEHOLDER_REMOVED=""
  HR_PLACEHOLDER_KEPT=""
  for m in "$@"; do
    [ -n "$m" ] && [ -f "$m" ] && [ -r "$m" ] || continue
    readable=1
    while IFS= read -r p || [ -n "$p" ]; do
      [ -n "$p" ] || continue
      [ -e "$p" ] || [ -L "$p" ] || continue
      if ! hr_placeholder_leftover_var "$p"; then
        HR_PLACEHOLDER_KEPT="$HR_PLACEHOLDER_KEPT$p: $HR_PLACEHOLDER_REASON$nl"
      elif rm -f -- "$p" 2>/dev/null && [ ! -e "$p" ] && [ ! -L "$p" ]; then
        HR_PLACEHOLDER_REMOVED="$HR_PLACEHOLDER_REMOVED$p$nl"
      else
        HR_PLACEHOLDER_KEPT="$HR_PLACEHOLDER_KEPT$p: could not be removed$nl"
      fi
    done <"$m"
  done
  HR_PLACEHOLDER_REMOVED="${HR_PLACEHOLDER_REMOVED%"$nl"}"
  HR_PLACEHOLDER_KEPT="${HR_PLACEHOLDER_KEPT%"$nl"}"
  [ "$readable" -eq 1 ] || return 1
  return 0
}

# Print the lane directory, creating it 0700 when it is not there. Return 1 —
# printing nothing — when it cannot be created or cannot be written to, which is
# the fail-CLOSED half of the contract: every writer below starts here.
hr_lane_mkdir() {
  local dir
  dir=$(hr_lane_dir) || return 1
  if [ ! -d "$dir" ]; then
    # The umask makes the directory private from the instant it exists rather
    # than a `chmod` later; the `chmod` narrows a directory created under a
    # laxer umask by a version of this file that did not.
    (umask 077 && mkdir -p "$dir") 2>/dev/null || return 1
    chmod 700 "$dir" 2>/dev/null || :
  fi
  [ -d "$dir" ] && [ -w "$dir" ] || return 1
  printf '%s\n' "$dir"
}

# A path's modification time as an epoch, or 0. THE FALLBACK IS CHOSEN ON THE
# VALUE, NOT THE EXIT STATUS: `-f` means `--file-system` to GNU `stat`, which
# therefore succeeds while printing something that is not a timestamp. The only
# `stat` in this file. Two kinds of caller depend on the 0-for-missing-or-
# unreadable answer: a lock directory whose `owner` file is missing or
# unreadable, where the directory's own mtime is the only acquisition time
# there is; and `run-test-suite.sh`'s `heartbeat_age`, which reads a run's
# `<label>.running` heartbeat and treats 0 as "cannot be read", never as a time.
hr_lane_mtime() {
  local path="${1-}" m=""
  [ -n "$path" ] && [ -e "$path" ] || {
    printf '0\n'
    return 0
  }
  m=$(stat -f %m "$path" 2>/dev/null)
  case "$m" in '' | *[!0-9]*) m="" ;; esac
  if [ -z "$m" ]; then
    m=$(stat -c %Y "$path" 2>/dev/null)
    case "$m" in '' | *[!0-9]*) m="" ;; esac
  fi
  [ -n "$m" ] || m=0
  printf '%s\n' "$m"
}

# Set `HR_LANE_RANK` to a lane state's severity. A state this vocabulary does not
# know ranks 0 — "no information" — so a hand-edited or truncated value can never
# defer anybody, which is the fail-open rule applied at the one place it decides
# anything.
hr_lane_rank_var() {
  case "${1-}" in
    rejected) HR_LANE_RANK=4 ;;
    overage) HR_LANE_RANK=3 ;;
    warning) HR_LANE_RANK=2 ;;
    allowed) HR_LANE_RANK=1 ;;
    *) HR_LANE_RANK=0 ;;
  esac
}

# Set `HR_LANE_STATE`, `HR_LANE_RESUME_AT`, `HR_LANE_OBSERVED_AT` and
# `HR_LANE_OBSERVED_REPO` from the published record. ALWAYS returns 0 with a
# usable answer — `unknown`, `0`, `0`, `` — when the record is absent,
# unreadable, not an object, not JSON at all, or `jq` is missing. Every field is
# validated after it is read, so a hand-written file cannot put a value the rest
# of the lane does not understand into a comparison.
hr_lane_read_var() {
  local file out st ra oa repo
  HR_LANE_STATE="unknown"
  HR_LANE_RESUME_AT=0
  HR_LANE_OBSERVED_AT=0
  HR_LANE_OBSERVED_REPO=""
  file=$(hr_lane_state_file) || return 0
  [ -f "$file" ] && [ -r "$file" ] || return 0
  hr_have_jq || return 0
  out=$(jq -r '
    if type == "object"
    then "\(.state // "unknown") \(.resume_at // 0) \(.observed_at // 0) \(.observed_by.repo // "")"
    else empty
    end' "$file" 2>/dev/null) || return 0
  [ -n "$out" ] || return 0
  st=""
  ra=""
  oa=""
  repo=""
  read -r st ra oa repo <<EOF
$out
EOF
  case "$st" in
    allowed | warning | overage | rejected | unknown) ;;
    *) st="unknown" ;;
  esac
  # A non-integer epoch — a float, a quoted string, a truncated write — reads as
  # "no time reported" rather than as an error: the consumers below compare it
  # with `-gt`, where a non-numeric operand aborts the pass.
  case "$ra" in '' | *[!0-9]*) ra=0 ;; esac
  case "$oa" in '' | *[!0-9]*) oa=0 ;; esac
  HR_LANE_STATE="$st"
  HR_LANE_RESUME_AT="$ra"
  HR_LANE_OBSERVED_AT="$oa"
  HR_LANE_OBSERVED_REPO="$repo"
  return 0
}

# Echo `"<state> <resume_at>"` — the published record, or `unknown 0` when there
# is nothing usable to publish from. The shape deliberately matches the per-repo
# gate's own assessment output, so a caller reads both the same way.
hr_lane_read() {
  hr_lane_read_var
  printf '%s %s\n' "$HR_LANE_STATE" "$HR_LANE_RESUME_AT"
}

# hr_lane_publish <slug> <branch> <state> <resume_at>
#
# Merge this repository's assessment into the shared record, worst-wins (see the
# section header for what "worse" means and when a stored record is spent).
# Returns 0 when the file now reflects the worst known observation — INCLUDING
# the case where the stored record was already worse and was deliberately left
# alone — and 1 only when the lane directory or the write could not be had.
#
# `<state>` outside the vocabulary is published as `unknown`, and both identity
# fields are reduced to a safe character set: this writes JSON with `printf`
# rather than `jq`, so a value that could carry a quote or a backslash into the
# document is not written at all.
hr_lane_publish() {
  local slug="${1-}" branch="${2-}" state="${3-}" resume_at="${4-}"
  local dir file tmp now new_rank old_rank replace=0 ceiling
  [ -n "$slug" ] || return 1
  case "$state" in
    allowed | warning | overage | rejected | unknown) ;;
    *) state="unknown" ;;
  esac
  case "$resume_at" in '' | *[!0-9]*) resume_at=0 ;; esac
  slug=${slug//[!a-zA-Z0-9._-]/-}
  branch=${branch//[!a-zA-Z0-9._\/-]/-}
  now=$(date +%s 2>/dev/null) || now=0
  case "$now" in '' | *[!0-9]*) now=0 ;; esac

  dir=$(hr_lane_mkdir) || return 1
  file="$dir/usage-state.json"

  hr_lane_read_var
  hr_lane_rank_var "$state"
  new_rank=$HR_LANE_RANK
  hr_lane_rank_var "$HR_LANE_STATE"
  old_rank=$HR_LANE_RANK
  ceiling=${HR_LANE_STATE_MAX_AGE_SECS:-21600}
  case "$ceiling" in '' | *[!0-9]*) ceiling=21600 ;; esac

  if [ ! -f "$file" ]; then
    replace=1
  elif [ "$new_rank" -gt "$old_rank" ]; then
    replace=1
  elif [ "$new_rank" -eq "$old_rank" ] && [ "$resume_at" -gt "$HR_LANE_RESUME_AT" ]; then
    replace=1
  elif [ "$HR_LANE_RESUME_AT" -gt 0 ] && [ "$now" -ge "$HR_LANE_RESUME_AT" ]; then
    replace=1
  elif [ "$HR_LANE_RESUME_AT" -le 0 ] && [ "$now" -ge $((HR_LANE_OBSERVED_AT + ceiling)) ]; then
    replace=1
  fi
  [ "$replace" -eq 1 ] || return 0

  # Same directory, so the rename below is within one filesystem and therefore
  # atomic; a reader mid-publish sees the previous record, never a partial one.
  tmp=$(mktemp "$dir/.usage-state.XXXXXX" 2>/dev/null) || tmp="$dir/.usage-state.$$.tmp"
  chmod 600 "$tmp" 2>/dev/null || :
  if ! printf '{"schema":1,"state":"%s","resume_at":%s,"observed_at":%s,"observed_by":{"repo":"%s","branch":"%s"}}\n' \
    "$state" "$resume_at" "$now" "$slug" "$branch" >"$tmp" 2>/dev/null; then
    rm -f "$tmp" 2>/dev/null || :
    return 1
  fi
  if ! mv "$tmp" "$file" 2>/dev/null; then
    rm -f "$tmp" 2>/dev/null || :
    return 1
  fi
  return 0
}

# Write the owner record of a lock we hold or have just created: `<slug> <pid>
# <acquired_at>`, through a temp file and a rename so a reader never sees a
# half-written line. `$$` is this shell's pid and is unchanged inside `$(…)`, so
# a caller that reaches the lane through a command substitution would record its
# PARENT's pid — which is why every lane call site invokes these unsubstituted.
hr_lane_write_owner() {
  local lock="${1-}" slug="${2-}" at="${3-}" tmp
  [ -n "$lock" ] && [ -n "$slug" ] || return 1
  case "$at" in '' | *[!0-9]*) at=0 ;; esac
  tmp="$lock/.owner.$$"
  if ! printf '%s %s %s\n' "$slug" "$$" "$at" >"$tmp" 2>/dev/null; then
    rm -f "$tmp" 2>/dev/null || :
    return 1
  fi
  if ! mv "$tmp" "$lock/owner" 2>/dev/null; then
    rm -f "$tmp" 2>/dev/null || :
    return 1
  fi
  return 0
}

# Set `HR_LANE_OWNER_SLUG`, `HR_LANE_OWNER_PID` and `HR_LANE_OWNER_AT` and return
# 0 when the lane IS HELD; return 1 (with all three cleared) when it is free or
# when the lane directory cannot be resolved.
#
# A lock whose `owner` file is missing or unreadable is still HELD — the
# directory is the lock, not the file inside it — and the directory's own mtime
# stands in for the acquisition time so the ceiling can still break it. Reading
# it as free would hand two repositories the lane at once, which is the one
# outcome this whole mechanism exists to prevent.
hr_lane_owner_var() {
  local lock line
  HR_LANE_OWNER_SLUG=""
  HR_LANE_OWNER_PID=""
  # Empty, not 0: the mtime fallback below is applied to an EMPTY value, and a
  # placeholder 0 here would look like an acquisition time that was read.
  HR_LANE_OWNER_AT=""
  lock=$(hr_lane_lock_dir) || return 1
  [ -d "$lock" ] || return 1
  line=""
  if [ -r "$lock/owner" ]; then
    IFS= read -r line <"$lock/owner" 2>/dev/null || line=""
  fi
  if [ -n "$line" ]; then
    read -r HR_LANE_OWNER_SLUG HR_LANE_OWNER_PID HR_LANE_OWNER_AT <<EOF
$line
EOF
  fi
  case "${HR_LANE_OWNER_PID-}" in '' | *[!0-9]*) HR_LANE_OWNER_PID="" ;; esac
  case "${HR_LANE_OWNER_AT-}" in '' | *[!0-9]*) HR_LANE_OWNER_AT="" ;; esac
  [ -n "$HR_LANE_OWNER_AT" ] || HR_LANE_OWNER_AT=$(hr_lane_mtime "$lock")
  return 0
}

# Echo `"<slug> <pid> <acquired_at>"` for a HELD lane, using `-` for a field the
# owner record did not carry; return 1, printing nothing, when the lane is free
# or unresolvable. A pure reader: it neither creates the lane directory nor
# breaks anything.
hr_lane_owner() {
  hr_lane_owner_var || return 1
  printf '%s %s %s\n' "${HR_LANE_OWNER_SLUG:--}" "${HR_LANE_OWNER_PID:--}" "${HR_LANE_OWNER_AT:-0}"
}

# hr_lane_acquire <slug>
#
#   0  the lane is ours — taken now, already ours, or taken after breaking a
#      stale lock (in which case `HR_LANE_BROKEN_OWNER` names the previous owner
#      for the caller to log)
#   1  it is held by a foreign owner the breaker's two ceilings still honor, or
#      the lane could not be reached at all — an unwritable directory, a lost
#      race with another breaker, no home
#
# IT NEVER BLOCKS AND NEVER SLEEPS. The caller is a poll loop: waiting inside
# this function would stall every other pass of that loop behind a lock some
# other machine-local daemon is holding for hours. A caller that cannot take the
# lane defers, exactly as it defers for its own concurrency cap, and asks again
# on its next pass.
hr_lane_acquire() {
  local slug="${1-}" dir lock now ceiling stale_ceiling past_ceiling stale live=0
  HR_LANE_BROKEN_OWNER=""
  [ -n "$slug" ] || return 1
  dir=$(hr_lane_mkdir) || return 1
  lock="$dir/run-lane.lock"
  now=$(date +%s 2>/dev/null) || now=0
  case "$now" in '' | *[!0-9]*) now=0 ;; esac

  # The test-and-set. `mkdir` fails when the name exists, atomically, which is
  # the whole primitive this rests on.
  if mkdir "$lock" 2>/dev/null; then
    if hr_lane_write_owner "$lock" "$slug" "$now"; then
      return 0
    fi
    rmdir "$lock" 2>/dev/null || :
    return 1
  fi

  # Anything other than "it already exists" is a lane this process cannot reason
  # about, and an unreachable lane is never assumed free.
  [ -d "$lock" ] || return 1
  hr_lane_owner_var || return 1

  if [ "$HR_LANE_OWNER_SLUG" = "$slug" ]; then
    # Already ours. Re-stamp it, so that after a daemon restart the pid the
    # liveness breaker tests is the live one rather than its predecessor's.
    hr_lane_write_owner "$lock" "$slug" "$now" || :
    return 0
  fi

  # The two ceilings of the stale-breaker (see the section header). The pid only
  # chooses WHICH one applies: a live owner is held until the long ceiling, a
  # vanished one until the short ceiling — never instantly, because a one-shot
  # pass that started a run and exited is a dead pid with a live run behind it.
  ceiling=${HR_LANE_LOCK_MAX_AGE_SECS:-86400}
  case "$ceiling" in '' | *[!0-9]*) ceiling=86400 ;; esac
  if [ -n "$HR_LANE_OWNER_PID" ] && kill -0 "$HR_LANE_OWNER_PID" 2>/dev/null; then
    live=1
  else
    stale_ceiling=${HR_LANE_LOCK_STALE_SECS:-900}
    case "$stale_ceiling" in '' | *[!0-9]*) stale_ceiling=900 ;; esac
    if [ "$stale_ceiling" -lt "$ceiling" ]; then
      ceiling="$stale_ceiling"
    fi
  fi
  # Age is evidence only when both timestamps are real. A record whose
  # acquisition time could not be read at all — no `owner` file AND no usable
  # directory mtime — is not breakable by age: the lane is never taken on a
  # guess. `live` is not tested again here; it has already chosen the ceiling.
  past_ceiling=0
  if [ "$now" -gt 0 ] && [ "$HR_LANE_OWNER_AT" -gt 0 ] && [ $((now - HR_LANE_OWNER_AT)) -ge "$ceiling" ]; then
    past_ceiling=1
  fi
  if [ "$past_ceiling" -eq 0 ]; then
    return 1
  fi

  # Break it. RENAMED ASIDE FIRST, then emptied: a second breaker that has
  # already re-created the lock must not have its fresh `owner` removed by this
  # one. Debris under `run-lane.lock.stale.*` means an operator put something
  # else inside the lock directory — visible, and harmless.
  stale="$lock.stale.$$"
  if [ -e "$stale" ]; then
    # A leftover from an earlier break by this same pid. Cleared first, because
    # `mv` into an EXISTING directory would move the lock INSIDE it instead of
    # renaming it, and the lock would then still be there.
    rm -f "$stale/owner" 2>/dev/null || :
    rmdir "$stale" 2>/dev/null || :
    if [ -e "$stale" ]; then
      return 1
    fi
  fi
  HR_LANE_BROKEN_OWNER="${HR_LANE_OWNER_SLUG:--} ${HR_LANE_OWNER_PID:--} ${HR_LANE_OWNER_AT:-0}"
  if ! mv "$lock" "$stale" 2>/dev/null; then
    HR_LANE_BROKEN_OWNER=""
    return 1
  fi
  rm -f "$stale/owner" 2>/dev/null || :
  rmdir "$stale" 2>/dev/null || :
  if mkdir "$lock" 2>/dev/null; then
    if hr_lane_write_owner "$lock" "$slug" "$now"; then
      return 0
    fi
    # Took the directory and could not name an owner in it: remove it rather
    # than leave an unattributable lock the ceilings would honor.
    rmdir "$lock" 2>/dev/null || :
  fi
  # Another breaker won the re-take, or the owner could not be written. Nothing
  # was granted, so nothing is reported.
  HR_LANE_BROKEN_OWNER=""
  return 1
}

# hr_lane_release <slug>
#
#   0  the lane is not held by <slug> any more — released now, or already free
#   1  it is held by SOMEBODY ELSE (nothing was touched), or the removal failed
#
# ONLY THE OWNER RELEASES. A watcher that cleared a lane it does not own would
# put two repositories on the machine at once, which is exactly what the lock is
# for; a lane held by a dead foreign owner is `hr_lane_acquire`'s business to
# break, not this one's.
hr_lane_release() {
  local slug="${1-}" lock
  [ -n "$slug" ] || return 1
  lock=$(hr_lane_lock_dir) || return 1
  [ -d "$lock" ] || return 0
  hr_lane_owner_var || return 0
  [ "$HR_LANE_OWNER_SLUG" = "$slug" ] || return 1
  rm -f "$lock/owner" 2>/dev/null || :
  rmdir "$lock" 2>/dev/null || return 1
  return 0
}
