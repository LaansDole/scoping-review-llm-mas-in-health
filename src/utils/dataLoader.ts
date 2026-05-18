import type { Paper, Theme } from '../types';
import { getProjectDataKeys } from '../stores/projectStore';

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function loadPapersForProject(projectId: string): Paper[] {
  const keys = getProjectDataKeys(projectId);
  try {
    const saved = localStorage.getItem(keys.papers);
    if (saved) {
      const papers: Paper[] = JSON.parse(saved).map((p: Paper) => ({ ...p, tags: p.tags ?? [] }));
      const needsMigration = papers.length > 0 && papers[0].themes.length > 0 &&
        papers[0].themes.some(t => t.includes(' ') || t !== t.toLowerCase());
      if (needsMigration) {
        return papers.map(p => ({
          ...p,
          themes: p.themes.map(t => slugify(t)),
        }));
      }
      return papers;
    }
  } catch { }
  return [];
}

export function loadThemesForProject(projectId: string): Theme[] {
  const keys = getProjectDataKeys(projectId);
  try {
    const saved = localStorage.getItem(keys.themes);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && 'id' in parsed[0]) {
        return parsed;
      }
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.map((name: string) => ({ id: slugify(name), name, parentId: null }));
      }
    }
  } catch { }
  return [];
}

export function loadTagsForProject(projectId: string, papers: Paper[]): string[] {
  const keys = getProjectDataKeys(projectId);
  try {
    const saved = localStorage.getItem(keys.tags);
    if (saved) return JSON.parse(saved);
  } catch { }
  const tags = new Set<string>();
  papers.forEach(p => p.tags.forEach(t => tags.add(t)));
  return [...tags];
}
