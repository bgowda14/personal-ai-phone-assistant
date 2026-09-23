import type { Call } from './types';

export const DECISION_LABELS: Record<string, string> = {
  TRANSFER: 'Would Transfer',
  TAKE_MESSAGE: 'Take Message',
  SCREEN: 'Screening',
  REJECT: 'Rejected',
  ASK_ME: 'Ask Me',
};

const FAILED_TRANSFER_RESULTS = ['no-answer', 'busy', 'failed', 'canceled'];

export function decisionLabel(call: Call): string {
  if (call.decided_action !== 'TRANSFER') {
    return (
      DECISION_LABELS[call.decided_action || ''] || call.decided_action || ''
    );
  }
  if (call.transfer_result === 'completed') return 'Transferred';
  if (call.transfer_result) return 'Transfer Failed';
  if (call.status === 'in_progress') return 'Transferring...';
  return 'Would Transfer'; // no transfer number configured
}

export function decisionBadgeVariant(
  call: Call
): 'transfer' | 'reject' | 'failed' | 'neutral' {
  if (call.decided_action === 'REJECT') return 'reject';
  if (call.decided_action === 'TRANSFER') {
    if (
      call.transfer_result &&
      FAILED_TRANSFER_RESULTS.includes(call.transfer_result)
    ) {
      return 'failed';
    }
    return 'transfer';
  }
  return 'neutral';
}
