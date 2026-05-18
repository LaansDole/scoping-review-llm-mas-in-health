import { useState, useRef, useCallback, useEffect } from 'react';
import type { ResearchProject, Theme, Paper } from '../types';
import { parseCsvFile, parseRisFile, exportPapersAsCsv } from '../io';
import {
  loadProjectIndex,
  createProject,
  archiveProject,
  restoreProject,
  renameProject as renameProjectStore,
  updateLastOpened,
  migrateLegacyData,
} from '../stores/projectStore';
import { slugify, loadPapersForProject, loadThemesForProject, loadTagsForProject } from '../utils/dataLoader';

export interface ProjectData {
  papers: Paper[];
  themes: Theme[];
  tags: string[];
}

export type FileImportResult =
  | { papers: Paper[]; themes: Theme[]; tags: string[]; message: string }
  | { error: string };

export function useProjectState() {
  const [currentView, setCurrentView] = useState<'projects' | 'workspace'>('projects');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<ResearchProject | null>(null);
  const [projectIndex, setProjectIndex] = useState<ResearchProject[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameProjectValue, setRenameProjectValue] = useState("");
  const [renamingHeader, setRenamingHeader] = useState(false);
  const [renameHeaderValue, setRenameHeaderValue] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialProjectData, setInitialProjectData] = useState<ProjectData | null>(null);

  const isArchived = activeProject?.archived ?? false;

  const openProject = useCallback((projectId: string, index?: ResearchProject[]): ProjectData | null => {
    const idx = index ?? loadProjectIndex();
    const project = idx.find(p => p.id === projectId);
    if (!project) return null;

    const updated = updateLastOpened(projectId);
    setProjectIndex(updated);
    setActiveProjectId(projectId);
    setActiveProject(updated.find(p => p.id === projectId) ?? project);
    setCurrentView('workspace');

    const papers = loadPapersForProject(projectId);
    const themes = loadThemesForProject(projectId);
    const tags = loadTagsForProject(projectId, papers);

    return { papers, themes, tags };
  }, []);

  const handleCreateProject = useCallback((): ProjectData | null => {
    const name = newProjectName.trim();
    if (!name) return null;
    const project = createProject(name);
    setProjectIndex(loadProjectIndex());
    setNewProjectName("");
    return openProject(project.id);
  }, [newProjectName, openProject]);

  const handleArchiveProject = useCallback((projectId: string) => {
    const updated = archiveProject(projectId);
    setProjectIndex(updated);
    if (projectId === activeProjectId) {
      setActiveProject(prev => prev ? { ...prev, archived: true } : prev);
    }
  }, [activeProjectId]);

  const handleRestoreProject = useCallback((projectId: string) => {
    const updated = restoreProject(projectId);
    setProjectIndex(updated);
    if (projectId === activeProjectId) {
      setActiveProject(prev => prev ? { ...prev, archived: false } : prev);
    }
  }, [activeProjectId]);

  const handleRenameProject = useCallback((projectId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = renameProjectStore(projectId, trimmed);
    setProjectIndex(updated);
    if (projectId === activeProjectId) {
      setActiveProject(prev => prev ? { ...prev, name: trimmed } : prev);
    }
    setRenamingProjectId(null);
    setRenamingHeader(false);
  }, [activeProjectId]);

  const goToProjects = useCallback(() => {
    setCurrentView('projects');
  }, []);

  const handleFileImport = useCallback(async (
    file: File,
    currentPapers: Paper[],
    currentThemes: Theme[],
  ): Promise<FileImportResult> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const result = ext === 'ris'
      ? await parseRisFile(file, currentPapers)
      : await parseCsvFile(file, currentPapers);

    if (result.errors.length > 0) {
      const errorMsg = `Error: ${result.errors.join(', ')}`;
      setImportMsg(errorMsg);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportMsg(null), 5000);
      return { error: errorMsg };
    }

    const importedWithIds = result.imported.map(p => {
      const mappedThemes = p.themes.map(t => {
        const existing = currentThemes.find(th => th.name === t);
        if (existing) return existing.id;
        return t;
      });
      return { ...p, themes: mappedThemes };
    });

    const updatedPapers = [...currentPapers, ...importedWithIds];

    const newThemes: Theme[] = [];
    const seenNames = new Set(currentThemes.map(t => t.name));
    importedWithIds.forEach(p => p.themes.forEach(tid => {
      if (!currentThemes.some(t => t.id === tid) && !newThemes.some(nt => nt.id === tid)) {
        const originalName = result.imported.find(ip => ip.themes.includes(tid))?.themes.find(t => {
          const existing = currentThemes.find(th => th.name === t);
          return existing?.id === tid;
        }) || tid;
        if (!seenNames.has(originalName)) {
          seenNames.add(originalName);
          newThemes.push({ id: tid, name: originalName, parentId: null });
        }
      }
    }));
    const updatedThemes = newThemes.length > 0 ? [...currentThemes, ...newThemes] : currentThemes;

    const tagsSet = new Set<string>();
    updatedPapers.forEach(p => p.tags.forEach(t => tagsSet.add(t)));
    const updatedTags = [...tagsSet];

    const message = `Imported ${result.imported.length} papers. ${result.duplicatesSkipped} duplicates skipped.`;
    setImportMsg(message);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportMsg(null), 5000);

    return { papers: updatedPapers, themes: updatedThemes, tags: updatedTags, message };
  }, []);

  const handleExport = useCallback((papers: Paper[], themes: Theme[]) => {
    exportPapersAsCsv(papers, themes);
  }, []);

  const clearInitialProjectData = useCallback(() => {
    setInitialProjectData(null);
  }, []);

  useEffect(() => {
    const migrated = migrateLegacyData();
    let index = loadProjectIndex();
    if (migrated) {
      index = loadProjectIndex();
    }
    setProjectIndex(index);

    const lastProject = [...index]
      .filter(p => !p.archived && p.lastOpened)
      .sort((a, b) => (b.lastOpened ?? '').localeCompare(a.lastOpened ?? ''))[0];

    if (lastProject) {
      const updated = updateLastOpened(lastProject.id);
      setProjectIndex(updated);
      setActiveProjectId(lastProject.id);
      setActiveProject(updated.find(p => p.id === lastProject.id) ?? lastProject);
      setCurrentView('workspace');

      const papers = loadPapersForProject(lastProject.id);
      const themes = loadThemesForProject(lastProject.id);
      const tags = loadTagsForProject(lastProject.id, papers);
      setInitialProjectData({ papers, themes, tags });
    }
  }, []);

  return {
    currentView,
    activeProjectId,
    activeProject,
    setActiveProject,
    projectIndex,
    newProjectName,
    setNewProjectName,
    showArchived,
    setShowArchived,
    renamingProjectId,
    setRenamingProjectId,
    renameProjectValue,
    setRenameProjectValue,
    renamingHeader,
    setRenamingHeader,
    renameHeaderValue,
    setRenameHeaderValue,
    importMsg,
    setImportMsg,
    fileInputRef,
    isArchived,
    initialProjectData,
    clearInitialProjectData,
    openProject,
    handleCreateProject,
    handleArchiveProject,
    handleRestoreProject,
    handleRenameProject,
    goToProjects,
    handleFileImport,
    handleExport,
  };
}

export type UseProjectStateReturn = ReturnType<typeof useProjectState>;
