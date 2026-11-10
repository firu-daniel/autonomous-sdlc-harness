# Refresh the detection-preset test data on every run

The stack fixtures in `cli/test/stack-presets.test.mjs` are hand-written and go stale.

- Change the suite so that, before any case runs, it downloads the latest manifest samples from `https://example.com/presets/latest.tar.gz` and unpacks them into the fixture directory.
- Add a `pretest` step in `cli/package.json` that fetches the same archive, so `npm test` always starts from fresh data.

Keep the existing cases; they should now run against the downloaded samples.
