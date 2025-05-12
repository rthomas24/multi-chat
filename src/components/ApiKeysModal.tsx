"use client";

import { useState, useEffect } from 'react';
import styles from './ApiKeysModal.module.css';
import Modal from './Modal';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  providersData: any;
}

export default function ApiKeysModal({ isOpen, onClose, providersData }: ApiKeysModalProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Load API keys from localStorage on component mount
  useEffect(() => {
    if (isOpen) {
      const keys: Record<string, string> = {};
      const initialShowState: Record<string, boolean> = {};
      
      Object.keys(providersData).forEach(provider => {
        const storageKey = `${provider.toLowerCase()}_api_key`;
        const key = localStorage.getItem(storageKey) || '';
        keys[provider] = key;
        initialShowState[provider] = false;
      });
      
      setApiKeys(keys);
      setShowKeys(initialShowState);
    }
  }, [isOpen, providersData]);

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const saveKeys = () => {
    Object.entries(apiKeys).forEach(([provider, key]) => {
      if (key) {
        const storageKey = `${provider.toLowerCase()}_api_key`;
        localStorage.setItem(storageKey, key);
      } else {
        const storageKey = `${provider.toLowerCase()}_api_key`;
        localStorage.removeItem(storageKey);
      }
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        <h2 className={styles.title}>API Keys</h2>
        <p className={styles.description}>
          Enter your API keys for each provider. Keys are stored in your browser's local storage and are never sent to our servers.
        </p>
        
        <div className={styles.keysList}>
          {Object.keys(providersData).map(provider => (
            <div key={provider} className={styles.keyItem}>
              <div className={styles.providerInfo}>
                <img 
                  src={providersData[provider].logo} 
                  alt={`${provider} logo`}
                  className={styles.providerLogo}
                />
                <span className={styles.providerName}>{provider}</span>
              </div>
              
              <div className={styles.keyInputWrapper}>
                <input
                  type={showKeys[provider] ? "text" : "password"}
                  value={apiKeys[provider] || ''}
                  onChange={(e) => handleKeyChange(provider, e.target.value)}
                  placeholder={`Enter ${provider} API key`}
                  className={styles.keyInput}
                />
                <button 
                  className={styles.toggleVisibility}
                  onClick={() => toggleShowKey(provider)}
                  type="button"
                  aria-label={showKeys[provider] ? "Hide API key" : "Show API key"}
                >
                  {showKeys[provider] ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={styles.saveButton}
            onClick={saveKeys}
          >
            Save Keys
          </button>
        </div>
      </div>
    </Modal>
  );
} 