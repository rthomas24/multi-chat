"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './ChatInterface.module.css';
import { ModelStatus } from '@/types/Status';
import Modal from './Modal';
import ApiKeyForm from './ApiKeyForm';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css'; // Import a dark theme that works well with your UI

interface ChatInterfaceProps {
  id: string;
  modelName: string;
  provider: string;
  description: string;
  messages?: {
    role: 'user' | 'assistant';
    content: string;
    webSearch?: boolean;
  }[];
  initialStatus?: ModelStatus;
  onStatusChange?: (status: ModelStatus) => void;
  onDelete?: () => void;
  onMessagesUpdate?: (messages: { role: 'user' | 'assistant'; content: string; webSearch?: boolean }[]) => void;
  onModelChange?: (modelName: string) => void;
  providersData: any;
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
  onMessagesUpdate,
  onModelChange,
  providersData
}: ChatInterfaceProps) {
  const [status, setStatus] = useState<ModelStatus>(initialStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll the messages container when messages change or during streaming
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  useEffect(() => {
    const handleStreamStart = (event: CustomEvent<{ id: string }>) => {
      if (event.detail.id === id) {
        setIsStreaming(true);
        setStreamingContent('');
      }
    };

    const handleStreamChunk = (event: CustomEvent<{ id: string; chunk: string }>) => {
      if (event.detail.id === id) {
        setStreamingContent(prev => prev + event.detail.chunk);
        // Scroll to bottom with each chunk
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }
    };

    const handleStreamEnd = (event: CustomEvent<{ id: string; webSearch?: boolean }>) => {
      if (event.detail.id === id) {
        // Add the complete streamed content as a new message
        onMessagesUpdate?.([
          ...messages,
          { 
            role: 'assistant', 
            content: streamingContent,
            webSearch: event.detail.webSearch 
          }
        ]);
        // Reset streaming state after adding the message
        setIsStreaming(false);
        setStreamingContent('');
      }
    };

    window.addEventListener('stream-start', handleStreamStart as EventListener);
    window.addEventListener('stream-chunk', handleStreamChunk as EventListener);
    window.addEventListener('stream-end', handleStreamEnd as EventListener);
    
    return () => {
      window.removeEventListener('stream-start', handleStreamStart as EventListener);
      window.removeEventListener('stream-chunk', handleStreamChunk as EventListener);
      window.removeEventListener('stream-end', handleStreamEnd as EventListener);
    };
  }, [id, messages, streamingContent, onMessagesUpdate]);

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

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageIndex(index);
    
    // Reset the copied state after 2 seconds
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
        
        <div className={styles.messages} ref={messagesContainerRef}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${styles[message.role]}`}
            >
              <div className={styles.messageContent}>
                {formatMessageContent(message.content)}
                <div className={styles.messageFooter}>
                  {message.webSearch && (
                    <div className={styles.webSearchIndicator} title="Web search was used">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                  )}
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
          
          {/* Render streaming content if active */}
          {isStreaming && (
            <div className={`${styles.message} ${styles.assistant} ${styles.streaming}`}>
              <div className={styles.messageContent}>
                {formatMessageContent(streamingContent)}
                <div className={styles.streamingIndicator}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </div>
              </div>
            </div>
          )}
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