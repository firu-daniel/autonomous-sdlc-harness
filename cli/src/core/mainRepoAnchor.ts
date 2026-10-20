/**
 * The main checkout's anchor: the one environment variable naming it, the one command that reads
 * it, and the one permission rule that lets an unattended run make that read.
 *
 * **The rule this module exists to enforce: the main checkout's anchor has one name, and it is
 * declared here.** The launcher sets it, the plugin's readers read it with the one literal command
 * {@link MAIN_REPO_ANCHOR_READ}, and **no unsandboxed outer-loop script reads it**: an assignment
 * prefix on an excluded call could set it, so a script running outside the sandbox would be trusting
 * a value any caller can choose. The name is spelled here and nowhere else in `cli/src`
 * (`grep -rn HARNESS_MAIN_REPO cli/src`); every other module takes it through an import.
 *
 * The mirrors outside that scope, which cannot import and must spell the same literal —
 * `git grep -n HARNESS_MAIN_REPO`, run from the repository root, reaches all of them, together with
 * the worked example's rendered profile and the documents that quote the name:
 *
 * - `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`'s
 *   `export HARNESS_MAIN_REPO="$MAIN_REPO"`, which sets it for every session the watcher launches;
 * - `plugin/hooks/lib/harness-config-lib.sh` → `hc_main_root`;
 * - the plugin's `<MAIN_REPO>` resolution row and clause, which are prose.
 */

/** The environment variable the watcher sets to the main checkout's absolute root. */
export const MAIN_REPO_ANCHOR_VARIABLE = 'HARNESS_MAIN_REPO';

/** The one command a plugin reader runs to read the anchor: bare, so one literal rule matches it. */
export const MAIN_REPO_ANCHOR_READ = `printenv ${MAIN_REPO_ANCHOR_VARIABLE}`;

/** The `permissions.allow` rule for that read — exact, with no `:*`, so it matches the bare read and nothing else. */
export const MAIN_REPO_ANCHOR_RULE = `Bash(${MAIN_REPO_ANCHOR_READ})`;
