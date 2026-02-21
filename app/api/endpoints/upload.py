from fastapi import APIRouter, UploadFile, File, Depends
from app.api.dependencies import get_current_teacher
from app.models.user import Teacher
import os
import uuid

router = APIRouter(prefix="/api/upload", tags=["文件上传"])

UPLOAD_DIR = "uploads"


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    return {
        "url": f"/uploads/{filename}",
        "filename": filename
    }
