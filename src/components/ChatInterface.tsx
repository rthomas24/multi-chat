"use client";

import { useState, useEffect } from 'react';
import styles from './ChatInterface.module.css';
import { ModelStatus } from '@/types/Status';
import Modal from './Modal';
import ApiKeyForm from './ApiKeyForm';

interface ChatInterfaceProps {
  id: string;
  modelName: string;
  provider: string;
  description: string;
  messages?: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  initialStatus?: ModelStatus;
  onStatusChange?: (status: ModelStatus) => void;
  onDelete?: () => void;
  onMessagesUpdate?: (messages: { role: 'user' | 'assistant'; content: string }[]) => void;
  onModelChange?: (modelName: string) => void;
  providersData: any;
}

export default function ChatInterface({ 
  id,
  modelName, 
  provider, 
  description,
  messages = [],
  initialStatus = ModelStatus.READY,
  onStatusChange,
  onDelete,
  onMessagesUpdate,
  onModelChange,
  providersData
}: ChatInterfaceProps) {
  const [status, setStatus] = useState<ModelStatus>(initialStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleModelResponse = (event: CustomEvent<{ id: string; content: string; error?: string }>) => {
      if (event.detail.id === id) {
        if (event.detail.error) {
          // Handle error
          return;
        }
        onMessagesUpdate?.([
          ...messages,
          { role: 'assistant', content: event.detail.content }
        ]);
      }
    };

    window.addEventListener('model-response', handleModelResponse as EventListener);
    return () => {
      window.removeEventListener('model-response', handleModelResponse as EventListener);
    };
  }, [id, messages, onMessagesUpdate]);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === ModelStatus.INACTIVE) return;
    
    const newStatus = status === ModelStatus.READY ? ModelStatus.ACTIVE : ModelStatus.READY;
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const handleApiKeySave = () => {
    setIsModalOpen(false);
    // You might want to trigger a refresh or status update here
  };

  return (
    <>
      <div className={`${styles.container} ${styles[status]}`}>
        <div className={styles.header}>
          <button 
            className={styles.deleteButton}
            onClick={onDelete}
            aria-label="Remove chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div className={styles.modelSelector}>
            <select 
              value={modelName}
              onChange={(e) => onModelChange?.(e.target.value)}
              className={styles.modelSelect}
            >
              {providersData[provider].models.map((model: string) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <div className={styles.providerInfo}>
              <span className={styles.provider}>{provider}</span>
              <img 
                src={providersData[provider].logo} 
                alt={`${provider} logo`}
                className={styles.providerLogo}
              />
            </div>
          </div>

          <button 
            className={`${styles.statusButton} ${styles[`status_${status}`]}`}
            onClick={handleStatusClick}
            disabled={status === ModelStatus.INACTIVE}
          >
            <span className={styles.statusDot} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        </div>
        
        <p className={styles.description}>{description}</p>
        
        <div className={styles.messages}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${styles[message.role]}`}
            >
              <div className={styles.messageContent}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ApiKeyForm 
          modelName={modelName}
          onSave={handleApiKeySave}
        />
      </Modal>
    </>
  );
} 