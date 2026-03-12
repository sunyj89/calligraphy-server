import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class ScoreRecord(Base):
    __tablename__ = "score_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)
    score_type = Column(String(20), nullable=False)  # practice/homework/work/competition
    score = Column(Integer, nullable=False)  # applied score
    raw_score = Column(Integer, nullable=True)
    multiplier = Column(Integer, nullable=True)
    term = Column(String(20), nullable=True)
    target_part = Column(String(20), nullable=True)  # root/trunk for practice
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=True)
    work_id = Column(UUID(as_uuid=True), ForeignKey("works.id"), nullable=True)
    reason = Column(String(200))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
