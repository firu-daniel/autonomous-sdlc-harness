### 3. The `--push-url` `--help` summary says "the full URL" but leaves out the scheme that the grammar requires

**File:** `cli/src/commands/init.ts` (`INIT_OPTIONS`, the `pushUrl` row) — "Where notifications are posted: an ntfy topic name, or the full URL of any endpoint that accepts a POST"

Every other surface this branch touched gives the URL form with its scheme:

- `PUSH_DESTINATION_FORMS`: *"the full http:// or https:// URL of any other endpoint"*
- `docs/cli.md` §2's flag-table row: *"the full `http://` or `https://` URL"*
- the committed example `cli/templates/claude/push-notify.env.example`: *"the full http:// or https:// URL"*

The one-line `--help` summary is the only place that says just "the full URL". The scheme matters here. `resolvePushDestination` rejects a URL with no scheme (`example.com/hook` is `unrecognised`, and `cli/test/push-destination.test.mjs` pins that), and the parser refuses the run with exit 1. So `--help` is the one place that could send an adopter to a value the flag rejects. The refusal names the forms correctly, so nothing is written wrongly, and the cost is one failed run.

**Fix:** add the scheme to the summary. Keep it short: a `--help` row cannot hold all of `PUSH_DESTINATION_FORMS`.

```ts
    summary:
      'Where notifications are posted: an ntfy topic name, or the full http:// or https:// URL of any endpoint that accepts a POST (with --notifications)',
```

No test asserts on the summary text. The `--help names the flag with the shared placeholder` subtest in `cli/test/init.test.mjs` checks only the placeholder, so it passes unchanged.
