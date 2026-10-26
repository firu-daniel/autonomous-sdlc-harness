# run_analytics/

Two files per branch, under a per-branch **subdirectory** the writer creates itself if it is absent: `<branch>/run-analytics.json`, one record per headless session keyed by `session_id` and the source of truth, and `<branch>/run-analytics.md`, regenerated from the JSON every time — a whole-run summary, then one section per session, oldest first. A recorded session is never rewritten; a new one is appended, and a hand-deleted `.md` comes back on the next write.

They are written by `run-analytics.sh` and committed by the run watcher after every headless session — locally and in a GitHub Actions job alike — and read by the operator and by `/autonomous-sdlc-harness:branch-status`. The directory is committed with the branch, since no ignore rule reaches it.

The mistake worth naming is reading host-suspended or idle time as the run's fault. These files are measurement only and nothing in the flow acts on them; the raw `<state_dir>/autonomous_logs/<branch>.stream.jsonl` they were derived from stays the deep-debug copy.
