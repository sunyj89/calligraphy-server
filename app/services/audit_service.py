from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.audit_log import AuditLog
from typing import Optional, Any
from uuid import UUID


async def create_log(
    db: AsyncSession,
    teacher_id: Optional[str],
    teacher_name: str,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    detail: Optional[Any] = None,
    account: Optional[str] = None,
    platform: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    log = AuditLog(
        teacher_id=UUID(teacher_id) if teacher_id else None,
        teacher_name=teacher_name,
        account=account,
        platform=platform,
        ip_address=ip_address,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
    )
    db.add(log)
    await db.flush()
    return log


async def get_logs(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
) -> dict:
    query = select(AuditLog)
    count_query = select(func.count()).select_from(AuditLog)

    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)
    if target_type:
        query = query.where(AuditLog.target_type == target_type)
        count_query = count_query.where(AuditLog.target_type == target_type)

    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(desc(AuditLog.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def create_login_log(
    db: AsyncSession,
    account: str,
    platform: str,
    ip_address: Optional[str],
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
) -> AuditLog:
    return await create_log(
        db=db,
        teacher_id=actor_id if platform == "teacher" else None,
        teacher_name=actor_name or account,
        account=account,
        platform=platform,
        ip_address=ip_address,
        action="login_success",
        target_type="auth",
        target_id=actor_id,
        detail={"account": account, "platform": platform, "ip_address": ip_address},
    )
