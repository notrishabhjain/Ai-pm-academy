export function usd(v: number): string {
  if (v === 0) return '$0';
  if (Math.abs(v) < 0.01) return `$${v.toFixed(5)}`;
  if (Math.abs(v) < 1) return `$${v.toFixed(3)}`;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: v >= 1000 ? 0 : 2 })}`;
}

/** Indian numbering (lakh / crore grouping). */
export function inr(v: number): string {
  if (v === 0) return '₹0';
  if (Math.abs(v) < 1) return `₹${v.toFixed(3)}`;
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: v >= 1000 ? 0 : 2 })}`;
}

/** "₹1.2 Cr" / "₹3.4 L" style shorthand for big numbers. */
export function inrShort(v: number): string {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return inr(v);
}

export function num(v: number, digits = 0): string {
  return v.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function pct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function ms(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}s` : `${Math.round(v)}ms`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function downloadText(filename: string, text: string, mime = 'text/markdown'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
