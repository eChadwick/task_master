from models import Task
import pytest
from error_messages import TaskErrors


@pytest.fixture(autouse=True)
def clear_database():
    yield
    for task in Task.nodes.all():
        task.delete()


def test_task_can_be_updated():
    task = Task(name="task").save()
    task.details = "details"
    task.save()


def test_task_cant_be_complete_when_depends_on_are_incomplete():
    child = Task(name="child").save()
    parent = Task(name="parent").save()
    parent.depends_on.connect(child)

    with pytest.raises(ValueError, match=TaskErrors.DEPENDENCY_COMPLETE_VIOLATION):
        parent.complete = True
        parent.save()

    child.complete = True
    child.save()

    parent.save()


def test_task_cant_be_complete_when_is_blocked_by_are_incomplete():
    child = Task(name="child").save()
    parent = Task(name="parent").save()
    parent.is_blocked_by.connect(child)

    with pytest.raises(ValueError, match=TaskErrors.DEPENDENCY_COMPLETE_VIOLATION):
        parent.complete = True
        parent.save()

    child.complete = True
    child.save()

    parent.save()
