from fastapi import APIRouter
from app.api.endpoints import auth, wechat_auth, students, scores, books, works, upload

router = APIRouter()

router.include_router(auth.router)
router.include_router(wechat_auth.router)
router.include_router(students.router)
router.include_router(scores.router)
router.include_router(books.router)
router.include_router(works.router)
router.include_router(upload.router)
