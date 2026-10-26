// The popup and ending copy lives in i18n/src/locales/<lang>.json.

/** Deterministic pick so a given popup shows the same line while it is open. */
export function pickLine(lines: readonly string[], seed: number): string {
  return lines[Math.abs(seed) % lines.length]
}
