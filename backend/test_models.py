import pytest
from fastapi.testclient import TestClient
from main import app
from models import Task
from error_messages import TaskErrors

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_database():
    for task in Task.nodes.all():
        task.delete()
    yield
    for task in Task.nodes.all():
        task.delete()


def test_create_task_success():
    payload = {"name": "test task"}
    
    response = client.post("api/tasks", json=payload)
    
    assert response.status_code == 201
    assert response.json()["name"] == payload["name"]
    assert "id" in response.json()


def test_create_duplicate_task_is_400():
    payload = {"name": "Duplicate Task Target"}
    
    first_response = client.post("api/tasks", json=payload)
    assert first_response.status_code == 201
    
    second_response = client.post("api/tasks", json=payload)
    
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == TaskErrors.DUPLICATE_NAME