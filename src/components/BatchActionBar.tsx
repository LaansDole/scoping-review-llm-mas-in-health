import React from 'react';
import { Tag, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Paper } from '../types';

interface BatchActionBarProps {
  multiSelectMode: boolean;
  selectedPaperIds: Set<string>;
  setSelectedPaperIds: (ids: Set<string>) => void;
  setLastClickedIndex: (idx: number | null) => void;
  filteredPapers: Paper[];
  allTags: string[];
  batchAddTag: (paperIds: string[], tag: string) => void;
  batchRemoveTag: (paperIds: string[], tag: string) => void;
  addNewTag: (name: string) => void;
  batchTagDropdownOpen: boolean;
  setBatchTagDropdownOpen: (v: boolean) => void;
  batchRemoveDropdownOpen: boolean;
  setBatchRemoveDropdownOpen: (v: boolean) => void;
  batchNewTagInput: string;
  setBatchNewTagInput: (v: string) => void;
  papers: Paper[];
}

const BatchActionBar: React.FC<BatchActionBarProps> = ({
  multiSelectMode,
  selectedPaperIds,
  setSelectedPaperIds,
  setLastClickedIndex,
  filteredPapers,
  allTags,
  batchAddTag,
  batchRemoveTag,
  addNewTag,
  batchTagDropdownOpen,
  setBatchTagDropdownOpen,
  batchRemoveDropdownOpen,
  setBatchRemoveDropdownOpen,
  batchNewTagInput,
  setBatchNewTagInput,
  papers,
}) => {
  return (
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
  );
};

export default BatchActionBar;
