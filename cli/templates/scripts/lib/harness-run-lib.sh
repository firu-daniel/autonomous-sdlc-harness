#!/usr/bin/env bash
# harness-run-lib.sh — the one place every generated outer-loop script resolves
# the repository it is operating on, reads that repository's
# `harness.config.json` at run time, answers "is this branch protected?",
# routes an inbox filename to its engine and branch (`hr_inbox_route_var`),
# derives a branch name from a title (`hr_derive_branch`), judges whether a
# path lies strictly inside the state directory's scratch directory
# (`hr_scratch_path_var`), places a dropped
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
# `git rev-parse --show-toplevel` at the directory the caller names. Nothing
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
#      `hr_registry_init`, `hr_registry_set`, `hr_remote_record_init` (through
#      `hr_registry_set`) and the `hr_registry_lock` / `hr_registry_unlock`
#      pair `hr_registry_set` calls.
#   3. THE REMOTE STATE BUNDLE writes the files its format lists. Fence: inside
#      `<root>/<state_dir>/` (resolved through `hr_state_dir`), only
#      `autonomous_logs/remote_status.json`, `clarifications/<branch>/`,
#      `PAUSE_PROGRESS.md`, `.flow_walker_state`, the move-aside directory
#      `autonomous_logs/remote_superseded/` and, only where nothing exists yet,
#      files under the eight planning paths `hr_remote_planning_paths` assigns;
#      outside it, only the caller-named `<out_dir>` (its `planning/` included)
#      of `hr_remote_bundle_write` and the caller-named `<out_json>`
#      of `hr_remote_status_write`. Written only by `hr_remote_status_write`,
#      `hr_remote_bundle_write` and `hr_remote_bundle_restore`, and nothing
#      there but a writer's own failed temp file is ever removed.
#   4. THE ARTIFACT PLACEMENT writes one artifact into a working copy. Fence:
#      the caller-named `<worktree>/<rel>`, its parent directories and that
#      path's index entry, plus whatever the two caller-named wrappers do.
#      Written only by `hr_place_artifact`, `hr_commit_placed` and
#      `hr_push_landed`.
#
# MIRRORS OF `cli/src/remote/githubActions.ts`, which owns these names; a
# rename there is an edit here, byte for byte:
#   HR_REMOTE_WORKFLOW_RUN_FILE mirrors  WORKFLOW_RUN_FILE
#   HR_REMOTE_STATE_ARTIFACT    mirrors  STATE_ARTIFACT_NAME
#
# A caller that calls no `hr_lane_*`, `hr_registry_init`, `hr_registry_set`,
# `hr_remote_record_init`, `hr_registry_lock`, `hr_registry_unlock`, `hr_remote_status_write`,
# `hr_remote_bundle_write`, `hr_remote_bundle_restore`, `hr_place_artifact`,
# `hr_commit_placed` or `hr_push_landed` function still gets a library that only reads. The
# lane's ceilings are the only environment values here that carry policy, because
# the lane is machine-scoped and has no configuration key to carry them; each is
# named where it is used. `XDG_STATE_HOME`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`,
# `HOME` and `PWD` are also read, as location anchors only, and `PATH` is read by
# `hr_path_with_fallbacks` alone — as that function's input, which it prints back
# transformed and never assigns. `GITHUB_RUN_ID`, `GITHUB_SERVER_URL`,
# `GITHUB_REPOSITORY` and `HARNESS_INPUT_CHAIN` are read by
# `hr_remote_status_write` alone, as provenance values copied into
# `status.json` — never a configured value and never policy.
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
# because callers capture stdout. The one pass-through is the registry's two
# writers, `hr_registry_init` and `hr_registry_set`, which leave the shell's,
# `mktemp`'s and `jq`'s own stderr on a failed write to the caller, as the
# watcher's bodies they replaced did — that stream is the watcher's log — and
# add one line of their own, naming the lock, when `hr_registry_set` cannot
# take the registry lock. The artifact placement's three writers likewise leave
# `mkdir`'s, `cp`'s, `git add`'s and both wrappers' own output on their stdout
# and stderr for the caller to redirect into its log.
# That silence is why the lane reports a lock it BROKE through a
# variable instead of a log line — the caller owns the log.
#
# NAMING. Every function is prefixed `hr_`; every variable this file touches
# outside a `local` is prefixed `HR_`. The `HR_`-prefixed ones exist to return a
# value WITHOUT a command substitution — a `$(…)` forks a subshell, and the
# watcher calls these on every tick: `HR_CFG_PID`, `HR_CFG_ROOT`,
# `HR_CFG_STATE`, `HR_CFG_FILE`, `HR_CFG_SCALARS`, `HR_CFG_LISTS`,
# `HR_CFG_VALUE`, `HR_CFG_COMMAND_KEYS`, `HR_PROTECTED_DEFAULT`,
# `HR_INBOX_KIND`, `HR_INBOX_BRANCH`, the branch derivation's
# `HR_BRANCH_SLUG_MAX`, `HR_BRANCH_SUFFIX_MAX`, `HR_TAKEN_REMOTE`,
# `HR_TAKEN_ARTIFACTS` and `HR_TAKEN_WHY`, and the lane's
# `HR_LANE_RANK`, `HR_LANE_STATE`, `HR_LANE_RESUME_AT`, `HR_LANE_OBSERVED_AT`,
# `HR_LANE_OBSERVED_REPO`, `HR_LANE_OWNER_SLUG`, `HR_LANE_OWNER_PID`,
# `HR_LANE_OWNER_AT` and `HR_LANE_BROKEN_OWNER`, and the remote state bundle's
# names, which `hr_remote_names_var` assigns, with `HR_REMOTE_PLANNING_PATHS`
# (`hr_remote_planning_paths`) and `HR_REMOTE_PLANNING_PLACED` /
# `HR_REMOTE_PLANNING_KEPT` (`hr_remote_bundle_restore`). Every one of them is assigned
# before it is read by the function that owns it, so an inherited value from a
# parent process is overwritten rather than believed.
#
# BASH 3.2 IS THE FLOOR. macOS ships `/bin/bash` 3.2, so nothing here uses an
# associative array, `${var^^}` / `${var,,}`, `mapfile` or `local -n`. The cache
# below is a string-record store for exactly that reason, and the one
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
# in that exact spelling, and a flag appended to it is a different string that
# stalls on a prompt.
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
  # A `phases.*` value that is not a boolean is emitted as `invalid`, so the
  # string `"true"` — which `tostring` would otherwise make indistinguishable
  # from `true` — reaches `hr_phase_enabled` as a value it refuses (2).
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
      s("forge";                 try .forge                catch null),
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
# cannot be mis-routed — `foo_review_task_prompt.md` is the task engine on branch
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
# THE ARTIFACT PLACEMENT.
#
# THE CONTRACT. The one placement the watcher's inbox pass and a job starting a
# run both perform: copy a dropped artifact into a working copy, stage exactly
# that path, skip an identical re-drop, commit through the caller-named commit
# wrapper, push through the caller-named push wrapper, and read "landed" as
# `origin/<branch>` equal to `HEAD`. Every step reports by exit status only;
# what a failure means — log and launch anyway, or block the dispatch — is the
# caller's decision. The wrapper paths are arguments because this library
# resolves no sibling script. Write exception 4 in the header is this section's.
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

# hr_place_artifact <worktree> <src_file> <rel> — copy <src_file> to
# <worktree>/<rel>, creating its parent. 0, or 1 on a failure.
hr_place_artifact() {
  local worktree="${1-}" src="${2-}" rel="${3-}" dest
  [ -n "$worktree" ] && [ -n "$src" ] && [ -n "$rel" ] || return 1
  dest="$worktree/$rel"
  mkdir -p "${dest%/*}" || return 1
  cp "$src" "$dest" || return 1
  return 0
}

# hr_commit_placed <commit_wrapper> <worktree> <rel> <subject> — stage <rel> and
# commit it through <commit_wrapper>. 0 committed; 3 nothing staged for <rel> (an
# identical re-drop — nothing committed); 1 staging or the wrapper failed.
hr_commit_placed() {
  local wrapper="${1-}" worktree="${2-}" rel="${3-}" subject="${4-}"
  [ -n "$wrapper" ] && [ -n "$worktree" ] && [ -n "$rel" ] && [ -n "$subject" ] || return 1
  git -C "$worktree" add -- "$rel" || return 1
  git -C "$worktree" diff --cached --quiet -- "$rel" && return 3
  "$wrapper" --repo "$worktree" "$rel" -- "$subject" || return 1
  return 0
}

# hr_push_landed <push_wrapper> <worktree> <branch> — run <push_wrapper>, then 0
# only when `HEAD` and `refs/remotes/origin/<branch>` both resolve and are
# equal; 1 otherwise. `push-branch.sh` exits 0 on every path, so its status is
# never the answer.
hr_push_landed() {
  local wrapper="${1-}" worktree="${2-}" branch="${3-}" head upstream
  [ -n "$wrapper" ] && [ -n "$worktree" ] && [ -n "$branch" ] || return 1
  "$wrapper" "$worktree"
  head=$(git -C "$worktree" rev-parse --verify --quiet HEAD) || return 1
  upstream=$(git -C "$worktree" rev-parse --verify --quiet "refs/remotes/origin/$branch") || return 1
  [ -n "$head" ] && [ "$head" = "$upstream" ]
}

# ---------------------------------------------------------------------------
# THE REMOTE STATE BUNDLE.
#
# THE FORMAT OF RECORD. What a remote job carries across a job boundary and
# reports back, uploaded as the Actions artifact `HR_REMOTE_STATE_ARTIFACT`
# names. Every name below is a variable `hr_remote_names_var` assigns, and it
# also assigns `HR_REMOTE_WORKFLOW_RUN_FILE`, the run workflow's file name, for
# the GitHub-route producers `hr_github_answer_route` and
# `hr_github_resume_route`. Those two are mirrors of the header's table; no
# function spells either one, or any other name here.
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
#   control_polled_at       the epoch second up to which the job checked for a
#                           `harness pause <branch>` run, or empty
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

# hr_remote_bundle_write <root> <branch> <registry_file> <out_dir>
#
# Assembles the format above in <out_dir>, which must be absent or empty, from
# <root>'s configured state directory. `status.json` is the job's own
# `autonomous_logs/remote_status.json` when present; otherwise it is written
# from <branch>'s registry record with decision `stop`, because a job that never
# wrote its status never decided to continue. Each planning path present is
# copied under `planning/`, whether or not the branch tracks it: the restore
# never overwrites, so a tracked copy is inert. 0 written; 1 a missing argument,
# a non-empty <out_dir> or a failed copy; 2 <root>'s configuration unresolvable.
hr_remote_bundle_write() {
  local root="${1-}" branch="${2-}" registry="${3-}" out="${4-}" state base clarify rel dst
  [ -n "$root" ] && [ -n "$branch" ] && [ -n "$registry" ] && [ -n "$out" ] || return 1
  state=$(hr_state_dir "$root") || return 2
  hr_remote_names_var
  base="${root%/}/$state"
  out=${out%/}
  if [ -e "$out" ]; then
    [ -d "$out" ] || return 1
    [ -z "$(ls -A "$out" 2>/dev/null)" ] || return 1
  fi
  mkdir -p "$out" 2>/dev/null || return 1

  if [ -f "$base/$HR_REMOTE_STATUS_SOURCE" ]; then
    cp "$base/$HR_REMOTE_STATUS_SOURCE" "$out/$HR_REMOTE_STATUS_FILE" 2>/dev/null || return 1
  else
    hr_remote_status_write "$registry" "$branch" "$out/$HR_REMOTE_STATUS_FILE" stop \
      "the job wrote no status; derived from the registry record when the bundle was saved" || return 1
  fi
  if [ -d "$base/$HR_REMOTE_CLARIFY_DIR/$branch" ]; then
    clarify="$out/$HR_REMOTE_CLARIFY_DIR/$branch"
    mkdir -p "${clarify%/*}" 2>/dev/null || return 1
    # No trailing slash on the source: BSD `cp -R dir/` copies the contents instead.
    cp -R "$base/$HR_REMOTE_CLARIFY_DIR/$branch" "$clarify" 2>/dev/null || return 1
  fi
  if [ -f "$base/$HR_REMOTE_PAUSE_FILE" ]; then
    cp "$base/$HR_REMOTE_PAUSE_FILE" "$out/$HR_REMOTE_PAUSE_FILE" 2>/dev/null || return 1
  fi
  if [ -f "$base/$HR_REMOTE_WALKER_SOURCE" ]; then
    cp "$base/$HR_REMOTE_WALKER_SOURCE" "$out/$HR_REMOTE_WALKER_FILE" 2>/dev/null || return 1
  fi
  if [ -f "$base/$HR_REMOTE_LOGS_DIR/$branch.log" ]; then
    cp "$base/$HR_REMOTE_LOGS_DIR/$branch.log" "$out/$HR_REMOTE_LOG_FILE" 2>/dev/null || return 1
  fi
  hr_remote_planning_paths "$branch" || return 1
  while IFS= read -r rel; do
    dst="$out/$HR_REMOTE_PLANNING_DIR/$rel"
    if [ -f "$base/$rel" ]; then
      mkdir -p "${dst%/*}" 2>/dev/null || return 1
      cp "$base/$rel" "$dst" 2>/dev/null || return 1
    elif [ -d "$base/$rel" ]; then
      mkdir -p "${dst%/*}" 2>/dev/null || return 1
      cp -R "$base/$rel" "$dst" 2>/dev/null || return 1
    fi
  done <<EOF
$HR_REMOTE_PLANNING_PATHS
EOF
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
# existing target is moved aside with one `mv` into
# `autonomous_logs/remote_superseded/<epoch>/clarifications/<branch>` (`<epoch>-<n>`
# when an earlier restore took that second) before the
# bundle's copy goes in, so a stale local pair cannot survive and no recursive
# removal is ever shelled out. A bundle carrying no clarification directory
# leaves the target alone: in a mirror it may hold an answer not yet relayed.
#
# 0 restored; 1 a missing argument, an unknown <mode> or a failed copy; 2 —
# touching nothing — when the bundle is unrecognised (no readable `status.json`,
# a schema other than `HR_REMOTE_STATE_SCHEMA`, or a `branch` other than
# <branch>) or <root>'s configuration is unresolvable.
hr_remote_bundle_restore() {
  local bundle="${1-}" root="${2-}" branch="${3-}" mode="${4-}"
  local state base named target epoch aside n tmp pdir file rel p inset
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
  state=$(hr_state_dir "$root") || return 2
  base="${root%/}/$state"

  if [ -d "$bundle/$HR_REMOTE_CLARIFY_DIR/$branch" ]; then
    target="$base/$HR_REMOTE_CLARIFY_DIR/$branch"
    if [ -e "$target" ]; then
      epoch=$(date +%s)
      aside="$base/$HR_REMOTE_SUPERSEDED_DIR/$epoch"
      n=0
      while [ -e "$aside/$HR_REMOTE_CLARIFY_DIR/$branch" ]; do
        n=$((n + 1))
        aside="$base/$HR_REMOTE_SUPERSEDED_DIR/$epoch-$n"
      done
      aside="$aside/$HR_REMOTE_CLARIFY_DIR/$branch"
      mkdir -p "${aside%/*}" 2>/dev/null || return 1
      mv "$target" "$aside" 2>/dev/null || return 1
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
# TWO ARTIFACTS, BOTH UNDER `hr_lane_dir` (created 0700, outside every
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
# unparseable `usage-state.json` reads as `unknown 0`, which defers nobody:
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

# The two artifact paths, so no caller re-joins either string.
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
# `stat` in this file, and it exists for one case — a lock directory whose
# `owner` file is missing or unreadable, where the directory's own mtime is the
# only acquisition time there is.
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
