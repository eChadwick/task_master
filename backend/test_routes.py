from datetime import datetime, date
from error_messages import TaskErrors
from fastapi.testclient import TestClient
from fastapi import HTTPException
from main import app
from models import Task
import pytest
from routes import EdgeType
from unittest.mock import patch
from neomodel import DateProperty

client = TestClient(app)


class TestFixture:
    @pytest.fixture(autouse=True)
    def clear_database(self):
        yield
        for task in Task.nodes.all():
            task.delete()


class TestTaskCreate(TestFixture):
    def test_create_task_success(self):
        payload = {
            "name": "test task",
            "details": "task details",
            "deadline": "2026-05-21",
        }

        response = client.post(app.url_path_for("create_task"), json=payload)

        assert response.status_code == 201
        assert response.json()["name"] == payload["name"]
        assert response.json()["details"] == payload["details"]
        assert response.json()["deadline"] == payload["deadline"]
        assert response.json()["complete"] == False
        assert "id" in response.json()

        task = Task.nodes.get_or_none(name=payload["name"])
        assert task
        assert task.details == payload["details"]
        assert task.deadline == date.fromisoformat(payload["deadline"])
        assert task.complete == False

    def test_create_duplicate_task_is_400(self):
        payload = {"name": "Duplicate Task Target"}

        first_response = client.post(app.url_path_for("create_task"), json=payload)
        assert first_response.status_code == 201

        second_response = client.post(app.url_path_for("create_task"), json=payload)

        assert second_response.status_code == 400
        assert second_response.json()["detail"] == TaskErrors.DUPLICATE_NAME

    def test_case_insensitive_uniqeness_for_task_names(self):
        Task(name="Test Task").save()

        payload = {"name": "test TASK"}
        response = client.post(app.url_path_for("create_task"), json=payload)

        assert response.status_code == 400
        assert response.json()["detail"] == TaskErrors.DUPLICATE_NAME

    def test_task_create_with_parent(self):
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

    def test_task_create_with_children(self):
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

    @patch("routes.Task", side_effect=TypeError("test excpetion"))
    def test_unspecial_error_are_passed_through(self, _):
        payload = {"name": "test task"}
        response = client.post(app.url_path_for("create_task"), json=payload)
        assert response.status_code == 500
        assert response.json()["detail"] == "test excpetion"


class TestTaskGet(TestFixture):
    def test_get_single_task_success(self):
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
        assert data["complete"] == False
        assert parent_name in data["is_part_of"]
        assert child_name in data["depends_on"]

    def test_get_single_task_not_found(self):
        not_real_task_name = "Non Existent Task"
        expected_error_detail = TaskErrors.TASK_NOT_FOUND_ERROR

        response = client.get(
            app.url_path_for("get_single_task", task_name=not_real_task_name)
        )

        assert response.status_code == 404
        assert response.json()["detail"] == expected_error_detail

    def test_get_all_tasks(self):
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
        assert parent_node["complete"] == parent_task.complete

        assert child_node is not None
        assert child_node["name"] == child_task.name
        assert child_node["complete"] == child_task.complete

        assert blocking_child_node is not None
        assert blocking_child_node["name"] == blocking_child_task.name
        assert blocking_child_node["complete"] == blocking_child_task.complete

        assert len(edges) == 2

        assert edges[0]["id"] == expected_edge_id
        assert edges[0]["source"] == parent_task.name
        assert edges[0]["target"] == child_task.name
        assert edges[0]["type"] == EdgeType.NON_BLOCKING.value

        assert edges[1]["id"] == expected_blocking_edge_id
        assert edges[1]["source"] == parent_task.name
        assert edges[1]["target"] == blocking_child_task.name
        assert edges[1]["type"] == EdgeType.BLOCKING.value

    def test_get_tasks_empty_database(self):
        response = client.get(app.url_path_for("get_tasks"))

        assert response.status_code == 200
        data = response.json()
        assert data["nodes"] == []
        assert data["edges"] == []


class TestTaskUpdate(TestFixture):
    def test_404_when_called_with_invalid_id(self):
        response = client.post(
            app.url_path_for("update_task", task_name="non-existent task"),
            json={},
        )

        assert response.status_code == 404
        assert response.json()["detail"] == TaskErrors.TASK_NOT_FOUND_ERROR

    def test_happy_path_update(self):
        task = Task(
            name="task", details="details", deadline=date.today(), complete=False
        ).save()

        new_name = "new name"
        new_details = "new_details"
        new_deadline = date.today()

        response = client.post(
            app.url_path_for("update_task", task_name=task.name),
            json={
                "name": new_name,
                "details": new_details,
                "deadline": new_deadline.isoformat(),
                "complete": True,
            },
        )

        assert response.status_code == 200
        assert response.json()["name"] == new_name
        assert response.json()["details"] == new_details
        assert response.json()["deadline"] == new_deadline.isoformat()
        assert response.json()["complete"] == True

        task.refresh()
        assert task.name == new_name
        assert task.details == new_details
        assert task.deadline == new_deadline
        assert task.complete == True

    def test_all_fields_optional(self):
        initial_task_name = "task"
        initial_task_details = "details"
        initial_deadline = date.today()
        initial_completeness_status = True
        task = Task(
            name=initial_task_name,
            details=initial_task_details,
            deadline=initial_deadline,
            complete=initial_completeness_status,
        ).save()

        child1 = Task(name="child1").save()
        child2 = Task(name="child2").save()

        task.depends_on.connect(child1)
        task.is_blocked_by.connect(child2)

        response = client.post(
            app.url_path_for("update_task", task_name=task.name), json={}
        )

        assert response.status_code == 200
        assert response.json()["name"] == initial_task_name
        assert response.json()["details"] == initial_task_details
        assert response.json()["deadline"] == initial_deadline.isoformat()
        assert response.json()["complete"] == initial_completeness_status

        task.refresh()
        assert task.name == initial_task_name
        assert task.details == initial_task_details
        assert task.deadline == initial_deadline
        assert task.complete == initial_completeness_status

    def test_child_updates(self):
        parent = Task(name="parent").save()
        child1 = Task(name="child 1").save()
        child2 = Task(name="child 2").save()
        parent.depends_on.connect(child1)
        parent.is_blocked_by.connect(child2)

        response = client.post(
            app.url_path_for("update_task", task_name=parent.name),
            json={"depends_on": [child2.name], "is_blocked_by": [child1.name]},
        )

        assert child1.name in response.json()["is_blocked_by"]
        assert child2.name in response.json()["depends_on"]

        parent.refresh()
        assert child1 in parent.is_blocked_by.all()
        assert child2 in parent.depends_on.all()

    def test_child_deletion(self):
        parent = Task(name="parent").save()
        child1 = Task(name="child1").save()
        child2 = Task(name="child2").save()

        parent.is_blocked_by.connect(child1)
        parent.depends_on.connect(child2)

        response = client.post(
            app.url_path_for("update_task", task_name=parent.name),
            json={"depends_on": [], "is_blocked_by": []},
        )

        assert response.json()["depends_on"] == []
        assert response.json()["is_blocked_by"] == []

        parent.refresh()
        assert len(parent.depends_on) == 0
        assert len(parent.is_blocked_by) == 0
