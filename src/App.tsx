import { useState } from 'react';
import Quiz from './components/Quiz';
import CalcTraining from './components/CalcTraining';
import SubjectBTraining from './components/SubjectBTraining';
import Progress from './components/Progress';

type Tab = 'quiz' | 'calc' | 'subjectb' | 'progress';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('quiz');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'quiz', label: 'Quiz' },
    { key: 'calc', label: 'Calc Training' },
    { key: 'subjectb', label: 'Subject B' },
    { key: 'progress', label: 'Progress' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0f23' }}>
      <header className="sticky top-0 z-10 border-b" style={{ backgroundColor: '#1a1a3e', borderColor: '#2a2a5a' }}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-center" style={{ color: '#27ae60' }}>PM Exam Study</h1>
          <nav className="flex gap-1 mt-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 py-2 px-3 rounded-t text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === tab.key ? '#27ae60' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : '#8888aa',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === 'quiz' && <Quiz />}
        {activeTab === 'calc' && <CalcTraining />}
        {activeTab === 'subjectb' && <SubjectBTraining />}
        {activeTab === 'progress' && <Progress />}
      </main>
    </div>
  );
}

export default App;
