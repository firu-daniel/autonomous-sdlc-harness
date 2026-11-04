### Task 15 — Test `teardown`: only recorded branches, and the default-branch confirmation

**Goal:** Prove that `teardown` (Task 9) deletes every branch the state file records, and nothing else. It confirms the default branch rather than changing it, and it reports with exit 5 anything it could not finish.

**Depends on:**
- Task 10: `makeGate12Fixture`, `ghStub` and `runRound`.
- Task 9's contract, for each name in `branches[]` plus `other_branch`:
  - `git push --no-verify origin --delete <name>` when origin lists it;
  - `git update-ref -d refs/heads/<name>` when the ref exists;
  - the name is removed from the state once both are gone;
  - a failure keeps the name and prints its hand command, with exit 5.
  
  The live default branch is compared with `default_branch`; a mismatch prints `gh repo edit <slug> --default-branch <recorded>` and exits 5, and nothing is changed. An unrestored variable is reported the same way. `runs[]`, `tokens` and the evidence directory are kept, and the last line reads `teardown: <n> branch(es) deleted; default branch <name> confirmed`.

### Targets

- `cli/test/gate12-sandbox-round-teardown.test.mjs` (new).

**Work:**

- [ ] Header. The rule: teardown never removes what the state file does not record, and confirms the default branch rather than changing it. State that it reads no tree.
- [ ] A fixture whose origin holds two recorded branches, a recorded `other_branch` and an unrecorded `gate12_js1_settings_19990101000000`. After teardown:
  - the three recorded branches are gone from origin and as local refs;
  - the unrecorded one is still on origin at its commit;
  - `branches[]` is empty and `other_branch` is null;
  - `runs[]` is unchanged;
  - the last line counts 3.
- [ ] A stub default `other` against a recorded `main` exits 5, with the `gh repo edit` command on stderr and no `repo edit` call in the stub log.
- [ ] A recorded branch whose origin delete fails, because the bare repository's `receive.denyDeletes` is set, stays in `branches[]`, and the run exits 5 naming it. A second teardown, after the setting is cleared, deletes it.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-teardown.test.mjs` passes. It is this task's own new test file.
