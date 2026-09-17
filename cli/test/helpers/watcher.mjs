/**
 * The driver the watcher suites share: the `autonomous-watcher.sh` that `init` writes, run one pass
 * at a time against a fixture repository, with the agent CLI and the notifier replaced by recorders.
 *
 * **The rule this module exists to enforce: a pass is observed only after the session it launched
 * has exited and been classified.** `tick` sources the written watcher and calls `tick; wait` in one
 * shell — the watcher header's own REPRO form — because the session is a background subshell of the
 * pass, and only the shell that spawned it can `wait` for it. A case reading the registry or the
 * clarification channel before that `wait` returns reads a half-finished exit.
 *
 * `node --test test` loads this file as a test file of its own, so nothing here runs at import time.
 *
 * ## Three non-obvious choices
 *
 * 1. **The stub sleeps before its body runs.** The pass writes the session's `pid` to the registry
 *    right after spawning it, and the session's exit classification writes the same file; both are
 *    read-modify-rename, so a stub that exited at once could lose one of the two updates.
 * 2. **The notifier is replaced, not stubbed through an environment variable.** The recorder is the
 *    file the watcher executes, so no desktop banner or push can leave the machine whatever a host's
 *    push settings hold.
 * 3. **The cleanup pass is pushed out of reach** (`CLEANUP_INTERVAL_SECS`), because it runs on a
 *    process's first pass and acts on worktrees and branches, none of which these suites assert.
 */

import assert from 'node:assert/strict';
import { accessSync, constants as fsConstants, existsSync, readFileSync } from 'node:fs';
import { chmod, mkdir, readdir, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';

import { createFixture, runBash, runCli } from './fixture.mjs';

const STATE_DIR = 'sdlc-harness';
const WATCHER_PATH = 'scripts/autonomous-watcher.sh';
const NOTIFY_PATH = 'scripts/autonomous-notify.sh';
const REGISTRY_PATH = `${STATE_DIR}/autonomous_logs/registry.json`;
const WATCHER_LOG_PATH = `${STATE_DIR}/autonomous_logs/watcher.log`;

/** The recorders' own directory inside the fixture — never on the machine's `PATH`. */
const RECORDER_DIR = 'watcher-test';
const PROMPT_DELIMITER = '----- end of prompt -----';

/** The seed `init`'s own tests use: a repository whose stack detection resolves every command. */
function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
  };
}

function onPath(name) {
  for (const entry of (process.env.PATH ?? '').split(delimiter)) {
    if (entry === '') continue;
    try {
      accessSync(join(entry, name), fsConstants.X_OK);
      return true;
    } catch {
      // Not here; keep looking.
    }
  }
  return false;
}

/** A shell single-quoted literal, so a fixture path is one word whatever it contains. */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

function readText(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

async function sortedNames(path, exclude) {
  if (!existsSync(path)) return [];
  return (await readdir(path)).filter((name) => name !== exclude).sort();
}

/**
 * Build a fixture `init` has wired, with the agent and the notifier recorded, or skip the test and
 * return `null` when `bash` or `jq` does not resolve — the watcher refuses to start without either.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ branch?: string }} [options]
 */
export async function createWatcherFixture(t, { branch = 'feat_x' } = {}) {
  for (const tool of ['bash', 'jq']) {
    if (!onPath(tool)) {
      t.skip(`${tool} does not resolve on this process's PATH, so ${WATCHER_PATH} cannot be driven here`);
      return null;
    }
  }

  const { dir, cleanup } = await createFixture({ files: nodeProjectFiles() });
  t.after(cleanup);

  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

  const clarDir = join(dir, STATE_DIR, 'clarifications', branch);
  const recorderDir = join(dir, RECORDER_DIR);
  const stubPath = join(recorderDir, 'agent-stub.sh');
  const stubBodyPath = join(recorderDir, 'agent-stub-body.sh');
  const promptsPath = join(recorderDir, 'prompts.txt');
  const notificationsPath = join(recorderDir, 'notifications.txt');
  const logPath = join(dir, STATE_DIR, 'autonomous_logs', `${branch}.log`);

  await mkdir(recorderDir, { recursive: true });
  // `$2` is the argument after `-p`: the watcher's launch line is `"$AGENT_CLI" -p "$launch_prompt" …`.
  await writeFile(
    stubPath,
    [
      '#!/usr/bin/env bash',
      `printf '%s\\n%s\\n' "$2" ${shellQuote(PROMPT_DELIMITER)} >> ${shellQuote(promptsPath)}`,
      'sleep 0.3',
      `. ${shellQuote(stubBodyPath)}`,
      'exit 0',
      '',
    ].join('\n'),
    'utf8',
  );
  await chmod(stubPath, 0o755);
  await writeFile(stubBodyPath, ':\n', 'utf8');

  const notifyPath = join(dir, NOTIFY_PATH);
  await writeFile(
    notifyPath,
    `#!/usr/bin/env bash\nprintf '%s\\t%s\\t%s\\n' "$1" "$2" "\${4-}" >> ${shellQuote(notificationsPath)}\n`,
    'utf8',
  );
  await chmod(notifyPath, 0o755);

  const ensureClarDir = () => mkdir(clarDir, { recursive: true });

  return {
    dir,
    branch,
    clarDir,
    async writeQuestion(n, body) {
      await ensureClarDir();
      await writeFile(join(clarDir, `question_${n}.md`), body, 'utf8');
    },
    async writeAnswer(n, body) {
      await ensureClarDir();
      await writeFile(join(clarDir, `answer_${n}.md`), body, 'utf8');
    },
    topLevel: () => sortedNames(clarDir, 'answered'),
    archived: () => sortedNames(join(clarDir, 'answered')),
    /** The body the stub runs in the run's working copy, with `CLAR` set to `clarDir`, before exit 0. */
    setStub: (shellBody) => writeFile(stubBodyPath, `${shellBody}\n`, 'utf8'),
    async seedRecord(fields = {}) {
      const record = { status: 'parked', worktree: dir, log_path: logPath, engine: 'task', ...fields };
      await writeFile(join(dir, REGISTRY_PATH), `${JSON.stringify({ runs: { [branch]: record } }, null, 2)}\n`, 'utf8');
    },
    record: () => JSON.parse(readFileSync(join(dir, REGISTRY_PATH), 'utf8')).runs[branch],
    async tick(env = {}) {
      const result = await runBash(
        dir,
        ['-c', '. "$1" status >/dev/null; tick; wait', '_', join(dir, WATCHER_PATH)],
        {
          HARNESS_AGENT_CLI: stubPath,
          CLAR: clarDir,
          AUTO_TAIL_TERMINAL: '0',
          USAGE_CHECK_ENABLED: '0',
          STALL_CHECK_ENABLED: '0',
          USAGE_LANE_STATE_ENABLED: '0',
          USAGE_LANE_LOCK_ENABLED: '0',
          CLEANUP_INTERVAL_SECS: '999999999999',
          HOME: join(dir, 'home'),
          XDG_CONFIG_HOME: join(dir, 'home', '.config'),
          XDG_STATE_HOME: join(dir, 'home', '.local', 'state'),
          ...env,
        },
      );
      assert.equal(result.status, 0, `the watcher pass exited ${result.status}\n${result.stdout}\n${result.stderr}`);
      return result;
    },
    prompts: () =>
      readText(promptsPath)
        .split(`${PROMPT_DELIMITER}\n`)
        .slice(0, -1)
        .map((entry) => entry.replace(/\n$/, '')),
    notifications: () =>
      readText(notificationsPath)
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => {
          const [event, lineBranch, detail = ''] = line.split('\t');
          return { event, branch: lineBranch, detail };
        }),
    watcherLog: () => readText(join(dir, WATCHER_LOG_PATH)),
  };
}
