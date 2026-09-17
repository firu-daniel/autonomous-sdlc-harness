### Task 20 — Document the `docs` verb, the `doctor` retrieval checks and the launcher in `docs/cli.md`

**Goal:** Document the new `docs` verb in the CLI reference: its four sub-verbs, their output and exit contracts, and the three `doctor` checks that grade retrieval. Bring the document's opening verb list and testing section up to five commands, and add the launcher to §5's description of the outer-loop family.

**Depends on:**

- **Task 19**, which owns `docs/cli.md` for this branch and has already added the `init` flag, the setup step and the re-run entries.
- **Task 6:** `docs index [--in-memory]` prints one line, `docs index: <files> files, <chunks> chunks; embedded <e>, unchanged <u>, deleted <d>`, with `; rebuilt for a new embedder` appended when a rebuild happened. `--in-memory` writes nothing. It refuses when retrieval is off or model files are missing.
- **Task 7:** `docs search <query> [--k <n>] [--mode lexical|vector|fused|fused-rerank]` defaults to `fused-rerank`. It prints `N. <path>#<anchor> (score 0.000)` lines with an indented snippet, or `no confident match` (exit 0). Abstention happens only in `fused-rerank`, below the provisional `ABSTAIN_SCORE_THRESHOLD`.
- **Task 8:** `docs serve` is a stdio MCP server named `harness-docs`, with one read-only tool `search_docs(query, k)` (`k` from 1 to 20, default 5), fully qualified `mcp__harness-docs__search_docs`. It refreshes before each query, and nothing but the transport writes to stdout.
- **Task 12:** `docs fetch-models` is the one command that reaches the network. `init` runs it, it refuses under the test stub, and it prints `docs fetch-models: <embedding model> and <rerank model> cached in <dir>`.
- **Task 13:** the checks `retrieval-dependencies`, `retrieval-model-cache` and `retrieval-index`, after `browser-wiring`. Each passes with a "retrieval is off" sentence when off, and each fails when on and unsatisfied. `retrieval-dependencies` passes only when the machine-shared runtime (`<machineCacheDir>/retrieval/runtime`) is installed at this CLI's version with every optional peer, because that is the installation `docs-search-server.sh` `exec`s; a CLI that can load its own peers does not pass it. `retrieval-index` runs `docs index --in-memory` in a child process with a 600-second timeout.
- **Task 9:** the `OUTER_LOOP_SCRIPTS` row `Object.freeze({ file: DOCS_SEARCH_SERVER_SCRIPT_NAME, mode: 0o755, agentInvocable: false })` for `docs-search-server.sh` (`cli/src/generators/outerLoopScripts.ts`), always written, with no `DENY_SCRIPT_BASENAMES` entry. It is started by the agent runner from `.mcp.json` (Task 10's `harness-docs` server) when `docs.retrieval` is on, never by a dispatched agent's Bash call and never by the watcher process or a person, and it `exec`s the machine-shared runtime's `docs serve`.
- **Tasks 2 and 3:** `XDG_CACHE_HOME` relocates the shared cache (Task 2, `machineCacheDir()`), and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` (`hash-v1` or `hash-v2`) selects the deterministic stubs (Task 3, `RETRIEVAL_STUB_ENV`).

### Targets

- `docs/cli.md` — the opening sentence *"The commands are `init`, `doctor`, `config` and `daemon`."*, §5's paragraph *"**Two families land in `scriptsDir`, and only one of them is generated.**"* (story index `## Scope register` row 57), §7 (`doctor`), a new `docs` section, and §10 (*How this is tested*).

**Work:**

- [ ] Opening: *"The commands are `init`, `doctor`, `config`, `daemon` and `docs`."* Keep the rest of the paragraph.
- [ ] §5, the paragraph *"**Two families land in `scriptsDir`, and only one of them is generated.**"*. In the outer-loop member list, *"the run watcher, the git wrappers, the worktree tooling, the scratch runner and the shared library they all source"* gains *"the docs-retrieval server launcher"* before *"the scratch runner"*. The clause *"false of everything the watcher process or a person starts"* becomes *"false of everything the watcher process, the agent runner or a person starts"*, with a short clause saying the agent runner starts `docs-search-server.sh` from `.mcp.json` when `docs.retrieval` is on and its one tool is granted by the retrieval half of the profile rather than by a script entry. Leave the guard sentences (`DENY_SCRIPT_BASENAMES`, the command-string bounds) unchanged: the launcher gets no deny entry. Change nothing else in the paragraph.
- [ ] §7: add the three retrieval checks, in the section's existing per-check shape and in `CHECKS` order, each with its off sentence, its fail condition and its remedy (`npx autonomous-sdlc-harness init`). For `retrieval-dependencies`, the fail condition says it grades the runtime the launcher runs, not whether the CLI running `doctor` can load its peers. State that `retrieval-index` builds in memory in a child process: it starts no server and writes nothing, keeping §7's *"writes nothing"* promise.
- [ ] New section `## 11. \`docs\``, appended after §10 so no existing section number or anchor moves. In order:
  - what the verb is for, opt-in and not yet measured, with a pointer to `retrieval.md`;
  - one sub-section per sub-verb, with its synopsis in a fenced block, its output line and its exit contract;
  - the MCP tool's name, input schema and result text;
  - the stdout rule for `serve`;
  - the offline rule, that only `fetch-models` reaches the network.
- [ ] §10: add the retrieval suites. `cli/test/docs-retrieval.test.mjs` drives `docs index` and `docs search`, and `docs serve` through the MCP SDK's client over stdio, all under the stub env and a temp `XDG_CACHE_HOME` with planted model files. `cli/test/retrieval-loading.test.mjs` covers the no-load guarantee. Add the retrieval cases in `init.test.mjs`, `profile.test.mjs`, `doctor.test.mjs` and `outer-loop-scripts.test.mjs`. Close with what is deliberately not covered (the real install and model download) and where it is covered by hand: `development.md` §5 Gate 10.

**Verification:**

- `node cli/dist/cli.js docs --help` and the new section list the same four sub-verbs with the same flags.
- `grep -n "^## " docs/cli.md` shows §1–§10 unchanged in text and order, with §11 last.
- Every command an adopter runs in the new text sits in a fenced block, one per line (`harness-runs/lessons.md` → *Adopter-facing documentation*).
- `git grep -n -E "doctor.{1,6}config.{1,10}daemon" -- docs/cli.md` shows only the sentence that now names `docs` as well.
- `grep -n "watcher process or a person starts" docs/cli.md` is empty, and `grep -n "docs-retrieval server launcher" docs/cli.md` returns the §5 paragraph's line.
