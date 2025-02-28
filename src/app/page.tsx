"use client";

import Image from "next/image";
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import { ModelStatus } from '@/types/Status';
import styles from "./page.module.css";
import { useState, useRef } from "react";
import AddModelCard from '@/components/AddModelCard';
import ChatInput from '@/components/ChatInput';
import providersData from '@/data/providers.json';

// Add this with the other interfaces at the top
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Add this type at the top of the file
interface ChatModel {
  id: string;
  modelName: string;
  provider: string;
  description: string;
  initialStatus: ModelStatus;
  messages: Message[];  // Use the Message type here
}

// Update the chatInterfaces constant to use the type
const chatInterfaces: ChatModel[] = [
  {
    id: 'claude-opus-1',
    modelName: "claude-3-5-sonnet-20240620",
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
    modelName: "gpt-4o",
    provider: "OpenAI",
    description: "Advanced reasoning and creativity",
    initialStatus: ModelStatus.READY,
    messages: [
      { role: 'user' as const, content: "What's your creative process?" },
      { role: 'assistant' as const, content: "I combine existing ideas in novel ways..." }
    ]
  },
  // {
  //   id: 'claude-sonnet-1',
  //   modelName: "Claude 3 Sonnet",
  //   provider: "Anthropic",
  //   description: "Balanced performance and efficiency",
  //   initialStatus: ModelStatus.READY,
  //   messages: [
  //     { role: 'user' as const, content: "How do you maintain efficiency?" },
  //     { role: 'assistant' as const, content: "I focus on essential information..." }
  //   ]
  // },
  // {
  //   id: 'gemini-pro-1',
  //   modelName: "Gemini Pro",
  //   provider: "Google",
  //   description: "Multimodal understanding and generation",
  //   initialStatus: ModelStatus.READY,
  //   messages: [
  //     { role: 'user' as const, content: "How do you process different types of input?" },
  //     { role: 'assistant' as const, content: "I analyze context across modalities..." }
  //   ]
  // },
  // {
  //   id: 'claude-haiku-1',
  //   modelName: "Claude 3 Haiku",
  //   provider: "Anthropic",
  //   description: "Fast, efficient responses",
  //   initialStatus: ModelStatus.READY,
  //   messages: [
  //     { role: 'user' as const, content: "What's your approach to quick responses?" },
  //     { role: 'assistant' as const, content: "I prioritize clarity and conciseness..." }
  //   ]
  // },
  // {
  //   id: 'gpt-3.5-turbo-1',
  //   modelName: "GPT-3.5 Turbo",
  //   provider: "OpenAI",
  //   description: "Fast and cost-effective processing",
  //   initialStatus: ModelStatus.INACTIVE,
  //   messages: [
  //     { role: 'user' as const, content: "How do you balance speed and quality?" },
  //     { role: 'assistant' as const, content: "I optimize for practical solutions..." }
  //   ]
  // },
  // {
  //   id: 'grok-1',
  //   modelName: "Grok-1",
  //   provider: "xAI",
  //   description: "Real-time knowledge and witty responses",
  //   initialStatus: ModelStatus.READY,
  //   messages: [
  //     { role: 'user' as const, content: "What makes you unique?" },
  //     { role: 'assistant' as const, content: "I combine real-time knowledge with a dash of wit..." }
  //   ]
  // }
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
  const [sortedInterfaces, setSortedInterfaces] = useState<ChatModel[]>(chatInterfaces.sort(sortByStatus));
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const dragItemRef = useRef<number | null>(null);

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

  const handleLongPressStart = (index: number) => {
    longPressTimeoutRef.current = setTimeout(() => {
      setIsDragging(true);
      dragItemRef.current = index;
    }, 300); // 1.5 seconds
  };

  const handleLongPressEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isDragging) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    dragItemRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragItemRef.current;
    
    if (dragIndex === null || dragIndex === dropIndex) return;

    setSortedInterfaces(prev => {
      const newItems = [...prev];
      const dragItem = newItems[dragIndex];
      newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, dragItem);
      return newItems;
    });

    setIsDragging(false);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragItemRef.current = null;
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleMessageSent = (message: string) => {
    // Add message to all active interfaces
    setSortedInterfaces(prev => 
      prev.map(chat => ({
        ...chat,
        messages: chat.initialStatus === ModelStatus.ACTIVE ? 
          [...chat.messages, { role: 'user', content: message }] : 
          chat.messages
      }))
    );
  };

  const handleMessagesUpdate = (id: string, newMessages: Message[]) => {
    setSortedInterfaces(prev => 
      prev.map(chat => 
        chat.id === id ? { ...chat, messages: newMessages } : chat
      )
    );
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.heading}>What do you want to know?</h1>
        
        <ChatInput 
          activeModels={sortedInterfaces.map(({ id, provider, modelName, initialStatus }) => ({
            id, provider, modelName, status: initialStatus
          }))}
          onMessageSent={handleMessageSent}
        />

        <div className={styles.chatGrid}>
          {sortedInterfaces.map((chat, index) => (
            <div
              key={chat.id}
              className={`${styles.chatCardWrapper} ${isDragging ? styles.draggable : ''} ${dragItemRef.current === index ? styles.dragging : ''}`}
              draggable={isDragging}
              onMouseDown={() => handleLongPressStart(index)}
              onMouseUp={() => {
                handleLongPressEnd();
                handleDragEnd();
              }}
              onMouseLeave={() => {
                handleLongPressEnd();
                handleDragEnd();
              }}
              onTouchStart={() => handleLongPressStart(index)}
              onTouchEnd={() => {
                handleLongPressEnd();
                handleDragEnd();
              }}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <ChatInterface
                {...chat}
                providersData={providersData}
                onStatusChange={(status) => handleStatusChange(index, status)}
                onDelete={() => handleDelete(index)}
                onMessagesUpdate={(messages) => handleMessagesUpdate(chat.id, messages)}
                onModelChange={(modelName) => {
                  // Add handler for model change if needed
                  console.log('Model changed to:', modelName);
                }}
              />
            </div>
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
