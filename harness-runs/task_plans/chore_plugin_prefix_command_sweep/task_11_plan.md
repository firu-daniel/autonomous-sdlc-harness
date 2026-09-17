### Task 11 — Record the spelling rule and the gate-6d contract, sweep `docs/development.md`, and close the debt paragraph

**Goal:** `docs/development.md` does three things once this task lands:
- It states the command-spelling rule once, together with the contract of the check that enforces it (gate 6d).
- It spells its own prose sites qualified. The gate-8 block is the exception and keeps its bare spelling.
- The §6 paragraph opening *A third debt belongs to no row at all* records that the sweep ran: the rules it applied, every measurement it took, and every measurement it could not take. It no longer describes the sweep as owed.

**Depends on:** Tasks 1, 2 and 9, as sources of record. Do not re-measure.
- **Task 1** wrote the watcher first-message measurement and the route it decided. They are in `cli/templates/scripts/autonomous-watcher.sh`, in the comment block whose first line is `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.`, above `ENGINE_COMMAND_TASK=`. The block holds the Claude Code and plugin versions, the `claude -p "<task-engine launch_prompt>" --permission-mode plan --max-turns 4 --output-format stream-json --verbose` command, verbatim evidence per spelling, and the route (`prefixed` or `bare`).
- **Task 2** wrote the headless leg in `cli/src/commands/init.ts`, in the doc comment on `ANALYZE_COMMAND`, in the paragraph opening `Headless first-message leg, re-measured:`. It holds the version, `claude -p "/autonomous-sdlc-harness:harness-analyze"` and `claude -p "/harness-analyze"` with exit codes and verbatim messages, or `not re-run` with the verbatim refusal.
- **Task 9** mirrored the watcher and left the `docs/outer-loop-verification.md` capture table in its captured spelling.

Copy the facts from those files verbatim: version, command, exact message.

**Where this task stops.**
- **The gate itself** is Task 13's, `scripts/check-command-spelling.sh` plus its `run-gates.sh` line. This task writes the contract that script implements, which is the "contract before consumer" order (`.claude/context/conventions.md` → `### The order files are created…`). Task 13 restates the same contract.
- **The README bullet** and `ARCHITECTURE.md`'s two citations of this paragraph are Task 12's. They cite it by its opening words, so those words stay exactly *A third debt belongs to no row at all*.
- **No roadmap row changes meaning.** Rows 9 and 15 change spelling only.

### Targets

- `docs/development.md`

**Work:**

- [ ] **Prose sites.**
  - Qualify `/harness-analyze` in the gate-8 lead paragraph (*"`/harness-analyze` is judgement rather than deterministic code"*), in *"Run 1 — fill the corpus"* and *"Run 2 — `/harness-analyze`, no argument and without `--yes`"*, and in the item 9 and item 15 roadmap rows.
  - Leave the fenced gate-8 block's two lines, `/harness-analyze --dry-run` and `/harness-analyze`, **bare**. That is carve-out (1). Its reason still holds: those lines are typed where a picker is present. Whether the picker survives an argument is the open measurement below, and the closed paragraph says so.
- [ ] **The rule and the gate-6d contract.** In `## 5. Verifying a change` → gate 6, add a paragraph directly after the one opening *"A third command checks that every link in `llms.txt` resolves on `main`"*. It opens exactly `**A fourth command checks that every slash spelling of a plugin command carries the plugin prefix**` and states:
  - **(a) The rule.** Every slash spelling of a command this plugin ships is `/autonomous-sdlc-harness:<name>`. The prefix comes from the plugin manifest's `name`, and no file under `plugin/commands/` is renamed for it.
  - **(b) Why model-read text follows the same rule.** An agent invokes a command only through the `Skill` tool, by `autonomous-sdlc-harness:<name>` without a slash (`cli/templates/claude/harness-task-offer.md`). A slash spelling an agent reads is therefore a referent or text it relays to a person.
  - **(c) What is not a spelling:** path citations, and the `branch-*` family noun written without a slash.
  - **(d) The carve-outs.** The gate-8 block. `examples/notes-app/.claude/` and `examples/notes-app/sdlc-harness/`. `harness-runs/`. This checkout's `.claude/`, which is `init`'s and the analyze command's output and which a run cannot edit. A bare spelling quoted as the measured subject of a record: the §6 paragraph, the watcher measurement comment, `init.ts`'s headless paragraph, and the `docs/outer-loop-verification.md` `### 2.2` capture table. The three watcher strings and their mirrors, **only** when the measured route is `bare`.
  - **(e) The check.** `bash scripts/check-command-spelling.sh`, run by `scripts/run-gates.sh` as gate 6d. It takes no argument (any argument exits 2). It resolves the root from its own location. It scans every tracked and untracked-unignored file with `git grep --untracked`, excluding `.claude/`, `examples/notes-app/.claude/`, `examples/notes-app/sdlc-harness/`, `harness-runs/` and itself. It matches `(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)`. The paragraph says in one sentence, in words, that a spelling followed directly by a sentence-ending period is caught, and a `.md` path such as `commands/branch-start-plan.md` is not. **That sentence must not itself write a bare spelling** — no `/branch-…` or `/harness-analyze` example ending in a period or anything else — because this file is in gate 6d's scan set and no exemption class covers the contract paragraph; a literal example there would be a finding Task 13 must return as a blocker. The regex quoted in the paragraph is safe: it does not match itself. It skips a matching line that an entry of its in-script exemption table covers. **Write the exemption rule into the paragraph in these terms:**
    - Each entry is `<path>|<kind>|<text>`. `<kind>` is `line` or `contains`.
    - A `line` entry covers a line of `<path>` whose entire content, with trailing whitespace stripped, equals `<text>`. A `contains` entry covers a line of `<path>` that contains `<text>` as an exact substring.
    - **Every entry must cover exactly one line of its file**, counted over all of that file's lines, not only the matching ones. An entry that covers no line is reported as `<path>:0 — stale exemption: <text>`. An entry that covers more than one line is reported once for each covered line, as `<path>:<line> — ambiguous exemption: <text>`. So an entry can never excuse a line added after it was written: a second line it would reach turns it into a finding.
    - The gate-8 block's two lines are exempted by `line` entries. A `contains` entry must use text found on its one intended line and on no other line of that file. What an entry still cannot see is a second bare spelling added **inside** the one line it covers; the paragraph says so in one sentence.
    - It prints each finding on stderr as `check-command-spelling: <path>:<line> — <reason>`, reports them all, and exits 0 when there are none and 1 otherwise. Its header `REPRO` block holds the measured planted-failure output.
- [ ] **Close the debt paragraph.** Rewrite §6's paragraph so it opens exactly **"A third debt belongs to no row at all, and it is paid:"**. It then records:
  - which branch ran the sweep, and that the rule and its check are in §5 gate 6
  - the classes the sweep decided: human-facing and model-read both qualified, and the watcher strings by measurement
  - the watcher measurement and its route, verbatim from Task 1's comment
  - the headless leg, verbatim from Task 2's paragraph, with its Claude Code version, or `not re-run` with the refusal
  - the earlier measurements it rests on, kept with their versions: 2.1.237 under the former slug `harness`, and 2.1.263's `plugin details` **Skills (20)** and interactive picker results
  - **as open measurements**, stated as not taken rather than guessed: what happens when `/harness-analyze presentation` or `/autonomous-sdlc-harness:harness-analyze presentation` is pasted into an interactive session and submitted (an unattended run cannot drive one), and the post-merge confirmation that an unattended run launched with the decided strings reaches its first phase

  Delete the "owed" framing: the dated 80/73 counts, the reproduction command offered as a to-do, and *"carried on its own branch"*. Replace the counts with a pointer to gate 6d, which re-derives the set on every run. A bare spelling quoted here as the measured subject stays literal.
- [ ] **Keep the section coherent.** The *"Items 3, 4, 13 and 14 have shipped"* paragraph and the other §6 paragraphs must not still call this debt open. Grep §6 for `sweep` and `prefix` and correct any sentence that does.

**Verification:**

- `grep -n 'A third debt belongs to no row at all' docs/development.md README.md ARCHITECTURE.md` still finds the paragraph here. The citers in `README.md` and `ARCHITECTURE.md` still resolve against it; Task 12 updates what they say.
- `grep -nE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)' docs/development.md` prints only the two gate-8 block lines and the lines of the closed §6 paragraph that quote a bare spelling as a measured subject. Any other line is a missed site, including one where the spelling ends a sentence.
- The gate-6d contract paragraph quotes that same widened pattern byte for byte (`grep -nF '\.([^A-Za-z0-9_/-]|$)' docs/development.md` finds it), and states that a sentence-final spelling is caught while a `.md` path is not.
- The pattern grep from the second bullet, run over `docs/development.md`, prints **no** line from the gate-6d contract paragraph (the paragraph opening `**A fourth command checks that every slash spelling of a plugin command carries the plugin prefix**`). A hit there means the paragraph writes a bare example that no exemption class covers; reword it in words.
- Every measurement sentence in the closed paragraph carries a version, a command and an exact message, or says in plain words that the measurement was not taken and why (`.claude/context/conventions.md` → `## Documents of record`).
- `grep -n 'ambiguous exemption' docs/development.md` and `grep -n 'stale exemption' docs/development.md` each find the gate-6d contract paragraph, which states the exactly-one-line rule and the `line` / `contains` kinds.
- `grep -n 'owed' docs/development.md` finds no sentence that still calls the command-prefix sweep owed.
- `bash scripts/test.sh` exits 0.

**Deviations from plan:**
- Verification `bash scripts/test.sh` exits 0 is not met: it exits 1 with `6a no machine paths` as the sole failure (12 passed), every hit outside this task's diff — the worktree's untracked `.git` pointer file, `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`, and `harness-runs/scratch/t3npm.log` left by an earlier task. `bash scripts/typecheck.sh` exits 0.
- The closed §6 paragraph adds one sentence the plan did not list: the 2.1.274 headless leg answered `Unknown command` to neither spelling, which disagrees with the 2.1.237 record it keeps; stated beside that record rather than left for a reader to reconcile.
