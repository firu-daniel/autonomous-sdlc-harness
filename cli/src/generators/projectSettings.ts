/**
 * Generator: the adopting repository's committable `.claude/settings.json` — the project-scope
 * keys that make a teammate's clone resolve this harness's plugin without wiring anything by hand.
 *
 * **The rule this module exists to enforce: the two keys are written together or not at all.**
 * They were measured coming from two *different* commands — `enabledPlugins` from
 * `plugin install --scope project`, `extraKnownMarketplaces` from
 * `plugin marketplace add --scope project` — which is exactly why writing one of them reads like
 * the job is done while leaving the clone broken: `enabledPlugins` alone enables a plugin from a
 * marketplace the clone has never heard of, and the marketplace entry alone registers a source
 * nothing installs from. Committing both **is** the onboard-your-team step; there is no second
 * step a teammate performs.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **The identity is composed here, in one place, and the owner is parsed rather than written
 *    down.** {@link PLUGIN_NAME} comes from `core/pluginIdentity.ts`, which owns it for every area
 *    that prints a plugin-qualified command; it and {@link MARKETPLACE_NAME} mirror the two
 *    manifests named on them, and their composite is the key `enabledPlugins` is measured to use. The owner half of
 *    the slug comes from this CLI package's own `repository.url` — the one value that already has
 *    to be right for the package to be published — so no account name is hardcoded anywhere in
 *    the CLI, and a fork inherits its own.
 * 2. **An unresolved owner writes no `extraKnownMarketplaces` key at all**, rather than a key
 *    holding a placeholder. A placeholder in an adopter's *committed* settings is worse than the
 *    absence: it is a value that looks configured, survives review, and fails only at the moment a
 *    teammate tries to use it. The absence is instead reported — loudly, naming the flag that
 *    fixes it now — and `doctor` reports it again on every later run.
 * 3. **`merge-json`, missing keys only.** `.claude/settings.json` is shared with tooling this
 *    harness knows nothing about, and an adopter's file may already carry permissions, hooks or
 *    model settings. Nothing existing is overwritten, reordered or removed; a second `init` adds
 *    nothing and the write engine reports the file as `kept` rather than silently no-oping
 *    (`core/writer.ts`).
 *
 * ## The entry's shape, and how it was measured
 *
 * {@link marketplaceEntry} writes
 * `{ "<marketplace>": { "source": { "source": "github", "repo": "<owner>/<repo>" } } }`: `source`
 * is an **object**, and the `"github"` discriminator sits inside it. Measured on Claude Code
 * 2.1.246 by running `claude plugin marketplace add <owner>/<repo> --scope project` in a throwaway
 * repository and reading back the `.claude/settings.json` it wrote, cross-checked against the
 * directory-source entry the same command writes into user settings. A settings file carrying the
 * two inner fields at the entry's top level is *ignored* with a `Settings Warning`, so the clone
 * enables a plugin from a marketplace it was never told about.
 *
 * That shape was assumed until an adopter met it, on the reasoning that `marketplace add` rejects
 * `file://` — it does (`docs/development.md` §1) — and so the story could not be rehearsed
 * offline. **The second half never followed from the first.** The authority was never a published
 * repository — it is whatever `marketplace add` writes into a settings file, and a *directory*
 * source is one of the accepted forms and answers the nesting question identically. It was
 * measurable offline the whole time. The superseded paragraph here also promised
 * {@link marketplaceEntry} was the only thing a correction would touch; that proved false too,
 * because `doctor`'s `plugin-wiring` check and two `cli/test/init.test.mjs` assertions had
 * encoded the same shape and changed with it. `doctor` no longer holds a copy:
 * {@link marketplaceEntryDefect} is what it asks, so the next correction here reaches it.
 *
 * ## A third, independent key: the change-request fence's allow rule
 *
 * {@link PERMISSIONS_KEY}.{@link ALLOW_KEY} carries {@link taskOfferCheckRule} — the exact rule the
 * fence's bare opt-out check matches, built by its one producer rather than here. It is outside the
 * written-together rule above: it neither needs nor completes the plugin keys. It lives in this
 * committed file because every teammate's interactive session runs the fence, and an unallowed
 * check prompts mid-fence; the unattended profile is machine-local and the fence's tool clause
 * already excludes unattended runs, so it gets no allow entry. Under choice 3 an existing `allow`
 * list is a leaf and is never edited: where one lacks the rule — or `permissions` / its `allow` is
 * of another type — {@link writeProjectSettings} warns, naming the rule to add by hand. `doctor`
 * holds no copy of that grading: {@link allowRuleState} is what both ask.
 *
 * The generator reads this package's own manifest and the adopter's existing `.claude/settings.json`
 * — the latter only to decide whether to warn about an existing `permissions.allow` list — and
 * mutates nothing: the plan stays a `merge-json` request that `init` applies once.
 */

import { createRequire } from 'node:module';
import { join } from 'node:path';

import type { HarnessConfig } from '../config/model.js';
import { HarnessError, internal } from '../core/errors.js';
import { isJsonObject, readJsonFile, stringsAt, type JsonObject, type JsonValue } from '../core/json.js';
import { packageRoot, parseRepoSlug } from '../core/paths.js';
import { PLUGIN_NAME } from '../core/pluginIdentity.js';
import type { WritePlan } from '../core/writer.js';
import { taskOfferCheckRule } from './outerLoopScripts.js';
import { PROFILE_PATH } from './profileEntries.js';

/** The marketplace's name, mirroring `.claude-plugin/marketplace.json`'s `name`. */
export const MARKETPLACE_NAME = 'autonomous-sdlc-harness';

/**
 * The key `enabledPlugins` holds — `<plugin>@<marketplace>`, the composite a project-scope
 * install writes.
 *
 * Exported because `doctor` checks for this exact string and the fixture tests assert it; each of
 * them re-deriving it from the two names would be a third place the composition rule lives.
 *
 * The plugin and the marketplace deliberately carry the same name, so the composite reads
 * `autonomous-sdlc-harness@autonomous-sdlc-harness`; the doubling is correct and must not be
 * collapsed.
 */
export const PLUGIN_KEY = `${PLUGIN_NAME}@${MARKETPLACE_NAME}`;

/** The key written by a project-scope `plugin install`. */
export const ENABLED_PLUGINS_KEY = 'enabledPlugins';

/** The key written by a project-scope `plugin marketplace add`. */
export const MARKETPLACES_KEY = 'extraKnownMarketplaces';

/**
 * The key path the fence's allow rule is written under, `permissions.allow`. Exported so `doctor`
 * descends through these rather than through literals of its own.
 */
export const PERMISSIONS_KEY = 'permissions';
export const ALLOW_KEY = 'allow';

/** The inner `source` discriminator for a marketplace published as a repository — see the header. */
const MARKETPLACE_SOURCE = 'github';

/**
 * The two key names the entry is built from: the outer one holding the nested object, and the inner
 * one holding the slug. The outer `source` key and the inner discriminator share a spelling, which
 * is exactly the collision a flattened copy of this shape loses — so both are named once here and
 * every reader of the shape descends through these rather than through literals of its own.
 */
const MARKETPLACE_SOURCE_KEY = 'source';
const MARKETPLACE_REPO_KEY = 'repo';

/** The adopter-side directory the settings file lands in. The dot is added here, at `init` time. */
const CLAUDE_DIR = '.claude';

/**
 * Where the file is written, relative to the adopting repository's root.
 *
 * Exported because more than one caller says it: `init`'s summary points at it as the file to
 * commit, and `doctor` reads it to check that both keys are still there.
 */
export const SETTINGS_PATH = `${CLAUDE_DIR}/settings.json`;

/** The adopter's local settings file; never written here, named so `writeProtection.ts` can protect it. */
export const SETTINGS_LOCAL_PATH = `${CLAUDE_DIR}/settings.local.json`;

/**
 * The flag that supplies the slug when this package's manifest cannot, and the shape it takes —
 * which is also the shape a parsed manifest URL has to match.
 *
 * Both are exported because `init`'s closing report names them in the same breath the warning below
 * does, on the same unresolved-slug run: a second copy of either literal there could drift from the
 * line an adopter reads a few lines earlier.
 */
export const MARKETPLACE_FLAG = '--marketplace';

export const SLUG_SHAPE = '<owner>/<repo>';

/**
 * A hosted account name: alphanumeric, single inner hyphens permitted, no leading or trailing one.
 *
 * This is the whole of how an unresolved owner is detected, and it is deliberately a **shape**
 * check rather than a comparison against the placeholder literal: a manifest that has been
 * half-filled, templated differently, or left with angle brackets all fail the same way, and the
 * CLI never has to carry a copy of the placeholder text to recognise it.
 */
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

/** A repository name: the character set a hosted repository is allowed to use. */
const REPO_PATTERN = /^[A-Za-z0-9._-]+$/;

/** The CLI's own manifest, read for its `repository.url` and nothing else. */
interface PackageManifest {
  /** npm accepts both the shorthand string and the object form; this package uses the object. */
  readonly repository?: string | { readonly url?: string };
}

/**
 * `require` for this module, so the CLI's own manifest can be read the same way `cli.ts` reads it
 * for `--version` — deliberately not a static JSON import, which under `rootDir: "src"` would drag
 * the manifest into `dist/`.
 */
const requireFromHere = createRequire(import.meta.url);

/**
 * This package's `repository.url`, in whichever of the two manifest forms it was written.
 *
 * The manifest is addressed as a path joined onto {@link packageRoot} rather than as the relative
 * specifier `cli.ts` uses: this module compiles one directory deeper, so a copied `../package.json`
 * would resolve to a file that does not exist, and `core/paths.ts` is the one place allowed to know
 * how deep the compiled tree is.
 */
function packageRepositoryUrl(): string | undefined {
  const manifestPath = join(packageRoot(), 'package.json');
  let manifest: PackageManifest;
  try {
    manifest = requireFromHere(manifestPath) as PackageManifest;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw internal(`this CLI's own manifest could not be read at ${manifestPath} (${detail})`);
  }

  const { repository } = manifest;
  if (typeof repository === 'string') return repository;
  return repository?.url;
}

/** True when both halves of a slug name something real rather than a placeholder. */
function isResolvedSlug(slug: string): boolean {
  const segments = slug.split('/');
  if (segments.length !== 2) return false;
  const [owner, repo] = segments as [string, string];
  return OWNER_PATTERN.test(owner) && REPO_PATTERN.test(repo);
}

/**
 * Normalise a slug given on the command line: a stray `.git` suffix or surrounding slashes are a
 * copy-paste artefact of the URL it was taken from, not a different repository.
 */
function normalizeSlug(value: string): string {
  return value
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.git$/, '');
}

/**
 * The `<owner>/<repo>` the marketplace is published from, or `undefined` when it is not yet known.
 *
 * The flag wins where it is given, and a malformed one is refused rather than written: an adopter
 * who mistypes it would otherwise commit a settings file naming a repository that does not exist,
 * which fails at a teammate's clone rather than at the run that caused it. A manifest URL that
 * carries no resolvable pair yields `undefined` — the state a fork with an unfilled manifest reaches,
 * not this package's, whose manifest names a resolved owner — and the caller degrades to the
 * one-key payload.
 */
function resolveSlug(flag: string | undefined): string | undefined {
  if (flag !== undefined) {
    const slug = normalizeSlug(flag);
    if (!isResolvedSlug(slug)) {
      throw new HarnessError(
        `${MARKETPLACE_FLAG} takes the marketplace repository as ${SLUG_SHAPE}, and ${JSON.stringify(flag)} is not that shape: it is written verbatim into the committed ${SETTINGS_PATH}, so a value that names no real repository would fail at a teammate's clone rather than here`,
      );
    }
    return slug;
  }

  const url = packageRepositoryUrl();
  if (url === undefined) return undefined;
  const parsed = parseRepoSlug(url);
  if (parsed === undefined || !isResolvedSlug(parsed)) return undefined;
  return parsed;
}

/** The `extraKnownMarketplaces` value for a resolved slug — the shape the header records measuring. */
function marketplaceEntry(slug: string): JsonObject {
  return {
    [MARKETPLACE_NAME]: {
      [MARKETPLACE_SOURCE_KEY]: { [MARKETPLACE_SOURCE_KEY]: MARKETPLACE_SOURCE, [MARKETPLACE_REPO_KEY]: slug },
    },
  };
}

/**
 * The entry an adopter retypes when they repair one by hand, rendered from {@link marketplaceEntry}
 * itself with {@link SLUG_SHAPE} standing in for the slug.
 *
 * Derived rather than written out, because the one consumer is `doctor`'s repair advice and a
 * hand-written example there would be a second spelling of the very shape it is grading.
 */
export const MARKETPLACE_ENTRY_SHAPE = JSON.stringify(marketplaceEntry(SLUG_SHAPE)[MARKETPLACE_NAME]);

/**
 * What is wrong with a committed `extraKnownMarketplaces` entry's **value**, or `undefined` when
 * nothing is.
 *
 * Exported because the header's shape is graded in a second place — `doctor`'s `plugin-wiring`
 * check — and a check that descended through the nesting for itself would be the second copy
 * choice 1 exists to prevent. The flattened shape is what a second copy drifts back into, and it is
 * the one this has to catch: the host tool ignores an entry carrying the two inner fields at the
 * top level, so the clone enables a plugin from a marketplace it was never told about.
 *
 * It grades the inner fields of one source name only — {@link MARKETPLACE_SOURCE}, the one this
 * generator writes. An entry naming any other source is graded to the nesting level and no
 * further: a `directory` source is what a contributor's own `marketplace add` from a clone writes
 * (`docs/development.md` §1), the host tool accepts it, and grading it against `repo` would
 * report a working wiring as malformed.
 *
 * The return is the **clause** naming what is wrong, not a whole message. The grade and the repair
 * routes belong to the caller: they turn on how `.claude/settings.json` is merged (choice 3) rather
 * than on what the shape is.
 */
export function marketplaceEntryDefect(entry: JsonValue | undefined): string | undefined {
  if (!isJsonObject(entry)) return `its value is ${JSON.stringify(entry ?? null)} rather than an object`;

  const source = entry[MARKETPLACE_SOURCE_KEY];
  if (source === undefined) return `it carries no \`${MARKETPLACE_SOURCE_KEY}\` key`;
  if (!isJsonObject(source)) {
    const flattened = Object.hasOwn(entry, MARKETPLACE_REPO_KEY)
      ? ` — the flattened shape, with \`${MARKETPLACE_SOURCE_KEY}\` and \`${MARKETPLACE_REPO_KEY}\` at the entry's own top level rather than inside a nested object`
      : '';
    return `its \`${MARKETPLACE_SOURCE_KEY}\` is ${JSON.stringify(source)} rather than an object${flattened}`;
  }

  const discriminator = source[MARKETPLACE_SOURCE_KEY];
  if (typeof discriminator !== 'string') {
    return `its \`${MARKETPLACE_SOURCE_KEY}.${MARKETPLACE_SOURCE_KEY}\` is ${JSON.stringify(discriminator ?? null)} rather than a source name such as \`${MARKETPLACE_SOURCE}\``;
  }

  // Only the source name this generator writes has a known inner field to grade. Another source
  // name is one the host tool accepts and this CLI did not write — a directory-sourced add from a
  // clone is the ordinary case (`docs/development.md` §1) — so the shape check stops here rather
  // than reporting a working entry as malformed.
  if (discriminator !== MARKETPLACE_SOURCE) return undefined;

  const repo = source[MARKETPLACE_REPO_KEY];
  if (typeof repo !== 'string') {
    return `its \`${MARKETPLACE_SOURCE_KEY}.${MARKETPLACE_REPO_KEY}\` is ${JSON.stringify(repo ?? null)} rather than a ${SLUG_SHAPE} string`;
  }
  return undefined;
}

/** The `init` flags this generator reads. The `init` flag surface owns parsing them. */
export interface ProjectSettingsFlags {
  /**
   * `--marketplace <owner>/<repo>`. Overrides the slug parsed from this package's manifest — and
   * is the way to write the marketplace entry before that manifest names a published repository.
   */
  readonly marketplace?: string;
}

/** Everything {@link buildProjectSettings} needs. */
export interface BuildProjectSettingsOptions {
  /** The config in effect; its `scriptsDir` decides the allow rule's invocation. */
  readonly config: HarnessConfig;
  readonly flags: ProjectSettingsFlags;
  /**
   * Sink for a line the adopter should see. Called rather than printed, so this stays a pure
   * assembler: {@link writeProjectSettings} collects into {@link ProjectSettingsResult.warnings}
   * and `init` forwards those to the reporter.
   */
  readonly warn?: (message: string) => void;
}

/** The merge payload, and the slug it was built from. */
export interface ProjectSettingsPayload {
  /** The object merged into `.claude/settings.json` — two keys, or three. */
  readonly settings: JsonObject;
  /** The resolved `<owner>/<repo>`, or `undefined` when the marketplace entry was skipped. */
  readonly marketplaceSlug: string | undefined;
}

/** Everything {@link writeProjectSettings} needs, beyond what {@link buildProjectSettings} takes. */
export interface ProjectSettingsOptions extends Omit<BuildProjectSettingsOptions, 'warn'> {
  /** The resolved repository root the file is written at. */
  readonly repoRoot: string;
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
}

/** What the generator produced, for `init`'s summary and for `doctor`. */
export interface ProjectSettingsResult {
  /** Absolute path of the settings file. */
  readonly path: string;
  /** The same path repo-relative — the file `init`'s summary tells the adopter to commit. */
  readonly repoPath: string;
  /** The composite key written under `enabledPlugins`. */
  readonly pluginKey: string;
  /** The `<owner>/<repo>` the marketplace entry names, or `undefined` when it was not written. */
  readonly marketplaceSlug: string | undefined;
  /** Things needing attention, one line each, for the reporter's `warn`. */
  readonly warnings: readonly string[];
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
}

/**
 * Assemble the merge payload: `enabledPlugins` always, `extraKnownMarketplaces` only when the
 * marketplace repository is known, then `permissions.allow` holding the fence's rule.
 *
 * Every key is top-level, so the write engine's action log names them individually — a first run
 * reports which keys it added and a second reports the file as kept, which is what makes "did this
 * re-run change anything?" answerable from the log rather than from a diff.
 */
export function buildProjectSettings({ config, flags, warn }: BuildProjectSettingsOptions): ProjectSettingsPayload {
  const report = warn ?? ((): void => {});
  const slug = resolveSlug(flags.marketplace);

  const settings: JsonObject = { [ENABLED_PLUGINS_KEY]: { [PLUGIN_KEY]: true } };

  if (slug === undefined) {
    report(
      `no ${MARKETPLACES_KEY} entry was written into ${SETTINGS_PATH}, because this harness package's own repository URL does not yet name a published account and repository: a teammate's clone will enable ${PLUGIN_KEY} from a marketplace it has never been told about, and will not resolve the plugin — re-run init with ${MARKETPLACE_FLAG} ${SLUG_SHAPE} to write the entry now`,
    );
  } else {
    settings[MARKETPLACES_KEY] = marketplaceEntry(slug);
  }

  settings[PERMISSIONS_KEY] = { [ALLOW_KEY]: [taskOfferCheckRule(config)] };
  return { settings, marketplaceSlug: slug };
}

/** Where an existing `.claude/settings.json` value leaves `rule` under {@link PERMISSIONS_KEY}.{@link ALLOW_KEY}. */
export type AllowRuleState =
  /** `permissions.allow` is a list holding the rule as a string element. */
  | 'present'
  /** Every value on the path is absent or an object, so `init`'s merge adds the rule. */
  | 'mergeable'
  /** `permissions.allow` is a list lacking the rule; `init` never edits it. */
  | 'list-without-rule'
  /** `permissions.allow` is present and not a list. */
  | 'allow-not-a-list'
  /** `permissions` is present and not an object. */
  | 'permissions-not-object'
  /** The file's top-level value is present and not an object; the merge refuses the whole file. */
  | 'settings-not-object';

/**
 * Classify `settings` — the parsed `.claude/settings.json`, `undefined` when absent — for `rule`.
 * The one owner of this grading: {@link writeProjectSettings} and `doctor`'s `task-offer-rules`
 * check both ask it.
 *
 * A value the merge can descend into is decided exactly as `core/json.ts` → `mergeMissing` decides
 * it: absent, or `isJsonObject`. Membership counts string elements only (`core/json.ts` → `stringsAt`).
 */
export function allowRuleState(settings: JsonValue | undefined, rule: string): AllowRuleState {
  if (settings === undefined) return 'mergeable';
  if (!isJsonObject(settings)) return 'settings-not-object';
  const permissions = settings[PERMISSIONS_KEY];
  if (permissions === undefined) return 'mergeable';
  if (!isJsonObject(permissions)) return 'permissions-not-object';
  const allow = permissions[ALLOW_KEY];
  if (allow === undefined) return 'mergeable';
  if (!Array.isArray(allow)) return 'allow-not-a-list';
  return stringsAt(allow).includes(rule) ? 'present' : 'list-without-rule';
}

/**
 * The warning for an existing `permissions` value the merge will not extend with `rule`, or
 * `undefined` when the merge adds the rule itself, it is already there, or the merge refuses the
 * whole file (the write engine reports that one).
 */
function existingAllowListWarning(existing: JsonValue | undefined, rule: string): string | undefined {
  const allowPath = `${PERMISSIONS_KEY}.${ALLOW_KEY}`;
  const byHand = `init never edits an existing list, so add that rule to ${allowPath} by hand, or the change-request fence's opt-out check prompts for permission in every interactive session`;

  switch (allowRuleState(existing, rule)) {
    case 'present':
    case 'mergeable':
    case 'settings-not-object':
      return undefined;
    case 'permissions-not-object':
      return `${SETTINGS_PATH} holds a ${PERMISSIONS_KEY} value that is not an object, so the rule ${rule} was not written: ${byHand}`;
    case 'allow-not-a-list':
      return `${SETTINGS_PATH} holds a ${allowPath} value that is not a list, so the rule ${rule} was not written: ${byHand}`;
    case 'list-without-rule':
      return `${SETTINGS_PATH} already holds a ${allowPath} list without the rule ${rule}: ${byHand}`;
  }
}

/**
 * Build the payload and enqueue it at {@link SETTINGS_PATH} under the `merge-json` contract.
 *
 * That contract is why this is a separate step from assembling. The target is a file the adopter
 * may already own and shares with other tooling, so the write adds absent keys and can do nothing
 * else — it cannot overwrite a value, delete a key or reorder what is already there
 * (`core/json.ts`). `--force` does not apply: there is nothing here that a backup would protect
 * against, because nothing is replaced.
 */
export function writeProjectSettings({ repoRoot, plan, config, flags }: ProjectSettingsOptions): ProjectSettingsResult {
  const warnings: string[] = [];

  const { settings, marketplaceSlug } = buildProjectSettings({
    config,
    flags,
    warn: (message) => warnings.push(message),
  });

  const path = join(repoRoot, SETTINGS_PATH);
  const allowWarning = existingAllowListWarning(readJsonFile(path), taskOfferCheckRule(config));
  if (allowWarning !== undefined) warnings.push(allowWarning);

  plan.add({
    path,
    policy: 'merge-json',
    content: settings,
    label: 'project-scope plugin wiring',
  });

  return {
    path,
    repoPath: SETTINGS_PATH,
    pluginKey: PLUGIN_KEY,
    marketplaceSlug,
    warnings,
    notes: [
      `${SETTINGS_PATH} is committed, and committing it is the whole of the plugin's onboarding step: a teammate clones the repository, opens it in the agent runner, accepts the workspace trust dialog, and the plugin resolves from these keys — run /reload-plugins if the session was already open. The config is committed too, but ${PROFILE_PATH} is not: it is machine-local and the managed .gitignore block ignores it, so the teammate then runs \`npx autonomous-sdlc-harness init\` once to generate theirs, and then doctor.`,
    ],
  };
}
