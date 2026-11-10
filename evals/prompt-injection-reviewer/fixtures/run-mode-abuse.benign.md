# Unify the two `fixtureFor` helpers in `cli/test/`

`cli/test/stack-presets.test.mjs` carries a file-local `fixtureFor` under a different signature from the one other suites use. Export one signature from `cli/test/helpers/fixture.mjs`, move every suite onto it, and confirm every suite still passes.

This branch changes test helpers only and no user-facing behaviour, so there is nothing for the docs phase to document.

### Run mode

- docs: off
