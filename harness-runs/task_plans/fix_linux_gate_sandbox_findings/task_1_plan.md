### Task 1 — F13: run `doctor-profile-sandbox` case `(d)` under the retrieval stub and an isolated cache, and lead its failure messages with the cause

**Goal:** Make `cli/test/doctor-profile-sandbox.test.mjs` → `(d) warns when docs retrieval is on and the docs-search-server entry is gone` hermetic, so it passes inside the launcher's `bwrap` worker on Linux. Every `init` or `doctor` failure message in the suite must lead with the line that names its cause, so a failure the next container run meets prints that cause inside the gate's 40-line diagnostic cap.

**The finding (docs/sandbox-verification.md §5 F13).** In T3's worker (2026-11-03) case `(d)` failed with `init --force exited 2`. Its diagnostic was cut `truncated after 40 lines` before the cause, because the message prints `init`'s whole stdout before its stderr. The case passed on macOS and in #239's Run gates.

**The cause, read from the code.** Case `(d)` is the only case in this suite that runs `init` with `docs.retrieval` on. It runs that `init` with no `env` argument, so the CLI uses the host's real machine cache (`XDG_CACHE_HOME` or `$HOME/.cache`) with no retrieval stub. `cli/src/retrieval/setup.ts` → `setUpRuntime` then finds the runtime not installed, and it calls `mkdirSync(runtimeDir, { recursive: true })` outside its warning path. Under the launcher's vector the home directory is read-only (`--ro-bind / /`, only the target and a private `/tmp` writable), so that call throws, and `cli/src/cli.ts` reports an unanticipated throw as `(unexpected)` with exit 2. On a host where the mkdir succeeds, the same case goes on to `npm install` from the network. That breaks `.claude/context/cli.md`'s *"No test … reaches the network by default"*. Every other retrieval case avoids both by passing `helpers/fixture.mjs` → `retrievalEnv(cacheHome)`: `XDG_CACHE_HOME` under the case, and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`, under which `setUpRuntime` warns and installs nothing.

**What this task does not do.** It does not change `cli/src/retrieval/setup.ts`. Moving that `mkdirSync` into the warning path would let `init` go on to `setUpModels`. In this workspace `retrievalCliEntry()` resolves this installation, so that step spawns `docs fetch-models`, a download that no offline case can bound. The story index's `## Context` records this, and Task 13 writes it into F13's row as an observation.

### Targets

- `cli/test/doctor-profile-sandbox.test.mjs`

**Work:**

- [ ] Give case `(d)` a case-owned cache directory under `os.tmpdir()`, removed in `t.after`. Pass `retrievalEnv(<that dir>)` (imported from `./helpers/fixture.mjs`) as the `env` of **every** CLI call the case makes after it turns retrieval on: its `init --force`, and both `doctorLine` calls. Extend `doctorLine(dir, status, args, id)` with an optional trailing `env` parameter that it hands to `runCli`, leaving every existing caller unchanged.
- [ ] Add one file-local helper that formats a failed CLI run as `<label> exited <status>: <last non-empty stderr line>` on its **first** line, followed by stderr and then stdout. Use it in every assertion message in this file that today interpolates `${init.stdout}\n${init.stderr}` or `${result.stdout}\n${result.stderr}`: `wiredFixture`, `configureSandbox`, case `(d)` and `doctorLine`. Keep each assertion itself unchanged.
- [ ] Update the file's header comment. It should state that a case turning retrieval on runs under `retrievalEnv` and never against the machine cache (F13), and that a failure message leads with the cause line because the gate's diagnostic is capped at 40 lines.
- [ ] Do not mark case `(d)`, or any case, skipped on any platform.

**Verification:**

- `npm test --workspace cli -- test/doctor-profile-sandbox.test.mjs` passes. Case `(d)` keeps its title, `(d) warns when docs retrieval is on and the docs-search-server entry is gone`, byte for byte, because `docs/sandbox-verification.md` cites it.
- Case `(d)` now passes `retrievalEnv(` to its `init --force` and to both of its `doctorLine` calls. Reading `cli/src/retrieval/setup.ts` → `setUpRuntime` against that env shows no `mkdirSync` and no `npm` call is reached: the stub branch returns first.
- The task's own test run is the plain command above, with no environment prefix, pipe or `cd` (`.claude/context/conventions.md` → `## The testing bar`). No intermediate tree state is run: the cause stays **read from the code**, as the story index's `## Context` and F13's row record it, and the next Gate 15 container run confirms it.
