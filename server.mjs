import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const fallbackQuestionBank = {
  science: [
    {
      question: 'What planet is known as the Red Planet?',
      choices: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
      answerIndex: 1,
      explanation: 'Mars appears red due to iron oxide (rust) on its surface.'
    },
    {
      question: 'What gas do plants absorb from the atmosphere during photosynthesis?',
      choices: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'],
      answerIndex: 2,
      explanation: 'Plants absorb carbon dioxide and release oxygen during photosynthesis.'
    }
  ],
  history: [
    {
      question: 'In which year did the first moon landing occur?',
      choices: ['1965', '1969', '1972', '1959'],
      answerIndex: 1,
      explanation: 'Apollo 11 landed on the moon in 1969.'
    },
    {
      question: 'Who was the first President of the United States?',
      choices: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'John Adams'],
      answerIndex: 2,
      explanation: 'George Washington served as the first U.S. president from 1789 to 1797.'
    }
  ],
  sports: [
    {
      question: 'How many points is a touchdown worth in American football (before extra point)?',
      choices: ['3', '6', '7', '2'],
      answerIndex: 1,
      explanation: 'A touchdown is worth 6 points before the conversion attempt.'
    },
    {
      question: 'Which sport uses a shuttlecock?',
      choices: ['Tennis', 'Squash', 'Badminton', 'Table tennis'],
      answerIndex: 2,
      explanation: 'Badminton is played with a shuttlecock.'
    }
  ],
  geography: [
    {
      question: 'What is the largest ocean on Earth?',
      choices: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
      answerIndex: 3,
      explanation: 'The Pacific Ocean is Earth’s largest and deepest ocean basin.'
    },
    {
      question: 'Which country has the largest population in the world as of 2026?',
      choices: ['India', 'China', 'United States', 'Indonesia'],
      answerIndex: 0,
      explanation: 'India surpassed China in population in 2023 and remains the largest in 2026.'
    }
  ]
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function pickFallbackQuestion(topic) {
  const key = fallbackQuestionBank[topic] ? topic : 'science';
  const questions = fallbackQuestionBank[key];
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

async function generateQuestionWithAI(topic) {
  const prompt = `Create ONE multiple-choice trivia question about ${topic}.
Return strict JSON with this shape:
{
  "question": "string",
  "choices": ["A", "B", "C", "D"],
  "answerIndex": 0,
  "explanation": "one short sentence"
}
Rules:
- exactly 4 answer choices
- answerIndex must be 0-3
- keep language clear for beginners`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'trivia_question',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              question: { type: 'string' },
              choices: {
                type: 'array',
                minItems: 4,
                maxItems: 4,
                items: { type: 'string' }
              },
              answerIndex: {
                type: 'integer',
                minimum: 0,
                maximum: 3
              },
              explanation: { type: 'string' }
            },
            required: ['question', 'choices', 'answerIndex', 'explanation']
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const jsonText = data?.output?.[0]?.content?.[0]?.text;
  if (!jsonText) {
    throw new Error('OpenAI response did not include structured text output.');
  }

  return JSON.parse(jsonText);
}

async function handleTriviaRequest(req, res) {
  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    const parsed = body ? JSON.parse(body) : {};
    const topic = typeof parsed.topic === 'string' ? parsed.topic.toLowerCase() : 'science';

    if (!OPENAI_API_KEY) {
      const fallbackQuestion = pickFallbackQuestion(topic);
      return sendJson(res, 200, {
        source: 'fallback',
        ...fallbackQuestion
      });
    }

    try {
      const aiQuestion = await generateQuestionWithAI(topic);
      return sendJson(res, 200, {
        source: 'openai',
        ...aiQuestion
      });
    } catch (error) {
      const fallbackQuestion = pickFallbackQuestion(topic);
      return sendJson(res, 200, {
        source: 'fallback',
        warning: error.message,
        ...fallbackQuestion
      });
    }
  } catch (error) {
    return sendJson(res, 400, { error: `Invalid request: ${error.message}` });
  }
}

async function serveStatic(req, res) {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(process.cwd(), 'public', requestPath);

  try {
    const file = await readFile(filePath);
    const mimeType = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/trivia') {
    return handleTriviaRequest(req, res);
  }

  if (req.method === 'GET') {
    return serveStatic(req, res);
  }

  res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
});

server.listen(PORT, () => {
  console.log(`AI Trivia app running at http://localhost:${PORT}`);
});
