from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class AuditLogResponse(BaseModel):
    id: UUID
    teacher_id: Optional[UUID] = None
    teacher_name: str
    account: Optional[str] = None
    platform: Optional[str] = None
    ip_address: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    detail: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
