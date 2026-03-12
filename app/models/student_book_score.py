import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class StudentBookScore(Base):
    __tablename__ = "student_book_scores"
    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "book_id",
            "term",
            "target_part",
            name="uq_student_book_term_target",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    term = Column(String(20), nullable=False)
    target_part = Column(String(20), nullable=False)
    current_score = Column(Integer, nullable=False, default=0)
    max_single_score = Column(Integer, nullable=False, default=0)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
