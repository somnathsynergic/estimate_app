from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import AddUnit, EditUnit
from datetime import datetime
from typing import Dict, Any, List
from urllib.parse import quote

unitRouter = APIRouter()

#=================================================================================================
# Unit Management

@unitRouter.post('/add_unit')
async def add_unit(add_unit: AddUnit, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Add a new unit to the system.
    
    Args:
        add_unit: Unit details to add
        db: Database session
    
    Returns:
        Dict containing operation status and message
    """
    try:
        formatted_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        query = text("""
            INSERT INTO md_unit (
                comp_id, unit_name, created_by, created_at
            ) VALUES (
                :comp_id, :unit_name, :created_by, :created_at
            )
        """)
        
        result = db.execute(query, {
            "comp_id": add_unit.comp_id,
            "unit_name": add_unit.unit_name,
            "created_by": add_unit.created_by,
            "created_at": formatted_dt
        })
        
        db.commit()
        
        if result.rowcount > 0:
            return {
                "status": 1,
                "data": "Unit Added Successfully"
            }
        return {
            "status": 0,
            "data": "Failed to add unit"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error adding unit: {str(e)}"
        )

@unitRouter.get('/units/{comp_id}')
async def unit_list(comp_id: int, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Get list of all units for a company.
    
    Args:
        comp_id: Company ID
        db: Database session
    
    Returns:
        List of units with their details
    """
    try:
        query = text("""
            SELECT * 
            FROM md_unit 
            WHERE comp_id = :comp_id
        """)
        
        records = db.execute(query, {
            "comp_id": comp_id
        }).fetchall()
        
        return createResponse(records, db.column_names, 1)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching units: {str(e)}"
        )

@unitRouter.post('/edit_unit')
async def edit_unit(edit: EditUnit, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Update unit details.
    
    Args:
        edit: Updated unit details
        db: Database session
    
    Returns:
        Dict containing operation status and message
    """
    try:
        formatted_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        query = text("""
            UPDATE md_unit 
            SET unit_name = :unit_name,
                modified_by = :modified_by,
                modified_at = :modified_at
            WHERE sl_no = :sl_no 
            AND comp_id = :comp_id
        """)
        
        result = db.execute(query, {
            "unit_name": edit.unit_name,
            "modified_by": edit.modified_by,
            "modified_at": formatted_dt,
            "sl_no": edit.sl_no,
            "comp_id": edit.comp_id
        })
        
        db.commit()
        
        if result.rowcount > 0:
            return {
                "status": 1,
                "data": "Unit Edited Successfully"
            }
        return {
            "status": 0,
            "data": "No changes made to unit"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating unit: {str(e)}"
        )
