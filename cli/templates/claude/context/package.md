# Published package

> **Read this when:** the change touches the code this project distributes — what it exports, how its modules are laid out, which inputs it accepts, which runtimes it supports. **Skip when:** the change is to something shipped *around* the package rather than in it: an example, the documentation site, the release pipeline.

**Purpose.** What this package promises whoever installs it, and what it therefore may not change quietly.

**What belongs here**

- The public surface: which names are exported, from which module, and how a caller is expected to import them.
- What is deliberately internal, and how a reader tells the two apart without opening a second file.
- The dependency policy: what may be added at all, what has to stay optional, and who decides.
- The supported runtime versions, and what this project counts as a breaking change to a published name.
- What every public name carries with it — the documented behaviour and the test that pins it — so a caller reads the contract rather than the implementation.

**Rule that holds whatever the language is:** the public surface *is* the contract, so changing it is a versioning decision rather than a refactor. Renaming an export, narrowing an accepted input or altering a returned shape breaks callers who will never read the change — they will read the version number. An internal rearrangement that leaves every exported name behaving as documented is free; anything else is a release note.

**One generic example**

```
// Exported, and therefore promised: named, documented, tested, versioned.
export { createClient, type ClientOptions } from './client'

// Not exported: reachable only from inside the package, free to change in
// any release, and never referenced in an example or the documentation.
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this package's own rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
