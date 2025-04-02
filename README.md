# AI Generator

A modern web application that provides various AI capabilities including chat, image generation, code assistance, and more.

## Features

- AI Chat with multiple models (OpenAI, Google Gemini, Anthropic Claude)
- Image Generation
- Code Assistant
- Research Assistant
- Travel Guide

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   # or
   pnpm install
   ```
3. Create a `.env.local` file in the root directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_key_here
   GOOGLE_API_KEY=your_google_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ```

4. Run the development server:
   ```
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Keys

This application now uses environment variables for API keys, providing better security and user experience. No need for users to enter API keys manually.

### How to obtain API keys:

- **OpenAI API Key**: Sign up at [OpenAI Platform](https://platform.openai.com) and create an API key
- **Google API Key**: Get access to Gemini API through [Google AI Studio](https://makersuite.google.com/)
- **Anthropic API Key**: Sign up for Claude access at [Anthropic](https://www.anthropic.com)

## Architecture

- Built with Next.js and React
- UI components with Radix UI and styled with Tailwind CSS
- Environment-based API integration
- Responsive design for all screen sizes

## Model Support

The application supports various AI models:
- OpenAI: GPT-4o, GPT-4, GPT-3.5-turbo
- Google: Gemini Pro
- Anthropic: Claude 3 Opus

## Development

To add more functionality or customize the application:

1. Modify API routes in `/app/api/` directory
2. Update UI components in `/components/` directory
3. Add new models in the `models` array in `components/model-selector.tsx` 