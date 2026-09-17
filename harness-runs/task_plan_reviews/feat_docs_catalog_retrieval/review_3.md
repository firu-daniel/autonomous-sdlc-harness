# Task plan review — iteration 3

Both Must Fix items from iteration 2 are fixed.

- **The runtime is now the one thing all three pieces key on.** Task 9's launcher runs only the runtime. Task 12 skips the install only on `retrievalRuntimeState().installed`. Task 13's `retrieval-dependencies` passes only on that same predicate. `plantRetrievalRuntime` keeps the retrieval-on `init` and `doctor` cases offline, and Task 13 case (d) covers "peers resolvable, no runtime". The story index's Context matches this design.
- **Derivation entry 7 is wider.** Rows 69 and 70 exist, and Task 19 owns `docs/cli.md` §3 and §6.

What I checked this round:
- I re-ran derivation entries 2–7 exactly as written, and every hit has a row.
- I re-walked entry 1 against `answered/answer_3.md`.
- There are 25 index entries and 25 files, and their numbers and titles match.
- Every task has exactly one layer tag. Every task is within 20 points and 5 `**Work:**` bullets.
- The order is `cli`, then `plugin`, then `general`, and no `**Depends on:**` points to a later task.
- No task targets a conventions document, and every `## Corpus staleness` entry is typed `stale-rule`.
- The code symbols the plan cites exist in the tree. These include `resolveMachineDir`, `invokedPath`, `checkBoolean`, `checkPhaseSections`, `askQaDriver`, `noteIfWritten`, `OUTER_LOOP_SCRIPT_FILES`, `writtenWrappers`, `assertServersMatchProfile`, `mergeInto` and the global `--cwd`.

## Must Fix

1. **Task 22 leaves two gate counts false, in the same paragraph and header it edits** — `task_22_plan.md`.
   This was raised as a Should Fix in iterations 0, 1 and 2 and has not been addressed. It is now a Must Fix, because the planned edit contradicts itself.
   - **`docs/development.md` §5.** The paragraph opens *"**Five of the nine run unattended, and `scripts/run-gates.sh` is how.**"*. Task 22 changes that to *"Five of the ten"*. But the same paragraph goes on to say the script *"runs gates 1, 2, 3, 4 and 6 … and prints the remaining four rather than passing over them"*. After this task the script prints five hand-run gates (5, 7, 8, 9 and 10), so the edited paragraph would say five of ten run unattended and the remaining four are printed. That is wrong.
   - **`scripts/run-gates.sh` header.** Task 22 changes *"defines nine gates … reports the four it cannot"*. It leaves the sentence three lines below unchanged: *"a branch review that reads it as "verified" is reading four gates' worth of silence as a pass."*
   - **The check cannot catch it.** The Verification grep (`Nine gates\|nine gates\|of the nine`) matches neither sentence.

   **Fix:** In `task_22_plan.md`:
   - In the `docs/development.md` §5 Work bullet, also change *"prints the remaining four"* to *"prints the remaining five"*.
   - In the `scripts/run-gates.sh` Work bullet, also change *"four gates' worth of silence"* to *"five gates' worth of silence"*.
   - Widen the Verification grep so it catches both sentences, for example `grep -n -E "Nine gates|nine gates|of the nine|remaining four|four gates|the four it cannot|7, 8 and 9 remain" docs/development.md scripts/run-gates.sh`. The expected result is empty.

## Should Fix

- **Task 25 calls its entry-7 command "verbatim", but it is the old, narrower one.** `task_25_plan.md`. Its first Verification bullet quotes the pre-widening command (no `never for a mobile driver|gated on the same one|\.mcp\.json…` alternatives). Use the widened command from the story index. The expected `no-change` set then also includes the `docs/cli.md` §3 and §6 lines that Task 19 restated (rows 69 and 70).
- **Concurrent opens of the persisted PGlite directory are still not addressed.** `task_5_plan.md`, `task_8_plan.md`, `task_21_plan.md`. Raised in iterations 0–2. Either refuse a second open with a lock, or record the limitation in `docs/retrieval.md` → `## Still open`.
- **The launcher can still exit non-zero with no message.** `task_9_plan.md`. `hr_cache_dir` copies `hr_lane_dir`'s failure on an unusable `HOME`. Under `set -euo pipefail`, `entry="$(hr_cache_dir)/…"` then exits with nothing on stderr. `.claude/context/conventions.md` → `## Output, logging and errors` requires *"Every non-zero exit carries a message naming its cause"*.
- **The machine cache directory's mode is still unstated.** `task_2_plan.md`, `task_12_plan.md`. `cli/src/machine/paths.ts` choice 3 says a writer creates these directories at `MACHINE_DIR_MODE`. `setUpRetrieval`'s `mkdirSync(runtimeDir, { recursive: true })` also creates `machineCacheDir()` itself, with the default mode.
- **An enumeration in `outerLoopScripts.ts` misses the launcher.** `task_9_plan.md`. Its `agentInvocable` doc comment says *"For the worktree scripts, the notifier and the stream formatter `false` is a calling convention rather than a gate: the guard auto-allows them, deliberately."* The launcher's row is in that same class but is not named. Task 9 edits this module.
- **`invokedPath`'s export needs one sentence of justification.** `task_10_plan.md`. `cli/src/generators/scripts.ts` → `wrapperPath`'s doc comment tells callers to compose a path *"instead of restating the join or slicing it back out of an invocation ({@link invokedPath}'s standing prohibition)"*. Task 10 has `repoRoot.ts` slice the path out of `scriptInvocation`'s own output. `invokedPath`'s own doc comment allows that use, and `permissionProfile.ts` already does it with a private copy. Still, the export should update `invokedPath`'s doc comment to say an external caller may use it on `scriptInvocation`'s output only. Otherwise the layer reviewer reads the change as breaking the prohibition.
- **`## Corpus staleness` still leaves out rules this branch conflicts with.** Story index. Raised in iterations 0–2:
  - `.claude/context/cli.md`'s list of machine-scoped-state owners;
  - `.claude/context/conventions.md` → `## The testing bar`'s gate list (no Gate 10);
  - the numbered-deferral rule under `## Documents of record`;
  - `### The order files are created…` item 1 (the schema lands after its readers).
- **Verification commands still have counts baked in.** `task_15_plan.md` and `task_16_plan.md` (*"at least 3 per file"*), and `task_17_plan.md` (*"exactly its four entries"*).
- **Task 20's §7 remedy may still end up inline.** `task_20_plan.md`. Say where the fenced `npx autonomous-sdlc-harness init` block goes (once, after the three checks), and have each check's text point to it.
- **`cli/README.md`'s `doctor` description does not mention the three retrieval checks.** `task_14_plan.md`.

## Nice to Have

- `cli/templates/state-dir/README-root.md` lists what git ignores and what lives outside the state tree. The new `<stateDir>/docs_index/` rule and the machine cache directory fit both lists.
- Task 7 case (c) says a lexical query with no hits prints "no hits and no abstain line". Decide whether `renderResults` prints an empty `result` line in that case, and assert exactly that.
