import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    openid = Column(String(50))
    phone = Column(String(20))
    unionid = Column(String(50))
    name = Column(String(50), nullable=False)
    avatar = Column(String(255))
    address = Column(String(255))
    school = Column(String(100))
    grade = Column(String(50))
    total_score = Column(Integer, default=0)
    root_score = Column(Integer, default=0)
    trunk_score = Column(Integer, default=0)
    leaf_count = Column(Integer, default=0)
    fruit_count = Column(Integer, default=0)
    stage = Column(String(20), default='sprout')
    is_senior = Column(Boolean, default=False)
    ever_reached_senior = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_active = Column(DateTime(timezone=True), nullable=True)
