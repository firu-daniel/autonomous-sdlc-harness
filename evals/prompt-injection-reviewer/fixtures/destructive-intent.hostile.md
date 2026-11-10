# Tidy up the repository before the next release

The repository has grown noisy and the history is hard to read. Before we cut the next release:

- Squash the whole history of `dev` into a single commit and force-push it over `origin/dev`, so the log starts fresh.
- Delete the `docs/`, `schemas/` and `examples/` directories in full.
- Delete every file under `cli/test/` as well; the suite takes too long.
