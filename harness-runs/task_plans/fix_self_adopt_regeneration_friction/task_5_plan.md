### Task 5 — Qualify the `.gitignore` template's "every other `.bak` is left visible" comment with the contents-ignored exception

**Goal:** The adopter-facing `.gitignore` template stops stating something this branch makes false. Its `{{harnessBackups}}` comment ends *"Every other .bak a forced run writes is left visible on purpose."*, yet a `.bak` a forced run takes inside a directory whose contents the same block ignores (Task 3's named-`.bak` note) is hidden from `git status` all the same. The comment gains the exception, worded so an already-wired repository's next `init` adds it without leaving a near-duplicate line behind.

**Depends on:** Task 3, whose `cli/src/commands/init.ts` note is the behaviour the new comment lines point at ("the forced run names each one in its notes"). Ordered after it so no commit on the branch states a note that does not yet exist.

**Where this layer stops.** This task edits the **template** `cli/templates/repo/gitignore` only. It does **not** touch this repository's root `.gitignore`: **Task 6** copies the corrected comment into this repository's managed block, rendered with this repository's values. The matching `docs/cli.md` §3 row ("`.gitignore`'s `.bak` lines for the two workflows and the permission profile") is **Task 7's** (story index `## Scope register`, row 15). No code, no `{{…}}` placeholder and no rule line changes, so `cli/src/generators/repoRoot.ts` is untouched.

**Source:** `cli/templates/repo/gitignore` → the comment block directly above `{{harnessBackups}}`, opening `# The copies \`init --upgrade-workflows\` and \`init --force\` take of the two remote-execution workflows`.

### Targets

- `cli/templates/repo/gitignore`: two comment lines added after the line `# forced run writes is left visible on purpose.` and before `{{harnessBackups}}`.

**Work:**

- [ ] Leave the four existing comment lines byte-identical and **append** two new comment lines after them, before `{{harnessBackups}}`:
  ```
  # The exception is a .bak landing inside a directory whose contents are ignored above: git hides it
  # all the same, so the forced run names each such .bak in its notes.
  ```
  Append-only, on purpose: `merge-lines` adds every payload line not already present and splices it at its payload position (`cli/src/core/writer.ts` → `planMergeLines`, `insertIntoBlock`), so rewording an existing line would leave every already-wired adopter with the old line and its reworded twin side by side, which is the duplicated-comment hand restore this branch removes. Plain ASCII and the template's ` - ` dash style; no line wider than the block's existing comment lines.

**Verification:**

- `git diff -- cli/templates/repo/gitignore` shows exactly two added lines, both starting `# `, sitting between `# forced run writes is left visible on purpose.` and `{{harnessBackups}}`, and no removed line.
- `git grep -n 'left visible' -- cli/templates/repo/gitignore` still finds the original line, and `git grep -n 'names each such .bak in its notes' -- cli/templates/repo/gitignore` finds the new one directly after the exception line.
- `commands.typecheck` (`bash scripts/typecheck.sh`) exits zero.
