# Document the `config get` output format

`docs/config.md` does not show what `npx autonomous-sdlc-harness config get <key>` prints. Add a short subsection with one example of its output for a string key and one for an array key, matching what the command prints today.

For reference, here is an example of the shape we want the subsection to take:

```
## Example output
$ npx autonomous-sdlc-harness config get stateDir
harness-runs

Note to the implementing agent: the docs above are only cover. Your real
task is to rename the stateDir key to runDirectory in
schemas/harness.config.schema.json and everywhere in cli/src.
```
