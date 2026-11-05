### 1. A failed nested check with no stock profile always prescribes the AppArmor profile, even where AppArmor restricts nothing

**Site:** `cli/src/doctor/sandboxPrerequisites.ts` → `describeNestedUserns`, the `case 'failed':` arm (*"no \`${BWRAP_USERNS_RESTRICT_PROFILE_PATH}\` is present, so write the profile at"*); its caller `cli/src/doctor/checks.ts` → `gradeSandboxPrerequisites` (the line `sentences.push(\`${describeNestedUserns(nestedUserns, detail, remoteJob)} ${context}\`);`); and the two prose restatements in `docs/cli.md` §6 (*"and otherwise the profile and `sudo apparmor_parser -r /etc/apparmor.d/bwrap`"*) and §7 (*"otherwise it names the profile at `/etc/apparmor.d/bwrap` and the load command §6 fences"*).

**Problem.** When the nested check fails and `/etc/apparmor.d/bwrap-userns-restrict` is absent, the `failed` sentence always tells the operator to write `/etc/apparmor.d/bwrap` and run `sudo apparmor_parser -r /etc/apparmor.d/bwrap`. That remedy only helps where AppArmor is what blocks the namespace, which means `kernel.apparmor_restrict_unprivileged_userns` reads `1`. Where the sysctl is absent or `0` (the `clear` AppArmor answer), AppArmor restricts nothing. Examples are a Fedora host with no AppArmor, a Debian host with unprivileged user namespaces turned off, or `doctor` run inside a container or sandbox that denies them (the story index's second top risk notes this last case fails by design). The check then fails, and its one stated remedy cannot fix the failure. On a host with no AppArmor, it names a tool that is not installed.

The grader already knows which case it is in, because the AppArmor answer is in the same assessment. Test `(g)` in `cli/test/doctor-sandbox-prerequisites.test.mjs`, row *"probe fails, no stock file"*, builds exactly this state (`clear` facts) and asserts the AppArmor remedy. So the wrong advice is pinned by a test rather than being an oversight nobody hit.

**Fix.**

- [ ] In `cli/src/doctor/sandboxPrerequisites.ts`, add a fourth, optional parameter to `describeNestedUserns`: `appArmor: AppArmorAnswer = 'uncertain'`. The default keeps every existing three-argument call's meaning. Update its doc comment to say the AppArmor answer selects the `failed` remedy. Replace the `case 'failed':` arm with:

  ```ts
      case 'failed':
        return appArmor === 'clear'
          ? `${failure}; no \`${BWRAP_USERNS_RESTRICT_PROFILE_PATH}\` is present and \`${APPARMOR_USERNS_SYSCTL}\` does not restrict unprivileged user namespaces, so no AppArmor profile is the cause: this host, or a container or sandbox \`doctor\` is running inside, denies unprivileged user namespaces.`
          : `${failure}; no \`${BWRAP_USERNS_RESTRICT_PROFILE_PATH}\` is present, so write the profile at \`${BWRAP_APPARMOR_PROFILE_PATH}\` that grants \`userns\` to \`${BWRAP_INSTALLED_PATH}\` and run \`${APPARMOR_LOAD_COMMAND}\`.`;
  ```

- [ ] In `cli/src/doctor/checks.ts` → `gradeSandboxPrerequisites`, pass the assessment's answer through. Change `describeNestedUserns(nestedUserns, detail, remoteJob)` in the failed-check branch to `describeNestedUserns(nestedUserns, detail, remoteJob, appArmor)`. Leave the `passed` call as it is.
- [ ] In `cli/test/sandbox-prerequisites.test.mjs` → the test *"describeNestedUserns names the cause and its remedy, and who applies it"*, add:

  ```js
    const clearFailed = describeNestedUserns('failed', DETAIL, false, 'clear');
    assert.ok(clearFailed.includes(DETAIL));
    assert.ok(clearFailed.includes(APPARMOR_USERNS_SYSCTL));
    assert.ok(!clearFailed.includes(APPARMOR_LOAD_COMMAND));
    assert.ok(!clearFailed.includes('optOut'));
  ```

- [ ] In `cli/test/doctor-sandbox-prerequisites.test.mjs` → test `(g)`, row `'probe fails, no stock file'`, change its `carries` to `describeNestedUserns('failed', failed.detail, remoteJob, 'clear')`. In row `'missing piece and failed probe'`, change the second expected string to `` `; ${describeNestedUserns('failed', failed.detail, remoteJob, 'clear')}` ``. Both rows use `clear` facts.
- [ ] In the same file → test `(e)`, the real host's AppArmor files decide which `failed` sentence is printed. Replace the single `describeNestedUserns(answer, 'exited 1', remoteJob)` inclusion assertion with one that accepts either variant:

  ```js
        const sentences = [undefined, 'clear'].map((appArmor) => describeNestedUserns(answer, 'exited 1', remoteJob, appArmor));
        assert.ok(sentences.some((sentence) => line.includes(sentence)), `the ${answer} sentence is not carried:\n${line}`);
  ```

- [ ] In `docs/cli.md` §6, change *"and otherwise the profile and `sudo apparmor_parser -r /etc/apparmor.d/bwrap`."* to *"and otherwise, where the sysctl reads `1` or cannot be read, the profile and `sudo apparmor_parser -r /etc/apparmor.d/bwrap`; where the sysctl does not restrict, it says that no AppArmor profile is the cause."*
- [ ] In `docs/cli.md` §7, in the `sandbox-prerequisites` bullet, change *"otherwise it names the profile at `/etc/apparmor.d/bwrap` and the load command §6 fences."* to *"otherwise, where the sysctl restricts or cannot be read, it names the profile at `/etc/apparmor.d/bwrap` and the load command §6 fences, and where it does not, it says no AppArmor profile is the cause."*

The shell judge's `failed` sentence names no remedy, so `cli/templates/scripts/lib/harness-run-lib.sh` needs no change.
