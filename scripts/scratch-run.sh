#!/usr/bin/env bash
# scratch-run.sh — run ONE file that lives under `<state_dir>/scratch/`, in the
# interpreter that file's own extension names, and refuse every other path.
#
# WHAT IT IS FOR. The two things a dispatched agent otherwise has no permitted
# route to do: a LANGUAGE PROBE — run a few lines in the project's own language
# before the code that would answer the question exists — and a MUTATION CHECK —
# break an implementation on purpose to prove a new test fails. Without a route
# the agent either reaches for an interpreter and is refused, or silently
# downgrades a claim it meant to verify from *executed* to *reasoned*.
#
# WHY A WRAPPER EXISTS AT ALL. Same reason as its siblings: an invocation of a
# script path under the configured scripts directory is allow-listed literally in
# three forms by the generated permission profile (this file's row in
# `cli/src/generators/outerLoopScripts.ts` carries `agentInvocable: true`) and is
# auto-allowed by the script-allowlist guard — a script under that directory
# whose basename is not on the guard's deny list, in a command carrying none of
# `$(…)`, a backtick, `|`, `<`, a braced form other than a bare `${IDENT}`, or a
# `>` that is neither a descriptor duplication (`2>&1`, `>&2`, `2>&-`) nor a
# redirection to the literal `/dev/null`. A bare `python3 …` command line is
# matched statically by neither and draws a prompt an unattended run cannot
# answer. This basename is deliberately NOT on that deny list, and its absence
# there is the decision that makes the guard route cover this script from the
# first run, whether or not the profile has been regenerated.
#
# WHAT THIS DOES NOT CONTAIN. The first argument is a path and every remaining
# argument is forwarded to the file, so nothing here takes an inline program — no
# `-c`, no `-e`, no `bash -c`. That fence is over WHICH FILE RUNS and over nothing
# the file does. A probe is a program the agent composed one tool call earlier and
# it runs with the session's own privileges, so everything the generated profile's
# `deny` floor and its `ask` list, and the script-allowlist guard's
# `DENY_SCRIPT_BASENAMES`, withhold from a COMMAND STRING is reachable from inside
# one — directly, or one `subprocess` / `child_process` call further on. Do not
# read the file/string distinction as a capability boundary: it costs an extra
# tool call. The layer that still holds is the `pre-push` git hook, because git
# runs it however git was invoked, subprocess included — the ranking
# `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`'s protected-branch bullet states.
# The two mitigations that do apply are narrower than containment and are named as
# what they are: `<state_dir>/scratch/` is gitignored by its contents, so nothing
# run from here reaches a commit, and the agent instructions require a MUTATION
# CHECK to be reverted before the task's own verification runs.
#
# THE REFUSAL IS THE WHOLE OF THE SAFETY — over WHICH FILE, and over nothing
# else, per the paragraph above. This script executes what it is given, so the
# only thing standing between it and an arbitrary FILE is the path test below: the argument is rejected outright if it carries `..` or any
# character outside `A-Za-z0-9._/-`, and what is left must resolve strictly
# inside `<repo_root>/<state_dir>/scratch/`. A relative argument resolves against
# `<repo_root>`; an absolute one is compared as given. Both sides of the
# comparison are resolved PHYSICALLY (`cd … && pwd -P`), so a symlinked directory
# planted inside the scratch tree cannot name a target outside it, and a target
# that is itself a symlink is refused rather than followed. The `..` test rejects
# the two characters anywhere in the argument rather than only a whole segment —
# strictly stronger, and free, because nothing in that directory depends on a
# file's name.
#
# THE INTERPRETER COMES FROM THE FILE'S OWN EXTENSION. The table is below, and it
# is the only place it is stated. NOT from the detected preset, on two grounds
# that both survive reading `DETECTION_PRESET_NAMES` (`cli/src/config/model.ts`).
# A preset covers the repository's LAYOUT rather than its toolchain: some names in
# `DETECTION_PRESET_NAMES` imply a language and others imply none, and which
# language a repository is actually probed in is settled by `commandFamilies`
# (`cli/src/detect/presets.ts`), not by the preset. So a preset-derived entry
# reads the wrong field — silent wherever the preset names no toolchain, and
# wrong wherever a probe's language is not the one the preset implies. And it
# would be the wrong SHAPE regardless: a preset-derived profile entry
# is a `Bash(<interpreter>:*)` grant over every command line that interpreter can
# be handed, which is the breadth the profile `_README`'s package-manager
# paragraph refuses — while this table grants nothing at all, the reachability
# coming from this script's own row. NOT from a configuration key either: the
# family that answered IS recorded, as `detection.commandFamily`, and this table
# is still not derived from it — a family id answers which toolchain answered for
# the command keys, not what interpreter a scratch file needs, and a
# family-derived entry would be the same over-broad `Bash(<interpreter>:*)` grant
# that paragraph refuses. An extension the table
# does not carry is refused by name, listing the ones that are — never guessed,
# and never run under `sh`.
#
# WHAT THAT COSTS, STATED RATHER THAN LEFT TO BE DISCOVERED. The table is a CLOSED
# seven-extension set with NO ADOPTER EXTENSION POINT: no configuration key, no
# flag, and the file ships fixed. Its `<extension>:<interpreter>` shape is a SINGLE
# token run as `exec "$interpreter" "$target" "$@"`, so it cannot express a
# two-word toolchain invocation — `go run`, `cargo`, `dotnet script`. THAT is what
# bounds the set, and it bounds it by TOOLCHAIN rather than by adoption: the
# stacks with no probe route here are the ones whose file is not run by a single
# token — Go, Rust, .NET, Swift, the JVM and Android, C++. Every language a
# `commandFamilies` function (`cli/src/detect/presets.ts`) covers that DOES run a
# source file as `<token> <file>` is carried: Node, Python, Ruby, Dart and PHP.
# Where an adoption's language is not one this table carries there is no probe
# route here at all, and what an agent has instead is the evidence downgrade
# `plugin/agents/layer-implementer.md` requires of it (its *An evidence downgrade
# is recorded* paragraph) — the claim recorded as reasoned rather than executed.
# Widening the set to a two-word toolchain is a decision for a later round,
# carried as a residual in `docs/outer-loop-verification.md` §4.
#
# THE RUN MUST NEVER SEE A FILE FROM HERE IN A COMMIT. `<state_dir>/scratch/` is
# ignored by its CONTENTS — the managed block in the generated `.gitignore`, with
# a negation for that directory's own README — so a probe cannot be committed by
# accident. The other half of that duty belongs to the agent rather than to this
# script: a MUTATION CHECK is REVERTED before the task's own verification runs,
# because the committer will see that suite and it has to be clean.
#
# IT IS DELIBERATELY NOT A WRAPPER. It carries no adopter command line — it is
# not a `WRAPPER_SCRIPTS` row, answers to no `commands.*` key, and has no
# `{{command}}` for `init` to inline. Like every outer-loop script it ships fixed
# and reads `harness.config.json` at run time.
#
# IT PRINTS NOTHING OF ITS OWN ON THE RUN PATH. The file's stdout and stderr are
# the answer, and a caller reading a probe's output must not have to filter a
# wrapper's verdict line out of it — the opposite of the project-command
# wrappers, whose one verdict line is their contract. Every refusal, and only a
# refusal, prints `scratch-run.sh: …` on stderr.
#
# Usage: scratch-run.sh <file-under-state-dir-scratch> [<arg>...]
#   <file>     the file to run; relative to <repo_root>, or absolute
#   <arg>...   forwarded to that file, unchanged
#
# Exit map a caller can switch on. A run passes the file's OWN status through
# untouched, so the refusal codes cannot be exclusive — a probe is free to exit
# 65. The reliable signal that NOTHING ran is the `scratch-run.sh:` line on
# stderr; the codes are for telling one refusal from another:
#
#   0-N  the file ran; this is its own exit status, unmodified
#   64   usage error — no file argument
#   65   path refused — a `..`, a character outside `A-Za-z0-9._/-`, a symlink,
#        or a target that does not resolve inside <state_dir>/scratch/
#   66   the extension has no interpreter in the table below
#   67   the file is not there, or is not a readable regular file
#   68   the run-time context could not be established — the shared library is
#        unreadable, this is not a git repository, `harness.config.json` could
#        not be resolved, or the scratch directory has never been materialized
#   69   the interpreter the extension names is not on PATH
#
# REPRO — reproduce any decision by hand, against a throwaway fixture:
#
#   d=$(mktemp -d); git -C "$d" init -q -b feat_x
#   printf '%s' '{"version":1,"defaultBranch":"main","stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   mkdir -p "$d/sdlc-harness/scratch"
#   printf 'import sys\nprint("ok", sys.argv[1:])\n' > "$d/sdlc-harness/scratch/probe.py"
#   cp -R <scripts_dir>/. "$d/scripts/"   # this file and its lib/
#
#   the probe       (cd "$d" && scripts/scratch-run.sh sdlc-harness/scratch/probe.py a b)
#                   -> prints `ok ['a', 'b']`, exit 0
#   its own status  a probe ending `sys.exit(7)`                        -> exit 7
#   absolute form   scripts/scratch-run.sh "$d/sdlc-harness/scratch/probe.py"  -> runs
#   outside         scripts/scratch-run.sh harness.config.json          -> exit 65
#   traversal       scripts/scratch-run.sh sdlc-harness/scratch/../../harness.config.json
#                                                                       -> exit 65
#   unknown ext     mv probe.py probe.pl; same call                     -> exit 66
#   shell probe     mv probe.py probe.sh; same call                     -> exit 66
#   absent file     scripts/scratch-run.sh sdlc-harness/scratch/nope.py -> exit 67
#   unresolvable    printf 'x' > "$d/harness.config.json"; same call    -> exit 68

# Deliberately no `-e`: every refusal below is an explicit `exit`, and an
# implicit one would skip the message that says what was refused and why.
set -uo pipefail

# --- THE INTERPRETER TABLE, stated once: `<extension>:<interpreter>`, space
# separated. Both readers below derive from this one string — the lookup, and
# the refusal message that lists what is supported — so there is no second list
# to keep in step with it. Matching is exact and case-sensitive: `.PY` is an
# extension this table does not carry, and a guess is worse than a refusal.
#
# THE ONE EXTENSION THIS TABLE OMITS ON PURPOSE IS `.sh`. Not for containment —
# WHAT THIS DOES NOT CONTAIN above says why a `.py` probe reaches a shell one
# `subprocess` call further on — but because it is the row reachable by fewer
# routes than the rest, buying nothing the others do not. The script-allowlist
# guard requires EVERY `.sh` token in a command to resolve under the scripts
# directory, so `bash <scripts_dir>/scratch-run.sh <state_dir>/scratch/probe.sh`
# carries a second one that does not, and falls through to the permission system:
# it would run on the profile entry alone, drawing a prompt on an adoption whose
# guard route covers every other row. A shell probe is refused by name here, with
# the table's supported extensions in the message.
SCRATCH_INTERPRETERS='py:python3 js:node mjs:node cjs:node rb:ruby dart:dart php:php'

# The one directory under `<state_dir>` a file may be run out of. Spelled once
# here, mirroring the `scratch` row of `STATE_DIR_ENTRIES` in
# `cli/src/generators/stateDir.ts`.
SCRATCH_SUBDIR='scratch'

# The library is reached by a path computed from this script's own location — no
# session root and no runtime-substituted token is assumed.
hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "scratch-run.sh: cannot read '$hr_lib' — refusing to run anything" >&2
  exit 68
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

if [ "$#" -lt 1 ] || [ -z "${1-}" ]; then
  echo "scratch-run.sh: no file argument" >&2
  echo "  usage: scratch-run.sh <file-under-state-dir-scratch> [<arg>...]" >&2
  exit 64
fi
requested="$1"

# --- The path tests, on the argument AS GIVEN, before anything is resolved.
case "$requested" in
  *..*)
    echo "scratch-run.sh: '$requested' carries '..' — refusing, a scratch path names no parent" >&2
    exit 65
    ;;
esac
case "$requested" in
  *[!A-Za-z0-9._/-]*)
    echo "scratch-run.sh: '$requested' carries a character outside A-Za-z0-9._/- — refusing" >&2
    exit 65
    ;;
esac

# The repository is THIS FILE's own checkout, never the caller's directory: the
# three forms the permission profile emits include a sibling worktree's own copy,
# and each copy must answer for the checkout it belongs to whatever directory the
# caller stood in.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(hr_repo_root "$script_dir")"
if [ -z "$repo_root" ]; then
  echo "scratch-run.sh: '$script_dir' is not inside a git repository — refusing to run anything" >&2
  exit 68
fi

# `<repo_root>/<state_dir>/scratch`, from this repository's configuration at run
# time. The library folds "not adopted" and "unreadable" into one non-zero
# answer, and both are closed here: a configuration that cannot be read is a
# scratch directory that cannot be located.
scratch_dir="$(hr_state_path "$repo_root" "$SCRATCH_SUBDIR")"
if [ -z "$scratch_dir" ]; then
  echo "scratch-run.sh: cannot resolve '$repo_root/harness.config.json' — refusing to run anything" >&2
  echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
  exit 68
fi

scratch_real="$(cd "$scratch_dir" 2>/dev/null && pwd -P)"
if [ -z "$scratch_real" ]; then
  echo "scratch-run.sh: '$scratch_dir' does not exist — re-run 'init' to materialize the state tree" >&2
  exit 68
fi

# A relative argument resolves against <repo_root>; an absolute one is taken as
# given. Neither can carry `..` by the test above.
case "$requested" in
  /*) candidate="$requested" ;;
  *) candidate="${repo_root%/}/$requested" ;;
esac

candidate_dir="$(cd "$(dirname "$candidate")" 2>/dev/null && pwd -P)"
if [ -z "$candidate_dir" ]; then
  echo "scratch-run.sh: '$requested' names no existing directory under '$repo_root'" >&2
  exit 67
fi

# STRICTLY INSIDE: the scratch directory itself or a directory beneath it, on the
# physical path of both sides, so a symlinked directory in the tree cannot widen
# the fence.
case "$candidate_dir" in
  "$scratch_real" | "$scratch_real"/*) ;;
  *)
    echo "scratch-run.sh: '$requested' resolves to '$candidate_dir', outside '$scratch_real' — refusing" >&2
    echo "  a file is runnable here only from <state_dir>/$SCRATCH_SUBDIR/ (see that directory's README.md)" >&2
    exit 65
    ;;
esac

target="$candidate_dir/$(basename "$candidate")"
if [ -L "$target" ]; then
  echo "scratch-run.sh: '$requested' is a symlink — refusing, its target is outside this script's judgement" >&2
  exit 65
fi
if [ ! -f "$target" ] || [ ! -r "$target" ]; then
  echo "scratch-run.sh: '$target' is not a readable regular file" >&2
  exit 67
fi

# --- The interpreter, from the extension and from nothing else.
base="$(basename "$target")"
case "$base" in
  ?*.*) extension="${base##*.}" ;;
  *) extension="" ;;
esac

interpreter=""
supported=""
for entry in $SCRATCH_INTERPRETERS; do
  if [ "${entry%%:*}" = "$extension" ]; then interpreter="${entry#*:}"; fi
  if [ -z "$supported" ]; then supported=".${entry%%:*}"; else supported="$supported .${entry%%:*}"; fi
done

if [ -z "$interpreter" ]; then
  echo "scratch-run.sh: '$base' has no interpreter for extension '${extension:-<none>}'" >&2
  echo "  the table carries: $supported" >&2
  exit 66
fi

if ! command -v "$interpreter" >/dev/null 2>&1; then
  echo "scratch-run.sh: '$interpreter' (for .$extension) is not on PATH — nothing was run" >&2
  exit 69
fi

# The file, then the caller's remaining arguments, and nothing else. `exec` is
# what makes this script's exit status the file's own, with nothing added.
shift
exec "$interpreter" "$target" "$@"
