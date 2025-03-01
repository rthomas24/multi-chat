"use client";

import { useState } from 'react';
import { messageQueue } from '@/utils/messageQueue';
import styles from './ChatInput.module.css';
import { ModelStatus } from '@/types/Status';

interface ChatInputProps {
  activeModels: {
    id: string;
    provider: string;
    modelName: string;
    status: ModelStatus;
  }[];
  onMessageSent: (message: string, webSearch?: boolean) => void;
}

export default function ChatInput({ activeModels, onMessageSent }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add message to queue for all active models
    const queueItems = activeModels
      .filter(model => model.status === ModelStatus.ACTIVE)
      .map(model => ({
        id: model.id,
        provider: model.provider,
        modelName: model.modelName,
        prompt: input,
        webSearch: webSearchEnabled // Pass the web search flag
      }));

    messageQueue.addToQueue(queueItems);
    onMessageSent(input, webSearchEnabled); // Pass the web search flag to the callback
    setInput('');
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      <input 
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything..."
        className={styles.input}
      />
      
      <div className={styles.inputToolbar}>
        <div className={styles.toolbarIcons}>
          <button 
            type="button"
            className={`${styles.toolbarIcon} ${webSearchEnabled ? styles.toolbarIconActive : ''}`}
            onClick={toggleWebSearch}
            title={webSearchEnabled ? "Disable web search" : "Enable web search"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </button>
          
          <button 
            type="button"
            className={styles.toolbarIcon}
            title="Add Tools"
          >
            <span className={styles.addToolsText}>Add Tools</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        
        <div className={styles.inputActions}>
          <button type="submit" className={styles.sendButton}>
            Send
          </button>
        </div>
      </div>
    </form>
  );
} 