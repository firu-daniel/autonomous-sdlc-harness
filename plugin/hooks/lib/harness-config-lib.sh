#!/usr/bin/env bash
# harness-config-lib.sh — the one place every guard hook and the two QA-user
# helpers resolve the repository they are judging, read that repository's
# `harness.config.json`, answer "is this branch protected?", and build the
# path-anchored prefixes the allow-only guards match a command piece against.
#
# WHO SOURCES THIS, AND HOW. The guard hooks in `plugin/hooks/*.sh` and
# `plugin/scripts/reserve-qa-user.sh` / `release-qa-user.sh` source it by a path
# computed from `${BASH_SOURCE[0]}` — the sourcing script's own location — e.g.
#
#     . "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-config-lib.sh"
#
# and never by the plugin-root token. The runtime substitutes that token into a
# hook's `command` string and into agent bodies; it does not export it into a
# script's environment, so a script body that reaches for it gets an empty
# string under `set -u` or an unset variable without it. (The token is
# deliberately not spelled out anywhere in this file: its literal presence here
# is exactly the defect this paragraph exists to prevent, and the port's leak
# sweep greps for it.)
#
# JURISDICTION. Config is read at `<repo_root>/harness.config.json` and nowhere
# else, where `<repo_root>` is resolved from the command the hook was handed —
# never from a hardcoded path and never from an assumed session root. A
# repository with no such file has not adopted the harness: the guards have no
# jurisdiction there and stay silent. That is the one deliberate
# permit-by-default, and it is deliberate because plugin hooks fire in every
# session the plugin is enabled for, including repositories that never ran
# `init`. The caller-agnostic backstop for those is the adopter's own committed
# pre-push hook. That backstop is caller-agnostic WITHIN GIT: git runs it on
# every push git performs, and a tool that implements push against the git
# backend itself, as `jj git push` does, performs no git push and runs no git
# hook.
#
# THE PROTECTED-BRANCH TRICHOTOMY — the reason this library exists.
# `hc_branch_is_protected` returns:
#
#     0  protected      — the branch matched a pattern in the resolved set
#     1  not protected  — the set was resolved and the branch is not in it
#     2  unresolvable   — the configuration could not be resolved at all
#                         (absent `jq`, unreadable or invalid JSON, or the
#                         required `defaultBranch` key missing)
#
# A consumer that treats 2 as 1 permits on a broken configuration, which is the
# failure this whole library exists to prevent. Within jurisdiction, no consumer
# may emit an `allow` on a 2: the commit guard answers `ask`, the
# protected-branch guard answers `deny`, and an allow-only guard stays silent
# (exit 0, no output) so the permission system decides instead.
#
# THE PROTECTED SET. It is *(`protectedBranches` if present, else the schema
# default `["main"]`)* ∪ *{`defaultBranch`}*. `defaultBranch` is a required key,
# so its absence is an unresolvable configuration rather than a defaultable one.
# Entries are matched as `case` globs, so one `release/*` entry covers its
# namespace. No literal branch name is baked in anywhere: a repository whose
# default branch is `trunk` and whose list is `["trunk","release/*"]` has `main`
# as an ordinary branch, and this library says so.
#
# SAFE PREFIXES NARROW, THEY DO NOT WIDEN. `hc_safe_prefixes` carries a
# stack-neutral base set — the commands an unattended run may take without a
# prompt — plus whatever the adopter configured under `commands.*` and, while
# `phases.parity` is true, `parity.toolchainCommands`. Most of the base set is
# read-only, but not all of it: `git add`, `git stash`, `git fetch`,
# `git worktree` and `mkdir -p` mutate, and `sed` / `find` admit `-i` and
# `-delete` / `-exec` because matching is on leading words only (see
# `allow-safe-compounds.sh`'s header). They are carried from the source
# deliberately — an unattended run stages, stashes and fetches — but do not read
# the set as "safe because read-only" when judging an addition: the one class of
# form no entry may vouch for, however it matches, is `hc_piece_is_never_safe`'s.
# The interpreter, package-manager and SDK command names that were literals in
# the source implementation's list are not in this base set; an adopter who uses
# them gets them back by configuring them. Relative to the source list this is
# strictly fewer allowances, which is the safe direction to be wrong in.
#
# FILE DISCIPLINE. Sourced, never executed (mode 0644; the shebang above is a
# dialect marker for editors and linters). No `set -e` and no `set -u` — a
# sourced library must not change its caller's shell — but every parameter
# expansion here is defaulted, so it is safe to source into a caller that sets
# both. No top-level side effects, no exiting, no writes, no diagnostics on
# stdout: every reader is silent on failure and signals through its return
# status, because callers capture stdout. Every function is prefixed `hc_`; the
# names it touches outside that prefix are all `HC_`-prefixed variables, and
# they exist to return a value WITHOUT a command substitution — a `$(…)` forks a
# subshell, and these run per piece on a hook that fires for every Bash call:
# `HC_GIT_DIR` / `HC_GIT_REST` (`hc_git_piece_parts`), `HC_PAYLOAD_CMD` /
# `HC_PAYLOAD_CWD` (`hc_payload_fields`), and the cache's own `HC_CFG_*`.
#
# BASH 3.2 IS THE FLOOR. macOS ships `/bin/bash` 3.2, so nothing here may use an
# associative array, `${var^^}`, `mapfile` or `local -n`. The cache below is a
# string-record store for exactly that reason.
#
# JQ 1.5 IS THE FLOOR, and it is a HARDER floor than an absent `jq`. Every reader
# outside the cache uses only `jq -r <filter>` and `jq -e 'type == "object"'`,
# which any `jq` runs; `hc_config_load`'s program does not, and the five
# constructs that set the floor are all jq 1.5 additions: `input` / `inputs`
# (the multi-document refusal), `@tsv` (the record format), `try … catch`,
# `error("…")` and the `def s($k; $v)` value-parameter form. On an older `jq` the
# program is a COMPILE error, so the load fails and every cached-key read returns
# 1 — which is the unresolvable-configuration path, not the quiet absent-`jq`
# path. Measured against a `jq` stand-in that is on `PATH` and runs every other
# program but rejects those constructs with a compile error: an ORDINARY push to
# a NON-protected branch is `deny`ed by
# `autonomous-protected-branch-guard.sh`, `git-commit-branch-guard.sh` answers
# `ask`, and the other four go SILENT — while `command -v jq`, the diagnostic
# `README.md` §Prerequisites tells an adopter to run, succeeds and says nothing.
# If you add a construct here, check it against 1.5 or raise this floor in both
# places.
#
# REPRO — reproduce any decision by hand, without a hook payload:
#
#   . <plugin>/hooks/lib/harness-config-lib.sh
#   root=$(git -C <dir> rev-parse --show-toplevel)
#
#   adopted + valid    hc_protected_patterns "$root"
#                      hc_branch_is_protected "$root" "$(hc_current_branch "$root")"; echo $?
#                      -> the resolved set, then 0 or 1
#   adopted + broken   printf 'x' > "$root/harness.config.json"
#                      hc_branch_is_protected "$root" main; echo $?      -> 2
#   not adopted        mv "$root/harness.config.json" "$root/../saved.json"
#                      hc_config_file "$root"; echo $?                   -> 1, prints nothing
#
#   from a payload     cmd=$(hc_payload_command "$payload")
#                      root=$(hc_resolve_repo_root "$cmd" "$(hc_payload_cwd "$payload")")

# ---------------------------------------------------------------------------
# Payload readers. Each takes the raw hook payload as its argument and prints
# the requested field; each returns 1 (printing nothing) when `jq` is absent,
# the payload does not parse, or the field is absent or empty. A guard that
# cannot parse its payload has no command to judge and exits 0 silently.
# ---------------------------------------------------------------------------

hc_have_jq() {
  command -v jq >/dev/null 2>&1
}

hc_payload_field() {
  local payload="${1-}" filter="${2-}" out
  [ -n "$payload" ] && [ -n "$filter" ] || return 1
  hc_have_jq || return 1
  out=$(printf '%s' "$payload" | jq -r "$filter" 2>/dev/null) || return 1
  [ -n "$out" ] || return 1
  printf '%s\n' "$out"
}

hc_payload_command() {
  hc_payload_field "${1-}" '.tool_input.command // empty'
}

hc_payload_cwd() {
  hc_payload_field "${1-}" '.cwd // empty'
}

# BOTH fields in ONE `jq`, for the six guards that need both: sets
# `HC_PAYLOAD_CMD` and `HC_PAYLOAD_CWD` and returns 1 (both empty) when `jq` is
# absent, the payload does not parse, or `.tool_input.command` is absent or
# empty — the same "no command to judge" contract `hc_payload_command` has, so a
# caller keeps its `|| exit 0`. `HC_PAYLOAD_CWD` may be empty on a return of 0:
# an absent `.cwd` is not a failure, it just means the caller falls back to
# `$PWD`, which is what `cwd=$(hc_payload_cwd …) || cwd=""` did.
#
# WHY IT EXISTS: two readers meant two `jq` forks — ~5 ms — on every Bash call
# in every session the plugin is enabled for. The single-field readers above stay
# for callers that genuinely need one field.
#
# THE WIRE FORMAT IS `.cwd` AS JSON ON LINE 1, THE COMMAND RAW AFTER IT. The
# command routinely carries newlines and backslashes (a compound separated by
# newlines, a wrapped argument list), so it CANNOT be the escaped field — it is
# emitted last and taken verbatim, exactly as `jq -r` would have printed it on
# its own. `.cwd` is emitted as a JSON string literal instead, which is
# single-line by construction whatever it contains, so line 1 can never be
# confused with the command's first line. An ordinary directory carries no
# backslash and its literal is peeled with two parameter expansions; a `cwd`
# whose JSON literal DOES carry an escape falls back to the single-field reader
# rather than being decoded here, so no hand-written unescaper stands between a
# payload and a jurisdiction decision.
hc_payload_fields() {
  local payload="${1-}" out cwd_json
  HC_PAYLOAD_CMD=""
  HC_PAYLOAD_CWD=""
  [ -n "$payload" ] || return 1
  hc_have_jq || return 1
  out=$(printf '%s' "$payload" | jq -r '(.cwd // "" | tojson), (.tool_input.command // "")' 2>/dev/null) || return 1

  # No newline at all means jq printed one line only, which cannot happen for a
  # parsed object (it always prints both) — treat it as no command to judge.
  case "$out" in
    *"
"*) ;;
    *) return 1 ;;
  esac
  cwd_json=${out%%"
"*}
  HC_PAYLOAD_CMD=${out#*"
"}
  [ -n "$HC_PAYLOAD_CMD" ] || return 1

  case "$cwd_json" in
    '""')
      HC_PAYLOAD_CWD="" ;;
    *\\*)
      # An escape in the literal, or a `.cwd` that is not a string at all: hand
      # the field back to the single-field reader, which is `jq -r` and so is
      # right by definition. One extra fork, on a payload shape that does not
      # occur in practice.
      HC_PAYLOAD_CWD=$(hc_payload_cwd "$payload") || HC_PAYLOAD_CWD="" ;;
    '"'*'"')
      HC_PAYLOAD_CWD=${cwd_json#\"}
      HC_PAYLOAD_CWD=${HC_PAYLOAD_CWD%\"} ;;
    *)
      HC_PAYLOAD_CWD=$(hc_payload_cwd "$payload") || HC_PAYLOAD_CWD="" ;;
  esac
  return 0
}

# ---------------------------------------------------------------------------
# Command parsing. Both parsers are lifted from the source guards so that every
# guard splits a compound into the same pieces and reads `git`'s global options
# the same way; a guard that split differently would judge a different command
# than its neighbour on the same input.
# ---------------------------------------------------------------------------

# BOTH PARSERS ARE PURE PARAMETER EXPANSION, AND THAT IS A COST FIX WITH A
# SECOND, SAFETY HALF. They were `printf | sed` pipelines carried over from the
# source guards, and the port made that expensive in a way the source never was:
# the source resolved no repository, while `hc_repo_dir_from_command` walks the
# split TWICE, so one decision cost `2 + 3N` sed forks for an N-piece compound —
# 27 of them on an 8-piece command, on a hook that fires for every Bash call.
# Same shape of justification as `hc_torn_substitution`'s backtick count below:
# measured, differentially tested, and not to be "simplified" back into a fork.
#
# THE SPLIT IS QUADRATIC, WHICH IS RECORDED HERE BECAUSE IT IS A REAL CEILING.
# `hc_split_command` rescans the whole remainder once per separator per piece, so
# it costs O(pieces × length): measured on bash 3.2, 0.4 ms at 8 pieces / 212 B,
# 29 ms at 128 pieces / 4 KB and 414 ms at 512 pieces / 16 KB, and a decision
# pays it three times because `hc_repo_dir_from_command` walks the split twice.
# It is still the right trade at every ordinary size — end to end,
# `allow-safe-compounds.sh` on the reference fixture is 133 → 64 ms at 8 pieces,
# 950 → 518 ms at 128 and 3.6 → 2.8 s at 512 against the `sed` form this
# replaced, because the per-piece fork it removes costs more than the rescan
# adds. The crossover is around a THOUSAND pieces (1,024 pieces / 33 KB measured
# 7.3 s for the fork form against 8.0 s here), which no Bash tool call reaches;
# a caller that does should split once and pass the pieces, not restore the fork.
#
# THE SAFETY HALF, WHICH IS THE PART TO KEEP IN MIND BEFORE REVERTING EITHER. If
# `hc_split_command` produces NOTHING, BOTH allow-only guards' piece loops run
# zero unsafe-piece tests and fall straight through to `allow` — fault-injected,
# every refusal in the guard-verification composition matrix becomes an allow. A
# pipeline can produce nothing for reasons that have nothing to do with the
# command's meaning — BSD `sed` aborts with "illegal byte sequence" on input its
# locale cannot decode — whereas parameter expansion cannot fail, needs no
# locale, and emits at least one line for every non-empty command.

# THE EARLIEST-SEPARATOR SCAN OF A BARE `&` IS THE ONE PART THAT IS NOT A SINGLE
# EXPANSION. `${rest%%&*}` finds the first `&`, which is often a redirection and
# not a separator at all, so `hc_bare_amp_head` walks the `&` occurrences until
# it finds one that separates. It costs O(length) per `&` in the remainder — the
# same order as the rescan above, and it is skipped entirely on a remainder that
# carries no `&`.

# The head before the EARLIEST bare `&` that is a statement separator, into
# `HC_BARE_AMP_HEAD`; returns 1 when the string carries no such `&`.
#
# WHICH `&` SEPARATES. `&` backgrounds the statement to its left and puts the
# next word at a COMMAND POSITION, so a piece read up to the `&` says nothing
# about what follows it. Three spellings are NOT that operator, and treating
# them as separators would tear an ordinary redirection into fragments that
# match no prefix and cost a legitimate allow:
#
#   `&&`          the second `&` of the AND operator — `hc_split_command` has
#                 its own arm for it, and the tie at the shared offset goes to
#                 the longer operator there
#   `&>`, `&>>`   a redirection of both streams: the `&` binds to the `>`
#   `>&`, `<&`    a descriptor duplication — `2>&1`, `>&2`, `<&3`
#
# Everything else separates, bash's `|&` included: its `&` ends the left-hand
# statement just as `|` does, and splitting there only ever ADDS a piece to be
# judged. The scan reads no quoting, exactly as the separators around it do not
# — see `hc_split_command`.
HC_BARE_AMP_HEAD=""
hc_bare_amp_head() {
  local rest="${1-}" seen="" pre after nextchar prevchar
  while :; do
    case "$rest" in
      *'&'*) ;;
      *) return 1 ;;
    esac
    pre=${rest%%&*}
    after=${rest#*&}
    nextchar=${after%"${after#?}"}
    seen="$seen$pre"
    prevchar=${seen#"${seen%?}"}
    if [ "$nextchar" = '&' ]; then
      seen="$seen&&"
      rest=${after#?}
      continue
    fi
    if [ "$nextchar" = '>' ]; then
      seen="$seen&"
      rest="$after"
      continue
    fi
    case "$prevchar" in
      '>'|'<')
        seen="$seen&"
        rest="$after"
        continue
        ;;
    esac
    HC_BARE_AMP_HEAD="$seen"
    return 0
  done
}

# One compound piece per line, split on `&&`, `||`, `;` and a BARE `&` —
# whichever occurs EARLIEST, repeatedly, which is what the two-pass
# `s/(&&|\|\|)/\n/g; s/;/\n/g` amounted to plus the separator that pass never
# had. `&&` and a bare `&` are the only two that can begin at the SAME position,
# and that tie goes to the LONGER operator: `&&` is tested first and the
# incumbent is kept on an equal head length, so `a && b` is one separator and
# never two.
#
# WHY THE BARE `&` IS HERE AT ALL. It is a statement separator in every POSIX
# shell, not a modifier, so without it `git status && ls & rm -r-f <dir>` was ONE
# piece judged on `git status`, and every allow-only guard that calls this vouched
# for the whole line — the `rm` included, and a `git branch -D` too, which
# `hc_piece_is_never_safe` is supposed to make unreachable from any of them.
# `hc_bare_amp_head` above carries which `&` separates and which three spellings
# do not.
#
# QUOTING IS NOT READ, FOR THIS SEPARATOR OR ANY OTHER, AND THAT IS THE
# FAIL-CLOSED DIRECTION. `git commit -m "a & b"` splits mid-message exactly as
# `"a ; b"` already did; the trailing fragment matches no safe prefix, so the
# command costs a prompt instead of an allow. A quote-aware split would be the
# opposite trade — it would hand back an allow on text this cannot read — so the
# price is one spelling: keep a separator byte out of a quoted argument.
#
# Backslash line continuations are joined first, so a wrapped argument list stays
# one piece. Callers capture this with `$(…)`, which strips the trailing newline,
# so emitting one after the final piece is not a difference they can observe.
hc_split_command() {
  local cmd="${1-}" nl joined rest sep head best besthead bestlen len
  [ -n "$cmd" ] || return 1
  nl='
'
  joined=${cmd//\\$nl/}
  rest="$joined"
  while :; do
    best=""
    besthead=""
    bestlen=-1
    for sep in '&&' '||' ';'; do
      case "$rest" in
        *"$sep"*)
          head=${rest%%"$sep"*}
          len=${#head}
          if [ "$bestlen" -lt 0 ] || [ "$len" -lt "$bestlen" ]; then
            bestlen="$len"
            best="$sep"
            besthead="$head"
          fi
          ;;
      esac
    done
    # Strictly `-lt`, so a bare `&` at the same offset as an `&&` loses to it.
    if hc_bare_amp_head "$rest"; then
      len=${#HC_BARE_AMP_HEAD}
      if [ "$bestlen" -lt 0 ] || [ "$len" -lt "$bestlen" ]; then
        bestlen="$len"
        best='&'
        besthead="$HC_BARE_AMP_HEAD"
      fi
    fi
    [ -n "$best" ] || break
    # `besthead` is carried from the winning arm rather than recomputed: for a
    # bare `&` the first occurrence in `rest` may be a redirection, so
    # `${rest%%&*}` would cut in the wrong place.
    printf '%s\n' "$besthead"
    rest=${rest#"$besthead$best"}
  done
  printf '%s\n' "$rest"
}

# Trim surrounding whitespace and peel off subshell grouping parens, so a piece
# written `(<cmd> arg)` is matched on its inner command rather than on `(<cmd>`.
#
# THE ORDER IS THE SED PROGRAM'S ORDER AND IT MATTERS: trim, then peel a LEADING
# RUN of `(` plus the whitespace behind it, then peel a TRAILING RUN of `)` plus
# the whitespace in front of it. The trailing whitespace is only eaten when a `)`
# was actually peeled, because the `+` in `s/[[:space:]]*\)+$//` required one.
hc_clean_piece() {
  local s="${1-}" rest line out="" first=1
  # `sed` applies its program PER LINE. No caller can reach this with a
  # multi-line argument — every one of them reads a single line out of
  # `hc_split_command` — but the equivalence is cheaper to keep than to argue,
  # and this arm costs one `case` test on the single-line path.
  case "$s" in
    *"
"*)
      rest="$s"
      while :; do
        case "$rest" in
          *"
"*) line=${rest%%"
"*}; rest=${rest#*"
"} ;;
          *) line="$rest"; rest="" ;;
        esac
        hc_clean_piece_line "$line"
        if [ "$first" -eq 1 ]; then
          out="$HC_CLEAN_LINE"
          first=0
        else
          out="$out
$HC_CLEAN_LINE"
        fi
        [ -n "$rest" ] || break
      done
      printf '%s\n' "$out"
      return 0 ;;
  esac
  hc_clean_piece_line "$s"
  printf '%s\n' "$HC_CLEAN_LINE"
}

# One line of the above, into `HC_CLEAN_LINE`.
hc_clean_piece_line() {
  local s="${1-}"
  s=${s#"${s%%[![:space:]]*}"}
  s=${s%"${s##*[![:space:]]}"}
  while :; do
    case "$s" in
      '('*) s=${s#\(} ;;
      *) break ;;
    esac
  done
  s=${s#"${s%%[![:space:]]*}"}
  case "$s" in
    *')')
      while :; do
        case "$s" in
          *')') s=${s%\)} ;;
          *) break ;;
        esac
      done
      s=${s%"${s##*[![:space:]]}"}
      ;;
  esac
  HC_CLEAN_LINE="$s"
}

# True when the RAW piece carries a command substitution that never CLOSES
# inside it — i.e. the piece is a FRAGMENT of one `hc_split_command` tore apart
# on a separator inside `$(…)` / `` `…` ``. `echo $(rm -rf <dir>` matches the
# `echo` safe prefix while actually running the `rm`, and a fragment's leading
# words say nothing about what it runs, so a caller must refuse to vouch for it.
#
# Call this on the RAW piece, BEFORE `hc_clean_piece`: cleaning peels a
# legitimate trailing `)`, which would turn the balanced `cat f || echo $(date)`
# into the fragment-shaped `echo $(date`.
#
# This tracks `$(` NESTING DEPTH and deliberately IGNORES a `)` seen at depth 0.
# Both halves of that sentence are load-bearing:
#
#   * Ignoring the depth-0 `)` is what keeps an ordinary parenthesis harmless.
#     A count does not work in either direction: an equality test refuses
#     `sed -E "s/(a|b)/x/" f.txt` (zero `$(`, one `)`) and stalls an unattended
#     run on a prompt it cannot answer, while a "more opens than closes" test is
#     offset by a regex group's `)` — `sed "s/(a)(b)/x/" $(rm -rf <dir>` counts
#     one open against two closes and reads as balanced.
#   * Tracking depth is what catches a NESTED, CLOSED substitution inside the
#     torn one. A "does the last `$(` have a `)` after it" substring test reads
#     `echo $(rm -rf <dir> $(date)` as untorn, because the inner `$(date)`
#     supplies the `)`; depth-tracking leaves depth 1 and refuses it.
#
# The `head=${rest%%[\$\)]*}` line skips the run of characters before the next
# `$` or `)` instead of shifting one character at a time. That is a cost fix,
# not a semantic one — the two forms agree on every input tested — but the
# difference is large: shifting one character at a time is quadratic and costs
# ~1.4 s on a 7 KB piece against ~14 ms here, on a hook that runs for every
# Bash call. Do not "simplify" the skip away.
#
# An odd number of backticks is the same fragment shape for the older
# substitution form; counting is the only test available for it. That count is
# pure parameter expansion — delete every backtick, take the length difference —
# and deliberately NOT `printf | grep -o | wc -l`, which forked two processes
# per piece whether or not a backtick was present, on a hook that runs for every
# Bash call. Same shape of justification as the skip note above: measured here
# (bash 3.2, 200 iterations, an ordinary 117-character piece) the whole function
# costs ~70 us against ~1,980 us for the fork form, and the two forms agreed on
# every input of a differential run of 8,772 cases — randomized strings over the
# `$`/`(`/`)`/backtick/quote alphabet plus curated edge cases (empty, lone
# backtick, even and odd counts, backticks inside `$(...)`, escaped backticks,
# 7 KB pieces), under LC_ALL=C and a UTF-8 locale.
#
# Do NOT "clarify" the count into the character-class spelling
# `${piece//[!\`]/}`. It returns the same answer and reads more directly, but it
# is quadratic on this bash: measured 14.9 s on a 7 KB piece, against 2.6 ms for
# the fork it would be replacing and 0.6 ms for the length-difference form used
# here. The cheap form is the one that deletes the RARE character.
#
# TWO COSTS, both an allow and never a wrong allow (the command simply falls
# back to the normal permission flow): a piece carrying a lone LITERAL backtick
# is refused by the backtick leg, and a piece carrying a literal `$(` inside
# quotes — `grep '$(' f.txt` — is refused by the depth leg.
hc_torn_substitution() {
  local piece="${1-}" rest head depth stripped
  rest="$piece"; depth=0
  while :; do
    head=${rest%%[\$\)]*}
    [ "$head" = "$rest" ] && break
    rest=${rest#"$head"}
    case "$rest" in
      '$('*) depth=$((depth + 1)); rest=${rest#??} ;;
      ')'*)  [ "$depth" -gt 0 ] && depth=$((depth - 1)); rest=${rest#?} ;;
      *)     rest=${rest#?} ;;
    esac
  done
  if [ "$depth" -gt 0 ]; then
    return 0
  fi
  stripped=${piece//\`/}
  [ $(( (${#piece} - ${#stripped}) % 2 )) -ne 0 ]
}

# Strip one layer of matching surrounding single or double quotes.
hc_strip_quotes() {
  local s="${1-}"
  s=${s%\"}; s=${s#\"}
  s=${s%\'}; s=${s#\'}
  printf '%s\n' "$s"
}

# For a piece whose own command word is `git`: set HC_GIT_DIR to the `-C`
# argument (empty when there is none) and HC_GIT_REST to the remainder starting
# at the subcommand, then return 0. Return 1 and clear both when the piece is
# not a git command — which is what keeps `echo "git commit"` and a wrapper
# script named on the command line out of every guard's scope.
#
# The walker steps over git's global options to reach the subcommand, in BOTH
# spellings git accepts: the `=` form (`--git-dir=<dir>`), and the form that takes
# the NEXT WORD — `-C <dir>`, `-c <k>=<v>`, `--git-dir`, `--work-tree`,
# `--namespace`, `--attr-source`, `--config-env`, `--super-prefix`,
# `--shallow-file`. That word-taking set is ENUMERATED and every other option is
# assumed to take none, because consuming a word that was in fact the subcommand
# would HIDE it — a missed refusal in the deny-capable guard, the one direction it
# must never be wrong in. DERIVE THE LIST FROM git's own `handle_options`, NOT FROM
# `git --help`: the usage block prints neither `--shallow-file` nor `--attr-source`,
# and deriving from it is what left `--shallow-file` out until it was measured
# SILENT. An argument-taking global option absent from `handle_options`, or added by
# a later git, hides the subcommand behind it. `--super-prefix` is listed for the
# gits that still accept it; one that does not (2.50.1, measured) rejects the whole
# command, so consuming its word decides nothing. `docs/guard-verification.md`
# §3.2's T22–T27 carry the rows. A `-C` argument is de-quoted but NEVER
# evaluated: a directory written as a shell substitution is passed through
# literally, so it fails to resolve rather than silently resolving to something
# this library did not read.
hc_git_piece_parts() {
  local p="${1-}" rest dir
  HC_GIT_DIR=""
  HC_GIT_REST=""
  case "$p" in
    git\ *) ;;
    *) return 1 ;;
  esac

  rest=${p#git }
  dir=""

  while :; do
    case "$rest" in
      -C\ *)
        rest=${rest#-C }
        dir=${rest%% *}
        dir=$(hc_strip_quotes "$dir")
        case "$rest" in *\ *) rest=${rest#* } ;; *) rest="" ;; esac
        ;;
      -c\ *)
        rest=${rest#-c }
        case "$rest" in *\ *) rest=${rest#* } ;; *) rest="" ;; esac
        ;;
      --git-dir\ *|--work-tree\ *|--namespace\ *|--attr-source\ *|--config-env\ *|--super-prefix\ *|--shallow-file\ *)
        rest=${rest#* }
        case "$rest" in *\ *) rest=${rest#* } ;; *) rest="" ;; esac
        ;;
      --git-dir=*\ *|--work-tree=*\ *|--namespace=*\ *|-*\ *)
        rest=${rest#* }
        ;;
      *) break ;;
    esac
  done

  HC_GIT_DIR="$dir"
  HC_GIT_REST="$rest"
  return 0
}

# ---------------------------------------------------------------------------
# Repository resolution — the first `git -C <dir>`, else the first leading
# `cd <dir>`, else the payload's own `.cwd`, else `$PWD`.
# ---------------------------------------------------------------------------

# Print the directory the command itself names, or return 1 when it names none.
hc_repo_dir_from_command() {
  local cmd="${1-}" piece p d
  [ -n "$cmd" ] || return 1

  while IFS= read -r piece; do
    p=$(hc_clean_piece "$piece")
    if hc_git_piece_parts "$p" && [ -n "$HC_GIT_DIR" ]; then
      printf '%s\n' "$HC_GIT_DIR"
      return 0
    fi
  done <<EOF
$(hc_split_command "$cmd")
EOF

  while IFS= read -r piece; do
    p=$(hc_clean_piece "$piece")
    case "$p" in
      cd\ *)
        d=${p#cd }
        d=${d%% *}
        d=$(hc_strip_quotes "$d")
        if [ -n "$d" ]; then
          printf '%s\n' "$d"
          return 0
        fi
        ;;
    esac
  done <<EOF
$(hc_split_command "$cmd")
EOF

  return 1
}

# Print the work-tree root of the repository containing <dir>; return 1 when
# <dir> is not inside one.
hc_repo_root() {
  local dir="${1-}" top
  [ -n "$dir" ] || return 1
  top=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || return 1
  [ -n "$top" ] || return 1
  printf '%s\n' "$top"
}

# Apply the settled order to a command plus the payload's cwd, and print the
# resolved repository root; return 1 when the chosen anchor is not in a
# repository. The order picks ONE anchor — it does not fall through to the next
# candidate when the chosen one fails to resolve, because falling through would
# silently judge a different repository than the command named. A relative
# anchor is joined to the payload cwd (else `$PWD`).
hc_resolve_repo_root() {
  local cmd="${1-}" payload_cwd="${2-}" base anchor
  base="$payload_cwd"
  [ -n "$base" ] || base="${PWD-}"

  anchor=$(hc_repo_dir_from_command "$cmd") || anchor=""
  [ -n "$anchor" ] || anchor="$base"
  [ -n "$anchor" ] || return 1

  case "$anchor" in
    /*) ;;
    *) [ -n "$base" ] || return 1; anchor="$base/$anchor" ;;
  esac

  hc_repo_root "$anchor"
}

# ---------------------------------------------------------------------------
# Config readers. Every one is silent on failure — no diagnostics on stdout,
# ever, because callers capture stdout.
# ---------------------------------------------------------------------------

# Set `HC_CFG_FILE` to the config path and return 0 when the repository has
# adopted the harness; return 1 (clearing it) when it has not. The variable form
# exists so the readers below can run the jurisdiction test WITHOUT a `$(…)`
# subshell — every one of them calls it, on a hook that fires per Bash call.
hc_config_file_var() {
  local root="${1-}" f
  HC_CFG_FILE=""
  [ -n "$root" ] || return 1
  f="$root/harness.config.json"
  [ -f "$f" ] && [ -r "$f" ] || return 1
  HC_CFG_FILE="$f"
  return 0
}

# Print the config path when the repository has adopted the harness; return 1
# (printing nothing) when it has not. This is the jurisdiction test.
hc_config_file() {
  hc_config_file_var "${1-}" || return 1
  printf '%s\n' "$HC_CFG_FILE"
}

# ---------------------------------------------------------------------------
# THE PER-PROCESS CONFIGURATION CACHE — one `jq` per process, not one per key.
#
# WHY. Every reader used to re-open and re-parse `harness.config.json`, so a
# single `allow-safe-compounds.sh` decision on a two-piece compound cost 18 `jq`
# forks (7 in `hc_safe_prefixes`, 8 in `hc_path_anchored_patterns` — five of them
# re-reading the same `commands.*` keys `hc_safe_prefixes` had just read — 2 for
# the payload and 1 to emit the answer) and ~87 ms on the reference fixture —
# the uncached baseline, which a reader reproduces by calling the readers with
# `hc_config_reset` between them. These hooks run on EVERY Bash call in every
# session the plugin is enabled for, so that is a per-tool-call tax an adopter pays
# whether or not the guard has anything to say.
#
# WHAT IT DOES. `hc_config_load` runs ONE `jq` that emits every key this library
# reads, and holds the result in shell variables for the life of the process.
# Guards are one-shot processes, so "the life of the process" is one decision:
# nothing is written to disk, and the cache dies with the answer it served.
#
# THE ONE STALENESS BOUNDARY, STATED PLAINLY. The entry is keyed by ROOT, not by
# the file's contents: a caller that REWRITES `harness.config.json` in place and
# reads again WITHIN THE SAME PROCESS is answered from the document it replaced.
# No shipped caller does that — every guard is one process per decision and the
# two QA helpers read the configuration once — and detecting it would cost a
# `stat` fork on every read, which is the tax this cache exists to remove. A
# long-lived caller that does rewrite the file (a test driver, a sourced
# interactive shell) calls `hc_config_reset` between documents.
#
# IT IS KEYED BY ROOT, and a second root REPLACES the entry rather than being
# answered from the first. A guard only ever judges one root per invocation, so a
# single entry is enough; the key is there so a future multi-root caller gets a
# reload instead of silently getting the wrong repository's answer.
#
# A CALLER MUST WARM IT IN ITS OWN SHELL — the one thing a guard has to do. A
# `$(…)` runs in a SUBSHELL, which inherits the cache but cannot write one back,
# so `safe=$(hc_safe_prefixes "$top")` followed by
# `arms=$(hc_path_anchored_patterns "$top")` loads the document TWICE and leaves
# the parent's cache still empty. Measured on the reference fixture, a guard that
# reads its configuration only through command substitutions pays 7 `jq` forks
# where 3 is the floor. Every guard therefore calls
#
#     hc_config_load "$top" || :
#
# once, unsubstituted, right after its jurisdiction test — the `|| :` because the
# warm-up must not decide anything: it is not a check, and each reader below
# re-tests `hc_have_jq`, the file and the parse for itself. A new guard that
# forgets the line is slower and still correct, which is the right direction for
# an optimization to fail in.
#
# WHAT IS *NOT* CACHED, DELIBERATELY:
#   * `hc_have_jq` — re-tested by every reader, so an absent `jq` still returns 1
#     from all of them however warm the cache is.
#   * `hc_config_file_var` — re-tested by every reader, so a config that goes
#     away mid-process still reads as "no jurisdiction".
#   * Any filter NOT in `HC_CFG_KEYS` / `HC_CFG_LIST_KEYS` below — `hc_get` and
#     `hc_get_list` fall through to a live `jq` for it, so the cache narrows the
#     COST of the shipped call sites without narrowing what a caller may ask.
#   * A memo THIS PROCESS DID NOT WRITE. `HC_CFG_*` are ordinary shell variables,
#     and a hook inherits the EXPORTED variables of whatever spawned it, so an
#     inherited `HC_CFG_ROOT`/`HC_CFG_SCALARS`/`HC_CFG_LISTS` would otherwise be
#     read as this repository's configuration and the file on disk never opened
#     — an environment that dictates `defaultBranch` and `protectedBranches`
#     turns the deny at the top of this file into silence. `hc_config_load`
#     therefore stamps the memo with `$$` and reuses it only when the stamp is
#     its own. `$$` is the SHELL's pid and is unchanged inside `$(…)` and `( )`,
#     so the inherit-into-a-subshell property the warm-up rests on is untouched,
#     while an inherited memo can only match if the exporter IS the process
#     being launched rather than an ancestor of it — an environment inherited
#     across a spawn cannot know the pid it will land in. State the boundary that
#     way rather than as unpredictability alone: a shell that sets `HC_CFG_*` and
#     then `exec`s the guard keeps its own pid and the memo IS honoured
#     (reproduced: `… | HC_CFG_ROOT=<R> HC_CFG_STATE=ok HC_CFG_SCALARS=<record>
#     bash -c 'export HC_CFG_PID=$$; exec /bin/bash "$0"' <guard>` turns SILENT
#     into `allow`). That is outside the threat model — it requires BEING the
#     process that launches the hook, which already owns the decision — and it is
#     not the ordinary spawn the stamp defends against, where a guessed pid does
#     not hit. Do not drop the stamp to "simplify" the
#     memo test; a poisoned `HC_CFG_SCALARS` is a configuration this repository
#     never wrote.
#
# THE FAILURE CONTRACT IS THE POINT, AND IT IS UNCHANGED EXCEPT WHERE IT IS
# STRICTER. A load fails — leaving every cached-key read returning 1 — on exactly
# the conditions a per-key `jq` failed on: the file is missing or unreadable, the
# document is not valid JSON, or it does not parse as an OBJECT. One condition is
# ADDED: a file holding MORE THAN ONE JSON document (a `jq` stream, which is not
# a valid `.json` file and which the schema cannot describe) fails too. Per-key
# `jq -r` applied the filter to every document and printed one line each, so
# `.defaultBranch` came back as a two-line value and the protected set silently
# became the union of both documents — while a whole-document read would take its
# scalars from the first document and its lists from both. Neither answer is
# defensible, and "refuse and fall back to the normal permission flow" is the
# only one of the three that cannot widen anything. Inside a valid object, a key
# whose PARENT
# has the wrong type (`"commands": "x"`) yields `null` for that key alone via
# `try … catch null`, which is what a per-key `jq -r '.commands["test"]'` did
# (it errored, and `hc_get` returned 1) — one key fails, not the document. A
# value of `null`, of the string `"null"` or of `""` is not emitted at all, so
# `hc_get` still returns 1 for it exactly as its `[ "$out" != "null" ]` test did.
#
# THE RECORD FORMAT. `jq` emits `<tag>\t<filter>\t<value>` per line through
# `@tsv`, which escapes the only four characters that could break the format
# (tab, newline, carriage return, backslash) and nothing else. Records are
# accumulated into two newline-delimited strings and looked up by parameter
# expansion on `\n<filter>\t`, which cannot false-match inside a value because a
# value carries no raw newline. `hc_tsv_unescape_var` reverses the escaping and
# runs at all only when the value carries a backslash.
# ---------------------------------------------------------------------------

# The filters served from the cache — set as variables rather than assigned at
# file scope, because sourcing this library must not touch the caller's shell.
# A filter outside these two lists is read live, so adding a call site with a new
# filter costs a fork but never a wrong answer; adding the filter here AND to the
# `jq` program in `hc_config_load` (the two must list the same keys) is the fix.
hc_cfg_key_sets_var() {
  HC_CFG_KEYS='|.projectName|.defaultBranch|.["appDir"]|.["stateDir"]|.["scriptsDir"]|.["githooksDir"]|.commands["typecheck"]|.commands["test"]|.commands["build"]|.commands["depInstall"]|.commands["devServer"]|.phases.parity|.phases.qa|.qa.credentialsPath|'
  HC_CFG_LIST_KEYS='|.protectedBranches[]?|.parity.toolchainCommands[]?|'
}

# Reverse `@tsv`'s escaping into `HC_CFG_VALUE`. Left-to-right, one backslash at
# a time, so `\\t` decodes to a literal backslash followed by `t` rather than to
# a tab. Returns immediately on the overwhelmingly common backslash-free value.
hc_tsv_unescape_var() {
  local s="${1-}" out="" head c
  HC_CFG_VALUE="$s"
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
      t) out="$out	" ;;
      n) out="$out
" ;;
      r) out="$out"$'\r' ;;
      \\) out="$out\\" ;;
      '') out="$out\\"; break ;;
      *) out="$out\\$c" ;;
    esac
    s=${s#?}
  done
  HC_CFG_VALUE="$out"
  return 0
}

# Drop the cache. See "THE ONE STALENESS BOUNDARY" above — no guard needs this,
# and a caller that rewrites the configuration mid-process does.
hc_config_reset() {
  HC_CFG_PID=""
  HC_CFG_ROOT=""
  HC_CFG_STATE=""
  HC_CFG_SCALARS=""
  HC_CFG_LISTS=""
  HC_CFG_FILE=""
  HC_CFG_VALUE=""
}

# Load (or reuse) the cached document for <root>. 0 = the document is present,
# parses, and is an object; 1 = it is not, and every cached-key read must fail.
hc_config_load() {
  local root="${1-}" out line tag rest nl
  hc_have_jq || return 1
  hc_config_file_var "$root" || return 1

  # The pid test is a security boundary, not a nicety — see "A memo THIS PROCESS
  # DID NOT WRITE" above. An inherited `HC_CFG_*` fails it and the file is read.
  if [ "${HC_CFG_PID-}" = "$$" ] && [ "${HC_CFG_ROOT-}" = "$root" ] && [ -n "${HC_CFG_STATE-}" ]; then
    [ "${HC_CFG_STATE-}" = "ok" ]
    return
  fi

  HC_CFG_PID=$$
  HC_CFG_ROOT="$root"
  HC_CFG_STATE="bad"
  HC_CFG_SCALARS=""
  HC_CFG_LISTS=""

  out=$(jq -n -r '
    def s($k; $v):
      if $v == null then empty
      else ($v | tostring) as $t
        | if $t == "" or $t == "null" then empty else ["S", $k, $t] | @tsv end
      end;
    def l($k; $v):
      if ($v | type) == "array" or ($v | type) == "object"
      then $v[] | ["L", $k, (if . == null then "null" else tostring end)] | @tsv
      else empty
      end;
    # `-n` plus `input` reads the FIRST document; counting what is left is what
    # refuses a multi-document file. Both errors exit non-zero, which is the
    # `|| return 1` below and so a failed load, not a partial one.
    input as $doc
    | (reduce inputs as $extra (0; . + 1)) as $rest
    | if $rest > 0 then error("more than one JSON document") else $doc end
    | if type != "object" then error("not an object") else . end
    | s(".projectName";              try .projectName            catch null),
      s(".defaultBranch";            try .defaultBranch          catch null),
      s(".[\"appDir\"]";             try .appDir                 catch null),
      s(".[\"stateDir\"]";           try .stateDir               catch null),
      s(".[\"scriptsDir\"]";         try .scriptsDir             catch null),
      s(".[\"githooksDir\"]";        try .githooksDir            catch null),
      s(".commands[\"typecheck\"]";  try .commands.typecheck     catch null),
      s(".commands[\"test\"]";       try .commands.test          catch null),
      s(".commands[\"build\"]";      try .commands.build         catch null),
      s(".commands[\"depInstall\"]"; try .commands.depInstall    catch null),
      s(".commands[\"devServer\"]";  try .commands.devServer     catch null),
      s(".phases.parity";            try .phases.parity          catch null),
      s(".phases.qa";                try .phases.qa              catch null),
      s(".qa.credentialsPath";       try .qa.credentialsPath     catch null),
      l(".protectedBranches[]?";     try .protectedBranches      catch null),
      l(".parity.toolchainCommands[]?"; try .parity.toolchainCommands catch null)
  ' "$HC_CFG_FILE" 2>/dev/null) || return 1

  nl="
"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    tag=${line%%	*}
    rest=${line#*	}
    case "$tag" in
      S) HC_CFG_SCALARS="$HC_CFG_SCALARS$nl$rest" ;;
      L) HC_CFG_LISTS="$HC_CFG_LISTS$nl$rest" ;;
    esac
  done <<EOF
$out
EOF
  HC_CFG_SCALARS="$HC_CFG_SCALARS$nl"
  HC_CFG_LISTS="$HC_CFG_LISTS$nl"
  HC_CFG_STATE="ok"
  return 0
}

# Set `HC_CFG_VALUE` to one cached scalar; return 1 when the key was not emitted
# (absent, `null`, `"null"` or empty — all of which `hc_get` reports as failure).
hc_cfg_scalar_var() {
  local key="${1-}" rest
  HC_CFG_VALUE=""
  rest=${HC_CFG_SCALARS-}
  case "$rest" in
    *"
$key	"*) ;;
    *) return 1 ;;
  esac
  rest=${rest#*"
$key	"}
  rest=${rest%%"
"*}
  hc_tsv_unescape_var "$rest"
  # `$(jq …)` stripped trailing newlines; a decoded value must too, so a caller
  # cannot tell the cached read from the live one.
  while [ -n "$HC_CFG_VALUE" ] && [ "${HC_CFG_VALUE%"
"}" != "$HC_CFG_VALUE" ]; do
    HC_CFG_VALUE=${HC_CFG_VALUE%"
"}
  done
  return 0
}

# Set `HC_CFG_VALUE` to the cached list elements, newline-joined in document
# order; return 1 when the key emitted no element at all.
hc_cfg_list_var() {
  local key="${1-}" rest item out="" first=1
  HC_CFG_VALUE=""
  rest=${HC_CFG_LISTS-}
  while :; do
    case "$rest" in
      *"
$key	"*) ;;
      *) break ;;
    esac
    rest=${rest#*"
$key	"}
    item=${rest%%"
"*}
    hc_tsv_unescape_var "$item"
    if [ "$first" -eq 1 ]; then
      out="$HC_CFG_VALUE"
      first=0
    else
      out="$out
$HC_CFG_VALUE"
    fi
  done
  [ "$first" -eq 0 ] || return 1
  while [ -n "$out" ] && [ "${out%"
"}" != "$out" ]; do
    out=${out%"
"}
  done
  HC_CFG_VALUE="$out"
  return 0
}

# 0 when the config exists, `jq` is available and the document parses as an
# object; 1 otherwise. Callers that must distinguish "no configuration" from
# "an absent key" test this before reading keys.
hc_config_readable() {
  hc_config_load "${1-}"
}

# Print a scalar value; return 1 on missing or unreadable or invalid config, an
# absent `jq`, or a null/empty result.
hc_get() {
  local root="${1-}" filter="${2-}" out
  [ -n "$filter" ] || return 1
  hc_config_file_var "$root" || return 1
  hc_have_jq || return 1
  hc_cfg_key_sets_var
  case "$HC_CFG_KEYS" in
    *"|$filter|"*)
      hc_config_load "$root" || return 1
      hc_cfg_scalar_var "$filter" || return 1
      [ -n "$HC_CFG_VALUE" ] || return 1
      printf '%s\n' "$HC_CFG_VALUE"
      return 0 ;;
  esac
  out=$(jq -r "$filter" "$HC_CFG_FILE" 2>/dev/null) || return 1
  [ -n "$out" ] && [ "$out" != "null" ] || return 1
  printf '%s\n' "$out"
}

# Print one array element per line; same failure contract as hc_get.
hc_get_list() {
  local root="${1-}" filter="${2-}" out
  [ -n "$filter" ] || return 1
  hc_config_file_var "$root" || return 1
  hc_have_jq || return 1
  hc_cfg_key_sets_var
  case "$HC_CFG_LIST_KEYS" in
    *"|$filter|"*)
      hc_config_load "$root" || return 1
      hc_cfg_list_var "$filter" || return 1
      [ -n "$HC_CFG_VALUE" ] || return 1
      printf '%s\n' "$HC_CFG_VALUE"
      return 0 ;;
  esac
  out=$(jq -r "$filter" "$HC_CFG_FILE" 2>/dev/null) || return 1
  [ -n "$out" ] || return 1
  printf '%s\n' "$out"
}

# Print the value of one repo-relative directory key — `scriptsDir`, `appDir`,
# `githooksDir`, `stateDir` — falling back to the supplied schema default.
# Trailing slashes are stripped so a caller can join with `/`; the value stays
# repo-relative, so joining it to the repository root is the caller's step.
hc_config_dir() {
  local root="${1-}" key="${2-}" default="${3-}" out
  [ -n "$key" ] || return 1
  out=$(hc_get "$root" ".[\"$key\"]") || out="$default"
  out=${out%/}
  [ -n "$out" ] || return 1
  printf '%s\n' "$out"
}

# ---------------------------------------------------------------------------
# The protected-branch trichotomy.
# ---------------------------------------------------------------------------

# Print the resolved protected set, one glob pattern per line: the configured
# list if present, else the schema default `main`, always plus `defaultBranch`.
# Return 1 (printing nothing) when the configuration cannot be read or the
# required `defaultBranch` is absent.
hc_protected_patterns() {
  local root="${1-}" default_branch list seen pattern
  hc_config_readable "$root" || return 1
  default_branch=$(hc_get "$root" '.defaultBranch') || return 1

  list=$(hc_get_list "$root" '.protectedBranches[]?') || list="main"

  seen=""
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

# 0 = protected, 1 = not protected, 2 = unresolvable. Patterns are matched as
# `case` globs. An empty branch — a detached HEAD, or a repository that could
# not be read — returns 2 rather than 1: there is nothing to judge, and 1 would
# read as a permit. What a detached HEAD *means* is the caller's decision, so a
# caller that wants to distinguish it asks `hc_current_branch` first.
hc_branch_is_protected() {
  local root="${1-}" branch="${2-}" patterns pattern
  patterns=$(hc_protected_patterns "$root") || return 2
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
# Workspace and prefix helpers.
# ---------------------------------------------------------------------------

# Print the checked-out branch; print nothing on a detached HEAD or when the
# path is not a repository. Always returns 0 — emptiness is the signal.
hc_current_branch() {
  local root="${1-}" branch
  [ -n "$root" ] || return 0
  branch=$(git -C "$root" symbolic-ref --short HEAD 2>/dev/null) || branch=""
  [ -n "$branch" ] && printf '%s\n' "$branch"
  return 0
}

# Print the configured `projectName`, falling back to the repository
# directory's own basename.
hc_project_name() {
  local root="${1-}" name
  [ -n "$root" ] || return 1
  name=$(hc_get "$root" '.projectName') || name="${root##*/}"
  [ -n "$name" ] || return 1
  printf '%s\n' "$name"
}

# Print the directory above the repository root — where sibling worktrees live.
hc_work_root() {
  local root="${1-}" parent
  [ -n "$root" ] || return 1
  root=${root%/}
  parent=${root%/*}
  [ -n "$parent" ] || parent="/"
  printf '%s\n' "$parent"
}

# 0 when <abs_path> is the repository root, inside it, or inside a sibling
# worktree named `<work_root>/<project_name>-*`; 1 otherwise. Matching is by
# `case` glob, so it never touches the filesystem and never depends on
# `nullglob` or on whether any sibling worktree exists yet.
hc_in_workspace() {
  local path="${1-}" root="${2-}" work name
  [ -n "$path" ] && [ -n "$root" ] || return 1
  root=${root%/}

  case "$path" in
    "$root"|"$root"/*) return 0 ;;
  esac

  work=$(hc_work_root "$root") || return 1
  name=$(hc_project_name "$root") || return 1
  work=${work%/}

  case "$path" in
    "$work"/"$name"-*) return 0 ;;
  esac
  return 1
}

# THE ONE PLACE THE `commands.*` KEY SET IS WRITTEN. `hc_safe_prefixes` vouches
# for each configured string and `hc_runner_words` takes each string's leading
# word, and both used to spell the five keys out for themselves — ten separate
# config reads for one decision, five of them re-reading what the other had just
# read. Both now take the list from here, so a key added to the schema reaches
# both callers; adding it to one of them only was the drift this removes. It
# sets a variable rather than printing because a `$(…)` would fork a subshell on
# a hook that fires for every Bash call.
hc_command_keys_var() {
  HC_CFG_COMMAND_KEYS='typecheck test build depInstall devServer'
}

# Print each configured `commands.*` string, one per line, skipping unconfigured
# keys. Same failure semantics as `hc_get`: an unreadable configuration prints
# nothing.
hc_command_strings() {
  local root="${1-}" key
  hc_command_keys_var
  for key in $HC_CFG_COMMAND_KEYS; do
    hc_get "$root" ".commands[\"$key\"]" || continue
  done
  return 0
}

# Print the leading word of each configured `commands.*` string, one per line,
# deduped — the adopter's package manager or task runner, so a piece written
# `<runner> --prefix <app dir>` can be recognised without naming any stack's
# tooling here. A configured command that is empty or starts with a path (a
# wrapper-script invocation) contributes nothing: its leading word is a path,
# and a path is already matched by the configured string itself in
# `hc_safe_prefixes`.
#
# It reads the cached document DIRECTLY rather than through `hc_get`, because
# `hc_get` prints and this needs a value: routing five values through five
# command substitutions costs five subshell forks on a hook that fires for every
# Bash call, and this function is itself called from inside a `$(…)` in two
# places.
hc_runner_words() {
  local root="${1-}" key first seen=""
  hc_have_jq || return 0
  hc_config_file_var "$root" || return 0
  hc_config_load "$root" || return 0
  hc_command_keys_var
  for key in $HC_CFG_COMMAND_KEYS; do
    hc_cfg_scalar_var ".commands[\"$key\"]" || continue
    first=${HC_CFG_VALUE%% *}
    case "$first" in
      ''|*/*) continue ;;
    esac
    case "$seen" in
      *"|$first|"*) continue ;;
    esac
    seen="$seen|$first|"
    printf '%s\n' "$first"
  done
  return 0
}

# ---------------------------------------------------------------------------
# Directory-scoped pieces: rewrite to the directory-free form, so the caller
# judges the SUBCOMMAND against the same set the bare spelling is judged
# against. All four allow-only guards need them, which is why they live here.
# ---------------------------------------------------------------------------

# For a piece whose command word is `git` and which carries an ABSOLUTE `-C <dir>`
# inside the workspace, print the equivalent directory-free form `git <rest>`, so a
# caller can judge it against `hc_safe_prefixes` exactly as it judges the bare
# spelling. Return 1 (printing nothing) when the piece is not a git command, carries
# no `-C`, carries a RELATIVE `-C` (this library never resolves one — see
# `hc_git_piece_parts`), carries a `..` segment, carries any character that is not an
# ordinary path character, or names a directory outside the workspace.
#
# WHY THIS REPLACED A `git -C <root> *` PATTERN. That arm matched on the DIRECTORY
# alone, so every subcommand rode along on it — `push`, `reset`, `checkout`,
# `clean`, `commit` — none of which is in `hc_safe_prefixes`, and each of which the
# generated permission profile deliberately keeps on `ask`. The point of the arms is
# that the DIRECTORY is the part that differs per checkout; the SUBCOMMAND is not,
# and it belongs under the same set either way.
hc_git_piece_in_workspace() {
  local piece="${1-}" root="${2-}" dir
  [ -n "$root" ] || return 1
  hc_git_piece_parts "$piece" || return 1
  dir="$HC_GIT_DIR"
  [ -n "$dir" ] || return 1
  case "$dir" in /*) ;; *) return 1 ;; esac
  # `hc_in_workspace` matches TEXTUALLY and never normalises, so a `..` segment
  # would otherwise walk out of the workspace while still matching `"$root"/*`.
  # The dropped arms were literal globs anchored on the root, which no `..` path
  # could match — this keeps that property.
  case "/$dir/" in */../*) return 1 ;; esac
  # Everything here is a TEXTUAL test on a string the shell has NOT expanded yet,
  # so any character that could introduce an expansion — `$`, a backtick, `~`, a
  # quote, a backslash, a brace, a glob character, whitespace — must not reach it:
  # `<root>/${x}../evil` and `<root>/$(:)../evil` carry no literal `/../` and no
  # quote, yet resolve outside the workspace. Accepting only ordinary path
  # characters closes that by construction rather than by listing spellings; a real
  # workspace directory carries nothing else, and a false refusal here costs one
  # prompt from an allow-only guard, never harm.
  case "$dir" in *[!A-Za-z0-9._/-]*) return 1 ;; esac
  hc_in_workspace "$dir" "$root" || return 1
  [ -n "$HC_GIT_REST" ] || return 1
  printf 'git %s\n' "$HC_GIT_REST"
}

# The same treatment for `<runner> --prefix <dir> <rest>`, where <runner> is one of
# `hc_runner_words` and <dir> is an ABSOLUTE path inside the workspace: print
# `<runner> <rest>` so the caller judges the SUBCOMMAND against `hc_safe_prefixes`.
# Return 1 when the piece is not that shape, the runner is not configured, the
# directory is relative, carries a `..` segment, carries any character that is not
# an ordinary path character, or is outside the workspace, or there is no
# subcommand at all (the bare `<runner> --prefix <dir>` form is still covered by its
# own exact arm).
#
# WHY: the dropped `<runner> --prefix <dir> *` arm wildcarded the entire command
# line after the directory. `npm` is in NO list of the generated permission profile,
# so `npm --prefix <app> install <pkg>` (which runs that package's install scripts)
# and `npm --prefix <app> exec -- <anything>` were granted inside a compound while
# being granted by nothing at all on their own.
hc_runner_piece_in_workspace() {
  local piece="${1-}" root="${2-}" word rest dir tail known=1 w
  [ -n "$root" ] || return 1
  word=${piece%% *}
  [ -n "$word" ] || return 1
  case "$piece" in
    "$word --prefix "*) ;;
    *) return 1 ;;
  esac
  rest=${piece#"$word --prefix "}
  dir=${rest%% *}
  case "$rest" in *\ *) tail=${rest#* } ;; *) return 1 ;; esac
  [ -n "$dir" ] && [ -n "$tail" ] || return 1
  dir=$(hc_strip_quotes "$dir")
  case "$dir" in /*) ;; *) return 1 ;; esac
  # Same reason as above: `hc_in_workspace` is a `case` glob that never
  # normalises, and `npm ci` in an attacker-named directory runs THAT
  # directory's `package.json` lifecycle scripts.
  case "/$dir/" in */../*) return 1 ;; esac
  # And the same accepted-character whitelist, for the same reason — it must sit
  # AFTER the `hc_strip_quotes` call above, so an ordinary fully-quoted directory
  # (`--prefix "<app>"`) has already had its outer pair removed and still passes.
  case "$dir" in *[!A-Za-z0-9._/-]*) return 1 ;; esac
  while IFS= read -r w; do
    [ -n "$w" ] || continue
    if [ "$w" = "$word" ]; then known=0; fi
  done <<EOF
$(hc_runner_words "$root")
EOF
  [ "$known" -eq 0 ] || return 1
  hc_in_workspace "$dir" "$root" || return 1
  printf '%s %s\n' "$word" "$tail"
}

# THE TWO REJECT LINES IN BOTH HELPERS ARE ONE UNIT, AND THE SECOND IS A
# WHITELIST ON PURPOSE. The first refuses a LITERAL `/../`. The second refuses
# every character a real workspace path never carries, which is the only
# formulation that closes the mechanism: the mechanism is not "quotes" and not
# "`..`", it is that a TEXTUAL test judges a string the shell has NOT expanded
# yet, and an expansion can introduce a `..` using no quote, no backslash and no
# literal `/../` at all (`<root>/${x}../evil`, `<root>/$(:)../evil`, an empty
# backtick pair, `<root>/$X/evil` — each one word, each resolving outside the
# workspace, and the balanced `$( )` and even backtick count sail past
# `hc_torn_substitution`). Measured with only the `/../` line plus a
# quote/backslash BLACKLIST, every one of those spellings flips SILENT -> allow;
# with the whitelist they stay SILENT. The whitelist is a strict superset of the
# blacklist it replaces — `.` and `/` are inside the class, so a literal `..`
# segment is still refused only by the line above it, and both lines are
# load-bearing. It is a `case` glob, so `set -f` does not touch it, and it does
# NOT fire on an ordinary `..`-prefixed component such as `<root>/..foo/<app>`.
# Its one measured cost is an adopter directory carrying a character outside the
# class (a scoped `packages/@acme/storefront`): the `--prefix` spelling of a
# configured command then costs ONE PROMPT, in EACH of the two allow-only
# guards, while the tail-free `--prefix` arm, the `cd` arms and every bare
# configured command are unaffected — measured, with this cost's standing
# status, in `docs/guard-verification.md` §2.4. DO NOT widen the
# class to buy that back — every character added has to be argued incapable of
# introducing an expansion in every position, which is the enumerate-the-refused
# game these lines exist to end.
#
# THEY LIVE IN THE TWO HELPERS, NOT IN `hc_in_workspace` — deliberate. Centralising
# them would also harden `hc_in_workspace`'s other callers
# (`autonomous-script-allowlist-guard.sh`, `git-rewrite-branch-guard.sh`'s
# `validate_rm_piece`) and is arguably the better end state, but it changes two
# behaviours that were not measured across their own case matrices. Keeping them
# local makes the change provably confined: no existing caller of
# `hc_in_workspace` behaves differently. A later pass that moves them must bring
# its own measured rows for both of those callers.
#
# ONE RESIDUAL, RECORDED SO IT IS NOT RE-LITIGATED: A SYMLINK. These are textual
# tests and a symlink is a filesystem property no string test can see, so a
# `<root>/<link>` pointing outside the workspace is accepted. It grants nothing an
# attacker does not already have — writing that symlink requires write access
# INSIDE the repository, and anyone with that can instead edit the app's own
# manifest, whose lifecycle scripts the configured `depInstall` already runs under
# an `allow`. Closing it means replacing the textual test with a physical
# resolution, which contradicts the `THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS` note
# below, adds a fork per piece to a hook that fires on every Bash call, introduces
# a TOCTOU, and falsely refuses a legitimate directory reached through a symlinked
# path (common on macOS, where `/tmp` is itself one). Measured, it reaches only
# these two helpers: the `cd` arms do not match a path BELOW a configured
# directory, and an `rm` operand must additionally be in the index, which a path
# through a link out of the repository cannot be. THE STANDING STATUS OF THIS AND
# OF EVERY OTHER DISCLOSED RESIDUAL IN THIS PLUGIN — which are open, which have
# since been closed, and the rows that bound each — is
# `docs/guard-verification.md` §2.4. Check it there before re-litigating one.
#
# WHERE THE EVIDENCE FOR ALL OF THE ABOVE LIVES: `docs/guard-verification.md` §2.2
# carries every spelling named here as a real payload, in both helpers and both
# allow-only guards, with the leg that refuses each one and the fault injection
# showing that removing either line turns them into an `allow`. A change to either
# line re-runs that section.

# THE PATH-ANCHORED ARMS — print one `case` glob pattern per line; return 1
# (printing nothing) when the workspace cannot be resolved, so an allow-only
# caller can `|| exit 0` on it and grant nothing.
#
# WHY THEY EXIST. The generic prefix list cannot cover a piece that names a
# directory, because the directory is the part that differs per checkout. What
# the arms cover is `cd <dir>` — which executes nothing beyond changing directory,
# so a trailing wildcard on it can carry no subcommand (a second argument is a
# shell error) — plus the EXACT, tail-free spelling `<pkg-manager> --prefix <dir>`.
# THE TWO SHAPES THAT CARRY A SUBCOMMAND AFTER THE DIRECTORY — `git -C <dir> …`
# and `<pkg-manager> --prefix <dir> …` — ARE NOT ARMS AT ALL: an arm matches on
# the directory alone, so every subcommand rides along on it, and the arms that
# did that granted `git -C <repo> push --all`, `git -C <repo> reset --hard` and
# `npm --prefix <app> install <pkg>` inside a compound while the bare spelling of
# each was granted by nothing. They are handled instead by
# `hc_git_piece_in_workspace` / `hc_runner_piece_in_workspace` above, which
# rewrite the piece to its directory-free form so the caller judges the
# SUBCOMMAND against `hc_safe_prefixes` exactly as it judges the bare spelling.
# These arms are therefore built at runtime from the resolved repository root, the parent
# directory holding its sibling worktrees, the configured `projectName`,
# `appDir` and `stateDir`, and `hc_runner_words` — no machine path and no
# literal command name. THE ARMS ARE THE MECHANISM: a port that drops them
# loses per-worktree auto-allow for every piece that names one of those
# directories.
#
# THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS. The `<work_root>/<project_name>-*`
# arms carry `case`-glob wildcards directly, so matching is independent of
# `nullglob` / `failglob` and of whether any sibling worktree currently exists
# on disk (and `set -f` in a caller does not affect `case` matching). The `cd`
# arm built on the worktree stem ends in `*`, so one pattern covers the worktree
# top, anything under it and any trailing arguments; each non-worktree `cd` arm
# is emitted twice, an exact match and the prefix followed by a space + more
# args. Each `--prefix` arm is emitted ONCE, exact — its `*`-terminated twin is
# what the two rewrite helpers above replaced, and re-adding one re-opens the
# hole they close.
#
# THIS IS THE ONE DEFINITION. All four allow-only guards —
# `allow-safe-compounds.sh`, `git-rewrite-branch-guard.sh`,
# `autonomous-script-allowlist-guard.sh` and `allow-qa-credentials-read.sh` —
# build their path-anchored arms from this function, so no two of them can apply
# different workspace definitions — the drift the source guards could only warn
# about in prose. A new arm, a new `commands.*` key or a change to how the
# app/worktree paths compose belongs here, once.
hc_path_anchored_patterns() {
  local root="${1-}" work project app_rel state_rel app_abs state_abs wt wt_app word
  work=$(hc_work_root "$root") || return 1
  project=$(hc_project_name "$root") || return 1
  app_rel=$(hc_config_dir "$root" appDir .) || app_rel="."
  state_rel=$(hc_config_dir "$root" stateDir sdlc-harness) || state_rel="sdlc-harness"

  if [ "$app_rel" = "." ]; then
    app_abs="$root"
  else
    app_abs="$root/$app_rel"
  fi
  state_abs="$root/$state_rel"

  # Sibling-worktree stem: `<work_root>/<project_name>-`.
  wt="$work/$project-"
  if [ "$app_rel" = "." ]; then
    wt_app="$wt*"
  else
    wt_app="$wt*/$app_rel"
  fi

  cat <<EOF
cd $root
cd $root *
cd $app_abs
cd $app_abs *
cd $state_abs
cd $state_abs *
cd $wt*
EOF

  while IFS= read -r word; do
    [ -n "$word" ] || continue
    # EXACT SPELLINGS ONLY — no `*`-terminated twin. A trailing wildcard here
    # wildcards the whole command line after the directory; the form that carries
    # a subcommand goes through `hc_runner_piece_in_workspace` instead.
    printf '%s --prefix %s\n' "$word" "$app_abs"
    printf '%s --prefix %s\n' "$word" "$wt_app"
  done <<EOF
$(hc_runner_words "$root")
EOF
  return 0
}

# 0 when <piece> matches any pattern in the newline-delimited <patterns> list
# (blank lines ignored); 1 otherwise. The pattern is deliberately UNQUOTED in
# the `case` label — that is what makes its `*` a wildcard. Bash does not
# field-split a `case` pattern, so a pattern containing spaces stays one
# pattern.
hc_matches_any_pattern() {
  local piece="${1-}" patterns="${2-}" pattern
  while IFS= read -r pattern; do
    [ -n "$pattern" ] || continue
    case "$piece" in
      $pattern) return 0 ;;
    esac
  done <<EOF
$patterns
EOF
  return 1
}

# Print the command prefixes an unattended run may take without a prompt: a
# stack-neutral base set (not all of it read-only — see the header), plus the
# adopter's configured `commands.*` strings, plus — only while `phases.parity`
# is true — each `parity.toolchainCommands` entry. Return 1 when the
# configuration cannot be read: an allow-only guard then stays silent rather
# than falling back to a built-in list, which is what keeps a broken config from
# widening anything.
#
# MATCHING IS ON LEADING WORDS, SO A PREFIX CARRIES ITS DESTRUCTIVE FORMS ALONG
# WITH IT: `git branch` here is the listing form the flow needs, and it also
# covers `git branch -D <x>`. `hc_piece_is_never_safe` below refuses those forms
# whatever prefix in this set they happen to match, and every allow-only guard
# calls it before any other test.
hc_safe_prefixes() {
  local root="${1-}" parity

  hc_config_readable "$root" || return 1

  cat <<'EOF'
git status
git log
git diff
git show
git blame
git ls-files
git ls-tree
git branch
git rev-parse
git rev-list
git describe
git reflog
git cat-file
git for-each-ref
git symbolic-ref
git remote -v
git remote get-url
git remote show
git config --get
git config --list
git config -l
git shortlog
git grep
git worktree
git fetch
git add
git stash
mkdir -p
ls
pwd
cat
echo
jq
grep
tail
head
wc
awk
sed
find
EOF

  hc_command_strings "$root"

  parity=$(hc_get "$root" '.phases.parity') || parity="false"
  if [ "$parity" = "true" ]; then
    hc_get_list "$root" '.parity.toolchainCommands[]?' || true
  fi

  return 0
}

# 0 when <piece> is a shape NO ALLOW-ONLY GUARD MAY VOUCH FOR, whatever prefix it
# happens to match; 1 otherwise. All four allow-only guards call it before every
# other test, so no arm of any of them can grant one of these.
#
# WHY IT EXISTS. `hc_safe_prefixes` matches LEADING WORDS ONLY, so a base entry
# that is safe in its listing form carries its destructive forms with it: the
# `git branch` entry above also covers `git branch -D <x>`, which destroys an
# unmerged branch's commits, and `-m`/`-M`, which rename a branch out from under
# a run's own bookkeeping. Those are exactly the forms the generated permission
# profile puts on its `deny` FLOOR — and that floor is a PREFIX match anchored at
# the start of the WHOLE command string, so it does not fire on `git status &&
# git branch -D <x>` and the deny never gets a chance to. Without this test the
# plugin ships both halves of a contradiction: one artifact refuses these
# outright while another hands them out inside a compound.
#
# IT JUDGES THE OPERATION, NOT A LIST OF SPELLINGS. The piece is parsed with
# `hc_git_piece_parts` and the options of a `branch` subcommand are walked;
# anything that can DELETE, RENAME or OVERWRITE an existing ref is refused —
# `-d`, `-D`, `-m`, `-M`, `-f`, `-C`, any bundle carrying one of those letters,
# and the long `--delete` / `--move` / `--force` IN EVERY ABBREVIATION GIT
# ACCEPTS FOR THEM. That last clause is the whole reason the long arm is a
# PREFIX test (`case delete in "$body"*`) rather than three literals: git's
# parse-options takes any unambiguous abbreviation, so `--d`, `--de`, `--dele`,
# `--mov` and `--forc` all run the operation, and a test enumerating spellings
# is wrong again at the next one. A stub short enough to be ambiguous to git
# (`--m`, `--f`, `--fo`, `--for`) is refused here too and costs nothing: git
# rejects it as ambiguous rather than running anything. Measured against a
# literal prefix test on the piece string, the walk is also what refuses
# `git branch -q -D <x>` (the flag is not in leading position, so the profile's
# floor misses it too) and `git -C <dir> branch -D <x>` for a <dir> no rewrite
# helper covers, because the parse strips git's global options first. A caller
# therefore does NOT need to test a rewritten form separately.
#
# A TOKEN THIS TEST CANNOT READ IS REFUSED TOO, and both spellings of that were
# measured to slip past the option walk alone. QUOTES: the shell removes them
# before git sees the word, so `git branch "-D" <x>` and `git branch --de"lete"
# <x>` run the deletion while carrying no bare `-D` / `--delete` token — every
# quote character is therefore deleted from a token before it is classified,
# which is a classification-only transformation (nothing here is a path) and
# needs no fork, unlike `hc_strip_quotes`, which peels one outer layer and is
# called per token on a hook that fires on every Bash call. AN EXPANSION: this is
# a textual test on a string the shell has NOT expanded yet, so `git branch $F
# <x>` says nothing about the flag it will run — a `git branch` piece carrying a
# `$` or a backtick anywhere is refused wholesale, for the same reason the
# workspace helpers above accept only ordinary path characters. Its cost is one
# prompt for a legitimate `git branch --list "$pattern"` inside a compound, and
# it is the shipped corpus's own spelling (`git branch --show-current`) that
# decides that is affordable.
#
# WHAT STAYS GRANTED — the flow's own spellings, none of which can lose a ref:
# the bare listing form, `--show-current`, `--list`, `-a`, `-r`, `-v`, `--merged`,
# `--contains`, `--sort=`, `--format=`, and plain creation `git branch <name>` /
# `-c` / `--copy`, which git refuses rather than clobbers when the target already
# exists. None of them is a prefix of `delete`, `move` or `force` — `format` and
# `merged` diverge at their fourth and second letter — so the prefix test does not
# sweep them up, and neither does the single-dash class. Their own abbreviations
# (`--li`, `--me`, `--mer`, `--cont`, `--form=`) stay granted for the same reason.
# A bare `--` is an end-of-options marker, not a zero-length abbreviation, so it
# matches nothing; tokens after it are still walked, which can only over-refuse.
#
# KEEP THIS AND THE PROFILE'S `deny` ENTRIES IN STEP: an entry added there that
# names a prefix in the base set above belongs here too.
hc_piece_is_never_safe() {
  local piece="${1-}" rest tok body
  hc_git_piece_parts "$piece" || return 1
  case "$HC_GIT_REST" in
    branch|branch\ *) ;;
    *) return 1 ;;
  esac

  rest=${HC_GIT_REST#branch}
  case "$rest" in
    *'$'*|*'`'*) return 0 ;;
  esac
  while :; do
    rest=${rest#"${rest%%[![:space:]]*}"}
    [ -n "$rest" ] || return 1
    tok=${rest%%[[:space:]]*}
    case "$rest" in
      *[[:space:]]*) rest=${rest#"$tok"} ;;
      *) rest="" ;;
    esac
    tok=${tok//\"/}
    tok=${tok//\'/}
    case "$tok" in
      # A long option is judged as a PREFIX of a ref-losing one, because git
      # accepts any unambiguous abbreviation: `--dele` deletes. An empty body
      # is the `--` end-of-options marker, not an abbreviation of everything.
      --*)
        body=${tok#--}
        if [ -n "$body" ]; then
          case delete in "$body"*) return 0 ;; esac
          case move in "$body"*) return 0 ;; esac
          case force in "$body"*) return 0 ;; esac
        fi
        ;;
      -*[dDmMfC]*) return 0 ;;
    esac
  done
}
