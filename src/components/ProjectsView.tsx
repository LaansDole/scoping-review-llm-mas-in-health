import React from 'react';
import {
  FlaskConical,
  ClipboardList,
  Pencil,
  Plus,
  Archive,
  FolderOpen,
  Clock,
  ArchiveRestore,
} from 'lucide-react';
import type { ResearchProject } from '../types';
import { getProjectPaperCount } from '../stores/projectStore';

interface ProjectsViewProps {
  projectIndex: ResearchProject[];
  newProjectName: string;
  setNewProjectName: (name: string) => void;
  onProjectCreate: () => void;
  onProjectOpen: (projectId: string) => void;
  handleArchiveProject: (id: string) => void;
  handleRestoreProject: (id: string) => void;
  renamingProjectId: string | null;
  setRenamingProjectId: (id: string | null) => void;
  renameProjectValue: string;
  setRenameProjectValue: (val: string) => void;
  handleRenameProject: (id: string, name: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export function ProjectsView({
  projectIndex,
  newProjectName,
  setNewProjectName,
  onProjectCreate,
  onProjectOpen,
  handleArchiveProject,
  handleRestoreProject,
  renamingProjectId,
  setRenamingProjectId,
  renameProjectValue,
  setRenameProjectValue,
  handleRenameProject,
  showArchived,
  setShowArchived,
}: ProjectsViewProps) {
  const activeProjects = projectIndex.filter(p => !p.archived);
  const archivedProjects = projectIndex.filter(p => p.archived);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-indigo-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 border-l-2 border-slate-200 pl-3">
              Full-text Review <span className="font-normal text-slate-500">Explorer</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Research Projects</h2>
          <p className="text-slate-500">Create a new project or continue working on an existing one.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">New Project</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter project name..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onProjectCreate()}
            />
            <button
              onClick={onProjectCreate}
              disabled={!newProjectName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </div>

        {activeProjects.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Active Projects</h3>
            <div className="space-y-3">
              {activeProjects.map(project => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => {
                    if (renamingProjectId === project.id) return;
                    onProjectOpen(project.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        {renamingProjectId === project.id ? (
                          <input
                            type="text"
                            className="text-base font-semibold text-slate-900 bg-indigo-50 border border-indigo-300 rounded px-2 py-0.5 flex-1 min-w-0 focus:ring-2 focus:ring-indigo-500"
                            value={renameProjectValue}
                            onChange={(e) => setRenameProjectValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameProject(project.id, renameProjectValue);
                              if (e.key === 'Escape') setRenamingProjectId(null);
                            }}
                            onBlur={() => handleRenameProject(project.id, renameProjectValue)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <h4 className="text-base font-semibold text-slate-900 truncate">{project.name}</h4>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 ml-8 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="w-3.5 h-3.5" />
                          {getProjectPaperCount(project.id)} papers
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {project.lastOpened
                            ? `Last opened ${new Date(project.lastOpened).toLocaleDateString()}`
                            : `Created ${new Date(project.createdAt).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingProjectId(project.id);
                          setRenameProjectValue(project.name);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Rename project"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Rename
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleArchiveProject(project.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Archive project"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {archivedProjects.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(prev => !prev)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4"
            >
              <Archive className="w-4 h-4" />
              Archived Projects ({archivedProjects.length})
              <span className="text-xs">{showArchived ? '-' : '+'}</span>
            </button>
            {showArchived && (
              <div className="space-y-3">
                {archivedProjects.map(project => (
                  <div
                    key={project.id}
                    className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all cursor-pointer opacity-75 hover:opacity-100"
                    onClick={() => onProjectOpen(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <Archive className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <h4 className="text-base font-semibold text-slate-600 truncate">{project.name}</h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">Archived</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 ml-8 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <ClipboardList className="w-3.5 h-3.5" />
                            {getProjectPaperCount(project.id)} papers
                          </span>
                          <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestoreProject(project.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Restore project"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {projectIndex.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No projects yet. Create your first research project above.</p>
          </div>
        )}
      </main>
    </div>
  );
}
