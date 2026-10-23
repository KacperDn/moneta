---
id: 001
title: Eksport wydatków do CSV
status: done
files:
  - src/utils/exportCsv.ts
  - src/utils/exportCsv.test.ts
verify: npm test -- --run exportCsv
---
Dodaj czystą funkcję `expensesToCsv(expenses: Expense[]): string` w nowym
pliku `src/utils/exportCsv.ts`, zwracającą zawartość pliku CSV (nagłówek +
jeden wiersz na wydatek: data, kategoria, opis, kwota). Funkcja nie wykonuje
żadnego I/O (nie zapisuje pliku, nie dotyka DOM-u) — tylko buduje string,
żeby dało się ją przetestować bez mockowania przeglądarki.

Kryteria akceptacji:
- Pierwszy wiersz to nagłówek kolumn (po polsku, zgodnie z istniejącymi
  etykietami w UI, np. "Data,Kategoria,Opis,Kwota").
- Pola zawierające przecinek lub cudzysłów są poprawnie cytowane zgodnie ze
  standardem CSV (RFC 4180), żeby plik otwierał się poprawnie w Excelu.
- Kwota jest formatowana z kropką jako separatorem dziesiętnym (nie przez
  `fmt()` z `constants.ts`, który używa przecinka — to zepsułoby parsowanie
  CSV).
- Pusta lista wydatków zwraca sam nagłówek, bez błędu.
