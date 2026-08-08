import i18n from "../i18n";

const KNOWN = [
  { match: "invalid login credentials",   key: "authErrors.invalidCredentials" },
  { match: "email not confirmed",         key: "authErrors.emailNotConfirmed" },
  { match: "user already registered",     key: "authErrors.userExists" },
  { match: "password should be at least", key: "authErrors.passwordLength" },
  { match: "email rate limit",            key: "authErrors.rateLimit" },
  { match: "failed to fetch",             key: "authErrors.networkError" },
] as const;

export function friendlyAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  const known = KNOWN.find(k => lower.includes(k.match));
  if (!known) console.error("Auth error:", raw);
  return i18n.t(known ? known.key : "authErrors.generic");
}
