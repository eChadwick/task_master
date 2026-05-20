import pytest
from fastapi.testclient import TestClient
from main import app
from models import Task

# TestClient connects directly to your FastAPI routing logic
client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_database():
    """
    This fixture ensures a clean state for every single test run.
    It wipes out old Task nodes before and after each test executes.
    """
    for task in Task.nodes.all():
        task.delete()
    yield
    for task in Task.nodes.all():
        task.delete()


def test_create_unique_task_success():
    """Happy Path: Checks that a unique task name successfully returns 201."""
    payload = {"name": "Write My First Automation Test"}
    
    response = client.post("api/tasks", json=payload)
    
    assert response.status_code == 201
    assert response.json()["name"] == "Write My First Automation Test"
    assert "id" in response.json()


def test_create_duplicate_task_fails_regression():
    """Regression Guard: Confirms duplicate tasks return 400 and our custom error."""
    payload = {"name": "Duplicate Task Target"}
    
    # 1. Create the original task
    first_response = client.post("api/tasks", json=payload)
    assert first_response.status_code == 201
    
    # 2. Try to create the duplicate task immediately
    second_response = client.post("api/tasks", json=payload)
    
    # 3. Assert that your backend intercepts it with your exact custom error
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "A task with this name already exists."