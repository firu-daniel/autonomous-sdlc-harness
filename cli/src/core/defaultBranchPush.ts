/**
 * The push to the default branch an adopter makes on purpose during setup, why it skips the hook, and
 * the `gh` token-scope step that must precede it when what it pushes is a workflow file.
 *
 * Owns: {@link defaultBranchPushCommand} and {@link defaultBranchPushReason}, and
 * {@link WORKFLOW_SCOPE_COMMAND} and {@link WORKFLOW_SCOPE_REASON}.
 *
 * **The rule this module exists to enforce: the spelling of the default-branch setup push, the reason
 * it skips the hook, and the spelling and reason of the `workflow`-scope step that precedes a
 * workflow-file push live here and nowhere else in `cli/src`**, so `init`'s note and `doctor`'s
 * remedies cannot drift apart. It only spells commands for a person to run: it invokes no `git` or
 * `gh`, and imports nothing from above `core/`.
 */

/** `git push --no-verify origin <branch>` — no backticks, no trailing punctuation. */
export function defaultBranchPushCommand(branch: string): string {
  return `git push --no-verify origin ${branch}`;
}

/** Why {@link defaultBranchPushCommand} carries `--no-verify`, as one sentence. */
export function defaultBranchPushReason(branch: string): string {
  return `\`--no-verify\` skips the \`pre-push\` hook \`init\` installed, which refuses a push to \`${branch}\`; this push is yours to make on purpose, and the harness never makes it.`;
}

/** Adds the `workflow` scope to the `gh` token — no backticks, no trailing punctuation. */
export const WORKFLOW_SCOPE_COMMAND = 'gh auth refresh -s workflow';

/** Why {@link WORKFLOW_SCOPE_COMMAND} precedes a workflow-file push, as one sentence. */
export const WORKFLOW_SCOPE_REASON =
  'The `workflow` scope is what a `gh` token needs to push a `.github/workflows` file over HTTPS.';
