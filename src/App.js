import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import moonFull from './1.jpg';
import DevelopmentNotice from './DevelopmentNotice';
import MoonWall from './MoonWall';
import StoryShareDock from './StoryShareDock';
import TonightMoonPage from './TonightMoonPage';
import { createMoonMark, fetchMoonMarks, fetchTonightMoonCount, getTonightStartIso } from './moonMarksApi';
import { validateMoonMessage } from './moderation';
import { isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'leave-a-light-marks';
const CLOUD_REFRESH_INTERVAL = 30000;
const TONIGHT_MOON_PATH = '/tonight-moon';

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

function filterTonightMarks(marks) {
  const tonightStart = getTonightStartIso();

  return marks.filter((mark) => mark.createdAt && mark.createdAt >= tonightStart);
}

function getInitialMarks() {
  if (isSupabaseConfigured) {
    return [];
  }

  try {
    const storedMarks = window.localStorage.getItem(STORAGE_KEY);
    const parsedMarks = storedMarks ? JSON.parse(storedMarks).map(normalizeMark) : [];
    const tonightMarks = filterTonightMarks(parsedMarks);

    return tonightMarks.length > 0 ? tonightMarks : seedMarks;
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

function getNextResetDate(referenceDate = new Date()) {
  const nextReset = new Date(referenceDate);
  nextReset.setHours(18, 0, 0, 0);

  if (referenceDate >= nextReset) {
    nextReset.setDate(nextReset.getDate() + 1);
  }

  return nextReset;
}

function getResetCountdownText(referenceDate = new Date()) {
  const diffMs = Math.max(0, getNextResetDate(referenceDate).getTime() - referenceDate.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')} ชม. ${String(minutes).padStart(2, '0')} นาที ${String(seconds).padStart(2, '0')} วิ`;
}

function createMoonPosition() {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * 34;

  return {
    x: Math.round((50 + Math.cos(angle) * radius) * 10) / 10,
    y: Math.round((50 + Math.sin(angle) * radius) * 10) / 10,
  };
}

function getCurrentPath() {
  return window.location.pathname === TONIGHT_MOON_PATH ? TONIGHT_MOON_PATH : '/';
}

function App() {
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [marks, setMarks] = useState(getInitialMarks);
  const [selectedMood, setSelectedMood] = useState(moods[0]);
  const [message, setMessage] = useState('');
  const [activeMark, setActiveMark] = useState(() => getInitialMarks()[0] || null);
  const [storyMark, setStoryMark] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [dataStatus, setDataStatus] = useState(isSupabaseConfigured ? 'กำลังโหลดแสงจาก cloud...' : 'โหมดทดลอง: เก็บข้อมูลในเครื่องนี้');
  const [tonightCount, setTonightCount] = useState(marks.length);
  const [resetCountdownText, setResetCountdownText] = useState(() => getResetCountdownText());

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMarks(shouldFocusLatest = false) {
      if (!isSupabaseConfigured) {
        return;
      }

      const [result, countResult] = await Promise.all([
        fetchMoonMarks(moods),
        fetchTonightMoonCount(),
      ]);

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setDataStatus('เชื่อม Supabase ไม่สำเร็จ ตอนนี้ใช้ข้อมูลในเครื่องนี้ก่อน');
        return;
      }

      if (!countResult.error && typeof countResult.count === 'number') {
        setTonightCount(countResult.count);
      } else {
        setTonightCount(result.marks.length);
      }

      setMarks(result.marks);

      if (result.marks.length > 0) {
        setActiveMark((currentMark) => {
          if (!shouldFocusLatest && currentMark && result.marks.some((mark) => mark.id === currentMark.id)) {
            return currentMark;
          }

          return result.marks[0];
        });
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.marks));
        setDataStatus('เชื่อมข้อมูลจริงแล้ว ทุกคนจะเห็นแสงเดียวกัน');
        return;
      }

      setActiveMark(null);
      setStoryMark(null);
      window.localStorage.removeItem(STORAGE_KEY);
      setDataStatus('เชื่อมข้อมูลจริงแล้ว ยังไม่มีใครฝากแสงบนพระจันทร์');
    }

    loadMarks(true);
    const refreshTimer = window.setInterval(() => {
      loadMarks(false);
    }, CLOUD_REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setResetCountdownText(getResetCountdownText());
    }, 1000);

    return () => {
      window.clearInterval(countdownTimer);
    };
  }, []);

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

  const selectMark = (mark) => {
    setActiveMark(mark);
    setStoryMark(mark);
  };

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(getCurrentPath());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const leaveLight = async (event) => {
    event.preventDefault();
    if (isSaving) {
      return;
    }

    const moderation = validateMoonMessage(message);

    if (!moderation.isValid) {
      setFormError(moderation.error);
      return;
    }

    const nextMark = {
      id: Date.now().toString(),
      ...createMoonPosition(),
      mood: selectedMood,
      message: moderation.message,
      time: getTime(),
      createdAt: new Date().toISOString(),
    };

    setIsSaving(true);

    try {
      const result = await createMoonMark(nextMark, moods);
      const savedMark = result.mark;
      const nextMarks = [savedMark, ...marks].slice(0, 36);

      saveMarks(nextMarks);
      setTonightCount((currentCount) => (result.error ? nextMarks.length : Math.max(currentCount + 1, nextMarks.length)));
      setActiveMark(savedMark);
      setStoryMark(savedMark);
      setComposerOpen(false);
      setMessage('');
      setFormError('');
      setDataStatus(result.error ? 'บันทึกบน cloud ไม่สำเร็จ เลยเก็บไว้ในเครื่องนี้ก่อน' : 'บันทึกขึ้น cloud แล้ว');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className='app-shell'>
      <DevelopmentNotice />

      {currentPath === TONIGHT_MOON_PATH ? (
        <TonightMoonPage
          moodCounts={moodCounts}
          onNavigateHome={() => navigateTo('/')}
          resetCountdownText={resetCountdownText}
          tonightCount={tonightCount}
        />
      ) : (
        <>

      <section className='moon-room' aria-label='Leave a light on the moon'>
        <div className='star-field' />

        <nav className='topbar' aria-label='Main navigation'>
          <a className='brand' href='https://www.instagram.com/t__n_f__ling/'>
            t__n_f__ling
          </a>
          <span className='data-status'>{dataStatus}</span>
          <span className='reset-countdown'>รอบใหม่ใน {resetCountdownText}</span>
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
                className={activeMark?.id === mark.id ? 'moon-light active' : 'moon-light'}
                key={mark.id}
                onClick={() => {
                  selectMark(mark);
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
          <button className='secondary-action' onClick={() => navigateTo(TONIGHT_MOON_PATH)} type='button'>
            ดูพระจันทร์คืนนี้
          </button>
        </div>

        <aside className='whisper-panel' aria-live='polite'>
          <span className='panel-kicker'>ข้อความจากแสงนี้</span>
          <blockquote>{activeMark ? activeMark.message : 'ยังไม่มีข้อความ ฝากแสงแรกไว้บนพระจันทร์ได้เลย'}</blockquote>
          <div className='panel-meta'>
            <span>{activeMark ? activeMark.mood.label : 'แสงแรก'}</span>
            <span>{activeMark ? activeMark.time : '--:--'}</span>
          </div>
        </aside>

        <div className='moon-stats'>
          <strong>{tonightCount}</strong>
          <span>รอยแสงบนพระจันทร์คืนนี้</span>
          {isSupabaseConfigured && <small>อัปเดตจาก Supabase ทุก 30 วินาที</small>}
        </div>

        <div className='mood-ribbon' aria-label='Mood summary'>
          {moodCounts.map((mood) => (
            <span key={mood.id} style={{ '--light': mood.color }}>
              {mood.label} {mood.count}
            </span>
          ))}
        </div>
      </section>

      <MoonWall
        marks={marks}
        moodCounts={moodCounts}
        onOpenComposer={() => setComposerOpen(true)}
        onSelectMark={selectMark}
      />
        </>
      )}

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
              <small className='moderation-note'>
                ระบบจะกันลิงก์ ข้อมูลติดต่อ คำหยาบ และข้อความสแปมก่อนฝากขึ้นพระจันทร์
              </small>
            </label>

            <div className='composer-footer'>
              <span>{message.length}/90</span>
              <button className='submit-light' disabled={isSaving} type='submit'>
                {isSaving ? 'กำลังฝากแสง...' : 'ฝากไว้บนพระจันทร์'}
              </button>
            </div>
            {formError && <p className='form-error'>{formError}</p>}
          </form>
        </div>
      )}

      {currentPath !== TONIGHT_MOON_PATH && (
        <StoryShareDock mark={storyMark} moonImage={moonFull} onClose={() => setStoryMark(null)} />
      )}
    </main>
  );
}

export default App;
