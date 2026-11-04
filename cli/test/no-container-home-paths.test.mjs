/**
 * No file in the tree names the Gate 15 container user's home.
 *
 * **The rule this test exists to enforce: no file in this repository spells the home directory of
 * the user Gate 15's container recipe creates, because inside that container `$HOME` is that
 * directory and gate 6a fails on any spelling of it** (`docs/sandbox-verification.md` §5 F14).
 * Allowed spellings: `~/` or `$HOME` in a shell line, `<home>` in prose and quoted output.
 *
 * The user is read from the recipe's `useradd -m -s /bin/bash <user>` line in a fenced block of
 * `docs/development.md`, and exactly one such line must exist, so a recipe change re-points the
 * guard rather than silencing it. The needle is joined at run time; this file never spells it.
 *
 * Gate 6a's `grep -rn "$HOME"` matches a bare substring, so this test does too: no boundary of
 * any kind narrows the match, and a longer user name sharing the prefix is a hit.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { WORKSPACE_ROOT } from './helpers/fixture.mjs';

const RECIPE_USER = /^useradd -m -s \/bin\/bash ([a-z_][a-z0-9_-]*)$/;

function recipeUsers() {
  const lines = readFileSync(join(WORKSPACE_ROOT, 'docs', 'development.md'), 'utf8').split('\n');
  const users = [];
  let fenced = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      fenced = !fenced;
      continue;
    }
    const match = fenced ? RECIPE_USER.exec(line) : null;
    if (match !== null) users.push(match[1]);
  }
  return users;
}

test("F14: no file in the tree names the Gate 15 container user's home", () => {
  const users = recipeUsers();
  assert.equal(users.length, 1, `expected one recipe useradd line in docs/development.md, found ${users.length}`);
  const needle = ['', 'home', users[0]].join('/');

  const listing = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const hits = [];
  for (const path of listing.split('\0')) {
    if (path === '') continue;
    let stats;
    try {
      stats = lstatSync(join(WORKSPACE_ROOT, path));
    } catch {
      continue;
    }
    if (!stats.isFile()) continue;
    const lines = readFileSync(join(WORKSPACE_ROOT, path), 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes(needle)) hits.push(`${path}:${index + 1}`);
    });
  }

  assert.deepEqual(hits, [], `files naming the container user's home:\n${hits.join('\n')}`);
});
