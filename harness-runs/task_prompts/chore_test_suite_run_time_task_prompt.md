Make this repository's gate suite faster. Autonomous runs will soon execute on remote GitHub Actions runners,
where an hour or more of gate time per branch may be enough to rule the plugin out. The planning phase decides
the approach. The hints below are starting points, not requirements.

> ⚠️ **Locate every anchor in this prompt by quoted text or heading, never by line number.**

---

## The problem, measured

Measured on 2026-09-25 in the main checkout, on a 10-core machine:

- **One `bash scripts/run-gates.sh` takes about 220 s, and `npm test` (gate 4) is 214 s of it.** Every other
  gate takes about a second or less: the manifests, the build and CLI runs, the schema and flow-graph checks,
  6a–6e and 11. So removing gates saves nothing. The suite is the cost.
- **Inside `npm test`, three files dominate.** Each was timed on its own:

  | File | Time | Test cases, approximate |
  |---|---|---|
  | `cli/test/init.test.mjs` | 123 s | 111 |
  | `cli/test/doctor.test.mjs` | 91 s | 74 |
  | `cli/test/stack-presets.test.mjs` | 46 s | 25 |
  | the other 15 files | 0–19 s each | |

  `node --test` runs files in parallel but the tests inside one file in series. No file opts into concurrency,
  so `init.test.mjs` alone sets the suite's minimum time. Its tests and `doctor.test.mjs`'s mostly each start
  the compiled CLI against a new temporary fixture.
- **How often a run pays it.** `plugin/agents/layer-implementer.md` runs `<test_cmd>` (→ `commands.test` →
  `scripts/test.sh` → `scripts/run-gates.sh`) for every unit it implements. The `fix_gate_6a_worktree_git_file`
  run had only 3 tasks, and it still ran the suite at least 18 times, about an hour. A later branch changes how
  often the flow runs the suite. This one makes each run cheaper.

## Hints, for the planner and the reviewers to weigh

Adopt either, both or neither, or find something better. Each choice is argued in the plan, with its expected
saving measured or estimated.

1. **Split the slow test files** into several smaller files, so `node --test`'s parallelism across files is
   used.
2. **Run tests inside a file in parallel** where their fixtures really are separate, after the split or instead
   of it.

## Establish, do not assume

- **Why each of the three slow files is slow.** Is it CLI process startup per case, `git init` per fixture,
  `npm` calls, or something else? Measure before choosing a remedy. A cause shared by every case, such as
  startup cost, may have a remedy that neither hint reaches.
- **Whether the fixtures are really isolated** before any test runs concurrently: shared temp paths, shared
  cache directories under `XDG_CACHE_HOME` or `HOME`, environment variables set per test, or a shared `dist/`.
  A flaky suite is worse than a slow one.
- **What the remote runners will have.** GitHub Actions' standard hosted runners have far fewer cores than the
  machine these numbers came from. Measure or estimate the result at 2–4 cores, not only at 10.

## Out of scope

- When or how often the flow runs `<test_cmd>`. That is the later `feat_run_gates_phase` branch. Leave
  `plugin/agents/layer-implementer.md` and the instruction documents unchanged.
- Removing tests or weakening what an assertion checks to gain speed. A test may move, split or share a fixture.
  It may not stop covering what it covered.
- The remote GitHub Actions execution itself.
- Gates 1a and 11. Separate branches fix them.

## Acceptance

1. Record a before and after for `npm test` and `bash scripts/run-gates.sh`, on this machine and restricted to
   the core count the plan chose to model the remote runners. Both figures are measured, not estimated.
2. The suite passes the same number of assertions before and after, and three consecutive runs are green, so
   no concurrency flake is introduced.
3. `bash scripts/run-gates.sh` prints no new failure.
