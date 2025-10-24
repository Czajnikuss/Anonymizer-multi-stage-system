import { AnonymizationStrategy, AnonymizationResult } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const anonymizeText = async (
  text: string,
  strategy: AnonymizationStrategy
): Promise<AnonymizationResult> => {
  const response = await fetch(`${API_BASE_URL}/anonymize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, strategy }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
  }

  const result: AnonymizationResult = await response.json();
  return result;
};
