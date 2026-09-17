/**
 * The setup-time half of docs retrieval: installing the runtime and downloading the models, which
 * `init` runs after its plan when the config in effect has retrieval on.
 *
 * **The rule this module exists to enforce: every download retrieval needs happens here, at setup
 * time, and never on a run.** An unattended run has no network to count on, so the runtime install
 * and the model download both happen while an operator is present.
 *
 * - **The install skips on `retrievalRuntimeState().installed` and nothing else.** The `.mcp.json`
 *   launcher (`docs-search-server.sh`) runs the runtime's entry alone, so an installation that
 *   resolves its own peers still needs the runtime. The install-state tests live in
 *   `retrieval/runtime.ts` alone, the same predicate `doctor` grades on.
 * - **A stub run never installs and never downloads.** With `RETRIEVAL_STUB_ENV` set, a missing
 *   runtime is a warning rather than an `npm` call, so a test that forgets to plant one stays offline.
 * - **A failed step is a warning.** The wiring the plan wrote stays valid; `doctor` fails until a
 *   re-run completes the step.
 *
 * Both steps write machine state outside the repository, through `npm` and Transformers.js, not
 * through the write engine (`cli/src/core/writer.ts` header).
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { modelFilesPresent, RETRIEVAL_STUB_ENV } from './models.js';
import {
  ownManifestString,
  retrievalCliEntry,
  retrievalModelCacheDir,
  retrievalPeers,
  retrievalRuntimeDir,
  retrievalRuntimeState,
  RUNTIME_CLI_RELATIVE,
} from './runtime.js';

/** Both child processes may take minutes on a cold cache. */
const STEP_TIMEOUT_MS = 900000;

const REMEDY =
  're-run `npx autonomous-sdlc-harness init`; `npx autonomous-sdlc-harness doctor` reports what is missing';

/** Set to a non-empty value, the same reading `models.ts` → `resolveModels` takes. */
function stubSelected(): boolean {
  return (process.env[RETRIEVAL_STUB_ENV] ?? '') !== '';
}

/** A warning for a failed child: the command, its exit status and the last line it wrote to stderr. */
function failureWarning(step: string, command: readonly string[], error: unknown): string {
  const failure = error as { status?: number | null; signal?: string | null; code?: string; stderr?: Buffer | string } | null;
  const status =
    typeof failure?.status === 'number'
      ? `exit status ${failure.status}`
      : failure?.signal
        ? `killed by ${failure.signal}`
        : `not run (${failure?.code ?? String(error)})`;
  const stderr = failure?.stderr === undefined ? '' : String(failure.stderr);
  const lastLine = stderr
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .pop();
  return `docs retrieval ${step} failed: \`${command.join(' ')}\` ended with ${status}${
    lastLine === undefined ? '' : `: ${lastLine}`
  }. The retrieval wiring is written and stays valid; ${REMEDY}`;
}

function runStep(step: string, command: readonly [string, ...string[]], warnings: string[]): void {
  const [file, ...args] = command;
  try {
    execFileSync(file, args, { stdio: ['ignore', 'ignore', 'pipe'], timeout: STEP_TIMEOUT_MS });
  } catch (error) {
    warnings.push(failureWarning(step, command, error));
  }
}

function setUpRuntime(dryRun: boolean, notes: string[], warnings: string[]): void {
  const runtimeDir = retrievalRuntimeDir();
  const state = retrievalRuntimeState();
  if (state.installed) {
    notes.push(`docs retrieval runtime already installed: version ${state.version ?? 'unknown'} in ${runtimeDir}`);
    return;
  }
  const command: [string, ...string[]] = [
    'npm',
    'install',
    '--prefix',
    runtimeDir,
    '--no-audit',
    '--no-fund',
    `${ownManifestString('name')}@${ownManifestString('version')}`,
    ...retrievalPeers().map((peer) => `${peer.name}@${peer.range}`),
  ];
  if (dryRun) {
    notes.push(`docs retrieval runtime would be installed (dry run): \`${command.join(' ')}\``);
    return;
  }
  if (stubSelected()) {
    warnings.push(
      `docs retrieval runtime is not installed in ${runtimeDir}, and a stub run (${RETRIEVAL_STUB_ENV} set) never installs it; unset ${RETRIEVAL_STUB_ENV} and ${REMEDY}`,
    );
    return;
  }
  mkdirSync(runtimeDir, { recursive: true });
  runStep('runtime install', command, warnings);
}

function setUpModels(dryRun: boolean, notes: string[], warnings: string[]): void {
  const cacheDir = retrievalModelCacheDir();
  if (stubSelected()) {
    notes.push(`docs retrieval models: stub models (${RETRIEVAL_STUB_ENV} set) need no download`);
    return;
  }
  if (modelFilesPresent(cacheDir).present) {
    notes.push(`docs retrieval models already cached in ${cacheDir}`);
    return;
  }
  // In a dry run the install above has not happened, so the runtime's entry is named where no other resolves.
  const entry = retrievalCliEntry()?.entry;
  const command: [string, ...string[]] = [
    process.execPath,
    entry ?? join(retrievalRuntimeDir(), RUNTIME_CLI_RELATIVE),
    'docs',
    'fetch-models',
  ];
  if (dryRun) {
    notes.push(`docs retrieval models would be downloaded into ${cacheDir} (dry run): \`${command.join(' ')}\``);
    return;
  }
  if (entry === undefined) {
    warnings.push(
      `docs retrieval models were not downloaded: no CLI entry can load the retrieval packages, because the runtime in ${retrievalRuntimeDir()} is not installed; ${REMEDY}`,
    );
    return;
  }
  runStep('model download', command, warnings);
}

/** Install the runtime, then download the models; each step skips when already satisfied. */
export function setUpRetrieval(options: { dryRun: boolean }): { notes: string[]; warnings: string[] } {
  const notes: string[] = [];
  const warnings: string[] = [];
  setUpRuntime(options.dryRun, notes, warnings);
  setUpModels(options.dryRun, notes, warnings);
  return { notes, warnings };
}
