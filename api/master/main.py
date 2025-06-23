from fastapi import APIRouter

from . import category,master,unit

router = APIRouter(prefix="/api", tags=["Masters API"])

router.include_router(category.categoryRouter)
router.include_router(master.masterRouter)
router.include_router(unit.unitRouter)


