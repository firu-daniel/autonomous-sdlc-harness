### 3. Declare the template mirror of the upgrade route in `githubWorkflows.ts`'s header

**Severity:** Should Fix. **Layer:** cli.

**Sites.**

- `cli/src/generators/githubWorkflows.ts`: the module header (the `## Four non-obvious choices` block, choice 4) and `UPGRADE_WORKFLOWS_FLAG` / `upgradeWorkflowsCommand`.
- `cli/templates/github/workflows/harness-run.yml`: the `# DECLARED MIRRORS` block line `cli/src/generators/githubWorkflows.ts   --upgrade-workflows`, and the `Install the pinned plugin` step's `upgrade_route="… 'npx autonomous-sdlc-harness@<version> init --upgrade-workflows' …"`.

**Problem.** The template spells out the upgrade route by hand, because `cli/templates/` is outside the compiler (`.claude/context/cli.md` → *"`cli/templates/` is outside the compiler"*). It declares the mirror only on its own side. The owning module's header says nothing about it. The sibling owner `cli/src/remote/githubActions.ts` states the mirror convention in its header: *"The compiler cannot reach them, so each declares the mirror in its own header, and a rename here is an edit to each of them"*. `.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"* makes that header the place a later editor learns what a rename affects. As it stands, renaming `UPGRADE_WORKFLOWS_FLAG`, or changing how `upgradeWorkflowsCommand` builds the route, gives no warning that the job's error message quotes the old spelling.

**Fix.** In `cli/src/generators/githubWorkflows.ts`'s module header, add a sentence to choice 4 (or a short `**Declared mirror.**` paragraph after the choices). It should state that `cli/templates/github/workflows/harness-run.yml`'s `Install the pinned plugin` step spells the route `upgradeWorkflowsCommand` produces, `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`, as a literal, and that changing `UPGRADE_WORKFLOWS_FLAG` or that route means editing that line too. This is a comment-only change: no code change and no test.
