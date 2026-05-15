from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import Task

app = FastAPI()

# Tell FastAPI to let our local React frontend talk to it safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This defines the exact JSON structure we expect from the frontend
class TaskCreateRequest(BaseModel):
    name: str

# Our single vertical slice endpoint
@app.post("/api/tasks")
def create_task(payload: TaskCreateRequest):
    # This reaches out to Neo4j, saves the node, and returns it
    new_task = Task(name=payload.name).save()
    
    return {
        "id": new_task.element_id, 
        "name": new_task.name, 
        "status": "Saved to DB!"
    }