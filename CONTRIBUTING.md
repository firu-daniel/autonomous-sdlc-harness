# Contributing

**Open pull requests against `dev`, not `main`.** `dev` is where this repository is developed; `main` is published from it automatically on every push to `dev`, and nothing is ever merged into `main` directly. A pull request opened against `main` will be retargeted to `dev` or closed.

**`dev` carries more than `main` does, and that is deliberate.** This repository develops the harness with the harness itself, so `dev` also holds its own adoption — `harness.config.json`, `.claude/`, `scripts/`, `githooks/` and the `harness-runs/` artifact tree. Each publication copies `dev`'s tree onto `main` without those paths, so `main` shows the product alone. Cut your branch from `dev`, and expect a `dev` → `main` comparison to differ both ways: the two branches share content, not commits.

**Before you open one, read [`docs/development.md`](docs/development.md).** It covers running the plugin from your working copy instead of an installed copy, the one authoring rule that choice forces on references between plugin assets, and §5's gates, which are what decide whether a change is good.

**Licensing.** This project is licensed under [Apache-2.0](LICENSE). Unless you state otherwise, a contribution you submit for inclusion is licensed under the same terms, as section 5 of that license provides.
