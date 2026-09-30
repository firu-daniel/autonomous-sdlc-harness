### Task 23 — Update the `forge` row, the roadmap debt, `ROADMAP.md` and `README.md`

**Goal:** Restate `forge`'s status in the four adopter- and contributor-facing places that record it (scope register rows 8, 9, 10, 12 and 51). Each says in the present tense that nothing reads the key, or that the trigger half is open. After this branch:

- `forge` has a reader and a reporter;
- the issue trigger has shipped;
- the coupling's remaining parts are named: draft-pull-request output and comment-based park-and-ask, with pull-request and comment control, all `feat_forge_run_control`'s.

This is the prompt's acceptance 7, *"its row says which parts of the coupling remain"*.

**Depends on:**

- Task 13 (the reader in `init`), Task 14 (the reporter) and Task 7 (the run-time reader).
- Task 20, whose `docs/github-issue-trigger.md` these entries link to.

**Where this task stops.** `ARCHITECTURE.md` and the schema are Task 19's, and the Gate 12 observation in `docs/development.md` → `## 5.` is Task 24's. That second task edits the same file after this one. `design.source`'s paragraph in `## 6.` is untouched (scope register row 13). No numbered roadmap row is added: the forge coupling has never had a number, and the existing paragraph already cites it by name, which is the resolution that paragraph records.

### Targets

- `docs/config.md` — `## 5. Key reference`, the `forge` row.
- `docs/development.md` — `## 6. The roadmap this tree defers to`, the paragraph *"The second was **the reader for the `forge` configuration key**"*.
- `ROADMAP.md` — the *Cloud / CI execution* row.
- `README.md` — the *Forge-agnostic* bullet and `## Where to read more`.

**Work:**

- [ ] **`docs/config.md` → the `forge` row.** Keep the type column, the no-default dash and the reason there is no default. Replace *"**Nothing reads this key in this release**"* and the rest of the reader clause with:
  - `github`, with `execution.target` `github-actions`, makes `init` write `.github/workflows/harness-trigger.yml`, whose job starts a task run from a labelled issue. The trigger re-reads the key at run time and refuses when it no longer says `github` (`docs/github-issue-trigger.md`);
  - `gitlab` writes nothing in this release, and `none` records that there is no forge integration;
  - `doctor`'s `forge` check reports every state, including *not set*;
  - **still waiting**: draft-pull-request output and comment-based park-and-ask, the rest of the forge coupling.
- [ ] **`docs/development.md` → `## 6.`**, the paragraph beginning *"The second was **the reader for the `forge` configuration key**"*. Keep its history: item 6 was never the reader, and the coupling has no row and no number. Replace its standing-debt ending (*"so the debt stands … Giving it a reporter is part of the coupling's work, not a separate debt"*) with the present state:
  - the coupling's first part, the issue-label trigger, has landed with a reader and a reporter (`doctor` → `forge`);
  - the *decision not yet made* is now named by that check;
  - the debt that remains is the coupling's other two parts, draft-pull-request output and comment-based park-and-ask. They carry no reader because nothing implements them, and `docs/config.md`'s row names them.
- [ ] **`ROADMAP.md` → *Cloud / CI execution***. After the execution-half sentence, the **Still open:** clause becomes two sentences:
  - **The issue trigger has shipped**: labelling an issue starts a task run with nothing local taking part, gated on `forge` `github` ([`docs/github-issue-trigger.md`](docs/github-issue-trigger.md)).
  - **Still open**: starting and steering a run from pull requests and comments, and draft-PR output, which is the branch `feat_forge_run_control`; and other trackers beyond the documented `repository_dispatch` route.

  Keep whatever the row says after that clause, and keep its *Status* cell's value unless it claims the trigger is open.
- [ ] **`README.md`**:
  - The *Forge-agnostic, which means the last step is yours.* bullet keeps its point that the flow ends at a pushed branch and opens no pull request. Its sentence *"A `forge` key … is declared, but nothing reads it in this release"* becomes: the key is read only for the issue trigger, when it is `github` and runs execute on GitHub Actions, and `doctor` reports it. Its closing sentence about the configuration check stays true and is kept.
  - `## Where to read more` gains an entry after `docs/remote-execution.md`'s: [`docs/github-issue-trigger.md`](docs/github-issue-trigger.md) — starting a run by labelling a GitHub issue: turning it on, the branch name, who may start a run, what the labeller vouches for, and working the run locally or from GitHub.

**Verification:**

- `git grep -n -i -E "nothing reads (this key|it) in this release" -- docs/config.md README.md` finds only `design.source` text, which this branch leaves untouched (scope register row 13): the `design.source` row of `docs/config.md` → `## 5. Key reference`, and `README.md`'s *Design→code generation is out of scope.* bullet. No hit sits in the `forge` row or in the *Forge-agnostic* bullet.
- `git grep -n "Still open" -- ROADMAP.md` shows the row naming `feat_forge_run_control` and no longer naming `feat_forge_run_triggers` as open.
- Every link added resolves: `git ls-files docs/github-issue-trigger.md` lists the file.

**Deviations from plan:**

- `ROADMAP.md`: the row's trailing *"Seam declared (`forge`): nothing reads it yet."* was dropped rather than kept, because it contradicts the shipped reader; *"a remote run still ends at a pushed branch"* was kept as its own sentence.
- `docs/config.md`: the plan's *"`none` records that there is no forge integration"* clause was not added, because the row's kept opening sentence already states it.
- `docs/development.md`: `github-issue-trigger.md` is cited as a backticked path, not a Markdown link, matching that file's citation style (it carries no Markdown links).
