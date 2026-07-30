import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

export async function getOpportunityAction(opportunityId: string) {
  const functions = getFunctions(undefined, 'me-central1');
  const callable = httpsCallable(functions, 'getOpportunityAction');
  const requestId = `action_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const result = await callable({ opportunityId, requestId });
  return result.data as { actionUrl: string; tracked: boolean };
}

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDateMethod = (value as { toDate?: unknown }).toDate;
    if (typeof toDateMethod === 'function') {
      const date = toDateMethod.call(value);
      return date instanceof Date ? date : null;
    }
  }
  return null;
}
