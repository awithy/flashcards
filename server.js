const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, 'public');
const quizDirectory = path.join(__dirname, 'quizzes');

function validateQuiz(data, fileName) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${fileName}: the root value must be an object`);
  }
  if (typeof data.name !== 'string' || !data.name.trim()) {
    throw new Error(`${fileName}: "name" must be a non-empty string`);
  }
  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    throw new Error(`${fileName}: "cards" must be a non-empty array`);
  }

  data.cards.forEach((card, index) => {
    if (!card || typeof card !== 'object' || Array.isArray(card)) {
      throw new Error(`${fileName}: card ${index + 1} must be an object`);
    }
    for (const field of ['question', 'answer']) {
      if (typeof card[field] !== 'string' || !card[field].trim()) {
        throw new Error(`${fileName}: card ${index + 1} needs a non-empty "${field}"`);
      }
    }
  });

  return {
    name: data.name.trim(),
    description: typeof data.description === 'string' ? data.description.trim() : '',
    cards: data.cards.map(({ question, answer }) => ({
      question: question.trim(),
      answer: answer.trim()
    }))
  };
}

async function readQuiz(fileName) {
  const source = await fs.readFile(path.join(quizDirectory, fileName), 'utf8');
  let data;
  try {
    data = JSON.parse(source);
  } catch (error) {
    throw new Error(`${fileName}: invalid JSON (${error.message})`);
  }
  return validateQuiz(data, fileName);
}

async function quizFileNames() {
  const entries = await fs.readdir(quizDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name)
    .sort();
}

app.get('/api/quizzes', async (_request, response) => {
  try {
    const quizzes = await Promise.all((await quizFileNames()).map(async (fileName) => {
      const quiz = await readQuiz(fileName);
      return {
        id: fileName.slice(0, -5),
        name: quiz.name,
        description: quiz.description,
        cardCount: quiz.cards.length
      };
    }));
    response.json({ quizzes });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Could not load quizzes: ${error.message}` });
  }
});

app.get('/api/quizzes/:id', async (request, response) => {
  try {
    const files = await quizFileNames();
    const fileName = files.find((name) => name.slice(0, -5) === request.params.id);
    if (!fileName) {
      return response.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = await readQuiz(fileName);
    response.json({ id: request.params.id, ...quiz });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Could not load quiz: ${error.message}` });
  }
});

app.use(express.static(publicDirectory));

app.listen(port, '0.0.0.0', () => {
  console.log(`Flashcards is running at http://0.0.0.0:${port}`);
});
