### 3. The new shell mirror of `claudeHome()` is declared in the function's doc comment, not in the module header's inventory of shell mirrors

**File:** `cli/src/machine/paths.ts` (`claudeHome`), the added doc-comment lines "`cli/templates/scripts/run-analytics.sh` mirrors this resolution in shell to read sub-agent transcripts"

The module header is where `paths.ts` lists every shell mirror of its resolutions, under point 2, "**The resolution matches the shell half byte for byte**". It names `hr_lane_dir()`, `hr_cache_dir()` and `cli/templates/github/workflows/harness-run.yml`. `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` sets the same rule for the other machine-local constant: the owning module's header declares each mirror outside the package, and "a mirror the header does not declare is a defect". This branch adds a fourth mirror, `run-analytics.sh`'s `claude_home` resolution, but declares it only in `claudeHome()`'s own doc comment. A maintainer who reads the header as the module's mirror list will not find it.

**Fix:**

1. Delete the two added lines from `claudeHome()`'s doc comment.
2. At the end of the header's point 2, after the sentence ending "so a change to that resolution or to {@link MACHINE_DIR_NAME} is an edit to the workflow template as well.", add: "`cli/templates/scripts/run-analytics.sh` mirrors {@link claudeHome} — `CLAUDE_CONFIG_DIR` when non-empty, else `$HOME/.claude`, one trailing slash stripped — to locate sub-agent transcripts, so a change to that resolution is an edit to the script as well."

This is a comment-only change and no test file is edited, so the fix runs no test.
