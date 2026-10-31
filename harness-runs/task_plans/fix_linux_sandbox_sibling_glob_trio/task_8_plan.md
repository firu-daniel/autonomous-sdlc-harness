### Task 8 — Add the 2026-10-30 glob finding to the upstream report

**Goal:** Bring the draft upstream report up to the 2026-10-30 measurement before the maintainer files it on anthropics/claude-code. That measurement adds two things:

- A `denyWrite` entry containing `*` is expanded on Linux, and mounts placeholders at absent paths exactly as an exact entry does.
- `config.worktree` appeared again at session start, as a `-rw-r--r--` real file, when **only** a glob entry named it.

Ask 3 is still open, and the re-take on this branch's head is the control that will tell whether the profile plays any part.

**Depends on:**

- **Task 6**, which records these facts in `docs/sandbox-verification.md`: §5 AP2's 2026-10-30 reading on Claude Code 2.1.314 and bubblewrap 0.8.0, and the owed re-take AP1–AP6.
- **Task 7**, which restates the interim position in `docs/cli.md` §6 residual 12, the one statement this report's last section summarises. On a bubblewrap host the run copy's trio is named by no `denyWrite` entry, exact or glob, and the base's glob entries for it are re-rooted at every other sibling by exact path.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` applies: what was measured, the command and the exact message.

### Targets

- `docs/sandbox-placeholder-upstream-report.md`:
  - `### Environment`;
  - `### Two placeholders persist on the real filesystem`, item 1;
  - `### How to reproduce`;
  - `### Asks`, item 3;
  - `## The harness's interim position`.

**Work:**

- [ ] **`### Environment` and item 1.** Add the 2026-10-30 re-take: Claude Code 2.1.314, bubblewrap 0.8.0, the same container shape.
  - Its per-run profile named the clone's trio by no exact entry, only by `<home>/autonomous-sdlc-harness-*/.git/commondir` and its two siblings.
  - Inside the sandbox, `commondir` and `http-alternates` read `character special file … mount: /null (tmpfs, ro,nosuid,nodev)`, and were left on disk after a killed session.
  - `config.worktree` was again a `-rw-r--r--` empty file from session A's start, with the mtime AP2 quotes.

  Quote AP2's readings verbatim from `docs/sandbox-verification.md` §5, using `<clone>` and `<main>` as that row does.
- [ ] **A new short subsection after `### What a \`denyWrite\` entry for an absent path does inside a call`**, titled `### A glob entry does the same`. A `denyWrite` entry containing `*` is expanded against the directories that exist when the sandbox starts, and each absent path it yields gets the same placeholder. Cite GW2 (2026-10-29) and AP2 (2026-10-30). Add GW1: a new file under an existing directory the glob matched was written.
- [ ] **`### Asks`, item 3:** *"at a denied `.git/config.worktree`"* becomes *"at a `.git/config.worktree` a `denyWrite` entry names, exact or glob"*. Add that a control run with no entry naming it is owed on the harness side.
  - **`### How to reproduce`:** the script now also reads a sibling clone (`SIB`) and records every glob's absent expansions.
  - **`## The harness's interim position`:** the one-line summary also says that, on Linux, the run copy's trio is named by no `denyWrite` entry, exact or glob.

**Verification:**

- `grep -n '2.1.314' docs/sandbox-placeholder-upstream-report.md` finds the Environment addition, and every quoted reading there is a substring of `docs/sandbox-verification.md` §5 AP2's Observed cell.
- `grep -n 'at a denied `.git/config.worktree`' docs/sandbox-placeholder-upstream-report.md` prints nothing.
