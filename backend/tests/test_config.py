import importlib

from app import config


def test_openai_api_key_is_read_from_environment(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    importlib.reload(config)
    assert config.OPENAI_API_KEY == "sk-test"
