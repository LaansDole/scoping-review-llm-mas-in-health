import React from 'react';
import { Search, ArrowRight, Check, Ban, CircleDot, ListChecks, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Paper, ReviewStatus } from '../types';

interface PaperGridProps {
  viewMode: 'all' | 'review';
  selectedTheme: string | null;
  reviewStatusFilter: ReviewStatus;
  filteredPapers: Paper[];
  selectedPaperIds: Set<string>;
  setSelectedPaperIds: (ids: Set<string>) => void;
  lastClickedIndex: number | null;
  setLastClickedIndex: (idx: number | null) => void;
  multiSelectMode: boolean;
  setMultiSelectMode: (v: boolean) => void;
  setSelectedPaper: (paper: Paper | null) => void;
  cycleStatus: (id: string, current: ReviewStatus) => void;
  getThemeName: (id: string) => string;
  openExclusionDialog: (paperId: string) => void;
}

const PaperGrid: React.FC<PaperGridProps> = ({
  viewMode,
  selectedTheme,
  reviewStatusFilter,
  filteredPapers,
  selectedPaperIds,
  setSelectedPaperIds,
  lastClickedIndex,
  setLastClickedIndex,
  multiSelectMode,
  setMultiSelectMode,
  setSelectedPaper,
  cycleStatus,
  getThemeName,
  openExclusionDialog,
}) => {
  return (
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
            setMultiSelectMode(!multiSelectMode);
            setSelectedPaperIds(new Set());
            setLastClickedIndex(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${multiSelectMode
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
                className={`group bg-white p-6 rounded-2xl border transition-all cursor-pointer flex flex-col h-full relative ${isSelected
                    ? 'border-indigo-500 bg-indigo-50/30 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5'
                  }`}
              >
                {multiSelectMode && (
                  <button
                  data-testid={`card-checkbox-${paper.id}`}
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
                  </button>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                      {paper.journal} &bull; {paper.year}
                    </div>
                    {paper.reviewStatus !== 'unreviewed' && (
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${paper.reviewStatus === 'included' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {paper.reviewStatus}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      data-testid={`status-cycle-${paper.id}`}
                      onClick={(e) => { e.stopPropagation(); cycleStatus(paper.id, paper.reviewStatus); }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${paper.reviewStatus === 'included' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' :
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
  );
};

export default PaperGrid;
