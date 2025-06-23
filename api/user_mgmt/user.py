from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from sqlalchemy.exc import SQLAlchemyError
from config.database import get_db
from models.sqlalchemy_models import User, Company, Branch
from models.form_model import LoginFlag, UserLogin, LoginStatus, CreatePIN, Login
from utils import get_hashed_password, verify_password
from typing import Dict, Any

userRouter = APIRouter()

# Helper function for user response
def format_user_response(user) -> Dict[str, Any]:
    return {
        "id": user.User.id,
        "user_name": user.User.user_name,
        "user_type": user.User.user_type,
        "user_id": user.User.user_id,
        "phone_no": user.User.phone_no,
        "email_id": user.User.email_id,
        "device_id": user.User.device_id,
        "active_flag": user.User.active_flag,
        "login_flag": user.User.login_flag,
        "br_id": user.Branch.id,
        "branch_name": user.Branch.branch_name,
        "branch_address": user.Branch.branch_address,
        "location": user.Branch.location, 
        "comp_id": user.Company.id,
        "company_name": user.Company.company_name,
        "mode": user.Company.mode,
        "address": user.Company.address,
        "web_portal": user.Company.web_portal,
        "max_user": user.Company.max_user
    }

# Verify Phone no and active status
@userRouter.post('/verify_phone/{phone_no}')
async def verify(phone_no: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.user_id == str(phone_no),
        User.user_type.in_(['U', 'M']),
        User.phone_no == str(phone_no)
    ).first()

    if not user:
        return {"status": 0, "data": "invalid phone"}
    return {"status": 1, "data": "valid phone no."}

@userRouter.post('/verify_active/{phone_no}')
async def verify(phone_no: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.active_flag == 'N',
        User.user_id == str(phone_no)
    ).first()

    if not user:
        return {"status": -1, "data": "Already registered or invalid phone"}
    return {"status": 1, "data": "registered successfully"}

# Create PIN
@userRouter.post('/create_pin')
async def register(data: CreatePIN, db: Session = Depends(get_db)):
    try:
        hashed_password = get_hashed_password(data.PIN)
        
        user = db.query(User).filter(User.user_id == data.phone_no).first()
        if not user:
            return {"status": 0, "data": "invalid phone"}

        user.password = hashed_password
        user.active_flag = 'Y'
        db.commit()
        return {"status": 1, "data": "Pin inserted"}
    except SQLAlchemyError as e:
        db.rollback()
        return {"status": 0, "data": f"Database error: {str(e)}"}
    except Exception as e:
        db.rollback()
        return {"status": 0, "data": f"Error: {str(e)}"}

# Generate OTP
@userRouter.post('/otp/{phone_no}')
async def OTP(phone_no: int):
    # Implement your OTP generation/validation logic here
    return {"status": 1, "data": "1234"}

@userRouter.post('/update_login_status')
async def update_login_status(data: LoginStatus, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == data.user_id).first()
        if not user:
            return {"suc": 0, "msg": "failed to update login_flag"}

        user.login_flag = 'Y'
        db.commit()
        return {"suc": 1, "msg": "User login flag updated"}
    except SQLAlchemyError as e:
        db.rollback()
        return {"suc": 0, "msg": f"Database error: {str(e)}"}
    except Exception as e:
        db.rollback()
        return {"suc": 0, "msg": f"Error: {str(e)}"}

@userRouter.post('/user_login')
async def user_login(data_login: Login, db: Session = Depends(get_db)):
    try:
        user = db.query(User, Branch, Company).join(
            Branch, User.br_id == Branch.id
        ).join(
            Company, User.comp_id == Company.id
        ).filter(
            User.user_id == data_login.user_id,
            User.active_flag == 'Y',
            User.user_type != 'M'
        ).first()

        if not user:
            return {"suc": 0, "msg": "No Data Found"}

        if verify_password(data_login.password, user.User.password):
            return {"suc": 1, "msg": format_user_response(user), "user": 1}
        return {"suc": 0, "msg": "Please check your userID or password"}
    except SQLAlchemyError as e:
        return {"suc": 0, "msg": f"Database error: {str(e)}"}
    except Exception as e:
        return {"suc": 0, "msg": f"Error: {str(e)}"}

@userRouter.post('/login')
async def login(data_login: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User, Branch, Company).join(
            Branch, User.br_id == Branch.id
        ).join(
            Company, User.comp_id == Company.id
        ).filter(
            User.user_id == data_login.user_id,
            User.active_flag == 'Y',
            User.user_type.in_(['U', 'M'])
        ).first()

        if not user:
            return {"suc": 0, "msg": "No user found"}

        # Get count of active users
        active_users = db.query(func.count(User.id)).filter(
            User.comp_id == user.Company.id,
            User.user_type.in_(['U', 'M']),
            User.login_flag == 'Y'
        ).scalar()

        if active_users >= user.Company.max_user:
            return {"suc": 0, "msg": "Max user limit reached"}

        # Return success with user details and count
        return {"suc": 1, "msg": format_user_response(user), "user": active_users + 1}
    except SQLAlchemyError as e:
        return {"suc": 0, "msg": f"Database error: {str(e)}"}
    except Exception as e:
        return {"suc": 0, "msg": f"Error: {str(e)}"}

@userRouter.post('/logout')
async def logout(flag: LoginFlag, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(
            User.comp_id == flag.comp_id,
            User.br_id == flag.br_id,
            User.user_id == flag.user_id,
            User.user_type.in_(['U', 'M'])
        ).first()

        if not user:
            return {"status": 0, "data": "No user Found"}

        user.login_flag = 'N'
        db.commit()
        return {"status": 1, "data": "logged out successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        return {"status": 0, "data": f"Database error: {str(e)}"}
    except Exception as e:
        db.rollback()
        return {"status": 0, "data": f"Error: {str(e)}"}