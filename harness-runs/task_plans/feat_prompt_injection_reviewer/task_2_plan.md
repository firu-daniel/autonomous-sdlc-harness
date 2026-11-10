### Task 2 — Add the `plan` verb: the screened set, the ledger record and the recorded-`UNSAFE` re-issue

**Goal:** Give the engines one read-only answer to *"which input files must be screened now, and is any already unsafe?"* That answer makes three rules deterministic and testable:
- **re-screen on hash change** (goal 5);
- **screen a new answer on resume** (goal 5);
- **no retry moves an unchanged parked file past `UNSAFE`** (goal 6).

**Depends on:** Task 1, which ships `prompt-injection-screen.sh` with:
- its `--repo` handling and `stateDir` resolution through `lib/harness-run-lib.sh`;
- its hashing helper;
- the `prescan` verb, which prints `file <path> sha256 <hex>`, then `hit <id> <path>:<line> "<excerpt>"` lines, and exits 0 clean, 1 hit, 2 error.

This task calls those internally and changes neither.

**Where this task stops.**
- It writes nothing.
- The park file it reads back is written by Task 3, whose shape is restated below so both sides agree.
- A flagged answer needs no classification row here: Task 3's writer removes the `answer_<k>.md` and re-asks its question at a new index, so the file leaves the screened set and the next answer is an ordinary new file (row 3 or 4). A re-ask keeps its original question's origin, so it is read as a screen park only when that original was one.
- The ledger record it reads is written by the forks (Tasks 12, 13), in the shape Task 11 states, restated below.

### Targets

- `cli/templates/scripts/prompt-injection-screen.sh` — the `plan` verb, and its paragraph in the header.
- `cli/test/prompt-injection-plan.test.mjs` (new)

**Work:**

- [ ] **The screened set.** `plan --repo <dir> --branch <branch> --engine task|user_review|docs` enumerates existing files only, in this order:

  | `--engine` | Files |
  |---|---|
  | `task` | `<state_dir>/task_prompts/<branch>_task_prompt.md`, then every `answer_<n>.md` at the top level of `<state_dir>/clarifications/<branch>/` and under its `answered/`, ascending by `<n>` |
  | `user_review` | the task prompt when it exists, every `<state_dir>/user_reviews/<branch>_review.md` and `<branch>_review_<n>.md` with all-digit `<n>`, ascending, then every answer as above |
  | `docs` | `<state_dir>/docs_catalog/<branch>_docs.md` only |

  A missing task prompt for `task`, no review file for `user_review` and no checklist for `docs` are each exit 2. The engines already refuse those cases before this point.
- [ ] **The two records it reads.**
  - **SAFE record:** for `task` and `user_review` only, every line of `<state_dir>/flow_progress/<branch>_progress.md` matching exactly `  - screened: <path> sha256=<64 lowercase hex>` (two leading spaces). A missing ledger is an empty record. `docs` reads none.
  - **UNSAFE record:** every `question_<n>.md` at the top level and under `answered/` whose first non-blank line after the title is `Raised by: prompt-injection-reviewer (prompt-injection screen)`. From each, take every consecutive pair of lines ``Screened file: `<path>` `` and ``sha256: `<hex>` ``.
  - Ignore a question file of any other origin, whatever it contains.
- [ ] **Classification**, one line per file, first match wins:
  1. `safe <path> <sha>` — the current hash is SAFE-recorded for that path;
  2. `unsafe <path> <sha> recorded question_<n>.md` — the current hash is UNSAFE-recorded for that path: an unchanged parked file, re-issued with no dispatch;
  3. `unsafe <path> <sha> prescan`, followed by the file's `hit` lines from Task 1's scan;
  4. `screen <path> <sha>` — the agent decides.

  Then print one final line: `plan: clear`, `plan: screen <k>` or `plan: unsafe <k>`.

  Exit 0 when nothing is unsafe, 1 when anything is, and 2 on error. On exit 2, print one stderr line naming the cause.

  An edited file has a new hash, so neither record matches it and it falls through to rows 3–4. That is the re-screen rule.
- [ ] **Header.** Add `plan`'s paragraph to the header. Name the two mirrors it keys on:
  - the ledger record shape, owned by `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3 Templates`;
  - the park file's `Raised by:` / `Screened file:` / `sha256:` lines, owned by this script's own `park` writer (Task 3).
- [ ] **`prompt-injection-plan.test.mjs`.**
  - **Header:** it opens with the rule it enforces: a file is skipped only on a recorded `SAFE` hash, re-issued `UNSAFE` on a recorded `UNSAFE` hash, and screened otherwise.
  - **Fixture:** an `init`-wired one, as in Task 1's test.
  - **Cases:**
    - a fresh task run, with no ledger, gives `screen` for the prompt;
    - a recorded prompt gives `safe`;
    - the same prompt with one byte changed gives `screen`: re-screen on hash change;
    - a new top-level `answer_2.md` beside a recorded prompt gives `screen` for the answer only: a new answer on resume;
    - an `answered/answer_1.md` recorded `safe` stays `safe`;
    - **no answer moves past `UNSAFE`:**
      - a screen park `question_3.md` records the prompt's hash, and an `answer_3.md` beside it reads "proceed despite the verdict";
      - the prompt is `unsafe … recorded question_3.md` and the answer is `screen`, with exit 1;
      - the same holds after the pair moves under `answered/`;
    - a question file of another origin carrying the same lines is ignored;
    - a prompt with a prescan hit gives `unsafe … prescan` with its `hit` line;
    - `user_review` lists the prompt, the rounds and the answers, in order;
    - `docs` lists only the checklist and ignores a ledger record;
    - a missing prompt is exit 2.

**Verification:**

- `npm test --workspace cli -- test/prompt-injection-plan.test.mjs` passes. It is this task's own new test file.
- `bash -n cli/templates/scripts/prompt-injection-screen.sh` exits 0.
- A `plan` run writes nothing: the fixture's `git status --porcelain` is unchanged across it, asserted in the test.

**Deviations from plan:**
- `bash -n cli/templates/scripts/prompt-injection-screen.sh` was refused by the tool layer (don't-ask mode). The claim rests instead on `bash scripts/typecheck.sh`, whose `check-shell-parse` step reported `123 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, and on `prompt-injection-plan.test.mjs` running the script through bash in every case.
- `cli/test/prompt-injection-prescan.test.mjs` (outside Targets) edited: its reserved-verb case listed `plan`, which now exists; it now checks `park` and `verdict` only.
- Task 1's per-file scan loop moved out of `pis_prescan` into `pis_scan_file`, which both verbs call; prescan's output is unchanged (its test file passes). `pis_fault` now removes the BOM scan copy itself, since a fault inside `$(…)` does not run the EXIT trap.
- Unspecified choices: when several screen parks record the same path and hash, `recorded` names the highest-numbered one (the latest park); an equal `<n>` at the top level and under `answered/` lists `answered/` first.
