### 3. `mainRepoAnchor.ts`'s header limits the rename sweep to `cli/` and `plugin/`, which misses the worked example's rendered profile and the documents that quote the name

**File:** `cli/src/core/mainRepoAnchor.ts` (module header) — "`grep -rn HARNESS_MAIN_REPO cli/ plugin/` reaches all of them:"

**Problem.** The header owns the anchor's name and tells a maintainer how to find every place that spells it outside `cli/src`. Its sweep is scoped to `cli/ plugin/`. On this branch the literal is also carried by `examples/notes-app/.claude/settings.autonomous.json`, the live, `init`-rendered profile, which holds the `Bash(printenv HARNESS_MAIN_REPO)` rule and its `_README` line (`.claude/context/conventions.md` → `## Documents of record`: *"every other file `init` rendered into it … are **live** and are maintained"*). It is also carried by `ARCHITECTURE.md`, `docs/cli.md`, `docs/watcher.md`, `docs/sandbox-verification.md` and `docs/guard-verification.md`. A maintainer who renames the constant and follows the header's command updates the code and the plugin. They leave the worked example's profile allowing a read no reader makes, and leave the documents of record describing the old name.

**Fix.** In that sentence of the header, replace the command and say what else it reaches:

```ts
 * The mirrors outside that scope, which cannot import and must spell the same literal —
 * `git grep -n HARNESS_MAIN_REPO`, run from the repository root, reaches all of them, together with
 * the worked example's rendered profile and the documents that quote the name:
```

Leave the three bullets that follow unchanged. The change is to a comment only and has no test of its own.
