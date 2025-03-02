import { callModel } from './modelProviders';

interface QueueItem {
  id: string;
  provider: string;
  modelName: string;
  prompt: string;
  webSearch?: boolean;
}

class MessageQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;

  addToQueue(items: QueueItem[]) {
    this.queue.push(...items);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const promises = this.queue.map(async (item) => {
      // Start streaming for this item
      window.dispatchEvent(
        new CustomEvent('stream-start', { detail: { id: item.id } })
      );
      
      try {
        const response = callModel(item.provider, item.modelName, item.prompt);
        
        if (response.error) {
          console.error(`Error from ${item.provider}:`, response.error);
          window.dispatchEvent(
            new CustomEvent('stream-end', {
              detail: {
                id: item.id,
                webSearch: item.webSearch
              }
            })
          );
          return;
        }
        
        if (response.stream) {
          // Process the stream
          try {
            const reader = response.stream.getReader();
            
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }
              
              // Dispatch chunk event
              window.dispatchEvent(
                new CustomEvent('stream-chunk', {
                  detail: {
                    id: item.id,
                    chunk: value
                  }
                })
              );
            }
            
            // Dispatch stream end event
            window.dispatchEvent(
              new CustomEvent('stream-end', {
                detail: {
                  id: item.id,
                  webSearch: item.webSearch
                }
              })
            );
          } catch (error) {
            console.error('Error processing stream:', error);
            window.dispatchEvent(
              new CustomEvent('stream-end', {
                detail: {
                  id: item.id,
                  webSearch: item.webSearch
                }
              })
            );
          }
        } else {
          // If no stream is available, end the stream with the content
          window.dispatchEvent(
            new CustomEvent('stream-chunk', {
              detail: {
                id: item.id,
                chunk: response.content
              }
            })
          );
          
          window.dispatchEvent(
            new CustomEvent('stream-end', {
              detail: {
                id: item.id,
                webSearch: item.webSearch
              }
            })
          );
        }
      } catch (error) {
        console.error(`Error calling ${item.provider}:`, error);
        window.dispatchEvent(
          new CustomEvent('stream-end', {
            detail: {
              id: item.id,
              webSearch: item.webSearch
            }
          })
        );
      }
    });

    await Promise.all(promises);
    this.queue = [];
    this.isProcessing = false;
  }
}

export const messageQueue = new MessageQueue(); 