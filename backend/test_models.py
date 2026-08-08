from models import Task
import pytest
from error_messages import TaskErrors
from datetime import datetime


@pytest.fixture(autouse=True)
def clear_database():
    yield
    for task in Task.nodes.all():
        task.delete()


def test_task_can_be_updated():
    task = Task(
        name="task", details="none", deadline=datetime.now(), complete=False
    ).save()
    updated_deadline = datetime.now()
    updated_name = "new_name"
    updated_details = "new details" ""
    task.name = updated_name
    task.details = updated_details
    task.deadline = updated_deadline
    task.complete = True

    task.save()

    assert task.name == updated_name
    assert task.details == updated_details
    assert task.deadline == updated_deadline
    assert task.complete == True


def test_task_cant_be_complete_when_depends_on_are_incomplete():
    child = Task(name="child").save()
    parent = Task(name="parent").save()
    parent.depends_on.connect(child)
    parent.complete = True

    parent.save()

    assert parent.complete == False

    child.complete = True
    child.save()
    parent.complete = True

    parent.save()

    assert parent.complete == True


def test_task_cant_be_complete_when_is_blocked_by_are_incomplete():
    child = Task(name="child").save()
    parent = Task(name="parent").save()
    parent.is_blocked_by.connect(child)
    parent.complete = True

    parent.save()

    assert parent.complete == False

    child.complete = True
    child.save()
    parent.complete = True

    parent.save()

    assert parent.complete == True


def test_parent_updates_to_incomplete_when_a_depends_on_does():
    child = Task(name="child").save()
    parent = Task(name="parent").save()
    parent.depends_on.connect(child)

    child.complete = True
    child.save()

    parent.complete = True
    parent.save()
    assert parent.complete == True

    child.complete = False
    child.save()

    parent.refresh()
    assert parent.complete == False


def test_parent_updates_to_incomplete_when_an_is_blocked_by_on_does():
    child = Task(name="child").save()
    parent = Task(name="parent").save()
    parent.is_blocked_by.connect(child)

    child.complete = True
    child.save()

    parent.complete = True
    parent.save()
    assert parent.complete == True

    child.complete = False
    child.save()

    parent.refresh()
    assert parent.complete == False


def test_parent_goes_incomplete_when_new_depends_on_added():
    parent = Task(name="parent", complete=True).save()
    assert parent.complete == True
    child = Task(name="child").save()
    parent.depends_on.connect(child)

    parent.save()

    assert parent.complete == False


def test_parent_goes_incomplete_when_new_is_blocked_by_added():
    parent = Task(name="parent", complete=True).save()
    assert parent.complete == True
    child = Task(name="child").save()
    parent.is_blocked_by.connect(child)

    parent.save()

    assert parent.complete == False


# def test_parent_goes_incomplete_when_new_is_part_of_added():

# def test_parent_goes_incomplete_when_new_blocks_added()
