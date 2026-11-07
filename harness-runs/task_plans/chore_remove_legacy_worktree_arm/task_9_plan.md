### Task 9 — `docs/sandbox-verification.md`, `docs/development.md` and `docs/outer-loop-verification.md`: close CS5 and re-target the worktree rows at a hand-made worktree

**Goal:** the measurement records stop owing a measurement of a layout that no longer ships — CS5 is closed with its reason — while every other worktree row stays owed or keeps its recorded result, re-targeted at a linked worktree a person made by hand with `git worktree add`.

**Depends on:** Tasks 1, 2 and 4, restated: the watcher no longer resumes a record with no `copy_kind` (it skips it with one line) and renders no `worktree`-kind per-run profile; the sweep has no worktree arm and skips such a record; the run-copy check refuses a linked worktree; the wrappers still accept a linked worktree a person made by hand. So a "legacy worktree run, resumed by the watcher" can no longer be set up, while a hand-made linked worktree driving the main checkout's wrappers can.

**How this task's implementer reads the conventions.** Catch-all layer: read every `layers[].conventions` document. `.claude/context/conventions.md` → `## Documents of record`: a measured cell is history — never rewrite an Observed cell, a date or a quoted message; only a Check's wording, a Verdict that the clarification closes, and the section notes change.

### Targets

- `docs/sandbox-verification.md`
- `docs/development.md`
- `docs/outer-loop-verification.md`

**Work:**

- [ ] `docs/sandbox-verification.md` §2 → `### The clone layout (owed)`, row CS5: the Verdict becomes closed, and the Observed cell (which holds no measurement) states the reason — CS5 measures a legacy worktree run, a record with no `copy_kind` resumed by the watcher under a `worktree`-kind per-run profile, and that run arm no longer ships (`chore_remove_legacy_worktree_arm`); the watcher now skips such a record. Leave its Check as the record of what it would have measured, its **Manual setup required** 3 citation included.
- [ ] Same file, §2's G-rows and §3's and §4's worktree rows — G1, G4, G7, CW1, CW2's worktree form, the `config.worktree` arms of C2, K2 and CW4, WR2, WR3 and WR4: they stay `not run — owed` or keep their recorded result. Under each of the §2, §3 and §4 tables (or once in each section's lead), add one sentence: these rows' worktree is a linked worktree a person made by hand with `git worktree add`, which the wrappers still accept, never a run copy or a legacy run, and the owed ones are tracked in #275 §7a. Where any of those rows' **Check** names a legacy run, a watcher-resumed record or a `worktree`-kind per-run profile, reword the Check to the hand-made worktree; find them with `grep -n -E '^\| (CW1|CW2|CW4|C2|K2|G1|G4|G7|WR2|WR3|WR4) ' docs/sandbox-verification.md` and read each Check cell.
- [ ] `docs/development.md` → the paragraph opening *"The rows this probe does not take, named so the list is complete."*: the sentence naming **CS5** as the one clone-layout hand row becomes a statement that CS5 is closed (the legacy worktree run it measured no longer ships), and that no clone-layout row stays a hand row — check the surrounding sentences so the paragraph's list stays complete.
- [ ] `docs/outer-loop-verification.md` → **Owed a re-drive on the clone layout.**: the sentence *"…and a record with no `copy_kind` — a legacy worktree — through the existing arm."* becomes: a record with no `copy_kind` is skipped with one line, its copy left in place. *"After a copy is removed, on either arm"* becomes after the clone is removed, and *"asserts both arms"* names what `cli/test/cleanup-run-copies.test.mjs` asserts now — the clone arm, the no-`copy_kind` skip, the dry run and the profile removal. In the same file's opening paragraph (*"These are the only shipped assets that mutate a repository — `git commit`, `git push`, `git worktree remove`, `git branch -D`, `kill` — …"*), drop `git worktree remove` from the list: once Task 4 removes the sweep's worktree arm, no shipped asset runs it (a parenthetical that it did until `chore_remove_legacy_worktree_arm` is optional). The rows' own dated cells stay.

**Verification:**

- `grep -n -E '^\| CS5 ' docs/sandbox-verification.md` shows a closed verdict carrying its reason, and the CS5 Check cell unchanged.
- `grep -n -E '^\| (CW1|CW2|CW4|C2|K2|G1|G4|G7|WR2|WR3|WR4) ' docs/sandbox-verification.md`: each row's Verdict is what it was before this task, and no Check names a legacy run or a watcher-resumed record.
- `git diff -- docs/sandbox-verification.md` changes no Observed cell other than CS5's, and no date.
- `git grep -n -i -E 'legacy (linked )?worktree|worktree run' -- docs/development.md docs/outer-loop-verification.md` prints no line describing a shipped arm.
- `grep -n 'worktree remove' docs/outer-loop-verification.md` prints no line saying a shipped asset runs it.
