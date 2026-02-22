from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.models.base import get_db
from app.api.dependencies import get_current_admin
from app.models.user import Teacher
from app.schemas.audit_log import AuditLogListResponse
from app.services import audit_service

router = APIRouter(prefix="/api/audit-logs", tags=["操作日志"])


@router.get("", response_model=AuditLogListResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_admin: Teacher = Depends(get_current_admin),
):
    return await audit_service.get_logs(db, page, page_size, action, target_type)
