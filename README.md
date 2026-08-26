# Flashcard Quiz

A local Node.js web app that loads flashcard quizzes from JSON files. Each round randomly selects up to 20 cards without replacement. Reveal each answer, mark yourself right or wrong, and see your final score.

## Run locally

```bash
./run-local.sh
```

Then open [http://localhost:3000](http://localhost:3000).

To use another port:

```bash
PORT=8080 ./run-local.sh
```

## Add a quiz

Create a `.json` file in `quizzes/`. The filename becomes its ID and each file uses this structure:

```json
{
  "name": "Quiz name",
  "description": "Optional short description",
  "cards": [
    {
      "question": "What is the question?",
      "answer": "This is the answer."
    }
  ]
}
```

Both `question` and `answer` must be non-empty strings. A quiz must contain at least one card; rounds use 20 cards or all available cards when there are fewer than 20.
