import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# Try finding .env file in parent directories and project root
dotenv_path = find_dotenv()
if not dotenv_path:
    candidate = Path(__file__).resolve().parents[2] / ".env"
    if candidate.exists():
        dotenv_path = str(candidate)

if dotenv_path:
    load_dotenv(dotenv_path, encoding="utf-8-sig")
else:
    load_dotenv(encoding="utf-8-sig")

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("\ufeffDATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. Please ensure your .env file contains DATABASE_URL."
    )

# Fix for SQLAlchemy: postgres:// -> postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)