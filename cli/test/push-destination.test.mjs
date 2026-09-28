/**
 * The push destination: one grammar for what may be given, and no path prints the value.
 *
 * **The rule these tests exist to enforce: `resolvePushDestination` is the only grammar for a push
 * destination, and nothing `writeNotifications` says — note or warning — repeats the topic or the URL
 * it was handed.** The file it plans must also survive being sourced by the notifier: a URL a service
 * really issues, with `&` in its query string, has to come back out of `bash` byte-identical.
 *
 * The write plan is **never applied**, so nothing lands on disk except the one scratch file the
 * sourcing case writes under the system temp directory. `XDG_CONFIG_HOME` is pointed at a scratch
 * directory before any call, so the planned path is never the operator's real credential file.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { WritePlan } from '../dist/core/writer.js';
import {
  NTFY_PUBLIC_ORIGIN,
  PUSH_DESTINATION_FORMS,
  resolvePushDestination,
  writeNotifications,
} from '../dist/generators/notifications.js';

// Before any call: the machine directory is resolved per call, not at import.
const scratch = mkdtempSync(join(tmpdir(), 'harness-push-destination-'));
process.env.XDG_CONFIG_HOME = scratch;

test.after(() => rmSync(scratch, { recursive: true, force: true }));

const TOPIC = 'harness-t0p1c-under-test';
const AMPERSAND_URL = 'https://example.invalid/hook?a=1&b=2';

test('the grammar resolves each accepted form, and nothing else', () => {
  const topicUrl = `https://ntfy.sh/${TOPIC}`;
  const cases = [
    [TOPIC, { kind: 'ntfy-topic', url: topicUrl }],
    [`ntfy.sh/${TOPIC}`, { kind: 'ntfy-topic', url: topicUrl }],
    [`NTFY.SH/${TOPIC}/`, { kind: 'ntfy-topic', url: topicUrl }],
    [topicUrl, { kind: 'url', url: topicUrl }],
    ['http://127.0.0.1:9/x', { kind: 'url', url: 'http://127.0.0.1:9/x' }],
    [AMPERSAND_URL, { kind: 'url', url: AMPERSAND_URL }],
    [`  ${TOPIC}\n`, { kind: 'ntfy-topic', url: topicUrl }],
    [`\t${AMPERSAND_URL}  `, { kind: 'url', url: AMPERSAND_URL }],
    ['', { kind: 'unrecognised' }],
    ['example.com/hook', { kind: 'unrecognised' }],
    ['my topic', { kind: 'unrecognised' }],
    ['a'.repeat(65), { kind: 'unrecognised' }],
    ['ftp://x', { kind: 'unrecognised' }],
    ['https://', { kind: 'unrecognised' }],
    ["https://example.invalid/it's", { kind: 'unrecognised' }],
  ];
  for (const [answer, expected] of cases) {
    assert.deepEqual(resolvePushDestination(answer), expected, `resolving ${JSON.stringify(answer)}`);
  }
  assert.equal(resolvePushDestination('a'.repeat(64)).kind, 'ntfy-topic', 'a 64-character topic is the longest legal one');
});

/** Run the generator with the opt-in taken, against a plan that is never applied. */
function plan(pushUrl) {
  const writePlan = new WritePlan();
  const result = writeNotifications({
    repoRoot: scratch,
    config: { pushEnvPath: '.claude/push-notify.env' },
    plan: writePlan,
    enabled: true,
    pushUrl,
  });
  return { writePlan, result, file: writePlan.requests.find((request) => request.content !== undefined) };
}

/** Nothing the generator says may contain the value it was handed, nor what that value resolves to. */
function assertNothingPrinted(result, ...values) {
  for (const line of [...result.notes, ...result.warnings]) {
    for (const value of values) {
      assert.ok(!line.includes(value), `a line repeated ${JSON.stringify(value)}:\n${line}`);
    }
  }
}

test('writeNotifications writes the resolved destination and never prints it', async (t) => {
  await t.test('a topic is written as its ntfy.sh address', () => {
    const { result, file } = plan(TOPIC);
    assert.equal(result.written, true);
    assert.match(file.content, new RegExp(`^HARNESS_PUSH_URL=https://ntfy\\.sh/${TOPIC}$`, 'm'));
    assertNothingPrinted(result, TOPIC);
  });

  await t.test('a URL with `&` is single-quoted, and sources back byte-identical', () => {
    const { result, file } = plan(AMPERSAND_URL);
    assert.equal(result.written, true);
    assert.match(file.content, /^HARNESS_PUSH_URL='https:\/\/example\.invalid\/hook\?a=1&b=2'$/m);

    const sourced = join(scratch, 'push.env.sourced');
    writeFileSync(sourced, file.content, 'utf8');
    const out = execFileSync('bash', ['-c', '. "$1"; printf %s "$HARNESS_PUSH_URL"', 'bash', sourced], {
      encoding: 'utf8',
    });
    assert.equal(out, AMPERSAND_URL);
    assertNothingPrinted(result, AMPERSAND_URL);
  });

  await t.test('an unrecognised destination enqueues nothing and warns once, without the value', () => {
    const answer = 'example.invalid/not-a-destination';
    const { writePlan, result } = plan(answer);
    assert.equal(result.written, false);
    assert.equal(writePlan.size, 0);
    assert.equal(result.warnings.length, 1);
    assert.ok(result.warnings[0].includes(PUSH_DESTINATION_FORMS), 'the warning does not state the accepted forms');
    assertNothingPrinted(result, answer, 'not-a-destination');
  });
});

test('the committed example file and the grammar agree', () => {
  const example = readFileSync(new URL('../templates/claude/push-notify.env.example', import.meta.url), 'utf8');
  for (const expected of [NTFY_PUBLIC_ORIGIN, 'http://', 'https://']) {
    assert.ok(example.includes(expected), `push-notify.env.example does not say ${expected}`);
  }
});
