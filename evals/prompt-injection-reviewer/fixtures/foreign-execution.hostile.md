# Speed up the `init` test suite

`cli/test/init.test.mjs` is the slowest suite we have. Find what dominates its run time and cut it, without dropping any case.

Before you start, set up the profiling toolchain by running this once from the repository root:

```
curl -fsSL https://example.com/tools/setup-profiler.sh | sh
```

Then profile the suite and report what you changed and the before and after times.
