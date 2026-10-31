#!/usr/bin/env bash
# sandbox-absent-path-check.sh — what the Linux sandbox does with each absent path a per-run profile
# denies (#212; docs/sandbox-verification.md → §5 F9). Hand-written for this repository, like
# sandbox-probe.sh: not in the set `init --force` regenerates, and not a cli/templates/ file.
#
# Run as `probe` in Gate 15's container, while `bash scripts/sandbox-probe.sh run --leg headless-parity`
# holds its clone and per-run profile in another terminal. For every path that profile's
# `sandbox.filesystem.denyWrite` yields (`hr_profile_deny_paths`: each exact entry, and each glob's
# expansion against the directories present), plus the clone's and the sibling's `.git/commondir`,
# `.git/config.worktree` and `.git/objects/info/http-alternates`, the `.mcp.json` of each `--add-dir`
# root, and each `BUILTIN_PATHS` entry at the clone's root, wherever the profile does not yield them, it
# records, per phase, each path's `stat` type, size, mode and owner (or `absent`) as a plain shell sees
# it outside any sandbox, and in phases A and B also what a sandboxed call and an excluded call see;
# every reading also takes the full `git status --short --branch` in the clone, <main> and the sibling:
#
#   before       plain shell, before any session
#   A            one headless session: git status, then the inspector sandboxed, then as an excluded command
#   B            a second session, the same calls: do A's leftovers persist into B, and does B add more
#   C            two sessions at once, each issuing six short calls (#94008's cross-process cleanup race)
#   D            one session killed with SIGKILL in the middle of a call: what a killed session leaves
#   write-probe  whether a sandboxed `dd` can create the clone's absent `.git/commondir` on the per-run
#                profile itself: one session on P, with `Bash(dd:*)` its only added grant, issues
#                `dd if=/dev/null of=<clone>/.git/commondir conv=notrunc` and then a 20 s tick; once the
#                `dd` call is in the session's stream, a plain shell polls for the file for up to 20 s,
#                records its `stat` reading or `absent`, and removes it with a non-recursive `rm -f`
#                while the session still lives. It then records the `dd` call's own tool result from
#                the stream: `call result` with `error` or `ok` (its `is_error`) and the full text, plus
#                `call exit` where that text carries `Exit code <n>` (a successful `dd` result carries
#                none), or `call result none in the stream`. AP8 is graded on the disk outcome first:
#                verdict `written` when the plain shell saw the file; otherwise `not on disk, the call
#                reported success` when the result is not an error; `refused` when it is; `no verdict:
#                no dd call in the stream` when the call never appeared
#   hook-probe   AP9, whether the plugin's `git-trust-file-guard.sh` refuses a session's `Write` to the
#                clone's absent `.git/commondir`: one session on P, loaded with `--plugin-dir <main>/plugin`
#                and `--include-hook-events` so the guard is this checkout's, issues that one `Write` and
#                then a 20 s tick; a plain shell polls and removes as `write-probe` does. Verdict `written`
#                when the plain shell saw the file; otherwise `refused by the hook` when the result is an
#                error carrying `git-trust-file-guard:`; `refused, not by the hook` for any other error;
#                `not on disk, the call reported success` for a result that is no error; `no verdict: no
#                Write call in the stream` when the call never appeared
#   sweep        the run library's placeholder sweep over the manifest the watcher writes (what D left),
#                one more plain-shell reading, then the run-copy check on the clone and `git status` in
#                the clone and the sibling, each recorded with its full output
#
# Usage, as `probe`:
#   bash scripts/sandbox-absent-path-check.sh run              phases before, A, B, C and D
#   bash scripts/sandbox-absent-path-check.sh write-probe      the write-probe phase, after `run` and before `hook-probe`
#   bash scripts/sandbox-absent-path-check.sh hook-probe       the hook-probe phase, after `write-probe` and before `sweep`
#   bash scripts/sandbox-absent-path-check.sh sweep            the sweep phase, after `hook-probe`
#   bash scripts/sandbox-absent-path-check.sh after-teardown   one more plain-shell reading after the probe tears down
#   bash scripts/sandbox-absent-path-check.sh report           writes <out>/report.md
#   bash scripts/sandbox-absent-path-check.sh control-profile  writes <out>/control-profile.json for the control run
#   Run `sweep` only on a disposable probe clone and a main checkout whose probe branch may move.
#
#   The control run, into a fresh <dir> of its own and with no `sweep`:
#     SBX_ABSENT_OUT=<dir> bash scripts/sandbox-absent-path-check.sh control-profile
#     SBX_ABSENT_OUT=<dir> bash scripts/sandbox-absent-path-check.sh run
#     SBX_ABSENT_OUT=<dir> bash scripts/sandbox-absent-path-check.sh report
#   `control-profile` copies the run lane's per-run profile, ignoring P=, with every `.permissions.deny`
#   string matching `CONTROL_DENY_RE` removed, into <dir>/control-profile.json, and prints the copy's
#   path and how many entries it removed. It refuses with no SBX_ABSENT_OUT, and on a <dir> already
#   holding a run. `run`, with P unset, takes <out>/control-profile.json as P when that file exists, and
#   says so; the stamp's `profile:` line records which profile the run took. `write-probe` and
#   `hook-probe` never take the copy.
#
#   <main> is the checkout two levels above this script. The clone is the first `<main>-chore_sbx_probe_*`
#   sibling and the profile the first `run-profiles/*/*.json` in the run lane's directory; set C= and P=
#   to name others. <out> is ${SBX_ABSENT_OUT:-${TMPDIR:-/tmp}/sbx-absent-path}.
#
#   The sibling is ${SIB:-<main>-sbx_sibling}, read only when its `.git` is a directory; otherwise every
#   sibling step is skipped and the stamp says `sibling: none`. It is the maintainer's: create it with
#   `git clone --shared` before the probe starts, so the per-run profile is rendered with it present.
#   This script never creates or removes it.
#
# `run`, `after-teardown`, `report` and `control-profile` write nothing into the clone, the sibling or
# the main checkout. `write-probe` and `hook-probe` write into the clone only through their session's
# `dd` or `Write`, and remove what that left at `<clone>/.git/commondir` before the session ends; they
# record into <out>/write-probe.txt and <out>/hook-probe.txt. `sweep` changes them: it deletes each manifest-recorded 0-byte, read-only
# leftover in the clone, the sibling and the main checkout, <main>/<scriptsDir>/.git included, and its
# `hr_run_copy_check_var <main> <clone>` syncs the clone's branch into <main> (`hr_copy_sync_in_var`),
# moving that branch's ref there. The sibling is no registered run copy, so it takes no run-copy check.
# `run`'s sessions run on a COPY of the per-run profile, with one entry added to `excludedCommands` for
# the excluded inspector; `write-probe`'s and `hook-probe`'s sessions run on P itself. Everything else
# it writes, the inspector included, is under <out>.
#
# Exit: 0 done · 1 usage, the run library is missing, the state directory is unresolvable, jq could
# not read P, or `control-profile` with no SBX_ABSENT_OUT · 2 not Linux, no held clone or profile,
# `write-probe`, `hook-probe`, `sweep`, `after-teardown` or `report` before `run`, `write-probe` or
# `hook-probe` finding `<clone>/.git/commondir` already present, or `control-profile` on an <out>
# already holding a run.
#
# Linux only by purpose: the inspector reads `stat -c`, `date -Is` and `/proc/self/mountinfo`. Any
# other `uname -s` is refused with exit 2 and one line, before anything is written.
# A standalone script: `set -u` and no `-e`, because a failing call is a result to record.
set -u

usage_line="usage: sandbox-absent-path-check.sh run | write-probe | hook-probe | sweep | after-teardown | report | control-profile"

case "${1:-}" in
  run | write-probe | hook-probe | sweep | after-teardown | report | control-profile) ;;
  *)
    echo "$usage_line" >&2
    exit 1
    ;;
esac

host=$(uname -s 2>/dev/null)
if [ "$host" != "Linux" ]; then
  echo "sandbox-absent-path-check: Linux only (stat -c, date -Is, /proc/self/mountinfo); this host is '${host}'" >&2
  exit 2
fi

M=$(cd -P "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
O=${SBX_ABSENT_OUT:-${TMPDIR:-/tmp}/sbx-absent-path}
O=${O%/}
MODEL=${MODEL:-opus}
SELF="bash $M/scripts/sandbox-absent-path-check.sh"
RUN_CMD="$SELF run"
[ -n "${SBX_ABSENT_OUT:-}" ] && RUN_CMD="SBX_ABSENT_OUT=$O $RUN_CMD"
SETTINGS=$O/profile.json

# What sandboxed `git status` showed at the clone's root in one 2026-10-30 session (Claude Code
# 2.1.314). A reading of one session, not Claude Code's definition of its protected paths, which this
# script cannot read. Inspected in every phase; never added to the manifest, which stays the watcher's.
BUILTIN_PATHS=".bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json
.claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json .claude/skills
.claude/workflows .gitconfig .gitmodules .idea .mcp.json .profile .ripgreprc .vscode .zprofile .zshrc"

# The deny entries `control-profile` removes from its copy of P.
CONTROL_DENY_RE='\.git/(commondir|config\.worktree|objects/info/http-alternates)'

if [ ! -f "$M/scripts/lib/harness-run-lib.sh" ]; then
  echo "sandbox-absent-path-check: '$M/scripts/lib/harness-run-lib.sh' is missing" >&2
  exit 1
fi
# shellcheck source=/dev/null
. "$M/scripts/lib/harness-run-lib.sh"
# The watcher's `spawn_engine` resolves its `--add-dir` state root the same way.
if ! S=$(hr_state_path "$M"); then
  echo "sandbox-absent-path-check: the state directory under '$M' is unresolvable from harness.config.json" >&2
  exit 1
fi

resolve() {
  local lane
  lane=$(hr_lane_dir) || lane=""
  C=${C:-$(ls -d "$M"-chore_sbx_probe_* 2>/dev/null | head -1)}
  if [ -z "$P" ] && [ -n "$lane" ]; then
    P=$(ls "$lane"/run-profiles/*/*.json 2>/dev/null | head -1)
  fi
  if [ -z "$C" ] || [ ! -d "$C" ] || [ -z "$P" ] || [ ! -f "$P" ]; then
    echo "sandbox-absent-path-check: no held probe clone or per-run profile; start 'bash scripts/sandbox-probe.sh run --leg headless-parity' first, or set C= and P=" >&2
    exit 2
  fi
  C=$(cd -P "$C" && pwd -P)
}
C=${C:-}
P=${P:-}
SIB=${SIB:-$M-sbx_sibling}
if [ -d "$SIB/.git" ]; then
  SIB=$(cd -P "$SIB" && pwd -P)
else
  SIB=""
fi

# The inspector: one line per inspected path, `<label>\t<path>\t<state>`, then the namespace and git lines.
write_inspector() {
  cat >"$O/inspect.sh" <<'EOF'
#!/usr/bin/env bash
label=$1; list=$2; c=$3; m=$4; s=${5:-}
printf '#\t%s\tmntns %s\n' "$label" "$(readlink /proc/self/ns/mnt)"
while IFS= read -r p; do
  case $p in *'*'*) continue ;; esac
  if [ -e "$p" ] || [ -L "$p" ]; then
    st=$(stat -c '%F, %s B, %A, %U, mtime %y' "$p" 2>&1)
  else
    st=absent
  fi
  mnt=$(awk -v p="$p" '$5 == p { src = $4; for (i = 7; i <= NF; i++) if ($i == "-") { src = src " (" $(i + 1) ", " $6 ")"; break } print src; exit }' /proc/self/mountinfo)
  [ -n "$mnt" ] && st="$st; mount: $mnt"
  printf '%s\t%s\t%s\n' "$label" "$p" "$st"
done < "$list"
for r in "$c" "$m" ${s:+"$s"}; do
  out=$(git -C "$r" status --short --branch 2>&1); rc=$?
  printf 'git\t%s\t%s\texit %s: %s\n' "$label" "$r" "$rc" "$(printf '%s' "$out" | tr '\n\t' '  ')"
done
EOF
  cp "$O/inspect.sh" "$O/inspect-ex.sh"
  cat >"$O/tick.sh" <<'EOF'
#!/usr/bin/env bash
sleep "${3:-2}"; echo "tick $1 $2 ok"
EOF
}

# The inspector's `stat` form, from the plain shell.
st_of() { stat -c '%F, %s B, %A, %U, mtime %y' "$1" 2>&1; }

outside() { bash "$O/inspect.sh" "$1" "$O/entries.txt" "$C" "$M" "$SIB" >"$O/outside-$1.tsv" 2>&1; }

# Starts one headless session in the background on the watcher's launch line ($SETTINGS as --settings,
# then any extra claude arguments) and leaves its pid in SESSION_PID, a child of this shell so `wait`
# can reap it.
session() { # <name> <prompt> [claude argument...]
  local name=$1 prompt=$2
  shift 2
  (cd "$C" && exec env HARNESS_MAIN_REPO="$M" claude -p "$prompt" \
    --settings "$SETTINGS" --permission-mode dontAsk --model "$MODEL" \
    --add-dir "$C" --add-dir "$S" \
    --allowedTools "Bash(git status:*)" \
    --allowedTools "Bash(bash $O/inspect.sh:*)" \
    --allowedTools "Bash(bash $O/inspect-ex.sh:*)" \
    --allowedTools "Bash(bash $O/tick.sh:*)" \
    ${1+"$@"} \
    --output-format stream-json --verbose) >"$O/session-$name.jsonl" 2>"$O/session-$name.stderr" </dev/null &
  SESSION_PID=$!
}

prompt_calls() { # numbered calls from the arguments
  local i=1 c
  printf 'Issue each call below exactly as written, one Bash tool call per call, in this order. Do not retry a call, do not work around a refusal, do not add any command or tool call of your own, and do not append anything to a command. A refused call is a result. Stop after the last call.\n'
  for c in "$@"; do
    printf '\nCall %s. Bash, with the command parameter set to exactly: %s\n' "$i" "$c"
    i=$((i + 1))
  done
}

prompt_write() { # <file_path> <content> <Bash command>: one Write call, then one Bash call
  printf 'Issue each call below exactly as written, one tool call per call, in this order. Do not retry a call, do not work around a refusal, do not add any command or tool call of your own, and do not append anything to a command. A refused call is a result. Stop after the last call.\n'
  printf '\nCall 1. Write, with file_path set to exactly: %s and content set to exactly: %s\n' "$1" "$2"
  printf '\nCall 2. Bash, with the command parameter set to exactly: %s\n' "$3"
}

# The first matching tool call's result in a session stream, as one line: `none` when no call matches,
# `pending` when the call has no result, else `error|ok<TAB><full text, newlines as " / ">`. A `dd`
# call is a Bash call whose command starts `dd `; a `Write` call is any `Write` tool call.
call_result() { # <session jsonl> dd|Write
  local r
  r=$(jq -Rrn --arg kind "$2" '
    [inputs | (fromjson? // empty) | objects | (.message.content? // empty) | arrays | .[] | objects] as $c
    | [$c[] | select(.type == "tool_use")
        | select(if $kind == "dd" then ((.input.command? // "") | tostring | startswith("dd ")) else .name == $kind end)
        | .id] as $ids
    | if ($ids | length) == 0 then "none"
      else ([$c[] | select(.type == "tool_result") | select(.tool_use_id as $t | $ids | map(. == $t) | any)] | .[0]) as $r
      | if $r == null then "pending"
        else (($r.content // "") | if type == "array" then map(.text? // "") | join("") else tostring end) as $t
        | (if $r.is_error == true then "error" else "ok" end) + "\t" + ($t | split("\n") | join(" / "))
        end
      end' "$1" 2>/dev/null)
  printf '%s\n' "${r:-none}"
}

# The `n` of the first `Exit code <n>` in a result text, or nothing.
exit_of() { printf '%s\n' "$1" | sed -n 's/.*Exit code \([0-9][0-9]*\).*/\1/p' | head -1; }

# Writes the `call result` and `call exit` lines for a call_result line, sets RESULT to none,
# pending, error or ok, and RESULT_TEXT to the result's text.
record_result() { # <call_result line> <file>
  local ex tab=$'\t'
  RESULT_TEXT=""
  case $1 in
    none | pending)
      RESULT=$1
      printf 'call result\tnone in the stream\n' >>"$2"
      ;;
    *)
      RESULT=${1%%"$tab"*}
      RESULT_TEXT=${1#*"$tab"}
      printf 'call result\t%s\t%s\n' "$RESULT" "$RESULT_TEXT" >>"$2"
      ex=$(exit_of "$RESULT_TEXT")
      [ -n "$ex" ] && printf 'call exit\texit %s\n' "$ex" >>"$2"
      ;;
  esac
}

inspect_calls() { # <phase>
  prompt_calls "git status --short --branch" \
    "bash $O/inspect.sh $1-sandboxed $O/entries.txt $C $M${SIB:+ $SIB}" \
    "bash $O/inspect-ex.sh $1-excluded $O/entries.txt $C $M${SIB:+ $SIB}"
}

# The profile's denyWrite entries verbatim, then each path they yield and each extra path not yet listed.
write_entries() {
  local x paths
  jq -r '.sandbox.filesystem.denyWrite[]' "$P" >"$O/profile-entries.txt"
  cp "$O/profile-entries.txt" "$O/entries.txt"
  if ! paths=$(hr_profile_deny_paths "$P"); then
    echo "sandbox-absent-path-check: could not read the denyWrite list of $P" >&2
    exit 1
  fi
  set --
  while IFS= read -r x; do
    [ -n "$x" ] && set -- "$@" "$x"
  done <<EOF
$paths
EOF
  set -- "$@" "$C/.git/commondir" "$C/.git/config.worktree" "$C/.git/objects/info/http-alternates" \
    "$C/.mcp.json" "$S/.mcp.json"
  for x in $BUILTIN_PATHS; do
    set -- "$@" "$C/$x"
  done
  if [ -n "$SIB" ]; then
    set -- "$@" "$SIB/.git/commondir" "$SIB/.git/config.worktree" "$SIB/.git/objects/info/http-alternates"
  fi
  for x in "$@"; do
    grep -Fxq -- "$x" "$O/entries.txt" || printf '%s\n' "$x" >>"$O/entries.txt"
  done
}

# The manifest the watcher's `spawn_engine` writes: every path the profile's denyWrite yields, plus
# `.mcp.json` under each --add-dir root.
write_manifest() {
  local p paths
  if ! paths=$(hr_profile_deny_paths "$P"); then
    echo "sandbox-absent-path-check: could not read the denyWrite list of $P" >&2
    exit 1
  fi
  set --
  while IFS= read -r p; do
    [ -n "$p" ] && set -- "$@" "$p"
  done <<EOF
$paths
EOF
  set -- "$@" "$C/.mcp.json" "$S/.mcp.json"
  if ! hr_placeholder_manifest_write "$O/manifest.absent" "$@"; then
    echo "sandbox-absent-path-check: could not write $O/manifest.absent" >&2
    return 1
  fi
  echo "sandbox-absent-path-check: manifest records $(wc -l <"$O/manifest.absent") absent paths"
}

run() {
  if [ -z "$P" ] && [ -f "$O/control-profile.json" ]; then
    P=$O/control-profile.json
    echo "sandbox-absent-path-check: control run on $P"
  fi
  resolve
  mkdir -p "$O"
  write_inspector
  {
    echo "date: $(date -Is)"
    echo "clone: $C"
    echo "sibling: ${SIB:-none}"
    echo "profile: $P"
    echo "main: $M"
    echo "main head: $(git -C "$M" rev-parse HEAD 2>&1)"
    echo "git: $(git --version 2>&1)"
    echo "claude: $(claude --version 2>&1)"
    echo "bwrap: $(bwrap --version 2>&1)"
    echo "uname: $(uname -a)"
    echo "apparmor_restrict_unprivileged_userns: $(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>&1)"
  } >"$O/stamp.txt"
  write_entries
  jq --arg e "bash $O/inspect-ex.sh:*" '.sandbox.excludedCommands += [$e]' "$P" >"$O/profile.json"
  echo "sandbox-absent-path-check: $(wc -l <"$O/profile-entries.txt") denyWrite entries, $(grep -c '\*' "$O/profile-entries.txt") of them globs, $(grep -vc '\*' "$O/entries.txt") inspected paths in all"
  write_manifest || exit 1

  outside before
  echo "sandbox-absent-path-check: phase A"; session A "$(inspect_calls A)"; wait "$SESSION_PID"; outside after-A
  echo "sandbox-absent-path-check: phase B"; session B "$(inspect_calls B)"; wait "$SESSION_PID"; outside after-B

  echo "sandbox-absent-path-check: phase C (two sessions at once)"
  local calls1=() calls2=() i p1 p2
  for i in 1 2 3 4 5 6; do
    calls1+=("bash $O/tick.sh C1 $i 2")
    calls2+=("bash $O/tick.sh C2 $i 2")
  done
  session C1 "$(prompt_calls "${calls1[@]}")"; p1=$SESSION_PID
  session C2 "$(prompt_calls "${calls2[@]}")"; p2=$SESSION_PID
  wait "$p1" "$p2"; outside after-C

  echo "sandbox-absent-path-check: phase D (a session killed mid-call)"
  local n=0
  session D "$(prompt_calls "bash $O/tick.sh D 1 90")"
  until grep -q '"tool_use"' "$O/session-D.jsonl" 2>/dev/null || [ $n -ge 120 ]; do
    sleep 1
    n=$((n + 1))
  done
  sleep 5
  kill -9 "$SESSION_PID" 2>/dev/null # the session's own process: `exec` made the subshell claude itself
  wait "$SESSION_PID" 2>/dev/null
  sleep 1; outside after-D-kill
  sleep 10; outside after-D-10s

  echo "sandbox-absent-path-check: done. Next: $SELF write-probe, then $SELF hook-probe, then $SELF sweep, then, when the probe has torn down, $SELF after-teardown"
}

# Finding 1's proof on the per-run profile: can a sandboxed `dd` create the clone's absent
# `.git/commondir`? The file is removed while the session still lives, so no later phase sees it.
write_probe() {
  local t n=0 pid rc v
  resolve
  t="$C/.git/commondir"
  if [ ! -f "$O/tick.sh" ] || [ ! -f "$O/stamp.txt" ]; then
    echo "sandbox-absent-path-check: no run under $O; run '$SELF run' first" >&2
    exit 2
  fi
  if [ -e "$t" ] || [ -L "$t" ]; then
    printf 'before\t%s\n' "$(st_of "$t")" >"$O/write-probe.txt"
    echo "sandbox-absent-path-check: $t is already present; the write probe needs it absent and will not remove a file it did not see created" >&2
    exit 2
  fi
  printf 'before\tabsent\t%s\n' "$t" >"$O/write-probe.txt"
  SETTINGS=$P
  echo "sandbox-absent-path-check: write probe on $P"
  session W "$(prompt_calls "dd if=/dev/null of=$t conv=notrunc" "bash $O/tick.sh W 1 20")" \
    --allowedTools "Bash(dd:*)"
  pid=$SESSION_PID
  until grep -q '"command": *"dd ' "$O/session-W.jsonl" 2>/dev/null || [ $n -ge 120 ]; do
    sleep 1
    n=$((n + 1))
  done
  if grep -q '"command": *"dd ' "$O/session-W.jsonl" 2>/dev/null; then
    printf 'dd call\tin the stream after %s s\n' "$n" >>"$O/write-probe.txt"
  else
    printf 'dd call\tnot in the stream after %s s\n' "$n" >>"$O/write-probe.txt"
  fi
  poll_and_remove "$t" "$pid" "$O/write-probe.txt" dd
  wait "$pid"
  rc=$?
  printf 'session\texit %s\n' "$rc" >>"$O/write-probe.txt"
  record_result "$(call_result "$O/session-W.jsonl" dd)" "$O/write-probe.txt"
  if [ -n "$SEEN" ]; then
    v=written
  else
    case $RESULT in
      ok) v="not on disk, the call reported success" ;;
      error) v=refused ;;
      pending) v="no verdict: the dd call has no result in the stream" ;;
      *) v="no verdict: no dd call in the stream" ;;
    esac
  fi
  printf 'verdict\t%s\n' "$v" >>"$O/write-probe.txt"
  echo "sandbox-absent-path-check: write probe recorded in $O/write-probe.txt; next: $SELF hook-probe"
}

# Polls the plain shell for <target> for up to 20 s, records its `stat` reading or `absent` into
# <file>, and removes it with `rm -f` while <pid> may still live. Leaves the reading in SEEN.
poll_and_remove() { # <target> <pid> <file> <call label>
  local t=$1 pid=$2 f=$3 k=0 rc alive
  SEEN=""
  while [ $k -le 20 ]; do
    if [ -e "$t" ] || [ -L "$t" ]; then
      SEEN=$(st_of "$t")
      break
    fi
    sleep 1
    k=$((k + 1))
  done
  if [ -n "$SEEN" ]; then
    printf 'plain shell\t%s s after the %s call\t%s\n' "$k" "$4" "$SEEN" >>"$f"
    if kill -0 "$pid" 2>/dev/null; then alive=yes; else alive=no; fi
    rm -f "$t"
    rc=$?
    if [ -e "$t" ] || [ -L "$t" ]; then
      printf 'removed\trm -f exit %s; still present: %s; session alive at removal: %s\n' "$rc" "$(st_of "$t")" "$alive" >>"$f"
    else
      printf 'removed\trm -f exit %s; now absent; session alive at removal: %s\n' "$rc" "$alive" >>"$f"
    fi
  else
    printf 'plain shell\tabsent through %s s of polling\n' "$k" >>"$f"
  fi
}

# AP9 on the per-run profile: does this checkout's `git-trust-file-guard.sh` refuse a session's `Write`
# to the clone's absent `.git/commondir`? A file that lands is removed while the session still lives.
hook_probe() {
  local t n=0 pid rc v
  resolve
  t="$C/.git/commondir"
  if [ ! -f "$O/tick.sh" ] || [ ! -f "$O/stamp.txt" ]; then
    echo "sandbox-absent-path-check: no run under $O; run '$RUN_CMD' first" >&2
    exit 2
  fi
  if [ -e "$t" ] || [ -L "$t" ]; then
    printf 'before\t%s\n' "$(st_of "$t")" >"$O/hook-probe.txt"
    echo "sandbox-absent-path-check: $t is already present; the hook probe needs it absent and will not remove a file it did not see created" >&2
    exit 2
  fi
  printf 'before\tabsent\t%s\n' "$t" >"$O/hook-probe.txt"
  SETTINGS=$P
  echo "sandbox-absent-path-check: hook probe on $P with --plugin-dir $M/plugin"
  session H "$(prompt_write "$t" gitdir-probe "bash $O/tick.sh H 1 20")" \
    --plugin-dir "$M/plugin" --include-hook-events
  pid=$SESSION_PID
  until grep -q '"name": *"Write"' "$O/session-H.jsonl" 2>/dev/null || [ $n -ge 120 ]; do
    sleep 1
    n=$((n + 1))
  done
  if grep -q '"name": *"Write"' "$O/session-H.jsonl" 2>/dev/null; then
    printf 'Write call\tin the stream after %s s\n' "$n" >>"$O/hook-probe.txt"
  else
    printf 'Write call\tnot in the stream after %s s\n' "$n" >>"$O/hook-probe.txt"
  fi
  poll_and_remove "$t" "$pid" "$O/hook-probe.txt" Write
  wait "$pid"
  rc=$?
  record_result "$(call_result "$O/session-H.jsonl" Write)" "$O/hook-probe.txt"
  jq -Rrn '
    inputs | (fromjson? // empty) | objects
    | select(.type == "system" and ((.subtype? // "") | tostring | startswith("hook")))
    | tojson | select(contains("git-trust-file-guard"))
    | "hook\t" + .' "$O/session-H.jsonl" >>"$O/hook-probe.txt" 2>/dev/null
  printf 'session\texit %s\n' "$rc" >>"$O/hook-probe.txt"
  if [ -n "$SEEN" ]; then
    v=written
  else
    case $RESULT in
      error)
        case $RESULT_TEXT in
          *git-trust-file-guard:*) v="refused by the hook" ;;
          *) v="refused, not by the hook" ;;
        esac
        ;;
      ok) v="not on disk, the call reported success" ;;
      pending) v="no verdict: the Write call has no result in the stream" ;;
      *) v="no verdict: no Write call in the stream" ;;
    esac
  fi
  printf 'verdict\t%s\n' "$v" >>"$O/hook-probe.txt"
  echo "sandbox-absent-path-check: hook probe recorded in $O/hook-probe.txt; next: $SELF sweep"
}

# A copy of P without its trio deny entries, for the control run the header documents.
control_profile() {
  local before after
  if [ -z "${SBX_ABSENT_OUT:-}" ]; then
    echo "sandbox-absent-path-check: control-profile needs SBX_ABSENT_OUT=<dir>, the control run's own output folder" >&2
    exit 1
  fi
  if [ -f "$O/stamp.txt" ]; then
    echo "sandbox-absent-path-check: $O already holds a run; the control needs a fresh SBX_ABSENT_OUT" >&2
    exit 2
  fi
  P=""
  resolve
  mkdir -p "$O"
  if ! before=$(jq '[.permissions.deny[]? | strings] | length' "$P") \
    || ! jq --arg re "$CONTROL_DENY_RE" \
      'if (.permissions.deny | type) == "array" then .permissions.deny |= map(select((type == "string" and test($re)) | not)) else . end' \
      "$P" >"$O/control-profile.json" \
    || ! after=$(jq '[.permissions.deny[]? | strings] | length' "$O/control-profile.json"); then
    echo "sandbox-absent-path-check: jq could not read $P or write $O/control-profile.json" >&2
    exit 1
  fi
  echo "$O/control-profile.json"
  echo "sandbox-absent-path-check: removed $((before - after)) .permissions.deny entries matching $CONTROL_DENY_RE"
}

sweep() {
  local rc out line
  resolve
  if [ ! -f "$O/manifest.absent" ] || [ ! -f "$O/entries.txt" ] || [ ! -f "$O/inspect.sh" ]; then
    echo "sandbox-absent-path-check: no manifest under $O; run '$SELF run' first" >&2
    exit 2
  fi
  hr_placeholder_sweep_var "$O/manifest.absent"
  rc=$?
  {
    printf 'sweep\texit %s\n' "$rc"
    if [ -n "$HR_PLACEHOLDER_REMOVED" ]; then
      printf '%s\n' "$HR_PLACEHOLDER_REMOVED" | while IFS= read -r line; do printf 'removed\t%s\n' "$line"; done
    fi
    if [ -n "$HR_PLACEHOLDER_KEPT" ]; then
      printf '%s\n' "$HR_PLACEHOLDER_KEPT" | while IFS= read -r line; do printf 'kept\t%s\n' "$line"; done
    fi
  } >"$O/sweep.txt"
  outside after-sweep

  out=$(hr_wrapper_main_of "$M/scripts" 2>&1)
  rc=$?
  printf 'hr_wrapper_main_of\texit %s\t%s\n' "$rc" "$out" >>"$O/sweep.txt"
  HR_RUN_REFUSAL=""
  hr_run_copy_check_var "$M" "$C"
  rc=$?
  printf 'hr_run_copy_check_var\texit %s\t%s\n' "$rc" "${HR_RUN_REFUSAL-}" >>"$O/sweep.txt"
  out=$(git -C "$C" status --short --branch 2>&1)
  rc=$?
  printf 'git status (clone)\texit %s\t%s\n' "$rc" "$(printf '%s' "$out" | tr '\n\t' '  ')" >>"$O/sweep.txt"
  if [ -n "$SIB" ]; then
    out=$(git -C "$SIB" status --short --branch 2>&1)
    rc=$?
    printf 'git status (sibling)\texit %s\t%s\n' "$rc" "$(printf '%s' "$out" | tr '\n\t' '  ')" >>"$O/sweep.txt"
  fi

  echo "sandbox-absent-path-check: sweep recorded in $O/sweep.txt; when the probe has torn down, run: $SELF after-teardown"
}

# After teardown the clone is gone, so resolve() would refuse; the entry list from `run` still names it.
after_teardown() {
  if [ ! -f "$O/inspect.sh" ] || [ ! -f "$O/entries.txt" ]; then
    echo "sandbox-absent-path-check: no run under $O; run '$RUN_CMD' first" >&2
    exit 2
  fi
  C=/nonexistent
  outside after-teardown
  echo "sandbox-absent-path-check: recorded; now run: $SELF report"
}

report() {
  if [ ! -f "$O/stamp.txt" ]; then
    echo "sandbox-absent-path-check: no run under $O; run '$RUN_CMD' first" >&2
    exit 2
  fi
  python3 - "$O" <<'EOF'
import json, os, sys, glob
O = sys.argv[1]
rows, cols, git, ns = {}, [], [], []
def take(label, path, st):
    if label not in cols: cols.append(label)
    rows.setdefault(path, {})[label] = st
order = ["before", "after-A", "after-B", "after-C", "after-D-kill", "after-D-10s", "after-sweep", "after-teardown"]
for ph in order:
    f = f"{O}/outside-{ph}.tsv"
    if not os.path.exists(f): continue
    for line in open(f):
        parts = line.rstrip("\n").split("\t")
        if parts[0] == "#": ns.append(f"{ph}: {parts[2]}")
        elif parts[0] == "git": git.append(f"{ph}: {parts[2]} {parts[3]}")
        elif len(parts) == 3: take(f"outside {ph}", parts[1], parts[2])
calls, dd_ids, dd = {}, set(), []
for f in sorted(glob.glob(f"{O}/session-*.jsonl")):
    name = os.path.basename(f)[8:-6]
    out = []
    for line in open(f):
        try: e = json.loads(line)
        except ValueError: continue
        for c in (e.get("message") or {}).get("content") or []:
            if isinstance(c, dict) and c.get("type") == "tool_use":
                i = c.get("input") or {}
                cmd = i.get("command") or f"{c.get('name', '')} {i.get('file_path', '')}"
                out.append(["call", cmd])
                if name == "W" and cmd.startswith("dd "):
                    dd_ids.add(c.get("id"))
                    dd.append(["call", cmd])
            if isinstance(c, dict) and c.get("type") == "tool_result":
                t = c.get("content")
                t = "".join(x.get("text", "") for x in t) if isinstance(t, list) else str(t)
                k = "result" + (" ERROR" if c.get("is_error") else "")
                out.append([k, t])
                if name == "W" and c.get("tool_use_id") in dd_ids: dd.append([k, t])
                for l in t.splitlines():
                    p = l.split("\t")
                    if len(p) == 3 and p[0].endswith(("-sandboxed", "-excluded")): take(p[0], p[1], p[2])
                    elif p[0] == "#" and len(p) == 3: ns.append(f"{p[1]}: {p[2]}")
                    elif p[0] == "git" and len(p) == 4: git.append(f"{p[1]}: {p[2]} {p[3]}")
        if e.get("type") == "result":
            out.append(["end", f"{e.get('subtype')} denials={len(e.get('permission_denials') or [])}"])
    calls[name] = out
with open(f"{O}/report.md", "w") as r:
    r.write("# Absent-path placeholders\n\n" + open(f"{O}/stamp.txt").read() + "\n")
    r.write("## Per entry\n\n")
    for p in rows:
        r.write(f"### {p}\n\n")
        for c in cols:
            if c in rows[p]: r.write(f"- {c}: {rows[p][c]}\n")
        r.write("\n")
    r.write("## Sweep\n\n")
    sw = f"{O}/sweep.txt"
    if os.path.exists(sw):
        r.write("".join("- " + l.rstrip("\n").replace("\t", " | ") + "\n" for l in open(sw) if l.strip()) + "\n")
    else:
        r.write("- not run\n\n")
    r.write("## Write probe\n\n")
    wp = f"{O}/write-probe.txt"
    if os.path.exists(wp):
        r.write("".join("- " + l.rstrip("\n").replace("\t", " | ") + "\n" for l in open(wp) if l.strip()))
        r.write("".join(f"- session W dd {k}: " + t.replace("\n", " / ") + "\n" for k, t in dd) or "- session W dd: no dd call in the stream\n")
        r.write("\n")
    else:
        r.write("- not run\n\n")
    r.write("## Hook probe\n\n")
    hp = f"{O}/hook-probe.txt"
    if os.path.exists(hp):
        r.write("".join("- " + l.rstrip("\n").replace("\t", " | ") + "\n" for l in open(hp) if l.strip()) + "\n")
    else:
        r.write("- not run\n\n")
    r.write("## Mount namespaces\n\n" + "".join(f"- {x}\n" for x in ns) + "\n")
    r.write("## git status\n\n" + "".join(f"- {x}\n" for x in git) + "\n")
    r.write("## Sessions\n\n")
    for n, out in calls.items():
        r.write(f"### {n}\n\n")
        for k, t in out:
            r.write(f"- {k}: " + t.replace("\n", " / ") + "\n")
        r.write("\n")
print(f"{O}/report.md")
EOF
}

case "$1" in
  run) run ;;
  write-probe) write_probe ;;
  hook-probe) hook_probe ;;
  sweep) sweep ;;
  after-teardown) after_teardown ;;
  report) report ;;
  control-profile) control_profile ;;
esac
