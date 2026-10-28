### Task 5 — Grade N4 against the same call issued unsandboxed from the probe's own shell

**Goal:** Give N4 a way to tell a sandbox refusal from an unreachable host on a stock Mac. `curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms` cannot do that on its own. Right after the N3/N4 session, the probe issues the same `curl` itself, from its own shell: outside any session, unsandboxed, as L2's call already is. N4 is then graded on whether the two outcomes differ. **Nothing is bound to a link-local address.**

**Depends on:** Task 1, whose `network` description states *"a link-local host's curl error line is graded against the same call issued unsandboxed from the probe's own shell and is not run where the two cannot be told apart"*.

**Why the comparison, and why not elapsed time.** The two calls run on the same machine, at the same moment, with the same routes. So when the control's outcome differs from the session's, the difference is the sandbox's (or its proxy's). Elapsed time is not compared: an interface with no link-local route also fails at once, so a fast failure alone cannot separate a refusal from an unreachable host.

**The contract this task produces, which Task 8 tests.**

- **`sp__net_n4_control <command>`** runs `<command>`'s URL through `curl -sS --max-time 5` from the probe's own shell. It sets:
  - `SP__NET_N4_CTL_RC` to curl's exit status;
  - `SP__NET_N4_CTL_LINE` to curl's first `curl: (` line on a non-zero exit, or `a response (<n> bytes)` on exit 0.
  
  It never retries, and never quotes the response body, which on a cloud host is instance metadata. It sets `SP__NET_N4_CTL_RC` empty when `curl` does not resolve on `PATH`.
- **`sp__net_n4_grade <stream> <command> [<control exit> <control line>]`** → `SP_VERDICT` and `SP_EVIDENCE`. It reads only its arguments and the stream. Its permission/file-tool, network/sandbox and response arms are unchanged. The `ran`-with-an-error arm becomes:
  - **Both control arguments absent:** today's evidence, byte for byte: `curl's error line cannot tell a refused connect from an unreachable host: <line>`, `not run`.
  - **Control exit `0`:** `pass`, `refused in the session while the same call, unsandboxed from the probe's own shell, got a response: session: <line>; unsandboxed control: <control line>`.
  - **Session's curl code unparseable:** `not run`, `no curl exit code in the session's error line to compare: <line>`. The session's code is the `<n>` of its `curl: (<n>)` line.
  - **Control exit differs from the session's code:** `pass`, `the session's connect ended differently from the same call issued unsandboxed from the probe's own shell: session: <line>; unsandboxed control: <control line>`.
  - **Same code, or an empty control exit:** `not run`, `curl's error line cannot tell a refused connect from an unreachable host, and the same call issued unsandboxed from the probe's own shell ended the same way: session: <line>; unsandboxed control: <control line or 'curl not on PATH'>`.

### Targets

- `scripts/lib/sandbox-probe/legs-network.sh`

**Work:**

- [ ] Add `sp__net_n4_control` as specified. Its one call is `curl -sS --max-time 5 "http://$SP__NET_LINKLOCAL_HOST/"`, the URL `c4` names, with stdout and stderr captured into a local variable and never printed.
- [ ] Extend `sp__net_n4_grade` with the two optional arguments and the arms above. Every other arm is unchanged.
- [ ] `sp_leg_network`'s N3/N4 block: after `sp__net_session network-n3n4 …` returns and before N4 is graded, call `sp__net_n4_control "$c4"`. Then:
  - Pass `"$SP__NET_N4_CTL_RC" "$SP__NET_N4_CTL_LINE"` to `sp__net_n4_grade`.
  - N4's result line keeps its existing `…; control in the same session: $SP_NET_CONTROL` suffix.
  - When the session did not launch, N4 stays `not run` with `$SP__NET_WHY`, and the control is not issued.
- [ ] The file header's paragraph on N4 (*"N4's link-local host cannot be bound without root, so N4 is graded on curl's full error line…"*) says that N4 is now graded against the unsandboxed control, with the rule above. The grading-signature line becomes `sp__net_n4_grade <stream> <command> [<control exit> <control line>]`, and `sp__net_n4_control <command>` is added to the list.

**Verification:**

- `grep -n '169.254' scripts/lib/sandbox-probe/legs-network.sh` shows the host only in `SP__NET_LINKLOCAL_HOST`'s assignment and in comments. No `--bind`, `nc -l` or `http.server` names it.
- By hand, from a temp directory: in a `bash -c` that sources `core.sh`, `judge.sh`, `controls.sh` and this file, call `sp__net_n4_grade` on the existing `cli/test/fixtures/sandbox-probe/n4-curl-error.jsonl` with `curl -sS --max-time 5 http://169.254.169.254/`:
  - with no control arguments, it prints today's `not run` text unchanged;
  - with `28 'curl: (28) Connection timed out after 5001 milliseconds'`, it prints `pass`.
  
  (Task 8 turns both into test cases.)
- The type check (`bash scripts/typecheck.sh`) parses the file.

**Deviations from plan:**

- `sp__net_n4_control` takes the URL from its `<command>` argument (its last word) and calls `curl -sS --max-time 5 "$url"`, rather than spelling `"http://$SP__NET_LINKLOCAL_HOST/"` inside the function: the contract says it "runs `<command>`'s URL", and for `c4` the two are the same call. A control on a non-zero exit with no `curl: (` line sets `SP__NET_N4_CTL_LINE` to `curl exit <rc> with no 'curl: (' line`; the contract named no value for that case.
- Evidence downgrade: the by-hand `bash -c` from a temp directory was refused by the permission layer (`Permission to use Bash has been denied because Claude Code is running in don't ask mode.`). The same sourcing (`core.sh`, `judge.sh`, `controls.sh`, `legs-network.sh`, `SP_VERSION=` empty, a temp cwd) was run instead as a probe through `bash scripts/scratch-run.sh harness-runs/scratch/n4_grade_probe.py`. Results on `n4-curl-error.jsonl` with `curl -sS --max-time 5 http://169.254.169.254/`: no control arguments printed today's `not run|curl's error line cannot tell a refused connect from an unreachable host: curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server`; `28 'curl: (28) Connection timed out after 5001 milliseconds'` printed `pass` (the differing-code arm); `7` printed the same-way `not run`; `0` printed the got-a-response `pass`; an empty control printed `not run` ending `unsandboxed control: curl not on PATH`; `n4-refused.jsonl` still took the network/sandbox `pass` arm. `sp__net_n4_control "curl -sS --max-time 5 http://127.0.0.1:1/"` set `rc=7`, `line=curl: (7) Failed to connect to 127.0.0.1 port 1 after 0 ms: Couldn't connect to server`. The unparseable-code arm was not exercised (no fixture carries an error with no `curl: (<n>)` line); it rests on reading the code. A `rm` of the probe file was refused; the file sits under the ignored `harness-runs/scratch/` and is not committed.
