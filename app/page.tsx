'use client';

import { useState, useRef } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { ModelStatus } from '@/types/Status';
import styles from './page.module.css';
import Header from '@/components/Header';
import AddModelCard from '@/components/AddModelCard';
import providersData from '@/data/providers.json';
import { Message } from 'ai';

// Updated chat model to include both messages and apiRoute
interface ChatModel {
  id: string;
  modelName: string;
  provider: string;
  description: string;
  initialStatus: ModelStatus;
  apiRoute: string;
  messages: Message[];
}

// Initial models with both API routes and messages
const chatInterfaces: ChatModel[] = [
  {
    id: 'claude-opus-1',
    modelName: "claude-3-5-sonnet-20240620",
    provider: "Anthropic",
    description: "Most capable model for highly complex tasks",
    initialStatus: ModelStatus.ACTIVE,
    apiRoute: '/api/chat/anthropic',
    messages: [
      { id: '1', role: 'user', content: "How do you approach complex problems?" },
      { id: '2', role: 'assistant', content: "I break them down into smaller, manageable components..." }
    ]
  },
  {
    id: 'gpt4-1',
    modelName: "gpt-4o",
    provider: "OpenAI",
    description: "Advanced reasoning and creativity",
    initialStatus: ModelStatus.READY,
    apiRoute: '/api/chat/openai',
    messages: [
      { id: '3', role: 'user', content: "What's your creative process?" },
      { id: '4', role: 'assistant', content: "I combine existing ideas in novel ways..." }
    ]
  },
  {
    id: 'grok-1',
    modelName: "grok-2-1212",
    provider: "xAI",
    description: "Real-time knowledge and witty responses",
    initialStatus: ModelStatus.READY,
    apiRoute: '/api/chat/xai',
    messages: [
      { id: '5', role: 'user', content: "What makes you unique?" },
      { id: '6', role: 'assistant', content: "I combine real-time knowledge with a dash of wit..." }
    ]
  }
];

// Helper function to sort chat interfaces by status
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
  const [userInput, setUserInput] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const dragItemRef = useRef<number | null>(null);
  
  const activeModels = sortedInterfaces.filter(model => model.initialStatus === ModelStatus.ACTIVE);

  const handleStatusChange = (id: string, newStatus: ModelStatus) => {
    setSortedInterfaces(prev => {
      const updated = prev.map(model => 
        model.id === id ? { ...model, initialStatus: newStatus } : model
      );
      return updated.sort(sortByStatus);
    });
  };

  const handleDelete = (id: string) => {
    setSortedInterfaces(prev => prev.filter(model => model.id !== id));
  };

  const handleAddModel = (newModel: Omit<ChatModel, 'id' | 'apiRoute' | 'messages'>) => {
    const apiRoute = `/api/chat/${newModel.provider.toLowerCase()}`;
    // Count existing instances of this model
    const existingCount = sortedInterfaces.filter(m => m.modelName === newModel.modelName).length;
    
    const modelWithMessages: ChatModel = {
      ...newModel,
      id: `${newModel.modelName.toLowerCase().replace(/\s+/g, '-')}-${existingCount + 1}`,
      apiRoute,
      messages: [
        { id: Date.now().toString(), role: 'user', content: "Hello! What can you help me with?" },
        { id: Date.now().toString(), role: 'assistant', content: "I'm ready to assist you with any questions or tasks..." }
      ]
    };
    
    setSortedInterfaces(prev => {
      const updated = [...prev, modelWithMessages];
      return updated.sort(sortByStatus);
    });
  };

  // Drag and drop functionality
  const handleLongPressStart = (index: number) => {
    longPressTimeoutRef.current = setTimeout(() => {
      setIsDragging(true);
      dragItemRef.current = index;
    }, 300);
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

  // Input handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    console.log("Form submitted, processing active models:", activeModels.length);
    
    // Create a user message
    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userInput
    };
    
    // Add user message to all active interfaces
    const updatedInterfaces = sortedInterfaces.map(chat => {
      if (chat.initialStatus === ModelStatus.ACTIVE) {
        return {
          ...chat,
          messages: [...chat.messages, userMessage]
        };
      }
      return chat;
    });
    
    // Update state with user messages
    setSortedInterfaces(updatedInterfaces);
    
    // Clear input immediately for better UX
    const currentInput = userInput;
    setUserInput('');
    
    // Send the message to all active chat models
    activeModels.forEach(model => {
      console.log(`Processing model: ${model.provider} - ${model.modelName}, API route: ${model.apiRoute}`);
      
      // Get API key from localStorage for this model's provider
      const apiKey = localStorage.getItem(`${model.provider.toLowerCase()}_api_key`);
      console.log(`API key for ${model.provider}: ${apiKey ? 'Found' : 'Not found'}`);
      
      if (!apiKey) {
        console.error(`No API key found for ${model.provider}`);
        return;
      }
      
      // Create a unique ID for this message
      const responseId = `asst-${Date.now()}`;
      
      // Find the updated interface with the user message
      const updatedInterface = updatedInterfaces.find(chat => chat.id === model.id);
      if (!updatedInterface) return;
      
      // Create an assistant message
      const assistantMessage: Message = {
        id: responseId,
        role: 'assistant',
        content: ''
      };
      
      // Add the assistant message to the chat
      const messagesWithAssistant = [...updatedInterface.messages, assistantMessage];
      
      // Update state with assistant message
      setSortedInterfaces(prev => 
        prev.map(chat => 
          chat.id === model.id 
            ? { ...chat, messages: messagesWithAssistant } 
            : chat
        )
      );
      
      // Ensure we have a full URL for the API endpoint
      const apiUrl = model.apiRoute.startsWith('http') 
        ? model.apiRoute 
        : `${window.location.origin}${model.apiRoute}`;
      
      console.log(`Making fetch request to: ${apiUrl}`);
      console.log(`Request payload:`, {
        messages: updatedInterface.messages,
        model: model.modelName,
        webSearch: webSearchEnabled
      });
      
      // Make API call with streaming
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          messages: updatedInterface.messages,
          model: model.modelName,
          webSearch: webSearchEnabled
        }),
      })
      .then(response => {
        console.log(`Response from ${model.provider} API:`, response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
        }
        
        // Check the content type to decide how to handle the response
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type of response:`, contentType);
        
        if (contentType && contentType.includes('application/json')) {
          // Handle JSON response for our test
          console.log(`Handling JSON response from ${model.provider}`);
          return response.json().then(data => {
            console.log(`Received JSON data:`, data);
            
            // Update state with response content
            setSortedInterfaces(prev => 
              prev.map(chat => {
                if (chat.id === model.id) {
                  return {
                    ...chat,
                    messages: chat.messages.map(msg => 
                      msg.id === responseId 
                        ? { ...msg, content: data.content || JSON.stringify(data) } 
                        : msg
                    )
                  };
                }
                return chat;
              })
            );
          });
        } else {
          // Handle streaming response
          console.log(`Starting stream processing for ${model.provider}`);
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let content = '';
          
          // Read the stream
          function readStream() {
            reader.read().then(({ done, value }) => {
              if (done) {
                console.log(`Stream from ${model.provider} completed`);
                return;
              }
              
              // Append to content
              const chunk = decoder.decode(value, { stream: true });
              console.log(`Received chunk from ${model.provider}:`, chunk.length > 50 ? chunk.substring(0, 50) + '...' : chunk);
              content += chunk;
              
              // Update state with streaming content
              setSortedInterfaces(prev => 
                prev.map(chat => {
                  if (chat.id === model.id) {
                    return {
                      ...chat,
                      messages: chat.messages.map(msg => 
                        msg.id === responseId 
                          ? { ...msg, content: content } 
                          : msg
                      )
                    };
                  }
                  return chat;
                })
              );
              
              // Continue reading
              readStream();
            }).catch(error => {
              console.error(`Error reading stream from ${model.provider}:`, error);
              // Handle error and keep the partial content
            });
          }
          
          readStream();
          
          // Return to avoid multiple returns
          return Promise.resolve();
        }
      })
      .catch(error => {
        console.error(`Error calling ${model.provider} API:`, error);
        
        // Update state with error message
        setSortedInterfaces(prev => 
          prev.map(chat => {
            if (chat.id === model.id) {
              return {
                ...chat,
                messages: chat.messages.map(msg => 
                  msg.id === responseId 
                    ? { ...msg, content: `There was an error processing your request: ${error.message}` } 
                    : msg
                )
              };
            }
            return chat;
          })
        );
      });
    });
  };

  // Helper function to update messages for a specific chat
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
        <h1 className={styles.heading}>One question, multiple perspectives</h1>
        
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
              <button 
                type="button"
                className={`${styles.webSearchButton} ${webSearchEnabled ? styles.webSearchEnabled : ''}`}
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                Web Search
              </button>
              <button type="submit" className={styles.sendButton}>
                Send
              </button>
            </div>
          </form>
        </div>
        
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
              <ChatModelWrapper 
                chat={chat} 
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onMessagesUpdate={handleMessagesUpdate}
                providersData={providersData}
                userInput={userInput}
                webSearch={webSearchEnabled}
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

function ChatModelWrapper({ 
  chat, 
  onStatusChange, 
  onDelete,
  onMessagesUpdate,
  providersData,
  userInput,
  webSearch
}: { 
  chat: ChatModel;
  onStatusChange: (id: string, status: ModelStatus) => void;
  onDelete: (id: string) => void;
  onMessagesUpdate: (id: string, messages: Message[]) => void;
  providersData: any;
  userInput: string;
  webSearch: boolean;
}) {
  const { id, modelName, provider, description, messages, initialStatus, apiRoute } = chat;
  
  // Prepare for API submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (initialStatus === ModelStatus.ACTIVE && userInput.trim()) {
      // Get API key from localStorage
      const apiKey = localStorage.getItem(`${provider.toLowerCase()}_api_key`);
      console.log(`API key for ${provider}: ${apiKey ? 'Found' : 'Not found'}`);
      
      if (!apiKey) {
        console.error(`No API key found for ${provider}`);
        // Add error message to the chat
        const errorMessage: Message = { 
          id: `error-${Date.now()}`, 
          role: 'assistant', 
          content: `Error: No API key found for ${provider}. Please add an API key in settings.` 
        };
        
        onMessagesUpdate(id, [...messages, errorMessage]);
        return;
      }
      
      // First add the user message to the chat
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userInput
      };
      
      // Update messages with user message
      const messagesWithUser = [...messages, userMessage];
      onMessagesUpdate(id, messagesWithUser);
      
      // Create a unique ID for this message
      const responseId = `asst-${Date.now()}`;
      
      // Create an assistant message that will be updated with streaming content
      const assistantMessage: Message = {
        id: responseId,
        role: 'assistant',
        content: ''
      };
      
      // Add the assistant message to the chat
      const updatedMessages = [...messagesWithUser, assistantMessage];
      onMessagesUpdate(id, updatedMessages);
      
      // Ensure we have a full URL for the API endpoint
      const apiUrl = apiRoute.startsWith('http') 
        ? apiRoute 
        : `${window.location.origin}${apiRoute}`;
      
      console.log(`Making fetch request to: ${apiUrl}`);
      console.log(`Request payload:`, {
        messages: messagesWithUser,
        model: modelName,
        webSearch: webSearch
      });
      
      // Make API call with streaming
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          messages: messagesWithUser,
          model: modelName,
          webSearch: webSearch
        }),
      })
      .then(response => {
        console.log(`Response from ${provider} API:`, response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
        }
        
        // Check the content type to decide how to handle the response
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type of response:`, contentType);
        
        if (contentType && contentType.includes('application/json')) {
          // Handle JSON response for our test
          console.log(`Handling JSON response from ${provider}`);
          return response.json().then(data => {
            console.log(`Received JSON data:`, data);
            // Update the message with the response content
            const updatedMessages = messages.map(msg => 
              msg.id === responseId 
                ? { ...msg, content: data.content || JSON.stringify(data) } 
                : msg
            );
            
            onMessagesUpdate(id, updatedMessages);
          });
        } else {
          // Handle streaming response
          console.log(`Starting stream processing for ${provider}`);
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let content = '';
          
          // Read the stream
          function readStream() {
            reader.read().then(({ done, value }) => {
              if (done) {
                console.log(`Stream from ${provider} completed`);
                return;
              }
              
              // Append to content
              const chunk = decoder.decode(value, { stream: true });
              console.log(`Received chunk from ${provider}:`, chunk.length > 50 ? chunk.substring(0, 50) + '...' : chunk);
              content += chunk;
              
              // Update the message with current content
              const updatedMessages = messages.map(msg => 
                msg.id === responseId 
                  ? { ...msg, content: content } 
                  : msg
              );
              
              onMessagesUpdate(id, updatedMessages);
              
              // Continue reading
              readStream();
            }).catch(error => {
              console.error(`Error reading stream from ${provider}:`, error);
              // Handle error and keep the partial content
            });
          }
          
          readStream();
          
          // Return to avoid multiple returns
          return Promise.resolve();
        }
      })
      .catch(error => {
        console.error(`Error calling ${provider} API:`, error);
        // Replace the empty message with an error message
        const updatedMessages = messages.map(msg => 
          msg.id === responseId 
            ? { ...msg, content: `There was an error processing your request: ${error.message}` } 
            : msg
        );
        
        onMessagesUpdate(id, updatedMessages);
      });
    }
  };

  // Add this handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This is a dummy handler since we're using the shared input 
    // The actual input is handled at the page level
    console.log('Input change in child component:', e.target.value);
  };

  return (
    <ChatInterface
      id={id}
      modelName={modelName}
      provider={provider}
      description={description}
      messages={messages}
      initialStatus={initialStatus}
      onStatusChange={(status) => onStatusChange(id, status)}
      onDelete={() => onDelete(id)}
      providersData={providersData}
      input={userInput}
      onInputChange={handleInputChange}
      onSubmit={(e) => {
        if (initialStatus === ModelStatus.ACTIVE && userInput.trim()) {
          handleSubmit(e);
        }
      }}
    />
  );
} 