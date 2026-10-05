### 5. `remote-github`'s full-page *cannot tell* branch for collaborators has no test case

**File:** `cli/src/doctor/checks.ts` (`REMOTE_GITHUB_CHECK`) — "returned a full page of ${COLLABORATORS_PAGE_SIZE} collaborators with no writer beyond the list, and more may exist"

`REMOTE_GITHUB_CHECK` reads one page of collaborators (`COLLABORATORS_ENDPOINT`, `per_page=100`). When that page names no writer beyond the list but holds exactly `COLLABORATORS_PAGE_SIZE` entries, the check warns that it *cannot tell*: more collaborators may sit on a second page. Two places state this behaviour as part of the contract: the check's own doc comment (*"A full first page with no such writer is a *cannot tell* warning"*), and `docs/cli.md` (*"or where a full page of 100 collaborators names no writer beyond the list"*).

The new cases in `cli/test/doctor.test.mjs` cover the other branches of that read: a writer beyond the list, a non-writer, a case-insensitive match, a refused read, and the two no-read conditions. None drives a full page. So a regression goes unnoticed: dropping the page-size test, or comparing `writers.count` with the wrong value, would turn a page-truncated listing into a silent pass. The `cli` layer's bar is a case for each graded outcome of a changed check (`.claude/context/cli.md` → `## What "done" means here`).

**Fix:**

- [ ] In `cli/test/doctor.test.mjs`, beside the test `a collaborator without push is not a writer and draws no warning`, add:

  ```js
  await t.test('a full page of collaborators with no writer beyond the list is a cannot-tell warning', async (subtest) => {
    const dir = await pushedRemoteFixture(subtest);
    const stub = await answeringGhStub(subtest);
    const readers = Array.from({ length: 99 }, (_, i) => [`reader${i}`, false]);
    answerGh(stub, { collaborators: { out: collaborators(...readers) } });

    const { status, stdout, stderr } = await checkGithub(dir, stub);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    const line = reportLine(stderr, 'warn', 'remote-github');
    assert.ok(
      line?.includes('cannot tell whether any writer is beyond HARNESS_RUN_ACTORS') && line.includes('a full page of 100 collaborators'),
      `${stdout}\n${stderr}`,
    );
    assert.ok(!line.includes(writersWarning), line);
  });
  ```

  The `collaborators` helper already prepends `fixture-owner`, so 99 readers make a page of exactly 100.

The only test file this fix edits is `cli/test/doctor.test.mjs`, so that is the only test it runs.
