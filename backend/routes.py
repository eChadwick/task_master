from fastapi import APIRouter, HTTPException, Response
from neomodel.exceptions import UniqueProperty
from models import Task
from pydantic import BaseModel

from error_messages import TaskErrors

router = APIRouter(prefix="/api")

class TaskCreateRequest(BaseModel):
    name: str

@router.options("/api/tasks")
def options_tasks():
    return Response(status_code=200)

@router.post("/tasks", status_code=201)
def create_task(payload: TaskCreateRequest):
    try:
        new_task = Task(name=payload.name).save()
    except UniqueProperty:
        raise HTTPException(status_code=400, detail=TaskErrors.DUPLICATE_NAME)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return {
        "id": new_task.element_id,
        "name": new_task.name,
        "status": "Saved to DB!"
    }