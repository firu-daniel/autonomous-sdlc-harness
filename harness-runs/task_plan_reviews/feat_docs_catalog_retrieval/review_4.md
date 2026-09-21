# Task plan review — iteration 4

The iteration 3 Must Fix is fixed. `task_22_plan.md` now changes *"prints the remaining four"* and *"four gates' worth of silence"*. Its Verification grep now covers `remaining four|four gates|the four it cannot|7, 8 and 9 remain`. I checked `docs/development.md` §5 and `scripts/run-gates.sh`, and no other gate-count sentence exists in the tree (`git grep -i -E "nine gates|5, 7, 8 and 9"`).

What I checked this round:
- I re-ran derivation entries 2–7 exactly as written, and every hit has a row. I re-walked entry 1 against `answered/answer_3.md`, which names ten agents, the same ten as rows 1–10.
- There are 25 index entries and 25 files, and their numbers and titles match. Each task has exactly one layer tag, stays within 20 points and 5 `**Work:**` bullets, and follows the order `cli`, then `plugin`, then `general`. No `**Depends on:**` points to a later task.
- No task targets a conventions document, and every `## Corpus staleness` entry is typed `stale-rule`.

## Must Fix

1. **Task 24 leaves "who starts the rest" false in the paragraph it edits, and forbids fixing it** — `task_24_plan.md`.
   Row 51 of the story index's `## Scope register` is reached by entry 6's alternative `watcher process or (by )?(you|a person)`. The story index says that alternative exists to catch the family's *"who starts the rest"* claims. Row 51's paragraph in `docs/watcher.md` §2 (*"**Why only four carry a profile entry, and why that is not the reachability answer.**"*) says:
   > The rest are run by the watcher process or by a person, and three of them (plus the deploy wrapper) are **withheld by basename from the script-allowlist guard's allow**.

   After Task 9, one of "the rest" is `docs-search-server.sh`. The agent runner starts it from `.mcp.json`, not the watcher and not a person. Task 24's own new table row says the same (*"the agent runner, from `.mcp.json`, when `docs.retrieval` is on"*). Task 24's Work changes only the two counts and then says *"Change no other sentence."* That keeps a claim this branch makes false, in the same paragraph, and contradicts the task's own row.

   The same claim is fixed at its two sibling sites: Task 20 in `docs/cli.md` §5 (row 57) and Task 9 in `cli/templates/claude/settings.autonomous.json` (row 58). Task 24's Verification cannot catch it, because it greps only for `docs-search-server.sh` and compares the left-allowed lists.

   **Fix:** In `task_24_plan.md`:
   - Add a Work change to that sentence, in the same register Task 20 uses: *"The rest are run by the watcher process, the agent runner or a person"*, with a short clause saying the agent runner starts `docs-search-server.sh` from `.mcp.json` when `docs.retrieval` is on. Keep *"three of them (plus the deploy wrapper) are withheld…"* unchanged.
   - Narrow *"Change no other sentence"* so it allows this edit.
   - Add a Verification bullet: `grep -n "run by the watcher process or by a person" docs/watcher.md` is empty.
   - Update the story index's row 51 reason cell so it names this sentence as well as the counts.

## Should Fix

- **Task 25 calls its entry-7 command "verbatim", but it is still the old, narrower one** (`task_25_plan.md`, first Verification bullet). Use the widened command from the story index. The expected `no-change` and restated set then includes the `docs/cli.md` §3 and §6 lines (rows 69 and 70).
- **These items were raised before and are still open:**
  - **Concurrent opens of the persisted PGlite directory** (`task_5_plan.md`, `task_8_plan.md`, `task_21_plan.md`). Either refuse a second open with a lock, or record the limitation in `docs/retrieval.md` → `## Still open`.
  - **The launcher can exit with no message** (`task_9_plan.md`). If `hr_cache_dir` fails under `set -euo pipefail`, the script exits non-zero with nothing on stderr.
  - **The mode of `machineCacheDir()` at creation is unstated** (`task_2_plan.md`, `task_12_plan.md`). `MACHINE_DIR_MODE` is not mentioned.
  - **`outerLoopScripts.ts`'s `agentInvocable` doc comment does not name the launcher** (`task_9_plan.md`).
  - **`invokedPath`'s export does not update its doc comment** (`task_10_plan.md`).
  - **`## Corpus staleness` is missing entries** (story index): the machine-state owners in `.claude/context/cli.md`, the gate list in `## The testing bar` (no Gate 10), the numbered-deferral rule, and the schema-order item.
  - **Verification commands still have counts baked in** (`task_15_plan.md` and `task_16_plan.md`: *"at least 3 per file"*; `task_17_plan.md`: *"exactly its four entries"*).
  - **Where Task 20's §7 remedy block goes** (`task_20_plan.md`).
  - **`cli/README.md`'s `doctor` description** does not mention the three retrieval checks (`task_14_plan.md`).

## Nice to Have

- `cli/templates/state-dir/README-root.md` lists what git ignores and what lives outside the state tree. `<stateDir>/docs_index/` and the machine cache fit both lists.
- Task 7 case (c): decide what `renderResults` prints for a lexical query with no hits, and assert exactly that.
