`fix_linux_sandbox_deny_placeholders` makes an unattended run work under the Linux sandbox. Today it cannot. The per-run profile write-protects paths that a run copy must **not** have, such as `.git/commondir` and `.git/config.worktree`. On Linux, Claude Code enforces a `denyWrite` entry for an absent path with a placeholder that bubblewrap mounts there. That placeholder breaks git in the run copy for the length of every sandboxed call. It can also outlive the call as a real empty file, and the wrappers then refuse that clone for good.

It comes before sandbox3b2 (#194) and sandbox3b3 (#195). Both run on Linux, and neither can produce a meaningful result while every git call in the run copy fails.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What was measured

Read the first Linux container run and the targeted check that followed it, both on 2026-10-29, Claude Code 2.1.312. They are in `docs/sandbox-verification.md`, §0 *The probe's first Linux run* and §5 F9. They were taken in Gate 15's container (`docs/development.md`, *A Linux run, in a local container*): Debian 12, bubblewrap 0.8.0, a colima VM on Ubuntu 24.04 with `kernel.apparmor_restrict_unprivileged_userns` set to `0`.

**Inside a sandboxed call, each absent path the profile denies reads as `/dev/null`.** In the targeted check, a sandboxed `ls` and `/proc/self/mountinfo` showed:

```
crw-rw-rw- 1 nobody nogroup 1, 3 … <clone>/.git/commondir
444 423 0:57 /null <clone>/.git/commondir ro,nosuid,nodev - tmpfs …
```

So git finds a `commondir`, reads it, and fails. Every git call in the run copy exits 128:

```
fatal: failed to read <clone>/.git/commondir: Permission denied
```

In the probe run that error appears 24 times. It took out these rows:

- CS3: `add`, `stash`, `switch` and `commit`;
- CL5;
- T3: `run-test-suite.sh` says the clone "is not inside a git repository";
- SR1 and SR2: `scratch-run.sh` says the same.

In the main checkout, sandboxed `git status` lists `.mcp.json` and `harness-runs/.mcp.json` as untracked. Neither file exists outside the sandbox.

**One of those paths was left on disk as a real file.** After one headless session on the run profile, a plain shell outside any sandbox found this in the clone:

```
before:  <clone>/.git/config.worktree: No such file or directory
after:   -rw-r--r-- 1 probe probe 0 Oct 29 11:34 <clone>/.git/config.worktree
```

`commondir`, listed in the profile the same way, did not persist. The wrappers run outside the sandbox, as `excludedCommands`. The targeted check showed they share the plain shell's mount namespace, as on macOS. They refuse such a clone by design: `hr_wrapper_target_check_var` in `scripts/lib/harness-run-lib.sh` stops at `'<clone>' is a clone, but <gd>/config.worktree exists, and a clone the harness made has none`. In the probe run that refusal took out CS4, R1–R3, C2, K2, CW4, CS15 and CS12. Their planted configuration was never reached.

**macOS is not affected.** Seatbelt denies by rule and creates nothing. Runs 1–3 passed CS3, CS4 and R1–R3 on the same profile shape.

## Measured: the absent-path check (2026-10-29)

This was taken after the targeted check, in the same container shape: Claude Code 2.1.312, bubblewrap 0.8.0, Debian 12 on the Ubuntu 24.04 colima VM, `kernel.apparmor_restrict_unprivileged_userns` set to `0`. The script is at the end of this issue. It read every exact `denyWrite` entry of a held probe clone's per-run profile, 35 of them; the globs were left out. Each was read from a plain shell before any session and after each phase. In phases A and B it was also read from a sandboxed call and from an excluded call. The phases:

- **A**: one session;
- **B**: a second session;
- **C**: two sessions at once, six short calls each;
- **D**: one session killed with `SIGKILL` mid-call, read 1 s and 10 s later.

There was also a reading after the probe's teardown.

| Entries | Inside a sandboxed call | Outside, after a normal session (A, B, C) | Outside, after the killed session (D) and after teardown |
|---|---|---|---|
| **Present on disk**: the wrappers and the other outer-loop scripts, `scripts/lib`, `githooks`, `<main>/.git`, the profile, `.claude/settings.json`, `harness.config.json`, the registry, the clone's `.git/config` and `objects/info/alternates` | the file itself, mounted read-only over itself | unchanged | unchanged |
| **Absent**, in the main checkout: `.mcp.json`, `.claude/settings.local.json`, `scripts/.git`. In the clone: `.mcp.json`, `.claude/settings.local.json`, `.git/hooks`, `.git/commondir`, `.git/objects/info/http-alternates` | `character special file, 0 B, nobody`, mounted from `/null (tmpfs, ro,nosuid,nodev)` | absent: the session's own cleanup removed them | **`-r--r--r-- probe 0 B` real files**, all nine. The three in the main checkout were still there after the probe's teardown |
| **Absent**: the clone's `.git/config.worktree` | a **real empty file** owned by `probe`, created when session A started (mtime 12:39:05.70, the run's own start), mounted read-only over itself | **left on disk** after A, B and C | left on disk |

Also measured:

- **git.** Inside every sandboxed call, git in the clone exits 128: `failed to read <clone>/.git/commondir: Permission denied`. git in the main checkout lists `?? .mcp.json ?? harness-runs/.mcp.json`. From the excluded call and the plain shell, git works in both checkouts after A, B and C. After D it fails in the clone even outside the sandbox: `fatal: failed to read <clone>/.git/commondir: No such file or directory`, because the leftover is empty.
- **The wrappers after a killed session.** With D's leftovers in place, `hr_wrapper_main_of <main>/scripts` (from `scripts/lib/harness-run-lib.sh`) returns 1, because of the empty `<main>/scripts/.git`. So every wrapper refuses every run with *"cannot place this script in a main checkout"* until the leftovers are removed by hand.
- **Claude Code's own placeholders leak too.** `harness-runs/.mcp.json` is not a profile entry. Claude Code denies `.mcp.json` in the `--add-dir` root on its own account. It is a `/dev/null` inside the sandbox, and it is left on disk after D. A profile change alone cannot stop that one.
- **The excluded command** shared the plain shell's mount namespace (`mnt:[4026532377]`; the sandboxed call's was `mnt:[4026532509]`). The wrappers run truly outside the sandbox on Linux.
- **Concurrency (C).** Two sessions at once, twelve calls, every one succeeded. #94008's race was not reproduced in this one attempt, which does not rule it out.

## Verified facts (checked 2026-10-29; the run has no web access, so these are given here)

- **The mechanism, upstream.** [anthropics/claude-code#94008](https://github.com/anthropics/claude-code/issues/94008) is open. Its reporter read the mechanism out of the 2.1.270 bundle. On Linux, *"for each sandbox-denied path that sits inside an allowed write root and does not exist on disk, Claude Code has bubblewrap materialise a placeholder at that path (`--ro-bind /dev/null <path>`, or `--ro-bind <tmpdir> <path>` for a directory) … bwrap `creat()`s the destination on the real filesystem"*. Claude Code records each placeholder in a per-process set, and *"when [the in-flight counter] reaches zero the process unlinks every placeholder it knows about. There is no lock, no registry, and no refcount shared with any other `claude` process."* That issue's subject is the concurrency failure: one process's cleanup deletes a mount point another process's bwrap call is about to use, and that call fails at `exec`.
- **Placeholders that survive.** [#81602](https://github.com/anthropics/claude-code/issues/81602) is open: *"Sandbox filesystem protection leaves stray placeholder files / bind mounts in project working tree"*. [#78072](https://github.com/anthropics/claude-code/issues/78072) is open: 0-byte placeholders persisting in the cwd and `$HOME`. [#26722](https://github.com/anthropics/claude-code/issues/26722) and its re-report [#79785](https://github.com/anthropics/claude-code/issues/79785) are both closed and were filed for WSL2. #79785 notes that inside the sandbox the placeholders are live mounts, so `rm` there fails with `Device or resource busy`.
- None of these issues gives a fixed version. Treat the behaviour as present in the version the plan measures, and record that version.

## What this means for the harness

1. **A sandboxed session cannot use git in its own run copy on Linux** while `.git/commondir` is denied as an absent path. A run reads git constantly: `status`, `diff`, `log`, and the gates' and scratch wrappers' "inside a git repository" checks.
2. **A leftover placeholder disables the wrappers for that clone.** The refusal is correct: an empty `config.worktree` is a file *"a clone the harness made has none"*. The defect is that the sandbox made it.
3. **Concurrent runs share the main checkout's placeholders.** `<main>/.mcp.json`, `<main>/.claude/settings.local.json` and the other `<main>` entries are absent paths in every run's profile. Per #94008, one run's cleanup can unlink a placeholder another run's call is about to mount. The absent-path check's phase C did not reproduce it in one attempt, so it is not ruled out. The plan says whether the watcher's concurrency exposes it.
4. **A killed session breaks the main checkout for every later run.** Phase D left its placeholders behind as read-only empty files, including `<main>/scripts/.git`, and that one file makes every wrapper refuse every run. A real run gets killed this way: the watcher's stall watchdog kills and resumes, a session crashes, the host reboots. Some leftovers are Claude Code's own (`<root>/.mcp.json` for each writable root), so no profile change prevents them all.

## The goal

On Linux, a run whose sandboxed sessions can use git in their run copy, and whose wrappers accept that copy after any number of sessions, **with the protection those entries give kept**:

- a `commondir`, `config.worktree` or `objects/info/http-alternates` planted in a run copy is still refused (CS12–CS14);
- a sandboxed write to each protected path is still refused (CS1, CS2);
- macOS is unchanged.

It also wants **a run that a killed or crashed session does not break**: the next launch or resume finds no placeholder left behind in the main checkout or the run copy, or is not affected by one. Removing a leftover is done outside the sandbox, only at a path the profile or Claude Code's own list names, and only when it is a 0-byte file that was not there before. A file a session planted with content is still refused, never removed.

The plan chooses the route and states why. The measurements above settle what the earlier version of this prompt asked the plan to establish. The plan re-takes them only to confirm its route: the script below, in Gate 15's container, before and after the change. It reports any entry whose behaviour differs from the table. In particular, the plan states why `config.worktree` is created as a real file and never cleaned up, when the other absent entries are `/dev/null` and are cleaned up, if the code it reads shows why, and otherwise says that it is unknown.

Routes to weigh, not a prescription:

- **Keep the protection without making the path appear.** For example, protect the containing directory on Linux, where git and the run do not need to write into it, and say why that is enough for each entry.
- **Drop the absent-path entries on Linux only,** resting the protection on the wrappers' existing refusal of a planted file (CS12–CS14) and the `Edit` deny rules. State what a session could then do with a planted `commondir` or `config.worktree` before any wrapper runs. Sandboxed git in that copy would follow it.
- **Recover from leftovers outside the sandbox.** For example, the watcher, before it launches or resumes a run, or the run copy's teardown. Name the trigger, the exact paths and the 0-byte, read-only, not-there-before test, and say what happens to Claude Code's own placeholders, which no profile change prevents.
- **Whatever the route, the wrappers' refusal of an existing `commondir`, `config.worktree` or `http-alternates` stays as it is.** A wrapper that accepts an empty file is not a fix.

If the plan finds a route only works with a Claude Code change, write the upstream report for the maintainer to file on anthropics/claude-code, citing #94008 and #81602. Also write the harness's interim position, and state what an adopter on Linux can and cannot run until then.

**Also in scope:**

- `doctor`'s `profile-write-protection` check and its Linux note. Today it says only that how *"the Linux sandbox treats a sandbox.filesystem.denyWrite entry containing * is unverified"*. Bring it into line with what the plan measures.
- `docs/cli.md`'s Linux statements on the same point.
- The §5 F9 row's follow-up cell.

## Constraints

- **No measured result is invented.** Every Linux claim the branch makes rests on a container measurement it records, with the Claude Code and bubblewrap versions.
- **macOS verdicts on the recorded evidence are unchanged**, and fixtures show it.
- **The wrappers' trust checks are not weakened.** A planted file is refused exactly as today.
- The probe's legs that this defect blocked (T3, SR1, SR2, CS3, CS4, CL5, R1–R4, C2, K2, CW4, CS15 and CS12) are re-taken on Linux after the fix. They are recorded on a record branch of their own, not on this one.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.

<details>
<summary>The absent-path check's script (<code>measure.sh</code>, run as <code>probe</code> while <code>sandbox-probe.sh run --leg headless-parity</code> holds its clone)</summary>

```bash
#!/bin/bash
# measure.sh — what the Linux sandbox does with each absent path a per-run profile denies (#212).
#
# Run as `probe` in Gate 15's container, while `bash scripts/sandbox-probe.sh run --leg headless-parity`
# holds its clone and per-run profile in another terminal. For every `sandbox.filesystem.denyWrite`
# entry of that profile it records, per phase, what a plain shell sees outside any sandbox, and in
# phases A and B also what a sandboxed call and an excluded call see:
#
#   before  plain shell, before any session
#   A       one headless session: git status, then the inspector sandboxed, then as an excluded command
#   B       a second session, the same calls: do A's leftovers persist into B, and does B add more
#   C       two sessions at once, each issuing six short calls (#94008's cross-process cleanup race)
#   D       one session killed with SIGKILL in the middle of a call: what a killed session leaves
#
# Usage, as `probe`, from anywhere:
#   bash /tmp/sbxmeasure/measure.sh run              phases before, A, B, C and D
#   bash /tmp/sbxmeasure/measure.sh after-teardown   one more plain-shell reading after the probe tears down
#   bash /tmp/sbxmeasure/measure.sh report           writes /tmp/sbxmeasure/out/report.md
#
# Nothing here writes into the clone or the main checkout. Sessions run on a COPY of the per-run
# profile, with one entry added to `excludedCommands` for the excluded inspector. Everything it
# writes is under /tmp/sbxmeasure/out.
set -u

D=/tmp/sbxmeasure
O=$D/out
M=${M:-/home/probe/autonomous-sdlc-harness}
MODEL=${MODEL:-opus}

resolve() {
  C=${C:-$(ls -d /home/probe/autonomous-sdlc-harness-chore_sbx_probe_* 2>/dev/null | head -1)}
  P=${P:-$(ls /home/probe/.local/state/autonomous-sdlc-harness/run-profiles/*/*.json 2>/dev/null | head -1)}
  if [ -z "$C" ] || [ ! -d "$C" ] || [ -z "$P" ] || [ ! -f "$P" ]; then
    echo "measure.sh: no held probe clone or per-run profile; start 'bash scripts/sandbox-probe.sh run --leg headless-parity' first, or set C= and P=" >&2
    exit 2
  fi
}

# The inspector: one line per denyWrite entry, `<label>\t<path>\t<state>`, then the namespace and git lines.
write_inspector() {
  cat > "$D/inspect.sh" <<'EOF'
#!/bin/bash
label=$1; list=$2; c=$3; m=$4
printf '#\t%s\tmntns %s\n' "$label" "$(readlink /proc/self/ns/mnt)"
while IFS= read -r p; do
  case $p in *'*'*) continue ;; esac
  if [ -e "$p" ] || [ -L "$p" ]; then
    st=$(stat -c '%F, %s B, %U, mtime %y' "$p" 2>&1)
  else
    st=absent
  fi
  mnt=$(awk -v p="$p" '$5 == p { src = $4; for (i = 7; i <= NF; i++) if ($i == "-") { src = src " (" $(i + 1) ", " $6 ")"; break } print src; exit }' /proc/self/mountinfo)
  [ -n "$mnt" ] && st="$st; mount: $mnt"
  printf '%s\t%s\t%s\n' "$label" "$p" "$st"
done < "$list"
for r in "$c" "$m"; do
  out=$(git -C "$r" status --short --branch 2>&1); rc=$?
  printf 'git\t%s\t%s\texit %s: %s\n' "$label" "$r" "$rc" "$(printf '%s' "$out" | tr '\n' ' ' | cut -c1-240)"
done
EOF
  cp "$D/inspect.sh" "$D/inspect-ex.sh"
  cat > "$D/tick.sh" <<'EOF'
#!/bin/bash
sleep "${3:-2}"; echo "tick $1 $2 ok"
EOF
}

outside() { bash "$D/inspect.sh" "$1" "$O/entries.txt" "$C" "$M" > "$O/outside-$1.tsv" 2>&1; }

# Starts one headless session in the background on the watcher's launch line (the profile copy as
# --settings) and leaves its pid in SESSION_PID, a child of this shell so `wait` can reap it.
session() { # <name> <prompt>
  local name=$1 prompt=$2
  ( cd "$C" && exec env HARNESS_MAIN_REPO="$M" claude -p "$prompt" \
      --settings "$O/profile.json" --permission-mode dontAsk --model "$MODEL" \
      --add-dir "$C" --add-dir "$M/harness-runs" \
      --allowedTools "Bash(git status:*)" \
      --allowedTools "Bash(bash $D/inspect.sh:*)" \
      --allowedTools "Bash(bash $D/inspect-ex.sh:*)" \
      --allowedTools "Bash(bash $D/tick.sh:*)" \
      --output-format stream-json --verbose ) > "$O/session-$name.jsonl" 2> "$O/session-$name.stderr" < /dev/null &
  SESSION_PID=$!
}

prompt_calls() { # numbered calls from the arguments
  local i=1
  printf 'Issue each call below exactly as written, one Bash tool call per call, in this order. Do not retry a call, do not work around a refusal, do not add any command or tool call of your own, and do not append anything to a command. A refused call is a result. Stop after the last call.\n'
  for c in "$@"; do printf '\nCall %s. Bash, with the command parameter set to exactly: %s\n' "$i" "$c"; i=$((i + 1)); done
}

inspect_calls() { # <phase>
  prompt_calls "git status --short --branch" \
    "bash $D/inspect.sh $1-sandboxed $O/entries.txt $C $M" \
    "bash $D/inspect-ex.sh $1-excluded $O/entries.txt $C $M"
}

run() {
  resolve
  mkdir -p "$O"
  write_inspector
  {
    echo "date: $(date -Is)"
    echo "clone: $C"; echo "profile: $P"; echo "main: $M"
    echo "claude: $(claude --version 2>&1)"; echo "bwrap: $(bwrap --version 2>&1)"
    echo "uname: $(uname -a)"
    echo "apparmor_restrict_unprivileged_userns: $(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>&1)"
  } > "$O/stamp.txt"
  jq -r '.sandbox.filesystem.denyWrite[]' "$P" > "$O/entries.txt"
  jq --arg e "bash $D/inspect-ex.sh:*" '.sandbox.excludedCommands += [$e]' "$P" > "$O/profile.json"
  echo "measure.sh: $(wc -l < "$O/entries.txt") denyWrite entries, $(grep -c '\*' "$O/entries.txt") of them globs (not inspected)"

  outside before
  echo "measure.sh: phase A"; session A "$(inspect_calls A)"; wait "$SESSION_PID"; outside after-A
  echo "measure.sh: phase B"; session B "$(inspect_calls B)"; wait "$SESSION_PID"; outside after-B

  echo "measure.sh: phase C (two sessions at once)"
  local calls1=() calls2=() i p1 p2
  for i in 1 2 3 4 5 6; do calls1+=("bash $D/tick.sh C1 $i 2"); calls2+=("bash $D/tick.sh C2 $i 2"); done
  session C1 "$(prompt_calls "${calls1[@]}")"; p1=$SESSION_PID
  session C2 "$(prompt_calls "${calls2[@]}")"; p2=$SESSION_PID
  wait "$p1" "$p2"; outside after-C

  echo "measure.sh: phase D (a session killed mid-call)"
  local n=0
  session D "$(prompt_calls "bash $D/tick.sh D 1 90")"
  until grep -q '"tool_use"' "$O/session-D.jsonl" 2>/dev/null || [ $n -ge 120 ]; do sleep 1; n=$((n + 1)); done
  sleep 5
  kill -9 "$SESSION_PID" 2>/dev/null   # the session's own process: `exec` made the subshell claude itself
  wait "$SESSION_PID" 2>/dev/null
  sleep 1; outside after-D-kill
  sleep 10; outside after-D-10s

  echo "measure.sh: done. When the probe has torn down, run: bash $D/measure.sh after-teardown"
}

# After teardown the clone is gone, so resolve() would refuse; the entry list from `run` still names it.
after_teardown() { C=/nonexistent; outside after-teardown; echo "measure.sh: recorded; now run: bash $D/measure.sh report"; }

report() {
  python3 - "$O" <<'EOF'
import json, os, sys, glob
O = sys.argv[1]
rows, cols, git, ns = {}, [], [], []
def take(label, path, st):
    if label not in cols: cols.append(label)
    rows.setdefault(path, {})[label] = st
order = ["before", "after-A", "after-B", "after-C", "after-D-kill", "after-D-10s", "after-teardown"]
for ph in order:
    f = f"{O}/outside-{ph}.tsv"
    if not os.path.exists(f): continue
    for line in open(f):
        parts = line.rstrip("\n").split("\t")
        if parts[0] == "#": ns.append(f"{ph}: {parts[2]}")
        elif parts[0] == "git": git.append(f"{ph}: {parts[2]} {parts[3]}")
        elif len(parts) == 3: take(f"outside {ph}", parts[1], parts[2])
calls = {}
for f in sorted(glob.glob(f"{O}/session-*.jsonl")):
    name = os.path.basename(f)[8:-6]
    out = []
    for line in open(f):
        try: e = json.loads(line)
        except ValueError: continue
        for c in (e.get("message") or {}).get("content") or []:
            if isinstance(c, dict) and c.get("type") == "tool_use":
                out.append(["call", c["input"].get("command", "")])
            if isinstance(c, dict) and c.get("type") == "tool_result":
                t = c.get("content")
                t = "".join(x.get("text", "") for x in t) if isinstance(t, list) else str(t)
                out.append(["result" + (" ERROR" if c.get("is_error") else ""), t])
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
    r.write("## Mount namespaces\n\n" + "".join(f"- {x}\n" for x in ns) + "\n")
    r.write("## git status\n\n" + "".join(f"- {x}\n" for x in git) + "\n")
    r.write("## Sessions\n\n")
    for n, out in calls.items():
        r.write(f"### {n}\n\n")
        for k, t in out:
            r.write(f"- {k}: " + t.replace("\n", " ⏎ ")[:600] + "\n")
        r.write("\n")
print(f"{O}/report.md")
EOF
}

case "${1:-}" in
  run) run ;;
  after-teardown) after_teardown ;;
  report) report ;;
  *) echo "usage: measure.sh run | after-teardown | report" >&2; exit 1 ;;
esac
```

</details>
