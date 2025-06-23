from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import uvicorn
# from api.main import router as apiRouter
from api.reports.main import router as reportRouter
from api.user_mgmt.main import router as userRouter
from api.bill_cancellation.main import router as cancelRouter
from api.bill_creation_txn.main import router as refRouter
from api.bill_creation_txn.main import router as recoRouter
from api.bill_creation_txn.main import router as txnRouter
from api.master.main import router as masterRouter
from api.master.main import router as unitRouter
from api.master.main import router as categoryRouter
from api.calculator.main import router as CalRouter
from api.settings.main import router as setRouter
from api.stock.main import router as stockRouter
# from admin.main import router as adminRouter
# from V2.api.main import router as apiRouterV2
# from V2.admin.main import router as adminRouterV2
# from fastapi.staticfiles import StaticFiles

# testing git
app = FastAPI()
# app.mount("/uploads", StaticFiles(directory="upload_file"), name="uploads")

origins = ["*",]

if __name__ == "__main__":
   uvicorn.run("main:app", host="0.0.0.0", port=3008, workers=2,reload=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(apiRouter)
app.include_router(reportRouter)
app.include_router(userRouter)
app.include_router(cancelRouter)
app.include_router(cancelRouter)
app.include_router(refRouter)
app.include_router(recoRouter)
app.include_router(txnRouter)
app.include_router(masterRouter)
app.include_router(categoryRouter)
app.include_router(unitRouter)
app.include_router(CalRouter)
app.include_router(setRouter)
app.include_router(stockRouter)
# app.include_router(adminRouter)

# 01/02/2025
# app.include_router(apiRouterV2, prefix="/v2")
# app.include_router(adminRouterV2, prefix="/v2")



@app.get('/')
def index():
    return "Welcome to the billing app"


# Configuring Mangum handler with explicit lifespan setting for Lambda
handler = Mangum(app, lifespan="off")