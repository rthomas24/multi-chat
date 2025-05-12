'use client';

import { useState, useRef } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { ModelStatus } from '@/types/Status';
import styles from './page.module.css';
import Header from '@/components/Header';
import AddModelCard from '@/components/AddModelCard';
import providersData from '@/data/providers.json';
import { Message } from 'ai';
import { retrieveApiKey } from '@/utils/apiKeyEncryption';

type ProviderKey = keyof typeof providersData;

const modelDisplayNameMap: Record<string, string> = {
  'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'grok-3-latest': 'Grok 3 Latest',
  'grok-3-mini': 'Grok 3 Mini',
  'gemini-2.5-flash-preview-04-17': 'Gemini 2.5 Flash Preview',
  'gemini-2.5-pro-preview-05-06': 'Gemini 2.5 Pro Preview',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash-Lite'
}

interface ChatModel {
  id: string;
  modelName: string; // Actual name for API and providers.json
  displayName: string; // User-facing name
  provider: ProviderKey; // Use the more specific type here
  description: string;
  initialStatus: ModelStatus;
  apiRoute: string;
  messages: Message[];
}

const initialChatModels: ChatModel[] = [
  {
    id: 'claude-opus-1',
    modelName: 'claude-3-5-sonnet-20240620',
    displayName: modelDisplayNameMap['claude-3-5-sonnet-20240620'] || 'claude-3-5-sonnet-20240620',
    provider: 'Anthropic',
    description: 'Most capable model for highly complex tasks',
    initialStatus: ModelStatus.READY,
    apiRoute: '/api/chat/anthropic',
    messages: []
  },
  {
    id: 'gpt4-1',
    modelName: 'gpt-4o',
    displayName: modelDisplayNameMap['gpt-4o'] || 'gpt-4o',
    provider: 'OpenAI',
    description: 'Advanced reasoning and creativity',
    initialStatus: ModelStatus.ACTIVE,
    apiRoute: '/api/chat/openai',
    messages: []
  },
  {
    id: 'grok-1',
    modelName: 'grok-3-latest',
    displayName: modelDisplayNameMap['grok-3-latest'] || 'grok-3-latest',
    provider: 'xAI',
    description: 'Real-time knowledge and witty responses',
    initialStatus: ModelStatus.ACTIVE,
    apiRoute: '/api/chat/xai',
    messages: [],
  },
  {
    id: 'gemini-2-flash-1',
    modelName: 'gemini-2.0-flash',
    displayName: modelDisplayNameMap['gemini-2.0-flash'] || 'gemini-2.0-flash',
    provider: 'Google',
    description: 'Fast and efficient Google model',
    initialStatus: ModelStatus.ACTIVE,
    apiRoute: '/api/chat/google',
    messages: [],
  },
];

const sortByStatus = (a: ChatModel, b: ChatModel) => {
  const order = { [ModelStatus.ACTIVE]: 0, [ModelStatus.READY]: 1, [ModelStatus.INACTIVE]: 2 };
  return order[a.initialStatus] - order[b.initialStatus];
};

export default function Home() {
  const [chatModels, setChatModels] = useState<ChatModel[]>([...initialChatModels].sort(sortByStatus));
  const [userInput, setUserInput] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const activeModels = chatModels.filter(model => model.initialStatus === ModelStatus.ACTIVE);

  const handleStatusChange = (id: string, newStatus: ModelStatus) => {
    setChatModels(prev =>
      prev.map(model => (model.id === id ? { ...model, initialStatus: newStatus } : model)).sort(sortByStatus)
    );
  };

  const handleDelete = (id: string) => {
    setChatModels(prev => prev.filter(model => model.id !== id));
  };

  const handleSwitchModel = (chatId: string, newModelName: string) => {
    setChatModels(prevChatModels =>
      prevChatModels.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            modelName: newModelName,
            displayName: modelDisplayNameMap[newModelName] || newModelName,
            // Optionally, clear messages or add a system message about model change
            // messages: [], 
          };
        }
        return chat;
      })
    );
  };

  const handleAddModel = (newModelData: Omit<ChatModel, 'id' | 'apiRoute' | 'messages' | 'displayName'> & { modelName: string }) => {
    const apiRoute = `/api/chat/${newModelData.provider.toLowerCase()}`;
    const count = chatModels.filter(m => m.modelName === newModelData.modelName).length;
    const displayName = modelDisplayNameMap[newModelData.modelName] || newModelData.modelName;
    const newChat: ChatModel = {
      ...newModelData,
      id: `${newModelData.modelName.toLowerCase().replace(/[\s.-]+/g, '-')}-${count + 1}`,
      apiRoute,
      displayName,
      messages: [
        { id: Date.now().toString(), role: 'user', content: 'Hello! What can you help me with?' },
        { id: Date.now().toString(), role: 'assistant', content: "I'm ready to assist you with any questions or tasks..." },
      ],
    };
    setChatModels(prev => [...prev, newChat].sort(sortByStatus));
  };

  // Combine drag cleanup into one helper.
  const endDrag = () => {
    setIsDragging(false);
    dragItemRef.current = null;
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleLongPressStart = (index: number) => {
    longPressTimeoutRef.current = setTimeout(() => {
      setIsDragging(true);
      dragItemRef.current = index;
    }, 300);
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
    setChatModels(prev => {
      const items = [...prev];
      const [movedItem] = items.splice(dragIndex, 1);
      items.splice(dropIndex, 0, movedItem);
      return items;
    });
    endDrag();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userInput };
    const updatedChats = chatModels.map(chat =>
      chat.initialStatus === ModelStatus.ACTIVE ? { ...chat, messages: [...chat.messages, userMessage] } : chat
    );
    setChatModels(updatedChats);
    setUserInput('');

    activeModels.forEach(model => {
      const storageKey = `${model.provider.toLowerCase()}_api_key`;
      const apiKey = localStorage.getItem(storageKey);

      if (!apiKey) {
        console.error(`No API key found for ${model.provider}`);
        
        // Update the message to show the error
        const responseId = `asst-${Date.now()}`;
        const updatedChat = updatedChats.find(chat => chat.id === model.id);
        if (!updatedChat) return;
        const messagesWithError = [...updatedChat.messages, { 
          id: responseId, 
          role: 'assistant' as const, 
          content: `Error: No API key found for ${model.provider}. Please add your API key in the settings.` 
        }];
        setChatModels(prev =>
          prev.map(chat => (chat.id === model.id ? { ...chat, messages: messagesWithError } : chat))
        );
        return;
      }
      
      const responseId = `asst-${Date.now()}`;
      const updatedChat = updatedChats.find(chat => chat.id === model.id);
      if (!updatedChat) return;
      const messagesWithAssistant = [...updatedChat.messages, { id: responseId, role: 'assistant' as const, content: '' }];
      setChatModels(prev =>
        prev.map(chat => (chat.id === model.id ? { ...chat, messages: messagesWithAssistant } : chat))
      );
      
      const apiUrl = model.apiRoute.startsWith('http') ? model.apiRoute : `${window.location.origin}${model.apiRoute}`;
      
      fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'X-API-Key': apiKey 
        },
        body: JSON.stringify({ 
          messages: updatedChat.messages, 
          model: model.modelName, 
          webSearch: webSearchEnabled 
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
          }
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
              setChatModels(prev =>
                prev.map(chat =>
                  chat.id === model.id
                    ? {
                        ...chat,
                        messages: chat.messages.map(msg =>
                          msg.id === responseId ? { ...msg, content: data.content || JSON.stringify(data) } : msg
                        ),
                      }
                    : chat
                )
              );
            });
          } else {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let content = '';
            
            const readStream = () => {
              reader.read().then(({ done, value }) => {
                if (done) {
                  return;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                content += chunk;
                
                setChatModels(prev =>
                  prev.map(chat =>
                    chat.id === model.id
                      ? {
                          ...chat,
                          messages: chat.messages.map(msg =>
                            msg.id === responseId ? { ...msg, content } : msg
                          ),
                        }
                      : chat
                  )
                );
                readStream();
              }).catch((error) => {
                console.error(`Error reading stream for ${model.provider}:`, error);
              });
            };
            readStream();
          }
        })
        .catch(error => {
          console.error(`Error submitting request to ${model.provider}:`, error);
        });
    });
  };
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.contentWrapper}>
        <h1 className={styles.heading}>One question, multiple perspectives</h1>
        <div className={styles.chatGrid}>
          {chatModels.map((chat, index) => (
            <div
              key={chat.id}
              className={`${styles.chatCardWrapper} ${isDragging ? styles.draggable : ''} ${
                dragItemRef.current === index ? styles.dragging : ''
              }`}
              draggable={isDragging}
              onMouseDown={() => handleLongPressStart(index)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={() => handleLongPressStart(index)}
              onTouchEnd={endDrag}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <ChatModelWrapper
                chat={chat}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onMessagesUpdate={(id, messages) =>
                  setChatModels(prev => prev.map(chat => (chat.id === id ? { ...chat, messages } : chat)))
                }
                providersData={providersData}
                availableModelsForProvider={(
                  providersData[chat.provider]?.models.map((modelName: string) => ({
                    name: modelName,
                    displayName: modelDisplayNameMap[modelName] || modelName,
                  })) || []
                )}
                onSwitchModel={(newModelName) => handleSwitchModel(chat.id, newModelName)}
              />
            </div>
          ))}
          <AddModelCard onModelAdded={handleAddModel} />
        </div>
      </div>
      <div className={styles.inputContainer}>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Ask anything..."
            className={styles.input}
          />
          <div className={styles.inputActions}>
            <div className={styles.inputButtons}>
              <button
                type="button"
                className={`${styles.webSearchButton} ${webSearchEnabled ? styles.webSearchEnabled : ''}`}
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                title={webSearchEnabled ? "Disable web search" : "Enable web search"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z" />
                </svg>
              </button>
              <button
                type="button"
                className={styles.addToolsButton}
                title="Add Tools"
              >
                Add Tools +
              </button>
            </div>
            <button type="submit" className={styles.sendButton}>
              Send
            </button>
          </div>
        </form>
      </div>
      <footer className={styles.footer}>
        <a href="https://nextjs.org/learn" className={styles.footerLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.footerIcon}>
            <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Learn
        </a>
        <a href="https://vercel.com/templates" className={styles.footerLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.footerIcon}>
            <path d="M3 3H21V21H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Examples
        </a>
        <a href="https://nextjs.org" className={styles.footerLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.footerIcon}>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

function ChatModelWrapper({
  chat,
  onStatusChange,
  onDelete,
  onMessagesUpdate,
  providersData,
  availableModelsForProvider,
  onSwitchModel,
}: {
  chat: ChatModel;
  onStatusChange: (id: string, status: ModelStatus) => void;
  onDelete: (id: string) => void;
  onMessagesUpdate: (id: string, messages: Message[]) => void;
  providersData: any;
  availableModelsForProvider: Array<{ name: string; displayName: string }>;
  onSwitchModel: (newModelName: string) => void;
}) {
  return (
    <ChatInterface
      id={chat.id}
      modelName={chat.modelName}
      displayName={chat.displayName}
      provider={chat.provider}
      description={chat.description}
      messages={chat.messages}
      initialStatus={chat.initialStatus}
      onStatusChange={(status) => onStatusChange(chat.id, status)}
      onDelete={() => onDelete(chat.id)}
      providersData={providersData}
      availableModelsForProvider={availableModelsForProvider}
      onSwitchModel={onSwitchModel}
    />
  );
}