from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from config.database import get_db
from models.sqlalchemy_models import ReceiptSettings, HeaderFooter
from models.form_model import EditHeaderFooter, DiscountSettings, GSTSettings, GeneralSettings
from datetime import datetime

setRouter = APIRouter()

# Receipt settings
#-------------------------------------------------------------------------------------------------------------
@setRouter.get('/receipt_settings/{comp_id}')
async def show_items(comp_id: int, db: Session = Depends(get_db)):
    result = db.query(ReceiptSettings, HeaderFooter).join(
        HeaderFooter,
        and_(
            ReceiptSettings.comp_id == HeaderFooter.comp_id,
            ReceiptSettings.comp_id == comp_id
        )
    ).first()

    if not result:
        return []

    # Convert to dict format to maintain compatibility with existing response format
    response = {
        **result.ReceiptSettings.__dict__,
        **result.HeaderFooter.__dict__,
    }
    
    # Remove SQLAlchemy internal properties
    response.pop('_sa_instance_state', None)
    return [response]

# Edit header-footer option for 'M' user type
#-------------------------------------------------------------------------------------------------------------
@setRouter.post('/edit_header_footer')
async def edit_header_footer(edit: EditHeaderFooter, db: Session = Depends(get_db)):
    header_footer = db.query(HeaderFooter).filter(
        HeaderFooter.comp_id == edit.comp_id
    ).first()

    if not header_footer:
        return {"status": 0, "data": "data not found"}

    # Update fields
    current_datetime = datetime.now()
    header_footer.header1 = edit.header1
    header_footer.on_off_flag1 = edit.on_off_flag1
    header_footer.header2 = edit.header2
    header_footer.on_off_flag2 = edit.on_off_flag2
    header_footer.footer1 = edit.footer1
    header_footer.on_off_flag3 = edit.on_off_flag3
    header_footer.footer2 = edit.footer2
    header_footer.on_off_flag4 = edit.on_off_flag4
    header_footer.created_by = edit.created_by
    header_footer.created_at = current_datetime

    try:
        db.commit()
        return {"status": 1, "data": "data edited successfully"}
    except Exception:
        db.rollback()
        return {"status": 0, "data": "data not edited"}

# Edit Settings
#-------------------------------------------------------------------------------------------------------------
@setRouter.post('/edit_discount_settings')
async def edit_discount_settings(rcp_set: DiscountSettings, db: Session = Depends(get_db)):
    receipt_settings = db.query(ReceiptSettings).filter(
        ReceiptSettings.comp_id == rcp_set.comp_id
    ).first()

    if not receipt_settings:
        return {"status": 0, "data": "data not found"}

    # Update fields
    receipt_settings.discount_flag = rcp_set.discount_flag
    receipt_settings.discount_type = rcp_set.discount_type
    receipt_settings.discount_position = rcp_set.discount_position
    receipt_settings.modified_by = rcp_set.modified_by
    receipt_settings.modified_at = datetime.now()

    try:
        db.commit()
        return {"status": 1, "data": "data edited successfully"}
    except Exception:
        db.rollback()
        return {"status": 0, "data": "data not edited"}

# GST Settings
#-----------------------------

@setRouter.post('/edit_gst_settings')
async def edit_gst_settings(rcp_set: GSTSettings, db: Session = Depends(get_db)):
    receipt_settings = db.query(ReceiptSettings).filter(
        ReceiptSettings.comp_id == rcp_set.comp_id
    ).first()

    if not receipt_settings:
        return {"status": 0, "data": "data not found"}

    # Update fields
    receipt_settings.gst_flag = rcp_set.gst_flag
    receipt_settings.gst_type = rcp_set.gst_type
    receipt_settings.modified_by = rcp_set.modified_by
    receipt_settings.modified_at = datetime.now()

    try:
        db.commit()
        return {"status": 1, "data": "data edited successfully"}
    except Exception:
        db.rollback()
        return {"status": 0, "data": "data not edited"}

# General Settings
#-----------------------------

@setRouter.post('/edit_general_settings')
async def edit_general_settings(rcp_set: GeneralSettings, db: Session = Depends(get_db)):
    receipt_settings = db.query(ReceiptSettings).filter(
        ReceiptSettings.comp_id == rcp_set.comp_id
    ).first()

    if not receipt_settings:
        return {"status": 0, "data": "data not found"}

    # Update fields
    receipt_settings.rcv_cash_flag = rcp_set.rcv_cash_flag
    receipt_settings.rcpt_type = rcp_set.rcpt_type
    receipt_settings.unit_flag = rcp_set.unit_flag
    receipt_settings.cust_inf = rcp_set.cust_inf
    receipt_settings.pay_mode = rcp_set.pay_mode
    receipt_settings.stock_flag = rcp_set.stock_flag
    receipt_settings.price_type = rcp_set.price_type
    receipt_settings.refund_days = rcp_set.refund_days
    receipt_settings.kot_flag = rcp_set.kot_flag
    receipt_settings.modified_by = rcp_set.modified_by
    receipt_settings.modified_at = datetime.now()

    try:
        db.commit()
        return {"status": 1, "data": "data edited successfully"}
    except Exception:
        db.rollback()
        return {"status": 0, "data": "data not edited"}