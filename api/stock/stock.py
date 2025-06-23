from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from config.database import get_db
from models.sqlalchemy_models import Stock, Item, Unit
from models.form_model import InventorySearch, UpdateStock, StockReport
from datetime import datetime

stockRouter = APIRouter()

# Inventory Searching
@stockRouter.post('/stock')
async def stock(st_list: InventorySearch, db: Session = Depends(get_db)):
    stock = db.query(Stock.stock).filter(
        Stock.comp_id == st_list.comp_id,
        Stock.br_id == st_list.br_id,
        Stock.item_id == st_list.item_id
    ).first()

    if not stock:
        return {"stock": 0}  # Return 0 if no stock found
        
    return {"stock": stock.stock}

# Stock update
@stockRouter.post('/update_stock')
async def update_stock(update: UpdateStock, db: Session = Depends(get_db)):
    try:
        stock = db.query(Stock).filter(
            Stock.comp_id == update.comp_id,
            Stock.br_id == update.br_id,
            Stock.item_id == update.item_id
        ).first()

        if not stock:
            return {"status": 0, "data": "Stock record not found"}

        # Calculate new stock and update record
        stock.stock = (stock.stock + update.added_stock) - update.removed_stock
        stock.modified_by = update.user_id
        stock.modified_dt = datetime.now()

        try:
            db.commit()
            return {"status": 1, "data": "Stock updated Successfully"}
        except Exception:
            db.rollback()
            return {"status": 0, "data": "Error while updating Stock"}
    except Exception:
        print("An exception occurred")
        return {"status": 0, "data": "Error while updating Stock"}

# Stock Report
@stockRouter.post('/stock_report')
async def stock_report(stk_rep: StockReport, db: Session = Depends(get_db)):
    stocks = db.query(
        Stock.item_id,
        Item.item_name,
        Unit.unit_name,
        Stock.stock,
        Stock.created_by,
        Stock.created_dt,
        Stock.modified_by,
        Stock.modified_dt
    ).join(
        Item, and_(
            Stock.item_id == Item.id,
            Stock.comp_id == Item.comp_id
        )
    ).outerjoin(
        Unit, Unit.sl_no == Item.unit_id
    ).filter(
        Stock.comp_id == stk_rep.comp_id,
        Stock.br_id == stk_rep.br_id
    ).all()

    # Convert SQLAlchemy Row objects to dictionaries
    result = []
    for stock in stocks:
        result.append({
            "item_id": stock.item_id,
            "item_name": stock.item_name,
            "unit_name": stock.unit_name,
            "stock": stock.stock,
            "created_by": stock.created_by,
            "created_dt": stock.created_dt,
            "modified_by": stock.modified_by,
            "modified_dt": stock.modified_dt
        })

    return result