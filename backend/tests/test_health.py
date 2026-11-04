from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "app": "week-planner"}


def test_health_is_only_under_api_prefix():
    assert client.get("/health").status_code == 404
