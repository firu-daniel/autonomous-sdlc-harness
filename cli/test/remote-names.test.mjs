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

import {
  GH_CLI_VARIABLE,
  WORKFLOWS_DIR,
  WORKFLOW_RESUME_FILE,
  WORKFLOW_RESUME_PATH,
  WORKFLOW_RUN_FILE,
  WORKFLOW_RUN_PATH,
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
