### Task 4 — Phase G's run step cites the reused verdict, and `test-fix-plan-writer` reads a round that ran only part of the suite

**Goal:** Make two plugin contracts true again after this branch. First, `### G.1 Run the gates` says that the run form, and the launcher's `pending`, may stand for a run of the label that already finished on this commit. Second, `test-fix-plan-writer` knows that a round's log may cover only the part of the suite the round ran, and reads it accordingly.

**Depends on:** Task 1. Its `<scripts_dir>/run-test-suite.sh` header paragraph opening `ONE RUN PER LABEL.` owns the reuse rule: a run of the label that finished on the commit HEAD still names, with the tree clean outside `<state_dir>` at its start, its finish and now, is collected rather than run again. Both forms do this — the run form prints that verdict at once, and the `--no-detach` form the launcher runs rewrites the finished `.verdict` in place with a current mtime and prints it, so the launcher's `started()` test answers `pending` and the next `--wait` reads that verdict. This task **cites** that paragraph and never restates its definition (the lessons ledger, *"State a new behaviour once, in the section that decides it, and cite it from everywhere else"*). The partial-round lines come from this repository's own `scripts/run-gates.sh` (Task 9), which the plugin must never quote: an adopter's `commands.test` prints its own, so the rule below is written generically.

### Targets

- `plugin/instructions/plan_orchestration_instructions_core.md` — `### G.1 Run the gates`, step 2 only.
- `plugin/agents/test-fix-plan-writer.md` — `## Process` step 2 only.

**Work:**

- [ ] `plan_orchestration_instructions_core.md` → `### G.1` step 2, the launcher's `pending` bullet (*"the round's gates started, or were already in flight, under the launcher's own sandbox"*): add "or had already finished on this commit", nothing more.
- [ ] Same step, the run-form paragraph's sentence *"Where a run of this label is already in flight because an earlier session issued it — … — it starts nothing and answers `pending` or that run's verdict."*: extend it so that a run of this label that **already finished** on the commit this checkout is at, with nothing it reads changed since, is likewise answered with its verdict and never run again, citing `<scripts_dir>/run-test-suite.sh` → the header comment opening `ONE RUN PER LABEL` in the citation form the same section already uses for `THE LOG IS VERSIONED PER ROUND`. Leave **This session issues the launcher, or the run form, once per label** and every later sentence of G.1 unchanged.
- [ ] `test-fix-plan-writer.md` → `## Process` step 2 (*"Classify each failure against the earlier logs"*): add one rule, generically worded. Where the log says its round ran only part of a gate — what failed in an earlier round — and names what it ran, those are this round's only results: classify only them, and never read a failure an earlier log shows that this round did not run as fixed or as persisting. Do not touch the step-1 marker block; the marker lines are unchanged.
- [ ] Re-derive the readers of every phrase you changed with `grep -rn 'already in flight' plugin/` and `grep -rn 'Classify each failure against the earlier logs' plugin/`, and confirm no other file quotes the changed text verbatim (`.claude/context/conventions.md` → *"The plugin corpus quotes its own literal wire strings across files"*).

**Verification:**

- `git diff -- plugin/` shows edits only inside `### G.1` step 2 and `## Process` step 2, and adds no line naming `run-gates.sh`, `gates.tsv` or any other file or literal of this repository (`.claude/context/plugin.md` → *"No adopter's value is ever a literal here"*).
- `grep -n 'ONE RUN PER LABEL' plugin/instructions/plan_orchestration_instructions_core.md` shows the new citation, and the cited phrase matches the template's header byte-for-byte (`grep -n 'ONE RUN PER LABEL' cli/templates/scripts/run-test-suite.sh`).
- `test-fix-plan-writer.md`'s up-front word count grows only by the one rule (`.claude/context/plugin.md` → *"An agent's growth is paid for by behaviour"*).
