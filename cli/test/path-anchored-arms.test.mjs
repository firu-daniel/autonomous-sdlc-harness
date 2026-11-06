/**
 * The path-anchored arms `plugin/hooks/lib/harness-config-lib.sh` → `hc_path_anchored_patterns`
 * builds, as the four allow-only guards apply them — `allow-safe-compounds.sh`,
 * `allow-qa-credentials-read.sh`, `git-rewrite-branch-guard.sh` and
 * `autonomous-script-allowlist-guard.sh` — fed real `PreToolUse` payloads on stdin against
 * throwaway repositories: a main checkout, a linked worktree and a `git clone --shared` run copy.
 *
 * **The rule these tests exist to enforce: a path-anchored arm grants no `cd` or tail-free
 * `--prefix` directory the shell resolves outside the workspace — through `..`, an expansion, a
 * quote, a second `cd` operand or a subcommand inside the wildcard, from the main checkout or from a
 * run copy — and every ordinary sibling, run-copy and redirect spelling keeps its allow, in all four
 * allow-only guards.** A hole case asserts SILENT (exit 0, nothing printed); a keeper asserts one
 * JSON object whose `permissionDecision` is `allow`. The ids are `docs/guard-verification.md` §2.4
 * row `(m)`'s.
 *
 * Not covered: what the executing shell then does with a granted `cd` — the guard is a string test,
 * and zsh's two-operand `cd` is recorded in `docs/guard-verification.md` §2.4 row `(m)`, not
 * asserted here; the symlink residual, which is open by design, so a test asserting it would lock a
 * hole in; and the scoped-`appDir` and cost rows, which `docs/guard-verification.md` carries.
 *
 * RED ONCE — 2026-11-07, on branch `fix_sibling_glob_traversal` before Task 2's fix to
 * `hc_path_anchored_patterns`: `tests 35`, `pass 13`, `fail 22`. Every hole case failed, an `allow`
 * object printed where silence was expected — m1, m2, m3, m4, m10, m11, m12, m13, m14, m15, m16,
 * m17, m18, m19, m20, m21, m23, m24, m25, m26, m27 — and the parent test failed with them. Every
 * keeper case passed: m28 through m38 through `allow-safe-compounds.sh`, and m28 and m33 through
 * `git-rewrite-branch-guard.sh`.
 */

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { WORKSPACE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const guard = (name) => join(WORKSPACE_ROOT, 'plugin', 'hooks', `${name}.sh`);
const COMPOUNDS = guard('allow-safe-compounds');
const CREDENTIALS = guard('allow-qa-credentials-read');
const REWRITE = guard('git-rewrite-branch-guard');
const SCRIPT_ALLOWLIST = guard('autonomous-script-allowlist-guard');

const configFor = (projectName, appDir) => ({
  version: 1,
  projectName,
  defaultBranch: 'main',
  protectedBranches: ['main'],
  appDir,
  stateDir: 'sdlc-harness',
  scriptsDir: 'packages/storefront/scripts',
  commands: { depInstall: 'npm ci', test: 'npm test' },
  phases: { qa: true },
  qa: { credentialsPath: '.claude/qa-accounts.env' },
});

const FILES = {
  'tracked.txt': 'tracked\n',
  'packages/storefront/scripts/typecheck.sh': '#!/usr/bin/env bash\nexit 0\n',
  '.claude/qa-accounts.env': 'ACCOUNT_1=probe\n',
};

const output = (result) => `${result.stdout}\n${result.stderr}`;

const runGuard = (script, command, cwd) =>
  runBash(cwd, ['-c', 'printf %s "$1" | bash "$2"', '_', JSON.stringify({ tool_input: { command }, cwd }), script]);

const assertSilent = (result) => {
  assert.equal(result.status, 0, output(result));
  assert.equal(result.stdout, '', output(result));
};

const assertAllowed = (result) => {
  assert.equal(result.status, 0, output(result));
  const decision = JSON.parse(result.stdout);
  assert.equal(decision.hookSpecificOutput?.permissionDecision, 'allow', output(result));
};

/** A committed checkout at `dir` carrying `config` and {@link FILES}, with HEAD on `feat_probe`. */
async function seed(dir, config) {
  await mkdir(dir, { recursive: true });
  await runGit(dir, ['init', '--quiet', '-b', 'main']);
  await runGit(dir, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(dir, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(dir, 'harness.config.json'), `${JSON.stringify(config)}\n`);
  for (const [rel, content] of Object.entries(FILES)) {
    await mkdir(dirname(join(dir, rel)), { recursive: true });
    await writeFile(join(dir, rel), content);
  }
  await runGit(dir, ['add', 'harness.config.json', ...Object.keys(FILES)]);
  await runGit(dir, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_probe']);
}

test('path-anchored arms: hole spellings are silent and ordinary spellings keep their allow', async (t) => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'harness-path-arms-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const workRoot = join(root, 'work');
  const repo = join(workRoot, 'acme-shop');
  const W = join(workRoot, 'acme-shop-feat_x');
  const copy = join(workRoot, 'acme-shop-run_x');
  const dotshop = join(workRoot, 'dotshop');
  const outside = join(root, 'outside');

  await seed(repo, configFor('acme-shop', 'packages/storefront'));
  await seed(dotshop, configFor('dotshop', '.'));
  await mkdir(outside);
  await runGit(repo, ['worktree', 'add', '--quiet', '-b', 'feat_x', W]);
  await runGit(workRoot, ['clone', '--quiet', '--shared', repo, copy]);

  const m1 = (tail) => `git -C ${repo} status && cd ${workRoot}/acme-shop-x/../../outside && ${tail}`;
  const m10 = (tail) => `git -C ${copy} status && cd ${copy}/../../outside && ${tail}`;
  const sibling = (suffix) => `git -C ${repo} status && cd ${workRoot}/acme-shop-x${suffix} && ls`;

  /** [id, guard, command, cwd] — each must be SILENT. */
  const holes = [
    ['m1', COMPOUNDS, m1('npm ci'), repo],
    ['m2', COMPOUNDS, `git status && npm --prefix ${workRoot}/acme-shop-x/../../outside/packages/storefront`, repo],
    ['m3', CREDENTIALS, m1('cat .claude/qa-accounts.env'), repo],
    ['m4', REWRITE, m1('git rm x.txt'), repo],
    ['m10', COMPOUNDS, m10('ls'), copy],
    ['m11', COMPOUNDS, m10('npm ci'), copy],
    [
      'm12',
      SCRIPT_ALLOWLIST,
      `git -C ${copy} status && cd ${copy}/packages/storefront/scripts/../../../../../outside && bash packages/storefront/scripts/typecheck.sh`,
      copy,
    ],
    ['m13', CREDENTIALS, m10('cat .claude/qa-accounts.env'), copy],
    ['m14', REWRITE, m10('git rm x.txt'), copy],
    ['m15', COMPOUNDS, sibling('/${x}../../outside'), repo],
    ['m16', COMPOUNDS, sibling('/$(:)../../outside'), repo],
    ['m17', COMPOUNDS, sibling('"/../../outside"'), repo],
    ['m18', COMPOUNDS, sibling('/..'), repo],
    ['m19', COMPOUNDS, sibling('/./../../outside'), repo],
    ['m20', COMPOUNDS, sibling('/../../outside/'), repo],
    ['m21', COMPOUNDS, sibling('/$X'), repo],
    ['m23', COMPOUNDS, `git status && npm --prefix ${workRoot}/dotshop-x install left-pad`, dotshop],
    ['m24', COMPOUNDS, `git status && npm --prefix ${workRoot}/acme-shop-x exec curl /packages/storefront`, repo],
    ['m25', COMPOUNDS, `git -C ${repo} status && cd ${repo} ${outside} && npm ci`, repo],
    ['m26', COMPOUNDS, `git -C ${repo} status && cd ${repo} .. && ls`, repo],
    ['m27', COMPOUNDS, `git -C ${repo} status && cd ${repo}/packages/storefront ${outside} && ls`, repo],
  ];

  /** [id, command, cwd] — each must be `allow` from `allow-safe-compounds.sh`. */
  const keepers = [
    ['m28', `cd ${W} && git status`, repo],
    ['m29', `git -C ${W} status --short`, repo],
    ['m30', `git -C ${repo} status && npm --prefix ${W}/packages/storefront`, repo],
    ['m31', `git -C ${repo} status && cd ${W}/packages/storefront && ls`, repo],
    ['m32', `git -C ${repo} status && cd ${workRoot}/acme-shop-x/..foo && ls`, repo],
    ['m33', `cd ${copy} && git status`, copy],
    ['m34', `git -C ${copy} status && cd ${copy}/packages/storefront && ls`, copy],
    ['m35', `git -C ${copy} status && npm --prefix ${copy}/packages/storefront`, copy],
    ['m36', `git -C ${repo} status && cd ${repo} 2>/dev/null && ls`, repo],
    ['m37', `git status && npm --prefix ${workRoot}/dotshop-x`, dotshop],
    ['m38', `git -C ${repo} status && cd ${repo}/packages/storefront && npm ci`, repo],
  ];

  /** Keepers also driven through `git-rewrite-branch-guard.sh` with `&& rm tracked.txt` appended. */
  const rewriteKeepers = new Set(['m28', 'm33']);

  for (const [id, script, command, cwd] of holes) {
    await t.test(`${id} hole, ${script.slice(script.lastIndexOf('/') + 1)}: silent`, async () => {
      assertSilent(await runGuard(script, command, cwd));
    });
  }

  for (const [id, command, cwd] of keepers) {
    await t.test(`${id} keeper, allow-safe-compounds.sh: allow`, async () => {
      assertAllowed(await runGuard(COMPOUNDS, command, cwd));
    });
    if (rewriteKeepers.has(id)) {
      await t.test(`${id} keeper, git-rewrite-branch-guard.sh: allow`, async () => {
        assertAllowed(await runGuard(REWRITE, `${command} && rm tracked.txt`, cwd));
      });
    }
  }
});
