# Konfiguracja repozytorium i szkielet aplikacji — projekt

Data: 2026-11-04
Repozytorium: https://github.com/Bxrtekm/week-planner
Źródła: `docs/plan-realizacji.pdf` (założenia projektu), https://github.com/Neeklines/student-assistant (projekt wzorcowy)

## 1. Cel

Przygotować repozytorium tak, aby zespół mógł od razu pracować równolegle nad
desktopowym planerem studenta z asystentem AI. Zakres tego kroku:

- dokumentacja i zasady pracy zespołu (po polsku),
- konfiguracja narzędzi, CI i szablonów GitHuba,
- działający szkielet Electron + React + FastAPI („hello world” przez całą ścieżkę),
- milestones, etykiety i issues na GitHubie zbudowane z harmonogramu w PDF-ie.

Rezultat: po `git clone` i krokach z README każdy członek zespołu uruchamia
okno aplikacji desktopowej, które pokazuje „Backend: połączono ✓”.

## 2. Podjęte decyzje

| Temat | Decyzja |
|---|---|
| Zakres | Konfiguracja repo + szkielet hello world. Model danych i Alembic to pierwsze issue Tygodnia 1. |
| Język | Dokumentacja, szablony, issues i commity po polsku. Identyfikatory w kodzie po angielsku. |
| Dostawca AI | OpenAI (jak w student-assistant). SDK dochodzi w Tygodniu 3. |
| Pakiety JS | npm + npm workspaces. |
| Python | 3.11, zależności przez pip-tools (`requirements.in` → `requirements.txt`). |
| Architektura | Monorepo zgodne z PDF-em: `/frontend`, `/backend`, `/electron`, `/docs`. Electron jako cienki launcher. |
| Workflow | Lżejszy: zmiany na `main` tylko przez PR z zielonym CI, bez wymaganej akceptacji. |
| Licencja | Brak (świadoma decyzja). |
| Start projektu | Poniedziałek 2026-11-09, 5 tygodni. |

## 3. Konsekwencje tego, że to aplikacja desktopowa

Względem student-assistant (aplikacji webowej):

- Jedyny wspierany sposób uruchamiania to okno Electrona. README nie opisuje
  pracy w przeglądarce.
- Nie ma rejestracji, logowania, JWT ani Google OAuth. Jest jeden lokalny
  użytkownik, a modele danych nie mają `user_id`.
- Nie ma deployu na serwer ani MySQL. Jedyną bazą jest lokalny SQLite.
- Klucz OpenAI jest przechowywany wyłącznie po stronie backendu.

## 4. Struktura repozytorium

```
week-planner/
├── backend/                     # FastAPI, Python 3.11
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # aplikacja FastAPI, routery pod prefiksem /api
│   │   ├── config.py            # ustawienia z .env i zmiennych środowiskowych
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── health.py        # GET /api/health → {"status": "ok"}
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py
│   ├── requirements.in
│   ├── requirements.txt         # generowany przez pip-compile
│   ├── .env.example
│   ├── pyproject.toml           # konfiguracja black
│   ├── .flake8
│   └── pytest.ini
├── frontend/                    # React 19 + Vite + Tailwind v4, JSX
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # ekran startowy ze statusem backendu
│   │   ├── styles.css
│   │   └── lib/api.js           # cienki wrapper na fetch('/api/...')
│   ├── index.html
│   ├── vite.config.js           # proxy /api → backend
│   ├── .oxlintrc.json
│   └── package.json
├── electron/
│   ├── main.js                  # cykl życia aplikacji i okno
│   ├── backend.js               # wykrycie / start / health-check / zamknięcie backendu
│   └── package.json
├── docs/
│   ├── plan-realizacji.pdf      # przeniesiony z pliki/
│   └── superpowers/specs/       # dokumenty projektowe
├── .github/
│   ├── workflows/ci.yml
│   ├── ISSUE_TEMPLATE/bug.md
│   ├── ISSUE_TEMPLATE/feature.md
│   └── pull_request_template.md
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── package.json                 # workspaces + skrypty dev / lint / build
├── README.md
├── CONTRIBUTING.md
├── SCOPE.md
├── CLAUDE.md
├── .gitignore
├── .gitattributes
└── .editorconfig
```

Katalog `pliki/` znika po przeniesieniu PDF-a do `docs/`.

## 5. Szkielet aplikacji

### 5.1 Backend

- `main.py` tworzy `FastAPI(title="Week Planner")` i rejestruje routery z prefiksem `/api`.
  Wszystkie przyszłe endpointy też żyją pod `/api`.
- `config.py` czyta `backend/.env` przez `python-dotenv` i udostępnia
  `OPENAI_API_KEY` (`None`, gdy brak). Nic go jeszcze nie używa, ale ustala
  konwencję: ustawienia backendu tylko przez `config.py`, sekrety tylko w
  `backend/.env`. `.env.example` opisuje, że klucz jest potrzebny od Tygodnia 3.
- Port backendu nie jest ustawieniem backendu: uvicorn dostaje go w `--port`
  (sekcja 5.3).
- Bez middleware CORS. W trybie dev żądania idą przez proxy Vite, a docelowo
  backend serwuje frontend z tego samego originu (sekcja 5.5).
- `requirements.in`: `fastapi`, `uvicorn`, `python-dotenv` oraz narzędzia
  deweloperskie `pip-tools`, `pytest`, `httpx`, `black`, `flake8`.
- black i flake8 z `max-line-length = 88`, jak w student-assistant.

### 5.2 Frontend

- Projekt Vite + React 19 w JSX, Tailwind v4 przez `@tailwindcss/vite`, ikony
  `lucide-react`. To ten sam zestaw co w student-assistant, więc komponenty
  (widoki dnia i tygodnia, czat) da się przenosić z niewielkimi zmianami.
- `vite.config.js`: serwer na `127.0.0.1:5173` ze `strictPort: true`, proxy `/api` →
  `http://127.0.0.1:${BACKEND_PORT ?? 8000}`. Jawne `127.0.0.1` zamiast `localhost`
  omija problem rozwiązywania `localhost` do `::1` na Windowsie.
- `lib/api.js` udostępnia `apiGet(path)`, które woła względne `/api/...` i rzuca
  błąd przy statusie różnym od 2xx. Frontend nigdy nie zna adresu backendu.
- `App.jsx` przy starcie woła `apiGet('/health')` i pokazuje
  „Backend: połączono ✓” albo komunikat błędu.
- Linter z aktualnego szablonu Vite (create-vite 9): oxlint z `.oxlintrc.json`
  (reguły hooków React i `only-export-components`). Szablon nie używa już ESLint.

### 5.3 Electron

- `main.js`: przy `app.whenReady()` czeka na `ensureBackend()` z `backend.js`,
  potem tworzy `BrowserWindow` (`contextIsolation: true`, `nodeIntegration: false`,
  bez preload) i ładuje `http://127.0.0.1:5173`. Gdy `ensureBackend()` rzuci błąd,
  pokazuje `dialog.showErrorBox` z treścią błędu i zamyka aplikację.
- `backend.js`:
  1. `GET http://127.0.0.1:${port}/api/health`. Jeśli odpowiada 200, używa
     istniejącego backendu (np. `uvicorn --reload` uruchomionego ręcznie) i nie
     będzie go zamykać.
  2. W przeciwnym razie szuka interpretera w `backend/.venv`
     (`Scripts/python.exe` na Windowsie, `bin/python` na macOS/Linux). Brak →
     błąd „Nie znaleziono backend/.venv — wykonaj kroki z README, sekcja Backend”.
  3. Uruchamia `python -m uvicorn app.main:app --host 127.0.0.1 --port <port>`
     z `cwd = backend/` i zbiera ostatnie linie stderr.
  4. Odpytuje `/api/health` co 300 ms, maksymalnie 15 s. Przekroczenie czasu
     albo wcześniejsze zakończenie procesu → błąd z ostatnimi liniami stderr.
  5. Eksportuje `stopBackend()`, które kończy proces tylko wtedy, gdy uruchomił
     go Electron. `main.js` wywołuje je w `will-quit`.
- Zamknięcie ostatniego okna kończy aplikację na każdym systemie (`window-all-closed` → `app.quit()`).
- Port pochodzi ze zmiennej środowiskowej powłoki `BACKEND_PORT` (domyślnie `8000`).
  Czytają ją tylko Vite (proxy) i Electron (`--port` dla uvicorn), nie `backend/.env`.

### 5.4 Uruchamianie (katalog główny)

`package.json` w katalogu głównym:

- `"workspaces": ["frontend", "electron"]`
- `dev`: `concurrently` uruchamia `npm run dev -w frontend` oraz
  `wait-on tcp:127.0.0.1:5173 && npm start -w electron`. Zamknięcie jednego procesu
  kończy drugi (`-k`).
- `lint`: `npm run lint -w frontend`
- `build`: `npm run build -w frontend`

Jednorazowa konfiguracja dewelopera (opisana w README):

1. `npm install` w katalogu głównym.
2. `cd backend`, `python -m venv .venv`, aktywacja, `pip install -r requirements.txt`, `copy .env.example .env`.
3. `npm run dev`.

### 5.5 Docelowy tryb produkcyjny (poza tym krokiem, trafia jako issues T4/T5)

- Backend pakowany PyInstallerem do pliku wykonywalnego, aplikacja pakowana electron-builderem.
- Electron uruchamia spakowany backend na wolnym porcie z `DATA_DIR` =
  `app.getPath('userData')`, więc SQLite ląduje w katalogu użytkownika.
- Backend serwuje zbudowany `frontend/dist`, a Electron otwiera `http://127.0.0.1:<port>/`.
  Frontend używa tylko względnych `/api`, więc jego kod się nie zmienia.

## 6. Dokumentacja

- **README.md** — czym jest aplikacja, główne funkcje (MVP z PDF-a), stack, wymagania
  (Python 3.11, Node 24), szybki start (5.4), struktura katalogów, polecenia
  testów i lintu, odnośniki do CONTRIBUTING i SCOPE.
- **CONTRIBUTING.md** — na wzór `CONTRIBUTIONS.md` ze student-assistant, dostosowany
  do lżejszego workflow: nazwy gałęzi, commity, PR i squash merge, aktualizacja
  gałęzi (`git rebase origin/main`), zasady Pythona (pip-tools, black, flake8, pytest),
  zasady JS (npm, oxlint), konwencja `/api`, „żadnych sekretów w repo”.
- **SCOPE.md** — cel, zakres IN (MVP z PDF-a), „jeśli starczy czasu” (opcje z PDF-a
  i funkcje ze student-assistant, których nie ma w MVP), zakres OUT (sekcja 3
  oraz: aplikacje mobilne, współdzielenie planu, płatności), kryteria ukończenia z PDF-a.
- **CLAUDE.md** — krótki kontekst dla asystentów AI: opis projektu, polecenia,
  konwencje, odesłanie do CONTRIBUTING.md.

## 7. Narzędzia i pliki konfiguracyjne

- `.gitattributes`: `* text=auto eol=lf`, pliki binarne (`*.pdf`, `*.png`, `*.jpg`, `*.ico`) oznaczone jako `binary`.
- `.editorconfig`: UTF-8, LF, 2 spacje (JS/JSON/CSS/MD/YAML), 4 spacje (Python), końcowa nowa linia.
- `.gitignore`: `.venv/`, `venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`, `.env`, `*.db`,
  `node_modules/`, `dist/`, `build/`, `out/`, `.claude/settings.local.json`, `.superpowers/`.
- `.vscode/settings.json`: black jako formatter Pythona, formatowanie przy zapisie,
  flake8, oxlint. `.vscode/extensions.json`: Python, Black Formatter, Flake8, Oxc (oxlint),
  Tailwind CSS IntelliSense.

## 8. GitHub

### 8.1 CI (`.github/workflows/ci.yml`)

Uruchamiane na `pull_request` i `push` do `main`. Dwa joby:

- `backend` (ubuntu-latest, Python 3.11): `pip install -r requirements.txt`,
  `black --check app tests`, `flake8 app tests`, `pytest`.
- `frontend` (ubuntu-latest, Node 24): `npm ci`, `npm run lint`, `npm run build`.
  Z `ELECTRON_SKIP_BINARY_DOWNLOAD=1`, żeby `npm ci` nie pobierało binarki Electrona.

Electron nie ma osobnego joba. Jego kod jest mały i weryfikowany ręcznie przez `npm run dev`.

### 8.2 Szablony

- `pull_request_template.md`: Opis / Zmiany / Jak przetestować / `Closes #`.
- `ISSUE_TEMPLATE/bug.md` („Błąd”): opis, kroki do odtworzenia, oczekiwane i faktyczne zachowanie, system.
- `ISSUE_TEMPLATE/feature.md` („Funkcja”): opis, kryteria akceptacji, uwagi.

### 8.3 Ustawienia repozytorium

- Dozwolony tylko squash merge, automatyczne usuwanie gałęzi po merge'u.
- Ruleset dla `main`: wymagany PR (0 akceptacji), wymagane checki `backend` i
  `frontend`, blokada force-push i usuwania gałęzi. Tworzony po pierwszym
  zielonym przebiegu CI, bo GitHub musi znać nazwy checków.

### 8.4 Etykiety

`frontend`, `backend`, `electron`, `ai`, `docs`, `opcjonalne` oraz domyślne `bug` i `enhancement`.

### 8.5 Milestones

| Milestone | Termin |
|---|---|
| Tydzień 1: fundamenty | 2026-11-15 |
| Tydzień 2: rdzeń planera | 2026-11-22 |
| Tydzień 3: asystent AI | 2026-11-29 |
| Tydzień 4: inteligentne planowanie | 2026-12-06 |
| Tydzień 5: stabilizacja i oddanie | 2026-12-13 |

### 8.6 Issues (projekt listy; przed utworzeniem użytkownik ją akceptuje)

Punkty harmonogramu załatwione tą konfiguracją (repozytorium, struktura, README,
szkielet, start backendu z Electrona) nie dostają issues.

**Tydzień 1**
1. Model danych SQLite: zadania i wydarzenia (SQLAlchemy + Alembic) — `backend`

**Tydzień 2**
2. API CRUD zadań (termin, priorytet, szacowany czas, status) — `backend`
3. API CRUD wydarzeń — `backend`
4. Interfejs: dodawanie, edycja i usuwanie zadań — `frontend`
5. Interfejs: dodawanie, edycja i usuwanie wydarzeń — `frontend`
6. Widok dnia — `frontend`
7. Widok tygodnia — `frontend`

**Tydzień 3**
8. Endpoint czatu z OpenAI i strumieniowaniem (SSE) — `backend`, `ai`
9. Interfejs czatu: historia rozmowy i strumieniowanie odpowiedzi — `frontend`, `ai`
10. Prompt systemowy i kontekst (zadania na dziś i tydzień) — `ai`
11. Function calling: dodawanie, przesuwanie i usuwanie zadań — `backend`, `ai`
12. Walidacja danych zwracanych przez model — `backend`, `ai`

**Tydzień 4**
13. Generowanie planu dnia (priorytety, terminy, wolne sloty) — `backend`, `ai`
14. Przeplanowanie („nie zdążyłem”) — `backend`, `ai`
15. Preferencje użytkownika (godziny nauki, długość przerw) — `backend`, `frontend`
16. Próbne spakowanie backendu PyInstallerem i uruchomienie go z Electrona — `electron`

**Tydzień 5**
17. Testy jednostkowe backendu i scenariusze end-to-end — `backend`, `frontend`
18. Obsługa błędów API modelu, limity zapytań, cache — `backend`, `ai`
19. Ekran ustawień (w tym sposób podania klucza API) — `frontend`, `backend`
20. Tryb ciemny — `frontend`
21. Instalator: electron-builder, backend serwuje `frontend/dist`, dane w `userData` — `electron`
22. Dokumentacja i przygotowanie demonstracji — `docs`

**Bez milestone'a (`opcjonalne`)**
23. Załączanie zdjęcia planu zajęć w czacie (jak w student-assistant) — `ai`, `frontend`
24. Powiadomienia o nadchodzących wydarzeniach — `frontend`, `electron`
25. Widok miesiąca — `frontend`
26. Statystyki — `frontend`, `backend`
27. Synchronizacja z zewnętrznym kalendarzem — `backend`

Każde issue ma krótki opis i kryteria akceptacji wynikające z PDF-a.

## 9. Weryfikacja

Zanim cokolwiek trafi na GitHuba:

- `backend/`: `pytest` (test `GET /api/health` → 200, `{"status": "ok"}`), `black --check app tests`, `flake8 app tests`.
- katalog główny: `npm run lint`, `npm run build`.
- Scenariusz 1: `npm run dev` bez działającego backendu → okno pokazuje
  „Backend: połączono ✓”; po zamknięciu okna proces uvicorn znika.
- Scenariusz 2: ręcznie uruchomiony `uvicorn --reload`, potem `npm run dev` → Electron
  używa istniejącego backendu i po zamknięciu go nie zabija.
- Scenariusz 3: brak `backend/.venv` → okno dialogowe z instrukcją z README.

Po pushu: oba joby CI zielone na `main`.

## 10. Kolejność wykonania

1. `git init`, podpięcie `origin` (wykonane podczas projektowania).
2. Pliki konfiguracyjne, dokumentacja, szkielet, przeniesienie PDF-a do `docs/`.
3. Weryfikacja lokalna (sekcja 9).
4. Commit i push na `main` po zgodzie użytkownika. Ruleset jeszcze nie istnieje, więc to jedyny bezpośredni push.
5. Użytkownik instaluje GitHub CLI (`winget install GitHub.cli`) i loguje się (`gh auth login`).
6. Po zgodzie użytkownika: etykiety, milestones, issues, ustawienia repozytorium, na końcu ruleset.

## 11. Otwarte kwestie (do decyzji później)

- Sposób podawania klucza OpenAI w spakowanej aplikacji (ekran ustawień czy plik w `userData`) — issue 19.
- Rozróżnienie zadanie / wydarzenie w modelu danych (wspólna tabela czy dwie) — issue 1.

## 12. Poza zakresem tego kroku

Model danych i migracje, jakiekolwiek funkcje planera, integracja z OpenAI, pakowanie aplikacji.
