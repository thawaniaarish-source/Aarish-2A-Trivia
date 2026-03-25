const topicSelect = document.querySelector('#topic');
const generateBtn = document.querySelector('#generateBtn');
const card = document.querySelector('#card');
const questionEl = document.querySelector('#question');
const answersEl = document.querySelector('#answers');
const feedbackEl = document.querySelector('#feedback');

let currentQuestion = null;

function resetCard() {
  answersEl.innerHTML = '';
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
}

function lockAnswers() {
  answersEl.querySelectorAll('button').forEach((button) => {
    button.disabled = true;
  });
}

function renderQuestion(payload) {
  currentQuestion = payload;
  card.classList.remove('hidden');
  resetCard();
  questionEl.textContent = payload.question;

  payload.choices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => handleAnswer(index));
    answersEl.appendChild(btn);
  });
}

function handleAnswer(selectedIndex) {
  if (!currentQuestion) return;

  const isCorrect = selectedIndex === currentQuestion.answerIndex;
  lockAnswers();

  answersEl.querySelectorAll('button').forEach((button, index) => {
    if (index === currentQuestion.answerIndex) {
      button.classList.add('correct');
    } else {
      button.classList.add('wrong');
    }
  });

  feedbackEl.classList.add(isCorrect ? 'correct' : 'wrong');
  feedbackEl.textContent = isCorrect
    ? `✅ Correct! ${currentQuestion.explanation}`
    : `❌ Not quite. ${currentQuestion.explanation}`;
}

async function generateQuestion() {
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  resetCard();

  try {
    const response = await fetch('/api/trivia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ topic: topicSelect.value })
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    renderQuestion(data);
  } catch (error) {
    card.classList.remove('hidden');
    feedbackEl.className = 'feedback wrong';
    feedbackEl.textContent = `Could not generate question: ${error.message}`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Trivia Question';
  }
}

generateBtn.addEventListener('click', generateQuestion);
