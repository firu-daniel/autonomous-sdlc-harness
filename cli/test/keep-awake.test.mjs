/**
 * The keep-awake host assessment — `cli/src/doctor/keepAwake.ts` → `needsLockProbe`,
 * `assessKeepAwake` and the constants the run library mirrors.
 *
 * **The rule this suite enforces: what a host needs to hold a sleep assertion for a run is declared
 * once, in `keepAwake.ts`, and the run library's copies are declared mirrors held equal here.**
 *
 * The module is imported compiled from `../dist/doctor/keepAwake.js`, so `npm run build` precedes
 * `npm test`. Every host fact is an argument: no case touches the host. The mirror case sources
 * `cli/templates/scripts/lib/harness-run-lib.sh` from the package's template tree.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  CAFFEINATE_ARGS,
  KEEP_AWAKE_WHAT,
  KEEP_AWAKE_WHO,
  LOGIND_POLKIT_ACTIONS,
  assessKeepAwake,
  needsLockProbe,
} from '../dist/doctor/keepAwake.js';
import { PACKAGE_ROOT, runBash } from './helpers/fixture.mjs';

const LIB_PATH = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');

/** One host per class, as `platform` and `kernelRelease`. */
const HOSTS = {
  macos: { platform: 'darwin', kernelRelease: '24.6.0' },
  linux: { platform: 'linux', kernelRelease: '6.8.0-45-generic' },
  wsl2: { platform: 'linux', kernelRelease: '5.15.153.1-microsoft-standard-WSL2' },
  wsl1: { platform: 'linux', kernelRelease: '4.4.0-19041-Microsoft' },
  unsupported: { platform: 'win32', kernelRelease: '10.0.19045' },
};

function facts(host, extra = {}) {
  return { ...HOSTS[host], enabled: true, githubActions: false, ...extra };
}

/** Every arm of `assessKeepAwake`, first match wins: facts, expected answer and host, remedy fragments. */
const ROWS = [
  ['disabled beats every host', facts('linux', { enabled: false, githubActions: true }), 'off', 'linux', ['`execution.keepAwake` is false', 'suspends it until wake']],
  ['GitHub Actions runner', facts('macos', { githubActions: true, caffeinatePath: '/usr/bin/caffeinate' }), 'not-applicable', 'macos', ['GitHub Actions runner does not sleep', 'job mode holds nothing']],
  ['macOS with caffeinate', facts('macos', { caffeinatePath: '/usr/bin/caffeinate' }), 'can-hold', 'macos', ['`/usr/bin/caffeinate`', '`PreventSystemSleep`', '`caffeinate -s -i -w`', 'AC power only', 'on battery a closed lid still sleeps the Mac', 'resumes on wake', '`execution.keepAwake: false` turns the hold off']],
  ['macOS without caffeinate', facts('macos'), 'cannot-hold', 'macos', ['`/usr/bin/caffeinate`', 'put `/usr/bin` on the `PATH` the daemon runs with']],
  ['Linux without systemd-inhibit', facts('linux'), 'cannot-hold', 'linux', ['`systemd-inhibit` (systemd) is not on `PATH`', 'still launches, unheld']],
  ['Linux lock taken in the user manager', facts('linux', { systemdInhibitPath: '/usr/bin/systemd-inhibit', lock: { taken: true, context: 'user-manager', detail: '' } }), 'can-hold', 'linux', ["in the user manager the watcher's service runs under", 'only on mains power']],
  ['Linux lock taken from this shell', facts('linux', { systemdInhibitPath: '/usr/bin/systemd-inhibit', lock: { taken: true, context: 'this-shell', detail: '' } }), 'can-hold', 'linux', ["from this shell, not the watcher's service — the watcher's launch line is the authority there", 'only on mains power']],
  ['Linux lock refused', facts('linux', { systemdInhibitPath: '/usr/bin/systemd-inhibit', lock: { taken: false, context: 'user-manager', detail: 'Access denied' } }), 'cannot-hold', 'linux', ['Access denied', 'logind refused or did not answer', 'active local session', ...LOGIND_POLKIT_ACTIONS, 'logs one line']],
  ['WSL2', facts('wsl2', { systemdInhibitPath: '/usr/bin/systemd-inhibit' }), 'cannot-hold', 'wsl2', ['nothing can keep Windows awake', '"When I close the lid"', '"Do nothing"', '"Plugged in"', '`feat_wsl2_support`', '#160']],
  ['WSL1', facts('wsl1'), 'cannot-hold', 'wsl1', ['No sleep hold on this platform']],
  ['unsupported platform', facts('unsupported'), 'cannot-hold', 'unsupported', ['No sleep hold on this platform']],
];

test('assessKeepAwake answers every arm with its host and remedy', async (t) => {
  for (const [name, input, answer, host, fragments] of ROWS) {
    await t.test(name, () => {
      const assessment = assessKeepAwake(input);
      assert.equal(assessment.answer, answer);
      assert.equal(assessment.host, host);
      for (const fragment of fragments) assert.ok(assessment.sentence.includes(fragment), `${name}: missing ${fragment} in ${assessment.sentence}`);
    });
  }
});

test('every sentence is one line of ASCII apart from the em dash', () => {
  for (const [name, input] of ROWS) {
    const { sentence } = assessKeepAwake(input);
    assert.ok(!sentence.includes('\n'), `${name}: carries a newline`);
    assert.match(sentence.replaceAll('—', ''), /^[\x20-\x7e]*$/, `${name}: carries non-ASCII`);
  }
});

test('needsLockProbe is true exactly for an enabled, non-runner Linux host with systemd-inhibit', async (t) => {
  for (const enabled of [true, false]) {
    for (const githubActions of [true, false]) {
      for (const host of Object.keys(HOSTS)) {
        for (const tool of [true, false]) {
          const input = facts(host, { enabled, githubActions, ...(tool ? { systemdInhibitPath: '/usr/bin/systemd-inhibit' } : {}) });
          const expected = enabled && !githubActions && host === 'linux' && tool;
          await t.test(`enabled=${enabled} githubActions=${githubActions} host=${host} tool=${tool}`, () => {
            assert.equal(needsLockProbe(input), expected);
          });
        }
      }
    }
  }
});

test('the run library mirrors KEEP_AWAKE_WHO, KEEP_AWAKE_WHAT and CAFFEINATE_ARGS', async () => {
  const result = await runBash(PACKAGE_ROOT, ['-c', `. "$1"; printf '%s\\n%s\\n' "$HR_KEEP_AWAKE_WHO" "$HR_KEEP_AWAKE_WHAT"`, '_', LIB_PATH]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.split('\n').slice(0, 2), [KEEP_AWAKE_WHO, KEEP_AWAKE_WHAT]);
  assert.ok(readFileSync(LIB_PATH, 'utf8').includes(`caffeinate ${CAFFEINATE_ARGS.join(' ')} "$pid"`));
});
