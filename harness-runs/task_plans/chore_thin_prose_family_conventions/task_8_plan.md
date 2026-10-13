### Task 8 — Measure the three files, run the family check probe and record the result in the story index

**Goal:** Fill the `After` and `Δ` cells of the story index's `## Up-front word counts` table from the tree as Tasks 1–7 left it. Then prove mechanically, against `25e2382a`, that:
- each of the three files shrank, and `conventions-reviewer`'s up-front count fell;
- no other file under `plugin/` changed;
- no frozen text moved, and no bold lead, heading line, fenced block or frontmatter changed;
- every wire literal and cited anchor survived;
- the scope register still closes.

**Depends on:** Task 2 (the last edit to `plugin/agents/conventions-writer.md`), Task 4 (the last edit to `plugin/agents/conventions-reviewer.md`) and Task 7 (the last edit to `plugin/commands/harness-analyze.md`). This is the catch-all (`general`) task. It ships last because it measures what the `plugin` tasks built.

**Where this task stops.** It edits only the story index `harness-runs/story_plans/chore_thin_prose_family_conventions_story_plan.md`, the file this task is dispatched to fill.
- Within it, only the `After` and `Δ` cells of `## Up-front word counts` change, plus at most one line under that table.
- No line of `## Context`, `## Phase 2 Readiness — Ordered Fix List` or `## Scope register` changes, and no readiness marker is touched.
- It edits no file under `plugin/`.

If a check fails, record the figures you have and return a blocker quoting every failing line; never edit a family file yourself. The story index is this task's only work file, so its commit stages the index alone and the committer's return carries a `staged: index-only` notice. That is expected here and is not a defect.

**What the figures mean.** Up-front words are the file plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md`, the adopter's conventions documents, `<state_dir>/lessons.md` and conditional reads. The probe counts words as `wc -w` does: runs of non-whitespace characters.
- **`conventions-writer`** reads no plugin file up front, so its up-front count is its own.
- **`conventions-reviewer`** read the whole of `plugin/agents/conventions-writer.md` up front before this branch. After Task 3 it reads that file's `## Scope`, `## The document`, `## The fix dispatch` and `## House rules` only. The probe's `UPFRONT` line computes both figures.
- **`harness-analyze.md`** is a command loaded into the session, so its up-front count is its own. Its `(4b)` read of the writer's `## The document` and `## House rules` is conditional on the `project` target and is excluded.

**What the probe checks**, run with no file argument:
- **Frozen text:** every run of words covered by a ten-word window (inside one paragraph) that a family file shared at `25e2382a` with an agent definition, command or instruction file outside the family, plus the words between two such runs in one sentence (`FROZEN`).
- **Structure:** every bold lead opening a paragraph or a list item (`LEAD`), every heading line (`HEADING`), every fenced block (`FENCE`) and the frontmatter (`FRONTMATTER`) of each file at `25e2382a` is still in it.
- **Literals:** each file's list of wire literals and cited anchors is present at `25e2382a` (`LITERAL-NOT-AT-BASE`) and still present now (`LITERAL`), compared with whitespace collapsed so a re-wrapped line still matches.
- **Unchanged files:** no change under `plugin/` outside the three family files (`OTHER-PLUGIN-CHANGED`).
- **Words:** each file's count fell (`WORDS-NOT-LOWER`), `conventions-reviewer`'s up-front count fell (`UPFRONT-NOT-LOWER`), and the four writer sections it reads still exist (`READ-SECTION-MISSING`).

### Targets

- `harness-runs/story_plans/chore_thin_prose_family_conventions_story_plan.md` → `## Up-front word counts`: the `After` and `Δ` columns, and at most one line under the table.
- `harness-runs/scratch/conventions_family_check.mjs`: a gitignored probe, written from the text below and never committed. Task 1 wrote the same text; overwrite it.

**Work:**

- [ ] Write `harness-runs/scratch/conventions_family_check.mjs` with exactly the text under `### Probe` below. Then run `bash scripts/scratch-run.sh harness-runs/scratch/conventions_family_check.mjs` as one plain foreground command, with no file argument, so that it checks all three files. Its last line is `PASS` or `FAIL <n>`, and its exit status matches.
- [ ] Fill the table from the probe's `WORDS` and `UPFRONT` lines.
  - Copy each `WORDS` line's `after=` figure into its row's `After — file` cell.
  - For `conventions-writer` and `harness-analyze.md`, `After — up-front` equals `After — file`. For `conventions-reviewer`, copy the `UPFRONT` line's `after=` figure.
  - `Δ up-front` is `After — up-front` minus `Before — up-front`.
  - Check that each `WORDS` `before=` equals the row's `Before — file`, and the `UPFRONT` `before=` equals `conventions-reviewer`'s `Before — up-front`. A mismatch means the base tree moved: record it under the table.
  - On `FAIL`, keep the figures you recorded and write one line under the table saying the probe failed. Return a blocker quoting every line the probe printed other than `WORDS`, `UPFRONT` and the last line. Do not edit `plugin/`.
- [ ] Re-run the story index's `## Scope register` derivation commands C1, C2, C3 and C3b verbatim. Every file or distinct path each prints must be a row of the register; read C3's and C3b's paths with their `25e2382a:` prefix removed. Record any path with no row under the table and return a blocker naming it.
- [ ] Run `git grep -n -E '[^:a-z]/harness-analyze' -- plugin/agents/conventions-writer.md plugin/agents/conventions-reviewer.md plugin/commands/harness-analyze.md`; it must print nothing, so every command name keeps its qualified spelling. On any hit, record it under the table and return a blocker quoting it.

### Probe

````js
// Conventions family check: frozen cross-family text, bold leads, headings, fenced blocks,
// frontmatter, wire literals, the unchanged rest of plugin/, and word counts.
// Base commit 25e2382a. Read-only: reads the tree and `git show` output, writes nothing.
// Usage: node conventions_family_check.mjs [<family path> ...]
// With no argument it checks all three files.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const BASE = '25e2382a';
const root = fileURLToPath(new URL('../..', import.meta.url));
const nowRoot = root;
const W = 'plugin/agents/conventions-writer.md';
const R = 'plugin/agents/conventions-reviewer.md';
const H = 'plugin/commands/harness-analyze.md';
const FAMILY = [W, R, H];
const args = process.argv.slice(2);
const CHECK = args.length ? args : FAMILY;
for (const f of CHECK) if (!FAMILY.includes(f)) { console.log(`NOT-IN-FAMILY ${f}`); process.exit(2); }
const now = (p) => readFileSync(join(nowRoot, p), 'utf8');
const then = (p) => execFileSync('git', ['-C', root, 'show', `${BASE}:${p}`], { encoding: 'utf8' });
const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();
const toks = (t) => t.match(/\S+/g) ?? [];
const norm = (t) => toks(t).join(' ');
const paras = (t) => t.split(/\n[ \t]*\n/).map(toks).filter((p) => p.length);
const N = 10;
let fail = 0;
const bad = (m) => { fail++; console.log(m); };
// 1. Words: each file's own count, and each agent's up-front count, must fall.
//    conventions-reviewer reads conventions-writer.md up front: the whole file before
//    this branch, its ## Scope, ## The document, ## The fix dispatch and ## House rules after.
const section = (t, h) => { const i = t.indexOf(`\n${h}\n`); if (i < 0) return ''; const k = t.indexOf('\n## ', i + h.length + 2); return t.slice(i, k < 0 ? t.length : k); };
const READ = ['## Scope', '## The document', '## The fix dispatch', '## House rules'];
for (const f of CHECK) {
  const b = toks(then(f)).length; const a = toks(now(f)).length;
  console.log(`WORDS ${f} before=${b} after=${a} delta=${a - b}`);
  if (a >= b) bad(`WORDS-NOT-LOWER ${f}`);
}
if (CHECK.includes(R)) {
  const b = toks(then(R)).length + toks(then(W)).length;
  const wNow = now(W); const a = toks(now(R)).length + READ.reduce((n, h) => n + toks(section(wNow, h)).length, 0);
  console.log(`UPFRONT ${R} before=${b} after=${a} delta=${a - b}`);
  if (a >= b) bad(`UPFRONT-NOT-LOWER ${R}`);
  for (const h of READ) if (!section(wNow, h)) bad(`READ-SECTION-MISSING ${W}: ${h}`);
}
// 2. Nothing else under plugin/ changes.
const others = git('diff', '--name-only', BASE, '--', 'plugin').split('\n').filter((n) => n && !FAMILY.includes(n));
if (others.length) bad(`OTHER-PLUGIN-CHANGED ${others.join(' ')}`);
// 3. Frozen text: a 10-word window (inside one paragraph) shared at BASE with an agent definition,
//    command or instruction file outside the family, plus the words between two such runs in one sentence.
const listing = (d) => then(`${d}/`).split('\n').filter((n) => n.endsWith('.md')).map((n) => `${d}/${n}`);
const outside = [...listing('plugin/agents'), ...listing('plugin/commands'), ...listing('plugin/instructions')].filter((n) => !FAMILY.includes(n));
const winSet = new Set();
for (const n of outside) for (const p of paras(then(n))) for (let i = 0; i + N <= p.length; i++) winSet.add(p.slice(i, i + N).join(' '));
const endsSentence = (w, nx) => /[.?!](\*\*|\*|`|\)|")*$/.test(w) && nx !== undefined && /^[A-Z*`(\-|]/.test(nx);
for (const f of CHECK) {
  const cur = ' ' + norm(now(f)) + ' ';
  for (const p of paras(then(f))) {
    const x = new Array(p.length).fill(false);
    for (let i = 0; i + N <= p.length; i++) if (winSet.has(p.slice(i, i + N).join(' '))) for (let k = i; k < i + N; k++) x[k] = true;
    const sid = []; let s = 0;
    for (let i = 0; i < p.length; i++) { sid.push(s); if (p[i] === '|' || endsSentence(p[i], p[i + 1])) s++; }
    const g = x.slice();
    for (let id = 0; id <= s; id++) {
      const idx = p.map((_, i) => i).filter((i) => sid[i] === id && x[i]);
      if (idx.length >= 2) for (let k = idx[0]; k <= idx[idx.length - 1]; k++) g[k] = true;
    }
    for (let i = 0; i < p.length;) {
      if (!g[i]) { i++; continue; }
      let j = i; while (j < p.length && g[j]) j++;
      const run = p.slice(i, j).join(' ');
      if (!cur.includes(' ' + run + ' ')) bad(`FROZEN ${f}: ${run.slice(0, 160)}`);
      i = j;
    }
  }
}
// 4. Structure that stays: frontmatter, every heading line, every bold lead (a `**…**` opening a
//    paragraph's first line or a list item), every fenced block.
const leadRe = /^\s*(?:(?:[-*]|\d+\.)\s+)?(\*\*[^*]+\*\*)/;
const listRe = /^\s*(?:[-*]|\d+\.)\s+/;
const fences = (t) => t.match(/^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*$/gm) ?? [];
for (const f of CHECK) {
  const b = then(f); const a = now(f); const aNorm = norm(a);
  if (b.split('\n---\n')[0] !== a.split('\n---\n')[0]) bad(`FRONTMATTER ${f}`);
  const aLines = new Set(a.split('\n'));
  const bl = b.split('\n');
  bl.forEach((line, i) => {
    if (/^#{1,6} /.test(line) && !aLines.has(line)) bad(`HEADING ${f}: ${line}`);
    const first = i === 0 || bl[i - 1].trim() === '' || /^#{1,6} /.test(bl[i - 1]);
    const m = line.match(leadRe);
    if (m && (first || listRe.test(line)) && !aNorm.includes(norm(m[1]))) bad(`LEAD ${f}: ${m[1]}`);
  });
  for (const blk of fences(b)) if (!a.includes(blk)) bad(`FENCE ${f}: ${blk.split('\n').slice(1, 2).join('').trim().slice(0, 120)}`);
}
// 5. Wire literals and cited anchors, each present at BASE and kept (compared whitespace-normalized).
const LIT = {
[W]: [
    '`${CLAUDE_PLUGIN_ROOT}/commands/harness-analyze.md`', 'One relaxation, on a `pass: corpus` fix only', "Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.",
    'at most one fix dispatch per corpus iteration, over the at most two iterations the caller runs', '**plus** at most one fix-only reconciliation dispatch of the shared cross-layer document, sent before iteration 1 and counted outside both',
    '| `pass` |', '| `target` |', '| `document_path` |', '| `action` |', '| `scope` |', '| `mode` |', '| `excluded_paths` |', '| `harvested_sources` |', '| `demand_set` |', '| `shared_document` |', '| `parity` |',
    '**Always sent; `none` is a value, never an omission.**', '`shared_document` is `none` in exactly three cases', '**On `none`:**',
    '`findings` (the reviewer\'s findings, verbatim)', '`prior_document`, `prior_prompts`, `prior_rule_block`', "Applying findings must leave `prior_rule_block`'s content present, verbatim or restated",
    '`C1`–`C6`', 'which is never dispatched to you', '`Layer-writer divergence — `', '**The prefix is the discriminator.**', 'is a malformed dispatch, not a third origin to guess at',
    'return a blocker naming which value is missing, and stop', 'Never guess a layer, never widen the scope, never substitute another document.',
    '**You write one file, `document_path`, and no other.**', '`autonomous-sdlc-harness config set layers`', 'including into `<state_dir>`',
    '**Reconciling `harvested_sources` against the code.**', 'carrying both sides, what the prose says and what the code does',
    '*can adding correct new code make this sentence false?*', '**Never a census.**', '**The carve-out — a claim that *is* a rule stays.**', '**And never a census in `## Not determined`**',
    '**Never a restatement of the stack.**', '*would this sentence be true of any project using this language, framework or formatter?*', 'could a correct project of this stack do otherwise?',
    '**Never a process rule.**', '`in the same commit`', '**The carve-out is the commit-message policy**', 'message form stays, work grouping goes',
    '**An intent claim requires a source that states it.**', '`> **Read this when:** … **Skip when:** …`', '**Actors are roles, never the adopter\'s agents.**', '`**What belongs here**`',
    '**A rule governing more than one layer is owned by the shared cross-layer document**', '**Provenance on every rule**', '**Before citing a source file for a rule about code shape, grep that file for the construct the rule asserts**',
    '**A claim about build or generated output is read off the build configuration or an emitted artifact**', '**`mode: greenfield` exempts this clause whole:**',
    '**Every count, quantity or "N files" statement is the output of a command you ran in this dispatch.**', 'Write **one whole document**, never a document assembled in place',
    '**Where the shared document disagrees with this scope\'s code, record the divergence.**', '`shared_document_divergences:`', '**On `pass: corpus` it does not apply and the field is `none`',
    '**On `action: merge`:**', '**On an `action: write` dispatch whose `document_path` names no existing file.**', '`prior_document: absent`', '`prior_prompts: n/a`', '`prior_rule_block: n/a`',
    '**no `<!-- harness:unfilled -->` marker**', '**Remove that document\'s `<!-- harness:unfilled -->` line**', '**Replace the skeleton\'s footer with a document-level provenance line**',
    '**`## Not determined` closes every document, present even when it says nothing is outstanding.**', '`Reviewer finding not applied — `', 'That literal is a wire string',
    '**One pass per dispatch, on either axis, and there is no second inside it.**', '**duty, not a permission**', '**On `pass: corpus` you are not told whether another iteration follows**',
    '**Adopter prose carried over by `action: merge` is corrected like any other line**', '**Every corpus finding you do not apply is recorded exactly as a document-axis one is:**',
    'Field names byte-stable', '- `document_path:`', '- `action_taken:`', '- `not_determined:`', '- `not_determined_lines:`', '- `conflicts:`', '- `shared_document_divergences:`',
    '- `findings_applied:`', '- `findings_declined:`', '- `evidence:`', '- `prior_document:`', '- `prior_prompts:`', '- `prior_rule_block:`', '- `notes:`', '`written` or `merged`',
    '**The two fields do not overlap and neither absorbs the other:**', '**Always emitted**', '`skeleton`, `filled` or `absent`',
    '**The three `prior_*` fields are the pre-write state, so read and quote them off the file before you replace it**', '**exactly the values the dispatch handed you**',
    '**from this return alone and does not re-read your document**', '**Minimal prose.**', '**An exact line number must never be written into the document',
    'A renamed symbol fails loudly; a shifted line fails silently.', '`path` (`symbolName`)', '**Every path written into the document is repo-relative and resolves against `<repo_root>`**',
    '**Never require a write to a path a run may not write.**', '`${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md`, `**Conventions-document prohibition**`', '`.claude/qa_test_scenarios.md`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md`, *"That file holds the rules"*', '`<state_dir>/ui_test_plans/<branch>/`'],
  [R]: [
    'that omission is deliberate: it makes the read-only guarantee tool-level rather than a prose request', '**You edit nothing and you write nothing, on either axis.**', 'You write **no findings file at all**',
    '**Read `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` before you grade.**', 'Take the strings from it rather than from memory, so writer and reviewer cannot disagree.',
    '**What you establish, and what you do not.**', "Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.",
    '`${CLAUDE_PLUGIN_ROOT}/commands/harness-analyze.md`', '**once per document**', '**at most twice per run**', 'Every name below is spelled exactly as the writer\'s own contract spells it.',
    '| `pass` |', '| `document_path` |', '| `target` |', '| `scope` |', '| `mode` |', '| `excluded_paths` |', '| `harvested_sources` |', '| `shared_document` |', '| `demand_set` |',
    '| `prior_document` |', '| `prior_prompts` |', '| `prior_rule_block` |', '| `corpus_documents` |', '| `iteration` |', '`project` is not a value on this axis.',
    '**On `none` there is no vocabulary anchor for this run: raise no naming finding at all.**', '**On `pass: document`, the three `prior_*` values are the only record of the pre-write document that reaches you.**',
    '`fixable`', '**evidence and never a fix target**', '`1` or `2`', '**`target`, inside each `corpus_documents` entry, takes one of exactly three values on this axis:**', '**There is no top-level `target` on this axis.**',
    '**The three `prior_*` values are not sent on a corpus dispatch and are not owed:**', '**Dispatch counts, per axis.**', 'a caller bug — say so, and stop',
    'Never guess a scope, and never review a different document — on `pass: corpus`, none outside `corpus_documents`.',
    '**Checks (1)–(15) below are the document pass\'s**', '1. **The document contract holds.**', '2. **`prior_rule_block`\'s content survives**', '3. **Every rule is attributable.**',
    '**One citation is exempt, and only one:**', '**The exemption carries a duty: re-run that same probe and grade closure**', '`⊆ the list ∪ the named exclusions`',
    '**Concrete correction: add the subject to the list, or name the class that excludes it.**', '**Concrete correction: delete the claim, or re-attribute it to the prose source that states it.**',
    '**Zero occurrences is the finding**', '**Concrete correction: delete the rule, or restate it as what the cited file shows.**', '**`mode: greenfield` exempts the citation half and not the presence half:**',
    '4. **No rule the code contradicts**', '5. **`demand_set` coverage**', '6. **Vocabulary coherence with `shared_document`**', '**Skipped whole when `shared_document` is `none`**',
    '7. **No rule derived from `excluded_paths`**', '8. **No line coordinate anywhere in the document**', 'value-vs-coordinate test', '9. **No census and no restatement of the stack',
    '**First: *can adding correct new code make this sentence false?***', '**Concrete correction: delete the sentence, or restate it as the rule it stood in for.**', '**And a census inside `## Not determined` is a finding on its own**',
    '**Second: *would this sentence be true of any project using this language, framework or formatter?***', '**Concrete correction: delete the sentence, or restate it as the choice this project made among the alternatives the stack allows.**',
    '10. **Every intent claim cites a source that states it.**', '**Concrete correction: record the pattern as observed, and send the intent to `## Not determined` with what would settle it.**',
    '11. **`## Not determined` is honest**', 'Concrete correction: collapse them into one entry naming the reason once and the items it covers.', '`Reviewer finding not applied — `',
    '12. **Actors are the roles the flow dispatches.**', '**Concrete correction: restate the actor in role terms — this layer\'s implementer and its reviewer — or move the name into the provenance line.**',
    '13. **No process rule.**', '**The one carve-out, and it applies only when `target` is `conventions`:**', '**Concrete correction: delete the process clause and keep the code half of the sentence.**',
    '14. **Every token that names a location in this repository is repo-relative and resolves against `<repo_root>`.**', '**five token classes are not locations in this repository and are never this finding:**',
    '**Skipped when `mode` is `greenfield`**', '**Concrete correction: re-spell the path as it resolves from the repository root.**',
    '15. **No rule requires a write where a run may not write.**', '`.claude/qa_test_scenarios.md`', '**Concrete correction: re-point the step at the run\'s own `<state_dir>/ui_test_plans/<branch>/`.**',
    'C1. **Contradiction**', 'C2. **Role vocabulary across the set**', 'C3. **Duplication**', 'C4. **Cross-layer claims**', 'C5. **Coverage**', 'C6. **Census and stack-restatement voice across the set**',
    '**The second clause is the one deliberate overlap with a document-pass check**', '**Distinct from C3, and a finding fires under one id, not both:**',
    '**Disjointness — do not re-run checks (1)–(15) over a member that already had its document pass.**', '**The second of those exceptions is `.claude/CLAUDE.md` (`target: project`).**',
    '**(3), (4), (7), (8), (9), (10), (12), (13), (14) and (15)**', '`${CLAUDE_PLUGIN_ROOT}/commands/harness-analyze.md` → `(4b)`',
    '**Three false positives are rules of this pass, not advice.**', '**(a) The `demand_set` absence answer.**', '**the same question answered in several members is required behaviour and never C3.**',
    '**(b) Adopter prose carried by `action: merge`**', '`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## Scope`, **Reconciling `harvested_sources` against the code**',
    '**(c) A member still carrying `<!-- harness:unfilled -->` is template prose, not evidence.**', '**A coherent corpus returns `findings: none`, and that is a complete answer, not an under-delivery.**',
    '**On `iteration: 2`**', '**Checks (9) and (10) are not that.**', '**No severity band and no verdict field, on either axis.**', 'Their absence is the contract, not an omission.',
    'Field names byte-stable', '- `document_path:`', '- `findings:`', '- `summary:`', '**On `pass: document`:**', '**On `pass: corpus`:**',
    '`document_path:` as a top-level field is document-pass only', '**Minimal prose.**', '**No line coordinate in anything durable**'],
  [H]: [
    '`<shared_conventions_path>`', '`SHARED_CONVENTIONS_PATH`', 'This row is the only place in this file that path is spelled.', '`autonomous-sdlc-harness init`, never a bare `init`',
    '**Usage:**', '**Targets are read from `harness.config.json` at invocation time, and this file enumerates none of them:**', '**loses the bare word**',
    '**Supervised, first-session command.**', '**expected to ask for permission**', '**It never edits `harness.config.json`.**', '`config set detection.review`', '**It never declines on size or duration.**', '**It writes no rule it cannot attribute.**',
    'docs/analyze.md', '1. **Resolve and announce, before writing anything.**', '**Dispatch is keyed by document, not by target**',
    '**What a run that does not itself write the shared cross-layer document sends as `shared_document`.**', '**whether this run writes it**', '**value in every case**', '**value and never an omitted key**',
    "**The set is re-derived once, after step 5's `layers` proposal is applied.**", '**joins the document set here**', '**dispatch plan**', '**no per-layer rule-deriving evidence**',
    '2. **Gather what the whole run shares, and what the targets this session writes itself need.**', '**The mode facts**', '**The repo-level harvest**', '**`existing` mode only**', '**The demand set**',
    'grep -rln "convention_symbols\\|impl_stack"', '**The `project`-target survey**', '**and one real file per pattern**',
    '3. **What is delegated, to whom, and in what order. This step sends nothing.**', '**step 4 fills**', '**Every conventions document is written by `conventions-writer`**', '**Ordering, for the set the run actually has.**',
    '**When this run writes the shared cross-layer document**', '**When it does not**', "**The write dispatch's argument block**", '**always sent**', '**What governs the prompt beyond that block.**',
    '**What stands in its place: the block is closed.**', "**It binds (4d)'s two corpus dispatch shapes identically, and hardest on the corpus review**", '`context_notes:`',
    '4. **Classify every document, then dispatch, then review each written one once, then review the corpus as a set. This step sends every dispatch in the run.**', '**one whole document**',
    '**(4a) The conventions documents**', '**untouched skeleton**', '`action: write`', '`action: merge`', '**After an accepted `layers` proposal, the asked default flips to `skip`.**',
    '**Then send, in the order step 3 fixes.**', '**three waves — all writes, then all reviews, then all fixes — one message per wave, so each wave runs concurrently**',
    '**Keep every `shared_document_divergences:` line these returns carry**', '`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## Output contract`', 'spent by (4d.0) and by nothing else',
    '**(4b) The `project` target, `.claude/CLAUDE.md`.**', '**classified per section, not per file**', '"writes this paragraph from the repository itself"', '"fills this table from the repository\'s real file names"',
    "**Both sections are written from step 2's `project`-target survey**", '**This session reconciles the two itself**', '**conflict line in step 6, from this session\'s own record**',
    "**The two sections this session composes are bound by the writer's own content rules, by reference.**", '`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## The document` and `## House rules`',
    '**It binds on `write` and on `merge` alike**', '**composes or rewrites**', '`${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md` → `## The corpus pass — what to verify`',
    '**Corpus findings against this file, and who applies them.**', '**`role: fixable`**', '**`role: context`**', '**applied by this session and never dispatched**', '`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## Scope`',
    '**It is applied only inside a section this run itself wrote or merged**', '**not applied and is carried to step 6 as outstanding**', '**A corpus finding this session declines on the merits**', '**duty, not a permission**',
    '**setup-pending banner is not a classification input**', '`<!-- harness:setup-pending -->`', '`<!-- /harness:setup-pending -->`',
    '**(4c) The review, one pass per delegated document.**', '`prior_document` (`skeleton` | `filled` | `absent`)', '**and the three `prior_*` fields taken verbatim from that document\'s write return**',
    '**No verdict, no cap, no re-review, and no adjudication on this axis:**', '**(4d) The corpus pass — the set as a whole, two fixed iterations.**',
    '**(4d.0) Reconcile the shared cross-layer document first — one fix-only dispatch, and no review.**', '`Layer-writer divergence — `', '**Fix-only:**',
    '**The cap, in the receiving contract\'s own words**', '`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## Invocation contract`', '**Skipped, with the reason recorded for step 6**',
    '**A divergence the writer declines**', '`Reviewer finding not applied — `', '**The corpus set**', '**`target` takes one of exactly three values on this axis**',
    '`${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md` → `## Invocation contract`', '**Not a silent drop**', '**`role` is that closed two-value set and nothing else.**',
    '**The pass does not run at all**', '**Iteration 1 — one review dispatch, then a per-document fix fan-out.**', '`iteration: 1`', '**not sent**',
    '**the corpus-fix return carries `shared_document_divergences: none` by that axis\'s own rule**', '`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## The document`', '**one wave**',
    '**Iteration 2 — narrowed, fixed, and skippable on its own evidence.**', '`iteration: 2`', '**Iteration 2 does not run**', '**There is no third iteration and no verdict gates either one',
    '5. **The `layers` target proposes and never writes.**', '`path: "."`', "`npx autonomous-sdlc-harness config set layers '<json>'`", '**This step itself sends nothing.**',
    'whose third case is exactly that dispatch', '**Record the verdict, in all three outcomes.**', "`npx autonomous-sdlc-harness config set detection.review '<json>'`",
    '`{"verdict": "<one of applied | considered-no-change | proposed-and-refused>", "rationale": "<one line: what was read, what was concluded, and — where a proposal was refused — what was proposed>", "at": "<YYYY-MM-DD>"}`',
    '**`applied`**', '**`considered-no-change`**', '**`proposed-and-refused`**', '**Recording a refusal is not applying it**', '**names the proposal that was refused**',
    '**any quantity the `rationale` states is the output of a command run in this session before this `config set` call — or it is omitted**', '(`cli/src/doctor/checks.ts` → `LAYER_PROFILE_CHECK`)',
    '**What that record clears, and what it does not.**', '`layer-profile`', '`layer-drift`', '**for reporting only**',
    '6. **Report, in this order:**', '`npx autonomous-sdlc-harness doctor`', '**announced target order regardless of completion order**',
    '**The report is built from the returns for every delegated document, and from this session\'s own record for the targets it wrote itself; the session does not re-read the written documents.**',
    '**A delegated document**', '**A document (4a) classified `skip`**', '**The `project` target**', '**The `layers` target**', '**The review lines are delegated-document rows only:**',
    '**The corpus block follows those rows', '**Whether the corpus pass ran**', "**Whether (4d.0)'s reconciliation dispatch ran or was skipped**", '**Per iteration, how many findings were raised**',
    '**Every document (4d) excluded from the set**', '**An outstanding cross-document divergence is one of this run\'s results, not a next action.**', '**A run that ends with none says so explicitly**'],

};
for (const f of CHECK) for (const l of LIT[f]) {
  if (!norm(then(f)).includes(norm(l))) bad(`LITERAL-NOT-AT-BASE ${f}: ${l}`);
  else if (!norm(now(f)).includes(norm(l))) bad(`LITERAL ${f}: ${l}`);
}
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
````

**Verification:**

- The probe's last line is `PASS`, and each `WORDS` and `UPFRONT` line shows a negative `delta`.
- Every `After` and `Δ` cell of `## Up-front word counts` is filled, and every `Δ up-front` is below `0`.
- `git diff -- harness-runs/story_plans/chore_thin_prose_family_conventions_story_plan.md` touches only `## Up-front word counts`.
- `git status --short -- plugin` prints nothing that this task changed.
