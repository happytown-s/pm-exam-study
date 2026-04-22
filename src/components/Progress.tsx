import { useState } from 'react';

interface StatsEntry {
  total: number;
  correct: number;
}

const STORAGE_QUIZ = 'pm-quiz-stats';
const STORAGE_CALC = 'pm-calc-stats';
const STORAGE_B = 'pm-b-stats';
const STORAGE_WRONG = 'pm-quiz-wrong';

interface Stats {
  total: number;
  correct: number;
  byCategory: Record<string, StatsEntry>;
}

function loadStats(key: string): Stats {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { total: 0, correct: 0, byCategory: {} };
}

function loadWrong(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_WRONG);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

type Section = 'quiz' | 'calc' | 'subjectb';

export default function Progress() {
  const [section, setSection] = useState<Section>('quiz');

  const quizStats = loadStats(STORAGE_QUIZ);
  const calcStats = loadStats(STORAGE_CALC);
  const bStats = loadStats(STORAGE_B);
  const wrongIds = loadWrong();

  const stats = section === 'quiz' ? quizStats : section === 'calc' ? calcStats : bStats;
  const overallPct = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;

  const cats = Object.entries(stats.byCategory).sort(([, a], [, b]) => {
    const pa = a.total > 0 ? a.correct / a.total : 0;
    const pb = b.total > 0 ? b.correct / b.total : 0;
    return pa - pb;
  });

  const sectionLabels: Record<Section, string> = {
    quiz: 'Quiz',
    calc: 'Calc Training',
    subjectb: 'Subject B',
  };

  const clearSection = () => {
    const key = section === 'quiz' ? STORAGE_QUIZ : section === 'calc' ? STORAGE_CALC : STORAGE_B;
    localStorage.removeItem(key);
    if (section === 'quiz') localStorage.removeItem(STORAGE_WRONG);
    window.location.reload();
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4" style={{ color: '#e0e0f0' }}>Progress</h2>

      <div className="flex gap-2 mb-6">
        {(['quiz', 'calc', 'subjectb'] as Section[]).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className="flex-1 py-2 rounded text-sm font-medium transition-colors border"
            style={{
              backgroundColor: section === s ? '#27ae60' : '#16162e',
              borderColor: section === s ? '#27ae60' : '#2a2a5a',
              color: section === s ? '#fff' : '#8888aa',
            }}
          >
            {sectionLabels[s]}
          </button>
        ))}
      </div>

      <div className="rounded p-5 mb-6" style={{ backgroundColor: '#16162e', border: '1px solid #2a2a5a' }}>
        <p className="text-sm mb-1" style={{ color: '#8888aa' }}>{sectionLabels[section]} - Overall Accuracy</p>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-bold" style={{ color: overallPct >= 80 ? '#27ae60' : overallPct >= 60 ? '#f39c12' : '#e74c3c' }}>
            {overallPct}%
          </p>
          <p className="text-sm pb-1" style={{ color: '#8888aa' }}>
            {stats.correct} / {stats.total} questions
          </p>
        </div>
        <div className="w-full h-2 rounded-full mt-3" style={{ backgroundColor: '#2a2a5a' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${overallPct}%`,
              backgroundColor: overallPct >= 80 ? '#27ae60' : overallPct >= 60 ? '#f39c12' : '#e74c3c',
            }}
          />
        </div>
      </div>

      {section === 'quiz' && wrongIds.length > 0 && (
        <div className="rounded p-4 mb-6" style={{ backgroundColor: '#e74c3c15', border: '1px solid #e74c3c40' }}>
          <p className="text-sm font-medium" style={{ color: '#e74c3c' }}>
            {wrongIds.length} questions in wrong-answer review queue
          </p>
        </div>
      )}

      {cats.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: '#8888aa' }}>By Category</h3>
          <div className="flex flex-col gap-2">
            {cats.map(([cat, data]) => {
              const pct = data.total > 0 ? Math.round(data.correct / data.total * 100) : 0;
              const color = pct >= 80 ? '#27ae60' : pct >= 60 ? '#f39c12' : '#e74c3c';
              return (
                <div key={cat} className="rounded p-3" style={{ backgroundColor: '#16162e', border: '1px solid #2a2a5a' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: '#e0e0f0' }}>{cat}</span>
                    <span className="text-sm font-medium" style={{ color }}>
                      {pct}% ({data.correct}/{data.total})
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#2a2a5a' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cats.length === 0 && stats.total === 0 && (
        <div className="text-center py-8">
          <p style={{ color: '#8888aa' }}>No data yet. Start practicing to see your progress!</p>
        </div>
      )}

      {stats.total > 0 && (
        <button
          onClick={clearSection}
          className="w-full mt-6 py-2 rounded text-sm transition-colors border"
          style={{ backgroundColor: '#16162e', borderColor: '#e74c3c', color: '#e74c3c' }}
        >
          Reset {sectionLabels[section]} Stats
        </button>
      )}
    </div>
  );
}
