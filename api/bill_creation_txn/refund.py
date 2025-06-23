from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import RefundItem, RefundList
from datetime import datetime
from typing import List, Dict, Any

refRouter = APIRouter()

#=================================================================================================
# Refund Item

@refRouter.post('/refund_item')
async def refund_item(refund: List[RefundItem], db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Process refund for multiple items and update stock.
    
    Args:
        refund: List of items to be refunded
        db: Database session
    
    Returns:
        Dict containing status and refund receipt number
    """
    try:
        current_datetime = datetime.now()
        receipt = int(round(current_datetime.timestamp()))
        formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        
        # Calculate total GST amounts
        tcgst_amt = sum(item.cgst_amt for item in refund)
        tsgst_amt = sum(item.sgst_amt for item in refund)

        # Begin transaction
        try:
            # Process each refund item
            for item in refund:
                # Insert refund item
                refund_query = text("""
                    INSERT INTO td_refund_item (
                        receipt_no, refund_dt, refund_rcpt_no, comp_id, br_id, 
                        item_id, price, dis_pertg, discount_amt, cgst_prtg, 
                        cgst_amt, sgst_prtg, sgst_amt, qty, refund_by, refund_at
                    ) VALUES (
                        :receipt_no, :refund_dt, :refund_rcpt_no, :comp_id, :br_id,
                        :item_id, :price, :dis_pertg, :discount_amt, :cgst_prtg,
                        :cgst_amt, :sgst_prtg, :sgst_amt, :qty, :refund_by, :refund_at
                    )
                """)
                
                db.execute(refund_query, {
                    "receipt_no": item.receipt_no,
                    "refund_dt": formatted_datetime,
                    "refund_rcpt_no": receipt,
                    "comp_id": item.comp_id,
                    "br_id": item.br_id,
                    "item_id": item.item_id,
                    "price": item.price,
                    "dis_pertg": item.dis_pertg,
                    "discount_amt": item.discount_amt,
                    "cgst_prtg": item.cgst_prtg,
                    "cgst_amt": item.cgst_amt,
                    "sgst_prtg": item.sgst_prtg,
                    "sgst_amt": item.sgst_amt,
                    "qty": item.qty,
                    "refund_by": item.user_id,
                    "refund_at": formatted_datetime
                })

                # Update stock
                stock_query = text("""
                    UPDATE td_stock 
                    SET stock = stock + :qty,
                        modified_by = :modified_by,
                        modified_dt = :modified_dt
                    WHERE comp_id = :comp_id 
                    AND br_id = :br_id 
                    AND item_id = :item_id
                """)

                result = db.execute(stock_query, {
                    "qty": item.qty,
                    "modified_by": item.user_id,
                    "modified_dt": formatted_datetime,
                    "comp_id": item.comp_id,
                    "br_id": item.br_id,
                    "item_id": item.item_id
                })

                if result.rowcount != 1:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to update stock for item {item.item_id}"
                    )

            # Insert refund bill
            bill_query = text("""
                INSERT INTO td_refund_bill (
                    receipt_no, refund_dt, refund_rcpt_no, price, discount_amt,
                    cgst_amt, sgst_amt, amount, round_off, net_amt, pay_mode,
                    received_amt, cust_name, phone_no, gst_flag, gst_type,
                    discount_flag, discount_type, discount_position, refund_by, refund_at
                ) VALUES (
                    :receipt_no, :refund_dt, :refund_rcpt_no, :price, :discount_amt,
                    :cgst_amt, :sgst_amt, :amount, :round_off, :net_amt, :pay_mode,
                    :received_amt, :cust_name, :phone_no, :gst_flag, :gst_type,
                    :discount_flag, :discount_type, :discount_position, :refund_by, :refund_at
                )
            """)

            db.execute(bill_query, {
                "receipt_no": refund[0].receipt_no,
                "refund_dt": formatted_datetime,
                "refund_rcpt_no": receipt,
                "price": refund[0].tprice,
                "discount_amt": refund[0].tdiscount_amt,
                "cgst_amt": tcgst_amt,
                "sgst_amt": tsgst_amt,
                "amount": refund[0].tot_refund_amt,
                "round_off": refund[0].round_off,
                "net_amt": refund[0].net_amt,
                "pay_mode": refund[0].pay_mode,
                "received_amt": refund[0].received_amt,
                "cust_name": refund[0].cust_name,
                "phone_no": refund[0].phone_no,
                "gst_flag": refund[0].gst_flag,
                "gst_type": refund[0].gst_type,
                "discount_flag": refund[0].discount_flag,
                "discount_type": refund[0].discount_type,
                "discount_position": refund[0].discount_position,
                "refund_by": refund[0].user_id,
                "refund_at": formatted_datetime
            })

            # Commit transaction
            db.commit()
            return {"status": 1, "data": receipt}

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error processing refund: {str(e)}"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

#=================================================================================================
# Refund List

@refRouter.post('/refund_list')
async def refund_list(ref: RefundList, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Get list of refundable receipts for a customer within specified days.
    
    Args:
        ref: RefundList parameters including company, branch, phone, and days
        db: Database session
    
    Returns:
        List of refundable receipts
    """
    try:
        query = text("""
            SELECT DISTINCT 
                a.receipt_no, 
                a.trn_date, 
                a.net_amt, 
                a.phone_no 
            FROM td_receipt a, td_item_sale b 
            WHERE a.receipt_no = b.receipt_no 
            AND b.comp_id = :comp_id 
            AND b.br_id = :br_id 
            AND a.phone_no = :phone_no 
            AND a.trn_date BETWEEN DATE_SUB(DATE(now()), INTERVAL :ref_days-1 DAY) 
            AND DATE(now()) 
            ORDER BY a.trn_date DESC
        """)

        records = db.execute(query, {
            "comp_id": ref.comp_id,
            "br_id": ref.br_id,
            "phone_no": ref.phone_no,
            "ref_days": ref.ref_days
        }).fetchall()

        return createResponse(records, db.columns_dict, 1)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching refund list: {str(e)}"
        )