/**
 * Generator: the files `init` writes at the adopting repository's own root — the ignore rules for
 * the machine-local files the harness configures by path, the line-ending attributes that keep its
 * shell assets runnable, the browser wiring the interactive test phase needs, and the docs-retrieval
 * server's wiring.
 *
 * **The rule this module exists to enforce: nothing here may take a file the adopter already owns
 * away from them.** All three targets are files a repository is likely to have before the harness
 * arrives, and two of them are shared with tooling the harness knows nothing about. So the two
 * shared ones are merged rather than written: `.gitignore` gains a managed block holding only the
 * lines that are not already somewhere in the file, and `.mcp.json` gains only the servers it does
 * not already declare. `.gitattributes` is the one create-if-absent target, because a repository
 * that has one has already made every decision this template would otherwise make for it.
 *
 * ## Four non-obvious choices, and where each comes from
 *
 * 1. **What is ignored is the *file*, never the *path*.** `pushEnvPath`, `qa.credentialsPath` and
 *    the client env file at `<appDir>/.env` name machine-local files whose location is repo-scoped
 *    configuration — the same for everyone who clones — which is why the path is in
 *    `harness.config.json` and only the contents stay local (`schemas/harness.config.schema.json`).
 *    Each is ignored under the path the config actually holds, so an adopter who moves one moves its
 *    ignore rule with it, and the committed `.example` sibling a fresh clone copies from is
 *    deliberately *not* matched by any of the three. The third differs from the other two only in how
 *    the config names it — its **directory** is the configured value and its basename is fixed — and
 *    it is here because `scripts/setup-worktree.sh` symlinks it into every working copy it
 *    bootstraps, so without the rule every fresh worktree opens with an untracked entry.
 * 2. **A directory the tree generator gives a README is ignored by its contents, never as a
 *    directory.** That README is the committed contract for what belongs in the directory
 *    (`generators/stateDir.ts`), while what the run daemon writes beside it — the transcripts in
 *    `autonomous_logs`, the dropped prompts in `autonomous_inbox` — is machine-local. An ignore rule
 *    on the directory would take the README with it and could not be undone by a negation: git
 *    cannot re-include a file whose parent directory is excluded. Hence `…/autonomous_logs/*` plus
 *    `!…/autonomous_logs/README.md`, and the same pair for `autonomous_inbox` and for
 *    `clarifications`, rather than one directory rule each. The browser group
 *    ({@link TEMPLATES.gitignoreQa}) is the converse case and is spelled the converse way: none of
 *    its directories carries a committed contract file, so each is a whole-directory rule and none
 *    goes through {@link treeDirectory} — {@link QA_ARTIFACTS_DIR} deliberately has no
 *    `STATE_DIR_ENTRIES` row.
 * 3. **`.mcp.json` is written when `phases.qa` is on *and* `qa.driver` is `web-playwright`, and in
 *    no other case** ({@link browserWiringApplies}), so an adopter who never drives a browser pays
 *    neither the browser tool schemas in every session's context nor a launched browser process
 *    (`cli/templates/repo/README.md`). A **mobile** driver gets a note and no file: the two mobile
 *    variants of the interactive test agent ship declared-not-implemented with built-ins-only tool
 *    allowlists, so a block written for them would declare servers nothing can ever start. The
 *    permission profile gates the same wiring from the other side, and
 *    {@link assertServersMatchProfile} checks the two agree: the profile's interactive-test fragment
 *    names the servers it starts, and a server it starts that this file does not declare never
 *    starts at all — an un-loaded tool stalls an unattended run rather than failing it, which is the
 *    one failure mode both files exist to prevent.
 *
 *    **The docs-retrieval half is gated the same way on its own predicate**, {@link retrievalApplies}
 *    (`phases.docs` and `docs.retrieval` both on), and {@link assertRetrievalServersMatchProfile}
 *    checks it against the profile's docs-retrieval fragment. So `.mcp.json` is written when
 *    **either** predicate holds, as **one** `merge-json` request carrying whichever halves apply —
 *    two requests for one path would be two writers of one file. With retrieval on and no browser
 *    driven, the file declares the docs server alone.
 * 4. **The block covers files a harness command creates, and of the `.bak` siblings only the
 *    configuration's.** OS and editor noise (`.DS_Store`, `*~`) is per-developer and per-OS, so it
 *    belongs in the adopter's own ignore file or a global `core.excludesFile` and not in a block
 *    every adopter shares. The `.bak` copies `init --force` takes of every other generated file are
 *    the adopter's previous copies of files they edit, from a deliberate regeneration whose value is
 *    that they stay visible — only the {@link CONFIG_FILENAME} `.bak`, which `config set` writes on
 *    the documented path, is ignored, and it is ignored root-anchored. A bare `*.bak` has no path
 *    component and so matches at every depth of the adopter's tree; this block is append-only, so a
 *    too-wide rule can be withdrawn only by hand in every adopter's file.
 *
 * Nothing here touches the filesystem beyond reading its templates: the generator plans, and `init`
 * applies the plan once.
 */

import { join } from 'node:path';

import { browserWiringApplies, CONFIG_FILENAME, DEFAULTS, retrievalApplies, type HarnessConfig } from '../config/model.js';
import { internal } from '../core/errors.js';
import { isJsonObject, type JsonObject, type JsonValue } from '../core/json.js';
import { readTemplate } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import { renderTemplate } from '../core/templating.js';
import type { WritePlan } from '../core/writer.js';
import { DOCS_SERVER_NAME } from '../retrieval/server.js';
import { INDEX_DIR_NAME } from '../retrieval/store.js';
import { PUSH_ENV_PATH, QA_CREDENTIALS_PATH } from './harnessConfig.js';
import { DOCS_SEARCH_SERVER_SCRIPT_NAME } from './outerLoopScripts.js';
import {
  QA_TEMPLATE_PATH as QA_PROFILE_FRAGMENT,
  RETRIEVAL_TEMPLATE_PATH as RETRIEVAL_PROFILE_FRAGMENT,
} from './permissionProfile.js';
import { invokedPath, scriptInvocation } from './scripts.js';
import { STATE_DIR_ENTRIES } from './stateDir.js';

/** The templates' subdirectory under `cli/templates/`, addressed as {@link readTemplate} wants it. */
const TEMPLATE_DIR = 'repo';

/**
 * The templates, stored dot-less and given their dot here.
 *
 * The naming rule is `cli/templates/README.md`'s and it is load-bearing twice over: a real
 * `.gitignore` inside the harness repository would be honoured by git and could exclude files that
 * are meant to ship, and a packaged one is rewritten to `.npmignore` on publish, so a dot-named
 * template does not survive the wire.
 *
 * `gitignoreQa` is a **fragment** of `gitignore` rather than a file of its own, on the pattern
 * `claude/settings.autonomous.qa.json` already sets: it is rendered into the `qaBrowserArtifacts`
 * token when — and only when — {@link browserWiringApplies} holds. Its rules and *its comments* are
 * then both absent from a repository that drives no browser, which one token per rule in the parent
 * template could not do: the write engine drops a blank line but keeps a comment, so gated rules with
 * an ungated comment group would leave the file explaining rules it does not carry.
 * `gitignoreRetrieval` is the same kind of fragment, rendered into `docsRetrievalIndex` under
 * {@link retrievalApplies}, and `mcpRetrieval` is the retrieval half merged into the one `.mcp.json`.
 */
const TEMPLATES = Object.freeze({
  gitignore: 'gitignore',
  gitignoreQa: 'gitignore.qa',
  gitignoreRetrieval: 'gitignore.retrieval',
  gitattributes: 'gitattributes',
  mcp: 'mcp.json',
  mcpRetrieval: 'mcp.retrieval.json',
} as const);

/** Where each of those lands, relative to the adopting repository's root. */
export const GITIGNORE_PATH = '.gitignore';
export const GITATTRIBUTES_PATH = '.gitattributes';
export const MCP_PATH = '.mcp.json';

/**
 * The line introducing the managed block in `.gitignore`, and the whole of how a re-run recognises
 * its own lines.
 *
 * It has to stay byte-stable across releases: the write engine finds the block by matching this
 * exact line, so changing it would make the next `init` add a second block rather than extend the
 * first. It names the block's extent — the run of non-blank lines beneath it — because that is what
 * the engine actually maintains: a later run's additions are inserted at the end of that run.
 */
export const GITIGNORE_BLOCK_HEADER =
  '# >>> autonomous-sdlc-harness (managed block: this line to the next blank line; re-run init to extend it) >>>';

/**
 * The run daemon's log directory, whose contents are machine-local.
 *
 * This and {@link INBOX_DIR} are named here as strings and checked against {@link STATE_DIR_ENTRIES}
 * by {@link treeDirectory} rather than imported as rows, because that table has no "is this directory
 * machine-local" column and inventing one would put the ignore decision in the generator that writes
 * the tree. The check is what keeps the two in step: rename a directory there and this generator
 * fails loudly instead of ignoring a path the tree no longer has.
 */
const LOGS_DIR = 'autonomous_logs';

/** The unattended loop's drop point for prompts, whose contents are machine-local likewise. */
const INBOX_DIR = 'autonomous_inbox';

/**
 * The park-and-ask channel, whose questions and answers are machine-local.
 *
 * It has a row in {@link STATE_DIR_ENTRIES} and therefore a committed README of its own, so it is
 * ignored **by its contents** with a negation for that README, exactly as {@link LOGS_DIR} and
 * {@link INBOX_DIR} are — a directory rule here would take the README with it and no negation could
 * bring it back. Its questions sit one level further down, under a `<branch>` subdirectory, which
 * the contents glob covers along with everything else beneath the directory.
 * {@link clarificationsIgnoreRules} builds all three spellings of that decision — including the
 * whole-directory rule an earlier release wrote — and goes through {@link treeDirectory}, which
 * checks the row still **exists** for the same reason it checks for the other two.
 */
const CLARIFICATIONS_DIR = 'clarifications';

/**
 * The throwaway files an agent runs a probe or a mutation check from, which are machine-local and
 * must never reach a commit — the property the directory's own README states as its contract.
 *
 * Named here as a string and checked against {@link STATE_DIR_ENTRIES} by {@link treeDirectory} for
 * the reason {@link LOGS_DIR} gives, and ignored **by its contents** with a negation for its README
 * for the reason the three above are.
 */
const SCRATCH_DIR = 'scratch';

/** One contents-ignored directory as declared here: its name, and the role a diagnosis names it by. */
interface ContentsIgnoredRow {
  readonly dir: string;
  readonly role: string;
}

/**
 * Every run-artifact directory ignored **by its contents** with its committed README excepted, in
 * block order — the declaration of which contract files the managed block owes a negation to.
 *
 * {@link contentsIgnoredDirectories} exports it because `doctor` has to answer for each of these
 * paths whether or not the negation for it is still in the adopter's file. A set read back out of
 * that file loses the pair whose negation was deleted, which is the one state the check exists to
 * catch. A directory added here is tested with no edit on the `doctor` side.
 */
const CONTENTS_IGNORED_DIRS: readonly ContentsIgnoredRow[] = Object.freeze([
  Object.freeze({ dir: LOGS_DIR, role: "the run daemon's log directory" }),
  Object.freeze({ dir: CLARIFICATIONS_DIR, role: 'the park-and-ask channel' }),
  Object.freeze({ dir: INBOX_DIR, role: "the unattended loop's drop point for prompts" }),
  Object.freeze({ dir: SCRATCH_DIR, role: 'the throwaway-probe directory' }),
]);

/**
 * The unattended loop's stop, pause and dispatch-count control files, written **flat** at the root
 * of the run-artifact tree while a run is in flight.
 *
 * They must never be committed, and the tree around them is what makes that easy to get wrong: it is
 * otherwise a committed tree, so a single `git add <stateDir>/` takes whichever of these happen to
 * exist at that moment. A committed `STOP` is the worst of them — it halts every run for everyone
 * who clones, at a step whose own instruction forbids deleting the file.
 *
 * There is no run-control *subdirectory* to ignore instead: the flow keeps these flat because on a
 * case-insensitive filesystem `PAUSE` and a `pause/` directory are the same path and collide. So
 * each name here becomes its own file rule.
 */
const RUN_CONTROL_ARTIFACTS: readonly string[] = Object.freeze([
  '.dispatch_counter',
  'STOP',
  'AUTONOMOUS_STOP',
  'PAUSE',
  'RESUME',
  'PAUSE_ACK',
  'PAUSE_PROGRESS.md',
]);

/**
 * Where the interactive-test agent sends a screenshot, under the run-artifact tree.
 *
 * It is **not** a {@link STATE_DIR_ENTRIES} row and does not go through {@link treeDirectory}, and
 * both are deliberate: the tree generator neither creates it nor commits a contract file into it, so
 * it is ignored as a whole directory like the two browser-server directories beside it rather than by
 * its contents. Routing it through that helper would fail the run for a row nothing is meant to add.
 */
const QA_ARTIFACTS_DIR = 'qa_artifacts';

/** The client env file's fixed basename; its directory is `appDir`, which is the configured half. */
const CLIENT_ENV_FILENAME = '.env';

/** The per-directory contract file the tree generator writes, which the ignore rule excepts. */
const README_FILENAME = 'README.md';

/** The key `.mcp.json` declares its servers under. */
const SERVERS_KEY = 'mcpServers';

/** The key the permission profile's fragments start those servers with. */
const ENABLED_SERVERS_KEY = 'enabledMcpjsonServers';

/** The token `mcp.retrieval.json` carries for the launcher's repo-relative path. */
const DOCS_SEARCH_SERVER_PATH_TOKEN = 'docsSearchServerPath';

/** One permission-profile fragment, and the `.mcp.json` template whose servers it must start. */
interface ProfileFragment {
  /** The fragment's template path, as {@link readTemplate} wants it. */
  readonly path: string;
  /** How a message names the fragment. */
  readonly role: string;
  /** The `.mcp.json` template it is checked against. */
  readonly mcpTemplate: string;
}

const BROWSER_FRAGMENT: ProfileFragment = Object.freeze({
  path: QA_PROFILE_FRAGMENT,
  role: 'interactive-test',
  mcpTemplate: TEMPLATES.mcp,
});

const RETRIEVAL_FRAGMENT: ProfileFragment = Object.freeze({
  path: RETRIEVAL_PROFILE_FRAGMENT,
  role: 'docs-retrieval',
  mcpTemplate: TEMPLATES.mcpRetrieval,
});

/** Everything {@link writeRepoRootFiles} needs. */
export interface RepoRootOptions {
  /** The resolved repository root the files are written at. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
}

/**
 * What the generator produced, for `init`'s summary and for `doctor`.
 *
 * `.mcp.json` is written when **either** {@link RepoRootResult.browserWired} or
 * {@link RepoRootResult.retrievalWired} is true — the two servers share one file — so a caller asking
 * whether that file was enqueued reads the disjunction off this type rather than re-deriving it.
 */
export interface RepoRootResult {
  /** Repo-relative paths enqueued, in the order they were enqueued. */
  readonly files: readonly string[];
  /** The ignore patterns the managed block carries, in block order — for a summary that lists them. */
  readonly ignored: readonly string[];
  /**
   * True when the browser wiring was enqueued — i.e. when `phases.qa` is on **and** `qa.driver` is
   * the browser one ({@link browserWiringApplies}), which is the driver-gated condition rather than
   * the phase alone: a mobile-driver repository has the phase on and no browser server declared.
   */
  readonly browserWired: boolean;
  /** True when the docs-retrieval server was enqueued into `.mcp.json` ({@link retrievalApplies}). */
  readonly retrievalWired: boolean;
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
}

/**
 * Render a repo-root template through {@link renderTemplate}.
 *
 * **`assertNoneSurvive` is off**, because every value substituted here is a configured path and a
 * configured path is the adopter's to write. One carrying `{{…}}` would be a strange thing to put in
 * `harness.config.json`, but it is not a fault in this CLI, and the post-check reports its findings
 * as exactly that.
 *
 * **The lax {@link normalizeRepoDir} is what feeds it**, not the strict variant: a gitignore pattern
 * is matched literally, so `./x` and `x` are two different rules and resolving a `..` in one would
 * change which files it covers.
 */
function render(template: string, values: Readonly<Record<string, string>>): string {
  return renderTemplate(readTemplate(`${TEMPLATE_DIR}/${template}`), values, {
    describe: `the repo-root template ${template}`,
  });
}

/** Read one of the CLI's templates and parse it as a JSON object. */
function parseTemplateObject(path: string): JsonObject {
  const text = readTemplate(path);
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(text) as JsonValue;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw internal(`the template ${path} is not valid JSON (${detail})`);
  }
  if (!isJsonObject(parsed)) throw internal(`the template ${path} is not a JSON object`);
  return parsed;
}

/** The servers one of the permission profile's fragments starts for a run. */
function serversStartedByProfile(fragment: ProfileFragment): readonly string[] {
  const parsed = parseTemplateObject(fragment.path);
  const enabled = parsed[ENABLED_SERVERS_KEY];
  if (!Array.isArray(enabled)) {
    throw internal(
      `the permission profile's ${fragment.role} fragment ${fragment.path} has no \`${ENABLED_SERVERS_KEY}\` list, so the servers it starts cannot be checked against the ones ${MCP_PATH} declares`,
    );
  }
  return enabled.map((entry) => {
    if (typeof entry !== 'string') {
      throw internal(`\`${ENABLED_SERVERS_KEY}\` in ${fragment.path} carries an entry that is not a string`);
    }
    return entry;
  });
}

/**
 * The declared servers and the started servers have to be the same set, and the check runs in
 * **both** directions because the two disagreements fail differently and neither fails loudly:
 *
 * - a server the profile starts that this file does not declare never starts, so the tools the
 *   profile allow-listed do not exist at run time — and an un-loaded tool in print mode stalls
 *   rather than prompting, which is a run that parks with no diagnostic;
 * - a server declared here that the profile does not start is wiring nothing enables, so it reads
 *   as available while no run can ever call it.
 *
 * Both are faults in these two shipped templates rather than in the adopting repository, so both
 * exit {@link EXIT.INTERNAL}. The end-to-end pairing — the generated profile against the generated
 * `.mcp.json` — is the fixture tests', which can see the files this module only plans.
 */
function assertServersMatchFragment(servers: JsonObject, fragment: ProfileFragment): void {
  const declared = Object.keys(servers);
  const started = serversStartedByProfile(fragment);

  const undeclared = started.filter((name) => !declared.includes(name));
  if (undeclared.length > 0) {
    throw internal(
      `the permission profile's ${fragment.role} fragment starts the MCP server(s) ${undeclared.join(', ')}, which the ${MCP_PATH} template ${fragment.mcpTemplate} does not declare: the server would never start, so the tools the profile allow-lists would not exist at run time and the phase would stall rather than fail`,
    );
  }

  const unstarted = declared.filter((name) => !started.includes(name));
  if (unstarted.length > 0) {
    throw internal(
      `the ${MCP_PATH} template ${fragment.mcpTemplate} declares the MCP server(s) ${unstarted.join(', ')}, which the permission profile's ${fragment.role} fragment does not start: the wiring would be present and unreachable`,
    );
  }
}

/** {@link assertServersMatchFragment} for the browser half. */
function assertServersMatchProfile(servers: JsonObject): void {
  assertServersMatchFragment(servers, BROWSER_FRAGMENT);
}

/** {@link assertServersMatchFragment} for the docs-retrieval half. */
function assertRetrievalServersMatchProfile(servers: JsonObject): void {
  assertServersMatchFragment(servers, RETRIEVAL_FRAGMENT);
}

/** The `mcpServers` object of the browser-wiring template, checked against the profile fragment. */
function browserWiring(): JsonObject {
  const template = parseTemplateObject(`${TEMPLATE_DIR}/${TEMPLATES.mcp}`);
  const servers = template[SERVERS_KEY];
  if (!isJsonObject(servers)) {
    throw internal(`the ${MCP_PATH} template has no \`${SERVERS_KEY}\` object, so there is nothing to merge`);
  }
  assertServersMatchProfile(servers);
  return template;
}

/**
 * The docs-retrieval template, parsed first and substituted second (`permissionProfile.ts` → choice
 * 3), with its one launcher argument set to the repo-relative path of the script `init` writes.
 *
 * That path is {@link invokedPath} over {@link scriptInvocation}'s own return value, so `.mcp.json`
 * and the outer-loop writer cannot name two different files.
 */
function retrievalWiring(scriptsDir: string): JsonObject {
  const templatePath = `${TEMPLATE_DIR}/${TEMPLATES.mcpRetrieval}`;
  const template = parseTemplateObject(templatePath);
  const servers = template[SERVERS_KEY];
  if (!isJsonObject(servers)) {
    throw internal(`the ${templatePath} template has no \`${SERVERS_KEY}\` object, so there is nothing to merge`);
  }

  const names = Object.keys(servers);
  if (names.length !== 1 || names[0] !== DOCS_SERVER_NAME) {
    throw internal(
      `the ${templatePath} template declares the MCP server(s) ${names.join(', ') || '(none)'}, where it must declare exactly ${DOCS_SERVER_NAME}: that is the server the docs tool is allow-listed under, so any other key declares a server whose tool no run may call`,
    );
  }

  const server = servers[DOCS_SERVER_NAME];
  const args = isJsonObject(server) ? server['args'] : undefined;
  if (!isJsonObject(server) || !Array.isArray(args) || args.length !== 1 || typeof args[0] !== 'string') {
    throw internal(
      `the ${templatePath} template's ${DOCS_SERVER_NAME} server does not carry exactly one \`args\` string, so the launcher path has nowhere to go`,
    );
  }

  const docsSearchServerPath = invokedPath(scriptInvocation(scriptsDir, DOCS_SEARCH_SERVER_SCRIPT_NAME));
  server['args'] = [
    renderTemplate(
      args[0],
      { [DOCS_SEARCH_SERVER_PATH_TOKEN]: docsSearchServerPath },
      { describe: `the ${templatePath} template's launcher argument` },
    ),
  ];

  assertRetrievalServersMatchProfile(servers);
  return template;
}

/**
 * The one `.mcp.json` payload: the browser template when {@link browserWiringApplies} holds, plus the
 * retrieval template's servers and its other keys when {@link retrievalApplies} does. A key both
 * templates carry is refused, because the merged object would silently keep only one of them.
 */
function mcpWiring(wiresBrowser: boolean, wiresRetrieval: boolean, scriptsDir: string): JsonObject {
  const content: JsonObject = wiresBrowser ? browserWiring() : { [SERVERS_KEY]: {} };
  if (!wiresRetrieval) return content;

  const servers = content[SERVERS_KEY] as JsonObject;
  for (const [key, value] of Object.entries(retrievalWiring(scriptsDir))) {
    const target = key === SERVERS_KEY ? servers : content;
    const additions = key === SERVERS_KEY ? (value as JsonObject) : { [key]: value };
    for (const [name, entry] of Object.entries(additions)) {
      if (Object.hasOwn(target, name)) {
        throw internal(
          `the ${MCP_PATH} templates ${TEMPLATES.mcp} and ${TEMPLATES.mcpRetrieval} both declare \`${name}\`, so the merged file would keep only one of them`,
        );
      }
      target[name] = entry;
    }
  }
  return content;
}

/**
 * One machine-local run-daemon directory, repo-relative, having checked the tree still has a row for
 * it. `role` names what the directory is for and what a stale rule would let through, so the two
 * callers fail with their own diagnosis rather than a shared one.
 */
function treeDirectory(stateDir: string, dir: string, role: string): string {
  if (!STATE_DIR_ENTRIES.some((entry) => entry.dir === dir)) {
    throw internal(
      `the ignore rules name ${dir} as ${role}, which the run-artifact tree no longer has: the generated rule would ignore a path nothing writes to, and the directory that replaced it would be committed file by file`,
    );
  }
  return `${stateDir}/${dir}`;
}

/**
 * One contents-ignored directory's three spellings: the rule that hides it, the contract file that
 * has to survive that rule, and the negation which keeps it.
 */
export interface ContentsIgnoredDirectory {
  /** `<stateDir>/<dir>` — the directory itself, repo-relative. */
  readonly directory: string;
  /** `<stateDir>/<dir>/*` — the contents rule, which everything beneath the directory is under. */
  readonly contents: string;
  /** `<stateDir>/<dir>/README.md` — the committed contract the exception exists for. */
  readonly readmePath: string;
  /** `!<stateDir>/<dir>/README.md` — the exception that keeps that one file. */
  readonly readmeException: string;
}

/** One row of {@link CONTENTS_IGNORED_DIRS}, spelled for a configured `stateDir`. */
function contentsIgnoredDirectory(stateDir: string, dir: string): ContentsIgnoredDirectory {
  const row = CONTENTS_IGNORED_DIRS.find((entry) => entry.dir === dir);
  if (row === undefined) {
    throw internal(`${dir} is not one of the contents-ignored directories this generator declares`);
  }
  const directory = treeDirectory(normalizeRepoDir(stateDir), row.dir, row.role);
  const readmePath = `${directory}/${README_FILENAME}`;
  return { directory, contents: `${directory}/*`, readmePath, readmeException: `!${readmePath}` };
}

/**
 * All of them, for one configured `stateDir` — the set of committed contract files the managed block
 * has to leave committable, taken from this generator rather than from any file it wrote.
 *
 * Exported for `doctor`, which asks git about each of these paths: derived from the artifact under
 * audit, the question would go missing along with the negation line that answers it.
 */
export function contentsIgnoredDirectories(stateDir: string): readonly ContentsIgnoredDirectory[] {
  return CONTENTS_IGNORED_DIRS.map((row) => contentsIgnoredDirectory(stateDir, row.dir));
}

/**
 * The clarification channel's ignore rules, in the spellings that decide whether its committed
 * contract file survives: the pair this generator writes, and the single whole-directory rule an
 * earlier release wrote in their place.
 *
 * **The superseded spelling is why this is exported.** The block is written with `merge-lines`,
 * which adds the lines that are not already there and removes none (`core/writer.ts`), so on a
 * repository whose ignore file was generated before the pair existed the older line is still in the
 * block — wherever the pair lands relative to it, which is a question of where the payload puts each
 * line rather than a guarantee. Git cannot re-include a file whose parent directory is excluded, and
 * that holds in **either** order, so the exception is inert: `init` writes the channel's README, git
 * ignores it, and the adopter's tree carries an untracked contract file while every command reports
 * success. No
 * re-run can fix that — the engine cannot delete a line — so `doctor` reports it instead, and it
 * reads all three spellings from here rather than restating them, so the check cannot end up looking
 * for a rule this generator does not write.
 */
export interface ClarificationsIgnoreRules extends ContentsIgnoredDirectory {
  /** `<stateDir>/clarifications/` — what an earlier release wrote instead of the pair above. */
  readonly supersededDirectoryRule: string;
}

/**
 * Build them for one configured `stateDir`, having checked the tree still has a row for the channel:
 * a rule spelled for a directory the tree no longer writes is a rule that covers nothing, and the
 * directory that replaced it would be committed file by file.
 */
export function clarificationsIgnoreRules(stateDir: string): ClarificationsIgnoreRules {
  const channel = contentsIgnoredDirectory(stateDir, CLARIFICATIONS_DIR);
  return { ...channel, supersededDirectoryRule: `${channel.directory}/` };
}

/**
 * Enqueue the repository-root files: the ignore block (`merge-lines`), the line-ending attributes
 * (`create-if-absent`), and — only where {@link browserWiringApplies} holds, i.e. the interactive
 * test phase enabled **and** its driver the browser one — the browser wiring, and only where
 * {@link retrievalApplies} holds the docs-retrieval server, both in one `.mcp.json` request
 * (`merge-json`).
 *
 * Each is one action in the run's log, so a re-run reports per file whether it was created, merged
 * into or left alone rather than reporting "repository root" once.
 */
export function writeRepoRootFiles({ repoRoot, config, plan }: RepoRootOptions): RepoRootResult {
  const files: string[] = [];
  const notes: string[] = [];

  const stateDir = normalizeRepoDir(config.stateDir ?? DEFAULTS.stateDir);
  const scriptsDir = normalizeRepoDir(config.scriptsDir ?? DEFAULTS.scriptsDir);
  const logs = contentsIgnoredDirectory(stateDir, LOGS_DIR);
  const inbox = contentsIgnoredDirectory(stateDir, INBOX_DIR);
  const scratch = contentsIgnoredDirectory(stateDir, SCRATCH_DIR);
  const clarifications = clarificationsIgnoreRules(stateDir);
  const pushEnv = normalizeRepoDir(config.pushEnvPath ?? PUSH_ENV_PATH);
  // The phase, not the driver: every driver reads a credentials file, so the ignore rule below is
  // gated on the phase alone. The browser wiring is the one decision that also reads the driver.
  const qaEnabled = config.phases?.qa === true;
  const wiresBrowser = browserWiringApplies(config);
  // Empty when the phase is off: the write engine drops blank lines from a managed block, so the
  // rule is simply absent rather than being written as a pattern matching nothing.
  const credentials = qaEnabled ? normalizeRepoDir(config.qa?.credentialsPath ?? QA_CREDENTIALS_PATH) : '';
  // The repository root is `.`, and `./.env` and `.env` are two different gitignore patterns: a
  // pattern is matched literally, so the root case is spelled as the bare filename.
  const appDir = normalizeRepoDir(config.appDir ?? DEFAULTS.appDir);
  const clientEnv = appDir === '.' ? CLIENT_ENV_FILENAME : `${appDir}/${CLIENT_ENV_FILENAME}`;
  // The browser group, gated on the DRIVER rather than the phase: only the browser driver starts an
  // MCP server, so a mobile-driver repository — whose interactive-test variants ship
  // declared-not-implemented with built-ins-only allowlists — has nothing that could write any of
  // these paths. Empty otherwise, and the write engine drops the blank line, so the rules and the
  // comments explaining them are simply absent rather than present and inert.
  const qaBrowserArtifacts = wiresBrowser
    ? render(TEMPLATES.gitignoreQa, { qaArtifactsDir: `${stateDir}/${QA_ARTIFACTS_DIR}/` }).trimEnd()
    : '';
  const wiresRetrieval = retrievalApplies(config);
  // On the browser group's precedent: the rule and its comment are rendered together or not at all.
  const docsRetrievalIndex = wiresRetrieval
    ? render(TEMPLATES.gitignoreRetrieval, { docsIndexDir: `${stateDir}/${INDEX_DIR_NAME}/` }).trimEnd()
    : '';

  const ignoreBlock = render(TEMPLATES.gitignore, {
    pushEnvPath: pushEnv,
    qaCredentialsPath: credentials,
    clientEnvPath: clientEnv,
    logsGlob: logs.contents,
    logsReadmeException: logs.readmeException,
    // One token carrying seven rules: the names are declared once, above, and the template holds one
    // comment for the group rather than seven near-identical ones.
    runControlArtifacts: RUN_CONTROL_ARTIFACTS.map((name) => `${stateDir}/${name}`).join('\n'),
    clarificationsGlob: clarifications.contents,
    clarificationsReadmeException: clarifications.readmeException,
    inboxGlob: inbox.contents,
    inboxReadmeException: inbox.readmeException,
    scratchGlob: scratch.contents,
    scratchReadmeException: scratch.readmeException,
    // Derived from the configuration's own filename, so a rename moves its ignore rule with it.
    configBackupFile: `${CONFIG_FILENAME}.bak`,
    qaBrowserArtifacts,
    docsRetrievalIndex,
  });

  plan.add({
    path: join(repoRoot, GITIGNORE_PATH),
    policy: 'merge-lines',
    content: ignoreBlock,
    blockHeader: GITIGNORE_BLOCK_HEADER,
    label: 'ignore rules for the harness machine-local files',
  });
  files.push(GITIGNORE_PATH);

  plan.add({
    path: join(repoRoot, GITATTRIBUTES_PATH),
    policy: 'create-if-absent',
    content: render(TEMPLATES.gitattributes, {
      githooksDir: normalizeRepoDir(config.githooksDir ?? DEFAULTS.githooksDir),
    }),
    label: 'line-ending attributes',
  });
  files.push(GITATTRIBUTES_PATH);

  // One request for the one path, whichever halves apply (choice 3).
  if (wiresBrowser || wiresRetrieval) {
    plan.add({
      path: join(repoRoot, MCP_PATH),
      policy: 'merge-json',
      content: mcpWiring(wiresBrowser, wiresRetrieval, scriptsDir),
      label: wiresBrowser
        ? wiresRetrieval
          ? 'browser and docs-retrieval MCP wiring'
          : 'browser MCP wiring'
        : 'docs-retrieval MCP wiring',
    });
    files.push(MCP_PATH);
  }

  // With retrieval on the file exists, so the notes below say no browser server was declared in it
  // rather than that it was not written.
  const noBrowserWiring = wiresRetrieval
    ? `no browser MCP server was declared in ${MCP_PATH}`
    : `no ${MCP_PATH} was written`;
  if (!wiresBrowser && qaEnabled) {
    // The phase is on and its driver reaches the application some other way. A distinct note, not
    // the phase-off one: "turn the phase on" is advice this adopter has already taken, and the thing
    // they need to know is that the omission is the driver's doing and is not a gap to fill in.
    notes.push(
      `${noBrowserWiring} because qa.driver is ${config.qa?.driver ?? DEFAULTS.qa.driver}, which reaches the application through a device runner rather than a browser: the mobile interactive-test variants are declared-not-implemented in this release and carry built-ins-only tool allowlists, so there is no MCP server for them to start. The permission profile omits its browser half for the same reason. To wire a browser instead, change the driver in ${CONFIG_FILENAME} — by hand, or with \`config set qa.driver web-playwright\`, which copies the file to a .bak sibling before replacing it — then re-run \`init --force\`, which moves the half a plain re-run cannot: an ordinary re-run merges ${MCP_PATH} in but keeps the create-if-absent permission profile, leaving the profile starting none of the servers ${MCP_PATH} declares — which stalls the phase rather than failing it — while --force regenerates that profile from the config in effect. --force overwrites generated files but never ${CONFIG_FILENAME}, which init reads on every run, so the driver just set is the one both halves are wired from, and everything --force regenerates is copied to a .bak sibling first`,
    );
  } else if (!wiresBrowser) {
    notes.push(
      `${noBrowserWiring}, because phases.qa is off and nothing would drive a browser: an adopter who never runs the interactive test phase pays neither the browser tool schemas in every session's context nor a launched browser process. Turn the phase on in ${CONFIG_FILENAME} — by hand, or with \`config set phases.qa true\` (and \`config set qa.driver <driver>\` for a driver other than the default), which copies the file to a .bak sibling before replacing it — then re-run \`init --force\`, which moves the half a plain re-run cannot: an ordinary re-run merges ${MCP_PATH} in but keeps the create-if-absent permission profile, which would then start none of the servers it declares, while --force regenerates that profile from the config in effect. --force overwrites generated files but never ${CONFIG_FILENAME}, which init reads on every run, so the phase just turned on is the one both halves are wired from, and everything --force regenerates is copied to a .bak sibling first`,
    );
  }

  // The patterns, in block order and without the comment lines, so a caller can list what is now
  // ignored without re-deriving it from the rendered text.
  const ignored = ignoreBlock
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));

  return { files, ignored, browserWired: wiresBrowser, retrievalWired: wiresRetrieval, notes };
}
