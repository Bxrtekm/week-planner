import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Pusta wartość (np. OPENAI_API_KEY="" skopiowane z .env.example) oznacza brak klucza.
OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY") or None
