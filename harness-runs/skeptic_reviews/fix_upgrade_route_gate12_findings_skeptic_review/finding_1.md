### 1. The in-flight move route checks `.gitignore` out wholesale from the default branch, silently reverting any `.gitignore` edit the run itself committed on its branch

**File:** `docs/remote-execution.md` → `### Upgrading` → **Moving a run in flight to the new version, on purpose.** — the paragraph starting "The checkout below takes the same paths the upgrade's printed `git add` named and you committed." and the fenced block "git checkout origin/<default branch> -- .github/workflows/harness-run.yml .github/workflows/harness-resume.yml .gitignore"

**Problem.** The route moves a paused, parked or stopped run onto the new workflows by running, on a detached checkout of `origin/<branch>`:

```
git checkout origin/<default branch> -- .github/workflows/harness-run.yml .github/workflows/harness-resume.yml .gitignore
```

and tells the reader to "append any other path that `git add` named to the same line" (in practice `.claude/settings.json` and `.mcp.json`, the other two `merge-json` targets `init` can merge into: `cli/src/generators/projectSettings.ts` → `writeProjectSettings`, `cli/src/generators/repoRoot.ts` → the `MCP_PATH` `plan.add`).

`git checkout <tree-ish> -- <path>` replaces the file in the index and working tree with the tree-ish's copy, whole. For the two workflows that is the intent: the run's branch never edits them. For `.gitignore` (and `.claude/settings.json`, `.mcp.json`) it is not. They are ordinary committed files a run's own task can edit on its branch. When it has, the checkout replaces the branch's version with the default branch's, the reader commits it as "Move <branch> to the harness workflows at <version>", and the run's own edit is gone:

- Nothing warns: `git checkout -- <path>` prints nothing, and the prose before the block presents the checkout as bringing only the new ignore lines.
- The next job continues from the reverted file, and the branch's eventual diff against the default branch no longer shows the run's change, so the loss does not surface in review either.

The route only needs the lines the new version's `init` would merge in. The job's own refusal already names the sanctioned way to get exactly those onto a branch: `cli/templates/github/workflows/harness-run.yml`, step `Generate the job's permission profile`: "Run 'npx autonomous-sdlc-harness@$HARNESS_CLI_VERSION init' locally and commit the result." `init` merges with `merge-lines` / `merge-json`. Those policies only add missing lines or keys (`cli/src/core/writer.ts`, the `merged` effect with `added`), so the branch's own content survives, and the result is byte-for-byte what the job's `init` would otherwise do and then refuse.

**Why it is reachable.** The route is written for any in-flight run, and a run whose task touched `.gitignore` or `.claude/settings.json` is an ordinary run. The `.gitignore` entry is not optional. The same paragraph says that leaving it out fails the run's very next job.

**Fix.** In `docs/remote-execution.md` → `### Upgrading` → **Moving a run in flight to the new version, on purpose.**, change the checkout step so that only the two workflows are checked out, and the merged files are produced by the new version's `init` on the branch's own copies:

- [ ] Replace the paragraph that starts "The checkout below takes the same paths the upgrade's printed `git add` named and you committed." and ends "Checking out only the two workflows therefore fails the run's very next job." with:

  "Take only the two workflows from the default branch. Once the branch carries them, its next job runs the new version's `init` (`cli/templates/github/workflows/harness-run.yml`, step `Generate the job's permission profile`, `init --plugin-root-entries`), which merges any ignore lines or settings keys the new version adds into the branch's tracked `.gitignore`, `.claude/settings.json` or `.mcp.json`. That step's `git status --porcelain --untracked-files=no` test then fails the job on a changed tracked file (`init … changed tracked files`). So run that `init` here first and commit what it merges, as the job's own error tells you to. Do not check those files out from the default branch: a checkout replaces the whole file, and would discard any edit the run itself made to it on its branch."

- [ ] Replace the fenced block

  ```
  git checkout origin/<default branch> -- .github/workflows/harness-run.yml .github/workflows/harness-resume.yml .gitignore
  ```

  with these three fenced blocks, one command each, in this order:

  ```
  git checkout origin/<default branch> -- .github/workflows/harness-run.yml .github/workflows/harness-resume.yml
  ```

  ```
  npx autonomous-sdlc-harness@<version> init
  ```

  ```
  git status --short
  ```

- [ ] Immediately after the `git status --short` block, add this sentence and fenced block, before the existing `git commit -m "Move <branch> to the harness workflows at <version>"` block:

  "Stage every tracked file it lists as modified, the two workflows included:"

  ```
  git add <every path git status --short lists as modified>
  ```

Leave the `git fetch origin`, `git switch --detach origin/<branch>`, `git commit`, `gh auth refresh -s workflow`, `git push origin HEAD:<branch>` and `git switch -` blocks, and the prose around them, unchanged. The placeholder form matches the one **The commands** already uses in `git add <every path on the git add line the upgrade's report prints>`.

This is a prose-only change to one developer document, and it asks for no test run.
