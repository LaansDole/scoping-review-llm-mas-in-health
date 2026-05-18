import { useState, useRef, useCallback, useEffect } from 'react';
import type { Paper, Theme, ChatConfig, ChatMessage } from '../types';
import { loadChatConfig, saveChatConfig, buildSystemPrompt, streamChatCompletion } from '../services/chatApi';

export type UseChatStateReturn = {
  chatOpen: boolean;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  isStreaming: boolean;
  chatSettingsOpen: boolean;
  setChatSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatConfig: ChatConfig;
  setChatConfig: React.Dispatch<React.SetStateAction<ChatConfig>>;
  chatPanelSize: "compact" | "expanded" | "full";
  setChatPanelSize: React.Dispatch<React.SetStateAction<"compact" | "expanded" | "full">>;
  chatMessagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleChatSend: (messageText: string, papers: Paper[], themes: Theme[]) => Promise<void>;
};

export function useChatState(): UseChatStateReturn {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig>(loadChatConfig);
  const [chatPanelSize, setChatPanelSize] = useState<"compact" | "expanded" | "full">("compact");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) {
      setChatMessages([]);
      setChatInput("");
      setChatPanelSize("compact");
    }
  }, [chatOpen]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView();
  }, [chatMessages]);

  const handleChatSend = useCallback(async (messageText: string, papers: Paper[], themes: Theme[]) => {
    const text = messageText.trim();
    if (!text || isStreaming) return;
    if (!chatConfig.apiKey) {
      setChatMessages(prev => [...prev,
        { role: "user", content: text, timestamp: Date.now() },
        { role: "assistant", content: "Please configure your API settings first. Click the gear icon in the chat header to set up your API key, base URL, and model.", timestamp: Date.now() },
      ]);
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsStreaming(true);

    const systemMsg: ChatMessage = {
      role: "system",
      content: buildSystemPrompt(papers, themes),
    };
    const apiMessages = [systemMsg, ...updatedMessages];

    let fullResponse = "";
    setChatMessages(prev => [...prev, { role: "assistant", content: "", timestamp: Date.now() }]);

    await streamChatCompletion(
      chatConfig,
      apiMessages,
      (token) => {
        fullResponse += token;
        setChatMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: fullResponse, timestamp: Date.now() };
          return next;
        });
      },
      () => {
        setIsStreaming(false);
      },
      (error) => {
        setChatMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: `Error: ${error}`, timestamp: Date.now() };
          return next;
        });
        setIsStreaming(false);
      }
    );
  }, [chatMessages, chatConfig, isStreaming]);

  return {
    chatOpen,
    setChatOpen,
    chatMessages,
    setChatMessages,
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
  };
}
