/**
 * `init` end to end, against a repository the test builds and throws away — acceptance gate 4.
 *
 * **The rule these tests exist to enforce: `init` is a writer aimed at a repository, so
 * non-destructiveness is checked before anything else is.** A generator that writes the wrong
 * content is a bug an adopter can see and correct; a re-run that silently rewrites a config, a
 * hand-tuned permission profile or a ledger destroys the only copy of something. So the idempotence,
 * `--force`-takes-a-backup and `--dry-run`-writes-nothing cases below are not an afterthought to the
 * first-run assertions — they are the reason this file exists.
 *
 * These run against the **compiled** CLI at `dist/cli.js`: `npm run build` precedes `npm test`, and
 * `runCli` refuses with that sentence rather than leaving a module-resolution error to explain it.
 * The `ajv` half of gate 4 — the generated config validated against the schema — is run outside
 * these tests, because the schema validator is not a dependency of this package.
 *
 * **No prompt is ever answered here, by design.** Every subprocess below gets a pipe for stdin, so
 * every run takes the side of the interaction rule that cannot be asked — which is what makes the
 * default and refusal cases below mean what they say, and what leaves the *answered* side uncovered
 * by anything in this package. That side is acceptance gate 7(iii), hand-run at a terminal: driving
 * it from here would need a pty, which Node cannot allocate without a native dependency this package
 * does not carry.
 *
 * **The real runtime install and model download are not covered.** Both reach the network, which no
 * test may; every retrieval-on case runs under the stub and a planted model cache, and the setup cases
 * assert only the skips, the dry-run notes and the stub refusals. Gate 10 covers the real path by hand.
 *
 * ## Four non-obvious choices, and where each comes from
 *
 * 1. **Every test builds its own fixture and tears it down.** No directory is shared and none is
 *    reused across tests, so a test that writes cannot change what a later one observes, and a
 *    failure leaves nothing behind to confuse the next run (`helpers/fixture.mjs`).
 * 2. **The wrapper ↔ profile invariant is asserted in both directions**, because the two failures
 *    are different and neither is loud: a written wrapper missing one of its three allow forms
 *    leaves a caller using that spelling matching neither `allow` nor `deny`, which in an unattended
 *    run is a stall; an allow entry naming a wrapper that was never written grants a path to nothing.
 *    The second direction is checked on each entry's trailing `<scriptsDir>/<name>.sh` segment
 *    rather than by resolving the entry to a file, because the sibling-worktree form is a glob and
 *    resolves to no file in a single-checkout fixture by construction.
 * 3. **Assertions name the contract literally** — `sdlc-harness/`, `version: 1`,
 *    `bash scripts/typecheck.sh`, `.claude/settings.autonomous.json` — rather than importing the
 *    constants the generators wrote them from. Comparing generated output against the constant that
 *    generated it proves only that the CLI is self-consistent. The identity of the plugin is the one
 *    exception, and it is derived from the two shipped manifests rather than spelled out here,
 *    because those manifests are what a rename has to reach.
 * 4. **The wrappers are run, not only written — two of the three.** `test.sh` and
 *    `start-dev-server.sh` are driven against stubs that record where they were run from and what
 *    they were handed, because each does something no inspection of the file reaches: anchoring to
 *    the repository root whatever directory the caller stood in, forwarding its arguments, and —
 *    for the dev server — returning with the process still running. The stub is what makes that
 *    visible: a wrapper that inherited the caller's directory looks identical on disk to one that
 *    anchored itself. `typecheck.sh` is written, made executable and inspected here, and run by
 *    nothing in this package: its template and `test.sh`'s carry the same executable body and
 *    differ only in their comments — `diff <(grep -v '^#' cli/templates/scripts/typecheck.sh)
 *    <(grep -v '^#' cli/templates/scripts/test.sh)` — so running it would re-drive the arm above.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cp, mkdtemp, readdir, rm, stat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import test from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import {
  createFixture,
  ignoredAmong,
  plantModelFiles,
  plantRetrievalRuntime,
  readJson,
  retrievalEnv,
  runBash,
  runCli,
  runCliFrom,
  runGit,
  snapshotTree,
  PACKAGE_ROOT,
  WORKSPACE_ROOT,
} from './helpers/fixture.mjs';
import { PUSH_DESTINATION_FORMS } from '../dist/generators/notifications.js';

/** The generated artifacts this file addresses by name — the contract, spelled out once. */
const CONFIG_FILE = 'harness.config.json';
const PROFILE_FILE = '.claude/settings.autonomous.json';
const SETTINGS_FILE = '.claude/settings.json';
const CLAUDE_MD = '.claude/CLAUDE.md';
const SHARED_STUB = '.claude/context/conventions.md';
const CONTEXT_DIR = '.claude/context';
const QA_SCENARIOS_FILE = '.claude/qa_test_scenarios.md';
const TASK_OFFER_FILE = '.claude/harness-task-offer.md';
const MCP_FILE = '.mcp.json';
const GITIGNORE_FILE = '.gitignore';

/** The three configured directories, at their documented defaults. */
const STATE_DIR = 'sdlc-harness';
const SCRIPTS_DIR = 'scripts';
const GITHOOKS_DIR = 'githooks';

/** A second protected branch, added to the config by hand after `init` wrote the hook from the first. */
const ADDED_BRANCH = 'release';

/** A protected entry that is a glob — the one metacharacter class a `case` label is meant to carry. */
const GLOB_BRANCH = 'release/*';

/** The schema's `required` list, and the two declared defaults a generated config carries. */
const REQUIRED_CONFIG_KEYS = ['version', 'defaultBranch', 'stateDir', 'layers', 'commands'];
const STATE_DIR_VALUE = 'sdlc-harness/';
const QA_DRIVER_VALUE = 'web-playwright';

/** A driver that is legal and is not the default, and one that is not a driver at all. */
const QA_DRIVER_CHOSEN = 'mobile-maestro';
const QA_DRIVER_UNKNOWN = 'appium';

/** Artifact directories the flow writes whatever the phases are, and the two long-lived ledgers. */
const ALWAYS_ON_DIRS = ['task_plans', 'code_reviews', 'flow_progress', 'branch_statistics', 'clarifications'];
const LEDGERS = ['lessons.md', 'improvement_suggestions.md'];

/** Directories that belong to a phase, so their presence is the phase toggle made visible. */
const QA_DIRS = ['qa_reviews', 'ui_test_plans'];
const DOCS_DIR = 'docs_catalog';
const PARITY_DIRS = ['business_parity_branch_reviews', 'business_parity_branch_review_point_reviews'];

/** The scenario skeleton's own opening heading — how the file on disk is identified as that template. */
const QA_SCENARIOS_HEADING = /^# QA test scenarios$/m;

/** The managed block's opening marker, which has to stay byte-stable for a re-run to find it. */
const GITIGNORE_MARKER = '>>> autonomous-sdlc-harness (managed block';

/**
 * The unattended loop's stop, pause and dispatch-count files and the flow walker's state file,
 * written flat at the root of the run-artifact tree while a run is in flight and never committed.
 *
 * Spelled out here rather than imported from the generator that emits them — choice 3 in the module
 * header — so a name dropped from the generated block fails an assertion instead of quietly
 * changing what the assertion asks for.
 */
const RUN_CONTROL_ARTIFACTS = [
  '.dispatch_counter',
  '.flow_walker_state',
  'STOP',
  'AUTONOMOUS_STOP',
  'PAUSE',
  'RESUME',
  'PAUSE_ACK',
  'PAUSE_PROGRESS.md',
];

/**
 * The browser half of the managed block: the two pinned MCP servers' artifact directories, the
 * interactive-test agent's screenshot destination under the run-artifact tree, and the root-anchored
 * basename rule for a server that sanitizes the filename it was given.
 *
 * Spelled out rather than imported from the generator — choice 3 in the module header — and none of
 * these strings appears in the group's comments, so "exactly once" is a claim about the rules.
 */
const QA_ARTIFACT_RULES = ['.playwright-mcp/', '.chrome-devtools-mcp/', `${STATE_DIR}/qa_artifacts/`, '/qa_*.png'];

/**
 * Any spelling of that group, comments included, for the direction where none of it may be there:
 * the group is gated on the browser driver, and a rule whose explanation survived the gate would be
 * a file describing rules it does not carry.
 */
const QA_ARTIFACT_SPELLINGS = /playwright|chrome-devtools|qa_artifacts|qa_\*\.png/;

/**
 * The client env file `setup-worktree.sh` symlinks into every working copy it bootstraps, and the
 * committed sibling a fresh clone copies from — which the rule must not reach, because what is
 * ignored is the file and never the path.
 */
const CLIENT_ENV_RULE = '.env';
const CLIENT_ENV_EXAMPLE = '.env.example';

/**
 * The backup `config set` writes beside the configuration, as the rule is spelled in the file and as
 * the path git is asked about. The two are kept apart on purpose: the rule is root-anchored and the
 * path is not, so a test that counted only the rule would pass on an unanchored spelling.
 */
const CONFIG_BACKUP_PATH = `${CONFIG_FILE}.bak`;
const CONFIG_BACKUP_RULE = `/${CONFIG_BACKUP_PATH}`;

/** An `appDir` the repository nests its application in, so the rule is asserted somewhere it moves to. */
const NESTED_APP_DIR = 'packages/storefront';

/** An allow/ask entry that invokes a wrapper script, in any of the three forms the profile emits. */
const SCRIPT_ENTRY = /^Bash\(bash (\S+\.sh):\*\)$/;

/**
 * A commit identity handed to the subprocess, for the cases that expect a commit to happen.
 *
 * `createFixture` configures `user.email` and `user.name` only when it created a repository itself,
 * and every subprocess runs with `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` pointed at `/dev/null`
 * — so a repository `--git-init` creates inside a `{ git: false }` fixture has an identity in no
 * configuration file at all. Left to guess one, git accepts or refuses depending on whether this
 * host's name carries a domain, which is exactly the "passes on one machine, fails on another for a
 * reason no assertion names" failure the fixture's isolation exists to prevent. These four are
 * honoured whatever the configuration files hold.
 */
const COMMIT_IDENTITY = {
  GIT_AUTHOR_NAME: 'Harness Fixture',
  GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
  GIT_COMMITTER_NAME: 'Harness Fixture',
  GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
};

/**
 * The mirror of {@link COMMIT_IDENTITY}, pinned just as deterministically: git's own switch for
 * "never guess an identity", passed through the environment-borne configuration. Combined with the
 * fixture's `/dev/null` configuration files there is then no identity on **any** host, rather than
 * none on the hosts that happen to lack one.
 */
const NO_COMMIT_IDENTITY = {
  GIT_CONFIG_COUNT: '1',
  GIT_CONFIG_KEY_0: 'user.useConfigOnly',
  GIT_CONFIG_VALUE_0: 'true',
};

/** The first git that reads {@link NO_COMMIT_IDENTITY}'s `GIT_CONFIG_*` variables. */
const ENV_CONFIG_SINCE = [2, 31];

/**
 * A reason string when this host's git predates {@link ENV_CONFIG_SINCE}, and `false` when it does
 * not — so the one case that depends on those variables skips visibly instead of failing for a
 * reason that is about the host rather than about the CLI.
 */
const GIT_TOO_OLD = (() => {
  let version;
  try {
    version = execFileSync('git', ['--version'], { encoding: 'utf8' });
  } catch {
    return 'git is not on PATH';
  }
  const [major, minor] = (/(\d+)\.(\d+)/.exec(version) ?? []).slice(1).map(Number);
  if (major === undefined || Number.isNaN(major)) return `could not read a version from \`git --version\`: ${version}`;
  const [sinceMajor, sinceMinor] = ENV_CONFIG_SINCE;
  if (major > sinceMajor || (major === sinceMajor && minor >= sinceMinor)) return false;
  return `this host's git predates GIT_CONFIG_COUNT (needs ${sinceMajor}.${sinceMinor}): ${version.trim()}`;
})();

/** What {@link commitCount} answers when `HEAD` names no commit at all. */
const UNBORN = 'unborn HEAD';

/**
 * The fragment shared by all three variants of the note `--git-init` prints when the directory is
 * already a repository — the one the stderr assertions use, because "not a warning" is a claim about
 * the whole family rather than about one arm of it.
 */
const NOTHING_CREATED_NOTE = 'was given and nothing was created';

/**
 * The real-run arm's distinguishing wording, asserted **present** in the commit-less real run and
 * **absent** under `--dry-run`. Two uses of one constant on purpose: a later edit that re-unified the
 * two messages would have to break one of them.
 */
const MAKES_FIRST_COMMIT = /so init makes the first commit/;

/**
 * The outer-loop scripts that land in the same `scriptsDir` as the wrappers and reach the profile
 * through the same three forms — excluded everywhere below, because this file's subject is the
 * WRAPPER family and every assertion here is about `commands.*` ↔ wrapper ↔ profile.
 *
 * Spelled out rather than imported from the shipped table — choice 3 in the module header — and it is
 * a *subtraction* rather than a contract: a name that disappears from this list makes the assertions
 * here stricter, never looser. What these files are is `test/outer-loop-scripts.test.mjs`'s, and
 * which of them may be allow-listed at all is `test/profile.test.mjs`'s, driven by the table itself.
 */
const OUTER_LOOP_SCRIPT_FILES = [
  'commit-on-branch.sh',
  'push-branch.sh',
  'refresh-branch.sh',
  'scratch-run.sh',
  'create-worktree.sh',
  'setup-worktree.sh',
  'cleanup-merged-worktrees.sh',
  'autonomous-format-stream.sh',
  'autonomous-notify.sh',
  'autonomous-watcher.sh',
  'restart-watcher.sh',
  'remote-run.sh',
  'docs-search-server.sh',
  'flow-walker.sh',
];

/** A left-over template token — none may survive into a generated file. */
const TEMPLATE_TOKEN = '{{';

/** The shipped conventions skeletons, relative to the CLI package root. */
const CONTEXT_TEMPLATES = ['templates', 'claude', 'context'];

/** The fragment of the run's own note saying a layer fell through to the generic skeleton. */
const GENERIC_STUB_NOTE = 'no dedicated skeleton';

/**
 * The two halves of the untouched-skeleton test, and the command every stub footer points at.
 *
 * Spelled out rather than imported from the generator that writes them — choice 3 in the module
 * header — and here that matters more than usual: three consumers outside this package read these
 * exact strings off documents in an adopter's repository, so comparing generated output against the
 * constant that generated it would leave a renamed marker passing.
 */
const UNFILLED_MARKER = '<!-- harness:unfilled -->';
const GUIDANCE_MARKER = '**What belongs here**';
const ANALYZE_COMMAND = '/autonomous-sdlc-harness:harness-analyze';

/** How the reporter renders a step heading, and the whole of what delimits one block from the next. */
const STEP_MARKER = '== ';

/**
 * What a wrapped row claims about the line it printed — one constant per arm, spelled out here rather
 * than imported from the command that prints them, so a reworded claim is a failing assertion rather
 * than a report that agrees with itself.
 */
const RESOLVED_PROVENANCE = 'the line this run resolved for';
const KEPT_PROVENANCE = 'already carries';
const UNREADABLE_PROVENANCE = 'could not be read';
const WRITE_PROVENANCE = 'this run writes it';
const WOULD_WRITE_PROVENANCE = 'a real run would write it';

/**
 * A repository whose stack detection resolves every command: an npm manifest with the four scripts
 * the presets look for, and nothing that matches an earlier signal than the fallback.
 *
 * It is the fixture most assertions use, because a repository whose commands stay unresolved writes
 * no wrapper scripts at all — which is a case worth testing (`init writes no wrapper…`) but a poor
 * one to check everything else against.
 */
function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
  };
}

/**
 * A repository satisfying **every** preset's layer locator at once — an npm manifest, the three
 * layered source directories, a route directory, a Dart `lib/`, an Android module with its manifest
 * and main source set, a JVM main source set, and a SwiftPM `Sources/`. The paragraphs below take
 * each addition in turn: what it is the locator for, and what it does and does not move for the
 * presets that were already served.
 *
 * It exists so that `--preset` alone decides which layers a run produces: with one seed behind every
 * preset, a preset that generates fewer layers than another is saying something about the preset
 * rather than about the tree it was pointed at.
 *
 * **No `pyproject.toml`, and its absence is load-bearing.** The command families are tried with
 * `npm` **last** (`src/detect/presets.ts`, `COMMAND_FAMILIES`), and `--preset` hoists nothing —
 * it reports `forced`, having evaluated no signal row — so a Python packaging manifest here would
 * decide `commands.typecheck` and `commands.test` for *every* `--preset` run made against this
 * seed, and the wrapper-body, permission-profile and command-detection assertions below would all
 * be reading `mypy .` / `pytest` from a fixture whose subject is the npm manifest. It costs the
 * layer claim nothing: `python-package`'s locator (`findPythonPackageDir`) resolves through its
 * documented `src/` fallback, and the `dirs` below already provide `src/`.
 *
 * **`lib/` is the `flutter` preset's locator and moves nothing else.** It carries none of the three
 * layered directory names, so `findLayeredRoot` still answers `src/` with three matches against
 * `lib/`'s zero; `findApiDir` still answers `src/routes`, since it searches the roots in order and
 * `lib/` holds no route directory; and `findPythonPackageDir` skips it for want of an `__init__.py`.
 * No `pubspec.yaml` accompanies it, for the reason the paragraph above gives about `pyproject.toml`:
 * a manifest here would decide the commands for every `--preset` run made against this seed.
 *
 * **`app/src/main/AndroidManifest.xml` is the `android-gradle` preset's locator, and it is the one
 * addition here that moves the commands.** The file is required rather than decorative: that
 * preset's layer arm resolves its module through `findAndroidModule`, which tests for exactly this
 * file, so a seed carrying only `app/src/main/java` answers `['general']` and the row below fails.
 * The layer half of every other preset is unmoved — `app/` carries none of the layered directory
 * names, no route directory and no `__init__.py`, so `findLayeredRoot` still answers `src/` and
 * `findApiDir` still answers `src/routes` — but the **command** half moves for every run made
 * against this seed, `--preset` or not: the family is chosen independently of the preset
 * (`COMMAND_FAMILIES`), the row that decides the preset here is directory-shaped and hoists
 * nothing, and the Gradle family is registered above `npm`. So `commands.typecheck` and
 * `commands.test` resolve to `gradle --console=plain --quiet compileDebugSources` and
 * `… testDebugUnitTest` — `gradle` rather than `./gradlew`, since no wrapper is seeded. No consumer
 * below asserts a wrapper body against this seed; the one that did was given a seed of its own when
 * the npm family was ordered last.
 *
 * **`src/main/java` is the `jvm` preset's locator, and it moves nothing else.** That preset's layer
 * arm resolves through `jvmSourceDir`, which looks for a main source set under a manifest root, so a
 * seed without it answers `['general']` and the row below fails. It adds no layered directory name,
 * no route directory and no `__init__.py`, so `findLayeredRoot` still answers `src/` and
 * `findApiDir` still answers `src/routes`; and no `pom.xml` or Gradle manifest accompanies it, for
 * the reason the pubspec paragraph gives — a JVM manifest here would move the commands for every run
 * made against this seed, and the Android manifest above has already decided them.
 *
 * **The `dotnet` preset needs nothing added here, and that is worth stating so a later reader does
 * not add a redundant directory.** Its layer arm resolves through `dotnetSourceDir`, which looks
 * for a `src/` at a manifest root, and the `dirs` below already provide one. No `*.sln` or
 * `*.csproj` accompanies it, for the reason the pubspec paragraph gives — a .NET manifest here
 * would move the commands for every run made against this seed, and the Android manifest above has
 * already decided them.
 *
 * **`Sources/` is the `apple-native` preset's locator, and it moves nothing else.** That preset's
 * layer arm resolves through `appleSourceDir`, whose first step is a manifest root's `Sources/`, so a
 * seed without it answers `['general']` and the row below fails. It carries none of the layered
 * directory names, no route directory and no `__init__.py`, so `findLayeredRoot` still answers `src/`
 * and `findApiDir` still answers `src/routes`. No `Package.swift` and no `*.xcodeproj` accompany it,
 * for the reason the pubspec paragraph gives — an Apple manifest here would move the commands for
 * every run made against this seed, and the Android manifest above has already decided them.
 *
 * **The test roots are here so the `tests` row is generated rather than skipped.** `testsLayer`
 * drops the row when the toolchain's conventional test root does not exist, so a seed without them
 * exercises no preset's `tests` layer and nothing here ever resolves `tests.md` — the pairing the
 * row below asserts. The five names are `PRESET_TEST_ROOTS`' candidates reduced to what covers
 * every preset that has an entry: `test` (`flutter`, `layered-clean-arch`, `api-service`,
 * `ruby-bundler`), `tests` (`python-package`, `dotnet`, `rust-cargo`, `php-composer`, `cmake-cpp`),
 * `Tests` (`apple-native`), `src/test` (`jvm`) and `app/src/test` (`android-gradle`). They move no
 * source row: `NON_PACKAGE_DIR_NAMES` already excludes `test` and `tests` from
 * `findPythonPackageDir`, no source-root candidate list names any of the five, and the two nested
 * ones sit under directories the seed already carries. They move no command either: every family
 * that reads a test directory — `bundlerCommands`' `spec`/`test` among them — is gated on a
 * manifest this seed deliberately does not carry, for the reason the pubspec paragraph gives.
 */
function everyPresetSeed() {
  return {
    files: { ...nodeProjectFiles(), 'app/src/main/AndroidManifest.xml': '<manifest package="com.example.fixture" />\n' },
    dirs: [
      'src/data',
      'src/domain',
      'src/presentation',
      'src/routes',
      'lib',
      'app/src/main/java',
      'src/main/java',
      'Sources',
      'test',
      'tests',
      'Tests',
      'src/test',
      'app/src/test',
    ],
  };
}

/**
 * The command line the wrapper under test is pointed at: a recorder that writes where it was run
 * from and what it was handed, then exits with the status the environment asks it for.
 *
 * It reports through an **absolute** path taken from the environment rather than writing beside
 * itself, because the directory it reports is the assertion — a recorder that resolved its own
 * location would be answering with the value under test.
 */
const RECORDER_SCRIPT = `#!/bin/sh
printf 'cwd=%s\\n' "$(pwd)" >> "$HARNESS_TEST_RECORD"
printf 'args=%s\\n' "$*" >> "$HARNESS_TEST_RECORD"
exit "\${HARNESS_TEST_EXIT:-0}"
`;

/** How long the dev-server stub stays up, and the bound the wrapper has to return well inside. */
const DEV_SERVER_STUB_SECONDS = 5;
const RETURNS_PROMPTLY_MS = 3000;

/**
 * A dev server's stand-in: it announces the port and the arguments it was reached with, then holds
 * the process open long enough to be observed. `exec`, so the pid the wrapper printed is the
 * process that is actually sleeping and signalling it leaves nothing behind.
 */
const DEV_SERVER_STUB = `#!/bin/sh
echo "port=\${HARNESS_DEV_SERVER_PORT:-none} args=$*"
exec sleep ${DEV_SERVER_STUB_SECONDS}
`;

/** Where each stub sits, as the **repo-relative** command line the wrapper is given. */
const RECORDER_PATH = 'tools/record-command.sh';
const DEV_SERVER_PATH = 'tools/dev-server-stub.sh';

/** A directory to invoke a wrapper *from*, so "ran at the repository root" is falsifiable. */
const NESTED_DIR = 'nested/deep';

/** Never bound by the stub, so it discriminates the log name and the environment variable only. */
const DEV_SERVER_PORT = '54321';

/**
 * A repository wired by hand so `commands.test` and `commands.devServer` are **raw** command lines
 * naming those stubs — the precedence `init` keeps, so the wrapper it writes runs the stub.
 *
 * Both are repo-relative, which is half the anchoring assertion on its own: they resolve from the
 * repository root and from nowhere else, so a wrapper that stayed in the caller's directory fails
 * to find its command at all rather than quietly running it in the wrong place.
 */
function recordingFixtureFiles() {
  return {
    ...nodeProjectFiles(),
    [CONFIG_FILE]: {
      version: 1,
      defaultBranch: 'main',
      stateDir: STATE_DIR_VALUE,
      layers: [{ name: 'general', path: '.', conventions: SHARED_STUB }],
      commands: {
        typecheck: 'echo typecheck',
        test: `bash ${RECORDER_PATH}`,
        devServer: `bash ${DEV_SERVER_PATH}`,
      },
    },
    [RECORDER_PATH]: RECORDER_SCRIPT,
    [DEV_SERVER_PATH]: DEV_SERVER_STUB,
  };
}

/** What the recorder wrote, as `key → value`. */
function recorded(path) {
  const lines = readFileSync(path, 'utf8').trim().split('\n');
  return Object.fromEntries(
    lines.map((line) => {
      const at = line.indexOf('=');
      return [line.slice(0, at), line.slice(at + 1)];
    }),
  );
}

/** True while `pid` is a process this account could signal — signal 0 asks without acting. */
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Poll a predicate for up to two seconds: the observable belongs to another process. */
async function eventually(check, describe) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (check()) return;
    await sleep(20);
  }
  assert.fail(describe);
}

/** Build a fixture, register its teardown against the test, and return its directory. */
async function fixtureFor(t, options) {
  const fixture = await createFixture(options);
  t.after(fixture.cleanup);
  return fixture.dir;
}

/**
 * Run `init` and fail with the CLI's own output when it did not exit 0.
 *
 * `env` is applied over the fixture's isolated environment, for the cases whose subject is the git
 * identity the command finds — supplied ({@link COMMIT_IDENTITY}) or refused
 * ({@link NO_COMMIT_IDENTITY}) — rather than left to whatever this host happens to have.
 */
async function initOk(dir, args = [], env = {}) {
  const result = await runCli(dir, ['init', ...args], env);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

/** The file's text. */
function text(dir, relativePath) {
  return readFileSync(join(dir, relativePath), 'utf8');
}

/** Assert a generated file exists and carries no unsubstituted template token. */
function assertRendered(dir, relativePath) {
  const content = text(dir, relativePath);
  assert.ok(content.length > 0, `${relativePath} is empty`);
  assert.ok(!content.includes(TEMPLATE_TOKEN), `${relativePath} still carries an unsubstituted token`);
}

/** True when a path exists, whatever it is. */
async function exists(dir, relativePath) {
  try {
    await stat(join(dir, relativePath));
    return true;
  } catch {
    return false;
  }
}

/** How many times `needle` occurs in `haystack`. */
function occurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

/**
 * The set a pre-push hook actually enforces: the alternatives of its `case` label, which is the line
 * after `case "$target" in`. Read from the script rather than from the file as a whole, because the
 * header comment names an example glob and would answer for a branch the guard never matches.
 */
function enforcedBranches(hookSource) {
  const lines = hookSource.split('\n');
  const at = lines.findIndex((line) => line.includes('case "$target" in'));
  assert.notEqual(at, -1, 'the pre-push hook has no case statement to read the enforced set from');
  return lines[at + 1].trim().replace(/\)$/, '').split('|');
}

/**
 * How many commits `HEAD` reaches, or {@link UNBORN} when there is no commit to reach.
 *
 * An unborn HEAD makes `rev-list` **exit non-zero** rather than print `0`, and that status is the
 * observable worth asserting: a helper that flattened it to a `0` would read a mistyped invocation
 * as "no commits" too. Every other non-zero status is re-thrown for the same reason `ignoredAmong`
 * re-throws its own.
 */
async function commitCount(dir) {
  try {
    const { stdout } = await runGit(dir, ['rev-list', '--count', 'HEAD']);
    return Number(stdout.trim());
  } catch (error) {
    if (!/ exited \d+:/.test(error.message)) throw error;
    return UNBORN;
  }
}

/** The `.sh` files the wrapper generator actually wrote, sorted — the outer-loop family excluded. */
async function writtenWrappers(dir) {
  const entries = await readdir(join(dir, SCRIPTS_DIR), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sh'))
    .map((entry) => entry.name)
    .filter((name) => !OUTER_LOOP_SCRIPT_FILES.includes(name))
    .sort();
}

/**
 * The rows of the run's `commands` step, keyed by the config key each one leads with.
 *
 * Read out of the report rather than asserted against a whole-stdout regex, because the property
 * under test is that a *row exists for a key* and says what that key resolved to — which a substring
 * match anywhere in the output would also pass on a line printed by some other step.
 */
function commandRows(stdout) {
  const lines = stdout.split('\n');
  const at = lines.indexOf(`${STEP_MARKER}commands`);
  if (at === -1) return {};
  const rows = {};
  for (const line of lines.slice(at + 1)) {
    if (line.startsWith(STEP_MARKER)) break;
    const key = /^((?:commands\.\w+)|deploy\.command) ->/.exec(line)?.[1];
    if (key !== undefined) rows[key] = line;
  }
  return rows;
}

/** The permission entries of one list that invoke a wrapper script, as their invoked paths. */
function scriptPaths(profile, list) {
  const entries = profile.permissions?.[list] ?? [];
  return entries
    .map((entry) => SCRIPT_ENTRY.exec(entry)?.[1])
    .filter((path) => path !== undefined && !OUTER_LOOP_SCRIPT_FILES.includes(basename(path)));
}

/**
 * The wrapper ↔ profile pairing, in both directions — choice 2 in the module header.
 *
 * Forward: each written wrapper contributes exactly the three forms a caller may use — the
 * repo-relative invocation `commands.*` holds, its repo-root-absolute twin, and its
 * sibling-worktree twin.
 *
 * Backward: no script-shaped allow entry names a wrapper that was not written, judged on the
 * entry's trailing `<scriptsDir>/<name>.sh` segment. Resolving the entry to a file instead would
 * fail on a correct implementation, because the worktree form is a glob with no sibling to match.
 */
async function assertWrapperPairing(dir, config, profile) {
  const written = await writtenWrappers(dir);
  const projectName = config.projectName;
  const worktreeGlob = join(dirname(dir), `${projectName}-*`);
  const allow = profile.permissions.allow;

  for (const name of written) {
    const expected = [
      `Bash(bash ${SCRIPTS_DIR}/${name}:*)`,
      `Bash(bash ${join(dir, SCRIPTS_DIR, name)}:*)`,
      `Bash(bash ${join(worktreeGlob, SCRIPTS_DIR, name)}:*)`,
    ];
    for (const entry of expected) {
      assert.ok(allow.includes(entry), `the profile does not allow-list ${name} as ${entry}`);
    }
    const listed = allow.filter((entry) => entry.endsWith(`/${name}:*)`));
    assert.equal(listed.length, expected.length, `${name} is allow-listed in ${listed.length} forms, not 3`);
  }

  for (const path of scriptPaths(profile, 'allow')) {
    const name = basename(path);
    assert.ok(written.includes(name), `the profile allow-lists ${path}, which init wrote no wrapper for`);
    assert.ok(path.endsWith(`${SCRIPTS_DIR}/${name}`), `${path} does not sit under the configured scriptsDir`);
  }

  return written;
}

test('a first init exits 0 and writes a schema-shaped harness.config.json', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir);

  const config = readJson(join(dir, CONFIG_FILE));
  assert.equal(config.version, 1);
  for (const key of REQUIRED_CONFIG_KEYS) {
    assert.ok(Object.hasOwn(config, key), `the generated config has no ${key}`);
  }
  assert.equal(config.stateDir, STATE_DIR_VALUE);
  assert.ok(
    config.layers.some((layer) => layer.name === 'general'),
    'the generated config has no general layer, so work belonging to no layer has nowhere to go',
  );
  assert.equal(config.commands.typecheck, `bash ${SCRIPTS_DIR}/typecheck.sh`);
  assert.equal(config.commands.test, `bash ${SCRIPTS_DIR}/test.sh`);
  // `build` and `depInstall` are deliberately unwrapped: they are human- or orchestrator-run.
  assert.equal(config.commands.build, 'npm run build');

  // The browser wiring is the one artifact that is absent by default.
  assert.equal(await exists(dir, MCP_FILE), false, `${MCP_FILE} was written with phases.qa off`);

  // A first run creates; nothing is kept, because nothing was there.
  assert.match(stdout, /^Summary: \d+ created, \d+ ensured$/m);
});

test('a first init materialises the always-on state tree, its READMEs and both ledgers', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  for (const name of [...ALWAYS_ON_DIRS, ...LEDGERS, 'README.md']) {
    assert.ok(await exists(dir, `${STATE_DIR}/${name}`), `${STATE_DIR}/${name} was not written`);
  }
  for (const name of [...QA_DIRS, ...PARITY_DIRS, DOCS_DIR]) {
    assert.equal(
      await exists(dir, `${STATE_DIR}/${name}`),
      false,
      `${STATE_DIR}/${name} belongs to a phase that is off and should not have been created`,
    );
  }

  // Every artifact directory carries the contract for what belongs in it — checked over the tree
  // that was written rather than against a second copy of the directory table.
  const children = await readdir(join(dir, STATE_DIR), { withFileTypes: true });
  const directories = children.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  assert.ok(directories.length >= ALWAYS_ON_DIRS.length);
  for (const name of directories) {
    assert.ok(await exists(dir, `${STATE_DIR}/${name}/README.md`), `${STATE_DIR}/${name} has no README.md`);
  }
});

test('a first init writes the context files and the settings wiring with no token left in them', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  for (const path of [CLAUDE_MD, SHARED_STUB, PROFILE_FILE, '.claude/push-notify.env.example', TASK_OFFER_FILE]) {
    assertRendered(dir, path);
  }

  // The one defect this pair can ship that nothing else catches: the always-loaded file's pointer
  // and the generator's path constant drifting apart, leaving the offer aimed at nothing.
  assert.ok(
    text(dir, CLAUDE_MD).includes(TASK_OFFER_FILE),
    `${CLAUDE_MD} does not name ${TASK_OFFER_FILE}, so the offer fence points at a file nothing writes`,
  );

  // Not an unfilled conventions skeleton: no marker-driven reader may mistake it for one.
  const offer = text(dir, TASK_OFFER_FILE);
  for (const marker of ['<!-- harness:unfilled -->', '**What belongs here**']) {
    assert.ok(!offer.includes(marker), `${TASK_OFFER_FILE} carries the unfilled-skeleton marker ${marker}`);
  }

  const plugin = readJson(join(WORKSPACE_ROOT, 'plugin', '.claude-plugin', 'plugin.json'));
  const marketplace = readJson(join(WORKSPACE_ROOT, '.claude-plugin', 'marketplace.json'));
  const settings = readJson(join(dir, SETTINGS_FILE));
  assert.deepEqual(settings.enabledPlugins, { [`${plugin.name}@${marketplace.name}`]: true });

  // The skill the offer's answer-1 path invokes is `<plugin>:branch-prompt`, so the plugin half is
  // asserted against the manifest rather than a literal — the same drift check the key above gets.
  assert.ok(
    offer.includes(`${plugin.name}:branch-prompt`),
    `${TASK_OFFER_FILE} does not name the skill \`${plugin.name}:branch-prompt\`, so the offer sends its reader at a plugin slug that is not the one shipped`,
  );
});

test('a first init writes the pre-push guard, executable and rendered', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const hook = `${GITHOOKS_DIR}/pre-push`;
  assertRendered(dir, hook);
  const mode = (await stat(join(dir, hook))).mode & 0o111;
  assert.notEqual(mode, 0, `${hook} is not executable, so git would never run it`);
});

/**
 * The note the guard prints on a re-run, checked against the hook that is actually on disk.
 *
 * `create-if-absent` is the hook's re-run contract, so a second `init` keeps whatever is there —
 * while the note is built from the **config in effect**. The two disagree the moment
 * `protectedBranches` is edited, and the note is the half that can be wrong about a security guard,
 * on a run that reports success. So the sentence may not assert that the kept hook protects the
 * branch only the config gained, and the remedy it names has to be one that reaches the hook:
 * `init --force` re-renders it from the config in effect — config is read-if-present on every run,
 * so `--force` upgrades the other generated files to overwrite-after-`.bak` while leaving the file
 * the edit lives in alone — and deleting the hook and re-running `init` is the same remedy without
 * `--force`. The note may carry no claim that `--force` rebuilds `harness.config.json`; that is
 * `--reset-config`'s behaviour, and naming it here would send the edit back to the path that
 * discards it.
 *
 * Nothing here changes behaviour — the disagreement is inherent in a kept artifact rendered from
 * configuration. This pins what the run says about it.
 */
test('a re-run says the kept pre-push hook carries the set it was written with, and sends the edit somewhere that reaches it', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const hook = `${GITHOOKS_DIR}/pre-push`;
  const written = text(dir, hook);

  // The edit an adopter makes, in the file the note names.
  const config = readJson(join(dir, CONFIG_FILE));
  config.protectedBranches = [...config.protectedBranches, ADDED_BRANCH];
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const { stdout } = await initOk(dir);

  // The premise, both halves: the config in effect carries the added branch, and the hook does not,
  // because a re-run kept it byte for byte.
  assert.ok(readJson(join(dir, CONFIG_FILE)).protectedBranches.includes(ADDED_BRANCH));
  assert.equal(text(dir, hook), written, 'a plain re-run re-rendered a hook it was meant to keep');
  assert.equal(
    enforcedBranches(written).includes(ADDED_BRANCH),
    false,
    `${hook} already enforces ${ADDED_BRANCH}, so this fixture cannot show the disagreement`,
  );

  const note = stdout.split('\n').find((line) => line.includes(hook) && line.includes('whoever invokes git'));
  assert.ok(note, `the run printed no note about ${hook}:\n${stdout}`);

  // (a) It does not leave the branch list standing as a claim about the file on disk.
  assert.ok(
    note.includes('kept exactly as it is and still carries the set it was written with'),
    `the note names ${ADDED_BRANCH} without saying the kept hook was not re-rendered from the config:\n${note}`,
  );
  // (b) Both remedies it names reach the hook: init --force, and the delete-and-re-run alternative.
  assert.ok(
    /init --force/.test(note) && note.includes(`delete ${hook} and re-run init`),
    `the note names no sequence that gets the edited set into ${hook}:\n${note}`,
  );
  // (c) And it carries no claim that --force rebuilds the file the edit lives in — that is
  // --reset-config's behaviour, and naming it here would send the edit back to the path that
  // discards it.
  assert.ok(
    !note.includes(`rebuilds ${CONFIG_FILE}`),
    `the note still says --force rebuilds ${CONFIG_FILE}, which it no longer does:\n${note}`,
  );
});

/** The pair that reads a written hook back: the set its `case` label carries, and whether it drifted. */
const { readProtectedCaseLabel, caseLabelMatches } = await loadCompiled('generators/githooks.js');

/**
 * The hook reader's round trip, and it is one only because every label below was rendered by `init`
 * in this test rather than typed out as a fixture string — the same reason `wrapperCommandLine`'s
 * case gives: a parse graded against a hand-written hook passes whatever the writer renders.
 *
 * `enforcedBranches` above stays this file's own independent reader for every other assertion, by
 * choice 3 in the module header. What is asserted here is narrower and is the property the two
 * consumers of the export rest on: on a hook a real run wrote, the exported reader answers with the
 * set the run reported, and it says `undefined` — never the empty set — about a hook it cannot read.
 */
test('the case label init rendered into the pre-push guard is the set the exported reader gets back out', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const hook = `${GITHOOKS_DIR}/pre-push`;
  const config = readJson(join(dir, CONFIG_FILE));

  // (a) A first run's label: protectedBranches unioned with defaultBranch, which here is one branch.
  const single = readProtectedCaseLabel(text(dir, hook));
  assert.deepEqual(single, [config.defaultBranch]);
  assert.deepEqual(single, enforcedBranches(text(dir, hook)));

  // (b) Two entries, from an edited config and the --force that re-renders the hook from it.
  editConfig(dir, (edited) => {
    edited.protectedBranches = [config.defaultBranch, ADDED_BRANCH];
  });
  await initOk(dir, ['--force']);
  const pair = readProtectedCaseLabel(text(dir, hook));
  assert.deepEqual(pair, [config.defaultBranch, ADDED_BRANCH]);

  // (c) A glob entry survives the round trip character for character: it is what the writer admits
  // deliberately, so a reader that unescaped anything would hand back a pattern git never matched.
  editConfig(dir, (edited) => {
    edited.protectedBranches = [config.defaultBranch, GLOB_BRANCH];
  });
  await initOk(dir, ['--force']);
  const glob = readProtectedCaseLabel(text(dir, hook));
  assert.deepEqual(glob, [config.defaultBranch, GLOB_BRANCH]);

  // (d) A hook rewritten past the shape is unreadable, and is not reported as protecting nothing.
  const mangled = text(dir, hook)
    .split('\n')
    .filter((line) => !line.includes('case "$target" in'))
    .join('\n');
  assert.equal(readProtectedCaseLabel(mangled), undefined);

  // (e) The comparison both consumers share, over a label a run actually rendered: a reordered copy
  // is the same alternation, and one missing an entry is drift in either direction.
  assert.ok(caseLabelMatches([...glob].reverse(), glob), 'a reordered copy of a real label is reported as drift');
  assert.equal(caseLabelMatches(glob.slice(1), glob), false);
  assert.equal(caseLabelMatches(glob, glob.slice(1)), false);
});

test('the wrappers init wrote and the profile that allow-lists them agree in both directions', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const config = readJson(join(dir, CONFIG_FILE));
  const profile = readJson(join(dir, PROFILE_FILE));
  const written = await assertWrapperPairing(dir, config, profile);

  // The two verifiers always, and the dev server because this fixture's manifest resolves one.
  assert.deepEqual(written, ['start-dev-server.sh', 'test.sh', 'typecheck.sh']);
  for (const name of written) {
    assertRendered(dir, `${SCRIPTS_DIR}/${name}`);
    const mode = (await stat(join(dir, SCRIPTS_DIR, name))).mode & 0o111;
    assert.notEqual(mode, 0, `${SCRIPTS_DIR}/${name} is not executable`);
  }

  // The literal `commands.typecheck` holds is itself an allow entry — the property the three
  // spellings exist to guarantee, checked on the string rather than on its parts.
  assert.ok(
    profile.permissions.allow.some((entry) => entry.includes(config.commands.typecheck)),
    'commands.typecheck does not appear verbatim in any allow entry',
  );

  // No deploy command was configured, so the profile's deploy rows expand to nothing at all.
  assert.deepEqual(scriptPaths(profile, 'ask'), []);
});

test('a command init could not detect gets no wrapper, and therefore no allow entry', async (t) => {
  const dir = await fixtureFor(t, { files: { 'README.md': '# fixture\n' } });

  const { stderr } = await initOk(dir);

  const config = readJson(join(dir, CONFIG_FILE));
  assert.match(config.commands.typecheck, /configure this/);
  assert.deepEqual(await writtenWrappers(dir), []);

  const profile = readJson(join(dir, PROFILE_FILE));
  assert.deepEqual(scriptPaths(profile, 'allow'), []);
  await assertWrapperPairing(dir, config, profile);
  assert.match(stderr, /commands\.typecheck could not be detected/);
});

/**
 * The report an adopter reads at adoption time to learn what an unattended run will execute: one row
 * per command key in effect, with the line behind it.
 *
 * Asserted against the config and the wrapper files this same run wrote rather than against detected
 * strings spelled out here — a row that agreed with a literal in this file and disagreed with the
 * wrapper on disk would be the exact defect the step exists to make visible.
 */
test('init reports every command line it put in effect, with the wrapper invocation behind each wrapped key', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir);

  const config = readJson(join(dir, CONFIG_FILE));
  const rows = commandRows(stdout);

  for (const key of ['typecheck', 'test']) {
    const row = rows[`commands.${key}`];
    assert.ok(row !== undefined, `no commands.${key} row:\n${stdout}`);
    // The invocation the key holds, then the raw line the wrapper this run wrote actually carries.
    assert.ok(row.includes(config.commands[key]), `the commands.${key} row omits its invocation: ${row}`);
    assert.ok(
      text(dir, `${SCRIPTS_DIR}/${key === 'typecheck' ? 'typecheck.sh' : 'test.sh'}`).includes(
        row.slice(row.lastIndexOf('-> ') + 3, row.lastIndexOf(` — ${RESOLVED_PROVENANCE}`)),
      ),
      `the commands.${key} row prints a line the wrapper does not carry: ${row}`,
    );
    assert.ok(row.includes(RESOLVED_PROVENANCE), `the commands.${key} row overclaims its provenance: ${row}`);
  }

  // The unwrapped key prints its raw configured value, and says it is not wrapped rather than
  // pointing at a wrapper file that was never written for it.
  const depInstall = rows['commands.depInstall'];
  assert.ok(depInstall !== undefined, `no commands.depInstall row:\n${stdout}`);
  assert.ok(depInstall.includes(config.commands.depInstall), `the depInstall row omits its line: ${depInstall}`);
  assert.ok(depInstall.includes('not wrapped'), `the depInstall row claims a wrapper: ${depInstall}`);

  // No deploy section was configured and this release generates none, so that key prints nothing at
  // all rather than an empty row.
  assert.equal(rows['deploy.command'], undefined, `a row was printed for a key no config carries:\n${stdout}`);

  // Narration: a quiet run has no reader to orient, and the warnings channel is unmoved.
  const quiet = await initOk(await fixtureFor(t, { files: nodeProjectFiles() }), ['--quiet']);
  assert.deepEqual(commandRows(quiet.stdout), {}, `--quiet printed the commands block:\n${quiet.stdout}`);
});

/**
 * The same rows under `--dry-run`, which is the run that has to carry them: it is the preview an
 * adopter reads *before* deciding to wire the repository at all. The block is composed while the plan
 * is being built and touches no file, so the two modes agree row for row on a first adoption —
 * **except** in the write provenance, which a dry run states in the conditional because it writes
 * nothing. Normalising that one clause is what keeps this a row-for-row comparison rather than a
 * comparison of two sentences.
 */
test('--dry-run prints the same commands rows a real init prints, and still writes nothing', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  const before = await snapshotTree(dir);

  const dry = await initOk(dir, ['--dry-run']);

  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
  const dryRows = commandRows(dry.stdout);
  assert.ok(Object.keys(dryRows).length > 0, `--dry-run printed no commands block:\n${dry.stdout}`);
  assert.ok(
    dryRows['commands.typecheck'].includes(WOULD_WRITE_PROVENANCE),
    `the dry-run row claims a write it did not make: ${dryRows['commands.typecheck']}`,
  );

  const real = await initOk(dir);
  const realRows = commandRows(real.stdout);
  const asReal = Object.fromEntries(
    Object.entries(dryRows).map(([key, row]) => [key, row.replace(WOULD_WRITE_PROVENANCE, WRITE_PROVENANCE)]),
  );
  assert.deepEqual(asReal, realRows, 'the preview and the real run disagree about the commands');
});

/**
 * The kept-wrapper arm: what the row says over a wrapper that was **already on disk**.
 *
 * Wrappers are `create-if-absent`, so a re-run discards the body it resolved and the file keeps
 * running the adopter's own line. A row naming the resolved line there would print a command nothing
 * executes — the blindness the whole `commands` step exists to remove, one re-run later. The edited
 * line is written by this test rather than detected, because it is the one string that must not be
 * derivable from anything `init` resolves.
 */
test('a re-run over an edited wrapper reports the line that file carries, and --force reports the line it writes', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  // Loaded here rather than through the module-level binding of the same name, for the reason the
  // `writeWrapperScripts` test below gives: that binding is declared past several top-level `await`s,
  // which a queued test can run ahead of.
  const { wrapperCommandLine } = await loadCompiled('generators/scripts.js');
  const wrapperPath = `${SCRIPTS_DIR}/typecheck.sh`;
  const resolved = wrapperCommandLine(text(dir, wrapperPath)).command;
  // Not a superstring of the detected line, so `indexOf` below distinguishes the two rather than
  // finding one inside the other.
  const edited = 'tsc --noEmit';
  writeFileSync(join(dir, wrapperPath), text(dir, wrapperPath).replace(`${resolved} "$@"`, `${edited} "$@"`), 'utf8');

  // (a) The kept line leads, because it is the one that runs; the resolved line is named after it,
  // with the flag that would replace the file with it.
  const kept = commandRows((await initOk(dir)).stdout)['commands.typecheck'];
  assert.ok(kept.includes(edited), `the re-run row omits the line the wrapper carries: ${kept}`);
  assert.ok(kept.includes(KEPT_PROVENANCE), `the re-run row does not say the file already carries it: ${kept}`);
  assert.ok(!kept.includes(RESOLVED_PROVENANCE), `the re-run row claims this run's resolution: ${kept}`);
  assert.ok(kept.indexOf(edited) < kept.indexOf(resolved), `the row leads with the line nothing runs: ${kept}`);
  assert.ok(kept.includes('--force'), `the row names no route to the resolved line: ${kept}`);
  assert.equal(wrapperCommandLine(text(dir, wrapperPath)).command, edited, 'the re-run rewrote the edited wrapper');

  // (b) The preview over that same kept wrapper: the identical row, and nothing written.
  const before = await snapshotTree(dir);
  const dry = await initOk(dir, ['--dry-run']);
  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
  assert.equal(commandRows(dry.stdout)['commands.typecheck'], kept, `the preview disagrees:\n${dry.stdout}`);

  // (c) `--force` replaces the file after a `.bak`, so the row is this run's resolution again.
  const forced = commandRows((await initOk(dir, ['--force'])).stdout)['commands.typecheck'];
  assert.ok(forced.includes(RESOLVED_PROVENANCE), `the --force row does not name its resolution: ${forced}`);
  assert.ok(forced.includes(WRITE_PROVENANCE), `the --force row does not say it writes the line: ${forced}`);
  assert.ok(!forced.includes(edited), `the --force row still reports the replaced line: ${forced}`);
  assert.equal(wrapperCommandLine(text(dir, wrapperPath)).command, resolved, '--force did not replace the wrapper');
});

/**
 * The raw-line arm over a wrapper already on disk — the `wrappedKeyMismatch` state, reached by an
 * adopter who edits `commands.typecheck` to a real command line after a first `init` and re-runs.
 *
 * `resolveBody` returns that raw line as the wrapper body, but `writeWrapperScripts` enqueues it
 * `create-if-absent` and the file is already there, so nothing is written and the wrapper goes on
 * running its own line. The row therefore may not say this run inlined anything: it leads with the
 * line the file carries and names `--force` as what replaces it, the same rule the wrapped arms follow.
 */
test('a raw command line over a wrapper already on disk reports the line that file carries', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const { wrapperCommandLine } = await loadCompiled('generators/scripts.js');
  const wrapperPath = `${SCRIPTS_DIR}/typecheck.sh`;
  const onDisk = wrapperCommandLine(text(dir, wrapperPath)).command;

  // Not a superstring of the detected line, so the assertions below distinguish the two.
  const raw = 'tsc --noEmit';
  const config = readJson(join(dir, CONFIG_FILE));
  config.commands.typecheck = raw;
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const row = commandRows((await initOk(dir)).stdout)['commands.typecheck'];
  assert.ok(row.includes(raw), `the row omits the raw line the key holds: ${row}`);
  assert.ok(row.includes(onDisk), `the row omits the line the wrapper carries: ${row}`);
  assert.ok(row.includes('already on disk'), `the row does not say the wrapper was kept: ${row}`);
  assert.ok(!row.includes('inlined'), `the row claims a write create-if-absent did not make: ${row}`);
  assert.ok(row.includes('--force'), `the row names no route to the raw line: ${row}`);
  assert.equal(wrapperCommandLine(text(dir, wrapperPath)).command, onDisk, 'the re-run rewrote the kept wrapper');

  // The preview over the same repository: byte-identical, and nothing written.
  const before = await snapshotTree(dir);
  const dry = await initOk(dir, ['--dry-run']);
  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
  assert.equal(commandRows(dry.stdout)['commands.typecheck'], row, `the preview disagrees:\n${dry.stdout}`);
});

/**
 * The third arm: a wrapper whose body the rule cannot read — an adopter's edit that forwards nothing.
 * `init` reports, and never guesses and never refuses over an adopter's own file.
 */
test('a wrapper whose body cannot be read is reported as unreadable rather than guessed at', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const wrapperPath = `${SCRIPTS_DIR}/typecheck.sh`;
  const { wrapperCommandLine } = await loadCompiled('generators/scripts.js');
  const resolved = wrapperCommandLine(text(dir, wrapperPath)).command;
  writeFileSync(join(dir, wrapperPath), text(dir, wrapperPath).replace(`${resolved} "$@"`, resolved), 'utf8');
  assert.deepEqual(wrapperCommandLine(text(dir, wrapperPath)), { kind: 'unrecognised' });

  const row = commandRows((await initOk(dir)).stdout)['commands.typecheck'];
  assert.ok(row.includes(UNREADABLE_PROVENANCE), `the row does not report the unreadable wrapper: ${row}`);
  assert.ok(row.includes(RESOLVED_PROVENANCE), `the row does not say whose line it printed: ${row}`);
  assert.ok(!row.includes(KEPT_PROVENANCE), `the row claims the file carries a line it could not read: ${row}`);
});

/**
 * A repository whose commands could not be detected: the placeholder is what the config holds, so the
 * placeholder is what the row prints. The assertion that matters is the negative one — a row that
 * filled the gap with a plausible command would send an adopter away believing a command was wired.
 */
test('a key still holding the placeholder prints the placeholder and no invented command', async (t) => {
  const dir = await fixtureFor(t, { files: { 'README.md': '# fixture\n' } });

  const { stdout } = await initOk(dir);

  const config = readJson(join(dir, CONFIG_FILE));
  const rows = commandRows(stdout);
  for (const key of ['typecheck', 'test']) {
    const row = rows[`commands.${key}`];
    assert.ok(row !== undefined, `no commands.${key} row:\n${stdout}`);
    assert.ok(row.includes(config.commands[key]), `the commands.${key} row omits the placeholder: ${row}`);
    assert.match(row, /configure this/);
    assert.ok(row.includes('no wrapper was written for it'), `the commands.${key} row claims a wrapper: ${row}`);
    // Nothing was written for it, so no row may name a wrapper invocation or a second command line.
    assert.ok(!row.includes(`bash ${SCRIPTS_DIR}/`), `the commands.${key} row invented a command: ${row}`);
  }
  assert.deepEqual(await writtenWrappers(dir), []);
});

/**
 * `scriptsDir: "."` is a supported value, and the unresolved deploy body is the one wrapper body
 * that quotes its own file name — at the repository root that name is the wrapper's whole path. The
 * recursion assertion has to read it as a body that runs nothing, or `init` refuses the very case
 * the generator writes a failing wrapper and a warning for.
 */
test('an unresolvable deploy command at the repository root gets the failing wrapper, not a recursion refusal', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  // The config an adopter who keeps the wrappers at the root would hold: the directory moved, and
  // every wrapper invocation in `commands.*` moved with it.
  const config = readJson(join(dir, CONFIG_FILE));
  config.scriptsDir = '.';
  for (const [key, value] of Object.entries(config.commands)) {
    config.commands[key] = value.replace(`bash ${SCRIPTS_DIR}/`, 'bash ');
  }
  config.deploy = { command: 'bash deploy.sh' };
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const { stderr } = await initOk(dir);

  assertRendered(dir, 'deploy.sh');
  assert.match(text(dir, 'deploy.sh'), /harness_fail "harness: put the deploy command line in deploy\.sh"/);
  assert.match(stderr, /deploy\.sh was written as a wrapper that fails with a message/);
  assert.doesNotMatch(stderr, /recurse forever/);
});

/**
 * The other half of the same assertion: it has to ask whether the resolved body *runs* this
 * wrapper, not whether it contains its path as text. At `scriptsDir: "."` a wrapper's path is its
 * bare file name, so an adopter whose command line runs a different `scripts/typecheck.sh`
 * contains that name while recursing into nothing.
 */
test('a command line that merely names the wrapper file is written into it, not refused', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  // The wrappers move to the repository root; the command line they run stays under scripts/.
  const config = readJson(join(dir, CONFIG_FILE));
  config.scriptsDir = '.';
  config.commands.typecheck = `bash ${SCRIPTS_DIR}/typecheck.sh`;
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const { stderr } = await initOk(dir);

  assertRendered(dir, 'typecheck.sh');
  assert.match(text(dir, 'typecheck.sh'), new RegExp(`bash ${SCRIPTS_DIR}/typecheck\\.sh`));
  assert.doesNotMatch(stderr, /recurse forever/);
});

/** The pair that reads a written wrapper back: which file a key invokes, and the line inside it. */
const { configuredWrapperFile, wrapperCommandLine, writeWrapperScripts } = await loadCompiled('generators/scripts.js');

/**
 * The reader's round trip — and it is one only because every wrapper below was written by `init` in
 * this test rather than typed out as a fixture string: a parse graded against a hand-written wrapper
 * passes whatever the writer does, which is the failure `unitEnvValue`'s own doc names for this shape
 * of parse. Three bodies, each the state a real run produces: a resolved command line, the failing
 * body written when nothing resolved, and a wrapper an adopter edited past recognition.
 *
 * (a)'s third row is the shape that justifies truncating at `"$@"` rather than matching a whole line:
 * of the four `{{command}}` templates, `start-dev-server.sh` is the only one that renders anything
 * after the arguments (`{{command}} "$@" >"$log_file" 2>&1 &`), so it is the only row that tells the
 * two rules apart. Do not prune it as a third copy of the first two.
 *
 * The byte-equality half is asserted alongside, because it is what keeps the pair off the path
 * `invokedPath` forbids: a key holding a raw command line answers with no wrapper file at all rather
 * than with a path parsed out of that line.
 */
test('the raw command line init wrote into a wrapper is the one a reader gets back out', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  const config = readJson(join(dir, CONFIG_FILE));

  // (a) From the key, to the file it invokes, to the raw line detection put inside it.
  for (const [key, file, command] of [
    ['typecheck', 'typecheck.sh', 'npm run typecheck'],
    ['test', 'test.sh', 'npm test'],
    ['devServer', 'start-dev-server.sh', 'npm run dev'],
  ]) {
    const wrapper = configuredWrapperFile(config, key);
    assert.deepEqual(wrapper, { file, path: `${SCRIPTS_DIR}/${file}` });
    assert.deepEqual(wrapperCommandLine(text(dir, wrapper.path)), { kind: 'command', command });
  }

  // (b) The failing wrapper, from the fixture that produces it: `scriptsDir` at the repository root
  // and a `deploy.command` no detection ever supplies. It runs no command, and the reader says that
  // rather than reporting `harness_fail` as the binary the run needs.
  const root = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(root);
  const rootConfig = readJson(join(root, CONFIG_FILE));
  rootConfig.scriptsDir = '.';
  for (const [key, value] of Object.entries(rootConfig.commands)) {
    rootConfig.commands[key] = value.replace(`bash ${SCRIPTS_DIR}/`, 'bash ');
  }
  rootConfig.deploy = { command: 'bash deploy.sh' };
  writeFileSync(join(root, CONFIG_FILE), `${JSON.stringify(rootConfig, null, 2)}\n`, 'utf8');
  await initOk(root);

  assert.deepEqual(configuredWrapperFile(rootConfig, 'deploy'), { file: 'deploy.sh', path: 'deploy.sh' });
  assert.deepEqual(wrapperCommandLine(text(root, 'deploy.sh')), { kind: 'unresolved' });

  // (c) An adopter's edit that forwards nothing: reported, not guessed at.
  const edited = text(dir, `${SCRIPTS_DIR}/typecheck.sh`).replace(
    'npm run typecheck "$@"',
    'npm run typecheck\nnpm run lint\n',
  );
  writeFileSync(join(dir, SCRIPTS_DIR, 'typecheck.sh'), edited, 'utf8');
  assert.deepEqual(wrapperCommandLine(text(dir, `${SCRIPTS_DIR}/typecheck.sh`)), { kind: 'unrecognised' });

  // The byte-equality half: a raw line in the key is not the wrapper invocation, so it names no file.
  const raw = { ...config, commands: { ...config.commands, typecheck: 'npm run typecheck' } };
  assert.equal(configuredWrapperFile(raw, 'typecheck'), undefined);
});

/**
 * The pre-start step, in the three states that decide it — and driven through `init` rather than
 * against a rendered string, for the reason the round trip above gives: the subject is what the
 * generator asks `devServerPrestart` and where it puts the answer, and a hand-written wrapper would
 * pass whatever the generator does.
 *
 * The last assertion in each arm is the one that keeps this change off `doctor`: the pre-start line
 * carries no `"$@"`, so `wrapperCommandLine` still reads the **launch** line back as the command.
 */
test('the dev-server wrapper builds before it launches, and only where the derived line needs it', async (t) => {
  const manifest = (scripts) => ({ name: 'fixture-project', private: true, version: '0.0.0', scripts });
  const arms = [
    // A pre-compiled dev server with a build to run: the one arm that gets a step.
    {
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', start: 'echo start' },
      command: 'npm run start',
      prestart: 'npm run build',
    },
    // Watch mode: it compiles as it serves, so a build in front of it would be pure cost.
    {
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
      command: 'npm run dev',
      prestart: ':',
    },
    // Pre-compiled and nothing to build with: reported by detection's note, not covered here.
    {
      scripts: { typecheck: 'echo typecheck', test: 'echo test', start: 'echo start' },
      command: 'npm run start',
      prestart: ':',
    },
  ];

  for (const { scripts, command, prestart } of arms) {
    const dir = await fixtureFor(t, { files: { ...nodeProjectFiles(), 'package.json': manifest(scripts) } });
    await initOk(dir);

    const wrapper = text(dir, `${SCRIPTS_DIR}/start-dev-server.sh`);
    const lines = wrapper.split('\n');
    const prestartAt = lines.indexOf(
      `${prestart} || harness_fail "devServer: the pre-start step failed, so the server was not launched"`,
    );
    const launchAt = lines.findIndex((line) => line.startsWith(`${command} "$@"`));

    assert.ok(prestartAt !== -1, `no \`${prestart}\` pre-start line for ${command} in:\n${wrapper}`);
    assert.ok(launchAt > prestartAt, `the pre-start line does not precede the launch line in:\n${wrapper}`);
    assert.deepEqual(wrapperCommandLine(wrapper), { kind: 'command', command });
  }
});

/**
 * The generator's other return: what each wrapper *was written with*, for a caller that reports the
 * chosen command lines rather than reading them back off disk.
 *
 * It is asserted against the **enqueued body** rather than against the strings this test passed in,
 * so the claim is the round trip — the returned `command` is the line the render actually inlined —
 * and both arms of {@link resolveBody} that reach a written wrapper are covered: a detected raw line,
 * and the unresolved body that runs no command at all. `deploy` is the second arm in the same config:
 * it is selected because `deploy.command` holds its own wrapper's invocation, and no detection ever
 * supplies a deploy line.
 */
test('the command line writeWrapperScripts returns is the one it inlined into the wrapper', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const config = readJson(join(dir, CONFIG_FILE));
  config.deploy = { command: `bash ${SCRIPTS_DIR}/deploy.sh` };

  // Loaded here rather than through the module-level binding of the same name: that one is declared
  // past several top-level `await`s, which a queued test can run ahead of.
  const { WritePlan } = await loadCompiled('core/writer.js');
  const plan = new WritePlan();
  const { written } = writeWrapperScripts({
    repoRoot: dir,
    config,
    rawCommands: { typecheck: 'npm run typecheck', test: 'npm test', devServer: 'npm run dev' },
    plan,
  });

  /** The body this run enqueued for one wrapper — never the file on disk, which a re-run keeps. */
  const enqueuedBody = (file) => {
    const request = plan.requests.find((entry) => entry.path === join(dir, SCRIPTS_DIR, file));
    assert.ok(request !== undefined, `the generator enqueued no write for ${file}`);
    return request.content;
  };

  for (const entry of written) {
    assert.deepEqual(
      wrapperCommandLine(enqueuedBody(entry.file)),
      entry.unresolved ? { kind: 'unresolved' } : { kind: 'command', command: entry.command },
      `${entry.file} was rendered with a line other than the one the result reports`,
    );
  }

  const byKey = Object.fromEntries(written.map((entry) => [entry.key, entry]));
  assert.deepEqual(byKey.typecheck, {
    key: 'typecheck',
    file: 'typecheck.sh',
    invocation: `bash ${SCRIPTS_DIR}/typecheck.sh`,
    command: 'npm run typecheck',
    unresolved: false,
  });
  assert.deepEqual(byKey.deploy, {
    key: 'deploy',
    file: 'deploy.sh',
    invocation: `bash ${SCRIPTS_DIR}/deploy.sh`,
    command: 'harness_fail "harness: put the deploy command line in deploy.sh"',
    unresolved: true,
  });
});

/**
 * The anchor, in the two spellings the permission profile emits for a checkout: the repo-relative
 * one `commands.*` holds, run from the repository root, and the absolute one, run from a
 * subdirectory. Both have to reach the same directory, because the configuration's paths and the
 * command lines in it are all repo-relative and an agent is not always standing at the root.
 */
test('a wrapper runs its command at the repository root and forwards the arguments it was given', async (t) => {
  const dir = await fixtureFor(t, { files: recordingFixtureFiles(), dirs: [NESTED_DIR] });

  await initOk(dir);

  const fromNested = join(dir, 'from-nested.txt');
  const absolute = await runBash(join(dir, NESTED_DIR), [join(dir, SCRIPTS_DIR, 'test.sh'), 'alpha', 'beta'], {
    HARNESS_TEST_RECORD: fromNested,
  });

  assert.equal(absolute.status, 0, `the wrapper exited ${absolute.status}\n${absolute.stdout}\n${absolute.stderr}`);
  assert.match(absolute.stdout, /^PASS: test$/m);
  assert.deepEqual(recorded(fromNested), { cwd: dir, args: 'alpha beta' });

  // The same command from the root, which is what makes the row above about the anchor rather
  // than about a subdirectory that happened to work.
  const fromRoot = join(dir, 'from-root.txt');
  const relative = await runBash(dir, [`${SCRIPTS_DIR}/test.sh`], { HARNESS_TEST_RECORD: fromRoot });

  assert.equal(relative.status, 0, relative.stderr);
  assert.deepEqual(recorded(fromRoot), { cwd: dir, args: '' });
});

test("a wrapper reports its command's failure as one verdict line and exits with its status", async (t) => {
  const dir = await fixtureFor(t, { files: recordingFixtureFiles(), dirs: [NESTED_DIR] });

  await initOk(dir);

  const record = join(dir, 'record.txt');
  const failed = await runBash(dir, [`${SCRIPTS_DIR}/test.sh`], {
    HARNESS_TEST_RECORD: record,
    HARNESS_TEST_EXIT: '3',
  });

  assert.equal(failed.status, 3, `the wrapper exited ${failed.status} rather than with its command's status`);
  assert.match(failed.stdout, /^FAIL: test \(exit 3\)$/m);
  assert.doesNotMatch(failed.stdout, /^PASS: /m);
  // The command was reached: this is its failure being reported, not the wrapper refusing to run it.
  assert.equal(recorded(record).cwd, dir);
});

/**
 * The dev-server wrapper is the one that must **not** wait for its command, and the one whose
 * output a caller has to act on: the QA phase polls the port, checks that the pid it was given is
 * still alive before trusting an answer, and reads the log when the start failed.
 */
test('the dev-server wrapper starts the server detached and prints a live pid and a readable log', async (t) => {
  const dir = await fixtureFor(t, { files: recordingFixtureFiles(), dirs: [NESTED_DIR] });

  await initOk(dir);

  const startedAt = Date.now();
  const result = await runBash(join(dir, NESTED_DIR), [
    join(dir, SCRIPTS_DIR, 'start-dev-server.sh'),
    DEV_SERVER_PORT,
    '--extra',
  ]);
  const elapsed = Date.now() - startedAt;

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.ok(
    elapsed < RETURNS_PROMPTLY_MS,
    `the wrapper took ${elapsed}ms, so it waited for a server that stays up for ${DEV_SERVER_STUB_SECONDS}s`,
  );

  const pid = Number(/^STARTING: devServer \(pid (\d+)\)$/m.exec(result.stdout)?.[1]);
  const logPath = /^LOG: (\S+)$/m.exec(result.stdout)?.[1];
  assert.ok(Number.isInteger(pid), `the wrapper printed no pid:\n${result.stdout}`);
  assert.ok(
    logPath?.endsWith(`harness-dev-server-${DEV_SERVER_PORT}.log`),
    `the wrapper printed no per-port log path:\n${result.stdout}`,
  );
  t.after(() => rm(logPath, { force: true }));
  t.after(() => {
    if (alive(pid)) process.kill(pid);
  });

  assert.ok(alive(pid), 'the pid the wrapper printed is not a running process');

  // The port reached the command through the environment, and everything after it as arguments.
  await eventually(
    () => existsSync(logPath) && readFileSync(logPath, 'utf8').includes('port='),
    `nothing was written to ${logPath}`,
  );
  assert.match(readFileSync(logPath, 'utf8'), new RegExp(`^port=${DEV_SERVER_PORT} args=--extra$`, 'm'));

  // And the pid is the whole of what was started: signalling it leaves no orphan behind.
  process.kill(pid);
  await eventually(() => !alive(pid), 'the process the wrapper printed outlived the signal sent to it');
});

test('--qa writes the browser wiring, and it declares exactly the servers the profile starts', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout, stderr } = await initOk(dir, ['--qa']);

  const mcp = readJson(join(dir, MCP_FILE));
  const profile = readJson(join(dir, PROFILE_FILE));
  assert.deepEqual(
    Object.keys(mcp.mcpServers).sort(),
    [...profile.enabledMcpjsonServers].sort(),
    `${MCP_FILE} and the profile disagree about which browser servers a run has`,
  );
  assert.deepEqual([...profile.enabledMcpjsonServers].sort(), ['chrome-devtools', 'playwright']);

  // The phase's own liveness probe arrives with the same wiring: the step that starts the dev server
  // checks the process it started is still alive before trusting a poll, and no base-profile entry
  // permits that check.
  assert.ok(
    profile.permissions.allow.includes('Bash(ps -p:*)'),
    'the profile written by `init --qa` carries no liveness-probe entry',
  );

  // The phase's own artifact directories and its credentials example come with it.
  for (const name of QA_DIRS) {
    assert.ok(await exists(dir, `${STATE_DIR}/${name}`), `${STATE_DIR}/${name} was not written with --qa`);
  }
  assertRendered(dir, '.claude/qa-accounts.env.example');

  // The driver the phase would run is written out rather than left to the default, so the choice
  // sits in the config an adopter commits and reviews.
  assert.equal(readJson(join(dir, CONFIG_FILE)).qa.driver, QA_DRIVER_VALUE);

  // And it is named in the notes block on stdout, not in the warnings on stderr: nothing about it
  // is unresolved, and a warning raised by every correct run is how a warning list stops being read.
  const driverLine = /qa\.driver was written as/;
  assert.match(stdout, driverLine, `the qa.driver note did not reach the notes block:\n${stdout}`);
  assert.doesNotMatch(stderr, driverLine, `a correct qa.driver was reported as a warning:\n${stderr}`);

  // And the section still arrives only with the phase: writing it unconditionally would put a
  // driver into a config whose interactive test phase never runs.
  const withoutQa = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(withoutQa);
  assert.equal(
    Object.hasOwn(readJson(join(withoutQa, CONFIG_FILE)), 'qa'),
    false,
    'a config generated without --qa carries a qa section',
  );
});

/**
 * The other branch of the same decision: the phase is on, and its driver reaches the application
 * through a device runner rather than a browser.
 *
 * The wiring is withheld for a reason stronger than the saving above — the mobile variants of the
 * interactive test agent ship declared-not-implemented with built-ins-only tool allowlists, so a
 * declared server is one nothing can start. The profile's half is withheld in the same run
 * (`profile.test.mjs` asserts that side); what this asserts is that the phase's *other* artifacts
 * still arrive, because the gate is on the browser wiring alone and a mobile adopter who lost the
 * scenario skeleton or the credentials example would have lost the phase itself.
 *
 * Two lines are owed for a mobile driver and they say different things: the generator's note
 * explaining the withheld wiring, and the resolver's warning that the variant this run selected is
 * declared-not-implemented — asserted here with **both** its negative halves, since a marking that
 * fired on every run would be no marking at all: the implemented driver arms the phase in silence,
 * and so does a re-run whose generated config is discarded for the one already on disk.
 */
test('a mobile driver turns the phase on and still writes no browser wiring', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout, stderr } = await initOk(dir, ['--qa', '--qa-driver', QA_DRIVER_CHOSEN]);

  assert.equal(
    await exists(dir, MCP_FILE),
    false,
    `${MCP_FILE} was written for a driver that reaches the application through a device runner`,
  );

  // The phase is genuinely on in the config, so the omission is the driver's doing and not a phase
  // that failed to turn on — which is the reading that would send an adopter looking in the wrong
  // place for the missing file.
  const config = readJson(join(dir, CONFIG_FILE));
  assert.equal(config.phases.qa, true);
  assert.equal(config.qa.driver, QA_DRIVER_CHOSEN);

  // And the run says which of the two conditions was the one that failed: an absent file with no
  // note reads as a gap in the generator.
  assert.match(
    stdout,
    new RegExp(`no ${MCP_FILE.replaceAll('.', '\\.')} was written`),
    `nothing on stdout says the browser wiring was left out:\n${stdout}`,
  );
  assert.match(
    stdout,
    new RegExp(`qa\\.driver is ${QA_DRIVER_CHOSEN}`),
    `the note does not name the driver that decided it:\n${stdout}`,
  );

  // The second line, and a different statement from the one above: that note explains the withheld
  // wiring, this says what the value itself costs at dispatch time. It is a warning rather than a
  // note because it survives `--quiet`, so it has to arrive on stderr and name both the driver and
  // its release status — the fact three documents state for a reader who has already chosen.
  assert.match(
    stderr,
    new RegExp(QA_DRIVER_CHOSEN),
    `no warning names the driver whose variant is not implemented:\n${stderr}`,
  );
  assert.match(
    stderr,
    /declared but not implemented/,
    `the warning does not say the resolved driver's variant is not implemented:\n${stderr}`,
  );

  // The rest of the phase is untouched: every other QA artifact is written for every driver.
  for (const name of QA_DIRS) {
    assert.ok(await exists(dir, `${STATE_DIR}/${name}`), `${STATE_DIR}/${name} was not written for a mobile driver`);
  }
  assertRendered(dir, '.claude/qa-accounts.env.example');
  assert.match(text(dir, QA_SCENARIOS_FILE), QA_SCENARIOS_HEADING);

  // The negative half, without which a warning printed on every `--qa` run would pass the two
  // assertions above: the driver this release does implement arms the phase in silence.
  const browser = await fixtureFor(t, { files: nodeProjectFiles() });
  const plain = await initOk(browser, ['--qa']);
  assert.equal(readJson(join(browser, CONFIG_FILE)).qa.driver, QA_DRIVER_VALUE);
  assert.doesNotMatch(
    plain.stderr,
    /not implemented/,
    `the implemented default driver was reported as not implemented:\n${plain.stderr}`,
  );

  // The other negative half, and the one the warning's own text depends on: a re-run keeps the
  // config that is already there, so the driver this run *resolved* is not the driver the repository
  // carries — and "every interactive-test dispatch returns a blocker" is a claim about a repository,
  // not about a discarded object. It stays quiet, three lines from the note saying the file was left
  // alone; `doctor`'s browser-wiring check is what reports a kept config's driver.
  const rerun = await initOk(dir, ['--qa', '--qa-driver', QA_DRIVER_CHOSEN]);
  assert.match(
    rerun.stdout,
    /already exists and was left exactly as it is/,
    `the re-run rebuilt the config instead of keeping it, so this arm proves nothing:\n${rerun.stdout}`,
  );
  assert.doesNotMatch(
    rerun.stderr,
    /declared but not implemented/,
    `a run whose generated config was discarded still warned about the driver it resolved:\n${rerun.stderr}`,
  );
});

/**
 * The remedy the note above prints, driven end to end — because an adopter who follows it and lands
 * in a half-wired repository is the failure the note exists to prevent, and the two artifacts it
 * moves have **different** re-run policies: `.mcp.json` is merged into, the permission profile is
 * create-if-absent and kept.
 *
 * So both states are asserted. The plain re-run is the note's premise: `.mcp.json` gains the servers
 * and the kept profile starts none of them, which is the un-loaded-tool stall rather than a failure.
 * The bare `--force` re-run is the note's promise, and it carries no flags because it needs none —
 * `init` reads the config on every run and `--force` never overwrites it, so the `qa.driver` living
 * only in the edited file is what the regenerated profile is wired from. The last assertion on that
 * value is the direct pin: the file carried the switch, not the command line.
 */
test("the mobile note's remedy wires both halves, where a plain re-run wires only one", async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  const { stdout } = await initOk(dir, ['--qa', '--qa-driver', QA_DRIVER_CHOSEN]);

  // The note carries both steps of the remedy, so it is complete without the documentation beside
  // it: the value change lands in the file, and the re-run that regenerates the profile from it
  // carries no flags — a note still naming them would be describing the pre-flip contract.
  assert.match(
    stdout,
    new RegExp(`config set qa\\.driver ${QA_DRIVER_VALUE}`),
    `the note does not name the edit that performs the switch:\n${stdout}`,
  );
  assert.match(stdout, /`init --force`/, `the note does not name the re-run that wires the profile:\n${stdout}`);
  assert.doesNotMatch(
    stdout,
    /init --force --qa/,
    `the note still routes the switch through flags --force no longer rebuilds the config from:\n${stdout}`,
  );

  // The switch, made the way an adopter makes it: in the file.
  const config = readJson(join(dir, CONFIG_FILE));
  config.qa.driver = QA_DRIVER_VALUE;
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  await initOk(dir);

  // One half arrived, because `.mcp.json` is merged into whatever is there.
  assert.deepEqual(Object.keys(readJson(join(dir, MCP_FILE)).mcpServers).sort(), ['chrome-devtools', 'playwright']);
  // The other did not, because the profile already existed: it starts none of the servers now
  // declared, and grants no tool of theirs. This is the state the note warns about, pinned so a
  // future policy change to the profile has to come past this assertion.
  const kept = readJson(join(dir, PROFILE_FILE));
  assert.equal(
    Object.hasOwn(kept, 'enabledMcpjsonServers'),
    false,
    `a plain re-run merged the interactive-test fragment into a profile it was meant to keep`,
  );
  assert.deepEqual(
    (kept.permissions.allow ?? []).filter((entry) => entry.startsWith('mcp__')),
    [],
    'the kept profile grants a browser tool of a server it never starts',
  );

  await initOk(dir, ['--force']);

  const wired = readJson(join(dir, PROFILE_FILE));
  assert.deepEqual([...wired.enabledMcpjsonServers].sort(), ['chrome-devtools', 'playwright']);
  assert.ok(
    (wired.permissions.allow ?? []).some((entry) => entry.startsWith('mcp__')),
    'the regenerated profile starts the browser servers and allow-lists no tool of them',
  );
  assert.deepEqual(
    Object.keys(readJson(join(dir, MCP_FILE)).mcpServers).sort(),
    [...wired.enabledMcpjsonServers].sort(),
    `${MCP_FILE} and the profile still disagree about which browser servers a run has`,
  );
  // The file carried the switch, with no flag on the command line to carry it: the run that
  // regenerated the profile read the edited value and left it exactly as it was. And the previous
  // profile is recoverable — the cost the note states.
  assert.equal(readJson(join(dir, CONFIG_FILE)).qa.driver, QA_DRIVER_VALUE);
  assert.ok(await exists(dir, `${PROFILE_FILE}.bak`), 'the regenerated profile left no .bak behind');
});

/** The docs-retrieval server `.mcp.json` declares when retrieval is on, spelled as the contract. */
const DOCS_SERVER = 'harness-docs';
const DOCS_SERVER_ENTRY = { type: 'stdio', command: 'bash', args: ['scripts/docs-search-server.sh'], env: {} };
const DOCS_INDEX_RULE = `${STATE_DIR}/docs_index/`;

/**
 * A fixture holding a pre-written config with the docs phase on, `docs.retrieval` set by `retrieval`
 * and the interactive-test phase on with `qaDriver` when one is given — plus the retrieval
 * environment every retrieval-on `init` runs under: the stub models and a planted runtime in a
 * throwaway cache, so no case installs or downloads anything.
 */
async function retrievalFixture(t, { retrieval, qaDriver } = {}) {
  const config = {
    version: 1,
    projectName: 'fixture-project',
    defaultBranch: 'main',
    stateDir: STATE_DIR,
    layers: [{ name: 'general', path: '.', conventions: SHARED_STUB }],
    commands: { typecheck: 'echo typecheck', test: 'echo test' },
    phases: { docs: true, ...(qaDriver === undefined ? {} : { qa: true }) },
    docs: { root: 'docs', ...(retrieval ? { retrieval: true } : {}) },
    ...(qaDriver === undefined ? {} : { qa: { driver: qaDriver } }),
  };
  const dir = await fixtureFor(t, {
    files: { ...nodeProjectFiles(), [CONFIG_FILE]: config, 'docs/README.md': '# docs\n' },
  });
  const cacheHome = await mkdtemp(join(tmpdir(), 'harness-retrieval-cache-'));
  t.after(() => rm(cacheHome, { recursive: true, force: true }));
  await plantModelFiles(cacheHome);
  await plantRetrievalRuntime(cacheHome);
  return { dir, env: retrievalEnv(cacheHome) };
}

/** The managed ignore block's lines, trimmed. */
function ignoreLines(dir) {
  return text(dir, GITIGNORE_FILE)
    .split('\n')
    .map((line) => line.trim());
}

test('retrieval on declares the docs server in .mcp.json and ignores the index, and a re-run changes neither', async (t) => {
  const { dir, env } = await retrievalFixture(t, { retrieval: true });

  await initOk(dir, [], env);

  const mcp = readJson(join(dir, MCP_FILE));
  assert.deepEqual(Object.keys(mcp.mcpServers), [DOCS_SERVER], `${MCP_FILE} declares a server beyond the docs one`);
  assert.deepEqual(mcp.mcpServers[DOCS_SERVER], DOCS_SERVER_ENTRY);
  assert.ok(ignoreLines(dir).includes(DOCS_INDEX_RULE), `${GITIGNORE_FILE} carries no ${DOCS_INDEX_RULE} rule`);

  const mcpBefore = text(dir, MCP_FILE);
  const ignoreBefore = text(dir, GITIGNORE_FILE);
  await initOk(dir, [], env);
  assert.equal(text(dir, MCP_FILE), mcpBefore, `a second init changed ${MCP_FILE}`);
  assert.equal(text(dir, GITIGNORE_FILE), ignoreBefore, `a second init changed ${GITIGNORE_FILE}`);
});

test('retrieval absent declares no docs server and no index rule, and with QA off writes no .mcp.json', async (t) => {
  const { dir, env } = await retrievalFixture(t, { retrieval: false });

  const { stdout } = await initOk(dir, [], env);

  assert.equal(await exists(dir, MCP_FILE), false, `${MCP_FILE} was written with neither QA nor retrieval on`);
  assert.match(stdout, /no \.mcp\.json was written/, `nothing on stdout says ${MCP_FILE} was left out:\n${stdout}`);
  assert.ok(
    !ignoreLines(dir).some((line) => line.includes('docs_index')),
    `${GITIGNORE_FILE} carries a docs_index rule with retrieval off`,
  );

  // QA on and retrieval still off: the browser servers alone.
  const browser = await retrievalFixture(t, { retrieval: false, qaDriver: QA_DRIVER_VALUE });
  await initOk(browser.dir, [], browser.env);
  assert.ok(
    !Object.hasOwn(readJson(join(browser.dir, MCP_FILE)).mcpServers, DOCS_SERVER),
    `${MCP_FILE} declares ${DOCS_SERVER} with retrieval off`,
  );
});

test('.mcp.json declares both halves with a browser driver, and the docs server alone with a mobile one', async (t) => {
  const both = await retrievalFixture(t, { retrieval: true, qaDriver: QA_DRIVER_VALUE });
  await initOk(both.dir, [], both.env);
  assert.deepEqual(
    Object.keys(readJson(join(both.dir, MCP_FILE)).mcpServers).sort(),
    ['chrome-devtools', DOCS_SERVER, 'playwright'].sort(),
  );

  const mobile = await retrievalFixture(t, { retrieval: true, qaDriver: QA_DRIVER_CHOSEN });
  const { stdout } = await initOk(mobile.dir, [], mobile.env);
  assert.deepEqual(Object.keys(readJson(join(mobile.dir, MCP_FILE)).mcpServers), [DOCS_SERVER]);
  // The file exists, so the note may not say it was not written.
  assert.doesNotMatch(stdout, /no \.mcp\.json was written/, `the note denies a file retrieval wrote:\n${stdout}`);
  assert.match(stdout, /no browser MCP server was declared in \.mcp\.json/);
});

/** The note a `--docs` run that could not put the retrieval question prints. */
const RETRIEVAL_UNASKED_NOTE = 'docs retrieval stays off: this run could not ask';

/** A throwaway retrieval cache holding the stub models and a planted runtime, and the env naming it. */
async function retrievalCacheEnv(t) {
  const cacheHome = await mkdtemp(join(tmpdir(), 'harness-retrieval-cache-'));
  t.after(() => rm(cacheHome, { recursive: true, force: true }));
  await plantModelFiles(cacheHome);
  await plantRetrievalRuntime(cacheHome);
  return retrievalEnv(cacheHome);
}

/**
 * `--docs-retrieval`, the flag half of the retrieval question. Every subprocess has a pipe for stdin,
 * so no prompt is reachable and each unflagged run takes the documented default, off.
 */
test('--docs-retrieval turns retrieval on, is refused without --docs, and defaults off', async (t) => {
  await t.test('--docs --docs-retrieval writes docs.retrieval true', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const env = await retrievalCacheEnv(subtest);

    await initOk(dir, ['--docs', '--docs-retrieval'], env);

    assert.equal(readJson(join(dir, CONFIG_FILE)).docs.retrieval, true);
  });

  await t.test('--docs alone writes no retrieval key and notes that it could not ask', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir, ['--docs']);

    const { docs } = readJson(join(dir, CONFIG_FILE));
    assert.equal(Object.hasOwn(docs, 'retrieval'), false, `an unasked run wrote docs.retrieval: ${JSON.stringify(docs)}`);
    assert.ok(stdout.includes(RETRIEVAL_UNASKED_NOTE), `the unasked run did not say so:\n${stdout}`);
  });

  await t.test('--docs-retrieval without --docs is refused, leaving the tree byte-identical', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const before = await snapshotTree(dir);

    const result = await runCli(dir, ['init', '--docs-retrieval']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--docs-retrieval needs --docs/);
    assert.deepEqual(await snapshotTree(dir), before, 'a refused run changed the tree');
  });

  await t.test('--docs-retrieval without --docs under --git-init creates no repository', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });
    const before = await snapshotTree(dir);

    const result = await runCli(dir, ['init', '--git-init', '--docs-retrieval']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--docs-retrieval needs --docs/);
    assert.equal(await exists(dir, '.git'), false, 'a refused run created a repository');
    assert.deepEqual(await snapshotTree(dir), before, 'a refused run changed the tree');
  });

  await t.test('a kept-config re-run with --docs-retrieval warns that the value went unwritten', async (subtest) => {
    const { dir, env } = await retrievalFixture(subtest, { retrieval: false });
    const before = text(dir, CONFIG_FILE);

    const { stderr } = await initOk(dir, ['--docs', '--docs-retrieval'], env);

    const reported = warningLines(stderr).filter((line) => line.includes('was read rather than written on this run'));
    assert.equal(reported.length, 1, `the dropped flags were not reported once:\n${stderr}`);
    assert.ok(reported[0].includes('--docs-retrieval'), `the warning does not name the flag:\n${reported[0]}`);
    assert.ok(
      reported[0].includes('config set docs.retrieval <value>'),
      `the warning names no per-key route for docs.retrieval:\n${reported[0]}`,
    );
    assert.equal(text(dir, CONFIG_FILE), before, 'a kept config was rewritten from the command line');
  });

  await t.test('init --help lists --docs-retrieval directly after --docs-root', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { status, stdout } = await runCli(dir, ['init', '--help']);

    assert.equal(status, 0);
    // The first token of a row, with the comma an aliased row's spelling list puts after it removed.
    const flags = stdout
      .split('\n')
      .map((line) => line.trim().split(/\s+/)[0].replace(/,$/, ''))
      .filter((flag) => flag.startsWith('--'));
    const root = flags.indexOf('--docs-root');
    assert.ok(root >= 0, `--help lists no --docs-root:\n${stdout}`);
    assert.equal(flags[root + 1], '--docs-retrieval', `--docs-retrieval does not follow --docs-root:\n${stdout}`);
  });
});

/**
 * `--rag`, the second accepted spelling of `--docs-retrieval`. It is carried on that flag's
 * `INIT_OPTIONS` row rather than at the parse site, so the three consumers of that table — the
 * parser, the `--help` block and the discarded-flag warning — each have to know about it.
 */
test('--rag is accepted wherever --docs-retrieval is, and is named back as it was typed', async (t) => {
  await t.test('--docs --rag writes docs.retrieval true', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const env = await retrievalCacheEnv(subtest);

    await initOk(dir, ['--docs', '--rag'], env);

    assert.equal(readJson(join(dir, CONFIG_FILE)).docs.retrieval, true);
  });

  await t.test('--rag without --docs is refused, naming --rag rather than the canonical flag', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const before = await snapshotTree(dir);

    const result = await runCli(dir, ['init', '--rag']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--rag needs --docs/);
    assert.ok(
      !result.stderr.includes('--docs-retrieval needs'),
      `the refusal names a flag the run never used:\n${result.stderr}`,
    );
    assert.deepEqual(await snapshotTree(dir), before, 'a refused run changed the tree');
  });

  await t.test('--rag does not take a value', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const result = await runCli(dir, ['init', '--docs', '--rag=true']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--rag does not take a value/);
  });

  await t.test('init --help prints --rag on the --docs-retrieval row', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { status, stdout } = await runCli(dir, ['init', '--help']);

    assert.equal(status, 0);
    const row = stdout.split('\n').find((line) => line.trim().startsWith('--docs-retrieval'));
    assert.ok(row !== undefined, `--help lists no --docs-retrieval row:\n${stdout}`);
    assert.match(row, /--docs-retrieval, --rag\s/);
  });

  await t.test('a kept-config re-run with --rag names both spellings in the warning', async (subtest) => {
    const { dir, env } = await retrievalFixture(subtest, { retrieval: false });

    const { stderr } = await initOk(dir, ['--docs', '--rag'], env);

    const reported = warningLines(stderr).filter((line) => line.includes('was read rather than written on this run'));
    assert.equal(reported.length, 1, `the dropped flags were not reported once:\n${stderr}`);
    assert.ok(reported[0].includes('--docs-retrieval (or --rag)'), `the warning names no alias:\n${reported[0]}`);
  });
});

/** A throwaway cache holding the stub models and no runtime, its runtime directory, and the env naming it. */
async function retrievalSetupCache(t) {
  const cacheHome = await mkdtemp(join(tmpdir(), 'harness-retrieval-cache-'));
  t.after(() => rm(cacheHome, { recursive: true, force: true }));
  await plantModelFiles(cacheHome);
  return { cacheHome, runtimeDir: join(cacheHome, 'autonomous-sdlc-harness', 'retrieval', 'runtime'), env: retrievalEnv(cacheHome) };
}

/** Every file under `dir`, absolute and sorted. */
async function filesUnder(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
    .sort();
}

/**
 * The setup step `init` runs when retrieval is on: the runtime install and the model download. No case
 * reaches the network — each either plants the runtime, runs a dry run, or relies on the stub refusal.
 */
test('retrieval setup installs nothing when the runtime is planted, names the install on a dry run, and never installs under the stub', async (t) => {
  const version = readJson(join(PACKAGE_ROOT, 'package.json')).version;

  await t.test('(a) a dry run with no runtime names the npm install and writes nothing', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const { cacheHome, runtimeDir, env } = await retrievalSetupCache(subtest);
    const before = await snapshotTree(dir);

    const { stdout } = await initOk(dir, ['--docs', '--docs-retrieval', '--dry-run'], env);

    assert.ok(stdout.includes(`npm install --prefix ${runtimeDir} `), `no npm install note names the runtime:\n${stdout}`);
    assert.ok(stdout.includes(`autonomous-sdlc-harness@${version}`), `the install note names no pinned CLI:\n${stdout}`);
    assert.match(stdout, /stub models \(.*\) need no download/, `no note says the stub needs no download:\n${stdout}`);
    assert.deepEqual(await snapshotTree(dir), before, 'a dry run changed the tree');
    assert.equal(existsSync(runtimeDir), false, 'a dry run created the runtime directory');

    await plantRetrievalRuntime(cacheHome, { version: '0.0.0-other' });
    const other = await initOk(dir, ['--docs', '--docs-retrieval', '--dry-run'], env);
    assert.ok(
      other.stdout.includes(`npm install --prefix ${runtimeDir} `),
      `a runtime at another version was treated as installed:\n${other.stdout}`,
    );
  });

  await t.test('(b) a planted runtime means no install runs', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const { cacheHome, runtimeDir, env } = await retrievalSetupCache(subtest);
    const planted = await plantRetrievalRuntime(cacheHome);

    const { stdout } = await initOk(dir, ['--docs', '--docs-retrieval'], env);

    assert.match(stdout, /docs retrieval runtime already installed/, `no note says the runtime is installed:\n${stdout}`);
    assert.deepEqual(await filesUnder(runtimeDir), planted, 'the runtime directory changed');
  });

  await t.test('(c) a stub run refuses fetch-models and never installs the runtime', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const { runtimeDir, env } = await retrievalSetupCache(subtest);

    const fetch = await runCli(dir, ['docs', 'fetch-models'], env);
    assert.notEqual(fetch.status, 0, 'docs fetch-models ran under the stub');
    assert.match(fetch.stderr, /AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB/, `the refusal does not name the stub:\n${fetch.stderr}`);

    const { stderr } = await initOk(dir, ['--docs', '--docs-retrieval'], env);
    assert.ok(
      warningLines(stderr).some((line) => line.includes('a stub run') && line.includes('never installs it')),
      `no warning says a stub run never installs the runtime:\n${stderr}`,
    );
    assert.equal(existsSync(runtimeDir), false, 'a stub run created the runtime directory');
  });
});

/**
 * `--qa-driver`, the flag half of a question `init` otherwise puts on a terminal.
 *
 * The value it sets is the one generated key that can be wrong in a way nothing downstream catches:
 * a mobile project wired with the browser default gets a valid configuration, a file that passes the
 * schema gate, and an interactive test phase whose agent cannot reach the application at all. So the
 * arms below are the flag's whole contract — the unchanged default, the value it sets, the refusal,
 * and the phase gate.
 *
 * Every subprocess here has a pipe for stdin, so each run takes the non-interactive path the
 * interaction rule promises (`docs/cli.md` §2) — which makes the first arm also the proof that the
 * prompt never blocks a run that cannot answer it.
 */
test('--qa-driver sets the interactive-test driver, and an unknown one is refused before anything is written', async (t) => {
  await t.test('--qa alone writes the documented default and names the flag that changes it', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir, ['--qa']);

    assert.equal(readJson(join(dir, CONFIG_FILE)).qa.driver, QA_DRIVER_VALUE);
    // The note has to say the value was defaulted rather than chosen, and name the flag: that line
    // is the only place a run nobody could ask learns the choice existed.
    assert.match(stdout, /documented default/, `the qa.driver note does not say the value was defaulted:\n${stdout}`);
    assert.match(stdout, /--qa-driver/, `the qa.driver note does not name the flag that chooses otherwise:\n${stdout}`);
  });

  await t.test('a driver given on the command line is written, and the file still loads', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout, stderr } = await initOk(dir, ['--qa', '--qa-driver', QA_DRIVER_CHOSEN]);

    const { qa } = readJson(join(dir, CONFIG_FILE));
    assert.equal(qa.driver, QA_DRIVER_CHOSEN);
    // The rest of the section still arrives: the flag chooses within a configured phase rather than
    // standing in for one.
    assert.equal(qa.credentialsPath, '.claude/qa-accounts.env');

    // Asked of the CLI rather than of the JSON, because `config get` refuses a file the shape check
    // reports an error on — so an exit 0 here is the written config passing that check.
    const read = await runCli(dir, ['config', 'get', 'qa.driver']);
    assert.equal(read.status, 0, `the generated config did not load back:\n${read.stderr}`);
    assert.match(read.stdout, new RegExp(QA_DRIVER_CHOSEN));

    assert.match(stdout, /set from --qa-driver/, `the run did not report where the driver came from:\n${stdout}`);
    // Narrower than "no warning mentions the key", which this arm can no longer hold: the value it
    // passes is a driver whose variant is declared-not-implemented, and that now warns on whichever
    // rung resolved it. The fault this guards against is the one it always was — a chosen driver
    // being rejected or quietly replaced by the default.
    assert.doesNotMatch(
      stderr,
      /is not one of the drivers|was written as the default/,
      `a driver the adopter chose was refused or defaulted:\n${stderr}`,
    );
  });

  await t.test('an unknown driver is refused, and nothing is written', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { status, stderr } = await runCli(dir, ['init', '--qa', '--qa-driver', QA_DRIVER_UNKNOWN]);

    assert.equal(status, 1);
    assert.match(stderr, /--qa-driver/);
    // All three legal values, so the refusal is answerable without opening the schema.
    for (const driver of [QA_DRIVER_VALUE, QA_DRIVER_CHOSEN, 'mobile-mcp']) {
      assert.match(stderr, new RegExp(driver), `the refusal does not list ${driver}:\n${stderr}`);
    }
    // And each mobile one carries its release status, from the one owner beside the enum
    // (`config/model.ts`'s `qaDriverChoices`): the values that cannot run are marked at the surface
    // that rejected one, not only in a document read after choosing.
    for (const driver of [QA_DRIVER_CHOSEN, 'mobile-mcp']) {
      assert.match(
        stderr,
        new RegExp(`${driver} \\[not implemented\\]`),
        `the refusal does not mark ${driver} as not implemented:\n${stderr}`,
      );
    }
    // The negative half, without which a blanket suffix on every value would pass the loop above.
    assert.doesNotMatch(
      stderr,
      new RegExp(`${QA_DRIVER_VALUE} \\[not implemented\\]`),
      `the refusal marks the one driver this release implements as not implemented:\n${stderr}`,
    );
    // The refusal is raised while parsing the flags, before the first generator: a run refused for a
    // typo must leave the repository exactly as it found it.
    assert.equal(await exists(dir, CONFIG_FILE), false);
  });

  await t.test('the driver is not recorded when the phase it belongs to is off', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stderr } = await initOk(dir, ['--qa-driver', QA_DRIVER_CHOSEN]);

    // No qa section at all, rather than a section holding a driver nothing reads: the phase toggle
    // decides whether the section exists, and this flag never turns a phase on.
    const config = readJson(join(dir, CONFIG_FILE));
    assert.equal(Object.hasOwn(config, 'qa'), false, 'a config generated without --qa carries a qa section');
    assert.equal(config.phases.qa, false);
    // Warned rather than dropped in silence: the flag is only ever passed on purpose.
    assert.match(stderr, /--qa-driver was given without --qa/, `the ignored flag was not reported:\n${stderr}`);
  });
});

/**
 * The half of the driver question no behavioural case in this suite can reach.
 *
 * `askQaDriver` returns before printing anything when `canPrompt` is false, and every subprocess here
 * has a pipe for stdin, so the question string never reaches a stream a test can read — the refusal
 * arm above is the marking's behavioural cover, because it is the other surface the same renderer
 * feeds and it *is* subprocess-reachable. The guard on this one is on the source, on the model of
 * `test/prompt.test.mjs` ("the one property of `core/prompt.ts` no behavioural test in this suite can
 * reach"). Reading the rendered question at a terminal stays hand-run acceptance gate 7(iii) and is
 * not claimed by anything here.
 */
test('the driver question renders the marked choice list and no longer restates the detection line', () => {
  const source = readFileSync(join(WORKSPACE_ROOT, 'cli', 'src', 'commands', 'init.ts'), 'utf8');
  const code = source.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  const question = /question: `([^`]*which driver should the interactive test phase run[^`]*)`/.exec(code)?.[1];
  assert.ok(question, 'the driver question is no longer one template literal in init.ts, so this guard reads nothing');

  assert.match(question, /\$\{qaDriverChoices\(\)\}/, `the question does not render the marked list:\n${question}`);
  assert.doesNotMatch(
    code,
    /QA_DRIVERS\.join/,
    'a value list in init.ts is joined from the raw enum, so it shows nothing about which drivers this release implements',
  );
  // Finding 30: the question opened on the detection line's own first six words, so the two read as
  // one narration line printed twice and the eye skipped the second.
  assert.doesNotMatch(question, /^detected the/, `the question restates the detection line:\n${question}`);
  assert.doesNotMatch(question, /layer preset/, `the question restates the detection line:\n${question}`);
  // The same guard for the step's second line: the question is asked after both are printed, so
  // opening on either one's words puts the finding back on the other half of detection.
  assert.doesNotMatch(
    question,
    /^commands\.typecheck and commands\.test came from/,
    `the question restates the command-source line:\n${question}`,
  );
});

/**
 * The scenario rules are the one QA artifact whose value is written *by the adopter*: the skeleton is
 * a banner to fill in, and after the first run the adopter's copy is the only copy there is. So the
 * re-run assertion below is the point of this test, and the phase gate and the heading are what make
 * it meaningful — a file written when the phase is off is a step nobody asked for, and a file whose
 * content came from elsewhere would keep its edits just as faithfully.
 */
test('the QA scenario rules arrive with the test phase, and a re-run keeps what the adopter wrote', async (t) => {
  const withoutQa = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(withoutQa);
  assert.equal(
    await exists(withoutQa, QA_SCENARIOS_FILE),
    false,
    `${QA_SCENARIOS_FILE} was written with the interactive test phase off`,
  );

  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir, ['--qa']);
  assertRendered(dir, QA_SCENARIOS_FILE);
  assert.match(text(dir, QA_SCENARIOS_FILE), QA_SCENARIOS_HEADING);
  // The credentials path is rendered in, not left as a placeholder for the adopter to resolve.
  assert.match(
    text(dir, QA_SCENARIOS_FILE),
    /\.claude\/qa-accounts\.env/,
    `${QA_SCENARIOS_FILE} does not name the credentials file it splits values with`,
  );

  appendFileSync(join(dir, QA_SCENARIOS_FILE), '\nOnly account 1 may publish.\n', 'utf8');
  const edited = text(dir, QA_SCENARIOS_FILE);

  await initOk(dir, ['--qa']);

  assert.equal(text(dir, QA_SCENARIOS_FILE), edited, 'a re-run rewrote the scenario rules the adopter had edited');
});

/**
 * The reference-parity phase's directories, including the per-item findings root its fix loop
 * writes into — a directory the instruction corpus addresses by name, so a tree without it is
 * incomplete for an adopter running the phase.
 *
 * Both arms are asserted here because the interesting failure is the row leaking into the always-on
 * set: an adopter who never runs the phase would get an empty directory they cannot fill and cannot
 * tell from one the flow forgot to write. So the off arm checks the run *says* it skipped them, and
 * the on arm checks each arrives with the contract for what belongs in it.
 */
test('the reference-parity directories, with their contracts, arrive only with the phase', async (t) => {
  const withoutParity = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(withoutParity);

  for (const name of PARITY_DIRS) {
    assert.equal(
      await exists(withoutParity, `${STATE_DIR}/${name}`),
      false,
      `${STATE_DIR}/${name} was written with the reference-parity phase off`,
    );
  }
  assert.match(stdout, /belong to a phase that is off/, `the run did not report the skipped directories:\n${stdout}`);

  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir, ['--parity']);

  assert.equal(readJson(join(dir, CONFIG_FILE)).phases.parity, true);
  for (const name of PARITY_DIRS) {
    assert.ok(await exists(dir, `${STATE_DIR}/${name}`), `${STATE_DIR}/${name} was not written with --parity`);
    assertRendered(dir, `${STATE_DIR}/${name}/README.md`);
  }
});

test('a second init changes nothing on disk and reports only kept and ensured', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  const before = await snapshotTree(dir);

  const { stdout } = await initOk(dir);

  assert.deepEqual(await snapshotTree(dir), before, 'a second init changed the tree');
  assert.match(stdout, /^Summary: \d+ kept, \d+ ensured$/m);
});

test('a second init keeps an edited config and an edited conventions stub', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  const config = readJson(join(dir, CONFIG_FILE));
  config.projectName = 'edited-by-the-test';
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  appendFileSync(join(dir, SHARED_STUB), '\nThis sentence was added by hand.\n', 'utf8');
  const before = await snapshotTree(dir);

  const { stdout } = await initOk(dir);

  assert.deepEqual(await snapshotTree(dir), before, 'a re-run rewrote a file the adopter had edited');
  assert.equal(readJson(join(dir, CONFIG_FILE)).projectName, 'edited-by-the-test');
  assert.match(text(dir, SHARED_STUB), /This sentence was added by hand\./);
  // The run says it used the file it found rather than the one it would have generated.
  assert.match(stdout, /already exists and was left exactly as it is/);
});

/**
 * What `--force` is, and what it is not, pinned on one artifact of each kind.
 *
 * **It is a file semantic**: a `create-if-absent` artifact the adopter has edited — the conventions
 * stub here — is copied to a `.bak` and regenerated, so the previous content is one file away rather
 * than gone. Both halves are asserted, because a flag that wrote the backup and then kept the file
 * would satisfy either one alone.
 *
 * **It is not a configuration semantic**, and `harness.config.json` is the single exception the rest
 * of this case exists to fix in place. The config is read whenever it is there, on every run and
 * this flag included, and no `.bak` of it is written — because the artifacts regenerated in the same
 * run are all rendered from the config *in effect*, so a `--force` that rebuilt the file first would
 * discard the adopter's edit and then re-render the hook, the profile and the stubs from the
 * reverted values. `--reset-config` is the flag that rebuilds it, and it is the case below.
 */
test('--force regenerates an edited conventions stub after a .bak, and reads the edited config rather than rebuilding it', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  const config = readJson(join(dir, CONFIG_FILE));
  config.projectName = 'edited-by-the-test';
  const editedConfig = `${JSON.stringify(config, null, 2)}\n`;
  writeFileSync(join(dir, CONFIG_FILE), editedConfig, 'utf8');
  appendFileSync(join(dir, SHARED_STUB), '\nThis sentence was added by hand.\n', 'utf8');
  const editedStub = text(dir, SHARED_STUB);

  await initOk(dir, ['--force']);

  // The artifact class the flag applies to: backed up, then regenerated.
  assert.equal(text(dir, `${SHARED_STUB}.bak`), editedStub);
  assert.ok(
    !text(dir, SHARED_STUB).includes('This sentence was added by hand.'),
    'the stub was not regenerated, so --force did nothing but write a backup',
  );

  // The one artifact it does not: kept byte for byte, and nothing was backed up because nothing was
  // replaced.
  assert.equal(text(dir, CONFIG_FILE), editedConfig);
  assert.equal(readJson(join(dir, CONFIG_FILE)).projectName, 'edited-by-the-test');
  assert.equal(
    await exists(dir, `${CONFIG_FILE}.bak`),
    false,
    `--force wrote a ${CONFIG_FILE}.bak, so it replaced the config the rest of the run reads`,
  );
});

/**
 * The other artifacts `--force` does not apply to: the two accumulating ledgers.
 *
 * They are the one class where a `.bak` is not enough. `--force` is what the CLI's own remedy
 * messages send an adopter to for ordinary configuration edits, so it is run more than once over a
 * repository's life, and the write engine's backup is **single-generation** — `.bak` is overwritten
 * rather than chained (`core/writer.ts`'s `planWrite`). A ledger that were merely backed up would
 * therefore survive exactly one forced run and be unrecoverable after the second, and nothing can
 * re-derive an accumulating record from detection, the command line or the templates.
 *
 * Which is why the flag is run **twice** here: one run cannot tell "kept" from "replaced, and the
 * previous content is in the `.bak`". Both legs are then asserted for the same reason the config
 * case above asserts both — the appended line surviving says the content is there, and the absent
 * `.bak` says it is there because the file was never replaced.
 */
test('--force leaves the accumulating ledgers byte-identical and writes no ledger .bak', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const edited = new Map();
  for (const ledger of LEDGERS) {
    const path = `${STATE_DIR}/${ledger}`;
    appendFileSync(join(dir, path), `\n- A lesson appended by the test to ${ledger}.\n`, 'utf8');
    edited.set(ledger, text(dir, path));
  }

  await initOk(dir, ['--force']);
  await initOk(dir, ['--force']);

  for (const ledger of LEDGERS) {
    const path = `${STATE_DIR}/${ledger}`;
    assert.equal(text(dir, path), edited.get(ledger), `--force truncated ${path}, an accumulating ledger`);
    assert.equal(
      await exists(dir, `${path}.bak`),
      false,
      `--force wrote ${path}.bak, so it replaced a file whose history has no second copy`,
    );
  }
});

/**
 * The workflow the documentation describes, driven end to end: **edit the config, re-run
 * `init --force`, and the dependent artifacts are regenerated from the edit**.
 *
 * It is driven through `protectedBranches` because that is where the disagreement it pins was a
 * security one rather than a cosmetic one: the run rebuilt the config from detection and the command
 * line, reverting the added branch, and then re-rendered the pre-push guard from the reverted value —
 * so a run reporting success left a branch the adopter had asked to protect unenforced.
 *
 * The guard is read through {@link enforcedBranches}, which takes the alternatives of the `case`
 * label rather than searching the file: the hook's own header names an example glob, so a whole-file
 * substring check answers for a branch the guard never matches. The `.bak` assertion is the third
 * leg — it is what separates "the hook was regenerated and carries the edit" from "the hook was
 * simply kept and happened to carry it".
 */
test('an edited protectedBranches survives --force and reaches the regenerated hook', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const hook = `${GITHOOKS_DIR}/pre-push`;
  const generatedHook = text(dir, hook);
  assert.equal(
    enforcedBranches(generatedHook).includes(ADDED_BRANCH),
    false,
    `${hook} already enforces ${ADDED_BRANCH}, so this fixture cannot show the regeneration`,
  );

  // The edit an adopter makes, in the file `init` tells them to correct.
  const config = readJson(join(dir, CONFIG_FILE));
  config.protectedBranches = [...config.protectedBranches, ADDED_BRANCH];
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  await initOk(dir, ['--force']);

  // (a) The edit survived the run that was supposed to act on it.
  assert.ok(
    readJson(join(dir, CONFIG_FILE)).protectedBranches.includes(ADDED_BRANCH),
    `--force dropped ${ADDED_BRANCH} from protectedBranches before regenerating anything from it`,
  );
  // (b) And it reached the guard that enforces it, read off the `case` label.
  assert.ok(
    enforcedBranches(text(dir, hook)).includes(ADDED_BRANCH),
    `${hook} does not enforce ${ADDED_BRANCH} after the config it is rendered from gained it`,
  );
  // (c) The hook got there by being regenerated the backed-up way, not by being kept.
  assert.equal(text(dir, `${hook}.bak`), generatedHook);
});

/**
 * The start-over path, and the promise the run makes about it.
 *
 * Two edits are made rather than one, and they are edits of different kinds on purpose: a scalar the
 * generator derives (`projectName`) and an entry added to a list (`protectedBranches`). A rebuild
 * that re-derived the first while carrying the second across would look like a working reset in
 * every assertion a single-key fixture could make, and would leave the config disagreeing with the
 * pre-push hook regenerated from it.
 *
 * **No `--force` is passed**, which is the whole point of the case: the flag stands on its own,
 * through the overwrite answer the config's own write request carries (`config/io.ts`'s
 * `saveConfig`). And the plain re-run at the end pins the reset as the explicit act rather than a
 * new default — a `--reset-config` that leaked into the next ordinary run would rebuild a config
 * nobody asked it to.
 *
 * The output is asserted in both directions, because "restored" and "rebuilt" are different
 * promises and only the second one is kept here: whatever lived only in the replaced file is gone,
 * and the `.bak` is where it went.
 *
 * The flag is run under `--dry-run` first, for the third promise it could break: a preview that
 * rebuilds nothing must not say a rebuild happened or name a `.bak` to go looking for.
 */
test('init --reset-config rebuilds the config from detection and the flags, after a .bak', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  const generated = readJson(join(dir, CONFIG_FILE));
  const editedConfig = `${JSON.stringify(
    {
      ...generated,
      projectName: 'edited-by-the-test',
      protectedBranches: [...generated.protectedBranches, ADDED_BRANCH],
    },
    null,
    2,
  )}\n`;
  writeFileSync(join(dir, CONFIG_FILE), editedConfig, 'utf8');

  // The same flag under --dry-run, before the real reset, because that is the only point in this
  // fixture where the edited file is still on disk and no `.bak` has ever existed: both halves of
  // "nothing happened" are checkable here and nowhere after. The note is pinned in both directions
  // — the conditional wording present and the past-tense wording absent — so a preview cannot claim
  // a rebuild, or a previous file sitting at a `.bak`, that a real run alone makes.
  const dry = await initOk(dir, ['--reset-config', '--dry-run']);
  assert.match(dry.stdout, /would be rebuilt from stack detection/);
  assert.ok(
    !/was rebuilt from stack detection/.test(dry.stdout),
    `the dry run claimed a rebuild it never made:\n${dry.stdout}`,
  );
  assert.equal(text(dir, CONFIG_FILE), editedConfig, 'a dry run rebuilt the config');
  assert.equal(existsSync(join(dir, `${CONFIG_FILE}.bak`)), false, 'a dry run wrote a .bak');

  const { stdout } = await initOk(dir, ['--reset-config']);

  // (a) The previous file is where the note says it is, byte for byte.
  assert.equal(text(dir, `${CONFIG_FILE}.bak`), editedConfig);

  // (b) Neither edit survived: both keys are back to what detection and the command line say.
  const rebuilt = readJson(join(dir, CONFIG_FILE));
  assert.equal(rebuilt.projectName, generated.projectName);
  assert.notEqual(rebuilt.projectName, 'edited-by-the-test');
  assert.deepEqual(rebuilt.protectedBranches, [generated.defaultBranch]);

  // (c) The run said which of the two things it did — and the only place the word "restore" may
  // appear is the note's own disclaimer, so it is removed before the rest of the output is checked
  // for a claim this command cannot keep.
  assert.match(stdout, /rebuilt from stack detection and this command line/);
  assert.match(stdout, /re-derived rather than restored/);
  const claims = stdout.replaceAll('re-derived rather than restored', '');
  assert.ok(!/restor/i.test(claims), `the run claimed something was restored:\n${stdout}`);

  // (d) The reset was the explicit act: the next ordinary run reads the rebuilt file and keeps it.
  const afterReset = await snapshotTree(dir);
  await initOk(dir);
  assert.deepEqual(await snapshotTree(dir), afterReset, 'a plain re-run after --reset-config rebuilt the config again');
});

/**
 * The documented remedy stops producing the defect it was prescribed for.
 * `init --reset-config --default-branch <name>` is what corrects `defaultBranch`, and the run that
 * rebuilds the config now re-renders the guard **its own rebuild made wrong** — that run, and no
 * other.
 *
 * **Case (a) is the finding's own measurement**: a repository wired to `feat_add_search`, reset onto
 * `trunk`, left `config trunk / ["trunk"]` beside a hook still reading `feat_add_search)` — so the
 * guard allowed a push to the integration line and refused one to an ordinary feature branch, on a
 * run reporting success. The guard is read off its `case` label through {@link enforcedBranches}
 * rather than by searching the file, because the hook's own header names an example glob and answers
 * for a branch the guard never matches.
 *
 * The other three are the gates, and each is a different way the fix could go wrong. **(b)** A
 * rebuild that left the label right must mint no `.bak`: the write engine's backup is
 * single-generation, so spending it on a run that replaced nothing throws away whatever the previous
 * one held. **(c)** A guard whose label the reader cannot get back out is one somebody wrote by
 * hand, and rebuilding a configuration is not consent to discard it — it is left byte-identical and
 * reported, by the name of the `doctor` check that grades that state on every run. **(d)** No
 * ordinary re-run may enter the path at all, which is the whole of `create-if-absent`.
 */
test('init --reset-config re-renders a pre-push guard its own rebuild made stale, and only that run', async (t) => {
  const hook = `${GITHOOKS_DIR}/pre-push`;

  /** The clause the re-render note is identified by, and which no other note carries. */
  const RE_RENDER_CLAUSE = 'carried the case label';

  await t.test('the measured reproduction: the corrected branch is the one the guard protects', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feat_add_search');
    await initOk(dir);

    const written = text(dir, hook);
    assert.deepEqual(
      enforcedBranches(written),
      ['feat_add_search'],
      `the first run left a guard this case cannot show corrected:\n${written}`,
    );

    const { stdout } = await initOk(dir, ['--reset-config', '--default-branch', 'trunk']);

    // (a) The key the remedy exists to correct.
    assert.equal(readJson(join(dir, CONFIG_FILE)).defaultBranch, 'trunk');
    // (b) And the file that actually judges a push, which is the half the finding measured frozen.
    assert.deepEqual(enforcedBranches(text(dir, hook)), ['trunk']);
    // (c) It got there by being replaced after a backup rather than by having been kept, so the
    // previous file is readable at the `.bak`, still carrying the label the rebuild made wrong.
    assert.equal(text(dir, `${hook}.bak`), written);
    assert.deepEqual(enforcedBranches(text(dir, `${hook}.bak`)), ['feat_add_search']);
    // (d) And the run said so: both sets, and where the file it replaced went.
    const note = notesBlock(stdout).find((line) => line.includes(RE_RENDER_CLAUSE));
    assert.ok(note, `the run re-rendered the guard and reported nothing about it:\n${stdout}`);
    assert.ok(
      note.includes('feat_add_search') && note.includes('trunk') && note.includes(`${hook}.bak`),
      `the note names the old label, the set now enforced or the .bak incompletely:\n${note}`,
    );
  });

  await t.test('a rebuild that leaves the label right keeps the hook and mints no .bak', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'main');
    await initOk(dir);
    const written = text(dir, hook);

    const { stdout } = await initOk(dir, ['--reset-config']);

    assert.equal(text(dir, hook), written, 'a rebuild re-rendered a hook whose label it had not made wrong');
    assert.equal(
      await exists(dir, `${hook}.bak`),
      false,
      "a rebuild that changed no branch still spent the engine's single-generation .bak",
    );
    assert.ok(
      stdout.split('\n').some((line) => line.startsWith('= kept') && line.includes(hook)),
      `${hook} was not reported kept:\n${stdout}`,
    );
  });

  await t.test('a guard whose label was removed by hand is left byte-identical and reported', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feat_add_search');
    await initOk(dir);

    // A hook rewritten past the generated shape: the `case` opener is gone, so nothing can read back
    // out what it protects — the state a rebuild must not treat as a licence to replace it.
    const rewritten = text(dir, hook)
      .split('\n')
      .filter((line) => !line.includes('case "$target" in'))
      .join('\n');
    writeFileSync(join(dir, hook), rewritten, 'utf8');

    const { stdout, stderr } = await initOk(dir, ['--reset-config', '--default-branch', 'trunk']);

    assert.equal(text(dir, hook), rewritten, 'a rebuild discarded a guard it could not read');
    assert.equal(await exists(dir, `${hook}.bak`), false, 'a hook nothing replaced was still backed up');
    const warning = warningLines(stderr).find((line) => line.includes(hook));
    assert.ok(warning, `the run left an unreadable guard in place and said nothing:\n${stderr}`);
    assert.ok(
      warning.includes('pre-push-guard'),
      `the warning names no check that reports this state on every run:\n${warning}`,
    );
    assert.equal(
      notesBlock(stdout).some((line) => line.includes(RE_RENDER_CLAUSE)),
      false,
      `the run claimed a re-render it did not make:\n${stdout}`,
    );
  });

  await t.test('an ordinary re-run after a config edit never enters the path', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'main');
    await initOk(dir);
    const written = text(dir, hook);

    // The same divergence case (a) rebuilds away, reached without a rebuild — so the gate is the
    // flag rather than the disagreement.
    editConfig(dir, (config) => {
      config.protectedBranches = [...config.protectedBranches, ADDED_BRANCH];
    });

    const { stdout } = await initOk(dir);

    assert.equal(text(dir, hook), written, 'a plain re-run re-rendered a hook it is contracted to keep');
    assert.equal(await exists(dir, `${hook}.bak`), false, 'a plain re-run backed the guard up');
    assert.equal(
      enforcedBranches(text(dir, hook)).includes(ADDED_BRANCH),
      false,
      `${hook} picked up an edit only --force and the delete-and-re-run route reach`,
    );
    assert.equal(
      notesBlock(stdout).some((line) => line.includes(RE_RENDER_CLAUSE)),
      false,
      `a run that rebuilt nothing reported a re-render:\n${stdout}`,
    );
  });
});

test('--dry-run writes nothing and reports what a real run would have written', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  const before = await snapshotTree(dir);

  const { stdout } = await initOk(dir, ['--dry-run']);

  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
  assert.match(stdout, /^\+ would create\s+harness\.config\.json$/m);
  assert.match(stdout, /^Summary: \d+ would create, \d+ would ensure$/m);
});

test('an existing .gitignore and .mcp.json keep their content and gain the managed additions once', async (t) => {
  const dir = await fixtureFor(t, {
    files: {
      ...nodeProjectFiles(),
      // The second line is one the managed block would otherwise add: a line already in the file
      // is never appended a second time, whoever wrote it.
      [GITIGNORE_FILE]: 'node_modules/\n.claude/settings.local.json\n',
      [MCP_FILE]: { mcpServers: { 'fixture-server': { type: 'stdio', command: 'true', args: [] } } },
    },
  });

  await initOk(dir, ['--qa']);
  const afterFirst = await snapshotTree(dir);
  await initOk(dir, ['--qa']);

  const ignore = text(dir, GITIGNORE_FILE);
  assert.match(ignore, /^node_modules\/$/m);
  assert.equal(occurrences(ignore, GITIGNORE_MARKER), 1, 'a second init added a second managed block');
  assert.equal(occurrences(ignore, '.claude/settings.local.json'), 1, 'a line already present was appended again');
  assert.equal(occurrences(ignore, '.claude/harness-no-offer'), 1, 'the opt-out marker rule is not in the block exactly once');
  assert.equal(occurrences(ignore, '.claude/push-notify.env'), 1);
  assert.equal(occurrences(ignore, `${STATE_DIR}/autonomous_logs/*`), 1);
  // A run-control rule, and — with the browser group gated on and written last — a line from each
  // remaining stretch of the payload: the merge is into a file the adopter already owned, so
  // "arrived, and arrived once" is asserted at both ends rather than only at the end the older
  // lines sit in.
  assert.equal(occurrences(ignore, `${STATE_DIR}/STOP`), 1);
  assert.equal(occurrences(ignore, `!${STATE_DIR}/autonomous_inbox/README.md`), 1);
  // The client env symlink the worktree bootstrap creates, line-anchored: `.claude/push-notify.env`
  // ends in the same four characters, so a substring count would pass on the wrong line.
  assert.equal(
    ignore.split('\n').filter((line) => line.trim() === CLIENT_ENV_RULE).length,
    1,
    `the ${CLIENT_ENV_RULE} rule is not in the block exactly once:\n${ignore}`,
  );
  // The `config set` backup rule, line-anchored for the same reason: the anchored spelling is the
  // one that has to be there, and a substring count would pass on an unanchored line.
  assert.equal(
    ignore.split('\n').filter((line) => line.trim() === CONFIG_BACKUP_RULE).length,
    1,
    `the ${CONFIG_BACKUP_RULE} rule is not in the block exactly once:\n${ignore}`,
  );
  // No `assertRendered` call in this file passes GITIGNORE_FILE, so the template's tokens have no
  // standing substitution check: a mis-spelled one would ship a literal `{{…}}` line with the suite
  // green.
  assert.ok(!ignore.includes('{{'), `the rendered .gitignore still carries a template token:\n${ignore}`);
  for (const rule of QA_ARTIFACT_RULES) {
    assert.equal(occurrences(ignore, rule), 1, `${rule} is not in the block exactly once:\n${ignore}`);
  }

  // What those rules DO, which no string search reaches. The screenshot destination is asked one
  // level down, where a real screenshot lands; the root-anchored rule is asked at the repository
  // root, which is the shape a basename-sanitizing server produces.
  const mustIgnore = [
    '.playwright-mcp/trace.zip',
    '.chrome-devtools-mcp/profile/state',
    `${STATE_DIR}/qa_artifacts/some-branch/qa_1.png`,
    'qa_probe.png',
    CLIENT_ENV_RULE,
  ];
  const ignored = await ignoredAmong(dir, mustIgnore);
  assert.deepEqual(
    mustIgnore.filter((path) => !ignored.includes(path)),
    [],
    'the browser half leaves these in the working copy and no rule covers them, so an unattended run ends on a dirty tree',
  );

  // The other direction, and the reason for two of the four spellings: the leading `/` keeps the
  // basename rule at the root, and the `.env` rule names one file rather than a path, so a
  // `qa_`-named image in a subdirectory and the committed env sibling both stay committable — as
  // does the run-artifact tree's own committed contract, which is what a rule one character too
  // broad would take.
  const qaReviewsContract = `${STATE_DIR}/qa_reviews/README.md`;
  const mustKeep = ['docs/qa_fixture.png', CLIENT_ENV_EXAMPLE, qaReviewsContract];
  assert.ok(await exists(dir, qaReviewsContract), `${qaReviewsContract} is not in the tree init wrote, so asking about it proves nothing`);
  assert.deepEqual(await ignoredAmong(dir, mustKeep), [], 'a rule reaches a file that has to stay committable');

  const mcp = readJson(join(dir, MCP_FILE));
  assert.ok(Object.hasOwn(mcp.mcpServers, 'fixture-server'), "the adopter's own server was dropped");
  assert.deepEqual(Object.keys(mcp.mcpServers).sort(), ['chrome-devtools', 'fixture-server', 'playwright']);

  assert.deepEqual(await snapshotTree(dir), afterFirst, 'the second init merged into a shared file again');
});

/**
 * A managed line deleted by hand comes back **where it was**, not at the end of the file.
 *
 * Position is content in an ignore file. The block carries three `<dir>/*` + `!<dir>/README.md`
 * pairs, and git resolves a path by the **last** pattern matching it — so a contents rule restored
 * below its own negation re-hides the committed contract that negation exists for, in a tree the
 * re-run has just reported one added line for. Each of the three pairs is driven, because the fault
 * is a property of the block rather than of any one rule, and the observable is **git's** answer as
 * well as the file's text: the text is what makes the answer stable, and only git says what the
 * rules do.
 *
 * The adopter's own rule sits directly beneath the block with no blank line between them, which is
 * the second half of the same fault: the block's extent is a run of non-blank lines, so that rule is
 * what a walk looking for a blank separator runs past — landing the restored line at the end of the
 * file, below the adopter's rule and below every negation. It must stay exactly where it was put.
 */
test('a managed ignore line deleted by hand comes back inside the block, above its own negation', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  // No blank line between: `init` wrote the whole file here, so the block runs to the end of it and
  // appending puts this rule hard against the block's last line.
  const adopterRule = 'my-own-scratch/';
  appendFileSync(join(dir, GITIGNORE_FILE), `${adopterRule}\n`);

  for (const name of ['autonomous_logs', 'clarifications', 'autonomous_inbox']) {
    const contents = `${STATE_DIR}/${name}/*`;
    const exception = `!${STATE_DIR}/${name}/README.md`;
    const readme = `${STATE_DIR}/${name}/README.md`;
    const machineLocal = `${STATE_DIR}/${name}/machine-local.tmp`;

    const before = text(dir, GITIGNORE_FILE).split('\n');
    assert.ok(before.includes(contents), `${contents} is not in the generated block, so deleting it proves nothing`);
    writeFileSync(join(dir, GITIGNORE_FILE), before.filter((line) => line !== contents).join('\n'), 'utf8');

    const { stdout } = await initOk(dir);
    assert.ok(stdout.includes(`1 line added: ${contents}`), `the re-run did not report restoring ${contents}:\n${stdout}`);

    const after = text(dir, GITIGNORE_FILE);
    const lines = after.split('\n');
    assert.equal(occurrences(after, GITIGNORE_MARKER), 1, 'the restoring run added a second managed block');
    assert.equal(lines.filter((line) => line === contents).length, 1, `${contents} came back more than once:\n${after}`);
    assert.ok(
      lines.indexOf(contents) < lines.indexOf(exception),
      `${contents} came back below ${exception}, so git's last match re-hides ${readme}:\n${after}`,
    );
    assert.equal(
      lines.filter((line) => line.trim() !== '').at(-1),
      adopterRule,
      `the restored line landed past the block, below the adopter's own rule:\n${after}`,
    );

    // What the two positions above DO, which no string search reaches: the contract file is
    // committable and the machine-local sibling beside it is still covered.
    assert.deepEqual(await ignoredAmong(dir, [readme]), [], `${readme} is ignored, so \`git add\` of it is refused`);
    assert.deepEqual(await ignoredAmong(dir, [machineLocal]), [machineLocal], `${contents} came back without covering ${machineLocal}`);
  }
});

/**
 * The extension path, which is the one every already-wired repository takes.
 *
 * A rule added to the template serves a fresh adoption by construction; what it owes an **existing**
 * adopter is that a re-run puts it inside the block already there — once, and without touching the
 * lines that adopter wrote by hand. The pre-change file is simulated rather than pasted: the whole
 * new group is filtered back out of a generated file, the rule line together with the contiguous
 * comment run above it, because comment lines are payload too and a file generated before the group
 * existed carried none of them. The group is derived positionally rather than retyped, so rewording
 * the comments cannot make this case vacuous — and the filter's own effect is asserted before the
 * re-run, so a mis-derived one fails loudly instead of leaving nothing to restore.
 *
 * The two hand edits are the shapes that break a naive merge: a rule directly beneath the block with
 * no blank line between them, which makes the block's extent ambiguous (see the test above), and a
 * rule *inside* the block, which the engine never authored and must not move. Nothing here asserts a
 * line being removed or a comment reworded — the engine only ever adds, which is why the template
 * gains a new comment group rather than an edited one.
 */
test('a repository wired before the backup rule existed gains it inside its own block', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  // Roll the generated file back to what a pre-change run would have written: drop the rule line and
  // the comment run standing immediately above it, found by position rather than by text.
  const generated = text(dir, GITIGNORE_FILE).split('\n');
  const ruleAt = generated.findIndex((line) => line.trim() === CONFIG_BACKUP_RULE);
  assert.notEqual(ruleAt, -1, `${CONFIG_BACKUP_RULE} is not in the generated block, so removing it proves nothing`);
  let groupAt = ruleAt;
  while (groupAt > 0 && generated[groupAt - 1].trim().startsWith('#')) groupAt -= 1;
  const rolledBack = [...generated.slice(0, groupAt), ...generated.slice(ruleAt + 1)];
  assert.equal(
    rolledBack.filter((line) => line.trim() === CONFIG_BACKUP_RULE).length,
    0,
    `the rolled-back file still carries ${CONFIG_BACKUP_RULE}, so the re-run has nothing to add`,
  );
  writeFileSync(join(dir, GITIGNORE_FILE), rolledBack.join('\n'), 'utf8');

  // The adopter's two edits. The first sits directly beneath the block with no blank line, so it is
  // what a walk looking for a blank separator runs past; the second is a line inside the block that
  // the engine never wrote and has no payload position of its own.
  const adopterBelowBlock = 'my-own-scratch/';
  const adopterInBlock = 'my-own-secrets.txt';
  const edited = text(dir, GITIGNORE_FILE).split('\n');
  const headerAt = edited.findIndex((line) => line.includes(GITIGNORE_MARKER));
  assert.notEqual(headerAt, -1, 'the generated file has no managed block header to edit inside of');
  edited.splice(headerAt + 1, 0, adopterInBlock);
  writeFileSync(join(dir, GITIGNORE_FILE), `${edited.filter((line) => line !== '').join('\n')}\n${adopterBelowBlock}\n`, 'utf8');

  const { stdout } = await initOk(dir);

  // That the run merged the ignore file, and no more than that. `mergedDetail` names only the first
  // few added lines and elides the rest, so an assertion on which names appear — or on how many
  // there are — would be decided by how many comment lines the template's group happens to carry.
  const mergeLine = stdout.split('\n').find((line) => line.startsWith('~ merged') && line.includes(` ${GITIGNORE_FILE} (`));
  assert.ok(mergeLine !== undefined, `the re-run did not report merging ${GITIGNORE_FILE}:\n${stdout}`);
  assert.match(mergeLine, /\(\d+ lines? added: /, `the merge report names no added lines:\n${mergeLine}`);

  const after = text(dir, GITIGNORE_FILE);
  const lines = after.split('\n');
  assert.equal(occurrences(after, GITIGNORE_MARKER), 1, 'the extending run added a second managed block');
  assert.equal(
    lines.filter((line) => line.trim() === CONFIG_BACKUP_RULE).length,
    1,
    `${CONFIG_BACKUP_RULE} is not in the block exactly once:\n${after}`,
  );

  // Above the adopter's appended rule rather than below it. The block's extent cannot be read off a
  // blank separator here: this file deliberately has none (that is what makes the adopter's rule the
  // hard case), and with the browser group gated off the backup rule is the payload's last line, so
  // "inside the block" and "above the adopter's rule" are the same statement.
  const header = lines.findIndex((line) => line.includes(GITIGNORE_MARKER));
  const restoredAt = lines.findIndex((line) => line.trim() === CONFIG_BACKUP_RULE);
  const adopterAt = lines.findIndex((line) => line.trim() === adopterBelowBlock);
  assert.ok(
    restoredAt > header && restoredAt < adopterAt,
    `${CONFIG_BACKUP_RULE} landed outside the managed block:\n${after}`,
  );
  assert.ok(
    lines[restoredAt - 1].trim().startsWith('#'),
    `${CONFIG_BACKUP_RULE} came back separated from its comment group:\n${after}`,
  );

  // Neither hand edit moved. The in-block one was put directly under the header and the appended one
  // is still the file's last non-blank line, which is where a merge that ran past the block's end
  // would have put the restored rule instead.
  assert.equal(lines[header + 1], adopterInBlock, `the adopter's in-block rule moved:\n${after}`);
  assert.equal(occurrences(after, adopterInBlock), 1, `the adopter's in-block rule was duplicated:\n${after}`);
  assert.equal(
    lines.filter((line) => line.trim() !== '').at(-1),
    adopterBelowBlock,
    `the restored rule landed past the block, below the adopter's own rule:\n${after}`,
  );
  assert.equal(occurrences(after, adopterBelowBlock), 1, `the adopter's appended rule was duplicated:\n${after}`);

  // What the extended block DOES, which no string search reaches: position is content in an ignore
  // file, and only git says what the resulting rules resolve to.
  assert.deepEqual(
    await ignoredAmong(dir, [CONFIG_BACKUP_PATH]),
    [CONFIG_BACKUP_PATH],
    `${CONFIG_BACKUP_PATH} is still untracked-and-visible in a repository the re-run reported extending`,
  );
  assert.deepEqual(await ignoredAmong(dir, [CONFIG_FILE]), [], `the rule reaches ${CONFIG_FILE}, which is committed`);
});

/**
 * The half of the ignore contract no string search reaches.
 *
 * The test above reads the block's text; this one asks git what the block *does*, and the two are
 * different questions in both directions. A run-control file no rule covers is committed by the
 * first `git add <stateDir>/` — and a committed `STOP` halts every run for everyone who clones, at a
 * step whose own instruction forbids deleting the file. A rule one character too broad takes a
 * committed README with it, which no negation can undo: git cannot re-include a file whose parent
 * directory is excluded. Both are silent, and only git can be asked which of the two the generated
 * rules produced.
 *
 * The kept side is asked over the READMEs the run actually wrote rather than over a list kept here,
 * so a directory added to the tree later is covered without this test being edited — and the paths
 * named individually are checked to exist first, because ignoring a path nothing writes would pass
 * while proving nothing.
 *
 * Its last three fixtures are the *absence* side of the same contract, which no single run can show:
 * the browser group must be missing with the phase off and missing again with the phase on and a
 * mobile driver, and the client env rule must move with a nested `appDir` rather than staying at the
 * root. Each needs its own `init`, so each gets its own fixture rather than a third test.
 */
test('git ignores every run-control artifact and none of the tree that must stay committed', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const mustIgnore = [
    ...RUN_CONTROL_ARTIFACTS.map((name) => `${STATE_DIR}/${name}`),
    // All three of these directories are ignored by their contents, one level down from a README
    // that survives. The clarification entry sits one level deeper than the other two, because a
    // question lives under a `<branch>` subdirectory of the channel.
    `${STATE_DIR}/clarifications/some-branch/question_0.md`,
    `${STATE_DIR}/autonomous_inbox/some-task.md`,
    `${STATE_DIR}/autonomous_logs/run-1.log`,
    // Not a phase's: the worktree bootstrap symlinks this one whatever the phases are, so it is
    // asked for here — in the run with every phase off — rather than only beside the browser group.
    CLIENT_ENV_RULE,
    // The change-request offer's opt-out marker: written by a user's own answer, never committed.
    '.claude/harness-no-offer',
    // The backup `config set` writes before every write. No `config set` has run in this fixture, so
    // this one is asked as a pathname rather than as a file — which is what `ignoredAmong` is for —
    // and it gets no `exists` check. Task 3's fixture asks it with the file really on disk.
    CONFIG_BACKUP_PATH,
  ];
  const ignored = await ignoredAmong(dir, mustIgnore);
  assert.deepEqual(
    mustIgnore.filter((path) => !ignored.includes(path)),
    [],
    'these machine-local paths are not ignored, so one `git add` of the tree would commit them',
  );

  const mustKeep = [
    `${STATE_DIR}/README.md`,
    ...LEDGERS.map((name) => `${STATE_DIR}/${name}`),
    `${STATE_DIR}/story_plans/README.md`,
    // The three that survive by a negation rather than by no rule reaching them.
    `${STATE_DIR}/autonomous_logs/README.md`,
    `${STATE_DIR}/autonomous_inbox/README.md`,
    `${STATE_DIR}/clarifications/README.md`,
    // The control for a backup rule one character too broad: `harness.config.json*` would take the
    // committed configuration with it.
    CONFIG_FILE,
  ];
  for (const path of mustKeep) {
    assert.ok(await exists(dir, path), `${path} is not in the tree init wrote, so asking about it proves nothing`);
  }

  const children = await readdir(join(dir, STATE_DIR), { withFileTypes: true });
  const writtenReadmes = children
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${STATE_DIR}/${entry.name}/README.md`);

  assert.deepEqual(
    await ignoredAmong(dir, [...new Set([...mustKeep, ...writtenReadmes, CLIENT_ENV_EXAMPLE])]),
    [],
    'the ignore rules exclude a file the tree generator commits, and a negation cannot bring back one whose directory is excluded',
  );

  // The anchor control, which neither the presence nor the keep side reaches: an unanchored basename
  // rule matches the same name at every depth, and this is the one observation that tells the two
  // spellings apart. A pathname rather than a file, per `ignoredAmong`'s contract.
  assert.deepEqual(
    await ignoredAmong(dir, [`packages/app/${CONFIG_BACKUP_PATH}`]),
    [],
    `the ${CONFIG_BACKUP_RULE} rule is unanchored, so it reaches a nested package's own backup too`,
  );

  // The browser group is absent here, rules and comments alike: this run has no interactive-test
  // phase, so nothing in it starts an MCP server. Asserted over the whole file rather than over the
  // four rules, because a comment that survived its rules would describe wiring the repository does
  // not have.
  assert.doesNotMatch(text(dir, GITIGNORE_FILE), QA_ARTIFACT_SPELLINGS, 'the browser group survived the phase being off');

  // And absent with the phase ON and a mobile driver, which is the gate's whole point: the mobile
  // interactive-test variants ship declared-not-implemented with built-ins-only allowlists, so no
  // server ever starts to write any of these paths.
  const mobile = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(mobile, ['--qa', '--qa-driver', QA_DRIVER_CHOSEN]);
  assert.doesNotMatch(
    text(mobile, GITIGNORE_FILE),
    QA_ARTIFACT_SPELLINGS,
    'the browser group was written for a driver that starts no browser',
  );

  // The client env rule moves with `appDir`, because what is ignored is the file the config names
  // and not a fixed location: in a repository that nests its application, the root `.env` is not the
  // machine-local file and stays committable.
  const nested = await fixtureFor(t, { files: nodeProjectFiles(), dirs: [NESTED_APP_DIR] });
  await initOk(nested, ['--app-dir', NESTED_APP_DIR]);
  assert.deepEqual(await ignoredAmong(nested, [`${NESTED_APP_DIR}/${CLIENT_ENV_RULE}`]), [
    `${NESTED_APP_DIR}/${CLIENT_ENV_RULE}`,
  ]);
  assert.deepEqual(
    await ignoredAmong(nested, [`${NESTED_APP_DIR}/${CLIENT_ENV_EXAMPLE}`, CLIENT_ENV_RULE]),
    [],
    'the nested-appDir rule reaches the committed example sibling, or the repository root, or both',
  );
});

test('stack detection maps each seeded layout to its preset', async (t) => {
  const cases = [
    {
      name: 'monorepo',
      seed: { files: { 'package.json': { name: 'fixture', private: true, workspaces: ['packages/*'] } } },
      signal: 'monorepo:workspaces-key',
    },
    {
      name: 'layered-clean-arch',
      seed: { dirs: ['src/data', 'src/domain', 'src/presentation'] },
      signal: 'layered-clean-arch:layer-directories',
      layers: ['data', 'domain', 'presentation', 'general'],
    },
    {
      name: 'python-package',
      seed: { files: { 'pyproject.toml': '[project]\nname = "fixture"\n' } },
      signal: 'python-package:packaging-manifest',
    },
    // Finding 47: a layered tree rooted at `internal/` reported the same one-row catch-all profile an
    // empty repository gets, because `internal` was not a candidate root. `layerPaths` is what makes
    // this case prove the fix — the layer *names* alone pass on the `src/`-rooted case above.
    {
      name: 'layered-clean-arch',
      subject: 'layered under internal/',
      seed: { dirs: ['internal/data', 'internal/domain', 'internal/presentation'] },
      signal: 'layered-clean-arch:layer-directories',
      layers: ['data', 'domain', 'presentation', 'general'],
      layerPaths: ['internal/data', 'internal/domain', 'internal/presentation', '.'],
    },
    { name: 'api-service', seed: { dirs: ['src/routes'] }, signal: 'api-service:route-directory' },
    { name: 'flat', seed: { files: { 'README.md': '# fixture\n' } }, signal: 'flat:fallback' },
    // Finding 47's regression control, and the reason this case is not the one above simplified away:
    // `pkg/` became a candidate root, and a Go-shaped tree carrying no layered directory name anywhere
    // must still fall back to `flat`.
    {
      name: 'flat',
      subject: 'pkg/ present but nothing layered',
      seed: { dirs: ['pkg/csv', 'cmd', 'tools'], files: { 'README.md': '# fixture\n' } },
      signal: 'flat:fallback',
      layers: ['general'],
    },
  ];

  for (const testCase of cases) {
    // `subject` names the layout when two rows detect the same preset, so the subtests stay distinct.
    await t.test(testCase.subject ?? testCase.name, async (subtest) => {
      const dir = await fixtureFor(subtest, testCase.seed);

      const { stdout, stderr } = await initOk(dir);
      const config = readJson(join(dir, CONFIG_FILE));

      assert.ok(
        stdout.includes(`detected the \`${testCase.name}\` layer preset (signal ${testCase.signal}`),
        `detection did not report ${testCase.signal}:\n${stdout}`,
      );
      // The same two facts, now in the file the adopter commits rather than only in a line that
      // scrolled past: what the run reported and what it recorded cannot drift. Read off the case
      // table, so a row added here is asserted without editing this.
      assert.deepEqual(
        [config.detection?.preset, config.detection?.signal],
        [testCase.name, testCase.signal],
        `the generated config did not record what this run detected: ${JSON.stringify(config.detection)}`,
      );
      if (testCase.layers !== undefined) {
        assert.deepEqual(
          config.layers.map((layer) => layer.name),
          testCase.layers,
        );
      }
      // Where the case states them: the directories the layers actually point at. A name list is the
      // same on every root, so only this catches a profile built from the wrong candidate root.
      if (testCase.layerPaths !== undefined) {
        assert.deepEqual(
          config.layers.map((layer) => layer.path),
          testCase.layerPaths,
        );
      }
      if (testCase.name === 'flat') {
        assert.match(stderr, /unrecognised layout/);
        assert.match(stderr, /\/autonomous-sdlc-harness:harness-analyze/);
        // The fallback row's own evidence string, which is what turns "nothing matched" into a
        // recorded fact instead of an absence a later reader has to guess at.
        assert.equal(config.detection.evidence, 'no signal matched');
      }
    });
  }
});

/** The uncovered-directory note's own opening clause — the one spelling either command reports it by. */
const GAP_NOTE = 'covered by no layer';

/** The two remedy leads, so a case can assert which arm composed the sentence it read. */
const CONFIG_SET_LAYERS = 'config set layers';
const ANALYZE_FIRST_REMEDY = 'run `/autonomous-sdlc-harness:harness-analyze` in a session here and answer `skip`';

/** A directory an adopter adds beside the ones the preset wrote rows for, per fixture shape. */
const API_DRIFTED_DIR = 'src/handlers';
const FLUTTER_DRIFTED_DIR = 'test';

/** The three source directories the layered row matches on — the fully covered fixture's seed. */
const GAP_LAYERED_DIRS = Object.freeze(['src/data', 'src/domain', 'src/presentation']);

/**
 * A minimal `pubspec.yaml`, enough for the `flutter` row to match.
 *
 * The Flutter shape is the recorded-review fixture because its `tests` row is written only where the
 * test root already exists (`detect/presets.ts`, `PRESET_TEST_ROOTS`): a `test/` created after the
 * first run is therefore uncovered by the profile in the file the second run keeps, which is exactly
 * the population that carries a `detection.review`.
 */
const GAP_PUBSPEC = 'name: fixture\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\n';

/** The record `/autonomous-sdlc-harness:harness-analyze layers` writes, in the shape `config set detection.review` takes. */
const REVIEW_VERDICT = 'considered-no-change';
const REVIEW_DATE = '2026-08-01';

/** The line carrying {@link GAP_NOTE}, from either command's output. */
function gapLine(output) {
  const line = output.split('\n').find((entry) => entry.includes(GAP_NOTE));
  assert.ok(line, `no uncovered-directory line in:\n${output}`);
  return line;
}

/**
 * The directories a gap line listed, read back off the emitted text.
 *
 * Parsed rather than substring-matched for `doctor`'s own reason: every covered path a case asserts
 * the absence of is a substring of the one it asserts the presence of, so an `includes` test would
 * be green whatever was listed. Split on the verb-agnostic tail, since the sentence conjugates on
 * how many directories it names.
 */
function gapDirs(line) {
  const [, listed] = line.split(' to the catch-all: ');
  assert.ok(listed, `the line does not carry the list segment this test reads:\n${line}`);
  return listed.split(' — ')[0].split(', ');
}

/**
 * `init` reports the uncovered source directories `doctor`'s `layer-drift` check reports.
 *
 * **The subject is the asymmetry, not the set.** The set is `core/layerCoverage.ts`'s and is graded
 * by `doctor`'s own tests; what these cases establish is that an adopter who reads `init` and never
 * runs `doctor` learns the same thing, in the same terms and with the same remedies — case (a) runs
 * both commands against one fixture and compares what each named.
 *
 * **The catch-all-only case is here as the state this line must stay silent about**: every directory
 * would qualify there, `layerCoverage` does not grade it, and `buildPreset` already says so once.
 */
test('init names the source directories no layer covers, as doctor does', async (t) => {
  await t.test('an api-service tree with a directory beside its routes: both commands name it', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles(), dirs: ['src/routes', API_DRIFTED_DIR] });

    const { stdout } = await initOk(dir);

    const note = gapLine(stdout);
    assert.deepEqual(gapDirs(note), [API_DRIFTED_DIR], `init named something other than the drifted directory:\n${note}`);
    // No record, so the standing remedy: the session that reads the code, in the spelling that does
    // not rewrite every already-filled document.
    assert.ok(note.includes(ANALYZE_FIRST_REMEDY), `init's note does not carry the standing remedy:\n${note}`);
    assert.ok(note.includes(CONFIG_SET_LAYERS), `init's note does not name what applies a profile:\n${note}`);
    assert.ok(note.includes('layer-drift'), `init's note does not point at the check that reports the same set:\n${note}`);

    // The half this test exists for: the other command, over the same repository, naming the same
    // set with the same remedy rather than a second wording of it.
    const doctor = await runCli(dir, ['doctor']);
    assert.equal(doctor.status, 0, `doctor exited ${doctor.status}\n${doctor.stdout}\n${doctor.stderr}`);
    const warning = gapLine(doctor.stderr);
    assert.deepEqual(gapDirs(warning), gapDirs(note), `the two commands named different directories:\n${note}\n${warning}`);
    assert.ok(warning.includes(ANALYZE_FIRST_REMEDY), `doctor's warning carries a different remedy:\n${warning}`);
  });

  await t.test('a layered tree whose profile covers every candidate: no note', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles(), dirs: [...GAP_LAYERED_DIRS] });

    const { stdout } = await initOk(dir);

    assert.ok(!stdout.includes(GAP_NOTE), `init reported a gap in a fully covered profile:\n${stdout}`);
  });

  await t.test('a catch-all-only profile: this line stays silent, because nothing is graded', async (subtest) => {
    const dir = await fixtureFor(subtest, {
      files: { 'package.json': { name: 'fixture', private: true, workspaces: ['packages/*'] }, 'README.md': '# fixture\n' },
      dirs: ['packages/api'],
    });

    const { stdout } = await initOk(dir);

    // Every directory would qualify against a profile that is one catch-all row, so the report would
    // be the whole tree — the state `buildPreset` already reports once, as itself.
    assert.ok(!stdout.includes(GAP_NOTE), `init reported coverage against a catch-all-only profile:\n${stdout}`);
  });

  await t.test('--dry-run prints the same note, since it states what was detected', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles(), dirs: ['src/routes', API_DRIFTED_DIR] });
    const before = await snapshotTree(dir);

    const dry = await initOk(dir, ['--dry-run']);

    assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
    assert.deepEqual(gapDirs(gapLine(dry.stdout)), [API_DRIFTED_DIR]);
  });

  await t.test('a kept config carrying a recorded review: the note names it and leads with config set layers', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: { 'pubspec.yaml': GAP_PUBSPEC, 'lib/main.dart': 'void main() {}\n' } });
    await initOk(dir);
    // The two hand edits an adopter's own repository makes between runs: a directory added after the
    // profile was written, and the record `/autonomous-sdlc-harness:harness-analyze layers` leaves behind.
    mkdirSync(join(dir, FLUTTER_DRIFTED_DIR), { recursive: true });
    editConfig(dir, (config) => {
      config.detection.review = { verdict: REVIEW_VERDICT, at: REVIEW_DATE };
    });

    // A re-run keeps that file, so the note is derived from the config in effect rather than from
    // the profile this run generated and discarded.
    const { stdout } = await initOk(dir);

    const note = gapLine(stdout);
    assert.deepEqual(gapDirs(note), [FLUTTER_DRIFTED_DIR], `init named something other than the added directory:\n${note}`);
    assert.ok(note.includes(`verdict \`${REVIEW_VERDICT}\``), `the note does not name the recorded verdict:\n${note}`);
    assert.ok(note.includes(`recorded ${REVIEW_DATE}`), `the note does not name the date the review was recorded:\n${note}`);
    // Finding 73: the standing remedy sends a repository that has already recorded a decision to the
    // command that re-derives it. Here the direct route leads, and analyze is named only under the
    // one condition that makes re-running it worth anything.
    assert.ok(
      !note.includes(ANALYZE_FIRST_REMEDY),
      `the note tells an adopter with a recorded review to re-derive the same decision:\n${note}`,
    );
    assert.ok(
      note.indexOf(CONFIG_SET_LAYERS) < note.indexOf('/autonomous-sdlc-harness:harness-analyze', note.indexOf(GAP_NOTE)),
      `the remedy does not lead with the route that needs no session:\n${note}`,
    );
  });

  await t.test('a review carrying nothing but its verdict: no absent field reaches the output', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: { 'pubspec.yaml': GAP_PUBSPEC, 'lib/main.dart': 'void main() {}\n' } });
    await initOk(dir);
    mkdirSync(join(dir, FLUTTER_DRIFTED_DIR), { recursive: true });
    editConfig(dir, (config) => {
      config.detection.review = { verdict: REVIEW_VERDICT };
    });

    const { stdout } = await initOk(dir);

    const note = gapLine(stdout);
    assert.ok(note.includes(`verdict \`${REVIEW_VERDICT}\``), `the note does not name the recorded verdict:\n${note}`);
    assert.ok(!note.includes(', recorded '), `the note claims a date the record does not carry:\n${note}`);
    assert.ok(!note.includes('undefined'), `an absent optional field reached the adopter:\n${note}`);
  });
});

test('--preset overrides what the signal table would have detected', async (t) => {
  // Both signals are present, and the workspaces key wins by table order — so the layered layers
  // in the generated config can only have come from the flag.
  const seed = {
    files: { 'package.json': { name: 'fixture', private: true, workspaces: ['packages/*'] } },
    dirs: ['src/data', 'src/domain', 'src/presentation'],
  };

  const detected = await fixtureFor(t, seed);
  await initOk(detected);
  assert.deepEqual(readJson(join(detected, CONFIG_FILE)).layers.map((layer) => layer.name), ['general']);

  const forced = await fixtureFor(t, seed);
  const { stdout } = await initOk(forced, ['--preset', 'layered-clean-arch']);
  const forcedConfig = readJson(join(forced, CONFIG_FILE));
  assert.deepEqual(
    forcedConfig.layers.map((layer) => layer.name),
    ['data', 'domain', 'presentation', 'general'],
  );
  assert.match(stdout, /--preset selected the `layered-clean-arch` layer preset/);

  // The record says the table was bypassed rather than naming a row that was never tested, and it
  // carries **no** `evidence` key — absent, not present-and-undefined. That absence is the whole
  // property: it is how a reader of the adoption commit tells a forced preset from a detected one,
  // and the seed above would have matched a row had one been evaluated.
  assert.equal(forcedConfig.detection.signal, 'forced');
  assert.equal(
    Object.hasOwn(forcedConfig.detection, 'evidence'),
    false,
    `a forced preset evaluated no signal row, so there is nothing to record: ${JSON.stringify(forcedConfig.detection)}`,
  );
});

/**
 * The command family is selected independently of the layer preset, so `detection.preset` says
 * nothing about which manifest supplied `commands.*`. Without this key that answer lived only in the
 * run's own scrollback, and an adopted repository could not say why its commands read as they do.
 *
 * All three arms are needed. The second is the one that fails if the key is written unconditionally,
 * since a `commandFamily: null` would claim a family answered and none did. The third is the middle
 * case the two extremes miss: a family *answers* off any command set, so a winner can sit beside two
 * placeholder verification commands — the state the key's description in `model.ts`, the schema and
 * `docs/config.md` all tell a reader cannot occur, which is why the key is written on a derived
 * required key rather than on a winner existing.
 */
test('the config records which command family derived the commands, and omits the key when none did', async (t) => {
  const resolved = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(resolved);
  assert.equal(
    readJson(join(resolved, CONFIG_FILE)).detection.commandFamily,
    'npm',
    'the npm manifest resolved the commands, and the config does not say so',
  );

  // No manifest at all: every family declines and both required keys stay placeholders.
  const unresolved = await fixtureFor(t, { files: { 'README.md': '# fixture\n' } });
  await initOk(unresolved);
  const { detection } = readJson(join(unresolved, CONFIG_FILE));
  assert.equal(
    Object.hasOwn(detection, 'commandFamily'),
    false,
    `no family answered, so there is nothing to record: ${JSON.stringify(detection)}`,
  );

  // A manifest declaring `build` alone: `npm` answers — `nodeCommands` returns a command set — but
  // derives neither required key, so recording it would name a source for two placeholders.
  const partial = await fixtureFor(t, {
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { build: 'echo build' } },
      'README.md': '# fixture project\n',
    },
  });
  await initOk(partial);
  const partialConfig = readJson(join(partial, CONFIG_FILE));
  for (const key of ['typecheck', 'test']) {
    assert.match(
      partialConfig.commands[key],
      new RegExp(`^<configure this: set commands\\.${key}>$`),
      `this seed is meant to leave both required commands as placeholders: ${JSON.stringify(partialConfig.commands)}`,
    );
  }
  assert.equal(
    Object.hasOwn(partialConfig.detection, 'commandFamily'),
    false,
    `the winning family derived neither required command, so naming it beside two placeholders is the state the key's description rules out: ${JSON.stringify(partialConfig.detection)}`,
  );
});

/**
 * The React Native shape F66 measured: three manifest families collide at the repository root, `npm`
 * answers, `bundler` reads the fastlane `Gemfile` and declines, and the Android project sits outside
 * `manifestRoots` so neither Android family reaches it (`test/stack-presets.test.mjs` asserts the
 * profile this seed produces).
 */
function collidingManifestFiles() {
  return {
    ...nodeProjectFiles(),
    Gemfile: "source 'https://rubygems.org'\n\ngem 'fastlane'\n",
    'android/build.gradle.kts': 'plugins { id("com.android.application") }\n',
  };
}

/** The lines the `stack detection` step printed: everything under its heading, up to the next one. */
function stackDetectionStep(stdout) {
  const lines = stdout.split('\n');
  const from = lines.indexOf('== stack detection');
  assert.notEqual(from, -1, `the run printed no stack detection step:\n${stdout}`);
  const rest = lines.slice(from + 1);
  const to = rest.findIndex((line) => line.startsWith('== '));
  return to === -1 ? rest : rest.slice(0, to);
}

/**
 * F66's own probe, verbatim: a grep of an init capture for any manifest or family name. It returned
 * zero lines, because the step reported the layer half alone.
 */
const F66_PROBE = /gemfile|gradle|npm|package\.json/i;

/**
 * The `stack detection` step reports **both** halves of detection: the layer preset, and what
 * answered for the commands.
 *
 * The two halves are decided independently, so a repository whose layer table falls back while a
 * family answers off the root manifest was told only the pessimistic half. Asserted over the step's
 * own lines rather than over the whole capture, so a match cannot come from a wrapper row printed
 * three steps later.
 */
test('the stack detection step names what answered for the commands, not only the layer preset', async (t) => {
  await t.test('a colliding root names the winning family and the manifest that family read', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: collidingManifestFiles() });

    const { stdout } = await initOk(dir);
    const step = stackDetectionStep(stdout);
    const line = step.find((candidate) => candidate.includes('command family'));
    assert.ok(line !== undefined, `the step named no command source:\n${step.join('\n')}`);

    // The winner's **own** recorded manifest, not merely a string that appears in `readManifests`:
    // the two lists are ordered by different tables, so a positional pick would print `Gemfile` here.
    assert.match(line, /came from the `npm` command family, which read `package\.json`/);
    assert.doesNotMatch(line, /Gemfile/, `the step paired the winner with another manifest:\n${line}`);
    // The collision is stated as a count with the detail left to the note, and the note is raised.
    assert.match(line, /1 other manifest init reads is present too/);
    assert.equal(
      notesBlock(stdout).filter((note) => note.includes('carries more than one manifest init reads')).length,
      1,
      `the line points at a tiebreak note this run did not raise:\n${stdout}`,
    );

    // The finding's own measurement, re-run: the step now answers it.
    assert.ok(
      step.some((candidate) => F66_PROBE.test(candidate)),
      `F66's probe still returns nothing from the detection step:\n${step.join('\n')}`,
    );
  });

  await t.test('a repository with no manifest at all names the roots that were searched', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: { 'README.md': '# fixture\n' } });

    const { stdout } = await initOk(dir);
    const line = stackDetectionStep(stdout).find((candidate) => candidate.includes('command family'));
    assert.ok(line !== undefined, `the step named no command source:\n${stdout}`);

    // `searchedRoots`' own vocabulary — `.` is spelled as the repository root — and no family named,
    // because none answered.
    assert.match(line, /no command family answered: no manifest init reads is present in the repository root/);
    assert.match(line, /commands\.typecheck and commands\.test carry placeholders/);
  });

  /**
   * The ordinary state of every adopted repository: a second `init` keeps the config, so it wrote no
   * command key and `profile.notes` — the tiebreak note's only channel — is dropped. Both of the
   * line's claims have to follow, and the last assertion is the one that reproduces the F66 class of
   * escape: the line and the notes block must agree about whether a tiebreak note exists.
   */
  await t.test('a kept re-run claims neither what was written nor a note it does not print', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: collidingManifestFiles() });

    await initOk(dir);
    const { stdout } = await initOk(dir);
    const line = stackDetectionStep(stdout).find((candidate) => candidate.includes('command family'));
    assert.ok(line !== undefined, `the step named no command source:\n${stdout}`);

    // Still names the source — the half that is a detection fact and stays true.
    assert.match(line, /the `npm` command family, which read `package\.json`/);
    // But claims nothing about what the two keys hold: this run wrote neither.
    assert.doesNotMatch(line, /came from/, `a kept re-run asserted what a key was written as:\n${line}`);
    // And points at no tiebreak note, because this run publishes none.
    assert.doesNotMatch(line, /tiebreak note/, `the line points at a note on a kept re-run:\n${line}`);
    assert.deepEqual(
      notesBlock(stdout).filter((note) => note.includes('carries more than one manifest init reads')),
      [],
      `a kept re-run published the tiebreak note after all, so the line should point at it:\n${stdout}`,
    );
  });

  /**
   * The line reports what the winner **resolved**, not that a winner exists: a family answers off a
   * command set, which is not the two required keys. On this seed it answers off `build` alone, so a
   * line naming both keys would contradict the two placeholder warnings the same run prints — which
   * is what the last assertion here pins.
   */
  await t.test('a family that derived neither required key is not named as their source', async (subtest) => {
    const dir = await fixtureFor(subtest, {
      files: {
        'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { build: 'echo build' } },
        'README.md': '# fixture project\n',
      },
    });

    const { stdout, stderr } = await initOk(dir);
    const line = stackDetectionStep(stdout).find((candidate) => candidate.includes('command family'));
    assert.ok(line !== undefined, `the step named no command source:\n${stdout}`);

    assert.match(
      line,
      /neither commands\.typecheck nor commands\.test was derived by the `npm` command family, which read `package\.json`/,
    );
    assert.doesNotMatch(line, /came from/, `the line claimed a source for a key npm did not derive:\n${line}`);
    assert.equal(
      warningLines(stderr).filter((warning) => warning.includes('could not be detected')).length,
      2,
      `the line and the run's own warnings disagree about the two required keys:\n${line}\n${stderr}`,
    );
  });

  await t.test('--dry-run prints the same line, since it states what was detected', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: collidingManifestFiles() });

    const dry = await initOk(dir, ['--dry-run']);
    const real = await initOk(dir);

    assert.deepEqual(
      stackDetectionStep(dry.stdout).filter((line) => line.includes('command family')),
      stackDetectionStep(real.stdout).filter((line) => line.includes('command family')),
      'the dry run reported a different command source from the real run over the same fixture',
    );
  });
});

/** The notes block's entries: the `- ` bullets between the `notes` heading and the heading after it. */
function notesBlock(stdout) {
  const lines = stdout.split('\n');
  const from = lines.indexOf('== notes');
  assert.notEqual(from, -1, `the run printed no notes block:\n${stdout}`);
  const rest = lines.slice(from + 1);
  const to = rest.findIndex((line) => line.startsWith('== '));
  return (to === -1 ? rest : rest.slice(0, to)).filter((line) => line.startsWith('- '));
}

/**
 * Detection's note channel is a channel and nothing more: it carries no line of its own, and each
 * phase reports only what it raised.
 *
 * **The count is asserted against a second run of the same fixture rather than against a literal
 * list**, because every later change that gives detection or preset building a note to raise adds an
 * entry to *both* sides — so this stays an assertion about the channel instead of a list to re-edit
 * whenever the CLI gains a note. It is paired with the duplicate check, which is the one that fails
 * on the bug the drain discipline exists to prevent: a note left undrained at one of `detectPreset`'s
 * two return points is re-reported by the next phase, and shows up here as the same entry twice.
 *
 * Nothing here pins *which* lists seed the block. `writeHarnessConfig` discards the generated config
 * on a kept re-run, so the two detection lists are gated on that later; an assertion naming them as
 * unconditional would have to be deleted then.
 */
test('the detection note channel adds no entry of its own, and no note is reported twice', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  const reference = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir);
  const notes = notesBlock(stdout);
  const expected = notesBlock((await initOk(reference)).stdout);

  assert.ok(notes.length > 0, `the fixture reports no notes at all, so the count asserts nothing:\n${stdout}`);
  assert.equal(notes.length, expected.length, `the notes block gained or lost an entry:\n${stdout}`);
  assert.deepEqual(
    notes.filter((note, index) => notes.indexOf(note) !== index),
    [],
    `a note reached the block twice, so a phase re-reported one it did not raise:\n${stdout}`,
  );
});

/** The npm lockfile, spelled out here rather than imported — choice 3 in the module header. */
const LOCKFILE_NAME = 'package-lock.json';

/** The workspace-tool manifest a pnpm workspace declares itself through, and never the npm key. */
const PNPM_WORKSPACE_MANIFEST = 'pnpm-workspace.yaml';

/**
 * A repository whose application nests under `appDir`: the root manifest the script-derived commands
 * still come from, plus the application's own manifest.
 *
 * @param {object} [options]
 * @param {boolean} [options.rootManifest] keep the root manifest. Set false for the repository whose
 *   **only** npm manifest is the application's — the shape that reaches no command family at all.
 * @param {boolean} [options.workspaces] declare `workspaces` on the root manifest — one of the two
 *   ways into the carve-out.
 * @param {string} [options.workspaceManifest] write this workspace-tool manifest at the root — the
 *   other way in, and the one a repository reaches **without** the npm key.
 * @param {string} [options.lockfileAt] the repo-relative directory a `package-lock.json` sits in;
 *   omitted for the fixture that has none. Which directory holds it is the whole choice between
 *   `ci` and `install`, so it is the discriminator the cases below move.
 */
function nestedAppFiles({ rootManifest = true, workspaces = false, workspaceManifest, lockfileAt } = {}) {
  const root = nodeProjectFiles();
  const files = {
    ...root,
    'package.json': workspaces ? { ...root['package.json'], workspaces: ['packages/*'] } : root['package.json'],
    [`${NESTED_APP_DIR}/package.json`]: { name: 'storefront', private: true, version: '0.0.0' },
  };
  if (!rootManifest) delete files['package.json'];
  if (workspaceManifest !== undefined) files[workspaceManifest] = 'packages:\n  - packages/*\n';
  if (lockfileAt !== undefined) {
    const at = lockfileAt === '.' ? LOCKFILE_NAME : `${lockfileAt}/${LOCKFILE_NAME}`;
    files[at] = { name: 'fixture-project', lockfileVersion: 3, requires: true, packages: {} };
  }
  return files;
}

/** The notes naming the dependency-install key, whichever wording the run chose for them. */
function depInstallNotes(stdout) {
  return notesBlock(stdout).filter((note) => note.includes('depInstall'));
}

/**
 * `commands.depInstall` is derived from the manifest that was actually found, `--prefix`-anchored
 * when that manifest is not the repository root's.
 *
 * **The network half is deliberately not exercised.** `npm --prefix packages/storefront ci` needs a
 * registry and a throwaway fixture has none, so the anchoring is asserted by construction instead:
 * the generated line names the application directory, and the lockfile *beside that manifest* is what
 * chose the verb — which the second case shows by taking it away and watching `ci` become `install`.
 */
test('commands.depInstall follows the manifest it was derived from', async (t) => {
  await t.test('nested, with a lockfile beside the nested manifest', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nestedAppFiles({ lockfileAt: NESTED_APP_DIR }) });

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    assert.equal(readJson(join(dir, CONFIG_FILE)).commands.depInstall, `npm --prefix ${NESTED_APP_DIR} ci`);
    assert.equal(
      depInstallNotes(stdout).filter((note) => note.includes(`${NESTED_APP_DIR}/package.json`)).length,
      1,
      `the run did not name the manifest depInstall came from:\n${stdout}`,
    );
  });

  await t.test('nested, with no lockfile beside the nested manifest', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nestedAppFiles() });

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    // Same tree, same anchor, different verb: the root has no lockfile either, so a value read from
    // the root would be `npm install` too — the `--prefix` is what makes this case falsifiable.
    assert.equal(readJson(join(dir, CONFIG_FILE)).commands.depInstall, `npm --prefix ${NESTED_APP_DIR} install`);
    assert.equal(depInstallNotes(stdout).length, 1, `the anchored value was not reported:\n${stdout}`);
  });

  await t.test('nested, with no manifest at the repository root at all', async (subtest) => {
    // The repository whose only npm manifest is the application's: the node family's root-manifest
    // gate never opens, so no family resolves anything and the install has to come from the fallback.
    // Absent, it is the silent no-install — nothing is installed into the worktrees the flow cuts and
    // no line of output says so.
    const dir = await fixtureFor(subtest, {
      files: nestedAppFiles({ rootManifest: false, lockfileAt: NESTED_APP_DIR }),
    });

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    const { commands } = readJson(join(dir, CONFIG_FILE));
    assert.equal(commands.depInstall, `npm --prefix ${NESTED_APP_DIR} ci`);
    assert.equal(
      depInstallNotes(stdout).filter((note) => note.includes(`${NESTED_APP_DIR}/package.json`)).length,
      1,
      `the run did not name the manifest depInstall came from:\n${stdout}`,
    );
    // The gate itself is untouched: a script name still resolves against the root manifest only, so
    // both script-derived keys stay placeholders rather than being derived from the nested manifest.
    for (const key of ['typecheck', 'test']) {
      assert.match(commands[key], /configure this/, `commands.${key} was derived from the nested manifest`);
    }
  });

  await t.test('a workspaces root keeps the root install', async (subtest) => {
    // One lockfile at the root and a manifest per package is the workspaces shape: the root `npm ci`
    // installs every member, and the anchored form would fail for want of a lockfile to install from.
    const dir = await fixtureFor(subtest, { files: nestedAppFiles({ workspaces: true, lockfileAt: '.' }) });

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    assert.equal(readJson(join(dir, CONFIG_FILE)).commands.depInstall, 'npm ci');
    assert.deepEqual(depInstallNotes(stdout), [], `the carve-out reported an anchoring it did not do:\n${stdout}`);
  });

  await t.test('a workspace-manifest root with no workspaces key keeps the root install', async (subtest) => {
    // The same shape reached the other way: a pnpm workspace declares itself in `pnpm-workspace.yaml`
    // and never sets the npm key, so a carve-out testing only that key would anchor this one at a
    // member that has no lockfile to install from.
    const dir = await fixtureFor(subtest, {
      files: nestedAppFiles({ workspaceManifest: PNPM_WORKSPACE_MANIFEST, lockfileAt: '.' }),
    });

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    assert.equal(readJson(join(dir, CONFIG_FILE)).commands.depInstall, 'npm ci');
    assert.deepEqual(depInstallNotes(stdout), [], `the carve-out reported an anchoring it did not do:\n${stdout}`);
  });

  await t.test('a repository that is its own application is untouched', async (subtest) => {
    // The regression gate for every adopter at `appDir: "."`: the value stays the root-derived one
    // and nothing is added to the notes block, so this task re-wires no flat repository.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir);

    assert.equal(readJson(join(dir, CONFIG_FILE)).commands.depInstall, 'npm install');
    assert.deepEqual(depInstallNotes(stdout), [], `a flat repository gained a depInstall note:\n${stdout}`);
  });
});

/**
 * The three layer directories of an application that nests under {@link NESTED_APP_DIR}, which are
 * also what the generated config's `layers[].path` names — so a rebuild that forgot the application
 * directory produces three different strings rather than three missing ones.
 */
const NESTED_LAYER_PATHS = ['data', 'domain', 'presentation'].map((layer) => `${NESTED_APP_DIR}/src/${layer}`);

/**
 * A repository whose layered application nests, with **nothing** at the root that any signal above
 * the fallback matches — so detection pointed at the root answers `flat`, and the two answers are
 * distinguishable in one line of output.
 */
function nestedLayeredFixture() {
  return { files: nodeProjectFiles(), dirs: NESTED_LAYER_PATHS };
}

/** An `appDir` outside the repository, and one inside it that names no directory. */
const OUTSIDE_APP_DIR = '../outside';
const MISSING_APP_DIR = 'packages/not-there';

/** Hand-edit the configured `appDir`, the way an adopter or a bad merge would. */
function writeAppDir(dir, value) {
  const config = readJson(join(dir, CONFIG_FILE));
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify({ ...config, appDir: value }, null, 2)}\n`, 'utf8');
}

/** The rung-2 note — detection took its directory from the file rather than from the command line. */
function configuredAppDirNotes(stdout) {
  const notes = stdout.includes('== notes') ? notesBlock(stdout) : [];
  return notes.filter((note) => note.includes(`the appDir ${CONFIG_FILE} already declares`));
}

/** The detection line, as the run reports it — the one observable that names the tree probed. */
function detectionLine(stdout) {
  const line = stdout.split('\n').find((candidate) => candidate.includes('layer preset'));
  assert.ok(line !== undefined, `the run printed no detection line:\n${stdout}`);
  return line;
}

/**
 * Detection resolves its `appDir` as `--app-dir`, then the configured value, then `.` — the order
 * both JSDoc blocks on the receiving end already documented, and which the sole `detectPreset` call
 * did not implement.
 *
 * **The five arms are one case because they are one resolution order**, and each is a rung or the
 * screen in front of one. The fixture is the same nested tree throughout: pointed at the application
 * it answers `layered-clean-arch`, pointed at the root it answers `flat`, so *which directory was
 * probed* is readable off a single line of output rather than inferred.
 *
 * **`source` is asserted through what the run says, which is all a subprocess can see.** The flag rung
 * is silent, the configured rung carries the note, and a configured value that fell back to the root
 * carries the warning instead of the note — so arm (c)'s `--app-dir .` and arm (d)'s fallback, which
 * hand detection the same string, are still told apart here.
 */
test('detection resolves appDir as --app-dir, then the configured value, then the repository root', async (t) => {
  await t.test('a re-run detects the tree the config declares', async (subtest) => {
    const dir = await fixtureFor(subtest, nestedLayeredFixture());

    const first = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);
    assert.match(detectionLine(first.stdout), /detected the `layered-clean-arch` layer preset/);
    const before = await snapshotTree(dir);

    const { stdout, stderr } = await initOk(dir);

    // The half of the finding a plain re-run used to fail: the run reported an unrecognised layout
    // and the layers of the kept config in the same output, one read from each of two trees.
    assert.match(detectionLine(stdout), /detected the `layered-clean-arch` layer preset/);
    assert.ok(!stdout.includes('flat:fallback'), `the re-run detected the root's layout:\n${stdout}`);
    assert.ok(!/unrecognised layout/.test(stderr), `the re-run warned about a tree it never probed:\n${stderr}`);
    assert.equal(configuredAppDirNotes(stdout).length, 1, `the re-run did not say where appDir came from:\n${stdout}`);
    assert.deepEqual(await snapshotTree(dir), before, 'the re-run changed the tree');
  });

  await t.test('--reset-config keeps the application directory and re-derives the layers under it', async (subtest) => {
    const dir = await fixtureFor(subtest, nestedLayeredFixture());

    await initOk(dir, ['--app-dir', NESTED_APP_DIR]);
    const generated = readJson(join(dir, CONFIG_FILE));
    assert.equal(generated.appDir, NESTED_APP_DIR);

    // No flags: the start-over path as the tool prescribes it, which used to collapse appDir to `.`
    // and re-point every layer scope at the repository root without a line saying so.
    const { stdout } = await initOk(dir, ['--reset-config']);

    const rebuilt = readJson(join(dir, CONFIG_FILE));
    assert.equal(rebuilt.appDir, NESTED_APP_DIR);
    assert.deepEqual(rebuilt.layers, generated.layers);
    for (const path of NESTED_LAYER_PATHS) {
      assert.ok(
        rebuilt.layers.some((layer) => layer.path === path),
        `the rebuilt config lost the layer at ${path}:\n${JSON.stringify(rebuilt.layers)}`,
      );
    }
    assert.match(stdout, /appDir is re-read from the file being rebuilt/);
  });

  await t.test('--reset-config over a config that cannot be read warns and claims no re-read', async (subtest) => {
    const dir = await fixtureFor(subtest, nestedLayeredFixture());
    await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    // The state `--reset-config` is the documented repair for, and the one the note used to be
    // false on: a hand edit or a bad merge leaves a file that is there and parses as nothing, so
    // rung 2 answers no appDir at all and detection probes the root.
    writeFileSync(join(dir, CONFIG_FILE), '{ "version": 1, "broken"\n', 'utf8');

    const { stdout, stderr } = await initOk(dir, ['--reset-config']);

    assert.equal(readJson(join(dir, CONFIG_FILE)).appDir, '.', 'the rebuild recovered an appDir from an unreadable file');
    assert.match(stderr, /could not be read/);
    assert.ok(stderr.includes('--app-dir'), `the warning did not name the way to state the right one:\n${stderr}`);
    // The half the adopter acts on: nothing may claim the application directory survived, and the
    // note names the directory the layer scopes were actually derived under.
    assert.doesNotMatch(stdout, /re-read from the file being rebuilt/, `the note claimed an appDir re-read it did not perform:\n${stdout}`);
    assert.match(stdout, /appDir is "\." — the repository root/);
  });

  await t.test('--app-dir overrides the configured value', async (subtest) => {
    const dir = await fixtureFor(subtest, nestedLayeredFixture());
    await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    const { stdout, stderr } = await initOk(dir, ['--app-dir', '.']);

    assert.match(detectionLine(stdout), /detected the `flat` layer preset \(signal flat:fallback/);
    // The detection line is the whole discriminator here, and the fallback's *warning* is deliberately
    // not beside it: its sentence is `using the flat preset`, which is false of a re-run that kept a
    // config carrying the layered profile. It is one of the four detection lists gated on `kept`.
    assert.doesNotMatch(stderr, /unrecognised layout/, `the kept re-run reported a preset it did not write:\n${stderr}`);
    // The flag answered, so nothing reports the file as the source — which is the flag rung reporting
    // itself honestly even though it handed detection the same string the fallback would have.
    assert.deepEqual(configuredAppDirNotes(stdout), [], `the flag ran and the file was named anyway:\n${stdout}`);
    assert.equal(readJson(join(dir, CONFIG_FILE)).appDir, NESTED_APP_DIR, 'a kept re-run rewrote the config');
  });

  await t.test('a configured appDir that cannot be used warns and falls back; the flag still refuses', async (subtest) => {
    for (const [value, reason] of [
      [OUTSIDE_APP_DIR, /resolves outside the repository/],
      [MISSING_APP_DIR, /names no directory that is there/],
    ]) {
      const dir = await fixtureFor(subtest, nestedLayeredFixture());
      await initOk(dir, ['--app-dir', NESTED_APP_DIR]);
      writeAppDir(dir, value);

      // Exit 0 and a warning, not a refusal: `--reset-config` is the documented way to rebuild a
      // broken config, so refusing out of the file being rebuilt would make this repository
      // unrepairable by the one command documented to repair it.
      const { stdout, stderr } = await initOk(dir);

      assert.match(stderr, reason);
      assert.ok(stderr.includes(JSON.stringify(value)), `the warning did not name the value:\n${stderr}`);
      assert.ok(stderr.includes('--app-dir'), `the warning did not name the way to state the right one:\n${stderr}`);
      assert.match(detectionLine(stdout), /detected the `flat` layer preset/);
      assert.deepEqual(configuredAppDirNotes(stdout), [], `the fallback reported the file as its source:\n${stdout}`);
    }

    // The same value on the command line keeps today's hard refusal: it is a typo or a mis-scoped
    // invocation, and there is no file to repair it out of.
    const dir = await fixtureFor(subtest, nestedLayeredFixture());
    const refused = await runCli(dir, ['init', '--app-dir', OUTSIDE_APP_DIR]);
    assert.notEqual(refused.status, 0, `a flag-sourced appDir outside the repository was accepted:\n${refused.stdout}`);
    assert.match(refused.stderr, /is outside the repository at/);
    assert.equal(existsSync(join(dir, CONFIG_FILE)), false, 'the refused run wrote a config');
  });

  await t.test('a repository that is its own application detects what it detects today', async (subtest) => {
    // The regression gate for every `appDir: "."` adopter: the value the resolver returns on the
    // re-run is the same `.` the call passed before it existed, so detection cannot change answer.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const first = await initOk(dir);
    const before = await snapshotTree(dir);

    const { stdout, stderr } = await initOk(dir);

    assert.equal(detectionLine(stdout), detectionLine(first.stdout));
    assert.match(detectionLine(stdout), /detected the `flat` layer preset \(signal flat:fallback/);
    assert.equal(readJson(join(dir, CONFIG_FILE)).appDir, '.');
    assert.ok(!/appDir/.test(stderr), `a flat re-run gained an appDir warning:\n${stderr}`);
    assert.deepEqual(await snapshotTree(dir), before, 'the re-run changed the tree');
  });
});

/** The section headings a run printed, in the order it printed them (`core/report.ts`). */
function stepHeadings(stdout) {
  return stdout.split('\n').filter((line) => line.startsWith('== '));
}

/** The note naming the directory the run was invoked in, the root it wired and the flag between them. */
function invocationDirNotes(stdout) {
  const notes = stdout.includes('== notes') ? notesBlock(stdout) : [];
  return notes.filter((note) => note.includes('and wired the repository at'));
}

/** The folded warning: the `flat` fallback's remedy with the application directory named first. */
function foldedAppDirWarnings(stderr) {
  return warningLines(stderr).filter((line) => line.includes('the likeliest reason nothing is recognised'));
}

/**
 * A repository whose application nests and whose **root** carries a layout detection recognises, so a
 * run started in the application is one whose detection line is not the fallback — which is what keeps
 * the two halves of this case apart: the note fires on where the run was started, the folded warning
 * only where detection also recognised nothing.
 */
function nestedUnderDetectedRootFixture() {
  return { files: nodeProjectFiles(), dirs: ['src/data', 'src/domain', 'src/presentation', NESTED_APP_DIR] };
}

/**
 * `init` names the repository it wired, and — when it was run below that root with nothing naming the
 * application — the flag that would have named where the adopter was standing.
 *
 * **The header is a step rather than a note** because it is the frame the rest of the output hangs on:
 * every path an `init` run prints is under that root, and a note printed after ninety lines arrives
 * once the reader has already read them relative to nothing. `doctor` opens the same way, so case (a)
 * asserts the position as well as the text.
 *
 * **The two conditional lines are gated on `appDir.source`**, so an adopter who has already answered
 * the question — on the command line or in the file — is not told to answer it again; case (d) is that
 * half. Case (b) also pins the behaviour the finding calls correct and unchanged: the run still writes
 * every file at the repository root and nothing into the application directory.
 */
test('init names the root it wired, and names --app-dir when it was run below that root', async (t) => {
  await t.test('the header names the repository, first, on any run', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir);

    assert.equal(stepHeadings(stdout)[0], `== wiring (${dir})`, `the run did not open by naming the root:\n${stdout}`);
  });

  await t.test('a run started in a subdirectory names the root, the appDir and the flag', async (subtest) => {
    const dir = await fixtureFor(subtest, nestedUnderDetectedRootFixture());
    const appDir = join(dir, NESTED_APP_DIR);

    const { status, stdout, stderr } = await runCli(appDir, ['init']);
    assert.equal(status, 0, `init exited ${status}\n${stdout}\n${stderr}`);

    assert.match(detectionLine(stdout), /detected the `layered-clean-arch` layer preset/);
    const [note, ...extra] = invocationDirNotes(stdout);
    assert.deepEqual(extra, [], `the run named the invocation directory more than once:\n${stdout}`);
    assert.ok(note !== undefined, `the run said nothing about the directory it was started in:\n${stdout}`);
    assert.ok(note.includes(NESTED_APP_DIR), `the note did not name the directory the run was started in:\n${note}`);
    assert.ok(note.includes(dir), `the note did not name the repository that was wired:\n${note}`);
    assert.ok(note.includes(`--app-dir ${NESTED_APP_DIR}`), `the note did not name the flag to re-run with:\n${note}`);

    // The property the finding calls correct and must not change: the write behaviour is the root's.
    assert.equal(readJson(join(dir, CONFIG_FILE)).appDir, '.');
    assert.deepEqual(await readdir(appDir), [], `init wrote into the application directory:\n${stdout}`);
    assert.deepEqual(foldedAppDirWarnings(stderr), [], `a recognised layout got the folded warning:\n${stderr}`);
  });

  await t.test('an unrecognised layout below the root gets both the fallback line and --app-dir', async (subtest) => {
    // The same run over a tree with nothing above the fallback to match, which is the measured case:
    // detection probed the root, answered `flat`, and never saw the application.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles(), dirs: [NESTED_APP_DIR] });

    const { status, stdout, stderr } = await runCli(join(dir, NESTED_APP_DIR), ['init']);
    assert.equal(status, 0, `init exited ${status}\n${stdout}\n${stderr}`);

    assert.match(detectionLine(stdout), /detected the `flat` layer preset \(signal flat:fallback/);
    assert.equal(warningLines(stderr).filter((line) => line.includes('unrecognised layout')).length, 1, stderr);
    assert.equal(foldedAppDirWarnings(stderr).length, 1, `the fallback carried no --app-dir remedy:\n${stderr}`);
    assert.ok(
      foldedAppDirWarnings(stderr)[0].includes(`--app-dir ${NESTED_APP_DIR}`),
      `the folded warning did not name the directory to re-run with:\n${stderr}`,
    );
    assert.equal(invocationDirNotes(stdout).length, 1, `the folded warning arrived without the note:\n${stdout}`);
  });

  await t.test('neither line fires at the root, nor when --app-dir already answered', async (subtest) => {
    const atRoot = await fixtureFor(subtest, { files: nodeProjectFiles(), dirs: [NESTED_APP_DIR] });
    const rootRun = await initOk(atRoot);

    assert.deepEqual(invocationDirNotes(rootRun.stdout), [], `a run at the root named an invocation directory:\n${rootRun.stdout}`);
    assert.deepEqual(foldedAppDirWarnings(rootRun.stderr), [], `a run at the root got the folded warning:\n${rootRun.stderr}`);

    const answered = await fixtureFor(subtest, { files: nodeProjectFiles(), dirs: [NESTED_APP_DIR] });
    const { status, stdout, stderr } = await runCli(join(answered, NESTED_APP_DIR), ['init', '--app-dir', NESTED_APP_DIR]);
    assert.equal(status, 0, `init exited ${status}\n${stdout}\n${stderr}`);

    assert.deepEqual(invocationDirNotes(stdout), [], `the flag answered and the adopter was asked again:\n${stdout}`);
    assert.deepEqual(foldedAppDirWarnings(stderr), [], `the flag answered and the folded warning fired anyway:\n${stderr}`);
    assert.equal(stepHeadings(stdout)[0], `== wiring (${answered})`, `the header named something other than the root:\n${stdout}`);
  });
});

/** A direct subdirectory of the root — what the nested-application probe looks at, unlike NESTED_APP_DIR. */
const NESTED_APP_CHILD = 'service';

/** The note naming a direct subdirectory the whole application appears to sit in. */
function nestedApplicationNotes(stdout) {
  const notes = stdout.includes('== notes') ? notesBlock(stdout) : [];
  return notes.filter((note) => note.includes('so the application may be that directory'));
}

/**
 * Every distinct directory the run offered `--app-dir` for, across notes and warnings alike.
 *
 * Distinct rather than counted: the invocation block deliberately says the same directory on two
 * lines, one note and one warning, so a count would fail on the behaviour that is correct. What the
 * case is about is a *second* directory being named.
 */
function appDirRemedies(stdout, stderr) {
  const lines = [...(stdout.includes('== notes') ? notesBlock(stdout) : []), ...warningLines(stderr)];
  const named = lines.flatMap((line) => [...line.matchAll(/--app-dir ([^\s`]+)/g)].map((match) => `--app-dir ${match[1]}`));
  return [...new Set(named)].sort();
}

/** A manifest `init` reads, minimal: no script, no `workspaces` key, so no signal row matches on it. */
function bareNodeManifest(name) {
  return { name, private: true, version: '0.0.0' };
}

/**
 * A repository whose whole application is in one direct subdirectory: the root carries a README and
 * nothing detection reads, so the run falls to `flat:fallback` with a placeholder for both required
 * commands — the shape the finding was raised on.
 */
function nestedApplicationFixture(extra = {}) {
  return {
    files: {
      'README.md': '# fixture project\n',
      [`${NESTED_APP_CHILD}/package.json`]: bareNodeManifest('fixture-service'),
      ...extra,
    },
  };
}

/**
 * On the `flat` fallback, `init` names the direct subdirectory the application appears to be in.
 *
 * **A note and not an adoption**, which cases (b)–(d) are the fence for: the probe answers only on a
 * single hit, skips build-output and dependency trees, and stays silent whenever the root itself
 * carries a manifest — the case where the locator walk cannot prove a child's hit is the child's.
 */
test('init names a direct subdirectory that looks like the application, and --app-dir for it', async (t) => {
  await t.test('a single nested application is named, with its manifest and the flag', async (subtest) => {
    const dir = await fixtureFor(subtest, nestedApplicationFixture());

    const { stdout } = await initOk(dir);

    assert.match(detectionLine(stdout), /detected the `flat` layer preset \(signal flat:fallback/);
    const [note, ...extra] = nestedApplicationNotes(stdout);
    assert.deepEqual(extra, [], `the run named the nested application more than once:\n${stdout}`);
    assert.ok(note !== undefined, `the run said nothing about the nested application:\n${stdout}`);
    assert.ok(note.includes(`\`${NESTED_APP_CHILD}\``), `the note did not name the directory:\n${note}`);
    assert.ok(note.includes(`${NESTED_APP_CHILD}/package.json`), `the note did not name the manifest:\n${note}`);
    assert.ok(note.includes(`--app-dir ${NESTED_APP_CHILD}`), `the note did not name the re-run:\n${note}`);
  });

  await t.test('two candidate subdirectories name neither: a multi-application repository is undefined', async (subtest) => {
    const dir = await fixtureFor(subtest, nestedApplicationFixture({ 'worker/package.json': bareNodeManifest('fixture-worker') }));

    const { stdout } = await initOk(dir);

    assert.deepEqual(nestedApplicationNotes(stdout), [], `a repository with two candidates got a recommendation:\n${stdout}`);
  });

  await t.test('a manifest in a dependency or build tree is not a candidate', async (subtest) => {
    const dir = await fixtureFor(subtest, {
      files: { 'README.md': '# fixture project\n', 'vendor/package.json': bareNodeManifest('fixture-vendored') },
    });

    const { stdout } = await initOk(dir);

    assert.deepEqual(nestedApplicationNotes(stdout), [], `a vendored manifest was named as the application:\n${stdout}`);
  });

  await t.test('a root manifest makes the probe inconclusive, and it stays silent', async (subtest) => {
    // The root's own manifest is answered by a locator over the `.` leg of every child context too,
    // so a child's later-locator hit could not be reached — the probe cannot prove anything here.
    const dir = await fixtureFor(subtest, nestedApplicationFixture({ 'package.json': bareNodeManifest('fixture-root') }));

    const { stdout } = await initOk(dir);

    assert.match(detectionLine(stdout), /detected the `flat` layer preset \(signal flat:fallback/);
    assert.deepEqual(nestedApplicationNotes(stdout), [], `the probe spoke where it could not prove a hit:\n${stdout}`);
  });

  await t.test('a run started below the probed directory gets one remedy, not two', async (subtest) => {
    // The invocation block already points into that tree, naming the directory the run was started
    // in; the probe naming its parent as well would put two `--app-dir` remedies for one condition
    // in one report, with nothing saying which to prefer.
    const dir = await fixtureFor(subtest, { ...nestedApplicationFixture(), dirs: [`${NESTED_APP_CHILD}/api`] });

    const { status, stdout, stderr } = await runCli(join(dir, NESTED_APP_CHILD, 'api'), ['init']);
    assert.equal(status, 0, `init exited ${status}\n${stdout}\n${stderr}`);

    assert.match(detectionLine(stdout), /detected the `flat` layer preset \(signal flat:fallback/);
    assert.equal(invocationDirNotes(stdout).length, 1, `the run below the probed directory said nothing:\n${stdout}`);
    assert.deepEqual(nestedApplicationNotes(stdout), [], `the probe named the parent of the invocation directory:\n${stdout}`);
    assert.deepEqual(
      appDirRemedies(stdout, stderr),
      [`--app-dir ${NESTED_APP_CHILD}/api`],
      `the report offered more than one --app-dir remedy:\n${stdout}\n${stderr}`,
    );
  });

  await t.test('--app-dir answered the question, so it is not asked', async (subtest) => {
    const dir = await fixtureFor(subtest, nestedApplicationFixture());

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_CHILD]);

    assert.deepEqual(nestedApplicationNotes(stdout), [], `the flag answered and the adopter was asked anyway:\n${stdout}`);
  });
});

/**
 * The raw command line a wrapper runs, read off the wrapper on disk.
 *
 * **The raw line is where `typecheck` and `test` land**, not `commands.*`: both keys are wrapped, so
 * the generated config holds `bash <scriptsDir>/<name>.sh` whatever the detected line is, and the
 * detected line is inlined into the wrapper body as `<command> "$@"`. Asserting the config value
 * would assert the wrapper spelling and never the anchoring under test.
 */
function wrapperCommand(dir, file) {
  const line = text(dir, `${SCRIPTS_DIR}/${file}`)
    .split('\n')
    .find((candidate) => candidate.endsWith(' "$@"'));
  assert.ok(line !== undefined, `${SCRIPTS_DIR}/${file} carries no command line to read`);
  return line.slice(0, -' "$@"'.length);
}

/**
 * The notes naming the manifest an anchored family's lines came from, whichever family raised it.
 *
 * Matched on the two keys together: one note stands for both, so a note naming only one of them is
 * the defect this filter has to miss rather than accept.
 */
function anchoredFamilyNotes(stdout) {
  const notes = stdout.includes('== notes') ? notesBlock(stdout) : [];
  return notes.filter((note) => note.includes('commands.typecheck and commands.test'));
}

/**
 * The Python and Go command lines are anchored to the directory their manifest was found in.
 *
 * **Execution is deliberately not exercised, and the finding says why.** Every generated command runs
 * from the repository root, so the failure is that a bare `pytest` there reads none of the nested
 * `pyproject.toml`'s configuration and cannot import the package beside it; this host has neither
 * `pytest`/`mypy` nor a Go toolchain, which is the same reason the finding records its Go half as *not
 * exercised*. So the cases below assert the **generated line**, and the property that makes it work is
 * asserted by construction: the emitted argument is the directory the manifest was found in, which is
 * the directory whose configuration `pytest`'s rootdir discovery then reaches.
 *
 * The nested directory is {@link NESTED_APP_DIR}, this file's one nested-application constant, rather
 * than a second and third spelling of the same idea — the anchoring is about the manifest's directory
 * and not about which directory it happens to be.
 */
test('the Python and Go command lines name the directory their manifest was found in', async (t) => {
  await t.test('a nested Python packaging manifest anchors both lines and is named', async (subtest) => {
    const dir = await fixtureFor(subtest, {
      files: {
        [`${NESTED_APP_DIR}/pyproject.toml`]: '[project]\nname = "reporter"\n\n[tool.pytest.ini_options]\ntestpaths = ["tests"]\n',
        [`${NESTED_APP_DIR}/reporter/__init__.py`]: '',
      },
    });

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    assert.equal(wrapperCommand(dir, 'typecheck.sh'), `mypy ${NESTED_APP_DIR}`);
    assert.equal(wrapperCommand(dir, 'test.sh'), `pytest ${NESTED_APP_DIR}`);
    assert.equal(
      anchoredFamilyNotes(stdout).filter((note) => note.includes(`${NESTED_APP_DIR}/pyproject.toml`)).length,
      1,
      `the run did not name the manifest the commands came from:\n${stdout}`,
    );
  });

  await t.test('a nested go.mod anchors both lines with go -C', async (subtest) => {
    const dir = await fixtureFor(subtest, {
      files: { [`${NESTED_APP_DIR}/go.mod`]: 'module example.com/gateway\n\ngo 1.22\n' },
    });

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    // `./...` still means the module: it is resolved after `-C` has moved the tool, which is the
    // whole reason the flag is the spelling rather than a package pattern rooted at the repository.
    assert.equal(wrapperCommand(dir, 'typecheck.sh'), `go -C ${NESTED_APP_DIR} vet ./...`);
    assert.equal(wrapperCommand(dir, 'test.sh'), `go -C ${NESTED_APP_DIR} test ./...`);
    assert.equal(anchoredFamilyNotes(stdout).length, 1, `the anchored Go lines were not reported:\n${stdout}`);
  });

  await t.test('a repository that is its own application generates exactly what it did before', async (subtest) => {
    // The regression gate for every root-level Python and Go adopter: four strings, unchanged, and no
    // note — an anchoring that fired here would re-wire a repository this task has no business in.
    const python = await fixtureFor(subtest, { files: { 'pyproject.toml': '[project]\nname = "fixture"\n' } });
    const { stdout: pythonStdout } = await initOk(python);

    assert.equal(wrapperCommand(python, 'typecheck.sh'), 'mypy .');
    assert.equal(wrapperCommand(python, 'test.sh'), 'pytest');
    assert.deepEqual(anchoredFamilyNotes(pythonStdout), [], `a root-level Python repository gained a note:\n${pythonStdout}`);

    const go = await fixtureFor(subtest, { files: { 'go.mod': 'module example.com/fixture\n\ngo 1.22\n' } });
    const { stdout: goStdout } = await initOk(go);

    assert.equal(wrapperCommand(go, 'typecheck.sh'), 'go vet ./...');
    assert.equal(wrapperCommand(go, 'test.sh'), 'go test ./...');
    assert.deepEqual(anchoredFamilyNotes(goStdout), [], `a root-level Go repository gained a note:\n${goStdout}`);
  });
});

/** The warnings a run raised, one line each, as the reporter writes them (`core/report.ts`). */
function warningLines(stderr) {
  return stderr.split('\n').filter((line) => line.startsWith('! ') && !line.startsWith('!! '));
}

/**
 * The two wordings this pair of cases has to tell apart: the preset builder's, raised while
 * assembling a config a kept re-run discards, and the config check's, raised about the file that is
 * actually there. The wrapper generator's third one is deliberately not matched by either — it is
 * true on a kept run and keeps printing (`generators/scripts.ts`).
 *
 * The preset builder's is matched on the clause its **unresolved-manifest** arms share, which is what
 * both fixtures below reach; its nested-manifest arm has its own wording and its own cases. The
 * opening clause rather than the manifest sentence: one of those arms names a manifest `init` *does*
 * read (the family that answered resolved no line for this key), so a matcher spelled as the denial
 * would stop seeing the arm a root `package.json` without scripts reaches.
 */
const PRESET_PLACEHOLDER_WARNING = 'could not be detected';
const CONFIG_CHECK_PLACEHOLDER_WARNING = 'because it could not detect this command';

/** The note a kept re-run gets in place of the four detection lists it no longer prints. */
const DETECTION_NOT_WRITTEN_NOTE = 'the preset and command lines it detected were not written';

/**
 * A nested application whose two verification commands cannot be detected: a root manifest with no
 * scripts, so the node family answers and resolves neither `typecheck` nor `test`, and the
 * application's own manifest beside it, which is the install site `depInstall` is anchored to.
 *
 * Both halves are load-bearing. The root manifest is what opens the family gate, so the derivation
 * note this case suppresses is the node family's own rather than the no-root-manifest fallback's —
 * two wordings, and this pair is about the first; with scripts on it there is no placeholder to warn
 * about.
 */
function undetectedNestedAppFiles() {
  return {
    'package.json': { name: 'fixture-project', private: true, version: '0.0.0' },
    [`${NESTED_APP_DIR}/package.json`]: { name: 'storefront', private: true, version: '0.0.0' },
  };
}

/** Write one key with `config set`, failing with the CLI's own output when it refused. */
async function configSetOk(dir, key, value) {
  const result = await runCli(dir, ['config', 'set', key, value]);
  assert.equal(result.status, 0, `config set ${key} exited ${result.status}\n${result.stderr}`);
}

/**
 * Every line a run prints — warning **or** note — is true of the configuration the repository ends up
 * with. A kept re-run discards the whole config it just assembled, so nothing describing that config
 * may survive into either stream; what the adopter is told instead is what the **kept** file holds.
 *
 * **The two streams are one case because the defect is one.** Gating only the warnings would leave a
 * kept run saying `commands.depInstall was derived from packages/storefront/package.json` about a
 * value no file holds — the same false sentence on a second channel — so arm (a) asserts both.
 *
 * **Arms (b) and (c) are the property this must not buy the suppression with.** The adopter is still
 * told about a placeholder in both states, and the only difference is which file the sentence is
 * about: the config check's wording for the file on disk, the preset builder's for the one just
 * written. A change that dropped the generated warnings and added nothing would pass (a) and lose the
 * signal entirely.
 */
test('a kept re-run reports the config that is there, not the one it threw away', async (t) => {
  await t.test('a hand-filled config silences both detection streams', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: undetectedNestedAppFiles() });

    const first = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);
    // The state the arm needs, asserted rather than assumed: the first run raised both placeholder
    // warnings and the derivation note, so their absence below is a suppression rather than a
    // fixture that never produced them.
    assert.equal(
      warningLines(first.stderr).filter((line) => line.includes(PRESET_PLACEHOLDER_WARNING)).length,
      2,
      `the first run did not raise both placeholder warnings:\n${first.stderr}`,
    );
    assert.equal(depInstallNotes(first.stdout).length, 1, `the first run raised no derivation note:\n${first.stdout}`);

    await configSetOk(dir, 'commands.typecheck', `npm --prefix ${NESTED_APP_DIR} run typecheck`);
    await configSetOk(dir, 'commands.test', `npm --prefix ${NESTED_APP_DIR} test`);

    const { stdout, stderr } = await initOk(dir);

    assert.deepEqual(
      warningLines(stderr).filter((line) => line.includes(PRESET_PLACEHOLDER_WARNING)),
      [],
      `the kept re-run warned about a placeholder no file holds:\n${stderr}`,
    );
    // The note channel, matched on the manifest a discarded value would have been derived from —
    // which reaches Tasks 2's and 3's wording alike, whichever family raised it.
    assert.deepEqual(
      notesBlock(stdout).filter((note) => note.includes(`${NESTED_APP_DIR}/package.json`)),
      [],
      `the kept re-run named the manifest a value it discarded came from:\n${stdout}`,
    );
    assert.deepEqual(depInstallNotes(stdout), [], `the kept re-run reported a derivation it discarded:\n${stdout}`);
    // And one line in their place, so the run says why it detected a tree it did not write.
    assert.equal(
      notesBlock(stdout).filter((note) => note.includes(DETECTION_NOT_WRITTEN_NOTE)).length,
      1,
      `the kept re-run did not say its detection went unwritten:\n${stdout}`,
    );
  });

  await t.test('a placeholder left in place is reported from the file that holds it', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: undetectedNestedAppFiles() });
    await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    const { stderr } = await initOk(dir);

    for (const key of ['commands.typecheck', 'commands.test']) {
      assert.equal(
        warningLines(stderr).filter((line) => line.includes(`${key}:`) && line.includes(CONFIG_CHECK_PLACEHOLDER_WARNING))
          .length,
        1,
        `${key} was not reported once from the file that holds it:\n${stderr}`,
      );
    }
    assert.deepEqual(
      warningLines(stderr).filter((line) => line.includes(PRESET_PLACEHOLDER_WARNING)),
      [],
      `the kept re-run reported the discarded config's wording beside the kept file's:\n${stderr}`,
    );
  });

  await t.test('a first run still reports the placeholders it just wrote', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: { 'README.md': '# fixture project\n' } });

    const { stderr } = await initOk(dir);

    assert.equal(
      warningLines(stderr).filter((line) => line.includes(PRESET_PLACEHOLDER_WARNING)).length,
      2,
      `the run that wrote the placeholders stopped reporting them:\n${stderr}`,
    );
  });

  await t.test('a warning about the flags this invocation carried survives the gate', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);

    const { stderr } = await initOk(dir, ['--qa-driver', QA_DRIVER_VALUE]);

    // The other half of the discriminator: this line is about a flag on this command line, so it is
    // true whether or not the config it was assembled with survived.
    assert.match(stderr, /--qa-driver was given without --qa/, `a flag warning was gated on kept:\n${stderr}`);
  });
});

/**
 * The clause the one message builder in `generators/scripts.ts` opens with, and the wrapper
 * generator's own placeholder wording — the state case (c) asserts is **not** reported as this
 * defect. Matched as clauses rather than as whole sentences, so a later re-wording of the remedy
 * stays the subject of these cases instead of the subject of this matcher.
 */
const WRAPPED_KEY_MISMATCH = 'holds a raw command line';
const WRAPPER_PLACEHOLDER_WARNING = 'still holds the placeholder init wrote';

/** Every line of the run that reports a wrapped key holding a raw command line. */
function mismatchWarnings(stderr) {
  return warningLines(stderr).filter((line) => line.includes(WRAPPED_KEY_MISMATCH));
}

/** Overwrite the config on disk with `mutate` applied to it, the way an adopter's editor would. */
function editConfig(dir, mutate) {
  const config = readJson(join(dir, CONFIG_FILE));
  mutate(config);
  writeFileSync(join(dir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return config;
}

/**
 * A wrapped `commands.*` key holding a raw command line is named by the run that inlined it into the
 * wrapper — the state a nested application's hand-fill path produces, and the one the permission
 * profile refuses.
 *
 * **Case (a) is the finding's own measured configuration**, and it discharges the second branch of
 * that finding's `either … or …`: `init` names the mismatch. The trailing conjunct — *a subsequent
 * run whose stream carries no `permission_denied` for a configured verification command* — is a
 * live-agent-session measurement these tests cannot produce, and nothing here makes it true: the raw
 * line stays in `commands.typecheck` by design until the adopter acts on this report. What is
 * measured instead is its **cause**, deliberately unchanged — the profile carries the wrapper's three
 * forms and no package-manager entry of any kind, so the configured string is still refused.
 *
 * **Case (a) is also what separates this from the neighbouring finding it is not.** The wrapper
 * exists and all three of its allow forms are present, which is the state that finding's fix leaves
 * behind; this warning fires anyway, so nothing here is an existence check on either.
 *
 * **Case (b) is the arm the message used to deny.** With the wrapper already on disk, `create-if-absent`
 * keeps it and the body computed from the new raw line is discarded — so a plain re-run does *not*
 * transfer the line, and the case measures both that keep and the `--force` that does transfer it,
 * against a message that has to name the condition rather than prescribe a step that loses the line.
 *
 * **Case (c) is the no-false-positive gate.** The wrapper invocation is what every ordinary adoption
 * holds, and a warning there would fire on every correct run.
 */
test('a wrapped commands key holding a raw command line is reported by the init that wrote the wrapper', async (t) => {
  await t.test('a hand-filled raw line is named, with the value to set in its place', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: undetectedNestedAppFiles() });
    await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    // The remedy the undetected-command warning prescribes, applied literally: a root-anchored raw
    // command line, set through the one command an adopter is told to use.
    const rawLine = `npm --prefix ${NESTED_APP_DIR} run typecheck`;
    await configSetOk(dir, 'commands.typecheck', rawLine);

    const { stderr } = await initOk(dir);

    const named = mismatchWarnings(stderr).filter((line) => line.includes('commands.typecheck'));
    assert.equal(named.length, 1, `init did not name the mismatch it just created:\n${stderr}`);
    // Both halves in one line: the raw string it inlined, and the wrapper form to set instead.
    assert.ok(named[0].includes(rawLine), `the warning did not name the configured value:\n${named[0]}`);
    assert.ok(named[0].includes(`${SCRIPTS_DIR}/typecheck.sh`), `the warning named no wrapper:\n${named[0]}`);
    assert.ok(
      named[0].includes(`bash ${SCRIPTS_DIR}/typecheck.sh`),
      `the warning did not name the value to set:\n${named[0]}`,
    );

    // The wrapper was written from that line — the other half `init` holds at this moment.
    assert.ok(
      text(dir, `${SCRIPTS_DIR}/typecheck.sh`).includes(rawLine),
      'the raw line was not inlined into the wrapper the warning names',
    );

    // No package-manager entry for the configured string to match — the cause of the refusals,
    // deliberately unchanged. Widening the profile is not the fix, and the profile says so.
    assert.deepEqual(
      allowEntries(dir).filter((entry) => entry.includes('npm')),
      [],
      'the profile grew a package-manager entry, which is the widening the finding rules out',
    );

    // The neighbouring finding's **green** state, reached rather than argued: the profile is
    // create-if-absent, so `--force` is what regenerates it around the wrapper this run wrote — the
    // config is out of `--force` by design, so the raw line stays. The wrapper now exists and every
    // one of its allow forms is present, and the warning fires anyway.
    const forced = await initOk(dir, ['--force']);
    await assertWrapperPairing(dir, readJson(join(dir, CONFIG_FILE)), readJson(join(dir, PROFILE_FILE)));
    assert.equal(
      mismatchWarnings(forced.stderr).filter((line) => line.includes('commands.typecheck')).length,
      1,
      `the mismatch went unreported once the wrapper and its entries were all present:\n${forced.stderr}`,
    );
    assert.deepEqual(
      allowEntries(dir).filter((entry) => entry.includes('npm')),
      [],
      'the regenerated profile grew a package-manager entry',
    );
  });

  await t.test('a wrapper already on disk keeps its body on a plain re-run, and the warning names what does not', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    const wrapper = `${SCRIPTS_DIR}/typecheck.sh`;
    const detected = text(dir, wrapper);

    // The correction an adopter makes on a repository whose detected line checks the wrong tree —
    // the state this arm exists for, reached with the wrapper already written.
    const rawLine = 'npx tsc --noEmit --project packages/app';
    await configSetOk(dir, 'commands.typecheck', rawLine);

    // Wrappers are create-if-absent, so the plain re-run keeps the file and discards the body it
    // just computed. A message naming only that step sends the adopter to a corrective `set` that
    // leaves their command line in neither the key nor the wrapper.
    const rerun = await initOk(dir);
    assert.equal(text(dir, wrapper), detected, 'a plain re-run rewrote a wrapper that was already on disk');

    const named = mismatchWarnings(rerun.stderr).filter((line) => line.includes('commands.typecheck'));
    assert.equal(named.length, 1, `the re-run did not report the mismatch:\n${rerun.stderr}`);
    assert.ok(named[0].includes('create-if-absent'), `the warning states no condition on the re-run:\n${named[0]}`);
    assert.ok(named[0].includes('init --force'), `the warning names no invocation that transfers the line:\n${named[0]}`);

    // The invocation it does name, walked: this is what actually puts the line in the wrapper.
    await initOk(dir, ['--force']);
    assert.ok(text(dir, wrapper).includes(rawLine), 'init --force did not inline the configured line');
  });

  await t.test('the wrapper invocation every ordinary adoption holds is not reported', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);

    const { stderr } = await initOk(dir);

    assert.deepEqual(mismatchWarnings(stderr), [], `a correct re-run reported a mismatch:\n${stderr}`);
  });

  await t.test('a key still holding the placeholder is not this defect', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: { 'README.md': '# fixture\n' } });

    const { stderr } = await initOk(dir);

    assert.ok(
      warningLines(stderr).some((line) => line.includes(WRAPPER_PLACEHOLDER_WARNING)),
      `the placeholder went unreported:\n${stderr}`,
    );
    assert.deepEqual(mismatchWarnings(stderr), [], `a placeholder was reported as a raw line:\n${stderr}`);
  });

  await t.test('the comparison follows scriptsDir, so a stale invocation is a mismatch', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    // The wrappers move; `commands.test` is left naming the directory they came from, so its value
    // is the wrapper form for a file this run does not write and a raw line for the one it does.
    editConfig(dir, (config) => {
      config.scriptsDir = 'tools';
      config.commands.typecheck = 'bash tools/typecheck.sh';
      config.commands.devServer = 'bash tools/start-dev-server.sh';
    });

    const { stderr } = await initOk(dir);

    assert.deepEqual(
      mismatchWarnings(stderr).filter((line) => !line.includes('commands.test')),
      [],
      `a key holding the wrapper form for the moved directory was reported:\n${stderr}`,
    );
    const named = mismatchWarnings(stderr).filter((line) => line.includes('commands.test'));
    assert.equal(named.length, 1, `the stale invocation was not reported:\n${stderr}`);
    assert.ok(named[0].includes('bash tools/test.sh'), `the warning named the old directory:\n${named[0]}`);
  });

  await t.test('the deploy row is named deploy.command, the key it actually has', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    editConfig(dir, (config) => {
      config.deploy = { command: 'echo deploying' };
    });

    const { stderr } = await initOk(dir);

    const named = mismatchWarnings(stderr);
    assert.equal(named.length, 1, `the deploy command line was not reported once:\n${stderr}`);
    assert.ok(named[0].startsWith('! deploy.command '), `the deploy row was not named deploy.command:\n${named[0]}`);
    assert.ok(!named[0].includes('commands.deploy'), `the deploy row was named as a commands key:\n${named[0]}`);
    assert.ok(named[0].includes(`bash ${SCRIPTS_DIR}/deploy.sh`), `the warning named no wrapper:\n${named[0]}`);
  });
});

/** The answered-`none` sentinel, spelled as an adopter types it — the published contract. */
const NONE_SENTINEL = '<none>';

/** The clause `init`'s command row states the answered key with, and the ordinary row's own. */
const ANSWERED_NONE_ROW = 'states it has no such command';
const RUN_AS_CONFIGURED_ROW = 'run as configured';

/**
 * The answered row's residue clause, and the state claim it replaced.
 *
 * The retired sentence is asserted **absent** in both arms: it read as a claim about the profile on
 * disk, which is false of exactly the transition the second arm sets up.
 */
const ANSWERED_NONE_RESIDUE = 'is still on disk';
const RETIRED_NONE_STATE_CLAIM = 'none is allow-listed';

/** Every entry of every permission list, whatever the list is called. */
function everyPermissionEntry(profile) {
  return Object.entries(profile.permissions ?? {}).flatMap(([list, entries]) =>
    Array.isArray(entries) ? entries.map((entry) => ({ list, entry })) : [],
  );
}

/**
 * `commands.typecheck` answered `<none>` — the adopter's statement that this repository has no type
 * check, which `init` never writes and only ever reads back.
 *
 * **The wrapper is deleted first, and that is what makes the negative meaningful.** Wrappers are
 * enqueued `create-if-absent` and no generator deletes, so an adopter who answers an already-filled
 * key keeps the `typecheck.sh` already on disk — the ratified record's stated residue, not a defect.
 * A case that asserted a removal would assert a behaviour option (b) does not have.
 *
 * **The re-run is `--force`**, because the permission profile is create-if-absent too: a plain re-run
 * keeps the profile the first run wrote, so the only way to ask what the generator allow-lists for an
 * answered key is to have it regenerate one.
 *
 * The second case is that residue's own: the wrapper is **kept**, and the row has to name it rather
 * than repeat the first case's negatives — the two together are why the row speaks about the run and
 * not about the profile on disk.
 *
 * The third case is the key gate: the same string on `commands.test` is a raw command line, and
 * everything the first case asserts absent is asserted present for it.
 */
test('a commands key answered <none> writes no wrapper, allow-lists none, and says which state it is in', async (t) => {
  await t.test('the answered key writes no wrapper and no entry, and its row is not the ordinary one', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    editConfig(dir, (config) => {
      config.commands.typecheck = NONE_SENTINEL;
    });
    await rm(join(dir, SCRIPTS_DIR, 'typecheck.sh'));

    const { stdout } = await initOk(dir, ['--force']);

    const written = await writtenWrappers(dir);
    assert.ok(!written.includes('typecheck.sh'), `a wrapper was written for an answered key: ${written.join(', ')}`);
    // Not vacuous: the run wrote the wrappers for every key that is not answered, so the absence
    // above is this key's state rather than a run that wrote nothing at all.
    assert.ok(written.includes('test.sh'), `the run wrote no wrapper at all, so the negative above proves nothing`);

    const named = everyPermissionEntry(readJson(join(dir, PROFILE_FILE))).filter(({ entry }) =>
      entry.includes('typecheck.sh'),
    );
    assert.deepEqual(named, [], `the regenerated profile names a wrapper no run wrote: ${JSON.stringify(named)}`);

    const row = commandRows(stdout)['commands.typecheck'];
    assert.ok(row !== undefined, `no commands.typecheck row:\n${stdout}`);
    assert.ok(row.includes(NONE_SENTINEL), `the row omits the value the key holds: ${row}`);
    assert.ok(row.includes(ANSWERED_NONE_ROW), `the row does not state the answered-none state: ${row}`);
    assert.ok(!row.includes(RUN_AS_CONFIGURED_ROW), `the answered key is reported as a line that runs: ${row}`);
    assert.ok(!row.includes(`bash ${SCRIPTS_DIR}/typecheck.sh`), `the row names a wrapper this run did not write: ${row}`);
    assert.ok(!row.includes(RETIRED_NONE_STATE_CLAIM), `the row states the profile's contents rather than what this run did: ${row}`);
    // The deleted wrapper is the no-residue half of the pair: nothing is on disk to name.
    assert.ok(!row.includes(ANSWERED_NONE_RESIDUE), `the row names a residue this repository does not have: ${row}`);
  });

  await t.test('a wrapper an earlier run left on disk is named as residue rather than denied', async (subtest) => {
    // The transition the record documents, and the one the arm above cannot reach because it deletes
    // the file first: a repository that had a real type check, whose init wrote `typecheck.sh`, and
    // which later answers the key. The wrapper is `create-if-absent` and nothing deletes, so it is
    // still there — a row claiming the opposite would be false of every repository taking this path.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    editConfig(dir, (config) => {
      config.commands.typecheck = NONE_SENTINEL;
    });

    const { stdout } = await initOk(dir, ['--force']);

    assert.ok(
      existsSync(join(dir, SCRIPTS_DIR, 'typecheck.sh')),
      'the answered key deleted a wrapper on disk, which is not option (b)\'s behaviour',
    );

    const row = commandRows(stdout)['commands.typecheck'];
    assert.ok(row !== undefined, `no commands.typecheck row:\n${stdout}`);
    assert.ok(row.includes(ANSWERED_NONE_ROW), `the row does not state the answered-none state: ${row}`);
    assert.ok(row.includes(ANSWERED_NONE_RESIDUE), `the row does not name the wrapper left on disk: ${row}`);
    assert.ok(row.includes(`${SCRIPTS_DIR}/typecheck.sh`), `the residue clause does not name the file: ${row}`);
    assert.ok(!row.includes(RETIRED_NONE_STATE_CLAIM), `the row denies a residue this repository has: ${row}`);
  });

  await t.test('the same string on commands.test keeps its wrapper, its entries and its ordinary row', async (subtest) => {
    // The key-gate negative control: `answersNone` answers for `typecheck` alone, so dropping its key
    // argument would withdraw the test gate's wrapper and permission entries in silence.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    const config = editConfig(dir, (edited) => {
      edited.commands.test = NONE_SENTINEL;
    });
    await rm(join(dir, SCRIPTS_DIR, 'test.sh'));

    const { stdout } = await initOk(dir, ['--force']);

    assert.ok((await writtenWrappers(dir)).includes('test.sh'), 'the sentinel withdrew the test gate\'s wrapper');
    // The three forms, through the pairing rule both directions of which this run has to satisfy.
    await assertWrapperPairing(dir, config, readJson(join(dir, PROFILE_FILE)));
    assert.ok(
      allowEntries(dir).some((entry) => entry.includes('test.sh')),
      'the sentinel withdrew the test gate\'s permission entries',
    );

    const row = commandRows(stdout)['commands.test'];
    assert.ok(row !== undefined, `no commands.test row:\n${stdout}`);
    assert.ok(!row.includes(ANSWERED_NONE_ROW), `a key the sentinel is not recognised on printed the answered row: ${row}`);
  });
});

/**
 * The sentence the undetected-command warning must never say again — false on a repository whose root
 * manifest is one `init` does not read, and false again on one whose `--app-dir` names a manifest that
 * declares the script. Asserted **absent** in every arm below, which is what makes the three cases one
 * property rather than three wordings.
 */
const RETIRED_NO_MANIFEST_CLAIM = 'any manifest in this repository';

/** The nested-manifest arm's opening clause, and the unread-manifest arm's distinguishing one. */
const NESTED_SCRIPT_WARNING = 'was not derived from';
const UNREAD_MANIFEST_CLAUSE = 'is present but is not one of them';

/**
 * A nested application whose own manifest **declares** the two verification scripts, and a root
 * manifest that declares none.
 *
 * Both halves are load-bearing, and differently from {@link undetectedNestedAppFiles}: the scripts on
 * the nested manifest are what the first arm has to see, and their absence from the root manifest is
 * what leaves the keys unresolved for it to speak about.
 *
 * @param {object} [options]
 * @param {Record<string, string>} [options.scripts] the nested manifest's `scripts`. The default is
 *   the two verification scripts alone; the optional-key cases add `build` and `dev`, which is the
 *   half of the manifest the required-key warning never speaks about.
 * @param {Record<string, string>} [options.rootScripts] `scripts` on the **root** manifest, for the
 *   case whose subject is a key the root already resolved.
 */
function nestedScriptedAppFiles({ scripts = { typecheck: 'echo typecheck', test: 'echo test' }, rootScripts } = {}) {
  const root = { name: 'fixture-project', private: true, version: '0.0.0' };
  return {
    'package.json': rootScripts === undefined ? root : { ...root, scripts: rootScripts },
    [`${NESTED_APP_DIR}/package.json`]: { name: 'storefront', private: true, version: '0.0.0', scripts },
  };
}

/**
 * The manifests the undetected-command warning claims `init` reads, taken from the constant that
 * composes that sentence rather than restated.
 *
 * **The one deliberate exception to this file's rule against importing what generated the output**
 * (choice 3 in the header). The list is not a fixed contract but a growing one — every stack added
 * extends it — and a hand-written copy here asserts less on each new stack while silently going
 * stale. Deriving it inverts that: the assertion below covers every entry the constant carries, and
 * a name that stopped being read fails it. The split is on the constant's own `, ` between families,
 * and each family's entry is asserted **whole** rather than by segment: an entry may be a path (the
 * Android family's is), and `src`, `main` are not manifest names the sentence has to promise.
 */
const { READ_MANIFESTS } = await loadCompiled('detect/presets.js');

function readManifestNames() {
  return READ_MANIFESTS.split(',').map((entry) => entry.trim()).filter((entry) => entry !== '');
}

/**
 * The partial-family arm's distinguishing clause, and the denial it must not carry.
 *
 * `NO_READ_MANIFEST_CLAIM` is retired **on this one repository shape** rather than everywhere — it is
 * what arms (c) and (d) say truthfully — so unlike {@link RETIRED_NO_MANIFEST_CLAIM} it is asserted
 * absent in this arm alone.
 */
const PARTIAL_FAMILY_CLAUSE = 'derives no line for this key';
const NO_READ_MANIFEST_CLAIM = 'no manifest init reads';

/**
 * A repository a partially-resolving family answers for, beside a manifest that could have answered
 * the keys it left unresolved: a root `package.json` declaring the verification scripts, and a root
 * `composer.json`.
 *
 * Every file is load-bearing. The `composer.json` puts the `composer` family — which is ordered above
 * `npm` and derives a `depInstall` alone from a manifest with no PHPStan, Psalm or PHPUnit
 * configuration — first, and the family search stops at it. The `package.json` beside it is the
 * manifest the warning used to deny: its scripts are exactly the lines that were never reached.
 * `src/routes/` only fixes the preset the run reports, so the case is a whole repository shape rather
 * than a bare pair of manifests.
 *
 * **The seed was a `Gemfile` until the Bundler family stopped having this shape.** `bundlerCommands`
 * now hands the search on where it would answer with `bundle install` alone in a repository whose
 * root manifest declares an npm script (`detect/presets.ts`), so this tree answers npm lines and
 * warns about nothing. Composer is the family that still stops on an install alone, which is what
 * this arm needs — the subject here is the warning's sentence, not which stack produced it.
 */
function partiallyResolvedFamilyFiles() {
  return {
    'package.json': {
      name: 'fixture-api',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', dev: 'echo dev' },
    },
    'package-lock.json': { name: 'fixture-api', lockfileVersion: 3, requires: true, packages: {} },
    'composer.json': { name: 'fixture/api', type: 'project', require: {} },
    'src/routes/health.js': 'export const health = () => ({ ok: true });\n',
  };
}

/** The unread manifest this arm is seeded with, spelled once so the seed and the assertion agree. */
const UNREAD_MANIFEST = 'Makefile';

/**
 * A repository whose only manifest is one `init` does not read — a `Makefile`.
 *
 * **The subject is a `Makefile` rather than the Rust crate the finding measured**, because the crate
 * stopped being unread when the Cargo row was added: that tree now resolves all three command lines
 * and warns about nothing. A `Makefile` is the entry whose exclusion is argued on its own merits —
 * its targets are knowable only by reading the file, which detection may not do — so it is the one
 * this arm can be seeded with without going stale behind the next supported stack.
 */
function unreadManifestFiles() {
  return { [UNREAD_MANIFEST]: 'all:\n\t@echo build\n' };
}

/** The two required keys' placeholders, and the wrapper and profile consequences of holding them. */
async function assertPlaceholderUnchanged(dir, describe) {
  const config = readJson(join(dir, CONFIG_FILE));
  for (const key of ['typecheck', 'test']) {
    assert.match(config.commands[key], /configure this/, `${describe}: commands.${key} is not the placeholder`);
  }
  assert.deepEqual(await writtenWrappers(dir), [], `${describe}: a wrapper was written for a placeholder`);
  assert.deepEqual(
    scriptPaths(readJson(join(dir, PROFILE_FILE)), 'allow'),
    [],
    `${describe}: the profile allow-lists a wrapper that was never written`,
  );
}

/**
 * The undetected-command warning says what `init` looked for and what the repository actually holds.
 *
 * **The four arms are four repository shapes, and the old single sentence was false on three of them.**
 * Case (a) is a nested application whose own manifest declares the scripts — there *is* a manifest
 * holding the command, and it is the one `--app-dir` named. Case (b) is a repository a partially
 * resolving family answered for — there *is* a manifest `init` reads, at the root, and the family
 * search stopped before the family that reads it. Case (c) is a repository whose only manifest is a
 * root `Makefile` — there *is* a manifest, just not one `init` reads. Case (d) is the shape the plain
 * sentence was written for, and it is the case that catches an over-eager rewrite: the last arm still
 * has to be true where nothing is there at all.
 *
 * **Case (a) also measures the two-step as one path.** The line this warning tells the adopter to set
 * is a raw command line, which the next `init` reports as a wrapper-form mismatch
 * (`generators/scripts.ts`, `wrappedKeyMismatchMessage`). That is the intended sequence rather than two
 * remedies disagreeing, so the case follows it end to end: set the value the warning named, re-run, and
 * assert the run now names the wrapper invocation this warning said it would.
 *
 * **Every case is also the no-invention gate.** All four arms change only the sentence: the placeholder
 * value is written as before, no wrapper is selected for it, and the profile allow-lists none.
 */
test('the undetected-command warning names what was looked for and what is there', async (t) => {
  await t.test('a nested manifest that declares the script is named, with the line to paste', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nestedScriptedAppFiles() });

    const { stderr } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    const expected = [
      ['commands.typecheck', 'typecheck', `npm --prefix ${NESTED_APP_DIR} run typecheck`],
      // `npm test` rather than `npm run test`: the lifecycle script's own invocation, as detection
      // would have spelled it from a root manifest.
      ['commands.test', 'test', `npm --prefix ${NESTED_APP_DIR} test`],
    ];
    for (const [key, script, command] of expected) {
      const named = warningLines(stderr).filter((line) => line.includes(`${key} ${NESTED_SCRIPT_WARNING}`));
      assert.equal(named.length, 1, `${key} was not reported once from the manifest that declares it:\n${stderr}`);
      assert.ok(named[0].includes(`${NESTED_APP_DIR}/package.json`), `the warning named no manifest:\n${named[0]}`);
      assert.ok(named[0].includes(`\`${script}\` script`), `the warning named no script:\n${named[0]}`);
      assert.ok(named[0].includes(command), `the warning offered no root-anchored line:\n${named[0]}`);
      // The second step, which is what makes this warning and the next run's one path rather than two.
      assert.ok(named[0].includes('re-run init'), `the warning named no second step:\n${named[0]}`);
      assert.ok(named[0].includes('wrapper invocation'), `the warning did not say what the re-run names:\n${named[0]}`);
      assert.ok(!named[0].includes(RETIRED_NO_MANIFEST_CLAIM), `the warning still denies the manifest:\n${named[0]}`);
    }

    // The refusal is unchanged — only the sentence explaining it is new.
    await assertPlaceholderUnchanged(dir, 'the nested arm');

    // The two-step, walked: the value this warning named, set the way it says to set it.
    const rawLine = `npm --prefix ${NESTED_APP_DIR} run typecheck`;
    await configSetOk(dir, 'commands.typecheck', rawLine);

    const rerun = await initOk(dir);

    const mismatch = mismatchWarnings(rerun.stderr).filter((line) => line.includes('commands.typecheck'));
    assert.equal(mismatch.length, 1, `the re-run did not name the mismatch this warning promised:\n${rerun.stderr}`);
    assert.ok(
      mismatch[0].includes(`bash ${SCRIPTS_DIR}/typecheck.sh`),
      `the re-run named a value other than the wrapper invocation:\n${mismatch[0]}`,
    );
  });

  await t.test('a manifest the family that answered did not read is named, not denied', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: partiallyResolvedFamilyFiles() });

    const { stderr } = await initOk(dir);

    const named = warningLines(stderr).filter((line) => line.includes(PRESET_PLACEHOLDER_WARNING));
    assert.equal(named.length, 2, `the two required keys were not both reported:\n${stderr}`);
    for (const line of named) {
      assert.ok(line.includes('`package.json`'), `the warning did not name the manifest that is there:\n${line}`);
      assert.ok(line.includes(PARTIAL_FAMILY_CLAUSE), `the warning did not say why it went unread:\n${line}`);
      // The defect itself: both manifests are at the root, and the sentence used to deny them while
      // listing them.
      assert.ok(!line.includes(NO_READ_MANIFEST_CLAIM), `the warning still denies a manifest that is there:\n${line}`);
      assert.ok(!line.includes(RETIRED_NO_MANIFEST_CLAIM), `the warning still denies the manifest:\n${line}`);
    }

    await assertPlaceholderUnchanged(dir, 'the partial-family arm');
  });

  await t.test('an unread manifest at the root is named, beside what init does read', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: unreadManifestFiles() });

    const { stderr } = await initOk(dir);

    const named = warningLines(stderr).filter((line) => line.includes(PRESET_PLACEHOLDER_WARNING));
    assert.equal(named.length, 2, `the two required keys were not both reported:\n${stderr}`);
    for (const line of named) {
      assert.ok(line.includes(UNREAD_MANIFEST), `the warning did not name the manifest that is there:\n${line}`);
      assert.ok(line.includes(UNREAD_MANIFEST_CLAUSE), `the warning did not say why it is not read:\n${line}`);
      for (const manifest of readManifestNames()) {
        assert.ok(line.includes(manifest), `the warning did not name ${manifest} as one it reads:\n${line}`);
      }
      assert.ok(!line.includes(RETIRED_NO_MANIFEST_CLAIM), `the warning still denies the manifest:\n${line}`);
    }

    await assertPlaceholderUnchanged(dir, 'the unread-manifest arm');
  });

  await t.test('a repository with no manifest at all gets the sentence that is true there', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: { 'README.md': '# fixture\n' } });

    const { stderr } = await initOk(dir);

    const named = warningLines(stderr).filter((line) => line.includes(PRESET_PLACEHOLDER_WARNING));
    assert.equal(named.length, 2, `the two required keys were not both reported:\n${stderr}`);
    for (const line of named) {
      assert.ok(line.includes('the repository root'), `the warning named no root it searched:\n${line}`);
      // The over-eager-rewrite guard: nothing is there, so neither of the other two arms may speak.
      assert.ok(!line.includes(UNREAD_MANIFEST_CLAUSE), `the warning named a manifest that is not there:\n${line}`);
      assert.ok(!line.includes(NESTED_SCRIPT_WARNING), `the warning claimed a nested script:\n${line}`);
      assert.ok(!line.includes(RETIRED_NO_MANIFEST_CLAIM), `the retired claim survived where it was true:\n${line}`);
    }

    await assertPlaceholderUnchanged(dir, 'the no-manifest arm');
  });
});

/** The four scripts a nested application declares once the optional pair is part of the subject. */
const NESTED_FULL_SCRIPTS = { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' };

/** The notes naming either optional command key, whichever wording the run chose for them. */
function optionalCommandNotes(stdout) {
  return notesBlock(stdout).filter((note) => note.includes('commands.build') || note.includes('commands.devServer'));
}

/**
 * An optional command the application's own manifest declares is named, rather than dropped in
 * silence.
 *
 * **Absence is the whole subject.** `build` and `devServer` are optional, so an unresolved one gets no
 * key, no placeholder and no warning — without a note the run says nothing at all about a script it
 * has just read in the manifest it is already speaking about. What that silence costs is the shape the
 * `depInstall` anchoring exists to remove, one key over: `setup-worktree.sh` skips the build in every
 * worktree the flow cuts, and the interactive test phase has nothing to start.
 *
 * **Every arm also asserts the generated `commands` object**, so this stays a sentence: the notes name
 * a line to set by hand and derive nothing from the nested manifest, which is `rootPackageJson`'s
 * only-the-root rule holding.
 */
test('an optional command the nested manifest declares is named rather than dropped', async (t) => {
  await t.test('each key names its script, the line to set, and what the absence costs', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nestedScriptedAppFiles({ scripts: NESTED_FULL_SCRIPTS }) });

    const { stdout, stderr } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    const expected = [
      // `build` is one of the two keys that are never wrapped, so its remedy ends at the config value;
      // `devServer` is wrapped, so its remedy is the same second step the required keys' warning names.
      { key: 'commands.build', script: 'build', line: 'run build', cost: 'setup-worktree.sh', remedy: 'never wrapped' },
      // `dev` over `start` and `serve`: the candidate order detection would have applied at the root,
      // which is what makes the offered line the one this manifest would have produced there.
      { key: 'commands.devServer', script: 'dev', line: 'run dev', cost: 'interactive test phase', remedy: 're-run init' },
    ];
    for (const { key, script, line, cost, remedy } of expected) {
      const named = optionalCommandNotes(stdout).filter((note) => note.includes(`${key} ${NESTED_SCRIPT_WARNING}`));
      assert.equal(named.length, 1, `${key} was not reported once from the manifest that declares it:\n${stdout}`);
      assert.ok(named[0].includes(`${NESTED_APP_DIR}/package.json`), `the note named no manifest:\n${named[0]}`);
      assert.ok(named[0].includes(`\`${script}\` script`), `the note named no script:\n${named[0]}`);
      assert.ok(named[0].includes(`npm --prefix ${NESTED_APP_DIR} ${line}`), `the note offered no anchored line:\n${named[0]}`);
      assert.ok(named[0].includes(cost), `the note did not say what the absence costs:\n${named[0]}`);
      assert.ok(named[0].includes(remedy), `the note did not say what follows setting the value:\n${named[0]}`);
    }

    // A note rather than a warning: a repository is not at fault for nesting its application.
    assert.deepEqual(
      warningLines(stderr).filter((warning) => expected.some(({ key }) => warning.includes(key))),
      [],
      `an optional key was reported as a fault:\n${stderr}`,
    );

    // The no-invention half: the keys stay absent, which is the state the notes exist to make visible.
    const { commands } = readJson(join(dir, CONFIG_FILE));
    assert.deepEqual(
      Object.keys(commands).filter((key) => key === 'build' || key === 'devServer'),
      [],
      'an optional key was derived from the nested manifest',
    );
  });

  await t.test('a key the root manifest already resolved is not reported', async (subtest) => {
    // The gate is *unset*, not *nested*: a root that declares the script keeps its own line, and only
    // the key that resolved to nothing is spoken about.
    const dir = await fixtureFor(subtest, {
      files: nestedScriptedAppFiles({ scripts: NESTED_FULL_SCRIPTS, rootScripts: { build: 'echo root build' } }),
    });

    const { stdout } = await initOk(dir, ['--app-dir', NESTED_APP_DIR]);

    assert.equal(readJson(join(dir, CONFIG_FILE)).commands.build, 'npm run build');
    const notes = optionalCommandNotes(stdout);
    assert.deepEqual(
      notes.filter((note) => note.includes('commands.build')),
      [],
      `a key the root resolved was reported as absent:\n${stdout}`,
    );
    assert.equal(
      notes.filter((note) => note.includes('commands.devServer')).length,
      1,
      `the key that resolved to nothing was not reported:\n${stdout}`,
    );
  });

  await t.test('a repository that is its own application is untouched', async (subtest) => {
    // The regression gate for every adopter at `appDir: "."`: both keys keep the value they had —
    // `build` raw, `devServer` the wrapper invocation — and nothing is added to the notes block.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir);

    const { commands } = readJson(join(dir, CONFIG_FILE));
    assert.equal(commands.build, 'npm run build');
    assert.equal(commands.devServer, `bash ${SCRIPTS_DIR}/start-dev-server.sh`);
    assert.deepEqual(optionalCommandNotes(stdout), [], `a flat repository gained an optional-command note:\n${stdout}`);
  });
});

/**
 * Every layer any preset generates points at a conventions document that has a dedicated skeleton,
 * and that skeleton ships.
 *
 * Two lists decide this and they live in different modules — the basenames a preset gives its
 * layers, and the templates under `templates/claude/context/`. They have already drifted apart
 * once, and nothing failed when they did: three presets wrote their own layer the *generic*
 * skeleton, while three dedicated skeletons were reachable from no generated configuration at all.
 * The pointer still resolved and a file was still written, so only an assertion over the pair
 * catches it — reading the two modules side by side is what missed it the first time.
 *
 * The preset list is taken from the CLI's own refusal for an unknown `--preset` rather than
 * imported from the compiled module, so a preset added without a row in the table below fails the
 * coverage assertion here instead of going quietly untested.
 */
test('every layer a preset generates points at a conventions document with a dedicated skeleton', async (t) => {
  // The `tests` row is stated on every preset that has a `PRESET_TEST_ROOTS` entry — all but
  // `monorepo` and `flat`, whose layer-less profile is a decision — because the seed carries a test
  // root for each. That is what puts `tests.md` under the pairing assertion below: the other suite,
  // `stack-presets.test.mjs`, asserts layer names and paths and never reads `layers[].conventions`.
  const expectedLayers = {
    monorepo: ['general'],
    'layered-clean-arch': ['data', 'domain', 'presentation', 'tests', 'general'],
    'python-package': ['package', 'tests', 'general'],
    'api-service': ['api', 'tests', 'general'],
    flutter: ['lib', 'tests', 'general'],
    'android-gradle': ['app', 'tests', 'general'],
    jvm: ['main', 'tests', 'general'],
    dotnet: ['src', 'tests', 'general'],
    'apple-native': ['sources', 'tests', 'general'],
    'rust-cargo': ['src', 'tests', 'general'],
    // `app` rather than `lib`, and the seed already carries both: `RUBY_SOURCE_DIRS` puts `app`
    // first and `firstSourceDir` takes the first that exists, so the `app/` the Android manifest's
    // module put there is the one it finds. No directory is added for this preset for that reason.
    'ruby-bundler': ['app', 'tests', 'general'],
    // `app` for the row above's reason, and against the same directory: `PHP_SOURCE_DIRS` tries the
    // Laravel application root before PSR-4's `src/`, and the seed already carries both.
    'php-composer': ['app', 'tests', 'general'],
    // `src`, which the seed carries for the layered and .NET rows. The preset's second source row
    // is `CMAKE_HEADER_DIRS`' `include/`, which the seed does not carry, so it is dropped here —
    // the control that a project without public headers still gets exactly one source row.
    'cmake-cpp': ['src', 'tests', 'general'],
    flat: ['general'],
  };

  const probe = await fixtureFor(t, everyPresetSeed());
  const refusal = await runCli(probe, ['init', '--preset', 'no-such-preset']);
  assert.equal(refusal.status, 1);
  const listed = /expected one of ([^\n]+)/.exec(refusal.stderr);
  assert.notEqual(listed, null, `init refused an unknown preset without listing its own:\n${refusal.stderr}`);
  assert.deepEqual(
    listed[1].trim().split(', ').sort(),
    Object.keys(expectedLayers).sort(),
    'a preset was added or removed without a row in this test, so its layers are unchecked',
  );

  for (const [preset, layerNames] of Object.entries(expectedLayers)) {
    await t.test(preset, async (subtest) => {
      const dir = await fixtureFor(subtest, everyPresetSeed());

      const { stdout } = await initOk(dir, ['--preset', preset]);

      const { layers } = readJson(join(dir, CONFIG_FILE));
      assert.deepEqual(layers.map((layer) => layer.name), layerNames);

      for (const layer of layers) {
        const skeleton = join(PACKAGE_ROOT, ...CONTEXT_TEMPLATES, basename(layer.conventions));
        assert.ok(
          existsSync(skeleton),
          `the ${preset} preset points its \`${layer.name}\` layer at ${layer.conventions}, which no shipped skeleton is named for: ${skeleton}`,
        );
        assertRendered(dir, layer.conventions);
      }

      // The run's own note is the second half: a basename can have a skeleton on disk and still
      // fall through to the generic one, which is exactly the shape the drift took.
      assert.ok(
        !stdout.includes(GENERIC_STUB_NOTE),
        `the ${preset} preset wrote the generic skeleton for a layer of its own:\n${stdout}`,
      );
    });
  }
});

/**
 * Both halves of the untouched-skeleton test, asserted on the documents `init` actually wrote.
 *
 * "Has anybody filled this document in yet" is answered in three places outside this package — the
 * `setup-analysis` check, the closing question of a run, and the analyze command's decision to write
 * a target without asking — and all three read the marker **together with** the guidance block,
 * because each footer tells a hand-writer to replace everything above it: a leftover comment in an
 * otherwise hand-written document would report a finished one as untouched forever. A skeleton that
 * ships one half without the other answers that question wrong in all three at once, silently.
 *
 * The marker is asserted as the **last line** rather than as a substring, because that is the shape
 * the command clears it by; and the guidance block exactly once, because two of them survive a
 * partial hand-edit and keep reporting a half-written document as untouched.
 */
test('every conventions stub init writes carries both halves of the untouched-skeleton test, the marker last', async (t) => {
  const dir = await fixtureFor(t, everyPresetSeed());

  await initOk(dir, ['--preset', 'layered-clean-arch']);

  const written = await readdir(join(dir, CONTEXT_DIR));
  assert.ok(written.length > 1, `init wrote ${written.length} conventions stub(s), so this asserts almost nothing`);

  for (const name of written) {
    const content = text(dir, `${CONTEXT_DIR}/${name}`);
    assert.equal(
      content.trimEnd().split('\n').at(-1),
      UNFILLED_MARKER,
      `${name} does not end with ${UNFILLED_MARKER}, so nothing downstream can tell it from a filled document`,
    );
    assert.equal(
      content.split(GUIDANCE_MARKER).length - 1,
      1,
      `${name} does not carry exactly one ${GUIDANCE_MARKER} block, which is the other half of that test`,
    );
  }
});

/**
 * The invocation each footer prints is the **layer name**, not the document's path.
 *
 * Two vocabularies for this command shipped at once and the layer name is the one that survived
 * (`docs/analyze.md` §1); the failure this pins is a footer telling an adopter to run something that
 * resolves to nothing. The shared document is the case worth naming: it is written whether or not a
 * layer points at it, and when one does — every preset's `general` layer — that layer's name is what
 * reaches it, not the reserved word.
 */
test('each conventions stub names the analyze target of the layer that points at it', async (t) => {
  const dir = await fixtureFor(t, everyPresetSeed());

  await initOk(dir, ['--preset', 'layered-clean-arch']);

  for (const [stub, target] of [
    [`${CONTEXT_DIR}/data-layer.md`, 'data'],
    [`${CONTEXT_DIR}/domain.md`, 'domain'],
    [`${CONTEXT_DIR}/presentation.md`, 'presentation'],
    [`${CONTEXT_DIR}/tests.md`, 'tests'],
    [SHARED_STUB, 'general'],
  ]) {
    assert.ok(
      text(dir, stub).includes(`${ANALYZE_COMMAND} ${target}`),
      `${stub} does not tell its reader to run \`${ANALYZE_COMMAND} ${target}\`, which is the layer that points at it`,
    );
  }
});

/**
 * A layer named for a reserved target keeps its document and loses the one-word invocation.
 *
 * The config schema's `name` pattern admits `project`, `conventions` and `layers`, so this is a
 * legal repository rather than a hypothetical one. The rule is that the reserved meaning wins and
 * the run says so: a footer reading `/autonomous-sdlc-harness:harness-analyze project` would send the adopter at the
 * always-loaded project file while promising this layer's document, which is the silent resolution
 * the collision rule exists to refuse.
 */
test('a layer named for a reserved analyze target loses the bare word, and the run names the collision', async (t) => {
  const layerStub = `${CONTEXT_DIR}/project-layer.md`;
  const dir = await fixtureFor(t, {
    files: {
      ...nodeProjectFiles(),
      [CONFIG_FILE]: {
        version: 1,
        defaultBranch: 'main',
        stateDir: STATE_DIR_VALUE,
        layers: [
          { name: 'project', path: 'src/project', conventions: layerStub },
          { name: 'general', path: '.', conventions: SHARED_STUB },
        ],
        commands: { typecheck: 'echo typecheck', test: 'echo test' },
      },
    },
    dirs: ['src/project'],
  });

  const { stderr } = await initOk(dir);

  const content = text(dir, layerStub);
  assert.ok(
    !content.includes(`${ANALYZE_COMMAND} project`),
    `${layerStub} offers the reserved word as its own target, which addresses the project file instead`,
  );
  assert.ok(
    content.includes(`\`${ANALYZE_COMMAND}\``),
    `${layerStub} names no invocation at all, so the no-argument pass that does reach it goes unsaid`,
  );
  assert.match(stderr, /`project`/);
  assert.match(stderr, /reserved analyze target/);
});

/**
 * The commit-policy section the committer agent resolves `<commit_conventions>` against.
 *
 * That agent reads exactly one thing from a conventions document and states no message rule of its
 * own, so a shared skeleton without this section leaves it with nothing to apply — the drift that
 * shipped: the token was documented as generated at init while no template generated it. The
 * fragments are literals from the section rather than a constant, so a rewrite that drops the
 * fixed-form subjects, the trailer question or the per-class designation fails here.
 */
test('the shared conventions skeleton carries the commit-policy section the committer resolves against', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const shared = text(dir, SHARED_STUB);
  for (const fragment of [
    'commit-message policy',
    'attribution-trailer',
    'review_plan_file',
    'ui_test_pass',
    'Per commit class',
    'carries no prefix at all',
  ]) {
    assert.ok(shared.includes(fragment), `${SHARED_STUB} says nothing about ${fragment}`);
  }
});

/**
 * The setup-pending banner's delimiters, the fragment each wording is recognised by, the disposal
 * sentence both of them end on, and the two fill prompts the analyze pass classifies this file's
 * sections by.
 *
 * Literals rather than imports — choice 3 in the module header — and here for the usual reason
 * twice over: the `setup-analysis` check and the analyze command both read these delimiters off a
 * file in an adopter's repository, and the two prompt lines are the only signal by which that
 * command tells an untouched section of this file from a written one (this file carries neither
 * half of the untouched-skeleton test that answers the same question for a conventions document).
 */
const SETUP_PENDING_OPEN = '<!-- harness:setup-pending -->';
const SETUP_PENDING_CLOSE = '<!-- /harness:setup-pending -->';
const BANNER_ACCEPTED = 'was accepted at setup';
const BANNER_DECLINED = 'the analysis was declined at setup';
const BANNER_DISPOSAL = 'the block can be deleted by hand once these sections are written';
const BANNER_PLUGIN_ORIGIN = 'is a command of the harness plugin';
const PROJECT_PROMPT = 'writes this paragraph from the repository itself';
const NAMING_PROMPT = "fills this table from the repository's real file names";

/** The fragment of the run's own note saying an existing project file was left as it stands. */
const KEPT_PROJECT_FILE_NOTE = 'was kept as it stands, so the setup-pending banner was not written into it';

/** The same note's dry-run wording: the conditional a run that wrote nothing is owed. */
const KEPT_PROJECT_FILE_NOTE_DRY =
  'would be kept as it stands, so the setup-pending banner would not be written into it';

/**
 * A compiled generator, imported for the one wording no command line reaches yet: the banner a
 * declined offer records. The offer is an *input* to this generator, so rendering both wordings is
 * the only way to assert that neither leaves its reader without a way out of the block — and a
 * banner is written once, at setup, into a file every later run keeps.
 */
async function loadCompiled(relativePath) {
  const path = join(PACKAGE_ROOT, 'dist', relativePath);
  if (!existsSync(path)) {
    throw new Error(
      `${path} is missing. These tests run against the compiled CLI, so run \`npm run build\` before \`npm test\`.`,
    );
  }
  return import(pathToFileURL(path).href);
}

const { writeClaudeContext } = await loadCompiled('generators/claudeContext.js');
const { WritePlan } = await loadCompiled('core/writer.js');

/** What the generator would write into `.claude/CLAUDE.md` for one answer, without writing it. */
function renderProjectFile(dir, analyzeOffer) {
  const plan = new WritePlan();
  writeClaudeContext({ repoRoot: dir, config: readJson(join(dir, CONFIG_FILE)), plan, analyzeOffer });
  const request = plan.requests.find((entry) => entry.path === join(dir, CLAUDE_MD));
  assert.ok(request !== undefined, `the generator enqueued no write for ${CLAUDE_MD}`);
  return request.content;
}

/** The banner block itself, delimiters included — so an assertion cannot pass on prose outside it. */
function bannerBlock(content, describe) {
  const from = content.indexOf(SETUP_PENDING_OPEN);
  const to = content.indexOf(SETUP_PENDING_CLOSE);
  assert.ok(from !== -1 && to > from, `the ${describe} project file carries no delimited setup-pending block`);
  return content.slice(from, to + SETUP_PENDING_CLOSE.length);
}

/**
 * The banner is the whole hand-off: `init` cannot run a model command, so it records the answer in
 * the one file every session in that repository loads without being asked.
 *
 * It is asserted **above the project paragraph** because that is what makes it the first thing read,
 * and the file's existing content is asserted alongside it because the banner is an insertion into a
 * generated file that already had three jobs — naming the project, routing to the conventions
 * documents, and resolving the ledger path against the checkout in hand.
 */
test('the generated project file leads with the setup-pending banner, in the accepted wording by default', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const content = text(dir, CLAUDE_MD);
  const banner = bannerBlock(content, 'generated');
  assert.ok(banner.includes(BANNER_ACCEPTED), `the banner is not the accepted wording, which is the default:\n${banner}`);
  assert.ok(!banner.includes(BANNER_DECLINED), `the banner carries both wordings at once:\n${banner}`);
  assert.ok(
    content.indexOf(SETUP_PENDING_CLOSE) < content.indexOf(PROJECT_PROMPT),
    'the banner sits below the project paragraph it calls a skeleton, so it is not the first thing read',
  );

  // What the file already carried, unchanged by the insertion.
  const config = readJson(join(dir, CONFIG_FILE));
  assert.ok(content.startsWith(`# ${config.projectName}\n`), 'the heading is no longer the first line of the file');
  assert.ok(
    content.includes('[`context/conventions.md`](context/conventions.md)'),
    'the routing table lost the row pointing at the shared conventions document',
  );
  assert.ok(content.includes(`<root>/${STATE_DIR}/lessons.md`), 'the ledger-resolution rule lost the configured stateDir');
});

/**
 * **Every wording ends by saying how the block goes away**, and the declined one's route does not
 * require the command that was declined.
 *
 * This file is loaded on every turn of every session, `create-if-absent` means no later unforced run
 * revises the block, and a forced one replaces the whole file rather than editing it — so a wording
 * that named only the command would leave the adopter who declined carrying "setup is not finished",
 * and `doctor`'s matching warning, for as long as the repository lives.
 *
 * **Both wordings also say where the command comes from, and say it before their disposal sentence.**
 * A reader whose session does not resolve the plugin finds no such command, and the banner is where
 * that is answered; the decliner reaches for it exactly as the accepter does, so neither arm may be
 * the one without the clause. The index comparison is what pins the ordering: appending the clause
 * after the disposal sentence would satisfy a bare `includes` pair while leaving the wording ending
 * on something other than its own disposal.
 */
test('both banner wordings say where the command comes from and end on their own disposal', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  for (const [offer, fragment] of [
    ['accepted', BANNER_ACCEPTED],
    ['declined', BANNER_DECLINED],
  ]) {
    const banner = bannerBlock(renderProjectFile(dir, offer), offer);
    assert.ok(banner.includes(fragment), `the ${offer} banner does not say what was answered:\n${banner}`);
    assert.ok(
      banner.includes(BANNER_PLUGIN_ORIGIN),
      `the ${offer} banner never says where the command comes from, so a session that does not resolve the plugin has nothing to read:\n${banner}`,
    );
    assert.ok(
      banner.includes(BANNER_DISPOSAL),
      `the ${offer} banner never says the block can be deleted by hand, so its only route out is the command:\n${banner}`,
    );
    assert.ok(
      banner.indexOf(BANNER_DISPOSAL) > banner.indexOf(BANNER_PLUGIN_ORIGIN),
      `the ${offer} banner no longer ends on its own disposal: the plugin-origin clause was placed after it:\n${banner}`,
    );
  }
});

/**
 * The plugin name reaches the project file's command spellings through the `pluginName` render value,
 * taken from `PLUGIN_NAME`, never as a literal typed into the template — so a token left unrendered is
 * as much a fault as an unqualified spelling.
 */
test('the generated project file spells the harness commands qualified by the plugin name', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const content = text(dir, CLAUDE_MD);
  for (const spelling of [
    '/autonomous-sdlc-harness:harness-analyze',
    '/autonomous-sdlc-harness:branch-*',
    '/autonomous-sdlc-harness:harness-*',
  ]) {
    assert.ok(content.includes(spelling), `${CLAUDE_MD} does not carry the qualified spelling ${spelling}`);
  }
  assert.ok(!content.includes('{{pluginName}}'), `${CLAUDE_MD} carries an unrendered {{pluginName}} token`);
});

/**
 * The two fill prompts, which are a cross-task interface rather than prose: they are what the analyze
 * pass classifies this file's two fillable sections — the project paragraph and the naming table — as
 * untouched or already written by, so each has to stay one line, appear once, and sit in its own
 * section. Merged, duplicated or split, that classification has nothing unambiguous to read.
 */
test('the project file carries each fill prompt once, in its own section, and neither half of the skeleton test', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const content = text(dir, CLAUDE_MD);
  for (const prompt of [PROJECT_PROMPT, NAMING_PROMPT]) {
    assert.equal(occurrences(content, prompt), 1, `${CLAUDE_MD} does not carry "${prompt}" exactly once`);
    const line = content.split('\n').find((candidate) => candidate.includes(prompt));
    assert.ok(line.startsWith('_') && line.endsWith('_'), `"${prompt}" is not one whole line of its own:\n${line}`);
  }
  assert.ok(
    content.indexOf(PROJECT_PROMPT) < content.indexOf('## File naming conventions'),
    'both fill prompts now sit in the same section, so neither addresses one fillable section',
  );
  for (const marker of [UNFILLED_MARKER, GUIDANCE_MARKER]) {
    assert.ok(
      !content.includes(marker),
      `${CLAUDE_MD} carries ${marker}, the conventions-stub test, which gives the analyze pass a second and conflicting signal`,
    );
  }
});

/**
 * The re-run outcome this branch neither defends against nor pretends away: an existing project file
 * is **kept**, so no banner reaches it and the run says so.
 *
 * `.claude/CLAUDE.md` is `create-if-absent` with no per-request override, so an unforced second run
 * writes nothing into a file that is already there — the answer that run recorded is carried by its
 * closing report and by what `doctor` reads, not by a block that is not in the file. (The forced
 * counterpart, where `--force` regenerates the file after a `.bak` and the banner comes back, is
 * asserted at the call site that words the report.)
 */
test('an unforced re-run keeps an existing project file byte for byte, and says no banner was written into it', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  const handWritten = '# hand-written\n\nThis project file was written by hand and carries no banner.\n';
  writeFileSync(join(dir, CLAUDE_MD), handWritten, 'utf8');

  const { stdout } = await initOk(dir);

  assert.equal(text(dir, CLAUDE_MD), handWritten, `a re-run rewrote ${CLAUDE_MD}, which the adopter owns`);
  assert.ok(
    stdout.includes(KEPT_PROJECT_FILE_NOTE),
    `the run does not say ${CLAUDE_MD} was kept and carries no banner, so its output claims a record that is not there:\n${stdout}`,
  );
});

/**
 * The same note under `--dry-run`, in the conditional: the run kept nothing because it wrote nothing
 * at all, and the closing pointer on that same output is already in the conditional — so a
 * past-tense note here would contradict the line printed under it.
 */
test('a dry re-run over an existing project file says it would be kept, not that it was', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  const before = await snapshotTree(dir);

  const { stdout } = await initOk(dir, ['--dry-run']);

  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote into the repository');
  assert.ok(
    stdout.includes(KEPT_PROJECT_FILE_NOTE_DRY),
    `a dry run does not say ${CLAUDE_MD} would be kept:\n${stdout}`,
  );
  assert.ok(!stdout.includes(KEPT_PROJECT_FILE_NOTE), `a dry run claims it kept ${CLAUDE_MD}:\n${stdout}`);
});

/**
 * The analyze offer: the two spellings that answer it, the documented default that answers when
 * neither is given, and the four closing wordings keyed on what the write engine did.
 *
 * Every subprocess here has a pipe for stdin — module header, "no prompt is ever answered here" — so
 * these exercise the flag and the default only. The *answered* side is acceptance gate 7(iii), run by
 * hand at a terminal.
 *
 * The fragments are literals rather than imports, choice 3 in the module header, and the closing
 * wordings are asserted **against each other** as well as on their own: the failure worth catching is
 * a run that claims a banner records the answer in a file it did not write.
 */
const ANALYZE_FLAG = '--analyze';
const NO_ANALYZE_FLAG = '--no-analyze';

/** The helper's own unasked-decision note, which `askYesNo` would not print under `--non-interactive`. */
const UNASKED_ANALYZE_NOTE = `pass ${NO_ANALYZE_FLAG} to decline it without being asked`;

/** The skip branch's note: nothing is left to fill, so the offer is not put again. */
const ALREADY_FILLED_NOTE = 'the conventions documents are already filled';

/** The four closing wordings, by the fragment each is recognised by. */
const RECORDED_ANSWER = 'records that answer';
const WOULD_RECORD_ANSWER = 'would record that answer';
const RECORDED_DECLINED = 'records that the analysis was declined';
const KEPT_NOTHING_RECORDED = 'was kept as it stands and nothing was recorded in it';
const FORCED_REGENERATED = '--force regenerated that whole file from the template';
const CONVENTIONS_REGENERATED = 'back to skeletons after their own .bak siblings';

/** The two kept-outcome arms a skip run has to be told apart by: the declined one, and its own. */
const BY_HAND_POINTER = 'yours to write by hand';
const NOTHING_TO_OFFER_POINTER = 'already written, so there was nothing to offer';

/** The closing report's step naming the command, its targets and what was recorded. */
function nextStepsLine(stdout) {
  const line = stdout
    .split('\n')
    .find((candidate) => /^\d+\. /.test(candidate) && candidate.includes(ANALYZE_COMMAND));
  assert.ok(line !== undefined, `the run printed no closing analyze pointer:\n${stdout}`);
  return line;
}

/** The closing report's first step: the plugin wiring this run left, which the analyze step needs. */
function pluginWiringLine(stdout) {
  const line = stdout.split('\n').find((candidate) => candidate.startsWith('1. '));
  assert.ok(line !== undefined, `the closing report has no first step:\n${stdout}`);
  return line;
}

/** The closing report's step sending the adopter to the generated config, where the run settings are named. */
function configStepLine(stdout) {
  const line = stdout
    .split('\n')
    .find((candidate) => /^\d+\. /.test(candidate) && candidate.includes(`Read ${CONFIG_FILE}`));
  assert.ok(line !== undefined, `the closing report has no step naming ${CONFIG_FILE}:\n${stdout}`);
  return line;
}

/** The closing report's last step, located by its own text: `doctor` is named on other steps too. */
const DOCTOR_STEP_FRAGMENT = 'to verify the wiring';
function doctorStepLine(stdout) {
  const line = stdout
    .split('\n')
    .find((candidate) => /^\d+\. /.test(candidate) && candidate.includes(DOCTOR_STEP_FRAGMENT));
  assert.ok(line !== undefined, `the closing report has no step sending the adopter to doctor:\n${stdout}`);
  return line;
}

/** The two operator steps that last step names while the interactive-test phase is on. */
const DAEMON_INSTALL_STEP = 'npx autonomous-sdlc-harness daemon install';
const PERMISSION_ENTRIES_STEP = 'permissions.allow';

/**
 * The registry sentence that same step carries under its **other** gate — the browser wiring's, not
 * the phase's. The launcher and the flag are the two fragments an adopter acts on; the pinned specs
 * are deliberately absent, so nothing here asserts a version.
 */
const REGISTRY_LAUNCHER_STEP = 'npx -y';
const CHECK_REGISTRY_STEP = 'npx autonomous-sdlc-harness doctor --check-registry';

/** The two run settings that step names, and the one-key `config set` form it points at for both. */
const RUN_SETTING_KEYS = ['agentModel', 'agentEffort'];
const CONFIG_SET_RUN_SETTING = 'npx autonomous-sdlc-harness config set <key> <value>';

/** The composite key `enabledPlugins` holds, from the two manifests rather than from a literal. */
function pluginKey() {
  const plugin = readJson(join(WORKSPACE_ROOT, 'plugin', '.claude-plugin', 'plugin.json'));
  const marketplace = readJson(join(WORKSPACE_ROOT, '.claude-plugin', 'marketplace.json'));
  return `${plugin.name}@${marketplace.name}`;
}

/** The invocation the accepted arm prints for pasting, and the three fragments the unresolved-slug arm owes. */
const PASTEABLE_INVOCATION = `claude "${ANALYZE_COMMAND}"`;
const MARKETPLACE_ADD_VERB = 'claude plugin marketplace add';
const MARKETPLACE_FLAG = '--marketplace';
const MARKETPLACES_KEY = 'extraKnownMarketplaces';

/** The discriminator the entry's inner `source` object carries for a repository-published marketplace. */
const MARKETPLACE_ENTRY_SOURCE = 'github';

/**
 * Assert the `extraKnownMarketplaces` value carries one entry in the shape the host tool accepts:
 * `{ "<marketplace>": { "source": { "source": "github", "repo": "<owner>/<repo>" } } }`, measured on
 * Claude Code 2.1.246 from what `claude plugin marketplace add <owner>/<repo> --scope project`
 * itself writes.
 *
 * One helper rather than a copy per caller, and the last clause is why it exists. Both callers below
 * once read `repo` off the entry's **top level**, which is the flattened shape the host tool ignores
 * with a `Settings Warning` — so the suite was green over a settings file that resolved no plugin.
 * Asserting the nesting *and* the absence of the flattened key is what turns the next drift red
 * here instead of at an adopter's clone, and a third caller cannot re-encode a shape by hand.
 */
function assertMarketplaceEntry(marketplaces, slug, where) {
  assert.ok(
    typeof marketplaces === 'object' && marketplaces !== null,
    `${where}: ${SETTINGS_FILE} carries no ${MARKETPLACES_KEY} object, but ${JSON.stringify(marketplaces)}`,
  );
  const entry = Object.values(marketplaces)[0];
  assert.ok(
    typeof entry === 'object' && entry !== null,
    `${where}: the ${MARKETPLACES_KEY} entry is ${JSON.stringify(entry)} rather than an object`,
  );
  assert.ok(
    typeof entry.source === 'object' && entry.source !== null,
    `${where}: the entry's source is ${JSON.stringify(entry.source)} rather than an object — the host tool ignores an entry of that shape and the clone resolves no plugin`,
  );
  assert.equal(
    entry.source.source,
    MARKETPLACE_ENTRY_SOURCE,
    `${where}: the entry's inner source names ${JSON.stringify(entry.source.source)} rather than ${MARKETPLACE_ENTRY_SOURCE}`,
  );
  assert.equal(
    entry.source.repo,
    slug,
    `${where}: the entry names ${JSON.stringify(entry.source.repo)} rather than ${slug}`,
  );
  assert.ok(
    !Object.hasOwn(entry, 'repo'),
    `${where}: the entry carries a top-level repo key — the flattened shape the host tool rejects`,
  );
}

/** The reload pointer, which only a run that actually merged the keys has anything to offer it for. */
const RELOAD_POINTER = '/reload-plugins';

/** The precondition the paste line's introducing sentence carries on the unresolved-slug arm. */
const PASTE_PRECONDITION = 'Once the plugin resolves';

/** The unmeasured-outcome clause the same sentence carries on every arm that prints the line. */
const PASTE_UNCONFIRMED = 'not confirmed on the version measured here';

/**
 * The slug the resolved arm is driven with, through {@link MARKETPLACE_FLAG}.
 *
 * A literal rather than this package's own `repository.url`, because the flag overrides that URL:
 * the arm is then reached identically whether the manifest around these tests names a published
 * repository or not, which is what keeps both arms below driven in a fork as well as here.
 */
const CHOSEN_SLUG = 'octo-org/harness-marketplace';

/** A `repository.url` naming no account — the shape `resolveSlug` refuses, for the root built below. */
const UNRESOLVED_REPOSITORY_URL = 'https://github.com/<owner>/autonomous-sdlc-harness.git';

/**
 * Run `init` with the slug **unresolved**, from a package root the test builds.
 *
 * The arm is keyed on this package's own manifest — `generators/projectSettings.ts` parses
 * `repository.url` and writes no `extraKnownMarketplaces` entry when it names no account — and no
 * flag reaches it: {@link MARKETPLACE_FLAG} supplies a slug and refuses a malformed one, so it can
 * only ever produce the *resolved* arm. So the run is given a package root of its own: the compiled
 * tree copied beside a manifest whose `repository.url` carries no account, with `templates/` and
 * `scripts/` linked rather than copied because nothing resolves them as modules. Everything else is
 * the ordinary runner's, including the isolated environment.
 *
 * The root lives under `os.tmpdir()` and is torn down with the fixture, for the reason
 * `helpers/fixture.mjs` gives: nothing a test builds is ever created inside this checkout.
 */
async function initUnresolvedSlug(t, dir, args = []) {
  const root = await mkdtemp(join(tmpdir(), 'harness-unresolved-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  await cp(join(PACKAGE_ROOT, 'dist'), join(root, 'dist'), { recursive: true });
  for (const asset of ['templates', 'scripts']) {
    await symlink(join(PACKAGE_ROOT, asset), join(root, asset));
  }
  const manifest = readJson(join(PACKAGE_ROOT, 'package.json'));
  const unresolved = { ...manifest, repository: { type: 'git', url: UNRESOLVED_REPOSITORY_URL } };
  writeFileSync(join(root, 'package.json'), `${JSON.stringify(unresolved, null, 2)}\n`, 'utf8');

  const result = await runCliFrom(join(root, 'dist', 'cli.js'), dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

/**
 * Fill every conventions document by hand, as an adopter who wrote their own rules would: drop the
 * unfilled marker. Either half's absence is enough to make a document not an untouched skeleton.
 */
async function fillConventionsByHand(dir) {
  for (const name of await readdir(join(dir, CONTEXT_DIR))) {
    const path = join(dir, CONTEXT_DIR, name);
    writeFileSync(path, readFileSync(path, 'utf8').split(UNFILLED_MARKER).join(''), 'utf8');
  }
}

/** Delete the whole setup-pending block from the project file, delimiters included. */
function deleteBannerByHand(dir) {
  const content = text(dir, CLAUDE_MD);
  const from = content.indexOf(SETUP_PENDING_OPEN);
  const to = content.indexOf(SETUP_PENDING_CLOSE);
  assert.ok(from !== -1 && to > from, `${CLAUDE_MD} carries no banner block to delete`);
  writeFileSync(join(dir, CLAUDE_MD), content.slice(0, from) + content.slice(to + SETUP_PENDING_CLOSE.length), 'utf8');
}

/**
 * The documented default is **yes**, and the run that took it says so itself.
 *
 * That note is the helper's own rather than `askYesNo`'s, and this is the case that proves it:
 * `askYesNo` prints only on its no-terminal path and returns the default silently under
 * `--non-interactive` and `--quiet`, so a note left to it would be missing from exactly the
 * unattended run that most needs it. It is narration, so `--quiet` still suppresses it.
 */
test('a run that cannot be asked accepts the analyze offer, and names the flag that declines it', async (t) => {
  for (const testCase of [
    { name: 'a piped stdin', argv: [], note: 1 },
    { name: '--non-interactive, which askYesNo answers silently', argv: ['--non-interactive'], note: 1 },
    { name: '--quiet, which suppresses narration with the rest', argv: ['--non-interactive', '--quiet'], note: 0 },
  ]) {
    await t.test(testCase.name, async (subtest) => {
      const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

      const { stdout } = await initOk(dir, testCase.argv);

      assert.equal(
        occurrences(stdout, UNASKED_ANALYZE_NOTE),
        testCase.note,
        `the unasked-decision note appeared ${occurrences(stdout, UNASKED_ANALYZE_NOTE)} times:\n${stdout}`,
      );
      assert.ok(
        bannerBlock(text(dir, CLAUDE_MD), 'default').includes(BANNER_ACCEPTED),
        `the default answer did not record the accepted wording in ${CLAUDE_MD}`,
      );
    });
  }
});

/**
 * `--no-analyze` records the declined wording — disposal sentence and all — and the run still names
 * the command, because declining is not meant to be permanent.
 */
test('--no-analyze records the declined wording, and the run still names the command', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir, [NO_ANALYZE_FLAG]);

  const banner = bannerBlock(text(dir, CLAUDE_MD), 'declined');
  assert.ok(banner.includes(BANNER_DECLINED), `${NO_ANALYZE_FLAG} did not record the declined wording:\n${banner}`);
  assert.ok(
    banner.includes(BANNER_DISPOSAL),
    `the declined banner never says the block can be deleted by hand:\n${banner}`,
  );
  assert.ok(
    !stdout.includes(UNASKED_ANALYZE_NOTE),
    'the flag answered the offer, so nothing should report having taken a default',
  );
  assert.ok(
    nextStepsLine(stdout).includes(ANALYZE_COMMAND) && stdout.includes(RECORDED_DECLINED),
    `a decliner is not told the command is still there, nor where the answer was recorded:\n${stdout}`,
  );
});

/**
 * The two spellings answer one question opposite ways, so giving both is a usage error rather than a
 * precedence rule — and it is refused **in the parser**, before the git gate, so a contradictory
 * command line never costs an adopter a repository this run created and then declined to wire.
 */
test('--analyze and --no-analyze together are refused, and nothing is written', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const result = await runCli(dir, ['init', ANALYZE_FLAG, NO_ANALYZE_FLAG]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--analyze and --no-analyze/);
  assert.equal(await exists(dir, CONFIG_FILE), false);
  assert.equal(await exists(dir, CLAUDE_MD), false);
});

/**
 * The skip branch, with all three of its conditions in the fixture: an unforced run, every
 * conventions document filled by hand, and a project file that is there and carries no open banner.
 *
 * The fixture has to delete the block as well as the markers — a repository wired by this release
 * carries the accepted banner by default, so without that deletion condition (2c) fails and the
 * offer *is* put, which is the opposite of what this asserts.
 *
 * The closing pointer is read too, because no answer was taken on this path: the resolution's `offer`
 * is a placeholder there, and the declined arm it would otherwise select tells an adopter whose
 * documents are all written to write them by hand.
 */
test('a re-run with nothing left to fill does not put the offer again, and leaves the project file alone', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  await fillConventionsByHand(dir);
  deleteBannerByHand(dir);
  const before = text(dir, CLAUDE_MD);

  const { stdout } = await initOk(dir);

  assert.ok(stdout.includes(ALREADY_FILLED_NOTE), `the quiet re-run does not say why it asked nothing:\n${stdout}`);
  assert.ok(
    !stdout.includes(UNASKED_ANALYZE_NOTE),
    'the offer was resolved by the documented default rather than skipped',
  );
  assert.equal(text(dir, CLAUDE_MD), before, `the skip branch wrote into ${CLAUDE_MD}, which it must leave alone`);
  const line = nextStepsLine(stdout);
  assert.ok(
    !line.includes(BY_HAND_POINTER),
    `the run tells an adopter with filled documents to write them by hand:\n${line}`,
  );
  assert.ok(
    line.includes(NOTHING_TO_OFFER_POINTER),
    `the closing pointer does not say why nothing was offered:\n${line}`,
  );
});

/**
 * A dry run records nothing and still reports the wording it would have recorded — in the
 * conditional, because a dry run may no more claim a record it did not make than omit one a real run
 * would have made.
 */
test('--dry-run writes nothing and still reports the wording it would have recorded', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  const before = await snapshotTree(dir);

  const { stdout } = await initOk(dir, ['--dry-run']);

  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote into the repository');
  const line = nextStepsLine(stdout);
  assert.ok(line.includes(WOULD_RECORD_ANSWER), `a dry run does not say which wording it would record:\n${line}`);
  assert.ok(!line.includes(RECORDED_ANSWER), `a dry run claims a banner it never wrote:\n${line}`);
});

/**
 * The closing pointer's target list is the settled vocabulary: the configured layer names **and** the
 * three reserved names, which name no layer and which a layer list alone can never produce.
 *
 * Asserted on the list itself rather than as substrings of the whole line, and on its order, because
 * `conventions` and `project` are ordinary English words elsewhere in the same sentence.
 */
test('the closing pointer names every analyze target: the configured layers and the three reserved names', async (t) => {
  const dir = await fixtureFor(t, everyPresetSeed());

  const { stdout } = await initOk(dir, ['--preset', 'layered-clean-arch']);

  const named = /targets: ([^)]+)\)/.exec(nextStepsLine(stdout));
  assert.ok(named !== null, `the closing pointer names no targets:\n${nextStepsLine(stdout)}`);
  assert.deepEqual(named[1].split(', '), [
    'data',
    'domain',
    'presentation',
    'tests',
    'general',
    'project',
    'conventions',
    'layers',
  ]);
});

/**
 * The report is an ordered sequence, and the plugin wiring is its first step.
 *
 * The command named in the analyze step exists only in a session that resolves this package's
 * plugin, so a report that opened with "run it" stated the instruction above its own precondition.
 * The ordering is what is asserted — the wiring at step 1, the analyze step after it — because a
 * clause added anywhere below would satisfy a bare `includes` and leave the defect in place.
 */
test('the closing report opens with the plugin wiring this run left, and the analyze step follows it', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir);

  const wiring = pluginWiringLine(stdout);
  assert.ok(wiring.includes(pluginKey()), `the first step does not name the composite plugin key:\n${wiring}`);
  assert.ok(wiring.includes(SETTINGS_FILE), `the first step does not say where the key was written:\n${wiring}`);
  assert.ok(
    nextStepsLine(stdout).startsWith('2. '),
    `the analyze step is not the second one, so the plugin wiring is not what the report opens with:\n${stdout}`,
  );
});

/**
 * The two run settings, named where the adopter is already being sent — because `init` asks about
 * neither.
 *
 * `agentModel` has a working default for every adopter and an absent `agentEffort` resolves to the
 * runtime's own per-model default, so a prompt for either would put a question whose answer is
 * already correct. What that leaves is a key discoverable only by reading the schema, and step 3 —
 * already the step that tells the adopter to open the generated config — is where it is closed. The
 * step is located by its own text rather than by index, so a later reordering of the four steps
 * fails here instead of matching the wrong line.
 */
test('the closing report names both run settings and the verb that sets them', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir);

  const step = configStepLine(stdout);
  for (const fragment of [...RUN_SETTING_KEYS, CONFIG_SET_RUN_SETTING]) {
    assert.ok(step.includes(fragment), `the config step never names ${fragment}:\n${step}`);
  }
});

/**
 * The two steps no run can perform for the adopter, named in the closing list — and named only while
 * the interactive-test phase is on.
 *
 * `--qa` is precisely the flag that makes the plugin's helper scripts reachable, and a run that
 * turned them on used to close with the same four steps a phase-off run prints: nothing in its output
 * said that an inbox nobody watches polls nothing, or that the `permissions.allow` entries those
 * helpers need are hand-added. The **consequence** is asserted with each verb, not only the verb,
 * because that is what decides whether an adopter acts before the first unattended run or after one
 * has parked with no error.
 *
 * The uniqueness assertion rides along: the analyze step is found by being the one numbered line
 * naming the command, and a clause added to another step must not make that two.
 */
test('the closing report names both operator steps when the interactive-test phase is on', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir, ['--qa']);

  const step = doctorStepLine(stdout);
  for (const fragment of [DAEMON_INSTALL_STEP, PERMISSION_ENTRIES_STEP]) {
    assert.ok(step.includes(fragment), `the closing step never names ${fragment}:\n${step}`);
  }
  assert.match(step, /inbox/, `the daemon half names no consequence, so it reads as optional:\n${step}`);
  assert.match(step, /no error/, `the permissions half does not say the run stalls silently:\n${step}`);

  const naming = stdout.split('\n').filter((line) => /^\d+\. /.test(line) && line.includes(ANALYZE_COMMAND));
  assert.equal(naming.length, 1, `${naming.length} numbered steps name ${ANALYZE_COMMAND}, which must identify one:\n${stdout}`);
});

/**
 * The negative half, and it is what keeps the clause conditional: with the phase off the helper
 * scripts are unreachable, and a step every adopter is told about but only some owe is how a closing
 * list stops being read.
 */
test('a run with the interactive-test phase off names neither operator step', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir);

  const step = doctorStepLine(stdout);
  for (const fragment of [DAEMON_INSTALL_STEP, PERMISSION_ENTRIES_STEP]) {
    assert.ok(
      !step.includes(fragment),
      `a phase-off run names ${fragment}, which nothing it wired makes reachable:\n${step}`,
    );
  }
});

/**
 * The same step's other sentence, and its two negative controls — because it rides a **different**
 * gate from the operator steps above and a sentence printed unconditionally would pass the positive
 * assertion alone.
 *
 * The fact it states is the one an adopter cannot infer from a green `init`: `.mcp.json` launches the
 * browser servers with `npx -y`, so the pinned packages are fetched at the first interactive-test
 * dispatch rather than installed here — offline, behind a proxy or on a mirror without those exact
 * versions, that is where the run stops, after everything before it has been paid for. So the flag
 * that answers it beforehand is asserted with it: a step naming a fact and no remedy is one an
 * adopter reads and cannot act on.
 *
 * **Both negatives are runs with no `.mcp.json`, reached by the two different routes.** A mobile
 * driver has the phase *on* — it still owes the operator steps — and writes no browser wiring; a
 * phase-off run writes none either. Asserting only the second would leave the sentence passing while
 * gated on `phases.qa`, which is exactly the merge the two gates exist to prevent.
 */
test('the closing report says the browser servers are fetched on first use, and only where they were declared', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir, ['--qa']);

  const step = doctorStepLine(stdout);
  assert.ok(step.includes(MCP_FILE), `the closing step never names ${MCP_FILE}:\n${step}`);
  assert.ok(step.includes(REGISTRY_LAUNCHER_STEP), `the closing step never names the launcher:\n${step}`);
  assert.match(step, /first time/, `the step does not say the packages are fetched on first use:\n${step}`);
  assert.ok(step.includes(CHECK_REGISTRY_STEP), `the step names no command that checks it beforehand:\n${step}`);

  // Negative one: the phase is on, the operator steps are owed, and no browser wiring was written.
  const mobile = await fixtureFor(t, { files: nodeProjectFiles() });
  const mobileStep = doctorStepLine((await initOk(mobile, ['--qa', '--qa-driver', QA_DRIVER_CHOSEN])).stdout);
  assert.equal(await exists(mobile, MCP_FILE), false, `${MCP_FILE} was written for a mobile driver`);
  assert.ok(
    mobileStep.includes(DAEMON_INSTALL_STEP),
    `the mobile run lost the operator steps, so the negative below proves nothing:\n${mobileStep}`,
  );
  assert.ok(
    !mobileStep.includes(CHECK_REGISTRY_STEP),
    `a run with no ${MCP_FILE} is told its pinned packages are fetched on first use:\n${mobileStep}`,
  );

  // Negative two: the phase is off, so neither gate holds.
  const off = await fixtureFor(t, { files: nodeProjectFiles() });
  const offStep = doctorStepLine((await initOk(off)).stdout);
  assert.ok(
    !offStep.includes(CHECK_REGISTRY_STEP),
    `a phase-off run is told about a registry fetch nothing it wired would make:\n${offStep}`,
  );
});

/**
 * The first step's two arms, each driven at its own input, because which one a run takes is decided
 * by the marketplace slug and a report that stated the wrong one would be wrong in both directions.
 *
 * **Resolved** — a slug is known, so the `extraKnownMarketplaces` entry is written beside the
 * enablement key and the step says so, naming the slug it wrote; the entry itself is read back,
 * because a step claiming a key that is not in the file is the failure worth catching. It carries
 * neither route out of the unresolved state: an adopter whose clone already resolves the plugin has
 * nothing to add by hand, and being told to is what the sentence exists to avoid.
 *
 * **Unresolved** — no entry is written, a session has no way to resolve the plugin the enablement
 * key names, and the report owes both routes out of it: the host tool's own verb for this machine,
 * and the flag that writes the entry into the committed file for everyone who clones the repository.
 *
 * Both arms merged the enablement key, so both owe the pointer that says how an already-open session
 * picks it up.
 */
test('the first step states the marketplace wiring: the entry it wrote, or both routes out of an unresolved slug', async (t) => {
  const resolvedDir = await fixtureFor(t, { files: nodeProjectFiles() });
  const unresolvedDir = await fixtureFor(t, { files: nodeProjectFiles() });

  const resolved = pluginWiringLine((await initOk(resolvedDir, [MARKETPLACE_FLAG, CHOSEN_SLUG])).stdout);
  const unresolved = pluginWiringLine((await initUnresolvedSlug(t, unresolvedDir)).stdout);

  for (const fragment of [MARKETPLACES_KEY, CHOSEN_SLUG]) {
    assert.ok(resolved.includes(fragment), `the first step never mentions ${fragment}:\n${resolved}`);
  }
  for (const fragment of [MARKETPLACE_ADD_VERB, MARKETPLACE_FLAG]) {
    assert.ok(
      !resolved.includes(fragment),
      `the first step sends an adopter whose clone already resolves the plugin to ${fragment}:\n${resolved}`,
    );
  }
  assertMarketplaceEntry(
    readJson(join(resolvedDir, SETTINGS_FILE))[MARKETPLACES_KEY],
    CHOSEN_SLUG,
    `the first step claims a ${MARKETPLACES_KEY} entry naming ${CHOSEN_SLUG}`,
  );

  for (const fragment of [MARKETPLACES_KEY, MARKETPLACE_ADD_VERB, MARKETPLACE_FLAG]) {
    assert.ok(unresolved.includes(fragment), `the first step never mentions ${fragment}:\n${unresolved}`);
  }
  assert.equal(
    readJson(join(unresolvedDir, SETTINGS_FILE))[MARKETPLACES_KEY],
    undefined,
    `an unresolved slug was written into ${SETTINGS_FILE} as a placeholder entry`,
  );

  for (const wiring of [resolved, unresolved]) {
    assert.ok(
      wiring.includes(RELOAD_POINTER),
      `a run that merged the enablement key never says how an open session picks it up:\n${wiring}`,
    );
  }
});

/** The CLI's own slug parser, so the gate below reads the shipped manifest the way `init` reads it. */
const { parseRepoSlug } = await loadCompiled('core/paths.js');

/** The account shape a slot has to name — the pattern `projectSettings.ts` resolves a slug against. */
const OWNER_SHAPE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

/**
 * Every slot in the three shipped manifests that holds the publishing account, labelled by where it
 * is, so a failure names the file and key to fix rather than only the value that was wrong.
 */
function shippedOwnerSlots() {
  const cli = readJson(join(PACKAGE_ROOT, 'package.json'));
  const plugin = readJson(join(WORKSPACE_ROOT, 'plugin', '.claude-plugin', 'plugin.json'));
  const marketplace = readJson(join(WORKSPACE_ROOT, '.claude-plugin', 'marketplace.json'));
  return [
    ['cli/package.json author', cli.author],
    ['cli/package.json homepage', cli.homepage],
    ['cli/package.json repository.url', cli.repository?.url],
    ['plugin/.claude-plugin/plugin.json author.name', plugin.author?.name],
    ['plugin/.claude-plugin/plugin.json author.url', plugin.author?.url],
    ['plugin/.claude-plugin/plugin.json homepage', plugin.homepage],
    ['plugin/.claude-plugin/plugin.json repository', plugin.repository],
    ['.claude-plugin/marketplace.json owner.name', marketplace.owner?.name],
    ['.claude-plugin/marketplace.json owner.url', marketplace.owner?.url],
    ['.claude-plugin/marketplace.json plugins[0].author.name', marketplace.plugins?.[0]?.author?.name],
    ['.claude-plugin/marketplace.json plugins[0].homepage', marketplace.plugins?.[0]?.homepage],
  ];
}

/** What a slot names once its host prefix and `.git` suffix are dropped: an account, or a slug. */
function slotIdentity(where, value) {
  assert.equal(typeof value, 'string', `${where} holds ${JSON.stringify(value)} rather than a string`);
  return value
    .trim()
    .replace(/^https:\/\/github\.com\//, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.git$/, '');
}

/**
 * The publication gate: the shipped manifests name a real account, and an unflagged run resolves it.
 *
 * Every marketplace case above is driven at a manifest the test builds — the resolved arm at
 * {@link CHOSEN_SLUG} through {@link MARKETPLACE_FLAG}, the unresolved arm at the root
 * {@link initUnresolvedSlug} writes — so the `<owner>` placeholder this package carried before its
 * repository was named could return to the shipped `cli/package.json` and every one of them would
 * still pass. This is the case that fails instead, and it is the last check before publishing: an
 * unflagged run resolves its slug from that manifest alone, so a placeholder there ships a release
 * whose every install writes no marketplace entry.
 *
 * No account is written down here. The slug is parsed off the shipped manifest with the CLI's own
 * parser, and the other two manifests are held to it: a marketplace entry naming one account and a
 * plugin manifest naming another resolves for nobody, and the three are edited by hand in three
 * files, which is exactly where a half-finished rename stops.
 */
test('the shipped manifests name a resolved owner, agree on it, and resolve an unflagged run', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const manifestUrl = readJson(join(PACKAGE_ROOT, 'package.json')).repository?.url;
  const slug = parseRepoSlug(String(manifestUrl));
  assert.ok(
    slug !== undefined,
    `cli/package.json repository.url names no <owner>/<repo>: ${JSON.stringify(manifestUrl)}`,
  );
  const [owner, repo] = slug.split('/');
  assert.match(
    owner,
    OWNER_SHAPE,
    `cli/package.json repository.url still names a placeholder account: ${JSON.stringify(owner)}`,
  );

  for (const [where, value] of shippedOwnerSlots()) {
    const identity = slotIdentity(where, value);
    assert.equal(
      identity,
      identity.includes('/') ? `${owner}/${repo}` : owner,
      `${where} names a different account than cli/package.json repository.url`,
    );
  }

  await initOk(dir);

  assertMarketplaceEntry(
    readJson(join(dir, SETTINGS_FILE))[MARKETPLACES_KEY],
    slug,
    'an unflagged run against the shipped manifest',
  );
});

/**
 * The pasteable invocation, and the three arms it may not print on.
 *
 * A line that names a command to type still leaves the adopter to open a session first, so the
 * accepted arm prints one to paste. It is withheld where it would contradict the report around it: a
 * decliner is not handed a line that runs the analysis they just declined, a run with nothing left to
 * fill has nothing to run it for, and a dry run wired nothing to run it against. The dry-run arm
 * carries the first step's reload pointer too, withheld for the same reason on the same run.
 *
 * On the unresolved-slug arm it is printed and **qualified** instead, and on that arm alone: step 1
 * has just said the session resolves the plugin only once one of its two routes is taken, so an
 * a hand-over without that precondition would contradict it — and a precondition printed on the resolved
 * arm too would contradict the step above it there.
 */
test('the pasteable invocation prints on the accepted arm, and on no other', async (t) => {
  await t.test('an accepted run prints it verbatim, on its own line', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir);

    const line = stdout.split('\n').find((candidate) => candidate.trim() === PASTEABLE_INVOCATION);
    assert.ok(line !== undefined, `the accepted run printed no pasteable invocation:\n${stdout}`);
  });

  await t.test('the sentence introducing it is qualified on the unresolved-slug arm and on no other', async (subtest) => {
    const unresolvedDir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const resolvedDir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initUnresolvedSlug(subtest, unresolvedDir);
    const resolved = await initOk(resolvedDir, [MARKETPLACE_FLAG, CHOSEN_SLUG]);

    assert.ok(
      stdout.includes(PASTEABLE_INVOCATION),
      `the unresolved-slug arm printed no pasteable invocation to qualify:\n${stdout}`,
    );
    const step = nextStepsLine(stdout);
    assert.ok(
      step.includes(PASTE_PRECONDITION),
      `the paste line is handed over without its precondition on an arm whose plugin may not resolve:\n${step}`,
    );
    // The other half of the same rule: a qualification printed on every arm would say nothing, and
    // would contradict the step above it on the arm whose clone does resolve the plugin.
    const resolvedStep = nextStepsLine(resolved.stdout);
    // The unmeasured-outcome clause is the other way round: it belongs on every arm that prints the
    // line, because whether the prefixed first message succeeds does not depend on the slug.
    for (const [arm, line] of [
      ['unresolved-slug', step],
      ['resolved-slug', resolvedStep],
    ]) {
      assert.ok(
        line.includes(PASTE_UNCONFIRMED),
        `the ${arm} arm asserts the paste line's outcome as measured:\n${line}`,
      );
    }
    assert.ok(
      !resolvedStep.includes(PASTE_PRECONDITION),
      `the paste line carries the plugin-resolution precondition on an arm whose ${MARKETPLACES_KEY} entry was written:\n${resolvedStep}`,
    );
  });

  await t.test(`${NO_ANALYZE_FLAG} does not`, async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir, [NO_ANALYZE_FLAG]);

    assert.ok(
      !stdout.includes(PASTEABLE_INVOCATION),
      `a declined run hands over a line that runs the analysis anyway:\n${stdout}`,
    );
  });

  await t.test('a re-run with nothing left to fill does not', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    await fillConventionsByHand(dir);
    deleteBannerByHand(dir);

    const { stdout } = await initOk(dir);

    assert.ok(
      !stdout.includes(PASTEABLE_INVOCATION),
      `the skip branch hands over a line to run against documents that are already written:\n${stdout}`,
    );
  });

  await t.test('--dry-run does not', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir, ['--dry-run']);

    assert.ok(
      !stdout.includes(PASTEABLE_INVOCATION),
      `a dry run hands over a line to run against a repository it wired nothing in:\n${stdout}`,
    );
    const wiring = pluginWiringLine(stdout);
    assert.ok(
      !wiring.includes(RELOAD_POINTER),
      `a dry run merged nothing and still tells an open session to reload it:\n${wiring}`,
    );
  });
});

/**
 * The unforced re-run: the project file is **kept**, so nothing is written into it and the closing
 * report says exactly that rather than claiming a banner records the answer.
 *
 * The fixture deletes the banner by hand and leaves the conventions stubs as skeletons, so the offer
 * is still resolved — this is the re-run contract, not the skip branch.
 */
test('an unforced re-run keeps the project file and reports that nothing was recorded in it', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  deleteBannerByHand(dir);
  const before = text(dir, CLAUDE_MD);

  const { stdout } = await initOk(dir);

  assert.equal(text(dir, CLAUDE_MD), before, `an unforced re-run re-inserted a banner into ${CLAUDE_MD}`);
  assert.ok(stdout.includes(UNASKED_ANALYZE_NOTE), 'a document is still a skeleton, so the offer had to be resolved');
  assert.ok(stdout.includes(KEPT_NOTHING_RECORDED), `the run does not say the file was kept:\n${stdout}`);
  assert.ok(
    !stdout.includes(RECORDED_ANSWER),
    'the run claims a banner records the answer in a file it wrote nothing into',
  );
});

/**
 * The forced re-run, which this branch neither changes nor pretends away: `--force` upgrades the
 * project file's `create-if-absent` policy to overwrite-after-backup, so the banner comes back and
 * the run reports the regeneration rather than the kept wording.
 */
test('a forced re-run regenerates the project file, so the banner comes back and the run says so', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  deleteBannerByHand(dir);

  const { stdout } = await initOk(dir, ['--force']);

  const content = text(dir, CLAUDE_MD);
  for (const marker of [SETUP_PENDING_OPEN, SETUP_PENDING_CLOSE]) {
    assert.ok(content.includes(marker), `the regenerated ${CLAUDE_MD} carries no ${marker}`);
  }
  assert.equal(await exists(dir, `${CLAUDE_MD}.bak`), true, 'the forced overwrite took no backup');
  assert.ok(stdout.includes(FORCED_REGENERATED), `the run does not report the regeneration:\n${stdout}`);
  assert.ok(!stdout.includes(KEPT_NOTHING_RECORDED), 'the run reports a file it regenerated as kept');
  assert.ok(
    !stdout.includes(CONVENTIONS_REGENERATED),
    'no conventions document was filled, so none can have been put back to a skeleton',
  );
});

/**
 * `--force` may never take the skip branch — condition (2a) — and this is why: the same command line
 * that would have found "nothing left to fill" is the one that unfills it.
 *
 * So the offer is resolved rather than skipped, and the closing report names what the run did to the
 * tree: the project file regenerated after its `.bak`, and the conventions documents put back to
 * skeletons after theirs. No run may print "already filled" in the same output as that.
 */
test('--force never takes the skip branch, and names what it put back to skeletons', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  await fillConventionsByHand(dir);
  deleteBannerByHand(dir);

  const { stdout } = await initOk(dir, ['--force']);

  assert.ok(!stdout.includes(ALREADY_FILLED_NOTE), 'a forced run reported documents as filled while regenerating them');
  assert.ok(stdout.includes(UNASKED_ANALYZE_NOTE), 'the forced run skipped the offer instead of resolving it');
  assert.ok(
    bannerBlock(text(dir, CLAUDE_MD), 'regenerated').includes(BANNER_ACCEPTED),
    `the regenerated ${CLAUDE_MD} does not carry the accepted banner`,
  );
  assert.equal(await exists(dir, `${SHARED_STUB}.bak`), true, 'the filled conventions document was replaced with no backup');

  const line = nextStepsLine(stdout);
  assert.ok(line.includes(FORCED_REGENERATED), `the closing pointer does not report the regeneration:\n${line}`);
  assert.ok(line.includes(CONVENTIONS_REGENERATED), `the closing pointer does not report the unfilled documents:\n${line}`);
  assert.ok(line.includes(SHARED_STUB), `the closing pointer names no document it put back to a skeleton:\n${line}`);
});

/**
 * The two facts are independent: what `--force` did to the conventions documents is true whether or
 * not the project file was there. The case is the plainest one there is — a first forced `init` in a
 * repository that already carries hand-written rules at the configured `layers[].conventions` paths,
 * where the run overwrites them after a `.bak` no other output ever names.
 */
test('a forced run names the documents it put back to skeletons even with no project file', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  await fillConventionsByHand(dir);
  await rm(join(dir, CLAUDE_MD));

  const { stdout } = await initOk(dir, ['--force']);

  const line = nextStepsLine(stdout);
  assert.ok(line.includes(CONVENTIONS_REGENERATED), `the run overwrote filled documents and never said so:\n${line}`);
  assert.ok(line.includes(SHARED_STUB), `the run names no document it put back to a skeleton:\n${line}`);
  assert.ok(!line.includes(FORCED_REGENERATED), `the run reports regenerating a project file that was not there:\n${line}`);
});

/**
 * The `.bak` a forced run must not spend twice — the keep, its two conjuncts, and the note that
 * names the backup as the reason.
 *
 * **The measurement is on the `.bak` bytes, not on the printed line.** What went wrong before was
 * precisely a run that printed a true-sounding sentence about a file it never read back: the
 * `back to skeletons` warning is keyed on what the run *found* filled, so it fired on the safe first
 * pass and was silent on the second one that overwrote the rescued analysis with a skeleton.
 *
 * The fragments are literals, choice 3 in the module header, and the reason-naming one is asserted
 * on the note's own line rather than on the whole output: every conventions path appears in the
 * action log whatever happened to it, so a whole-output `includes` would pass for a run that
 * replaced the document and named it in a `replaced` line.
 */
const KEPT_FOR_BACKUP = 'the filled analysis an earlier forced run rescued';
const KEPT_PAST_ONE = 'was kept as it stands';
const KEPT_PAST_SEVERAL = 'were kept as they stand';
const KEPT_CONDITIONAL = 'would be kept as';
const KEPT_RESTORE_POINTER = 'to get the analysis back';

/** The generator's kept-for-backup note, one line, located by the fragment naming its reason. */
function keptForBackupNote(stdout) {
  const line = stdout.split('\n').find((candidate) => candidate.includes(KEPT_FOR_BACKUP));
  assert.ok(line !== undefined, `the run printed no kept-for-backup note:\n${stdout}`);
  return line;
}

/** Every conventions document in the fixture, repo-relative, as the corpus on disk has them. */
async function conventionsDocuments(dir) {
  return (await readdir(join(dir, CONTEXT_DIR))).sort().map((name) => `${CONTEXT_DIR}/${name}`);
}

/**
 * The finding's own reproduction: **two consecutive `--force` passes over a filled corpus**, where
 * the first rescues the analysis into the `.bak` files and the second would have overwritten every
 * one of them with a skeleton.
 *
 * Driven over the layered preset rather than the usual node fixture because that is the multi-
 * document corpus the finding measured, and because it is the note's plural arm.
 */
test('a second --force keeps the already-skeletal documents whose .bak holds the analysis', async (t) => {
  const dir = await fixtureFor(t, everyPresetSeed());
  await initOk(dir, ['--preset', 'layered-clean-arch']);
  await fillConventionsByHand(dir);
  const documents = await conventionsDocuments(dir);
  assert.ok(documents.length > 1, 'the fixture has one conventions document, so this is not the measured corpus');
  const filled = new Map(documents.map((path) => [path, text(dir, path)]));

  // Pass 1, the safe one: each filled document goes back to a skeleton, its analysis in the .bak.
  await initOk(dir, ['--force']);
  for (const path of documents) {
    assert.ok(text(dir, path).includes(UNFILLED_MARKER), `${path} was not put back to a skeleton`);
    assert.equal(text(dir, `${path}.bak`), filled.get(path), `${path}.bak does not hold the filled document`);
  }

  // Pass 2, the destructive one: nothing is left to rescue, so nothing may be spent.
  const { stdout } = await initOk(dir, ['--force']);

  for (const path of documents) {
    assert.equal(text(dir, `${path}.bak`), filled.get(path), `the second --force overwrote ${path}.bak with a skeleton`);
    assert.ok(text(dir, path).includes(UNFILLED_MARKER), `${path} is no longer the skeleton the first pass left`);
  }
  const note = keptForBackupNote(stdout);
  for (const path of documents) {
    assert.ok(note.includes(path), `the run kept ${path} and the note does not name it:\n${note}`);
  }
  assert.ok(note.includes(KEPT_PAST_SEVERAL), `the note does not say the documents were kept:\n${note}`);
  assert.ok(note.includes(KEPT_RESTORE_POINTER), `the note names no way back to the analysis:\n${note}`);
  assert.ok(note.includes(ANALYZE_COMMAND), `the note names no way to rebuild the analysis:\n${note}`);
  // The two lines are complementary and never contradictory: a kept document was already a skeleton,
  // so it is not in `filledConventions` and no sentence claims this run put it back to one.
  assert.ok(
    !stdout.includes(CONVENTIONS_REGENERATED),
    `the run kept every document and still reports putting some back to skeletons:\n${stdout}`,
  );
});

/**
 * The second conjunct, which is what keeps the keep from swallowing a legitimate want: a `--force`
 * over a **filled** document still puts it back to a skeleton, whatever its `.bak` holds.
 *
 * Two legs, because only the second one discriminates. Leg 1 is a document with no `.bak` at all —
 * the ordinary first rescue. Leg 2 re-fills the same document, so the run meets a filled document
 * *and* a filled `.bak`: a keep keyed on the backup alone would fire here and make regenerating
 * skeletons impossible for any repository that had been forced once.
 */
test('--force still puts a filled conventions document back to a skeleton, filled .bak or not', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  for (const leg of ['no .bak yet', 'a .bak already holding a filled document']) {
    await fillConventionsByHand(dir);
    const filled = text(dir, SHARED_STUB);

    const { stdout } = await initOk(dir, ['--force']);

    assert.ok(text(dir, SHARED_STUB).includes(UNFILLED_MARKER), `${leg}: ${SHARED_STUB} was kept rather than replaced`);
    assert.equal(text(dir, `${SHARED_STUB}.bak`), filled, `${leg}: ${SHARED_STUB}.bak does not hold what was replaced`);
    assert.ok(
      nextStepsLine(stdout).includes(CONVENTIONS_REGENERATED),
      `${leg}: the run put a filled document back to a skeleton and never said so:\n${stdout}`,
    );
    assert.ok(!stdout.includes(KEPT_FOR_BACKUP), `${leg}: the run reports keeping a document it replaced:\n${stdout}`);
  }
});

/**
 * The first conjunct: a skeleton with **no `.bak`** is replaced exactly as it always was, because
 * there is no rescued analysis to protect and the backup this run writes loses nothing.
 *
 * The document is edited in a way that leaves both halves of the untouched-skeleton test in place,
 * so it is still a skeleton by the shared predicate — which is what makes the replacement visible
 * rather than a byte-identical rewrite nothing could tell from a keep.
 */
test('--force replaces a skeleton with no .bak behind it, as it always has', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  const addition = '\nA line added without touching either half of the skeleton test.\n';
  appendFileSync(join(dir, SHARED_STUB), addition, 'utf8');
  const edited = text(dir, SHARED_STUB);
  assert.ok(edited.includes(UNFILLED_MARKER) && edited.includes(GUIDANCE_MARKER), 'the fixture is no longer a skeleton');
  assert.equal(await exists(dir, `${SHARED_STUB}.bak`), false, 'the fixture already has the .bak this case is without');

  const { stdout } = await initOk(dir, ['--force']);

  assert.ok(!text(dir, SHARED_STUB).includes(addition.trim()), `${SHARED_STUB} was kept rather than regenerated`);
  assert.equal(text(dir, `${SHARED_STUB}.bak`), edited, `${SHARED_STUB}.bak does not hold what was replaced`);
  assert.ok(!stdout.includes(KEPT_FOR_BACKUP), `the run reports keeping a document with no .bak to protect:\n${stdout}`);
});

/**
 * The dry run over the state the keep exists for: it writes nothing, and it reports the keep in the
 * conditional — a dry run may no more claim it kept a file than a real run may omit saying so.
 */
test('--force --dry-run over a rescued corpus writes nothing and reports the keep as conditional', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  await fillConventionsByHand(dir);
  await initOk(dir, ['--force']);
  const before = await snapshotTree(dir);

  const { stdout } = await initOk(dir, ['--force', '--dry-run']);

  assert.deepEqual(await snapshotTree(dir), before, 'a dry run changed the tree it was previewing');
  const note = keptForBackupNote(stdout);
  assert.ok(note.includes(SHARED_STUB), `the previewed keep names no document:\n${note}`);
  assert.ok(note.includes(KEPT_CONDITIONAL), `the dry run does not report the keep in the conditional:\n${note}`);
  assert.ok(!note.includes(KEPT_PAST_ONE), `the dry run claims it kept a file:\n${note}`);
});

/**
 * The same single-generation `.bak`, at the other always-loaded asset — and the sentence that
 * promised what it could not deliver: *"anything a previous pass had filled into it is in that `.bak`
 * alone"*, printed by a run whose `.bak` had just been filled with the template.
 *
 * This file carries neither half of the untouched-skeleton test, so the discriminator is
 * **byte-identity with the text the run would write**: identical means the regeneration would put
 * nothing new in the `.bak` and destroy whatever is in the one already there, so the run keeps the
 * file and says that instead.
 *
 * **The measurement is on the `.bak` bytes and on the action log, not on the printed line alone** —
 * the defect was precisely a true-sounding sentence about a file the run never read back.
 */
const PROJECT_FILE_IDENTICAL = 'already byte-identical to the file this run generates';
const PROJECT_FILE_KEPT = `so --force kept it and left ${CLAUDE_MD}.bak alone`;
const PROJECT_FILE_KEPT_DRY = `so --force would keep it and would leave ${CLAUDE_MD}.bak alone`;
const PROJECT_FILE_BACKUP_SURVIVES = 'is still in that .bak';
const PROJECT_FILE_NO_BACKUP = `wrote no ${CLAUDE_MD}.bak, because there was nothing to back up`;

/** Every action-log label, so a line's label is read rather than guessed at from a marker. */
const ACTION_LOG_LINE =
  /^[+~=] (created|merged|kept|ensured|replaced|would create|would merge|would keep|would ensure|would replace) +(\S+)/;

/** What the run's action log says it did to one repo-relative path, or `undefined` if it names none. */
function actionFor(stdout, relativePath) {
  for (const candidate of stdout.split('\n')) {
    const match = ACTION_LOG_LINE.exec(candidate);
    if (match !== null && match[2] === relativePath) return match[1];
  }
  return undefined;
}

/** Fill the project file as a pass would: the generated file plus a section that was written into it. */
function fillProjectFileByHand(dir) {
  const filled = `${text(dir, CLAUDE_MD)}\n## What this project is\n\nThe paragraph a previous pass filled in.\n`;
  writeFileSync(join(dir, CLAUDE_MD), filled, 'utf8');
  return filled;
}

/**
 * The finding's own reproduction, at this file: **two consecutive `--force` passes**, where the first
 * rescues the filled project file into the `.bak` and the second would have overwritten it with the
 * template it is already holding.
 */
test('a second --force keeps a project file identical to the one it would write, and leaves its .bak alone', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  const filled = fillProjectFileByHand(dir);

  // Pass 1, the safe one: the filled file goes back to the template, its content into the .bak.
  const first = await initOk(dir, ['--force']);
  const regenerated = text(dir, CLAUDE_MD);
  assert.notEqual(regenerated, filled, `${CLAUDE_MD} was kept rather than regenerated`);
  assert.equal(text(dir, `${CLAUDE_MD}.bak`), filled, `${CLAUDE_MD}.bak does not hold the filled file`);
  assert.equal(actionFor(first.stdout, CLAUDE_MD), 'replaced', `${CLAUDE_MD} was not replaced on the first --force`);
  assert.ok(
    nextStepsLine(first.stdout).includes(FORCED_REGENERATED),
    `the run regenerated ${CLAUDE_MD} and never said so:\n${first.stdout}`,
  );

  // Pass 2, the destructive one: the bytes on disk already are the ones this run renders.
  const { stdout } = await initOk(dir, ['--force']);

  assert.equal(text(dir, `${CLAUDE_MD}.bak`), filled, `the second --force overwrote ${CLAUDE_MD}.bak with the template`);
  assert.equal(text(dir, CLAUDE_MD), regenerated, `${CLAUDE_MD} is no longer the file the first pass wrote`);
  assert.equal(actionFor(stdout, CLAUDE_MD), 'kept', `the second --force reports a write it had no reason to make`);
  const line = nextStepsLine(stdout);
  assert.ok(line.includes(PROJECT_FILE_IDENTICAL), `the run does not say why it kept the file:\n${line}`);
  assert.ok(line.includes(PROJECT_FILE_KEPT), `the run does not say the .bak was left alone:\n${line}`);
  assert.ok(line.includes(PROJECT_FILE_BACKUP_SURVIVES), `the run names no surviving copy of the analysis:\n${line}`);
  assert.ok(
    !line.includes(FORCED_REGENERATED),
    `the run promises the previous content is in a .bak it neither wrote nor read:\n${line}`,
  );
});

/**
 * The keep's other sub-case, and the common one: a plain `init` then `init --force`, with no pass in
 * between. Both runs render the same bytes, so the keep fires — but nothing was ever displaced, so
 * **no `.bak` exists**, and a keep that promised a surviving copy would send the adopter after a file
 * that is not on disk.
 *
 * Measured on the tree as well as the line: the absence of the `.bak` is what makes the wording true.
 */
test('a --force over an untouched project file keeps it, and promises no .bak it never wrote', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  assert.equal(await exists(dir, `${CLAUDE_MD}.bak`), false, 'the fixture already has the .bak this case is without');

  const { stdout } = await initOk(dir, ['--force']);

  assert.equal(actionFor(stdout, CLAUDE_MD), 'kept', `the forced run reports a write it had no reason to make`);
  assert.equal(await exists(dir, `${CLAUDE_MD}.bak`), false, 'a file that was kept was backed up anyway');
  const line = nextStepsLine(stdout);
  assert.ok(line.includes(PROJECT_FILE_IDENTICAL), `the run does not say why it kept the file:\n${line}`);
  assert.ok(line.includes(PROJECT_FILE_NO_BACKUP), `the run does not say no .bak was written:\n${line}`);
  assert.ok(
    !line.includes(PROJECT_FILE_BACKUP_SURVIVES),
    `the run names a surviving copy in a .bak that is not on disk:\n${line}`,
  );
});

/**
 * The creation, which neither sentence may reach: a first `--force` in a repository that has no
 * project file backs nothing up, so there is no `.bak` to promise anything about and nothing was
 * kept either.
 */
test('a first --force with no project file creates it, and claims nothing about a .bak', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  const { stdout } = await initOk(dir, ['--force']);

  assert.equal(actionFor(stdout, CLAUDE_MD), 'created', `${CLAUDE_MD} was not created by the first forced run`);
  assert.equal(await exists(dir, `${CLAUDE_MD}.bak`), false, 'a file that was created was backed up first');
  const line = nextStepsLine(stdout);
  assert.ok(!line.includes(FORCED_REGENERATED), `the run reports regenerating a file that was not there:\n${line}`);
  assert.ok(!line.includes(PROJECT_FILE_IDENTICAL), `the run reports keeping a file it created:\n${line}`);
});

/**
 * The dry run over the state the keep exists for: it writes nothing, and it reports the keep in the
 * conditional — the same tense discipline the closing pointer keeps everywhere else.
 */
test('--force --dry-run over an identical project file writes nothing and reports the keep as conditional', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  fillProjectFileByHand(dir);
  await initOk(dir, ['--force']);
  const before = await snapshotTree(dir);

  const { stdout } = await initOk(dir, ['--force', '--dry-run']);

  assert.deepEqual(await snapshotTree(dir), before, 'a dry run changed the tree it was previewing');
  assert.equal(actionFor(stdout, CLAUDE_MD), 'would keep', `the dry run previews a write it would not make`);
  const line = nextStepsLine(stdout);
  assert.ok(line.includes(PROJECT_FILE_KEPT_DRY), `the dry run does not report the keep in the conditional:\n${line}`);
  assert.ok(!line.includes(PROJECT_FILE_KEPT), `the dry run claims it kept a file:\n${line}`);
});

test('init refuses a run it cannot safely aim, and says which one it refused', async (t) => {
  await t.test('a directory that is not a git repository', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

    const result = await runCli(dir, ['init']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /not inside a git repository/);
    assert.equal(await exists(dir, CONFIG_FILE), false);
  });

  await t.test("the harness's own repository", async (subtest) => {
    const ownName = readJson(join(PACKAGE_ROOT, 'package.json')).name;
    const dir = await fixtureFor(subtest, {
      files: {
        '.claude-plugin/marketplace.json': { name: 'fixture-marketplace', plugins: [] },
        'cli/package.json': { name: ownName, version: '0.0.0' },
      },
    });

    const result = await runCli(dir, ['init']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /refusing to wire the harness's own repository/);
    assert.equal(await exists(dir, CONFIG_FILE), false);
  });

  await t.test('a dot-named --state-dir', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const result = await runCli(dir, ['init', '--state-dir', '.harness']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /--state-dir/);
    assert.match(result.stderr, /path segment starting with '\.'/);
    assert.equal(await exists(dir, CONFIG_FILE), false);
  });
});

/**
 * The escape the refusal above now names, and the whole of its contract: the one value that opens
 * that refusal, and the near miss that must not. It is an environment variable rather than a flag
 * because self-adoption is a contributor workflow and a flag would owe a row in `--help`, where the
 * only reader it reaches is an adopter it can only mislead (`commands/init.ts`, `SELF_ADOPT_ENV`).
 *
 * The fixture is the refusal subtest's, unchanged, because the subject is only which of the two
 * outcomes that one repository shape reaches. `--dry-run` keeps it that way, and costs the passing
 * arm its most obvious assertion: a run that got past the gate writes nothing here either, so the
 * absence of the refusal has to be paired with a line only the far side of the gate prints.
 */
test('the self-adoption escape opens the harness-own-repository refusal, and only on its exact value', async (t) => {
  // Spelled here rather than imported, as every other string this suite asserts against the compiled
  // CLI is. The second arm ties the two spellings together: it asserts the refusal itself names the
  // same variable, so a rename that misses this file fails there rather than passing quietly.
  const SELF_ADOPT_ENV = 'HARNESS_SELF_ADOPT';
  const harnessOwnRepository = () => ({
    '.claude-plugin/marketplace.json': { name: 'fixture-marketplace', plugins: [] },
    'cli/package.json': { name: readJson(join(PACKAGE_ROOT, 'package.json')).name, version: '0.0.0' },
  });

  await t.test('the exact value wires the repository the bare run refuses', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: harnessOwnRepository() });

    const result = await runCli(dir, ['init', '--dry-run', '--non-interactive'], { [SELF_ADOPT_ENV]: '1' });

    assert.equal(result.status, 0);
    assert.doesNotMatch(result.stderr, /refusing to wire the harness's own repository/);
    // The absence above would also hold if `init` had failed before ever reaching the gate, so the
    // arm asks for a line the run can only have printed from the other side of it.
    assert.match(result.stdout, /would create\s+harness\.config\.json/);
    assert.equal(await exists(dir, CONFIG_FILE), false);
  });

  await t.test('a value that is not exactly it leaves the refusal standing', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: harnessOwnRepository() });

    const result = await runCli(dir, ['init', '--dry-run', '--non-interactive'], { [SELF_ADOPT_ENV]: 'yes' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /refusing to wire the harness's own repository/);
    // Merely being set is not enough, and the refusal says what would be: a contributor who reaches
    // it learns the way through from the message rather than from the source.
    assert.match(result.stderr, new RegExp(`${SELF_ADOPT_ENV}=1`));
    assert.equal(await exists(dir, CONFIG_FILE), false);
  });
});

/**
 * The ordering half of those refusals, and the only half a fixture can catch: a refusal answerable
 * from the parsed flags alone must be raised **before** the git gate, whose accept path creates a
 * repository.
 *
 * Both cases run under `--git-init` against a `{ git: false }` fixture, so the flag the run refuses
 * and the mutation it must not have made are the same command line. The harm is not only the stray
 * `.git`: a corrected re-run in that directory finds a repository it did not create, declines to
 * commit into someone else's tree, and wires everything while making no first commit at all — the
 * unborn HEAD `git worktree add` cannot prepare a checkout from, reached with an exit 0 and nothing
 * said. The assertion is asked of the filesystem rather than of git, because the question is whether
 * a refused run left anything behind.
 */
test('a refusal the flags alone answer is raised before --git-init creates anything', async (t) => {
  for (const testCase of [
    { name: 'a dot-named --state-dir', argv: ['--state-dir', '.artifacts'], stderr: /path segment starting with '\.'/ },
    { name: 'an unknown --preset', argv: ['--preset', 'no-such-preset'], stderr: /unknown preset/ },
  ]) {
    await t.test(testCase.name, async (subtest) => {
      const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

      const result = await runCli(dir, ['init', '--git-init', ...testCase.argv]);

      assert.equal(result.status, 1);
      assert.match(result.stderr, testCase.stderr);
      assert.equal(
        await exists(dir, '.git'),
        false,
        'a refused run created a repository, leaving a directory it declined to wire with one',
      );
      assert.equal(await exists(dir, CONFIG_FILE), false);
    });
  }
});

/**
 * The other side of the first refusal above: git is a hard gate with an **offer**, and the offer's
 * two ends are what these assert. The refusal subtest is the third end and stays where it is — a
 * subprocess's stdin is a pipe, so every run here is non-interactive and the documented default is
 * to refuse, which is what makes that unchanged subtest also the proof that the prompt never blocks
 * a run that cannot answer it.
 */
test('init offers to create the repository it needs, and creates one only when told to', async (t) => {
  await t.test('--git-init wires a directory git had never heard of', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

    await initOk(dir, ['--git-init']);

    assert.equal(await exists(dir, '.git'), true);
    assert.equal(await exists(dir, CONFIG_FILE), true);

    // Asked of git rather than of the filesystem: a `.git` directory beside a config proves a
    // repository was created, not that this is the root the CLI resolved and wrote against.
    const { stdout } = await runGit(dir, ['rev-parse', '--show-toplevel']);
    assert.equal(stdout.trim(), dir);
  });

  await t.test('--git-init --dry-run creates no repository and previews the plan anyway', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

    const result = await initOk(dir, ['--git-init', '--dry-run']);

    assert.equal(await exists(dir, '.git'), false);
    assert.equal(await exists(dir, CONFIG_FILE), false);
    assert.ok(
      result.stdout.includes(`would create a git repository at ${dir}`),
      `the preview named a root other than the fixture:\n${result.stdout}`,
    );
    // The preview is still a preview of the whole run: a dry run that created nothing but also
    // planned nothing would pass the two assertions above while telling the adopter nothing.
    assert.match(result.stdout, /would create\s+harness\.config\.json/);
  });

  await t.test('--git-init --dry-run previews the root git would report, not the one it was reached by', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });
    // A symlink to the fixture itself, because that is the only way the two spellings differ here:
    // `--cwd` is made absolute but not resolved, while the real path answers with the physical root
    // `rev-parse --show-toplevel` reports. The link lives inside the fixture, so its teardown covers
    // it. Without this case the assertion above passes either way — the fixture is already
    // `realpath`-resolved, so the unresolved `cwd` and the physical root are the same string.
    const reachedBy = join(dir, 'link-to-self');
    await symlink(dir, reachedBy);

    const result = await initOk(dir, ['--git-init', '--dry-run', '--cwd', reachedBy]);

    assert.ok(
      result.stdout.includes(`would create a git repository at ${dir}`),
      `the preview named a root other than the physical one:\n${result.stdout}`,
    );
    // Every absolute path in the preview, not just the root line: a preview spelled through the
    // symlink is the one a real run would not have written.
    assert.ok(
      !result.stdout.includes(reachedBy),
      `the preview spelled a path through the symlink it was reached by:\n${result.stdout}`,
    );
  });

  await t.test('the refusal names the flag that would have accepted', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

    const result = await runCli(dir, ['init']);

    assert.equal(result.status, 1);
    // The whole point of naming it in the refusal: the offer is discoverable from the run that was
    // refused, without reading the help or the docs.
    assert.match(result.stderr, /--git-init/);
  });
});

/**
 * The other half of that gate: a repository with **no commit** is committed into, once — and one
 * that has commits never is.
 *
 * `git worktree add` fails against an unborn HEAD, so a run that stopped at the wiring would leave a
 * correctly configured repository the flow it wires cannot prepare a checkout from — and `doctor`,
 * which would say so, cannot be relied on to have been run. The condition is the repository's
 * **state** rather than which run created it: an adopter's own `git init` leaves exactly the state
 * the accepted offer does, so the two are wired the same way.
 *
 * The last two cases carry the weight, because they are the pair the contract turns on: a
 * commit-less repository this run did not create **is** committed into, once, and a repository that
 * already has a commit is left to its owner. The first of those is what the rest of the suite now
 * rests on — `wiredFixture` in `doctor.test.mjs`, `config-command.test.mjs` and `daemon.test.mjs`
 * runs `init` on a commit-less git fixture, which therefore comes back with a commit in it — and the
 * second is what keeps that widening from ever reaching an established history. `snapshotTree`
 * excludes `.git`, so the commit itself moves no snapshot comparison in any of those files.
 *
 * Between them those two are also the **automated twin of the hand-run demonstration** this
 * behaviour is accepted by: one adopts a commit-less repository, commits once and prepares a real
 * second checkout from it, and the other shows a repository with commits left untouched. The
 * hand-run leg is worth keeping, because it is the only one aimed at a directory no fixture here
 * built; this pair is what catches a regression in between two of them.
 */
test('init commits into a repository with no commit, and never into one with commits', async (t) => {
  await t.test('--git-init commits the wiring and nothing the managed ignore block covers', async (subtest) => {
    const dir = await fixtureFor(subtest, {
      git: false,
      files: {
        ...nodeProjectFiles(),
        // Seeded before the run, so the assertion below is about a run-control file that was really
        // on disk when `git add -A` ran rather than about a name no file ever carried.
        [`${STATE_DIR}/STOP`]: 'halt\n',
      },
    });

    const { stdout } = await initOk(dir, ['--git-init'], COMMIT_IDENTITY);

    assert.equal(await commitCount(dir), 1, 'the run that created the repository left it without exactly one commit');
    assert.match(stdout, /committed this directory as the repository's first commit/);

    const tracked = (await runGit(dir, ['ls-files'])).stdout.split('\n').filter((line) => line !== '');
    assert.ok(tracked.includes(CONFIG_FILE), `${CONFIG_FILE} was generated and not committed:\n${tracked.join('\n')}`);
    assert.ok(tracked.includes(GITIGNORE_FILE), `${GITIGNORE_FILE} was generated and not committed`);
    // The staging is `git add -A` in this arm too: a repository this run created still holds the
    // adopter's own files, because detection read them before the plan was built. Asserted directly
    // rather than only through the empty `status --porcelain` below, so a narrowing of the staging to
    // what init generated fails here by name.
    assert.ok(
      tracked.includes('package.json'),
      `the first commit staged only generated files — the adopter's own tree was left out:\n${tracked.join('\n')}`,
    );
    assert.ok(
      !tracked.includes(`${STATE_DIR}/STOP`),
      'the first commit staged a run-control artifact, which halts every run for everyone who clones',
    );

    // Nothing generated was left out of the commit either. Ignored paths do not appear here, which
    // is what makes this the other direction of the same question.
    const status = (await runGit(dir, ['status', '--porcelain'])).stdout.trim();
    assert.equal(status, '', `the run generated files its own commit did not stage:\n${status}`);
  });

  await t.test('--git-init --dry-run creates no repository and therefore no commit', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

    // The identity is supplied, so a dry run that committed would succeed at it — the absence below
    // is the guard doing its work rather than git declining.
    await initOk(dir, ['--git-init', '--dry-run'], COMMIT_IDENTITY);

    assert.equal(await exists(dir, '.git'), false);
    assert.equal(await exists(dir, CONFIG_FILE), false);
  });

  await t.test('no commit identity leaves the wiring, warns, and still exits 0', { skip: GIT_TOO_OLD }, async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

    // `initOk` is the exit-0 assertion: a failed commit must not turn a completed adoption into a
    // failed command, because everything the run was asked to write is on disk and correct.
    const { stdout, stderr } = await initOk(dir, ['--git-init'], NO_COMMIT_IDENTITY);

    assert.equal(await exists(dir, CONFIG_FILE), true);
    assert.match(stdout, /created\s+harness\.config\.json/);
    assert.equal(await commitCount(dir), UNBORN);

    // Asserted against the CLI's own sentence, never git's: git's wording for a missing identity
    // varies by version, and the remedy the adopter needs is the CLI's to state.
    assert.match(stderr, /git config user\.email/);
    assert.match(stderr, /git config user\.name/);
    assert.match(stderr, /git add -A && git commit/);
  });

  await t.test('a commit-less repository init did not create is committed into, once', async (subtest) => {
    // An ordinary git fixture is a repository with no commit that this run did not create — the
    // exact state `--git-init` leaves behind, reached the other way. The identity is supplied so
    // that a missing commit could only be the guard declining rather than git refusing.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir, [], COMMIT_IDENTITY);

    assert.equal(await commitCount(dir), 1, 'init left a repository with no commit still uncommitted');

    // The run says which of the two states it found. It matters here rather than being cosmetic:
    // `git add -A` staged this directory's whole working tree — what init generated and whatever was
    // already here — and that holds in either arm, whether this run created the repository or found
    // it; a run that stages a whole working tree silently is the thing the reporting exists to
    // prevent. What the two arms differ over is who left the repository without a commit.
    assert.match(stdout, /had no commit yet/);
    assert.match(stdout, /what init generated and whatever was already here/);

    // The other half of the note decision the flag-gated cases below assert: this run passed no
    // `--git-init`, so it gets none of that note's variants. Silence for a flag that was never given
    // — which is a claim about the *creation* note only, since the last case below shows the
    // first-commit preview reaching a no-flag run.
    assert.ok(!stdout.includes(NOTHING_CREATED_NOTE), `a run that passed no --git-init got its note:\n${stdout}`);

    // The consequence the whole guard exists for, exercised rather than argued: the worktree-based
    // flow this command wires can now prepare a checkout here. Asserted as **the worktree's `HEAD`
    // resolving to the same commit as the main checkout's** rather than by matching git's
    // `inferring '--orphan'` sentence — that wording is the host's git to choose, while an orphan
    // checkout is exactly one that resolves no commit at all.
    const worktree = `${dir}-feature_x`;
    subtest.after(() => rm(worktree, { recursive: true, force: true }));
    await runGit(dir, ['worktree', 'add', '-b', 'feature_x', worktree]);

    const head = (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim();
    const worktreeHead = (await runGit(worktree, ['rev-parse', 'HEAD'])).stdout.trim();
    assert.equal(worktreeHead, head, 'the worktree was prepared without the commit under it — an orphan checkout');
  });

  await t.test('a repository that already has a commit is left to its owner', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    // Seeded through git rather than asserted about a fixture flag: the subject is what `hasCommits`
    // answers, so the repository has to really have one.
    await runGit(dir, ['add', '-A']);
    await runGit(dir, ['commit', '-m', 'the owner history init must not write into']);

    await initOk(dir, [], COMMIT_IDENTITY);

    assert.equal(await commitCount(dir), 1, 'init committed on top of an established history');

    // The other direction of the same question: not merely "no new commit", but the generated files
    // still sitting in the working tree unstaged, which is what leaves them the owner's to describe.
    const status = (await runGit(dir, ['status', '--porcelain'])).stdout;
    assert.ok(status.includes(CONFIG_FILE), `the generated ${CONFIG_FILE} is not left unstaged:\n${status}`);
  });

  /*
   * The four below are the *reporting* half of the same pair: a directory that is already a
   * repository creates nothing — correct, and until now silent, which is what let the commit-less
   * case be wired and left uncommitted with nothing said. Each asserts the note on **stdout** rather
   * than stderr, which is the note-vs-warning decision made observable: a provisioning script that
   * passes the flag whether or not the directory is fresh is a correct run and must not be warned at.
   *
   * The first three are about the flag and are gated on it. The last is about the repository's
   * **state** and is not: what a real run would commit there is previewed with no flag given at all,
   * because the commit is gated on the state too.
   */
  await t.test('--git-init against a repository with commits says nothing was created', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await runGit(dir, ['add', '-A']);
    await runGit(dir, ['commit', '-m', 'the owner history init must not write into']);
    const before = (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim();

    const { stdout, stderr } = await initOk(dir, ['--git-init'], COMMIT_IDENTITY);

    assert.match(stdout, /--git-init was given and nothing was created/);
    assert.match(stdout, /that repository has history/);
    assert.equal(await commitCount(dir), 1, 'init committed on top of an established history');

    // The flag took no create path: the `ok` line that reports one is absent, and the repository is
    // the same one it was — a run that re-initialised here would be reporting the other outcome.
    assert.ok(!stdout.includes('created a git repository at'), `the run created a repository anyway:\n${stdout}`);
    assert.equal((await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim(), before);

    assert.ok(!stderr.includes(NOTHING_CREATED_NOTE), `the note was raised as a warning:\n${stderr}`);
  });

  await t.test('--git-init --dry-run against a repository with commits phrases the wiring in the conditional', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await runGit(dir, ['add', '-A']);
    await runGit(dir, ['commit', '-m', 'the owner history init must not write into']);

    const { stdout } = await initOk(dir, ['--git-init', '--dry-run'], COMMIT_IDENTITY);

    assert.match(stdout, /--git-init was given and nothing was created/);
    assert.match(stdout, /a real run would only wire it/);

    // The same guard the commit-less dry run carries, on the half of the sentence that is about work
    // rather than about the repository's state: a dry run wires nothing, so the present-tense form
    // must be absent — which is what a later re-unification of the two texts fails on.
    assert.ok(!stdout.includes('this run only wires it'), `the dry run claimed wiring it never did:\n${stdout}`);
  });

  await t.test('--git-init against an existing commit-less repository promises the first commit and makes it', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout, stderr } = await initOk(dir, ['--git-init'], COMMIT_IDENTITY);

    assert.match(stdout, /--git-init was given and nothing was created/);
    assert.match(stdout, MAKES_FIRST_COMMIT);

    // The note's promise and the guard's behaviour asserted together, which is what stops the note
    // becoming a claim nothing backs.
    assert.equal(await commitCount(dir), 1, 'the note promised a first commit this run did not make');

    assert.ok(!stderr.includes(NOTHING_CREATED_NOTE), `the note was raised as a warning:\n${stderr}`);
  });

  await t.test('--git-init --dry-run against an existing commit-less repository promises no commit', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    // The identity is supplied, so a dry run that committed would succeed at it — the unborn HEAD
    // below is the guard declining rather than git.
    const { stdout } = await initOk(dir, ['--git-init', '--dry-run'], COMMIT_IDENTITY);

    assert.match(stdout, /--git-init was given and nothing was created/);
    assert.match(stdout, /a real run would make the first commit here/);
    assert.equal(await commitCount(dir), UNBORN, 'a dry run committed');

    // The direct guard on `docs/cli.md` §1's "a dry run cannot report a success a real run would not
    // have": the real-run wording must be absent here, so re-unifying the two messages fails this.
    assert.ok(!MAKES_FIRST_COMMIT.test(stdout), `the dry run promised a commit it never makes:\n${stdout}`);
  });

  await t.test('--dry-run without --git-init still previews the first commit', async (subtest) => {
    // The ordinary adoption this branch exists for, previewed: an adopter's own `git init`, never
    // committed into, looked at before letting init loose on it. The flag is the wrong discriminator
    // here — it did nothing in this arm, while the commit happens without it — so a note family gated
    // on the flag alone left this run silent about `git add -A` over the adopter's whole tree.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir, ['--dry-run'], COMMIT_IDENTITY);

    // No flag was given, so the creation note must stay absent …
    assert.ok(!stdout.includes(NOTHING_CREATED_NOTE), `a run that passed no --git-init got its note:\n${stdout}`);
    // … while the mutation outside the plan is still previewed, which is what --dry-run is for.
    assert.match(stdout, /a real run would make the first commit here/);
    assert.equal(await commitCount(dir), UNBORN, 'a dry run committed');
  });
});

/** The guessed-branch warning's second arm, matched on the phrase the guessing rungs share. */
const UNCONVENTIONAL_BRANCH_WARNING = /not one of the names an integration line conventionally has/;

/**
 * The first arm: the guessed name resolves to no branch here, whatever it is called.
 *
 * Matched on the clause `doctor`'s `default-branch` failure states the same fact in, which is what
 * makes a drift between the two spellings fail a case rather than pass silently.
 */
const UNRESOLVABLE_BRANCH_WARNING = /neither a local branch nor an origin\/ remote-tracking ref by that name/;

/**
 * The two remedies both arms close with, asserted apart.
 *
 * A bare `--default-branch` is what these replace: a deferred warning is published only on the run
 * that *wrote* the config, so the adopter reading one is holding a repository whose next `init`
 * keeps that file and discards the flag.
 */
const CONFIG_SET_REMEDY = /config set defaultBranch <branch>/;
const RESET_CONFIG_REMEDY = /init --reset-config --default-branch <branch>/;

/**
 * Rung 2's note for a repository between `git init` and its first commit, in full.
 *
 * Spelled out rather than matched on a fragment because the case that reads it asserts the sentence
 * did **not** change: a repository with no commit is answered by the second git invocation, so it is
 * the state a rewrite of the probe most plausibly moves onto a different rung without failing
 * anything that only checks the value.
 */
const UNBORN_HEAD_RUNG_2_NOTE =
  'no origin/HEAD is known here, so defaultBranch and protectedBranches were taken from the checked-out branch "trunk"; --default-branch overrides it';

/** The clause rungs 3 and 4 carry when `HEAD` is detached rather than when there is no branch. */
const DETACHED_HEAD_NOTE = /HEAD is detached, so the checked-out branch could not answer/;

/** The `PASS` line for one check, as `doctor`'s reporter emits it on stdout. */
function doctorPass(id) {
  return new RegExp(`^PASS\\s+${id}\\s`, 'm');
}

/**
 * The ids of every check that failed, read off the `!! FAIL <id>` lines `doctor` writes to stderr.
 *
 * A set rather than an exit status, because the exit status cannot say *which* check moved it: a
 * case that expects one known failure has to fail when a second one appears beside it.
 */
function failedCheckIds(stderr) {
  return [...stderr.matchAll(/^!! FAIL\s+(\S+)\s/gm)].map((match) => match[1]);
}

/**
 * Put the fixture on `branch` with one commit on it.
 *
 * The rename comes **before** the commit, and is `branch -m` rather than `checkout -b`, so the case
 * does not depend on what this host's git names a first branch: an unborn HEAD is renamed whatever
 * it was called, while `checkout -b` would collide on a host whose compiled default already matches.
 * The commit is what makes the branch **resolve** — which is what the `origin/HEAD` and
 * `--default-branch` cases below need, since each asserts about a rung reached over a repository in
 * an ordinary state rather than over one still between `git init` and its first commit.
 */
async function seedBranch(dir, branch) {
  await runGit(dir, ['branch', '-m', branch]);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '-m', 'seed']);
}

/**
 * Point `origin/HEAD` at `origin/<branch>`, with no fetch and no network.
 *
 * `git symbolic-ref` writes the symref without resolving its target, which is the whole reason this
 * is one line: the first rung of the ladder reads exactly this ref, so a fetched clone and a fixture
 * that seeded it by hand are indistinguishable to the code under test.
 */
async function seedRemoteHead(dir, branch) {
  await runGit(dir, ['symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${branch}`]);
}

/**
 * `defaultBranch` — and with it the single-entry `protectedBranches` — is **detected**, in one
 * settled order: `origin/HEAD`, the checked-out branch, git's `init.defaultBranch`, the schema
 * default. The failure that order exists to prevent is silent in every direction: a wrong branch
 * name is a valid config, so nothing refuses it, while every branch diff, every review's diff base
 * and the pre-push guard are all taken from it.
 *
 * Two of the cases are about a rung *not* being reached — one puts a feature branch under an
 * `origin/HEAD` that disagrees with it, the last puts the flag over a repository that has its own
 * answer — so an implementation that consulted the rungs in another order fails here rather than
 * passing on the cases where the rungs happen to agree.
 *
 * Two more are about the rung that reads this checkout answering for a repository **between
 * `git init` and its first commit**, which is the state `--git-init` hands detection and the one an
 * `init.defaultBranch` of `main` makes indistinguishable from the schema default. Both are sound
 * because the fixture leaves git with no `init.defaultBranch` from any source at all — including the
 * bundled system configuration `GIT_CONFIG_SYSTEM` does not redirect (choice 3 in
 * `helpers/fixture.mjs`) — so the name each asserts can only have come from the repository. The
 * second of them checks the created repository's own branch against the config and then asks
 * `doctor` — because a `defaultBranch` naming a branch that does not exist is a valid config, so
 * nothing but that check ever goes red over it.
 *
 * One case is about the **wording** a lower rung reaches rather than the value it lands on: a
 * detached `HEAD` demotes the detection exactly as an absent branch does, but it is a repository
 * that *has* branches, and it is the steady state of a colocated `jj` repository — so the note that
 * says no checked-out branch answered would be what every such adoption run reads.
 *
 * The warning is asserted in both directions for the same reason it exists: it fires on the rungs
 * that are a guess about this checkout, and firing on `origin/HEAD` — the repository's own
 * statement of its integration line — would be a warning raised by a correct run.
 *
 * The last four cases are its **resolution** arm, which tests whether the guessed name names a
 * branch this repository has rather than whether it looks like an integration line. They come in
 * one fire-and-silence set, because the arm is a widened warning and its regression is a spurious
 * fire: the `trunk`-with-detached-`HEAD` repository (the measured shape — wired to a `main` it does
 * not have, silently), a `develop` repository that resolves, a repository with no commit at all, in
 * which nothing resolves, and a `main` repository with a `main`, which is the no-noise property.
 */
test('init detects the default branch rather than assuming one, and warns only when it guessed', async (t) => {
  await t.test('a repository whose only branch is master is wired to master', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'master');

    const { stdout, stderr } = await initOk(dir);

    const config = readJson(join(dir, CONFIG_FILE));
    assert.equal(config.defaultBranch, 'master');
    assert.deepEqual(config.protectedBranches, ['master'], 'the guard protects a branch this repository does not have');
    assert.match(stdout, /taken from the checked-out branch "master"/);
    assert.doesNotMatch(stderr, UNCONVENTIONAL_BRANCH_WARNING, `master was reported as a guess worth warning about:\n${stderr}`);
  });

  await t.test('origin/HEAD outranks the branch the run happens to stand on', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feature_x');
    await seedRemoteHead(dir, 'trunk');

    const { stdout, stderr } = await initOk(dir);

    const config = readJson(join(dir, CONFIG_FILE));
    assert.equal(config.defaultBranch, 'trunk');
    assert.deepEqual(config.protectedBranches, ['trunk']);
    assert.match(stdout, /detected from origin\/HEAD as "trunk"/);
    // `trunk` is on neither side of the conventional-name list, so a warning here could only mean
    // the check ran over a rung that states rather than guesses.
    assert.doesNotMatch(stderr, UNCONVENTIONAL_BRANCH_WARNING, `origin/HEAD was second-guessed:\n${stderr}`);
  });

  await t.test('a feature branch with nothing to outrank it is wired in, and warned about', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feature_x');

    const { stderr } = await initOk(dir);

    const config = readJson(join(dir, CONFIG_FILE));
    // Kept rather than replaced: overriding it is what silently mis-wired a repository whose
    // integration line is called something else, and the warning is the half that is actionable.
    assert.equal(config.defaultBranch, 'feature_x');
    assert.match(stderr, UNCONVENTIONAL_BRANCH_WARNING);
    assert.match(stderr, /--default-branch/, `the warning does not name the flag that corrects it:\n${stderr}`);
  });

  await t.test('an unborn HEAD names a branch, and that is the name wired in', async (subtest) => {
    // Built by hand rather than by the fixture, and left at `git init`: the subject is a repository
    // whose HEAD points at a branch no commit has landed on, which is what `--git-init` produces.
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });
    await runGit(dir, ['init', '--quiet']);
    await runGit(dir, ['branch', '-m', 'trunk']);

    const { stdout, stderr } = await initOk(dir);

    // `trunk` is reachable from exactly one rung here: it is not the schema default, and
    // init.defaultBranch answers nothing at all under the fixture's isolation. So the value is
    // proof the ladder read the repository rather than proof of what the host is configured for.
    const config = readJson(join(dir, CONFIG_FILE));
    assert.equal(config.defaultBranch, 'trunk');
    assert.deepEqual(config.protectedBranches, ['trunk']);
    // Byte-exact rather than a substring match: the rung-2 note is what the three-answer probe most
    // plausibly regresses, and a repository with no commit is the one state whose answer comes from
    // the second git invocation rather than the first.
    assert.ok(
      stdout.includes(UNBORN_HEAD_RUNG_2_NOTE),
      `the unborn-HEAD rung-2 note is not the sentence it has always been:\n${stdout}`,
    );
    // The rung is a guess about this checkout whether or not a commit has landed on it, so the
    // warning it carries has to fire here exactly as it does for a feature branch.
    assert.match(stderr, UNCONVENTIONAL_BRANCH_WARNING);
  });

  await t.test('a detached HEAD is reported as detached, not as a repository with no branch', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'trunk');
    // The state a colocated jj repository is in after every `jj new`, reached here the way git
    // reaches it: a commit to stand off, and then HEAD moved off the branch that carries it.
    await runGit(dir, ['checkout', '--detach']);

    const { stdout } = await initOk(dir);

    const config = readJson(join(dir, CONFIG_FILE));
    // The value is whatever the rungs below rung 2 answer — unchanged by this case, which is about
    // the wording. What it must not be is the branch HEAD was detached from: rung 2 did not answer.
    assert.notEqual(config.defaultBranch, 'trunk', 'the detached-from branch was wired in as if rung 2 had answered');
    assert.deepEqual(config.protectedBranches, [config.defaultBranch]);
    assert.match(stdout, DETACHED_HEAD_NOTE);
    // The half the wording exists for: the old clause says this repository offered no branch, which
    // is false of one that has branches and is standing off them.
    assert.doesNotMatch(
      stdout,
      /no checked-out branch/,
      `a detached HEAD was reported as a repository with no branch to offer:\n${stdout}`,
    );
  });

  await t.test('a repository --git-init created is wired to the branch its first commit lands on', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

    const { stdout } = await initOk(dir, ['--git-init'], COMMIT_IDENTITY);

    // Read back from the repository the run created, so the assertion is that the two agree rather
    // than that either equals a name this test chose.
    const branch = (await runGit(dir, ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout.trim();
    const config = readJson(join(dir, CONFIG_FILE));
    assert.equal(config.defaultBranch, branch, 'the config names a branch this repository does not have');
    assert.deepEqual(config.protectedBranches, [branch], 'the pre-push guard protects a branch that does not exist');
    assert.match(stdout, /taken from the checked-out branch/);

    // The headline adoption shape's own next step, and the half a config assertion cannot cover: a
    // defaultBranch naming nothing is a valid config, so only the check that resolves it goes red.
    //
    // **`remote` is the one check this repository fails, and it is expected to.** A repository
    // `--git-init` created has no remote by construction, and `doctor`'s `remote` check grades that
    // a failure because `create-worktree.sh` creates every run's checkout from
    // `origin/<defaultBranch>` — so the exit status here is 1 and says something true. The
    // assertion is over the *set* of failing checks rather than over the status alone, which is
    // what keeps this a statement about the default branch: a second check going red would fail it.
    const doctor = await runCli(dir, ['doctor']);
    assert.deepEqual(
      failedCheckIds(doctor.stderr),
      ['remote'],
      `doctor failed a repository init had just created for something other than its missing remote:\n${doctor.stderr}`,
    );
    assert.match(doctor.stdout, doctorPass('default-branch'));
  });

  await t.test('--default-branch wins over everything the repository says', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feature_x');
    await seedRemoteHead(dir, 'trunk');

    const { stdout } = await initOk(dir, ['--default-branch', 'release']);

    const config = readJson(join(dir, CONFIG_FILE));
    assert.equal(config.defaultBranch, 'release');
    assert.deepEqual(config.protectedBranches, ['release']);
    assert.match(stdout, /set from --default-branch as "release"/);
  });

  await t.test('a schema default wired into a repository that has no branch by that name is warned about', async (subtest) => {
    // The measured shape: a repository whose integration line is `trunk`, no origin/HEAD, and a
    // detached HEAD — the steady state of a colocated jj checkout — so rung 2 cannot answer and
    // git's init.defaultBranch answers nothing under the fixture's isolation. Rung 4 then writes the
    // schema default, which is the rung that used to say nothing at all.
    //
    // `remote: false` is load-bearing rather than incidental: the ordinary fixture seeds
    // `refs/remotes/origin/<whatever this host's git names a first branch>`, and on a host that
    // names it `main` the schema default would resolve as a remote-tracking ref — so the case would
    // measure the host rather than the arm. The shape this reproduces has no origin at all.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles(), remote: false });
    await seedBranch(dir, 'trunk');
    await runGit(dir, ['checkout', '--detach']);

    const { stderr } = await initOk(dir);

    const config = readJson(join(dir, CONFIG_FILE));
    // The value is kept, as on every rung: what changes is that the run says it resolves to nothing.
    assert.match(stderr, UNRESOLVABLE_BRANCH_WARNING, `a branch this repository does not have was wired in silently:\n${stderr}`);
    // Read back from the config rather than spelled here, so the case asserts the warning is about
    // the value that landed rather than about a name the test chose.
    assert.match(stderr, new RegExp(`as ${JSON.stringify(config.defaultBranch)}`));
    assert.notEqual(config.defaultBranch, 'trunk', 'rung 2 answered over a detached HEAD');
    // The conventional-name arm is silent on `main` by construction, which is exactly why the
    // resolution arm exists: it is the arm that has to fire here.
    assert.doesNotMatch(stderr, UNCONVENTIONAL_BRANCH_WARNING);
    // Both remedies, because the flag the previous text named is discarded by the next init — the
    // config this run has just written is the one that discards it.
    assert.match(stderr, CONFIG_SET_REMEDY, `the warning names no route that changes one key:\n${stderr}`);
    assert.match(stderr, RESET_CONFIG_REMEDY, `the warning names no route that rebuilds the file:\n${stderr}`);
  });

  await t.test('a develop repository that has a develop draws no unresolvable warning', async (subtest) => {
    // The spurious fire the old test would have raised in reverse: `develop` is off the conventional
    // list, so arm 2 still fires — but the name resolves, so arm 1 must not, and the two arms have
    // to be distinguishable in the output rather than collapsing into one message.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'develop');

    const { stderr } = await initOk(dir);

    assert.equal(readJson(join(dir, CONFIG_FILE)).defaultBranch, 'develop');
    assert.doesNotMatch(stderr, UNRESOLVABLE_BRANCH_WARNING, `a branch this repository has was reported as absent:\n${stderr}`);
    assert.match(stderr, UNCONVENTIONAL_BRANCH_WARNING);
  });

  await t.test('a repository with no commit draws no unresolvable warning, because nothing resolves in one', async (subtest) => {
    // The gate on the resolution arm, and the reason it is ordered first rather than asked always:
    // between `git init` and a first commit *no* name resolves, so an ungated arm would fire on every
    // --git-init adoption. `main` is deliberate — it is what the arm would report absent here.
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });
    await runGit(dir, ['init', '--quiet']);
    await runGit(dir, ['branch', '-m', 'main']);

    const { stderr } = await initOk(dir);

    assert.equal(readJson(join(dir, CONFIG_FILE)).defaultBranch, 'main');
    assert.doesNotMatch(stderr, UNRESOLVABLE_BRANCH_WARNING, `a repository between git init and its first commit was warned about:\n${stderr}`);
  });

  await t.test('a main repository standing on main is warned about nothing', async (subtest) => {
    // The no-noise property, stated over the commonest repository there is: the guess is right, both
    // arms are silent, and a run that warns here is warning every ordinary adoption.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'main');

    const { stderr } = await initOk(dir);

    assert.equal(readJson(join(dir, CONFIG_FILE)).defaultBranch, 'main');
    assert.doesNotMatch(stderr, UNRESOLVABLE_BRANCH_WARNING, `a correct guess was reported as unresolvable:\n${stderr}`);
    assert.doesNotMatch(stderr, UNCONVENTIONAL_BRANCH_WARNING, `a correct guess was reported as unconventional:\n${stderr}`);
  });
});

/**
 * The clause every rung note of `resolveDefaultBranch` carries, across all four verbs the five rungs
 * use.
 *
 * One alternation rather than five literals, because the property under test is that *whichever*
 * rung fired is silent on a run that discarded what it resolved — and exactly one of them fires on
 * any run, since the rungs are early-return arms.
 */
const RUNG_NOTE_CLAUSE = /defaultBranch and protectedBranches were (?:set|detected|taken|written)/;

/** The kept-config note that replaces it, matched on the clause that names the value in force. */
const IN_EFFECT_NOTE = 'wires this repository to defaultBranch';

/** The rung notes as they are worded today, one per rung, keyed by what puts the run on that rung. */
const RUNG_NOTES = [
  {
    rung: '0, --default-branch',
    args: ['--default-branch', 'release'],
    // Seeded with a branch the flag then outranks, so the arm is reached over a repository that had
    // an answer of its own rather than over one with nothing to say.
    seed: async (dir) => seedBranch(dir, 'feature_x'),
    sentence: () =>
      'defaultBranch and protectedBranches were set from --default-branch as "release", so nothing about the repository was consulted',
  },
  {
    rung: '1, origin/HEAD',
    args: [],
    seed: async (dir) => {
      await seedBranch(dir, 'feature_x');
      await seedRemoteHead(dir, 'trunk');
    },
    sentence: () =>
      'defaultBranch and protectedBranches were detected from origin/HEAD as "trunk", which is the repository\'s own statement of the line work merges back into; --default-branch overrides it',
  },
  {
    rung: '2, the checked-out branch',
    args: [],
    seed: async (dir) => seedBranch(dir, 'master'),
    sentence: () =>
      'no origin/HEAD is known here, so defaultBranch and protectedBranches were taken from the checked-out branch "master"; --default-branch overrides it',
  },
  {
    rung: "3, git's init.defaultBranch",
    args: [],
    seed: async (dir) => {
      await seedBranch(dir, 'trunk');
      await runGit(dir, ['checkout', '--detach']);
      // Set in the repository's own config, which `git config --get` answers from: the fixture
      // redirects the system and global files, so this is the only scope that can reach rung 3.
      await runGit(dir, ['config', 'init.defaultBranch', 'release_line']);
    },
    sentence: () =>
      "no origin/HEAD is known here and HEAD is detached, so the checked-out branch could not answer — a detached HEAD is the ordinary working state of a colocated jj repository, and it is what demoted this detection a rung, so defaultBranch and protectedBranches were taken from git's init.defaultBranch as \"release_line\"; --default-branch overrides it",
  },
  {
    rung: '4, the schema default',
    args: [],
    seed: async (dir) => {
      await seedBranch(dir, 'trunk');
      await runGit(dir, ['checkout', '--detach']);
    },
    // Read back from the written config rather than spelled here, so the case asserts the sentence
    // is about the value that landed rather than about a name this test chose.
    sentence: (config) =>
      `no origin/HEAD is known here and HEAD is detached, so the checked-out branch could not answer — a detached HEAD is the ordinary working state of a colocated jj repository, and it is what demoted this detection a rung, and no init.defaultBranch answered either, so defaultBranch and protectedBranches were written as the schema default ${JSON.stringify(config.defaultBranch)}; --default-branch overrides it`,
  },
];

/**
 * A rung note says what `defaultBranch` and `protectedBranches` *were set from*, which is a claim
 * about a config that was written — so a re-run that kept the file already there stops making it and
 * says what that file holds instead.
 *
 * The finding this closes measured the false half twice over one repository whose config said
 * `trunk`: a plain re-run reported the two keys "were taken from the checked-out branch
 * `feat_add_search`", and a re-run carrying `--default-branch trunk` reported them "set from
 * --default-branch" while the file on disk never moved.
 *
 * **Case (a) is the suppression**, asserted against the same repository's first run rather than
 * against a literal, so it measures a gate rather than a fixture that never produced the note.
 *
 * **Case (b) is the finding's own second shape**, and it holds the two halves apart: the run must not
 * claim the flag was applied, *and* the file must be untouched — a fix that silenced the note by
 * writing the flag would satisfy the first alone.
 *
 * **Case (c) is the regression this deferral most plausibly causes.** The five rungs are early-return
 * arms, so a run that lost its rung note loses the only line saying which one answered; each is
 * driven to a first `init`, where every one of them is still owed, and asserted byte-exact.
 */
test('a kept re-run stops narrating a detection it discarded, and names the value in force instead', async (t) => {
  await t.test('the rung note that fired on the first run is gone from the second', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'main');

    const first = await initOk(dir);
    // The state the case needs, asserted rather than assumed: rung 2 narrated itself on the run that
    // wrote the config, so its absence below is a suppression.
    assert.equal(
      notesBlock(first.stdout).filter((note) => RUNG_NOTE_CLAUSE.test(note)).length,
      1,
      `the first run narrated no rung at all, so the second run's silence proves nothing:\n${first.stdout}`,
    );

    const { stdout } = await initOk(dir);

    assert.deepEqual(
      notesBlock(stdout).filter((note) => RUNG_NOTE_CLAUSE.test(note)),
      [],
      `the kept re-run said what a discarded config's keys were set from:\n${stdout}`,
    );

    // And the reader can still answer *what branch is this repository wired to* from the block alone.
    const inEffect = notesBlock(stdout).filter((note) => note.includes(IN_EFFECT_NOTE));
    assert.equal(inEffect.length, 1, `the kept re-run named no value in force:\n${stdout}`);
    const config = readJson(join(dir, CONFIG_FILE));
    assert.ok(
      inEffect[0].includes(`defaultBranch ${JSON.stringify(config.defaultBranch)}`),
      `the note does not name the branch the kept file carries:\n${inEffect[0]}`,
    );
    assert.ok(
      inEffect[0].includes(JSON.stringify(config.protectedBranches)),
      `the note does not name the branches the guards match:\n${inEffect[0]}`,
    );
    // Both routes that change it, because the flag this run carried would be discarded by the next
    // one too — the same pair the guessed-branch warning names.
    assert.match(inEffect[0], /config set <key> <value>/, `the note names no route that changes one key:\n${inEffect[0]}`);
    assert.match(inEffect[0], /init --reset-config/, `the note names no route that rebuilds the file:\n${inEffect[0]}`);
  });

  await t.test('a --default-branch the kept file discards is not reported as applied', async (subtest) => {
    // The measured shape: a repository whose config says `feat_add_search`, re-run with a flag
    // naming something else.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feat_add_search');
    await initOk(dir);
    const before = text(dir, CONFIG_FILE);
    assert.equal(readJson(join(dir, CONFIG_FILE)).defaultBranch, 'feat_add_search');

    const { stdout } = await initOk(dir, ['--default-branch', 'trunk']);

    assert.doesNotMatch(
      stdout,
      /set from --default-branch as "trunk"/,
      `the run reported a flag whose value it threw away:\n${stdout}`,
    );
    // The other half: silencing the sentence by writing the flag would be the opposite defect.
    assert.equal(text(dir, CONFIG_FILE), before, 'a kept config was rewritten from the command line');
    const inEffect = notesBlock(stdout).filter((note) => note.includes(IN_EFFECT_NOTE));
    assert.equal(inEffect.length, 1, `the run said neither what the flag did nor what is in force:\n${stdout}`);
    assert.ok(
      inEffect[0].includes('defaultBranch "feat_add_search"'),
      `the note does not name the value the flag failed to change:\n${inEffect[0]}`,
    );
  });

  await t.test('a first init still narrates every rung, worded exactly as it was', async (subtest) => {
    for (const { rung, args, seed, sentence } of RUNG_NOTES) {
      const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
      await seed(dir);

      const { stdout } = await initOk(dir, args);

      const expected = sentence(readJson(join(dir, CONFIG_FILE)));
      assert.ok(stdout.includes(expected), `rung ${rung} no longer says what it has always said:\n${stdout}`);
    }
  });
});

/** The clause the discarded-flag warning is identified by: the fact it exists to report. */
const DISCARDED_CLAUSE = 'was read rather than written on this run';

/** The warning lines of a run that report a flag whose value it wrote nowhere. */
function discardedFlagWarnings(stderr) {
  return warningLines(stderr).filter((line) => line.includes(DISCARDED_CLAUSE));
}

/**
 * A flag that supplies a **configuration value** is silently ignored on any run that reads an
 * existing `harness.config.json` — and a flag silently ignored is worse than one rejected. So the
 * run names every one it dropped, by the spelling it was typed with, and names the two commands
 * that would have applied it.
 *
 * **Warned rather than refused.** A re-run carrying a leftover flag from a shell history is an
 * ordinary thing to do, and refusing it would fail a run whose every other effect is correct — so
 * case (a) asserts the run still exits 0 and the file is byte-identical, which is the half a fix
 * that "applied" the flag would break.
 *
 * **The class is the property, not the one flag.** The last case is the negative control that keeps
 * it honest: `--marketplace` also names a value, and that value reaches the committed
 * `.claude/settings.json` rather than `harness.config.json` (`generators/projectSettings.ts`) — so
 * whether the config was kept says nothing about it, and this warning must not name it.
 *
 * **And the class is about where the value is *written*, not about everything the flag reaches.**
 * The `--preset` case is the one member that proves the difference: its value goes unwritten like
 * every other, and it still steers stack detection, whose raw command lines reach a wrapper body a
 * `--force` re-run re-renders. A warning that told this adopter the flag reached the config and
 * nothing else would send them to `--reset-config`, which discards every hand-set value in the file,
 * for an effect the plain re-run had already had half of.
 */
test('a kept-config run names the flags whose values it dropped, and the two commands that apply them', async (t) => {
  await t.test('--default-branch over a wired repository is named, with both remedies', async (subtest) => {
    // The finding's own reproduction: a repository already carrying a config, re-run with the flag
    // the wrong-branch warning prescribes.
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feat_add_search');
    await initOk(dir);
    const before = text(dir, CONFIG_FILE);

    const { stderr } = await initOk(dir, ['--default-branch', 'trunk']);

    const reported = discardedFlagWarnings(stderr);
    assert.equal(reported.length, 1, `the dropped flag was reported ${reported.length} times:\n${stderr}`);
    assert.ok(reported[0].includes('--default-branch'), `the warning names no flag:\n${reported[0]}`);
    // Both remedies, each spelled as it is retyped — the rebuild carrying this run's own value, so
    // following the printed line verbatim ends with the config the adopter asked for.
    assert.ok(
      reported[0].includes('init --reset-config --default-branch trunk'),
      `the warning names no rebuild that carries the flag:\n${reported[0]}`,
    );
    assert.ok(
      reported[0].includes('config set defaultBranch <value>'),
      `the warning names no per-key route:\n${reported[0]}`,
    );
    // The other half: the run warned instead of applying anything, and instead of failing.
    assert.equal(text(dir, CONFIG_FILE), before, 'a kept config was rewritten from the command line');

    // It survives `--quiet`, which is what a warning is for: an unattended run that passed a flag
    // which did nothing is exactly the reader who needs to have been told.
    const quiet = await initOk(dir, ['--quiet', '--default-branch', 'trunk']);
    assert.equal(discardedFlagWarnings(quiet.stderr).length, 1, `--quiet swallowed the warning:\n${quiet.stderr}`);
  });

  await t.test('the same run with --reset-config warns about nothing and lands the value', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feat_add_search');
    await initOk(dir);

    const { stderr } = await initOk(dir, ['--reset-config', '--default-branch', 'trunk']);

    assert.deepEqual(discardedFlagWarnings(stderr), [], `the run that wrote the flag reported it dropped:\n${stderr}`);
    assert.equal(readJson(join(dir, CONFIG_FILE)).defaultBranch, 'trunk');
  });

  await t.test('a first init warns about nothing, because it wrote the file', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await seedBranch(dir, 'feat_add_search');

    const { stderr } = await initOk(dir, ['--default-branch', 'trunk']);

    assert.deepEqual(discardedFlagWarnings(stderr), [], `the run that wrote the flag reported it dropped:\n${stderr}`);
    assert.equal(readJson(join(dir, CONFIG_FILE)).defaultBranch, 'trunk');
  });

  await t.test('--preset is named as unwritten, and not as a flag that reached nothing', async (subtest) => {
    // A seed both command families answer for, so `--preset` alone decides which raw lines this run
    // detects — and the mechanism is the **hoist**, not the preset name: `commandFamilies` orders
    // `npm` last and moves to the front only the family named by the *signal row* that matched
    // (`detect/presets.ts`, `SIGNAL_COMMAND_FAMILY`). So the first init matches
    // `monorepo:workspaces-key`, hoists `npm` over the Python manifest and resolves the npm scripts;
    // the forced re-run evaluates no row at all, reports `forced`, hoists nothing and takes the
    // standing order, where `python` sits ahead of `npm`. The `workspaces` key is what makes the two
    // runs differ, so it is the fixture's subject rather than a decoration.
    const rootManifest = { ...nodeProjectFiles()['package.json'], workspaces: ['packages/*'] };
    const dir = await fixtureFor(subtest, {
      files: {
        ...nodeProjectFiles(),
        'package.json': rootManifest,
        'pyproject.toml': '[project]\nname = "fixture"\n',
      },
    });
    await initOk(dir);
    const before = text(dir, CONFIG_FILE);
    assert.equal(wrapperCommand(dir, 'typecheck.sh'), 'npm run typecheck');

    // `--force` because wrappers are create-if-absent: it is the re-run on which the flag's second
    // effect is visible at all, and the one an adopter reaches for after editing a preset.
    const { stderr } = await initOk(dir, ['--force', '--preset', 'python-package']);

    const reported = discardedFlagWarnings(stderr);
    assert.equal(reported.length, 1, `the dropped flag was reported ${reported.length} times:\n${stderr}`);
    assert.ok(reported[0].includes('--preset'), `the warning names no flag:\n${reported[0]}`);
    // Reported, because the value was written nowhere — the file is byte-identical.
    assert.equal(text(dir, CONFIG_FILE), before, 'a kept config was rewritten from the command line');
    // And what the same flag did steer: the wrapper body, re-rendered from this run's detection.
    assert.equal(wrapperCommand(dir, 'typecheck.sh'), 'mypy .');
    assert.ok(
      reported[0].includes('stack detection'),
      `the warning does not say what the flag still steered:\n${reported[0]}`,
    );
    assert.ok(
      !reported[0].includes('and nothing else'),
      `the warning still claims the flag reached nothing but the config:\n${reported[0]}`,
    );
  });

  await t.test('a flag that reaches something other than the config is not reported', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);

    const { stderr } = await initOk(dir, [MARKETPLACE_FLAG, CHOSEN_SLUG]);

    assert.deepEqual(discardedFlagWarnings(stderr), [], `a flag a kept run does not discard was reported:\n${stderr}`);
  });
});

/** The machine-local settings file, spelled from its two parts as the CLI resolves them. */
const MACHINE_DIR = 'autonomous-sdlc-harness';
const PUSH_ENV_FILE = 'push.env';

/** The repository-side half of the same precedence, at the path a generated config seeds. */
const REPO_PUSH_ENV_PATH = '.claude/push-notify.env';

/**
 * The endpoint the cases below pass, chosen so `assert.ok(!output.includes(…))` means what it says:
 * it is under `.invalid`, so nothing can resolve it, and its path segment appears in no fixture
 * path, no generated file and no flag name — so a run that echoed it back has nowhere else the
 * match could have come from.
 */
const PUSH_URL = 'https://example.invalid/t0p1c-appears-nowhere-else';

/** An ntfy topic chosen the way {@link PUSH_URL} is: legal as a topic name, and in no fixture path. */
const TOPIC = 'harness-t0p1c-nowhere-else-9f3';

/** Neither a topic name nor a URL, and — for the not-echoed assertions — in no message this CLI prints. */
const UNRECOGNISED_DESTINATION = 'not a destination';

/** The two keys the notifier recognises, asserted by name because the file is a contract with it. */
const PUSH_URL_KEY = 'HARNESS_PUSH_URL';
const PUSH_CMD_KEY = 'HARNESS_PUSH_CMD';

/**
 * A throwaway directory to point `XDG_CONFIG_HOME` at, and the settings file that resolves under it.
 *
 * **Every case below passes one.** The subject here is a file outside the repository, so a case that
 * forgot this would write into the machine running the tests — measuring the machine instead of the
 * fixture, which is the discipline `docs/outer-loop-verification.md` states for the watcher rows and
 * which matters more here, because the file it would land on is the operator's real credential file.
 */
async function machineHome(t) {
  const home = await fixtureFor(t, { git: false });
  return { home, dir: join(home, MACHINE_DIR), file: join(home, MACHINE_DIR, PUSH_ENV_FILE) };
}

/** A path's permission bits, or `undefined` when nothing is there. */
async function modeOf(path) {
  try {
    return (await stat(path)).mode & 0o777;
  } catch {
    return undefined;
  }
}

/**
 * Push notifications: the opt-in, the guided setup, and the one case that looks like a nicety and is
 * the reason the generator exists.
 *
 * **That case is the second arm below.** `docs/watcher.md` §6's precedence is that the machine-local
 * file is read *first* and the repository's configured `pushEnvPath` is then not read at all — so an
 * opt-in with no endpoint that wrote an empty machine-local file would shadow a repository-side file
 * that already had values, and an operator who asked for notifications would get fewer than before.
 * Writing nothing is therefore the behaviour under test, not the absence of one.
 *
 * Every subprocess here has a pipe for stdin, so each takes the non-interactive path the interaction
 * rule promises (`docs/cli.md` §2): the flags are the whole interface, and the first arm is also the
 * proof that a run nobody can ask never blocks on the question. For the same reason the terminal
 * re-ask of an unrecognised destination is not reachable here; it is covered by the hand-run gate in
 * `docs/development.md` §5 instead.
 *
 * `PUSH_DESTINATION_FORMS` is imported rather than spelled out, an exception to choice 3 in this
 * file's header: the assertion is that two surfaces print one wording, not what that wording is.
 */
test('push notifications are opt-in, and an opt-in without an endpoint writes nothing at all', async (t) => {
  await t.test('a run that was never asked writes nothing outside the repository', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { stdout } = await initOk(dir, [], { XDG_CONFIG_HOME: machine.home });

    assert.equal(existsSync(machine.dir), false, `${machine.dir} was created by a run that took the default`);
    // The repository side is untouched too: the opt-in writes no configuration key, so a run that
    // declined it produces exactly the config every earlier release produced.
    assert.equal(readJson(join(dir, CONFIG_FILE)).pushEnvPath, REPO_PUSH_ENV_PATH);
    // And the flag is discoverable from the run that skipped it, which is what the interaction rule
    // asks of a decision nobody could be asked about.
    assert.match(stdout, /--notifications/, `nothing on stdout names the flag that opts in:\n${stdout}`);
  });

  await t.test('the opt-in with an endpoint writes the settings file, and never prints the endpoint', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { stdout, stderr } = await initOk(dir, ['--notifications', '--push-url', PUSH_URL], {
      XDG_CONFIG_HOME: machine.home,
    });

    assert.ok(existsSync(machine.file), `no settings file at ${machine.file}`);
    assert.equal(await modeOf(machine.file), 0o600, 'the file holding a push credential is readable beyond its owner');
    // The directory's mode is asserted explicitly because it is a separate step from the file's: a
    // 0600 file inside a 0755 directory is still a directory anyone on the machine can list.
    assert.equal(await modeOf(machine.dir), 0o700, 'the directory holding a push credential is not 0700');

    const content = readFileSync(machine.file, 'utf8');
    assert.match(content, new RegExp(`^${PUSH_URL_KEY}=${PUSH_URL}$`, 'm'));
    // Empty rather than absent: the second delivery arm is there to be filled in, and a key the
    // operator has to remember the spelling of is one they will spell wrong.
    assert.match(content, new RegExp(`^${PUSH_CMD_KEY}=$`, 'm'));

    // The whole reason the note names keys and the action log names paths: an endpoint is a bearer
    // credential for every service worth pointing this at, and a terminal scrollback is not private.
    assert.ok(!stdout.includes(PUSH_URL), `the endpoint was printed back on stdout:\n${stdout}`);
    assert.ok(!stderr.includes(PUSH_URL), `the endpoint was printed back on stderr:\n${stderr}`);
    assert.ok(stdout.includes(machine.file), `the run does not say where it wrote the settings:\n${stdout}`);
  });

  await t.test('a topic given through the flag is written as its ntfy.sh address', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { stdout, stderr } = await initOk(dir, ['--notifications', '--push-url', TOPIC], {
      XDG_CONFIG_HOME: machine.home,
    });

    const content = readFileSync(machine.file, 'utf8');
    assert.match(content, new RegExp(`^HARNESS_PUSH_URL=https://ntfy\\.sh/${TOPIC}$`, 'm'));
    assert.equal(await modeOf(machine.file), 0o600, 'the file holding a push credential is readable beyond its owner');
    assert.equal(await modeOf(machine.dir), 0o700, 'the directory holding a push credential is not 0700');
    assert.ok(!stdout.includes(TOPIC), `the topic was printed back on stdout:\n${stdout}`);
    assert.ok(!stderr.includes(TOPIC), `the topic was printed back on stderr:\n${stderr}`);
    // A bare topic also passes the parse-time check `parseInitFlags` makes on every --push-url.
    assert.ok(!stderr.includes('init: --push-url takes'), `the parser refused a topic name:\n${stderr}`);
  });

  await t.test('the ntfy.sh/<topic> host form is written as the same address', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    await initOk(dir, ['--notifications', '--push-url', `ntfy.sh/${TOPIC}`], { XDG_CONFIG_HOME: machine.home });

    assert.match(readFileSync(machine.file, 'utf8'), new RegExp(`^HARNESS_PUSH_URL=https://ntfy\\.sh/${TOPIC}$`, 'm'));
  });

  await t.test("another service's URL is accepted as well, and single-quoted where a shell would split it", async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);
    const url = 'https://example.invalid/hook?a=1&b=2';

    const { stdout, stderr } = await initOk(dir, ['--notifications', '--push-url', url], {
      XDG_CONFIG_HOME: machine.home,
    });

    assert.ok(
      readFileSync(machine.file, 'utf8').split('\n').includes(`${PUSH_URL_KEY}='${url}'`),
      'the URL was not written single-quoted',
    );
    assert.ok(!stdout.includes(url), `the URL was printed back on stdout:\n${stdout}`);
    assert.ok(!stderr.includes(url), `the URL was printed back on stderr:\n${stderr}`);
  });

  await t.test('a --push-url that is neither form is refused before anything is written', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { status, stdout, stderr } = await runCli(dir, ['init', '--notifications', '--push-url', UNRECOGNISED_DESTINATION], {
      XDG_CONFIG_HOME: machine.home,
    });

    assert.equal(status, 1, `init exited ${status}\n${stdout}\n${stderr}`);
    assert.ok(stderr.includes('--push-url'), `the refusal does not name the flag:\n${stderr}`);
    assert.ok(stderr.includes('ntfy'), `the refusal does not offer the ntfy topic form:\n${stderr}`);
    assert.ok(!stdout.includes(UNRECOGNISED_DESTINATION), `the value was printed back on stdout:\n${stdout}`);
    assert.ok(!stderr.includes(UNRECOGNISED_DESTINATION), `the value was printed back on stderr:\n${stderr}`);
    assert.equal(existsSync(machine.dir), false, `a refused run created ${machine.dir}`);
    assert.equal(await exists(dir, CONFIG_FILE), false, 'a refused run wrote the config');
  });

  await t.test('the same value is refused without --notifications too', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { status, stdout, stderr } = await runCli(dir, ['init', '--push-url', UNRECOGNISED_DESTINATION], {
      XDG_CONFIG_HOME: machine.home,
    });

    assert.equal(status, 1, `init exited ${status}\n${stdout}\n${stderr}`);
    assert.equal(existsSync(machine.dir), false, `a refused run created ${machine.dir}`);
  });

  await t.test('a hand-written settings file is not re-pointed by a later topic', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);
    mkdirSync(machine.dir, { mode: 0o700 });
    writeFileSync(machine.file, `# set up by hand\n${PUSH_URL_KEY}=${PUSH_URL}\n`, { mode: 0o600 });
    const before = readFileSync(machine.file, 'utf8');

    await initOk(dir, ['--notifications', '--push-url', TOPIC], { XDG_CONFIG_HOME: machine.home });

    assert.equal(readFileSync(machine.file, 'utf8'), before, 'a re-run re-pointed a hand-written settings file');
  });

  await t.test('a plain re-run leaves a configured machine exactly as it was', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);
    const env = { XDG_CONFIG_HOME: machine.home };
    await initOk(dir, ['--notifications', '--push-url', PUSH_URL], env);
    const before = readFileSync(machine.file, 'utf8');

    await initOk(dir, [], env);

    assert.equal(readFileSync(machine.file, 'utf8'), before, 'a plain re-run rewrote the settings file');
  });

  await t.test('a refused destination leaves a configured machine exactly as it was', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);
    const env = { XDG_CONFIG_HOME: machine.home };
    await initOk(dir, ['--notifications', '--push-url', PUSH_URL], env);
    const before = readFileSync(machine.file, 'utf8');

    const { status } = await runCli(dir, ['init', '--notifications', '--push-url', UNRECOGNISED_DESTINATION], env);

    assert.equal(status, 1);
    assert.equal(readFileSync(machine.file, 'utf8'), before, 'a refused re-run degraded the settings file');
  });

  await t.test('the question and the guided note describe the accepted forms in one wording', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { stdout } = await initOk(dir, ['--notifications'], { XDG_CONFIG_HOME: machine.home });

    const question = stdout.split('\n').find((line) => line.includes('Where should notifications be posted?'));
    assert.ok(question?.includes(PUSH_DESTINATION_FORMS), `the question does not carry the shared wording:\n${stdout}`);
    assert.ok(
      stdout.split(PUSH_DESTINATION_FORMS).length - 1 >= 2,
      `the shared wording is not on both the question and the guided note:\n${stdout}`,
    );
    for (const expected of ['ntfy', 'App Store', 'https://']) {
      assert.ok(stdout.includes(expected), `stdout does not mention ${expected}:\n${stdout}`);
    }
  });

  await t.test('--help names the flag with the shared placeholder', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await runCli(dir, ['init', '--help']);

    assert.ok(stdout.includes('--push-url <url-or-ntfy-topic>'), `--help does not show the placeholder:\n${stdout}`);
  });

  await t.test('the opt-in without an endpoint writes nothing and prints the guided setup', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { stdout } = await initOk(dir, ['--notifications'], { XDG_CONFIG_HOME: machine.home });

    // Not an empty file, and not even the directory: an empty machine-local file would win the
    // precedence over a repository-side file that already had values.
    assert.equal(existsSync(machine.dir), false, `${machine.dir} was created for an opt-in with no endpoint`);

    for (const expected of [machine.file, PUSH_URL_KEY, PUSH_CMD_KEY, 'ntfy.sh']) {
      assert.ok(stdout.includes(expected), `the guided setup does not name ${expected}:\n${stdout}`);
    }
  });

  await t.test('--dry-run previews the settings file and writes nothing anywhere', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { stdout } = await initOk(dir, ['--notifications', '--push-url', PUSH_URL, '--dry-run'], {
      XDG_CONFIG_HOME: machine.home,
    });

    assert.equal(existsSync(machine.dir), false, `a dry run created ${machine.dir}`);
    assert.equal(await exists(dir, CONFIG_FILE), false, 'a dry run wrote inside the repository too');
    // The preview is still faithful: it names the path a real run would have written, which is what
    // makes a dry run worth running before the one that writes outside the repository.
    assert.ok(stdout.includes(machine.file), `the preview does not name the settings file:\n${stdout}`);
    assert.ok(!stdout.includes(PUSH_URL), `the preview printed the endpoint:\n${stdout}`);
  });

  await t.test('a second init leaves an edited settings file exactly as it was left', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);
    const env = { XDG_CONFIG_HOME: machine.home };

    await initOk(dir, ['--notifications', '--push-url', PUSH_URL], env);
    appendFileSync(machine.file, `${PUSH_CMD_KEY}_NOTE=edited by the adopter\n`, 'utf8');
    const edited = readFileSync(machine.file, 'utf8');

    await initOk(dir, ['--notifications', '--push-url', 'https://example.invalid/a-different-endpoint'], env);

    // create-if-absent, like everything else init writes: after the first run the adopter's copy is
    // the only copy there is, and a second run that rewrote it would discard a working credential.
    assert.equal(readFileSync(machine.file, 'utf8'), edited, 'a re-run rewrote the settings the adopter had edited');
  });

  await t.test('an endpoint given without the opt-in is warned about, not written', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await machineHome(subtest);

    const { stderr } = await initOk(dir, ['--push-url', PUSH_URL], { XDG_CONFIG_HOME: machine.home });

    assert.equal(existsSync(machine.dir), false, 'an endpoint without the opt-in wrote the settings file anyway');
    // Warned rather than dropped in silence: the flag is only ever passed on purpose.
    assert.match(stderr, /--push-url was given without --notifications/, `the ignored flag was not reported:\n${stderr}`);
    assert.ok(!stderr.includes(PUSH_URL), `the warning quoted the endpoint back:\n${stderr}`);
  });
});

/**
 * The report's blank lines, and nothing else: a question is not read as one more line of the
 * narration above it, and the closing blocks' entries do not run together.
 *
 * **The piped half is the half a fixture can see.** Every subprocess here has a pipe for stdin, so
 * the driver question never prints at all — `askQaDriver` returns before printing on a run that
 * cannot be asked — and the unpiped reading of it is a supervised one. Two arms, because one run
 * cannot carry both witnesses: an ordinary run reaches the notification opt-in's no-terminal note
 * and both closing blocks, while the run that reaches the git-init question exits 1 before either
 * block is printed.
 */
test('every question and every closing entry is separated from the line above it', async (t) => {
  await t.test('the opt-in note and the two closing blocks, on an ordinary run', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir);

    // Exactly one blank line, so this fails on over-separation too — which is what a caller adding a
    // second separator of its own would produce.
    assert.match(
      stdout,
      /\n\nSet up push notifications for unattended runs\?/,
      `the opt-in note runs into the narration above it:\n${stdout}`,
    );
    assert.doesNotMatch(
      stdout,
      /\n\n\nSet up push notifications for unattended runs\?/,
      `the opt-in note is separated twice:\n${stdout}`,
    );

    const lines = stdout.split('\n');
    const notesAt = lines.indexOf('== notes');
    const nextAt = lines.indexOf('== next');
    assert.ok(notesAt !== -1 && nextAt !== -1, `the run printed no closing blocks:\n${stdout}`);

    // Between entries only: each heading keeps its first entry, which is what makes the blank line
    // read as the end of an entry rather than as padding.
    assert.equal(lines[notesAt + 1].startsWith('- '), true, `a blank line follows the notes heading:\n${stdout}`);
    assert.equal(lines[nextAt + 1].startsWith('1. '), true, `a blank line follows the next-steps heading:\n${stdout}`);

    const entriesIn = (from, to, matches) =>
      lines.map((line, index) => (index > from && index < to && matches(line) ? index : -1)).filter((index) => index !== -1);
    const notes = entriesIn(notesAt, nextAt, (line) => line.startsWith('- '));
    const steps = entriesIn(nextAt, lines.length, (line) => /^\d+\. /.test(line));
    assert.ok(notes.length > 1 && steps.length > 1, `too few entries to assert the separation on:\n${stdout}`);
    for (const index of [...notes.slice(1), ...steps.slice(1)]) {
      assert.equal(lines[index - 1], '', `an entry runs into the one above it:\n${lines[index]}`);
    }

    // The paste line is step 2's continuation rather than a fifth entry, so nothing separates them.
    const pasteAt = lines.findIndex((line) => line.trim() === PASTEABLE_INVOCATION);
    assert.ok(pasteAt !== -1, `the run printed no pasteable invocation:\n${stdout}`);
    assert.equal(
      lines[pasteAt - 1].startsWith('2. '),
      true,
      `the paste line was detached from the step it belongs to:\n${lines[pasteAt - 1]}`,
    );
  });

  await t.test('the git-init question, on the run that exits before those blocks', async (subtest) => {
    const dir = await fixtureFor(subtest, { git: false, files: nodeProjectFiles() });

    const { status, stdout } = await runCli(dir, ['init']);

    assert.equal(status, 1);
    assert.match(stdout, /Create one here and wire it\?/, `the git-init question was not put:\n${stdout}`);
    // That note is this run's first stdout line — nothing prints before the git gate — so what is
    // asserted is that it is not separated *twice*. It holds whether the separator is emitted
    // unconditionally or suppressed when nothing has been printed yet. No closing-block assertion
    // rides along: this run throws before either block is reached.
    assert.doesNotMatch(stdout, /\n\n/, `the git-init question is separated twice:\n${stdout}`);
  });
});

/**
 * The plugin's identity, taken from the compiled CLI rather than spelled here: a record seeded under
 * any other key is one the CLI correctly resolves nothing from, so the fixture would pin a machine
 * with no plugin while claiming to pin one with it. Everything else below is spelled literally —
 * choice 3 in the module header — because the *form* of these entries is what a run matches on.
 */
const { PLUGIN_KEY } = await loadCompiled('generators/projectSettings.js');

/** The agent runner's plugin directory under `CLAUDE_CONFIG_DIR`, and the record inside it. */
const CLAUDE_PLUGINS_DIR = 'plugins';
const INSTALLED_PLUGINS_FILE = 'installed_plugins.json';

/** One helper the plugin ships, read back off the root's own `scripts/` by `doctor`. */
const PLUGIN_HELPER = 'reserve-qa-user.sh';

/** The fragments of the run's own report that say what a forced run carried, and what it did not. */
const CARRIED_NOTE = 'were carried forward into the regenerated';
const CARRIED_NOTE_DRY = 'would be carried forward into the regenerated';
const NOT_CARRIED_WARNING = 'not carried into the regenerated profile';
/** The same drop as a preview states it — the conditional the `--dry-run` contract owes. */
const NOT_CARRIED_WARNING_DRY = 'would not be carried into the regenerated profile';

/**
 * The zero-root arm's own vocabulary, against the graded arm's.
 *
 * A run that resolved no plugin root graded nothing, so every sentence it prints has to be one it
 * earned: it may state a carry it could not verify, and may not claim this machine's roots, blame a
 * plugin upgrade, or say nothing re-derives an entry `doctor` re-derives wherever a root answers.
 * Each fragment is asserted in both directions, because `CARRIED_NOTE` alone is satisfied by either.
 */
const CARRIED_UNVERIFIED = 'unverified:';
const GRADED_CARRY = "naming this machine's plugin roots";
const UPGRADE_CAUSE = 'a plugin upgrade';
const BY_HAND_REMEDY = 'back by hand';

/** What the reporter leads a warning line with (`core/report.ts`) — one block per warning, body and all. */
const WARNING_MARK = '! ';

/** The orphan warning over exactly one entry: the noun the run counts, and the verb beside it. */
const ONE_ORPHAN_AGREES = /1 `permissions\.allow` entry in \S+ names an absolute directory/;

/**
 * `doctor`'s `plugin-permissions` line, as the reporter emits it on stdout — pinned to the arm that
 * **graded** the entries (`carries all …`) rather than to any pass, because the same check passes
 * with `not graded at this machine's plugin root` when no root resolves, and a fixture that had
 * quietly slipped into that state would satisfy a bare `PASS` while grading nothing.
 */
const PLUGIN_PERMISSIONS_GRADED = /^PASS\s+plugin-permissions\s+.*carries all/m;

/**
 * A throwaway plugin install root carrying one helper script, and the throwaway `CLAUDE_CONFIG_DIR`
 * that records it.
 *
 * **Every case below passes one**, `record: false` included: the file the roots are resolved from
 * sits outside every repository, so a case that forgot it would grade whatever plugin the account
 * running the suite happens to have enabled.
 */
async function pluginMachine(t, { record = true } = {}) {
  const root = await fixtureFor(t, { git: false });
  mkdirSync(join(root, 'scripts'), { recursive: true });
  writeFileSync(join(root, 'scripts', PLUGIN_HELPER), '#!/bin/sh\nexit 0\n', { mode: 0o755 });

  const home = await fixtureFor(t, { git: false });
  if (record) {
    mkdirSync(join(home, CLAUDE_PLUGINS_DIR), { recursive: true });
    writeFileSync(
      join(home, CLAUDE_PLUGINS_DIR, INSTALLED_PLUGINS_FILE),
      `${JSON.stringify({ version: 2, plugins: { [PLUGIN_KEY]: [{ scope: 'user', installPath: root }] } }, null, 2)}\n`,
      'utf8',
    );
  }
  return { root, env: { CLAUDE_CONFIG_DIR: home } };
}

/** The helper entry `doctor` dictates at a root, in the unquoted form it prints for pasting. */
function helperEntry(root, name = PLUGIN_HELPER) {
  return `Bash(bash ${root}/scripts/${name}:*)`;
}

/** The read grant at a root, in the profile's own two-slash spelling. */
function readEntry(root) {
  return `Read(/${root}/**)`;
}

/** Add entries to the generated profile's allow list, the way an operator pasting them would. */
function allowInProfile(dir, entries) {
  const profile = readJson(join(dir, PROFILE_FILE));
  profile.permissions.allow.push(...entries);
  writeFileSync(join(dir, PROFILE_FILE), `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
}

/** The profile's allow list as it stands on disk. */
function allowEntries(dir) {
  return readJson(join(dir, PROFILE_FILE)).permissions.allow;
}

/**
 * `--force` and the one group of entries this CLI knowingly cannot produce.
 *
 * `doctor`'s `plugin-permissions` check tells an adopter which lines to paste into the profile,
 * because a plugin root is machine-local and the install root carries the plugin version. The
 * profile is `create-if-absent`, which is what the generator's own header names as the property that
 * makes those pasted lines survive every later `init` — and `--force` is precisely the flag that
 * suspends it. Until this carry-forward existed, every repair the CLI prescribes as `init --force`
 * silently revoked the permission set the same tool had told the adopter to add by hand.
 *
 * **The screening arm is not a nicety.** These bytes were typed by a person, and `assertRunnable`
 * exits `EXIT.INTERNAL` on the stated ground that every entry reaching it is one the adopter could
 * not have caused — so a hand-typed quote carried straight through would have this CLI report its
 * own bug over an adopter's typo.
 *
 * The first case is also the verification Finding 57 owed — *an `init --force` on a repository whose
 * `plugin-permissions` check is green, after which the check is still green* — run here on every
 * suite run rather than by hand once.
 */
test('init --force carries the profile\'s resolved-plugin-root entries forward, and says what it carried and dropped', async (t) => {
  await t.test('the entries survive the regeneration, and the check that dictated them stays green', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    await initOk(dir, ['--qa'], machine.env);

    const pasted = [helperEntry(machine.root), readEntry(machine.root)];
    allowInProfile(dir, pasted);

    const before = await runCli(dir, ['doctor'], machine.env);
    assert.match(
      before.stdout,
      PLUGIN_PERMISSIONS_GRADED,
      `the fixture is not in the state this case is about - a green, graded check:\n${before.stdout}\n${before.stderr}`,
    );

    const { stdout } = await initOk(dir, ['--force'], machine.env);

    const allow = allowEntries(dir);
    for (const entry of pasted) {
      assert.ok(allow.includes(entry), `--force dropped ${entry}, which doctor told the adopter to paste`);
    }
    assert.ok(stdout.includes(CARRIED_NOTE), `the run does not say what it carried forward:\n${stdout}`);

    // The finding's owed demonstration, as an assertion: green before, green after.
    const after = await runCli(dir, ['doctor'], machine.env);
    assert.match(
      after.stdout,
      PLUGIN_PERMISSIONS_GRADED,
      `the check the adopter had already satisfied is failing after a forced regeneration:\n${after.stdout}\n${after.stderr}`,
    );
  });

  await t.test('an entry naming a root this machine does not record is dropped, and named', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    // A root that resolved on the machine this profile was written on and resolves on none now: the
    // install root carries the plugin version, so an upgrade leaves exactly this behind.
    const stale = await fixtureFor(subtest, { git: false });
    await initOk(dir, ['--qa'], machine.env);
    allowInProfile(dir, [helperEntry(stale)]);

    const { stderr } = await initOk(dir, ['--force'], machine.env);

    assert.ok(
      !allowEntries(dir).includes(helperEntry(stale)),
      'an entry naming a directory no root resolves was carried forward as if it still granted something',
    );
    assert.ok(stderr.includes(NOT_CARRIED_WARNING), `the run dropped the entry in silence:\n${stderr}`);
    assert.ok(stderr.includes(helperEntry(stale)), `the warning does not name the entry it dropped:\n${stderr}`);
    assert.match(stderr, ONE_ORPHAN_AGREES, `the warning's verb disagrees with the one entry it counted:\n${stderr}`);
  });

  await t.test('a read grant outside the checkout is dropped without a cause or a remedy it does not have', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    // The parity phase's own case: a Read over a reference implementation outside the checkout, which
    // no plugin upgrade stranded and `doctor`'s plugin-permissions check deliberately never names.
    const reference = await fixtureFor(subtest, { git: false });
    // In the same run, so the two classes are told apart rather than merely reported one at a time.
    const stale = await fixtureFor(subtest, { git: false });
    await initOk(dir, ['--qa'], machine.env);
    allowInProfile(dir, [readEntry(reference), helperEntry(stale)]);

    const { stderr } = await initOk(dir, ['--force'], machine.env);

    const allow = allowEntries(dir);
    assert.ok(!allow.includes(readEntry(reference)), 'this branch does not preserve non-plugin-root entries');
    assert.ok(!allow.includes(helperEntry(stale)), 'an entry naming a directory no root resolves was carried forward');

    // Each warning is one `! `-led block, body lines and all: the two are graded apart, because a
    // whole-stderr match would be satisfied by the other warning in the same run.
    const warnings = stderr.split(`\n${WARNING_MARK}`);
    const [reported = ''] = warnings.filter((block) => block.includes(readEntry(reference)));
    assert.ok(reported !== '', `the run dropped the read grant in silence:\n${stderr}`);
    assert.ok(
      !reported.includes('a plugin upgrade'),
      `the run blames a plugin upgrade for an entry no plugin root ever answered for:\n${reported}`,
    );
    assert.ok(
      !reported.includes('doctor'),
      `the run sends the adopter to a report that never names this entry:\n${reported}`,
    );
    assert.ok(reported.includes('add it back by hand'), `the run names no remedy at all:\n${reported}`);

    // The stale helper in the same run still gets the message that is true of it.
    const [stranded = ''] = warnings.filter((block) => block.includes(helperEntry(stale)));
    assert.ok(stranded.includes('a plugin upgrade'), `the stale helper lost its own diagnosis:\n${stderr}`);
    assert.ok(stranded.includes(NOT_CARRIED_WARNING), `the stale helper lost its own warning:\n${stderr}`);
  });

  await t.test('an entry carrying a quote is dropped and warned about, and the run still exits 0', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    await initOk(dir, ['--qa'], machine.env);
    // Under a root this machine does resolve, so nothing but the screen keeps it out - and it is the
    // shape `assertRunnable` exits EXIT.INTERNAL over.
    const mistyped = helperEntry(machine.root, 're"serve-qa-user.sh');
    allowInProfile(dir, [mistyped]);

    // initOk is the exit-status assertion: an adopter's typo may not be reported as this CLI's bug.
    const { stderr } = await initOk(dir, ['--force'], machine.env);

    assert.ok(!allowEntries(dir).includes(mistyped), 'an entry the permission guard can never match was carried forward');
    assert.ok(stderr.includes(NOT_CARRIED_WARNING), `the entry was left behind in silence:\n${stderr}`);
    assert.ok(stderr.includes('a double quote'), `the warning does not say what makes the entry unmatchable:\n${stderr}`);
  });

  await t.test('--dry-run reports the carry-forward in the conditional and writes nothing', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    await initOk(dir, ['--qa'], machine.env);
    // Both arms of the report in one preview: one entry a real run would carry, and one it would
    // leave behind. The drop is stated in the same conditional as the carry, or the preview claims
    // an action it did not take.
    const stale = await fixtureFor(subtest, { git: false });
    allowInProfile(dir, [helperEntry(machine.root), helperEntry(stale)]);
    const previewed = text(dir, PROFILE_FILE);

    const { stdout, stderr } = await initOk(dir, ['--force', '--dry-run'], machine.env);

    assert.equal(text(dir, PROFILE_FILE), previewed, 'a dry run rewrote the profile it was only previewing');
    assert.equal(await exists(dir, `${PROFILE_FILE}.bak`), false, 'a dry run took a backup, so it replaced something');
    assert.ok(stdout.includes(CARRIED_NOTE_DRY), `the preview does not report the carry-forward it would make:\n${stdout}`);
    assert.ok(
      !stdout.includes(CARRIED_NOTE),
      `a run that wrote nothing claims it carried the entries forward:\n${stdout}`,
    );
    assert.ok(
      stderr.includes(NOT_CARRIED_WARNING_DRY),
      `the preview does not report the drop it would make:\n${stderr}`,
    );
    assert.ok(
      !stderr.includes(`it was ${NOT_CARRIED_WARNING}`) && !stderr.includes(`they were ${NOT_CARRIED_WARNING}`),
      `a run that wrote nothing says the entry was already dropped:\n${stderr}`,
    );
  });

  await t.test('a profile with no plugin-root entry is regenerated byte for byte, and reported on not at all', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    // No record, so this machine resolves no root at all: the arm where the carry-forward has to be
    // invisible rather than merely correct.
    const machine = await pluginMachine(subtest, { record: false });
    await initOk(dir, ['--qa'], machine.env);
    const generated = text(dir, PROFILE_FILE);

    const { stdout, stderr } = await initOk(dir, ['--force'], machine.env);

    assert.equal(text(dir, PROFILE_FILE), generated, '--force changed a profile nothing was carried into');
    assert.ok(!stdout.includes(CARRIED_NOTE), `a run that carried nothing says it carried something:\n${stdout}`);
    assert.ok(!stderr.includes(NOT_CARRIED_WARNING), `a run with nothing to drop warned about a drop:\n${stderr}`);
  });

  /**
   * The arm above, with entries in it: a profile carrying real, current entries met by a shell that
   * resolves no plugin record. The suite's only zero-root case seeded none, so nothing drove the
   * branch where "no root answers for this entry" and "no root answered at all" are told apart — and
   * the second is the ordinary state the generator's own header names, `init` running before the
   * plugin is enabled among the ways in.
   */
  await t.test('with no root resolved at all, both dictated forms are carried forward unverified', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    await initOk(dir, ['--qa'], machine.env);
    // Both forms `doctor` dictates, pasted on its own instruction while the root still resolved.
    const pasted = [helperEntry(machine.root), readEntry(machine.root)];
    allowInProfile(dir, pasted);

    // The same repository, from a shell that reads no record of the plugin — and `init --force` is
    // what `profile-paths`, `profile-deny-floor` and the generator's own note prescribe for repairs
    // that have nothing to do with the plugin.
    const blind = await pluginMachine(subtest, { record: false });
    const { stdout, stderr } = await initOk(dir, ['--force'], blind.env);

    const allow = allowEntries(dir);
    for (const entry of pasted) {
      assert.ok(allow.includes(entry), `--force revoked ${entry} on the strength of a record it could not read`);
    }
    assert.ok(!stderr.includes(NOT_CARRIED_WARNING), `a run that graded nothing reports a drop:\n${stderr}`);
    assert.ok(!stderr.includes(UPGRADE_CAUSE), `a run that observed no root blames an upgrade it did not see:\n${stderr}`);
    assert.ok(!stderr.includes(BY_HAND_REMEDY), `a run that graded nothing says nothing re-derives a line doctor dictates:\n${stderr}`);
    assert.ok(stdout.includes(CARRIED_NOTE), `the run does not say what it carried forward:\n${stdout}`);
    assert.ok(stdout.includes(CARRIED_UNVERIFIED), `the run states an unverified carry as a verified one:\n${stdout}`);
    assert.ok(!stdout.includes(GRADED_CARRY), `the run claims roots it could not read:\n${stdout}`);
  });

  await t.test('--dry-run states the unverified carry-forward in the conditional and writes nothing', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    await initOk(dir, ['--qa'], machine.env);
    allowInProfile(dir, [helperEntry(machine.root), readEntry(machine.root)]);
    const previewed = text(dir, PROFILE_FILE);

    const blind = await pluginMachine(subtest, { record: false });
    const { stdout, stderr } = await initOk(dir, ['--force', '--dry-run'], blind.env);

    assert.equal(text(dir, PROFILE_FILE), previewed, 'a dry run rewrote the profile it was only previewing');
    assert.equal(await exists(dir, `${PROFILE_FILE}.bak`), false, 'a dry run took a backup, so it replaced something');
    assert.ok(stdout.includes(CARRIED_NOTE_DRY), `the preview does not report the carry-forward it would make:\n${stdout}`);
    assert.ok(stdout.includes(CARRIED_UNVERIFIED), `the preview states an unverified carry as a verified one:\n${stdout}`);
    assert.ok(!stdout.includes(CARRIED_NOTE), `a run that wrote nothing claims it carried the entries forward:\n${stdout}`);
    assert.ok(!stderr.includes(NOT_CARRIED_WARNING_DRY), `a preview that graded nothing reports a drop:\n${stderr}`);
  });

  await t.test('a resolved root still tells a dictated entry from one this generator does not preserve', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    // The parity phase's own case, beside an entry at a root that does resolve: the zero-root carry
    // may not leak onto the arm whose messages were reasoned about.
    const reference = await fixtureFor(subtest, { git: false });
    await initOk(dir, ['--qa'], machine.env);
    allowInProfile(dir, [helperEntry(machine.root), readEntry(reference)]);

    const { stdout, stderr } = await initOk(dir, ['--force'], machine.env);

    const allow = allowEntries(dir);
    assert.ok(allow.includes(helperEntry(machine.root)), 'an entry at a root this machine resolves was dropped');
    assert.ok(!allow.includes(readEntry(reference)), 'the zero-root carry-forward reached the arm that graded the entries');
    assert.ok(stderr.includes(BY_HAND_REMEDY), `the unpreserved grant lost its own remedy:\n${stderr}`);
    assert.ok(stdout.includes(GRADED_CARRY), `a run that resolved a root does not say so:\n${stdout}`);
    assert.ok(!stdout.includes(CARRIED_UNVERIFIED), `a run that graded the entries calls the carry unverified:\n${stdout}`);
  });
});

/** The switch under test, and the fragments of the two lines it adds to the run's report. */
const PLUGIN_ROOT_ENTRIES = '--plugin-root-entries';
const KEPT_NO_EFFECT = `${PLUGIN_ROOT_ENTRIES} had no effect`;
const INSTALL_STEP = 'claude plugin install';

/**
 * `init --plugin-root-entries`: the entries `doctor`'s `plugin-permissions` check dictates, written
 * into a profile this run generates — the remote job's route to a profile its own plugin install can
 * run under. Whether the render lands stays the write engine's `create-if-absent` answer.
 */
test('init --plugin-root-entries writes the plugin-root entries doctor dictates into a generated profile', async (t) => {
  await t.test('a first run writes them, and doctor then grades the profile green with no stray and no missing line', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);

    await initOk(dir, ['--qa', PLUGIN_ROOT_ENTRIES], machine.env);

    const allow = allowEntries(dir);
    assert.ok(allow.includes(helperEntry(machine.root)), `the helper entry at the planted root was not written:\n${allow.join('\n')}`);
    // The planted root is the install root, where doctor requires no read rule: the written set is
    // exactly the required set, which the graded pass below confirms from doctor's side.
    assert.ok(!allow.includes(readEntry(machine.root)), 'a read rule doctor does not require at the install root was written');
    const doctor = await runCli(dir, ['doctor'], machine.env);
    assert.match(doctor.stdout, PLUGIN_PERMISSIONS_GRADED, `doctor does not grade the written entries green:\n${doctor.stdout}`);
    assert.ok(!doctor.stdout.includes('dead weight'), `doctor names a stray entry the switch wrote:\n${doctor.stdout}`);
  });

  await t.test('without the switch no plugin-root entry is written', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);

    await initOk(dir, ['--qa'], machine.env);

    assert.ok(!allowEntries(dir).includes(helperEntry(machine.root)), 'an unswitched init wrote a plugin-root entry');
  });

  await t.test('over a kept profile it changes nothing and says so, in a real run and a dry run alike', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    await initOk(dir, ['--qa'], machine.env);
    const kept = text(dir, PROFILE_FILE);

    const real = await initOk(dir, [PLUGIN_ROOT_ENTRIES], machine.env);
    assert.equal(text(dir, PROFILE_FILE), kept, 'the switch changed a profile the write engine keeps');
    assert.ok(real.stdout.includes(KEPT_NO_EFFECT), `the run does not say the switch had no effect:\n${real.stdout}`);

    const dry = await initOk(dir, [PLUGIN_ROOT_ENTRIES, '--dry-run'], machine.env);
    assert.equal(text(dir, PROFILE_FILE), kept, 'a dry run changed the profile');
    assert.ok(dry.stdout.includes(KEPT_NO_EFFECT), `the preview does not say the switch would have no effect:\n${dry.stdout}`);
  });

  await t.test('with no root recorded it warns, names the install step, and writes the unswitched profile', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest, { record: false });
    await initOk(dir, ['--qa'], machine.env);
    const unswitched = text(dir, PROFILE_FILE);
    await rm(join(dir, PROFILE_FILE));

    const { stdout, stderr } = await initOk(dir, ['--qa', PLUGIN_ROOT_ENTRIES], machine.env);

    assert.ok(stderr.includes(PLUGIN_ROOT_ENTRIES) && stderr.includes(INSTALL_STEP), `no warning names the missing install:\n${stderr}`);
    assert.equal(text(dir, PROFILE_FILE), unswitched, 'the switch changed a profile it had no root to add to');
    assert.ok(!stdout.includes(KEPT_NO_EFFECT), `a freshly written profile is reported as kept:\n${stdout}`);
  });

  await t.test('--force over pasted entries leaves each line exactly once', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    const machine = await pluginMachine(subtest);
    await initOk(dir, ['--qa'], machine.env);
    allowInProfile(dir, [helperEntry(machine.root)]);

    await initOk(dir, ['--force', PLUGIN_ROOT_ENTRIES], machine.env);

    const allow = allowEntries(dir);
    assert.equal(
      allow.filter((entry) => entry === helperEntry(machine.root)).length,
      1,
      `the generated and the carried line were both written:\n${allow.join('\n')}`,
    );
  });
});

/** The two workflows remote execution runs on, as the adopter's repository names them. */
const WORKFLOW_RUN_FILE = '.github/workflows/harness-run.yml';
const WORKFLOW_RESUME_FILE = '.github/workflows/harness-resume.yml';

/** The shipped templates they are written from, read straight out of the package. */
const WORKFLOW_TEMPLATES = join(PACKAGE_ROOT, 'templates', 'github', 'workflows');

/** A `{{token}}` as the renderer defines one; a GitHub `${{ expr }}` never matches it. */
const RENDER_TOKEN = /\{\{[A-Za-z][A-Za-z0-9_]*\}\}/;

/** Turn remote execution on in a wired fixture, through the command an adopter uses. */
async function enableRemoteExecution(dir) {
  const result = await runCli(dir, ['config', 'set', 'execution.target', 'github-actions']);
  assert.equal(result.status, 0, `config set exited ${result.status}\n${result.stdout}\n${result.stderr}`);
}

test('the GitHub workflows arrive with execution.target github-actions, and only with it', async (t) => {
  await t.test('with no execution key init writes no .github path and names none', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });

    const { stdout } = await initOk(dir);

    assert.ok(!(await exists(dir, '.github')), 'init wrote a .github path with remote execution off');
    assert.ok(!stdout.includes('.github'), `the action log names a .github path:\n${stdout}`);
    assert.ok(!stdout.includes('--check-github'), `the report carries the remote-execution block:\n${stdout}`);
  });

  await t.test('turned on, init writes both files from their templates and reports the GitHub-side steps', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    await enableRemoteExecution(dir);

    const { stdout } = await initOk(dir);

    const version = readJson(join(PACKAGE_ROOT, 'package.json')).version;
    const runTemplate = readFileSync(join(WORKFLOW_TEMPLATES, 'harness-run.yml'), 'utf8');
    assert.ok(runTemplate.includes('{{cliVersion}}'), 'the run template no longer carries {{cliVersion}}');
    assert.equal(text(dir, WORKFLOW_RUN_FILE), runTemplate.replaceAll('{{cliVersion}}', version));
    assert.ok(!RENDER_TOKEN.test(text(dir, WORKFLOW_RUN_FILE)), 'a {{token}} survived into harness-run.yml');
    assert.equal(
      text(dir, WORKFLOW_RESUME_FILE),
      readFileSync(join(WORKFLOW_TEMPLATES, 'harness-resume.yml'), 'utf8'),
      'harness-resume.yml is not a verbatim copy of its template',
    );

    // The commit line is the one `docs/remote-execution.md` → `## 7. Turning it on` step 3 prints.
    for (const name of ['CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_API_KEY', 'doctor --check-github', 'git commit -m "Add the harness workflows"']) {
      assert.ok(stdout.includes(name), `the closing report does not name ${name}:\n${stdout}`);
    }
  });

  await t.test('a second init changes nothing, keeps an edited workflow, and --force replaces it after a .bak', async (subtest) => {
    const dir = await fixtureFor(subtest, { files: nodeProjectFiles() });
    await initOk(dir);
    await enableRemoteExecution(dir);
    await initOk(dir);
    const rendered = text(dir, WORKFLOW_RUN_FILE);

    const before = await snapshotTree(dir);
    const { stdout } = await initOk(dir);
    assert.deepEqual(await snapshotTree(dir), before, 'a second init changed the tree');
    assert.ok(!stdout.includes('--check-github'), `a re-run that kept both workflows printed the remote-execution block:\n${stdout}`);

    appendFileSync(join(dir, WORKFLOW_RUN_FILE), '# tuned by hand\n', 'utf8');
    const edited = text(dir, WORKFLOW_RUN_FILE);
    await initOk(dir);
    assert.equal(text(dir, WORKFLOW_RUN_FILE), edited, 'a plain re-run rewrote an edited workflow');
    assert.ok(!(await exists(dir, `${WORKFLOW_RUN_FILE}.bak`)), 'a plain re-run wrote a .bak');

    await initOk(dir, ['--force']);
    assert.equal(text(dir, `${WORKFLOW_RUN_FILE}.bak`), edited, 'the .bak does not hold the edited workflow');
    assert.equal(text(dir, WORKFLOW_RUN_FILE), rendered, '--force did not regenerate the workflow');
  });
});
