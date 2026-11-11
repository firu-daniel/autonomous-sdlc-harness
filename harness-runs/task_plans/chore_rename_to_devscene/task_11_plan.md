### Task 11 — Rename the plugin manifest, add `displayName`, and respell the plugin README, agents, flow whiteboard and samples

**Goal:** The plugin is named `devscene`, displays as `DevScene`, and points at `firu-daniel/devscene`. The plugin's README, its agent definitions, its flow whiteboard and its samples name every command `/devscene:<command>`. Apply the spelling table in the story index's `## Context`.

**Contract with the rest of the branch.** `plugin/.claude-plugin/plugin.json` → `name` must equal `cli/src/core/pluginIdentity.ts` → `PLUGIN_NAME`, which Task 1 set to `devscene`. A mismatch produces an `enabledPlugins` key that enables nothing. The root marketplace entry naming this plugin, `.claude-plugin/marketplace.json` → `plugins[0].name`, is Task 14's and must carry the same value. Commands are namespaced `/<plugin>:<command>` and agents `<plugin>:<agent>`, so no command or agent file is renamed. Only references to them change.

**The plugin corpus quotes its own literals across files.** A command spelling changed here may be quoted in a command or an instruction. Those are Tasks 12 and 13, and every such quote moves to the same `/devscene:` form there. No heading changes in this task, so no `→ ## heading` citation is stranded.

### Targets

- `plugin/.claude-plugin/plugin.json`
- `plugin/README.md`
- `plugin/agents/README.txt`, `plugin/agents/committer.md`, `plugin/agents/conventions-reviewer.md`, `plugin/agents/conventions-writer.md`, `plugin/agents/task-plan-writer.md`
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`
- `plugin/samples/sample_task_plan.md`, `plugin/samples/sample_user_review.md`

**Work:**

- [ ] `plugin.json`: `"name": "devscene"`, a new `"displayName": "DevScene"` placed directly after `name`, `homepage` and `repository` on `https://github.com/firu-daniel/devscene`, and `description` reading *"DevScene, an autonomous SDLC harness for Claude Code: plan, implement, review, QA and ship a branch end to end."* `version`, `author`, `license` and `keywords` are unchanged. The task prompt requires the field (its line *"`plugin/.claude-plugin/plugin.json` gains `"displayName": "DevScene"`"*); it records no check of it against the manifest reference, so this plan claims none. Whether the validator accepts it under `--strict` is graded by gate `1` (`claude plugin validate --strict plugin`, `docs/development.md` → `## 5. Verifying a change` → **Gate 1 — manifests**) in the Run gates round, after this branch's tasks land. Task 22 records the field's presence and the gate that grades it in `docs/development.md` → `## 3. Manifest facts a contributor must not rediscover`; this task writes nothing there.
- [ ] `plugin/README.md`: every `/autonomous-sdlc-harness:<command>` becomes `/devscene:<command>`, and the product is named `DevScene` where prose names it. `plugin/agents/README.txt`: the two `/devscene:harness-analyze` references.
- [ ] Agent bodies and `description:` frontmatter: `committer.md`, `conventions-reviewer.md` and `conventions-writer.md` (the `/devscene:harness-analyze` referents, and `devscene config set layers` in `## House rules`); `task-plan-writer.md` (its four `/devscene:harness-analyze` and `npx devscene config set layers` occurrences). Change nothing else in any agent definition: no frontmatter key, no `tools:` entry, no wording beyond the name. The new spelling is shorter, so no definition's word count rises.
- [ ] `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`: the `/devscene:harness-analyze` and `/devscene:harness-read-mention` spellings. `plugin/samples/sample_task_plan.md` and `sample_user_review.md`: their `/devscene:branch-*` spellings in the opening reference paragraphs. A sample's task titles, finding numbers and `_(points: …)_` tags are untouched, so the worked branch stays coherent.
- [ ] `node -e "JSON.parse(require('fs').readFileSync('plugin/.claude-plugin/plugin.json','utf8'))"` from the checkout root, to confirm the manifest still parses.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- plugin/.claude-plugin plugin/README.md plugin/agents plugin/docs plugin/samples` prints nothing.
- `node -e "const m=require('./plugin/.claude-plugin/plugin.json'); console.log(m.name, m.displayName, m.repository)"`, run from the checkout root, prints `devscene DevScene https://github.com/firu-daniel/devscene`.
- `git diff -U0 -- plugin/agents` shows only lines whose change is the product name: no `name:`, `tools:` or `model:` line changed.
