### Task 6 — Measure both definitions, run the family check probe and record the result in the story index

**Goal:** Fill the `After — definition`, `After — up-front` and `Δ up-front` cells of the story index's `## Up-front word counts` table from the tree as Tasks 1–5 left it. Then prove mechanically, against `25e2382a`, that:
- each definition shrank, and `docs-reviewer`'s up-front count fell;
- the six `docs-writer.md` sections `docs-reviewer` now reads exist, and the reviewer cites each one;
- no file under `plugin/instructions/` or `plugin/samples/`, and no other agent definition, changed;
- no frozen text moved, and no bold lead, heading line, fenced block or frontmatter changed;
- every wire literal, cited anchor and graded rule survived;
- the scope register still closes, and the branch changed no file outside the two definitions and `harness-runs/`.

**Depends on:** Task 3 (the last edit to `plugin/agents/docs-writer.md`) and Task 5 (the last edit to `plugin/agents/docs-reviewer.md`). This is the catch-all (`general`) task. It ships last because it measures what the `plugin` tasks built.

**Where this task stops.** It edits only the story index `harness-runs/story_plans/chore_thin_prose_family_docs_story_plan.md`, the file this task is dispatched to fill.
- Within it, only the `After — definition`, `After — up-front` and `Δ up-front` cells of `## Up-front word counts` change (each `_Task 6_` placeholder), plus at most one line under that table.
- No line of `## Context`, `## Phase 2 Readiness — Ordered Fix List` or `## Scope register` changes, and no readiness marker is touched.
- It edits no file under `plugin/`.

If a check fails, record the figures you have and return a blocker quoting every failing line; never edit an agent definition yourself. The story index is this task's only work file, so its commit stages the index alone and the committer's return carries a `staged: index-only` notice. That is expected here and is not a defect.

**What the figures mean.** Up-front words are an agent's definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md`, the adopter's conventions documents and conditional inputs. The probe counts words as runs of non-whitespace characters.
- **`docs-writer`** reads no plugin file up front, so its `After — up-front` equals its `After — definition`: the `after=` figure of its `WORDS` line.
- **`docs-reviewer`** read all of `docs-writer.md` before the branch and reads the six named sections after it. Its `After — definition` is the `after=` figure of its `WORDS` line, and its `After — up-front` is the `after=` figure of the `UPFRONT` line, which adds the `writer-sections=` count to the definition.

**What the probe checks**, run with no file argument:
- **Frozen text:** every run of words covered by a ten-word window (inside one paragraph) that a family definition shared at `25e2382a` with an agent definition outside the family, plus the words between two such runs in one sentence (`FROZEN`).
- **Structure:** every bold lead (`LEAD`), every heading line (`HEADING`), every fenced block (`FENCE`) and the frontmatter (`FRONTMATTER`) of each definition at `25e2382a` is still in it.
- **Literals:** each file's list of wire literals, cited anchors and graded rules is present at `25e2382a` (`LITERAL-NOT-AT-BASE`) and still present now (`LITERAL`); the reviewer's six section citations are present now (`ADDED`).
- **The section read:** each of the six headings is a line of `docs-writer.md` (`SECTION-MISSING`), and the reviewer's up-front count fell (`UPFRONT-NOT-LOWER`).
- **Unchanged files:** no change under `plugin/instructions/` or `plugin/samples/` (`READS-CHANGED`), and none to another agent definition (`OTHER-AGENT-CHANGED`).
- **Words:** each definition's count fell (`WORDS-NOT-LOWER`).

### Targets

- `harness-runs/story_plans/chore_thin_prose_family_docs_story_plan.md` → `## Up-front word counts`: the three `After` and `Δ` columns, and at most one line under the table.
- `harness-runs/scratch/docs_family_check.mjs`: a gitignored probe, written from the text below and never committed. Task 1 wrote the same text; overwrite it.

**Work:**

- [ ] Write `harness-runs/scratch/docs_family_check.mjs` with exactly the text under `### Probe` below. Then run `bash scripts/scratch-run.sh harness-runs/scratch/docs_family_check.mjs` as one plain foreground command, with no file argument, so that it checks both definitions. Its last line is `PASS` or `FAIL <n>`, and its exit status matches.
- [ ] Fill the table from the probe's `WORDS` and `UPFRONT` lines.
  - `docs-writer`: copy the `after=` figure into `After — definition` and `After — up-front`; `Δ up-front` is that figure minus `Before — up-front`.
  - `docs-reviewer`: copy its `WORDS` `after=` into `After — definition` and its `UPFRONT` `after=` into `After — up-front`; `Δ up-front` is the `UPFRONT` `delta=`.
  - Check that each `WORDS` `before=` equals the row's `Before — definition`, and that the `UPFRONT` `before=` equals the reviewer row's `Before — up-front`. A mismatch means the base tree moved: record it under the table.
  - On `FAIL`, keep the figures you recorded and write one line under the table saying the probe failed. Return a blocker quoting every line the probe printed other than `WORDS`, `UPFRONT` and the last line. Do not edit `plugin/`.
- [ ] Re-run the story index's `## Scope register` derivation commands C1, C2, C3 and C3b verbatim. Every file or distinct path each prints must be a row of the register; read C3's and C3b's paths with their `25e2382a:` prefix removed, and C2's `${CLAUDE_PLUGIN_ROOT}/` paths as `plugin/`. Record any path with no row under the table and return a blocker naming it.
- [ ] Run `git diff --name-only 25e2382a -- . ':!harness-runs'`. It must print exactly `plugin/agents/docs-reviewer.md` and `plugin/agents/docs-writer.md`. Record any other path under the table and return a blocker naming it.

### Probe

````js
// Docs family check: frozen cross-family text, bold leads, headings, fenced blocks,
// frontmatter, wire literals, the reviewer's section read, unchanged reads and word counts.
// Base commit 25e2382a. Read-only: reads the tree and `git show` output, writes nothing.
// Usage: node docs_family_check.mjs [plugin/agents/<name>.md ...]
// With no argument it checks both definitions.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const BASE = '25e2382a';
const root = fileURLToPath(new URL('../..', import.meta.url));
const FAMILY = ['docs-writer.md', 'docs-reviewer.md'];
const args = process.argv.slice(2).map((a) => a.replace(/^.*\//, ''));
const CHECK = args.length ? args : FAMILY;
for (const f of CHECK) if (!FAMILY.includes(f)) { console.log(`NOT-IN-FAMILY ${f}`); process.exit(2); }
const now = (p) => readFileSync(join(root, p), 'utf8');
const then = (p) => execFileSync('git', ['-C', root, 'show', `${BASE}:${p}`], { encoding: 'utf8' });
const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();
const toks = (t) => t.match(/\S+/g) ?? [];
const paras = (t) => t.split(/\n[ \t]*\n/).map(toks).filter((p) => p.length);
const N = 10;
let fail = 0;
const bad = (m) => { fail++; console.log(m); };
// The docs-writer sections docs-reviewer reads before it grades, after this branch.
const SECTIONS = ['## Entry-point hints are STARTING POINTS, not boundaries', '## Research methodology (apply every time)', '## Mode 1 — catalog',
  '### Write / update (`mode: update`)', '## Template — `doc_type: feature`', '## Template — `doc_type: concept`'];
const section = (text, h) => {
  const lines = text.split('\n'); const i = lines.indexOf(h); if (i < 0) return null;
  const lvl = h.match(/^#+/)[0].length; let j = i + 1; let fenced = false;
  for (; j < lines.length; j++) {
    if (/^[ \t]*```/.test(lines[j])) fenced = !fenced;
    else if (!fenced && /^#+ /.test(lines[j]) && lines[j].match(/^#+/)[0].length <= lvl) break;
  }
  return lines.slice(i, j).join('\n');
};
// 1. Words, and the files that must not change: the instructions, the samples and every other definition.
for (const f of CHECK) {
  const p = `plugin/agents/${f}`; const b = toks(then(p)).length; const a = toks(now(p)).length;
  console.log(`WORDS ${f} before=${b} after=${a} delta=${a - b}`);
  if (a >= b) bad(`WORDS-NOT-LOWER ${f}`);
}
if (CHECK.includes('docs-reviewer.md')) {
  const w = now('plugin/agents/docs-writer.md'); let sec = 0;
  for (const h of SECTIONS) { const s = section(w, h); if (s === null) bad(`SECTION-MISSING docs-writer.md: ${h}`); else sec += toks(s).length; }
  const b = toks(then('plugin/agents/docs-reviewer.md')).length + toks(then('plugin/agents/docs-writer.md')).length;
  const a = toks(now('plugin/agents/docs-reviewer.md')).length + sec;
  console.log(`UPFRONT docs-reviewer.md before=${b} after=${a} delta=${a - b} writer-sections=${sec}`);
  if (a >= b) bad('UPFRONT-NOT-LOWER docs-reviewer.md');
}
const reads = git('diff', '--name-only', BASE, '--', 'plugin/instructions', 'plugin/samples');
if (reads) bad(`READS-CHANGED ${reads.split('\n').join(' ')}`);
const others = git('diff', '--name-only', BASE, '--', 'plugin/agents').split('\n').filter((n) => n && !FAMILY.includes(n.replace(/^.*\//, '')));
if (others.length) bad(`OTHER-AGENT-CHANGED ${others.join(' ')}`);
// 2. Frozen text: a 10-word window (inside one paragraph) shared at BASE with an agent
//    definition outside the family, plus the words between two such runs in one sentence.
const listing = then('plugin/agents/').split('\n').filter((n) => n.endsWith('.md'));
const outside = listing.filter((n) => !FAMILY.includes(n));
const winSet = new Set();
for (const n of outside) for (const p of paras(then(`plugin/agents/${n}`))) for (let i = 0; i + N <= p.length; i++) winSet.add(p.slice(i, i + N).join(' '));
const endsSentence = (w, nx) => /[.?!](\*\*|\*|`|\)|")*$/.test(w) && nx !== undefined && /^[A-Z*`(\-|]/.test(nx);
for (const f of CHECK) {
  const cur = ' ' + toks(now(`plugin/agents/${f}`)).join(' ') + ' ';
  for (const p of paras(then(`plugin/agents/${f}`))) {
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
// 3. Structure that stays byte-for-byte: frontmatter, every heading line, every bold lead,
//    and every fenced block (the dispatch prompts and the two document templates).
const leadRe = /^\s*(?:(?:[-*]|\d+\.)\s+)?(\*\*[^*]+\*\*)/;
const fences = (t) => t.match(/^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*$/gm) ?? [];
for (const f of CHECK) {
  const b = then(`plugin/agents/${f}`); const a = now(`plugin/agents/${f}`);
  if (b.split('\n---\n')[0] !== a.split('\n---\n')[0]) bad(`FRONTMATTER ${f}`);
  const aLines = new Set(a.split('\n'));
  for (const line of b.split('\n')) if (/^#{1,6} /.test(line) && !aLines.has(line)) bad(`HEADING ${f}: ${line}`);
  for (const line of b.split('\n')) { const m = line.match(leadRe); if (m && !a.includes(m[1])) bad(`LEAD ${f}: ${m[1]}`); }
  for (const blk of fences(b)) if (!a.includes(blk)) bad(`FENCE ${f}: ${blk.split('\n').slice(1, 2).join('').trim().slice(0, 120)}`);
}
// 4. Wire literals, cited anchors and graded rules, each present at BASE and kept.
const LIT = {
  'docs-writer.md': [
    '**Skip this phase unless `phases.docs` is `true` in `harness.config.json`.**', 'return the disabled-phase block of `## Output contract`',
    'Every `output_path` you are handed sits under it', 'Three dispatch shapes reach you.',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` → `## Per-entry loop`, once per checklist entry',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/docs_phase_instructions.md` → `## Loop` step 1',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/docs_phase_instructions.md` → `## Loop` step 2 (per target) and step 3 (the INDEX)',
    '`<state_dir>/docs_catalog/reviews/<slug>/review_<i>.md`', 'its Must Fix items to the one document', 'do **not** re-research the feature from scratch',
    'do not disturb what the findings do not target', '`${CLAUDE_PLUGIN_ROOT}/agents/docs-reviewer.md` is the consumer of every document you write',
    'the two callers above read only your return block, never the document body', 'return a `blocker:` line naming the path and the refusal',
    'It is normally outside every `layers[].path` scope', 'they are NOT the list of files to document and NOT the scope ceiling.**', '*discover* the feature',
    '**where does this data come from, and what consumes it?**', 'including the catch-all `.` — **and** the backend source',
    '`feed surface → the feed use case → a "fetch feed" backend operation that returns items` is the **shallow** trace', 'Do this for every non-trivial feature.',
    '**symbol anchor**: `path` (`symbolName`)', 'name a short quoted code substring that is unique and greppable instead', '**verify it with a literal `grep` before writing it**',
    'Where neither exists, cite the **bare path**.',
    '**An exact line number must never be written into a document — in any shape: with a colon, with a tilde, in parentheses, as a bare range, as a `(line NNN)` word form, or as a slash-joined run of tails after a path**',
    '**Every path written into a document is repo-relative and resolves against `<repo_root>`**', 'in prose as much as in an anchor',
    '**When a line number is removed from beside a quote that already stood in the document, that quote becomes the anchor — grep-verify it in the same edit.**',
    'write `⚠️ unverified` with a one-line reason', 'as `reachable? ❌` (a deliberate scope cut vs. something simply not built yet — flag `⚠️ unverified` if unsure)',
    'search **every** layer path, including the catch-all `.`', 'a rich feature runs ~100–150 lines',
    'keep what is still true, correct what drifted, fold in named merge targets — the output supersedes the old file(s).',
    '**and no file added, removed, renamed, moved or split**', '**`targets: none`**', '**A rename / move / split / deletion is different: the `path` half of a symbol anchor does not self-heal.**',
    'with the reason `anchor path moved`', '**read the existing document, preserve what is still accurate, and fold in exactly what the diff changed**',
    'revise the affected sections + `Anchor files` + `Related`', '**except when a cited path was renamed, moved, split or deleted**',
    'Do **not** rewrite unaffected sections from scratch, and do not drop still-true content.', 'fill it from the conventions documents `<layer_path_map>` names, never from a remembered convention.',
    'Your final message IS your return value (not a human chat).', '`doc_path:` · `unverified:` (bullets or `none`) · `parity_gaps:`', '`notes:` (wrong/missing hints, template friction). Do not paste the document body.',
    '`action(new|update) · slug · output_path · reason · entry-hints`', 'return `targets: none` with the reason', 'omit `doc_path:` and `targets:` entirely'],
  'docs-reviewer.md': [
    '**You do not edit the document.**', 'return `verdict: PASS` followed by one line naming the disabled phase as the reason', 'check 7 does not apply — its absence is not a finding',
    'Two dispatch shapes reach you.', 'Write your findings to exactly the `findings_path` you were handed',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` → `## Per-entry loop`, step 2', '`${CLAUDE_PLUGIN_ROOT}/instructions/docs_phase_instructions.md` → `## Loop` step 2',
    'Returns `verdict:` + `findings_file:` + `summary:`.', 'Returns `verdict:` + `findings_file:` + `missed_docs:` + `summary:`.',
    '**Read `${CLAUDE_PLUGIN_ROOT}/agents/docs-writer.md` before you grade.**', 'return a `blocker:` line naming the path and the refusal **in place of** the verdict line',
    'It is normally outside every `layers[].path` scope', '## What to verify (accuracy first, then depth, then completeness)',
    '1. **Every cited anchor resolves — both halves**', '**The same resolution applies to a path written in prose rather than as an anchor, and from `<repo_root>`**',
    '2. **No exact line numbers**', 'Report the correction as the symbol anchor that should replace it.', "Detector: `grep -nE ':[0-9]+' <doc_path>`.",
    "`` grep -nE '~L?[0-9]{2,4}|\\([0-9]{2,4}\\)|`[0-9]{2,4}(-[0-9]{2,4})?`|[^0-9:~≈L.,/-][0-9]{2,4}-[0-9]{2,4}|≈ ?[0-9]{2,4}|\\b[Ll]ines? [0-9]{2,4}|/[0-9]{2,4}' <doc_path> ``",
    '**A coordinate need not carry a colon.**', '**classify every hit**, never "drive to zero"', '**values are not coordinates**',
    'The test is *"does removing it change a factual claim?"* — if yes it is a value, keep it.',
    '3. **Backend-surface claims are real**', '`reachable? ✅ / ❌` marker', 'Search **every** layer path, including the catch-all `.`', '4. **Data shapes are real**',
    'never from a shape this file assumes', '`## Technical implementation`', '5. **Gating / optimistic / sync-direction**', '6. **Research depth — did the writer go beyond the hints?**',
    '7. **`<parity_vocabulary>` parity**', '**Skipped entirely when `phases.parity` is `false`**', '8. **`⚠️ unverified` markers are honest**', '9. **No material omission**',
    '10. **Merge/supersede reflected** (mode `catalog`, only when `existing_doc` was passed)', '### Additional checks in `mode: update`', '11. **The update reflects the diff**',
    '12. **Preserved, not clobbered**', '13. **Ripple not missed**', 'Do NOT nitpick prose, wording, or heading style — this review is factual correctness, not editing.',
    '## Unsolicited dispatch guidance', '(disregarded for verdict purposes)', 'Write `findings_path` (each finding: the claim, the file that contradicts it, the correction). Return:',
    '`verdict:` `PASS` or `FAIL`.', 'a line coordinate check 2 does not classify as a value', '`findings_file:` the path you wrote.',
    '`missed_docs:` (update mode only) any other document the diff should have touched, or `none`.', '`summary:` one line.', 'omit `findings_file:` entirely', 'Do not paste the document back.'],
};
// Literals this branch adds: the reviewer's citation of each docs-writer section it reads.
const ADDED = { 'docs-reviewer.md': ['the only sections of it you read:', '`## Entry-point hints are STARTING POINTS, not boundaries`', '`## Research methodology (apply every time)`',
  '`## Mode 1 — catalog`', '`` ### Write / update (`mode: update`) ``', '`` ## Template — `doc_type: feature` ``', '`` ## Template — `doc_type: concept` ``'] };
for (const f of CHECK) for (const l of LIT[f]) {
  if (!then(`plugin/agents/${f}`).includes(l)) bad(`LITERAL-NOT-AT-BASE ${f}: ${l}`);
  else if (!now(`plugin/agents/${f}`).includes(l)) bad(`LITERAL ${f}: ${l}`);
}
for (const f of CHECK) for (const l of ADDED[f] ?? []) if (!now(`plugin/agents/${f}`).includes(l)) bad(`ADDED ${f}: ${l}`);
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
````

**Verification:**

- The probe's last line is `PASS` and it exits `0`. It printed two `WORDS` lines, one per definition, each with a negative `delta`, one `UPFRONT docs-reviewer.md` line with a negative `delta`, and no other line.
- Every `After — definition`, `After — up-front` and `Δ up-front` cell of `## Up-front word counts` is filled from that run, no `_Task 6_` placeholder is left, and every `Δ up-front` is below `0`.
- The scope register's derivation commands print no path that lacks a register row, and the branch diff outside `harness-runs/` holds only the two definitions.
- `git diff --name-only` lists only the story index as changed by this task.
- `git diff -- harness-runs/story_plans/chore_thin_prose_family_docs_story_plan.md` changes only those cells, plus at most one line under the table.
