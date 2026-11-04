# Week Planner

Desktopowy planer tygodnia dla studentów z asystentem AI, który rozmawia o planie i sam go zmienia.

## O projekcie

Week Planner łączy klasyczny planer (zadania, wydarzenia, terminy) z asystentem AI w formie czatu.
Asystent nie tylko odpowiada na pytania, ale też dodaje, przesuwa i usuwa zadania oraz proponuje
harmonogram dnia. Aplikacja działa w całości na komputerze użytkownika, a dane trzyma lokalnie w SQLite.

Projekt powstaje w 5 tygodni (od 9.11.2026). Harmonogram i zadania są w
[milestones i issues](https://github.com/Bxrtekm/week-planner/issues).

## Główne funkcje (MVP)

- zarządzanie zadaniami i wydarzeniami (dodawanie, edycja, usuwanie),
- widok dnia i tygodnia,
- czat z asystentem AI,
- wykonywanie akcji na planie przez asystenta (dodanie, przesunięcie, usunięcie zadania),
- generowanie planu dnia na podstawie priorytetów, terminów i dostępnego czasu.

## Stack

| Warstwa | Technologia |
|---|---|
| Interfejs użytkownika | React 19, Vite 8, Tailwind CSS 4 |
| Aplikacja desktopowa | Electron 45 (okno aplikacji, uruchamianie backendu) |
| Backend / API | Python 3.11, FastAPI |
| Baza danych | SQLite (lokalnie) |
| Asystent AI | OpenAI API, function calling |
| Narzędzia | npm workspaces, pip-tools, pytest, black, flake8, oxlint, GitHub Actions; docelowo PyInstaller i electron-builder |

## Wymagania

- [Python 3.11](https://www.python.org/downloads/)
- [Node.js 24](https://nodejs.org/) (razem z npm)
- [Git](https://git-scm.com/)

## Szybki start

### 1. Repozytorium i zależności JS

```bash
git clone https://github.com/Bxrtekm/week-planner.git
cd week-planner
npm install
```

### 2. Backend

Windows (PowerShell lub cmd):

```powershell
cd backend
py -3.11 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env
cd ..
```

macOS / Linux:

```bash
cd backend
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
cd ..
```

Instalacja przez `python` z `.venv` nie wymaga aktywowania środowiska, więc działa także wtedy,
gdy PowerShell blokuje skrypty. Na Ubuntu/Debianie może być potrzebny pakiet `python3.11-venv`.

Klucz OpenAI (`OPENAI_API_KEY` w `backend/.env`) będzie potrzebny dopiero od Tygodnia 3.

### 3. Uruchomienie

```bash
npm run dev
```

Otworzy się okno aplikacji ze statusem „Backend: połączono ✓”. Electron sam uruchamia backend
i zamyka go razem z aplikacją. Jeśli backend już działa na porcie 8000 (np. uruchomiony ręcznie
przez `uvicorn app.main:app --reload`), Electron użyje go zamiast startować drugi.

Przy pierwszym uruchomieniu Electron pobiera swoją binarkę (ok. 160 MB).

## Struktura repozytorium

```
week-planner/
├── backend/      # FastAPI: app/ (main, config, routers), tests/, requirements.in/.txt
├── frontend/     # React + Vite + Tailwind: src/ (App, lib/api.js)
├── electron/     # launcher: main.js (okno), backend.js (start i zamykanie backendu)
├── docs/         # plan realizacji, dokumenty projektowe
├── .github/      # CI, szablony PR i issue
└── package.json  # npm workspaces i skrypty dev / lint / build
```

## Testy i lint

Backend (w `backend/`, z aktywnym `.venv`):

```bash
pytest
black --check app tests
flake8 app tests
```

Aktywacja `.venv`: Windows cmd `.venv\Scripts\activate.bat`, Git Bash `source .venv/Scripts/activate`,
macOS/Linux `source .venv/bin/activate`. W PowerShell skrypt aktywacji bywa zablokowany;
wtedy użyj cmd, Git Bash albo wywołuj narzędzia przez `.venv\Scripts\python -m pytest` (analogicznie `-m black`, `-m flake8`).

Frontend (w katalogu głównym):

```bash
npm run lint
npm run build
```

Te same kroki uruchamia CI przy każdym pull requeście.

## Zmienna BACKEND_PORT

Backend domyślnie działa na porcie 8000. Jeśli port jest zajęty, ustaw inny przed `npm run dev`:

```powershell
$env:BACKEND_PORT = "8001"; npm run dev
```

```bash
BACKEND_PORT=8001 npm run dev
```

## Rozwiązywanie problemów

- **„Electron failed to install correctly”**: pobieranie binarki Electrona zostało przerwane.
  Ponów je poleceniem `node node_modules/electron/install.js`.
- **Okno „Nie znaleziono backend/.venv”**: wykonaj kroki z sekcji [Backend](#2-backend).
- **Okno „Backend zakończył działanie” z `No module named uvicorn`**: zależności nie trafiły do `.venv`.
  Powtórz polecenie `... -m pip install -r requirements.txt` z sekcji [Backend](#2-backend).
- **Okno „Backend zakończył działanie” z błędem `[Errno 10048]` lub `address already in use`**:
  port 8000 zajmuje inny program. Zamknij go albo ustaw `BACKEND_PORT`.

## Dokumenty

- [CONTRIBUTING.md](CONTRIBUTING.md): jak pracujemy (gałęzie, PR-y, zasady kodu)
- [SCOPE.md](SCOPE.md): zakres projektu i kryteria ukończenia
- [docs/plan-realizacji.pdf](docs/plan-realizacji.pdf): plan realizacji projektu
