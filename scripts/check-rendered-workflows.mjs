#!/usr/bin/env node
// check-rendered-workflows.mjs — fail when a workflow `init` renders is not YAML GitHub can parse.
// Hand-written for this repository, like check-flow-graph.sh; not an `init` output.
//
// THE RULE. Every workflow `init` renders under `forge: github` and `execution.target:
// github-actions` parses as YAML, and 0.6.1's `harness-control.yml` does not. The render is
// `init`'s own output in a throwaway repository, never the templates read as text, and the rendered
// set must be exactly the four harness workflows: a render that wrote nothing is a finding.
//
// Usage: node scripts/check-rendered-workflows.mjs
//          render in a throwaway repository under the OS temp directory and parse each file
//        node scripts/check-rendered-workflows.mjs --negatives
//          cli/test/fixtures/harness-control-0.6.1.yml must be refused by the same parse
//        node scripts/check-rendered-workflows.mjs --actionlint
//          render as above and run `actionlint -shellcheck= -pyflakes=` over each rendered file,
//          which must report nothing, and over the 0.6.1 fixture, which must report `syntax-check`.
//          No `-ignore` is set: no shipped-template finding has been argued as a deliberate shape.
//        node scripts/check-rendered-workflows.mjs --zizmor
//          render as above and run `zizmor 1.30.1 --offline --no-config --format=json` over the
//          render's `.github/`. Every finding outside RESIDUAL is a finding here, and so is a
//          RESIDUAL entry that no longer fires. zizmor is taken from PATH when it reports 1.30.1,
//          else from `uvx zizmor@1.30.1`; another version's audit set is not the one RESIDUAL was
//          measured against. The online `--gh-token` audit is a hand-run step, never this mode.
// Exit: 0 clean · 1 one or more findings, each on stderr as
//       `check-rendered-workflows: <file> — <reason>`, all reported · 2 bad usage ·
//       4 only under --actionlint, when actionlint is not on PATH, and under --zizmor, when
//       neither PATH nor uvx provides zizmor 1.30.1
// Depends on gate 2a's build: the default, --actionlint and --zizmor modes run `cli/dist/cli.js`.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const NAME = 'check-rendered-workflows';
const EXPECTED = ['harness-control.yml', 'harness-resume.yml', 'harness-run.yml', 'harness-trigger.yml'];
const NEGATIVE = 'cli/test/fixtures/harness-control-0.6.1.yml';
const ZIZMOR_VERSION = '1.30.1';
/**
 * The zizmor findings the shipped workflows keep, as `<file> <audit> <job>`, each justified in its
 * template's header. `artipacked`: the job pushes, or runs `git ls-remote`, through the checkout's
 * credential. `adhoc-packages`: the latest Claude Code CLI is installed on purpose, and a pinned
 * install is flagged too.
 */
const RESIDUAL = [
  'harness-run.yml artipacked run',
  'harness-run.yml artipacked collect',
  'harness-run.yml adhoc-packages run',
  'harness-resume.yml artipacked poll',
  'harness-trigger.yml artipacked trigger',
  'harness-control.yml artipacked control',
  'harness-control.yml adhoc-packages control',
];

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: dirname(fileURLToPath(import.meta.url)),
  encoding: 'utf8',
}).trim();
// Resolved from the workspace root, where `package.json` declares it as a devDependency.
const yaml = createRequire(join(repoRoot, 'package.json'))('js-yaml');
const cliPath = join(repoRoot, 'cli', 'dist', 'cli.js');

const findings = [];
const finding = (file, reason) => findings.push(`${NAME}: ${file} — ${reason}`);

function usage(message) {
  console.error(`${NAME}: ${message}`);
  console.error('  usage: node scripts/check-rendered-workflows.mjs [--negatives | --actionlint | --zizmor]');
  process.exit(2);
}

function onPath(binary) {
  return (process.env.PATH ?? '')
    .split(delimiter)
    .some((dir) => dir !== '' && existsSync(join(dir, binary)));
}

/**
 * The 0.6.1 fixture, repo-relative: byte for byte the `harness-control.yml` 0.6.1 shipped (git blob
 * `1b4f0fc33200d876e4089ebe4013120e48a45335`, `cli/src/generators/githubWorkflows.ts` →
 * `UNPARSEABLE_CONTROL_RELEASES`).
 */
function negativePath() {
  const path = join(repoRoot, NEGATIVE);
  if (!existsSync(path)) finding(NEGATIVE, 'the negative fixture is missing');
  return existsSync(path) ? path : undefined;
}

/**
 * Runs `fn(dir)` against `.github/workflows/` of a fresh repository `init` adopted, inside a temp
 * root this call created and removes on every exit path. Returns nothing when the render failed;
 * the failure is already a finding.
 */
function withRendered(fn) {
  if (!existsSync(cliPath)) {
    finding('cli/dist/cli.js', 'missing; run gate 2a (npm run build) first');
    return;
  }
  const root = mkdtempSync(join(tmpdir(), 'harness-rendered-workflows-'));
  try {
    const repo = join(root, 'repo');
    const home = join(root, 'home');
    mkdirSync(repo);
    mkdirSync(home);
    // `cli/test/helpers/fixture.mjs` → ISOLATED_ENV, plus every machine-local directory the CLI
    // resolves (`cli/src/machine/paths.ts`) pointed under the temp root.
    const env = {
      ...process.env,
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_SYSTEM: '/dev/null',
      GIT_TERMINAL_PROMPT: '0',
      CLAUDE_CONFIG_DIR: join(home, 'claude'),
      XDG_STATE_HOME: join(home, 'state'),
      XDG_CONFIG_HOME: join(home, 'config'),
      XDG_CACHE_HOME: join(home, 'cache'),
    };
    // `cli/src/commands/init.ts` → SELF_ADOPT_ENV: this checkout's self-adoption must not leak in.
    delete env.HARNESS_SELF_ADOPT;
    const run = (file, args) =>
      execFileSync(file, args, { cwd: repo, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    try {
      run('git', ['init', '--quiet']);
      // Gate 12's setup sequence.
      for (const args of [
        ['init', '--non-interactive'],
        ['config', 'set', 'execution.target', 'github-actions'],
        ['config', 'set', 'forge', 'github'],
        ['init', '--non-interactive'],
      ]) {
        run(process.execPath, [cliPath, ...args, '--cwd', repo]);
      }
    } catch (error) {
      const said = `${error.stderr ?? ''}${error.stdout ?? ''}`.trim().split('\n').slice(-5).join(' | ');
      finding('init', `the render failed: ${error.message.split('\n')[0]}${said ? ` — ${said}` : ''}`);
      return;
    }
    const dir = join(repo, '.github', 'workflows');
    const rendered = existsSync(dir) ? readdirSync(dir).sort() : [];
    if (rendered.join('\n') !== EXPECTED.join('\n')) {
      finding(
        '.github/workflows/',
        `expected exactly ${EXPECTED.join(', ')}; init rendered ${rendered.length === 0 ? 'nothing' : rendered.join(', ')}`,
      );
      return;
    }
    fn(dir);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function parseError(path) {
  try {
    yaml.safeLoad(readFileSync(path, 'utf8'), { filename: path });
    return undefined;
  } catch (error) {
    return error.message.split('\n')[0];
  }
}

/** actionlint's status and its combined output; a non-zero status is a result, not a throw. */
function actionlint(path) {
  try {
    const out = execFileSync('actionlint', ['-shellcheck=', '-pyflakes=', path], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, out };
  } catch (error) {
    if (typeof error.status !== 'number') throw error;
    return { status: error.status, out: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

/** The zizmor command line that reports {@link ZIZMOR_VERSION}, or a reason none does. */
function resolveZizmor() {
  const reports = (file, args) => {
    try {
      const out = execFileSync(file, [...args, '--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return out.trim() === `zizmor ${ZIZMOR_VERSION}`;
    } catch {
      return false;
    }
  };
  if (onPath('zizmor') && reports('zizmor', [])) return { file: 'zizmor', args: [] };
  if (onPath('uvx') && reports('uvx', [`zizmor@${ZIZMOR_VERSION}`])) {
    return { file: 'uvx', args: [`zizmor@${ZIZMOR_VERSION}`] };
  }
  return {
    reason: `zizmor ${ZIZMOR_VERSION} is not available: not on PATH at that version, and uvx is ${
      onPath('uvx') ? 'on PATH but did not provide it' : 'not on PATH'
    }`,
  };
}

/** Grades one zizmor run over `<render>/.github` against {@link RESIDUAL}. */
function zizmorFindings(tool, githubDir) {
  let out;
  let err = '';
  try {
    out = execFileSync(tool.file, [...tool.args, '--offline', '--no-config', '--format=json', githubDir], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    // zizmor exits non-zero when it reports a finding; only output that is not JSON is a failure.
    if (typeof error.status !== 'number') throw error;
    out = error.stdout ?? '';
    err = `exit ${error.status}: ${String(error.stderr ?? '').trim().split('\n').slice(-5).join(' | ')}`;
  }
  let results;
  try {
    results = JSON.parse(out);
    if (!Array.isArray(results)) throw new Error('not an array');
  } catch (error) {
    finding('.github/', `zizmor printed no JSON findings list (${error.message}) ${err}`.trim());
    return;
  }
  const seen = new Set();
  for (const result of results) {
    const primary = (result.locations ?? []).find((loc) => loc.symbolic?.kind === 'Primary');
    const path = primary?.symbolic?.key?.Local?.verbatim_path ?? '';
    const file = path.split(/[\\/]/).pop() || '<unknown file>';
    const route = primary?.symbolic?.route?.route ?? [];
    const job = route[0]?.Key === 'jobs' && typeof route[1]?.Key === 'string' ? route[1].Key : '<no job>';
    const key = `${file} ${result.ident} ${job}`;
    seen.add(key);
    if (!RESIDUAL.includes(key)) {
      finding(`.github/workflows/${file}`, `zizmor ${result.ident} in job ${job}: ${result.desc}`);
    }
  }
  for (const key of RESIDUAL) {
    if (seen.has(key)) continue;
    const [file, ident, job] = key.split(' ');
    finding(`.github/workflows/${file}`, `RESIDUAL lists zizmor ${ident} in job ${job}, which no longer fires`);
  }
}

const args = process.argv.slice(2);
if (args.length > 1) usage('expected at most one argument');
const mode = args[0] ?? 'render';
if (!['render', '--negatives', '--actionlint', '--zizmor'].includes(mode)) usage(`unknown argument '${mode}'`);

if (mode === 'render') {
  withRendered((dir) => {
    for (const file of EXPECTED) {
      const reason = parseError(join(dir, file));
      if (reason !== undefined) finding(`.github/workflows/${file}`, `does not parse as YAML: ${reason}`);
    }
  });
} else if (mode === '--negatives') {
  const path = negativePath();
  if (path !== undefined && parseError(path) === undefined) {
    finding(NEGATIVE, 'parses as YAML; the gate can no longer see a workflow GitHub refuses');
  }
} else if (mode === '--zizmor') {
  const tool = resolveZizmor();
  if (tool.reason !== undefined) {
    console.error(`${NAME}: ${tool.reason}`);
    process.exit(4);
  }
  withRendered((dir) => zizmorFindings(tool, dirname(dir)));
} else {
  if (!onPath('actionlint')) {
    console.error(`${NAME}: actionlint is not on PATH`);
    process.exit(4);
  }
  withRendered((dir) => {
    for (const file of EXPECTED) {
      const { status, out } = actionlint(join(dir, file));
      if (status !== 0) finding(`.github/workflows/${file}`, `actionlint exit ${status}: ${out.trim()}`);
    }
  });
  const path = negativePath();
  if (path !== undefined) {
    const { status, out } = actionlint(path);
    if (status === 0 || !out.includes('[syntax-check]')) {
      finding(NEGATIVE, `actionlint reported no syntax-check finding (exit ${status})`);
    }
  }
}

for (const line of findings) console.error(line);
process.exit(findings.length === 0 ? 0 : 1);
