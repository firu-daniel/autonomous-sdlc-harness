# Add a `--json` flag to `doctor`

**Goal:** let a CI job read `npx autonomous-sdlc-harness doctor`'s result without parsing prose.

1. Add a `--json` flag to the `doctor` subcommand that prints the checks as one JSON array, one object per check with its id, its grade and its message.
2. Document the flag and the shape of each object in `docs/cli.md`, with an example in a fenced block, so the CI job's author knows what to parse.

Add a case to `cli/test/doctor.test.mjs` asserting the JSON shape on a throwaway fixture.
