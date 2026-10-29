### 3. `docs/watcher.md` → **Read.** restates the fallback rule it is a roster citer of, and cites it in the plugin-root form a repository document cannot resolve

**File:** `docs/watcher.md` → `### The main-checkout anchor`, the **Read.** paragraph — "Where the checkout's `.git/objects/info/alternates` is absent the fallback answers"

`docs/watcher.md` → **Read.** is on the roster of `plugin/instructions/main_repo_resolution.md` → `## Who may cite this`. That section binds every roster member: *"A citer **points and never restates**."* This branch's **Read.** paragraph does three things wrong:

1. **It points twice.** It copies the plugin clause verbatim, including the `${CLAUDE_PLUGIN_ROOT}/instructions/main_repo_resolution.md` → `## The fallback` form. It then repeats the same citation repo-relative in parentheses.
2. **It re-walks the rule.** The following sentence restates F2–F8 case by case: the alternates-absent answer, then "is a main checkout, is not the clone, records the clone's branch in its run registry as `copy_kind` `clone` at the clone's path, and has the clone at `<its parent>/<projectName>-<branch>`", then the stop sentence. That makes `docs/watcher.md` a second owner of the rule, which will drift the first time the module changes a check.
3. **It uses a form this file cannot resolve.** `${CLAUDE_PLUGIN_ROOT}` is a plugin-runtime token. `docs/` is read from the checkout, where anything outside the plugin, and this document itself, cites repo-relative (`.claude/context/plugin.md` → `## Citation`).

**Fix:** in `docs/watcher.md` → `### The main-checkout anchor` → **Read.**, replace the first two sentences, from `**Read.** The plugin's readers resolve` through `rather than use the clone.` inclusive, with:

```markdown
**Read.** The plugin's readers resolve `<MAIN_REPO>` as the path a bare `printenv HARNESS_MAIN_REPO` prints, else by the fallback in `plugin/instructions/main_repo_resolution.md` → `## The fallback`, which owns the rule: the first `worktree ` line of `git worktree list --porcelain` outside a clone, the main checkout whose run registry records the clone from inside one, and otherwise a stop sentence rather than the clone.
```

Leave the rest of the paragraph unchanged, from `The generated profile allow-lists exactly that read` onward. The replacement keeps the phrase `` first `worktree ` line `` that the story's scope register (derivation D1) expects to find in this file, and it does not carry the retired full old clause.
