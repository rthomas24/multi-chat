"use client";

import { useState } from 'react';
import styles from './AddModelCard.module.css';
import Modal from './Modal';
import ApiKeyForm from './ApiKeyForm';
import { ModelStatus } from '@/types/Status';

interface AddModelCardProps {
  onModelAdded: (model: {
    modelName: string;
    provider: string;
    description: string;
    initialStatus: ModelStatus;
  }) => void;
}

export default function AddModelCard({ onModelAdded }: AddModelCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleApiKeySave = (provider: string, modelName: string) => {
    setIsModalOpen(false);
    
    // Add new model with default description based on provider
    const descriptions = {
      'OpenAI': 'Advanced language model for diverse tasks',
      'Anthropic': 'Balanced performance and safety',
      'Google': 'Multimodal understanding and generation'
    };

    onModelAdded({
      modelName,
      provider,
      description: descriptions[provider] || 'AI language model',
      initialStatus: ModelStatus.READY
    });
  };

  return (
    <>
      <div 
        className={styles.container}
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.content}>
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span className={styles.text}>Add New Model</span>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ApiKeyForm 
          modelName=""
          onSave={handleApiKeySave}
        />
      </Modal>
    </>
  );
} 