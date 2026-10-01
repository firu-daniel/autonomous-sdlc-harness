"""The rule this file exists to enforce: the `models` extra is locked to a `sentence-transformers`
whose API `models.load_models` calls (`activation_fn`, `revision`, `local_files_only`), which is
v4 or later.

No gate installs the `models` extra, so no behavioural test can reach the real loader. This reads
`uv.lock` instead, a last resort taken for that reason.
"""

import tomllib
from pathlib import Path

_LOCK = Path(__file__).resolve().parents[1] / "uv.lock"


def test_the_locked_sentence_transformers_has_the_v4_api() -> None:
    lock = tomllib.loads(_LOCK.read_text(encoding="utf-8"))
    versions = [
        package["version"]
        for package in lock["package"]
        if package["name"] == "sentence-transformers"
    ]
    assert versions, "uv.lock carries no sentence-transformers entry"
    for version in versions:
        assert int(version.split(".")[0]) >= 4, version
