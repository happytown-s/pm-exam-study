import { useState, useCallback } from 'react';
import questions from '../data/pm-exam.json';

interface Question {
  category: string;
  question: string;
  options: { text: string; correct: boolean }[];
  explanation: string;
}

type Mode = 'category' | 'quiz' | 'result';

const STORAGE_WRONG = 'pm-quiz-wrong';
const STORAGE_STATS = 'pm-quiz-stats';

const categoryNames: Record<string, string> = {
  'Project Planning': 'プロジェクト計画',
  'Project Execution & Control': 'プロジェクト実行と統制',
  'Risk Management': 'リスクマネジメント',
  'Quality Management': '品質マネジメント',
  'Cost Management': 'コストマネジメント',
  'Schedule Management': 'スケジュールマネジメント',
  'Stakeholder & Communication': 'ステークホルダとコミュニケーション',
  'Contract & Procurement': '契約と調達',
  'IT Governance & Audit': 'ITガバナンスと監査',
  'Service Management': 'サービスマネジメント',
};

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

function saveStats(stats: Stats) {
  localStorage.setItem(STORAGE_STATS, JSON.stringify(stats));
}

function loadWrong(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_WRONG);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveWrong(ids: number[]) {
  localStorage.setItem(STORAGE_WRONG, JSON.stringify(ids));
}

export default function Quiz() {
  const [mode, setMode] = useState<Mode>('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pool, setPool] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [correctCount, setCorrectCount] = useState(0);
  const [stats, setStats] = useState<Stats>(loadStats);

  const categories = Array.from(new Set(questions.map(q => q.category)));

  const wrongQuestions = loadWrong().map(i => questions[i]).filter(Boolean);
  const wrongCount = loadWrong().length;

  const startQuiz = useCallback((qs: Question[]) => {
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setIdx(0);
    setAnswered(false);
    setSelectedIdx(-1);
    setCorrectCount(0);
    setMode('quiz');
  }, []);

  const handleAnswer = (optIdx: number) => {
    if (answered) return;
    setSelectedIdx(optIdx);
    setAnswered(true);

    const q = pool[idx];
    const isCorrect = q.options[optIdx].correct;
    if (isCorrect) {
      setCorrectCount(c => c + 1);
    }

    const qIdx = questions.indexOf(q);
    const wrong = loadWrong().filter(i => i !== qIdx);
    if (!isCorrect) {
      if (!wrong.includes(qIdx)) wrong.push(qIdx);
    }
    saveWrong(wrong);

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
        <h2 className="text-lg font-bold mb-4" style={{ color: '#e0e0f0' }}>カテゴリを選択</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => {
            const count = questions.filter(q => q.category === cat).length;
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
                {categoryNames[cat] || cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => startQuiz(questions.filter(q => selectedCategories.includes(q.category)))}
            disabled={selectedCategories.length === 0}
            className="flex-1 py-3 rounded font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: selectedCategories.length > 0 ? '#27ae60' : '#2a2a5a' }}
          >
            開始 ({questions.filter(q => selectedCategories.includes(q.category)).length}問)
          </button>
          <button
            onClick={() => startQuiz(questions)}
            className="flex-1 py-3 rounded font-medium transition-colors border"
            style={{ backgroundColor: '#16162e', borderColor: '#27ae60', color: '#27ae60' }}
          >
            全問 ({questions.length}問)
          </button>
        </div>

        {wrongCount > 0 && (
          <button
            onClick={() => startQuiz(wrongQuestions)}
            className="w-full py-3 rounded font-medium text-white transition-colors mb-4"
            style={{ backgroundColor: '#e74c3c' }}
          >
            復習 ({wrongCount}問)
          </button>
        )}

        {stats.total > 0 && (
          <div className="rounded p-4 mt-4" style={{ backgroundColor: '#16162e', border: '1px solid #2a2a5a' }}>
            <p style={{ color: '#8888aa' }} className="text-sm">全体正解率</p>
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
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#e0e0f0' }}>問題集完了</h2>
        <div className="rounded p-6 mb-6" style={{ backgroundColor: '#16162e' }}>
          <p className="text-4xl font-bold mb-2" style={{ color: pct >= 80 ? '#27ae60' : pct >= 60 ? '#f39c12' : '#e74c3c' }}>
            {pct}%
          </p>
          <p style={{ color: '#8888aa' }}>{correctCount}問正解 / {pool.length}問中</p>
        </div>
        <button
          onClick={() => setMode('category')}
          className="w-full py-3 rounded font-medium text-white"
          style={{ backgroundColor: '#27ae60' }}
        >
          カテゴリに戻る
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
          {categoryNames[q.category] || q.category}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: '#2a2a5a' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#27ae60' }} />
      </div>
      <p className="text-base mb-5 leading-relaxed" style={{ color: '#e0e0f0' }}>{q.question}</p>
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
              {answered && opt.correct && <span className="float-right text-sm text-xs">正解</span>}
              {answered && oi === selectedIdx && !opt.correct && <span className="float-right text-sm text-xs">不正解</span>}
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
          {idx + 1 < pool.length ? '次へ' : '結果を見る'}
        </button>
      )}
    </div>
  );
}
