/**
 * The test harness: a throwaway fixture repository, subprocess runners for the built CLI and for
 * the scripts it writes, and a byte-level tree snapshot.
 *
 * **The rule this module exists to enforce: a test's repository is built by the test, lives under
 * `os.tmpdir()`, and is torn down in-process.** `init` is a writer aimed at a repository, so the
 * only honest way to test it is to give it a real one — and the only safe one is to give it a
 * repository that exists for the length of one test. Nothing here is committed, no repository is
 * shared between tests, and no fixture is ever created inside this checkout. The seeded template of
 * choice 5 is **never handed to a test**: every test still receives its own repository, a copy of it.
 *
 * The tests these helpers serve run against the **compiled** CLI at `dist/cli.js`, so
 * `npm run build` precedes `npm test`. {@link runCli} says so in its own refusal rather than
 * leaving a module-resolution error to explain it.
 *
 * `node --test test` treats every file beneath a directory named `test` as a test file, so this one
 * is loaded as a test file of its own and reported as a passing file with no tests in it. That is
 * why nothing here runs at import time: the module defines functions and resolves paths, and every
 * subprocess, temp directory and refusal happens inside a call a real test makes.
 *
 * ## Five non-obvious choices, and where each comes from
 *
 * 1. **The fixture directory is `realpath`-resolved.** `git rev-parse --show-toplevel` answers with
 *    the physical path, while `os.tmpdir()` is a symlink on macOS. Without this, every absolute path
 *    the CLI generates — the permission profile's `repoRoot`, its worktree glob — would be spelled
 *    differently from the path the test holds, and every comparison between them would fail for a
 *    reason that has nothing to do with the CLI.
 * 2. **Teardown is an in-process `fs.rm`, never a shelled-out recursive removal.** A user-level
 *    `permissions.deny` on the recursive-removal command is realistic, deny is evaluated before any
 *    allow and cannot be overridden, so a shelled-out teardown is silently blocked — which would
 *    leave a fixture behind on every run with no error to notice. That is the CLI's own standing
 *    rule (`cli.ts`'s header), and it holds for the tests too.
 * 3. **git runs with every configuration source it reads pointed away — the per-user file, the
 *    system file, and a bundled system configuration that neither redirect reaches.** A machine's
 *    own `init.defaultBranch` or `core.hooksPath` would otherwise decide what a test observes, so
 *    the same test would pass on one machine and fail on another for a reason no assertion names.
 *    This closes the git-**config** axis and only that one: which git version is installed, whether
 *    `jq` is on `PATH`, and whether the host schedules with launchd or with systemd all still reach
 *    these tests, so this is not a claim that they are host-independent.
 * 4. **Every subprocess resolves rather than throws on a non-zero exit.** Half the assertions here
 *    are about refusals, and a runner that threw on exit 1 would make the ordinary case the awkward
 *    one. A failure to spawn at all still rejects, because that is not a result the CLI produced.
 * 5. **The seeded repository is copied, not rebuilt.** Seeding one — {@link seedRepository} — is
 *    about fourteen git processes and ~100 ms of CPU-bound work, and across the suite that was ~42%
 *    of every git process it ran, all re-deriving one identical state. So each process seeds one
 *    template per `remote` variant, lazily on first use, and every fixture is an in-process copy of
 *    it, removed by `rmSync` on exit (choice 2). The one absolute path git stores in the copy is
 *    `remote.origin.url` in `.git/config`; it is rewritten to the fixture's own origin, and a copy
 *    in which it does not occur exactly once is refused rather than left pointing at a shared one.
 */

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readdir, readFile, lstat, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';

/** The CLI package root — this file compiles nowhere, so it is two levels above `test/helpers/`. */
export const PACKAGE_ROOT = resolve(import.meta.dirname, '..', '..');

/** The workspace root, holding the plugin and marketplace manifests a test reads names from. */
export const WORKSPACE_ROOT = dirname(PACKAGE_ROOT);

/** The compiled entry point every {@link runCli} invocation runs. */
export const CLI_ENTRY = join(PACKAGE_ROOT, 'dist', 'cli.js');

/** The temp-directory prefix, which is also the fixture's `projectName` stem in generated output. */
const FIXTURE_PREFIX = 'harness-fixture-';

/** The temp-directory prefix of a per-process template root (choice 5 in the module header). */
const TEMPLATE_PREFIX = 'harness-fixture-template-';

/**
 * The suffix the fixture's own `origin` is created under, as a sibling of the fixture directory.
 *
 * A **sibling** rather than a child: {@link snapshotTree} walks the fixture and excludes only
 * `.git`, so a bare repository inside it would appear in every byte-level comparison as a tree the
 * CLI is asserted not to have written. `mkdtemp` already made the fixture's own name unique, so a
 * suffix on it is unique too.
 */
const ORIGIN_SUFFIX = '-origin.git';

/** Excluded from every {@link snapshotTree}: git's own state changes without the CLI touching it. */
const DEFAULT_EXCLUDES = Object.freeze(['.git']);

/** Enough for an `init` run's action log, which is one line per written path. */
const MAX_BUFFER = 16 * 1024 * 1024;

/**
 * The environment every subprocess gets, over `process.env`.
 *
 * The three `GIT_CONFIG_*` values are choice 3 in the module header, and it takes three rather than
 * two. `/dev/null` is a readable, empty configuration file rather than a missing one, which is what
 * git wants for both redirects — but some git builds ship a **bundled** system configuration that
 * `GIT_CONFIG_SYSTEM` does not redirect at all, reachable only by suppressing the system scope
 * outright, and the `init.defaultBranch` such a build sets is `main`: the same string as the schema
 * default. Without that third value, a case on one of those hosts asserts that two coincidentally
 * equal values are equal, and would go on passing against detection that had stopped reading the
 * repository entirely.
 */
const ISOLATED_ENV = Object.freeze({
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_TERMINAL_PROMPT: '0',
});

/**
 * One finished subprocess: what it exited with, and what it said.
 *
 * @typedef {object} RunResult
 * @property {number} status exit code — `0` on success.
 * @property {string} stdout
 * @property {string} stderr
 */

/**
 * Run one command with an argv array — never a shell string — and resolve whatever it exited with.
 *
 * @param {string} command
 * @param {readonly string[]} args
 * @param {string} cwd
 * @param {Record<string, string>} [env] applied over the isolated environment, for a test whose
 *   subject is what the process finds around it — a `PATH` a tool does or does not resolve on.
 * @returns {Promise<RunResult>}
 */
function run(command, args, cwd, env = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const options = {
      cwd,
      encoding: 'utf8',
      maxBuffer: MAX_BUFFER,
      env: { ...process.env, ...ISOLATED_ENV, ...env },
    };
    execFile(command, [...args], options, (error, stdout, stderr) => {
      // A numeric `code` is an exit status the command chose; anything else — a spawn failure, a
      // signal — is not a result, so it stays an exception.
      if (error !== null && typeof error.code !== 'number') {
        rejectRun(error);
        return;
      }
      resolveRun({ status: error === null ? 0 : error.code, stdout, stderr });
    });
  });
}

/**
 * One git invocation inside a fixture, refused loudly when git itself refuses.
 *
 * Exported because a test that needs a *second checkout* has to build it the way an adopter does —
 * a commit and a `git worktree add` — rather than by hand-writing what one looks like. It runs with
 * the same isolated configuration every other subprocess here gets (choice 3 in the module header),
 * which a test issuing its own `execFile` would not.
 *
 * @param {string} cwd
 * @param {readonly string[]} args
 * @returns {Promise<RunResult>}
 */
export async function runGit(cwd, args) {
  const result = await run('git', args, cwd);
  if (result.status !== 0) {
    throw new Error(`fixture setup: \`git ${args.join(' ')}\` exited ${result.status}: ${result.stderr.trim()}`);
  }
  return result;
}

/**
 * Ask **git** which of `paths` its ignore rules exclude, and answer with that subset in the order
 * asked. The paths are pathnames rather than files: `check-ignore` matches the rules against a name,
 * so a run-control file a passing run never wrote is still answerable.
 *
 * `check-ignore` prints each path a rule matches and exits 1 when none does, so a rejection here is
 * the *empty answer* rather than a fault. Every other non-zero status is re-thrown — 128 for a path
 * outside the repository and 129 for a mistyped option are the two easy ones to produce, and reading
 * either as "not ignored" would turn a broken invocation into a passing assertion.
 *
 * `--no-index` asks about the ignore rules alone rather than about the rules plus whatever is
 * already tracked, which is the question these assertions are about.
 *
 * The `catch` arm reads {@link runGit}'s thrown message, so the two move together: a change to that
 * format here must be made in the same edit, or every git failure is read as "not ignored".
 *
 * @param {string} dir
 * @param {readonly string[]} paths
 * @returns {Promise<string[]>}
 */
export async function ignoredAmong(dir, paths) {
  try {
    const { stdout } = await runGit(dir, ['check-ignore', '--no-index', ...paths]);
    return stdout.split('\n').filter((line) => line !== '');
  } catch (error) {
    if (!/ exited 1:/.test(error.message)) throw error;
    return [];
  }
}

/**
 * The absolute path of a fixture-relative target, refused when it would land outside the fixture.
 *
 * The seed maps below are written by tests, not by an adopter, so this is a guard against a typo
 * rather than against an attacker — but the thing being guarded is a directory this module later
 * removes recursively, which is reason enough to check.
 */
function insideFixture(dir, relativePath) {
  const target = resolve(dir, relativePath);
  if (target !== dir && !target.startsWith(`${dir}${sep}`)) {
    throw new Error(`fixture setup: ${relativePath} resolves outside the fixture directory`);
  }
  return target;
}

/**
 * Give the fixture a real `origin`: a bare repository beside it, and `origin/<branch>` fetched into
 * this one — the state `doctor`'s `remote` check reads and `create-worktree.sh` branches from.
 *
 * **The branch is pushed without the fixture gaining a commit**, which is the whole difficulty: the
 * ordinary fixture is a repository between `git init` and its first commit — `init`'s own
 * first-commit behaviour is asserted over exactly that state — so there is no local branch to push.
 * `commit-tree` writes a commit object against the empty tree without touching `HEAD`, the index or
 * the working tree, and pushing that object to `refs/heads/<branch>` on the bare repository leaves
 * `refs/remotes/origin/<branch>` behind exactly as a fetch would. `HEAD` stays unborn, so every
 * assertion about the commit-less state is unaffected.
 *
 * `<branch>` is read off the unborn `HEAD` rather than chosen, so it is the same name `init`'s
 * detection reads from this checkout and writes into `defaultBranch`.
 *
 * @param {string} dir the fixture repository.
 * @returns {Promise<string>} the bare repository's path, for teardown.
 */
async function seedOrigin(dir) {
  const bare = `${dir}${ORIGIN_SUFFIX}`;
  await mkdir(bare, { recursive: true });
  await runGit(bare, ['init', '--bare', '--quiet']);
  await runGit(dir, ['remote', 'add', 'origin', bare]);

  const branch = (await runGit(dir, ['symbolic-ref', '--short', 'HEAD'])).stdout.trim();
  const tree = (await runGit(dir, ['hash-object', '-w', '-t', 'tree', '/dev/null'])).stdout.trim();
  const commit = (await runGit(dir, ['commit-tree', tree, '-m', 'origin seed'])).stdout.trim();
  await runGit(dir, ['push', '--quiet', 'origin', `${commit}:refs/heads/${branch}`]);

  return bare;
}

/**
 * Seed a fresh repository in `dir`: the one place the seeding sequence is written, used to build
 * each template (choice 5 in the module header) and by the suite proving a copy is equivalent.
 *
 * @param {string} dir an existing, empty directory.
 * @param {{ remote?: boolean }} [options] `true` also seeds the sibling `origin` ({@link seedOrigin}).
 * @returns {Promise<string | undefined>} the origin's path, or `undefined` without a remote.
 */
export async function seedRepository(dir, { remote = true } = {}) {
  await runGit(dir, ['init', '--quiet']);
  await runGit(dir, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(dir, ['config', 'user.name', 'Harness Fixture']);
  return remote ? seedOrigin(dir) : undefined;
}

/** `remote` → the memoized build of that variant's template. Empty until a fixture needs one. */
const templates = new Map();

/** Every template root this process built, removed on exit. */
const templateRoots = [];

/**
 * The seeded template for one `remote` variant, built on first call; every later caller —
 * concurrent ones included — awaits the same promise.
 *
 * @param {boolean} remote
 * @returns {Promise<{ repo: string, origin: string | undefined }>}
 */
function templateFor(remote) {
  if (!templates.has(remote)) {
    templates.set(remote, (async () => {
      const root = await realpath(await mkdtemp(join(tmpdir(), TEMPLATE_PREFIX)));
      if (templateRoots.length === 0) {
        process.once('exit', () => {
          for (const path of templateRoots) rmSync(path, { recursive: true, force: true });
        });
      }
      templateRoots.push(root);
      const repo = join(root, 'repo');
      await mkdir(repo);
      const origin = await seedRepository(repo, { remote });
      return { repo, origin };
    })());
  }
  return templates.get(remote);
}

/**
 * Copy the variant's template into `dir`, and its origin to `dir`'s own sibling, repointing
 * `remote.origin.url` at that sibling.
 *
 * @param {string} dir the fixture directory, existing and empty.
 * @param {boolean} remote
 * @returns {Promise<string | undefined>} the fixture's origin path, or `undefined` without a remote.
 */
async function copyTemplate(dir, remote) {
  const template = await templateFor(remote);
  await cp(template.repo, dir, { recursive: true });
  if (template.origin === undefined) return undefined;

  const origin = `${dir}${ORIGIN_SUFFIX}`;
  await cp(template.origin, origin, { recursive: true });
  const configPath = join(dir, '.git', 'config');
  const config = await readFile(configPath, 'utf8');
  const occurrences = config.split(template.origin).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `fixture setup: the template's origin path occurs ${occurrences} times in ${configPath}, expected exactly once`,
    );
  }
  await writeFile(configPath, config.replace(template.origin, origin), 'utf8');
  return origin;
}

/**
 * Build a throwaway repository under `os.tmpdir()` and return it with its teardown.
 *
 * @param {object} [options]
 * @param {Record<string, string | object>} [options.files] fixture-relative path → content. An
 *   object is serialized as JSON, so a seed manifest reads as one.
 * @param {readonly string[]} [options.dirs] fixture-relative directories to create, for the
 *   detection signals that are pure directory existence.
 * @param {boolean} [options.git] `false` seeds no repository at all — the one refusal that needs a
 *   directory git has never heard of.
 * @param {boolean} [options.remote] `false` leaves the repository with **no remote**, which is a
 *   state `doctor` fails: it is on by default so that the ordinary fixture is a repository a run
 *   could start in, and the negative case is built by turning it off rather than by unpicking one.
 *   Ignored when `git` is `false` — a directory git has never heard of has no remote to configure.
 * @returns {Promise<{ dir: string, cleanup: () => Promise<void> }>}
 */
export async function createFixture({ files = {}, dirs = [], git = true, remote = true } = {}) {
  const dir = await realpath(await mkdtemp(join(tmpdir(), FIXTURE_PREFIX)));
  /** @type {string | undefined} */
  let originDir;

  if (git) originDir = await copyTemplate(dir, Boolean(remote));

  for (const relativeDir of dirs) {
    await mkdir(insideFixture(dir, relativeDir), { recursive: true });
  }
  for (const [relativePath, content] of Object.entries(files)) {
    const target = insideFixture(dir, relativePath);
    await mkdir(dirname(target), { recursive: true });
    const text = typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`;
    await writeFile(target, text, 'utf8');
  }

  return {
    dir,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true });
      // In-process, one path at a time, for choice 2 in the module header — and unconditional in
      // shape so that a fixture built with no remote tears down through the same call.
      if (originDir !== undefined) await rm(originDir, { recursive: true, force: true });
    },
  };
}

/**
 * Run the built CLI against a fixture.
 *
 * @param {string} dir the fixture the command acts on, as its working directory.
 * @param {readonly string[]} [args]
 * @param {Record<string, string>} [env] applied over the isolated environment — a `doctor` check
 *   that asks what is on `PATH` is tested by giving the command a `PATH`, not by mocking one.
 * @returns {Promise<RunResult>}
 */
export async function runCli(dir, args = [], env = {}) {
  return runCliFrom(CLI_ENTRY, dir, args, env);
}

/**
 * Run a compiled CLI entry point that is **not** this package's own — a copy of `dist/` placed
 * under a package root a test built.
 *
 * Exported because one code path is keyed on this package's own manifest and no flag reaches it:
 * `generators/projectSettings.ts` resolves the marketplace slug from `repository.url`, so the arm
 * taken when that URL names no published account is only reachable by giving the run a manifest
 * that names none. Everything else is {@link runCli}'s — the isolated environment, the pipe on
 * stdin, and resolving rather than throwing on a non-zero exit.
 *
 * @param {string} entry the compiled `cli.js` to run, whose parent's parent is the package root.
 * @param {string} dir the fixture the command acts on, as its working directory.
 * @param {readonly string[]} [args]
 * @param {Record<string, string>} [env] applied over the isolated environment.
 * @returns {Promise<RunResult>}
 */
export async function runCliFrom(entry, dir, args = [], env = {}) {
  if (!existsSync(entry)) {
    throw new Error(
      `${entry} is missing. These tests run against the compiled CLI, so run \`npm run build\` before \`npm test\`.`,
    );
  }
  return run(process.execPath, [entry, ...args], dir, env);
}

/**
 * Run one of the shell scripts `init` wrote, from a directory the caller chooses.
 *
 * Exported because a wrapper's subject is what it *does* when it runs — which directory it ends up
 * in, what it hands its command, what it prints and what it exits with — and none of that is
 * reachable through {@link runCli}. The **cwd is a parameter rather than the fixture root** for the
 * same reason: a script that anchors itself is only distinguishable from one that inherits the
 * caller's directory when the two differ.
 *
 * @param {string} cwd the directory the script is invoked *from*, which is not where it must run.
 * @param {readonly string[]} args `bash`'s arguments — the script path, then the script's own.
 * @param {Record<string, string>} [env] applied over the isolated environment, for a script whose
 *   subject is what it passes on to its command.
 * @returns {Promise<RunResult>}
 */
export async function runBash(cwd, args, env = {}) {
  return run('bash', args, cwd, env);
}

/** A file's fingerprint: its permission bits and the digest of its bytes. */
async function fileEntry(path, mode) {
  const digest = createHash('sha256').update(await readFile(path)).digest('hex');
  return `${(mode & 0o777).toString(8)}:${digest}`;
}

/** Walk one directory into `into`, keyed by fixture-relative path with forward slashes. */
async function walk(root, current, into, exclude) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;

    const absolute = join(current, entry.name);
    const key = absolute.slice(root.length + 1).split(sep).join('/');

    if (entry.isDirectory()) {
      into[key] = 'dir';
      await walk(root, absolute, into, exclude);
    } else if (entry.isSymbolicLink()) {
      // Recorded rather than followed: nothing the CLI writes is a link, so one appearing is
      // itself the finding.
      into[key] = 'symlink';
    } else {
      into[key] = await fileEntry(absolute, (await lstat(absolute)).mode);
    }
  }
}

/**
 * A byte-level snapshot of a tree: fixture-relative path → fingerprint, sorted by path.
 *
 * Directories are entries of their own (`'dir'`), so a run that created an empty directory is
 * visible in a comparison rather than invisible in one. `.git` is excluded because git rewrites its
 * own state — an index, a reflog — for reasons that have nothing to do with what `init` wrote.
 *
 * @param {string} dir
 * @param {{ exclude?: readonly string[] }} [options]
 * @returns {Promise<Record<string, string>>}
 */
export async function snapshotTree(dir, { exclude = DEFAULT_EXCLUDES } = {}) {
  /** @type {Record<string, string>} */
  const entries = {};
  await walk(dir, dir, entries, new Set(exclude));
  return Object.fromEntries(Object.keys(entries).sort().map((key) => [key, entries[key]]));
}

/** Parse a JSON file, synchronously, because an assertion reads better than an await does. */
export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** `<cacheHome>/autonomous-sdlc-harness/retrieval`, as `machineCacheDir()` and `retrieval/runtime.ts` spell it. */
function retrievalCacheDir(cacheHome) {
  return join(cacheHome, 'autonomous-sdlc-harness', 'retrieval');
}

/**
 * The files an offline load of each model needs, restated from `cli/src/retrieval/models.ts` →
 * `MODEL_FILES` so the suites assert against the contract rather than the source.
 */
const RETRIEVAL_MODEL_FILES = Object.freeze({
  'Xenova/bge-small-en-v1.5': ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'],
  'Xenova/ms-marco-MiniLM-L-6-v2': ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'],
});

/**
 * The environment a retrieval verb runs offline under: the machine cache under `cacheHome`, and the
 * `hash-v1` stub models.
 *
 * @param {string} cacheHome
 * @returns {Record<string, string>}
 */
export function retrievalEnv(cacheHome) {
  return { XDG_CACHE_HOME: cacheHome, AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB: 'hash-v1' };
}

/**
 * Plant every model file as an empty file under `<cacheHome>/autonomous-sdlc-harness/retrieval/models`,
 * which the retrieval verbs check for even under the stub.
 *
 * @param {string} cacheHome
 * @returns {Promise<string[]>} the planted paths.
 */
export async function plantModelFiles(cacheHome) {
  const planted = [];
  for (const [modelId, files] of Object.entries(RETRIEVAL_MODEL_FILES)) {
    for (const file of files) {
      const target = join(retrievalCacheDir(cacheHome), 'models', modelId, file);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, '');
      planted.push(target);
    }
  }
  return planted;
}

/**
 * Plant the retrieval runtime under `<cacheHome>/autonomous-sdlc-harness/retrieval/runtime` as the
 * three things `retrievalRuntimeState()` tests: the CLI entry, that CLI's manifest at `version`, and a
 * manifest per optional peer of `cli/package.json`.
 *
 * This is how every retrieval-on `init` and `doctor` case stays offline: the runtime counts as
 * installed, so `setUpRetrieval` runs no `npm`.
 *
 * @param {string} cacheHome
 * @param {{ version?: string }} [options] defaults to `cli/package.json`'s version, read at call time.
 * @returns {Promise<string[]>} the planted paths, sorted, so a caller can prove no install added to them.
 */
export async function plantRetrievalRuntime(cacheHome, { version } = {}) {
  const manifest = readJson(join(PACKAGE_ROOT, 'package.json'));
  const modules = join(retrievalCacheDir(cacheHome), 'runtime', 'node_modules');
  const planted = [];
  const plant = async (target, text) => {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
    planted.push(target);
  };

  await plant(join(modules, 'autonomous-sdlc-harness', 'dist', 'cli.js'), 'process.exit(0);\n');
  await plant(
    join(modules, 'autonomous-sdlc-harness', 'package.json'),
    `${JSON.stringify({ version: version ?? manifest.version })}\n`,
  );
  for (const name of Object.keys(manifest.peerDependencies ?? {})) {
    if (manifest.peerDependenciesMeta?.[name]?.optional !== true) continue;
    await plant(join(modules, name, 'package.json'), '{}\n');
  }
  return planted.sort();
}

/**
 * Write a valid `harness.config.json` into `dir` with retrieval on: `phases.docs` true, `docs.root`
 * `docs`, and one catch-all layer whose conventions document is `conventions.md`.
 *
 * @param {string} dir
 * @returns {Promise<void>}
 */
export async function writeRetrievalConfig(dir) {
  const config = {
    version: 1,
    defaultBranch: 'main',
    stateDir: 'sdlc-harness',
    layers: [{ name: 'general', path: '.', conventions: 'conventions.md' }],
    commands: { typecheck: 'echo typecheck', test: 'echo test' },
    phases: { docs: true },
    docs: { root: 'docs', retrieval: true },
  };
  await writeFile(insideFixture(dir, 'harness.config.json'), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}
