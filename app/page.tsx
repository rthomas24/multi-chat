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
import ImageGenerationGallery from '@/components/ImageGenerationGallery';

type ProviderKey = keyof typeof providersData;

const AGGREGATOR_SYSTEM_PROMPT = `You are an expert AI response synthesizer. You will be given an original user query followed by several AI-generated responses to that query. Your task is to:
1. Analyze all provided AI responses in conjunction with the original user query.
2. Identify the most accurate, relevant, and well-explained parts from each response.
3. Synthesize these parts into a single, coherent, and comprehensive final answer.
4. If there are conflicting pieces of information across responses, use your best judgment to determine the most accurate one or clearly state the discrepancy if it's irresolvable.
5. Do not refer to the fact that you are synthesizing responses (e.g., "Based on the responses provided..."). Directly present the synthesized answer as if you are answering the original query yourself.
6. Ensure the final response is well-structured, easy to understand, and directly addresses the original user query.
Present only this final, synthesized response.`;

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
  isAggregator?: boolean; // New flag
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
  {
    id: 'synthesizer-gpt4o-1',
    modelName: 'gpt-4o',
    displayName: 'Synthesizer (GPT-4o)',
    provider: 'OpenAI',
    description: 'Synthesizes responses from other active models into a final answer.',
    initialStatus: ModelStatus.ACTIVE,
    apiRoute: '/api/chat/openai',
    messages: [],
    isAggregator: true,
  },
];

const sortByStatus = (a: ChatModel, b: ChatModel) => {
  // Rule 1: Aggregator models always come after non-aggregator models.
  if (a.isAggregator && !b.isAggregator) {
    return 1; // a comes after b
  }
  if (!a.isAggregator && b.isAggregator) {
    return -1; // a comes before b
  }

  // Rule 2: If both are of the same type (both aggregators or both non-aggregators),
  // or for general sorting, use their status.
  const order = { [ModelStatus.ACTIVE]: 0, [ModelStatus.READY]: 1, [ModelStatus.INACTIVE]: 2 };
  
  // If their primary sort keys (aggregator vs. non-aggregator) are the same,
  // then sort by status.
  return order[a.initialStatus] - order[b.initialStatus];
};

// Helper function to fetch and stream response for a single primary model
async function fetchAndStreamPrimaryResponse(
  model: ChatModel,
  userMessageContent: string, // Original user input, potentially for context or logging
  messagesForApi: Message[], // Direct messages to send to the API
  placeholderId: string, // UI placeholder ID to update
  webSearchEnabled: boolean,
  onStreamUpdate: (modelId: string, newContent: string, targetMessageId: string) => void,
  onStreamEnd?: (modelId: string, finalContent: string) => void,
  onStreamError?: (modelId: string, errorMessage: string, targetMessageId: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageKey = `${model.provider.toLowerCase()}_api_key`;
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;

    if (!apiKey) {
      const errorContent = `Error: No API key found for ${model.provider}. Please add your API key.`;
      onStreamError?.(model.id, errorContent, placeholderId);
      reject(new Error(errorContent));
      return;
    }

    const apiUrl = model.apiRoute.startsWith('http') ? model.apiRoute : `${window.location.origin}${model.apiRoute}`;
    let accumulatedContent = '';

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({
        messages: messagesForApi,
        model: model.modelName,
        webSearch: webSearchEnabled,
      }),
    })
    .then(async response => {
      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => 'Failed to get error text.');
        const errorMsg = `API call failed for ${model.displayName}: ${response.status} ${errorText || 'No response body'}`;
        onStreamError?.(model.id, errorMsg, placeholderId);
        reject(new Error(errorMsg));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const readStream = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            onStreamEnd?.(model.id, accumulatedContent);
            resolve(accumulatedContent);
            return;
          }
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          onStreamUpdate(model.id, accumulatedContent, placeholderId);
          readStream();
        }).catch((error) => {
          const streamErrorMsg = `Error reading stream for ${model.displayName}: ${error.message}`;
          onStreamError?.(model.id, streamErrorMsg, placeholderId);
          reject(error);
        });
      };
      readStream();
    })
    .catch(error => {
      const fetchErrorMsg = `Fetch error for ${model.displayName}: ${error.message}`;
      onStreamError?.(model.id, fetchErrorMsg, placeholderId);
      reject(error);
    });
  });
}

// New function to process the aggregator model
async function processAggregatorModel(
  aggregatorModel: ChatModel,
  originalUserInput: string,
  primaryModelSettledResponses: PromiseSettledResult<string>[],
  activePrimaryModels: ChatModel[], // Needed to map responses to displayNames
  setChatModelsCallback: React.Dispatch<React.SetStateAction<ChatModel[]>>,
  onStreamUpdateCallback: (modelId: string, newContent: string, targetMessageId: string) => void,
  onStreamErrorCallback: (modelId: string, errorMessage: string, targetMessageId: string) => void
) {
  let compiledResponsesContent = `Original User Query:\n${originalUserInput}\n\nAI Responses:\n`;
  let hasSuccessfulPrimaryResponses = false;

  primaryModelSettledResponses.forEach((result, index) => {
    const model = activePrimaryModels[index];
    if (result.status === 'fulfilled') {
      compiledResponsesContent += `\n--- Response from ${model.displayName} ---\n${result.value}\n--- End of Response ---\n`;
      hasSuccessfulPrimaryResponses = true;
    } else {
      compiledResponsesContent += `\n--- Error from ${model.displayName} ---\n${result.reason?.message || 'Failed to get response'}\n--- End of Error ---\n`;
    }
  });

  if (!hasSuccessfulPrimaryResponses && activePrimaryModels.length > 0) {
    // Optional: Add a note to compiledResponsesContent if all primary models failed
    // compiledResponsesContent += "\n\nNote: All primary AI models failed to provide a response.";
  }

  const aggregatorSystemMessage: Message = { id: `sys-agg-${Date.now()}`, role: 'system', content: AGGREGATOR_SYSTEM_PROMPT };
  const aggregatorUserPrompt: Message = { id: `user-agg-${Date.now()}`, role: 'user', content: compiledResponsesContent };
  const aggregatorPlaceholderId = `asst-agg-ph-${aggregatorModel.id}-${Date.now()}`;

  // Update aggregator UI with its prompt messages and placeholder
  setChatModelsCallback(prev =>
    prev.map(chat =>
      chat.id === aggregatorModel.id
        ? { ...chat, messages: [aggregatorUserPrompt, { id: aggregatorPlaceholderId, role: 'assistant' as const, content: '' }] }
        : chat
    ).sort(sortByStatus)
  );
  
  try {
    await fetchAndStreamPrimaryResponse(
      aggregatorModel,
      compiledResponsesContent, 
      [aggregatorSystemMessage, aggregatorUserPrompt],
      aggregatorPlaceholderId,
      false, 
      onStreamUpdateCallback,
      undefined,
      onStreamErrorCallback
    );
  } catch (error) {
    console.error(`Aggregator processing failed for ${aggregatorModel.displayName}:`, error);
  }
}

export default function Home() {
  const [chatModels, setChatModels] = useState<ChatModel[]>([...initialChatModels].sort(sortByStatus));
  const [userInput, setUserInput] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const [currentMode, setCurrentMode] = useState<'chat' | 'pictures'>('chat');
  const [imagePrompt, setImagePrompt] = useState('');

  const aggregatorModel = chatModels.find(model => model.isAggregator);
  const regularModels = chatModels.filter(model => !model.isAggregator);

  const handleStatusChange = (id: string, newStatus: ModelStatus) => {
    setChatModels(prev =>
      prev.map(model => (model.id === id ? { ...model, initialStatus: newStatus } : model)).sort(sortByStatus)
    );
  };

  const handleDelete = (id: string) => {
    setChatModels(prev => prev.filter(model => model.id !== id).sort(sortByStatus));
  };

  const handleSwitchModel = (chatId: string, newModelName: string) => {
    setChatModels(prevChatModels =>
      prevChatModels.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            modelName: newModelName,
            displayName: modelDisplayNameMap[newModelName] || newModelName,
            messages: [], // Clear messages on model switch
          };
        }
        return chat;
      }).sort(sortByStatus)
    );
  };

  const handleAddModel = (newModelData: Omit<ChatModel, 'id' | 'apiRoute' | 'messages' | 'displayName'> & { modelName: string }) => {
    const apiRoute = `/api/chat/${newModelData.provider.toLowerCase()}`;
    const count = chatModels.filter(m => m.modelName === newModelData.modelName && m.provider === newModelData.provider).length; // Ensure count is specific to provider+model
    const displayName = modelDisplayNameMap[newModelData.modelName] || newModelData.modelName;
    const newChat: ChatModel = {
      ...newModelData,
      id: `${newModelData.provider.toLowerCase()}-${newModelData.modelName.toLowerCase().replace(/[\s.-]+/g, '-')}-${count + 1}`,
      apiRoute,
      displayName,
      messages: [],
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
      const currentRegularModels = prev.filter(m => !m.isAggregator);
      const currentAggregatorModel = prev.find(m => m.isAggregator);
      
      const items = [...currentRegularModels];
      const [movedItem] = items.splice(dragIndex, 1);
      items.splice(dropIndex, 0, movedItem);
      
      return currentAggregatorModel ? [...items, currentAggregatorModel].sort(sortByStatus) : items.sort(sortByStatus);
    });
    endDrag();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleModeToggle = () => {
    setCurrentMode(prevMode => prevMode === 'chat' ? 'pictures' : 'chat');
    // Potentially clear messages or reset UI elements based on mode change later
    console.log("Mode switched to: ", currentMode === 'chat' ? 'pictures' : 'chat'); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const originalUserInput = userInput;
    const userMessageId = `user-${Date.now()}`;
    const userMessageForDisplay: Message = { id: userMessageId, role: 'user', content: originalUserInput };

    const activePrimaryModels = chatModels.filter(m => m.initialStatus === ModelStatus.ACTIVE && !m.isAggregator);
    const activeAggregatorModel = chatModels.find(m => m.initialStatus === ModelStatus.ACTIVE && m.isAggregator);

    const placeholderMap = new Map<string, string>();

    setChatModels(prev =>
      prev.map(chat => {
        if (chat.initialStatus === ModelStatus.ACTIVE) {
          const messagesWithUser = [...chat.messages, userMessageForDisplay];
          if (!chat.isAggregator) {
            const placeholderId = `asst-ph-${chat.id}-${Date.now()}`;
            placeholderMap.set(chat.id, placeholderId);
            return { ...chat, messages: [...messagesWithUser, { id: placeholderId, role: 'assistant' as const, content: '' }] };
          } else {
            return { ...chat, messages: messagesWithUser };
          }
        }
        return chat;
      }).sort(sortByStatus)
    );
    setUserInput('');

    const onStreamUpdate = (modelId: string, newContent: string, targetMessageId: string) => {
      setChatModels(prev => {
        const updatedModels = prev.map(chat => {
          if (chat.id === modelId) {
            const updatedMessages = chat.messages.map(msg =>
              msg.id === targetMessageId ? { ...msg, content: newContent } : msg
            );
            return { ...chat, messages: updatedMessages };
          }
          return chat;
        });
        return updatedModels.sort(sortByStatus);
      });
    };

    const onStreamError = (modelId: string, errorMessage: string, targetMessageId: string) => {
      setChatModels(prev =>
        prev.map(chat =>
          chat.id === modelId
            ? { ...chat, messages: chat.messages.map(msg => msg.id === targetMessageId ? { ...msg, content: `Error: ${errorMessage}` } : msg) }
            : chat
        ).sort(sortByStatus)
      );
    };

    const onStreamEndPrimary = (modelId: string, finalContent: string) => {
      const targetMessageId = placeholderMap.get(modelId);
      setChatModels(prev => {
        const modelExists = prev.some(chat => chat.id === modelId);
        if (!modelExists) {
            return prev.sort(sortByStatus);
        }
        return prev.map(chat =>
          chat.id === modelId
            ? { ...chat, messages: chat.messages.map(msg => msg.id === targetMessageId ? { ...msg, content: finalContent } : msg) }
            : chat
        ).sort(sortByStatus);
      });
    };

    const responsePromises = activePrimaryModels.map(model => {
      const messagesForThisApiCall = [...model.messages, userMessageForDisplay];
      const placeholderId = placeholderMap.get(model.id)!;
      return fetchAndStreamPrimaryResponse(
        model, 
        originalUserInput, 
        messagesForThisApiCall,
        placeholderId, 
        webSearchEnabled, 
        onStreamUpdate, 
        onStreamEndPrimary,
        onStreamError
      );
    });

    const settledResponses = await Promise.allSettled(responsePromises);

    // If aggregator is active, compile and send
    if (activeAggregatorModel) {
      await processAggregatorModel(
        activeAggregatorModel,
        originalUserInput,
        settledResponses,
        activePrimaryModels,
        setChatModels,
        onStreamUpdate,
        onStreamError
      );
    }
  };

  return (
    <div className={styles.page}>
      <Header currentMode={currentMode} onModeToggle={handleModeToggle} />
      <div className={styles.contentWrapper}>
        {currentMode === 'chat' ? (
          <>
            <h1 className={styles.heading}>
              One question, multiple perspectives
            </h1>
            <div className={styles.mainLayoutContainer}>
              {aggregatorModel && (
                <div className={styles.aggregatorContainer}>
                  <ChatModelWrapper
                    chat={aggregatorModel}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onMessagesUpdate={(id, messages) =>
                      setChatModels(prev => prev.map(chat => (chat.id === id ? { ...chat, messages } : chat)))
                    }
                    providersData={providersData}
                    availableModelsForProvider={(
                      providersData[aggregatorModel.provider]?.models.map((modelName: string) => ({
                        name: modelName,
                        displayName: modelDisplayNameMap[modelName] || modelName,
                      })) || []
                    )}
                    onSwitchModel={(newModelName) => handleSwitchModel(aggregatorModel.id, newModelName)}
                    isAggregator={aggregatorModel.isAggregator}
                  />
                </div>
              )}
              <div className={styles.chatGridContainer}>
                <div className={styles.chatGrid}>
                  {regularModels.map((chat, index) => (
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
                        isAggregator={chat.isAggregator}
                      />
                    </div>
                  ))}
                  <AddModelCard onModelAdded={handleAddModel} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <ImageGenerationGallery
            imagePrompt={imagePrompt}
            setImagePrompt={setImagePrompt}
          />
        )}
      </div>
      {currentMode === 'chat' && (
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
      )}
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
  isAggregator,
}: {
  chat: ChatModel;
  onStatusChange: (id: string, status: ModelStatus) => void;
  onDelete: (id: string) => void;
  onMessagesUpdate: (id: string, messages: Message[]) => void;
  providersData: any;
  availableModelsForProvider: Array<{ name: string; displayName: string }>;
  onSwitchModel: (newModelName: string) => void;
  isAggregator?: boolean;
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
      isAggregator={isAggregator}
      onStatusChange={(status) => onStatusChange(chat.id, status)}
      onDelete={() => onDelete(chat.id)}
      providersData={providersData}
      availableModelsForProvider={availableModelsForProvider}
      onSwitchModel={onSwitchModel}
    />
  );
}