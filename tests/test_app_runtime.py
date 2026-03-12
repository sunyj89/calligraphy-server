from pathlib import Path

from app.main import create_app


def test_create_app_creates_missing_upload_directory(tmp_path: Path):
    upload_dir = tmp_path / "uploads"

    assert not upload_dir.exists()

    app = create_app(upload_dir=upload_dir)

    assert upload_dir.exists()
    assert any(route.path == "/uploads" for route in app.routes)
