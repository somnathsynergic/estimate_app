from fastapi import APIRouter

from . import transaction,recovery,refund

router = APIRouter(prefix="/api", tags=["Bill Creation API"])

router.include_router(transaction.tnxRouter)
router.include_router(recovery.recoRouter)
router.include_router(refund.refRouter)


