from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.base import get_db
from app.api.dependencies import get_current_admin
from app.models.user import Teacher
from app.schemas.user import TeacherResponse
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResetPassword
from app.core.security import hash_password
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/teachers", tags=["教师管理"])


@router.get("")
async def list_teachers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    query = select(Teacher).where(Teacher.is_active == True)
    if search:
        query = query.where(Teacher.name.ilike(f"%{search}%") | Teacher.phone.ilike(f"%{search}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Teacher.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    teachers = result.scalars().all()

    return {
        "items": [TeacherResponse.model_validate(t).model_dump(mode="json") for t in teachers],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("", response_model=TeacherResponse)
async def create_teacher(
    data: TeacherCreate,
    db: AsyncSession = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    existing = await db.execute(select(Teacher).where(Teacher.phone == data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="手机号已存在")

    teacher = Teacher(
        name=data.name,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return teacher


@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: str,
    data: TeacherUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="教师不存在")

    if data.name is not None:
        teacher.name = data.name
    if data.phone is not None:
        existing = await db.execute(select(Teacher).where(Teacher.phone == data.phone, Teacher.id != teacher_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="手机号已存在")
        teacher.phone = data.phone
    if data.role is not None:
        teacher.role = data.role

    teacher.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}")
async def delete_teacher(
    teacher_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    if str(admin.id) == teacher_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能删除自己的账号")

    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="教师不存在")

    teacher.is_active = False
    teacher.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "已禁用"}


@router.put("/{teacher_id}/reset-password")
async def reset_password(
    teacher_id: str,
    data: TeacherResetPassword,
    db: AsyncSession = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="教师不存在")

    teacher.password_hash = hash_password(data.new_password)
    teacher.password_changed_at = datetime.now(timezone.utc)
    teacher.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "密码已重置"}
