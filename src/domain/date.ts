export function getTodayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Pazartesi=0 ... Pazar=6
export function getTodayDayIndex(): number {
  const js = new Date().getDay(); // 0=Sun ... 6=Sat
  // convert to Mon=0..Sun=6
  return (js + 6) % 7;
}
