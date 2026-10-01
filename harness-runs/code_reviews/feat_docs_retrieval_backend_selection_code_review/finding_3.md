### 3. The launcher forwards `INT` to a Python child that ignores it, so an interrupt never reaches the server, and no test covers signal forwarding

**File:** `cli/templates/scripts/docs-search-server.sh` (the Python branch): "trap 'trapped=1; kill -INT \"$child\" 2>/dev/null || true' INT"
**And:** the same file's header, `# WHY THE PYTHON BRANCH IS NOT \`exec\`ED.` ("`TERM` / `INT` are forwarded to it so the runner's shutdown still reaches the server")
**And:** `docs/retrieval.md` (`## How it fits together` → **Launcher and registration.**): "and `TERM` and `INT` are forwarded to it so the runner's shutdown still reaches the server"

**Problem.** The launcher starts the server as an asynchronous command, `harness-docs-retrieval serve-mcp --repo "$root" <&0 &`, from a non-interactive script where job control is off. Bash starts such a command with `SIGINT` and `SIGQUIT` **ignored** (bash manual, *Signals*: "When job control is not in effect, asynchronous commands ignore SIGINT and SIGQUIT in addition to these inherited handlers"). CPython installs its `KeyboardInterrupt` handler only when the inherited `SIGINT` disposition is the default, so the Python server keeps ignoring it. The server stops only on `SIGTERM` or on stdin closing (`docs-retrieval-service/src/harness_docs_retrieval/mcp_server.py` → `loop.add_signal_handler(signal.SIGTERM, stop)`).

So when the launcher gets `INT`, its trap forwards `INT` to a child that drops it. The `while [ "$trapped" -eq 1 ]` loop then waits again, and the launcher hangs until the runner closes stdin or escalates. Before this branch, the TypeScript path `exec`ed, so the server received `INT` itself. The header and `docs/retrieval.md` both promise that `INT` reaches the server. No case in `cli/test/outer-loop-scripts.test.mjs` or `docs-retrieval-service/tests/test_launcher_e2e.py` sends the launcher a signal, so neither the `TERM` path nor the `INT` path is exercised.

**Fix.** Pass both signals on as `TERM`, the signal the server stops on, and say so.

- [ ] In `cli/templates/scripts/docs-search-server.sh`, replace
  ```bash
  trap 'trapped=1; kill -INT "$child" 2>/dev/null || true' INT
  ```
  with
  ```bash
  trap 'trapped=1; kill -TERM "$child" 2>/dev/null || true' INT
  ```
- [ ] In the same file's header, replace the sentence "It runs as a child with stdin passed explicitly, and `TERM` / `INT` are forwarded to it so the runner's shutdown still reaches the server." with
  ```
  # It runs as a child with stdin passed explicitly, and a `TERM` or an `INT`
  # the launcher receives is passed on to it as `TERM`, the signal the server
  # stops on: bash starts a background child with `SIGINT` ignored when job
  # control is off, and Python installs no handler over an ignored `SIGINT`, so
  # an `INT` passed on as itself would never arrive.
  ```
- [ ] In `docs/retrieval.md` → **Launcher and registration.**, replace "and `TERM` and `INT` are forwarded to it so the runner's shutdown still reaches the server" with "and a `TERM` or an `INT` the launcher receives reaches it as `TERM`, the signal the server stops on, so the runner's shutdown still reaches the server".
- [ ] Add a case to `cli/test/outer-loop-scripts.test.mjs` after `'the launcher exits 3 and keeps the backend\'s own reason when the Python backend fails'`: `'the launcher passes an INT on to the Python backend as TERM'`.
  - Build the fixture with `launcherFixture(t, { docs: { retrieval: true, retrievalBackend: 'python' }, fake: false })`.
  - Write the fake into the `fake-bin` directory yourself (`join(dir, 'fake-bin', PYTHON_RETRIEVAL_COMMAND)`, mode `0o755`), as a `#!/usr/bin/env node` script that:
    - prints `ready` on stderr;
    - on `SIGTERM`, prints `{"got":"SIGTERM"}` on stderr and exits `0`;
    - keeps itself alive with `setInterval(() => {}, 1000)`.
  - Start the launcher with `spawn('bash', [join(dir, LAUNCHER_PATH)], { cwd: dir, env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] })` from `node:child_process`.
  - Once stderr carries `ready`, call `child.kill('SIGINT')`, then await `close` under a 10-second bound that fails the case on expiry.
  - Assert that the exit status is `0`, that stdout is empty, and that `jsonLines(stderr)` deep-equals `[{ got: 'SIGTERM' }]`.

Then run that test file alone, `npm test -- test/outer-loop-scripts.test.mjs` from `cli/`. The full suite runs later, in the Run gates phase.
