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
  onMessageSent: (message: string) => void;
}

export default function ChatInput({ activeModels, onMessageSent }: ChatInputProps) {
  const [input, setInput] = useState('');

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
        prompt: input
      }));

    messageQueue.addToQueue(queueItems);
    onMessageSent(input);
    setInput('');
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
      <div className={styles.inputActions}>
        <button type="submit" className={styles.sendButton}>
          Send
        </button>
      </div>
    </form>
  );
} 