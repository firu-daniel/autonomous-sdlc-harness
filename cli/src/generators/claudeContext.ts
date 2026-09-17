/**
 * Generator: the always-loaded project file, the conventions stubs behind it, and the two
 * `*.env.example` companions an adopter copies and completes.
 *
 * **The rule this module exists to enforce: which stubs are written, and which rows the routing
 * table carries, are both read off `layers[]` — never off a list kept here.** `layers[].conventions`
 * is "the document holding this layer's rules" (`schemas/harness.config.schema.json`), and the
 * orchestrator assigns every task to exactly one layer, so a fixed file list here would put a
 * skeleton at a path no layer points at while leaving the path one *does* point at empty. A
 * generated table that disagrees with the configuration it was generated from is worse than no
 * table: an agent follows the pointer rather than the config.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **The templates live at `templates/claude/…`, without the dot, and `init` adds it.** They are
 *    templates for *someone else's* configuration, so the dot belongs at the adopter's end: `init`
 *    adds it — here via `CLAUDE_DIR`, and in the sibling generators that declare their own — and no
 *    stored template path carries it. Not because a dotted path here would register them as live
 *    assets: that reason was withdrawn as measurably false (`cli/templates/claude/README.md`,
 *    `cli/templates/README.md`). This is the generator where that distinction becomes load-bearing
 *    rather than decorative.
 * 2. **Every file here is `create-if-absent`, and the analyze command is why.** These are skeletons
 *    that a later pass fills in from the adopted repository's real code, and the adopter edits them
 *    afterwards; a second `init` that rewrote one would undo both. That is the write engine's own
 *    row for this artifact (`core/writer.ts`), and `--force` still takes a `.bak` first.
 * 3. **The two `.env.example` files are written beside the file they tell you to create** — at
 *    `<configured path>.example` — rather than at a fixed name. Their whole content is "copy me to
 *    the path `pushEnvPath` / `qa.credentialsPath` names"; written anywhere else, that instruction
 *    points across the tree. With the paths `init` itself seeds, both land in `.claude/`, which is
 *    where the template tree says a `claude/` template goes.
 *
 * ## What this generator deliberately does not do
 *
 * - **It does not restate the project-command wrappers.** `commands.*` in `harness.config.json` is
 *   the canonical home for those invocations, and the config, the wrapper files and the permission
 *   profile are already three views of one string (`generators/scripts.ts`); an always-loaded file
 *   repeating them would be a fourth, drifting the moment `scriptsDir` moves.
 * - **It does not invent credential key names.** The two example files carry harness-generic keys —
 *   `HARNESS_PUSH_*`, `HARNESS_QA_<n>_*` — and say so in their own header comments, so an adopter
 *   carrying settings over from another runner renames the keys rather than the reader.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

import { DEFAULTS, type HarnessConfig, type HarnessLayer } from '../config/model.js';
import { defaultProjectName, readTemplate } from '../core/paths.js';
import { normalizeRepoPathStrict } from '../core/repoPaths.js';
import { renderTemplate } from '../core/templating.js';
import type { WritePlan } from '../core/writer.js';
import { SHARED_CONVENTIONS_PATH } from '../detect/presets.js';
import { PUSH_ENV_PATH, QA_CREDENTIALS_PATH } from './harnessConfig.js';
import { PLUGIN_NAME } from './projectSettings.js';

/** The adopter-side directory this whole template subtree lands in. The dot is `init`-side only. */
const CLAUDE_DIR = '.claude';

/**
 * The always-loaded project file, relative to the repository root.
 *
 * Exported because two readers outside this module address the same file: `init` reads it before the
 * plan is applied, to resolve the analyze offer and to decide which of its closing wordings is true,
 * and `doctor`'s `setup-analysis` check reads it for the {@link SETUP_PENDING_OPEN} banner. Both
 * import this rather than re-spelling `.claude/CLAUDE.md`, for the reason the markers below are
 * exported: a second copy of a literal is a copy that can drift.
 */
export const CLAUDE_MD_PATH = `${CLAUDE_DIR}/CLAUDE.md`;

/**
 * The project's test-scenario rules, relative to the repository root — written only when the
 * interactive test phase is on.
 *
 * **The basename is carried over from the instruction corpus unchanged, and renaming it here is a
 * breaking change.** The shipped QA assets — the test instructions, and the agents that plan and run
 * the interactive phase — dereference this document by that exact name rather than through a config
 * key, so a different name here leaves every one of them pointing at a file nothing writes. It is
 * `create-if-absent` like every other `.claude/` artifact: the skeleton is the adopter's from the
 * moment it lands, and the rules they fill in are the only copy.
 */
export const QA_SCENARIOS_PATH = `${CLAUDE_DIR}/qa_test_scenarios.md`;

/**
 * The change-request offer dialogue, relative to the repository root — planned on every run, whatever the
 * configured phases are, and created where it is absent.
 *
 * **The basename is dereferenced by name**, from the always-loaded project file's
 * `## Where a change request runs` section, so renaming it here leaves that pointer aimed at a file
 * nothing writes and silently disables the offer. Exported because `doctor` addresses the same file
 * rather than re-spelling it.
 */
export const TASK_OFFER_PATH = `${CLAUDE_DIR}/harness-task-offer.md`;

/** The templates' subdirectory under `cli/templates/`, addressed as {@link readTemplate} wants it. */
const TEMPLATE_DIR = 'claude';

/** The context stubs' subdirectory inside {@link TEMPLATE_DIR}. */
const CONTEXT_TEMPLATE_DIR = 'context';

/**
 * The stubs that have a skeleton of their own, keyed by the **basename** a layer's `conventions`
 * path ends in. Each name is also its template's file name under `templates/claude/context/`, so a
 * stub is added by dropping one template in beside its siblings and adding its name here.
 *
 * A configured conventions path matching none of these gets {@link GENERIC_STUB_TEMPLATE} instead:
 * the layer still needs a document at the path the config promises, and a generic skeleton naming
 * the layer is more use to its implementer than a missing file.
 *
 * **The set is not a list of what `init` generates, and is deliberately larger than one.** Two
 * groups:
 *
 * - **Reached by a preset.** `conventions.md` (every preset's `general` layer), `data-layer.md`,
 *   `domain.md`, `presentation.md` (`layered-clean-arch`), `api.md` (`api-service`) and
 *   `package.md` (`python-package`), `module.md` (every preset whose layer profile is a conventional
 *   source root — `cmake-cpp` points both of its rows at it), and `tests.md` — the document every preset's **test** layer points at, reached by
 *   `flutter`, `jvm`, `android-gradle`, `apple-native`, `rust-cargo`, `dotnet`, `php-composer`,
 *   `ruby-bundler`, `python-package`, `cmake-cpp`, `layered-clean-arch` and `api-service` whenever
 *   the conventional test root of that preset's toolchain exists — the basenames
 *   `detect/presets.ts` can produce. Every one of
 *   them must be here and must have a template: a preset's own layer falling through to the generic
 *   skeleton is the whole point of the preset lost, and `test/init.test.mjs` asserts the pairing
 *   over each preset rather than leaving it to inspection.
 * - **Reachable only by hand.** `data-storage.md`, `docs-catalog.md` and `state-slices.md` are
 *   skeletons for three concerns no preset detects — local persistence, a documentation catalog,
 *   shared application state. Nothing `init` generates points at them, and the one route that reads
 *   one is an adopter pointing a `layers[].conventions` at that exact basename and re-running
 *   `init`. A path a `/autonomous-sdlc-harness:harness-analyze` layer-profile revision newly names
 *   does **not** reach them: that command never re-runs `init`, so `conventions-writer` composes the document with no file
 *   behind it. They are kept rather than deleted because writing one of those documents from
 *   nothing is the expensive part, and they are named here so a later reader does not take them for
 *   dead templates.
 */
const DEDICATED_STUBS: ReadonlySet<string> = new Set([
  'api.md',
  'conventions.md',
  'data-layer.md',
  'data-storage.md',
  'docs-catalog.md',
  'domain.md',
  'module.md',
  'package.md',
  'presentation.md',
  'state-slices.md',
  'tests.md',
]);

/** The skeleton rendered for a layer whose conventions basename is in none of those above. */
const GENERIC_STUB_TEMPLATE = 'layer.md';

/**
 * The two halves of the **untouched-skeleton test**, which is how anything in this tree answers
 * "has anybody filled this document in yet" — the marker every shipped skeleton carries as its last
 * line, and the guidance block every shipped skeleton carries in its body.
 *
 * **They are read together, always, and the marker alone decides nothing.** Each skeleton's footer
 * tells a hand-writer to *replace everything above* it, so an adopter who wrote their rules by hand
 * has removed the guidance block whether or not they thought to delete a trailing HTML comment.
 * Testing the marker alone would report that finished document as unfilled forever, and the only
 * remedy on offer would be the analyze command that adopter declined — which is the path this
 * harness deliberately keeps open.
 *
 * Read by: `doctor`'s `setup-analysis` check, `init`'s "is anything left to fill" question, and the
 * analyze command's decision about whether it may write a target without asking (it clears the
 * marker when it writes). The literal strings also live in every skeleton under
 * `templates/claude/context/` — `ls cli/templates/claude/context/` enumerates them — which is
 * where they are produced: a template and these constants disagreeing makes every consumer report
 * every document as filled.
 */
export const UNFILLED_STUB_MARKER = '<!-- harness:unfilled -->';

/** The other half of the two-part test in {@link UNFILLED_STUB_MARKER}; never applied on its own. */
export const SKELETON_GUIDANCE_MARKER = '**What belongs here**';

/**
 * The **untouched-skeleton test** as one predicate over one document's text: both halves above
 * present, read together and never apart.
 *
 * Exported so a consumer that already holds the text applies the conjunction rather than re-spelling
 * it — `init`'s pre-plan read does, and so does the `.bak` decision in {@link writeClaudeContext}
 * below. It deliberately answers about **text only**: what an unreadable file means differs by call
 * site — a document `init` is about to create counts as untouched there, and a `.bak` that is not
 * there protects nothing here — so each caller decides that for itself.
 */
export function isUntouchedSkeletonText(content: string): boolean {
  return content.includes(UNFILLED_STUB_MARKER) && content.includes(SKELETON_GUIDANCE_MARKER);
}

/**
 * The analyze targets that are **not** layer names: the layer profile itself, the always-loaded
 * project file, and the shared cross-layer document that is generated whether or not a layer points
 * at it (`docs/analyze.md` §1).
 *
 * Read by: the invocation this generator renders into each stub footer, and `init`'s closing pointer.
 * The config schema's `name` pattern admits all three, so a layer may legitimately carry one — that
 * layer loses the one-word invocation to the reserved meaning, visibly rather than silently, and is
 * still covered by the no-argument pass.
 */
export const RESERVED_ANALYZE_TARGETS = ['project', 'conventions', 'layers'] as const;

/** The command each stub footer points at, argument appended. */
const ANALYZE_COMMAND = `/${PLUGIN_NAME}:harness-analyze`;

/**
 * The delimiters of the **setup-pending banner** the generated project file carries under its
 * heading: the record of what the adopter answered `autonomous-sdlc-harness init`'s analyze offer
 * (`docs/analyze.md` §9), written into the one file every session in that repository loads without
 * being asked.
 *
 * Read by two consumers outside this module, both on these exact literals: `doctor`'s
 * `setup-analysis` check detects the open marker and reports the setup as unfinished, and the
 * analyze command deletes the block between the two inclusive as its last act.
 *
 * **The banner is not a guaranteed record of the answer on a re-run.** {@link CLAUDE_MD_PATH} is
 * enqueued `create-if-absent`, with `WriteRequest.forceOverride: 'never'` on the one case
 * {@link keepsIdenticalProjectFile} computes, so there are three outcomes and not two. *Created*: the
 * banner is in the file. *Kept* — an unforced re-run over a file that is already there, or a forced
 * one over a file already byte-identical to the text this run renders — nothing is written into it;
 * the unforced route says so in a note of {@link writeClaudeContext}'s own and the forced one in
 * `init`'s closing sentence, and that report is what carries the answer on either.
 * *Overwritten under `--force`*: the
 * whole file is regenerated from the template after its single `.bak`, so the banner is
 * **re-inserted** and `doctor`'s `setup-analysis` warning re-opens until the command is run again or
 * the block is deleted by hand. The standing readers of what is still unfilled are that check and
 * {@link UNFILLED_STUB_MARKER}'s two-part test — never this banner.
 */
export const SETUP_PENDING_OPEN = '<!-- harness:setup-pending -->';

/** The banner's closing delimiter: the block {@link SETUP_PENDING_OPEN} documents ends here. */
export const SETUP_PENDING_CLOSE = '<!-- /harness:setup-pending -->';

/** What the adopter answered the analyze offer, as `init` resolved it. */
export type AnalyzeOffer = 'accepted' | 'declined';

/**
 * Where the command named in both wordings comes from — a **fact about this repository's state**, not
 * an instruction to install anything.
 *
 * Without it the reader who reaches the wrong answer is the adopter who opens a session before the
 * plugin resolves — a clone that never ran `init`, a runner pointed elsewhere — and meets a banner
 * naming a command that is not there, with nothing in the block saying what would have to be true for
 * it to exist. Naming no marketplace and no install step keeps it a fact: `init` already merged the
 * plugin key into the settings file this clause names, so the state it reports is one the same run
 * left behind.
 */
const PLUGIN_ORIGIN_CLAUSE = `\`${ANALYZE_COMMAND}\` is a command of the harness plugin, which \`npx autonomous-sdlc-harness init\` enabled for this repository in \`${CLAUDE_DIR}/settings.json\`, so it exists in a session that resolves that plugin.`;

/**
 * The banner's body, one blockquote per answer.
 *
 * **Each wording ends by stating its own disposal** (`docs/analyze.md` §10): the command removes the
 * block, or the adopter deletes it once these sections are written. This file is loaded on every turn
 * of every session in that repository and no later unforced run revises the block, so a wording
 * without that sentence leaves the adopter who *declined* carrying "setup is not finished" — and
 * `doctor`'s matching warning — with the only route out being the command they turned down.
 *
 * Both wordings carry {@link PLUGIN_ORIGIN_CLAUSE}, and it sits **before** each disposal sentence so
 * neither ends on anything else: the decliner who changes their mind reaches for the same command as
 * the accepter, so a clause on one arm only would leave the other reader with the wrong answer.
 *
 * Neither wording says when the pass will run, neither presents the command as the only route, and
 * each states the repository's setup state rather than addressing an order to whoever reads it next.
 */
const SETUP_PENDING_BODY: Readonly<Record<AnalyzeOffer, string>> = {
  accepted: `> **Setup is not finished.** The sections below are skeletons, and \`${ANALYZE_COMMAND}\` was accepted at setup: running it is this session's first action. ${PLUGIN_ORIGIN_CLAUSE} The command removes this block when it has run — or the block can be deleted by hand once these sections are written.`,
  declined: `> **Setup is not finished.** The sections below are skeletons, and the analysis was declined at setup: they are yours to write by hand, and \`${ANALYZE_COMMAND}\` still fills them if you change your mind. ${PLUGIN_ORIGIN_CLAUSE} In either case, the block can be deleted by hand once these sections are written.`,
};

/** The delimited block rendered into the template's `{{setupBanner}}` slot. */
function setupBanner(offer: AnalyzeOffer): string {
  return `${SETUP_PENDING_OPEN}\n${SETUP_PENDING_BODY[offer]}\n${SETUP_PENDING_CLOSE}`;
}

/** The ledger the routing table links to, at the root of the configured `stateDir`. */
const LESSONS_LEDGER = 'lessons.md';

/** Suffix distinguishing the committed example from the machine-local file it is copied to. */
const EXAMPLE_SUFFIX = '.example';

/** Everything {@link writeClaudeContext} needs. */
export interface ClaudeContextOptions {
  /** The resolved repository root the files are written under. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** The command's write plan; this generator enqueues into it and never writes itself. */
  readonly plan: WritePlan;
  /**
   * What the adopter answered the analyze offer, which decides the banner's wording
   * ({@link SETUP_PENDING_OPEN}). Absent means `accepted`: that is the wording the shipped tree
   * already gives every adopter, so the default is not a new behaviour.
   */
  readonly analyzeOffer?: AnalyzeOffer;
  /**
   * The run's `--force`, which together with the project file's prior existence is what decides
   * whether the banner reached it: an unforced run keeps a file that is already there and writes no
   * banner into it, a forced one regenerates the file from the template after a `.bak` — unless its
   * bytes already are that template's ({@link keepsIdenticalProjectFile}). Absent means unforced. The
   * kept-file note below is pushed on the first of those outcomes only; the forced keep is reported by
   * `init`'s closing sentence, which is worded from
   * {@link ClaudeContextResult.claudeMdBackupWouldCarryContent} and
   * {@link ClaudeContextResult.claudeMdBackupExisted}.
   */
  readonly force?: boolean;
  /**
   * The run's `--dry-run`, which changes this note's tense and nothing else — a dry run may no more
   * claim it kept a file than a real run may omit saying so (`docs/cli.md` §1).
   */
  readonly dryRun?: boolean;
}

/** One conventions stub that was written, or that a `--dry-run` reported it would write. */
export interface WrittenStub {
  /** Repo-relative path, exactly as the layer's `conventions` key names it. */
  readonly path: string;
  /** True when a dedicated skeleton was used, false when the generic layer one was. */
  readonly dedicated: boolean;
  /** Names of the layers pointing at this document — empty for a shared file no layer names. */
  readonly layers: readonly string[];
}

/** What the generator produced, for `init`'s summary and for `doctor`. */
export interface ClaudeContextResult {
  /** Repo-relative path of the always-loaded project file. */
  readonly claudeMd: string;
  /**
   * Whether the `<project file>.bak` this run writes would hold something the template does not:
   * true only when the file existed, the run is forced, and its bytes **differ** from the text
   * rendered here — false on a fresh creation, on an unforced run, and on the identical-bytes keep
   * {@link keepsIdenticalProjectFile} decides.
   *
   * **The one fact `init`'s closing sentence cannot compute for itself**, because only this generator
   * holds the rendered text: the sentence promising that a previous pass's content "is in that `.bak`
   * alone" is true on one side of it and false on the other, where the `.bak` was never touched.
   */
  readonly claudeMdBackupWouldCarryContent: boolean;
  /**
   * Whether a `<project file>.bak` was already on disk when this run started, and the keep fired —
   * the second half of what that keep can truthfully say. It leaves that file alone either way; only
   * when one is there does "what a previous pass filled in is still in it" name anything. False
   * whenever the keep did not fire, so no other arm can read it as a fact about itself.
   *
   * The sub-case this exists for is a plain `init` followed by `init --force`: the two runs render
   * the same bytes, so the keep fires with no `.bak` ever written.
   */
  readonly claudeMdBackupExisted: boolean;
  /** The stubs written, shared conventions first and then in `layers[]` order. */
  readonly stubs: readonly WrittenStub[];
  /** Repo-relative paths of the `*.env.example` files written. */
  readonly envExamples: readonly string[];
  /** Things needing attention, one line each, for the reporter's `warn`. */
  readonly warnings: readonly string[];
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
}

/**
 * A link from `.claude/CLAUDE.md` to a repo-relative target — `context/data-layer.md` for a
 * conventions file in the usual place, `../sdlc-harness/lessons.md` for a ledger outside it.
 *
 * Relative rather than repo-relative because the link is read from the file it sits in, and a
 * conventions path may legitimately point anywhere in the repository.
 */
function linkFromClaudeDir(repoRelative: string): string {
  const link = posix.relative(CLAUDE_DIR, repoRelative);
  return link === '' ? repoRelative : link;
}

/** `a`, `a and b`, `a, b and c` — for a description naming the layers that share one document. */
function joinPhrases(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1] as string}`;
}

/** One conventions document, the layers that point at it, and the skeleton it is rendered from. */
interface StubTarget {
  readonly path: string;
  readonly template: string;
  readonly dedicated: boolean;
  readonly layers: readonly HarnessLayer[];
}

/**
 * The conventions documents to write, deduplicated by path and in the order the routing table
 * lists them: the shared cross-layer document first, then one entry per distinct
 * `layers[].conventions` value in `layers[]` order.
 *
 * **The shared document is always present, even when no layer points at it.** It holds the rules
 * that span every layer — the flow between them, where a new responsibility goes, the testing bar
 * — so every other stub is written on the assumption that it exists, and `CLAUDE.md` gives it a
 * row whatever the layer list looks like. Where a layer *does* point at it (every preset's
 * `general` layer does), that layer joins this entry rather than creating a second one.
 */
function collectStubs(config: HarnessConfig): StubTarget[] {
  const byPath = new Map<string, { path: string; layers: HarnessLayer[] }>();
  const sharedPath = normalizeRepoPathStrict(SHARED_CONVENTIONS_PATH);
  byPath.set(sharedPath, { path: sharedPath, layers: [] });

  for (const layer of config.layers) {
    const path = normalizeRepoPathStrict(layer.conventions);
    const entry = byPath.get(path);
    if (entry === undefined) byPath.set(path, { path, layers: [layer] });
    else entry.layers.push(layer);
  }

  return [...byPath.values()].map(({ path, layers }) => {
    const basename = posix.basename(path);
    const dedicated = DEDICATED_STUBS.has(basename);
    return {
      path,
      template: `${CONTEXT_TEMPLATE_DIR}/${dedicated ? basename : GENERIC_STUB_TEMPLATE}`,
      dedicated,
      layers,
    };
  });
}

/** The file's text, or `undefined` when there is nothing readable at that path. */
function readIfPossible(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return undefined;
  }
}

/**
 * Whether a forced run must **keep** this conventions document, because replacing it would destroy
 * the analysis rather than back it up.
 *
 * The engine's `.bak` is single-generation — overwritten, never chained (`core/writer.ts`) — so a
 * *second* forced run over an already-skeletonised corpus replaces a `.bak` holding the filled
 * document with one holding the skeleton, and no copy of the analysis is left anywhere. Both
 * conjuncts below are what keeps this to that case:
 *
 * - **The `.bak` exists and is not itself an untouched skeleton.** Without it there is nothing to
 *   protect: a first forced run writes the filled document into the `.bak` and loses nothing.
 * - **The document on disk exists and *is* an untouched skeleton.** Without it a forced run could
 *   never put a *filled* document back to a skeleton, which is a legitimate thing to want — and on
 *   that run the `.bak` this write produces holds the filled document, so nothing is lost.
 *
 * Any read that fails means no override and the ordinary forced behaviour: this is a protection
 * layered on top of the existing backup, not a gate that may refuse a run.
 */
function keepsRescuedBackup(repoRoot: string, repoRelative: string): boolean {
  const target = join(repoRoot, repoRelative);
  const backup = readIfPossible(`${target}.bak`);
  if (backup === undefined || isUntouchedSkeletonText(backup)) return false;
  const current = readIfPossible(target);
  return current !== undefined && isUntouchedSkeletonText(current);
}

/**
 * Whether a forced run must **keep** the always-loaded project file, because regenerating it would
 * put nothing in the `.bak` and destroy whatever is already there.
 *
 * **The test is byte-identity with the text this run would write, and it is the right one for this
 * file specifically.** It carries neither {@link UNFILLED_STUB_MARKER} nor
 * {@link SKELETON_GUIDANCE_MARKER}, so {@link isUntouchedSkeletonText} — the two-part test
 * {@link keepsRescuedBackup} applies to a conventions document — answers nothing about it. Equality
 * with the rendered text is the exact statement of both halves of the loss: the `.bak` this write
 * would produce receives nothing the template does not already carry, and the `.bak` already there —
 * single-generation, overwritten rather than chained (`core/writer.ts`) — is destroyed to make room
 * for it.
 *
 * A read that fails means no override and the ordinary forced behaviour, as in
 * {@link keepsRescuedBackup}: this protects a backup, it never refuses a run.
 */
function keepsIdenticalProjectFile(repoRoot: string, rendered: string): boolean {
  return readIfPossible(join(repoRoot, CLAUDE_MD_PATH)) === rendered;
}

/** The routing table's `When working on…` cell for the shared cross-layer document. */
function sharedConventionsDescription(layers: readonly HarnessLayer[]): string {
  const base = '**Any implementation, review or planning** — the rules that hold in every layer';
  if (layers.length === 0) return base;
  const names = joinPhrases(layers.map((layer) => `\`${layer.name}\``));
  return `${base}, and the ${names} ${layers.length === 1 ? "layer's" : "layers'"} own rules`;
}

/** The routing table's `When working on…` cell for one layer's document. */
function layerDescription(layers: readonly HarnessLayer[]): string {
  const names = joinPhrases(layers.map((layer) => `\`${layer.name}\``));
  const paths = [...new Set(layers.map((layer) => (layer.path === '.' ? 'the repository root' : `\`${layer.path}\``)))];
  return `The ${names} ${layers.length === 1 ? 'layer' : 'layers'} — ${joinPhrases(paths)}`;
}

/** One row of the routing table: a description, and a link that is also its own label. */
function routingRow(description: string, link: string): string {
  return `| ${description} | [\`${link}\`](${link}) |`;
}

/**
 * The routing table's body — one row per conventions document, then the lessons ledger.
 *
 * Built from {@link collectStubs}' own list rather than from a second walk of `layers[]`, so a
 * document that is written always has a row and a row never points at a document that is not.
 */
function routingRows(stubs: readonly StubTarget[], sharedPath: string, stateDir: string): string {
  const rows = stubs.map((stub) =>
    routingRow(
      stub.path === sharedPath ? sharedConventionsDescription(stub.layers) : layerDescription(stub.layers),
      linkFromClaudeDir(stub.path),
    ),
  );

  rows.push(
    routingRow(
      '**Planning or reviewing at branch level** — the lessons ledger: one-line rules distilled from defects that got past every automated gate and were caught by a human',
      linkFromClaudeDir(posix.join(stateDir, LESSONS_LEDGER)),
    ),
  );

  return rows.join('\n');
}

/**
 * Render a context template through {@link renderTemplate}.
 *
 * **`assertNoneSurvive` is on**, and deliberately: every value substituted here is a path, a layer
 * name, a manifest-mirrored slug or generated markup, none of which has any business carrying
 * `{{…}}`. One that did would ship a half-rendered always-loaded file — the one file every session
 * reads without being asked.
 */
function render(template: string, values: Readonly<Record<string, string>>): string {
  return renderTemplate(readTemplate(`${TEMPLATE_DIR}/${template}`), values, {
    describe: `the context template ${template}`,
    assertNoneSurvive: true,
  });
}

/**
 * The invocation one stub's footer tells its reader to run, and the warning a reserved name earns.
 *
 * The vocabulary is the **layer name** rather than the document's path (`docs/analyze.md` §1): a
 * path vocabulary cannot express the two targets that name no file. Three cases, in order:
 *
 * - **No layer points here.** Only the shared cross-layer document reaches this, and its target is
 *   the reserved word `conventions` — the name that exists precisely because it is generated
 *   whether or not a layer names it.
 * - **The first layer's name is reserved.** The bare command, plus a warning: the one-word
 *   invocation is gone, the document is not — the no-argument pass still reaches it.
 * - **Otherwise**, the first layer's name. Where several layers share a document, the first is the
 *   one the generic-skeleton warning above already names.
 */
function analyzeInvocation(layerNames: readonly string[], stubPath: string, warnings: string[]): string {
  const target = layerNames[0];
  if (target === undefined) return `${ANALYZE_COMMAND} conventions`;

  if ((RESERVED_ANALYZE_TARGETS as readonly string[]).includes(target)) {
    warnings.push(
      `the layer \`${target}\` is named for a reserved analyze target, which addresses something else — \`${target}\` means ${reservedMeaning(target)} — so ${stubPath} is reached by \`${ANALYZE_COMMAND}\` with no argument, or by renaming the layer`,
    );
    return ANALYZE_COMMAND;
  }

  return `${ANALYZE_COMMAND} ${target}`;
}

/** What each reserved word addresses, for the collision warning above. */
function reservedMeaning(target: string): string {
  if (target === 'project') return 'the always-loaded project file';
  if (target === 'conventions') return 'the shared cross-layer document';
  return 'the layer profile itself';
}

/**
 * Enqueue the always-loaded project file, one conventions stub per configured document, and the
 * `*.env.example` companions — every one of them `create-if-absent`.
 *
 * Selection, and why each rule is what it is:
 *
 * - **`CLAUDE.md` always.** It is the file the agent runner loads without being asked, and the only
 *   place the read-on-demand rule for everything else is written down.
 * - **The {@link TASK_OFFER_PATH} dialogue always**, because the always-loaded file's fence points
 *   at it by name, and an absent target silently disables the offer that pointer describes.
 * - **One stub per distinct `layers[].conventions` path**, plus the shared cross-layer document
 *   whether or not a layer names it. A configured path with no document behind it is a pointer an
 *   implementer follows to nothing.
 * - **`push-notify.env.example` always**, because the push settings are read whatever the phases
 *   are, and **`qa-accounts.env.example` plus the {@link QA_SCENARIOS_PATH} skeleton only when
 *   `phases.qa`** — an adopter who never runs the interactive test phase has no accounts to put in
 *   the one and no scenarios to write in the other, and an empty credentials example is a file that
 *   looks like a step someone forgot to finish.
 *
 * Nothing here writes: the generator plans, and `init` applies the plan once. Its filesystem reads
 * are of three kinds, and each decides a note, a per-request flag or a reported fact rather than any
 * content. Whether the always-loaded file is already there, which decides the kept-file note — an
 * unforced run keeps that file, so the setup-pending banner cannot reach it and the run says so, and
 * whether its `.bak` sibling was already there, which decides
 * {@link ClaudeContextResult.claudeMdBackupExisted}. On
 * a forced run only, that file's own text against the text rendered here, which decides
 * {@link keepsIdenticalProjectFile} and {@link ClaudeContextResult.claudeMdBackupWouldCarryContent}.
 * And, on a forced run only, each conventions document and its `.bak` sibling, which decide
 * {@link keepsRescuedBackup} and the note below it. Those last two kinds are reads rather than a
 * policy change
 * because the answer is a fact about **this** tree at **this** moment: the corpus keeps the
 * `create-if-absent` row it has always had, and a class-wide `--force` exemption like the ledgers'
 * would also stop the forced regeneration of a filled corpus, which is a thing an adopter may
 * legitimately want.
 */
export function writeClaudeContext({
  repoRoot,
  config,
  plan,
  analyzeOffer = 'accepted',
  force = false,
  dryRun = false,
}: ClaudeContextOptions): ClaudeContextResult {
  const warnings: string[] = [];
  const notes: string[] = [];
  const envExamples: string[] = [];

  // Trailing separator removed for the token, which is substituted into a `<root>/…/lessons.md`
  // sentence where a doubled slash reads as a typo; the ledger link is built with `posix.join`,
  // which normalises it either way.
  const stateDir = (config.stateDir ?? DEFAULTS.stateDir).replace(/\/+$/, '');
  const sharedPath = normalizeRepoPathStrict(SHARED_CONVENTIONS_PATH);
  const stubs = collectStubs(config);

  const claudeMdExisted = existsSync(join(repoRoot, CLAUDE_MD_PATH));
  // Read before the plan, like every other fact reported from here: the keep's wording turns on
  // whether a `.bak` was there when the run started, and the write engine may create one below.
  const claudeMdBackupExisted = existsSync(join(repoRoot, `${CLAUDE_MD_PATH}.bak`));

  // Rendered into a local rather than inline, because the identity test below compares the file on
  // disk against this exact text: the answer is what decides the per-request override and the fact
  // `init` words its closing sentence from.
  const claudeMdContent = render('CLAUDE.md', {
    projectName: config.projectName ?? defaultProjectName(repoRoot),
    setupBanner: setupBanner(analyzeOffer),
    routingRows: routingRows(stubs, sharedPath, stateDir),
    stateDir,
    pluginName: PLUGIN_NAME,
  });
  const keepClaudeMd = force && keepsIdenticalProjectFile(repoRoot, claudeMdContent);

  plan.add({
    path: join(repoRoot, CLAUDE_MD_PATH),
    policy: 'create-if-absent',
    ...(keepClaudeMd ? { forceOverride: 'never' as const } : {}),
    content: claudeMdContent,
    label: 'project context file',
  });

  // Planned beside the file that points at it: the two make up one feature, and gating this one on a
  // phase would ship that pointer with no target.
  plan.add({
    path: join(repoRoot, TASK_OFFER_PATH),
    policy: 'create-if-absent',
    content: render('harness-task-offer.md', { pluginName: PLUGIN_NAME }),
    label: 'change-request offer rules',
  });

  if (claudeMdExisted && !force) {
    notes.push(
      `${CLAUDE_MD_PATH} was already there and ${dryRun ? 'would be kept' : 'was kept'} as it stands, so the setup-pending banner ${dryRun ? 'would not be' : 'was not'} written into it: run \`npx autonomous-sdlc-harness doctor\` at any time for what is still unfilled`,
    );
  }

  const written: WrittenStub[] = [];
  const keptForBackup: string[] = [];
  for (const stub of stubs) {
    const layerNames = stub.layers.map((layer) => layer.name);

    if (!stub.dedicated && stub.layers.length > 1) {
      warnings.push(
        `layers ${joinPhrases(layerNames)} all point at ${stub.path}, which has no dedicated skeleton, so the generic layer stub was written once for ${layerNames[0] as string}: give each layer its own conventions document, or the rules of one are what every implementer of the others reads`,
      );
    }

    const keep = force && keepsRescuedBackup(repoRoot, stub.path);
    if (keep) keptForBackup.push(stub.path);

    plan.add({
      path: join(repoRoot, stub.path),
      policy: 'create-if-absent',
      // The one per-request exception to the run's `--force`, and it is computed from the tree
      // rather than fixed by this artifact's class: the policy, content and label are what they
      // have always been, and an ordinary forced run still replaces the document after a `.bak`.
      ...(keep ? { forceOverride: 'never' as const } : {}),
      content: render(stub.template, {
        layerName: layerNames[0] ?? 'general',
        analyzeInvocation: analyzeInvocation(layerNames, stub.path, warnings),
      }),
      label: `conventions stub ${stub.path}`,
    });
    written.push({ path: stub.path, dedicated: stub.dedicated, layers: layerNames });
  }

  if (keptForBackup.length > 0) {
    // `init`'s `analyzeRecordSentence` needs no edit to stay truthful beside this note, and this is
    // why: its `putBack` clause is keyed on `filledConventions` — the documents that were **not**
    // untouched skeletons when the run started — and a document kept here is by construction one
    // that was. So a kept document never appears in that list, and the run cannot claim to have put
    // back a document it left alone. On a mixed corpus the two lines are complementary: `putBack`
    // names what this run skeletonised, this note names what it kept and why.
    const one = keptForBackup.length === 1;
    notes.push(
      `${joinPhrases(keptForBackup)} ${dryRun ? 'would be kept' : one ? 'was kept' : 'were kept'} as ${one ? 'it stands' : 'they stand'} under --force: ${one ? 'it is' : 'they are'} already ${one ? 'a skeleton' : 'skeletons'}, and ${one ? 'its' : 'their'} .bak ${one ? 'sibling holds' : 'siblings hold'} the filled analysis an earlier forced run rescued — the engine's .bak is single-generation, so regenerating ${one ? 'it' : 'them'} would overwrite that analysis with a skeleton and leave no copy of it: restore ${one ? `${keptForBackup[0] as string}.bak` : 'those .bak files'} to get the analysis back, or run \`${ANALYZE_COMMAND}\` again to rebuild it`,
    );
  }

  const pushExample = `${normalizeRepoPathStrict(config.pushEnvPath ?? PUSH_ENV_PATH)}${EXAMPLE_SUFFIX}`;
  plan.add({
    path: join(repoRoot, pushExample),
    policy: 'create-if-absent',
    content: render('push-notify.env.example', {
      pushEnvPath: normalizeRepoPathStrict(config.pushEnvPath ?? PUSH_ENV_PATH),
    }),
    label: 'push-notification settings example',
  });
  envExamples.push(pushExample);

  if (config.phases?.qa === true) {
    const credentialsPath = normalizeRepoPathStrict(config.qa?.credentialsPath ?? QA_CREDENTIALS_PATH);
    const qaExample = `${credentialsPath}${EXAMPLE_SUFFIX}`;
    plan.add({
      path: join(repoRoot, qaExample),
      policy: 'create-if-absent',
      content: render('qa-accounts.env.example', { credentialsPath }),
      label: 'test-account credentials example',
    });
    envExamples.push(qaExample);

    plan.add({
      path: join(repoRoot, QA_SCENARIOS_PATH),
      policy: 'create-if-absent',
      content: render('qa_test_scenarios.md', { credentialsPath }),
      label: 'QA test-scenario rules',
    });
    notes.push(
      `${QA_SCENARIOS_PATH} is a skeleton for this project's own test-scenario rules, and yours to edit from here on: fill in its banner sections, keep account-specific values in ${credentialsPath}, and a re-run will leave your copy alone`,
    );
  } else {
    notes.push(
      'no test-account example and no test-scenario rules were written, because phases.qa is off and both belong to the interactive test phase: turn the phase on in harness.config.json and re-run init to add them',
    );
  }

  const generic = written.filter((stub) => !stub.dedicated);
  if (generic.length > 0) {
    notes.push(
      `${generic.length} ${generic.length === 1 ? 'layer has' : 'layers have'} no dedicated skeleton, so the generic layer stub was written for ${joinPhrases(generic.map((stub) => stub.path))}`,
    );
  }

  return {
    claudeMd: CLAUDE_MD_PATH,
    claudeMdBackupWouldCarryContent: claudeMdExisted && force && !keepClaudeMd,
    claudeMdBackupExisted: keepClaudeMd && claudeMdBackupExisted,
    stubs: written,
    envExamples,
    warnings,
    notes,
  };
}
