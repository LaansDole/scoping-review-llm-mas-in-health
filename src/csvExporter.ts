import Papa from 'papaparse';
import type { Paper, Theme } from './types';

export function exportPapersAsCsv(papers: Paper[], themes: Theme[]): void {
  const themeMap = new Map(themes.map(t => [t.id, t.name]));

  const rows = papers.map(p => ({
    Title: p.title,
    Authors: p.authors.join('; '),
    Year: p.year,
    Journal: p.journal,
    DOI: p.doi,
    Abstract: p.abstract,
    Themes: p.themes.map(id => themeMap.get(id) || id).join('; '),
    Tags: p.tags.join('; '),
    'Key Findings': p.keyFindings.join('; '),
    'Review Status': p.reviewStatus,
    'Exclusion Reason': p.exclusionReason || '',
    Notes: p.notes || '',
    'Covidence ID': p.covidenceId || '',
    'System Architecture': p.systemArchitecture || '',
    'Comparison With Single LLM': p.comparisonWithSingleLLM || '',
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `papers-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
