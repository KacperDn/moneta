import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

try {
  process.loadEnvFile(path.join(repoRoot, ".env"));
} catch {
  // .env is optional here — the key may already be set in the environment.
}

const config = JSON.parse(readFileSync(path.join(__dirname, "config.json"), "utf8"));

/**
 * Calls the Gemini API's generateContent endpoint for a single-turn prompt.
 * Throws on HTTP errors, timeout, or an empty/blocked response.
 */
async function callGeminiApi(prompt, { model, timeoutMs }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set (expected in .env or the environment).");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      }
    );

    const body = await res.json();

    if (!res.ok) {
      const message = body?.error?.message ?? res.statusText;
      throw new Error(`Gemini API error (${res.status}): ${message}`);
    }

    const candidate = body?.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text ?? "").join("");

    if (!text) {
      const reason = candidate?.finishReason ?? "unknown reason";
      throw new Error(`Gemini API returned no text (finishReason: ${reason}).`);
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Providers map a provider name to a function of (prompt, opts) -> Promise<string>.
 * Adding a provider that uses an API key from the environment (as opposed to a
 * CLI tool) never requires changes to callModel or the orchestrator loop.
 */
const providers = {
  "gemini-api": callGeminiApi,
};

/**
 * Resolves a role ("worker" | "reviewer") to a provider + model via
 * swarm/config.json, then runs the prompt against it.
 */
export async function callModel(role, prompt, opts = {}) {
  const roleConfig = config.roles[role];
  if (!roleConfig) {
    throw new Error(`No provider configured for role "${role}" in swarm/config.json.`);
  }

  const provider = providers[roleConfig.provider];
  if (!provider) {
    throw new Error(`Unknown provider "${roleConfig.provider}" for role "${role}".`);
  }

  return provider(prompt, {
    model: roleConfig.model,
    timeoutMs: config.limits.timeoutMs,
    ...opts,
  });
}

export const limits = config.limits;
