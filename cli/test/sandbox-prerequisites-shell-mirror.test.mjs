/**
 * The run library's sandbox mirrors — `hr_sandbox_prereq_judge_var`, `hr_sandbox_prereq_probe_var`
 * and `hr_sandbox_opted_out` in `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * **The rule this suite enforces: each shell mirror answers as its owner does over the same
 * inputs.** The judge is held to `cli/src/doctor/sandboxPrerequisites.ts` → `sandboxHostKind` and
 * `assessSandboxHost` across a platform × kernel-release × binary-presence matrix, and its refusal
 * sentence to `installCommands` and `WSL1_AGENT_MESSAGE`, and the probe is held to the same
 * assessment over a stubbed `uname` and `PATH`; the opt-out reader is held to
 * `cli/src/config/model.ts` → `sandboxOptedOut` across `reason` shapes, and answers *not opted out*
 * for every configuration it cannot load.
 *
 * The library is sourced from the package's template tree, one `bash` process per case because
 * `hr_config_load` memoises per `$$`. The owners are imported compiled, so `npm run build` precedes
 * `npm test`. No case touches the host's own sandbox facts or reaches the network.
 */

import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { sandboxOptedOut } from '../dist/config/model.js';
import {
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

/** Run the judge and return its status and the three variables it sets. */
async function judge(unameS, unameR, present) {
  const flags = JUDGE_BINARIES.map((binary) => (present.includes(binary) ? '1' : '0'));
  const result = await libCall(
    'hr_sandbox_prereq_judge_var "$@"; status=$?; printf "%s\\n" "$status" "$HR_SANDBOX_HOST" "$HR_SANDBOX_MISSING" "$HR_SANDBOX_REFUSAL"',
    [unameS, unameR, ...flags],
  );
  assert.equal(result.stderr, '', `judge wrote to stderr: ${result.stderr}`);
  const [status, host, missing, refusal] = result.stdout.split('\n');
  return { status: Number(status), host, missing, refusal };
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
      };
      const owner = assessSandboxHost(facts);
      const shell = await judge(unameS, kernelRelease, present);

      assert.equal(shell.host, sandboxHostKind(platform, kernelRelease), `host for ${label}`);
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

/** A stub bin directory: `uname` answering `unameS` / `unameR` (or failing), plus `present` as executables. */
function stubBin(unameS, unameR, present, { unameFails = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sandbox-probe-'));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const write = (name, body) => {
    writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  };
  write('uname', unameFails ? 'exit 1' : `case "$1" in -s) echo '${unameS}' ;; -r) echo '${unameR}' ;; esac`);
  for (const binary of present) write(binary, 'exit 0');
  return { dir, bin };
}

test('hr_sandbox_prereq_probe_var reads uname and PATH and answers as assessSandboxHost does', async () => {
  for (const [platform, unameS] of [['linux', 'Linux'], ['darwin', 'Darwin']]) {
    for (const kernelRelease of ['6.8.0-45-generic', '4.4.0-19041-Microsoft']) {
      for (const present of PRESENCE) {
        const { dir, bin } = stubBin(unameS, kernelRelease, present);
        try {
          const result = await libCall(
            'PATH="$1"; hr_sandbox_prereq_probe_var; status=$?; printf "%s\\n" "$status" "$HR_SANDBOX_MISSING"',
            [bin],
          );
          const [status, missing] = result.stdout.split('\n');
          const owner = assessSandboxHost({
            platform,
            kernelRelease,
            resolvedBinaries: new Set(present),
            appArmorRestrict: { state: 'absent' },
            bwrapProfile: { state: 'absent' },
          });
          const label = `${unameS} ${kernelRelease} [${present.join(',')}]`;
          assert.equal(missing, owner.missing.join(' '), label);
          assert.equal(Number(status), owner.missing.length === 0 ? 0 : 1, label);
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
