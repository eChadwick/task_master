from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Task
from routes import router

# redirect_slashes=False stops FastAPI from fighting with the browser over trailing slashes
app = FastAPI(redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)