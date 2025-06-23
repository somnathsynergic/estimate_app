from fastapi import APIRouter

from . import report

router = APIRouter(prefix="/api", tags=["Items API"])


router.include_router(report.repoRouter)
