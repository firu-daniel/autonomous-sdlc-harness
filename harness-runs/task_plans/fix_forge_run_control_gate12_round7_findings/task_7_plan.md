### Task 7 — Gate 14: parse every rendered workflow with a YAML parser, refuse 0.6.1's file, and run `actionlint` where installed

**Goal:** Close the gap that let finding 1 ship. No suite parsed the workflow files `init` renders: the stub suites drive `remote-run.sh` directly, and `cli/test/workflow-templates.test.mjs` reads the templates as text. This task adds gate 14, which has three legs:
- **14a.** Renders the workflows the way `init` does, in a throwaway repository outside this checkout, and parses every rendered file with a real YAML parser.
- **14b.** Proves that the same parse refuses 0.6.1's `harness-control.yml`.
- **14c.** Runs `actionlint` over both, where it is on `PATH`, and is reported `SKIPPED` with its reason where it is not, as 13d is.

`scripts/run-gates.sh` runs gate 14, and `commands.test` points at that script.

**Depends on:**
- **Task 1.** It makes the shipped `harness-control.yml` parse. Without it, 14a fails on the template this gate exists to protect.
- **Task 2.** It creates `cli/test/fixtures/harness-control-0.6.1.yml`, 0.6.1's file byte for byte (git blob `1b4f0fc33200d876e4089ebe4013120e48a45335`), which 14b and 14c read as the negative case. This task reads that file and never writes it.

**The parser decision: a dev-only dependency, declared at the workspace root.**
- **Why the gate cannot parse in plain shell:** the CLI has no YAML parser, and a shell gate cannot parse YAML honestly.
- **What is declared:** `js-yaml` (`^3.14.0`), as a `devDependencies` entry of the root `package.json`, beside `ajv-cli`.
- **Why it adds no download:** `ajv-cli` already depends on `js-yaml` `^3.14.0`, so `package-lock.json` already resolves `node_modules/js-yaml` 3.15.1 with `"dev": true`.
- **Why declare it rather than resolve it transitively:** so the gate cannot break silently if `ajv-cli` drops it.
- **Why it breaks no rule:** it is not a runtime dependency of the published package (`cli/package.json` is untouched), so `.claude/context/conventions.md` → `## The stack, in the words the rules below use` → the no-runtime-dependency rule is not engaged.
- **The plan-time evidence the gate is real:** `require('js-yaml').safeLoad` over the shipped 0.6.1 template threw `incomplete explicit mapping pair; a key node is missed … at line 174, column 439`, and parsed the other three templates.

**Where this task stops.** It writes the gate and wires it into `scripts/run-gates.sh`. `docs/development.md` → `## 5.` gains the gate's own paragraph and its counts in Task 8, which `**Depends on:**` this task. Edit nothing in `docs/`.

### Targets

- `package.json` (root): `devDependencies` gains `"js-yaml": "^3.14.0"`.
- `package-lock.json` (root): `packages[""].devDependencies` gains the same entry.
- `scripts/check-rendered-workflows.mjs` (new): the gate.
- `scripts/run-gates.sh`: gate 14, its header counts and its closing report.

**Work:**

- [ ] **`package.json` and `package-lock.json`.** Add `"js-yaml": "^3.14.0"` to root `devDependencies`, and add the identical entry to `package-lock.json` → `packages[""]` → `devDependencies`. Change nothing else in the lockfile: `node_modules/js-yaml` already carries version, resolved URL, integrity and `"dev": true`.
- [ ] **`scripts/check-rendered-workflows.mjs` (new), its contract.** Open it with a header in `scripts/check-flow-graph.sh`'s manner. The header states:
  - that it is hand-written for this repository, not an `init` output;
  - the rule it enforces: every workflow `init` renders under `forge: github` and `execution.target: github-actions` parses as YAML, and 0.6.1's `harness-control.yml` does not;
  - its usage;
  - its exit contract: 0 clean, 1 one or more findings (each printed as `check-rendered-workflows: <file> — <reason>`), 2 bad usage, and 4 only under `--actionlint` when `actionlint` is not on `PATH`.

  The three modes:
  - **(default) — render and parse.**
    1. Make a temp root with `mkdtemp` under `os.tmpdir()`, never inside this checkout (the cross-layer testing bar).
    2. Create a repository inside it and run `git init` there.
    3. Drive this checkout's built CLI, `cli/dist/cli.js`, through `execFileSync` with fixed argument vectors and `--cwd <fixture>`, the same sequence Gate 12's setup uses: `init --non-interactive`, `config set execution.target github-actions`, `config set forge github`, then `init` again.
    4. Isolate every child as `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV` does. Point `CLAUDE_CONFIG_DIR` (`cli/src/machine/paths.ts` → `CLAUDE_HOME_VARIABLE`) at a directory under the same temp root, and drop `HARNESS_SELF_ADOPT`, so no machine-local state is written and this checkout's self-adoption never leaks in.
    5. Fail unless `.github/workflows/` then holds exactly the four harness files. This is the second `Top risks:` entry in the story index: a gate that rendered nothing must not pass.
    6. Parse each with `js-yaml`'s `safeLoad`, loaded through `createRequire` from the workspace root.

    A missing `cli/dist/cli.js` is a finding naming gate 2a.
  - **`--negatives`.** Parse `cli/test/fixtures/harness-control-0.6.1.yml` and exit 0 only if the parse throws. A file that parses is a finding: the gate can no longer see finding 1.
  - **`--actionlint`.** Exit 4 with one line when `actionlint` is not on `PATH`. Otherwise:
    - render as in the default mode;
    - run `actionlint -shellcheck= -pyflakes= <each rendered file>`, and fail on any finding;
    - run it over the negative fixture, and fail unless it reports a `syntax-check` finding.

    If a finding on a shipped template turns out to be a deliberate shape, ignore it with an `-ignore <regex>` named and argued in the header, never by dropping a rule kind wholesale.
- [ ] **`scripts/check-rendered-workflows.mjs`, cleanup.** Remove the temp root on **every** exit path, success, finding or throw, with `fs.rmSync(root, { recursive: true, force: true })` in a `finally`. It must never shell out to `rm -rf` (`.claude/context/conventions.md` → `## Shell assets`), and it must never remove a path it did not create. The lessons ledger → `## Remote and branch-scoped operations` carries the rule this follows: *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."*
- [ ] **`scripts/run-gates.sh`.** After gate 13, add `echo "== gate 14 — rendered workflows parse"` and:
  - `gate "14a rendered workflows parse as YAML" node scripts/check-rendered-workflows.mjs`;
  - `gate "14b 0.6.1's harness-control.yml is refused" node scripts/check-rendered-workflows.mjs --negatives`;
  - **14c**, hand-written as `python_gate` is, because it has a third outcome: status 0 → `passed`, status 4 → `SKIPPED 14c actionlint over the rendered workflows — actionlint is not on PATH` (pushed onto neither array, its reason kept for the closing report), anything else → `failed`.

  Then update the rest of the script:
  - **The header.** It now reads that `docs/development.md` §5 defines fourteen gates, and that this script runs the eight a process can run unattended — gates 1, 2, 3, 4, 6, 11, 13 and 14. It still reports the same six hand-run ones. Add a sentence that gate 14 depends on gate 2a's build and that its `actionlint` leg is SKIPPED where the tool is missing.
  - **The closing `gates this script cannot run` block and the `hand_run` line.** Each gains a conditional 14c `SKIPPED` mention, as 13d's is built. Leave the existing `hand_run="gates 5, 7, 8, 9, 10 and 12 remain hand-run"` string unchanged, because the hand-run set is unchanged.

**Verification:**

- `node --check scripts/check-rendered-workflows.mjs` exits 0. That is a syntax check, not a run of the gate: the gate itself runs in Phase G under `commands.test` and nowhere else (`unit_loop_core.md` → `## The test-run rule`, point 1).
- `npm ls js-yaml` from the repository root lists `js-yaml@3.15.1` directly under the workspace root, and reports it neither `extraneous` nor `invalid`.
- `bash -n scripts/run-gates.sh` exits 0.
- Grep `scripts/run-gates.sh` and find all three of `14a`, `14b` and `14c`, the header's `fourteen` and its new gate list.
- Read `check-rendered-workflows.mjs` for its temp-root lifecycle. The one `mkdtemp` and the one `rmSync` are paired in a `try`/`finally` that encloses every child process. No path outside that root is removed.
