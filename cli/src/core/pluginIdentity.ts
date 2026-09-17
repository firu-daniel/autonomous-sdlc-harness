/**
 * The plugin's name, and every plugin-qualified command spelling this CLI prints.
 *
 * **The rule this module exists to enforce: the plugin's name and every plugin-qualified command
 * spelling the CLI prints are built here, once.** `init`'s closing pointer, `doctor`'s remedies, the
 * conventions-stub footers and the detection table's `flat` warning all name the analyze command; a
 * private copy in any one of them could be respelled without the others, and an adopter would be told
 * two different commands with no compile error and no test to say so.
 *
 * It sits on the shared floor rather than in `generators/projectSettings.ts`, which writes the
 * `enabledPlugins` key from {@link PLUGIN_NAME}, because `detect/` needs the spelling too and
 * `generators/` already depends on `detect/`.
 */

/**
 * The plugin's name, mirroring `plugin/.claude-plugin/plugin.json`'s `name`.
 *
 * A second spelling of the manifest's name is the failure this constant exists to prevent: the
 * `enabledPlugins` composite `generators/projectSettings.ts` builds from it is matched against the
 * installed plugin by string, so a rename that reaches only one of the two files produces a settings
 * file that is valid, committed, and enables nothing.
 *
 * `generators/claudeContext.ts` renders it into the task-offer template's `{{pluginName}}` for the
 * same reason: the `<plugin>:branch-prompt` skill that file's answer-1 path invokes is that name, and
 * a shipped literal there would survive a rename in every adopter's checkout with nothing reporting it.
 */
export const PLUGIN_NAME = 'autonomous-sdlc-harness';

/**
 * The analyze command as every line addressing the adopter names it, plugin-qualified.
 *
 * `docs/development.md` → `## 5. Verifying a change` → gate 6 records the spelling rule.
 */
export const ANALYZE_COMMAND = `/${PLUGIN_NAME}:harness-analyze`;
