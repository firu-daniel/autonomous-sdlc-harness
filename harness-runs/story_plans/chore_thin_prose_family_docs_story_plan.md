# Story: Thin the docs family's agent prose

## Context

This branch is the **docs family session** of the agent-thinning series (`docs/work-report-research/README.md` → `## Follow-ups`, item 3, `**Docs:**`). It thins `plugin/agents/docs-writer.md` and `plugin/agents/docs-reviewer.md` in one session, because the reviewer grades every document against the writer's definition. Work reports are dropped (`## User verdict` in the same README), so this is thinning only: no template, no `## Work report` section, no `write_<i>.md`, no `iteration` field for the writer and no `F1…Fn` finding ids. The research reports `docs/work-report-research/docs-writer.md` and `docs/work-report-research/docs-reviewer.md` are input through their `## Prose classification` and `## Thinning plan` sections only, read as guidance on what is redundant. Their line numbers and word counts describe an older tree. The base commit for every comparison is `25e2382a`, the current `dev` (this repository's default branch); the branch's two commits above it touch only `harness-runs/`.

**The standard every task applies** is `.claude/context/plugin.md` → `## Writing agent prose`:
- a rule is a direct instruction, and each rule is stated once;
- rationale the agent does not act on is dropped, and every edge case is kept;
- a wire literal or a cited anchor is never paraphrased;
- a change to an agent definition never raises its up-front word count.

**Behaviour does not change**: every rule the writer, the reviewer or a caller acts on today still holds after the edit, stated more briefly. One read changes on purpose. `docs-reviewer` reads the whole of `docs-writer.md` before it grades today, but it grades only against six of its sections: `## Entry-point hints are STARTING POINTS, not boundaries`, `## Research methodology (apply every time)`, `## Mode 1 — catalog`, `### Write / update (`mode: update`)` and the two `## Template —` sections. Task 4 names those six as the only part of the file it reads, the same narrowing the UI-tests family session made for `qa-tester.md`. Every rule a reviewer check grades lives inside those sections, and Tasks 1–3 keep each one (the probe's literal list pins them). Every per-task file gives the exact old and new text of each change, checked against `25e2382a`. An implementer applies that text and changes nothing else.

**Research proposals this branch declines:**
- **Thinning `## Resolved values`** in either file. The preamble and nearly every row are shared word for word with up to twenty other agents, and the family-only parts are clauses inside frozen sentences, so the whole section stays as it is.
- **Adding rules.** The value-vs-coordinate test the writer research proposed adding to the writer, the reviewer's `F1…Fn` finding numbering and the writer's "ignore any `## Work report`" line are additions that served the dropped work report. None lands.
- **Reconciling "apply its Must Fix items" with the reviewer's findings format.** The writer's fix round names Must Fix items, and the reviewer's findings carry no severity headings. That wording is behaviour the docs flows run on today; Task 1 keeps it word for word and no task changes the reviewer's findings format.
- **Dropping the writer's intro mode list, `**Arguments:**` line or `## Mode 2` heading.** Every bold lead and every heading line is frozen; only the Mode 2 intro paragraph under its heading goes.
- **Editing any file under `plugin/instructions/` or `plugin/samples/`**, including the docs flows' dispatch sites. Every dispatch block, argument name and return field is kept, so no caller changes.

**Frozen text** is defined at `25e2382a` and stays word for word in its file:

1. **Ten-word windows.** Every run of words covered by a 10-word window — ten consecutive whitespace-separated words inside one blank-line-delimited paragraph — that also occurs in an agent definition **outside** this family, plus the words between two such runs in one sentence. A sentence that holds frozen text may lose only its unfrozen words.
2. **Every bold lead** (`**…**` opening a line or a list item, after optional indentation) in the two files. No task removes or rewords one.
3. **Every heading line.** `docs-reviewer` cites six writer headings by text after Task 4.
4. **Every fenced block**: the dispatch prompts and both document templates.
5. **Each frontmatter block**, including the `tools:` lines `plugin/agents/README.txt` and `docs/retrieval.md` reason from.

The large frozen blocks are:
- each file's `## Resolved values` preamble and table;
- each file's `**A cited path you cannot read is a finding, not a fallback.**` paragraph;
- the `**The argument names and the return field names below are the wire …**` sentence of each `## Invocation contract`;
- `docs-reviewer`'s `**You do not edit the document.**` paragraph, its disabled-phase paragraph and its whole `## Unsolicited dispatch guidance` section;
- fragments of the writer's research step 5 (the line-number shape list and the repo-relative path rule) and of each file's stored-data vocabulary sentence, shared with `conventions-writer` and `ui-tests-plan-reviewer`.

Each per-task file lists the frozen text inside its own range.

**The family check probe.** Task 1 writes `harness-runs/scratch/docs_family_check.mjs`. It is a read-only probe, gitignored and never committed. It checks the following against `25e2382a`:
- frozen text, bold leads, heading lines, fenced blocks and frontmatter;
- each file's wire literals, cited anchors and graded rules;
- that the six docs-writer sections the reviewer reads exist, and that the reviewer cites each one;
- that no file under `plugin/instructions/` or `plugin/samples/`, and no other agent definition, changed;
- that each file's word count fell, and that `docs-reviewer`'s up-front count fell.

Tasks 1–5 run it on the file they edit. Task 6 writes the probe again from the same text and runs it with no arguments, over both files, as the branch's authority.

**Anchors and behaviours other files rely on, which every task keeps:**
- **Each fenced dispatch prompt, byte for byte**, and the dispatch-site citations beside them: `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Per-entry loop` (catalog writer, and reviewer step 2) and `plugin/instructions/docs_phase_instructions.md` → `## Loop` steps 1, 2 and 3.
- **Each return contract, field for field**: the writer's `doc_path:` · `unverified:` · `parity_gaps:` · `notes:`, its survey `targets:` line shape and `targets: none`; the reviewer's `verdict:`, `findings_file:`, `missed_docs:` and `summary:`; and in both, the disabled-phase return that omits `doc_path:` / `targets:` or `findings_file:`.
- **The writer's markers**, `reachable? ✅ / ❌` and `⚠️ unverified`. The docs-catalog INDEX and `parity_gaps:` are built from them, and the outer-loop watcher's docs prompt (`cli/templates/scripts/autonomous-watcher.sh`, adopted at `scripts/autonomous-watcher.sh`) tells the run that an unverifiable claim is marked unverified.
- **The reviewer's check numbers 1–13**, which the file cites as "check 2" and "check 7", and both line-number detectors, including the `[Ll]ines?` regular expression that `scripts/check-typos.sh` exempts this file for.
- **The four properties `docs/analyze.md` and `plugin/agents/conventions-writer.md` state about the pair**: the writer is gated on `phases.docs` and returns a clean no-op when it is off; every `output_path` sits under `docs.root`; its templates are `feature` and `concept`; and the reviewer grades backend payloads, stored shapes and reachability.
- **`## Unsolicited dispatch guidance`** in the reviewer, which `plugin/instructions/dispatch_discipline_instructions.md` lists on its roster.

**Measurement.** Up-front words are the agent definition plus every plugin file or section it reads on every dispatch, counted as the probe counts them (runs of non-whitespace characters, the probe's `WORDS` and `UPFRONT` lines). `CLAUDE.md`, the adopter's conventions documents and conditional inputs (the document under review, the diff, a findings file) are excluded.
- **`docs-writer`** reads no plugin file up front, so its up-front count is its definition.
- **`docs-reviewer`** reads the whole of `docs-writer.md` before the branch and the six named sections of it after Task 4. The probe's `UPFRONT` line sums the reviewer's definition and those sections as the tree stands.
- **Recording.** Task 6 fills `## Up-front word counts`, and every task checks that its own file's count falls.

The verification bar for the branch as a whole belongs to the Run gates phase, not to any unit, and no task runs it. That bar is `cli/test` and `scripts/run-gates.sh` passing, including the plugin manifest under `--strict`.

**Top risks:**
- **A dropped rule the reviewer grades.** The reviewer grades against the writer's text, so a writer rule cut in Tasks 1–3 silently weakens a review. Every per-task file carries a rule inventory to run before saving, the probe's writer literal list pins each graded rule (the anchor forms, the line-number ban, both markers, the merge and update disciplines), and Task 4 checks each of the reviewer's checks against the writer as Tasks 1–3 left it.
- **The narrowed read misses a section.** Task 4 names six headings that are frozen, and the probe's `SECTION-MISSING` and `ADDED` checks fail if any heading moved or any citation is missing.
- **A thinned sentence forks text other agents share word for word, or a wire literal is paraphrased.** Every per-task file lists the frozen text in its range and applies only replacement texts already checked against `25e2382a`. Task 6 runs the probe over both files.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker** to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_thin_prose_family_docs/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Thin `docs-writer`'s intro, disabled-phase gate, fix round, `## Project layout` and entry-point hints, and write the family check probe _(layer: plugin)_ _(points: 15)_
2. [x] **Task 2** — Thin `docs-writer`'s `## Research methodology (apply every time)` _(layer: plugin)_ _(points: 10)_
3. [ ] **Task 3** — Thin `docs-writer`'s `## Mode 2`, template lead and `## Output contract` _(layer: plugin)_ _(points: 10)_
4. [ ] **Task 4** — Thin `docs-reviewer`'s intro, `## Invocation contract` and `## Project layout`, and narrow its read of `docs-writer.md` to six sections _(layer: plugin)_ _(points: 10)_
5. [ ] **Task 5** — Thin `docs-reviewer`'s `## What to verify` and `## Output contract` _(layer: plugin)_ _(points: 10)_
6. [ ] **Task 6** — Measure both definitions, run the family check probe and record the result in the story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/work-report-research/README.md` > `**3. Family sessions.**` > `**Docs:**`"*. That README resolves it to two passages:
- *"Run one per family … A reviewer that grades against its writer's definition is thinned in the same session as that writer. … Each session measures word counts again from the current `main`, and uses its agents' *Prose classification* and *Thinning plan* sections here as input."*
- *"**Docs:** docs-writer and docs-reviewer."*

**Derivation entries.** Each command is read-only and is re-run verbatim from the repository root. C2, C3 and C3b read the base commit `25e2382a`, so they reach the same sites after the branch's edits as before them. C1's file names do not change.

- **C1 — the family's definitions (command):** `grep -l -E '^name: docs-(writer|reviewer)$' plugin/agents/*.md` — one site per printed file.
- **C2 — plugin files the family cites (command):** `git grep -o -h -E '\$\{CLAUDE_PLUGIN_ROOT\}/[A-Za-z0-9_<>./-]+' 25e2382a -- plugin/agents/docs-writer.md plugin/agents/docs-reviewer.md` — one site per distinct path printed.
- **C3 — durable files that name the family by agent name or role name (command):** `git grep -l -E 'docs-(writer|reviewer)|[Dd]ocs[- ](writer|reviewer)|(^|[^-A-Za-z])([Tt]he|[Aa]) (doc|docs|documentation) (writer|reviewer)' 25e2382a -- . ':!harness-runs' ':!docs/work-report-research'` — one site per printed file, read with its `25e2382a:` prefix removed. It excludes two trees:
  - `harness-runs/` holds the run artifacts of this repository's adopted harness, which no task edits. C3b reaches its standing READMEs.
  - `docs/work-report-research/` is the research record of an older tree, which this branch reads only as input.
- **C3b — standing state-directory READMEs that name the family (command):** `git grep -l -E 'docs-(writer|reviewer)|[Dd]ocs[- ](writer|reviewer)|(^|[^-A-Za-z])([Tt]he|[Aa]) (doc|docs|documentation) (writer|reviewer)' 25e2382a -- 'harness-runs/*README.md'` — one site per printed file, each the adopted copy of a `cli/templates/state-dir/` template, with `Copy` = `adopted copy`. It prints nothing at `25e2382a`, so it owes no row today.
- **P4 — agent definitions that carry the family's frozen text (procedure).**
  - **Artifact:** the two family definitions and every other `plugin/agents/*.md`, all at `25e2382a`.
  - **Traversal:** each family definition top to bottom, paragraph by paragraph (blank-line delimited), as runs of whitespace-separated words, sliding a window of ten consecutive words inside each paragraph; then each line opening with a bold lead (`**…**` after optional indentation and an optional list marker).
  - **Decision rule:** an agent definition outside the family is a site when one of its own paragraphs contains one of those ten-word windows, or when it contains one of those bold leads verbatim. Its disposition is `no-change`: its copy is the reference the family's copy must keep matching.

No standing tracked matrix under `harness-runs/` covers `plugin/agents/`, so no row-class entry is owed.

**Closure invariant:** every file C1, C3 and C3b print, every distinct path C2 prints and every agent definition P4's decision rule reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/docs-writer.md` | — | C1, C2, C3 | `change` | Task 1 (intro, disabled-phase gate, `**Fix round.**`, `## Project layout`, `## Entry-point hints are STARTING POINTS, not boundaries`); Task 2 (`## Research methodology (apply every time)`); Task 3 (`## Mode 2 — post-implementation (diff-driven)`, the `## Template — `doc_type: feature`` lead paragraph, `## Output contract`). Frontmatter, `## Resolved values`, every heading and every fenced block are frozen |
| 2 | `plugin/agents/docs-reviewer.md` | — | C1, C2, C3 | `change` | Task 4 (intro, `## Invocation contract`, `## Project layout`); Task 5 (`## What to verify (accuracy first, then depth, then completeness)`, `## Output contract`). Frontmatter, `## Resolved values`, the disabled-phase paragraph and `## Unsolicited dispatch guidance` are frozen |
| 3 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | C2, C3 | `no-change` | the catalog caller of both agents; every dispatch block, argument name and return field it sends or parses is kept (Tasks 1, 3, 4, 5), and both definitions keep their `## Per-entry loop` citation |
| 4 | `plugin/instructions/docs_phase_instructions.md` | — | C2, C3 | `no-change` | the survey, update and INDEX caller; the `## Loop` step 1, 2 and 3 citations, the `targets:` shape and the reviewer's `missed_docs:` are kept (Tasks 1, 3, 4, 5) |
| 5 | `.claude/context/plugin.md` | — | C3 | `no-change` | a conventions document, never a target. It cites `docs-reviewer.md` for the `description:` rule (frontmatter frozen) and the no-line-number rule (check 2 kept by Task 5), and `docs-writer.md` for the `## Resolved values` table form (frozen); every citation still holds |
| 6 | `cli/templates/scripts/autonomous-watcher.sh` | template | C3 | `no-change` | its docs-engine prompt says a `docs-writer` that cannot verify a claim marks it unverified and continues; Task 2 keeps the `⚠️ unverified` rule |
| 7 | `scripts/autonomous-watcher.sh` | adopted copy | C3 | `no-change` | as row 6 |
| 8 | `docs/analyze.md` | — | C3 | `no-change` | states four properties of the pair (phase gate and no-op, `output_path` under `docs.root`, the `feature` / `concept` templates, the reviewer grading payloads, stored shapes and reachability); Task 1 keeps the gate and no-op, `## Resolved values` and both templates are frozen, and Task 5 keeps checks 3 and 4 |
| 9 | `docs/development.md` | — | C3 | `no-change` | records the `ines` typo-check exemption for the reviewer's `[Ll]ines?` regular expression, which Task 5 keeps byte for byte |
| 10 | `docs/outer-loop-verification.md` | — | C3 | `no-change` | quotes the watcher's docs prompt (rows 6 and 7); no anchor into either definition |
| 11 | `docs/retrieval.md` | — | C3 | `no-change` | states that neither agent carries the docs-retrieval tool; both `tools:` lines are frozen |
| 12 | `plugin/agents/README.txt` | — | C3 | `no-change` | lists the pair among the directory's agents and excludes both from the docs-retrieval roster; frontmatter frozen |
| 13 | `plugin/agents/conventions-writer.md` | — | C3, P4 | `no-change` | says the docs writer returns a no-op unless `phases.docs` is `true` and writes only under `docs.root`; Task 1 keeps the gate and `## Resolved values` is frozen. It also carries frozen copies |
| 14 | `plugin/commands/branch-start-docs-autonomous.md` | — | C3 | `no-change` | names the pair as the catalog engine's only agents; no anchor into either definition |
| 15 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | C3 | `no-change` | lists both definitions by path; the paths do not change |
| 16 | `plugin/instructions/dispatch_discipline_instructions.md` | — | C3 | `no-change` | its receiving-side roster lists `docs-reviewer` as carrying `## Unsolicited dispatch guidance`, which stays byte for byte |
| 17 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | C3 | `no-change` | Override H runs the docs phase and names its dispatches; no anchor into either definition |
| 18 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | C3 | `no-change` | as row 17 |
| 19 | `scripts/check-typos.sh` | — | C3 | `no-change` | exempts `plugin/agents/docs-reviewer.md` for `ines`, the `[Ll]ines?` regular expression in check 2, which Task 5 does not touch |
| 20 | `plugin/agents/architecture-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 21 | `plugin/agents/branch-reviewer.md` | — | P4 | `no-change` | as row 20 |
| 22 | `plugin/agents/business-parity-reviewer.md` | — | P4 | `no-change` | as row 20 |
| 23 | `plugin/agents/committer.md` | — | P4 | `no-change` | as row 20 |
| 24 | `plugin/agents/conventions-reviewer.md` | — | P4 | `no-change` | as row 20; it shares the reviewer's read-the-writer sentence fragments, which Task 4 keeps |
| 25 | `plugin/agents/layer-implementer.md` | — | P4 | `no-change` | as row 20 |
| 26 | `plugin/agents/layer-reviewer.md` | — | P4 | `no-change` | as row 20 |
| 27 | `plugin/agents/qa-tester.md` | — | P4 | `no-change` | as row 20 |
| 28 | `plugin/agents/qa-tester-mobile-maestro.md` | — | P4 | `no-change` | as row 20 |
| 29 | `plugin/agents/qa-tester-mobile-mcp.md` | — | P4 | `no-change` | as row 20 |
| 30 | `plugin/agents/review-plan-reviewer.md` | — | P4 | `no-change` | as row 20 |
| 31 | `plugin/agents/skeptic-reviewer.md` | — | P4 | `no-change` | as row 20 |
| 32 | `plugin/agents/statistics-plan-writer.md` | — | P4 | `no-change` | as row 20 |
| 33 | `plugin/agents/task-plan-reviewer.md` | — | P4 | `no-change` | as row 20 |
| 34 | `plugin/agents/task-plan-writer.md` | — | P4 | `no-change` | as row 20 |
| 35 | `plugin/agents/test-fix-plan-writer.md` | — | P4 | `no-change` | as row 20 |
| 36 | `plugin/agents/ui-tests-plan-reviewer.md` | — | P4 | `no-change` | as row 20; it shares the stored-data vocabulary fragment and the line-number shape list, which Tasks 2 and 5 keep |
| 37 | `plugin/agents/ui-tests-plan-writer.md` | — | P4 | `no-change` | as row 20 |
| 38 | `plugin/agents/user-review-fix-plan-writer.md` | — | P4 | `no-change` | as row 20 |

## Up-front word counts

Up-front words are the agent definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md`, the adopter's conventions documents and conditional inputs. `Before` is the probe's count at `25e2382a`. Task 6 fills the `After` and `Δ` cells from the probe's `WORDS` and `UPFRONT` lines. Every `Δ up-front` must be below `0`.

| Agent | Reads counted besides the definition | Before — definition | Before — up-front | After — definition | After — up-front | Δ up-front |
|---|---|---|---|---|---|---|
| docs-writer | none, before and after | 3433 | 3433 | _Task 6_ | _Task 6_ | _Task 6_ |
| docs-reviewer | before: all of `plugin/agents/docs-writer.md` (3433); after: its six sections named in Task 4, as Tasks 1–3 leave them | 2422 | 5855 | _Task 6_ | _Task 6_ | _Task 6_ |
