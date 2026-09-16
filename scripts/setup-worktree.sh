#!/usr/bin/env bash
# setup-worktree.sh — bootstrap the checkout this script sits in, so a run can
# start in it: link the machine-local files a fresh working copy cannot carry in
# git, install the committed pre-push backstop for THIS working copy, install
# dependencies and build.
#
# WHO RUNS IT. create-worktree.sh, immediately after it adds a working copy —
# and a person, by hand, on a checkout that predates a configuration change.
# Every step is idempotent, so re-running it is the supported repair. It is not
# meant to be run by a dispatched agent: it is not agent-invocable, it has no
# entry in the generated permission profile, and it should not get one — it
# installs dependencies and writes git configuration, which are not decisions an
# agent takes. That is a CALLING CONVENTION, NOT A GATE. Its basename is not on
# the script-allowlist guard's `DENY_SCRIPT_BASENAMES`, and that guard grants
# independently of the profile, so an agent that invokes this path under
# `scriptsDir` is auto-allowed today — but only in a PLAIN invocation: that
# guard's construct scan withholds the allow, silently, from any command
# carrying `$(…)`, a backtick, `|`, `<`, a braced form other than a bare
# `${IDENT}`, or a `>` that is neither a descriptor duplication (`2>&1`, `>&2`,
# `2>&-`) nor a redirection to the literal `/dev/null`. Adding the basename to
# `DENY_SCRIPT_BASENAMES` is what would make the convention enforced.
#
# THE FIVE STEPS, AND WHAT EACH DOES WHEN ITS INPUT IS ABSENT.
#
#   1. Version manager. A stack that pins its toolchain through a version
#      manager needs that manager's init file sourced before anything installs.
#      Point `HARNESS_VERSION_MANAGER_INIT` at that file (in the watcher's
#      environment, or in the operator's shell profile) and it is sourced here.
#      Unset, or naming a file that is not readable, is a SILENT no-op: most
#      projects have no such file and a note about it every run is noise.
#   2. The machine-local client env file. When the MAIN checkout has
#      `<appDir>/.env` and this checkout has none, it is SYMLINKED — one file,
#      one place, and gitignored on both sides by the managed `.gitignore`
#      block's `<appDir>/.env` rule, which is what leaves a freshly bootstrapped
#      working copy showing nothing at all in `git status --porcelain`. There is
#      no configuration key for it, and `clientEnvPrefix` is not one (it is
#      review vocabulary — the prefix a build tool requires before exposing a
#      variable to a client bundle — not a path), so the existence test IS the
#      condition. An adopter whose stack needs a different machine-local file
#      adds it here: this script is theirs from `init` on, and a re-run never
#      overwrites it.
#   3. The test-account credentials at `qa.credentialsPath`, symlinked from the
#      main checkout by the same rule. NEVER copied: the file is sensitive and
#      gitignored, and a symlink keeps the secret in one place and keeps the
#      working copy clean. No key configured means nothing is attempted.
#   4. The pre-push backstop at `githooksDir`, installed for this working copy
#      alone (see the note at the step itself). A missing hook file is a skip
#      with one line, so a checkout that predates the hook still bootstraps.
#   5. `commands.depInstall`, then `commands.build`, each run from the
#      repository root. An UNSET key is skipped with one printed line rather
#      than being an error — a project with no build step is ordinary. A build
#      is skipped when the dependency install failed, because a build on a
#      failed install only produces a second, less clear failure.
#
# THE REFERENCE TOOLCHAIN IS NOT BOOTSTRAPPED HERE. A project that mirrors a
# reference implementation lists that implementation's own commands in
# `parity.toolchainCommands`, which the review phase runs and reports deferred
# when they are unavailable in an isolated working copy. Installing them is not
# part of preparing a working copy, and doing it here would make every bootstrap
# depend on a toolchain most steps never use.
#
# WHY NO `set -e`, AND WHY ITS CALLER HAS ONE. Each step's outcome is decided
# here — skip, warn, or fail — and `-e` would turn the ordinary "this key is not
# configured" into an abort. Failures are accumulated instead and reported in
# the exit status, which is what create-worktree.sh's `set -e` then acts on: a
# working copy whose dependencies did not install is not pushed as if it had.
#
# FAIL CLOSED ON A CONFIGURATION IT CANNOT READ. Every path and command below is
# configured, and none has a remembered fallback, so an absent or unreadable
# `harness.config.json` is a refusal that changes nothing — not a bootstrap that
# guesses where the hooks are.
#
# Usage: setup-worktree.sh
#   No arguments. The checkout is this script's own location, not $PWD, because
#   the caller runs it from wherever it happens to be.
#
# Exit map:
#
#   0  every step ran or was deliberately skipped
#   1  refusal (the library or the configuration could not be read), or a step
#      that was meant to run failed — the message above the exit says which
#
# REPRO — reproduce any decision by hand, against a throwaway fixture:
#
#   w=$(mktemp -d); d="$w/demo"; git init -q -b trunk "$d"; mkdir -p "$d/githooks"
#   printf '#!/usr/bin/env bash\nexit 0\n' > "$d/githooks/pre-push"
#   printf '%s' '{"version":1,"defaultBranch":"trunk","stateDir":"sdlc-harness/","githooksDir":"githooks","layers":[],"commands":{"depInstall":"printf x > deps.marker"}}' > "$d/harness.config.json"
#   mkdir -p "$d/scripts/lib"   # copy this script + lib/ there
#
#   ordinary        bash "$d/scripts/setup-worktree.sh"
#                   -> exit 0; "$d/deps.marker" exists; the build step prints its
#                      skip line; `git -C "$d" config --worktree core.hooksPath`
#                      is "$d/githooks"
#   no hook file    rm "$d/githooks/pre-push"; re-run -> exit 0 with a skip line
#   env symlink     printf 'K=v\n' > "$(git -C "$d" worktree list --porcelain |
#                     head -1 | sed 's/^worktree //')/.env"
#                   -> a sibling working copy's .env is a SYMLINK to that file;
#                      one that already has its own .env is left untouched
#   unresolvable    printf 'x' > "$d/harness.config.json"; re-run -> exit 1,
#                   nothing installed and no git configuration written

set -uo pipefail

hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "setup-worktree.sh: cannot read '$hr_lib' — refusing to bootstrap" >&2
  exit 1
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

# The checkout being bootstrapped is where THIS FILE lives — never $PWD, which
# belongs to whoever invoked it.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
top="$(hr_repo_root "$script_dir")" || top=""
if [ -z "$top" ]; then
  echo "setup-worktree.sh: '$script_dir' is not inside a git repository — refusing to bootstrap" >&2
  exit 1
fi

# Warm the library's cache once, unsubstituted, and refuse here rather than
# letting each reader below fail separately with its own message.
cfg_status=0
hr_config_load "$top" || cfg_status=$?
if [ "$cfg_status" -ne 0 ]; then
  echo "setup-worktree.sh: cannot resolve '$top/harness.config.json' — refusing to bootstrap" >&2
  echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
  exit 1
fi

# The main checkout is where every machine-local file has its single source: a
# working copy created by git carries only tracked content.
main_repo="$(hr_main_repo "$top")" || main_repo=""
[ -n "$main_repo" ] || main_repo="$top"

status=0

# --- 1. Version manager, if this machine uses one. -------------------------
vm_init="${HARNESS_VERSION_MANAGER_INIT:-}"
if [ -n "$vm_init" ] && [ -r "$vm_init" ]; then
  echo "setup-worktree.sh: sourcing version-manager init '$vm_init'"
  # shellcheck source=/dev/null
  . "$vm_init" || echo "setup-worktree.sh: version-manager init returned non-zero — continuing" >&2
fi

# --- 2. The machine-local client env file. ---------------------------------
# `appDir` is repo-relative and defaults to `.`; joining it as `<root>/.` would
# work but reads badly in every message below, so normalize it once.
app_dir="$(hr_app_dir "$top")" || app_dir="."
if [ "$app_dir" = "." ]; then
  app_here="$top"
  app_main="$main_repo"
else
  app_here="$top/$app_dir"
  app_main="$main_repo/$app_dir"
fi

if [ -e "$app_here/.env" ]; then
  : # this checkout has its own; never overwrite it
elif [ -f "$app_main/.env" ]; then
  if ln -s "$app_main/.env" "$app_here/.env"; then
    echo "setup-worktree.sh: linked $app_here/.env -> $app_main/.env"
  else
    echo "setup-worktree.sh: could not link $app_here/.env — continuing" >&2
  fi
fi

# --- 3. The test-account credentials, linked and never copied. -------------
qa_creds="$(hr_qa_creds_path "$top")" || qa_creds=""
if [ -n "$qa_creds" ]; then
  if [ ! -e "$top/$qa_creds" ] && [ -f "$main_repo/$qa_creds" ]; then
    mkdir -p "$(dirname "$top/$qa_creds")"
    if ln -s "$main_repo/$qa_creds" "$top/$qa_creds"; then
      echo "setup-worktree.sh: linked $top/$qa_creds -> $main_repo/$qa_creds"
    else
      echo "setup-worktree.sh: could not link $top/$qa_creds — continuing" >&2
    fi
  fi
fi

# --- 4. The pre-push backstop, for THIS working copy. ----------------------
# All working copies of a repository share one `.git/config`, so a plain
# `git config core.hooksPath` would write a single value every one of them
# reads — while each has its own committed hooks directory at a DIFFERENT
# absolute path. The value written here is therefore ABSOLUTE and
# WORKTREE-SCOPED, so each working copy resolves to its own tracked hook.
# Idempotent: both the `config` writes and the `chmod` are no-ops on a re-run.
hooks_rel="$(hr_githooks_dir "$top")" || hooks_rel=""
hooks_dir="$top/$hooks_rel"
if [ -n "$hooks_rel" ] && [ -f "$hooks_dir/pre-push" ]; then
  chmod +x "$hooks_dir/pre-push" || true
  # NOTE: `extensions.worktreeConfig true` is a one-way, REPOSITORY-GLOBAL
  # switch — once enabled it changes config resolution for EVERY working copy
  # sharing this `.git`, including older ones that have not re-run this script.
  # It is safe here because `core.hooksPath` is the only worktree-scoped value
  # and every active working copy re-runs this script; keep that invariant if
  # you add another `--worktree` setting.
  if git -C "$top" config extensions.worktreeConfig true &&
    git -C "$top" config --worktree core.hooksPath "$hooks_dir"; then
    echo "setup-worktree.sh: pre-push hook installed (core.hooksPath -> $hooks_dir)"
  else
    echo "setup-worktree.sh: could not point core.hooksPath at $hooks_dir — this working copy has no pre-push backstop" >&2
    status=1
  fi
else
  echo "setup-worktree.sh: no pre-push hook at $hooks_dir — skipping hook install" >&2
fi

# --- 5. Dependencies, then the build. --------------------------------------
# Run one configured command from the repository root. `commands.*` holds a raw
# command LINE (the wrapper form is only used for the keys that have wrappers),
# so it is evaluated — in a subshell, so the `cd` and anything the command sets
# stay inside it, and in THIS shell's `eval` rather than a fresh `bash -c` so a
# version manager's shell function from step 1 is still in scope.
run_configured() {
  local key="$1" label="$2" cmd cmd_status
  cmd="$(hr_command "$top" "$key")"
  cmd_status=$?
  # The unresolvable case is tested FIRST: it also prints nothing, so folding it
  # into the empty-value test would report a configuration this script could not
  # read as an ordinary project with no such step.
  if [ "$cmd_status" -eq 2 ]; then
    echo "setup-worktree.sh: cannot resolve commands.$key — skipping $label" >&2
    return 1
  fi
  if [ "$cmd_status" -ne 0 ] || [ -z "$cmd" ]; then
    echo "setup-worktree.sh: commands.$key is not set — skipping $label"
    return 0
  fi
  echo "setup-worktree.sh: $label: $cmd"
  (
    cd "$top" || exit 1
    eval "$cmd"
  )
  cmd_status=$?
  if [ "$cmd_status" -ne 0 ]; then
    echo "setup-worktree.sh: $label failed (exit $cmd_status)" >&2
    return 1
  fi
  return 0
}

deps_ok=1
if ! run_configured depInstall "dependency install"; then
  deps_ok=0
  status=1
fi

if [ "$deps_ok" -eq 1 ]; then
  if ! run_configured build "build"; then
    status=1
  fi
else
  echo "setup-worktree.sh: skipping build — the dependency install did not succeed" >&2
fi

if [ "$status" -eq 0 ]; then
  echo "setup-worktree.sh: bootstrap complete for $top"
else
  echo "setup-worktree.sh: bootstrap finished with failures for $top (see above)" >&2
fi
exit "$status"
