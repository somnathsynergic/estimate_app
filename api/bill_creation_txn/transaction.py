from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import Receipt, SearchBill, AddEditTXN, UserInfo
from datetime import datetime
from typing import List, Dict, Any, Optional

tnxRouter = APIRouter()

#=================================================================================================
# Helper Functions

async def get_user_info(comp_id: int, br_id: int, db: Session) -> Dict[str, Any]:
    """Get user information by company and branch ID."""
    try:
        query = text("SELECT user_name FROM md_user WHERE comp_id = :comp_id AND br_id = :br_id")
        result = db.execute(query, {"comp_id": comp_id, "br_id": br_id}).fetchall()
        
        if result:
            return {"status": 1, "data": createResponse(result, db.column_names, 1)}
        return {"status": 0, "data": []}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user info: {str(e)}")

async def process_kot(receipt: str, table_no: int, formatted_datetime: str, curr_date: str, db: Session) -> Dict[str, Any]:
    """Process Kitchen Order Ticket (KOT)."""
    try:
        kot_query = text("""
            SELECT IFNULL(MAX(kot_no), 0) + 1 as kot_no 
            FROM td_kot WHERE DATE(kot_date) = :curr_date
        """)
        
        kot_result = db.execute(kot_query, {"curr_date": curr_date}).fetchone()
        
        if not kot_result:
            return {"status": 0, "msg": "Error generating KOT number"}
            
        kot_no = kot_result[0]
        
        insert_query = text("""
            INSERT INTO td_kot (kot_no, kot_date, receipt_no, table_no) 
            VALUES (:kot_no, :kot_date, :receipt_no, :table_no)
        """)
        
        db.execute(insert_query, {
            "kot_no": kot_no,
            "kot_date": formatted_datetime,
            "receipt_no": receipt,
            "table_no": table_no
        })
        
        return {"status": 1, "kot_no": kot_no}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing KOT: {str(e)}")

async def process_recovery(rcpt_data: Receipt, receipt: str, formatted_datetime: str, db: Session) -> Dict[str, Any]:
    """Process recovery for credit payments."""
    if rcpt_data.pay_mode != 'R':
        return {"status": 1, "msg": "Not a credit payment"}
        
    try:
        # Get current due amount
        query = text("""
            SELECT curr_due_amt FROM td_recovery_new 
            WHERE comp_id = :comp_id AND br_id = :br_id AND phone_no = :phone_no 
            ORDER BY recover_id DESC LIMIT 1
        """)
        
        result = db.execute(query, {
            "comp_id": rcpt_data.comp_id,
            "br_id": rcpt_data.br_id,
            "phone_no": rcpt_data.phone_no
        }).fetchone()
        
        curr_due_amt = result[0] if result else 0
        curr_due_amt += rcpt_data.net_amt
        
        # Insert initial recovery record
        insert_query = text("""
            INSERT INTO td_recovery_new (
                comp_id, br_id, recover_dt, receipt_no, phone_no, paid_amt, 
                due_amt, curr_due_amt, pay_mode, created_by, created_dt
            ) VALUES (
                :comp_id, :br_id, :recover_dt, :receipt_no, :phone_no, 0,
                :due_amt, :curr_due_amt, :pay_mode, :created_by, :created_dt
            )
        """)
        
        db.execute(insert_query, {
            "comp_id": rcpt_data.comp_id,
            "br_id": rcpt_data.br_id,
            "recover_dt": formatted_datetime,
            "receipt_no": receipt,
            "phone_no": rcpt_data.phone_no,
            "due_amt": rcpt_data.net_amt,
            "curr_due_amt": curr_due_amt,
            "pay_mode": rcpt_data.pay_mode,
            "created_by": rcpt_data.created_by,
            "created_dt": formatted_datetime
        })
        
        if int(rcpt_data.received_amt) > 0:
            curr_due_amt -= int(rcpt_data.received_amt)
            payment_query = text("""
                INSERT INTO td_recovery_new (
                    comp_id, br_id, recover_dt, receipt_no, phone_no, paid_amt,
                    due_amt, curr_due_amt, pay_mode, created_by, created_dt
                ) VALUES (
                    :comp_id, :br_id, :recover_dt, :receipt_no, :phone_no, :paid_amt,
                    0, :curr_due_amt, :pay_mode, :created_by, :created_dt
                )
            """)
            
            db.execute(payment_query, {
                "comp_id": rcpt_data.comp_id,
                "br_id": rcpt_data.br_id,
                "recover_dt": formatted_datetime,
                "receipt_no": receipt,
                "phone_no": rcpt_data.phone_no,
                "paid_amt": rcpt_data.received_amt,
                "curr_due_amt": curr_due_amt,
                "pay_mode": rcpt_data.pay_mode,
                "created_by": rcpt_data.created_by,
                "created_dt": formatted_datetime
            })
            
        return {"status": 1, "msg": "Recovery processed successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing recovery: {str(e)}")

#=================================================================================================
# API Endpoints

@tnxRouter.post('/saleinsert')
async def sale_insert(rcpt: List[Receipt], db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Process a sale transaction including items, KOT, and recovery if applicable.
    """

    print("Received sale data:", rcpt)
    try:
        current_datetime = datetime.now()
        receipt_time = int(round(current_datetime.timestamp()))
        formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        curr_date = current_datetime.strftime("%Y-%m-%d")
        
        # Generate receipt number
        receipt = f'{rcpt[0].user_name[0:3].upper()}{rcpt[0].branch_name[0:3].upper()}{receipt_time}'
        
        # Calculate totals
        tcgst_amt = sum(item.cgst_amt for item in rcpt)
        tsgst_amt = sum(item.sgst_amt for item in rcpt)
        
        # Process each item in the sale
        for item in rcpt:
            # Insert sale item
            sale_query = text(
                "INSERT INTO td_item_sale ("
                "receipt_no, comp_id, br_id, item_id, trn_date, price, dis_pertg, "
                "discount_amt, cgst_prtg, cgst_amt, sgst_prtg, sgst_amt, qty, "
                "created_by, created_dt"
                ") VALUES ("
                ":receipt_no, :comp_id, :br_id, :item_id, :trn_date, :price, "
                ":dis_pertg, :discount_amt, :cgst_prtg, :cgst_amt, :sgst_prtg, "
                ":sgst_amt, :qty, :created_by, :created_dt)"
            )
            
            db.execute(sale_query, {
                "receipt_no": receipt,
                "comp_id": item.comp_id,
                "br_id": item.br_id,
                "item_id": item.item_id,
                "trn_date": formatted_datetime,
                "price": item.price,
                "dis_pertg": item.dis_pertg,
                "discount_amt": item.discount_amt,
                "cgst_prtg": item.cgst_prtg,
                "cgst_amt": item.cgst_amt,
                "sgst_prtg": item.sgst_prtg,
                "sgst_amt": item.sgst_amt,
                "qty": item.qty,
                "created_by": item.created_by,
                "created_dt": formatted_datetime
            })
            
            # Update stock if needed
            if item.stock_flag == 'Y':
                stock_query = text(
                    "UPDATE td_stock SET "
                    "stock = stock - :qty, "
                    "modified_by = :modified_by, "
                    "modified_dt = :modified_dt "
                    "WHERE comp_id = :comp_id "
                    "AND br_id = :br_id "
                    "AND item_id = :item_id"
                )
                
                result = db.execute(stock_query, {
                    "qty": item.qty,
                    "modified_by": item.created_by,
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
        
        # Insert receipt
        receipt_query = text(
            "INSERT INTO td_receipt ("
            "receipt_no, comp_id, br_id, trn_date, price, discount_amt, "
            "cgst_amt, sgst_amt, amount, round_off, net_amt, pay_mode, "
            "received_amt, pay_dtls, cust_name, phone_no, rcv_cash_flag, "
            "gst_flag, gst_type, discount_flag, discount_type, "
            "discount_position, created_by, created_dt"
            ") VALUES ("
            ":receipt_no, :comp_id, :br_id, :trn_date, :price, :discount_amt, "
            ":cgst_amt, :sgst_amt, :amount, :round_off, :net_amt, :pay_mode, "
            ":received_amt, :pay_dtls, :cust_name, :phone_no, :rcv_cash_flag, "
            ":gst_flag, :gst_type, :discount_flag, :discount_type, "
            ":discount_position, :created_by, :created_dt)"
        )
        
        db.execute(receipt_query, {
            "receipt_no": receipt,
            "comp_id": rcpt[0].comp_id,
            "br_id": rcpt[0].br_id,
            "trn_date": formatted_datetime,
            "price": rcpt[0].tprice,
            "discount_amt": rcpt[0].tdiscount_amt,
            "cgst_amt": tcgst_amt,
            "sgst_amt": tsgst_amt,
            "amount": rcpt[0].amount,
            "round_off": rcpt[0].round_off,
            "net_amt": rcpt[0].net_amt,
            "pay_mode": rcpt[0].pay_mode,
            "received_amt": rcpt[0].received_amt,
            "pay_dtls": rcpt[0].pay_dtls,
            "cust_name": rcpt[0].cust_name,
            "phone_no": rcpt[0].phone_no or '0000000000',
            "rcv_cash_flag": rcpt[0].rcv_cash_flag,
            "gst_flag": rcpt[0].gst_flag,
            "gst_type": rcpt[0].gst_type,
            "discount_flag": rcpt[0].discount_flag,
            "discount_type": rcpt[0].discount_type,
            "discount_position": rcpt[0].discount_position,
            "created_by": rcpt[0].created_by,
            "created_dt": formatted_datetime
        })
        
        # Process KOT if needed
        kot_result = None
        if rcpt[0].kot_flag == 'Y':
            kot_result = await process_kot(
                receipt, rcpt[0].table_no, 
                formatted_datetime, curr_date, db
            )
        
        # Process recovery for credit payments
        recovery_result = await process_recovery(
            rcpt[0], receipt, formatted_datetime, db
        )
        
        # Update or insert customer information
        if rcpt[0].phone_no:
            if rcpt[0].cust_info_flag > 0:
                customer_query = text(
                    "UPDATE md_customer SET "
                    "cust_name = :cust_name, "
                    "pay_mode = :pay_mode, "
                    "modified_by = :modified_by, "
                    "modified_dt = :modified_dt "
                    "WHERE phone_no = :phone_no "
                    "AND comp_id = :comp_id"
                )
            else:
                customer_query = text(
                    "INSERT INTO md_customer ("
                    "comp_id, cust_name, phone_no, pay_mode, created_by, created_dt"
                    ") VALUES ("
                    ":comp_id, :cust_name, :phone_no, :pay_mode, :created_by, :created_dt"
                    ")"
                )
            
            db.execute(customer_query, {
                "comp_id": rcpt[0].comp_id,
                "cust_name": rcpt[0].cust_name,
                "phone_no": rcpt[0].phone_no,
                "pay_mode": rcpt[0].pay_mode,
                "created_by": rcpt[0].created_by,
                "created_dt": formatted_datetime,
                "modified_by": rcpt[0].created_by,
                "modified_dt": formatted_datetime
            })
        
        # Commit transaction
        db.commit()
        resdt = {
            "status": 1,
            "data": {
                "status": 1,
                "data": receipt,
                "kot_data": kot_result,
                "recovery_data": recovery_result
            }
        }
        
        return resdt

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing sale: {str(e)}"
        )

@tnxRouter.get('/show_bill/{recp_no}')
async def show_bill(recp_no: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get bill details by receipt number."""
    try:
        query = text(
            "SELECT "
            "a.receipt_no, a.comp_id, a.br_id, a.item_id, a.trn_date, "
            "a.price, a.dis_pertg, a.discount_amt, a.cgst_prtg, "
            "a.cgst_amt, a.sgst_prtg, a.sgst_amt, a.qty, "
            "a.created_by, a.created_dt, a.modified_by, a.modified_dt, "
            "b.price AS tprice, b.discount_amt AS tdiscount_amt, "
            "b.cgst_amt AS tcgst_amt, b.sgst_amt AS tsgst_amt, "
            "b.amount, b.round_off, b.net_amt, b.pay_mode, "
            "b.received_amt, b.pay_dtls, b.cust_name, b.phone_no, "
            "b.rcv_cash_flag, b.gst_flag, b.gst_type, "
            "b.discount_flag, b.discount_type, b.discount_position, "
            "b.created_by AS tcreated_by, b.created_dt AS tcreated_dt, "
            "b.modified_by AS tmodified_by, b.modified_dt AS tmodified_dt, "
            "c.item_name "
            "FROM td_item_sale a "
            "JOIN td_receipt b ON a.receipt_no = b.receipt_no "
            "AND a.trn_date = b.trn_date "
            "JOIN md_items c ON a.item_id = c.id "
            "WHERE a.receipt_no = :recp_no"
        )
        result = db.execute(query, {"recp_no": recp_no})
        records = result.fetchall()
        column_names = list(result.keys())
        
        if not records:
            return {
                "status": 0,
                "cancel_flag": "N",
                "data": []
            }
        
        # Check if bill is cancelled
        cancel_query = text(
            "SELECT COUNT(*) as count "
            "FROM td_receipt_cancel_new "
            "WHERE receipt_no = :recp_no"
        )
        
        cancel_result = db.execute(cancel_query, {"recp_no": recp_no}).fetchone()
        
        return {
            "status": 1,
            "cancel_flag": "Y" if cancel_result[0] > 0 else "N",
            "data": createResponse(records, column_names, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching bill: {str(e)}"
        )

@tnxRouter.post('/search_bills')
async def search_bills(search: SearchBill, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Search bills within a date range."""
    try:
        query = text(
            "SELECT * FROM td_receipt "
            "WHERE comp_id = :comp_id "
            "AND br_id = :br_id "
            "AND created_by = :user_id "
            "AND trn_date BETWEEN :from_date AND :to_date "
            "AND receipt_no NOT IN ("
            "SELECT receipt_no FROM td_receipt_cancel_new)"
        )
        result = db.execute(query, {
            "comp_id": search.comp_id,
            "br_id": search.br_id,
            "user_id": search.user_id,
            "from_date": search.from_date,
            "to_date": search.to_date
        })
        records = result.fetchall()
        column_names = list(result.keys())
        
        if not records:
            return {"status": 0, "data": []}
            
        return {
            "status": 1,
            "data": createResponse(records, column_names, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching bills: {str(e)}"
        )

@tnxRouter.get('/receipt_url')
async def receipt_url(receipt_no: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get receipt URL by receipt number."""
    try:
        query = text(
            "SELECT receipt_no, receipt_url "
            "FROM td_txn_dtls "
            "WHERE receipt_no = :receipt_no"
        )
        result = db.execute(query, {"receipt_no": receipt_no})
        records = result.fetchall()
        column_names = list(result.keys())
        
        if not records:
            return {"status": 0, "data": []}
            
        return {
            "status": 1,
            "data": createResponse(records, column_names, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching receipt URL: {str(e)}"
        )

@tnxRouter.post('/add_txn_dtls')
async def add_transaction_details(data: AddEditTXN, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Add transaction details."""
    try:
        formatted_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        query = text(
            "INSERT INTO td_txn_dtls ("
            "receipt_no, pay_txn_id, pay_amount, pay_amount_original, "
            "currency_code, payment_mode, pay_status, receipt_url, "
            "created_by, created_dt"
            ") VALUES ("
            ":receipt_no, :pay_txn_id, :pay_amount, :pay_amount_original, "
            ":currency_code, :payment_mode, :pay_status, :receipt_url, "
            ":created_by, :created_dt)"
        )
        
        db.execute(query, {
            "receipt_no": data.receipt_no,
            "pay_txn_id": data.pay_txn_id,
            "pay_amount": data.pay_amount,
            "pay_amount_original": data.pay_amount_original,
            "currency_code": data.currency_code,
            "payment_mode": data.payment_mode,
            "pay_status": data.pay_status,
            "receipt_url": data.receipt_url,
            "created_by": data.created_by,
            "created_dt": formatted_dt
        })
        
        db.commit()
        return {
            "status": 1,
            "data": "Transaction Details Added Successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error adding transaction details: {str(e)}"
        )