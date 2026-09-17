# Task plan review — iteration 2

All three Must Fix items from iteration 1 are fixed:

- The clarification citations now point at `answered/`.
- Derivation entry 6 is wider, entry 7 has been added, rows 57–68 exist, and Task 25 owns the `ARCHITECTURE.md` §6/§7/§10 restatement.
- Task 19 no longer puts a command inline in a table cell.

I re-ran entries 2–7 exactly as written, and every hit has a row. I re-walked entry 1 against `answered/answer_3.md`. Every index entry has a matching file (25 entries, 25 files, numbers and titles match). Each task has exactly one layer tag. Every task is within 20 points and 5 Work bullets. The order is `cli`, then `plugin`, then `general`, and no `**Depends on:**` points forward. No task targets a conventions document, and every `## Corpus staleness` entry is typed `stale-rule`.

## Must Fix

1. **The launcher only ever runs the runtime copy, but setup and `doctor` also accept "this installation", so a repository that `doctor` passes can have a server that never starts** — `task_9_plan.md`, `task_12_plan.md`, `task_13_plan.md`, and the story index (`feat_docs_catalog_retrieval_story_plan.md`, `## Context`).
   The story index settles that *"Every retrieval operation then runs in a process whose entry file sits beside its peers: this workspace's own CLI when the peers resolve from it (tests, contributors), otherwise the runtime-installed CLI."* The plan wires the three pieces differently:
   - `task_9_plan.md`: `docs-search-server.sh` only execs `$(hr_cache_dir)/retrieval/runtime/node_modules/autonomous-sdlc-harness/dist/cli.js`. When that file is missing it runs `exit 1`. It never looks for the "this installation" copy.
   - `task_12_plan.md` → `setUpRetrieval` step (1): *"When `retrievalCliEntry()?.source === 'this-installation'`, note that the peers resolve from this installation and skip the install."* Case (b) asserts that nothing is created under `retrieval/runtime`.
   - `task_13_plan.md` → `RETRIEVAL_DEPENDENCIES_CHECK`: *"`pass` when `retrievalCliEntry()` answers `this-installation`"*.
   
   So an adopter whose CLI can already load its peers never gets the runtime installed. Examples: the CLI is a devDependency with the peers beside it in the project, or this self-adopted repository runs its own `cli/dist/cli.js`. For that adopter, `doctor` passes all three retrieval checks. The `.mcp.json` launcher still exits 1, so `mcp__harness-docs__search_docs` never loads. That is the first `Top risks:` failure (a granted tool an unattended run never loads, which stalls rather than fails), and no task's Verification can catch it, because every test takes the "this installation" branch.
   **Fix:** Make what the launcher runs, what setup skips on, and what `doctor` passes on the same thing. The simplest version:
   - The runtime directory is the only thing the launcher runs.
   - In `task_12_plan.md`, `setUpRetrieval` skips the install only when `retrievalRuntimeState().installed` is true. Drop the `this-installation` skip.
   - In `task_13_plan.md`, `retrieval-dependencies` passes only on `retrievalRuntimeState().installed`, and says the launcher execs that entry. `retrievalCliEntry()` can stay the index probe's child entry.
   - Keep the suite offline by planting the runtime files the way `task_2_plan.md` case (d) does, through a new `cli/test/helpers/fixture.mjs` helper. Plant them in every retrieval-on `init` and `doctor` case (Tasks 10, 11, 12, 13). Restate Task 12 case (b) as "a planted runtime means no install runs".
   
   If the writer instead keeps the "this installation" branch, `task_9_plan.md` must give the launcher a matching fallback, and a test must show that the launcher starts in that setup. The story index's Context sentence must then describe whichever design ships.

2. **The Scope register misses `docs/cli.md` sentences that retrieval makes false: `.mcp.json` is described as written only for the browser QA driver** — the story index (`feat_docs_catalog_retrieval_story_plan.md`, `## Scope register`), with the owning work in `task_19_plan.md`.
   With the wider probe below, two sites turn up (disposition (ii)). Neither is a row, and no entry reaches them:
   - `docs/cli.md` → `## 6. The failure modes the permission profile encodes`, the paragraph opening *"Both conditions are the gate, and the repository's `.mcp.json` (§3) is gated on the same one, in the same run: with a **mobile** driver neither is written"*. After Task 10, `.mcp.json` is written whenever `retrievalApplies` holds, whatever the QA driver. So with a mobile driver and retrieval on, `.mcp.json` **is** written. §6 is also where `ARCHITECTURE.md` §10 sends readers for *"why gating one side alone is worse than gating neither"*, and Task 25 now applies that reasoning to the retrieval half, but §6 never mentions that half.
   - `docs/cli.md` → `## 3. The re-run contract`, the table row *"`.mcp.json` (written when the QA phase is on **and** its `qa.driver` is `web-playwright`, and never for a mobile driver — §6)"*. Row 34 lists §3 as a Task 19 target. But `task_19_plan.md`'s §3 bullet only *adds* retrieval artifacts. It never corrects this row's condition, so an implementer can add a new row and leave *"never for a mobile driver"* false beside it.
   **Fix:** In `## Scope register`, widen derivation entry 7. Keep its exclusions, and add the alternatives `never for a mobile driver|gated on the same one|\.mcp\.json.{0,80}(written when|gated on|only when)`:
   `git grep -n -i -E "no MCP server|authors? no MCP|publishes none|consumption surface|carries an .mcp__. name|declared in one template|never for a mobile driver|gated on the same one|\.mcp\.json.{0,80}(written when|gated on|only when)" -- . ":!harness-runs" ":!examples/notes-app" ":!cli/src" ":!cli/test"`
   Add a `change` row for each of the two sites, owned by Task 19 (it owns `docs/cli.md` for this branch and has 4 Work bullets).
   In `task_19_plan.md`:
   - Add `docs/cli.md` §6 to `### Targets`.
   - Change the §3 bullet so the existing `.mcp.json` row's condition names both halves: browser servers when QA is on with `web-playwright`, and `harness-docs` when `docs.retrieval` is on.
   - Add a §6 Work bullet that restates the gating paragraph for both halves, each gating its own `.mcp.json` entry and profile fragment in the same run, with the same "one side alone stalls" reasoning.
   - Add a Verification line re-running the widened entry 7 against `docs/cli.md`.

## Should Fix

- **Task 22 still leaves two gate counts stale.** `task_22_plan.md`. Raised in iterations 0 and 1.
  - `docs/development.md` §5 still says the script *"prints the remaining four"*.
  - `scripts/run-gates.sh`'s header still says *"reading four gates' worth of silence as a pass"*.
  
  The Verification grep (`Nine gates\|nine gates\|of the nine`) catches neither.
- **Concurrent opens of the persisted PGlite directory are still not addressed.** `task_5_plan.md`, `task_8_plan.md`, `task_21_plan.md`. Raised in iterations 0 and 1. `docs serve` keeps `<stateDir>/docs_index/` open, while `docs index` or `docs search`, or a second session's server, opens the same directory from another process. Either refuse with a lock, or record the limitation in `docs/retrieval.md` → `## Still open`.
- **Two enumerations the launcher makes incomplete.** `task_9_plan.md`, `task_14_plan.md`. Raised before.
  - `cli/src/generators/outerLoopScripts.ts` → the `agentInvocable` doc comment (*"For the worktree scripts, the notifier and the stream formatter `false` is a calling convention rather than a gate: the guard auto-allows them"*) does not name the launcher. `.claude/context/cli.md` → *"A reviewer holds a change to its module's own header."*
  - `cli/README.md` → *"What the four subcommands do."* lists what `doctor` re-checks, and the plan does not add the three retrieval checks there.
- **Task 20's §7 remedy may end up inline.** `task_20_plan.md`. The §7 bullet asks for each check *"in the section's existing per-check shape … and its remedy (`npx autonomous-sdlc-harness init`)"*. §7's shape is a table plus bullets, so the command would sit inline, while the task's own Verification requires fenced blocks. Say where the fenced remedy block goes (once, after the three checks), and have the cells point to it.
- **The launcher can exit non-zero without a message.** `task_9_plan.md`. `hr_cache_dir` copies `hr_lane_dir`'s `return 1` for an unusable `HOME`. Under `set -euo pipefail`, `entry="$(hr_cache_dir)/…"` then exits with nothing on stderr, and `.claude/context/conventions.md` → `## Output, logging and errors` says *"Every non-zero exit carries a message naming its cause"*. Handle the failed resolution explicitly, with a stderr line.
- **The machine cache directory's mode is unstated.** `task_2_plan.md`, `task_12_plan.md`. `cli/src/machine/paths.ts` choice 3 says a writer creates these directories at `MACHINE_DIR_MODE`. `setUpRetrieval`'s `mkdirSync(runtimeDir, { recursive: true })` also creates `<machineCacheDir()>` itself with the default mode. Either pass the mode, or argue the exception in `paths.ts`'s header when `machineCacheDir()` is added.
- **`## Corpus staleness` still leaves out rules this branch conflicts with.** Story index. Raised in iterations 0 and 1:
  - `.claude/context/cli.md` → the machine-scoped-state list of owners;
  - `.claude/context/conventions.md` → `## The testing bar`'s gate list (no Gate 10);
  - `## Documents of record`'s numbered-deferral rule;
  - `### The order files are created…` item 1 (the schema lands after its readers).
- **Verification commands with baked-in counts.** `task_15_plan.md` and `task_16_plan.md` (*"at least 3 per file"*), `task_17_plan.md` (*"exactly its four entries"*). Replace each with a check on named content.
- **`plugin/agents/README.txt`'s re-derive command.** `task_17_plan.md`. Put `grep -rln "mcp__harness-docs__search_docs" plugin/agents` on its own indented line, as the file's `Sample fixture pointers` section does.

## Nice to Have

- `cli/templates/state-dir/README-root.md` lists *"What git ignores is the machine-local part of it, and it is a short list"*, and *"Some of the harness's state deliberately lives **outside** this tree"* names the platform state and config directories. The new `<stateDir>/docs_index/` ignore rule and the platform cache directory fit both statements, though the conditional QA artifacts are not listed there either.
- `## Corpus staleness` could move out of the story index and into the writer's return, which would keep the index thin (raised before).
