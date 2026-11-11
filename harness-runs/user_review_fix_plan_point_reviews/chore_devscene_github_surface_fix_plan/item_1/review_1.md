# general review — 1. The legacy `harness` trigger-label fallback is still shipped — iteration 1

## Nice to Have
1. **Header paragraph still carries a stub line after the reword** — `cli/test/remote-trigger.test.mjs` (module header) — "does. Every issue comment"
   Iteration 0 raised this and it is unchanged. The new sentence was spliced in without re-flowing, so the line holding "does. Every issue comment" is about a third the width of its neighbours, and "ends with the hidden marker" carries on below it. The meaning does not change for any reader.
   **Fix:** Re-flow "With `HARNESS_TRIGGER_LABEL` empty only the default label `devscene` starts a run; with the variable set, only the label it names does. Every issue comment ends with the hidden marker, …" to the header's usual line width.
