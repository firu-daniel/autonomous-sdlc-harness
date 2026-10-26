/**
 * What a host needs to hold a sleep assertion for a run: the assertion's `--who` and `--what`, the
 * `caffeinate` argv, the polkit actions a logind lock is granted under — and the pure assessment of
 * a host's facts against them, with the one-line sentence `doctor` prints.
 *
 * **The rule this module exists to enforce: what a host needs to hold a sleep assertion for a run
 * is declared once, here, and the run library's copies are declared mirrors held equal by a test.**
 *
 * This module reads nothing and spawns nothing: every host fact reaches {@link assessKeepAwake} as
 * an argument, gathered by `cli/src/doctor/checks.ts`. Its WSL detection is
 * `cli/src/doctor/sandboxPrerequisites.ts` → {@link sandboxHostKind}, never a second one.
 *
 * **DECLARED MIRRORS** — a rename on either side is an edit to both.
 *
 * - `cli/templates/scripts/lib/harness-run-lib.sh` → `HR_KEEP_AWAKE_WHO`, `HR_KEEP_AWAKE_WHAT` and
 *   the `caffeinate -s -i -w "$pid"` argv mirror {@link KEEP_AWAKE_WHO}, {@link KEEP_AWAKE_WHAT}
 *   and {@link CAFFEINATE_ARGS}. Held equal by `cli/test/keep-awake.test.mjs`.
 *
 * **AC power only, on both platforms.** `caffeinate -s` holds its system-sleep assertion on AC
 * power only (`man caffeinate`); a logind lock holds on battery too, so the run library checks mains
 * power before taking one. A laptop on battery still sleeps on a closed lid, and the run resumes on
 * wake.
 *
 * **Both logind lock kinds.** A plain `sleep` lock does not stop a lid close where
 * `LidSwitchIgnoreInhibited=yes` (`man logind.conf`); `handle-lid-switch` is the lock that covers
 * it, so {@link KEEP_AWAKE_WHAT} names both and {@link LOGIND_POLKIT_ACTIONS} grants both.
 *
 * **WSL2 cannot hold.** The WSL VM freezes when Windows sleeps, and the lid follows the Windows
 * power plan, so nothing inside the VM can keep the host awake.
 */

import { sandboxHostKind, type SandboxHostKind } from './sandboxPrerequisites.js';

/** The `--who` a logind lock is taken under. */
export const KEEP_AWAKE_WHO = 'autonomous-sdlc-harness';

/** The `--what` a logind lock is taken for. */
export const KEEP_AWAKE_WHAT = 'sleep:handle-lid-switch';

/** The `caffeinate` flags before the engine's pid. */
export const CAFFEINATE_ARGS: readonly string[] = ['-s', '-i', '-w'];

/** The polkit actions a lingering user service with no session needs granted to take the lock. */
export const LOGIND_POLKIT_ACTIONS: readonly string[] = [
  'org.freedesktop.login1.inhibit-block-sleep',
  'org.freedesktop.login1.inhibit-handle-lid-switch',
];

/** Where a lock probe ran: in the watcher service's user manager, or from the shell running `doctor`. */
export type KeepAwakeLockContext = 'user-manager' | 'this-shell';

/** The outcome of one attempt to take the logind lock. */
export interface KeepAwakeLockProbe {
  readonly taken: boolean;
  readonly context: KeepAwakeLockContext;
  readonly detail: string;
}

/** The host facts `cli/src/doctor/checks.ts` gathers and hands to {@link assessKeepAwake}. */
export interface KeepAwakeHostFacts {
  platform: string;
  kernelRelease: string;
  /** `keepAwakeEnabled(config)`; `true` when there is no config. */
  enabled: boolean;
  /** `GITHUB_ACTIONS === 'true'`, or `doctor --remote-job`. */
  githubActions: boolean;
  /** Where `caffeinate` resolved; absent when it did not. */
  caffeinatePath?: string;
  /** Where `systemd-inhibit` resolved; absent when it did not. */
  systemdInhibitPath?: string;
  /** Present exactly when {@link needsLockProbe} said so and the probe ran. */
  lock?: KeepAwakeLockProbe;
}

/** Whether a run on this host holds it awake. */
export type KeepAwakeAnswer = 'off' | 'not-applicable' | 'can-hold' | 'cannot-hold';

/** A host's answer, its class, and the one-line sentence `doctor` prints, remedy included. */
export interface KeepAwakeAssessment {
  readonly answer: KeepAwakeAnswer;
  readonly host: SandboxHostKind;
  readonly sentence: string;
}

const LOCK_CONTEXT_PHRASE: Readonly<Record<KeepAwakeLockContext, string>> = {
  'user-manager': "in the user manager the watcher's service runs under",
  'this-shell': "from this shell, not the watcher's service — the watcher's launch line is the authority there",
};

/** Whether the logind lock must be probed: a held, non-runner Linux host with `systemd-inhibit`. */
export function needsLockProbe(facts: KeepAwakeHostFacts): boolean {
  return (
    facts.enabled &&
    !facts.githubActions &&
    sandboxHostKind(facts.platform, facts.kernelRelease) === 'linux' &&
    facts.systemdInhibitPath !== undefined
  );
}

/** Assesses a host's facts, first match wins; pure, so every arm is testable without a host. */
export function assessKeepAwake(facts: KeepAwakeHostFacts): KeepAwakeAssessment {
  const host = sandboxHostKind(facts.platform, facts.kernelRelease);
  const result = (answer: KeepAwakeAnswer, sentence: string): KeepAwakeAssessment => ({ answer, host, sentence });

  if (!facts.enabled) {
    return result(
      'off',
      'off: `execution.keepAwake` is false, so a run holds nothing and a closed lid or idle sleep suspends it until wake.',
    );
  }
  if (facts.githubActions) {
    return result('not-applicable', 'A GitHub Actions runner does not sleep, and job mode holds nothing.');
  }
  switch (host) {
    case 'macos':
      if (facts.caffeinatePath !== undefined) {
        return result(
          'can-hold',
          `\`caffeinate\` resolves at \`${facts.caffeinatePath}\`: a run holds \`PreventSystemSleep\` for its engine's life with \`caffeinate ${CAFFEINATE_ARGS.join(' ')}\` on AC power only — on battery a closed lid still sleeps the Mac and the run resumes on wake; \`execution.keepAwake: false\` turns the hold off.`,
        );
      }
      return result(
        'cannot-hold',
        '`caffeinate` is not on `PATH`, so a run holds nothing — it ships with macOS at `/usr/bin/caffeinate`; put `/usr/bin` on the `PATH` the daemon runs with.',
      );
    case 'linux':
      if (facts.systemdInhibitPath === undefined) {
        return result(
          'cannot-hold',
          '`systemd-inhibit` (systemd) is not on `PATH`, so a run holds nothing; the run still launches, unheld.',
        );
      }
      if (facts.lock?.taken === true) {
        return result(
          'can-hold',
          `The logind \`${KEEP_AWAKE_WHAT}\` lock was taken ${LOCK_CONTEXT_PHRASE[facts.lock.context]}; a run takes it only on mains power.`,
        );
      }
      return result(
        'cannot-hold',
        `The logind \`${KEEP_AWAKE_WHAT}\` lock was not taken (${facts.lock?.detail ?? 'no probe ran'}) — logind refused or did not answer; polkit allows the lock to an active local session, and a lingering user service with no session needs a polkit rule granting ${LOGIND_POLKIT_ACTIONS.map((action) => `\`${action}\``).join(' and ')} to this user. A run still launches, unheld, and logs one line.`,
      );
    case 'wsl2':
      return result(
        'cannot-hold',
        'Inside WSL2 nothing can keep Windows awake — set the Windows power plan\'s "When I close the lid" action to "Do nothing" for "Plugged in"; the Windows setup is the branch `feat_wsl2_support`\'s (#160).',
      );
    case 'wsl1':
    case 'unsupported':
      return result('cannot-hold', `No sleep hold on this platform (\`${facts.platform}\`); a run launches unheld.`);
  }
}
