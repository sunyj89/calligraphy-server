import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Uuid
from app.models.base import Base


class Work(Base):
    __tablename__ = "works"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(Uuid(as_uuid=True), ForeignKey("students.id"), nullable=False)
    book_id = Column(Uuid(as_uuid=True), ForeignKey("books.id"), nullable=True)
    image_url = Column(String(255), nullable=False)
    thumbnail_url = Column(String(255))
    description = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
