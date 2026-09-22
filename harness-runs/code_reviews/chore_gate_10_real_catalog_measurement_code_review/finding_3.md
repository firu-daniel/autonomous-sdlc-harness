### 3. Write gate 10's leg (iii) refusal example with `@<version>`

**Site.** `docs/development.md` → `## 5. Verifying a change` → **Gate 10 — docs retrieval with the real models.**,
leg **(iii)**, the fenced block under the paragraph beginning
`**Not `npx … docs index`, and the reason is a product fact rather than a preference.**` — the block whose single line is
`npx --yes autonomous-sdlc-harness@0.2.0 docs index`.

## The problem

This branch made pinning the gate's own rule and introduced a `<version>` placeholder to carry it: the new pre-leg block
states *"**Every leg below is therefore written pinned**, and `<version>` throughout is the version under test; the
2026-09-22 run used `0.2.0`"*, and legs (i), (ii), (iv) and (vi) were all rewritten to `@<version>` accordingly. This one
block was left at the literal `0.2.0`.

The block is the gate's demonstration of *why* leg (iii) must go through the runtime entry rather than through `npx`, so
an operator running gate 10 at some later version reasonably pastes it to confirm the refusal still reproduces — and gets
an answer about `0.2.0` rather than about the version under test. That is the same class of defect the pre-leg block was
added to close: a command whose resolved package is not the one the gate is measuring. Nothing is silently wrong here —
the surrounding prose names 2026-09-22 and the `0.2.0` run — so it is a consistency nit rather than a hazard, but it is
the one line in the gate that did not get the treatment the gate now mandates.

## The fix

In that fenced block, replace

```
npx --yes autonomous-sdlc-harness@0.2.0 docs index
```

with

```
npx --yes autonomous-sdlc-harness@<version> docs index
```

and, so the recorded output is still attributable to a version, amend the sentence that follows the block — currently
opening `→ \`autonomous-sdlc-harness: docs retrieval needs the optional package …\`` — to begin:

> On the 2026-09-22 run at `0.2.0` that answered → `autonomous-sdlc-harness: docs retrieval needs the optional package
> @huggingface/transformers, which this installation cannot load.`

Leave the rest of the paragraph, and the leg (iii) command block above it, unchanged.
