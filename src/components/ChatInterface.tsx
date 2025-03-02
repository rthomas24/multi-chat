"use client";

import { useState, useRef } from 'react';
import styles from './ChatInterface.module.css';
import { ModelStatus } from '@/types/Status';
import Modal from './Modal';
import ApiKeyForm from './ApiKeyForm';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import { Message } from 'ai';

interface ChatInterfaceProps {
  id: string;
  modelName: string;
  provider: string;
  description: string;
  messages?: Message[];
  initialStatus?: ModelStatus;
  onStatusChange?: (status: ModelStatus) => void;
  onDelete?: () => void;
  providersData: any;
  input?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
}

// Function to format message content with code blocks
const formatMessageContent = (content: string) => {
  // Check if the content contains code blocks with triple backticks
  if (content.includes('```')) {
    // Split by code block markers
    const segments = content.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g);
    
    return (
      <>
        {segments.map((segment, index) => {
          // Check if this segment is a code block
          if (segment.startsWith('```') && segment.endsWith('```')) {
            // Extract language if specified
            let language = 'plaintext';
            let code = segment.slice(3, -3).trim();
            
            const firstLineBreak = code.indexOf('\n');
            if (firstLineBreak > 0) {
              const possibleLang = code.slice(0, firstLineBreak).trim();
              if (possibleLang && !possibleLang.includes(' ')) {
                language = possibleLang;
                code = code.slice(firstLineBreak + 1);
              }
            }
            
            // Apply syntax highlighting with highlight.js
            let highlightedCode;
            try {
              if (language !== 'plaintext' && hljs.getLanguage(language)) {
                highlightedCode = hljs.highlight(code, { language }).value;
              } else {
                highlightedCode = hljs.highlightAuto(code).value;
              }
            } catch (error) {
              console.error('Error applying syntax highlighting:', error);
              highlightedCode = code; // Fallback to plain code if highlighting fails
            }
            
            return (
              <div key={index} className={styles.codeBlockContainer}>
                {language !== 'plaintext' && (
                  <div className={styles.codeLanguage}>
                    <span>{language}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(code)}
                      className={styles.copyButton}
                      title="Copy code"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                      </svg>
                    </button>
                  </div>
                )}
                <pre className={styles.codeBlock}>
                  <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                </pre>
              </div>
            );
          } else {
            // Regular text - split by newlines to preserve paragraphs
            const paragraphs = segment.split('\n\n');
            return (
              <div key={index}>
                {paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex} className={styles.textParagraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
            );
          }
        })}
      </>
    );
  }
  
  // If no code blocks, just split by double newlines for paragraphs
  const paragraphs = content.split('\n\n');
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={styles.textParagraph}>
          {paragraph}
        </p>
      ))}
    </>
  );
};

export default function ChatInterface({ 
  id,
  modelName, 
  provider, 
  description,
  messages = [],
  initialStatus = ModelStatus.READY,
  onStatusChange,
  onDelete,
  providersData,
  input = '',
  onInputChange,
  onSubmit
}: ChatInterfaceProps) {
  const [status, setStatus] = useState<ModelStatus>(initialStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === ModelStatus.INACTIVE) return;
    
    const newStatus = status === ModelStatus.READY ? ModelStatus.ACTIVE : ModelStatus.READY;
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const handleApiKeySave = () => {
    setIsModalOpen(false);
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageIndex(index);
    
    setTimeout(() => {
      setCopiedMessageIndex(null);
    }, 2000);
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
              className={styles.modelSelect}
              disabled
            >
              <option value={modelName}>{modelName}</option>
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
        
        <div className={styles.messages} ref={messagesContainerRef}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${styles[message.role]}`}
            >
              <div className={styles.messageContent}>
                {formatMessageContent(message.content)}
                <div className={styles.messageFooter}>
                  <button 
                    className={styles.messageAction}
                    onClick={() => handleCopyMessage(message.content, index)}
                    title="Copy message"
                  >
                    {copiedMessageIndex === index ? (
                      <span className={styles.copiedText}>Copied!</span>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {onSubmit && (
          <form onSubmit={onSubmit} className={styles.inputForm}>
            <input
              className={styles.input}
              value={input}
              onChange={onInputChange}
              placeholder="Type a message..."
            />
            <button type="submit" className={styles.sendButton}>
              Send
            </button>
          </form>
        )}
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