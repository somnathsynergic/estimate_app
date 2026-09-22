from fastapi import APIRouter

from V2.admin.user import userRouter as user
from V2.admin.report import reportRouter as report
from V2.admin.searchbill import searchRouter as searchbill
from V2.admin.settings import settingsRouter as settings
from V2.admin.unit import unitRouter as unit
from V2.admin.items import itemRouter as items
from V2.admin.headerfooter import headerfooterRouter as headerfooter
from V2.admin.customer import customerRouter as customer
from V2.admin.stock import stockRouter as stock
from V2.admin.purchase import purchaseRouter as purchase
from V2.admin.superadmin import superadminRouter as superadmin
from V2.admin.gamification import gamificationRouter as gamification

router = APIRouter(prefix="/admin", tags=["Admin API V2"])


router.include_router(user)
router.include_router(report)
router.include_router(searchbill)
router.include_router(settings)
router.include_router(items)
router.include_router(unit)
router.include_router(headerfooter)
router.include_router(customer)
router.include_router(stock)
router.include_router(purchase)
router.include_router(superadmin)
router.include_router(gamification)






