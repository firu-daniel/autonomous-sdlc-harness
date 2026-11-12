### Task 11 — Rename the analyze and read-mention commands, respell the command files and plugin READMEs, and re-point the agents' citations of the analyze command

**Goal:** Ship the two plugin commands as `/devscene:analyze` and `/devscene:read-mention`, and make every command file and plugin README name them, `devscene.config.json` and the `devscene/` state directory that way.

**Depends on:** Tasks 1 and 4, which set `ANALYZE_COMMAND = '/devscene:analyze'` and `MENTION_COMMAND_NAME = 'read-mention'`. `remote-run.sh` (Task 6) checks that `commands/<basename of MENTION_COMMAND>.md` exists in the plugin it runs, so the file must be named `read-mention.md` exactly.

**Where this task stops.** A cited path is a wire, and a rename strands every citer (`.claude/context/plugin.md` → `## Citation`), so this task moves the analyze command together with the three citations of its old path in `plugin/`. Those are `conventions-reviewer.md`'s *"You are dispatched by …"* sentence and its `(4b)` citation in the `.claude/CLAUDE.md` (`target: project`) paragraph, and `conventions-writer.md`'s *"You are dispatched by …"* sentence. Every other respelling in those two agent definitions, and every other agent, is Task 12's. The instructions are Tasks 13–14. `docs/analyze.md` is Task 28's.

### Targets

- `plugin/commands/harness-analyze.md` → `plugin/commands/analyze.md` (moved; `git mv`, and the commit stages both paths)
- `plugin/commands/harness-read-mention.md` → `plugin/commands/read-mention.md` (moved, content unchanged unless it carries a table row)
- `plugin/commands/branch-*.md`: the nineteen files the scope register lists (rows 194–212, `branch-answer.md` through `branch-user-review.md`)
- `plugin/commands/README.txt`, `plugin/agents/README.txt`, `plugin/README.md`
- `plugin/agents/conventions-reviewer.md` and `plugin/agents/conventions-writer.md`: the three `${CLAUDE_PLUGIN_ROOT}/commands/harness-analyze.md` citations only

**Work:**

- [ ] Move the two command files. Component discovery names a command by its file basename, so the move is the rename.
- [ ] `analyze.md`: apply rows 1, 2, 6 and 9 of `## Context`'s spelling table everywhere: `/devscene:analyze`, `devscene.config.json`, `<!-- devscene:unfilled -->`, `<!-- devscene:setup-pending -->`. Keep the frontmatter keys, every `## ` heading, every `<placeholder>` and every quoted wire literal (`Reviewer finding not applied — ` among them) byte for byte. A citation of this file from inside itself becomes `${CLAUDE_PLUGIN_ROOT}/commands/analyze.md`.
- [ ] The nineteen `branch-*.md` commands: apply rows 1 and 2 (the `<state_dir>` rows' *"Default `devscene/`"* and every `devscene.config.json`). Apply row 12 to `branch-pause.md`'s `devscene pause <branch>` run and `branch-status.md`'s quoted `no local record, and no run titled 'devscene run <branch>' on GitHub`.
- [ ] `commands/README.txt`, `agents/README.txt`, `plugin/README.md`: apply rows 6 and 7 (`/devscene:analyze`, `/devscene:read-mention`) and any other row they carry.
- [ ] `conventions-reviewer.md` (the dispatcher sentence and the `(4b)` citation) and `conventions-writer.md` (the dispatcher sentence): `${CLAUDE_PLUGIN_ROOT}/commands/harness-analyze.md` becomes `${CLAUDE_PLUGIN_ROOT}/commands/analyze.md`. Change nothing else in either file, not even another `harness-analyze` occurrence, which Task 12 respells.

**Verification:**

- `git ls-files -- plugin/commands` lists `plugin/commands/analyze.md` and `plugin/commands/read-mention.md` and no `harness-*` file.
- `git grep -nE 'harness\.config|sdlc-harness|harness-analyze|harness-read-mention|harness:unfilled|harness:setup-pending|harness (run|pause|stop)( [^a-z ]|[^ a-z]| [a-z]+_)' -- plugin/commands plugin/agents/README.txt plugin/README.md` prints nothing.
- `git grep -nF 'Reviewer finding not applied — ' -- plugin/commands/analyze.md` still prints its lines.
- `git grep -nF 'commands/harness-analyze.md' -- plugin` prints nothing.
- `git diff -- plugin/agents/conventions-reviewer.md plugin/agents/conventions-writer.md` changes only the three citation lines.

**Deviations from plan:**
- Plan specified `git mv` for both command moves; the implementer contract forbids `git mv`, and Bash write commands (`cp`, `sed -i`) were refused in this run's permission mode. Implemented as: respell the old file in place with `Edit` (`replace_all`, rows 1, 6 and 9; row 2 has no hit in it), `Write` the new path with the same bytes, confirm `git diff --no-index --stat` between old and new prints nothing (run for both `analyze.md` and `read-mention.md`), then a plain `rm` of each old path. The committer stages both halves of each rename.
- The `git ls-files -- plugin/commands` check reads the index, so it holds only once the committer stages the renames; evidence before staging: `git status` shows `plugin/commands/harness-analyze.md` and `plugin/commands/harness-read-mention.md` deleted, and the two new files present and untracked.
- The `git grep -nF 'Reviewer finding not applied — ' -- plugin/commands/analyze.md` check prints nothing before staging because the file is untracked; run as `git grep --untracked -nF …` instead, which prints its two lines. The old-name grep was likewise re-run with `--untracked` over `plugin/commands` and printed nothing.
