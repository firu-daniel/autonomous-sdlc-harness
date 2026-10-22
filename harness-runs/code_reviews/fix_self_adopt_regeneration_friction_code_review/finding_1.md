### 1. The recipe previews a `--non-interactive` run, then runs one without that flag

**File:** `docs/development.md` → `## 5. Verifying a change`, Gate 2, the paragraph "**Regenerating this repository's adoption after a `cli/templates/` change is one forced self-adopt run, read as a dry run first.**", the second fenced block, the line "HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze"

The paragraph says the recipe is *one* forced self-adopt run, read as a dry run first. The two commands it gives are not the same run with and without `--dry-run`:

```
HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze --dry-run --non-interactive
```

```
HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze
```

The preview takes every prompt's documented non-interactive default. The real run, typed at a terminal, asks those questions instead (`.claude/context/cli.md` → *"a prompt shown only when the flag was absent and both descriptors are a TTY"*). So a contributor who answers a prompt differently from its default gets a run that the dry run they just reviewed did not describe. The restore list and the `= would keep` / `would replace` lines below it were measured with `--non-interactive` too ("The same run, taken with `--non-interactive` in a throwaway clone of that commit"). The only flags that should differ between the preview and the run are `--dry-run`.

**Fix:** add `--non-interactive` to the real-run line in the second fenced block, so the block reads:

```
HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze --non-interactive
git status --short
```

Leave the dry-run line and the rest of the paragraph unchanged. No test file is edited, so the fix owes no per-unit test run.
