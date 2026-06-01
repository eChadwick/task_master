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
    parents: List[str] = []
    children: List[str] = []

@router.options("/api/tasks")
def options_tasks():
    return Response(status_code=200)

@router.post("/tasks", status_code=201)
def create_task(payload: TaskCreateRequest):
    try:
        new_task = Task(name=payload.name, details=payload.details, deadline=payload.deadline).save()
        for parent_name in payload.parents:
            parent_node = Task.nodes.get_or_none(name=parent_name)
            if parent_node:
                new_task.parents.connect(parent_node)
        for child_name in payload.children:
            child_node = Task.nodes.get_or_none(name=child_name)
            if child_node:
                new_task.children.connect(child_node)
    except UniqueProperty:
        raise HTTPException(status_code=400, detail=TaskErrors.DUPLICATE_NAME)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return {
        "id": new_task.element_id,
        "name": new_task.name,
        "details": new_task.details,
        "deadline": new_task.deadline,
        "parents": [parent.name for parent in new_task.parents.all()],
        "children": [child.name for child in new_task.children.all()],
        "status": "Saved to DB!"
    }

@router.get("/tasks")
def get_tasks():
    return [
        {
            "name": task.name,
            "details": task.details,
            "deadline": task.deadline
        }
        for task in Task.nodes.all()
    ]