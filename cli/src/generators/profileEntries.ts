/**
 * Generator primitives: the unattended permission profile's paths and the entry-level building
 * blocks every module that writes into the profile shares — the rationale block, the entry screen,
 * the wrapper-script rule form and the root normalisation.
 *
 * **The rule this module exists to enforce: it imports no generator that writes into the profile.**
 * `permissionProfile.ts` calls `sandboxProfile.ts` and `writeProtection.ts`, and both need these
 * primitives; holding them here, below all three, keeps every edge between those modules one-way, so
 * a binding imported from here may be read while a module is being evaluated. A primitive that would
 * need to import one of them back does not belong here.
 */

import { join } from 'node:path';

import { HarnessError, internal } from '../core/errors.js';
import type { JsonObject } from '../core/json.js';

/**
 * The template's home under `cli/templates/`, addressed as `core/paths.ts`'s `readTemplate` wants it.
 *
 * Exported for the same reason {@link QA_TEMPLATE_PATH} is: the shipped template is the single
 * declaration of the profile's own floor, and `doctor` compares an adopter's `permissions.deny`
 * against it rather than keeping a second copy of the entries that must be there
 * (`doctor/checks.ts`).
 */
export const TEMPLATE_PATH = 'claude/settings.autonomous.json';

/**
 * The interactive-test fragment, merged into the base only when the phase is on and its driver is
 * the browser one — see `permissionProfile.ts`'s module header.
 *
 * A **partial** profile. It is stored beside the base under the same dot-less directory, and neither
 * file is ever named with the adopter's leading dot inside this repository
 * (`cli/templates/claude/README.md`).
 *
 * Exported because the fragment's `enabledMcpjsonServers` list is the single declaration of which
 * browser servers a run starts, and the generator that writes the repository's own MCP wiring
 * checks its declared servers against it rather than keeping a second copy of the names
 * (`generators/repoRoot.ts`).
 */
export const QA_TEMPLATE_PATH = 'claude/settings.autonomous.qa.json';

/**
 * The docs-retrieval fragment, merged into the base only when `phases.docs` and `docs.retrieval` are
 * both on — see `permissionProfile.ts`'s module header.
 *
 * Exported for the reason {@link QA_TEMPLATE_PATH} is: its `enabledMcpjsonServers` list is the
 * declaration `generators/repoRoot.ts` checks the retrieval half of `.mcp.json` against.
 */
export const RETRIEVAL_TEMPLATE_PATH = 'claude/settings.autonomous.retrieval.json';

/** The adopter-side directory the rendered profile lands in. The dot is added here, at `init` time. */
const CLAUDE_DIR = '.claude';

/**
 * Where the rendered profile is written, relative to the adopting repository's root — and the path
 * an unattended run names in its own `--settings` flag.
 *
 * Exported because more than one caller has to say it: `init`'s summary points at it, and `doctor`
 * checks that the file is there and that the absolute paths inside it still resolve.
 */
export const PROFILE_PATH = `${CLAUDE_DIR}/settings.autonomous.json`;

/** The profile's rationale block: the array every generated explanation is appended to. */
export const README_KEY = '_README';

/** The interpreter every wrapper invocation starts with, per `scripts.ts`'s `wrapperInvocation`. */
export const INVOCATION_PREFIX = 'bash ';

/**
 * What may never appear in a permission entry, and how a message names it.
 *
 * The quote characters are failure mode 1 and the operators are failure mode 2 of
 * `permissionProfile.ts`'s module header. `$` is on the list for the same reason as the operators: a
 * substitution is a different string to whatever the guard matched, so an entry containing one
 * cannot be relied on to match anything. `///` is the third: a file rule marks an absolute path with
 * a `//` prefix and the substituted path brings its own leading slash, so a template row that adds a
 * second one produces a rule that silently matches no file — the same class of failure as a missed
 * worktree glob, and just as quiet.
 */
export const FORBIDDEN_IN_ENTRY: ReadonlyArray<readonly [needle: string, described: string]> = Object.freeze([
  ['///', 'a third slash on the `//` absolute-path prefix, which leaves a rule matching no file'],
  ['"', 'a double quote'],
  ["'", 'a single quote'],
  ['`', 'a backquote'],
  ['&', 'a shell operator (&)'],
  [';', 'a shell operator (;)'],
  ['|', 'a shell operator (|)'],
  ['$', 'a shell substitution ($)'],
  ['>', 'a shell redirect (>)'],
  ['<', 'a shell redirect (<)'],
  ['\n', 'a newline'],
] as const);

/**
 * {@link FORBIDDEN_IN_ENTRY} minus its `///` row, which is about a **file** rule's `//` absolute-path
 * prefix and says nothing about a command entry. Every other row applies to both.
 */
const FORBIDDEN_IN_COMMAND = FORBIDDEN_IN_ENTRY.filter(([needle]) => needle !== '///');

/** The fix for a *command* value: the one place a command carrying shell syntax can still live. */
const COMMAND_REMEDY =
  "Take it out of the value, or put the command in a wrapper script and let that script's literal path be what is allow-listed";

/**
 * Refuse an adopter-supplied value that cannot be made into an entry the guard will match.
 *
 * The same shapes `permissionProfile.ts`'s `assertRunnable` catches, raised **before** the entry is
 * built and with the ordinary exit code: a toolchain path, a configured command or a configured
 * directory carrying a quote or a shell operator is a repository-side mistake with a repository-side
 * fix, not the packaging fault that check reports. `remedy` is what makes the message actionable,
 * and it differs per value — a command moves into a wrapper, a directory is renamed — so it is the
 * caller's.
 */
export function assertUsableInEntry(value: string, described: string, remedy: string = COMMAND_REMEDY): void {
  for (const [needle, why] of FORBIDDEN_IN_COMMAND) {
    if (!value.includes(needle)) continue;
    throw new HarnessError(
      `${described} contains ${why}, and the permission guard matches an entry literally: an entry built from it would match neither allow nor deny, so an unattended run's call would be refused. ${remedy}`,
    );
  }
}

/** Append a generated line to the profile's rationale block. */
export function appendReadme(profile: JsonObject, line: string): void {
  const readme = profile[README_KEY];
  if (!Array.isArray(readme)) {
    throw internal(
      `the permission-profile template has no \`${README_KEY}\` list, so a generated group of entries could not be explained in the file it was written into`,
    );
  }
  readme.push(line);
}

/**
 * A `sandbox.excludedCommands` entry, `bash <path>:*` — the one producer of one.
 *
 * Measured in `docs/sandbox-verification.md` rows P1a and P2 (Claude Code 2.1.299, macOS, headless):
 * `bash <path>:*` excludes a call that carries an argument, and the push it excluded landed. The
 * `Bash(…)` rule form must never be used there: it matches nothing, so the wrapper runs sandboxed.
 */
export function sandboxExcludedCommand(absolutePath: string): string {
  return `${INVOCATION_PREFIX}${absolutePath}:*`;
}

/**
 * A wrapper-script rule, in the unquoted `Bash(bash <path>:*)` form every generated one uses — and
 * the other plugin-root form, for a helper under the plugin's own scripts directory. Same consumers,
 * and the same decision, as `permissionProfile.ts`'s `readRule`. Built from
 * {@link sandboxExcludedCommand} only because the two share `bash <path>:*` today; its output is
 * byte-identical to the `Bash(bash <path>:*)` literal it replaced. The two follow separate grammars —
 * this one the `permissions.allow` rule grammar, that one a measured excluded-command pattern — and
 * `profile.test.mjs` pins each on its own, so a change to either fails a test rather than moving the
 * other.
 */
export function bashScriptRule(absolutePath: string): string {
  return `Bash(${sandboxExcludedCommand(absolutePath)})`;
}

/**
 * A directory in the one spelling `permissionProfile.ts`'s `isUnderDirectory` compares against: no
 * trailing separator, no `.` or `..` segment. Exported so the normalisation the predicate assumes is
 * stated once rather than at each root a caller happens to resolve.
 */
export function normalizedRoot(path: string): string {
  return join(path, '.');
}
