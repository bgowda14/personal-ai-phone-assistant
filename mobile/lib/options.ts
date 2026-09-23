export const STATUS_OPTIONS = [
  'Available',
  'Busy',
  'Sleeping',
  'In Class',
  'Driving',
  'Custom',
] as const;

export type Status = (typeof STATUS_OPTIONS)[number];

export const RELATIONSHIP_OPTIONS = [
  'family',
  'friend',
  'recruiter',
  'delivery',
  'apartment',
  'unknown',
  'spam',
] as const;

export const PRIORITY_OPTIONS = ['critical', 'high', 'normal', 'low'] as const;
