from fastapi import APIRouter

from . import settings

router = APIRouter(prefix="/api", tags=["Settings API"])

router.include_router(settings.setRouter)


