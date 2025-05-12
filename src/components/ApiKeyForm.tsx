"use client";

import { useState, useEffect } from 'react';
import styles from './ApiKeyForm.module.css';
import providersData from '@/data/providers.json';

type KnownProviderKey = keyof typeof providersData; 

interface ApiKeyFormProps {
  modelName: string;
  onSave: (provider: KnownProviderKey, modelName: string) => void;
}

export default function ApiKeyForm({ modelName, onSave }: ApiKeyFormProps) {
  const [provider, setProvider] = useState<KnownProviderKey | '' >('');
  const [selectedModel, setSelectedModel] = useState(modelName);
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    // Find provider based on model name
    const foundProvider = Object.entries(providersData).find(([_, data]) => 
      data.models.includes(modelName)
    )?.[0];
    if (foundProvider) {
      setProvider(foundProvider as KnownProviderKey);
    }
  }, [modelName]);

  useEffect(() => {
    if (provider) {
      const existingKey = localStorage.getItem(`${provider.toLowerCase()}_api_key`);
      setHasExistingKey(Boolean(existingKey));
      if (existingKey) {
        setApiKey(existingKey);
      }
    }
  }, [provider]);

  useEffect(() => {
    setIsValid(Boolean(provider && selectedModel && (hasExistingKey || apiKey)));
  }, [provider, selectedModel, apiKey, hasExistingKey]);

  const handleSave = () => {
    if (!hasExistingKey) {
      const key = `${provider.toLowerCase()}_api_key`;
      localStorage.setItem(key, apiKey);
    }
    if (provider) { // Ensure provider is not an empty string before calling onSave
      onSave(provider, selectedModel);
    }
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Add Model</h2>
      
      <div className={styles.field}>
        <label htmlFor="provider">Provider</label>
        <select 
          id="provider"
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value as KnownProviderKey | ''); // Cast to KnownProviderKey or empty
            setSelectedModel('');
            setApiKey('');
          }}
        >
          <option value="">Select Provider</option>
          {Object.keys(providersData).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="model">Model</label>
        <select 
          id="model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!provider}
        >
          <option value="">Select Model</option>
          {provider && providersData[provider as keyof typeof providersData].models.map((model: string) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      {!hasExistingKey && (
        <div className={styles.field}>
          <label htmlFor="apiKey">API Key</label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider ? `Enter ${providersData[provider as keyof typeof providersData].keyPrefix}...` : 'Enter API Key'}
          />
        </div>
      )}

      {hasExistingKey && (
        <div className={styles.notice}>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
            <path d="M12 16V12"/>
            <path d="M12 8H12.01"/>
          </svg>
          <span>Using existing API key for {provider}</span>
        </div>
      )}

      <button 
        className={styles.saveButton}
        disabled={!isValid}
        onClick={handleSave}
      >
        Add Model
      </button>
    </div>
  );
} 