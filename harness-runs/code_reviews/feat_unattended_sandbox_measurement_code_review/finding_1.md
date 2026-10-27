### 1. The headless-parity script cannot be followed: its clone is already torn down, and its network step runs on a profile that denies `curl`

**File:** `scripts/lib/sandbox-probe/legs-settings.sh` (`sp_print_parity_script`, `sp_leg_headless_parity`) — "claude --settings <run profile>"; also `docs/sandbox-verification.md` → row `HP1` ("re-run in an interactive `claude --settings <run profile>` session") and `docs/development.md` → `**Gate 15 — the unattended sandbox probe (macOS).**` ("`headless-parity` is run by hand in an interactive session from the script `print-parity-script` prints").

**Two defects, both of which stop HP1 from being measured as written.**

1. **No clone or profile exists when the person follows the script.** The script says *"<clone> is a probe clone, <run profile> its per-run profile (a headless run's departure names it)"*. But every `run` ends in `sp_teardown` (`scripts/sandbox-probe.sh` → the `run)` case calls `sp_teardown` unconditionally), and teardown removes every registered clone, its registry record, its per-run profile and the whole `SP_TMP`. So once a person has a departure line naming a clone and a profile, both are gone. `print-parity-script` cuts nothing, and `run --leg headless-parity` prints `not run` and then tears down too. No command the probe offers leaves a clone and its per-run profile on disk for the interactive session.
2. **Step 2 cannot reach the sandbox.** Step 2 (N1) asks for `curl -sS https://<host>/` in a session started as `claude --settings <run profile>`. `scripts/lib/sandbox-probe/legs-network.sh`'s own header states that the run profile's `permissions.deny` carries `Bash(curl:*)`, and that a deny is evaluated before any allow. `sp__net_profile` refuses to run the network leg at all unless that entry is present. So the interactive call stops at the permission layer, and approving it interactively cannot lift a deny either. The headless N1 that HP1 is meant to compare against ran on `SP__NET_PROFILE`, the scratch copy without that entry. HP1's expected *"a `<sandbox_violations>` refusal"* therefore cannot appear, and the parity comparison sets two different profiles against each other. Steps 3 and 4 (RT1, CS2) ran headless on `SP_RUN_PROFILE`, so those two belong on the run profile.

**Fix.** Make `run --leg headless-parity` hold the probe's artifacts open for the interactive session, and give the network step its own profile:

- In `sp_leg_headless_parity`:
  - Call `sp__net_profile` (legs-network.sh). If it fails, print HP1 `not run` with `$SP__NET_PROFILE_WHY` and return.
  - Otherwise, call `sp_print_parity_script` with its placeholders substituted: `<clone>` → `$SP_CLONE`, `<run profile>` → `$SP_RUN_PROFILE`, `<net profile>` → `$SP__NET_PROFILE`, `<main>` → `$SP_MAIN`. Pipe its output through one `sed` with `|` delimiters, or have the function take the four values as arguments.
  - Then print `sandbox-probe: the clone and profiles above stay until you press Enter; teardown follows` on stderr, and block on `read -r _ </dev/tty`.
  - Then print `sp_result_line headless-parity HP1 "not run" "interactive; recorded by hand from the parity script printed above" ""`.

  The `run` case still skips `headless-parity` by default, so only `run --leg headless-parity` holds the terminal.
- In `sp_print_parity_script`:
  - Step 1 starts two sessions. The first is `claude --settings <net profile>`, used for step 2 only. The second is `claude --settings <run profile>`, used for steps 3 and 4. Each goes in its own fenced block after `cd <clone>`.
  - Step 2 names the network scratch profile: *"in the `<net profile>` session (the run profile without its `Bash(curl:*)` deny, as the headless N1 ran)"*.
  - Drop the sentence *"(a headless run's departure names it)"*.
  - `print-parity-script` with no run keeps printing the placeholders, as a preview.
- In `docs/sandbox-verification.md` row `HP1`, Check cell: replace *"re-run in an interactive `claude --settings <run profile>` session with cwd = `<clone>`, from the parity script the probe prints"* with *"re-run in interactive sessions with cwd = `<clone>`, N1's call on N3's scratch profile and RT1's and CS2's on `<run profile>`, from the parity script `run --leg headless-parity` prints while it holds the clone"*.
- In `docs/development.md` → Gate 15:
  - Replace *"`headless-parity` is run by hand in an interactive session from the script `print-parity-script` prints"* with *"`headless-parity` is run with `run --leg headless-parity`, which prints the parity script with the live clone and profile paths and holds them until Enter is pressed"*.
  - Add `bash scripts/sandbox-probe.sh run --leg headless-parity` as its own line in the fenced block, and update the sentence before that block that counts and names its lines.
- In `scripts/sandbox-probe.sh` → `usage`: change the `print-parity-script` line to `print the headless-parity script with placeholders; run --leg headless-parity prints it live`.

**Deviations from plan:**

- `sp_print_parity_script` takes the four values as optional positional arguments (the finding's second option) rather than a `sed` pass, so a path carrying `|` cannot break the substitution; with no argument it prints the placeholders.
- Step 1 keeps one command per fenced block (`cd <clone>`, then one block per `claude --settings` line) and tells the reader to run the `cd` in each of the two terminals; steps 3 and 4 also name the `<run profile>` session.
- Evidence downgrade: a preview run of `bash scripts/sandbox-probe.sh print-parity-script` and a `bash -n` syntax check of `scripts/lib/sandbox-probe/legs-settings.sh` were refused by the tool layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The script text rests on reading the edited function only; `run --leg headless-parity` needs a live probe run started by a person and was not exercised.
