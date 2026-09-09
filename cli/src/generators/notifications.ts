/**
 * Generator: the machine-local push-notification settings `init --notifications` writes, and the
 * one definition of where the notifier's two credential files are.
 *
 * **Why the credential lives outside the repository, and why it is not a plugin `userConfig`
 * option.** The roadmap item that asked for this opt-in also asked for the token to go into the
 * plugin's `userConfig` as a `sensitive` value. That half is reconciled rather than implemented,
 * and this is where the reconciliation is recorded so it is not re-opened: `docs/development.md` §4
 * and `docs/config.md` §2 both record, as a measured fact, that **the CLI cannot read plugin
 * `userConfig` at all** — so a key declared there would not reach this command. The shipped
 * delivery contract carries no token key either: `cli/templates/claude/push-notify.env.example`
 * declares exactly {@link PUSH_URL_KEY} and {@link PUSH_CMD_KEY}. The credential-bearing value is
 * therefore the push **URL**, and its home is the machine-local `push.env` that `docs/watcher.md`
 * §6 already names as the first file the notifier reads. "Guided ntfy setup" ships accordingly as a
 * vendor-neutral endpoint prompt whose guided line uses `https://ntfy.sh/<your-topic>` as the
 * worked example rather than as the only thing that works.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **An opt-in with no endpoint writes nothing — and that is the whole point of the file.**
 *    `docs/watcher.md` §6's precedence is that the machine-local file wins and the repository's
 *    configured `pushEnvPath` is then **not read**. So an empty machine-local file is not a
 *    harmless placeholder: it satisfies "the first that exists wins" and *shadows* a repository-side
 *    file that already has values, turning an opt-in into a silent opt-out. When the answer to
 *    "where should notifications be posted" is nothing, this generator enqueues nothing and returns
 *    the guided setup as a note instead.
 * 2. **The value is never logged back.** The run's action log names the path the write engine
 *    wrote, the note names the two keys, and neither says what the URL is — the same discipline
 *    `autonomous-notify.sh`'s header states for the delivery side ("NO VALUE IS EVER PRINTED, by
 *    this script or in a failure line — only paths and key names"). A push URL is a bearer
 *    credential for every endpoint worth pointing this at, and a terminal scrollback is not where
 *    it belongs.
 * 3. **The precedence has exactly one definition on the TypeScript side**, {@link pushEnvCandidates},
 *    so a `doctor` check reporting which file is in effect reads that order rather than re-joining
 *    either path. Two derivations of a first-wins order is two answers to the one question anybody
 *    asks about these files, and the answers would differ exactly where it matters — on a machine
 *    that has both.
 *
 * Nothing here touches the filesystem: the generator plans, and `init` applies the plan once — so
 * `--dry-run` writes no machine-local file for the same structural reason it writes nothing inside
 * the repository.
 */

import { join } from 'node:path';

import { CONFIG_FILENAME, type HarnessConfig } from '../config/model.js';
import type { WritePlan } from '../core/writer.js';
import { machineConfigDir, MACHINE_DIR_MODE } from '../machine/paths.js';

/** The machine-local file's name, under {@link machineConfigDir}. `docs/watcher.md` §6 names it. */
export const PUSH_ENV_FILENAME = 'push.env';

/** The endpoint key. One of the two spellings the notifier recognises, and it recognises no others. */
export const PUSH_URL_KEY = 'HARNESS_PUSH_URL';

/** The local-command key, written empty here: a second delivery arm the operator may fill in later. */
export const PUSH_CMD_KEY = 'HARNESS_PUSH_CMD';

/** Mode of the written file: it holds a credential, so it is the owner's to read and nobody else's. */
const PUSH_ENV_MODE = 0o600;

/**
 * The worked example in the guided setup — an endpoint that accepts a POST and needs no account.
 *
 * Exported so `init`'s prompt and this generator's guided note quote **one** example: two would be
 * two answers to "what does a URL that works look like", and the prompt is where the question is
 * first asked while the note is where an unanswered one is explained.
 */
export const GUIDED_ENDPOINT_EXAMPLE = 'https://ntfy.sh/<your-topic>';

/** The machine-local push-notification settings file — the first file the notifier reads. */
export function machinePushEnvPath(): string {
  return join(machineConfigDir(), PUSH_ENV_FILENAME);
}

/** One place the notifier may find its settings, and which of the two it is. */
export interface PushEnvCandidate {
  /** Absolute path of the file. It may well not exist; this says where it would be. */
  readonly path: string;
  /** `machine` for the machine-local file, `repository` for the configured `pushEnvPath`. */
  readonly origin: 'machine' | 'repository';
}

/**
 * The candidate settings files **in precedence order**: machine-local first, the repository's
 * configured `pushEnvPath` second when there is one. The first that exists wins and the other is not
 * read (`docs/watcher.md` §6, and `autonomous-notify.sh`'s header, which implement the same order
 * once each on the shell side).
 *
 * The list is one long on a config with no `pushEnvPath`, for the reason
 * {@link repositoryPushEnvPath} records: the shell half prints no repository candidate there either,
 * so a caller walking this list names only files the notifier would actually open.
 *
 * Exported so a caller answering "which of these is in effect" — `doctor`'s standing check for
 * these settings is the one this release plans — takes the order from here rather than from a
 * second derivation of its own.
 */
export function pushEnvCandidates(repoRoot: string, config: HarnessConfig): readonly PushEnvCandidate[] {
  const repository = repositoryPushEnvPath(repoRoot, config);
  return [
    { path: machinePushEnvPath(), origin: 'machine' },
    ...(repository === undefined ? [] : [{ path: repository, origin: 'repository' as const }]),
  ];
}

/**
 * The repository-side candidate on its own — the configured `pushEnvPath`, or `undefined` when the
 * key is absent.
 *
 * **Absent is not the schema seed.** `pushEnvPath` has no schema default, and the shell half
 * (`hr_push_env_files`, via `hr_push_env_path`'s empty fallback) prints no repository candidate at
 * all when the key is empty — so seeding `.claude/push-notify.env` here would make a caller name a
 * file the notifier never opens, which is the one way two derivations of a first-wins order could
 * still differ. `init` writes the key into every config it generates, so the only way here is a
 * config it was deleted from by hand.
 *
 * Private, and the one expression {@link pushEnvCandidates} and every note below share: the notes
 * name this file because it is the one the machine-local file wins over, and a second join here
 * would let the sentence and the precedence name different files.
 */
function repositoryPushEnvPath(repoRoot: string, config: HarnessConfig): string | undefined {
  return config.pushEnvPath === undefined ? undefined : join(repoRoot, config.pushEnvPath);
}

/** Everything {@link writeNotifications} needs. */
export interface NotificationsOptions {
  /** The resolved repository root — for naming the repository-side file the machine-local one wins over. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
  /** Whether the opt-in was taken: the flag, a terminal's answer, or the default `false`. */
  readonly enabled: boolean;
  /** The endpoint to post to, when one was given. Absent is the guided-setup path, never a placeholder. */
  readonly pushUrl?: string;
}

/** What the generator produced, for `init`'s summary. */
export interface NotificationsResult {
  /** True only when the settings file was enqueued — i.e. the opt-in was taken *and* a URL was given. */
  readonly written: boolean;
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
  /** Lines needing attention, for the reporter's `warn`. */
  readonly warnings: readonly string[];
}

/**
 * The file's text: a header saying what it is and where its semantics are documented, then the two
 * keys.
 *
 * It deliberately does **not** reuse `cli/templates/claude/push-notify.env.example`, whose header
 * instructs the reader to copy it to the repository's `pushEnvPath` — the opposite of what this
 * copy is. Nor does it restate what either key does: that is `autonomous-notify.sh`'s header, which
 * is the one implementation of the delivery arms, and a second account of it here would be the copy
 * that goes stale.
 */
function pushEnvContent(url: string): string {
  return [
    '# Push notifications for unattended runs — machine-local, written by',
    '# `npx autonomous-sdlc-harness init --notifications`.',
    '#',
    '# This is the machine-local half of the pair `docs/watcher.md` §6 describes: it is read before',
    "# any repository's configured `pushEnvPath`, and while it exists that one is not read at all.",
    '# What each key means, what the two delivery arms do with it, and how a value already in the',
    "# environment interacts with this file are `autonomous-notify.sh`'s header and that section;",
    '# none of it is restated here.',
    '#',
    '# It holds a credential: it is created 0600 inside a 0700 directory, it is outside every',
    '# repository so it cannot be committed by accident, and no command in this CLI prints a value',
    '# from it back. Edit it freely — `init` creates it once and a later run leaves it as you left it.',
    '',
    `${PUSH_URL_KEY}=${url}`,
    `${PUSH_CMD_KEY}=`,
    '',
  ].join('\n');
}

/**
 * Enqueue the machine-local settings file, or explain why nothing was written.
 *
 * Three outcomes, and the middle one is the one to read first:
 *
 * - **opt-in not taken** — nothing is enqueued and a note records that delivery stays opt-in and
 *   defaults to nothing pushed, which is what every release before this one did;
 * - **opt-in taken with no endpoint** — nothing is enqueued, and the note carries the guided setup:
 *   the path, the two key names and a worked example. Writing an empty file here would shadow a
 *   repository-side file that already has values (choice 1 in the module header);
 * - **opt-in taken with an endpoint** — the directory at `0700` and the file at `0600`, both
 *   `allowOutsideRepo`, the file `create-if-absent` so a re-run leaves an edited one alone.
 */
export function writeNotifications({
  repoRoot,
  config,
  plan,
  enabled,
  pushUrl,
}: NotificationsOptions): NotificationsResult {
  const notes: string[] = [];
  const warnings: string[] = [];
  const target = machinePushEnvPath();
  const repository = repositoryPushEnvPath(repoRoot, config);
  // How the notes below name the repository-side half: its path when the config configures one, and
  // what its absence means when it does not. Interpolating the value straight would print
  // `undefined` in the middle of the sentence explaining where these settings live — and the two
  // shapes differ by more than a path, because with the key unset there is nothing to fill in and
  // the remedy is to configure it first.
  const repositoryName = repository ?? 'any repository-side file (this repository configures none — `pushEnvPath` is unset)';
  const repositoryRemedy =
    repository === undefined
      ? `set \`pushEnvPath\` in ${CONFIG_FILENAME} and fill the file it names`
      : `fill ${repository} in this repository`;

  if (!enabled) {
    if (pushUrl !== undefined) {
      warnings.push(
        '--push-url was given without --notifications, so it was not written anywhere: the endpoint is only ever written into the machine-local push-notification settings file, and that file is written only when the opt-in is taken — re-run with --notifications to take it and set the endpoint in the same run',
      );
    }
    notes.push(
      `no push-notification settings were written and none were changed: delivery is opt-in and defaults to nothing pushed, so an unattended run's completed, parked and failed events reach a desktop banner where one is available and nothing else. Re-run with --notifications --push-url <url> to write ${target}, or ${repositoryRemedy} — the machine-local file is read first and the repository one only when it is absent (docs/watcher.md §6)`,
    );
    return { written: false, notes, warnings };
  }

  if (pushUrl === undefined) {
    notes.push(
      `push notifications were asked for and no endpoint was given, so nothing was written — deliberately: the machine-local file is read before ${repositoryName} and while it exists that one is not read at all, so an empty ${target} would shadow values you may already have there and turn this opt-in into a silent opt-out. Re-run with --push-url <url>, naming any endpoint that accepts a POST (${GUIDED_ENDPOINT_EXAMPLE} is the worked example: choose a topic name nobody would guess, subscribe to it in an ntfy client, and that URL is the endpoint), or write ${target} yourself with ${PUSH_URL_KEY} set and ${PUSH_CMD_KEY} empty`,
    );
    return { written: false, notes, warnings };
  }

  plan.add({
    path: machineConfigDir(),
    policy: 'ensure-dir',
    label: 'machine-local harness configuration directory',
    mode: MACHINE_DIR_MODE,
    allowOutsideRepo: true,
  });
  plan.add({
    path: target,
    policy: 'create-if-absent',
    content: pushEnvContent(pushUrl),
    label: 'machine-local push-notification settings',
    mode: PUSH_ENV_MODE,
    allowOutsideRepo: true,
  });

  notes.push(
    `${target} is the machine-local push-notification settings file, written to hold ${PUSH_URL_KEY} and an empty ${PUSH_CMD_KEY} — the endpoint itself is deliberately not printed here or anywhere else. It is machine-local rather than committed, and it is read before ${repositoryName}, which is then not read at all. It is create-if-absent: a file already there is kept exactly as you edited it and still carries the endpoint it was written with, so --push-url on a re-run sets nothing — to point it elsewhere, edit ${PUSH_URL_KEY} in it by hand, or re-run with --force, which copies it to a .bak sibling and re-writes it from this run's --push-url`,
  );
  return { written: true, notes, warnings };
}
