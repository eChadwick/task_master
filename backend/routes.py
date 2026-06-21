from fastapi import APIRouter, HTTPException, Response
from neomodel.exceptions import UniqueProperty
from models import Task
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

from error_messages import TaskErrors

router = APIRouter(prefix="/api")


class TaskCreateRequest(BaseModel):
    name: str
    details: Optional[str] = None
    deadline: Optional[date] = None
    is_part_of: List[str] = []
    depends_on: List[str] = []
    blocks: List[str] = []
    is_blocked_by: List[str] = []


@router.post("/tasks", status_code=201)
def create_task(payload: TaskCreateRequest):
    try:
        new_task = Task(
            name=payload.name, details=payload.details, deadline=payload.deadline
        ).save()
        for parent_name in payload.is_part_of:
            parent_node = Task.nodes.get_or_none(name=parent_name)
            if parent_node:
                new_task.is_part_of.connect(parent_node)
        for child_name in payload.depends_on:
            child_node = Task.nodes.get_or_none(name=child_name)
            if child_node:
                new_task.depends_on.connect(child_node)
        for task_name in payload.blocks:
            parent_node = Task.nodes.get_or_none(name=task_name)
            if parent_node:
                new_task.blocks.connect(parent_node)
        for task_name in payload.is_blocked_by:
            child_node = Task.nodes.get_or_none(name=task_name)
            if child_node:
                new_task.is_blocked_by.connect(child_node)
    except UniqueProperty:
        raise HTTPException(status_code=400, detail=TaskErrors.DUPLICATE_NAME)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "id": new_task.element_id,
        "name": new_task.name,
        "details": new_task.details,
        "deadline": new_task.deadline,
        "is_part_of": [task.name for task in new_task.is_part_of.all()],
        "depends_on": [task.name for task in new_task.depends_on.all()],
        "blocks": [task.name for task in new_task.blocks.all()],
        "is_blocked_by": [task.name for task in new_task.is_blocked_by.all()],
        "status": "Saved to DB!",
    }


@router.get("/tasks/{task_name}")
def get_single_task(task_name: str):
    task = Task.nodes.get_or_none(name=task_name)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "name": task.name,
        "details": task.details,
        "deadline": task.deadline,
        "is_part_of": [task.name for task in task.is_part_of.all()],
        "depends_on": [task.name for task in task.depends_on.all()],
        "blocks": [task.name for task in task.blocks.all()],
        "is_blocked_by": [task.name for task in task.is_blocked_by.all()],
    }


@router.get("/tasks")
def get_tasks():
    all_tasks = Task.nodes.all()

    nodes = [
        {"id": task.name, "name": task.name, "details": task.details}
        for task in all_tasks
    ]

    edges = []
    for task in all_tasks:
        for child in task.depends_on.all():
            edges.append(
                {
                    "id": f"{task.name}->{child.name}",
                    "source": task.name,
                    "target": child.name,
                }
            )

    return {"nodes": nodes, "edges": edges}
