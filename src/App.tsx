import React, { useCallback } from 'react';
import { useProjectState } from './hooks/useProjectState';
import { usePaperState } from './hooks/usePaperState';
import { useChatState } from './hooks/useChatState';
import { ProjectsView } from './components/ProjectsView';
import WorkspaceHeader from './components/WorkspaceHeader';
import Sidebar from './components/Sidebar';
import PaperGrid from './components/PaperGrid';
import PaperDetailModal from './components/PaperDetailModal';
import ChatPanel from './components/ChatPanel';
import Dialogs from './components/Dialogs';
import BatchActionBar from './components/BatchActionBar';

function applyProjectData(
  data: { papers: import('./types').Paper[]; themes: import('./types').Theme[]; tags: string[] } | null,
  ps: ReturnType<typeof usePaperState>,
) {
  if (!data) return;
  ps.setPapers(data.papers);
  ps.setThemes(data.themes);
  ps.setAllTags(data.tags);
  ps.setSelectedTheme(null);
  ps.setSearchQuery('');
  ps.setSelectedPaper(null);
  ps.setViewMode('all');
  ps.setSelectedPaperIds(new Set());
  ps.setLastClickedIndex(null);
}

export default function App() {
  const project = useProjectState();
  const paper = usePaperState(project.activeProjectId);
  const chat = useChatState();

  const handleProjectOpen = useCallback((projectId: string) => {
    const data = project.openProject(projectId);
    applyProjectData(data, paper);
  }, [project, paper]);

  const handleProjectCreate = useCallback(() => {
    const data = project.handleCreateProject();
    applyProjectData(data, paper);
  }, [project, paper]);

  const handleFileImportWrapper = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await project.handleFileImport(file, paper.papers, paper.themes);
    if ('papers' in result) {
      paper.setPapers(result.papers);
      paper.setThemes(result.themes);
      paper.setAllTags(result.tags);
    }
  }, [project, paper]);

  const handleExportWrapper = useCallback(() => {
    project.handleExport(paper.papers, paper.themes);
  }, [project, paper]);

  const handleScreeningMessage = useCallback((msg: string) => {
    project.setImportMsg(msg);
    setTimeout(() => project.setImportMsg(null), 5000);
  }, [project]);

  if (project.initialProjectData) {
    applyProjectData(project.initialProjectData, paper);
    project.clearInitialProjectData();
  }

  if (project.currentView === 'projects') {
    return (
      <ProjectsView
        projectIndex={project.projectIndex}
        newProjectName={project.newProjectName}
        setNewProjectName={project.setNewProjectName}
        onProjectCreate={handleProjectCreate}
        onProjectOpen={handleProjectOpen}
        handleArchiveProject={project.handleArchiveProject}
        handleRestoreProject={project.handleRestoreProject}
        renamingProjectId={project.renamingProjectId}
        setRenamingProjectId={project.setRenamingProjectId}
        renameProjectValue={project.renameProjectValue}
        setRenameProjectValue={project.setRenameProjectValue}
        handleRenameProject={project.handleRenameProject}
        showArchived={project.showArchived}
        setShowArchived={project.setShowArchived}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-indigo-100">
      <WorkspaceHeader
        activeProjectId={project.activeProjectId}
        activeProjectName={project.activeProject?.name ?? null}
        renamingHeader={project.renamingHeader}
        setRenamingHeader={project.setRenamingHeader}
        renameHeaderValue={project.renameHeaderValue}
        setRenameHeaderValue={project.setRenameHeaderValue}
        handleRenameProject={project.handleRenameProject}
        goToProjects={project.goToProjects}
        isArchived={project.isArchived}
        searchQuery={paper.searchQuery}
        setSearchQuery={paper.setSearchQuery}
        chatOpen={chat.chatOpen}
        setChatOpen={chat.setChatOpen}
        handleExport={handleExportWrapper}
        papersCount={paper.papers.length}
        fileInputRef={project.fileInputRef}
        handleFileImport={handleFileImportWrapper}
        importMsg={project.importMsg}
      />

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${paper.multiSelectMode && paper.selectedPaperIds.size > 0 ? 'pb-24' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Sidebar
            viewMode={paper.viewMode}
            setViewMode={paper.setViewMode}
            themes={paper.themes}
            selectedTheme={paper.selectedTheme}
            setSelectedTheme={paper.setSelectedTheme}
            papers={paper.papers}
            editingThemeId={paper.editingThemeId}
            setEditingThemeId={paper.setEditingThemeId}
            editingThemeValue={paper.editingThemeValue}
            setEditingThemeValue={paper.setEditingThemeValue}
            renameTheme={paper.renameTheme}
            addingSubThemeParentId={paper.addingSubThemeParentId}
            setAddingSubThemeParentId={paper.setAddingSubThemeParentId}
            subThemeInput={paper.subThemeInput}
            setSubThemeInput={paper.setSubThemeInput}
            addNewTheme={paper.addNewTheme}
            pendingDeleteThemeId={paper.pendingDeleteThemeId}
            setPendingDeleteThemeId={paper.setPendingDeleteThemeId}
            addingTopTheme={paper.addingTopTheme}
            setAddingTopTheme={paper.setAddingTopTheme}
            topThemeInput={paper.topThemeInput}
            setTopThemeInput={paper.setTopThemeInput}
            allTags={paper.allTags}
            selectedTag={paper.selectedTag}
            setSelectedTag={paper.setSelectedTag}
            editingTagName={paper.editingTagName}
            setEditingTagName={paper.setEditingTagName}
            editingTagValue={paper.editingTagValue}
            setEditingTagValue={paper.setEditingTagValue}
            renameTag={paper.renameTag}
            pendingDeleteTagName={paper.pendingDeleteTagName}
            setPendingDeleteTagName={paper.setPendingDeleteTagName}
            isArchived={project.isArchived}
            reviewStatusFilter={paper.reviewStatusFilter}
            setReviewStatusFilter={paper.setReviewStatusFilter}
            statusCounts={paper.statusCounts}
            getThemeName={paper.getThemeName}
          />
          <PaperGrid
            viewMode={paper.viewMode}
            selectedTheme={paper.selectedTheme}
            reviewStatusFilter={paper.reviewStatusFilter}
            filteredPapers={paper.filteredPapers}
            selectedPaperIds={paper.selectedPaperIds}
            setSelectedPaperIds={paper.setSelectedPaperIds}
            lastClickedIndex={paper.lastClickedIndex}
            setLastClickedIndex={paper.setLastClickedIndex}
            multiSelectMode={paper.multiSelectMode}
            setMultiSelectMode={paper.setMultiSelectMode}
            setSelectedPaper={paper.setSelectedPaper}
            cycleStatus={paper.cycleStatus}
            getThemeName={paper.getThemeName}
            openExclusionDialog={paper.openExclusionDialog}
          />
        </div>
      </main>

      <PaperDetailModal
        selectedPaper={paper.selectedPaper}
        setSelectedPaper={paper.setSelectedPaper}
        themes={paper.themes}
        editingField={paper.editingField}
        editValue={paper.editValue}
        setEditValue={paper.setEditValue}
        startEdit={paper.startEdit}
        cancelEdit={paper.cancelEdit}
        saveEdit={paper.saveEdit}
        getThemeName={paper.getThemeName}
        removeThemeFromPaper={paper.removeThemeFromPaper}
        addThemeToPaper={paper.addThemeToPaper}
        themeDropdownOpen={paper.themeDropdownOpen}
        setThemeDropdownOpen={paper.setThemeDropdownOpen}
        newThemeOpen={paper.newThemeOpen}
        setNewThemeOpen={paper.setNewThemeOpen}
        newThemeInput={paper.newThemeInput}
        setNewThemeInput={paper.setNewThemeInput}
        addNewTheme={paper.addNewTheme}
        allTags={paper.allTags}
        removeTagFromPaper={paper.removeTagFromPaper}
        addTagToPaper={paper.addTagToPaper}
        tagDropdownOpen={paper.tagDropdownOpen}
        setTagDropdownOpen={paper.setTagDropdownOpen}
        newTagOpen={paper.newTagOpen}
        setNewTagOpen={paper.setNewTagOpen}
        newTagInput={paper.newTagInput}
        setNewTagInput={paper.setNewTagInput}
        addNewTag={paper.addNewTag}
        updatePaper={paper.updatePaper}
        openExclusionDialog={paper.openExclusionDialog}
        openScreeningDialog={paper.openScreeningDialog}
        isArchived={project.isArchived}
      />

      <Dialogs
        pendingExclusionId={paper.pendingExclusionId}
        cancelExclusion={paper.cancelExclusion}
        confirmExclusion={paper.confirmExclusion}
        selectedReasons={paper.selectedReasons}
        toggleReason={paper.toggleReason}
        customReason={paper.customReason}
        setCustomReason={paper.setCustomReason}
        pendingScreeningId={paper.pendingScreeningId}
        papers={paper.papers}
        cancelScreening={paper.cancelScreening}
        confirmScreening={paper.confirmScreening}
        onScreeningMessage={handleScreeningMessage}
        pendingDeleteThemeId={paper.pendingDeleteThemeId}
        setPendingDeleteThemeId={paper.setPendingDeleteThemeId}
        themes={paper.themes}
        deleteTheme={paper.deleteTheme}
        papersForThemeCount={paper.papers}
        pendingDeleteTagName={paper.pendingDeleteTagName}
        setPendingDeleteTagName={paper.setPendingDeleteTagName}
        deleteTag={paper.deleteTag}
        papersForTagCount={paper.papers}
      />

      <BatchActionBar
        multiSelectMode={paper.multiSelectMode}
        selectedPaperIds={paper.selectedPaperIds}
        setSelectedPaperIds={paper.setSelectedPaperIds}
        setLastClickedIndex={paper.setLastClickedIndex}
        filteredPapers={paper.filteredPapers}
        allTags={paper.allTags}
        batchAddTag={paper.batchAddTag}
        batchRemoveTag={paper.batchRemoveTag}
        addNewTag={paper.addNewTag}
        batchTagDropdownOpen={paper.batchTagDropdownOpen}
        setBatchTagDropdownOpen={paper.setBatchTagDropdownOpen}
        batchRemoveDropdownOpen={paper.batchRemoveDropdownOpen}
        setBatchRemoveDropdownOpen={paper.setBatchRemoveDropdownOpen}
        batchNewTagInput={paper.batchNewTagInput}
        setBatchNewTagInput={paper.setBatchNewTagInput}
        papers={paper.papers}
      />

      {chat.chatOpen && (
        <ChatPanel
          chatOpen={chat.chatOpen}
          setChatOpen={chat.setChatOpen}
          chatMessages={chat.chatMessages}
          chatInput={chat.chatInput}
          setChatInput={chat.setChatInput}
          isStreaming={chat.isStreaming}
          chatSettingsOpen={chat.chatSettingsOpen}
          setChatSettingsOpen={chat.setChatSettingsOpen}
          chatConfig={chat.chatConfig}
          setChatConfig={chat.setChatConfig}
          chatPanelSize={chat.chatPanelSize}
          setChatPanelSize={chat.setChatPanelSize}
          chatMessagesEndRef={chat.chatMessagesEndRef}
          handleChatSend={chat.handleChatSend}
          papers={paper.papers}
          themes={paper.themes}
          paperMap={paper.paperMap}
          getThemeName={paper.getThemeName}
          setSelectedPaper={paper.setSelectedPaper}
        />
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100/50 blur-3xl rounded-full" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-50/50 blur-3xl rounded-full" />
      </div>
    </div>
  );
}
