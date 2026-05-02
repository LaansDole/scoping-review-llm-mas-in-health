import Papa from 'papaparse';
import { Paper } from './types';

/**
 * Mapping from short CSV tag labels to full theme names used in the app.
 */
const TAG_TO_THEME_MAP: Record<string, string> = {
  'llm-driven mas in clinical decision support': 'LLM-based MAS in Clinical Decision-making',
  'mas with llm-driven role-playing agents': 'LLM-based MAS with Role-playing Agents in Healthcare',
  'single llm versus multi-agent framework': 'LLM-based MAS versus Single LLM in Healthcare',
  'mas with mental health': 'LLM-based MAS in Mental Health',
  'mas survey': 'LLM-based MAS Surveys & Benchmarks',
  'awaiting classification': '',
};

function normalizeTag(tag: string): string {
  const trimmed = tag.trim();
  const lower = trimmed.toLowerCase();
  if (TAG_TO_THEME_MAP[lower] !== undefined) {
    return TAG_TO_THEME_MAP[lower];
  }
  // If not in map, return as-is (could be a new or unrecognized theme)
  return trimmed;
}

function parseTags(tagsField: string | undefined): string[] {
  if (!tagsField || !tagsField.trim()) return [];
  const tags = tagsField.split(';').map(normalizeTag).filter(t => t.length > 0);
  // Deduplicate
  return [...new Set(tags)];
}

function generateId(title: string, year: string | number): string {
  const firstAuthorWord = title.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown';
  return `${firstAuthorWord}-${year}-imported-${Math.random().toString(36).slice(2, 7)}`;
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

        // Check required columns
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
          
          // Duplicate detection: match by title (case-insensitive) and DOI
          const isDuplicate = existingPapers.some(p => {
            const titleMatch = p.title.toLowerCase().replace(/\.$/, '') === title.toLowerCase().replace(/\.$/, '');
            const doiMatch = doi && p.doi && p.doi !== 'N/A' && doi !== 'N/A' && 
                           p.doi.toLowerCase() === doi.toLowerCase();
            return titleMatch || (doiMatch && doi);
          });

          if (isDuplicate) {
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
