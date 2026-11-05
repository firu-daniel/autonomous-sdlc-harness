/**
 * The sandbox prerequisite table and its pure assessment — `cli/src/doctor/sandboxPrerequisites.ts`.
 *
 * **The rule these tests exist to enforce: the sandbox's host prerequisites are declared once, in
 * that module, and every other copy is a declared mirror held equal by a test.** This suite holds the
 * owner itself to its rows: the host kinds, the missing-piece order, the AppArmor answers, the
 * nested user-namespace answers, the stock-profile remedy, the install commands and the sentences,
 * none of which may offer the opt-out.
 *
 * The module is imported compiled, so `npm run build` precedes `npm test`. No case touches the host.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  APPARMOR_DISABLE_DIR,
  APPARMOR_LOAD_COMMAND,
  APPARMOR_USERNS_SYSCTL,
  BWRAP_APPARMOR_PROFILE_PATH,
  BWRAP_INSTALLED_PATH,
  BWRAP_USERNS_RESTRICT_PROFILE_PATH,
  NESTED_USERNS_HELPER,
  NESTED_USERNS_PROBE,
  SANDBOX_HOST_BINARIES,
  SANDBOX_INSTALLERS,
  WSL1_AGENT_MESSAGE,
  assessSandboxHost,
  bwrapAppArmorProfile,
  bwrapUsernsRestrictRemedy,
  describeAppArmor,
  describeNestedUserns,
  describeMissingPieces,
  installCommands,
  sandboxHostKind,
} from '../dist/doctor/sandboxPrerequisites.js';

const LINUX_RELEASE = '6.8.0-45-generic';
const BOTH = new Set(['bwrap', 'socat']);

/** Linux facts with both binaries and no restricting sysctl, overridden per case. */
function linuxFacts(overrides = {}) {
  return {
    platform: 'linux',
    kernelRelease: LINUX_RELEASE,
    resolvedBinaries: BOTH,
    appArmorRestrict: { state: 'absent' },
    bwrapProfile: { state: 'absent' },
    ...overrides,
  };
}

const read = (text) => ({ state: 'read', text });

const NESTED_ANSWERS = ['not-applicable', 'not-run', 'passed', 'failed', 'failed-stock-restrict'];
const DETAIL = 'write /proc/self/setgroups: Permission denied';
const failedProbe = { state: 'failed', detail: DETAIL };

test('sandboxHostKind classifies every platform and release row', () => {
  assert.equal(sandboxHostKind('darwin', '23.6.0'), 'macos');
  assert.equal(sandboxHostKind('darwin', '4.4.0-19041-Microsoft'), 'macos');
  assert.equal(sandboxHostKind('linux', LINUX_RELEASE), 'linux');
  assert.equal(sandboxHostKind('linux', '4.4.0-19041-Microsoft'), 'wsl1');
  assert.equal(sandboxHostKind('linux', '5.15.153.1-microsoft-standard-WSL2'), 'wsl2');
  assert.equal(sandboxHostKind('linux', '4.19.104-microsoft-standard'), 'wsl2');
  assert.equal(sandboxHostKind('linux', 'MICROSOFT-STANDARD-wsl2'), 'wsl2');
  assert.equal(sandboxHostKind('win32', '10.0.19045'), 'unsupported');
  assert.equal(sandboxHostKind('freebsd', '14.0-RELEASE'), 'unsupported');
});

test('missing binaries are reported in table order', () => {
  assert.deepEqual(
    SANDBOX_HOST_BINARIES.map((entry) => entry.binary),
    ['bwrap', 'socat'],
  );
  const cases = [
    [[], ['bwrap', 'socat']],
    [['socat'], ['bwrap']],
    [['bwrap'], ['socat']],
    [['bwrap', 'socat'], []],
  ];
  for (const [present, expected] of cases) {
    for (const kernelRelease of [LINUX_RELEASE, '5.15.153.1-microsoft-standard-WSL2']) {
      const result = assessSandboxHost(linuxFacts({ kernelRelease, resolvedBinaries: new Set(present) }));
      assert.deepEqual(result.missing, expected, `present ${present.join(',')} on ${kernelRelease}`);
    }
  }
});

test('macOS needs no binary and AppArmor does not apply', () => {
  const result = assessSandboxHost(linuxFacts({ platform: 'darwin', kernelRelease: '23.6.0', resolvedBinaries: new Set() }));
  assert.deepEqual(result, { host: 'macos', missing: [], appArmor: 'not-applicable', nestedUserns: 'not-applicable' });
});

test('wsl1 and unsupported hosts report one id and no binary id', () => {
  const none = new Set();
  const wsl1 = assessSandboxHost(linuxFacts({ kernelRelease: '4.4.0-19041-Microsoft', resolvedBinaries: none }));
  assert.deepEqual(wsl1, { host: 'wsl1', missing: ['wsl1'], appArmor: 'not-applicable', nestedUserns: 'not-applicable' });
  for (const platform of ['win32', 'freebsd']) {
    const result = assessSandboxHost(linuxFacts({ platform, resolvedBinaries: none }));
    assert.deepEqual(result, {
      host: 'unsupported',
      missing: ['unsupported-platform'],
      appArmor: 'not-applicable',
      nestedUserns: 'not-applicable',
    });
  }
});

test('AppArmor answers, and an uncertain answer never adds to missing', () => {
  const profile = read(bwrapAppArmorProfile());
  const noUserns = read(`profile bwrap ${BWRAP_INSTALLED_PATH} flags=(unconfined) {\n}\n`);
  const cases = [
    ['sysctl absent', { state: 'absent' }, { state: 'absent' }, 'clear'],
    ['sysctl 0', read('0\n'), { state: 'absent' }, 'clear'],
    ['sysctl 1 with the profile', read('1\n'), profile, 'allowed'],
    ['sysctl 1, profile lacks userns', read('1\n'), noUserns, 'uncertain'],
    ['sysctl 1, profile absent', read('1\n'), { state: 'absent' }, 'uncertain'],
    ['sysctl 1, profile unreadable', read('1\n'), { state: 'unreadable' }, 'uncertain'],
    ['sysctl unreadable', { state: 'unreadable' }, profile, 'uncertain'],
    ['sysctl 2', read('2'), profile, 'uncertain'],
  ];
  for (const present of [BOTH, new Set(['socat'])]) {
    const baseline = assessSandboxHost(linuxFacts({ resolvedBinaries: present })).missing;
    for (const [label, appArmorRestrict, bwrapProfile, expected] of cases) {
      const result = assessSandboxHost(linuxFacts({ resolvedBinaries: present, appArmorRestrict, bwrapProfile }));
      assert.equal(result.appArmor, expected, label);
      assert.deepEqual(result.missing, baseline, `${label}: missing unchanged`);
    }
  }
});

test('installCommands renders one command per installer for each missing subset', () => {
  assert.deepEqual(
    SANDBOX_INSTALLERS.map((entry) => entry.command),
    ['sudo apt-get install', 'sudo dnf install'],
  );
  assert.deepEqual(installCommands(['bwrap', 'socat']), [
    'sudo apt-get install bubblewrap socat',
    'sudo dnf install bubblewrap socat',
  ]);
  assert.deepEqual(installCommands(['socat', 'bwrap']), [
    'sudo apt-get install bubblewrap socat',
    'sudo dnf install bubblewrap socat',
  ]);
  assert.deepEqual(installCommands(['bwrap']), ['sudo apt-get install bubblewrap', 'sudo dnf install bubblewrap']);
  assert.deepEqual(installCommands(['socat']), ['sudo apt-get install socat', 'sudo dnf install socat']);
  assert.deepEqual(installCommands([]), []);
  assert.deepEqual(installCommands(['wsl1']), []);
  assert.deepEqual(installCommands(['unsupported-platform']), []);
});

test('the sentences name each piece and its fix, and never offer the opt-out', () => {
  const [binaries] = describeMissingPieces(['bwrap', 'socat'], LINUX_RELEASE, 'linux');
  for (const entry of SANDBOX_HOST_BINARIES) {
    for (const part of [entry.binary, entry.package, entry.purpose]) assert.ok(binaries.includes(part), part);
  }
  for (const command of installCommands(['bwrap', 'socat'])) assert.ok(binaries.includes(command), command);
  for (const installer of SANDBOX_INSTALLERS) assert.ok(binaries.includes(installer.family), installer.family);

  const [wsl1] = describeMissingPieces(['wsl1'], '4.4.0-19041-Microsoft', 'linux');
  assert.ok(wsl1.includes(WSL1_AGENT_MESSAGE));
  assert.ok(wsl1.includes('4.4.0-19041-Microsoft'));
  assert.ok(wsl1.includes('WSL2'));

  const [unsupported] = describeMissingPieces(['unsupported-platform'], '14.0-RELEASE', 'freebsd');
  assert.ok(unsupported.includes('freebsd'));

  assert.deepEqual(describeMissingPieces([], LINUX_RELEASE, 'linux'), []);

  const uncertain = describeAppArmor('uncertain');
  for (const part of [APPARMOR_USERNS_SYSCTL, BWRAP_APPARMOR_PROFILE_PATH, APPARMOR_LOAD_COMMAND, BWRAP_USERNS_RESTRICT_PROFILE_PATH, 'any filename']) {
    assert.ok(uncertain.includes(part), part);
  }

  const all = [
    ...describeMissingPieces(['bwrap'], LINUX_RELEASE, 'linux'),
    ...describeMissingPieces(['socat'], LINUX_RELEASE, 'linux'),
    ...describeMissingPieces(['bwrap', 'socat'], LINUX_RELEASE, 'linux'),
    ...describeMissingPieces(['wsl1'], '4.4.0-19041-Microsoft', 'linux'),
    ...describeMissingPieces(['unsupported-platform'], '10.0.19045', 'win32'),
    ...['not-applicable', 'clear', 'allowed', 'uncertain'].map(describeAppArmor),
    ...NESTED_ANSWERS.flatMap((answer) => [false, true].map((remote) => describeNestedUserns(answer, DETAIL, remote))),
  ];
  for (const sentence of all) {
    assert.ok(!sentence.includes('optOut'), sentence);
    assert.ok(!sentence.includes('\n'), sentence);
  }
});

test('bwrapAppArmorProfile grants userns to the installed bwrap path', () => {
  const profile = bwrapAppArmorProfile();
  assert.ok(profile.includes('userns,'));
  assert.ok(profile.includes(BWRAP_INSTALLED_PATH));
  assert.equal(
    profile,
    'abi <abi/4.0>,\ninclude <tunables/global>\n\nprofile bwrap /usr/bin/bwrap flags=(unconfined) {\n  userns,\n\n  include if exists <local/bwrap>\n}\n',
  );
});

test('bwrapUsernsRestrictRemedy is the four commands in order, ending with the load command', () => {
  assert.deepEqual(bwrapUsernsRestrictRemedy(), [
    `sudo mkdir -p ${APPARMOR_DISABLE_DIR}`,
    `sudo ln -sf ${BWRAP_USERNS_RESTRICT_PROFILE_PATH} ${APPARMOR_DISABLE_DIR}/bwrap-userns-restrict`,
    `sudo apparmor_parser -R ${BWRAP_USERNS_RESTRICT_PROFILE_PATH}`,
    APPARMOR_LOAD_COMMAND,
  ]);
  assert.ok(APPARMOR_LOAD_COMMAND.endsWith(BWRAP_APPARMOR_PROFILE_PATH));
  assert.equal(NESTED_USERNS_PROBE[NESTED_USERNS_PROBE.indexOf('--') + 1], NESTED_USERNS_HELPER);
});

test('the nested user-namespace verdict follows the probe and the stock profile, never adding to missing', () => {
  for (const kernelRelease of [LINUX_RELEASE, '5.15.153.1-microsoft-standard-WSL2']) {
    const cases = [
      ['probe passes', { nestedUserns: { state: 'passed' } }, 'passed'],
      ['probe fails with the stock profile', { nestedUserns: failedProbe, stockRestrictProfile: true }, 'failed-stock-restrict'],
      ['probe fails without it', { nestedUserns: failedProbe, stockRestrictProfile: false }, 'failed'],
      ['probe fails, stock field absent', { nestedUserns: failedProbe }, 'failed'],
      ['probe not run', { nestedUserns: { state: 'not-run' }, stockRestrictProfile: true }, 'not-run'],
    ];
    for (const [label, overrides, expected] of cases) {
      const result = assessSandboxHost(linuxFacts({ kernelRelease, ...overrides }));
      assert.equal(result.nestedUserns, expected, `${label} on ${kernelRelease}`);
      assert.deepEqual(result.missing, [], `${label}: missing unchanged`);
    }
  }
  const noBwrap = assessSandboxHost(linuxFacts({ resolvedBinaries: new Set(['socat']) }));
  assert.equal(noBwrap.nestedUserns, 'not-run');
  assert.deepEqual(noBwrap.missing, ['bwrap']);
});

test('facts without the two new fields answer as before, with the nested check not run', () => {
  assert.deepEqual(assessSandboxHost(linuxFacts()), {
    host: 'linux',
    missing: [],
    appArmor: 'clear',
    nestedUserns: 'not-run',
  });
  assert.deepEqual(assessSandboxHost(linuxFacts({ appArmorRestrict: read('1\n'), bwrapProfile: read(bwrapAppArmorProfile()) })), {
    host: 'linux',
    missing: [],
    appArmor: 'allowed',
    nestedUserns: 'not-run',
  });
});

test('hosts the sandbox does not run nested on answer not-applicable whatever the probe says', () => {
  const hosts = [
    { platform: 'darwin', kernelRelease: '23.6.0' },
    { platform: 'linux', kernelRelease: '4.4.0-19041-Microsoft' },
    { platform: 'win32', kernelRelease: '10.0.19045' },
  ];
  for (const host of hosts) {
    const result = assessSandboxHost(linuxFacts({ ...host, nestedUserns: failedProbe, stockRestrictProfile: true }));
    assert.equal(result.nestedUserns, 'not-applicable', host.platform);
  }
});

test('describeNestedUserns names the cause and its remedy, and who applies it', () => {
  const local = describeNestedUserns('failed-stock-restrict', DETAIL, false);
  const remote = describeNestedUserns('failed-stock-restrict', DETAIL, true);
  for (const sentence of [local, remote]) {
    for (const part of [BWRAP_USERNS_RESTRICT_PROFILE_PATH, NESTED_USERNS_PROBE.join(' '), DETAIL, 'unpriv_bwrap', BWRAP_APPARMOR_PROFILE_PATH]) {
      assert.ok(sentence.includes(part), part);
    }
    for (const command of bwrapUsernsRestrictRemedy()) assert.ok(sentence.includes(command), command);
  }
  assert.ok(local.includes('hardening'));
  assert.ok(local.includes('trade-off'));
  assert.ok(!local.includes('Install the sandbox prerequisites'));
  assert.ok(remote.includes('Install the sandbox prerequisites'));
  assert.ok(!remote.includes('hardening'));
  assert.ok(!remote.includes('trade-off'));

  const failed = describeNestedUserns('failed', DETAIL, false);
  for (const part of [APPARMOR_LOAD_COMMAND, BWRAP_APPARMOR_PROFILE_PATH, BWRAP_USERNS_RESTRICT_PROFILE_PATH, DETAIL]) {
    assert.ok(failed.includes(part), part);
  }
  assert.ok(!failed.includes('apparmor_parser -R'));

  const clearFailed = describeNestedUserns('failed', DETAIL, false, 'clear');
  assert.ok(clearFailed.includes(DETAIL));
  assert.ok(clearFailed.includes(APPARMOR_USERNS_SYSCTL));
  assert.ok(!clearFailed.includes(APPARMOR_LOAD_COMMAND));
  assert.ok(!clearFailed.includes('optOut'));

  assert.ok(describeNestedUserns('passed', '', false).length > 0);
  for (const remoteJob of [false, true]) {
    assert.equal(describeNestedUserns('not-run', '', remoteJob), '');
    assert.equal(describeNestedUserns('not-applicable', '', remoteJob), '');
  }
});
