/**
 * What the unattended run's sandbox needs from a host: the platform table, the binaries and the
 * packages that carry them, the install commands, the AppArmor rule, the WSL1 detection and the
 * order missing pieces are reported in — and the pure assessment of a host's facts against them.
 *
 * **The rule this module exists to enforce: the sandbox's host prerequisites are declared once,
 * here, and every other copy is a declared mirror held equal by a test.**
 *
 * This module reads nothing: every host fact reaches {@link assessSandboxHost} as an argument. The
 * live probe that gathers them is `cli/src/doctor/checks.ts` → `probeSandboxHost`, which imports
 * this module; this module never imports it.
 *
 * **DECLARED MIRRORS** — a rename on either side is an edit to both.
 *
 * - `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_prereq_judge_var` mirrors
 *   {@link sandboxHostKind}, {@link SANDBOX_HOST_BINARIES} and the missing-piece order, and codes
 *   {@link SANDBOX_INSTALLERS} (each family's command, as {@link installCommands} renders it) and
 *   {@link WSL1_AGENT_MESSAGE} into its `HR_SANDBOX_REFUSAL` sentence. Held equal by
 *   `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`. That library's
 *   `hr_sandbox_prereq_probe_var` is not a mirror of this module: it mirrors the live probe, and
 *   `probeSandboxHost`'s doc comment in `cli/src/doctor/checks.ts` declares it.
 * - `cli/templates/github/workflows/harness-run.yml`, step `Install the sandbox prerequisites`,
 *   mirrors {@link SANDBOX_INSTALLERS}' installer families in this order (`apt-get`, then `dnf`; the
 *   step's `-y -qq` and `sudo -n` flags legitimately differ from the adopter-facing commands here),
 *   {@link SANDBOX_HOST_BINARIES}' packages, {@link APPARMOR_USERNS_SYSCTL_PATH},
 *   {@link BWRAP_APPARMOR_PROFILE_PATH}, {@link bwrapAppArmorProfile} and
 *   {@link APPARMOR_RELOAD_COMMAND}. Held equal by `cli/test/workflow-sandbox-install.test.mjs`.
 *
 * **The AppArmor choice.** An AppArmor profile may sit under any filename, so the absence of
 * `/etc/apparmor.d/bwrap` is not proof that `userns` is blocked: a restricting sysctl of `1` without
 * that profile is `uncertain`, never a missing piece. Source: https://code.claude.com/docs/en/sandboxing,
 * "Set up Linux and WSL2" and its "Ubuntu 24.04 and later" accordion, checked 2026-10-12.
 */

/** One missing prerequisite, as an id the shell mirror reports in the same order. */
export type SandboxPiece = 'bwrap' | 'socat' | 'wsl1' | 'unsupported-platform';

/** The pieces that are binaries on `PATH`. */
export type SandboxBinaryName = Extract<SandboxPiece, 'bwrap' | 'socat'>;

/** One binary the sandbox needs on `PATH`, the package that installs it, and what it is for. */
export interface SandboxBinary {
  readonly binary: SandboxBinaryName;
  readonly package: string;
  readonly purpose: string;
}

/** One package manager family and the adopter-facing command that installs packages with it. */
export interface SandboxInstaller {
  readonly family: string;
  readonly command: string;
}

/** The binaries a Linux or WSL2 host must resolve, in the order a missing one is reported. */
export const SANDBOX_HOST_BINARIES: readonly SandboxBinary[] = [
  { binary: 'bwrap', package: 'bubblewrap', purpose: 'filesystem isolation' },
  { binary: 'socat', package: 'socat', purpose: 'relays network traffic to the sandbox proxy' },
];

/** The installer families an install command is rendered for, in the order they are offered. */
export const SANDBOX_INSTALLERS: readonly SandboxInstaller[] = [
  { family: 'Ubuntu/Debian', command: 'sudo apt-get install' },
  { family: 'Fedora', command: 'sudo dnf install' },
];

/** The sysctl that, at `1`, denies unprivileged user namespaces to any binary without a profile. */
export const APPARMOR_USERNS_SYSCTL = 'kernel.apparmor_restrict_unprivileged_userns';

/** Where {@link APPARMOR_USERNS_SYSCTL} is read on a running host. */
export const APPARMOR_USERNS_SYSCTL_PATH = '/proc/sys/kernel/apparmor_restrict_unprivileged_userns';

/** The profile path the documented setup writes; a profile elsewhere is legal, hence `uncertain`. */
export const BWRAP_APPARMOR_PROFILE_PATH = '/etc/apparmor.d/bwrap';

/** The `bwrap` path the documented profile attaches to. */
export const BWRAP_INSTALLED_PATH = '/usr/bin/bwrap';

/** The command that loads a newly written AppArmor profile. */
export const APPARMOR_RELOAD_COMMAND = 'sudo systemctl reload apparmor';

/** The agent CLI's own refusal text on a WSL1 host, quoted so an operator can match it. */
export const WSL1_AGENT_MESSAGE = 'Sandboxing requires WSL2';

/** The host classes the sandbox distinguishes. */
export type SandboxHostKind = 'macos' | 'linux' | 'wsl2' | 'wsl1' | 'unsupported';

/** Whether AppArmor lets `bwrap` create user namespaces; `uncertain` never makes a piece missing. */
export type AppArmorAnswer = 'not-applicable' | 'clear' | 'allowed' | 'uncertain';

/** The outcome of reading one host file, distinguishing absent from unreadable. */
export type FileRead = { state: 'absent' } | { state: 'unreadable' } | { state: 'read'; text: string };

/** The host facts the live probe gathers and hands to {@link assessSandboxHost}. */
export interface SandboxHostFacts {
  platform: string;
  kernelRelease: string;
  resolvedBinaries: ReadonlySet<string>;
  appArmorRestrict: FileRead;
  bwrapProfile: FileRead;
}

/** A host's assessment: its class, the missing pieces in report order, and the AppArmor answer. */
export interface SandboxPrerequisites {
  host: SandboxHostKind;
  missing: readonly SandboxPiece[];
  appArmor: AppArmorAnswer;
}

/** The AppArmor profile granting `userns` to {@link BWRAP_INSTALLED_PATH}, with a trailing newline. */
export function bwrapAppArmorProfile(): string {
  return [
    'abi <abi/4.0>,',
    'include <tunables/global>',
    '',
    `profile bwrap ${BWRAP_INSTALLED_PATH} flags=(unconfined) {`,
    '  userns,',
    '',
    '  include if exists <local/bwrap>',
    '}',
    '',
  ].join('\n');
}

/** Classifies a host from the platform name and kernel release the caller read. */
export function sandboxHostKind(platform: string, kernelRelease: string): SandboxHostKind {
  if (platform === 'darwin') return 'macos';
  if (platform !== 'linux') return 'unsupported';
  if (!/microsoft/i.test(kernelRelease)) return 'linux';
  return /microsoft-standard|wsl2/i.test(kernelRelease) ? 'wsl2' : 'wsl1';
}

function judgeAppArmor(restrict: FileRead, profile: FileRead): AppArmorAnswer {
  if (restrict.state === 'absent') return 'clear';
  if (restrict.state !== 'read') return 'uncertain';
  const value = restrict.text.trim();
  if (value === '0') return 'clear';
  if (value !== '1') return 'uncertain';
  if (
    profile.state === 'read' &&
    /^\s*userns\s*,/m.test(profile.text) &&
    profile.text.includes(BWRAP_INSTALLED_PATH)
  ) {
    return 'allowed';
  }
  return 'uncertain';
}

/** Assesses a host's facts against the table; pure, so every row is testable without a host. */
export function assessSandboxHost(facts: SandboxHostFacts): SandboxPrerequisites {
  const host = sandboxHostKind(facts.platform, facts.kernelRelease);
  if (host === 'unsupported') return { host, missing: ['unsupported-platform'], appArmor: 'not-applicable' };
  if (host === 'wsl1') return { host, missing: ['wsl1'], appArmor: 'not-applicable' };
  if (host === 'macos') return { host, missing: [], appArmor: 'not-applicable' };
  const missing = SANDBOX_HOST_BINARIES.filter((entry) => !facts.resolvedBinaries.has(entry.binary)).map(
    (entry) => entry.binary,
  );
  return { host, missing, appArmor: judgeAppArmor(facts.appArmorRestrict, facts.bwrapProfile) };
}

function missingBinaries(missing: readonly SandboxPiece[]): readonly SandboxBinary[] {
  return SANDBOX_HOST_BINARIES.filter((entry) => missing.includes(entry.binary));
}

/** One install command per {@link SANDBOX_INSTALLERS} family for the missing binaries; `[]` if none. */
export function installCommands(missing: readonly SandboxPiece[]): string[] {
  const packages = missingBinaries(missing).map((entry) => entry.package);
  if (packages.length === 0) return [];
  return SANDBOX_INSTALLERS.map((installer) => `${installer.command} ${packages.join(' ')}`);
}

/** The one-line sentences naming each missing piece and its fix; never offers the opt-out. */
export function describeMissingPieces(
  missing: readonly SandboxPiece[],
  kernelRelease: string,
  platform: string,
): string[] {
  const sentences: string[] = [];
  const binaries = missingBinaries(missing);
  if (binaries.length > 0) {
    const named = binaries
      .map((entry) => `\`${entry.binary}\` (package \`${entry.package}\`, ${entry.purpose})`)
      .join(' and ');
    const commands = installCommands(missing);
    const installs = SANDBOX_INSTALLERS.map((installer, index) => `${installer.family}: \`${commands[index]}\``).join(
      '; ',
    );
    sentences.push(`The sandbox needs ${named} on PATH — install with ${installs}.`);
  }
  if (missing.includes('wsl1')) {
    sentences.push(
      `This is a WSL1 host (kernel release \`${kernelRelease}\`), where the agent CLI refuses with "${WSL1_AGENT_MESSAGE}" — run the harness under WSL2.`,
    );
  }
  if (missing.includes('unsupported-platform')) {
    sentences.push(`The sandbox does not run on platform \`${platform}\` — it runs on macOS, Linux and WSL2.`);
  }
  return sentences;
}

/** The one-line sentence for an AppArmor answer; never offers the opt-out. */
export function describeAppArmor(answer: AppArmorAnswer): string {
  switch (answer) {
    case 'not-applicable':
      return 'AppArmor does not govern the sandbox on this host.';
    case 'clear':
      return `\`${APPARMOR_USERNS_SYSCTL}\` does not restrict unprivileged user namespaces.`;
    case 'allowed':
      return `\`${APPARMOR_USERNS_SYSCTL}\` is 1 and \`${BWRAP_APPARMOR_PROFILE_PATH}\` grants \`userns\` to \`${BWRAP_INSTALLED_PATH}\`.`;
    case 'uncertain':
      return `\`${APPARMOR_USERNS_SYSCTL}\` could not be read as 0 or 1, or is 1 and no \`${BWRAP_APPARMOR_PROFILE_PATH}\` granting \`userns\` was read — a profile may sit under any filename, so whether \`bwrap\` is blocked cannot be certain; if it is, write that profile and run \`${APPARMOR_RELOAD_COMMAND}\`.`;
  }
}
