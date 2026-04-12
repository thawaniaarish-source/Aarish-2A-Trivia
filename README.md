# Trivia App (Static)

A fully static trivia app for learning basic web app development and immediate UI feedback.

## Features

- Login form with **name** and **email** before gameplay.
- Choose a category: Science, History, Sports, or Geography.
- Choose a difficulty level:
  - **Easy**: easier questions, **30 seconds** per question
  - **Medium**: tougher than easy, **45 seconds** per question
  - **Hard**: tougher than medium, **60 seconds** per question
- 15 built-in questions per category, split by difficulty buckets.
- One question shown at a time.
- **Score counter** that increases by 1 only when the selected answer is correct.
- Click an answer to instantly see:
  - the correct answer in green
  - all incorrect answers in red
  - a short explanation
- No backend/API required.

## Run locally

Because the app is static, you can run it in either of these ways:

1. Open `public/index.html` directly in your browser.
2. Or use any static file server, for example:

```bash
npm start
```

Then open `http://localhost:3000`.
