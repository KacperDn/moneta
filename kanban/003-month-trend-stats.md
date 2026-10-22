---
id: 003
title: Wydziel statystyki trendu miesięcznego z App.tsx
status: ready
files:
  - src/utils/monthTrend.ts
  - src/utils/monthTrend.test.ts
  - src/App.tsx
verify: npm test -- --run monthTrend
---
Wykres trendu w `App.tsx` liczy inline, przy każdym renderze, zmianę
procentową względem poprzedniego miesiąca oraz średnią/maksimum/minimum z
tablicy `byMonth` (`MonthSummary[]` z `useExpenses`). Wydziel tę logikę do
czystej funkcji `monthTrendStats(byMonth: MonthSummary[])` w nowym pliku
`src/utils/monthTrend.ts`, zwracającej `{ changePct: number | null, avg:
number, max: MonthSummary, min: MonthSummary } | null` (`null` gdy dane są
zbyt krótkie, tak jak dziś obsługuje to warunek `byMonth.length < 2`).
Podmień odpowiedni fragment w `App.tsx`, żeby korzystał z tej funkcji
zamiast liczyć to inline.

Kryteria akceptacji:
- Wynik identyczny jak dotychczasowe obliczenie inline (ten sam wzór na
  `changePct`, `avg`, `max`, `min`).
- Dla `byMonth.length < 2` funkcja zwraca `null`, a `App.tsx` nadal pokazuje
  dotychczasowy stan pusty (`trend__empty`).
- Test pokrywa: dokładnie 2 miesiące, kilka miesięcy z wyraźnym
  maksimum/minimum, miesiąc o zerowej sumie (dzielenie przez zero przy
  liczeniu zmiany procentowej nie powinno zwracać `Infinity`/`NaN` bez
  obsługi), listę krótszą niż 2 elementy.
