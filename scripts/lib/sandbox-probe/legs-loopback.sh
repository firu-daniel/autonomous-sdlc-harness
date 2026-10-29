#!/usr/bin/env bash
# legs-loopback.sh — the sandbox probe's loopback leg (rows LB1, LB2, LB3, LB4, LB5), Linux only: F8's
# macOS question (docs/sandbox-verification.md §5 F8, §4 N3) measured on Linux, whether a sandboxed command
# reaches a loopback listener.
#   LB1  the probe's listener by 127.0.0.1, on the network scratch profile as generated
#   LB2  the probe's listener by localhost, on the same profile
#   LB3  LB1's calls, on that profile with 127.0.0.1 added to sandbox.network.allowedDomains
#   LB4  LB2's calls, on that profile
#   LB5  a listener a sandboxed call starts, called from outside the sandbox (the interactive-test shape),
#        on the profile as generated
#
# THE TWO PROFILES. A is legs-network.sh's SP__NET_PROFILE (allowedDomains [], allowLocalBinding true, its
# Bash(curl:*) deny dropped). B is A with 127.0.0.1 listed: the shape LOOPBACK_ALLOWED_HOST
# (cli/src/generators/sandboxProfile.ts) produces when the interactive-test phase applies. Each row's
# evidence opens with its profile's two values.
#
# EACH OF LB1-LB4 issues the plain call and the same call with `--noproxy '*'` before the URL, each under
# its exact --allowedTools rule. A rule the permission layer does not match prints `not run` with that
# layer's text. LB1 and LB3 end with the session's proxy variables, host and port only: the helper drops
# the scheme, any user[:password]@ and any path, prints an empty value as `unset`, and
# sp__lb_proxy_line strips any `<user>[:<password>]@` again before printing.
#
# NOTHING HERE IS GRADED ON WHAT IT FINDS. Every curl call and the LB5 start call is judged at `ran`, so
# Task 3's Linux `unrecognised` arm, which needs an expected sandbox or network layer, never fires; the
# judge supplies only `not run`, SP_LAYER (to screen out permission and file-tool) and the result text.
# Once the listener answered the probe's own request, a row is `pass` and records whether the token came
# back. LB3 and LB4 say whether that differs from LB1 and LB2.
#
# LB5'S BOUND. The listener runs under `timeout 60`, counted from the start call, session C's first call.
# The session then issues only the network control, and up to three outside requests follow at once, a
# second apart, each --max-time 5, so the bound covers a session of up to about 40 s; a longer session can
# let the listener expire first. LB5's evidence names session C's seconds.
#
# LB5'S LIVENESS RULE. One `pgrep -f "<clone>/sbx_lb5_www"`, right after the last outside request. As N3
# counts no body only while the listener answered, LB5 records *unreachable* only while that check finds
# the listener running; a listener the sandbox ended with its call or session (BG9's open question), or
# `timeout 60` ended, reads `0` and is `not run`.
#
# THE GRADING FUNCTIONS read only their arguments, the stream and (sp__lb5_grade) legs-network.sh's
# SP__NET_LOOPBACK_HOST, and set SP_VERDICT and SP_EVIDENCE:
#   sp__lb_proxy_line <stream> <helper command>   prints `proxy: <NAME>=<value>, …` or `proxy: not recorded (<why>)`
#   sp__lb_grade <stream> <plain command> <noproxy command> <token> <listener answered: 1|0>
#   sp__lb5_grade <stream> <start command> <outside reply> <token> <listener alive: 1|0|?>
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_LB5_SECONDS=60
SP__LB_CAME=""
SP__LB_SIG_LB1=""
SP__LB_SIG_LB2=""

sp__lb_proxy_line() {
  local stream="${1:-}" cmd="${2:-}" line name val out=""
  sp_judge_call "$stream" ran "$cmd"
  if [ "$SP_VERDICT" = "not run" ]; then
    printf 'proxy: not recorded (%s)\n' "$SP_EVIDENCE"
    return 0
  fi
  case "$SP_LAYER" in permission | file-tool)
    printf 'proxy: not recorded (refused at the %s layer: %s)\n' "$SP_LAYER" "$SP_LAYER_EVIDENCE"
    return 0
    ;;
  esac
  while IFS= read -r line; do
    case "$line" in "sbx_lb_proxy "*)
      line="${line#sbx_lb_proxy }"
      name="${line%% *}"
      val="${line#* }"
      [ "$val" != "$line" ] || val=""
      val="${val##*@}"
      [ -z "$out" ] || out="$out, "
      out="$out$name=$val"
      ;;
    esac
  done <<<"$SP__TEXT"
  if [ -z "$out" ]; then
    printf 'proxy: not recorded (the helper printed no sbx_lb_proxy line: %s)\n' "$(sp__first_line "$SP__TEXT")"
    return 0
  fi
  printf 'proxy: %s\n' "$out"
}

# sp__lb_outcome <stream> <command> <token> — sets SP__LB_OUTCOME and SP__LB_HIT (1|0); status 1, with
# SP_EVIDENCE naming the call, when the call is `not run`.
sp__lb_outcome() {
  local stream="$1" cmd="$2" token="$3" line
  SP__LB_OUTCOME=""
  SP__LB_HIT=0
  sp_judge_call "$stream" ran "$cmd"
  if [ "$SP_VERDICT" = "not run" ]; then
    SP_EVIDENCE="$cmd: $SP_EVIDENCE"
    return 1
  fi
  case "$SP_LAYER" in permission | file-tool)
    SP_EVIDENCE="$cmd: refused at the $SP_LAYER layer, so it never reached the sandbox: $SP_LAYER_EVIDENCE"
    return 1
    ;;
  esac
  case "$SP__TEXT" in *"$token"*)
    SP__LB_OUTCOME="the token came back"
    SP__LB_HIT=1
    return 0
    ;;
  esac
  if line="$(sp__net_curl_line "$SP__TEXT")"; then
    SP__LB_OUTCOME="no body: $line"
  else
    SP__LB_OUTCOME="no body: $SP_LAYER: $SP_LAYER_EVIDENCE"
  fi
  return 0
}

# Also sets SP__LB_CAME to `<plain hit> <noproxy hit>` on a pass, empty otherwise.
sp__lb_grade() {
  local stream="${1:-}" plain="${2:-}" noproxy="${3:-}" token="${4:-}" answered="${5:-0}" a b ha
  SP__LB_CAME=""
  # An empty token would match every result.
  if [ -z "$token" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="no listener token to look for in the result"
    return 0
  fi
  if ! sp__lb_outcome "$stream" "$plain" "$token"; then
    SP_VERDICT="not run"
    return 0
  fi
  a="$SP__LB_OUTCOME"
  ha="$SP__LB_HIT"
  if ! sp__lb_outcome "$stream" "$noproxy" "$token"; then
    SP_VERDICT="not run"
    return 0
  fi
  b="$SP__LB_OUTCOME"
  if [ "$answered" != 1 ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the listener did not answer the probe's own request, so no body proves nothing: plain: $a; --noproxy: $b"
    return 0
  fi
  SP__LB_CAME="$ha $SP__LB_HIT"
  SP_VERDICT=pass
  SP_EVIDENCE="plain: $a; --noproxy: $b"
}

sp__lb5_grade() {
  local stream="${1:-}" cmd="${2:-}" reply="${3:-}" token="${4:-}" alive="${5:-}" line port err
  sp_judge_call "$stream" ran "$cmd"
  if [ "$SP_VERDICT" = "not run" ]; then
    SP_EVIDENCE="the start call: $SP_EVIDENCE"
    return 0
  fi
  case "$SP_LAYER" in permission | file-tool)
    SP_VERDICT="not run"
    SP_EVIDENCE="the start call was refused at the $SP_LAYER layer, so no listener was started: $SP_LAYER_EVIDENCE"
    return 0
    ;;
  esac
  if line="$(sp__line_with "$SP__TEXT" sbx_lb5_no_listener)"; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the start call started no listener: $line"
    return 0
  fi
  port=""
  if line="$(sp__line_with "$SP__TEXT" "sbx_lb5_listening ")"; then
    port="${line#*sbx_lb5_listening }"
    port="${port%% *}"
  fi
  case "$port" in '' | *[!0-9]*)
    SP_VERDICT="not run"
    SP_EVIDENCE="the start call printed no sbx_lb5_listening line: $SP_LAYER_EVIDENCE"
    return 0
    ;;
  esac
  if [ -z "$token" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="no listener token to look for in the outside reply"
    return 0
  fi
  case "$reply" in *"$token"*)
    SP_VERDICT=pass
    SP_EVIDENCE="reachable from outside the sandbox: the token came back on $SP__NET_LOOPBACK_HOST:$port"
    return 0
    ;;
  esac
  err="$(sp__net_curl_line "$reply")" || err="$(sp__first_line "$reply")"
  case "$alive" in
    1)
      SP_VERDICT=pass
      SP_EVIDENCE="unreachable from outside the sandbox while the listener was running: $err"
      ;;
    0)
      SP_VERDICT="not run"
      SP_EVIDENCE="the listener was no longer running when the probe called it, so no reply proves nothing: $err"
      ;;
    '?')
      SP_VERDICT="not run"
      SP_EVIDENCE="could not tell whether the listener was still running (pgrep does not resolve on PATH): $err"
      ;;
    *)
      SP_VERDICT="not run"
      SP_EVIDENCE="could not tell whether the listener was still running (liveness '$alive'): $err"
      ;;
  esac
  return 0
}

# sp__lb_proxy_helper <path> — write lb-proxy.sh.
sp__lb_proxy_helper() {
  {
    printf '%s\n' '#!/usr/bin/env bash' \
      '# Written by scripts/lib/sandbox-probe/legs-loopback.sh for one session, then removed.'
    cat <<'EOF'
for n in http_proxy HTTP_PROXY https_proxy HTTPS_PROXY all_proxy ALL_PROXY no_proxy NO_PROXY; do
  eval "v=\${$n-}"
  if [ -z "$v" ]; then
    printf 'sbx_lb_proxy %s unset\n' "$n"
    continue
  fi
  case "$n" in
    no_proxy | NO_PROXY) ;;
    *)
      case "$v" in *://*) v="${v#*://}" ;; esac
      # The userinfo before the path: a password may carry an unencoded '/'.
      v="${v##*@}"
      v="${v%%[/?#]*}"
      ;;
  esac
  printf 'sbx_lb_proxy %s %s\n' "$n" "$v"
done
EOF
  } >"$1" 2>/dev/null
}

# sp__lb5_helper <path> <clone> <token> — write lb5-start.sh, every path and the token a literal.
sp__lb5_helper() {
  {
    printf '%s\n' '#!/usr/bin/env bash' \
      '# Written by scripts/lib/sandbox-probe/legs-loopback.sh for one session, then removed.'
    printf 'clone=%q\ntoken=%q\nbound=%q\nhost=%q\n' "$2" "$3" "$SP_LB5_SECONDS" "$SP__NET_LOOPBACK_HOST"
    cat <<'EOF'
www="$clone/sbx_lb5_www"
log="$clone/sbx_lb5.log"
mkdir -p "$www" && printf '%s\n' "$token" >"$www/sbx_lb5.txt" && : >"$log"
nohup timeout "$bound" python3 -u -m http.server --bind "$host" --directory "$www" 0 </dev/null >"$log" 2>&1 &
disown
port=""
i=0
while [ "$i" -lt 50 ]; do
  while IFS= read -r line; do
    case "$line" in "Serving HTTP on $host port "*)
      port="${line#"Serving HTTP on $host port "}"
      port="${port%% *}"
      break
      ;;
    esac
  done <"$log"
  case "$port" in '' | *[!0-9]*) port="" ;; *) break ;; esac
  sleep 0.1
  i=$((i + 1))
done
if [ -n "$port" ]; then
  printf 'sbx_lb5_listening %s\n' "$port"
else
  first=""
  [ -f "$log" ] && IFS= read -r first <"$log"
  printf 'sbx_lb5_no_listener %s\n' "$first"
fi
exit 0
EOF
  } >"$1" 2>/dev/null
}

# sp__lb_profile_values <profile> — `allowedDomains <json>, allowLocalBinding <value>`.
sp__lb_profile_values() {
  local v
  v="$(jq -r '.sandbox.network as $n
    | "allowedDomains \($n.allowedDomains // null | tojson), allowLocalBinding \($n.allowLocalBinding | tojson)"' \
    "${1:-}" 2>/dev/null)" || v=""
  [ -n "$v" ] || v="allowedDomains and allowLocalBinding unreadable in '${1:-}'"
  printf '%s\n' "$v"
}

# sp__lb_pair <tag> <profile> <profile note> <row 127.0.0.1> <row localhost> — one listener, one session,
# two rows. LB3 and LB4 are compared against SP__LB_SIG_LB1 and SP__LB_SIG_LB2, which LB1 and LB2 set.
sp__lb_pair() {
  local tag="$1" profile="$2" note="$3" r1="$4" r2="$5" pcmd="bash $SP_TMP/lb-proxy.sh" pfile values
  local base1 base2 p1 n1 p2 n2 launched=0 answered=0 reply departure proxy d row ref sig cmp
  values="$(sp__lb_profile_values "$profile")"
  if ! sp__net_listener_start; then
    sp_result_line loopback "$r1" "not run" "$values: $SP__NET_LISTENER_WHY" ""
    sp_result_line loopback "$r2" "not run" "$values: $SP__NET_LISTENER_WHY" ""
    return 0
  fi
  base1="http://$SP__NET_LOOPBACK_HOST:$SP__NET_PORT/sbx_n3.txt"
  base2="http://localhost:$SP__NET_PORT/sbx_n3.txt"
  p1="curl -sS --max-time 5 $base1"
  n1="curl -sS --max-time 5 --noproxy '*' $base1"
  p2="curl -sS --max-time 5 $base2"
  n2="curl -sS --max-time 5 --noproxy '*' $base2"
  sp_ctl_prepare "lb$tag"
  pfile="$SP_TMP/loopback-$tag.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$pcmd"
  sp_prompt_bash "$pfile" "$p1"
  sp_prompt_bash "$pfile" "$n1"
  sp_prompt_bash "$pfile" "$p2"
  sp_prompt_bash "$pfile" "$n2"
  sp_ctl_add "$pfile" ran "$SP_NET_CONTROL"
  sp__net_session "loopback-$tag" "$profile" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash($pcmd)" --allowed "Bash($p1)" --allowed "Bash($n1)" \
    --allowed "Bash($p2)" --allowed "Bash($n2)" --allowed "Bash($SP_NET_CONTROL)" && launched=1
  # The probe's own request, before the stop, as sp_leg_network's N3.
  reply="$(curl -sS --max-time 5 "$base1" 2>/dev/null)"
  case "$reply" in *"$SP__NET_TOKEN"*) answered=1 ;; esac
  sp__net_listener_stop
  if [ "$launched" -eq 0 ]; then
    sp_result_line loopback "$r1" "not run" "$values: $SP__NET_WHY" ""
    sp_result_line loopback "$r2" "not run" "$values: $SP__NET_WHY" ""
    return 0
  fi
  d="$(sp_departures)"
  departure="--settings $profile ($note)${d:+; $d}"
  proxy="$(sp__lb_proxy_line "$SP_STREAM" "$pcmd")"
  sp_ctl_held "$SP_STREAM"
  for row in "$r1" "$r2"; do
    if [ "$row" = "$r1" ]; then
      sp__lb_grade "$SP_STREAM" "$p1" "$n1" "$SP__NET_TOKEN" "$answered"
      ref=LB1
    else
      sp__lb_grade "$SP_STREAM" "$p2" "$n2" "$SP__NET_TOKEN" "$answered"
      ref=LB2
    fi
    sig="$SP__LB_CAME"
    [ "$row" = LB1 ] && SP__LB_SIG_LB1="$sig"
    [ "$row" = LB2 ] && SP__LB_SIG_LB2="$sig"
    SP_EVIDENCE="$values; $SP_EVIDENCE"
    case "$row" in LB1 | LB3) SP_EVIDENCE="$SP_EVIDENCE; $proxy" ;; esac
    case "$row" in LB3 | LB4)
      if [ "$ref" = LB1 ]; then cmp="$SP__LB_SIG_LB1"; else cmp="$SP__LB_SIG_LB2"; fi
      if [ -z "$sig" ] || [ -z "$cmp" ]; then
        SP_EVIDENCE="$SP_EVIDENCE; on the profile as generated ($ref): not compared, one of the two was not run"
      elif [ "$sig" = "$cmp" ]; then
        SP_EVIDENCE="$SP_EVIDENCE; on the profile as generated ($ref): same"
      else
        SP_EVIDENCE="$SP_EVIDENCE; on the profile as generated ($ref): different"
      fi
      ;;
    esac
    sp_row_result loopback "$row" "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  done
}

# sp__lb5 — session C: a sandboxed call starts a listener, the probe calls it from outside.
sp__lb5() {
  local start="$SP_TMP/lb5-start.sh" scmd www="$SP_CLONE/sbx_lb5_www" log="$SP_CLONE/sbx_lb5.log"
  local token pfile values departure line port="" reply="" alive="" i=0 p rc
  values="$(sp__lb_profile_values "$SP__NET_PROFILE")"
  if ! command -v curl >/dev/null 2>&1; then
    sp_result_line loopback LB5 "not run" "$values: curl does not resolve on PATH, so the probe cannot call the listener from outside" ""
    return 0
  fi
  if ! sp__ctl_literal "temp area" "$SP_TMP"; then
    sp_result_line loopback LB5 "not run" "$values: the temp area '$SP_TMP' is not spellable as one literal word" ""
    return 0
  fi
  for p in "$www" "$log"; do
    if [ -e "$p" ] || [ -L "$p" ]; then
      sp_result_line loopback LB5 "not run" \
        "$values: '$p' exists before the session; the probe removes only what it created, so remove it and re-run" ""
      return 0
    fi
  done
  token="sbx_lb5_$(date +%s)_$$"
  sp_track "$start"
  sp_track "$www/sbx_lb5.txt"
  sp_track "$log"
  sp_track "$www"
  if ! sp__lb5_helper "$start" "$SP_CLONE" "$token"; then
    sp_result_line loopback LB5 "not run" "$values: could not write the helper $start" ""
    return 0
  fi
  scmd="bash $start"
  sp_ctl_prepare lbc
  pfile="$SP_TMP/loopback-c.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$scmd"
  sp_ctl_add "$pfile" ran "$SP_NET_CONTROL"
  if ! sp__net_session loopback-c "$SP__NET_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash($scmd)" --allowed "Bash($SP_NET_CONTROL)"; then
    sp_result_line loopback LB5 "not run" "$values: $SP__NET_WHY" ""
    return 0
  fi
  departure="$(sp__net_departure)"
  sp_judge_call "$SP_STREAM" ran "$scmd"
  if line="$(sp__line_with "$SP__TEXT" "sbx_lb5_listening ")"; then
    port="${line#*sbx_lb5_listening }"
    port="${port%% *}"
    case "$port" in *[!0-9]*) port="" ;; esac
  fi
  if [ -n "$port" ]; then
    while [ "$i" -lt 3 ]; do
      [ "$i" -eq 0 ] || sleep 1
      reply="$(curl -sS --max-time 5 "http://$SP__NET_LOOPBACK_HOST:$port/sbx_lb5.txt" 2>&1)"
      case "$reply" in *"$token"*) break ;; esac
      i=$((i + 1))
    done
    # The liveness check: one call, no retry, after the last outside request.
    if ! command -v pgrep >/dev/null 2>&1; then
      alive='?'
    else
      pgrep -f "$www" >/dev/null 2>&1
      rc=$?
      case "$rc" in
        0) alive=1 ;;
        1) alive=0 ;;
        *) alive="pgrep exit $rc" ;;
      esac
    fi
  fi
  [ -f "$log" ] && sp_keep_file "$log"
  sp_ctl_held "$SP_STREAM"
  sp__lb5_grade "$SP_STREAM" "$scmd" "$reply" "$token" "$alive"
  sp_row_result loopback LB5 "$SP_VERDICT" "$values; $SP_EVIDENCE; session C ran $SP__NET_SECONDS s" "$departure"
  return 0
}

sp_leg_loopback() {
  local profile_b row
  SP__LB_SIG_LB1=""
  SP__LB_SIG_LB2=""
  if ! sp__net_profile; then
    for row in LB1 LB2 LB3 LB4 LB5; do
      sp_result_line loopback "$row" "not run" "$SP__NET_PROFILE_WHY" ""
    done
    return 0
  fi
  if ! sp__ctl_literal "temp area" "$SP_TMP"; then
    for row in LB1 LB2 LB3 LB4 LB5; do
      sp_result_line loopback "$row" "not run" "the temp area '$SP_TMP' is not spellable as one literal word" ""
    done
    return 0
  fi
  sp_track "$SP_TMP/lb-proxy.sh"
  if ! sp__lb_proxy_helper "$SP_TMP/lb-proxy.sh"; then
    for row in LB1 LB2 LB3 LB4; do
      sp_result_line loopback "$row" "not run" "could not write the helper $SP_TMP/lb-proxy.sh" ""
    done
  else
    sp__lb_pair a "$SP__NET_PROFILE" "SP_RUN_PROFILE without its Bash(curl:*) deny entry" LB1 LB2
    if profile_b="$(sp_scratch_profile sbx_lb_ip ".sandbox.network.allowedDomains += [\"$SP__NET_LOOPBACK_HOST\"]" "$SP__NET_PROFILE")"; then
      sp__lb_pair b "$profile_b" "the network scratch profile with $SP__NET_LOOPBACK_HOST added to sandbox.network.allowedDomains" LB3 LB4
    else
      for row in LB3 LB4; do
        sp_result_line loopback "$row" "not run" "could not derive the sbx_lb_ip scratch profile from '$SP__NET_PROFILE'" ""
      done
    fi
  fi
  sp__lb5
  return 0
}
