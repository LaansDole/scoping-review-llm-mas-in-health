import { Paper } from './types';
import { PAPERS_PART1 } from './data_part1';
import { PAPERS_PART2 } from './data_part2';

export * from './types';

const addDefaults = (papers: Omit<Paper, 'reviewStatus'>[]): Paper[] =>
  papers.map(p => ({ ...p, reviewStatus: 'unreviewed' as const }));

export const PAPERS: Paper[] = [
  ...addDefaults(PAPERS_PART1),
  ...addDefaults(PAPERS_PART2),
];

export const THEMES = [
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
