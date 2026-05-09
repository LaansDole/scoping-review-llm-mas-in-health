import { Paper, Theme } from './types';
import { PAPERS_PART1 } from './data_part1';
import { PAPERS_PART2 } from './data_part2';

export * from './types';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const THEME_NAMES = [
  "LLM-based MAS in Clinical Decision-making",
  "LLM-based MAS with Role-playing Agents in Healthcare",
  "LLM-based MAS versus Single LLM in Healthcare",
  "LLM-based MAS in Oncology",
  "LLM-based MAS for Pharmacology",
  "LLM-based MAS in Specialized Diagnosis",
  "LLM-based Multi-modal MAS",
  "LLM-based MAS for Healthcare Workflow",
  "LLM-based MAS in Mental Health",
  "LLM-based MAS Surveys & Benchmarks"
];

export const THEMES: Theme[] = THEME_NAMES.map(name => ({
  id: slugify(name),
  name,
  parentId: null,
}));

const THEME_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  THEMES.map(t => [t.name, t.id])
);

function convertPaperThemes(papers: Omit<Paper, 'reviewStatus'>[]): Omit<Paper, 'reviewStatus'>[] {
  return papers.map(p => ({
    ...p,
    themes: p.themes.map(t => THEME_NAME_TO_ID[t] || t),
  }));
}

const addDefaults = (papers: Omit<Paper, 'reviewStatus'>[]): Paper[] =>
  convertPaperThemes(papers).map(p => ({ ...p, reviewStatus: 'unreviewed' as const }));

export const PAPERS: Paper[] = [
  ...addDefaults(PAPERS_PART1),
  ...addDefaults(PAPERS_PART2),
];
