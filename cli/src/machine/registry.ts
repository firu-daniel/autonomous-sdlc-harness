/**
 * The machine-local registry of initialized repositories: its format of record, and the only code
 * that reads or writes it.
 *
 * **The rule this module exists to enforce: `repos.json` has one definition, and it is this file.**
 * Two consumers ask about this artifact — `daemon list`, which enumerates it, and `doctor`, which
 * reports on it — and a second derivation of the path, the JSON shape or the staleness grading would
 * be a second answer to "what is armed on this machine". The name is joined here and nowhere else
 * (`grep -rn REGISTRY_FILENAME cli/src`); that is the property worth keeping. The one mirror outside
 * that scope is `MACHINE_REGISTRY_FILENAME` in `cli/templates/scripts/autonomous-watcher.sh`, which
 * the footprint report reads — `grep -rn 'repos.json' cli/` reaches both.
 *
 * `docs/watcher.md` §7 is the human-facing half of this definition and says the same things in the
 * same order. The two are one contract: change either and change the other in the same commit.
 *
 * ## The three questions this artifact has to answer, and its answers
 *
 * 1. **Where it lives.** {@link registryPath} — `repos.json` in {@link machineStateDir}, i.e. beside
 *    the usage lane's two artifacts, in a directory created `0700` and outside every repository. It
 *    is a **separate file** and is never merged into `usage-state.json`: that one is the lane, its
 *    format is `docs/watcher.md` §5's, and §5 is explicit that this registry "is a different
 *    artifact". Sharing a file would put a per-run publisher and a per-install index behind one
 *    merge rule that suits neither.
 * 2. **What happens when it is stale** — a recorded root that is gone, is no longer a repository, or
 *    whose unit file has been removed. It is **reported and never removed by a read**
 *    ({@link inspect} grades; nothing it does touches the filesystem). A read command must not
 *    mutate machine state, and a checkout on an unmounted volume or temporarily moved aside must not
 *    be silently dropped from the index while its daemon is still installed. Pruning is the explicit
 *    `daemon list --prune`, which is the one caller of {@link removeRepositories}.
 * 3. **Who writes it.** `daemon install`, and nothing else. `init` does not — a wired repository with
 *    no daemon polls nothing, so registering it would list repositories that never run. `doctor` does
 *    not — it repairs nothing and writes nothing, which is what makes it safe in CI. `daemon stop`
 *    does not remove an entry — the unit file survives a stop, and this index mirrors *installed*
 *    units rather than running ones.
 *
 * ## Two properties nobody should re-derive wrongly
 *
 * - **It is not consulted before starting a run.** That is the usage lane's job and `docs/watcher.md`
 *   §5 says so. Nothing here may become a precondition of anything: an absent, truncated or garbage
 *   registry costs a listing, never a run, which is why {@link readRegistry} fails open in every one
 *   of those cases rather than reporting a fault.
 * - **`daemon install` run from a git worktree registers that worktree, and that is correct.** The
 *   unit's identity is the checkout it was installed from (`daemon/units.ts`, choice 1) and its text
 *   carries that checkout as both `ExecStart` and `WorkingDirectory` (choice 4), so the entry has to
 *   describe the same checkout the unit does. Keying on {@link repoSlug} — the same function that
 *   names the unit — is what makes the two unable to disagree.
 *
 * ## Why the writes here are not enqueued on a `WritePlan`
 *
 * `core/writer.ts` implements the `init` re-run contract for artifacts **inside a repository** that
 * an adopter then owns and edits: its policies are create-if-absent, merge and back-up-then-replace,
 * and its plan is built by generators and applied once. This file is none of that. It is a
 * machine-scoped index the CLI owns end to end, it is rewritten in place on every registration
 * (read-modify-write, not merge), and no adopter edits it. The daemon unit is written through a plan
 * with `allowOutsideRepo` because it is a create-if-absent artifact an operator may go on to edit;
 * this one is not.
 *
 * The consequence a caller must honor: **{@link upsertRepository} and {@link removeRepositories}
 * write when they are called.** They are not on the plan, so `--dry-run` does not skip them for you —
 * a command that supports `--dry-run` must not call either under it.
 */

import { chmodSync, existsSync, mkdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

import { internal } from '../core/errors.js';
import { probeRepoRoot } from '../core/git.js';
import { formatJson, isJsonObject, readJsonFile, type JsonObject, type JsonValue } from '../core/json.js';
import type { DaemonBackendKind } from '../daemon/backend.js';
import { repoSlug } from '../daemon/units.js';
import { MACHINE_DIR_MODE, machineStateDir } from './paths.js';

/** The file's name under {@link machineStateDir}. Joined here and nowhere else in the CLI. */
const REGISTRY_FILENAME = 'repos.json';

/**
 * The format version written into every record, and the only one {@link readRegistry} recognises.
 *
 * A reader that meets a value it does not know treats the whole file as unreadable — the same rule
 * `usage-state.json` carries in `docs/watcher.md` §5 — which is also this format's forward-compatible
 * escape hatch: a release that adds a field or a backend value bumps this integer, and an older CLI
 * then declines to interpret the file rather than half-understanding it.
 */
const REGISTRY_SCHEMA = 1;

/** Mode of the file: it names an account's checkouts, so it is the owner's to read and nobody else's. */
const REGISTRY_FILE_MODE = 0o600;

/** A service manager the daemon can actually be installed into — `none` has no unit to register. */
type InstallableBackend = Exclude<DaemonBackendKind, 'none'>;

/** One registered repository: everything `daemon list` shows and `doctor` grades, and nothing else. */
export interface RegistryEntry {
  /**
   * The repository root the daemon was installed from, absolute.
   *
   * It is git's own `rev-parse --show-toplevel` answer (every caller resolves it through
   * `core/git.ts`), which is what makes it comparable against a later probe of the same path.
   */
  readonly root: string;
  /** The descriptive project name the unit file carries. A label for a human; nothing keys off it. */
  readonly projectName: string;
  /** The launchd label or systemd unit name — the string the service manager addresses this by. */
  readonly label: string;
  /** Which service manager it was installed into. */
  readonly backend: InstallableBackend;
  /** Absolute path of the installed unit file, so a reader can tell whether it is still there. */
  readonly unitPath: string;
  /**
   * Unix epoch **second** the registration was made — `Math.floor(Date.now() / 1000)`, the same unit
   * `usage-state.json`'s `observed_at` uses. A breadcrumb for an operator; nothing keys off it.
   */
  readonly registered_at: number;
}

/** The file's whole content: a format version, and the entries keyed by {@link repoSlug}. */
export interface Registry {
  readonly schema: number;
  /** Keyed by `repoSlug(entry.root)`, so an entry and the unit it describes cannot disagree. */
  readonly repos: Readonly<Record<string, RegistryEntry>>;
}

/**
 * How an entry is doing, as one value per entry. `ok` means the recorded root is still a repository
 * and its unit file is still installed.
 *
 * The three failing values are **reported, never acted on by a read** — see the module header's
 * answer 2. They are graded in the order they are listed by {@link inspect}, most fundamental first,
 * because a root that is gone makes "is it still a repository" unanswerable rather than false.
 */
export type EntryState = 'ok' | 'root-missing' | 'not-a-repository' | 'unit-missing';

/** One graded entry, as {@link inspect} returns them. */
export interface InspectedEntry {
  /** The key the entry is stored under — `repoSlug(entry.root)`. */
  readonly slug: string;
  readonly entry: RegistryEntry;
  readonly state: EntryState;
}

/** The registry file's absolute path. A pure string: asking where it is never creates anything. */
export function registryPath(): string {
  return join(machineStateDir(), REGISTRY_FILENAME);
}

/** Codepoint order, not the locale's — the same ASCII-only discipline {@link repoSlug} is built on. */
function compareSlugs(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** A non-empty string, or `undefined` for every other JSON value. */
function stringField(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * One record's parsed form, or `undefined` when it is not one.
 *
 * **A malformed record is dropped, not fatal.** The file is an index of independent rows, and one
 * row a hand-edit mangled should not hide the rest — the fail-open rule of the module header applied
 * at record granularity. The dropped row does not come back: the next {@link upsertRepository}
 * rewrites the file from what was readable. That is acceptable for the same reason the whole-file
 * case is (see {@link readRegistry}), and it is why the strictness here is safe rather than brittle:
 * a future release that adds a field or a backend value arrives with a new
 * {@link REGISTRY_SCHEMA}, which this reader declines wholesale instead of parsing row by row.
 */
function parseEntry(value: JsonValue | undefined): RegistryEntry | undefined {
  if (!isJsonObject(value)) return undefined;

  const root = stringField(value['root']);
  const projectName = stringField(value['projectName']);
  const label = stringField(value['label']);
  const unitPath = stringField(value['unitPath']);
  const backend = value['backend'];
  if (root === undefined || projectName === undefined || label === undefined || unitPath === undefined) {
    return undefined;
  }
  if (backend !== 'launchd' && backend !== 'systemd') return undefined;

  // A timestamp that is not a whole non-negative number is reduced to 0 rather than discarding the
  // row: it is a breadcrumb, and losing the entry would cost more than losing its age.
  const stamp = value['registered_at'];
  const registered_at = typeof stamp === 'number' && Number.isInteger(stamp) && stamp >= 0 ? stamp : 0;

  return { root, projectName, label, backend, unitPath, registered_at };
}

/**
 * The registry as it is on disk, or an empty one.
 *
 * **It fails open in every failure mode there is**: absent, unreadable (a permission bit, a bad
 * mount), unparseable, not a JSON object, `repos` not an object, or a `schema` this release does not
 * recognise all read as "no repositories are registered" rather than throwing. A machine-scoped file
 * must not be able to stop a repository-scoped command, and this one is not consulted before
 * starting a run, so there is nothing a fault here could correctly block.
 *
 * That is the opposite of `readJsonFile`'s own contract, which throws on unparseable JSON so a later
 * create-if-absent write cannot clobber a file the adopter merely mistyped. The trade is different
 * here and worth stating: an unreadable registry **is** rewritten by the next
 * {@link upsertRepository}, and that is acceptable because this file is *derived* state — every
 * entry in it can be recreated by re-running `daemon install` in the repository it names, and losing
 * one costs a line in a listing rather than a run or an adopter's edits.
 *
 * The returned registry is a fresh object each call; a caller may keep it and grade it later without
 * aliasing anyone else's copy.
 */
export function readRegistry(): Registry {
  let parsed: JsonValue | undefined;
  try {
    parsed = readJsonFile(registryPath());
  } catch {
    return { schema: REGISTRY_SCHEMA, repos: {} };
  }

  const repos: Record<string, RegistryEntry> = {};
  if (!isJsonObject(parsed) || parsed['schema'] !== REGISTRY_SCHEMA) return { schema: REGISTRY_SCHEMA, repos };

  const stored = parsed['repos'];
  if (!isJsonObject(stored)) return { schema: REGISTRY_SCHEMA, repos };
  for (const slug of Object.keys(stored)) {
    const entry = parseEntry(stored[slug]);
    if (entry !== undefined) repos[slug] = entry;
  }
  return { schema: REGISTRY_SCHEMA, repos };
}

/** The serialized form: the current schema, and the entries in slug order with a fixed field order. */
function toJson(registry: Registry): JsonObject {
  const repos: JsonObject = {};
  for (const slug of Object.keys(registry.repos).sort(compareSlugs)) {
    const entry = registry.repos[slug];
    if (entry === undefined) continue;
    repos[slug] = {
      root: entry.root,
      projectName: entry.projectName,
      label: entry.label,
      backend: entry.backend,
      unitPath: entry.unitPath,
      registered_at: entry.registered_at,
    };
  }
  return { schema: REGISTRY_SCHEMA, repos };
}

/**
 * Write the whole registry, **atomically**: a temp file in the same directory, then a rename.
 *
 * Same directory, so the rename is within one filesystem and therefore atomic — a reader mid-write
 * sees the previous record or the new one and never a half-written line. It is the same protocol
 * `hr_lane_publish` uses for `usage-state.json` in the generated `lib/harness-run-lib.sh`, and for
 * the same reason.
 *
 * The temp name carries this process's pid: two writers with one pid cannot exist at the same time
 * on one machine, so it is unique among concurrent writers, and a crashed run leaves at most one
 * stale temp per pid rather than an accumulating pile. The mode is applied by an explicit `chmod`
 * after the write as well as by `writeFileSync`'s own option, because that option is masked by the
 * process umask and is ignored outright for a file that is already there — which a leftover temp
 * from a crash would be. The directory is created and `chmod`ed on the same two-step reasoning
 * (`core/writer.ts`'s `ensure-dir` commit, and the shell half's `mkdir -p` then `chmod 700`).
 *
 * A failure leaves the previous file untouched and removes the temp. The removal is `rmSync` on one
 * file **without** `recursive`, so it cannot empty a directory even if it were aimed at one.
 */
function writeRegistry(registry: Registry): void {
  const dir = machineStateDir();
  mkdirSync(dir, { recursive: true });
  chmodSync(dir, MACHINE_DIR_MODE);

  const temp = join(dir, `.${REGISTRY_FILENAME}.${process.pid}.tmp`);
  try {
    writeFileSync(temp, formatJson(toJson(registry)), { encoding: 'utf8', mode: REGISTRY_FILE_MODE });
    chmodSync(temp, REGISTRY_FILE_MODE);
    renameSync(temp, registryPath());
  } catch (error) {
    try {
      rmSync(temp, { force: true });
    } catch {
      // The original failure is the one worth reporting; a temp file left behind is not.
    }
    throw error;
  }
}

/** Refuse a path that is not absolute, before it becomes a record two commands later disagree on. */
function assertAbsolute(field: string, value: string): void {
  if (!isAbsolute(value)) {
    throw internal(
      `the repository registry was given a relative ${field} (${JSON.stringify(value)}), which would read differently depending on where a later command was run from`,
    );
  }
}

/**
 * Register a repository, or replace its entry in place.
 *
 * The key is {@link repoSlug} of `entry.root`, derived **here** rather than taken from the caller,
 * so a re-install over an existing repository can only ever land on that repository's own row and
 * two checkouts can never collide. Every other entry in the file is preserved.
 *
 * It writes when it is called: see the module header's last paragraph, and do not call it under
 * `--dry-run`.
 */
export function upsertRepository(entry: RegistryEntry): void {
  assertAbsolute('root', entry.root);
  assertAbsolute('unitPath', entry.unitPath);

  const current = readRegistry();
  const repos: Record<string, RegistryEntry> = { ...current.repos, [repoSlug(entry.root)]: entry };
  writeRegistry({ schema: REGISTRY_SCHEMA, repos });
}

/**
 * Remove the named entries and report how many were there — the explicit prune, and the only removal
 * in this module.
 *
 * A slug that is not registered is not an error: the caller of `daemon list --prune` passes what it
 * graded stale, and a concurrent `daemon install` may legitimately have changed the file in between.
 * When nothing matched, **nothing is written at all** — so a prune over an unreadable file leaves
 * that file exactly as it is rather than replacing it with an empty one.
 *
 * It writes when it is called: see the module header's last paragraph.
 */
export function removeRepositories(slugs: readonly string[]): number {
  const repos: Record<string, RegistryEntry> = { ...readRegistry().repos };
  let removed = 0;
  for (const slug of slugs) {
    if (!Object.hasOwn(repos, slug)) continue;
    delete repos[slug];
    removed += 1;
  }
  if (removed === 0) return 0;
  writeRegistry({ schema: REGISTRY_SCHEMA, repos });
  return removed;
}

/** True when something is at `path` and it is a directory. Any error reads as "not there". */
function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Grade one entry. Reads the filesystem and probes git; changes neither.
 *
 * **The order of the two first checks is load-bearing, not cosmetic.** `probeRepoRoot` runs `git` with
 * the candidate directory as its working directory, and spawning a process in a directory that is not
 * there fails with `ENOENT` — which that probe reads as "git is not on PATH". So the root's existence
 * is settled first, and the repository question is only ever asked of a directory that exists.
 *
 * A recorded root that exists and *is inside* a repository whose top level is some other directory is
 * `not-a-repository`: the entry claims a repository root, and this path is no longer one. Comparing a
 * `--show-toplevel` answer against a recorded value is comparing like with like, because the recorded
 * value came from the same probe when the daemon was installed.
 *
 * When git is not on PATH, or refused to answer at all (`detected dubious ownership`), the repository
 * question has no answer, so it is skipped and the entry is graded on the two axes that remain. Only
 * git's own "not a git repository" grades the entry stale. Reporting every registered repository as
 * broken because the machine running `daemon list` has no git, or will not read a root it does not
 * own, would be a fault of the reader dressed up as a fault of the registry.
 */
function gradeEntry(entry: RegistryEntry): EntryState {
  if (!isDirectory(entry.root)) return 'root-missing';

  const probe = probeRepoRoot(entry.root);
  if (probe.kind === 'not-a-repository') return 'not-a-repository';
  if (probe.kind === 'repository' && probe.root !== entry.root) return 'not-a-repository';

  if (!existsSync(entry.unitPath)) return 'unit-missing';
  return 'ok';
}

/**
 * Grade every entry — **the one place staleness is decided**, so `daemon list` and `doctor` cannot
 * report the same machine differently.
 *
 * Sorted by slug rather than left in the file's own order, so a listing an operator reads twice reads
 * the same way twice even if the file was hand-edited into some other order.
 *
 * It writes nothing and removes nothing; that is the module header's answer 2, and it is why this
 * function is safe to call from `doctor`, whose published contract is that a run of it writes
 * nothing at all.
 */
export function inspect(registry: Registry): readonly InspectedEntry[] {
  const graded: InspectedEntry[] = [];
  for (const slug of Object.keys(registry.repos).sort(compareSlugs)) {
    const entry = registry.repos[slug];
    if (entry === undefined) continue;
    graded.push({ slug, entry, state: gradeEntry(entry) });
  }
  return graded;
}
