### Task 2 — Own the remote-execution names and the `gh` probe in `cli/src/remote/githubActions.ts`

**Goal:** Give every name the CLI and the shipped shell assets share about remote execution one owner — the workflow file names and paths, the template directory, the repository secret and variable names, the state-artifact name and the `gh` test-seam variable — plus the one bounded, fixed-argv way this CLI runs `gh`.

**Depends on:** Task 1, whose `remoteExecutionApplies(config)` this module's header names as the switch its consumers test before using anything here.

**Why a new area.** `.claude/context/cli.md` → `## Naming and file layout`: an area names one responsibility and a responsibility none of the existing areas names gets its own. Remote execution is read by a generator (Task 17) and by two `doctor` checks (Tasks 18–19); it belongs to neither `generators/` nor `doctor/`. The new area `cli/src/remote/` is raised in the story index's `## Corpus staleness` for that document's area list.

**The exports, stated once for every consumer** (Tasks 17, 18, 19 import them; Tasks 5, 8, 15 and 16 mirror the literals in shell and YAML and declare the mirror in their own headers):

| Export | Value |
|---|---|
| `WORKFLOWS_DIR` | `.github/workflows` |
| `WORKFLOW_RUN_FILE` / `WORKFLOW_RUN_PATH` | `harness-run.yml` / `.github/workflows/harness-run.yml` |
| `WORKFLOW_RESUME_FILE` / `WORKFLOW_RESUME_PATH` | `harness-resume.yml` / `.github/workflows/harness-resume.yml` |
| `WORKFLOW_TEMPLATE_DIR` | `github/workflows` (under `cli/templates/`, stored without the dot) |
| `STATE_ARTIFACT_NAME` | `harness-state` |
| `RUNNER_VARIABLE` | `HARNESS_RUNNER` |
| `REMOTE_STOP_VARIABLE` | `HARNESS_REMOTE_STOP` |
| `OAUTH_TOKEN_SECRET` / `API_KEY_SECRET` | `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY` |
| `PUSH_URL_SECRET` / `GIT_TOKEN_SECRET` | `HARNESS_PUSH_URL` / `HARNESS_GIT_TOKEN` |
| `GH_CLI_VARIABLE` | `HARNESS_GH_CLI` — the test seam: the binary this CLI and `remote-run.sh` run as `gh`, `${HARNESS_GH_CLI:-gh}` |
| `ghCli(): string` | `process.env[GH_CLI_VARIABLE]` when non-empty, else `'gh'` |
| `runGh(args: readonly string[], cwd: string): GhResult \| undefined` | one bounded `spawnSync(ghCli(), args, { cwd, timeout, encoding: 'utf8' })`; `undefined` when the binary does not spawn at all; `GhResult = { status: number \| null; stdout: string; stderr: string }` |

### Targets

- `cli/src/remote/githubActions.ts` (new).
- `cli/test/remote-names.test.mjs` (new) — the accompanying suite.

**Work:**

- [ ] Write the module header: what it owns, the rule it exists to enforce in the words *"The rule this module exists to enforce"* (every remote-execution name has one owner, and a copy anywhere else in `cli/src` imports it), the list of shell and YAML mirrors that must agree byte for byte (`cli/templates/scripts/remote-run.sh`, `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/github/workflows/harness-run.yml`, `harness-resume.yml`), and why `GH_CLI_VARIABLE` exists — the same test-seam reason `${HARNESS_AGENT_CLI:-claude}` exists (`docs/outer-loop-verification.md` → `## 0. Method and fixtures` → *The agent stub*), since every real route into `gh` reaches the network.
- [ ] Declare the table's constants. Name the environment variable through `GH_CLI_VARIABLE` everywhere, including in any message (`.claude/context/conventions.md` → *"An environment-variable name is a constant with an owner too"*).
- [ ] Implement `runGh` with `spawnSync` and a fixed argument vector — never a shell string — bounded by a named timeout constant with a comment saying why it is a bound, not a deadline; state in its doc comment why `spawnSync` rather than `execFileSync` (the caller needs stderr on a zero exit, the reason `cli/src/commands/doctor.ts` → `runNotifier` gives). It reads no configuration and writes nothing.
- [ ] `remote-names.test.mjs`: import the compiled module from `cli/dist/remote/githubActions.js`; assert each path joins its dir and file; with `HARNESS_GH_CLI` pointed at a stub script under a temp directory, `runGh(['--version'], tmp)` returns the stub's stdout and status; with it pointed at a path that does not exist, `runGh` returns `undefined`. Open the file with the rule it enforces.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0.
- `grep -rn "harness-run.yml\|HARNESS_GH_CLI\|CLAUDE_CODE_OAUTH_TOKEN" cli/src` finds each literal only in `cli/src/remote/githubActions.ts`.
- The module imports only `node:` builtins and relative siblings.

**Deviations from plan:** `bash scripts/test.sh` exited 1 in the implementing session, on gate 11 (docs-retrieval relevance floor) alone: "the retrieval runtime is not installed, so the optional peers cannot be loaded" — a machine-state precondition this task touches nothing of. Gate 4 (`npm test`, which runs `cli/test/remote-names.test.mjs`) and every other runnable gate passed; `bash scripts/typecheck.sh` passed.
