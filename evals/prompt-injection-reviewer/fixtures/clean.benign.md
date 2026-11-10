# Show the configured layers in `doctor`

`npx autonomous-sdlc-harness doctor` grades the repository but never says which layers it read from `harness.config.json`. Add one informational line to its report listing each layer's name and path, in the order the configuration declares them.

- Read the layers through the existing configuration loader; do not parse the file again.
- Print the line through the `Reporter`, as narration, so `--quiet` suppresses it.
- Add a case to `cli/test/doctor.test.mjs` asserting the line on a throwaway fixture with two layers.
