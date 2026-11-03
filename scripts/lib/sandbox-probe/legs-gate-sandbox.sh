#!/usr/bin/env bash
# legs-gate-sandbox.sh — the sandbox probe's gate-sandbox leg (rows GS1, GS2, GS3, GS4, WF5), Linux only:
# the four claims the ruling makes of launch-sandboxed-gates.sh's `bwrap` sandbox
# (docs/sandbox-verification.md §5 F10 and §8 GS1–GS4), measured through the real
# launcher, a real session and a gate command the probe writes, plus WF5.
#   GS1  the worker outlives the call and the session, and yields a verdict
#   GS2  a write outside the worker's roots, and a write to <target>/.git/config, is refused, read on disk
#   GS3  a network call is refused
#   GS4  ~/.ssh/config and the base profile's sandbox.credentials.envVars names cannot be read
#   WF5  hr_lane_mtime (scripts/lib/harness-run-lib.sh), called inside the launcher's worker, reads an
#        advancing mtime through its GNU `stat -c %Y` arm. On Linux a gate run's heartbeat lives there, and
#        the detached leg's worker dies with its call (F10), so WF5 moved here from legs-detached.sh.
#
# THE TARGET (SP__GS_TARGET, set by sp__gs_target). In the clone layout it is the leg's own extra clone
# ${SP_BRANCH}_gs, cut with --no-bootstrap, with its own rendered profile: no earlier leg has touched it.
# In job mode it is SP_CLONE, the checkout itself (job.sh), with the session's own profile, so job mode
# measures the launcher's main-checkout arm as before.
# The writer this protects against (docs/sandbox-verification.md §5 PD29): legs-refresh.sh → sp__rf_r4
# runs `git branch <defaultBranch> refs/remotes/origin/<defaultBranch>` in the shared probe clone, and
# under git's default branch.autoSetupMerge that records branch.<defaultBranch>.remote and
# branch.<defaultBranch>.merge, two keys the clone allow-list (hr_clone_config_spec) does not hold, so the
# launcher refuses that clone. Before its session the leg runs the same allow-list check on its target
# (sp__gs_target_check), so a probe defect prints as one and never reaches the launcher.
# An extra clone rather than a reorder: running first would tie this leg's correctness to the leg order
# and to what every future leg leaves in the shared clone; planted-files and wrappers-refresh already cut
# their own clones. sp_extra_clone registers the clone and its branch for teardown.
#
# THE DEPARTURE, "a fixture written from an ordinary terminal" (docs/sandbox-verification.md §0): the
# probe's own shell rewrites the target's harness.config.json to commands.typecheck `<none>` and
# commands.test `bash <target>/sbx_gs_test.sh`, and restores it byte-identically on every path, a pending
# restore covering an interrupt. A restore `cmp` refuses is exit 3, the shasum guard's class.
#
# THE WORKER'S SCRIPT (sp__gs_test_script) stores every step's reading whole under <target>/sbx_gs/:
# <step>.status, <step>.stderr, and <step>.stdout where the step has stdout beyond its named output. No step
# stops it. Order: WF5, a hold of SP_GS_HOLD_SECONDS so the session has ended, GS2, GS3, GS4, `done`.
#
# THE SESSION-LEVEL CONTROL is the launch call itself: SP_CTL_OK is 1 only when it ran. Each row's own
# control is read by its grading function: gs2_control.txt, an unsandboxed curl from the probe's shell,
# gs4.control.
#
# THE FUNCTIONS. The grading functions read only their arguments and the files they name, and set
# SP_VERDICT and SP_EVIDENCE:
#   sp__gs2_outside_paths <target> <main> <home>   GS2's outside paths, one per line; drops on stderr
#   sp__gs_test_script <path> <target> <records dir> <running file> <run library> <outside paths file>
#                      [<env name>...]
#   sp__gs1_grade <launch line> <verdict file> <done file> <session end epoch>
#   sp__gs2_grade <control file> <sha before> <sha after> <outside path>...
#   sp__gs3_grade <body file> <status file> <stderr file> <unsandboxed control code>
#   sp__gs4_grade <worker ssh copy> <host ssh file> <env record> <control file>
#   sp__wf5_grade <mtimes file> [<process kind>]
# The target functions set SP__GS_WHY and return 1 on failure:
#   sp__gs_target                                  sets SP__GS_TARGET and SP__GS_PROFILE
#   sp__gs_target_check <main> <target>            the clone allow-list check; none in job mode
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_GS_LABEL=sbx_probe_gs
# A mirror of legs-detached.sh's SP_BG9_SECONDS and its reasoning: GS1 can pass only when the session
# ends within about 59 s of the launch call.
SP_GS_HOLD_SECONDS=60

# Set by sp_leg_gate_sandbox for its helpers; empty outside the leg.
SP__GS_SAVED=""
SP__GS_GITCFG_SAVED=""
SP__GS_WHY=""
SP__GS_TARGET=""
SP__GS_PROFILE=""

sp__gs_target() {
  local err line last=""
  SP__GS_TARGET=""
  SP__GS_PROFILE=""
  if [ "${SP_JOB_MODE:-0}" = 1 ]; then
    SP__GS_TARGET="$SP_CLONE"
    SP__GS_PROFILE="$SP_RUN_PROFILE"
    return 0
  fi
  err="$SP_TMP/gate-sandbox-clone.stderr"
  if ! sp_extra_clone "${SP_BRANCH}_gs" --no-bootstrap 2>"$err"; then
    while IFS= read -r line; do
      [ -n "$line" ] && last="$line"
    done <"$err"
    cat -- "$err" >&2
    SP__GS_WHY="${last:-sp_extra_clone ${SP_BRANCH}_gs refused with no message}"
    return 1
  fi
  cat -- "$err" >&2
  # Copied at once: the next sp_extra_clone overwrites SP_EXTRA_*.
  SP__GS_TARGET="$SP_EXTRA_CLONE"
  SP__GS_PROFILE="$SP_EXTRA_PROFILE"
  return 0
}

sp__gs_target_check() {
  local main="${1:-}" target="${2:-}"
  # The launcher's main-checkout arm reads no clone allow-list.
  [ "${SP_JOB_MODE:-0}" = 1 ] && return 0
  hr_clone_config_check_var "$main" "$target" && return 0
  SP__GS_WHY="the gate-sandbox target's .git/config is outside the clone allow-list before the launch: $HR_CLONE_CONFIG_REFUSAL"
  return 1
}

# sp__gs_canon_dir <dir> — the directory's canonical path; status 1 when it has none.
sp__gs_canon_dir() {
  (CDPATH= cd -P -- "${1:-}" 2>/dev/null && pwd -P)
}

# sp__gs_sha <file> — its sha256, or nothing when it cannot be hashed.
sp__gs_sha() {
  local sum
  sum="$(shasum -a 256 "${1:-}" 2>/dev/null)" || return 0
  printf '%s' "${sum%% *}"
}

sp__gs2_outside_paths() {
  local target="${1:-}" main="${2:-}" home="${3:-}" tc cand dc full
  tc="$(sp__gs_canon_dir "$target")" || tc=""
  if [ -z "$tc" ]; then
    printf 'dropped every path: the target %s has no canonical path\n' "$target" >&2
    return 0
  fi
  # The main-checkout candidate is always offered: in job mode it lies inside the target and is dropped.
  for cand in ${home:+"$home/sbx_gs2_home.txt"} "${tc%/*}/sbx_gs2_parent.txt" ${main:+"$main/sbx_gs2_main.txt"}; do
    dc="$(sp__gs_canon_dir "${cand%/*}")" || dc=""
    if [ -z "$dc" ]; then
      # A write into an absent directory fails sandboxed or not, so it could never grade the sandbox.
      printf 'dropped %s: its directory does not exist\n' "$cand" >&2
      continue
    fi
    full="${dc%/}/${cand##*/}"
    case "$full" in
      "$tc" | "$tc"/*)
        printf 'dropped %s: inside the target\n' "$cand" >&2
        continue
        ;;
    esac
    printf '%s\n' "$full"
  done
  return 0
}

sp__gs_test_script() {
  local path="${1:-}" target="${2:-}" rec="${3:-}" running="${4:-}" lib="${5:-}" outfile="${6:-}" p
  shift 6 2>/dev/null || return 1
  {
    printf '%s\n' '#!/usr/bin/env bash' \
      '# Written by scripts/lib/sandbox-probe/legs-gate-sandbox.sh for one session, then removed.'
    printf 'target=%q\nrec=%q\nrunning=%q\nlib=%q\nhold=%q\n' "$target" "$rec" "$running" "$lib" \
      "$SP_GS_HOLD_SECONDS"
    printf 'outside=('
    while IFS= read -r p; do
      [ -n "$p" ] && printf ' %q' "$p"
    done <"$outfile"
    printf ' )\nnames=('
    for p in "$@"; do
      printf ' %q' "$p"
    done
    printf ' )\n'
    # Each `2>` precedes the redirection that may be refused, so the refusal lands in the step's file.
    cat <<'EOF'
stat -f %m "$running" 2>"$rec/wf5_stat.stderr" >"$rec/wf5_stat.stdout"
printf '%s\n' "$?" >"$rec/wf5_stat.status"
raw=""
IFS= read -r raw <"$rec/wf5_stat.stdout"
{
  # A display copy of wf5_stat.stdout's first line, the shape sp__wf5_grade parses; the full reading stays in wf5_stat.stdout.
  printf 'stat -f %%m: %s\n' "$raw"
  . "$lib"
  printf 'mtime %s\n' "$(hr_lane_mtime "$running")"
  sleep 2
  printf 'mtime %s\n' "$(hr_lane_mtime "$running")"
} 2>"$rec/wf5.stderr" >"$rec/wf5.mtimes"
printf '%s\n' "$?" >"$rec/wf5.status"

sleep "$hold"

printf 'sandbox probe gate-sandbox control\n' 2>"$rec/gs2_control.stderr" >"$rec/gs2_control.txt"
printf '%s\n' "$?" >"$rec/gs2_control.status"
n=0
for p in ${outside[@]+"${outside[@]}"}; do
  n=$((n + 1))
  printf 'sbx_gs2\n' 2>"$rec/gs2_out_$n.stderr" >"$p"
  printf '%s\n' "$?" >"$rec/gs2_out_$n.status"
done
printf '# sbx_gs2\n' 2>"$rec/gs2_gitconfig.stderr" >>"$target/.git/config"
printf '%s\n' "$?" >"$rec/gs2_gitconfig.status"

curl -sS --max-time 5 -o "$rec/gs3.body" https://example.com/ 2>"$rec/gs3.stderr" >"$rec/gs3.stdout"
printf '%s\n' "$?" >"$rec/gs3.status"

cat "$HOME/.ssh/config" 2>"$rec/gs4_ssh.stderr" >"$rec/gs4.ssh"
printf '%s\n' "$?" >"$rec/gs4_ssh.status"
# Names only, from the shell's own list of exported names: a value is never read.
exported="$(compgen -e)"
: >"$rec/gs4.env"
for name in ${names[@]+"${names[@]}"}; do
  case $'\n'"$exported"$'\n' in
    *$'\n'"$name"$'\n'*) printf '%s set\n' "$name" ;;
    *) printf '%s unset\n' "$name" ;;
  esac >>"$rec/gs4.env"
done
cat "$target/harness.config.json" 2>"$rec/gs4_control.stderr" >"$rec/gs4.control"
printf '%s\n' "$?" >"$rec/gs4_control.status"

: >"$rec/done"
exit 0
EOF
  } >"$path" 2>/dev/null
}

sp__gs1_grade() {
  local line="${1:-}" vfile="${2:-}" dfile="${3:-}" end="${4:-}" verdict="" done_at
  if [ "$line" != pending ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the launcher answered '$line', not pending"
    return 0
  fi
  if [ ! -f "$vfile" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="the launcher answered pending, and the worker did not reach a verdict: no $vfile"
    return 0
  fi
  IFS= read -r verdict <"$vfile"
  if [ "$verdict" != pass ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="the launcher answered pending, and the worker did not reach a verdict: $vfile reads '$verdict'"
    return 0
  fi
  case "$end" in '' | *[!0-9]*) end="" ;; esac
  done_at="$(hr_lane_mtime "$dfile")"
  if [ -z "$end" ] || [ "$done_at" = 0 ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="verdict pass, but the session end '${4:-}' or the done marker $dfile cannot be read, so outliving the session is not measured"
    return 0
  fi
  if [ "$done_at" -lt "$end" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="verdict pass, but the done marker was written $((end - done_at))s before the session ended, so outliving the session is not measured"
    return 0
  fi
  SP_VERDICT=pass
  SP_EVIDENCE="the worker outlived the call and the session: verdict pass, its done marker written $((done_at - end))s after the session ended"
  return 0
}

sp__gs2_grade() {
  local ctl="${1:-}" before="${2:-}" after="${3:-}" p bad="" checked=""
  if [ $# -ge 3 ]; then shift 3; else shift $#; fi
  if [ ! -f "$ctl" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the worker's control $ctl was not written"
    return 0
  fi
  if [ $# -eq 0 ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="no outside path lies outside the target in this layout"
    return 0
  fi
  if [ -z "$before" ] || [ -z "$after" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE=".git/config's shasum was not read before and after the session: '$before', '$after'"
    return 0
  fi
  for p in "$@"; do
    checked="${checked:+$checked, }$p"
    if [ -e "$p" ] || [ -L "$p" ]; then
      bad="${bad:+$bad; }$p exists"
    fi
  done
  [ "$before" = "$after" ] || bad="${bad:+$bad; }the target's .git/config shasum changed"
  if [ -n "$bad" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="read on disk, never from an exit status: $bad"
    return 0
  fi
  SP_VERDICT=pass
  SP_EVIDENCE="read on disk with the control written: none of $checked exists, and the target's .git/config shasum is unchanged"
  return 0
}

sp__gs3_grade() {
  local body="${1:-}" sfile="${2:-}" efile="${3:-}" code="${4:-}" status="" err="" more=""
  case "$code" in
    "" | 000)
      SP_VERDICT="not run"
      SP_EVIDENCE="the unsandboxed control reached no host: http code '$code'"
      return 0
      ;;
  esac
  if [ -s "$body" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="a body came back in $body (the unsandboxed control answered $code)"
    return 0
  fi
  if [ ! -f "$sfile" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the worker did not reach the curl call: no $sfile"
    return 0
  fi
  IFS= read -r status <"$sfile"
  case "$status" in
    '' | *[!0-9]*)
      SP_VERDICT="not run"
      SP_EVIDENCE="$sfile holds no exit status: '$status'"
      return 0
      ;;
  esac
  if [ "$status" -eq 0 ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="the worker's curl exited 0 with no body: it reached a host"
    return 0
  fi
  [ -f "$efile" ] && err="$(cat -- "$efile" 2>/dev/null)"
  case "$err" in
    *$'\n'*) more=" (stderr shown to its first line, a display cut only; full text in $efile)" ;;
  esac
  SP_VERDICT=pass
  SP_EVIDENCE="no body, curl exited $status, the unsandboxed control answered $code: ${err%%$'\n'*}$more"
  return 0
}

sp__gs4_grade() {
  local copy="${1:-}" host="${2:-}" env="${3:-}" ctl="${4:-}" line set="" unset_n=0 ssh_note
  if [ ! -f "$host" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the host has no $host to read"
    return 0
  fi
  if [ ! -s "$ctl" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the worker's control $ctl is empty or absent"
    return 0
  fi
  if [ -f "$env" ]; then
    while IFS= read -r line; do
      case "$line" in
        *" set") set="${set:+$set, }${line% set}" ;;
        *" unset") unset_n=$((unset_n + 1)) ;;
      esac
    done <"$env"
  fi
  if [ -s "$copy" ] && cmp -s -- "$copy" "$host"; then
    SP_VERDICT=fail
    SP_EVIDENCE="the worker read $host whole${set:+; and these are set: $set}"
    return 0
  fi
  if [ -n "$set" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="set in the worker: $set"
    return 0
  fi
  if [ -s "$copy" ]; then
    ssh_note="its copy of $host differs from the host's"
  else
    ssh_note="its copy of $host is empty"
  fi
  SP_VERDICT=pass
  SP_EVIDENCE="the worker read nothing of $host ($ssh_note), and $unset_n envVars name(s) are unset"
  return 0
}

sp__wf5_grade() {
  local file="${1:-}" kind="${2:-a sandboxed}" line raw="" a="" b="" n=0
  if [ ! -f "$file" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the worker did not reach the hr_lane_mtime calls: no $file"
    return 0
  fi
  while IFS= read -r line; do
    case "$line" in
      "stat -f %m: "*) [ -n "$raw" ] || raw="${line#stat -f %m: }" ;;
      "mtime "*)
        n=$((n + 1))
        if [ "$n" -eq 1 ]; then a="${line#mtime }"; elif [ "$n" -eq 2 ]; then b="${line#mtime }"; fi
        ;;
    esac
  done <"$file"
  if [ "$n" -lt 2 ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the worker did not reach the hr_lane_mtime calls: $n mtime line(s) in $file"
    return 0
  fi
  case "$a" in '' | *[!0-9]*) n=0 ;; esac
  case "$b" in '' | *[!0-9]*) n=0 ;; esac
  if [ "$n" -eq 0 ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="hr_lane_mtime printed no integer: '$a', then '$b' (the worker may not have sourced the run library)"
    return 0
  fi
  if [ "$a" -eq 0 ] || [ "$b" -eq 0 ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="neither stat arm answered: hr_lane_mtime printed $a, then $b"
    return 0
  fi
  if [ "$b" -le "$a" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="hr_lane_mtime did not advance: $a, then $b"
    return 0
  fi
  case "$raw" in
    *[0-9]*)
      case "$raw" in
        *[!0-9]*) ;;
        *)
          SP_VERDICT="not run"
          SP_EVIDENCE="hr_lane_mtime advanced $a..$b, but stat -f %m gave '$raw', so the BSD arm answered and the GNU stat -c %Y arm was not reached"
          return 0
          ;;
      esac
      ;;
  esac
  SP_VERDICT=pass
  SP_EVIDENCE="hr_lane_mtime advanced $a..$b in $kind process (stat -f %m gave '$raw', so the GNU stat -c %Y arm answered)"
  return 0
}

# sp__gs_all <evidence> — every row `not run`, with no grading.
sp__gs_all() {
  local row
  for row in GS1 GS2 GS3 GS4 WF5; do
    sp_result_line gate-sandbox "$row" "not run" "$1" ""
  done
}

# sp__gs_restore <target> — put back harness.config.json, and .git/config when it changed, from the copies
# saved before the session; the pending restore and the leg's own last step. Status 1, raising exit 3, when
# a `cmp` refuses either.
sp__gs_restore() {
  local target="${1:-}" rc=0
  if [ -n "$SP__GS_SAVED" ] && [ -f "$SP__GS_SAVED" ]; then
    cp -- "$SP__GS_SAVED" "$target/harness.config.json" 2>/dev/null
    if ! cmp -s -- "$SP__GS_SAVED" "$target/harness.config.json"; then
      sp_refuse "gate-sandbox: '$target/harness.config.json' is not byte-identical to its saved copy '$SP__GS_SAVED'; restore it by hand"
      sp_exit_raise 3
      rc=1
    fi
  fi
  if [ -n "$SP__GS_GITCFG_SAVED" ] && [ -f "$SP__GS_GITCFG_SAVED" ] &&
    ! cmp -s -- "$SP__GS_GITCFG_SAVED" "$target/.git/config"; then
    cp -- "$SP__GS_GITCFG_SAVED" "$target/.git/config" 2>/dev/null
    if ! cmp -s -- "$SP__GS_GITCFG_SAVED" "$target/.git/config"; then
      sp_refuse "gate-sandbox: '$target/.git/config' is not byte-identical to its saved copy '$SP__GS_GITCFG_SAVED'; restore it by hand"
      sp_exit_raise 3
      rc=1
    fi
  fi
  return "$rc"
}

# sp__gs_rm <path> — remove one plain file the leg created; a refusal is named on stderr.
sp__gs_rm() {
  { [ -f "$1" ] || [ -L "$1" ]; } || return 0
  rm -f -- "$1" 2>/dev/null
  { [ -e "$1" ] || [ -L "$1" ]; } && sp_refuse "gate-sandbox: '$1' is left; remove it by hand"
  return 0
}

# sp__gs_body <outside paths> <script> <records dir> <running file> <verdict file> <log file> <lib> <drops>
# — steps 3 to 8. Status 1 with SP__GS_WHY set when no row was printed; the caller then prints them all.
sp__gs_body() {
  local outside="$1" script="$2" rec="$3" running="$4" vfile="$5" lfile="$6" lib="$7" drops="$8"
  local base="$SP_MAIN/.claude/settings.autonomous.json" names name nargs pfile cmd end line departure
  local sha_before sha_after code i=0 f paths p
  nargs=()
  names="$(jq -r '(.sandbox.credentials.envVars // [])[] | .name? // empty' "$base" 2>/dev/null)" || {
    SP__GS_WHY="cannot read .sandbox.credentials.envVars from '$base'"
    return 1
  }
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    case "$name" in
      [A-Za-z_]*) case "$name" in *[!A-Za-z0-9_]*) SP__GS_WHY="'$name' in $base's envVars is not a variable name"; return 1 ;; esac ;;
      *) SP__GS_WHY="'$name' in $base's envVars is not a variable name"; return 1 ;;
    esac
    nargs[${#nargs[@]}]="$name"
  done <<EOF
$names
EOF

  # 3.
  sp_track "$script"
  sp_track "$rec"
  if ! mkdir -- "$rec" 2>/dev/null; then
    SP__GS_WHY="could not create the records directory '$rec'"
    return 1
  fi
  if ! sp__gs_test_script "$script" "$SP__GS_TARGET" "$rec" "$running" "$lib" "$outside" \
    ${nargs[@]+"${nargs[@]}"}; then
    SP__GS_WHY="could not write the test script '$script'"
    return 1
  fi

  # 4.
  sha_before="$(sp__gs_sha "$SP__GS_TARGET/.git/config")"

  # 5.
  cmd="bash $SP_SCRIPTS/launch-sandboxed-gates.sh $SP__GS_TARGET $SP_GS_LABEL"
  pfile="$SP_TMP/gate-sandbox.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp_session gate-sandbox "$SP__GS_PROFILE" "$pfile" --cwd "$SP__GS_TARGET"
  end="$(date +%s)"
  departure="$(sp_departures)"
  departure="${departure:+$departure; }a fixture written from an ordinary terminal: the target's harness.config.json with commands.typecheck <none> and commands.test bash $script"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session gate-sandbox did not launch; see $SP_TMP/gate-sandbox.stderr"
    SP__GS_WHY="session gate-sandbox did not launch; see $SP_TMP/gate-sandbox.stderr"
    return 1
  fi
  sp_judge_call "$SP_STREAM" ran "$cmd"
  if [ -z "$SP_LAYER" ]; then
    line="$SP_EVIDENCE"
  elif [ "$SP_LAYER" != ran ]; then
    line="refused at the $SP_LAYER layer: $SP_LAYER_EVIDENCE"
  else
    # The Bash tool opens a non-zero exit's result on a bare `Exit code <n>` line (PD18); the launcher's
    # answer is the line after it.
    line="$SP__TEXT"
    case "${line%%$'\n'*}" in
      "Exit code "*) case "$line" in *$'\n'*) line="${line#*$'\n'}" ;; *) line="" ;; esac ;;
    esac
    line="$(sp__first_line "$line")"
  fi
  if [ "$SP_LAYER" = ran ]; then
    SP_CTL_OK=1
    SP_CTL_EVIDENCE=""
  else
    SP_CTL_OK=0
    SP_CTL_EVIDENCE="the launch call: $line"
  fi

  # 6. No PID is tracked: the worker's is a namespace PID.
  if [ "$line" = pending ]; then
    while [ ! -e "$vfile" ] && [ "$i" -lt $((SP_GS_HOLD_SECONDS + 60)) ]; do
      sleep 1
      i=$((i + 1))
    done
  fi

  # 7.
  code="$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' https://example.com/ 2>/dev/null)" || :
  sha_after="$(sp__gs_sha "$SP__GS_TARGET/.git/config")"

  # 8. Kept whole, as copies: the leg removes the originals before the next leg.
  if mkdir -- "$SP_TMP/gate-sandbox.records" 2>/dev/null; then
    for f in "$rec"/* "$vfile" "$lfile"; do
      [ -f "$f" ] || continue
      if cp -p -- "$f" "$SP_TMP/gate-sandbox.records/${f##*/}" 2>/dev/null; then
        sp_keep_file "$SP_TMP/gate-sandbox.records/${f##*/}"
      fi
    done
  fi

  sp__gs1_grade "$line" "$vfile" "$rec/done" "$end"
  sp_row_result --direct gate-sandbox GS1 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  paths=()
  while IFS= read -r p; do
    [ -n "$p" ] && paths[${#paths[@]}]="$p"
  done <"$outside"
  sp__gs2_grade "$rec/gs2_control.txt" "$sha_before" "$sha_after" ${paths[@]+"${paths[@]}"}
  sp_row_result --direct gate-sandbox GS2 "$SP_VERDICT" "$SP_EVIDENCE${drops:+; $drops}" "$departure"
  sp__gs3_grade "$rec/gs3.body" "$rec/gs3.status" "$rec/gs3.stderr" "$code"
  sp_row_result --direct gate-sandbox GS3 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  sp__gs4_grade "$rec/gs4.ssh" "$HOME/.ssh/config" "$rec/gs4.env" "$rec/gs4.control"
  sp_row_result --direct gate-sandbox GS4 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  sp__wf5_grade "$rec/wf5.mtimes" "the launcher's sandboxed gate-worker"
  sp_row_result --direct gate-sandbox WF5 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  return 0
}

sp_leg_gate_sandbox() {
  local scripts_rel state_rel branch lane lib outside="$SP_TMP/gate-sandbox.outside"
  local drops_file="$SP_TMP/gate-sandbox.outside.stderr" drops="" line p
  local script rec vfile lfile lane_new=0 vfile_new=0 lfile_new=0
  local rewritten="$SP_TMP/gate-sandbox.rewritten.json"
  SP__GS_SAVED="$SP_TMP/gate-sandbox.config.json"
  SP__GS_GITCFG_SAVED="$SP_TMP/gate-sandbox.git-config"
  SP__GS_WHY=""

  # 0.
  if ! sp__gs_target || ! sp__gs_target_check "$SP_MAIN" "$SP__GS_TARGET"; then
    sp__gs_all "$SP__GS_WHY"
    return 0
  fi
  script="$SP__GS_TARGET/sbx_gs_test.sh"
  rec="$SP__GS_TARGET/sbx_gs"

  # 1.
  if ! sp__gs2_outside_paths "$SP__GS_TARGET" "$SP_MAIN" "${HOME:-}" >"$outside" 2>"$drops_file"; then
    sp__gs_all "could not write GS2's outside paths to '$outside'"
    return 0
  fi
  while IFS= read -r line; do
    [ -n "$line" ] && drops="${drops:+$drops; }$line"
  done <"$drops_file"
  if ! scripts_rel="$(hr_scripts_dir "$SP__GS_TARGET")" || [ -z "$scripts_rel" ]; then
    sp__gs_all "cannot resolve scriptsDir from '$SP__GS_TARGET/harness.config.json'"
    return 0
  fi
  if ! state_rel="$(hr_state_dir "$SP__GS_TARGET")" || [ -z "$state_rel" ]; then
    sp__gs_all "cannot resolve stateDir from '$SP__GS_TARGET/harness.config.json'"
    return 0
  fi
  branch="$(hr_current_branch "$SP__GS_TARGET")"
  if ! lane="$(hr_test_run_lane_dir "$state_rel" "$branch")"; then
    sp__gs_all "the target '$SP__GS_TARGET' has no current branch"
    return 0
  fi
  if [ "$scripts_rel" = . ]; then lib="$SP__GS_TARGET/lib/harness-run-lib.sh"; else lib="$SP__GS_TARGET/$scripts_rel/lib/harness-run-lib.sh"; fi
  lane="$SP__GS_TARGET/$lane"
  vfile="$lane/$SP_GS_LABEL.verdict"
  lfile="$lane/$SP_GS_LABEL.log"
  if ! sp__ctl_literal target "$SP__GS_TARGET" || ! sp__ctl_literal "scripts directory" "$SP_SCRIPTS" ||
    ! sp__ctl_literal "run library" "$lib" || ! sp__ctl_literal lane "$lane"; then
    sp__gs_all "the target, the scripts directory, the target's run library or its lane is not spellable as one literal word"
    return 0
  fi
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    if ! sp__ctl_literal "outside path" "$p"; then
      sp__gs_all "the outside path '$p' is not spellable as one literal word"
      return 0
    fi
  done <"$outside"
  for p in "$rec" "$script"; do
    if [ -e "$p" ] || [ -L "$p" ]; then
      sp__gs_all "'$p' exists before the session; the probe removes only what it created, so remove it and re-run"
      return 0
    fi
  done
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    if [ -e "$p" ] || [ -L "$p" ]; then
      sp__gs_all "'$p' exists before the session; the probe removes only what it created, so remove it and re-run"
      return 0
    fi
  done <"$outside"
  [ -e "$lane" ] || lane_new=1
  [ -e "$vfile" ] || vfile_new=1
  [ -e "$lfile" ] || lfile_new=1

  # 2. Saved and restore-registered before the target's copy changes.
  if ! cp -p -- "$SP__GS_TARGET/harness.config.json" "$SP__GS_SAVED" 2>/dev/null ||
    ! cp -p -- "$SP__GS_TARGET/.git/config" "$SP__GS_GITCFG_SAVED" 2>/dev/null; then
    sp__gs_all "could not save the target's harness.config.json and .git/config under '$SP_TMP'"
    return 0
  fi
  if ! jq --arg t "bash $script" '.commands.typecheck = "<none>" | .commands.test = $t' \
    "$SP__GS_SAVED" >"$rewritten" 2>/dev/null; then
    sp__gs_all "jq could not rewrite the commands of '$SP__GS_SAVED'"
    return 0
  fi
  if ! sp_restore_register sp__gs_restore "$SP__GS_TARGET"; then
    sp__gs_all "could not register the gate-sandbox restore"
    return 0
  fi
  if cp -- "$rewritten" "$SP__GS_TARGET/harness.config.json" 2>/dev/null; then
    sp__gs_body "$outside" "$script" "$rec" "$lane/$SP_GS_LABEL.running" "$vfile" "$lfile" "$lib" "$drops" ||
      sp__gs_all "$SP__GS_WHY"
  else
    sp__gs_all "could not rewrite '$SP__GS_TARGET/harness.config.json'"
  fi

  # 9. Every path past step 2 reaches here.
  sp__gs_restore "$SP__GS_TARGET" && sp_restore_clear
  sp__gs_rm "$script"
  for p in "$rec"/*; do
    sp__gs_rm "$p"
  done
  if [ -d "$rec" ] && [ ! -L "$rec" ] && ! rmdir -- "$rec" 2>/dev/null; then
    sp_refuse "gate-sandbox: '$rec' is left; remove it by hand"
  fi
  while IFS= read -r p; do
    [ -n "$p" ] && sp__gs_rm "$p"
  done <"$outside"
  [ "$vfile_new" -eq 1 ] && sp__gs_rm "$vfile"
  [ "$lfile_new" -eq 1 ] && sp__gs_rm "$lfile"
  [ "$lane_new" -eq 1 ] && [ -d "$lane" ] && rmdir -- "$lane" 2>/dev/null
  return 0
}
