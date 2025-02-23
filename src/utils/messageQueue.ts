import { callModel } from './modelProviders';
import { ModelStatus } from '@/types/Status';

interface QueueItem {
  id: string;
  provider: string;
  modelName: string;
  prompt: string;
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
      const response = await callModel(item.provider, {
        prompt: item.prompt,
        model: item.modelName
      });
      
      // Dispatch event with response
      const event = new CustomEvent('model-response', {
        detail: {
          id: item.id,
          content: response.content,
          error: response.error
        }
      });
      window.dispatchEvent(event);
    });

    await Promise.all(promises);
    this.queue = [];
    this.isProcessing = false;
  }
}

export const messageQueue = new MessageQueue(); 