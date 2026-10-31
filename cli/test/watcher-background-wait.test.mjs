/**
 * The written watcher's background-wait ceiling and its stopped-agents tripwire — the export in
 * `spawn_engine`'s launch subshell and `log_stopped_background_tasks` in `autonomous-watcher.sh` —
 * driven through a pause-resume launch: a `paused` record, an empty `sdlc-harness/RESUME`, one `tick`.
 *
 * **The rule this suite enforces: every engine session the watcher spawns carries a zero
 * background-wait ceiling whatever the watcher's own environment says, and a session whose CLI
 * stopped background tasks is named in `watcher.log`, whatever its classification.**
 *
 * The stub reads the ceiling from inside the session, so the value asserted is the one the engine
 * would see. The stopped line is the one the agent CLI printed to stderr in the
 * `fix_task_offer_check_script` run log (Claude Code 2.1.314, 2026-10-30); the launch line's
 * `2>>"$log_path"` is what puts it in the run log.
 *
 * Each case was run red once against the fixture's installed copy of the watcher, never the tracked
 * template:
 * - the export removed → `env, default` fails (`unset`);
 * - the export written as `"${CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS:-0}"`, so an operator value wins →
 *   `env, inherited` and `env, override file` fail (`600000`);
 * - the offset dropped, so the whole run log is scanned → `earlier session only` fails;
 * - the scan call removed → `stopped line` and `stopped line, paused` fail.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const CEILING = 'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS';
const STOPPED_LINE =
  'Background tasks still running 10m after the last turn (subagent "Write task plan with answers"); stopping them. Set CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0 to wait indefinitely.';

/** A shell single-quoted literal, so a fixture path is one word whatever it contains. */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/** Launch one session through the pause-resume pass, with `body` as the stub's body. */
async function resumeOnce(f, body, env = {}) {
  await f.seedRecord({ status: 'paused' });
  await mkdir(join(f.dir, STATE_DIR), { recursive: true });
  await writeFile(join(f.dir, STATE_DIR, 'RESUME'), '', 'utf8');
  await f.setStub(body);
  await f.tick(env);
  assert.equal(f.prompts().length, 1, f.watcherLog());
}

/** A stub body saving the ceiling the session sees, and the file it saves it to. */
function ceilingProbe(f) {
  const out = join(f.dir, 'watcher-test', 'ceiling.txt');
  return { out, body: `printf '%s' "\${${CEILING}-unset}" > ${shellQuote(out)}` };
}

const printStopped = `printf '%s\\n' ${shellQuote(STOPPED_LINE)} >&2`;

function stoppedLines(f) {
  return f
    .watcherLog()
    .split('\n')
    .filter((line) => line.includes('stopped background tasks') && line.includes(f.branch));
}

test('env, default: the session sees a zero ceiling', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const probe = ceilingProbe(f);

  await resumeOnce(f, probe.body);

  assert.equal(readFileSync(probe.out, 'utf8'), '0');
});

test('env, inherited: a ceiling in the watcher environment does not reach the session', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const probe = ceilingProbe(f);

  await resumeOnce(f, probe.body, { [CEILING]: '600000' });

  assert.equal(readFileSync(probe.out, 'utf8'), '0');
});

test('env, override file: a ceiling in watcher.env does not reach the session', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const probe = ceilingProbe(f);
  const configDir = join(f.dir, 'home', '.config', 'autonomous-sdlc-harness');
  await mkdir(configDir, { recursive: true });
  await writeFile(join(configDir, 'watcher.env'), `${CEILING}=600000\n`, 'utf8');

  await resumeOnce(f, probe.body);

  assert.equal(readFileSync(probe.out, 'utf8'), '0');
});

test('stopped line: one watcher.log line names the branch, and the record is completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, printStopped);

  assert.equal(stoppedLines(f).length, 1, f.watcherLog());
  assert.equal(f.record().status, 'completed', f.watcherLog());
});

test('stopped line, paused: the line is logged and the record is paused', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, `: > ${STATE_DIR}/PAUSE_ACK\n${printStopped}`);

  assert.equal(f.record().status, 'paused', f.watcherLog());
  assert.equal(stoppedLines(f).length, 1, f.watcherLog());
});

test('earlier session only: a stopped line already in the run log is not logged again', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const logsDir = join(f.dir, STATE_DIR, 'autonomous_logs');
  await mkdir(logsDir, { recursive: true });
  await writeFile(join(logsDir, `${f.branch}.log`), `${STOPPED_LINE}\n`, 'utf8');

  await resumeOnce(f, ':');

  assert.deepEqual(stoppedLines(f), []);
});
