#!/usr/bin/env bash
# git-rewrite-branch-guard.sh — PreToolUse guard for `git mv`, `git rm` and
# tracked-file `rm`. It auto-allows one of those on an ORDINARY branch of a
# repository that has adopted the harness, and it emits NOTHING in every other
# case. This is the most conservative guard in the plugin, and its REFUSALS are
# the design, not a rough edge.
#
# WHAT IT MAY AUTO-ALLOW. A whole compound command auto-allows only when EVERY
# piece of it is one of:
#   - a known-safe prefix (the shared library's `hc_safe_prefixes`, plus its
#     path-anchored arms — see below), and not one of the shapes
#     `hc_piece_is_never_safe` refuses whatever prefix they match,
#   - `git mv` / `git rm` whose own `-C`, if it has one, names the repository this
#     guard judged — the branch and jurisdiction checks below apply to THAT
#     repository only, and `top` is the FIRST `git -C` in the compound, so a piece
#     naming a different directory is refused rather than inheriting a clearance it
#     was never given,
#   - `rm <paths>` where every path token passes `validate_rm_piece`.
#
# `validate_rm_piece` refuses — and one refusal silences the whole command —
# when the piece carries `-r` / `-R` / `--recursive`, when any token contains a
# glob character, when any token walks through `..`, when the piece contains a
# shell quote or a backslash escape it cannot reliably reason about, when a
# resolved path lies outside the workspace or outside the resolved repository,
# when a resolved path is not TRACKED BY GIT there (`git ls-files
# --error-unmatch`, so an untracked file is never silently deleted), or when the
# piece names no path at all.
#
# THE `git rm` / PLAIN-`rm` ASYMMETRY IS DELIBERATE. Inside the judged repository
# a `git rm` may carry `-r`, a glob or a `..` — all three of which
# `validate_rm_piece` refuses on a plain `rm`. The asymmetry is recoverability:
# what `git rm` removes is content git already has, restorable with
# `git checkout` / `git reflog`, while a plain `rm` is not recoverable at all.
# Narrowing `git rm` to match would cost an unattended run a capability it
# genuinely uses and buy back nothing that is actually lost. It is recorded here
# because leaving this arm's bounds to be re-derived is how it came to carry a
# stated bound that was not true.
#
# A TRAILING REDIRECT IS STRIPPED BEFORE A PIECE IS MATCHED, AND ONLY THIS GUARD
# DOES IT. `2>/dev/null` and its spellings are removed from the end of a cleaned
# piece so that the two tests which match EXACTLY rather than by leading words
# still see the piece they were written for: the tail-free
# `<pkg-manager> --prefix <dir>` arm, and `validate_rm_piece`, which would
# otherwise read `2>/dev/null` as a path token and refuse
# `rm <tracked> 2>/dev/null`. On a piece matched by LEADING WORDS the strip
# changes nothing — a redirect rides along there in both allow-only guards — so
# the whole measured divergence between them is the `--prefix` spelling, one
# prompt in the sibling guard and an allow here. ITS ONE MEASURED COST: a
# redirect TARGET is not judged at all, so `rm <tracked> >/<outside the
# workspace>` is allowed while the same path as an `rm` OPERAND is refused. That
# is disclosed rather than closed — the identical capability is reachable
# through `allow-safe-compounds.sh` on any safe prefix, so refusing it only here
# would move nothing, and closing the class means judging redirect targets in
# both guards, which is its own change with its own matrix.
#
# STAYS SILENT (exit 0, no output) on every one of:
#   - the payload does not parse, or `jq` is absent      (no command to judge)
#   - the command carries no `rm` / `git mv` / `git rm` at a command position
#   - the anchor is not inside a git repository
#   - the repository has no `harness.config.json`        (no jurisdiction)
#   - the configuration will not resolve — invalid or unreadable JSON, or no
#     `defaultBranch` (`hc_branch_is_protected` -> 2, `hc_safe_prefixes` -> 1),
#     or the workspace will not (`hc_path_anchored_patterns` -> 1)
#   - HEAD is detached                                   (no branch to judge)
#   - the branch is in the repository's own protected set
#   - any piece of the compound is not one of the three shapes above — a bare `&`
#     is a separator like `&&`, so the statement behind one is its OWN piece and
#     must be one of those shapes too: `git -C <repo> rm <tracked> & rm -r-f
#     <dir>` is refused rather than carried by the `git rm` in front of it.
#     `hc_bare_amp_head` carries which `&` separates and which three redirection
#     spellings (`&>`, `>&`, `<&`) do not, so a piece's own `2>/dev/null` is
#     untouched
#   - any piece is a `git branch` form that deletes, renames or overwrites a ref,
#     or one whose flags that test cannot read (a quoted or unexpanded token)
#     (`hc_piece_is_never_safe`) — this guard's allow covers the WHOLE compound,
#     so such a piece would otherwise ride along on the base set's `git branch`
#     prefix, which is the listing form the flow needs; the generated permission
#     profile denies those forms outright, and its deny is anchored at the start
#     of the command string, so it cannot reach one inside a compound
#   - a `git mv` / `git rm` piece whose own `-C` names a directory that resolves
#     to a different repository than the one judged, or that this guard cannot
#     resolve at all (a relative directory, or a shell substitution the library
#     passes through literally rather than evaluating)
#   - a `git mv` / `git rm` piece carrying ANY git global option other than that
#     one `-C` — `--git-dir=`, `--work-tree=`, `-c <k>=<v>` — each of which can
#     move the repository the piece operates on without naming it in a `-C`
#   - any `rm` piece fails any single check listed above
#   - any piece carries a command substitution that never CLOSES inside it
#     (`hc_torn_substitution`) — `hc_split_command` splits on `&&` / `||` / `;` /
#     a bare `&` textually, so a separator inside `$(…)` tears it in half and
#     leaves the fragment `echo $(rm -rf <dir>` matching the `echo` safe prefix
#     while the command it came from actually runs the `rm`; `validate_rm_piece`
#     would never see that `rm`. The test tracks `$(` NESTING DEPTH and is not a
#     parenthesis-count check — see `hc_torn_substitution` for why the two
#     obvious counting forms are each wrong in a different direction.
#
# THIS GUARD ONLY EVER EMITS `allow` OR NOTHING, so it is structurally incapable
# of overriding a deny — a deny is evaluated before any allow and cannot be
# overridden. That is also why every closed outcome above is SILENCE rather than
# an `ask` or a `deny`: silence defers to the adopter's permission profile, which
# keeps these commands on `ask`, so a refusal here costs a prompt and never a
# false permit. Fail-closed, for an allow-only guard, means never emitting
# `allow` — not emitting something else.
#
# JURISDICTION IS A DELIBERATE SCOPING DECISION, NOT AN OVERSIGHT. A repository
# with no `harness.config.json` at its resolved root has not adopted the harness,
# so this guard allows nothing there — a plugin hook fires in EVERY session the
# plugin is enabled for, including repositories that never ran `init`, and a
# grant in a repository that never asked for one is a broken tool, not a
# convenience. The repository itself is resolved from the command the hook was
# handed (the first `git -C <dir>`, else a leading `cd <dir>`, else the payload's
# own `.cwd`, else `$PWD`) — never from a path written in this file — so one
# registration serves every checkout and every sibling worktree.
#
# THE WORKSPACE IS DERIVED, NOT CONFIGURED — and that is the point. Neither half
# of the workspace test is written in this file, deliberately: no absolute
# machine path for the parent directory holding the checkouts, and no
# product-name glob for the sibling worktrees under it — either would bind the
# guard to one machine or one product. The workspace is the resolved repository
# root, plus anything under it, plus any sibling worktree matching
# `<work_root>/<project_name>-*` and anything under that — where `<work_root>`
# is the PARENT of the resolved root and `<project_name>` is the configured name
# (falling back to the root directory's own basename). Deriving it means the
# guard cannot be pointed at the wrong tree by a stale setting, and an adopter
# has nothing to configure for it to work.
#
# THE PATH-ANCHORED ARMS — the prefixes that name a per-checkout directory — are
# built by the shared library's `hc_path_anchored_patterns`, which both guards
# call and which documents the mechanism, the derivation and why the arms are
# `case` globs rather than filesystem lookups. They cover `cd <dir>` and the
# exact, tail-free `<pkg-manager> --prefix <dir>`. THE TWO SHAPES THAT CARRY A
# SUBCOMMAND AFTER THE DIRECTORY — `git -C <dir> …` and
# `<pkg-manager> --prefix <dir> …` — ARE DELIBERATELY NOT ARMS: an arm matches on
# the directory alone, so the subcommand rides along on it, and here that also
# meant a `git -C <sibling worktree> rm -r .` was granted by `is_safe_prefix`
# before the `git rm` arm below could refuse it as a repository this guard never
# judged. Both shapes go through `hc_git_piece_in_workspace` /
# `hc_runner_piece_in_workspace`, which rewrite the piece to its directory-free
# form so the subcommand is judged against `hc_safe_prefixes` — the same set the
# bare spelling is judged against — and which refuse a directory that is
# relative, carries a `..` segment, carries any character outside
# `[A-Za-z0-9._/-]`, or lies outside the workspace.
#
# WHY `set -f`. Filename expansion is disabled for the whole script. Without it,
# `for tok in $rest` in `validate_rm_piece` expands a glob token into the real
# filenames it matches BEFORE the no-glob check can see it, and the check then
# passes on tokens that carry no glob character — turning the guard's own stated
# refusal of `rm <dir>/*.md` into an auto-allow. This guard never wants filename
# expansion: every path it handles comes from the command string verbatim.
#
# REPRO — reproduce any decision by hand; the payload goes in on stdin. <repo> is
# a checkout that has adopted the harness and is on an ordinary branch, <tracked>
# a file `git ls-files` reports there, <untracked> one it does not:
#
#   printf '{"tool_input":{"command":"cd <repo> && rm <tracked>"},"cwd":"<repo>"}' \
#     | bash plugin/hooks/git-rewrite-branch-guard.sh
#
#   ALLOW (prints one JSON object carrying permissionDecision "allow") — same
#   payload shape, differing only in the "command" string:
#
#     cd <repo> && rm <tracked>                     tracked file, cwd-relative
#     git -C <repo> rm <tracked>                    git rm
#     git -C <repo> mv <tracked> <tracked>2         git mv
#     git -C <repo> status && rm <repo>/<tracked>   safe prefix + tracked rm
#     cd <work_root>/<project_name>-<branch> && rm <tracked>
#                                                   sibling worktree of <repo>
#     git -C <repo> log && rm <repo>/<tracked>      directory-scoped safe subcommand
#     git -C <repo> status 2>&1 && rm <repo>/<tracked>
#                                                   a redirection `&` is not a
#                                                   separator, nor is `&>` / `>&` / `<&`
#     <runner> --prefix <app_dir> <tail of a configured commands.* string> && rm <tracked>
#                                                   directory-scoped runner, safe tail
#
#   NO OUTPUT, exit 0:
#
#     cd <repo> && rm <untracked>                   not tracked by git
#     rm -r <repo>/<dir>                            recursive
#     rm <repo>/*.md                                glob
#     rm <repo>/../outside.txt                      `..` traversal
#     rm "<repo>/<tracked>"                         quoting it will not reason about
#     rm /etc/hosts                                 outside the workspace
#     git -C <repo> status && git -C <other repo> rm <path>
#                                                   a second `-C`, never judged
#     git -C <repo> status && git -C <work_root>/<project_name>-<branch> rm -r .
#                                                   the same, in a SIBLING WORKTREE:
#                                                   in the workspace, still a
#                                                   repository this guard never judged
#     git -C <repo> push --all <remote> && git -C <repo> rm <tracked>
#                                                   directory in the workspace,
#                                                   subcommand is not safe
#     git branch -D <branch> && rm <tracked>        a form the generated deny floor
#                                                   lists, riding on `git branch`
#     <runner> --prefix <repo>/${x}../<elsewhere> <configured subcommand> && rm <tracked>
#                                                   a directory carrying any character
#                                                   outside [A-Za-z0-9._/-] is refused,
#                                                   quoted and substituted forms included
#     git -C <repo> rm <tracked> & rm -r-f <dir>    a bare `&` ends the piece, so
#                                                   the statement behind it is judged
#     rm <tracked> |& bash <script>                 …`|&` included: its `&` separates
#     echo $(rm -rf <dir>; rm <tracked>)            torn command substitution
#     echo $(rm -rf <dir> $(date); rm <tracked>)    …with a nested closed one inside
#     any of the above with <repo> on a protected branch, or detached
#     any of the above in a <repo> whose config is invalid JSON
#     any of the above in a <repo> with no harness.config.json

set -u
set -f

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-config-lib.sh"

payload=$(cat)

# Cheapest possible filter first: these hooks fire on every Bash call, and a
# payload carrying neither `rm` nor `mv` anywhere cannot carry a rewrite. This
# runs before any `jq` or `git` subprocess.
case "$payload" in
  *rm*|*mv*) ;;
  *) exit 0 ;;
esac

# ONE `jq` for both payload fields — see `hc_payload_fields`.
hc_payload_fields "$payload" || exit 0
cmd="$HC_PAYLOAD_CMD"

# Structural filter: a real `rm`, `git mv` or `git rm` at a command position.
# Anything else — including the letters appearing inside a word or a string — is
# not this guard's concern.
if ! printf '%s' "$cmd" \
     | grep -qE '(^|[[:space:]&|;`])(rm[[:space:]]|git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?(mv|rm)[[:space:]])'; then
  exit 0
fi

cwd="$HC_PAYLOAD_CWD"

# The repository this command operates on, resolved by the library's settled
# order. `top` is the work-tree root every path below is judged against.
top=$(hc_resolve_repo_root "$cmd" "$cwd") || exit 0

# Jurisdiction: no config at that root means the harness was never adopted here,
# so there is nothing for this guard to grant.
hc_config_file "$top" >/dev/null || exit 0

# Warm the per-process configuration cache HERE, in this shell: every reader
# below runs inside a `$(…)` subshell, which inherits the cache but cannot
# write one back. Decides nothing — see the cache header in the library.
hc_config_load "$top" || :

# A detached HEAD has no branch to judge; a protected branch is refused; an
# unresolvable configuration (return 2) is refused on the same terms, because
# treating it as "not protected" is exactly the permit this shape exists to
# withhold.
branch=$(hc_current_branch "$top")
[ -n "$branch" ] || exit 0

hc_branch_is_protected "$top" "$branch"
case $? in
  1) ;;
  *) exit 0 ;;
esac

# The safe-prefix set comes from the library and from the adopter's own
# configuration. When it cannot be resolved there is NO fallback to a built-in
# list: a broken configuration must never widen what this guard allows.
safe_prefixes=$(hc_safe_prefixes "$top") || exit 0

# The path-anchored arms for this checkout — one `case` glob per line, built by
# the library from the resolved root and the configuration. A workspace that
# will not resolve grants nothing, on the same terms as a prefix set that will
# not.
path_anchored_patterns=$(hc_path_anchored_patterns "$top") || exit 0

is_safe_prefix() {
  local piece="$1" prefix rewritten
  # FIRST, so no arm below can vouch for it — this guard's allow covers the whole
  # compound, so a `git branch -D <x>` riding along on the `git branch` prefix
  # would be granted here exactly as it would in `allow-safe-compounds.sh`. See
  # `hc_piece_is_never_safe`, which is that one refusal and lives in the library
  # so both allow-only guards inherit it.
  hc_piece_is_never_safe "$piece" && return 1
  if hc_matches_any_pattern "$piece" "$path_anchored_patterns"; then
    return 0
  fi
  # A piece that names a workspace directory with `git -C` or `<runner> --prefix`
  # is judged on its SUBCOMMAND, against the same set the bare spelling is judged
  # against. This is also what lets the `git mv` / `git rm` arm below see a
  # directory-scoped rewrite at all: while `git -C <dir> *` was an arm, every
  # `git -C <sibling worktree> rm -r .` short-circuited here, before that arm
  # could refuse it as a repository this guard never judged.
  rewritten=$(hc_git_piece_in_workspace "$piece" "$top") \
    || rewritten=$(hc_runner_piece_in_workspace "$piece" "$top") \
    || rewritten=""
  while IFS= read -r prefix; do
    [ -n "$prefix" ] || continue
    case "$piece" in
      "$prefix"|"$prefix "*) return 0 ;;
    esac
    if [ -n "$rewritten" ]; then
      case "$rewritten" in
        "$prefix"|"$prefix "*) return 0 ;;
      esac
    fi
  done <<EOF
$safe_prefixes
EOF
  return 1
}

# ---------------------------------------------------------------------------
# Piece walking. A leading `cd` in an earlier piece moves the directory a later
# piece's relative path resolves against, so the pieces are walked in order and
# the cwd is threaded through them.
# ---------------------------------------------------------------------------

piece_cwd="$cwd"
[ -n "$piece_cwd" ] || piece_cwd="${PWD-}"

update_cwd_from_cd() {
  local piece="$1"
  if [[ "$piece" =~ ^cd[[:space:]]+([^[:space:]&|;]+) ]]; then
    local target="${BASH_REMATCH[1]}"
    case "$target" in
      /*) piece_cwd="$target" ;;
      *)  piece_cwd="$piece_cwd/$target" ;;
    esac
  fi
}

validate_rm_piece() {
  local piece="$1"
  local rest="${piece#rm}"
  rest="${rest# }"

  # Bail on shell quoting / backslash escapes — we can't reliably reason about them.
  case "$rest" in
    *\"*|*\'*|*\\*) return 1 ;;
  esac

  local found_path=0
  local tok abs relpath
  for tok in $rest; do
    case "$tok" in
      --) continue ;;
      -*[rR]*|--recursive) return 1 ;;
      -*) continue ;;
      *\**|*\?*|*\[*) return 1 ;;
    esac

    if [[ "$tok" =~ (^|/)\.\.($|/) ]]; then
      return 1
    fi

    found_path=1
    case "$tok" in
      /*) abs="$tok" ;;
      *)  abs="$piece_cwd/$tok" ;;
    esac

    if ! hc_in_workspace "$abs" "$top"; then
      return 1
    fi

    case "$abs" in
      "$top") relpath="." ;;
      "$top"/*) relpath="${abs#$top/}" ;;
      *) return 1 ;;
    esac

    if ! git -C "$top" ls-files --error-unmatch -- "$relpath" >/dev/null 2>&1; then
      return 1
    fi
  done

  [ "$found_path" = 1 ] || return 1
  return 0
}

# `hc_torn_substitution` runs FIRST, on the RAW piece, before cleaning peels a
# legitimate trailing `)`. A fragment such as `echo $(rm -rf <dir>` would
# otherwise match the `echo` safe prefix, so `validate_rm_piece` would never see
# the `rm` it actually runs; withholding the allow there is the whole point.
while IFS= read -r piece; do
  hc_torn_substitution "$piece" && exit 0
  piece=$(hc_clean_piece "$piece")
  [ -z "$piece" ] && continue

  # Strip a trailing redirect like `2>/dev/null` so it doesn't confuse matching.
  piece=$(printf '%s' "$piece" | sed -E 's/[[:space:]]+[0-9]*[<>][^[:space:]]+[[:space:]]*$//')

  if is_safe_prefix "$piece"; then
    update_cwd_from_cd "$piece"
    continue
  fi

  # `git mv` / `git rm`. A piece's OWN `-C` must name the repository this guard
  # judged: `top` comes from the FIRST `git -C` in the compound, so a later piece
  # naming a different directory would be operating on a repository whose
  # jurisdiction, branch and workspace were never checked. A `-C` this library
  # cannot resolve (relative, or a shell substitution passed through literally by
  # `hc_git_piece_parts`) is refused for the same reason.
  #
  # NOTHING MAY SIT BETWEEN `git` AND THE SUBCOMMAND except that one `-C`, and
  # the reconstruction below is what enforces it. `hc_git_piece_parts` STEPS OVER
  # git's other global options to reach the subcommand and does not report them,
  # so a piece carrying `--git-dir=<dir>`, `--work-tree=<dir>` or
  # `-c core.worktree=<dir>` would otherwise arrive here looking like a plain
  # `git rm` with no directory at all while actually operating on a repository
  # this guard never judged — the same escape as a second `-C`, wearing a
  # different option name. Rebuilding the piece from the two parts refuses every
  # such spelling by construction, including whichever ones git grows next;
  # matching a list of option names would only refuse the ones known today. The
  # quoted `-C` spellings are listed because the shipped guard accepted them.
  if hc_git_piece_parts "$piece"; then
    case "$HC_GIT_REST" in
      mv|mv\ *|rm|rm\ *)
        case "$piece" in
          "git $HC_GIT_REST") ;;
          "git -C $HC_GIT_DIR $HC_GIT_REST") ;;
          "git -C \"$HC_GIT_DIR\" $HC_GIT_REST") ;;
          "git -C '$HC_GIT_DIR' $HC_GIT_REST") ;;
          *) exit 0 ;;
        esac
        if [ -z "$HC_GIT_DIR" ]; then
          continue
        fi
        case "$HC_GIT_DIR" in
          /*) ;;
          *) exit 0 ;;
        esac
        if [ "$(hc_repo_root "$HC_GIT_DIR" 2>/dev/null)" = "$top" ]; then
          continue
        fi
        exit 0
        ;;
    esac
  fi

  if [[ "$piece" =~ ^rm([[:space:]]|$) ]]; then
    if validate_rm_piece "$piece"; then
      continue
    else
      exit 0
    fi
  fi

  exit 0
done <<EOF
$(hc_split_command "$cmd")
EOF

jq -nc --arg b "$branch" --arg p "$top" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow",
    permissionDecisionReason: ("Auto-allowed git mv/rm/rm-tracked on branch " + $b + " in " + $p)
  }
}'

exit 0
