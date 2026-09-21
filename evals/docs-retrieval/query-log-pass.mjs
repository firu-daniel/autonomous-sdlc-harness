/**
 * The query-log pass: the shipped `search_docs` query log exercised over MCP against the real models.
 *
 * **The rule this module exists to enforce: this is the only pass whose numbers include the per-call
 * incremental refresh and the MCP round trip, and it takes them through the shipped server rather than
 * through the library.** `logQuery` is called from `cli/src/retrieval/server.ts` alone, so a runner
 * driving `searchDocs` directly — which is what arms B-E do — writes no record at all; and the server
 * hardcodes `mode: 'fused-rerank'` and accepts `query` and `k` only, so every record it can write is an
 * arm E record. Its latency is therefore reported here, separately from library-level arm E, and the gap
 * between the two is what this pass exists to measure.
 *
 * **Two legs, and the assertions are the shipped suite's.** `cli/test/docs-retrieval.test.mjs` already
 * carries them as `serve (h)`-`(j)` under the stub; what is net-new here is the same two properties
 * against the real models — one record per call carrying every declared field, and nothing created
 * anywhere with the log variable unset.
 *
 * **Nothing is typed here that has an owner.** The two environment-variable names reach this module
 * through their own constants, in the child environments it composes and in every sentence it renders;
 * the record's key set and the outcome union are read off the source file that declares them; the
 * percentile is the one the arms are scored with; and the fixture's file set and layer entries are
 * derived from the resolved corpus, so a layer added to the checkout's configuration grows the fixture
 * or fails the equality check below.
 *
 * **Why a throwaway fixture repository.** `docs serve` refuses unless `retrievalApplies` — `phases.docs`
 * and `docs.retrieval` both true — and this repository's configuration has neither and is deliberately
 * left alone. The fixture mirrors the resolved corpus under the system temp directory, never inside this
 * checkout, and is removed on the way out including on failure.
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { CONFIG_FILENAME } from '../../cli/dist/config/model.js';
import { corpusFiles } from '../../cli/dist/retrieval/corpus.js';
import { EMBEDDING_MODEL, RERANK_MODEL, RETRIEVAL_STUB_ENV } from '../../cli/dist/retrieval/models.js';
import { RETRIEVAL_LOG_ENV } from '../../cli/dist/retrieval/queryLog.js';
import { SEARCH_TOOL_NAME } from '../../cli/dist/retrieval/server.js';
import { DEFAULT_RESULTS } from '../../cli/dist/retrieval/search.js';
import { corpusConfig } from './corpora.mjs';
import { assertRealModelsAreAvailable } from './index-build.mjs';
import { percentile } from './metrics.mjs';
import { loadQueries } from './queries.mjs';
import { GENERATED_END, GENERATED_START } from './results.mjs';

/** The corpus this pass mirrors: the larger committed one, whose library-level arm E it is compared against. */
const PASS_CORPUS = 'self-docs';

/** The arm whose library-level latency this pass is the server-side counterpart of. */
const COMPARED_ARM = 'E';

/** The compiled entry point the fixture's server is spawned from, repo-relative. */
const CLI_ENTRY = 'cli/dist/cli.js';

/** The file of record the compared arm E figures are read out of, repo-relative. */
const RESULTS_FILE = 'docs/retrieval-eval-results.md';

/** The source file that declares one log record's key set and the outcome union, repo-relative. */
const RECORD_CONTRACT_SOURCE = 'cli/src/retrieval/queryLog.ts';

/** The log file's name inside the fixture; the leg that sets the variable points it here. */
const LOG_BASENAME = 'query-log.jsonl';

/** A budget per call wide enough for the first one, which carries the cold build of the whole corpus. */
const CALL_TIMEOUT_MS = 900_000;

/** The two legs, named from the variable that distinguishes them rather than from a retyped word. */
const LOGGED_LEG = `\`${RETRIEVAL_LOG_ENV}\` set`;
const UNSET_LEG = `\`${RETRIEVAL_LOG_ENV}\` unset`;

function refuse(message) {
  throw new Error(`eval: query-log pass: ${message}`);
}

/**
 * The record contract, read off {@link RECORD_CONTRACT_SOURCE}: the `QueryLogRecord` keys in
 * declaration order and the `QueryOutcome` values.
 *
 * Read rather than retyped, because the whole point of the assertion below is that a field renamed or
 * dropped in that file fails here — which a second copy of the list would hide.
 */
function recordContract(repoRoot) {
  const path = join(repoRoot, RECORD_CONTRACT_SOURCE);
  const text = readFileSync(path, 'utf8');

  const interfaceStart = text.indexOf('interface QueryLogRecord {');
  if (interfaceStart === -1) refuse(`${path} declares no QueryLogRecord interface to read the key set off`);
  const interfaceEnd = text.indexOf('\n}', interfaceStart);
  const body = text.slice(interfaceStart, interfaceEnd);
  // Anchored at line start, so the nested `readonly` members of the `refresh` object type — which sit
  // inside one line — are not read as record keys of their own.
  const keys = [...body.matchAll(/^ {2}readonly ([A-Za-z]+)\??:/gm)].map((match) => match[1]);

  const unionStart = text.indexOf('type QueryOutcome =');
  if (unionStart === -1) refuse(`${path} declares no QueryOutcome union to read the legal outcomes off`);
  const union = text.slice(unionStart, text.indexOf(';', unionStart));
  const outcomes = [...union.matchAll(/'([^']+)'/g)].map((match) => match[1]);

  if (keys.length === 0 || outcomes.length === 0) {
    refuse(`${path} was read but yielded ${keys.length} record keys and ${outcomes.length} outcomes`);
  }
  return { source: RECORD_CONTRACT_SOURCE, keys, outcomes };
}

/** Every regular file under `dir`, as sorted paths relative to it — the listing the unset leg is graded on. */
function fileListing(dir, prefix = '', out = []) {
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) fileListing(dir, path, out);
    else out.push(path);
  }
  return out;
}

function git(dir, args) {
  execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * A git-initialized fixture repository under the system temp directory, holding exactly the files the
 * resolved corpus names, at the same repo-relative paths.
 *
 * The configuration it carries is the checkout's own, with the resolved corpus's own keys layered over
 * it — so the layer entries are the resolved ones mapped onto their copied paths, one for one, and no
 * layer count and no rules-document path is written here. The only values the fixture adds are its own:
 * the two `retrievalApplies` keys and the documentation root, which this repository's configuration
 * deliberately does not satisfy.
 */
function buildFixture(repoRoot, resolved) {
  const corpus = corpusFiles(resolved.repoRoot, resolved.config);
  if (corpus.files.length === 0) refuse(`corpus ${resolved.id} resolved to no files, so there is nothing to mirror`);

  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'harness-query-log-pass-')));
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

/**
 * One leg: a `docs serve` child over the fixture, every query in the set called once through the SDK's
 * own stdio client, each round trip timed from the client side.
 *
 * `logPath` set points the child's log at that file; `logPath` `undefined` deletes the key from the
 * child's environment, which is the difference between the two legs and the only difference. The stub
 * key is deleted either way, so the child loads the real models.
 */
async function runLeg({ repoRoot, fixtureDir, queries, logPath }) {
  const env = { ...process.env };
  delete env[RETRIEVAL_STUB_ENV];
  if (logPath === undefined) delete env[RETRIEVAL_LOG_ENV];
  else env[RETRIEVAL_LOG_ENV] = logPath;

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(repoRoot, CLI_ENTRY), 'docs', 'serve', '--cwd', fixtureDir],
    env,
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });

  const client = new Client({ name: 'docs-retrieval-query-log-pass', version: '0.0.0' });
  const calls = [];
  try {
    await client.connect(transport);
    for (const query of queries) {
      const started = performance.now();
      const result = await client.callTool({ name: SEARCH_TOOL_NAME, arguments: { query: query.query } }, undefined, {
        timeout: CALL_TIMEOUT_MS,
      });
      const roundTripMs = performance.now() - started;
      const text = result.content.map((part) => part.text).join('\n');
      if (result.isError === true) refuse(`${SEARCH_TOOL_NAME} failed on query ${query.id}: ${text}`);
      calls.push({ id: query.id, query: query.query, roundTripMs, text });
    }
  } finally {
    await client.close();
  }
  return { calls, stderr };
}

/** The lines of the log at `path`, refusing anything that is not one JSON object per line. */
function readLog(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  if (lines[lines.length - 1] !== '') refuse(`${path} does not end in a newline, so its last record is incomplete`);
  return lines.slice(0, -1).map((line, index) => {
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      refuse(`${path} line ${index + 1} is not one JSON object per line: ${error.message}`);
    }
    return record;
  });
}

/** Every assertion the logged leg's records owe: one per call, in call order, every declared key, legal outcome. */
function assertRecords(records, calls, contract) {
  if (records.length !== calls.length) {
    refuse(`the log holds ${records.length} records for ${calls.length} calls; one call appends exactly one record`);
  }
  records.forEach((record, index) => {
    const call = calls[index];
    const keys = Object.keys(record);
    if (keys.length !== contract.keys.length || keys.some((key, position) => key !== contract.keys[position])) {
      refuse(
        `record ${index + 1} carries keys [${keys.join(', ')}] and ${contract.source} declares ` +
          `[${contract.keys.join(', ')}]`,
      );
    }
    if (!contract.outcomes.includes(record.outcome)) {
      refuse(`record ${index + 1} carries outcome ${JSON.stringify(record.outcome)}, which ${contract.source} does not declare`);
    }
    if (record.query !== call.query) {
      refuse(`record ${index + 1} carries query ${JSON.stringify(record.query)} and call ${index + 1} sent ${JSON.stringify(call.query)}`);
    }
    if (record.k !== DEFAULT_RESULTS) refuse(`record ${index + 1} resolved k as ${record.k} and the server's default is ${DEFAULT_RESULTS}`);
    if (typeof record.durationMs !== 'number') refuse(`record ${index + 1} carries no numeric durationMs`);
    if (record.refresh === null) refuse(`record ${index + 1} reports a failed refresh, so this pass measured no answered call`);
    // The shape the section states an abstention takes, asserted rather than described.
    if (record.abstained === true && (record.hits !== 0 || record.bestScore !== null)) {
      refuse(`record ${index + 1} abstained but carries hits ${record.hits} and bestScore ${record.bestScore}`);
    }
  });
}

/**
 * The library-level figures of the compared arm over this pass's corpus, read out of the file of
 * record's generated region — the machine half, so the comparison is against the published numbers
 * rather than against a transcription of them.
 */
function comparedArm(repoRoot) {
  const path = join(repoRoot, RESULTS_FILE);
  const text = readFileSync(path, 'utf8');
  const start = text.indexOf(GENERATED_START);
  const end = text.indexOf(GENERATED_END);
  if (start === -1 || end === -1) refuse(`${path} carries no generated region to read arm ${COMPARED_ARM} out of`);

  const fences = [...text.slice(start, end).matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
  const published = fences.find((fence) => fence.corpus === PASS_CORPUS);
  if (published === undefined) refuse(`${path}'s generated region carries no machine half for corpus ${PASS_CORPUS}`);
  const arm = published.arms.find((entry) => entry.arm === COMPARED_ARM);
  if (arm?.metrics?.latency === undefined) refuse(`${path} carries no arm ${COMPARED_ARM} latency for corpus ${PASS_CORPUS}`);

  return {
    arm: COMPARED_ARM,
    mode: arm.mode,
    latency: arm.metrics.latency,
    snapshot: published.snapshot,
    abstainScoreThreshold: published.abstainScoreThreshold,
    generatedAt: published.generatedAt,
    source: RESULTS_FILE,
  };
}

function latency(values) {
  return { p50: percentile(values, 50), p95: percentile(values, 95) };
}

/**
 * Run both legs over a fresh fixture and return everything the section is rendered from.
 *
 * `options` is the eval's own parsed argument surface (`evals/docs-retrieval/args.mjs`), so this pass
 * resolves its checkout and its query set exactly the way every other pass does. It reads `repo`,
 * `corpus` and `queries` and nothing else: `--k` and `--repeat` are deliberately not honoured, because
 * the figure being measured is one agent-shaped call — `k` as the server itself resolves it, each query
 * once — and the record's own `k` is asserted against that default.
 */
export async function runQueryLogPass({ repo, corpus, queries: queriesPath }) {
  if (corpus !== PASS_CORPUS) {
    refuse(`this pass runs corpus ${PASS_CORPUS}, whose library-level arm ${COMPARED_ARM} it is compared against, not ${corpus}`);
  }
  assertRealModelsAreAvailable();

  const contract = recordContract(repo);
  const queries = loadQueries(queriesPath);
  const resolved = corpusConfig({ repoRoot: repo, corpus });
  const fixture = buildFixture(repo, resolved);

  try {
    const logPath = join(fixture.dir, LOG_BASENAME);
    const logged = await runLeg({ repoRoot: repo, fixtureDir: fixture.dir, queries, logPath });
    const records = readLog(logPath);
    assertRecords(records, logged.calls, contract);

    // The unset leg is graded against the tree as the logged leg left it: the log exists, the index is
    // warm, so a record appended or a file created can only be this leg's.
    const before = fileListing(fixture.dir);
    const logBefore = readFileSync(logPath, 'utf8');
    const unset = await runLeg({ repoRoot: repo, fixtureDir: fixture.dir, queries, logPath: undefined });
    const after = fileListing(fixture.dir);
    const logAfter = readFileSync(logPath, 'utf8');

    const created = after.filter((path) => !before.includes(path));
    const removed = before.filter((path) => !after.includes(path));
    if (created.length > 0 || removed.length > 0) {
      refuse(
        `with ${UNSET_LEG} the fixture's file listing changed: created [${created.join(', ')}], ` +
          `removed [${removed.join(', ')}]`,
      );
    }
    if (logAfter !== logBefore) {
      refuse(`with ${UNSET_LEG} the log from the other leg grew from ${logBefore.length} to ${logAfter.length} bytes`);
    }

    const refreshes = records.map((record) => record.refresh);
    const answered = records.filter((record) => record.abstained === false);
    return {
      corpus,
      legs: { logged: LOGGED_LEG, unset: UNSET_LEG },
      ranAt: new Date().toISOString(),
      host: hostname(),
      node: process.version,
      fixture: {
        dir: fixture.dir,
        files: fixture.files.length,
        layerEntries: fixture.config.layers.map((layer) => ({ name: layer.name, conventions: layer.conventions })),
        stateDir: fixture.config.stateDir,
        docsRoot: fixture.config.docs.root,
        warnings: fixture.warnings,
      },
      contract,
      models: { embedder: EMBEDDING_MODEL, reranker: RERANK_MODEL },
      calls: logged.calls.length,
      k: DEFAULT_RESULTS,
      records,
      server: latency(records.map((record) => record.durationMs)),
      client: latency(logged.calls.map((call) => call.roundTripMs)),
      unsetClient: latency(unset.calls.map((call) => call.roundTripMs)),
      refresh: { first: refreshes[0], rest: refreshes.slice(1) },
      // The corpus stamp of this pass's own tree, off the cold build's own counts: the mirrored corpus
      // moves with the checkout, so a figure here carries its stamp like every other `self-docs` figure.
      snapshot: { files: fixture.files.length, chunks: refreshes[0].embedded + refreshes[0].unchanged },
      answered: {
        count: answered.length,
        hits: [...new Set(answered.map((record) => record.hits))].sort((a, b) => a - b),
        lowestBestScore: answered.length === 0 ? null : Math.min(...answered.map((record) => record.bestScore)),
      },
      abstained: records.filter((record) => record.abstained === true).length,
      compared: comparedArm(repo),
    };
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
}

function ms(value) {
  return value === null ? '—' : value.toFixed(1);
}

/** A difference, with its sign written out, so a reader is never left to infer which row is higher. */
function signed(value) {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}`;
}

function uniqueRefreshes(counts) {
  const seen = new Map();
  for (const entry of counts) {
    const key = JSON.stringify(entry);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen].map(([key, times]) => ({ counts: JSON.parse(key), times }));
}

/** The column prose is reflowed at, matching the hand-written sections already in the file of record. */
const WRAP_COLUMNS = 100;

/** A line that must reach the file as it was composed: a table row, a list item, a fence. */
function isVerbatim(line) {
  return line.startsWith('|') || line.startsWith('- ') || line.startsWith('```');
}

/**
 * The composed lines as paragraphs reflowed to {@link WRAP_COLUMNS}, so a figure's own length cannot
 * decide where a sentence breaks. A blank line separates paragraphs and every {@link isVerbatim} line
 * is passed through untouched.
 */
function reflow(lines) {
  const out = [];
  let pending = [];
  const flush = () => {
    if (pending.length === 0) return;
    let line = '';
    for (const word of pending.join(' ').split(' ')) {
      // An odd backtick count means the line ends inside a code span, and a break there would put a
      // line ending inside a quoted field name or a counts object.
      const openSpan = (line.match(/`/g)?.length ?? 0) % 2 === 1;
      if (line === '') line = word;
      else if (openSpan || `${line} ${word}`.length <= WRAP_COLUMNS) line = `${line} ${word}`;
      else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
    pending = [];
  };
  for (const line of lines) {
    if (line === '' || isVerbatim(line)) {
      flush();
      out.push(line);
    } else pending.push(line);
  }
  flush();
  return out.join('\n');
}

/**
 * The file-of-record section, composed from {@link runQueryLogPass}'s result.
 *
 * Every sentence that names either environment variable to a reader is built from that variable's own
 * constant, so a rename in `cli/src` cannot leave a wrong name in a document of record.
 */
export function renderQueryLogSection(result) {
  const { compared } = result;
  const rest = uniqueRefreshes(result.refresh.rest);
  const restText = rest
    .map((entry) => `\`{ embedded: ${entry.counts.embedded}, unchanged: ${entry.counts.unchanged}, deleted: ${entry.counts.deleted} }\` on ${entry.times} of them`)
    .join(', ');

  return reflow([
    `**What this pass measures, and why it is not a by-product of the arm runs.** \`logQuery\` is called`,
    `from \`cli/src/retrieval/server.ts\` alone, so arms B-E — which drive \`searchDocs\` directly — write`,
    `no record at all; and the server hardcodes \`mode: 'fused-rerank'\`, so every record it can write is an`,
    `arm ${compared.arm} record. This pass therefore drives the shipped stdio MCP server over the larger`,
    `corpus and reports its latency separately from library-level arm ${compared.arm}, because it is the`,
    `only figure that includes the per-call incremental refresh and the MCP round trip — what an agent`,
    `actually waits for.`,
    ``,
    `**The fixture repository, and its configuration.** \`docs serve\` refuses unless \`phases.docs\` and`,
    `\`docs.retrieval\` are both true, and this repository's \`harness.config.json\` satisfies neither and is`,
    `deliberately left alone — so **these numbers are not this repository's own configuration**. The pass`,
    `mirrors the resolved \`${result.corpus}\` corpus into a git-initialized repository under the system`,
    `temp directory, one commit, removed at the end: ${result.fixture.files} files copied at their own`,
    `repo-relative paths, which is exactly what \`corpusConfig({ corpus: '${result.corpus}' })\` resolves —`,
    `the pass asserts the two counts are equal, so a layer added to this checkout's configuration grows`,
    `the fixture or fails the pass. Its configuration is this checkout's own with the corpus's keys`,
    `layered over it: \`docs.root\` \`${result.fixture.docsRoot}\`, \`docs.retrieval\` and \`phases.docs\` true,`,
    `\`stateDir\` \`${result.fixture.stateDir}\`, and the rules documents of the checkout's own layer`,
    `entries, mapped one for one onto their copied paths:`,
    ``,
    ...result.fixture.layerEntries.map((layer) => `- \`${layer.name}\` → \`${layer.conventions}\``),
    ``,
    `**The two legs.** Each is one \`docs serve\` child over that fixture, with all`,
    `${result.calls} queries of \`${result.corpus}\` called once through the MCP SDK's own stdio client at`,
    `the server's default \`k\` of ${result.k}, every round trip timed from the client side.`,
    ``,
    `| Leg | What it asserted |`,
    `| --- | --- |`,
    `| ${result.legs.logged} | The log holds exactly one JSON line per call, in call order, each line's \`query\` byte-identical to the query as sent; every line carries every key \`${result.contract.source}\` declares — \`${result.contract.keys.join('\`, \`')}\` — with none absent and \`outcome\` one of \`${result.contract.outcomes.join('\`, \`')}\`. |`,
    `| ${result.legs.unset} | The same query set again with the key deleted from the child's environment: the fixture's file listing is byte-for-byte the same set of paths before and after, and the log the other leg wrote is neither re-opened nor extended — the same ${result.records.length} lines, unchanged. |`,
    ``,
    `**The latencies.** Server-side is each record's own \`durationMs\`, read back out of the JSONL rather`,
    `than out of the client; client-side is the round trip the caller waits for. Library-level arm`,
    `${compared.arm} is read out of this file's generated region for the same corpus.`,
    ``,
    `| Figure | p50 ms | p95 ms |`,
    `| --- | --- | --- |`,
    `| Server-side \`durationMs\`, from the log | ${ms(result.server.p50)} | ${ms(result.server.p95)} |`,
    `| Client-side MCP round trip | ${ms(result.client.p50)} | ${ms(result.client.p95)} |`,
    `| Library-level arm ${compared.arm} (\`${compared.mode}\`), \`${compared.source}\` generated region | ${ms(compared.latency.p50)} | ${ms(compared.latency.p95)} |`,
    `| Client-side round trip of the ${result.legs.unset} leg, for comparison | ${ms(result.unsetClient.p50)} | ${ms(result.unsetClient.p95)} |`,
    ``,
    `**What the server answered, read back out of the JSONL.** ${result.answered.count} of the`,
    `${result.calls} records carry \`abstained: false\` with \`hits\` in`,
    `{${result.answered.hits.join(', ')}} and a \`bestScore\` no lower than`,
    `\`${result.answered.lowestBestScore}\`; the other ${result.abstained} carry \`abstained: true\` with`,
    `\`hits: 0\` and \`bestScore: null\`, which is the shape an abstention takes in this log.`,
    ``,
    `**The gap, and its two causes.** Server-side against library-level arm ${compared.arm}, the gap is`,
    `${signed(result.server.p50 - compared.latency.p50)} ms at p50 and`,
    `${signed(result.server.p95 - compared.latency.p95)} ms at p95, and it is what the two things only`,
    `this pass's calls carry cost: the per-call incremental refresh, which re-reads and re-hashes the`,
    `whole corpus before every search, and the MCP round trip between the client and the server child —`,
    `${ms(result.client.p50 - result.server.p50)} ms of it at p50, which is the client-side figure above`,
    `minus the server-side one. Neither is the dominant term at this corpus size: both rows are`,
    `reranker-bound, and each query was called once, so a gap of this size is not separable from the`,
    `run-to-run variation of one reranker-bound call — see the repeatability note below.`,
    ``,
    `**What the refresh costs after the first call.** The first call of a server is also its cold build:`,
    `\`{ embedded: ${result.refresh.first.embedded}, unchanged: ${result.refresh.first.unchanged}, deleted: ${result.refresh.first.deleted} }\`.`,
    `Every later call reports ${restText} — nothing re-embedded, so what the per-call refresh costs from`,
    `the second call on is the corpus walk and the hash comparison alone.`,
    ``,
    `**Provenance.** ${result.abstained} of the ${result.calls} calls abstained. Both legs ran with`,
    `\`${RETRIEVAL_STUB_ENV}\` deleted from the child's environment, so the child loaded the real embedder`,
    `\`${result.models.embedder}\` and the real reranker \`${result.models.reranker}\`; the abstention threshold`,
    `in force is the one this checkout's \`search.js\` carries. This pass ran at its own corpus snapshot`,
    `\`{ files: ${result.snapshot.files}, chunks: ${result.snapshot.chunks} }\`, off the cold build's own`,
    `counts, while library-level arm ${compared.arm} above was taken at`,
    `\`{ files: ${compared.snapshot.files}, chunks: ${compared.snapshot.chunks} }\` under threshold`,
    `\`${compared.abstainScoreThreshold}\` (${compared.generatedAt}) — different stamps, so the two latency`,
    `rows are read as server-side against library-level and never as a before/after pair. Host \`${result.host}\`, Node \`${result.node}\`,`,
    `${result.ranAt}. The pass is \`runQueryLogPass\` in \`evals/docs-retrieval/query-log-pass.mjs\`, driven`,
    `through a launcher under the run's scratch directory that calls it with the eval's own parsed`,
    `arguments for this corpus:`,
    ``,
    '```',
    `bash scripts/scratch-run.sh harness-runs/scratch/<launcher>.mjs`,
    '```',
  ]);
}
