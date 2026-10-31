/**
 * The change-request fence's opt-out script, `cli/templates/scripts/task-offer-check.sh`, run under
 * bash and zsh in every run-copy layout of `cli/test/helpers/run-copy-layouts.mjs`, and the template
 * fence item that names it (`cli/templates/claude/CLAUDE.md` → item **4. Opt-out.**).
 *
 * **The rule these tests exist to enforce: the fence's opt-out script answers as the #214 one-liner
 * did in every listed layout, under bash and zsh, whether or not `HARNESS_MAIN_REPO` is set — the
 * main checkout and exit 0 only where it resolved one and found no marker there, and otherwise a
 * non-zero exit with nothing on stdout — and refuses the one accepted stricter case.** That stricter
 * case — a registered clone carrying a `config.worktree` or a `.git/config` key outside the clone
 * allow-list, where the one-liner offered — is the user's decision
 * (`harness-runs/clarifications/fix_task_offer_check_script/answered/answer_1.md`, Q2 (a)). The
 * template item must name the script through `{{taskOfferCheckCommand}}` and carry no inline shell.
 *
 * Not covered: this repository's root `.claude/` renders and the worked example's. They are Tasks
 * 8–9's pastes, applied by the maintainer.
 *
 * RED ONCE — 2026-10-30, each mutation made only on a throwaway copy of the script and `lib/` under
 * the system temp root (or of the template text in memory), run once against a scratch copy of this
 * file pointed at it, and never committed:
 * - the anchor case: the copy printing `HARNESS_MAIN_REPO` and exiting 0 when it is set — the
 *   anchored run differed from the unanchored one in every layout case and the no-git case.
 * - the unregistered clone and the stricter case: `hr_clone_target_check_var` replaced by `true` in
 *   the copy — `unregisteredClone`, both planted clones and the jq-less `registeredClone` printed the
 *   main checkout and exited 0.
 * - `twoLineClone`: the copy's `alternates` line-count refusals dropped stayed green, because
 *   `hr_clone_target_check_var` refuses a second `alternates` line too; dropped together with that
 *   call, `twoLineClone` printed the main checkout and exited 0.
 * - the marker case: the copy's `harness-no-offer` test removed — `main` printed itself with the
 *   marker present.
 * - the template case: `` `$(git rev-parse --show-toplevel)` `` reinserted into the item in memory —
 *   the template test failed.
 */

import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { WORKSPACE_ROOT, runBash, runGit } from './helpers/fixture.mjs';
import { buildRunCopyLayouts, createRegisteredClone } from './helpers/run-copy-layouts.mjs';

const TEMPLATE = join(WORKSPACE_ROOT, 'cli', 'templates', 'claude', 'CLAUDE.md');
const SCRIPT = join(WORKSPACE_ROOT, 'cli', 'templates', 'scripts', 'task-offer-check.sh');
const MARKER = join('.claude', 'harness-no-offer');

const ITEM_START = '4. **Opt-out.**';
const TOKEN = '{{taskOfferCheckCommand}}';
const ALLOWED_SPANS = ['.claude/harness-no-offer', TOKEN];
const SHELL_SYNTAX = ['$(', '&&', '||', '|', ';', 'sed '];

const RESOLVED = ['main', 'worktree', 'registeredClone'];
const REFUSED = ['unregisteredClone', 'twoLineClone', 'selfClone'];
const LAYOUTS = [...RESOLVED, 'plain', ...REFUSED];

const output = (name, result) => `${name}: status ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`;

/** `script` is run by bash in both legs; under `zsh` the invoking shell is zsh. */
const SHELLS = {
  bash: (cwd, script, args, env) => runBash(cwd, [script, ...args], env),
  zsh: (cwd, script, args, env) =>
    runBash(cwd, ['-c', 'exec zsh -f -c \'bash "$@"\' _ "$@"', '_', script, ...args], env),
};

function assertPrints(name, result, path) {
  assert.equal(result.status, 0, output(name, result));
  assert.equal(result.stdout, `${path}\n`, output(name, result));
}

function assertSilent(name, result) {
  assert.notEqual(result.status, 0, output(name, result));
  assert.equal(result.stdout, '', output(name, result));
}

/** The `4. **Opt-out.**` list item, to the next blank line; it must occur exactly once. */
function optOutItem(text) {
  const parts = text.split(ITEM_START);
  assert.equal(parts.length, 2, `${TEMPLATE}: "${ITEM_START}" must occur exactly once`);
  return ITEM_START + parts[1].split('\n\n')[0];
}

test('the opt-out script in every run-copy layout', async (t) => {
  const l = await buildRunCopyLayouts(t);
  const expected = (name) => (RESOLVED.includes(name) ? l.main : name === 'plain' ? l.plain : null);

  const state = join(l.root, 'xdg-state');
  const configWorktreeClone = await createRegisteredClone(l.root, l.main, 'feat_cfgwt', state);
  await writeFile(join(configWorktreeClone, '.git', 'config.worktree'), '');
  const remoteKeyClone = await createRegisteredClone(l.root, l.main, 'feat_remote', state);
  await runGit(remoteKeyClone, ['config', 'branch.feat_remote.remote', 'origin']);

  const noGit = join(l.root, 'no-git');
  await mkdir(noGit);

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
      /** Runs once unanchored and once anchored at `plain`, asserts the two agree, returns the first. */
      const runAt = async (label, cwd, env = {}) => {
        const bare = await runIn(cwd, SCRIPT, [], env);
        const anchored = await runIn(cwd, SCRIPT, [], { ...env, [MAIN_REPO_ANCHOR_VARIABLE]: l.plain });
        assert.deepEqual(
          { status: anchored.status, stdout: anchored.stdout },
          { status: bare.status, stdout: bare.stdout },
          `${label}: the run with ${MAIN_REPO_ANCHOR_VARIABLE}=${l.plain} differs from the run without it\n` +
            `${output('without', bare)}\n${output('with', anchored)}`,
        );
        return bare;
      };
      const run = (name, env) => runAt(name, l[name], env);

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

      await s.test('a directory holding no repository is silent', async () => {
        assertSilent('no-git', await runAt('no-git', noGit));
      });

      await s.test('one argument is bad usage: exit 2, nothing on stdout', async () => {
        const result = await runIn(l.main, SCRIPT, ['x'], {});
        assert.equal(result.status, 2, output('main x', result));
        assert.equal(result.stdout, '', output('main x', result));
      });

      const why = ' — the accepted divergence from the #214 one-liner, which offered here';
      await s.test('the accepted stricter case: a registered clone with a config.worktree is silent', async () => {
        assertPrints('registeredClone', await run('registeredClone'), l.main);
        assertSilent(`registered clone with .git/config.worktree${why}`, await runAt('config.worktree', configWorktreeClone));
      });

      await s.test('the accepted stricter case: a registered clone with a branch remote key is silent', async () => {
        assertPrints('registeredClone', await run('registeredClone'), l.main);
        assertSilent(`registered clone with branch.feat_remote.remote${why}`, await runAt('branch remote', remoteKeyClone));
      });

      await s.test('a checkout predating the script is silent', async () => {
        assertSilent('plain, no scripts/', await runIn(l.plain, 'scripts/task-offer-check.sh', [], {}));
      });
    });
  }
});

test('the template fence item names the script and carries no inline shell', async () => {
  const item = optOutItem(await readFile(TEMPLATE, 'utf8'));
  assert.ok(!item.includes('``'), `${TEMPLATE}: the opt-out item uses a multi-backtick span:\n${item}`);
  const parts = item.split('`');
  assert.equal(parts.length % 2, 1, `${TEMPLATE}: the opt-out item has an unclosed code span:\n${item}`);
  const spans = parts.filter((_, i) => i % 2 === 1);

  assert.equal(item.split(TOKEN).length - 1, 1, `${TEMPLATE}: ${TOKEN} must occur exactly once in the opt-out item`);
  assert.equal(spans.filter((span) => span === TOKEN).length, 1, `${TEMPLATE}: ${TOKEN} must be an inline code span`);
  for (const span of spans) {
    assert.ok(ALLOWED_SPANS.includes(span), `${TEMPLATE}: unexpected code span in the opt-out item: \`${span}\``);
    for (const syntax of SHELL_SYNTAX) {
      assert.ok(!span.includes(syntax), `${TEMPLATE}: inline shell "${syntax}" in opt-out item span \`${span}\``);
    }
  }
});
