from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import routers
from app.core.config import settings
from app.core.redis import close_redis

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_redis()


def create_app(upload_dir: Path | None = None) -> FastAPI:
    static_dir = upload_dir or UPLOADS_DIR
    static_dir.mkdir(parents=True, exist_ok=True)

    application = FastAPI(
        title="涔︽硶鎴愰暱鏍?API",
        version="1.4.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(routers.router)
    application.mount("/uploads", StaticFiles(directory=str(static_dir)), name="uploads")

    @application.get("/")
    async def root():
        return {"message": "涔︽硶鎴愰暱鏍?API", "version": "1.4.0"}

    @application.get("/health")
    async def health():
        return {"status": "ok"}

    return application


app = create_app()
