# Zakres projektu

Na podstawie [planu realizacji](docs/plan-realizacji.pdf).

## Cel

Desktopowa aplikacja wspomagająca studenta w planowaniu dnia i tygodnia. Łączy klasyczny planer
(zadania, wydarzenia, terminy) z asystentem AI w formie chatbota, który potrafi nie tylko rozmawiać,
ale też bezpośrednio modyfikować plan użytkownika oraz proponować harmonogram dnia.

## Zakres IN (MVP)

- [ ] Zarządzanie zadaniami i wydarzeniami (dodawanie, edycja, usuwanie)
- [ ] Widok dnia i tygodnia
- [ ] Czat z asystentem AI
- [ ] Wykonywanie akcji na planie przez asystenta (dodanie, przesunięcie, usunięcie zadania)
- [ ] Generowanie planu dnia na podstawie priorytetów, terminów i dostępnego czasu

## Jeśli starczy czasu

Z planu realizacji:

- preferencje użytkownika (godziny nauki, długość przerw),
- tryb ciemny,
- synchronizacja z zewnętrznym kalendarzem,
- powiadomienia,
- statystyki.

Z poprzedniego projektu ([student-assistant](https://github.com/Neeklines/student-assistant)):

- załączanie zdjęcia planu zajęć w czacie (asystent odczytuje plan ze zdjęcia),
- widok miesiąca.

## Zakres OUT

- Rejestracja, logowanie i konta użytkowników: aplikacja jest lokalna, dla jednej osoby
- Serwer, deploy w internecie, baza MySQL: dane są tylko w lokalnym SQLite
- Aplikacje mobilne
- Współdzielenie planu między użytkownikami
- Płatności i subskrypcje

## Kryteria ukończenia

- [ ] Aplikacja uruchamia się jako program desktopowy bez ręcznego startu backendu
- [ ] Użytkownik może zarządzać zadaniami i wydarzeniami w widoku dnia i tygodnia
- [ ] Asystent AI potrafi dodać, przesunąć i usunąć zadanie na podstawie polecenia w czacie
- [ ] Funkcja „zaplanuj mi dzień” zwraca poprawny, zwalidowany harmonogram
- [ ] Projekt ma dokumentację i podstawowe testy
