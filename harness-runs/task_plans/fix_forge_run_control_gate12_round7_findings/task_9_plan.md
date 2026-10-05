### Task 9 — `docs/github-run-control.md`: `status`, the stopped-job rule, the repair route, and §8's round 7 table

**Goal:** Make the design of record for working a run from GitHub match this branch. Four sections change:
- **`## 1.`** states the new `status` reply.
- **`## 5.`** states that nothing from a stopped job changes a label or posts a lifecycle comment.
- **The entry point section** states a 0.6.1 adopter's route to a parseable `harness-control.yml`.
- **`## 8.`** moves the four rows round 7 verified into a *Verified in Gate 12 round 7* table.

**Depends on:**
- **Task 3**, the repair route. Any `init` at a fixed version, plain or `--upgrade-workflows`, does the following:
  - it replaces a `.github/workflows/harness-control.yml` byte-identical to 0.6.1's copy after a `.bak`, and prints the `git add`, commit, `gh auth refresh -s workflow` and push commands for it;
  - it keeps an edited copy, and warns that the control job's `if:` must be written as a folded block scalar (`if: >-`, the expression on the next line), or the file replaced with `init --force`, which regenerates every generated file after a `.bak`;
  - either way, the file must then be committed and pushed to the default branch.
- **Task 4**: `doctor --check-github` fails on a harness workflow GitHub lists by its path, which is how GitHub lists a file it cannot parse, and prints the same route.
- **Task 5**: `report` withholds `parked`, `park_loop`, `paused`, `resumed`, a started round and `failed` when the branch's newest `harness stop` run is newer than its newest `harness run` run, asked afresh. It still reports if that listing fails, and never withholds `stopped`.
- **Task 6**: with the ledger fully ticked, `status` replies with one of these, byte for byte:
  - ``A user-review round has started on `<branch>`, and its flow-progress ledger is not written yet.`` — when the tip carries a newer `chore: add user review for <branch>` commit;
  - `The run is still running, and its flow-progress ledger has no open entry: it is finishing its last step, or a new stage has not written its ledger yet.` — when the run is `running` with no such commit;
  - otherwise `Every entry of the flow-progress ledger is ticked.`
- **Task 8**, which inserts the Round 7 record into `docs/development.md` → Gate 12. The §8 rows below cite it as *Gate 12 → Round 7, leg (h)*.

### Targets

- `docs/github-run-control.md`, in these places:
  - `## The GitHub entry point`, the bullet "Upgrading, with `init --upgrade-workflows` or `init --force`";
  - `## 1. Commands in a comment`, the `status` table row and **Why `status` exists.**;
  - `## 5. Lifecycle comments and state labels`, the paragraph after the table;
  - `## 8. What is not verified here`: its opening sentence, four table rows, and a new `### Verified in Gate 12 round 7`.

**Work:**

- [ ] **The entry point's upgrading bullet.** Add the 0.6.1 route, in adopter words, under the existing bullet or as a short paragraph beside it:
  - `harness-control.yml` as 0.6.1 wrote it is not valid YAML, so GitHub runs it for no event;
  - any `init` at a later version replaces an unedited copy after a `.bak` and prints the commands to commit and push it;
  - an edited copy is kept, with a warning, and needs its job `if:` written as `if: >-` or `init --force`;
  - `doctor --check-github` fails on a copy GitHub could not parse.

  Put the two route commands each in their own fenced block, one per line, with `<version>` for the fixed version. The lessons ledger → `## Adopter-facing documentation` requires it:

  ```
  npx autonomous-sdlc-harness@<version> init
  ```

  ```
  npx autonomous-sdlc-harness@<version> doctor --check-github
  ```

  Cite `docs/development.md` → Gate 12 → Round 7, finding 1.
- [ ] **`## 1.`, `status`.** Extend the `status` row's "Replies with" cell, or the paragraph below the table. When the ledger on the branch tip reads fully ticked, the reply says one of three things:
  - that a user-review round has started and its ledger is not written yet, if the tip carries the round's commit after the ledger's last change;
  - that a `running` run is finishing or starting a stage;
  - otherwise, that every entry is ticked.

  Quote Task 6's texts above. Add one sentence to **Why `status` exists.** explaining why: the round's job writes its fresh ledger only after it starts, so a reply in that gap read the previous engine's completed ledger (Gate 12 round 7, finding 2).
- [ ] **`## 5.`, the stopped-job rule.** Replace "A `failed` caused by stopping the run posts nothing, so it never overwrites `stopped`." with the general rule. Nothing from a stopped job changes a label or posts a lifecycle comment: `parked`, `park_loop`, `paused`, `resumed`, a started round and `failed` each post nothing once the run's stop is newer than its latest dispatch, so a job a stop overtook never overwrites `stopped`. Then add:
  - a `resumed` that a stop overtook is silent, like `failed`;
  - only when GitHub's run list cannot be read is the event reported anyway.

  Cite round 7's leg (h). Keep the paragraph's other sentences.
- [ ] **`## 8.`, the move.**
  - Delete these four rows from the main table, found by their first cell:
    - "A `delete` event's workflow runs from the default branch";
    - "The contents API serves a file at a commit no branch points at any more";
    - "A workflow can be dispatched from the default branch while its `branch` input names a deleted branch";
    - "A `pull_request` `closed` job runs the merge-commit copy of the workflow".
  - Add `### Verified in Gate 12 round 7` with a `| Behaviour | Observed |` table carrying those four behaviours, in that order, each with its *Observed* text copied **verbatim** from the task prompt's table (`### Item 4 — Record Gate 12 round 7`, step 2). Place it after `### Verified in Gate 12 round 6`, so the round 6 table comes first and the round 7 table follows it.
  - Update the opening sentence so that it names both rounds: round 6 (2026-10-02, CLI 0.6.0) observed the rows in *Verified in Gate 12 round 6*, round 7 (2026-10-05, CLI 0.6.1) those in *Verified in Gate 12 round 7*, and none of the others has been.

**Verification:**

- Run the four-row derivation from the story index's scope register, entry D8. It reaches each row only under `### Verified in Gate 12 round 7`, never in the main table:

  ```
  git grep -nE "^\| (A .delete. event's workflow runs from the default branch|The contents API serves a file at a commit no branch points at any more|A workflow can be dispatched from the default branch while its .branch. input names a deleted branch|A .pull_request. .closed. job runs the merge-commit copy of the workflow) \|" -- docs
  ```
- Run `git grep -nE "caused by stopping" -- docs/github-run-control.md`. It finds nothing.
- Every `[§n](#…)` anchor in the edited paragraphs still resolves to a heading of this file. The rows' links to `development.md` name *Gate 12 → Round 7*, which Task 8 inserted.
- Read every command added in this file. Each sits alone in a fenced block.
