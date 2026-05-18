import React from 'react';
import type { Paper, Theme, ReviewStatus } from '../types';
import { ClipboardList, Info, CheckCircle2, ExternalLink, Pencil, Plus, Check, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaperDetailModalProps {
  selectedPaper: Paper | null;
  setSelectedPaper: (p: Paper | null) => void;
  themes: Theme[];
  editingField: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  startEdit: (field: string, value: string) => void;
  cancelEdit: () => void;
  saveEdit: () => void;
  getThemeName: (id: string) => string;
  removeThemeFromPaper: (paperId: string, themeId: string) => void;
  addThemeToPaper: (paperId: string, themeId: string) => void;
  themeDropdownOpen: boolean;
  setThemeDropdownOpen: (v: boolean) => void;
  newThemeOpen: boolean;
  setNewThemeOpen: (v: boolean) => void;
  newThemeInput: string;
  setNewThemeInput: (v: string) => void;
  addNewTheme: (name: string, parentId?: string | null) => boolean;
  allTags: string[];
  removeTagFromPaper: (paperId: string, tag: string) => void;
  addTagToPaper: (paperId: string, tag: string) => void;
  tagDropdownOpen: boolean;
  setTagDropdownOpen: (v: boolean) => void;
  newTagOpen: boolean;
  setNewTagOpen: (v: boolean) => void;
  newTagInput: string;
  setNewTagInput: (v: string) => void;
  addNewTag: (name: string) => void;
  updatePaper: (id: string, updates: Partial<Paper>) => void;
  openExclusionDialog: (paperId: string) => void;
  openScreeningDialog: (paperId: string) => void;
  isArchived: boolean;
}

export default function PaperDetailModal(props: PaperDetailModalProps) {
  const {
    selectedPaper,
    setSelectedPaper,
    themes,
    editingField,
    editValue,
    setEditValue,
    startEdit,
    cancelEdit,
    saveEdit,
    getThemeName,
    removeThemeFromPaper,
    addThemeToPaper,
    themeDropdownOpen,
    setThemeDropdownOpen,
    newThemeOpen,
    setNewThemeOpen,
    newThemeInput,
    setNewThemeInput,
    addNewTheme,
    allTags,
    removeTagFromPaper,
    addTagToPaper,
    tagDropdownOpen,
    setTagDropdownOpen,
    newTagOpen,
    setNewTagOpen,
    newTagInput,
    setNewTagInput,
    addNewTag,
    updatePaper,
    openExclusionDialog,
    openScreeningDialog,
    isArchived,
  } = props;

  return (
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
                          <button data-testid="edit-abstract" onClick={() => startEdit('abstract', selectedPaper.abstract)} className="shrink-0 p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors self-start"><Pencil className="w-4 h-4" /></button>
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
                            <button data-testid="edit-journal" onClick={() => startEdit('journal', selectedPaper.journal)} className="shrink-0 p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" /></button>
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
                            className={`w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${t.parentId ? 'pl-6' : ''
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
                            const created = addNewTheme(newThemeInput);
                            if (created) addThemeToPaper(selectedPaper.id, newThemeInput.trim());
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
                            const created = addNewTheme(newThemeInput);
                            if (created) addThemeToPaper(selectedPaper.id, newThemeInput.trim());
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

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-500">Review Status:</span>
                {(['included', 'excluded', 'unreviewed'] as const).map(status => (
                  <button
                    key={status}
                    disabled={isArchived}
                    onClick={() => {
                      if (isArchived) return;
                      if (status === 'excluded') {
                        openExclusionDialog(selectedPaper.id);
                        return;
                      }
                      updatePaper(selectedPaper.id, { reviewStatus: status });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedPaper.reviewStatus === status
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
                  disabled={isArchived}
                  onClick={() => !isArchived && openScreeningDialog(selectedPaper.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
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
  );
}
