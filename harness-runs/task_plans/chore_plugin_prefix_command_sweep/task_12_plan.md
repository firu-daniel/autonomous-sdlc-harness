### Task 12 — Sweep `README.md`, `llms.txt`, `ARCHITECTURE.md` and `ROADMAP.md`, and align their measurement text with §6

**Goal:** The four root documents, which are the first thing an adopter reads, spell every plugin command `/autonomous-sdlc-harness:<name>`, starting with the checklist's step 3 and the quick start. Their sentences about the command-spelling measurement say the same thing as the closed `docs/development.md` §6 paragraph, and none of them still calls the sweep deferred.

**Depends on:** Task 11. Its closed paragraph in `docs/development.md` → `## 6. The roadmap this tree defers to` opens exactly *"A third debt belongs to no row at all, and it is paid:"*. It records:
- the rule, stated in §5 gate 6 in the paragraph opening *"A fourth command checks that every slash spelling of a plugin command carries the plugin prefix"*
- the watcher first-message route and its evidence
- the headless `claude -p` leg, with its version, or `not re-run`
- two open measurements: pasting a command that carries an argument into an interactive session, and the post-merge first-phase confirmation

Read that paragraph and restate its facts. Do not add a fact it does not hold, and do not copy a bare spelling out of it: the root documents describe the measured subject in words, for example *"the unprefixed spelling"*.

**Where this task stops.** The heading `### Measured while building that evidence, and not fixed here` keeps its text, because other files cite it. `llms.txt`'s link targets and structure do not change: gate 6c (`scripts/check-llms-txt.sh`) grades line 1, the `> ` line before the first `## `, and every link. The gate itself is Task 13's.

### Targets

- `README.md`
- `llms.txt`
- `ARCHITECTURE.md`
- `ROADMAP.md`

**Work:**

- [ ] **`README.md`, checklist and quick start.**
  - Step 3's fenced block becomes `/autonomous-sdlc-harness:harness-analyze`.
  - Under **C. Teach it the codebase**, replace the inline *"type `/harness-analyze <target>`"* with a sentence that ends on a fenced block holding `/autonomous-sdlc-harness:harness-analyze <target>` on its own line. The lessons ledger's rule requires it: *"Every command an adopter is meant to run sits in a fenced block, one command per line; never inline it"* (`harness-runs/lessons.md`).
  - Qualify `/branch-prompt` in the Mermaid labels (the `ASK[…]` node and the `N -.->` edge label, both already inside double quotes), in the plugin node label's `/harness-analyze`, and in the prose after the quick start (*"it invokes `/branch-prompt` with the request"*, *"`/branch-prompt` itself"*).
  - Qualify the plugin-assets paragraph (*"the `/harness-analyze` setup command"*) and the `docs/analyze.md` row in `## Where to read more`.
- [ ] **`README.md`, the measurement bullet** under `### Measured while building that evidence, and not fixed here`. Rewrite *"Every documented `/autonomous-sdlc-harness:…` slash spelling is interactive-only"* so it says what §6 now says:
  - every command in this tree is documented with the prefix
  - the headless result as re-measured, or as last measured if it was not re-run
  - pasting a command that carries an argument into an interactive session is not yet measured

  Keep its link to `docs/development.md` §6 and its cited phrase *"A third debt belongs to no row at all"*. Add no bare spelling.

  - **The `**Interactive only.**` bullet under **Before you run it**, same step.** It currently reads *"**Interactive only.** Step 3 answers `Unknown command` in a headless `claude -p` session. The measurement is [`docs/development.md`](docs/development.md) §6."* After this task, step 3 shows `/autonomous-sdlc-harness:harness-analyze`, which is exactly the spelling Task 2 re-measured headless (`claude -p "/autonomous-sdlc-harness:harness-analyze"`). Read §6's headless-leg record and branch on it:
    - **§6 records the prefixed headless leg as failing, or as `not re-run`.** Keep the bullet. Keep its bold lead `**Interactive only.**` byte-identical, because step C cites the bullet by it (*"see **Interactive only**"*), and keep the `[`docs/development.md`](docs/development.md) §6` link. Rewrite the middle sentence so it states §6's headless result for step 3's spelling: as re-measured, with the Claude Code version and the message §6 quotes, or, when §6 says `not re-run`, as last measured and not re-run on this branch. Add no bare spelling.
    - **§6 records the prefixed headless leg as resolving.** Then the bullet's premise is false. Delete the whole `**Interactive only.**` bullet. Rewrite step C's sentence *"This step is limited twice: see **Interactive only** and **The `.claude/` write wall** under **Before you run it**."* so it says the step is limited once and cites only **The `.claude/` write wall**, and leave that bullet's lead byte-identical. Before deleting, run `grep -rn 'Interactive only' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=harness-runs` and rewrite any other citer this task owns; one this task does not own is a blocker to return, not a site to edit. Make `llms.txt`'s summary line (next step) stop saying the command works only interactively.
- [ ] **`llms.txt`.** Qualify the summary line's *"Its setup command, `/harness-analyze`, works only when typed into an interactive Claude Code session"*, keeping its meaning aligned with the README bullet. Also qualify the fenced command line, the `plugin/` entry's `/harness-analyze`, and the `docs/analyze.md` entry's `/harness-analyze`.
- [ ] **`ARCHITECTURE.md`.**
  - In the paragraph opening *"One spelling rule follows, and binds every section."*, keep the naming-by-identifier rule. Replace the sentences that call the sweep deferred and its destination *"open rather than settled"* with its outcome: the sweep ran, the rule and gate 6d are in `docs/development.md` §5 gate 6, and the watcher strings' route is the measured one recorded in §6. Drop the clause about bare spellings moving *"the dated figures that paragraph publishes"*, since the paragraph no longer publishes counts.
  - In the `**[shipped]**` paragraph that cites *A third debt belongs to no row at all*, make its one-sentence summary of the measurement match §6's.
- [ ] **`ROADMAP.md`.** Qualify `/branch-prompt` in the *Per-run base branch* row and `/harness-analyze` in the *README summary and checklist* row.

**Verification:**

- `grep -nE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)' README.md llms.txt ARCHITECTURE.md ROADMAP.md` prints nothing.
- `grep -n 'autonomous-sdlc-harness:harness-analyze' README.md` shows the checklist's step 3 line and the fenced `<target>` line under **C. Teach it the codebase**.
- Read the `**Interactive only.**` bullet, if §6 kept it, side by side with Task 11's closed §6 paragraph in `docs/development.md` (the paragraph opening *"A third debt belongs to no row at all, and it is paid:"*). The bullet's headless result for `/autonomous-sdlc-harness:harness-analyze` is the one §6 records for that spelling: the same outcome, the same Claude Code version or the same `not re-run`. `grep -n 'Interactive only' README.md` then shows the bullet's line and step C's pointer. If §6 records the prefixed leg as resolving, the same grep prints nothing, and step C's sentence cites only **The `.claude/` write wall**.
- `grep -n -e deferred -e 'open rather than settled' ARCHITECTURE.md` finds no sentence still describing the command-spelling sweep as deferred.
- `bash scripts/test.sh` exits 0. Gate 6c passes over the edited `llms.txt`.
