# Shared application state

> **Read this when:** the change reads or writes state that outlives one screen — who is signed in, the active locale or theme, a list two screens both render, anything several screens must agree about. **Skip when:** the state belongs to a single screen. Keep it there; promoting it here is a decision, not a convenience.

**Purpose.** Which slices of shared state this project has, what each one is sourced from, and how feature code is allowed to touch them.

**What belongs here**

- One entry per slice: what it holds, and what **outside** the store is its source of truth.
- The listener that mirrors that source into the store, and where it is mounted.
- The selectors feature code reads through — one per value it needs.
- What refreshes each slice, and when.

**Rule that holds whatever the state library is:** the source of truth lives outside the store, a listener mirrors it in, and feature code reads through selectors and never dispatches the setters. A setter dispatched from a feature leaves the store disagreeing with its own source until the next mirror, and the screen that reads it next cannot tell which of the two it is looking at. A task that touches these slices reads this file before it starts.

**One generic example**

```
sessionSlice
  source of truth : the session key in local storage
  listener        : mounted once at start-up; mirrors that key into the store
  selectors       : selectCurrentUser, selectIsSignedIn
  refreshed by    : sign-in, sign-out, token renewal
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this project's own shared-state rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
