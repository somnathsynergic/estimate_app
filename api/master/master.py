from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from models.master_model import createResponse
from models.form_model import CustInfo
from typing import Dict, Any, List

masterRouter = APIRouter()

#=================================================================================================
# Location Management

@masterRouter.get('/location')
async def show_location(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Get list of all locations.
    
    Args:
        db: Database session
    
    Returns:
        List of locations with their IDs and names
    """    
    try:
        query = text("""
            SELECT sl_no, location_name 
            FROM md_location
        """)
        result = db.execute(query)
        records = result.fetchall()
        column_names = list(result.keys())
        return createResponse(records, column_names, 1)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching locations: {str(e)}"
        )

#=================================================================================================
# App Version Management

@masterRouter.get('/app_version')
async def app_version(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get current app version information.
    
    Args:
        db: Database session
    
    Returns:
        Dict containing version details including version number and update URL
    """
    try:        
        query = text("""
            SELECT sl_no, version_no, url 
            FROM md_version
        """)
        result = db.execute(query)
        records = result.fetchall()
        column_names = list(result.keys())
        
        if not records:
            return {"status": 0, "data": "no data"}
            
        return {
            "status": 1,
            "data": createResponse(records, column_names, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching app version: {str(e)}"
        )

#=================================================================================================
# Customer Information

@masterRouter.post('/cust_info')
async def cust_info(info: CustInfo, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get customer information by company ID and phone number.
    
    Args:
        info: Customer information request containing company ID and phone number
        db: Database session
    
    Returns:
        Dict containing customer details if found
    """
    try:        
        query = text("""
            SELECT cust_name 
            FROM md_customer 
            WHERE comp_id = :comp_id 
            AND phone_no = :phone_no
        """)
        result = db.execute(query, {
            "comp_id": info.comp_id,
            "phone_no": info.phone_no
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
            detail=f"Error fetching customer information: {str(e)}"
        )




