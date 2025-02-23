"use client";

import Image from "next/image";
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import { ModelStatus } from '@/types/Status';
import styles from "./page.module.css";
import { useState } from "react";
import AddModelCard from '@/components/AddModelCard';

// Add this type at the top of the file
interface ChatModel {
  id: string;
  modelName: string;
  provider: string;
  description: string;
  initialStatus: ModelStatus;
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

// Update the chatInterfaces constant to use the type
const chatInterfaces: ChatModel[] = [
  {
    id: 'claude-opus-1',
    modelName: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Most capable model for highly complex tasks",
    initialStatus: ModelStatus.ACTIVE,
    messages: [
      { role: 'user' as const, content: "How do you approach complex problems?" },
      { role: 'assistant' as const, content: "I break them down into smaller, manageable components..." }
    ]
  },
  {
    id: 'gpt4-1',
    modelName: "GPT-4",
    provider: "OpenAI",
    description: "Advanced reasoning and creativity",
    initialStatus: ModelStatus.READY,
    messages: [
      { role: 'user' as const, content: "What's your creative process?" },
      { role: 'assistant' as const, content: "I combine existing ideas in novel ways..." }
    ]
  },
  {
    id: 'claude-sonnet-1',
    modelName: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "Balanced performance and efficiency",
    initialStatus: ModelStatus.READY,
    messages: [
      { role: 'user' as const, content: "How do you maintain efficiency?" },
      { role: 'assistant' as const, content: "I focus on essential information..." }
    ]
  },
  {
    id: 'gemini-pro-1',
    modelName: "Gemini Pro",
    provider: "Google",
    description: "Multimodal understanding and generation",
    initialStatus: ModelStatus.READY,
    messages: [
      { role: 'user' as const, content: "How do you process different types of input?" },
      { role: 'assistant' as const, content: "I analyze context across modalities..." }
    ]
  },
  {
    id: 'claude-haiku-1',
    modelName: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Fast, efficient responses",
    initialStatus: ModelStatus.READY,
    messages: [
      { role: 'user' as const, content: "What's your approach to quick responses?" },
      { role: 'assistant' as const, content: "I prioritize clarity and conciseness..." }
    ]
  },
  {
    id: 'gpt-3.5-turbo-1',
    modelName: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "Fast and cost-effective processing",
    initialStatus: ModelStatus.INACTIVE,
    messages: [
      { role: 'user' as const, content: "How do you balance speed and quality?" },
      { role: 'assistant' as const, content: "I optimize for practical solutions..." }
    ]
  }
];

// Add a helper function to sort chat interfaces by status
const sortByStatus = (a: typeof chatInterfaces[0], b: typeof chatInterfaces[0]) => {
  const statusOrder = {
    [ModelStatus.ACTIVE]: 0,
    [ModelStatus.READY]: 1,
    [ModelStatus.INACTIVE]: 2
  };
  
  return statusOrder[a.initialStatus] - statusOrder[b.initialStatus];
};

export default function Home() {
  // Update the state to use the type
  const [sortedInterfaces, setSortedInterfaces] = useState<ChatModel[]>(chatInterfaces.sort(sortByStatus));

  const handleStatusChange = (index: number, newStatus: ModelStatus) => {
    setSortedInterfaces(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], initialStatus: newStatus };
      return updated.sort(sortByStatus);
    });
  };

  const handleDelete = (index: number) => {
    setSortedInterfaces(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleAddModel = (newModel: Omit<ChatModel, 'messages' | 'id'>) => {
    setSortedInterfaces(prev => {
      // Count existing instances of this model
      const existingCount = prev.filter(m => m.modelName === newModel.modelName).length;
      
      const modelWithMessages: ChatModel = {
        ...newModel,
        id: `${newModel.modelName.toLowerCase().replace(/\s+/g, '-')}-${existingCount + 1}`,
        messages: [
          { role: 'user', content: "Hello! What can you help me with?" },
          { role: 'assistant', content: "I'm ready to assist you with any questions or tasks..." }
        ]
      };
      
      const updated = [...prev, modelWithMessages];
      return updated.sort(sortByStatus);
    });
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.heading}>What do you want to know?</h1>
        
        <div className={styles.inputContainer}>
          <input 
            type="text"
            placeholder="Ask anything..."
            className={styles.input}
          />
          <div className={styles.inputActions}>
            <button className={styles.deepResearchBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.icon}>
                <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Deep Research
            </button>
            <div className={styles.inputButtons}>
              <button className={styles.iconButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.icon}>
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2C9.49872 4.73835 8.07725 8.29203 8 12C8.07725 15.708 9.49872 19.2616 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className={styles.iconButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.icon}>
                  <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59718 21.9983 8.005 21.9983C6.41282 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80943 14.7185 1.38777 15.78 1.38777C16.8415 1.38777 17.8594 1.80943 18.61 2.56C19.3606 3.31057 19.7822 4.32855 19.7822 5.39C19.7822 6.45145 19.3606 7.46943 18.61 8.22L9.41 17.41C9.03472 17.7853 8.52577 17.9961 7.995 17.9961C7.46423 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5258 5.99389 15.995C5.99389 15.4642 6.20472 14.9553 6.58 14.58L15.07 6.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className={styles.iconButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.icon}>
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.chatGrid}>
          {sortedInterfaces.map((chat, index) => (
            <ChatInterface 
              key={chat.id}
              {...chat}
              onStatusChange={(status) => handleStatusChange(index, status)}
              onDelete={() => handleDelete(index)}
            />
          ))}
          <AddModelCard onModelAdded={handleAddModel} />
        </div>
      </main>
      <footer className={styles.footer}>
        <a href="https://nextjs.org/learn" className={styles.footerLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.footerIcon}>
            <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Learn
        </a>
        <a href="https://vercel.com/templates" className={styles.footerLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.footerIcon}>
            <path d="M3 3H21V21H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Examples
        </a>
        <a href="https://nextjs.org" className={styles.footerLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.footerIcon}>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
