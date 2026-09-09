# Tests

> **Read this when:** the change adds, moves or rewrites a test in this project's test tree, or changes behaviour that a test in it protects. **Skip when:** the change touches only production code that no test here reaches, or the machinery *around* testing — the runner's configuration, the CI job, the coverage tool.

**Purpose.** How this project's tests are organised, named and bounded, so a test lands where its subject's reader would look for it and a failure says what broke.

**What belongs here**

- How the tree maps onto the source — mirrored directory for directory, grouped by feature, or flat — and which of those a new test file follows.
- What a test file and a test case are each named, and the casing and suffix convention that goes with them.
- Which kinds of test live here and which live beside the source they cover, and how a reader tells at a glance which they are reading.
- What a test may reach for — shared fixtures, helpers, the real filesystem, the clock, the network — and which of those a reviewer refuses.
- Which change is not allowed to land without a test, and what counts as one for it.

**Rule that holds whatever the language is:** a test names the behaviour it protects, not the function it calls. A failing run is read by someone who did not write the test and may not know the code, so the name has to carry the claim — a failure should read as a sentence about the product, and a test whose name only repeats a file path leaves that reader with a search instead of an answer.

**One generic example**

```
tests/
  billing/                    # the tree mirrors the source: one directory per feature
    invoice.<ext>             # "an invoice past its due date is marked overdue"
    fixtures/                 # shared inputs live beside the tests that use them
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own tests, or replace everything above with this project's own rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
