import type { ResearchProject } from '../types';

const PROJECT_INDEX_KEY = 'mas-health-projects';
const LEGACY_KEYS = {
  papers: 'mas-health-papers',
  themes: 'mas-health-themes',
  tags: 'mas-health-tags',
} as const;

function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function getProjectDataKeys(projectId: string) {
  const prefix = `mas-health-project:${projectId}:`;
  return {
    papers: `${prefix}papers`,
    themes: `${prefix}themes`,
    tags: `${prefix}tags`,
  };
}

export function loadProjectIndex(): ResearchProject[] {
  try {
    const saved = localStorage.getItem(PROJECT_INDEX_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function saveProjectIndex(projects: ResearchProject[]): void {
  localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(projects));
}

export function createProject(name: string): ResearchProject {
  const projects = loadProjectIndex();
  const project: ResearchProject = {
    id: generateId(),
    name,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    archived: false,
    lastOpened: null,
  };
  projects.push(project);
  saveProjectIndex(projects);
  return project;
}

export function archiveProject(projectId: string): ResearchProject[] {
  const projects = loadProjectIndex();
  const updated = projects.map(p =>
    p.id === projectId ? { ...p, archived: true, updatedAt: nowISO() } : p
  );
  saveProjectIndex(updated);
  return updated;
}

export function restoreProject(projectId: string): ResearchProject[] {
  const projects = loadProjectIndex();
  const updated = projects.map(p =>
    p.id === projectId ? { ...p, archived: false, updatedAt: nowISO() } : p
  );
  saveProjectIndex(updated);
  return updated;
}

export function updateLastOpened(projectId: string): ResearchProject[] {
  const projects = loadProjectIndex();
  const updated = projects.map(p =>
    p.id === projectId ? { ...p, lastOpened: nowISO(), updatedAt: nowISO() } : p
  );
  saveProjectIndex(updated);
  return updated;
}

export function renameProject(projectId: string, newName: string): ResearchProject[] {
  const projects = loadProjectIndex();
  const updated = projects.map(p =>
    p.id === projectId ? { ...p, name: newName, updatedAt: nowISO() } : p
  );
  saveProjectIndex(updated);
  return updated;
}

export function migrateLegacyData(): ResearchProject | null {
  const hasPapers = localStorage.getItem(LEGACY_KEYS.papers);
  const hasThemes = localStorage.getItem(LEGACY_KEYS.themes);
  const hasTags = localStorage.getItem(LEGACY_KEYS.tags);

  if (!hasPapers && !hasThemes && !hasTags) return null;

  const existingIndex = localStorage.getItem(PROJECT_INDEX_KEY);
  if (existingIndex) return null;

  const project = createProject('Default Project');
  const keys = getProjectDataKeys(project.id);

  if (hasPapers) {
    localStorage.setItem(keys.papers, hasPapers);
    localStorage.removeItem(LEGACY_KEYS.papers);
  }
  if (hasThemes) {
    localStorage.setItem(keys.themes, hasThemes);
    localStorage.removeItem(LEGACY_KEYS.themes);
  }
  if (hasTags) {
    localStorage.setItem(keys.tags, hasTags);
    localStorage.removeItem(LEGACY_KEYS.tags);
  }

  return project;
}

export function getProjectPaperCount(projectId: string): number {
  try {
    const keys = getProjectDataKeys(projectId);
    const saved = localStorage.getItem(keys.papers);
    if (saved) return JSON.parse(saved).length;
  } catch {}
  return 0;
}
