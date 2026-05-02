export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  abstract: string;
  doi: string;
  themes: string[];
  keyFindings: string[];
  systemArchitecture?: string;
  comparisonWithSingleLLM?: string;
}
