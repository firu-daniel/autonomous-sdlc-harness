#!/usr/bin/env bash
# release-qa-user.sh — release a test-account slot parked by
# `reserve-qa-user.sh`, so a waiting parallel session can claim that account.
#
# WHO CALLS IT. The interactive-test agent, not the orchestrator
# (`plugin/agents/qa-tester.md`, "Park the account you drive"): it releases every
# slot it reserved before it returns — on pass, on fail, and on any early exit —
# passing the slot number `reserve-qa-user.sh` printed. The orchestrator neither
# reserves nor releases an account; it owns the development server instead.
#
# RELEASING IS NEVER AN ERROR PATH. A slot whose lock is already gone — reclaimed
# by a later reserve's TTL guard, or released twice — is a no-op with exit 0, so
# "release on any exit" never turns a passing test into a failing dispatch. The
# only exit 1 is a missing or non-numeric argument, which is a caller bug rather
# than a run condition. An environment this cannot resolve a lock directory from
# (no repository, or no main checkout) also exits 0 after one stderr line: there
# is nothing to release in that case, and a cleanup step must not be the thing
# that fails.
#
# THE LOCK SET IS THE ONE `reserve-qa-user.sh` DOCUMENTS:
# `<main>/<stateDir>/qa_user_locks/`, where <main> is the repository's main
# checkout (`hc_main_root`, from `HARNESS_MAIN_REPO` when the launcher set it,
# else from `git rev-parse --git-common-dir`, so every run copy names the same
# one) and <stateDir> is `stateDir` from the main checkout's
# `harness.config.json` when it has one, else this working copy's, defaulting to
# `sdlc-harness`. THE TWO HALVES OF THE
# PAIR MUST AGREE ON THAT DERIVATION: change it in one file alone and every lock
# the other half is holding is silently retired, because each would then look in
# a directory the other never writes. The repository is resolved from `$PWD` and
# the main checkout from the anchor or its shared git directory, so a reserve and
# a release issued from different directories inside one repository — or from
# two run copies of it — agree on the same lock. Read that file's header for why the set
# lives there, why the sandbox can write it, and for the TTL guard.
#
# WHAT THIS SCRIPT DELIBERATELY NEVER DOES: it never reads the credentials file,
# never removes a lock it was not given the number of, never removes the lock
# directory itself, and never touches anything outside that one lock.
#
# REPRO — reproduce any decision by hand, from inside an adopting checkout:
#
#   cd <repo> && bash <plugin>/scripts/release-qa-user.sh <slot>
#
#   slot currently parked      -> prints the released line, exit 0; an immediate
#                                 re-reserve of that slot succeeds
#   slot not parked            -> prints the same line, exit 0 (no-op)
#   no argument, or `abc`      -> one stderr usage line, exit 1
#   run outside any repository -> one stderr line, exit 0 (nothing to release)
#   a bare repository's worktree, a submodule, a separate git dir
#                              -> one stderr line, exit 0 (no main checkout)
#
#   from a `git clone --shared <main> <clone>`, anchored:
#     cd <clone> && HARNESS_MAIN_REPO=<main> bash <plugin>/scripts/release-qa-user.sh <slot>
#                              -> releases <main>/<stateDir>/qa_user_locks/<slot>,
#                                 not the clone's
#
#   see what is still parked:  ls <main>/<stateDir>/qa_user_locks

set -u

# The shared library, sourced by this script's own location — never by the
# plugin-root token, which the runtime substitutes into hook command strings and
# agent bodies but does not export into a script's environment.
. "$(cd "$(dirname "${BASH_SOURCE[0]}")/../hooks/lib" && pwd)/harness-config-lib.sh"

slot="${1:-}"
case "$slot" in
  ''|*[!0-9]*)
    echo "release-qa-user: usage: release-qa-user.sh <slot> (slot must be numeric, got '${slot}')" >&2
    exit 1
    ;;
esac

root=$(hc_repo_root "${PWD-}") || root=""
if [ -z "$root" ]; then
  echo "release-qa-user: not inside a repository; no lock set to release from" >&2
  exit 0
fi

# Same location derivation as reserve-qa-user.sh, step for step.
main=$(hc_main_root "$root") || main=""
if [ -z "$main" ]; then
  echo "release-qa-user: cannot resolve the main checkout of $root; no lock set to release from" >&2
  exit 0
fi
cfg_root="$main"
hc_config_file "$main" >/dev/null || cfg_root="$root"
state_rel=$(hc_config_dir "$cfg_root" stateDir sdlc-harness) || state_rel="sdlc-harness"

LOCK_DIR="$main/$state_rel/qa_user_locks"

# The lock is an empty directory by construction, so `rmdir` removes it; a lock
# that is already gone leaves this a no-op, which is the documented case.
rmdir "$LOCK_DIR/user_$slot" 2>/dev/null || true
echo "release-qa-user: released account slot $slot"
exit 0
