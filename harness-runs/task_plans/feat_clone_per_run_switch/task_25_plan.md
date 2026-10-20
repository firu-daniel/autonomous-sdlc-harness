### Task 25 — Re-render the worked example's profile for the new protected set and restate the figures its README gives

**Goal:** `examples/notes-app/.claude/settings.autonomous.json` is a **live** file `init` rendered (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*). It must carry what this branch's generator writes:
- the whole `<main>/.git` entry;
- the six sibling-glob clone `.git` entries, and no `<glob>/.git`;
- the reworded `_README` lines.

Its machine paths go through the README's three substitution clauses: the scratch root becomes `/workspace/notes-app`, its parent becomes `/workspace`, and a home directory becomes `/workspace`. Then restate the figures the README gives about that file, recounted from the result. The frozen capture (the run artifacts under `sdlc-harness/`, `.claude/CLAUDE.md`, `.claude/context/`) is not touched.

**Depends on:** Task 5. The template `cli/templates/claude/settings.autonomous.json` and `cli/src/generators/writeProtection.ts` now render:
- `<repoRoot>/.git` as one `denyWrite` entry with `Edit(//<repoRoot>/.git/**)` / `Write(…)`, replacing the per-file `.git` entries and the worktree-record entries;
- under `<work_root>/<project>-*`: `.git/config`, `.git/hooks` (with `/**` rules), `.git/objects/info/alternates`, `.git/commondir`, `.git/config.worktree`, `.git/objects/info/http-alternates` (each with path and `/**` rules), and no `<glob>/.git`;
- the reworded `THREE COMMANDS…`, `TWO RESIDUALS…` and `WHAT RUNS OUTSIDE THE SANDBOX…` lines.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`
- `examples/notes-app/README.md` (the paragraph *"The one edit the kept artifacts carry, and where it landed"* and its figures only)

**Work:**

- [ ] Render a fresh profile with the built CLI.
  1. Copy `examples/notes-app` to a scratch directory under the system temp directory, never in place, initialise git there if it is not a repository, and run `node cli/dist/cli.js init --force --non-interactive` against it, answering as the README records the original answers.
  2. Take from the result only the keys the previous re-render took: the sandbox block, the permission mode and the `deny` / `allow` entries the generator changed, plus the `_README` lines.
  3. Apply the README's three substitution clauses, longest path first.
  4. Write the result over the example's file.

  `git diff` must show only the `.git`-protection entries and the three `_README` lines changing. Anything else that differs is from an unrelated generator change and is left out, with a sentence in your return naming it.
- [ ] Recount the figures the README states for that file and restate each: the `/workspace`-rooted occurrences and the lines they span, how many are `/workspace/notes-app`, how many are the sibling worktree glob `/workspace/notes-app-*`, the home-directory ones, and the bare `/workspace`. Count each with a `grep -o … | wc -l`-style count you run, and write the numbers you got.
- [ ] Keep the README's relation sentence, which says the work root is the repository root's parent and the glob is `<work_root>/<project_name>-*`. Say in one clause that a later re-render, this one, replaced the glob `.git` pointer entry with the clone's six `.git` paths and the per-file `.git` entries with the whole `.git`.

**Verification:**

- `grep -n '"/workspace/notes-app/.git"' examples/notes-app/.claude/settings.autonomous.json` finds the whole-`.git` entry.
- `grep -n 'notes-app-\*/.git"' examples/notes-app/.claude/settings.autonomous.json` finds nothing. That pattern matches the retired whole-`.git` glob entry exactly.
- `grep -rln "/Users/\|/home/" examples/notes-app/.claude/settings.autonomous.json` prints nothing (the self-containment rule).
- `jq empty examples/notes-app/.claude/settings.autonomous.json` exits 0.
- Every figure the README states about the file equals the count the command above it gives when re-run.
