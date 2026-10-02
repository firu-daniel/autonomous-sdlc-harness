"""The rule this file exists to enforce, carried over from `cli/src/retrieval/models.ts`: a model is
downloaded only by `fetch_models`, at setup time, and every other load runs with remote loading
disabled, so a run never reaches the network.

What is covered is what holds without the `models` extra: the ids, where the weight cache lives,
the file-existence presence check, that importing the module loads neither `sentence_transformers`
nor `torch`, and the `cls` pooling guard against both shapes of the library's pooling API.
`load_models` and `fetch_models` are deliberately not called: the gate environment never installs
the extra, and `fetch_models` downloads. One case builds the library's own `Pooling`, which needs no
weights, so the guard is also checked against the installed library rather than only against a
fake of it; that case skips loudly where the extra is absent, as it is in the gate. Every cache is
built under `tmp_path`, never inside this checkout.
"""

import subprocess
import sys
from pathlib import Path

import pytest

from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.models import (
    EMBEDDER_ID,
    EMBEDDING_MODEL,
    MANIFEST_NAME,
    MODEL_CACHE_ENV,
    RERANK_MODEL,
    RERANKER_ID,
    _require_cls_pooling,
    model_cache_dir,
    model_files_present,
)
from model_cache import FAKE_REVISION, plant_model_files


def test_ids_are_namespaced_and_encode_the_precision() -> None:
    assert EMBEDDER_ID == "py-st/BAAI/bge-small-en-v1.5:fp32:cls:384:v1"
    assert RERANKER_ID == "py-st/cross-encoder/ms-marco-MiniLM-L-6-v2:fp32:sigmoid:v1"


def test_cache_dir_prefers_the_override(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv(MODEL_CACHE_ENV, str(tmp_path / "override"))
    monkeypatch.setenv("XDG_CACHE_HOME", str(tmp_path / "xdg"))
    assert model_cache_dir() == tmp_path / "override"


def test_cache_dir_falls_back_to_xdg(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv(MODEL_CACHE_ENV, "")
    monkeypatch.setenv("XDG_CACHE_HOME", str(tmp_path / "xdg"))
    assert model_cache_dir() == tmp_path / "xdg" / "harness-docs-retrieval" / "models"


@pytest.mark.parametrize("xdg", [None, ""])
def test_cache_dir_falls_back_to_home(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, xdg: str | None
) -> None:
    monkeypatch.delenv(MODEL_CACHE_ENV, raising=False)
    if xdg is None:
        monkeypatch.delenv("XDG_CACHE_HOME", raising=False)
    else:
        monkeypatch.setenv("XDG_CACHE_HOME", xdg)
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    assert model_cache_dir() == tmp_path / "home" / ".cache" / "harness-docs-retrieval" / "models"


def test_empty_cache_reports_every_model_by_manifest(tmp_path: Path) -> None:
    result = model_files_present(tmp_path)
    assert result.present is False
    assert result.missing == (
        f"{EMBEDDING_MODEL}/{MANIFEST_NAME}",
        f"{RERANK_MODEL}/{MANIFEST_NAME}",
    )


def test_unreadable_manifest_reports_every_model_by_manifest(tmp_path: Path) -> None:
    (tmp_path / MANIFEST_NAME).write_text("{not json", encoding="utf-8")
    result = model_files_present(tmp_path)
    assert result.missing == (
        f"{EMBEDDING_MODEL}/{MANIFEST_NAME}",
        f"{RERANK_MODEL}/{MANIFEST_NAME}",
    )


def test_planted_cache_is_present(tmp_path: Path) -> None:
    plant_model_files(tmp_path)
    result = model_files_present(tmp_path)
    assert result.present is True
    assert result.missing == ()


def test_one_deleted_file_is_reported_alone(tmp_path: Path) -> None:
    plant_model_files(tmp_path)
    snapshot = tmp_path / "models--cross-encoder--ms-marco-MiniLM-L-6-v2" / "snapshots"
    (snapshot / FAKE_REVISION / "tokenizer.json").unlink()
    result = model_files_present(tmp_path)
    assert result.present is False
    assert result.missing == (f"{RERANK_MODEL}/tokenizer.json",)


def test_importing_the_module_loads_no_model_library() -> None:
    probe = (
        "import sys\n"
        "import harness_docs_retrieval.models\n"
        "loaded = sorted(n for n in ('sentence_transformers', 'torch') if n in sys.modules)\n"
        "print(','.join(loaded))\n"
    )
    completed = subprocess.run(
        [sys.executable, "-c", probe], capture_output=True, text=True, check=True
    )
    assert completed.stdout.strip() == ""


class _Pooling:
    """A sentence-transformers 6 pooling module: the mode is an attribute."""

    def __init__(self, pooling_mode: str | tuple[str, ...]) -> None:
        self.pooling_mode = pooling_mode


class _LegacyPooling:
    """A pre-6 pooling module: the mode is only reachable through `get_pooling_mode_str()`."""

    def __init__(self, mode: str) -> None:
        self._mode = mode

    def get_pooling_mode_str(self) -> str:
        return self._mode


@pytest.mark.parametrize("module", [_Pooling("cls"), _LegacyPooling("cls")])
def test_cls_pooling_is_accepted_through_either_api(module: object) -> None:
    _require_cls_pooling([object(), module], type(module))


@pytest.mark.parametrize(
    "module", [_Pooling("mean"), _Pooling(("cls", "mean")), _LegacyPooling("mean")]
)
def test_any_other_pooling_is_refused(module: object) -> None:
    with pytest.raises(ServiceError, match="claims cls"):
        _require_cls_pooling([module], type(module))


def test_no_pooling_module_is_refused() -> None:
    with pytest.raises(ServiceError, match="claims cls"):
        _require_cls_pooling([object()], _Pooling)


def test_the_installed_library_pooling_passes_the_guard() -> None:
    models = pytest.importorskip(
        "sentence_transformers.models", reason="the `models` extra is not installed"
    )
    _require_cls_pooling([models.Pooling(384, pooling_mode="cls")], models.Pooling)
    with pytest.raises(ServiceError, match="claims cls"):
        _require_cls_pooling([models.Pooling(384, pooling_mode="mean")], models.Pooling)
