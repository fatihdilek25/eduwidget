export const SUBJECT_COLORS: Record<string, string> = {
  FEN: "#22C55E",
  BİLŞ: "#3B82F6",
};

export function getColor(short: string) {
  return SUBJECT_COLORS[short] ?? "#64748B";
}