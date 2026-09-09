/**
 * Render the run daemon's unit file for the detected backend, and say where it is installed.
 *
 * **The rule this module exists to enforce: the unit's identifier, its install path and its text are
 * produced together, from one call.** A caller that composed a label itself and read the target path
 * from somewhere else would eventually install a file at one name and address the service by
 * another — a daemon that cannot be stopped by the command that installed it, which is the worst
 * shape of this failure because it survives a reinstall.
 *
 * ## Five non-obvious choices, and where each comes from
 *
 * 1. **The identity is per repository, not per project name.** The launchd label is
 *    `com.autonomous-sdlc-harness.watcher.<slug>` and the systemd unit name
 *    `harness-watcher@<slug>.service`, where `<slug>` is {@link repoSlug} of the repository the
 *    daemon was installed from. Two repositories on one machine therefore install daemons that
 *    cannot collide — which two checkouts sharing a `projectName` would have, under a label built
 *    from that name. `docs/config.md` §4's `<launchd_label>` row is the register entry and
 *    `docs/cli.md` §9 states the per-repository consequence; this module is where the form is
 *    implemented, so nothing else in the CLI spells it out.
 * 2. **The install directory comes from the detection result, not from a second table here.**
 *    `DaemonBackend.unitPath` is the backend's user-unit directory; this module contributes only
 *    the file *name*, which is the half that depends on the repository.
 * 3. **Values are checked before they are substituted, and escaped for the format they land in.** A
 *    plist is XML, so a `&` or a `<` in a checkout path would produce a unit no `launchctl` will
 *    parse. A systemd unit is neither: `%` introduces a specifier in every directive rendered into
 *    here, and `ExecStart=` splits its command line at whitespace, so an unescaped checkout path
 *    holding a space runs `/bin/bash` on the first word of it — installed, started, failed and,
 *    under `Restart=always`, restarted forever. Both are escaped, per format and per directive; see
 *    {@link escapeSystemdValue} and {@link escapeSystemdArgument}. A newline is refused instead — it
 *    is not something to render carefully, it is something to report.
 * 4. **On systemd a *concrete* `harness-watcher@<slug>.service` file is written, not a template
 *    unit plus an instance.** The `@` is what an operator reads as "one watcher per repository",
 *    and it costs nothing to spell it that way: systemd resolves an instance name to a literal
 *    file of that exact name *before* it falls back to the `harness-watcher@.service` template, so
 *    the file installed here is the one `systemctl --user` acts on. A real template unit would have
 *    to reach the repository path through `%i`, i.e. carry the checkout path in the instance name,
 *    escaped into it. This design renders that path into `ExecStart` and `WorkingDirectory`
 *    instead, quoted and specifier-escaped by choice 3, so a checkout holding a space or a `%` is
 *    one the operator never has to encode by hand.
 * 5. **The unit renders a `PATH`, captured from the shell that ran `daemon install`.** A user agent
 *    or user unit inherits the *service manager's* environment, not a login shell's: on macOS that
 *    is `/usr/bin:/bin:/usr/sbin:/sbin`, where neither a Homebrew package manager nor an agent CLI
 *    under `~/.local/bin` resolves — the watcher launches both by name, so a unit without the key
 *    fails at the first configured command and, with the failure repaired one binary at a time,
 *    at the next. Three answers were weighed. Capturing the installing shell's `PATH` — this one —
 *    needs no dependency (this package declares none, and that is a property worth keeping), is
 *    deterministic Node with nothing to detect, and is exactly the hand edit that unblocked the
 *    first unattended run. Pinning the individual binaries cannot work: the toolchain is the
 *    adopter's `commands.*` configuration, which this CLI does not interpret. Sourcing the login
 *    shell's profile from the watcher would run arbitrary shell configuration inside the daemon's
 *    own process, on every dispatch. Its one weakness is that a captured value goes stale when the
 *    toolchain moves; that is a `doctor` question — grading the *installed unit's* `PATH` against
 *    the binaries the outer loop runs — rather than one the renderer can answer, and the remedy is
 *    `daemon install --force`. An absent or empty `PATH` renders **no** key: `PATH=""` overrides
 *    the service manager's own directories with nothing, which is strictly worse than the default
 *    the caller then warns about. The value it does render is escaped for a **quoted** destination
 *    on systemd — `Environment="PATH=…"` is quoted because an entry may hold a space, which makes a
 *    `"` or a `\` in one the hazard choice 3's `ExecStart` escaping exists for.
 *
 * ## Scope
 *
 * This module renders and computes; it writes nothing. Installing the rendered text, reloading the
 * service manager and starting or stopping the daemon are the `daemon` subcommand's, and keeping
 * them apart is what lets the rendering be tested without a service manager present.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULTS, type HarnessConfig } from '../config/model.js';
import { EXIT, HarnessError } from '../core/errors.js';
import { defaultProjectName, packageScriptsDir } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import { renderTemplate } from '../core/templating.js';
import type { DaemonBackend } from './backend.js';

/** The unit templates' subdirectory inside this package's `scripts/` directory. */
const TEMPLATE_DIR = 'daemon';

/** One template per installable backend. `none` has no row, because it has no unit. */
const UNIT_TEMPLATES = {
  launchd: 'launchd.plist.template',
  systemd: 'systemd.service.template',
} as const;

/** Reverse-DNS prefix of the launchd label; {@link repoSlug} completes it. */
const LAUNCHD_LABEL_PREFIX = 'com.autonomous-sdlc-harness.watcher';

/** The systemd unit name, either side of {@link repoSlug}. */
const SYSTEMD_UNIT_PREFIX = 'harness-watcher@';
const SYSTEMD_UNIT_SUFFIX = '.service';

/** The longest a slug may be. Applied last, keeping the tail — see {@link repoSlug}. */
const SLUG_MAX_LENGTH = 64;

/**
 * What a derived slug may be: non-empty, and lowercase letters, digits and `-` only.
 *
 * This is the check `projectName` used to carry, moved to the value that now names the service. It
 * refuses a *derivation* rather than a configuration — {@link repoSlug} is total over any string,
 * so nothing an adopter can write reaches it — which is why failing it exits {@link EXIT.INTERNAL}.
 */
const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Everything {@link renderUnit} needs. */
export interface RenderUnitOptions {
  /** The detection result from `daemon/backend.ts`. `kind: 'none'` is refused, not rendered. */
  readonly backend: DaemonBackend;
  /** The adopting repository's configuration, read for `projectName` and `stateDir`. */
  readonly config: HarnessConfig;
  /** The resolved repository root the watcher runs in. */
  readonly repoRoot: string;
  /** Absolute path of the watcher script, from `resolveWatcherPath`. */
  readonly watcherPath: string;
  /**
   * The `PATH` the unit gives the daemon — `process.env.PATH` of the shell running `daemon install`.
   *
   * Required rather than optional, so a second call site cannot omit it and install a unit that
   * silently differs from the one `install` writes. `undefined` and empty are the same answer and
   * render no environment key at all; see this module's choice 5, and {@link RenderedUnit.envPath}
   * for what the caller reports.
   */
  readonly envPath: string | undefined;
}

/** A rendered unit, and the two things a caller needs to install and then address it. */
export interface RenderedUnit {
  /** The unit file's full text, ready to write. */
  readonly text: string;
  /** Absolute path the unit is installed at, inside the backend's user-unit directory. */
  readonly targetPath: string;
  /**
   * The identifier the backend addresses this service by: the launchd label
   * `com.autonomous-sdlc-harness.watcher.<slug>`, or the systemd unit name
   * `harness-watcher@<slug>.service` — the strings `launchctl` and `systemctl --user` respectively
   * take, with `<slug>` from {@link repoSlug}.
   */
  readonly label: string;
  /**
   * The descriptive name this unit's text carries — {@link descriptiveProjectName}'s answer.
   *
   * Returned rather than left inside the render because the repository registry records the name
   * *the unit file says*, and a caller composing `config.projectName` with its own fallback would be
   * a second derivation of it: the two would then disagree for exactly the configurations the
   * fallback exists for. Nothing keys off it — see this module's choice 1 — so it is descriptive
   * here for the same reason it is descriptive there.
   */
  readonly projectName: string;
  /**
   * The `PATH` this unit's text actually carries, or `undefined` when it carries no environment key.
   *
   * Reported rather than re-derived by the caller from the value it passed in, for this module's
   * founding rule: the text and everything said about it come from one call. `install` warns on
   * `undefined`, naming the hand edit, because a daemon on the service manager's default
   * directories is the failure this key exists to prevent.
   */
  readonly envPath: string | undefined;
}

/**
 * The repository's machine-unique identifier: its own absolute path, lowercased, with every
 * character outside `[a-z0-9]` replaced by `-`, runs collapsed, leading and trailing `-` stripped,
 * and the result cut to {@link SLUG_MAX_LENGTH} characters **keeping the tail** — the tail is the
 * distinguishing part, since two checkouts on one machine usually share a long prefix.
 *
 * **This function has a twin, and a test that keeps them equal.** The generated
 * `<scriptsDir>/lib/harness-run-lib.sh` defines `hr_repo_slug` doing the same transformation for
 * the watcher, the notifier and the machine-level usage lane, so the daemon a repository installs
 * and the run artifacts that repository writes are keyed alike. `test/daemon.test.mjs` runs both
 * halves over one path and compares — the only thing stopping them drifting. **Change one, change
 * the other in the same commit**, and keep these three properties, each of which the shell half
 * also has:
 *
 * - **Truncation is last**, so a truncated slug may *begin* with `-`. Reordering it to strip after
 *   cutting would be tidier and would silently disagree with the shell.
 * - **Letters and digits are ASCII-only**, on both sides: the shell half runs under `LC_ALL=C` so
 *   that its `[!a-z0-9]` cannot admit `é` through a locale's collation, and the fold here is
 *   `[A-Z]` rather than `toLowerCase()` for the mirror-image reason — a locale-aware fold turns `İ`
 *   into an ASCII `i` where the shell yields a `-`. An accented letter is a separator, never a
 *   letter it resembles.
 * - **No hash, no truncating digest.** Both halves have to be one readable transformation an
 *   operator can reproduce by eye from the path they are looking at.
 *
 * The argument is the repository the daemon is being installed for — `daemon install` resolves it
 * from its own working directory. The shell half additionally resolves the *main* checkout first,
 * so every worktree of one repository answers the same slug; nothing here needs that step, because
 * the unit's `WorkingDirectory` is this same root and a unit installed from a checkout is a unit
 * for that checkout.
 *
 * Not to be confused with `parseRepoSlug` in `core/paths.ts`, which is `<owner>/<repository>` off a
 * git remote URL and has nothing to do with a service identifier.
 */
export function repoSlug(repoRoot: string): string {
  const slug = repoRoot
    .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-SLUG_MAX_LENGTH);

  if (!SLUG_PATTERN.test(slug)) {
    throw new HarnessError(
      `the daemon identifier derived from ${JSON.stringify(repoRoot)} is ${JSON.stringify(slug)}, which cannot name a service: the derivation admits only lowercase letters, digits and '-' and must produce at least one character, so this is a fault in this CLI rather than in the repository`,
      EXIT.INTERNAL,
    );
  }
  return slug;
}

/**
 * The project name the unit files *describe* themselves with: the configured `projectName`, or the
 * repository directory name the schema says `init` defaults it to.
 *
 * Descriptive only, since decision 21 — it reaches a plist comment, through {@link commentSafe} for
 * what that destination forbids, and a systemd `Description=`, and no longer the label or the file
 * name. That is why it carries no pattern check any more: the check that used to live here is
 * {@link SLUG_PATTERN}, on the value that names the service.
 * `assertSingleLine` and the XML escaping still apply to it, as they do to every substituted value.
 */
function descriptiveProjectName(config: HarnessConfig, repoRoot: string): string {
  const configured = config.projectName?.trim();
  return configured !== undefined && configured !== '' ? configured : defaultProjectName(repoRoot);
}

/** XML text-node escaping, for the values substituted into the plist's `<string>` elements. */
function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Separate adjacent hyphens in a value whose plist destination is a **comment**, where XML 1.0 §2.5
 * forbids `--` and {@link escapeXml} — which touches only `&`, `<` and `>` — leaves one standing.
 *
 * The guarantee is the property, not one substitution: no two hyphens survive adjacent, for a run of
 * **any** length, since every hyphen followed by another takes a trailing space (`notes--app` →
 * `notes- -app`, `notes---app` → `notes- - -app`).
 *
 * `projectName` is the plist's only comment-destined substitution; `label` appears in that block too
 * but cannot carry an adjacent pair, because {@link repoSlug} collapses runs of `-`. The rewrite
 * reaches descriptive comment text and never a value the service manager reads, which is why
 * mangling it is acceptable where refusing a legal `projectName` would not be. The systemd arm is
 * untouched: `Description=` is a directive, not a comment.
 */
function commentSafe(value: string): string {
  return value.replace(/-(?=-)/g, '- ');
}

/**
 * systemd escaping for a value that is a whole directive argument — `WorkingDirectory=`,
 * `Description=`, the `StandardOutput=append:` paths.
 *
 * Only `%` needs it: those directives take the rest of the line literally, but every one of them is
 * specifier-expanded first, so a checkout under `/home/ada/100%-mine` would resolve `%-` and the
 * service would run somewhere else. `%%` is systemd's own escape for a literal `%`.
 */
function escapeSystemdValue(value: string): string {
  return value.replace(/%/g, '%%');
}

/**
 * systemd escaping for a value substituted **inside quotes** — `ExecStart=`'s program path, and the
 * `PATH` inside `Environment="PATH=…"`, both of which the template quotes.
 *
 * `ExecStart=` splits at whitespace before anything runs and a `PATH` entry may hold a space, which
 * is why each is quoted rather than trusted; a `"` or a `\` in one would end or eat that quoting, so
 * both are backslash-escaped. Specifiers expand here too, so {@link escapeSystemdValue} still
 * applies.
 */
function escapeSystemdArgument(value: string): string {
  return escapeSystemdValue(value.replace(/[\\"]/g, (character) => `\\${character}`));
}

/** The one token whose systemd destination is a command-line argument rather than a whole value. */
const SYSTEMD_ARGUMENT_TOKENS = new Set(['watcherPath']);

/**
 * The `{{environment}}` stanza: the whole environment key for this backend, or nothing at all.
 *
 * The stanza is one token rather than a `{{envPath}}` inside a fixed key because the empty case has
 * to remove the *key*, not leave it holding `""` (choice 5), and `renderTemplate` substitutes values
 * and knows no conditional sections. `escaped` is the already-escaped value — {@link escapeXml} for
 * the plist and {@link escapeSystemdArgument} for the quoted systemd directive below, applied by
 * {@link renderUnit} — since this function's own output is markup that must not be escaped again.
 *
 * The trailing newline is what keeps both cases readable: each template puts `{{environment}}` on a
 * line of its own, so a rendered stanza is followed by a blank line and an omitted one leaves the
 * blank line that was already there.
 */
function environmentStanza(kind: 'launchd' | 'systemd', escaped: string | undefined): string {
  if (escaped === undefined) return '';
  return kind === 'launchd'
    ? `  <key>EnvironmentVariables</key>\n  <dict>\n    <key>PATH</key>\n    <string>${escaped}</string>\n  </dict>\n`
    : `Environment="PATH=${escaped}"\n`;
}

/** The plist's environment dictionary — {@link environmentStanza} renders it — and one named entry inside it. */
const PLIST_ENVIRONMENT = /<key>\s*EnvironmentVariables\s*<\/key>\s*<dict>([\s\S]*?)<\/dict>/;
const plistEntry = (key: string): RegExp => new RegExp(`<key>\\s*${key}\\s*</key>\\s*<string>([\\s\\S]*?)</string>`);

/**
 * The systemd form, quoted as the renderer writes it and bare as a hand edit may leave it.
 *
 * The quoted alternative admits `\"` and `\\`, because that is what {@link escapeSystemdArgument}
 * writes into it: a `[^"]*` value would stop at the first escaped quote and read back a truncated
 * `PATH`.
 */
const systemdDirective = (key: string): RegExp =>
  new RegExp(`^Environment=(?:"${key}=((?:[^"\\\\]|\\\\.)*)"|${key}=(.*))$`, 'gm');

/**
 * One environment value an installed unit gives the daemon, or `undefined` when the unit does not set
 * it — `PATH`, and the agent CLI variable beside it.
 *
 * The two shapes are {@link environmentStanza}'s, read back: a plist dictionary whose value is
 * XML-escaped, and a systemd `Environment=` line whose value is specifier-escaped and, inside the
 * quoting the renderer writes, backslash-escaped as well. Each is un-escaped by the inverse of the
 * escape that wrote it — and in that order — so a toolchain directory holding an `&`, a `%`, a `"` or
 * a `\` is compared as the path it is rather than as the markup it was stored as. A *bare* directive
 * is left as written, because nothing here escaped it: it can only be a hand edit.
 *
 * The key is interpolated into both patterns and is always one of the caller's own literals, so it
 * carries nothing a regular expression reads.
 *
 * The parse is deliberately tolerant of hand edits — the unit is the operator's file once it is
 * installed, and a key the renderer never writes (the agent CLI variable `doctor` reads) can only
 * arrive that way — which is why the systemd side takes the **last** matching directive: that is what
 * systemd itself does with a second one.
 *
 * Exported because two consumers read an installed unit back: `doctor`'s `daemon-path` check, and
 * `daemon install`'s comparison of the `PATH` it is about to write against the one on disk. It lives
 * beside the escaping it inverts so that a change to {@link environmentStanza} and a change to this
 * parse are one edit in one file — and so the round trip against {@link renderUnit}'s escaping, the
 * property the un-escaping claims and cannot show on its own, has both sides in one module.
 */
export function unitEnvValue(kind: 'launchd' | 'systemd', text: string, key: string): string | undefined {
  if (kind === 'launchd') {
    const dict = PLIST_ENVIRONMENT.exec(text)?.[1];
    if (dict === undefined) return undefined;
    const value = plistEntry(key).exec(dict)?.[1];
    return value === undefined ? undefined : value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }
  let last: { readonly raw: string; readonly quoted: boolean } | undefined;
  for (const match of text.matchAll(systemdDirective(key))) {
    last = match[1] !== undefined ? { raw: match[1], quoted: true } : { raw: match[2] ?? '', quoted: false };
  }
  if (last === undefined) return undefined;
  // The escape's steps, undone in reverse: `%%` first, then the backslashes the quoting needed.
  const withLiteralPercent = last.raw.replace(/%%/g, '%');
  return last.quoted ? withLiteralPercent.replace(/\\(["\\])/g, '$1') : withLiteralPercent;
}

/**
 * Refuse a value carrying a line break before it is substituted anywhere.
 *
 * A newline in a systemd unit's value ends the directive and starts another, and in a plist it
 * survives into a string the service manager then acts on. Both are ways for a path to become a
 * *setting*, so the check is applied to every value and to both backends rather than to the one
 * format where the consequence is easiest to demonstrate.
 */
function assertSingleLine(token: string, value: string): void {
  if (/[\r\n]/.test(value)) {
    throw new HarnessError(
      `the value for {{${token}}} contains a line break (${JSON.stringify(value)}), which would split the generated unit file into directives nobody wrote: move the checkout, or set the offending path in harness.config.json to one without a newline in it`,
    );
  }
}

/**
 * Read a unit template from this package's `scripts/daemon/` directory.
 *
 * It is read from `scripts/` rather than through `readTemplate` because these two files are not
 * adopter-facing generator templates: they are shipped assets of the daemon, which is why they sit
 * beside the watcher the daemon runs. A missing one is a packaging fault the adopter cannot act on,
 * so it exits {@link EXIT.INTERNAL} with the path named.
 */
function readUnitTemplate(file: string): string {
  const absolute = join(packageScriptsDir(), TEMPLATE_DIR, file);
  try {
    return readFileSync(absolute, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') {
      throw new HarnessError(`daemon unit template missing from the installed package: ${absolute}`, EXIT.INTERNAL);
    }
    throw error;
  }
}

/**
 * Render a unit template through {@link renderTemplate}.
 *
 * **`assertNoneSurvive` is on**: the values are a service label, three absolute paths and an
 * environment stanza built from a fourth, so one carrying `{{…}}` means a half-rendered unit
 * installed into a service manager — the failure this module's header calls the worst shape,
 * because it survives a reinstall.
 */
function render(file: string, values: Readonly<Record<string, string>>): string {
  return renderTemplate(readUnitTemplate(file), values, {
    describe: `the daemon unit template ${file}`,
    assertNoneSurvive: true,
  });
}

/**
 * Render the daemon's unit for the detected backend, and compute where it is installed and what it
 * is then called.
 *
 * - **launchd** — `~/Library/LaunchAgents/com.autonomous-sdlc-harness.watcher.<slug>.plist`.
 * - **systemd** — `~/.config/systemd/user/harness-watcher@<slug>.service`.
 * - **`none`** — throws, naming the platform and carrying detection's own reason, because a caller
 *   that reached this function with no backend has a question with no answer rather than a value to
 *   fall back on.
 *
 * The install directory is the backend's `unitPath`; only the file name is computed here.
 */
export function renderUnit({ backend, config, repoRoot, watcherPath, envPath }: RenderUnitOptions): RenderedUnit {
  if (backend.kind === 'none') {
    throw new HarnessError(
      `no service manager to install the run daemon into on ${process.platform}: ${backend.reason}`,
    );
  }

  const unitDir = backend.unitPath;
  if (unitDir === undefined) {
    throw new HarnessError(
      `the ${backend.kind} backend was detected without a unit directory, so there is nowhere to install the daemon: detection and installation disagree, which is a fault in this CLI`,
      EXIT.INTERNAL,
    );
  }

  const projectName = descriptiveProjectName(config, repoRoot);
  const stateDirAbs = join(repoRoot, normalizeRepoDir(config.stateDir ?? DEFAULTS.stateDir));

  const slug = repoSlug(repoRoot);
  const label =
    backend.kind === 'launchd'
      ? `${LAUNCHD_LABEL_PREFIX}.${slug}`
      : `${SYSTEMD_UNIT_PREFIX}${slug}${SYSTEMD_UNIT_SUFFIX}`;
  const fileName = backend.kind === 'launchd' ? `${label}.plist` : label;

  // Undefined and empty are one answer — no environment key — so the distinction is collapsed here
  // rather than in each of the two places that would otherwise have to test for both.
  const resolvedEnvPath = envPath !== undefined && envPath.trim() !== '' ? envPath : undefined;

  const values: Record<string, string> = { label, projectName, watcherPath, repoRoot, stateDirAbs };
  for (const [token, value] of Object.entries(values)) assertSingleLine(token, value);
  if (resolvedEnvPath !== undefined) assertSingleLine('envPath', resolvedEnvPath);

  // Escaped per format: XML for the plist, and for systemd per directive — the command-line
  // argument quoted-and-escaped, every other value specifier-escaped. Escaping a value for the
  // wrong format puts the escape text into the path the service actually runs.
  const escape =
    backend.kind === 'launchd'
      ? (token: string, value: string) => escapeXml(token === 'projectName' ? commentSafe(value) : value)
      : (token: string, value: string) =>
          SYSTEMD_ARGUMENT_TOKENS.has(token) ? escapeSystemdArgument(value) : escapeSystemdValue(value);
  const substituted = Object.fromEntries(Object.entries(values).map(([token, value]) => [token, escape(token, value)]));

  // Escaped for its own destination rather than through the map above: the systemd stanza renders a
  // *quoted* `Environment="PATH=…"`, so a `"` or a `\` in a toolchain directory would end or eat that
  // quoting — the same reason `ExecStart`'s path takes the argument escaper (choice 3), on the same
  // kind of destination. The plist arm quotes nothing, so it stays on XML escaping.
  const environment = environmentStanza(
    backend.kind,
    resolvedEnvPath === undefined
      ? undefined
      : backend.kind === 'launchd'
        ? escapeXml(resolvedEnvPath)
        : escapeSystemdArgument(resolvedEnvPath),
  );

  return {
    text: render(UNIT_TEMPLATES[backend.kind], { ...substituted, environment }),
    targetPath: join(unitDir, fileName),
    label,
    projectName,
    envPath: resolvedEnvPath,
  };
}
