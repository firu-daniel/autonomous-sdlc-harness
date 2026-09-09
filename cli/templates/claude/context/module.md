# Source module

> **Read this when:** the change touches this project's own source — the one directory its code lives in, whatever the file inside it happens to be. **Skip when:** the change is to something that sits *around* the source: build configuration, dependency manifests, CI, or documentation that names no symbol.

**Purpose.** How the one directory this project's source lives in is organised, so a change lands where a reader would look for it rather than where it was easiest to add.

**What belongs here**

- How the directory is divided — by feature, by technical role, or not at all — and which of those a new file follows.
- Where a new responsibility goes when it fits no existing file, and who decides when the answer is "a new directory".
- The naming rules a file, a type and a public function each follow, and the casing convention that goes with them.
- What may be imported from where: which direction dependencies run between sub-directories, and which import a reviewer refuses.
- Where the tests for this source live, what they are named, and which change is not allowed to land without one.

**Rule that holds whatever the language is:** the layout is the navigation. A reader who knows the rule finds the code without a search, and a file placed against it costs every later reader that search — so where a change goes is part of the change, not a detail settled afterwards.

**One generic example**

```
src/
  billing/            # a feature owns its own directory: its types, its logic, its tests
    invoice.<ext>
    invoice.test.<ext>
  shared/             # imported by features, importing none of them — the direction is one-way
    money.<ext>
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this project's own rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
