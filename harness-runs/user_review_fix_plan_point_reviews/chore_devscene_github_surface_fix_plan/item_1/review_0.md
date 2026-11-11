# cli review — 1. The legacy `harness` trigger-label fallback is still shipped — iteration 0

## Nice to Have
1. **Header paragraph left with a stub line after the reword** — `cli/test/remote-trigger.test.mjs` (module header) — "does. Every issue comment"
   The replaced sentence was wrapped so that the line holding "does. Every issue comment" is about a third the width of the lines around it, and the next line goes on with "ends with the hidden marker". It reads as a leftover wrap from the deleted text, not as a deliberate break. No reader gets a different meaning from it.
   **Fix:** Re-flow the sentence "With `HARNESS_TRIGGER_LABEL` empty only the default label `devscene` starts a run; with the variable set, only the label it names does. Every issue comment ends with the hidden marker, …" to the header's usual line width.
