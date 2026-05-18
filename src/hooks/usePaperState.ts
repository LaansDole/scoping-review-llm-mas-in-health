import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Paper, Theme, ReviewStatus } from '../types';
import { getProjectDataKeys } from '../stores/projectStore';

export const EXCLUSION_REASONS = ['Not LLM-based MAS', 'Duplicate paper', 'Full text unavailable', 'Not primary research'] as const;

export function usePaperState(activeProjectId: string | null) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'review'>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatus>('unreviewed');
  const [newThemeInput, setNewThemeInput] = useState("");
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [newThemeOpen, setNewThemeOpen] = useState(false);
  const [pendingExclusionId, setPendingExclusionId] = useState<string | null>(null);
  const [pendingScreeningId, setPendingScreeningId] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [customReason, setCustomReason] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const [pendingDeleteTagName, setPendingDeleteTagName] = useState<string | null>(null);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingThemeValue, setEditingThemeValue] = useState("");
  const [pendingDeleteThemeId, setPendingDeleteThemeId] = useState<string | null>(null);
  const [addingSubThemeParentId, setAddingSubThemeParentId] = useState<string | null>(null);
  const [subThemeInput, setSubThemeInput] = useState("");
  const [addingTopTheme, setAddingTopTheme] = useState(false);
  const [topThemeInput, setTopThemeInput] = useState("");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [batchTagDropdownOpen, setBatchTagDropdownOpen] = useState(false);
  const [batchRemoveDropdownOpen, setBatchRemoveDropdownOpen] = useState(false);
  const [batchNewTagInput, setBatchNewTagInput] = useState("");

  const updatePaper = useCallback((id: string, updates: Partial<Paper>) => {
    setPapers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    setSelectedPaper(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  }, []);

  const startEdit = useCallback((field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingField || !selectedPaper) return;
    const updates: Partial<Paper> = {};
    if (editingField === 'authors') {
      updates.authors = editValue.split(',').map(a => a.trim()).filter(Boolean);
    } else if (editingField === 'year') {
      const n = parseInt(editValue);
      if (!isNaN(n)) updates.year = n;
    } else {
      (updates as Record<string, string>)[editingField] = editValue;
    }
    updatePaper(selectedPaper.id, updates);
    setEditingField(null);
    setEditValue("");
  }, [editingField, editValue, selectedPaper, updatePaper]);

  const openExclusionDialog = useCallback((paperId: string) => {
    setPendingExclusionId(paperId);
    setSelectedReasons(new Set());
    setCustomReason("");
  }, []);

  const cancelExclusion = useCallback(() => {
    setPendingExclusionId(null);
    setSelectedReasons(new Set());
    setCustomReason("");
  }, []);

  const confirmExclusion = useCallback(() => {
    if (!pendingExclusionId) return;
    const parts = [...selectedReasons];
    if (customReason.trim()) parts.push(customReason.trim());
    if (parts.length === 0) return;
    const reason = parts.join('; ');
    updatePaper(pendingExclusionId, { reviewStatus: 'excluded', themes: [], exclusionReason: reason });
    setViewMode('all');
    setSelectedTheme(null);
    setPendingExclusionId(null);
    setSelectedReasons(new Set());
    setCustomReason("");
  }, [pendingExclusionId, selectedReasons, customReason, updatePaper]);

  const openScreeningDialog = useCallback((paperId: string) => {
    setPendingScreeningId(paperId);
  }, []);

  const cancelScreening = useCallback(() => {
    setPendingScreeningId(null);
  }, []);

  const confirmScreening = useCallback((onMessage?: (msg: string) => void) => {
    if (!pendingScreeningId) return;
    const paper = papers.find(p => p.id === pendingScreeningId);
    setPapers(prev => prev.filter(p => p.id !== pendingScreeningId));
    setSelectedPaper(null);
    setPendingScreeningId(null);
    if (onMessage) {
      onMessage(`Moved "${paper?.title || 'Paper'}" back to screening.`);
    }
  }, [pendingScreeningId, papers]);

  const toggleReason = useCallback((reason: string) => {
    setSelectedReasons(prev => {
      const next = new Set(prev);
      if (next.has(reason)) next.delete(reason); else next.add(reason);
      return next;
    });
  }, []);

  const cycleStatus = useCallback((id: string, current: ReviewStatus) => {
    const next: ReviewStatus = current === 'unreviewed' ? 'included' : current === 'included' ? 'excluded' : 'unreviewed';
    if (next === 'excluded') {
      openExclusionDialog(id);
      return;
    }
    updatePaper(id, { reviewStatus: next });
  }, [updatePaper, openExclusionDialog]);

  const removeThemeFromPaper = useCallback((paperId: string, themeId: string) => {
    setPapers(prev => prev.map(p => p.id === paperId ? { ...p, themes: p.themes.filter(t => t !== themeId) } : p));
    setSelectedPaper(prev => prev && prev.id === paperId ? { ...prev, themes: prev.themes.filter(t => t !== themeId) } : prev);
  }, []);

  const addThemeToPaper = useCallback((paperId: string, themeId: string) => {
    setPapers(prev => prev.map(p => {
      if (p.id !== paperId || p.themes.includes(themeId)) return p;
      return { ...p, themes: [...p.themes, themeId] };
    }));
    setSelectedPaper(prev => {
      if (!prev || prev.id !== paperId || prev.themes.includes(themeId)) return prev;
      return { ...prev, themes: [...prev.themes, themeId] };
    });
  }, []);

  const addNewTheme = useCallback((name: string, parentId: string | null = null) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const siblings = themes.filter(t => t.parentId === parentId);
    if (siblings.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return false;
    const newTheme: Theme = { id: crypto.randomUUID(), name: trimmed, parentId };
    setThemes(prev => [...prev, newTheme]);
    return true;
  }, [themes]);

  const renameTheme = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const theme = themes.find(t => t.id === id);
    if (!theme) return false;
    const siblings = themes.filter(t => t.parentId === theme.parentId && t.id !== id);
    if (siblings.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return false;
    setThemes(prev => prev.map(t => t.id === id ? { ...t, name: trimmed } : t));
    return true;
  }, [themes]);

  const deleteTheme = useCallback((id: string) => {
    const idsToRemove = new Set<string>();
    idsToRemove.add(id);
    themes.filter(t => t.parentId === id).forEach(t => idsToRemove.add(t.id));
    setThemes(prev => prev.filter(t => !idsToRemove.has(t.id)));
    setPapers(prev => prev.map(p => ({
      ...p,
      themes: p.themes.filter(tid => !idsToRemove.has(tid)),
    })));
    setSelectedPaper(prev => prev ? {
      ...prev,
      themes: prev.themes.filter(tid => !idsToRemove.has(tid)),
    } : prev);
    if (idsToRemove.has(selectedTheme || '')) {
      setSelectedTheme(null);
    }
  }, [themes, selectedTheme]);

  const removeTagFromPaper = useCallback((paperId: string, tag: string) => {
    setPapers(prev => prev.map(p => p.id === paperId ? { ...p, tags: p.tags.filter(t => t !== tag) } : p));
    setSelectedPaper(prev => prev && prev.id === paperId ? { ...prev, tags: prev.tags.filter(t => t !== tag) } : prev);
  }, []);

  const addTagToPaper = useCallback((paperId: string, tag: string) => {
    setPapers(prev => prev.map(p => {
      if (p.id !== paperId || p.tags.includes(tag)) return p;
      return { ...p, tags: [...p.tags, tag] };
    }));
    setSelectedPaper(prev => {
      if (!prev || prev.id !== paperId || prev.tags.includes(tag)) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
    setAllTags(prev => {
      if (prev.includes(tag)) return prev;
      return [...prev, tag];
    });
  }, []);

  const addNewTag = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || allTags.includes(trimmed)) return;
    setAllTags(prev => [...prev, trimmed]);
  }, [allTags]);

  const renameTag = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) { setEditingTagName(null); return; }
    if (allTags.includes(trimmed)) { setEditingTagName(null); return; }
    setAllTags(prev => prev.map(t => t === oldName ? trimmed : t));
    setPapers(prev => prev.map(p => ({
      ...p,
      tags: p.tags.map(t => t === oldName ? trimmed : t),
    })));
    setSelectedPaper(prev => prev ? { ...prev, tags: prev.tags.map(t => t === oldName ? trimmed : t) } : prev);
    if (selectedTag === oldName) setSelectedTag(trimmed);
    setEditingTagName(null);
  }, [allTags, selectedTag]);

  const deleteTag = useCallback((tagName: string) => {
    setAllTags(prev => prev.filter(t => t !== tagName));
    setPapers(prev => prev.map(p => ({
      ...p,
      tags: p.tags.filter(t => t !== tagName),
    })));
    setSelectedPaper(prev => prev ? { ...prev, tags: prev.tags.filter(t => t !== tagName) } : prev);
    if (selectedTag === tagName) setSelectedTag(null);
    setPendingDeleteTagName(null);
  }, [selectedTag]);

  const batchAddTag = useCallback((paperIds: string[], tag: string) => {
    setPapers(prev => prev.map(p => {
      if (!paperIds.includes(p.id) || p.tags.includes(tag)) return p;
      return { ...p, tags: [...p.tags, tag] };
    }));
    setSelectedPaper(prev => {
      if (!prev || !paperIds.includes(prev.id) || prev.tags.includes(tag)) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
    setAllTags(prev => {
      if (prev.includes(tag)) return prev;
      return [...prev, tag];
    });
  }, []);

  const batchRemoveTag = useCallback((paperIds: string[], tag: string) => {
    setPapers(prev => prev.map(p => {
      if (!paperIds.includes(p.id) || !p.tags.includes(tag)) return p;
      return { ...p, tags: p.tags.filter(t => t !== tag) };
    }));
    setSelectedPaper(prev => {
      if (!prev || !paperIds.includes(prev.id) || !prev.tags.includes(tag)) return prev;
      return { ...prev, tags: prev.tags.filter(t => t !== tag) };
    });
  }, []);

  const getDescendantThemeIds = useCallback((themeId: string): Set<string> => {
    const ids = new Set<string>();
    ids.add(themeId);
    themes.filter(t => t.parentId === themeId).forEach(t => ids.add(t.id));
    return ids;
  }, [themes]);

  const getThemeName = useCallback((id: string): string => {
    return themes.find(t => t.id === id)?.name || id;
  }, [themes]);

  const paperMap = useMemo(() => new Map(papers.map(p => [p.id, p])), [papers]);

  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      if (viewMode === 'all') {
        let matchesTheme = true;
        if (selectedTheme) {
          const allowedIds = getDescendantThemeIds(selectedTheme);
          matchesTheme = paper.themes.some(tid => allowedIds.has(tid));
        }
        const matchesTag = !selectedTag || paper.tags.includes(selectedTag);
        return matchesTheme && matchesTag && matchesSearch;
      }
      return paper.reviewStatus === reviewStatusFilter && matchesSearch;
    });
  }, [viewMode, selectedTheme, selectedTag, searchQuery, reviewStatusFilter, papers, getDescendantThemeIds]);

  const statusCounts = useMemo(() => ({
    all: papers.length,
    included: papers.filter(p => p.reviewStatus === 'included').length,
    excluded: papers.filter(p => p.reviewStatus === 'excluded').length,
    unreviewed: papers.filter(p => p.reviewStatus === 'unreviewed').length,
  }), [papers]);

  useEffect(() => {
    setSelectedPaperIds(new Set());
    setLastClickedIndex(null);
  }, [viewMode, selectedTheme, selectedTag, searchQuery, reviewStatusFilter]);

  useEffect(() => {
    if (!activeProjectId) return;
    const keys = getProjectDataKeys(activeProjectId);
    localStorage.setItem(keys.papers, JSON.stringify(papers));
  }, [papers, activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) return;
    const keys = getProjectDataKeys(activeProjectId);
    localStorage.setItem(keys.themes, JSON.stringify(themes));
  }, [themes, activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) return;
    const keys = getProjectDataKeys(activeProjectId);
    localStorage.setItem(keys.tags, JSON.stringify(allTags));
  }, [allTags, activeProjectId]);

  return {
    papers,
    setPapers,
    themes,
    setThemes,
    selectedTheme,
    setSelectedTheme,
    searchQuery,
    setSearchQuery,
    selectedPaper,
    setSelectedPaper,
    viewMode,
    setViewMode,
    reviewStatusFilter,
    setReviewStatusFilter,
    newThemeInput,
    setNewThemeInput,
    themeDropdownOpen,
    setThemeDropdownOpen,
    newThemeOpen,
    setNewThemeOpen,
    pendingExclusionId,
    setPendingExclusionId,
    pendingScreeningId,
    setPendingScreeningId,
    selectedReasons,
    setSelectedReasons,
    customReason,
    setCustomReason,
    editingField,
    setEditingField,
    editValue,
    setEditValue,
    allTags,
    setAllTags,
    selectedTag,
    setSelectedTag,
    tagDropdownOpen,
    setTagDropdownOpen,
    newTagOpen,
    setNewTagOpen,
    newTagInput,
    setNewTagInput,
    editingTagName,
    setEditingTagName,
    editingTagValue,
    setEditingTagValue,
    pendingDeleteTagName,
    setPendingDeleteTagName,
    editingThemeId,
    setEditingThemeId,
    editingThemeValue,
    setEditingThemeValue,
    pendingDeleteThemeId,
    setPendingDeleteThemeId,
    addingSubThemeParentId,
    setAddingSubThemeParentId,
    subThemeInput,
    setSubThemeInput,
    addingTopTheme,
    setAddingTopTheme,
    topThemeInput,
    setTopThemeInput,
    multiSelectMode,
    setMultiSelectMode,
    selectedPaperIds,
    setSelectedPaperIds,
    lastClickedIndex,
    setLastClickedIndex,
    batchTagDropdownOpen,
    setBatchTagDropdownOpen,
    batchRemoveDropdownOpen,
    setBatchRemoveDropdownOpen,
    batchNewTagInput,
    setBatchNewTagInput,
    updatePaper,
    startEdit,
    cancelEdit,
    saveEdit,
    openExclusionDialog,
    cancelExclusion,
    confirmExclusion,
    openScreeningDialog,
    cancelScreening,
    confirmScreening,
    toggleReason,
    cycleStatus,
    removeThemeFromPaper,
    addThemeToPaper,
    addNewTheme,
    renameTheme,
    deleteTheme,
    removeTagFromPaper,
    addTagToPaper,
    addNewTag,
    renameTag,
    deleteTag,
    batchAddTag,
    batchRemoveTag,
    getDescendantThemeIds,
    getThemeName,
    paperMap,
    filteredPapers,
    statusCounts,
  };
}

export type UsePaperStateReturn = ReturnType<typeof usePaperState>;
