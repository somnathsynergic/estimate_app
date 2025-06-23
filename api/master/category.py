from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import SearchByCategory, EditCategory, AddCategory
from datetime import datetime
from typing import Dict, Any
from urllib.parse import quote

categoryRouter = APIRouter()

#=================================================================================================
# Category List

@categoryRouter.get('/category_list/{comp_id}')
async def category_list(comp_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get list of categories for a company.
    
    Args:
        comp_id: Company ID
        db: Database session
    
    Returns:
        Dict containing category list
    """
    try:        
        query = text("""
            SELECT sl_no, category_name, catg_picture 
            FROM md_category 
            WHERE comp_id = :comp_id
        """)
        
        result = db.execute(query, {"comp_id": comp_id})
        records = result.fetchall()
        column_names = list(result.keys())
        
        if not records:
            return {"status": 0, "msg": []}
            
        return {
            "status": 1,
            "msg": createResponse(records, column_names, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching categories: {str(e)}"
        )

#=================================================================================================
# Search Items by Category

@categoryRouter.post('/categorywise_item_list')
async def categorywise_item_list(catg: SearchByCategory, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get list of items by category.
    
    Args:
        catg: Search parameters including company, branch, and category IDs
        db: Database session
    
    Returns:
        Dict containing item list
    """
    try:
        # Base query for all items
        base_query = """
            SELECT a.*, b.*, c.unit_name, d.stock 
            FROM md_items a
            JOIN md_item_rate b ON a.id = b.item_id
            LEFT JOIN md_unit c ON c.sl_no = a.unit_id
            LEFT JOIN td_stock d ON d.comp_id = a.comp_id 
                AND d.item_id = a.id
            WHERE a.comp_id = :comp_id 
            AND d.br_id = :br_id
        """
        
        # Add category filter if specified
        if catg.catg_id > 0:
            base_query += " AND a.catg_id = :catg_id"
            
        query = text(base_query)
        params = {
            "comp_id": catg.comp_id,
            "br_id": catg.br_id,
            "catg_id": catg.catg_id
        }
        result = db.execute(query, params)
        records = result.fetchall()
        column_names = list(result.keys())
        
        if not records:
            return {"status": 0, "msg": []}
            
        return {
            "status": 1,
            "msg": createResponse(records, column_names, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching items: {str(e)}"
        )

#=================================================================================================
# Update Category

@categoryRouter.post('/edit_category')
async def edit_category(edit: EditCategory, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Update category details.
    
    Args:
        edit: Category update details
        db: Database session
    
    Returns:
        Dict containing update status
    """
    try:
        formatted_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        query = text("""
            UPDATE md_category 
            SET category_name = :category_name,
                modified_by = :modified_by,
                modified_at = :modified_at
            WHERE sl_no = :sl_no 
            AND comp_id = :comp_id
        """)
        
        result = db.execute(query, {
            "category_name": edit.category_name,
            "modified_by": edit.modified_by,
            "modified_at": formatted_dt,
            "sl_no": edit.sl_no,
            "comp_id": edit.comp_id
        })
        
        db.commit()
        
        if result.rowcount > 0:
            return {
                "status": 1,
                "data": "Category Edited Successfully"
            }
        return {
            "status": 0,
            "data": "No changes made to category"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating category: {str(e)}"
        )

#=================================================================================================
# Add Category

@categoryRouter.post('/add_category')
async def add_category(add_cat: AddCategory, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Add a new category.
    
    Args:
        add_cat: New category details
        db: Database session
    
    Returns:
        Dict containing addition status
    """
    try:
        formatted_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        query = text("""
            INSERT INTO md_category (
                comp_id, category_name, created_by, created_at
            ) VALUES (
                :comp_id, :category_name, :created_by, :created_at
            )
        """)
        
        result = db.execute(query, {
            "comp_id": add_cat.comp_id,
            "category_name": add_cat.category_name,
            "created_by": add_cat.created_by,
            "created_at": formatted_dt
        })
        
        db.commit()
        
        if result.rowcount > 0:
            return {
                "status": 1,
                "data": "Category Added Successfully"
            }
        return {
            "status": 0,
            "data": "Failed to add category"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error adding category: {str(e)}"
        )