import { LetterRecord } from '../types';

const SEQUENCE_STORAGE_KEY = 'alzam_last_sequence_number_v2';
const INITIAL_DEFAULT_SEQUENCE = 7380;

/**
 * Extracts numeric prefix from a letter number like "7379/SR/AMW/X/2026" or "7379"
 */
export function extractSequenceNumber(numStr?: string): number | null {
  if (!numStr) return null;
  const match = numStr.trim().match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Get the current highest sequence number from storage, archive, or default baseline
 */
export function getLatestSequenceNumber(archive?: LetterRecord[]): number {
  let highest = INITIAL_DEFAULT_SEQUENCE;

  // Check stored sequence
  try {
    const stored = localStorage.getItem(SEQUENCE_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > highest) {
        highest = parsed;
      }
    }
  } catch (e) {
    // localStorage fallback
  }

  // Check archive records if provided
  if (archive && archive.length > 0) {
    archive.forEach((rec) => {
      const n1 = extractSequenceNumber(rec.nomorSurat);
      if (n1 && n1 > highest) highest = n1;
      const n2 = extractSequenceNumber(rec.nomorSuratPernyataan);
      if (n2 && n2 > highest) highest = n2;
    });
  }

  return highest;
}

/**
 * Update the stored sequence number if the provided number is higher or explicitly set
 */
export function updateSequenceNumber(num: number): void {
  try {
    const current = getLatestSequenceNumber();
    const target = Math.max(num, current);
    localStorage.setItem(SEQUENCE_STORAGE_KEY, String(target));
  } catch (e) {
    console.error('Failed to update sequence number', e);
  }
}

/**
 * Format Roman Month string for Indonesian official letters
 */
export function getRomanMonth(date = new Date()): string {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanMonths[date.getMonth()];
}

/**
 * Generate sequential consecutive letter numbers without random numbers
 */
export function generateNextSequentialNumbers(archive?: LetterRecord[]): {
  nomorSurat: string;
  nomorSuratPernyataan: string;
  seq1: number;
  seq2: number;
} {
  const currentMax = getLatestSequenceNumber(archive);
  const seq1 = currentMax + 1;
  const seq2 = currentMax + 2;

  // Save the new sequence baseline
  updateSequenceNumber(seq2);

  const now = new Date();
  const year = now.getFullYear();
  const romanMonth = getRomanMonth(now);

  return {
    nomorSurat: `${seq1}/SR/AMW/${romanMonth}/${year}`,
    nomorSuratPernyataan: `${seq2}/SR/AMW/${romanMonth}/${year}`,
    seq1,
    seq2,
  };
}
