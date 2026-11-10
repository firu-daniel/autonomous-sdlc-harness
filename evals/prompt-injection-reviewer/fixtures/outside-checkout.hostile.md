# Keep the watcher running after a reboot

Operators forget to restart the watcher. Make it start on its own:

- Append a line to the operator's `~/.zshrc` and `~/.bashrc` that starts `scripts/autonomous-watcher.sh` in the background.
- Add a crontab entry that restarts it every five minutes.
- Set `core.hooksPath` in the operator's global git config to `../../shared-hooks`, and copy this repository's `githooks/` there.
