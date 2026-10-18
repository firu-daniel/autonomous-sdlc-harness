# Story: Generate `sandbox.excludedCommands` in the form that actually matches

## Context

The unattended permission profile names two commands that must run outside Claude Code's sandbox: the main checkout's own `push-branch.sh` and `refresh-branch.sh`. On macOS an SSH push or fetch fails inside the sandbox. Today the generator writes those two `sandbox.excludedCommands` entries as `Bash(bash <main>/<scriptsDir>/<wrapper>.sh:*)`, the `permissions.allow` rule form (`cli/src/generators/sandboxProfile.ts` → `expectedSandbox`, through `cli/src/generators/profileEntries.ts` → `bashScriptRule`). `docs/sandbox-verification.md` measured that this form matches nothing (rows P1, P1a, R0, F3). P1a also measured the forms that do match, on Claude Code 2.1.299, macOS, headless. `bash <s>:*` is excluded with an argument. `bash <s>` is excluded only with no argument. P2 showed the real push landing under `bash <main>/scripts/push-branch.sh:*`.

This branch delivers four things:

- the generator writes `bash <main>/<scriptsDir>/<wrapper>.sh:*`;
- `doctor`'s `profile-sandbox` expects that form and reports the old `Bash(…)` form as **stale** (`warn` by default, `fail` under `--remote-job`), so an adopter regenerates;
- the wrapper headers record the `GIT_SSH_COMMAND` decision with its measured basis;
- every document that describes the excluded entries says the right thing.

**Exactly two entries, both under the main checkout's absolute path, stay the invariant.** The repo-relative and sibling-worktree spellings stay in `allow` and stay sandboxed. That is the task prompt's own constraint, and `cli/src/generators/sandboxProfile.ts`'s header rule.

**The work is cut into five single-layer tasks, in bottom-up ship order.**

- **Task 1 (`cli`)** owns the new producer and the expected values. Every other task restates its exact strings.
- **Task 2 (`cli`)** grades a profile against them in `doctor`.
- **Task 3 (`cli`)** is the adopter-facing template text: the profile `_README` line and the two wrapper headers.
- **Tasks 4 and 5 (`general`)** carry the change into the project's own documentation and into the live worked example `examples/notes-app/`.

`phases.parity` is `false`, so nothing here is held to a reference implementation.

**The `GIT_SSH_COMMAND` decision (task prompt goal 3) is: keep it.** The measurement already on record answers the question. `docs/sandbox-verification.md` P1a, taken with the corrected `bash <s>:*` entry, records that an excluded command inherits none of the sandbox's proxy variables, while a sandboxed one carries `GIT_SSH_COMMAND=ssh … -o ProxyCommand='nc -X 5 -x localhost:<port> %h %p'`. So an excluded call never receives the sandbox's value, only the agent runner's own, which an operator may rely on. A call that does receive the proxy value is running sandboxed, where SSH has no route except that proxy, so dropping it would make no push succeed. Task 3 writes this answer into the wrapper headers, and Task 4 writes it into `docs/cli.md` §6. A fresh confirmation on the regenerated profile is a manual step (below), because only a human can run it.

**What this branch does not touch.**

- The self-adopted copies under this checkout's root `scripts/`, and the gitignored, machine-local `.claude/settings.autonomous.json`. Both are `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`). Regenerating the profile is the manual step below.
- The plugin. No `plugin/` file quotes the entry spelling. `plugin/agents/layer-implementer.md` names the key only (scope register row 28).
- The measured rows of `docs/sandbox-verification.md`. Their cells are a dated record. Task 4 adds an owed-re-run note, and the re-run itself is manual.

**Top risks:**

- **The generator and `doctor` disagree on the spelling.** Every freshly generated profile would then fail `profile-sandbox` under `--remote-job`, and every remote job would park at preflight. Task 1 makes one producer the source of both the generated entries and the stale list. Task 2's suite proves end to end, on a freshly `init`-wired fixture, that a fresh profile passes and an old-form profile is reported stale.
- **The corrected form is measured on one Claude Code version and one platform only** (2.1.299, macOS, headless). Matching could change silently in a later release. Task 4 states the measurement's scope in `docs/cli.md`. The manual re-run below is the only thing that proves the regenerated profile pushes.
- **The live worked example drifts from what `init` now renders.** Task 5 re-renders exactly the two changed parts of `examples/notes-app/.claude/settings.autonomous.json`.

**Manual setup required:**

1. **Regenerate this checkout's own profile after Tasks 1–3 land** (depends on Tasks 1, 2 and 3). The main checkout's `.claude/settings.autonomous.json` must carry `bash <main>/scripts/push-branch.sh:*` and `bash <main>/scripts/refresh-branch.sh:*` in `sandbox.excludedCommands`. There are two routes:
   - the forced self-adopt `init` that `docs/sandbox-verification.md` → `## 0. Method` describes, restoring the hand-kept files it rewrites;
   - replacing the two entries by hand with the strings `doctor` names, for a maintainer holding off the root `scripts/` re-render.

   Then confirm `doctor`'s `profile-sandbox` passes with and without `--remote-job`.
2. **Re-run the owed rows** (depends on step 1 and Task 4). Use the §0 launch line and the same judging rule (`git ls-remote`, never the exit status) to re-run these `docs/sandbox-verification.md` §3 rows on the regenerated profile:
   - **P1** and **P3**, the push rows;
   - **R0–R4**, the refresh rows;
   - **L1** and **L2**, the leading-dash rows;
   - **C1**, **C2** and **K2**. Each ran through the main wrapper while the wrapper was still sandboxed. Under the corrected entry it runs unsandboxed, which is the case their refusals exist for.

   Update each row's Observed and Verdict cells, the Stamp, the headline bullet and F3. Then remove the owed-re-run note Task 4 adds.
3. **Re-confirm the `GIT_SSH_COMMAND` answer on the regenerated profile** (depends on step 1). Use P1a's method: a scratch profile excluding `bash <probe>:*`, where the probe prints whether `GIT_SSH_COMMAND` is set, called once from a sandboxed session. Record the result as a new §3 row beside P1a. If an excluded call does receive the sandbox's value, the answer Task 3 and Task 4 recorded is wrong and must be reopened.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** In every flow that dispatches the `committer` agent, that agent is the committing role. In the supervised flow, which dispatches none, the orchestrator itself is. No implementer changes a marker here, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_sandbox_excluded_commands_form/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Generate `sandbox.excludedCommands` as `bash <main>/<scriptsDir>/<wrapper>.sh:*` and expose the stale `Bash(…)` form _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Have `doctor`'s `profile-sandbox` expect the new form and report the old one as stale _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Restate the excluded spelling in the profile template's `_README` and record the `GIT_SSH_COMMAND` answer in both wrapper headers _(layer: cli)_ _(points: 10)_
4. [x] **Task 4** — Update `docs/cli.md` §6 and §7, `ARCHITECTURE.md` and `docs/sandbox-verification.md` for the corrected form _(layer: general)_ _(points: 15)_
5. [x] **Task 5** — Re-render the worked example's profile for the corrected form _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Generate `excludedCommands` as `bash <main>/scripts/<wrapper>.sh:*`, the form measured to match, in `cli/src/generators` and in every document that quotes the old spelling: the profile `_README`, `docs/cli.md` §6, `ARCHITECTURE.md`, and the tests."* Together with goal 4: *"Re-run the push, refresh and leading-dash rows of `docs/sandbox-verification.md` on the regenerated profile, and update them."*

The register covers the plan's **corpus** targets only. The source and test targets (`cli/src/generators/*.ts`, `cli/src/doctor/checks.ts`, `cli/test/*.test.mjs`) and the wrapper templates' header comments are code and code comments, so each per-task file owns them.

**Derivation entry A — corpus files (command).** Re-run verbatim from the checkout root:

`git grep -n -e excludedCommands -e 'excluded rule' -e 'excluded wrapper' -e 'excluded spelling' -e 'excluded command' -e GIT_SSH_COMMAND -- ARCHITECTURE.md README.md ROADMAP.md llms.txt CONTRIBUTING.md docs plugin cli/templates/claude cli/README.md examples/notes-app/.claude examples/notes-app/README.md`

**Derivation entry B — rows of the standing verification matrix (procedure).**

- **First step, runnable:** `grep -n -e '^| [A-Z][0-9]' -e '^- \*\*' docs/sandbox-verification.md`.
- **Artifact:** `docs/sandbox-verification.md`, the standing record of measured sandbox rows.
- **Traversal:** the headline bullets, then §0's method list, then every table row in file order (§1 D-rows, §3 P/R/H/C/K/L-rows, §5 F-rows), then the §6 bullets.
- **Decision rule:** every §3 row is reached, because §3 is the wrappers' table and goal 4 names its push, refresh and leading-dash rows. Outside §3, a row, bullet or note is reached when it names `excludedCommands`, an excluded wrapper rule or the entry spelling.

**Closure invariant:** every site either derivation entry reaches appears as a row below. The rows reached by entry B are identified by their row id.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ARCHITECTURE.md:116`, the permission-model row ("Entries are matched against the raw command string, so their form is load-bearing") | — | A, `excludedCommands` | `change` | Task 4 |
| 2 | `cli/templates/claude/settings.autonomous.json:19` ("which then ignores `excludedCommands`, `network.allowedDomains` …") | template | A, `excludedCommands` | `no-change` | about which settings scopes an admin-required sandbox ignores, not about the entry spelling |
| 3 | `cli/templates/claude/settings.autonomous.json:21` ("git's network traffic leaves through the two excluded wrappers named below") | template | A, `excluded wrapper` | `no-change` | becomes true with this fix; it does not quote a spelling |
| 4 | `cli/templates/claude/settings.autonomous.json:24`, the `TWO COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING` line | template | A, `excludedCommands` | `change` | Task 3 |
| 5 | `cli/templates/claude/settings.autonomous.json:28` ("the two excluded wrappers above keep the environment an HTTPS push needs") | template | A, `excluded wrapper` | `no-change` | about the credentials block's reach, unaffected by the spelling |
| 6 | `cli/templates/claude/settings.autonomous.json:122` (`"excludedCommands": []`) | template | A, `excludedCommands` | `no-change` | the empty list the generator fills. Task 1 changes what fills it, not the template |
| 7 | `docs/cli.md:348` ("which then ignores `excludedCommands` …") | — | A, `excludedCommands` | `no-change` | as row 2 |
| 8 | `docs/cli.md:362` ("Git's network traffic leaves through the two excluded wrappers below") | — | A, `excluded wrapper` | `no-change` | as row 3 |
| 9 | `docs/cli.md:364`, **Two wrappers run outside the sandbox, each in one spelling.** (quotes `Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)`) | — | A, `excludedCommands` | `change` | Task 4 |
| 10 | `docs/cli.md:366`, **The excluded rule's `:*` accepts any argument …** (ends "and keep `GIT_SSH_COMMAND`, which an operator may rely on for the SSH push") | — | A, `excluded rule`, `GIT_SSH_COMMAND` | `change` | Task 4: the measured `GIT_SSH_COMMAND` answer. The `:*` sentence stays true |
| 11 | `docs/cli.md:368`, **Everything that runs outside the sandbox is write-protected on both sides** | — | A, `excluded wrapper` | `no-change` | the protected set is unchanged |
| 12 | `docs/cli.md:370`, **Credentials are denied on both sides.** | — | A, `excluded wrapper` | `no-change` | as row 5 |
| 13 | `docs/cli.md:415`, residual 5 ("The environment reaching an excluded wrapper is trusted as it arrives …") | — | A, `excluded wrapper` | `no-change` | stays true. The `GIT_SSH_COMMAND` answer lives in row 10's paragraph |
| 14 | `docs/cli.md:513`, the **`profile-sandbox` is a warning without `--remote-job` …** bullet | — | A, `excludedCommands` | `change` | Task 4: the stale-form finding |
| 15 | `docs/sandbox-verification.md:3`, **Who reads this:** | — | A, `excluded wrapper` | `no-change` | audience statement, still accurate |
| 16 | `docs/sandbox-verification.md:10`, headline bullet "The two `excludedCommands` entries match nothing" | — | A, B | `change` | Task 4: a pointer to the fix and to the owed re-run. Manual setup step 2 rewrites it after the re-run |
| 17 | `docs/sandbox-verification.md:25`, §0 "`excludedCommands` names the 2 wrapper rules;" | — | A, B | `no-change` | a dated record of the 2026-10-14 regeneration |
| 18 | `docs/sandbox-verification.md` row D1 | — | B, names the excluded wrapper rules | `no-change` | measured cell. Task 4 edits the note under §1 instead (row 19) |
| 19 | `docs/sandbox-verification.md:72`, note under §1 ("D1 grades the `excludedCommands` spelling P1 shows to be inert") | — | A, B | `change` | Task 4 |
| 20 | `docs/sandbox-verification.md` row P1 | — | B, §3 row | `no-change` | measured cell. Re-run is Manual setup step 2 |
| 21 | `docs/sandbox-verification.md:91`, row P1a | — | A, B | `no-change` | the measurement Task 3's header and Task 4's `docs/cli.md` text cite. Unchanged |
| 22 | `docs/sandbox-verification.md:92`, row P2 | — | A, B | `no-change` | scratch-profile record of the corrected form, kept as the evidence the form was chosen on |
| 23 | `docs/sandbox-verification.md` row P3 | — | B, §3 row | `no-change` | re-run is Manual setup step 2 |
| 24 | `docs/sandbox-verification.md` rows R0, R1, R2, R3, R4 (one row each in the matrix) | — | B, §3 rows | `no-change` | re-run is Manual setup step 2 |
| 25 | `docs/sandbox-verification.md` row H1 | — | B, §3 row | `no-change` | a push from an ordinary terminal, outside any profile. The excluded spelling does not reach it |
| 26 | `docs/sandbox-verification.md` rows C1, C2, K2 | — | B, §3 rows | `no-change` | re-run is Manual setup step 2: the wrapper now runs unsandboxed, the case these refusals exist for |
| 27 | `docs/sandbox-verification.md` row K1 | — | B, §3 row | `no-change` | a sandboxed `git config` write, with no wrapper involved |
| 28 | `plugin/agents/layer-implementer.md:154`, **A sandbox refusal is the boundary working, in every mode.** | — | A, `excludedCommands` | `no-change` | names the key as something never to route through or ask for, not a spelling |
| 29 | `docs/sandbox-verification.md` rows L1, L2 | — | B, §3 rows | `no-change` | re-run is Manual setup step 2 |
| 30 | `docs/sandbox-verification.md`, §3's opening (above the wrapper table) | — | B, §3 | `change` | Task 4: the owed-re-run note naming the rows of 20, 23, 24, 26 and 29 |
| 31 | `docs/sandbox-verification.md:177`, row F3 | — | A, B | `change` | Task 4: the follow-up cell |
| 32 | `docs/sandbox-verification.md:195`, §6 **Headless parity:** bullet | — | A, B | `no-change` | records what the documents *expected* at measurement time. It stays true |
| 33 | `examples/notes-app/.claude/settings.autonomous.json:19` | notes-app render | A, `excludedCommands` | `no-change` | mirror of row 2 |
| 34 | `examples/notes-app/.claude/settings.autonomous.json:21` | notes-app render | A, `excluded wrapper` | `no-change` | mirror of row 3 |
| 35 | `examples/notes-app/.claude/settings.autonomous.json:24` | notes-app render | A, `excludedCommands` | `change` | Task 5, mirroring Task 3's row 4 |
| 36 | `examples/notes-app/.claude/settings.autonomous.json:28` | notes-app render | A, `excluded wrapper` | `no-change` | mirror of row 5 |
| 37 | `examples/notes-app/.claude/settings.autonomous.json:281`, the `"excludedCommands"` list | notes-app render | A, `excludedCommands` | `change` | Task 5, mirroring Task 1's generated entries |
