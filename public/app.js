const selectionScreen = document.querySelector('#selection-screen');
const quizScreen = document.querySelector('#quiz-screen');
const resultsScreen = document.querySelector('#results-screen');
const quizList = document.querySelector('#quiz-list');
const quizName = document.querySelector('#quiz-name');
const progressLabel = document.querySelector('#progress-label');
const scoreLabel = document.querySelector('#score-label');
const progressTrack = document.querySelector('.progress-track');
const progressBar = document.querySelector('#progress-bar');
const question = document.querySelector('#question');
const answer = document.querySelector('#answer');
const answerSection = document.querySelector('#answer-section');
const revealActions = document.querySelector('#reveal-actions');
const gradeActions = document.querySelector('#grade-actions');
const showAnswerButton = document.querySelector('#show-answer-button');
const wrongButton = document.querySelector('#wrong-button');
const rightButton = document.querySelector('#right-button');
const retryButton = document.querySelector('#retry-button');

const state = {
  quizzes: [],
  activeQuiz: null,
  cards: [],
  cardIndex: 0,
  correct: 0,
  answerVisible: false
};

function showScreen(screen) {
  [selectionScreen, quizScreen, resultsScreen].forEach((item) => {
    item.hidden = item !== screen;
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function createQuizButton(quiz) {
  const button = document.createElement('button');
  button.className = 'quiz-option';
  button.type = 'button';

  const icon = document.createElement('span');
  icon.className = 'quiz-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = quiz.name.charAt(0).toUpperCase();

  const text = document.createElement('span');
  text.className = 'quiz-option-text';

  const title = document.createElement('strong');
  title.textContent = quiz.name;
  const description = document.createElement('span');
  description.textContent = quiz.description || 'Practice your knowledge with this flashcard set.';
  const count = document.createElement('small');
  const quizLength = Math.min(20, quiz.cardCount);
  count.textContent = `${quizLength} question${quizLength === 1 ? '' : 's'} per quiz · ${quiz.cardCount} cards available`;

  const arrow = document.createElement('span');
  arrow.className = 'quiz-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';

  text.append(title, description, count);
  button.append(icon, text, arrow);
  button.addEventListener('click', () => startQuiz(quiz.id));
  return button;
}

async function loadQuizzes() {
  try {
    const response = await fetch('/api/quizzes');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load quizzes');

    state.quizzes = data.quizzes;
    quizList.replaceChildren();
    if (state.quizzes.length === 0) {
      quizList.innerHTML = '<div class="status-card">No quizzes found. Add a JSON file to the <code>quizzes</code> directory.</div>';
      return;
    }
    state.quizzes.forEach((quiz) => quizList.append(createQuizButton(quiz)));
  } catch (error) {
    quizList.innerHTML = '';
    const message = document.createElement('div');
    message.className = 'status-card error-card';
    message.textContent = error.message;
    quizList.append(message);
  }
}

async function startQuiz(id) {
  quizList.classList.add('is-loading');
  try {
    const response = await fetch(`/api/quizzes/${encodeURIComponent(id)}`);
    const quiz = await response.json();
    if (!response.ok) throw new Error(quiz.error || 'Could not load quiz');

    state.activeQuiz = quiz;
    state.cards = shuffle(quiz.cards).slice(0, 20);
    state.cardIndex = 0;
    state.correct = 0;
    quizName.textContent = quiz.name;
    progressTrack.setAttribute('aria-valuemax', String(state.cards.length));
    showScreen(quizScreen);
    renderCard();
  } catch (error) {
    window.alert(error.message);
  } finally {
    quizList.classList.remove('is-loading');
  }
}

function renderCard() {
  const card = state.cards[state.cardIndex];
  state.answerVisible = false;
  question.textContent = card.question;
  answer.textContent = card.answer;
  answerSection.hidden = true;
  revealActions.hidden = false;
  gradeActions.hidden = true;

  const cardNumber = state.cardIndex + 1;
  progressLabel.textContent = `Card ${cardNumber} of ${state.cards.length}`;
  scoreLabel.textContent = `${state.correct} correct`;
  progressTrack.setAttribute('aria-valuenow', String(state.cardIndex));
  progressBar.style.width = `${(state.cardIndex / state.cards.length) * 100}%`;
  showAnswerButton.focus();
}

function revealAnswer() {
  if (state.answerVisible || quizScreen.hidden) return;
  state.answerVisible = true;
  answerSection.hidden = false;
  revealActions.hidden = true;
  gradeActions.hidden = false;
  rightButton.focus();
}

function gradeCard(gotItRight) {
  if (!state.answerVisible || quizScreen.hidden) return;
  if (gotItRight) state.correct += 1;
  state.cardIndex += 1;

  if (state.cardIndex < state.cards.length) {
    renderCard();
  } else {
    showResults();
  }
}

function showResults() {
  const total = state.cards.length;
  const percentage = Math.round((state.correct / total) * 100);
  document.querySelector('#score-percent').textContent = `${percentage}%`;
  document.querySelector('#score-fraction').textContent = `${state.correct} / ${total}`;
  document.querySelector('#result-summary').textContent = `You marked ${state.correct} correct and ${total - state.correct} incorrect in ${state.activeQuiz.name}.`;

  let message = 'Keep practicing—you’re building recall.';
  if (percentage === 100) message = 'Perfect score. Outstanding!';
  else if (percentage >= 80) message = 'Great work—you know this set well.';
  else if (percentage >= 60) message = 'Good progress. One more round?';
  document.querySelector('#result-message').textContent = message;
  showScreen(resultsScreen);
  retryButton.focus();
}

function returnHome() {
  showScreen(selectionScreen);
  state.activeQuiz = null;
  state.cards = [];
}

showAnswerButton.addEventListener('click', revealAnswer);
wrongButton.addEventListener('click', () => gradeCard(false));
rightButton.addEventListener('click', () => gradeCard(true));
document.querySelector('#exit-button').addEventListener('click', returnHome);
document.querySelector('#home-button').addEventListener('click', returnHome);
document.querySelector('#choose-quiz-button').addEventListener('click', returnHome);
retryButton.addEventListener('click', () => startQuiz(state.activeQuiz.id));

document.addEventListener('keydown', (event) => {
  if (quizScreen.hidden || event.repeat) return;
  if (!state.answerVisible && event.code === 'Space') {
    event.preventDefault();
    revealAnswer();
  } else if (state.answerVisible && event.key === '1') {
    gradeCard(false);
  } else if (state.answerVisible && event.key === '2') {
    gradeCard(true);
  }
});

loadQuizzes();
