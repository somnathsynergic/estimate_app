from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import CalReceipt, SaleReport
from datetime import datetime
from typing import List, Dict, Any

CalRouter = APIRouter()

async def get_last_item_id(comp_id: int, db: Session) -> int:
    """Get the last item_id for the company."""
    try:
        query = text("""
            SELECT COUNT(*) as last_rows 
            FROM td_item_sale 
            WHERE comp_id = :comp_id
        """)
        
        result = db.execute(query, {"comp_id": comp_id}).fetchone()
        return result[0] if result else 0
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching last item ID: {str(e)}"
        )

#=================================================================================================
# Calculator Mode

@CalRouter.post('/calculator/saleinsert')
async def calculator(rcpt: List[CalReceipt], db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Process calculator mode sale transaction.
    
    Args:
        rcpt: List of calculator receipt items
        db: Database session
    
    Returns:
        Dict containing status and receipt number
    """
    try:
        current_datetime = datetime.now()
        receipt = int(round(current_datetime.timestamp()))
        formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        curr_date = current_datetime.strftime("%Y-%m-%d")
        
        # Get last item ID
        last_id = await get_last_item_id(rcpt[0].comp_id, db)
        
        try:
            # Process each item
            for item in rcpt:
                item_id = last_id + 1
                last_id += 1
                
                # Insert sale item
                sale_query = text("""
                    INSERT INTO td_item_sale (
                        receipt_no, comp_id, br_id, item_id, trn_date,
                        price, qty, created_by, created_dt
                    ) VALUES (
                        :receipt_no, :comp_id, :br_id, :item_id, :curr_date,
                        :price, :qty, :created_by, :formatted_datetime
                    )
                """)
                
                db.execute(sale_query, {
                    "receipt_no": receipt,
                    "comp_id": item.comp_id,
                    "br_id": item.br_id,
                    "item_id": item_id,
                    "curr_date": curr_date,
                    "price": item.price,
                    "qty": item.qty,
                    "created_by": item.created_by,
                    "formatted_datetime": formatted_datetime
                })
            
            # Insert receipt
            receipt_query = text("""
                INSERT INTO td_receipt (
                    receipt_no, comp_id, br_id, trn_date, price,
                    amount, round_off, net_amt, received_amt,
                    created_by, created_dt
                ) VALUES (
                    :receipt_no, :comp_id, :br_id, :curr_date, :price,
                    :amount, :round_off, :net_amt, :received_amt,
                    :created_by, :formatted_datetime
                )
            """)
            
            db.execute(receipt_query, {
                "receipt_no": receipt,
                "comp_id": rcpt[0].comp_id,
                "br_id": rcpt[0].br_id,
                "curr_date": curr_date,
                "price": rcpt[0].tprice,
                "amount": rcpt[0].tprice,
                "round_off": rcpt[0].round_off,
                "net_amt": rcpt[0].net_amt,
                "received_amt": rcpt[0].tprice,
                "created_by": rcpt[0].created_by,
                "formatted_datetime": formatted_datetime
            })
            
            # Commit transaction
            db.commit()
            return {"status": 1, "data": receipt}
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error processing calculator sale: {str(e)}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

@CalRouter.get('/calculator/show_bill')
async def show_bill(recp_no: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get calculator bill details by receipt number.
    
    Args:
        recp_no: Receipt number to look up
        db: Database session
    
    Returns:
        Dict containing bill details
    """
    try:
        query = text("""
            SELECT 
                a.receipt_no, a.comp_id, a.br_id, a.trn_date,
                a.price, a.qty, a.created_by, a.created_dt,
                a.modified_by, a.modified_dt,
                b.price AS tprice, b.round_off, b.net_amt,
                b.created_by AS tcreated_by, b.created_dt AS tcreated_dt,
                b.modified_by AS tmodified_by, b.modified_dt AS tmodified_dt
            FROM td_item_sale a
            JOIN td_receipt b ON a.receipt_no = b.receipt_no 
                AND a.trn_date = b.trn_date
            WHERE a.receipt_no = :recp_no
        """)
        
        records = db.execute(query, {"recp_no": recp_no}).fetchall()
        
        if not records:
            return {"status": 0, "data": []}
            
        return {
            "status": 1,
            "data": createResponse(records, db.column_names, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching bill: {str(e)}"
        )

#=================================================================================================
# Sale Report

@CalRouter.post('/calculator/sale_report')
async def sale_report(sl_rep: SaleReport, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Generate sale report for a date range.
    
    Args:
        sl_rep: Sale report parameters including date range and company/branch IDs
        db: Database session
    
    Returns:
        Dict containing sale report data
    """
    try:
        query = text("""
            SELECT 
                a.receipt_no, 
                a.trn_date,
                COUNT(b.receipt_no) as no_of_items,
                a.price,
                a.round_off,
                a.net_amt,
                a.created_by
            FROM td_receipt a
            JOIN td_item_sale b ON a.receipt_no = b.receipt_no
            WHERE a.trn_date BETWEEN :from_date AND :to_date
            AND b.comp_id = :comp_id
            AND b.br_id = :br_id
            GROUP BY 
                a.receipt_no, a.trn_date, a.price,
                a.round_off, a.net_amt, a.created_by
            ORDER BY a.trn_date, a.receipt_no
        """)
        
        records = db.execute(query, {
            "from_date": sl_rep.from_date,
            "to_date": sl_rep.to_date,
            "comp_id": sl_rep.comp_id,
            "br_id": sl_rep.br_id
        }).fetchall()
        
        if not records:
            return {"status": 0, "data": []}
            
        return {
            "status": 1,
            "data": createResponse(records, db.column_names, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating sale report: {str(e)}"
        )
