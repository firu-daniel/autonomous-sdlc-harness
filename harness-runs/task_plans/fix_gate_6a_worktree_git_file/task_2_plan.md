### Task 2 — Quote the new 6a command in `docs/development.md` gate 6 and state the exclusion in one clause

**Goal:** Make `docs/development.md` → `## 5. Verifying a change` → **Gate 6 — self-containment.** quote the command `scripts/run-gates.sh` now runs as 6a, and state the worktree-pointer exclusion in one clause beside the existing exclusions — the prompt's third deliverable.

**Depends on:** Task 1, which defines gate 6a in `scripts/run-gates.sh` as the function `machine_path_hits`, whose body is this single line:

```
grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git | grep -v '^\./\.git:[0-9][0-9]*:'
```

This task quotes that line byte-for-byte; if Task 1's landed line differs from the one above, quote the landed line and say so in the return. It edits nothing in the script.

**Where this task stops.** Only the gate-6 fenced block's first line and one clause of the prose around it. It does **not** rewrite the paragraph opening *"The `$HOME` half is a different matter, and self-adoption breaches it."* or the list under it, although planning measured them stale (story index `## Context`): the prompt asks this branch to report that, and leaves the rewrite and any exclusion for the profile to a separate decision. It does not touch the fifth-command (6e) paragraph or any other gate's material.

### Targets

- `docs/development.md` — `## 5. Verifying a change` → **Gate 6 — self-containment.**: the first line of its fenced block, and the paragraph beneath the block that begins *"Those two must print nothing"* (or the one after it, beginning *"`$HOME` is inside double quotes"*, whichever reads better — one clause, in one of them).

**Work:**

- [ ] In the fenced block under **Gate 6 — self-containment.**, replace the first line, `grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist`, with Task 1's line quoted above, byte-for-byte and on one line. The block keeps one command per line (the lessons ledger's rule for a command a reader is meant to run); the `find` line under it is unchanged. The old line also lacked `--exclude-dir=.git`, so this edit brings the hand-run form back in step with the script as well.
- [ ] Add **one clause** beside the existing exclusions stating what the second stage is for: in a linked worktree `.git` is a one-line `gitdir:` pointer **file** that `--exclude-dir=.git` does not skip, and the anchored `grep -v` drops that file's line and nothing else — a nested `.git` file, or a file that quotes a `gitdir:` line, is still printed. If the clause also has to say why a pipe is acceptable against §5's opening *"Run each **without a pipe**"* rule, fold that into the same clause: this gate is read from its output, never its exit status (which the existing sentence *"this is the one gate read from its **output**"* already establishes). Write `<main checkout>` for any illustrative path — never the home prefix.
- [ ] Carry no measured figure, date or count into the clause: the planted-file measurements are Task 1's return, not this document's.

**Verification:**

- `git grep -nF -e 'grep -rn "$HOME"' -- docs/development.md scripts/run-gates.sh` prints a line from each of the two files, and the text after the path-and-line prefix is identical across every line it prints apart from the script line's leading indentation — the quoted command and the running command cannot drift.
- `git diff docs/development.md` touches only the gate-6 fenced block's first line and the one sentence carrying the new clause; the paragraph opening *"The `$HOME` half is a different matter"* is byte-identical.
- `git grep -nF "$HOME" -- docs/development.md` prints nothing (the literal string `"$HOME"` in the quoted command is not the expanded value, so it does not match).
- `bash scripts/run-gates.sh` shows no gate changing status because of this edit (gate 6c and 6d read documents; both must report as they did before this task).
