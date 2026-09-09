# Local storage

> **Read this when:** the change reads or writes data that stays on the machine the project runs on — session material, a cached token, a preference that survives a restart. **Skip when:** the value is fetched from the backend on every read (that is the data layer), or is only shared between screens in memory (that is shared application state).

**Purpose.** How this project persists data locally, how a reader is told that a stored value changed, and what may never be written in the clear.

**What belongs here**

- The storage client every read and write goes through, and where it is defined.
- The key namespace: what a key is called, which file holds the constants, and what each key stores.
- How a reader observes a change rather than polling for it, and where that subscription is mounted and torn down.
- What must be encrypted before it is written, and what must never be persisted at all.

**Rule that holds whatever the storage is:** address a stored value through a named key constant, never an inline string literal. An inline key cannot be renamed safely, cannot be found by a reference search, and quietly becomes a second key the moment one of its two spellings is edited.

**One generic example**

```
// One declaration per stored value, in the key namespace.
STORAGE_KEYS.sessionToken

storage.write(STORAGE_KEYS.sessionToken, value)
storage.read(STORAGE_KEYS.sessionToken)
storage.observe(STORAGE_KEYS.sessionToken, onChange)   // never a poll loop
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this project's own local-storage rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
