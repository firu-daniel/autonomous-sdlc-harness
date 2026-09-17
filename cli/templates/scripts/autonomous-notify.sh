#!/usr/bin/env bash
# autonomous-notify.sh — the one place a run's lifecycle event becomes a message
# an operator actually sees: a desktop banner on the machine the watcher runs on,
# plus a best-effort push to wherever that operator is instead.
#
# WHY IT EXISTS AT ALL. An unattended run is a background process nobody is
# looking at. Whatever "your chat finished" mechanism an interactive session has
# does not reach a detached one reliably, so the watcher's own notification on a
# lifecycle event is the PRIMARY mechanism rather than a nicety — it is how a
# completed branch, a parked question or a failed run is noticed at all.
#
# THE EVENT VOCABULARY IS A CONTRACT. The watcher's exit classifier and its
# launch, resume, park and stall paths all call this script with one of these
# seven words, and nothing else may be added here without adding it there:
#
#   completed  the run reached "branch ready for review"
#   parked     the run wrote a clarification question and yielded — idle until
#              the answer file lands
#   park_loop  the watcher stopped resuming a parked run whose resumes made no
#              progress — idle until an operator clears it
#   paused     the run honored a PAUSE request and yielded — idle until RESUME
#   failed     the run exited non-zero, or its process vanished
#   launched   a fresh inbox run was just started
#   resumed    the same run is being re-launched — a parked run's answer landed,
#              or a paused run's RESUME landed (the detail argument says which)
#
# An unrecognized word is still delivered, under a generic title. A notification
# helper that refused an event it did not know would silently drop exactly the
# unusual event an operator most needs to hear about.
#
# IT NEVER FAILS ITS CALLER. Every delivery arm is best-effort and the script
# exits 0 whatever happened — a missing notifier, an unreachable endpoint, a
# push command that returns non-zero. The only non-zero exit is a usage error,
# which is a caller defect rather than a delivery failure. Each arm that fails
# prints ONE line to stderr, which lands in the run log next to the event.
#
# EVERY MESSAGE CARRIES THE REPOSITORY SLUG. The title is
# `[<slug>] <event title> — <branch>`, because one machine watches more than one
# repository and two of them may well have a branch of the same name. The slug is
# `HARNESS_REPO_SLUG` when the caller exported it (the watcher does, once, rather
# than re-deriving it per event), else the shared library's `hr_repo_slug` for
# this checkout — so a hand invocation from a shell still resolves one. It is the
# same slug the daemon label and the machine-level usage lane are keyed on.
#
# CREDENTIAL RESOLUTION ORDER, STATED ONCE AND IMPLEMENTED ONCE:
#
#   1. the machine-local file `${XDG_CONFIG_HOME:-$HOME/.config}/autonomous-sdlc-harness/push.env`
#   2. the repository's configured `pushEnvPath`, when it is set and the file is
#      there
#
# The first that exists wins and the other is not read. Neither present is a
# GRACEFUL DEGRADE, not an error: desktop delivery still happens and the script
# still exits 0, with one line saying which paths were looked at. Machine-local
# comes first because a push token belongs to a person and a machine rather than
# to a repository — an operator keeps it in one place instead of once per
# checkout, and it cannot be committed by accident from there. The file is
# sourced under `set -a` so a value reaches a child process; NO VALUE IS EVER
# PRINTED, by this script or in a failure line — only paths and key names. A key
# ALREADY IN THE ENVIRONMENT WINS over the file's value for that key: an operator
# checking delivery with `HARNESS_PUSH_CMD=… autonomous-notify.sh …` means that
# command, and a file quietly overriding it would send the check somewhere else.
#
# DELIVERY IS TWO INDEPENDENT ARMS, NOT A PRECEDENCE CHAIN.
#
#   HARNESS_PUSH_CMD  a local command. It receives the MESSAGE ON STANDARD INPUT
#                     and the title in the environment as `HARNESS_PUSH_TITLE`.
#                     It is not a `{title}`/`{message}` template — nothing is
#                     substituted into it, which is also what keeps a message
#                     containing shell metacharacters from being re-parsed.
#   HARNESS_PUSH_URL  an endpoint that accepts a POST. The message is the body,
#                     the title rides in a `Title:` header, and a failure retries
#                     once with a JSON body so either shape of endpoint works.
#
# Both set means BOTH run, in that order, and a failing command must not suppress
# the POST. This is deliberately not the "command instead of URL" precedence the
# script was ported from: `cli/templates/claude/push-notify.env.example` is the
# contract — it is committed, it is what an adopter reads before this file, and
# it describes the command as running *in addition to* the POST.
#
# DESKTOP DELIVERY IS PLATFORM-GATED AND DEGRADES TO NOTHING. The two macOS
# mechanisms are tried only when `command -v` finds them, which is the platform
# test: on a machine without them (a Linux host running the systemd backend) both
# are skipped, no error is printed, and the push arms carry the notification
# alone. The richer notifier and the built-in one are both fired when both are
# present — the second is what guarantees a banner when the first is installed
# but not permitted to post one. Notifications are grouped per repository slug,
# so one repository's stream of events replaces its own and not another's.
#
# WHO RUNS IT. The watcher, on every lifecycle event, and a person by hand for a
# delivery check. Not a dispatched agent: it has no entry in the generated
# permission profile. That is a CALLING CONVENTION, NOT A GATE — its basename is
# not on the script-allowlist guard's `DENY_SCRIPT_BASENAMES`, and that guard
# grants independently of the profile, so an agent invoking this path under
# `scriptsDir` is auto-allowed today — but only in a PLAIN invocation: that
# guard's construct scan withholds the allow, silently, from any command
# carrying `$(…)`, a backtick, `|`, `<`, a braced form other than a bare
# `${IDENT}`, or a `>` that is neither a descriptor duplication (`2>&1`, `>&2`,
# `2>&-`) nor a redirection to the literal `/dev/null` — which includes a
# `<placeholder>` written into this script's own `detail` argument.
#
# Usage:
#   autonomous-notify.sh <event> <branch> [log_path] [detail]
#     event     completed | parked | park_loop | paused | failed | launched | resumed
#     branch    the run's branch name
#     log_path  optional path to the central run log, shown in the message
#     detail    optional one-line extra, e.g. the clarification question's file
#
# Exit map a caller can switch on:
#
#   0  the event was processed — delivered, partly delivered, or degraded to
#      desktop-only. The stderr lines say which; the status deliberately does not
#   2  usage error: no event, or no branch. Nothing was delivered
#
# REPRO — reproduce any decision by hand, with a recorder standing in for a real
# push target and nothing real configured:
#
#   w=$(mktemp -d); printf '#!/bin/sh\ncat > "%s/body"; printf %%s "$HARNESS_PUSH_TITLE" > "%s/title"\n' "$w" "$w" > "$w/rec"
#   chmod +x "$w/rec"
#
#   both arms    HARNESS_PUSH_CMD="$w/rec" HARNESS_PUSH_URL=http://127.0.0.1:9/x \
#                  bash <repo>/<scripts_dir>/autonomous-notify.sh completed feat/x; echo $?
#                -> "$w/title" begins `[<slug>] ` and names feat/x, "$w/body"
#                   holds the message, ONE stderr line for the failed POST, and 0
#   url only     HARNESS_PUSH_URL=http://127.0.0.1:9/x bash …/autonomous-notify.sh failed feat/x
#                -> one stderr line, exit 0
#   neither      env -u HARNESS_PUSH_CMD -u HARNESS_PUSH_URL bash …/autonomous-notify.sh paused feat/x
#                -> the degrade line naming the paths looked at, exit 0
#   file order   put `HARNESS_PUSH_CMD=<recorder A>` in
#                  "${XDG_CONFIG_HOME:-$HOME/.config}/autonomous-sdlc-harness/push.env"
#                and `HARNESS_PUSH_CMD=<recorder B>` in the repository's `pushEnvPath`
#                -> A records; remove that file and B records
#   unknown      bash …/autonomous-notify.sh sneezed feat/x; echo $?   -> generic title, 0
#   usage        bash …/autonomous-notify.sh completed; echo $?        -> usage on stderr, 2

set -u

self="autonomous-notify.sh"

EVENT="${1:-}"
BRANCH="${2:-}"
LOG_PATH="${3:-}"
DETAIL="${4:-}"

if [ -z "$EVENT" ] || [ -z "$BRANCH" ]; then
  echo "usage: $self <completed|parked|park_loop|paused|failed|launched|resumed> <branch> [log_path] [detail]" >&2
  exit 2
fi

# --- The shared library, reached by a path computed from this script's own
# location. Unlike every other script in this set, NOT finding it is not a
# refusal: delivering a notification mutates nothing, and the run whose
# configuration just became unreadable is exactly the run an operator needs to
# hear about. Without it the slug falls back to the caller's export, no
# credential file is looked for, and the pause message loses its state-directory
# name — the message still goes out.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
hr_lib="$script_dir/lib/harness-run-lib.sh"
have_lib=0
if [ -r "$hr_lib" ]; then
  # shellcheck source=lib/harness-run-lib.sh
  . "$hr_lib"
  have_lib=1
fi

# Anchored on the script's own directory rather than on the caller's working
# directory: the watcher invokes this from wherever a run happens to be, and an
# anchor that moved with `$PWD` would key a notification on another repository.
root=""
if [ "$have_lib" -eq 1 ]; then
  root="$(hr_repo_root "$script_dir")" || root=""
fi

slug="${HARNESS_REPO_SLUG:-}"
if [ -z "$slug" ] && [ -n "$root" ]; then
  slug="$(hr_repo_slug "$root")" || slug=""
fi
[ -n "$slug" ] || slug="unknown-repo"

# The resume sentinel lives at `<state_dir>/RESUME` inside the run's own working
# copy, and `<state_dir>` is configured — so the message names the resolved
# directory, never a remembered one. Unresolvable configuration drops to the
# generic wording rather than to a guess an operator would then look for in vain.
state_dir=""
if [ -n "$root" ]; then
  state_dir="$(hr_state_dir "$root")" || state_dir=""
fi
if [ -n "$state_dir" ]; then
  resume_hint="Drop '$state_dir/RESUME' in its working copy to continue."
else
  resume_hint="Drop a RESUME file in its state directory to continue."
fi

case "$EVENT" in
completed)
  TITLE="[$slug] Run complete — $BRANCH"
  MESSAGE="Branch '$BRANCH' is ready for review."
  ;;
parked)
  TITLE="[$slug] Run parked — $BRANCH"
  MESSAGE="Run '$BRANCH' is waiting for a clarification answer."
  ;;
park_loop)
  TITLE="[$slug] Run stuck in a park loop — $BRANCH"
  MESSAGE="Run '$BRANCH' parked again after resumes that made no progress; the watcher has stopped resuming it."
  ;;
paused)
  TITLE="[$slug] Run paused — $BRANCH"
  MESSAGE="Run '$BRANCH' honored a PAUSE request and yielded. $resume_hint"
  ;;
resumed)
  TITLE="[$slug] Run resumed — $BRANCH"
  MESSAGE="Run '$BRANCH' resumed."
  ;;
launched)
  TITLE="[$slug] Run launched — $BRANCH"
  MESSAGE="Run '$BRANCH' started."
  ;;
failed)
  TITLE="[$slug] Run failed — $BRANCH"
  MESSAGE="Run '$BRANCH' exited non-zero. Check the log."
  ;;
*)
  TITLE="[$slug] Run ($EVENT) — $BRANCH"
  MESSAGE="Run '$BRANCH': $EVENT."
  ;;
esac

[ -n "$DETAIL" ] && MESSAGE="$MESSAGE $DETAIL"
[ -n "$LOG_PATH" ] && MESSAGE="$MESSAGE Log: $LOG_PATH"

# --- Credentials. First candidate that exists wins; the rest are not read. The
# candidate list itself, and its order, belong to the library — this script must
# not re-derive either, or the two would disagree about where an operator's
# settings live.
push_env=""
checked=""
# Held across the source so an explicitly-invoked value survives it — see the
# header: the environment wins per key, and a file supplies only what the
# environment did not.
env_cmd="${HARNESS_PUSH_CMD:-}"
env_url="${HARNESS_PUSH_URL:-}"
if [ "$have_lib" -eq 1 ]; then
  while IFS= read -r candidate; do
    [ -n "$candidate" ] || continue
    if [ -n "$checked" ]; then checked="$checked, $candidate"; else checked="$candidate"; fi
    [ -n "$push_env" ] && continue
    [ -f "$candidate" ] && [ -r "$candidate" ] || continue
    # `set -a` so the keys reach the push command's child process; restored
    # immediately, because exporting everything this script defines afterwards
    # would leak its internals into that child too.
    set -a
    # shellcheck disable=SC1090
    . "$candidate"
    set +a
    push_env="$candidate"
  done <<EOF
$(hr_push_env_files "$root")
EOF
fi
[ -n "$env_cmd" ] && export HARNESS_PUSH_CMD="$env_cmd"
[ -n "$env_url" ] && export HARNESS_PUSH_URL="$env_url"

# --- Desktop notification. Platform-gated by `command -v` (see the header): both
# mechanisms are macOS-only, both are skipped silently elsewhere, and each is
# `|| true` so a notifier that is present but refused permission cannot end the
# script before the push arms run.
if command -v terminal-notifier >/dev/null 2>&1; then
  terminal-notifier -title "$TITLE" -message "$MESSAGE" -group "autonomous-sdlc-harness.$slug" >/dev/null 2>&1 || true
fi

if command -v osascript >/dev/null 2>&1; then
  # Escape backslash and double quote for the AppleScript string literals, in
  # that order: an AppleScript literal treats `\` as an escape too, so escaping
  # the quotes first would re-escape the backslashes this step then adds.
  esc_title="$(printf '%s' "$TITLE" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
  esc_message="$(printf '%s' "$MESSAGE" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
  osascript -e "display notification \"$esc_message\" with title \"$esc_title\"" >/dev/null 2>&1 || true
fi

# Minimal JSON string escaping for the fallback body below. Two steps, in this
# order and no other:
#
#   1. translate the control characters JSON forbids unescaped inside a string
#      (tab, CR, LF) to spaces. Translated rather than encoded, because a
#      one-line notification body has no use for any of them and `\t`/`\r`/`\n`
#      escapes would be a second thing to get right for no gain — and to a
#      SPACE rather than deleted, because LF is the reachable one in practice
#      (the detail argument interpolates command output) and deleting it would
#      run the last word of one line into the first of the next.
#   2. BACKSLASH FIRST, THEN QUOTE. Doing it the other way round re-escapes the
#      backslashes step 2 just added, and a value ending in a backslash would
#      escape the closing quote and corrupt the document.
#
# This exists because the body is built with printf rather than jq: jq is not a
# dependency of this script, which must keep working when the library and
# everything under it is unavailable.
json_escape() {
  printf '%s' "${1-}" | tr '\t\r\n' '   ' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

# --- Push. Two independent arms; neither is conditional on the other's outcome.
pushed=0

if [ -n "${HARNESS_PUSH_CMD:-}" ]; then
  pushed=1
  # The message goes in on STDIN and the title in the environment — the command
  # string is never rewritten, so a message carrying quotes, backticks or a `$`
  # cannot be re-parsed as shell.
  printf '%s\n' "$MESSAGE" | HARNESS_PUSH_TITLE="$TITLE" bash -c "$HARNESS_PUSH_CMD" >/dev/null 2>&1 ||
    echo "$self: HARNESS_PUSH_CMD exited non-zero (the other delivery arms were unaffected)" >&2
fi

if [ -n "${HARNESS_PUSH_URL:-}" ]; then
  pushed=1
  if command -v curl >/dev/null 2>&1; then
    # A plain body first, a JSON body second: the two shapes cover both the
    # "post the text" endpoints and the "post an object" ones without asking the
    # adopter to declare which they have.
    curl -sf -m 10 \
      -H "Title: $TITLE" \
      -d "$MESSAGE" \
      "$HARNESS_PUSH_URL" >/dev/null 2>&1 ||
      curl -sf -m 10 \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$(json_escape "$TITLE")\",\"message\":\"$(json_escape "$MESSAGE")\"}" \
        "$HARNESS_PUSH_URL" >/dev/null 2>&1 ||
      echo "$self: HARNESS_PUSH_URL POST failed (the other delivery arms were unaffected)" >&2
  else
    echo "$self: curl is not on PATH, so HARNESS_PUSH_URL could not be posted to" >&2
  fi
fi

if [ "$pushed" -eq 0 ]; then
  # Not an error — see the header. The paths are named so an operator can see
  # where the settings were expected; no value is printed.
  if [ -n "$checked" ]; then
    echo "$self: no HARNESS_PUSH_CMD/HARNESS_PUSH_URL set; push skipped (looked in: $checked)" >&2
  else
    echo "$self: no HARNESS_PUSH_CMD/HARNESS_PUSH_URL set and no credential file could be looked for; push skipped" >&2
  fi
fi

exit 0
