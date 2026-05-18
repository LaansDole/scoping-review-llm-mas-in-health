import { Paper } from '../types';
import { normalizeTag, generateId, isDuplicate } from './parserUtils';

interface RisRecord {
  tags: Map<string, string[]>;
}

function parseRisText(text: string): RisRecord[] {
  const records: RisRecord[] = [];
  let current: RisRecord | null = null;
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed === '') continue;

    if (trimmed.startsWith('TY  - ')) {
      current = { tags: new Map() };
      const value = trimmed.slice(6).trim();
      current.tags.set('TY', [value]);
      continue;
    }

    if (trimmed === 'ER  -') {
      if (current) {
        records.push(current);
        current = null;
      }
      continue;
    }

    if (current) {
      const match = trimmed.match(/^([A-Z][A-Z0-9])\s*-\s*(.*)$/);
      if (match) {
        const tag = match[1];
        const value = match[2].trim();
        const existing = current.tags.get(tag) || [];
        existing.push(value);
        current.tags.set(tag, existing);
      }
    }
  }

  if (current) {
    records.push(current);
  }

  return records;
}

function getFirst(tags: Map<string, string[]>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const values = tags.get(key);
    if (values && values.length > 0) return values[0];
  }
  return undefined;
}

function getAll(tags: Map<string, string[]>, ...keys: string[]): string[] {
  const result: string[] = [];
  for (const key of keys) {
    const values = tags.get(key);
    if (values) result.push(...values);
  }
  return result;
}

export interface RisImportResult {
  imported: Paper[];
  duplicatesSkipped: number;
  errors: string[];
}

export function parseRisFile(file: File, existingPapers: Paper[]): Promise<RisImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim().length === 0) {
        resolve({ imported: [], duplicatesSkipped: 0, errors: ['RIS file is empty.'] });
        return;
      }

      const records = parseRisText(text);
      if (records.length === 0) {
        resolve({ imported: [], duplicatesSkipped: 0, errors: ['No valid RIS records found.'] });
        return;
      }

      const imported: Paper[] = [];
      let duplicatesSkipped = 0;
      const errors: string[] = [];

      for (const record of records) {
        const title = getFirst(record.tags, 'TI', 'T1')?.trim();
        if (!title) continue;

        const authors = getAll(record.tags, 'AU', 'A1', 'A2').map(a => a.trim()).filter(a => a.length > 0);
        const doi = getFirst(record.tags, 'DO')?.trim() || '';
        const rawYear = getFirst(record.tags, 'PY', 'DA', 'Y1')?.trim() || '';
        const year = parseInt(rawYear.slice(0, 4), 10) || new Date().getFullYear();
        const abstract = getFirst(record.tags, 'AB', 'N2')?.trim() || '';
        const journal = getFirst(record.tags, 'JO', 'T2', 'JF', 'T3')?.trim() || 'Unknown';
        const keywords = getAll(record.tags, 'KW', 'DE').map(k => k.trim()).filter(k => k.length > 0);
        const url = getFirst(record.tags, 'UR', 'L1', 'L2')?.trim();

        if (isDuplicate(title, doi, existingPapers)) {
          duplicatesSkipped++;
          continue;
        }

        const themes = keywords.map(normalizeTag).filter(t => t.length > 0);
        const notes = url || undefined;

        const paper: Paper = {
          id: generateId(title, year),
          title,
          authors,
          year,
          journal,
          abstract,
          doi,
          themes,
          tags: keywords,
          keyFindings: [],
          reviewStatus: 'unreviewed',
          notes,
        };

        imported.push(paper);
      }

      resolve({ imported, duplicatesSkipped, errors });
    };

    reader.onerror = () => {
      resolve({ imported: [], duplicatesSkipped: 0, errors: ['Failed to read RIS file.'] });
    };

    reader.readAsText(file);
  });
}
