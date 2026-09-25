/**
 * The names remote execution on GitHub Actions is built from, and the one way this CLI runs `gh`.
 *
 * **The rule this module exists to enforce: every remote-execution name has one owner, and a copy
 * anywhere else in `cli/src` imports it.** The workflow file names and paths, the template directory,
 * the repository secret and variable names, the state-artifact name and the `gh` test-seam variable
 * are declared here once; the generator that writes the workflows and the `doctor` checks that grade
 * them read these constants rather than retyping a literal.
 *
 * Nothing here is consulted unless `config/model.ts` → `remoteExecutionApplies(config)` is true:
 * every consumer tests that switch first.
 *
 * **Shell and YAML mirrors that must agree byte for byte.** The compiler cannot reach them, so each
 * declares the mirror in its own header, and a rename here is an edit to each of them:
 * `cli/templates/scripts/remote-run.sh`, `cli/templates/scripts/autonomous-watcher.sh`,
 * `cli/templates/github/workflows/harness-run.yml` and `cli/templates/github/workflows/harness-resume.yml`.
 *
 * **Why {@link GH_CLI_VARIABLE} exists.** Every real route into `gh` reaches the network, which no
 * test may do, so the binary run as `gh` is taken from `${HARNESS_GH_CLI:-gh}` in both this CLI and
 * `remote-run.sh` — the same test seam `${HARNESS_AGENT_CLI:-claude}` gives the watcher's agent
 * (`docs/outer-loop-verification.md` → `## 0. Method and fixtures` → *The agent stub*).
 *
 * It reads no configuration and writes nothing.
 */

import { spawnSync } from 'node:child_process';

/** The adopter-side directory GitHub reads workflows from. */
export const WORKFLOWS_DIR = '.github/workflows';

export const WORKFLOW_RUN_FILE = 'harness-run.yml';
export const WORKFLOW_RUN_PATH = `${WORKFLOWS_DIR}/${WORKFLOW_RUN_FILE}`;

export const WORKFLOW_RESUME_FILE = 'harness-resume.yml';
export const WORKFLOW_RESUME_PATH = `${WORKFLOWS_DIR}/${WORKFLOW_RESUME_FILE}`;

/** Under `cli/templates/`; stored without the dot, which `init` adds (`cli/templates/README.md`). */
export const WORKFLOW_TEMPLATE_DIR = 'github/workflows';

/** The Actions artifact every job uploads its state bundle as. */
export const STATE_ARTIFACT_NAME = 'harness-state';

/** Repository variable naming the `runs-on` label; unset means `ubuntu-latest`. */
export const RUNNER_VARIABLE = 'HARNESS_RUNNER';

/** Repository variable: any non-empty value stops every job and poller tick before it launches. */
export const REMOTE_STOP_VARIABLE = 'HARNESS_REMOTE_STOP';

/** Repository secret for subscription billing. */
export const OAUTH_TOKEN_SECRET = 'CLAUDE_CODE_OAUTH_TOKEN';

/** Repository secret for API billing; wins over {@link OAUTH_TOKEN_SECRET} when both are set. */
export const API_KEY_SECRET = 'ANTHROPIC_API_KEY';

export const PUSH_URL_SECRET = 'HARNESS_PUSH_URL';
export const GIT_TOKEN_SECRET = 'HARNESS_GIT_TOKEN';

/** The environment variable naming the binary run as `gh`: `${HARNESS_GH_CLI:-gh}`. */
export const GH_CLI_VARIABLE = 'HARNESS_GH_CLI';

/** The binary run as `gh` when {@link GH_CLI_VARIABLE} is unset or empty. */
export const DEFAULT_GH_CLI = 'gh';

/**
 * A bound rather than a deadline: a `gh` call is a network round trip that normally answers in
 * seconds, and a hung one must cost this bound instead of the command an operator ran to find out
 * what is wrong.
 */
const GH_TIMEOUT_MS = 30_000;

/** What one `gh` invocation returned. `status` is `null` when a signal (including the bound) stopped it. */
export interface GhResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** The binary run as `gh`: the {@link GH_CLI_VARIABLE} value when non-empty, else `gh`. */
export function ghCli(): string {
  const configured = process.env[GH_CLI_VARIABLE];
  return configured !== undefined && configured !== '' ? configured : DEFAULT_GH_CLI;
}

/**
 * Run `gh` once with a fixed argument vector — never a shell string — bounded by {@link GH_TIMEOUT_MS}.
 * Returns `undefined` when the binary does not spawn at all.
 *
 * **`spawnSync` rather than `execFileSync`**, for the reason `cli/src/commands/doctor.ts` →
 * `runNotifier` gives: the caller needs the child's stderr on a zero exit too, which `execFileSync`
 * surfaces only on its error path. A non-zero status is returned, not thrown, for the caller to grade.
 */
export function runGh(args: readonly string[], cwd: string): GhResult | undefined {
  const result = spawnSync(ghCli(), args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: GH_TIMEOUT_MS,
    windowsHide: true,
  });
  // The bound and an output overflow also set `error`, but kill a child that ran, so they carry a
  // signal; an error with neither status nor signal is a binary that never started.
  if (result.error !== undefined && result.status === null && result.signal === null) return undefined;
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}
