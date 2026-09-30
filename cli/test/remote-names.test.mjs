/**
 * The remote-execution names and the `gh` probe.
 *
 * **The rule these tests exist to enforce: every remote-execution name has one owner,
 * `cli/src/remote/githubActions.ts`, and the one way this CLI runs `gh` honours the
 * `HARNESS_GH_CLI` test seam.** No case reaches the network: `gh` is always a stub under a
 * scratch directory, or a path that does not exist.
 */

import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { forgeTriggerApplies } from '../dist/config/model.js';
import {
  DEFAULT_TRIGGER_LABEL,
  GH_CLI_VARIABLE,
  TRIGGER_ALLOWED_BOTS_VARIABLE,
  TRIGGER_DISPATCH_EVENT_TYPE,
  TRIGGER_LABEL_VARIABLE,
  WORKFLOWS_DIR,
  WORKFLOW_RESUME_FILE,
  WORKFLOW_RESUME_PATH,
  WORKFLOW_RUN_FILE,
  WORKFLOW_RUN_PATH,
  WORKFLOW_TRIGGER_FILE,
  WORKFLOW_TRIGGER_PATH,
  ghCli,
  runGh,
} from '../dist/remote/githubActions.js';

const scratch = mkdtempSync(join(tmpdir(), 'harness-remote-names-'));
const saved = process.env[GH_CLI_VARIABLE];

test.after(() => {
  if (saved === undefined) delete process.env[GH_CLI_VARIABLE];
  else process.env[GH_CLI_VARIABLE] = saved;
  rmSync(scratch, { recursive: true, force: true });
});

test('each workflow path joins the workflows directory and its file', () => {
  assert.equal(WORKFLOW_RUN_PATH, `${WORKFLOWS_DIR}/${WORKFLOW_RUN_FILE}`);
  assert.equal(WORKFLOW_RESUME_PATH, `${WORKFLOWS_DIR}/${WORKFLOW_RESUME_FILE}`);
  assert.equal(WORKFLOW_TRIGGER_PATH, `${WORKFLOWS_DIR}/${WORKFLOW_TRIGGER_FILE}`);
});

// The YAML and shell mirrors spell these byte for byte, so a rename must fail here first.
test('the issue-trigger names keep their literal values', () => {
  assert.equal(WORKFLOW_TRIGGER_FILE, 'harness-trigger.yml');
  assert.equal(TRIGGER_LABEL_VARIABLE, 'HARNESS_TRIGGER_LABEL');
  assert.equal(DEFAULT_TRIGGER_LABEL, 'harness');
  assert.equal(TRIGGER_ALLOWED_BOTS_VARIABLE, 'HARNESS_TRIGGER_ALLOWED_BOTS');
  assert.equal(TRIGGER_DISPATCH_EVENT_TYPE, 'harness-task');
});

test('forgeTriggerApplies holds only for github with github-actions execution', () => {
  const base = { version: 1, defaultBranch: 'main', stateDir: 'sdlc-harness/', layers: [], commands: {} };
  assert.equal(forgeTriggerApplies({ ...base, execution: { target: 'github-actions' } }), false);
  assert.equal(forgeTriggerApplies({ ...base, forge: 'github' }), false);
  assert.equal(forgeTriggerApplies({ ...base, forge: 'github', execution: { target: 'github-actions' } }), true);
  assert.equal(forgeTriggerApplies({ ...base, forge: 'none', execution: { target: 'github-actions' } }), false);
});

test('the seam variable is honoured when non-empty and ignored when empty', () => {
  process.env[GH_CLI_VARIABLE] = '';
  assert.equal(ghCli(), 'gh');
  process.env[GH_CLI_VARIABLE] = '/some/stub';
  assert.equal(ghCli(), '/some/stub');
});

test('runGh returns the stub binary\'s stdout, stderr and status', () => {
  const stub = join(scratch, 'gh-stub');
  writeFileSync(stub, '#!/bin/sh\necho "gh-stub $1"\necho "on stderr" >&2\nexit 3\n');
  chmodSync(stub, 0o755);
  process.env[GH_CLI_VARIABLE] = stub;

  const result = runGh(['--version'], scratch);
  assert.deepEqual(result, { status: 3, stdout: 'gh-stub --version\n', stderr: 'on stderr\n' });
});

test('runGh returns undefined when the binary does not spawn', () => {
  process.env[GH_CLI_VARIABLE] = join(scratch, 'no-such-gh');
  assert.equal(runGh(['--version'], scratch), undefined);
});
