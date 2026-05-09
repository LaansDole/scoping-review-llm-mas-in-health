export type ReviewStatus = "included" | "excluded" | "unreviewed";

export interface Theme {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  abstract: string;
  doi: string;
  themes: string[];
  tags: string[];
  keyFindings: string[];
  systemArchitecture?: string;
  comparisonWithSingleLLM?: string;
  reviewStatus: ReviewStatus;
  covidenceId?: string;
  notes?: string;
  exclusionReason?: string;
}
