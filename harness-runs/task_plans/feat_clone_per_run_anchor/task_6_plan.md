### Task 6 — Say "run copy" in the `repo/` README and the state-directory contract READMEs and ledger template

**Goal:** Move the adopter-facing contract READMEs that `init` writes into an adopter's state directory, and the `repo/` template README, to the words **run copy** wherever they mean the run's own copy. Every one of these files is written `create-if-absent` (`cli/src/core/writer.ts` → *"The `stateDir` tree and its per-directory READMEs"*), so the change reaches new adoptions and never rewrites an adopter's edited copy.

**The wording rule, restated from the story index's `## Context`.** Prose that means the run's own copy says **run copy**: "a fresh working copy", "that branch's existing working copy", "the working copy" a run's files go with, "whichever sibling working copy a run executes in", "a second working copy" a run executes in. Articles follow the sentence ("the run copy", "a fresh run copy", "run copies"). **Keep:** every script name (`cleanup-merged-worktrees.sh`), every `<…>` placeholder, every heading, and "working copy" where it means any checkout, a person's included.

### Targets

- `cli/templates/repo/README.md` — *"what the browser half of a run leaves in the working copy"*.
- `cli/templates/state-dir/autonomous_inbox/README.md` — the three working-copy phrases in its opening paragraph.
- `cli/templates/state-dir/autonomous_logs/README.md` — *"whichever sibling working copy a run actually executes in"*.
- `cli/templates/state-dir/clarification_digests/README.md` — *"go with the working copy"* and *"a working copy removed once its branch has merged"*.
- `cli/templates/state-dir/clarifications/README.md` — *"in the same working copy"* and *"What survives the working copy"*.
- `cli/templates/state-dir/flow_progress/README.md` — *"a different working copy from the one that wrote it"*.
- `cli/templates/state-dir/improvement_observations/README.md` — the worked example's heading *"gated in a sibling working copy"*.
- `cli/templates/state-dir/lessons.md` — **What this is.**'s *"a run in a second working copy"*.

**Not targets, deliberately:** `cli/templates/repo/gitignore` and `gitignore.qa`. They are written `merge-lines`, so a reworded comment line would be appended beside the old one in every existing adopter's `.gitignore` (scope register rows 58 and 59). `cli/templates/scripts/README.md` names the worktree wrappers by their script names, which stay (row 61).

**Where this task stops.** This repository's own `harness-runs/*/README.md` and `harness-runs/lessons.md` are its adoption output and its live ledger, and are not edited. The worked example omits the state-directory READMEs (`examples/notes-app/README.md` → *"What was kept and what was omitted"*), so it owes nothing here.

**Work:**

- [ ] **Check for readers first.** For each sentence you will change, `grep -rn` its distinctive phrase across `cli/src` and `cli/test`. Update any test that matches it to the new wording in this task, and name it in the deviation notes. A source module matching one is a stop: report it as a blocker.
- [ ] **The state-directory READMEs.** Apply the rule to the phrases listed under `### Targets`, one sentence at a time, changing no other word. At the first use of "run copy" in each file, gloss it as *"a run copy — the working copy the watcher prepares for one run"* (`harness-runs/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with"*). Each README is read alone, so each carries its own gloss.
- [ ] **`lessons.md` and `repo/README.md`.** Apply the rule to the one phrase each. `lessons.md` is a ledger **template**: its entry-shape block and its headings stay byte for byte.

**Verification:**

- `git diff --stat cli/templates/repo cli/templates/state-dir` names only files listed under `### Targets`, and `git diff cli/templates/repo/gitignore cli/templates/repo/gitignore.qa` prints nothing.
- `grep -rniE 'working cop(y|ies)' cli/templates/state-dir cli/templates/repo/README.md` prints only sentences that mean any checkout. Read each remaining hit and record it in the deviation notes.
- `bash scripts/typecheck.sh` exits 0. If the first Work bullet edited a test file, run it with `npm test --workspace cli -- test/<name>.test.mjs` from the repository root as one plain foreground command, and read its `# fail` count and exit status: `# fail 0`.
