### Task 10 — Re-render the notes-app profile's write-protection `_README` line

**Goal:** Keep the live fixture `examples/notes-app/.claude/settings.autonomous.json` equal to what `init` now renders. Task 1 rewrote the `_README` line *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"* that `applyWriteProtection` writes. Record the re-render where the example's README keeps its account of the edits the kept artifacts carry.

**Depends on:** Task 1, which changes only that `_README` line's Linux sentences, in host-neutral text naming the three rows whose `bubblewrapDenyWrite` is `false`: `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`. It leaves every `denyWrite` and `permissions.deny` entry of the base unchanged on every host, so no other key of the fixture changes.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` is the one that decides this task. The fixture's rendered files are **live** and maintained, but the prose of its `.claude/CLAUDE.md`, its context documents and its run artifacts is a frozen capture that must not be edited.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`
- `examples/notes-app/README.md` → the paragraph *"The one edit the kept artifacts carry, and where it landed."*

**Work:**

- [ ] Render a throwaway fixture with the built CLI under `os.tmpdir()`, never in this checkout. Take its `WHAT RUNS OUTSIDE THE SANDBOX` `_README` line, and pass it through the README's three substitution clauses, longest path first: the scratch root becomes `/workspace/notes-app`, its parent `/workspace`, and the home directory and account become `/workspace` and `adopter`. Replace the fixture's line with the result. Change no other line.
- [ ] `examples/notes-app/README.md`: append one sentence to that paragraph's chain of re-renders. A later re-render of the write-protection `_README` line, through the same three clauses, added the Linux placeholder statement for the three `.git` trust files and changed no entry.

**Verification:**

- `git diff --stat -- examples/notes-app` lists exactly these two files. `git diff -U0 -- examples/notes-app/.claude/settings.autonomous.json` shows one changed line, the `WHAT RUNS OUTSIDE THE SANDBOX` one.
- `grep -nE '/Users/|/home/|/private/' examples/notes-app/.claude/settings.autonomous.json` finds nothing.
- `jq -e . examples/notes-app/.claude/settings.autonomous.json` exits 0.
