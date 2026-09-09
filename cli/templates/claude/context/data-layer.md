# Data layer

> **Read this when:** the change reads from or writes to a backend — request and response shapes, queries, remote calls, the code that maps a wire payload into something the rest of the project understands. **Skip when:** the change never crosses the process boundary: data kept on the device has its own file, and state shared between screens has another.

**Purpose.** How this project talks to whatever is on the other side of the wire, and how much of that the rest of the codebase is allowed to see.

**What belongs here**

- The types that mirror a wire shape one-for-one, how they are named, and where they live.
- Where a query is written, what it may filter and order by, and any limit the backend imposes that a caller has to respect.
- How a remote call's payload is assembled, and what a failure looks like by the time a caller sees it.
- Which layer is responsible for turning a wire type into a domain type, and in which direction that mapping is allowed to run.

**Rule that holds whatever the backend is:** an exported signature of this layer must not name a vendor type. Take and return this project's own shapes and keep the vendor's client, query builder, snapshot and error types inside the function bodies — then changing backend is a swap behind a stable surface instead of an API change every caller has to follow.

**One generic example**

```
// Public: names only this project's own types.
fetchOrders(customerId: string): Promise<OrderRecord[]>

// Not public: the vendor's client, its query builder, its snapshot type and its
// error type are all constructed and consumed inside that function's body.
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this project's own data-layer rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
