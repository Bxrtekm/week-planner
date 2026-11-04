from fastapi import FastAPI

from app.routers import health

app = FastAPI(title="Week Planner")

app.include_router(health.router, prefix="/api")
