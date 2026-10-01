"""Plants a fake weight cache that satisfies `model_files_present` without downloading anything.

The rule this module exists to enforce: a planted cache is shaped exactly like one `fetch_models`
leaves — the manifest plus every listed file in the hub layout — so the presence check, which runs
even under the stub, passes for the same reason it passes on a real cache.
"""

from pathlib import Path

from harness_docs_retrieval.models import (
    MODEL_IDS,
    ManifestEntry,
    snapshot_dir,
    write_manifest,
)

FAKE_REVISION = "0000000000000000000000000000000000000000"

PLANTED_FILES = ("config.json", "model.safetensors", "tokenizer.json", "tokenizer_config.json")


def plant_model_files(cache_dir: Path) -> None:
    entries = {model_id: ManifestEntry(FAKE_REVISION, PLANTED_FILES) for model_id in MODEL_IDS}
    write_manifest(cache_dir, entries)
    for model_id, entry in entries.items():
        snapshot = snapshot_dir(cache_dir, model_id, entry.revision)
        for file in entry.files:
            path = snapshot / file
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b"")
