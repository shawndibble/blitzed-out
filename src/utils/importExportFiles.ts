export function downloadTextFile(
  content: string,
  filename: string,
  type = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function readTextFile(file: File): Promise<string> {
  return file.text();
}
