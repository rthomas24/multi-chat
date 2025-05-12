# Multi-Chat
Chat with multiple AI models at once and see how they stack up against each other. Multi-Chat brings together responses from different AI providers in a sleek, easy-to-use interface that lets you compare their answers side by side, while also compiling them into a single, comprehensive final answer.

![multichat](https://github.com/user-attachments/assets/bfcd4ef1-b958-4b0c-afc8-24520fc95794)


## Features

- **Multi-Model Chat**: Chat with multiple AI models at the same time.
- **Aggregator Model**: Special chat interface that synthesizes responses from other active models into a final, comprehensive answer.
- **Supported Providers**: 
  - OpenAI (GPT models)
  - Anthropic (Claude models)
  - Google (Gemini models)
  - xAI (Grok models)
- **Model Switching**: Easily switch between different models from the same provider within a chat card.
- **Responsive & Modern UI**: 
  - Horizontal scrolling for chat cards.
  - Floating, semi-transparent input bar at the bottom.
  - Drag and drop interface to organize your chat models.
- **Streaming Responses**: Real-time streaming of AI responses.
- **Code Highlighting**: Automatic syntax highlighting for code blocks with copy functionality.
- **API Key Management**: Securely manage your API keys for different providers.
- **Web Search Toggle**: Enable or disable web search capabilities for models that support it.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: CSS Modules
- **AI Integration**: AI SDK for various providers
- **Animations**: React Spring for smooth UI transitions

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rthomas24/multi-chat.git
   cd multi-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## Usage

1. **Adding Models**: Click the "+" card to add a new AI model to your chat interface.
2. **Managing API Keys**: When adding a model, you'll be prompted for an API key if one isn't already stored for that provider.
3. **Chatting**: Type your message in the input field at the bottom and press Enter to send to all active models.
4. **Aggregator Model**: If an Aggregator model is active, it will automatically collect responses from other active models and provide a synthesized answer.
5. **Model Status**:
   - Active: Model will receive and respond to messages.
   - Ready: Model is available but won't receive messages.
6. **Organizing**: Drag and drop chat cards to rearrange them.
7. **Switching Models**: Click the model name in a chat card's header to switch to another model from the same provider.
8. **Web Search**: Toggle the globe icon in the input bar to enable/disable web search for relevant models.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
