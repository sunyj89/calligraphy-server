import uuid
from datetime import datetime, timezone
from sqlalchemy import JSON, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=True)
    teacher_name = Column(String(50), nullable=False)
    account = Column(String(50), nullable=True)
    platform = Column(String(20), nullable=True)  # teacher/student
    ip_address = Column(String(64), nullable=True)
    action = Column(String(50), nullable=False)  # create, update, delete, add_score, etc.
    target_type = Column(String(50), nullable=False)  # student, teacher, classroom, book, score
    target_id = Column(String(100), nullable=True)
    detail = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
