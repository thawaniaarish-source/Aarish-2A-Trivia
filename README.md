# AI Trivia (Local)

A simple AI-powered trivia app for learning prompt design and basic web app development.

## Features

- Choose a topic.
- Generate one multiple-choice trivia question.
- Pick an answer.
- Get instant correct/incorrect feedback with a short explanation.

## Local run

1. Start the app:

```bash
npm start
```

2. Open: `http://localhost:3000`

## Optional OpenAI integration

If you set an API key, the server will generate questions with OpenAI. Without a key, it uses a local fallback bank.

```bash
OPENAI_API_KEY=your_key_here npm start
```

Optional model override:

```bash
OPENAI_MODEL=gpt-4o-mini OPENAI_API_KEY=your_key_here npm start
```

## Prompting concept shown in this project

The server sends a constrained prompt and requests strict JSON output so the UI can safely render structured trivia data.
