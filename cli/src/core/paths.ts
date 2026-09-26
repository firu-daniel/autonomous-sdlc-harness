/**
 * The "derived at runtime" resolution class of `docs/config.md` §1, implemented once — path
 * resolution, the package's own layout, and the one reader of the package's own manifest.
 *
 * **The rule this module exists to enforce: every path below is resolved on each run and is
 * never written into a template.** A file that hardcodes one of these is wrong even when the
 * hardcoded value happens to be right, because it stops being right the moment the checkout
 * moves or a second worktree appears. Nothing else in the CLI may join a worktree glob by hand
 * or reach for `import.meta.dirname` to find the package's own assets — it calls a function
 * here, so there is one definition of each value to correct.
 *
 * **Nothing here invokes `git`.** The probes that ask a repository where its root is, what
 * branch is checked out and which checkouts exist live in `core/git.ts`, which owns every git
 * invocation that reads repository state or a path — including the two invariants those calls
 * hold to. A path derived from a repository starts with a value from there and is joined here.
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { EXIT, HarnessError, internal } from './errors.js';
import { isJsonObject, readJsonFile } from './json.js';

/** `<work_root>` — the directory holding the repository, and therefore its sibling worktrees. */
export function workRoot(repoRoot: string): string {
  return dirname(repoRoot);
}

/**
 * `<worktree_glob>` — `<work_root>/<projectName>-*`, the pattern that matches the sibling
 * worktree checkouts of one project.
 *
 * It is emitted unconditionally into a generated permission profile: a single-checkout adopter
 * simply has no sibling for it to match, whereas omitting it is what silently skips a phase in
 * a worktree run.
 */
export function worktreeGlob(work: string, projectName: string): string {
  return join(work, `${projectName}-*`);
}

/**
 * `<project_name>`'s default — the repository directory name. `harness.config.json` may set
 * `projectName` explicitly; this is what `init` seeds when it does not.
 */
export function defaultProjectName(repoRoot: string): string {
  return basename(repoRoot);
}

/**
 * Parse a git remote URL to `<owner>/<repository>`, or `undefined` when it carries no such
 * pair. Handles the two forms a hosted remote is written in:
 *
 * - scp-like — `git@host:owner/repo.git`
 * - URL — `https://host/owner/repo`, `ssh://git@host:22/owner/repo.git`
 *
 * A filesystem remote (`/srv/mirrors/repo.git`, `../other-checkout`) has no owner and yields
 * `undefined` rather than a fabricated pair. For a host that nests groups, the last two path
 * segments are taken, which is the pair every slug consumer means.
 */
export function parseRepoSlug(remoteUrl: string): string | undefined {
  const trimmed = remoteUrl.trim();
  if (trimmed === '') return undefined;

  const schemeless = trimmed.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
  let pathPart: string;
  if (schemeless !== trimmed) {
    // URL form: drop `[user@]host[:port]`.
    const slash = schemeless.indexOf('/');
    if (slash < 0) return undefined;
    pathPart = schemeless.slice(slash + 1);
  } else {
    // scp-like form: a colon before any slash separates the host from the path.
    const colon = trimmed.indexOf(':');
    if (colon < 0) return undefined;
    const firstSlash = trimmed.indexOf('/');
    if (firstSlash >= 0 && firstSlash < colon) return undefined;
    pathPart = trimmed.slice(colon + 1);
  }

  const segments = pathPart
    .replace(/\.git$/, '')
    .split('/')
    .filter((segment) => segment !== '');
  if (segments.length < 2) return undefined;
  return segments.slice(-2).join('/');
}

/** `<home_root>` — the account home directory. */
export function homeRoot(): string {
  return homedir();
}

/**
 * This module compiles to `dist/core/paths.js`, so the package root is two levels above it —
 * one above `dist/`. Resolved from `import.meta.dirname`, which is why the package's Node
 * floor is `>=20.11.0`; do not re-derive it from `import.meta.url`.
 */
const PACKAGE_ROOT: string = resolve(import.meta.dirname, '..', '..');

/**
 * The root of this installed package — the parent of `dist/`, `templates/` and `scripts/`.
 *
 * The layout holds identically in the working copy and in the published tarball, where
 * `files: ["dist", "scripts", "templates", "README.md"]` makes `templates/` and `scripts/`
 * siblings of `dist/`.
 */
export function packageRoot(): string {
  return PACKAGE_ROOT;
}

/**
 * This package's own manifest, which a packaging fault alone can make unreadable. The one reader
 * of it, shared here because three areas need it: `retrieval/` (the runtime check, the peer set
 * and the runtime install's pin), the `docs` command and the workflow generator's version pin.
 */
export function ownManifest(): { [key: string]: unknown } {
  const manifestPath = join(packageRoot(), 'package.json');
  const manifest = readJsonFile(manifestPath);
  if (!isJsonObject(manifest)) throw internal(`this CLI's own manifest could not be read at ${manifestPath}`);
  return manifest;
}

/** A string field of this package's own manifest, read through {@link ownManifest}. */
export function ownManifestString(key: 'name' | 'version'): string {
  const value = ownManifest()[key];
  if (typeof value !== 'string' || value === '') throw internal(`this CLI's own manifest carries no ${key}`);
  return value;
}

/** The generator templates shipped with the package. */
export function templatesDir(): string {
  return join(PACKAGE_ROOT, 'templates');
}

/**
 * The daemon unit templates shipped with the package.
 * Distinct from the adopter's configured `scriptsDir`, which is where `init` *writes* wrapper
 * scripts; this one is read-only and lives inside the installed package.
 */
export function packageScriptsDir(): string {
  return join(PACKAGE_ROOT, 'scripts');
}

/**
 * Read a template's text, addressed relative to {@link templatesDir}.
 *
 * A missing template throws with the path named and exits {@link EXIT.INTERNAL}: a template
 * absent from the installed package is a packaging fault the adopter cannot act on, and the
 * loud failure is deliberate — a template owned by a later roadmap item must fail at its own
 * writer rather than quietly producing an empty file in the adopter's repository.
 */
export function readTemplate(relativePath: string): string {
  const absolute = join(templatesDir(), relativePath);
  try {
    return readFileSync(absolute, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') {
      throw new HarnessError(`template missing from the installed package: ${absolute}`, EXIT.INTERNAL);
    }
    throw error;
  }
}

/**
 * Whether `candidate` resolves to the repository root or somewhere beneath it.
 *
 * The write engine asks this before every write, so a mis-scoped run cannot escape the
 * repository it was aimed at, and `doctor` asks it of the configured directories. The check is
 * **lexical** — it compares resolved paths and does not follow symlinks — so it answers "does
 * this path name a location inside the repo", not "does this file physically live there".
 */
export function insideRepo(repoRoot: string, candidate: string): boolean {
  const rel = relative(resolve(repoRoot), resolve(candidate));
  if (rel === '') return true;
  if (isAbsolute(rel)) return false;
  return rel !== '..' && !rel.startsWith(`..${sep}`);
}
