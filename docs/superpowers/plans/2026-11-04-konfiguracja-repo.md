# Konfiguracja repozytorium i szkielet aplikacji — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repozytorium `Bxrtekm/week-planner` z dokumentacją, CI, szablonami, zadaniami na GitHubie i szkieletem Electron + React + FastAPI, który po `npm run dev` pokazuje w oknie „Backend: połączono ✓”.

**Architecture:** Monorepo z npm workspaces (`frontend`, `electron`) i osobnym backendem w Pythonie. Electron jest cienkim launcherem: wykrywa albo uruchamia uvicorn z `backend/.venv` i otwiera okno z serwera Vite. Frontend woła wyłącznie względne `/api/...`, które Vite przekazuje do backendu przez proxy.

**Tech Stack:** Python 3.11, FastAPI, uvicorn, python-dotenv, pip-tools, pytest, black, flake8 · Node 24, npm workspaces, Vite 8, React 19, Tailwind 4, lucide-react, oxlint · Electron 45, concurrently, wait-on · GitHub Actions, GitHub CLI.

**Spec:** `docs/superpowers/specs/2026-11-04-konfiguracja-repo-design.md`

## Global Constraints

- Python 3.11 (`py -3.11` na Windowsie). Node 24. Wyłącznie npm, nigdy Bun ani yarn.
- Wszystkie endpointy backendu pod prefiksem `/api`.
- Dokumentacja, szablony, issues i commity po polsku. Identyfikatory w kodzie po angielsku.
- Aplikacja tylko desktopowa: bez logowania, kont, JWT, OAuth, CORS i `user_id`. Bez instrukcji „uruchom w przeglądarce” w dokumentacji.
- Backend: host `127.0.0.1`, port ze zmiennej powłoki `BACKEND_PORT`, domyślnie `8000`. Czytają ją tylko Vite i Electron.
- Vite: `127.0.0.1:5173`, `strictPort: true`.
- black i flake8: `max-line-length = 88`.
- Sekrety wyłącznie w `backend/.env`, który jest w `.gitignore`.
- Wszystkie pliki tekstowe z końcami linii LF.
- Każdy commit kończy się linią `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Push, zmiany ustawień na GitHubie i tworzenie issues tylko po wyraźnej zgodzie użytkownika w czacie. Logowanie `gh auth login` wykonuje użytkownik.
- Polecenia shellowe w planie są w składni Git Bash. Katalog roboczy: `D:\.Projekty\[5] Prompt engineering\week-planner` (w Bashu: `"/d/.Projekty/[5] Prompt engineering/week-planner"`).

## Review Focus

1. **Ścieżka projektu ze spacjami i nawiasami kwadratowymi** (`[5] Prompt engineering`): build, wykrywanie klas Tailwinda i start backendu muszą działać. Test: Task 3, krok 7 (klasa Tailwinda w zbudowanym CSS); Task 4, scenariusz S1 uruchamiany z tej ścieżki.
2. **Port 8000 zajęty przez obcy proces**: oczekiwany czytelny dialog z błędem uvicorn, a nie zawieszenie albo puste okno. Test: Task 4, scenariusz S4.
3. **Zamknięcie okna albo Ctrl+C w terminalu z `npm run dev`**: nie może zostać osierocony uvicorn trzymający port 8000. Test: Task 4, scenariusze S1 i S5.
4. **Nowa osoba po świeżym `git clone`** (bez `node_modules`, `.venv`, `.env`): kroki z README mają wystarczyć. Test: Task 7, kroki 1–3 (czysty klon w katalogu tymczasowym).
5. **Osoba z `core.autocrlf=true` na Windowsie**: pliki w repo pozostają LF, a `black --check` w CI nie zgłasza różnic. Test: Task 1, krok 5 (`git ls-files --eol`).

---

### Task 1: Pliki bazowe repozytorium

**Files:**
- Create: `.gitignore`, `.gitattributes`, `.editorconfig`
- Move: `pliki/Plan realizacji desktopowy planer dnia studenta z asystentem AI 1.pdf` → `docs/plan-realizacji.pdf` (katalog `pliki/` usunąć)

**Interfaces:**
- Produces: reguły ignorowania (`.venv/`, `node_modules/`, `.env`, `*.db`, `dist/`) i LF, na których opierają się wszystkie dalsze taski.

- [ ] **Step 1: Utwórz `.gitignore`**

Wpisy dokładnie ze specyfikacji, sekcja 7: `.venv/`, `venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`, `.env`, `*.db`, `node_modules/`, `dist/`, `build/`, `out/`, `.claude/settings.local.json`, `.superpowers/`.

- [ ] **Step 2: Utwórz `.gitattributes`**

```gitattributes
* text=auto eol=lf
*.pdf binary
*.png binary
*.jpg binary
*.ico binary
```

- [ ] **Step 3: Utwórz `.editorconfig`**

`root = true`; `[*]`: `charset = utf-8`, `end_of_line = lf`, `insert_final_newline = true`, `trim_trailing_whitespace = true`, `indent_style = space`, `indent_size = 2`; `[*.py]`: `indent_size = 4`; `[*.md]`: `trim_trailing_whitespace = false`.

- [ ] **Step 4: Przenieś PDF**

```bash
mv "pliki/Plan realizacji desktopowy planer dnia studenta z asystentem AI 1.pdf" docs/plan-realizacji.pdf && rmdir pliki
```

- [ ] **Step 5: Znormalizuj i sprawdź końce linii**

```bash
git add -A && git add --renormalize . && git ls-files --eol
```

Expected: każdy plik tekstowy ma `i/lf` i `attr/text eol=lf`, `docs/plan-realizacji.pdf` ma `i/-text`. `git status --short` nie pokazuje `.claude/`.

- [ ] **Step 6: Commit**

```bash
git commit -m "Dodaj pliki bazowe repozytorium i przenieś plan realizacji do docs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Backend z endpointem `/api/health`

**Files:**
- Create: `backend/requirements.in`, `backend/requirements.txt` (generowany), `backend/pyproject.toml`, `backend/.flake8`, `backend/pytest.ini`, `backend/.env.example`
- Create: `backend/app/__init__.py`, `backend/app/main.py`, `backend/app/config.py`, `backend/app/routers/__init__.py`, `backend/app/routers/health.py`
- Test: `backend/tests/__init__.py`, `backend/tests/test_health.py`, `backend/tests/test_config.py`

**Interfaces:**
- Produces: `GET /api/health` → 200, `{"status": "ok"}` (używane przez Electron w Task 4 i frontend w Task 3); obiekt `app.main:app` (cel uvicorn); `app.config.OPENAI_API_KEY: str | None`.

- [ ] **Step 1: Środowisko i zależności**

`backend/requirements.in`: sekcja runtime `fastapi`, `uvicorn`, `python-dotenv`; sekcja devtools `pip-tools`, `pytest`, `httpx`, `black`, `flake8` (z komentarzami `# runtime` / `# devtools`, jak w student-assistant).

```bash
cd backend && py -3.11 -m venv .venv && .venv/Scripts/python -m pip install pip-tools && .venv/Scripts/pip-compile requirements.in && .venv/Scripts/pip install -r requirements.txt
```

Expected: powstaje `requirements.txt` z przypiętymi wersjami, instalacja kończy się bez błędów.

- [ ] **Step 2: Konfiguracja narzędzi**

- `pyproject.toml`: `[tool.black]` z `line-length = 88`, `target-version = ["py311"]`.
- `.flake8`: `max-line-length = 88`, `extend-ignore = E203`, `exclude = .venv,venv,__pycache__,.pytest_cache`.
- `pytest.ini`: `[pytest]`, `testpaths = tests`, `pythonpath = .`.
- `.env.example`: komentarz „Skopiuj do .env (copy .env.example .env)”, potem `OPENAI_API_KEY=""` z komentarzem „Klucz OpenAI — potrzebny od Tygodnia 3 (asystent AI)”.

- [ ] **Step 3: Napisz testy, które na razie nie przechodzą**

`tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_is_only_under_api_prefix():
    assert client.get("/health").status_code == 404
```

`tests/test_config.py`:

```python
import importlib

from app import config


def test_openai_api_key_is_read_from_environment(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    importlib.reload(config)
    assert config.OPENAI_API_KEY == "sk-test"
```

- [ ] **Step 4: Uruchom testy i potwierdź, że nie przechodzą**

Run: `cd backend && .venv/Scripts/python -m pytest -v`
Expected: FAIL, `ModuleNotFoundError: No module named 'app'`.

- [ ] **Step 5: Zaimplementuj backend**

- `app/config.py`: `load_dotenv(Path(__file__).resolve().parent.parent / ".env")`, dzięki czemu ścieżka nie zależy od katalogu roboczego; `OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")`.
- `app/routers/health.py`: `router = APIRouter(tags=["health"])` i `@router.get("/health")` zwracające `{"status": "ok"}`. Ścieżka bez końcowego `/`, żeby nie było przekierowania 307.
- `app/main.py`: `app = FastAPI(title="Week Planner")`, `app.include_router(health.router, prefix="/api")`. Bez CORS.
- `app/__init__.py`, `app/routers/__init__.py`, `tests/__init__.py` puste.

- [ ] **Step 6: Uruchom testy i linty**

Run: `cd backend && .venv/Scripts/python -m pytest -v && .venv/Scripts/black --check app tests && .venv/Scripts/flake8 app tests`
Expected: 3 passed; black „All done! ✨ … would be left unchanged”; flake8 bez wyjścia.

- [ ] **Step 7: Commit**

```bash
git add backend && git commit -m "Dodaj szkielet backendu FastAPI z endpointem /api/health" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Frontend ze statusem backendu

**Files:**
- Create: `package.json` (katalog główny), `package-lock.json` (generowany)
- Create: `frontend/package.json`, `frontend/index.html`, `frontend/vite.config.js`, `frontend/.oxlintrc.json`
- Create: `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/styles.css`, `frontend/src/lib/api.js`

**Interfaces:**
- Consumes: `GET /api/health` z Task 2.
- Produces: `apiGet(path: string): Promise<any>` w `frontend/src/lib/api.js`. Woła `fetch('/api' + path)` i rzuca `Error('HTTP <status>')` przy statusie spoza 2xx. Ten wrapper dla wszystkich przyszłych wywołań API zostaje przy GET; inne metody dodaje się obok, gdy będą potrzebne. Serwer dev działa pod `http://127.0.0.1:5173` (używa go Task 4).

- [ ] **Step 1: `package.json` w katalogu głównym**

`"name": "week-planner"`, `"private": true`, `"workspaces": ["frontend"]` (`electron` dochodzi w Task 4), skrypty `"lint": "npm run lint -w frontend"` i `"build": "npm run build -w frontend"`.

- [ ] **Step 2: `frontend/package.json` i zależności**

`"name": "week-planner-frontend"`, `"private": true`, `"type": "module"`, skrypty jak w szablonie create-vite 9: `dev: vite`, `build: vite build`, `lint: oxlint`, `preview: vite preview`.

```bash
npm install -w frontend react react-dom lucide-react && npm install -D -w frontend vite @vitejs/plugin-react tailwindcss @tailwindcss/vite oxlint
```

Expected: powstaje `package-lock.json` w katalogu głównym, a `node_modules` są wspólne (hoisting).

- [ ] **Step 3: Konfiguracja Vite i lintera**

- `vite.config.js`: pluginy `react()` i `tailwindcss()`; `server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': \`http://127.0.0.1:${process.env.BACKEND_PORT ?? '8000'}\` } }`.
- `.oxlintrc.json`: treść z szablonu create-vite 9 (`plugins: ["react", "oxc"]`, `react/rules-of-hooks: error`, `react/only-export-components: ["warn", { "allowConstantExport": true }]`), przy czym `$schema` wskazuje `../node_modules/oxlint/configuration_schema.json`, bo `node_modules` leży w katalogu głównym.
- `index.html`: jak w szablonie, ale `lang="pl"`, `<title>Week Planner</title>`, bez linku do favicony.

- [ ] **Step 4: Kod aplikacji**

- `src/styles.css`: `@import "tailwindcss";`
- `src/main.jsx`: jak w szablonie (`StrictMode`, `createRoot`), importuje `./styles.css` i `./App.jsx`.
- `src/lib/api.js`: `apiGet` zgodnie z Interfaces.
- `src/App.jsx`: nagłówek „Week Planner”, podtytuł „Planer tygodnia studenta z asystentem AI” i linia statusu w trzech stanach, z dokładnie takimi tekstami:
  - w trakcie: `Łączenie z backendem…`
  - sukces: `Backend: połączono ✓` z klasą `text-emerald-600`
  - błąd: `Backend: brak połączenia (<error.message>)` z klasą `text-red-600`

  Stan ustawiany w `.then`/`.catch` wywołania `apiGet('/health')` w `useEffect` z pustą listą zależności.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: `Found 0 warnings and 0 errors.`

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: `✓ built in …`, powstaje `frontend/dist/`.

- [ ] **Step 7: Tailwind wykrywa klasy mimo nawiasów w ścieżce (Review Focus 1)**

Run: `grep -l "text-emerald-600" frontend/dist/assets/*.css`
Expected: wypisuje plik CSS. Brak wyniku oznacza, że Tailwind nie przeskanował `src/` przez znaki `[ ]` w ścieżce. Wtedy dodaj `@source "./";` w `styles.css` i powtórz kroki 6–7.

- [ ] **Step 8: Proxy `/api` działa**

W osobnych terminalach: `cd backend && .venv/Scripts/python -m uvicorn app.main:app --port 8000` oraz `npm run dev -w frontend`, potem:
Run: `curl -s http://127.0.0.1:5173/api/health`
Expected: `{"status":"ok"}`. Zatrzymaj oba procesy.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json frontend && git commit -m "Dodaj szkielet frontendu React z odczytem statusu backendu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Launcher Electron

**Files:**
- Create: `electron/package.json`, `electron/main.js`, `electron/backend.js`
- Modify: `package.json` (katalog główny): workspace `electron`, skrypt `dev`, devDependencies `concurrently` i `wait-on`

**Interfaces:**
- Consumes: `GET /api/health` (Task 2), `backend/.venv` z Task 2, serwer Vite `http://127.0.0.1:5173` (Task 3).
- Produces (`electron/backend.js`, CommonJS):
  - `ensureBackend({ port: number, backendDir: string }): Promise<void>` — rozwiązuje się, gdy `/api/health` odpowiada 200; rzuca `Error` z polskim komunikatem.
  - `stopBackend(): void` — kończy proces tylko, jeśli uruchomił go `ensureBackend`.

- [ ] **Step 1: Pakiet i zależności**

`electron/package.json`: `"name": "week-planner-electron"`, `"private": true`, `"main": "main.js"`, skrypt `"start": "electron ."`. W katalogu głównym dopisz `"electron"` do `workspaces`.

```bash
npm install -D -w electron electron && npm install -D concurrently wait-on
```

W głównym `package.json` dodaj skrypt:
`"dev": "concurrently -k -n vite,electron -c cyan,magenta \"npm run dev -w frontend\" \"wait-on tcp:127.0.0.1:5173 && npm start -w electron\""`

- [ ] **Step 2: `electron/backend.js`**

Algorytm z sekcji 5.3 specyfikacji:
1. `isHealthy(port)`: `fetch` na `http://127.0.0.1:${port}/api/health` z `AbortSignal.timeout(1000)`; `true` tylko przy statusie 200, każdy wyjątek daje `false`.
2. Jeśli zdrowy: log `[backend] używam działającego backendu na porcie ${port}` i powrót. Proces nie jest zapamiętywany, więc `stopBackend` go nie dotknie.
3. Interpreter: `path.join(backendDir, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')`. Gdy nie istnieje, rzuć `Nie znaleziono backend/.venv — wykonaj kroki z README, sekcja Backend.`
4. `spawn(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(port)], { cwd: backendDir, windowsHide: true })` bez `shell`, więc spacje w ścieżce nie przeszkadzają. Log `[backend] uruchamiam uvicorn na porcie ${port}`. Ostatnie 20 linii stderr trzymaj w buforze.
5. Odpytuj `isHealthy` co 300 ms przez maksymalnie 15 000 ms. Błędy (ogon stderr w komunikacie po pustej linii):
   - zdarzenie `error` procesu: `Nie udało się uruchomić backendu: ${err.message}`
   - zdarzenie `exit` przed sukcesem: `Backend zakończył działanie (kod ${code}).` + ogon stderr
   - przekroczenie czasu: zabij proces, potem `Backend nie odpowiedział w ciągu 15 s.` + ogon stderr

- [ ] **Step 3: `electron/main.js`**

- `BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 8000)`, `FRONTEND_URL = 'http://127.0.0.1:5173'`, `backendDir = path.join(__dirname, '..', 'backend')`.
- `app.whenReady()`: `await ensureBackend(...)`, potem `BrowserWindow` 1280×800, `title: 'Week Planner'`, `webPreferences: { contextIsolation: true, nodeIntegration: false }`, `loadURL(FRONTEND_URL)`. W `catch`: `dialog.showErrorBox('Nie udało się uruchomić backendu', err.message)` i `app.quit()`.
- `window-all-closed` → `app.quit()` na każdym systemie. `will-quit` → `stopBackend()`.
- `process.on('SIGINT')` i `process.on('SIGTERM')` → `app.quit()` (Review Focus 3).

- [ ] **Step 4: S1 — start bez działającego backendu (Review Focus 1 i 3)**

Uruchom `npm run dev` z katalogu `D:\.Projekty\[5] Prompt engineering\week-planner`.
Expected: w terminalu `[backend] uruchamiam uvicorn na porcie 8000`; okno pokazuje „Backend: połączono ✓”. Wygląd okna potwierdza użytkownik. Po zamknięciu okna:
Run: `netstat -ano | grep ":8000 " | grep LISTENING`
Expected: brak wyniku.

- [ ] **Step 5: S2 — ponowne użycie działającego backendu**

W osobnym terminalu: `cd backend && .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000`. Potem `npm run dev`.
Expected: `[backend] używam działającego backendu na porcie 8000`, okno ze statusem ✓. Po zamknięciu okna `curl -s http://127.0.0.1:8000/api/health` nadal zwraca `{"status":"ok"}`. Zatrzymaj ręczny uvicorn.

- [ ] **Step 6: S3 — brak `.venv`**

`mv backend/.venv backend/.venv-off`, `npm run dev`.
Expected: dialog z komunikatem o `backend/.venv` i README; po kliknięciu OK aplikacja i Vite się zamykają. Przywróć: `mv backend/.venv-off backend/.venv`.

- [ ] **Step 7: S4 — port zajęty przez obcy proces (Review Focus 2)**

W osobnym terminalu: `python -m http.server 8000 --bind 127.0.0.1` (odpowiada 404 na `/api/health`). Potem `npm run dev`.
Expected: w ciągu kilku sekund dialog `Backend zakończył działanie (kod 1).` z ogonem stderr zawierającym błąd zajętego adresu (Windows: `[WinError 10048]`). Zatrzymaj `http.server`.

- [ ] **Step 8: S5 — Ctrl+C w terminalu (Review Focus 3)**

`npm run dev`, poczekaj na okno, w terminalu naciśnij Ctrl+C.
Expected: okno się zamyka, a `netstat -ano | grep ":8000 " | grep LISTENING` nie zwraca nic.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json electron && git commit -m "Dodaj launcher Electron uruchamiający backend i okno aplikacji" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: CI, szablony GitHuba i ustawienia VS Code

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/bug.md`, `.github/ISSUE_TEMPLATE/feature.md`
- Create: `.vscode/settings.json`, `.vscode/extensions.json`

**Interfaces:**
- Produces: checki o nazwach dokładnie `backend` i `frontend`, wymagane przez ruleset w Task 8.

- [ ] **Step 1: Sprawdź najnowsze główne wersje akcji**

Run: `for a in checkout setup-python setup-node; do curl -s https://api.github.com/repos/actions/$a/releases/latest | grep '"tag_name"'; done`
Expected: tagi wersji. W kroku 2 użyj ich głównych numerów (`@vN`).

- [ ] **Step 2: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  backend:
    name: backend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@vN
      - uses: actions/setup-python@vN
        with:
          python-version: "3.11"
          cache: pip
          cache-dependency-path: backend/requirements.txt
      - run: pip install -r requirements.txt
      - run: black --check app tests
      - run: flake8 app tests
      - run: pytest

  frontend:
    name: frontend
    runs-on: ubuntu-latest
    env:
      ELECTRON_SKIP_BINARY_DOWNLOAD: "1"
    steps:
      - uses: actions/checkout@vN
      - uses: actions/setup-node@vN
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

`@vN` zastąp wersjami z kroku 1.

- [ ] **Step 3: Szablony**

- `pull_request_template.md`: nagłówki `## Opis`, `## Zmiany`, `## Jak przetestować`, `## Powiązane issue` z linią `Closes #`.
- `ISSUE_TEMPLATE/bug.md`: front matter `name: Błąd`, `about: Zgłoś błąd w aplikacji`, `labels: bug`; sekcje: Opis, Kroki do odtworzenia, Oczekiwane zachowanie, Faktyczne zachowanie, System (Windows/macOS/Linux, wersja).
- `ISSUE_TEMPLATE/feature.md`: front matter `name: Funkcja`, `about: Zaproponuj nową funkcję lub zadanie`, `labels: enhancement`; sekcje: Opis, Kryteria akceptacji (lista `- [ ]`), Uwagi.

- [ ] **Step 4: `.vscode`**

- `settings.json`: `"[python]": { "editor.defaultFormatter": "ms-python.black-formatter", "editor.formatOnSave": true }`, `"python.defaultInterpreterPath": "backend/.venv"`, `"flake8.args": ["--config=backend/.flake8"]`, `"files.eol": "\n"`.
- `extensions.json`: `ms-python.python`, `ms-python.black-formatter`, `ms-python.flake8`, `oxc.oxc-vscode`, `bradlc.vscode-tailwindcss`.

- [ ] **Step 5: Poprawność YAML i JSON**

Run: `npx --yes js-yaml .github/workflows/ci.yml > /dev/null && node -e "for (const f of ['.vscode/settings.json','.vscode/extensions.json']) JSON.parse(require('fs').readFileSync(f,'utf8'))" && echo OK`
Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add .github .vscode && git commit -m "Dodaj CI, szablony PR i issue oraz ustawienia VS Code" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Dokumentacja

**Files:**
- Modify: `README.md` (zastępuje jednolinijkowy plik z GitHuba)
- Create: `CONTRIBUTING.md`, `SCOPE.md`, `CLAUDE.md`

**Interfaces:**
- Consumes: polecenia zweryfikowane w Taskach 2–5 (README nie może zawierać poleceń, których nikt nie uruchomił).

- [ ] **Step 1: `README.md`**

Sekcje w tej kolejności:
1. Tytuł „Week Planner” i jedno zdanie opisu.
2. „O projekcie”: desktopowy planer studenta z asystentem AI; dane lokalnie w SQLite.
3. „Główne funkcje (MVP)”: 5 punktów MVP z PDF-a.
4. „Stack”: tabela warstwa → technologia jak w PDF-ie, z wersjami z Tech Stack tego planu.
5. „Wymagania”: Python 3.11, Node 24, Git.
6. „Szybki start”: `npm install`; podsekcja **Backend** (to dokładna nazwa, do której odsyła komunikat Electrona) z poleceniami dla Windowsa (`py -3.11 -m venv .venv`, `.venv\Scripts\activate`) i macOS/Linux (`python3.11 -m venv .venv`, `source .venv/bin/activate`), `pip install -r requirements.txt`, `copy .env.example .env` / `cp .env.example .env`; na końcu `npm run dev`.
7. „Struktura repozytorium”: drzewo z sekcji 4 specyfikacji, skrócone do katalogów.
8. „Testy i lint”: `pytest`, `black --check app tests`, `flake8 app tests` w `backend/`; `npm run lint`, `npm run build` w katalogu głównym.
9. „Zmienna BACKEND_PORT”: jak zmienić port, gdy 8000 jest zajęty.
10. „Dokumenty”: linki do `CONTRIBUTING.md`, `SCOPE.md`, `docs/plan-realizacji.pdf`.

Bez instrukcji uruchamiania w przeglądarce.

- [ ] **Step 2: `CONTRIBUTING.md`**

Wzór: `CONTRIBUTIONS.md` ze student-assistant, po polsku i dla lżejszego workflow:
- TL;DR: nie pushujemy na `main`; gałąź → PR → zielone CI → squash merge (akceptacja mile widziana, niewymagana).
- Gałęzie `feature/`, `fix/`, `chore/`, `docs/` z przykładami.
- Commity: po polsku, krótko, tryb rozkazujący („Dodaj widok tygodnia”).
- Issues: każde większe zadanie ma issue, PR zawiera `Closes #N`.
- Aktualizacja gałęzi: `git fetch origin` + `git rebase origin/main` + `git push --force-with-lease`.
- Python: pip-tools (edytujemy `requirements.in`, potem `pip-compile`), black, flake8, pytest.
- JS: tylko npm; zależność dodajemy do właściwego workspace (`npm install <pakiet> -w frontend`); `npm run lint`.
- Konwencje: endpointy pod `/api`; frontend woła tylko względne `/api/...` przez `apiGet`; sekrety tylko w `backend/.env`; bez `print`/`console.log` do debugowania i bez zakomentowanego martwego kodu.
- Co robić, gdy CI nie przechodzi.

- [ ] **Step 3: `SCOPE.md`**

- Cel (sekcja 1 PDF-a).
- Zakres IN: 5 punktów MVP z PDF-a jako checklisty `- [ ]`.
- „Jeśli starczy czasu”: preferencje, tryb ciemny, synchronizacja z zewnętrznym kalendarzem, powiadomienia, statystyki (PDF) oraz ze student-assistant: załączanie zdjęcia planu zajęć w czacie i widok miesiąca.
- Zakres OUT: logowanie i konta, serwer i MySQL, aplikacje mobilne, współdzielenie planu, płatności.
- Kryteria ukończenia: 5 punktów z sekcji 7 PDF-a.

- [ ] **Step 4: `CLAUDE.md`**

Maksymalnie około 40 linii: jednozdaniowy opis projektu; trzy części repo i ich rola; polecenia (`npm run dev`, testy i linty z README); twarde zasady z Global Constraints (`/api`, brak auth, sekrety, LF, npm, dokumentacja po polsku); odesłanie do `CONTRIBUTING.md` i `SCOPE.md`.

- [ ] **Step 5: Spójność dokumentacji**

Run: `grep -niE "bun|yarn|eslint" README.md CONTRIBUTING.md CLAUDE.md; grep -niE "przeglądar|localhost:5173" README.md`
Expected: brak wyników.
Run: `for f in CONTRIBUTING.md SCOPE.md docs/plan-realizacji.pdf; do test -e "$f" && echo "ok $f"; done`
Expected: trzy linie `ok`.

- [ ] **Step 6: Commit**

```bash
git add README.md CONTRIBUTING.md SCOPE.md CLAUDE.md && git commit -m "Dodaj dokumentację projektu i zasady pracy zespołu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Weryfikacja na czystym klonie i push

**Files:** brak zmian (chyba że weryfikacja wykaże błąd; wtedy poprawka trafia do pliku, którego dotyczy, osobnym commitem).

- [ ] **Step 1: Czysty klon (Review Focus 4)**

```bash
S="C:/Users/b4rt/AppData/Local/Temp/claude/D---Projekty--5--Prompt-engineering-week-planner/14bafa7a-9639-4cbd-bc80-a7cd40104018/scratchpad/clean-clone"
rm -rf "$S" && git clone "/d/.Projekty/[5] Prompt engineering/week-planner" "$S"
```

- [ ] **Step 2: Kroki z README w czystym klonie**

W `$S`, ściśle według README: `npm install`; w `backend/` utwórz venv, `pip install -r requirements.txt`, `cp .env.example .env`.
Expected: brak błędów, bez żadnych kroków spoza README.

- [ ] **Step 3: Komplet testów i lintów w czystym klonie**

Run (w `$S`): `npm run lint && npm run build && cd backend && .venv/Scripts/python -m pytest && .venv/Scripts/black --check app tests && .venv/Scripts/flake8 app tests`
Expected: lint bez ostrzeżeń, build OK, 3 passed, black i flake8 czyste.

- [ ] **Step 4: Zgoda na push**

Pokaż użytkownikowi `git log --oneline origin/main..main` i zapytaj o zgodę na `git push origin main`. Bez zgody zatrzymaj się.

- [ ] **Step 5: Push**

Run: `git push origin main`
Expected: `main -> main` bez odrzucenia.

- [ ] **Step 6: CI na `main`**

Gdy przebieg się zakończy:
Run: `curl -s "https://api.github.com/repos/Bxrtekm/week-planner/actions/runs?branch=main&per_page=1" | grep -E '"(status|conclusion)"'`
Expected: `"status": "completed"`, `"conclusion": "success"`. Jeśli `npm ci` w CI zgłosi brak natywnej binarki (lockfile wygenerowany na Windowsie), usuń `node_modules` i `package-lock.json`, uruchom `npm install`, zacommituj nowy lockfile i wypchnij ponownie (po zgodzie).

---

### Task 8: GitHub — etykiety, milestones, issues, ustawienia, ruleset

**Files:** brak w repo. Dane pomocnicze w scratchpadzie: `.../scratchpad/github/issues.json`, `.../scratchpad/github/ruleset.json`.

**Interfaces:**
- Consumes: checki `backend` i `frontend` z Task 5, które przeszły na `main` w Task 7.

- [ ] **Step 1: Warunek wstępny — GitHub CLI**

Poproś użytkownika o `winget install GitHub.cli` i `gh auth login` (konto z prawami admina do `Bxrtekm/week-planner`).
Run: `gh auth status`
Expected: `Logged in to github.com account Bxrtekm`.

- [ ] **Step 2: Przygotuj `issues.json` i pokaż listę do akceptacji**

27 pozycji dokładnie według sekcji 8.6 specyfikacji (tytuł, etykiety, milestone albo brak). Treść każdej: `## Opis` (1–2 zdania z odpowiedniego punktu PDF-a) i `## Kryteria akceptacji` (2–4 sprawdzalne punkty `- [ ]`). Pokaż użytkownikowi tabelę: nr, tytuł, etykiety, milestone. Bez zgody zatrzymaj się.

- [ ] **Step 3: Etykiety**

```bash
R=Bxrtekm/week-planner
gh label create frontend   -R $R -c 1d76db -d "Interfejs React"
gh label create backend    -R $R -c 0e8a16 -d "FastAPI, baza danych"
gh label create electron   -R $R -c 5319e7 -d "Aplikacja desktopowa, pakowanie"
gh label create ai         -R $R -c d93f0b -d "Asystent AI, OpenAI"
gh label create docs       -R $R -c 0075ca -d "Dokumentacja"
gh label create opcjonalne -R $R -c c5def5 -d "Jeśli starczy czasu"
```

Expected: `gh label list -R $R` zawiera te 6 etykiet oraz domyślne `bug` i `enhancement`.

- [ ] **Step 4: Milestones**

Dla każdej pary (tytuł, termin) z sekcji 8.5 specyfikacji:
`gh api repos/Bxrtekm/week-planner/milestones -f title="<tytuł>" -f due_on="<termin>T12:00:00Z"`
Expected: `gh api repos/Bxrtekm/week-planner/milestones --jq '.[] | [.number,.title,.due_on] | @tsv'` pokazuje 5 milestones z poprawnymi datami.

- [ ] **Step 5: Issues**

Skrypt Pythona uruchomiony z `-I` czyta `issues.json` i dla każdej pozycji po kolei wywołuje `gh issue create -R Bxrtekm/week-planner --title … --body-file <plik tymczasowy> --label … [--milestone "<tytuł>"]`.
Expected: `gh issue list -R Bxrtekm/week-planner --limit 50 --state open` pokazuje 27 issues. Repo nie ma wcześniejszych issues ani PR-ów, więc numery #1–#27 odpowiadają numeracji ze specyfikacji.

- [ ] **Step 6: Ustawienia repozytorium**

Run: `gh repo edit Bxrtekm/week-planner --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge`
Expected: `gh repo view Bxrtekm/week-planner --json squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,deleteBranchOnMerge` → `true,false,false,true`.

- [ ] **Step 7: Ruleset dla `main`**

`ruleset.json`:

```json
{
  "name": "Ochrona main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [ { "context": "backend" }, { "context": "frontend" } ] } }
  ]
}
```

Run: `gh api repos/Bxrtekm/week-planner/rulesets --method POST --input ruleset.json`
Expected: `gh api repos/Bxrtekm/week-planner/rules/branches/main --jq '.[].type'` wypisuje `deletion`, `non_fast_forward`, `pull_request`, `required_status_checks`.

- [ ] **Step 8: Podsumowanie dla użytkownika**

Linki: repozytorium, lista issues, milestones. Przypomnienie, że od teraz wszystko na `main` trafia przez PR.
