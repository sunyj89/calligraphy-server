import asyncio
import os
import sys
from pathlib import Path

import uvicorn


ROOT = Path(__file__).resolve().parents[1]
LOCAL_DIR = ROOT / ".local"
LOCAL_DB_PATH = LOCAL_DIR / "local-dev.sqlite3"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def configure_environment() -> None:
    LOCAL_DIR.mkdir(exist_ok=True)
    os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{LOCAL_DB_PATH.as_posix()}")
    os.environ.setdefault("USE_FAKE_REDIS", "true")
    os.environ.setdefault(
        "CORS_ORIGINS",
        '["http://localhost:5173","http://localhost:4173"]',
    )


def should_initialize_database() -> bool:
    return os.getenv("RESET_LOCAL_DB") == "1" or not LOCAL_DB_PATH.exists()


def main() -> None:
    configure_environment()

    if should_initialize_database():
        from scripts.init_db import init_db

        asyncio.run(init_db())

    from app.main import create_app

    uvicorn.run(create_app(), host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
