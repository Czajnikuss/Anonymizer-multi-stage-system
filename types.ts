export enum AnonymizationStrategy {
  TAG = 'tag',
  REPLACE = 'replace',
  REMOVE = 'remove',
}

export interface AnonymizationResult {
  anonymizedText: string;
  anonymizationId: string;
}
