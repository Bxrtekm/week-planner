# Week Planner: kontekst dla asystentów AI

Desktopowy planer tygodnia dla studentów z asystentem AI (Electron + React + FastAPI + SQLite).

## Części repozytorium

- `backend/`: FastAPI (Python 3.11). Endpointy w `app/routers/`, ustawienia w `app/config.py`, testy w `tests/`.
- `frontend/`: React 19 + Vite + Tailwind 4 (JSX). Wywołania API przez `src/lib/api.js`.
- `electron/`: launcher. `backend.js` wykrywa albo uruchamia uvicorn z `backend/.venv`, `main.js` otwiera okno z `http://127.0.0.1:5173`.
- `docs/`: plan realizacji (PDF) i dokumenty projektowe w `docs/superpowers/`.

## Polecenia

- Uruchomienie aplikacji: `npm run dev` (katalog główny)
- Backend (w `backend/`, z aktywnym `.venv`): `pytest`, `black --check app tests`, `flake8 app tests`
- Frontend (katalog główny): `npm run lint`, `npm run build`
- Zależności Pythona: edytuj `backend/requirements.in`, potem `pip-compile`

## Twarde zasady

- Wszystkie endpointy pod `/api`. Frontend woła tylko względne `/api/...`.
- Aplikacja desktopowa dla jednego użytkownika: bez logowania, kont, JWT, CORS i `user_id`.
- Sekrety tylko w `backend/.env` (poza repo). Klucz OpenAI nigdy nie trafia do frontendu.
- Port backendu: zmienna `BACKEND_PORT` (domyślnie 8000), host `127.0.0.1`.
- Menedżer pakietów JS: wyłącznie npm (workspaces `frontend`, `electron`).
- black + flake8, `max-line-length = 88`. Linter JS: oxlint.
- Końce linii LF.
- Dokumentacja, teksty w UI, issues i commity po polsku; identyfikatory w kodzie po angielsku.
- Zmiany na `main` tylko przez PR z zielonym CI (`backend`, `frontend`), squash merge.

## Więcej

- [CONTRIBUTING.md](CONTRIBUTING.md): workflow zespołu i konwencje
- [SCOPE.md](SCOPE.md): zakres projektu
- `docs/superpowers/specs/`: decyzje projektowe
