### 1. The jq-floor guard misses jq 1.7's third relaxed syntax class, a `.` before `[` (`.a.["b"]`, `.a.[]`), while its rule sentence and Gate 4's paragraph present its list as complete

**Files:**
- `cli/test/jq-floor.test.mjs` → `scan`, `MUST_FLAG`, `MUST_PASS`, and the header block — "The rule this suite exists to enforce: no shipped `.jq` program uses the syntax jq 1.7 relaxed" and "jq 1.7 relaxed both"
- `docs/development.md` → `## 5. Verifying a change` → Gate 4 → **The suite under jq 1.6, by hand.** — "which checks those two relaxed syntax classes"

**Problem.** jq 1.7 relaxed three parser rules that jq 1.5 and 1.6 enforce, not two. The third is a `.` between a term and a bracket suffix. jq 1.7's release notes list it twice: *"Allow dot between chained indexes when using `.["index"]`"* (jq #1168, example `.a.["b"]`) and *"Allow dot for chained value iterator `.[]`, `.[]?`"* (jq #2650, example `.a.[]`). jq 1.6's grammar has `Term '[' Exp ']'` and `Term FIELD`, but no `Term '.' '['`. So `.a.["b"]`, `.a.[]`, `.[0].[1]`, `$x.[0]`, `(.a).[0]` and `.a?.[0]` are each a syntax error that rejects the whole program on Debian 12's and Ubuntu 22.04's jq. A 1.7+ host (macOS, Homebrew) accepts all of them. This is the same failure mode as the `$label` defect this branch fixes.

`scan` checks only keyword tokens (`if (!KEYWORDS.has(token.text)) return;` is its first statement), so it never looks at `[`. Its claimed coverage is still complete:

- The rule sentence reads *"no shipped `.jq` program uses the syntax jq 1.7 relaxed and jq 1.5 and 1.6 reject — a jq keyword as a `$` variable, a `.` field or an object key, or an `if` with no `else`"*, and the next paragraph says *"jq 1.7 relaxed both"*.
- Gate 4's paragraph says the guard *"checks those two relaxed syntax classes … and nothing more: it does not cover builtins newer than 1.5, or the jq programs embedded in shell assets"*. That not-covered list is the one a maintainer reads to decide what the by-hand jq 1.6 run still has to catch, and it omits this class.

**Why it is reachable.** Neither shipped program uses the form today: a grep of both `cli/templates/scripts/lib/*.jq` for `[]a-zA-Z0-9_)?]\.\[` finds nothing. The next edit to either program can add it, though. `.a.[]` is the spelling jq 1.7's own manual now shows, and the guard would pass that edit green. Gate 4 would also pass on any macOS or jq 1.7 host. On a jq 1.6 host the analytics would then fail quietly again, as the task prompt's *"Why it matters"* describes (the watcher logs `run analytics: '<branch>' not recorded (exit 1)`). The task prompt asks that the floor be *"enforced rather than assumed"*, and this class is still assumed.

**Fix.** Add the check to the scanner, prove it with self-check cases, and name the class in the two places that list what the guard covers. Change nothing else.

1. In `cli/test/jq-floor.test.mjs` → `scan`, insert this block as the first statement inside `tokens.forEach((token, index) => {`, before `if (!KEYWORDS.has(token.text)) return;`:

   ```js
       if (token.text === '[') {
         const dot = tokens[index - 1];
         const before = tokens[index - 2];
         if (dot?.text === '.' && dot.end === token.start && before && before.end === dot.start
             && (before.text === ']' || before.text === ')' || before.text === '?'
                 || (/^[A-Za-z_]/.test(before.text) && !KEYWORDS.has(before.text)))) {
           findings.push({ line: token.line, construct: '`.` before `[` (`.a.[…]`, `.a.[]`)' });
         }
         return;
       }
   ```

   This flags a `[` only when a `.` sits directly against it and that `.` sits directly against the end of a term: an identifier, `]`, `)` or `?`. A free-standing `.[0]` and `| .[0]` are not flagged, and neither is `[.[0]]`, `(.[0])` or `reduce .[] as $x`, because the token before the `.` is an operator, a bracket that opens, or separated by whitespace. String text and comments are already dropped by `lex`, so `"x.[0]"` is not flagged either.

2. In the same file, append to `MUST_FLAG`:

   ```js
     '.a.["b"]',
     '.a.[]',
     '.[0].[1]',
     '$x.[0]',
     '(.a).[0]',
     '.a?.[0]',
   ```

   and append to `MUST_PASS`:

   ```js
     '.[0]',
     '.a[0]',
     '.a[]?',
     '.a | .[0]',
     '[.[0]]',
     'reduce .[] as $x (0; . + $x)',
     '"x.[0]"',
   ```

3. In the same file's header block, replace:

   ```js
    * The rule this suite exists to enforce: no shipped `.jq` program uses the syntax jq 1.7 relaxed
    * and jq 1.5 and 1.6 reject — a jq keyword as a `$` variable, a `.` field or an object key, or an
    * `if` with no `else`. It reads the source; it does not show that a program parses on any jq.
    *
    * jq 1.7 relaxed both, so a 1.7+ host runs a program that Debian 12's jq 1.6 rejects whole. The
   ```

   with:

   ```js
    * The rule this suite exists to enforce: no shipped `.jq` program uses the syntax jq 1.7 relaxed
    * and jq 1.5 and 1.6 reject — a jq keyword as a `$` variable, a `.` field or an object key, an
    * `if` with no `else`, or a `.` between a term and `[` (`.a.["b"]`, `.a.[]`). It reads the source;
    * it does not show that a program parses on any jq.
    *
    * jq 1.7 relaxed all three, so a 1.7+ host runs a program that Debian 12's jq 1.6 rejects whole. The
   ```

4. In `docs/development.md` → Gate 4 → **The suite under jq 1.6, by hand.**, replace:

   > which checks those two relaxed syntax classes — a keyword used as a `$` variable, a `.` field or an object key, and an `if` without an `else` — in the shipped `.jq` programs

   with:

   > which checks the syntax classes jq 1.7 relaxed — a keyword used as a `$` variable, a `.` field or an object key, an `if` without an `else`, and a `.` between a term and `[` (`.a.["b"]`, `.a.[]`) — in the shipped `.jq` programs

**Verify** with this file's own run, the only test this fix runs: `npm test --workspace cli -- test/jq-floor.test.mjs`. Each new `MUST_FLAG` and `MUST_PASS` case shows up as its own `self-check:` line. The final case must still pass over both shipped programs, because neither one contains the form.
