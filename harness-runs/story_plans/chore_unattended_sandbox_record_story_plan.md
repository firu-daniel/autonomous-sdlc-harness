# Story: The unattended sandbox's document of record

## Context

This branch (sandbox3c) writes the unattended sandbox's **document of record**, a new file `docs/sandbox-record.md`, built from the measured results already recorded in `docs/sandbox-verification.md`. It states what the sandbox contains and what it leaves out, every command that runs outside it and why, what an allowed domain still permits, the measured results per gate leg, the Linux runner's PID-namespace and no-new-privileges results, and the residuals. It also **moves** the numbered residual list out of `docs/cli.md` §6 (`**Residuals, stated rather than hidden:**`), so there is only one list, and repoints every citation of a residual by number. The branch changes documentation only. No measured result is invented, and no mismatch is fixed here: each one becomes a numbered roadmap row named in the document.

**Decisions every task builds on.** They are stated here once, and each per-task file restates the ones it consumes.

- **File name: `docs/sandbox-record.md`.** It is settled now so `chore_unattended_sandbox_doc` (sandbox10) can find it. Its opening states who owns what among three files. `docs/sandbox-verification.md` is the evidence record: one row per check, with observed quotes. `docs/sandbox-record.md` owns the model and the residuals: it carries verdicts with row ids and no observed quotes. `docs/sandbox.md` is the adopter-facing explainer sandbox10 writes later, which explains this file and links to it.
- **Headings, spelled exactly as below, created in this order by Task 3.** Later tasks fill them and never rename them.
  - `# The unattended sandbox: the document of record`
  - `## 1. What the sandbox contains, and what it does not`
  - `## 2. What runs outside the sandbox, and why`
  - `## 3. The domain list, and what an entry still permits`
  - `## 4. The measured results, per leg`
  - `## 5. The Linux runner's PID namespace and no-new-privileges`. This is the stable heading sandbox4 (`fix_run_job_credential_exposure`) cites for its in-job routes. It writes up the rows of `docs/sandbox-verification.md` → `## 9. The GitHub-hosted runner legs`, the heading sandbox3b2 named and which keeps its own name.
  - `## 6. The residuals`
  - `## 7. Follow-ups this record names`
- **How the residuals move.** Residuals **1–13** move as they stand on this `dev`, keeping their numbers and their sub-item numbers (residual 1's items 1–5, and residual 12's and 13's bullets). The prompt says "items 1–11" because it was written before residuals 12 and 13 were added. Its predicate, "every numbered residual", is the one applied. The residuals the prompt adds that the list does not already state are **appended as 14 onward**, so nothing is renumbered.
- **Citation forms.** Prose cites `docs/sandbox-record.md` → `## 6. The residuals`, residual N (or `residual 1, item 5`). Shell comments and runtime message strings, which have no room for that, use the short form `docs/sandbox-record.md residual N` (or `docs/sandbox-record.md residual 1, item 5`). `docs/cli.md` keeps the bold line `**Residuals, stated rather than hidden:**` as a one-paragraph pointer to `docs/sandbox-record.md` → `## 6. The residuals`, so an older citation of that anchor still lands somewhere.
- **The evidence record is not rewritten.** `docs/sandbox-verification.md` gains no row and no row's procedure, expectation or verdict changes. A citation pointer inside its prose or its expected or procedure cells is repointed and changes nothing else. A citation inside an **observed quote** (text a row quotes from a tool's output) is left byte-identical, because changing it would falsify the record.
- **The self-adopted `scripts/` copies of shipped templates are not edited by hand.** `scripts/launch-sandboxed-gates.sh` and `scripts/lib/harness-run-lib.sh` are `init`'s verbatim copies of `cli/templates/scripts/…`. They follow the template at the next self-adopt re-render, as #294 and #300 did. `scripts/lib/gate12-sandbox-round/` has no template, so it is this repository's own and is edited directly.
- **Every new mismatch becomes a roadmap row.** A measurement still owed cites the existing roadmap item 21. Any other mismatch, between code and docs or between the two records, is written in `## 7.` as a bullet carrying the literal token `roadmap item <pending>`. Task 7 adds a `docs/development.md` → `## 6. The roadmap this tree defers to` row for each bullet and replaces the token with the row's number. Each such bullet is a proposal, never pending work written into another document.
- **The code wins over the prompt.** The prompt names three wrappers that run outside the sandbox. The code marks four `runsUnsandboxed`: the three git wrappers, plus `launch-sandboxed-gates.sh` on a bubblewrap host (`cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS`). The record lists four.

The work is cut by layer, in ship order: the cli comments, then the plugin guard, then the general-layer documents. The document of record is one file with one owner per section. Task 3 creates it and writes §§ opening–3. Task 4 writes §§4–5. Task 5 moves the residuals into §6 and trims `docs/cli.md`. Task 7 resolves the `<pending>` tokens in §7. Each task `**Depends on:**` the one before it in the file.

**Top risks:**

- **A result the record states that is stronger than its row.** Every task that writes into the record checks each verdict against the row id it cites. Task 4 also refuses to fill a platform cell from another platform's row.
- **A citation left pointing at a residual list that no longer exists.** The `## Scope register` below enumerates every site with a command anyone can re-run, and each owning task's verification re-runs that command against its own files.
- **A moved residual that loses text, or a fenced command block cut during the move.** Task 5 moves the list with no rewording and verifies the move by diffing the removed text against the inserted text.

**Manual setup required:**

- After merge, re-render the self-adopted outer-loop scripts so `scripts/launch-sandboxed-gates.sh` and `scripts/lib/harness-run-lib.sh` pick up Task 1's comment changes to their templates. This is the supervised self-adopt `init --force`, as #294 and #300 did. An unattended run cannot do it because it writes `.claude/`. Until then those two copies cite `docs/cli.md` §6 by number in a comment.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom.

- **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none.
- **An implementer never changes a marker here**, and never edits any other line of this section, in an index a run is iterating.
- **`[ ]` markers anywhere else**, such as sub-step bullets inside per-task files, are informational progress markers. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_unattended_sandbox_record/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Repoint the cli layer's residual citations in shipped script comments and a test header _(layer: cli)_ _(points: 8)_
2. [x] **Task 2** — Repoint `git-trust-file-guard.sh`'s residual citation in its header and its deny reason _(layer: plugin)_ _(points: 8)_
3. [ ] **Task 3** — Create `docs/sandbox-record.md`: opening, §1 contents, §2 what runs outside, §3 the domain list _(layer: general)_ _(points: 20)_
4. [ ] **Task 4** — Write §4, the measured results per leg, and §5, the Linux runner's PID namespace and no-new-privileges _(layer: general)_ _(points: 20)_
5. [ ] **Task 5** — Move residuals 1–13 into §6, append the new residuals, and turn `docs/cli.md` §6's list into a pointer _(layer: general)_ _(points: 20)_
6. [ ] **Task 6** — Repoint residual citations in `docs/watcher.md`, `docs/remote-execution.md` and `docs/sandbox-placeholder-upstream-report.md` _(layer: general)_ _(points: 12)_
7. [ ] **Task 7** — Repoint residual citations in `docs/development.md`, `docs/sandbox-verification.md` and the Gate 12 graders, add the roadmap rows §7 names, and record the trio guard's re-measurement _(layer: general)_ _(points: 15)_
8. [ ] **Task 8** — Register the document in `README.md` → `## Where to read more` and in `llms.txt` _(layer: general)_ _(points: 5)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Update every citation of a residual by number, found with a search you record, such as `docs/cli.md §6, residual 2`, `residual 1, item 3` and `residual 11`. Renumber only if the move forces it, and then fix every citation."*

**Derivation entry A: numbered citations (command).** Re-run verbatim from the checkout root:

```
git grep -nIE "[Rr]esiduals? [0-9]" -- . ":(exclude)harness-runs"
```

It excludes `harness-runs/`, because past runs' artifacts record their own run and are not rewritten (`.claude/context/conventions.md` → `## Documents of record`). The standing artifacts under it are covered by entry D.

**Derivation entry B: anchor citations (command).** Re-run verbatim:

```
git grep -nIF "Residuals, stated rather than hidden" -- . ":(exclude)harness-runs"
```

**Derivation entry C: unnumbered citations of residual 12 (procedure).**

- **First step, runnable:** `git grep -nIE "cli\.md.{0,5}§ ?6" -- docs/watcher.md docs/sandbox-placeholder-upstream-report.md docs/development.md`.
- **Artifact:** the three files that residual 12's own opening sentence names as citing it ("[`watcher.md`](watcher.md), `docs/sandbox-placeholder-upstream-report.md` and `docs/development.md` Gate 15 cite it").
- **Traversal:** each hit of that command, in file order.
- **Decision rule:** a hit is reached when the text it cites is residual 12's content: the Linux interim position, the placeholders and their sweep, or the one-run clamp. A hit citing content that stays in `docs/cli.md` §6 is not reached. A hit that is already one of entry A's rows is not repeated.

**Derivation entry D: standing-artifact rows (procedure).**

- **First step, runnable:** `grep -nE "residuals? [0-9]" harness-runs/lessons.md harness-runs/improvement_suggestions.md harness-runs/README.md`.
- **Artifact:** those three standing files.
- **Traversal:** each line, in file order.
- **Decision rule:** a line is reached when it cites a `docs/cli.md` §6 residual by number.
- **Result:** at planning time it reaches none, so it contributes no row.

**Closure invariant:** every site any entry above reaches appears as a row below. Each owning task's verification re-runs entries A and B and asserts that every hit is a `no-change` row, or is in the moved list's own internal references, or names `docs/sandbox-record.md`.

**`Copy`:** `template` is a file under `cli/templates/scripts/`. `self-adopted` is its `init` copy under `scripts/`. `—` is a file with no mirrored counterpart.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/scripts/launch-sandboxed-gates.sh`, header *"the trust `docs/cli.md` §6 residual 5 states for the wrappers"* | template | A | `change` | Task 1 |
| 2 | `scripts/launch-sandboxed-gates.sh`, same comment | self-adopted | A | `no-change` | `init`'s verbatim copy of row 1. It follows at the post-merge self-adopt re-render (Manual setup required) |
| 3 | `cli/templates/scripts/lib/harness-run-lib.sh`, the comment above `hr_remote_status_write`, *"the gap `docs/cli.md` §6 residual 1, item 5, first bullet"* | template | A | `change` | Task 1 |
| 4 | `scripts/lib/harness-run-lib.sh`, same comment | self-adopted | A | `no-change` | `init`'s verbatim copy of row 3. It follows at the post-merge re-render |
| 5 | `cli/test/run-copy-clone-arm.test.mjs`, header *"`docs/cli.md` §6 residual 1, item 5 describes"* | — | A | `change` | Task 1 |
| 6 | `plugin/hooks/git-trust-file-guard.sh`, header *"must never carry one a session wrote (docs/cli.md §6 residual 12)"* | — | A | `change` | Task 2 |
| 7 | `plugin/hooks/git-trust-file-guard.sh`, the `deny` reason *"a run copy must never carry one written by a session (docs/cli.md §6 residual 12)"* | — | A | `change` | Task 2 |
| 8 | `docs/cli.md` §6, paragraph **Four scripts run outside the sandbox, each in one spelling.**, two *"(residual 13)"* | — | A | `change` | Task 5 |
| 9 | `docs/cli.md` §6, paragraph **The excluded rule's `:*` accepts any argument…**, *"(residual 7 below)"* | — | A | `change` | Task 5 |
| 10 | `docs/cli.md` §6, paragraph **Everything that runs outside the sandbox is write-protected on both sides**, *"what that leaves is residual 12"* | — | A | `change` | Task 5 |
| 11 | `docs/cli.md` §6, paragraph **Each run adds its own copy's paths by exact path, in a per-run profile.**, *"residual 2"* | — | A | `change` | Task 5 |
| 12 | `docs/cli.md` §6, the sibling-clone bullet under that paragraph, *"their effect on a sandboxed call is residual 12's"* | — | A | `change` | Task 5 |
| 13 | `docs/cli.md` §6, the paragraph opening *"It lives at `${XDG_STATE_HOME:-$HOME/.local/state}`"*, *"residual 12's sweep"* and *"which is residual 11"* | — | A | `change` | Task 5 |
| 14 | `docs/cli.md` §6, paragraph **Credentials are denied on both sides.**, *"(residual 13)"* | — | A | `change` | Task 5 |
| 15 | `docs/cli.md` §6, the list's internal references: residual 1 item 2 *"residual 6's exposure"*, residual 2 *"(derived from the code; residual 12)"*, residual 9 *"(residual 12)"*, residual 13 *"residual 12's class of leftover"* | — | A | `change` | Task 5. They move with the list and keep their numbers, which stay valid in the new file |
| 16 | `docs/cli.md` §6, the anchor line `**Residuals, stated rather than hidden:**` | — | B | `change` | Task 5. It becomes the pointer paragraph |
| 17 | `docs/development.md` §5, criteria paragraph, *"residual 0"* (several) | — | A | `no-change` | Not a citation of the §6 list. It is a criterion's count of zero |
| 18 | `docs/development.md`, the **SB2's `autonomous_logs/remote_status.json` variant.** bullet, *"(`docs/cli.md` §6, residual 1, item 5)"* | — | A | `change` | Task 7 |
| 19 | `docs/development.md`, `sandbox1c` §4 step 7 row JS4, *"the known residual (`docs/cli.md` §6, residual 1)"* | — | A | `change` | Task 7 |
| 20 | `docs/development.md`, observation (xvi) **FR4** bullet, *"is not a state-bundle source (`docs/cli.md` §6, residual 1, item 5)"* | — | A | `change` | Task 7 |
| 21 | `docs/development.md` Gate 15, **The absent-path check, by hand.**, *"`docs/cli.md` §6 residual 12 states"* | — | A, C | `change` | Task 7 |
| 22 | `docs/remote-execution.md`, bullet **The post-session steps on a job that passed.**, *"([`cli.md`](cli.md) §6, residual 12)"* and the `**Residuals, stated rather than hidden:**`, residual 1, item 5 anchor | — | A, B | `change` | Task 6 |
| 23 | `docs/remote-execution.md`, bullet **Residual: `Bootstrap the checkout`'s configured commands…**, anchor plus *"residual 1"* | — | A, B | `change` | Task 6 |
| 24 | `docs/sandbox-verification.md` §5 row AP9's observed cell, the quoted guard reason *"(docs/cli.md §6 residual 12)"* | — | A | `no-change` | An observed quote of the guard's output on the day it was measured. Changing it falsifies the evidence record |
| 25 | `docs/sandbox-verification.md` §6, **Claude Code's built-in protected paths in a run copy:**, *"is `docs/cli.md` §6 residual 12"* | — | A | `change` | Task 7. Pointer only |
| 26 | `docs/sandbox-verification.md` §10 row FR4's expected cell, *"is not a state-bundle source (`docs/cli.md` §6, residual 1, item 5)"* | — | A | `change` | Task 7. Pointer only |
| 27 | `docs/sandbox-verification.md` §10 row FR4's observed cell, *"Departure: the denied call's full input is not carried off the runner (`docs/cli.md` §6, residual 1, item 5)"* | — | A | `no-change` | An observed quote of the grader's printed departure line |
| 28 | `docs/sandbox-verification.md` §10 row JS4's expected cell, *"the known residual (`docs/cli.md` §6, residual 1)"* | — | A | `change` | Task 7. Pointer only |
| 29 | `docs/sandbox-verification.md` §10 row SB2's expected cell, *"(`docs/cli.md` §6, residual 1, item 5)"* | — | A | `change` | Task 7. Pointer only |
| 30 | `docs/watcher.md`, the `launch-sandboxed-gates.sh` table row, *"(`docs/cli.md` §6, residual 13)"* | — | A | `change` | Task 6 |
| 31 | `docs/watcher.md`, the paragraph opening *"What this leaves open — the bootstrap'"*, the anchor `"Residuals, stated rather than hidden"` | — | B | `change` | Task 6 |
| 32 | `docs/watcher.md` `### The per-run profile`, **What it adds.**, *"`docs/cli.md` §6, residual 12"* | — | A | `change` | Task 6 |
| 33 | `docs/watcher.md`, the protected-surface bullet, *"`docs/cli.md` §6, residual 2"* and *"`docs/cli.md` §6, residual 12"* | — | A | `change` | Task 6 |
| 34 | `docs/watcher.md`, the clone `.git` bullet, *"`omit` column; `docs/cli.md` §6, residual 12"* | — | A | `change` | Task 6 |
| 35 | `docs/watcher.md`, the sibling-trio bullet, *"AP1–AP7 and the `dd` row owed: `docs/cli.md` §6, residual 12"* | — | A | `change` | Task 6 |
| 36 | `docs/watcher.md`, the paragraph opening *"Claude Code silently ignores a `--settin"*, the anchor `"Residuals, stated rather than hidden"` | — | B | `change` | Task 6 |
| 37 | `docs/watcher.md`, **On a bubblewrap host (Linux, WSL2),** paragraph, *"why is `docs/cli.md` §6, residual 12"* and *"at the points `docs/cli.md` §6 residual 12's **Job mode** item names"* | — | A | `change` | Task 6 |
| 38 | `docs/watcher.md` §4, the clamp paragraph, *"why is `docs/cli.md` §6, residual 12"* | — | A | `change` | Task 6 |
| 39 | `docs/watcher.md` §4, the same paragraph's quoted log line *"`bubblewrap host: at most one live run per repository (… docs/cli.md §6)`"* | — | C | `no-change` | A quote of `autonomous-watcher.sh`'s literal log text. Changing the literal changes runtime output, which is out of scope for documentation only. It resolves through `docs/cli.md` §6's pointer, and Task 5 names it in §7 |
| 40 | `docs/watcher.md`, the `cap: 1 (MAX_PARALLEL_RUNS=<n> clamped on a bubblewrap host; docs/cli.md §6)` quote | — | C | `no-change` | Same reason as row 39 |
| 41 | `docs/sandbox-placeholder-upstream-report.md`, **Who reads this:**, *"The interim position it would lift is `docs/cli.md` §6"* | — | C | `change` | Task 6 |
| 42 | `docs/sandbox-placeholder-upstream-report.md` `## The harness's interim position`, *"`docs/cli.md` §6 states the whole position"* | — | C | `change` | Task 6 |
| 43 | `scripts/lib/gate12-sandbox-round/grade-full-run.sh`, `G12_FR4_DEPARTURE` | — | A | `change` | Task 7. It has no template, so it is this repository's own |
| 44 | `scripts/lib/gate12-sandbox-round/grade-plant.sh`, comment *"docs/cli.md §6, residual 1: Bootstrap the checkout's install and build"* | — | A | `change` | Task 7 |
