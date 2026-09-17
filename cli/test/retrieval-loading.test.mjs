/**
 * The docs-retrieval packages stay out of every verb that does not retrieve.
 *
 * **The rule these tests exist to enforce: a retrieval package is loaded only by a dynamic `import()`
 * in `cli/src/retrieval/runtime.ts`, and only on a path that retrieves** — and, with it, the half of
 * the task prompt's Acceptance 1 that a fresh adopter's install contains none of those packages.
 *
 * ## Four cases, and why each is needed
 *
 * - **(a) Source guard.** What an ordinary verb loads cannot all be reached behaviourally — a module
 *   only one untested branch imports would pass (b) — so the source is guarded as well
 *   (`.claude/context/conventions.md` → `## The testing bar`, the last-resort bullet).
 * - **(b) Behavioural.** `doctor`, `config get` and `init --dry-run` run under a resolve hook that
 *   throws on any peer specifier, with `phases.docs` off and again with it on and `docs.retrieval`
 *   off; each exit status must equal the unhooked run's. The hook reaches the child through
 *   `NODE_OPTIONS=--import=<register>`, which is `node --import <register> <entry>` spelled through the
 *   one runner this suite shares, and a control case proves the hook is live.
 * - **(c) Manifest.** No `dependencies` key, and every peer optional.
 * - **(d) `retrievalRuntimeState`**, in-process, against a planted cache under a temp `XDG_CACHE_HOME`.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { PACKAGE_ROOT, createFixture, runCli, runCliFrom } from './helpers/fixture.mjs';

const MANIFEST = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));

/** The five retrieval packages, read from the manifest rather than retyped. */
const PEER_NAMES = Object.keys(MANIFEST.peerDependencies ?? {});

/** The one file allowed to `import()` a peer. */
const LOADER_MODULE = 'src/retrieval/runtime.ts';

/** The hook's refusal, which no hooked run's stderr may carry. */
const HOOK_REFUSAL = 'retrieval package resolved';

/** The verbs that must not retrieve. */
const NON_RETRIEVAL_VERBS = [['doctor'], ['config', 'get', 'stateDir'], ['init', '--dry-run']];

/** A minimal Node project `init` detects commands for. */
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

/** Every `.ts` file under `cli/src`, as `[package-relative path, text]`. */
function sourceFiles() {
  return readdirSync(join(PACKAGE_ROOT, 'src'), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => {
      const absolute = join(entry.parentPath ?? entry.path, entry.name);
      return [relative(PACKAGE_ROOT, absolute).split('\\').join('/'), readFileSync(absolute, 'utf8')];
    });
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('(a) no cli/src module statically imports a retrieval peer, and only the loader import()s one', () => {
  assert.ok(PEER_NAMES.length > 0, 'the manifest declares no peers, so this guard would guard nothing');
  const offences = [];
  for (const [path, text] of sourceFiles()) {
    for (const name of PEER_NAMES) {
      const quoted = `['"\`]${escapeRegExp(name)}(?:/[^'"\`]*)?['"\`]`;
      const staticImport = new RegExp(`^\\s*import\\s+(?!type\\b)(?:[^;]*?\\bfrom\\s*)?${quoted}`, 'm');
      const dynamicImport = new RegExp(`\\bimport\\s*\\(\\s*${quoted}`);
      if (staticImport.test(text)) offences.push(`${path}: static import of ${name}`);
      if (path !== LOADER_MODULE && dynamicImport.test(text)) offences.push(`${path}: import() of ${name}`);
    }
  }
  assert.deepEqual(offences, []);
});

/** Write the refusing resolve hook and its register module; answer with the `NODE_OPTIONS` value. */
async function writeHook(dir) {
  const hook = join(dir, 'refuse-retrieval-hook.mjs');
  const register = join(dir, 'register-refuse-retrieval.mjs');
  await writeFile(
    hook,
    `const NAMES = ${JSON.stringify(PEER_NAMES)};
export async function resolve(specifier, context, nextResolve) {
  if (NAMES.some((name) => specifier.startsWith(name))) throw new Error(${JSON.stringify(`${HOOK_REFUSAL}: `)} + specifier);
  return nextResolve(specifier, context);
}
`,
  );
  await writeFile(
    register,
    `import { register } from 'node:module';
register(${JSON.stringify(pathToFileURL(hook).href)});
`,
  );
  return `--import=${pathToFileURL(register).href}`;
}

/** A throwaway directory outside any fixture repository, torn down with the test. */
async function scratchDir(t) {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'harness-retrieval-')));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

async function assertVerbsLoadNoPeer(dir, nodeOptions, label) {
  for (const args of NON_RETRIEVAL_VERBS) {
    const plain = await runCli(dir, args);
    const hooked = await runCli(dir, args, { NODE_OPTIONS: nodeOptions });
    const what = `${label}: ${args.join(' ')}`;
    assert.ok(!hooked.stderr.includes(HOOK_REFUSAL), `${what} resolved a retrieval package:\n${hooked.stderr}`);
    assert.equal(hooked.status, plain.status, `${what} exited ${hooked.status} hooked, ${plain.status} not:\n${hooked.stderr}`);
  }
}

test('(b) the refusing hook is live: an import() of a peer under it carries the refusal', async (t) => {
  const dir = await scratchDir(t);
  const nodeOptions = await writeHook(dir);
  const probe = join(dir, 'probe.mjs');
  await writeFile(probe, `await import(${JSON.stringify(PEER_NAMES[0])});\n`);

  const { status, stderr } = await runCliFrom(probe, dir, [], { NODE_OPTIONS: nodeOptions });

  assert.notEqual(status, 0);
  assert.ok(stderr.includes(HOOK_REFUSAL), `the hook did not refuse the peer:\n${stderr}`);
});

test('(b) doctor, config get and init --dry-run resolve no retrieval package, docs phase off then on', async (t) => {
  const hookDir = await scratchDir(t);
  const nodeOptions = await writeHook(hookDir);
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  const wired = await runCli(fixture.dir, ['init']);
  assert.equal(wired.status, 0, `init exited ${wired.status}\n${wired.stderr}`);

  await assertVerbsLoadNoPeer(fixture.dir, nodeOptions, 'phases.docs off');

  for (const args of [
    ['config', 'set', 'phases.docs', 'true'],
    ['config', 'set', 'docs.retrieval', 'false'],
  ]) {
    const result = await runCli(fixture.dir, args);
    assert.equal(result.status, 0, `${args.join(' ')} exited ${result.status}\n${result.stderr}`);
  }
  await assertVerbsLoadNoPeer(fixture.dir, nodeOptions, 'phases.docs on, docs.retrieval off');
});

test('(c) the manifest has no dependencies key and every peer is optional', () => {
  assert.equal(Object.hasOwn(MANIFEST, 'dependencies'), false, 'cli/package.json carries a dependencies key');
  for (const name of PEER_NAMES) {
    assert.equal(MANIFEST.peerDependenciesMeta?.[name]?.optional, true, `${name} is not an optional peer`);
  }
});

test('(d) retrievalRuntimeState answers from the planted runtime alone', async (t) => {
  const cacheHome = await scratchDir(t);
  const previous = process.env.XDG_CACHE_HOME;
  process.env.XDG_CACHE_HOME = cacheHome;
  t.after(() => {
    if (previous === undefined) delete process.env.XDG_CACHE_HOME;
    else process.env.XDG_CACHE_HOME = previous;
  });
  const runtime = await import(pathToFileURL(join(PACKAGE_ROOT, 'dist', 'retrieval', 'runtime.js')).href);
  const runtimeDir = runtime.retrievalRuntimeDir();
  assert.ok(runtimeDir.startsWith(cacheHome), `the runtime directory ignored XDG_CACHE_HOME: ${runtimeDir}`);

  const empty = runtime.retrievalRuntimeState();
  assert.equal(empty.installed, false);
  assert.equal(empty.version, undefined);
  assert.deepEqual(empty.missing, [MANIFEST.name, ...PEER_NAMES]);

  const plant = async (relativePath, text) => {
    const target = join(runtimeDir, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
  };
  const cliPackageDir = dirname(dirname(runtime.RUNTIME_CLI_RELATIVE));
  await plant(runtime.RUNTIME_CLI_RELATIVE, '');
  await plant(join(cliPackageDir, 'package.json'), JSON.stringify({ name: MANIFEST.name, version: MANIFEST.version }));
  for (const name of PEER_NAMES) await plant(join('node_modules', name, 'package.json'), '{}');

  const planted = runtime.retrievalRuntimeState();
  assert.deepEqual(planted, { installed: true, version: MANIFEST.version, missing: [] });

  const otherVersion = `${MANIFEST.version}-other`;
  await plant(join(cliPackageDir, 'package.json'), JSON.stringify({ name: MANIFEST.name, version: otherVersion }));
  const stale = runtime.retrievalRuntimeState();
  assert.deepEqual(stale, { installed: false, version: otherVersion, missing: [MANIFEST.name] });
});
