#!/usr/bin/env bash
# autonomous-protected-branch-guard.sh — PreToolUse guard for Bash, and the only
# guard in this plugin that answers `deny`. It refuses a `git push` / `git merge`
# / `git rebase` it can PROVE targets a branch the resolved repository's own
# `harness.config.json` protects, and it stays SILENT (exit 0, no output) on
# everything else, letting the permission system decide those. A `deny` beats any
# allow, which is why nothing is refused on a guess.
#
# NO BRANCH NAME IS BAKED INTO THIS FILE. The protected set is
# *(`protectedBranches` if present, else the schema default)* ∪ *{`defaultBranch`}*,
# read through the shared library from the repository the command itself names.
# A repository whose ordinary working branch is another repository's protected one
# gets its own answer, and every refusal quotes the set it applied.
#
# WHAT "PROVE" MEANS — the guard denies on exactly three conditions, nothing
# else:
#
#   (a) a push/merge/rebase whose explicit TARGET ARGUMENT names a protected
#       branch. The token is read through, in this order: one layer of
#       surrounding shell quotes ('<protected>' / "<protected>"), a `<src>:`
#       refspec prefix (`HEAD:<protected>` -> the destination), a leading `+`
#       (the force-update refspec `+<protected>`, which is `push --force` spelled
#       as a refspec and sits OUTSIDE `refs/heads/`, so it comes off first), a
#       `refs/heads/` prefix, and finally a single leading `<remote>/` segment —
#       that last one ONLY after the whole token has already failed to match, so
#       a configured pattern that itself contains a slash (a protected namespace
#       `<ns>/*`) keeps its first segment instead of being shortened out of its
#       own set. A symbolic `HEAD` / `@` target is resolved against the branch
#       currently checked out and judged as that branch.
#   (b) a push/merge/rebase issued while HEAD itself is on a protected branch.
#   (c) a target naming a SET of refs rather than one branch — a glob target
#       (`<ns>/*`, `refs/heads/*:refs/heads/*`), `--all`, `--mirror`. Each
#       updates every branch it matches, protected ones included, so it cannot
#       be cleared against the protected set without expanding it, which this
#       guard must not do. It is refused outright, whatever it would have
#       matched, and the refusal asks for the branch by name.
#
# EVERY push/merge/rebase IN THE COMPOUND IS JUDGED, AND ONLY ITS OWN ARGUMENT
# TOKENS ARE. Both halves are load-bearing. The command is split into pieces, a
# piece into sub-pieces, and a sub-piece into words, and each `git` sitting at a
# command position contributes the argument tokens of ITS subcommand — so
# `git push <remote> <protected> && git push <remote> <feature>` is refused on
# its first half, which the extraction this replaced never looked at. And an
# incidental token is never a target: a protected name sitting in a path, in a
# quoted string, or in a chained read-only command
# (`git rebase --abort && grep -n "<protected>" <file>`, the same behind a `|`)
# belongs to another command and does NOT deny. That precision is the fix for a
# prior incidental-token false positive, where any protected name anywhere in
# the command string drew a refusal; the REPRO block below keeps it as a
# standing case so it cannot regress unnoticed.
#
# NOTHING BETWEEN `git` AND THE SUBCOMMAND HIDES IT, FOR THE GLOBAL OPTIONS
# `hc_git_piece_parts` ENUMERATES, IN EITHER SPELLING GIT TAKES. The subcommand is
# reached through that helper, which steps over git's global options both in the
# `=` form (`--git-dir=<dir>`) and in the form that takes the NEXT WORD
# (`-C <dir>`, `-c <k>=<v>`, `--git-dir <dir>`, `--work-tree <dir>`,
# `--namespace <ns>`, `--attr-source <tree>`, `--config-env <k>=<var>`,
# `--super-prefix <p>`, `--shallow-file <path>`), so each of them is judged
# exactly as the bare spelling is. THE WORD-TAKING SET IS ENUMERATED IN THAT
# HELPER, and that is this paragraph's bound: an argument-taking global option
# ABSENT FROM THAT ENUMERATION — one the running git's `handle_options` already
# accepts and nobody listed, or one a later git adds — leaves its argument sitting
# where the subcommand should be and hides it. The matcher this replaced admitted
# only an optional `-C <dir>` here and exited 0 otherwise, which made every other
# global option a MISSED REFUSAL, condition (b) included; the word-taking
# spellings were a second such gap, closed after it. `--shallow-file` was a third,
# and its cause was the measurement method: the first two rounds were enumerated
# from a git that DOCUMENTS its global options (`git --help`, 2.50.1), and that
# usage block does not print `--shallow-file` though the same git accepts it. The
# enumeration is therefore derived from `handle_options`, which is where the set
# actually lives. `docs/guard-verification.md` §3.2 carries the rows.
#
# CONDITION (b) IS NOT NARROWED TO A LITERALLY BARE COMMAND, deliberately.
# `git push <remote>` names a remote and no branch, and `git push --force` names
# neither, yet both push the protected HEAD; so (b) is evaluated on every matched
# push/merge/rebase rather than only on one with no argument tokens at all. The
# cost is that an ordinary-branch push issued FROM a protected checkout is
# refused too. That is the intended reading of the rule this enforces — an
# unattended run never operates on a protected branch at all — and the refusal
# names the branch and the set, so it is legible rather than mysterious.
#
# THIS GUARD IS THE FAST-FEEDBACK LAYER, NOT THE FLOOR. It sees only the literal
# Bash command string it was handed, so it is bypassed by any interpreter
# subprocess on the adopter's allow list that spawns a push as a CHILD process —
# that child never re-enters this hook. Two backstops carry the actual weight:
#   - ON-BOX AND CALLER-AGNOSTIC WITHIN GIT: the adopter's committed pre-push
#     hook at `<githooks_dir>/pre-push`, wired via `core.hooksPath`. git runs it
#     on every push GIT PERFORMS, whoever called git, so it catches exactly the
#     subprocess pushes this string matcher misses. It is bypassable on-box
#     (`--no-verify`), and its caller-agnosticism stops where git does: a tool
#     that implements push against the git backend itself, as `jj git push` does,
#     performs no git push and runs no git hook, while THIS guard sees that
#     command and refuses it with the identical decision WHEN ITS TARGET IS
#     NAMED (`jj git push -b <protected>`) - both measured, one repository,
#     seconds apart. So over the shapes each reaches, the two are complementary
#     rather than ranked. NEITHER REACHES THE ARGUMENT-LESS `jj git push`: it
#     runs no git hook, it carries no target token for condition (a), and it
#     cannot trip condition (b) because jj leaves HEAD detached (fail-closed
#     table below: detached HEAD -> SILENT). Only the forge-side ruleset covers
#     that form. `doctor`'s `jj-repository` check reports this to an adopter.
#   - FUTURE-ONLY AND UN-BYPASSABLE: a forge-side branch ruleset is the only real
#     floor. Nothing in this plugin provisions one, and nothing in it assumes one
#     exists.
# Losing this guard costs the fast on-box feedback, not the boundary. It also
# never refuses an ordinary feature-branch push WHEN THE BRANCH IS NAMED —
# a target naming a SET is refused whatever it would have matched, so
# `push <remote> <feature>*` is refused even though the glob matches nothing
# protected (condition (c)). A named ordinary push stalls at the `git push`
# `ask` entry in the adopter's permission profile instead, so do NOT move
# `git push` out of `ask` on the strength of this guard.
#
# THAT SET REFUSAL IS ALSO WHAT CLOSED A PREVIOUSLY-DISCLOSED RESIDUAL,
# `push <remote> refs/heads/*`. It and its siblings — `refs/heads/*:refs/heads/*`,
# the quoted spelling, `--all`, `--mirror` — are refused, by the wildcard arm and
# the `--all`/`--mirror` arm respectively, and `+<protected>` by the ordinary
# protected-set test behind the `+` strip. The closure needs BOTH those arms and
# `set -f` below: without it an unquoted target is glob-expanded away before any
# arm sees it, which is a missed refusal from some working directories and not
# others. `docs/guard-verification.md` §2.4 carries the rows, the arm each one
# fires from, and the fault injection for the composition; it is also where the
# standing status of every disclosed residual in this plugin lives, so a reader
# working from an older residual list can see which are still open.
#
# FAIL-CLOSED TABLE — a deny guard must never permit what it could not read:
#
#   proven protected target, or protected HEAD -> deny
#   configuration unresolvable                 -> deny  (invalid JSON, more than
#     (within jurisdiction)                             one document, absent
#                                                       `jq`-readable `defaultBranch`)
#   no config, or one `[ -r ]` cannot read     -> SILENT (out of jurisdiction)
#   payload unparseable, or `jq` absent        -> SILENT (no command to judge)
#   path is not inside a git repository        -> SILENT
#   detached HEAD with nothing else proven     -> SILENT (no branch to name)
#   anything else                              -> SILENT
#
# JURISDICTION IS A DELIBERATE SCOPING DECISION, NOT AN OVERSIGHT. A repository
# with no `harness.config.json` at its resolved root has not adopted the harness,
# so this guard refuses nothing there — a plugin hook fires in EVERY session the
# plugin is enabled for, including repositories that never ran `init`, and a
# refusal in a repository that never asked for one is a broken tool, not a
# safeguard. The caller-agnostic backstop for those is the adopter's own
# committed pre-push hook. That backstop is caller-agnostic WITHIN GIT: git runs
# it on every push git performs, and a tool that implements push against the git
# backend itself, as `jj git push` does, performs no git push and runs no git
# hook. This is the single permit-by-default in the set, and it is the reason
# the unresolvable-configuration row above says `deny`: inside jurisdiction,
# silence would be the permit this guard exists to withhold.
#
# SELF-VERIFYING. It ships as a plugin hook declared in `hooks/hooks.json`, which
# APPENDS to whatever hooks the adopter already has. It takes no arguments and
# needs no `if:` condition: it reads the command out of the payload and is silent
# on anything that is not a push/merge/rebase, so a spurious fire is harmless.
# The repository it judges comes from the command and the payload — never from a
# path written in this file — so one registration serves every checkout and every
# sibling worktree.
#
# WHY `set -f`. Filename expansion is disabled for the whole script. Both walks
# below do `set -- <string>`, which word-splits AND glob-expands the words of a
# sub-piece and then the argument tokens of each matched push/merge/rebase
# against whatever directory
# this hook happens to run in. Without `set -f`, a target written with a glob
# character is replaced by the filenames it matches before it can be judged, so
# a token that would have matched the protected set — or been refused as a set
# under condition (c) — is no longer there and the guard falls silent — a MISSED
# refusal, which is the one direction a deny guard must never be wrong in. It
# also runs the other way: a token that names nothing protected picks up a
# protected name from the hook's own working directory and draws a refusal the
# command never earned. `set -f` does NOT affect `case`
# pattern matching, so the protected-set globs keep their wildcards.
#
# REPRO — reproduce any decision by hand; the payload goes in on stdin. <dir> is
# a checkout that has adopted the harness, <protected> is any branch that
# checkout's own config protects, `<ns>/*` one of its protected namespace
# patterns, <feature> an ordinary branch, <remote> a remote name:
#
#   printf '{"tool_input":{"command":"git -C <dir> push <remote> <protected>"},"cwd":"<dir>"}' \
#     | bash plugin/hooks/autonomous-protected-branch-guard.sh
#
#   DENY (prints one JSON object carrying permissionDecision "deny") — each of
#   these, same payload shape, differing only in the "command" string:
#
#     git -C <dir> push <remote> <protected>        explicit target
#     git -C <dir> push <remote> "<protected>"      quoted target
#     git -C <dir> push <remote> HEAD:<protected>   refspec destination
#     git -C <dir> push <remote> HEAD               symbolic, HEAD on <protected>
#     git -C <dir> rebase <remote>/<protected>      remote-qualified target
#     git -C <dir> push --force <remote> <ns>/1.2   protected namespace
#     git -C <dir> push <remote> +<protected>       force-update refspec
#     git -C <dir> push <remote> <ns>/*             unquoted namespace glob, not
#                                                   expanded (see WHY `set -f`),
#                                                   judged as a set
#     git -C <dir> push <remote> refs/heads/*:refs/heads/*
#                                                   wildcard refspec, judged as
#                                                   a set
#     git -C <dir> push --all <remote>              every branch, protected
#                                                   included; likewise quoted
#                                                   ('--all'), the same command
#     git -C <dir> push --mirror <remote>           same
#     git -C <dir> push                             bare, HEAD on <protected>
#     git -C <dir> push <remote> <protected> && git -C <dir> push <remote> <feature>
#                                                   the FIRST of two, and the `;`
#                                                   spelling; likewise merge and
#                                                   rebase
#     git -C <dir> -c core.pager=cat push <remote> <protected>
#                                                   a global option ahead of the
#                                                   subcommand; likewise
#                                                   --no-pager, and
#                                                   --git-dir=/--work-tree= with
#                                                   the payload cwd naming <dir>
#     git -C <dir> -c core.pager=cat push <remote> <feature>
#                                                   the same, HEAD on <protected>
#                                                   — condition (b) is not
#                                                   evadable by option spelling
#     git --git-dir <dir>/.git --work-tree <dir> push <remote> <protected>
#                                                   the SPACE-separated spelling
#                                                   of the same options, payload
#                                                   cwd naming <dir>; likewise
#                                                   --namespace, --attr-source,
#                                                   --config-env, --super-prefix
#                                                   and --shallow-file, and
#                                                   likewise merge and rebase
#     git -C <dir> --git-dir <dir>/.git push <remote> <feature>
#                                                   the same, HEAD on <protected>
#                                                   — the space spelling does not
#                                                   evade condition (b) either
#     sudo git -C <dir> push <remote> <protected>   `git` at a command position
#                                                   behind another word
#     any of the above, with <dir>'s config truncated to invalid JSON
#                                                   unresolvable configuration
#
#   NO OUTPUT, exit 0:
#
#     git -C <dir> push <remote> <feature>          HEAD not on a protected branch
#     git -C <dir> push <remote> +<feature>         force refspec, ordinary
#                                                   branch — the `+` strip does
#                                                   not widen what is refused
#     git -C <dir> rebase --abort && grep -n "<protected>" <file>
#                                                   incidental token, not a target
#     git -C <dir> rebase --abort | grep -n <protected>
#                                                   the same across a pipe, which
#                                                   `hc_split_command` does not
#                                                   split on — see `sub_pieces`
#     git -C <dir> rebase --abort |& grep -n <protected>
#                                                   the same for `|&`, whose `&`
#                                                   the splitter now ends the piece
#                                                   on: the `grep`'s tokens are still
#                                                   not read as targets
#     git -C <dir> commit -m "push to <protected>"  not a push/merge/rebase
#     echo "git push <remote> <protected>"          inside a string, so no word
#                                                   of it is exactly `git`
#     any command, in a <dir> with no harness.config.json      not adopted
#     any command, with a <dir> that is not a git repository

set -u
set -f

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-config-lib.sh"

payload=$(cat)

# Cheapest possible filter first: these hooks fire on every Bash call, and a
# payload with none of these three bytes-sequences anywhere cannot carry a
# push/merge/rebase. This runs before any `jq` or `git` subprocess.
case "$payload" in
  *push*|*merge*|*rebase*) ;;
  *) exit 0 ;;
esac

# ONE `jq` for both payload fields — see `hc_payload_fields`.
hc_payload_fields "$payload" || exit 0
cmd="$HC_PAYLOAD_CMD"

# Split a piece further on the separators `hc_split_command` does not reach —
# `|`, a backtick, a paren, and the `&` spellings it deliberately leaves intact
# (`&>`, `>&`, `<&`; a `&` that SEPARATES has already ended the piece upstream).
# They are the rest of what puts the next word at a COMMAND POSITION, and they are also where a matched subcommand's
# argument list ENDS: the tokens of `git rebase --abort | grep -n "<protected>"
# <file>` belong to the `grep`, and reading them as targets is the incidental
# false positive the header's precision paragraph forbids.
sub_pieces() {
  local rest="${1-}" head
  while :; do
    head=${rest%%[\&\|\;\`\(\)]*}
    [ "$head" = "$rest" ] && break
    printf '%s\n' "$head"
    rest=${rest#"$head"?}
  done
  printf '%s\n' "$rest"
}

# STRUCTURAL PASS — the only place a push/merge/rebase is recognised, and where
# every matched one contributes its own argument tokens to `$targets`. Piece of
# `hc_split_command`, then sub-piece, then word: a word that is exactly `git`
# sits at a command position, and the segment from there goes to
# `hc_git_piece_parts`, which steps over git's global options in both spellings —
# the `=` form and the enumerated set that takes the next word — to reach the
# subcommand. Pure parameter expansion — it runs ahead of repository
# resolution and the configuration load, so a command carrying none of the three
# subcommands still costs no `git` and no `jq` fork.
#
# WHAT THIS REPLACED, recorded so it is not "simplified" back. A `grep -qE`
# filter plus a greedy `sed` extraction, which lost two conditions at once. The
# leading `.*` matched the LAST push/merge/rebase on the line rather than the
# first the comment above it claimed, so
# `git push <remote> <protected> && git push <remote> <feature>` went SILENT
# while its mirror image denied. And both patterns admitted only an optional
# `-C <dir>` between `git` and the subcommand, so any other global option hid it
# — `git -c core.pager=cat push`, `git --git-dir=<dir> --work-tree=<dir> push`
# — and the filter's `exit 0` made that a MISSED REFUSAL, the one direction a
# deny guard must never be wrong in. A THIRD condition was lost in the same
# place and closed later: the walker's own arms consumed only the `=` spelling's
# single word, so `git --git-dir <dir> push` left the DIRECTORY where the
# subcommand should be and the push was never seen.
# `docs/guard-verification.md` §3.2 carries the rows for all three legs.
matched=0
targets=""
while IFS= read -r piece; do
  piece=$(hc_clean_piece "$piece")
  [ -n "$piece" ] || continue
  while IFS= read -r sub; do
    [ -n "$sub" ] || continue
    # shellcheck disable=SC2086
    set -- $sub
    while [ "$#" -gt 0 ]; do
      if [ "$1" = "git" ]; then
        hc_git_piece_parts "$*" || break
        case "${HC_GIT_REST%% *}" in
          push|merge|rebase) ;;
          *) break ;;
        esac
        matched=1
        case "$HC_GIT_REST" in
          *\ *) targets="$targets ${HC_GIT_REST#* }" ;;
        esac
        break
      fi
      shift
    done
  done <<EOF
$(sub_pieces "$piece")
EOF
done <<EOF
$(hc_split_command "$cmd")
EOF

# Nothing this guard judges. Anything else — including the word appearing inside
# a string — is not its concern.
[ "$matched" -eq 1 ] || exit 0

# The repository this command operates on, resolved by the library's settled
# order: the first `git -C <dir>`, else a leading `cd <dir>`, else the payload's
# own `.cwd`, else `$PWD`. Hoisted above BOTH checks below — the explicit-target
# loop needs it to resolve a symbolic `HEAD`/`@` target and to read the protected
# set, and the HEAD check needs it for the current branch.
cwd="$HC_PAYLOAD_CWD"
root=$(hc_resolve_repo_root "$cmd" "$cwd") || exit 0

# Jurisdiction: no config at that root means the harness was never adopted here,
# so there is no protected set to enforce and nothing to refuse.
hc_config_file "$root" >/dev/null || exit 0

# Warm the per-process configuration cache HERE, in this shell: every reader
# below runs inside a `$(…)` subshell, which inherits the cache but cannot
# write one back. Decides nothing — see the cache header in the library.
hc_config_load "$root" || :

deny() {
  jq -nc --arg r "${1-}" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

# Inside jurisdiction, a configuration that will not resolve is refused rather
# than permitted: this guard cannot enforce a set it cannot read, and silence
# here would be the permit it exists to withhold.
patterns=$(hc_protected_patterns "$root") || deny "Blocked: the protected-branch configuration at $root/harness.config.json could not be resolved (invalid JSON, more than one JSON document, or no defaultBranch). This guard refuses rather than permits when it cannot read the set it enforces — fix the configuration, then retry."

patterns_desc=$(printf '%s' "$patterns" | tr '\n' ',' | sed 's/,/, /g; s/, *$//')

# 0 when the named branch is in the resolved set; 1 when it is an ordinary
# branch. A trichotomy result of 2 means the configuration stopped resolving
# mid-flight, which is refused on the same terms as above rather than read as a
# permit. An empty name never reaches here: the callers test for it first,
# because a detached HEAD is nothing to prove, not something to refuse.
ref_protected() {
  hc_branch_is_protected "$root" "${1-}"
  case $? in
    0) return 0 ;;
    2) deny "Blocked: the protected-branch configuration at $root/harness.config.json stopped resolving while judging '${1-}'. This guard refuses rather than permits when it cannot read the set it enforces." ;;
  esac
  return 1
}

# 1) An EXPLICIT protected-branch TARGET ARGUMENT of a push/merge/rebase — NOT
#    any incidental token elsewhere in the command. The structural pass above
#    already put the argument tokens of EVERY matched subcommand in the compound
#    into `$targets`, and nothing else: a flag, a chained command's operands and
#    a name inside a string are all excluded there rather than here.
if [ -n "$targets" ]; then
  # shellcheck disable=SC2086
  set -- $targets
  for tok in "$@"; do
    # One layer of surrounding shell quotes, via the library, so every guard
    # de-quotes a token the same way: `push '<remote>' '<protected>'` is judged
    # exactly like the bare form. This runs BEFORE the flag test below, so a
    # QUOTED set-naming flag (`push '--all' <remote>`, the same command as the
    # bare form) reaches the arm that refuses it instead of passing through as an
    # unrecognised word. De-quoting a genuine flag first costs nothing: `-*`
    # still matches it, and the arm skips it either way.
    tok=$(hc_strip_quotes "$tok")
    [ -n "$tok" ] || continue

    case "$tok" in
      --all|--mirror)
        # NOT ordinary flags: they name every branch the remote has, protected
        # ones included, without writing any of them in the command. Tested
        # AHEAD of the `-*` arm below or that arm consumes them as flags.
        deny "Blocked: '$tok' pushes every branch, which includes the protected set ($patterns_desc). Push the branch you mean by name."
        ;;
      -*|'') continue ;;   # option flag, the `--` separator, empty — never a target
    esac

    # A symbolic `HEAD` / `@` target is not a literal branch name but it RESOLVES
    # to the checked-out branch, so judge that branch. The refspec destination of
    # `HEAD:<protected>` is handled by the `${tok##*:}` strip below, so match only
    # a token that is EXACTLY the symbolic ref here.
    case "$tok" in
      HEAD|@)
        cur=$(hc_current_branch "$root")
        if [ -n "$cur" ] && ref_protected "$cur"; then
          deny "Blocked: the symbolic target '$tok' resolves to protected branch '$cur' (protected set: $patterns_desc). The autonomous flow never pushes, merges or rebases onto a protected branch."
        fi
        continue
        ;;
    esac

    ref="${tok##*:}"          # `<src>:` refspec prefix -> the destination
    ref="${ref#+}"            # force-update refspec (`+<dst>`) -> the destination
    ref="${ref#refs/heads/}"  # fully-qualified ref -> the short name
    [ -n "$ref" ] || continue

    # A target carrying a glob metacharacter names a SET of refs and updates
    # every branch it matches, so it cannot be cleared against the protected set
    # without expanding it — which this guard must not do. Refuse it and make
    # the caller name the branch. This sits ahead of the protected-set tests
    # below, so a protected namespace glob (`<ns>/*`) is refused here with the
    # wildcard reason rather than by matching its own pattern: same outcome.
    case "$ref" in
      *\**|*\?*|*\[*)
        deny "Blocked: '$tok' is a wildcard refspec, so it can update every branch it matches, including the protected set ($patterns_desc). Name the branch you mean."
        ;;
    esac

    # Test the token WHOLE first. That ordering is what preserves a configured
    # pattern carrying a slash: a protected namespace ref matches its own
    # `<ns>/*` pattern here and is refused before anything is stripped off it.
    if ref_protected "$ref"; then
      deny "Blocked: '$tok' targets protected branch '$ref' (protected set: $patterns_desc). The autonomous flow never pushes, merges or rebases onto a protected branch."
    fi

    # Only now, and only for a token that did not match as written, remove a
    # single leading `<remote>/` segment and re-test: `<remote>/<protected>` ->
    # `<protected>`, while `<remote>/<ns>/1.2` keeps enough of itself to still
    # match a namespace pattern.
    case "$ref" in
      */*)
        short="${ref#*/}"
        if [ -n "$short" ] && ref_protected "$short"; then
          deny "Blocked: '$tok' targets protected branch '$short' (protected set: $patterns_desc). The autonomous flow never pushes, merges or rebases onto a protected branch."
        fi
        ;;
    esac
  done
fi

# 2) A push/merge/rebase issued while HEAD is on a protected branch — the case
#    where the protected branch is never written in the command at all
#    (`git push`, `git push <remote>`, `git push --force`). See the header for
#    why this is not narrowed to a command with no argument tokens.
branch=$(hc_current_branch "$root")
if [ -n "$branch" ] && ref_protected "$branch"; then
  deny "Blocked: push/merge/rebase while HEAD is on protected branch '$branch' (protected set: $patterns_desc). The autonomous flow never operates on a protected branch."
fi

# Nothing provable — stay silent and let the permission system decide (it keeps
# `git push` on `ask`, so an ordinary feature-branch push still stops there).
exit 0
