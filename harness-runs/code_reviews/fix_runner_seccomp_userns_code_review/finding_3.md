### 3. Row DP5's *Expected* cell still expects the uncertain warning to name "the reload command", which the check no longer prints

**Site:** `docs/sandbox-verification.md` §8 → row `DP5`, *Expected* cell, the clause *"is a warning in both modes, naming the profile and the reload command"*.

**Problem.** This branch retired `APPARMOR_RELOAD_COMMAND` (`sudo systemctl reload apparmor`). `describeAppArmor('uncertain')` now names `APPARMOR_LOAD_COMMAND` (`sudo apparmor_parser -r /etc/apparmor.d/bwrap`), and `docs/cli.md` §7 changed *"the reload command"* to *"the load command"* for the same reason. Task 7 restated DP5 (story scope register row 24) with a *"Since `fix_runner_seccomp_userns`:"* clause but left the older clause as it was. The next Gate 15 run is owed DP5's result. Its grader will read *"the reload command"* and look for `systemctl reload apparmor`, a string the check no longer prints. That turns a correct warning into an apparent mismatch. The 2026-10-29 *Observed* cell quotes the old message correctly as a past reading, and stays as it is.

**Fix.**

- [ ] In the DP5 *Expected* cell, at the end of the sentence that begins *"Since `fix_runner_seccomp_userns`: an uncertain AppArmor answer is a warning only where the nested check (DP1) did not run; where it ran, the file reading is context and the check is the verdict"*, append: *", and the command the warning names is the load command `sudo apparmor_parser -r /etc/apparmor.d/bwrap`, not the reload command"*. Leave the earlier clause and the *Observed* and *Verdict* cells as they are.
