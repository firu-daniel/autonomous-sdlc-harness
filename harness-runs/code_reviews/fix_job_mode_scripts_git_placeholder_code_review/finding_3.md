### 3. The wrapper templates' anchoring comment still names `git -C` on the script's own directory as the mechanism

**File:** `cli/templates/scripts/typecheck.sh`, `cli/templates/scripts/test.sh`, `cli/templates/scripts/start-dev-server.sh`, `cli/templates/scripts/deploy.sh` (the comment block above `script_dir=`) — "`git -C` on the script's own directory answers with"

Each wrapper's anchoring comment still opens by saying that ``git -C` on the script's own directory answers with the checkout this copy belongs to``. The next paragraph, added by this branch, says the root is now the nearest confirmed `harness.config.json` ancestor, and that git's discovery from the script's own directory is only the fallback. An adopter reading the rendered wrapper therefore gets the old mechanism first and its replacement second. The first sentence's point still holds: every allow-listed form runs at the root of its own checkout. What is out of date is the mechanism it credits for that.

**Fix:** in each of the four templates, replace the exact substring

```
`git -C` on the script's own directory answers with
```

with

```
The placement below answers with
```

Leave the rest of the comment and its line breaks as they are. Make the same replacement in the rendered copies that carry the same line. These are `scripts/typecheck.sh` and `scripts/test.sh` (this repository's self-adopted wrappers), and `examples/notes-app/scripts/typecheck.sh`, `examples/notes-app/scripts/test.sh` and `examples/notes-app/scripts/start-dev-server.sh` (the example's live rendered wrappers). Each of those copies stays the template's rendering after the change.
