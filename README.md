# AI Robot Planner

This is a NextJS application for generating robot project plans using AI.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables (see below)
4. Run the development server: `npm run dev`

## Environment Variables

This project requires the following environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Copy `.env.example` to `.env` and fill in your OpenAI API key.

## API Integration

This project uses direct OpenAI API calls for:
- **Text Generation**: GPT-4 Turbo for generating project descriptions, code, bills of materials, and assembly instructions
- **Image Generation**: GPT-Image-1 for generating robot concept images, circuit diagrams, and 3D model visualizations

The implementation uses the official OpenAI Node.js SDK for all API interactions.

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

For more details, check out the source code in `src/app/page.tsx`.
