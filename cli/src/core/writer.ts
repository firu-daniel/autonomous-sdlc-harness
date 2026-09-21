/**
 * The write-policy engine: the `init` re-run contract, implemented once.
 *
 * **The rule this module exists to enforce: a second `init` on a wired repository must not
 * clobber an adopter's edited config.** That is a requirement, not a nicety, and it is a
 * property of this engine rather than of each generator's discipline — every write into an
 * adopting repository is enqueued here as a {@link WriteRequest}, and the policy on the request
 * decides create / merge / keep / back-up-then-overwrite. A generator picks the policy for the
 * file it is writing out of the table below; it does not invent one, and it never calls `fs`
 * itself.
 *
 * **Three writes are deliberately outside this engine.** The first is machine state rather than an
 * adopter's file: the repository registry `machine/registry.ts` owns, which `daemon install`
 * rewrites in place. Its header states why none of the four policies below fits it. The
 * docs-retrieval runtime and model cache under `machineCacheDir()/retrieval/` are machine state of
 * the same class, outside the repository, with both paths owned by `cli/src/retrieval/runtime.ts`:
 * the runtime installation is created by `cli/src/retrieval/setup.ts` → `setUpRuntime` through
 * `npm`, and the model cache is written by `cli/src/retrieval/models.ts` → `fetchModels` through
 * Transformers.js, in the `docs fetch-models` child that `setup.ts` → `setUpModels` spawns. The daemon
 * unit and the push-notification settings file *are* on a plan, under `allowOutsideRepo` — they
 * are create-if-absent artifacts an operator goes on to edit, which is exactly what this engine
 * is for. The second is an exception to this engine's monopoly on writing into an adopting
 * repository: the per-checkout docs-retrieval index under `<stateDir>/docs_index/`
 * (`INDEX_DIR_NAME`), a derived, gitignored, always-rebuildable cache that
 * `cli/src/retrieval/store.ts` → `openPgliteStore` creates and PGlite persists into at query time,
 * never an `init` artifact. `cli/src/retrieval/store.ts` is the **one** module that makes that write
 * and `<stateDir>/docs_index/` the **one** path for it. The third is the `search_docs` query log,
 * whose path is the **operator's own** rather than this CLI's choice: it is whatever the environment
 * variable `cli/src/retrieval/queryLog.ts` owns (`RETRIEVAL_LOG_ENV`) names, so it may land inside or
 * outside the target repository and **no policy in the table below applies to it**.
 * `cli/src/retrieval/queryLog.ts` is the **one** module that makes that write, nothing is opened or
 * created when the variable is unset, and it is no `init` artifact.
 * `.claude/context/conventions.md` → `### Where a new responsibility goes` records neither the index
 * nor the query log; both are raised for a supervised amendment.
 *
 * ## The re-run contract, per artifact
 *
 * | Artifact | Policy | Why |
 * |---|---|---|
 * | `harness.config.json` | `create-if-absent`, **not upgraded by `--force`** | The adopter edits it; a re-run must never rewrite it, and neither may `--force`: config is read-if-present, always. `init --reset-config` is the one path that rebuilds it, after a `.bak`. |
 * | The permission profile (`.claude/settings.autonomous.json`) | `create-if-absent` | Hand-tuned after generation; an overwrite silently drops allow entries. |
 * | `.claude/CLAUDE.md` | `create-if-absent` | `/autonomous-sdlc-harness:harness-analyze` fills it; a re-run must not undo that. It carries neither the `<!-- harness:unfilled -->` marker nor the `**What belongs here**` block, so its setup state is the `<!-- harness:setup-pending -->` banner and `doctor`'s `setup-analysis` check, not the two-part test below. |
 * | `.claude/harness-task-offer.md` | `create-if-absent` | Nothing fills it — the always-loaded file's `## Where a change request runs` fence points at it by name, so a re-run must keep the adopter's edited copy and `--force` after a `.bak` is the upgrade path. |
 * | `.claude/context/*.md` stubs | `create-if-absent` | `/autonomous-sdlc-harness:harness-analyze` fills them; a re-run must not undo that. Filled is checkable, by the two-part test `init`, `doctor` and the command all apply: a stub still carrying its `<!-- harness:unfilled -->` marker **and** its `**What belongs here**` block is an untouched skeleton, and anything else was written — by the command or by hand. |
 * | `.claude/settings.json`, `.mcp.json` | `merge-json` (missing keys only) | Shared with other tooling; the adopter's own entries survive. |
 * | `.gitignore` | `merge-lines` (a managed block, lines not already present) | Every repo already has one. |
 * | The `stateDir` tree and its per-directory READMEs | `ensure-dir` + `create-if-absent` | Creating what is missing is the whole operation; an adopter may have rewritten a contract sentence. |
 * | The ledgers `lessons.md` / `improvement_suggestions.md` | `create-if-absent`, **not upgraded by `--force`** | Ledgers accumulate and nothing can re-derive one; the engine's `.bak` is single-generation, so `--force` may not touch them. |
 * | Git hook `pre-push`, wrapper scripts | `create-if-absent` | Adopter may have edited the guard. The hook alone is also replaced, after a `.bak`, by the one run that rebuilt the config it is rendered from (`init --reset-config`) — and only where its rendered `case` label no longer matches the set that config resolves, never where the label cannot be read. |
 *
 * `--force` upgrades **`create-if-absent` only** to overwrite-after-backup, and only where the
 * request has not fixed its own answer with {@link WriteRequest.forceOverride}. It never applies
 * to `merge-json` or `merge-lines` (those are already non-destructive) and never deletes a
 * directory.
 *
 * That override is what the two `not upgraded by --force` rows above are written against, and both
 * rows are the contract this engine now supports rather than a generator's private discipline. Two
 * callers take it up **for a whole artifact class**: `config/io.ts`'s `saveConfig` for
 * `harness.config.json` — `'never'` on an ordinary `init`, `'always'` on `init --reset-config` —
 * and `generators/stateDir.ts` for the two ledgers, `'never'` and nothing else, because no command
 * rebuilds a ledger. **Two more** read the tree and answer **per request**: `generators/claudeContext.ts`
 * sets `'never'` on a conventions stub that is already a skeleton whose `.bak` holds a filled
 * document, because that one write would replace the only surviving copy of the analysis with a
 * skeleton — and on `.claude/CLAUDE.md` when its bytes already are the text that run renders, because
 * that write would put nothing in the `.bak` and destroy what is in the one already there; and
 * `generators/githooks.ts` sets `'always'` on the `pre-push` hook when the run rebuilt
 * `harness.config.json` (`init --reset-config`) **and** the hook's rendered `case` label no longer
 * matches the set that config resolves, so the run that made the guard wrong is the run that
 * re-renders it. None of them is a further row above — all keep `create-if-absent`, and every other
 * forced run over them still replaces after a `.bak`.
 *
 * The reason the default is create-if-absent rather than overwrite is `docs/config.md` §1: the
 * files `init` generates are ones "the adopter then owns and edits like any other checked-in
 * file … after `init`, the adopter's copy is the only copy". There is no private second copy to
 * fall back on, so a rewrite is a loss.
 *
 * ## Two structural guarantees, both grep-checkable
 *
 * 1. **Every mutating filesystem call in this module is inside {@link commitWrite}** — the one
 *    commit boundary — plus {@link probeWritable}, which is `doctor`'s writability probe and is
 *    not part of a plan. `--dry-run` computes every outcome and skips that boundary, so a dry
 *    run cannot leak a write no matter what a generator enqueued.
 * 2. **Nothing here shells out** — no child-process import at all, so the never-shell-out-a-
 *    recursive-removal rule stated in `cli.ts`'s header and in `cli/README.md` cannot be
 *    breached from this module. The single removal the engine performs is an in-process
 *    `rmSync` on one file, called without `recursive`, so it cannot remove a directory even if
 *    it were aimed at one.
 */

import { chmodSync, copyFileSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

import { HarnessError, internal } from './errors.js';
import { formatJson, mergeMissing, readJsonFile, type JsonObject } from './json.js';
import { nameList } from './nameList.js';
import { insideRepo } from './paths.js';
import type { ActionKind, Reporter } from './report.js';

/**
 * How a request's target is treated when it already exists. The four values are the whole
 * vocabulary — a generator that wants different behaviour is asking for a different re-run
 * contract, which is a decision for the table above and not for the call site.
 */
export type WritePolicy = 'create-if-absent' | 'merge-json' | 'merge-lines' | 'ensure-dir';

/** One enqueued write. Built by a generator, applied by {@link WritePlan.apply}. */
export interface WriteRequest {
  /** Absolute path of the target file, or of the directory for `ensure-dir`. */
  readonly path: string;
  readonly policy: WritePolicy;
  /**
   * What to write. A string is written verbatim; an object is serialized by the CLI's single
   * JSON format. Required for every policy but `ensure-dir`, which takes none.
   *
   * For `merge-json` this is the *source* of the merge — only its absent keys are added.
   * For `merge-lines` it is the managed block's body, one line per line.
   */
  readonly content?: string | JsonObject;
  /**
   * `merge-lines` only, and required there: the marker line introducing the managed block, so a
   * later run recognises its own block and merges into it instead of adding a second one.
   */
  readonly blockHeader?: string;
  /** Short human name for the action log and for any refusal message. */
  readonly label: string;
  /**
   * File mode applied after a write, e.g. `0o755` for a wrapper script or a git hook — and, for
   * `ensure-dir`, applied to the directory the request ensures, whether this run created it or
   * found it. It is a `chmod` of its own in both cases rather than an argument to the creation,
   * because that argument is masked by the process umask and does nothing at all for a target that
   * already exists.
   */
  readonly mode?: number;
  /**
   * This request's overwrite decision, fixed whatever the run's `--force` says.
   *
   * A narrow exception, and deliberately so: it applies to `create-if-absent` alone, because the
   * other three policies never consult `--force` at all. `'never'` keeps an existing target even
   * under `--force`; `'always'` copies an existing target to `<path>.bak` and replaces it even
   * without `--force`; absent — the normal case — leaves the run's flag deciding, as it always
   * has. Neither value changes what happens when the target is absent: that is a `created`
   * either way.
   *
   * **Its class-wide users are the rows of the table above marked `not upgraded by --force`, and
   * only those** — every other user takes it per request, below:
   * `config/io.ts`'s `saveConfig` for `harness.config.json`, where `'never'` is what
   * stops a `--force` run discarding an adopter's edited config and `'always'` is what lets
   * `init --reset-config` rebuild it on a run with no `--force`; and `generators/stateDir.ts` for
   * the two ledgers, `'never'` only, because an accumulating ledger has no derivable content for
   * any command to rebuild it from. What both artifacts share is that the adopter's copy is the
   * only copy and a replacement cannot be regenerated — the `.bak` this engine takes is
   * single-generation, so it is a one-run reprieve rather than a history.
   *
   * The remaining **two** users take it **per request rather than per class**, and for the same
   * single-generation reason read off the tree instead of off the artifact:
   * `generators/claudeContext.ts` sets `'never'` on a conventions stub that is already a skeleton
   * and whose `.bak` holds a filled document, where replacing it would spend the one reprieve on
   * the copy it was holding — and on the always-loaded project file when its bytes already are the
   * text that run renders, where the replacement would put nothing in the `.bak` and destroy
   * whatever the previous forced run left there. `generators/githooks.ts` sets `'always'` on the
   * `pre-push` hook of the run that rebuilt `harness.config.json`, and only where the label that
   * hook renders no longer matches the set the rebuilt file resolves — the same reasoning in the
   * other direction: a label the reader cannot get back out is a guard somebody wrote by hand, so
   * that request sets nothing and the hook is kept, rather than spending the one reprieve on the
   * only copy of it. Both classes stay `create-if-absent` above.
   *
   * The alternative — a fifth {@link WritePolicy} value — was not taken because a policy is a
   * re-run contract shared by a class of artifacts, and this is a short, enumerated exception to
   * one flag. A fifth value would have to be handled in every `switch` over the type and described
   * in both documentation tables, and every generator would have to choose between two policies
   * that differ only in how they read a flag most of them never set.
   */
  readonly forceOverride?: 'never' | 'always';
  /**
   * Permit a target outside the repository root. Reserved for the machine-local paths that are
   * machine-local by definition rather than by this CLI's choice: the daemon unit — a launchd
   * `LaunchAgents` plist, a systemd user unit — and the account's own harness configuration
   * directory with the push-notification settings file in it, whose credential belongs to a person
   * and a machine rather than to a checkout. Every other write **on a plan** is confined to the
   * repository. The one machine-local artifact that is not on a plan at all is the repository
   * registry `machine/registry.ts` owns — see the module header above for why it is not.
   */
  readonly allowOutsideRepo?: boolean;
}

/** What a request did to its target, or under `--dry-run` what it would have done. */
export type WriteEffect = 'created' | 'merged' | 'kept' | 'ensured' | 'backed-up-and-replaced';

/**
 * A request's observed outcome. Identical to its {@link WriteEffect} on a real run, and
 * `skipped` on every request of a `--dry-run`, where nothing was touched.
 */
export type WriteOutcome = WriteEffect | 'skipped';

/** What {@link WritePlan.apply} reports back, one entry per request, in enqueue order. */
export interface WriteResult {
  readonly label: string;
  /** The resolved absolute target. */
  readonly path: string;
  readonly policy: WritePolicy;
  /** What happened on disk. Always `skipped` under `--dry-run`. */
  readonly outcome: WriteOutcome;
  /**
   * What a real run did or would do — never `skipped`. Read this, not `outcome`, to branch on
   * "was it written or kept": the answer is the same in both modes, which is what makes a dry
   * run a faithful preview.
   */
  readonly effect: WriteEffect;
  /** `merge-json`: the dotted key paths added. `merge-lines`: the lines added. */
  readonly added?: readonly string[];
  /** `backed-up-and-replaced`: where the previous content was copied first. */
  readonly backupPath?: string;
}

/** Everything {@link WritePlan.apply} needs from the command it is running under. */
export interface WriteContext {
  /** The resolved repository root every write is confined to. */
  readonly repoRoot: string;
  readonly report: Reporter;
  /** Compute every outcome, record it as a `would-` action, and write nothing. */
  readonly dryRun: boolean;
  /**
   * Upgrade `create-if-absent` to overwrite-after-backup. Ignored by every other policy, and by a
   * request that fixes its own answer with {@link WriteRequest.forceOverride}.
   */
  readonly force: boolean;
}

/** Effect → the action kind recorded on a real run. */
const EFFECT_ACTION: Readonly<Record<WriteEffect, ActionKind>> = {
  created: 'created',
  merged: 'merged',
  kept: 'kept',
  ensured: 'ensured',
  'backed-up-and-replaced': 'replaced',
};

/** Effect → the action kind recorded under `--dry-run`. */
const EFFECT_WOULD_ACTION: Readonly<Record<WriteEffect, ActionKind>> = {
  created: 'would-create',
  merged: 'would-merge',
  kept: 'would-keep',
  ensured: 'would-ensure',
  'backed-up-and-replaced': 'would-replace',
};

/** A request whose `path` has been resolved and whose shape has been checked. */
interface ResolvedRequest extends WriteRequest {
  readonly path: string;
}

/**
 * A decided write: the outcome and, when something is to be written, the exact bytes. Produced
 * by reads alone — building one of these never mutates the filesystem.
 */
interface PlannedWrite {
  readonly request: ResolvedRequest;
  readonly effect: WriteEffect;
  /** The full file text to write. Absent for `kept` and `ensured`, which write nothing. */
  readonly text?: string;
  readonly backupPath?: string;
  readonly added?: readonly string[];
}

/** `lstat` without following the link, or `undefined` when nothing is at `path`. */
function lstatOrUndefined(path: string): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return undefined;
    throw error;
  }
}

/** Read a text file, or `undefined` when it does not exist. */
function readTextOrUndefined(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return undefined;
    throw error;
  }
}

/** The request's content as text, for the policies that write a whole file. */
function contentAsText(request: ResolvedRequest): string {
  const { content } = request;
  if (typeof content === 'string') return content;
  if (content === undefined) throw internal(`${request.label}: ${request.policy} needs content`);
  return formatJson(content);
}

/** The request's content as a JSON object, for `merge-json`. */
function contentAsObject(request: ResolvedRequest): JsonObject {
  const { content } = request;
  if (content === undefined || typeof content === 'string') {
    throw internal(`${request.label}: merge-json needs an object as content`);
  }
  return content;
}

/**
 * The safety rails, all of which run over the **whole** plan before any commit, so a refusal on
 * the last request cannot leave the first ten written:
 *
 * - the target is absolute, and inside the repository unless `allowOutsideRepo` says otherwise;
 * - nothing at the target is a symlink — the engine writes files, and following a link would
 *   write through it to a location none of the checks above ever saw. The `<path>.bak` sibling
 *   gets the same refusal in {@link planWrite}, where the backup is decided;
 * - the request carries content the policy can use;
 * - no two requests aim at one path, which would make the second report `kept` against the
 *   first's fresh output. Repeated `ensure-dir` on one directory is the exception and is
 *   deduplicated, since more than one generator legitimately ensures the same tree.
 */
function resolveRequests(requests: readonly WriteRequest[], ctx: WriteContext): ResolvedRequest[] {
  const resolved: ResolvedRequest[] = [];
  const seen = new Map<string, WritePolicy>();

  for (const request of requests) {
    if (!isAbsolute(request.path)) {
      throw internal(`${request.label}: write target is not an absolute path: ${request.path}`);
    }
    const path = resolve(request.path);

    if (request.allowOutsideRepo !== true && !insideRepo(ctx.repoRoot, path)) {
      throw new HarnessError(`${request.label}: refusing to write outside ${ctx.repoRoot}: ${path}`);
    }

    const stats = lstatOrUndefined(path);
    if (stats?.isSymbolicLink() === true) {
      throw new HarnessError(`${request.label}: refusing to write through a symlink: ${path}`);
    }
    if (request.policy === 'ensure-dir') {
      if (stats !== undefined && !stats.isDirectory()) {
        throw new HarnessError(`${request.label}: ${path} exists and is not a directory`);
      }
    } else if (stats !== undefined && !stats.isFile()) {
      throw new HarnessError(`${request.label}: ${path} exists and is not a regular file`);
    }

    if (request.policy === 'ensure-dir') {
      if (request.content !== undefined) throw internal(`${request.label}: ensure-dir takes no content`);
    } else if (request.content === undefined) {
      throw internal(`${request.label}: ${request.policy} needs content`);
    }
    if (request.policy === 'merge-json') contentAsObject({ ...request, path });
    if (request.policy === 'merge-lines') {
      if (typeof request.content !== 'string') throw internal(`${request.label}: merge-lines needs text content`);
      if (request.blockHeader === undefined || request.blockHeader === '') {
        throw internal(`${request.label}: merge-lines needs a blockHeader to mark its managed block`);
      }
    }

    const previous = seen.get(path);
    if (previous !== undefined) {
      if (previous === 'ensure-dir' && request.policy === 'ensure-dir') continue;
      throw internal(`${request.label}: two writes target one path in the same plan: ${path}`);
    }
    seen.set(path, request.policy);
    resolved.push({ ...request, path });
  }

  return resolved;
}

/**
 * Decide what a request does, reading the filesystem but never changing it.
 *
 * `create-if-absent` writes only when the target is absent and otherwise keeps it, except under
 * `--force`, which copies the existing file to `<path>.bak` and then writes. A request may fix
 * that answer for itself with {@link WriteRequest.forceOverride}, which is read here and nowhere
 * else in the module; either way the backup behaviour is the same. That `.bak` is overwritten if
 * one is already there: a second replacing run therefore produces the same two files as the
 * first, which keeps the output deterministic for the fixture tests. Chaining backups
 * (`.bak.bak`) would make the tree depend on how many times the file had been replaced.
 *
 * A symlink at `<path>.bak` is refused here with the same message the target's rail uses: the
 * backup is a `copyFileSync` destination, which is opened through a link, and this runs over the
 * whole plan before any commit, so the refusal costs nothing already written.
 */
function planWrite(request: ResolvedRequest, ctx: WriteContext): PlannedWrite {
  switch (request.policy) {
    case 'ensure-dir':
      // Always idempotent: `mkdir -p` on an existing directory is a no-op, so there is no
      // "kept" variant to distinguish and the effect is the same on every run.
      return { request, effect: 'ensured' };

    case 'create-if-absent': {
      const exists = lstatOrUndefined(request.path) !== undefined;
      if (!exists) return { request, effect: 'created', text: contentAsText(request) };
      const replace = request.forceOverride === undefined ? ctx.force : request.forceOverride === 'always';
      if (!replace) return { request, effect: 'kept' };
      const backupPath = `${request.path}.bak`;
      if (lstatOrUndefined(backupPath)?.isSymbolicLink() === true) {
        throw new HarnessError(`${request.label}: refusing to write through a symlink: ${backupPath}`);
      }
      return { request, effect: 'backed-up-and-replaced', text: contentAsText(request), backupPath };
    }

    case 'merge-json': {
      const source = contentAsObject(request);
      const existing = readJsonFile(request.path);
      if (existing === undefined) return { request, effect: 'created', text: formatJson(source) };
      if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
        throw new HarnessError(`${request.label}: ${request.path} is not a JSON object, so it cannot be merged into`);
      }
      const merged = structuredClone(existing) as JsonObject;
      const added = mergeMissing(merged, source);
      if (added.length === 0) return { request, effect: 'kept' };
      return { request, effect: 'merged', text: formatJson(merged), added };
    }

    case 'merge-lines':
      return planMergeLines(request);
  }
}

/**
 * `merge-lines`: add only the lines not already somewhere in the file, inside a managed block
 * introduced by `blockHeader`.
 *
 * Presence is judged against the **whole** file, not just the managed block, so a pattern the
 * adopter had already written by hand is never duplicated. Blank lines in the payload are
 * ignored — a blank line is present in almost every file, and emitting one carries no meaning.
 *
 * Where the header is already there, each missing line is spliced in **at its payload position**
 * — see {@link insertIntoBlock} — rather than appended to the end of the block, so the block
 * stays contiguous, the file gains no second header, and a line restored by a re-run comes back
 * where the run that first wrote it had put it.
 *
 * **Position is content here, not tidiness.** A block's lines can carry an ordering relationship
 * — an ignore rule and the negation that excepts one file from it — and git resolves a path by
 * the **last** pattern that matches it. A rule an adopter deleted by hand and a re-run appended
 * below its own negation therefore re-hides the file that negation exists for, in a tree the run
 * has just reported one added line for, with `init`, `doctor` and git all reporting success.
 *
 * Where the header is absent, a fresh block is appended at the end of the file, as it always was.
 */
function planMergeLines(request: ResolvedRequest): PlannedWrite {
  const header = request.blockHeader as string;
  const wanted: string[] = [];
  for (const line of contentAsText(request).split('\n')) {
    const trimmed = line.trim();
    if (trimmed !== '' && !wanted.includes(trimmed)) wanted.push(trimmed);
  }

  const existingText = readTextOrUndefined(request.path);
  if (existingText === undefined) {
    return { request, effect: 'created', text: `${[header, ...wanted].join('\n')}\n`, added: wanted };
  }

  const lines = existingText.split('\n');
  const present = new Set(lines.map((line) => line.trim()));
  const missing = wanted.filter((line) => !present.has(line));
  if (missing.length === 0) return { request, effect: 'kept' };

  // Drop a single trailing empty element so a file ending in a newline is not treated as
  // having a final blank line; it is re-added when the text is joined below.
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const headerIndex = lines.findIndex((line) => line.trim() === header.trim());
  if (headerIndex < 0) {
    lines.push('', header, ...missing);
  } else {
    insertIntoBlock(lines, headerIndex, wanted, new Set(missing));
  }

  return { request, effect: 'merged', text: `${lines.join('\n')}\n`, added: missing };
}

/**
 * Splice every `missing` line into the managed block at the position the payload gives it,
 * mutating `lines` in place.
 *
 * The cursor is the insertion point: it starts immediately after the header and moves to just
 * after each payload line found still present in the block, so a missing line lands after its
 * nearest surviving predecessor and the payload's own order is what the block ends up in. It only
 * moves forward, which is what keeps two missing neighbours in their payload order.
 *
 * Two bounds matter. The search for a surviving predecessor runs **inside the block** — the run of
 * non-blank lines beneath the header — so a payload line the adopter happens to have written
 * elsewhere in the file cannot drag the cursor out of the block; and every insertion is at the
 * cursor, which never passes the block's end, so a rule the adopter wrote directly beneath the
 * block with no blank line between them stays where they put it.
 */
function insertIntoBlock(
  lines: string[],
  headerIndex: number,
  wanted: readonly string[],
  missing: ReadonlySet<string>,
): void {
  let blockEnd = headerIndex + 1;
  while (blockEnd < lines.length && (lines[blockEnd] as string).trim() !== '') blockEnd += 1;

  let cursor = headerIndex + 1;
  for (const line of wanted) {
    if (missing.has(line)) {
      lines.splice(cursor, 0, line);
      cursor += 1;
      blockEnd += 1;
      continue;
    }
    for (let scan = cursor; scan < blockEnd; scan += 1) {
      if ((lines[scan] as string).trim() === line) {
        cursor = scan + 1;
        break;
      }
    }
  }
}

/**
 * **The commit boundary — the only place in this module that changes the filesystem**, apart
 * from `doctor`'s {@link probeWritable}. `--dry-run` is implemented by not calling it.
 *
 * `mkdirSync` is `recursive` so a generator never has to create parent directories itself;
 * nothing here removes anything.
 *
 * An `ensure-dir` request carrying a `mode` gets an explicit `chmodSync` after the creation, the
 * same two steps the shell half's `hr_lane_dir` consumers take (`mkdir -p` then `chmod 700`) and
 * for the same reason: `mkdirSync`'s own `mode` option is masked by the process umask and is
 * ignored outright for a directory that is already there. It is *inside* this function, so the
 * module header's guarantee 1 is untouched and `--dry-run` skips it with everything else.
 */
function commitWrite(planned: PlannedWrite): void {
  const { request } = planned;

  if (planned.effect === 'ensured') {
    mkdirSync(request.path, { recursive: true });
    if (request.mode !== undefined) chmodSync(request.path, request.mode);
    return;
  }
  if (planned.effect === 'kept') return;

  if (planned.backupPath !== undefined) copyFileSync(request.path, planned.backupPath);

  const text = planned.text;
  if (text === undefined) throw internal(`${request.label}: ${planned.effect} with nothing to write`);
  mkdirSync(dirname(request.path), { recursive: true });
  writeFileSync(request.path, text, 'utf8');
  if (request.mode !== undefined) chmodSync(request.path, request.mode);
}

/** `2 keys added: permissions.allow, hooks` — the qualifier on a `merged` action line. */
function mergedDetail(policy: WritePolicy, added: readonly string[]): string {
  const noun = policy === 'merge-json' ? 'key' : 'line';
  return `${added.length} ${noun}${added.length === 1 ? '' : 's'} added: ${nameList(added)}`;
}

/** The parenthesised qualifier for one action line, or `undefined` when there is nothing to add. */
function actionDetail(planned: PlannedWrite): string | undefined {
  if (planned.effect === 'merged' && planned.added !== undefined) {
    return mergedDetail(planned.request.policy, planned.added);
  }
  if (planned.backupPath !== undefined) return `backed up to ${planned.backupPath.split('/').pop() as string}`;
  return undefined;
}

/**
 * The writes one command intends to make.
 *
 * A generator is handed the plan, enqueues its requests and returns; the command applies the
 * plan once, at the end. That order is what makes `--dry-run` trustworthy — a generator has no
 * opportunity to write outside {@link apply}, so there is one place to check rather than one
 * per generator — and it is why a refusal is raised against the whole plan before any of it
 * lands.
 */
export class WritePlan {
  readonly #requests: WriteRequest[] = [];

  /** Enqueue a request. Returns the plan, so calls chain. */
  add(request: WriteRequest): this {
    this.#requests.push(request);
    return this;
  }

  /** The enqueued requests, in enqueue order. */
  get requests(): readonly WriteRequest[] {
    return this.#requests;
  }

  /** How many requests are enqueued — for a caller reporting "nothing to do". */
  get size(): number {
    return this.#requests.length;
  }

  /**
   * Check the whole plan, decide every outcome, then — unless `ctx.dryRun` — commit it, one
   * request at a time in enqueue order, recording each through the reporter's action sink.
   *
   * Under `--dry-run` every outcome is still computed against the real filesystem, including
   * which keys a `merge-json` would add, and recorded as the matching `would-` action; the
   * returned {@link WriteResult.outcome} is `skipped` and `effect` still names what a real run
   * would have done.
   */
  apply(ctx: WriteContext): WriteResult[] {
    const resolved = resolveRequests(this.#requests, ctx);
    const planned = resolved.map((request) => planWrite(request, ctx));
    const results: WriteResult[] = [];

    for (const entry of planned) {
      if (!ctx.dryRun) commitWrite(entry);

      const kinds = ctx.dryRun ? EFFECT_WOULD_ACTION : EFFECT_ACTION;
      const detail = actionDetail(entry);
      ctx.report.action({
        kind: kinds[entry.effect],
        path: displayPath(ctx.repoRoot, entry.request.path),
        ...(detail === undefined ? {} : { detail }),
      });

      results.push({
        label: entry.request.label,
        path: entry.request.path,
        policy: entry.request.policy,
        outcome: ctx.dryRun ? 'skipped' : entry.effect,
        effect: entry.effect,
        ...(entry.added === undefined ? {} : { added: entry.added }),
        ...(entry.backupPath === undefined ? {} : { backupPath: entry.backupPath }),
      });
    }

    return results;
  }
}

/**
 * How a path is named in the action log: repo-relative when it is inside the repository, and
 * absolute otherwise — which is exactly the `allowOutsideRepo` case, where the absolute path is
 * the informative one.
 */
export function displayPath(repoRoot: string, path: string): string {
  return insideRepo(repoRoot, path) ? relative(repoRoot, path) || '.' : path;
}

/**
 * Can this directory be written into? `undefined` when yes, otherwise a one-line reason.
 *
 * `doctor` (roadmap item 13) asks this of the configured `stateDir`, because the only reliable
 * answer is to try: a permission bit, a read-only mount and a full filesystem all look alike
 * from a `stat`. It is deliberately outside {@link WritePlan} — it is a check, not a generated
 * artifact — and it never runs as part of an `init`.
 *
 * **This is the engine's one removal.** `rmSync` is called on a single file with `force` and
 * **without** `recursive`, so it cannot remove a directory: aimed at one, it fails rather than
 * emptying it. It is in-process rather than shelled out, per guarantee 2 in the module header.
 */
export function probeWritable(directory: string): string | undefined {
  const probe = join(directory, `write-probe-${process.pid}.tmp`);
  try {
    writeFileSync(probe, '', 'utf8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return `not writable: ${detail}`;
  }
  try {
    rmSync(probe, { force: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return `wrote a probe file but could not remove it (${probe}): ${detail}`;
  }
  return undefined;
}
