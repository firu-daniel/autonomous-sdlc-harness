#!/usr/bin/env node
// check-model-revisions.mjs — report how the four pinned model revisions stand against upstream `main`.
// Hand-written for this repository, like check-rendered-workflows.mjs; not an `init` output.
//
// THE RULE. Drift is a notice, an unresolvable pin is a failure, and an outage is a warning. Each
// retrieval path pins two Hugging Face revisions: the CLI's in `MODEL_REVISIONS`
// (`cli/src/retrieval/models.ts`), the Python service's as `EMBEDDING_*` / `RERANK_*` constants
// (`docs-retrieval-service/src/harness_docs_retrieval/models.py`). A pin behind upstream `main` is
// a deliberate choice, so it prints `::notice::`; a pin upstream answers `404` for would break every
// adopter's fresh `fetch-models`, so it prints `::error::` and fails. A network failure or any other
// non-2xx answer prints `::warning::`, is not retried, and leaves the exit alone. A pin that cannot
// be read from the tree is a defect here and fails.
//
// Usage: node scripts/check-model-revisions.mjs
//          one summary line per pin, `<path> <id> <pin> — <outcome>`, plus any annotations
// Exit: 0 every pin resolves, drifted or not · 1 a pin is unreadable or no longer resolves ·
//       2 any argument, because the script takes none
// Depends on gate 2a's build: it imports `cli/dist/retrieval/models.js`.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const NAME = 'check-model-revisions';
const HUB = 'https://huggingface.co/api/models';
const PIN = /^[0-9a-f]{40}$/;
const PYTHON_MODELS = 'docs-retrieval-service/src/harness_docs_retrieval/models.py';
const CLI_MODELS = 'cli/dist/retrieval/models.js';

if (process.argv.length > 2) {
  console.error(`${NAME}: takes no arguments, got: ${process.argv.slice(2).join(' ')}`);
  console.error('  usage: node scripts/check-model-revisions.mjs');
  process.exit(2);
}

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: dirname(fileURLToPath(import.meta.url)),
  encoding: 'utf8',
}).trim();

function refuse(message) {
  console.log(`::error title=model revision unreadable::${message}`);
  console.error(`${NAME}: ${message}`);
  process.exit(1);
}

async function cliPins() {
  let module;
  try {
    module = await import(pathToFileURL(join(repoRoot, CLI_MODELS)).href);
  } catch (error) {
    refuse(`cannot import ${CLI_MODELS} (run gate 2a, npm run build, first): ${error.message}`);
  }
  const revisions = module.MODEL_REVISIONS;
  if (revisions === null || typeof revisions !== 'object') refuse(`${CLI_MODELS} exports no MODEL_REVISIONS`);
  return Object.entries(revisions).map(([id, pin]) => ({ path: 'CLI', id, pin }));
}

function pythonPins() {
  let text;
  try {
    text = readFileSync(join(repoRoot, PYTHON_MODELS), 'utf8');
  } catch (error) {
    refuse(`cannot read ${PYTHON_MODELS}: ${error.message}`);
  }
  const values = {};
  for (const [, role, kind, value] of text.matchAll(/^(EMBEDDING|RERANK)_(MODEL|REVISION) = "([^"]+)"$/gm)) {
    const key = `${role}_${kind}`;
    if (key in values) refuse(`${PYTHON_MODELS} carries ${key} more than once`);
    values[key] = value;
  }
  return ['EMBEDDING', 'RERANK']
    .filter((role) => `${role}_MODEL` in values && `${role}_REVISION` in values)
    .map((role) => ({ path: 'Python', id: values[`${role}_MODEL`], pin: values[`${role}_REVISION`] }));
}

/** `{ status, body }` for a 2xx or 404 answer, `{ unreachable }` naming the cause otherwise. */
async function revision(id, rev) {
  let response;
  try {
    response = await fetch(`${HUB}/${id}/revision/${rev}`, { redirect: 'follow' });
  } catch (error) {
    return { unreachable: error.cause?.code ?? error.message };
  }
  if (response.status === 404) return { status: 404 };
  if (!response.ok) return { unreachable: `HTTP ${response.status}` };
  try {
    return { status: response.status, body: await response.json() };
  } catch (error) {
    return { unreachable: `unparseable body: ${error.message}` };
  }
}

async function check({ path, id, pin }) {
  const pinned = await revision(id, pin);
  if (pinned.status === 404) {
    console.log(`::error title=model revision unresolvable::${id} is pinned to ${pin}, which upstream no longer resolves`);
    return { failed: true, outcome: 'does not resolve (404)' };
  }
  if (pinned.unreachable !== undefined) {
    console.log(`::warning title=model revision unchecked::${id} at ${pin}: ${pinned.unreachable}`);
    return { failed: false, outcome: `unreachable (${pinned.unreachable})` };
  }
  const main = await revision(id, 'main');
  if (main.status === 404 || main.unreachable !== undefined) {
    const status = main.unreachable ?? 'HTTP 404';
    console.log(`::warning title=model revision unchecked::${id} upstream main: ${status}`);
    return { failed: false, outcome: `unreachable (${status})` };
  }
  const sha = main.body?.sha;
  const upstreamId = main.body?.id;
  if (typeof upstreamId === 'string' && upstreamId !== id) {
    console.log(`::notice title=model repository renamed::${id} now answers as ${upstreamId}`);
  }
  if (typeof sha !== 'string') {
    console.log(`::warning title=model revision unchecked::${id} upstream main answered with no sha`);
    return { failed: false, outcome: 'unreachable (no sha in answer)' };
  }
  if (sha !== pin) {
    console.log(`::notice title=model revision drift::${id} is pinned to ${pin}; upstream main is ${sha}`);
    return { failed: false, outcome: `drifted to ${sha}` };
  }
  return { failed: false, outcome: 'resolves' };
}

const cli = await cliPins();
const python = pythonPins();
if (cli.length !== 2 || python.length !== 2) {
  refuse(`expected 2 CLI and 2 Python pins, read ${cli.length} from ${CLI_MODELS} and ${python.length} from ${PYTHON_MODELS}`);
}
for (const { path, id, pin } of [...cli, ...python]) {
  if (typeof pin !== 'string' || !PIN.test(pin)) refuse(`${path} pin for ${id} is not a 40-hex revision: ${pin}`);
}

let failed = false;
for (const pair of [...cli, ...python]) {
  const result = await check(pair);
  failed ||= result.failed;
  console.log(`${pair.path} ${pair.id} ${pair.pin} — ${result.outcome}`);
}
process.exit(failed ? 1 : 0);
