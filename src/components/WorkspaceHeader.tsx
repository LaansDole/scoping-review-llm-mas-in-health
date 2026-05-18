import React from 'react';
import {
  Search,
  FlaskConical,
  Pencil,
  Download,
  Upload,
  MessageSquare,
  Home,
} from 'lucide-react';

interface WorkspaceHeaderProps {
  activeProjectId: string | null;
  activeProjectName: string | null;
  renamingHeader: boolean;
  setRenamingHeader: (v: boolean) => void;
  renameHeaderValue: string;
  setRenameHeaderValue: (v: string) => void;
  handleRenameProject: (id: string, name: string) => void;
  goToProjects: () => void;
  isArchived: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  chatOpen: boolean;
  setChatOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  handleExport: () => void;
  papersCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importMsg: string | null;
}

export default function WorkspaceHeader({
  activeProjectId,
  activeProjectName,
  renamingHeader,
  setRenamingHeader,
  renameHeaderValue,
  setRenameHeaderValue,
  handleRenameProject,
  goToProjects,
  isArchived,
  searchQuery,
  setSearchQuery,
  chatOpen,
  setChatOpen,
  handleExport,
  papersCount,
  fileInputRef,
  handleFileImport,
  importMsg,
}: WorkspaceHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToProjects}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
            title="Back to projects"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="bg-indigo-600 p-2 rounded-lg">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 border-l-2 border-slate-200 pl-3 flex items-center gap-2">
            {renamingHeader ? (
              <input
                type="text"
                className="text-xl font-bold text-slate-900 bg-indigo-50 border border-indigo-300 rounded px-2 py-0.5 focus:ring-2 focus:ring-indigo-500"
                value={renameHeaderValue}
                onChange={(e) => setRenameHeaderValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameProject(activeProjectId!, renameHeaderValue);
                  if (e.key === 'Escape') setRenamingHeader(false);
                }}
                onBlur={() => handleRenameProject(activeProjectId!, renameHeaderValue)}
                autoFocus
              />
            ) : (
              <>
                {activeProjectName ?? 'Project'}
                <button
                  onClick={() => {
                    setRenamingHeader(true);
                    setRenameHeaderValue(activeProjectName ?? '');
                  }}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Rename project"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
            <span className="font-normal text-slate-500">Explorer</span>
          </h1>
          {isArchived && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Archived (Read-only)</span>
          )}
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
            onClick={handleExport}
            disabled={papersCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {!isArchived && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          )}
        </div>
      </div>
      {importMsg && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm font-medium ${importMsg.startsWith('Error') ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
          {importMsg}
        </div>
      )}
    </header>
  );
}
