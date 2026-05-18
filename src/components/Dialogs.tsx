import React from 'react';
import type { Paper, Theme } from '../types';
import { EXCLUSION_REASONS } from '../hooks/usePaperState';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DialogsProps {
  pendingExclusionId: string | null;
  cancelExclusion: () => void;
  confirmExclusion: () => void;
  selectedReasons: Set<string>;
  toggleReason: (reason: string) => void;
  customReason: string;
  setCustomReason: (v: string) => void;
  pendingScreeningId: string | null;
  papers: Paper[];
  cancelScreening: () => void;
  confirmScreening: (onMessage?: (msg: string) => void) => void;
  onScreeningMessage: (msg: string) => void;
  pendingDeleteThemeId: string | null;
  setPendingDeleteThemeId: (id: string | null) => void;
  themes: Theme[];
  deleteTheme: (id: string) => void;
  papersForThemeCount: Paper[];
  pendingDeleteTagName: string | null;
  setPendingDeleteTagName: (name: string | null) => void;
  deleteTag: (name: string) => void;
  papersForTagCount: Paper[];
}

export default function Dialogs({
  pendingExclusionId,
  cancelExclusion,
  confirmExclusion,
  selectedReasons,
  toggleReason,
  customReason,
  setCustomReason,
  pendingScreeningId,
  papers,
  cancelScreening,
  confirmScreening,
  onScreeningMessage,
  pendingDeleteThemeId,
  setPendingDeleteThemeId,
  themes,
  deleteTheme,
  papersForThemeCount,
  pendingDeleteTagName,
  setPendingDeleteTagName,
  deleteTag,
  papersForTagCount,
}: DialogsProps) {
  return (
    <>
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${selectedReasons.has(reason)
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
                    onClick={() => confirmScreening(onScreeningMessage)}
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

      <AnimatePresence>
        {pendingDeleteTagName && (() => {
          const affectedCount = papers.filter(p => p.tags.includes(pendingDeleteTagName)).length;
          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPendingDeleteTagName(null)}
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
                  <h3 className="text-lg font-bold text-slate-900">Delete Tag</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Delete tag <span className="font-semibold">"{pendingDeleteTagName}"</span> from all papers?
                  This will remove it from {affectedCount} paper{affectedCount !== 1 ? 's' : ''}.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setPendingDeleteTagName(null)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteTag(pendingDeleteTagName)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Delete Tag
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
