/**
 * Stack detection: which layer preset an adopting repository gets, and the evidence for it.
 *
 * **The rule this module exists to enforce: detection is pure file-existence and top-level
 * manifest-key inspection, evaluated as an ordered first-match-wins table.** No content
 * heuristics, no scoring, no language model. `init` has to be reproducible — a second `init`
 * against the same tree must reach the same answer, and an adopter must be able to re-derive what
 * `init` decided by reading this table — and a judgement call cannot offer that. Refining a
 * profile with judgement is `/autonomous-sdlc-harness:harness-analyze`'s job, not this table's: it
 * **proposes** a revision and applies it through `config set layers` after a yes, never writing
 * `harness.config.json` itself. That is why the last row is an unconditional fallback rather than a
 * refusal: an unrecognised layout is exactly the repository
 * `/autonomous-sdlc-harness:harness-analyze` exists to handle, and refusing there would block
 * adoption on it.
 *
 * **{@link SIGNALS} is exported as data** so `docs/cli.md` documents the same rows the code
 * evaluates, in the same order, instead of a prose paraphrase that drifts from them.
 *
 * What this module does **not** do: it never formats a wrapper-script invocation and never reads
 * `scriptsDir`. Detection yields a preset name; `detect/presets.ts` turns that into layers and
 * **raw** command lines; the wrapper scripts those raw lines end up inside, and the
 * `bash <scriptsDir>/<name>.sh` value that lands in `commands.*`, belong to the wrapper-script
 * writer and the config generator respectively.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { posix, relative, resolve } from 'node:path';

import { DETECTION_PRESET_NAMES } from '../config/model.js';
import { EXIT, HarnessError } from '../core/errors.js';
import { isJsonObject, readJsonFile, type JsonObject } from '../core/json.js';
import { insideRepo } from '../core/paths.js';
import { ANALYZE_COMMAND } from '../core/pluginIdentity.js';

/**
 * The layer presets, in signal-table order — the schema's `detection.preset` enum, re-exported
 * from `config/model.ts` rather than declared a second time here, so the enum a config is validated
 * against and the set this table's rows are typed by cannot disagree.
 *
 * This is also the set `--preset` is validated against — see {@link parsePresetName} — so adding a
 * preset means adding it to `config/model.ts`, to the schema's `detection.preset` enum, giving it a
 * row in {@link SIGNALS} and giving it layers in `detect/presets.ts`. Nothing else enumerates them.
 */
export const PRESET_NAMES = DETECTION_PRESET_NAMES;

export type PresetName = (typeof PRESET_NAMES)[number];

/** {@link DetectionResult.matchedSignal} when `--preset` bypassed the table. */
export const FORCED_SIGNAL_ID = 'forced';

/** {@link DetectionResult.matchedSignal} when no signal matched and the `flat` row caught the run. */
export const FLAT_FALLBACK_SIGNAL_ID = 'flat:fallback';

/** The warning the `flat` fallback row carries, so an unrecognised layout says what to do next. */
export const FLAT_FALLBACK_WARNING =
  `unrecognised layout — using the \`flat\` preset; run \`${ANALYZE_COMMAND}\` to refine the layer profile`;

/**
 * The npm manifest, read for its top-level `workspaces` key and its `scripts` **names**.
 *
 * Exported for one consumer outside this module: the undetected-command warning in
 * `detect/presets.ts` enumerates the manifests `init` reads, and a second spelling of this name there
 * would let the sentence and the reader drift apart.
 */
export const PACKAGE_MANIFEST = 'package.json';

/** The npm lockfile, whose presence is the whole difference between `npm ci` and `npm install`. */
export const PACKAGE_LOCKFILE = 'package-lock.json';

/** Workspace-tool manifests. Existence only — none of them is parsed. */
export const WORKSPACE_MANIFESTS = ['pnpm-workspace.yaml', 'lerna.json', 'turbo.json', 'nx.json'] as const;

/** The three directory names of a layered clean-architecture source tree. */
export const LAYERED_DIR_NAMES = ['data', 'domain', 'presentation'] as const;

export type LayeredDirName = (typeof LAYERED_DIR_NAMES)[number];

/**
 * How many of {@link LAYERED_DIR_NAMES} must be present for the layered signal to match.
 *
 * Two rather than three: a repository that has grown `data/` and `domain/` but keeps its UI
 * elsewhere is still a layered tree, and requiring all three would push it to `flat` — the one
 * outcome that costs the adopter a hand-written layer list. One would be too little: a lone
 * `data/` directory is a common name in trees that are not layered at all.
 */
export const LAYERED_MIN_MATCHES = 2;

/** Directory names that mark a request-handling layer. Checked in this order. */
export const API_DIR_NAMES = ['routes', 'controllers', 'handlers', 'api'] as const;

/** Python packaging manifests. Existence only — none of them is parsed. */
export const PYTHON_MANIFESTS = ['pyproject.toml', 'setup.py', 'setup.cfg'] as const;

/** The Go module manifest. Existence only. */
export const GO_MANIFEST = 'go.mod';

/**
 * The Dart/Flutter package manifest. Existence only, for every row of the signal table.
 *
 * Its content is read in exactly one place — {@link DetectContext.declaresFlutterSdk}, called from
 * `detect/presets.ts`'s app-versus-package arm. File existence alone cannot tell an application
 * whose entry point moved out of `lib/main.dart` from a plain package, and the cost of choosing
 * wrong is asymmetric in both directions (stated on `FLUTTER_APP_MARKERS`). That read is one
 * line-shaped probe deciding **which tool an already-selected preset gets**, never which preset is
 * selected, so the signal table's no-content-heuristics property — `docs/cli.md` §4 — is untouched.
 */
export const PUBSPEC_MANIFEST = 'pubspec.yaml';

/** The line a `pubspec.yaml` carries for a dependency on the Flutter SDK — `flutter:` then `sdk: flutter`. */
const FLUTTER_SDK_DEPENDENCY = /^\s+sdk:\s*flutter\s*$/m;

/**
 * The Android application manifest, relative to a module directory. Existence only.
 *
 * It is what tells an Android module from a plain JVM one: both carry `build.gradle` /
 * `settings.gradle`, so neither of those names can decide the question, and reading a Gradle file
 * for an `com.android.application` plugin line would be the content heuristic this module refuses
 * to make.
 */
export const ANDROID_MANIFEST = 'src/main/AndroidManifest.xml';

/**
 * The module directories an Android application manifest is looked for in, in order: the
 * conventional `app` module of a `gradlew`-rooted project, then the manifest root itself for a
 * single-module repository whose `src/main/` sits at the top.
 *
 * Searched under {@link DetectContext.manifestRoots} — the same list the manifest-shaped rows use —
 * and never under {@link CANDIDATE_ROOT_DIR_NAMES}, so a Flutter repository, whose manifest is at
 * `android/app/src/main/`, is not reached from the repository root.
 *
 * Exported for one consumer outside this module: the undetected-command warning in
 * `detect/presets.ts` enumerates the manifests `init` reads, and the Android entry has to carry the
 * same module directories this list searches.
 */
export const ANDROID_MODULE_DIRS = ['app', '.'] as const;

/** The Maven project manifest. Existence only — no POM element is parsed. */
export const MAVEN_MANIFEST = 'pom.xml';

/**
 * The Gradle project manifests, in match order. Existence only — no Gradle script is read.
 *
 * A settings file first because it marks the **root** of a Gradle build, which is the directory
 * `-p` has to name, and a `build.gradle` alone can be a subproject's. Kotlin DSL ahead of Groovy at
 * each pair only so a project carrying both reports one of them deterministically.
 *
 * These names do not tell an Android project from a plain JVM one — both carry them — which is why
 * {@link ANDROID_MANIFEST} decides that, on the row ordered above the JVM rows.
 */
export const GRADLE_MANIFESTS = ['settings.gradle.kts', 'settings.gradle', 'build.gradle.kts', 'build.gradle'] as const;

/**
 * The .NET solution suffixes, in match order — matched by **suffix** rather than by name, because a
 * solution is named after the product and there is no fixed file name to look for.
 * {@link findFileWithSuffix} is the locator shape that exists for exactly this.
 *
 * `.slnx` is the XML solution format the .NET 9 SDK ships and `dotnet sln migrate` converts to; every
 * `dotnet` verb this module emits accepts it in the same position as a `.sln`. `.sln` is tried first
 * only so a repository mid-migration, carrying both, reports one of them deterministically.
 */
export const DOTNET_SOLUTION_SUFFIXES = ['.sln', '.slnx'] as const;

/**
 * The .NET project-file suffixes, in match order — C#, F#, Visual Basic.
 *
 * They are the fallback for a repository that ships no solution, which is ordinary for a single
 * service. Order between them decides nothing an adopter would notice: a project carries one of
 * the three, and a repository mixing languages is a solution repository, which the suffix above
 * answers first.
 */
export const DOTNET_PROJECT_SUFFIXES = ['.csproj', '.fsproj', '.vbproj'] as const;

/**
 * The Swift Package Manager manifest. Existence only — the `Package.swift` file is a Swift program,
 * and running it to learn its targets is neither a file-existence test nor something a detection
 * pass may do.
 */
export const SWIFT_PACKAGE_MANIFEST = 'Package.swift';

/**
 * The Cargo package manifest. Existence only — neither its `[package]` table nor its `[workspace]`
 * one is parsed, which is what keeps a workspace root and a plain crate on the same row.
 */
export const CARGO_MANIFEST = 'Cargo.toml';

/**
 * The Bundler manifest. Existence only — a `Gemfile` is a Ruby program, and running it to learn
 * which gems or groups it declares is neither a file-existence test nor something a detection pass
 * may do. One name covers every Ruby repository that declares dependencies at all: a Rails
 * application, a gem with a development `Gemfile` beside its gemspec, and a plain script directory
 * alike.
 *
 * **The converse is what the rows have to be written against, and it is false**: a repository with a
 * `Gemfile` is not thereby a Ruby repository. Ruby's packaging is the standard way to pin *mobile
 * and static-site tooling*, so a `Gemfile` sits at the root of the React Native project template
 * (CocoaPods, fastlane), of native iOS repositories (fastlane) and of a Jekyll site built beside an
 * npm front end. This is `PACKAGE_MANIFEST`'s "routinely appears in a repository of another stack"
 * property, on a second manifest — so the row and the command family both carry the
 * {@link declaresNodeScript} guard.
 */
export const BUNDLER_MANIFEST = 'Gemfile';

/**
 * The Composer manifest. Existence only — and unusually for this table it *could* be inspected, since
 * it is JSON and {@link DetectContext.rootPackageJson}'s reader shape is the precedent for a
 * top-level key test. No row asks it anything: `composer.json` is PHP's only dependency manifest, so
 * its presence is already the whole answer, and a key test that decided nothing further would only
 * invite a reader to think one was read.
 */
export const COMPOSER_MANIFEST = 'composer.json';

/**
 * The CMake project manifest. Existence only — a `CMakeLists.txt` is a script in CMake's own
 * language, and running it, or scanning it for the targets and test registrations it declares, is
 * neither a file-existence test nor something a detection pass may do. Existence is enough: the
 * command family this selects configures and builds whatever the file declares, without needing to
 * know what that is.
 */
export const CMAKE_MANIFEST = 'CMakeLists.txt';

/**
 * The Xcode workspace suffix, named on its own because {@link XCODE_PROJECT_SUFFIXES} order and the
 * `xcodebuild` flag that goes with it are the same fact spelled twice otherwise.
 */
export const XCODE_WORKSPACE_SUFFIX = '.xcworkspace';

/**
 * The Xcode container suffixes, in match order — the workspace first, because it is what
 * `xcodebuild` prefers when a repository holds both: a project built on its own misses the schemes
 * and package dependencies its workspace declares.
 *
 * Matched by **suffix** for {@link DOTNET_SOLUTION_SUFFIXES}' reason — both are named after the
 * product, so there is no fixed file name to look for — and both are **directories** rather than
 * files, which is the half of {@link findFileWithSuffix} that searches
 * {@link DetectContext.childDirNames}.
 */
export const XCODE_PROJECT_SUFFIXES = [XCODE_WORKSPACE_SUFFIX, '.xcodeproj'] as const;

/**
 * Where an Xcode container keeps the schemes it shares with every checkout, relative to that
 * container. A scheme outside it is a user-local file that no other machine has, so it cannot be
 * named in a command line a repository ships.
 *
 * Exported for one consumer outside this module: the note `detect/presets.ts` raises when no single
 * shared scheme decided a command, which has to name the directory that was looked in.
 */
export const XCODE_SHARED_SCHEMES_DIR = 'xcshareddata/xcschemes';

/** The scheme-file extension, stripped so what is left is the name `-scheme` takes. */
const XCODE_SCHEME_SUFFIX = '.xcscheme';

/**
 * Manifests `init` does **not** read, but that an adopter outside the supported stacks will have.
 *
 * **This list exists to make a sentence true, never to select a preset or derive a command.** Its one
 * consumer is the undetected-command warning, which names what was looked for and what is actually
 * there instead of claiming the repository holds no manifest — so adding a name here changes what that
 * warning says and nothing else. The closure rule that keeps it honest: a name added to any list a
 * locator above reads — {@link PYTHON_MANIFESTS}, {@link GO_MANIFEST}, {@link MAVEN_MANIFEST},
 * {@link GRADLE_MANIFESTS} and every later stack's — must be removed from here, or the warning would
 * report a manifest `init` had just started reading as one it does not. `pom.xml`, `build.gradle`,
 * `build.gradle.kts`, `Cargo.toml`, `Gemfile` and `composer.json` left this list for exactly that
 * reason when the JVM, Cargo, Bundler and Composer rows started reading them.
 *
 * `Makefile` stays, and {@link CMAKE_MANIFEST} was never here to leave: a `Makefile` names no
 * command a locator could derive, because which targets it declares — `check`, `test`, `all`, or
 * none of them — is knowable only by reading the file, which this module's header forbids. A
 * `CMakeLists.txt` needs no such reading, since `cmake` and `ctest` take the same arguments
 * whatever it declares, so it is a manifest `init` reads rather than one it only names.
 */
export const UNREAD_MANIFESTS = ['Makefile'] as const;

/** The marker file that makes a directory an importable Python package. Existence only. */
const PYTHON_PACKAGE_MARKER = '__init__.py';

/**
 * The conventional `src` layout directory, used as the documented package-directory fallback.
 *
 * Kept separate from {@link CANDIDATE_ROOT_DIR_NAMES} on purpose, and both readers are why:
 * {@link findPythonPackageDir}'s fallback is a rule about the Python `src`-layout convention and
 * {@link findDotnetProject}'s last step is a rule about the .NET solution layout, neither is a
 * statement about where a directory signal looks, and neither must start following that list when
 * a name is added to it.
 */
const SRC_DIR = 'src';

/**
 * The directory names a directory-shaped signal searches under the application directory, in order —
 * {@link DetectContext.candidateRoots} is the application directory itself followed by these.
 *
 * `internal` and `pkg` are here because they are conventional source roots, not because a repository
 * might happen to use them: `internal/` is Go's compiler-enforced privacy boundary and the most
 * conventional place a Go repository puts its packages, `pkg/` is its long-standing companion, and
 * both are widely borrowed into Node and Python trees that never touched Go. Without them a textbook
 * `internal/{data,domain,presentation}` tree got the same catch-all profile an empty repository does.
 *
 * **Exactly two {@link SIGNALS} rows resolve over these roots**, and both widen together when a name
 * is added: `layered-clean-arch:layer-directories` through {@link findLayeredRoot}, and
 * `api-service:route-directory` through {@link findApiDir}. So `internal/api/` and `pkg/routes/` now
 * match the api row too. That is safe under the table's first-match-wins order — the layered row is
 * evaluated first, so a tree carrying two or more of {@link LAYERED_DIR_NAMES} under `internal/`
 * still answers `layered-clean-arch` — but a tree whose only match is `internal/api/` moves from
 * `flat` to `api-service`.
 *
 * **Not touched, deliberately:** `api-service:go-module` ({@link findGoManifest}) and
 * `python-package:packaging-manifest` ({@link findPythonManifest}, and {@link findPythonPackageDir}
 * behind it) loop {@link DetectContext.manifestRoots} — a different list — and are unaffected.
 *
 * Both directory-shaped descriptions below are generated from this constant so the sentence and the
 * search cannot drift. One consumer states the same list in prose and is **not** generated from it:
 * `docs/cli.md` §4, rows 3 and 5.
 */
export const CANDIDATE_ROOT_DIR_NAMES = ['src', 'app', 'lib', 'internal', 'pkg'] as const;

/** {@link CANDIDATE_ROOT_DIR_NAMES} as directory paths, for the two descriptions that name them. */
const CANDIDATE_ROOT_PATHS = CANDIDATE_ROOT_DIR_NAMES.map((name) => `${name}/`);

/**
 * The trailing clause of a directory-shaped signal's description, generated from the roots it
 * searches. `slice` on both halves rather than an indexed last element: the list is a constant, and
 * a total expression cannot render `undefined` into a sentence if it ever stops being one.
 */
const CANDIDATE_ROOTS_CLAUSE = `under the application directory or its ${CANDIDATE_ROOT_PATHS.slice(0, -1).join(', ')} or ${CANDIDATE_ROOT_PATHS.slice(-1).join('')}`;

/**
 * Directory names never treated as the Python package directory. They are ordinary siblings of a
 * package, and one of them carrying an `__init__.py` (a test package, most often) would otherwise
 * win on alphabetical order.
 */
const NON_PACKAGE_DIR_NAMES: ReadonlySet<string> = new Set([
  'build',
  'dist',
  'docs',
  'examples',
  'node_modules',
  'test',
  'tests',
  'venv',
]);

/** A repo-relative path in the harness's own form: forward slashes, no trailing slash, `.` for the root. */
function toRepoRelative(value: string): string {
  const normalized = posix.normalize(value.split('\\').join('/')).replace(/\/+$/, '');
  return normalized === '' || normalized === '.' ? '.' : normalized;
}

/** Join repo-relative segments, collapsing the `.` root so `.` + `src` is `src`, not `./src`. */
function joinRepoRelative(base: string, ...segments: string[]): string {
  return toRepoRelative(base === '.' ? posix.join(...segments) : posix.join(base, ...segments));
}

/**
 * One repository, probed.
 *
 * It exists so the signal rows, the locators below and `detect/presets.ts` share **one** reading
 * of the filesystem and **one** warning list: `package.json` is parsed at most once per run, and a
 * warning raised by a locator two rows apart from where it is reported still reaches the caller.
 *
 * Every path a caller hands in or gets back is **repo-relative** (`docs/config.md` §5); the
 * absolute form exists only inside this class, where the filesystem needs it.
 */
export class DetectContext {
  /** Absolute path of the repository root. */
  readonly repoRoot: string;
  /** Repo-relative application directory — `.` when the repository is the application. */
  readonly appDir: string;
  /**
   * The roots a directory-shaped signal looks under, in order: the application directory itself,
   * then each of {@link CANDIDATE_ROOT_DIR_NAMES} beneath it.
   */
  readonly candidateRoots: readonly string[];
  /** The roots a manifest-shaped signal looks in: the application directory and the repository root. */
  readonly manifestRoots: readonly string[];

  readonly #seen = new Set<string>();
  #pending: string[] = [];
  /**
   * The note channel's own dedup set and pending list — **independent** of the warning ones.
   *
   * A message may legitimately be raised once as a note and once as a warning by different phases;
   * one shared `#seen` would silently drop the second.
   */
  readonly #seenNotes = new Set<string>();
  #pendingNotes: string[] = [];
  #packageJsonRead = false;
  #packageJson: JsonObject | undefined;
  #appPackageJsonRead = false;
  #appPackageJson: JsonObject | undefined;

  /**
   * @param repoRoot absolute repository root, from `core/git.ts`.
   * @param appDir `harness.config.json`'s `appDir` (or `--app-dir`): repo-relative, or absolute.
   *
   * An `appDir` outside the repository is refused rather than clamped: it is a typo or a
   * mis-scoped invocation, and detecting the wrong tree would wire the repository against a stack
   * it does not contain.
   */
  constructor(repoRoot: string, appDir: string = '.') {
    this.repoRoot = resolve(repoRoot);
    const absoluteAppDir = resolve(this.repoRoot, appDir);
    if (!insideRepo(this.repoRoot, absoluteAppDir)) {
      throw new HarnessError(`appDir ${JSON.stringify(appDir)} is outside the repository at ${this.repoRoot}`);
    }
    this.appDir = toRepoRelative(relative(this.repoRoot, absoluteAppDir));
    this.candidateRoots = [
      this.appDir,
      ...CANDIDATE_ROOT_DIR_NAMES.map((name) => joinRepoRelative(this.appDir, name)),
    ];
    this.manifestRoots = this.appDir === '.' ? ['.'] : [this.appDir, '.'];
  }

  /** The absolute form of a repo-relative path, for the filesystem calls below and nothing else. */
  absolute(repoRelativePath: string): string {
    return resolve(this.repoRoot, repoRelativePath);
  }

  /**
   * Record something the adopter should know. Deduplicated by message, so a locator called from
   * both a signal row and a preset builder cannot report the same thing twice.
   */
  warn(message: string): void {
    if (this.#seen.has(message)) return;
    this.#seen.add(message);
    this.#pending.push(message);
  }

  /**
   * Take the warnings raised since the last drain. Each phase — detection, then preset building —
   * reports the warnings it caused, and no phase re-reports an earlier one.
   */
  drainWarnings(): string[] {
    const drained = this.#pending;
    this.#pending = [];
    return drained;
  }

  /**
   * Record something the adopter should know that is **not** a fault — what a correct run should say
   * about itself. Deduplicated by message for {@link warn}'s reason, on its own set.
   *
   * A generated value that is right for most adopters but which some will want to change belongs
   * here: a warning that fires on every correct run is how a warning list stops being read
   * (`generators/harnessConfig.ts`, `BuildConfigOptions.noteIfWritten`).
   */
  note(message: string): void {
    if (this.#seenNotes.has(message)) return;
    this.#seenNotes.add(message);
    this.#pendingNotes.push(message);
  }

  /**
   * Take the notes raised since the last drain. Same phase discipline as {@link drainWarnings}:
   * each phase reports the notes it caused, and no phase re-reports an earlier one.
   */
  drainNotes(): string[] {
    const drained = this.#pendingNotes;
    this.#pendingNotes = [];
    return drained;
  }

  /** True when a repo-relative path is an existing directory. */
  dirExists(repoRelativePath: string): boolean {
    return statSync(this.absolute(repoRelativePath), { throwIfNoEntry: false })?.isDirectory() ?? false;
  }

  /** True when a repo-relative path is an existing regular file. */
  fileExists(repoRelativePath: string): boolean {
    return statSync(this.absolute(repoRelativePath), { throwIfNoEntry: false })?.isFile() ?? false;
  }

  /**
   * True when a `pubspec.yaml` declares a dependency on the Flutter SDK.
   *
   * The probe matches **one line shape** — `sdk: flutter`, under either `dependencies:` or
   * `dev_dependencies:` — and does not parse the YAML. A `flutter_test` dev-dependency therefore
   * answers true, which is the correct positive: a package importing `package:flutter_test` hits
   * the same unresolved-import failure under `dart analyze` that an application does. An unreadable
   * or absent manifest answers `false`; absence is an ordinary answer here as it is in
   * {@link dirExists} and {@link fileExists}, and the caller keeps its marker arm.
   *
   * **No other detection row may call this.** The family gate and preset selection stay pure file
   * existence; see {@link PUBSPEC_MANIFEST}.
   */
  declaresFlutterSdk(repoRelativePath: string): boolean {
    try {
      return FLUTTER_SDK_DEPENDENCY.test(readFileSync(this.absolute(repoRelativePath), 'utf8'));
    } catch {
      return false;
    }
  }

  /**
   * The immediate sub-directory names of a repo-relative directory, sorted, dot-directories
   * excluded — so a caller that scans children is deterministic regardless of directory order on
   * disk. An unreadable or absent directory yields an empty list; absence is an ordinary answer to
   * every question this module asks.
   */
  childDirNames(repoRelativePath: string): string[] {
    try {
      return readdirSync(this.absolute(repoRelativePath), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => entry.name)
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * The immediate file names of a repo-relative directory — the file twin of
   * {@link childDirNames}, same contract: sorted, dot-files excluded, an unreadable or absent
   * directory yielding an empty list.
   *
   * It exists so a manifest named by **suffix** rather than by name — `*.sln`, `*.xcodeproj` —
   * can be found without a glob, and so that a root holding two of them resolves to the same one
   * on every run regardless of directory order on disk. {@link findFileWithSuffix} is its caller.
   */
  childFileNames(repoRelativePath: string): string[] {
    try {
      return readdirSync(this.absolute(repoRelativePath), { withFileTypes: true })
        .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
        .map((entry) => entry.name)
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * The repository root's `package.json`, parsed once and cached.
   *
   * **Only the root manifest, deliberately.** The raw command lines derived from it — `npm run
   * build`, `npm test` — are executed from the repository root, so a script found in a nested
   * manifest would produce a line that does not run. A nested application's commands are left
   * unresolved (placeholder plus a warning) rather than guessed at.
   *
   * A malformed manifest is a **warning and treated as absent**, not a refusal: detection never
   * blocks adoption, and the unresolved commands it leads to are reported by their own warnings.
   */
  rootPackageJson(): JsonObject | undefined {
    if (this.#packageJsonRead) return this.#packageJson;
    this.#packageJsonRead = true;
    this.#packageJson = this.#readPackageManifest(PACKAGE_MANIFEST);
    return this.#packageJson;
  }

  /**
   * The **application directory's** own `package.json`, parsed once and cached, or `undefined` when
   * the application is the repository — where {@link rootPackageJson} already owns that file.
   *
   * **It does not widen command derivation**, and nothing here reads it for one: `rootPackageJson`'s
   * only-the-root rule stands for every script-derived command, for the reason stated there. Its one
   * consumer is {@link appScriptNames}, which exists solely so the undetected-command warning can name
   * a script it can see rather than deny that any manifest declares one.
   *
   * Same malformed-manifest policy as the root's, through the same reader: a warning, and the manifest
   * treated as absent.
   */
  nestedPackageJson(): JsonObject | undefined {
    if (this.appDir === '.') return undefined;
    if (this.#appPackageJsonRead) return this.#appPackageJson;
    this.#appPackageJsonRead = true;
    this.#appPackageJson = this.#readPackageManifest(joinRepoRelative(this.appDir, PACKAGE_MANIFEST));
    return this.#appPackageJson;
  }

  /**
   * Read one npm manifest, or answer `undefined` and say why.
   *
   * The two readers above share it so the malformed-manifest policy {@link rootPackageJson} states has
   * one implementation, and the root and the nested manifest cannot come to be reported differently.
   */
  #readPackageManifest(repoRelativePath: string): JsonObject | undefined {
    try {
      const parsed = readJsonFile(this.absolute(repoRelativePath));
      if (isJsonObject(parsed)) return parsed;
      if (parsed !== undefined) {
        this.warn(`${repoRelativePath} is not a JSON object, so no npm command was detected from it`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.warn(`${repoRelativePath} could not be read, so no npm command was detected from it: ${detail}`);
    }
    return undefined;
  }

  /** True when the root `package.json` declares a top-level `workspaces` key. */
  hasWorkspacesKey(): boolean {
    const manifest = this.rootPackageJson();
    return manifest !== undefined && manifest['workspaces'] !== undefined;
  }

  /**
   * The **names** of the root manifest's `scripts` entries that hold a non-empty string.
   *
   * A script's body is never inspected — knowing that `build` exists is what a raw `npm run build`
   * needs, and reading what it does would be the content heuristic this module refuses to make.
   */
  scriptNames(): ReadonlySet<string> {
    return scriptNamesOf(this.rootPackageJson());
  }
}

/** The `scripts` names of one parsed manifest that hold a non-empty string. */
function scriptNamesOf(manifest: JsonObject | undefined): ReadonlySet<string> {
  const scripts = manifest?.['scripts'];
  if (!isJsonObject(scripts)) return new Set<string>();
  return new Set(Object.keys(scripts).filter((name) => typeof scripts[name] === 'string' && scripts[name] !== ''));
}

/**
 * The `scripts` names of the application directory's own manifest, or the empty set when the
 * application is the repository — {@link DetectContext.scriptNames} is that repository's reader.
 *
 * **This widens nothing.** It derives no command and selects no preset; it is what lets the
 * undetected-command warning say *this manifest declares the script, and here is the root-anchored
 * line that runs it* instead of denying that any manifest holds the command. Only the npm family needs
 * it: {@link findPythonManifest} and {@link findGoManifest} already search
 * {@link DetectContext.manifestRoots}, so a nested Python or Go manifest **is** read and its commands
 * **are** emitted. The npm family's deliberate root-only rule is the one that produces a placeholder on
 * a repository whose nested manifest declares the script.
 */
export function appScriptNames(context: DetectContext): ReadonlySet<string> {
  return scriptNamesOf(context.nestedPackageJson());
}

/** One layered source directory that was found: which of the three it is, and where. */
export interface LayeredDir {
  readonly name: LayeredDirName;
  /** Repo-relative path of the directory. */
  readonly path: string;
}

/** The layered source root a repository was found to have. */
export interface LayeredMatch {
  /** Repo-relative candidate root the directories sit under. */
  readonly root: string;
  /** The subset of {@link LAYERED_DIR_NAMES} that exists there, in that order. */
  readonly dirs: readonly LayeredDir[];
}

/**
 * The candidate root holding the most of `data/`, `domain/`, `presentation/`, or `undefined` when
 * none holds any.
 *
 * "Most, ties broken by candidate order" rather than "first with at least one" is what lets the
 * signal row and the layer preset call the same locator and always agree: a tree whose `appDir`
 * has a stray `data/` while `appDir/src` has all three answers `src` to both questions, instead of
 * matching on one root and building layers from another.
 */
export function findLayeredRoot(context: DetectContext): LayeredMatch | undefined {
  let best: LayeredMatch | undefined;
  for (const root of context.candidateRoots) {
    const dirs: LayeredDir[] = [];
    for (const name of LAYERED_DIR_NAMES) {
      const path = joinRepoRelative(root, name);
      if (context.dirExists(path)) dirs.push({ name, path });
    }
    if (dirs.length > (best?.dirs.length ?? 0)) best = { root, dirs };
  }
  return best;
}

/** The first {@link API_DIR_NAMES} directory under a candidate root, repo-relative. */
export function findApiDir(context: DetectContext): string | undefined {
  for (const root of context.candidateRoots) {
    for (const name of API_DIR_NAMES) {
      const path = joinRepoRelative(root, name);
      if (context.dirExists(path)) return path;
    }
  }
  return undefined;
}

/**
 * The repo-relative directory a repo-relative manifest path sits in — `.` for a manifest at the
 * repository root.
 *
 * **Never read {@link DetectContext.appDir} in its place.** That is where the tool was *pointed*;
 * this is where the manifest was actually *found*, and the two differ whenever
 * {@link DetectContext.manifestRoots} falls through to the root — a repository whose application
 * directory carries no manifest and whose root does.
 *
 * Normalised through the same private normaliser every other path in this module goes through, so a
 * `.` root, a trailing separator and a backslash separator all come back in one form.
 */
export function manifestDirectory(manifestPath: string): string {
  return toRepoRelative(posix.dirname(toRepoRelative(manifestPath)));
}

/**
 * The first of `names` that exists in a manifest root, repo-relative — manifest roots outer, names
 * inner, so a name found in the application directory wins over an earlier name at the repository
 * root.
 *
 * **The one implementation of the manifest-locator shape.** Every by-name locator below is a call
 * to this with its own list, so "which root, in what order, and what a miss returns" is decided
 * once instead of re-spelled per stack. A locator that needs a different rule — a suffix match
 * ({@link findFileWithSuffix}), a companion file read beside the hit ({@link findNodeInstallSite})
 * — states it rather than passing through here.
 */
function findFirstManifest(context: DetectContext, names: readonly string[]): string | undefined {
  for (const root of context.manifestRoots) {
    for (const name of names) {
      const path = joinRepoRelative(root, name);
      if (context.fileExists(path)) return path;
    }
  }
  return undefined;
}

/**
 * The first entry in a manifest root whose name ends in `suffix`, repo-relative, or `undefined`.
 *
 * **It searches files and directories both**, because the suffix-shaped manifests are of both
 * shapes: `MyApp.sln` is a file and `MyApp.xcodeproj` is a directory, and a locator that saw only
 * one of them would miss half the repositories it exists for. Files are listed first, so a root
 * carrying both shapes answers with the file.
 *
 * "First" means first in the **sorted** listing of {@link DetectContext.childFileNames} /
 * {@link DetectContext.childDirNames}, not first on disk — so a root holding two solutions
 * resolves to the same one on every run, which is what {@link SIGNALS}' reproducibility rule
 * requires of anything that scans a directory.
 */
function findFileWithSuffix(context: DetectContext, suffix: string): string | undefined {
  for (const root of context.manifestRoots) {
    for (const name of [...context.childFileNames(root), ...context.childDirNames(root)]) {
      if (name.endsWith(suffix)) return joinRepoRelative(root, name);
    }
  }
  return undefined;
}

/** The first {@link PYTHON_MANIFESTS} file in a manifest root, repo-relative. */
export function findPythonManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, PYTHON_MANIFESTS);
}

/** The npm manifest a dependency install belongs to, and the two facts that decide its command line. */
export interface NodeInstallSite {
  /** Repo-relative path of the {@link PACKAGE_MANIFEST} that was found. */
  readonly manifest: string;
  /** Repo-relative directory holding it — `.` when that is the repository root. */
  readonly dir: string;
  /** Whether a {@link PACKAGE_LOCKFILE} sits **beside that manifest**, which is what chooses `ci`. */
  readonly hasLockfile: boolean;
}

/**
 * The first {@link PACKAGE_MANIFEST} in a manifest root, with the lockfile question answered beside
 * it rather than at the repository root.
 *
 * **This does not widen {@link DetectContext.rootPackageJson}**, whose only-the-root rule stands for
 * every script-derived command: `npm run build` and `npm test` resolve a script *name* against the
 * manifest the runner reads, and that runner is invoked from the repository root, so a name found in
 * a nested manifest would produce a line that does not run. Its one consumer is the dependency
 * install — at both of the sites that derive it, with and without a root manifest — which is a whole
 * command line rather than a script name, and can therefore be pointed at the directory the manifest
 * is in.
 *
 * It answers the lockfile itself because {@link PACKAGE_MANIFEST} and the path join are
 * module-private: a caller holding only `dir` cannot ask the question about it.
 */
export function findNodeInstallSite(context: DetectContext): NodeInstallSite | undefined {
  for (const root of context.manifestRoots) {
    const path = joinRepoRelative(root, PACKAGE_MANIFEST);
    if (context.fileExists(path)) {
      return { manifest: path, dir: root, hasLockfile: context.fileExists(joinRepoRelative(root, PACKAGE_LOCKFILE)) };
    }
  }
  return undefined;
}

/**
 * True when the repository root declares a workspace by any of the means detection recognises: the
 * npm `workspaces` key, or one of {@link WORKSPACE_MANIFESTS}.
 *
 * Exported so the dependency-install carve-out and the two `monorepo` signal rows answer one
 * question: a root that installs every member at once must not be given a member-anchored install.
 * The rows keep their own tests because each has to return the evidence string it matched on; this
 * is the same condition asked without that answer.
 */
export function isWorkspaceRoot(context: DetectContext): boolean {
  return context.hasWorkspacesKey() || WORKSPACE_MANIFESTS.some((name) => context.fileExists(name));
}

/** The {@link GO_MANIFEST} file in a manifest root, repo-relative. */
export function findGoManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, [GO_MANIFEST]);
}

/** The {@link PUBSPEC_MANIFEST} file in a manifest root, repo-relative. */
export function findFlutterManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, [PUBSPEC_MANIFEST]);
}

/** The Android module a repository was found to have, and the Gradle project it sits in. */
export interface AndroidModule {
  /** Repo-relative path of the module directory holding {@link ANDROID_MANIFEST}. */
  readonly module: string;
  /** Repo-relative manifest root the module was found under — the Gradle project directory. */
  readonly root: string;
}

/**
 * The Android module of a repository: the first {@link ANDROID_MODULE_DIRS} entry under a manifest
 * root that carries an {@link ANDROID_MANIFEST}, or `undefined`.
 *
 * Manifest roots outer, module names inner, so an `app/` module in the application directory wins
 * over that root's own `src/main/`.
 *
 * **The root is returned beside the module, and cannot be recovered from it.** The layer arm needs
 * the module — the sources are under it — while the command family needs the Gradle project
 * directory, which is where `gradlew` and `settings.gradle` sit and what `-p` has to name; a
 * `gradle -p <module>` at a subproject is a project without the settings file that declares it.
 * The two differ by the `app` segment, and stripping that segment is not a total operation: an
 * application directory literally named `app` whose own `src/main/` holds the manifest answers
 * module `app`, root `app`, which is indistinguishable from the `app`-module case by path alone.
 */
export function findAndroidModule(context: DetectContext): AndroidModule | undefined {
  for (const root of context.manifestRoots) {
    for (const name of ANDROID_MODULE_DIRS) {
      const module = joinRepoRelative(root, name);
      if (context.fileExists(joinRepoRelative(module, ANDROID_MANIFEST))) return { module, root };
    }
  }
  return undefined;
}

/** The {@link MAVEN_MANIFEST} file in a manifest root, repo-relative. */
export function findMavenManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, [MAVEN_MANIFEST]);
}

/** The first {@link GRADLE_MANIFESTS} file in a manifest root, repo-relative. */
export function findGradleManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, GRADLE_MANIFESTS);
}

/**
 * The .NET solution or project a `dotnet` command line names, repo-relative, in three steps:
 * a `*.sln`/`*.slnx` in a manifest root, else a `*.csproj`/`*.fsproj`/`*.vbproj` in a manifest
 * root, else one in a **single** level of directories under that root's `src/`.
 *
 * A solution first because it is the whole build: `dotnet build MyApp.sln` compiles every project
 * in it, while a project file names one, and a repository that ships a solution meant it.
 *
 * **The depth bound is exactly one level under `src/`, and it is deliberate.** A project file may
 * legitimately sit anywhere in a solution, so following it further would be a recursive scan of the
 * tree — a search rather than the existence test this table is defined as. One level covers the
 * conventional `src/<Project>/<Project>.csproj` layout and stops. The scan is over
 * {@link DetectContext.childDirNames}, which is sorted, so a `src/` holding several projects
 * resolves to the same one on every run.
 */
export function findDotnetProject(context: DetectContext): string | undefined {
  for (const suffix of DOTNET_SOLUTION_SUFFIXES) {
    const solution = findFileWithSuffix(context, suffix);
    if (solution !== undefined) return solution;
  }

  for (const root of context.manifestRoots) {
    const found = findDotnetProjectFileIn(context, root);
    if (found !== undefined) return found;
  }

  for (const root of context.manifestRoots) {
    const srcDir = joinRepoRelative(root, SRC_DIR);
    for (const name of context.childDirNames(srcDir)) {
      const found = findDotnetProjectFileIn(context, joinRepoRelative(srcDir, name));
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** The first {@link DOTNET_PROJECT_SUFFIXES} file directly in one directory, repo-relative. */
function findDotnetProjectFileIn(context: DetectContext, dir: string): string | undefined {
  for (const name of context.childFileNames(dir)) {
    if (DOTNET_PROJECT_SUFFIXES.some((suffix) => name.endsWith(suffix))) return joinRepoRelative(dir, name);
  }
  return undefined;
}

/** The {@link SWIFT_PACKAGE_MANIFEST} file in a manifest root, repo-relative. */
export function findSwiftPackageManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, [SWIFT_PACKAGE_MANIFEST]);
}

/** The {@link CARGO_MANIFEST} file in a manifest root, repo-relative. */
export function findCargoManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, [CARGO_MANIFEST]);
}

/** The {@link BUNDLER_MANIFEST} file in a manifest root, repo-relative. */
export function findBundlerManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, [BUNDLER_MANIFEST]);
}

/** The {@link COMPOSER_MANIFEST} file in a manifest root, repo-relative. */
export function findComposerManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, [COMPOSER_MANIFEST]);
}

/** The {@link CMAKE_MANIFEST} file in a manifest root, repo-relative. */
export function findCmakeManifest(context: DetectContext): string | undefined {
  return findFirstManifest(context, [CMAKE_MANIFEST]);
}

/**
 * The root-manifest script names that make a repository's own stack Node, for {@link
 * declaresNodeScript}.
 *
 * **The same names `NODE_SCRIPT_CANDIDATES` in `detect/presets.ts` holds**, flattened — the guard
 * fires exactly when the npm command family would answer, which is the invariant that keeps a row
 * declining a repository only where another derivation is waiting for it. The two lists live in two
 * modules because `detect/presets.ts` imports this one, so a closure case asserts them equal
 * (`test/stack-presets.test.mjs`) rather than one importing the other into a cycle.
 */
export const NODE_ROW_GUARD_SCRIPTS: readonly string[] = [
  'typecheck',
  'check-types',
  'tsc',
  'lint',
  'test',
  'build',
  'dev',
  'start',
  'serve',
];

/**
 * True when the repository root's npm manifest declares a script one of the four command keys
 * accepts — file existence plus a top-level `scripts` key inspection, so it stays inside this
 * module's rule.
 *
 * It exists for the manifests that routinely appear in a repository whose stack is **not** the one
 * they name — `CMakeLists.txt` for a `node-gyp`/`cmake-js` addon, `Gemfile` for the CocoaPods and
 * fastlane pin the React Native template ships at the repository root — where the matching row's
 * "this manifest names the repository's own stack" premise does not hold. Node is the one stack with
 * no row of its own, so first-match-wins order cannot protect it the way it protects Python and
 * Rust: there is no npm row for such a repository to be caught by higher up.
 *
 * Exported because `detect/presets.ts` gates the Bundler **command family** on the same predicate:
 * a row guard alone does not move the commands, since that family is tried above `npm` whether or
 * not its row matched (`bundlerCommands`).
 */
export function declaresNodeScript(context: DetectContext): boolean {
  const scripts = context.scriptNames();
  return NODE_ROW_GUARD_SCRIPTS.some((name) => scripts.has(name));
}

/**
 * The Xcode container a command line names, repo-relative: the first {@link XCODE_PROJECT_SUFFIXES}
 * entry in a manifest root, suffixes outer.
 *
 * **Suffixes outer, roots inner** — the reverse of {@link findFirstManifest}'s nesting, and the
 * difference is the point: a workspace anywhere the search reaches beats a project anywhere it
 * reaches, because building the project of a workspace on its own is the wrong build rather than a
 * further-away one. Within one suffix, {@link findFileWithSuffix}'s sorted order keeps a root
 * holding two containers answering the same one on every run.
 */
export function findXcodeProject(context: DetectContext): string | undefined {
  for (const suffix of XCODE_PROJECT_SUFFIXES) {
    const found = findFileWithSuffix(context, suffix);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * The **shared** scheme names of an Xcode container, sorted, with {@link XCODE_SCHEME_SUFFIX}
 * stripped — the empty list when it shares none.
 *
 * Shared schemes only, and that is the whole selectivity: `xcodebuild -scheme` takes a name, a
 * user-local scheme under `xcuserdata/` exists on one developer's machine and on no CI runner, and
 * naming one would generate a command line that fails everywhere but where `init` ran. Sorted
 * because {@link DetectContext.childFileNames} is, so the one-scheme test below and the name it
 * yields are the same on every run.
 */
export function findSharedSchemes(context: DetectContext, project: string): string[] {
  return context
    .childFileNames(joinRepoRelative(project, XCODE_SHARED_SCHEMES_DIR))
    .filter((name) => name.endsWith(XCODE_SCHEME_SUFFIX))
    .map((name) => name.slice(0, -XCODE_SCHEME_SUFFIX.length));
}

/**
 * The first {@link UNREAD_MANIFESTS} file in a manifest root, repo-relative.
 *
 * Same shape as the locators above and a different purpose: nothing is derived from what it finds. It
 * answers *what is there instead*, for the warning that would otherwise tell an adopter their
 * repository holds no manifest while one sits at its root.
 */
export function findUnreadManifest(context: DetectContext): string | undefined {
  for (const root of context.manifestRoots) {
    for (const name of UNREAD_MANIFESTS) {
      const path = joinRepoRelative(root, name);
      if (context.fileExists(path)) return path;
    }
  }
  return undefined;
}

/**
 * The locators for the manifests `init` reads, in the order {@link PACKAGE_MANIFEST} and the
 * constants beside it are enumerated by `READ_MANIFESTS` (`detect/presets.ts`).
 *
 * **A list of locators rather than a second list of names**, so a name added to any constant a
 * locator reads is picked up here with no edit at all, and the only thing a newly supported stack
 * has to add is the row it adds to `READ_MANIFESTS` anyway. The Android entry is spelled out
 * because its locator answers a module rather than a manifest path, and the .NET entry is one row
 * for the two `READ_MANIFESTS` carries because {@link findDotnetProject} answers both.
 */
const READ_MANIFEST_LOCATORS: readonly ((context: DetectContext) => string | undefined)[] = [
  (context) => findFirstManifest(context, [PACKAGE_MANIFEST]),
  findPythonManifest,
  findGoManifest,
  findFlutterManifest,
  (context) => {
    const found = findAndroidModule(context);
    return found === undefined ? undefined : joinRepoRelative(found.module, ANDROID_MANIFEST);
  },
  findMavenManifest,
  findGradleManifest,
  findDotnetProject,
  findSwiftPackageManifest,
  findXcodeProject,
  findCargoManifest,
  findBundlerManifest,
  findComposerManifest,
  findCmakeManifest,
];

/**
 * Every manifest `init` reads that is present, repo-relative, in {@link READ_MANIFEST_LOCATORS}'
 * order, deduplicated — the empty list when none is.
 *
 * **What was present, never what supplied the commands.** This order is not `COMMAND_FAMILIES`'
 * (`detect/presets.ts`), so no entry may be paired with a command family by position; the family
 * that answered names its own manifest (`PresetProfile.commandManifest`).
 *
 * Deduplicated because one file can answer two locators — {@link findDotnetProject}'s solution and
 * project arms are one locator, but a stack added later need not be — and a path printed twice reads
 * as two manifests.
 */
export function findReadManifests(context: DetectContext): readonly string[] {
  const found: string[] = [];
  for (const locate of READ_MANIFEST_LOCATORS) {
    const path = locate(context);
    if (path !== undefined && !found.includes(path)) found.push(path);
  }
  return found;
}

/**
 * The first manifest `init` **does** read that exists in a manifest root, repo-relative.
 *
 * {@link findUnreadManifest}'s counterpart, and nothing is derived from what it finds either. It
 * answers *a manifest that could have answered this key is here*, for the warning arm that would
 * otherwise tell an adopter their repository holds no manifest `init` reads while one sits at its
 * root — the shape a partially-resolving family leaves behind, since the family search stops at the
 * first family whose **derivation returns a command set**, not at the first whose manifest exists
 * (`detect/presets.ts`, `commandFamilies`), so a family may read its manifest and decline.
 *
 * Expressed over {@link findReadManifests} rather than over the locators directly, so the probe and
 * the list cannot come to enumerate differently. Nothing is derived from it here either: this path
 * raises no warning and no note.
 */
export function findAnyReadManifest(context: DetectContext): string | undefined {
  return findReadManifests(context)[0];
}

/**
 * The Python package directory, repo-relative: the first immediate sub-directory of a manifest
 * root carrying an `__init__.py`, else that root's `src/`, else `undefined`.
 *
 * The `src/` fallback covers the `src`-layout convention, where the importable package is one
 * level further down; naming `src` there is enough for a layer path, and picking which package
 * inside it is the layer is a judgement call and therefore
 * `/autonomous-sdlc-harness:harness-analyze`'s.
 */
export function findPythonPackageDir(context: DetectContext): string | undefined {
  for (const root of context.manifestRoots) {
    for (const name of context.childDirNames(root)) {
      if (NON_PACKAGE_DIR_NAMES.has(name)) continue;
      const path = joinRepoRelative(root, name);
      if (context.fileExists(joinRepoRelative(path, PYTHON_PACKAGE_MARKER))) return path;
    }
  }
  for (const root of context.manifestRoots) {
    const path = joinRepoRelative(root, SRC_DIR);
    if (context.dirExists(path)) return path;
  }
  return undefined;
}

/** What matched, for the `init` summary and for `doctor` to repeat. */
export interface SignalMatch {
  /** The repo-relative path or manifest key that decided it. */
  readonly evidence: string;
}

/** One row of the detection table. */
export interface Signal {
  /** Stable identifier, reported as {@link DetectionResult.matchedSignal} and documented in `docs/cli.md`. */
  readonly id: string;
  /** The preset this row selects. */
  readonly preset: PresetName;
  /** One line describing the test, for the generated documentation of this table. */
  readonly description: string;
  /** Raised when this row matches. Only the fallback row has one. */
  readonly warning?: string;
  /** The test itself: pure existence or top-level manifest-key inspection, never file contents. */
  test(context: DetectContext): SignalMatch | undefined;
}

/**
 * The detection table, in evaluation order. **First match wins and the rest are not evaluated**,
 * so the order is the decision: a workspace repository is a monorepo even when one of its packages
 * is layered, and a layered tree is layered even when it also has a `routes/` directory.
 *
 * The last row matches unconditionally, which is what makes detection total.
 */
export const SIGNALS: readonly Signal[] = [
  {
    id: 'monorepo:workspaces-key',
    preset: 'monorepo',
    description: 'the repository root package.json declares a top-level `workspaces` key',
    test: (context) => (context.hasWorkspacesKey() ? { evidence: `${PACKAGE_MANIFEST}#workspaces` } : undefined),
  },
  {
    id: 'monorepo:workspace-manifest',
    preset: 'monorepo',
    description: `a workspace-tool manifest at the repository root: ${WORKSPACE_MANIFESTS.join(', ')}`,
    test: (context) => {
      for (const name of WORKSPACE_MANIFESTS) {
        if (context.fileExists(name)) return { evidence: name };
      }
      return undefined;
    },
  },
  {
    id: 'layered-clean-arch:layer-directories',
    preset: 'layered-clean-arch',
    description: `at least ${LAYERED_MIN_MATCHES} of ${LAYERED_DIR_NAMES.map((name) => `${name}/`).join(', ')} ${CANDIDATE_ROOTS_CLAUSE}`,
    test: (context) => {
      const match = findLayeredRoot(context);
      if (match === undefined || match.dirs.length < LAYERED_MIN_MATCHES) return undefined;
      return { evidence: match.dirs.map((dir) => dir.path).join(', ') };
    },
  },
  {
    id: 'python-package:packaging-manifest',
    preset: 'python-package',
    description: `a Python packaging manifest: ${PYTHON_MANIFESTS.join(', ')}`,
    test: (context) => {
      const manifest = findPythonManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    id: 'api-service:route-directory',
    preset: 'api-service',
    description: `a ${API_DIR_NAMES.map((name) => `${name}/`).join(', ')} directory ${CANDIDATE_ROOTS_CLAUSE}`,
    test: (context) => {
      const dir = findApiDir(context);
      return dir === undefined ? undefined : { evidence: dir };
    },
  },
  {
    id: 'api-service:go-module',
    preset: 'api-service',
    description: `a ${GO_MANIFEST} file`,
    test: (context) => {
      const manifest = findGoManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    // **Below `layered-clean-arch:layer-directories`, deliberately.** A Flutter application laid
    // out as `lib/{data,domain,presentation}` already answers that row, with its three real layers
    // pointed at the per-layer conventions documents; claiming it here would replace that profile
    // with a single `lib` layer. Such a tree never reaches this row, and gains only the command
    // pair below, which is the whole of what it was missing.
    //
    // **First of the rows added for a stack that nests another stack's tree.** A Flutter repository
    // carries `android/` and `ios/` subtrees, so being claimed here is what keeps the
    // `android-gradle` and `apple-native` rows from ever seeing it. Belt-and-braces rather than
    // load-bearing: both of those locators probe manifest roots — the application directory and the
    // repository root — and never descend into `android/` or `ios/`, so ordering alone is not what
    // the separation rests on.
    id: 'flutter:pubspec-manifest',
    preset: 'flutter',
    description: `a ${PUBSPEC_MANIFEST} file`,
    test: (context) => {
      const manifest = findFlutterManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    // **How this row settles a collision file existence can answer.** An Android project and a
    // plain JVM one share `build.gradle` and `settings.gradle`, so neither name tells them apart;
    // an `AndroidManifest.xml` is present in the first and in no plain JVM module, and it is a file
    // existence test rather than a read of a Gradle script's plugin line. That is why this row is
    // ordered ahead of the `jvm` rows below: those match on the shared Gradle manifests, and
    // evaluating them first would claim every Android repository.
    //
    // **A Flutter repository does not match here**, and not only because `flutter:pubspec-manifest`
    // is evaluated above: its Android manifest sits at `android/app/src/main/AndroidManifest.xml`,
    // and `findAndroidModule` searches `manifestRoots` — the application directory and the
    // repository root — so `android/` is not a root it ever looks under.
    id: 'android-gradle:android-manifest',
    preset: 'android-gradle',
    description: `an ${ANDROID_MODULE_DIRS.map((module) => (module === '.' ? ANDROID_MANIFEST : `${module}/${ANDROID_MANIFEST}`)).join(' or ')} file`,
    test: (context) => {
      const found = findAndroidModule(context);
      return found === undefined ? undefined : { evidence: joinRepoRelative(found.module, ANDROID_MANIFEST) };
    },
  },
  {
    // **Below `android-gradle:android-manifest`, and that order is the whole separation.** An
    // Android project carries the same `build.gradle` / `settings.gradle` these two rows match on,
    // so evaluating them first would claim every Android repository; the row above matches on an
    // `AndroidManifest.xml`, which no plain JVM module has. Reordering these three rows silently
    // re-presets every Android adopter, which is why a control case asserts the order directly
    // (`test/stack-presets.test.mjs`).
    //
    // **Two rows, one preset**, the shape `api-service` already has: a preset is a layer profile,
    // and Maven and Gradle JVM projects share the `src/main/<java|kotlin>` source root and differ
    // only in the runner — so a second preset would buy a second name and the same profile. Which
    // build tool answers is `SIGNAL_COMMAND_FAMILY`'s question, not this table's: the row that
    // matched hoists that build tool's command family.
    id: 'jvm:maven-manifest',
    preset: 'jvm',
    description: `a ${MAVEN_MANIFEST} file`,
    test: (context) => {
      const manifest = findMavenManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    // Maven ahead of Gradle: a repository carrying both is a Maven build with a Gradle script
    // beside it far more often than the reverse, and first-match-wins has to answer one of them.
    id: 'jvm:gradle-manifest',
    preset: 'jvm',
    description: `a Gradle project manifest: ${GRADLE_MANIFESTS.join(', ')}`,
    test: (context) => {
      const manifest = findGradleManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    // **Suffix-matched, which is what makes this row different from every manifest row above it.**
    // A .NET solution and project are named after the product, so there is no fixed file name to
    // test for; `findFileWithSuffix` resolves the sorted-first entry in a root, which is what keeps
    // a repository holding two solutions answering the same one on every run.
    //
    // **One preset for a .NET backend and a .NET frontend, deliberately.** They share the build
    // tool, these manifests and the `src/` source root, so the layer profile is the same; what
    // would tell them apart is the optional-phase set, and `generators/harnessConfig.ts` takes
    // that from `init`'s flags rather than from the preset — so a second row and a second name
    // would carry no behaviour at all. The shape `jvm` already has, one step further.
    //
    // **Below the JVM rows and above the fallback.** Nothing above matches on a .NET name — the
    // depth bound of `findDotnetProject` keeps it out of any other stack's tree — so its position
    // costs nothing; it sits low because a `src/`-nested project is the widest test in the table.
    id: 'dotnet:solution-or-project',
    preset: 'dotnet',
    description: `a ${DOTNET_SOLUTION_SUFFIXES.join('/')} solution, or a ${DOTNET_PROJECT_SUFFIXES.join('/')} project at a manifest root or one level under its ${SRC_DIR}/`,
    test: (context) => {
      const project = findDotnetProject(context);
      return project === undefined ? undefined : { evidence: project };
    },
  },
  {
    // **The table's second suffix-matched row**, and its `.xcodeproj` / `.xcworkspace` halves are
    // **directories** — the shape `findFileWithSuffix` searches `childDirNames` for. A SwiftPM
    // package is matched by name instead, so one row covers both of the ways an Apple-native
    // repository declares itself.
    //
    // **One preset for iOS and macOS**, because nothing a file-existence test can ask separates
    // them: the manifests, the `Sources/` root and the toolchain are identical, and the platform
    // appears only inside a scheme or a target setting this table may not read. So the name says
    // `apple-native` rather than implying an iOS-only scope.
    //
    // **Below `flutter:pubspec-manifest`, which is what keeps a Flutter repository's `ios/` tree out
    // of this row.** Belt-and-braces rather than load-bearing, exactly as that row's own comment
    // says: both locators here probe manifest roots — the application directory and the repository
    // root — and never descend into `ios/`, so ordering alone is not what the separation rests on.
    //
    // A `Podfile` is **not** matched on: CocoaPods sits beside either container rather than instead
    // of one, so it decides nothing this row asks, and reading it would answer no question the
    // `.xcworkspace` it generates has not already answered.
    id: 'apple-native:swift-package-or-xcode-project',
    preset: 'apple-native',
    description: `a ${SWIFT_PACKAGE_MANIFEST} file, or a ${XCODE_PROJECT_SUFFIXES.map((suffix) => `*${suffix}`).join('/')} container, at a manifest root`,
    test: (context) => {
      const found = findSwiftPackageManifest(context) ?? findXcodeProject(context);
      return found === undefined ? undefined : { evidence: found };
    },
  },
  {
    // **A Cargo workspace root carries this same manifest, and is deliberately not told from a
    // plain crate.** Distinguishing them would mean reading the file for a `[workspace]` table, and
    // what it would buy is a per-member layer list — a judgement call, and therefore
    // `/autonomous-sdlc-harness:harness-analyze`'s. A workspace root that keeps a `src/` gets the
    // single source-root layer, one that does not gets `general` alone, and either is better than
    // the `flat` fallback.
    //
    // **Above the fallback and below every row before it**, which costs nothing: no earlier row
    // matches on a Rust name, and no row above this one matches on a `Cargo.toml`.
    //
    // **This row carries no `declaresNodeScript` guard, and that is a decision rather than an
    // omission.** A `Cargo.toml` does appear in a tree whose own stack is Node — a napi-rs or neon
    // addon is the routine case, and it is the larger population, not a corner — so this row moves
    // such a repository from `flat` to `rust-cargo` and hoists `cargo` over the npm scripts its root
    // manifest declares. It is accepted because what the family answers with is real: the
    // lint-and-format type-check line `cargoCommands` derives, and `cargo test`, verify the crate
    // that is actually in the tree, where rows 14
    // and 16 are guarded precisely because theirs are not (`bundle install` alone verifies nothing,
    // `ctest` runs against a build tree registering no tests). The price, stated because it is not
    // free: `depInstall` becomes `cargo fetch`, which resolves the key and so suppresses
    // `buildPreset`'s root npm fallback, and no worktree the flow cuts gets `node_modules` — the
    // addon's JavaScript-side tests are then the adopter's to wire into `harness.config.json` by
    // hand. Recorded in `docs/cli.md` §4 (family-order residual) and asserted in
    // `test/stack-presets.test.mjs` (the napi-rs case).
    id: 'rust-cargo:cargo-manifest',
    preset: 'rust-cargo',
    description: `a ${CARGO_MANIFEST} file`,
    test: (context) => {
      const manifest = findCargoManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    // **The collision this row deliberately loses: a Rails application.** Its `app/controllers`
    // matches `api-service:route-directory` far above here, so it never reaches this row — and that
    // is the better of the two answers, because `api=app/controllers` names a real request-handling
    // layer where this row would name only the `app/` source root above it. It loses nothing by
    // losing: the Bundler command family is selected independently of the preset, so a Rails
    // repository keeps the `api-service` profile *and* gets `bundle exec` lines.
    //
    // **The collision this row must not lose, and the reason for the guard: a repository that is not
    // Ruby at all.** `Gemfile` is Ruby's only dependency manifest, but it is not evidence that the
    // repository's stack is Ruby — the React Native project template ships one at the root to pin
    // CocoaPods and fastlane, and a Jekyll site ships one beside an npm build ({@link
    // BUNDLER_MANIFEST}). Unguarded, an RN repository was detected `ruby-bundler`, took the `general`
    // layer only, and had both required keys written as placeholders while the npm scripts sitting in
    // its root manifest went unread. So the row declines a repository whose root `package.json`
    // declares a script the npm family would answer with ({@link declaresNodeScript}) — the same
    // guard, for the same reason, as `cmake-cpp:cmake-lists` below.
    //
    // What reaches this row is therefore every other Ruby repository — a gem, a script collection,
    // a Sinatra service without a route directory — and matching it by name asks nothing further:
    // `Gemfile` is Ruby's only dependency manifest.
    //
    // **The guard is half the fix and the smaller half**, because the Bundler command family is
    // selected independently of the preset and is tried above `npm`: a declined row leaves the
    // commands where they were. `COMMAND_FAMILIES`' order is deliberately *not* what was changed —
    // moving `bundler` below `npm` would take the Rails case above with it, since a Rails
    // application hoists nothing (its row is directory-shaped) and routinely carries an
    // asset-pipeline `package.json`, so it would answer `npm run build` instead of `bundle exec
    // rspec`. The family carries the guard on its own terms instead (`detect/presets.ts`,
    // `bundlerCommands`).
    id: 'ruby-bundler:gemfile',
    preset: 'ruby-bundler',
    description: `a ${BUNDLER_MANIFEST} file, in a repository whose root ${PACKAGE_MANIFEST} declares no script the npm commands are derived from`,
    test: (context) => {
      if (declaresNodeScript(context)) return undefined;
      const manifest = findBundlerManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    // **The collision this row deliberately loses, for `ruby-bundler:gemfile`'s reason: a Laravel
    // application.** Its root `routes/` matches `api-service:route-directory` far above here, so it
    // never reaches this row, and `api=routes` names a real request-handling layer where this row
    // would name only the `app/` source root above it. It loses nothing by losing: the Composer
    // command family is selected independently of the preset, so a Laravel repository keeps the
    // `api-service` profile *and* gets its `composer`, PHPStan and PHPUnit lines.
    //
    // What reaches this row is therefore every other PHP repository — a PSR-4 library, a Symfony
    // service with no route directory — and matching it by name asks nothing further:
    // `composer.json` is PHP's only dependency manifest.
    id: 'php-composer:composer-manifest',
    preset: 'php-composer',
    description: `a ${COMPOSER_MANIFEST} file`,
    test: (context) => {
      const manifest = findComposerManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    // **Last of the manifest rows, and the position is the argument.** Every row above matches on a
    // file that names the repository's *own* stack; a `CMakeLists.txt` is the one manifest here that
    // routinely describes a **sub-component** of a repository whose stack is something else — a
    // native extension in a Python distribution, a `node-gyp` addon, a Rust FFI shim. Evaluated any
    // higher it would claim all three, which is why it is evaluated below them: a Python
    // distribution keeps `python-package` and its `mypy`/`pytest` lines and a Cargo crate keeps
    // `rust-cargo`.
    //
    // **Order settles two of those three populations; the third needs the guard, and the reason is
    // that Node has no row of its own.** An npm repository reaches `flat` (or a directory-shaped
    // row) by fallback rather than by a positive match, so there is nothing above this row for a
    // `node-gyp`/`cmake-js` addon to be caught by — and claiming it was silent: both required keys
    // resolved to CMake lines that never type-check the published TypeScript and run `ctest` against
    // a build tree registering no tests, with no warning and no note. So the row declines a
    // repository whose root manifest declares a script the npm family would answer with
    // ({@link declaresNodeScript}), and what reaches this row is the repository whose only manifest
    // is CMake's **or** whose root `package.json` declares none of those scripts.
    //
    // Matched by name and asking nothing further, for `rust-cargo:cargo-manifest`'s reason: `cmake`
    // and `ctest` take the same arguments whatever the file declares, so its presence is the whole
    // test and reading it would answer no question this row asks.
    id: 'cmake-cpp:cmake-lists',
    preset: 'cmake-cpp',
    description: `a ${CMAKE_MANIFEST} file, in a repository whose root ${PACKAGE_MANIFEST} declares no script the npm commands are derived from`,
    test: (context) => {
      if (declaresNodeScript(context)) return undefined;
      const manifest = findCmakeManifest(context);
      return manifest === undefined ? undefined : { evidence: manifest };
    },
  },
  {
    id: FLAT_FALLBACK_SIGNAL_ID,
    preset: 'flat',
    description: 'nothing above matched — the unconditional fallback',
    warning: FLAT_FALLBACK_WARNING,
    test: () => ({ evidence: 'no signal matched' }),
  },
];

/** What detection concluded. */
export interface DetectionResult {
  readonly preset: PresetName;
  /** The {@link Signal.id} that matched, or {@link FORCED_SIGNAL_ID} when `--preset` decided it. */
  readonly matchedSignal: string;
  /** {@link SignalMatch.evidence}, or `undefined` under `--preset`, where nothing was evaluated. */
  readonly evidence: string | undefined;
  /** Warnings raised while detecting. Never a refusal — detection always returns a preset. */
  readonly warnings: readonly string[];
  /**
   * Informational lines raised while detecting — what a correct run should say about itself, as
   * opposed to what needs fixing.
   */
  readonly notes: readonly string[];
  /** The probe, handed on to `detect/presets.ts` so the repository is read once per run. */
  readonly context: DetectContext;
}

/**
 * `--preset <name>` validated against {@link PRESET_NAMES}.
 *
 * Exported so the `init` flag surface can refuse a typo at parse time, before anything is written,
 * rather than at the moment detection runs. An unknown name is a usage refusal and carries the
 * default exit code.
 */
export function parsePresetName(value: string): PresetName {
  const match = PRESET_NAMES.find((name) => name === value);
  if (match === undefined) {
    throw new HarnessError(`unknown preset ${JSON.stringify(value)}: expected one of ${PRESET_NAMES.join(', ')}`);
  }
  return match;
}

/**
 * Decide the layer preset for a repository.
 *
 * @param repoRoot absolute repository root.
 * @param appDir `--app-dir`, or `harness.config.json`'s `appDir`; `.` when the repository is the
 *   application.
 * @param forcedPreset `--preset`, which bypasses the table entirely — no row is evaluated, so the
 *   result reports {@link FORCED_SIGNAL_ID} and the summary says what actually happened rather
 *   than naming a signal that was never tested.
 *
 * Never returns a refusal for an unrecognised repository: the last row of {@link SIGNALS} matches
 * unconditionally and carries {@link FLAT_FALLBACK_WARNING}.
 */
export function detectPreset(repoRoot: string, appDir: string = '.', forcedPreset?: string): DetectionResult {
  const context = new DetectContext(repoRoot, appDir);

  if (forcedPreset !== undefined) {
    const preset = parsePresetName(forcedPreset);
    return {
      preset,
      matchedSignal: FORCED_SIGNAL_ID,
      evidence: undefined,
      warnings: context.drainWarnings(),
      notes: context.drainNotes(),
      context,
    };
  }

  for (const signal of SIGNALS) {
    const match = signal.test(context);
    if (match === undefined) continue;
    if (signal.warning !== undefined) context.warn(signal.warning);
    return {
      preset: signal.preset,
      matchedSignal: signal.id,
      evidence: match.evidence,
      warnings: context.drainWarnings(),
      notes: context.drainNotes(),
      context,
    };
  }

  // Unreachable while the table ends in an unconditional row. It is an internal fault rather than
  // an adopter-fixable one, so it exits INTERNAL instead of pretending to a preset.
  throw new HarnessError('stack detection fell through the signal table, which must end in an unconditional row', EXIT.INTERNAL);
}
