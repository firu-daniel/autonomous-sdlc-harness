/**
 * `plugin/hooks/git-trust-file-guard.sh`, the `PreToolUse` guard registered under
 * `Edit|Write|NotebookEdit`, fed real payloads on stdin against a real `git init` repository.
 *
 * **The rule these tests exist to enforce: an `Edit`, `Write` or `NotebookEdit` whose target is
 * `.git/commondir`, `.git/config.worktree` or `.git/objects/info/http-alternates`, or a path under
 * one, is refused with one JSON `deny` object naming the path as given — whether the path is
 * written relative, with `..`, through a symlinked parent, through a symlinked leaf, with a
 * trailing `/` or in another case; every other path gets silence (exit 0, nothing printed); and a
 * payload the guard cannot read — not JSON, no usable path field, an unknown `tool_name` — is
 * refused rather than silenced.** On a bubblewrap host the run copy's own trio `Edit` rules are
 * dropped, so this guard is the only thing between a file tool and those three files there.
 *
 * Not covered: the missing-`jq` and too-old-`jq` refusals, which need a `PATH` without `jq` that
 * still holds `bash`, and a `readlink` that fails or a symlink chain past the hop limit; the guard's
 * own `REPRO` block reproduces those by hand. Whether Claude Code honours the `deny` for a file
 * tool is the harness's, not a subprocess's, to show (`docs/guard-verification.md` §2.3).
 *
 * RED ONCE — 2026-10-31, before the shipped guard existed, against a throwaway reference guard with
 * `shopt -s nocasematch` removed and its symlinked-leaf loop disabled: every `upperCase` and every
 * symlinked-leaf case failed (13 of 83), stdout empty where a `deny` object was expected; the
 * intact reference passed all 83.
 */

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { WORKSPACE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const GUARD = join(WORKSPACE_ROOT, 'plugin', 'hooks', 'git-trust-file-guard.sh');

const TOOLS = ['Edit', 'Write', 'NotebookEdit'];
const TRIO = ['.git/commondir', '.git/config.worktree', '.git/objects/info/http-alternates'];

const output = (result) => `${result.stdout}\n${result.stderr}`;

/** The payload shape Claude Code sends for `tool`: `notebook_path` for `NotebookEdit`, else `file_path`. */
const payloadFor = (tool, path, cwd) =>
  JSON.stringify({
    tool_name: tool,
    tool_input: tool === 'NotebookEdit' ? { notebook_path: path } : { file_path: path },
    cwd,
  });

const runGuard = (dir, payload) => runBash(dir, ['-c', 'printf %s "$1" | bash "$2"', '_', payload, GUARD]);

const assertDenied = (result, fragment) => {
  assert.equal(result.status, 0, output(result));
  const decision = JSON.parse(result.stdout);
  assert.equal(decision.hookSpecificOutput?.hookEventName, 'PreToolUse', output(result));
  assert.equal(decision.hookSpecificOutput?.permissionDecision, 'deny', output(result));
  const reason = decision.hookSpecificOutput?.permissionDecisionReason;
  assert.equal(typeof reason, 'string', output(result));
  if (fragment !== undefined) assert.ok(reason.includes(fragment), `reason lacks ${fragment}: ${reason}`);
};

const assertSilent = (result) => {
  assert.equal(result.status, 0, output(result));
  assert.equal(result.stdout, '', output(result));
};

test('git-trust-file-guard decisions', async (t) => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'harness-trust-guard-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = join(root, 'repo');
  await mkdir(repo);
  await runGit(repo, ['init', '-q']);
  await mkdir(join(repo, '.git', 'objects', 'info'), { recursive: true });
  await mkdir(join(repo, 'sub'));
  await mkdir(join(repo, 'notes'));
  await writeFile(join(repo, 'index.ts'), 'export {};\n');
  const gitLink = join(root, 'git-link');
  await symlink(join(repo, '.git'), gitLink);
  await symlink('.git/config.worktree', join(repo, 'innocent'));

  for (const tool of TOOLS) {
    for (const trio of TRIO) {
      const leaf = trio.slice('.git/'.length);
      const forms = {
        plain: join(repo, trio),
        under: `${join(repo, trio)}/x`,
        dotdot: `${repo}/sub/../${trio}`,
        symlinkedParent: `${gitLink}/${leaf}`,
        trailingSlash: `${join(repo, trio)}/`,
        upperCase: `${repo}/${trio.toUpperCase()}`,
      };
      for (const [form, path] of Object.entries(forms)) {
        await t.test(`${tool} ${trio}, ${form}: deny`, async () => {
          assertDenied(await runGuard(repo, payloadFor(tool, path, repo)), path);
        });
      }
    }

    await t.test(`${tool} through a symlinked leaf to .git/config.worktree: deny`, async () => {
      const path = join(repo, 'innocent');
      assertDenied(await runGuard(repo, payloadFor(tool, path, repo)), path);
    });

    await t.test(`${tool} relative .git/commondir resolved against cwd: deny`, async () => {
      assertDenied(await runGuard(root, payloadFor(tool, '.git/commondir', repo)), '.git/commondir');
    });

    const allowed = {
      'config.worktree.bak': join(repo, '.git', 'config.worktree.bak'),
      'commondir outside .git': join(repo, 'commondir'),
      'http-alternates outside .git': join(repo, 'notes', 'http-alternates'),
      'a linked worktree record': join(repo, '.git', 'worktrees', 'w', 'commondir'),
      'an ordinary source file': join(repo, 'index.ts'),
    };
    for (const [name, path] of Object.entries(allowed)) {
      await t.test(`${tool} ${name}: silent`, async () => {
        assertSilent(await runGuard(repo, payloadFor(tool, path, repo)));
      });
    }
  }

  const ordinary = join(repo, 'index.ts');
  const malformed = {
    'non-JSON text': 'not json at all',
    'an empty object': '{}',
    'a missing file_path': JSON.stringify({ tool_name: 'Write', tool_input: {}, cwd: repo }),
    'a numeric file_path': JSON.stringify({ tool_name: 'Write', tool_input: { file_path: 7 }, cwd: repo }),
    'an empty file_path': JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '' }, cwd: repo }),
    'a NotebookEdit carrying file_path only': JSON.stringify({
      tool_name: 'NotebookEdit',
      tool_input: { file_path: ordinary },
      cwd: repo,
    }),
    'an unknown tool_name': payloadFor('Read', ordinary, repo),
  };
  for (const [name, payload] of Object.entries(malformed)) {
    await t.test(`malformed input, ${name}: deny`, async () => {
      assertDenied(await runGuard(repo, payload));
    });
  }
});
