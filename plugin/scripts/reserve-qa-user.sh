#!/usr/bin/env bash
# reserve-qa-user.sh — park one test account so parallel interactive-test
# sessions never drive the SAME account at once (two sessions signing one
# account in and out, or writing conflicting data as it, interfere in ways that
# look exactly like product defects).
#
# THE CALLER DECIDES THE ACCOUNT, NOT THIS SCRIPT. The interactive-test agent is
# the only component that reads the credentials file's per-account comments
# (which account holds which rights), so IT decides which account a test needs
# and asks for that slot by number. This script chooses by NO criterion of its
# own — it locks the slot it is told to, or the first free slot when told none,
# and reports back. The rights -> slot mapping stays
# entirely in the caller, which is why this script never reads a value out of
# the credentials file: it reads only which slots exist.
#
# WHY THIS IS A SCRIPT AND NOT AN INLINE LOOP. It encapsulates the probe+claim
# loop INSIDE a single script so the permission layer sees ONE allow-listed
# command instead of a compound. A raw claim loop matches no static allow
# pattern and is DENIED in an unattended session — the same rationale
# `find-free-port.sh`, `poll-dev-server.sh` and `kill-dev-server.sh` document.
#
# Prerequisite: `jq` (>= 1.5) on PATH. The adopter's `harness.config.json` is
# read through `harness-config-lib.sh`, whose reader needs it; an absent `jq`
# and one older than that floor each exit 1 with their own message rather than
# being reported as an invalid configuration file.
#
# THE EXIT-CODE CONTRACT IS A SHIPPED INTERFACE — DO NOT CHANGE IT. On success
# the reserved slot number is the ONLY stdout output (callers capture it) and
# the exit status is 0. Every failure prints one line to stderr and exits with a
# code the caller branches on:
#
#   1  environment  — no `jq` on PATH, no repository, no `harness.config.json`,
#                     an unreadable or invalid one (including one a pre-1.5 `jq`
#                     cannot parse), `phases.qa` not `true`, `qa.credentialsPath`
#                     unset, the credentials file absent or empty, no accounts
#                     configured in it, or the lock directory could not be
#                     created. The caller reports auth-gated tests blocked.
#   2  bad request  — the requested slot is not a configured account (including
#                     a non-numeric argument). The caller's rights -> slot
#                     mapping was wrong; it picks a valid slot.
#   3  busy         — the requested account is already parked, or, with no
#                     argument, every configured account is. The caller retries
#                     a different slot, retries with no argument, or reports the
#                     test blocked.
#
# `plugin/agents/qa-tester.md` ("Park the account you drive") branches on all
# four of those codes and passes AT MOST a slot number — never a credentials
# path — which is why this script resolves the credentials file itself. The
# orchestration instructions state the same ownership: the orchestrator owns the
# development server, the test agent owns the account reservation.
#
# WHERE THE CREDENTIALS FILE COMES FROM. The repository is resolved from `$PWD`
# (the flow's own commands run from the repository root), the adopter's
# `harness.config.json` is read at that root, and the file is read at
# `<repo_root>/<qa.credentialsPath>`. It is NOT derived from this script's own
# location: this file lives in the plugin's own root, which is not the
# adopter's checkout. Both `phases.qa` and `qa.credentialsPath` gate the read —
# a repository with the interactive-test phase off gets exit 1, the same outcome
# as an absent credentials file, so no new outcome is invented for it.
#
# THE KEY CONVENTION THIS ENUMERATION DEPENDS ON. Accounts are keyed
# `HARNESS_QA_<n>_*` and slot <n> exists when `HARNESS_QA_<n>_EMAIL=` carries a
# non-empty value on its own line — a commented-out or valueless block is not a
# configured account. That prefix is the one the generated credentials template
# ships (`cli/templates/claude/qa-accounts.env.example`, "Add accounts by
# incrementing <n>"), and this paragraph plus that template's own header are the
# only two places the convention is written down; the test agent's text
# deliberately defers to the credentials file's header for it. An adopter
# carrying accounts over from another runner renames the keys, not this reader.
#
# WHY THE LOCKS LIVE IN A FIXED `/tmp` DIRECTORY. Not `$TMPDIR`, which differs
# between an interactive shell and a daemon-started unattended run, and not a
# path inside the repository or the working copy, because parallel runs live in
# SEPARATE working copies of the same repository. A fixed `/tmp` path is the one
# location every concurrent session — however spawned, whichever working copy —
# shares, which is the whole point: the lock set has to be machine-global or it
# does not exclude anything. Locks clear on reboot, and a TTL guard reclaims one
# leaked by a crashed session (a lock directory, unlike a listening socket, does
# not self-heal, so without the TTL one crash retires an account permanently).
# The claim is an atomic `mkdir`, so a race between two sessions has exactly one
# winner.
#
# THE NAMESPACE IS PER REPOSITORY, AND BOTH HALVES OF THE PAIR MUST AGREE.
# `/tmp/<namespace>_qa_user_locks`, where <namespace> is `projectName` (falling
# back to the repository directory's basename) with every character outside
# `[A-Za-z0-9._-]` replaced by `_`. Two different repositories therefore never
# block each other's slot numbers, while two working copies of the SAME
# repository share one lock set — that second half is the property that matters,
# and it is why the name comes from the committed configuration first and the
# directory name only as a fallback. `release-qa-user.sh` derives it by exactly
# the same rule: changing the derivation in one file alone silently retires
# every lock the other half is holding, because each would then look in a
# directory the other never writes.
#
# `QA_USER_LOCK_TTL` (seconds, default 7200) overrides the reclaim age. The
# default is generous on purpose so a long-but-live test never has its account
# stolen; a non-numeric value falls back to the default rather than aborting.
# When neither `stat` dialect can report a lock's age, the lock is left ALONE
# rather than reclaimed — an unknown age must not be treated as expired, or one
# unreadable timestamp would hand a live session's account to another.
#
# WHAT THIS SCRIPT DELIBERATELY NEVER DOES: it never picks an account by any
# property of its own, never reads or prints a credential value, never waits or
# retries (a busy slot returns 3 immediately and the caller decides), and never
# writes anything inside the repository.
#
# REPRO — reproduce any decision by hand. <repo> is a checkout that has adopted
# the harness with `phases.qa: true`, `qa.credentialsPath` set, and a
# credentials file holding `HARNESS_QA_1_EMAIL=` and `HARNESS_QA_2_EMAIL=`:
#
#   cd <repo> && bash <plugin>/scripts/reserve-qa-user.sh [slot]
#
#   no argument, nothing parked     -> prints 1, exit 0
#   no argument, slot 1 parked      -> prints 2, exit 0
#   `2`, slot 2 free                -> prints 2, exit 0
#   `2`, slot 2 already parked      -> no stdout, one stderr line, exit 3
#   `9` (not a configured account)  -> no stdout, one stderr line, exit 2
#   `abc`                           -> no stdout, one stderr line, exit 2
#   run outside any repository      -> exit 1
#   `jq` absent from PATH           -> exit 1
#   <repo> with no harness.config.json, or `phases.qa` false, or
#   `qa.credentialsPath` unset, or the credentials file absent/empty -> exit 1
#
#   inspect or clear the lock set by hand:
#     ls /tmp/<namespace>_qa_user_locks
#     bash <plugin>/scripts/release-qa-user.sh <slot>

set -u

# The shared library, sourced by this script's own location — never by the
# plugin-root token, which the runtime substitutes into hook command strings and
# agent bodies but does not export into a script's environment.
. "$(cd "$(dirname "${BASH_SOURCE[0]}")/../hooks/lib" && pwd)/harness-config-lib.sh"

want="${1:-}"
if [ -n "$want" ]; then
  case "$want" in
    *[!0-9]*)
      echo "reserve-qa-user: slot must be numeric, got '${want}'" >&2
      exit 2
      ;;
  esac
fi

# --- the credentials file, resolved from the adopter's configuration ---------

root=$(hc_repo_root "${PWD-}") || root=""
if [ -z "$root" ]; then
  echo "reserve-qa-user: not inside a repository; cannot resolve the credentials file" >&2
  exit 1
fi

if ! hc_config_file "$root" >/dev/null; then
  echo "reserve-qa-user: no harness.config.json at $root; nothing to reserve" >&2
  exit 1
fi

# `jq` first, on its own, because every library reader returns 1 without it: an
# absent `jq` would otherwise surface as the invalid-configuration message below
# and send the caller looking at a file that is perfectly fine.
if ! hc_have_jq; then
  echo "reserve-qa-user: jq (>= 1.5) is not on PATH; cannot read harness.config.json" >&2
  exit 1
fi

# Separated from the gate below so an unreadable or invalid configuration names
# itself rather than being reported as a phase that is switched off. A `jq`
# older than the library's 1.5 floor fails the load here too, which is why the
# message names it.
if ! hc_config_readable "$root"; then
  echo "reserve-qa-user: harness.config.json at $root is unreadable, not valid JSON, or needs jq >= 1.5" >&2
  exit 1
fi

qa_phase=$(hc_get "$root" '.phases.qa') || qa_phase=""
if [ "$qa_phase" != "true" ]; then
  echo "reserve-qa-user: phases.qa is not true; nothing to reserve" >&2
  exit 1
fi

creds_rel=$(hc_get "$root" '.qa.credentialsPath') || creds_rel=""
if [ -z "$creds_rel" ]; then
  echo "reserve-qa-user: qa.credentialsPath is not configured; nothing to reserve" >&2
  exit 1
fi

creds="$root/$creds_rel"
if [ ! -s "$creds" ]; then
  echo "reserve-qa-user: credentials file $creds_rel absent/empty; nothing to reserve" >&2
  exit 1
fi

# --- the configured slots (ascending) ---------------------------------------
# Slot <n> is the `HARNESS_QA_<n>_EMAIL=` block with a non-empty value. Only
# which slots exist is read here; no value is ever read or printed.

slots=()
for n in $(grep -Eo '^HARNESS_QA_[0-9]+_EMAIL=.+' "$creds" \
  | sed -E 's/^HARNESS_QA_([0-9]+)_EMAIL=.*/\1/' | sort -un); do
  slots+=("$n")
done
if [ "${#slots[@]}" -eq 0 ]; then
  echo "reserve-qa-user: no accounts configured in $creds_rel" >&2
  exit 1
fi

# --- the machine-global lock set, namespaced per repository ------------------

project=$(hc_project_name "$root") || project=""
[ -n "$project" ] || project="${root##*/}"
namespace=$(printf '%s' "$project" | tr -c 'A-Za-z0-9._-' '_')
[ -n "$namespace" ] || namespace="harness"

LOCK_DIR="/tmp/${namespace}_qa_user_locks"
mkdir -p "$LOCK_DIR" 2>/dev/null || true
if [ ! -d "$LOCK_DIR" ]; then
  echo "reserve-qa-user: cannot create lock directory $LOCK_DIR" >&2
  exit 1
fi

TTL="${QA_USER_LOCK_TTL:-7200}"
case "$TTL" in
  ''|*[!0-9]*) TTL=7200 ;;
esac
now="$(date +%s)"

# Print a lock's modification time in seconds, trying both `stat` dialects;
# return 1 when neither answers, which the caller reads as "age unknown".
lock_mtime() {
  local lock="${1-}" m
  m=$(stat -f %m "$lock" 2>/dev/null) || m=$(stat -c %Y "$lock" 2>/dev/null) || return 1
  case "$m" in
    ''|*[!0-9]*) return 1 ;;
  esac
  printf '%s\n' "$m"
}

# Claim ONE slot atomically, reclaiming a lock older than the TTL first (a
# session that crashed without releasing). Returns the exit status of the atomic
# `mkdir`: 0 claimed, non-zero busy. The reclaim is an `rmdir` — the lock is an
# empty directory by construction, so nothing recursive is needed to remove it,
# and a lock that somehow holds content is left in place rather than deleted
# wholesale.
try_claim() {
  local slot="${1-}" lock mtime
  lock="$LOCK_DIR/user_$slot"
  if [ -d "$lock" ] && mtime=$(lock_mtime "$lock"); then
    if [ "$((now - mtime))" -ge "$TTL" ]; then
      rmdir "$lock" 2>/dev/null || true
    fi
  fi
  mkdir "$lock" 2>/dev/null
}

# --- claim ------------------------------------------------------------------

if [ -n "$want" ]; then
  # A specific slot was requested — it has to be a configured account.
  found=0
  for s in "${slots[@]}"; do
    [ "$s" = "$want" ] && { found=1; break; }
  done
  if [ "$found" -ne 1 ]; then
    echo "reserve-qa-user: slot $want is not a configured account" >&2
    exit 2
  fi
  if try_claim "$want"; then
    echo "$want"
    exit 0
  fi
  echo "reserve-qa-user: account slot $want is already parked" >&2
  exit 3
fi

# No argument — the first free slot, lowest number first (the agnostic default).
for s in "${slots[@]}"; do
  if try_claim "$s"; then
    echo "$s"
    exit 0
  fi
done
echo "reserve-qa-user: all accounts busy (${#slots[@]} slot(s))" >&2
exit 3
