/**
 * The typed in-memory model of `harness.config.json`, and the schema's own declared defaults.
 *
 * **The rule this module exists to enforce: this file mirrors `schemas/harness.config.schema.json`
 * key for key and invents nothing.** The schema is authoritative — it is what
 * `npm run validate:config` checks an adopter's file against — so a key here that is not there is
 * a key no config may legally carry, and a default here that disagrees with the schema's `default`
 * makes `init` generate a file whose values contradict its own documentation. Every field below
 * carries the schema's description condensed to one line, so the type is readable without opening
 * the schema, and every optional field is optional in the type for the same reason it is optional
 * there.
 *
 * **Edit this file in the same change as any schema edit**, together with `config/check.ts` and
 * `docs/config.md` §5's key reference — those four are one contract in four places.
 *
 * Paths: every string path in this model is **repo-relative** (`docs/config.md` §5), except
 * `$schema`, which resolves relative to the config file's own location, and
 * `parity.referenceImplPath`, which may be absolute. Both say so in their own doc comment.
 */

/** The config file's name, at the adopting repository's root. */
export const CONFIG_FILENAME = 'harness.config.json';

/** The only format version this release recognises — the schema's `version` const. */
export const CONFIG_VERSION = 1;

/** The verdict a layer-profile review reached, so a decline leaves a trace rather than nothing. */
export interface HarnessLayerReview {
  /** What the review decided about the detected profile. */
  verdict?: HarnessLayerReviewVerdict;
  /** One line saying why that verdict was reached, so a reader has the reasoning and not only the outcome. */
  rationale?: string;
  /** ISO `YYYY-MM-DD` date the review was recorded; a plain string, since nothing here parses it. */
  at?: string;
}

/** What stack detection concluded about this repository's layout, and what a review made of it. */
export interface HarnessDetection {
  /** The layer preset detection selected, in signal-table order. */
  preset?: HarnessPreset;
  /** Identifier of the detection-table row that matched, or `forced` when `--preset` bypassed the table. */
  signal?: string;
  /** What that row matched on. Absent under `--preset`, where no row was evaluated. */
  evidence?: string;
  /**
   * Which command family derived `commands.*` on the run that wrote this file — a
   * `COMMAND_FAMILY_IDS` value (`detect/presets.ts`), recorded because the family is selected
   * independently of {@link preset} and so cannot be read back off it. Written only where that
   * family derived at least one of `commands.typecheck` / `commands.test`, so it is absent exactly
   * where both required commands hold placeholders — whether because no family answered or because
   * the one that answered derived neither key. Optional like every other key here, and
   * never required: a config written before this key existed must still load and still take
   * `config set detection.review`.
   */
  commandFamily?: string;
  /** The layer-profile review's verdict, written by `/harness-analyze` through `config set detection.review`. */
  review?: HarnessLayerReview;
}

/** One architectural layer: the directory it owns, and the rules a dispatch against it loads. */
export interface HarnessLayer {
  /** Layer identifier used in task assignment and as the routing tag a dispatch carries: `^[a-z][a-z0-9-]*$`. */
  name: string;
  /** Repo-relative directory the layer's source lives in, compared against a change's file paths. */
  path: string;
  /** Repo-relative path to this layer's rules document, loaded before its implementer starts work. */
  conventions: string;
}

/** The shell commands the harness runs to verify a change. Only the two verifiers are required. */
export interface HarnessCommands {
  /** Static-analysis command that must exit zero before a change is considered complete, or `<none>` to state that this repository has no type check. */
  typecheck: string;
  /** Automated-test command that must exit zero before a change is considered complete. */
  test: string;
  /** Production build command. Omit when the project has no separate build step. */
  build?: string;
  /** Command that starts a local development server. Needed in practice only when QA is enabled. */
  devServer?: string;
  /** Command that installs dependencies into a fresh checkout, to prepare an isolated working copy. */
  depInstall?: string;
}

/** Which optional phases of the delivery flow run. Every phase defaults to off. */
export interface HarnessPhases {
  /** Run the interactive test phase, which drives the running application. Reads {@link HarnessQa}. */
  qa?: boolean;
  /** Run the documentation phase, which updates the maintained reference documents. Reads {@link HarnessDocs}. */
  docs?: boolean;
  /** Run the parity phase, which checks a change against a reference implementation. Reads {@link HarnessParity}. */
  parity?: boolean;
}

/** Settings for the interactive test phase. Read only when `phases.qa` is true. */
export interface HarnessQa {
  /** Which variant of the interactive test agent runs, and so how it reaches the application. */
  driver?: HarnessQaDriver;
  /** Port the phase serves its own instance on; keep it off the port a human uses day to day. */
  portSeed?: number;
  /** Repo-relative path to the gitignored test-account credentials file — the path, never the contents. */
  credentialsPath?: string;
  /** Which sign-in route the phase takes, when the application offers more than one. */
  authProvider?: string;
}

/** Settings for the documentation phase. Read only when `phases.docs` is true. */
export interface HarnessDocs {
  /** Repo-relative directory holding the maintained reference documents the phase keeps current. */
  root?: string;
  /** Turn on the local docs-retrieval search tool over `docs.root` and the conventions documents; legal only while `phases.docs` is true. */
  retrieval?: boolean;
}

/** Settings for the parity phase. Read only when `phases.parity` is true. */
export interface HarnessParity {
  /** Human-readable name of the implementation treated as the source of truth, as a finding should cite it. */
  referenceName?: string;
  /** **Absolute or** repo-relative path to a checkout of that reference implementation. */
  referenceImplPath?: string;
  /** Commands from the reference implementation's own toolchain, which an isolated copy may not have. */
  toolchainCommands?: string[];
}

/** The deploy command the generated wrapper runs, and what that command deploys to. */
export interface HarnessDeploy {
  /** Name of the hosting provider the deploy command talks to, recorded for a reader: nothing in this release reads it, and the generated wrapper carries no trace of it. */
  provider?: string;
  /** Which environment or site of that provider the deploy command deploys to; carried into the agent prompts that need the deploy identifier, not into the generated wrapper. */
  target?: string;
  /** The deploy command itself. Keep any identifier it needs out of this string when it is a secret. */
  command?: string;
}

/** Which design tool holds the project's design source of truth. Nothing in this release reads this section: it is recorded so a reader knows where the designs a change is built against live. */
export interface HarnessDesign {
  /** Which design tool the designs a change is built against live in; `none` means no design source at all. */
  source?: HarnessDesignSource;
}

/**
 * `harness.config.json`, in memory.
 *
 * Key order below is the schema's own, so a generator that fills this object top to bottom writes
 * a file whose key order matches `examples/harness.config.json`. Required keys are non-optional
 * here; optional keys are optional, and a reader that wants an optional key's effective value
 * falls back to {@link DEFAULTS} rather than re-deriving one.
 */
export interface HarnessConfig {
  /** Editor metadata, not a setting: a URI or a path resolved relative to **this file's** location. */
  $schema?: string;
  /** Format version of this file. A release that changes the key set raises it and ships a migration. */
  version: typeof CONFIG_VERSION;
  /** Short project identifier; the stem of generated daemon labels and worktree directory names. */
  projectName?: string;
  /** The branch work starts from and merges back into; also a branch review's diff base. */
  defaultBranch: string;
  /** Branches an automated run may never commit or push to directly. Entries may be globs. Unioned with `defaultBranch`, which is protected whatever this lists. */
  protectedBranches?: string[];
  /** Which code-hosting platform's pull-request and remote conventions the flow uses; `none` means none. */
  forge?: HarnessForge;
  /** Repo-relative run-artifact directory. MUST NOT be dot-named — see {@link STATE_DIR_DOT_PATTERN}. */
  stateDir: string;
  /** Repo-relative directory of the application, for a repo that nests it in a larger tree. */
  appDir?: string;
  /** Repo-relative directory the generated wrapper scripts are written to. */
  scriptsDir?: string;
  /** Repo-relative directory holding the committed git hooks. */
  githooksDir?: string;
  /** Model identifier the outer loop passes to a headless run. */
  agentModel?: string;
  /** Reasoning-effort level passed on the same launch line; absent selects the runtime's own per-model default. */
  agentEffort?: HarnessAgentEffort;
  /** Repo-relative path to the gitignored push-notification settings file — the path, never the contents. */
  pushEnvPath?: string;
  /** Prefix a build tool requires before exposing a variable to a client bundle; `null` when there is none. */
  clientEnvPrefix?: string | null;
  /** What detection concluded about the layout, and what a review made of it. Sits above the profile it explains. */
  detection?: HarnessDetection;
  /** The architectural layers. A task is assigned to exactly one, so this list decides who does the work. */
  layers: HarnessLayer[];
  /** The commands that verify a change. */
  commands: HarnessCommands;
  /** Which optional phases run. */
  phases?: HarnessPhases;
  /** Interactive-test-phase settings. */
  qa?: HarnessQa;
  /** Documentation-phase settings. */
  docs?: HarnessDocs;
  /** Parity-phase settings. */
  parity?: HarnessParity;
  /** Generated-deploy-wrapper settings. */
  deploy?: HarnessDeploy;
  /** Design-source-of-truth settings. */
  design?: HarnessDesign;
}

/**
 * The schema's declared defaults, mirrored so a generator seeds a config from one place.
 *
 * Every key the schema gives a `default` appears here, plus `version`, which it fixes as a const.
 * A key with no default (`projectName`, `forge`, `agentEffort`, `pushEnvPath`, everything under
 * `detection` — measured per repository rather than defaulted — everything under
 * `qa` but `driver` and `portSeed`, `design.source`) is absent because the schema has no opinion
 * about it, and inventing one here would be inventing configuration. `forge`, `design.source` and
 * `agentEffort` are the deliberate cases rather than the incidental ones: the schema withholds
 * `forge`'s default so an absent value reads as "not yet decided" rather than as a silent
 * assumption of one platform, withholds `design.source`'s for that same reason
 * ({@link DESIGN_SOURCES}), and withholds `agentEffort`'s because an absent value there is already
 * resolved ({@link AGENT_EFFORT_LEVELS}). In every case a value here would be a value no generator
 * writes.
 *
 * `as const` makes these literals, so a caller copies rather than aliases them —
 * `[...DEFAULTS.protectedBranches]`, `{ ...DEFAULTS.phases }` — and no generator can mutate the
 * defaults out from under the next one.
 */
export const DEFAULTS = {
  version: CONFIG_VERSION,
  defaultBranch: 'main',
  protectedBranches: ['main'],
  stateDir: 'sdlc-harness/',
  appDir: '.',
  scriptsDir: 'scripts',
  githooksDir: 'githooks',
  agentModel: 'opus',
  clientEnvPrefix: null,
  phases: { qa: false, docs: false, parity: false },
  qa: { driver: 'web-playwright', portSeed: 3001 },
} as const;

/**
 * The schema's `forge` `enum`, mirrored verbatim: the code-hosting platforms the flow knows.
 *
 * `none` is a value rather than the absence of one — it says work stays on branches and no pull
 * request is opened, which is a decision. An **omitted** `forge` says the decision has not been
 * made; that is why the schema gives this key no `default` and {@link DEFAULTS} carries none.
 *
 * Exported so the check that validates the key imports the set rather than restating it: a list
 * spelled twice is a list that can disagree with the schema in one of its two copies.
 */
export const FORGE_KINDS = ['github', 'gitlab', 'none'] as const;

export type HarnessForge = (typeof FORGE_KINDS)[number];

/**
 * The schema's `agentEffort` `enum`, mirrored verbatim: the reasoning-effort levels the launch flag
 * accepts.
 *
 * The schema gives this key no `default` and {@link DEFAULTS} carries none, for a different reason
 * than {@link FORGE_KINDS}: an absent value is a *resolved* state rather than an undecided one — no
 * effort flag reaches the launch line at all, so the runtime applies its own per-model default.
 *
 * Exported for the same reason as {@link FORGE_KINDS}: one list, imported, not restated.
 */
export const AGENT_EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

export type HarnessAgentEffort = (typeof AGENT_EFFORT_LEVELS)[number];

/**
 * The schema's `stateDir` character-class `pattern`, mirrored verbatim.
 *
 * It is **not** sufficient on its own: the class admits `.` and `/` after position 0, so this
 * alone accepts `sdlc/../.claude`, which resolves to a dot-directory at runtime. It is always
 * checked together with {@link STATE_DIR_DOT_PATTERN} — the schema states the two as separate
 * clauses for exactly this reason, and so does the check.
 */
export const STATE_DIR_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9._/-]*\/?$/;

/**
 * The schema's `not` clause on `stateDir`, mirrored verbatim: a dot at the start of **any**
 * segment, which covers `../`, `/./` and `/.hidden/` as well as a leading dot.
 *
 * A match is a rejection. The prohibition exists because the run-artifact tree has to be writable
 * by an unattended run, and a dot-path is where a host reserves directories an unattended run may
 * not write to — so a dot-named state directory does not fail loudly, it silently loses every
 * artifact the run produced (`docs/config.md` §3).
 */
export const STATE_DIR_DOT_PATTERN = /(^|\/)\./;

/**
 * The schema's `detection.preset` `enum`, mirrored verbatim: the layer presets, in signal-table
 * order.
 *
 * **This module owns the list**, and `detect/signals.ts`'s `PRESET_NAMES` re-exports it rather than
 * declaring a second copy, so the schema's enum and the set `--preset` is validated against cannot
 * disagree. Adding a preset means adding it here, to the schema's `detection.preset` enum, to
 * `SIGNALS` in `detect/signals.ts` and to `presetLayers` in `detect/presets.ts`.
 *
 * A preset is a **layer profile**, not a build tool, which is why `jvm` is one name for both Maven
 * and Gradle: the two share the `src/main/<java|kotlin>` source root and differ only in the runner,
 * so a second preset would buy a second name and the same profile. The runner is chosen by the
 * command family instead, which is selected independently of the preset.
 *
 * `dotnet` is one name for a .NET **backend and frontend** on the same argument taken one step
 * further: the two share the build tool, the `*.sln` / `*.csproj` manifests and the `src/` source
 * root, so the layer profile is identical. What would distinguish them is the optional-phase set —
 * and phases come from `init`'s own flags (`generators/harnessConfig.ts`, `buildConfig`), not from
 * the preset, so a split name would carry no behaviour at all.
 *
 * `apple-native` is one name for **iOS and macOS**, and for a SwiftPM package and an Xcode project
 * alike, on that same argument: nothing a file-existence test can ask separates the platforms — the
 * manifests, the `Sources/` root and the toolchain are the same — so a per-platform name would buy a
 * second name and the same profile. Which of `swift` and `xcodebuild` answers is the command
 * family's question, as it is for `jvm`.
 *
 * `rust-cargo` names the build tool because in Rust the two are the same thing: `Cargo.toml` is the
 * only manifest, `cargo` the only toolchain, and `src/` the only source root, so there is no second
 * runner for the preset to stay neutral about.
 *
 * `ruby-bundler` names its dependency tool on that same argument: `Gemfile` is the only manifest and
 * `bundle` the only resolver, so there is no second runner to stay neutral about. Its profile is a
 * source root — `app/` or `lib/`, whichever exists — rather than a Rails layer list, because
 * naming a Rails application's `app/` sub-directories as layers would decide its architecture, and
 * that is `/harness-analyze`'s. A Rails-shaped repository does not reach this preset at all: it
 * matches `api-service:route-directory` on its `app/controllers`, keeps that profile, and gains
 * the Bundler commands through the command family, which is selected independently of the preset.
 * A repository whose root `package.json` declares a script the npm commands are derived from does
 * not reach it either: a React Native tree's root `Gemfile` pins CocoaPods and fastlane rather than
 * declaring a Ruby stack, so the row declines it and it keeps its npm lines.
 *
 * `php-composer` names its dependency tool for `ruby-bundler`'s reason: `composer.json` is the only
 * manifest and `composer` the only resolver. Its profile is a source root — Laravel's `app/` or
 * PSR-4's `src/`, whichever exists — and a Laravel-shaped repository does not reach it, matching
 * `api-service:route-directory` on its `routes/` and gaining the Composer commands through the
 * family.
 *
 * `cmake-cpp` names the build system for `rust-cargo`'s reason inverted: C++ has no single
 * toolchain to name — the compiler, the test runner and the dependency source all vary — and
 * `CMakeLists.txt` is the one file the ecosystem agrees on, so the build system is the only fixed
 * thing about a C++ repository to name it after. Its profile is the `src/` source root where one
 * exists, and **not** a second layer for `include/`: headers and sources are one implementation
 * concern rather than two routing targets, so a second layer would buy a name no orchestrator
 * would route work to differently. Its row is the **last** before the fallback, because a
 * `CMakeLists.txt` is the manifest most likely to describe a sub-component of a repository whose
 * own stack is something else — a native extension in a Python distribution, a `node-gyp` addon,
 * a Rust FFI shim. Order settles the Python and Rust cases; the Node one is settled by a guard on
 * the row itself, since Node has no row of its own to be caught by — a repository whose root
 * `package.json` declares a script the npm commands are derived from is declined here.
 *
 * Exported for the same reason as {@link FORGE_KINDS}: one list, imported, not restated.
 */
export const DETECTION_PRESET_NAMES = [
  'monorepo',
  'layered-clean-arch',
  'python-package',
  'api-service',
  'flutter',
  'android-gradle',
  'jvm',
  'dotnet',
  'apple-native',
  'rust-cargo',
  'ruby-bundler',
  'php-composer',
  'cmake-cpp',
  'flat',
] as const;

export type HarnessPreset = (typeof DETECTION_PRESET_NAMES)[number];

/**
 * The preset the detection table's unconditional last row selects — the unrecognised-layout
 * fallback, not a layout that was recognised as flat.
 *
 * Two readers: this module's enum mirror above, and `doctor`'s `layer-profile` check, which grades
 * a recorded `detection.preset` of this value as a profile nobody has reviewed rather than as a
 * decision. Named here so neither spells the string at the point of use.
 */
export const FALLBACK_PRESET: HarnessPreset = 'flat';

/**
 * The schema's `detection.review.verdict` `enum`, mirrored verbatim: what a layer-profile review
 * concluded.
 *
 * All three clear `doctor`'s `layer-profile` check, because what that check grades is an
 * **unreviewed** profile: `considered-no-change` is the target's own considered-and-declined and
 * `proposed-and-refused` is the operator's, and a decline that leaves a trace is the point of
 * recording it.
 *
 * Exported for the same reason as {@link FORGE_KINDS}: one list, imported, not restated.
 */
export const LAYER_REVIEW_VERDICTS = ['applied', 'considered-no-change', 'proposed-and-refused'] as const;

export type HarnessLayerReviewVerdict = (typeof LAYER_REVIEW_VERDICTS)[number];

/**
 * The schema's `layers.contains` `const`, mirrored verbatim: the `path` of the catch-all layer.
 *
 * The catch-all is the layer work matching no other layer's `path` is routed to. The schema
 * requires **at least one** row carrying it — never exactly one, because draft-07 has no
 * `maxContains`, so an upper bound is not expressible and none is claimed — and the routing table
 * escalates its absence as a configuration gap mid-run, which is the expensive moment to find a
 * one-line config mistake. The constraint is on `path`, not on a layer name.
 *
 * Named here so the check that enforces the clause compares against this constant instead of
 * spelling the string at the point of use, where a bare `'.'` is indistinguishable from the other
 * meanings that character carries in this model — `appDir`'s default, or a relative-path segment.
 */
export const LAYER_CATCH_ALL_PATH = '.';

/** The schema's `layers[].name` pattern, mirrored verbatim. */
export const LAYER_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * The schema's `qa.driver` `enum`, mirrored verbatim: which variant of the interactive test agent
 * the QA phase runs, and so how that agent reaches the application.
 *
 * `web-playwright` drives a browser directly; the two mobile values drive an installed app through
 * a device runner. The browser variant is the schema's `default` and so the value in
 * {@link DEFAULTS}, which means a project whose application is a mobile app has to set this key:
 * leaving it out selects a driver that cannot reach the application at all.
 *
 * Exported for the same reason as {@link FORGE_KINDS}: one list, imported, not restated.
 */
export const QA_DRIVERS = ['web-playwright', 'mobile-maestro', 'mobile-mcp'] as const;

export type HarnessQaDriver = (typeof QA_DRIVERS)[number];

/**
 * Which of {@link QA_DRIVERS} this release actually implements.
 *
 * **Not a schema key**: the schema declares the enum, this declares the release's own state, and it
 * is the single owner of that state for the surfaces that **render the value list** — the three
 * {@link qaDriverChoices} feeds. A `Record` keyed by the type rather than a list of the implemented
 * values, so adding an enum value fails the build until its status is declared.
 *
 * **Implementing a driver is not one edit here.** Flipping a `false` to `true` re-renders those
 * three surfaces and nothing else; every other statement of the fact is its own text and has to be
 * swept in the same change. Derive that set by grepping
 * `declared-not-implemented|declared but not implemented|not implemented in this release` over
 * `docs README.md ARCHITECTURE.md cli plugin schemas examples`. Load-bearing rather than prose among
 * its hits: the schema's `qa.driver` `description` and `config/check.ts`'s explanation of the same
 * key, that driver's `plugin/agents/qa-tester-mobile-*.md` stub and the driver gate in
 * `plugin/agents/qa-tester.md` that routes to it, the browser-wiring gates in
 * `generators/repoRoot.ts` and `generators/permissionProfile.ts`, `doctor`'s mobile-driver pass text
 * in `doctor/checks.ts`, `settleQaDriver`'s warning in `generators/harnessConfig.ts`, `docs/cli.md`
 * §2 and §6, `ARCHITECTURE.md` §10, and the generated-file preambles in
 * `templates/claude/settings.autonomous.qa.json` and `templates/repo/README.md`.
 */
export const QA_DRIVER_IMPLEMENTED: Readonly<Record<HarnessQaDriver, boolean>> = {
  'web-playwright': true,
  'mobile-maestro': false,
  'mobile-mcp': false,
};

/**
 * The enum rendered for a reader **choosing** a value: schema order, each unimplemented driver
 * suffixed ` [not implemented]`, joined with `, `.
 *
 * Its readers are the three places a value is offered or rejected rather than already chosen —
 * `init`'s driver question, the `--qa-driver` refusal (both in `commands/init.ts`) and
 * `resolveQaDriver`'s fallback warning — so none of them can disagree with the others about which
 * values work. Data and a join, per this module's no-import rule.
 */
export function qaDriverChoices(): string {
  const choices = QA_DRIVERS.map((driver) =>
    QA_DRIVER_IMPLEMENTED[driver] ? driver : `${driver} [not implemented]`,
  );
  return choices.join(', ');
}

/**
 * The schema's `design.source` `enum`, mirrored verbatim: the design tools that can hold a
 * project's design source of truth.
 *
 * `none` is a value rather than the absence of one — it says the project has no design source of
 * truth at all, which is a decision. An **omitted** `design.source` says the decision has not been
 * made; that is why the schema gives this key no `default` and {@link DEFAULTS} carries none.
 *
 * Exported for the same reason as {@link FORGE_KINDS}: one list, imported, not restated. Its one
 * consumer is the `checkEnum` call that validates the key in `config/check.ts`.
 */
export const DESIGN_SOURCES = ['figma', 'penpot', 'none'] as const;

export type HarnessDesignSource = (typeof DESIGN_SOURCES)[number];

/**
 * The one lookup from a typed-in string to a {@link HarnessQaDriver}: `--qa-driver`'s parse-time
 * check and the config generator's check of an answer given at a prompt both go through it, so a
 * value is judged on the same terms wherever it was typed.
 *
 * **Total rather than throwing**, unlike the flag parsers elsewhere in the CLI. This module mirrors
 * the schema and imports nothing — no error vocabulary, no exit codes — and the two callers want
 * different outcomes from the same rejection anyway: a refusal at the flag, and a fall back to the
 * default at the prompt.
 */
export function asQaDriver(value: string): HarnessQaDriver | undefined {
  return QA_DRIVERS.find((driver) => driver === value);
}

/**
 * Does this config call for the browser wiring — the repository's `.mcp.json` block and the
 * permission profile's interactive-test fragment?
 *
 * **Declared once, here, because the two generators that read it enforce each other.** The profile
 * fragment names the servers a run starts and `.mcp.json` declares them; a copy of this predicate
 * in one generator that drifted from the other would leave `enabledMcpjsonServers` starting a server
 * nothing declares, and an un-loaded tool stalls an unattended run rather than failing it. Their
 * *templates* are checked against each other at generation time (`generators/repoRoot.ts`); nothing
 * checks two spellings of the *config* question, so there is only ever one.
 *
 * Both conditions are needed. The phase must be on — an adopter who never runs it should pay neither
 * the browser tool schemas in every session's context nor a launched browser process — and the driver
 * must be the browser one: the two mobile variants of the interactive test agent ship
 * declared-not-implemented with built-ins-only tool allowlists, so for them a declared server is
 * wiring nothing can ever start.
 *
 * The `?? DEFAULTS.qa.driver` is load-bearing rather than defensive: a hand-edited config may carry
 * `phases.qa` with no `qa.driver`, and the schema's default for that key is the browser driver.
 */
export function browserWiringApplies(config: HarnessConfig): boolean {
  if (config.phases?.qa !== true) return false;
  return (config.qa?.driver ?? DEFAULTS.qa.driver) === 'web-playwright';
}

/**
 * Does this config call for the docs-retrieval wiring — the search server, its permission-profile
 * entries, its ignore rules, `init`'s setup step, the `docs` verbs and `doctor`'s checks?
 *
 * **Declared once, here, because every one of those consumers has to agree.** A copy of this
 * predicate in one of them that drifted would register a server the permission profile never starts,
 * or start one nothing registers — and nothing checks two spellings of the config question against
 * each other, so there is only ever one. Import it; do not re-spell it.
 *
 * Both conditions are needed, and the phase test is not redundant with the structural check that
 * grades `docs.retrieval: true` without `phases.docs` an error: `config/io.ts` → `loadConfig` still
 * returns a config carrying that error to a caller that does not refuse on one, and retrieval
 * searches the corpus the docs phase maintains.
 */
export function retrievalApplies(config: HarnessConfig): boolean {
  return config.phases?.docs === true && config.docs?.retrieval === true;
}

/** The schema's `qa.portSeed` bounds, mirrored verbatim. */
export const PORT_SEED_MIN = 1024;
export const PORT_SEED_MAX = 65535;

/**
 * The marker `init` embeds in a `commands.*` value that stack detection could not fill in.
 *
 * It is defined here, next to the model, because several sides must agree on one string: the
 * generator that writes it, and everything that later asks whether an adopter has replaced it —
 * `config/check.ts`'s warning, the wrapper generator's "write no wrapper for this key", the
 * permission profile's "allow-list no wrapper that was not written". None of them formats or
 * matches the string itself: they go through {@link placeholderCommand} and {@link isPlaceholder},
 * which are the constant's only writer and its only reader.
 */
export const COMMAND_PLACEHOLDER_MARKER = 'configure this';

/**
 * The placeholder value written for a command the detector could not determine — a legal non-empty
 * string, so the generated file still passes the schema, that is obviously unfinished to a reader
 * and detectable by {@link isPlaceholder}.
 */
export function placeholderCommand(key: keyof HarnessCommands): string {
  return `<${COMMAND_PLACEHOLDER_MARKER}: set commands.${key}>`;
}

/**
 * Is this configured command line still the marker `init` wrote for a command it could not detect?
 *
 * The one reader of {@link COMMAND_PLACEHOLDER_MARKER}, paired with {@link placeholderCommand} as
 * its one writer. It is a **containment** test rather than a comparison against
 * {@link placeholderCommand}'s exact output, so a value an adopter half-edited — the key changed,
 * the marker left in place — still reads as unfinished rather than as a real command line that
 * would be written into a wrapper and run.
 */
export function isPlaceholder(value: string): boolean {
  return value.includes(COMMAND_PLACEHOLDER_MARKER);
}

/**
 * The literal an adopter writes into `commands.typecheck` to say **this repository has no type
 * check** — an answer, not an unanswered key (`docs/typecheck-key-decision.md` §7, option (b)).
 *
 * Beside {@link COMMAND_PLACEHOLDER_MARKER} because the module's two marker strings are the same
 * kind of thing: one string several sides must agree on, spelled here and nowhere else. It is
 * **published** — the schema's `description`, {@link HarnessCommands}'s field comment and
 * `docs/config.md` §5's key reference all carry it — because an adopter has to type it exactly.
 *
 * It has no writer. `init` never writes it (§5 dimension 5: `init` must not assert on the adopter's
 * behalf a claim detection did not establish), so a `noneCommand()` helper would exist only to
 * invite one.
 */
export const COMMAND_NONE_SENTINEL = '<none>';

/**
 * Is this configured command line the {@link COMMAND_NONE_SENTINEL}?
 *
 * **Exact, case-sensitive, on the trimmed value whole** — deliberately not
 * {@link isPlaceholder}'s containment test. A real command line that happened to contain the
 * sentinel's text would read as *answered: none* under containment and silently disable the key;
 * the placeholder can afford containment because its marker is a phrase no command line carries,
 * and because a half-edited placeholder should still read as unfinished.
 *
 * The sides that must agree on this answer: `config/check.ts`'s grading of the key, the wrapper
 * generator's "write no wrapper for this key", `doctor`'s two command checks and `init`'s command
 * report.
 *
 * **Value shape only.** Every consumer outside `config/check.ts` calls {@link answersNone} instead,
 * which adds the key gate.
 */
export function isNoneSentinel(value: string): boolean {
  return value.trim() === COMMAND_NONE_SENTINEL;
}

/**
 * The one command key {@link COMMAND_NONE_SENTINEL} is recognised on.
 *
 * The ratified decision widens the meaning of `commands.typecheck`; it assesses nothing about the
 * other command keys, and reading the sentinel on `commands.test` would silently turn off the test
 * gate.
 */
export const NONE_SENTINEL_KEY = 'typecheck';

/**
 * Does this key hold the answered-`none` state — the **key-gated reader every consumer uses**?
 *
 * `key` is the **bare** command key (`typecheck`, `test`, `devServer`, `build`, `depInstall`),
 * never a `commands.`-prefixed key path: every call site walks the command keys and already holds
 * the bare name.
 *
 * The gate lives here so the "recognised on `commands.typecheck` only" rule has one statement
 * rather than one per consumer. A value-shape-only check at a consumer would recognise the sentinel
 * on `commands.test` too and silently withdraw the test gate's wrapper, its permission entry and
 * its mismatch report — contradicting the warning `config/check.ts` prints on that same key.
 *
 * `config/check.ts` is the deliberate sole caller of the ungated {@link isNoneSentinel}, because
 * its job is precisely to say something different on the other keys.
 */
export function answersNone(key: string, value: string | undefined): boolean {
  return key === NONE_SENTINEL_KEY && typeof value === 'string' && isNoneSentinel(value);
}
