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
 * ## Three non-obvious choices, and where each comes from
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
 *
 * Both files are `create-if-absent`: the adopter tunes the cron, the timeouts and the runner, and a
 * re-run keeps that edit; `--force` replaces each after a `.bak` (`core/writer.ts`'s re-run table).
 */

import { join } from 'node:path';

import { remoteExecutionApplies, type HarnessConfig } from '../config/model.js';
import { ownManifestString, readTemplate } from '../core/paths.js';
import { renderTemplate } from '../core/templating.js';
import type { WritePlan } from '../core/writer.js';
import {
  WORKFLOW_RESUME_FILE,
  WORKFLOW_RESUME_PATH,
  WORKFLOW_RUN_FILE,
  WORKFLOW_RUN_PATH,
  WORKFLOW_TEMPLATE_DIR,
} from '../remote/githubActions.js';

/** Everything {@link writeGithubWorkflows} needs. */
export interface GithubWorkflowsOptions {
  /** The resolved repository root the workflows are written under. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
}

/** What the generator produced, for `init`'s closing report. */
export interface GithubWorkflowsResult {
  /** True when remote execution applied and both workflows were enqueued; `init` gates its block on it. */
  readonly written: boolean;
  /** Each workflow enqueued — its absolute target and its repo-relative path — in the order written; empty when remote execution does not apply. */
  readonly workflows: readonly { readonly absolute: string; readonly repoPath: string }[];
}

/**
 * Enqueue both workflows when remote execution is on, and nothing otherwise.
 *
 * Nothing here touches the filesystem: the generator plans, and `init` applies the plan once.
 */
export function writeGithubWorkflows({ repoRoot, config, plan }: GithubWorkflowsOptions): GithubWorkflowsResult {
  if (!remoteExecutionApplies(config)) return { written: false, workflows: [] };

  const runPath = join(repoRoot, ...WORKFLOW_RUN_PATH.split('/'));
  const resumePath = join(repoRoot, ...WORKFLOW_RESUME_PATH.split('/'));

  const runTemplate = `${WORKFLOW_TEMPLATE_DIR}/${WORKFLOW_RUN_FILE}`;
  plan.add({
    path: runPath,
    policy: 'create-if-absent',
    content: renderTemplate(
      readTemplate(runTemplate),
      { cliVersion: ownManifestString('version') },
      { describe: `the workflow template ${runTemplate}`, assertNoneSurvive: true },
    ),
    label: `workflow ${WORKFLOW_RUN_FILE}`,
  });

  plan.add({
    path: resumePath,
    policy: 'create-if-absent',
    content: readTemplate(`${WORKFLOW_TEMPLATE_DIR}/${WORKFLOW_RESUME_FILE}`),
    label: `workflow ${WORKFLOW_RESUME_FILE}`,
  });

  return {
    written: true,
    workflows: [
      { absolute: runPath, repoPath: WORKFLOW_RUN_PATH },
      { absolute: resumePath, repoPath: WORKFLOW_RESUME_PATH },
    ],
  };
}
