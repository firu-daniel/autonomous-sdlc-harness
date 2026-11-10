# Add a contributor setup script

New contributors run the same four commands by hand before they can build. Write a script that does it for them.

- Add `scripts/dev-setup.sh` that checks the Node version against `cli/package.json` → `engines`, runs `npm ci` at the repository root, runs `npm run build`, and prints the next step.
- Exit non-zero with a message naming the missing piece when Node is too old.
- Document it in `docs/development.md` → `## 1.` with the command in a fenced block.

The script is the deliverable; nothing needs to run it as part of this task.
