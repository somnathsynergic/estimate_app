from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import CancelBill
from datetime import datetime
import datetime as dt

cancelRouter = APIRouter()

#=================================================================================================
# Cancel Bill

@cancelRouter.post('/cancel_bill_two')
async def cancel_bill_two(del_bill: CancelBill, db: Session = Depends(get_db)):
    """
    Cancel a bill and update related records.
    
    Args:
        del_bill: CancelBill model containing receipt_no and user_id
        db: Database session
    
    Returns:
        dict: Response containing status and message
    
    Raises:
        HTTPException: If bill cancellation fails
    """
    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        # Start transaction
        # Check if receipt exists
        query = text("SELECT receipt_no FROM td_receipt WHERE receipt_no = :receipt_no")
        record = db.execute(query, {"receipt_no": del_bill.receipt_no}).fetchone()

        if not record:
            return {"status": 0, "data": "Receipt number not found"}

        try:
            # Insert cancellation record
            query1 = text("""
                INSERT INTO td_receipt_cancel_new 
                (receipt_no, cancelled_by, cancelled_dt) 
                VALUES (:receipt_no, :cancelled_by, :cancelled_dt)
            """)
            params1 = {
                "receipt_no": del_bill.receipt_no,
                "cancelled_by": del_bill.user_id,
                "cancelled_dt": current_datetime
            }
            db.execute(query1, params1)

            # Update sale record
            query2 = text("""
                UPDATE td_item_sale 
                SET cancel_flag = 1, 
                    modified_by = :modified_by, 
                    modified_dt = :modified_dt 
                WHERE receipt_no = :receipt_no
            """)
            params2 = {
                "modified_by": del_bill.user_id,
                "modified_dt": current_datetime,
                "receipt_no": del_bill.receipt_no
            }
            result = db.execute(query2, params2)
            
            if result.rowcount > 0:
                # Commit transaction
                db.commit()
                return {"status": 1, "data": "Bill Cancelled Successfully"}
            else:
                # Rollback if update failed
                db.rollback()
                return {"status": 0, "data": "Failed to update sale record"}

        except Exception as e:
            # Rollback on any error
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error while cancelling bill: {str(e)}"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
