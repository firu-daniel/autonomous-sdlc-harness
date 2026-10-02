/**
 * The throwaway mirror repository a server reads a corpus through.
 *
 * **The rule this module exists to enforce: the fixture holds exactly the files the resolved corpus
 * names, at the same repo-relative paths, so a rendered `ref` is the same whichever server reads it,
 * and it lives under the system temp directory, never inside this checkout.** Its configuration is the
 * checkout's own with the resolved corpus's keys layered over it, so it carries the `retrievalApplies`
 * keys, the resolved `docs.root` and the resolved `layers[]` that this repository's configuration and
 * the `fixture-catalog` root deliberately do not.
 *
 * Its caller removes it on every exit path, failure included, through {@link removeMirrorFixture},
 * which removes in process because `.claude/context/conventions.md` → `## Shell assets` forbids
 * shelling out to a recursive removal.
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { CONFIG_FILENAME } from '../../cli/dist/config/model.js';
import { corpusFiles } from '../../cli/dist/retrieval/corpus.js';

function refuse(message) {
  throw new Error(`eval: mirror fixture: ${message}`);
}

function git(dir, args) {
  execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * A git-initialized fixture repository under the system temp directory, holding exactly the files the
 * resolved corpus names, at the same repo-relative paths.
 *
 * `repoRoot` is the checkout whose `harness.config.json` is merged; `resolved` is
 * `evals/docs-retrieval/corpora.mjs` → `corpusConfig`'s `{ id, config, repoRoot }`. The layer entries
 * are the resolved ones mapped onto their copied paths, one for one, and no layer count and no
 * rules-document path is written here.
 */
export function buildMirrorFixture(repoRoot, resolved) {
  const corpus = corpusFiles(resolved.repoRoot, resolved.config);
  if (corpus.files.length === 0) refuse(`corpus ${resolved.id} resolved to no files, so there is nothing to mirror`);

  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'harness-eval-mirror-')));
  for (const file of corpus.files) {
    const target = join(dir, file);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(resolved.repoRoot, file), target);
  }

  const adopted = JSON.parse(readFileSync(join(repoRoot, CONFIG_FILENAME), 'utf8'));
  const config = { ...adopted, ...resolved.config };
  writeFileSync(join(dir, CONFIG_FILENAME), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  git(dir, ['init', '-q', '-b', config.defaultBranch]);
  git(dir, ['add', '--', ...corpus.files, CONFIG_FILENAME]);
  git(dir, ['-c', 'user.name=query log pass', '-c', 'user.email=query-log-pass@invalid', 'commit', '-q', '-m', 'Fixture corpus']);

  // The fixture cannot drift from the corpus it mirrors: what it resolves for itself is what was copied.
  const mirrored = corpusFiles(dir, config);
  if (mirrored.files.length !== corpus.files.length) {
    refuse(
      `the fixture resolves ${mirrored.files.length} corpus files and ${resolved.id} resolves ` +
        `${corpus.files.length}; the two must be equal or a document has not been mirrored`,
    );
  }
  const missing = corpus.files.filter((file) => !mirrored.files.includes(file));
  if (missing.length > 0) refuse(`the fixture is missing ${missing.join(', ')} of corpus ${resolved.id}`);

  return { dir, config, files: corpus.files, warnings: [...corpus.warnings, ...mirrored.warnings] };
}

export function removeMirrorFixture(dir) {
  rmSync(dir, { recursive: true, force: true });
}
