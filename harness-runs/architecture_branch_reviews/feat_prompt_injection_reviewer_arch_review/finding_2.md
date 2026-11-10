### 2. Citation roster of `prompt_injection_screen.md` omits `docs/watcher.md`

**Severity:** Must Fix

**Site:** `plugin/instructions/prompt_injection_screen.md` → `## Who may cite this`. The un-rostered citer is `docs/watcher.md`, in the outer-loop script table row this branch added: *"| `prompt-injection-screen.sh` | The prompt-injection screen's script: … writes the `UNSAFE` park (`plugin/instructions/prompt_injection_screen.md`); a tripwire, not a boundary | …"*.

**Problem.** `.claude/context/plugin.md` → `## What accompanies a new unit of each kind`, row *A shared instruction module*, requires the module to hold the roster of every document that points at it. The module states the same rule: *"a new citer joins this list."* The roster already lists one document from outside the plugin, `README.md`, so documents outside `plugin/` count as roster members. Its sibling module follows the same practice: `plugin/instructions/main_repo_resolution.md` → `## Who may cite this` lists `docs/watcher.md`. The new pointer in `docs/watcher.md` is missing from this roster. A later rename or move of the module would strand it, and the roster would not show it.

**Fix.** In `plugin/instructions/prompt_injection_screen.md` → `## Who may cite this`, add this bullet beside the existing `README.md` bullet, using the same repo-relative form as that entry:

```
- `docs/watcher.md` — the harness repository's watcher document, its outer-loop script table (the `prompt-injection-screen.sh` row)
```

Change nothing else.
