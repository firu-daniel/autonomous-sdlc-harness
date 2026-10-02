### 2. `retrieval-python-index`'s remedy prints `docker compose up -d --wait postgres` with no directory, and in the adopter's repository, where `doctor` runs, there is no compose file

**File:** `cli/src/doctor/checks.ts` (`RETRIEVAL_PYTHON_INDEX_CHECK`): "start the bundled one with \`docker compose up -d --wait postgres\`"

**Problem.** The failing line is the remedy an operator reads at the adopting repository's root, where they ran `doctor`. The compose file is not there. It lives in `docs-retrieval-service/compose.yaml` of a clone of this repository, which `docs/retrieval.md` → `## Turning on the Python backend`, step 2, has the operator make at the matching release tag ("which no published package carries"). Run as printed, the command fails because there is no compose file in that directory. The word "bundled" makes it worse, because it suggests the file ships with the install.

`docs/cli.md` §7 already gives the remedy correctly: *"start the bundled one from the clone's `docs-retrieval-service/` ([`retrieval.md`](retrieval.md) → `## Turning on the Python backend`, step 2)"*. The check's own text is the one surface that drops the directory, and it is the surface the operator acts on.

**Fix.**

- [ ] In `RETRIEVAL_PYTHON_INDEX_CHECK`'s final `fail(...)`, replace
  ```ts
  start the bundled one with \`docker compose up -d --wait postgres\`, or point ${PYTHON_DATABASE_URL_VARIABLE} in that \`env\` object at yours
  ```
  with
  ```ts
  start the bundled one by running \`docker compose up -d --wait postgres\` in docs-retrieval-service/ of a clone of this CLI's repository at its release tag (docs/retrieval.md → \`## Turning on the Python backend\`, step 2), or point ${PYTHON_DATABASE_URL_VARIABLE} in that \`env\` object at yours
  ```
- [ ] In `cli/test/doctor.test.mjs`, the subtest `'FAIL index fails naming the compose command, with no password in the line'`, keep the existing `index.detail.includes('docker compose up -d --wait postgres')` assertion and add one beside it:
  ```js
  assert.ok(index.detail.includes('docs-retrieval-service/'), index.detail);
  ```

Then run that test file alone, `npm test -- test/doctor.test.mjs` from `cli/`. The full suite runs later, in the Run gates phase.
