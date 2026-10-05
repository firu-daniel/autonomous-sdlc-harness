/**
 * The names remote execution on GitHub Actions is built from, and the one way this CLI runs `gh`.
 *
 * **The rule this module exists to enforce: every remote-execution name has one owner, and a copy
 * anywhere else in `cli/src` imports it.** The workflow file names and paths, the template directory,
 * the repository secret and variable names, the two artifact names and the `gh` test-seam variable
 * and the rendered CLI-version pin are declared here once; the generator that writes the workflows and the `doctor` checks that grade
 * them read these constants rather than retyping a literal, and so does `generators/repoRoot.ts`,
 * which spells the two workflow `.bak` ignore rules whatever `execution.target` says.
 *
 * Except in `generators/repoRoot.ts`, nothing here is consulted unless `config/model.ts` →
 * `remoteExecutionApplies(config)` is true: every other consumer tests that switch first. That one
 * is ungated because a gated rule would change `.gitignore` in the same run that turns remote
 * execution on. The issue-trigger names (`WORKFLOW_TRIGGER_*`, `TRIGGER_*`, `DEFAULT_TRIGGER_LABEL`,
 * `LEGACY_TRIGGER_LABEL`)
 * and the run-control names (`WORKFLOW_CONTROL_*`, `COMMAND_*`, `COMMENT_MARKER`,
 * `REVIEW_ROUND_STATE`, `STATE_LABEL_PREFIX`, `RUN_STATES`, `STATE_LABELS`, `PR_CREATE_SETTING`,
 * `PR_CREATE_SETTING_PATH`) are gated tighter
 * still: they are consulted only where `forgeTriggerApplies(config)` is true.
 *
 * **Shell and YAML mirrors that must agree byte for byte.** The compiler cannot reach them, so each
 * declares the mirror in its own header, and a rename here is an edit to each of them:
 * `cli/templates/scripts/remote-run.sh`, `cli/templates/github/workflows/harness-run.yml`,
 * `cli/templates/github/workflows/harness-resume.yml`,
 * `cli/templates/github/workflows/harness-trigger.yml`,
 * `cli/templates/github/workflows/harness-control.yml` and
 * `cli/templates/scripts/lib/harness-run-lib.sh`, which mirrors {@link WORKFLOW_RUN_FILE} and
 * {@link STATE_ARTIFACT_NAME} for the GitHub route its notification producers print.
 * `cli/templates/scripts/autonomous-watcher.sh` is not one: it reaches GitHub only through
 * `remote-run.sh`, spells none of these names in code, and reaches the GitHub-route text only through
 * the library's `hr_github_answer_route` and `hr_github_resume_route`.
 *
 * **Why {@link GH_CLI_VARIABLE} exists.** Every real route into `gh` reaches the network, which no
 * test may do, so the binary run as `gh` is taken from `${HARNESS_GH_CLI:-gh}` in both this CLI and
 * `remote-run.sh` — the same test seam `${HARNESS_AGENT_CLI:-claude}` gives the watcher's agent
 * (`docs/outer-loop-verification.md` → `## 0. Method and fixtures` → *The agent stub*).
 *
 * It reads no configuration and writes nothing.
 */

import { spawnSync } from 'node:child_process';

import { unquoteYamlScalar } from '../core/yamlScalar.js';

/** The adopter-side directory GitHub reads workflows from. */
export const WORKFLOWS_DIR = '.github/workflows';

export const WORKFLOW_RUN_FILE = 'harness-run.yml';
export const WORKFLOW_RUN_PATH = `${WORKFLOWS_DIR}/${WORKFLOW_RUN_FILE}`;

export const WORKFLOW_RESUME_FILE = 'harness-resume.yml';
export const WORKFLOW_RESUME_PATH = `${WORKFLOWS_DIR}/${WORKFLOW_RESUME_FILE}`;

/** The workflow that turns a labelled issue or a `repository_dispatch` event into a remote run. */
export const WORKFLOW_TRIGGER_FILE = 'harness-trigger.yml';
export const WORKFLOW_TRIGGER_PATH = `${WORKFLOWS_DIR}/${WORKFLOW_TRIGGER_FILE}`;

/** The workflow that turns a comment command or a review into a harness action. */
export const WORKFLOW_CONTROL_FILE = 'harness-control.yml';
export const WORKFLOW_CONTROL_PATH = `${WORKFLOWS_DIR}/${WORKFLOW_CONTROL_FILE}`;

/** The first word of a command comment, matched case-insensitively. */
export const COMMAND_HANDLE = '@sdlc-harness';

/**
 * The verbs a command comment may carry after {@link COMMAND_HANDLE}. `status` is read-only: it
 * replies with the run's state and changes no label and dispatches nothing.
 */
export const COMMAND_VERBS = ['answer', 'pause', 'resume', 'stop', 'clear', 'status'] as const;

export type CommandVerb = (typeof COMMAND_VERBS)[number];

/**
 * The prefix of the hidden line every harness comment carries; the whole line is
 * `<!-- sdlc-harness event=<event> branch=<branch>[ question=<n>] -->`. A comment containing the
 * prefix anywhere is never a command.
 */
export const COMMENT_MARKER = '<!-- sdlc-harness';

/** The `review.state` that starts a review round, lowercase as the webhook payload carries it. */
export const REVIEW_ROUND_STATE = 'changes_requested';

/** The prefix every run-state label's name starts with. */
export const STATE_LABEL_PREFIX = 'sdlc-harness: ';

/** The states a run's pull request is labelled with, one label each. */
export const RUN_STATES = ['running', 'parked', 'paused', 'done', 'failed', 'stopped'] as const;

export type RunState = (typeof RUN_STATES)[number];

/** The label name for each {@link RunState}; total, so a new state fails to compile until it has one. */
export const STATE_LABELS: Readonly<Record<RunState, string>> = {
  running: `${STATE_LABEL_PREFIX}running`,
  parked: `${STATE_LABEL_PREFIX}parked`,
  paused: `${STATE_LABEL_PREFIX}paused`,
  done: `${STATE_LABEL_PREFIX}done`,
  failed: `${STATE_LABEL_PREFIX}failed`,
  stopped: `${STATE_LABEL_PREFIX}stopped`,
};

/** Under `cli/templates/`; stored without the dot, which `init` adds (`cli/templates/README.md`). */
export const WORKFLOW_TEMPLATE_DIR = 'github/workflows';

/** The Actions artifact every job uploads its state bundle as. */
export const STATE_ARTIFACT_NAME = 'harness-state';

/** The Actions artifact each resume-poller tick uploads its carried state as, for the next tick. */
export const POLL_STATE_ARTIFACT_NAME = 'harness-poll-state';

/** Repository variable naming the `runs-on` label; unset means `ubuntu-latest`. */
export const RUNNER_VARIABLE = 'HARNESS_RUNNER';

/** Repository variable: any non-empty value stops every job and poller tick before it launches. */
export const REMOTE_STOP_VARIABLE = 'HARNESS_REMOTE_STOP';

/** Repository variable naming the issue label that starts a run; unset or empty means {@link DEFAULT_TRIGGER_LABEL}. */
export const TRIGGER_LABEL_VARIABLE = 'HARNESS_TRIGGER_LABEL';

/** The issue label that starts a run when {@link TRIGGER_LABEL_VARIABLE} is unset or empty. */
export const DEFAULT_TRIGGER_LABEL = 'sdlc-harness';

/**
 * The previous release's {@link DEFAULT_TRIGGER_LABEL}. The trigger still accepts it when its
 * workflow passes no label, which only that release's `harness-trigger.yml` does: it is never
 * re-rendered by `init --upgrade-workflows`, and its own `if:` already ran the job for this label.
 */
export const LEGACY_TRIGGER_LABEL = 'harness';

const TRIGGER_FALLBACK_PATTERN = new RegExp(`\\(\\s*vars\\.${TRIGGER_LABEL_VARIABLE}\\s*\\|\\|\\s*'([^']+)'\\s*\\)`);

/**
 * The label a trigger workflow's text falls back to when {@link TRIGGER_LABEL_VARIABLE} is unset: the
 * single-quoted literal of the first `(vars.HARNESS_TRIGGER_LABEL || '<label>')`, or `undefined` when
 * no line carries one. Pure — the caller reads the file. It exists because the committed
 * `harness-trigger.yml` carries no version pin and is never upgraded, so its own fallback, not
 * {@link DEFAULT_TRIGGER_LABEL}, is what starts a run in a repository wired by an earlier release.
 */
export function triggerFallbackLabel(text: string): string | undefined {
  for (const line of text.split(/\r?\n/)) {
    const match = TRIGGER_FALLBACK_PATTERN.exec(line);
    if (match !== null) return match[1];
  }
  return undefined;
}

/** Repository variable: comma-separated bot logins that may start a run; unset or empty admits none. */
export const TRIGGER_ALLOWED_BOTS_VARIABLE = 'HARNESS_TRIGGER_ALLOWED_BOTS';

/** The `repository_dispatch` `event_type` the trigger workflow listens to. */
export const TRIGGER_DISPATCH_EVENT_TYPE = 'harness-task';

/** Repository secret for subscription billing. */
export const OAUTH_TOKEN_SECRET = 'CLAUDE_CODE_OAUTH_TOKEN';

/** Repository secret for API billing; wins over {@link OAUTH_TOKEN_SECRET} when both are set. */
export const API_KEY_SECRET = 'ANTHROPIC_API_KEY';

export const PUSH_URL_SECRET = 'HARNESS_PUSH_URL';
export const GIT_TOKEN_SECRET = 'HARNESS_GIT_TOKEN';

/** GitHub's repository setting that lets a workflow's own token open a pull request; off by default. */
export const PR_CREATE_SETTING = 'Allow GitHub Actions to create and approve pull requests';
/** Where an adopter finds {@link PR_CREATE_SETTING} in the repository's settings. */
export const PR_CREATE_SETTING_PATH = 'Settings -> Actions -> General -> Workflow permissions';

/** The environment variable naming the binary run as `gh`: `${HARNESS_GH_CLI:-gh}`. */
export const GH_CLI_VARIABLE = 'HARNESS_GH_CLI';

/**
 * The job-level `env:` variable carrying the CLI version a rendered `harness-run.yml` is pinned to.
 * Mirrored in `cli/templates/github/workflows/harness-run.yml`, once per job.
 */
export const CLI_VERSION_VARIABLE = 'HARNESS_CLI_VERSION';

const CLI_VERSION_LINE = new RegExp(`^[ \\t]*${CLI_VERSION_VARIABLE}:[ \\t]*(.*?)(?:[ \\t]+#.*)?[ \\t]*$`);

/**
 * Every version a workflow's text is pinned to: the value of each `<indent>HARNESS_CLI_VERSION: <value>`
 * line, a trailing ` # comment` and the quotes stripped, distinct and in file order; `[]` when no such
 * line exists. Pure — the caller reads the file.
 */
export function renderedCliVersions(text: string): readonly string[] {
  const versions: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = CLI_VERSION_LINE.exec(line);
    if (match === null) continue;
    const value = unquoteYamlScalar(match[1] ?? '');
    if (value !== '' && !versions.includes(value)) versions.push(value);
  }
  return versions;
}

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
