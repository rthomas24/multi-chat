# Multi-Chat

Multi-Chat is a Next.js application that allows you to chat with multiple AI models simultaneously. Compare responses from different AI providers side by side in a clean, intuitive interface.

## Features

- **Multi-Model Chat**: Chat with multiple AI models at the same time
- **Supported Providers**: 
  - OpenAI (GPT models)
  - Anthropic (Claude models)
  - Google (Gemini models)
  - xAI (Grok models)
- **Responsive UI**: Drag and drop interface to organize your chat models
- **Streaming Responses**: Real-time streaming of AI responses
- **Code Highlighting**: Automatic syntax highlighting for code blocks
- **API Key Management**: Securely manage your API keys for different providers

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

1. **Adding Models**: Click the "+" card to add a new AI model to your chat interface
2. **Managing API Keys**: Click the key icon in the header to manage your API keys
3. **Chatting**: Type your message in the input field at the top and press Enter to send to all active models
4. **Model Status**:
   - Active: Model will receive and respond to messages
   - Ready: Model is available but won't receive messages
   - Minimized: Model is collapsed to save space
5. **Organizing**: Drag and drop chat cards to rearrange them

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
