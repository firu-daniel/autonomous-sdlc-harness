/**
 * The run library's sandbox mirrors — `hr_host_kind_var`, `hr_sandbox_prereq_judge_var`,
 * `hr_sandbox_prereq_probe_var` and `hr_sandbox_opted_out` in
 * `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * **The rule this suite enforces: each shell mirror answers as its owner does over the same
 * inputs.** The judge is held to `cli/src/doctor/sandboxPrerequisites.ts` → `sandboxHostKind` and
 * `assessSandboxHost` — its missing pieces and its nested user-namespace answer — across a
 * platform × kernel-release × binary-presence × nested-outcome × stock-profile matrix, and its refusal
 * sentence to `installCommands`, `WSL1_AGENT_MESSAGE` and `BWRAP_USERNS_RESTRICT_PROFILE_PATH`; the
 * probe is held to the same assessment over a stubbed `uname` and `PATH`, and to
 * `NESTED_USERNS_PROBE`, `NESTED_USERNS_HELPER` and `BWRAP_USERNS_RESTRICT_PROFILE_PATH` as the
 * vector it runs, the helper that gates it and the path it tests; the opt-out reader is held to
 * `cli/src/config/model.ts` → `sandboxOptedOut` across `reason` shapes, and answers *not opted out*
 * for every configuration it cannot load.
 *
 * The library is sourced from the package's template tree, one `bash` process per case because
 * `hr_config_load` memoises per `$$`. The owners are imported compiled, so `npm run build` precedes
 * `npm test`. No case touches the host's own sandbox facts or reaches the network.
 */

import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { sandboxOptedOut } from '../dist/config/model.js';
import {
  BWRAP_USERNS_RESTRICT_PROFILE_PATH,
  NESTED_USERNS_HELPER,
  NESTED_USERNS_PROBE,
  SANDBOX_HOST_BINARIES,
  WSL1_AGENT_MESSAGE,
  assessSandboxHost,
  installCommands,
  sandboxHostKind,
} from '../dist/doctor/sandboxPrerequisites.js';
import { PACKAGE_ROOT, runBash } from './helpers/fixture.mjs';

const LIB_PATH = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');

/** `process.platform` paired with the `uname -s` that host reports. */
const PLATFORMS = [
  ['darwin', 'Darwin'],
  ['linux', 'Linux'],
  ['win32', 'MINGW64_NT-10.0'],
  ['freebsd', 'FreeBSD'],
];

/** The kernel releases `cli/test/sandbox-prerequisites.test.mjs` classifies. */
const RELEASES = [
  '23.6.0',
  '6.8.0-45-generic',
  '4.4.0-19041-Microsoft',
  '5.15.153.1-microsoft-standard-WSL2',
  '4.19.104-microsoft-standard',
  'MICROSOFT-STANDARD-wsl2',
  '10.0.19045',
  '14.0-RELEASE',
];

/** The judge's binary arguments, in its argument order. */
const JUDGE_BINARIES = ['bwrap', 'socat'];

const PRESENCE = [[], ['bwrap'], ['socat'], ['bwrap', 'socat']];

const JQ_RESOLVES = (await runBash(PACKAGE_ROOT, ['-c', 'command -v jq >/dev/null 2>&1'])).status === 0;
const NO_JQ = JQ_RESOLVES ? false : 'jq does not resolve on this process\'s PATH, so hr_config_load cannot read a configuration here';

/** Source the library, then run `script` with the remaining values as `$1`, `$2`, …. */
function libCall(script, args = []) {
  return runBash(PACKAGE_ROOT, ['-c', `. "$1"; shift; ${script}`, '_', LIB_PATH, ...args]);
}

test('hr_host_kind_var answers as sandboxHostKind does', async () => {
  const pairs = PLATFORMS.flatMap(([platform, unameS]) => RELEASES.map((kernelRelease) => ({ platform, unameS, kernelRelease })));
  await Promise.all(
    pairs.map(async ({ platform, unameS, kernelRelease }) => {
      const result = await libCall('hr_host_kind_var "$@"; printf "%s\\n" "$HR_HOST_KIND"', [unameS, kernelRelease]);
      assert.equal(result.stdout.trim(), sandboxHostKind(platform, kernelRelease), `${platform}/${unameS} ${kernelRelease}`);
    }),
  );
});

/**
 * Run the judge and return its status and the four variables it sets. With `nested` undefined it is
 * called with four arguments, as every existing caller calls it.
 */
async function judge(unameS, unameR, present, nested, stock) {
  const flags = JUDGE_BINARIES.map((binary) => (present.includes(binary) ? '1' : '0'));
  const extra = nested === undefined ? [] : [nested, stock ? '1' : '0'];
  const result = await libCall(
    'hr_sandbox_prereq_judge_var "$@"; status=$?; printf "%s\\n" "$status" "$HR_SANDBOX_HOST" "$HR_SANDBOX_MISSING" "$HR_SANDBOX_REFUSAL" "$HR_SANDBOX_NESTED"',
    [unameS, unameR, ...flags, ...extra],
  );
  assert.equal(result.stderr, '', `judge wrote to stderr: ${result.stderr}`);
  const [status, host, missing, refusal, nestedAnswer] = result.stdout.split('\n');
  return { status: Number(status), host, missing, refusal, nested: nestedAnswer };
}

/** The owner's `nestedUserns` fact for a judge `<nested>` argument. */
function nestedFact(nested) {
  return nested === 'failed' ? { state: 'failed', detail: 'exited 1' } : { state: nested };
}

const FAILED_NESTED = new Set(['failed', 'failed-stock-restrict']);

/** Run `jobs` (thunks) at most `width` at a time. */
async function inBatches(jobs, width = 64) {
  for (let start = 0; start < jobs.length; start += width) {
    await Promise.all(jobs.slice(start, start + width).map((job) => job()));
  }
}

test('the judge answers as sandboxHostKind and assessSandboxHost do, and its refusal carries the owner strings', async () => {
  const cases = [];
  for (const [platform, unameS] of PLATFORMS) {
    for (const kernelRelease of RELEASES) {
      for (const present of PRESENCE) cases.push({ platform, unameS, kernelRelease, present });
    }
  }
  await Promise.all(
    cases.map(async ({ platform, unameS, kernelRelease, present }) => {
      const label = `${platform}/${unameS} ${kernelRelease} present [${present.join(',')}]`;
      const facts = {
        platform,
        kernelRelease,
        resolvedBinaries: new Set(present),
        appArmorRestrict: { state: 'absent' },
        bwrapProfile: { state: 'absent' },
        nestedUserns: { state: 'not-run' },
        stockRestrictProfile: false,
      };
      const owner = assessSandboxHost(facts);
      const shell = await judge(unameS, kernelRelease, present);

      assert.equal(shell.host, sandboxHostKind(platform, kernelRelease), `host for ${label}`);
      assert.equal(shell.nested, owner.nestedUserns, `nested answer for ${label}`);
      assert.equal(shell.missing, owner.missing.join(' '), `missing for ${label}`);
      assert.equal(shell.status, owner.missing.length === 0 ? 0 : 1, `status for ${label}`);
      assert.doesNotMatch(shell.refusal, /optOut|opt-out|opt out/i, `refusal offers the opt-out for ${label}`);
      if (owner.missing.length === 0) {
        assert.equal(shell.refusal, '', `refusal for ${label}`);
        return;
      }
      assert.notEqual(shell.refusal, '', `refusal for ${label}`);
      for (const entry of SANDBOX_HOST_BINARIES) {
        if (owner.missing.includes(entry.binary)) {
          assert.ok(shell.refusal.includes(entry.package), `refusal names ${entry.package} for ${label}`);
        }
      }
      for (const command of installCommands(owner.missing)) {
        assert.ok(shell.refusal.includes(command), `refusal carries "${command}" for ${label}: ${shell.refusal}`);
      }
      if (owner.missing.includes('wsl1')) {
        assert.ok(shell.refusal.includes(WSL1_AGENT_MESSAGE), `refusal quotes the WSL1 message for ${label}`);
        assert.ok(shell.refusal.includes(kernelRelease), `refusal names the release for ${label}`);
      }
      if (owner.missing.includes('unsupported-platform')) {
        assert.ok(shell.refusal.includes(unameS), `refusal names the platform for ${label}`);
      }
    }),
  );
});

test('the judge answers the nested user-namespace check as assessSandboxHost does', async () => {
  const jobs = [];
  for (const [platform, unameS] of PLATFORMS) {
    for (const kernelRelease of RELEASES) {
      for (const present of PRESENCE) {
        for (const nested of ['not-run', 'passed', 'failed']) {
          for (const stock of [false, true]) {
            jobs.push(async () => {
              const label = `${platform}/${unameS} ${kernelRelease} present [${present.join(',')}] nested ${nested} stock ${stock}`;
              const owner = assessSandboxHost({
                platform,
                kernelRelease,
                resolvedBinaries: new Set(present),
                appArmorRestrict: { state: 'absent' },
                bwrapProfile: { state: 'absent' },
                nestedUserns: nestedFact(nested),
                stockRestrictProfile: stock,
              });
              const shell = await judge(unameS, kernelRelease, present, nested, stock);
              const failed = FAILED_NESTED.has(owner.nestedUserns);

              assert.equal(shell.nested, owner.nestedUserns, `nested answer for ${label}`);
              assert.equal(shell.missing, owner.missing.join(' '), `missing for ${label}`);
              assert.equal(shell.status, owner.missing.length > 0 || failed ? 1 : 0, `status for ${label}`);
              assert.doesNotMatch(shell.refusal, /optOut|opt-out|opt out/i, `refusal offers the opt-out for ${label}`);
              if (owner.missing.length === 0 && !failed) {
                assert.equal(shell.refusal, '', `refusal for ${label}`);
                return;
              }
              assert.notEqual(shell.refusal, '', `refusal for ${label}`);
              for (const command of installCommands(owner.missing)) {
                assert.ok(shell.refusal.includes(command), `refusal carries "${command}" for ${label}: ${shell.refusal}`);
              }
              if (failed) {
                assert.ok(
                  !shell.refusal.includes('npx autonomous-sdlc-harness doctor'),
                  `refusal names doctor itself for ${label}: ${shell.refusal}`,
                );
              }
              assert.equal(
                shell.refusal.includes(BWRAP_USERNS_RESTRICT_PROFILE_PATH),
                owner.nestedUserns === 'failed-stock-restrict',
                `refusal names ${BWRAP_USERNS_RESTRICT_PROFILE_PATH} exactly for failed-stock-restrict, for ${label}: ${shell.refusal}`,
              );
            });
          }
        }
      }
    }
  }
  await inBatches(jobs);
});

const NESTED_BWRAP = NESTED_USERNS_PROBE[0];

/**
 * A stub bin directory: `uname` answering `unameS` / `unameR` (or failing), plus `present` as
 * executables. The `bwrap` stub records its arguments, one per line, to `<dir>/bwrap-args` and exits
 * `bwrapExit`; `helper` adds a `NESTED_USERNS_HELPER` stub.
 */
function stubBin(unameS, unameR, present, { unameFails = false, helper = false, bwrapExit = 0 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sandbox-probe-'));
  const bin = join(dir, 'bin');
  const argsFile = join(dir, 'bwrap-args');
  mkdirSync(bin);
  const write = (name, body) => {
    writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  };
  write('uname', unameFails ? 'exit 1' : `case "$1" in -s) echo '${unameS}' ;; -r) echo '${unameR}' ;; esac`);
  for (const binary of present) {
    write(binary, binary === NESTED_BWRAP ? `printf '%s\\n' "$@" > '${argsFile}'\nexit ${bwrapExit}` : 'exit 0');
  }
  if (helper) write(NESTED_USERNS_HELPER, 'exit 0');
  return { dir, bin, argsFile };
}

/** Run the probe with `PATH` set to `bin`; return its status and the variables it sets. */
async function probe(bin) {
  const result = await libCall(
    'PATH="$1"; hr_sandbox_prereq_probe_var; status=$?; printf "%s\\n" "$status" "$HR_SANDBOX_MISSING" "$HR_SANDBOX_NESTED" "$HR_SANDBOX_REFUSAL"',
    [bin],
  );
  const [status, missing, nested, refusal] = result.stdout.split('\n');
  return { status: Number(status), missing, nested, refusal };
}

test('the nested check runs the owner vector, and NESTED_USERNS_PROBE runs NESTED_USERNS_HELPER after --', () => {
  assert.equal(NESTED_USERNS_PROBE[NESTED_USERNS_PROBE.indexOf('--') + 1], NESTED_USERNS_HELPER);
});

test('hr_sandbox_prereq_probe_var tests the owner stock-profile path and no other AppArmor path', () => {
  const lib = readFileSync(LIB_PATH, 'utf8');
  const start = lib.indexOf('\nhr_sandbox_prereq_probe_var() {');
  assert.notEqual(start, -1, 'hr_sandbox_prereq_probe_var not found');
  const body = lib.slice(start, lib.indexOf('\n}\n', start));
  assert.ok(body.includes(`[ -e ${BWRAP_USERNS_RESTRICT_PROFILE_PATH} ]`), body);
  for (const path of body.match(/\/etc\/apparmor\.d\/[^\s`'"\];]*/g) ?? []) {
    assert.equal(path, BWRAP_USERNS_RESTRICT_PROFILE_PATH);
  }
});

test('hr_sandbox_prereq_probe_var runs the nested check only where the owner does, and answers as assessSandboxHost does', async () => {
  const stockRestrictProfile = existsSync(BWRAP_USERNS_RESTRICT_PROFILE_PATH);
  const present = SANDBOX_HOST_BINARIES.map((entry) => entry.binary);
  const cases = [];
  for (const [platform, unameS] of [['linux', 'Linux'], ['darwin', 'Darwin']]) {
    for (const kernelRelease of ['6.8.0-45-generic', '5.15.153.1-microsoft-standard-WSL2']) {
      for (const helper of [true, false]) {
        for (const bwrapExit of [0, 1]) cases.push({ platform, unameS, kernelRelease, helper, bwrapExit });
      }
    }
  }
  for (const { platform, unameS, kernelRelease, helper, bwrapExit } of cases) {
    const label = `${unameS} ${kernelRelease} helper ${helper} bwrap exits ${bwrapExit}`;
    const { dir, bin, argsFile } = stubBin(unameS, kernelRelease, present, { helper, bwrapExit });
    try {
      const shell = await probe(bin);
      const runs = platform === 'linux' && helper;
      assert.equal(existsSync(argsFile), runs, `stub ${NESTED_BWRAP} called for ${label}`);
      if (runs) {
        assert.deepEqual(readFileSync(argsFile, 'utf8').split('\n').slice(0, -1), NESTED_USERNS_PROBE.slice(1), label);
      }
      const nestedUserns = runs ? (bwrapExit === 0 ? { state: 'passed' } : { state: 'failed', detail: `exited ${bwrapExit}` }) : { state: 'not-run' };
      const owner = assessSandboxHost({
        platform,
        kernelRelease,
        resolvedBinaries: new Set(present),
        appArmorRestrict: { state: 'absent' },
        bwrapProfile: { state: 'absent' },
        nestedUserns,
        stockRestrictProfile,
      });
      if (platform === 'darwin') assert.equal(shell.nested, 'not-applicable', label);
      if (platform === 'linux' && !helper) assert.equal(shell.nested, 'not-run', label);
      assert.equal(shell.nested, owner.nestedUserns, label);
      assert.equal(shell.missing, owner.missing.join(' '), label);
      assert.equal(shell.status, owner.missing.length > 0 || FAILED_NESTED.has(owner.nestedUserns) ? 1 : 0, label);
      assert.doesNotMatch(shell.refusal, /optOut|opt-out|opt out/i, label);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('hr_sandbox_prereq_probe_var reads uname and PATH and answers as assessSandboxHost does', async () => {
  for (const [platform, unameS] of [['linux', 'Linux'], ['darwin', 'Darwin']]) {
    for (const kernelRelease of ['6.8.0-45-generic', '4.4.0-19041-Microsoft']) {
      for (const present of PRESENCE) {
        const { dir, bin } = stubBin(unameS, kernelRelease, present);
        try {
          const { status, missing, nested } = await probe(bin);
          const owner = assessSandboxHost({
            platform,
            kernelRelease,
            resolvedBinaries: new Set(present),
            appArmorRestrict: { state: 'absent' },
            bwrapProfile: { state: 'absent' },
            nestedUserns: { state: 'not-run' },
            stockRestrictProfile: false,
          });
          const label = `${unameS} ${kernelRelease} [${present.join(',')}]`;
          assert.equal(missing, owner.missing.join(' '), label);
          assert.equal(nested, owner.nestedUserns, label);
          assert.equal(status, owner.missing.length === 0 ? 0 : 1, label);
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      }
    }
  }
});

test('hr_sandbox_prereq_probe_var leaves a host whose uname fails to failIfUnavailable', async () => {
  const { dir, bin } = stubBin('', '', [], { unameFails: true });
  try {
    const result = await libCall(
      'PATH="$1"; hr_sandbox_prereq_probe_var; status=$?; printf "%s|%s|%s\\n" "$status" "$HR_SANDBOX_MISSING" "$HR_SANDBOX_REFUSAL"',
      [bin],
    );
    assert.equal(result.stdout.trim(), '0||');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Write `content` as `harness.config.json` in a fresh temp directory (none when `undefined`). */
function configDir(content) {
  const dir = mkdtempSync(join(tmpdir(), 'sandbox-opt-out-'));
  if (content !== undefined) writeFileSync(join(dir, 'harness.config.json'), content);
  return dir;
}

async function optedOutStatus(dir) {
  return (await libCall('hr_sandbox_opted_out "$1"', [dir])).status;
}

/** `sandbox` values, `undefined` meaning the key is absent. */
const OPT_OUT_CASES = [
  ['no sandbox', undefined],
  ['sandbox "x"', 'x'],
  ['optOut true', { optOut: true }],
  ['optOut {}', { optOut: {} }],
  ...[
    '',
    '   ',
    '　',
    '﻿',
    ' ',
    ' ',
    ' ',
    ' ',
    '\u000b',
    '\t\n',
    '​',
    '\u0085',
    'x',
    ' x ',
    'null',
    5,
    null,
  ].map((reason) => [`reason ${JSON.stringify(reason)}`, { optOut: { reason } }]),
];

test('hr_sandbox_opted_out answers as sandboxOptedOut does', { skip: NO_JQ }, async () => {
  await Promise.all(
    OPT_OUT_CASES.map(async ([label, sandbox]) => {
      const config = sandbox === undefined ? { defaultBranch: 'main' } : { defaultBranch: 'main', sandbox };
      const dir = configDir(JSON.stringify(config));
      try {
        const expected = sandboxOptedOut(config) ? 0 : 1;
        assert.equal(await optedOutStatus(dir), expected, label);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }),
  );
});

test('hr_sandbox_opted_out answers not opted out for a configuration it cannot load', { skip: NO_JQ }, async () => {
  const taken = JSON.stringify({ defaultBranch: 'main', sandbox: { optOut: { reason: 'r' } } });
  const states = [
    ['absent', undefined],
    ['unparseable', '{ "defaultBranch": "main", '],
    ['two documents', `${taken}\n${taken}\n`],
  ];
  for (const [label, content] of states) {
    const dir = configDir(content);
    try {
      assert.equal(await optedOutStatus(dir), 1, label);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});
