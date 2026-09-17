/**
 * One repository fixture per supported stack, driven end to end through `init`.
 *
 * **The rule these tests exist to enforce: a stack is supported when a repository shaped like that
 * stack, and nothing else, comes out of `init` with the right preset, the right layer paths and
 * commands that would actually run.** Detection is an ordered first-match-wins table
 * (`src/detect/signals.ts`), so every stack added to it is a row that can be shadowed by an earlier
 * row or that can shadow a later one, and neither failure is visible in the diff that causes it —
 * it shows up as an adopter of some other stack silently getting the new preset. A fixture per
 * stack is the only thing that catches that, which is why {@link stackCase} is the single entry
 * point every stack adds itself through rather than each writing its own assertions.
 *
 * These run against the **compiled** CLI at `dist/cli.js`, so `npm run build` precedes `npm test`.
 *
 * ## Two non-obvious choices, and where each comes from
 *
 * 1. **`fixtureFor` and `initOk` are defined here rather than imported.** `test/helpers/fixture.mjs`
 *    exports neither: they are file-local in `init.test.mjs`, `outer-loop-scripts.test.mjs` and
 *    `profile.test.mjs`, and those three copies do not share one signature — `profile.test.mjs`
 *    takes `(t, extraFiles)` where the other two take `(t, options)`. Importing either name would
 *    yield an undefined import, and unifying the three is a refactor of files this file does not
 *    otherwise touch. This copy follows the `(t, options)` form.
 * 2. **A stack's commands are asserted as the values that land in `harness.config.json`**, not as
 *    the raw lines inside the wrappers. That file is what every later reader consults, and a key
 *    holding a placeholder is a *written* key — so "this stack derives no build command" has to be
 *    asserted as absence, with the placeholder named separately when it is what actually happened.
 *    {@link stackCase}'s `absentCommands` does both, through the model's own `isPlaceholder`.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { createFixture, readJson, runCli, PACKAGE_ROOT, WORKSPACE_ROOT } from './helpers/fixture.mjs';

/** The generated configuration every assertion here reads, relative to the fixture root. */
const CONFIG_FILE = 'harness.config.json';

/** A module out of the compiled tree, refused with the same sentence `runCli` uses. */
async function built(relativePath) {
  const path = join(PACKAGE_ROOT, 'dist', ...relativePath.split('/'));
  if (!existsSync(path)) {
    throw new Error(
      `${path} is missing. These tests run against the compiled CLI, so run \`npm run build\` before \`npm test\`.`,
    );
  }
  return import(pathToFileURL(path).href);
}

const { isPlaceholder } = await built('config/model.js');
const { wrapperCommandLine } = await built('generators/scripts.js');
const {
  BUNDLER_MANIFEST,
  CARGO_MANIFEST,
  detectPreset,
  CMAKE_MANIFEST,
  COMPOSER_MANIFEST,
  DOTNET_PROJECT_SUFFIXES,
  DOTNET_SOLUTION_SUFFIXES,
  GO_MANIFEST,
  GRADLE_MANIFESTS,
  MAVEN_MANIFEST,
  NODE_ROW_GUARD_SCRIPTS,
  PACKAGE_LOCKFILE,
  PACKAGE_MANIFEST,
  PRESET_NAMES,
  PUBSPEC_MANIFEST,
  PYTHON_MANIFESTS,
  SIGNALS,
  SWIFT_PACKAGE_MANIFEST,
  UNREAD_MANIFESTS,
  WORKSPACE_MANIFESTS,
  XCODE_PROJECT_SUFFIXES,
} = await built('detect/signals.js');

const { buildPreset, COMMAND_FAMILY_IDS, NODE_SCRIPT_CANDIDATE_NAMES, devServerPrestart } =
  await built('detect/presets.js');

/** Build a fixture, register its teardown against the test, and return its directory. */
async function fixtureFor(t, options) {
  const fixture = await createFixture(options);
  t.after(fixture.cleanup);
  return fixture.dir;
}

/** Run `init` and fail with the CLI's own output when it did not exit 0. */
async function initOk(dir, args = []) {
  const result = await runCli(dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

/**
 * The `== notes` block's entries, or `[]` when the run raised none.
 *
 * Deliberately tolerant of a missing block, which `init.test.mjs`'s own `notesBlock` is not: half the
 * cases here assert that a note was **not** raised, and a reader that fails on the absent block would
 * fail those on the very output that proves them.
 */
function notesBlock(stdout) {
  const lines = stdout.split('\n');
  const from = lines.indexOf('== notes');
  if (from === -1) return [];
  const rest = lines.slice(from + 1);
  const to = rest.findIndex((line) => line.startsWith('== '));
  return (to === -1 ? rest : rest.slice(0, to)).filter((line) => line.startsWith('- '));
}

/**
 * The run's warning lines, read off stderr where `Report.warn` prints them with its `! ` marker.
 *
 * A separate reader from {@link notesBlock} rather than a parameter on it, because the two channels
 * are two streams: notes are a `== notes` block on stdout and warnings are unblocked lines on stderr
 * (`src/core/report.ts`). A case that asserts a message is on one channel and not the other has to
 * read both, or it cannot tell a routing change from a wording change.
 */
function warningLines(stderr) {
  return stderr.split('\n').filter((line) => line.startsWith('! '));
}

/** The generated wrapper directory, as `init` writes it under the schema default. */
const SCRIPTS_DIR = 'scripts';

/**
 * The raw command line a generated wrapper runs, read off the wrapper on disk.
 *
 * **`typecheck`, `test` and `devServer` land here, not in `commands.*`**: all three are wrapped, so
 * the generated config holds `bash <scriptsDir>/<name>.sh` whatever was detected, and asserting that
 * value would assert the wrapper spelling rather than the derivation under test. `build` and
 * `depInstall` are the two keys that stay raw, and those are asserted through `commands`.
 *
 * Read back through the generator's **own** inverse, `wrapperCommandLine`, rather than a second
 * parse written here: it is exported beside the render it inverts for exactly that reason, and it is
 * the only reader that handles all four templates — `start-dev-server.sh` shifts its port argument
 * off before forwarding, so a rule keyed on a line *ending* in `"$@"` misses it.
 */
function wrapperCommand(dir, file) {
  const path = join(dir, SCRIPTS_DIR, file);
  assert.ok(existsSync(path), `${SCRIPTS_DIR}/${file} was not written, so there is no command to read`);
  const body = wrapperCommandLine(readFileSync(path, 'utf8'));
  assert.equal(body.kind, 'command', `${SCRIPTS_DIR}/${file} runs no command line: ${body.kind}`);
  return body.command;
}

/**
 * Register one stack's end-to-end case: seed a repository shaped like that stack, run `init` with
 * no `--preset`, and assert what detection made of it.
 *
 * **This is the entry point a newly supported stack adds itself through.** Everything a stack has
 * to prove is a parameter here, so the shape of the evidence is the same for every stack and a new
 * one cannot quietly assert less than its siblings.
 *
 * @param t the parent test context, so each stack's fixture is torn down with its own subtest.
 * @param {object} options
 * @param {string} options.name what the stack is called, in the subtest title.
 * @param {Record<string, string | object> } options.seed the fixture's files, as `createFixture`
 *   takes them — the repository shape that is supposed to select this preset, and nothing more:
 *   a file added for convenience is a file that may be what detection actually matched on.
 * @param {string} options.preset the expected `detection.preset`.
 * @param {string} options.signal the expected `detection.signal` — asserted separately from the
 *   preset because two rows can reach one preset, and which row matched is the reproducibility
 *   claim `doctor` repeats back.
 * @param {string} [options.evidence] the expected `detection.evidence`. Only a stack whose locator
 *   **chooses** between several files in one tree needs it: the preset, the layers and the commands
 *   can all be identical whichever of them was picked, so which file the row matched on has no
 *   other falsifiable trace.
 * @param {readonly string[]} options.layers the expected `layers[].name`, in order.
 * @param {Record<string, string>} [options.layerPaths] expected `layers[].path` by layer name, for
 *   the layers whose path is part of the claim. A layer named here that the config does not carry
 *   is a failure; a layer not named here has its path unchecked.
 * @param {Record<string, string>} [options.commands] expected `commands.*` values, by key — which
 *   for a wrapped key is the wrapper invocation, so a claim about a *derived line* belongs in
 *   `wrapperCommands` instead.
 * @param {Record<string, string>} [options.wrapperCommands] expected raw command lines, by generated
 *   wrapper file name (`typecheck.sh`, `test.sh`, `start-dev-server.sh`).
 * @param {readonly string[]} [options.absentCommands] keys this stack derives no command for, and
 *   which must therefore be **absent** — a key present as a placeholder fails, and says so.
 * @param {readonly string[]} [options.placeholderCommands] keys this stack is supposed to leave
 *   **unresolved but written**: the required pair, which gets a placeholder rather than an absence.
 * @param {readonly string[]} [options.initArgs] extra arguments for the `init` run. Only a stack
 *   whose claim is about *where* the application sits needs one — `--app-dir` is the whole subject of
 *   the workspace case — and a stack that passes any is no longer asserting what a bare `init` makes
 *   of its tree, so it says why in its own comment.
 * @param {Record<string, number>} [options.noteCounts] how many `== notes` entries must contain each
 *   substring. `0` is the useful value and the reason this exists: a derivation that is supposed to
 *   emit **no** note has no other falsifiable trace, and a run that quietly started anchoring a
 *   command would otherwise pass every assertion above.
 * @param {Record<string, number>} [options.warningCounts] the same claim on the **warning** channel:
 *   how many `! ` lines on stderr must contain each substring. A message whose severity is the
 *   subject of the case needs both maps, since asserting only that it was raised cannot tell a note
 *   from a warning.
 * @param {(run: { name: string, dir: string, config: object, stdout: string, stderr: string }) => void}
 *   [options.assertAlso] run after every assertion above, with the fixture directory the run left
 *   behind. The maps above all read the generated configuration; a claim about what an adopter finds
 *   **on disk** — a wrapper that exists, a wrapper that does not — has no other route from a case to
 *   the fixture, and the matrix test's per-entry invariants are exactly that shape.
 */
function stackCase(
  t,
  {
    name,
    seed,
    preset,
    signal,
    evidence,
    layers,
    layerPaths = {},
    commands = {},
    wrapperCommands = {},
    absentCommands = [],
    placeholderCommands = [],
    initArgs = [],
    noteCounts = {},
    warningCounts = {},
    assertAlso,
  },
) {
  return t.test(name, async (subtest) => {
    const dir = await fixtureFor(subtest, { files: seed });
    const { stdout, stderr } = await initOk(dir, initArgs);
    const config = readJson(join(dir, CONFIG_FILE));

    assert.equal(config.detection.preset, preset, `${name} detected as ${config.detection.preset}`);
    assert.equal(config.detection.signal, signal, `${name} matched ${config.detection.signal}`);

    if (evidence !== undefined) {
      assert.equal(config.detection.evidence, evidence, `${name} matched on ${config.detection.evidence}`);
    }

    assert.deepEqual(
      config.layers.map((layer) => layer.name),
      [...layers],
      `${name} produced a different layer profile`,
    );

    for (const [layerName, path] of Object.entries(layerPaths)) {
      const layer = config.layers.find((candidate) => candidate.name === layerName);
      assert.ok(layer, `${name} has no \`${layerName}\` layer to check the path of`);
      assert.equal(layer.path, path, `${name}'s \`${layerName}\` layer points at ${layer.path}`);
    }

    for (const [key, value] of Object.entries(commands)) {
      assert.equal(config.commands[key], value, `${name}'s commands.${key} is ${config.commands[key]}`);
    }

    for (const [file, value] of Object.entries(wrapperCommands)) {
      assert.equal(wrapperCommand(dir, file), value, `${name}'s ${SCRIPTS_DIR}/${file} runs a different line`);
    }

    for (const key of absentCommands) {
      const written = config.commands[key];
      assert.equal(
        written,
        undefined,
        isPlaceholder(written ?? '')
          ? `${name} wrote a placeholder into commands.${key}, which is a written key: ${written}`
          : `${name} derived commands.${key} = ${written}, which this stack is not supposed to resolve`,
      );
    }

    for (const key of placeholderCommands) {
      const written = config.commands[key];
      assert.ok(
        isPlaceholder(written ?? ''),
        `${name}'s commands.${key} is \`${written}\`, and this stack is supposed to leave it unresolved`,
      );
    }

    const notes = notesBlock(stdout);
    for (const [substring, count] of Object.entries(noteCounts)) {
      const matching = notes.filter((note) => note.includes(substring));
      assert.equal(
        matching.length,
        count,
        `${name} raised ${matching.length} note(s) containing \`${substring}\`, not ${count}:\n${stdout}`,
      );
    }

    const warnings = warningLines(stderr);
    for (const [substring, count] of Object.entries(warningCounts)) {
      const matching = warnings.filter((warning) => warning.includes(substring));
      assert.equal(
        matching.length,
        count,
        `${name} raised ${matching.length} warning(s) containing \`${substring}\`, not ${count}:\n${stderr}`,
      );
    }

    assertAlso?.({ name, dir, config, stdout, stderr });
  });
}

/**
 * {@link stackCase} exercised against a preset that already exists, so the helper nine later stacks
 * depend on is not first run by the stack that also needs its own answer to be right.
 *
 * `flat` is the subject because it is the table's unconditional last row: a repository carrying no
 * manifest and no recognised directory reaches it by construction, which makes it the one case that
 * needs no stack-specific seed. It also exercises the `absentCommands` arm on the two keys that are
 * documented to get no placeholder (`detect/presets.ts`, "the two script-derived keys the schema
 * leaves optional").
 */
test('the shared stack case asserts a preset, its layer paths and an unresolved command key', async (t) => {
  await stackCase(t, {
    name: 'flat',
    seed: { 'README.md': '# fixture\n' },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    layerPaths: { general: '.' },
    absentCommands: ['build', 'devServer'],
  });
});

/**
 * The closure rule `UNREAD_MANIFESTS` states in its own doc comment, asserted rather than trusted.
 *
 * That list exists to make one sentence true — the undetected-command warning's "here is what is
 * there instead" — so a name that appears both there and in a list detection actually **reads**
 * makes that warning report a manifest `init` had just started reading as one it does not. Adding a
 * stack is exactly the change that breaks it, because a stack is added by starting to read a
 * manifest, and nothing else in the suite would notice.
 */
test('no manifest detection reads is still listed as one it does not read', () => {
  const read = new Set([
    PACKAGE_MANIFEST,
    PACKAGE_LOCKFILE,
    GO_MANIFEST,
    PUBSPEC_MANIFEST,
    ...PYTHON_MANIFESTS,
    ...WORKSPACE_MANIFESTS,
    MAVEN_MANIFEST,
    ...GRADLE_MANIFESTS,
    SWIFT_PACKAGE_MANIFEST,
    CARGO_MANIFEST,
    BUNDLER_MANIFEST,
    COMPOSER_MANIFEST,
  ]);
  const overlap = UNREAD_MANIFESTS.filter((name) => read.has(name));
  assert.deepEqual(
    overlap,
    [],
    `UNREAD_MANIFESTS still lists ${overlap.join(', ')}, which detection now reads — remove the name from that list`,
  );
});

/** The opening of {@link anchoredDepInstall}'s note — the only trace an anchored install leaves. */
const ANCHORING_NOTE = 'commands.depInstall was derived from';

/** A root manifest declaring exactly the scripts named, so a case can seed one that declares none. */
function rootManifest(scripts = {}) {
  return { name: 'fixture-project', private: true, version: '0.0.0', scripts };
}

/**
 * A minimal but real Cargo manifest, and the three lines a crate resolves — spelled here rather than
 * beside the Cargo case below because case (c) of the ordering test is one of the two consumers, and
 * the whole of that case's claim is that both consumers assert the same three strings.
 */
const CARGO_TOML = '[package]\nname = "fixture"\nversion = "0.1.0"\n';
const CARGO_TYPECHECK = 'cargo fmt --check && cargo clippy --all-targets -- -D warnings';
const CARGO_TEST = 'cargo test';
const CARGO_DEP_INSTALL = 'cargo fetch';

/**
 * The same three lines anchored to a crate below the root. The type check spells the anchor twice
 * because it is a compound and each half runs from the repository root, so a line that anchored only
 * one half would still pass every root-crate case above and mis-run the other against the root.
 */
const CARGO_NESTED_TYPECHECK =
  'cargo fmt --check --manifest-path crate/Cargo.toml && cargo clippy --all-targets --manifest-path crate/Cargo.toml -- -D warnings';
const CARGO_NESTED_TEST = 'cargo test --manifest-path crate/Cargo.toml';
const CARGO_NESTED_DEP_INSTALL = 'cargo fetch --manifest-path crate/Cargo.toml';

/**
 * The clause that distinguishes {@link cargoLintNote} from every other note — the `-D warnings`
 * half, which is the property an adopter is not expecting and the one a softer line would drop.
 */
const CARGO_LINT_NOTE = "makes clippy's lints fail the key rather than print";

/**
 * Which command family answers, when the repository carries more than one family's manifest.
 *
 * **The rule these cases exist to enforce: a `package.json` is not a claim about the repository's
 * stack.** It is the manifest detection reads that most often appears in a repository of some
 * other stack — a documentation site, a lint-only tooling manifest, a bundled front end — so
 * `COMMAND_FAMILIES` orders `npm` last and hoists the family whose own manifest row decided the
 * preset (`src/detect/presets.ts`). Before that, a Go module carrying a scripts-less root manifest
 * lost `go vet` and `go test` to a family with nothing to offer, and the loss was invisible in the
 * generated config: it read as two ordinary placeholders.
 *
 * Every case here seeds a **root** `package.json`, because that is the only shape the defect had:
 * `nodeCommands`' gate is `rootPackageJson()`, which reads `<repoRoot>/package.json` and nothing
 * else, so a tree whose only npm manifest is `www/package.json` never reached command derivation at
 * all — before this change or after it.
 */
test('a root package.json does not claim a repository of another stack', async (t) => {
  await stackCase(t, {
    // (a) The fixture that forced the gate change. `internal/api/` matches the route-directory row,
    // which is directory-shaped and hoists nothing, so this asserts the **standing** order.
    name: 'a Go module carrying a scripts-less root package.json',
    seed: {
      'go.mod': 'module example.com/fixture\n\ngo 1.22\n',
      'internal/api/server.go': 'package api\n',
      'package.json': rootManifest(),
    },
    preset: 'api-service',
    signal: 'api-service:route-directory',
    layers: ['api', 'general'],
    layerPaths: { api: 'internal/api' },
    // The two lines the npm family used to take, and the root install it used to take them with.
    wrapperCommands: { 'typecheck.sh': 'go vet ./...', 'test.sh': 'go test ./...' },
    commands: { depInstall: 'npm install' },
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (b) The same tree with a manifest that *does* declare something: `lint` resolves `typecheck`,
    // so the gate stays open — and the Go family still wins, because `npm` is ordered last.
    name: 'a Go module carrying a lint-only root package.json',
    seed: {
      'go.mod': 'module example.com/fixture\n\ngo 1.22\n',
      'internal/api/server.go': 'package api\n',
      'package.json': rootManifest({ lint: 'echo lint' }),
    },
    preset: 'api-service',
    signal: 'api-service:route-directory',
    layers: ['api', 'general'],
    layerPaths: { api: 'internal/api' },
    wrapperCommands: { 'typecheck.sh': 'go vet ./...', 'test.sh': 'go test ./...' },
    commands: { depInstall: 'npm install' },
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (c) **The npm-last ordering proved end to end, and the one case here that is a changed
    // answer rather than a preserved one.** This identical tree answered `npm run lint`, `npm test`
    // and `npm install` until the Cargo family was registered above `npm` — a script resolved, so
    // the gate stayed open, and there was no earlier family to take the keys. Every one of the
    // three now comes from the manifest that names the repository's own stack, and none is left to
    // npm. The `package.json` is at the **repository root** deliberately: `nodeCommands`' gate is
    // `rootPackageJson()`, so a nested manifest would never have reached command derivation and
    // would have had no claim to lose.
    name: 'a Rust crate with a root package.json answers with Cargo, not npm',
    seed: {
      'Cargo.toml': CARGO_TOML,
      'src/main.rs': 'fn main() {}\n',
      'package.json': rootManifest({ lint: 'echo lint', test: 'echo test' }),
    },
    preset: 'rust-cargo',
    signal: 'rust-cargo:cargo-manifest',
    layers: ['src', 'general'],
    layerPaths: { src: 'src' },
    wrapperCommands: { 'typecheck.sh': CARGO_TYPECHECK, 'test.sh': CARGO_TEST },
    commands: { depInstall: CARGO_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (d) The regression control: a repository whose stack really is Node carries no other family's
    // manifest, so ordering `npm` last costs it nothing and every line is byte-identical.
    name: 'a plain npm repository is unmoved by the ordering',
    seed: {
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' }),
      'README.md': '# fixture project\n',
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: {
      'typecheck.sh': 'npm run typecheck',
      'test.sh': 'npm test',
      'start-dev-server.sh': 'npm run dev',
    },
    commands: { build: 'npm run build', depInstall: 'npm install' },
    // The Cargo lint note is scoped to the family that emits it: a tree with no `Cargo.toml` must
    // not carry an explanation of a line it did not get.
    noteCounts: { [ANCHORING_NOTE]: 0, [CARGO_LINT_NOTE]: 0 },
  });
});

/**
 * The two populations the widened `depInstall` fallback moves, asserted rather than left to be found.
 *
 * `buildPreset`'s fallback used to be bounded to an install site **below** the root, on the premise
 * that the fallback was reachable only where the root declared no manifest at all. The gate change
 * above falsifies that premise — the fallback is now reached with a root manifest present whenever it
 * declares no script the harness runs — so the bound is dropped and the workspace carve-out, which
 * that premise had made unnecessary, becomes load-bearing here.
 */
test('the widened depInstall fallback keeps the workspace root and reaches a non-npm family', async (t) => {
  await stackCase(t, {
    // (e) The carve-out fixture nothing else covers: `nestedAppFiles()` builds its root from
    // `nodeProjectFiles()`, which declares all four scripts, so `init.test.mjs`'s two workspace
    // sub-tests never reach a workspaces root whose manifest declares none. Without the carve-out
    // this answers `npm --prefix packages/storefront ci`, which fails for want of a member lockfile.
    name: 'a workspaces root whose manifest declares no recognised script',
    seed: {
      'package.json': { ...rootManifest(), workspaces: ['packages/*'] },
      'package-lock.json': { name: 'fixture-project', lockfileVersion: 3, requires: true, packages: {} },
      'packages/storefront/package.json': { name: 'storefront', private: true, version: '0.0.0' },
    },
    initArgs: ['--app-dir', 'packages/storefront'],
    preset: 'monorepo',
    signal: 'monorepo:workspaces-key',
    layers: ['general'],
    commands: { depInstall: 'npm ci' },
    placeholderCommands: ['typecheck', 'test'],
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (g) The blast radius, stated as an assertion: every repository whose keys come from a non-npm
    // family while a root `package.json` sits beside them now gains a **root** npm install, which
    // `setup-worktree.sh` runs in every worktree the flow cuts. The same tree emitted no
    // `commands.depInstall` at all before this change. Each family a later task registers — Flutter,
    // Gradle, Cargo, Composer — widens this population by exactly this shape.
    name: 'a Python distribution whose root package.json declares no recognised script',
    seed: {
      'pyproject.toml': '[project]\nname = "fixture"\n',
      'package.json': rootManifest(),
    },
    preset: 'python-package',
    signal: 'python-package:packaging-manifest',
    layers: ['general'],
    wrapperCommands: { 'typecheck.sh': 'mypy .', 'test.sh': 'pytest' },
    commands: { depInstall: 'npm install' },
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (f) **The residual that moves in the opposite direction from this change's purpose, and the
    // accepted price of ordering `npm` last.** The preset is decided by the directory-shaped
    // `layered-clean-arch:layer-directories` row, which has no hoist entry, so the standing order
    // applies and the root `pyproject.toml` answers over a root `package.json` that declares both
    // required scripts — where the npm lines were what this tree got before. The `signal` assertion
    // above is what names the row that decided it; the python family's root arm anchors nothing, so
    // it raises no note, and the root install it did not derive comes from the widened fallback.
    name: 'a layered tree carrying both a root package.json and a root pyproject.toml',
    seed: {
      'pyproject.toml': '[project]\nname = "fixture"\n',
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }),
      'src/data/store.py': '',
      'src/domain/model.py': '',
    },
    preset: 'layered-clean-arch',
    signal: 'layered-clean-arch:layer-directories',
    layers: ['data', 'domain', 'general'],
    layerPaths: { data: 'src/data', domain: 'src/domain' },
    wrapperCommands: { 'typecheck.sh': 'mypy .', 'test.sh': 'pytest' },
    commands: { depInstall: 'npm install' },
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });
});

/**
 * The opening of {@link weakTypecheckMessage} — the only trace a weak type-check selection leaves,
 * and one string for both channels because the code raises one message on both.
 */
const WEAK_TYPECHECK_MESSAGE = 'commands.typecheck was derived from the `lint` script';

/**
 * A `lint` script is accepted as `commands.typecheck` and never silently — at the severity the
 * repository's own evidence supports.
 *
 * **The rule these cases exist to enforce: the derived line is identical in all three, so what is
 * under test is reporting and nothing else.** `lint` is the last candidate for `typecheck`
 * (`src/detect/presets.ts`, `NODE_SCRIPT_CANDIDATES`) precisely because a lint run without
 * type-aware rules exits zero on a type error — the module header's "a run that passes its
 * verification step by running something that never checked anything", reached by a different route.
 * Dropping the candidate would hand every plain-JS adopter a placeholder instead of the only static
 * analysis they have, so it stays and is reported: loudly where a root `tsconfig.json` says the
 * repository is typed, as a note where nothing says so, since a warning on every correct plain-JS
 * adoption is how a warning list stops being read.
 */
test('a typecheck resolved from the lint fallback says so, at the severity the evidence supports', async (t) => {
  await stackCase(t, {
    // (h) Typed: a root `tsconfig.json` is file-existence evidence that `npm run lint` is very
    // unlikely to be this repository's type check, so the message is a warning.
    name: 'a lint-only manifest in a repository carrying a tsconfig.json',
    seed: {
      'package.json': rootManifest({ lint: 'echo lint' }),
      'tsconfig.json': { compilerOptions: { strict: true } },
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: { 'typecheck.sh': 'npm run lint' },
    commands: { depInstall: 'npm install' },
    placeholderCommands: ['test'],
    warningCounts: { [WEAK_TYPECHECK_MESSAGE]: 1 },
    noteCounts: { [WEAK_TYPECHECK_MESSAGE]: 0 },
  });

  await stackCase(t, {
    // (i) Plain JS: the same manifest, the same derived line, and the message on the notes channel —
    // `lint` is plausibly exactly what this adopter meant.
    name: 'a lint-only manifest in a repository with no tsconfig.json',
    seed: { 'package.json': rootManifest({ lint: 'echo lint' }) },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: { 'typecheck.sh': 'npm run lint' },
    commands: { depInstall: 'npm install' },
    placeholderCommands: ['test'],
    noteCounts: { [WEAK_TYPECHECK_MESSAGE]: 1 },
    warningCounts: { [WEAK_TYPECHECK_MESSAGE]: 0 },
  });

  await stackCase(t, {
    // (j) The control that bounds the change: a manifest declaring a real `typecheck` script emits
    // neither message, on either channel, `tsconfig.json` present or not — so every existing fixture
    // that declares one is unmoved by this reporting.
    name: 'a manifest declaring a real typecheck script is reported neither way',
    seed: {
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }),
      'tsconfig.json': { compilerOptions: { strict: true } },
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: { 'typecheck.sh': 'npm run typecheck', 'test.sh': 'npm test' },
    commands: { depInstall: 'npm install' },
    noteCounts: { [WEAK_TYPECHECK_MESSAGE]: 0 },
    warningCounts: { [WEAK_TYPECHECK_MESSAGE]: 0 },
  });
});

/**
 * The clause that distinguishes {@link unbuildableDevServerNote} from every other note — the staleness
 * it is about, rather than the key it names, so it cannot match a sentence about `commands.devServer`
 * being absent.
 */
const UNBUILDABLE_DEV_SERVER_NOTE = 'which serves whatever was last compiled';

/**
 * A dev-server line that serves pre-compiled output is answered — by a build the wrapper can run
 * first, or by a note when the manifest declares none.
 *
 * **The rule these cases exist to enforce: the two arms are exclusive and a watch-mode line is in
 * neither.** `npm run start` on the fixture that forced this (F65) was `node dist/server.js` with
 * nothing chaining `build` in front of it, so the interactive test phase tested stale output after an
 * uncompiled edit and failed outright on a fresh worktree. `npm run dev` compiles as it serves, so a
 * build in front of it would pay a full build per QA phase for output nothing reads.
 *
 * `devServerPrestart` is asserted **directly off the built module**, the way `wrapperCommandLine` and
 * `isPlaceholder` already are: until Task 10's wrapper renders it, the derivation has no other
 * falsifiable trace, and after it lands this is still the only place its `undefined` arms are stated.
 */
test('a dev-server line that serves pre-compiled output gets a build in front of it, or a note', async (t) => {
  /** The two required keys every {@link RawCommands} carries, so each case below states only its subject. */
  const verifiers = { typecheck: 'npm run typecheck', test: 'npm test' };

  assert.equal(
    devServerPrestart({ ...verifiers, devServer: 'npm run start', build: 'npm run build' }),
    'npm run build',
    'a pre-compiled dev-server line with a build resolves the build as its pre-start line',
  );
  assert.equal(
    devServerPrestart({ ...verifiers, devServer: 'npm run start' }),
    undefined,
    'there is nothing to run before a server when no build command was derived',
  );
  assert.equal(
    devServerPrestart({ ...verifiers, devServer: 'npm run dev', build: 'npm run build' }),
    undefined,
    'a watch-mode dev server compiles as it serves, so it takes no pre-start line',
  );

  await stackCase(t, {
    // (k) Both keys resolve, so the exposure is closed by the wrapper Task 10 renders rather than by a
    // sentence: the note must not be raised.
    name: 'a manifest declaring start and build raises no staleness note',
    seed: {
      'package.json': rootManifest({
        typecheck: 'echo typecheck',
        test: 'echo test',
        build: 'echo build',
        start: 'echo start',
      }),
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: {
      'typecheck.sh': 'npm run typecheck',
      'test.sh': 'npm test',
      'start-dev-server.sh': 'npm run start',
    },
    commands: { build: 'npm run build', depInstall: 'npm install' },
    noteCounts: { [UNBUILDABLE_DEV_SERVER_NOTE]: 0 },
    warningCounts: { [UNBUILDABLE_DEV_SERVER_NOTE]: 0 },
  });

  await stackCase(t, {
    // (l) The arm nothing can fix, and the fixture's own shape: `start` with no `build` script, so
    // there is no line to put in front of the launch and `init` says what that costs instead. A note
    // and not a warning — a start script that needs no build is not a fault.
    name: 'a manifest declaring start and no build raises the staleness note',
    seed: {
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test', start: 'echo start' }),
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: {
      'typecheck.sh': 'npm run typecheck',
      'test.sh': 'npm test',
      'start-dev-server.sh': 'npm run start',
    },
    commands: { depInstall: 'npm install' },
    absentCommands: ['build'],
    noteCounts: { [UNBUILDABLE_DEV_SERVER_NOTE]: 1 },
    warningCounts: { [UNBUILDABLE_DEV_SERVER_NOTE]: 0 },
  });

  await stackCase(t, {
    // (m) The control that bounds the note to the lines it is about: a watch-mode dev server is
    // silent whether or not a build script is declared, and this one declares both.
    name: 'a manifest declaring dev and build raises no staleness note',
    seed: {
      'package.json': rootManifest({
        typecheck: 'echo typecheck',
        test: 'echo test',
        build: 'echo build',
        dev: 'echo dev',
      }),
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: {
      'typecheck.sh': 'npm run typecheck',
      'test.sh': 'npm test',
      'start-dev-server.sh': 'npm run dev',
    },
    commands: { build: 'npm run build', depInstall: 'npm install' },
    noteCounts: { [UNBUILDABLE_DEV_SERVER_NOTE]: 0 },
    warningCounts: { [UNBUILDABLE_DEV_SERVER_NOTE]: 0 },
  });
});

/**
 * A minimal `pubspec.yaml` declaring **no** Flutter dependency — the `dart`-arm seed. Its
 * `environment.sdk` line is also the control that `declaresFlutterSdk`'s pattern does not match any
 * `sdk:` line, only `sdk: flutter`.
 */
const PUBSPEC = 'name: fixture\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\n';

/** The manifest a `flutter create` application carries: a `flutter:` dependency on the SDK. */
const PUBSPEC_FLUTTER_APP =
  'name: fixture\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\ndependencies:\n  flutter:\n    sdk: flutter\n';

/** The distinguishing clause of the `build.yaml` note — the only trace a codegen precondition leaves. */
const CODEGEN_NOTE = 'generates sources before they analyse';

/**
 * The Dart and Flutter stacks: which preset each layout gets, and which tool its commands name.
 *
 * **The rule these cases exist to enforce: the `flutter` row buys the command half for every Flutter
 * repository and changes the layer half for none that already detects.** Its row sits below
 * `layered-clean-arch:layer-directories` (`src/detect/signals.ts`), so a Flutter application laid out
 * in layers keeps the four-layer profile it has today and gains only the pair of commands it was
 * missing — that is case (k), and it is a regression control before it is a feature test. The row
 * catches what fell to `flat`: the feature-first `lib/`, whose decomposition into features is a
 * judgement call and therefore `/autonomous-sdlc-harness:harness-analyze`'s, so the preset names the
 * one directory that is certain.
 *
 * The tool has **two positives**: an application marker file, or a Flutter SDK dependency in the
 * manifest. That manifest read decides only the tool of an already-selected preset, never which
 * preset is selected. Each arm is held alone — (p) by markers with a manifest that declares nothing,
 * (o) by the dependency with no marker anywhere — and (m) carries neither and gets `dart`. Both tools
 * are needed because `dart analyze` reports every `package:flutter` import in an application as
 * unresolved, and `flutter test` cannot run where the Flutter SDK is not on `PATH`.
 */
test('a Dart or Flutter repository gets the tool its layout names, and keeps the preset it already had', async (t) => {
  await stackCase(t, {
    // (k) The regression control. Preset, signal, layer names and layer paths are what this tree
    // already answered before the row existed; only `commands.*` are new. `lib/main.dart` is seeded
    // because it is what selects the `flutter` arm — the baseline is unmoved by it, since
    // `findLayeredRoot` counts directories and this is a file.
    name: 'a layered Flutter application keeps layered-clean-arch and gains its commands',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'lib/main.dart': 'void main() {}\n',
      'lib/data/api_client.dart': '',
      'lib/domain/user.dart': '',
      'lib/presentation/home_page.dart': '',
    },
    preset: 'layered-clean-arch',
    signal: 'layered-clean-arch:layer-directories',
    layers: ['data', 'domain', 'presentation', 'general'],
    layerPaths: { data: 'lib/data', domain: 'lib/domain', presentation: 'lib/presentation' },
    wrapperCommands: { 'typecheck.sh': 'flutter analyze', 'test.sh': 'flutter test' },
    commands: { depInstall: 'flutter pub get' },
    // The two keys this family resolves nothing for, and says why in `dartCommands`.
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [CODEGEN_NOTE]: 0 },
  });

  await stackCase(t, {
    // (l) The population the row exists for: a feature-first `lib/` answered `flat` with two
    // placeholders and now names its source root and its commands.
    name: 'a feature-first Flutter application',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'lib/main.dart': 'void main() {}\n',
      'lib/features/feed/feed_page.dart': '',
      'lib/core/env.dart': '',
    },
    preset: 'flutter',
    signal: 'flutter:pubspec-manifest',
    layers: ['lib', 'general'],
    layerPaths: { lib: 'lib' },
    wrapperCommands: { 'typecheck.sh': 'flutter analyze', 'test.sh': 'flutter test' },
    commands: { depInstall: 'flutter pub get' },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [CODEGEN_NOTE]: 0 },
  });

  await stackCase(t, {
    // (m) Neither positive: no `lib/main.dart`, no `android/`, no `ios/`, and a manifest declaring no
    // Flutter dependency — a plain Dart package, so every line names `dart`. Same preset and same
    // layers as (l); the arms differ in the tool and in nothing else. It is also the control that the
    // manifest probe does not capture an `environment.sdk` line.
    name: 'a pure Dart package carrying none of the application markers',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'lib/src/parser.dart': '',
      'test/parser_test.dart': '',
    },
    preset: 'flutter',
    signal: 'flutter:pubspec-manifest',
    layers: ['lib', 'tests', 'general'],
    layerPaths: { lib: 'lib', tests: 'test' },
    wrapperCommands: { 'typecheck.sh': 'dart analyze', 'test.sh': 'dart test' },
    commands: { depInstall: 'dart pub get' },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [CODEGEN_NOTE]: 0 },
  });

  await stackCase(t, {
    // (n) The generated-source precondition, which the three cases above assert the absence of. It is
    // a note and not a fifth command key: the generator belongs on the line above the analyze line
    // inside the wrapper `commands.typecheck` names, so the derived lines here are (m)'s exactly.
    name: 'a Dart package whose sources are generated before they analyse',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'build.yaml': 'targets:\n  $default:\n    builders: {}\n',
      'lib/src/model.dart': '',
    },
    preset: 'flutter',
    signal: 'flutter:pubspec-manifest',
    layers: ['lib', 'general'],
    wrapperCommands: { 'typecheck.sh': 'dart analyze', 'test.sh': 'dart test' },
    commands: { depInstall: 'dart pub get' },
    noteCounts: { [CODEGEN_NOTE]: 1 },
    warningCounts: { [CODEGEN_NOTE]: 0 },
  });

  await stackCase(t, {
    // (o) The F68 reproduction: a Flutter application whose entry point moved out of `lib/main.dart`,
    // with no platform trees, so no marker exists and only the manifest's Flutter dependency answers.
    // On the marker-only derivation this case reports `dart analyze` / `dart test`. The same tree
    // outside this suite is the `preset-flutter-relocated` fixture.
    name: 'a Flutter application whose entry point is not lib/main.dart',
    seed: {
      'pubspec.yaml': PUBSPEC_FLUTTER_APP,
      'lib/src/app.dart': 'void main() {}\n',
      'lib/features/feed/feed_page.dart': '',
    },
    preset: 'flutter',
    signal: 'flutter:pubspec-manifest',
    layers: ['lib', 'general'],
    layerPaths: { lib: 'lib' },
    wrapperCommands: { 'typecheck.sh': 'flutter analyze', 'test.sh': 'flutter test' },
    commands: { depInstall: 'flutter pub get' },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [CODEGEN_NOTE]: 0 },
  });

  await stackCase(t, {
    // (p) The marker arm alone: `lib/main.dart` present, manifest declaring no Flutter dependency.
    // Replacing the markers with the manifest read rather than adding to them fails here.
    name: 'a Flutter application detected by its marker file alone',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'lib/main.dart': 'void main() {}\n',
    },
    preset: 'flutter',
    signal: 'flutter:pubspec-manifest',
    layers: ['lib', 'general'],
    layerPaths: { lib: 'lib' },
    wrapperCommands: { 'typecheck.sh': 'flutter analyze', 'test.sh': 'flutter test' },
    commands: { depInstall: 'flutter pub get' },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [CODEGEN_NOTE]: 0 },
  });
});

/** A minimal Android application manifest. Its contents are never read — existence is the whole test. */
const ANDROID_MANIFEST_XML = '<manifest package="com.example.fixture" />\n';

/** A Gradle settings file, so a fixture is the shape an Android repository actually has. */
const SETTINGS_GRADLE = "include(\":app\")\n";

/** The Gradle lines every case below expects, spelled once so a fixture cannot drift from a sibling. */
const GRADLE_TYPECHECK = 'gradle --console=plain --quiet compileDebugSources';
const GRADLE_TEST = 'gradle --console=plain --quiet testDebugUnitTest';

/**
 * The Android stack: which layout gets the `android-gradle` preset, and which keeps the one it has.
 *
 * **The rule these cases exist to enforce: the row buys the Gradle command pair for every Android
 * repository and changes the layer half only for the ones that answered `flat`.** A single-module
 * application matched nothing above the fallback, so it got the catch-all profile and two
 * placeholders — that is case (o). A multi-module repository laid out as root-level `data/`,
 * `domain/`, `presentation/` already matched `layered-clean-arch:layer-directories`, which is
 * evaluated far above this row, and case (q) is the regression control for exactly that: preset,
 * signal and layer paths identical to what it answered before, plus the commands, because the
 * command family is chosen independently of the preset.
 *
 * The three keys this family resolves nothing for are asserted **absent** rather than as
 * placeholders: `build` is deliberately unset (its only consumer is `setup-worktree.sh`, and a
 * native build per worktree verifies nothing an agent runs), an Android application has no dev
 * server, and Gradle installs dependencies as part of the task being run. An assertion that
 * accepted either shape would not catch a preset that started emitting a Gradle build.
 */
test('an Android repository gets the Gradle commands, and keeps the preset it already had', async (t) => {
  await stackCase(t, {
    // (o) The population the row exists for: a single-module application answered `flat` with two
    // placeholders, and now names its source root and both Gradle lines. `gradlew` is deliberately
    // **not** seeded here — (p) is where the wrapper spelling is asserted — so this is the `gradle`
    // fallback arm.
    name: 'a single-module Android application',
    seed: {
      'settings.gradle.kts': SETTINGS_GRADLE,
      'build.gradle.kts': 'plugins { }\n',
      'app/build.gradle.kts': 'plugins { id("com.android.application") }\n',
      'app/src/main/AndroidManifest.xml': ANDROID_MANIFEST_XML,
      'app/src/main/java/com/example/fixture/MainActivity.kt': '',
    },
    preset: 'android-gradle',
    signal: 'android-gradle:android-manifest',
    layers: ['app', 'general'],
    layerPaths: { app: 'app/src/main/java' },
    wrapperCommands: { 'typecheck.sh': GRADLE_TYPECHECK, 'test.sh': GRADLE_TEST },
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (p) The other module arm: no `app/` module, so the repository root **is** the module and the
    // manifest sits at `src/main/`. It carries a `gradlew`, which is what selects the wrapper over
    // `gradle` from `PATH`, and a `kotlin` source directory with no `java` beside it, which is what
    // selects the second source-root candidate.
    name: 'an Android module whose manifest sits at the repository root',
    seed: {
      'settings.gradle': "rootProject.name = 'fixture'\n",
      'build.gradle': 'plugins { }\n',
      gradlew: '#!/bin/sh\nexit 0\n',
      'src/main/AndroidManifest.xml': ANDROID_MANIFEST_XML,
      'src/main/kotlin/com/example/fixture/Main.kt': '',
    },
    preset: 'android-gradle',
    signal: 'android-gradle:android-manifest',
    layers: ['app', 'general'],
    layerPaths: { app: 'src/main/kotlin' },
    wrapperCommands: {
      'typecheck.sh': './gradlew --console=plain --quiet compileDebugSources',
      'test.sh': './gradlew --console=plain --quiet testDebugUnitTest',
    },
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (q) The regression control for the ordering invariant. Preset, signal, layer names and layer
    // paths are what this tree answered before the row existed; only `commands.*` are new, and they
    // are the same pair (o) gets — the family is preset-independent, so a layered Android repository
    // gains the commands it was missing without losing the profile it had.
    name: 'a multi-module Android repository keeps layered-clean-arch and gains the Gradle commands',
    seed: {
      'settings.gradle.kts': 'include(":app", ":data", ":domain", ":presentation")\n',
      'app/src/main/AndroidManifest.xml': ANDROID_MANIFEST_XML,
      'app/src/main/java/com/example/fixture/MainActivity.kt': '',
      'data/src/main/java/com/example/fixture/Api.kt': '',
      'domain/src/main/java/com/example/fixture/User.kt': '',
      'presentation/src/main/java/com/example/fixture/HomeScreen.kt': '',
    },
    preset: 'layered-clean-arch',
    signal: 'layered-clean-arch:layer-directories',
    layers: ['data', 'domain', 'presentation', 'general'],
    layerPaths: { data: 'data', domain: 'domain', presentation: 'presentation' },
    wrapperCommands: { 'typecheck.sh': GRADLE_TYPECHECK, 'test.sh': GRADLE_TEST },
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });
});

/** The opening of `noteAnchoredFamily`'s note — the trace a family anchored below the root leaves. */
const FAMILY_ANCHORING_NOTE = 'commands.typecheck and commands.test were derived from';

/**
 * The Maven lines this stack expects, spelled once so the three keys cannot drift apart.
 *
 * These three are the **wrapper-absent** arm: `mvn` from `PATH`, which is what a project shipping no
 * `mvnw` gets. Cases (r) and (I) are the two that assert them, and neither seeds a wrapper.
 */
const MAVEN_TYPECHECK = 'mvn -q -B compile';
const MAVEN_TEST = 'mvn -q -B test';
const MAVEN_DEP_INSTALL = 'mvn -q -B dependency:go-offline';

/** The same three keys when the project ships a root `mvnw` — case (r2)'s arm. */
const MAVEN_WRAPPER_TYPECHECK = './mvnw -q -B compile';
const MAVEN_WRAPPER_TEST = './mvnw -q -B test';
const MAVEN_WRAPPER_DEP_INSTALL = './mvnw -q -B dependency:go-offline';

/**
 * The same three keys for a wrapper-shipping project **below** the root — case (r3)'s arm.
 *
 * Spelled in full rather than composed, so the claim is readable as one string: the runner
 * (`./service/mvnw`) and the `-f` anchor (`service/pom.xml`) name the **same** directory.
 */
const MAVEN_NESTED_TYPECHECK = './service/mvnw -q -B -f service/pom.xml compile';
const MAVEN_NESTED_TEST = './service/mvnw -q -B -f service/pom.xml test';
const MAVEN_NESTED_DEP_INSTALL = './service/mvnw -q -B -f service/pom.xml dependency:go-offline';

/**
 * The same three keys when the POM is below the root and the **only** wrapper is at the root — case
 * (r4)'s arm.
 *
 * The runner is the root `./mvnw` and the anchor is still `service/pom.xml`: `-f` names the tree, so a
 * root wrapper builds the same project a co-located one would. The claim these strings carry is that
 * such a repository gets a wrapper at all, rather than `mvn` from `PATH` and exit 127 where no system
 * Maven is installed.
 */
const MAVEN_ROOT_WRAPPER_NESTED_TYPECHECK = './mvnw -q -B -f service/pom.xml compile';
const MAVEN_ROOT_WRAPPER_NESTED_TEST = './mvnw -q -B -f service/pom.xml test';
const MAVEN_ROOT_WRAPPER_NESTED_DEP_INSTALL = './mvnw -q -B -f service/pom.xml dependency:go-offline';

/**
 * The Gradle JVM pair when the manifest is below the root and the wrapper sits **beside** it — case
 * (s2) — and when the only wrapper is at the **root** — case (s3).
 *
 * The Maven constants above carry the same two claims for `-f`; these are the `-p` counterparts, and
 * the first assertions in this file over any `-p` Gradle line. Spelled in full so the runner and the
 * anchor are read as one string: a wrapper resolved from the wrong directory fails here.
 */
const GRADLE_NESTED_TYPECHECK = './service/gradlew -p service --console=plain --quiet classes';
const GRADLE_NESTED_TEST = './service/gradlew -p service --console=plain --quiet test';
const GRADLE_ROOT_WRAPPER_NESTED_TYPECHECK = './gradlew -p service --console=plain --quiet classes';
const GRADLE_ROOT_WRAPPER_NESTED_TEST = './gradlew -p service --console=plain --quiet test';

/**
 * The JVM stack: one preset reached by two rows, and the row order that keeps Android out of it.
 *
 * **The rule these cases exist to enforce: `jvm` is a layer profile both build tools share, and the
 * build tool is decided by the command family alone.** Cases (r) and (s) are the two rows — the same
 * preset, the same single `main` layer, different runners — and (t) is the ordering control: an
 * Android repository carries the very Gradle manifests row `jvm:gradle-manifest` matches on, so the
 * only thing keeping it on `android-gradle` is that its row is evaluated above these two. A
 * reordering would move every Android adopter to `jvm` and to `classes`, which compiles nothing in
 * an Android module, and no other case in this file would notice.
 */
test('a JVM repository gets the jvm preset from either build tool, and Android keeps its own', async (t) => {
  await stackCase(t, {
    // (r) The Maven row. `depInstall` is asserted as a value rather than as an absence: it is the one
    // key this family resolves that the Gradle one does not, because Maven's local repository is
    // warmed once per worktree and Gradle's resolution happens inside the task. `mvnw` is deliberately
    // **not** seeded here — (r2) is where the wrapper spelling is asserted — so this is the `mvn`
    // fallback arm.
    name: 'a Maven service',
    seed: {
      'pom.xml': '<project><artifactId>fixture</artifactId></project>\n',
      'src/main/java/com/example/fixture/Application.java': 'package com.example.fixture;\n',
      'src/test/java/com/example/fixture/ApplicationTest.java': 'package com.example.fixture;\n',
    },
    preset: 'jvm',
    signal: 'jvm:maven-manifest',
    layers: ['main', 'tests', 'general'],
    layerPaths: { main: 'src/main/java', tests: 'src/test' },
    wrapperCommands: { 'typecheck.sh': MAVEN_TYPECHECK, 'test.sh': MAVEN_TEST },
    commands: { depInstall: MAVEN_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (r2) The wrapper arm, and the Maven norm: `mvn -N wrapper:wrapper` commits `mvnw`, so a project
    // shipping one often has no `mvn` on `PATH` at all. The seeded `mvnw` is the **only** difference
    // from (r), and it is what selects `./mvnw` over `mvn` from `PATH` — the sentence cases (p) and
    // (s) already carry for Gradle. All three keys move together, `depInstall` included.
    name: 'a Maven service that ships its own wrapper',
    seed: {
      'pom.xml': '<project><artifactId>fixture</artifactId></project>\n',
      mvnw: '#!/bin/sh\nexit 0\n',
      'src/main/java/com/example/fixture/Application.java': 'package com.example.fixture;\n',
      'src/test/java/com/example/fixture/ApplicationTest.java': 'package com.example.fixture;\n',
    },
    preset: 'jvm',
    signal: 'jvm:maven-manifest',
    layers: ['main', 'tests', 'general'],
    layerPaths: { main: 'src/main/java', tests: 'src/test' },
    wrapperCommands: { 'typecheck.sh': MAVEN_WRAPPER_TYPECHECK, 'test.sh': MAVEN_WRAPPER_TEST },
    commands: { depInstall: MAVEN_WRAPPER_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [FAMILY_ANCHORING_NOTE]: 0, [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (r3) The nested arm, and the co-location **preference**: the wrapper beside the POM belongs to
    // the project these lines build, so it wins whenever it exists. The asserted strings carry the
    // runner (`./service/mvnw`) and the anchor (`-f service/pom.xml`) as one string, so a wrapper
    // resolved from the wrong directory fails here. (r4) is the fallback this preference sits above.
    // `initArgs` is required rather than chosen: a nested manifest is only inside `manifestRoots`
    // when `init` is told where the application sits, so this case cannot assert what a bare `init`
    // makes of the tree.
    name: 'a Maven service below the repository root, with its wrapper beside its POM',
    seed: {
      'service/pom.xml': '<project><artifactId>fixture</artifactId></project>\n',
      'service/mvnw': '#!/bin/sh\nexit 0\n',
      'service/src/main/java/com/example/fixture/Application.java': 'package com.example.fixture;\n',
      'service/src/test/java/com/example/fixture/ApplicationTest.java': 'package com.example.fixture;\n',
    },
    initArgs: ['--app-dir', 'service'],
    preset: 'jvm',
    signal: 'jvm:maven-manifest',
    layers: ['main', 'tests', 'general'],
    layerPaths: { main: 'service/src/main/java', tests: 'service/src/test' },
    wrapperCommands: { 'typecheck.sh': MAVEN_NESTED_TYPECHECK, 'test.sh': MAVEN_NESTED_TEST },
    commands: { depInstall: MAVEN_NESTED_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [FAMILY_ANCHORING_NOTE]: 1, [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (r4) The fallback arm (r3) cannot reach: the same nested POM, with the wrapper at the **root**
    // instead of beside it. `mvn -N wrapper:wrapper` writes `mvnw` beside the POM it is run against,
    // so this is the uncommon layout — a repository keeping tooling at the root with the service one
    // level down — and it is the one where a single-path probe silently falls back to `mvn` from
    // `PATH` and exits 127 on a machine with no system Maven. The asserted strings pair the root
    // runner with the nested anchor, which is what proves the probe tried both locations.
    name: 'a Maven service below the repository root, with only a root wrapper',
    seed: {
      'service/pom.xml': '<project><artifactId>fixture</artifactId></project>\n',
      mvnw: '#!/bin/sh\nexit 0\n',
      'service/src/main/java/com/example/fixture/Application.java': 'package com.example.fixture;\n',
      'service/src/test/java/com/example/fixture/ApplicationTest.java': 'package com.example.fixture;\n',
    },
    initArgs: ['--app-dir', 'service'],
    preset: 'jvm',
    signal: 'jvm:maven-manifest',
    layers: ['main', 'tests', 'general'],
    layerPaths: { main: 'service/src/main/java', tests: 'service/src/test' },
    wrapperCommands: {
      'typecheck.sh': MAVEN_ROOT_WRAPPER_NESTED_TYPECHECK,
      'test.sh': MAVEN_ROOT_WRAPPER_NESTED_TEST,
    },
    commands: { depInstall: MAVEN_ROOT_WRAPPER_NESTED_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [FAMILY_ANCHORING_NOTE]: 1, [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (s) The Gradle row, reached by the same preset. It ships a `gradlew`, which is what selects the
    // wrapper over `gradle` from `PATH`, and carries `src/main/kotlin` with no `java` beside it,
    // which is what selects the second source-root candidate. No `depInstall`: Gradle resolves as
    // part of the task being run, so a separate install would pay the same download twice.
    name: 'a Gradle JVM service',
    seed: {
      'settings.gradle': "rootProject.name = 'fixture'\n",
      'build.gradle': "plugins { id 'java' }\n",
      gradlew: '#!/bin/sh\nexit 0\n',
      'src/main/kotlin/com/example/fixture/Application.kt': '',
    },
    preset: 'jvm',
    signal: 'jvm:gradle-manifest',
    layers: ['main', 'general'],
    layerPaths: { main: 'src/main/kotlin' },
    wrapperCommands: {
      'typecheck.sh': './gradlew --console=plain --quiet classes',
      'test.sh': './gradlew --console=plain --quiet test',
    },
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (s2) The nested Gradle arm, and the co-location preference (r3) asserts for Maven. The runner
    // and the `-p` anchor are asserted as one string, so a wrapper resolved from the wrong directory
    // fails here. `initArgs` is required for (r3)'s reason: a nested manifest is only inside
    // `manifestRoots` when `init` is told where the application sits.
    name: 'a Gradle JVM service below the repository root, with its wrapper beside its manifest',
    seed: {
      'service/settings.gradle': "rootProject.name = 'fixture'\n",
      'service/build.gradle': "plugins { id 'java' }\n",
      'service/gradlew': '#!/bin/sh\nexit 0\n',
      gradlew: '#!/bin/sh\nexit 0\n',
      'service/src/main/kotlin/com/example/fixture/Application.kt': '',
    },
    initArgs: ['--app-dir', 'service'],
    preset: 'jvm',
    signal: 'jvm:gradle-manifest',
    layers: ['main', 'general'],
    layerPaths: { main: 'service/src/main/kotlin' },
    wrapperCommands: { 'typecheck.sh': GRADLE_NESTED_TYPECHECK, 'test.sh': GRADLE_NESTED_TEST },
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [FAMILY_ANCHORING_NOTE]: 1, [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (s3) The root-wrapper fallback, (r4)'s claim on the Gradle side: the same nested manifest with
    // the wrapper at the root only. Without the second candidate this emits `gradle` from `PATH` and
    // exits 127 on a machine with no system Gradle. This arm and (s2) are what pin the candidate
    // order for the `-p` families; (r3)/(r4) pin it only for `-f`.
    name: 'a Gradle JVM service below the repository root, with only a root wrapper',
    seed: {
      'service/settings.gradle': "rootProject.name = 'fixture'\n",
      'service/build.gradle': "plugins { id 'java' }\n",
      gradlew: '#!/bin/sh\nexit 0\n',
      'service/src/main/kotlin/com/example/fixture/Application.kt': '',
    },
    initArgs: ['--app-dir', 'service'],
    preset: 'jvm',
    signal: 'jvm:gradle-manifest',
    layers: ['main', 'general'],
    layerPaths: { main: 'service/src/main/kotlin' },
    wrapperCommands: {
      'typecheck.sh': GRADLE_ROOT_WRAPPER_NESTED_TYPECHECK,
      'test.sh': GRADLE_ROOT_WRAPPER_NESTED_TEST,
    },
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [FAMILY_ANCHORING_NOTE]: 1, [ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (t) The ordering control. This tree carries `settings.gradle.kts` and `build.gradle.kts` —
    // everything `jvm:gradle-manifest` matches on — and still answers `android-gradle`, because its
    // `AndroidManifest.xml` row is evaluated above both JVM rows and the Android command family is
    // registered above both JVM families. Both halves are asserted: the signal names the row, and
    // the per-variant task names name the family.
    name: 'an Android repository carrying the Gradle manifests still answers android-gradle',
    seed: {
      'settings.gradle.kts': SETTINGS_GRADLE,
      'build.gradle.kts': 'plugins { }\n',
      'app/build.gradle.kts': 'plugins { id("com.android.application") }\n',
      'app/src/main/AndroidManifest.xml': ANDROID_MANIFEST_XML,
      'app/src/main/java/com/example/fixture/MainActivity.kt': '',
    },
    preset: 'android-gradle',
    signal: 'android-gradle:android-manifest',
    layers: ['app', 'general'],
    layerPaths: { app: 'app/src/main/java' },
    wrapperCommands: { 'typecheck.sh': GRADLE_TYPECHECK, 'test.sh': GRADLE_TEST },
    absentCommands: ['build', 'devServer', 'depInstall'],
  });
});

/** A minimal but real solution and project file, so no fixture is matching on an empty placeholder. */
const SOLUTION_FILE = 'Microsoft Visual Studio Solution File, Format Version 12.00\n';
/** The `.slnx` equivalent — the XML solution format the .NET 9 SDK ships and `dotnet sln migrate` writes. */
const SOLUTION_XML_FILE = '<Solution><Project Path="src/MyApp.Api/MyApp.Api.csproj" /></Solution>\n';
const PROJECT_FILE = '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>\n';

/** The .NET lines at the repository root, spelled once so the three keys cannot drift apart. */
const DOTNET_TYPECHECK = 'dotnet build --nologo';
const DOTNET_TEST = 'dotnet test --nologo';
const DOTNET_DEP_INSTALL = 'dotnet restore';

/**
 * The .NET stack: one preset for a backend and a frontend, and the locator's three steps.
 *
 * **The rule cases (u) and (v) exist to enforce is the one-preset decision, and they enforce it by
 * being identical.** A .NET backend and a .NET frontend share the build tool, the `*.sln`/`*.slnx`
 * and `*.csproj` manifests and the `src/` source root, so every assertion below is the same for both
 * and only the seed differs — which is *evidence* for collapsing them rather than an assertion that
 * they are collapsed. What would tell them apart is the optional-phase set, and `buildConfig` takes
 * that from `init`'s flags rather than from the preset, so a split preset could not deliver it.
 *
 * `build` is asserted **absent** on both, so a later change that starts emitting an MSBuild line —
 * duplicating the compile `typecheck` already runs, in a key no agent invokes — fails here.
 */
test('a .NET backend and a .NET frontend answer the same preset, layers and commands', async (t) => {
  await stackCase(t, {
    // (u) The backend. `src/MyApp.Domain/` is deliberate: PascalCase, dot-suffixed project names
    // never match `findLayeredRoot`'s three fixed lowercase names, so this tree is **not** claimed
    // by the layered row far above, and `src/MyApp.Api/Controllers/` is two levels under `src/`
    // where `findApiDir` looks exactly one, so the api row does not claim it either.
    name: 'a .NET backend solution',
    seed: {
      'MyApp.sln': SOLUTION_FILE,
      'src/MyApp.Api/MyApp.Api.csproj': PROJECT_FILE,
      'src/MyApp.Api/Controllers/HomeController.cs': 'namespace MyApp.Api.Controllers;\n',
      'src/MyApp.Domain/MyApp.Domain.csproj': PROJECT_FILE,
      'tests/MyApp.Api.Tests/MyApp.Api.Tests.csproj': PROJECT_FILE,
    },
    preset: 'dotnet',
    signal: 'dotnet:solution-or-project',
    evidence: 'MyApp.sln',
    layers: ['src', 'tests', 'general'],
    layerPaths: { src: 'src', tests: 'tests' },
    wrapperCommands: { 'typecheck.sh': DOTNET_TYPECHECK, 'test.sh': DOTNET_TEST },
    commands: { depInstall: DOTNET_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (v) The frontend, asserted identically. `Pages/` and `wwwroot/` are what make it a front end
    // and they change nothing detection reads — which is the point of the pair.
    name: 'a .NET frontend solution',
    seed: {
      'MyApp.sln': SOLUTION_FILE,
      'src/MyApp.Web/MyApp.Web.csproj': PROJECT_FILE,
      'src/MyApp.Web/Pages/Index.cshtml': '@page\n',
      'src/MyApp.Web/wwwroot/site.css': 'body { }\n',
    },
    preset: 'dotnet',
    signal: 'dotnet:solution-or-project',
    evidence: 'MyApp.sln',
    layers: ['src', 'general'],
    layerPaths: { src: 'src' },
    wrapperCommands: { 'typecheck.sh': DOTNET_TYPECHECK, 'test.sh': DOTNET_TEST },
    commands: { depInstall: DOTNET_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (w) The locator's last step: no solution anywhere, so the project one level under `src/` is
    // what answers — and being below the repository root, it is named on all three lines, since
    // every configured command runs from the root and a bare `dotnet build` there finds no project.
    name: 'a .NET repository with no solution file',
    seed: {
      'src/MyApp.Api/MyApp.Api.csproj': PROJECT_FILE,
      'src/MyApp.Api/Program.cs': 'return 0;\n',
    },
    preset: 'dotnet',
    signal: 'dotnet:solution-or-project',
    evidence: 'src/MyApp.Api/MyApp.Api.csproj',
    layers: ['src', 'general'],
    layerPaths: { src: 'src' },
    wrapperCommands: {
      'typecheck.sh': `${DOTNET_TYPECHECK} src/MyApp.Api/MyApp.Api.csproj`,
      'test.sh': `${DOTNET_TEST} src/MyApp.Api/MyApp.Api.csproj`,
    },
    commands: { depInstall: `${DOTNET_DEP_INSTALL} src/MyApp.Api/MyApp.Api.csproj` },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 1 },
  });

  await stackCase(t, {
    // (x) The reproducibility claim the detection header makes, on the one locator in this file
    // that chooses between files: a solution wins over a project **even when the project sorts
    // first**, and two solutions in one root resolve to the sorted-first of them. Only
    // `detection.evidence` can tell these apart — the preset, the layers and the commands are the
    // same whichever file was picked. No `src/`, so the profile is `general` alone, which keeps the
    // seed to exactly the files the choice is being made between.
    name: 'a .NET root holding two solutions and a project',
    seed: { 'Aardvark.csproj': PROJECT_FILE, 'Beta.sln': SOLUTION_FILE, 'Alpha.sln': SOLUTION_FILE },
    preset: 'dotnet',
    signal: 'dotnet:solution-or-project',
    evidence: 'Alpha.sln',
    layers: ['general'],
    wrapperCommands: { 'typecheck.sh': DOTNET_TYPECHECK, 'test.sh': DOTNET_TEST },
    commands: { depInstall: DOTNET_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (y) The migrated repository: its only solution is a `.slnx`, the XML format the .NET 9 SDK
    // ships. The assertion is `evidence`, and specifically that it is **not** the nested
    // `.csproj` — a suffix list that stopped at `.sln` still answers `dotnet` here, by falling
    // through to the locator's third step, so only naming the solution as the target distinguishes
    // a matched `.slnx` from an unmatched one. Naming the solution is what makes the emitted lines
    // build every project rather than the one, which is why the wrapper lines are bare: a solution
    // at the repository root needs no path argument.
    name: 'a .NET repository whose only solution is a .slnx',
    seed: {
      'MyApp.slnx': SOLUTION_XML_FILE,
      'src/MyApp.Api/MyApp.Api.csproj': PROJECT_FILE,
      'src/MyApp.Domain/MyApp.Domain.csproj': PROJECT_FILE,
    },
    preset: 'dotnet',
    signal: 'dotnet:solution-or-project',
    evidence: 'MyApp.slnx',
    layers: ['src', 'general'],
    layerPaths: { src: 'src' },
    wrapperCommands: { 'typecheck.sh': DOTNET_TYPECHECK, 'test.sh': DOTNET_TEST },
    commands: { depInstall: DOTNET_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });
});

/** A minimal but real SwiftPM manifest, so no fixture is matching on an empty placeholder. */
const SWIFT_MANIFEST = `// swift-tools-version:5.9
import PackageDescription
let package = Package(name: "MyApp", targets: [.target(name: "MyApp")])
`;

/** The two lines `xcshareddata` is missing from, spelled once so the pair cannot drift apart. */
const SWIFT_TYPECHECK = 'swift build';
const SWIFT_TEST = 'swift test';
const SWIFT_DEP_INSTALL = 'swift package resolve';
const SWIFT_NESTED_TYPECHECK = 'swift build --package-path app';
const SWIFT_NESTED_TEST = 'swift test --package-path app';
const SWIFT_NESTED_DEP_INSTALL = 'swift package resolve --package-path app';

/** A minimal Xcode project file and shared scheme — enough to be found, and never parsed. */
const PBXPROJ = '// !$*UTF8*$!\n{ objects = { }; rootObject = ""; }\n';
const XCSCHEME = '<?xml version="1.0" encoding="UTF-8"?>\n<Scheme LastUpgradeVersion="1500"></Scheme>\n';

/** The distinguishing clause of the Xcode arm's note — the trace the one hand-written key leaves. */
const XCODE_DESTINATION_NOTE = '`xcodebuild test` requires a `-destination`';

/** The undetected-command warning's opening, per key — the placeholder's own adopter-visible trace. */
const undetectedWarning = (key) => `commands.${key} could not be detected`;

/**
 * The gate clause of that warning's partial-resolution arm, and the falsified form it replaced.
 *
 * `familyTiebreakNote` states the same gate on the note channel, so two adopter-visible strings
 * describe one rule and nothing but this pair stops them drifting apart (`detect/presets.ts`,
 * `undetectedCommandWarning`). The negative is the half that bites: *the first family whose manifest
 * is present* is a plausible sentence that resolves no differently on any fixture here, so no other
 * assertion in this file would reject a revert to it.
 */
const FAMILY_GATE_CLAUSE = 'derivation returns a command set';
const FALSIFIED_FAMILY_GATE_CLAUSE = 'whose manifest is present';

/** `writeWrapperScripts`' report that a placeholder key got no wrapper and no allow-list entry. */
const noWrapperWarning = (file) => `so no ${file} was written and none is allow-listed`;

/**
 * The Apple-native stack: one preset for two toolchains, and the one command key on this matrix
 * that stays hand-written.
 *
 * **The rule these cases exist to enforce: an entry that cannot be derived from a file stays a
 * placeholder, and ambiguity is not resolved by picking.** Case (aa) is the whole of it — a
 * container sharing two schemes yields two placeholders rather than the sorted-first scheme, because
 * `-scheme` takes one name and choosing among several is a judgement rather than something file
 * existence answers. That claim has no other falsifiable trace: a run that quietly started picking
 * would produce a perfectly plausible command line and fail no other assertion in this file.
 *
 * (z) is the half that *can* be derived — exactly one shared scheme — and it also carries the layer
 * claim that is unique to this preset: the layer is named `sources` while its path is `MyApp`, since
 * the name is the routing tag the schema constrains and the path is the spelling on disk.
 */
test('an Apple-native repository derives what its files state and leaves the rest hand-written', async (t) => {
  await stackCase(t, {
    // (y) The SwiftPM arm, which is the only one of the two that serves both required keys: both
    // lines need nothing but the manifest. `depInstall` is `swift package resolve`, so the fetch is
    // paid once per worktree by `setup-worktree.sh` rather than inside that worktree's first build.
    name: 'a Swift package',
    seed: {
      'Package.swift': SWIFT_MANIFEST,
      'Sources/MyApp/MyApp.swift': 'public struct MyApp {}\n',
      'Tests/MyAppTests/MyAppTests.swift': 'import XCTest\n',
    },
    preset: 'apple-native',
    signal: 'apple-native:swift-package-or-xcode-project',
    evidence: 'Package.swift',
    layers: ['sources', 'tests', 'general'],
    layerPaths: { sources: 'Sources', tests: 'Tests' },
    wrapperCommands: { 'typecheck.sh': SWIFT_TYPECHECK, 'test.sh': SWIFT_TEST },
    commands: { depInstall: SWIFT_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0, [XCODE_DESTINATION_NOTE]: 0 },
  });

  await stackCase(t, {
    // (y2) The same arm below the repository root, which is where the anchor is falsifiable: all
    // three lines are composed from one `packagePath`, so a `depInstall` that dropped it would still
    // pass (y) and resolve the wrong tree here. `initArgs` is required rather than chosen — a nested
    // manifest only enters `manifestRoots` when `init` is told where the application sits.
    name: 'a Swift package below the repository root',
    seed: {
      'app/Package.swift': SWIFT_MANIFEST,
      'app/Sources/MyApp/MyApp.swift': 'public struct MyApp {}\n',
      'app/Tests/MyAppTests/MyAppTests.swift': 'import XCTest\n',
    },
    initArgs: ['--app-dir', 'app'],
    preset: 'apple-native',
    signal: 'apple-native:swift-package-or-xcode-project',
    layers: ['sources', 'tests', 'general'],
    layerPaths: { sources: 'app/Sources', tests: 'app/Tests' },
    wrapperCommands: { 'typecheck.sh': SWIFT_NESTED_TYPECHECK, 'test.sh': SWIFT_NESTED_TEST },
    commands: { depInstall: SWIFT_NESTED_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [FAMILY_ANCHORING_NOTE]: 1, [ANCHORING_NOTE]: 0, [XCODE_DESTINATION_NOTE]: 0 },
  });

  await stackCase(t, {
    // (z) The Xcode arm at its best case: exactly one shared scheme, so `typecheck` is derivable and
    // `test` still is not. Both halves are asserted on the adopter-visible surface — the wrapper that
    // was written, and the two warnings the placeholder raises: the key was not detected, and no
    // `test.sh` exists for it. `MyApp/` rather than `Sources/`, so the stem arm of `appleSourceDir`
    // is what names the layer and the name/path divergence is under test rather than assumed.
    name: 'an Xcode project sharing exactly one scheme',
    seed: {
      'MyApp.xcodeproj/project.pbxproj': PBXPROJ,
      'MyApp.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme': XCSCHEME,
      'MyApp/AppDelegate.swift': 'import UIKit\n',
    },
    preset: 'apple-native',
    signal: 'apple-native:swift-package-or-xcode-project',
    evidence: 'MyApp.xcodeproj',
    layers: ['sources', 'general'],
    layerPaths: { sources: 'MyApp' },
    wrapperCommands: { 'typecheck.sh': 'xcodebuild -project MyApp.xcodeproj -scheme MyApp build' },
    placeholderCommands: ['test'],
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [XCODE_DESTINATION_NOTE]: 1 },
    warningCounts: {
      [undetectedWarning('typecheck')]: 0,
      [undetectedWarning('test')]: 1,
      [noWrapperWarning('test.sh')]: 1,
    },
  });

  await stackCase(t, {
    // (aa) The reproducibility claim, and the reason this test exists. Two shared schemes, so
    // **neither** key is derived — the sorted-first scheme is not picked, and the note says so.
    name: 'an Xcode project sharing two schemes resolves neither key',
    seed: {
      'MyApp.xcodeproj/project.pbxproj': PBXPROJ,
      'MyApp.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme': XCSCHEME,
      'MyApp.xcodeproj/xcshareddata/xcschemes/MyAppStaging.xcscheme': XCSCHEME,
      'MyApp/AppDelegate.swift': 'import UIKit\n',
    },
    preset: 'apple-native',
    signal: 'apple-native:swift-package-or-xcode-project',
    evidence: 'MyApp.xcodeproj',
    layers: ['sources', 'general'],
    layerPaths: { sources: 'MyApp' },
    placeholderCommands: ['typecheck', 'test'],
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { 'shares 2 schemes (MyApp, MyAppStaging)': 1, [XCODE_DESTINATION_NOTE]: 1 },
    warningCounts: { [undetectedWarning('typecheck')]: 1, [undetectedWarning('test')]: 1 },
  });
});

/**
 * The Rust stack: one manifest, one toolchain, and a type check that is not the cheap default.
 *
 * **The rule this case exists to enforce: `typecheck` is the format check and the linter, and it
 * carries `--all-targets` and `-D warnings`.** Drop `--all-targets` and a repository whose tests do
 * not compile passes the cheap key and fails the expensive one; drop `-D warnings` and clippy exits
 * zero on every lint it reports. No other assertion in this file would notice either loss, because
 * each shorter line is a perfectly plausible one. {@link CARGO_LINT_NOTE} is asserted with it: the
 * line is only half the change, since an adopter who is not told what `-D warnings` does reads a red
 * key as a broken harness.
 *
 * The three keys and the two absences are the rest of the claim: `cargo fetch` warms the dependency
 * graph once per worktree, while `build` and `devServer` are absent rather than placeholders, since
 * a `cargo build` would recompile what the type check already compiled and a crate has no dev server.
 * The npm half of the ordering is case (c) of the family-order test above, which asserts these same
 * three lines on a tree that also carries a root `package.json`.
 *
 * **Case (b) is the decision this row makes and rows 14 and 16 make the other way**, executable so
 * that reversing it fails a test rather than only contradicting a comment.
 */
test('a Rust crate gets the Cargo commands, with the type check that covers its tests', async (t) => {
  await stackCase(t, {
    // (a) The stack on its own: no other manifest in the tree, so nothing about the answer is a
    // choice between families.
    name: 'a plain Rust crate',
    seed: {
      'Cargo.toml': CARGO_TOML,
      'Cargo.lock': 'version = 3\n',
      'src/main.rs': 'fn main() {}\n',
    },
    preset: 'rust-cargo',
    signal: 'rust-cargo:cargo-manifest',
    evidence: CARGO_MANIFEST,
    layers: ['src', 'general'],
    layerPaths: { src: 'src' },
    wrapperCommands: { 'typecheck.sh': CARGO_TYPECHECK, 'test.sh': CARGO_TEST },
    commands: { depInstall: CARGO_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0, [CARGO_LINT_NOTE]: 1 },
  });

  await stackCase(t, {
    // (b) **The npm package with a Rust core — the inverse framing of case (c) above, and the
    // population row 13 is deliberately *not* guarded for.** A napi-rs / neon addon declares all
    // three npm scripts and carries a `Cargo.toml`, so the row moves it off `flat`, hoists `cargo`,
    // and every assertion below is the price: the declared `build` script is absent because the
    // Cargo family resolved first and the search stops there, and `depInstall` is `cargo fetch`
    // rather than the `npm ci` the root fallback would have emitted — no worktree the flow cuts
    // gets `node_modules`. It is accepted because `cargo clippy --all-targets` and `cargo test`
    // verify the crate that is really in the tree, which is what rows 14 and 16 could not say of
    // `bundle install` and `ctest` (`src/detect/signals.ts`, `rust-cargo:cargo-manifest`). Guarding
    // this row would flip every line here to the npm ones — which is what makes the case
    // falsifiable rather than decorative.
    name: 'a napi-rs addon whose root package.json declares scripts answers with Cargo',
    seed: {
      'Cargo.toml': CARGO_TOML,
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test', build: 'echo build' }),
      'package-lock.json': { name: 'fixture-project', lockfileVersion: 3, requires: true, packages: {} },
      'src/lib.rs': 'pub fn fixture() {}\n',
      'index.d.ts': 'export declare function fixture(): void;\n',
    },
    preset: 'rust-cargo',
    signal: 'rust-cargo:cargo-manifest',
    evidence: CARGO_MANIFEST,
    layers: ['src', 'general'],
    layerPaths: { src: 'src' },
    wrapperCommands: { 'typecheck.sh': CARGO_TYPECHECK, 'test.sh': CARGO_TEST },
    commands: { depInstall: CARGO_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    warningCounts: { [undetectedWarning('typecheck')]: 0, [undetectedWarning('test')]: 0 },
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (b2) The nested arm, which is where the anchor is falsifiable — (a) and (b) both seed a root
    // manifest, where the anchor is the empty string. The type check is the reason this case exists:
    // it is a compound whose two halves each run from the repository root, so a line anchoring only
    // the clippy half passes every case above and silently format-checks the root manifest here.
    // `initArgs` is required rather than chosen: a nested manifest only enters `manifestRoots` when
    // `init` is told where the application sits.
    name: 'a Rust crate below the repository root anchors both halves of the type check',
    seed: {
      'crate/Cargo.toml': CARGO_TOML,
      'crate/src/lib.rs': 'pub fn fixture() {}\n',
    },
    initArgs: ['--app-dir', 'crate'],
    preset: 'rust-cargo',
    signal: 'rust-cargo:cargo-manifest',
    layers: ['src', 'general'],
    layerPaths: { src: 'crate/src' },
    wrapperCommands: { 'typecheck.sh': CARGO_NESTED_TYPECHECK, 'test.sh': CARGO_NESTED_TEST },
    commands: { depInstall: CARGO_NESTED_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [FAMILY_ANCHORING_NOTE]: 1, [ANCHORING_NOTE]: 0, [CARGO_LINT_NOTE]: 1 },
  });
});

/**
 * The Ruby fixture files and the four lines a Bundler-managed repository resolves.
 *
 * A minimal but real `Gemfile` and `Rakefile`, and a `.rubocop.yml` that configures nothing —
 * existence is the whole test on all three, so a fuller file would assert nothing more and would
 * invite a reader to think a key inside it was read.
 */
const GEMFILE = "source 'https://rubygems.org'\n";
const RAKEFILE = "task default: :test\n";
const RUBOCOP_CONFIG = 'AllCops:\n  NewCops: enable\n';
const BUNDLER_RUBOCOP = 'bundle exec rubocop';
const BUNDLER_RSPEC = 'bundle exec rspec';
const BUNDLER_RAKE_TEST = 'bundle exec rake test';
const BUNDLER_DEP_INSTALL = 'bundle install';

/**
 * The Ruby stack: a test runner chosen by directory existence, and a type check that is emitted only
 * where the repository configures one.
 *
 * **The rule these cases exist to enforce: `typecheck` stays a placeholder where no RuboCop
 * configuration is present.** Ruby has no type checker in the general case, so any line put there
 * by default would be a step that verifies nothing while reporting success on every task — and no
 * other assertion in this file would notice, since a plausible-looking line passes them all. The
 * third case is that claim's other half: with a `.rubocop.yml` present the key resolves, so the
 * absence in case (b) is evidence about the repository rather than a family that never emits it.
 *
 * **Case (a) is the ordering control for the whole preset-independent command family.** A
 * Rails-shaped repository matches `api-service:route-directory` on its `app/controllers` far above
 * the Bundler row, so it keeps that preset and that layer profile — and gets the `bundle exec` lines
 * anyway, because the family is selected independently of the preset. Preset and layers identical to
 * what this tree answered before the Bundler family existed; the three commands are what is new.
 */
test('a Ruby repository gets the Bundler commands, and only the checks its own tree evidences', async (t) => {
  await stackCase(t, {
    // (a) Rails: the row above wins, the commands come from the family below it.
    name: 'a Rails application keeps api-service and gains the Bundler commands',
    seed: {
      Gemfile: GEMFILE,
      Rakefile: RAKEFILE,
      '.rubocop.yml': RUBOCOP_CONFIG,
      'app/controllers/application_controller.rb': 'class ApplicationController; end\n',
      'app/models/user.rb': 'class User; end\n',
      'spec/models/user_spec.rb': "require 'spec_helper'\n",
    },
    preset: 'api-service',
    signal: 'api-service:route-directory',
    layers: ['api', 'general'],
    layerPaths: { api: 'app/controllers' },
    wrapperCommands: { 'typecheck.sh': BUNDLER_RUBOCOP, 'test.sh': BUNDLER_RSPEC },
    commands: { depInstall: BUNDLER_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (b) A plain gem with no RuboCop configuration: `typecheck` is a placeholder **and** a warning,
    // while `test` resolves to the Minitest line its `test/` directory evidences.
    name: 'a gem without a RuboCop configuration leaves typecheck unresolved',
    seed: {
      Gemfile: GEMFILE,
      Rakefile: RAKEFILE,
      'lib/fixture.rb': 'module Fixture; end\n',
      'test/fixture_test.rb': "require 'minitest/autorun'\n",
    },
    preset: 'ruby-bundler',
    signal: 'ruby-bundler:gemfile',
    evidence: BUNDLER_MANIFEST,
    layers: ['lib', 'tests', 'general'],
    layerPaths: { lib: 'lib', tests: 'test' },
    wrapperCommands: { 'test.sh': BUNDLER_RAKE_TEST },
    commands: { depInstall: BUNDLER_DEP_INSTALL },
    placeholderCommands: ['typecheck'],
    absentCommands: ['build', 'devServer'],
    warningCounts: { [undetectedWarning('typecheck')]: 1, [undetectedWarning('test')]: 0 },
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (c) The same gem with a `.rubocop.yml` added, and nothing else changed: the type-check line
    // appears. Case (b)'s placeholder is therefore about this file's absence and nothing else.
    name: 'a gem with a RuboCop configuration resolves the type check',
    seed: {
      Gemfile: GEMFILE,
      Rakefile: RAKEFILE,
      '.rubocop.yml': RUBOCOP_CONFIG,
      'lib/fixture.rb': 'module Fixture; end\n',
      'test/fixture_test.rb': "require 'minitest/autorun'\n",
    },
    preset: 'ruby-bundler',
    signal: 'ruby-bundler:gemfile',
    layers: ['lib', 'tests', 'general'],
    layerPaths: { lib: 'lib', tests: 'test' },
    wrapperCommands: { 'typecheck.sh': BUNDLER_RUBOCOP, 'test.sh': BUNDLER_RAKE_TEST },
    commands: { depInstall: BUNDLER_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    warningCounts: { [undetectedWarning('typecheck')]: 0 },
  });

  await stackCase(t, {
    // (d) **The population a `Gemfile` does not belong to, and the case the guard exists for.** The
    // React Native project template ships a root `Gemfile` to pin CocoaPods and fastlane; nothing
    // about the repository is Ruby. Unguarded it answered `ruby-bundler`, took the `general` layer
    // only, wrote both required keys as placeholders and set `depInstall` to `bundle install` — so
    // every worktree the flow cuts came up with no `node_modules`. Every line below is the answer
    // this tree gives with no `Gemfile` in it at all, which is the whole claim: the file changes
    // nothing.
    name: 'a React Native repository with a root Gemfile is not a Ruby repository',
    seed: {
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test', start: 'echo start' }),
      'package-lock.json': { name: 'fixture-project', lockfileVersion: 3, requires: true, packages: {} },
      'tsconfig.json': {},
      Gemfile: GEMFILE,
      'src/App.tsx': 'export const App = () => null;\n',
      'android/app/src/main/AndroidManifest.xml': '<manifest />\n',
      'ios/Podfile': "platform :ios, '15.1'\n",
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: {
      'typecheck.sh': 'npm run typecheck',
      'test.sh': 'npm test',
      'start-dev-server.sh': 'npm run start',
    },
    commands: { depInstall: 'npm ci' },
    absentCommands: ['build'],
    warningCounts: { [undetectedWarning('typecheck')]: 0, [undetectedWarning('test')]: 0 },
  });

  await stackCase(t, {
    // (e) **The boundary the guard is drawn at, and the case that pays for `bundler` keeping its
    // place above `npm`.** Case (a)'s Rails tree with an asset-pipeline `package.json` added: a
    // Rails application's preset comes from the directory-shaped row, which hoists nothing, so
    // moving the family below `npm` — the other available fix for case (d) — would have answered
    // `npm run build` here. It does not: the guard declines only where the family would answer with
    // `bundle install` and nothing else, and this tree resolves both verifiers. Every command is
    // byte-identical to case (a).
    name: 'a Rails application with a bundled front end keeps the Bundler commands',
    seed: {
      Gemfile: GEMFILE,
      Rakefile: RAKEFILE,
      '.rubocop.yml': RUBOCOP_CONFIG,
      'app/controllers/application_controller.rb': 'class ApplicationController; end\n',
      'app/models/user.rb': 'class User; end\n',
      'spec/models/user_spec.rb': "require 'spec_helper'\n",
      'package.json': rootManifest({ build: 'echo build' }),
    },
    preset: 'api-service',
    signal: 'api-service:route-directory',
    layers: ['api', 'general'],
    layerPaths: { api: 'app/controllers' },
    wrapperCommands: { 'typecheck.sh': BUNDLER_RUBOCOP, 'test.sh': BUNDLER_RSPEC },
    commands: { depInstall: BUNDLER_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
  });

  await stackCase(t, {
    // (f) **Case (d) plus the one directory that used to defeat its guard.** The gate declines only
    // where the family resolved neither verifier, and the Minitest arm once resolved `test` from a
    // bare `test/` — which is `node:test`'s, Mocha's and Ava's directory as much as Minitest's, and
    // is where this very repository keeps its own suite. So this tree answered `bundle exec rake
    // test` with no Ruby and no `Rakefile` in it, stopping the family search above `npm`. Every
    // command below is byte-identical to case (d): the directory changes nothing.
    name: 'a React Native repository with a root Gemfile and a test directory is not a Ruby repository',
    seed: {
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test', start: 'echo start' }),
      'package-lock.json': { name: 'fixture-project', lockfileVersion: 3, requires: true, packages: {} },
      'tsconfig.json': {},
      Gemfile: GEMFILE,
      'src/App.tsx': 'export const App = () => null;\n',
      'test/app.test.ts': "import { test } from 'node:test';\n",
      'android/app/src/main/AndroidManifest.xml': '<manifest />\n',
      'ios/Podfile': "platform :ios, '15.1'\n",
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: {
      'typecheck.sh': 'npm run typecheck',
      'test.sh': 'npm test',
      'start-dev-server.sh': 'npm run start',
    },
    commands: { depInstall: 'npm ci' },
    absentCommands: ['build'],
    warningCounts: { [undetectedWarning('typecheck')]: 0, [undetectedWarning('test')]: 0 },
  });

  await stackCase(t, {
    // (g) **The precondition case (f) rests on, asserted on a repository that is Ruby.** `rake`
    // reads its tasks from a `Rakefile`, so `bundle exec rake test` without one aborts rather than
    // running a suite — the key is left unresolved instead, which is this family's rule for a line
    // the tree does not evidence. Case (b) is the control and is byte-identical but for the
    // `Rakefile`: it resolves the Minitest line, so the file is what decides both this placeholder
    // and case (f)'s npm answer.
    name: 'a gem with a test directory and no Rakefile leaves test unresolved',
    seed: {
      Gemfile: GEMFILE,
      'lib/fixture.rb': 'module Fixture; end\n',
      'test/fixture_test.rb': "require 'minitest/autorun'\n",
    },
    preset: 'ruby-bundler',
    signal: 'ruby-bundler:gemfile',
    layers: ['lib', 'tests', 'general'],
    layerPaths: { lib: 'lib', tests: 'test' },
    commands: { depInstall: BUNDLER_DEP_INSTALL },
    placeholderCommands: ['typecheck', 'test'],
    absentCommands: ['build', 'devServer'],
    warningCounts: { [undetectedWarning('typecheck')]: 1, [undetectedWarning('test')]: 1 },
  });
});

/**
 * The PHP fixture files and the lines a Composer-managed repository resolves.
 *
 * The manifest is the one on this table that is JSON, and it is still the emptiest object that
 * parses: existence is the whole test, so a populated `require` or `autoload` map would assert
 * nothing and would invite a reader to think a key inside it was read. The two analyser
 * configurations and the PHPUnit one are empty for the same reason.
 */
const COMPOSER_JSON = { name: 'fixture/fixture' };
const PHPSTAN_CONFIG = 'parameters:\n  level: 5\n';
const PHPUNIT_CONFIG = '<phpunit />\n';
const COMPOSER_PHPSTAN = 'vendor/bin/phpstan analyse --no-progress';
const COMPOSER_PHPUNIT = 'vendor/bin/phpunit';
const COMPOSER_DEP_INSTALL = 'composer install --no-interaction';

/**
 * The PHP stack: two verifiers emitted only where the repository configures them, and a dependency
 * install that is emitted whether they resolved or not.
 *
 * **The rule these cases exist to enforce: `depInstall` is independent of the two verifiers.** Both
 * `vendor/bin` lines are unrunnable until `composer install` has run, so a family that emitted the
 * install only alongside a resolved verifier would leave the adopter who has to fill the verifiers
 * in by hand with no install either — and case (b) is the only assertion that would notice, since a
 * tree resolving all three (case (a)) proves nothing about the pairing.
 *
 * **Case (c) is the ordering control**, `ruby-bundler`'s case (a) repeated on PHP: a Laravel-shaped
 * repository matches `api-service:route-directory` on its root `routes/` far above the Composer row,
 * so it keeps that preset and `api=routes` — and gets the Composer lines anyway, because the family
 * is selected independently of the preset.
 */
test('a PHP repository gets the Composer commands, and only the checks its own tree evidences', async (t) => {
  await stackCase(t, {
    // (a) A PSR-4 library that configures both verifiers: all three lines resolve.
    name: 'a PSR-4 library with PHPStan and PHPUnit configured',
    seed: {
      'composer.json': COMPOSER_JSON,
      'composer.lock': '{}\n',
      'phpstan.neon': PHPSTAN_CONFIG,
      'phpunit.xml': PHPUNIT_CONFIG,
      'src/Fixture.php': '<?php\nclass Fixture {}\n',
      'tests/FixtureTest.php': '<?php\nclass FixtureTest {}\n',
    },
    preset: 'php-composer',
    signal: 'php-composer:composer-manifest',
    evidence: COMPOSER_MANIFEST,
    layers: ['src', 'tests', 'general'],
    layerPaths: { src: 'src', tests: 'tests' },
    wrapperCommands: { 'typecheck.sh': COMPOSER_PHPSTAN, 'test.sh': COMPOSER_PHPUNIT },
    commands: { depInstall: COMPOSER_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (b) The same library with neither configuration file: both required keys are placeholders and
    // both carry their warning, while `depInstall` is set exactly as in case (a). This is also the
    // partial-resolution arm's fixture — a family that read its manifest, answered one key and left
    // two — so it is where the warning's gate clause is pinned to the wording `familyTiebreakNote`
    // uses, both halves of it: the true clause present on each warning, the falsified one absent.
    name: 'a library configuring no analyser and no test runner still gets the install',
    seed: {
      'composer.json': COMPOSER_JSON,
      'composer.lock': '{}\n',
      'src/Fixture.php': '<?php\nclass Fixture {}\n',
      'tests/FixtureTest.php': '<?php\nclass FixtureTest {}\n',
    },
    preset: 'php-composer',
    signal: 'php-composer:composer-manifest',
    layers: ['src', 'tests', 'general'],
    layerPaths: { src: 'src', tests: 'tests' },
    commands: { depInstall: COMPOSER_DEP_INSTALL },
    placeholderCommands: ['typecheck', 'test'],
    absentCommands: ['build', 'devServer'],
    warningCounts: {
      [undetectedWarning('typecheck')]: 1,
      [undetectedWarning('test')]: 1,
      [FAMILY_GATE_CLAUSE]: 2,
      [FALSIFIED_FAMILY_GATE_CLAUSE]: 0,
    },
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (c) Laravel: the row above wins, the commands come from the family below it.
    name: 'a Laravel application keeps api-service and gains the Composer commands',
    seed: {
      'composer.json': COMPOSER_JSON,
      artisan: '<?php\n',
      'phpstan.neon': PHPSTAN_CONFIG,
      'phpunit.xml': PHPUNIT_CONFIG,
      'app/Http/Controllers/Controller.php': '<?php\nclass Controller {}\n',
      'app/Models/User.php': '<?php\nclass User {}\n',
      'routes/web.php': '<?php\n',
    },
    preset: 'api-service',
    signal: 'api-service:route-directory',
    layers: ['api', 'general'],
    layerPaths: { api: 'routes' },
    wrapperCommands: { 'typecheck.sh': COMPOSER_PHPSTAN, 'test.sh': COMPOSER_PHPUNIT },
    commands: { depInstall: COMPOSER_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });
});

/**
 * The C++ fixture files and the two lines a CMake project resolves.
 *
 * The manifest is the smallest one `cmake` would accept, for the reason every fixture here keeps its
 * seed minimal: existence is the whole test, so a populated target list would assert nothing and
 * would invite a reader to think it was read.
 */
const CMAKE_LISTS = 'cmake_minimum_required(VERSION 3.20)\nproject(fixture CXX)\n';
const CMAKE_TYPECHECK = 'cmake -S . -B build && cmake --build build';
const CMAKE_TEST = `${CMAKE_TYPECHECK} && ctest --test-dir build --output-on-failure`;

/**
 * The CMake family's one cross-key claim, asserted off the fixture rather than off the constants
 * above: the line `test.sh` runs begins with the whole line `typecheck.sh` runs.
 *
 * Nothing in the plugin orders `commands.typecheck` before `commands.test` — every instruction that
 * names both names `<test_cmd>` first — and a worktree `setup-worktree.sh` provisioned holds no
 * build tree, since this family emits no `build` key. So `ctest` on its own would fail on a missing
 * directory before a test executes. The prefix is what makes the key order-independent, and this
 * reads both wrappers so a change to either line that stops them naming the same build tree fails
 * here rather than in an adopter's first test-only task.
 */
function assertCmakeTestIsSelfSufficient({ name, dir }) {
  const typecheck = wrapperCommand(dir, 'typecheck.sh');
  const test = wrapperCommand(dir, 'test.sh');
  assert.ok(
    test.startsWith(`${typecheck} && `),
    `${name}'s test line does not begin with its type-check line, so \`ctest\` runs against a build tree nothing in the flow guarantees exists:\n  typecheck: ${typecheck}\n  test:      ${test}`,
  );
}

/**
 * The C++ stack: a compound type-check line, a test line carrying that same compound as a prefix,
 * and the row ordering that keeps a native extension off this preset.
 *
 * **The rule these cases exist to enforce: `cmake-cpp` is the last manifest row, and a repository of
 * another stack carrying a `CMakeLists.txt` keeps its own preset and its own commands.** Cases (b)
 * and (c) are the whole of it, one per mechanism — a Python distribution with a native extension is
 * the population row *order* exists for, and a `node-gyp` addon the population order cannot reach,
 * since Node has no row above this one to be caught by. Neither has another falsifiable trace: both
 * misdetections produce a perfectly plausible profile, with no warning and no note, and fail nothing
 * else in this file.
 *
 * Case (a) also carries the compound-line claim, asserted where it actually lands: the raw line
 * inside `typecheck.sh`, since `commands.typecheck` holds the wrapper invocation whatever was
 * derived. It carries the prefix claim too, in {@link assertCmakeTestIsSelfSufficient}.
 */
test('a C++ repository gets the CMake and CTest lines, and a native extension does not', async (t) => {
  await stackCase(t, {
    // (a) A CMake project laid out conventionally. `include/` and `tests/` are seeded and each
    // becomes a row, of a different kind: the public headers are a second *source* row on the
    // module rules, the test tree is the `tests` row. `general` stays last.
    name: 'a CMake C++ project',
    seed: {
      'CMakeLists.txt': CMAKE_LISTS,
      'src/main.cpp': 'int main() { return 0; }\n',
      'include/fixture/fixture.hpp': '#pragma once\n',
      'tests/fixture_test.cpp': 'int fixture_test() { return 0; }\n',
    },
    preset: 'cmake-cpp',
    signal: 'cmake-cpp:cmake-lists',
    evidence: CMAKE_MANIFEST,
    layers: ['src', 'include', 'tests', 'general'],
    layerPaths: { src: 'src', include: 'include', tests: 'tests' },
    wrapperCommands: { 'typecheck.sh': CMAKE_TYPECHECK, 'test.sh': CMAKE_TEST },
    // No `depInstall` either: dependency acquisition in a CMake project is project-specific, and the
    // seed carries no npm manifest for the root fallback to answer with.
    absentCommands: ['build', 'devServer', 'depInstall'],
    // The undetected-command warning this stack removes: both required keys resolved.
    warningCounts: { [undetectedWarning('typecheck')]: 0, [undetectedWarning('test')]: 0 },
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
    assertAlso: assertCmakeTestIsSelfSufficient,
  });

  await stackCase(t, {
    // (b) The ordering control: a Python distribution whose native extension is built by CMake. The
    // packaging row is evaluated far above the CMake one, so the preset, the layer and both lines
    // are the Python ones — and the CMake family never answers, because the Python family is
    // hoisted by the row that matched and stops the search.
    name: 'a Python distribution carrying a CMakeLists.txt for a native extension',
    seed: {
      'pyproject.toml': '[project]\nname = "fixture"\nversion = "0.0.0"\n',
      'CMakeLists.txt': CMAKE_LISTS,
      'fixture/__init__.py': '',
      'src/fixture_ext.cpp': 'int fixture_ext() { return 0; }\n',
    },
    preset: 'python-package',
    signal: 'python-package:packaging-manifest',
    evidence: PYTHON_MANIFESTS[0],
    layers: ['package', 'general'],
    layerPaths: { package: 'fixture' },
    wrapperCommands: { 'typecheck.sh': 'mypy .', 'test.sh': 'pytest' },
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });

  await stackCase(t, {
    // (c) The population row order cannot reach, and the inverse framing of the `npm`-last case
    // above: there the auxiliary manifest was the npm one, here the repository's *own* stack is
    // Node and the `CMakeLists.txt` is the sub-component. Node has no row on the table, so nothing
    // above row 16 catches this tree — it answered `cmake-cpp` with a `cmake` build that never
    // type-checks the published TypeScript and a `ctest` run against a tree with no tests
    // registered in it, and with no warning and no note, since both required keys had resolved.
    // The row's guard and the family order below npm are what make it answer npm on both halves.
    name: 'a node-gyp addon whose root package.json declares scripts keeps its npm lines',
    seed: {
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }),
      'package-lock.json': '{}\n',
      'CMakeLists.txt': CMAKE_LISTS,
      'src/addon.cc': 'int addon() { return 0; }\n',
    },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    wrapperCommands: { 'typecheck.sh': 'npm run typecheck', 'test.sh': 'npm test' },
    commands: { depInstall: 'npm ci' },
    absentCommands: ['build', 'devServer'],
    noteCounts: { [ANCHORING_NOTE]: 0, [FAMILY_ANCHORING_NOTE]: 0 },
  });
});

/**
 * The `READ_MANIFESTS` closure, asserted on the sentence it exists to keep honest.
 *
 * A repository carrying no manifest at all gets the undetected-command warning on both required
 * keys, and that warning enumerates what `init` reads. `READ_MANIFESTS` is composed from the
 * locators' own constants precisely so a manifest a new row started reading cannot go missing from
 * it — this case is the falsifiable half of that claim, on the two names this stack added.
 *
 * The .NET and Xcode names enter that sentence as **suffixes**, spelled as a glob: a solution, a
 * project and an Xcode container are all named after the product, so `*.sln` is what an adopter
 * recognises where a fixed name would name nothing. `Package.swift` is a fixed name and enters as one.
 */
test('the undetected-command warning names the JVM, .NET and Apple manifests among what init reads', async (t) => {
  await stackCase(t, {
    name: 'a repository with no manifest at all',
    seed: { 'README.md': '# fixture\n' },
    preset: 'flat',
    signal: 'flat:fallback',
    layers: ['general'],
    placeholderCommands: ['typecheck', 'test'],
    warningCounts: {
      [MAVEN_MANIFEST]: 2,
      [GRADLE_MANIFESTS[0]]: 2,
      [DOTNET_SOLUTION_SUFFIXES.map((suffix) => `*${suffix}`).join('/')]: 2,
      [`*${DOTNET_PROJECT_SUFFIXES[0]}`]: 2,
      [SWIFT_PACKAGE_MANIFEST]: 2,
      [`*${XCODE_PROJECT_SUFFIXES[0]}`]: 2,
    },
  });
});

/**
 * The documentation-closure cases: the corpus half of "a row that is not reflected wherever that
 * data is consumed is not done".
 *
 * `SIGNALS` and `PRESET_NAMES` are exported as data precisely so the documents that describe them
 * can be checked against them instead of paraphrasing them. These two cases are that check, and
 * they exist because the failure they catch is invisible in the diff that causes it: a row added to
 * the table and left out of `docs/cli.md` reads as complete in review and reaches an adopter as a
 * detection outcome no document explains.
 *
 * They assert an **invariant**, never a count: the document's sequence of first mentions *equals*
 * the table's sequence of ids, and `PRESET_NAMES` is a *subset* of each enumeration that has to
 * carry it — so neither case has to be edited when a row is added, only satisfied.
 */

/** A document of the published corpus, read from the workspace root the CLI package sits in. */
function corpusFile(...parts) {
  return readFileSync(join(WORKSPACE_ROOT, ...parts), 'utf8');
}

/**
 * Where `name` is first mentioned in `text` as a whole token, or `-1`.
 *
 * Whole-token rather than substring, because the enumerations nest: a bare `indexOf('jvm')` is
 * satisfied by the `gradle-jvm` command family, which is a different thing from the `jvm` preset
 * and would let the preset go undocumented while the case passed.
 */
function firstMention(text, name) {
  const match = new RegExp(`(^|[^A-Za-z0-9_-])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_-]|$)`).exec(
    text,
  );
  return match === null ? -1 : match.index;
}

test('docs/cli.md documents every detection row, in the table order the code evaluates them in', () => {
  const doc = corpusFile('docs', 'cli.md');
  const mentions = SIGNALS.map((signal) => ({ id: signal.id, at: firstMention(doc, signal.id) }));

  const missing = mentions.filter((mention) => mention.at === -1).map((mention) => mention.id);
  assert.deepEqual(
    missing,
    [],
    `docs/cli.md §4 does not mention ${missing.join(', ')}. Every SIGNALS row is documented there — add the row to the signal table, in the position the code evaluates it in.`,
  );

  const documented = [...mentions].sort((a, b) => a.at - b.at).map((mention) => mention.id);
  assert.deepEqual(
    documented,
    SIGNALS.map((signal) => signal.id),
    'docs/cli.md mentions the detection rows in a different order than SIGNALS evaluates them. The table is first-match-wins, so its order is the behaviour: put the document back in the code order rather than the reverse.',
  );
});

/**
 * The family-order closure, and why it is a separate case from the row one above.
 *
 * The families are tried first-match-wins like the rows, so their order is behaviour too — but no
 * case asserted it, and §4's prose drifted: four consecutive paragraphs each claimed their family
 * sat *immediately above npm*, each true when its own task landed and falsified by the next family
 * inserted below it. Per-task review sees one diff and cannot catch that. This reads the "what each
 * family emits" table, whose rows are the one enumeration of the families in §4, and asserts it
 * holds {@link COMMAND_FAMILY_IDS} in code order — so a family added to the code and not to the
 * table, or added to the table in the wrong place, fails here rather than in an adopter's reading.
 */
test('docs/cli.md lists every command family, in the order the code tries them', () => {
  const doc = corpusFile('docs', 'cli.md');
  const heading = doc.indexOf('**What each family emits');
  assert.notEqual(heading, -1, "docs/cli.md no longer carries the 'What each family emits' table this case reads.");

  // Only that one table: the slice runs to the first line after it that is not a table row, since
  // §7's check table further down carries first cells of the same shape (`git`, `default-branch`).
  const rows = [];
  for (const line of doc.slice(heading).split('\n')) {
    if (!line.startsWith('|')) {
      if (rows.length > 0) break;
      continue;
    }
    rows.push(line);
  }
  const documented = rows.flatMap((row) => {
    const cell = /^\| `([a-z-]+)` \|/.exec(row);
    return cell === null ? [] : [cell[1]];
  });
  assert.deepEqual(
    documented,
    [...COMMAND_FAMILY_IDS],
    'docs/cli.md §4 lists the command families in a different order than COMMAND_FAMILIES tries them. The search is first-match-wins, so its order is the behaviour: put the document back in the code order rather than the reverse.',
  );
  assert.deepEqual(
    documented.slice(-2),
    ['npm', 'cmake'],
    'npm and cmake are no longer the last two families in the documented order. A new family goes immediately above the npm row — cmake is the one family below it — and the paragraph naming the last family before npm moves with it.',
  );
});

/**
 * The guard's closure over the family it mirrors.
 *
 * `cmake-cpp:cmake-lists` and `ruby-bundler:gemfile` both decline a repository whose root manifest
 * declares a script the npm family would answer with — and `bundlerCommands` declines on the same
 * predicate where it would answer with an install alone — and the whole argument for those guards is
 * that the decisions agree: one that declined where no other derivation was waiting would hand the
 * tree to the `flat` fallback and two placeholders. The lists live in two modules because
 * `detect/presets.ts` imports `detect/signals.ts`, so a candidate added to one and not the other is
 * caught here rather than by an adopter whose addon started answering `cmake-cpp` again.
 */
test('the guarded rows name exactly the scripts the npm command family answers on', () => {
  assert.deepEqual(
    [...NODE_ROW_GUARD_SCRIPTS].sort(),
    [...NODE_SCRIPT_CANDIDATE_NAMES].sort(),
    'NODE_ROW_GUARD_SCRIPTS and NODE_SCRIPT_CANDIDATES no longer hold the same script names. The cmake and ruby-bundler rows have to decline exactly where the npm family answers, so add the new candidate to the guard list in detect/signals.ts.',
  );
});

test('every preset name reaches all three enumerations that have to carry it', () => {
  const schema = JSON.parse(corpusFile('schemas', 'harness.config.schema.json'));
  const schemaEnum = schema.properties.detection.properties.preset.enum;

  for (const [label, text] of [
    ['docs/cli.md', corpusFile('docs', 'cli.md')],
    ['docs/config.md', corpusFile('docs', 'config.md')],
  ]) {
    const missing = PRESET_NAMES.filter((name) => firstMention(text, name) === -1);
    assert.deepEqual(
      missing,
      [],
      `${label} does not name the preset(s) ${missing.join(', ')}. A preset an adopter can be given is a preset the documentation states.`,
    );
  }

  assert.deepEqual(
    [...schemaEnum].sort(),
    [...PRESET_NAMES].sort(),
    "schemas/harness.config.schema.json's detection.preset enum and PRESET_NAMES do not hold the same names. The schema validates what the CLI writes, so a name in one and not the other either fails validation on a config init just generated or admits a preset no row selects.",
  );
});

/**
 * The adoption matrix, end to end: every stack the harness will be installed against, through the
 * real `init`, in one table.
 *
 * **The rule this case exists to enforce: a stack on the matrix is served by `init` with no
 * hand-written configuration.** Every entry above proves one stack's own derivation in detail; this
 * one proves the *set* — that no matrix entry answers the `flat` fallback, that each names a source
 * root below the repository root (which is exactly what `doctor`'s `layer-profile` check grades),
 * and that the two required wrappers an implementer runs on every task exist on disk. Those three
 * are asserted for every entry through one {@link matrixInvariants} hook rather than per entry, so a
 * stack added to the matrix cannot assert less than its siblings, and a regression that reaches only
 * the set — a new row shadowing an older one back to `flat` — fails here rather than in an adopter's
 * worktree.
 *
 * **The one documented exception is written as an expectation, not as an omission.** The Xcode arm
 * has no `test.sh`, because `xcodebuild test` requires a `-destination` that no file in the
 * repository states; the entry carries `expectTestWrapper: false` and asserts the placeholder and
 * the absent wrapper, so the exception is visible in the test file rather than missing from it.
 *
 * **`build` is asserted absent on every entry**, which is the out-of-scope rule made executable: a
 * later preset that starts emitting a Gradle, MSBuild or CMake build line spends a multi-minute
 * native build in every worktree the flow cuts, for a key whose only consumer is
 * `setup-worktree.sh` and which no agent ever runs (`src/generators/scripts.ts` header, choice 2).
 */

/** The invariants every matrix entry has to satisfy, whatever its stack. */
function matrixInvariants({ expectTestWrapper = true } = {}) {
  return ({ name, dir, config }) => {
    assert.notEqual(
      config.detection.preset,
      'flat',
      `${name} is on the adoption matrix and answered the fallback preset, which costs its adopter a hand-written layer list`,
    );

    const below = config.layers.filter((layer) => layer.path !== '.' && layer.path !== '');
    assert.ok(
      below.length > 0,
      `${name} produced no layer below the repository root, which is what doctor's layer-profile check grades: ${JSON.stringify(config.layers)}`,
    );

    for (const [file, expected] of [
      ['typecheck.sh', true],
      ['test.sh', expectTestWrapper],
    ]) {
      const path = join(dir, SCRIPTS_DIR, file);
      assert.equal(
        existsSync(path),
        expected,
        expected
          ? `${name} wrote no ${SCRIPTS_DIR}/${file}, so its adopter's first task runs a placeholder string instead of a command`
          : `${name} is the matrix's one documented exception and is supposed to leave ${file} unwritten`,
      );
    }
  };
}

test('every stack on the adoption matrix is served end to end', async (t) => {
  // (A) Flutter, laid out in layers — the shape the harness's own reference application has.
  await stackCase(t, {
    name: 'matrix: Flutter, layered lib/',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'analysis_options.yaml': 'include: package:flutter_lints/flutter.yaml\n',
      'lib/main.dart': 'void main() {}\n',
      'lib/data/api_client.dart': 'class ApiClient {}\n',
      'lib/domain/user.dart': 'class User {}\n',
      'lib/presentation/home_page.dart': 'class HomePage {}\n',
      'test/home_page_test.dart': '',
      'android/app/build.gradle': 'apply plugin: "com.android.application"\n',
      'ios/Runner.xcodeproj/project.pbxproj': PBXPROJ,
    },
    preset: 'layered-clean-arch',
    signal: 'layered-clean-arch:layer-directories',
    layers: ['data', 'domain', 'presentation', 'tests', 'general'],
    layerPaths: { data: 'lib/data', domain: 'lib/domain', presentation: 'lib/presentation', tests: 'test' },
    wrapperCommands: { 'typecheck.sh': 'flutter analyze', 'test.sh': 'flutter test' },
    commands: { depInstall: 'flutter pub get' },
    absentCommands: ['build', 'devServer'],
    assertAlso: matrixInvariants(),
  });

  // (B) Flutter, feature-first — the arm that answered `flat` before this branch.
  await stackCase(t, {
    name: 'matrix: Flutter, feature-first lib/',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'lib/main.dart': 'void main() {}\n',
      'lib/features/feed/feed_page.dart': 'class FeedPage {}\n',
      'lib/core/env.dart': 'class Env {}\n',
      'test/feed_page_test.dart': '',
      'android/app/build.gradle': 'apply plugin: "com.android.application"\n',
    },
    preset: 'flutter',
    signal: 'flutter:pubspec-manifest',
    layers: ['lib', 'tests', 'general'],
    layerPaths: { lib: 'lib', tests: 'test' },
    wrapperCommands: { 'typecheck.sh': 'flutter analyze', 'test.sh': 'flutter test' },
    commands: { depInstall: 'flutter pub get' },
    absentCommands: ['build', 'devServer'],
    assertAlso: matrixInvariants(),
  });

  // (C) Native Android, single module.
  await stackCase(t, {
    name: 'matrix: native Android',
    seed: {
      'settings.gradle.kts': SETTINGS_GRADLE,
      'build.gradle.kts': 'plugins { }\n',
      'gradle.properties': 'org.gradle.jvmargs=-Xmx2g\n',
      'app/build.gradle.kts': 'plugins { id("com.android.application") }\n',
      'app/src/main/AndroidManifest.xml': ANDROID_MANIFEST_XML,
      'app/src/main/java/com/example/fixture/MainActivity.kt': 'class MainActivity\n',
      'app/src/test/java/com/example/fixture/MainActivityTest.kt': 'class MainActivityTest\n',
    },
    preset: 'android-gradle',
    signal: 'android-gradle:android-manifest',
    layers: ['app', 'tests', 'general'],
    layerPaths: { app: 'app/src/main/java', tests: 'app/src/test' },
    wrapperCommands: { 'typecheck.sh': GRADLE_TYPECHECK, 'test.sh': GRADLE_TEST },
    absentCommands: ['build', 'devServer', 'depInstall'],
    assertAlso: matrixInvariants(),
  });

  // (D) Native iOS, SwiftPM — the arm of the Apple preset that serves both required keys.
  await stackCase(t, {
    name: 'matrix: native iOS (SwiftPM)',
    seed: {
      'Package.swift': SWIFT_MANIFEST,
      'Sources/MyApp/MyApp.swift': 'public struct MyApp {}\n',
      'Sources/MyApp/Feed/FeedView.swift': 'struct FeedView {}\n',
      'Tests/MyAppTests/MyAppTests.swift': 'import XCTest\n',
    },
    preset: 'apple-native',
    signal: 'apple-native:swift-package-or-xcode-project',
    evidence: 'Package.swift',
    layers: ['sources', 'tests', 'general'],
    layerPaths: { sources: 'Sources', tests: 'Tests' },
    wrapperCommands: { 'typecheck.sh': SWIFT_TYPECHECK, 'test.sh': SWIFT_TEST },
    commands: { depInstall: SWIFT_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    assertAlso: matrixInvariants(),
  });

  // (E) Native iOS, Xcode with one shared scheme — **the matrix's one documented exception.**
  // `typecheck` is derived; `test` is not, because `xcodebuild test` requires a `-destination` that
  // no file in the repository states, so the key stays a placeholder and gets no wrapper
  // (`docs/cli.md` §5). Asserted here as an expectation, so the exception is visible in this file.
  await stackCase(t, {
    name: 'matrix: native iOS (Xcode, one shared scheme)',
    seed: {
      'MyApp.xcodeproj/project.pbxproj': PBXPROJ,
      'MyApp.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme': XCSCHEME,
      'MyApp/AppDelegate.swift': 'import UIKit\n',
      'MyApp/Feed/FeedViewController.swift': 'import UIKit\n',
      'MyAppTests/FeedTests.swift': 'import XCTest\n',
      Podfile: "platform :ios, '16.0'\n",
    },
    preset: 'apple-native',
    signal: 'apple-native:swift-package-or-xcode-project',
    evidence: 'MyApp.xcodeproj',
    layers: ['sources', 'general'],
    layerPaths: { sources: 'MyApp' },
    wrapperCommands: { 'typecheck.sh': 'xcodebuild -project MyApp.xcodeproj -scheme MyApp build' },
    placeholderCommands: ['test'],
    absentCommands: ['build', 'devServer', 'depInstall'],
    noteCounts: { [XCODE_DESTINATION_NOTE]: 1 },
    warningCounts: { [undetectedWarning('test')]: 1, [noWrapperWarning('test.sh')]: 1 },
    assertAlso: matrixInvariants({ expectTestWrapper: false }),
  });

  // (F) A Node backend. Its manifest declares no `build` script, so the matrix-wide `build` absence
  // is asserted here on the one stack whose family *can* resolve that key at all.
  await stackCase(t, {
    name: 'matrix: Node backend',
    seed: {
      'package.json': rootManifest({ typecheck: 'tsc --noEmit', test: 'vitest run' }),
      'package-lock.json': { name: 'fixture-project', lockfileVersion: 3, requires: true, packages: {} },
      'tsconfig.json': { compilerOptions: { strict: true } },
      'src/routes/health.ts': 'export const health = () => ({ ok: true });\n',
      'src/routes/users.ts': 'export const users = () => [];\n',
      'src/server.ts': 'export const server = {};\n',
    },
    preset: 'api-service',
    signal: 'api-service:route-directory',
    layers: ['api', 'general'],
    layerPaths: { api: 'src/routes' },
    wrapperCommands: { 'typecheck.sh': 'npm run typecheck', 'test.sh': 'npm test' },
    commands: { depInstall: 'npm ci' },
    absentCommands: ['build', 'devServer'],
    assertAlso: matrixInvariants(),
  });

  // (G) A .NET backend.
  await stackCase(t, {
    name: 'matrix: .NET backend',
    seed: {
      'MyApp.sln': SOLUTION_FILE,
      'src/MyApp.Api/MyApp.Api.csproj': PROJECT_FILE,
      'src/MyApp.Api/Program.cs': 'return 0;\n',
      'src/MyApp.Api/Controllers/HomeController.cs': 'namespace MyApp.Api.Controllers;\n',
      'src/MyApp.Domain/MyApp.Domain.csproj': PROJECT_FILE,
      'tests/MyApp.Api.Tests/MyApp.Api.Tests.csproj': PROJECT_FILE,
    },
    preset: 'dotnet',
    signal: 'dotnet:solution-or-project',
    evidence: 'MyApp.sln',
    layers: ['src', 'tests', 'general'],
    layerPaths: { src: 'src', tests: 'tests' },
    wrapperCommands: { 'typecheck.sh': DOTNET_TYPECHECK, 'test.sh': DOTNET_TEST },
    commands: { depInstall: DOTNET_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    assertAlso: matrixInvariants(),
  });

  // (H) A .NET frontend — the same preset, the same layers and the same lines as (G) by decision
  // (the optional-phase set is `init` flag-driven, not preset-driven), and a separate matrix entry
  // because the matrix names it separately.
  await stackCase(t, {
    name: 'matrix: .NET frontend',
    seed: {
      'MyApp.sln': SOLUTION_FILE,
      'src/MyApp.Web/MyApp.Web.csproj': PROJECT_FILE,
      'src/MyApp.Web/Pages/Index.cshtml': '@page\n',
      'src/MyApp.Web/wwwroot/site.css': 'body { }\n',
      'tests/MyApp.Web.Tests/MyApp.Web.Tests.csproj': PROJECT_FILE,
    },
    preset: 'dotnet',
    signal: 'dotnet:solution-or-project',
    evidence: 'MyApp.sln',
    layers: ['src', 'tests', 'general'],
    layerPaths: { src: 'src', tests: 'tests' },
    wrapperCommands: { 'typecheck.sh': DOTNET_TYPECHECK, 'test.sh': DOTNET_TEST },
    commands: { depInstall: DOTNET_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    assertAlso: matrixInvariants(),
  });

  // (I) A Java backend, Maven. No `mvnw` is seeded, so the lines below are the wrapper-absent arm —
  // `mvn` from `PATH`, as in case (r); the wrapper spelling is case (r2)'s claim.
  await stackCase(t, {
    name: 'matrix: Java backend (Maven)',
    seed: {
      'pom.xml': '<project><artifactId>fixture</artifactId></project>\n',
      'src/main/java/com/example/fixture/Application.java': 'package com.example.fixture;\n',
      'src/main/resources/application.yaml': 'server:\n  port: 8080\n',
      'src/test/java/com/example/fixture/ApplicationTest.java': 'package com.example.fixture;\n',
    },
    preset: 'jvm',
    signal: 'jvm:maven-manifest',
    layers: ['main', 'tests', 'general'],
    layerPaths: { main: 'src/main/java', tests: 'src/test' },
    wrapperCommands: { 'typecheck.sh': MAVEN_TYPECHECK, 'test.sh': MAVEN_TEST },
    commands: { depInstall: MAVEN_DEP_INSTALL },
    absentCommands: ['build', 'devServer'],
    assertAlso: matrixInvariants(),
  });

  // (J) A C++ tree built by CMake.
  await stackCase(t, {
    name: 'matrix: C++ (CMake)',
    seed: {
      'CMakeLists.txt': `${CMAKE_LISTS}enable_testing()\n`,
      'src/main.cpp': 'int main() { return 0; }\n',
      'src/engine.cpp': 'int engine() { return 0; }\n',
      'include/fixture/engine.hpp': '#pragma once\n',
      'tests/engine_test.cpp': 'int engine_test() { return 0; }\n',
    },
    preset: 'cmake-cpp',
    signal: 'cmake-cpp:cmake-lists',
    evidence: CMAKE_MANIFEST,
    layers: ['src', 'include', 'tests', 'general'],
    layerPaths: { src: 'src', include: 'include', tests: 'tests' },
    wrapperCommands: { 'typecheck.sh': CMAKE_TYPECHECK, 'test.sh': CMAKE_TEST },
    absentCommands: ['build', 'devServer', 'depInstall'],
    assertAlso: matrixInvariants(),
  });
});

/**
 * The `tests` row, one case per preset that declares a conventional test root.
 *
 * **The rule these cases exist to enforce: the row is named `tests` whatever the directory on disk
 * is called, it sits after the preset's source rows and before `general`, it points at the
 * directory the toolchain's own convention names, and it is dropped where that directory does not
 * exist.** `PRESET_TEST_ROOTS` (`src/detect/presets.ts`) is a table of twelve entries applied by one
 * wrapper, so a wrong entry is invisible in the diff that causes it: the profile stays plausible and
 * the work it misroutes — to `general`, or to a path that is not there — surfaces in an adopter's
 * repository rather than here. Every key of that table has a case below, in table order.
 *
 * These assert the **layer half only**. Each stack's commands are asserted by its own test above,
 * and repeating them here would make a table edit fail cases that are not about the table.
 *
 * The controls are the half that fails a table that is too eager: (m) is a preset whose test
 * directory is absent, holding the exact profile it answered before this row existed, and (n) is the
 * preference order asserted where it is falsifiable — a repository carrying both of `ruby-bundler`'s
 * candidates. (p) is the half a root-only table misses: a directory-shaped preset whose source row
 * resolved below `src/` and whose suite is there too.
 */
test("a preset declares its toolchain's conventional test root, and only where it exists", async (t) => {
  await stackCase(t, {
    // (a) `layered-clean-arch`, whose candidates are `test` then `tests`. No manifest: the row is
    // directory-shaped, so the seed is the two layer directories and the test root and nothing else.
    name: 'tests row: a layered tree with a test/ directory',
    seed: {
      'src/data/store.py': '',
      'src/domain/model.py': '',
      'test/store_test.py': '',
    },
    preset: 'layered-clean-arch',
    signal: 'layered-clean-arch:layer-directories',
    layers: ['data', 'domain', 'tests', 'general'],
    layerPaths: { data: 'src/data', domain: 'src/domain', tests: 'test' },
  });

  await stackCase(t, {
    // (b) `api-service`, the other preset reached by a directory-shaped row. The `tests` row is a
    // sibling of the `api` row rather than a replacement for it: both are asserted.
    name: 'tests row: an api service with a test/ directory',
    seed: {
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }),
      'src/routes/health.ts': 'export const health = () => ({ ok: true });\n',
      'test/health.test.ts': "import { test } from 'node:test';\n",
    },
    preset: 'api-service',
    signal: 'api-service:route-directory',
    layers: ['api', 'tests', 'general'],
    layerPaths: { api: 'src/routes', tests: 'test' },
  });

  await stackCase(t, {
    // (c) `python-package`, whose candidates are `tests` then `test` — pytest's order, and the
    // reverse of (a)'s. The seeded `tests/` carries no `__init__.py`, so it is not a candidate for
    // the `package` row either (`findPythonPackageDir`).
    name: 'tests row: a Python distribution with a tests/ directory',
    seed: {
      'pyproject.toml': '[project]\nname = "fixture"\n',
      'fixture/__init__.py': '',
      'tests/test_fixture.py': '',
    },
    preset: 'python-package',
    signal: 'python-package:packaging-manifest',
    layers: ['package', 'tests', 'general'],
    layerPaths: { package: 'fixture', tests: 'tests' },
  });

  await stackCase(t, {
    // (d) `flutter`: the single candidate `test`, which is the directory `flutter create` writes.
    name: 'tests row: a feature-first Flutter application with a test/ directory',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'lib/main.dart': 'void main() {}\n',
      'lib/features/feed/feed_page.dart': '',
      'test/feed_page_test.dart': '',
    },
    preset: 'flutter',
    signal: 'flutter:pubspec-manifest',
    layers: ['lib', 'tests', 'general'],
    layerPaths: { lib: 'lib', tests: 'test' },
  });

  await stackCase(t, {
    // (e) `android-gradle`, **the entry whose candidate is two segments deep** and therefore the one
    // a wrong table entry hides in: a row spelled `test` or `src/test` resolves nothing in this tree
    // and the case reports a profile with no `tests` row at all.
    name: 'tests row: an Android module with an app/src/test/ directory',
    seed: {
      'settings.gradle.kts': SETTINGS_GRADLE,
      'app/build.gradle.kts': 'plugins { id("com.android.application") }\n',
      'app/src/main/AndroidManifest.xml': ANDROID_MANIFEST_XML,
      'app/src/main/java/com/example/fixture/MainActivity.kt': '',
      'app/src/test/java/com/example/fixture/MainActivityTest.kt': '',
    },
    preset: 'android-gradle',
    signal: 'android-gradle:android-manifest',
    layers: ['app', 'tests', 'general'],
    layerPaths: { app: 'app/src/main/java', tests: 'app/src/test' },
  });

  await stackCase(t, {
    // (f) `jvm`: `src/test`, the sibling source set of `src/main` — so the two rows are asserted
    // together, since a candidate of `src` would swallow the source root the `main` row names.
    name: 'tests row: a Maven project with a src/test/ source set',
    seed: {
      'pom.xml': '<project><artifactId>fixture</artifactId></project>\n',
      'src/main/java/com/example/fixture/Application.java': 'package com.example.fixture;\n',
      'src/test/java/com/example/fixture/ApplicationTest.java': 'package com.example.fixture;\n',
    },
    preset: 'jvm',
    signal: 'jvm:maven-manifest',
    layers: ['main', 'tests', 'general'],
    layerPaths: { main: 'src/main/java', tests: 'src/test' },
  });

  await stackCase(t, {
    // (g) `dotnet`: `tests/`, the directory `dotnet new sln` layouts put test projects in, beside
    // the `src/` the source row names.
    name: 'tests row: a .NET solution with a tests/ directory',
    seed: {
      'MyApp.sln': SOLUTION_FILE,
      'src/MyApp.Api/MyApp.Api.csproj': PROJECT_FILE,
      'tests/MyApp.Api.Tests/MyApp.Api.Tests.csproj': PROJECT_FILE,
    },
    preset: 'dotnet',
    signal: 'dotnet:solution-or-project',
    layers: ['src', 'tests', 'general'],
    layerPaths: { src: 'src', tests: 'tests' },
  });

  await stackCase(t, {
    // (h) `apple-native`: `Tests/`, SwiftPM's own capitalised directory — the entry that fails on a
    // table whose candidates were lower-cased.
    name: 'tests row: a Swift package with a Tests/ directory',
    seed: {
      'Package.swift': SWIFT_MANIFEST,
      'Sources/MyApp/MyApp.swift': 'public struct MyApp {}\n',
      'Tests/MyAppTests/MyAppTests.swift': 'import XCTest\n',
    },
    preset: 'apple-native',
    signal: 'apple-native:swift-package-or-xcode-project',
    layers: ['sources', 'tests', 'general'],
    layerPaths: { sources: 'Sources', tests: 'Tests' },
  });

  await stackCase(t, {
    // (i) `rust-cargo`: `tests/`, the integration-test directory Cargo compiles per file.
    name: 'tests row: a Rust crate with a tests/ directory',
    seed: {
      'Cargo.toml': CARGO_TOML,
      'src/lib.rs': 'pub fn fixture() {}\n',
      'tests/integration.rs': '#[test]\nfn integration() {}\n',
    },
    preset: 'rust-cargo',
    signal: 'rust-cargo:cargo-manifest',
    layers: ['src', 'tests', 'general'],
    layerPaths: { src: 'src', tests: 'tests' },
  });

  await stackCase(t, {
    // (j) `ruby-bundler`: `spec/`, RSpec's directory, which is the first candidate. (n) is the
    // preference half of the same entry.
    name: 'tests row: a gem with a spec/ directory',
    seed: {
      Gemfile: GEMFILE,
      Rakefile: RAKEFILE,
      'lib/fixture.rb': 'module Fixture; end\n',
      'spec/fixture_spec.rb': "require 'spec_helper'\n",
    },
    preset: 'ruby-bundler',
    signal: 'ruby-bundler:gemfile',
    layers: ['lib', 'tests', 'general'],
    layerPaths: { lib: 'lib', tests: 'spec' },
  });

  await stackCase(t, {
    // (k) `php-composer`: `tests/`, PHPUnit's conventional directory.
    name: 'tests row: a PSR-4 library with a tests/ directory',
    seed: {
      'composer.json': COMPOSER_JSON,
      'src/Fixture.php': '<?php\nclass Fixture {}\n',
      'tests/FixtureTest.php': '<?php\nclass FixtureTest {}\n',
    },
    preset: 'php-composer',
    signal: 'php-composer:composer-manifest',
    layers: ['src', 'tests', 'general'],
    layerPaths: { src: 'src', tests: 'tests' },
  });

  await stackCase(t, {
    // (l) `cmake-cpp`, and the one preset carrying **two** source rows before the test row: `src/`
    // and `include/` are siblings of a different kind from the test tree — public headers are
    // implementation work under the module rules, a test tree is the `tests` row — so all three are
    // asserted in order, with `general` still last.
    name: 'tests row: a CMake project with src/, include/ and tests/',
    seed: {
      'CMakeLists.txt': CMAKE_LISTS,
      'src/main.cpp': 'int main() { return 0; }\n',
      'include/fixture/fixture.hpp': '#pragma once\n',
      'tests/fixture_test.cpp': 'int fixture_test() { return 0; }\n',
    },
    preset: 'cmake-cpp',
    signal: 'cmake-cpp:cmake-lists',
    layers: ['src', 'include', 'tests', 'general'],
    layerPaths: { src: 'src', include: 'include', tests: 'tests' },
  });

  await stackCase(t, {
    // (m) **The control for the whole table.** (d)'s tree with the `test/` directory removed and
    // nothing else changed: the profile is the two rows this repository answered before the test row
    // existed, so a candidate list that resolved a directory that is not there fails here.
    name: 'tests row: a Flutter application with no test directory keeps its two-row profile',
    seed: {
      'pubspec.yaml': PUBSPEC,
      'lib/main.dart': 'void main() {}\n',
      'lib/features/feed/feed_page.dart': '',
    },
    preset: 'flutter',
    signal: 'flutter:pubspec-manifest',
    layers: ['lib', 'general'],
    layerPaths: { lib: 'lib' },
  });

  await stackCase(t, {
    // (n) The preference order, on the one entry where it is falsifiable in a single tree: (j)'s gem
    // with a leftover `test/` beside its `spec/`. `spec` wins, which is the order the table states —
    // such a repository is an RSpec suite with a leftover far more often than the reverse.
    name: 'tests row: a gem carrying both spec/ and test/ resolves spec',
    seed: {
      Gemfile: GEMFILE,
      Rakefile: RAKEFILE,
      'lib/fixture.rb': 'module Fixture; end\n',
      'spec/fixture_spec.rb': "require 'spec_helper'\n",
      'test/fixture_test.rb': "require 'minitest/autorun'\n",
    },
    preset: 'ruby-bundler',
    signal: 'ruby-bundler:gemfile',
    layers: ['lib', 'tests', 'general'],
    layerPaths: { lib: 'lib', tests: 'spec' },
  });

  await stackCase(t, {
    // (o) The `include/` row alone, which is the control for (l)'s second *source* row: a project
    // whose public headers are the only conventional source directory it has. `include` is the
    // scoped source row here rather than a fallback, and the profile carries no `tests` row.
    name: 'tests row: a CMake project with include/ and no src/ names include as its source row',
    seed: {
      'CMakeLists.txt': CMAKE_LISTS,
      'include/fixture/fixture.hpp': '#pragma once\n',
    },
    preset: 'cmake-cpp',
    signal: 'cmake-cpp:cmake-lists',
    layers: ['include', 'general'],
    layerPaths: { include: 'include' },
  });

  await stackCase(t, {
    // (p) The nested test root of a directory-shaped preset: (b)'s api service with its suite under
    // `src/test/` instead of a root `test/`. `findApiDir` resolves the source row over
    // `candidateRoots`, so it reaches `src/routes`, while the test row searches `manifestRoots` —
    // this case fails unless `PRESET_TEST_ROOTS` spells the nested candidate out. (b) seeds a root
    // `test/` and cannot.
    name: 'tests row: an api service whose suite sits under src/test',
    seed: {
      'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }),
      'src/routes/health.ts': 'export const health = () => ({ ok: true });\n',
      'src/test/health.test.ts': "import { test } from 'node:test';\n",
    },
    preset: 'api-service',
    signal: 'api-service:route-directory',
    layers: ['api', 'tests', 'general'],
    layerPaths: { api: 'src/routes', tests: 'src/test' },
  });

  await stackCase(t, {
    // (q) **The unresolved source root a test row must not hide.** A CMake project with its sources
    // at the repository root — neither `src/` nor `include/`, so both source candidates miss — and a
    // conventional `tests/`, which is the ordinary shape of the population `PRESET_TEST_ROOTS` and
    // the source arms resolve independently over. The profile is `tests` then `general`, and
    // `buildPreset`'s general-only warning still fires: it is gated on the **source** rows, so a
    // spliced test row neither lengthens the list it reads nor clears `doctor`'s `layer-profile`
    // check, whose scoped rows exclude `tests` for the same reason. Gate it on `layers.length` again
    // and this case fails on the warning count while every assertion above it still passes.
    name: 'tests row: a CMake project with tests/ and no source root is still warned about',
    seed: {
      'CMakeLists.txt': CMAKE_LISTS,
      'main.cpp': 'int main() { return 0; }\n',
      'tests/fixture_test.cpp': 'int fixture_test() { return 0; }\n',
    },
    preset: 'cmake-cpp',
    signal: 'cmake-cpp:cmake-lists',
    layers: ['tests', 'general'],
    layerPaths: { tests: 'tests' },
    warningCounts: { '`general` layer only': 1 },
  });

  await stackCase(t, {
    // (r) The control for (q) on the warning channel: (l)'s tree, whose source rows resolved, raises
    // it zero times. Without this, a change that raised the warning unconditionally would pass (q).
    name: 'tests row: a CMake project whose source rows resolved raises no general-only warning',
    seed: {
      'CMakeLists.txt': CMAKE_LISTS,
      'src/main.cpp': 'int main() { return 0; }\n',
      'include/fixture/fixture.hpp': '#pragma once\n',
      'tests/fixture_test.cpp': 'int fixture_test() { return 0; }\n',
    },
    preset: 'cmake-cpp',
    signal: 'cmake-cpp:cmake-lists',
    layers: ['src', 'include', 'tests', 'general'],
    warningCounts: { '`general` layer only': 0 },
  });
});

/**
 * The general-only warning's two arms, which are gated on the set `doctor` gates its `layer-profile`
 * arms on rather than on the warning's own population.
 *
 * Both cases assert the shared half — the next step, which every arm carries — and then the half that
 * differs, on the **warning** channel, since a clause that moved to a note would still be reported
 * but would no longer be the line an adopter reads as the warning's disposition.
 */
test('the general-only warning names the disposition doctor will grade, per preset', async (t) => {
  await stackCase(t, {
    // (a) The by-design population, which is `LAYERLESS_BY_DESIGN_PRESETS` and nothing else: a
    // workspaces root, whose one catch-all row `doctor` passes as a decision. The clause is the half
    // `doctor` holds, so an adopter reading only `init` learns it too.
    name: 'a monorepo is told that doctor grades this profile a decision',
    seed: {
      'package.json': { ...rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }), workspaces: ['packages/*'] },
      'packages/storefront/package.json': { name: 'storefront', private: true, version: '0.0.0' },
    },
    preset: 'monorepo',
    signal: 'monorepo:workspaces-key',
    layers: ['general'],
    warningCounts: {
      "`/autonomous-sdlc-harness:harness-analyze`'s to propose": 1,
      'grades this a decision rather than drift': 1,
    },
  });

  await stackCase(t, {
    // (b) **The negative case, and the reason the clause is gated at all.** A Go module with no
    // route directory reaches `api-service` on its manifest row and resolves no source root, so it
    // raises the same warning from a preset outside `LAYERLESS_BY_DESIGN_PRESETS` —
    // `LAYER_PROFILE_CHECK` takes its source-root-not-found **warn** arm here, not the by-design
    // pass, so a warning claiming doctor blesses this profile would be false. Drop the gate and this
    // case fails while (a) still passes.
    name: 'an api service whose source root is absent is not told that doctor blesses it',
    seed: {
      'go.mod': 'module example.com/fixture\n\ngo 1.22\n',
      'main.go': 'package main\n\nfunc main() {}\n',
    },
    preset: 'api-service',
    signal: 'api-service:go-module',
    layers: ['general'],
    warningCounts: {
      "`/autonomous-sdlc-harness:harness-analyze`'s to propose": 1,
      'grades this a decision rather than drift': 0,
    },
  });
});

/**
 * What `buildPreset` now records about the command half of detection: the family that answered, the
 * manifest **that family** reads, every read-manifest that was present, and the families that had a
 * manifest and declined.
 *
 * Asserted on the profile rather than through `init`, because this is the producer only — nothing
 * writes these fields anywhere yet, so the generated configuration and the run's output carry no
 * trace of them to read back.
 */
test('the profile records which family answered, the manifest it read, and the manifests present', async (t) => {
  await t.test('a colliding root names the winner rather than the first manifest found', async (t) => {
    // The React Native shape F66 measured: three manifest families collide at the repository root.
    // The Android project sits outside `manifestRoots` and carries no `app/AndroidManifest.xml`, so
    // neither Android family reaches it, `bundler` reads the fastlane/CocoaPods `Gemfile` and
    // declines on `declaresNodeScript`, and `npm` answers.
    const dir = await fixtureFor(t, {
      files: {
        'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }),
        Gemfile: GEMFILE,
        'android/build.gradle.kts': 'plugins { id("com.android.application") }\n',
        'index.js': "export const app = () => 'fixture';\n",
      },
    });
    const profile = buildPreset(detectPreset(dir));

    assert.equal(profile.commandFamily, 'npm');
    // The **winner's own** manifest, never `readManifests[0]`: the two lists are ordered differently,
    // so a positional derivation is what this asserts against.
    assert.equal(profile.commandManifest, PACKAGE_MANIFEST);
    assert.deepEqual(profile.readManifests, [PACKAGE_MANIFEST, BUNDLER_MANIFEST]);
    assert.ok(
      profile.declinedFamilies.includes('bundler'),
      `bundler read its Gemfile and declined, so it belongs in ${JSON.stringify(profile.declinedFamilies)}`,
    );
    // A family with no manifest at all is not a decliner — it had nothing to read.
    assert.ok(!profile.declinedFamilies.includes('python'));
  });

  await t.test('a single-manifest repository names that manifest and no decliner', async (t) => {
    const dir = await fixtureFor(t, {
      files: {
        'pyproject.toml': '[project]\nname = "fixture"\nversion = "0.1.0"\n',
        'fixture/__init__.py': '',
      },
    });
    const profile = buildPreset(detectPreset(dir));

    assert.equal(profile.commandFamily, 'python');
    assert.equal(profile.commandManifest, PYTHON_MANIFESTS[0]);
    assert.deepEqual(profile.readManifests, [PYTHON_MANIFESTS[0]]);
    assert.deepEqual(profile.declinedFamilies, []);
  });

  await t.test('a repository with no manifest at all leaves every field empty', async (t) => {
    const dir = await fixtureFor(t, { files: { 'README.md': '# fixture\n' } });
    const profile = buildPreset(detectPreset(dir));

    assert.equal(profile.commandFamily, undefined);
    assert.equal(profile.commandManifest, undefined);
    assert.deepEqual(profile.readManifests, []);
    assert.deepEqual(profile.declinedFamilies, []);
    // The required pair still holds its placeholders: recording the search changed no derivation.
    assert.ok(isPlaceholder(profile.rawCommands.typecheck));
    assert.ok(isPlaceholder(profile.rawCommands.test));
  });
});

/** The opening of the tiebreak note — the only trace a manifest collision leaves in the output. */
const TIEBREAK_NOTE = 'carries more than one manifest init reads';

/** The opening of the split-detection note, which narrows the unrecognised-layout warning's scope. */
const SPLIT_NOTE = 'no layout signal matched this repository';

/**
 * Every sentence the tiebreak note is forbidden to contain, because each is false on the very
 * fixture the note exists for: `bundlerCommands` reads the `Gemfile`, builds `bundle install` and
 * yields on `declaresNodeScript`, so the manifest was read and the family was consulted.
 */
const FORBIDDEN_TIEBREAK_CLAIMS = /not consulted|never (ran|read)|unread|nothing else/i;

/** The one note of `notes` containing `substring`, asserted to be exactly one. */
function onlyNote(notes, substring) {
  const matched = notes.filter((note) => note.includes(substring));
  assert.equal(matched.length, 1, `expected one note containing "${substring}", got ${JSON.stringify(notes)}`);
  return matched[0];
}

/**
 * The two notes that say out loud what F66 measured as silent: that a choice happened between
 * manifest families colliding at the root, and that an `unrecognised layout` verdict is about the
 * layer half alone where the command half resolved.
 *
 * Asserted on the profile's own `notes` rather than through `init`, for the reason the producer's
 * cases above give: these are `context.note` lines on `PresetProfile.notes`, and the summary line
 * that would let `init`'s output carry a second trace of them is a later task's.
 */
test('the profile says which family answered when manifests collide, and when only the layer half fell back', async (t) => {
  await t.test('a colliding root gets a tiebreak note naming the winner, the others and the decliner', async (t) => {
    // Task 1's React Native shape, unchanged: `npm` answers, `bundler` reads its `Gemfile` and
    // declines, and the `Gemfile` is present without having supplied a line.
    const dir = await fixtureFor(t, {
      files: {
        'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }),
        Gemfile: GEMFILE,
        'android/build.gradle.kts': 'plugins { id("com.android.application") }\n',
        'index.js': "export const app = () => 'fixture';\n",
      },
    });
    const profile = buildPreset(detectPreset(dir));
    const note = onlyNote(profile.notes, TIEBREAK_NOTE);

    assert.match(note, /`npm` command family, which read `package\.json`/);
    assert.match(note, new RegExp(`\`${BUNDLER_MANIFEST}\` is present too and did not supply these lines`));
    assert.match(note, /`bundler` was tried, read its manifest and declined/);
    // The three false sentences the earlier draft of this note carried, asserted as absences: each
    // is contradicted by `bundler` having read the `Gemfile` on this very fixture.
    assert.doesNotMatch(note, FORBIDDEN_TIEBREAK_CLAIMS);
    // A note, never a warning: this fires on every correct multi-manifest repository.
    assert.equal(
      profile.warnings.filter((warning) => warning.includes(TIEBREAK_NOTE)).length,
      0,
      'the tiebreak line belongs on the notes channel',
    );
  });

  await t.test('a single-manifest repository gets no tiebreak note', async (t) => {
    const dir = await fixtureFor(t, {
      files: {
        'pyproject.toml': '[project]\nname = "fixture"\nversion = "0.1.0"\n',
        'fixture/__init__.py': '',
      },
    });
    const profile = buildPreset(detectPreset(dir));

    assert.deepEqual(
      profile.notes.filter((note) => note.includes(TIEBREAK_NOTE)),
      [],
      'one manifest is no collision, so there is no choice to report',
    );
  });

  await t.test('a flat fallback whose commands resolved says so, and names the family', async (t) => {
    const dir = await fixtureFor(t, {
      files: {
        'package.json': rootManifest({ typecheck: 'echo typecheck', test: 'echo test' }),
        'index.js': "export const app = () => 'fixture';\n",
      },
    });
    const detection = detectPreset(dir);
    assert.equal(detection.matchedSignal, 'flat:fallback', 'this fixture is supposed to reach the fallback row');
    const profile = buildPreset(detection);
    const note = onlyNote(profile.notes, SPLIT_NOTE);

    assert.match(note, /`npm` command family, which read `package\.json`/);
    // One manifest, so the collision note stays out of a run that has no collision to report.
    assert.deepEqual(
      profile.notes.filter((entry) => entry.includes(TIEBREAK_NOTE)),
      [],
    );
  });

  await t.test('a flat fallback with no manifest gets no split note and keeps its placeholders', async (t) => {
    const dir = await fixtureFor(t, { files: { 'README.md': '# fixture\n' } });
    const detection = detectPreset(dir);
    assert.equal(detection.matchedSignal, 'flat:fallback');
    const profile = buildPreset(detection);

    // No family answered, so both required keys already carry the undetected-command warning and a
    // second line saying the same thing would be duplication.
    assert.deepEqual(
      profile.notes.filter((note) => note.includes(SPLIT_NOTE)),
      [],
    );
    assert.ok(isPlaceholder(profile.rawCommands.typecheck));
    assert.ok(isPlaceholder(profile.rawCommands.test));
    assert.equal(
      profile.warnings.filter((warning) => warning.includes('could not be detected')).length,
      2,
      'the two placeholder warnings are unchanged',
    );
  });

  await t.test('a flat fallback whose winner derived neither required key raises no split note', async (t) => {
    // `nodeCommands` answers off a `build` script alone — an ordinary shape — so a family did answer
    // while both required keys stayed placeholders. The note's subject is that the command half
    // resolved, so there is nothing for it to narrow, and both keys already carry their warning.
    const dir = await fixtureFor(t, {
      files: {
        'package.json': rootManifest({ build: 'echo build' }),
        'index.js': "export const app = () => 'fixture';\n",
      },
    });
    const detection = detectPreset(dir);
    assert.equal(detection.matchedSignal, 'flat:fallback', 'this fixture is supposed to reach the fallback row');
    const profile = buildPreset(detection);

    assert.equal(profile.commandFamily, 'npm');
    assert.deepEqual(profile.resolvedRequired, []);
    assert.deepEqual(
      profile.notes.filter((note) => note.includes(SPLIT_NOTE)),
      [],
    );
    assert.equal(profile.warnings.filter((warning) => warning.includes('could not be detected')).length, 2);
  });

  /**
   * A family answering is not both required keys resolving, and the note says whichever is true —
   * the populations this module's own `undetectedCommandWarning` documents, each asserted against
   * the same run's placeholder warnings, since the escape these two cases pin is a note that
   * contradicts the warnings printed beneath it.
   */
  await t.test('a winner that derived neither required key claims no source for the pair', async (t) => {
    // The PHP case-(b) seed — `composerCommands` returns `depInstall` alone where no analyser and no
    // test runner is configured — with a scripts-less root `package.json` beside it, which is the
    // second read manifest the tiebreak note needs and answers nothing itself.
    const dir = await fixtureFor(t, {
      files: {
        'composer.json': COMPOSER_JSON,
        'composer.lock': '{}\n',
        'package.json': rootManifest(),
        'src/Fixture.php': '<?php\nclass Fixture {}\n',
        'tests/FixtureTest.php': '<?php\nclass FixtureTest {}\n',
      },
    });
    const profile = buildPreset(detectPreset(dir));

    assert.equal(profile.commandFamily, 'composer', 'this seed is supposed to be answered by composer');
    assert.deepEqual(profile.resolvedRequired, [], 'composer derives neither verifier on this seed');

    const note = onlyNote(profile.notes, TIEBREAK_NOTE);
    assert.match(note, /^neither commands\.typecheck nor commands\.test was derived by the `composer` command family/);
    assert.doesNotMatch(note, /came from/, `the note claimed a source for a key composer did not derive:\n${note}`);
    // The contradiction this case exists to prevent: both keys hold placeholders and both warn.
    assert.ok(isPlaceholder(profile.rawCommands.typecheck));
    assert.ok(isPlaceholder(profile.rawCommands.test));
    assert.equal(profile.warnings.filter((warning) => warning.includes('could not be detected')).length, 2);
  });

  await t.test('a winner that derived one required key names that key and says what became of the other', async (t) => {
    // The Ruby case-(b) seed — `test` resolves off the `Rakefile`, `typecheck` does not without a
    // RuboCop configuration — with the same scripts-less `package.json` added for the collision.
    // `bundlerCommands` yields to npm only where **neither** verifier resolved, so it still answers.
    const dir = await fixtureFor(t, {
      files: {
        Gemfile: GEMFILE,
        Rakefile: RAKEFILE,
        'package.json': rootManifest(),
        'lib/fixture.rb': 'module Fixture; end\n',
        'test/fixture_test.rb': "require 'minitest/autorun'\n",
      },
    });
    const profile = buildPreset(detectPreset(dir));

    assert.equal(profile.commandFamily, 'bundler');
    assert.deepEqual(profile.resolvedRequired, ['test']);

    const note = onlyNote(profile.notes, TIEBREAK_NOTE);
    assert.match(note, /^commands\.test came from the `bundler` command family/);
    assert.match(note, /commands\.typecheck was not derived by it and carries a placeholder/);
    assert.ok(isPlaceholder(profile.rawCommands.typecheck));
    assert.equal(profile.warnings.filter((warning) => warning.includes('could not be detected')).length, 1);
  });
});
