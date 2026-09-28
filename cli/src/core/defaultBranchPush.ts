/**
 * The push to the default branch an adopter makes on purpose during setup, and why it skips the hook.
 *
 * **The rule this module exists to enforce: the spelling of the default-branch setup push and the
 * reason it skips the hook live here and nowhere else in `cli/src`**, so `init`'s note and `doctor`'s
 * remedies cannot drift apart. It only spells a command for a person to run: it invokes no `git`, and
 * imports nothing from above `core/`.
 */

/** `git push --no-verify origin <branch>` — no backticks, no trailing punctuation. */
export function defaultBranchPushCommand(branch: string): string {
  return `git push --no-verify origin ${branch}`;
}

/** Why {@link defaultBranchPushCommand} carries `--no-verify`, as one sentence. */
export function defaultBranchPushReason(branch: string): string {
  return `\`--no-verify\` skips the \`pre-push\` hook \`init\` installed, which refuses a push to \`${branch}\`; this push is yours to make on purpose, and the harness never makes it.`;
}
