/**
 * Generator: the dynamic half of the unattended profile's `sandbox` block, and the expected values
 * `doctor` grades a profile on disk against.
 *
 * **The rule this module exists to enforce: no command runs outside the sandbox unless this module
 * names it, and it names only a file the sandbox cannot write.** An excluded command runs with full
 * access, so the one spelling excluded per script is the main checkout's own copy by absolute path —
 * never the repo-relative or sibling-worktree spelling, whose file a sandboxed command can rewrite.
 * Which scripts are excluded is the outer-loop table's `runsUnsandboxed` flag, and
 * the path is `outerLoopScriptPath`'s, the same producer the write protection builds its denied path
 * through, so the file that runs unsandboxed and the file that cannot be written are one string.
 *
 * The static half — the strict-mode booleans, the empty lists, the state directory's write grant,
 * the credentials block — is the shipped template's, which {@link shippedSandboxSettings} reads rather
 * than restating. The template is also the one list of credential paths: the file tools run outside
 * the sandbox, so {@link applySandbox} derives a `Read` deny pair per path from it rather than from a
 * second copy here.
 */

import { join } from 'node:path';

import {
  browserWiringApplies,
  CONFIG_FILENAME,
  sandboxAllowedDomains,
  sandboxOptedOut,
  type HarnessConfig,
} from '../config/model.js';
import { internal } from '../core/errors.js';
import { appendUnique, isJsonObject, listAt, objectAt, type JsonObject, type JsonValue } from '../core/json.js';
import { homeRoot, readTemplate } from '../core/paths.js';
import { OUTER_LOOP_SCRIPTS, outerLoopRelativePath, outerLoopScriptPath } from './outerLoopScripts.js';
import { appendReadme, assertUsableInEntry, bashScriptRule, sandboxExcludedCommand, TEMPLATE_PATH } from './profileEntries.js';

/** The profile's top-level key for the sandbox block. */
export const SANDBOX_KEY = 'sandbox';

/** The `_README` line prefix an opted-out profile carries, which `doctor` reads the opt-out by. */
export const SANDBOX_OPT_OUT_MARKER = "THE SANDBOX IS OFF BY THIS REPOSITORY'S OWN CHOICE";

/**
 * The network allowlist entry the interactive-test phase needs: a hostname that resolves only to
 * loopback is refused unless the IP itself is listed.
 */
export const LOOPBACK_ALLOWED_HOST = '127.0.0.1';

/** A `sandbox.credentials.files` path relative to the home directory, capturing the rest. */
const HOME_RELATIVE = /^~\/(.+)$/;

/** The `_README` line prefix one allowed domain is explained under. */
const ALLOWED_DOMAIN_README = 'ALLOWED DOMAIN';

/**
 * The template's `sandbox` boolean leaves `doctor` grades, as dotted paths under {@link SANDBOX_KEY}.
 * `network.allowLocalBinding` is left out: it is a macOS convenience for binding loopback, and an
 * adopter turning it off weakens nothing.
 */
const GRADED_SETTINGS: readonly string[] = Object.freeze([
  'enabled',
  'failIfUnavailable',
  'allowUnsandboxedCommands',
  'autoAllowBashIfSandboxed',
  'network.strictAllowlist',
]);

/** What a profile generated for this repository's configuration carries in its sandbox block. */
export interface ExpectedSandbox {
  readonly optedOut: boolean;
  readonly optOutReason?: string;
  readonly excludedCommands: readonly string[];
  /** The `Bash(…)` spelling earlier releases generated; index `i` is the stale form of `excludedCommands[i]`. */
  readonly staleExcludedCommands: readonly string[];
  readonly allowedDomains: readonly string[];
}

/** What {@link expectedSandbox} and {@link applySandbox} read. */
interface SandboxInput {
  readonly repoRoot: string;
  readonly config: HarnessConfig;
}

/**
 * The sandbox block's configuration-dependent values: one excluded command per
 * `runsUnsandboxed` row of the outer-loop table, in the `sandboxExcludedCommand` form
 * `bash <path>:*` — never the `Bash(…)` rule form, which matches no call there and leaves the
 * wrapper sandboxed — with that `bashScriptRule` spelling kept as the stale list `doctor` reports;
 * and the configured domains in order, then {@link LOOPBACK_ALLOWED_HOST} when the browser wiring
 * applies, de-duplicated.
 */
export function expectedSandbox({ repoRoot, config }: SandboxInput): ExpectedSandbox {
  const wrapperPaths = OUTER_LOOP_SCRIPTS.filter((script) => script.runsUnsandboxed === true).map((script) =>
    outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(script)),
  );
  const domains = sandboxAllowedDomains(config).map(({ domain }) => domain);
  if (browserWiringApplies(config)) domains.push(LOOPBACK_ALLOWED_HOST);
  const optedOut = sandboxOptedOut(config);
  const reason = config.sandbox?.optOut?.reason;

  return {
    optedOut,
    ...(optedOut && typeof reason === 'string' ? { optOutReason: reason.trim() } : {}),
    excludedCommands: wrapperPaths.map(sandboxExcludedCommand),
    staleExcludedCommands: wrapperPaths.map(bashScriptRule),
    allowedDomains: [...new Set(domains)],
  };
}

/** The internal fault for a template that lost the `path` object, worded as `described`. */
function noObject(described: string, path: readonly string[]): () => Error {
  return () => internal(`${described} has no \`${path.join('.')}\` object`);
}

/** The internal fault for a template that lost the list at the dotted `where`. */
function noList(where: string): () => Error {
  return () => internal(`the permission-profile template has no \`${where}\` list`);
}

/**
 * The shipped template's graded `sandbox` boolean leaves, as dotted paths under {@link SANDBOX_KEY}
 * with their values — read from the template the way `doctor` reads the deny floor, so no second
 * copy of the values exists.
 */
export function shippedSandboxSettings(): readonly { readonly path: string; readonly value: boolean }[] {
  const described = `the permission-profile template ${TEMPLATE_PATH}`;
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(readTemplate(TEMPLATE_PATH)) as JsonValue;
  } catch (error) {
    throw internal(`${described} is not valid JSON (${error instanceof Error ? error.message : String(error)})`);
  }
  if (!isJsonObject(parsed)) throw internal(`${described} is not a JSON object`);
  const sandbox = objectAt(parsed, [SANDBOX_KEY], noObject(described, [SANDBOX_KEY]));

  return GRADED_SETTINGS.map((dotted) => {
    const segments = dotted.split('.');
    const leaf = segments.pop() as string;
    const value = objectAt(sandbox, segments, noObject(`${described}'s \`${SANDBOX_KEY}\``, segments))[leaf];
    if (typeof value !== 'boolean') throw internal(`${described}'s \`${SANDBOX_KEY}.${dotted}\` is not a boolean`);
    return { path: `${SANDBOX_KEY}.${dotted}`, value };
  });
}

/**
 * The file-tool half of the credential denial: for each `~/`-relative path, a `Read` deny for the
 * path and one for everything under it, in the `//` absolute form with `home` in place of `~`. No
 * `Read(~/…)` form is emitted: the profile defines only the `//` and `/` prefixes. A path without the
 * `~/` prefix is an internal fault, since the shipped template is the only source.
 */
export function credentialReadDenyRules(input: {
  readonly home: string;
  readonly files: readonly string[];
}): readonly string[] {
  return input.files.flatMap((path) => {
    const rest = HOME_RELATIVE.exec(path)?.[1];
    if (rest === undefined) {
      throw internal(
        `the permission-profile template's \`${SANDBOX_KEY}.credentials.files\` entry ${JSON.stringify(path)} is not relative to the home directory`,
      );
    }
    const absolute = join(input.home, rest);
    return [`Read(/${absolute})`, `Read(/${absolute}/**)`];
  });
}

/** The `path` of every `sandbox.credentials.files` entry in the rendered profile. */
function credentialFilePaths(sandbox: JsonObject): readonly string[] {
  const credentials = objectAt(sandbox, ['credentials'], noObject(`the permission-profile template's \`${SANDBOX_KEY}\``, ['credentials']));
  return listAt(credentials, ['files'], noList(`${SANDBOX_KEY}.credentials.files`)).map((entry) => {
    const path = isJsonObject(entry) ? entry['path'] : undefined;
    if (typeof path !== 'string') {
      throw internal(`the permission-profile template has a \`${SANDBOX_KEY}.credentials.files\` entry with no string \`path\``);
    }
    return path;
  });
}

/**
 * Fill the rendered profile's sandbox block for this configuration, in place: the excluded commands
 * and the allowed domains, one `_README` line per allowed domain with its reason, and — when the
 * configuration takes the opt-out — `enabled: false` and `failIfUnavailable: false` with a marker
 * line. Everything else stays under an opt-out, the `deny` entries included, and so do the
 * credential `Read` denies appended to `permissions.deny`: the file tools run outside the sandbox, so those hold with it off.
 *
 * Every configured domain is screened first, with the adopter-fixable code: it is the adopter's
 * value, and the generated-entry check after it would bill it to this CLI. The home directory is
 * screened the same way: it is this machine's, not a value this CLI produced.
 */
export function applySandbox(profile: JsonObject, { repoRoot, config }: SandboxInput): void {
  const configured = sandboxAllowedDomains(config);
  for (const { domain } of configured) {
    assertUsableInEntry(
      domain,
      `the configured sandbox.allowedDomains entry ${JSON.stringify(domain)}`,
      `Set it in ${CONFIG_FILENAME} to a bare host name, then run init again`,
    );
  }

  const home = homeRoot();
  assertUsableInEntry(
    home,
    `the home directory ${JSON.stringify(home)}, which the credential \`Read\` denies are built from`,
    'Run init from an account whose home directory path carries none of those characters',
  );

  const expected = expectedSandbox({ repoRoot, config });
  const template = 'the permission-profile template';
  const sandbox = objectAt(profile, [SANDBOX_KEY], noObject(template, [SANDBOX_KEY]));
  appendUnique(listAt(sandbox, ['excludedCommands'], noList(`${SANDBOX_KEY}.excludedCommands`)), expected.excludedCommands);
  const network = objectAt(sandbox, ['network'], noObject(`${template}'s \`${SANDBOX_KEY}\``, ['network']));
  appendUnique(listAt(network, ['allowedDomains'], noList(`${SANDBOX_KEY}.network.allowedDomains`)), expected.allowedDomains);
  const permissions = objectAt(profile, ['permissions'], noObject(template, ['permissions']));
  appendUnique(
    listAt(permissions, ['deny'], noList('permissions.deny')),
    credentialReadDenyRules({ home, files: credentialFilePaths(sandbox) }),
  );

  const explained = new Set<string>();
  for (const { domain, reason } of configured) {
    if (explained.has(domain)) continue;
    explained.add(domain);
    appendReadme(profile, `${ALLOWED_DOMAIN_README} ${domain}: ${reason}`);
  }
  if (expected.allowedDomains.includes(LOOPBACK_ALLOWED_HOST) && !explained.has(LOOPBACK_ALLOWED_HOST)) {
    appendReadme(
      profile,
      `${ALLOWED_DOMAIN_README} ${LOOPBACK_ALLOWED_HOST}: the interactive-test phase drives a browser against a dev server on loopback, and a hostname that resolves only to loopback is refused unless the IP itself is listed.`,
    );
  }

  if (expected.optedOut) {
    sandbox['enabled'] = false;
    sandbox['failIfUnavailable'] = false;
    appendReadme(
      profile,
      `${SANDBOX_OPT_OUT_MARKER}: ${(expected.optOutReason ?? '').replace(/\.$/, '')}. Every Bash command an unattended run issues runs unsandboxed; \`failIfUnavailable\` is false with it, so a platform with no supported sandbox still starts; every \`deny\` entry still applies. To undo it, delete sandbox.optOut from ${CONFIG_FILENAME} and regenerate this file with \`npx autonomous-sdlc-harness init --force\`, which keeps a .bak of this one.`,
    );
  }
}
