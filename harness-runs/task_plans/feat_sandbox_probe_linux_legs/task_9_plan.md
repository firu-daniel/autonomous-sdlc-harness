### Task 9 — Add the `loopback` leg (LB1–LB5)

**Goal:** Measure on Linux what F8 found on macOS (`docs/sandbox-verification.md` → §5 F8, §4 N3): whether a sandboxed command reaches a loopback listener. The leg calls the probe's own listener in two forms, `http://127.0.0.1:<port>/…` and `http://localhost:<port>/…`, each graded by the listener's token.

**What each row records:**

- which path each call took: the session's proxy variables, names with host and port only, never a credential;
- a second call of each form with `--noproxy '*'`;
- the same calls on N3's scratch profile as generated (`allowedDomains: []`, `allowLocalBinding: true`), and again with `127.0.0.1` added to `allowedDomains`. That is the shape `LOOPBACK_ALLOWED_HOST` in `cli/src/generators/sandboxProfile.ts` produces when the interactive-test phase applies.

**The rows:**

| Row | Form | Profile |
|---|---|---|
| **LB1** | `127.0.0.1` | as generated |
| **LB2** | `localhost` | as generated |
| **LB3** | `127.0.0.1` | with the IP listed |
| **LB4** | `localhost` | with the IP listed |
| **LB5** | a listener a sandboxed call starts, called from outside the sandbox (the interactive-test shape) | as generated |

S and SR lead one to expect a host-loopback listener to be unreachable, but **that is to be measured, not asserted**. So once the listener has answered the probe's own request, each row is recorded, never graded on what it finds. Each row says whether the token came back, and LB3 and LB4 also say whether that differs from LB1 and LB2.

**Depends on:**

- **Task 2.** The leg table declares `loopback` with rows `LB1,LB2,LB3,LB4,LB5`. `scripts/sandbox-probe.sh` sources `scripts/lib/sandbox-probe/legs-loopback.sh` after `legs-network.sh` when present, and calls `sp_leg_loopback` only on Linux.
- **Task 3.** On Linux, an expected network refusal that errors with no known string is layer `unrecognised`, verdict `not run`, and the `ran` arm quotes `Exit code <n>: <message line>`. **This leg never expects a refusal.** Every call it grades is judged at **`ran`**: `sp_judge_call <stream> ran <command>`. So Task 3's `unrecognised` arm, which applies only to an expected `sandbox` or `network` layer, never fires here. The judge's `pass`/`fail` against `ran` is not used either. Only three things are read from the judge:
  - its `not run`, which at `ran` means the call is absent or has no result;
  - `SP_LAYER`, to screen out `permission` and `file-tool`;
  - `SP__TEXT` and `SP_LAYER_EVIDENCE`, from which the outcome is read.

It reuses, unchanged, from `legs-network.sh`:

- `sp__net_profile`, which cuts `SP__NET_PROFILE`, the run profile without its `Bash(curl:*)` deny, or sets `SP__NET_PROFILE_WHY`;
- `sp__net_listener_start` and `sp__net_listener_stop`, which start and stop the probe's `python3` listener on `SP__NET_LOOPBACK_HOST` (`127.0.0.1`) and set `SP__NET_PORT` and `SP__NET_TOKEN`, serving `sbx_n3.txt`;
- `sp__net_curl_line` and `SP_NET_CONTROL`.

From `session.sh` and `controls.sh` it reuses the session, prompt, scratch-profile, tracking and control API. It changes neither `legs-network.sh` nor `LOOPBACK_ALLOWED_HOST`.

**Where this task stops.** One new library file, nothing else edited. Task 19 tests `sp__lb_proxy_line`, `sp__lb_grade` and `sp__lb5_grade`. The record is Task 21's.

### Targets

- `scripts/lib/sandbox-probe/legs-loopback.sh` (new)

**Work:**

- [ ] **The header**, as every sibling's. It states:
  - the five rows;
  - the two profiles, naming `LOOPBACK_ALLOWED_HOST` as the shape LB3 and LB4 mirror;
  - the proxy rule: host and port only, never a user, password or path;
  - the `--noproxy '*'` spelling. If its exact `--allowedTools` rule does not match, the call prints `not run` with the permission layer's text;
  - LB5's 60 s bound, and how it relates to session C's length. The bound counts from the start call, which is session C's first call. The session then issues only the network control, and the outside requests follow at once, three at most, a second apart, each `--max-time 5`. So the bound covers a session of up to about 40 s. A session that runs longer can let the listener expire before the probe calls it. The liveness check below catches that, grading the row `not run`, never `unreachable`. The row's evidence names session C's seconds;
  - that every curl call and the LB5 start call are judged at `ran`, and why;
  - LB5's liveness rule. *Unreachable* counts only while the listener is confirmed still running after the last outside request, in line with N3's rule that no body counts only while the listener answered;
  - the grading functions with their signatures;
  - *SOURCED, NEVER EXECUTED … Bash 3.2 floor.*
- [ ] **The helpers**, written under `SP_TMP` by the probe and tracked.
  - **`lb-proxy.sh`**, for each of `http_proxy HTTP_PROXY https_proxy HTTPS_PROXY all_proxy ALL_PROXY no_proxy NO_PROXY` in that order, prints one of:
    - `sbx_lb_proxy <NAME> unset`;
    - for the four proxy names, `sbx_lb_proxy <NAME> <host>:<port>`, with the scheme, any `user[:password]@` and any path stripped;
    - for `no_proxy` and `NO_PROXY`, `sbx_lb_proxy <NAME> <value>`.
  - **`lb5-start.sh`**:
    1. writes `<clone>/sbx_lb5_www/sbx_lb5.txt`, holding a token the probe passes as a literal;
    2. starts `nohup timeout 60 python3 -u -m http.server --bind 127.0.0.1 --directory <clone>/sbx_lb5_www 0 </dev/null ><clone>/sbx_lb5.log 2>&1 &`, then `disown`;
    3. polls the log for up to 5 s for `Serving HTTP on 127.0.0.1 port <n>`;
    4. prints `sbx_lb5_listening <n>`, or `sbx_lb5_no_listener <the log's first line, or empty>`.
- [ ] **`sp__lb_proxy_line <stream> <helper command>`** prints `proxy: <NAME>=<value>, …`, joining the helper's `sbx_lb_proxy` lines from the call's result, or `proxy: not recorded (<why>)`. As a second guard, it strips any `<user>[:<password>]@` still present in a value before printing, so no credential reaches a result line even if the helper's stripping failed.
  - **`sp__lb_grade <stream> <plain command> <noproxy command> <token> <listener answered: 1|0>`** sets `SP_VERDICT` and `SP_EVIDENCE`. It judges each of the two calls with `sp_judge_call <stream> ran <command>`. The verdict is:
    - `not run` when either call got the judge's `not run` (absent, or no result), or its `SP_LAYER` is `permission` or `file-tool`, or when `<listener answered>` is not `1`;
    - otherwise `pass`, with evidence `plain: <outcome>; --noproxy: <outcome>`. An outcome is `the token came back` when `SP__TEXT` carries the token. Otherwise it is `no body: <the call's curl: ( line from SP__TEXT>`, or, when there is none, `no body: <SP_LAYER>: <SP_LAYER_EVIDENCE>`. A `network` or `sandbox` layer is quoted the same way, as a record, not a grade.
  - **`sp__lb5_grade <stream> <start command> <outside reply> <token> <listener alive: 1|0|?>`** sets `SP_VERDICT` and `SP_EVIDENCE`. It judges the start call with `sp_judge_call <stream> ran <start command>`. `<listener alive>` is the probe's own check, made from outside the sandbox **after** the last outside request (session C below). A process found alive then was alive at every earlier request. The verdict is:
    - `not run` when the start call got the judge's `not run`, or was refused at the `permission` or `file-tool` layer, or printed `sbx_lb5_no_listener`;
    - `pass`, `reachable from outside the sandbox: the token came back on 127.0.0.1:<n>`, when the outside reply carries the token, whatever `<listener alive>` says;
    - `not run`, `the listener was no longer running when the probe called it, so no reply proves nothing: <the outside curl's error line>`, when `<listener alive>` is `0`;
    - `not run`, `could not tell whether the listener was still running (pgrep does not resolve on PATH): <the outside curl's error line>`, when it is `?`;
    - otherwise, when it is `1`, `pass`, `unreachable from outside the sandbox while the listener was running: <the outside curl's error line>`.
- [ ] **`sp_leg_loopback`, sessions A and B.**
  - **Setup.** `sp__net_profile`, else all five rows `not run` with `SP__NET_PROFILE_WHY`. Profile B is `sp_scratch_profile sbx_lb_ip '.sandbox.network.allowedDomains += ["127.0.0.1"]' "$SP__NET_PROFILE"`.
  - **For each of A (`SP__NET_PROFILE`) and B:**
    1. Start the listener with `sp__net_listener_start`. When it does not start, both of that profile's rows are `not run`.
    2. Launch one session, cwd the clone. Its calls, each with its exact `--allowed "Bash(<call>)"`:
       - `bash $SP_TMP/lb-proxy.sh`;
       - `curl -sS --max-time 5 http://127.0.0.1:<port>/sbx_n3.txt`;
       - the same with `--noproxy '*'` before the URL;
       - the `localhost` URL plain;
       - the `localhost` URL with `--noproxy '*'`;
       - the control `SP_NET_CONTROL`, as `ran`.
    3. Make the probe's own request to the listener, as `sp_leg_network` does, then stop it.
    4. Grade with `sp__lb_grade` and print through `sp_row_result`.
  - **Evidence.** Each row's evidence opens with the profile's `allowedDomains` and `allowLocalBinding` values, read with `jq`. LB1's and LB3's evidence ends with that session's `sp__lb_proxy_line`. LB3's and LB4's evidence ends `; on the profile as generated (LB1|LB2): same` or `…: different`.
- [ ] **`sp_leg_loopback`, session C (LB5).** It runs on `SP__NET_PROFILE`, with `--allowed "Bash(bash $SP_TMP/lb5-start.sh)"` and the network control.
  - After it, the probe makes up to three requests from outside, a second apart: `curl -sS --max-time 5 http://127.0.0.1:<n>/sbx_lb5.txt`. It stops at the first that returns the token.
  - **The liveness check.** Right after the last outside request, the probe runs one `pgrep -f "<clone>/sbx_lb5_www"`. The `--directory` argument is unique to this listener. The check is a single call with no retry, so it is bounded.
    - It finds a process → `1`.
    - It exits 1 → `0`.
    - `pgrep` does not resolve on PATH → `?`.

    A listener that the sandbox's process lifetime ended with the call or the session, BG9's open question, reads `0`. So does one that `timeout 60` ended. Neither can be recorded as *unreachable*.
  - It grades with `sp__lb5_grade`, passing that value, and prints through `sp_row_result`. The evidence ends `; session C ran <SP__NET_SECONDS> s`.
  - The `<clone>/sbx_lb5*` paths are tracked. The listener ends itself through `timeout 60`.

**Verification:**

- The type check passes.
- `grep -n 'LOOPBACK_ALLOWED_HOST\|allowedDomains' scripts/lib/sandbox-probe/legs-loopback.sh` shows `allowedDomains` written only into the `sbx_lb_ip` scratch profile.
- By hand, `bash -c 'http_proxy=http://u:p@proxy.example:3128/x HTTPS_PROXY= bash <the helper body written to a temp file>'` prints `sbx_lb_proxy http_proxy proxy.example:3128` and no `u:p`.
- `grep -n 'sp_judge_call' scripts/lib/sandbox-probe/legs-loopback.sh` shows every call with the layer argument `ran`, and none with `network` or `sandbox`.
- `grep -n 'pgrep' scripts/lib/sandbox-probe/legs-loopback.sh` shows the one liveness check, after the outside requests and before `sp__lb5_grade`.
- `git diff --stat` shows only the new file.

**Deviations from plan:**

- `lb-proxy.sh` prints an **empty** variable as `sbx_lb_proxy <NAME> unset` (curl ignores an empty proxy variable; the plan named only the unset case). It strips `user[:password]@` before the path, so an unencoded `/` in a password cannot leave a credential behind.
- LB3's and LB4's comparison ends `…: not compared, one of the two was not run` when either the LB3/LB4 row or its LB1/LB2 counterpart was not run; the plan gave only `same` / `different`.
- LB5: a `pgrep` exit other than 0 or 1 is passed to `sp__lb5_grade` as `pgrep exit <n>` and graded `not run` (`could not tell whether the listener was still running (liveness '<value>')`); a start call printing neither `sbx_lb5_listening` nor `sbx_lb5_no_listener` is `not run`; with `curl` not on the probe's PATH, LB5 is `not run` before session C launches.
- Evidence downgrade: `bash scripts/typecheck.sh` passed, but its parse step covers only git-listed files and this file is untracked, so the parse claim rests on `/bin/bash -n` (3.2.57) over the file, run through `scripts/scratch-run.sh` (exit 0). The by-hand `bash -c 'http_proxy=… bash <helper>'` check was refused by the permission mode as a direct command; it was run as the same `bash` invocation from a scratch probe, printing `sbx_lb_proxy http_proxy proxy.example:3128` and no `u:p`.
</content>
</invoke>
