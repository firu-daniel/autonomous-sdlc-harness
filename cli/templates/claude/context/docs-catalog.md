# Documentation catalog

> **Read this when:** you need a change's *surroundings* — what else touches the area, what it depends on — or, for an interactive test, how a screen is reached. **Skip when:** you already know the files the change touches. This catalog is an accelerator, never a prerequisite.

**Purpose.** How to use the maintained reference documents at the configured documentation root, and — the part that matters more — how far to trust them.

**What belongs here**

- Where the corpus lives, what its index file is called, and how its entries are organised.
- What each kind of document covers, and which kind answers which question.
- What is deliberately not documented, so nobody goes looking for it.

**Three rules the harness relies on, whatever the corpus looks like**

- **Read the index first, then open one document.** Grepping the corpus defeats the point of having an index and costs more context than the one document you were after.
- **The catalog is a map, not ground truth.** Where a document and the code disagree, the code wins: fix the document or report it stale, never reason from it.
- **A reviewer uses the catalog for navigation only** — never as evidence, never as a citation; a finding cites source. The adversarial reviewer is kept catalog-free entirely, so at least one reviewer's picture of a change comes from nothing but the change itself.

**One generic example — an index-first retrieval**

```
1. open <documentation root>/INDEX.md
2. find the entry for the area the change touches
3. open the one document it names — and stop there
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this project's own catalog guide; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
