### 1. The owner of `CLAUDE_CONFIG_DIR` does not declare the watcher's new mirror of it

**Site:** `cli/src/machine/paths.ts`, the module header's rule **2.** (*"The resolution matches the shell half byte for byte"*), the paragraph ending *"`cli/templates/scripts/run-analytics.sh` mirrors {@link claudeHome} … so a change to that resolution is an edit to the script as well."* The constant concerned is `CLAUDE_HOME_VARIABLE` in the same file. The mirror it fails to declare is `cli/templates/scripts/autonomous-watcher.sh` → `SESSION_ENV_BASE` (the line `CLAUDE_CONFIG_DIR ANTHROPIC_API_KEY CLAUDE_CODE_OAUTH_TOKEN \`), with its comment bullet *"CLAUDE_CONFIG_DIR, whose owner is `cli/src/machine/paths.ts` → `CLAUDE_HOME_VARIABLE`"*.

**Problem.** This branch adds a shipped-template spelling of the environment-variable name `CLAUDE_CONFIG_DIR` to the watcher's session allow-list. The rules that apply:

- `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` makes an environment-variable name *"a constant with an owner too"*, and names `CLAUDE_HOME_VARIABLE` (`cli/src/machine/paths.ts`) as that owner.
- The same section, and `## What accompanies a new unit of each kind` → *A persisted machine-state key*, fix the pattern for a shipped template that must know an owned literal: the owning module's header declares the mirror. An undeclared mirror is a defect.

`cli/src/machine/paths.ts` already follows that pattern. Its header lists each shell and YAML mirror, `run-analytics.sh`'s use of `CLAUDE_CONFIG_DIR` among them, so that a change on the TypeScript side is known to be an edit to each one. This branch applied the same pattern to `cli/src/remote/githubActions.ts`, whose header now declares the watcher's `SESSION_ENV_STRIP_EXTRA` as its mirror. But the pointer for `CLAUDE_CONFIG_DIR` runs one way only: the watcher names its owner, and the owner does not name the watcher.

The cost: suppose `CLAUDE_HOME_VARIABLE` changes because the agent runtime renames its configuration-directory variable. Someone reading `paths.ts` gets no sign that the watcher's allow-list must change too. A local session would then silently lose its configuration directory. `.claude/context/cli.md` → `## What "done" means here` adds that a header which states a rule is held to it: the change satisfies the rule or amends the header.

**Fix.** In `cli/src/machine/paths.ts`, extend the module header's rule **2.** paragraph with one sentence after the `run-analytics.sh` sentence, for example:

> `cli/templates/scripts/autonomous-watcher.sh` names {@link CLAUDE_HOME_VARIABLE}'s value in `SESSION_ENV_BASE`, the names a local engine session keeps, so a rename of that variable is an edit to the watcher's list as well.

No code change. Do not change the watcher: its comment already points at this owner.
