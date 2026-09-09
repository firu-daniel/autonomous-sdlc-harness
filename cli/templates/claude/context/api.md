# Request-handling layer

> **Read this when:** the change is about an endpoint this project serves — its route, its request and response shapes, its status codes, its authentication or its validation. **Skip when:** the change is a rule that would hold however it was invoked; that belongs to the layer owning the rules.

**Purpose.** What every endpoint here does before it does anything else, and how thin a handler is required to stay.

**What belongs here**

- How a route is declared and registered, which file it lives in and how that file is named.
- The validation step every handler runs before it touches anything else, and where the request shape it validates against is declared.
- Authentication and authorisation: where each check is made, and what a caller who fails one gets back.
- The response contract — the success shape, the error shape, and which status code carries which outcome — so two endpoints do not report the same failure two ways.
- What counts as a breaking change to a published endpoint, and how a compatible one is introduced.

**Rule that holds whatever the framework is:** a handler validates, delegates and formats — nothing else. A rule written inside a handler is unreachable from every other entry point this project has, so the scheduled job, the administrative tool and the next endpoint each grow their own copy of it, and the copies disagree before anyone notices there are several.

**One generic example**

```
POST /orders
  1. validate the request against the declared shape — refuse before anything else runs
  2. authorise this caller for this action
  3. delegate to one unit of work in the layer that owns the rules
  4. map its result onto the response shape and the status code
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this project's own request-handling rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
