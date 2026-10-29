#!/usr/bin/env bash
# platform.sh — the sandbox probe's platform: SP_PLATFORM, the platform name the probe measures
# (`sp_platform_of`), the one spelling of the bwrap and socat lookups (`sp_prereq_cmd`) and the host
# stamp every run records on stderr (`sp_stamp`).
#
# THE RULE THIS FILE EXISTS FOR. Every Linux-only arm in the probe tests SP_PLATFORM = `linux`, so with
# it empty or `macos` the probe behaves exactly as it did before the Linux legs.
#
#   sp_platform_of <uname -s output>  prints `macos` for Darwin, `linux` for Linux; anything else,
#                                     empty included, prints nothing and returns 1. Reads only its argument.
#   sp_prereq_cmd bwrap|socat         prints the command name the probe looks up; any other argument
#                                     prints nothing and returns 1
#   sp_stamp                          one stderr line per key, `sandbox-probe: stamp: <key>: <value>`, in
#                                     a fixed order; each value is that command's first output line
#     linux:     uname -a, distribution (PRETTY_NAME, unquoted; `absent` when the file has none),
#                bwrap --version, socat -V (its first line carrying `socat version`), git --version,
#                agent cli --version, kernel.apparmor_restrict_unprivileged_userns (`absent` when the
#                file does not exist), caller (`root` or `non-root (uid <n>)`)
#     otherwise: uname -a, macOS (sw_vers -productVersion), git --version, agent cli --version, caller
#   A command that does not resolve on PATH gives `not found`; a file that cannot be read gives
#   `unreadable`. It spawns every command with 2>/dev/null, prints nothing on stdout and returns 0.
#
# TEST-ONLY SEAMS. An unset or empty value means the default.
#   SANDBOX_PROBE_BWRAP          replaces `bwrap`; a name that resolves nowhere stands for a host lacking it
#   SANDBOX_PROBE_SOCAT          replaces `socat`, likewise
#   SANDBOX_PROBE_OS_RELEASE     replaces /etc/os-release
#   SANDBOX_PROBE_APPARMOR_FILE  replaces /proc/sys/kernel/apparmor_restrict_unprivileged_userns
#   SANDBOX_PROBE_AGENT_CLI      replaces `claude`, as preflight.sh reads it
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_PLATFORM=""

sp_platform_of() {
  case "${1-}" in
    Darwin) printf '%s\n' macos ;;
    Linux) printf '%s\n' linux ;;
    *) return 1 ;;
  esac
}

sp_prereq_cmd() {
  case "${1-}" in
    bwrap) printf '%s\n' "${SANDBOX_PROBE_BWRAP:-bwrap}" ;;
    socat) printf '%s\n' "${SANDBOX_PROBE_SOCAT:-socat}" ;;
    *) return 1 ;;
  esac
}

sp__stamp_line() {
  printf 'sandbox-probe: stamp: %s: %s\n' "$1" "$2" >&2
}

# sp__stamp_cmd <key> <command> [args...] — the command's first output line, or `not found`.
sp__stamp_cmd() {
  local key="$1" out line=""
  shift
  if ! command -v "$1" >/dev/null 2>&1; then
    sp__stamp_line "$key" "not found"
    return 0
  fi
  out="$("$@" 2>/dev/null)"
  IFS= read -r line <<EOF
$out
EOF
  sp__stamp_line "$key" "$line"
}

sp__stamp_distribution() {
  local file="${SANDBOX_PROBE_OS_RELEASE:-/etc/os-release}" line value="absent"
  if [ ! -r "$file" ] || [ -d "$file" ]; then
    sp__stamp_line distribution unreadable
    return 0
  fi
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      PRETTY_NAME=*)
        value="${line#PRETTY_NAME=}"
        case "$value" in
          \"*\") value="${value#\"}"; value="${value%\"}" ;;
          \'*\') value="${value#\'}"; value="${value%\'}" ;;
        esac
        break
        ;;
    esac
  done <"$file"
  sp__stamp_line distribution "$value"
}

sp__stamp_socat() {
  local cmd out line value=""
  cmd="$(sp_prereq_cmd socat)"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    sp__stamp_line "socat -V" "not found"
    return 0
  fi
  out="$("$cmd" -V 2>/dev/null)"
  while IFS= read -r line; do
    case "$line" in
      *"socat version"*) value="$line"; break ;;
    esac
  done <<EOF
$out
EOF
  sp__stamp_line "socat -V" "$value"
}

sp__stamp_apparmor() {
  local file="${SANDBOX_PROBE_APPARMOR_FILE:-/proc/sys/kernel/apparmor_restrict_unprivileged_userns}" line=""
  if [ ! -e "$file" ]; then
    sp__stamp_line kernel.apparmor_restrict_unprivileged_userns absent
  elif [ ! -r "$file" ] || [ -d "$file" ]; then
    sp__stamp_line kernel.apparmor_restrict_unprivileged_userns unreadable
  else
    IFS= read -r line <"$file"
    sp__stamp_line kernel.apparmor_restrict_unprivileged_userns "$line"
  fi
}

sp__stamp_caller() {
  local uid
  if ! command -v id >/dev/null 2>&1; then
    sp__stamp_line caller "not found"
    return 0
  fi
  uid="$(id -u 2>/dev/null)"
  if [ "$uid" = "0" ]; then
    sp__stamp_line caller root
  else
    sp__stamp_line caller "non-root (uid ${uid})"
  fi
}

sp_stamp() {
  sp__stamp_cmd "uname -a" uname -a
  if [ "${SP_PLATFORM-}" = "linux" ]; then
    sp__stamp_distribution
    sp__stamp_cmd "bwrap --version" "$(sp_prereq_cmd bwrap)" --version
    sp__stamp_socat
  else
    sp__stamp_cmd macOS sw_vers -productVersion
  fi
  sp__stamp_cmd "git --version" git --version
  sp__stamp_cmd "agent cli --version" "${SANDBOX_PROBE_AGENT_CLI:-claude}" --version
  if [ "${SP_PLATFORM-}" = "linux" ]; then
    sp__stamp_apparmor
  fi
  sp__stamp_caller
  return 0
}
