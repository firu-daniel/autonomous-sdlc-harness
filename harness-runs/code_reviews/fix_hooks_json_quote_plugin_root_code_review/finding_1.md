### 1. The hooks README states the quoting rule for "every occurrence of the token", which is wider than the manifest it governs

**File:** `plugin/hooks/README.md` → `## Registration, and why it lives here rather than in generated settings` → the bullet opening "`${CLAUDE_PLUGIN_ROOT}` expands inside a hook's `command` string declared here" — "Every occurrence of the token sits inside double quotes together with the path it prefixes"

The sentence gives no scope, so it reads as a plugin-wide rule. It is only true of the six `command` strings in `plugin/hooks/hooks.json`. Elsewhere in the plugin the token is deliberately left unquoted. `plugin/agents/qa-tester.md` issues `bash ${CLAUDE_PLUGIN_ROOT}/scripts/reserve-qa-user.sh` and `bash ${CLAUDE_PLUGIN_ROOT}/scripts/release-qa-user.sh`. The generated permission profile's allow entries for those helpers match that unquoted form (`cli/templates/claude/settings.autonomous.qa.json` → "in the same unquoted form the wrapper entries above use"). A contributor who takes this sentence as a plugin-wide rule and quotes those agent-body invocations changes the command string the allow entries match, and an unattended QA run then stalls on a prompt. Task 1's plan wrote the rule as "every occurrence of the token **in a `command` string**", and the implementation dropped that qualifier.

**Fix:** in that sentence, replace

```
**Every occurrence of the token sits inside double quotes together with the path it prefixes**
```

with

```
**Every occurrence of the token in a `command` string here sits inside double quotes together with the path it prefixes**
```

Leave the rest of the bullet unchanged.
