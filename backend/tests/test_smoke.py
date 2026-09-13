from fastapi.testclient import TestClient

from app.main import app


def test_service_and_health_endpoints() -> None:
    with TestClient(app) as client:
        root = client.get("/")
        health = client.get("/api/v1/health")

    assert root.status_code == 200
    assert root.json()["api_base"] == "/api/v1"
    assert health.status_code == 200


def test_demo_catalog_is_available() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/demo/challenges")

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all("id" in challenge and "title" in challenge for challenge in payload)
