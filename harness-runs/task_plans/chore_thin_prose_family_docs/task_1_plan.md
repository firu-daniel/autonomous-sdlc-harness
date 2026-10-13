### Task 1 — Thin `docs-writer`'s intro, disabled-phase gate, fix round, `## Project layout` and entry-point hints, and write the family check probe

**Goal:** Cut the top of `plugin/agents/docs-writer.md` — the intro, the disabled-phase gate, the `**Fix round.**` paragraph, `## Project layout` and the body of `## Entry-point hints are STARTING POINTS, not boundaries` — to direct rules stated once. Then write and run the read-only family check probe that Tasks 2–5 use and Task 6 runs as the branch's authority.

**Where this task stops.** It changes only the text from the line after the frontmatter down to the end of `## Entry-point hints are STARTING POINTS, not boundaries`, the paragraph before `## Research methodology (apply every time)`. It does not touch:
- the frontmatter or `## Resolved values` (frozen; no task edits them);
- any fenced dispatch block of `## Invocation contract`;
- `## Research methodology (apply every time)` (Task 2), or anything from `## Mode 1 — catalog` down (Task 3);
- `plugin/agents/docs-reviewer.md` (Tasks 4 and 5) or any other file under `plugin/`.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `25e2382a` — sometimes only part of a line — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the D-number.

**Frozen text in this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- in the disabled-phase paragraph, the runs ``is `true` in `harness.config.json`.** With the phase off the project`` and `A dispatch that arrives anyway is a caller bug, not a licence to improvise —` (D2 keeps both);
- the `## Invocation contract` sentence `**The argument names and the return field names below are the wire between you and the flows that dispatch you — a renamed field silently breaks the caller's parse**, so do not decorate, translate or reorder them.`;
- the whole paragraph opening `**A cited path you cannot read is a finding, not a fallback.**`;
- the three fenced dispatch blocks, byte for byte.

These bold leads stay, worded as they are: `**Mode 1 — catalog:**`, `**Mode 2 — post-implementation:**`, ``**Skip this phase unless `phases.docs` is `true` in `harness.config.json`.**``, ``**Catalog (`mode: catalog`)**``, ``**Survey (`mode: survey`)**``, ``**Write / update (`mode: update`)**``, `**Fix round.**`, `**A cited path you cannot read is a finding, not a fallback.**`, `**The application (the SUBJECT)**`, `**Backend / server-side source**` and `**The reference implementation**`. Every heading line stays; `## Entry-point hints are STARTING POINTS, not boundaries` is one of the six headings `docs-reviewer` will cite after Task 4.

### Targets

- `plugin/agents/docs-writer.md` → the intro, the disabled-phase paragraph, the `**Fix round.**` paragraph of `## Invocation contract`, `## Project layout` and the body of `## Entry-point hints are STARTING POINTS, not boundaries`.
- `harness-runs/scratch/docs_family_check.mjs` (new): a gitignored probe, never committed.

**Work:**

- [ ] **Intro and disabled-phase gate.** Apply D1 and D2.
  - The role sentence loses *"durable"* and its rationale sentence about who reads the output (D1). The two-mode list below it stays as it is.
  - The gate keeps its trigger, the frozen runs and the instruction (research nothing, write no files, return the disabled-phase block). It drops the description of what does not exist, the parenthetical restating `## Output contract`'s disabled-phase line, and the no-op rationale (D2). `## Output contract` → `**docs phase disabled:**` remains the one statement of that return shape.
- [ ] **`## Invocation contract`.** Apply D3.
  - The `**Fix round.**` paragraph keeps the same-fields-plus-`findings_file` re-dispatch, the findings path, *"its Must Fix items to the one document"*, the no-re-research rule and the do-not-disturb rule. It drops the caller-cap sentence, which the writer does not act on.
  - Leave the consumer line (`` `${CLAUDE_PLUGIN_ROOT}/agents/docs-reviewer.md` is the consumer … never the document body. ``) and the blocker paragraph unchanged.
- [ ] **`## Project layout` and the entry-point hints.** Apply D4–D8.
  - The application bullet points at `<layer_path_map>` (D4). That `layers[].path` is repo-relative and resolves against `<repo_root>`, not under `<app_dir>`, is stated once, in `## Resolved values` → the `<repo_root>` / `<app_dir>` row.
  - The backend bullet keeps *"normally outside every `layers[].path` scope"* and loses its rationale (D5); the reference bullet keeps the parity-off consequence (D6).
  - The closing `<repo_root>` paragraph goes (D7); the `<repo_root>` / `<app_dir>` row of `## Resolved values` states the same derivation.
  - The hints paragraph keeps the hint list, the bold *NOT the list … NOT the scope ceiling* rule and *discover the feature*, in fewer words (D8). `docs-reviewer` check 6 grades this rule.
- [ ] **Write and run the probe.** Write `harness-runs/scratch/docs_family_check.mjs` with exactly the text under `### Probe` below. Then run `bash scripts/scratch-run.sh harness-runs/scratch/docs_family_check.mjs plugin/agents/docs-writer.md` as one plain foreground command. Leave the file in place; it is gitignored, and later tasks run it.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - Accuracy beats completeness beats prose; one page per dispatch, researched from the real code.
  - With `phases.docs` off: research nothing, write no files, return the disabled-phase block — and `## Output contract` still says `notes:` with the reason and no `doc_path:` / `targets:`.
  - The three dispatch shapes and their caller citations; the fix round's same fields plus `findings_file`, its path, Must Fix items to the one document, no re-research, nothing outside the findings disturbed.
  - The reviewer is the consumer; the callers read only the return block. The unreadable-path `blocker:` rule, unchanged.
  - The application's layout comes from `<layer_path_map>`; the backend is found from configuration and calls, normally outside every layer path; the reference implementation exists only with parity on, and with it off no document carries a parity section.
  - Hints seed research and are neither the file list nor the scope ceiling; a document covering only the handed files fails.

### Replacements

**D1** — `plugin/agents/docs-writer.md`: replace

```text
You are the **Docs Writer**. You are a **researcher first, writer second**: you produce one durable documentation page per dispatch by *reading the real code*, following the data where it leads. The output is what a developer or AI agent who has never seen the code relies on, so accuracy beats completeness beats prose.
```

with

```text
You are the **Docs Writer**, a **researcher first, writer second**: you write one documentation page per dispatch by *reading the real code* and following the data where it leads. Accuracy beats completeness beats prose.
```

**D2** — `plugin/agents/docs-writer.md`: replace

```text
With the phase off the project keeps no documentation corpus: `<docs_root>` does not exist, there is nothing to write into, and no `docs-reviewer` downstream to review it. A dispatch that arrives anyway is a caller bug, not a licence to improvise — research nothing, write **no** files, and return the disabled-phase block of `## Output contract` (a `notes:` line naming the disabled phase, and no `doc_path:` / no `targets:`). Returning a clean no-op keeps a stray dispatch from leaving a half-researched page in a corpus the project never opted into.
```

with

```text
With the phase off the project keeps no documentation corpus. A dispatch that arrives anyway is a caller bug, not a licence to improvise — research nothing, write **no** files, and return the disabled-phase block of `## Output contract`.
```

**D3** — `plugin/agents/docs-writer.md`: replace

```text
On a `docs-reviewer` `FAIL` either caller re-dispatches you with the **same** fields plus that reviewer's `findings_file` — `<state_dir>/docs_catalog/reviews/<slug>/review_<i>.md`. Read it and apply its Must Fix items to the one document; do **not** re-research the feature from scratch and do not disturb what the findings do not target. The fix loop is capped by the caller, not by you.
```

with

```text
On a `docs-reviewer` `FAIL` you are re-dispatched with the **same** fields plus that reviewer's `findings_file` — `<state_dir>/docs_catalog/reviews/<slug>/review_<i>.md`. Apply its Must Fix items to the one document; do **not** re-research the feature from scratch, and do not disturb what the findings do not target.
```

**D4** — `plugin/agents/docs-writer.md`: replace

```text
— its own source tree sits at `<repo_root>/<app_dir>`. Its structure is the configured one: each `layers[]` entry's `path` is the directory that layer's source lives in — **repo-relative**, resolved against `<repo_root>` rather than nested under `<app_dir>` — and its `conventions` document says what belongs there. Take both from `<layer_path_map>` rather than assuming a directory shape.
```

with

```text
— its source tree sits at `<repo_root>/<app_dir>`, laid out as `<layer_path_map>` configures it; never assume a directory shape.
```

**D5** — `plugin/agents/docs-writer.md`: replace

```text
— wherever the project keeps it; find it from the configuration and from the calls the application makes, not from a remembered convention. It is normally outside every `layers[].path` scope, which is why a purely application-side trace misses half the story.
```

with

```text
— find it from the configuration and from the calls the application makes, not from a remembered convention. It is normally outside every `layers[].path` scope.
```

**D6** — `plugin/agents/docs-writer.md`: replace

```text
— `<reference_impl>`, when `phases.parity` is `true`. **It may not exist at all**: with the phase off there is no reference implementation, and no document you write carries a parity section.
```

with

```text
— `<reference_impl>`, only when `phases.parity` is `true`; with the phase off no document you write carries a parity section.
```

**D7** — `plugin/agents/docs-writer.md`: delete this paragraph, together with the one blank line after it

```text
Resolve `<repo_root>` with a **bare** `git rev-parse --show-toplevel` and build absolute paths from it — you may be running in a worktree, and a relative path resolves against the wrong checkout.
```

**D8** — `plugin/agents/docs-writer.md`: replace

```text
The orchestrator gives you a small set of hints — typically a use-case group, a surface, the feature's backend stored-data sets, and (when `phases.parity` is `true`) a `<reference_impl>` pointer. **These seed your research; they are NOT the list of files to document and NOT the scope ceiling.** A good feature document almost always reaches well beyond the hints. If you only document the files you were handed, you have failed — you must *discover* the feature.
```

with

```text
The hints — typically a use-case group, a surface, the feature's backend stored-data sets and, when `phases.parity` is `true`, a `<reference_impl>` pointer — **seed your research; they are NOT the list of files to document and NOT the scope ceiling.** A document that covers only the files you were handed fails: *discover* the feature.
```

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

- The probe run above prints a `WORDS docs-writer.md` line with a negative `delta`, and its last line is `PASS`. It prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e 'half the story' -e 'Returning a clean no-op' -e 'capped by the caller' -e 'almost always reaches well beyond' -e 'a relative path resolves against the wrong checkout' -- plugin/agents/docs-writer.md` prints nothing.
- `git grep -n -F -e 'laid out as `<layer_path_map>` configures it' -- plugin/agents/docs-writer.md` prints the one application bullet under `## Project layout`.
- `git diff -- plugin/agents/docs-writer.md` shows hunks only above the `## Research methodology (apply every time)` heading, none inside `## Resolved values` and none inside a fenced block.
