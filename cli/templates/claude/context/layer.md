# The `{{layerName}}` layer

> **Read this when:** the change you are implementing or reviewing lands in the `{{layerName}}` layer — the directory `harness.config.json` gives that name. **Skip when:** it lands in another layer; each one has its own file, and the rules that span all of them live in the cross-layer conventions document.

**Purpose.** The rules this layer's implementer and its reviewer both read before they start. A task is assigned to exactly one layer, so whatever is written here is what that task is held to and the only layer document that task loads.

**What belongs here**

- What this layer is responsible for and — just as usefully — what it is not, so a task that has drifted into it is recognisable.
- What it may depend on, and which direction a dependency between layers is allowed to point.
- Naming and file-layout rules that apply inside it.
- What "done" means here: the tests to write, the checks to run, the bar a review holds the change to.

**One generic example — the shape a rule takes here**

> A file in this layer may import from the layers beneath it and never from the ones above it. A dependency pointing upwards is a defect even when it compiles, because it makes this layer impossible to exercise without dragging the layer above into the test.

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with the `{{layerName}}` layer's own rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->
