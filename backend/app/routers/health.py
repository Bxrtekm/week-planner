from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    # "app" odróżnia nasz backend od innych serwerów na tym samym porcie
    # (np. student-assistant też odpowiada {"status": "ok"} na /api/health).
    return {"status": "ok", "app": "week-planner"}
