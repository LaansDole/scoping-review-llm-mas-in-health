import Papa from 'papaparse';
import { Paper } from '../types';
import { normalizeTag, generateId, isDuplicate } from './parserUtils';

function parseTags(tagsField: string | undefined): string[] {
  if (!tagsField || !tagsField.trim()) return [];
  const tags = tagsField.split(';').map(normalizeTag).filter(t => t.length > 0);
  return [...new Set(tags)];
}

function parseRawTags(tagsField: string | undefined): string[] {
  if (!tagsField || !tagsField.trim()) return [];
  const tags = tagsField.split(';').map(t => t.trim()).filter(t => t.length > 0);
  return [...new Set(tags)];
}

interface CsvRow {
  Title?: string;
  Authors?: string;
  Abstract?: string;
  'Published Year'?: string;
  'Published Month'?: string;
  Journal?: string;
  Volume?: string;
  Issue?: string;
  Pages?: string;
  'Accession Number'?: string;
  DOI?: string;
  Ref?: string;
  'Covidence #'?: string;
  Study?: string;
  Notes?: string;
  Tags?: string;
}

export interface CsvImportResult {
  imported: Paper[];
  duplicatesSkipped: number;
  errors: string[];
}

export function parseCsvFile(file: File, existingPapers: Paper[]): Promise<CsvImportResult> {
  return new Promise((resolve) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const imported: Paper[] = [];
        let duplicatesSkipped = 0;

        if (!results.data || results.data.length === 0) {
          resolve({ imported: [], duplicatesSkipped: 0, errors: ['CSV file is empty or could not be parsed.'] });
          return;
        }

        const fields = results.meta.fields || [];
        if (!fields.includes('Title') || !fields.includes('Authors')) {
          resolve({ imported: [], duplicatesSkipped: 0, errors: ['CSV must contain "Title" and "Authors" columns.'] });
          return;
        }

        for (const row of results.data) {
          const title = row.Title?.trim();
          const authors = row.Authors?.trim();

          if (!title || !authors) continue;

          const doi = row.DOI?.trim() || '';

          if (isDuplicate(title, doi, existingPapers)) {
            duplicatesSkipped++;
            continue;
          }

          const year = parseInt(row['Published Year'] || '0', 10) || new Date().getFullYear();

          const paper: Paper = {
            id: generateId(title, year),
            title,
            authors: authors.split(';').map(a => a.trim()).filter(a => a.length > 0),
            year,
            journal: row.Journal?.trim() || 'Unknown',
            abstract: row.Abstract?.trim() || '',
            doi,
            themes: parseTags(row.Tags),
            tags: parseRawTags(row.Tags),
            keyFindings: [],
            reviewStatus: 'unreviewed',
            covidenceId: row['Covidence #']?.trim() || undefined,
            notes: row.Notes?.trim() || undefined,
          };

          imported.push(paper);
        }

        resolve({ imported, duplicatesSkipped, errors });
      },
      error: (error) => {
        resolve({ imported: [], duplicatesSkipped: 0, errors: [`Parse error: ${error.message}`] });
      }
    });
  });
}
