/**
 * Triggers a browser download of text content via a temporary object URL.
 * Kept separate from exportCsv.ts, which stays pure (no I/O, no DOM) and testable.
 */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
