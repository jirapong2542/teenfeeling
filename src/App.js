import React, { useMemo, useState } from 'react';
import './App.css';
import moonFull from './1.jpg';
import DevelopmentNotice from './DevelopmentNotice';
import StoryShareDock from './StoryShareDock';

const STORAGE_KEY = 'leave-a-light-marks';

const moods = [
  { id: 'missing', label: 'คิดถึง', color: '#f6ead2', glow: 'rgba(246, 234, 210, 0.72)' },
  { id: 'lonely', label: 'เหงา', color: '#bcd8ff', glow: 'rgba(188, 216, 255, 0.72)' },
  { id: 'calm', label: 'สงบ', color: '#e8f4ff', glow: 'rgba(232, 244, 255, 0.72)' },
  { id: 'tired', label: 'เหนื่อย', color: '#c8c8c8', glow: 'rgba(200, 200, 200, 0.62)' },
  { id: 'hope', label: 'มีหวัง', color: '#ffe7a8', glow: 'rgba(255, 231, 168, 0.78)' },
];

const seedMarks = [
  {
    id: 'seed-1',
    x: 36,
    y: 43,
    mood: moods[0],
    message: 'คิดถึงใครบางคนในคืนที่ฟ้าเงียบมาก',
    time: '21:42',
  },
  {
    id: 'seed-2',
    x: 58,
    y: 31,
    mood: moods[2],
    message: 'วันนี้แค่ได้มองพระจันทร์ก็พอแล้ว',
    time: '22:08',
  },
  {
    id: 'seed-3',
    x: 67,
    y: 57,
    mood: moods[3],
    message: 'เหนื่อย แต่ยังอยากสว่างได้อีกนิด',
    time: '23:16',
  },
  {
    id: 'seed-4',
    x: 45,
    y: 68,
    mood: moods[4],
    message: 'ขอให้พรุ่งนี้ใจดีกว่าวันนี้',
    time: '00:03',
  },
];

function normalizeMark(mark) {
  const mood = moods.find((item) => item.id === mark.mood?.id || item.label === mark.mood?.label) || moods[0];

  return {
    ...mark,
    mood,
  };
}

function getInitialMarks() {
  try {
    const storedMarks = window.localStorage.getItem(STORAGE_KEY);
    return storedMarks ? JSON.parse(storedMarks).map(normalizeMark) : seedMarks;
  } catch {
    return seedMarks;
  }
}

function getTime() {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function createMoonPosition() {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * 34;

  return {
    x: Math.round((50 + Math.cos(angle) * radius) * 10) / 10,
    y: Math.round((50 + Math.sin(angle) * radius) * 10) / 10,
  };
}

function App() {
  const [marks, setMarks] = useState(getInitialMarks);
  const [selectedMood, setSelectedMood] = useState(moods[0]);
  const [message, setMessage] = useState('');
  const [activeMark, setActiveMark] = useState(seedMarks[0]);
  const [storyMark, setStoryMark] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const moodCounts = useMemo(() => {
    return moods.map((mood) => ({
      ...mood,
      count: marks.filter((mark) => mark.mood.id === mood.id).length,
    }));
  }, [marks]);

  const saveMarks = (nextMarks) => {
    setMarks(nextMarks);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMarks));
  };

  const leaveLight = (event) => {
    event.preventDefault();
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      setFormError('ฝากไว้สักหนึ่งประโยคก่อนนะ');
      return;
    }

    const nextMark = {
      id: Date.now().toString(),
      ...createMoonPosition(),
      mood: selectedMood,
      message: cleanMessage,
      time: getTime(),
    };
    const nextMarks = [nextMark, ...marks].slice(0, 36);

    saveMarks(nextMarks);
    setActiveMark(nextMark);
    setStoryMark(nextMark);
    setComposerOpen(false);
    setMessage('');
    setFormError('');
  };

  return (
    <main className='app-shell'>
      <DevelopmentNotice />

      <section className='moon-room' aria-label='Leave a light on the moon'>
        <div className='star-field' />

        <nav className='topbar' aria-label='Main navigation'>
          <a className='brand' href='https://www.instagram.com/t__n_f__ling/'>
            t__n_f__ling
          </a>
          <a className='ig-link' href='https://www.instagram.com/t__n_f__ling/'>
            instagram
          </a>
        </nav>

        <div className='moon-stage'>
          <div className='orbit orbit-one' />
          <div className='orbit orbit-two' />

          <div className='moon-visual' aria-label='Interactive moon with shared lights'>
            <img src={moonFull} alt='พระจันทร์เต็มดวง' />
            {marks.map((mark) => (
              <button
                aria-label={`อ่านข้อความอารมณ์${mark.mood.label}`}
                className={activeMark.id === mark.id ? 'moon-light active' : 'moon-light'}
                key={mark.id}
                onClick={() => {
                  setActiveMark(mark);
                  setStoryMark(mark);
                }}
                style={{
                  '--x': `${mark.x}%`,
                  '--y': `${mark.y}%`,
                  '--light': mark.mood.color,
                  '--glow': mark.mood.glow,
                }}
                type='button'
              />
            ))}
          </div>
        </div>

        <div className='hero-copy'>
          <p className='eyebrow'>leave a light</p>
          <h1>ฝากแสงไว้บนพระจันทร์</h1>
          <p>เขียนหนึ่งประโยค แล้วให้มันกลายเป็นจุดแสงเล็ก ๆ บนพระจันทร์ดวงเดียวกัน</p>
          <button className='primary-action' onClick={() => setComposerOpen(true)} type='button'>
            ฝากรอยของคุณ
          </button>
        </div>

        <aside className='whisper-panel' aria-live='polite'>
          <span className='panel-kicker'>ข้อความจากแสงนี้</span>
          <blockquote>{activeMark.message}</blockquote>
          <div className='panel-meta'>
            <span>{activeMark.mood.label}</span>
            <span>{activeMark.time}</span>
          </div>
        </aside>

        <div className='moon-stats'>
          <strong>{marks.length}</strong>
          <span>รอยแสงบนพระจันทร์คืนนี้</span>
        </div>

        <div className='mood-ribbon' aria-label='Mood summary'>
          {moodCounts.map((mood) => (
            <span key={mood.id} style={{ '--light': mood.color }}>
              {mood.label} {mood.count}
            </span>
          ))}
        </div>
      </section>

      {composerOpen && (
        <div className='modal-layer' role='presentation'>
          <form className='composer-card' onSubmit={leaveLight}>
            <button className='close-button' onClick={() => setComposerOpen(false)} type='button'>
              ปิด
            </button>
            <p className='eyebrow'>the whisper</p>
            <h2>คืนนี้อยากฝากอะไรไว้?</h2>

            <div className='mood-picker'>
              {moods.map((mood) => (
                <button
                  className={selectedMood.id === mood.id ? 'mood-chip active' : 'mood-chip'}
                  key={mood.id}
                  onClick={() => setSelectedMood(mood)}
                  style={{ '--light': mood.color, '--glow': mood.glow }}
                  type='button'
                >
                  <span />
                  {mood.label}
                </button>
              ))}
            </div>

            <label className='message-field'>
              <span>เขียน 1 ประโยค</span>
              <textarea
                maxLength='90'
                onChange={(event) => {
                  setMessage(event.target.value);
                  setFormError('');
                }}
                placeholder='เช่น วันนี้เหนื่อย แต่ยังอยากสว่างได้อีกนิด'
                rows='4'
                value={message}
              />
            </label>

            <div className='composer-footer'>
              <span>{message.length}/90</span>
              <button className='submit-light' type='submit'>
                ฝากไว้บนพระจันทร์
              </button>
            </div>
            {formError && <p className='form-error'>{formError}</p>}
          </form>
        </div>
      )}

      <StoryShareDock mark={storyMark} moonImage={moonFull} />
    </main>
  );
}

export default App;
