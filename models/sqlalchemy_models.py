from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, func, Boolean
from sqlalchemy.orm import relationship
from config.database import Base

class User(Base):
    __tablename__ = "md_user"

    id = Column(Integer, primary_key=True, index=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    br_id = Column(Integer, ForeignKey("md_branch.id"))
    user_name = Column(String(100))
    user_type = Column(String(1))
    user_id = Column(String(20), unique=True, index=True)
    phone_no = Column(String(20))
    email_id = Column(String(100), nullable=True)
    device_id = Column(String(100), nullable=True)
    password = Column(String(100))
    active_flag = Column(String(1), default='N')
    login_flag = Column(String(1), default='N')
    created_by = Column(String(20))
    created_dt = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_dt = Column(DateTime, nullable=True)


    # Relationships
    company = relationship("Company", back_populates="users")
    branch = relationship("Branch", back_populates="users")

class Company(Base):
    __tablename__ = "md_company"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(100))
    mode = Column(String(1))
    address = Column(String(200), nullable=True)
    web_portal = Column(String(100), nullable=True)
    max_user = Column(Integer)

    # Relationships
    users = relationship("User", back_populates="company")
    branches = relationship("Branch", back_populates="company")
    receipt_settings = relationship("ReceiptSettings", back_populates="company", uselist=False)
    header_footer = relationship("HeaderFooter", back_populates="company", uselist=False)
    stocks = relationship("Stock", back_populates="company")

class Branch(Base):
    __tablename__ = "md_branch"

    id = Column(Integer, primary_key=True, index=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    branch_name = Column(String(100))
    branch_address = Column(String(200), nullable=True)
    location = Column(Integer, nullable=True)
    contact_person = Column(String(100), nullable=True)
    phone_no = Column(String(20), nullable=True)
    email_id = Column(String(100), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="branches")
    users = relationship("User", back_populates="branch")
    stocks = relationship("Stock", back_populates="branch")

class ReceiptSettings(Base):
    __tablename__ = "md_receipt_settings"

    comp_id = Column(Integer, ForeignKey("md_company.id"), primary_key=True)
    discount_flag = Column(String(1))
    discount_type = Column(String(20))
    discount_position = Column(String(20))
    gst_flag = Column(String(1))
    gst_type = Column(String(20))
    rcv_cash_flag = Column(String(1))
    rcpt_type = Column(String(20))
    unit_flag = Column(String(1))
    cust_inf = Column(String(1))
    pay_mode = Column(String(50))
    stock_flag = Column(String(1))
    price_type = Column(String(20))
    refund_days = Column(Integer)
    kot_flag = Column(String(1))
    created_by = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_at = Column(DateTime, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="receipt_settings")

class HeaderFooter(Base):
    __tablename__ = "md_header_footer"

    comp_id = Column(Integer, ForeignKey("md_company.id"), primary_key=True)
    header1 = Column(String(200))
    on_off_flag1 = Column(String(1))
    header2 = Column(String(200))
    on_off_flag2 = Column(String(1))
    footer1 = Column(String(200))
    on_off_flag3 = Column(String(1))
    footer2 = Column(String(200))
    on_off_flag4 = Column(String(1))
    created_by = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_at = Column(DateTime, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="header_footer")

class Stock(Base):
    __tablename__ = "td_stock"

    id = Column(Integer, primary_key=True, index=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    br_id = Column(Integer, ForeignKey("md_branch.id"))
    item_id = Column(Integer, ForeignKey("md_items.id"))
    stock = Column(Integer)
    created_by = Column(String(20))
    created_dt = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_dt = Column(DateTime, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="stocks")
    branch = relationship("Branch", back_populates="stocks")
    item = relationship("Item", back_populates="stocks")

class Item(Base):
    __tablename__ = "md_items"    
    id = Column(Integer, primary_key=True, index=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    item_name = Column(String(100))
    unit_id = Column(Integer, ForeignKey("md_unit.sl_no"))
    catg_id = Column(Integer, ForeignKey("md_category.sl_no"))

    # Relationships
    stocks = relationship("Stock", back_populates="item")
    unit = relationship("Unit", back_populates="items")
    category = relationship("Category", back_populates="items")

class Unit(Base):
    __tablename__ = "md_unit"

    sl_no = Column(Integer, primary_key=True, index=True)
    unit_name = Column(String(50))

    # Relationships
    items = relationship("Item", back_populates="unit")
class ItemSale(Base):
    __tablename__ = "td_item_sale"    
    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(50), ForeignKey("td_receipt.receipt_no"), index=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    br_id = Column(Integer, ForeignKey("md_branch.id"))
    item_id = Column(Integer, ForeignKey("md_items.id"))
    qty = Column(Float)
    price = Column(Float)
    discount_amt = Column(Float)
    cgst_amt = Column(Float)
    sgst_amt = Column(Float)
    cgst_prtg = Column(Float)
    sgst_prtg = Column(Float)
    trn_date = Column(DateTime)
    cancel_flag = Column(Integer, default=0)
    created_by = Column(String(20))
    created_dt = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_dt = Column(DateTime, nullable=True)

    # Relationships
    item = relationship("Item", back_populates="sales")
    receipt = relationship("Receipt", back_populates="items")

class Receipt(Base):
    __tablename__ = "td_receipt"

    receipt_no = Column(String(50), primary_key=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    br_id = Column(Integer, ForeignKey("md_branch.id"))
    trn_date = Column(DateTime)
    cust_name = Column(String(100))
    phone_no = Column(String(20))
    price = Column(Float)
    discount_amt = Column(Float)
    cgst_amt = Column(Float)
    sgst_amt = Column(Float)
    round_off = Column(Float)
    amount = Column(Float)
    net_amt = Column(Float)
    received_amt = Column(Float)
    pay_mode = Column(String(1))
    created_by = Column(String(20))
    created_dt = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_dt = Column(DateTime, nullable=True)

    # Relationships
    items = relationship("ItemSale", back_populates="receipt")
    cancellation = relationship("ReceiptCancel", back_populates="receipt", uselist=False)

class ReceiptCancel(Base):
    __tablename__ = "td_receipt_cancel_new"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(50), ForeignKey("td_receipt.receipt_no"))
    cancelled_dt = Column(DateTime, server_default=func.now())
    cancelled_by = Column(String(20))
    modified_by = Column(String(20), nullable=True)
    modified_dt = Column(DateTime, nullable=True)

    # Relationships
    receipt = relationship("Receipt", back_populates="cancellation")

class Recovery(Base):
    __tablename__ = "td_recovery_new"

    recover_id = Column(Integer, primary_key=True, index=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    br_id = Column(Integer, ForeignKey("md_branch.id"))
    phone_no = Column(String(20))
    recover_dt = Column(DateTime)
    paid_amt = Column(Float)
    due_amt = Column(Float)
    curr_due_amt = Column(Float)
    created_by = Column(String(20))
    created_dt = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_dt = Column(DateTime, nullable=True)

class ItemRate(Base):
    __tablename__ = "md_item_rate"

    id = Column(Integer, primary_key=True, index=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    br_id = Column(Integer, ForeignKey("md_branch.id"))
    item_id = Column(Integer, ForeignKey("md_items.id"))
    price = Column(Float)
    effective_from = Column(DateTime)
    created_by = Column(String(20))
    created_dt = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_dt = Column(DateTime, nullable=True)

    # Relationships
    item = relationship("Item", backref="rates")

class Category(Base):
    __tablename__ = "md_category"

    sl_no = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(100))
    comp_id = Column(Integer, ForeignKey("md_company.id"))

    # Relationships
    items = relationship("Item", back_populates="category")

class Customer(Base):
    __tablename__ = "md_customer" 

    id = Column(Integer, primary_key=True, index=True)
    comp_id = Column(Integer, ForeignKey("md_company.id"))
    br_id = Column(Integer, ForeignKey("md_branch.id"))
    cust_name = Column(String(100))
    phone_no = Column(String(20))
    pay_mode = Column(String(1))
    created_by = Column(String(20))
    created_dt = Column(DateTime, server_default=func.now())
    modified_by = Column(String(20), nullable=True)
    modified_dt = Column(DateTime, nullable=True)

# Add relationship to Item model
Item.sales = relationship("ItemSale", back_populates="item")
