from datetime import datetime
from error_messages import TaskErrors
from fastapi.testclient import TestClient
from fastapi import HTTPException
from main import app
from models import Task
import pytest
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
    assert "id" in response.json()


def test_create_duplicate_task_is_400():
    payload = {"name": "Duplicate Task Target"}

    first_response = client.post(app.url_path_for('create_task'), json=payload)
    assert first_response.status_code == 201

    second_response = client.post(app.url_path_for('create_task'), json=payload)

    assert second_response.status_code == 400
    assert second_response.json()["detail"] == TaskErrors.DUPLICATE_NAME

def test_task_create_with_parent():
    parent1 = Task(name='parent1').save()
    parent2 = Task(name='parent2').save()
    payload = {
        'name': 'child',
        'parents': [parent1.name, parent2.name]
    }
    child_response = client.post(app.url_path_for('create_task'), json=payload)
    
    assert child_response.status_code == 201
    assert parent1.name in child_response.json()['parents']
    assert parent2.name in child_response.json()['parents']

    child_node = Task.nodes.get(name=child_response.json()['name'])
    assert parent1 in child_node.parents.all()
    assert parent2 in child_node.parents.all()

def test_task_create_with_children():
    child1 = Task(name='child1').save()
    child2 = Task(name='child2').save()
    payload = {
        'name': 'parent_task',
        'children': [child1.name, child2.name]
    }
    
    parent_response = client.post(app.url_path_for('create_task'), json=payload)
    
    assert parent_response.status_code == 201
    assert child1.name in parent_response.json()['children']
    assert child2.name in parent_response.json()['children']

    parent_node = Task.nodes.get(name=parent_response.json()['name'])
    assert child1 in parent_node.children.all()
    assert child2 in parent_node.children.all()

exception_text = 'test excpetion'
@patch('routes.Task', side_effect=TypeError(exception_text))
def test_unspecial_error_are_passed_through(_):
    payload = {"name": "test task"}
    response = client.post(app.url_path_for("create_task"), json=payload)
    assert response.status_code == 500
    assert response.json()['detail'] == exception_text


def test_get_single_task_success():
    parent_name = "Parent Task"
    parent_task = Task(name=parent_name).save()

    child_name = "Child Task"
    child_task = Task(name=child_name).save()
    
    target_name = "Target Task"
    target_details = "Target details"
    target_deadline = datetime.now()
    target_task = Task(name=target_name, details=target_details, deadline=target_deadline).save()
    target_task.parents.connect(parent_task)
    target_task.children.connect(child_task)

    response = client.get(app.url_path_for('get_single_task', task_name=target_task.name))

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == target_name
    assert data["details"] == target_details
    assert data["deadline"] == target_deadline.strftime("%Y-%m-%d")
    assert parent_name in data["parents"]
    assert child_name in data["children"]


def test_get_single_task_not_found():
    not_real_task_name = "Non Existent Task"
    expected_error_detail = "Task not found"

    response = client.get(app.url_path_for('get_single_task', task_name=not_real_task_name))

    assert response.status_code == 404
    assert response.json()["detail"] == expected_error_detail