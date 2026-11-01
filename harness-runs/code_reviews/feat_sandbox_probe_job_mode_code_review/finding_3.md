### 3. IS3 grades a rewrite of an existing `/etc/apparmor.d/bwrap` as "not needed", because the controls file records only whether the file exists

**File:** `scripts/lib/sandbox-probe/legs-runner.sh` (`sp__is3_grade`) — "# The step writes /etc/apparmor.d/bwrap exactly when the sysctl reads 1 and no profile is there." The reading behind it is `scripts/sandbox-probe-runner.yml` → step `Record the runner and the controls` → `profile_presence() { if [ -f /etc/apparmor.d/bwrap ]; then echo present; else echo absent; fi; }`.

**Problem.** The install step the workflow copies from `harness-run.yml` sets `needs_profile=1` when the sysctl reads `1` **and** the profile is absent **or** carries no `userns,` line (`if [ ! -f "$profile" ] || ! grep -q '^[[:space:]]*userns,' "$profile"; then`). When that holds, it overwrites the file. The controls file records only `present`/`absent`, so an existing profile without `userns,` reads `present` both before and after the step. `sp__is3_grade` then takes its `pb = present, pa = present` arm and prints `pass` with `not needed: /etc/apparmor.d/bwrap was present before the install step`, although the step did write the file.

The task prompt asks IS3 to record "whether the step wrote `/etc/apparmor.d/bwrap`". sandbox3c (#167) and sandbox4 (#144) read §9's IS3 row as that fact. The comment above the grade also states the step's condition wrongly.

**Fix.** Record the `userns,` test the step itself uses, and grade the case it decides.

1. In `scripts/sandbox-probe-runner.yml` → step `Record the runner and the controls`, replace `profile_presence` in the `sandbox-probe-record.sh` heredoc with:

   ```bash
             profile_presence() {
               if [ ! -f /etc/apparmor.d/bwrap ]; then echo absent
               elif grep -q '^[[:space:]]*userns,' /etc/apparmor.d/bwrap; then echo present
               else echo present without userns; fi
             }
   ```

   Keep the heredoc's indentation. Both the before and the after readings source this file, so both keys change together.
2. In `scripts/lib/sandbox-probe/legs-runner.sh`'s header, change the `apparmor-profile-before` line's value domain to: /etc/apparmor.d/bwrap: `present` (carrying a `userns,` line), `present without userns`, or `absent`. The `apparmor-profile-after` line reads "as their -before keys" and needs no change.
3. In `sp__is3_grade`, replace the comment with `# The step writes /etc/apparmor.d/bwrap exactly when the sysctl reads 1 and the file is absent or carries no userns, line.` Replace the `if` chain with:

   ```bash
     if [ "$sysctl" = 1 ] && [ "$pa" != present ]; then
       SP_VERDICT=fail
       SP_EVIDENCE="the sysctl read 1 before the install step and /etc/apparmor.d/bwrap is $pa after it (before: $pb)"
     elif [ "$sysctl" = 1 ] && [ "$pb" = absent ] && [ "$pa" = present ]; then
       SP_VERDICT=pass
       SP_EVIDENCE="written: the sysctl read 1 and the step wrote /etc/apparmor.d/bwrap"
     elif [ "$sysctl" = 1 ] && [ "$pb" = "present without userns" ] && [ "$pa" = present ]; then
       SP_VERDICT=pass
       SP_EVIDENCE="written: the sysctl read 1 and the step rewrote /etc/apparmor.d/bwrap, which carried no userns rule"
     elif [ "$pb" = present ] && [ "$pa" = present ]; then
       SP_VERDICT=pass
       SP_EVIDENCE="not needed: /etc/apparmor.d/bwrap was present before the install step (sysctl: $sysctl)"
     elif [ "$sysctl" != 1 ] && [ "$pb" = "present without userns" ] && [ "$pa" = "present without userns" ]; then
       SP_VERDICT=pass
       SP_EVIDENCE="not needed: the sysctl read $sysctl, and /etc/apparmor.d/bwrap was present before the install step, carrying no userns rule"
     elif [ "$sysctl" != 1 ] && [ "$pb" = absent ] && [ "$pa" = absent ]; then
       SP_VERDICT=pass
       SP_EVIDENCE="not needed: the sysctl read $sysctl, and the step wrote no /etc/apparmor.d/bwrap"
     else
       SP_VERDICT="not run"
       SP_EVIDENCE="no rule fits sysctl-before '$sysctl', apparmor-profile-before '$pb', apparmor-profile-after '$pa'"
     fi
   ```

   With `$pa` = `absent`, the first arm prints exactly today's text, so the existing `IS3 fails on 1 absent absent` case keeps passing unchanged.

   The fifth arm keeps a pass the old chain gave. A runner whose existing profile carries no `userns,` line and whose sysctl reads anything but `1` reads `present`/`present` today and passes as "not needed". Under the new recording it reads `present without userns` on both sides, and without that arm it would fall through to `not run`. The step writes nothing when the sysctl is not `1`, so "not needed" is still the right grade. With the sysctl at `1` and both readings `present without userns`, the first arm fails it, because the step should have rewritten the file.
4. In `cli/test/sandbox-probe-runner-legs.test.mjs`, beside `IS3's three consistent pairs pass` and `IS3 fails on 1 absent absent`, add three cases through the file's `graded` helper:
   - `['1', 'present without userns', 'present']` → `pass|written: the sysctl read 1 and the step rewrote /etc/apparmor.d/bwrap, which carried no userns rule`;
   - `['1', 'present without userns', 'present without userns']` → `fail|the sysctl read 1 before the install step and /etc/apparmor.d/bwrap is present without userns after it (before: present without userns)`;
   - `['0', 'present without userns', 'present without userns']` → `pass|not needed: the sysctl read 0, and /etc/apparmor.d/bwrap was present before the install step, carrying no userns rule`.

   This file is the test file the fix edits, so it is the one the fix runs.
5. In `docs/sandbox-verification.md` → `## 9. The GitHub-hosted runner legs`, row IS3, replace the *Expected on the runner* cell's text "written exactly when the sysctl reads `1`, or present before the step; not written when it reads otherwise" with: written exactly when the sysctl reads `1` and the file is absent or carries no `userns,` line, or present with a `userns,` line before the step; not written when the sysctl reads otherwise.

- **Deviations from plan:** The `cli` dispatch implemented step 4 only. Steps 1, 2, 3 and 5 (`scripts/sandbox-probe-runner.yml`, `scripts/lib/sandbox-probe/legs-runner.sh`, `docs/sandbox-verification.md`) are outside `cli/` and belong to this finding's `general` dispatch. Step 4's three cases were added as subtest `IS3 grades a profile carrying no userns rule by what the step must do with it` in `cli/test/sandbox-probe-runner-legs.test.mjs`. The run `npm test --workspace cli -- test/sandbox-probe-runner-legs.test.mjs` after the cli edit reported `# tests 45`, `# pass 43`, `# fail 2`. The only failure is that new subtest and its parent `IS1–IS4`: the first assertion got `not run|no rule fits sysctl-before '1', apparmor-profile-before 'present without userns', apparmor-profile-after 'present'` because step 3's `sp__is3_grade` chain has not landed. The `general` dispatch must rerun this file after step 3 lands.
  - The `general` dispatch implemented steps 1, 2, 3 and 5 as written. The `profile_presence` body sits at the heredoc's existing 10-space function indentation, matching `path_or_absent` and `sysctl_or_absent` beside it. Rerun `npm test --workspace cli -- test/sandbox-probe-runner-legs.test.mjs` after step 3 reported `# tests 45`, `# pass 45`, `# fail 0`. `bash scripts/typecheck.sh` reported `PASS: typecheck`. The tree guard `test/main-anchor-isolation.test.mjs` was selected because `cli/test/sandbox-probe-runner-legs.test.mjs` is in the changed-path set; it reported `# tests 2`, `# pass 2`, `# fail 0`.
