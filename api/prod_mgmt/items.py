from fastapi import APIRouter, File, UploadFile, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import EditItem, AddItem, SearchByBarcode, SearchByCategory
from datetime import datetime
from typing import Dict, Any, List, Optional
import os
from pathlib import Path

UPLOAD_FOLDER = "upload_file"
# Ensure the upload folder exists
Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)

itmRouter = APIRouter()

#=================================================================================================
# File Upload Helper

async def handle_file_upload(file: Optional[UploadFile]) -> Optional[str]:
    """
    Handle file upload with proper error handling.
    
    Args:
        file: The uploaded file
    
    Returns:
        Modified filename if successful, None if no file or upload failed
    """
    if not file:
        return None
        
    try:
        timestamp = int(round(datetime.now().timestamp()))
        modified_filename = f"{timestamp}_{file.filename}"
        file_path = Path(UPLOAD_FOLDER) / modified_filename
        
        # Write file in chunks to handle large files better
        with open(file_path, "wb") as f:
            while contents := await file.read(1024 * 1024):  # Read in 1MB chunks
                f.write(contents)
                
        return modified_filename
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )

#=================================================================================================
# Item Management

@itmRouter.get('/items/{comp_id}')
async def show_items(comp_id: int, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Get list of all items for a company.
    
    Args:
        comp_id: Company ID
        db: Database session
    
    Returns:
        List of items with their details
    """
    try:
        query = text("""
            SELECT a.*, b.*, c.unit_name, d.category_name 
            FROM md_items a 
            JOIN md_item_rate b ON a.id = b.item_id 
            JOIN md_category d ON d.sl_no = a.catg_id 
            LEFT JOIN md_unit c ON c.sl_no = a.unit_id 
            WHERE a.comp_id = :comp_id
        """)
        
        records = db.execute(query, {"comp_id": comp_id}).fetchall()
        return createResponse(records, db.column_names, 1)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching items: {str(e)}"
        )

@itmRouter.post('/edit_item')
async def edit_items(
    comp_id: int = Form(...),
    item_name: str = Form(...),
    item_id: int = Form(...),
    price: float = Form(...),
    discount: float = Form(...),
    cgst: float = Form(...),
    sgst: float = Form(...),
    unit_id: int = Form(...),
    catg_id: int = Form(...),
    modified_by: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update item details."""
    try:
        # Handle file upload
        filename = await handle_file_upload(file) if file else None
        formatted_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Update items and rates
        query = text("""
            UPDATE md_item_rate 
            JOIN md_items ON md_items.id = md_item_rate.item_id 
            SET 
                md_items.item_name = :item_name,
                md_items.item_img = COALESCE(:item_img, md_items.item_img),
                md_item_rate.price = :price,
                md_item_rate.discount = :discount,
                md_item_rate.cgst = :cgst,
                md_item_rate.sgst = :sgst,
                md_items.unit_id = :unit_id,
                md_items.catg_id = :catg_id,
                md_item_rate.modified_by = :modified_by,
                md_item_rate.modified_dt = :modified_dt,
                md_items.modified_by = :modified_by,
                md_items.modified_dt = :modified_dt
            WHERE md_item_rate.item_id = :item_id 
            AND md_items.comp_id = :comp_id
        """)
        
        result = db.execute(query, {
            "item_name": item_name,
            "item_img": f"/uploads/{filename}" if filename else None,            "price": price,
            "discount": discount,
            "cgst": cgst,
            "sgst": sgst,
            "unit_id": unit_id,
            "catg_id": catg_id,
            "modified_by": modified_by,
            "modified_dt": formatted_dt,
            "item_id": item_id,
            "comp_id": comp_id
        })
        
        db.commit()
        
        if result.rowcount > 0:
            return {
                "status": 1,
                "data": "Item updated successfully"
            }
        return {
            "status": 0,
            "data": "No changes made to item"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating item: {str(e)}"
        )

@itmRouter.post('/add_item')
async def add_items(
    comp_id: int = Form(...),
    br_id: int = Form(...),
    hsn_code: str = Form(...),
    item_name: str = Form(...),
    unit_id: int = Form(...),
    catg_id: int = Form(...),
    created_by: str = Form(...),
    price: float = Form(...),
    discount: float = Form(...),
    cgst: float = Form(...),
    sgst: float = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Add a new item with its rate and stock information."""
    try:
        filename = await handle_file_upload(file) if file else None
        formatted_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Insert item
        item_query = text("""
            INSERT INTO md_items (
                comp_id, hsn_code, item_name, item_img, 
                unit_id, catg_id, created_by, created_dt
            ) VALUES (
                :comp_id, :hsn_code, :item_name, :item_img,
                :unit_id, :catg_id, :created_by, :created_dt
            )
        """)
        
        result = db.execute(item_query, {
            "comp_id": comp_id,
            "hsn_code": hsn_code,
            "item_name": item_name,
            "item_img": f"/uploads/{filename}" if filename else "",
            "unit_id": unit_id,
            "catg_id": catg_id,
            "created_by": created_by,
            "created_dt": formatted_dt
        })
        
        item_id = result.lastrowid
        
        # Insert item rate
        rate_query = text("""
            INSERT INTO md_item_rate (
                item_id, price, discount, cgst, sgst, 
                created_by, created_dt
            ) VALUES (
                :item_id, :price, :discount, :cgst, :sgst,
                :created_by, :created_dt
            )
        """)
        
        db.execute(rate_query, {
            "item_id": item_id,
            "price": price,
            "discount": discount,
            "cgst": cgst,
            "sgst": sgst,
            "created_by": created_by,
            "created_dt": formatted_dt
        })
        
        # Initialize stock
        stock_query = text("""
            INSERT INTO td_stock (
                comp_id, br_id, item_id, stock,
                created_by, created_dt
            ) VALUES (
                :comp_id, :br_id, :item_id, :stock,
                :created_by, :created_dt
            )
        """)
        
        db.execute(stock_query, {
            "comp_id": comp_id,
            "br_id": br_id,
            "item_id": item_id,
            "stock": 0,
            "created_by": created_by,
            "created_dt": formatted_dt
        })
        
        db.commit()
        return {
            "status": 1,
            "data": "Item, rate and stock added successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error adding item: {str(e)}"
        )

