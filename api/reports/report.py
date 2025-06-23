from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, not_, desc, or_, types
from config.database import get_db
from models.master_model import createResponse
from models.form_model import (
    DashBoard, SaleReport, GSTStatement, GSTSummary, ItemReport, 
    RefundBillReport, BillList, SearchByItem, CreditReport, CancelReport, 
    DaybookReport, SearchByRcpt, SearchByName, UserwiseReport, CustomerLedger, 
    RecveryReport, DueReport, CreditCust, BillwiseReport, DueReportMobileAPI
)
from models.sqlalchemy_models import (
    User, Branch, Company, Receipt, ItemSale, 
    ReceiptCancel, Item, Unit, Category, Customer,
    ItemRate, HeaderFooter, Recovery
)

repoRouter = APIRouter()

# Dashboard
#-------------------------------------------------------------------------------------------------------------------------
@repoRouter.post('/billsummary') 
async def Bill_sum(bill_sum: DashBoard, db: Session = Depends(get_db)):
    """Get summary of bills for a specific date and user"""
    result = db.query(
        func.count(Receipt.receipt_no).label('total_bills'),
        func.sum(Receipt.net_amt).label('amount_collected')
    ).join(
        User, Receipt.created_by == User.user_id
    ).join(
        Branch, User.br_id == Branch.id
    ).join(
        Company, User.comp_id == Company.id
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).filter(
        Company.id == bill_sum.comp_id,
        Branch.id == bill_sum.br_id,
        Receipt.trn_date == bill_sum.trn_date, 
        Receipt.created_by == bill_sum.user_id,
        ItemSale.cancel_flag == 0
    ).first()

    if not result or result[0] == 0:
        return {"status": 0, "data": "no data"}
    
    return {
        "status": 1,
        "data": createResponse([result], ['total_bills', 'amount_collected'], 1)
    }

# Dashboard - Latest 10 bills
#-------------------------------------------------------------------------------------------------------------
@repoRouter.post('/recent_bills')
async def recent_bill(rec_bill: DashBoard, db: Session = Depends(get_db)):
    """Get 10 most recent bills for a specific date and user"""
    cancelled_receipts = db.query(ReceiptCancel.receipt_no)

    bills = db.query(Receipt).join(
        User, Receipt.created_by == User.user_id
    ).join(
        Branch, User.br_id == Branch.id
    ).join(
        Company, User.comp_id == Company.id
    ).filter(
        Company.id == rec_bill.comp_id,
        Branch.id == rec_bill.br_id,
        Receipt.trn_date == rec_bill.trn_date,
        Receipt.created_by == rec_bill.user_id,
        not_(Receipt.receipt_no.in_(cancelled_receipts))
    ).order_by(
        desc(Receipt.created_dt)
    ).limit(10).all()

    if not bills:
        return []

    result = [
        {c.name: getattr(bill, c.name) for c in Receipt.__table__.columns}
        for bill in bills
    ]

    return result

# Sale Report
#-----------------------------------------------------------------------------------------------------------------------
@repoRouter.post('/sale_report')
async def sale_report(sl_rep: SaleReport, db: Session = Depends(get_db)):
    """Get sale report for a date range"""
    
    # Get cancelled receipt numbers for the date range
    cancelled_receipts = db.query(ReceiptCancel.receipt_no).join(
        Receipt, Receipt.receipt_no == ReceiptCancel.receipt_no
    ).filter(
        Receipt.trn_date.between(sl_rep.from_date, sl_rep.to_date)
    ).subquery()

    result = db.query(
        Receipt.cust_name,
        Receipt.phone_no,
        Receipt.receipt_no,
        Receipt.trn_date,
        func.count(ItemSale.receipt_no).label('no_of_items'),
        Receipt.price,
        Receipt.discount_amt,
        Receipt.cgst_amt,
        Receipt.sgst_amt,
        Receipt.round_off,
        Receipt.net_amt,
        Receipt.pay_mode, 
        Receipt.created_by
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).filter(
        ItemSale.comp_id == sl_rep.comp_id,
        ItemSale.br_id == sl_rep.br_id,
        Receipt.trn_date.between(sl_rep.from_date, sl_rep.to_date),
        not_(Receipt.receipt_no.in_(cancelled_receipts))
    ).group_by(
        Receipt.receipt_no,
        Receipt.cust_name,
        Receipt.phone_no, 
        Receipt.trn_date,
        Receipt.price,
        Receipt.discount_amt,
        Receipt.cgst_amt,
        Receipt.sgst_amt,
        Receipt.round_off,
        Receipt.net_amt,
        Receipt.pay_mode,
        Receipt.created_by
    ).order_by(
        Receipt.trn_date,
        Receipt.receipt_no
    ).all()

    if not result:
        return {"status": 0, "data": []}

    # Convert SQLAlchemy result to list of dicts
    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in result
    ]

    return {
        "status": 1,
        "data": data
    }

# Collection Report (Sales Summary in app)
#-----------------------------------------------------------------------------------------------------------------------
@repoRouter.post('/collection_report')
async def collection_report(col_rep: SaleReport, db: Session = Depends(get_db)):
    """Get collection report with breakdown by payment mode for a date range"""

    # First query for receipts
    receipts = db.query(
        Receipt.receipt_no,
        Receipt.pay_mode,
        Receipt.net_amt,
        func.if_(
            Receipt.pay_mode == 'R',
            Receipt.net_amt - Receipt.received_amt,
            0
        ).label('due_amt'),
        func.literal(0).label('recover_amt')
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).filter(
        Receipt.trn_date.between(col_rep.from_date, col_rep.to_date),
        Receipt.comp_id == col_rep.comp_id,
        Receipt.br_id == col_rep.br_id,
        ItemSale.cancel_flag == 0
    ).subquery()

    # Second query for recoveries
    recoveries = db.query(
        func.literal('').label('receipt_no'),
        func.literal('Z').label('pay_mode'),
        func.literal(0).label('net_amt'),
        func.literal(0).label('due_amt'),
        func.sum(Recovery.paid_amt).label('recover_amt')
    ).filter(
        Recovery.recover_dt.between(col_rep.from_date, col_rep.to_date)
    ).subquery()

    # Combine and group results
    result = db.query(
        func.count(receipts.c.receipt_no).label('no_of_rcpt'),
        receipts.c.pay_mode,
        func.sum(receipts.c.net_amt).label('net_amt'),
        func.sum(receipts.c.due_amt).label('due_amt'),
        func.coalesce(func.sum(receipts.c.recover_amt), 0).label('recover_amt')
    ).union_all(
        db.query(
            func.count(recoveries.c.receipt_no).label('no_of_rcpt'),
            recoveries.c.pay_mode,
            func.sum(recoveries.c.net_amt).label('net_amt'),
            func.sum(recoveries.c.due_amt).label('due_amt'),
            func.sum(recoveries.c.recover_amt).label('recover_amt')
        )
    ).group_by(
        receipts.c.pay_mode
    ).all()

    if not result:
        return {"status": 0, "data": []}

    # Convert SQLAlchemy result to list of dicts
    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in result
    ]

    return {
        "status": 1,
        "data": data
    }

# Item Report
#-------------------------------------------------------------------------------------------------------------
# @repoRouter.post('/item_report')
# async def item_report(item_rep:ItemReport):
#     conn = connect()
#     cursor = conn.cursor()
#     query = f"SELECT a.receipt_no,a.item_id,b.item_name,sum(a.qty)qty,sum(a.price*a.qty)price from td_item_sale a, md_items b where a.item_id = b.id and a.comp_id = {item_rep.comp_id} and a.br_id = {item_rep.br_id} and a.trn_date BETWEEN '{item_rep.from_date}' and '{item_rep.to_date}' and a.receipt_no not in (select receipt_no from td_receipt_cancel_new where date(cancelled_dt)between '{item_rep.from_date}' and '{item_rep.to_date}') group by a.receipt_no,a.item_id,b.item_name"
#     cursor.execute(query)
#     records = cursor.fetchall()
#     result = createResponse(records, cursor.column_names, 1)
#     conn.close()
#     cursor.close()
#     if records==[]:
#         resData= {"status":0, "data":[]}
#     else:
#         resData= {
#         "status":1,
#         "data":result
#         }
#     return resData

# GST Statement
#-------------------------------------------------------------------------------------------------------------

# @repoRouter.post('/gst_statement')
# async def gst_statement(gst_st:GSTStatement):
#     conn = connect()
#     cursor = conn.cursor()
#     query = f"select distinct a.receipt_no, a.trn_date, (a.price - a.discount_amt)taxable_amt, a.cgst_amt, a.sgst_amt, (a.cgst_amt + a.sgst_amt)total_tax, a.net_amt from td_receipt a, td_item_sale b where a.receipt_no = b.receipt_no and b.comp_id = {gst_st.comp_id} and b.br_id = {gst_st.br_id} and a.created_by = {gst_st.user_id} and (a.cgst_amt + a.sgst_amt) > '0' and a.trn_date BETWEEN '{gst_st.from_date}' and '{gst_st.to_date}'"
#     cursor.execute(query)
#     records = cursor.fetchall()
#     result = createResponse(records, cursor.column_names, 1)
#     conn.close()
#     cursor.close()
#     if records==[]:
#         resData= {"status":0, "data":[]}
#     else:
#         resData= {
#         "status":1,
#         "data":result
#         }
#     return resData

# GST  Summary
#-------------------------------------------------------------------------------------------------------------
# @repoRouter.post('/gst_summary')
# async def gst_summary(gst_sm:GSTSummary):
#     conn = connect()
#     cursor = conn.cursor()
#     query = f"SELECT cgst_prtg, SUM(cgst_amt)cgst_amt, SUM(sgst_amt)sgst_amt, SUM(cgst_amt) + SUM(sgst_amt)total_tax FROM td_item_sale WHERE cgst_amt+sgst_amt>0 AND comp_id = {gst_sm.comp_id} AND br_id = {gst_sm.br_id} AND created_by = {gst_sm.user_id} AND trn_date BETWEEN '{gst_sm.from_date}' AND '{gst_sm.to_date}' GROUP BY cgst_prtg"
#     cursor.execute(query)
#     records = cursor.fetchall()
#     result = createResponse(records, cursor.column_names, 1)
#     conn.close()
#     cursor.close()
#     if records==[]:
#         resData= {"status":0, "data":[]}
#     else:
#         resData= {
#         "status":1,
#         "data":result
#         }
#     return resData

# Refund Report [Bill]

# @repoRouter.post('/refund_bill_report')
# async def sale_report(sl_rep:RefundBillReport):
#     conn = connect()
#     cursor = conn.cursor()

#     query=f"select a.cust_name, a.phone_no, a.refund_rcpt_no, a.refund_dt,  count(b.refund_rcpt_no)no_of_items, a.price, a.discount_amt, a.cgst_amt, a.sgst_amt,a.round_off, a.net_amt, a.refund_by from  td_refund_bill a, td_refund_item b where a.refund_rcpt_no = b.refund_rcpt_no  and   a.refund_dt between '{sl_rep.from_date}' and '{sl_rep.to_date}' and   b.comp_id = {sl_rep.comp_id} AND b.br_id = {sl_rep.br_id} and a.refund_by='{sl_rep.user_id}' group by a.cust_name, a.phone_no, a.refund_rcpt_no, a.refund_dt, a.refund_by"

#     cursor.execute(query)
#     records = cursor.fetchall()
#     result = createResponse(records, cursor.column_names, 1)
#     conn.close()
#     cursor.close()
#     if records==[]:
#         resData= {"status":0, "data":[]}
#     else:
#         resData= {
#         "status":1,
#         "data":result
#         }
#     return resData

# Search Bills
#-------------------------------------------------------------------------------------------------------------

@repoRouter.post('/search_bill_by_phone')
async def search_bill_by_phone(bill: BillList, db: Session = Depends(get_db)):
    """Search bills by phone number"""
    bills = db.query(
        Receipt.receipt_no,
        Receipt.trn_date,
        Receipt.net_amt,
        Receipt.phone_no
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).filter(
        ItemSale.comp_id == bill.comp_id,
        ItemSale.br_id == bill.br_id,
        Receipt.phone_no == bill.phone_no
    ).distinct().all()

    if not bills:
        return {"status": 0, "data": []}

    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in bills
    ]
    return {"status": 1, "data": data}

@repoRouter.post('/billwise_report')
async def billwise_report(bill: BillwiseReport, db: Session = Depends(get_db)):
    """Get bill-wise report for a user"""
    bills = db.query(
        Receipt.receipt_no,
        Receipt.net_amt,
        func.sum(ItemSale.qty).label('qty')
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).filter(
        ItemSale.created_by == bill.user_id,
        ItemSale.trn_date.between(bill.from_date, bill.from_date)
    ).group_by(
        Receipt.receipt_no,
        Receipt.net_amt
    ).all()

    if not bills:
        return {"status": 0, "data": []}

    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in bills
    ]
    return {"status": 1, "data": data}

@repoRouter.post('/billsearch_by_item')
async def billsearch_by_item(item: SearchByItem, db: Session = Depends(get_db)):
    """Search bills by item"""
    bills = db.query(
        ItemSale.receipt_no,
        ItemSale.item_id,
        ItemSale.qty,
        ItemSale.price,
        Item.item_name
    ).join(
        Item, 
        and_(
            ItemSale.item_id == Item.id,
            ItemSale.comp_id == Item.comp_id
        )
    ).filter(
        ItemSale.comp_id == item.comp_id,
        ItemSale.br_id == item.br_id,
        Item.id == item.item_id,
        ItemSale.trn_date.between(item.from_date, item.to_date)
    ).all()

    if not bills:
        return {"status": 0, "data": []}

    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in bills
    ]
    return {"status": 1, "data": data}

@repoRouter.post('/search_bill_by_receipt')
async def search_bill_by_receipt(bill: SearchByRcpt, db: Session = Depends(get_db)):
    """Search bills by receipt number"""
    bills = db.query(
        Receipt.receipt_no,
        Receipt.trn_date,
        Receipt.pay_mode,
        Receipt.net_amt
    ).filter(
        Receipt.comp_id == bill.comp_id,
        Receipt.br_id == bill.br_id,
        Receipt.receipt_no == bill.receipt_no
    ).distinct().all()

    if not bills:
        return {"status": 0, "data": []}

    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in bills
    ]
    return {"status": 1, "data": data}

@repoRouter.post('/search_bill_by_name')
async def search_bill_by_name(bill: SearchByName, db: Session = Depends(get_db)):
    """Search bills by customer name"""
    bills = db.query(
        Receipt.receipt_no,
        Receipt.trn_date,
        Receipt.pay_mode,
        Receipt.net_amt
    ).filter(
        Receipt.comp_id == bill.comp_id,
        Receipt.br_id == bill.br_id,
        Receipt.cust_name.ilike(f"%{bill.cust_name}%")
    ).distinct().all()

    if not bills:
        return {"status": 0, "data": []}

    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in bills
    ]
    return {"status": 1, "data": data}

# Search Bills by item name
# Endpoint implementation moved to the SQLAlchemy ORM version above
#==================================================================================================
# Search by Receipt No
# Endpoint implementation moved to the SQLAlchemy ORM version above

# Search by Customer Name
# Endpoint implementation moved to the SQLAlchemy ORM version above

#=================================================================================================
# Show The Refunded Bills

# @repoRouter.get('/show_refund_bill/{recp_no}')
# async def show_refund_bill(recp_no:int):
#     conn = connect()
#     cursor = conn.cursor()
#     query = f"SELECT a.receipt_no, a.refund_dt, a.refund_rcpt_no, a.comp_id, a.br_id, a.item_id, a.price, a.dis_pertg, a.discount_amt, a.cgst_prtg, a.cgst_amt, a.sgst_prtg, a.sgst_amt, a.qty, a.refund_by, a.refund_at, a.modified_by, a.modified_dt, b.price AS tprice, b.discount_amt AS tdiscount_amt, b.cgst_amt AS tcgst_amt, b.sgst_amt AS tsgst_amt, b.amount, b.round_off, b.net_amt, b.pay_mode, b.received_amt, b.cust_name, b.phone_no, b.gst_flag,b.gst_type,b.discount_flag, b.discount_type,b.discount_position, b.refund_by AS trefund_by, b.refund_at AS trefund_at, b.modified_by AS tmodified_by, b.modified_dt AS tmodified_dt, c.item_name FROM td_refund_item a, td_refund_bill b, md_items c WHERE a.refund_rcpt_no=b.refund_rcpt_no and a.refund_dt=b.refund_dt and a.item_id=c.id and a.refund_rcpt_no={recp_no}"
#     cursor.execute(query)
#     records = cursor.fetchall()
#     result = createResponse(records, cursor.column_names, 1)
#     conn.close()
#     cursor.close()
#     if cursor.rowcount>0:
#         resData= {"status":1, 
#                   "data":result}
#     else:
#         resData= {
#         "status":0,
#         "data":[]
#         }
#     return resData

# Credit Report
#=======================================================================================================

@repoRouter.post('/credit_report')
async def credit_report(cr_rep: CreditReport, db: Session = Depends(get_db)):
    """Get credit sales report for a date range"""
    credits = db.query(
        Receipt.trn_date,
        Receipt.phone_no,
        Receipt.receipt_no,
        Receipt.net_amt,
        Receipt.received_amt.label('paid_amt'),
        (Receipt.net_amt - Receipt.received_amt).label('due_amt')
    ).filter(
        Receipt.pay_mode == 'R',
        Receipt.net_amt - Receipt.received_amt > 0,
        Receipt.trn_date.between(cr_rep.from_date, cr_rep.to_date),
        Receipt.comp_id == cr_rep.comp_id,
        Receipt.br_id == cr_rep.br_id,
        Receipt.created_by == cr_rep.user_id
    ).group_by(
        Receipt.phone_no,
        Receipt.receipt_no,
        Receipt.trn_date,
        Receipt.created_by,
        Receipt.net_amt,
        Receipt.received_amt
    ).all()

    if not credits:
        return {"status": 0, "data": []}

    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in credits
    ]
    return {"status": 1, "data": data}

#===================================================================================================
@repoRouter.post('/cancel_report')
async def cancel_report(data: CancelReport, db: Session = Depends(get_db)):
    """Get report of cancelled bills for a date range"""
    result = db.query(
        Receipt.receipt_no,
        Receipt.trn_date,
        func.count(ItemSale.receipt_no).label('no_of_items'),
        Receipt.price,
        Receipt.net_amt,
        Receipt.pay_mode,
        Receipt.created_by
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).join(
        ReceiptCancel, Receipt.receipt_no == ReceiptCancel.receipt_no
    ).filter(
        ItemSale.comp_id == data.comp_id,
        ItemSale.br_id == data.br_id,
        Receipt.created_by == data.user_id,
        func.date(ReceiptCancel.cancelled_dt).between(data.from_date, data.to_date)
    ).group_by(
        Receipt.receipt_no,
        Receipt.trn_date,
        Receipt.price,
        Receipt.net_amt,
        Receipt.pay_mode,
        Receipt.created_by
    ).order_by(
        Receipt.trn_date,
        Receipt.receipt_no
    ).all()

    if not result:
        return {"status": 0, "data": []}

    data = [{name: getattr(row, name) for name in row._fields} for row in result]
    return {"status": 1, "data": data}

#===================================================================================================

# Daybook Report
#===================================================================================================
@repoRouter.post('/daybook_report')
async def daybook_report(data: DaybookReport, db: Session = Depends(get_db)):
    """Get daily transaction report including cancellations"""
    # Regular receipts
    regular_receipts = db.query(
        Receipt.receipt_no,
        Receipt.trn_date,
        Receipt.pay_mode,
        Receipt.net_amt,
        func.literal(0).label('cancelled_amt'),
        Receipt.created_by,
        func.literal('').label('cancelled_by')
    ).filter(
        Receipt.comp_id == data.comp_id,
        Receipt.br_id == data.br_id,
        Receipt.trn_date.between(data.from_date, data.to_date)
    )

    # Cancelled receipts
    cancelled_receipts = db.query(
        Receipt.receipt_no,
        Receipt.trn_date,
        Receipt.pay_mode,
        func.literal(0).label('net_amt'),
        Receipt.net_amt.label('cancelled_amt'),
        Receipt.created_by,
        ReceiptCancel.cancelled_by
    ).join(
        ReceiptCancel, Receipt.receipt_no == ReceiptCancel.receipt_no
    ).filter(
        Receipt.comp_id == data.comp_id,
        Receipt.br_id == data.br_id,
        func.date(ReceiptCancel.cancelled_dt).between(data.from_date, data.to_date)
    )

    # Combine regular and cancelled receipts
    result = regular_receipts.union(cancelled_receipts).all()

    if not result:
        return {"status": 0, "data": []}

    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in result
    ]
    return {"status": 1, "data": data}

# Userwise Report
#============================================================================================
# @repoRouter.post('/userwise_report1')
# async def userwise_report(data: UserwiseReport, db: Session = Depends(get_db)):
    """Get transaction report grouped by user"""
    result = db.query(
        User.user_name,
        Receipt.created_by.label('user_id'),
        func.sum(Receipt.net_amt).label('net_amt'),
        func.count(Receipt.receipt_no).label('receipt_no_count')
    ).join(
        User, Receipt.created_by == User.user_id
    ).filter(
        Receipt.trn_date.between(data.from_date, data.to_date),
        Receipt.comp_id == data.comp_id,
        Receipt.br_id == data.br_id,
        User.user_id == data.user_id
    ).group_by(
        User.user_name,
        Receipt.created_by
    ).all()

    if not result:
        return {"status": 0, "data": []}

    data = [
        {name: getattr(row, name) for name in row._fields}
        for row in result
    ]
    return {"status": 1, "data": data}

# Customer Ledger
#===================================================================================================
@repoRouter.post('/customer_ledger')
async def customer_ledger(data: CustomerLedger, db: Session = Depends(get_db)):
    """Get customer's transaction history"""
    result = db.query(
        func.coalesce(Customer.cust_name, 'NA').label('cust_name'),
        Recovery.phone_no,
        Recovery.recover_dt,
        Recovery.paid_amt,
        Recovery.due_amt,
        Recovery.curr_due_amt.label('balance')
    ).outerjoin(
        Customer,
        and_(
            Recovery.comp_id == Customer.comp_id,
            Recovery.phone_no == Customer.phone_no
        )
    ).filter(
        Recovery.comp_id == data.comp_id,
        Recovery.br_id == data.br_id,
        Recovery.phone_no == data.phone_no
    ).order_by(
        Recovery.recover_dt,
        Recovery.recover_id
    ).all()

    if not result:
        return {"status": 0, "data": []}

    data = [{name: getattr(row, name) for name in row._fields} for row in result]
    return {"status": 1, "data": data}

# Recovery Report
#===================================================================================================
@repoRouter.post('/recovery_report')
async def recovery_report(data: RecveryReport, db: Session = Depends(get_db)):
    """Get recovery report for a date range"""
    result = db.query(
        func.coalesce(Customer.cust_name, 'NA').label('cust_name'),
        Recovery.phone_no,
        Recovery.recover_dt,
        func.sum(Recovery.paid_amt).label('recovery_amt')
    ).outerjoin(
        Customer,
        and_(
            Recovery.comp_id == Customer.comp_id,
            Recovery.phone_no == Customer.phone_no  
        )
    ).filter(
        Recovery.comp_id == data.comp_id,
        Recovery.br_id == data.br_id,
        Recovery.recover_dt.between(data.from_date, data.to_date)
    ).group_by(
        Customer.cust_name,
        Recovery.phone_no,
        Recovery.recover_dt
    ).order_by(
        Recovery.recover_dt
    ).all()

    if not result:
        return {"status": 0, "data": []}

    data = [{name: getattr(row, name) for name in row._fields} for row in result]
    return {"status": 1, "data": data}

# Due Report
#===================================================================================================
@repoRouter.post('/due_report')
async def due_report(data: DueReportMobileAPI, db: Session = Depends(get_db)):
    """Get due amount report"""
    result = db.query(
        func.coalesce(Customer.cust_name, 'NA').label('cust_name'),
        Recovery.phone_no,
        (func.sum(Recovery.due_amt) - func.sum(Recovery.paid_amt)).label('due_amt')
    ).outerjoin(
        Customer,
        and_(
            Recovery.comp_id == Customer.comp_id,
            Recovery.phone_no == Customer.phone_no
        )
    ).filter(
        Recovery.comp_id == data.comp_id,
        Recovery.br_id == data.br_id,
        Recovery.recover_dt <= data.date,
        Recovery.created_by == data.user_id
    ).group_by(
        Customer.cust_name,
        Recovery.phone_no
    ).having(
        (func.sum(Recovery.due_amt) - func.sum(Recovery.paid_amt)) > 0
    ).all()

    if not result:
        return {"status": 0, "data": []}

    data = [{name: getattr(row, name) for name in row._fields} for row in result]
    return {"status": 1, "data": data}

# Product-wise Report
#===================================================================================================
@repoRouter.post('/productwise_report')
async def Productwise_report(item_rep: ItemReport, db: Session = Depends(get_db)):
    """Get product-wise sales report"""
    result = db.query(
        Item.item_name,
        ItemSale.item_id,
        Unit.unit_name,
        Category.category_name,
        func.sum(ItemSale.qty).label('tot_item_qty'),
        ItemRate.price.label('unit_price'),
        func.sum(func.round(ItemSale.price) * ItemSale.qty).label('tot_item_price')
    ).join(
        Item, ItemSale.item_id == Item.id
    ).join(
        ItemRate, ItemSale.item_id == ItemRate.item_id
    ).outerjoin(
        Unit, Item.unit_id == Unit.sl_no
    ).join(
        Category, Item.catg_id == Category.sl_no
    ).filter(
        ItemSale.comp_id == item_rep.comp_id,
        ItemSale.br_id == item_rep.br_id,
        ItemSale.trn_date.between(item_rep.from_date, item_rep.to_date),
        ItemSale.cancel_flag == 0,
        ItemSale.created_by == item_rep.user_id
    ).group_by(
        Item.item_name,
        ItemSale.item_id,
        Unit.unit_name,
        ItemRate.price,
        Category.category_name
    ).all()

    if not result:
        return {"status": 0, "data": []}

    data = [{name: getattr(row, name) for name in row._fields} for row in result]
    return {"status": 1, "data": data}

# Credit Customers Report
#===================================================================================================
@repoRouter.post('/get_credit_cust')
async def get_credit_customers(data: CreditCust, db: Session = Depends(get_db)):
    """Get list of customers with credit payment mode"""
    result = db.query(
        Customer.cust_name,
        Customer.phone_no
    ).filter(
        Customer.pay_mode == 'R',
        Customer.comp_id == data.comp_id,
        or_(
            Customer.created_by == data.user_id,
            Customer.modified_by == data.user_id
        )
    ).all()

    if not result:
        return {"status": 0, "data": []}

    data = [{name: getattr(row, name) for name in row._fields} for row in result]
    return {"status": 1, "data": data}

@repoRouter.post('/userwise_report2')
async def userwise_report(item_rep: UserwiseReport, db: Session = Depends(get_db)):
    """Get detailed user-wise sales report with cash and credit breakdowns"""
      # Subquery for cash sales (pay_mode in ('C','U'))
    cash_sales = db.query(
        Receipt.created_by,
        User.user_name,
        Branch.branch_name,
        func.count(func.distinct(Receipt.receipt_no)).label('sum(receipt_no)'),
        func.sum(func.distinct(Receipt.amount)).label('cash_gross_sale'),
        func.sum(Receipt.round_off).label('cash_round_off'),
        func.sum(func.distinct(Receipt.net_amt)).label('cash_net_sale'),
        func.cast('0.00', types.Float).label('credit_gross_sale'),
        func.cast('0.00', types.Float).label('credit_round_off'),
        func.cast('0.00', types.Float).label('credit_net_sale'),
        func.sum(ItemSale.qty).label('quantity')
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).join(
        User, Receipt.created_by == User.user_id
    ).join(
        Branch, Receipt.br_id == Branch.id
    ).filter(
        Receipt.created_by == item_rep.user_id,
        Receipt.comp_id == item_rep.comp_id,
        Receipt.br_id == item_rep.br_id,
        Receipt.trn_date.between(item_rep.from_date, item_rep.to_date),
        Receipt.pay_mode.in_(['C', 'U']),
        ItemSale.cancel_flag == 0
    ).group_by(
        Receipt.created_by,
        User.user_name,
        Branch.branch_name
    ).subquery()

    # Subquery for credit sales (pay_mode = 'R')
    credit_sales = db.query(
        Receipt.created_by,
        User.user_name,
        Branch.branch_name,
        func.count(func.distinct(Receipt.receipt_no)).label('sum(receipt_no)'),
        func.cast('0.00', types.Float).label('cash_gross_sale'),
        func.cast('0.00', types.Float).label('cash_round_off'),
        func.cast('0.00', types.Float).label('cash_net_sale'),
        func.sum(func.distinct(Receipt.amount)).label('credit_gross_sale'),
        func.sum(Receipt.round_off).label('credit_round_off'),
        func.sum(func.distinct(Receipt.net_amt)).label('credit_net_sale'),
        func.sum(ItemSale.qty).label('quantity')
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).join(
        User, Receipt.created_by == User.user_id
    ).join(
        Branch, Receipt.br_id == Branch.id
    ).filter(
        Receipt.created_by == item_rep.user_id,
        Receipt.comp_id == item_rep.comp_id,
        Receipt.br_id == item_rep.br_id,
        Receipt.trn_date.between(item_rep.from_date, item_rep.to_date),
        Receipt.pay_mode == 'R',
        ItemSale.cancel_flag == 0
    ).group_by(
        Receipt.created_by,
        User.user_name,
        Branch.branch_name
    ).subquery()    # Combine and aggregate both results
    result = db.query(
        cash_sales.c.created_by,
        cash_sales.c.user_name,
        cash_sales.c.branch_name,
        func.sum(cash_sales.c['sum(receipt_no)'] + credit_sales.c['sum(receipt_no)']).label('sum(receipt_no)'),
        func.sum(cash_sales.c.quantity + credit_sales.c.quantity).label('quantity'),
        (func.sum(cash_sales.c.cash_gross_sale) + func.sum(credit_sales.c.credit_gross_sale)).label('gross_sale'),
        (func.sum(cash_sales.c.cash_round_off) + func.sum(credit_sales.c.credit_round_off)).label('round_off'),
        (func.sum(cash_sales.c.cash_net_sale) + func.sum(credit_sales.c.credit_net_sale)).label('net_sale'),
        func.sum(cash_sales.c.cash_net_sale).label('cash_sale'),
        func.sum(credit_sales.c.credit_net_sale).label('credit_sale')
    ).outerjoin(
        credit_sales,
        and_(
            cash_sales.c.created_by == credit_sales.c.created_by,
            cash_sales.c.user_name == credit_sales.c.user_name,
            cash_sales.c.branch_name == credit_sales.c.branch_name
        )
    ).group_by(
        cash_sales.c.created_by,
        cash_sales.c.user_name,
        cash_sales.c.branch_name
    ).all()

    if not result:
        return {"status": 0, "data": []}

    data = [{name: getattr(row, name) for name in row._fields} for row in result]
    return {"status": 1, "data": data}


@repoRouter.post('/userwise_report')
async def userwise_report(item_rep: UserwiseReport, db: Session = Depends(get_db)):
    """Get detailed user-wise sales report with cash and credit breakdowns"""
      # Subquery for cash sales (pay_mode in ('C','U'))
    cash_sales = db.query(
        User.user_name,
        func.count(func.distinct(Receipt.receipt_no)).label('sum(receipt_no)'),
        func.sum(func.distinct(Receipt.amount)).label('cash_gross_sale'),
        func.sum(Receipt.round_off).label('cash_round_off'),
        func.sum(func.distinct(Receipt.net_amt)).label('cash_net_sale'),
        func.cast('0.00', types.Float).label('credit_gross_sale'),
        func.cast('0.00', types.Float).label('credit_round_off'),
        func.cast('0.00', types.Float).label('credit_net_sale'),
        func.sum(ItemSale.qty).label('quantity')
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).join(
        User, Receipt.created_by == User.user_id
    ).filter(
        Receipt.created_by == item_rep.user_id,
        Receipt.trn_date.between(item_rep.from_date, item_rep.to_date),
        Receipt.pay_mode == 'C',
        ItemSale.cancel_flag == 0
    ).group_by(
        User.user_name,
    ).subquery()

    # Subquery for credit sales (pay_mode = 'R')
    credit_sales = db.query(
        User.user_name,
        func.count(func.distinct(Receipt.receipt_no)).label('sum(receipt_no)'),
        func.cast('0.00', types.Float).label('cash_gross_sale'),
        func.cast('0.00', types.Float).label('cash_round_off'),
        func.cast('0.00', types.Float).label('cash_net_sale'),
        func.sum(func.distinct(Receipt.amount)).label('credit_gross_sale'),
        func.sum(Receipt.round_off).label('credit_round_off'),
        func.sum(func.distinct(Receipt.net_amt)).label('credit_net_sale'),
        func.sum(ItemSale.qty).label('quantity')
    ).join(
        ItemSale, Receipt.receipt_no == ItemSale.receipt_no
    ).join(
        User, Receipt.created_by == User.user_id
    ).filter(
        Receipt.created_by == item_rep.user_id,
        Receipt.trn_date.between(item_rep.from_date, item_rep.to_date),
        Receipt.pay_mode == 'R',
        ItemSale.cancel_flag == 0
    ).group_by(
        User.user_name,
    ).subquery()    # Combine and aggregate both results
    result = db.query(
        cash_sales.c.user_name,
        func.sum(cash_sales.c['sum(receipt_no)'] + credit_sales.c['sum(receipt_no)']).label('sum(receipt_no)'),
        func.sum(cash_sales.c.quantity + credit_sales.c.quantity).label('quantity'),
        (func.sum(cash_sales.c.cash_gross_sale) + func.sum(credit_sales.c.credit_gross_sale)).label('gross_sale'),
        (func.sum(cash_sales.c.cash_round_off) + func.sum(credit_sales.c.credit_round_off)).label('round_off'),
        (func.sum(cash_sales.c.cash_net_sale) + func.sum(credit_sales.c.credit_net_sale)).label('net_sale'),
        func.sum(cash_sales.c.cash_net_sale).label('cash_sale'),
        func.sum(credit_sales.c.credit_net_sale).label('credit_sale')
    ).outerjoin(
        credit_sales,
        and_(
            cash_sales.c.user_name == credit_sales.c.user_name,
        )
    ).group_by(
        cash_sales.c.user_name,
    ).all()
    print(result)
    if not result:
        return {"status": 0, "data": []}

    data = [{name: getattr(row, name) for name in row._fields} for row in result]
    return {"status": 1, "data": data}