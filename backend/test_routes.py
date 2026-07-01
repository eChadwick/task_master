from datetime import datetime
from error_messages import TaskErrors
from fastapi.testclient import TestClient
from fastapi import HTTPException
from main import app
from models import Task
import pytest
from routes import EdgeType
from unittest.mock import patch

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_database():
    yield
    for task in Task.nodes.all():
        task.delete()


def test_create_task_success():
    payload = {"name": "test task", "details": "task details", "deadline": "2026-05-21"}

    response = client.post(app.url_path_for("create_task"), json=payload)

    assert response.status_code == 201
    assert response.json()["name"] == payload["name"]
    assert response.json()["details"] == payload["details"]
    assert response.json()["deadline"] == payload["deadline"]
    assert response.json()["complete"] == False
    assert "id" in response.json()


def test_create_duplicate_task_is_400():
    payload = {"name": "Duplicate Task Target"}

    first_response = client.post(app.url_path_for("create_task"), json=payload)
    assert first_response.status_code == 201

    second_response = client.post(app.url_path_for("create_task"), json=payload)

    assert second_response.status_code == 400
    assert second_response.json()["detail"] == TaskErrors.DUPLICATE_NAME


def test_case_insensitive_uniqeness_for_task_names():
    Task(name="Test Task").save()

    payload = {"name": "test TASK"}
    response = client.post(app.url_path_for("create_task"), json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == TaskErrors.DUPLICATE_NAME


def test_task_create_with_parent():
    parent1 = Task(name="parent1").save()
    parent2 = Task(name="parent2").save()
    blocked_parent1 = Task(name="blocked parent1").save()
    blocked_parent2 = Task(name="blocked_parent2").save()
    payload = {
        "name": "child",
        "is_part_of": [parent1.name, parent2.name],
        "blocks": [blocked_parent1.name, blocked_parent2.name],
    }
    child_response = client.post(app.url_path_for("create_task"), json=payload)

    assert child_response.status_code == 201
    assert parent1.name in child_response.json()["is_part_of"]
    assert parent2.name in child_response.json()["is_part_of"]
    assert blocked_parent1.name in child_response.json()["blocks"]
    assert blocked_parent2.name in child_response.json()["blocks"]

    child_node = Task.nodes.get(name=child_response.json()["name"])
    assert parent1 in child_node.is_part_of.all()
    assert parent2 in child_node.is_part_of.all()
    assert blocked_parent1 in child_node.blocks.all()
    assert blocked_parent2 in child_node.blocks.all()


def test_task_create_with_children():
    child1 = Task(name="child1").save()
    child2 = Task(name="child2").save()
    blocking_child1 = Task(name="blocking child1").save()
    blocking_child2 = Task(name="blocking child2").save()
    payload = {
        "name": "parent_task",
        "depends_on": [child1.name, child2.name],
        "is_blocked_by": [blocking_child1.name, blocking_child2.name],
    }

    parent_response = client.post(app.url_path_for("create_task"), json=payload)

    assert parent_response.status_code == 201
    assert child1.name in parent_response.json()["depends_on"]
    assert child2.name in parent_response.json()["depends_on"]
    assert blocking_child1.name in parent_response.json()["is_blocked_by"]
    assert blocking_child1.name in parent_response.json()["is_blocked_by"]

    parent_node = Task.nodes.get(name=parent_response.json()["name"])
    assert child1 in parent_node.depends_on.all()
    assert child2 in parent_node.depends_on.all()
    assert blocking_child1 in parent_node.is_blocked_by.all()
    assert blocking_child2 in parent_node.is_blocked_by.all()


exception_text = "test excpetion"


@patch("routes.Task", side_effect=TypeError(exception_text))
def test_unspecial_error_are_passed_through(_):
    payload = {"name": "test task"}
    response = client.post(app.url_path_for("create_task"), json=payload)
    assert response.status_code == 500
    assert response.json()["detail"] == exception_text


def test_get_single_task_success():
    parent_name = "Parent Task"
    parent_task = Task(name=parent_name).save()

    child_name = "Child Task"
    child_task = Task(name=child_name).save()

    target_name = "Target Task"
    target_details = "Target details"
    target_deadline = datetime.now()
    target_task = Task(
        name=target_name, details=target_details, deadline=target_deadline
    ).save()
    target_task.is_part_of.connect(parent_task)
    target_task.depends_on.connect(child_task)

    response = client.get(
        app.url_path_for("get_single_task", task_name=target_task.name)
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == target_name
    assert data["details"] == target_details
    assert data["deadline"] == target_deadline.strftime("%Y-%m-%d")
    assert parent_name in data["is_part_of"]
    assert child_name in data["depends_on"]


def test_get_single_task_not_found():
    not_real_task_name = "Non Existent Task"
    expected_error_detail = "Task not found"

    response = client.get(
        app.url_path_for("get_single_task", task_name=not_real_task_name)
    )

    assert response.status_code == 404
    assert response.json()["detail"] == expected_error_detail


def test_get_all_tasks():
    parent_task = Task(name="Parent Task").save()
    child_task = Task(name="Child Task").save()
    blocking_child_task = Task(name="Blocking Child").save()
    parent_task.depends_on.connect(child_task)
    parent_task.is_blocked_by.connect(blocking_child_task)

    expected_edge_id = f"{parent_task.name}->{child_task.name}"
    expected_blocking_edge_id = f"{parent_task.name}->{blocking_child_task.name}"
    response = client.get(app.url_path_for("get_tasks"))

    assert response.status_code == 200
    data = response.json()

    nodes = data["nodes"]
    edges = data["edges"]

    parent_node = next((n for n in nodes if n["id"] == parent_task.name), None)
    child_node = next((n for n in nodes if n["id"] == child_task.name), None)
    blocking_child_node = next(
        (n for n in nodes if n["id"] == blocking_child_task.name), None
    )

    assert parent_node is not None
    assert parent_node["name"] == parent_task.name

    assert child_node is not None
    assert child_node["name"] == child_task.name

    assert blocking_child_node is not None
    assert blocking_child_node["name"] == blocking_child_task.name

    assert len(edges) == 2

    assert edges[0]["id"] == expected_edge_id
    assert edges[0]["source"] == parent_task.name
    assert edges[0]["target"] == child_task.name
    assert edges[0]["type"] == EdgeType.NON_BLOCKING.value

    assert edges[1]["id"] == expected_blocking_edge_id
    assert edges[1]["source"] == parent_task.name
    assert edges[1]["target"] == blocking_child_task.name
    assert edges[1]["type"] == EdgeType.BLOCKING.value


def test_get_tasks_empty_database():
    response = client.get(app.url_path_for("get_tasks"))

    assert response.status_code == 200
    data = response.json()
    assert data["nodes"] == []
    assert data["edges"] == []
