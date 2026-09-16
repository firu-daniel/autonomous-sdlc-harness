# Story: README summary and checklist, a compact README, and `llms.txt`

## Context

This branch closes three `ROADMAP.md` items: *README summary and checklist*, *Compact the README* and *`llms.txt`*. Apart from one new link check, it only rewrites and moves prose. It changes nothing the harness does.

The work runs in this order. First, each of the five long measured caveats in `README.md` moves into the reference document that already covers its subject. The destination gets the full measured text, merged with anything it already says, so there is never a second copy. Those moves are Tasks 2–4, one task per destination file. Task 1 comes before them: the three `cli/` comments that send a reader to the README for a measurement get pointed at their destinations. The destinations are:

- The slash-spelling measurement goes to `docs/development.md` → `## 6. The roadmap this tree defers to` (Task 3).
- The `.claude/` write wall goes to `docs/analyze.md` → `## 3. What it may write` (Task 4).
- The *git only* bullet's hard-gate half goes to `docs/cli.md` §2, and its jj half, together with the jj-shapes measurement, goes to §7's `jj-repository` bullet (Task 2).
- The missing-remote write-up goes to `docs/cli.md` §7's `remote` bullet (Task 2).

Second, the README gets its new opening: three plain lines, a five-step checklist and the caveats below it (Task 5). Then the rest of it is compacted (Task 6). Third, the files that quote the README's measurement bullets get pointed at the new homes, and `docs/development.md`'s item 9 row is corrected where it describes the current file (Task 7). Last, `llms.txt` is written from the finished README (Task 8), its link check lands in `scripts/run-gates.sh` gate 6 (Task 9), and the roadmap is updated (Task 10).

**Settled while planning, so no task has to settle it again.**

- **No test, gate or generator reads the README's text.** `cli/test/` only creates fixture `README.md` files and reads the run-artifact tree's READMEs. `scripts/run-gates.sh` never opens the root README. So a wording change can only break a citation, never a check.
- **Headings that files outside the README cite, and that therefore keep their exact text:** `## Quick start`, `## Two ledgers`, `## Scope and limits`, `### The shape of the system` and `### Measured while building that evidence, and not fixed here`. The README's own `[Scope and limits](#scope-and-limits)` links depend on the third one.
- **Named bullets that other files cite, and that therefore keep their lead words:** *Claude-bound today* (`ARCHITECTURE.md`), *Single-machine* with its burn-rate sentence (`docs/development.md` item 16's row), *Forge-agnostic* and *Design→code generation is out of scope* (`ARCHITECTURE.md` → `### The shape of the system` citations). Also, every adopter command in the quick start stays in the `npx autonomous-sdlc-harness …` form (`cli/src/commands/init.ts`, `cli/test/profile.test.mjs`).
- **`llms.txt` belongs to the repository, not the npm package.** `cli/package.json` → `files` is relative to `cli/` and the package is published from there, so a root file cannot be listed in it. No manifest changes.
- **The link check lives beside this repository's other path checks**, as gate 6c of `scripts/run-gates.sh`, and is documented in `docs/development.md` §5 gate 6. It takes the removed-path set from `scripts/publish-main.sh` → `removed_paths` rather than copying it. That array has seven entries: it adds `.gitattributes` and `.github/workflows/publish-main.yml` to the five the task prompt lists.

**Rules every prose task follows.** A measured fact moves verbatim, with its version, its command and its exact message (`.claude/context/conventions.md` → `## Documents of record`). New text in any file must not add an `item <N>` phrase: `docs/development.md` §6 requires a legend row for every number `grep -rn -E "items? [0-9]+"` reports, and the three roadmap entries this branch closes have no such rows. Cite by heading or quoted text, never by line number. Short sentences, one idea per paragraph.

**Top risks:** The likeliest failure is a fact that disappears: a sentence cut from the README that never reaches its destination. The three caveat-destination tasks (2–4) guard this by landing each measurement before the README is cut, and Task 6 guards it by walking its moved-paragraph table against each destination. The second risk is a citation that still resolves but now lies, such as a file that says "read the README bullet for the version" after the version has moved. Task 1 and Task 7 re-point every such site, and the scope register below lists all of them. The third risk is an `llms.txt` link that works on `dev` but not on `main`. Task 9's check guards it: it refuses any path under `publish-main.sh`'s removed set, and it is shown to fail on a planted link into `scripts/`.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and each marker is flipped to `[x]` as that task's commit lands. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker and never edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside per-task files, are informational only, and the committer never touches them.

Each entry maps 1:1 to `harness-runs/task_plans/feat_readme_summary_compact_llms_txt/task_<K>_plan.md`. Entries run bottom-up in ship order, with the catch-all layer last.

1. [x] **Task 1** — Re-point the `cli/` comments that send a reader to the README for a measurement _(layer: cli)_ _(points: 8)_
2. [x] **Task 2** — Move the *git only*, jj-shapes and missing-remote caveats into `docs/cli.md` §2 and §7 _(layer: general)_ _(points: 20)_
3. [x] **Task 3** — Move the slash-spelling measurement into `docs/development.md` §6 _(layer: general)_ _(points: 10)_
4. [ ] **Task 4** — Move the `.claude/` write-wall measurement into `docs/analyze.md` §3 and re-point `docs/config.md` §3 _(layer: general)_ _(points: 12)_
5. [ ] **Task 5** — Open `README.md` with three plain lines, the five-step checklist and the caveats below it _(layer: general)_ _(points: 20)_
6. [ ] **Task 6** — Compact `README.md`'s `## How it is measured`, `## Two ledgers` and `## Scope and limits` _(layer: general)_ _(points: 20)_
7. [ ] **Task 7** — Re-point `ARCHITECTURE.md`'s measurement citations and correct `docs/development.md`'s item 9 row _(layer: general)_ _(points: 12)_
8. [ ] **Task 8** — Write `llms.txt` at the repository root from the finished README _(layer: general)_ _(points: 10)_
9. [ ] **Task 9** — Add the `llms.txt` link check as `scripts/run-gates.sh` gate 6c and document it in `docs/development.md` §5 _(layer: general)_ _(points: 15)_
10. [ ] **Task 10** — Mark the three roadmap rows `Done` and renumber the `ROADMAP.md` index _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Find every file that links to a README heading or anchor, such as `#scope-and-limits`, or quotes a README heading like `README.md` `## Two ledgers` in `ARCHITECTURE.md`. Keep the heading, or edit every file that cites it."* This register also covers the caveat destinations, under the prompt's *"Whether a destination document already states the caveat differently. If it does, merge the two into one statement."*

**Derivation entry 1: files citing the root README, by heading, anchor, named bullet or any other form (command).** Re-run verbatim from the checkout root:
`git grep -n -i -F -e "quick start" -e "see it without adopting it" -e "adopting it in your own repository" -e "how it is measured" -e "two ledgers" -e "scope and limits" -e "the shape of the system" -e "what the shipped evidence covers" -e "measured while building that evidence" -e "where to read more" -e "scope-and-limits" -e "quick-start" -e "claude-bound" -e "forge-agnostic" -e "single-machine" -e "git only" -e "shapes adopt" -e "root README" -e "root \`README.md\`" -e "(README.md)" -e "(\`README.md\`" -e "blob/main/README.md" -e "README.md's" -- . ":!harness-runs" ":!README.md" ":!examples/notes-app/sdlc-harness"`
The excluded paths are the README itself (Tasks 5–6 own its internal anchors), this repository's own run artifacts and the frozen capture. Headings that wrap across a comment line are still reached through the bullet-name terms, as `cli/src/doctor/checks.ts` shows. The last six terms reach a citation that names the README without naming a heading: "root README", a parenthesised `(README.md)` citation, a bare `[README.md](README.md)` link, and a possessive.

**Derivation entry 2: destination documents already stating a caveat (command).** Re-run verbatim:
`git grep -n -F -e "2.1.237" -e "2.1.263" -e "Skills (20)" -e "jj 0.44" -e "git_target" -e "pushed: failed" -e "acceptEdits" -e "having written nothing" -e "refuses to run outside" -- docs ARCHITECTURE.md plugin/docs cli/README.md examples/README.md`

**Derivation entry 3: files citing `ROADMAP.md` (command).** Re-run verbatim: `git grep -n -i -F -e "ROADMAP.md" -- . ":!harness-runs" ":!ROADMAP.md"`

No standing tracked matrix under `harness-runs/` covers any file in this plan, so no standing-artifact procedure entry is owed.

**Closure invariant:** every site any entry above reaches appears as a row below. Rows marked *target* are files the plan edits that no derivation reaches.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ARCHITECTURE.md` → "Its *Claude-bound today* bullet states the current position in one paragraph" | — | entry 1, `claude-bound`, `scope-and-limits` | `no-change` | Task 6 keeps the *Claude-bound today* bullet by name as one paragraph |
| 2 | `ARCHITECTURE.md` → "`### Measured while building that evidence, and not fixed here` reports that in a headless session both the qualified and the bare form answer `Unknown command`" | — | entry 1 | `change` | Task 7: re-point to `docs/development.md` §6, where the measurement now lives |
| 3 | `ARCHITECTURE.md` → "Read the slash-spelling bullet there for the measurement and its version" | — | entry 1 | `change` | Task 7: the version moves out of the README, so this pointer would lie |
| 4 | `ARCHITECTURE.md` → "both sit in one bullet of [`README.md`](README.md) `### Measured while building…`" (the `.claude/` namespace row) | — | entries 1 and 2, `acceptEdits` | `change` | Task 7: re-point to `docs/analyze.md` §3 |
| 5 | `ARCHITECTURE.md` → "No design-source coupling" (`### The shape of the system`) | — | entry 1 | `no-change` | Heading and the *Design→code generation is out of scope* bullet are kept (Task 6) |
| 6 | `ARCHITECTURE.md` → "states the same for an adopter in its *Forge-agnostic* bullet" | — | entry 1 | `no-change` | Task 6 keeps the *Forge-agnostic* bullet by name |
| 7 | `ARCHITECTURE.md` → "[`README.md`](README.md) `## Two ledgers` owns what each of them closes the loop on" | — | entry 1 | `no-change` | Task 6 keeps `## Two ledgers` and its *Why both* statement of each loop |
| 8 | `ARCHITECTURE.md` → "`--permission-mode` names a **mode**: `PERMISSION_MODE=…acceptEdits`" | — | entry 2, `acceptEdits` | `no-change` | Describes the watcher's launch flag and cites no README caveat |
| 9 | `cli/README.md` → "see the harness root `README.md` `## Quick start` for the lettered sequence an adopter runs" | — | entry 1 | `no-change` | `## Quick start` is kept, and steps A–F stay under it as the detail behind each checklist line (Task 5) |
| 10 | `cli/src/commands/init.ts` → `ANALYZE_COMMAND_QUALIFIED` doc comment, "(root `README.md`, `### Measured while building that evidence…`" | — | entry 1 | `change` | Task 1 |
| 11 | `cli/src/commands/init.ts` → "root `README.md`'s quick start is `npx autonomous-sdlc-harness …` throughout" | — | entry 1 | `no-change` | Task 5 keeps every adopter command in the `npx` form |
| 12 | `cli/src/core/writer.ts` → "for the two ledgers, `'never'` and nothing else" | — | entry 1, phrase only | `no-change` | Names the ledger artifacts, not a README heading |
| 13 | `cli/src/core/writer.ts` → "the two ledgers, `'never'` only" | — | entry 1, phrase only | `no-change` | Same as row 12 |
| 14 | `cli/src/doctor/checks.ts` → `JJ_DIR` doc comment, "recorded in `README.md`'s `## Scope and limits`, in the bullet opening *Both `jj` shapes adopt*" | — | entry 1, `shapes adopt` | `change` | Task 1 |
| 15 | `cli/src/generators/stateDir.ts` → "The two ledgers are `create-if-absent`" | — | entry 1, phrase only | `no-change` | Ledger artifacts, not a README citation |
| 16 | `cli/src/generators/stateDir.ts` → "The tree's root README frames the set" | — | entry 1, phrase only | `no-change` | Means the run-artifact tree's `README-root.md`, not the repository README |
| 17 | `cli/templates/state-dir/README.md` → "the two ledgers sit at this level" | — | entry 1, phrase only | `no-change` | Template prose about ledger placement |
| 18 | `cli/test/doctor.test.mjs` → fourth-case header, "Measured on jj 0.44.0 and recorded in `README.md`'s `## Scope and limits`" | — | entry 1 | `change` | Task 1 |
| 19 | `cli/test/doctor.test.mjs` → non-colocated seed doc comment, "per `README.md`'s `## Scope and limits`" | — | entry 1 | `change` | Task 1 |
| 20 | `cli/test/profile.test.mjs` → "The quick start reaches the CLI through `npx`" | — | entry 1 | `no-change` | Task 5 keeps the `npx` form |
| 21 | `docs/cli.md` → `--force` flag row, "never the two ledgers" | — | entry 1, phrase only | `no-change` | Ledger artifacts |
| 22 | `docs/cli.md` §2 → "(root `README.md`, `### Measured while building that evidence, and not fixed here`)" | — | entry 1 | `change` | Task 2: re-point to `docs/development.md` §6 |
| 23 | `docs/cli.md` §3 → "The **two ledgers** are the other two" | — | entry 1, phrase only | `no-change` | Ledger artifacts |
| 24 | `docs/cli.md` §7 → `jj-repository` bullet, "(`README.md` → `## Scope and limits`)" | — | entries 1 and 2, `jj 0.44` | `change` | Task 2: the jj measurement lands in this bullet, merged, and the README citation goes |
| 25 | `docs/config.md` §3 → "(`README.md` → "Measured while building that evidence, and not fixed here")" | — | entries 1 and 2, `acceptEdits` | `change` | Task 4: re-point to `docs/analyze.md` §3 |
| 26 | `docs/development.md` §6 → item 9 row, "the Mermaid diagram … leading the file" | — | entry 1 | `change` | Task 7: correct only its claims about the current file |
| 27 | `docs/development.md` §6 → item 16 row, "the root `README.md`'s scope-and-limits **Single-machine** bullet" | — | entry 1 | `no-change` | Task 6 keeps the *Single-machine* bullet and its burn-rate sentence |
| 28 | `docs/development.md` §6 → third-debt paragraph, "The root `README.md` measures that exact path under `### Measured…`" | — | entries 1 and 2, `2.1.237` | `change` | Task 3: the full measurement merges into this paragraph |
| 29 | `examples/README.md` → "the one of the two ledgers `init` seeded there" | — | entry 1, phrase only | `no-change` | Ledger artifacts |
| 30 | `plugin/docs/AUTONOMOUS_FLOW.md` → "The harness is forge-agnostic in this release" | — | entry 1, phrase only | `no-change` | Its own statement, citing no README bullet |
| 31 | `plugin/docs/AUTONOMOUS_FLOW.md` → "**Single machine, git only.**" | — | entry 1, phrase only | `no-change` | Its own out-of-scope bullet |
| 32 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → "The honest scope of this release is stated rather than defended" | — | entry 1, phrase only | `no-change` | Cites `AUTONOMOUS_FLOW.md`, not the README |
| 33 | `README.md` → "[`ROADMAP.md`](ROADMAP.md) — what is planned beyond this release" | — | entry 3 | `no-change` | The link is kept. Task 10 changes no heading or anchor, and nothing cites an index number |
| 34 | `README.md` (whole file) | — | target | `change` | Tasks 5 and 6 |
| 35 | `docs/cli.md` §2 → "**Not inside a git repository, and the run was not told to create one.**" bullet; §7 → `remote` bullet | — | target | `change` | Task 2 |
| 36 | `docs/analyze.md` §3 → "**What that hand-off costs at run time, plainly.**" | — | target | `change` | Task 4 |
| 37 | `docs/development.md` §5 → **Gate 6 — self-containment.** | — | target | `change` | Task 9 |
| 38 | `llms.txt` (new) | — | target | `change` | Task 8 |
| 39 | `ROADMAP.md` → `## Index`, `## Documentation` and `## Engines, environments and integrations` tables | — | target | `change` | Task 10 |
| 40 | `plugin/docs/README.md` → "the repository's root README frames the flow documents that way, alongside the agents, slash commands, hooks, instructions, samples and helper scripts" | — | entry 1, `root README` | `no-change` | Task 5 must keep the plugin paragraph saying the plugin carries the two flow documents alongside its other process assets (an invariant in `task_5_plan.md`), and Task 7 checks this site against the finished README. Fixing it at the README side avoids a `plugin`-layer task that would have to ship before the `general` rewrite it depends on |
| 41 | `.claude/CLAUDE.md` → "ships an autonomous software-delivery harness as two halves** (`README.md`)" | — | entry 1, `` (`README.md` `` | `no-change` | Task 5 keeps the diagram and the plugin and CLI paragraphs under it unchanged in content, so the two halves stay stated. Task 7 checks this site against the finished README |
| 42 | `.claude/context/conventions.md` → the `_Written by /harness-analyze …_` provenance footer naming `README.md` among its sources | — | entry 1, `` (`README.md` `` | `no-change` | A conventions document: never a task target. It records what the document was written from, which stays true |
| 43 | `ROADMAP.md` → "For what ships today, see [`README.md`](README.md)." | — | entry 1, `(README.md)` | `no-change` | A plain file link with no heading; the file stays and still says what ships |
| 44 | `docs/development.md` §6 → item 7 row, "the tree's own root README" | — | entry 1, `root README` | `no-change` | Means the run-artifact tree's README, not the repository README |
| 45 | `plugin/samples/sample_code_review.md` → Finding 3 readiness entry, "Name the surface in the root `README.md` after the label the panel actually renders" | — | entry 1, ``root `README.md` `` | `no-change` | Describes the sample's imaginary project, not this repository |
| 46 | `plugin/samples/sample_code_review.md` → heading "### 3. The root `README.md` calls the surface \"Search history\"…" | — | entry 1, ``root `README.md` `` | `no-change` | Same as row 45 |
| 47 | `plugin/samples/sample_code_review/finding_3.md` → heading "### 3. The root `README.md` calls the surface \"Search history\"…" | — | entry 1, ``root `README.md` `` | `no-change` | Same as row 45 |
