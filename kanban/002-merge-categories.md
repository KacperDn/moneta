---
id: 002
title: Wydziel logikę scalania kategorii domyślnych i własnych
status: ready
files:
  - src/utils/mergeCategories.ts
  - src/utils/mergeCategories.test.ts
  - src/hooks/useCategories.ts
verify: npm test -- --run mergeCategories
---
`src/hooks/useCategories.ts` scala w `useMemo` domyślne kategorie z
`CATS` (constants.ts) z nadpisaniami użytkownika (zmieniona ikona/kolor,
ukrycie) oraz dolicza kategorie własne użytkownika. Ta logika jest czysta
(nie dotyka Supabase ani stanu) i dziś jest zaszyta bezpośrednio w hooku,
więc nie da się jej przetestować bez renderowania całego hooka. Wydziel ją
do samodzielnej funkcji `mergeCategories(rows: CategoryRow[]): UserCategory[]`
w `src/utils/mergeCategories.ts` (zachowaj identyczne zachowanie) i podmień
jej wywołanie w `useCategories.ts`.

Kryteria akceptacji:
- Zachowanie identyczne jak dotychczas: dopasowanie nazw bez uwzględniania
  wielkości liter, domyślne kategorie zawsze obecne (nawet bez nadpisania),
  kategorie własne użytkownika doklejone na końcu listy.
- Test pokrywa: brak nadpisań (same domyślne), nadpisanie ikony/koloru,
  ukrycie domyślnej kategorii, dodanie własnej kategorii, pustą listę `rows`.
- `useCategories.ts` po zmianie nie zawiera już inline'owej logiki scalania
  — woła tylko `mergeCategories(rows)`.
