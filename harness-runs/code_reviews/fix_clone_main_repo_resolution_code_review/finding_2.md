### 2. Two documents point at `## The fallback` without being on the module's closed roster

**File:** `plugin/instructions/main_repo_resolution.md` → `## Who may cite this` — "no document beyond these 24 points at `## The fallback`."

The module closes its citer set: *"A document not on this list does not point here. An edit that rewords or moves the heading updates every roster member in the same change."* This branch adds two citations of that heading that are not on the roster:

- `docs/sandbox-verification.md`. The dated note **2026-10-29: AN5–AN6 are owed measurements, not results, …** reads "the clone arm of `plugin/instructions/main_repo_resolution.md` → `## The fallback`".
- `cli/test/main-root-fallback.test.mjs`. Its header's *Not covered* paragraph reads "(`plugin/instructions/main_repo_resolution.md` → `## The fallback`)".

`git grep -n -F 'main_repo_resolution' -- . ':!harness-runs'` lists both. A later edit that renames the heading follows the roster, updates the 24 listed documents, and leaves these two pointing at a heading that no longer exists. The roster check in `cli/test/main-repo-resolution-corpus.test.mjs` cannot catch this. It compares only `${CLAUDE_PLUGIN_ROOT}/` entries, and both stray citers are repo-relative.

**Fix:** in `plugin/instructions/main_repo_resolution.md` → `## Who may cite this`, add these two lines directly after the line `- \`docs/cli.md\` — the main-checkout anchor-rule bullet`:

```markdown
- `docs/sandbox-verification.md` — the dated note **2026-10-29: AN5–AN6 are owed measurements, not results, …**
- `cli/test/main-root-fallback.test.mjs` — the header's *Not covered* paragraph
```

Then, in the closing sentence of that section, change `**no document beyond these 24 points at \`## The fallback\`.**` to `**no document beyond these 26 points at \`## The fallback\`.**`.

The roster test parses only the `${CLAUDE_PLUGIN_ROOT}/` lines, so it is unaffected by the two repo-relative additions.
