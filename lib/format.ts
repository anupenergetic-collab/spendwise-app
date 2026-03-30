export function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return '\u20B9' + (amount / 100000).toFixed(1) + 'L';
  }
  if (amount >= 1000) {
    return '\u20B9' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  return '\u20B9' + amount.toFixed(amount % 1 === 0 ? 0 : 2);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - dateOnly.getTime();
  const dayMs = 86400000;

  if (diff === 0) return 'Today';
  if (diff === dayMs) return 'Yesterday';
  if (diff < 7 * dayMs) {
    return d.toLocaleDateString('en-IN', { weekday: 'long' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function getMonthName(): string {
  return new Date().toLocaleDateString('en-IN', { month: 'long' });
}
