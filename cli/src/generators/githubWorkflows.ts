/**
 * Generator: the two GitHub Actions workflows remote execution runs on — `harness-run.yml`, the job
 * the watcher dispatches a run to, and `harness-resume.yml`, the self-disabling resume poller —
 * written into the adopter's `.github/workflows/`.
 *
 * **The rule this module exists to enforce: the workflows are written exactly when
 * `config/model.ts` → `remoteExecutionApplies(config)` holds, and from the two templates under
 * `cli/templates/` → {@link WORKFLOW_TEMPLATE_DIR} only.** With the key absent or `local` this module
 * enqueues nothing, so such a repository receives exactly what `init` wrote before remote execution
 * existed. Every name — the directory, both file names, the template directory — is imported from
 * `remote/githubActions.ts`, which owns them.
 *
 * ## Four non-obvious choices, and where each comes from
 *
 * 1. **No configured value is rendered into either file; only this CLI's own version is.** The job
 *    reads `harness.config.json` at run time, so a workflow frozen with a configured value would go
 *    wrong the moment the key changed. The version is the exception because it is the pin the job
 *    installs the plugin and runs `npx autonomous-sdlc-harness@<version>` against, and it is read
 *    through `core/paths.ts` → `ownManifestString`, the one reader of this package's manifest.
 * 2. **`assertNoneSurvive` is on for `harness-run.yml`.** The one substituted value is a version
 *    string, which has no business carrying `{{…}}`; one that did would ship a workflow pinned to
 *    nothing. The template's GitHub expressions are all written `${{ ` with a space, so the token
 *    pattern never matches one and the check sees only `{{cliVersion}}`.
 * 3. **`harness-resume.yml` is copied verbatim, not rendered.** It carries no token, so there is no
 *    value for the renderer to check; a token added to it later belongs in this module first.
 * 4. **The upgrade mode ({@link GithubWorkflowsOptions.upgrade}) replaces through a per-request
 *    `forceOverride: 'always'`, not a fifth `WritePolicy`.** The engine's `.bak`-then-replace is
 *    exactly the operation wanted, and `core/writer.ts` reserves new policies for a new re-run
 *    contract. The condition is the pin `remote/githubActions.ts` → `renderedCliVersions` reads from
 *    `harness-run.yml`: absent, or any value other than this CLI's version. A re-render writes that
 *    version, so a second run finds nothing to replace. The resume poller's `- cron:` lines are
 *    carried into its re-render because the schedule is the one thing an adopter tunes inside that
 *    file; every other edit to either file survives only in its `.bak`. The runner and the timeouts
 *    are repository variables, which the re-render does not touch.
 *
 * **Declared mirror.** `cli/templates/github/workflows/harness-run.yml`'s `Install the pinned plugin`
 * step spells the route {@link upgradeWorkflowsCommand} produces,
 * `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`, as a literal the compiler cannot
 * reach, and declares the mirror in its own `# DECLARED MIRRORS` block: a change to
 * {@link UPGRADE_WORKFLOWS_FLAG} or to that route is an edit to that line too.
 *
 * Both files are `create-if-absent`: the adopter tunes the cron, the timeouts and the runner, and a
 * re-run keeps that edit; `--force` replaces each after a `.bak` (`core/writer.ts`'s re-run table).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { remoteExecutionApplies, type HarnessConfig } from '../config/model.js';
import { ownManifestString, readTemplate } from '../core/paths.js';
import { renderTemplate } from '../core/templating.js';
import type { WritePlan } from '../core/writer.js';
import { unquoteYamlScalar } from '../core/yamlScalar.js';
import {
  WORKFLOW_RESUME_FILE,
  WORKFLOW_RESUME_PATH,
  WORKFLOW_RUN_FILE,
  WORKFLOW_RUN_PATH,
  WORKFLOW_TEMPLATE_DIR,
  renderedCliVersions,
} from '../remote/githubActions.js';

/** The `init` flag that runs {@link writeGithubWorkflows} with {@link GithubWorkflowsOptions.upgrade}. */
export const UPGRADE_WORKFLOWS_FLAG = '--upgrade-workflows';

/** The one producer of the `npx <package>@<version>` prefix a version-pinned remedy command starts with. */
export function pinnedCliCommand(version: string): string {
  return `npx ${ownManifestString('name')}@${version}`;
}

/** The one producer of the command that re-renders both workflows at `version`. */
export function upgradeWorkflowsCommand(version: string): string {
  return `${pinnedCliCommand(version)} init ${UPGRADE_WORKFLOWS_FLAG}`;
}

const CRON_LINE = /^\s*- cron: /;

/** Everything {@link writeGithubWorkflows} needs. */
export interface GithubWorkflowsOptions {
  /** The resolved repository root the workflows are written under. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** The command's write plan; this generator enqueues into it and never writes `fs` itself; the upgrade mode reads the tree. */
  readonly plan: WritePlan;
  /**
   * Re-render both workflows after a `.bak` when `harness-run.yml` exists and its pin differs from this
   * CLI's version, carrying the resume poller's `- cron:` lines (choice 4).
   */
  readonly upgrade?: boolean;
}

/** What the upgrade mode found and decided. */
export interface WorkflowUpgrade {
  /** The versions the existing `harness-run.yml` was pinned to, in file order; empty when none was read. */
  readonly renderedFor: readonly string[];
  /** This CLI's version, the one a re-render pins to. */
  readonly to: string;
  /** True when the run workflow is replaced. */
  readonly replaced: boolean;
  /** The schedules carried into `harness-resume.yml`, quotes stripped, or `undefined` when the template's default stands. */
  readonly cron: readonly string[] | undefined;
}

/** What the generator produced, for `init`'s closing report. */
export interface GithubWorkflowsResult {
  /** True when remote execution applied and both workflows were enqueued; `init` gates its block on it. */
  readonly written: boolean;
  /** Each workflow enqueued — its absolute target and its repo-relative path — in the order written; empty when remote execution does not apply. */
  readonly workflows: readonly { readonly absolute: string; readonly repoPath: string }[];
  /** Present exactly when `upgrade` was set, remote execution applied and `harness-run.yml` existed. */
  readonly upgrade?: WorkflowUpgrade;
}

/** The schedule a `- cron:` line carries, quotes stripped. */
function cronExpression(line: string): string {
  return unquoteYamlScalar(line.replace(CRON_LINE, '').trim());
}

/** Substitute `cron` for the template's `- cron:` line, at the template's indentation. */
function carryCron(template: string, cron: readonly string[]): string {
  return template
    .split('\n')
    .flatMap((line) => {
      if (!CRON_LINE.test(line)) return [line];
      const indent = line.slice(0, line.length - line.trimStart().length);
      return cron.map((carried) => indent + carried.trimStart());
    })
    .join('\n');
}

/**
 * Enqueue both workflows when remote execution is on, and nothing otherwise.
 *
 * Nothing here writes the filesystem: the generator plans, and `init` applies the plan once. The
 * upgrade mode reads the two existing workflows to decide.
 */
export function writeGithubWorkflows({
  repoRoot,
  config,
  plan,
  upgrade = false,
}: GithubWorkflowsOptions): GithubWorkflowsResult {
  if (!remoteExecutionApplies(config)) return { written: false, workflows: [] };

  const runPath = join(repoRoot, ...WORKFLOW_RUN_PATH.split('/'));
  const resumePath = join(repoRoot, ...WORKFLOW_RESUME_PATH.split('/'));
  const version = ownManifestString('version');

  let upgradeResult: WorkflowUpgrade | undefined;
  let resumeContent = readTemplate(`${WORKFLOW_TEMPLATE_DIR}/${WORKFLOW_RESUME_FILE}`);
  let replaceResume = false;
  if (upgrade && existsSync(runPath)) {
    const renderedFor = renderedCliVersions(readFileSync(runPath, 'utf8'));
    const replaced = renderedFor.length === 0 || renderedFor.some((pin) => pin !== version);
    let cron: readonly string[] | undefined;
    if (replaced && existsSync(resumePath)) {
      const existing = readFileSync(resumePath, 'utf8');
      const lines = existing.split(/\r?\n/).filter((line) => CRON_LINE.test(line));
      if (lines.length > 0) {
        cron = lines.map(cronExpression);
        resumeContent = carryCron(resumeContent, lines);
      }
      replaceResume = existing !== resumeContent;
    }
    upgradeResult = { renderedFor, to: version, replaced, cron };
  }

  const runTemplate = `${WORKFLOW_TEMPLATE_DIR}/${WORKFLOW_RUN_FILE}`;
  plan.add({
    path: runPath,
    policy: 'create-if-absent',
    content: renderTemplate(
      readTemplate(runTemplate),
      { cliVersion: version },
      { describe: `the workflow template ${runTemplate}`, assertNoneSurvive: true },
    ),
    label: `workflow ${WORKFLOW_RUN_FILE}`,
    ...(upgradeResult?.replaced === true ? { forceOverride: 'always' as const } : {}),
  });

  plan.add({
    path: resumePath,
    policy: 'create-if-absent',
    content: resumeContent,
    label: `workflow ${WORKFLOW_RESUME_FILE}`,
    ...(replaceResume ? { forceOverride: 'always' as const } : {}),
  });

  return {
    written: true,
    workflows: [
      { absolute: runPath, repoPath: WORKFLOW_RUN_PATH },
      { absolute: resumePath, repoPath: WORKFLOW_RESUME_PATH },
    ],
    ...(upgradeResult === undefined ? {} : { upgrade: upgradeResult }),
  };
}
