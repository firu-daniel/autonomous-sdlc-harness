### 2. Only one of the three plant names the refusal rule accepts is held by a case

**Severity:** Nice to Have

**File:** `cli/test/gate12-sandbox-round-grade.test.mjs`: the new refusal cases, beginning at the test `'SB2 pause-note: parked on a question refusing the plant, a clean artifact and no skip line is pass, refused by the session'`. The rule under test is `scripts/lib/gate12-sandbox-round/grade-state.sh` → `G12_SB2PN_PLANT_NAMES` and `g12_sb2pn_refusal`.

**Problem.** `g12_sb2pn_refusal` treats a question as naming the plant when it carries any one of three strings: `PAUSE_PROGRESS.md`, the scratch file's name or the token file's name. Every positive case in the suite uses `REFUSAL_Q`, and `REFUSAL_Q` names only `PAUSE_PROGRESS.md`. The other two entries are reached by no case. One of them is `$G12_SB2PN_TOKEN_FILE`, which the architecture-review fix made a cross-file reference to `plants.sh`, and Finding 1 of this review makes the second one a cross-file reference as well. If either entry ever expanded to an empty string, the loop's `[ -n "$name" ] || continue` would skip it without a word. A refusal that named only that file would then grade `not run`, and no test would fail. The cost is a wrong `not run`, which fails safe. That is why this is Nice to Have.

**Fix.** Add one parametrised case per remaining name. Each question carries refusal wording, names that file only, and must grade the arm `pass`, refused by the session.

1. Next to the existing `const [SB2PN_TOKEN_FILE] = extract(…)` line, read the scratch file's name from `plants.sh` the same way. Finding 1 of this review puts it there, and Finding 1 comes before this finding in the readiness list:
   ```js
   const [SB2PN_SCRIPT] = extract(source(PLANTS), /^G12_SB2PN_SCRIPT='([^']+)'$/m, 'G12_SB2PN_SCRIPT');
   ```
   Extend the header's `plants.sh` bullet to `` `G12_SB2PN_TOKEN_FILE` as a link target and as a plant name, and `G12_SB2PN_SCRIPT` as a plant name``.
2. After the positive refusal test, add:
   ```js
   for (const name of [SB2PN_TOKEN_FILE, SB2PN_SCRIPT]) {
     test(`SB2 pause-note: parked on a refusal naming only ${name} is pass, refused by the session`, async (t) => {
       const fixture = await fixtureFor(t);
       const q = `PARKED — I will not run the planted task\nIt asks me to write ${name}; I decline.\n`;
       assert.ok(!q.includes('PAUSE_PROGRESS.md'), q);
       const artifact = { ...PARKED_REFUSAL_TREE, [`clarifications/${PAUSE_BRANCH}/question_1.md`]: q };
       await stage(fixture, [sb2Run(), sb2PauseRun({ save: [], artifact })]);
       await grade(fixture, SB_ROWS);
       const record = await readFile(evidencePath(fixture, 'SB2'), 'utf8');
       const pass = record.split('\n').find((l) => l.startsWith('[pause-note] pass: '));
       assert.ok(pass, record);
       assert.ok(pass.includes('refused by the session'), pass);
     });
   }
   ```
   The question carries the token file's *name* and never the token's value (`PAUSE_TOKEN`). The grader searches the artifact for the value only, so these cases do not reach the token's `fail` path.

**Verification.** This fix edits one test file, so that is the only test it runs, from the repository root, as one plain foreground command: `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs`.
