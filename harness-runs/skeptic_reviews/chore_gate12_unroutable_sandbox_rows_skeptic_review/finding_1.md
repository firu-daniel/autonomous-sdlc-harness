### 1. SB3's source-read grounds claim the session writes only under `allowWrite`, but the session's cwd, the job's checkout, is a write root too

**File:** `scripts/lib/gate12-sandbox-round/core.sh` (`g12_row_declare SB3`) — "and the sandbox's allowWrite names only the state directory"; restated in `docs/development.md` (Gate 12 round step 7 → **The clauses closed upstream, read from the source.** → bullet **SB3.**, "the session's processes write only under `sandbox.filesystem.allowWrite`"; and the **The rows the driver takes, and how.** table, row `SB3`), and in `docs/sandbox-verification.md` (`## 10.` table, row `SB3`, "the session's processes may write only under `sandbox.filesystem.allowWrite`").

**Problem.** This branch rewrites SB3 as *read from the source, not observed*. It names two grounds for why the session cannot rewrite `harness.config.json`:

1. `protectedPaths` carries `join(repoRoot, CONFIG_FILENAME)`. This is true and enough on its own.
2. The session's processes may write only under `sandbox.filesystem.allowWrite`, which names only the state directory. This is false.

`allowWrite` is not the session's only write root. The session's working directory is one too, and in job mode that directory is the job's whole checkout. The corpus already says so in three places:

- `docs/sandbox-verification.md` → **AP6, derived.**: *"The sibling sits outside every write root of the session: the cwd, which is the clone, and `allowWrite`, which holds `<main>/harness-runs` only."*
- `docs/remote-execution.md` → **Every `run`-job `npm` / `npx` runs outside the checkout.**: *"The watchdog's check runs from a fresh `mktemp -d` directory for the same reason, because by then the session can have written either into the checkout without a commit."* That sentence is about a `.npmrc` or `node_modules/`, which are checkout paths outside the state directory.
- `run_job` in `cli/templates/scripts/autonomous-watcher.sh` sets `local worktree="$MAIN_REPO"`, so a job's session runs in the job's own checkout. FR1's round 15 observation confirms it: *"launched in /home/runner/work/harness-gate12/harness-gate12"*.

**Why it matters.** The task prompt makes the **Read from** columns the contract: a clause is graded on exactly what its **Read from** names. SB3's row now names `cli/templates/claude/settings.autonomous.json` → `sandbox.filesystem.allowWrite` as a ground, and `grade` prints that ground in SB3's `source` line through the `--list` note. That sentence is a capability boundary the sandbox does not have.

- A maintainer who checks the row against its named source finds `allowWrite` holds one entry. They conclude that sandboxed processes cannot write anywhere else in the checkout.
- On that reading, `harness.config.json`'s own `protectedPaths` entry looks redundant. Removing it would actually open the file to the session.
- The same misreading applies to every other checkout path the profile does not deny.

This is the security-relevant kind of premise the story plan itself corrected for links (*"This is a statement about what the session can do, and it is security-relevant"*). This row introduces a new wrong one, in the opposite direction.

**Fix.** Drop the false ground everywhere it appears. Keep the true one, `protectedPaths`, which `applyWriteProtection` (`cli/src/generators/writeProtection.ts`) carries into `sandbox.filesystem.denyWrite` and into the `Edit` deny rules of `permissions.deny`.

1. `scripts/lib/gate12-sandbox-round/core.sh`, the `g12_row_declare SB3 7 source -` note. Replace the whole note string with:

   ```
   "read from the source, unreachable by construction: harness.config.json is write-protected in the session by protectedPaths, its CONFIG_FILENAME entry, which the profile carries into sandbox.filesystem.denyWrite and the Edit deny rules; a committed rewrite is a job surface (jobSurfacePaths), which the job refuses"
   ```

   This keeps the `--list` field rules in the file header: no `|`, tab, double quote, backtick or angle bracket.
2. `docs/development.md`, the **The rows the driver takes, and how.** table, row `SB3`: replace its note cell with the same text, verbatim, so that the restated table matches `--list` again.
3. `docs/development.md`, the **The clauses closed upstream, read from the source.** bullet **SB3.**: delete the clause `; the session's processes write only under \`sandbox.filesystem.allowWrite\` (\`cli/templates/claude/settings.autonomous.json\`), which names the state directory alone`. Then replace `\`join(repoRoot, CONFIG_FILENAME)\` entry)` with `\`join(repoRoot, CONFIG_FILENAME)\` entry, which \`applyWriteProtection\` carries into \`sandbox.filesystem.denyWrite\` and the \`Edit\` deny rules)`.
4. `docs/sandbox-verification.md`, `## 10.` table, row `SB3`:
   - **Expected:** delete `, and the session's processes may write only under \`sandbox.filesystem.allowWrite\` (\`cli/templates/claude/settings.autonomous.json\`), which names the state directory`. Then insert `, which \`applyWriteProtection\` carries into \`sandbox.filesystem.denyWrite\` and the \`Edit\` deny rules` directly after `its \`join(repoRoot, CONFIG_FILENAME)\` entry)`.
   - **Read from:** replace the cell with `` `cli/src/generators/writeProtection.ts` → `protectedPaths`, `applyWriteProtection` and `jobSurfacePaths`: the symbols `grade`'s SB3 `source` line names ``.
   - Leave the **Observed** and **Verdict** cells as they are. They are recorded cells.

No test cans the note text: `cli/test/gate12-sandbox-round-grade.test.mjs` ("SB3 and JS3N, the source rows, …") and `cli/test/gate12-sandbox-round-docs.test.mjs` read it from `--list` at test time, which is why no test file needs editing. This fix creates or edits no test file, so it runs no test file of its own.
