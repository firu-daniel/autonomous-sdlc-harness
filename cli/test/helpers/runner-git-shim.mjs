/**
 * A `git` that answers as the runner's git did for a placeholder `.git`, and the placeholder planter.
 *
 * **The rule this module exists to enforce: no suite's verdict on a placeholder `.git` depends on the
 * host's git version.** The runner's git measured in round 14 dies on both placeholder shapes while
 * discovering a repository, and a local git may pass over a `/dev/null` link and reach the checkout
 * above it, so the same case would pass on one host and fail on another. Two substitutions stand in
 * for the runner:
 *
 * 1. **The git discovery.** {@link installRunnerGitShim} writes a `git` that answers
 *    `-C <d> rev-parse --show-toplevel` itself whenever the nearest `.git` above `<d>` is a
 *    placeholder, with the runner's message and status 128, and hands every other call to the real
 *    git. A suite puts its directory first on the `PATH` it passes the child.
 * 2. **The placeholder's shape.** {@link plantPlaceholder}'s `'device'` is a symbolic link to
 *    `/dev/null`, standing in for the character device a bubblewrap mount leaves: a test cannot
 *    `mknod` without root. `'empty-file'` is the host leftover's own shape, unsubstituted.
 *
 * Nothing runs at import time: `node --test` loads this file as a test file of its own.
 */

import { accessSync, constants, statSync } from 'node:fs';
import { chmod, symlink, writeFile } from 'node:fs/promises';
import { delimiter, isAbsolute, join, resolve } from 'node:path';

/** `value` as one single-quoted shell word. */
function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

/**
 * The absolute path of the first executable regular `git` on this process's `PATH`, skipping
 * `binDir` so a second install never resolves the shim to itself.
 *
 * @param {string} binDir
 * @returns {string}
 */
function realGit(binDir) {
  const skip = resolve(binDir);
  for (const entry of (process.env.PATH ?? '').split(delimiter)) {
    if (entry === '' || !isAbsolute(entry) || resolve(entry) === skip) continue;
    const candidate = join(entry, 'git');
    try {
      if (!statSync(candidate).isFile()) continue;
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Not there, or not executable: the next entry.
    }
  }
  throw new Error('runner-git-shim: no executable git on PATH to hand calls to');
}

/**
 * Write the runner-git shim as `<binDir>/git` (substitution 1 in the module header). Every call
 * appends its argv, space-joined, as one line of `<binDir>/git-calls.txt`. For
 * `-C <d> rev-parse --show-toplevel` only, it walks from `<d>` to the first directory whose `.git`
 * exists or is a link: when that entry, links followed, is neither a directory nor a regular file
 * it prints `fatal: not a regular file` and exits 128, and when it is a 0-byte regular file it
 * prints `fatal: invalid gitfile format: <path>` and exits 128. Everything else `exec`s the real
 * git, resolved now, with the original argv.
 *
 * @param {string} binDir an existing directory the caller puts first on the child's `PATH`.
 * @returns {Promise<{ callsFile: string }>}
 */
export async function installRunnerGitShim(binDir) {
  const git = shellQuote(realGit(binDir));
  const callsFile = join(binDir, 'git-calls.txt');
  const body = [
    '#!/bin/bash',
    `printf '%s\\n' "$*" >> ${shellQuote(callsFile)}`,
    'if [ "$#" -eq 4 ] && [ "$1" = -C ] && [ "$3" = rev-parse ] && [ "$4" = --show-toplevel ]; then',
    `  d=$( CDPATH= cd -P -- "$2" 2>/dev/null && pwd -P ) || exec ${git} "$@"`,
    '  while :; do',
    '    if [ -e "$d/.git" ] || [ -L "$d/.git" ]; then',
    '      [ -d "$d/.git" ] && break',
    '      if [ ! -f "$d/.git" ]; then',
    "        printf 'fatal: not a regular file\\n' >&2",
    '        exit 128',
    '      fi',
    '      if [ ! -s "$d/.git" ]; then',
    "        printf 'fatal: invalid gitfile format: %s\\n' \"$d/.git\" >&2",
    '        exit 128',
    '      fi',
    '      break',
    '    fi',
    '    [ "$d" != / ] || break',
    '    d=${d%/*}',
    '    [ -n "$d" ] || d=/',
    '  done',
    'fi',
    `exec ${git} "$@"`,
    '',
  ].join('\n');
  const shim = join(binDir, 'git');
  await writeFile(shim, body, 'utf8');
  await chmod(shim, 0o755);
  return { callsFile };
}

/**
 * Create a placeholder `.git` at `path`, which must not exist (substitution 2 in the module header).
 *
 * @param {string} path
 * @param {'empty-file' | 'device'} shape `'empty-file'`: a 0-byte regular file, mode `0444`.
 *   `'device'`: a symbolic link to `/dev/null`.
 * @returns {Promise<void>}
 */
export async function plantPlaceholder(path, shape) {
  if (shape === 'empty-file') {
    await writeFile(path, '', { flag: 'wx' });
    await chmod(path, 0o444);
  } else if (shape === 'device') {
    await symlink('/dev/null', path);
  } else {
    throw new Error(`runner-git-shim: unknown placeholder shape ${String(shape)}`);
  }
}
