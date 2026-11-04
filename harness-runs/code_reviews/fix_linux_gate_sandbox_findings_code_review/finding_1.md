### 1. `check-machine-paths.test.mjs`'s header cites a case `(d)` that the suite does not have

**File:** `cli/test/check-machine-paths.test.mjs` (the module header comment) — "(d)'s `grep` stub stands in for it"

The suite's header says what is deliberately not covered and names what stands in for it:

```
 * Deliberately not covered: a real `nodev` mount, which no suite can make without privilege. Case
 * (d)'s `grep` stub stands in for it, emitting the error lines a `nodev` placeholder produces in
 * front of the real `grep`'s output.
```

The suite has no case labelled `(d)`. Its cases are `(a) …`, `(b) …`, `(c) …`, `F11: a Permission denied line on a character device is dropped, any other grep error is printed` and `(e) …`. The `grep` stub lives in the `F11: …` case. A reader who wants the stand-in for the `nodev` mount, which is the one place the dropped-error rule is exercised, searches for `(d)` and finds nothing. The case title cannot be renamed to fix this: `docs/sandbox-verification.md` §5 row F11 cites it verbatim as `cli/test/check-machine-paths.test.mjs` → `F11: a Permission denied line on a character device is dropped, any other grep error is printed`. Fix the header instead.

**Fix:** in the header comment of `cli/test/check-machine-paths.test.mjs`, replace

```
 * Deliberately not covered: a real `nodev` mount, which no suite can make without privilege. Case
 * (d)'s `grep` stub stands in for it, emitting the error lines a `nodev` placeholder produces in
 * front of the real `grep`'s output.
```

with

```
 * Deliberately not covered: a real `nodev` mount, which no suite can make without privilege. The
 * `F11: …` case's `grep` stub stands in for it, emitting the error lines a `nodev` placeholder
 * produces in front of the real `grep`'s output.
```

Change no case title. This edits a test file, so that file is the only test this fix runs: `npm test --workspace cli -- test/check-machine-paths.test.mjs`. The full suite runs later, in the Run gates phase.
