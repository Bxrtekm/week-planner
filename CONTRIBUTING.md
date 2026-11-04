# Jak pracujemy

Ten dokument opisuje, jak współpracujemy w repozytorium: gałęzie, pull requesty i zasady kodu.
Jak uruchomić projekt, opisuje [README](README.md).

## TL;DR

- Nie pushujemy bezpośrednio na `main` (GitHub i tak to zablokuje).
- Każda zmiana: nowa gałąź → pull request → zielone CI → **squash merge**.
- Akceptacja PR-a przez drugą osobę jest mile widziana, ale nie wymagana.
- Każde większe zadanie ma issue, a PR je zamyka (`Closes #N`).

## Gałęzie

Nazwa gałęzi zaczyna się od typu zmiany:

| Prefiks | Kiedy | Przykład |
|---|---|---|
| `feature/` | nowa funkcja | `feature/widok-tygodnia` |
| `fix/` | poprawka błędu | `fix/zle-godziny-w-widoku-dnia` |
| `chore/` | konfiguracja, zależności, porządki | `chore/aktualizacja-zaleznosci` |
| `docs/` | tylko dokumentacja | `docs/instrukcja-instalacji` |

Zasady:

- jedna funkcja = jedna gałąź, bez mieszania niezwiązanych zmian,
- małe PR-y są lepsze niż duże,
- po merge'u gałąź na GitHubie usuwa się automatycznie; lokalną usuń sam (`git branch -d <nazwa>`).

## Commity

Po polsku, krótko, w trybie rozkazującym. Opisują, co commit robi:

```
Dodaj widok tygodnia
Popraw sortowanie zadań po terminie
Usuń nieużywany komponent kalendarza
```

## Codzienny workflow

### Nowe zadanie

```bash
git checkout main
git pull
git checkout -b feature/moja-funkcja
```

### Praca i wysłanie zmian

```bash
git add <pliki>
git commit -m "Dodaj formularz zadania"
git push -u origin feature/moja-funkcja
```

Potem otwórz pull request na GitHubie i wypełnij szablon (opis, zmiany, jak przetestować, `Closes #N`).

### Aktualizacja gałęzi o zmiany z `main`

Gdy ktoś zmergował coś do `main` w trakcie Twojej pracy:

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease
```

Gałęzi nie aktualizujemy lokalnym `git merge`. Merge do `main` odbywa się wyłącznie przez PR na GitHubie,
zawsze jako **squash merge** (jeden PR = jeden commit na `main`).

## Ochrona gałęzi `main`

- zmiany tylko przez pull request,
- wymagane zielone checki CI: `backend` i `frontend`,
- zakaz force-pusha i usuwania `main`.

## CI

Przy każdym PR i każdym pushu do `main` GitHub Actions uruchamia:

- **backend**: `black --check`, `flake8`, `pytest`,
- **frontend**: `npm ci`, `npm run lint` (oxlint), `npm run build`.

Jeśli CI nie przechodzi, PR nie zostanie zmergowany. Uruchom te same polecenia lokalnie
(sekcja „Testy i lint” w README), popraw błędy i wypchnij poprawki na tę samą gałąź.

## Python (backend)

### Zależności (pip-tools)

Nie edytujemy ręcznie `requirements.txt`, bo jest generowany.

1. Dopisz pakiet do `backend/requirements.in`.
2. W `backend/` z aktywnym `.venv`:

   ```bash
   pip-compile
   pip install -r requirements.txt
   ```

3. Zacommituj oba pliki: `requirements.in` i `requirements.txt`.

Aktualizacja wszystkich zależności: `pip-compile --upgrade`.

### Formatowanie, lint, testy

```bash
black app tests          # formatowanie (CI sprawdza black --check)
flake8 app tests         # lint
pytest                   # testy
```

Nowy kod backendu ma testy w `backend/tests/`.

## JavaScript (frontend i Electron)

- Tylko **npm**.
- Zależność instalujemy do właściwego workspace'a, z katalogu głównego:

  ```bash
  npm install <pakiet> -w frontend
  npm install -D <pakiet> -w frontend
  ```

  Jeśli po instalacji pakiet nie pojawił się w `package.json` workspace'a, podaj wersję jawnie
  (np. `<pakiet>@latest`).
- Commitujemy `package-lock.json` z katalogu głównego.
- Lint: `npm run lint` (oxlint).

## Konwencje w kodzie

- **Wszystkie endpointy backendu są pod `/api`**, np. `/api/health`, `/api/tasks`.
- **Frontend woła wyłącznie względne ścieżki `/api/...`** przez funkcje z `frontend/src/lib/api.js`,
  nigdy pełny adres z portem.
- **Sekrety** (np. `OPENAI_API_KEY`) trzymamy tylko w `backend/.env`, który nie trafia do repozytorium.
  Ustawienia backendu czytamy przez `backend/app/config.py`.
- To aplikacja desktopowa dla jednego użytkownika: bez logowania, kont i `user_id`.
- Identyfikatory w kodzie po angielsku; teksty w interfejsie, dokumentacja, issues i commity po polsku.
- Końce linii LF (pilnuje tego `.gitattributes`).
- Bez `print` i `console.log` do debugowania oraz bez zakomentowanego martwego kodu w PR-ach.

## Pytania

Nie wiesz, jak coś zrobić? Zapytaj na kanale zespołu albo w komentarzu do issue. Lepiej zapytać, niż zgadywać.
