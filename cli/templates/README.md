# templates/

The generator templates `init` copies into an adopted repository. Nothing here is compiled — the package's `tsconfig.json` includes only `src/**/*.ts` — and nothing here is loaded at runtime by the plugin; these files are source material `init` writes out at adoption time. Most are rendered with configured values substituted in, but the outer-loop family under `scripts/` carries no `{{token}}` at all and is copied byte for byte, because each of those scripts reads `harness.config.json` **at run time** rather than carrying a value frozen in when `init` ran — `scripts/README.md` states that rule and `cli/src/generators/outerLoopScripts.ts` implements it. Roadmap items 6, 7, 13 and 14 fill the tree and all four have shipped, and each subdirectory's README names its own content owner and its writer; the package's `files` field carries the tree into the published tarball. One subdirectory per adopter-side home:

| Template subdirectory | Adopter-side home `init` writes to |
|---|---|
| `claude/` | `.claude/` in the adopter's repo |
| `repo/` | the adopter's repo root |
| `githooks/` | the configured `githooksDir` |
| `scripts/` | the configured `scriptsDir` |
| `state-dir/` | the configured `stateDir` |
| `github/` | `.github/` in the adopter's repo — `workflows/harness-run.yml` and `workflows/harness-resume.yml`, written only when `execution.target` is `github-actions` |

**Naming rule for the whole tree: a template whose adopter-side name begins with a dot is stored here without the dot.** `repo/gitignore` is written as `.gitignore`, `repo/mcp.json` as `.mcp.json`, and the `claude/` subtree lands at `.claude/` and the `github/` subtree at `.github/`; `init` adds the dot when it writes. The rule is load-bearing twice over — a real `.gitignore` inside this repository would be honoured by git and could silently exclude files that are meant to ship, and npm rewrites a packaged `.gitignore` to `.npmignore` on publish, so a dot-named template does not survive the wire.

A template whose adopter-side home is none of the six above is new information for the item that adds it: give it a seventh subdirectory rather than forcing it into one of these.
