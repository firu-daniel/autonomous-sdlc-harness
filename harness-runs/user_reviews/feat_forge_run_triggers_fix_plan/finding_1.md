### 1. A command for one branch adopts every GitHub-started run, creating working copies and running each branch's bootstrap on this machine

**Files:**
- `cli/templates/scripts/remote-run.sh`: `verb_adopt`, `adopt_one` ("bash \"$script_dir/create-worktree.sh\" --existing \"$b\""), `adopt_fail`, the `adopt_list` flag parsing, `usage`; the header's verb list line "remote-run.sh adopt [--list] [--repo <root>]", the paragraph "`adopt` MAKES A RUN STARTED ON GITHUB LOCAL", the exit-map clauses naming `adopt`, and the `WHAT IT NEVER DOES` clause "for `adopt`, per candidate the mirror `create-worktree.sh --existing` makes"
- `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_remote_record_init`'s comment: "watcher's `launch_remote_run` and `remote-run.sh adopt`")
- `cli/templates/scripts/autonomous-watcher.sh`: the registry field list entries "launch_remote_run wrote, or one `remote-run.sh adopt`", "always empty on a record remote-run.sh adopt wrote", "remote_adopted_at"
- `cli/test/remote-adopt.test.mjs`
- `docs/github-issue-trigger.md`: the lead "**Who reads this:**" ("`start` and `adopt`"), the code-of-record sentence ("the header's `start`, `adopt` and `trigger` paragraphs"), "Scripts written before this release have no `trigger`, `start` or `adopt` verb", and `## 4. What the labeller vouches for` → "**Adopting a run executes its branch on your machine.**"
- `docs/remote-execution.md` → "**What each local command does for a remote run.**" (verify only; Finding 3 rewrites it)
- `docs/watcher.md`, the `remote-run.sh` row ("and `adopt`, which makes a run started on GitHub local")
- `docs/development.md` → Gate 12 observation (xiii), "**(c) A local maintainer's command adopts the run.**"

**Depends on:** Finding 3, which already removes the adopt step from the four commands and gives them a direct GitHub route, and Finding 2, which replaces `adopt --list` in `branch-status` with `list`.

**Problem.** Verified in the current tree. `verb_adopt` takes **every** branch whose newest run is titled `harness run <branch>`, has no registry record, is unprotected and is live on origin. For each one, `adopt_one` runs `create-worktree.sh --existing "$b"`, which bootstraps: it runs that branch's own `setup-worktree.sh`, `commands.depInstall` and `commands.build` on this machine. It then writes a registry record and syncs. `branch-answer`, `branch-pause`, `branch-resume` and `branch-user-review` each run `remote-run.sh adopt` with no branch before they act ("**Runs started on GitHub are adopted first.**"). So a command aimed at one branch creates working copies and records for other branches and runs their code. The code review's Finding 2 disclosed the bootstrap (`docs/github-issue-trigger.md` → `## 4.`) but did not remove it.

**Decision the review left open: is a local record still needed after observation 3?** No. After Findings 2 and 3:
- `branch-status` reads a run with no record from GitHub (`status <branch>`, `list`);
- the four acting commands take a run with no record through `remote-run.sh fetch` plus a direct dispatch, or `review` for the user review;
- `review` makes its own `create-worktree.sh --existing --no-bootstrap` copy for the one branch it names and removes it.

No command reads a record for a run started on GitHub, so nothing calls `adopt`. A per-branch `adopt <branch>` would be a second, unused route to the same state. This finding therefore **removes the `adopt` verb** rather than scoping it. A record written by an earlier release's `adopt` stays an ordinary remote record, and nothing reads `remote_adopted_at`.

**Fix.**

- [ ] **Confirm the call sites are gone.** `grep -n 'adopt' plugin/commands/branch-answer.md plugin/commands/branch-pause.md plugin/commands/branch-resume.md plugin/commands/branch-user-review.md plugin/commands/branch-status.md` should find no use of the verb. Finding 3 and Finding 2 removed them. Remove any that remain, including in each `## Resolved values` `<scripts_dir>` row and closing scope fence.
- [ ] **Remove the verb from `remote-run.sh`.** Delete:
  - `verb_adopt`, `adopt_one`, `adopt_fail` and `adopt_failed`;
  - the `adopt` and `--list` option parsing (`adopt_list`) and the `adopt) verb_adopt ;;` dispatch arm;
  - `adopt` from `usage`.

  Before deleting, move the candidate filter Finding 2 shared with `list` fully into `list`'s side. `adopt` is then an unknown verb (exit 1, as any unknown verb is). In the header:
  - delete the "`adopt` MAKES A RUN STARTED ON GITHUB LOCAL" paragraph and the verb-list line;
  - drop `adopt` from the exit-map clauses (2: "sending verbs and adopt"; 0: "for adopt: …; for adopt --list: printed"; 3: "For adopt (and --list) …"; 4: "adopt: at least one candidate was not adopted …");
  - drop it from the `WHAT IT NEVER DOES` writes list and from the line "`pause-requested`, `run-created-at` and `adopt --list` write nothing";
  - in the `start` paragraph, change "a local record for such a run is `adopt`'s" to "such a run needs no local record: the local commands act on it through GitHub".
- [ ] **Library and watcher comments.** In `hr_remote_record_init`'s comment, its writer is the watcher's `launch_remote_run` alone. In `autonomous-watcher.sh`'s registry field list, drop the two "`remote-run.sh adopt` wrote" clauses and the `remote_adopted_at` entry.
- [ ] **Tests.** Delete `cli/test/remote-adopt.test.mjs`. Its `--list` case moved to `list` in Finding 2. Its other cases test behaviour that no longer exists. Add one case to `cli/test/remote-run.test.mjs`: `adopt` exits 1 as an unknown verb, writes no registry and calls no gh. That pins that no command can create copies or records for other branches through it. Grep `cli/test/` for `'adopt'` as a verb argument and remove any other use, for example in `remote-start.test.mjs` or `remote-trigger.test.mjs` if one drives it.
- [ ] **Documents — state what remains of the bootstrap disclosure.**
  - `docs/github-issue-trigger.md` → `## 4.`: replace the bullet "**Adopting a run executes its branch on your machine.**" and its fenced `branch-status` block with one bullet. **Working a run from your machine runs none of its code.** The local commands act on a run started on GitHub through GitHub: `/autonomous-sdlc-harness:branch-status` reads it, the other four dispatch to it. None of them creates a working copy for any branch but the one it names. The one copy made, by `/autonomous-sdlc-harness:branch-user-review` to commit the review, is created with `create-worktree.sh --existing --no-bootstrap`: it runs no `setup-worktree.sh`, `commands.depInstall` or `commands.build`, and it is removed once the review is pushed. Running the branch's code locally is a deliberate step of your own, such as checking the branch out, and the labeller's vouching (above) is what you rely on then.
  - Same file: the lead "**Who reads this:**" (`start` and `adopt` → `start`), the code-of-record sentence (the header's `start` and `trigger` paragraphs), and "Scripts written before this release have no `trigger`, `start` or `adopt` verb" → "no `trigger` or `start` verb". `## 5.` is Finding 3's.
  - `docs/remote-execution.md` → "**What each local command does for a remote run.**": confirm Finding 3's rewrite left no adopt or bootstrap sentence (the "Before that sync, … each run `remote-run.sh adopt` once" text and the citation of the removed header paragraph). Remove any that remain.
  - `docs/watcher.md`, the `remote-run.sh` row: drop "and `adopt`, which makes a run started on GitHub local and runs only on a command's request". Add `fetch`, `review` and `list` to the local verbs it names.
  - `docs/development.md` → Gate 12 (xiii)(c): retitle it "A local maintainer's command acts on the run". The steps become `/autonomous-sdlc-harness:branch-status <slug>` then `/autonomous-sdlc-harness:branch-pause <slug>`, each in its own fenced block. It passes when status prints the run's state from GitHub with no local record, the pause dispatch produces a `harness pause <slug>` run the job finds, and no registry record, no sibling working copy and no `deps.marker` appear on the machine. The recorded items become the status output, the pause output and the job-log line where the pause was found.
