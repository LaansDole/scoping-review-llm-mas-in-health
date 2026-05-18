import type { Paper } from '../types';

const TAG_TO_THEME_MAP: Record<string, string> = {
  'llm-driven mas in clinical decision support': 'LLM-based MAS in Clinical Decision-making',
  'mas with llm-driven role-playing agents': 'LLM-based MAS with Role-playing Agents in Healthcare',
  'single llm versus multi-agent framework': 'LLM-based MAS versus Single LLM in Healthcare',
  'mas with mental health': 'LLM-based MAS in Mental Health',
  'mas survey': 'LLM-based MAS Surveys & Benchmarks',
  'awaiting classification': '',
};

export function normalizeTag(tag: string): string {
  const trimmed = tag.trim();
  const lower = trimmed.toLowerCase();
  if (TAG_TO_THEME_MAP[lower] !== undefined) {
    return TAG_TO_THEME_MAP[lower];
  }
  return trimmed;
}

export function generateId(title: string, year: string | number): string {
  const firstAuthorWord = title.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown';
  return `${firstAuthorWord}-${year}-imported-${Math.random().toString(36).slice(2, 7)}`;
}

export function isDuplicate(title: string, doi: string, existingPapers: Paper[]): boolean {
  return existingPapers.some(p => {
    const titleMatch = p.title.toLowerCase().replace(/\.$/, '') === title.toLowerCase().replace(/\.$/, '');
    const doiMatch = doi && p.doi && p.doi !== 'N/A' && doi !== 'N/A' &&
                   p.doi.toLowerCase() === doi.toLowerCase();
    return titleMatch || (doiMatch && doi);
  });
}
