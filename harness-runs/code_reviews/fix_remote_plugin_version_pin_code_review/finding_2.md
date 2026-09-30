### 2. `renderedCliVersions` reads a trailing YAML comment on the pin line as part of the version

**File:** `cli/src/remote/githubActions.ts` (`CLI_VERSION_LINE`) — "const CLI_VERSION_LINE = new RegExp("

The pin reader captures everything after `HARNESS_CLI_VERSION:` up to the end of the line:

```ts
const CLI_VERSION_LINE = new RegExp(`^[ \\t]*${CLI_VERSION_VARIABLE}:[ \\t]*(.*?)[ \\t]*$`);
```

The workflow is "yours to tune", so an adopter may leave a line such as `HARNESS_CLI_VERSION: '0.5.0'  # pinned deliberately`. YAML treats everything from `#` onward as a comment. This regex captures `'0.5.0'  # pinned deliberately` instead. `unquoteYamlScalar` then leaves it as it is, because the value no longer ends with a quote. Two consumers go wrong:

- `doctor`'s `remote-execution` check (`cli/src/doctor/checks.ts` → `REMOTE_EXECUTION_CHECK`) warns that the workflow was rendered for another version when it was not. Its "stay" remedy then prints an unrunnable command, `npx autonomous-sdlc-harness@'0.5.0'  # pinned deliberately doctor`.
- `init --upgrade-workflows` (`cli/src/generators/githubWorkflows.ts` → `writeGithubWorkflows`) sees a differing pin and replaces a workflow that is already at this CLI's version, which writes a needless `.bak`.

**Fix:**

- [ ] In `cli/src/remote/githubActions.ts`, allow an optional trailing comment after the value. A YAML comment starts with whitespace followed by `#`:

  ```ts
  const CLI_VERSION_LINE = new RegExp(`^[ \\t]*${CLI_VERSION_VARIABLE}:[ \\t]*(.*?)(?:[ \\t]+#.*)?[ \\t]*$`);
  ```

  Amend `renderedCliVersions`' doc comment to say so. Change "the value of each `<indent>HARNESS_CLI_VERSION: <value>` line, quotes stripped" to "the value of each `<indent>HARNESS_CLI_VERSION: <value>` line, a trailing ` # comment` and the quotes stripped".
- [ ] In `cli/test/doctor.test.mjs`, beside the case `'on, with harness-run.yml pinned to this version, passes and says so'`, add a case that appends a comment to each pin line and still expects the pass:

  ```js
  await t.test('on, with a comment after the pin, still reads the pin', async (subtest) => {
    const dir = await remoteFixture(subtest);
    await pushWorkflows(dir);
    rewritePins(dir, '$& # pinned by hand');
    const stub = await ghStub(subtest);

    const { stdout, stderr } = await doctorWithStub(dir, stub);

    const line = reportLine(stdout, 'pass', 'remote-execution');
    assert.ok(line?.includes("rendered for this CLI's own version"), `${stdout}\n${stderr}`);
    assert.ok(!`${stdout}\n${stderr}`.includes(UPGRADE_ROUTE), `${stdout}\n${stderr}`);
  });
  ```

  `rewritePins` and `PIN_LINE` are already defined in that block, and `$&` re-inserts the matched line. This test file is the one the fix edits, so it is the only suite the fix runs. The full suite runs in the Run gates phase.
