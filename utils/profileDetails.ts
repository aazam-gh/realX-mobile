export function parseProfileDate(value?: string | null): Date | null {
  if (!value) return null;

  const parts = value.includes('-') ? value.split('-') : value.split('/').reverse();
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatProfileDate(date: Date | null): string {
  return date ? date.toLocaleDateString('en-GB') : 'DD/MM/YYYY';
}

export function profileDateValue(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
