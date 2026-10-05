### 3. `remote-github` treats a harness workflow missing from a truncated workflow listing as parsed, where it cannot tell

**File:** `cli/src/doctor/checks.ts` (`WORKFLOWS_ENDPOINT`) — "actions/workflows?per_page=100"; (`workflowNamesByPathOf`); and (`REMOTE_GITHUB_CHECK`) — "if (namesByPath.get(path) !== path) continue;".

**Problem.** The new "listed by its path" judgement reads a single page of the Actions workflow listing, at most 100 entries. The listing reports the repository's full count in `total_count`. In a repository with more than 100 workflows, a harness workflow can fall outside the page. `namesByPath.get(path)` then returns `undefined`, the loop `continue`s, and the check reports nothing about that file. If that file is the unparseable `harness-control.yml` this check exists to catch, `doctor --check-github` passes over it.

That breaks the grading contract `REMOTE_GITHUB_CHECK`'s own doc comment states: any call answered in a shape not fully understood is a *cannot tell* warning, because "*cannot tell* is not *missing*". A path the listing never reached is a *cannot tell*, not a pass. The check must not fail on it, because the file may be fine, but it must warn.

**Fix.**

- [ ] In `cli/src/doctor/checks.ts`, have `workflowNamesByPathOf` also return how many workflows the repository has and how many the page listed. Rename nothing else:

  ```ts
  /**
   * Each `workflows[]` entry's `name`, keyed by its `path`, of an Actions workflow listing — entries
   * lacking a string `name` or `path` are skipped — with the listing's `total_count` (the entry count when
   * absent) and the number of entries listed, or `undefined` when there is no `workflows` array.
   */
  function workflowNamesByPathOf(
    stdout: string,
  ): { readonly names: ReadonlyMap<string, string>; readonly total: number; readonly listed: number } | undefined {
    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      return undefined;
    }
    if (!isJsonObject(parsed as JsonValue)) return undefined;
    const { workflows, total_count: totalCount } = parsed as { readonly workflows?: unknown; readonly total_count?: unknown };
    if (!Array.isArray(workflows)) return undefined;
    const names = new Map<string, string>();
    for (const item of workflows as JsonValue[]) {
      if (isJsonObject(item) && typeof item.name === 'string' && typeof item.path === 'string') names.set(item.path, item.name);
    }
    const total = typeof totalCount === 'number' && Number.isInteger(totalCount) ? totalCount : workflows.length;
    return { names, total, listed: workflows.length };
  }
  ```

- [ ] In `REMOTE_GITHUB_CHECK`, read `listingRead.names` where the code now reads `namesByPath`. Collect the judged paths that are absent from a listing that did not reach every workflow, and warn once naming them:

  ```ts
        const listingRead = workflowNamesByPathOf(listing.answer.stdout);
        if (listingRead === undefined) {
          warnings.push(`cannot tell ${parsable}: ${listing.call} answered in a shape this check does not read`);
        } else {
          const version = ownManifestString('version');
          const judged = forgeTriggerApplies(ctx.config)
            ? [WORKFLOW_RUN_PATH, WORKFLOW_RESUME_PATH, WORKFLOW_TRIGGER_PATH, WORKFLOW_CONTROL_PATH]
            : [WORKFLOW_RUN_PATH, WORKFLOW_RESUME_PATH];
          const unseen: string[] = [];
          for (const path of judged) {
            const name = listingRead.names.get(path);
            if (name === undefined) {
              if (listingRead.total > listingRead.listed) unseen.push(path);
              continue;
            }
            if (name !== path) continue;
            // … the existing `unparsed.add(path)`, `route` and `failures.push(…)` lines, unchanged …
          }
          if (unseen.length > 0) {
            warnings.push(`cannot tell whether GitHub could parse ${nameList(unseen)}: ${listing.call} listed ${listingRead.listed} of the repository's ${listingRead.total} workflows, and not ${unseen.length === 1 ? 'that one' : 'those'}`);
          }
        }
  ```

  `nameList` is already imported in this module.

- [ ] In the same doc comment of `REMOTE_GITHUB_CHECK`, in its `warn` bullet, extend "the workflow listing unread, so whether GitHub could parse the harness workflows cannot be told" to "the workflow listing unread, or not reaching a judged harness workflow because the repository has more workflows than one page lists, so whether GitHub could parse it cannot be told".

- [ ] In `docs/cli.md`, in the `remote-execution` and `remote-github` bullet, replace "where the workflow listing cannot be read, so whether GitHub could parse the harness workflows cannot be told" with "where the workflow listing cannot be read, or does not reach a harness workflow because the repository has more than 100 workflows, so whether GitHub could parse it cannot be told".

- [ ] In `cli/test/doctor.test.mjs`, add a row to the `warning` table of `the remote-github check asks GitHub only under --check-github and grades e…`, beside the two workflow-listing rows this branch added:

  ```js
      ['the workflow listing stops before the harness workflows', { workflows: { out: JSON.stringify({ total_count: 150, workflows: [] }) } }, 'listed 0 of the repository\'s 150 workflows'],
  ```

Verify with `npm test -- test/doctor.test.mjs` from `cli/`. It is the one test file this fix edits; the full suite runs later, in the gates phase.

**Deviations from plan:**

- The `docs/cli.md` sub-step was not done in the `cli` dispatch. `docs/` falls under the `general` layer (path `.`), not under `cli`. A dispatch for that layer has to make the edit. The `general` dispatch made it, word for word as the sub-step specifies.
- In the first `npm test -- test/doctor.test.mjs` run, the unrelated subtest `an ordinary wired repository passes jj-repository, and no other report line mentions jj` failed once. The next two runs passed in full (265/265), so it is intermittent and not caused by this change.
