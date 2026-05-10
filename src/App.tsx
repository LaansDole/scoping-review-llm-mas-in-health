/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useCallback, useEffect, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FlaskConical, 
  ArrowRight, 
  ExternalLink, 
  Filter,
  CheckCircle2,
  Info,
  Layers,
  ClipboardList,
  Pencil,
  Upload,
  X,
  Plus,
  Check,
  Ban,
  CircleDot,
  Tag,
  Trash2,
  ArrowLeft,
  ListChecks,
  CheckSquare,
  Square,
  MessageSquare,
  Send,
  Settings,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { PAPERS as INITIAL_PAPERS, THEMES as INITIAL_THEMES, Paper, Theme } from './data';
import type { ReviewStatus, ChatConfig, ChatMessage } from './types';
import { parseCsvFile } from './csvParser';
import { parseRisFile } from './risParser';
import { loadChatConfig, saveChatConfig, buildSystemPrompt, streamChatCompletion } from './chatApi';

const STORAGE_KEYS = { papers: 'mas-health-papers', themes: 'mas-health-themes', tags: 'mas-health-tags' } as const;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function loadPapers(): Paper[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.papers);
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
  } catch {}
  return INITIAL_PAPERS;
}

function loadThemes(): Theme[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.themes);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && 'id' in parsed[0]) {
        return parsed;
      }
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return migrateLegacyThemes(parsed);
      }
    }
  } catch {}
  return [...INITIAL_THEMES];
}

function migrateLegacyThemes(names: string[]): Theme[] {
  return names.map(name => ({
    id: slugify(name),
    name,
    parentId: null,
  }));
}

function loadTags(papers: Paper[]): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.tags);
    if (saved) return JSON.parse(saved);
  } catch {}
  const tags = new Set<string>();
  papers.forEach(p => p.tags.forEach(t => tags.add(t)));
  return [...tags];
}

export default function App() {
  const [papers, setPapers] = useState<Paper[]>(loadPapers);
  const [themes, setThemes] = useState<Theme[]>(loadThemes);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'review'>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatus>('unreviewed');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [newThemeInput, setNewThemeInput] = useState("");
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [newThemeOpen, setNewThemeOpen] = useState(false);
  const [pendingExclusionId, setPendingExclusionId] = useState<string | null>(null);
  const [pendingScreeningId, setPendingScreeningId] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [customReason, setCustomReason] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [allTags, setAllTags] = useState<string[]>(() => loadTags(loadPapers()));
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig>(loadChatConfig);
  const [chatPanelSize, setChatPanelSize] = useState<"compact" | "expanded" | "full">("compact");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedPaperIds(new Set());
    setLastClickedIndex(null);
  }, [viewMode, selectedTheme, selectedTag, searchQuery, reviewStatusFilter]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.papers, JSON.stringify(papers));
  }, [papers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.themes, JSON.stringify(themes));
  }, [themes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(allTags));
  }, [allTags]);

  useEffect(() => {
    if (chatOpen) {
      setChatMessages([]);
      setChatInput("");
      setChatPanelSize("compact");
    }
  }, [chatOpen]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView();
  }, [chatMessages]);

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const result = ext === 'ris'
      ? await parseRisFile(file, papers)
      : await parseCsvFile(file, papers);
    if (result.errors.length > 0) {
      setImportMsg(`Error: ${result.errors.join(', ')}`);
    } else {
      const importedWithIds = result.imported.map(p => {
        const mappedThemes = p.themes.map(t => {
          const existing = themes.find(th => th.name === t);
          if (existing) return existing.id;
          return t;
        });
        return { ...p, themes: mappedThemes };
      });
      setPapers(prev => [...prev, ...importedWithIds]);
      const newThemes: Theme[] = [];
      const seenNames = new Set(themes.map(t => t.name));
      importedWithIds.forEach(p => p.themes.forEach(tid => {
        if (!themes.some(t => t.id === tid) && !newThemes.some(nt => nt.id === tid)) {
          const originalName = result.imported.find(ip => ip.themes.includes(tid))?.themes.find(t => {
            const existing = themes.find(th => th.name === t);
            return existing?.id === tid;
          }) || tid;
          if (!seenNames.has(originalName)) {
            seenNames.add(originalName);
            newThemes.push({ id: tid, name: originalName, parentId: null });
          }
        }
      }));
      if (newThemes.length > 0) {
        setThemes(prev => [...prev, ...newThemes]);
      }
      setAllTags(prev => {
        const next = new Set(prev);
        result.imported.forEach(p => p.tags.forEach(t => next.add(t)));
        return next.size === prev.length ? prev : [...next];
      });
      setImportMsg(`Imported ${result.imported.length} papers. ${result.duplicatesSkipped} duplicates skipped.`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportMsg(null), 5000);
  }, [papers, themes]);

  const EXCLUSION_REASONS = ['Not LLM-based MAS', 'Duplicate paper', 'Full text unavailable', 'Not primary research'] as const;

  // Paper mutation helpers
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

  const confirmScreening = useCallback(() => {
    if (!pendingScreeningId) return;
    const paper = papers.find(p => p.id === pendingScreeningId);
    setPapers(prev => prev.filter(p => p.id !== pendingScreeningId));
    setSelectedPaper(null);
    setPendingScreeningId(null);
    setImportMsg(`Moved "${paper?.title || 'Paper'}" back to screening.`);
    setTimeout(() => setImportMsg(null), 5000);
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

  const handleChatSend = useCallback(async (messageText: string) => {
    const text = messageText.trim();
    if (!text || isStreaming) return;
    if (!chatConfig.apiKey) {
      setChatMessages(prev => [...prev,
        { role: "user", content: text, timestamp: Date.now() },
        { role: "assistant", content: "Please configure your API settings first. Click the gear icon in the chat header to set up your API key, base URL, and model.", timestamp: Date.now() },
      ]);
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsStreaming(true);

    const systemMsg: ChatMessage = {
      role: "system",
      content: buildSystemPrompt(papers, themes),
    };
    const apiMessages = [systemMsg, ...updatedMessages];

    let fullResponse = "";
    setChatMessages(prev => [...prev, { role: "assistant", content: "", timestamp: Date.now() }]);

    await streamChatCompletion(
      chatConfig,
      apiMessages,
      (token) => {
        fullResponse += token;
        setChatMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: fullResponse, timestamp: Date.now() };
          return next;
        });
      },
      () => {
        setIsStreaming(false);
      },
      (error) => {
        setChatMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: `Error: ${error}`, timestamp: Date.now() };
          return next;
        });
        setIsStreaming(false);
      }
    );
  }, [chatMessages, chatConfig, isStreaming, papers, themes]);

  const PAPER_REF_REGEX = /\{\{paper:([^}]+)\}\}/g;

  const renderAssistantContent = useCallback((content: string) => {
    const segments: { type: "text" | "paper"; value: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const regex = new RegExp(PAPER_REF_REGEX.source, "g");

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
      }
      segments.push({ type: "paper", value: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      segments.push({ type: "text", value: content.slice(lastIndex) });
    }

    return segments.map((seg, i) => {
      if (seg.type === "paper") {
        const paper = paperMap.get(seg.value);
        if (!paper) return <Fragment key={i}>{`{{paper:${seg.value}}}`}</Fragment>;
        return (
          <button
            key={i}
            onClick={() => setSelectedPaper(paper)}
            className="block w-full text-left my-2 p-3 bg-white border border-indigo-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {paper.title}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-slate-500">{paper.year}</span>
              <span className="text-slate-300">|</span>
              {paper.themes.slice(0, 2).map(tid => (
                <span key={tid} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                  {getThemeName(tid).replace("LLM-based MAS in ", "").replace("LLM-based ", "")}
                </span>
              ))}
            </div>
          </button>
        );
      }

      return (
        <div key={i} className="chat-markdown prose-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{seg.value}</ReactMarkdown>
        </div>
      );
    });
  }, [paperMap, getThemeName]);

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 border-l-2 border-slate-200 pl-3">
              MAS-Health <span className="font-normal text-slate-500">Explorer</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search research..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <input ref={fileInputRef} type="file" accept=".csv,.ris" onChange={handleFileImport} className="hidden" />
            <button
              onClick={() => setChatOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ${chatOpen ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              title="Toggle Chat"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>
        </div>
        {importMsg && (
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm font-medium ${importMsg.startsWith('Error') ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
            {importMsg}
          </div>
        )}
      </header>

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${multiSelectMode && selectedPaperIds.size > 0 ? 'pb-24' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            {/* View Mode Selector */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Navigation
              </h2>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Papers
                </button>
                <button
                  onClick={() => setViewMode('review')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'review' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Full-Text Review
                </button>
              </div>
            </div>

            {/* All Papers: Theme Filter */}
            {viewMode === 'all' && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Research Themes
                </h2>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedTheme(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedTheme ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Research
                  </button>
                  {themes.filter(t => !t.parentId).map((parent) => {
                    const children = themes.filter(c => c.parentId === parent.id);
                    const paperCount = papers.filter(p => {
                      const allowedIds = new Set([parent.id, ...children.map(c => c.id)]);
                      return p.themes.some(tid => allowedIds.has(tid));
                    }).length;
                    return (
                      <div key={parent.id}>
                        <div className="group flex items-center">
                          {editingThemeId === parent.id ? (
                            <div className="flex-1 flex items-center gap-1 px-1">
                              <input
                                type="text"
                                value={editingThemeValue}
                                onChange={e => setEditingThemeValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    if (renameTheme(parent.id, editingThemeValue)) {
                                      setEditingThemeId(null);
                                    }
                                  }
                                  if (e.key === 'Escape') setEditingThemeId(null);
                                }}
                                onBlur={() => {
                                  if (renameTheme(parent.id, editingThemeValue)) {
                                    setEditingThemeId(null);
                                  }
                                }}
                                autoFocus
                                className="flex-1 text-sm bg-white border border-indigo-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedTheme(parent.id)}
                              className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors border-l-4 ${
                                selectedTheme === parent.id
                                  ? 'bg-indigo-50 text-indigo-700 font-medium border-indigo-600 shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-100 border-transparent'
                              }`}
                            >
                              {parent.name}
                            </button>
                          )}
                          {editingThemeId !== parent.id && (
                            <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                              <button
                                onClick={() => { setEditingThemeId(parent.id); setEditingThemeValue(parent.name); }}
                                className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Rename theme"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setAddingSubThemeParentId(parent.id)}
                                className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Add sub-theme"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setPendingDeleteThemeId(parent.id)}
                                className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete theme"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        {children.map(child => (
                          <div key={child.id} className="group flex items-center ml-4">
                            {editingThemeId === child.id ? (
                              <div className="flex-1 flex items-center gap-1 px-1">
                                <input
                                  type="text"
                                  value={editingThemeValue}
                                  onChange={e => setEditingThemeValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      if (renameTheme(child.id, editingThemeValue)) {
                                        setEditingThemeId(null);
                                      }
                                    }
                                    if (e.key === 'Escape') setEditingThemeId(null);
                                  }}
                                  onBlur={() => {
                                    if (renameTheme(child.id, editingThemeValue)) {
                                      setEditingThemeId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="flex-1 text-xs bg-white border border-indigo-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedTheme(child.id)}
                                className={`flex-1 text-left px-3 py-1.5 rounded-lg text-xs transition-colors border-l-4 ${
                                  selectedTheme === child.id
                                    ? 'bg-indigo-50 text-indigo-700 font-medium border-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-100 border-transparent'
                                }`}
                              >
                                {child.name}
                              </button>
                            )}
                            {editingThemeId !== child.id && (
                              <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                                <button
                                  onClick={() => { setEditingThemeId(child.id); setEditingThemeValue(child.name); }}
                                  className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="Rename theme"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setPendingDeleteThemeId(child.id)}
                                  className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                                  title="Delete theme"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {addingSubThemeParentId === parent.id && (
                          <div className="flex items-center gap-1 ml-4 px-1">
                            <input
                              type="text"
                              value={subThemeInput}
                              onChange={e => setSubThemeInput(e.target.value)}
                              placeholder="Sub-theme name..."
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter' && subThemeInput.trim()) {
                                  if (addNewTheme(subThemeInput, parent.id)) {
                                    setSubThemeInput('');
                                    setAddingSubThemeParentId(null);
                                  }
                                }
                                if (e.key === 'Escape') {
                                  setSubThemeInput('');
                                  setAddingSubThemeParentId(null);
                                }
                              }}
                              className="flex-1 text-xs bg-white border border-indigo-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => {
                                if (subThemeInput.trim() && addNewTheme(subThemeInput, parent.id)) {
                                  setSubThemeInput('');
                                  setAddingSubThemeParentId(null);
                                }
                              }}
                              className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => { setSubThemeInput(''); setAddingSubThemeParentId(null); }}
                              className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!addingTopTheme ? (
                    <button
                      onClick={() => setAddingTopTheme(true)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 border border-dashed border-slate-200"
                    >
                      <Plus className="w-3 h-3" />
                      Add theme
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 px-1">
                      <input
                        type="text"
                        value={topThemeInput}
                        onChange={e => setTopThemeInput(e.target.value)}
                        placeholder="Theme name..."
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter' && topThemeInput.trim()) {
                            if (addNewTheme(topThemeInput)) {
                              setTopThemeInput('');
                              setAddingTopTheme(false);
                            }
                          }
                          if (e.key === 'Escape') {
                            setTopThemeInput('');
                            setAddingTopTheme(false);
                          }
                        }}
                        className="flex-1 text-sm bg-white border border-indigo-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => {
                          if (topThemeInput.trim() && addNewTheme(topThemeInput)) {
                            setTopThemeInput('');
                            setAddingTopTheme(false);
                          }
                        }}
                        className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { setTopThemeInput(''); setAddingTopTheme(false); }}
                        className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All Papers: Tag Filter */}
            {viewMode === 'all' && allTags.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h2>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedTag ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Tags
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selectedTag === tag
                          ? 'bg-amber-50 text-amber-700 font-medium border-l-4 border-amber-600 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 border-l-4 border-transparent'
                      }`}
                    >
                      <span className="truncate">{tag}</span>
                      <span className="text-xs text-slate-400 ml-2">{papers.filter(p => p.tags.includes(tag)).length}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full-Text Review: Status Filter */}
            {viewMode === 'review' && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Review Status
                </h2>
                <div className="space-y-1">
                  {([['unreviewed', 'Unreviewed', CircleDot], ['included', 'Included', Check], ['excluded', 'Excluded', Ban]] as const).map(([key, label, Icon]) => (
                    <button
                      key={key}
                      onClick={() => setReviewStatusFilter(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        reviewStatusFilter === key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${key === 'included' ? 'text-emerald-500' : key === 'excluded' ? 'text-red-400' : ''}`} />
                        {label}
                      </span>
                      <span className="text-xs text-slate-400">{statusCounts[key]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-indigo-900 rounded-2xl text-white shadow-xl shadow-indigo-200 overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="font-semibold mb-2">Trend Insight</h3>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  MAS architectures in healthcare are shifting from single-task agents to collaborative "Role-Playing" squads emulating clinical multidisciplinary teams.
                </p>
              </div>
              <Layers className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
            </div>
          </aside>

          {/* Content Area */}
          <section className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {viewMode === 'all'
                  ? (selectedTheme ? getThemeName(selectedTheme) : "All Papers")
                  : reviewStatusFilter === 'included' ? 'Included Papers'
                    : reviewStatusFilter === 'excluded' ? 'Excluded Papers'
                    : 'Unreviewed Papers'
                }
                <span className="ml-2 text-slate-400 font-normal text-lg">({filteredPapers.length})</span>
              </h2>
              <button
                onClick={() => {
                  setMultiSelectMode(prev => !prev);
                  setSelectedPaperIds(new Set());
                  setLastClickedIndex(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  multiSelectMode
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                {multiSelectMode ? 'Exit Select' : 'Multi-Select'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredPapers.map((paper, index) => {
                  const isSelected = selectedPaperIds.has(paper.id);
                  return (
                    <motion.div
                      key={paper.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        if (multiSelectMode) {
                          const newSet = new Set(selectedPaperIds);
                          if (newSet.has(paper.id)) newSet.delete(paper.id);
                          else newSet.add(paper.id);
                          setSelectedPaperIds(newSet);
                          setLastClickedIndex(index);
                        } else {
                          setSelectedPaper(paper);
                        }
                      }}
                      className={`group bg-white p-6 rounded-2xl border transition-all cursor-pointer flex flex-col h-full relative ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/30 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5'
                      }`}
                    >
                      {multiSelectMode && (
                        <div
                          className="absolute top-1 left-1 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newSet = new Set(selectedPaperIds);
                            if (e.shiftKey && lastClickedIndex !== null) {
                              const start = Math.min(lastClickedIndex, index);
                              const end = Math.max(lastClickedIndex, index);
                              const shouldSelect = !selectedPaperIds.has(paper.id);
                              for (let i = start; i <= end; i++) {
                                if (shouldSelect) newSet.add(filteredPapers[i].id);
                                else newSet.delete(filteredPapers[i].id);
                              }
                            } else {
                              if (newSet.has(paper.id)) newSet.delete(paper.id);
                              else newSet.add(paper.id);
                            }
                            setSelectedPaperIds(newSet);
                            setLastClickedIndex(index);
                          }}
                        >
                          {isSelected
                            ? <CheckSquare className="w-5 h-5 text-indigo-600" />
                            : <Square className="w-5 h-5 text-slate-300 hover:text-indigo-400 transition-colors" />
                          }
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                            {paper.journal} &bull; {paper.year}
                          </div>
                          {paper.reviewStatus !== 'unreviewed' && (
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              paper.reviewStatus === 'included' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {paper.reviewStatus}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); cycleStatus(paper.id, paper.reviewStatus); }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              paper.reviewStatus === 'included' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' :
                              paper.reviewStatus === 'excluded' ? 'bg-red-100 text-red-600 hover:bg-red-200' :
                              'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                            title={`Status: ${paper.reviewStatus}. Click to cycle.`}
                          >
                            {paper.reviewStatus === 'included' ? <Check className="w-4 h-4" /> :
                             paper.reviewStatus === 'excluded' ? <Ban className="w-4 h-4" /> :
                             <CircleDot className="w-4 h-4" />}
                          </button>
                          {!multiSelectMode && (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3 line-clamp-2">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-grow">
                        {paper.abstract}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                        {paper.themes.slice(0, 2).map((t) => {
                          const name = getThemeName(t);
                          return (
                            <span key={t} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                              {name.replace("LLM-based MAS in ", "").replace("LLM-based ", "")}
                            </span>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            {filteredPapers.length === 0 && (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No matching research found</h3>
                <p className="text-slate-500">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Paper Detailed Modal */}
      <AnimatePresence>
        {selectedPaper && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPaper(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
                    <ClipboardList className="w-4 h-4" />
                    Full Text Review Abstract
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 pr-8">{selectedPaper.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedPaper(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2 uppercase tracking-tight">
                        <Info className="w-4 h-4 text-indigo-600" />
                        Executive Summary
                      </h4>
                      <p className="text-slate-600 leading-relaxed text-lg">
                        {editingField === 'abstract' ? (
                          <textarea
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                            autoFocus
                            rows={6}
                            className="w-full text-lg leading-relaxed bg-white border border-indigo-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                          />
                        ) : (
                          <div className="flex gap-2">
                            <span className="flex-1">{selectedPaper.abstract}</span>
                            <button onClick={() => startEdit('abstract', selectedPaper.abstract)} className="shrink-0 p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors self-start"><Pencil className="w-4 h-4" /></button>
                          </div>
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Key Findings & Contributions
                      </h4>
                      <ul className="space-y-3">
                        {selectedPaper.keyFindings.map((finding, idx) => (
                          <li key={idx} className="flex items-start gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <span className="text-slate-700 text-sm leading-snug">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Metadata</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Journal</label>
                          {editingField === 'journal' ? (
                            <input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} autoFocus className="w-full text-sm bg-white border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500" />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-slate-900">{selectedPaper.journal}</span>
                              <button onClick={() => startEdit('journal', selectedPaper.journal)} className="shrink-0 p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Year</label>
                          {editingField === 'year' ? (
                            <input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} autoFocus className="w-full text-sm bg-white border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500" />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-slate-900">{selectedPaper.year}</span>
                              <button onClick={() => startEdit('year', String(selectedPaper.year))} className="shrink-0 p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Authors</label>
                          {editingField === 'authors' ? (
                            <input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} autoFocus className="w-full text-xs bg-white border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500" />
                          ) : (
                            <div className="flex items-start gap-1.5">
                              <span className="text-xs text-slate-600 line-clamp-3">{selectedPaper.authors.join(', ')}</span>
                              <button onClick={() => startEdit('authors', selectedPaper.authors.join(', '))} className="shrink-0 p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">DOI</label>
                          {editingField === 'doi' ? (
                            <input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} autoFocus className="w-full text-xs bg-white border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500" />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <a href={`https://doi.org/${selectedPaper.doi}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1">
                                {selectedPaper.doi}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button onClick={() => startEdit('doi', selectedPaper.doi)} className="shrink-0 p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Notes</label>
                          {editingField === 'notes' ? (
                            <textarea value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }} autoFocus rows={3} className="w-full text-xs bg-white border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
                          ) : (
                            <div className="flex items-start gap-1.5">
                              <span className="text-xs text-slate-600">{selectedPaper.notes || <em className="text-slate-300">Add notes...</em>}</span>
                              <button onClick={() => startEdit('notes', selectedPaper.notes || '')} className="shrink-0 p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedPaper.systemArchitecture && (
                      <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-900 uppercase mb-2">System Architecture</h4>
                        <p className="text-xs text-indigo-800 leading-normal">
                          {selectedPaper.systemArchitecture}
                        </p>
                      </div>
                    )}

                    {selectedPaper.comparisonWithSingleLLM && (
                      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                        <h4 className="text-xs font-bold text-amber-900 uppercase mb-2">Single LLM Comparison</h4>
                        <p className="text-xs text-amber-800 leading-normal">
                          {selectedPaper.comparisonWithSingleLLM}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-tight">Thematic Classification</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedPaper.themes.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No themes assigned</span>
                    )}
                    {selectedPaper.themes.map(t => (
                      <div key={t} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium text-indigo-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {getThemeName(t)}
                        <button
                          onClick={() => removeThemeFromPaper(selectedPaper.id, t)}
                          className="w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center transition-colors"
                          title={`Remove "${getThemeName(t)}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add theme
                      </button>
                      {themeDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                          {themes.filter(t => !selectedPaper.themes.includes(t.id)).length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400 italic">All themes assigned</div>
                          )}
                          {themes.filter(t => !selectedPaper.themes.includes(t.id)).map(t => (
                            <button
                              key={t.id}
                              onClick={() => { addThemeToPaper(selectedPaper.id, t.id); setThemeDropdownOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                                t.parentId ? 'pl-6' : ''
                              }`}
                            >
                              {t.parentId ? `\u21B3 ${t.name}` : t.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!newThemeOpen ? (
                      <button
                        onClick={() => setNewThemeOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-dashed border-slate-300 rounded-full text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Create new theme
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newThemeInput}
                          onChange={e => setNewThemeInput(e.target.value)}
                          placeholder="Theme name..."
                          className="px-3 py-1.5 bg-white border border-indigo-300 rounded-full text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-52"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newThemeInput.trim()) {
                              addNewTheme(newThemeInput);
                              setNewThemeInput('');
                              setNewThemeOpen(false);
                            }
                            if (e.key === 'Escape') {
                              setNewThemeInput('');
                              setNewThemeOpen(false);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newThemeInput.trim()) {
                              addNewTheme(newThemeInput);
                              setNewThemeInput('');
                              setNewThemeOpen(false);
                            }
                          }}
                          className="px-2 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => { setNewThemeInput(''); setNewThemeOpen(false); }}
                          className="px-2 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-tight">Tags</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedPaper.tags.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No tags assigned</span>
                    )}
                    {selectedPaper.tags.map(t => (
                      <div key={t} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {t}
                        <button
                          onClick={() => removeTagFromPaper(selectedPaper.id, t)}
                          className="w-4 h-4 rounded-full hover:bg-amber-200 flex items-center justify-center transition-colors"
                          title={`Remove "${t}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add tag
                      </button>
                      {tagDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                          {allTags.filter(t => !selectedPaper.tags.includes(t)).length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400 italic">All tags assigned</div>
                          )}
                          {allTags.filter(t => !selectedPaper.tags.includes(t)).map(t => (
                            <button
                              key={t}
                              onClick={() => { addTagToPaper(selectedPaper.id, t); setTagDropdownOpen(false); }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!newTagOpen ? (
                      <button
                        onClick={() => setNewTagOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-dashed border-slate-300 rounded-full text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Create new tag
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={e => setNewTagInput(e.target.value)}
                          placeholder="Tag name..."
                          className="px-3 py-1.5 bg-white border border-amber-300 rounded-full text-xs focus:ring-2 focus:ring-amber-500 outline-none w-52"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newTagInput.trim()) {
                              addNewTag(newTagInput);
                              addTagToPaper(selectedPaper.id, newTagInput.trim());
                              setNewTagInput('');
                              setNewTagOpen(false);
                            }
                            if (e.key === 'Escape') {
                              setNewTagInput('');
                              setNewTagOpen(false);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newTagInput.trim()) {
                              addNewTag(newTagInput);
                              addTagToPaper(selectedPaper.id, newTagInput.trim());
                              setNewTagInput('');
                              setNewTagOpen(false);
                            }
                          }}
                          className="px-2 py-1.5 bg-amber-600 text-white rounded-full text-xs font-medium hover:bg-amber-700 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => { setNewTagInput(''); setNewTagOpen(false); }}
                          className="px-2 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-500">Review Status:</span>
                  {(['included', 'excluded', 'unreviewed'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        if (status === 'excluded') {
                          openExclusionDialog(selectedPaper.id);
                          return;
                        }
                        updatePaper(selectedPaper.id, { reviewStatus: status });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        selectedPaper.reviewStatus === status
                          ? status === 'included' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : status === 'excluded' ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-slate-200 text-slate-600 border border-slate-300'
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {status === 'included' ? 'Included' : status === 'excluded' ? 'Excluded' : 'Unreviewed'}
                    </button>
                  ))}
                  {selectedPaper.reviewStatus === 'excluded' && selectedPaper.exclusionReason && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">{selectedPaper.exclusionReason}</span>
                  )}
                  <span className="mx-1 text-slate-300">|</span>
                  <button
                    onClick={() => openScreeningDialog(selectedPaper.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Move Back to Screening
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedPaper(null)}
                  className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exclusion Reason Dialog */}
      <AnimatePresence>
        {pendingExclusionId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelExclusion}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900">Reason for Exclusion</h3>
              <p className="text-sm text-slate-500">Select at least one reason or provide a custom one.</p>
              <div className="space-y-2">
                {EXCLUSION_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                      selectedReasons.has(reason)
                        ? 'bg-red-50 border-red-300 text-red-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="text"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Or type a custom reason..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (selectedReasons.size > 0 || customReason.trim())) confirmExclusion();
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={cancelExclusion}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExclusion}
                  disabled={selectedReasons.size === 0 && !customReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Exclude Paper
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Move Back to Screening Confirmation Dialog */}
      <AnimatePresence>
        {pendingScreeningId && (() => {
          const paper = papers.find(p => p.id === pendingScreeningId);
          return paper ? (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={cancelScreening}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Trash2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Move Back to Screening</h3>
                </div>
                <p className="text-sm text-slate-600">
                  This will permanently remove the following paper from the review:
                </p>
                <p className="text-sm font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                  {paper.title}
                </p>
                <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                  This paper will no longer appear in this review. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={cancelScreening}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmScreening}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Move Back to Screening
                  </button>
                </div>
              </motion.div>
            </div>
          ) : null;
        })()}
      </AnimatePresence>

      {/* Theme Delete Confirmation Dialog */}
      <AnimatePresence>
        {pendingDeleteThemeId && (() => {
          const theme = themes.find(t => t.id === pendingDeleteThemeId);
          if (!theme) return null;
          const children = themes.filter(t => t.parentId === pendingDeleteThemeId);
          const affectedPapers = papers.filter(p => {
            const ids = new Set([pendingDeleteThemeId, ...children.map(c => c.id)]);
            return p.themes.some(tid => ids.has(tid));
          }).length;
          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPendingDeleteThemeId(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Theme</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete <strong>{theme.name}</strong>?
                </p>
                {children.length > 0 && (
                  <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                    This will also delete {children.length} sub-theme{children.length > 1 ? 's' : ''}: {children.map(c => c.name).join(', ')}
                  </p>
                )}
                <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                  This will remove the theme{children.length > 0 ? 's' : ''} from {affectedPapers} paper{affectedPapers !== 1 ? 's' : ''}.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPendingDeleteThemeId(null)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteTheme(pendingDeleteThemeId);
                      setPendingDeleteThemeId(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Delete Theme
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Batch Tag Action Bar */}
      <AnimatePresence>
        {multiSelectMode && selectedPaperIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-slate-200 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">
                  {selectedPaperIds.size} selected
                </span>
                <button
                  onClick={() => {
                    if (selectedPaperIds.size === filteredPapers.length) {
                      setSelectedPaperIds(new Set());
                    } else {
                      setSelectedPaperIds(new Set(filteredPapers.map(p => p.id)));
                    }
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {selectedPaperIds.size === filteredPapers.length ? 'Deselect all' : 'Select all'}
                </button>
                <button
                  onClick={() => {
                    setSelectedPaperIds(new Set());
                    setLastClickedIndex(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <button
                    onClick={() => {
                      setBatchTagDropdownOpen(!batchTagDropdownOpen);
                      setBatchRemoveDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Add Tag
                  </button>
                  {batchTagDropdownOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      {allTags.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400 italic">No tags exist yet</div>
                      )}
                      {allTags.map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            batchAddTag([...selectedPaperIds], t);
                            setBatchTagDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={batchNewTagInput}
                    onChange={e => setBatchNewTagInput(e.target.value)}
                    placeholder="New tag..."
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-32"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && batchNewTagInput.trim()) {
                        addNewTag(batchNewTagInput);
                        batchAddTag([...selectedPaperIds], batchNewTagInput.trim());
                        setBatchNewTagInput('');
                      }
                      if (e.key === 'Escape') {
                        setBatchNewTagInput('');
                      }
                    }}
                  />
                  {batchNewTagInput.trim() && (
                    <button
                      onClick={() => {
                        addNewTag(batchNewTagInput);
                        batchAddTag([...selectedPaperIds], batchNewTagInput.trim());
                        setBatchNewTagInput('');
                      }}
                      className="px-2 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {(() => {
                  const ids = [...selectedPaperIds];
                  const sharedTags = allTags.filter(tag =>
                    ids.some(id => papers.find(p => p.id === id)?.tags.includes(tag))
                  );
                  if (sharedTags.length === 0) return null;
                  return (
                    <div className="relative">
                      <button
                        onClick={() => {
                          setBatchRemoveDropdownOpen(!batchRemoveDropdownOpen);
                          setBatchTagDropdownOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove Tag
                      </button>
                      {batchRemoveDropdownOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                          {sharedTags.map(t => (
                            <button
                              key={t}
                              onClick={() => {
                                batchRemoveTag([...selectedPaperIds], t);
                                setBatchRemoveDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100/50 blur-3xl rounded-full" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-50/50 blur-3xl rounded-full" />
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <>
          <div
            onClick={() => setChatOpen(false)}
            className="fixed inset-0 z-[80] bg-slate-900/20 backdrop-blur-sm"
          />
          <div
            className={`fixed top-0 right-0 z-[90] h-full bg-white shadow-2xl flex flex-col transition-all duration-300 ${
              chatPanelSize === "full" ? "w-full" : chatPanelSize === "expanded" ? "w-full max-w-2xl" : "w-full max-w-md"
            }`}
          >
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Research Chat</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setChatPanelSize(prev => prev === "compact" ? "expanded" : prev === "expanded" ? "full" : "compact")}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                    title={chatPanelSize === "compact" ? "Expand" : chatPanelSize === "expanded" ? "Full screen" : "Compact"}
                  >
                    {chatPanelSize === "full" ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setChatSettingsOpen(prev => !prev)}
                    className={`p-1.5 rounded-lg transition-colors ${chatSettingsOpen ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"}`}
                    title="API Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {chatSettingsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-slate-200"
                  >
                    <div className="p-4 space-y-3 bg-slate-50">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Base URL</label>
                        <input
                          type="text"
                          value={chatConfig.baseUrl}
                          onChange={e => {
                            const next = { ...chatConfig, baseUrl: e.target.value };
                            setChatConfig(next);
                            saveChatConfig(next);
                          }}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="https://api.deepseek.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">API Key</label>
                        <input
                          type="password"
                          value={chatConfig.apiKey}
                          onChange={e => {
                            const next = { ...chatConfig, apiKey: e.target.value };
                            setChatConfig(next);
                            saveChatConfig(next);
                          }}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="sk-..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Model</label>
                        <input
                          type="text"
                          value={chatConfig.model}
                          onChange={e => {
                            const next = { ...chatConfig, model: e.target.value };
                            setChatConfig(next);
                            saveChatConfig(next);
                          }}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="deepseek-chat"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 pt-1">Defaults from .env file. UI overrides are saved in localStorage.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-4">Ask about papers, themes, or tags</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "Find papers about mental health",
                        "What are the main themes?",
                        "Suggest tags for my research",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleChatSend(prompt)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : msg.content.startsWith("Error:")
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {msg.role === "assistant" ? renderAssistantContent(msg.content) : msg.content}
                      {msg.role === "assistant" && !msg.content && isStreaming && (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend(chatInput);
                      }
                    }}
                    placeholder="Ask about papers..."
                    disabled={isStreaming}
                    rows={1}
                    className="flex-1 resize-none px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={() => handleChatSend(chatInput)}
                    disabled={isStreaming || !chatInput.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
}

