### 1. Read the loopback host from `SP__NET_LOOPBACK_HOST` in `legs-loopback.sh` instead of retyping `127.0.0.1`

**Severity:** Should Fix. **Layer:** general.

**Site.** `scripts/lib/sandbox-probe/legs-loopback.sh`, in these places (line numbers are hints only):

- `sp__lb5_helper`, the heredoc body:
  - `python3 -u -m http.server --bind 127.0.0.1 --directory "$www" 0`
  - `case "$line" in "Serving HTTP on 127.0.0.1 port "*)`
  - `port="${line#Serving HTTP on 127.0.0.1 port }"`
- `sp__lb5`, the outside request: `curl -sS --max-time 5 "http://127.0.0.1:$port/sbx_lb5.txt"`
- `sp_leg_loopback`, the profile B derivation and its note:
  - `'.sandbox.network.allowedDomains += ["127.0.0.1"]'`
  - `"the network scratch profile with 127.0.0.1 added to sandbox.network.allowedDomains"`

**Problem.** The probe already has one owner for the loopback host. `scripts/lib/sandbox-probe/legs-network.sh` declares `SP__NET_LOOPBACK_HOST="127.0.0.1"`, and `legs-network.sh` reads every bind, `Serving HTTP on … port` match and request URL through it.

The same file uses that constant only partly. `sp__lb_pair` builds `base1` from `$SP__NET_LOOPBACK_HOST`, but the places listed above spell the literal again: LB5's listener helper, LB5's outside request, and LB3/LB4's profile-B `jq` filter with its note. That breaks two rules in `.claude/context/conventions.md`:

- `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."*
- `## Configuration is the source of truth, and it is read at run time` → *"The shared constants have owners, and a value is imported from its owner rather than retyped."*

**The risk.** If the host changes, `legs-network.sh` and `sp__lb_pair` follow the constant and LB5 and profile B do not. LB3/LB4 would then measure an `allowedDomains` entry that differs from the host the listener binds to, and no error would show it.

**Fix.** In `scripts/lib/sandbox-probe/legs-loopback.sh`:

- [x] **`sp__lb5_helper`.** Pass the host into the helper as a literal, the way it already passes `clone`, `token` and `bound`: extend the `printf 'clone=%q\ntoken=%q\nbound=%q\n'` line with `host=%q` and `"$SP__NET_LOOPBACK_HOST"`. In the quoted heredoc, use `--bind "$host"`, and `case "$line" in "Serving HTTP on $host port "*)` with `port="${line#"Serving HTTP on $host port "}"`. The quoted inner pattern is the form `sp__net_listener_start` already uses.
- [x] **`sp__lb5`.** Build the outside request as `"http://$SP__NET_LOOPBACK_HOST:$port/sbx_lb5.txt"`.
- [x] **`sp_leg_loopback`.** Build profile B's `jq` filter from the constant, passed as a `jq` string, never spliced into the filter text unquoted. For example, `".sandbox.network.allowedDomains += [\"$SP__NET_LOOPBACK_HOST\"]"`, or `--arg` if `sp_scratch_profile` forwards one. Build the note from `$SP__NET_LOOPBACK_HOST` as well.
- [x] **What stays.** The `127.0.0.1` in the file header and in the `LB1`/`LB3` row descriptions is prose naming the measured shape. Leave it as it is. The cross-language mirror of `LOOPBACK_ALLOWED_HOST` (`cli/src/generators/sandboxProfile.ts`) stays as the header describes it: a shell file cannot import it.
- [x] **Callers.** Check the callers of the grading functions in `cli/test/sandbox-probe-detached-loopback-legs.test.mjs`. That suite passes evidence strings unsubstituted, so a grading function's output must stay byte-identical. The changes above touch only session wiring and helper text, never `sp__lb_grade`, `sp__lb5_grade` or `sp__lb_proxy_line`. Confirm that by reading the diff.

**Deviations from plan:**

- `sp_scratch_profile` (`scripts/lib/sandbox-probe/session.sh`) forwards no `--arg`, so profile B's filter is the double-quoted form the finding offers: `".sandbox.network.allowedDomains += [\"$SP__NET_LOOPBACK_HOST\"]"`. The probe `harness-runs/scratch/lb_host_probe.py`, run through `bash scripts/scratch-run.sh`, checked three things:
  - `jq -c` turned that filter into `{"sandbox":{"network":{"allowedDomains":["127.0.0.1"]}}}`.
  - The generated `lb5-start.sh` passes `bash -n` and carries `host=127.0.0.1`.
  - The quoted-pattern strip returned `port=4321` from a sample `Serving HTTP on 127.0.0.1 port 4321 …` line.
- Left as it is: the literal in `sp__lb5_grade`'s pass evidence (`the token came back on 127.0.0.1:$port`). The **Callers** step puts `sp__lb5_grade` out of scope because its output must stay byte-identical for `cli/test/sandbox-probe-detached-loopback-legs.test.mjs`. A follow-up finding could fix that literal and edit the suite at the same time.
- **Callers** was checked by reading `git diff`, as the step asks. Every hunk is in `sp__lb5_helper`, `sp__lb5` or `sp_leg_loopback`, and none touches `sp__lb_grade`, `sp__lb5_grade` or `sp__lb_proxy_line`. The suite was not run: this unit did not edit it. It is deferred to the Run gates phase, which runs it under `commands.test`.
