/**
 * The generated permission profile — the artifact whose failure modes are the reason it is generated
 * at all.
 *
 * **The rule these tests exist to enforce: an entry that matches neither `allow` nor `deny` stalls an
 * unattended run, and nothing about a stall is loud.** There is no error, no prompt and no log line —
 * the run parks. So each assertion below pins one shape that has already cost a run: a quoted path
 * that fails the guard's literal match, a compound command that matches no entry, a wrapper listed
 * for the checkout but not for its sibling worktrees, and a browser tool named in `deny`, which is
 * evaluated before any allow and would revoke the interactive-test agent's own grant. A later edit to
 * the shipped template cannot silently reintroduce any of them without failing here.
 *
 * These run against the **compiled** CLI at `dist/cli.js`, so `npm run build` precedes `npm test`.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **The profile is read from a repository `init` wired, not from a renderer called directly.** The
 *    interesting values — the repository root, the worktree glob, which wrappers exist — are resolved
 *    per run, and a renderer handed values by the test would be asserting against what the test
 *    chose. The one thing that is deliberately *not* end-to-end is the deny floor, below. Two tests
 *    depart from it and each says why where it stands: the outer-loop emission, and which side of the
 *    exit-code line a bad value falls on.
 * 2. **The deny floor is read from the shipped template rather than restated here.** A second copy of
 *    those entries in a test would go stale the first time one was added to the template, and a test
 *    that vouches for a floor by consulting its own copy of it vouches for nothing. It is also why no
 *    destructive command literal appears anywhere in this file.
 * 3. **The parity case is driven in two runs, because that is the sequence an adopter has.** The
 *    toolchain commands are named in the config, and the flag that says where they live is given at
 *    `init` time — so the first run is the one that warns, and the second, against the config the
 *    first wrote, is the one that writes the entries.
 *
 * ## The outer-loop half, and the two departures it needs
 *
 * The profile also allow-lists the outer-loop scripts a *dispatched agent* runs, and refuses to name
 * the ones the watcher process or a person runs — an entry for one of those would hand an agent a
 * path to a branch deletion or a daemon restart. Two things about those assertions are unlike the
 * rest of this file, and both are deliberate:
 *
 * - **They are driven by the shipped table rather than by a list of file names written here.** The
 *   set grows one row at a time as each script's template lands, and a second copy of it in a test
 *   would be stale on the first of those changes — the same reason the deny floor is read from the
 *   template (choice 2). Reading the table also means the negative assertion covers every row that
 *   is *not* agent-invocable, rather than the subset a test author remembered.
 * - **One of them calls the renderer directly, against choice 1.** What that test asserts — that a
 *   row an agent runs contributes exactly its three forms and a row it must not contributes nothing —
 *   is a property of the emission rather than of the shipped set, and a table-driven test can only
 *   check the half its current rows happen to cover. Shipping the mechanism with nothing running
 *   through it is the exact shape this suite exists to catch, so that test hands the renderer a
 *   fabricated pair of written rows and pins both halves whatever the table carries. The end-to-end
 *   test above it stays the authority on everything the fixture can reach.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import {
  createFixture,
  plantModelFiles,
  plantRetrievalRuntime,
  readJson,
  retrievalEnv,
  runCli,
  PACKAGE_ROOT,
} from './helpers/fixture.mjs';

/**
 * A module out of the compiled tree, refused with the same sentence {@link runCli} uses.
 *
 * The outer-loop assertions read the shipped table and the single invocation producer rather than
 * restating either, so they need the built modules and not only the built entry point.
 */
async function built(relativePath) {
  const path = join(PACKAGE_ROOT, 'dist', ...relativePath.split('/'));
  if (!existsSync(path)) {
    throw new Error(
      `${path} is missing. These tests run against the compiled CLI, so run \`npm run build\` before \`npm test\`.`,
    );
  }
  return import(pathToFileURL(path).href);
}

const { OUTER_LOOP_SCRIPTS, outerLoopRelativePath } = await built('generators/outerLoopScripts.js');
const { scriptInvocation } = await built('generators/scripts.js');
const { bashScriptRule, pluginRootEntryTarget, readRule, renderProfile } = await built(
  'generators/permissionProfile.js',
);
const { pluginScriptsDir } = await built('machine/plugins.js');

/** The generated profile, and the template it is generated from. */
const PROFILE_FILE = '.claude/settings.autonomous.json';
const PROFILE_TEMPLATE = join(PACKAGE_ROOT, 'templates', 'claude', 'settings.autonomous.json');

/** The configured directories, at their documented defaults. */
const SCRIPTS_DIR = 'scripts';

/** A `scriptsDir` that is neither the default nor a single segment, so a naive join would show. */
const RELOCATED_SCRIPTS_DIR = 'tools/harness';

/**
 * The key that starts the repository's declared MCP servers, absent unless the phase is on **and**
 * its driver is the browser one.
 */
const ENABLED_SERVERS_KEY = 'enabledMcpjsonServers';

/** A driver that is legal and drives a device runner rather than a browser. */
const QA_DRIVER_MOBILE = 'mobile-maestro';

/** The prefix every browser tool entry carries, and the pattern its server name is read out of. */
const MCP_PREFIX = 'mcp__';
const MCP_SERVER_PATTERN = /^mcp__(.+?)__/;

/**
 * What may never appear in a permission entry: the guard matches an entry literally, so a quote
 * makes a wrapper path fail its `*.sh` match and a shell operator makes a compound that matches
 * nothing at all. `{{` is the third — an unsubstituted token is an entry naming a path nobody has.
 *
 * `///` is the fourth, and it is the one a *joined* path produces: an absolute-path rule is marked
 * with a `//` prefix and the substituted path brings its own leading slash, so a template row that
 * adds a second one leaves a rule matching no file — the same silent nothing as a missing entry.
 */
const FORBIDDEN_IN_ENTRY = ['"', "'", '`', '&', ';', '|', '{{', '///'];

/** The three permission lists, in the order the template writes them. */
const PERMISSION_LISTS = ['allow', 'deny', 'ask'];

/**
 * The file-rule kinds a run needs granted, each with the prefix its rule puts before an absolute
 * path. One syntax governs all three: a rule whose content starts with `//` is anchored at the
 * filesystem root, while a single leading `/` is resolved against the root of the settings file the
 * rule came from. The absolute path brings its own leading slash, so the marked entry carries two
 * slashes and the prefix below is the one the template adds. Spelling the whole entry out is the
 * point, and it is why the prefix is asserted rather than assumed: a one-slash `Edit` rule asks for
 * a file under `<settings root>/Users/…`, which no checkout has, and a rule that matches nothing
 * stalls exactly like a rule that is missing — the same silent nothing a third slash gives.
 */
const FILE_RULE_KINDS = [
  ['Edit', '/'],
  ['Write', '/'],
  ['Read', '/'],
];

/** The line the generator appends when it wrote the reference-toolchain entries. */
const TOOLCHAIN_README = /^THE REFERENCE TOOLCHAIN IS ALLOW-LISTED/;

/**
 * The interactive-test fragment's line about the one entry this profile leaves to the adopter: the
 * phase's helper scripts ship inside the plugin, and an entry keeping the `${…}` token matches
 * nothing because the guard matches the raw command string. The install root is knowable — the
 * agent runner records one per plugin — so what keeps the entry ungenerated is that `init` may run
 * before the plugin is enabled and that the root carries the plugin version, which is why `doctor`
 * re-derives it every run instead. Matched by its shouting lead rather than by the whole sentence —
 * the prose is the part meant to be improved, and a test asserting it verbatim would make every
 * wording fix a test change, which is how the line and the assertion end up saying different things.
 */
const HELPER_SCRIPTS_README = /^THE PHASE'S OWN HELPER SCRIPTS ARE NOT ALLOW-LISTED HERE/;

/**
 * The one way that line can be reworded and still cost a run: a phrase reading as a pointer to an
 * entry the profile already carries. It carries none — that is the whole reason the line exists — so
 * an adopter who follows the pointer scans `allow`, finds browser tools and a port probe, concludes
 * the wiring is there and adds nothing, and the phase stalls at the first helper. This is the
 * anti-pattern rather than the sentence verbatim, for the reason {@link HELPER_SCRIPTS_README} gives:
 * the prose is meant to be improved, and only a claim that the entry is *here* is a defect. A
 * reference to an entry the adopter writes ("the entry you add …") is not one, and neither is the
 * line's own pointer at the wrapper entries, which do exist.
 */
const ENTRY_ALREADY_HERE = /\b(?:the|this|that)\s+entr(?:y|ies)\s+(?:below|here|in this file)\b/i;

/**
 * A `_README` line telling an adopter to RUN the CLI without the prefix every documented adoption
 * path reaches it through. The other half of that rule is the reason only a `run `-led occurrence
 * matches: an occurrence that NAMES the tool ("… does not generate these lines") takes no prefix.
 * The binary is read from the manifest rather than spelled here, for the reason choice 2 gives — a
 * rename would leave a restated name matching nothing while the assertion still passed.
 */
const BIN_NAME = Object.keys(readJson(join(PACKAGE_ROOT, 'package.json')).bin)[0];
const BARE_RUN_IMPERATIVE = new RegExp('\\brun `?(?!npx\\b)' + BIN_NAME + '\\s+[a-z]', 'i');

/** The reference implementation's own commands, named in the config the second run reads. */
const TOOLCHAIN_COMMANDS = ['reference-analyze', 'reference-format'];

/** A repository whose stack detection resolves every command — the same seed `init`'s tests use. */
function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
  };
}

/**
 * A hand-written config `init` keeps and generates against, carrying one non-default value.
 *
 * Minimal on purpose — the schema's required keys plus `projectName`, which the worktree glob is
 * built from and which a kept config is never given by `init`. A config assembled from more than
 * that would make a failure ambiguous between the key being read and the file being accepted at all.
 */
function seededConfig(overrides) {
  return {
    version: 1,
    projectName: 'fixture-project',
    defaultBranch: 'main',
    stateDir: 'sdlc-harness/',
    layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
    commands: { typecheck: 'echo typecheck', test: 'echo test' },
    ...overrides,
  };
}

/** Build a fixture, register its teardown against the test, and return its directory. */
async function fixtureFor(t, extraFiles = {}) {
  const fixture = await createFixture({ files: { ...nodeProjectFiles(), ...extraFiles } });
  t.after(fixture.cleanup);
  return fixture.dir;
}

/** Run `init` and fail with the CLI's own output when it did not exit 0. */
async function initOk(dir, args = []) {
  const result = await runCli(dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

/** Wire a fixture and return the profile it generated, parsed and raw. */
async function profileFor(t, args = [], extraFiles = {}) {
  const dir = await fixtureFor(t, extraFiles);
  await initOk(dir, args);
  return { dir, profile: readJson(join(dir, PROFILE_FILE)), text: readFileSync(join(dir, PROFILE_FILE), 'utf8') };
}

/** One permission list's entries. */
function entries(profile, list) {
  return profile.permissions[list] ?? [];
}

/** Every entry of every permission list. */
function allEntries(profile) {
  return PERMISSION_LISTS.flatMap((list) => entries(profile, list));
}

/** The sibling-worktree pattern the profile was generated with, read back from the wired repository. */
function worktreeGlobFor(dir) {
  return join(dirname(dir), `${readJson(join(dir, 'harness.config.json')).projectName}-*`);
}

/**
 * The `.sh` files the WRAPPER generator actually wrote, sorted — the outer-loop family subtracted,
 * from the shipped table rather than from a list of names here.
 *
 * Both families land directly in `scriptsDir`, and only the outer-loop rows the table marks
 * agent-invocable are ever allow-listed — so a directory scan alone would require every one of them
 * to have an allow entry, which is the opposite of what the table says about the rows that mutate
 * checkouts. Their pairing is the table-driven test below; this one is about wrappers.
 */
async function writtenWrappers(dir) {
  const outerLoop = OUTER_LOOP_SCRIPTS.map((script) => script.file);
  const found = await readdir(join(dir, SCRIPTS_DIR), { withFileTypes: true });
  return found
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sh'))
    .map((entry) => entry.name)
    .filter((name) => !outerLoop.includes(name))
    .sort();
}

/** Assert every entry in every list is one unquoted command the guard can match literally. */
function assertEntriesRunnable(profile) {
  for (const list of PERMISSION_LISTS) {
    for (const entry of entries(profile, list)) {
      for (const needle of FORBIDDEN_IN_ENTRY) {
        assert.ok(
          !entry.includes(needle),
          `permissions.${list} carries ${JSON.stringify(entry)}, which contains ${JSON.stringify(needle)}: the ` +
            'guard matches an entry literally, so it would fall through to a prompt and stall an unattended run',
        );
      }
    }
  }
}

test('with the interactive-test phase off, the profile carries no browser wiring at all', async (t) => {
  const { profile, text } = await profileFor(t);

  // The whole document, not only the permission lists: an adopter who never drives a browser should
  // find nothing here to suggest they do.
  assert.ok(!text.includes(MCP_PREFIX), `${PROFILE_FILE} names a browser tool with the phase off`);
  assert.ok(!Object.hasOwn(profile, ENABLED_SERVERS_KEY), `${ENABLED_SERVERS_KEY} was written with the phase off`);

  // No `hooks` key, deliberately: the plugin's own guard hooks fire from the plugin and append to
  // whatever the adopter already has, so writing them here as well would run each guard twice.
  assert.ok(!Object.hasOwn(profile, 'hooks'), 'the profile writes a hooks key, which would double every guard');

  // The floor, compared against the shipped template rather than a second copy of it — choice 2.
  const floor = entries(JSON.parse(readFileSync(PROFILE_TEMPLATE, 'utf8')), 'deny');
  assert.ok(floor.length > 0, 'the shipped template declares no deny entries, so there is no floor to check against');
  for (const entry of floor) {
    assert.ok(entries(profile, 'deny').includes(entry), 'the generated deny list dropped an entry the template ships');
  }
});

test('every permission entry is a single unquoted command, with the phase off and on', async (t) => {
  for (const args of [[], ['--qa']]) {
    await t.test(args.length === 0 ? 'phase off' : 'phase on', async (subtest) => {
      const { profile } = await profileFor(subtest, args);
      assertEntriesRunnable(profile);
    });
  }
});

test('every wrapper that was written is allow-listed for this checkout and for a sibling worktree', async (t) => {
  const { dir, profile } = await profileFor(t);
  const written = await writtenWrappers(dir);
  assert.ok(written.length > 0, 'this fixture wrote no wrapper scripts, so there is nothing to pair');

  const worktreeGlob = worktreeGlobFor(dir);
  const allow = entries(profile, 'allow');

  for (const name of written) {
    // A run executing in a second working copy that matches neither form does not fail loudly: it
    // silently skips whatever phase needed the path.
    for (const form of [join(dir, SCRIPTS_DIR, name), join(worktreeGlob, SCRIPTS_DIR, name)]) {
      assert.ok(
        allow.some((entry) => entry.includes(form)),
        `no allow entry names ${form}`,
      );
    }
  }
});

/** The three forms one script under `scriptsDir` contributes, given where the repository sits. */
function expectedForms({ repoRoot, worktreeGlob, scriptsDir, relative }) {
  return [
    `Bash(${scriptInvocation(scriptsDir, relative)}:*)`,
    `Bash(bash ${join(repoRoot, scriptsDir, relative)}:*)`,
    `Bash(bash ${join(worktreeGlob, scriptsDir, relative)}:*)`,
  ];
}

test('an outer-loop script an agent runs is allow-listed in three forms, and every other one is named nowhere', async (t) => {
  // Both a default `scriptsDir` and a relocated multi-segment one: the second is where a naive join
  // or a hand-formatted invocation would show, and it is the case an adopter who moved the directory
  // has.
  for (const scriptsDir of [SCRIPTS_DIR, RELOCATED_SCRIPTS_DIR]) {
    await t.test(`scriptsDir ${scriptsDir}`, async (subtest) => {
      const seeded = scriptsDir === SCRIPTS_DIR ? {} : { 'harness.config.json': seededConfig({ scriptsDir }) };
      const { dir, profile } = await profileFor(subtest, [], seeded);
      const worktreeGlob = worktreeGlobFor(dir);
      const everyEntry = allEntries(profile);

      assert.ok(OUTER_LOOP_SCRIPTS.length > 0, 'the shipped table declares no outer-loop scripts to check');

      for (const script of OUTER_LOOP_SCRIPTS) {
        const relative = outerLoopRelativePath(script);
        const naming = everyEntry.filter((entry) => entry.includes(script.file)).sort();

        // The refusal, and the one worth the most: these are the files that commit, push, remove
        // worktrees, delete branches and restart a daemon. An entry for one of them is not a stall —
        // it is a grant nobody asked for, and it would never be noticed by a run that worked.
        if (!script.agentInvocable) {
          assert.deepEqual(
            naming,
            [],
            `${relative} is not agent-invocable and the profile names it in ${naming.length} entr${naming.length === 1 ? 'y' : 'ies'}: it is run by the watcher process or by a person, and an entry hands a dispatched agent a path to it`,
          );
          continue;
        }

        const expected = expectedForms({ repoRoot: dir, worktreeGlob, scriptsDir, relative }).sort();
        assert.deepEqual(
          naming,
          expected,
          `${relative} is not allow-listed in exactly the three forms a caller may use: a caller using a missing spelling matches neither allow nor deny, which parks an unattended run`,
        );

        // Form (i) is the invocation producer's own return value rather than a lookalike: the corpus
        // invokes these scripts by that exact string, and a profile spelling it any other way is an
        // entry that matches nothing.
        assert.ok(
          entries(profile, 'allow').includes(`Bash(${scriptInvocation(scriptsDir, relative)}:*)`),
          `the repo-relative form of ${relative} is not scriptInvocation's own output`,
        );
      }

      assertEntriesRunnable(profile);
    });
  }
});

/**
 * The one row whose entries *are* a capability rather than a convenience: without all three, an
 * agent reaching for the spelling that is missing draws a prompt no unattended run answers, and the
 * probe or mutation check it was going to run is silently downgraded to a claim nobody executed.
 */
const SCRATCH_FILE = 'scratch-run.sh';

test('the scratch runner is allow-listed in exactly its three forms, and asked about in none', async (t) => {
  const { dir, profile } = await profileFor(t);
  const naming = (list) => entries(profile, list).filter((entry) => entry.includes(SCRATCH_FILE));

  // Exactly three rather than at least one: the count is the invariant, and a dropped form is
  // invisible until the run that happened to use that spelling parks.
  assert.deepEqual(
    naming('allow').sort(),
    expectedForms({
      repoRoot: dir,
      worktreeGlob: worktreeGlobFor(dir),
      scriptsDir: SCRIPTS_DIR,
      relative: SCRATCH_FILE,
    }).sort(),
    `${SCRATCH_FILE} is not allow-listed in the repo-relative, repo-root-absolute and sibling-worktree forms`,
  );

  // And in `ask` in none of them: an `ask` entry is a prompt by another name, so it stalls a run
  // exactly as a missing entry does — while reading, in review, like a grant that was made.
  assert.deepEqual(naming('ask'), [], `${SCRATCH_FILE} is named in permissions.ask, which prompts an unattended run`);
});

test('the three-form emission holds for a written outer-loop row an agent runs, and drops one it must not', async (t) => {
  // Driven rather than end-to-end, so both halves of the emission are pinned whatever the shipped
  // table carries — including the day its last agent-invocable row is removed or its last refused one
  // is. See the module header. The rows below are fabricated for this test and are not a second
  // declaration of the shipped set — every name here is prefixed to say so.
  const repoRoot = join('/', 'fixture-work-root', 'fixture-project');
  const workRoot = join('/', 'fixture-work-root');
  const projectName = 'fixture-project';
  const worktreeGlob = join(workRoot, `${projectName}-*`);

  for (const scriptsDir of [SCRIPTS_DIR, RELOCATED_SCRIPTS_DIR]) {
    await t.test(`scriptsDir ${scriptsDir}`, () => {
      const invocable = { file: 'fixture-agent-runs-this.sh', mode: 0o755, agentInvocable: true };
      const refused = { file: 'fixture-watcher-runs-this.sh', mode: 0o755, agentInvocable: false };
      const sourcedOnly = { file: 'fixture-sourced-only.sh', subdir: 'lib', mode: 0o644, agentInvocable: false };

      const profile = renderProfile({
        repoRoot,
        workRoot,
        config: { version: 1, projectName, defaultBranch: 'main', scriptsDir, layers: [], commands: {} },
        // No wrapper was written, so the wrapper rows expand to nothing and every `.sh` entry below
        // came from the outer-loop family.
        written: [],
        writtenOuterLoop: [invocable, refused, sourcedOnly].map((script) => ({
          ...script,
          invocation: scriptInvocation(scriptsDir, outerLoopRelativePath(script)),
        })),
      });

      const everyEntry = allEntries(profile);
      assert.deepEqual(
        everyEntry.filter((entry) => entry.includes(invocable.file)).sort(),
        expectedForms({ repoRoot, worktreeGlob, scriptsDir, relative: invocable.file }).sort(),
        `${invocable.file} is agent-invocable and did not contribute exactly its three forms`,
      );

      for (const script of [refused, sourcedOnly]) {
        assert.deepEqual(
          everyEntry.filter((entry) => entry.includes(script.file)),
          [],
          `${script.file} is not agent-invocable and reached the profile anyway`,
        );
      }

      assertEntriesRunnable(profile);
    });
  }
});

/** The sentence every internal fault ends with, and the one an adopter-facing refusal must not carry. */
const INTERNAL_SUFFIX = /fault in this CLI rather than in the repository it was run against/;

test('a bad value is refused as the repository\'s or as this CLI\'s, and the two do not exit the same way', async (t) => {
  // Driven rather than end-to-end, because what is asserted is where the line falls: the same
  // forbidden character reaches the profile from a value the adopter chose and from one this CLI
  // produced, and a wired fixture can only be given one of them at a time - its own directory name is
  // the runner's. Reported alike, they told an adopter whose checkout sits under an `R&D` directory
  // that the tool was broken, when a rename fixed it. The values below are fabricated for this test.
  const repoRoot = join('/', 'fixture-work-root', 'fixture-project');
  const base = {
    repoRoot,
    workRoot: join('/', 'fixture-work-root'),
    config: {
      version: 1,
      projectName: 'fixture-project',
      defaultBranch: 'main',
      scriptsDir: SCRIPTS_DIR,
      layers: [],
      commands: {},
    },
    written: [],
    writtenOuterLoop: [],
  };
  const withConfig = (overrides) => ({ ...base, config: { ...base.config, ...overrides } });

  // Every value the adopting repository supplies that an entry is built from - the checkout it sits
  // in, and the three configured names - each with the key its message has to send the reader to.
  const repositorySide = [
    ['the checkout path', { ...base, repoRoot: join('/', 'fixture-work-root', 'R&D', 'app') }, /repository root/],
    ['projectName', withConfig({ projectName: "Dan's App" }), /projectName/],
    ['scriptsDir', withConfig({ scriptsDir: 'tools/build&deploy' }), /scriptsDir/],
    ['stateDir', withConfig({ stateDir: 'state|dir' }), /stateDir/],
  ];

  for (const [name, options, namesTheValue] of repositorySide) {
    await t.test(name, () => {
      assert.throws(
        () => renderProfile(options),
        (error) => {
          assert.equal(
            error.exitCode,
            1,
            `a ${name} the adopter chose exited ${error.exitCode}, which is this CLI reporting its own ` +
              `bug, rather than 1, which is the repository being told what to correct:\n${error.message}`,
          );
          assert.match(
            error.message,
            namesTheValue,
            `the refusal does not name what the adopter has to change:\n${error.message}`,
          );
          assert.doesNotMatch(
            error.message,
            INTERNAL_SUFFIX,
            `the refusal tells the adopter the fault is not theirs, about a value that is:\n${error.message}`,
          );
          return true;
        },
      );
    });
  }

  // And the other side of the line, which must not move: a forbidden character in a value this CLI
  // produced - a script file name out of its own shipped table - is still its own fault to report.
  await t.test('a script name this CLI produced', () => {
    const row = { file: 'fixture-generator-wrote&this.sh', mode: 0o755, agentInvocable: true };
    assert.throws(
      () =>
        renderProfile({
          ...base,
          writtenOuterLoop: [{ ...row, invocation: scriptInvocation(SCRIPTS_DIR, outerLoopRelativePath(row)) }],
        }),
      (error) => {
        assert.equal(
          error.exitCode,
          2,
          `an entry this CLI built out of its own file name exited ${error.exitCode} rather than 2, so a ` +
            `packaging fault is now reported as something the adopter can fix:\n${error.message}`,
        );
        assert.match(error.message, INTERNAL_SUFFIX, `the fault is not stated as this CLI's:\n${error.message}`);
        return true;
      },
    );
  });
});

test('reading, changing and creating a file are each granted, for this checkout and for a sibling worktree', async (t) => {
  const { dir, profile } = await profileFor(t);
  const allow = entries(profile, 'allow');

  for (const [kind, prefix] of FILE_RULE_KINDS) {
    // Creating a file and changing one are different grants, and it is creating that the flow does
    // most: a plan, a review, a ledger entry and a new source file are all written, not edited. A
    // profile carrying only the `Edit` pair leaves the commonest operation in the flow matching
    // neither `allow` nor `deny`, which in print mode parks the run instead of refusing the call.
    for (const path of [dir, worktreeGlobFor(dir)]) {
      const expected = `${kind}(${prefix}${path}/**)`;
      assert.ok(allow.includes(expected), `no allow entry is ${expected}`);

      // And the unmarked form is not a tolerable near-miss to sit beside it: it is resolved against
      // the settings source root rather than the filesystem root, so it reads like a grant and
      // matches no file. Asserting its absence is what makes a template row that drops the prefix
      // fail here rather than at the first write into a sibling worktree.
      const unmarked = `${kind}(${path}/**)`;
      assert.ok(!allow.includes(unmarked), `an allow entry is ${unmarked}, which is not absolute and matches no file`);
    }
  }
});

test('with the phase on, the browser servers start, their tools are allowed, and deny stays clear', async (t) => {
  const { profile } = await profileFor(t, ['--qa']);

  const started = profile[ENABLED_SERVERS_KEY] ?? [];
  // An un-loaded tool in print mode stalls rather than failing, so a grant without the enablement
  // is the failure mode this pairing exists to prevent.
  assert.ok(started.length > 0, `${ENABLED_SERVERS_KEY} starts no server, so the allowed tools would not exist`);

  const granted = new Set(
    entries(profile, 'allow')
      .filter((entry) => entry.startsWith(MCP_PREFIX))
      .map((entry) => MCP_SERVER_PATTERN.exec(entry)?.[1]),
  );
  for (const server of started) {
    assert.ok(granted.has(server), `${server} is started and no allow entry names a tool of it`);
  }

  // The closure that is made per agent and never here: a deny wins over an allow, so a browser deny
  // in this file would revoke the interactive-test agent's own grant along with everyone else's.
  for (const entry of entries(profile, 'deny')) {
    assert.ok(!entry.includes(MCP_PREFIX), `the deny list names the browser tool ${JSON.stringify(entry)}`);
  }
});

test('the phase on with a mobile driver carries no browser wiring, while the browser driver carries all of it', async (t) => {
  // The two branches side by side, because the interesting property is the difference: the same
  // phase, the same everything else, and the wiring present in one and absent in the other.
  const { profile: mobile, text: mobileText } = await profileFor(t, ['--qa', '--qa-driver', QA_DRIVER_MOBILE]);
  const { profile: browser } = await profileFor(t, ['--qa']);

  assert.ok(
    !Object.hasOwn(mobile, ENABLED_SERVERS_KEY),
    `${ENABLED_SERVERS_KEY} was written for a driver whose agent variant has a built-ins-only allowlist, so the ` +
      'profile would start a browser no run can call',
  );
  // The whole document, as in the phase-off case: an adopter driving a device runner should find
  // nothing here suggesting a browser is part of their phase.
  assert.ok(!mobileText.includes(MCP_PREFIX), `${PROFILE_FILE} names a browser tool for a mobile driver`);

  // The floor is the phase's, not the fragment's: withholding the browser half must not withhold
  // the deny entries every generated profile ships with.
  const floor = entries(JSON.parse(readFileSync(PROFILE_TEMPLATE, 'utf8')), 'deny');
  assert.ok(floor.length > 0, 'the shipped template declares no deny entries, so there is no floor to check against');
  for (const entry of floor) {
    assert.ok(entries(mobile, 'deny').includes(entry), 'a mobile driver dropped a deny entry the template ships');
  }

  // And the shipping default is undisturbed — the gate added a branch rather than narrowing the one
  // that was there.
  assert.ok((browser[ENABLED_SERVERS_KEY] ?? []).length > 0, 'the browser driver started no server');
  assert.ok(
    entries(browser, 'allow').some((entry) => entry.startsWith(MCP_PREFIX)),
    'the browser driver allow-listed no browser tool',
  );
});

/** The docs-retrieval half's server and its one tool entry, spelled as the contract. */
const DOCS_SERVER = 'harness-docs';
const DOCS_TOOL_ENTRY = 'mcp__harness-docs__search_docs';

/**
 * The profile `init` generates over a seeded config carrying `phases.docs` and `docs.retrieval` as
 * given, under a throwaway retrieval cache with the stub models and the runtime planted.
 */
async function retrievalProfileFor(t, { docsPhase, retrieval }) {
  const config = seededConfig({
    phases: { docs: docsPhase },
    docs: { root: 'docs', ...(retrieval ? { retrieval: true } : {}) },
  });
  const dir = await fixtureFor(t, { 'harness.config.json': config, 'docs/README.md': '# docs\n' });
  const cacheHome = await mkdtemp(join(tmpdir(), 'harness-retrieval-cache-'));
  t.after(() => rm(cacheHome, { recursive: true, force: true }));
  await plantModelFiles(cacheHome);
  await plantRetrievalRuntime(cacheHome);
  const result = await runCli(dir, ['init'], retrievalEnv(cacheHome));
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return { profile: readJson(join(dir, PROFILE_FILE)), text: readFileSync(join(dir, PROFILE_FILE), 'utf8') };
}

/**
 * Neither half of the retrieval wiring: no started docs server, and the tool entry nowhere in the
 * document. The bare server name is not searched for in the whole text, because the base template's
 * `_README` names it where it explains why the launcher script has no entry of its own.
 */
function assertNoRetrievalWiring(profile, text, label) {
  assert.ok(
    !(profile[ENABLED_SERVERS_KEY] ?? []).includes(DOCS_SERVER),
    `${ENABLED_SERVERS_KEY} starts ${DOCS_SERVER} with ${label}`,
  );
  assert.ok(!text.includes(DOCS_TOOL_ENTRY), `${PROFILE_FILE} names ${DOCS_TOOL_ENTRY} with ${label}`);
}

test('retrieval on starts the docs server and allows its tool, and either gate off leaves both out', async (t) => {
  const { profile } = await retrievalProfileFor(t, { docsPhase: true, retrieval: true });
  assert.ok(
    (profile[ENABLED_SERVERS_KEY] ?? []).includes(DOCS_SERVER),
    `${ENABLED_SERVERS_KEY} does not start ${DOCS_SERVER}`,
  );
  assert.ok(entries(profile, 'allow').includes(DOCS_TOOL_ENTRY), `permissions.allow carries no ${DOCS_TOOL_ENTRY}`);

  await t.test('docs.retrieval off', async (subtest) => {
    const off = await retrievalProfileFor(subtest, { docsPhase: true, retrieval: false });
    assertNoRetrievalWiring(off.profile, off.text, 'docs.retrieval off');
  });

  // Driven through the renderer rather than `init`: the config check refuses `docs.retrieval` without
  // `phases.docs`, so no wired repository can carry this pair, and what is pinned is that the
  // profile's own gate reads the phase too.
  await t.test('phases.docs off', () => {
    const repoRoot = join('/', 'fixture-work-root', 'fixture-project');
    const profile = renderProfile({
      repoRoot,
      workRoot: join('/', 'fixture-work-root'),
      config: seededConfig({ phases: { docs: false }, docs: { root: 'docs', retrieval: true } }),
      written: [],
    });
    assertNoRetrievalWiring(profile, JSON.stringify(profile), 'phases.docs off');
  });
});

test('the phase carries the one instruction an adopter must act on by hand, and only when it is on', async (t) => {
  // The helper scripts are the phase's, so the line is the fragment's: an adopter who never drives a
  // browser is not told to add an entry for scripts nothing in their run will call. Both directions
  // are asserted for the same reason the browser wiring is - the fragment is the phase's half, and a
  // line that leaked into the base would ask every adopter to do work the phase-off profile does not
  // need.
  const { profile: withPhase } = await profileFor(t, ['--qa']);
  const stated = withPhase._README.filter((line) => HELPER_SCRIPTS_README.test(line));
  assert.equal(
    stated.length,
    1,
    `the phase-on profile states the helper-script gap ${stated.length} times, not once: an entry for those ` +
      'scripts is not generated, so the only thing standing between an adopter and a stalled phase is ' +
      'this line telling them to add one',
  );

  // And it has to send them to an entry they write, never to one in the file: the profile carries no
  // helper entry and generates none, so a pointer at an entry "below" is read as "already wired", which ends
  // in the same silent stall the line is there to prevent. The line carried such a pointer once.
  const misdirection = ENTRY_ALREADY_HERE.exec(stated[0]);
  assert.equal(
    misdirection,
    null,
    `the helper-script line points at ${JSON.stringify(misdirection?.[0])}, as if this profile already ` +
      'carried an entry for the helpers: it carries none and generates none, so every mention of ' +
      'an entry in that line has to be one the adopter adds by hand',
  );

  const { profile: withoutPhase } = await profileFor(t);
  assert.equal(
    withoutPhase._README.filter((line) => HELPER_SCRIPTS_README.test(line)).length,
    0,
    'the phase-off profile carries the helper-script line, which asks an adopter who never drives a browser ' +
      'to add an allow entry for scripts their run never calls',
  );
});

test('no _README line tells an adopter to run the CLI in a form no adoption path installs', async (t) => {
  // The quick start reaches the CLI through `npx` and a contributor's loop through the compiled entry
  // point, so a bare `<bin> <verb>` an adopter is told to RUN reports `command not found`. These lines
  // are the worst place for it: several are recovery instructions, read once a run has already parked.
  // Both profiles are checked because the phase fragment's lines merge into this same array, and a
  // sweep that reached only one house is what let the last one through.
  const { profile: withPhase } = await profileFor(t, ['--qa']);
  const { profile: withoutPhase } = await profileFor(t);
  for (const [label, profile] of [
    ['phase-on', withPhase],
    ['phase-off', withoutPhase],
  ]) {
    for (const line of profile._README ?? []) {
      const bare = BARE_RUN_IMPERATIVE.exec(line);
      assert.equal(
        bare,
        null,
        `the ${label} profile tells an adopter to ${JSON.stringify(bare?.[0])}: no documented adoption ` +
          'path puts the CLI on the PATH, so that command reports "command not found" at the moment the ' +
          'line is read — an occurrence a reader RUNS carries the npx prefix, one that names the tool does not',
      );
    }
  }
});

test('the reference toolchain is allow-listed only once the flag says where it is', async (t) => {
  const dir = await fixtureFor(t);

  // Run one: the phase is on and the flag was not given, so nothing is allow-listed and the adopter
  // is told which flag adds it.
  const { stderr } = await initOk(dir, ['--parity', '--reference-impl', 'reference']);
  assert.match(stderr, /--reference-toolchain-path/);
  const first = readJson(join(dir, PROFILE_FILE));
  assert.equal(first._README.filter((line) => TOOLCHAIN_README.test(line)).length, 0);

  // Run two, against the config run one wrote: the commands are named there, the directory is given
  // on the command line, and the profile is regenerated because it is no longer present.
  const commands = JSON.stringify(TOOLCHAIN_COMMANDS);
  const setResult = await runCli(dir, ['config', 'set', 'parity.toolchainCommands', commands]);
  assert.equal(setResult.status, 0, setResult.stderr);
  await rm(join(dir, PROFILE_FILE));

  const toolchain = join(dir, 'reference-toolchain');
  await initOk(dir, ['--reference-toolchain-path', toolchain]);

  const second = readJson(join(dir, PROFILE_FILE));
  const allow = entries(second, 'allow');
  for (const command of TOOLCHAIN_COMMANDS) {
    const matching = allow.filter((entry) => entry.includes(join(toolchain, command)));
    assert.equal(matching.length, 1, `${command} is allow-listed ${matching.length} times, not once`);
  }
  assert.equal(
    second._README.filter((line) => TOOLCHAIN_README.test(line)).length,
    1,
    'the entries were written without the line explaining why a machine-local path is in this file',
  );
  assertEntriesRunnable(second);
});

/** Two plugin install roots whose bytes a naive parser trips on: a space, and a percent. */
const PLUGIN_ROOTS = [
  join('/', 'fixture home', 'plugins', 'harness sdlc 0.1.0'),
  join('/', 'fixture-home', 'plugins', 'harness%sdlc-0.1.0'),
];

/** One helper under such a root, by name only — the round trip pins the entry form, not the file. */
const PLUGIN_HELPER = 'reserve-qa-user.sh';

test('a plugin root reads back out of either entry form, and an entry naming no directory reads back as nothing', async (t) => {
  // The plugin half is driven rather than end-to-end, against choice 1: nothing generates a
  // plugin-root entry - `init` may run before the plugin is enabled and the root carries the plugin
  // version - so no wired fixture produces one to read back. The roots below are fabricated, and each
  // is asserted through the two builders rather than against a hand-written entry, so the round trip
  // cannot pass on two matching typos. The repository half IS end-to-end, and pins the case that
  // makes a caller's own exclusion of its checkout necessary.
  // The round trip below passes as long as builder and inverse agree, so it cannot catch a change
  // that moves both. These two pin the forms themselves: the entry text an operator pastes out of
  // `doctor`, and the `scripts` segment taken from `machine/plugins.js` rather than spelled here.
  await t.test('the fixed text each builder writes, which doctor prints for an operator to paste', () => {
    const probe = join('/', 'fixture-home', 'probe root');
    assert.equal(readRule(probe), `Read(/${probe}/**)`, 'the read form changed shape');
    assert.equal(bashScriptRule(probe), `Bash(bash ${probe}:*)`, 'the wrapper form changed shape');
  });

  await t.test('either form of a plugin root, through the builders it inverts', () => {
    for (const root of PLUGIN_ROOTS) {
      assert.equal(pluginRootEntryTarget(readRule(root)), root, `the read form of ${root} did not read back`);
      assert.equal(
        pluginRootEntryTarget(bashScriptRule(join(pluginScriptsDir(root), PLUGIN_HELPER))),
        root,
        `the helper form under ${root} did not read back, so a plugin root the extractor is the only ` +
          'reader of would carry forward as nothing',
      );
    }
  });

  const { dir, profile } = await profileFor(t);
  const allow = entries(profile, 'allow');
  const worktreeGlob = worktreeGlobFor(dir);

  await t.test('the repository root, out of the two entries init really wrote', async () => {
    const [wrapper] = await writtenWrappers(dir);
    assert.ok(wrapper !== undefined, 'this fixture wrote no wrapper, so there is no generated entry to read back');

    for (const entry of [readRule(dir), bashScriptRule(join(dir, SCRIPTS_DIR, wrapper))]) {
      assert.ok(allow.includes(entry), `the generated profile carries no entry ${entry}, so this case reads back a string nothing writes`);
      assert.equal(
        pluginRootEntryTarget(entry),
        dir,
        `${entry} read back as something other than this checkout: under the default scriptsDir it is ` +
          'byte-identical to what the plugin-helper form builds, so answering nothing here would make a ' +
          "caller's exclusion of its own repository root dead code",
      );
    }
  });

  await t.test('an entry that names no directory at all', () => {
    for (const [described, entry] of [
      ['a browser tool', `${MCP_PREFIX}playwright__browser_click`],
      ['the repo-relative wrapper form', `Bash(${scriptInvocation(SCRIPTS_DIR, 'test.sh')}:*)`],
      ['the sibling-worktree wrapper form', bashScriptRule(join(worktreeGlob, SCRIPTS_DIR, 'test.sh'))],
      ['the sibling-worktree read form', readRule(worktreeGlob)],
      ['a toolchain rule, which carries no bash prefix', `Bash(${join('/', 'fixture-toolchain', 'analyze')}:*)`],
    ]) {
      assert.equal(
        pluginRootEntryTarget(entry),
        undefined,
        `${described} (${entry}) read back as a directory: a pattern is not one, and a repo-relative path names a different one for every caller`,
      );
    }
  });
});
