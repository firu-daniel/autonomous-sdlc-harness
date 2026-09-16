### Task 7 — Re-point `ARCHITECTURE.md`'s measurement citations and correct `docs/development.md`'s item 9 row

**Goal:** After Tasks 5 and 6, every citation into the README must still resolve **and still be true**. Three `ARCHITECTURE.md` sites send a reader to a README bullet for a measurement and its version, and those details have moved. Point each at the document that now holds the measurement. Then correct `docs/development.md` → `## 6. The roadmap this tree defers to`, item 9's row, only where it makes a claim about the README as it now stands.

**Depends on:** Tasks 3 and 4, which placed the measurements at the new targets, and Tasks 5 and 6, which settled the README's final shape. The new targets are:

- slash spellings → `docs/development.md` → `## 6. The roadmap this tree defers to`, the paragraph opening **"A third debt belongs to no row at all"** (Task 3)
- `.claude/` write wall → `docs/analyze.md` → `## 3. What it may write` (Task 4)

Task 3 also edited `docs/development.md`, in a different paragraph. This task touches only item 9's row in that file.

### Targets

- `ARCHITECTURE.md` — the paragraph opening **"One spelling rule follows, and binds every section."**, the paragraph opening **"The first message is not free text with a command embedded in it"**, and the table row opening **"The adopter's `.claude/` namespace"**.
- `docs/development.md` → `## 6. The roadmap this tree defers to`, the row `| 9 | **Shipped.** The root \`README.md\` …`.

**Work:**

- [ ] `ARCHITECTURE.md`, *One spelling rule*: replace *"[`README.md`](README.md) `### Measured while building that evidence, and not fixed here` reports that"* with a citation of [`docs/development.md`](docs/development.md) `## 6. The roadmap this tree defers to`, which now carries the measurement. Keep the sentence's claim unchanged.
- [ ] `ARCHITECTURE.md`, *The first message is not free text*: re-point *"Measured rather than reasoned, and recorded elsewhere: [`README.md`](README.md) `### Measured…` reports …"* and *"Read the slash-spelling bullet there for the measurement and its version"* to that same `docs/development.md` §6 paragraph.
- [ ] `ARCHITECTURE.md`, *the `.claude/` namespace* row: re-point *"both sit in one bullet of [`README.md`](README.md) `### Measured…`"* and *"Read that bullet for both, and for the version they were measured on"* to [`docs/analyze.md`](docs/analyze.md) `## 3. What it may write`. Keep the row's own summary of the two consequences.
- [ ] `docs/development.md` item 9's row records what item 9 **delivered**, and that record stays. Change only clauses that assert something about the README **as it now is** and have become false. Candidates: *"the Mermaid diagram … leading the file"*, *"that section opens by saying so"* and the scope-and-limits clause about *"the three limits item 8 measured"*. Make each true with the least edit, for example "leading the file as delivered". Or append one closing sentence saying the file now opens with a three-line summary and a five-step checklist, with the diagram below and the measured limits' full text moved into the reference documents. Add no `item <N>` phrase, and cite no `ROADMAP.md` priority number.

**Verification:**

- `git grep -n -F "Measured while building" -- ARCHITECTURE.md` prints nothing, and each re-pointed sentence names a section that exists: `grep -n "^## 6. The roadmap this tree defers to" docs/development.md` and `grep -n "^## 3. What it may write" docs/analyze.md` each hit.
- **The citations this task deliberately leaves alone still hold against the finished README.** Read each against `README.md` and confirm it:
  - `ARCHITECTURE.md` *"Its *Claude-bound today* bullet states the current position in one paragraph"*
  - `ARCHITECTURE.md` *"`### The shape of the system`"* (the design-source bullet) and *"its *Forge-agnostic* bullet"*
  - `ARCHITECTURE.md` *"`## Two ledgers` owns what each of them closes the loop on"*
  - `cli/README.md` *"`## Quick start` for the lettered sequence"*
  - `docs/development.md` item 16's *"the root `README.md`'s scope-and-limits **Single-machine** bullet"* and its burn-rate statement
  - `plugin/docs/README.md` *"the repository's root README frames the flow documents that way, alongside the agents, slash commands, hooks, instructions, samples and helper scripts"*: the README's plugin paragraph must still name the flow documents among the plugin's process assets
  - `.claude/CLAUDE.md` *"ships an autonomous software-delivery harness as two halves** (`README.md`)"*: the README must still present `plugin/` and `cli/` as the two halves

  A citation that no longer holds is fixed in this task, in the citing file, if that file is one of this task's targets. Otherwise it is reported as a blocker naming the site.
- Re-run the story index's scope-register derivation entry 1 verbatim, copied from the index (`git grep -n -i -F -e "quick start" … -e "root README" … -e "README.md's" -- . ":!harness-runs" ":!README.md" ":!examples/notes-app/sdlc-harness"`). Every hit must be a register row, and every row marked `change` must be done.
- `grep -rn -E "items? [0-9]+" ARCHITECTURE.md docs/development.md` reports no number the `dev` versions did not.
