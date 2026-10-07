### 2. Shipped plugin assets cite this repository's `.claude/context/*.md` as rule sources

**Severity:** Must Fix. **Layer:** plugin.

**Sites:**
- `plugin/commands/harness-read-mention.md` → `## Steps`, step 1: *"If it cannot be read, return the decision … and stop (`.claude/context/conventions.md` → `## Plugin asset authoring`)."*
- `plugin/instructions/mention_reading.md` → `## Output contract`, the paragraph opening **"The return-wire rules this return answers to."**: *"Of `.claude/context/plugin.md` → `## Wires: dispatch in, return out`, two: the first bullet … and the third bullet's discriminator half …"*

**Problem.** Both files ship in the plugin. Both name a document under `.claude/context/` as the authority for a rule they follow. In this checkout those documents are adoption artefacts. `.claude/context/conventions.md` → `## Documents of record` says: *"`harness.config.json`, `.claude/`, `harness-runs/`, `scripts/` and `githooks/` at this root are `init`'s output in this checkout. A rule read off `harness-runs/` describes a run, not this project."*

In every other adopting repository the same paths resolve to that adopter's own conventions documents:
- `.claude/context/conventions.md` exists there, but carries no `## Plugin asset authoring` section.
- `.claude/context/plugin.md` usually does not exist at all, because its name comes from this repository's `layers[]` entry.

So each citation is correct in exactly one repository and points at the wrong file, or at nothing, in every other. That is the failure `.claude/context/plugin.md` → `## What this layer is` rules out for this layer: *"No adopter's value is ever a literal here … an asset that named one would be wrong in every repository but the one it was copied from."* No shipped asset on `dev` cites these documents as a rule source. `plugin/commands/harness-analyze.md` names `.claude/context/conventions.md` only as the adopter's write target, in its `<shared_conventions_path>` row, which is a different use.

The rules themselves have owners inside the plugin:
- The report-don't-substitute rule is `plugin/agents/README.txt`'s. `.claude/context/conventions.md` → `## Plugin asset authoring` cites it there itself: *"(`plugin/agents/README.txt`)"*.
- The return-wire rules are stated by the assets that own a wire. `mention_reading.md` already quotes `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## Output contract` for *"Field names byte-stable"*.

**Fix.**
1. In `plugin/commands/harness-read-mention.md` → `## Steps`, step 1, replace the parenthetical `(.claude/context/conventions.md → ## Plugin asset authoring)` with a citation of the plugin-side owner, `${CLAUDE_PLUGIN_ROOT}/agents/README.txt`, naming its report-don't-substitute rule by a short quoted substring. Alternatively, drop the parenthetical: the step already states the behaviour in full.
2. In `plugin/instructions/mention_reading.md` → `## Output contract`, rewrite the **"The return-wire rules this return answers to."** paragraph so it no longer names `.claude/context/plugin.md`. State the two properties directly:
   - field names are byte-stable, keeping the existing `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## Output contract` quotation;
   - `action` is the literal discriminator.

   Keep the existing sentences on why the carrier is structured output rather than a `key: value` fence, and on which files a rename touches (`cli/templates/scripts/remote-run.sh` → `control_mention`, `cli/src/remote/githubActions.ts` → `MENTION_ACTIONS`). Those are repo-relative citations outside the plugin, which `.claude/context/plugin.md` → `## Citation` allows.
3. Run `grep -rn "\.claude/context/" plugin/commands/harness-read-mention.md plugin/instructions/mention_reading.md` and confirm it prints nothing.
