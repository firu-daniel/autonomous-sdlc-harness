/**
 * Every `git` invocation that reads repository **state or a path**, in one module.
 *
 * **The rule this module exists to enforce: no other module probes git for the state of a
 * repository or for a path derived from one — it calls a function here.** One home means one
 * definition of each probe, one place a review checks that a probe stayed read-only and issued
 * bare, and one place a new invocation has to justify itself.
 *
 * **The single deliberate exception is `generators/githooks.ts`**, which carries its own private
 * `runGit` for exactly two calls: reading `core.hooksPath` and writing it. Those read and write a
 * repository **setting** rather than state or a path — the CLI's only write to git configuration —
 * and that module's own header argues the split under "Where the filesystem and git are touched,
 * and why they are split". It is an exception with a boundary, not a precedent: a third invocation
 * anywhere in the package belongs here.
 *
 * Two functions below are a **collapsing view over another's probe rather than a probe of their
 * own** — {@link resolveRepoRoot} over {@link probeRepoRoot}, {@link currentBranch} over
 * {@link checkedOutBranch}. Neither adds a git invocation and neither adds an invariant: the rule
 * above is about the invocation, and each pair issues one.
 *
 * Two invariants hold in every git call below:
 *
 * 1. **`execFileSync` with an argv array, never a shell string** — no `shell: true`, no
 *    interpolation, so a path containing a space or a quote cannot become two arguments.
 * 2. **The repository-root probe is issued bare** — the literal arguments
 *    `rev-parse --show-toplevel`, with nothing added. An unattended run's permission profile
 *    can allow-list a literal read-only git command, while the same command wrapped in a shell
 *    substitution or embedded in a compound statement is a different string and stalls on a
 *    prompt (`docs/config.md` §1).
 *
 * Most of what follows is read-only. The two exceptions — {@link initRepository} and
 * {@link commitAll} — are the only functions in the CLI that mutate a repository's history, and
 * each is called from one place, behind an explicit adopter decision.
 */

import { execFileSync } from 'node:child_process';

import { HarnessError } from './errors.js';

/**
 * The bare repository-root probe, as one frozen literal. Kept as a named constant so a review
 * can see at a glance that no flag was added to it (`--path-format`, `-C`, `--git-dir`) — see
 * invariant 2 in the module header.
 */
const GIT_REPO_ROOT_ARGS: readonly string[] = Object.freeze(['rev-parse', '--show-toplevel']);

/** The checked-out-branch probe, read-only and with no flag beyond the two that name the branch. */
const GIT_CURRENT_BRANCH_ARGS: readonly string[] = Object.freeze(['rev-parse', '--abbrev-ref', 'HEAD']);

/**
 * The same question asked of `HEAD` itself rather than of the commit it points at: the branch `HEAD`
 * names, answered without requiring a commit to exist on it.
 *
 * It is here because the probe above cannot answer in the state every repository with no commit is
 * in at the moment detection runs — the one `init --git-init` just created, and the one an adopter
 * made and has not committed into. `HEAD` is unborn, `rev-parse --abbrev-ref HEAD` exits 128, and
 * the branch the first commit is about to land on is exactly the value that has to be configured. `--quiet` keeps a detached `HEAD` an exit status rather than an error on stderr.
 */
const GIT_SYMBOLIC_HEAD_ARGS: readonly string[] = Object.freeze(['symbolic-ref', '--quiet', '--short', 'HEAD']);

/**
 * The worktree inventory probe, issued bare: the two literal arguments and nothing added.
 *
 * `--porcelain` is deliberately absent. The only caller asks whether this git can answer the
 * question at all, not what the answer says, and the plain form is the one an unattended run's
 * permission profile is most likely to already allow as a literal.
 */
const GIT_WORKTREE_LIST_ARGS: readonly string[] = Object.freeze(['worktree', 'list']);

/**
 * "Does `HEAD` name a commit" — `--quiet` so an unborn HEAD prints nothing rather than an error,
 * leaving the exit status as the whole answer.
 */
const GIT_HAS_COMMITS_ARGS: readonly string[] = Object.freeze(['rev-parse', '--verify', '--quiet', 'HEAD']);

/**
 * Repository creation, as the literal single argument.
 *
 * **No `--initial-branch`.** git's own `init.defaultBranch` decides the name, and detection reads
 * that name back off the unborn `HEAD` this leaves behind ({@link checkedOutBranch}); passing a name
 * here would pre-empt the value the detection is supposed to read.
 */
const GIT_INIT_ARGS: readonly string[] = Object.freeze(['init']);

/** Where `origin` says its own default branch points, or nothing when no remote HEAD is known. */
const GIT_REMOTE_HEAD_ARGS: readonly string[] = Object.freeze([
  'symbolic-ref',
  '--quiet',
  '--short',
  'refs/remotes/origin/HEAD',
]);

/** The configured name `git init` would give a new repository's first branch, when one is set. */
const GIT_INIT_DEFAULT_BRANCH_ARGS: readonly string[] = Object.freeze(['config', '--get', 'init.defaultBranch']);

/** The remote inventory probe, issued bare: names only, one per line, with no flag added. */
const GIT_REMOTES_ARGS: readonly string[] = Object.freeze(['remote']);

/**
 * The ref-existence probe, minus the ref. The full ref name is appended as **one** argv element by
 * {@link refResolves}; `--quiet` makes the exit status the whole answer.
 */
const GIT_VERIFY_REF_ARGS: readonly string[] = Object.freeze(['rev-parse', '--verify', '--quiet']);

/**
 * The commit-counting probe, minus the range. The `<base>..<tip>` range is appended as **one** argv
 * element by {@link commitsAhead} (module header, invariant 1), followed by the pathspec separator
 * below.
 */
const GIT_COUNT_RANGE_ARGS: readonly string[] = Object.freeze(['rev-list', '--count']);

/**
 * What separates revisions from paths on a git command line, appended after the range so a range
 * that happens to spell a path in the working tree cannot be read as one.
 */
const PATHSPEC_SEPARATOR = '--';

/**
 * The ignore probe, minus the path. `--quiet` makes the exit status the whole answer, and
 * {@link PATHSPEC_SEPARATOR} is part of the constant rather than appended by the caller so the path
 * is always passed after it — a path beginning with `-` can then never be read as an option.
 */
const GIT_CHECK_IGNORE_ARGS: readonly string[] = Object.freeze([
  'check-ignore',
  '--quiet',
  PATHSPEC_SEPARATOR,
]);

/**
 * The object-existence probe, minus the object. `-e` makes the exit status the whole answer; the
 * `<ref>:<path>` name is appended as **one** argv element by {@link pathAtRef}.
 */
const GIT_OBJECT_EXISTS_ARGS: readonly string[] = Object.freeze(['cat-file', '-e']);

/** The prefix `git` prints on a remote-tracking branch, stripped before the name is reported. */
const ORIGIN_PREFIX = 'origin/';

/**
 * Run `git` with a fixed argument vector and return its trimmed stdout.
 *
 * stdin is closed and stderr is captured rather than inherited: a git failure is turned into a
 * `HarnessError` with a message written for the person running the command, so the raw git
 * text never interleaves with the reporter's output.
 */
function runGit(args: readonly string[], cwd: string): string {
  return execFileSync('git', [...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

/** True when a thrown value is a failure to spawn `git` at all, rather than a non-zero status. */
function isMissingGit(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT';
}

/**
 * One captured stream off a thrown `execFileSync` result, decoded and flattened to a single line.
 *
 * git answers in paragraphs (`On branch main\nnothing to commit, working tree clean`) and every
 * consumer of this text is a one-line warning or check detail, so the newlines are collapsed here
 * rather than in each caller. Nothing is dropped — only the line breaks become spaces.
 */
function capturedStream(error: unknown, stream: 'stderr' | 'stdout'): string {
  const value = (error as { stderr?: string | Buffer; stdout?: string | Buffer } | null)?.[stream];
  const text = typeof value === 'string' ? value : value instanceof Buffer ? value.toString('utf8') : '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * What to tell the adopter about a failed invocation: **git's own account of it**, which is the
 * sentence that names the actual cause and the only one worth putting in front of them.
 *
 * stderr first — that is where a refusal lands (`Author identity unknown`, a rejecting hook).
 * stdout second, because `git commit` reports the one non-failure failure this CLI actually meets,
 * `nothing to commit, working tree clean`, on stdout while still exiting non-zero. The thrown
 * value's own message is the last resort: it is `Command failed: git commit -m <message>`, which
 * names no cause and echoes the whole commit message back.
 *
 * A missing `git` is spelled out rather than passed through, because the raw `ENOENT` text names
 * `spawnSync` and a file descriptor rather than the thing the reader has to fix.
 */
function gitFailureDetail(error: unknown): string {
  if (isMissingGit(error)) return 'git is not on PATH';
  const stderr = capturedStream(error, 'stderr');
  if (stderr !== '') return stderr;
  const stdout = capturedStream(error, 'stdout');
  if (stdout !== '') return stdout;
  return error instanceof Error ? error.message : String(error);
}

/**
 * The substring every wording of git's "there is no repository here" carries — the parenthesised
 * `(or any of the parent directories)` form and the `--git-dir` form alike. Matched on stderr
 * because `rev-parse --show-toplevel` exits non-zero for that answer and for every other refusal
 * alike, and only this one leaves the directory free for `init` to offer to create one in.
 */
const NOT_A_REPOSITORY_STDERR = 'not a git repository';

/** The one wording of the no-repository refusal, so both branches that reach it read identically. */
const NOT_A_REPOSITORY_MESSAGE = (cwd: string): string => `not inside a git repository: ${cwd}`;

/**
 * What the bare root probe found, as four distinguishable answers rather than one error.
 *
 * The distinction is the whole point: `init` offers to create a repository when there is not one,
 * and must **not** make that offer for the two failures whose accept path would fail for the same
 * reason — `git` not installed, and a `git` that refused to answer at all. `not-a-repository` is
 * **only** git's own "not a git repository", never any other refusal: `rev-parse --show-toplevel`
 * also exits non-zero inside a perfectly good repository, most commonly on `detected dubious
 * ownership`, and grading that as "there is no repository here" both loses the remedy and offers to
 * create a repository inside one. Callers branch on `kind`; nothing anywhere matches on the message
 * text, which is what the `message` field exists to make unnecessary.
 */
export type RepoProbe =
  | { readonly kind: 'repository'; readonly root: string }
  | { readonly kind: 'not-a-repository'; readonly message: string }
  | { readonly kind: 'no-git'; readonly message: string }
  | { readonly kind: 'git-failed'; readonly message: string };

/**
 * The repository root containing `cwd`, or why there is not one — from the same bare
 * `rev-parse --show-toplevel` as {@link resolveRepoRoot}, which is implemented on top of this.
 *
 * The carried messages are the exact strings {@link resolveRepoRoot} throws, so a caller that
 * cannot act on the distinction can report the failure identically to a caller that never probed.
 */
export function probeRepoRoot(cwd: string): RepoProbe {
  let output: string;
  try {
    output = runGit(GIT_REPO_ROOT_ARGS, cwd);
  } catch (error) {
    if (isMissingGit(error)) {
      return {
        kind: 'no-git',
        message: `git is not on PATH, so the repository root of ${cwd} cannot be resolved`,
      };
    }
    const detail = gitFailureDetail(error);
    if (detail.toLowerCase().includes(NOT_A_REPOSITORY_STDERR)) {
      return { kind: 'not-a-repository', message: NOT_A_REPOSITORY_MESSAGE(cwd) };
    }
    return {
      kind: 'git-failed',
      message: `git could not resolve the repository root of ${cwd}: ${detail}`,
    };
  }
  if (output === '') return { kind: 'not-a-repository', message: NOT_A_REPOSITORY_MESSAGE(cwd) };
  return { kind: 'repository', root: output };
}

/**
 * `<repo_root>` — the root of the repository containing `cwd`, from a bare
 * `git rev-parse --show-toplevel`.
 *
 * In a git worktree this is the **worktree's** root, not the main checkout's, which is the
 * whole point of resolving it per run: a worktree run must write into its own checkout.
 *
 * Throws a `HarnessError` when `cwd` is not inside a repository, or when `git` is not on PATH.
 * Both are adopter-fixable, so both carry the default exit code.
 *
 * It is a thin refusal on top of {@link probeRepoRoot} so that the root probe is issued from
 * exactly one place in the package, whether or not the caller can act on the distinction.
 */
export function resolveRepoRoot(cwd: string): string {
  const probe = probeRepoRoot(cwd);
  if (probe.kind === 'repository') return probe.root;
  throw new HarnessError(probe.message);
}

/**
 * What `HEAD` names in this checkout, as three distinguishable answers rather than one.
 *
 * **`'detached'` and `'none'` are different facts, and keeping them apart is the whole point.** A
 * repository whose `HEAD` is detached demonstrably *has* branches — it is standing off one, not
 * short of any — so a caller can say which of the two it met instead of reporting that the
 * repository offered no branch to take. It is not an unusual state either: on a colocated `jj`
 * repository `.git/HEAD` holds a raw commit id after every `jj new`, so `'detached'` is the ordinary
 * working answer there and the caller's wording is read by an adopter for whom nothing is wrong.
 *
 * **A repository with no commit yet is `'branch'`, not `'none'`**, and that is the whole reason
 * there are two probes. `git init` puts `HEAD` on a branch immediately; only the commit is missing.
 * `init`'s own default-branch detection meets that state whenever it wires a repository with no
 * commit — the one this process created moments earlier under `--git-init`, and the one an adopter
 * made and has not committed into — and is about to make the first commit in it either way, so
 * answering `'none'` there would wire the repository to a name taken from git's `init.defaultBranch`
 * or from the schema default while its first commit lands somewhere else, and the pre-push guard
 * built from that value would protect a branch that does not exist.
 *
 * Callers branch on `kind`; nothing anywhere matches on the branch name to infer which answer it is.
 */
export type HeadProbe =
  | { readonly kind: 'branch'; readonly name: string }
  | { readonly kind: 'detached' }
  | { readonly kind: 'none' };

/**
 * What `HEAD` names in this checkout — the three answers of {@link HeadProbe}, from the same two
 * probes {@link currentBranch} is implemented on top of, and **no third git invocation**.
 *
 * {@link GIT_CURRENT_BRANCH_ARGS} answers first, and the literal `HEAD` it prints for a detached
 * checkout is what `'detached'` is decided on; {@link GIT_SYMBOLIC_HEAD_ARGS} answers only where
 * that one throws, which is the repository whose `HEAD` is unborn. It never throws itself; a caller
 * that needs the repository at all has already resolved its root through {@link resolveRepoRoot},
 * which does throw.
 *
 * It lives here rather than in the generator that wants it, for the reason in the module header:
 * every repository-state probe has one definition and one place a review checks that it stayed
 * read-only.
 */
export function checkedOutBranch(repoRoot: string): HeadProbe {
  let output: string;
  try {
    output = runGit(GIT_CURRENT_BRANCH_ARGS, repoRoot);
  } catch {
    // An unborn HEAD is not a detached one: `symbolic-ref` still names the branch the first commit
    // will create. A detached HEAD never reaches here — the probe above succeeds and prints the
    // literal `HEAD` — and a repository the second probe cannot answer for either is `'none'`.
    try {
      output = runGit(GIT_SYMBOLIC_HEAD_ARGS, repoRoot);
    } catch {
      return { kind: 'none' };
    }
    return output === '' ? { kind: 'none' } : { kind: 'branch', name: output };
  }
  // `HEAD` is what the first probe prints for a detached checkout: a literal, not a branch name.
  if (output === 'HEAD') return { kind: 'detached' };
  return output === '' ? { kind: 'none' } : { kind: 'branch', name: output };
}

/**
 * The name of the checked-out branch, or `undefined` when there is not one to name — the collapsing
 * view over {@link checkedOutBranch}, for the caller that cannot act on *why* there is no name.
 *
 * `'detached'` and `'none'` both come back as `undefined`, because they mean the same thing to
 * `doctor`'s `--test-notification` probe: no branch to report here, and the configured
 * `defaultBranch` stands in. The caller that can act on the difference is `init`'s default-branch
 * detection, which asks {@link checkedOutBranch} directly so its note can name which one it met.
 */
export function currentBranch(repoRoot: string): string | undefined {
  const probe = checkedOutBranch(repoRoot);
  return probe.kind === 'branch' ? probe.name : undefined;
}

/**
 * The checkouts git reports for this repository, one line each, or `undefined` when the probe did
 * not answer — a git too old for the subcommand, a repository state it refuses to list, or no `git`
 * at all.
 *
 * `undefined` and an empty answer are the same result on purpose: `git worktree list` prints the
 * main working copy even when there is only one, so nothing to report means the probe did not work
 * rather than that there are no checkouts. The one caller is `doctor`, which asks whether
 * worktree-based runs can be prepared here and reports a `warn` either way, so the distinction
 * between the ways it can fail buys nothing.
 *
 * It lives here rather than in that check, for the reason in the module header: every
 * repository-state probe has one definition and one place a review checks that it stayed read-only.
 */
export function worktreeList(repoRoot: string): string[] | undefined {
  let output: string;
  try {
    output = runGit(GIT_WORKTREE_LIST_ARGS, repoRoot);
  } catch {
    return undefined;
  }
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  return lines.length === 0 ? undefined : lines;
}

/**
 * Whether this repository has any commit at all.
 *
 * **An unborn HEAD is the answer, not an error**, so every non-zero status is `false`: a freshly
 * `git init`'d repository is the normal state at the moment `init` runs, and the callers that ask
 * — the first-commit path and the default-branch check — both have something correct to do with a
 * `false` and nothing correct to do with a throw.
 */
export function hasCommits(repoRoot: string): boolean {
  try {
    runGit(GIT_HAS_COMMITS_ARGS, repoRoot);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a repository in `dir` — the CLI's one call to `git init`, made only after the adopter has
 * said yes (a flag, or a prompt that has one).
 *
 * Issued bare, for the reason on {@link GIT_INIT_ARGS}: the branch name is git's own
 * `init.defaultBranch` to decide, and detection reads it back rather than the CLI dictating it.
 *
 * Throws a `HarnessError` naming `dir` and git's own stderr. This one throws, unlike
 * {@link commitAll}, because nothing has been wired yet when it runs: a repository that could not
 * be created has no partial success to preserve.
 */
export function initRepository(dir: string): void {
  try {
    runGit(GIT_INIT_ARGS, dir);
  } catch (error) {
    throw new HarnessError(`git init failed in ${dir}: ${gitFailureDetail(error)}`);
  }
}

/** Whether the commit happened, and — when it did not — git's own account of why. */
export type CommitResult = { readonly committed: true } | { readonly committed: false; readonly reason: string };

/**
 * Stage everything and commit it: `add -A`, then `commit -m <message>` with the message as a single
 * argv element.
 *
 * **This never throws.** Its caller has already written the adopter's wiring by the time it runs, so
 * a throw here would report a failed command for a run that succeeded — the files are on disk and
 * correct either way. A refusal git can state (`Author identity unknown`, an empty index, a hook
 * that rejected it) comes back as `committed: false` with git's own trimmed stderr, which the
 * caller warns with and carries on.
 */
export function commitAll(repoRoot: string, message: string): CommitResult {
  try {
    runGit(['add', '-A'], repoRoot);
  } catch (error) {
    return { committed: false, reason: gitFailureDetail(error) };
  }
  try {
    runGit(['commit', '-m', message], repoRoot);
  } catch (error) {
    return { committed: false, reason: gitFailureDetail(error) };
  }
  return { committed: true };
}

/**
 * The branch `origin/HEAD` points at, with the `origin/` prefix stripped — the first and most
 * authoritative rung of default-branch detection, because it is the remote's own answer rather than
 * a guess from this checkout.
 *
 * `undefined` on any non-zero status, which covers both the repository with no remote and the
 * remote whose HEAD was never fetched (a clone made with `--no-tags`, a manually added remote).
 * Neither is a fault: the caller falls through to the next rung.
 */
export function remoteHeadBranch(repoRoot: string): string | undefined {
  let output: string;
  try {
    output = runGit(GIT_REMOTE_HEAD_ARGS, repoRoot);
  } catch {
    return undefined;
  }
  const branch = output.startsWith(ORIGIN_PREFIX) ? output.slice(ORIGIN_PREFIX.length) : output;
  return branch === '' ? undefined : branch;
}

/**
 * The configured `init.defaultBranch`, or `undefined` when it is unset — the last rung of
 * default-branch detection, and the name git itself would have given a repository
 * {@link initRepository} created.
 *
 * Unset is a non-zero status from `config --get`, which is why every failure collapses to
 * `undefined` rather than being distinguished: there is nothing else this probe can fail at that
 * the caller would treat differently.
 */
export function configuredInitDefaultBranch(repoRoot: string): string | undefined {
  let output: string;
  try {
    output = runGit(GIT_INIT_DEFAULT_BRANCH_ARGS, repoRoot);
  } catch {
    return undefined;
  }
  return output === '' ? undefined : output;
}

/**
 * The names of the remotes this repository has configured, in git's own order, or an empty list
 * when it has none.
 *
 * **No remote is the answer, not an error**, the same discipline {@link hasCommits} states: a
 * repository that has never had one is an ordinary state, and the caller — `doctor`'s remote check
 * — grades that state itself. Every non-zero status therefore collapses to the empty list, because
 * a probe that failed some other way leaves that caller with nothing different to do.
 */
export function configuredRemotes(repoRoot: string): readonly string[] {
  let output: string;
  try {
    output = runGit(GIT_REMOTES_ARGS, repoRoot);
  } catch {
    return [];
  }
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** True when `ref` names something this repository can resolve. The ref is one argv element. */
function refResolves(repoRoot: string, ref: string): boolean {
  try {
    runGit([...GIT_VERIFY_REF_ARGS, ref], repoRoot);
    return true;
  } catch {
    return false;
  }
}

/**
 * Where a branch name resolves in this repository: a local branch, a remote-tracking ref under
 * `origin/`, or nowhere.
 *
 * Both spellings are checked because a configured integration line is legitimately present as
 * either — a fresh clone with a single checked-out branch has the rest only as remote-tracking
 * refs, and a repository that has never had a remote has only local ones. `'none'` is the answer
 * that means the configured name is wrong, and it is the only one a caller grades as a failure.
 *
 * The full ref names are built by string join and passed as **one argv element each** (module
 * header, invariant 1). Prefixing with `refs/heads/` also means a branch name that starts with `-`
 * can never be read as an option.
 *
 * It answers where a name resolves **first**, so it cannot be asked whether a remote-tracking ref
 * exists: the ordinary repository has both spellings and reads `'local'` here. That question is
 * {@link remoteTrackingBranchResolves}'.
 */
export function branchResolves(repoRoot: string, branch: string): 'local' | 'remote' | 'none' {
  if (refResolves(repoRoot, `refs/heads/${branch}`)) return 'local';
  if (refResolves(repoRoot, `refs/remotes/${ORIGIN_PREFIX}${branch}`)) return 'remote';
  return 'none';
}

/**
 * Whether `origin/<branch>` is a remote-tracking ref in this repository.
 *
 * A separate question from {@link branchResolves}, not a narrowing of it: that one stops at the
 * local spelling, which every checkout of its own integration line has, so it answers `'local'`
 * exactly where this has to answer `true`. What reads this is the precondition
 * `create-worktree.sh` branches a run's checkout from, and only the remote-tracking ref satisfies
 * it — a local branch of the same name does not.
 *
 * The ref is built by string join and passed as **one argv element** (module header, invariant 1).
 */
export function remoteTrackingBranchResolves(repoRoot: string, branch: string): boolean {
  return refResolves(repoRoot, `refs/remotes/${ORIGIN_PREFIX}${branch}`);
}

/**
 * How many commits `tipRef` has that `baseRef` does not — `rev-list --count <baseRef>..<tipRef>`,
 * or `undefined` when the count could not be taken.
 *
 * **Read-only, and it issues no fetch**, so a caller's answer is the same offline and `doctor`'s
 * "writes nothing beyond the writability probe's temp file" contract holds through it. The two refs
 * are compared exactly as they stand in this repository; making them current is the caller's remedy
 * to name, never this probe's to do.
 *
 * `undefined` covers every non-zero status — a ref that does not resolve, a range git read as
 * ambiguous, no `git` at all — on the discipline {@link configuredRemotes} states: a probe that
 * failed some other way leaves the caller with nothing different to do. It also covers output that
 * is not a count, which no answered invocation produces and which no caller could act on either.
 *
 * The range is built by string join and passed as **one argv element** (module header, invariant 1),
 * with {@link PATHSPEC_SEPARATOR} after it.
 */
export function commitsAhead(repoRoot: string, baseRef: string, tipRef: string): number | undefined {
  let output: string;
  try {
    output = runGit([...GIT_COUNT_RANGE_ARGS, `${baseRef}..${tipRef}`, PATHSPEC_SEPARATOR], repoRoot);
  } catch {
    return undefined;
  }
  if (output === '') return undefined;
  const count = Number(output);
  return Number.isInteger(count) && count >= 0 ? count : undefined;
}

/**
 * Whether the tree `ref` names carries `repoRelativePath` — `git cat-file -e <ref>:<path>`.
 *
 * **Read-only, and it issues no fetch**, so the answer is the ref as this checkout last saw it: for a
 * remote-tracking ref, the remote as of the last fetch. Making it current is the caller's remedy to
 * name, never this probe's to do.
 *
 * Every non-zero status is `false` — a ref that does not resolve, a path it does not carry, no `git`
 * at all — on the discipline {@link configuredRemotes} states: the one caller, `doctor`'s
 * `remote-execution` check, grades a ref it cannot read exactly as a ref without the file, and
 * whether the ref exists at all is the `remote` check's line.
 *
 * The `<ref>:<path>` name is built by string join and passed as **one argv element** (module header,
 * invariant 1).
 */
export function pathAtRef(repoRoot: string, ref: string, repoRelativePath: string): boolean {
  try {
    runGit([...GIT_OBJECT_EXISTS_ARGS, `${ref}:${repoRelativePath}`], repoRoot);
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether git excludes `repoRelativePath` in this working tree — `true` ignored, `false` not, and
 * `undefined` when git did not answer.
 *
 * **The third value is not a boolean and must not be collapsed into one.** `git check-ignore
 * --quiet` exits **0** when a rule matches, **1** when none does and **128** when it could not run
 * at all, so reading the third status as either verdict would turn a broken invocation into an
 * answer — which is exactly the fault `doctor`'s `ignore-rules` check exists to stop committing.
 * Each caller decides what an unanswerable probe means for it: `ignore-rules` grades the
 * `undefined` and says it did not measure, and `layer-drift` excludes only on a definite `true`, so
 * a candidate git could not resolve stays in the report.
 *
 * The answer is the **effective** one — every ignore source in force here, and the index with them,
 * so a path already tracked comes back `false` because `git add` of it succeeds. That is the
 * question asked: whether a path the harness cares about is excluded right now, not which pattern
 * in which file decided it. **Read-only**, like every probe above it: it resolves a name against
 * rules and touches neither the index nor the working tree.
 *
 * The path is appended as **one argv element**, after {@link PATHSPEC_SEPARATOR} (module header,
 * invariant 1).
 */
export function pathIsIgnored(repoRoot: string, repoRelativePath: string): boolean | undefined {
  try {
    runGit([...GIT_CHECK_IGNORE_ARGS, repoRelativePath], repoRoot);
    return true;
  } catch (error) {
    return (error as { status?: number } | null)?.status === 1 ? false : undefined;
  }
}
