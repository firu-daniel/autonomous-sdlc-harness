/**
 * The opt-out command in the adopter template's change-request fence
 * (`cli/templates/claude/CLAUDE.md` → item **4. Opt-out.**), run under bash and zsh in every
 * run-copy layout of `cli/test/helpers/run-copy-layouts.mjs`.
 *
 * **The rule these tests exist to enforce: the fence's opt-out command and `hc_main_root` agree on
 * the main checkout in every layout, and the command fails to silence — non-zero, nothing printed —
 * wherever `hc_main_root` refuses, wherever the main checkout holds the marker, and in a run copy on
 * a host without `jq`.** `cli/test/main-root-fallback.test.mjs` proves `hc_main_root`'s side. The
 * command is read out of the template at run time, so a template edit the test does not follow
 * fails here by name.
 *
 * Not covered: this repository's root `.claude/CLAUDE.md` and the worked example's copy. They are
 * renders whose sameness the scope register and Task 12 own.
 *
 * RED ONCE — 2026-10-29, the extracted command run with its registry `jq -e` step deleted in memory
 * (never in the template), then the variant removed from this file: `unregisteredClone` printed the
 * main checkout and exited 0 where a non-zero exit with empty stdout was expected.
 */

import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { WORKSPACE_ROOT, runBash } from './helpers/fixture.mjs';
import { buildRunCopyLayouts } from './helpers/run-copy-layouts.mjs';

const TEMPLATE = join(WORKSPACE_ROOT, 'cli', 'templates', 'claude', 'CLAUDE.md');
const LEAD_IN = 'Test it with the shell rather than by reading anything: ';
const MARKER = join('.claude', 'harness-no-offer');

const RESOLVED = ['main', 'worktree', 'registeredClone'];
const REFUSED = ['unregisteredClone', 'twoLineClone', 'selfClone'];
const LAYOUTS = [...RESOLVED, 'plain', ...REFUSED];

const output = (name, result) => `${name}: status ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`;

/** The first inline code span after {@link LEAD_IN}, which must occur exactly once. */
async function fenceCommand() {
  const text = await readFile(TEMPLATE, 'utf8');
  const parts = text.split(LEAD_IN);
  assert.equal(parts.length, 2, `${TEMPLATE}: the lead-in "${LEAD_IN}" must occur exactly once`);
  const span = /^[^`]*`([^`]*)`/.exec(parts[1]);
  assert.ok(span !== null && span[1] !== '', `${TEMPLATE}: no non-empty inline code span after the lead-in`);
  return span[1];
}

const SHELLS = {
  bash: (cwd, command, env) => runBash(cwd, ['-c', command], { [MAIN_REPO_ANCHOR_VARIABLE]: '', ...env }),
  zsh: (cwd, command, env) =>
    runBash(cwd, ['-c', 'exec zsh -f -c "$1"', '_', command], { [MAIN_REPO_ANCHOR_VARIABLE]: '', ...env }),
};

function assertPrints(name, result, path) {
  assert.equal(result.status, 0, output(name, result));
  assert.equal(result.stdout, `${path}\n`, output(name, result));
}

function assertSilent(name, result) {
  assert.notEqual(result.status, 0, output(name, result));
  assert.equal(result.stdout, '', output(name, result));
}

test('the template fence opt-out command in every run-copy layout', async (t) => {
  const command = await fenceCommand();
  const l = await buildRunCopyLayouts(t);
  const expected = (name) => (RESOLVED.includes(name) ? l.main : name === 'plain' ? l.plain : null);

  const shimRoot = await realpath(await mkdtemp(join(tmpdir(), 'task-offer-fence-')));
  t.after(() => rm(shimRoot, { recursive: true, force: true }));
  await writeFile(join(shimRoot, 'jq'), '#!/bin/sh\nexit 127\n');
  await chmod(join(shimRoot, 'jq'), 0o755);
  const noJq = { PATH: `${shimRoot}:${process.env.PATH}` };

  const zshProbe = await runBash(l.root, ['-c', 'command -v zsh']);

  for (const [shell, runIn] of Object.entries(SHELLS)) {
    await t.test(shell, async (s) => {
      if (shell === 'zsh' && zshProbe.status !== 0) {
        s.skip('zsh is not on PATH (`command -v zsh` failed), so the zsh leg was not run');
        return;
      }
      const run = (name, env = {}) => runIn(l[name], command, env);

      await s.test('no marker anywhere', async () => {
        for (const name of LAYOUTS) {
          const want = expected(name);
          if (want === null) assertSilent(name, await run(name));
          else assertPrints(name, await run(name), want);
        }
      });

      await s.test("the main checkout's marker silences every layout that resolved it", async (c) => {
        await mkdir(join(l.main, '.claude'), { recursive: true });
        await writeFile(join(l.main, MARKER), '');
        c.after(() => rm(join(l.main, MARKER), { force: true }));
        for (const name of RESOLVED) assertSilent(name, await run(name));
        assertPrints('plain', await run('plain'), l.plain);
      });

      await s.test("a run copy's own marker silences nothing", async (c) => {
        await mkdir(join(l.registeredClone, '.claude'), { recursive: true });
        await writeFile(join(l.registeredClone, MARKER), '');
        c.after(() => rm(join(l.registeredClone, MARKER), { force: true }));
        assertPrints('registeredClone', await run('registeredClone'), l.main);
      });

      await s.test('jq off PATH silences a run copy only', async () => {
        for (const name of ['main', 'worktree', 'plain']) assertPrints(name, await run(name, noJq), expected(name));
        assertSilent('registeredClone', await run('registeredClone', noJq));
      });
    });
  }
});
