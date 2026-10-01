"""The `self-check` sub-command: three answers a `doctor` check asks of this backend.

The rule this module exists to enforce: `run_self_check` prints exactly one line per question in
`SELF_CHECK_QUESTIONS`, in that order, and returns `0` only when every line is `ok`. Every exception
inside a check becomes that check's `FAIL` line, so a missing cache or an unreachable database never
surfaces as a traceback. The question names and their order are a contract with the selection
branch's `doctor` check.

Package presence is resolved with `importlib.util.find_spec` and never imported, as
`unresolvedRetrievalPeers` in `cli/src/retrieval/runtime.ts` resolves its peers. This module never
downloads a model.
"""

import argparse
import asyncio
import importlib.util
import os
import sys
from collections.abc import Callable
from dataclasses import dataclass

from harness_docs_retrieval.models import model_cache_dir, model_files_present
from harness_docs_retrieval.service import load_service_config, open_session
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV, stub_models_selected

SELF_CHECK_QUESTIONS = ("packages", "weights", "index")

MIN_PYTHON = (3, 11)
BASE_PACKAGES = ("fastapi", "uvicorn", "mcp", "psycopg", "huggingface_hub")
MODEL_PACKAGES = ("sentence_transformers", "torch")


@dataclass(frozen=True)
class CheckLine:
    question: str
    ok: bool
    detail: str

    def render(self) -> str:
        if self.ok:
            return f"ok   {self.question}: {self.detail}"
        return f"FAIL {self.question}: {self.detail}"


def _one_line(error: BaseException) -> str:
    # A driver error's message can span lines; the contract is one stdout line per question.
    parts = [line.strip() for line in str(error).splitlines() if line.strip()]
    return "; ".join(parts) if parts else type(error).__name__


def _resolves(name: str) -> bool:
    try:
        return importlib.util.find_spec(name) is not None
    except (ImportError, ValueError):
        return False


def _check_packages() -> CheckLine:
    question = SELF_CHECK_QUESTIONS[0]
    version = ".".join(str(part) for part in sys.version_info[:3])
    if sys.version_info[:2] < MIN_PYTHON:
        wanted = ".".join(str(part) for part in MIN_PYTHON)
        return CheckLine(question, False, f"python {version} is older than {wanted}")
    stub = stub_models_selected()
    wanted_packages = BASE_PACKAGES if stub else (*BASE_PACKAGES, *MODEL_PACKAGES)
    missing = [name for name in wanted_packages if not _resolves(name)]
    if missing:
        return CheckLine(question, False, f"python {version}; unresolved: {', '.join(missing)}")
    detail = f"python {version}; {', '.join(wanted_packages)} resolve"
    if stub:
        detail += f"; {', '.join(MODEL_PACKAGES)} not required while {RETRIEVAL_STUB_ENV} is set"
    return CheckLine(question, True, detail)


def _check_weights() -> CheckLine:
    question = SELF_CHECK_QUESTIONS[1]
    cache_dir = model_cache_dir()
    files = model_files_present(cache_dir)
    if files.present:
        return CheckLine(question, True, f"present in {cache_dir}")
    return CheckLine(question, False, f"{cache_dir} is missing {', '.join(files.missing)}")


async def _build_index(config_args: argparse.Namespace) -> str:
    config = load_service_config(
        repo=config_args.repo, docs_root=config_args.docs_root, environ=os.environ
    )
    session = await open_session(config)
    try:
        result = await session.refresh()
    finally:
        await session.close()
    return f"{result.files} files, {result.chunks} chunks"


def _check_index(config_args: argparse.Namespace, failed: list[str]) -> CheckLine:
    question = SELF_CHECK_QUESTIONS[2]
    if failed:
        return CheckLine(question, False, f"not attempted, because {failed[0]} failed")
    return CheckLine(question, True, asyncio.run(_build_index(config_args)))


def _guarded(question: str, check: Callable[[], CheckLine]) -> CheckLine:
    try:
        return check()
    except Exception as error:
        return CheckLine(question, False, _one_line(error))


def run_self_check(config_args: argparse.Namespace) -> int:
    """Prints the three lines on stdout. When `packages` or `weights` failed, `index` names the
    first of them that did and is not attempted."""
    packages = _guarded(SELF_CHECK_QUESTIONS[0], _check_packages)
    weights = _guarded(SELF_CHECK_QUESTIONS[1], _check_weights)
    failed = [line.question for line in (packages, weights) if not line.ok]
    index = _guarded(SELF_CHECK_QUESTIONS[2], lambda: _check_index(config_args, failed))
    lines = (packages, weights, index)
    for line in lines:
        print(line.render())
    return 0 if all(line.ok for line in lines) else 1
