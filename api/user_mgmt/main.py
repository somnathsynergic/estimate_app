from fastapi import APIRouter

from . import user

router = APIRouter(prefix="/api", tags=["User API"])


router.include_router(user.userRouter)
