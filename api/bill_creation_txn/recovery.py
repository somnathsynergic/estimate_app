from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import RecoverBill, RecoveryUpdate
from datetime import datetime
from typing import Dict, Any

recoRouter = APIRouter()

@recoRouter.post('/recovery_amount')
async def recovery_amount(bill: RecoverBill, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get recovery amount details for a specific customer.
    """
    try:
        query = text("""
            SELECT SUM(due_amt) net_amt, SUM(paid_amt) paid_amt 
            FROM td_recovery_new 
            WHERE comp_id = :comp_id 
            AND br_id = :br_id 
            AND phone_no = :phone_no
        """)
        result = db.execute(query, {
            "comp_id": bill.comp_id,
            "br_id": bill.br_id,
            "phone_no": bill.phone_no
        })
        
        column_names = ['net_amt', 'paid_amt']  # Column names from the SQL query
        record = result.fetchone()

        if record:
            return {
                "status": 1,
                "data": createResponse([record], column_names, 1)
            }
        return {"status": 0, "data": []}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@recoRouter.post('/recovery_update')
async def recovery_update(recover: RecoveryUpdate, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Update recovery details and process transaction.
    """
    current_datetime = datetime.now()
    receipt = int(round(current_datetime.timestamp()))
    formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

    try:
        # Start transaction
        # Get current due amount
        query = text("""
            SELECT curr_due_amt 
            FROM td_recovery_new 
            WHERE comp_id = :comp_id 
            AND br_id = :br_id 
            AND phone_no = :phone_no 
            ORDER BY recover_id DESC 
            LIMIT 1
        """)
        
        result = db.execute(query, {
            "comp_id": recover.comp_id,
            "br_id": recover.br_id,
            "phone_no": recover.phone_no
        }).fetchone()

        if not result:
            return {"status": -1, "msg": "No existing recovery record found"}

        try:
            curr_due_amt = result[0] - recover.received_amt

            # Insert recovery record
            recovery_query = text("""
                INSERT INTO td_recovery_new 
                (comp_id, br_id, recover_dt, phone_no, paid_amt, due_amt, curr_due_amt, 
                pay_mode, created_by, created_dt) 
                VALUES 
                (:comp_id, :br_id, :recover_dt, :phone_no, :paid_amt, :due_amt, 
                :curr_due_amt, :pay_mode, :created_by, :created_dt)
            """)

            db.execute(recovery_query, {
                "comp_id": recover.comp_id,
                "br_id": recover.br_id,
                "recover_dt": formatted_dt,
                "phone_no": recover.phone_no,
                "paid_amt": recover.received_amt,
                "due_amt": 0,
                "curr_due_amt": curr_due_amt,
                "pay_mode": recover.pay_mode,
                "created_by": recover.user_id,
                "created_dt": formatted_dt
            })

            # If UPI payment, insert transaction details
            if recover.payment_mode == 'U':
                txn_query = text("""
                    INSERT INTO td_txn_dtls 
                    (receipt_no, pay_txn_id, pay_amount, pay_amount_original, 
                    currency_code, payment_mode, pay_status, receipt_url, 
                    created_by, created_dt) 
                    VALUES 
                    (:receipt_no, :pay_txn_id, :pay_amount, :pay_amount_original,
                    :currency_code, :payment_mode, :pay_status, :receipt_url,
                    :created_by, :created_dt)
                """)

                db.execute(txn_query, {
                    "receipt_no": recover.customer_mobile,
                    "pay_txn_id": recover.pay_txn_id,
                    "pay_amount": recover.pay_amount,
                    "pay_amount_original": recover.pay_amount_original,
                    "currency_code": recover.currency_code,
                    "payment_mode": recover.payment_mode,
                    "pay_status": recover.pay_status,
                    "receipt_url": recover.receipt_url,
                    "created_by": recover.user_id,
                    "created_dt": formatted_dt
                })

            # Commit transaction
            db.commit()
            return {
                "status": 1,
                "msg": "Transaction completed successfully"
            }

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error updating recovery details: {str(e)}"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )