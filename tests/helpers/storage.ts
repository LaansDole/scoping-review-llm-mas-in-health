import type { Paper, Theme, ResearchProject } from '../../src/types';

const PROJECT_INDEX_KEY = 'mas-health-projects';
const CHAT_CONFIG_KEY = 'mas-health-chat-config';

export function makeProject(overrides: Partial<ResearchProject> = {}): ResearchProject {
  return {
    id: `proj-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    lastOpened: null,
    ...overrides,
  };
}

export function makePaper(overrides: Partial<Paper> = {}): Paper {
  return {
    id: `paper-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Test Paper Title',
    authors: ['Author One', 'Author Two'],
    year: 2024,
    journal: 'Test Journal',
    abstract: 'This is a test abstract for a research paper about healthcare and AI.',
    doi: '10.1234/test.2024',
    themes: [],
    tags: [],
    keyFindings: ['Finding one', 'Finding two'],
    systemArchitecture: 'Multi-agent system with LLM coordinator',
    comparisonWithSingleLLM: 'Outperforms single LLM by 15%',
    reviewStatus: 'unreviewed',
    ...overrides,
  };
}

export function makeTheme(overrides: Partial<Theme> = {}): Theme {
  return {
    id: `theme-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Theme',
    parentId: null,
    ...overrides,
  };
}

export function getProjectDataKeys(projectId: string) {
  const prefix = `mas-health-project:${projectId}:`;
  return {
    papers: `${prefix}papers`,
    themes: `${prefix}themes`,
    tags: `${prefix}tags`,
  };
}

export interface SeedData {
  projects?: ResearchProject[];
  activeProjectId?: string;
  papers?: Paper[];
  themes?: Theme[];
  tags?: string[];
  chatConfig?: { baseUrl: string; apiKey: string; model: string };
  legacyData?: {
    papers?: Paper[];
    themes?: Theme[];
    tags?: string[];
  };
}

export function buildLocalStorageScript(data: SeedData): string {
  const sets: string[] = [];

  sets.push('localStorage.clear();');

  if (data.projects) {
    sets.push(`localStorage.setItem('${PROJECT_INDEX_KEY}', ${JSON.stringify(JSON.stringify(data.projects))});`);
  }

  if (data.activeProjectId && data.papers !== undefined) {
    const keys = getProjectDataKeys(data.activeProjectId);
    sets.push(`localStorage.setItem('${keys.papers}', ${JSON.stringify(JSON.stringify(data.papers))});`);
  }

  if (data.activeProjectId && data.themes !== undefined) {
    const keys = getProjectDataKeys(data.activeProjectId);
    sets.push(`localStorage.setItem('${keys.themes}', ${JSON.stringify(JSON.stringify(data.themes))});`);
  }

  if (data.activeProjectId && data.tags !== undefined) {
    const keys = getProjectDataKeys(data.activeProjectId);
    sets.push(`localStorage.setItem('${keys.tags}', ${JSON.stringify(JSON.stringify(data.tags))});`);
  }

  if (data.chatConfig) {
    sets.push(`localStorage.setItem('${CHAT_CONFIG_KEY}', ${JSON.stringify(JSON.stringify(data.chatConfig))});`);
  }

  if (data.legacyData) {
    if (data.legacyData.papers) {
      sets.push(`localStorage.setItem('mas-health-papers', ${JSON.stringify(JSON.stringify(data.legacyData.papers))});`);
    }
    if (data.legacyData.themes) {
      sets.push(`localStorage.setItem('mas-health-themes', ${JSON.stringify(JSON.stringify(data.legacyData.themes))});`);
    }
    if (data.legacyData.tags) {
      sets.push(`localStorage.setItem('mas-health-tags', ${JSON.stringify(JSON.stringify(data.legacyData.tags))});`);
    }
  }

  return `window.__seed = () => { ${sets.join('\n')} };`;
}

export function seedLocalStorage(data: SeedData) {
  return `() => { ${buildLocalStorageScript(data)} }`;
}

export function seedScript(overrides: {
  project: ResearchProject;
  papers?: Paper[];
  themes?: Theme[];
  tags?: string[];
}) {
  const keys = getProjectDataKeys(overrides.project.id);
  const sets: string[] = [];
  sets.push('localStorage.clear();');
  sets.push(`localStorage.setItem('${PROJECT_INDEX_KEY}', ${JSON.stringify(JSON.stringify([overrides.project]))});`);
  if (overrides.papers !== undefined) {
    sets.push(`localStorage.setItem('${keys.papers}', ${JSON.stringify(JSON.stringify(overrides.papers))});`);
  }
  if (overrides.themes !== undefined) {
    sets.push(`localStorage.setItem('${keys.themes}', ${JSON.stringify(JSON.stringify(overrides.themes))});`);
  }
  if (overrides.tags !== undefined) {
    sets.push(`localStorage.setItem('${keys.tags}', ${JSON.stringify(JSON.stringify(overrides.tags))});`);
  }
  return sets.join('\n');
}

export function createTestProject(name = 'Test Project') {
  const project = makeProject({ name });
  const theme = makeTheme({ name: 'Architecture' });
  const paper = makePaper({
    title: 'Multi-Agent Healthcare System',
    abstract: 'A study on LLM-based multi-agent systems in clinical settings.',
    themes: [theme.id],
    tags: ['AI'],
  });

  return {
    project,
    papers: [paper],
    themes: [theme],
    tags: ['AI'],
    seedData: {
      projects: [project],
      activeProjectId: project.id,
      papers: [paper],
      themes: [theme],
      tags: ['AI'],
    },
  };
}

export function createMultiPaperProject() {
  const project = makeProject({ name: 'Multi-Paper Project' });
  const theme1 = makeTheme({ name: 'Diagnosis' });
  const theme2 = makeTheme({ name: 'Treatment' });
  const papers = [
    makePaper({
      title: 'AI Diagnosis in Radiology',
      abstract: 'Deep learning models for radiological diagnosis.',
      themes: [theme1.id],
      tags: ['radiology', 'deep-learning'],
      reviewStatus: 'unreviewed',
    }),
    makePaper({
      title: 'Treatment Planning with LLMs',
      abstract: 'Large language models for treatment planning in oncology.',
      themes: [theme2.id],
      tags: ['oncology', 'LLM'],
      reviewStatus: 'included',
    }),
    makePaper({
      title: 'Excluded Study on Chatbots',
      abstract: 'A study on chatbots that was excluded.',
      themes: [],
      tags: ['chatbot'],
      reviewStatus: 'excluded',
      exclusionReason: 'Not primary research',
    }),
  ];

  return {
    project,
    papers,
    themes: [theme1, theme2],
    tags: ['radiology', 'deep-learning', 'oncology', 'LLM', 'chatbot'],
    seedData: {
      projects: [project],
      activeProjectId: project.id,
      papers,
      themes: [theme1, theme2],
      tags: ['radiology', 'deep-learning', 'oncology', 'LLM', 'chatbot'],
    },
  };
}
