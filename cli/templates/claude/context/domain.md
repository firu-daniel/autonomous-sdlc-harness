# Domain layer

> **Read this when:** the change encodes a rule the business would recognise — what a concept *is*, when an action is permitted, what a value has to satisfy to be valid. **Skip when:** the change is about how data crosses the process boundary or how it is shown; both have their own files.

**Purpose.** Where this project's rules live, what they are allowed to know about, and what must never reach them.

**What belongs here**

- The types that model this project's own concepts, named as the business names them and independent of any wire shape or any screen.
- Where a rule is written — and the standing rule that each one is written **once**, in the place that owns it.
- The unit of work a caller invokes to apply a rule: how it is named, what it takes, and what it hands back on the failure path.
- The mapping between a wire type and a domain type: which side owns it, and which direction it is allowed to run in.

**Rule that holds whatever the stack is:** every rule here is exercisable with no network, no database, no filesystem and no screen. If a rule cannot be tested without one of those, it has absorbed something belonging to another layer — and the same rule restated in a screen or in a request mapper is a defect even when the observable behaviour is right, because the next surface that needs it copies the nearest expression rather than the authoritative one.

**One generic example**

```
// A rule stated once, over this project's own types, decided in one place.
canPublish(draft: Draft, author: Author): PublishDecision

// Not here: how the draft was loaded, how the decision is rendered, which
// control was pressed — three concerns that each belong to another layer.
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this project's own domain rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
