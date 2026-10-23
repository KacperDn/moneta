import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const logsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "logs");

/**
 * Creates a logger scoped to one card run, writing its own log file. Kept as
 * a closure (not module-level state) so concurrent runs for different cards
 * never interleave into the same file or variable.
 */
export function createLogger(cardId, kind) {
  mkdirSync(logsDir, { recursive: true });
  const logPath = path.join(logsDir, `${cardId}-${kind}-${Date.now()}.log`);
  const lines = [];

  return function log(message) {
    const line = `[${new Date().toISOString()}] [${cardId}] ${message}`;
    console.log(line);
    lines.push(line);
    writeFileSync(logPath, lines.join("\n") + "\n");
  };
}
