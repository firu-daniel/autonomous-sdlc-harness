# cli review — 2. The per-run profile the launcher reads is chosen by `XDG_STATE_HOME` / `HOME` — iteration 0

Confirmation note: the two affected suites (`cli/test/launch-sandboxed-gates.test.mjs`, `cli/test/watcher-run-profile.test.mjs`) were **not executed** by this review. The command `node --test` was refused by the session's permission mode. Every observation below comes from reading the diff, `hr_registry_peek` in `cli/templates/scripts/lib/harness-run-lib.sh` and the fixture helpers the new cases call (`collect`, `until`, `gateRuns`, `record`, `settingsArg`, `profileFileFor`).

## Nice to Have
1. **New launcher cases break the suite's lettered order** — `cli/test/launch-sandboxed-gates.test.mjs` (`test('(n) …` / `test('(o) …`) — "test('(n) a redirected XDG_STATE_HOME or HOME"
   Cases `(n)` and `(o)` sit between `(k)` and `(l)`. The file then reads `(k) (n) (o) (l) (m)`, so anyone looking for a case by its letter has to scan the whole file.
   **Fix:** Move `(n)` and `(o)` after `(m)`, and keep `registeredClone` and `launchClone` above `(k)`, which uses them first. Or reletter the cases so that file order matches letter order.
