"use client";

import { useState, useRef } from 'react';
import styles from './ChatInterface.module.css';
import { ModelStatus } from '@/types/Status';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import { Message } from 'ai';

interface ChatInterfaceProps {
  id: string;
  modelName: string;
  displayName: string;
  provider: string;
  description: string;
  messages?: Message[];
  initialStatus?: ModelStatus;
  onStatusChange?: (status: ModelStatus) => void;
  onDelete?: () => void;
  providersData: any;
  availableModelsForProvider: Array<{ name: string; displayName: string }>;
  onSwitchModel: (newModelName: string) => void;
}

const formatMessageContent = (content: string) => {
  if (content.includes('```')) {
    const segments = content.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g);
    return (
      <>
        {segments.map((segment, index) => {
          if (segment.startsWith('```') && segment.endsWith('```')) {
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
            let highlightedCode;
            try {
              highlightedCode =
                language !== 'plaintext' && hljs.getLanguage(language)
                  ? hljs.highlight(code, { language }).value
                  : hljs.highlightAuto(code).value;
            } catch (error) {
              highlightedCode = code;
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  displayName,
  provider,
  description,
  messages = [],
  initialStatus = ModelStatus.READY,
  onStatusChange,
  onDelete,
  providersData,
  availableModelsForProvider,
  onSwitchModel,
}: ChatInterfaceProps) {
  const [status, setStatus] = useState<ModelStatus>(initialStatus);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === ModelStatus.INACTIVE) return;
    const newStatus = status === ModelStatus.READY ? ModelStatus.ACTIVE : ModelStatus.READY;
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const toggleModelDropdown = () => {
    if (status === ModelStatus.INACTIVE) return;
    setIsModelDropdownOpen(!isModelDropdownOpen);
  };

  const handleModelSelect = (selectedModelName: string) => {
    onSwitchModel(selectedModelName);
    setIsModelDropdownOpen(false);
  };

  const currentDisplayName = availableModelsForProvider.find(m => m.name === modelName)?.displayName || displayName;

  return (
    <div className={`${styles.container} ${styles[status]}`}>
      <div className={styles.header}>
        <button className={styles.deleteButton} onClick={onDelete} aria-label="Remove chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className={styles.modelSelectorContainer}>
          <div className={styles.modelSelectDisplay} onClick={toggleModelDropdown} role="button" tabIndex={0} aria-haspopup="listbox" aria-expanded={isModelDropdownOpen}>
            <span className={styles.modelSelectDisplayText}>{currentDisplayName}</span>
            <svg className={`${styles.modelSelectArrow} ${isModelDropdownOpen ? styles.open : ''}`} width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4"/></svg>
          </div>
          {isModelDropdownOpen && (
            <ul className={styles.modelDropdown} role="listbox">
              {availableModelsForProvider.map((model) => (
                <li
                  key={model.name}
                  className={`${styles.modelDropdownItem} ${model.name === modelName ? styles.activeItem : ''}`}
                  onClick={() => handleModelSelect(model.name)}
                  role="option"
                  aria-selected={model.name === modelName}
                >
                  {model.displayName}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.providerInfo}>
          <span className={styles.provider}>{provider}</span>
          <img src={providersData[provider]?.logo} alt={`${provider} logo`} className={styles.providerLogo} />
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
          <div key={index} className={`${styles.message} ${styles[message.role]}`}>
            <div className={styles.messageContent}>
              {formatMessageContent(message.content)}
              <div className={styles.messageFooter}>
                <button className={styles.messageAction} onClick={() => handleCopyMessage(message.content, index)} title="Copy message">
                  {copiedMessageIndex === index ? (
                    <span className={styles.copiedText}>Copied!</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    </div>
  );
}