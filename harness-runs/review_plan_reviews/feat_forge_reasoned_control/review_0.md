# Review plan meta-review — iteration 0

## Must Fix
1. **The `plugin` layer is touched by the diff, and the review shows no check drawn from `.claude/context/plugin.md`** — refers to "Structure" (missed check). Offending file: the index, `harness-runs/code_reviews/feat_forge_reasoned_control_code_review.md`.
   The diff adds `plugin/commands/harness-read-mention.md` and `plugin/instructions/mention_reading.md`, and edits `plugin/README.md`, `plugin/commands/README.txt`, `plugin/instructions/README.md` and `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`. All of them sit under the `plugin` layer's path. None of the four findings carries a `plugin` layer tag, and the index's Context does not give a clean-pass rationale drawn from the `plugin` conventions document. The only places it mentions the layer are the "The review covers" bullet, which lists the two new files, and the "Earlier findings" paragraph, which says that architecture-review fixes landed. Neither says that the new units were checked against the layer's own rules. Those rules include:
   - `## What accompanies a new unit of each kind` → the slash-command row: `description:`, `argument-hint:` only when the command takes an argument, a `## Resolved values` table, a `## Steps` section, and the instruction file it loads.
   - `## Frontmatter`: a command declares no `tools:` and no `model:`.
   - `.claude/context/conventions.md` → `## The stack…`: an instruction file has no frontmatter fence.
   - `## Wires: dispatch in, return out`: the return-wire rules, which `mention_reading.md` → `## Output contract` explicitly argues it departs from (a JSON object rather than a `key: value` fence).
   - `## Citation`: `${CLAUDE_PLUGIN_ROOT}` for intra-plugin references, repo-relative paths outside the plugin, no line coordinates.
   - The README and count edits that row D3 of the story's scope register assigns to Tasks 7 and 8.

   This is the silence-about-a-touched-layer case. The fix loop and the human reader cannot tell whether the new command and instruction file were checked and found clean, or never checked. My own spot-read found the command's `description:`, `## Resolved values`, `## Steps` and loaded instruction file present, and the instruction file has no frontmatter. So the expected outcome is a clean pass, not a new finding. The review still has to state it.
   **Fix:** In the index `harness-runs/code_reviews/feat_forge_reasoned_control_code_review.md` → `## Context`, add a short `**Plugin layer.**` paragraph (for example, after the `**Sweep.**` paragraph). It gives the clean-pass rationale for the two new `plugin` units and the four edited `plugin` files against `.claude/context/plugin.md`, naming each check and its result:
   - the slash-command accompanying set (`description:`, no `argument-hint:` because the command takes no argument, `## Resolved values`, `## Steps`, the loaded instruction file);
   - no `tools:` / `model:` on the command;
   - no frontmatter on `mention_reading.md`;
   - the JSON return wire against `## Wires: dispatch in, return out`, and why the stated departure is acceptable or not;
   - the citation form;
   - the README and count updates from story-plan register rows 54, 60, 62–65, 67–69.

   If any of these checks fails, add it as a new `finding_<N>.md`, with its index pointer and a readiness entry tagged `_(layer: plugin)_`, rather than as prose in the Context.

## Nice to Have
1. **Readiness order puts the docs-only Finding 1 after the two-layer Finding 2** — refers to review findings #1 and #2. Offending file: the index.
   The readiness list should run from small and safe first to layered changes after. Finding 1 edits `docs/` only, in a single layer. Finding 2 changes `remote-run.sh`, adds test cases and edits two `docs/github-run-control.md` cells, across two layers. Both edit the same `## 8` row, in different cells, so neither depends on the other.
   **Fix:** Optionally swap readiness entries 3 and 4 in the index, so that Finding 1 lands before Finding 2.
