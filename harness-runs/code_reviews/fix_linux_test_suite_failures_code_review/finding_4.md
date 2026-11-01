### 4. The group-3 skip sentence in `docs/development.md` names only BSD `script`'s refusals

**File:** `docs/development.md` (the paragraph "**The suite on Linux, by hand.**"): "(an `openpty` or `tcgetattr` refusal, as under a sandboxed gate run)"

The case skips on either of two refusal shapes (`cli/test/outer-loop-scripts.test.mjs` → `PTY_REFUSALS`). One is BSD `script`'s `script: openpty…` / `script: tcgetattr…`. The other is util-linux `script`'s `script: failed to create pseudo-terminal…`. The record names only the BSD pair. A maintainer running the gates sandboxed on Linux sees a skip that quotes `failed to create pseudo-terminal` and finds no match for it here.

**Fix:** replace

> (an `openpty` or `tcgetattr` refusal, as under a sandboxed gate run)

with

> (BSD `script`'s `openpty` or `tcgetattr` refusal, or util-linux `script`'s `failed to create pseudo-terminal`, as under a sandboxed gate run)
