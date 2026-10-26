### 2. `docs/cli.md` now points at `## The test-run rule` but is missing from that section's closed citer roster

**File:** `plugin/instructions/unit_loop_core.md` → `## The test-run rule` → **Who may cite this.** — the roster list, whose last entry is "- `docs/config.md`"

**Problem.** The roster ends with a closed-list rule: *"A citer **points and never restates**, and **no document beyond this roster may point at this heading.** An edit that rewords or moves the heading updates every roster member in the same change."* This branch added a pointer to that heading in `docs/cli.md` → `## 7. \`doctor\``, in the bullet beginning "**`tree-guards` never fails.**": *"which guards a change selects is the unit loop's decision, per change (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 7)"*. The architecture-review fix added `docs/config.md` to the roster for its own new pointer but missed this one. As a result the roster is not the full citer set. A later rename or move of the heading would follow the roster and leave `docs/cli.md`'s pointer stale, with nothing to catch it (`.claude/context/plugin.md` → `## Registries — a name routed to an implementation`: *"a new member is added to the list rather than announced somewhere else"*).

**Fix.** In `plugin/instructions/unit_loop_core.md` → **Who may cite this.**, add one line directly after `- \`docs/config.md\``:

```markdown
- `docs/cli.md`
```

Leave the `docs/cli.md` bullet as it is: it only points. This fix edits no test file, so it runs no test.
