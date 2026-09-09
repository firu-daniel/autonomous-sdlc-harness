/**
 * `daemon` — the two unit templates, the refusals, and what a dry run reports.
 *
 * **The rule these tests exist to enforce: nothing here loads, starts or stops a real background
 * service.** A test that bootstrapped a launchd agent would install a unit into the account running
 * the suite, restart it forever, and leave it behind when the test failed — so the lifecycle calls
 * are exercised only through `--dry-run`, which computes against the real host and runs nothing. The
 * one thing a service manager is asked for is which one this host has, and that answer comes from
 * the command's own detection rather than from a second copy of it here.
 *
 * That rule is why one documented behaviour has no case here: a second `install` against an agent
 * already loaded exits non-zero and names `daemon stop` as the recovery (`docs/cli.md` §9), and the
 * only way to reach that state is to load an agent first. Asserting it would cost exactly the
 * leftover background service this file exists to prevent, so it is verified by hand and documented
 * rather than automated. The second arm of that refusal — the one naming the running daemon, the
 * unit file and the `.bak` as three answers about the `PATH`, when the refused install had also
 * replaced the unit — is reached only from the same loaded agent, and is exempt for the same reason.
 *
 * That same answer is why the unit **rendering** is tested through the compiled renderer instead of
 * through the CLI: a host has one service manager, and both templates have to be right on either
 * one. `renderUnit` takes the backend as an argument, so both can be rendered anywhere — which is
 * what makes this file's core assertions platform-independent rather than macOS-shaped.
 *
 * These run against the **compiled** CLI, so `npm run build` precedes `npm test`.
 *
 * ## Five non-obvious choices, and where each comes from
 *
 * 1. **The refusal a missing watcher produces is asserted against the backend this host has.** The
 *    watcher probe runs *after* the backend check, so on a host with no service manager the refusal
 *    is the earlier one — and asserting the message the developer's machine happens to produce would
 *    make the suite fail somewhere else for a reason that is not a defect. Reaching the watcher
 *    refusal at all now takes a deliberate deletion, since `init` writes the watcher: the fixture
 *    removes the file it was just given, which is one of the two states the refusal names.
 * 2. **"Writes nothing" is checked on both sides of the boundary**: the fixture tree is snapshotted,
 *    *and* every path outside it the run could have reached is checked for absence. What this CLI
 *    writes outside the repository it was aimed at is a small enumerated set — the unit file, the
 *    machine registry `repos.json` this command's `install` records the repository in, and the
 *    `push.env` `init --notifications` writes — so a snapshot of the repository alone would prove
 *    the half that was never in doubt, which is why *each* of those paths is asserted rather than
 *    only the tree. Every case that could reach one points the XDG base variable, and `HOME` where
 *    a unit directory is involved, at a throwaway directory: otherwise a wrong answer would land on
 *    the machine running the suite instead of on the fixture.
 * 3. **The label and the unit file name are spelled out here** rather than taken from `renderUnit`'s
 *    own return. Comparing generated output against the code that generated it proves only
 *    self-consistency; these two strings are what an operator types to address the service by hand,
 *    so they are the contract and are written as literals. Since decision 21 the label's variable
 *    half is a slug of the repository's own path, and a fixture's path is a random temp directory —
 *    so the *derivation* is pinned by {@link IDENTITY_CASES}, a table of literal path → slug pairs,
 *    and only the tests whose repository is a real fixture compose their expectation from
 *    `repoSlug`. Those two are not circular together: the table fixes what the derivation is. The
 *    same reasoning admits the one assertion here that is neither a literal nor a derivation — a
 *    rendered plist's comments are *parsed*, because that property is the file format's own rule
 *    and nothing else in the package enforces it: `doctor` reads installed units with regular
 *    expressions by deliberate choice, and Apple's own linters accept a comment holding a `--`.
 * 4. **The shell half of that derivation is compared against this one, in a subprocess.**
 *    `hr_repo_slug` in the generated `scripts/lib/harness-run-lib.sh` keys the watcher, the notifier
 *    and the machine-level usage lane on the same slug this daemon's label carries, and nothing but
 *    a test that runs both can stop the two implementations drifting apart. It is the reason the
 *    table above is a table: every row is put through both halves.
 * 5. **The cases that exercise a *real* install stub the service manager rather than skip.** An
 *    install on a launchd host ends in a `launchctl bootstrap`, which is exactly the background
 *    service the rule above forbids leaving behind — and on a host with no service manager the
 *    install refuses before it reaches the registration those cases are about, so a `NO_BACKEND`
 *    skip would leave the behaviour untested on both kinds of machine. {@link stubbedMachine} puts
 *    a `launchctl` and a `systemctl` that answer everything and do nothing first on `PATH`, and
 *    points `HOME` and `XDG_STATE_HOME` at throwaway directories. Detection still chooses the
 *    backend, the unit is really rendered and really written, the registry is really updated, and
 *    the one thing that does not happen is a service manager being asked to load a job. It is the
 *    same discipline as giving a `doctor` check a `PATH` instead of mocking one, and it is only
 *    available because this CLI shells nothing out: every external call is an argument vector, so a
 *    file on `PATH` is the whole of what has to be substituted.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { delimiter, dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { createFixture, readJson, runCli, snapshotTree, PACKAGE_ROOT } from './helpers/fixture.mjs';

/** A compiled module of the CLI, imported for the answers a subprocess cannot be asked for. */
async function loadCompiled(relativePath) {
  const path = join(PACKAGE_ROOT, 'dist', relativePath);
  if (!existsSync(path)) {
    throw new Error(
      `${path} is missing. These tests run against the compiled CLI, so run \`npm run build\` before \`npm test\`.`,
    );
  }
  return import(pathToFileURL(path).href);
}

const { detectBackend } = await loadCompiled('daemon/backend.js');
const { renderUnit, repoSlug } = await loadCompiled('daemon/units.js');

/** What this host can install a daemon into, from the same detection the command uses. */
const BACKEND = detectBackend();

/** A reason string when this host has no service manager at all, and `false` when it has one. */
const NO_BACKEND = BACKEND.kind === 'none' ? `this host has no service manager: ${BACKEND.reason}` : false;

/** A watcher outside `scriptsDir`, so `--watcher` can be shown pointing somewhere else entirely. */
const FIXTURE_WATCHER = 'tools/fixture-watcher.sh';

/**
 * Where `init` writes the run watcher, spelled as a literal for the reason in the module header:
 * the schema's default `scriptsDir` and the watcher's file name are the contract the daemon resolves,
 * and re-deriving them from the CLI's own tables would prove only that it agrees with itself.
 */
const WATCHER_IN_REPO = 'scripts/autonomous-watcher.sh';

/** Where `init` writes the shell half of the slug derivation, under the default `scriptsDir`. */
const LIB_IN_REPO = 'scripts/lib/harness-run-lib.sh';

/** The fixed halves of the two identities — everything about them that is not the repository. */
const LAUNCHD_LABEL_PREFIX = 'com.autonomous-sdlc-harness.watcher.';
const SYSTEMD_UNIT_PREFIX = 'harness-watcher@';
const SYSTEMD_UNIT_SUFFIX = '.service';

/** Everything a label may be made of, so a service manager can be asked for it by name. */
const LABEL_CHARSET = /^[a-z0-9.@_-]+$/;

/**
 * Where the machine registry resolves under `XDG_STATE_HOME`, and the version it carries.
 *
 * Spelled out here rather than imported from `machine/registry.js` for the reason choice 3 gives for
 * the label: this is the published format (`docs/watcher.md` §7), so a reader of a hand-seeded
 * fixture below is reading the contract, not a restatement of the code that has to satisfy it.
 */
const MACHINE_DIR = 'autonomous-sdlc-harness';
const REGISTRY_FILE = 'repos.json';
const REGISTRY_SCHEMA = 1;

/** A service manager that answers every probe and does nothing at all — choice 5. */
const STUB_TOOL = '#!/bin/sh\nexit 0\n';

/** The two the detection asks for. Both are stubbed, so one stub serves either kind of host. */
const STUBBED_TOOLS = ['launchctl', 'systemctl'];

/**
 * The derivation itself, as literal path → slug pairs. Every row is put through both the CLI's
 * `repoSlug` and the shell's `hr_repo_slug`, which is what makes this the definition rather than a
 * restatement of either implementation.
 *
 * The last two rows are the ones a hand-written implementation gets wrong: truncation keeps the
 * **tail** and happens **last**, so a truncated slug may open with the `-` that a strip step would
 * have removed had it run afterwards; and the case fold is ASCII-only, so an accented letter is a
 * separator like any other rather than the letter it resembles.
 */
const IDENTITY_CASES = [
  { repoRoot: '/Users/Ada/Work/Analytical Engine', slug: 'users-ada-work-analytical-engine' },
  { repoRoot: '/srv/Répertoire de travail/repo', slug: 'srv-r-pertoire-de-travail-repo' },
  {
    repoRoot: '/a/very/long/path/that/definitely/exceeds/the/sixty/four/character/limit/for/slugs/here',
    slug: 'definitely-exceeds-the-sixty-four-character-limit-for-slugs-here',
  },
  { repoRoot: `/${'b'.repeat(20)}/${'c'.repeat(63)}`, slug: `-${'c'.repeat(63)}` },
];

/** A repository whose stack detection resolves every command, plus a watcher `--watcher` can name. */
function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
    [FIXTURE_WATCHER]: '#!/bin/bash\necho fixture watcher\n',
  };
}

/** Build a fixture, register its teardown against the test, wire it with `init`, and return it. */
async function wiredFixture(t) {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);

  const result = await runCli(fixture.dir, ['init']);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return fixture.dir;
}

/** A throwaway directory outside every repository, torn down with the test that asked for one. */
async function throwaway(t) {
  const fixture = await createFixture({ git: false });
  t.after(fixture.cleanup);
  return fixture.dir;
}

/**
 * A throwaway `XDG_STATE_HOME`, and where the registry resolves under it.
 *
 * **Every case below that could touch the registry passes this**, including the ones asserting that
 * nothing was written: a case that forgot it would read — or on a defect, write — the registry of
 * the account running the suite, which is the machine's own record of its real daemons.
 */
async function machineState(t) {
  const state = await throwaway(t);
  return { registry: join(state, MACHINE_DIR, REGISTRY_FILE), env: { XDG_STATE_HOME: state } };
}

/**
 * A machine to install into that is not the one running the suite — choice 5.
 *
 * `HOME` decides where the unit directory is, `XDG_STATE_HOME` where the registry is, and the first
 * `PATH` entry holds a service manager that answers and does nothing. The three together are what
 * make a real `daemon install` in these tests write two throwaway files and load no job.
 */
async function stubbedMachine(t) {
  const machine = await machineState(t);
  const home = await throwaway(t);
  const tools = await throwaway(t);

  for (const tool of STUBBED_TOOLS) {
    const path = join(tools, tool);
    await writeFile(path, STUB_TOOL, 'utf8');
    await chmod(path, 0o755);
  }

  return {
    registry: machine.registry,
    env: { ...machine.env, HOME: home, PATH: `${tools}${delimiter}${process.env.PATH ?? ''}` },
  };
}

/**
 * Finding 51's state on a stubbed machine: a real install, and then its unit file deleted by hand.
 *
 * **One half of that finding's premise is declared rather than faked.** The agent is never loaded —
 * the module header forbids it — so what these cases measure is the command's own decision and the
 * target it addresses, not what a service manager answers about a job that is really running. The
 * other half is reproduced exactly: the unit file is gone while the label it was installed under is
 * still the string an operator would type, which is the state deleting a unit file by hand produces
 * (`docs/cli.md` §9: this CLI removes no path).
 *
 * The backend is read off the install's own report rather than taken from {@link BACKEND}, in the
 * pattern the registration case uses: the stubbed `PATH` is what decides it.
 */
async function deletedUnitState(t) {
  const dir = await wiredFixture(t);
  const machine = await stubbedMachine(t);

  const installed = await runCli(dir, ['daemon', 'install'], machine.env);
  assert.equal(
    installed.status,
    0,
    `daemon install exited ${installed.status}\n${installed.stdout}\n${installed.stderr}`,
  );

  const unitPath = reported(installed.stdout, 'unit: ');
  const kind = reported(installed.stdout, 'backend: ').split(' ')[0];
  assert.ok(existsSync(unitPath), `the install did not write the unit to ${unitPath}`);

  await rm(unitPath);
  return { dir, machine, unitPath, kind, label: labelFor(kind, repoSlug(dir)) };
}

/**
 * Write a registry by hand, in the published shape.
 *
 * "By hand" is the point: an entry no `daemon install` produced is how the states an install cannot
 * reach — a root that has been deleted — are put in front of the reader that grades them.
 */
async function seedRegistry(machine, repos) {
  await mkdir(dirname(machine.registry), { recursive: true });
  await writeFile(machine.registry, `${JSON.stringify({ schema: REGISTRY_SCHEMA, repos }, null, 2)}\n`, 'utf8');
}

/** One registry row, with the fields `docs/watcher.md` §7 says it carries and nothing else. */
function entryFor(root, { label = 'com.autonomous-sdlc-harness.watcher.seeded', unitPath, backend = 'launchd' }) {
  return { root, projectName: 'seeded-project', label, backend, unitPath, registered_at: 1786575259 };
}

/** The line of a listing that describes one slug, or `undefined` when it was not listed. */
function rowFor(stdout, slug) {
  return stdout.split('\n').find((line) => line.includes(` ${slug}  `));
}

/** What a command reported for one of its labelled lines — `unit: `, `label: `, `backend: `. */
function reported(stdout, prefix) {
  const line = stdout.split('\n').find((candidate) => candidate.startsWith(prefix));
  return line === undefined ? undefined : line.slice(prefix.length);
}

/** A toolchain directory a re-install adds or drops: one entry, in front of everything else. */
const EXTRA_TOOLCHAIN = '/opt/fixture-toolchain/bin';

/**
 * The entries one stream reports on one side of a `PATH` delta — `+` for what the install adds,
 * `-` for what it drops.
 *
 * The reporter's `!` marker is stripped first, so a removal on stderr reads the way an addition on
 * stdout does. The two-space indent is part of the line rather than decoration: an `ok()` line also
 * opens with a `+` at column 0, and a filter that ignored the indent would count `+ registered …`
 * as an added `PATH` entry.
 */
function deltaEntries(text, sign) {
  const prefix = `  ${sign} `;
  return text
    .split('\n')
    .map((line) => (line.startsWith('! ') ? line.slice(2) : line))
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length));
}

/**
 * What the run's action log says it did to the unit file, or `undefined` when it names no such line.
 *
 * The path is matched **absolute**: the unit is the plan's `allowOutsideRepo` write, so the engine
 * names it in full rather than repo-relative. The label is read off the line rather than inferred
 * from the marker, since `created` and `replaced` share one.
 */
function actionFor(stdout, path) {
  for (const line of stdout.split('\n')) {
    const match = /^[+~=] (created|merged|kept|ensured|replaced|would [a-z]+) {2,}(.*)$/.exec(line);
    if (match !== null && match[2].split(' (')[0] === path) return match[1];
  }
  return undefined;
}

/** What the service manager calls this repository's daemon — the string an operator types. */
function labelFor(kind, slug) {
  return kind === 'launchd'
    ? `${LAUNCHD_LABEL_PREFIX}${slug}`
    : `${SYSTEMD_UNIT_PREFIX}${slug}${SYSTEMD_UNIT_SUFFIX}`;
}

/** The unit file's name inside the backend's user-unit directory. */
function unitFileNameFor(kind, slug) {
  const label = labelFor(kind, slug);
  return kind === 'launchd' ? `${label}.plist` : label;
}

/**
 * What a `stop` reports having driven, and what its dry run reports it would drive — per backend.
 *
 * Composed from the label rather than matched by pattern, for the reason choice 3 gives: this is the
 * line an operator reads off a terminal. launchd is driven, so the real run carries the exit status
 * the tool answered with; systemd is instructed, so both runs print the same one line.
 */
function stopLinesFor(kind, label) {
  if (kind === 'systemd') {
    const instruction = `systemctl --user stop ${label}`;
    return { driven: instruction, planned: instruction };
  }
  const line = `launchctl bootout gui/${process.getuid()}/${label}`;
  return { driven: `${line} — exit 0`, planned: `would run: ${line}` };
}

/** Enough of a configuration for a renderer that reads two keys off it. */
function renderConfig(overrides) {
  return { projectName: 'fixture-project', stateDir: 'sdlc-harness/', ...overrides };
}

/**
 * A `PATH` for a rendered unit: a toolchain directory the service manager's own defaults do not
 * hold, in front of two that they do — the shape of the value this key exists to carry.
 */
const FIXTURE_ENV_PATH = '/opt/homebrew/bin:/usr/bin:/bin';

/**
 * Render one backend's unit for a repository path, against a unit directory of the test's own.
 *
 * `envPath` is read by key presence rather than by a destructuring default, because an explicit
 * `undefined` — a shell with no `PATH` — is one of the cases under test and a default would swallow
 * it into the opposite one.
 */
function unitFor(kind, repoRoot, options = {}) {
  const { config = renderConfig(), unitDir = '/unit-dir' } = options;
  const envPath = 'envPath' in options ? options.envPath : FIXTURE_ENV_PATH;
  return renderUnit({
    backend: { kind, reason: `${kind}, as this test asked for`, unitPath: unitDir },
    config,
    repoRoot,
    watcherPath: `${repoRoot}/${WATCHER_IN_REPO}`,
    envPath,
  });
}

/**
 * The interior of every `<!-- … -->` block in a rendered unit, asserting on the way that each opener
 * closes — an unclosed comment is its own malformation and must not read as "no blocks found".
 *
 * A scan rather than a parser, and no subprocess: Node ships no XML parser, and the linters that do
 * exist accept exactly the defect this looks for (`plutil -lint` answers `OK` on a plist whose
 * comment carries a `--`), so a case shelling out to one would pass on it.
 */
function commentBlocks(text) {
  const interiors = [];
  let open = text.indexOf('<!--');
  while (open !== -1) {
    const close = text.indexOf('-->', open + 4);
    assert.notEqual(close, -1, `a comment is opened and never closed:\n${text.slice(open)}`);
    interiors.push(text.slice(open + 4, close));
    open = text.indexOf('<!--', close + 3);
  }
  return interiors;
}

/**
 * Ask the shell half for a path's slug, by sourcing the library the fixture was given.
 *
 * The two paths go in as positional parameters rather than interpolated into the command string:
 * two of {@link IDENTITY_CASES}' rows carry a space, and one carries a character no quoting story
 * should have to be trusted with.
 */
function shellSlug(libPath, repoRoot) {
  return new Promise((resolve, reject) => {
    const script = '. "$1" || exit 90; hr_repo_slug "$2"';
    execFile('bash', ['-c', script, 'bash', libPath, repoRoot], { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error !== null && typeof error.code !== 'number') reject(error);
      else resolve({ status: error === null ? 0 : error.code, stdout: stdout.trim(), stderr });
    });
  });
}

test('install refuses once the watcher init wrote has been deleted', async (t) => {
  const dir = await wiredFixture(t);

  // The premise, stated rather than assumed: `init` wrote the watcher, so this refusal is reached
  // only by removing it — which is the first of the two states the refusal's sentence names.
  const watcher = join(dir, WATCHER_IN_REPO);
  assert.ok(existsSync(watcher), `init did not write the run watcher to ${WATCHER_IN_REPO}`);
  await rm(watcher);

  const { status, stderr } = await runCli(dir, ['daemon', 'install']);

  // Choice 1: the watcher probe runs after the backend check, so a host with neither refuses
  // earlier, with a different condition and a different remedy.
  const [condition, remedy] =
    NO_BACKEND === false
      ? [new RegExp(`no run watcher at ${watcher}`), /--watcher/]
      : [/no service manager to install the run daemon into/, /adapt the systemd user-unit template/];

  assert.equal(status, 1);
  assert.match(stderr, condition);
  assert.match(stderr, remedy);
});

test('a dry-run install reports the unit path, the label and the repository\'s own watcher, and writes nothing', { skip: NO_BACKEND }, async (t) => {
  const dir = await wiredFixture(t);
  const machine = await machineState(t);
  const before = await snapshotTree(dir);

  const { status, stdout, stderr } = await runCli(dir, ['daemon', 'install', '--dry-run'], machine.env);

  assert.equal(status, 0, `daemon install --dry-run exited ${status}\n${stdout}\n${stderr}`);

  // The three values an operator needs to address the service by hand, compared whole rather than by
  // pattern: a path is full of characters a regular expression would read as syntax. The watcher is
  // the one that says where the program came from — under this repository, not under the package the
  // CLI was run from, which is what keeps an `npx` cache directory out of a unit's `ExecStart`.
  const slug = repoSlug(dir);
  const unitPath = join(BACKEND.unitPath, unitFileNameFor(BACKEND.kind, slug));
  const watcherPath = join(dir, WATCHER_IN_REPO);
  const lines = stdout.split('\n');
  assert.ok(lines.includes(`unit: ${unitPath}`), `no line reports the unit path ${unitPath}:\n${stdout}`);
  assert.ok(lines.includes(`label: ${labelFor(BACKEND.kind, slug)}`), `no line reports the label:\n${stdout}`);
  assert.ok(lines.includes(`watcher: ${watcherPath}`), `no line reports the watcher ${watcherPath}:\n${stdout}`);

  // The registration is reported rather than made. `upsertRepository` is not on the write plan and
  // writes when it is called (`machine/registry.ts`), so this is the case that proves the caller
  // holds the `--dry-run` line the engine holds for everything else it writes.
  assert.ok(
    lines.includes(`would register ${dir} in ${machine.registry}`),
    `no line reports the registration that would be made in ${machine.registry}:\n${stdout}`,
  );

  // Every side of the boundary — choice 2 in the module header.
  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote into the repository');
  assert.equal(existsSync(unitPath), false, '--dry-run installed the unit file it was only asked to describe');
  assert.equal(existsSync(machine.registry), false, '--dry-run created the registry it was only asked to describe');
});

test('--watcher overrides the resolved path, and is what the unit would run', { skip: NO_BACKEND }, async (t) => {
  const dir = await wiredFixture(t);
  const override = join(dir, FIXTURE_WATCHER);

  const { status, stdout, stderr } = await runCli(dir, ['daemon', 'install', '--watcher', override, '--dry-run']);

  assert.equal(status, 0, `daemon install --dry-run exited ${status}\n${stdout}\n${stderr}`);
  const lines = stdout.split('\n');
  assert.ok(lines.includes(`watcher: ${override}`), `--watcher was not the path reported:\n${stdout}`);
  assert.ok(
    !lines.includes(`watcher: ${join(dir, WATCHER_IN_REPO)}`),
    `the override was reported alongside the resolved path:\n${stdout}`,
  );
});

test('both unit templates render with the resolved watcher path and no token left in them', async (t) => {
  const dir = await wiredFixture(t);
  const config = readJson(join(dir, 'harness.config.json'));
  const watcherPath = join(dir, FIXTURE_WATCHER);

  for (const kind of ['launchd', 'systemd']) {
    await t.test(kind, () => {
      // The unit directory is the fixture's own, so nothing is rendered against the account's real
      // one; only the file name and the text are this renderer's answer.
      const unitDir = join(dir, 'units');
      const unit = renderUnit({
        backend: { kind, reason: `${kind}, as this test asked for`, unitPath: unitDir },
        config,
        repoRoot: dir,
        watcherPath,
        envPath: FIXTURE_ENV_PATH,
      });

      assert.equal(unit.label, labelFor(kind, repoSlug(dir)));
      assert.equal(unit.targetPath, join(unitDir, unitFileNameFor(kind, repoSlug(dir))));

      // The program the service runs, the directory it runs in, and where its output goes: the
      // three values that make the unit describe this repository rather than a template.
      assert.ok(unit.text.includes(watcherPath), `the ${kind} unit does not name the watcher it would run`);
      assert.ok(unit.text.includes(dir), `the ${kind} unit does not name the repository it would run in`);
      assert.ok(unit.text.includes(join(dir, 'sdlc-harness')), `the ${kind} unit does not name the artifact tree`);
      assert.ok(!unit.text.includes('{{'), `the ${kind} unit still carries an unsubstituted token`);
    });
  }
});

test('a checkout path with a space, a % or a quote is escaped for the directive it lands in', () => {
  // A path that is hostile to systemd in all three ways at once: the space splits `ExecStart=`, the
  // `%` introduces a specifier in every directive rendered here, and the quote ends the quoting the
  // template applies. An unescaped unit installs, starts, fails, and under `Restart=always` retries
  // forever — a service manager will not tell the operator which of the three did it.
  const repoRoot = '/home/ada/100% mine/my "repo"';
  const watcherPath = `${repoRoot}/${WATCHER_IN_REPO}`;
  const systemd = unitFor('systemd', repoRoot, { unitDir: '/home/ada/.config/systemd/user' });
  const directive = (name) => systemd.text.split('\n').find((line) => line.startsWith(`${name}=`));

  assert.equal(directive('ExecStart'), 'ExecStart=/bin/bash "/home/ada/100%% mine/my \\"repo\\"/scripts/autonomous-watcher.sh"');
  assert.equal(directive('WorkingDirectory'), 'WorkingDirectory=/home/ada/100%% mine/my "repo"');
  assert.equal(directive('StandardOutput'), 'StandardOutput=append:/home/ada/100%% mine/my "repo"/sdlc-harness/autonomous_logs/watcher.out.log');

  // And nowhere in the unit's directives is a lone `%` left — the comment block is exempt because
  // systemd never expands one, and it documents the `%i` this design does not use.
  const directives = systemd.text.split('\n').filter((line) => /^[A-Za-z]+=/.test(line));
  const lone = directives.filter((line) => line.replaceAll('%%', '').includes('%'));
  assert.deepEqual(lone, [], 'a directive carries an unescaped specifier introducer');

  // The plist takes the same path literally: XML escaping is the only escaping it needs, and a
  // systemd escape reaching it would put `%%` and a backslash into the path launchd runs.
  const launchd = unitFor('launchd', repoRoot, { unitDir: '/Users/ada/Library/LaunchAgents' });
  assert.ok(launchd.text.includes(`<string>${watcherPath}</string>`), 'the plist does not carry the watcher path verbatim');
  assert.ok(!launchd.text.includes('%%'), 'a systemd escape reached the plist');
});

test('both units carry the PATH they were rendered with, and neither carries an empty one', () => {
  const repoRoot = '/Users/ada/Work/checkout';

  // The key, in each backend's own spelling — literals rather than a regex, because these two lines
  // are what an operator reads out of an installed unit when a run fails on `command not found`.
  const launchd = unitFor('launchd', repoRoot, { unitDir: '/Users/ada/Library/LaunchAgents' });
  assert.ok(
    launchd.text.includes(`<key>EnvironmentVariables</key>`),
    'the plist carries no environment key, so the agent runs on launchd\'s four default directories',
  );
  assert.ok(
    launchd.text.includes(`<key>PATH</key>\n    <string>${FIXTURE_ENV_PATH}</string>`),
    `the plist does not carry the PATH it was rendered with:\n${launchd.text}`,
  );
  assert.equal(launchd.envPath, FIXTURE_ENV_PATH, 'the render reported a PATH other than the one in its text');

  const systemd = unitFor('systemd', repoRoot, { unitDir: '/home/ada/.config/systemd/user' });
  assert.ok(
    systemd.text.split('\n').includes(`Environment="PATH=${FIXTURE_ENV_PATH}"`),
    `the systemd unit does not carry the PATH it was rendered with:\n${systemd.text}`,
  );
  assert.equal(systemd.envPath, FIXTURE_ENV_PATH);

  // Empty and absent are one answer, and it is **no key** rather than a key holding nothing: a
  // `PATH=""` overrides the service manager's own directories with nothing, which is strictly worse
  // than the default it replaces.
  for (const envPath of ['', '   ', undefined]) {
    for (const kind of ['launchd', 'systemd']) {
      const unit = unitFor(kind, repoRoot, { envPath });
      assert.equal(unit.envPath, undefined, `${kind} reported a PATH for ${JSON.stringify(envPath)}`);
      assert.ok(
        !unit.text.includes('EnvironmentVariables') && !unit.text.includes('Environment='),
        `the ${kind} unit rendered an environment key for ${JSON.stringify(envPath)}:\n${unit.text}`,
      );
      assert.ok(!unit.text.includes('{{'), `the ${kind} unit still carries an unsubstituted token`);
    }
  }
});

test('a PATH is escaped for the unit it lands in, like every other substituted value', () => {
  // A toolchain under a directory holding both characters at once: `%` introduces a systemd
  // specifier, `&` ends an XML entity that never started. Neither is fanciful in a home directory
  // an adopter named, and either one produces a unit its service manager will not parse or will
  // expand into a path nobody wrote.
  const envPath = '/home/ada/100%-mine/bin:/opt/a&b/bin';
  const repoRoot = '/Users/ada/Work/checkout';

  const systemd = unitFor('systemd', repoRoot, { envPath });
  assert.ok(
    systemd.text.split('\n').includes('Environment="PATH=/home/ada/100%%-mine/bin:/opt/a&b/bin"'),
    `the systemd PATH is not specifier-escaped:\n${systemd.text}`,
  );

  const launchd = unitFor('launchd', repoRoot, { envPath });
  assert.ok(
    launchd.text.includes('<string>/home/ada/100%-mine/bin:/opt/a&amp;b/bin</string>'),
    `the plist PATH is not XML-escaped, or a systemd escape reached it:\n${launchd.text}`,
  );
  assert.ok(!launchd.text.includes('%%'), 'a systemd escape reached the plist');

  // Reported as it was supplied, not as it was escaped: the caller warns and reports with this
  // value, and an operator comparing it against their own shell's PATH must see their own string.
  assert.equal(launchd.envPath, envPath);
  assert.equal(systemd.envPath, envPath);

  // The two characters the systemd *quoting* is hostile to, which the `%`-doubling alone does not
  // cover: a `"` ends the quoted value early and turns the rest of it into directive text nobody
  // wrote, and a `\` eats the character after it. The assertion is that the key is still exactly one
  // directive, holding the whole PATH.
  const quotedEnvPath = '/home/ada/say "hi"/bin:/opt/a\\b/bin';
  const quoted = unitFor('systemd', repoRoot, { envPath: quotedEnvPath });
  assert.deepEqual(
    quoted.text.split('\n').filter((line) => line.startsWith('Environment=')),
    ['Environment="PATH=/home/ada/say \\"hi\\"/bin:/opt/a\\\\b/bin"'],
    `the systemd PATH is not escaped for the quoting it lands in:\n${quoted.text}`,
  );
  assert.equal(quoted.envPath, quotedEnvPath);

  // The plist takes both characters literally: neither is XML, and a systemd escape reaching it
  // would put backslashes into the PATH launchd hands the agent.
  const quotedPlist = unitFor('launchd', repoRoot, { envPath: quotedEnvPath });
  assert.ok(
    quotedPlist.text.includes(`<string>${quotedEnvPath}</string>`),
    `the plist PATH does not carry both characters verbatim:\n${quotedPlist.text}`,
  );
});

/**
 * XML 1.0 §2.5 forbids `--` inside a comment and a plist is XML, so a unit carrying one is malformed
 * on every machine it is installed on — which is what it was, in all six units Finding 67 measured.
 *
 * The property asserted is the *format's* rule rather than an expected string, which is what closes
 * the class instead of the one sentence: the shipped prose and every substituted value at once.
 * Nothing else in this package can enforce it — `doctor` reads installed units with regular
 * expressions by deliberate choice, and Apple's `CFPropertyList` accepts the malformation.
 */
test('no comment in a rendered unit carries the double hyphen XML forbids, whatever value lands in it', async (t) => {
  const repoRoot = '/Users/ada/Work/checkout';
  const launchAgents = '/Users/ada/Library/LaunchAgents';
  const systemdUser = '/home/ada/.config/systemd/user';

  await t.test('the prose the templates ship with', () => {
    const rendered = {
      launchd: unitFor('launchd', repoRoot, { unitDir: launchAgents }),
      systemd: unitFor('systemd', repoRoot, { unitDir: systemdUser }),
    };

    // Both backends, though only one can carry the defect: the systemd render is what stops a later
    // editor harmonising the two templates by copying an XML comment into a file that has none.
    for (const [kind, unit] of Object.entries(rendered)) {
      for (const interior of commentBlocks(unit.text)) {
        assert.ok(!interior.includes('--'), `a comment in the ${kind} unit carries a double hyphen:\n<!--${interior}-->`);
      }
    }

    // The offending comment documented something, and deleting it rather than respelling it would
    // pass the scan above in silence: the two values that block explains are still in the text.
    assert.ok(
      rendered.launchd.text.includes(`<string>${FIXTURE_ENV_PATH}</string>`),
      `the plist no longer carries the PATH its comment block documents:\n${rendered.launchd.text}`,
    );
    assert.ok(
      rendered.launchd.text.includes(`<string>${repoRoot}/${WATCHER_IN_REPO}</string>`),
      `the plist no longer carries the watcher path it was rendered with:\n${rendered.launchd.text}`,
    );

    // And the readable spelling stays where it is legal: a `#` comment forbids nothing, so the
    // systemd template keeps the flag as an operator types it.
    assert.ok(
      rendered.systemd.text.includes('daemon install --force'),
      `the systemd comment was respelled for a constraint that file does not have:\n${rendered.systemd.text}`,
    );
  });

  await t.test('a substituted value cannot reintroduce it, at any run length', () => {
    // Three hyphens, deliberately an odd run. `schemas/harness.config.schema.json` constrains
    // `projectName` only by `{"type":"string","minLength":1}` and `descriptiveProjectName` otherwise
    // falls back to the repository directory name, so this is both a legal configuration and a legal
    // directory name. The odd run is what discriminates: it fails on no escape at all *and* on an
    // incomplete `replace(/--/g, '- -')`, which leaves `notes- --app`. A two-hyphen fixture is green
    // under both and would measure nothing.
    const config = renderConfig({ projectName: 'notes---app' });
    const launchd = unitFor('launchd', repoRoot, { config, unitDir: launchAgents });

    const interiors = commentBlocks(launchd.text);
    for (const interior of interiors) {
      assert.ok(
        !interior.includes('--'),
        `a substituted value put a double hyphen into a plist comment:\n<!--${interior}-->`,
      );
    }

    // Separated is not deleted: the block that names the project still names it, so an escape that
    // stripped the value instead of spacing it does not pass here.
    assert.ok(
      interiors.some((interior) => interior.includes('notes') && interior.includes('app')),
      `no comment names the project this unit is for:\n${launchd.text}`,
    );

    // systemd's `Description=` is a directive and not a comment, so the same name goes in unmangled.
    // This is the pin on the escape being applied to the one token whose plist destination is a
    // comment: applied to the systemd arm as well, it would fail here.
    const systemd = unitFor('systemd', repoRoot, { config, unitDir: systemdUser });
    assert.ok(
      systemd.text.split('\n').includes('Description=Autonomous SDLC harness run watcher for notes---app'),
      `a comment escape reached a systemd directive:\n${systemd.text}`,
    );
  });

  await t.test('the scan itself objects to the spelling that shipped', () => {
    // A property test whose predicate never fires passes on any input. This is the sentence the
    // launchd template carried, as a literal: if the scan does not object to it, the two cases above
    // are measuring nothing.
    const shipped = '<!-- Re-run `daemon install --force`. -->';
    const offending = commentBlocks(shipped).filter((interior) => interior.includes('--'));

    assert.equal(offending.length, 1, `the scan does not object to the spelling that made six units malformed: ${shipped}`);
  });
});

test('the daemon is identified by a slug of its repository, and both backends spell it out', () => {
  // Two literal user-unit directories, so the assertions below are whole strings an operator could
  // read off a terminal rather than a join of values this test also computed.
  const launchAgents = '/Users/ada/Library/LaunchAgents';
  const systemdUser = '/home/ada/.config/systemd/user';

  for (const { repoRoot, slug } of IDENTITY_CASES) {
    assert.equal(repoSlug(repoRoot), slug, `the slug derived for ${repoRoot}`);

    const launchd = unitFor('launchd', repoRoot, { unitDir: launchAgents });
    assert.equal(launchd.label, `com.autonomous-sdlc-harness.watcher.${slug}`);
    assert.equal(launchd.targetPath, `${launchAgents}/com.autonomous-sdlc-harness.watcher.${slug}.plist`);

    const systemd = unitFor('systemd', repoRoot, { unitDir: systemdUser });
    assert.equal(systemd.label, `harness-watcher@${slug}.service`);
    assert.equal(systemd.targetPath, `${systemdUser}/harness-watcher@${slug}.service`);

    // A path with a space, an accent or a length problem must not reach the label: this is the
    // check `projectName` used to carry, on the value that now names the service.
    assert.match(launchd.label, LABEL_CHARSET, `${launchd.label} is not addressable by name`);
    assert.match(systemd.label, LABEL_CHARSET, `${systemd.label} is not addressable by name`);
  }
});

test('the identity follows the repository, not the project name', () => {
  const first = '/Users/ada/Work/first-checkout';
  const second = '/Users/ada/Work/second-checkout';

  // One repository, asked twice and then renamed: one identity throughout. A daemon whose label
  // moved when `projectName` was edited could no longer be stopped by the operator who installed it.
  const stable = unitFor('launchd', first).label;
  assert.equal(unitFor('launchd', first).label, stable, 'the same repository answered two labels');
  assert.equal(
    unitFor('launchd', first, { config: renderConfig({ projectName: 'renamed-yesterday' }) }).label,
    stable,
    'renaming the project moved the daemon out from under the operator',
  );

  // Two repositories sharing one project name: two identities and two files — the collision
  // decision 21 exists to prevent, since a machine may well hold two checkouts of one project.
  const other = unitFor('launchd', second);
  assert.notEqual(other.label, stable, 'two repositories were given one label');
  assert.notEqual(other.targetPath, unitFor('launchd', first).targetPath, 'two repositories share a unit file');
});

test('the shell half of the slug derivation answers exactly what the CLI half does', async (t) => {
  const dir = await wiredFixture(t);
  const lib = join(dir, LIB_IN_REPO);
  assert.ok(existsSync(lib), `init did not write the shared library to ${LIB_IN_REPO}`);

  // The fixture's own path first — a real repository, so the shell half's main-checkout probe
  // answers instead of falling back, which is the case a daemon is actually installed from. The
  // table rows are paths that exist nowhere, so each one exercises the fallback as well.
  for (const repoRoot of [dir, ...IDENTITY_CASES.map((row) => row.repoRoot)]) {
    const { status, stdout, stderr } = await shellSlug(lib, repoRoot);

    assert.equal(status, 0, `hr_repo_slug exited ${status} for ${repoRoot}: ${stderr}`);
    assert.equal(
      stdout,
      repoSlug(repoRoot),
      `hr_repo_slug and repoSlug disagree about ${repoRoot}: the watcher would key its run artifacts on one slug while the daemon it runs under is installed as another`,
    );
  }
});

test('an unknown verb is refused, and the refusal names the verbs there are', async (t) => {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);

  const { status, stderr } = await runCli(fixture.dir, ['daemon', 'reload']);

  assert.equal(status, 1);
  assert.match(stderr, /unknown verb "reload"/);
  assert.match(stderr, /install, start, stop or list/);
  // Nothing about the repository was read before the refusal: an unwired fixture refuses the same
  // way a wired one does, which is what keeps a typo a typo rather than a report about the config.
  assert.ok(!existsSync(join(fixture.dir, 'harness.config.json')));
});

/**
 * A flag that means nothing where it was typed is refused, in both directions.
 *
 * The command's standard for verbs, applied to its flags: `--prune` on `start` is a removal asked
 * for and not made, and `--watcher` on `list` is an override that would silently decide nothing.
 * Ignoring either would report a success for something other than what was typed, and the refusal
 * names the verbs the flag does belong to so the fix is in the message.
 */
test('a flag typed on a verb that has no use for it is refused, and the refusal names where it belongs', async (t) => {
  const dir = await wiredFixture(t);
  const machine = await machineState(t);

  for (const [args, belongsTo] of [
    [['daemon', 'start', '--prune'], /it belongs to list/],
    [['daemon', 'list', '--watcher', '/somewhere/else'], /it belongs to install, start, stop/],
  ]) {
    const { status, stderr } = await runCli(dir, args, machine.env);

    assert.equal(status, 1, `\`${args.join(' ')}\` was accepted`);
    assert.match(stderr, /means nothing to/);
    assert.match(stderr, belongsTo);
  }

  // The refusal is a parse-time one, so it costs nothing on the machine either.
  assert.equal(existsSync(machine.registry), false, 'a refused invocation created the registry');
});

/**
 * A machine with no daemons installed is a machine in a fine state, and `list` says so and exits 0.
 *
 * The alternative — a non-zero exit, or a refusal that there is no registry file — would make the
 * ordinary state of a machine that has just installed the CLI look like a fault, and would make
 * `daemon list` unusable as the first command an adopter runs to see where they stand. The line
 * names the command that changes the answer, because that is the next thing the reader wants.
 */
test('daemon list on an empty registry says so and exits 0', async (t) => {
  const dir = await wiredFixture(t);
  const machine = await machineState(t);

  const { status, stdout, stderr } = await runCli(dir, ['daemon', 'list'], machine.env);

  assert.equal(status, 0, `daemon list exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, /no repositories are registered on this machine/);
  assert.match(stdout, /daemon install/);
  // Reading it created nothing: a listing is a read, and a machine that has never installed a
  // daemon must not acquire machine state by being asked about it.
  assert.equal(existsSync(machine.registry), false, 'daemon list created the registry it only read');
});

/**
 * The registration itself: what `install` records, that `list` shows it, and that a re-install
 * leaves one row rather than a second one.
 *
 * **The entry is compared against the install's own reported values**, not against a second
 * derivation here: the label and the unit path this test asserts are the two lines `install` printed
 * for the operator, so a registry that named some other unit would fail here — which is the whole
 * risk the registry carries. The service manager is the stub of choice 5, so this is a real install
 * of a real unit file and nothing is loaded.
 */
test('install registers the repository it installed the unit for, and a re-install leaves one entry', async (t) => {
  const dir = await wiredFixture(t);
  const machine = await stubbedMachine(t);

  const first = await runCli(dir, ['daemon', 'install'], machine.env);
  assert.equal(first.status, 0, `daemon install exited ${first.status}\n${first.stdout}\n${first.stderr}`);

  // The three lines the install printed for the operator. The backend is the one the CLI's own
  // detection chose against the stubbed PATH, so it is read back rather than assumed: a host with
  // no launchd answers `systemd` here, and this test is about the entry matching the install.
  const unitPath = reported(first.stdout, 'unit: ');
  const label = reported(first.stdout, 'label: ');
  const backend = reported(first.stdout, 'backend: ').split(' ')[0];
  assert.ok(existsSync(unitPath), `the unit file was not written to ${unitPath}`);

  const slug = repoSlug(dir);
  const registry = readJson(machine.registry);
  assert.equal(registry.schema, REGISTRY_SCHEMA);
  assert.deepEqual(Object.keys(registry.repos), [slug], 'the entry is not keyed on the repository slug');

  const entry = registry.repos[slug];
  assert.equal(entry.root, dir);
  assert.equal(entry.label, label, 'the entry names a label the install did not report');
  assert.equal(entry.unitPath, unitPath, 'the entry names a unit path the install did not report');
  assert.equal(entry.backend, backend, 'the entry names a backend the install did not report');
  assert.ok(Number.isInteger(entry.registered_at) && entry.registered_at > 0, 'registered_at is not an epoch second');

  const listed = await runCli(dir, ['daemon', 'list'], machine.env);
  assert.equal(listed.status, 0, `daemon list exited ${listed.status}\n${listed.stdout}\n${listed.stderr}`);
  const row = rowFor(listed.stdout, slug);
  assert.ok(row !== undefined, `the registered repository is not in the listing:\n${listed.stdout}`);
  assert.ok(row.startsWith('*'), `the listing does not mark the checkout it was run in:\n${row}`);
  for (const value of [entry.root, entry.backend, entry.label]) {
    assert.ok(row.includes(value), `the listing does not report ${value}:\n${row}`);
  }
  assert.ok(!row.includes('['), `an entry that is fine was reported as stale:\n${row}`);

  // The unit write is create-if-absent and the entry is a replace-in-place, so a second install
  // must leave one row for one repository rather than a second row for the same one.
  const second = await runCli(dir, ['daemon', 'install'], machine.env);
  assert.equal(second.status, 0, `the second daemon install exited ${second.status}\n${second.stderr}`);
  assert.deepEqual(Object.keys(readJson(machine.registry).repos), [slug], 'a re-install added a second entry');
});

/**
 * The one attribute of a re-install that used to be silent: the `PATH` it re-captured from whichever
 * shell it was typed in.
 *
 * A re-install prints the *difference* from the unit on disk rather than the same whole value in the
 * same line and the same place as on a first install, which is what carried no signal that the value
 * had moved. The backend is whichever one this host has — the stubbed service manager of choice 5,
 * so a real unit is really written and no job is loaded — and the read-back the comparison depends on
 * is proved against **both** backends' escaping by `doctor.test.mjs`'s round-trip case, which renders
 * each shape rather than installing it.
 *
 * `--force` is on every re-install here because the unit write is create-if-absent, so this case is
 * about the arm that writes: the delta *is* the change. The arm that keeps the file — where the same
 * two shells produce a comparison and no change — is the case below it.
 */
test('a re-install reports the delta between the PATH it writes and the one already installed', { skip: NO_BACKEND }, async (t) => {
  const dir = await wiredFixture(t);
  const machine = await stubbedMachine(t);
  const richer = { ...machine.env, PATH: `${EXTRA_TOOLCHAIN}${delimiter}${machine.env.PATH}` };

  // A first install has nothing to compare against, so the whole value is the report.
  const first = await runCli(dir, ['daemon', 'install'], machine.env);
  assert.equal(first.status, 0, `daemon install exited ${first.status}\n${first.stdout}\n${first.stderr}`);
  assert.ok(
    first.stdout.split('\n').includes(`PATH the daemon will run on: ${machine.env.PATH}`),
    `the first install did not report the PATH it wrote:\n${first.stdout}`,
  );
  assert.deepEqual(deltaEntries(first.stdout, '+'), [], 'a first install reported a delta against nothing');
  assert.deepEqual(deltaEntries(first.stderr, '-'), []);
  const unitPath = reported(first.stdout, 'unit: ');

  // One entry more than the installed unit carries: the shape of the divergence Finding 50 measured,
  // where the second install was typed in a session the first one was not.
  const added = await runCli(dir, ['daemon', 'install', '--force'], richer);
  assert.equal(added.status, 0, `the re-install exited ${added.status}\n${added.stdout}\n${added.stderr}`);
  assert.deepEqual(deltaEntries(added.stdout, '+'), [EXTRA_TOOLCHAIN], `the added entry is not what was reported:\n${added.stdout}`);
  assert.deepEqual(deltaEntries(added.stderr, '-'), [], 'an install that added an entry reported a removal');
  assert.ok(
    !added.stdout.includes('PATH the daemon will run on:'),
    `the re-install reprinted the whole value instead of the delta:\n${added.stdout}`,
  );

  // One entry fewer, which is the direction that costs something: it goes to stderr, so a --quiet
  // run still prints it, and it names the check that reports the consequence later.
  const dropped = await runCli(dir, ['daemon', 'install', '--force'], machine.env);
  assert.equal(dropped.status, 0, `the re-install exited ${dropped.status}\n${dropped.stdout}\n${dropped.stderr}`);
  assert.deepEqual(deltaEntries(dropped.stderr, '-'), [EXTRA_TOOLCHAIN], `the dropped entry is not what was reported:\n${dropped.stderr}`);
  assert.deepEqual(deltaEntries(dropped.stdout, '+'), [], 'an install that dropped an entry reported an addition');
  assert.deepEqual(deltaEntries(dropped.stdout, '-'), [], 'the removal went to stdout, which --quiet suppresses');
  assert.match(dropped.stderr, /daemon-path/);

  // The same PATH twice: one line, and nothing to read as a change.
  const same = await runCli(dir, ['daemon', 'install', '--force'], machine.env);
  assert.equal(same.status, 0, `the re-install exited ${same.status}\n${same.stdout}\n${same.stderr}`);
  assert.ok(
    same.stdout.split('\n').includes('PATH unchanged from the installed unit'),
    `an unchanged PATH was not reported as unchanged:\n${same.stdout}`,
  );
  assert.deepEqual(deltaEntries(same.stdout, '+'), [], 'an unchanged PATH produced a delta');
  assert.deepEqual(deltaEntries(same.stderr, '-'), []);

  // And the comparison is made before anything is written, so a dry run reports the one a real run
  // would make — over both the unit and the `.bak` the forced re-installs above left beside it.
  const before = await Promise.all([readFile(unitPath, 'utf8'), readFile(`${unitPath}.bak`, 'utf8')]);
  const dry = await runCli(dir, ['daemon', 'install', '--force', '--dry-run'], richer);
  assert.equal(dry.status, 0, `the dry run exited ${dry.status}\n${dry.stdout}\n${dry.stderr}`);
  assert.deepEqual(deltaEntries(dry.stdout, '+'), [EXTRA_TOOLCHAIN], `the dry run reported a different comparison:\n${dry.stdout}`);
  assert.deepEqual(
    await Promise.all([readFile(unitPath, 'utf8'), readFile(`${unitPath}.bak`, 'utf8')]),
    before,
    'the dry run wrote the unit it was only asked to compare',
  );
});

/**
 * The other half of that comparison: a re-install **without** `--force`, which keeps the unit and so
 * changes no `PATH` at all.
 *
 * The direction under test is the one that used to cost something — a re-install typed in a shell
 * poorer than the one the unit was written from. Forced, that drops a directory out of the daemon's
 * `PATH` and warns. Unforced, the file on disk is kept and the daemon goes on running on exactly what
 * it had, so the same two entries must be reported as a *comparison* and nothing may be reported as
 * lost: no `-` on stderr, no `daemon-path` sentence, and the flag that would act on it named instead.
 *
 * **The keep is measured on the action log and the bytes, not on the absence of a warning** — a case
 * that only checked the wording would pass just as well against a run that wrote the unit and said
 * the wrong thing about it.
 */
test('an unforced re-install compares the PATH and reports no loss', { skip: NO_BACKEND }, async (t) => {
  const dir = await wiredFixture(t);
  const machine = await stubbedMachine(t);
  const richer = { ...machine.env, PATH: `${EXTRA_TOOLCHAIN}${delimiter}${machine.env.PATH}` };

  const first = await runCli(dir, ['daemon', 'install'], richer);
  assert.equal(first.status, 0, `daemon install exited ${first.status}\n${first.stdout}\n${first.stderr}`);
  const unitPath = reported(first.stdout, 'unit: ');
  const installed = await readFile(unitPath, 'utf8');

  const kept = await runCli(dir, ['daemon', 'install'], machine.env);
  assert.equal(kept.status, 0, `the re-install exited ${kept.status}\n${kept.stdout}\n${kept.stderr}`);
  assert.equal(actionFor(kept.stdout, unitPath), 'kept', `the unforced re-install did not keep the unit:\n${kept.stdout}`);
  assert.equal(await readFile(unitPath, 'utf8'), installed, 'the unforced re-install wrote the unit it reported keeping');
  assert.equal(existsSync(`${unitPath}.bak`), false, 'a run that wrote nothing left a .bak');

  // The divergence is still printed — it is what the operator came for — as a comparison on stdout.
  assert.deepEqual(deltaEntries(kept.stdout, '-'), [EXTRA_TOOLCHAIN], `the comparison is not what was reported:\n${kept.stdout}`);
  assert.deepEqual(deltaEntries(kept.stdout, '+'), [], 'a shell missing an entry was reported as adding one');
  assert.match(kept.stdout, /this run keeps that unit/);
  assert.match(kept.stdout, /--force/);

  // And nothing was lost, so nothing needs a human: the two lines the forced drop prints are absent.
  assert.deepEqual(deltaEntries(kept.stderr, '-'), [], `a kept unit was reported as having lost a directory:\n${kept.stderr}`);
  assert.ok(!kept.stderr.includes('daemon-path'), `a run that changed no PATH sent the reader to doctor:\n${kept.stderr}`);
});

/**
 * The third state of the same comparison: `--force --dry-run` from the poorer shell, which *plans* a
 * replacement and commits none.
 *
 * The two cases above cover the forced write and the unforced keep; this is the preview of the first,
 * and the only one where the plan says "replace" while the tree ends the run untouched. So the delta
 * is still computed and the dropped entry is still named — that is what the operator asked for — but
 * in the conditional, because nothing has left the daemon's `PATH`.
 *
 * **`--quiet` is what makes the wording load-bearing rather than cosmetic.** The dropped entry and the
 * sentence pointing at `doctor` go to `warn`, which prints under `--quiet`; the step header saying
 * this run is a preview goes to `step`, which does not. An indicative warning here is therefore the
 * whole of a quiet preview's output, describing a loss that did not happen.
 */
test('a forced dry run reports the drop it would make, in the conditional, and drops nothing', { skip: NO_BACKEND }, async (t) => {
  const dir = await wiredFixture(t);
  const machine = await stubbedMachine(t);
  const richer = { ...machine.env, PATH: `${EXTRA_TOOLCHAIN}${delimiter}${machine.env.PATH}` };

  const first = await runCli(dir, ['daemon', 'install'], richer);
  assert.equal(first.status, 0, `daemon install exited ${first.status}\n${first.stdout}\n${first.stderr}`);
  const unitPath = reported(first.stdout, 'unit: ');
  const installed = await readFile(unitPath, 'utf8');

  const dry = await runCli(dir, ['daemon', 'install', '--force', '--dry-run', '--quiet'], machine.env);
  assert.equal(dry.status, 0, `the forced dry run exited ${dry.status}\n${dry.stdout}\n${dry.stderr}`);

  // The comparison a real forced run would make, reported by one that made none.
  assert.deepEqual(deltaEntries(dry.stderr, '-'), [EXTRA_TOOLCHAIN], `the dropped entry is not what was reported:\n${dry.stderr}`);
  assert.equal(await readFile(unitPath, 'utf8'), installed, 'the forced dry run wrote the unit it was only asked to compare');
  assert.equal(existsSync(`${unitPath}.bak`), false, 'the forced dry run backed up a unit it did not replace');

  // The tense: this preview says the loss has not happened, and never the sentence a real drop prints.
  assert.match(dry.stderr, /nothing has left it yet/);
  assert.ok(
    !dry.stderr.includes('a command the daemon cannot resolve: if that was not intended'),
    `a run that wrote nothing reported the drop in the indicative:\n${dry.stderr}`,
  );

  // And the header over the delta, which --quiet suppresses and a louder preview prints.
  const loud = await runCli(dir, ['daemon', 'install', '--force', '--dry-run'], machine.env);
  assert.equal(loud.status, 0, `the forced dry run exited ${loud.status}\n${loud.stdout}\n${loud.stderr}`);
  assert.ok(
    loud.stdout.split('\n').includes("PATH would differ from the installed unit (+ this install's, - the installed unit's):"),
    `the preview did not head its delta in the conditional:\n${loud.stdout}`,
  );
  assert.ok(
    !loud.stdout.includes('PATH differs from the installed unit'),
    `the preview headed its delta as a change it had made:\n${loud.stdout}`,
  );
});

/**
 * A shell with no `PATH` at all takes the warning it always took — and, when a unit is already
 * installed, is additionally told what that unit carries, because a key disappearing is not a delta.
 *
 * **`PATH` is unset here rather than emptied.** An empty one resolves nothing, so the CLI's own `git`
 * and the service-manager probe would fail before the install had anything to say about a `PATH`;
 * with the variable absent, `execvp` falls back to the system default directories, where both live.
 * That fallback is also why this second run is a `--dry-run`: the stub service manager of choice 5
 * sits on the `PATH` this case removes, so a real run would reach the host's own.
 */
test('a shell with no PATH is warned, and told what the installed unit carries', { skip: NO_BACKEND }, async (t) => {
  const dir = await wiredFixture(t);
  const machine = await stubbedMachine(t);

  const installed = await runCli(dir, ['daemon', 'install'], machine.env);
  assert.equal(installed.status, 0, `daemon install exited ${installed.status}\n${installed.stdout}\n${installed.stderr}`);
  const unitPath = reported(installed.stdout, 'unit: ');

  const { status, stdout, stderr } = await runCli(dir, ['daemon', 'install', '--force', '--dry-run'], {
    ...machine.env,
    PATH: undefined,
  });

  assert.equal(status, 0, `the install exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stderr, /this shell has no PATH/);
  assert.ok(
    stderr.includes(`add the PATH by hand to ${unitPath}`),
    `the warning no longer names the unit an operator would edit:\n${stderr}`,
  );
  assert.ok(
    stderr.includes(`What is installed today: ${machine.env.PATH}`),
    `the run did not say what the installed unit carries and this one would not:\n${stderr}`,
  );
  assert.deepEqual(deltaEntries(stdout, '+'), [], 'a key that disappears was reported as a set difference');
  assert.deepEqual(deltaEntries(stderr, '-'), [], 'a key that disappears was reported as a set difference');
});

/**
 * Finding 51's three commands, and the first of them is now the last one an operator needs.
 *
 * The finding's circle was `stop` refusing because the unit file was gone (*"there is nothing to
 * stop: run … daemon install first"*), the `install` it named refusing because the agent was still
 * loaded, and `stop` refusing again. What a `stop` is asked is whether something is loaded under
 * this label, and a label needs no file — so the refusal is gone and the target is unchanged, which
 * is the pair this case pins: exit 0, and the backend's own line naming the label.
 *
 * The missing unit is still *reported*, because a `stop` that said nothing about it would be the
 * silent success this fix must not introduce. What the report may not do is send the reader back
 * round the circle: no `daemon install` advice, and nothing saying there is nothing to stop.
 */
test('stop boots out the label after the unit file was deleted, and never sends the reader to install', async (t) => {
  const { dir, machine, unitPath, kind, label } = await deletedUnitState(t);

  const { status, stdout, stderr } = await runCli(dir, ['daemon', 'stop'], machine.env);

  assert.equal(status, 0, `daemon stop exited ${status}\n${stdout}\n${stderr}`);
  // Substring rather than a whole line: the reporter's `ok` marker opens the launchd line and the
  // systemd instruction has none, and the marker is not what an operator types.
  const { driven } = stopLinesFor(kind, label);
  assert.ok(stdout.includes(driven), `the stop did not address the label:\n${stdout}`);

  // The absence, named in a note rather than in a refusal. Here — and only here — the note may name
  // the cause: the registry this install wrote is what makes "removed by hand" an attribution rather
  // than a guess, so it is named beside it.
  const note = stderr.split('\n').find((line) => line.startsWith('! ') && line.includes(unitPath));
  assert.ok(note !== undefined, `no note names the missing unit ${unitPath}:\n${stderr}`);
  assert.ok(note.includes(machine.registry), `the note attributes the removal to nothing:\n${note}`);
  assert.match(note, /so the unit file was removed by hand/, `the note leaves the cause open:\n${note}`);

  // The circle itself, in the two spellings it was made of. The word boundary is load-bearing: the
  // launchd backend's own reason ends "the run daemon installs as a launchd user agent", which a
  // bare substring reads as the advice this run must no longer give.
  const output = `${stdout}\n${stderr}`;
  assert.doesNotMatch(output, /daemon install\b/, `the stop still names the install that cannot run:\n${output}`);
  assert.doesNotMatch(output, /nothing to stop/, `the stop still refuses over a missing file:\n${output}`);
});

/**
 * The same state, the other verb: `start` keeps the precondition, and the asymmetry is the point.
 *
 * Without this case the fix reads as "the file check was removed"; with it, the check is where it
 * belongs and only there — `bootout` needs a label; `start`'s check is systemd's requirement and
 * launchd's guard.
 */
test('start still refuses when the unit file is gone, and names the install that would write it', async (t) => {
  const { dir, machine, unitPath } = await deletedUnitState(t);

  const { status, stdout, stderr } = await runCli(dir, ['daemon', 'start'], machine.env);

  assert.notEqual(status, 0, `daemon start over a missing unit exited 0\n${stdout}\n${stderr}`);
  assert.ok(stderr.includes(unitPath), `the refusal does not name the unit it cannot load:\n${stderr}`);
  assert.match(stderr, /daemon install\b/);
});

/**
 * The preview of the same stop: it reports both halves and changes nothing.
 *
 * Choice 3 in the header — every refusal holds under `--dry-run` — has a converse, and this is it: a
 * preview must not hide the state a real run would report. So the missing-file note is printed here
 * too, alongside the command the run says it would drive.
 */
test('a dry-run stop over a deleted unit reports the command and the absence, and writes nothing', async (t) => {
  const { dir, machine, unitPath, kind, label } = await deletedUnitState(t);
  const before = await snapshotTree(dir);
  const registryBefore = await readFile(machine.registry, 'utf8');

  const { status, stdout, stderr } = await runCli(dir, ['daemon', 'stop', '--dry-run'], machine.env);

  assert.equal(status, 0, `daemon stop --dry-run exited ${status}\n${stdout}\n${stderr}`);
  assert.ok(stdout.includes(stopLinesFor(kind, label).planned), `the preview named no command:\n${stdout}`);
  assert.ok(
    stderr.split('\n').some((line) => line.startsWith('! ') && line.includes(unitPath)),
    `the preview hid the missing unit ${unitPath}:\n${stderr}`,
  );

  // Both sides of the boundary — choice 2. The registry is compared **by bytes** rather than by
  // existence, since the install above created it: an existence check would pass against a preview
  // that rewrote the machine's own record of its daemons.
  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote into the repository');
  assert.equal(existsSync(unitPath), false, '--dry-run restored the unit file it was only asked to describe');
  assert.equal(await readFile(machine.registry, 'utf8'), registryBefore, '--dry-run rewrote the registry');
});

/**
 * The other cause of the same absence, and the one an operator meets first.
 *
 * {@link deletedUnitState} installs before it deletes, so both cases above stand in a checkout that
 * really did install. The ordinary state is the one that never did — `daemon stop` typed in a
 * checkout no daemon was installed from — and there the note may not say a hand removed a file the
 * operator never had. What is pinned is that the note states the observation and *both* of its
 * causes, and that everything the sibling case pins about the verb is unchanged around it.
 *
 * The registry is asserted absent rather than assumed: it is what the command reads to tell the two
 * states apart, so a case whose fixture had quietly registered something would be measuring the
 * other branch under this name.
 */
test('stop in a checkout that never installed names both causes of the missing unit, not one', async (t) => {
  const dir = await wiredFixture(t);
  const machine = await stubbedMachine(t);

  const { status, stdout, stderr } = await runCli(dir, ['daemon', 'stop'], machine.env);

  assert.equal(status, 0, `daemon stop exited ${status}\n${stdout}\n${stderr}`);
  assert.equal(existsSync(machine.registry), false, `something registered this checkout in ${machine.registry}`);

  const kind = reported(stdout, 'backend: ').split(' ')[0];
  const unitPath = reported(stdout, 'unit: ');
  assert.equal(existsSync(unitPath), false, `a unit is installed at ${unitPath}, so this is the other state`);

  // The verb still addressed the label, which is the whole reason it needs no file.
  const { driven } = stopLinesFor(kind, labelFor(kind, repoSlug(dir)));
  assert.ok(stdout.includes(driven), `the stop did not address the label:\n${stdout}`);

  const note = stderr.split('\n').find((line) => line.startsWith('! ') && line.includes(unitPath));
  assert.ok(note !== undefined, `no note names the missing unit ${unitPath}:\n${stderr}`);

  // The cause the command cannot know here, in both spellings: the one this case was written for,
  // and the definite sentence the registry-backed branch is allowed to print.
  const output = `${stdout}\n${stderr}`;
  assert.doesNotMatch(output, /deleted by hand/, `the note asserts a deletion it cannot know:\n${note}`);
  assert.doesNotMatch(note, /so the unit file was removed by hand/, `the note picks one of two causes:\n${note}`);
  assert.match(note, /either no daemon was installed from this checkout, or/, `the note names one cause:\n${note}`);

  // The property the sibling case pins, in the state where it is easiest to lose: no next command.
  assert.doesNotMatch(output, /daemon install\b/, `the stop sends the reader to install:\n${output}`);
});

/**
 * Staleness is reported by a read and removed only by `--prune` — and a prune takes exactly what it
 * reported.
 *
 * The two seeded rows are the point: one repository that is still there with its unit installed, and
 * one whose root has been deleted. A `--prune` that took the second and left the first is the
 * property; a read that quietly dropped the second would be the defect `docs/watcher.md` §7 forbids,
 * since a root can be missing because a volume is unmounted rather than because a checkout is gone.
 */
test('a registered repository that is gone is reported, and only --prune removes it', async (t) => {
  const dir = await wiredFixture(t);
  const machine = await machineState(t);
  const elsewhere = await throwaway(t);

  // A unit file that exists, so the surviving row's grade is about the repository rather than about
  // a unit this test forgot to create.
  const unitPath = join(elsewhere, 'com.autonomous-sdlc-harness.watcher.kept.plist');
  await writeFile(unitPath, '<plist/>\n', 'utf8');

  const kept = repoSlug(dir);
  const gone = 'seeded-checkout-that-was-removed';
  const seeded = {
    [kept]: entryFor(dir, { label: labelFor('launchd', kept), unitPath }),
    [gone]: entryFor(join(elsewhere, 'never-created'), { unitPath }),
  };
  await seedRegistry(machine, seeded);

  const listed = await runCli(dir, ['daemon', 'list'], machine.env);
  assert.equal(listed.status, 0, `daemon list exited ${listed.status}\n${listed.stdout}\n${listed.stderr}`);
  assert.match(rowFor(listed.stdout, gone), /\[root-missing]/);
  assert.ok(!rowFor(listed.stdout, kept).includes('['), 'a repository that is still there was graded stale');
  assert.deepEqual(readJson(machine.registry).repos, seeded, 'a listing rewrote the registry it only read');

  const dryRun = await runCli(dir, ['daemon', 'list', '--prune', '--dry-run'], machine.env);
  assert.equal(dryRun.status, 0, `daemon list --prune --dry-run exited ${dryRun.status}\n${dryRun.stderr}`);
  assert.ok(dryRun.stdout.includes(`would remove ${gone} (root-missing)`), `no line names what would go:\n${dryRun.stdout}`);
  assert.match(dryRun.stdout, /would remove 1 stale entry/);
  assert.deepEqual(readJson(machine.registry).repos, seeded, '--dry-run pruned the registry it only described');

  const pruned = await runCli(dir, ['daemon', 'list', '--prune'], machine.env);
  assert.equal(pruned.status, 0, `daemon list --prune exited ${pruned.status}\n${pruned.stderr}`);
  assert.ok(pruned.stdout.includes(`removed ${gone} (root-missing)`), `no line names what went:\n${pruned.stdout}`);
  assert.match(pruned.stdout, /removed 1 stale entry/);

  // Entries only, and only the stale one: the surviving row is untouched, and both the repository
  // the removed row named and the unit file the seeded rows share are still there.
  assert.deepEqual(readJson(machine.registry).repos, { [kept]: seeded[kept] });
  assert.ok(existsSync(unitPath), '--prune removed a unit file');
  assert.ok(existsSync(dir), '--prune removed a repository');
});

/**
 * `list` answers from outside every repository — the property that is easiest to lose by opening it
 * with `install`'s first two lines.
 *
 * An operator asking what is armed on this machine is very often standing nowhere in particular, and
 * a `resolveRepoRoot` here would refuse them with a message about the directory they happen to be in
 * rather than answering the question. Nothing is marked, because there is no checkout to mark.
 */
test('daemon list needs no repository and no config, and marks nothing when it is run outside one', async (t) => {
  const machine = await machineState(t);
  const outside = await throwaway(t);
  const slug = 'seeded-checkout-somewhere-else';
  await seedRegistry(machine, { [slug]: entryFor('/somewhere/else', { unitPath: '/somewhere/else.plist' }) });

  const { status, stdout, stderr } = await runCli(outside, ['daemon', 'list'], machine.env);

  assert.equal(status, 0, `daemon list outside a repository exited ${status}\n${stdout}\n${stderr}`);
  assert.ok(!existsSync(join(outside, 'harness.config.json')), 'the fixture was wired, so this proved nothing');
  const row = rowFor(stdout, slug);
  assert.ok(row !== undefined, `the seeded entry was not listed:\n${stdout}`);
  assert.ok(row.startsWith(' '), `something was marked as the current checkout:\n${row}`);
  assert.ok(!stdout.includes('marks the repository'), `the marker legend was printed with nothing marked:\n${stdout}`);
});
