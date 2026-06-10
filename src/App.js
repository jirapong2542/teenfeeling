import React, { useMemo, useState } from 'react';
import './App.css';
import moonFull from './1.jpg';

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

function getInitialMarks() {
  try {
    const storedMarks = window.localStorage.getItem(STORAGE_KEY);
    return storedMarks ? JSON.parse(storedMarks) : seedMarks;
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  let currentY = y;

  words.forEach((word) => {
    const testLine = line + word;
    const metrics = context.measureText(testLine);

    if (metrics.width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
      return;
    }

    line = testLine;
  });

  context.fillText(line, x, currentY);
  return currentY + lineHeight;
}

async function createStoryBlob(mark) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext('2d');
  const image = await loadImage(moonFull);

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#020202');
  gradient.addColorStop(0.56, '#0a0a0a');
  gradient.addColorStop(1, '#000000');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let index = 0; index < 120; index += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.72;
    context.fillRect(x, y, 1, 1);
  }

  const moonSize = 850;
  const moonX = (canvas.width - moonSize) / 2;
  const moonY = 260;
  const cropSize = Math.min(image.width, image.height) * 0.66;
  const cropX = (image.width - cropSize) / 2;
  const cropY = (image.height - cropSize) / 2;

  context.save();
  context.beginPath();
  context.arc(canvas.width / 2, moonY + moonSize / 2, moonSize / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, cropX, cropY, cropSize, cropSize, moonX, moonY, moonSize, moonSize);
  context.restore();

  const lightX = moonX + (mark.x / 100) * moonSize;
  const lightY = moonY + (mark.y / 100) * moonSize;
  context.shadowColor = mark.mood.color;
  context.shadowBlur = 36;
  context.fillStyle = mark.mood.color;
  context.beginPath();
  context.arc(lightX, lightY, 12, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.textAlign = 'center';
  context.fillStyle = '#f8f4ea';
  context.font = '44px Segoe UI, sans-serif';
  const nextY = wrapText(context, `"${mark.message}"`, canvas.width / 2, 1280, 820, 68);

  context.fillStyle = '#bdb7aa';
  context.font = '26px Segoe UI, sans-serif';
  context.fillText(`${mark.mood.label} / ฝากไว้บนพระจันทร์`, canvas.width / 2, nextY + 34);

  context.fillStyle = '#f8f4ea';
  context.font = '30px Segoe UI, sans-serif';
  context.fillText('@t__n_f__ling', canvas.width / 2, 1740);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

function App() {
  const [marks, setMarks] = useState(getInitialMarks);
  const [selectedMood, setSelectedMood] = useState(moods[0]);
  const [message, setMessage] = useState('');
  const [activeMark, setActiveMark] = useState(seedMarks[0]);
  const [storyMark, setStoryMark] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [shareStatus, setShareStatus] = useState('');

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
    setShareStatus('แสงของคุณถูกฝากไว้แล้ว');
  };

  const downloadStory = async (mark) => {
    const blob = await createStoryBlob(mark);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moon-light-${mark.id}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareStory = async () => {
    if (!storyMark) {
      return;
    }

    const blob = await createStoryBlob(storyMark);
    const file = new File([blob], `moon-light-${storyMark.id}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'ฝากแสงไว้บนพระจันทร์',
        text: 'ฝากรอยเล็ก ๆ ไว้บนพระจันทร์ดวงเดียวกัน',
      });
      setShareStatus('เปิดหน้าต่างแชร์แล้ว');
      return;
    }

    await downloadStory(storyMark);
    setShareStatus('เครื่องนี้แชร์ตรงไม่ได้ เลยดาวน์โหลดภาพให้แทน');
  };

  return (
    <main className='app-shell'>
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
                  setShareStatus('');
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
          <p>
            เขียนหนึ่งประโยค แล้วให้มันกลายเป็นจุดแสงเล็ก ๆ บนพระจันทร์ดวงเดียวกัน
          </p>
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

      {storyMark && (
        <div className='story-dock' aria-live='polite'>
          <div className='story-preview'>
            <img src={moonFull} alt='' />
            <span
              className='story-light'
              style={{
                '--x': `${storyMark.x}%`,
                '--y': `${storyMark.y}%`,
                '--light': storyMark.mood.color,
              }}
            />
            <div className='story-copy'>
              <p>"{storyMark.message}"</p>
              <span>ฝากไว้บนพระจันทร์ / @t__n_f__ling</span>
            </div>
          </div>

          <div className='story-actions'>
            <p>{shareStatus || 'สร้างภาพ 9:16 สำหรับ Instagram Story'}</p>
            <button onClick={shareStory} type='button'>
              แชร์
            </button>
            <button onClick={() => downloadStory(storyMark)} type='button'>
              ดาวน์โหลด
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
