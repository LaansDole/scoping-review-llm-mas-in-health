import React from 'react';
import { Filter, Pencil, Plus, Trash2, Check, X, Tag, ClipboardList, CircleDot, Ban, Layers } from 'lucide-react';
import type { Theme, ReviewStatus, Paper } from '../types';

interface SidebarProps {
  viewMode: 'all' | 'review';
  setViewMode: (v: 'all' | 'review') => void;
  themes: Theme[];
  selectedTheme: string | null;
  setSelectedTheme: (id: string | null) => void;
  papers: Paper[];
  editingThemeId: string | null;
  setEditingThemeId: (id: string | null) => void;
  editingThemeValue: string;
  setEditingThemeValue: (v: string) => void;
  renameTheme: (id: string, name: string) => boolean;
  addingSubThemeParentId: string | null;
  setAddingSubThemeParentId: (id: string | null) => void;
  subThemeInput: string;
  setSubThemeInput: (v: string) => void;
  addNewTheme: (name: string, parentId?: string | null) => boolean;
  pendingDeleteThemeId: string | null;
  setPendingDeleteThemeId: (id: string | null) => void;
  addingTopTheme: boolean;
  setAddingTopTheme: (v: boolean) => void;
  topThemeInput: string;
  setTopThemeInput: (v: string) => void;
  allTags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  editingTagName: string | null;
  setEditingTagName: (name: string | null) => void;
  editingTagValue: string;
  setEditingTagValue: (v: string) => void;
  renameTag: (oldName: string, newName: string) => void;
  pendingDeleteTagName: string | null;
  setPendingDeleteTagName: (name: string | null) => void;
  isArchived: boolean;
  reviewStatusFilter: ReviewStatus;
  setReviewStatusFilter: (v: ReviewStatus) => void;
  statusCounts: { all: number; included: number; excluded: number; unreviewed: number };
  getThemeName: (id: string) => string;
}

export default function Sidebar(props: SidebarProps) {
  const {
    viewMode,
    setViewMode,
    themes,
    selectedTheme,
    setSelectedTheme,
    papers,
    editingThemeId,
    setEditingThemeId,
    editingThemeValue,
    setEditingThemeValue,
    renameTheme,
    addingSubThemeParentId,
    setAddingSubThemeParentId,
    subThemeInput,
    setSubThemeInput,
    addNewTheme,
    pendingDeleteThemeId,
    setPendingDeleteThemeId,
    addingTopTheme,
    setAddingTopTheme,
    topThemeInput,
    setTopThemeInput,
    allTags,
    selectedTag,
    setSelectedTag,
    editingTagName,
    setEditingTagName,
    editingTagValue,
    setEditingTagValue,
    renameTag,
    pendingDeleteTagName,
    setPendingDeleteTagName,
    isArchived,
    reviewStatusFilter,
    setReviewStatusFilter,
    statusCounts,
    getThemeName,
  } = props;

  return (
    <aside className="lg:col-span-1 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Navigation
        </h2>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All Papers
          </button>
          <button
            onClick={() => setViewMode('review')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'review' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Full-Text Review
          </button>
        </div>
      </div>

      {viewMode === 'all' && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Research Themes
          </h2>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedTheme(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedTheme ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
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
                        className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors border-l-4 ${selectedTheme === parent.id
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
                          className={`flex-1 text-left px-3 py-1.5 rounded-lg text-xs transition-colors border-l-4 ${selectedTheme === child.id
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

      {viewMode === 'all' && allTags.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tags
          </h2>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedTag ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <div key={tag} className="group/tag relative">
                {editingTagName === tag ? (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      type="text"
                      className="flex-1 text-sm bg-white border border-indigo-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                      value={editingTagValue}
                      onChange={(e) => setEditingTagValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameTag(tag, editingTagValue);
                        if (e.key === 'Escape') setEditingTagName(null);
                      }}
                      onBlur={() => renameTag(tag, editingTagValue)}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedTag(tag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedTag === tag
                        ? 'bg-amber-50 text-amber-700 font-medium border-l-4 border-amber-600 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 border-l-4 border-transparent'
                      }`}
                  >
                    <span className="truncate">{tag}</span>
                    <span className="text-xs text-slate-400 ml-2">{papers.filter(p => p.tags.includes(tag)).length}</span>
                  </button>
                )}
                {!isArchived && editingTagName !== tag && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/tag:flex items-center gap-0.5 bg-white rounded shadow-sm border border-slate-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTagName(tag);
                        setEditingTagValue(tag);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                      title="Rename tag"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteTagName(tag);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Delete tag"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${reviewStatusFilter === key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
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
  );
}
