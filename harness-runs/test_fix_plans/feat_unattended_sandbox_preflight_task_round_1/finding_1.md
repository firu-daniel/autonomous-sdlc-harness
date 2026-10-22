### 1. The daemon-path override case rejects its own temp paths as the default agent CLI

**Site:** `cli/test/doctor.test.mjs` → the subtest `'a unit that sets the agent CLI variable is graded against the CLI it names'`, inside `test('the daemon-path check grades the installed unit, and never above a warning', …)` (near line 3412). The failing line is the substring assertion `assert.ok(!line.includes(DEFAULT_AGENT_CLI), \`the warning grades the default the unit overrides:\n${line}\`);`.

**Failing test:** `cli/test/doctor.test.mjs` — `a unit that sets the agent CLI variable is graded against the CLI it names` (its parents `the daemon-path check grades the installed unit, and never above a warning` and the `doctor` suite fail with it).

**The failure, quoted from the log:**

```
                not ok 4 - a unit that sets the agent CLI variable is graded against the CLI it names
            not ok 63 - the daemon-path check grades the installed unit, and never above a warning
        not ok 231 - doctor
```

The gate wrapper (`scripts/run-gates.sh` → `gate`) keeps only the `not ok` lines and the last 25 lines of the suite's output, and deletes its own log afterwards, so the assertion message is not in the log. The diagnosis below is from the current tree. It is new this round: no earlier round exists.

**Diagnosis.** The case checks for the default binary name `claude` (`DEFAULT_AGENT_CLI`, declared near line 3220) with a bare `String.prototype.includes` over the **whole** warning line. That line always contains paths under the system temp directory:

- the unit's path, `unit.targetPath`, which `cli/src/doctor/checks.ts` → the `daemon-path` check prints in every grade (`the ${backend.kind} unit for ${unit.label} at ${unit.targetPath} …`). It sits under `throwawayHome`'s `mkdtemp(join(tmpdir(), 'harness-home-'))`;
- the directory the fixture binary was found in, which `describeMissing` prints (`${binary.name} (${binary.sources.join(', ')}; on this machine in ${directory})`). That directory is `toolchainDir`'s `mkdtemp(join(tmpdir(), 'harness-toolchain-'))`.

The gate runs inside the agent's sandbox, and there `tmpdir()` resolves under `/private/tmp/claude-<uid>/…`. Every temp path therefore contains the substring `claude`, so `!line.includes('claude')` is false however the check grades. The check's own behaviour is correct here: it names `harness-fixture-agent`, the CLI the unit's `HARNESS_AGENT_CLI` points at, and does not list `claude` as a missing binary. The failure comes from where the assertion looks, and it fails on every host whose temp directory path contains `claude`.

The branch did not change this check. Its diff touches `cli/test/doctor.test.mjs` only at `assertRemoteJobClean` and `PRE_BRANCH_CHECK_IDS`. Even so, the fix belongs in this tree: the assertion is the defect.

**Fix.** Make the two binary-name assertions in this subtest match the binary as it appears in the list of missing binaries, not as a substring of the line. `describeMissing` writes each entry as `<name> (<sources>; …)`, so the entry's own shape is `` `${name} (` ``:

- [ ] Replace `assert.ok(line.includes(FIXTURE_AGENT_CLI), …)` with `assert.ok(line.includes(\`${FIXTURE_AGENT_CLI} (\`), …)`. Keep the existing message.
- [ ] Replace `assert.ok(!line.includes(DEFAULT_AGENT_CLI), …)` with `assert.ok(!line.includes(\`${DEFAULT_AGENT_CLI} (\`), …)`. Keep the existing message.
- [ ] Add a short comment above the pair. It should say that the line carries temp paths, and a temp path can contain the binary's name (the sandbox's temp directory is under `claude-<uid>`). That is why the assertion matches the `<name> (` entry shape rather than the bare name.

A temp path such as `/private/tmp/claude-501/harness-home-xyz/…` never contains `claude (`, so the negative assertion still fails if the check grades the default binary. The positive assertion still requires the fixture CLI to be named as a graded entry. Neither assertion gets weaker: both now test the property the subtest's comment states.

The other subtests of this test have the same blind spot in the positive direction, though none of them fails. `'a unit whose PATH reaches every required binary passes'` and `'a unit left on the service manager\'s own directories warns …'` assert `line.includes(DEFAULT_AGENT_CLI)`, which a temp path alone satisfies. Tightening them is optional and outside this finding. If it is done in the same edit, use the same entry shape. The `pass` line writes each binary as `${binary.name} (${binary.sources.join(', ')})`, so `` `${DEFAULT_AGENT_CLI} (` `` fits there too.

No source file under `cli/src/` changes.
