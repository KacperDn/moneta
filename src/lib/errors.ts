const KNOWN: { match: string; message: string }[] = [
  { match: "invalid login credentials", message: "Nieprawidłowy email lub hasło." },
  { match: "email not confirmed",       message: "Potwierdź adres email, aby się zalogować." },
  { match: "user already registered",   message: "Konto z tym adresem email już istnieje." },
  { match: "password should be at least", message: "Hasło musi mieć minimum 6 znaków." },
  { match: "email rate limit",          message: "Zbyt wiele prób. Spróbuj ponownie za chwilę." },
  { match: "failed to fetch",           message: "Brak połączenia z serwerem. Sprawdź internet." },
];

export function friendlyAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  const known = KNOWN.find(k => lower.includes(k.match));
  if (!known) console.error("Auth error:", raw);
  return known ? known.message : "Coś poszło nie tak. Spróbuj ponownie za chwilę.";
}
