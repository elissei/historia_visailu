import { useEffect, useMemo, useState } from 'react';
import questions from './data/questions';

type Subject = 'history';
type Question = {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation?: string;
};

type Result = {
  name: string;
  subject: Subject;
  score: number;
  total: number;
  date: string;
};

const LOCAL_STORAGE_KEY = 'historia-visailu-tulokset';
const forbiddenNames = ['pippeli', 'pillu', 'paska', 'perse', 'kyrpä', 'huora'];

const subjectMeta: Record<Subject, { label: string; description: string }> = {
  history: {
    label: 'Historia',
    description: 'Luokat 6–7: Suomen ja maailman historiaa. Nyt pelataan vain historian kysymyksillä.'
  }
};

function isAllowedName(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return !forbiddenNames.some((forbidden) => normalized.includes(forbidden));
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function App() {
  const [name, setName] = useState('');
  const subject: Subject = 'history';
  const [step, setStep] = useState<'start' | 'quiz' | 'finished'>('start');
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const question = gameQuestions[currentIndex];
  const progress = `${currentIndex + 1} / ${gameQuestions.length}`;
  const correctAnswer = question?.correct;

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(results));
  }, [results]);

  const leaderboard = useMemo(
    () => [...results].sort((a, b) => b.score - a.score).slice(0, 5),
    [results]
  );

  const handleStart = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Nimimerkki ei saa olla tyhjä.');
      return;
    }
    if (!isAllowedName(trimmedName)) {
      setNameError('Valitse ystävällisempi ja asiallisempi nimimerkki.');
      return;
    }
    const availableQuestions = [...questions.history['6'], ...questions.history['7']];
    if (availableQuestions.length === 0) {
      setNameError('Ei löytynyt kysymyksiä. Yritä myöhemmin uudelleen.');
      return;
    }
    setNameError(null);
    const newGameQuestions = shuffle(availableQuestions)
      .slice(0, Math.min(10, availableQuestions.length))
      .map((question) => ({
        ...question,
        options: shuffle(question.options)
      }));
    setGameQuestions(newGameQuestions);
    setStep('quiz');
    setCurrentIndex(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
  };

  const submitAnswer = (answer: string) => {
    if (showAnswer) return;
    setSelected(answer);
    setShowAnswer(true);
    if (answer === correctAnswer) {
      setScore((prev) => prev + 10);
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    setShowAnswer(false);
    if (currentIndex + 1 < gameQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      return;
    }
    const newResult: Result = {
      name: name.trim(),
      subject: 'history',
      score,
      total: gameQuestions.length * 10,
      date: new Date().toLocaleDateString('fi-FI'),
    };
    setResults((prev) => [newResult, ...prev]);
    setStep('finished');
  };

  const restart = () => {
    setStep('start');
    setName('');
    setCurrentIndex(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{subjectMeta[subject].label} visailu</p>
          <h1>{subjectMeta[subject].label} visailu</h1>
          <p>{subjectMeta[subject].description}</p>
        </div>
      </header>

      {step === 'start' && (
        <main className="card">
          <section className="panel">
            <h2>Rekisteröidy pelaajaksi</h2>
            <label>
              Nimimerkki
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kirjoita nimimerkki"
              />
            </label>
            {nameError && <p className="error-message">{nameError}</p>}
            <button className="primary" onClick={handleStart} disabled={!name.trim()}>
              Aloita testi
            </button>
            <p className="hint">Peli käyttää nyt enintään 10 kysymystä per kierros. Tämä on historian visailu, jossa kysymykset tulevat 6. ja 7. luokan historiasta.</p>
          </section>
        </main>
      )}

      {step === 'quiz' && (
        <main className="card quiz-card">
          <div className="quiz-header">
            <div>
              <p className="eyebrow">{progress}</p>
              <h2>{question.question}</h2>
            </div>
            <div className="score-badge">Pisteet: {score}</div>
          </div>

              <div className="answer-grid">
            {question.options.map((option) => {
              const isCorrect = showAnswer && option === correctAnswer;
              const isWrong = showAnswer && option === selected && option !== correctAnswer;
              return (
                <button
                  key={option}
                  className={`answer-button ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => submitAnswer(option)}
                  disabled={showAnswer}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="quiz-footer">
            {showAnswer && (
              <p className="feedback">
                {selected === correctAnswer ? 'Oikein! Hyvä työ.' : `Väärin. Oikea vastaus on: ${correctAnswer}.`}
              </p>
            )}
            <button className="primary" onClick={nextQuestion}>
              {currentIndex + 1 < gameQuestions.length ? 'Seuraava' : 'Näytä tulokset'}
            </button>
          </div>
        </main>
      )}

      {step === 'finished' && (
        <main className="card result-card">
          <h2>Tulokset</h2>
          <p className="summary">{name}, sait {score} / {gameQuestions.length * 10} pistettä historian visailussa.</p>
          <button className="primary" onClick={restart}>Pelaa uudelleen</button>
          <section className="leaderboard">
            <h3>Parhaat tulokset</h3>
            <table>
              <thead>
                <tr>
                  <th>Pelaaja</th>
                  <th>Pisteet</th>
                  <th>Päivä</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={`${entry.name}-${index}`}>
                    <td>{entry.name}</td>
                    <td>{entry.score}</td>
                    <td>{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
