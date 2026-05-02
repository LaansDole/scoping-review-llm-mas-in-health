/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
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
  Upload,
  X,
  Plus,
  Check,
  Ban,
  CircleDot
} from 'lucide-react';
import { PAPERS as INITIAL_PAPERS, THEMES as INITIAL_THEMES, Paper } from './data';
import type { ReviewStatus } from './types';
import { parseCsvFile } from './csvParser';

export default function App() {
  const [papers, setPapers] = useState<Paper[]>(INITIAL_PAPERS);
  const [themes, setThemes] = useState<string[]>([...INITIAL_THEMES]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [newThemeInput, setNewThemeInput] = useState("");
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [newThemeOpen, setNewThemeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV import handler
  const handleCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseCsvFile(file, papers);
    if (result.errors.length > 0) {
      setImportMsg(`Error: ${result.errors.join(', ')}`);
    } else {
      setPapers(prev => [...prev, ...result.imported]);
      // Add any new themes from imported papers
      const allThemes = new Set(themes);
      result.imported.forEach(p => p.themes.forEach(t => allThemes.add(t)));
      setThemes([...allThemes]);
      setImportMsg(`Imported ${result.imported.length} papers. ${result.duplicatesSkipped} duplicates skipped.`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportMsg(null), 5000);
  }, [papers, themes]);

  // Paper mutation helpers
  const updatePaper = useCallback((id: string, updates: Partial<Paper>) => {
    setPapers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    setSelectedPaper(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  }, []);

  const cycleStatus = useCallback((id: string, current: ReviewStatus) => {
    const next: ReviewStatus = current === 'unreviewed' ? 'included' : current === 'included' ? 'excluded' : 'unreviewed';
    updatePaper(id, { reviewStatus: next });
  }, [updatePaper]);

  const removeThemeFromPaper = useCallback((paperId: string, theme: string) => {
    setPapers(prev => prev.map(p => p.id === paperId ? { ...p, themes: p.themes.filter(t => t !== theme) } : p));
    setSelectedPaper(prev => prev && prev.id === paperId ? { ...prev, themes: prev.themes.filter(t => t !== theme) } : prev);
  }, []);

  const addThemeToPaper = useCallback((paperId: string, theme: string) => {
    setPapers(prev => prev.map(p => {
      if (p.id !== paperId || p.themes.includes(theme)) return p;
      return { ...p, themes: [...p.themes, theme] };
    }));
    setSelectedPaper(prev => {
      if (!prev || prev.id !== paperId || prev.themes.includes(theme)) return prev;
      return { ...prev, themes: [...prev.themes, theme] };
    });
  }, []);

  const addNewTheme = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || themes.includes(trimmed)) return;
    setThemes(prev => [...prev, trimmed]);
  }, [themes]);

  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      const matchesTheme = !selectedTheme || paper.themes.includes(selectedTheme);
      const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || paper.reviewStatus === statusFilter;
      return matchesTheme && matchesSearch && matchesStatus;
    });
  }, [selectedTheme, searchQuery, statusFilter, papers]);

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
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>
        </div>
        {importMsg && (
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm font-medium ${importMsg.startsWith('Error') ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
            {importMsg}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Review Status Filter */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Review Status
              </h2>
              <div className="space-y-1">
                {([['all', 'All Papers', CircleDot], ['unreviewed', 'Unreviewed', CircleDot], ['included', 'Included', Check], ['excluded', 'Excluded', Ban]] as const).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      statusFilter === key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
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

            {/* Theme Filter */}
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
                {themes.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSelectedTheme(theme)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border-l-4 ${
                      selectedTheme === theme 
                        ? 'bg-indigo-50 text-indigo-700 font-medium border-indigo-600 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100 border-transparent'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

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
                {selectedTheme || "All Recent Publications"}
                <span className="ml-2 text-slate-400 font-normal text-lg">({filteredPapers.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredPapers.map((paper) => (
                  <motion.div
                    key={paper.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedPaper(paper)}
                    className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                          {paper.journal} • {paper.year}
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
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3 line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-grow">
                      {paper.abstract}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                      {paper.themes.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                          {t.replace("LLM-based MAS in ", "").replace("LLM-based ", "")}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
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
                        {selectedPaper.abstract}
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
                          <span className="text-sm font-semibold text-slate-900">{selectedPaper.journal}</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Authors</label>
                          <span className="text-xs text-slate-600 line-clamp-3">{selectedPaper.authors.join(", ")}</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">DOI</label>
                          <a href={`https://doi.org/${selectedPaper.doi}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                            {selectedPaper.doi}
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
                        {t}
                        <button
                          onClick={() => removeThemeFromPaper(selectedPaper.id, t)}
                          className="w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center transition-colors"
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
                        onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add theme
                      </button>
                      {themeDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                          {themes.filter(t => !selectedPaper.themes.includes(t)).length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400 italic">All themes assigned</div>
                          )}
                          {themes.filter(t => !selectedPaper.themes.includes(t)).map(t => (
                            <button
                              key={t}
                              onClick={() => { addThemeToPaper(selectedPaper.id, t); setThemeDropdownOpen(false); }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                            >
                              {t}
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
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Review Status:</span>
                  {(['included', 'excluded', 'unreviewed'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => updatePaper(selectedPaper.id, { reviewStatus: status })}
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

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100/50 blur-3xl rounded-full" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-50/50 blur-3xl rounded-full" />
      </div>
    </div>
  );
}

