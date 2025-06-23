from fastapi import APIRouter

from . import cancelbill

router = APIRouter(prefix="/api", tags=["Bill Cancel API"])

router.include_router(cancelbill.cancelRouter)


