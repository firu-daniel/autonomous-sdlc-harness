### Task 11 — The `init --docs-retrieval` flag, its prompt and the config write

**Goal:** Let `init` turn retrieval on. It asks about retrieval **only when the docs phase is on**, and a matching flag answers the question non-interactively. The documented default is off. An answer of yes writes `docs.retrieval: true` into the config `init` generates.

**Depends on:** Task 1, which declares `HarnessDocs.retrieval?: boolean` and `retrievalApplies(config)` in `cli/src/config/model.ts`, and makes `docs.retrieval: true` without `phases.docs: true` a structural **error** in `cli/src/config/check.ts`. The generated config therefore has to satisfy that before `writeHarnessConfig`'s guard sees it. The tests also use Task 6's helpers in `cli/test/helpers/fixture.mjs`: `retrievalEnv(cacheHome)`, which returns `{ XDG_CACHE_HOME: cacheHome, AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB: 'hash-v1' }`, `plantModelFiles(cacheHome)`, and `plantRetrievalRuntime(cacheHome, options?)`, which plants the runtime layout Task 2's `retrievalRuntimeState()` answers `installed: true` for.

**Where this task stops.** This task decides and records the answer. Installing the runtime and downloading the models for a config that has retrieval on is Task 12, which reads `retrievalApplies(effective)` after the plan is applied. The wiring the answer switches on is Task 10's.

**The interaction rule this follows** (`.claude/context/cli.md` → *"Every interactive decision has three parts"*). The flag supplies the answer. The documented non-interactive default is **off**. The prompt is shown only when the flag was absent, both descriptors are a TTY (`canPrompt`), the docs phase is on in the config being **generated**, and no `--non-interactive` or `--quiet` was given.

### Targets

- `cli/src/commands/init.ts` — the `INIT_OPTIONS` row, the parser, the `askRetrieval` callback.
- `cli/src/generators/harnessConfig.ts` — `HarnessConfigFlags.docsRetrieval`, the `askRetrieval` option, the write in `buildConfig`.
- `cli/test/init.test.mjs` — the flag, refusal and default cases.

**Work:**

- [ ] `init.ts`: add the row `{ key: 'docsRetrieval', flag: '--docs-retrieval', kind: 'switch', summary: 'Turn docs retrieval on: a local search tool over the docs and conventions (with --docs)', configValue: 'docs.retrieval' }` directly after `--docs-root`. `initOptions`'s completeness check then forces the `InitFlags` key. In `parseInitFlags`, add `docsRetrieval: switches.has('docsRetrieval')`. Refuse `--docs-retrieval` without `--docs` inside the parser, before the git gate, as the analyze pair is refused: `init: --docs-retrieval needs --docs: retrieval searches the documentation corpus the docs phase maintains, so it is legal only with that phase on`.
- [ ] `harnessConfig.ts`: add `readonly docsRetrieval?: boolean` to `HarnessConfigFlags` (doc: *`--docs-retrieval`. Read only when `--docs` is on*), and `readonly askRetrieval?: () => boolean | undefined` to `BuildConfigOptions`, documented on `askDriver`'s pattern: called at most once, only while `phases.docs` is on and `--docs-retrieval` was not given, with `undefined` meaning the run could not be asked. In `buildConfig`'s `if (phases.docs)` arm, resolve `retrieval = flags.docsRetrieval === true ? true : (askRetrieval?.() ?? false)`, and write `config.docs = { root: …, retrieval: true }` only when it is `true`. An absent key is the schema default, so a declined or unasked run writes the same `docs` section it wrote before this task. When the answer is off because the run could not ask, push one `noteIfWritten` line: `docs retrieval stays off: this run could not ask. Pass --docs-retrieval to turn it on, or later run \`npx autonomous-sdlc-harness config set docs.retrieval true\` and then \`init --force\``.
- [ ] `init.ts`: add `askRetrieval(ctx)` beside `askQaDriver`, using `askYesNo` with default **no** and `canPrompt` from `cli/src/core/prompt.ts`. The question states the cost: *Turn on docs retrieval? It adds a local search tool over the docs and conventions for the plan writer and reviewers. Setup installs about 300 MB of local runtime and downloads two small models into a cache shared by every checkout on this machine. Off by default.* Pass `askRetrieval: () => askRetrieval(ctx)` to `writeHarnessConfig`. The flag's `configValue` puts it in `discardedConfigFlagsWarning`'s class automatically, so a kept-config run that received it says so.
- [ ] `init.test.mjs`: add cases through the compiled CLI, stdin a pipe, so no prompt is reachable.
  - (a) `init --docs --docs-retrieval` writes `docs.retrieval: true`. Run it with `retrievalEnv(cacheHome)`, `plantModelFiles(cacheHome)` and `plantRetrievalRuntime(cacheHome)` from `cli/test/helpers/fixture.mjs`, so Task 12's later setup step finds the runtime installed and the models cached, and runs neither `npm` nor a download.
  - (b) `init --docs` writes no `retrieval` key, and its notes carry `docs retrieval stays off: this run could not ask`.
  - (c) `init --docs-retrieval` without `--docs` exits non-zero with the refusal, leaves the fixture byte-identical, and creates no repository when combined with `--git-init`.
  - (d) A kept-config re-run with `--docs-retrieval` warns that the flag's value went unwritten and names `config set docs.retrieval <value>`.
  - (e) `init --help` lists `--docs-retrieval` after `--docs-root`.

**Verification:**

- `bash scripts/test.sh` exits zero with cases (a) to (e) green.
- `cli/test/prompt.test.mjs` still passes. The new prompt goes through `askYesNo`, so the source guard on `cli/src/core/prompt.ts` needs no change.
- In a real terminal, `node cli/dist/cli.js init --docs --dry-run` against a scratch repository outside this checkout asks the retrieval question once. With `--docs` absent it asks nothing.
