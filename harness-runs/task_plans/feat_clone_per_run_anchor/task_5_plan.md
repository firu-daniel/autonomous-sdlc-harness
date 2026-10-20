### Task 5 — Say "run copy" in the `cli/templates/claude/` profile templates' `_README` prose

**Goal:** Move the generated permission profile's explanatory `_README` prose to the words **run copy** wherever it means the run's own copy, so an adopter reading the profile is not told a run copy is necessarily a linked worktree. No rule, glob, token or heading changes.

**The wording rule, restated from the story index's `## Context` so this file stands alone.** Prose that means the run's own copy says **run copy** — "the worktree's copy", "a run's worktree", "a sibling worktree" meaning another run's copy, "a fresh working copy" meaning the copy the watcher prepares — with articles fitted to the sentence ("the run copy", "a sibling run copy", "run copies"). **Keep:**

- a clause about a linked worktree as such: a worktree's record, a `.git` pointer file, `git worktree`'s own behaviour;
- every name: script names, the `{{worktreeGlob}}` token and every rule built from it, `Bash(git worktree:*)`;
- **every upper-case heading prefix up to its colon**, byte for byte. `THE CHECKOUT AND ITS SIBLING WORKTREES BOTH:` keeps its words; only the sentences after the colon move.

### Targets

- `cli/templates/claude/settings.autonomous.json` — the `_README` lines beginning `THE CHECKOUT AND ITS SIBLING WORKTREES BOTH`, `EVERY WRAPPER IN`, `THE OUTER-LOOP SCRIPTS AN AGENT RUNS`, `THREE COMMANDS RUN OUTSIDE THE SANDBOX` and `TWO RESIDUALS`.
- `cli/templates/claude/settings.autonomous.qa.json` — the `_README` sentence *"A fresh working copy has no local settings file"*.

These two files are what this branch changes in `cli/templates/claude/`. `CLAUDE.md` and `harness-task-offer.md` stay as they are: the scope register's rows 56 and 57 record why.

**Where this task stops.** The worked example's rendered copy of these lines is **Task 19's**, which renders the expected text from this template rather than retyping it. The anchor's own `_README` line is appended in code by **Task 1**, not written here.

**Work:**

- [ ] **Check for readers of each sentence first.** For each `_README` line you will change, `grep -rn` its distinctive phrase across `cli/src` and `cli/test`. A case that matches a sentence you are changing is updated in this same task, to the new wording, and named in the deviation notes. A source module matching one is a stop: report it as a blocker, because the line would be a wire rather than prose.
- [ ] **`settings.autonomous.json`.** In the five lines named above, apply the rule:
  - "A run in a second working copy that matches neither" becomes "A run copy that matches neither";
  - "its sibling-worktree twin" becomes "its sibling run-copy twin";
  - "the worktree's copy is not: a run's worktree is sandbox-writable, the only spelling a profile has for a sibling worktree is a glob" becomes the same sentence about a run copy;
  - in `TWO RESIDUALS`, "the worktree's hooks directory, MCP wiring, settings files" becomes "the run copy's …". The `.git` pointer, the worktree records and the files in them keep their words.

  Change nothing outside `_README`, and keep every `{{…}}` token where it stands.
- [ ] **`settings.autonomous.qa.json`.** "A fresh working copy has no local settings file" becomes "A fresh run copy has no local settings file". Nothing else in the file changes.
- [ ] **Gloss the term once, and keep both files valid.** At the first use of "run copy" in each file's `_README`, gloss it as *"a run copy — the working copy the watcher prepares for one run"*, because an adopter arrives knowing "worktree" and not this term (`harness-runs/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with"*). Keep both files valid JSON whose token set is unchanged.

**Verification:**

- `jq -e . cli/templates/claude/settings.autonomous.json > /dev/null` and the same for `settings.autonomous.qa.json` exit 0.
- `git diff cli/templates/claude/` touches `_README` strings only, and every `{{…}}` token count is unchanged: `grep -o '{{[A-Za-z]*}}' cli/templates/claude/settings.autonomous.json | sort | uniq -c` gives the same output before and after.
- `bash scripts/typecheck.sh` exits 0. If the first Work bullet edited a test file, run that file with `npm test --workspace cli -- test/<name>.test.mjs` from the repository root as one plain foreground command, and read its `# fail` count and exit status: `# fail 0`.

- **Deviations from plan:**
  - Reader check (`grep -rn -F` over `cli/src` and `cli/test` per changed phrase): `cli/test/profile.test.mjs` → test *"every wrapper that was written is allow-listed for this checkout and for a sibling worktree"* carried "a second working copy that matches neither" in a code comment; updated to "a run copy that matches neither". It asserts nothing on the `_README`. `cli/src/generators/writeProtection.ts` matched "worktree's hooks directory" in its own `appendReadme` sentence (`WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN…`): that is a separate, code-generated `_README` line, not a reader of the template sentence, so it is not a wire and not a stop; left unchanged as outside this task's template targets.
  - `THREE COMMANDS RUN OUTSIDE THE SANDBOX`: besides the listed sentence, "The repo-relative and sibling-worktree spellings" also meant other runs' copies and became "sibling run-copy spellings". "a linked worktree's record" and "a worktree it lists" kept (linked worktree as such).
  - `TWO RESIDUALS`: reworded to "the run copy's hooks directory, MCP wiring and settings files, a linked worktree's `.git` pointer, the worktree records and the files in them, and the run copy's `docs-search-server.sh` and its library", so the `.git` pointer stays a worktree clause.
  - `THE OUTER-LOOP SCRIPTS AN AGENT RUNS`: no change — its only worktree mention, "the worktree tooling", names the worktree scripts, a kept name.
  - The gloss uses " - " rather than an em dash, matching the dash style of every `_README` line in both files.
  - Verification: `jq -e .` exits 0 for both files; the `{{…}}` `uniq -c` output is identical before and after for both; `git diff --word-diff` touches `_README` strings only; `bash scripts/typecheck.sh` → `PASS: typecheck`, exit 0; `npm test --workspace cli -- test/profile.test.mjs` → `# fail 0`, exit 0.
