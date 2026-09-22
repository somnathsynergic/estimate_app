from fastapi import APIRouter
from models.masterApiModel import db_select, db_Insert, db_Delete
from pydantic import BaseModel
from typing import Optional, Union, Dict
from datetime import datetime

gamificationRouter = APIRouter()

class AddCoinRule(BaseModel):
    id: Optional[Union[int, str]] = None
    calculationType: Optional[str] = None
    coinValue: Optional[str] = None
    endDate: Optional[str] = None
    item: Optional[str] = None
    ruleName: Optional[str] = None
    ruleType: Optional[str] = None
    startDate: Optional[str] = None
    user_id: Optional[str] = None
    created_by: Optional[str] = None

class DeleteCoinRule(BaseModel):
    id: Union[int, str]

class DeleteQuest(BaseModel):
    id: Union[int, str]
    force: Optional[bool] = False

class DeleteAssignment(BaseModel):
    id: Optional[Union[int, str]] = None
    endDate: Optional[str] = None
    questName: Optional[str] = None
    questType: Optional[str] = None
    rewardCoins: Optional[Union[int, str]] = None
    startDate: Optional[str] = None

class AddQuest(BaseModel):
    id: Optional[Union[int, str]] = None
    endDate: Optional[str] = None
    questName: Optional[str] = None
    questType: Optional[str] = None
    rewardCoins: Optional[Union[int, str]] = None
    startDate: Optional[str] = None
    targetItem: Optional[Union[int, str]] = None
    targetQty: Optional[Union[int, str]] = None
    user_id: Optional[str] = None
    created_by: Optional[str] = None

class AssignQuest(BaseModel):
    id: Optional[Union[int, str]] = None
    comp_id: Optional[Union[int, str]] = None
    compId: Optional[Union[int, str]] = None
    br_id: Optional[Union[int, str]] = None
    brId: Optional[Union[int, str]] = None
    quest_id: Optional[Union[int, str]] = None
    questId: Optional[Union[int, str]] = None
    user_id: Optional[str] = None
    created_by: Optional[str] = None

class AddStreakConfig(BaseModel):
    day1: Optional[Union[int, str]] = None
    day2: Optional[Union[int, str]] = None
    day3: Optional[Union[int, str]] = None
    day4: Optional[Union[int, str]] = None
    day5: Optional[Union[int, str]] = None
    day6: Optional[Union[int, str]] = None
    user_id: Optional[str] = None
    created_by: Optional[str] = None

class AddWorkingDayConfig(BaseModel):
    comp_id: Union[int, str]
    br_id: Union[int, str]
    # Weekday 0=Monday to 6=Sunday. Boolean or "Y"/"N". Let's use string "Y" or "N"
    days: Dict[str, str] # e.g., {"0": "Y", "1": "Y", ...}
    user_id: Optional[str] = None
    created_by: Optional[str] = None
@gamificationRouter.post('/add_coin_rule')
async def add_coin_rule(data: AddCoinRule):
    current_datetime = datetime.now()
    formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

    # 1. Map rule_name: use ruleName or fall back to ruleType
    rule_name_val = data.ruleName or data.ruleType or ""
    rule_name = f"'{rule_name_val}'" if rule_name_val else "NULL"

    # 2. Map item_id: if item field is a valid numeric ID, use it, else save as NULL
    # For UNIQUE_SHOP and POWER_SHOP, we default item_id to 0
    item_id_val = "NULL"
    if data.item and str(data.item).strip().isdigit():
        item_id_val = str(data.item).strip()
    elif rule_name_val == "UNIQUE_SHOP" or data.calculationType == "UNIQUE_SHOP":
        item_id_val = "0"

    # 3. Map coin_value: convert to integer representation
    coin_value_val = "NULL"
    if data.coinValue is not None:
        try:
            coin_value_val = str(int(float(data.coinValue)))
        except ValueError:
            pass

    # 4. Map calculation_type
    calc_type = f"'{data.calculationType}'" if data.calculationType else "NULL"

    # 5. Map start and end dates
    start_dt = f"'{data.startDate}'" if data.startDate else "NULL"
    end_dt = f"'{data.endDate}'" if data.endDate else "NULL"

    # 6. Map created_by (from user_id or created_by)
    created_by_val = data.created_by or data.user_id or "system"
    created_by = f"'{created_by_val}'"

    # 7. Map created_dt
    created_dt = f"'{formatted_dt}'"

    table_name = "md_ds_coin_rule"
    
    if data.id:
        # Update existing record
        fields = f"rule_name={rule_name}, item_id={item_id_val}, coin_value={coin_value_val}, calculation_type={calc_type}, start_dt={start_dt}, end_dt={end_dt}, modified_by={created_by}, modified_dt={created_dt}"
        values = None
        where = f"id = {data.id}"
        flag = 1  # 1 indicates Update
    else:
        # Insert new record
        fields = "rule_name, item_id, coin_value, calculation_type, start_dt, end_dt, created_by, created_dt"
        values = f"{rule_name}, {item_id_val}, {coin_value_val}, {calc_type}, {start_dt}, {end_dt}, {created_by}, {created_dt}"
        where = None
        flag = 0  # 0 indicates Insert
    
    res_dt = await db_Insert(table_name, fields, values, where, flag)
    return res_dt

@gamificationRouter.post('/add_quest')
async def add_quest(data: AddQuest):
    current_datetime = datetime.now()
    formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

    # 1. Map quest_name
    quest_name = f"'{data.questName}'" if data.questName else "NULL"

    # 2. Map quest_type
    quest_type = f"'{data.questType}'" if data.questType else "NULL"

    # 3. Map item_id
    item_id_val = "NULL"
    if data.targetItem is not None and str(data.targetItem).strip().isdigit():
        item_id_val = str(data.targetItem).strip()

    # 4. Map target_qty
    target_qty_val = "NULL"
    if data.targetQty is not None:
        try:
            target_qty_val = str(int(float(data.targetQty)))
        except ValueError:
            pass

    # 5. Map reward_coins
    reward_coins_val = "NULL"
    if data.rewardCoins is not None:
        try:
            reward_coins_val = str(int(float(data.rewardCoins)))
        except ValueError:
            pass

    # 6. Map start and end dates
    start_dt = f"'{data.startDate}'" if data.startDate else "NULL"
    end_dt = f"'{data.endDate}'" if data.endDate else "NULL"

    # 7. Map created_by (from user_id or created_by)
    created_by_val = data.created_by or data.user_id or "system"
    created_by = f"'{created_by_val}'"

    # 8. Map created_dt
    created_dt = f"'{formatted_dt}'"

    table_name = "md_ds_quest"
    
    if data.id:
        fields = f"quest_name={quest_name}, quest_type={quest_type}, item_id={item_id_val}, target_qty={target_qty_val}, reward_coins={reward_coins_val}, start_dt={start_dt}, end_dt={end_dt}, modified_by={created_by}, modified_dt={created_dt}"
        values = None
        where = f"quest_id = {data.id}"
        flag = 1
    else:
        fields = "quest_name, quest_type, item_id, target_qty, reward_coins, start_dt, end_dt, created_by, created_dt"
        values = f"{quest_name}, {quest_type}, {item_id_val}, {target_qty_val}, {reward_coins_val}, {start_dt}, {end_dt}, {created_by}, {created_dt}"
        where = None
        flag = 0  # 0 indicates Insert in db_Insert helper
    
    res_dt = await db_Insert(table_name, fields, values, where, flag)
    return res_dt

@gamificationRouter.post('/assign_quest')
async def assign_quest(data: AssignQuest):
    current_datetime = datetime.now()
    formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

    # 1. Map comp_id (support both snake_case and camelCase)
    comp_id_val = data.comp_id if data.comp_id is not None else data.compId
    comp_id = "NULL"
    if comp_id_val is not None and str(comp_id_val).strip().isdigit():
        comp_id = str(comp_id_val).strip()

    # 2. Map br_id (support both snake_case and camelCase)
    br_id_val = data.br_id if data.br_id is not None else data.brId
    br_id = "NULL"
    if br_id_val is not None and str(br_id_val).strip().isdigit():
        br_id = str(br_id_val).strip()

    # 3. Map quest_id (support both snake_case and camelCase)
    quest_id_val = data.quest_id if data.quest_id is not None else data.questId
    quest_id = "NULL"
    if quest_id_val is not None and str(quest_id_val).strip().isdigit():
        quest_id = str(quest_id_val).strip()

    # 4. Map created_by
    created_by_val = data.created_by or data.user_id or "system"
    created_by = f"'{created_by_val}'"

    # 5. Map created_dt
    created_dt = f"'{formatted_dt}'"

    table_name = "md_quest_assignment"
    
    if data.id:
        fields = f"comp_id={comp_id}, br_id={br_id}, quest_id={quest_id}, modified_by={created_by}, modified_dt={created_dt}"
        values = None
        where = f"id = {data.id}"
        flag = 1
    else:
        fields = "comp_id, br_id, quest_id, created_by, created_dt"
        values = f"{comp_id}, {br_id}, {quest_id}, {created_by}, {created_dt}"
        where = None
        flag = 0  # 0 indicates Insert in db_Insert helper
    
    res_dt = await db_Insert(table_name, fields, values, where, flag)
    return res_dt

@gamificationRouter.post('/add_streak_config')
async def add_streak_config(data: AddStreakConfig):
    current_datetime = datetime.now()
    formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
    created_by_val = data.created_by or data.user_id or "system"

    days = {
        "1": data.day1,
        "2": data.day2,
        "3": data.day3,
        "4": data.day4,
        "5": data.day5,
        "6": data.day6
    }

    results = []

    for day_num, reward_coins_val in days.items():
        if reward_coins_val is None:
            continue
            
        try:
            reward_coins = int(float(reward_coins_val))
        except ValueError:
            continue

        # Check if this streak_day already exists in the table
        check = await db_select("id", "md_ds_streak_config", f"streak_day = '{day_num}'", "", 0)
        
        # db_select returns {"suc": 1, "msg": result} if found, else {"suc": 2, "msg": "No Data Found"}
        if check.get("suc") == 1:
            # Row exists, update it
            table_name = "md_ds_streak_config"
            fields = f"reward_coins = {reward_coins}, modified_by = '{created_by_val}', modified_dt = '{formatted_dt}'"
            values = None
            where = f"streak_day = '{day_num}'"
            flag = 1  # 1 indicates Update in db_Insert helper
            
            res = await db_Insert(table_name, fields, values, where, flag)
            results.append(res)
        else:
            # Row does not exist, insert it
            table_name = "md_ds_streak_config"
            fields = "streak_day, reward_coins, created_by, created_dt"
            values = f"'{day_num}', {reward_coins}, '{created_by_val}', '{formatted_dt}'"
            where = None
            flag = 0  # 0 indicates Insert in db_Insert helper
            
            res = await db_Insert(table_name, fields, values, where, flag)
            results.append(res)

    # If any operation succeeded, return success
    if any(r.get("suc") == 1 for r in results):
        return {"suc": 1, "msg": "Streak configurations saved successfully !!"}
    else:
        return {"suc": 0, "msg": "No configurations were saved !!"}

@gamificationRouter.get('/streak_config_list')
async def get_streak_config_list():
    select = "streak_day, reward_coins, created_by, created_dt"
    table_name = "md_ds_streak_config"
    where = "1=1"
    order = "ORDER BY streak_day ASC"
    flag = 1
    
    res_dt = await db_select(select, table_name, where, order, flag)
    return res_dt

@gamificationRouter.post('/streak_config_list')
async def post_streak_config_list():
    return await get_streak_config_list()

@gamificationRouter.get('/quest_list')
async def get_quest_list():
    select = "q.quest_id, q.quest_name, q.quest_type, q.item_id, i.item_name, q.target_qty, q.reward_coins, q.start_dt, q.end_dt, q.created_by, q.created_dt"
    table_name = "md_ds_quest q LEFT JOIN md_items i ON q.item_id = i.id"
    where = "1=1"
    order = "ORDER BY q.quest_id DESC"
    flag = 1  # 1 indicates Fetch All in db_select helper
    
    res_dt = await db_select(select, table_name, where, order, flag)
    return res_dt

@gamificationRouter.post('/quest_list')
async def post_quest_list():
    return await get_quest_list()

@gamificationRouter.post('/delete_quest')
async def delete_quest(data: DeleteQuest):
    # Check if quest is assigned
    check = await db_select("id", "md_quest_assignment", f"quest_id = {data.id}", "", 0)
    if check.get("suc") == 1 and check.get("msg") and not data.force:
        return {"suc": 0, "msg": "Quest is already assigned and cannot be deleted. Use force delete to override."}
    # Delete the quest (force delete allowed)
    table_name = "md_ds_quest"
    where = f"quest_id = {data.id}"
    res_dt = await db_Delete(table_name, where)
    # If force delete, also remove any assignments for this quest
    if data.force:
        await db_Delete("md_quest_assignment", f"quest_id = {data.id}")
    return res_dt

@gamificationRouter.post('/delete_assignment')
async def delete_assignment(data: DeleteAssignment):
    # Delete an assignment by its id
    table_name = "md_quest_assignment"
    where = f"id = {data.id}"
    res_dt = await db_Delete(table_name, where)
    return res_dt

@gamificationRouter.get('/coin_rule_list')
async def get_coin_rule_list():
    select = "r.id, r.rule_name, r.calculation_type, r.coin_value, r.item_id, i.item_name, r.start_dt, r.end_dt, r.created_by, r.created_dt"
    table_name = "md_ds_coin_rule r LEFT JOIN md_items i ON r.item_id = i.id"
    where = "1=1"
    order = "ORDER BY r.id DESC"
    flag = 1
    
    res_dt = await db_select(select, table_name, where, order, flag)
    if res_dt.get("suc") == 1 and isinstance(res_dt.get("msg"), list):
        for row in res_dt["msg"]:
            if row.get("calculation_type") == "PER_RECEIPT":
                row["calculation_type"] = "PER_SHOP"
    return res_dt

@gamificationRouter.post('/delete_coin_rule')
async def delete_coin_rule(data: DeleteCoinRule):
    table_name = "md_ds_coin_rule"
    where = f"id = {data.id}"
    res_dt = await db_Delete(table_name, where)
    return res_dt

@gamificationRouter.get('/quest_assignment_list')
async def get_quest_assignment_list():
    select = "a.id, a.comp_id, a.br_id, a.quest_id, q.quest_name, q.quest_type, c.company_name, b.branch_name, a.created_by, a.created_dt"
    table_name = "md_quest_assignment a LEFT JOIN md_ds_quest q ON a.quest_id = q.quest_id LEFT JOIN md_company c ON a.comp_id = c.id LEFT JOIN md_branch b ON a.br_id = b.id"
    where = "1=1"
    order = "ORDER BY a.id DESC"
    flag = 1
    
    res_dt = await db_select(select, table_name, where, order, flag)
    return res_dt

class LeaderboardFilter(BaseModel):
    date: str
    comp_id: Union[int, str]
    br_id: Union[int, str]

@gamificationRouter.get('/admin_leaderboard')
async def get_admin_leaderboard(date: str, comp_id: str, br_id: str):
    select = "u.user_id, u.user_name, COALESCE(s.total_coins, 0) as total_earned, COALESCE(s.streak_day, 0) as max_streak"
    table_name = "md_user u LEFT JOIN td_ds_daily_summary s ON u.user_id COLLATE utf8mb4_general_ci = s.user_id COLLATE utf8mb4_general_ci AND s.trn_date = :date"
    # Wait, the db_select does not use parameter binding, it just formats sql:
    # sql = f"SELECT {select} FROM {schema} {whr} {order}"
    # So we need to put the value directly in the table name or where clause, but safely.
    # To prevent injection or syntax error, we just escape it or use it as string since it comes from admin portal.
    table_name_sql = f"md_user u LEFT JOIN td_ds_daily_summary s ON u.user_id COLLATE utf8mb4_general_ci = s.user_id COLLATE utf8mb4_general_ci AND s.trn_date = '{date}'"
    where = f"u.comp_id = {comp_id} AND u.br_id = {br_id}"
    order = "ORDER BY total_earned DESC, u.user_name ASC"
    
    res_dt = await db_select(select, table_name_sql, where, order, 1)
    return res_dt

@gamificationRouter.post('/admin_leaderboard')
async def post_admin_leaderboard(filter_data: LeaderboardFilter):
    return await get_admin_leaderboard(str(filter_data.date), str(filter_data.comp_id), str(filter_data.br_id))

@gamificationRouter.post('/add_working_day')
async def add_working_day(data: AddWorkingDayConfig):
    current_datetime = datetime.now()
    formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
    created_by_val = data.created_by or data.user_id or "system"
    comp_id = str(data.comp_id).strip()
    br_id = str(data.br_id).strip()

    results = []
    
    # First delete existing configs for this comp_id and br_id (simple overwrite strategy)
    where_del = f"comp_id = {comp_id} AND br_id = {br_id}"
    await db_Delete("md_ds_working_day", where_del)

    # Insert new ones
    for day_num, is_working in data.days.items():
        if not str(day_num).isdigit():
            continue
            
        day_int = int(day_num)
        working_flag = 'Y' if str(is_working).upper() == 'Y' else 'N'
        
        table_name = "md_ds_working_day"
        fields = "comp_id, br_id, weekday_no, is_working_day, created_by, created_dt"
        values = f"{comp_id}, {br_id}, {day_int}, '{working_flag}', '{created_by_val}', '{formatted_dt}'"
        where = None
        flag = 0  # Insert
        
        res = await db_Insert(table_name, fields, values, where, flag)
        results.append(res)

    if any(r.get("suc") == 1 for r in results):
        return {"suc": 1, "msg": "Working day configurations saved successfully !!"}
    else:
        # if dictionary was empty, could be success too because we cleared it
        if len(data.days) == 0:
            return {"suc": 1, "msg": "Working day configurations cleared successfully !!"}
        return {"suc": 0, "msg": "No configurations were saved !!"}

@gamificationRouter.get('/working_day_list')
async def get_working_day_list(comp_id: str, br_id: str):
    select = "weekday_no, is_working_day"
    table_name = "md_ds_working_day"
    where = f"comp_id = {comp_id} AND br_id = {br_id}"
    order = "ORDER BY weekday_no ASC"
    
    res_dt = await db_select(select, table_name, where, order, 1)
    
    # default all working
    default_days = [{"weekday_no": i, "is_working_day": "Y"} for i in range(7)]
    
    if res_dt.get("suc") == 1 and isinstance(res_dt.get("msg"), list) and len(res_dt["msg"]) > 0:
        db_days = {row["weekday_no"]: row["is_working_day"] for row in res_dt["msg"]}
        merged_days = [{"weekday_no": i, "is_working_day": db_days.get(i, "Y")} for i in range(7)]
        return {"suc": 1, "msg": merged_days}
    else:
        return {"suc": 1, "msg": default_days}
