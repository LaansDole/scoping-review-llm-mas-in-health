import React, { Fragment, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, Settings, X, Send, Loader2, Maximize2, Minimize2, ArrowRight } from 'lucide-react';
import { saveChatConfig } from '../services/chatApi';
import type { Paper, Theme, ChatConfig, ChatMessage } from '../types';

interface ChatPanelProps {
  chatOpen: boolean;
  setChatOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isStreaming: boolean;
  chatSettingsOpen: boolean;
  setChatSettingsOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  chatConfig: ChatConfig;
  setChatConfig: (config: ChatConfig) => void;
  chatPanelSize: "compact" | "expanded" | "full";
  setChatPanelSize: (v: "compact" | "expanded" | "full" | ((prev: "compact" | "expanded" | "full") => "compact" | "expanded" | "full")) => void;
  chatMessagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleChatSend: (messageText: string, papers: Paper[], themes: Theme[]) => Promise<void>;
  papers: Paper[];
  themes: Theme[];
  paperMap: Map<string, Paper>;
  getThemeName: (id: string) => string;
  setSelectedPaper: (paper: Paper | null) => void;
}

const PAPER_REF_REGEX = /\{\{paper:([^}]+)\}\}/g;

export default function ChatPanel({
  chatOpen,
  setChatOpen,
  chatMessages,
  chatInput,
  setChatInput,
  isStreaming,
  chatSettingsOpen,
  setChatSettingsOpen,
  chatConfig,
  setChatConfig,
  chatPanelSize,
  setChatPanelSize,
  chatMessagesEndRef,
  handleChatSend,
  papers,
  themes,
  paperMap,
  getThemeName,
  setSelectedPaper,
}: ChatPanelProps) {
  const renderAssistantContent = useCallback((content: string) => {
    const segments: { type: "text" | "paper"; value: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const regex = new RegExp(PAPER_REF_REGEX.source, "g");

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
      }
      segments.push({ type: "paper", value: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      segments.push({ type: "text", value: content.slice(lastIndex) });
    }

    return segments.map((seg, i) => {
      if (seg.type === "paper") {
        const paper = paperMap.get(seg.value);
        if (!paper) return <Fragment key={i}>{`{{paper:${seg.value}}}`}</Fragment>;
        return (
          <button
            key={i}
            onClick={() => setSelectedPaper(paper)}
            className="block w-full text-left my-2 p-3 bg-white border border-indigo-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {paper.title}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-slate-500">{paper.year}</span>
              <span className="text-slate-300">|</span>
              {paper.themes.slice(0, 2).map(tid => (
                <span key={tid} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                  {getThemeName(tid).replace("LLM-based MAS in ", "").replace("LLM-based ", "")}
                </span>
              ))}
            </div>
          </button>
        );
      }

      return (
        <div key={i} className="chat-markdown prose-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{seg.value}</ReactMarkdown>
        </div>
      );
    });
  }, [paperMap, getThemeName, setSelectedPaper]);

  if (!chatOpen) return null;

  return (
    <>
      <div
        onClick={() => setChatOpen(false)}
        className="fixed inset-0 z-[80] bg-slate-900/20 backdrop-blur-sm"
      />
      <div
        className={`fixed top-0 right-0 z-[90] h-full bg-white shadow-2xl flex flex-col transition-all duration-300 ${chatPanelSize === "full" ? "w-full" : chatPanelSize === "expanded" ? "w-full max-w-2xl" : "w-full max-w-md"
          }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Research Chat</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChatPanelSize(prev => prev === "compact" ? "expanded" : prev === "expanded" ? "full" : "compact")}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              title={chatPanelSize === "compact" ? "Expand" : chatPanelSize === "expanded" ? "Full screen" : "Compact"}
            >
              {chatPanelSize === "full" ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setChatSettingsOpen(prev => !prev)}
              className={`p-1.5 rounded-lg transition-colors ${chatSettingsOpen ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"}`}
              title="API Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {chatSettingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-200"
            >
              <div className="p-4 space-y-3 bg-slate-50">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Base URL</label>
                  <input
                    type="text"
                    value={chatConfig.baseUrl}
                    onChange={e => {
                      const next = { ...chatConfig, baseUrl: e.target.value };
                      setChatConfig(next);
                      saveChatConfig(next);
                    }}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://api.deepseek.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">API Key</label>
                  <input
                    type="password"
                    value={chatConfig.apiKey}
                    onChange={e => {
                      const next = { ...chatConfig, apiKey: e.target.value };
                      setChatConfig(next);
                      saveChatConfig(next);
                    }}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Model</label>
                  <input
                    type="text"
                    value={chatConfig.model}
                    onChange={e => {
                      const next = { ...chatConfig, model: e.target.value };
                      setChatConfig(next);
                      saveChatConfig(next);
                    }}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="deepseek-chat"
                  />
                </div>
                <p className="text-[10px] text-slate-400 pt-1">Defaults from .env file. UI overrides are saved in localStorage.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">Ask about papers, themes, or tags</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Find papers about mental health",
                  "What are the main themes?",
                  "Suggest tags for my research",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleChatSend(prompt, papers, themes)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : msg.content.startsWith("Error:")
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-slate-100 text-slate-800"
                  }`}
              >
                {msg.role === "assistant" ? renderAssistantContent(msg.content) : msg.content}
                {msg.role === "assistant" && !msg.content && isStreaming && (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                )}
              </div>
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>

        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSend(chatInput, papers, themes);
                }
              }}
              placeholder="Ask about papers..."
              disabled={isStreaming}
              rows={1}
              className="flex-1 resize-none px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleChatSend(chatInput, papers, themes)}
              disabled={isStreaming || !chatInput.trim()}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
