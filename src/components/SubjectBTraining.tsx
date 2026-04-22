import { useState, useCallback } from 'react';
import subjectBQuestions from '../data/subject-b-training.json';

interface Question {
  category: string;
  scenario: string;
  question: string;
  options: { text: string; correct: boolean }[];
  explanation: string;
}

type Mode = 'category' | 'quiz' | 'result';

const STORAGE_STATS = 'pm-b-stats';

interface Stats {
  total: number;
  correct: number;
  byCategory: Record<string, { total: number; correct: number }>;
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_STATS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { total: 0, correct: 0, byCategory: {} };
}

function saveStats(s: Stats) {
  localStorage.setItem(STORAGE_STATS, JSON.stringify(s));
}

export default function SubjectBTraining() {
  const [mode, setMode] = useState<Mode>('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pool, setPool] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [showScenario, setShowScenario] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [stats, setStats] = useState<Stats>(loadStats);

  const categories = Array.from(new Set(subjectBQuestions.map(q => q.category)));

  const startQuiz = useCallback((qs: Question[]) => {
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setIdx(0);
    setAnswered(false);
    setSelectedIdx(-1);
    setShowScenario(true);
    setCorrectCount(0);
    setMode('quiz');
  }, []);

  const handleAnswer = (optIdx: number) => {
    if (answered) return;
    setSelectedIdx(optIdx);
    setAnswered(true);

    const q = pool[idx];
    const isCorrect = q.options[optIdx].correct;
    if (isCorrect) setCorrectCount(c => c + 1);

    const newStats = { ...stats, total: stats.total + 1, correct: stats.correct + (isCorrect ? 1 : 0) };
    if (!newStats.byCategory[q.category]) newStats.byCategory[q.category] = { total: 0, correct: 0 };
    newStats.byCategory[q.category].total += 1;
    if (isCorrect) newStats.byCategory[q.category].correct += 1;
    setStats(newStats);
    saveStats(newStats);
  };

  const next = () => {
    if (idx + 1 < pool.length) {
      setIdx(i => i + 1);
      setAnswered(false);
      setSelectedIdx(-1);
      setShowScenario(true);
    } else {
      setMode('result');
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  if (mode === 'category') {
    return (
      <div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#e0e0f0' }}>Subject B Training</h2>
        <p className="text-sm mb-4" style={{ color: '#8888aa' }}>Scenario-based problems for Subject B exam preparation</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => {
            const count = subjectBQuestions.filter(q => q.category === cat).length;
            const selected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="px-3 py-2 rounded text-sm transition-colors border"
                style={{
                  backgroundColor: selected ? '#27ae60' : '#16162e',
                  borderColor: selected ? '#27ae60' : '#2a2a5a',
                  color: selected ? '#fff' : '#8888aa',
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => startQuiz(subjectBQuestions.filter(q => selectedCategories.includes(q.category)))}
            disabled={selectedCategories.length === 0}
            className="flex-1 py-3 rounded font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: selectedCategories.length > 0 ? '#27ae60' : '#2a2a5a' }}
          >
            Start ({subjectBQuestions.filter(q => selectedCategories.includes(q.category)).length} Qs)
          </button>
          <button
            onClick={() => startQuiz(subjectBQuestions)}
            className="flex-1 py-3 rounded font-medium transition-colors border"
            style={{ backgroundColor: '#16162e', borderColor: '#27ae60', color: '#27ae60' }}
          >
            All ({subjectBQuestions.length} Qs)
          </button>
        </div>
        {stats.total > 0 && (
          <div className="rounded p-4 mt-4" style={{ backgroundColor: '#16162e', border: '1px solid #2a2a5a' }}>
            <p style={{ color: '#8888aa' }} className="text-sm">Subject B Accuracy</p>
            <p className="text-2xl font-bold" style={{ color: '#27ae60' }}>
              {Math.round(stats.correct / stats.total * 100)}% ({stats.correct}/{stats.total})
            </p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'result') {
    const pct = Math.round(correctCount / pool.length * 100);
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#e0e0f0' }}>Subject B Training Complete</h2>
        <div className="rounded p-6 mb-6" style={{ backgroundColor: '#16162e' }}>
          <p className="text-4xl font-bold mb-2" style={{ color: pct >= 80 ? '#27ae60' : pct >= 60 ? '#f39c12' : '#e74c3c' }}>
            {pct}%
          </p>
          <p style={{ color: '#8888aa' }}>{correctCount} correct / {pool.length} total</p>
        </div>
        <button onClick={() => setMode('category')} className="w-full py-3 rounded font-medium text-white" style={{ backgroundColor: '#27ae60' }}>
          Back to Categories
        </button>
      </div>
    );
  }

  const q = pool[idx];
  const progress = ((idx + (answered ? 1 : 0)) / pool.length) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: '#8888aa' }}>{idx + 1} / {pool.length}</span>
        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#2a2a5a', color: '#27ae60' }}>
          {q.category}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: '#2a2a5a' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#27ae60' }} />
      </div>

      {showScenario && q.scenario && (
        <div className="rounded p-4 mb-4" style={{ backgroundColor: '#1a1a3e', border: '1px solid #2a2a5a' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: '#27ae60' }}>SCENARIO</span>
            {answered && (
              <button onClick={() => setShowScenario(false)} className="text-xs" style={{ color: '#8888aa' }}>
                Collapse
              </button>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#c0c0d0' }}>{q.scenario}</p>
        </div>
      )}

      {!showScenario && q.scenario && (
        <button
          onClick={() => setShowScenario(true)}
          className="w-full text-left text-xs px-3 py-2 rounded mb-3"
          style={{ backgroundColor: '#1a1a3e', border: '1px solid #2a2a5a', color: '#8888aa' }}
        >
          Show Scenario
        </button>
      )}

      <p className="text-base mb-5 leading-relaxed font-medium" style={{ color: '#e0e0f0' }}>{q.question}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, oi) => {
          let bg = '#16162e';
          let border = '#2a2a5a';
          let color = '#e0e0f0';
          if (answered) {
            if (opt.correct) { bg = '#27ae6020'; border = '#27ae60'; color = '#27ae60'; }
            else if (oi === selectedIdx) { bg = '#e74c3c20'; border = '#e74c3c'; color = '#e74c3c'; }
          } else if (oi === selectedIdx) {
            bg = '#27ae6030'; border = '#27ae60'; color = '#fff';
          }
          return (
            <button
              key={oi}
              onClick={() => handleAnswer(oi)}
              disabled={answered}
              className="text-left p-3 rounded border transition-colors"
              style={{ backgroundColor: bg, borderColor: border, color }}
            >
              <span className="text-sm font-medium">{opt.text}</span>
              {answered && opt.correct && <span className="float-right text-sm">OK</span>}
              {answered && oi === selectedIdx && !opt.correct && <span className="float-right text-sm">X</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-4 rounded p-4" style={{ backgroundColor: '#16162e', border: '1px solid #2a2a5a' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#8888aa' }}>{q.explanation}</p>
        </div>
      )}
      {answered && (
        <button onClick={next} className="w-full mt-4 py-3 rounded font-medium text-white" style={{ backgroundColor: '#27ae60' }}>
          {idx + 1 < pool.length ? 'Next' : 'See Results'}
        </button>
      )}
    </div>
  );
}
