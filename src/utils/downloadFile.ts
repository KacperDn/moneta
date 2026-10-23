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
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoking synchronously can abort the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const UTF8_BOM = String.fromCharCode(0xfeff);

/** Downloads CSV text; the BOM makes Excel detect UTF-8 so Polish diacritics render correctly. */
export function downloadCsvFile(filename: string, csv: string): void {
  downloadTextFile(filename, UTF8_BOM + csv, "text/csv;charset=utf-8;");
}
