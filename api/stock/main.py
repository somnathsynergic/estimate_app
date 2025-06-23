from fastapi import APIRouter

from . import stock

router = APIRouter(prefix="/api", tags=["Stock API"])

router.include_router(stock.stockRouter)


