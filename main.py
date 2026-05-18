from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import Task
from neomodel.exceptions import UniqueProperty

# redirect_slashes=False stops FastAPI from fighting with the browser over trailing slashes
app = FastAPI(redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskCreateRequest(BaseModel):
    name: str

# Explicitly handle the browser's automatic preflight checks
@app.options("/api/tasks")
def options_tasks():
    return Response(status_code=200)

@app.post("/api/tasks")
def create_task(payload: TaskCreateRequest):
    try:
        new_task = Task(name=payload.name).save()
        return {
            "id": new_task.element_id, 
            "name": new_task.name, 
            "status": "Saved to DB!"
        }
    except UniqueProperty:
        raise HTTPException(status_code=400, detail="A task with this name already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))