/**
 * Gate 16's check: `scripts/check-shell-parse.sh`, which `scripts/run-gates.sh` runs as
 * `16 shell scripts parse` (`docs/development.md` §5, gate 16).
 *
 * **The rule this suite enforces: every `*.sh`, and every extensionless file on a bash shebang, that
 * git lists as tracked or as untracked and not ignored is checked with `bash -n`; a file that does
 * not parse fails the check, is named on stderr with bash's own error line, and every such file is
 * reported; a tree in which every file parses passes; an ignored file is never checked; and the file
 * set is git's, never the caller's arguments.**
 *
 * The check places its repository from its own location, so every case runs a **copy** of it,
 * inside a throwaway repository under `os.tmpdir()`. `WORKSPACE_ROOT` is only the copy
 * source; no case runs the check there.
 *
 * This repository's own `scripts/typecheck.sh` runs the check too, and the last case below runs a
 * copy of it beside the check, with a `package.json` whose `build` script exits with a status the
 * case chooses, so its verdict rule is graded without a real build. That copy is this repository's,
 * hand-edited; the template `init` renders, `cli/templates/scripts/typecheck.sh`, carries no parse
 * step, and the suites that render it are untouched by this one.
 *
 * Deliberately not covered:
 * - `run-gates.sh` itself. A run of it is every automatable gate, `npm test` included, so a case
 *   driving it would run this suite inside itself. Its gate-16 block is a `gate` call on this
 *   check, graded by the same exit status these cases assert, plus the line printing the check's
 *   closing summary on a pass.
 * - A construct only bash 3.2 refuses. Which interpreter the check picks is the host's `/bin/bash`,
 *   so such a case would assert one thing on macOS and the opposite on a Linux runner. The syntax
 *   errors planted below are refused by every bash version. Each case asserts the interpreter the
 *   summary line names, so a change to that choice still fails here.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chmod, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runGit, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const CHECK = join('scripts', 'check-shell-parse.sh');
const EXPECTED_INTERPRETER = existsSync('/bin/bash') ? '/bin/bash' : 'bash';

const CLEAN_SH = '#!/usr/bin/env bash\nset -u\nif true; then\n  echo ok\nfi\n';
const BROKEN_SH = '#!/usr/bin/env bash\nif true; then\n  echo missing fi\n';
const CLEAN_HOOK = '#!/usr/bin/env bash\ncase "$1" in\n  main) exit 1 ;;\nesac\n';
const BROKEN_HOOK = '#!/bin/bash\nwhile true; do\n  echo no done\n';
const NOT_BASH = '#!/usr/bin/env python3\nif True:\n    print("this is not bash (\n';

/**
 * A throwaway repository holding a copy of the check, with `tracked` written and added to the index
 * and `untracked` written only. The copy is tracked unless `trackCheck` is false, in which case it
 * is left untracked — and, untracked and not ignored, it is still listed. Torn down when the case
 * ends.
 */
async function repoWith(t, { tracked = {}, untracked = {}, trackCheck = true } = {}) {
  const { dir, cleanup } = await createFixture({ remote: false });
  t.after(cleanup);
  await mkdir(join(dir, 'scripts'), { recursive: true });
  await cp(join(WORKSPACE_ROOT, CHECK), join(dir, CHECK));
  for (const [path, text] of Object.entries({ ...tracked, ...untracked })) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), text, 'utf8');
  }
  const add = [...(trackCheck ? [CHECK] : []), ...Object.keys(tracked)];
  if (add.length > 0) await runGit(dir, ['add', '--', ...add]);
  return dir;
}

/** The check's closing stdout line, parsed; fails the case if it is missing or malformed. */
function summary(stdout) {
  const lines = stdout.trimEnd().split('\n');
  const last = lines.at(-1);
  const match = /^check-shell-parse: (\d+) files checked with (\S+) \(bash (.+)\), (\d+) failed$/.exec(last);
  assert.ok(match, `no summary line as the last stdout line: ${JSON.stringify(stdout)}`);
  return { checked: Number(match[1]), interpreter: match[2], version: match[3], failed: Number(match[4]) };
}

function interpreterMatches(interpreter) {
  if (EXPECTED_INTERPRETER === '/bin/bash') return interpreter === '/bin/bash';
  return interpreter.endsWith('/bash');
}

test('a tree whose shell scripts all parse passes, and the hook family is checked', async (t) => {
  const dir = await repoWith(t, {
    tracked: {
      'lib/clean.sh': CLEAN_SH,
      'githooks/pre-push': CLEAN_HOOK,
      'tools/report.py': NOT_BASH,
      'README.md': '# not a script\n',
    },
  });
  // Invoked from a subdirectory: the check anchors itself, never the caller's directory.
  const run = await runBash(join(dir, 'lib'), [join(dir, CHECK)]);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, '');
  const result = summary(run.stdout);
  // The check itself, lib/clean.sh and githooks/pre-push; neither the Python file nor the README.
  assert.equal(result.checked, 3);
  assert.equal(result.failed, 0);
  assert.ok(interpreterMatches(result.interpreter), `unexpected interpreter ${result.interpreter}`);
  assert.notEqual(result.version, 'unknown');
});

test('a tracked .sh that does not parse fails the check and is named with bash\'s error line', async (t) => {
  const dir = await repoWith(t, {
    tracked: { 'lib/clean.sh': CLEAN_SH, 'lib/broken.sh': BROKEN_SH },
  });
  const run = await runBash(dir, [CHECK]);
  assert.equal(run.status, 1, run.stdout);
  const lines = run.stderr.split('\n');
  const header = lines.indexOf('check-shell-parse: lib/broken.sh does not parse');
  assert.notEqual(header, -1, `the failing file is not named: ${run.stderr}`);
  assert.match(lines[header + 1] ?? '', /^ {2}lib\/broken\.sh: line \d+: syntax error/, run.stderr);
  assert.ok(!run.stderr.includes('lib/clean.sh'), `a file that parses was named: ${run.stderr}`);
  const result = summary(run.stdout);
  assert.equal(result.checked, 3);
  assert.equal(result.failed, 1);
});

test('every failing file is reported, a bash-shebang hook and an untracked script included; non-bash files are not', async (t) => {
  const dir = await repoWith(t, {
    tracked: {
      'a/first.sh': BROKEN_SH,
      'b/second.sh': BROKEN_SH,
      'githooks/pre-push': BROKEN_HOOK,
      'tools/report.py': NOT_BASH,
      'tools/no-shebang': 'if true; then\n',
    },
    untracked: { 'scratch/untracked.sh': BROKEN_SH },
  });
  const run = await runBash(dir, [CHECK]);
  assert.equal(run.status, 1, run.stdout);
  for (const path of ['a/first.sh', 'b/second.sh', 'githooks/pre-push', 'scratch/untracked.sh']) {
    assert.ok(run.stderr.includes(`check-shell-parse: ${path} does not parse`), `${path} not named: ${run.stderr}`);
  }
  for (const path of ['tools/report.py', 'tools/no-shebang']) {
    assert.ok(!run.stderr.includes(path), `${path} was checked: ${run.stderr}`);
  }
  const result = summary(run.stdout);
  assert.equal(result.checked, 5);
  assert.equal(result.failed, 4);
});

test('a git-ignored script is never checked, and an untracked check copy counts itself', async (t) => {
  const dir = await repoWith(t, {
    tracked: { '.gitignore': 'ignored/\n', 'lib/clean.sh': CLEAN_SH },
    untracked: { 'ignored/broken.sh': BROKEN_SH },
    trackCheck: false,
  });
  const run = await runBash(dir, [CHECK]);
  assert.equal(run.status, 0, run.stderr);
  assert.ok(!run.stderr.includes('ignored/broken.sh'), `an ignored file was checked: ${run.stderr}`);
  // lib/clean.sh and the untracked, unignored copy of the check itself.
  assert.equal(summary(run.stdout).checked, 2);
});

test('odd paths: a space is named whole, a leading dash is not an option, a deleted file is passed over', async (t) => {
  const dir = await repoWith(t, {
    tracked: { 'dir with space/a b.sh': BROKEN_SH, 'gone.sh': CLEAN_SH, '-lead.sh': CLEAN_SH },
  });
  await rm(join(dir, 'gone.sh'));
  const run = await runBash(dir, [CHECK]);
  assert.equal(run.status, 1, run.stdout);
  assert.ok(
    run.stderr.includes('check-shell-parse: dir with space/a b.sh does not parse'),
    `the spaced path is not named whole: ${run.stderr}`,
  );
  assert.ok(!run.stderr.includes('gone.sh'), `a deleted file was checked: ${run.stderr}`);
  assert.ok(!run.stderr.includes('-lead.sh'), `a dash-leading file failed: ${run.stderr}`);
  const result = summary(run.stdout);
  // The check itself, the spaced path and -lead.sh.
  assert.equal(result.checked, 3);
  assert.equal(result.failed, 1);
});

test('a checked file is parsed and never run, even when it is executable', async (t) => {
  const marker = 'ran.marker';
  const dir = await repoWith(t, {
    tracked: { 'lib/side-effect.sh': `#!/usr/bin/env bash\ntouch ${marker}\n` },
  });
  await chmod(join(dir, 'lib/side-effect.sh'), 0o755);
  const run = await runBash(dir, [CHECK]);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(existsSync(join(dir, marker)), false, 'the checked file was executed');
});

test('the file set is not the caller\'s: any argument is refused with exit 2', async (t) => {
  const dir = await repoWith(t, { tracked: { 'lib/broken.sh': BROKEN_SH } });
  const run = await runBash(dir, [CHECK, 'lib/clean.sh']);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^check-shell-parse: expected no arguments$/m);
  assert.equal(run.stdout, '');
});

test('a listing with no shell script in it fails rather than passing on nothing checked', async (t) => {
  // The check's own copy is ignored here, or it would be listed as an untracked script.
  const dir = await repoWith(t, {
    tracked: { '.gitignore': 'scripts/\n', 'README.md': '# none\n' },
    trackCheck: false,
  });
  const run = await runBash(dir, [CHECK]);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /listed no shell script, so nothing was checked/);
  assert.equal(summary(run.stdout).checked, 0);
});

test("this repository's typecheck.sh runs the check, and its verdict fails when either step fails", async (t) => {
  const TYPECHECK = join('scripts', 'typecheck.sh');
  // Prints the arguments it was handed, so the case can see where a caller's argument lands.
  const BUILD =
    'node -e "console.log(\'build-args:\' + process.argv.slice(1).join(\',\')); process.exit(Number(process.env.FIXTURE_BUILD_STATUS || 0))"';
  const dir = await repoWith(t, {
    tracked: {
      'package.json': `${JSON.stringify({ name: 'fixture', private: true, scripts: { build: BUILD } })}\n`,
      'lib/clean.sh': CLEAN_SH,
    },
  });
  await cp(join(WORKSPACE_ROOT, TYPECHECK), join(dir, TYPECHECK));
  const typecheck = (status, args = []) =>
    runBash(dir, [TYPECHECK, ...args], { FIXTURE_BUILD_STATUS: String(status) });

  const clean = await typecheck(0);
  assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);
  assert.match(clean.stdout, /^check-shell-parse: \d+ files checked with .*, 0 failed$/m);
  assert.match(clean.stdout, /^PASS: typecheck$/m);

  // A caller's argument reaches the build line alone: the parse check, which refuses any argument,
  // never sees it.
  const forwarded = await typecheck(0, ['x']);
  assert.equal(forwarded.status, 0, `${forwarded.stdout}\n${forwarded.stderr}`);
  assert.match(forwarded.stdout, /^PASS: typecheck$/m);
  assert.match(forwarded.stdout, /^build-args:x$/m);
  assert.ok(!forwarded.stderr.includes('expected no arguments'), forwarded.stderr);

  await writeFile(join(dir, 'lib/broken.sh'), BROKEN_SH, 'utf8');
  const parseOnly = await typecheck(0);
  assert.equal(parseOnly.status, 1, parseOnly.stdout);
  assert.ok(parseOnly.stderr.includes('check-shell-parse: lib/broken.sh does not parse'), parseOnly.stderr);
  assert.match(parseOnly.stdout, /^FAIL: typecheck \(exit 1\)$/m);

  // Both failed: the build's status wins.
  const both = await typecheck(3);
  assert.equal(both.status, 3, both.stdout);
  assert.match(both.stdout, /^FAIL: typecheck \(exit 3\)$/m);
});
