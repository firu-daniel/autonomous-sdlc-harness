#!/usr/bin/env bash
# allow-safe-compounds.sh — PreToolUse guard for Bash: auto-allow a COMPOUND
# command — or the one single statement that is a `git -C <workspace dir> …` —
# when EVERY piece of it begins with a known-safe prefix. It emits `allow` or
# NOTHING — it never denies and never asks.
#
# WHY IT EXISTS. The permission system matches a command as one opaque string,
# so a block such as `mkdir -p <dir> && git add <path> && git status` is refused
# even though each piece on its own is allow-listed and would run without a
# prompt. Interactively that costs a prompt; in an unattended run an unanswerable
# prompt is a stall. This guard reads the compound apart and grants it only when
# EVERY piece is judged against the same safe-prefix set the bare spelling of that
# piece would be judged against — including a piece that names a workspace
# directory with `git -C <dir>` or `<runner> --prefix <dir>`, which is rewritten to
# its directory-free form and judged on its SUBCOMMAND. What rides along on a
# matched prefix — a redirect, a pipe, trailing flags — is the leading-words limit
# documented at "PREFIX MATCHING IS EXACTLY THAT" below, and it is the same limit a
# single statement carries.
#
# WHAT THIS GUARD IS HANDED: a COMPOUND — separated by `&&`, `||`, `;` or a
# newline — OR a single statement that names a workspace directory with
# `git -C <dir>`. Nothing else: a single statement with no `-C` never reaches the
# piece loop. A PIPE ADMITS NOTHING AND SEPARATES NOTHING — a piece is never split
# on `|`, so unless the command is the `git -C` shape above, one whose only
# separator is a pipe never reaches this guard at all and is answered by the
# permission profile. That is a deliberate limit and shipped text depends on it:
# a helper script exists specifically to wrap one frequently-needed pipe in a
# single allow-listed command, precisely because this guard would not cover it.
#
# WHY THAT ONE SINGLE STATEMENT AND NO OTHER. Every other single statement is
# already answered by the generated profile's own verb prefixes — thirteen of
# them for git — and each is a PREFIX match anchored at the START of the command
# string, so `git -C <dir> status` matches NONE of them: the directory sits
# between `git` and the verb. It is the one spelling the profile cannot express,
# and the one the harness's own generated worktree script and instruction text
# push agents toward. It is admitted by letting it into the SAME piece loop, not
# by a new rule — the ROUTE IN IS THE SAME TOO: the admission test hands the
# command to `hc_clean_piece` before the walker, so a blank-padded or grouped
# spelling is trimmed and peeled exactly as a piece is. Then
# `hc_git_piece_in_workspace` rewrites it to its directory-free form and
# `is_safe` judges the SUBCOMMAND against `hc_safe_prefixes`, exactly as
# it judges that same piece inside a compound today, and everything that helper
# refuses — a relative `-C`, a `..` segment, a character outside
# `[A-Za-z0-9._/-]`, a directory outside the workspace, an absent subcommand —
# falls through to silence exactly as it does inside a compound. THE
# LEADING-WORDS LIMIT COMES WITH IT, unchanged: a matched prefix carries its tail
# (`PREFIX MATCHING IS EXACTLY THAT` below), so `git -C <dir> status | <anything>`
# is an allow here — as that same piece already is inside a compound. So the `-C`
# spelling reaches the compound set rather than the profile's thirteen verbs —
# the base set's `git blame`, `git grep` and `git rev-list` included — which is
# the same set that same piece already reaches inside a compound. WIDENING THE
# PREFILTER TO EVERY SINGLE STATEMENT WOULD NOT BE THAT CHANGE: it would extend
# the same reach to every bare command an adopter configures in `commands.*`,
# which is a capability change where this is a spelling one.
#
# A BARE `&` IS SPLIT ON, BUT IT DOES NOT ADMIT A COMMAND. `hc_split_command`
# treats a bare `&` as the statement separator every POSIX shell reads it as.
# Without that, `git status && ls & rm -r-f <dir>` was ONE piece, judged on
# `git status`, and this guard vouched for the `rm` — a `git branch -D` too,
# which `hc_piece_is_never_safe` exists to make unreachable from here. The
# ADMISSION TEST above is deliberately not widened to match: a command whose only
# separator is a bare `&` reaches the piece loop only when it is the `git -C`
# shape above, and then every statement the `&` separates is judged on its own
# terms; anything else gets no allow, exactly as a piped one does not. So the `&`
# can only ever COST an allow here, never grant one. Which `&` separates — and
# the three redirection spellings that do not, `&>` / `>&` / `<&` — is in
# `hc_bare_amp_head`.
#
# CONTROL FLOW FALLS THROUGH, BY CONSTRUCTION. Splitting `<cmd> ; if [ … ]; then
# <cmd> ; fi` on `;` yields pieces beginning `if [ …`, `then <cmd>` and `fi` —
# none of which is a safe prefix — so the whole command falls through to the
# permission profile. Shipped instruction text cites this behaviour by name when
# it tells an unattended flow to issue two separate single statements rather than
# an exit-code-gated block; keep the splitting semantics and that text stays
# true. Plain and newline-separated single statements are unaffected, save the
# one `git -C <workspace dir>` shape above.
#
# HOW A PIECE IS MATCHED. Backslash line-continuations are joined FIRST, so a
# wrapped argument list stays one piece instead of becoming per-line fragments
# that match no prefix. Each piece is then trimmed and has subshell grouping
# parens peeled — a piece written `(<cmd> arg)` is matched on its inner command,
# not on `(<cmd>`. An empty piece is safe. A piece matches when it equals a safe
# prefix or begins with that prefix followed by a space.
#
# PREFIX MATCHING IS EXACTLY THAT, AND THE LIMIT IS INHERITED FROM THE PROFILE.
# A piece is judged by its leading words only: whatever follows the matched
# prefix rides along on the allow — a pipe, a redirect, a here-string, a closed
# command substitution. That is the same limit a `Bash(<prefix>:*)` rule carries
# on the bare spelling of that piece, and holding to it IS the contract here: a
# compound costs what its pieces cost separately, no more and no less. Narrowing
# it closes nothing — each piece stays allowed on its own, one prompt at a time
# — and would move the real limit out of the profile an adopter can read into a
# hook they cannot configure; so nothing broader than the one narrowing below is
# narrowed here. ONE THING NO LONGER RIDES ALONG: a bare `&` ENDS the piece, so
# the statement after it is judged on its own terms rather than carried by the
# prefix in front of it.
#
# THIS GUARD DOES NOT STRIP A TRAILING REDIRECT; THE SIBLING REWRITE GUARD DOES.
# On a piece matched by leading words the difference is invisible — the redirect
# rides along either way, per the paragraph above. It is visible only on the arms
# that match EXACTLY: `<pkg-manager> --prefix <dir> 2>/dev/null` costs one prompt
# here and is an allow there, which is the whole measured divergence between the
# two. Keeping the strip out of this guard keeps its rule single — leading words,
# nothing rewritten first — and that one spelling is what it costs.
#
# THE ONE NARROWING: A TORN COMMAND SUBSTITUTION. `hc_split_command` splits on
# `&&` / `||` / `;` / a bare `&` TEXTUALLY, so a separator inside `$(…)` tears
# the substitution in half and leaves the fragment `echo $(rm -rf <dir>` matching
# the `echo` prefix while the command it came from actually runs the `rm`. A piece
# carrying a command substitution that never CLOSES inside the piece therefore
# withholds the whole allow, exactly as an unsafe piece does. The test is
# `hc_torn_substitution`, which tracks `$(` NESTING DEPTH — it is not a balance
# or parenthesis-count check, and rewriting it into one reopens the hole in one
# direction or silences an ordinary `sed`/`grep` regex group in the other; the
# library comment carries both measurements. It runs on the RAW piece, before
# `hc_clean_piece` peels a legitimate trailing `)`. Its two costs are refusals of
# pieces that would otherwise have been allowed — a lone literal backtick, and a
# literal `$(` inside quotes such as `grep '$(' f.txt` — which cost a prompt, not
# a wrong allow.
#
# WHAT BOUNDS THE REST, READ NARROWLY. This guard produces only `allow` or
# silence, and a deny rule that MATCHES THE COMMAND STRING is evaluated before
# any allow and cannot be overridden. That bound is narrower than it first
# sounds: an adopter's `Bash(rm -rf:*)` is a PREFIX match anchored at the start
# of the command string, so it fires on `rm -rf <dir>` and NOT on an occurrence
# nested inside another command. What a deny actually holds back is what its
# pattern literally matches, not everything the adopter meant to forbid.
#
# THE PREFIX SET IS CONFIGURED, NOT BAKED IN. It is the shared library's
# stack-neutral base set (see `hc_safe_prefixes` — most of it is read-only, not
# all: `git add`, `git stash`, `git fetch`, `git worktree` and `mkdir -p`
# mutate, and the leading-words matching above carries `sed -i` and
# `find … -delete` along) plus the adopter's own `commands.*` strings (and,
# while `phases.parity` is true, `parity.toolchainCommands`). No reference
# stack's interpreter, package manager or SDK command name survives as a literal
# here; an adopter who uses one gets it back by configuring it.
#
# THE ONE CLASS NO PREFIX MAY VOUCH FOR. Leading-words matching carries a
# prefix's destructive forms along with it: the base set's `git branch` — the
# listing form the flow needs — also covers `git branch -D <x>`, which is one of
# the forms the generated permission profile puts on its `deny` FLOOR, and that
# floor is anchored at the START of the command string so it never fires on a
# piece sitting inside a compound. `is_safe` therefore calls
# `hc_piece_is_never_safe` BEFORE every other test, and the library documents
# which `git branch` options it refuses (those that delete, rename or overwrite a
# ref) and which spellings stay granted.
#
# THE PATH-ANCHORED ARMS — the prefixes that name a per-checkout directory — are
# built by the shared library's `hc_path_anchored_patterns`, which both guards
# call and which documents the mechanism, the derivation and why the arms are
# `case` globs rather than filesystem lookups. They cover `cd <dir>` and the
# exact, tail-free `<pkg-manager> --prefix <dir>`. THE TWO SHAPES THAT CARRY A
# SUBCOMMAND AFTER THE DIRECTORY — `git -C <dir> …` and
# `<pkg-manager> --prefix <dir> …` — ARE DELIBERATELY NOT ARMS: an arm matches on
# the directory alone, so the subcommand rides along on it. They go through
# `hc_git_piece_in_workspace` / `hc_runner_piece_in_workspace`, which rewrite the
# piece to its directory-free form so `is_safe` judges the subcommand against
# `hc_safe_prefixes` — the same set the bare spelling is judged against. Both
# helpers refuse a directory that is relative, carries a `..` segment, carries any
# character outside `[A-Za-z0-9._/-]` (so no unexpanded substitution, quote, glob
# or brace reaches a textual workspace test), or lies outside the workspace; the
# library carries the measurements for why that last test is a whitelist.
#
# FAIL-CLOSED TABLE — an allow-only guard fails closed by staying SILENT, not by
# answering something else. Silence defers to the permission profile, which still
# prompts for whatever it would have prompted for:
#
#   payload does not parse, or `jq` is absent  -> silent (no command to judge)
#   command carries no `&&` / `||` / `;` / newline -> silent (nothing this guard
#     and is not a `git -C <dir> <subcommand>`      is handed; a bare `&` alone
#                                                   admits nothing either — see
#                                                   the note above)
#   anchor is not inside a git repository      -> silent
#   repository has no harness.config.json      -> silent (no jurisdiction)
#   configuration unreadable or invalid JSON   -> silent, and NO built-in
#     (`hc_safe_prefixes` returns 1)              fallback prefix list
#   workspace will not resolve                 -> silent (no path-anchored arms)
#     (`hc_path_anchored_patterns` returns 1)
#   any piece matches no safe prefix           -> silent
#   any piece is a `git branch` that deletes,  -> silent (`hc_piece_is_never_safe`,
#     renames or overwrites a ref, or whose        whatever prefix it matched)
#     flags this test cannot read
#   any piece carries a command substitution   -> silent (a torn fragment; see
#     that never closes inside it                 the narrowing above)
#   every piece matches                        -> allow
#
# JURISDICTION IS A DELIBERATE SCOPING DECISION. A repository with no
# `harness.config.json` at its resolved root has not adopted the harness, so this
# guard grants nothing there — a plugin hook fires in EVERY session the plugin is
# enabled for, including repositories that never ran `init`. The repository is
# resolved from the command the hook was handed (the first `git -C <dir>`, else a
# leading `cd <dir>`, else the payload's own `.cwd`, else `$PWD`) — never from a
# path written in this file — so one registration serves every checkout and every
# sibling worktree.
#
# WHY `set -f`. Filename expansion is disabled for the whole script as a
# prophylactic: nothing here expands a variable in a word-splitting position
# today, but a piece of a command string must never be expanded against the
# filesystem, and the sibling rewrite guard had exactly that defect. `set -f`
# does NOT affect `case` pattern matching, so the path-anchored arms keep their
# wildcards.
#
# REPRO — reproduce any decision by hand; the payload goes in on stdin. <repo> is
# a checkout that has adopted the harness, <work_root> its parent directory and
# <project_name> its configured name:
#
#   printf '{"tool_input":{"command":"git status && ls"},"cwd":"<repo>"}' \
#     | bash plugin/hooks/allow-safe-compounds.sh
#
#   ALLOW (prints one JSON object carrying permissionDecision "allow") — same
#   payload shape, differing only in the "command" string:
#
#     git status && ls                          two read-only prefixes
#     <commands.typecheck> && <commands.test>   the adopter's own configured pair
#     (git status) && pwd                       grouped piece, parens peeled
#     git add a \<newline>  b && git status     continuation joined first
#     cd <repo> && git status                   path-anchored arm
#     cd <work_root>/<project_name>-<branch> && git status
#                                               sibling-worktree arm
#     git -C <repo> status && git -C <repo> log directory-scoped, safe subcommand
#     git status && ls 2>&1                     a redirection `&` is not a separator,
#                                               nor is `&>` / `&>>` / `>&` / `<&`
#     git -C "<repo>" status && ls              ...and its quoted spellings ('…' too) —
#                                               the directory is de-quoted before it is
#                                               judged; docs/guard-verification.md §2.5
#     <runner> --prefix <app_dir> <tail of a configured commands.* string>
#                                               directory-scoped runner, safe tail
#     git -C <repo> rev-parse --show-toplevel   the ONE non-compound shape: no
#                                               separator, directory-scoped, safe
#                                               subcommand — judged by the same piece
#                                               loop as the compound rows above
#     git -C <repo> status --short              ...same shape, second subcommand
#     git -C "<repo>" status --short            ...and its quoted spellings ('…' too)
#     git -C <work_root>/<project_name>-<branch> status --short
#                                               ...and a sibling worktree's directory
#     (git -C <repo> status --short)            ...grouped, parens peeled
#      git -C <repo> status --short             ...and blank-padded: the admission
#                                               test cleans the command before the
#                                               walker, as the piece loop cleans a
#                                               piece
#
#   NO OUTPUT, exit 0:
#
#     git status && rm -rf <dir>                a piece matching no prefix
#     git status && ls & rm -rf <dir>           a bare `&` ends the piece, so the
#                                               statement behind it is judged too
#     git status && ls |& rm -rf <dir>          ...`|&` included: its `&` separates
#     git status && echo $(ls & rm -rf <dir>)   ...and one inside `$(…)` tears it
#     git status && echo "a & b"                the split reads no quoting, for this
#                                               separator or any other, so a separator
#                                               byte inside a quoted argument costs
#                                               one prompt — same as `"a ; b"`
#     git status && git branch -D <branch>      a form the generated deny floor
#                                               lists, riding on `git branch`
#     git status && git branch -q -D <branch>   ...and one its start-anchored deny
#                                               would miss even on its own
#     git status && git -C <repo> branch -M <b> ...and one behind a `-C`
#     git status && git branch "-D" <branch>    ...and one wearing quotes the shell
#                                               removes before git sees it
#     git status && git branch --list $PAT      a `git branch` whose flags are
#                                               behind an unexpanded substitution
#     git status && git -C <repo> push --all <remote>
#                                               directory in the workspace, subcommand is not safe
#     git status && git -C "<repo>" push --all <remote>
#                                               same, quoted: de-quoting reaches the
#                                               directory test, not the prefix set
#     git status && <runner> --prefix <app_dir> <subcommand not in commands.*>
#                                               same, for a directory-scoped runner
#     git status && <runner> --prefix <repo>/../<elsewhere> <configured subcommand>
#                                               a `..` segment leaves the workspace
#     git status && <runner> --prefix <repo>/${x}../<elsewhere> <configured subcommand>
#                                               ... and so does one the shell has not
#                                               expanded yet: a directory carrying any
#                                               character outside [A-Za-z0-9._/-] is
#                                               refused, quoted and substituted forms
#                                               included
#     git -C <repo> branch -D <b>               the deny floor behind a `-C`, on its
#                                               own as inside a compound — `-d`, `-M`,
#                                               `-m`, `"-D"` and `-q -D` with it
#     git -C <repo> push --all <remote>         directory in the workspace, subcommand
#                                               is not safe — on its own too
#     git -C <relative dir> status              a relative `-C` is never resolved
#     git -C <repo>/../<elsewhere> status       a `..` segment leaves the workspace
#     git status                                a single statement carrying no `-C` is
#                                               not this guard's business at all: the
#                                               profile's own verb prefixes answer it
#     echo $(rm -rf <dir>; ls)                  torn command substitution
#     echo $(rm -rf <dir> $(date); ls)          …with a nested closed one inside
#     cat a.txt | grep x                        a pipe is not a compound
#     if [ -f a ]; then bash b.sh; fi           control flow
#     cd /somewhere/else && git status          outside the workspace
#     any of the above with <commands.*> that this <repo> does not configure
#     any of the above in a <repo> whose config is invalid JSON
#     any of the above in a <repo> with no harness.config.json

set -u
set -f

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-config-lib.sh"

payload=$(cat)

# Cheapest possible filter first: these hooks fire on every Bash call, and a
# payload carrying none of the separator bytes and no ` -C ` cannot carry
# anything this guard is handed. It is a deliberate superset of the real test
# below — a JSON-encoded newline is a backslash escape, `&&` / `||` are matched
# by their single characters, and a ` -C ` present for any other reason (a `git
# diff -C`, a `ls -C`) simply reaches the real test and is dropped there — so it
# can only ever admit work, never skip it. This runs before any `jq` or `git`
# subprocess.
case "$payload" in
  *"&"*|*"|"*|*";"*|*\\*|*" -C "*) ;;
  *) exit 0 ;;
esac

# ONE `jq` for both payload fields — see `hc_payload_fields`. `.cwd` is only
# needed further down, but reading it here costs nothing extra and reading it
# separately cost a second fork on every Bash call.
hc_payload_fields "$payload" || exit 0
cmd="$HC_PAYLOAD_CMD"

# The real admission test, on the decoded command: a compound, or the ONE single
# statement this guard is handed. A bare `&` is deliberately absent from the
# separator arms even though the splitter reads it as a separator: adding it
# would let a lone `ls 2>&1` in as a "compound" and grant it, which is a
# widening, and the whole point of the `&` is to withhold allows.
#
# The last arm is the single statement. `hc_git_piece_parts` is the same walker
# the piece loop's helpers use, so the `-C` it finds is git's GLOBAL option
# reached by stepping over the other global options — the `git -c k=v … -C <dir>`
# and `--git-dir=<dir> … -C <dir>` orderings included — and never a `-C` that is
# an argument of a subcommand (`git diff -C -M <file>` and `git log -C` have no
# `HC_GIT_DIR` and are dropped here). Every other single statement is answered by
# the permission profile's own verb prefixes; this one is the spelling none of
# them can match. Whether the directory is really in the workspace, and whether
# the subcommand is safe, is decided below by exactly the tests a compound piece
# gets.
case "$cmd" in
  *"&&"*|*"||"*|*";"*) ;;
  *"
"*) ;;
  *)
    # `hc_clean_piece` FIRST, for the piece loop's own reason: `hc_git_piece_parts`
    # matches an exact `git ` prefix, so an untrimmed or grouped spelling would be
    # dropped here while the identical piece inside a compound is judged. It adds
    # one `$(…)` on this path only — the path that forks for `hc_resolve_repo_root`
    # on the next line — and no external command; the compound path is untouched.
    hc_git_piece_parts "$(hc_clean_piece "$cmd")" || exit 0
    [ -n "$HC_GIT_DIR" ] || exit 0
    ;;
esac

cwd="$HC_PAYLOAD_CWD"

# The repository this command operates on, resolved by the library's settled
# order — the anchor for jurisdiction and for every path-anchored arm below.
top=$(hc_resolve_repo_root "$cmd" "$cwd") || exit 0

# Jurisdiction: no config at that root means the harness was never adopted here,
# so there is nothing for this guard to grant.
hc_config_file "$top" >/dev/null || exit 0

# Warm the per-process configuration cache HERE, in this shell: every reader
# below runs inside a `$(…)` subshell, which inherits the cache but cannot
# write one back. Decides nothing — see the cache header in the library.
hc_config_load "$top" || :

# The prefix set comes from the library and from the adopter's own configuration.
# When it cannot be resolved there is NO fallback to a built-in list: a broken
# configuration must never widen what auto-allows.
safe_prefixes=$(hc_safe_prefixes "$top") || exit 0

# The path-anchored arms for this checkout — one `case` glob per line, built by
# the library from the resolved root and the configuration. A workspace that
# will not resolve grants nothing, on the same terms as a prefix set that will
# not.
path_anchored_patterns=$(hc_path_anchored_patterns "$top") || exit 0

# A piece is safe when it is empty, matches a path-anchored arm, or equals a safe
# prefix / begins with one followed by a space — and is not one of the shapes no
# allow-only guard may vouch for whatever it matches.
is_safe() {
  local piece="${1-}" prefix rewritten
  [ -n "$piece" ] || return 0
  # FIRST, so no arm below can vouch for it: the prefix set matches leading words
  # only, so its `git branch` entry would otherwise carry `git branch -D <x>` —
  # one of the forms the generated permission profile denies outright, and which
  # its start-anchored deny cannot reach inside a compound. `hc_piece_is_never_safe`
  # parses the piece, so it needs no rewritten form to see through a `git -C <dir>`.
  hc_piece_is_never_safe "$piece" && return 1
  if hc_matches_any_pattern "$piece" "$path_anchored_patterns"; then
    return 0
  fi
  # A piece that names a workspace directory with `git -C` or `<runner> --prefix`
  # is judged on its SUBCOMMAND, against the same set the bare spelling is judged
  # against — the directory is the part that differs per checkout, the subcommand
  # is not. Either helper returns 1 (printing nothing) unless the directory is
  # absolute, free of `..`, composed only of ordinary path characters and inside
  # the workspace.
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

# One unsafe piece silences the whole command — the allow is all-or-nothing.
# `hc_split_command` joins backslash line-continuations before splitting, and
# `hc_clean_piece` trims and peels grouping parens.
#
# `hc_torn_substitution` runs FIRST, on the RAW piece, because cleaning peels a
# legitimate trailing `)` and would make the balanced `cat f.txt || echo $(date)`
# look torn. A torn piece withholds the whole allow exactly as an unsafe one
# does: its leading words say nothing about what the substitution actually runs.
while IFS= read -r piece; do
  hc_torn_substitution "$piece" && exit 0
  is_safe "$(hc_clean_piece "$piece")" || exit 0
done <<EOF
$(hc_split_command "$cmd")
EOF

jq -nc '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow",
    permissionDecisionReason: "Every piece matches a known-safe prefix"
  }
}'

exit 0
