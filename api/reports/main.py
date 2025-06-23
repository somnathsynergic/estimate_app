from fastapi import APIRouter

from . import report

router = APIRouter(prefix="/api", tags=["Report API"])


router.include_router(report.repoRouter)
