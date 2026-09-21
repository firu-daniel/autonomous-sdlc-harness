### Task 13 — The three `doctor` retrieval checks

**Goal:** When retrieval is on, `doctor` asks three questions: is the runtime the `.mcp.json` launcher runs installed with its peers, are the models cached, and does the index build. It grades each **fail** when the answer is no. When retrieval is off, all three pass with a sentence saying nothing is expected, and none of them resolves a retrieval package. That is Acceptance 6.

**Depends on:**

- **Task 1:** `retrievalApplies(config)` (`cli/src/config/model.ts`), the one gate. `cli/src/doctor/checks.ts`'s header choice 1 forbids a second spelling.
- **Task 2:** `retrievalPeers()`, `retrievalRuntimeState(): { installed: boolean; version: string | undefined; missing: readonly string[] }` (the one "is the runtime installed?" predicate, which Task 12's `setUpRetrieval` also reads), `retrievalRuntimeDir()`, `retrievalModelCacheDir()`, `RUNTIME_CLI_RELATIVE` and `retrievalCliEntry(): { entry: string; source: 'this-installation' | 'runtime' } | undefined` (`cli/src/retrieval/runtime.ts`).
- **Task 3:** `modelFilesPresent(cacheDir): { present: boolean; missing: readonly string[] }` (`cli/src/retrieval/models.ts`).
- **Task 6:** `docs index --in-memory`, which builds the whole index in memory and writes nothing. It exits non-zero with a message when retrieval is off or model files are missing, and prints one line, `docs index: <files> files, <chunks> chunks; embedded <e>, unchanged <u>, deleted <d>`. Also the test helpers `retrievalEnv(cacheHome)`, `plantModelFiles(cacheHome)`, `plantRetrievalRuntime(cacheHome, options?: { version?: string })` (plants the layout `retrievalRuntimeState()` answers `installed: true` for, at this package's version or `options.version`) and `writeRetrievalConfig(dir)` (`cli/test/helpers/fixture.mjs`).
- **Task 9:** `docs-search-server.sh` `exec`s `<retrievalRuntimeDir()>/<RUNTIME_CLI_RELATIVE>` and nothing else, and exits 1 when that file is missing.
- **Task 12:** `init` installs the runtime and downloads the models. Every failure message here names `npx autonomous-sdlc-harness init` as the remedy.

**Where this task stops.** `doctor` repairs nothing and installs nothing (`cli/src/doctor/checks.ts` → *"It repairs nothing"*). The index probe runs **in a child process**, because `Check.run` is synchronous and PGlite is not, and because the child is the installation whose peers resolve beside it. The child builds in memory, so the module header's *"writes nothing"* still holds.

### Targets

- `cli/src/doctor/checks.ts` — three checks, their `CHECKS` rows, and a header paragraph.
- `cli/test/doctor.test.mjs` — Acceptance 6.

**Work:**

- [ ] `RETRIEVAL_DEPENDENCIES_CHECK`, with `id: 'retrieval-dependencies'` and title `docs retrieval's libraries resolve`.
  - `unevaluated` without a root or config, on `BROWSER_WIRING_CHECK`'s pattern.
  - When `retrievalApplies` is false, `pass`: `docs.retrieval is off (it needs phases.docs and docs.retrieval both true), so no retrieval library is expected and none was resolved`.
  - Otherwise, `pass` **only** when `retrievalRuntimeState().installed` is `true`, naming the runtime directory and the state's `version`, and saying that `.mcp.json`'s launcher `docs-search-server.sh` `exec`s that installation's entry. Whether this installation resolves its own peers is not consulted: the launcher (Task 9) never runs this installation, so a pass on it would be a pass on a server that never starts.
  - Otherwise `fail`, naming each entry of `retrievalRuntimeState().missing`, the runtime directory, that the launcher has nothing to `exec` until it is installed, and the remedy `npx autonomous-sdlc-harness init`.
  - The check does **not** re-spell the file tests: "is the runtime installed?" is answered by Task 2's `retrievalRuntimeState` alone, the same export `init`'s `setUpRetrieval` (Task 12) skips the install on, so the two cannot drift (`cli/src/doctor/checks.ts` header choice 1; `.claude/context/cli.md`: nothing `doctor` reports is re-derived from a second copy).
  - It never `import()`s a peer.
- [ ] `RETRIEVAL_MODEL_CACHE_CHECK`, with `id: 'retrieval-model-cache'` and title `docs retrieval's models are cached`. It has the same off-arm. On, it runs `modelFilesPresent(retrievalModelCacheDir())`, with `pass` naming the directory, or `fail` listing up to five missing files, then the count of the rest, then the remedy `npx autonomous-sdlc-harness init`, which downloads them at setup time. The message adds that an unattended run has no web access, so a model missing now is never fetched later.
- [ ] `RETRIEVAL_INDEX_CHECK`, with `id: 'retrieval-index'` and title `the docs-retrieval index builds`. It has the same off-arm.
  - On, the child's entry is `retrievalCliEntry()` (this installation when its peers resolve, else the runtime): the probe asks whether an index builds, not what the launcher runs, which `retrieval-dependencies` grades. With no entry it is `fail`: `cannot build without the retrieval libraries (see retrieval-dependencies)`.
  - Otherwise it runs `execFileSync(process.execPath, [entry, 'docs', 'index', '--in-memory', '--cwd', repoRoot], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: RETRIEVAL_INDEX_TIMEOUT_MS, env: process.env })`. Declare `RETRIEVAL_INDEX_TIMEOUT_MS = 600_000` with a doc comment: a real corpus embeds every chunk on this probe.
  - On exit 0 the grade is `pass` with the child's trimmed stdout line. On a non-zero exit or a timeout it is `fail` with the last non-empty stderr line.
  - **Deviations from plan:** the `fail` detail wraps that stderr line (or the spawn error's message when stderr is empty, as on a timeout that printed nothing) and appends the `npx autonomous-sdlc-harness init` remedy, per Task 12's dependency note that every failure message here names it.
  - The doc comment argues why this probe is a child process that builds in memory rather than a launch of the server, citing choice 3's *"never a launch"*.
- [ ] Add the three to `CHECKS` directly after `BROWSER_WIRING_CHECK`, in the order above, and add a paragraph to the module header naming them and the child-process choice. Search `cli/test/doctor.test.mjs` for any assertion on the number of checks or the ordered id list (`grep -n "browser-wiring" cli/test/doctor.test.mjs`) and extend it to the new ids.
- [ ] `doctor.test.mjs`: add a group whose header states Acceptance 6. Build a fixture with `writeRetrievalConfig(dir)`, a `docs/` with one Markdown file and `conventions.md`, and `retrievalEnv(cacheHome)`, `plantModelFiles(cacheHome)` and `plantRetrievalRuntime(cacheHome)`.
  - (a) `doctor` reports `retrieval-dependencies`, `retrieval-model-cache` and `retrieval-index` each as passing (the planted runtime is installed, and the stub builds), and the tree is byte-identical afterwards.
  - (b) After the planted model directory is removed in process, `retrieval-model-cache` and `retrieval-index` each report failing, `doctor` exits non-zero, and the model check's text names `npx autonomous-sdlc-harness init`.
  - (c) On an ordinary fixture with `phases.docs` off, all three report passing with the off sentence.
  - (d) **No runtime, peers resolvable.** The (a) fixture without `plantRetrievalRuntime` (the workspace CLI running the suite still resolves its own peers): `retrieval-dependencies` reports failing, naming `autonomous-sdlc-harness` and `npx autonomous-sdlc-harness init`, and `doctor` exits non-zero. The same with `plantRetrievalRuntime(cacheHome, { version: '0.0.0-other' })` also fails. This is the case where the launcher would exit 1.

**Verification:**

- `bash scripts/test.sh` exits zero with cases (a) to (d) green, and the existing `doctor` exit-contract cases (`cli/test/doctor.test.mjs`) stay green. A freshly wired repository with retrieval off still exits as before.
- Task 2's `retrieval-loading.test.mjs` case (b) stays green. It runs `doctor` under a hook that refuses to resolve any retrieval package, which fails if an off-arm reaches `retrievalCliEntry()`.
- `grep -n "import(" cli/src/doctor/checks.ts` is empty, and `grep -n "node_modules" cli/src/doctor/checks.ts` is empty: the install-state tests live only in `retrievalRuntimeState`.
