/**
 * The layer and command presets: what a detected preset name is actually worth to `init`.
 *
 * `detect/signals.ts` answers *which* preset; this module answers *what that preset contains* —
 * the `layers` array `harness.config.json` gets, and the **raw** command lines the project's
 * verification commands are.
 *
 * **The rule this module exists to enforce: `rawCommands` holds the command line a human would
 * type, never a wrapper invocation.** Three files are three views of one string and drift between
 * them is invisible until an unattended run stalls on a command that is neither allowed nor
 * denied, so each view has exactly one owner:
 *
 * 1. **here** — the raw line (`npm run build`, `pytest`), derived only from files that exist;
 * 2. **the wrapper-script writer** — inlines a raw line into `<scriptsDir>/<name>.sh`;
 * 3. **the config generator** — writes `bash <scriptsDir>/<name>.sh` into `commands.typecheck`,
 *    `commands.test` and `commands.devServer` (`examples/harness.config.json`).
 *
 * This module therefore never formats a `bash …/….sh` value and never reads `scriptsDir`.
 * `build` and `depInstall` are the two keys that are never wrapped: they pass through to
 * `commands.*` exactly as detected here, which is why the example config shows them raw.
 *
 * **Nothing here is invented.** A command that cannot be derived from a manifest that exists
 * becomes {@link placeholderCommand} plus a warning naming the key, what was looked for and what the
 * repository holds instead ({@link undetectedCommandWarning}) — a value that is obviously
 * unfinished, that `config/check.ts` already warns about and that `doctor` already looks for.
 * Guessing a plausible command instead would produce a run that passes its verification step by
 * running something that never checked anything.
 */

import { placeholderCommand, type HarnessCommands, type HarnessLayer } from '../config/model.js';
import { PLUGIN_NAME } from '../generators/projectSettings.js';
import {
  appScriptNames,
  declaresNodeScript,
  findAndroidModule,
  findApiDir,
  findBundlerManifest,
  findCargoManifest,
  findCmakeManifest,
  findComposerManifest,
  findDotnetProject,
  findFlutterManifest,
  findGoManifest,
  findGradleManifest,
  findLayeredRoot,
  findMavenManifest,
  findNodeInstallSite,
  findPythonManifest,
  findPythonPackageDir,
  findReadManifests,
  findSharedSchemes,
  findSwiftPackageManifest,
  findAnyReadManifest,
  findUnreadManifest,
  findXcodeProject,
  isWorkspaceRoot,
  manifestDirectory,
  ANDROID_MANIFEST,
  ANDROID_MODULE_DIRS,
  BUNDLER_MANIFEST,
  CARGO_MANIFEST,
  CMAKE_MANIFEST,
  COMPOSER_MANIFEST,
  DOTNET_PROJECT_SUFFIXES,
  DOTNET_SOLUTION_SUFFIXES,
  FLAT_FALLBACK_SIGNAL_ID,
  GO_MANIFEST,
  GRADLE_MANIFESTS,
  MAVEN_MANIFEST,
  PACKAGE_LOCKFILE,
  PACKAGE_MANIFEST,
  PUBSPEC_MANIFEST,
  PYTHON_MANIFESTS,
  SWIFT_PACKAGE_MANIFEST,
  XCODE_PROJECT_SUFFIXES,
  XCODE_SHARED_SCHEMES_DIR,
  XCODE_WORKSPACE_SUFFIX,
  type AndroidModule,
  type DetectContext,
  type DetectionResult,
  type LayeredDirName,
  type NodeInstallSite,
  type PresetName,
} from './signals.js';

/**
 * The command lines as a person would type them, before any wrapper exists.
 *
 * Same key set as {@link HarnessCommands} — the schema's, so a generator can hand these straight
 * to the two keys that stay raw — but the values mean something different, which the module header
 * spells out. The alias exists to make a reader ask which of the two they are holding.
 */
export type RawCommands = HarnessCommands;

/** The two command keys the schema requires, and therefore the only two that get a placeholder. */
const REQUIRED_COMMAND_KEYS = ['typecheck', 'test'] as const;

export type RequiredCommandKey = (typeof REQUIRED_COMMAND_KEYS)[number];

/** Where an adopter's per-layer rules documents live, relative to their repository root. */
const CONVENTIONS_DIR = '.claude/context';

/** The rules document each layered directory is pointed at. */
const LAYERED_CONVENTIONS: Readonly<Record<LayeredDirName, string>> = {
  data: 'data-layer.md',
  domain: 'domain.md',
  presentation: 'presentation.md',
};

const API_LAYER_CONVENTIONS = 'api.md';
const PACKAGE_LAYER_CONVENTIONS = 'package.md';
const GENERAL_LAYER_CONVENTIONS = 'conventions.md';

/**
 * The rules document a preset's single source-root layer points at — the shape a stack whose whole
 * application lives under one directory gets, where naming that directory is deterministic and
 * decomposing it is a judgement call and therefore `/autonomous-sdlc-harness:harness-analyze`'s.
 */
const MODULE_LAYER_CONVENTIONS = 'module.md';

/**
 * The layer name every preset's test root takes, whatever the directory is spelled — `spec/`,
 * `Tests/`, `src/test/`.
 *
 * The name is the routing tag an orchestrator dispatches work by and the path is the spelling on
 * disk; {@link APPLE_LAYER_NAME} documents that split for `sources` → `MyApp/` and this is the same
 * one. One name across every stack is what lets an instruction say "the `tests` layer" once.
 */
export const TESTS_LAYER_NAME = 'tests';

/** The rules document every preset's test layer points at — see {@link PRESET_TEST_ROOTS}. */
const TESTS_LAYER_CONVENTIONS = 'tests.md';

/** The source-root directory name a Dart or Flutter package puts its code in. */
const DART_SOURCE_DIR = 'lib';

/**
 * The main source set of a JVM module — the directory {@link ANDROID_MANIFEST} sits in on Android,
 * and the one Maven's and Gradle's own conventions put sources under everywhere else.
 *
 * One constant for both stacks because it is one convention: the Android Gradle plugin inherits the
 * layout from the Java plugin, which inherits it from Maven.
 */
const MAIN_SOURCE_SET = 'src/main';

/**
 * The language directories a main source set holds its code in, in preference order.
 *
 * `java` first, and a module carrying both gets it: it is the source root every JVM build tool
 * creates whatever the language, so it is the one a mixed module is certain to compile from, while
 * `src/main/kotlin` is added by convention in Kotlin-only modules — many of which keep their Kotlin
 * under `src/main/java` regardless.
 */
const JVM_SOURCE_DIRS = ['java', 'kotlin'] as const;

/** The Gradle wrapper script, whose presence chooses `./gradlew` over `gradle` — see {@link jvmRunner}. */
const GRADLE_WRAPPER = 'gradlew';

/** The Maven wrapper script, whose presence chooses `./mvnw` over `mvn` — see {@link jvmRunner}. */
const MAVEN_WRAPPER = 'mvnw';

/**
 * The cross-layer rules document — the one every layer inherits, and the one the `general`
 * layer points at in every preset.
 *
 * Exported because a second consumer needs the same string: the conventions-stub generator
 * writes this file whether or not a layer points at it, and its routing table gives it a row of
 * its own. Two spellings of it would put a stub at one path and a config pointer at another.
 */
export const SHARED_CONVENTIONS_PATH = `${CONVENTIONS_DIR}/${GENERAL_LAYER_CONVENTIONS}`;

/**
 * The npm script names each script-derived command key accepts, most specific first.
 *
 * **One table for both readers of a candidate list**, which is what keeps them honest: the root
 * manifest's derivation ({@link nodeCommands}) and the sentence naming what `<appDir>/package.json`
 * declares ({@link nestedScriptFor}) select a script the same way, so the line a nested application is
 * offered is the one detection would have derived had that manifest been the root's. `depInstall` has
 * no row because it is a whole command line rather than a script name.
 *
 * Typed against {@link RawCommands} so a command key added to the schema has to gain a row here or
 * fail to compile, rather than becoming a fifth key nothing looks for.
 */
const NODE_SCRIPT_CANDIDATES: Readonly<Record<Exclude<keyof RawCommands, 'depInstall'>, readonly string[]>> = {
  typecheck: ['typecheck', 'check-types', 'tsc', 'lint'],
  test: ['test'],
  build: ['build'],
  devServer: ['dev', 'start', 'serve'],
};

/**
 * {@link NODE_SCRIPT_CANDIDATES} flattened — every script name that makes this family answer.
 *
 * Exported for the closure case that holds it equal to `NODE_ROW_GUARD_SCRIPTS` in
 * `detect/signals.ts` (`test/stack-presets.test.mjs`): that guard has to fire exactly where this
 * family answers, and the two lists cannot be one constant because `detect/presets.ts` imports
 * `detect/signals.ts` and not the reverse.
 */
export const NODE_SCRIPT_CANDIDATE_NAMES: readonly string[] = Object.values(NODE_SCRIPT_CANDIDATES).flat();

/**
 * The dev-server candidates that **compile as they serve** — the ones a build in front of would be
 * pure cost.
 *
 * `dev` is the whole list today: a watch-mode dev server compiles on start and recompiles on change,
 * so pre-building it would pay a full build per QA phase for output nothing reads. Membership here is
 * the exception, and the exception is what is enumerated: a candidate added to
 * {@link NODE_SCRIPT_CANDIDATES}`.devServer` is treated as pre-compiled unless it is named here,
 * which is the safe default of the two — a needless build wastes a minute, a missing one serves
 * stale or absent output.
 */
const WATCH_MODE_DEV_SERVER_SCRIPTS: ReadonlySet<string> = new Set(['dev']);

/**
 * The dev-server script names that serve what was **last compiled** rather than compiling as they
 * serve — {@link NODE_SCRIPT_CANDIDATES}`.devServer` less the watch-mode ones.
 *
 * Derived from that table rather than restated as a second list of script names, for the reason the
 * table's own doc gives: one table for both readers is what keeps them honest, and a candidate added
 * there cannot be silently missed here.
 */
const PRECOMPILED_DEV_SERVER_SCRIPTS: readonly string[] = NODE_SCRIPT_CANDIDATES.devServer.filter(
  (name) => !WATCH_MODE_DEV_SERVER_SCRIPTS.has(name),
);

/** The raw lines those scripts produce — `npm run start`, `npm run serve`. */
const PRECOMPILED_DEV_SERVER_LINES: ReadonlySet<string> = new Set(
  PRECOMPILED_DEV_SERVER_SCRIPTS.map((name) => `npm run ${name}`),
);

/**
 * **The raw line a dev-server wrapper must run to completion before it launches its server, or
 * `undefined` when there is nothing to run.**
 *
 * The one fact only this module owns: whether the dev-server line it derived serves what was last
 * compiled ({@link PRECOMPILED_DEV_SERVER_LINES}). A `npm run start` that is `node dist/server.js`
 * silently tests stale output after an uncompiled edit and fails outright on a fresh worktree where
 * `dist/` does not exist.
 *
 * **A pre-start line and not a compound `commands.devServer`**, which is the load-bearing half of the
 * shape: the wrapper backgrounds its command and prints `$!`, and an `a && b` backgrounded as a list
 * makes that pid a subshell — `docs/outer-loop-verification.md` §1.7's measured "killing the printed
 * pid leaves no `sleep` behind" row is what a compound line would falsify.
 *
 * This module still formats no wrapper path and reads no `scriptsDir` (the module header): the value
 * is a **raw** line, and rendering it is the wrapper-script writer's — `generators/scripts.ts`, the
 * one consumer, which already imports {@link RawCommands} from here.
 */
export function devServerPrestart(rawCommands: RawCommands): string | undefined {
  const { devServer, build } = rawCommands;
  if (devServer === undefined || build === undefined) return undefined;
  return PRECOMPILED_DEV_SERVER_LINES.has(devServer) ? build : undefined;
}

/**
 * The type-check candidates that are accepted but never silently.
 *
 * A script named here resolves `commands.typecheck` exactly as any other candidate does — it is the
 * **last** entry in {@link NODE_SCRIPT_CANDIDATES}`.typecheck` precisely because it may not type-check
 * at all: a lint run without type-aware rules exits zero on a type error, which is this module's own
 * "a run that passes its verification step by running something that never checked anything" reached
 * by a different route. Dropping it from the candidate list is not the remedy — for a plain-JS
 * repository it is the only static analysis there is, and the alternative is a placeholder. So the
 * selection is kept and **reported** ({@link weakTypecheckMessage}); membership and order of the
 * candidate list are unchanged, so nothing about which command is derived moves.
 */
const WEAK_TYPECHECK_SCRIPTS: ReadonlySet<string> = new Set(['lint']);

/**
 * The file-existence evidence that a repository is typed, and therefore the switch between reporting
 * a weak type-check as a warning and reporting it as a note.
 *
 * Read at the **repository root and nowhere else**, because the line the message is about is derived
 * at the repository root and nowhere else: `nodeCommands` reads `rootPackageJson()`, which is exactly
 * `<repoRoot>/package.json`. Grading a nested `tsconfig.json` as evidence for a root-derived line
 * would warn a repository whose root really is plain JS.
 */
const TYPED_REPOSITORY_EVIDENCE = 'tsconfig.json';

/** A command key derived from an npm script name: the four {@link NODE_SCRIPT_CANDIDATES} covers. */
type ScriptDerivedCommandKey = keyof typeof NODE_SCRIPT_CANDIDATES;

/**
 * The two script-derived keys the schema leaves optional — the keys that get no placeholder, so an
 * unresolved one is absent from the generated config rather than obviously unfinished in it.
 */
const OPTIONAL_COMMAND_KEYS = ['build', 'devServer'] as const;

type OptionalCommandKey = (typeof OPTIONAL_COMMAND_KEYS)[number];

/** A layer, built from one repo-relative directory and the name of its rules document. */
function layer(name: string, path: string, conventionsFile: string): HarnessLayer {
  return { name, path, conventions: `${CONVENTIONS_DIR}/${conventionsFile}` };
}

/**
 * The layer every preset ends with: the orchestrator always needs somewhere to put work that
 * belongs to no layer — workflow artifacts, configuration, scripts — and a task is assigned to
 * exactly one layer, so a profile without this one leaves that work homeless.
 *
 * Built fresh per call: the presets hand these objects to a generator that may edit them.
 */
function generalLayer(): HarnessLayer {
  return { name: 'general', path: '.', conventions: SHARED_CONVENTIONS_PATH };
}

/**
 * The `lib/` directory of a Dart or Flutter package: the first manifest root carrying one.
 *
 * It follows `DetectContext.manifestRoots` rather than `candidateRoots`, because the manifest rows
 * do — `findFlutterManifest` searches exactly those two roots — so the layer is named under the
 * same root the signal matched its `pubspec.yaml` in.
 */
function flutterSourceDir(context: DetectContext): string | undefined {
  for (const root of context.manifestRoots) {
    const path = root === '.' ? DART_SOURCE_DIR : `${root}/${DART_SOURCE_DIR}`;
    if (context.dirExists(path)) return path;
  }
  return undefined;
}

/** A module's main source set, repo-relative — spelled once so both readers below join it alike. */
function mainSourceSet(module: string): string {
  return module === '.' ? MAIN_SOURCE_SET : `${module}/${MAIN_SOURCE_SET}`;
}

/**
 * The source root of a JVM module: its main source set's `java/` or `kotlin/` directory, its main
 * source set itself when it carries neither, or `undefined` when the module has no main source set
 * at all.
 *
 * One resolver for both JVM arms, so an Android module and a Maven or Gradle project name their
 * source root by the same rule rather than by two copies of it. The `undefined` arm is reachable
 * only from the {@link jvmSourceDir} side: an Android module resolved because
 * {@link ANDROID_MANIFEST} was found *inside* its main source set, so that directory exists by
 * construction — which is why the Android arm's `??` fallback restates the old total answer rather
 * than dropping the layer.
 */
function mainSourceDir(context: DetectContext, module: string): string | undefined {
  const main = mainSourceSet(module);
  for (const name of JVM_SOURCE_DIRS) {
    const path = `${main}/${name}`;
    if (context.dirExists(path)) return path;
  }
  return context.dirExists(main) ? main : undefined;
}

/**
 * The source root of a Maven or Gradle JVM project: the first manifest root carrying a main source
 * set, resolved through {@link mainSourceDir}.
 *
 * It follows `DetectContext.manifestRoots` for {@link flutterSourceDir}'s reason — the rows that
 * select this preset resolve over exactly those roots — and it is deliberately **not** gated on
 * having found the manifest again: the layer half answers what the tree looks like, so a
 * `--preset jvm` run against a conventional tree names its source root whatever manifest it carries.
 */
function jvmSourceDir(context: DetectContext): string | undefined {
  for (const root of context.manifestRoots) {
    const dir = mainSourceDir(context, root);
    if (dir !== undefined) return dir;
  }
  return undefined;
}

/** The source-root directory a .NET solution repository conventionally puts its projects under. */
const DOTNET_SOURCE_DIR = 'src';

/**
 * The `src/` directory of a .NET repository: the first manifest root carrying one, or `undefined`.
 *
 * It follows `DetectContext.manifestRoots` for {@link flutterSourceDir}'s reason — the row that
 * selects this preset resolves over exactly those roots — and, like {@link jvmSourceDir}, it is
 * deliberately not gated on having found the solution again, so a `--preset dotnet` run against a
 * conventional tree names its source root whatever manifest it carries.
 */
function dotnetSourceDir(context: DetectContext): string | undefined {
  for (const root of context.manifestRoots) {
    const path = root === '.' ? DOTNET_SOURCE_DIR : `${root}/${DOTNET_SOURCE_DIR}`;
    if (context.dirExists(path)) return path;
  }
  return undefined;
}

/** The source root Swift Package Manager puts a package's targets under, by convention. */
const SWIFT_SOURCES_DIR = 'Sources';

/**
 * The layer **name** both Apple arms use — lowercase, whatever the directory is actually spelled.
 *
 * **This is the one place in this module where the name and the path deliberately differ.** A layer
 * name is the routing tag an orchestrator assigns work by and the schema constrains it to
 * `^[a-z][a-z0-9-]*$`, while `path` carries the real spelling on disk — and the Xcode arm's
 * directory is named after the product (`MyApp.xcodeproj` → `MyApp/`), which that pattern rejects.
 * So the name is fixed and the path varies, rather than the name being derived from the directory.
 */
const APPLE_LAYER_NAME = 'sources';

/**
 * The source root of an Apple-native repository: a manifest root's `Sources/` — SwiftPM's own
 * convention — else the directory named after the Xcode container's stem, else `undefined`.
 *
 * The stem arm is a suffix strip rather than a guess: `MyApp.xcodeproj` sits beside the `MyApp/`
 * directory holding its sources in the layout `xcodebuild` itself generates, and the strip is total
 * because the container was found by one of {@link XCODE_PROJECT_SUFFIXES}. It is still gated on the
 * directory existing, so a repository that keeps its sources elsewhere drops the layer rather than
 * pointing an implementer at a path that is not there.
 */
function appleSourceDir(context: DetectContext): string | undefined {
  for (const root of context.manifestRoots) {
    const path = root === '.' ? SWIFT_SOURCES_DIR : `${root}/${SWIFT_SOURCES_DIR}`;
    if (context.dirExists(path)) return path;
  }

  const project = findXcodeProject(context);
  if (project === undefined) return undefined;
  const suffix = XCODE_PROJECT_SUFFIXES.find((candidate) => project.endsWith(candidate));
  if (suffix === undefined) return undefined;
  const stem = project.slice(0, -suffix.length);
  return context.dirExists(stem) ? stem : undefined;
}

/** The source root Cargo compiles a crate from, by convention and by its own default target paths. */
const CARGO_SOURCE_DIR = 'src';

/**
 * The `src/` directory of a Rust crate: the first manifest root carrying one, or `undefined`.
 *
 * {@link dotnetSourceDir}'s shape and its reasons — the row that selects this preset resolves over
 * exactly these roots, and it is not gated on having found the manifest again, so a
 * `--preset rust-cargo` run against a conventional tree names its source root.
 */
function cargoSourceDir(context: DetectContext): string | undefined {
  for (const root of context.manifestRoots) {
    const path = root === '.' ? CARGO_SOURCE_DIR : `${root}/${CARGO_SOURCE_DIR}`;
    if (context.dirExists(path)) return path;
  }
  return undefined;
}

/**
 * The two conventional Ruby source roots, in the order they are tried: an application's `app/`
 * first, a library's `lib/` second.
 *
 * Ruby has no manifest key that declares either — a `Gemfile` lists gems, not directories — so
 * existence is the whole test, and a repository carrying both is an application with a `lib/`
 * beside it far more often than the reverse.
 */
const RUBY_SOURCE_DIRS = ['app', 'lib'] as const;

/**
 * The two conventional PHP source roots, in the order they are tried: a Laravel application's `app/`
 * first, a PSR-4 library's `src/` second.
 *
 * `composer.json` *does* declare its PSR-4 roots, and this list deliberately does not read them: the
 * `autoload` map is nested rather than top-level, so consulting it would take detection past the
 * file-existence and top-level-key rule `detect/signals.ts` is defined by. Both names are fixed
 * conventions, so existence answers the same question the map would.
 */
const PHP_SOURCE_DIRS = ['app', 'src'] as const;

/**
 * The conventional C++ source root — one name, and the list shape only because
 * {@link firstSourceDir} is the locator it is searched with.
 *
 * `include/` is **not** an entry here because it is a second row rather than an alternative to this
 * one — {@link CMAKE_HEADER_DIRS} says why. `tests/` is not one either: a conventional test root is
 * declared as the `tests` row from {@link PRESET_TEST_ROOTS}, which is where every preset's test
 * tree is named.
 *
 * The split is between **kinds** of directory, not between one row and many: `include/` is a second
 * *source* row on {@link MODULE_LAYER_CONVENTIONS}, and a test tree is a `tests` row on
 * {@link TESTS_LAYER_CONVENTIONS}.
 */
const CMAKE_SOURCE_DIRS = ['src'] as const;

/**
 * The conventional C++ public-header root, searched with {@link firstSourceDir} like the source
 * root above.
 *
 * It earns a row, and a **source** one: a CMake target's `include/` is its public API — the half of
 * the same module other targets compile against — so it is implementation work under the same
 * {@link MODULE_LAYER_CONVENTIONS} rules as `src/`, and the two are siblings no single path covers.
 */
const CMAKE_HEADER_DIRS = ['include'] as const;

/** A source root: the directory name the layer takes, and the repo-relative path it points at. */
interface NamedSourceDir<Name extends string> {
  readonly name: Name;
  readonly path: string;
}

/**
 * The first of `names` that exists as a directory at a manifest root, or `undefined`.
 *
 * {@link cargoSourceDir}'s shape with a list of names instead of one, and its reasons: the row that
 * selects the preset resolves over exactly these roots, and this is not gated on having found the
 * manifest again, so a `--preset` run against a conventional tree still names its source root. It
 * reports the **name** beside the path because the two differ below the root, and the layer takes
 * the name — a nested `services/api/lib` is still the `lib` layer.
 *
 * One function for {@link RUBY_SOURCE_DIRS} and {@link PHP_SOURCE_DIRS} because the two differ only
 * in that list: which names a stack considers conventional is the stack's fact, and the search over
 * manifest roots is not.
 */
function firstSourceDir<Name extends string>(
  context: DetectContext,
  names: readonly Name[],
): NamedSourceDir<Name> | undefined {
  for (const root of context.manifestRoots) {
    for (const name of names) {
      const path = root === '.' ? name : `${root}/${name}`;
      if (context.dirExists(path)) return { name, path };
    }
  }
  return undefined;
}

/**
 * The presets whose `general`-only profile is a **decision** rather than a failure to resolve.
 *
 * A `monorepo`'s packages are a judgement call this table declines to make, so one catch-all row is
 * the correct and final answer for it. Every other preset resolves a source root and answers
 * `general` alone only when that root was not found — a state {@link buildPreset} warns about once
 * at init and which `doctor` has to keep grading, since nothing else repeats it.
 *
 * The `flat` fallback (`config/model.ts`'s `FALLBACK_PRESET`) belongs to the same class and is
 * deliberately **not** listed: `doctor`'s `layer-profile` check tests it with the clause beside
 * this set, because a fallback profile is the one thing that check exists to keep warning about.
 *
 * Exported for that check, its only consumer: a second list of names there would drift the moment a
 * preset is added.
 */
export const LAYERLESS_BY_DESIGN_PRESETS: ReadonlySet<PresetName> = new Set<PresetName>(['monorepo']);

/**
 * The conventional test root of each preset's toolchain, in preference order.
 *
 * Every list is that stack's **convention** rather than a guess — Maven's and Gradle's `src/test`,
 * Dart's `test/`, SwiftPM's `Tests/`, RSpec's `spec/`, PHPUnit's and .NET's `tests/` — which is why
 * existence alone decides, exactly as it does for the source roots above. Where a stack has two, the
 * first is the one a repository carrying both is more likely to be running: `spec` before `test` for
 * the reason {@link bundlerCommands} gives, since such a repository is an RSpec suite with a
 * leftover `test/` far more often than the reverse. The Android candidates mirror
 * `ANDROID_MODULE_DIRS`' `app`-then-root search order.
 *
 * `monorepo` and `flat` are absent **deliberately**, not unresolved: their layer-less profile is a
 * stated decision ({@link LAYERLESS_BY_DESIGN_PRESETS}, and the arm below for `flat`), and a test row
 * would contradict it.
 *
 * The first two entries carry `src/`-nested spellings as well as the root ones because their
 * **source** rows resolve over `DetectContext.candidateRoots` (`findLayeredRoot`, `findApiDir`)
 * while {@link testsLayer} searches the narrower `manifestRoots`: without them, a tree whose source
 * row lands at `src/routes` gets no `tests` row for its `src/test`. A candidate two segments deep is
 * the shape `android-gradle`'s entry already uses, so the table stays one kind of thing.
 */
const PRESET_TEST_ROOTS: Readonly<Partial<Record<PresetName, readonly string[]>>> = {
  'layered-clean-arch': ['test', 'tests', 'src/test', 'src/tests'],
  'api-service': ['test', 'tests', 'src/test', 'src/tests'],
  'python-package': ['tests', 'test'],
  flutter: ['test'],
  'android-gradle': ['app/src/test', 'src/test'],
  jvm: ['src/test'],
  dotnet: ['tests'],
  'apple-native': ['Tests'],
  'rust-cargo': ['tests'],
  'ruby-bundler': ['spec', 'test'],
  'php-composer': ['tests'],
  'cmake-cpp': ['tests', 'test'],
};

/**
 * The `tests` row for a preset — one or none, dropped when the directory does not exist, which is
 * the rule every source row above follows.
 *
 * Resolved with {@link firstSourceDir} over {@link PRESET_TEST_ROOTS}, so the search runs over
 * `DetectContext.manifestRoots` and a `--preset` run against a conventional tree still names its
 * test root. Two presets' source rows resolve over the wider `candidateRoots` instead, which is why
 * their entries in {@link PRESET_TEST_ROOTS} carry the nested spellings explicitly.
 */
function testsLayer(preset: PresetName, context: DetectContext): HarnessLayer | undefined {
  const names = PRESET_TEST_ROOTS[preset];
  const dir = names === undefined ? undefined : firstSourceDir(context, names);
  return dir === undefined ? undefined : layer(TESTS_LAYER_NAME, dir.path, TESTS_LAYER_CONVENTIONS);
}

/**
 * The layers for a preset, in the order they are written: the preset's own source rows, then
 * `tests` where the toolchain's conventional test root exists, then the catch-all `general` row.
 *
 * **The test row is inserted here rather than in twelve switch arms** because it is one rule with
 * one exception table, and an arm that forgot it would be invisible — the profile would simply route
 * test work to `general`. {@link presetSourceLayers} always ends with the catch-all, which is what
 * the splice relies on to keep `general` last.
 *
 * **A `tests` row never clears the unresolved-source-root report, on either channel.** The source
 * rows are passed in rather than derived here so {@link buildPreset} gates its general-only warning
 * on `sourceRows`, not on the spliced length; `doctor`'s `layer-profile` check excludes the `tests`
 * row from the scoped rows that clear it, for the same reason. A repository that routes only its
 * test tree below the root has an unresolved **implementation** profile, which is what both channels
 * grade.
 */
function presetLayers(
  sourceRows: readonly HarnessLayer[],
  preset: PresetName,
  context: DetectContext,
): HarnessLayer[] {
  const rows = [...sourceRows];
  const tests = testsLayer(preset, context);
  if (tests === undefined) return rows;
  return [...rows.slice(0, -1), tests, rows[rows.length - 1] as HarnessLayer];
}

/**
 * The source layers for a preset, catch-all row last.
 *
 * **A layer whose directory does not exist is dropped rather than written**, so a generated config
 * never points an implementer at a path that is not there. A preset can therefore come back as
 * `general` alone; {@link buildPreset} says so rather than leaving it unexplained.
 */
function presetSourceLayers(preset: PresetName, context: DetectContext): HarnessLayer[] {
  switch (preset) {
    case 'layered-clean-arch': {
      const match = findLayeredRoot(context);
      const layers = (match?.dirs ?? []).map((dir) => layer(dir.name, dir.path, LAYERED_CONVENTIONS[dir.name]));
      return [...layers, generalLayer()];
    }
    case 'api-service': {
      const dir = findApiDir(context);
      return dir === undefined ? [generalLayer()] : [layer('api', dir, API_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'python-package': {
      const dir = findPythonPackageDir(context);
      return dir === undefined ? [generalLayer()] : [layer('package', dir, PACKAGE_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'flutter': {
      // A layered Flutter tree never reaches here: `layered-clean-arch:layer-directories` is
      // evaluated first and gives it `data`, `domain` and `presentation` pointed at the per-layer
      // documents. What arrives here is the feature-first `lib/`, whose decomposition into features
      // is a judgement call, so it gets the one directory that is certain.
      const dir = flutterSourceDir(context);
      return dir === undefined
        ? // `buildPreset`'s general-only warning then fires, which is the right answer: a pubspec
          // with no `lib/` has no source root to name.
          [generalLayer()]
        : [layer(DART_SOURCE_DIR, dir, MODULE_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'android-gradle': {
      // The single-module Android application this row exists for: one source root under the
      // module's main source set, named because it is deterministic, and pointed at the
      // single-module document for `flutter`'s reason — decomposing it into features is a
      // judgement call and therefore `/autonomous-sdlc-harness:harness-analyze`'s. A
      // **multi-module** Android repository laid out as root-level `data/`, `domain/`,
      // `presentation/` never reaches here: it matches `layered-clean-arch:layer-directories`,
      // which is evaluated well above this preset's row.
      const found = findAndroidModule(context);
      return found === undefined
        ? // `buildPreset`'s general-only warning then fires, which is the right answer: no module
          // resolved, so there is no source root to name.
          [generalLayer()]
        : [
            layer(
              'app',
              mainSourceDir(context, found.module) ?? mainSourceSet(found.module),
              MODULE_LAYER_CONVENTIONS,
            ),
            generalLayer(),
          ];
    }
    case 'jvm': {
      // Both build tools reach here, and both get the same one layer: a Maven or Gradle project's
      // sources live under one main source set, naming it is deterministic, and decomposing it into
      // modules or packages is a judgement call and therefore
      // `/autonomous-sdlc-harness:harness-analyze`'s. A **multi-module** JVM repository laid out as
      // root-level `data/`, `domain/`, `presentation/` never reaches here — it matches
      // `layered-clean-arch:layer-directories`, far above these rows.
      const dir = jvmSourceDir(context);
      return dir === undefined
        ? // `buildPreset`'s general-only warning then fires, which is the right answer: a project
          // with no `src/main` has no source root this table can name.
          [generalLayer()]
        : [layer('main', dir, MODULE_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'dotnet': {
      // One layer at the source root, and **not one per project file**, which is the deliberate
      // line here. Naming a layer per `.csproj` would take its name from the project file
      // (`MyApp.Infrastructure` → `infrastructure`) and thereby decide which project is which
      // layer — a judgement about the adopter's architecture, and therefore
      // `/autonomous-sdlc-harness:harness-analyze`'s, exactly as the `monorepo` and `flat` cases
      // below say for packages and modules. Naming `src/` is deterministic; naming its contents is
      // not.
      const dir = dotnetSourceDir(context);
      return dir === undefined
        ? // `buildPreset`'s general-only warning then fires, which is the right answer: a solution
          // whose projects sit somewhere other than `src/` has no source root this table can name.
          [generalLayer()]
        : [layer(DOTNET_SOURCE_DIR, dir, MODULE_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'apple-native': {
      // One source root, pointed at the single-module document for `flutter`'s reason: naming
      // `Sources/` — or the directory the Xcode container is named after — is deterministic, while
      // decomposing it into targets or feature modules is a judgement call and therefore
      // `/autonomous-sdlc-harness:harness-analyze`'s. The layer is called `sources` in both arms
      // even where the directory is `MyApp/`; {@link APPLE_LAYER_NAME} says why the two are allowed
      // to differ here.
      const dir = appleSourceDir(context);
      return dir === undefined
        ? // `buildPreset`'s general-only warning then fires, which is the right answer: a container
          // whose sources sit somewhere this table cannot name has no source root to name.
          [generalLayer()]
        : [layer(APPLE_LAYER_NAME, dir, MODULE_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'rust-cargo': {
      // One layer at the crate's `src/`, for {@link dotnetSourceDir}'s reason: naming the source
      // root is deterministic, while splitting it into modules — or a workspace into its members —
      // is a judgement call and therefore `/autonomous-sdlc-harness:harness-analyze`'s.
      const dir = cargoSourceDir(context);
      return dir === undefined
        ? // `buildPreset`'s general-only warning then fires, which is the right answer: a manifest
          // whose sources sit somewhere this table cannot name has no source root to name.
          [generalLayer()]
        : [layer(CARGO_SOURCE_DIR, dir, MODULE_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'ruby-bundler': {
      // One layer at whichever conventional source root exists, for {@link cargoSourceDir}'s
      // reason: naming `app/` or `lib/` is deterministic, while splitting either into the
      // sub-directories Rails puts there — `models/`, `controllers/`, `views/` — would decide the
      // adopter's architecture, which is a judgement call and therefore
      // `/autonomous-sdlc-harness:harness-analyze`'s. A Rails-shaped repository does not arrive here
      // at all: `api-service:route-directory` matches its `app/controllers` far above this preset's
      // row and gives it the better profile.
      const dir = firstSourceDir(context, RUBY_SOURCE_DIRS);
      return dir === undefined
        ? // `buildPreset`'s general-only warning then fires, which is the right answer: a `Gemfile`
          // with neither conventional source root has no source root this table can name.
          [generalLayer()]
        : [layer(dir.name, dir.path, MODULE_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'php-composer': {
      // One layer at whichever conventional source root exists, for the `ruby-bundler` arm's
      // reason: naming Laravel's `app/` or PSR-4's `src/` is deterministic, while splitting either
      // into the sub-directories a framework puts there — `Http/`, `Models/`, `Providers/` — would
      // decide the adopter's architecture, which is `/autonomous-sdlc-harness:harness-analyze`'s. A
      // Laravel-shaped repository does not arrive here at all: `api-service:route-directory` matches
      // its `routes/` far above this preset's row and gives it the better profile.
      const dir = firstSourceDir(context, PHP_SOURCE_DIRS);
      return dir === undefined
        ? // `buildPreset`'s general-only warning then fires, which is the right answer: a
          // `composer.json` with neither conventional source root has none this table can name.
          [generalLayer()]
        : [layer(dir.name, dir.path, MODULE_LAYER_CONVENTIONS), generalLayer()];
    }
    case 'cmake-cpp': {
      // The two conventional source roots, for the `rust-cargo` arm's reason: naming them is
      // deterministic, while splitting a C++ project into modules, targets or libraries is a
      // judgement call and therefore `/autonomous-sdlc-harness:harness-analyze`'s.
      // {@link CMAKE_HEADER_DIRS} says why `include/` is a row of its own and why it is a *source*
      // row.
      const source = firstSourceDir(context, CMAKE_SOURCE_DIRS);
      const headers = firstSourceDir(context, CMAKE_HEADER_DIRS);
      // Each absent root drops its row, the rule every arm above follows — so a project with
      // headers and no `src/` names what it has instead of falling to the catch-all, and one with
      // neither comes back as `general` alone and `buildPreset` warns about it.
      const rows = [
        ...(source === undefined ? [] : [layer(source.name, source.path, MODULE_LAYER_CONVENTIONS)]),
        ...(headers === undefined ? [] : [layer(headers.name, headers.path, MODULE_LAYER_CONVENTIONS)]),
      ];
      return [...rows, generalLayer()];
    }
    case 'monorepo':
    case 'flat':
      // Both are deliberately layer-less: the packages of a monorepo and the shape of an
      // unrecognised tree are judgement calls, and judgement is
      // `/autonomous-sdlc-harness:harness-analyze`'s.
      return [generalLayer()];
  }
}

/**
 * The dependency-install line anchored at an install site below the repository root, recorded in the
 * notes as it is built.
 *
 * One constructor for both sites that can produce it — {@link nodeCommands}' anchoring block and
 * {@link buildPreset}'s fallback for a repository with no root manifest — so the command line and the
 * sentence describing it cannot come to disagree. `because` is the only thing that differs: why the
 * root's own install is not what this repository gets.
 *
 * A note rather than a warning, for the reason `DetectContext.note` states — this is what a correct
 * nested adoption looks like.
 */
function anchoredDepInstall(context: DetectContext, site: NodeInstallSite, because: string): string {
  const anchored = `npm --prefix ${site.dir} ${site.hasLockfile ? 'ci' : 'install'}`;
  context.note(
    `commands.depInstall was derived from \`${site.manifest}\` and runs \`${anchored}\` from the repository root, because commands are executed there and ${because}`,
  );
  return anchored;
}

/**
 * Raw commands from the repository root's npm manifest, or `undefined` when there is none **or when
 * it declares none of the scripts this harness runs**.
 *
 * The family gate and the four **script-derived** keys still read the root manifest, for the reason
 * `DetectContext.rootPackageJson` states. `depInstall` is the exception and the only one:
 * it follows the manifest that was actually found, because it is a whole command line rather than a
 * script name resolved against the manifest the runner reads. Returning `undefined` from the gate
 * therefore does not cost the install — {@link buildPreset} derives it from the same site when no
 * family resolved one.
 *
 * **The gate is a resolved script, not a manifest that exists**, because a family whose search stops
 * the loop has to have something to offer. The fixture that forced it: a Go module carrying a
 * scripts-less root `package.json` — for a documentation site, or a lint-only tooling manifest —
 * answered `typecheck` and `test` as placeholders and `depInstall: npm install`, because this
 * function returned a truthy `depInstall`-only object and {@link buildPreset}'s loop broke before
 * `goCommands` ever ran. The same tree without that manifest answered `go vet ./...` and
 * `go test ./...`. A manifest declaring nothing the harness runs now stops nothing.
 */
function nodeCommands(context: DetectContext): Partial<RawCommands> | undefined {
  if (context.rootPackageJson() === undefined) return undefined;

  const scripts = context.scriptNames();
  const first = (candidates: readonly string[]): string | undefined => candidates.find((name) => scripts.has(name));
  const commands: Partial<RawCommands> = {};

  const typecheck = first(NODE_SCRIPT_CANDIDATES.typecheck);
  if (typecheck !== undefined) {
    commands.typecheck = `npm run ${typecheck}`;
    // A weak candidate is accepted and said out loud, at the severity the evidence supports. A
    // `tsconfig.json` at the root is file-existence evidence that the repository is typed, so a
    // `lint` line is very unlikely to be its type check and the adopter is told loudly; without one,
    // `lint` is plausibly exactly what they meant, and a warning on every correct plain-JS adoption
    // is how a warning list stops being read (`DetectContext.note`).
    if (WEAK_TYPECHECK_SCRIPTS.has(typecheck)) {
      const message = weakTypecheckMessage(typecheck, commands.typecheck);
      if (context.fileExists(TYPED_REPOSITORY_EVIDENCE)) context.warn(message);
      else context.note(message);
    }
  }
  // `npm test` rather than `npm run test`: it is the lifecycle script's own invocation.
  if (first(NODE_SCRIPT_CANDIDATES.test) !== undefined) commands.test = 'npm test';
  const build = first(NODE_SCRIPT_CANDIDATES.build);
  if (build !== undefined) commands.build = `npm run ${build}`;
  const devServer = first(NODE_SCRIPT_CANDIDATES.devServer);
  if (devServer !== undefined) commands.devServer = `npm run ${devServer}`;

  // The one arm {@link devServerPrestart} cannot fix, so it is said instead: a dev-server line that
  // serves pre-compiled output, and no `build` script to put in front of it. Where both resolve, the
  // generated wrapper runs the build before it launches and there is nothing to report.
  if (devServer !== undefined && build === undefined && PRECOMPILED_DEV_SERVER_SCRIPTS.includes(devServer)) {
    context.note(unbuildableDevServerNote(`npm run ${devServer}`));
  }

  // Nothing script-derived resolved, so this family has nothing to supply: hand the search on rather
  // than stopping it with a `depInstall`-only object. Everything below is unchanged for the case
  // where a script *did* resolve — the anchoring block and its workspace carve-out included.
  if (Object.keys(commands).length === 0) return undefined;

  // A `depInstall` derived from the root of a repository whose application nests under `appDir`
  // installs nothing for that application, and says `up to date` while doing it — so it is anchored
  // at the manifest that was actually found, with `--prefix` because commands run from the
  // repository root.
  //
  // **The workspace carve-out, which is load-bearing rather than incidental:** a workspace monorepo
  // keeps one lockfile at the root and a manifest per package, so `npm --prefix <member> ci` fails
  // for want of a lockfile while the root `npm ci` installs every member. `isWorkspaceRoot()` is the
  // test that separates the two, and it is the union of *both* the detection table's `monorepo` rows
  // — the `workspaces` key (`monorepo:workspaces-key`) and a workspace-tool manifest at the root
  // (`monorepo:workspace-manifest`, which a pnpm workspace matches without ever setting the key). One
  // predicate for both so the carve-out and the table cannot disagree about what a workspace root is.
  //
  // **The guard residual the anchored form carries**, recorded here so it is not re-derived from one
  // row of the table: the spelling is `allow` at `docs/guard-verification.md` row **a7**, and
  // **SILENT — one prompt** at row **b1**, whose fixture's `appDir` carries a character outside the
  // guard's path class (a scoped `packages/@acme/…`; **b4** is the bare form's `allow` and **b5** the
  // control attributing b1's silence to that character rather than to the shape). The anchoring is
  // left unconditional anyway: §(b) is an **open recorded residual** whose own bound is *do not widen
  // the class to buy it back*, and declining the anchor there would restore the silent no-install —
  // a prompt parks an unattended run, a green-but-empty install does not announce itself.
  const site = findNodeInstallSite(context);
  if (site !== undefined && site.dir !== '.' && !isWorkspaceRoot(context)) {
    commands.depInstall = anchoredDepInstall(
      context,
      site,
      'a bare `npm ci` at the root would install nothing for the application',
    );
  } else {
    // The lockfile is the whole difference: `npm ci` needs one and installs exactly it.
    commands.depInstall = context.fileExists(PACKAGE_LOCKFILE) ? 'npm ci' : 'npm install';
  }

  return commands;
}

/**
 * Say which manifest an anchored family's command lines came from, and where they run.
 *
 * One note per family rather than one per key: both keys come from the same manifest, so a second
 * line would repeat the only fact the first carries. It names both keys for that same reason — a
 * reader checking either line has to find it here, and a note whose subject is one key leaves the
 * other unexplained. A note rather than a warning, for the reason `DetectContext.note` states —
 * this is what a correct nested adoption looks like.
 */
function noteAnchoredFamily(context: DetectContext, manifest: string, typecheck: string, test: string): void {
  context.note(
    `commands.typecheck and commands.test were derived from \`${manifest}\` and run \`${typecheck}\` and \`${test}\` from the repository root, which is where every configured command is executed — the directory in each line is what points the tool at the manifest's own tree`,
  );
}

/**
 * Raw commands for a Python project, or `undefined` when no packaging manifest is present.
 *
 * **The directory argument is the fix, not a nicety.** Both lines are executed from the repository
 * root, so a bare `pytest` in a repository whose packaging manifest is nested reads none of that
 * manifest's configuration — its `testpaths`, its `rootdir`, its import path — and fails or, worse,
 * collects nothing. The argument points each tool at the tree the manifest was found in, which is
 * the same directory `findPythonManifest` already reported as the detection evidence.
 *
 * The root arm keeps today's exact strings, `pytest` bare rather than `pytest .`, so a repository
 * that is its own application generates what it generated before.
 */
function pythonCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findPythonManifest(context);
  if (manifest === undefined) return undefined;

  const dir = manifestDirectory(manifest);
  if (dir === '.') return { typecheck: 'mypy .', test: 'pytest' };

  const commands = { typecheck: `mypy ${dir}`, test: `pytest ${dir}` };
  noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
  return commands;
}

/**
 * Raw commands for a Go module, or `undefined` when there is no `go.mod`.
 *
 * `go -C <dir>` — a `go` 1.20 flag, and the spelling that keeps the package pattern `./...` meaning
 * the module rather than the repository root the command is executed from. Teaching the wrapper to
 * `cd` instead was declined: it would put a repo-relative path inside `templates/scripts/*.sh`,
 * where this module never writes and where a token-carrying template change owes the rendered
 * example a re-render.
 */
function goCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findGoManifest(context);
  if (manifest === undefined) return undefined;

  const dir = manifestDirectory(manifest);
  if (dir === '.') return { typecheck: 'go vet ./...', test: 'go test ./...' };

  const commands = { typecheck: `go -C ${dir} vet ./...`, test: `go -C ${dir} test ./...` };
  noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
  return commands;
}

/**
 * The paths, relative to the directory holding the `pubspec.yaml`, whose existence makes the package
 * an **application** and therefore selects the `flutter` tool over `dart`.
 *
 * Any one of them is enough. `lib/main.dart` is the entry point every Flutter application has;
 * `android/` and `ios/` are the platform trees `flutter create` writes and a plain package never
 * carries.
 *
 * Choosing wrong is not a cosmetic error in either direction: `dart analyze` on a Flutter
 * application reports every `package:flutter` import as unresolved, and `flutter test` in a
 * repository with no Flutter SDK on `PATH` cannot run at all.
 *
 * **This constant is now one of two positives, not the whole test.** An application with a
 * relocated entry point (`lib/src/…`, a multi-flavour `lib/main_dev.dart`) and no platform trees
 * checked in carries none of these markers and used to fall to `dart` — F68. The second positive is
 * `DetectContext.declaresFlutterSdk`, the manifest's own Flutter SDK dependency; why that read does
 * not reopen the no-content-heuristics rule is argued once, on `signals.ts`'s `PUBSPEC_MANIFEST`.
 * The disjunction is deliberately additive: every tree that resolved `flutter` before still does,
 * so the only repositories that move are the ones the finding names.
 */
const FLUTTER_APP_MARKERS = ['lib/main.dart', 'android', 'ios'] as const;

/** The `build_runner` configuration file, whose presence means sources are generated before analysis. */
const DART_CODEGEN_MANIFEST = 'build.yaml';

/** The generator a {@link DART_CODEGEN_MANIFEST} configures, named in the note as the usual spelling. */
const DART_CODEGEN_COMMAND = 'dart run build_runner build';

/**
 * Raw commands for a Dart or Flutter package, or `undefined` when there is no `pubspec.yaml`.
 *
 * **Two arms, two positives.** A package carrying any of {@link FLUTTER_APP_MARKERS}, or whose
 * manifest declares a Flutter SDK dependency, is an application and gets the `flutter` tool;
 * anything else is a plain Dart package and gets `dart`. The marker arm is evaluated first so the
 * cheap `statSync` probes short-circuit the manifest read. The two tools are not interchangeable in
 * either direction, for the reason that constant states.
 *
 * **`build` and `devServer` stay unset, deliberately.** `commands.build`'s only consumer is
 * `setup-worktree.sh`, which runs it in every worktree the flow cuts and which no agent invokes for
 * verification — so a `flutter build apk` would spend minutes per worktree and prove nothing that
 * `flutter analyze` and `flutter test` have not already proved. A dev server needs a device or
 * platform selection, which is a judgement call rather than something file existence answers; the
 * key is left absent and `undeclaredOptionalCommandNote` covers the one population that can be told
 * what to set.
 *
 * The directory argument on the anchored arm is `pythonCommands`' rule, for its reason: the lines
 * run from the repository root, so a bare `dart analyze` in a repository whose pubspec is nested
 * analyses the wrong tree or none.
 */
function dartCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findFlutterManifest(context);
  if (manifest === undefined) return undefined;

  const dir = manifestDirectory(manifest);
  const prefix = (path: string): string => (dir === '.' ? path : `${dir}/${path}`);
  const tool =
    FLUTTER_APP_MARKERS.some(
      (marker) => context.fileExists(prefix(marker)) || context.dirExists(prefix(marker)),
    ) || context.declaresFlutterSdk(manifest)
      ? 'flutter'
      : 'dart';

  const anchored = dir !== '.';
  const typecheck = anchored ? `${tool} analyze ${dir}` : `${tool} analyze`;
  const test = anchored ? `${tool} test ${dir}/test` : `${tool} test`;
  // **This family resolves `depInstall`, which neither the Python nor the Go family does**, and that
  // is what it is worth: `pub get` is the install a Dart repository actually needs, and resolving it
  // here means `buildPreset`'s npm fallback is never reached — so a Flutter repository carrying a
  // documentation-site `package.json` is not handed an `npm install` beside its Dart lines.
  const depInstall = anchored ? `${tool} pub get --directory ${dir}` : `${tool} pub get`;
  if (anchored) noteAnchoredFamily(context, manifest, typecheck, test);

  // A generated-source step is a **precondition of the analyzer**, not a fifth command key: the
  // analyze line fails on a missing `.g.dart` until the generator has run, so it belongs on the line
  // above it inside the wrapper `commands.typecheck` names. A `commands.codegen` would put a key in
  // the schema that one stack sets and every other reader has to skip.
  if (context.fileExists(prefix(DART_CODEGEN_MANIFEST))) {
    context.note(
      `\`${prefix(DART_CODEGEN_MANIFEST)}\` sits beside \`${manifest}\`, so this repository generates sources before they analyse and \`${typecheck}\` fails on a missing generated file until the generator has run: add that generator — \`${DART_CODEGEN_COMMAND}\` for the usual build_runner setup — as the line above it inside the wrapper script commands.typecheck names, rather than as a command key of its own`,
    );
  }

  return { typecheck, test, depInstall };
}

/**
 * The runner for a JVM build tool: the project's own wrapper script where the tree ships one,
 * `fallback` from `PATH` where it does not. One helper for all three JVM arms, because the rule is one
 * rule and three copies of it drift.
 *
 * **Below the root there are two candidates, co-located first.** The wrapper beside the manifest
 * belongs to the project these lines build, so it wins wherever it exists. A repository that keeps its
 * wrapper at the root with the manifest below it still gets a wrapper rather than a `PATH` lookup that
 * exits 127 on a machine with no system Maven or Gradle installed — the anchor these arms already emit
 * (`-f` for Maven, `-p` for Gradle) names the tree either way, so the root wrapper builds the same
 * project the co-located one would.
 */
function jvmRunner(context: DetectContext, dir: string, wrapper: string, fallback: string): string {
  const candidates = dir === '.' ? [wrapper] : [`${dir}/${wrapper}`, wrapper];
  const found = candidates.find((candidate) => context.fileExists(candidate));
  return found === undefined ? fallback : `./${found}`;
}

/**
 * Raw commands for an Android Gradle project, or `undefined` when no Android module resolved.
 *
 * **The two task names are AGP's own, not invented ones.** `compile<Variant>Sources` and
 * `test<Variant>UnitTest` are the per-variant tasks the Android Gradle plugin registers for every
 * application and library module, over the `debug` build type AGP always creates — the same
 * spellings on AGP 7 and 8 — so `compileDebugSources` type-checks the module's sources and
 * `testDebugUnitTest` runs its JVM unit tests without a device. A task name that could not be
 * established across both majors would have been left unresolved (placeholder plus the standing
 * warning) rather than shipped: this module's header forbids inventing a command outright, and a
 * Gradle invocation naming a task that does not exist fails with `Task not found`, which reads as a
 * broken repository rather than as an undetected command.
 *
 * `--console=plain --quiet` because these lines run unattended inside a wrapper script: the rich
 * console renders progress bars into a captured log, and `--quiet` leaves the failure output, which
 * is the only part a run reads. The exit status is untouched by either flag.
 *
 * **The runner is the wrapper when the project ships one.** `gradlew` pins the Gradle version the
 * project builds with, so `gradle` from `PATH` — whatever version that is — is the fallback for a
 * project that ships none, not the preference. {@link jvmRunner} is where the two candidate locations
 * and their order are argued.
 *
 * **`build`, `devServer` and `depInstall` are deliberately unset, each for its own reason.**
 * `commands.build`'s only consumer is `setup-worktree.sh`, which runs it in every worktree the flow
 * cuts and which no agent invokes for verification, so an `assembleDebug` would spend a multi-minute
 * native build per worktree and buy no verification an agent will ever run. An Android application
 * has no dev server to start. And Gradle resolves dependencies as part of the task being run, so a
 * separate install step would pay the same download twice per worktree and verify nothing.
 */
function androidGradleCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const found = findAndroidModule(context);
  if (found === undefined) return undefined;

  const runner = jvmRunner(context, found.root, GRADLE_WRAPPER, 'gradle');
  const anchored = found.root !== '.';
  // The lines run from the repository root, so a project below it is named with `-p` for
  // `pythonCommands`' reason: an invocation made at one directory and run at another builds the
  // wrong tree or none.
  const project = anchored ? ` -p ${found.root}` : '';
  const gradle = `${runner}${project} --console=plain --quiet`;

  const commands = { typecheck: `${gradle} compileDebugSources`, test: `${gradle} testDebugUnitTest` };
  if (anchored) noteAnchoredFamily(context, joinModuleManifest(found), commands.typecheck, commands.test);
  return commands;
}

/**
 * Raw commands for a Maven project, or `undefined` when there is no `pom.xml`.
 *
 * **Why a compiled stack still gets both required keys, and this is both JVM families' answer.**
 * `test` recompiles what `typecheck` compiled, on Maven and on Gradle alike, so the pair overlaps by
 * construction. It is kept anyway: `typecheck` is the cheaper of the two, it runs first on every
 * task, and it fails faster — a compile error is reported without waiting for a test tree to build
 * and run. Collapsing them would make every task pay the test run to learn it does not compile.
 *
 * `-q -B` because these lines run unattended inside a wrapper script: `-B` drops the ANSI progress
 * rendering that a captured log turns into noise, and `-q` leaves the failure output, which is the
 * only part a run reads. Neither touches the exit status.
 *
 * `compile` for `typecheck` and `test` for `test` are Maven's own lifecycle phases, present in every
 * POM without a plugin declaration, so neither is an invented command line — the rule this module's
 * header states. **`depInstall` is `dependency:go-offline`**, a real goal that resolves the whole
 * dependency tree into the local repository once per worktree, which is exactly what `depInstall`
 * exists for; `build` and `devServer` stay unset, because `commands.build`'s only consumer is
 * `setup-worktree.sh` and a `package` per worktree would prove nothing `compile` and `test` have not,
 * and a Maven project has no dev server file existence can start.
 *
 * `-f <dir>/pom.xml` below the root is `pythonCommands`' rule for its reason: every line is executed
 * from the repository root, so a bare `mvn` in a repository whose POM is nested builds the wrong
 * tree or none.
 *
 * **The runner is the wrapper when the project ships one**, for {@link androidGradleCommands}'
 * reason: `mvnw` pins the Maven version the project builds with, so `mvn` from `PATH` is the
 * fallback for a project that ships none. {@link jvmRunner} resolves it, preferring the wrapper in the
 * manifest's own directory — the one `-f` names — over one at the repository root.
 *
 * **A co-located wrapper is invoked by path from the repository root, which assumes `mvnw` resolves
 * its project base directory from its own location** (`find_maven_basedir "$(dirname "$0")"`) rather
 * than from the working directory — the property `gradlew` has too, and the one current
 * maven-wrapper releases ship, `mvn -N wrapper:wrapper` among them. A wrapper old enough to resolve
 * from `$(pwd)` would look for `.mvn/wrapper/` at the repository root instead of beside the POM;
 * `MAVEN_BASEDIR=<dir>` ahead of the line overrides that on both script generations. The
 * root-wrapper fallback is unexposed: its own directory *is* the root.
 *
 * **`./mvnw`, not `sh mvnw`.** The Gradle arms carry the identical exposure to a lost executable bit
 * and spell it `./gradlew`; `mvn -N wrapper:wrapper` writes `mvnw` executable and git records the
 * bit, so the interpreter is the project's choice to make. `sh mvnw` would run, behind an
 * interpreter this module picked, a wrapper the project's own tooling cannot — and a checkout that
 * lost the bit would succeed silently instead of failing while naming the file, which is the
 * actionable outcome.
 */
function mavenCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findMavenManifest(context);
  if (manifest === undefined) return undefined;

  const dir = manifestDirectory(manifest);
  const runner = jvmRunner(context, dir, MAVEN_WRAPPER, 'mvn');
  const mvn = dir === '.' ? `${runner} -q -B` : `${runner} -q -B -f ${manifest}`;
  const commands = { typecheck: `${mvn} compile`, test: `${mvn} test`, depInstall: `${mvn} dependency:go-offline` };
  if (dir !== '.') noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
  return commands;
}

/**
 * Raw commands for a plain JVM Gradle project, or `undefined` when it carries no Gradle manifest.
 *
 * **The two task names are the Java plugin's own, not invented ones.** `classes` compiles the main
 * source set and `test` runs the test one; both are registered by the `java` plugin every JVM
 * Gradle build applies, so neither can fail with `Task not found` on a project this row matched.
 * `assemble` was **not** taken for `build`: `commands.build`'s only consumer is `setup-worktree.sh`,
 * so a jar per worktree would buy no verification an agent runs.
 *
 * The runner, the `--console=plain --quiet` pair and the absent `depInstall` are
 * {@link androidGradleCommands}' answers for its reasons — the wrapper pins the Gradle version the
 * project builds with, the flags keep an unattended log readable, and Gradle resolves dependencies
 * as part of the task being run, so a separate install would pay the same download twice per
 * worktree. A JVM service has no dev server file existence can start, so `devServer` stays unset too.
 */
function gradleJvmCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findGradleManifest(context);
  if (manifest === undefined) return undefined;

  const root = manifestDirectory(manifest);
  const runner = jvmRunner(context, root, GRADLE_WRAPPER, 'gradle');
  const anchored = root !== '.';
  const gradle = `${runner}${anchored ? ` -p ${root}` : ''} --console=plain --quiet`;

  const commands = { typecheck: `${gradle} classes`, test: `${gradle} test` };
  if (anchored) noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
  return commands;
}

/**
 * Raw commands for a .NET repository, or `undefined` when no solution or project file was found.
 *
 * **`<target>` is the found solution or project, and it is present only below the repository
 * root.** Every configured command runs from the root, so a bare `dotnet build` in a repository
 * whose solution is nested finds no project and fails; at the root, `dotnet` resolves the single
 * solution or project itself, and naming it would add nothing.
 *
 * `--nologo` for {@link mavenCommands}' `-B` reason: these lines run unattended inside a wrapper,
 * and the banner is noise in a captured log. It does not touch the exit status or the diagnostics.
 *
 * **`typecheck` is the compile, and `test` recompiles it** — the overlap both JVM families already
 * document, kept for the same reason: `typecheck` is the cheaper of the two, runs first on every
 * task and fails faster than a test tree that has to build before it can report a type error.
 *
 * **`depInstall` is `dotnet restore`**, a real command that resolves the whole dependency graph
 * once per worktree, which is what that key is for. **`build` and `devServer` stay unset.**
 * `commands.build`'s only consumer is `setup-worktree.sh` and it is never agent-run, so an MSBuild
 * line there would duplicate the compile `typecheck` already runs and buy no verification; and
 * `dotnet run` needs a project chosen from among the solution's, which is a judgement rather than
 * something file existence answers. Both absences are visible — the optional keys are written as
 * nothing at all rather than as a placeholder, and `doctor` reports them.
 */
function dotnetCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const project = findDotnetProject(context);
  if (project === undefined) return undefined;

  const anchored = manifestDirectory(project) !== '.';
  const target = anchored ? ` ${project}` : '';
  const commands = {
    typecheck: `dotnet build --nologo${target}`,
    test: `dotnet test --nologo${target}`,
    depInstall: `dotnet restore${target}`,
  };
  if (anchored) noteAnchoredFamily(context, project, commands.typecheck, commands.test);
  return commands;
}

/**
 * What an Xcode-arm run has to say about the key it did not derive, and — where no single shared
 * scheme decided it — about the other one too.
 *
 * **`commands.test` is the one entry on this matrix that stays hand-written, and this is the
 * sentence that says so.** `xcodebuild test` requires a `-destination`, which names a simulator or a
 * device on the machine that runs it; no file in the repository states which, so deriving one would
 * be the invention this module's header forbids. The placeholder plus its standing warning is the
 * visible outcome the design prefers, and this note is what turns it from a gap into a decision.
 *
 * A **note** rather than a warning because it is not a fault of the repository, and because
 * `buildPreset` already raises the warning for the placeholder itself — a second warning saying the
 * same thing at the same severity reads as a bug.
 */
function appleXcodeNote(project: string, containerFlag: string, schemes: readonly string[]): string {
  const derived =
    schemes.length === 1
      ? `commands.typecheck was derived from the one scheme \`${project}\` shares, \`${schemes[0]}\`.`
      : `\`${project}\` shares ${schemes.length === 0 ? 'no scheme' : `${schemes.length} schemes (${schemes.join(', ')})`} under ` +
        `${XCODE_SHARED_SCHEMES_DIR}, so commands.typecheck was left unresolved as well: \`-scheme\` takes exactly one name, and ` +
        'picking among several — or inventing one where none is shared — is a judgement rather than something file existence answers.';
  const scheme = schemes.length === 1 ? schemes[0] : '<scheme>';
  return (
    `${derived} commands.test was not derived from \`${project}\`: \`xcodebuild test\` requires a \`-destination\`, which names a ` +
    'simulator or device on the machine that runs it and is therefore not a fact any file in this repository states — init wrote a ' +
    `placeholder rather than inventing one. Set commands.test to \`xcodebuild test -${containerFlag} ${project} -scheme ${scheme} ` +
    `-destination '<destination>'\` in harness.config.json, ${WRAPPED_KEY_SECOND_STEP}`
  );
}

/**
 * Raw commands for an Apple-native repository, or `undefined` when it holds neither a
 * `Package.swift` nor an Xcode container.
 *
 * **Two arms, and only one of them can serve both required keys.**
 *
 * *SwiftPM* — a `Package.swift` exists — yields `swift build` and `swift test`, both of which need
 * nothing but the manifest; below the repository root each carries `--package-path <dir>`, which is
 * `pythonCommands`' rule for its reason: the lines run from the root, and a bare `swift build` there
 * builds the wrong tree or none. **`depInstall` is `swift package resolve`**, carrying the same
 * `--package-path`, for {@link cargoCommands}' `cargo fetch` reason: {@link HarnessCommands.depInstall}
 * prepares a fresh checkout, its only consumer is `setup-worktree.sh`, so the resolve is paid once
 * per worktree instead of inside that worktree's first build. It is not paid twice — a later
 * `swift build` reads the `Package.resolved` and `.build/checkouts` the resolve wrote.
 * No `build` and no `devServer`: `commands.build`'s only consumer is `setup-worktree.sh`, so a
 * release build per worktree would prove nothing `swift build` and `swift test` have not, and a
 * package has no dev server file existence can start.
 *
 * *Xcode* — no `Package.swift`, but a project or workspace — yields `typecheck` **only when the
 * container shares exactly one scheme**, since `-scheme` takes one name and choosing among several
 * is not reproducible. `test` is left unresolved **in every case**, for the reason
 * {@link appleXcodeNote} states.
 *
 * **This arm stops the family search even where it resolved nothing**, which is the one departure
 * from the rule `nodeCommands` states, and the difference is a property of the manifest: an
 * `.xcodeproj` names the repository's own stack, where a `package.json` routinely appears in a
 * repository of another one. Handing the search on would pair an npm line with an Xcode repository
 * and leave {@link appleXcodeNote}'s explanation attached to a key some other family had filled —
 * so the placeholder stands and the note explains it.
 */
function appleCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findSwiftPackageManifest(context);
  if (manifest !== undefined) {
    const dir = manifestDirectory(manifest);
    const packagePath = dir === '.' ? '' : ` --package-path ${dir}`;
    const commands = {
      typecheck: `swift build${packagePath}`,
      test: `swift test${packagePath}`,
      depInstall: `swift package resolve${packagePath}`,
    };
    if (dir !== '.') noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
    return commands;
  }

  const project = findXcodeProject(context);
  if (project === undefined) return undefined;

  // `-workspace` when a workspace was found, `-project` otherwise: `xcodebuild` rejects the flag
  // that does not match the container it is handed.
  const containerFlag = project.endsWith(XCODE_WORKSPACE_SUFFIX) ? 'workspace' : 'project';
  const schemes = findSharedSchemes(context, project);
  const commands: Partial<RawCommands> = {};
  if (schemes.length === 1) {
    commands.typecheck = `xcodebuild -${containerFlag} ${project} -scheme ${schemes[0]} build`;
  }
  context.note(appleXcodeNote(project, containerFlag, schemes));
  return commands;
}

/**
 * What a Rust adoption's type-check key does that an adopter may not expect, and the softer line to
 * drop back to.
 *
 * A **note** rather than a warning, for the reason `DetectContext.note` states: a linting,
 * format-checking type check is what a correct Rust adoption looks like, not a fault of the
 * repository. It says the two things the line does beyond `cargo check` — lints fail rather than
 * print, and nothing the old line compiled goes uncompiled — and then the one-line way back, since a
 * crate adopted with existing lint or format debt would otherwise meet a red key on its first run.
 */
function cargoLintNote(typecheck: string): string {
  return (
    `commands.typecheck runs \`${typecheck}\`: on this family the static-analysis key is the linter, and ` +
    "`-D warnings` is what makes clippy's lints fail the key rather than print. No type error escapes by " +
    'that route — `cargo clippy --all-targets` compiles exactly what `cargo check --all-targets` compiled. ' +
    'A crate carrying existing lint or format debt can set commands.typecheck to `cargo check --all-targets` ' +
    `in harness.config.json, ${WRAPPED_KEY_SECOND_STEP}`
  );
}

/**
 * Raw commands for a Rust crate, or `undefined` when no `Cargo.toml` was found.
 *
 * **`--all-targets` is on the type check deliberately.** A bare `cargo clippy`, like the bare
 * `cargo check` this key used to run, covers the library and binary targets only, so tests and
 * benches go unchecked and the cheap key passes on code the expensive one then fails to compile —
 * the one outcome a type check exists to prevent.
 *
 * **The linter *is* the static-analysis key here**, as it is for {@link bundlerCommands}, whose
 * `typecheck` is `bundle exec rubocop`; the difference is the gate — RuboCop is a gem the repository
 * has to declare, while clippy and rustfmt are components of the toolchain a `Cargo.toml` already
 * commits the adopter to, so there is no config file to condition the line on and none is needed.
 * **`-D warnings` rather than a bare `cargo clippy`**, because clippy exits zero on every lint it
 * reports: the softer line is this module header's step that passes its verification by running
 * something that never checked anything, reached by a different route. The one consequence for
 * callers is that the line is a compound ending in `--`, so the `"$@"` `templates/scripts/typecheck.sh`
 * appends lands among rustc's flags rather than reaching a filter — that wrapper names this family as
 * one whose forwarding is not a bare filter.
 *
 * **`depInstall` is `cargo fetch`**, which downloads the whole dependency graph once per worktree,
 * which is what that key is for and what the type check needs before it can run offline.
 * **`build` and `devServer` stay unset**: `commands.build`'s only consumer is `setup-worktree.sh`,
 * so a `cargo build` there would recompile what the type check already compiled in a key no agent
 * runs, and a crate has no dev server file existence can start.
 *
 * `--manifest-path <dir>/Cargo.toml` below the root is {@link pythonCommands}' rule for its reason:
 * every line runs from the repository root, so a bare `cargo` there reads the wrong manifest or none.
 * Both halves of the compound carry it — `cargo fmt` takes the same flag — since an anchor on one
 * half leaves the other reading the root manifest or failing outright.
 */
function cargoCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findCargoManifest(context);
  if (manifest === undefined) return undefined;

  const anchored = manifestDirectory(manifest) !== '.';
  const target = anchored ? ` --manifest-path ${manifest}` : '';
  // The format check runs first: it is the cheap half, and its failure is the mechanical one.
  const commands = {
    typecheck: `cargo fmt --check${target} && cargo clippy --all-targets${target} -- -D warnings`,
    test: `cargo test${target}`,
    depInstall: `cargo fetch${target}`,
  };
  context.note(cargoLintNote(commands.typecheck));
  if (anchored) noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
  return commands;
}

/** The RuboCop configuration file names, either of which selects the type-check line. */
const RUBOCOP_CONFIGS = ['.rubocop.yml', '.rubocop.yaml'] as const;

/** The RSpec and Minitest directories, whose existence decides which test runner the line names. */
const RSPEC_DIR = 'spec';
const MINITEST_DIR = 'test';

/** The file `rake` reads its tasks from — the precondition of the Minitest line, and its Ruby evidence. */
const RAKEFILE = 'Rakefile';

/**
 * Raw commands for a Bundler-managed Ruby repository, or `undefined` when there is no `Gemfile`.
 *
 * **`typecheck` is emitted only where the repository configures RuboCop, and is left unresolved
 * otherwise.** Ruby has no type checker in the general case — Sorbet and Steep are opt-in and each
 * needs its own configuration and a `srb`/`steep` gem — so there is no line that verifies anything
 * about an arbitrary Ruby repository. A `.rubocop.yml` is the repository's own declaration that it
 * has a static check to run, and where it is absent the key gets the placeholder and its warning,
 * which tells the adopter what to fill in rather than handing them a step that passes on anything.
 *
 * **`test` is decided by file and directory existence, not judgement**: `spec/` is RSpec's fixed
 * location, and Minitest's `test/` counts only where a `Rakefile` sits beside the manifest, since
 * `rake` reads its tasks from that file and `bundle exec rake test` aborts with `No Rakefile found`
 * without one. A repository evidencing neither leaves the key unresolved for the reason above.
 * RSpec is tried first because a repository carrying both directories is an RSpec suite with a
 * leftover `test/` more often than the reverse.
 *
 * That `Rakefile` precondition is load-bearing twice over, and the second time for the node gate
 * below: a `test/` directory is not Ruby evidence — it is `node:test`'s, Mocha's, Tape's and Ava's
 * conventional directory too — so on its own it must not resolve a verifier and thereby satisfy a
 * gate that exists to establish the stack is Ruby. The `Rakefile` is what makes it evidence, as
 * well as what makes the line runnable.
 *
 * **No `build` and no `devServer`.** `commands.build`'s only consumer is `setup-worktree.sh`, and
 * Ruby is interpreted — there is nothing to build — while a Rails server needs a port and a binding
 * to be chosen, which is judgement rather than something file existence answers; the unset key is
 * visible in the generated config, so nothing is hidden by leaving it out.
 *
 * Below the root each line is prefixed with `BUNDLE_GEMFILE=<dir>/Gemfile `, which is the anchoring
 * {@link pythonCommands} does with an argument: every line runs from the repository root, and
 * `bundle` has no `-C`/`--directory` flag, so the environment variable is the only spelling that
 * points it at the nested manifest. It is legitimate here because the line lands inside the
 * adopter's own wrapper script, where a shell prefix is an ordinary command line rather than a
 * change to anybody's environment — and the directory is passed to the runner as well, so the
 * runner reads the nested tree rather than the root — a path for `rubocop` and `rspec`, `rake`'s
 * own `-C` chdir flag for the Minitest line, since a `Rakefile` is found relative to the working
 * directory rather than named on the command line.
 *
 * The anchoring **note** is raised only where both required keys resolved, because the one sentence
 * {@link noteAnchoredFamily} writes names both: a repository that resolved only one gets the
 * placeholder warning on the other, which names the manifest roots that were searched.
 *
 * **It hands the search on where it would answer with an install and nothing else, in a repository
 * whose root manifest declares an npm script.** This is the family half of the
 * `ruby-bundler:gemfile` row's guard (`detect/signals.ts`, {@link declaresNodeScript}), and the row
 * guard alone does not reach it: this family is tried above `npm` whether or not that row matched,
 * and it used to return a truthy object unconditionally — so a React Native repository, whose root
 * `Gemfile` pins CocoaPods and fastlane rather than declaring a Ruby stack, stopped the search on
 * `bundle install` alone and left both required keys as placeholders with its own npm scripts
 * unread.
 *
 * The condition is narrow on both sides deliberately. `bundle install` is still the whole answer for
 * a Ruby repository that configures neither verifier, because {@link declaresNodeScript} is false
 * there and no other family is waiting to answer — the invariant that this declines only where
 * another derivation is ready. And a `Gemfile` repository that resolved **either** verifier keeps
 * every line it resolved, npm scripts beside it or not, which is what leaves a Rails application
 * with an asset-pipeline `package.json` on `bundle exec rspec` rather than on `npm run build`.
 * That second half holds only because every arm above resolves on a Ruby-specific file — a RuboCop
 * configuration, a `spec/` directory, a `Rakefile` beside `test/` — so a Node repository carrying a
 * root `Gemfile` for CocoaPods, fastlane or Jekyll resolves nothing here and the gate still reaches
 * it, whatever directories it shares with a Ruby tree.
 */
function bundlerCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findBundlerManifest(context);
  if (manifest === undefined) return undefined;

  const dir = manifestDirectory(manifest);
  const anchored = dir !== '.';
  const at = (name: string): string => (anchored ? `${dir}/${name}` : name);
  const prefix = anchored ? `BUNDLE_GEMFILE=${manifest} ` : '';

  const commands: Partial<RawCommands> = { depInstall: `${prefix}bundle install` };
  if (RUBOCOP_CONFIGS.some((name) => context.fileExists(at(name)))) {
    commands.typecheck = `${prefix}bundle exec rubocop${anchored ? ` ${dir}` : ''}`;
  }
  if (context.dirExists(at(RSPEC_DIR))) {
    commands.test = `${prefix}bundle exec rspec${anchored ? ` ${at(RSPEC_DIR)}` : ''}`;
  } else if (context.fileExists(at(RAKEFILE)) && context.dirExists(at(MINITEST_DIR))) {
    commands.test = `${prefix}bundle exec rake${anchored ? ` -C ${dir}` : ''} test`;
  }
  if (commands.typecheck === undefined && commands.test === undefined && declaresNodeScript(context)) return undefined;
  if (anchored && commands.typecheck !== undefined && commands.test !== undefined) {
    noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
  }
  return commands;
}

/** The PHPStan configuration file names, either of which selects the type-check line. */
const PHPSTAN_CONFIGS = ['phpstan.neon', 'phpstan.neon.dist'] as const;

/** The Psalm configuration file names — the second analyser, tried only where PHPStan configured none. */
const PSALM_CONFIGS = ['psalm.xml', 'psalm.xml.dist'] as const;

/** The PHPUnit configuration file names, either of which selects the test line. */
const PHPUNIT_CONFIGS = ['phpunit.xml', 'phpunit.xml.dist'] as const;

/**
 * Raw commands for a Composer-managed PHP repository, or `undefined` when there is no
 * `composer.json`.
 *
 * **Both verifiers are emitted only on the repository's own configuration file, and left unresolved
 * otherwise** — {@link bundlerCommands}' rule, for a sharper version of its reason. PHP has no
 * analyser every project has: PHPStan and Psalm are each opt-in, each installed as a dev dependency,
 * and each needs its own configuration file, so naming one the repository does not configure would
 * emit a line that fails on `vendor/bin` not existing rather than a check that verifies anything.
 * PHPUnit is dominant but equally optional, and the same holds. PHPStan is tried before Psalm
 * because a repository configuring both is a PHPStan project with a Psalm baseline more often than
 * the reverse, and first-match has to answer one.
 *
 * **`depInstall` is load-bearing here rather than a nicety.** Both lines above run out of
 * `vendor/bin`, which does not exist until `composer install` has run — so without this key every
 * command this family emits fails on a fresh worktree, where for an interpreted stack with global
 * tooling it would only be slower. `--no-interaction` because the line runs unattended inside a
 * wrapper script.
 *
 * **No `build` and no `devServer`.** `commands.build`'s only consumer is `setup-worktree.sh` and PHP
 * is interpreted, so there is nothing to build; `php artisan serve` needs a port and a host chosen,
 * which is judgement rather than something file existence answers.
 *
 * Below the root, `--working-dir <dir>` for composer and `-c <dir>/<config file>` for the analyser
 * and PHPUnit — {@link pythonCommands}' anchoring rule for its reason: every line runs from the
 * repository root, so a bare invocation there reads the wrong configuration or none. The anchoring
 * **note** is raised only where both required keys resolved, for {@link bundlerCommands}' reason.
 */
function composerCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findComposerManifest(context);
  if (manifest === undefined) return undefined;

  const dir = manifestDirectory(manifest);
  const anchored = dir !== '.';
  const at = (name: string): string => (anchored ? `${dir}/${name}` : name);
  const found = (names: readonly string[]): string | undefined => names.find((name) => context.fileExists(at(name)));
  const config = (name: string): string => (anchored ? ` -c ${at(name)}` : '');
  const bin = (name: string): string => (anchored ? `${dir}/vendor/bin/${name}` : `vendor/bin/${name}`);

  const commands: Partial<RawCommands> = {
    depInstall: `composer install --no-interaction${anchored ? ` --working-dir ${dir}` : ''}`,
  };

  const phpstan = found(PHPSTAN_CONFIGS);
  const psalm = phpstan === undefined ? found(PSALM_CONFIGS) : undefined;
  if (phpstan !== undefined) {
    commands.typecheck = `${bin('phpstan')} analyse --no-progress${config(phpstan)}`;
  } else if (psalm !== undefined) {
    commands.typecheck = `${bin('psalm')} --no-progress${config(psalm)}`;
  }

  const phpunit = found(PHPUNIT_CONFIGS);
  if (phpunit !== undefined) commands.test = `${bin('phpunit')}${config(phpunit)}`;

  if (anchored && commands.typecheck !== undefined && commands.test !== undefined) {
    noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
  }
  return commands;
}

/** The directory this family configures into — its own choice, not something the repository states. */
const CMAKE_BUILD_DIR = 'build';

/**
 * Raw commands for a CMake-configured C++ repository, or `undefined` when there is no
 * `CMakeLists.txt`.
 *
 * **`typecheck` is a compound line, and that is the point of it.** `ctest` runs the tests a build
 * tree already holds, so it has nothing to run until the project has been configured and built —
 * unlike every interpreted stack here, where the two keys are independent. So `typecheck` is
 * `cmake -S <dir> -B <build> && cmake --build <build>`: the configure step and the compile that is
 * the only static check a C++ project has, joined because the second is meaningless without the
 * first. The whole line lands inside `typecheck.sh`, where a compound is an ordinary command line
 * rather than two command keys — the same shape a code-generation precondition takes on the line
 * above an analyzer.
 *
 * **`test` therefore carries the same configure-and-build prefix**, composed from the same string
 * `typecheck` is given so the two cannot drift: `ctest --test-dir <build>` reads a build tree, and
 * nothing in the plugin corpus establishes an order between `commands.typecheck` and
 * `commands.test` — every site naming both names `<test_cmd>` first — so `test` has to stand on its
 * own. A worktree `setup-worktree.sh` provisioned carries no build tree either, since this family
 * emits no `build` key, so a bare `ctest` there fails on a missing directory before a test runs,
 * which reads as a broken checkout rather than as a step out of order. Configure and build are both
 * incremental, so the repeated pair costs near-nothing where `typecheck` has already run.
 *
 * **`build/` is this family's own choice, not the repository's**, and it is the one argument in
 * this module not read off a file that exists: no CMake project declares where its build tree
 * goes, so a name had to be picked, and `build/` is the one the ecosystem's own documentation and
 * default `.gitignore` entries use. Both keys are composed from the same value, so neither can come
 * to name a different tree than the other.
 *
 * **No `build` key**: the compile is already inside `typecheck`, and `commands.build`'s only
 * consumer is `setup-worktree.sh`, so a second compile there would repeat a multi-minute native
 * build in every worktree the flow cuts. **No `devServer`**: a C++ project has none file existence
 * could start. **No `depInstall`**: dependency acquisition in a CMake project is project-specific —
 * `FetchContent` at configure time, a git submodule, a system package manager, Conan or vcpkg — and
 * none of it is derivable from the manifest's existence, so any line here would be invented.
 *
 * Below the repository root every path carries `<dir>`, {@link pythonCommands}' anchoring rule for
 * its reason: each line runs from the repository root, so a bare `cmake` there configures the wrong
 * tree or none.
 */
function cmakeCommands(context: DetectContext): Partial<RawCommands> | undefined {
  const manifest = findCmakeManifest(context);
  if (manifest === undefined) return undefined;

  const dir = manifestDirectory(manifest);
  const build = dir === '.' ? CMAKE_BUILD_DIR : `${dir}/${CMAKE_BUILD_DIR}`;
  const configureAndBuild = `cmake -S ${dir} -B ${build} && cmake --build ${build}`;
  const commands = {
    typecheck: configureAndBuild,
    test: `${configureAndBuild} && ctest --test-dir ${build} --output-on-failure`,
  };
  if (dir !== '.') noteAnchoredFamily(context, manifest, commands.typecheck, commands.test);
  return commands;
}

/** Where {@link findAndroidModule} looks for an {@link ANDROID_MANIFEST}, repo-relative to a manifest root. */
const ANDROID_MODULE_MANIFESTS = ANDROID_MODULE_DIRS.map((module) =>
  module === '.' ? ANDROID_MANIFEST : `${module}/${ANDROID_MANIFEST}`,
);

/** The manifest an Android family's note names: the file that resolved the module. */
function joinModuleManifest(found: AndroidModule): string {
  return found.module === '.' ? ANDROID_MANIFEST : `${found.module}/${ANDROID_MANIFEST}`;
}

/**
 * The manifests `init` reads, as the undetected-command warning has to enumerate them: one entry per
 * family, the Python family's three alternatives spelled out because any one of them is enough.
 *
 * Composed from the locators' own constants rather than restated, so a manifest name added to
 * detection cannot go missing from the sentence that says what was looked for.
 *
 * **Exported for the test that asserts the sentence**, which derives what it expects from this
 * constant — splitting on the `, ` that separates families, and asserting each family's entry whole
 * — instead of restating a list that every newly supported stack extends. Entries are asserted whole
 * because a family's entry may be a path (Android's), whose segments are not manifest names.
 */
export const READ_MANIFESTS = [
  PACKAGE_MANIFEST,
  PYTHON_MANIFESTS.join('/'),
  GO_MANIFEST,
  PUBSPEC_MANIFEST,
  // The one entry that is a path rather than a root-level name: an Android manifest is what tells a
  // module from a plain JVM one, and it is looked for under `ANDROID_MODULE_DIRS` rather than in a
  // manifest root directly, so the spelling here is the one `findAndroidModule` actually tests. Its
  // alternatives are separated by ` or ` where every other family's are separated by `/`, because a
  // `/` between two paths reads as one longer path — the same spelling the Android signal's own
  // `description` uses for this pair.
  ANDROID_MODULE_MANIFESTS.join(' or '),
  MAVEN_MANIFEST,
  GRADLE_MANIFESTS.join('/'),
  // Suffixes rather than names, spelled as a glob is: a .NET solution and project are named after
  // the product, so `*.sln` is what an adopter recognises where `MyApp.sln` would name nothing.
  DOTNET_SOLUTION_SUFFIXES.map((suffix) => `*${suffix}`).join('/'),
  DOTNET_PROJECT_SUFFIXES.map((suffix) => `*${suffix}`).join('/'),
  SWIFT_PACKAGE_MANIFEST,
  // Suffixes again, for the .NET names' reason: an Xcode container is named after the product.
  XCODE_PROJECT_SUFFIXES.map((suffix) => `*${suffix}`).join('/'),
  CARGO_MANIFEST,
  BUNDLER_MANIFEST,
  COMPOSER_MANIFEST,
  CMAKE_MANIFEST,
].join(', ');

/**
 * The manifest roots as a sentence names them: `.` is the repository root, never a bare dot.
 *
 * Exported so `init`'s command-source line spells the roots the way every message raised here does
 * (`commands/init.ts`, `commandSourceLine`), rather than growing a second vocabulary for one fact.
 */
export function searchedRoots(context: DetectContext): string {
  return context.manifestRoots.map((root) => (root === '.' ? 'the repository root' : `\`${root}\``)).join(' or ');
}

/** A script the nested manifest declares, and the root-anchored line that runs it from the root. */
interface NestedScript {
  /** Repo-relative path of the application directory's manifest — the file the warning names. */
  readonly manifest: string;
  /** The script name it declares for this key. */
  readonly script: string;
  /** The line to paste into `commands.<key>`, anchored so it resolves from the repository root. */
  readonly command: string;
}

/**
 * What `<appDir>/package.json` declares for a script-derived key, or `undefined` when it declares
 * nothing for it — and `undefined` outright when the application is the repository.
 *
 * The candidate lists are {@link nodeCommands}' own, read from {@link NODE_SCRIPT_CANDIDATES} rather
 * than restated: this offers to paste exactly what detection would have derived had this manifest been
 * the root's, anchored with `--prefix` because commands are executed from the repository root. `npm
 * test` rather than `npm run test` for the same reason `nodeCommands` gives — it is the lifecycle
 * script's own invocation.
 *
 * **It takes any of the four keys, not only the required two**, because the optional pair is answered
 * with nothing at all where the required pair at least gets a placeholder — see
 * {@link undeclaredOptionalCommandNote}. Widening this reader widens no derivation: every caller is a
 * sentence, and `rootPackageJson`'s only-the-root rule still decides what `commands.*` holds.
 */
function nestedScriptFor(context: DetectContext, key: ScriptDerivedCommandKey): NestedScript | undefined {
  if (context.appDir === '.') return undefined;
  const scripts = appScriptNames(context);
  const script = NODE_SCRIPT_CANDIDATES[key].find((name) => scripts.has(name));
  if (script === undefined) return undefined;
  return {
    manifest: `${context.appDir}/${PACKAGE_MANIFEST}`,
    script,
    command: `npm --prefix ${context.appDir} ${key === 'test' ? 'test' : `run ${script}`}`,
  };
}

/**
 * The second step for a key whose value is **inlined into a wrapper**, with the condition that re-run
 * carries — one spelling, because the wrapper-form mismatch the next `init` reports is the same path
 * (`generators/scripts.ts`, `wrappedKeyMismatchMessage`) and two wordings of it read as two remedies.
 */
const WRAPPED_KEY_SECOND_STEP =
  "then re-run init: it inlines that line into this key's wrapper script — wrappers are create-if-absent, " +
  'so one already on disk takes `init --force` (which backs it up to a `.bak` first) or deleting instead — ' +
  'and names the wrapper invocation to finish with';

/**
 * What a {@link WEAK_TYPECHECK_SCRIPTS} selection means, and what to set instead.
 *
 * **One text for both channels**, because the fact does not change with the severity: the same
 * sentence is raised as a warning on a repository carrying {@link TYPED_REPOSITORY_EVIDENCE} and as a
 * note on one that does not, and only the channel differs. It reuses {@link WRAPPED_KEY_SECOND_STEP}
 * rather than restating it, so `init`, `config set` and `doctor` keep describing one remedy for a
 * wrapped key. It names no replacement command: deriving one from a `tsconfig.json` would invent a
 * line the manifest does not declare, against this module's own rule.
 */
function weakTypecheckMessage(script: string, command: string): string {
  return (
    `commands.typecheck was derived from the \`${script}\` script and set to \`${command}\`: \`${script}\` is the last ` +
    'candidate for this key because it may not type-check at all — a lint run without type-aware rules exits zero on a type ' +
    'error, so the verification step passes having checked nothing. Set commands.typecheck to a command that type-checks this ' +
    `repository in harness.config.json, ${WRAPPED_KEY_SECOND_STEP}`
  );
}

/**
 * What a pre-compiled dev-server line with no build script exposes, and the two ways out of it.
 *
 * A **note** rather than a warning: a repository whose start script needs no build — a static server,
 * an interpreted entry point — is not at fault, and file existence cannot tell that repository from
 * one whose `dist/` is simply missing (`DetectContext.note`). It names both remedies because they are
 * genuinely alternatives: declaring `build` makes {@link devServerPrestart} answer and the generated
 * wrapper run it before it launches, and pointing the key at a watch-mode script removes the exposure
 * instead of covering it.
 */
function unbuildableDevServerNote(command: string): string {
  return (
    `commands.devServer was derived as \`${command}\`, which serves whatever was last compiled, and this manifest ` +
    'declares no `build` script to run before it: after an uncompiled edit the interactive test phase tests stale ' +
    'output, and on a fresh worktree where the build directory does not exist the server fails to start. Declare a ' +
    '`build` script — the generated dev-server wrapper then runs that line to completion before it launches — or ' +
    'point commands.devServer at a watch-mode script, which compiles as it serves'
  );
}

/** What an unset optional key costs, and what follows setting it — the two halves that differ by key. */
interface OptionalCommandRemedy {
  /** What the absence costs at run time, so the note is actionable rather than trivia. */
  readonly cost: string;
  /** What happens after the value is set: this key's own wrapping, which is not the same for both. */
  readonly afterSetting: string;
}

/**
 * The consequence of each unset optional key, named by the file that consumes it.
 *
 * `build` is one of the two keys that are never wrapped (this module's header), so its remedy ends at
 * the config value; `devServer` is wrapped, so its remedy is the same second step arm 1 of
 * {@link undetectedCommandWarning} names.
 */
const OPTIONAL_COMMAND_REMEDIES: Readonly<Record<OptionalCommandKey, OptionalCommandRemedy>> = {
  build: {
    cost: 'so `setup-worktree.sh` skips the build in every worktree the flow cuts',
    afterSetting: 'and nothing further: `build` is never wrapped, so that raw line is what runs',
  },
  devServer: {
    cost: 'so the interactive test phase has nothing to start the application with when `phases.qa` is on',
    afterSetting: WRAPPED_KEY_SECOND_STEP,
  },
};

/**
 * Why an optional command is absent from the generated config, where `<appDir>/package.json` declares
 * the script it would have come from.
 *
 * **This is the required keys' arm 1, for the two keys that get no placeholder.** An unresolved
 * `build` or `devServer` is simply not written — no key, no placeholder, and without this sentence no
 * line of output either — which is the silent gap the `depInstall` anchoring exists to remove, one key
 * over. It says the same three things arm 1 says (the manifest, the script it declares, the
 * root-anchored line to set) plus what the absence costs, because a key nothing warns about is a key
 * nobody sets.
 *
 * A **note** rather than a warning: an optional key is optional, and the repository is not at fault
 * for nesting its application (`DetectContext.note`).
 */
function undeclaredOptionalCommandNote(key: OptionalCommandKey, nested: NestedScript): string {
  const keyPath = `commands.${key}`;
  const remedy = OPTIONAL_COMMAND_REMEDIES[key];
  return (
    `${keyPath} was not derived from \`${nested.manifest}\`, which declares a \`${nested.script}\` script: ` +
    `commands run from the repository root, where a nested script does not resolve — init left the key ` +
    `unset, ${remedy.cost}. Set ${keyPath} to \`${nested.command}\` in harness.config.json, ${remedy.afterSetting}`
  );
}

/**
 * Why a required command was not detected, in four arms — **each of which has to be true of the
 * repository it is printed on**, which is the whole reason there is more than one.
 *
 * 1. **A nested manifest declares it.** `rootPackageJson`'s only-the-root rule is what left the key
 *    unresolved, and the repository does hold the command; the true sentence names that manifest, its
 *    script and the root-anchored line to paste. It then names the **second** step — a re-run, with the
 *    condition that re-run carries: wrappers are `create-if-absent`, so a plain re-run inlines the line
 *    only where the wrapper file is absent, which is the ordinary state of a key that held the
 *    placeholder, and one left on disk by an earlier adoption takes `--force` or a delete. That is the
 *    same pair `wrappedKeyMismatchMessage` names, so the remedy here and the wrapper-form mismatch the
 *    next `init` reports are one path rather than two instructions that appear to contradict each other
 *    (`generators/scripts.ts`).
 * 2. **A manifest `init` reads is present.** {@link commandFamilies} stops at the first family whose
 *    derivation returns a command set, not at the first whose manifest exists, and a family that
 *    resolves only some keys — `bundler` and `composer` derive a
 *    `depInstall` alone, the Xcode arm a `typecheck` alone — leaves the rest unresolved beside a
 *    manifest that could have answered them. Saying *no manifest `init` reads was found* is false
 *    there, so this arm names the manifest that is there and the reason it did not answer instead.
 *    It is asked **before** arm 3 as well as arm 4, because arm 3's sentence carries the same denial.
 * 3. **An unread manifest is present.** Saying *no manifest in this repository* is false on a
 *    repository whose only manifest is a root `Makefile`; what is true is *no manifest `init` reads*.
 *    Naming what is there costs one existence check.
 * 4. **None of them.** The plain case, still stated as what was looked for and where, rather than as a
 *    claim about what the repository does not contain.
 *
 * Only the sentence differs: every arm has already written {@link placeholderCommand} into the key,
 * so the wrapper selection and the permission profile that follow from it are identical in all four.
 * Arm 1 is Node-only by construction — {@link findPythonManifest} and {@link findGoManifest} search
 * `manifestRoots`, so a nested Python or Go manifest is read and its commands are emitted.
 */
function undetectedCommandWarning(context: DetectContext, key: RequiredCommandKey): string {
  const keyPath = `commands.${key}`;

  const nested = nestedScriptFor(context, key);
  if (nested !== undefined) {
    return (
      `${keyPath} was not derived from \`${nested.manifest}\`, which declares a \`${nested.script}\` script: ` +
      'commands run from the repository root, where a nested script does not resolve — init wrote a ' +
      `placeholder. Set ${keyPath} to \`${nested.command}\` in harness.config.json, ${WRAPPED_KEY_SECOND_STEP}`
    );
  }

  const remedy = `init wrote a placeholder; set ${keyPath} in harness.config.json before the first run`;

  const found = findAnyReadManifest(context);
  if (found !== undefined) {
    return (
      `${keyPath} could not be detected: \`${found}\` was found in ${searchedRoots(context)}, but the ` +
      'command family that answered for this repository derives no line for this key — the first family ' +
      `whose derivation returns a command set supplies every key it can and the search stops there. ${remedy}`
    );
  }

  const lookedFor = `no manifest init reads (${READ_MANIFESTS}) was found in ${searchedRoots(context)}`;
  const unread = findUnreadManifest(context);
  return unread === undefined
    ? `${keyPath} could not be detected: ${lookedFor} — ${remedy}`
    : `${keyPath} could not be detected: ${lookedFor}; \`${unread}\` is present but is not one of them — ${remedy}`;
}

/**
 * One command family: a stack's derivation, under the id the ordering and the hoist table name it by.
 *
 * A registry rather than a literal list because every stack added to this module adds a row here, and
 * a row carrying its own id is what lets {@link SIGNAL_COMMAND_FAMILY} name a family without holding a
 * function reference.
 */
interface CommandFamily {
  /** Stable identifier — the value {@link SIGNAL_COMMAND_FAMILY} maps a signal id onto. */
  readonly id: string;
  /** This family's raw commands, or `undefined` when the repository gives it nothing to derive from. */
  resolve(context: DetectContext): Partial<RawCommands> | undefined;
  /**
   * The repo-relative manifest **this family reads**, or `undefined` when it is absent.
   *
   * A locator only locates: it calls the finder this row's own {@link resolve} calls, in the same
   * spelling `READ_MANIFEST_LOCATORS` uses for that file (`detect/signals.ts`), and raises no
   * warning and no note. It is not a gate — {@link resolve} decides whether the family answers, and
   * a family whose manifest exists may still decline.
   */
  readonly manifest: (context: DetectContext) => string | undefined;
}

/**
 * The command families, in the order they are tried.
 *
 * **The first family whose derivation returns a command set supplies everything it can, and the
 * search stops there** — the gate is a resolved command set rather than a manifest that exists
 * ({@link fallbackAnchorReason}), so a family whose manifest is present may still decline and hand
 * the search on ({@link PresetProfile.declinedFamilies} is the only record of that).
 * Falling through to a second family for a key the first could not resolve would mean
 * pairing, say, an npm type-check with a `pytest` run in a repository that has both manifests —
 * a combination nothing in the repository asked for. An unresolved key stays unresolved and says
 * so.
 *
 * **`npm` is last**, and the reason is a property of the manifest rather than a preference between
 * stacks: `package.json` is the manifest here that most often appears in a repository of another
 * stack — a documentation site, a lint-or-format tooling manifest, a bundled front end — while
 * `go.mod`, `pyproject.toml` and most manifests a later family adds name the repository's own stack.
 * Ordering it last costs the npm repositories nothing, because a repository whose stack really is
 * Node carries no `go.mod` or `pyproject.toml` for an earlier family to answer with. The two
 * manifests that share `package.json`'s property are handled by a gate on their own family instead —
 * the two paragraphs below.
 *
 * **`bundler` stays above `npm` and carries the guard on its own gate instead.** A `Gemfile` has
 * `package.json`'s "appears in a repository of another stack" property — the React Native template
 * ships one at the repository root — so the paragraph above would move it below `npm` as well, and
 * that is deliberately not what was done: a Rails application's preset comes from the
 * directory-shaped `api-service:route-directory` row, which hoists nothing, and Rails routinely
 * carries an asset-pipeline `package.json`, so the move would answer `npm run build` where `bundle
 * exec rspec` is the right line. `bundlerCommands` declines instead, and only where it would answer
 * with `bundle install` and nothing else in a repository whose root manifest declares a script —
 * which is the React Native population and not the Rails one.
 *
 * **`cmake` is the one family below `npm`, on npm's own argument taken one step further.** A
 * `CMakeLists.txt` routinely describes a *sub-component* of a Node repository — a `node-gyp` /
 * `cmake-js` addon — so between those two manifests the npm one is the more specific claim, and
 * `nodeCommands`' gate is what tells them apart: it answers only where the root manifest declares a
 * script, which an addon's does and a C++ tree's `package.json` (if it has one at all) does not.
 * Nothing a genuine C++ adopter gets moves, because `SIGNAL_COMMAND_FAMILY` hoists `cmake` whenever
 * the `cmake-cpp:cmake-lists` row decided the preset — and that row declines the addon for the same
 * reason this order does (`detect/signals.ts`, `declaresNodeScript`).
 *
 * A new family's row goes **immediately above the `npm` row**, and its signal id(s) go into
 * {@link SIGNAL_COMMAND_FAMILY}.
 */
const COMMAND_FAMILIES: readonly CommandFamily[] = [
  { id: 'python', resolve: pythonCommands, manifest: findPythonManifest },
  { id: 'go', resolve: goCommands, manifest: findGoManifest },
  { id: 'dart', resolve: dartCommands, manifest: findFlutterManifest },
  {
    id: 'android-gradle',
    resolve: androidGradleCommands,
    // The module manifest rather than the Gradle project directory: the spelling
    // {@link noteAnchoredFamily} already prints for this family, and the file that resolved it.
    manifest: (context) => {
      const found = findAndroidModule(context);
      return found === undefined ? undefined : joinModuleManifest(found);
    },
  },
  // Both JVM families sit **below** `android-gradle`, which the Gradle one would otherwise answer
  // for: an Android project carries the Gradle manifests this family gates on, and `classes` is not
  // the task that compiles an Android module.
  { id: 'maven', resolve: mavenCommands, manifest: findMavenManifest },
  { id: 'gradle-jvm', resolve: gradleJvmCommands, manifest: findGradleManifest },
  { id: 'dotnet', resolve: dotnetCommands, manifest: findDotnetProject },
  // Swift package first, Xcode container second — `appleCommands`' own order.
  { id: 'apple-native', resolve: appleCommands, manifest: (c) => findSwiftPackageManifest(c) ?? findXcodeProject(c) },
  { id: 'cargo', resolve: cargoCommands, manifest: findCargoManifest },
  { id: 'bundler', resolve: bundlerCommands, manifest: findBundlerManifest },
  { id: 'composer', resolve: composerCommands, manifest: findComposerManifest },
  // The **root** manifest only, which is `nodeCommands`' own gate: a `package.json` under a manifest
  // root below the repository root is not what this family reads.
  {
    id: 'npm',
    resolve: nodeCommands,
    manifest: (context) => (context.rootPackageJson() === undefined ? undefined : PACKAGE_MANIFEST),
  },
  { id: 'cmake', resolve: cmakeCommands, manifest: findCmakeManifest },
];

/**
 * {@link COMMAND_FAMILIES}' ids, in evaluation order, exported so the document that describes the
 * order can be checked against it rather than paraphrasing it (`docs/cli.md` §4, closure case in
 * `test/stack-presets.test.mjs`). A family whose paragraph drifts out of order fails there.
 */
export const COMMAND_FAMILY_IDS: readonly string[] = COMMAND_FAMILIES.map((family) => family.id);

/**
 * The family a matched signal row hoists to the front, by `Signal.id`.
 *
 * The generalisation of the `python-package` special case this replaced: where the row that decided
 * the preset is a **manifest** row, that manifest is the repository's own declaration of its stack,
 * so its family answers first whatever the standing order is. A row with no entry here — every
 * directory-shaped row, and `FORCED_SIGNAL_ID`, which evaluated no row at all — hoists nothing and
 * takes {@link COMMAND_FAMILIES} as it stands.
 */
const SIGNAL_COMMAND_FAMILY: Readonly<Record<string, string>> = {
  'monorepo:workspaces-key': 'npm',
  'monorepo:workspace-manifest': 'npm',
  'python-package:packaging-manifest': 'python',
  'api-service:go-module': 'go',
  'flutter:pubspec-manifest': 'dart',
  'android-gradle:android-manifest': 'android-gradle',
  'jvm:maven-manifest': 'maven',
  'jvm:gradle-manifest': 'gradle-jvm',
  'dotnet:solution-or-project': 'dotnet',
  'apple-native:swift-package-or-xcode-project': 'apple-native',
  'rust-cargo:cargo-manifest': 'cargo',
  'ruby-bundler:gemfile': 'bundler',
  'php-composer:composer-manifest': 'composer',
  'cmake-cpp:cmake-lists': 'cmake',
};

/** {@link COMMAND_FAMILIES} with the family {@link SIGNAL_COMMAND_FAMILY} names for this run first. */
function commandFamilies(detection: DetectionResult): readonly CommandFamily[] {
  const hoisted = COMMAND_FAMILIES.find((family) => family.id === SIGNAL_COMMAND_FAMILY[detection.matchedSignal]);
  return hoisted === undefined ? COMMAND_FAMILIES : [hoisted, ...COMMAND_FAMILIES.filter((f) => f !== hoisted)];
}

/**
 * Why {@link buildPreset}'s fallback anchors the install below the root — one sentence per population
 * it is reached on, because {@link anchoredDepInstall} prints the clause beside the line it returns
 * and the two must not come to disagree.
 *
 * Two populations since the family gate became a resolved script rather than a manifest that exists:
 * the repository with no root manifest at all, and the repository whose root manifest declares none
 * of the script names the four command keys accept.
 */
function fallbackAnchorReason(context: DetectContext): string {
  return context.rootPackageJson() === undefined
    ? 'this repository declares no npm manifest at its root to install from'
    : 'the root manifest declares no script this harness runs, so the install follows the manifest that does';
}

/**
 * How every reporting string names where the command lines came from — the family that answered and
 * **its own** manifest, or the family alone when its locator found none.
 *
 * One composer, because the fact is one fact: two spellings of it would let one run's output name
 * the same source two ways. Its only caller is {@link commandSourceClaim}, which wraps it in the
 * subject clause the three reporting strings share; no caller pairs a family with a manifest itself,
 * since the pair is {@link PresetProfile.commandManifest}'s, recorded from the winning family's own
 * locator. Not exported: {@link commandSourceClaim} is the module's one door onto this sentence, and
 * a second door is how the source and what it supplied come to be reported independently again.
 */
function commandSource(family: string, manifest: string | undefined): string {
  return manifest === undefined
    ? `the \`${family}\` command family`
    : `the \`${family}\` command family, which read \`${manifest}\``;
}

/**
 * Which of the two required keys the winning family actually supplied, and where they came from —
 * the subject clause all three reporting strings open on ({@link familyTiebreakNote},
 * {@link splitDetectionNote}, `commands/init.ts`'s `commandSourceLine`).
 *
 * **A family having answered is not both keys having resolved.** {@link buildPreset}'s loop stops at
 * the first family whose `resolve` returns anything that is not `undefined`, and the populations
 * where that set is partial or empty are this module's own documented ones
 * ({@link undetectedCommandWarning}): `composer` and `bundler` derive a `depInstall` alone, the
 * Xcode arm a `typecheck` alone or — with no single shared scheme — an empty object, and `npm`
 * answers off a `build` script with neither verifier. Naming both keys on that gate printed a
 * sentence the same run's warnings contradicted, so the subject is built from
 * {@link PresetProfile.resolvedRequired} instead.
 *
 * One composer for all three callers, for {@link commandSource}'s reason: two spellings would let
 * one run's output make two different claims about one fact.
 *
 * @param claim.resolvedRequired the keys the winner resolved, in {@link REQUIRED_COMMAND_KEYS}
 *   order — never re-derived by a caller.
 * @param verb `detection-resolved` is the kept-re-run spelling: that run wrote no key, so it reports
 *   what detection resolved rather than what a key holds (`commands/init.ts`, `commandSourceLine`).
 */
export function commandSourceClaim(
  claim: {
    readonly family: string;
    readonly manifest: string | undefined;
    readonly resolvedRequired: readonly RequiredCommandKey[];
  },
  verb: 'came-from' | 'detection-resolved' = 'came-from',
): string {
  const source = commandSource(claim.family, claim.manifest);
  const resolved = claim.resolvedRequired;

  // Neither key: no source is claimed for the required pair at all, because there is none to claim.
  // Both keys carry `undetectedCommandWarning`, which holds the remedy.
  if (resolved.length === 0) {
    return `neither commands.typecheck nor commands.test was derived by ${source}`;
  }

  const named = resolved.map((key) => `commands.${key}`).join(' and ');
  const head =
    verb === 'came-from' ? `${named} came from ${source}` : `stack detection resolved ${named} from ${source}`;
  if (resolved.length === REQUIRED_COMMAND_KEYS.length) return head;

  const missing = REQUIRED_COMMAND_KEYS.filter((key) => !resolved.includes(key));
  // The placeholder is what a written key holds; a kept re-run wrote none, so it says only what the
  // family did — the same rule that chose the verb.
  const held = verb === 'came-from' ? ' and carries a placeholder' : '';
  return `${head}; ${missing.map((key) => `commands.${key}`).join(' and ')} was not derived by it${held}`;
}

/**
 * Which manifests collided at this repository's roots, which family answered and what became of the
 * families above it — the choice F66 measured as leaving no trace in the run's output.
 *
 * **It states four things and no fifth, and three tempting sentences are false here.** The winner is
 * not the first family whose *manifest* is present ({@link fallbackAnchorReason}: the gate is a
 * resolved command set), a listed manifest was not necessarily left unread, and "nothing else was
 * consulted" is false on the React Native shape this note exists for — `bundlerCommands` reads the
 * `Gemfile`, builds `bundle install` and yields on {@link declaresNodeScript}. What is true about a
 * non-winning family is {@link PresetProfile.declinedFamilies}, so that is what is said.
 *
 * A **note** rather than a warning: the winning row was correct on every fixture measured, and a
 * warning that fires on every correct multi-manifest repository is how a warnings block stops being
 * read (`DetectContext.note`). Its remedy is {@link undetectedCommandWarning}'s shape — set the key
 * by hand and re-run — because taking a different lane is a configuration edit rather than a fault
 * to be fixed, and both keys here are wrapped ({@link WRAPPED_KEY_SECOND_STEP}).
 */
function familyTiebreakNote(profile: {
  readonly family: string;
  readonly manifest: string | undefined;
  readonly resolvedRequired: readonly RequiredCommandKey[];
  readonly readManifests: readonly string[];
  readonly declinedFamilies: readonly string[];
}): string {
  const others = profile.readManifests.filter((entry) => entry !== profile.manifest);
  // "these lines" has no referent where the winner supplied neither required key, which is a
  // reachable population ({@link commandSourceClaim}) — so that arm says what is true of the others
  // without naming lines nobody got.
  const supplied = profile.resolvedRequired.length === 0 ? 'did not supply them either.' : 'did not supply these lines.';
  const present =
    others.length === 0
      ? ''
      : ` ${others.map((entry) => `\`${entry}\``).join(', ')} ${others.length === 1 ? 'is' : 'are'} present too and ` +
        supplied;
  const declined =
    profile.declinedFamilies.length === 0
      ? ''
      : ` ${profile.declinedFamilies.map((id) => `\`${id}\``).join(', ')} ` +
        `${profile.declinedFamilies.length === 1 ? 'was tried, read its manifest' : 'were tried, read their manifests'} ` +
        'and declined.';
  return (
    `${commandSourceClaim(profile)}, and this ` +
    `repository carries more than one manifest init reads.${present}${declined} Families are tried in a fixed order ` +
    `(${COMMAND_FAMILY_IDS.join(', ')}), with the family this run's matched detection signal names hoisted to the ` +
    'front, and the first family whose derivation returns a command set supplies every key it can — the search stops ' +
    "there. To put this repository on another family's line, set the key you want to change — " +
    `commands.typecheck or commands.test — in harness.config.json, ${WRAPPED_KEY_SECOND_STEP}`
  );
}

/**
 * That `unrecognised layout` is a verdict on the **layer** half alone, where the command half
 * resolved — the second thing F66 measured as silent.
 *
 * `FLAT_FALLBACK_WARNING` (`detect/signals.ts`) is raised before any family has run and is left
 * exactly as it is: it belongs to detection and knows nothing about the command half. This note is
 * the half that does, so it narrows the scope of that warning instead of restating it. It is raised
 * only where **a required key resolved** — where none did, both required keys already carry
 * {@link undetectedCommandWarning}, and a second line saying the same thing is duplication. That is
 * the same gate as before on the same reasoning; what changed is that a family having answered no
 * longer stands in for a key having resolved ({@link commandSourceClaim}), so the "did resolve"
 * clause is now gated on what it asserts. Where exactly one key resolved the clause is true of that
 * key and the composer says so about the other.
 */
function splitDetectionNote(claim: {
  readonly family: string;
  readonly manifest: string | undefined;
  readonly resolvedRequired: readonly RequiredCommandKey[];
}): string {
  return (
    'no layout signal matched this repository, so the `flat` fallback supplied the layer profile and ' +
    `\`/${PLUGIN_NAME}:harness-analyze\` is what refines it — the command half did resolve: ${commandSourceClaim(claim)}. ` +
    'The unrecognised-layout warning is about the layer profile ' +
    'alone, not about the command lines this run wrote'
  );
}

/** What a preset is worth: the layers, the raw command lines, and what the adopter should know. */
export interface PresetProfile {
  readonly preset: PresetName;
  /** Ready for `harness.config.json`'s `layers`, always ending with `general`. */
  readonly layers: readonly HarnessLayer[];
  /** The raw command lines — see this module's header for what does and does not consume them. */
  readonly rawCommands: RawCommands;
  /** Warnings raised while building the profile. Detection's own warnings are not repeated here. */
  readonly warnings: readonly string[];
  /** Notes raised while building the profile. Detection's own notes are not repeated here. */
  readonly notes: readonly string[];
  /**
   * The {@link CommandFamily.id} whose `resolve` answered, or `undefined` when none did and both
   * required keys are placeholders.
   *
   * The evaluation order is {@link COMMAND_FAMILIES} with {@link SIGNAL_COMMAND_FAMILY}'s hoist
   * applied for this run's matched signal, so "first family" is not that list's literal order on
   * every run.
   */
  readonly commandFamily: string | undefined;
  /**
   * The manifest {@link commandFamily} read — its own {@link CommandFamily.manifest} — `undefined`
   * when no family answered or the winner's locator finds none.
   *
   * **The one place a family→manifest correspondence is produced.** Nothing downstream re-derives
   * it, and in particular it is never {@link readManifests}`[0]`: the two lists are ordered
   * differently.
   */
  readonly commandManifest: string | undefined;
  /**
   * Which of the two required keys {@link commandFamily} actually resolved, in
   * {@link REQUIRED_COMMAND_KEYS} order — empty where none did, including where a family answered
   * with a command set carrying neither.
   *
   * **Recorded, so no consumer re-derives it**, on {@link commandManifest}'s rule: a reporting line
   * that inferred "both keys" from `commandFamily !== undefined` contradicted the same run's
   * placeholder warnings. `rawCommands` cannot answer it downstream — every unresolved required key
   * is filled with {@link placeholderCommand} before the profile is returned.
   */
  readonly resolvedRequired: readonly RequiredCommandKey[];
  /**
   * Every manifest `init` reads that is present (`detect/signals.ts`, `findReadManifests`).
   *
   * **What was present, never what supplied the lines.** Its order is `READ_MANIFEST_LOCATORS`',
   * which is not {@link COMMAND_FAMILIES}', so no entry may be paired with a family by position.
   */
  readonly readManifests: readonly string[];
  /**
   * The ids of the families that were evaluated, returned `undefined`, **and** whose manifest is
   * present — the families that had a manifest to read and still declined.
   *
   * The search stops at the first family whose `resolve` returns a command set, not at the first
   * whose manifest exists, so a family above the winner may have read its manifest and declined
   * (`bundlerCommands`' {@link declaresNodeScript} yield). This is the only field that records it.
   * Families below the winner were never evaluated and never appear here.
   */
  readonly declinedFamilies: readonly string[];
}

/**
 * Turn a detection result into the layers and raw commands `init` writes.
 *
 * Takes the {@link DetectionResult} rather than a preset name so it reuses the probe detection
 * already built: the repository is read once per run and a warning cannot be reported twice.
 */
export function buildPreset(detection: DetectionResult): PresetProfile {
  const { preset, context } = detection;
  const sourceRows = presetSourceLayers(preset, context);
  const layers = presetLayers(sourceRows, preset, context);

  // Gated on the **source** rows, not on `layers`: a `tests` row is spliced in whenever the
  // toolchain's conventional test root exists, and gating on the spliced length would silence this
  // warning for a repository whose source root did not resolve but whose test root did.
  // `flat` is excluded because its own fallback warning already says to run
  // `/autonomous-sdlc-harness:harness-analyze`, and the same advice twice in one summary reads as a
  // bug rather than as emphasis.
  //
  // The trailing clause names what `doctor` will say about the same repository, gated on the set
  // `doctor` gates its arms on rather than on this warning's own population, which is far wider:
  // only `LAYERLESS_BY_DESIGN_PRESETS` reaches `LAYER_PROFILE_CHECK`'s by-design **pass**; every
  // other preset here resolved no source root and takes that check's **warn** arm, so blessing it
  // would be false. Neither clause claims the other command's grade for itself.
  if (sourceRows.length === 1 && preset !== 'flat') {
    const disposition = LAYERLESS_BY_DESIGN_PRESETS.has(preset)
      ? '`doctor` grades this a decision rather than drift, and it does not grade `layer-drift` while the profile carries no row below the root, so the directories under it are not enumerated anywhere until a profile is proposed'
      : "`doctor` keeps warning about it as an unresolved source root until a profile is recorded, since nothing else repeats this line";
    context.warn(
      `the \`${preset}\` preset gives this repository the \`general\` layer only — per-package or per-module layers are \`/${PLUGIN_NAME}:harness-analyze\`'s to propose. ${disposition}`,
    );
  }

  // One `resolve` call per iteration and the `break` intact: a second call on an already-evaluated
  // family would re-emit its own notes and warnings, and evaluating a family below the winner would
  // put a note about a family that never answered into the run's output. The `manifest` calls beside
  // it only locate.
  const resolved: Partial<RawCommands> = {};
  let commandFamily: string | undefined;
  let commandManifest: string | undefined;
  const declinedFamilies: string[] = [];
  for (const family of commandFamilies(detection)) {
    const commands = family.resolve(context);
    if (commands !== undefined) {
      Object.assign(resolved, commands);
      commandFamily = family.id;
      commandManifest = family.manifest(context);
      break;
    }
    if (family.manifest(context) !== undefined) declinedFamilies.push(family.id);
  }

  // The dependency install is a whole command line rather than a script name resolved against the
  // manifest the runner reads, so it is derivable from a nested manifest even where `nodeCommands`'
  // root-manifest gate never opened — the repository whose only npm manifest is
  // `<appDir>/package.json`, where no npm family answers and the script-derived keys are placeholders.
  // Leaving it unset there is the silent no-install the anchoring exists to remove:
  // `setup-worktree.sh` installs nothing into every worktree the flow cuts, and the commands the run
  // has just told the adopter to configure then fail for want of `node_modules`.
  //
  // **The root install site is included, deliberately.** `depInstall` is a whole command line rather
  // than a verification key, it is already derived independently of whichever family won, and it is
  // one of the two keys that are never wrapped and never allow-listed (this module's header) — so
  // emitting it beside a non-npm family's `typecheck` and `test` is not the family-mixing
  // {@link commandFamilies} forbids. Its price is stated rather than hidden: every repository whose
  // keys come from a non-npm family while a root `package.json` sits beside them now gains a root npm
  // install, which `setup-worktree.sh` runs in every worktree the flow cuts.
  //
  // **The workspace carve-out applies here too**, which it did not have to before: this fallback used
  // to be reachable only where the root declared no manifest at all, so there was no root install to
  // keep. `nodeCommands`' gate is now a resolved *script*, so the fallback is reached **with a root
  // manifest present** whenever that manifest declares none of the four keys' script names — and a
  // workspaces root with a scripts-less `package.json` under `--app-dir <member>` would otherwise get
  // `npm --prefix <member> ci`, the exact failure the carve-out exists to prevent, since a workspace
  // keeps its one lockfile at the root.
  if (resolved.depInstall === undefined) {
    const site = findNodeInstallSite(context);
    if (site !== undefined) {
      resolved.depInstall =
        site.dir !== '.' && !isWorkspaceRoot(context)
          ? anchoredDepInstall(context, site, fallbackAnchorReason(context))
          : // The lockfile is the whole difference, exactly as in `nodeCommands`' root arm.
            context.fileExists(PACKAGE_LOCKFILE)
            ? 'npm ci'
            : 'npm install';
    }
  }

  // Read **before** the placeholder loop below, which is the only window in which it is readable:
  // that loop fills every unresolved required key, after which `resolved` no longer distinguishes a
  // derived line from a placeholder.
  const resolvedRequired = REQUIRED_COMMAND_KEYS.filter((key) => resolved[key] !== undefined);

  for (const key of REQUIRED_COMMAND_KEYS) {
    if (resolved[key] !== undefined) continue;
    resolved[key] = placeholderCommand(key);
    context.warn(undetectedCommandWarning(context, key));
  }

  // The optional pair gets no placeholder and therefore no warning, so an unresolved one leaves no
  // trace at all — the same silent gap the `depInstall` anchoring above exists to remove, on the two
  // keys `setup-worktree.sh` and the interactive test phase read. Reported only where
  // `<appDir>/package.json` declares the script:
  // a repository that has no build step is ordinary, and a note on every such run is how a notes block
  // stops being read.
  for (const key of OPTIONAL_COMMAND_KEYS) {
    if (resolved[key] !== undefined) continue;
    const nested = nestedScriptFor(context, key);
    if (nested !== undefined) context.note(undeclaredOptionalCommandNote(key, nested));
  }

  // One call, and above both notes below rather than beside the return literal: this locator raises
  // neither a warning nor a note, so reading it here keeps that independent of statement order.
  const readManifests = findReadManifests(context);

  // The two reporting lines, last of everything this function raises — the module reports what it
  // did, then what an adopter should know about it. Both are gated on a family having answered:
  // where none did, both required keys already carry `undetectedCommandWarning`. Neither derives a
  // fact — each reads the values recorded above and says what they are, `resolvedRequired` included,
  // so neither can claim a key the winner did not supply.
  //
  // The split-detection note carries the second gate: its subject is that the command half *did*
  // resolve, so a winner that resolved neither required key leaves it unraised, for the same reason
  // no family answering does — both keys already carry `undetectedCommandWarning`.
  if (commandFamily !== undefined) {
    const claim = { family: commandFamily, manifest: commandManifest, resolvedRequired };
    if (readManifests.length > 1) {
      context.note(familyTiebreakNote({ ...claim, readManifests, declinedFamilies }));
    }
    if (detection.matchedSignal === FLAT_FALLBACK_SIGNAL_ID && resolvedRequired.length > 0) {
      context.note(splitDetectionNote(claim));
    }
  }

  // Assembled key by key rather than spread, so the two required keys are required in the type as
  // well as in the loop above, and an optional key that was not resolved is absent rather than
  // present-and-undefined.
  const rawCommands: RawCommands = {
    typecheck: resolved.typecheck ?? placeholderCommand('typecheck'),
    test: resolved.test ?? placeholderCommand('test'),
  };
  if (resolved.build !== undefined) rawCommands.build = resolved.build;
  if (resolved.devServer !== undefined) rawCommands.devServer = resolved.devServer;
  if (resolved.depInstall !== undefined) rawCommands.depInstall = resolved.depInstall;

  return {
    preset,
    layers,
    rawCommands,
    warnings: context.drainWarnings(),
    notes: context.drainNotes(),
    commandFamily,
    commandManifest,
    resolvedRequired,
    readManifests,
    declinedFamilies,
  };
}
