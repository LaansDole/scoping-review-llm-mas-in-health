/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FlaskConical, 
  Stethoscope, 
  Database, 
  Users, 
  ArrowRight, 
  ExternalLink, 
  Filter,
  CheckCircle2,
  Info,
  Layers,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { PAPERS, THEMES, Paper } from './data';

export default function App() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const filteredPapers = useMemo(() => {
    return PAPERS.filter(paper => {
      const matchesTheme = !selectedTheme || paper.themes.includes(selectedTheme);
      const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTheme && matchesSearch;
    });
  }, [selectedTheme, searchQuery]);

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
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
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
                {THEMES.map((theme) => (
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
                      <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                        {paper.journal} • {paper.year}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
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
                  <div className="flex flex-wrap gap-2">
                    {selectedPaper.themes.map(t => (
                      <div key={t} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
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

