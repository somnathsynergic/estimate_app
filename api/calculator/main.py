from fastapi import APIRouter

from . import calculator

router = APIRouter(prefix="/api", tags=["Calculator API"])

router.include_router(calculator.CalRouter)


