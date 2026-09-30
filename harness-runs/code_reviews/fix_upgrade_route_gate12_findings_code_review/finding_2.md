### 2. `### Upgrading` still shows a fenced two-workflow `git add` among **The commands**, then tells the reader not to run it

**File:** `docs/remote-execution.md` → `### Upgrading` → **The commands** — the fenced block "git add .github/workflows/harness-run.yml .github/workflows/harness-resume.yml" and the sentence after it, "Run the `git add` the upgrade's report prints rather than this one"

**Problem.** Task 5 fixed the sentence after this block but kept the block. **The commands** is a sequence of fenced blocks meant to be run top to bottom, and this one is the only block in it the reader is **not** meant to run: the next sentence says to run the report's `git add` "rather than this one", because leaving `.gitignore` out "fails the next job". A reader who pastes the section's blocks in order commits only the two workflows, which is the exact failure the story plan's first top risk names and which every other durable route on this branch was changed to avoid (the `doctor` warning, the install step's `upgrade_route`, Gate 12 observation (xii)). The correct instruction is present, so a careful reader gets it right, but the block contradicts it. The lessons ledger's rule that every command an adopter is meant to run sits in a fenced block has the converse consequence here: a command the adopter is *not* meant to run should not sit in one.

**Fix.** In `docs/remote-execution.md` → `### Upgrading` → **The commands**, keep the staging step as a fenced block but change what it holds, so the fenced command is the one the reader is meant to run. Do **not** delete the block: staging is a command the adopter runs, and `harness-runs/lessons.md` → `## Adopter-facing documentation` requires every such command to sit in a fenced block, one command per line.

- [ ] Replace the contents of the fenced block

  ```
  git add .github/workflows/harness-run.yml .github/workflows/harness-resume.yml
  ```

  with

  ```
  git add <every path on the git add line the upgrade's report prints>
  ```

  The placeholder follows the form the section already uses for `<version>` in its fenced blocks.

- [ ] Replace the sentence after the block, "Run the `git add` the upgrade's report prints rather than this one: it already names every tracked file the upgrade changed, `.gitignore` included when the run merged new ignore rules into it. Leaving one out fails the next job, because the job's own `init` refuses a changed tracked file. Then:", with "Take the paths from the `git add` line the upgrade's report prints. That line names every tracked file the upgrade changed, `.gitignore` included when the run merged new ignore rules into it, and leaving one out fails the next job, because the job's own `init` refuses a changed tracked file. Then:"

Leave the `git status --short` block before it and the `git commit` block after it unchanged. This is a prose-only change to one developer document; it asks for no test run.
