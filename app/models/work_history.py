import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class WorkHistory(Base):
    __tablename__ = "work_histories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_id = Column(UUID(as_uuid=True), ForeignKey("works.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)
    previous_image_url = Column(String(255), nullable=False)
    previous_description = Column(String(200))
    previous_score = Column(Integer, nullable=False, default=0)
    replaced_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
