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
 *
 * **Import cycle, deliberate:** this module imports from `permissionProfile.ts`, whose
 * `renderProfile` calls {@link applySandbox}. Every binding imported from there is used at call time
 * only, never while either module is being evaluated; keep it that way.
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
import { isJsonObject, type JsonObject, type JsonValue } from '../core/json.js';
import { homeRoot, readTemplate } from '../core/paths.js';
import { OUTER_LOOP_SCRIPTS, outerLoopRelativePath, outerLoopScriptPath } from './outerLoopScripts.js';
import { appendReadme, assertUsableInEntry, bashScriptRule, TEMPLATE_PATH } from './permissionProfile.js';

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
  readonly allowedDomains: readonly string[];
}

/** What {@link expectedSandbox} and {@link applySandbox} read. */
interface SandboxInput {
  readonly repoRoot: string;
  readonly config: HarnessConfig;
}

/**
 * The sandbox block's configuration-dependent values: one excluded command per
 * `runsUnsandboxed` row of the outer-loop table, in the `bashScriptRule` form `permissions.allow`'s
 * repo-root-absolute spelling also takes; and the configured domains in order, then
 * {@link LOOPBACK_ALLOWED_HOST} when the browser wiring applies, de-duplicated.
 */
export function expectedSandbox({ repoRoot, config }: SandboxInput): ExpectedSandbox {
  const excludedCommands = OUTER_LOOP_SCRIPTS.filter((script) => script.runsUnsandboxed === true).map((script) =>
    bashScriptRule(outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(script))),
  );
  const domains = sandboxAllowedDomains(config).map(({ domain }) => domain);
  if (browserWiringApplies(config)) domains.push(LOOPBACK_ALLOWED_HOST);
  const optedOut = sandboxOptedOut(config);
  const reason = config.sandbox?.optOut?.reason;

  return {
    optedOut,
    ...(optedOut && typeof reason === 'string' ? { optOutReason: reason.trim() } : {}),
    excludedCommands,
    allowedDomains: [...new Set(domains)],
  };
}

/** The object at `path` under `root`, or an internal fault naming where the template lost its shape. */
function objectAt(root: JsonObject, path: readonly string[], described: string): JsonObject {
  let current: JsonValue | undefined = root;
  for (const key of path) {
    current = isJsonObject(current) ? current[key] : undefined;
  }
  if (!isJsonObject(current)) throw internal(`${described} has no \`${path.join('.')}\` object`);
  return current;
}

/** The list at `key` in `parent`, or an internal fault. */
function listAt(parent: JsonObject, key: string, where: string): JsonValue[] {
  const value = parent[key];
  if (!Array.isArray(value)) throw internal(`the permission-profile template has no \`${where}\` list`);
  return value;
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
  const sandbox = objectAt(parsed, [SANDBOX_KEY], described);

  return GRADED_SETTINGS.map((dotted) => {
    const segments = dotted.split('.');
    const leaf = segments.pop() as string;
    const value = objectAt(sandbox, segments, `${described}'s \`${SANDBOX_KEY}\``)[leaf];
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
  const credentials = objectAt(sandbox, ['credentials'], `the permission-profile template's \`${SANDBOX_KEY}\``);
  return listAt(credentials, 'files', `${SANDBOX_KEY}.credentials.files`).map((entry) => {
    const path = isJsonObject(entry) ? entry['path'] : undefined;
    if (typeof path !== 'string') {
      throw internal(`the permission-profile template has a \`${SANDBOX_KEY}.credentials.files\` entry with no string \`path\``);
    }
    return path;
  });
}

/** Append `values` to `list`, adding none twice. */
function appendUnique(list: JsonValue[], values: readonly string[]): void {
  for (const value of values) if (!list.includes(value)) list.push(value);
}

/**
 * Fill the rendered profile's sandbox block for this configuration, in place: the excluded commands
 * and the allowed domains, one `_README` line per allowed domain with its reason, and — when the
 * configuration takes the opt-out — `enabled: false` with a marker line. Everything else stays under
 * an opt-out, the `deny` entries included, and so do the credential `Read` denies appended to
 * `permissions.deny`: the file tools run outside the sandbox, so those hold with it off.
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
  const sandbox = objectAt(profile, [SANDBOX_KEY], 'the permission-profile template');
  appendUnique(listAt(sandbox, 'excludedCommands', `${SANDBOX_KEY}.excludedCommands`), expected.excludedCommands);
  const network = objectAt(sandbox, ['network'], `the permission-profile template's \`${SANDBOX_KEY}\``);
  appendUnique(listAt(network, 'allowedDomains', `${SANDBOX_KEY}.network.allowedDomains`), expected.allowedDomains);
  const permissions = objectAt(profile, ['permissions'], 'the permission-profile template');
  appendUnique(
    listAt(permissions, 'deny', 'permissions.deny'),
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
    appendReadme(
      profile,
      `${SANDBOX_OPT_OUT_MARKER}: ${(expected.optOutReason ?? '').replace(/\.$/, '')}. Every Bash command an unattended run issues runs unsandboxed; every \`deny\` entry still applies. To undo it, delete sandbox.optOut from ${CONFIG_FILENAME} and regenerate this file with \`npx autonomous-sdlc-harness init --force\`, which keeps a .bak of this one.`,
    );
  }
}
