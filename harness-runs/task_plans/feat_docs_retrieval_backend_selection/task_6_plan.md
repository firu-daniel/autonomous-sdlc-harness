### Task 6 — Test the six retrieval doctor checks in every state, and the key-absent report

**Goal:** Prove, by driving the compiled CLI's `doctor` against throwaway fixtures, three things. Each new `retrieval-python-*` check has its three states: not applicable, pass and fail. The TypeScript three are not applicable under the Python backend. And with `docs.retrievalBackend` absent, every check that existed before this branch reports exactly what it reported, which is the `doctor` half of Acceptance 1. No case needs Python, Docker or a model.

**Depends on:** Task 5, which adds to `cli/src/doctor/checks.ts` the checks `retrieval-python-dependencies`, `retrieval-python-model-cache` and `retrieval-python-index`, registered after the three TypeScript checks. Its contract:

- with retrieval off they pass with `RETRIEVAL_OFF`, unchanged: `docs.retrieval is off (it needs phases.docs and docs.retrieval both true), so no RAG library is expected and none was resolved`;
- with retrieval on and the backend not `python` they pass with `PYTHON_NOT_SELECTED`;
- with `python` they grade one `harness-docs-retrieval self-check --repo <root>` run, found on `PATH` plus the launcher's fallbacks. They map `packages` / `weights` / `index` to the three checks: an `ok   <q>: <detail>` line passes with the detail, and a `FAIL <q>: <detail>` line fails with the detail plus a remedy.
- An unresolvable command fails `retrieval-python-dependencies`, and the other two fail pointing at it.
- An unparseable answer fails naming the shape.
- The child's `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` is the `.mcp.json` `harness-docs` entry's `env` value, else `postgresql://harness:harness@127.0.0.1:5432/docs_retrieval`, never the shell's.
- The TypeScript three pass with `TYPESCRIPT_NOT_SELECTED` under `python`.

### Targets

- `cli/test/doctor.test.mjs`

**Work:**

- [ ] A helper, placed beside the suite's existing `retrievalDoctorFixture`, that writes a fake `harness-docs-retrieval` executable into a temp `bin` directory. It prints the given stdout lines, writes its `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` and argv to a temp record file, and exits with the given status. The case runs `doctor` with `PATH=<bin>:<system dirs>`, `HOME` pointed at a temp directory, and the suite's `retrievalEnv`. Every temp directory is removed on every exit path. Extend the block comment above `RETRIEVAL_CHECK_IDS` to state the rule these cases enforce.
- [ ] Not-applicable states:
  - with `phases.docs` off, all six retrieval checks pass, and the three Python ones carry `RETRIEVAL_OFF` text exactly;
  - with retrieval on and the key absent, the Python three pass with the not-selected sentence and the fake is **never** invoked (no record file written);
  - with `python`, the TypeScript three pass with their not-applicable sentence even with **no** runtime planted.
- [ ] Pass and fail states under `python`:
  - all three `ok` → three passes, each carrying its detail, and the record shows argv `['self-check', '--repo', dir]` with exactly **one** invocation;
  - `FAIL packages: …` with the other two lines following the package's own shape → `retrieval-python-dependencies` fails with the install remedy, and `retrieval-python-index` fails pointing at it;
  - `FAIL weights: …` → `retrieval-python-model-cache` fails naming `fetch-models`;
  - `FAIL index: could not connect …` → `retrieval-python-index` fails naming `docker compose up -d --wait postgres`, and its line carries no password;
  - no fake on `PATH` → all three fail as stated above;
  - a fake printing two lines → `retrieval-python-dependencies` fails naming the unreadable shape.
- [ ] The database URL the child sees:
  - with no `.mcp.json` `env` value and `HARNESS_DOCS_RETRIEVAL_DATABASE_URL=postgresql://shell@elsewhere/x` exported to `doctor`, the record holds the compose default;
  - with `.mcp.json`'s `harness-docs.env` carrying `postgresql://other@127.0.0.1:5433/repo_two`, the record holds that.
- [ ] Acceptance 1, the report. On one retrieval-on fixture with a planted runtime and model cache, run `doctor` with the key absent and again with `"typescript"` written explicitly. Assert both:
  - every check id outside the three `retrieval-python-*` ids reports the same status and the same detail in both runs, and the three TypeScript retrieval checks report their pre-existing details;
  - the three new ids are the only ids added to the pre-branch list, which is frozen in the case as a literal array of the 40 ids `CHECKS` held before this branch, and each passes with the not-selected sentence.

**Verification:**

- `npm test -- test/doctor.test.mjs` from `cli/` passes.
- No case starts a real `harness-docs-retrieval`, a database or a network: every invocation is the fake, and `HOME` is a temp directory.
- The existing `Acceptance 6 (a)`–`(d)` retrieval cases pass unchanged.
