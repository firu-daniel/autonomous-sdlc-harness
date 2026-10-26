/**
 * The run library's keep-awake primitives — `hr_keep_awake`, `hr_keep_awake_probe_var`,
 * `hr_keep_awake_mode_var`, `hr_on_mains_power` and `hr_keep_awake_hold_var` in
 * `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * **The rule this suite enforces: each keep-awake primitive answers as its contract states over
 * stubbed host facts, and no hold outlives the pid it was started for.**
 *
 * The library is sourced from the package's template tree, one `bash` process per case because
 * `hr_config_load` memoises per `$$`. Every case runs with `GITHUB_ACTIONS` empty, so a CI run does
 * not take the runner arm of the mode decision. Stubs and fixtures live under the system temp
 * directory and are removed in process; the host's own power supply is never read, because every
 * power case sets `HR_POWER_SUPPLY_DIR`. No case starts a real `caffeinate` or `systemd-inhibit`:
 * both are stubs placed first on `PATH`, and the probe cases' `PATH` holds no host directory at all.
 */

import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { PACKAGE_ROOT, runBash } from './helpers/fixture.mjs';

const LIB_PATH = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');

/** Bounds every hold case, so a holder that never exits fails the case and its group is killed. */
const HOLD_TIMEOUT_MS = 30_000;

const BASE_ENV = Object.freeze({ GITHUB_ACTIONS: '' });

/** Separates one recorded argument from the next in a stub's record file. */
const ARG_SEP = '\u001f';

const JQ_RESOLVES = (await runBash(PACKAGE_ROOT, ['-c', 'command -v jq >/dev/null 2>&1'])).status === 0;
const NO_JQ = JQ_RESOLVES ? false : 'jq does not resolve on this process\'s PATH, so hr_config_load cannot read a configuration here';

/** Source the library, then run `script` with the remaining values as `$1`, `$2`, …. */
function libCall(script, args = [], env = {}, bound = {}) {
  return runBash(PACKAGE_ROOT, ['-c', `. "$1"; shift; ${script}`, '_', LIB_PATH, ...args], { ...BASE_ENV, ...env }, bound);
}

/** A fresh temp directory, removed by `cleanup`. */
function tempDir(prefix) {
  return mkdtempSync(join(tmpdir(), prefix));
}

function writeExecutable(dir, name, body) {
  writeFileSync(join(dir, name), `#!/bin/sh\n${body}\n`);
  chmodSync(join(dir, name), 0o755);
}

/** A temp root holding `config` as `harness.config.json` (no file when `undefined`). */
function configRoot(config) {
  const dir = tempDir('keep-awake-config-');
  if (config !== undefined) writeFileSync(join(dir, 'harness.config.json'), JSON.stringify(config));
  return dir;
}

test('hr_keep_awake reads execution.keepAwake as true/absent 0, false 1, unresolvable or non-boolean 2', { skip: NO_JQ }, async () => {
  const cases = [
    ['absent', { defaultBranch: 'main' }, 0],
    ['true', { defaultBranch: 'main', execution: { keepAwake: true } }, 0],
    ['false', { defaultBranch: 'main', execution: { keepAwake: false } }, 1],
    ['"true"', { defaultBranch: 'main', execution: { keepAwake: 'true' } }, 2],
    ['no file', undefined, 2],
  ];
  for (const [label, config, expected] of cases) {
    const dir = configRoot(config);
    try {
      assert.equal((await libCall('hr_keep_awake "$1"', [dir])).status, expected, label);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

/** Run the mode decision with `hr_keep_awake_probe_var` overridden to answer `host` / `tool`. */
async function modeOf({ config = { defaultBranch: 'main' }, jobMode = '', host = 'macos', tool = 'caffeinate', githubActions = '' }) {
  const dir = configRoot(config);
  try {
    const result = await libCall(
      'probe_host="$3"; probe_tool="$4"; hr_keep_awake_probe_var() { HR_KEEP_AWAKE_HOST="$probe_host"; HR_KEEP_AWAKE_TOOL="$probe_tool"; }; ' +
        'hr_keep_awake_mode_var "$1" "$2"; status=$?; printf "%s\\n" "$status" "$HR_KEEP_AWAKE_MODE" "$HR_KEEP_AWAKE_REASON" "$HR_KEEP_AWAKE_QUIET"',
      [dir, jobMode, host, tool],
      { GITHUB_ACTIONS: githubActions },
    );
    assert.equal(result.stderr, '', `mode decision wrote to stderr: ${result.stderr}`);
    const [status, mode, reason, quiet] = result.stdout.split('\n');
    return { status: Number(status), mode, reason, quiet };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const RUNNER_SLEEPS = 'a GitHub Actions runner does not sleep';

test('hr_keep_awake_mode_var takes each arm in order with its exact reason and quiet flag', { skip: NO_JQ }, async () => {
  const arms = [
    ['job mode 1, over GITHUB_ACTIONS=true', { jobMode: '1', githubActions: 'true' }, ['off', `job mode — ${RUNNER_SLEEPS}`, '1']],
    ['GITHUB_ACTIONS=true', { githubActions: 'true' }, ['off', `GITHUB_ACTIONS is true — ${RUNNER_SLEEPS}`, '1']],
    ['key false', { config: { defaultBranch: 'main', execution: { keepAwake: false } } }, ['off', 'execution.keepAwake is false', '1']],
    ['key "yes"', { config: { defaultBranch: 'main', execution: { keepAwake: 'yes' } } }, ['off', 'execution.keepAwake is not a boolean', '']],
    ['macos + caffeinate', { host: 'macos', tool: 'caffeinate' }, ['caffeinate', '', '']],
    ['macos, no tool', { host: 'macos', tool: '' }, ['off', 'caffeinate does not resolve on PATH', '']],
    ['linux + systemd-inhibit', { host: 'linux', tool: 'systemd-inhibit' }, ['logind', '', '']],
    ['linux, no tool', { host: 'linux', tool: '' }, ['off', 'systemd-inhibit does not resolve on PATH', '']],
    [
      'wsl2',
      { host: 'wsl2', tool: '' },
      [
        'off',
        "WSL2 — nothing inside WSL can keep Windows awake; set the Windows power plan's lid action to Do nothing on AC (#160 feat_wsl2_support)",
        '',
      ],
    ],
    ['wsl1', { host: 'wsl1', tool: '' }, ['off', 'no sleep hold on this platform', '1']],
    ['unsupported', { host: 'unsupported', tool: '' }, ['off', 'no sleep hold on this platform', '1']],
  ];
  for (const [label, input, [mode, reason, quiet]] of arms) {
    const got = await modeOf(input);
    assert.deepEqual(got, { status: 0, mode, reason, quiet }, label);
  }
});

/**
 * A stub `PATH`: `uname` answering `-s` / `-r` from `STUB_UNAME_S` / `STUB_UNAME_R` (or failing),
 * `present` tools as executables, and a second directory linking only `bash`, `sh` and `jq`, so no
 * host directory — and with it the host's own `caffeinate` — is on the path.
 */
async function probePath(present, { unameFails = false } = {}) {
  const dir = tempDir('keep-awake-probe-');
  const stubs = join(dir, 'stubs');
  const tools = join(dir, 'tools');
  mkdirSync(stubs);
  mkdirSync(tools);
  writeExecutable(stubs, 'uname', unameFails ? 'exit 1' : 'case "$1" in -s) echo "$STUB_UNAME_S" ;; -r) echo "$STUB_UNAME_R" ;; esac');
  for (const tool of present) writeExecutable(stubs, tool, 'exit 0');
  for (const name of ['bash', 'sh', 'jq']) {
    const found = await runBash(PACKAGE_ROOT, ['-c', 'command -v "$1"', '_', name]);
    if (found.status === 0) symlinkSync(found.stdout.trim(), join(tools, name));
  }
  return { dir, path: `${stubs}:${tools}` };
}

test('hr_keep_awake_probe_var classifies uname and resolves only its host\'s tool on PATH', async () => {
  const cases = [
    ['Darwin with caffeinate', 'Darwin', '23.6.0', ['caffeinate'], {}, ['macos', 'caffeinate']],
    ['Darwin without caffeinate', 'Darwin', '23.6.0', [], {}, ['macos', '']],
    ['Linux with systemd-inhibit', 'Linux', '6.8.0-45-generic', ['systemd-inhibit'], {}, ['linux', 'systemd-inhibit']],
    ['Linux without systemd-inhibit', 'Linux', '6.8.0-45-generic', [], {}, ['linux', '']],
    ['WSL2 with both tools', 'Linux', '5.15.153.1-microsoft-standard-WSL2', ['caffeinate', 'systemd-inhibit'], {}, ['wsl2', '']],
    ['failing uname', 'Darwin', '23.6.0', ['caffeinate', 'systemd-inhibit'], { unameFails: true }, ['unsupported', '']],
  ];
  for (const [label, unameS, unameR, present, options, [host, tool]] of cases) {
    const { dir, path } = await probePath(present, options);
    try {
      const result = await libCall(
        'PATH="$1"; hr_keep_awake_probe_var; status=$?; printf "%s|%s|%s\\n" "$status" "$HR_KEEP_AWAKE_HOST" "$HR_KEEP_AWAKE_TOOL"',
        [path],
        { STUB_UNAME_S: unameS, STUB_UNAME_R: unameR },
      );
      assert.equal(result.stdout.trim(), `0|${host}|${tool}`, label);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

/** A temp power-supply directory: `{ entry: { file: content } }`. */
function powerSupplyDir(entries) {
  const dir = tempDir('keep-awake-power-');
  for (const [entry, files] of Object.entries(entries)) {
    mkdirSync(join(dir, entry));
    for (const [file, content] of Object.entries(files)) writeFileSync(join(dir, entry, file), `${content}\n`);
  }
  return dir;
}

async function mainsStatus(dir) {
  return (await libCall('hr_on_mains_power', [], { HR_POWER_SUPPLY_DIR: dir })).status;
}

/*
 * The contract restated: an entry is counted only when its `type` is `Mains`, `USB` or `USB_*`, its
 * `scope` is absent or not `Device`, and it has an `online` file; one with no `type` is skipped. Any
 * counted entry online → 0; counted entries, none online → 1; no counted entry → 0.
 */
test('hr_on_mains_power counts only mains-class, non-Device entries with an online file', async () => {
  const offMains = { online: 0, type: 'Mains' };
  const cases = [
    ['AC online', { AC: { online: 1, type: 'Mains' } }, 0],
    ['AC offline beside a battery with no online file', { AC: offMains, BAT0: { type: 'Battery' } }, 1],
    ['AC offline beside a USB charger online', { AC: offMains, usb: { online: 1, type: 'USB' } }, 0],
    ['a Device-scope peripheral online beside AC offline', { hidpp_battery_0: { online: 1, scope: 'Device', type: 'Battery' }, AC: offMains }, 1],
    ['a type-less entry online beside AC offline', { x: { online: 1 }, AC: offMains }, 1],
    ['an empty directory', {}, 0],
    ['only BAT0/status', { BAT0: { status: 'Discharging' } }, 0],
  ];
  for (const [label, entries, expected] of cases) {
    const dir = powerSupplyDir(entries);
    try {
      assert.equal(await mainsStatus(dir), expected, label);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

/**
 * Stub `caffeinate` and `systemd-inhibit` in a temp directory. Each records its argv to
 * `<records>/<name>`, one invocation per line. `caffeinate` then waits on the pid after `-w`;
 * `systemd-inhibit` exits with `<records>/probe-status` when its last argument is `true`, and
 * otherwise runs what follows its four flags.
 */
function holdStubs() {
  const dir = tempDir('keep-awake-hold-');
  const stubs = join(dir, 'stubs');
  const records = join(dir, 'records');
  mkdirSync(stubs);
  mkdirSync(records);
  const record = (name) => `{ printf '%s\\037' "$@"; printf '\\n'; } >>"${join(records, name)}"`;
  writeExecutable(
    stubs,
    'caffeinate',
    [
      record('caffeinate'),
      'pid=""; prev=""',
      'for arg in "$@"; do [ "$prev" = "-w" ] && pid="$arg"; prev="$arg"; done',
      'while kill -0 "$pid" 2>/dev/null; do sleep 0.1; done',
    ].join('\n'),
  );
  writeExecutable(
    stubs,
    'systemd-inhibit',
    [
      record('systemd-inhibit'),
      'for last in "$@"; do :; done',
      `if [ "$last" = "true" ]; then exit "$(cat "${join(records, 'probe-status')}")"; fi`,
      'shift 4',
      'exec "$@"',
    ].join('\n'),
  );
  return { dir, stubs, records };
}

/** Each recorded invocation of `name`, as its argv; `undefined` when it was never invoked. */
function recorded(records, name) {
  const file = join(records, name);
  if (!existsSync(file)) return undefined;
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => line.split(ARG_SEP).slice(0, -1));
}

/*
 * Start a `sleep 2` target, take the hold on it, note whether the holder is alive, reap the target,
 * then wait up to 5 s for the holder to go. A holder still alive then is killed so nothing outlives
 * the case, and the case reports it as not gone.
 */
const HOLD_SCRIPT = [
  'PATH="$1:$PATH"',
  'sleep 2 & target=$!',
  'hr_keep_awake_hold_var "$2" "$target" feat_x; status=$?',
  'alive=0; [ -n "$HR_KEEP_AWAKE_PID" ] && kill -0 "$HR_KEEP_AWAKE_PID" 2>/dev/null && alive=1',
  'wait "$target"',
  'gone=0; i=0',
  'while [ "$i" -lt 50 ]; do',
  '  if [ -z "$HR_KEEP_AWAKE_PID" ] || ! kill -0 "$HR_KEEP_AWAKE_PID" 2>/dev/null; then gone=1; break; fi',
  '  sleep 0.1; i=$((i + 1))',
  'done',
  '[ "$gone" = "1" ] || kill "$HR_KEEP_AWAKE_PID" 2>/dev/null',
  'printf "%s\\n" "$status" "$HR_KEEP_AWAKE_STATE" "$target" "$alive" "$gone" "$HR_KEEP_AWAKE_DETAIL"',
].join('\n');

async function hold(mode, { mains = true, probeStatus = 0 } = {}) {
  const { dir, stubs, records } = holdStubs();
  const power = powerSupplyDir({ AC: { online: mains ? 1 : 0, type: 'Mains' } });
  writeFileSync(join(records, 'probe-status'), `${probeStatus}\n`);
  try {
    const result = await libCall(HOLD_SCRIPT, [stubs, mode], { HR_POWER_SUPPLY_DIR: power }, { timeoutMs: HOLD_TIMEOUT_MS });
    const [status, state, target, alive, gone, detail] = result.stdout.split('\n');
    return {
      status: Number(status),
      state,
      target,
      alive: alive === '1',
      gone: gone === '1',
      detail,
      caffeinate: recorded(records, 'caffeinate'),
      inhibit: recorded(records, 'systemd-inhibit'),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(power, { recursive: true, force: true });
  }
}

const LOCK_FLAGS = ['--what=sleep:handle-lid-switch', '--mode=block', '--who=autonomous-sdlc-harness', '--why=run feat_x'];

test('hr_keep_awake_hold_var caffeinate holds with -s -i -w <pid> and ends with the pid', async () => {
  const got = await hold('caffeinate');
  assert.equal(got.status, 0);
  assert.equal(got.state, 'held');
  assert.equal(got.alive, true, 'holder alive before the target exits');
  assert.equal(got.gone, true, 'holder gone after the target exits');
  assert.deepEqual(got.caffeinate, [['-s', '-i', '-w', got.target]]);
  assert.equal(got.inhibit, undefined);
});

test('hr_keep_awake_hold_var logind on mains probes the lock, then holds it until the pid exits', async () => {
  const got = await hold('logind', { probeStatus: 0 });
  assert.equal(got.status, 0);
  assert.equal(got.state, 'held');
  assert.equal(got.alive, true, 'holder alive before the target exits');
  assert.equal(got.gone, true, 'holder gone after the target exits');
  assert.equal(got.inhibit.length, 2, 'one probe and one holder invocation');
  const [probe, holder] = got.inhibit;
  assert.deepEqual(probe, [...LOCK_FLAGS, 'true']);
  assert.deepEqual(holder.slice(0, 6), [...LOCK_FLAGS, 'sh', '-c']);
  assert.match(holder[6], /kill -0 "\$1"/);
  assert.deepEqual(holder.slice(7), ['keep-awake-wait', got.target]);
  assert.equal(got.caffeinate, undefined);
});

test('hr_keep_awake_hold_var logind is refused when the probe exits 1', async () => {
  const got = await hold('logind', { probeStatus: 1 });
  assert.equal(got.status, 1);
  assert.equal(got.state, 'refused');
  assert.ok(got.detail.startsWith('systemd-inhibit exited 1'), got.detail);
  assert.deepEqual(got.inhibit, [[...LOCK_FLAGS, 'true']], 'the probe alone ran');
});

test('hr_keep_awake_hold_var logind on battery takes no lock and invokes nothing', async () => {
  const got = await hold('logind', { mains: false });
  assert.equal(got.status, 1);
  assert.equal(got.state, 'battery');
  assert.equal(got.inhibit, undefined);
  assert.equal(got.caffeinate, undefined);
});

test('hr_keep_awake_hold_var fails on an empty pid', async () => {
  const result = await libCall('hr_keep_awake_hold_var caffeinate "" feat_x; status=$?; printf "%s|%s|%s\\n" "$status" "$HR_KEEP_AWAKE_STATE" "$HR_KEEP_AWAKE_PID"');
  assert.equal(result.stdout.trim(), '1|failed|');
});
