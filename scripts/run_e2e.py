import os
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT / "frontend"
H5_DIR = ROOT / "H5"
LOG_DIR = ROOT / ".local" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def command_name(base: str) -> str:
    return f"{base}.cmd" if os.name == "nt" else base


def start_process(command: list[str], cwd: Path, log_name: str, extra_env: dict[str, str] | None = None):
    log_path = LOG_DIR / log_name
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)
    log_handle = open(log_path, "w", encoding="utf-8")
    process = subprocess.Popen(
        command,
        cwd=cwd,
        env=env,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        text=True,
    )
    return process, log_handle, log_path


def wait_for_url(url: str, timeout: int = 60) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urlopen(url, timeout=2) as response:
                if 200 <= response.status < 500:
                    return
        except Exception:
            time.sleep(1)
    raise RuntimeError(f"Timed out waiting for {url}")


def stop_process(process: subprocess.Popen, log_handle) -> None:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
    log_handle.close()


def main() -> int:
    test_args = sys.argv[1:]
    processes: list[tuple[subprocess.Popen, object]] = []
    try:
        backend, backend_log, _ = start_process(
            [sys.executable, "scripts/local_dev_server.py"],
            ROOT,
            "backend-e2e.log",
            {"RESET_LOCAL_DB": "1"},
        )
        processes.append((backend, backend_log))
        wait_for_url("http://127.0.0.1:8000/docs", timeout=90)

        frontend, frontend_log, _ = start_process(
            [command_name("npm"), "run", "dev", "--", "--host", "127.0.0.1"],
            FRONTEND_DIR,
            "frontend-e2e.log",
        )
        processes.append((frontend, frontend_log))
        wait_for_url("http://127.0.0.1:5173", timeout=90)

        h5, h5_log, _ = start_process(
            [command_name("npm"), "run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"],
            H5_DIR,
            "h5-e2e.log",
        )
        processes.append((h5, h5_log))
        wait_for_url("http://127.0.0.1:4173/h5/", timeout=90)

        result = subprocess.run(
            [command_name("npx"), "playwright", "test", "--project=chromium", "--reporter=line", *test_args],
            cwd=FRONTEND_DIR,
            text=True,
        )
        return result.returncode
    finally:
        for process, log_handle in reversed(processes):
            stop_process(process, log_handle)


if __name__ == "__main__":
    raise SystemExit(main())
