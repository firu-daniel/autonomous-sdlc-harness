/**
 * Loading and saving `harness.config.json` — the only place the CLI reads or writes that file.
 *
 * Two properties this module exists to hold:
 *
 * 1. **A read reports; it does not throw.** {@link loadConfig} answers with a list of problems —
 *    file absent, unparsable, or structurally wrong — so `doctor` can name everything wrong with a
 *    repository in one pass instead of stopping at the first fault. A caller that needs a usable
 *    config asks for one explicitly with {@link requireConfig}.
 * 2. **A write is guarded.** Nothing here writes a config that `config/check.ts` reports an `error`
 *    on. `init` generating one and `config set` editing one both go through that guard, so the CLI
 *    cannot be the thing that leaves an adopter with a config the schema gate then rejects.
 *
 * Every write is enqueued on the caller's {@link WritePlan} rather than performed here, so
 * `--dry-run` and `--force` keep meaning what the write engine says they mean and this module has
 * no filesystem-mutating call of its own.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { HarnessError } from '../core/errors.js';
import { readJsonFile, type JsonObject } from '../core/json.js';
import type { WritePlan } from '../core/writer.js';
import { checkConfigShape, formatProblem, hasErrors, type ConfigProblem } from './check.js';
import { CONFIG_FILENAME, type HarnessConfig } from './model.js';

/** What {@link loadConfig} answers with. */
export interface LoadedConfig {
  /**
   * The parsed config, or `undefined` when the file is absent, unparsable, or not a JSON object.
   *
   * The type is an **assertion about the parsed value, not a guarantee**: a config that failed the
   * check is still returned, because `doctor` reports on the parts that are fine as well as the
   * parts that are not. Check {@link problems} for `error` severity before trusting a field —
   * {@link requireConfig} is the short way to do that.
   */
  readonly config: HarnessConfig | undefined;
  /** Everything wrong with the file, in report order. Empty means it is loadable and well-shaped. */
  readonly problems: readonly ConfigProblem[];
  /** Absolute path the config was looked for at, whether or not anything was there. */
  readonly path: string;
}

/** What {@link updateConfig} answers with, once the update has been enqueued. */
export interface UpdatedConfig {
  /** The mutated config, as it will be written. */
  readonly config: HarnessConfig;
  /** Problems remaining after the mutation — warnings only; an error would have been refused. */
  readonly problems: readonly ConfigProblem[];
  readonly path: string;
}

/** Applies an edit in place. Given a private copy, so a refused update leaves the file untouched. */
export type ConfigMutator = (config: HarnessConfig) => void;

/** Absolute path of `harness.config.json` for a repository. */
export function configPath(repoRoot: string): string {
  return join(repoRoot, CONFIG_FILENAME);
}

/**
 * Is there a config file here at all?
 *
 * Deliberately existence and nothing more — it does not parse, so a repository whose config has a
 * syntax error answers `true` and is reported by {@link loadConfig} rather than being treated as
 * unwired and generated over.
 */
export function configExists(repoRoot: string): boolean {
  return existsSync(configPath(repoRoot));
}

/**
 * Read, parse and structurally check the repository's config.
 *
 * Absence and unparsable JSON are reported as problems rather than thrown, for the reason in the
 * module header. Unparsable is kept distinct from absent in the message, because the two have
 * opposite fixes: one is "run `init`", the other is "your file has a syntax error and `init` will
 * not overwrite it".
 */
export function loadConfig(repoRoot: string): LoadedConfig {
  const path = configPath(repoRoot);

  let parsed: unknown;
  try {
    parsed = readJsonFile(path);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { config: undefined, problems: [{ path: '', message: detail, severity: 'error' }], path };
  }

  if (parsed === undefined) {
    return {
      config: undefined,
      problems: [
        {
          path: '',
          message: `${CONFIG_FILENAME} not found at ${path}: this repository is not wired yet — run \`npx autonomous-sdlc-harness init\``,
          severity: 'error',
        },
      ],
      path,
    };
  }

  const problems = checkConfigShape(parsed);
  const usable = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  return { config: usable ? (parsed as HarnessConfig) : undefined, problems, path };
}

/**
 * The parsed config and its problems, or a refusal when **nothing parsed** — `config list`'s read.
 *
 * A shape error is returned rather than refused, because the configurations most in need of being
 * printed are the ones carrying one. Absent, unparsable or not a JSON object is still a refusal:
 * there is no file "as it stands" to show.
 */
export function readParsedConfig(repoRoot: string): LoadedConfig & { readonly config: HarnessConfig } {
  const loaded = loadConfig(repoRoot);
  if (loaded.config === undefined) {
    throw new HarnessError(refusal(`cannot read ${CONFIG_FILENAME}`, loaded.problems));
  }
  return { ...loaded, config: loaded.config };
}

/**
 * The config, or a refusal naming every problem at once.
 *
 * For the commands that cannot do their job without a **valid** config — `config get`, `daemon`.
 * The refusal is input-side: a file already carrying an `error` problem is refused before the
 * caller sees a value. `doctor` deliberately does **not** use this: reporting is its job, so it
 * reads {@link loadConfig} and prints what it found, and `config list` reads
 * {@link readParsedConfig} for the same reason.
 */
export function requireConfig(repoRoot: string): HarnessConfig {
  const loaded = readParsedConfig(repoRoot);
  if (hasErrors(loaded.problems)) {
    throw new HarnessError(refusal(`cannot read ${CONFIG_FILENAME}`, loaded.problems));
  }
  return loaded.config;
}

/**
 * Enqueue the write of a freshly generated config — `init`'s writer.
 *
 * `create-if-absent`: the adopter owns and edits this file after `init`, and there is no private
 * second copy to fall back on, so a re-run must never rewrite it (`docs/config.md` §1, and the
 * per-artifact table in `core/writer.ts`). `options.forceOverride` fixes the enqueued request's
 * overwrite decision whatever the run's `--force` says, which is how this one artifact stands
 * outside that flag: `'never'` for an ordinary `init`, so a `--force` run keeps the adopter's
 * config, and `'always'` for `init --reset-config`, so the start-over path rebuilds it after a
 * `.bak` on a run with no `--force`. Both are `generators/harnessConfig.ts`'s to set — it is the
 * sole caller — and omitting the option leaves the run's flag deciding, exactly as it did before
 * this parameter existed.
 *
 * The guard refuses on an `error` problem only — a `warning` is expected here, since a generated
 * config legitimately carries an undetected command's placeholder for the adopter to replace.
 */
export function saveConfig(
  repoRoot: string,
  config: HarnessConfig,
  plan: WritePlan,
  options?: { readonly forceOverride?: 'never' | 'always' },
): string {
  const problems = checkConfigShape(config);
  if (hasErrors(problems)) {
    throw new HarnessError(refusal(`refusing to write a malformed ${CONFIG_FILENAME}`, problems));
  }

  const path = configPath(repoRoot);
  plan.add({
    path,
    policy: 'create-if-absent',
    content: asJson(config),
    label: CONFIG_FILENAME,
    ...(options?.forceOverride === undefined ? {} : { forceOverride: options.forceOverride }),
  });
  return path;
}

/**
 * Re-read the config, apply an edit, re-check the result and enqueue the write — `config set`.
 *
 * Re-reading rather than taking a caller-held object is the point: the file on disk is the truth,
 * and an edit computed against a stale copy would silently discard whatever changed since. The
 * mutator is handed a **private deep copy**, so a refused update leaves nothing half-applied.
 *
 * The write is enqueued as `create-if-absent`, which is the engine's only content-replacing
 * policy; `config set` is therefore the one command that applies its plan with `force: true`, and
 * the engine writes a `.bak` sibling before replacing the file. That is deliberate for the single
 * command whose job is to change a file the adopter owns — the previous values stay one file away.
 */
export function updateConfig(repoRoot: string, mutate: ConfigMutator, plan: WritePlan): UpdatedConfig {
  const loaded = loadConfig(repoRoot);
  if (loaded.config === undefined || hasErrors(loaded.problems)) {
    throw new HarnessError(refusal(`cannot update ${CONFIG_FILENAME}`, loaded.problems));
  }

  const updated = structuredClone(loaded.config);
  mutate(updated);

  const problems = checkConfigShape(updated);
  if (hasErrors(problems)) {
    throw new HarnessError(refusal(`refusing to write ${CONFIG_FILENAME}: the edit would make it invalid`, problems));
  }

  plan.add({ path: loaded.path, policy: 'create-if-absent', content: asJson(updated), label: CONFIG_FILENAME });
  return { config: updated, problems, path: loaded.path };
}

/**
 * The config as the JSON the write engine serializes.
 *
 * A cast rather than a conversion: `JSON.stringify` drops a key whose value is `undefined`, so an
 * optional key left unset is absent from the file rather than written as `null`. Key order is the
 * object's own — the generator that builds the config owns that order, and an edited config keeps
 * whatever order the adopter's file had, so `config set` produces a one-line diff rather than a
 * reordered file.
 */
function asJson(config: HarnessConfig): JsonObject {
  return config as unknown as JsonObject;
}

/** `<headline>: <problem>; <problem>` — one message naming every problem, for a refusal. */
function refusal(headline: string, problems: readonly ConfigProblem[]): string {
  const lines = problems.map(formatProblem);
  return lines.length === 0 ? headline : `${headline}: ${lines.join('; ')}`;
}
