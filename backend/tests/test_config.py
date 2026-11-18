import importlib

import pytest

from app import config


@pytest.fixture
def reload_config(monkeypatch):
    yield lambda: importlib.reload(config)
    # Przywracamy środowisko i moduł, żeby wartości z testu nie przeciekały dalej.
    monkeypatch.undo()
    importlib.reload(config)


def test_openai_api_key_is_read_from_environment(monkeypatch, reload_config):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    reload_config()
    assert config.OPENAI_API_KEY == "sk-test"


def test_empty_openai_api_key_is_treated_as_missing(monkeypatch, reload_config):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    reload_config()
    assert config.OPENAI_API_KEY is None
