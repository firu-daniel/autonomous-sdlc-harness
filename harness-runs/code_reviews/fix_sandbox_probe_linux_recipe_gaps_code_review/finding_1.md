### 1. The judge test's header restates PD23's evidence decision that `docs/sandbox-verification.md` §5 PD23 owns, and its reflow left one over-long line

**File:** `cli/test/sandbox-probe-judge.test.mjs` (the opening module comment) — "Each of the three shapes was checked against the evidence and kept"

Task 1 added this sentence to the test file's header:

> Each of the three shapes was checked against the evidence and kept: AP5 (2026-10-31) still reads the non-trio placeholders, and present read-only binds still refuse a rename; no shape the current code can no longer produce is held here.

That is the PD23 evidence check, and Task 3 records it in full in `docs/sandbox-verification.md` §5, row PD23 ("Fixed by `fix_sandbox_probe_linux_recipe_gaps`, which checked the table against the evidence. … each is kept."). The header already cites that row ("from PD23 (docs/sandbox-verification.md §5)"). The restatement gives one dated decision two owners. It is also a claim about the evidence that goes stale with no signal: when a later run or a later F9 change retires a shape, the PD23 row is the record that gets updated, and nothing makes anyone update this comment. A test header states the rule the test enforces (`.claude/context/conventions.md` → `## The testing bar`, "A test file opens with the rule it exists to enforce"). It does not hold the evidence behind a decision of record. No reader of the test needs the sentence: someone deciding whether to drop a shape reads the PD23 row, which the header already points to. Under the prose-volume rule this is padding, and padding is a Should Fix.

The same edit left the reflowed paragraph with one line well past the comment's wrap width: "`unrecognised`), never `fail`. The `unrecognised` cases use `Input/output error`, which no layer-table arm matches; they".

**Fix:** in the header comment, replace these lines:

```
 * are `Permission denied` and `Device or resource busy` — the latter also matching PD23's third
 * recorded shape, `inter-device move failed: … unable to remove target: Device or resource busy`,
 * which has its own fixture. Each of the three shapes was checked against the evidence and kept:
 * AP5 (2026-10-31) still reads the non-trio placeholders, and present read-only binds still refuse
 * a rename; no shape the current code can no longer produce is held here. On Linux, an error result
 * carrying no refusal string, judged against an expected `sandbox` or `network`, is `not run` (layer
 * `unrecognised`), never `fail`. The `unrecognised` cases use `Input/output error`, which no layer-table arm matches; they
 * used `Device or resource busy` until PD23 made it a refusal. Each Linux case has a twin with no
```

with:

```
 * are `Permission denied` and `Device or resource busy` — the latter also matching PD23's third
 * recorded shape, `inter-device move failed: … unable to remove target: Device or resource busy`,
 * which has its own fixture; that row records why each shape is kept. On Linux, an error result
 * carrying no refusal string, judged against an expected `sandbox` or `network`, is `not run` (layer
 * `unrecognised`), never `fail`. The `unrecognised` cases use `Input/output error`, which no
 * layer-table arm matches; they used `Device or resource busy` until PD23 made it a refusal. Each
 * Linux case has a twin with no
```

The next existing line, "platform holding the macOS verdict. No case launches", stays as it is. If you would rather not leave a short line, reflow the rest of that paragraph to the same width. Change no other line and no test case.

This edits a comment only. The one test this fix may run is the file it edits, as one plain foreground command from the repository root: `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs`.
